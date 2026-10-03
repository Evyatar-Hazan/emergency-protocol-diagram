import { validateRubric } from './contract';
import type {
  AssessmentSubmission,
  CompetencyAssessmentResult,
  EvidenceRating,
  ItemAssessmentResult,
  LearningAssessmentResult,
  LearningAssessmentRubric,
  LearningProgressBand,
  RubricItem,
} from './types';

const ratingPoints: Record<EvidenceRating, number> = {
  not_assessed: 0,
  not_demonstrated: 0,
  partially_demonstrated: 1,
  demonstrated: 2,
};

function toPercent(earnedPoints: number, maxPoints: number): number | null {
  return maxPoints === 0 ? null : Math.round((earnedPoints / maxPoints) * 100);
}

function toBand(percent: number | null): LearningProgressBand | 'not_scored' {
  if (percent === null) return 'not_scored';
  if (percent < 40) return 'needs_review';
  if (percent < 75) return 'developing';
  return 'practice_evidence_observed';
}

function itemFeedback(
  item: RubricItem,
  rating: EvidenceRating,
  criticalCandidateObserved: boolean,
): string[] {
  const feedback = [item.feedback[rating]];
  if (criticalCandidateObserved) feedback.push(item.feedback.critical_candidate);
  if (item.scoring_mode === 'instructor_only') {
    feedback.push('פריט זה דורש תצפית מדריך ואינו ניתן לאישור באמצעות תרגול דיגיטלי.');
  }
  return feedback;
}

function overallFeedback(
  band: LearningProgressBand | 'not_scored',
  criticalCandidateCount: number,
): string[] {
  const messages: string[] = [];
  switch (band) {
    case 'needs_review':
      messages.push('כדאי לחזור על המסלול ועל נקודות ההחלטה שסומנו לפני ניסיון נוסף.');
      break;
    case 'developing':
      messages.push('חלק מהראיות הודגמו; המשוב לפי מיומנות מצביע על הנקודות שכדאי לחזק.');
      break;
    case 'practice_evidence_observed':
      messages.push('התרגול הדיגיטלי הושלם ברמה גבוהה לפי המחוון הזמני.');
      break;
    case 'not_scored':
      messages.push('לא חושב ציון משום שהפריטים מוגדרים למשוב בלבד או לתצפית מדריך.');
      break;
  }
  if (criticalCandidateCount > 0) {
    messages.push('זוהו מועמדים לטעות קריטית; הם מיועדים לחזרה ולסקירת מדריך, לא לקביעה קלינית.');
  }
  messages.push(
    'זהו משוב לימודי זמני בלבד. הוא אינו הסמכה, אישור קליני או הוכחת כשירות מעשית.',
  );
  return messages;
}

function competencyResults(itemResults: readonly ItemAssessmentResult[]): CompetencyAssessmentResult[] {
  const totals = new Map<string, { earned: number; maximum: number }>();
  for (const result of itemResults) {
    const current = totals.get(result.competency_id) ?? { earned: 0, maximum: 0 };
    current.earned += result.earned_points;
    current.maximum += result.max_points;
    totals.set(result.competency_id, current);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([competencyId, total]) => {
      const percent = toPercent(total.earned, total.maximum);
      return {
        competency_id: competencyId,
        earned_points: total.earned,
        max_points: total.maximum,
        score_percent: percent,
        band: toBand(percent),
      };
    });
}

export class AssessmentSubmissionError extends Error {}

export function evaluateLearningAssessment(
  rubric: LearningAssessmentRubric,
  submission: AssessmentSubmission,
): LearningAssessmentResult {
  const rubricValidation = validateRubric(rubric);
  if (!rubricValidation.ok) {
    throw new AssessmentSubmissionError(`Invalid rubric: ${rubricValidation.errors.join('; ')}`);
  }
  if (submission.rubric_id !== rubric.rubric_id) {
    throw new AssessmentSubmissionError('Submission rubric_id does not match the rubric');
  }

  const evidenceByItem = new Map<string, (typeof submission.evidence)[number]>();
  const knownItemIds = new Set(rubric.items.map((item) => item.item_id));
  for (const evidence of submission.evidence) {
    if (!knownItemIds.has(evidence.item_id)) {
      throw new AssessmentSubmissionError(`Unknown assessment item: ${evidence.item_id}`);
    }
    if (evidenceByItem.has(evidence.item_id)) {
      throw new AssessmentSubmissionError(`Duplicate assessment evidence: ${evidence.item_id}`);
    }
    evidenceByItem.set(evidence.item_id, evidence);
  }

  const itemResults = rubric.items.map((item): ItemAssessmentResult => {
    const evidence = evidenceByItem.get(item.item_id);
    const rating = evidence?.rating ?? 'not_assessed';
    const criticalCandidateObserved = evidence?.critical_error_candidate_observed === true;
    if (item.scoring_mode === 'instructor_only' && rating !== 'not_assessed') {
      throw new AssessmentSubmissionError(
        `${item.item_id} requires instructor observation and cannot be digitally rated`,
      );
    }
    const scored = item.scoring_mode === 'rubric_pending';
    return {
      item_id: item.item_id,
      competency_id: item.competency_id,
      outcome_id: item.outcome_id,
      rating,
      earned_points: scored ? ratingPoints[rating] : 0,
      max_points: scored ? item.max_points : 0,
      scored,
      critical_error_candidate_observed: criticalCandidateObserved,
      feedback: itemFeedback(item, rating, criticalCandidateObserved),
    };
  });

  const earnedPoints = itemResults.reduce((total, item) => total + item.earned_points, 0);
  const maxPoints = itemResults.reduce((total, item) => total + item.max_points, 0);
  const percent = toPercent(earnedPoints, maxPoints);
  const band = toBand(percent);
  const criticalCandidateCount = itemResults.filter(
    (item) => item.critical_error_candidate_observed,
  ).length;

  return {
    schema_version: 1,
    rubric_id: rubric.rubric_id,
    rubric_version: rubric.rubric_version,
    scenario_id: rubric.scenario_id,
    claim: 'learning_feedback_only',
    provisional_score: {
      earned_points: earnedPoints,
      max_points: maxPoints,
      percent,
      band,
    },
    item_results: itemResults,
    competency_results: competencyResults(itemResults),
    overall_feedback: overallFeedback(band, criticalCandidateCount),
    critical_error_candidates_observed: criticalCandidateCount,
    needs_instructor_review:
      rubric.status === 'draft_pending_instructor_review' ||
      rubric.items.some((item) => item.review_status !== 'approved_for_stated_use'),
    certification_eligible: false,
    clinical_competence_determined: false,
  };
}
