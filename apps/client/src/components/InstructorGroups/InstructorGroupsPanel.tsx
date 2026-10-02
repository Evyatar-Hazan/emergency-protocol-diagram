import { useMemo, useState } from 'react';
import { scn01LearningRubric } from '../../assessment/scn01Rubric';
import {
  SYNTHETIC_TRAINING_GROUPS,
  assignScn01,
  buildAggregateView,
  type SyntheticTrainingGroup,
} from '../../instructor/instructorGroups';

export function InstructorGroupsPanel({ onOpenPractice }: { onOpenPractice: () => void }) {
  const [groups, setGroups] = useState<SyntheticTrainingGroup[]>(() =>
    SYNTHETIC_TRAINING_GROUPS.map((group) => ({ ...group })),
  );
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0].id);
  const [announcement, setAnnouncement] = useState('');
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const aggregate = useMemo(() => buildAggregateView(selectedGroup), [selectedGroup]);

  const assignExercise = () => {
    setGroups((current) =>
      current.map((group) => (group.id === selectedGroup.id ? assignScn01(group) : group)),
    );
    setAnnouncement(`SCN-01 הוקצה ל${selectedGroup.name} בסביבת הדגמה מקומית בלבד.`);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-10" dir="rtl">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[#fffdf8] shadow-strong">
        <header className="relative overflow-hidden bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 left-0 w-2 bg-clinical-teal" aria-hidden="true" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] text-white/75">
                SYNTHETIC COHORT LAB · JARVIS 62
              </span>
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-5xl">שולחן מדריך</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                הקצאת תרגול לקבוצות סינתטיות וצפייה בתוצאות מצרפיות בלבד. אין כאן חשבונות אמיתיים, פרטי לומדים או אישור הכשרה.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-300/25 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-100">
              סביבת בדיקה מקומית · המדידה החיה כבויה
            </div>
          </div>
        </header>

        <div className="grid gap-6 p-4 sm:p-7 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <section aria-labelledby="cohort-heading" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black tracking-[0.16em] text-clinical-teal">01 · קבוצה</div>
                <h3 id="cohort-heading" className="mt-1 font-display text-xl font-black text-slate-950">בחר קבוצת תרגול</h3>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">סינתטי בלבד</span>
            </div>
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(group.id);
                    setAnnouncement('');
                  }}
                  aria-pressed={selectedGroup.id === group.id}
                  className={`w-full rounded-2xl border p-4 text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-blue ${
                    selectedGroup.id === group.id
                      ? 'border-clinical-blue bg-blue-50/70 shadow-soft'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <span className="block font-bold text-slate-950">{group.name}</span>
                  <span className="mt-1 block text-sm text-slate-600">{group.participantCount} משתתפים סינתטיים</span>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="assignment-heading" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="text-[11px] font-black tracking-[0.16em] text-clinical-blue">02 · הקצאה</div>
            <h3 id="assignment-heading" className="mt-1 font-display text-2xl font-black text-slate-950">תרגול מדורג SCN-01</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-500">תרחיש</div>
                <div className="mt-1 font-black text-slate-900">SCN-01 · v1</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 sm:col-span-2">
                <div className="text-xs font-bold text-slate-500">מחוון</div>
                <div className="mt-1 break-words font-black text-slate-900">{scn01LearningRubric.rubric_version}</div>
              </div>
            </div>
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              המחוון ממתין לבדיקת מדריך ומפיק משוב לימודי בלבד. הוא אינו קובע כשירות קלינית ואינו מעניק הסמכה.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={assignExercise}
                disabled={Boolean(selectedGroup.assignment)}
                className="rounded-2xl bg-clinical-blue px-5 py-3 text-sm font-extrabold text-white shadow-soft transition hover:bg-clinical-deep disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {selectedGroup.assignment ? 'התרגול הוקצה' : 'הקצה לקבוצה הסינתטית'}
              </button>
              <button
                type="button"
                onClick={onOpenPractice}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                פתח תצוגת תרגול
              </button>
            </div>
            <p aria-live="polite" className="mt-3 min-h-6 text-sm font-bold text-teal-800">{announcement}</p>
          </section>

          <section aria-labelledby="results-heading" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black tracking-[0.16em] text-violet-700">03 · תמונת קבוצה</div>
                <h3 id="results-heading" className="mt-1 font-display text-2xl font-black text-slate-950">תוצאות מצרפיות</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">אין שמות, אימיילים, מזהי משתמש, טקסט חופשי או תוצאות אישיות.</p>
            </div>

            {aggregate.suppressed ? (
              <div className="mt-5 rounded-3xl border border-dashed border-violet-300 bg-violet-50 p-6 text-center">
                <div className="text-3xl" aria-hidden="true">◒</div>
                <h4 className="mt-2 font-display text-xl font-black text-violet-950">התוצאות מוסתרות להגנת פרטיות</h4>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-violet-900/75">
                  נדרשות לפחות {aggregate.minimumRequired} השלמות לפני הצגת חתך קבוצתי. לא מוצגים גם המספר המדויק או התפלגות ביניים.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
                <div className="rounded-3xl bg-slate-950 p-5 text-white">
                  <div className="text-xs font-bold tracking-[0.14em] text-slate-400">השלמות מצרפיות</div>
                  <div className="mt-3 flex items-end gap-2">
                    <strong className="font-display text-5xl font-black">{aggregate.completionPercent}%</strong>
                    <span className="pb-1 text-sm text-slate-300">{aggregate.completedCount} מתוך {selectedGroup.participantCount}</span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {aggregate.bands.map((band) => (
                    <div key={band.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-bold text-slate-600">{band.label}</div>
                      <div className="mt-2 font-display text-3xl font-black text-slate-950">{band.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
