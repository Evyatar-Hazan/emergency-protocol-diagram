import { create } from 'zustand';
import type { Protocol, Node, FlowData } from '../types/protocol';
import { protocolsData } from '../protocols';

interface FlowState {
  // נתוני הפרוטוקולים
  flowData: FlowData;
  
  // פרוטוקול פעיל נוכחי
  activeProtocol: Protocol | null;
  activeProtocolId: string | null;
  
  // צומת נוכחי בזרימה
  currentNode: Node | null;
  currentNodeId: string | null;
  
  // היסטוריית ניווט
  navigationHistory: string[];
  
  // Actions
  setActiveProtocol: (protocolId: string | null) => void;
  navigateToNode: (nodeId: string) => void;
  goBack: () => void;
  reset: () => void;
  loadData: (data: FlowData) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  flowData: protocolsData,
  activeProtocol: null,
  activeProtocolId: null,
  currentNode: null,
  currentNodeId: null,
  navigationHistory: [],

  // הגדרת פרוטוקול פעיל
  setActiveProtocol: (protocolId: string | null) => {
    console.log('[Store] setActiveProtocol called with:', protocolId);
    if (protocolId === null) {
      set({
        activeProtocol: null,
        activeProtocolId: null,
        currentNode: null,
        currentNodeId: null,
        navigationHistory: [],
      });
      return;
    }

    const protocol = get().flowData.protocols[protocolId];
    console.log('[Store] Protocol found:', protocol);
    if (!protocol) {
      console.error(`Protocol ${protocolId} not found`);
      return;
    }

    const startNode = protocol.nodes[protocol.startNode];
    console.log('[Store] Start node:', startNode);
    set({
      activeProtocol: protocol,
      activeProtocolId: protocolId,
      currentNode: startNode,
      currentNodeId: protocol.startNode,
      navigationHistory: [protocol.startNode],
    });
  },

  // ניווט לצומת ספציפי
  navigateToNode: (nodeId: string) => {
    const { activeProtocol, navigationHistory, flowData } = get();
    
    // בדיקה אם זה קישור בין-פרוטוקולי (פורמט: "protocol:node")
    if (nodeId.includes(':')) {
      const [targetProtocolId, targetNodeId] = nodeId.split(':');
      console.log('[Store] Cross-protocol navigation to:', targetProtocolId, targetNodeId);
      
      const targetProtocol = flowData.protocols[targetProtocolId];
      if (!targetProtocol) {
        console.error(`Target protocol ${targetProtocolId} not found`);
        return;
      }
      
      const targetNode = targetProtocol.nodes[targetNodeId];
      if (!targetNode) {
        console.error(`Target node ${targetNodeId} not found in protocol ${targetProtocolId}`);
        return;
      }
      
      // עדכן לפרוטוקול החדש והצומת החדש
      set({
        activeProtocol: targetProtocol,
        activeProtocolId: targetProtocolId,
        currentNode: targetNode,
        currentNodeId: targetNodeId,
        navigationHistory: [...navigationHistory, `${targetProtocolId}:${targetNodeId}`],
      });
      
      // גלול למעלה
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ניווט רגיל בתוך אותו פרוטוקול
    if (!activeProtocol) {
      console.error('No active protocol');
      return;
    }

    const node = activeProtocol.nodes[nodeId];
    if (!node) {
      console.error(`Node ${nodeId} not found`);
      return;
    }

    set({
      currentNode: node,
      currentNodeId: nodeId,
      navigationHistory: [...navigationHistory, nodeId],
    });
    
    // גלול למעלה
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // חזרה לצומת קודם
  goBack: () => {
    const { navigationHistory, activeProtocol } = get();
    if (navigationHistory.length <= 1 || !activeProtocol) return;

    const newHistory = [...navigationHistory];
    newHistory.pop(); // הסר את הצומת הנוכחי
    const previousNodeId = newHistory[newHistory.length - 1];
    const previousNode = activeProtocol.nodes[previousNodeId];

    set({
      currentNode: previousNode,
      currentNodeId: previousNodeId,
      navigationHistory: newHistory,
    });
  },

  // איפוס למצב ראשוני
  reset: () => {
    set({
      activeProtocol: null,
      activeProtocolId: null,
      currentNode: null,
      currentNodeId: null,
      navigationHistory: [],
    });
  },

  // טעינת נתונים חדשים (למשל מ-config או window.__INITIAL_FLOW_DATA__)
  loadData: (data: FlowData) => {
    set({ flowData: data });
  },
}));
