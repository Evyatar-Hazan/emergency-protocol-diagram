import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { Node } from '../../types/protocol';
import { ADVANCED_REFERENCE_SCOPE, isAdvancedReferenceNode } from '../../protocols/advancedReferences';

interface CustomNodeProps {
  data: {
    node: Node;
    label: string;
    severity: string;
    protocolId?: string;
    categoryLabel?: string;
    isHeaderNode?: boolean;
    parentHeaderId?: string;
    onClick?: () => void;
    onToggleCollapse?: () => void;
    isCollapsed?: boolean;
  };
}

/**
 * קומפוננטת CustomNode - צומת מותאם אישית לתרשים הזרימה
 */
export const CustomNode = memo(({ data }: CustomNodeProps) => {
  const { node, isHeaderNode, onToggleCollapse, isCollapsed } = data;
  const isAdvancedReference = Boolean(
    data.protocolId && isAdvancedReferenceNode(data.protocolId, node.id),
  );
  
  // אם זה צומת כותרת - הצג עיצוב מיוחד
  if (isHeaderNode) {
    return (
      <div className="relative" dir="rtl">
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse?.();
          }}
          className="w-full cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{isCollapsed ? '▶️' : '🔽'}</span>
                <div>
                  <div className="font-bold text-2xl leading-tight">
                    {node.title}
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    {node.description}
                  </div>
                </div>
              </div>
              <div className="text-5xl opacity-50">
                {isCollapsed ? '📁' : '📂'}
              </div>
            </div>
          </div>
        </button>
        
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      </div>
    );
  }
  
  // צומת רגיל - המשתנים כבר מפורקים למעלה
  
  // אייקונים לפי סוג
  const icons: Record<Node['type'], string> = {
    start: '🏁',
    decision: '❓',
    check: '🔍',
    question: '💬',
    action: '⚡',
    diagnosis: '🩺',
    info: 'ℹ️',
    end: '✅',
  };
  
  const typeLabels: Record<Node['type'], string> = {
    start: 'התחלה',
    decision: 'החלטה',
    check: 'בדיקה',
    question: 'שאלה',
    action: 'פעולה',
    diagnosis: 'אבחנה',
    info: 'מידע',
    end: 'סיום',
  };

  return (
    <div className="relative" dir="rtl">
      <Handle type="target" position={Position.Top} />
      
      {/* כפתור כיווץ/פתיחה */}
      {(node.next || node.conditions) && onToggleCollapse && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="absolute -top-2 -left-2 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all"
          title={isCollapsed ? "הצג צמתים מתחת" : "הסתר צמתים מתחת"}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      )}
      
      <div className="p-4 min-w-[350px] max-w-[450px]">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <span className="text-3xl">{icons[node.type]}</span>
          <div className="flex-1">
            <div className="text-xs font-semibold opacity-70 mb-1">
              {isAdvancedReference ? ADVANCED_REFERENCE_SCOPE.badge : typeLabels[node.type]}
            </div>
            <div className="font-bold text-base leading-tight">
              {node.title}
            </div>
          </div>
        </div>

        {isAdvancedReference && (
          <div className="mb-3 rounded border border-violet-300 bg-violet-50 p-2 text-xs leading-relaxed text-violet-950">
            {ADVANCED_REFERENCE_SCOPE.title}. אינו מסלול פעולה, כלי אבחון או אישור קליני.
          </div>
        )}

        {/* Description */}
        {node.description && (
          <p className="text-sm text-gray-800 leading-relaxed mb-3 bg-white bg-opacity-50 p-2 rounded">
            {node.description}
          </p>
        )}

        {/* Content - Full Details */}
        {node.content && (
          <div className="space-y-2 text-xs bg-white bg-opacity-50 p-3 rounded">
            {/* Check Method */}
            {node.content.checkMethod && (
              <div>
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  🔍 <span>שיטת בדיקה:</span>
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-line text-gray-800">
                  {node.content.checkMethod}
                </div>
              </div>
            )}

            {/* What to Look For */}
            {node.content.whatToLookFor && (
              <div>
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  👁️ <span>על מה לשים לב:</span>
                </div>
                {Array.isArray(node.content.whatToLookFor) ? (
                  <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-800">
                    {node.content.whatToLookFor.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs leading-relaxed whitespace-pre-line text-gray-800">
                    {node.content.whatToLookFor}
                  </div>
                )}
              </div>
            )}

            {/* Equipment */}
            {node.content.equipment && node.content.equipment.length > 0 && (
              <div>
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  🎒 <span>ציוד נדרש:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {node.content.equipment.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            {node.content.questions && node.content.questions.length > 0 && (
              <div>
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  💬 <span>שאלות לשאול:</span>
                </div>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-800">
                  {node.content.questions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Treatment */}
            {node.content.treatment && (
              <div>
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  ⚡ <span>טיפול:</span>
                </div>
                {Array.isArray(node.content.treatment) ? (
                  <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-800 bg-yellow-50 p-2 rounded">
                    {node.content.treatment.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs leading-relaxed whitespace-pre-line text-gray-800 bg-yellow-50 p-2 rounded">
                    {node.content.treatment}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Node ID */}
        <div className="text-[10px] font-mono text-gray-400 mt-2 opacity-50">
          {node.id}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
