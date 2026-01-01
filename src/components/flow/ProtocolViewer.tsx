import { useEffect } from 'react';
import type { Protocol } from '../../types/protocol';
import { useFlowStore } from '../../store/flowStore';
import { FlowNode } from './FlowNode';
import { FlowNavigation } from './FlowNavigation';

interface ProtocolViewerProps {
  protocol: Protocol;
}

/**
 * קומפוננטת ProtocolViewer - תצוגה מלאה של פרוטוקול
 * 
 * מנהלת:
 * - הצגת הצומת הנוכחי
 * - ניווט בין צמתים
 * - היסטוריית מסלול
 * - איפוס ואתחול
 */
export function ProtocolViewer({ protocol }: ProtocolViewerProps) {
  console.log('[ProtocolViewer] Rendering with protocol:', protocol);
  const {
    currentNode,
    navigationHistory,
    navigateToNode,
    goBack,
    reset,
  } = useFlowStore();
  console.log('[ProtocolViewer] currentNode:', currentNode);

  // אתחול - מעבר לצומת ההתחלה
  useEffect(() => {
    console.log('[ProtocolViewer useEffect] protocol.startNode:', protocol.startNode, 'currentNode:', currentNode);
    if (!currentNode && protocol.startNode) {
      navigateToNode(protocol.startNode);
    }
  }, [protocol.startNode, currentNode, navigateToNode]);

  // טיפול במקרה שאין צומת נוכחי
  if (!currentNode) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרוטוקול...</p>
        </div>
      </div>
    );
  }

  // בדיקה שהצומת קיים בפרוטוקול
  const nodeExists = protocol.nodes[currentNode.id];
  if (!nodeExists) {
    return (
      <div className="bg-red-50 border-r-4 border-red-500 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-red-900 mb-2">❌ שגיאה</h3>
        <p className="text-red-800">
          הצומת "{currentNode.id}" לא נמצא בפרוטוקול "{protocol.name}"
        </p>
        <button
          onClick={reset}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          חזור להתחלה
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <FlowNavigation
        protocol={protocol}
        currentNodeId={currentNode.id}
        navigationHistory={navigationHistory}
        onBack={goBack}
        onReset={reset}
      />

      {/* Current Node Display */}
      <FlowNode
        node={currentNode}
        onNavigate={navigateToNode}
      />

      {/* End State Message */}
      {currentNode.type === 'end' && (
        <div className="bg-green-50 border-r-4 border-green-500 p-6 rounded-lg text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-green-900 mb-2">
            הפרוטוקול הושלם
          </h3>
          <p className="text-green-800 mb-4">
            סיימת את מסלול "{protocol.name}"
          </p>
          <button
            onClick={reset}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            התחל פרוטוקול מחדש
          </button>
        </div>
      )}
    </div>
  );
}
