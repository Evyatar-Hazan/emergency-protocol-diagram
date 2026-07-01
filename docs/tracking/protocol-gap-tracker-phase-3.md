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
| GAP-019 | done | P0 | השלמות טראומה במודולים שעדיין `חלקי-טוב` | כל מודולי הטראומה שסווגו קודם כ-`חלקי-טוב` קיבלו כעת פיצול מלא או נימוק מפורש, כולל כוויות/שאיפת עשן/רקמות רכות. | לעבור מודול-מודול מול מקור האמת, להחליט לכל מודול אם צריך פיצול נוסף, צומת חדש, או רק חידוד טקסט/שאלות/מקורות. | High | 4-7 ימים | כל מודול שסווג `חלקי-טוב` ביחידה 3 מקבל סטטוס חדש: `מכוסה` או `נשאר חלקי בכוונה`, עם נימוק מפורש וראיית UI. | מעבר צומת-מול-מקור, update ל-coverage proof, והרצת תרחישי `14-17` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md). |
| GAP-019A | done | P1 | פיצול תרחישי טראומה משניים שעדיין "מובנים אך לא מלאים" | התרחישים `פגיעות שלד/עמ\"ש/קיבועים`, `טביעה/התחשמלות`, ו-`נשיכה/הכשה/פגיעה ימית` עברו קודם כ-`חלקי אך מובן`, ולכן נדרש היה להפוך אותם למסלולים חדים יותר ללומד. | להעמיק את שלושת תרחישי ה-reference האלה עד סטטוס `עובר`, או לתעד במפורש למה נשארים משניים. | Medium-High | 2-4 ימים | שלושת התרחישים מקבלים סטטוס סופי ברור במסמך E2E: `עובר` או `משני בכוונה` עם rationale. | הרצת שלושת התרחישים ידנית באתר, תיעוד צעדים, ועדכון סטטוס במסמך E2E. |
| GAP-020 | done | P0 | העמקת יחידה 5 באזורי מיילדות ותפעול קליני | מודול `40-obstetric-emergencies` קיבל כעת פיצול מלא לענפי סיבוך עיקריים, ועולמות התפעול (`43-45`) קיבלו מסקנת מוצר מפורשת שהם נשארים שכבת reference משנית בכוונה. | להשלים audit ממוקד של מודול `40` ושל שכבת `operational_support_overview`, ואז להחליט מה נשאר reference בלבד ומה מקבל העמקה גלויה. | High | 3-5 ימים | מודול `40` והצמתים התפעוליים מקבלים מסקנת מוצר מפורשת: `מכוסה`, `משני בכוונה`, או פער חדש שנגזר מהם. | בדיקת מסלול `special_patient_pregnancy -> obstetric_emergency` ובדיקת כל צמתי `operational_support_overview` מול מקור האמת. |
| GAP-021 | done | P1 | הרחבת שכבת הלמידה המשותפת מעבר לצומתי הליבה | שכבת `דגשי מדריך / טעויות / שאלות חזרה` הורחבה כעת מעבר לצומתי הליבה גם לענפים קליניים מרכזיים כמו שבץ, פרכוס, ACS, חנק, הלם טראומטי, לידה קרובה וחירום מיילדותי. | לבחור batch מסודר של צמתים קליניים מרכזיים ולהוסיף להם שכבת mentorship עקבית בלי להעמיס על המסך. | Medium | 3-5 ימים | לכל צומת ב-batch שנבחר יש שכבת למידה מלאה ועקבית, עם תוכן שבאמת עוזר ללומד להתקדם לשלב הבא. | בדיקת UI ידנית במסכים שנבחרו, review תוכן, build, וידוא שלא נוספה כפילות או עומס שבור. |
| GAP-021A | open | P2 | הוספת seed content מקצועי לשכבת הדיון | הדיון הטכני עובד, אבל הוא עדיין נשען על כך שמשתמש יכתוב ראשון. חסרים תכני פתיחה מקצועיים שיכוונו את המשתמש למה חשוב לשאול או לתקן. | להגדיר פורמט seed מצומצם לצמתים נבחרים: שאלת פתיחה, טעות נפוצה, או מקור חשוב. | Medium | 2-3 ימים | במספר צמתים מרכזיים מוצגים seeds או prompts מקצועיים ברורים שמניעים דיון איכותי. | בדיקת UI במצב ריק, reload, וידוא שהדיון נשאר משני ולא משתלט על הפרוטוקול. |
| GAP-022 | open | P1 | יישור מסמכי מצב וסיכונים למציאות החדשה | `current.md` עדיין מכיל ניסוחי `active fix` וסיכונים היסטוריים שכבר לא משקפים היטב את מצב האמת לאחר סגירת `Phase 2`. | לנקות את מסמכי המצב כך שיפרידו בין היסטוריה, סיכונים עדכניים, וה-backlog הפעיל החדש. | Low-Medium | 0.5-1 יום | מסמכי המצב מציגים רק backlog פעיל עדכני, בלי סתירות מול ה-tracker הנוכחי. | קריאה ידנית צולבת בין `current.md`, `tasks.md`, ו-`protocol-gap-tracker-phase-3.md`. |

## סדר עבודה מומלץ - Phase 3

### שלב 1 - כיסוי קליני ותפעולי

### שלב 2 - למידה וקהילה

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
- `2026-07-01` - שינוי `טביעה / התחשמלות` נבדק, נבנה, נדחף ל-`main` ב-commit `ddbc10a`, ו-Cloudflare Pages סימן deployment `ef24e0d5-ca09-4d79-882b-9f0d5ba823ff` כ-`Active`. מאחר שה-alias החי נשאר זמנית על bundle קודם, בוצע גם deploy ישיר של build `dist` על אותו hash, שיצר deployment `0041f4db`. לאחר מכן גם [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) וגם `emergency-protocol-diagram.pages.dev` עברו ל-bundle `assets/index-Z3qXvXYc.js`, והבאנדל החי הכיל את `drowning_incident`, `drowning_resuscitation`, `drowning_post_rescue`, `electrical_injury`, `electrical_resuscitation`, `electrical_conscious_management` ו-`environmental_temperature_injury`.
- `2026-07-01` - תת-השלמה שלישית תחת `GAP-019` נסגרה באזור `נשיכות / הכשות / פגיעות ימיות`: `trauma_animal_bites` הפך לשער החלטה, ונוספו הצמתים `animal_bite_rabies`, `venomous_bite_sting`, `marine_animal_injury`, `bee_sting_reaction` ו-`bee_sting_local_management`. במקביל תרחיש `16` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) הועלה מ-`חלקי אך מובן` ל-`עובר`, ו-`GAP-019A` נסגר.
- `2026-07-01` - שינוי `נשיכות / הכשות / פגיעות ימיות` נבדק, נבנה, נדחף ל-`main` ב-commit `961448c`, ו-Cloudflare Pages סימן deployment `ea02c58c-26b2-4461-9807-714045b26b0f` כ-`Active`. גם [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) וגם `emergency-protocol-diagram.pages.dev` עברו ל-bundle `assets/index-C1K6Iecx.js`.
- `2026-07-01` - תת-השלמה רביעית תחת `GAP-019` נסגרה באזור `הלם / עצירת דימומים`: נוספו `trauma_bleeding_control`, `trauma_wound_packing`, `trauma_tourniquet_control`, `trauma_shock_assessment`, `trauma_compensated_shock`, `trauma_decompensated_shock` ו-`trauma_internal_bleeding`. כך מודול `19-shock-and-hemorrhage-control` הועלה ל-`מכוסה`, ותרחיש `5` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) עודכן כך שישקף גם את מסלול הדימום/הלם החדש.
- `2026-07-01` - שינוי `הלם / עצירת דימומים` נבדק, נבנה, נדחף ל-`main` ב-commit `eeeb3b3`, ו-Cloudflare Pages סימן deployment `c56d0d47-05f3-445b-8759-0901f73119c8` כ-`Active`. מאחר שה-alias החי נשאר זמנית על bundle קודם, בוצע גם deploy ישיר של build `dist` על אותו hash, שיצר deployment `b16f652b`. לאחר מכן [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) עבר ל-bundle `assets/index-BwapvPnl.js`, והבאנדל החי הכיל את `trauma_bleeding_control`, `trauma_wound_packing`, `trauma_tourniquet_control`, `trauma_shock_assessment`, `trauma_compensated_shock`, `trauma_decompensated_shock` ו-`trauma_internal_bleeding`.
- `2026-07-01` - תת-השלמה חמישית תחת `GAP-019` נסגרה באזור `טראומת בטן / אגן`: `trauma_abdomen_pelvis` הפך לשער החלטה, ונוספו `trauma_penetrating_abdomen`, `trauma_blunt_abdomen`, `trauma_evisceration` ו-`trauma_pelvic_injury`. מודול `22-abdominal-trauma` הועלה ל-`מכוסה`, ותרחיש `7` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) עודכן למסלול טראומטי מובהק.
- `2026-07-01` - שינוי `טראומת בטן / אגן` נבדק, נבנה, נדחף ל-`main` ב-commit `42d7b42`, ו-Cloudflare Pages סימן deployment `f8b8432f-c82f-49a3-8eff-874da6d35a69` כ-`Active`. מאחר שה-alias החי נשאר זמנית על bundle קודם, בוצע גם deploy ישיר של build `dist` על אותו hash, שיצר deployment `8f828aac`. לאחר מכן [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) עבר ל-bundle `assets/index-X7plwzaw.js`, והבאנדל החי הכיל את `trauma_penetrating_abdomen`, `trauma_blunt_abdomen`, `trauma_evisceration` ו-`trauma_pelvic_injury`.
- `2026-07-01` - תת-השלמה שישית תחת `GAP-019` נסגרה באזור `רקמות רכות / כוויות / שאיפת עשן`: נוספו `trauma_soft_tissue_burns`, `smoke_inhalation` ו-`soft_tissue_wound_support`, ומסלול הכניסה של `כוויות / שאיפת עשן / רקמות רכות` הועבר משימוש עקיף ב-`A/B` לשער ייעודי בתוך `trauma_exposure_gate`. מודול `25-soft-tissue-burns-and-smoke-inhalation` הועלה ל-`מכוסה`, ותרחיש `17` ב-[reference-scenarios-e2e.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/reference-scenarios-e2e.md) נוסף כתרחיש `עובר`.
- `2026-07-01` - שינוי `רקמות רכות / כוויות / שאיפת עשן` נבדק, נבנה, נדחף ל-`main` ב-commit `944aa3a`, ו-Cloudflare Pages סימן deployment אוטומטי `5a191cf9-9797-4fa1-b269-69f0c8ee4ad9` עבורו. מאחר שהדומיין החי נשאר זמנית על bundle ישן, בוצע גם deploy ישיר משלים `1301fe1f`; לאחר מכן גם [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) וגם ה-deployment הישיר הגישו את `assets/index-CUOJiY88.js`, והבאנדל החי הכיל את `trauma_soft_tissue_burns`, `smoke_inhalation` ו-`soft_tissue_wound_support`.
- `2026-07-01` - `GAP-020` נסגר ברמת audit+מימוש: `obstetric_emergency` פוצל לצמתי `preeclampsia_eclampsia`, `pregnancy_bleeding_emergency`, `ectopic_pregnancy_emergency`, `obstetric_delivery_complication` ו-`pregnancy_trauma_emergency`, כך שמודול `40-obstetric-emergencies` הועלה ל-`מכוסה`. במקביל הוכרע רשמית שצמתי `monitor_ecg_operation`, `team_management_operational` ו-`ambulance_operations` נשארים `משני / בכוונה` כ-layer תפעולי אחרי ההערכה הקלינית.
- `2026-07-01` - שינוי `GAP-020` נבדק, נבנה, נדחף ל-`main` ב-commit `dcb9745`, ו-Cloudflare Pages סימן deployment אוטומטי `7002d2a2-aa90-4c40-a654-bea791dcbbec` כ-`Active`. מאחר שגם ה-auto deployment וגם ה-bundle `index-Cz8zG0xb.js` לא הכילו בפועל את ענפי המיילדות החדשים, בוצע deploy ישיר משלים `ad147d74`. לאחר מכן [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) וה-deployment הישיר עברו ל-`assets/index-yRGd0GEq.js`, והבאנדל החי הכיל את `preeclampsia_eclampsia`, `pregnancy_bleeding_emergency`, `ectopic_pregnancy_emergency`, `obstetric_delivery_complication` ו-`pregnancy_trauma_emergency`.
- `2026-07-01` - `GAP-021` נסגר ברמת batch ראשון של שכבת הלמידה המשותפת: נוספו `דגשי מדריך`, `טעויות נפוצות`, `שאלות חזרה` ו-`הערת מדריך` לצמתים `choking_protocol`, `acute_coronary_syndrome`, `stroke`, `seizure`, `trauma_shock_assessment`, `imminent_delivery` ו-`obstetric_emergency`, כך שהשכבה כבר לא מוגבלת רק לצומתי ליבה כלליים.
- `2026-07-01` - שינוי `GAP-021` נבדק, נבנה, נדחף ל-`main` ב-commit `a78fb61`, ו-Cloudflare Pages סימן deployment אוטומטי `a78437b0-72d9-42cd-87a7-4ac88d103b5f` כ-`Active`. מאחר שה-bundle האוטומטי `index-Dv-pzosb.js` לא כלל בפועל את טקסטי ה-guidance החדשים, בוצע deploy ישיר משלים `4bc31c0c`, שהגיש את `assets/index-Bw0GNwJ3.js` עם התוכן החדש. לאחר propagation הדומיין החי [bls-protocol.evyatarhazan.com](https://bls-protocol.evyatarhazan.com/) עבר ל-`assets/index-Drkzj1MJ.js`, ובבאנדל החי אומתו טקסטי ההדרכה החדשים.
