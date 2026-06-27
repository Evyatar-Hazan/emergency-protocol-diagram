import { useMemo, useState } from 'react';
import vitalSignsData from '../../data/vital-signs.json';

type AgeGroup = 'adult' | 'child';
type CategoryKey = 'all' | 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure';
type VitalSignParameter = Record<string, string>;
type FavoriteKey = `${string}:${string}`;

const categoryMeta: Array<{
  key: Exclude<CategoryKey, 'all'>;
  shortLabel: string;
  accent: string;
}> = [
  { key: 'airway', shortLabel: 'A', accent: 'from-sky-500 to-sky-600' },
  { key: 'breathing', shortLabel: 'B', accent: 'from-cyan-500 to-cyan-600' },
  { key: 'circulation', shortLabel: 'C', accent: 'from-rose-500 to-rose-600' },
  { key: 'disability', shortLabel: 'D', accent: 'from-violet-500 to-violet-600' },
  { key: 'exposure', shortLabel: 'E', accent: 'from-amber-500 to-orange-500' },
];

export function VitalSignsView() {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [query, setQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<FavoriteKey>>(() => {
    const saved = localStorage.getItem('vital-sign-favorites');
    if (!saved) {
      return new Set();
    }

    try {
      return new Set(JSON.parse(saved));
    } catch (error) {
      console.error('Failed to load vital-sign favorites', error);
      return new Set();
    }
  });

  const saveFavorites = (nextFavorites: Set<FavoriteKey>) => {
    localStorage.setItem('vital-sign-favorites', JSON.stringify(Array.from(nextFavorites)));
  };

  const toggleFavorite = (id: FavoriteKey) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveFavorites(next);
      return next;
    });
  };

  const getEntryPresentation = (key: string) => {
    if (key === 'normal') {
      return { label: 'תקין', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' };
    }
    if (key === 'mild' || key === 'elevated') {
      return { label: 'קל', tone: 'border-yellow-200 bg-yellow-50 text-yellow-900' };
    }
    if (key === 'moderate') {
      return { label: 'בינוני', tone: 'border-orange-200 bg-orange-50 text-orange-900' };
    }
    if (key === 'severe') {
      return { label: 'חמור', tone: 'border-red-200 bg-red-50 text-red-900' };
    }
    if (key === 'abnormal') {
      return { label: 'לא תקין', tone: 'border-rose-200 bg-rose-50 text-rose-900' };
    }
    if (key === 'note') {
      return { label: 'הערה', tone: 'border-blue-200 bg-blue-50 text-blue-900' };
    }
    if (key.includes('hypo')) {
      return { label: 'נמוך', tone: 'border-sky-200 bg-sky-50 text-sky-900' };
    }
    if (key.includes('hyper') || key.includes('fever')) {
      return { label: 'גבוה', tone: 'border-red-200 bg-red-50 text-red-900' };
    }
    if (key === 'bradycardia') {
      return { label: 'ברדיקרדיה', tone: 'border-amber-200 bg-amber-50 text-amber-900' };
    }
    if (key === 'tachycardia') {
      return { label: 'טכיקרדיה', tone: 'border-orange-200 bg-orange-50 text-orange-900' };
    }
    if (key === 'delayed') {
      return { label: 'מעוכב', tone: 'border-orange-200 bg-orange-50 text-orange-900' };
    }
    if (key === 'alert') {
      return { label: 'ערני', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' };
    }
    if (key === 'verbal') {
      return { label: 'מגיב לקול', tone: 'border-yellow-200 bg-yellow-50 text-yellow-900' };
    }
    if (key === 'pain') {
      return { label: 'מגיב לכאב', tone: 'border-orange-200 bg-orange-50 text-orange-900' };
    }
    if (key === 'unresponsive') {
      return { label: 'לא מגיב', tone: 'border-red-200 bg-red-50 text-red-900' };
    }
    if (key === 'infant') {
      return { label: 'תינוק', tone: 'border-cyan-200 bg-cyan-50 text-cyan-900' };
    }
    if (key === 'toddler') {
      return { label: 'פעוט', tone: 'border-teal-200 bg-teal-50 text-teal-900' };
    }
    if (key === 'preschool') {
      return { label: 'גן', tone: 'border-violet-200 bg-violet-50 text-violet-900' };
    }
    if (key === 'school') {
      return { label: 'בית ספר', tone: 'border-indigo-200 bg-indigo-50 text-indigo-900' };
    }
    if (key === 'adolescent' || key === 'child') {
      return { label: key === 'adolescent' ? 'מתבגר' : 'ילד', tone: 'border-slate-200 bg-slate-50 text-slate-900' };
    }

    return { label: key.replaceAll('_', ' '), tone: 'border-slate-200 bg-slate-50 text-slate-800' };
  };

  const allCards = useMemo(() => {
    return categoryMeta.flatMap((category) => {
      const categoryData = vitalSignsData[category.key];
      const ageData = categoryData[ageGroup] as Record<string, VitalSignParameter>;

      return Object.entries(ageData).map(([parameterKey, parameter]) => {
        const entries = Object.entries(parameter)
          .filter(([entryKey]) => entryKey !== 'parameter')
          .map(([entryKey, value]) => {
            const presentation = getEntryPresentation(entryKey);
            return {
              key: entryKey,
              value,
              label: presentation.label,
              tone: presentation.tone,
            };
          });

        return {
          id: `${category.key}:${parameterKey}` as FavoriteKey,
          categoryKey: category.key,
          categoryTitle: categoryData.title,
          categoryIcon: categoryData.icon,
          parameterKey,
          parameterName: parameter.parameter,
          entries,
        };
      });
    });
  }, [ageGroup]);

  const filteredCards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allCards.filter((card) => {
      if (activeCategory !== 'all' && card.categoryKey !== activeCategory) {
        return false;
      }

      if (showFavoritesOnly && !favorites.has(card.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        card.categoryTitle,
        card.parameterName,
        card.parameterKey,
        ...card.entries.flatMap((entry) => [entry.label, entry.value, entry.key]),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, allCards, favorites, query, showFavoritesOnly]);

  const highlightedCards = filteredCards.slice(0, 3);
  const totalFavorites = favorites.size;

  return (
    <div className="app-shell px-3 py-4 sm:px-5 sm:py-6 lg:px-8" dir="rtl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="surface-card-strong overflow-hidden rounded-[32px]">
          <div className="grid gap-6 border-b border-slate-200/70 bg-gradient-to-l from-clinical-deep via-clinical-blue to-clinical-teal px-5 py-6 text-white sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8 lg:py-8">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white/80">
                שליפה מהירה
              </span>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
                מדדים מהירים לפי ABCDE
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
                מסך שליפה מהיר ללמידה, רענון והשוואה. חיפוש, פילטרים ומועדפים נועדו להביא אותך למדד הנכון בלי לגלול את כל המערכת.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-bold tracking-[0.18em] text-white/70">קבוצת גיל</div>
                <div className="mt-2 text-2xl font-extrabold">{ageGroup === 'adult' ? 'מבוגר' : 'ילד'}</div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-bold tracking-[0.18em] text-white/70">כרטיסים זמינים</div>
                <div className="mt-2 text-2xl font-extrabold">{filteredCards.length}</div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs font-bold tracking-[0.18em] text-white/70">שמורים</div>
                <div className="mt-2 text-2xl font-extrabold">{totalFavorites}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-8">
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <label className="surface-card flex items-center gap-3 rounded-3xl px-4 py-3">
                  <span className="text-lg text-slate-400">⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="חפש מדד, טווח, סטטוס או מונח קליני"
                    aria-label="חיפוש מדדים וערכים"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
                  />
                </label>
                <button
                  onClick={() => setShowFavoritesOnly((prev) => !prev)}
                  className={`rounded-3xl px-4 py-3 text-sm font-semibold transition-all ${
                    showFavoritesOnly
                      ? 'bg-amber-100 text-amber-900 shadow-soft'
                      : 'surface-card text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {showFavoritesOnly ? 'מציג שמורים בלבד' : 'סנן לשמורים'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-soft'
                      : 'surface-card text-slate-600 hover:text-slate-900'
                  }`}
                >
                  הכל
                </button>
                {categoryMeta.map((category) => {
                  const count = allCards.filter((card) => card.categoryKey === category.key).length;
                  return (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        activeCategory === category.key
                          ? 'bg-clinical-blue text-white shadow-soft'
                          : 'surface-card text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {category.shortLabel} · {count}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <button
                onClick={() => setAgeGroup('adult')}
                className={`rounded-3xl px-4 py-3 text-sm font-bold transition-all ${
                  ageGroup === 'adult'
                    ? 'bg-clinical-blue text-white shadow-soft'
                    : 'surface-card text-slate-700 hover:text-slate-900'
                }`}
              >
                מבוגר
              </button>
              <button
                onClick={() => setAgeGroup('child')}
                className={`rounded-3xl px-4 py-3 text-sm font-bold transition-all ${
                  ageGroup === 'child'
                    ? 'bg-clinical-teal text-white shadow-soft'
                    : 'surface-card text-slate-700 hover:text-slate-900'
                }`}
              >
                ילד
              </button>
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('all');
                  setShowFavoritesOnly(false);
                }}
                className="surface-card rounded-3xl px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:text-slate-900"
              >
                נקה פילטרים
              </button>
              <div className="surface-card rounded-3xl px-4 py-3 text-sm text-slate-600">
                תצוגה: {showFavoritesOnly ? 'שמורים' : 'כל המדדים'}
              </div>
            </div>
          </div>
        </section>

        {highlightedCards.length > 0 && !query && activeCategory === 'all' && !showFavoritesOnly && (
          <section className="grid gap-4 lg:grid-cols-3">
            {highlightedCards.map((card) => (
              <div key={`highlight-${card.id}`} className="surface-card rounded-[28px] p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold tracking-[0.18em] text-clinical-muted">שליפה מהירה</div>
                    <h2 className="mt-2 text-xl font-bold text-clinical-ink">{card.parameterName}</h2>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xl">{card.categoryIcon}</div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  {card.entries[0] ? (
                    <>
                      <div className="text-xs font-bold tracking-[0.14em] text-emerald-700">{card.entries[0].label}</div>
                      <div className="mt-1 text-sm font-semibold text-emerald-900">{card.entries[0].value}</div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-500">אין נתון זמין</div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {filteredCards.length === 0 ? (
          <section className="surface-card-strong rounded-[32px] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
              ⊘
            </div>
            <h2 className="font-display text-2xl font-extrabold text-clinical-ink">לא נמצאו מדדים תואמים</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-clinical-muted sm:text-base">
              נסה להסיר פילטר, לעבור לקבוצת גיל אחרת או לחפש לפי שם מדד כמו דופק, סטורציה, GCS או טמפרטורה.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => {
              const meta = categoryMeta.find((category) => category.key === card.categoryKey)!;
              const isFavorite = favorites.has(card.id);

              return (
                <article key={card.id} className="surface-card-strong rounded-[30px] p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full bg-gradient-to-r ${meta.accent} px-3 py-1 text-xs font-bold text-white shadow-soft`}>
                          {meta.shortLabel}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {card.categoryTitle}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-clinical-ink">{card.parameterName}</h2>
                    </div>
                    <button
                      onClick={() => toggleFavorite(card.id)}
                      className={`rounded-2xl px-3 py-2 text-lg transition-all ${
                        isFavorite
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-400 hover:text-slate-700'
                      }`}
                      title={isFavorite ? 'הסר ממועדפים' : 'שמור למועדפים'}
                      aria-label={isFavorite ? `הסר את ${card.parameterName} מהמועדפים` : `שמור את ${card.parameterName} למועדפים`}
                    >
                      {isFavorite ? '★' : '☆'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {card.entries.map((entry) => (
                      <div key={`${card.id}-${entry.key}`} className={`rounded-2xl border px-3 py-3 ${entry.tone}`}>
                        <div className="text-xs font-bold tracking-[0.14em]">{entry.label}</div>
                        <div className="mt-1 text-sm leading-6">{entry.value}</div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="surface-card rounded-[30px] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div>
              <div className="text-xs font-bold tracking-[0.18em] text-clinical-muted">שימוש נכון במסך</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-clinical-ink">שליפה מהירה, לא תחליף לשיקול קליני</h2>
              <p className="mt-3 text-sm leading-7 text-clinical-muted sm:text-base">
                הערכים כאן נועדו לעזור בחזרה, השוואה והבנת טווחים. תמיד צריך לקרוא אותם יחד עם מצב המטופל, ההקשר בזירה, גיל, תרופות ומחלות רקע.
              </p>
            </div>
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold tracking-[0.18em] text-amber-700">הערת בטיחות</div>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                בספק, בחר בגישה המחמירה יותר ופעל לפי הפרוטוקול המלא או התייעצות רפואית מוסמכת.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
