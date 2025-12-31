# דיאגרמת פרוטוקול טיפול חירום

```mermaid
flowchart TD

EXIT([דיווח יציאה למקרה])
START([דיווח הגעה למקרה])
SAFE[S - Safety\n**בטיחות אישית:** וסת, כפפות\n**בטיחות סביבתית:** לא מסוכן להכנס, גורם עוין, כביש סואן, כימיקל מסוכן]
SAFE_note([בדיקה פיזית: ודא ציוד מגן אישי, סמן סכנות סביבתיות לפני גישה למטופל])
SAFE --> SAFE_note

%% ===== תחנות אנמזה =====
ANAMNESE1([תחנה: לאן הגעתי ומה אני רואה?])
style ANAMNESE1 fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray:5 5
SAFE_note --> ANAMNESE1
ANAMNESE1_note([בדיקה פיזית: הסתכל סביב, התרשם מהמצב הכללי, מיקום המטופל והסביבה])
ANAMNESE1 --> ANAMNESE1_note

%% ===== בדיקת הכרה AVPU =====
AVPU{בדיקת הכרה לפי AVPU}
style AVPU fill:#eef,stroke:#333,stroke-width:2px
ANAMNESE1_note --> AVPU
AVPU_note([Alert - פנה למטופל ושאל שאלות פשוטות\nVerbal - דחוף קול קצר או צעקה\nPain - לחץ על אזור חישה כדי לבדוק תגובה\nUnresponsive - אין תגובה לכל האיתותים])
AVPU --> AVPU_note
AVPU -->|Alert - ערני| RESPONSIVE_ALERT[מגיב - ערני]
AVPU -->|Verbal - מגיב לקול| RESPONSIVE_VERBAL[מגיב לקול]
AVPU -->|Pain - מגיב לכאב| RESPONSIVE_PAIN[מגיב לכאב]
AVPU -->|Unresponsive - לא מגיב| RESPONSIVE_NONE[לא מגיב]

BREATHING{נשימה תקינה?}
BREATHING_note([בדיקה פיזית: האזן למטופל במשך 10 שניות ובדוק תנועות חזה בלבד, ללא סטורציה])
BREATHING --> BREATHING_note

PULSE{דופק מרכזי?}
PULSE_note([בדיקה פיזית: בדוק דופק קרוטיד או פריפרי, לחץ דם אם אפשר])
PULSE --> PULSE_note

%% ===== החייאה =====
CPR_START[החייאת BLS]
CPR_START_note([בדיקה פיזית: עיסויי חזה בקצב נכון 30:2, הקפדה על עומק עיסוי])
CPR_START --> CPR_START_note
CALL_HELP[הזעקת עזרה + AED]
CHEST_COMP[עיסויי חזה\n30:2]
AED_CHECK{AED זמין?}
SHOCK{קצב בר הלם?}
SHOCK_DELIVER[מתן הלם]
CPR_CONTINUE[המשך עיסויים\n2 דקות]
ROSC{חזרת דופק?}
POST_ROSC[טיפול לאחר החייאה]

%% ===== ABCDE =====
A[A - Airway\nבדיקת נתיב אוויר]
A_note([בדיקה פיזית: סמן את הפה והגרון, ודא שאין חסימה])
A --> A_note
B[B - Breathing\nקצב, סטורציה, האזנה]
B_note([בדיקה פיזית: האזן, בדוק תנועות חזה, מד סטורציה])
B --> B_note
C[C - Circulation\nדופק, לחץ דם, מילוי קפילרי]
C_note([בדיקה פיזית: בדוק דופק קרוטיד/פריפרי, לחץ דם, צבע עור, מילוי קפילרי])
C --> C_note
D[D - Disability\nGCS, אישונים]
D_note([בדיקה פיזית: מדוד GCS, בדוק אישונים ותגובות עיניים])
D --> D_note
E[E - Exposure\nחשיפה ומניעת היפותרמיה]
E_note([בדיקה פיזית: חשוף את המטופל בזהירות, מנע אובדן חום, חפש פגיעות נוספות])
E --> E_note

%% ===== טבלת מדדים תקינים לפי סדר ABCDE (ילד ומבוגר) =====
METRICS_TABLE([טווח מדדים תקינים:
Airway: פתוח תמיד
Breathing:
  מבוגר: 12-20 נשימות/דקה
  ילד: 20-30 נשימות/דקה
Circulation:
  מבוגר: דופק 60-100 פעימות/דקה
  לחץ דם: 90-120/60-80 mmHg
  ילד: דופק 80-120 פעימות/דקה
  לחץ דם: 80-110/50-70 mmHg
Disability (GCS): 15
Exposure: חום גוף 36-37.5°C
])

%% ===== חיבורים =====
EXIT --> START
START --> SAFE
SAFE_note --> ANAMNESE1
RESPONSIVE_ALERT --> A
RESPONSIVE_VERBAL --> A
RESPONSIVE_PAIN --> A
RESPONSIVE_NONE --> BREATHING
BREATHING --> PULSE
PULSE --> CPR_START
BREATHING -- כן --> A
PULSE -- כן --> A

%% ===== פלואו החייאה =====
CPR_START --> CALL_HELP --> CHEST_COMP --> AED_CHECK
AED_CHECK -- כן --> SHOCK
AED_CHECK -- לא --> CPR_CONTINUE
SHOCK -- כן --> SHOCK_DELIVER --> CPR_CONTINUE
SHOCK -- לא --> CPR_CONTINUE
CPR_CONTINUE --> ROSC
ROSC -- לא --> CHEST_COMP
ROSC -- כן --> POST_ROSC --> A

%% ===== רצף ABCDE =====
A --> B
B --> C
C --> D
D --> E

%% ===== צבעים =====
style EXIT fill:#f9c,stroke:#333,stroke-width:2px
style START fill:#9cf,stroke:#333,stroke-width:2px
style SAFE fill:#fc9,stroke:#333,stroke-width:2px
style SAFE_note fill:#fc9,stroke:#333,stroke-width:2px
style ANAMNESE1 fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray:5 5
style ANAMNESE1_note fill:#eee,stroke:#333,stroke-width:1px,stroke-dasharray:5 5
style AVPU fill:#eef,stroke:#333,stroke-width:2px
style AVPU_note fill:#eef,stroke:#333,stroke-width:2px
style RESPONSIVE_ALERT fill:#6f6,stroke:#333,stroke-width:2px
style RESPONSIVE_VERBAL fill:#6cf,stroke:#333,stroke-width:2px
style RESPONSIVE_PAIN fill:#9cf,stroke:#333,stroke-width:2px
style RESPONSIVE_NONE fill:#fcc,stroke:#333,stroke-width:2px
style BREATHING fill:#fcf,stroke:#333,stroke-width:2px
style BREATHING_note fill:#fcf,stroke:#333,stroke-width:2px
style PULSE fill:#ccf,stroke:#333,stroke-width:2px
style PULSE_note fill:#ccf,stroke:#333,stroke-width:2px
style CPR_START fill:#f66,stroke:#333,stroke-width:2px
style CPR_START_note fill:#f66,stroke:#333,stroke-width:2px
style CALL_HELP fill:#f96,stroke:#333,stroke-width:2px
style CHEST_COMP fill:#f93,stroke:#333,stroke-width:2px
style AED_CHECK fill:#ff9,stroke:#333,stroke-width:2px
style SHOCK fill:#f99,stroke:#333,stroke-width:2px
style SHOCK_DELIVER fill:#f66,stroke:#333,stroke-width:2px
style CPR_CONTINUE fill:#f96,stroke:#333,stroke-width:2px
style ROSC fill:#6f6,stroke:#333,stroke-width:2px
style POST_ROSC fill:#6cf,stroke:#333,stroke-width:2px
style A fill:#6cf,stroke:#333,stroke-width:2px
style A_note fill:#6cf,stroke:#333,stroke-width:2px
style B fill:#6ff,stroke:#333,stroke-width:2px
style B_note fill:#6ff,stroke:#333,stroke-width:2px
style C fill:#9cf,stroke:#333,stroke-width:2px
style C_note fill:#9cf,stroke:#333,stroke-width:2px
style D fill:#ccf,stroke:#333,stroke-width:2px
style D_note fill:#ccf,stroke:#333,stroke-width:2px
style E fill:#cff,stroke:#333,stroke-width:2px
style E_note fill:#cff,stroke:#333,stroke-width:2px
style METRICS_TABLE fill:#ffebc6,stroke:#333,stroke-width:2px
```
