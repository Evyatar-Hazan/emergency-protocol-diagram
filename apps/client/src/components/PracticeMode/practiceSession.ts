import type { EvidenceRating } from '../../assessment/types';

export const PRACTICE_SESSION_STORAGE_KEY = 'epd.practice-session.v1';
export const PRACTICE_SESSION_SCHEMA_VERSION = 1 as const;

export interface PracticeChoice {
  id: string;
  label: string;
  rating: Exclude<EvidenceRating, 'not_assessed'>;
  criticalErrorCandidateObserved: boolean;
}

export interface PracticeStep {
  itemId: string;
  stageLabel: string;
  revealedInformation: string;
  choices: readonly PracticeChoice[];
}

export interface PracticeResponse {
  itemId: string;
  choiceId: string;
  rating: Exclude<EvidenceRating, 'not_assessed'>;
  criticalErrorCandidateObserved: boolean;
}

export interface PracticeSession {
  schemaVersion: typeof PRACTICE_SESSION_SCHEMA_VERSION;
  scenarioId: 'SCN-01';
  currentStep: number;
  completed: boolean;
  responses: readonly PracticeResponse[];
}

export const practiceSteps = [
  {
    itemId: 'A60-001',
    stageLabel: 'תחנות המסלול',
    revealedInformation:
      'נתוני בדיקה: מסלול התרגול כולל תחנות יציאה, הגעה, הערכת זירה ושער הצגה ראשונית. בשלב זה לא מוצגים ממצאי מטופל או הנחיות טיפול.',
    choices: [
      {
        id: 'route-complete',
        label: 'יציאה ← הגעה ← הערכת זירה ← שער הצגה ראשונית',
        rating: 'demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'route-partial',
        label: 'יציאה ← הערכת זירה ← שער הצגה ראשונית',
        rating: 'partially_demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'route-skip',
        label: 'מעבר ישיר לענף הסיום בלי שערי פתיחה',
        rating: 'not_demonstrated',
        criticalErrorCandidateObserved: true,
      },
    ],
  },
  {
    itemId: 'A60-002',
    stageLabel: 'שערי הערכה',
    revealedInformation:
      'מידע חדש — TEST DATA: לאחר שער ההצגה מופיעות תחנות AVPU ובדיקת נשימה. השמות משמשים כאן לבדיקת ניווט לימודית בלבד.',
    choices: [
      {
        id: 'gates-complete',
        label: 'הערכת זירה ← שער הצגה ראשונית ← AVPU ← בדיקת נשימה',
        rating: 'demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'gates-partial',
        label: 'AVPU ← בדיקת נשימה בלבד',
        rating: 'partially_demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'gates-skip',
        label: 'דילוג על שערי ההערכה ומעבר לתחנת ציוד',
        rating: 'not_demonstrated',
        criticalErrorCandidateObserved: true,
      },
    ],
  },
  {
    itemId: 'A60-003',
    stageLabel: 'נקודות מעבר',
    revealedInformation:
      'מידע חדש — pending review: מסמך הייחוס הטכני מחבר את שערי ההערכה לענף החייאה ולנקודת חיבור ציוד. החיבור אינו אישור קליני או הוראת פעולה.',
    choices: [
      {
        id: 'transition-complete',
        label: 'זיהוי המעבר לענף ההחייאה ולאחריו נקודת חיבור הציוד',
        rating: 'demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'transition-partial',
        label: 'זיהוי ענף ההחייאה בלי נקודת החיבור הבאה',
        rating: 'partially_demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'transition-claim',
        label: 'פירוש המסלול כאישור לביצוע בזמן אירוע חי',
        rating: 'not_demonstrated',
        criticalErrorCandidateObserved: true,
      },
    ],
  },
  {
    itemId: 'A60-004',
    stageLabel: 'גבול השימוש',
    revealedInformation:
      'מידע חדש: זוהי סימולציית TEST DATA המבוססת על מחוון זמני שממתין לסקירת מדריך. היא אינה בודקת כשירות מעשית ואינה מיועדת לאירוע חי.',
    choices: [
      {
        id: 'boundary-complete',
        label: 'כלי למידה ורענון בלבד; אינו הסמכה, אישור קליני או הוכחת כשירות',
        rating: 'demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'boundary-partial',
        label: 'כלי רענון, בלי לציין במפורש את גבולות ההסמכה והשימוש החי',
        rating: 'partially_demonstrated',
        criticalErrorCandidateObserved: false,
      },
      {
        id: 'boundary-live',
        label: 'מערכת שמאשרת החלטות בזמן אירוע חי',
        rating: 'not_demonstrated',
        criticalErrorCandidateObserved: true,
      },
    ],
  },
] as const satisfies readonly PracticeStep[];

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const responseForStep = (response: PracticeResponse, step: PracticeStep) => {
  const choice = step.choices.find((candidate) => candidate.id === response.choiceId);
  return Boolean(
    choice &&
      response.itemId === step.itemId &&
      response.rating === choice.rating &&
      response.criticalErrorCandidateObserved === choice.criticalErrorCandidateObserved,
  );
};

function isPracticeSession(value: unknown): value is PracticeSession {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const session = value as Record<string, unknown>;
  if (
    !exactKeys(session, ['schemaVersion', 'scenarioId', 'currentStep', 'completed', 'responses']) ||
    session.schemaVersion !== PRACTICE_SESSION_SCHEMA_VERSION ||
    session.scenarioId !== 'SCN-01' ||
    typeof session.currentStep !== 'number' ||
    !Number.isInteger(session.currentStep) ||
    session.currentStep < 0 ||
    session.currentStep >= practiceSteps.length ||
    typeof session.completed !== 'boolean' ||
    !Array.isArray(session.responses)
  ) {
    return false;
  }

  const seenItems = new Set<string>();
  const responsesAreValid = session.responses.every((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const response = value as Record<string, unknown>;
    if (
      !exactKeys(response, [
        'itemId',
        'choiceId',
        'rating',
        'criticalErrorCandidateObserved',
      ]) ||
      typeof response.itemId !== 'string' ||
      typeof response.choiceId !== 'string' ||
      typeof response.rating !== 'string' ||
      typeof response.criticalErrorCandidateObserved !== 'boolean' ||
      seenItems.has(response.itemId)
    ) {
      return false;
    }
    const step = practiceSteps.find((candidate) => candidate.itemId === response.itemId);
    if (!step || !responseForStep(response as unknown as PracticeResponse, step)) return false;
    seenItems.add(response.itemId);
    return true;
  });

  if (!responsesAreValid) return false;
  if (session.completed && session.responses.length !== practiceSteps.length) return false;
  const currentStep = session.currentStep;
  const completed = session.completed;
  return session.responses.every((response) => {
    const stepIndex = practiceSteps.findIndex((step) => step.itemId === response.itemId);
    return stepIndex <= currentStep || completed;
  });
}

export function createPracticeSession(): PracticeSession {
  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    scenarioId: 'SCN-01',
    currentStep: 0,
    completed: false,
    responses: [],
  };
}

export function selectPracticeChoice(
  session: PracticeSession,
  choiceId: string,
): PracticeSession {
  if (session.completed) return session;
  const step = practiceSteps[session.currentStep];
  const choice = step.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return session;
  const response: PracticeResponse = {
    itemId: step.itemId,
    choiceId: choice.id,
    rating: choice.rating,
    criticalErrorCandidateObserved: choice.criticalErrorCandidateObserved,
  };
  return {
    ...session,
    responses: [...session.responses.filter((item) => item.itemId !== step.itemId), response],
  };
}

export function advancePracticeSession(session: PracticeSession): PracticeSession {
  if (session.completed) return session;
  const step = practiceSteps[session.currentStep];
  if (!session.responses.some((response) => response.itemId === step.itemId)) return session;
  if (session.currentStep === practiceSteps.length - 1) return { ...session, completed: true };
  return { ...session, currentStep: session.currentStep + 1 };
}

export function goBackInPracticeSession(session: PracticeSession): PracticeSession {
  if (session.completed) {
    return { ...session, completed: false, currentStep: practiceSteps.length - 1 };
  }
  if (session.currentStep === 0) return session;
  return { ...session, currentStep: session.currentStep - 1 };
}

export function loadPracticeSession(storage: Storage): PracticeSession | null {
  const serialized = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
  if (!serialized) return null;
  try {
    const parsed: unknown = JSON.parse(serialized);
    return isPracticeSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePracticeSession(storage: Storage, session: PracticeSession): void {
  storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearPracticeSession(storage: Storage): void {
  storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
}
