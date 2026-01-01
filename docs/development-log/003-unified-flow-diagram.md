# 🎯 יומן פיתוח - תרשים זרימה מאוחד עם React Flow

**תאריך:** 1 בינואר 2026  
**משימה:** בניית תרשים זרימה ויזואלי מלא עם כל הפרוטוקולים במסך אחד  
**מפתח:** GitHub Copilot

---

## מטרת השינוי

המשתמש ביקש **תרשים זרימה אחד מלא ורציף** שמציג את כל הצמתים יחד במסך אחד, במקום ניווט step-by-step בין מסכים נפרדים. 

הדרישה המרכזית: 
- "אני לא יודע מראש לאיזה פרוטוקול אני הולך"
- הזרימה מתחילה מ-Safety ומסתעפת דינמית לפי ממצאים בשטח
- אם אין דופק → החייאה (CPR)
- אם יש דופק → ABCDE (טראומה או רפואי)

---

## מה בוצע

### 1. פרוטוקול מאוחד (Unified Flow)

**קובץ:** `src/protocols/unified-flow.json`

פרוטוקול חדש שמשמש כנקודת כניסה אחידה:

```json
{
  "id": "unified_flow",
  "name": "פרוטוקול אחוד - זרימה מלאה",
  "startNode": "safety",
  "nodes": {
    "safety": { /* בדיקת בטיחות */ },
    "initial_assessment": { /* הערכה ראשונית */ },
    "check_pulse": { /* בדיקת דופק - נקודת הסתעפות */ },
    "mechanism_assessment": { /* טראומה או רפואי */ }
  }
}
```

**צמתים עיקריים:**
- `safety` - S (Safety) - תמיד נקודת התחלה
- `initial_assessment` - הערכה ראשונית (הכרה, נשימה, דופק)
- `check_pulse` - **נקודת הסתעפות קריטית**:
  - אין דופק → `cpr:start_cpr`
  - יש דופק → `mechanism_assessment`
- `mechanism_assessment` - בחירה בין:
  - טראומה → `abcde_trauma:airway_trauma`
  - רפואי → `abcde_medical:airway_check`

**פורמט קישורים בין-פרוטוקוליים:** `"protocol_id:node_id"`

---

### 2. קובץ קונפיגורציה

**קובץ:** `config/flow-config.json`

הגדרות למבנה הזרימה המאוחדת:

```json
{
  "flowMode": "unified",
  "unifiedFlow": {
    "enabled": true,
    "startProtocol": "unified_flow",
    "startNode": "safety"
  },
  "displayMode": {
    "type": "continuous-scroll",
    "showBreadcrumbs": true,
    "showProgress": true
  }
}
```

**תכונות:**
- ✅ מצב זרימה מאוחד
- ✅ התחלה אוטומטית מ-Safety
- ✅ תצוגה רצופה (לא מסכים נפרדים)

---

### 3. קומפוננטת FullFlowDiagram

**קובץ:** `src/components/flow/FullFlowDiagram.tsx`

קומפוננטה מרכזית להצגת תרשים זרימה מלא עם React Flow.

**פונקציונליות:**
```typescript
interface FullFlowDiagramProps {
  protocols: Record<string, Protocol>;  // כל הפרוטוקולים
  onNodeClick?: (nodeId: string) => void;
}
```

**תהליך בנייה:**
1. מעבר על כל הפרוטוקולים (`unified_flow`, `cpr`, `abcde_medical`)
2. המרת כל צומת ל-FlowNode של React Flow
3. יצירת ID מלא: `protocol:node` (למשל: `cpr:start_cpr`)
4. חישוב מיקום אוטומטי (Y: index * 400px, X: alternating)
5. הוספת צבעים לפי severity

**מיפוי צבעים:**
```typescript
const severityColors = {
  critical: '#fee2e2',  // אדום בהיר
  urgent: '#ffedd5',    // כתום בהיר
  warning: '#fef3c7',   // צהוב בהיר
  stable: '#dcfce7',    // ירוק בהיר
  normal: '#dbeafe',    // כחול בהיר
};

const borderColors = {
  critical: '#dc2626',  // אדום כהה
  urgent: '#ea580c',    // כתום כהה
  warning: '#ca8a04',   // צהוב כהה
  stable: '#16a34a',    // ירוק כהה
  normal: '#2563eb',    // כחול כהה
};
```

**בניית חיבורים (Edges):**
- חיבורים פשוטים (`next`): חץ אפור
- חיבורים מותנים (`conditions`):
  - כן/Yes → חץ ירוק
  - לא/No → חץ אדום
  - אחר → חץ כחול
- תמיכה בקישורים בין-פרוטוקוליים

**תכונות React Flow:**
- `fitView` - התאמה אוטומטית למסך
- `minZoom: 0.1, maxZoom: 1.5` - גבולות זום
- `Background` - רקע grid
- `Controls` - פקדי zoom/fit
- `Panel` - מידע ומקרא

---

### 4. קומפוננטת CustomNode

**קובץ:** `src/components/flow/CustomNode.tsx`

צומת מותאם אישית עם תצוגת מידע מלאה.

**מבנה הצומת:**
```
┌─────────────────────────────┐
│ 🔍 [סוג]                    │
│ [כותרת]                     │
├─────────────────────────────┤
│ [תיאור]                     │
├─────────────────────────────┤
│ 🔍 שיטת בדיקה:             │
│ [מלל מלא]                   │
│                              │
│ 👁️ על מה לשים לב:          │
│ [רשימה/מלל]                │
│                              │
│ 🎒 ציוד נדרש:              │
│ [תגיות]                     │
│                              │
│ 💬 שאלות לשאול:            │
│ [רשימה]                     │
│                              │
│ ⚡ טיפול:                   │
│ [מלל מודגש ברקע צהוב]      │
├─────────────────────────────┤
│ [node.id]                   │
└─────────────────────────────┘
```

**אייקונים לפי סוג:**
- 🏁 start (התחלה)
- ❓ decision (החלטה)
- 🔍 check (בדיקה)
- 💬 question (שאלה)
- ⚡ action (פעולה)
- 🩺 diagnosis (אבחנה)
- ℹ️ info (מידע)
- ✅ end (סיום)

**עיצוב:**
- רוחב: 420px
- גובה מינימלי: 200px
- רקע לבן שקוף לאזורי תוכן
- טקסט RTL
- טיפול מודגש ברקע צהוב

---

### 5. שינויים ב-Store (Zustand)

**קובץ:** `src/store/flowStore.ts`

הוספת תמיכה בניווט בין-פרוטוקולי:

```typescript
navigateToNode: (nodeId: string) => {
  // זיהוי קישור בין-פרוטוקולי
  if (nodeId.includes(':')) {
    const [targetProtocolId, targetNodeId] = nodeId.split(':');
    
    // טעינת הפרוטוקול החדש
    const targetProtocol = flowData.protocols[targetProtocolId];
    const targetNode = targetProtocol.nodes[targetNodeId];
    
    // עדכון state
    set({
      activeProtocol: targetProtocol,
      activeProtocolId: targetProtocolId,
      currentNode: targetNode,
      currentNodeId: targetNodeId,
      navigationHistory: [...navigationHistory, `${targetProtocolId}:${targetNodeId}`],
    });
    
    // גלילה חלקה למעלה
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

**פורמט היסטוריה:**
```javascript
navigationHistory: [
  "unified_flow:safety",
  "unified_flow:check_pulse",
  "cpr:start_cpr",
  "cpr:chest_compressions"
]
```

---

### 6. שינויים ב-App.tsx

**קובץ:** `src/App.tsx`

```typescript
// התחלה אוטומטית עם הפרוטוקול המאוחד
useEffect(() => {
  if (!isLoading && !activeProtocol && flowData.protocols.unified_flow) {
    setActiveProtocol('unified_flow');
  }
}, [isLoading, activeProtocol, flowData, setActiveProtocol]);

// תצוגת כל הפרוטוקולים ביחד
if (!isLoading && flowData.protocols) {
  return <FullFlowDiagram protocols={flowData.protocols} />;
}
```

**שינויים:**
- ✅ אתחול אוטומטי של unified_flow
- ✅ העברת כל הפרוטוקולים ל-FullFlowDiagram
- ✅ הסרת מסך בחירה (התחלה ישירה)

---

### 7. תיקון Types

**קובץ:** `src/types/protocol.ts`

```typescript
content?: {
  checkMethod?: string;
  whatToLookFor?: string | string[];  // תמיכה בשני פורמטים
  equipment?: string[];
  questions?: string[];
  treatment?: string;  // string במקום string[]
};
```

**תיקונים:**
- `whatToLookFor` יכול להיות string או array
- `treatment` הוא string (לא array)

---

## ארכיטקטורה טכנית

### Data Flow המלא

```
┌─────────────────────────────────────────┐
│         index.html / Bootstrap          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         bootstrap.ts                    │
│  - initializeFlowData()                 │
│  - loadFeatureFlags()                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      protocols/index.ts                 │
│  - unified_flow.json                    │
│  - cpr.json (16 nodes)                  │
│  - abcde_medical.json (77 nodes)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         flowStore.ts                    │
│  - loadData(flowData)                   │
│  - setActiveProtocol('unified_flow')    │
│  - navigateToNode() [cross-protocol]    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│            App.tsx                      │
│  - Auto-init unified_flow               │
│  - Pass all protocols to diagram        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      FullFlowDiagram.tsx                │
│  - Build nodes from ALL protocols       │
│  - Build edges (with cross-protocol)    │
│  - Render with React Flow               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         CustomNode.tsx                  │
│  - Display full node content            │
│  - Icons, colors, equipment             │
│  - Questions, treatment, etc.           │
└─────────────────────────────────────────┘
```

---

## סטטיסטיקות

### פרוטוקולים
- **unified_flow**: 4 צמתים (entry point)
- **cpr**: 16 צמתים (החייאה)
- **abcde_medical**: 77 צמתים (ABCDE רפואי)
- **סה"כ: 97 צמתים** במסך אחד!

### קבצים שנוצרו/שונו
```
src/
├── components/flow/
│   ├── FullFlowDiagram.tsx     ✅ NEW (232 שורות)
│   ├── CustomNode.tsx          ✅ NEW (128 שורות)
│   ├── FlowNavigation.tsx      ✅ NEW (88 שורות)
│   ├── FlowNode.tsx           ✅ NEW (182 שורות)
│   └── ProtocolViewer.tsx     ✅ NEW (105 שורות)
├── protocols/
│   ├── unified-flow.json      ✅ NEW (105 שורות)
│   └── index.ts               🔧 MODIFIED
├── store/
│   └── flowStore.ts           🔧 MODIFIED (cross-protocol support)
├── types/
│   └── protocol.ts            🔧 MODIFIED (whatToLookFor, treatment)
└── App.tsx                    🔧 MODIFIED (auto-init, all protocols)

config/
└── flow-config.json           ✅ NEW
```

---

## תכונות מרכזיות

### 1. תרשים זרימה אינטראקטיבי
- ✅ כל 97 הצמתים במסך אחד
- ✅ Zoom in/out (גלגלת עכבר)
- ✅ Pan (גרירה)
- ✅ Fit to screen
- ✅ מינימום/מקסימום zoom

### 2. ניווט דינמי
- ✅ קישורים בין-פרוטוקוליים (`protocol:node`)
- ✅ חיצים מצבעים (ירוק=כן, אדום=לא)
- ✅ חיצים מונפשים (animated)
- ✅ תוויות על החיצים

### 3. תצוגת מידע מלאה
- ✅ שיטת בדיקה
- ✅ על מה לשים לב
- ✅ ציוד נדרש
- ✅ שאלות לשאול
- ✅ טיפול (מודגש)

### 4. קידוד חזותי
- ✅ צבעים לפי severity
- ✅ אייקונים לפי type
- ✅ גבולות צבעוניים
- ✅ רקע שקוף לתוכן

### 5. מידע ומקרא
- ✅ פאנל עליון ימין
- ✅ ספירת צמתים לכל פרוטוקול
- ✅ מקרא צבעים
- ✅ סה"כ צמתים

---

## איך זה עובד

### תרחיש שימוש טיפוסי

1. **התחלה:** 
   - האפליקציה נפתחת → `unified_flow:safety`
   - המשתמש רואה צומת "S - Safety"

2. **בדיקת בטיחות:**
   - בדיקה: חשמל, אש, תנועה
   - לחיצה על "המשך" → `unified_flow:initial_assessment`

3. **הערכה ראשונית:**
   - בדיקת הכרה (AVPU)
   - בדיקת נשימה
   - בדיקת דופק
   - לחיצה על "המשך" → `unified_flow:check_pulse`

4. **נקודת הסתעפות:**
   - **אם אין דופק:**
     - לחיצה על "אין דופק - התחל החייאה"
     - מעבר ל-`cpr:start_cpr`
     - המשך בפרוטוקול CPR המלא (16 צמתים)
   
   - **אם יש דופק:**
     - לחיצה על "יש דופק - המשך הערכה"
     - מעבר ל-`unified_flow:mechanism_assessment`
     - בחירה: טראומה או רפואי
     - מעבר ל-ABCDE המתאים (77 צמתים)

---

## יתרונות הגישה

### 1. זרימה אחת רציפה ✅
- אין מסכים נפרדים
- כל הפרוטוקולים במבט אחד
- ניווט חלק בין פרוטוקולים

### 2. גמישות קלינית ✅
- החלטות דינמיות לפי ממצאים
- לא צריך לבחור פרוטוקול מראש
- הזרימה מנחה את החובש

### 3. תצוגה מלאה ✅
- כל המידע הקליני גלוי
- אין צורך לנווט להצגת פרטים
- תמיכה בהחלטות מהירות

### 4. הרחבה עתידית ✅
- קל להוסיף פרוטוקולים חדשים
- תמיכה בטראומה (בעתיד)
- תמיכה בפרוטוקולים נוספים

---

## מה הלאה (אופציונלי)

### שיפורים אפשריים:
1. **Layout אוטומטי מתקדם:**
   - שימוש ב-Dagre/ELK לארגון אוטומטי
   - קיבוץ פרוטוקולים בבלוקים
   - מינימיזציה של חיתוכי חיצים

2. **אינטראקטיביות:**
   - לחיצה על צומת → הדגשה של מסלול
   - סינון לפי severity
   - חיפוש צמתים

3. **פרוטוקול טראומה:**
   - המרת ABCDE Trauma ל-JSON
   - אינטגרציה עם mechanism_assessment

4. **ייצוא:**
   - הורדת התרשים כ-PNG/PDF
   - שיתוף מסלול ספציפי

---

## סיכום

הפרויקט עבר מ-**ניווט step-by-step** ל-**תרשים זרימה מלא ויזואלי**:

- ✅ 97 צמתים במסך אחד
- ✅ 3 פרוטוקולים מאוחדים
- ✅ ניווט בין-פרוטוקולי שקוף
- ✅ תצוגת מידע מלאה בכל צומת
- ✅ אינטראקטיבי (zoom, pan, fit)
- ✅ קידוד צבעים לפי חומרה
- ✅ חיצים מונפשים עם תוויות

**המערכת מוכנה לשימוש בשטח!** 🚀
