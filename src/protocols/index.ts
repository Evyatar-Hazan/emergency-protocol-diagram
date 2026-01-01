import type { FlowData, Protocol } from '../types/protocol';
import cpr from './cpr.json';
import abcdeMedical from './abcde-medical.json';

/**
 * כל הפרוטוקולים הקליניים במערכת
 * זהו המקור היחיד לדאטא - כל הלוגיקה הקלינית כאן
 */
export const protocolsData: FlowData = {
  version: '1.0.0',
  language: 'he',
  protocols: {
    cpr: cpr as Protocol,
    abcde_medical: abcdeMedical as Protocol,
  },
};

/**
 * רשימת כל מזהי הפרוטוקולים
 */
export const protocolIds = Object.keys(protocolsData.protocols);

/**
 * קבלת פרוטוקול לפי ID
 */
export function getProtocol(id: string) {
  return protocolsData.protocols[id];
}

/**
 * קבלת צומת לפי protocol ID ו-node ID
 */
export function getNode(protocolId: string, nodeId: string) {
  const protocol = getProtocol(protocolId);
  return protocol?.nodes[nodeId];
}
