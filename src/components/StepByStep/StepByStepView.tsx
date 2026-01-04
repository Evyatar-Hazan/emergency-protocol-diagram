import { useState } from 'react';
import type { Protocol, Node } from '../../types/protocol';

interface StepByStepViewProps {
  protocols: Record<string, Protocol>;
}

export const StepByStepView = ({ protocols }: StepByStepViewProps) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('unified_flow:report_departure');
  const [history, setHistory] = useState<string[]>([]);
  
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

  return (
    <div className={`min-h-screen ${config.bg} p-4 md:p-8`} dir="rtl">
      {/* כותרת עליונה */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600">
            צעד {history.length + 1}
          </div>
        </div>
      </div>

      {/* תוכן הצומת */}
      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl border-3 sm:border-4 ${config.border} overflow-hidden relative`}>
          {/* תג ID בפינה */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gray-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-mono shadow-lg z-10">
            ID: {currentNode.id}
          </div>

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
              <div className="bg-blue-50 rounded-lg p-4 sm:p-5 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center gap-2">
                  <span>🔍</span>
                  <span>איך לבדוק</span>
                </h3>
                <p className="whitespace-pre-line text-sm sm:text-base text-gray-800 leading-relaxed">
                  {currentNode.content.checkMethod}
                </p>
              </div>
            )}

            {/* whatToLookFor */}
            {currentNode.content?.whatToLookFor && (
              <div className="bg-purple-50 rounded-lg p-4 sm:p-5 border-l-4 border-purple-500">
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center gap-2">
                  <span>👀</span>
                  <span>על מה לשים לב</span>
                </h3>
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

            {/* treatment */}
            {currentNode.content?.treatment && (
              <div className="bg-green-50 rounded-lg p-4 sm:p-5 border-l-4 border-green-500">
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center gap-2">
                  <span>💊</span>
                  <span>טיפול</span>
                </h3>
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

            {/* equipment */}
            {currentNode.content?.equipment && currentNode.content.equipment.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 sm:p-5 border-l-4 border-orange-500">
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center gap-2">
                  <span>🧰</span>
                  <span>ציוד נדרש</span>
                </h3>
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

            {/* questions */}
            {currentNode.content?.questions && currentNode.content.questions.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 sm:p-5 border-l-4 border-yellow-500">
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 flex items-center gap-2">
                  <span>❓</span>
                  <span>שאלות לשאול</span>
                </h3>
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
