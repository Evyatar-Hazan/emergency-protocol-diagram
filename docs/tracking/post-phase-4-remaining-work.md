# Remaining Work After Phase 4

## מטרת המסמך

מסמך זה מרכז רק את מה שנשאר לעשות אחרי סגירת:

1. `Phase 3` הקליני הקודם
2. `Phase 4 UI/UX`
3. שלבי ה-redesign `Phase 5-9` כפי שהם מתועדים ב-[ui-ux-redesign-task-list.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-task-list.md)

המסמך הזה לא פותח backlog חדש "מהבטן".
כל סעיף כאן נשען על אחד מהבאים:

- משימות פתוחות ב-[overview.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/overview.md)
- מיקוד וסיכונים ב-[current.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md)
- פערי trust/verification שעולים מתוך מסמכי המעקב וה-production workflow

## סטטוסים

- `open` - טרם התחיל
- `in_progress` - בעבודה
- `blocked` - תקוע
- `done` - הושלם ואומת

## תיעדוף

- `P0` - פוגע בנכונות קלינית או באמון בליבת המוצר
- `P1` - חשוב מאוד להשלמת המוצר כפלטפורמת לימוד אמינה
- `P2` - שיפור תומך או תחזוקתי

## משימות פתוחות בלבד

| מס' | ID | סטטוס | תיעדוף | כותרת | תיאור | מקור | דרך תיקון | מה נחשב תוקן | איך בודקים |
|---|---|---|---|---|---|---|---|---|---|
| 1 | REM-001 | in_progress | P0 | Audit קליני רוחבי לפי `ABCDE` מול חומרי הדרייב | למרות סגירת פערי הכיסוי הגדולים, נשאר צורך מתמשך לבצע audit רוחבי על צמתים מרכזיים לפי `A/B/C/D/E`, ולוודא שהניסוח, הסדר וההכוונה באמת תואמים למסלול BLS של חובש/נהג אמבולנס. | [overview.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/overview.md) תחת `משימות פתוחות`; [current.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md) תחת `מיקוד נוכחי`. | לעבור שלב-שלב על צמתי הליבה: `scene`, `AVPU`, `A`, `B`, `C`, `D`, `E`, `secondary survey`, ולפתוח תתי-משימות רק כשנמצא mismatch אמיתי מול מקור האמת. | לכל שלב ליבה יש audit מתועד, עם מקורות גלויים, וללא פער קליני פתוח לא ממוסמך. | השוואה צומת-מול-מקור, `build`, `test`, ובדיקת UI ידנית במסלולים המרכזיים. |
| 2 | REM-001A | open | P0 | ניקוי זליגת ALS מהתוכן שמיועד ל-BLS | חלק מהסיכון בפרויקט הוא זליגה של שפת ALS, טיפול מתקדם, או רמת החלטה שלא מתאימה ללומד BLS/חובש/נהג אמבולנס. | [overview.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/overview.md) תחת `משימות פתוחות`; `סיכונים`. | לבצע pass ייעודי על צמתים רפואיים ולטראומה, לסמן ניסוחים/טיפולים שחוצים את גבול ה-BLS, ולדייק אותם לשפת זיהוי, תמיכה, הזעקת ALS, ופינוי. | אין בצמתי הליבה הוראות שמציגות טיפול ALS כאילו הוא חלק מה-flow הראשי של חובש/נהג אמבולנס. | review תוכני מול מקור האמת + בדיקה ידנית של צמתים בסיכון גבוה כמו נשימה, קרדיו, טראומה ומיילדות. |
| 3 | REM-001B | open | P1 | השלמת מקורות גלויים בכל צומת מרכזי | המיקוד הנוכחי בפרויקט מגדיר הוספת מקורות גלויים בכל צומת מרכזי, אך אין עדיין הוכחת סגירה רוחבית ומרוכזת לכל צמתי הליבה. | [current.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md) תחת `מיקוד נוכחי`. | לבנות checklist לצמתי הליבה ולוודא שלכל צומת מרכזי יש section מקורות ברור, עברי, ונאמן למודול המקור המתאים. | לכל צומת מרכזי בליבת ה-flow יש לפחות מקור גלוי אחד רלוונטי, ללא placeholders וללא קישורים שגויים. | בדיקת UI ידנית על צמתים מייצגים + קריאה ישירה ב-`unified-flow.json` או שכבת התוכן שמזינה אותם. |
| 4 | REM-002 | open | P1 | יישור מתמשך בין ריפו, פרודקשן והכספת | הפרויקט כבר חווה מקרים שבהם התיעוד, הריפו והפרודקשן לא שיקפו בדיוק את אותו מצב. זה לא bug יחיד אלא עבודת תחזוקה שוטפת שחייבת להיות מפורשת כ-backlog. | [current.md](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md) תחת `מיקוד נוכחי` ו-`סיכונים עדכניים בלבד`. | להמשיך לאכוף את טקס הסגירה: שינוי, בדיקה, push, אימות production, עדכון tracker, ועדכון vault. לפתוח תתי-משימות רק כשנמצא mismatch בפועל. | אין mismatch פתוח ידוע בין קוד, פרודקשן ותיעוד; כל שינוי עתידי נסגר עם ראיות. | `git`, בדיקת workflow, בדיקת production חיה, וקריאה צולבת של tracker + vault. |
| 5 | REM-003 | open | P2 | פתיחת backlog עתידי רק על בסיס audit מתועד | שלבי ה-redesign המוצריים כבר סגורים. אם נרצה לפתוח שלב UI/UX חדש או שכבת מוצר חדשה, זה חייב לנבוע מ-audit, מחקר שימוש, או פער מתועד ולא מרעיונות כלליים. | [protocol-gap-tracker-phase-4-ui-ux.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/protocol-gap-tracker-phase-4-ui-ux.md) תחת `עקרונות עבודה`; [ui-ux-redesign-task-list.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/redesign/ui-ux-redesign-task-list.md) מראה ש-Phase 5-9 כבר הושלמו. | לא לפתוח phase חדש לפני audit ייעודי. אם ייאספו ממצאים, לפתוח tracker חדש עם ראיות בלבד. | כל backlog חדש שנפתח בעתיד יהיה מבוסס מסמך ממצאים מסודר, לא על תחושת בטן. | בדיקת קיום audit/brief לפני פתיחת backlog חדש. |

## סדר עבודה מומלץ

1. `REM-001`
2. `REM-001A`
3. `REM-001B`
4. `REM-002`
5. `REM-003`

## הערה חשובה

נכון לעכשיו:

- אין משימות UI/UX פתוחות במסמך `Phase 4`
- אין פערי כיסוי פתוחים במסמכי `Phase 2-3`
- אין צורך לפתוח כרגע עוד redesign phase בלי audit חדש

השלב הבא ההגיוני הוא audit קליני-תוכני מסודר, לא עוד polish עיצובי.

## Update Log

- `2026-07-06` - `REM-001` הועבר ל-`in_progress`. הושלם סבב audit ראשון לפתיחת הזרימה (`report_departure -> scene_assessment -> avpu_check`), שלושה ממצאים נקודתיים תוקנו מיד, ונוצר מסמך ליווי [rem-001-opening-flow-audit.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/rem-001-opening-flow-audit.md).
- `2026-07-06` - סבב הפתיחה של `REM-001` אומת גם בפרודקשן: ריצת `Validate` `28780100135` עברה, והבאנדל החי הכיל את ניסוח ה-`AVPU` והמקורות החדשים לפתיחת הזרימה.
- `2026-07-06` - הושלם סבב audit שני של `REM-001` לבלוק `breathing_check -> abcde_assessment -> airway_assessment -> breathing_assessment`. יושרו מקורות האמת ל-`יחידה 03`, `יחידה 06`, `יחידה 15` ו-`יחידה 3-2`, ונוצר מסמך ליווי [rem-001-breathing-and-abcde-audit.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/rem-001-breathing-and-abcde-audit.md).
- `2026-07-06` - סבב ה-`breathing + ABCDE` של `REM-001` אומת מקצה לקצה: `build` ו-`test` עברו לוקאלית, ריצת `Validate` `28780864595` עברה, ובפרודקשן החי אומת שהבאנדל כולל את מקורות `יחידה 03`, `יחידה 06`, `יחידה 15` ו-`יחידה 3-2`.
- `2026-07-06` - הושלם סבב audit שלישי של `REM-001` לבלוק `circulation_assessment -> circulation_status -> disability_assessment -> exposure_assessment -> exposure_status`. יושרו מקורות הליבה ל-`יחידה 06`, `יחידה 19`, `יחידה 13` ו-`יחידה 3-2`, ונוצר מסמך ליווי [rem-001-cde-audit.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/rem-001-cde-audit.md).
