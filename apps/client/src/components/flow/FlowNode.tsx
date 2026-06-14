import type { Node, SeverityLevel } from '../../types/protocol';

interface FlowNodeProps {
  node: Node;
  onNavigate: (nodeId: string) => void;
}

/**
 * קומפוננטת FlowNode - תצוגת צומת בודד בתרשים
 * 
 * מציגה:
 * - כותרת וסוג הצומת
 * - תיאור/תוכן
 * - קידוד צבע לפי חומרה
 * - כפתורי ניווט דינמיים
 */
export function FlowNode({ node, onNavigate }: FlowNodeProps) {
  // קביעת צבעים לפי severity
  const severityStyles: Record<SeverityLevel, string> = {
    critical: 'bg-red-50 border-red-500 text-red-900',
    urgent: 'bg-orange-50 border-orange-500 text-orange-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    stable: 'bg-green-50 border-green-500 text-green-900',
    normal: 'bg-blue-50 border-blue-500 text-blue-900',
  };

  // קביעת אייקון לפי סוג צומת
  const nodeTypeIcons: Record<Node['type'], string> = {
    start: '🏁',
    decision: '❓',
    check: '🔍',
    question: '💬',
    action: '⚡',
    diagnosis: '🩺',
    info: 'ℹ️',
    end: '✅',
  };

  // קביעת תווית לסוג צומת בעברית
  const nodeTypeLabels: Record<Node['type'], string> = {
    start: 'התחלה',
    decision: 'החלטה',
    check: 'בדיקה',
    question: 'שאלה',
    action: 'פעולה',
    diagnosis: 'אבחנה',
    info: 'מידע',
    end: 'סיום',
  };

  const severity = node.severity || 'normal';
  const styleClass = severityStyles[severity];
  const icon = nodeTypeIcons[node.type];
  const typeLabel = nodeTypeLabels[node.type];

  return (
    <div className={`rounded-lg border-r-4 p-6 shadow-lg ${styleClass} transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="text-xs font-semibold opacity-70 mb-1">{typeLabel}</div>
            <h2 className="text-2xl font-bold">{node.title}</h2>
          </div>
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-base leading-relaxed mb-6 opacity-90">
          {node.description}
        </p>
      )}

      {/* Content - תוכן ספציפי לפי סוג הצומת */}
      {node.content && (
        <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6 space-y-3">
          {/* Check Method */}
          {node.content.checkMethod && (
            <div>
              <div className="font-bold text-sm mb-1">שיטת בדיקה:</div>
              <div className="text-sm">{node.content.checkMethod}</div>
            </div>
          )}

          {/* What to look for */}
          {node.content.whatToLookFor && (
            <div>
              <div className="font-bold text-sm mb-1">על מה לשים לב:</div>
              {Array.isArray(node.content.whatToLookFor) ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {node.content.whatToLookFor.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm whitespace-pre-line">{node.content.whatToLookFor}</div>
              )}
            </div>
          )}

          {/* Equipment */}
          {node.content.equipment && node.content.equipment.length > 0 && (
            <div>
              <div className="font-bold text-sm mb-1">ציוד נדרש:</div>
              <div className="flex flex-wrap gap-2">
                {node.content.equipment.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-gray-700 text-white text-xs px-3 py-1 rounded-full"
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
              <div className="font-bold text-sm mb-2">שאלות לשאול:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {node.content.questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Treatment */}
          {node.content.treatment && (
            <div>
              <div className="font-bold text-sm mb-1">טיפול:</div>
              <div className="text-sm whitespace-pre-line">{node.content.treatment}</div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="space-y-3">
        {/* Simple next button */}
        {node.next && typeof node.next === 'string' && (
          <button
            onClick={() => onNavigate(node.next as string)}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>המשך</span>
            <span>◀</span>
          </button>
        )}

        {/* Conditional navigation buttons */}
        {node.conditions && node.conditions.length > 0 && (
          <div className="space-y-2">
            {node.conditions.map((condition, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(condition.target)}
                className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                  condition.label.includes('כן') || condition.label.includes('Yes')
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : condition.label.includes('לא') || condition.label.includes('No')
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>{condition.label}</span>
                <span>◀</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Node ID - debug info */}
      <div className="mt-4 pt-4 border-t border-gray-300 opacity-50">
        <div className="text-xs font-mono">ID: {node.id}</div>
      </div>
    </div>
  );
}
