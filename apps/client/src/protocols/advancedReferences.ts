export type AdvancedReferenceEntry = {
  nodeId: string;
  label: string;
  description: string;
  sourceModuleIds: readonly string[];
};

export const ADVANCED_REFERENCE_SCOPE = {
  badge: 'חומר העשרה מתקדם',
  title: 'מחוץ למסלול הפעולה הראשי',
  description:
    'התוכן מיועד ללמידה ולרענון בלבד. הוא אינו מסלול פעולה, אינו כלי לאבחון או לטיפול בזמן אירוע, ואינו מעניק סמכות קלינית. יש לפעול לפי ההכשרה והפרוטוקול הארגוני העדכני.',
} as const;

/**
 * Product-approved reference topics that intentionally remain outside the
 * primary BLS action graph. This manifest classifies presentation only; it
 * does not alter clinical copy or add navigation edges.
 */
export const advancedReferenceCatalog: readonly AdvancedReferenceEntry[] = [
  {
    nodeId: 'unified_flow:cardiovascular_problem',
    label: 'סקירת בעיות קרדיווסקולריות',
    description: 'שער לימודי לנושאי לב וכלי דם שאינם חלק ממסלול הפעולה הראשי.',
    sourceModuleIds: ['16', '30'],
  },
  {
    nodeId: 'unified_flow:mi_stemi',
    label: 'אוטם ו-STEMI',
    description: 'הקשר מתקדם ללמידה; אינו מוצג כאבחנה ברמת BLS.',
    sourceModuleIds: ['16', '30'],
  },
  {
    nodeId: 'unified_flow:arrhythmia_vt',
    label: 'VT',
    description: 'זיהוי קצב כחומר העשרה מתקדם בלבד.',
    sourceModuleIds: ['30'],
  },
  {
    nodeId: 'unified_flow:arrhythmia_svt',
    label: 'SVT',
    description: 'זיהוי קצב כחומר העשרה מתקדם בלבד.',
    sourceModuleIds: ['30'],
  },
  {
    nodeId: 'unified_flow:arrhythmia_afib',
    label: 'פרפור פרוזדורים',
    description: 'זיהוי קצב כחומר העשרה מתקדם בלבד.',
    sourceModuleIds: ['30'],
  },
  {
    nodeId: 'unified_flow:arrhythmia_bradycardia',
    label: 'ברדיקרדיה',
    description: 'זיהוי קצב כחומר העשרה מתקדם בלבד.',
    sourceModuleIds: ['30'],
  },
  {
    nodeId: 'unified_flow:aortic_dissection',
    label: 'דיסקציה של האאורטה',
    description: 'הקשר מתקדם ללמידה, מחוץ למסלול הפעולה הראשי.',
    sourceModuleIds: ['30'],
  },
];

export const advancedReferenceNodeIds = advancedReferenceCatalog.map(({ nodeId }) => nodeId);

const advancedReferenceNodeIdSet = new Set(advancedReferenceNodeIds);

export const isAdvancedReferenceNode = (protocolId: string, nodeId: string): boolean =>
  advancedReferenceNodeIdSet.has(`${protocolId}:${nodeId}`);
