import { useState, type ReactNode } from 'react';
import type { Protocol, Node } from '../../types/protocol';
import { CommentsThread } from '../comments/CommentsThread';

interface StepByStepViewProps {
  protocols: Record<string, Protocol>;
}

type SectionDefinition = {
  key: string;
  title: string;
  icon: string;
  tone: string;
  borderTone: string;
  content: ReactNode;
};

export const StepByStepView = ({ protocols }: StepByStepViewProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('unified_flow:report_departure');
  const [history, setHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [bookmarkedNodes, setBookmarkedNodes] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('protocol-bookmarks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      }
    }
    return new Set();
  });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const saveBookmarks = (bookmarks: Set<string>) => {
    localStorage.setItem('protocol-bookmarks', JSON.stringify(Array.from(bookmarks)));
  };

  const toggleBookmark = (nodeId: string) => {
    setBookmarkedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      saveBookmarks(newSet);
      return newSet;
    });
  };

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  const parseNodeId = (nodeId: string): { protocolId: string; nodeKey: string } | null => {
    const parts = nodeId.split(':');
    if (parts.length !== 2) return null;
    return { protocolId: parts[0], nodeKey: parts[1] };
  };

  const getBookmarkedNodesList = () => {
    const bookmarked: Array<{ id: string; label: string; nodeKey: string }> = [];

    bookmarkedNodes.forEach((nodeId) => {
      const parsedNode = parseNodeId(nodeId);
      if (parsedNode) {
        const node = protocols[parsedNode.protocolId]?.nodes[parsedNode.nodeKey];
        if (node) {
          bookmarked.push({
            id: nodeId,
            label: node.title,
            nodeKey: parsedNode.nodeKey,
          });
        }
      }
    });

    return bookmarked;
  };

  const parsed = parseNodeId(currentNodeId);
  const currentNode: Node | null = parsed ? protocols[parsed.protocolId]?.nodes[parsed.nodeKey] : null;
  const currentProtocol = parsed ? protocols[parsed.protocolId] : null;

  const navigateToNode = (nodeId: string) => {
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(nodeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentNodeId(previous);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const restart = () => {
    setCurrentNodeId('unified_flow:report_departure');
    setHistory([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentNode || !currentProtocol) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10" dir="rtl">
        <div className="surface-card-strong w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-2xl font-bold">שגיאה</h2>
          <p className="mb-4 text-gray-600">לא נמצא צומת: {currentNodeId}</p>
          <button
            onClick={restart}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            התחל מחדש
          </button>
        </div>
      </div>
    );
  }

  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', icon: '🚨', label: 'קריטי' },
    urgent: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900', icon: '⚠️', label: 'דחוף' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900', icon: '⚡', label: 'אזהרה' },
    stable: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: '✅', label: 'יציב' },
    normal: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'ℹ️', label: 'רגיל' },
  };

  const severity = currentNode.severity || 'normal';
  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.normal;
  const stepCount = history.length + 1;
  const protocolLabel = currentProtocol.name || parsed?.protocolId || 'מסלול למידה';
  const nodeDescription = currentNode.description?.trim();
  const hasBookmark = bookmarkedNodes.has(currentNodeId);

  const getNextOptions = (): Array<{ label: string; target: string }> => {
    if (currentNode.content?.actions && currentNode.content.actions.length > 0) {
      return currentNode.content.actions.map((action) => ({
        label: action.label,
        target: action.target.includes(':') ? action.target : `${parsed!.protocolId}:${action.target}`,
      }));
    }

    if (currentNode.conditions && currentNode.conditions.length > 0) {
      return currentNode.conditions.map((cond) => ({
        label: cond.label,
        target: cond.target.includes(':') ? cond.target : `${parsed!.protocolId}:${cond.target}`,
      }));
    }

    if (currentNode.options && currentNode.options.length > 0) {
      return currentNode.options.map((opt) => ({
        label: opt.label,
        target: opt.target.includes(':') ? opt.target : `${parsed!.protocolId}:${opt.target}`,
      }));
    }

    if (currentNode.next) {
      const nextNodeKey = typeof currentNode.next === 'string' ? currentNode.next : currentNode.next[0];
      const nextNodeId = `${parsed!.protocolId}:${nextNodeKey}`;
      const nextNode = protocols[parsed!.protocolId]?.nodes[nextNodeKey];

      return [
        {
          label: nextNode?.title || 'המשך',
          target: nextNodeId,
        },
      ];
    }

    return [];
  };

  const nextOptions = getNextOptions();

  const jumpToNode = (nodeId: string) => {
    if (nodeId !== currentNodeId) {
      setHistory([...history, currentNodeId]);
      setCurrentNodeId(nodeId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSidebarOpen(false);
    }
  };

  const formatPreview = (value: unknown) => {
    if (Array.isArray(value)) {
      return value[0] || '';
    }

    if (value && typeof value === 'object') {
      const explanation = value as Record<string, string | undefined>;
      return explanation.clinical || explanation.theoretical || explanation.urgency || explanation.title || '';
    }

    return typeof value === 'string' ? value : '';
  };

  const primaryActionCards = [
    currentNode.content?.checkMethod ? { label: 'בדיקה מיידית', value: currentNode.content.checkMethod } : null,
    currentNode.content?.assessment ? { label: 'מה להעריך', value: currentNode.content.assessment } : null,
    currentNode.content?.treatment ? { label: 'טיפול ראשוני', value: currentNode.content.treatment } : null,
  ]
    .filter(Boolean)
    .map((item) => ({
      label: item!.label,
      preview: formatPreview(item!.value).trim(),
    }))
    .filter((item) => item.preview.length > 0);

  const immediateSections: SectionDefinition[] = [];
  const learningSections: SectionDefinition[] = [];
  const deepDiveSections: SectionDefinition[] = [];

  if (currentNode.content?.checkMethod) {
    immediateSections.push({
      key: 'checkMethod',
      title: 'איך לבדוק',
      icon: '🔍',
      tone: 'bg-sky-50',
      borderTone: 'border-sky-400',
      content: (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
          {currentNode.content.checkMethod}
        </p>
      ),
    });
  }

  if (currentNode.content?.questions && currentNode.content.questions.length > 0) {
    immediateSections.push({
      key: 'questions',
      title: 'שאלות לשאול',
      icon: '❓',
      tone: 'bg-amber-50',
      borderTone: 'border-amber-400',
      content: (
        <ul className="space-y-2.5">
          {currentNode.content.questions.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-amber-600">•</span>
              <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (currentNode.content?.treatment) {
    learningSections.push({
      key: 'treatment',
      title: 'טיפול ראשוני',
      icon: '💊',
      tone: 'bg-emerald-50',
      borderTone: 'border-emerald-400',
      content: Array.isArray(currentNode.content.treatment) ? (
        <ul className="space-y-2.5">
          {currentNode.content.treatment.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-emerald-600">•</span>
              <span className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
          {currentNode.content.treatment}
        </p>
      ),
    });
  }

  if (currentNode.content?.assessment) {
    learningSections.push({
      key: 'assessment',
      title: 'מה להעריך',
      icon: '✅',
      tone: 'bg-rose-50',
      borderTone: 'border-rose-400',
      content: Array.isArray(currentNode.content.assessment) ? (
        <ul className="space-y-2.5">
          {currentNode.content.assessment.map((item: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-rose-600">•</span>
              <span className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
          {currentNode.content.assessment}
        </p>
      ),
    });
  }

  if (currentNode.content?.whatToLookFor) {
    learningSections.push({
      key: 'whatToLookFor',
      title: 'על מה לשים לב',
      icon: '👀',
      tone: 'bg-violet-50',
      borderTone: 'border-violet-400',
      content: Array.isArray(currentNode.content.whatToLookFor) ? (
        <ul className="space-y-2.5">
          {currentNode.content.whatToLookFor.map((item: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-violet-600">•</span>
              <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
          {currentNode.content.whatToLookFor}
        </p>
      ),
    });
  }

  if (currentNode.content?.vitals && currentNode.content.vitals.length > 0) {
    learningSections.push({
      key: 'vitals',
      title: 'מדדים לשליפה מהירה',
      icon: '📊',
      tone: 'bg-cyan-50',
      borderTone: 'border-cyan-400',
      content: (
        <ul className="space-y-2.5">
          {currentNode.content.vitals.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-cyan-600">•</span>
              <span className="text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (currentNode.content?.equipment && currentNode.content.equipment.length > 0) {
    learningSections.push({
      key: 'equipment',
      title: 'ציוד רלוונטי',
      icon: '🧰',
      tone: 'bg-orange-50',
      borderTone: 'border-orange-400',
      content: (
        <div className="flex flex-wrap gap-2">
          {currentNode.content.equipment.map((item, idx) => (
            <span
              key={idx}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 sm:text-base"
            >
              {item}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (currentNode.content?.about) {
    deepDiveSections.push({
      key: 'about',
      title: 'למה זה חשוב',
      icon: 'ℹ️',
      tone: 'bg-indigo-50',
      borderTone: 'border-indigo-400',
      content: Array.isArray(currentNode.content.about) ? (
        <ul className="space-y-2.5">
          {currentNode.content.about.map((item: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-1 text-indigo-600">•</span>
              <span className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
          {currentNode.content.about}
        </p>
      ),
    });
  }

  if (currentNode.content?.explanation) {
    deepDiveSections.push({
      key: 'explanation',
      title: 'הסבר מתקדם',
      icon: '🧠',
      tone: 'bg-stone-50',
      borderTone: 'border-stone-300',
      content:
        typeof currentNode.content.explanation === 'object' && !Array.isArray(currentNode.content.explanation) ? (
          <div className="space-y-4">
            {currentNode.content.explanation.title && (
              <h4 className="text-lg font-bold text-stone-900">{currentNode.content.explanation.title}</h4>
            )}
            {currentNode.content.explanation.clinical && (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-stone-700">מצב קליני</p>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
                  {currentNode.content.explanation.clinical}
                </p>
              </div>
            )}
            {currentNode.content.explanation.theoretical && (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-stone-700">הסבר תיאורטי</p>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
                  {currentNode.content.explanation.theoretical}
                </p>
              </div>
            )}
            {currentNode.content.explanation.urgency && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="mb-1 text-sm font-semibold text-red-700">דחיפות</p>
                <p className="whitespace-pre-line text-sm leading-7 text-red-800 sm:text-base">
                  {currentNode.content.explanation.urgency}
                </p>
              </div>
            )}
          </div>
        ) : Array.isArray(currentNode.content.explanation) ? (
          <ul className="space-y-2.5">
            {currentNode.content.explanation.map((item: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 text-stone-600">•</span>
                <span className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
            {currentNode.content.explanation}
          </p>
        ),
    });
  }

  const renderAccordionSection = (section: SectionDefinition) => (
    <div key={section.key} className={`hover-lift overflow-hidden rounded-3xl border ${section.borderTone} ${section.tone}`}>
      <button
        onClick={() => toggleSection(section.key)}
        className="flex w-full items-center justify-between gap-3 p-5 text-right transition-colors hover:bg-white/40"
      >
        <h3 className="flex min-w-0 items-center gap-3 text-lg font-bold text-slate-900 sm:text-xl">
          <span>{section.icon}</span>
          <span>{section.title}</span>
        </h3>
        <span
          className="text-xl transition-transform"
          style={{ transform: collapsedSections.has(section.key) ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>
      {!collapsedSections.has(section.key) && (
        <div className="border-t border-black/5 bg-white/70 px-5 py-5">{section.content}</div>
      )}
    </div>
  );

  return (
    <div className="app-shell px-3 py-4 sm:px-5 sm:py-6 lg:px-8" dir="rtl">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:w-96 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between bg-gradient-to-l from-purple-600 to-blue-600 p-4 text-white shadow-lg sm:p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🔖</span>
              <div>
                <h2 className="text-lg font-bold sm:text-xl">הסימניות שלי</h2>
                <p className="text-xs text-white/80 sm:text-sm">
                  {bookmarkedNodes.size} {bookmarkedNodes.size === 1 ? 'סימניה' : 'סימניות'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 text-xl text-white transition-colors hover:bg-white/20 sm:p-2.5"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {getBookmarkedNodesList().length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center sm:p-8">
                <div className="mb-4 text-6xl sm:mb-6 sm:text-7xl">☆</div>
                <h3 className="mb-2 text-lg font-bold text-gray-800 sm:mb-3 sm:text-xl">אין סימניות עדיין</h3>
                <p className="mb-4 max-w-xs text-sm leading-relaxed text-gray-600 sm:mb-6 sm:text-base">
                  כדי להוסיף סימניה, לחץ על כפתור הכוכב בחלק העליון של כל צומת
                </p>
                <div className="max-w-sm rounded-xl border-2 border-blue-200 bg-blue-50 p-4 sm:p-5">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-2xl">💡</span>
                    <span className="text-sm font-bold text-blue-900 sm:text-base">טיפ</span>
                  </div>
                  <p className="text-right text-xs text-blue-800 sm:text-sm">
                    סמן צמתים שאתה חוזר אליהם לעתים קרובות לגישה מהירה ונוחה
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 sm:p-4">
                {getBookmarkedNodesList().map((node) => {
                  const isCurrent = node.id === currentNodeId;

                  return (
                    <div
                      key={node.id}
                      className={`group relative rounded-lg transition-all ${
                        isCurrent
                          ? 'border-2 border-blue-500 bg-blue-100 shadow-md'
                          : 'border-2 border-transparent bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                        <button
                          onClick={() => toggleBookmark(node.id)}
                          className="flex-shrink-0 text-xl text-yellow-500 transition-transform hover:scale-110 sm:text-2xl"
                          title="הסר סימניה"
                          aria-label={`הסר סימניה עבור ${node.label}`}
                        >
                          ⭐
                        </button>
                        <button onClick={() => jumpToNode(node.id)} className="flex-1 text-right" aria-label={`עבור אל ${node.label}`}>
                          <div className="text-sm font-medium text-gray-900 transition-colors hover:text-blue-600 sm:text-base">
                            {node.label}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-gray-500">{node.nodeKey}</div>
                        </button>
                        {isCurrent && <div className="flex-shrink-0 text-sm font-bold text-blue-600 sm:text-base">←</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-gradient-to-t from-gray-100 to-gray-50 p-3 sm:p-4">
            <div className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
              <span className="flex-shrink-0 text-base sm:text-lg">ℹ️</span>
              <div className="space-y-1">
                <p>⭐ לחץ להסרת סימניה</p>
                <p>☆ לחץ בצומת להוספת סימניה</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mb-4 w-full max-w-5xl sm:mb-6">
        <div className="surface-card clinical-panel rise-in rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="clinical-kicker">
                  <span>{protocolLabel}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    צעד {stepCount}
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.border} ${config.bg} ${config.text}`}>
                    {config.icon} {config.label}
                  </div>
                  <div className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center font-mono text-[11px] text-slate-500 shadow-sm sm:w-auto sm:rounded-full sm:py-1 sm:text-xs">
                    {currentNode.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:justify-end">
                <button
                  onClick={restart}
                  className="col-span-2 flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-clinical-blue px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clinical-deep md:col-auto md:px-3 md:py-2 md:font-medium"
                >
                  <span>🔄</span>
                  <span>התחל מחדש</span>
                </button>
                <button
                  onClick={() => toggleBookmark(currentNodeId)}
                  className={`col-span-2 flex min-w-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all md:col-auto md:px-3 md:py-2 ${
                    hasBookmark
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={hasBookmark ? 'הסר סימניה' : 'הוסף סימניה'}
                  aria-label={hasBookmark ? 'הסר את הצעד הזה מהסימניות' : 'שמור את הצעד הזה לסימניות'}
                >
                  <span className="text-lg">{hasBookmark ? '⭐' : '☆'}</span>
                  <span>{hasBookmark ? 'שמור ללמידה' : 'שמור לחזרה'}</span>
                </button>
                <button
                  onClick={goBack}
                  disabled={history.length === 0}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-2xl bg-gray-200 px-3 py-3 text-sm font-medium transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 md:px-3 md:py-2"
                >
                  <span>←</span>
                  <span>חזור</span>
                </button>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex min-w-0 items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-purple-600 to-clinical-blue px-3 py-3 text-sm font-medium text-white transition-all hover:shadow-lg md:px-3 md:py-2"
                  title="פתח סימניות"
                  aria-label="פתח את רשימת הסימניות"
                >
                  <span className="text-base">🔖</span>
                  <span>סימניות</span>
                  {bookmarkedNodes.size > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-purple-600">
                      {bookmarkedNodes.size}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <div className={`surface-card-strong clinical-panel rise-in-delay-1 overflow-hidden rounded-[28px] border-[3px] ${config.border}`}>
          <div className={`${config.bg} border-b-[3px] ${config.border} p-5 sm:p-6 lg:p-8`}>
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-3xl shadow-sm sm:h-16 sm:w-16 sm:text-4xl">
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 text-sm font-semibold tracking-[0.2em] text-slate-500">
                      יחידת למידה קלינית
                    </p>
                    <h1 className={`mb-2 font-display text-2xl font-extrabold sm:text-3xl md:text-4xl ${config.text}`}>
                      {currentNode.title}
                    </h1>
                    {nodeDescription && (
                      <p className={`max-w-3xl text-base leading-7 sm:text-lg ${config.text} opacity-80`}>
                        {nodeDescription}
                      </p>
                    )}
                  </div>
                </div>

                {primaryActionCards.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {primaryActionCards.map((card) => (
                      <div key={card.label} className="hover-lift rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          {card.label}
                        </p>
                        <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {card.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8 p-4 sm:p-6 lg:p-8">
            {immediateSections.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-slate-500">פעולה מיידית</p>
                    <h2 className="font-display text-2xl font-bold text-slate-900">מה עושים עכשיו</h2>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    צעד קצר וממוקד
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">{immediateSections.map(renderAccordionSection)}</div>
              </section>
            )}

            {learningSections.length > 0 && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">פרשנות קלינית</p>
                  <h2 className="font-display text-2xl font-bold text-slate-900">הבנה והערכה</h2>
                </div>
                <div className="grid gap-4">{learningSections.map(renderAccordionSection)}</div>
              </section>
            )}

            {deepDiveSections.length > 0 && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">העמקה לימודית</p>
                  <h2 className="font-display text-2xl font-bold text-slate-900">העמקה קלינית</h2>
                </div>
                <div className="grid gap-4">{deepDiveSections.map(renderAccordionSection)}</div>
              </section>
            )}

            <section className="space-y-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-slate-500">דיון מקצועי</p>
                <h2 className="font-display text-2xl font-bold text-slate-900">דיון ולמידה משותפת</h2>
              </div>
              <div className="hover-lift rounded-[28px] border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
                <CommentsThread nodeId={currentNodeId} title="דיון והערות על הצומת" />
              </div>
            </section>
          </div>

          <div className={`${config.bg} border-t-[3px] ${config.border} p-4 sm:p-6 lg:p-8`}>
            {nextOptions.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-500">החלטה הבאה</p>
                  <h3 className="font-display text-2xl font-extrabold text-slate-900">מה הצעד הבא?</h3>
                  <p className="mt-2 text-sm text-slate-600 sm:text-base">
                    בחר את ההמשך המתאים כדי לשמור על רצף למידה ברור.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {nextOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateToNode(option.target)}
                      className="w-full rounded-3xl border-2 border-white/70 bg-white px-5 py-4 text-right shadow-md transition-all hover:-translate-y-0.5 hover:border-clinical-blue hover:bg-gray-50 hover:shadow-xl sm:px-6"
                      aria-label={`עבור לאפשרות ${idx + 1}: ${option.label}`}
                    >
                      <span className="mb-2 block text-xs font-bold tracking-[0.18em] text-slate-400">
                        אפשרות {idx + 1}
                      </span>
                      <span className="block text-base font-bold text-slate-900 sm:text-lg">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4 text-6xl">🎉</div>
                <h3 className="mb-2 text-2xl font-bold">סיום פרוטוקול</h3>
                <p className="mb-4 text-gray-600">הגעת לסוף הפרוטוקול</p>
                <button
                  onClick={restart}
                  className="rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
                >
                  התחל מחדש
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
