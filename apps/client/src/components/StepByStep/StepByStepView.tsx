import { useState } from 'react';
import type { Protocol, Node } from '../../types/protocol';
import { CommentsThread } from '../comments/CommentsThread';

interface StepByStepViewProps {
  protocols: Record<string, Protocol>;
}

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

  // שמור סימניות ל-localStorage
  const saveBookmarks = (bookmarks: Set<string>) => {
    localStorage.setItem('protocol-bookmarks', JSON.stringify(Array.from(bookmarks)));
  };

  // הוסף/הסר סימניה
  const toggleBookmark = (nodeId: string) => {
    setBookmarkedNodes(prev => {
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

  // התחלף סטטוס של סעיף (מקופל / פתוח)
  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // קבלת רשימת צמתים מסומנים בלבד
  const getBookmarkedNodesList = () => {
    const bookmarked: Array<{ id: string; label: string; nodeKey: string }> = [];
    
    bookmarkedNodes.forEach(nodeId => {
      const parsed = parseNodeId(nodeId);
      if (parsed) {
        const node = protocols[parsed.protocolId]?.nodes[parsed.nodeKey];
        if (node) {
          bookmarked.push({
            id: nodeId,
            label: node.title,
            nodeKey: parsed.nodeKey
          });
        }
      }
    });

    return bookmarked;
  };
  
  // פיצול של nodeId לפרוטוקול + node
  const parseNodeId = (nodeId: string): { protocolId: string; nodeKey: string } | null => {
    const parts = nodeId.split(':');
    if (parts.length !== 2) return null;
    return { protocolId: parts[0], nodeKey: parts[1] };
  };

  const parsed = parseNodeId(currentNodeId);
  const currentNode: Node | null = parsed 
    ? protocols[parsed.protocolId]?.nodes[parsed.nodeKey] 
    : null;

  const currentProtocol = parsed ? protocols[parsed.protocolId] : null;

  // ניווט לצומת הבא
  const navigateToNode = (nodeId: string) => {
    setHistory([...history, currentNodeId]);
    setCurrentNodeId(nodeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // חזור אחורה
  const goBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentNodeId(previous);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // התחל מחדש
  const restart = () => {
    setCurrentNodeId('unified_flow:report_departure');
    setHistory([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentNode || !currentProtocol) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10" dir="rtl">
        <div className="surface-card-strong w-full max-w-md rounded-3xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">לא נמצא צומת: {currentNodeId}</p>
          <button
            onClick={restart}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            התחל מחדש
          </button>
        </div>
      </div>
    );
  }

  // צבעים לפי חומרה
  const severityConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-900', icon: '🚨' },
    urgent: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-900', icon: '⚠️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900', icon: '⚡' },
    stable: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-900', icon: '✅' },
    normal: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', icon: 'ℹ️' },
  };

  const severity = currentNode.severity || 'normal';
  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.normal;

  // קבלת אפשרויות הבאות
  const getNextOptions = (): Array<{ label: string; target: string }> => {
    // אם יש actions (כפתורים לניווט)
    if (currentNode.content?.actions && currentNode.content.actions.length > 0) {
      return currentNode.content.actions.map(action => ({
        label: action.label,
        target: action.target.includes(':') ? action.target : `${parsed!.protocolId}:${action.target}`
      }));
    }
    
    // אם יש conditions (decision node עם תנאים)
    if (currentNode.conditions && currentNode.conditions.length > 0) {
      return currentNode.conditions.map(cond => ({
        label: cond.label,
        target: cond.target.includes(':') ? cond.target : `${parsed!.protocolId}:${cond.target}`
      }));
    }
    
    // אם יש options (decision node)
    if (currentNode.options && currentNode.options.length > 0) {
      return currentNode.options.map(opt => ({
        label: opt.label,
        target: opt.target.includes(':') ? opt.target : `${parsed!.protocolId}:${opt.target}`
      }));
    }
    
    // אם יש next רגיל
    if (currentNode.next) {
      const nextNodeKey = typeof currentNode.next === 'string' ? currentNode.next : currentNode.next[0];
      const nextNodeId = `${parsed!.protocolId}:${nextNodeKey}`;
      const nextNode = protocols[parsed!.protocolId]?.nodes[nextNodeKey];
      
      return [{
        label: nextNode?.title || 'המשך',
        target: nextNodeId
      }];
    }

    return [];
  };

  const nextOptions = getNextOptions();

  // קפיצה ישירה לצומת + שמירה בהיסטוריה
  const jumpToNode = (nodeId: string) => {
    if (nodeId !== currentNodeId) {
      setHistory([...history, currentNodeId]);
      setCurrentNodeId(nodeId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSidebarOpen(false); // סגור את הסרגל אחרי קפיצה
    }
  };

  return (
    <div className="app-shell px-3 py-4 sm:px-5 sm:py-6 lg:px-8" dir="rtl">
      {/* overlay כהה כשהסרגל פתוח */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* סרגל צד מתקפל */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-50 w-full sm:w-96 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* כותרת סרגל */}
          <div className="bg-gradient-to-l from-purple-600 to-blue-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl">🔖</span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">הסימניות שלי</h2>
                <p className="text-xs sm:text-sm text-white/80">
                  {bookmarkedNodes.size} {bookmarkedNodes.size === 1 ? 'סימניה' : 'סימניות'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-white/20 rounded-lg p-2 sm:p-2.5 transition-colors text-xl"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>

          {/* תוכן סרגל - גלילה */}
          <div className="flex-1 overflow-y-auto">
            {getBookmarkedNodesList().length === 0 ? (
              // מסך ריק - הסבר איך להוסיף
              <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
                <div className="text-6xl sm:text-7xl mb-4 sm:mb-6">☆</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">
                  אין סימניות עדיין
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed max-w-xs">
                  כדי להוסיף סימניה, לחץ על כפתור הכוכב (☆) בחלק העליון של כל צומת
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 max-w-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">💡</span>
                    <span className="font-bold text-blue-900 text-sm sm:text-base">טיפ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-800 text-right">
                    סמן צמתים שאתה חוזר אליהם לעתים קרובות לגישה מהירה ונוחה
                  </p>
                </div>
              </div>
            ) : (
              // רשימת סימניות
              <div className="p-3 sm:p-4 space-y-2">
                {getBookmarkedNodesList().map((node) => {
                  const isCurrent = node.id === currentNodeId;
                  
                  return (
                    <div
                      key={node.id}
                      className={`group relative rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        <button
                          onClick={() => toggleBookmark(node.id)}
                          className="text-xl sm:text-2xl transition-transform hover:scale-110 text-yellow-500 flex-shrink-0"
                          title="הסר סימניה"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => jumpToNode(node.id)}
                          className="flex-1 text-right"
                        >
                          <div className="font-medium text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors">
                            {node.label}
                          </div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {node.nodeKey}
                          </div>
                        </button>
                        {isCurrent && (
                          <div className="flex-shrink-0 text-blue-600 text-sm sm:text-base font-bold">
                            ←
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* הסבר תחתון */}
          <div className="bg-gradient-to-t from-gray-100 to-gray-50 p-3 sm:p-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
              <span className="text-base sm:text-lg flex-shrink-0">ℹ️</span>
              <div className="space-y-1">
                <p>⭐ לחץ להסרת סימניה</p>
                <p>☆ לחץ בצומת להוספת סימניה</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* כותרת עליונה */}
      <div className="mx-auto mb-4 w-full max-w-5xl sm:mb-6">
        <div className="surface-card rounded-3xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="clinical-kicker">
                <span>{history.length + 1} צעד</span>
              </div>
              <div className="rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] text-white shadow-sm sm:text-xs">
                ID: {currentNode.id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            <button
              onClick={goBack}
              disabled={history.length === 0}
              className="flex min-w-0 items-center justify-center gap-1 rounded-2xl bg-gray-200 px-3 py-2 text-sm transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 sm:justify-start"
            >
              <span>←</span>
              <span className="hidden sm:inline">חזור</span>
            </button>
            <button
              onClick={restart}
              className="flex min-w-0 items-center justify-center gap-1 rounded-2xl bg-clinical-blue px-3 py-2 text-sm text-white transition-colors hover:bg-clinical-deep sm:justify-start"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">התחל מחדש</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex min-w-0 items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-purple-600 to-clinical-blue px-3 py-2 text-sm text-white transition-all hover:shadow-lg sm:justify-start"
              title="פתח סימניות"
            >
              <span className="text-base">🔖</span>
              <span className="hidden sm:inline">סימניות</span>
              {bookmarkedNodes.size > 0 && (
                <span className="bg-white text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {bookmarkedNodes.size}
                </span>
              )}
            </button>
            <button
              onClick={() => toggleBookmark(currentNodeId)}
              className={`col-span-2 flex min-w-0 items-center justify-center gap-1 rounded-2xl px-3 py-2 text-sm transition-all sm:col-auto sm:justify-start ${
                bookmarkedNodes.has(currentNodeId)
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={bookmarkedNodes.has(currentNodeId) ? 'הסר סימניה' : 'הוסף סימניה'}
            >
              <span className="text-lg">{bookmarkedNodes.has(currentNodeId) ? '⭐' : '☆'}</span>
              <span className="hidden sm:inline text-xs">סמן</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* תוכן הצומת */}
      <div className="mx-auto w-full max-w-5xl">
        <div className={`surface-card-strong overflow-hidden rounded-[28px] border-[3px] ${config.border}`}>
          {/* כותרת */}
          <div className={`${config.bg} border-b-[3px] ${config.border} p-4 sm:p-6 lg:p-8`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="text-3xl sm:text-5xl">{config.icon}</div>
              <div className="flex-1">
                <h1 className={`font-display text-2xl font-extrabold sm:text-3xl md:text-4xl ${config.text} mb-1 sm:mb-2`}>
                  {currentNode.title}
                </h1>
                {currentNode.description && (
                  <p className={`max-w-3xl text-base leading-7 sm:text-lg ${config.text} opacity-80`}>
                    {currentNode.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* תוכן */}
          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
            {/* checkMethod */}
            {currentNode.content?.checkMethod && (
              <div className="bg-blue-50 rounded-lg border-l-4 border-blue-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('checkMethod')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-blue-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>🔍</span>
                    <span>איך לבדוק</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('checkMethod') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('checkMethod') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-blue-200">
                    <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                      {currentNode.content.checkMethod}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* about */}
            {currentNode.content?.about && (
              <div className="bg-indigo-50 rounded-lg border-l-4 border-indigo-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('about')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-indigo-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>ℹ️</span>
                    <span>הסבר</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('about') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('about') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-indigo-200">
                    {Array.isArray(currentNode.content.about) ? (
                      <ul className="space-y-2">
                        {currentNode.content.about.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                        {currentNode.content.about}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* whatToLookFor */}
            {currentNode.content?.whatToLookFor && (
              <div className="bg-purple-50 rounded-lg border-l-4 border-purple-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('whatToLookFor')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-purple-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>👀</span>
                    <span>על מה לשים לב</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('whatToLookFor') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('whatToLookFor') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-purple-200">
                    {Array.isArray(currentNode.content.whatToLookFor) ? (
                      <ul className="space-y-2">
                        {currentNode.content.whatToLookFor.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-purple-500 font-bold">•</span>
                            <span className="text-sm sm:text-base text-gray-800 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                        {currentNode.content.whatToLookFor}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* assessment */}
            {currentNode.content?.assessment && (
              <div className="bg-rose-50 rounded-lg border-l-4 border-rose-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('assessment')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-rose-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>✅</span>
                    <span>הערכה</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('assessment') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('assessment') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-rose-200">
                    {Array.isArray(currentNode.content.assessment) ? (
                      <ul className="space-y-2">
                        {currentNode.content.assessment.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-rose-500 font-bold">•</span>
                            <span className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                        {currentNode.content.assessment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* explanation */}
            {currentNode.content?.explanation && (
              <div className="bg-amber-50 rounded-lg border-l-4 border-amber-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('explanation')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-amber-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>💡</span>
                    <span>הסבר מתקדם</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('explanation') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('explanation') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-amber-200 space-y-4">
                    {typeof currentNode.content.explanation === 'object' && !Array.isArray(currentNode.content.explanation) ? (
                      <>
                        {currentNode.content.explanation.title && (
                          <h4 className="font-bold text-lg text-amber-900">{currentNode.content.explanation.title}</h4>
                        )}
                        
                        {currentNode.content.explanation.clinical && (
                          <div className="space-y-2">
                            <h5 className="font-semibold text-amber-800 flex items-center gap-2">
                              <span>🏥</span> <span>מצב קליני</span>
                            </h5>
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">
                              {currentNode.content.explanation.clinical}
                            </p>
                          </div>
                        )}
                        
                        {currentNode.content.explanation.theoretical && (
                          <div className="space-y-2">
                            <h5 className="font-semibold text-amber-800 flex items-center gap-2">
                              <span>🧠</span> <span>הסבר תיאורטי</span>
                            </h5>
                            <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">
                              {currentNode.content.explanation.theoretical}
                            </p>
                          </div>
                        )}
                        
                        {currentNode.content.explanation.urgency && (
                          <div className="space-y-2">
                            <h5 className="font-semibold text-red-700 flex items-center gap-2">
                              <span>🚨</span> <span>דחיפות</span>
                            </h5>
                            <p className="text-sm sm:text-base text-red-800 leading-relaxed whitespace-pre-line bg-red-100 p-3 rounded">
                              {currentNode.content.explanation.urgency}
                            </p>
                          </div>
                        )}
                      </>
                    ) : Array.isArray(currentNode.content.explanation) ? (
                      <ul className="space-y-2">
                        {currentNode.content.explanation.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-amber-600 font-bold">•</span>
                            <span className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                        {currentNode.content.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* treatment */}
            {currentNode.content?.treatment && (
              <div className="bg-green-50 rounded-lg border-l-4 border-green-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('treatment')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-green-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>💊</span>
                    <span>טיפול</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('treatment') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('treatment') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-green-200">
                    {Array.isArray(currentNode.content.treatment) ? (
                      <ul className="space-y-2">
                        {currentNode.content.treatment.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 sm:gap-3">
                            <span className="text-green-500 font-bold">•</span>
                            <span className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                        {currentNode.content.treatment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* equipment */}
            {currentNode.content?.equipment && currentNode.content.equipment.length > 0 && (
              <div className="bg-orange-50 rounded-lg border-l-4 border-orange-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('equipment')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-orange-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>🧰</span>
                    <span>ציוד נדרש</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('equipment') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('equipment') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-orange-200">
                    <div className="flex flex-wrap gap-2">
                      {currentNode.content.equipment.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-white rounded-full border-2 border-orange-300 text-gray-800 font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* questions */}
            {currentNode.content?.questions && currentNode.content.questions.length > 0 && (
              <div className="bg-yellow-50 rounded-lg border-l-4 border-yellow-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('questions')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-yellow-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>❓</span>
                    <span>שאלות לשאול</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('questions') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('questions') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-yellow-200">
                    <ul className="space-y-2">
                      {currentNode.content.questions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-3">
                          <span className="text-yellow-600 font-bold">•</span>
                          <span className="text-sm sm:text-base text-gray-800 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* vitals/metrics */}
            {currentNode.content?.vitals && currentNode.content.vitals.length > 0 && (
              <div className="bg-cyan-50 rounded-lg border-l-4 border-cyan-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('vitals')}
                  className="flex w-full items-center justify-between gap-3 p-4 transition-colors hover:bg-cyan-100 sm:p-5"
                >
                  <h3 className="flex min-w-0 items-center gap-2 text-right text-lg font-bold sm:text-xl">
                    <span>📊</span>
                    <span>מדדים</span>
                  </h3>
                  <span className="text-xl transition-transform" style={{
                    transform: collapsedSections.has('vitals') ? 'rotate(-90deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </button>
                {!collapsedSections.has('vitals') && (
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-cyan-200">
                    <ul className="space-y-2">
                      {currentNode.content.vitals.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 sm:gap-3">
                          <span className="text-cyan-600 font-bold">•</span>
                          <span className="text-sm sm:text-base text-gray-800 leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <CommentsThread
              nodeId={currentNodeId}
              title="דיון והערות על הצומת"
            />
          </div>

          {/* כפתורי המשך */}
          <div className={`${config.bg} border-t-[3px] ${config.border} p-4 sm:p-6 lg:p-8`}>
            {nextOptions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="mb-3 text-center font-display text-lg font-extrabold sm:mb-4 sm:text-xl">מה הלאה?</h3>
                <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2">
                  {nextOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateToNode(option.target)}
                      className="w-full rounded-2xl border-2 border-gray-300 bg-white px-4 py-3 font-bold text-gray-900 shadow-md transition-all hover:border-clinical-blue hover:bg-gray-50 hover:shadow-xl sm:px-6 sm:py-4"
                    >
                      <span className="text-base sm:text-lg">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="font-bold text-2xl mb-2">סיום פרוטוקול</h3>
                <p className="text-gray-600 mb-4">הגעת לסוף הפרוטוקול</p>
                <button
                  onClick={restart}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
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
