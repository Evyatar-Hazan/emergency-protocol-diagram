import { useState, useEffect } from 'react';
import type { Protocol, Node } from '../../types/protocol';

interface StepByStepViewProps {
  protocols: Record<string, Protocol>;
}

export const StepByStepView = ({ protocols }: StepByStepViewProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('unified_flow:report_departure');
  const [history, setHistory] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [bookmarkedNodes, setBookmarkedNodes] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // טען סימניות מ-localStorage
  useEffect(() => {
    const saved = localStorage.getItem('protocol-bookmarks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookmarkedNodes(new Set(parsed));
      } catch (e) {
        console.error('Failed to load bookmarks', e);
      }
    }
  }, []);

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
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
    <div className={`min-h-screen ${config.bg} p-4 md:p-8`} dir="rtl">
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
      <div className="max-w-4xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={goBack}
              disabled={history.length === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>←</span>
              <span className="hidden sm:inline">חזור</span>
            </button>
            <button
              onClick={restart}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">התחל מחדש</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
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
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-all ${
                bookmarkedNodes.has(currentNodeId)
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={bookmarkedNodes.has(currentNodeId) ? 'הסר סימניה' : 'הוסף סימניה'}
            >
              <span className="text-lg">{bookmarkedNodes.has(currentNodeId) ? '⭐' : '☆'}</span>
              <span className="hidden sm:inline text-xs">סמן</span>
            </button>
            <div className="bg-gray-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono">
              ID: {currentNode.id}
            </div>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            צעד {history.length + 1}
          </div>
        </div>
      </div>

      {/* תוכן הצומת */}
      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-3 sm:border-4 ${config.border} overflow-hidden`}>
          {/* כותרת */}
          <div className={`${config.bg} border-b-3 sm:border-b-4 ${config.border} p-4 sm:p-6`}>
            <div className="flex items-start gap-3">
              <div className="text-3xl sm:text-5xl">{config.icon}</div>
              <div className="flex-1">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${config.text} mb-1 sm:mb-2`}>
                  {currentNode.title}
                </h1>
                {currentNode.description && (
                  <p className={`text-base sm:text-lg ${config.text} opacity-80`}>
                    {currentNode.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* תוכן */}
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            {/* checkMethod */}
            {currentNode.content?.checkMethod && (
              <div className="bg-blue-50 rounded-lg border-l-4 border-blue-500 overflow-hidden">
                <button
                  onClick={() => toggleSection('checkMethod')}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-indigo-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-purple-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-rose-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-amber-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-t border-amber-200">
                    {Array.isArray(currentNode.content.explanation) ? (
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-green-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-orange-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-yellow-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-cyan-100 transition-colors"
                >
                  <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
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
          </div>

          {/* כפתורי המשך */}
          <div className={`${config.bg} border-t-4 ${config.border} p-4 sm:p-6`}>
            {nextOptions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-center">מה הלאה?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {nextOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigateToNode(option.target)}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 px-4 sm:py-4 sm:px-6 rounded-lg sm:rounded-xl border-2 sm:border-3 border-gray-300 hover:border-blue-500 transition-all shadow-md sm:shadow-lg hover:shadow-xl transform hover:scale-105"
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
