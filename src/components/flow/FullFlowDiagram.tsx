import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  type Node as FlowNode,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Protocol } from '../../types/protocol';
import { CustomNode } from './CustomNode';

interface FullFlowDiagramProps {
  protocols: Record<string, Protocol>;
  onNodeClick?: (nodeId: string) => void;
}

const nodeTypes = {
  custom: CustomNode,
};

/**
 * קומפוננטת FullFlowDiagram - תצוגת תרשים זרימה מלא
 * כל הצמתים מכל הפרוטוקולים מוצגים יחד במסך אחד עם React Flow
 */
export function FullFlowDiagram({ protocols, onNodeClick }: FullFlowDiagramProps) {
  // State לניהול צמתים מוסתרים
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  
  // הגדרת קבוצות צמתים לפי קטגוריות
  const nodeCategories = useMemo(() => {
    const categories: Record<string, { label: string; nodeIds: string[] }> = {};
    
    Object.entries(protocols).forEach(([protocolId, protocol]) => {
      Object.entries(protocol.nodes).forEach(([nodeId, _node]) => {
        const fullNodeId = `${protocolId}:${nodeId}`;
        
        // זיהוי קטגוריה לפי prefix של ה-nodeId
        if (nodeId.startsWith('safety')) {
          if (!categories['safety']) categories['safety'] = { label: 'S - Safety', nodeIds: [] };
          categories['safety'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('scene_')) {
          if (!categories['scene']) categories['scene'] = { label: 'Scene Assessment', nodeIds: [] };
          categories['scene'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('x_') || nodeId.includes('bleeding') || nodeId.includes('tourniquet')) {
          if (!categories['exsanguination']) categories['exsanguination'] = { label: 'X - Exsanguination', nodeIds: [] };
          categories['exsanguination'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('avpu') || nodeId.includes('voice_check') || nodeId.includes('pain_check') || nodeId.includes('unresponsive')) {
          if (!categories['avpu']) categories['avpu'] = { label: 'AVPU', nodeIds: [] };
          categories['avpu'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('cpr') || nodeId.includes('defib') || nodeId.includes('rosc') || nodeId.includes('compressions') || nodeId.includes('ventilations')) {
          if (!categories['cpr']) categories['cpr'] = { label: 'CPR Protocol', nodeIds: [] };
          categories['cpr'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('airway') || nodeId.includes('choking') || nodeId.includes('suction') || nodeId.includes('tongue') || nodeId.includes('anaphylaxis_airway') || nodeId.includes('trauma_airway')) {
          if (!categories['airway']) categories['airway'] = { label: 'A - Airway', nodeIds: [] };
          categories['airway'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('breathing') || nodeId.startsWith('respiratory')) {
          if (!categories['breathing']) categories['breathing'] = { label: 'B - Breathing', nodeIds: [] };
          categories['breathing'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('circulation') || nodeId.startsWith('shock')) {
          if (!categories['circulation']) categories['circulation'] = { label: 'C - Circulation', nodeIds: [] };
          categories['circulation'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('disability') || nodeId.startsWith('neuro')) {
          if (!categories['disability']) categories['disability'] = { label: 'D - Disability', nodeIds: [] };
          categories['disability'].nodeIds.push(fullNodeId);
        } else if (nodeId.startsWith('exposure') || nodeId.startsWith('environment')) {
          if (!categories['exposure']) categories['exposure'] = { label: 'E - Exposure', nodeIds: [] };
          categories['exposure'].nodeIds.push(fullNodeId);
        }
      });
    });
    
    return categories;
  }, [protocols]);
  
  // פונקציה לקבלת כל הצאצאים של צומת
  const getNodeDescendants = useCallback((nodeId: string, _allNodes: FlowNode[], allEdges: Edge[]): Set<string> => {
    const descendants = new Set<string>();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      // מצא את כל הקצוות שיוצאים מהצומת הנוכחי
      const outgoingEdges = allEdges.filter(edge => edge.source === currentId);
      
      outgoingEdges.forEach(edge => {
        if (!descendants.has(edge.target)) {
          descendants.add(edge.target);
          queue.push(edge.target);
        }
      });
    }
    
    return descendants;
  }, []);
  
  // פונקציה לטיפול בלחיצה על כפתור הסגירה/פתיחה
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);
  
  // פונקציה לטיפול בלחיצה על כפתור קטגוריה - מקפל/פורס את כל הצמתים בקבוצה
  const handleToggleCategory = useCallback((categoryKey: string) => {
    const category = nodeCategories[categoryKey];
    if (!category) return;
    
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      const allCollapsed = category.nodeIds.every(id => newSet.has(id));
      
      if (allCollapsed) {
        // אם כולם מקופלים - פרוס אותם
        category.nodeIds.forEach(id => newSet.delete(id));
      } else {
        // אחרת - קפל את כולם
        category.nodeIds.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
  }, [nodeCategories]);
  
  // המרת הצמתים מכל הפרוטוקולים לפורמט של React Flow
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const nodes: FlowNode[] = [];
    const edges: Edge[] = [];
    
    // מיפוי צבעים לפי severity
    const severityColors = {
      critical: '#fee2e2',
      urgent: '#ffedd5',
      warning: '#fef3c7',
      stable: '#dcfce7',
      normal: '#dbeafe',
    };
    
    const borderColors = {
      critical: '#dc2626',
      urgent: '#ea580c',
      warning: '#ca8a04',
      stable: '#16a34a',
      normal: '#2563eb',
    };

    // בניית הצמתים מכל הפרוטוקולים
    let globalIndex = 0;
    
    // פונקציה למציאת קטגוריה של צומת
    const getNodeCategory = (fullNodeId: string): string | undefined => {
      for (const [categoryKey, category] of Object.entries(nodeCategories)) {
        if (category.nodeIds.includes(fullNodeId)) {
          return categoryKey;
        }
      }
      return undefined;
    };
    
    // עבור על כל הפרוטוקולים
    Object.entries(protocols).forEach(([protocolId, protocol]) => {
      Object.entries(protocol.nodes).forEach(([nodeId, node]) => {
        const severity = node.severity || 'normal';
        const fullNodeId = `${protocolId}:${nodeId}`;
        const categoryKey = getNodeCategory(fullNodeId);
        const categoryLabel = categoryKey ? nodeCategories[categoryKey]?.label : undefined;
        
        // חישוב מיקום אוטומטי עם מרווח גדול יותר
        const yPosition = globalIndex * 400;
        const xPosition = 100 + (globalIndex % 2) * 500;
        
        nodes.push({
          id: fullNodeId,
          type: 'custom',
          position: { x: xPosition, y: yPosition },
          data: {
            node,
            label: node.title,
            severity,
            protocolId,
            categoryLabel,
            onClick: () => onNodeClick?.(fullNodeId),
            onToggleCollapse: () => handleToggleCollapse(fullNodeId),
            isCollapsed: collapsedNodes.has(fullNodeId),
          },
          style: {
            background: severityColors[severity],
            border: `3px solid ${borderColors[severity]}`,
            borderRadius: '8px',
            padding: '0px',
            width: 420,
            minHeight: 200,
          },
        });
        
        globalIndex++;
      });
    });

    // בניית החיבורים (edges) מכל הפרוטוקולים
    Object.entries(protocols).forEach(([protocolId, protocol]) => {
      Object.entries(protocol.nodes).forEach(([nodeId, node]) => {
        const fullSourceId = `${protocolId}:${nodeId}`;
        
        // חיבור פשוט (next)
        if (node.next && typeof node.next === 'string') {
          let targetId = node.next;
          // אם ה-target לא מכיל ":", הוסף את ה-protocol id
          if (!targetId.includes(':')) {
            targetId = `${protocolId}:${targetId}`;
          }
          
          edges.push({
            id: `${fullSourceId}-${targetId}`,
            source: fullSourceId,
            target: targetId,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            style: { stroke: '#64748b', strokeWidth: 2 },
          });
        }
        
        // חיבורים מותנים (conditions)
        if (node.conditions) {
          node.conditions.forEach((condition, idx) => {
            let targetId = condition.target;
            // אם ה-target לא מכיל ":", הוסף את ה-protocol id
            if (!targetId.includes(':')) {
              targetId = `${protocolId}:${targetId}`;
            }
            
            const isYes = condition.label.includes('כן') || condition.label.includes('Yes');
            const isNo = condition.label.includes('לא') || condition.label.includes('No');
            
            edges.push({
              id: `${fullSourceId}-${targetId}-${idx}`,
              source: fullSourceId,
              target: targetId,
              type: 'smoothstep',
              animated: true,
              label: condition.label,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
              style: {
                stroke: isYes ? '#16a34a' : isNo ? '#dc2626' : '#2563eb',
                strokeWidth: 2,
              },
              labelStyle: {
                fill: '#1e293b',
                fontWeight: 600,
                fontSize: 12,
              },
              labelBgStyle: {
                fill: '#ffffff',
                fillOpacity: 0.9,
              },
            });
          });
        }
      });
    });

    return { nodes, edges };
  }, [protocols, onNodeClick, handleToggleCollapse, collapsedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // סינון צמתים וקצוות בהתאם למצב ה-collapse
  const visibleNodes = useMemo(() => {
    const hiddenDescendants = new Set<string>();
    
    // עבור על כל הצמתים המכווצים
    collapsedNodes.forEach(collapsedNodeId => {
      const descendants = getNodeDescendants(collapsedNodeId, flowNodes, flowEdges);
      descendants.forEach(desc => hiddenDescendants.add(desc));
    });
    
    // החזר רק צמתים שלא מוסתרים
    return flowNodes.map(node => ({
      ...node,
      hidden: hiddenDescendants.has(node.id),
    }));
  }, [flowNodes, flowEdges, collapsedNodes, getNodeDescendants]);
  
  // סינון קצוות - הסתר קצוות שהצמתים שלהם מוסתרים
  const visibleEdges = useMemo(() => {
    const hiddenNodeIds = new Set(visibleNodes.filter(n => n.hidden).map(n => n.id));
    
    return flowEdges.map(edge => ({
      ...edge,
      hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target),
    }));
  }, [flowEdges, visibleNodes]);
  
  // עדכון הצמתים כשיש שינוי ב-collapse
  useEffect(() => {
    setNodes(visibleNodes);
  }, [visibleNodes, setNodes]);
  
  useEffect(() => {
    setEdges(visibleEdges);
  }, [visibleEdges, setEdges]);

  return (
    <div className="w-full h-screen" dir="ltr">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        
        {/* פאנל מידע עליון */}
        <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg" dir="rtl">
          <h3 className="font-bold text-lg mb-2">תרשים זרימה מאוחד</h3>
          <p className="text-sm text-gray-600 mb-2">כל הפרוטוקולים במסך אחד</p>
          <div className="text-xs text-gray-500 mb-3">
            {Object.entries(protocols).map(([id, p]) => (
              <div key={id}>
                • {p.name}: {Object.keys(p.nodes).length} צמתים
              </div>
            ))}
            <div className="font-bold mt-1">
              סה"כ: {Object.values(protocols).reduce((sum, p) => sum + Object.keys(p.nodes).length, 0)} צמתים
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold mb-2">מקרא:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-200 border-2 border-red-600 rounded"></div>
                <span>קריטי</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-200 border-2 border-orange-600 rounded"></div>
                <span>דחוף</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 border-2 border-green-600 rounded"></div>
                <span>יציב</span>
              </div>
            </div>
          </div>
        </Panel>
        
        {/* פאנל כפתורי קטגוריות בתחתית */}
        <Panel position="bottom-center" className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-5xl" dir="rtl">
          <h3 className="font-bold text-sm mb-3 text-center">קיפול לפי קטגוריות 📁</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(nodeCategories).map(([categoryKey, category]) => {
              const allCollapsed = category.nodeIds.every(id => collapsedNodes.has(id));
              const someCollapsed = category.nodeIds.some(id => collapsedNodes.has(id));
              
              return (
                <button
                  key={categoryKey}
                  onClick={() => handleToggleCategory(categoryKey)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold text-sm transition-all
                    ${allCollapsed 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : someCollapsed
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }
                    shadow-md hover:shadow-lg
                  `}
                  title={`${category.nodeIds.length} צמתים`}
                >
                  <span className="mr-2">{allCollapsed ? '▶' : '▼'}</span>
                  {category.label}
                  <span className="mr-1 text-xs opacity-80">({category.nodeIds.length})</span>
                </button>
              );
            })}
          </div>
          <div className="text-center mt-3 text-xs text-gray-600">
            לחץ על קטגוריה כדי לקפל/לפרוס את כל הצמתים שלה
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
