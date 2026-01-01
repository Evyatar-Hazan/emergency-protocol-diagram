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
  setActiveProtocol: (protocolId: string) => void;
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
  setActiveProtocol: (protocolId: string) => {
    const protocol = get().flowData.protocols[protocolId];
    if (!protocol) {
      console.error(`Protocol ${protocolId} not found`);
      return;
    }

    const startNode = protocol.nodes[protocol.startNode];
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
    const { activeProtocol, navigationHistory } = get();
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
