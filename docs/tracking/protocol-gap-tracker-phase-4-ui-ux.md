# Protocol Gap Tracker - Phase 4 UI/UX

## מטרת המסמך

מסמך זה נפתח אחרי סגירת כל פערי `Phase 3`.

המטרה שלו היא לרכז backlog חדש ומצומצם של פערי UI/UX בלבד, על סמך:

1. מסמכי האפיון הקיימים
2. בדיקות ידניות במובייל
3. ממצאים חוזרים מתוך ה-UI החי והקוד הקיים
4. פידבק משתמש ישיר שניתן במהלך בדיקות המסכים

המסמך הזה אינו רשימת רעיונות חופשית.
כל פער כאן חייב להישען על ראיה כתובה, בדיקה בפועל, או דרישת אפיון מפורשת.

## מסמכי מקור

- [ui-ux-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-spec.md)
- [ui-ux-redesign-task-list.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-task-list.md)
- [protocol-gap-tracker-phase-3.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/protocol-gap-tracker-phase-3.md)
- [emergency-protocol-diagram-ui-ux-redesign-plan.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/20_WORK/Tasks/emergency-protocol-diagram-ui-ux-redesign-plan.md)

## עקרונות עבודה

1. לא פותחים פער על "טעם אישי" בלבד.
2. כל פער חייב להיתמך לפחות באחד מאלה:
   - דרישת spec שלא ממומשת
   - בדיקת UI ידנית
   - פידבק משתמש ישיר על מסך קיים
   - סתירה ברורה בין הקוד לבין האפיון
3. מובייל הוא מסלול הבדיקה הראשון.
4. ה-step-by-step flow נשאר משטח המוצר הראשי.
5. כל משימה נסגרת רק אחרי בדיקת behavior מקומית, ואז בדיקת production אם השינוי נפרס.

## סטטוסי עבודה

- `open` - טרם התחיל
- `in_progress` - בעבודה
- `blocked` - תקוע ותלוי בגורם אחר
- `done` - הושלם ואומת

## רמות תיעדוף

- `P0` - חוסם שימוש או יוצר חוויית ליבה שבורה במובייל
- `P1` - פוגע משמעותית בבהירות, אמון, או מהירות שימוש
- `P2` - polish חשוב אך לא החסם הראשון

## טבלת פערים - Phase 4 UI/UX

| ID | סטטוס | תיעדוף | כותרת | תיאור הפער | הוכחה / מקור | דרך לתיקון | קושי | זמן משוער | מה נחשב תוקן | איך מאמתים |
|---|---|---|---|---|---|---|---|---|---|---|
| UIX-401 | done | P0 | שורת הפעולות העליונה במובייל עדיין גבוהה מדי | אזור ה-toolbar העליון ב-step-by-step תפס יותר מדי גובה מסך במובייל והקטין את כמות התוכן הקליני שמופיעה מעל ה-fold. | פידבק משתמש ישיר מ-`2026-07-01` + צילומי מסך בדיקה; בנוסף spec קובע שב-top context bar לא יהיו "too many competing controls". | נבנה toolbar מובייל קומפקטי יותר: שורת הקשר קצרה מעל פס פעולות אופקי/גלילתי, במקום grid גבוה של אריחים. | Medium | 0.5-1 יום | במסך ברוחב ~390px שורת הפעולות מרגישה כמו toolbar קצר, לא ככרטיס שלם. רואים מוקדם יותר את hero של התוכן הקליני הבא. | `lint` + `build`, בדיקת מובייל ידנית על `127.0.0.1:4175`, צילום מסך מקומי, `Validate` ירוק ב-GitHub, ובדיקת פרודקשן חיה על `https://bls-protocol.evyatarhazan.com/` ב-`393x852`. |
| UIX-402 | done | P1 | כותרת העליונה של האפליקציה עדיין צורכת יותר מדי מקום במובייל | ה-app shell העליון כלל badge + כותרת מוצר גדולה + כפתור תפריט גדול, וביחד לקח נפח מסך יקר לפני תחילת הלמידה. | [App.tsx](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/apps/client/src/App.tsx) + בדיקות מסך מובייל; spec דורש שה-step-by-step יהיה "center of gravity" ושמובייל ירגיש first-class. | ה-header במובייל כווץ: padding הוקטן, ה-badge הוקטן, הכותרת הוקטנה, וכפתור התפריט הפך לקומפקטי יותר בלי לפגוע בזיהוי ובתיחום המוצרי. | Medium | 0.5-1 יום | אזור ה-header במובייל מתקצר משמעותית בלי לאבד ניווט ותיחום מוצרי. | `lint` + `build`, בדיקת מובייל ידנית על `127.0.0.1:4175` ב-`393x852`, `Validate` ירוק ב-GitHub, ובדיקת פרודקשן חיה על `https://bls-protocol.evyatarhazan.com/`. |
| UIX-403 | done | P1 | נשארו שאריות visible English במשטח הליבה | למרות Phase 7, הכותרת הראשית הגלויה עדיין הוצגה כ-`Emergency Protocol Diagram` במקומות מרכזיים. זה החליש את כלל `Hebrew-first visible product`. | [App.tsx](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/apps/client/src/App.tsx) + [ui-ux-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-spec.md) תחת `Accessibility and Trust` ו-`Language must be consistently Hebrew-first`. | יושרו שמות המוצר הגלויים במסך הטעינה וב-header הראשי ל-`תרשים פרוטוקול חירום`, בלי לשנות בשלב הזה את metadata או title הדפדפן. | Low | 0.25-0.5 יום | לא נשארת כותרת אנגלית בולטת במשטח הלמידה הראשי בלי הצדקה. | `lint` + `build`, סריקת מחרוזות גלויה בקוד, בדיקת UI ידנית על `127.0.0.1:4175` ב-`393x852`, `Validate` ירוק ב-GitHub, ואימות פרודקשן חי על `https://bls-protocol.evyatarhazan.com/`. |
| UIX-404 | done | P1 | שכבת הקהילה במובייל עדיין inline במקום דפוס משני מובהק | ה-spec מגדיר העדפות כמו `bottom sheet on mobile` או `secondary tab/drawer`, אך הדיון הוצג inline מתחת לתוכן ודחף את הלומד מטה. | [ui-ux-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-spec.md) תחת `Community Layer`; הקוד הקודם ב-[StepByStepView.tsx](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/apps/client/src/components/StepByStep/StepByStepView.tsx) הציג panel inline פתוח. | במובייל הדיון הועבר ל-panel סגור כברירת מחדל עם פתיחה מפורשת. בדסקטופ הוא נשאר גלוי כדי לא לפגוע בשימוש השוטף. | Medium | 1-2 ימים | במובייל הדיון לא דוחף את הזרימה מטה כברירת מחדל, אבל נשאר זמין דרך פתיחה מפורשת וברורה. | `lint` + `build` + `test`, בדיקת מובייל ידנית ב-`393x852` שמאשרת collapsed-by-default, `Validate` ירוק ב-GitHub, ואימות פרודקשן חי על `https://bls-protocol.evyatarhazan.com/`. |
| UIX-405 | open | P2 | תבנית "אזור מיידי + אקורדיונים" עדיין ארוכה מדי מעל ה-fold | גם אחרי redesign phases, במסכים ראשונים עדיין נדרשת גלילה מוקדמת מדי כדי לראות את התוכן שמוגדר כ-"Immediate". זה מצביע על vertical rhythm שעדיין לא אופטימלי. | spec קובע `Immediate content first`; בבדיקות מסך האחרונות כמות chrome לפני התוכן עדיין גבוהה. | לבצע audit ממוקד ל-vertical rhythm: גובה hero, ריווח בין sections, גובה כותרות, ותמצות בלוקים קבועים במובייל. | Medium | 1-2 ימים | במסך ראשון התוכן המיידי מגיע מהר יותר לעין, בלי לפגוע בהבנה ובאמון. | השוואת before/after על 2-3 צמתים מייצגים במובייל. |

## סדר עבודה מומלץ - Phase 4 UI/UX

1. `UIX-401`
2. `UIX-402`
3. `UIX-403`
4. `UIX-404`
5. `UIX-405`

## Sanity Checks מחייבים לכל משימת UI/UX

1. האם נבדק מובייל אמיתי או emulation ברוחב רלוונטי?
2. האם השינוי חסך גובה/עומס ולא רק שינה צבעים או copy?
3. האם נשמרה הזרימה הראשית `S -> התרשמות זירה -> AVPU` בלי להעמיס chrome?
4. האם tap targets נשארו תקינים?
5. האם build עבר?
6. אם נפרס לפרודקשן: האם נבדק גם הדומיין החי ולא רק auto deployment status?

## לוג עדכונים

- `2026-07-03` - נפתח `Phase 4 UI/UX` חדש לאחר סגירת `Phase 3`, כדי לרכז backlog חדש המבוסס רק על ממצאי UI/UX מתועדים.
- `2026-07-03` - ה-backlog החדש נשען על שלושה סוגי ראיות בלבד: spec/task-list קיימים, בדיקות ידניות במובייל, ופידבק משתמש ישיר מתוך צילומי מסך והערות שימוש.
- `2026-07-05` - `UIX-401` נסגר: toolbar המובייל העליון של `StepByStep` כווץ משתי שורות גבוהות של אריחים לפס הקשר קצר + פס פעולות אופקי קומפקטי, עם אימות מקומי ב-`393x852`.
- `2026-07-05` - `UIX-401` אומת גם בפרודקשן החי: הדומיין `bls-protocol.evyatarhazan.com` הציג את toolbar המובייל הקומפקטי החדש לאחר הפריסה.
- `2026-07-05` - `UIX-402` נסגר: ה-header העליון במובייל כווץ באמצעות הקטנת ריווחים, badge, כותרת וכפתור התפריט, עם אימות מקומי ב-`393x852`.
- `2026-07-05` - `UIX-402` אומת גם בפרודקשן החי: הדומיין `bls-protocol.evyatarhazan.com` הציג header עליון קומפקטי יותר במובייל לאחר הפריסה.
- `2026-07-05` - `UIX-403` נסגר: השם הגלוי של המוצר יושר לעברית במסך הטעינה וב-header הראשי, ואומת מקומית ב-`393x852`.
- `2026-07-05` - `UIX-403` אומת גם בפרודקשן החי: הדומיין `bls-protocol.evyatarhazan.com` מציג את כותרת המוצר הראשית בעברית במשטח הליבה.
- `2026-07-06` - `UIX-404` נסגר: שכבת הקהילה במובייל הועברה ל-panel סגור כברירת מחדל עם פתיחה מפורשת, כך שהיא אינה מתחרה בגובה עם הזרימה הראשית.
- `2026-07-06` - `UIX-404` אומת גם בפרודקשן החי: במובייל שכבת הקהילה מופיעה כ-panel סגור כברירת מחדל ולא כבלוק inline פתוח.
