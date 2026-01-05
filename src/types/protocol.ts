/**
 * מבנה הדאטא לפרוטוקולים קליניים
 * כל הלוגיקה הקלינית מאוחסנת ב-JSON
 */

export type NodeType = 
  | 'start'           // נקודת התחלה
  | 'decision'        // החלטה (כן/לא)
  | 'check'           // בדיקה פיזית
  | 'question'        // שאלה
  | 'action'          // פעולה/טיפול
  | 'diagnosis'       // אבחנה
  | 'info'            // מידע
  | 'end';            // נקודת סיום

export type SeverityLevel = 
  | 'critical'        // אדום - סכנת חיים
  | 'urgent'          // כתום - דחוף
  | 'warning'         // צהוב - אזהרה
  | 'stable'          // כחול - יציב
  | 'normal';         // ירוק - תקין

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  severity?: SeverityLevel;
  
  // תוכן מפורט
  content?: {
    checkMethod?: string;          // איך לבדוק
    whatToLookFor?: string | string[]; // מה לחפש (string או רשימה)
    equipment?: string[];          // ציוד נדרש
    questions?: string[];          // שאלות לשאול
    vitals?: string[];             // מדדים (סימנים חיוניים)
    treatment?: string | string[]; // טיפול (טקסט חופשי או רשימה)
  };
  
  // חיבורים
  next?: string | string[];    // צומת הבא (או מספר אפשרויות)
  conditions?: EdgeCondition[]; // תנאים למעברים
  options?: Array<{ label: string; target: string }>; // אפשרויות לצומת החלטה
}

export interface EdgeCondition {
  label: string;               // תווית (כן/לא/אחר)
  target: string;              // צומת יעד
  condition?: string;          // תנאי לוגי (אופציונלי)
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
  version: string;
  startNode: string;
  nodes: Record<string, Node>;
  metadata?: {
    author?: string;
    lastUpdated?: string;
    tags?: string[];
  };
}

export interface FlowData {
  protocols: Record<string, Protocol>;
  version: string;
  language: string;
}

// Types עבור Bootstrap
declare global {
  interface Window {
    __INITIAL_FLOW_DATA__?: FlowData;
  }
}
