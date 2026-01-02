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
    const headerNodeId = `header:${categoryKey}`;
    
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(headerNodeId)) {
        newSet.delete(headerNodeId);
      } else {
        newSet.add(headerNodeId);
      }
      return newSet;
    });
  }, []);
  
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

    // בניית מפת צמתים לפי קטגוריות
    const categorizedNodes: Record<string, { categoryLabel: string; nodes: Array<{ id: string; node: Node; protocolId: string }> }> = {};
    
    Object.entries(protocols).forEach(([protocolId, protocol]) => {
      Object.entries(protocol.nodes).forEach(([nodeId, node]) => {
        const fullNodeId = `${protocolId}:${nodeId}`;
        
        // זיהוי קטגוריה
        let categoryKey = 'other';
        let categoryLabel = 'אחר';
        
        if (nodeId.startsWith('report_') || nodeId === 'safety') {
          categoryKey = 'initial';
          categoryLabel = '🚨 התחלה ובטיחות';
        } else if (nodeId.startsWith('scene_')) {
          categoryKey = 'scene';
          categoryLabel = '🔍 הערכת זירה';
        } else if (nodeId.startsWith('x_') || nodeId.includes('bleeding') || nodeId.includes('tourniquet')) {
          categoryKey = 'exsanguination';
          categoryLabel = '🩸 X - דימום מסיב';
        } else if (nodeId.startsWith('avpu') || nodeId.includes('voice_check') || nodeId.includes('pain_check') || nodeId.includes('unresponsive')) {
          categoryKey = 'avpu';
          categoryLabel = '🧠 AVPU - רמת הכרה';
        } else if (nodeId.startsWith('cpr') || nodeId.includes('defib') || nodeId.includes('rosc') || nodeId.includes('compressions') || nodeId.includes('ventilations')) {
          categoryKey = 'cpr';
          categoryLabel = '💓 CPR - החייאה';
        } else if (nodeId.startsWith('airway') || nodeId.includes('choking') || nodeId.includes('suction') || nodeId.includes('tongue') || nodeId.includes('anaphylaxis_airway') || nodeId.includes('trauma_airway')) {
          categoryKey = 'airway';
          categoryLabel = '🫁 A - Airway';
        } else if (nodeId.startsWith('breathing') || nodeId.startsWith('respiratory')) {
          categoryKey = 'breathing';
          categoryLabel = '💨 B - Breathing';
        } else if (nodeId.startsWith('circulation') || nodeId.startsWith('shock')) {
          categoryKey = 'circulation';
          categoryLabel = '❤️ C - Circulation';
        } else if (nodeId.startsWith('disability') || nodeId.startsWith('neuro')) {
          categoryKey = 'disability';
          categoryLabel = '🧠 D - Disability';
        } else if (nodeId.startsWith('exposure') || nodeId.startsWith('environment')) {
          categoryKey = 'exposure';
          categoryLabel = '🌡️ E - Exposure';
        } else if (nodeId.includes('abcde')) {
          categoryKey = 'abcde_hub';
          categoryLabel = '🎯 ABCDE Assessment';
        }
        
        if (!categorizedNodes[categoryKey]) {
          categorizedNodes[categoryKey] = { categoryLabel, nodes: [] };
        }
        categorizedNodes[categoryKey].nodes.push({ id: fullNodeId, node, protocolId });
      });
    });

    // סדר הקטגוריות
    const categoryOrder = ['initial', 'scene', 'exsanguination', 'avpu', 'cpr', 'abcde_hub', 'airway', 'breathing', 'circulation', 'disability', 'exposure', 'other'];
    
    let yPosition = 100;
    const xBase = 100;
    
    // בניית צמתי כותרת וצמתים רגילים
    categoryOrder.forEach(categoryKey => {
      const category = categorizedNodes[categoryKey];
      if (!category || category.nodes.length === 0) return;
      
      const headerNodeId = `header:${categoryKey}`;
      
      // צומת כותרת
      nodes.push({
        id: headerNodeId,
        type: 'custom',
        position: { x: xBase, y: yPosition },
        data: {
          node: {
            id: headerNodeId,
            type: 'info',
            title: category.categoryLabel,
            description: `${category.nodes.length} צמתים`,
            content: {},
          },
          label: category.categoryLabel,
          severity: 'normal',
          protocolId: 'system',
          isHeaderNode: true,
          categoryKey,
          onToggleCollapse: () => handleToggleCategory(categoryKey),
          isCollapsed: collapsedNodes.has(headerNodeId),
        },
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '4px solid #553c9a',
          borderRadius: '12px',
          padding: '0px',
          width: 450,
          minHeight: 100,
        },
      });
      
      yPosition += 150;
      
      // צמתים רגילים בקטגוריה
      category.nodes.forEach(({ id: fullNodeId, node, protocolId }) => {
        const severity = node.severity || 'normal';
        
        nodes.push({
          id: fullNodeId,
          type: 'custom',
          position: { x: xBase + 50, y: yPosition },
          data: {
            node,
            label: node.title,
            severity,
            protocolId,
            parentHeaderId: headerNodeId,
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
        
        yPosition += 450;
      });
      
      yPosition += 100; // רווח בין קטגוריות
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
    const hiddenNodes = new Set<string>();
    
    // הסתרת צמתים שהכותרת שלהם מקופלת
    collapsedNodes.forEach(collapsedId => {
      if (collapsedId.startsWith('header:')) {
        // זו כותרת - הסתר את כל הצמתים שהparentHeaderId שלהם תואם
        flowNodes.forEach(node => {
          if (node.data.parentHeaderId === collapsedId) {
            hiddenNodes.add(node.id);
          }
        });
      } else {
        // צומת רגיל - הסתר את הצאצאים שלו
        const descendants = getNodeDescendants(collapsedId, flowNodes, flowEdges);
        descendants.forEach(desc => hiddenNodes.add(desc));
      }
    });
    
    // החזר רק צמתים שלא מוסתרים
    return flowNodes.map(node => ({
      ...node,
      hidden: hiddenNodes.has(node.id),
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
      </ReactFlow>
    </div>
  );
}
