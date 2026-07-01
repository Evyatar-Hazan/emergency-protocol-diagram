# Protocol Gap Tracker - Phase 3

## מטרת המסמך

מסמך זה נפתח לאחר סגירת כל פערי `Phase 2`.

המטרה שלו היא לנהל רק את מה שבאמת נשאר פתוח עכשיו, לפי שלוש שכבות ברורות:

1. העמקת כיסוי בצמתים שסווגו כ-`חלקי-טוב`
2. הרחבת שכבת הלמידה המשותפת מצומתי ליבה לצמתים קליניים נוספים
3. ייצוב תיעוד ומנגנון בדיקות כדי שלא נחזור שוב לסגירת-שווא

## על מה המסמך מבוסס

- [coverage-proof-units-3-5.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/coverage-proof-units-3-5.md)
- [reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md)
- [community-shared-learning-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/community-shared-learning-spec.md)
- [content-change-dod.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/content-change-dod.md)

## עקרונות עבודה

1. הזרימה הראשית נשארת קשיחה:
   `S -> התרשמות זירה -> AVPU -> המשך לפי ממצאים`
2. לא פותחים פער חדש על אזור שכבר הוכח כ-`מכוסה`, אלא רק על אזור שסווג במפורש כ-`חלקי-טוב` או `הרחבה עתידית`.
3. שכבות `קהילה`, `למידה`, `תפעול` ו-`reference` חייבות להישאר משניות לפרוטוקול הראשי.
4. כל משימה חייבת להיסגר עם הוכחת behavior ולא רק diff בקוד.

## סטטוסי עבודה

- `open` - טרם התחיל
- `in_progress` - בעבודה
- `blocked` - תקוע ותלוי בגורם אחר
- `done` - הושלם ואומת

## רמות תיעדוף

- `P0` - פער שמונע מאיתנו לטעון לכיסוי מוצרי/לימודי מלא
- `P1` - פער חשוב מאוד לחוויית למידה או שלמות קלינית
- `P2` - שיפור משמעותי, אך לא החסם הראשון

## טבלת פערים - Phase 3

| ID | סטטוס | תיעדוף | כותרת | תיאור הפער | דרך לתיקון | קושי | זמן משוער | מה נחשב תוקן | איך מאמתים |
|---|---|---|---|---|---|---|---|---|---|
| GAP-019 | in_progress | P0 | השלמות טראומה במודולים שעדיין `חלקי-טוב` | במסמך ה-coverage proof נשארו מודולי טראומה שימושיים אך לא מלאים: הלם טראומטי, טראומת בטן, כוויות/עשן ונשיכות/הכשות. תתי-השלמה ראשונות כבר נסגרו באזור `שלד / קיבועים / עמ\"ש` ובאזור `טביעה / התחשמלות`. | לעבור מודול-מודול מול מקור האמת, להחליט לכל מודול אם צריך פיצול נוסף, צומת חדש, או רק חידוד טקסט/שאלות/מקורות. | High | 4-7 ימים | כל מודול שסווג `חלקי-טוב` ביחידה 3 מקבל סטטוס חדש: `מכוסה` או `נשאר חלקי בכוונה`, עם נימוק מפורש וראיית UI. | מעבר צומת-מול-מקור, update ל-coverage proof, והרצת תרחישי `14-16` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md). |
| GAP-019A | open | P1 | פיצול תרחישי טראומה משניים שעדיין "מובנים אך לא מלאים" | התרחישים `פגיעות שלד/עמ\"ש/קיבועים`, `טביעה/התחשמלות`, ו-`נשיכה/הכשה/פגיעה ימית` עוברים כיום כ-`חלקי אך מובן`, ולכן הם לא נשברים אבל עדיין לא נותנים מסלול חד מספיק ללומד. | להעמיק את שלושת תרחישי ה-reference האלה עד סטטוס `עובר`, או לתעד במפורש למה נשארים משניים. | Medium-High | 2-4 ימים | שלושת התרחישים מקבלים סטטוס סופי ברור במסמך E2E: `עובר` או `משני בכוונה` עם rationale. | הרצת שלושת התרחישים ידנית באתר, תיעוד צעדים, ועדכון סטטוס במסמך E2E. |
| GAP-020 | open | P0 | העמקת יחידה 5 באזורי מיילדות ותפעול קליני | `40-obstetric-emergencies` עדיין מסומן `חלקי-טוב`, ועולמות תפעול כמו מוניטור/ניהול צוות/נהיגת אמבולנס מסווגים כמשניים אך עדיין דורשים החלטת מוצר ברורה על עומק, תצוגה ויחס ללומד. | להשלים audit ממוקד של מודול `40` ושל שכבת `operational_support_overview`, ואז להחליט מה נשאר reference בלבד ומה מקבל העמקה גלויה. | High | 3-5 ימים | מודול `40` והצמתים התפעוליים מקבלים מסקנת מוצר מפורשת: `מכוסה`, `משני בכוונה`, או פער חדש שנגזר מהם. | בדיקת מסלול `special_patient_pregnancy -> obstetric_emergency` ובדיקת כל צמתי `operational_support_overview` מול מקור האמת. |
| GAP-021 | open | P1 | הרחבת שכבת הלמידה המשותפת מעבר לצומתי הליבה | שכבת `דגשי מדריך / טעויות / שאלות חזרה` קיימת כרגע רק לצומתי ליבה נבחרים, אבל לא לענפים קליניים מרכזיים כמו שבץ, פרכוס, ACS, חנק, הלם, לידה וטראומה ייעודית. | לבחור batch מסודר של צמתים קליניים מרכזיים ולהוסיף להם שכבת mentorship עקבית בלי להעמיס על המסך. | Medium | 3-5 ימים | לכל צומת ב-batch שנבחר יש שכבת למידה מלאה ועקבית, עם תוכן שבאמת עוזר ללומד להתקדם לשלב הבא. | בדיקת UI ידנית במסכים שנבחרו, review תוכן, build, וידוא שלא נוספה כפילות או עומס שבור. |
| GAP-021A | open | P2 | הוספת seed content מקצועי לשכבת הדיון | הדיון הטכני עובד, אבל הוא עדיין נשען על כך שמשתמש יכתוב ראשון. חסרים תכני פתיחה מקצועיים שיכוונו את המשתמש למה חשוב לשאול או לתקן. | להגדיר פורמט seed מצומצם לצמתים נבחרים: שאלת פתיחה, טעות נפוצה, או מקור חשוב. | Medium | 2-3 ימים | במספר צמתים מרכזיים מוצגים seeds או prompts מקצועיים ברורים שמניעים דיון איכותי. | בדיקת UI במצב ריק, reload, וידוא שהדיון נשאר משני ולא משתלט על הפרוטוקול. |
| GAP-022 | open | P1 | יישור מסמכי מצב וסיכונים למציאות החדשה | `current.md` עדיין מכיל ניסוחי `active fix` וסיכונים היסטוריים שכבר לא משקפים היטב את מצב האמת לאחר סגירת `Phase 2`. | לנקות את מסמכי המצב כך שיפרידו בין היסטוריה, סיכונים עדכניים, וה-backlog הפעיל החדש. | Low-Medium | 0.5-1 יום | מסמכי המצב מציגים רק backlog פעיל עדכני, בלי סתירות מול ה-tracker הנוכחי. | קריאה ידנית צולבת בין `current.md`, `tasks.md`, ו-`protocol-gap-tracker-phase-3.md`. |

## סדר עבודה מומלץ - Phase 3

### שלב 1 - כיסוי קליני ותפעולי

1. `GAP-019`
2. `GAP-019A`
3. `GAP-020`

### שלב 2 - למידה וקהילה

1. `GAP-021`
2. `GAP-021A`

### שלב 3 - יישור מסמכי מצב

1. `GAP-022`

## Sanity Checks מחייבים לכל משימה

1. האם נבדק ה-flow האמיתי מקצה לקצה ולא רק הצומת הבודד?
2. האם נבדק שהמסלול החדש לא שבר את הזרימה הראשית `S -> התרשמות זירה -> AVPU`?
3. האם נבדקו `build` וטעינת מסך אמיתית אחרי השינוי?
4. האם נבדקו גם state ריק / state עמוס / reload אם רלוונטי?
5. האם נבדק פרודקשן אחרי `push` ל-`main` כאשר השינוי משפיע על UI, API או תוכן פעיל?
6. האם עודכן גם המסמך שמוכיח את הסגירה, ולא רק הקוד?

## לוג עדכונים

- `2026-07-01` - נוצר מסמך `Phase 3` חדש לאחר שהתברר שאין עוד פערי `Phase 2` פתוחים, אך נשארו אזורי `חלקי-טוב` והרחבות עתידיות שדורשים backlog חדש ומפורש.
- `2026-07-01` - `GAP-019` הועבר ל-`in_progress`. תת-השלמה ראשונה נסגרה באזור `שלד / קיבועים / עמ"ש`: `trauma_spine_extremity` פוצל ל-`trauma_spine_precautions`, `trauma_fracture_assessment`, `trauma_splinting` ו-`trauma_open_fracture_bleeding`, ותרחיש `14` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) הועלה ל-`עובר`.
- `2026-07-01` - השינוי של `GAP-019` נבדק, נבנה, נדחף ל-`main` ב-commit `1041a2d`, ו-Cloudflare Pages סימן deployment `30582114-0e82-419b-a71a-57931e624330` כ-`Active`. לאחר propagation הדומיין החי [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) עבר ל-bundle `assets/index-C4oWjfvh.js`, והבאנדל החי הכיל את `trauma_spine_precautions`, `trauma_fracture_assessment`, `trauma_splinting` ו-`trauma_open_fracture_bleeding`.
- `2026-07-01` - תת-השלמה שנייה תחת `GAP-019` נסגרה באזור `טביעה / התחשמלות`: `trauma_environmental` הפך לשער כניסה סביבתי עם פיצול ל-`drowning_incident`, `drowning_resuscitation`, `drowning_post_rescue`, `electrical_injury`, `electrical_resuscitation`, `electrical_conscious_management` ו-`environmental_temperature_injury`, ותרחיש `15` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) הועלה ל-`עובר`.
