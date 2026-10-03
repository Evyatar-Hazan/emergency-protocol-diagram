import { create } from 'zustand';
import type { Protocol, Node, FlowData } from '../types/protocol';

const emptyFlowData: FlowData = {
  version: '0.0.0',
  language: 'he',
  protocols: {},
};

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

const toHistoryEntry = (protocolId: string, nodeId: string) => `${protocolId}:${nodeId}`;

const fromHistoryEntry = (entry: string): [protocolId: string, nodeId: string] => {
  const separatorIndex = entry.indexOf(':');
  return [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)];
};

export const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  flowData: emptyFlowData,
  activeProtocol: null,
  activeProtocolId: null,
  currentNode: null,
  currentNodeId: null,
  navigationHistory: [],

  // הגדרת פרוטוקול פעיל
  setActiveProtocol: (protocolId: string | null) => {
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
    if (!protocol) {
      if (import.meta.env.DEV) console.error(`Protocol ${protocolId} not found`);
      return;
    }

    const startNode = protocol.nodes[protocol.startNode];
    set({
      activeProtocol: protocol,
      activeProtocolId: protocolId,
      currentNode: startNode,
      currentNodeId: protocol.startNode,
      navigationHistory: [toHistoryEntry(protocolId, protocol.startNode)],
    });
  },

  // ניווט לצומת ספציפי
  navigateToNode: (nodeId: string) => {
    const { activeProtocol, activeProtocolId, navigationHistory, flowData } = get();
    
    // בדיקה אם זה קישור בין-פרוטוקולי (פורמט: "protocol:node")
    if (nodeId.includes(':')) {
      const [targetProtocolId, targetNodeId] = nodeId.split(':');
      
      const targetProtocol = flowData.protocols[targetProtocolId];
      if (!targetProtocol) {
        if (import.meta.env.DEV) console.error(`Target protocol ${targetProtocolId} not found`);
        return;
      }
      
      const targetNode = targetProtocol.nodes[targetNodeId];
      if (!targetNode) {
        if (import.meta.env.DEV) console.error(`Target node ${targetNodeId} not found in protocol ${targetProtocolId}`);
        return;
      }
      
      // עדכן לפרוטוקול החדש והצומת החדש
      set({
        activeProtocol: targetProtocol,
        activeProtocolId: targetProtocolId,
        currentNode: targetNode,
        currentNodeId: targetNodeId,
        navigationHistory: [...navigationHistory, toHistoryEntry(targetProtocolId, targetNodeId)],
      });
      
      // גלול למעלה
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // ניווט רגיל בתוך אותו פרוטוקול
    if (!activeProtocol || !activeProtocolId) {
      if (import.meta.env.DEV) console.error('No active protocol');
      return;
    }

    const node = activeProtocol.nodes[nodeId];
    if (!node) {
      if (import.meta.env.DEV) console.error(`Node ${nodeId} not found`);
      return;
    }

    set({
      currentNode: node,
      currentNodeId: nodeId,
      navigationHistory: [...navigationHistory, toHistoryEntry(activeProtocolId, nodeId)],
    });
    
    // גלול למעלה
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // חזרה לצומת קודם
  goBack: () => {
    const { navigationHistory, flowData } = get();
    if (navigationHistory.length <= 1) return;

    const newHistory = [...navigationHistory];
    newHistory.pop(); // הסר את הצומת הנוכחי
    const [previousProtocolId, previousNodeId] = fromHistoryEntry(newHistory[newHistory.length - 1]);
    const previousProtocol = flowData.protocols[previousProtocolId];
    const previousNode = previousProtocol?.nodes[previousNodeId];

    if (!previousProtocol || !previousNode) {
      if (import.meta.env.DEV) console.error(`History target ${previousProtocolId}:${previousNodeId} not found`);
      return;
    }

    set({
      activeProtocol: previousProtocol,
      activeProtocolId: previousProtocolId,
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
