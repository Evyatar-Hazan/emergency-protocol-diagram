import type { Protocol } from '../../types/protocol';

interface FlowNavigationProps {
  protocol: Protocol | null;
  currentNodeId: string | null;
  navigationHistory: string[];
  onBack: () => void;
  onReset: () => void;
}

/**
 * קומפוננטת FlowNavigation - ניווט וניהול מסלול
 * 
 * מציגה:
 * - כפתור חזרה
 * - breadcrumb trail (היסטוריית ניווט)
 * - מידע על הפרוטוקול הנוכחי
 * - כפתור איפוס
 */
export function FlowNavigation({
  protocol,
  currentNodeId,
  navigationHistory,
  onBack,
  onReset,
}: FlowNavigationProps) {
  if (!protocol) return null;

  const canGoBack = navigationHistory.length > 1;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      {/* Top Row: Protocol Info + Actions */}
      <div className="flex items-center justify-between mb-4">
        {/* Protocol Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-800">{protocol.name}</h3>
          <p className="text-sm text-gray-600">{protocol.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onBack}
            disabled={!canGoBack}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              canGoBack
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title="חזור לצומת הקודם"
          >
            ⬅ חזרה
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
            title="התחל מחדש מתחילת הפרוטוקול"
          >
            🔄 התחל מחדש
          </button>
        </div>
      </div>

      {/* Breadcrumb Trail */}
      {navigationHistory.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
            מסלול:
          </span>
          <div className="flex items-center gap-2">
            {navigationHistory.map((nodeId, index) => {
              const separatorIndex = nodeId.indexOf(':');
              const historyProtocolId = nodeId.slice(0, separatorIndex);
              const historyNodeId = nodeId.slice(separatorIndex + 1);
              const node = historyProtocolId === protocol.id ? protocol.nodes[historyNodeId] : null;
              const isLast = index === navigationHistory.length - 1;
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      isLast
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    title={node?.title || historyNodeId}
                  >
                    {node?.title || historyNodeId}
                  </span>
                  {!isLast && <span className="text-gray-400">◀</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs">
          <span className="font-semibold text-gray-600">צעדים:</span>{' '}
          <span className="font-bold text-blue-600">{navigationHistory.length}</span>
        </div>
        <div className="text-xs">
          <span className="font-semibold text-gray-600">צומת נוכחי:</span>{' '}
          <span className="font-mono text-gray-800">{currentNodeId}</span>
        </div>
        <div className="text-xs">
          <span className="font-semibold text-gray-600">גרסה:</span>{' '}
          <span className="text-gray-800">{protocol.version}</span>
        </div>
      </div>
    </div>
  );
}
