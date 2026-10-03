export const SAFETY_SCOPE_COPY = {
  reviewStatus: 'reviewed-for-educational-bls-scope',
  reviewLabel: 'נבדק להתאמה לימודית בתחום BLS',
  title: 'כלי למידה ורענון ל־BLS',
  summary:
    'המערכת מיועדת להבנה, לתרגול ולחזרה על רצפי חשיבה קלינית. היא אינה מיועדת לקבלת החלטות או לטיפול בזמן אירוע חי.',
  operatingBoundary:
    'בזמן אירוע יש לפעול לפי ההכשרה, הפרוטוקול הארגוני העדכני והנחיות הגורם המוסמך.',
  approvalBoundary:
    'הנוסח נבדק להתאמה לימודית בתחום BLS. אין בכך אישור משפטי, ארגוני או היתר לשימוש בזמן טיפול.',
} as const;

interface SafetyScopeNoticeProps {
  compact?: boolean;
  className?: string;
  id?: string;
}

export function SafetyScopeNotice({
  compact = false,
  className = '',
  id = 'safety-scope',
}: SafetyScopeNoticeProps) {
  const titleId = `${id}-title`;

  return (
    <aside
      aria-labelledby={titleId}
      className={`rounded-3xl border border-amber-300/80 bg-amber-50/95 text-right text-amber-950 shadow-soft ${
        compact ? 'p-4' : 'p-4 sm:p-5'
      } ${className}`}
      data-review-status={SAFETY_SCOPE_COPY.reviewStatus}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-amber-800">
            {SAFETY_SCOPE_COPY.reviewLabel}
          </div>
          <h2 id={titleId} className={`${compact ? 'text-lg' : 'text-xl'} font-display font-extrabold`}>
            {SAFETY_SCOPE_COPY.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            {SAFETY_SCOPE_COPY.summary}
          </p>
        </div>

        {!compact && (
          <details className="shrink-0 rounded-2xl border border-amber-300/80 bg-white/65 px-3 py-2 sm:max-w-sm">
            <summary className="cursor-pointer text-sm font-bold text-amber-900">
              גבולות השימוש
            </summary>
            <div className="mt-2 space-y-2 text-sm leading-6 text-amber-950">
              <p>{SAFETY_SCOPE_COPY.operatingBoundary}</p>
              <p>{SAFETY_SCOPE_COPY.approvalBoundary}</p>
            </div>
          </details>
        )}
      </div>

      {compact && (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          {SAFETY_SCOPE_COPY.approvalBoundary}
        </p>
      )}
    </aside>
  );
}
