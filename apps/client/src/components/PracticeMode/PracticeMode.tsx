import { use, useMemo, useState } from 'react';
import { evaluateLearningAssessment } from '../../assessment/engine';
import { loadScn01LearningRubric } from '../../assessment/loadScn01Rubric';
import { saveAssessmentAttempt } from '../../assessment/localStorage';
import type { LearningAssessmentRubric } from '../../assessment/types';
import { SafetyScopeNotice } from '../safety/SafetyScopeNotice';
import {
  advancePracticeSession,
  clearPracticeSession,
  createPracticeSession,
  goBackInPracticeSession,
  loadPracticeSession,
  practiceSteps,
  savePracticeSession,
  selectPracticeChoice,
  type PracticeSession,
} from './practiceSession';

const progressBandLabels = {
  needs_review: 'כדאי לחזור על המסלול',
  developing: 'הבנה בתהליך',
  practice_evidence_observed: 'נאספו ראיות תרגול',
  not_scored: 'משוב ללא מדד',
} as const;

const persistedSession = () =>
  typeof window === 'undefined' ? null : loadPracticeSession(window.localStorage);

const scrollToTop = () => window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));

interface PracticeModeProps {
  onExit: () => void;
}

export function PracticeMode({ onExit }: PracticeModeProps) {
  const scn01LearningRubric = use(loadScn01LearningRubric());
  if (!scn01LearningRubric) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="surface-card-strong rounded-4xl p-6 text-center" role="alert">
          <h2 className="font-display text-2xl font-extrabold text-clinical-ink">התרגול אינו זמין כרגע</h2>
          <p className="mt-3 text-sm leading-7 text-clinical-muted">
            המחוון הזמני לא עבר אימות, ולכן התרגול נעצר בלי לחשב משוב או לשנות נתונים שמורים.
          </p>
          <button type="button" onClick={onExit} className="mt-5 rounded-2xl bg-clinical-blue px-5 py-3 font-bold text-white">
            חזרה למסלול הלמידה
          </button>
        </section>
        <SafetyScopeNotice id="practice-rubric-error-safety" className="mt-5" />
      </main>
    );
  }
  return <LoadedPracticeMode onExit={onExit} rubric={scn01LearningRubric} />;
}

function LoadedPracticeMode({
  onExit,
  rubric: scn01LearningRubric,
}: PracticeModeProps & { rubric: LearningAssessmentRubric }) {
  const [restorableSession, setRestorableSession] = useState<PracticeSession | null>(persistedSession);
  const [session, setSession] = useState<PracticeSession | null>(null);

  const assessment = useMemo(() => {
    if (!session) return null;
    return evaluateLearningAssessment(scn01LearningRubric, {
      rubric_id: scn01LearningRubric.rubric_id,
      evidence: session.responses.map((response) => ({
        item_id: response.itemId,
        rating: response.rating,
        critical_error_candidate_observed: response.criticalErrorCandidateObserved,
      })),
    });
  }, [scn01LearningRubric, session]);

  const persist = (nextSession: PracticeSession) => {
    setSession(nextSession);
    savePracticeSession(window.localStorage, nextSession);
  };

  const startNew = () => {
    clearPracticeSession(window.localStorage);
    setRestorableSession(null);
    persist(createPracticeSession());
    scrollToTop();
  };

  const reset = () => {
    clearPracticeSession(window.localStorage);
    setRestorableSession(null);
    setSession(null);
    scrollToTop();
  };

  if (!session) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8" aria-labelledby="practice-title">
        <section className="surface-card-strong clinical-panel rise-in overflow-hidden rounded-4xl">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-8 lg:p-10">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="clinical-kicker">מצב תרגול מדורג</span>
                <span className="rounded-full border border-clinical-amber/35 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">
                  TEST DATA
                </span>
                <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-bold text-slate-600">
                  pending instructor review
                </span>
              </div>
              <h2 id="practice-title" className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-clinical-ink sm:text-5xl">
                בנו את רצף החשיבה, תחנה אחר תחנה
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-clinical-muted sm:text-lg">
                סימולציה טכנית של SCN-01: בכל שלב נחשף רק המידע שנחוץ לבחירה הנוכחית. המשוב מגיע ממחוון זמני ואינו קובע כשירות קלינית.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ['01', 'מידע מדורג', 'כל תחנה נפתחת רק אחרי בחירה'],
                  ['02', 'משוב לימודי', 'ללא טענת הסמכה או אישור'],
                  ['03', 'שמירה מקומית', 'מזהים בלבד, בלי נתוני מטופל'],
                ].map(([number, title, description]) => (
                  <div key={number} className="rounded-3xl border border-slate-200/80 bg-white/65 p-4">
                    <div className="font-display text-2xl font-extrabold text-clinical-blue">{number}</div>
                    <h3 className="mt-3 font-bold text-clinical-ink">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-clinical-muted">{description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {restorableSession ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSession(restorableSession);
                        setRestorableSession(null);
                        scrollToTop();
                      }}
                      className="rounded-2xl bg-clinical-blue px-6 py-3.5 font-bold text-white shadow-soft transition hover:bg-clinical-deep"
                    >
                      שחזור תרגול שמור
                    </button>
                    <button
                      type="button"
                      onClick={startNew}
                      className="rounded-2xl border border-slate-300 bg-white/80 px-6 py-3.5 font-bold text-clinical-ink transition hover:bg-white"
                    >
                      התחלה מחדש
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startNew}
                    className="rounded-2xl bg-clinical-blue px-6 py-3.5 font-bold text-white shadow-soft transition hover:bg-clinical-deep"
                  >
                    התחלת תרגול TEST DATA
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExit}
                  className="rounded-2xl border border-slate-300 bg-transparent px-6 py-3.5 font-bold text-clinical-ink transition hover:bg-white/70"
                >
                  חזרה למסלול הלמידה
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-[linear-gradient(145deg,rgba(14,75,118,0.96),rgba(22,32,44,0.97))] p-5 text-white sm:p-8 lg:border-r lg:border-t-0 lg:p-10">
              <p className="text-xs font-extrabold tracking-[0.18em] text-white/60">SCN-01 · TECHNICAL PRACTICE</p>
              <ol className="mt-7 space-y-5">
                {practiceSteps.map((step, index) => (
                  <li key={step.itemId} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-display text-sm font-extrabold">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold">{step.stageLabel}</div>
                      <div className="mt-1 text-sm text-white/60">המידע נעול עד להשלמת התחנה הקודמת</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        <SafetyScopeNotice id="practice-entry-safety" className="mt-5" />
      </main>
    );
  }

  const currentStep = practiceSteps[session.currentStep];
  const currentResponse = session.responses.find((response) => response.itemId === currentStep.itemId);
  const currentResult = assessment?.item_results.find((item) => item.item_id === currentStep.itemId);

  if (session.completed && assessment) {
    return (
      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8" aria-labelledby="practice-summary-title">
        <section className="surface-card-strong rise-in rounded-4xl p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="clinical-kicker">סיכום תרגול</span>
            <span className="rounded-full border border-clinical-amber/35 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-900">TEST DATA</span>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-3xl bg-clinical-header p-6 text-white">
              <p className="text-sm font-bold text-white/65">מדד תרגול זמני</p>
              <div className="mt-3 font-display text-6xl font-extrabold">
                {assessment.provisional_score.percent ?? '—'}
                {assessment.provisional_score.percent !== null && <span className="text-2xl text-white/60">%</span>}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/75">
                {progressBandLabels[assessment.provisional_score.band]}
              </p>
            </div>
            <div>
              <h2 id="practice-summary-title" className="font-display text-3xl font-extrabold text-clinical-ink">
                התרגול הושלם — המשוב עדיין pending
              </h2>
              <ul className="mt-4 space-y-3" aria-label="משוב מסכם">
                {assessment.overall_feedback.map((feedback) => (
                  <li key={feedback} className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm leading-7 text-clinical-muted">
                    {feedback}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {assessment.item_results.map((item, index) => (
              <article key={item.item_id} className="rounded-3xl border border-slate-200/80 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-clinical-ink">{practiceSteps[index].stageLabel}</h3>
                  <span className="text-xs font-bold text-clinical-muted">{item.competency_id}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-clinical-muted">{item.feedback.join(' ')}</p>
              </article>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => persist(goBackInPracticeSession(session))}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-clinical-ink transition hover:bg-slate-50"
            >
              חזרה לבחירות
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl bg-clinical-blue px-5 py-3 font-bold text-white transition hover:bg-clinical-deep"
            >
              איפוס ותרגול מחדש
            </button>
            <button
              type="button"
              onClick={onExit}
              className="rounded-2xl border border-slate-300 bg-transparent px-5 py-3 font-bold text-clinical-ink transition hover:bg-white/70"
            >
              חזרה למסלול הלמידה
            </button>
          </div>
        </section>
        <SafetyScopeNotice id="practice-summary-safety" className="mt-5" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8" aria-labelledby="practice-step-title">
      <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="surface-card h-fit rounded-4xl p-4 sm:p-5" aria-label="התקדמות בתרגול">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-extrabold tracking-[0.16em] text-clinical-muted">SCN-01</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-extrabold text-amber-900">TEST DATA</span>
          </div>
          <ol className="mt-5 space-y-2">
            {practiceSteps.map((step, index) => {
              const isCurrent = index === session.currentStep;
              const isRevealed = index <= session.currentStep;
              return (
                <li
                  key={step.itemId}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    isCurrent
                      ? 'border-clinical-blue/35 bg-blue-50 text-clinical-deep'
                      : isRevealed
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                        : 'border-slate-200 bg-white/55 text-slate-400'
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 text-xs font-extrabold">
                    {isRevealed ? index + 1 : '•'}
                  </span>
                  <span className="text-sm font-bold">{isRevealed ? step.stageLabel : 'מידע נעול'}</span>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={reset}
            className="mt-5 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800 transition hover:bg-red-100"
          >
            איפוס התרגול השמור
          </button>
          <button
            type="button"
            onClick={onExit}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/70 px-4 py-2.5 text-sm font-bold text-clinical-ink transition hover:bg-white"
          >
            חזרה למסלול הלמידה
          </button>
        </aside>

        <section className="surface-card-strong rise-in rounded-4xl p-5 sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="clinical-kicker">שלב {session.currentStep + 1} מתוך {practiceSteps.length}</span>
            <span className="text-xs font-bold text-clinical-muted">{currentStep.itemId} · pending</span>
          </div>
          <h2 id="practice-step-title" className="mt-5 font-display text-3xl font-extrabold text-clinical-ink">
            {currentStep.stageLabel}
          </h2>
          <div className="mt-5 rounded-3xl border-r-4 border-clinical-amber bg-amber-50/80 p-4 text-sm leading-7 text-amber-950 sm:p-5">
            <strong className="block text-xs tracking-[0.12em] text-amber-800">מידע שנחשף עכשיו</strong>
            <p className="mt-2">{currentStep.revealedInformation}</p>
          </div>

          <fieldset className="mt-7">
            <legend className="font-display text-xl font-extrabold text-clinical-ink">
              {scn01LearningRubric.items[session.currentStep].prompt}
            </legend>
            <div className="mt-4 space-y-3">
              {currentStep.choices.map((choice) => {
                const selected = currentResponse?.choiceId === choice.id;
                return (
                  <label
                    key={choice.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-3xl border p-4 transition ${
                      selected
                        ? 'border-clinical-blue bg-blue-50/80 shadow-soft'
                        : 'border-slate-200 bg-white/70 hover:border-clinical-blue/35 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentStep.itemId}
                      value={choice.id}
                      checked={selected}
                      onChange={() => persist(selectPracticeChoice(session, choice.id))}
                      className="mt-1 h-5 w-5 accent-clinical-blue"
                    />
                    <span className="text-sm font-semibold leading-7 text-clinical-ink">{choice.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {currentResponse && currentResult && (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950" role="status">
              <div className="text-xs font-extrabold tracking-[0.12em] text-emerald-800">משוב לימודי זמני</div>
              <p className="mt-2 text-sm leading-7">{currentResult.feedback.join(' ')}</p>
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => persist(goBackInPracticeSession(session))}
              disabled={session.currentStep === 0}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-clinical-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              חזרה לשלב הקודם
            </button>
            <button
              type="button"
              disabled={!currentResponse}
              onClick={() => {
                const nextSession = advancePracticeSession(session);
                if (nextSession.completed && assessment) {
                  const finalAssessment = evaluateLearningAssessment(scn01LearningRubric, {
                    rubric_id: scn01LearningRubric.rubric_id,
                    evidence: nextSession.responses.map((response) => ({
                      item_id: response.itemId,
                      rating: response.rating,
                      critical_error_candidate_observed: response.criticalErrorCandidateObserved,
                    })),
                  });
                  saveAssessmentAttempt(window.localStorage, finalAssessment);
                }
                persist(nextSession);
              }}
              className="rounded-2xl bg-clinical-blue px-6 py-3 font-bold text-white shadow-soft transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {session.currentStep === practiceSteps.length - 1 ? 'סיום והצגת משוב' : 'חשיפת השלב הבא'}
            </button>
          </div>
        </section>
      </div>
      <SafetyScopeNotice id="practice-active-safety" className="mt-5" />
    </main>
  );
}
