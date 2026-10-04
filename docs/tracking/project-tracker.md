# Emergency Protocol Diagram — Project Tracker

## תפקיד המסמך

זהו מקור האמת המורחב והיחיד בריפו עבור:

- מצב הפרויקט הנוכחי
- משימות פתוחות ותיעדוף
- Definition of Done ודרך אימות
- קישורים למסמכי שלבים, audits והיסטוריה

הכספת שומרת תקציר תמציתי בלבד ומפנה למסמך הזה:

- [מצב נוכחי בכספת](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/current.md)
- [משימות פתוחות בכספת](/Users/evyatarhazan/Desktop/project/ai-memory-vault/10_ENTITIES/Projects/Emergency-Protocol-Diagram/tasks.md)

## כללי מקור אמת

1. משימה חדשה או שינוי סטטוס מתועדים קודם כאן בפירוט.
2. הכספת מסונכרנת לאחר מכן בתקציר קצר בלבד.
3. מסמכי Phase, redesign ו-audit הם מסמכי הוכחה והיסטוריה, לא רשימות מתחרות של משימות פתוחות.
4. backlog חדש נפתח רק לפי [REM-003 Audit Gate](./rem-003-audit-gate.md).
5. משימה נסגרת רק לאחר validation מקומי, אימות CI/Production לפי הצורך, ועדכון המסמך הזה והכספת.

## תמונת מצב מאומתת

נכון ל-`2026-08-14`, עבור בסיס האפליקציה והאבטחה האחרון שאומת:

- branch: `main`
- application baseline: `c7275a5`
- Git: נקי ומסונכרן ל-`origin/main`; את HEAD הנוכחי קוראים מ-Git בזמן אמת ולא משכפלים במסמך
- סביבת shell מקומית: `fnm 1.39.0` מגדיר את Node `20.20.2` כברירת מחדל ומכבד את `.nvmrc`
- validation תחת Node `20.20.2`: `build`, `lint`, ו-`42/42` בדיקות עברו
- GitHub Actions: ריצת `Validate` מספר `31800392473` עברה, כולל production dependency audit ושני coverage gates
- Cloudflare Pages: deployment פונקציונלי `91fe60b6` נוצר מ-`c7275a5`
- Production: `https://bls-protocol.evyatarhazan.com/` מחזיר `200`
- D1 health: `/api/health` מחזיר `{"status":"ok","database":"ready"}`
- Comments read path: `/api/comments/pulse_check` מחזיר `{"comments":[]}`
- `npm audit`: ‏0 חולשות
- `npm audit --omit=dev`: ‏0 חולשות
- Production API coverage: ‏83.85% statements, ‏71.21% branches, ‏83.33% functions, ‏84.65% lines
- Client critical-logic coverage: ‏96.62% statements, ‏92.10% branches, ‏100% functions, ‏97.64% lines

commit תיעוד עשוי ליצור CI ו-deployment חדשים בלי לשנות את האפליקציה. לכן ה-HEAD, ריצת ה-CI וה-deployment האחרונים נבדקים בזמן אמת ואינם נשמרים כאן כערכים “אחרונים” קבועים.

## בסיס ראיות ל-audit מקצה לקצה — 2026-08-14

- קוד מקומי: `build`, ‏`lint` ו-`42/42` בדיקות עברו תחת Node `20.20.2`; ‏`npm audit` ו-`npm audit --omit=dev` החזירו 0 חולשות.
- גרף התוכן: 205 צמתים, 358 קשתות, 0 יעדים חסרים, 0 כותרות/גופים חסרים; 193 צמתים נגישים מההתחלה ו-12 אינם נגישים.
- מקורות: בכל 205 הצמתים יש מקורות; נסרקו 54 כתובות ייחודיות ב-317 הופעות. 6 כתובות ייחודיות מחזירות `404` ב-53 הופעות, כתובת Drive אחת מחזירה `400` בשתי הופעות, ו-5 כתובות `gov.il` מחזירות `403` לבודק האוטומטי ולכן דורשות בדיקה ידנית ואינן מסומנות כשבורות.
- תרחישים: מסמך הייחוס מגדיר 17 תרחישים וכל הצמתים המוזכרים בו קיימים ונגישים מבנית; תרחישי דפדפן מייצגים עברו ידנית, אך אין בריפו suite הרצה של Playwright/Cypress.
- סביבת Cloudflare מקומית: הרצה ראשונית החזירה `D1_ERROR: no such table: comments`, וה-client הציג `Axios Network Error` עקב API base שאינו same-origin. לאחר החלת `sql/d1-community-schema.sql` ובנייה עם `VITE_API_URL=/api`, קריאת comments החזירה `200` ללא שגיאת דפדפן.
- פרודקשן: האתר ונתיבי health/comments הציבוריים זמינים. נתיבי auth שליליים החזירו `401/400` כמצופה ו-`OPTIONS` החזיר `204`; פעולות קהילה מאומתות עם משתמש אמיתי לא בוצעו ללא חשבון בדיקה.
- Lighthouse בפרודקשן: Performance ‏67, Accessibility ‏100, Best Practices ‏100, SEO ‏91; ‏FCP ‏4.3s, ‏LCP ‏5.5s, ‏TBT ‏0, ‏CLS ‏0, וכ-115KiB JavaScript לא מנוצל. audit נפרד מצא 6 כשלי `label-content-name-mismatch` אף שציון הקטגוריה נשאר 100.
- איכות קוד: `jscpd` מצא 13 קבוצות שכפול ו-3.57% שכפול כולל; `knip` מצא 5 קבצי client לא בשימוש, 2 dependencies לא בשימוש ו-exports חשודים; `StepByStepView.tsx` מכיל 1,163 שורות.
- אבטחה: לא נצפו בפרודקשן `Content-Security-Policy`, ‏`Strict-Transport-Security`, ‏`X-Frame-Options` או `Permissions-Policy`; זהו פער hardening, לא הוכחה לניצול.

## Weekly audit snapshot — 2026-08-18

- קוד מקומי: `build`, ‏`lint`, ‏`test`, ‏`test:coverage`, ‏`npm audit` ו-`npm audit --omit=dev` עברו תחת Node `20.20.2`.
- בדיקות: `12/12` בדיקות client ו-`30/30` בדיקות server עברו; סיכום coverage נשאר Production API ‏83.85/71.21/83.33/84.65 ו-client critical logic ‏96.62/92.10/100/97.64.
- מצב התקנה: `npm ci` ו-`npm install --ignore-scripts` נתקעו ללא child process נראה לעין ונעצרו ידנית; לאחר מכן `npm ls --depth=0` חזר בקוד `0`, אך עדיין הציג 5 packages `extraneous` ברמת root. זהו ממצא install hygiene/parity, לא כשל build או production.
- Git ו-CI: `main` מסונכרן ל-`origin/main` על `ad45ecf`; GitHub Actions `Validate` run `31800640143` עבר על אותו commit.
- Cloudflare Pages: Production deployment `e949d9c9` נוצר מ-`ad45ecf`; הדומיין החי וה-deployment URL החזירו `200`, ו-`/api/health` החזיר `{"status":"ok","database":"ready"}`.
- Production API: `/api/comments/pulse_check` החזיר `{"comments":[]}` מהדומיין החי ומכתובת ה-deployment; הבאנדל החי `assets/index-BisDekXL.js` הכיל מחרוזות צפויות מהזרימה ושכבת הקהילה.
- Backlog: לא נסגרו משימות חדשות מאז snapshot `2026-08-14`; 21 המשימות המאושרות נשארות פתוחות לפי התיעדוף הקיים.

## Weekly audit snapshot — 2026-08-26

- קוד מקומי: `npm ci --dry-run`, ‏`build`, ‏`lint`, ‏`test`, ‏`test:coverage`, ‏`npm audit --audit-level=high` ו-`npm audit --omit=dev --audit-level=high` עברו תחת Node `20.20.2`.
- בדיקות: `12/12` בדיקות client ו-`30/30` בדיקות server עברו; סיכום coverage נשאר Production API ‏83.85/71.21/83.33/84.65 ו-client critical logic ‏96.62/92.10/100/97.64.
- מצב התקנה: `npm ls --depth=0` חזר בקוד `0`, אך עדיין מציג packages `extraneous`; `npm ci --dry-run` מראה שהיה מסיר aliases/חבילות extraneous ומוסיף optional platform packages. `ENV-003` נשאר פתוח.
- Git ו-CI: `main` נקי ומסונכרן ל-`origin/main` על `83dc257`; GitHub Actions `Validate` run `32105913062` עבר על אותו commit.
- Cloudflare Pages: Production deployment `e4f39ec1` נוצר מ-`83dc257`; הדומיין החי וה-deployment URL החזירו `200`, ו-`/api/health` החזיר `{"status":"ok","database":"ready"}`.
- Production API: `/api/comments/pulse_check` החזיר `{"comments":[]}` מהדומיין החי ומכתובת ה-deployment; הבאנדל החי `assets/index-BisDekXL.js` הכיל מחרוזות צפויות מהזרימה ושכבת הקהילה.
- Backlog: לא נסגרו משימות חדשות מאז snapshot `2026-08-18`; `ENV-003` תועד כשורת P3 מלאה כי הוא כבר הופיע בתקציר הכספת וב-snapshot הקודם.

## Backlog פעיל

כל המשימות להלן נפתחו על בסיס ה-audit העובדתי מ-`2026-08-14` ועומדות ב-[REM-003 Audit Gate](./rem-003-audit-gate.md).

### Jarvis 66 — Community trust and moderation candidate — 2026-10-04

- המועמד המקורי `58f1ed2` הוכנס זמנית כ־`12f907a` ובוטל לפני ה־safe release
  ב־`5eac393`. סיבת ה־revert אינה כתובה בהודעת הקומיט; רצף ההיסטוריה והחסמים
  מצביעים על הוצאה מהשחרור לפני אישור migration/מדיניות ושער fail-closed.
- המימוש שולב מחדש בענף המבודד `codex/jarvis-66-community-safety-v2` על בסיס
  `ee3ecb2622d1844f2c0e8546076bb1fae3088b1e`; טרם נדחף, מוזג או נפרס.
- נוספו תוויות fail-closed: `תוכן קהילתי — לא מאושר` ו־
  `נבדק לפי מדיניות הקהילה — לא אישור קליני`. אין פעולה או badge בשם `approve`.
- נוספו דיווח בסיבה סגורה בלבד, תור סקירה לאדמין, soft hide/restore ו־audit trail.
  ברירת המחדל לכל תגובה קיימת נשארת `community_unreviewed + visible`; אין שינוי תוכן.
- נוסף שער כפול וכבוי כברירת מחדל: `VITE_ENABLE_COMMUNITY_MODERATION=false` ב־client
  ו־`COMMUNITY_MODERATION_ENABLED=false` ב־Pages Function. כשהשער סגור, נתיבי
  moderation מחזירים `404` לפני auth/D1 וקריאת תגובות ממשיכה לעבוד מול הסכמה הישנה.
- פעולות moderation מאמתות מחדש את תפקיד האדמין ואת חשבון Google מול D1; טוקן ישן
  עם claim של אדמין אינו מספיק אם התפקיד הנוכחי הוסר.
- אימות Google דורש `GOOGLE_CLIENT_ID` מפורש ותואם audience; קונפיגורציה חסרה או
  placeholder נכשלת סגור לפני פנייה ל־Google או ל־D1.
- בדיקות סינתטיות מכסות guest/user/admin, חסימת שדות חופשיים, הרשאות תור/פעולות,
  gate כבוי, תאימות לסכמה הישנה, טוקן אדמין מיושן וחסימת `approve`. עברו client
  `169/169`, server `46/46`, שישה fixtures של clinical schema ו־20/20 תרחישי ייחוס.
  ‏lint, typecheck, build ושני coverage gates עברו תחת Node `22.23.2`; תקציב CSS הכולל
  עבר עם `11,951/12,288` gzip bytes.
- ה־audit נכתב לכל פעולת moderation, אך אינו מוגדר כראיה בלתי־מחיקה: hard delete קיים
  עשוי למחוק רשומות קשורות לפי FK. deployment דורש החלטת retention/deletion, בעלים/SLA,
  הכרעת מודל admin ו־review של migration עם גיבוי, rollback ו־schema readback.
- לא נעשה שימוש בנתוני מטופלים, תגובות חיות או ספק analytics; לא בוצע migration חי.
- מדיניות מלאה: [community-moderation-policy.md](../governance/community-moderation-policy.md).

### Task 68 — סביבת עריכת תוכן מקומית — integrated and deployed 2026-10-03

- מומשה סביבת טיוטות מקומית לצמתים עם preview diff, validation, workflow סקירה, revisions ו־rollback append-only.
- הטיוטות נשמרות ב־`localStorage` בלבד ואינן משנות את `unified-flow.json`; אין פעולת publish, והכניסה לעורך נשארת feature-gated וכבויה כברירת מחדל בקוד.
- ה־review gates משתמשים בחוזה runtime של provenance ממשימה 69 ונכשלים סגור בכל מצב שאינו `ready`, וכן על `pending`, ‏`unknown`, מקור ששונה או היעדר reviewer בלתי תלוי.
- המימוש שולב ב־`main` ב־commit ‏`3ee3587`; ‏GitHub Actions `Validate` ריצה `37148085335` עברה על `9b7a1323961f87847ee86f2eede3c2fd5b07d97c`.
- Cloudflare Production deployment ‏`5afe3b67-926f-483f-a6cf-2f7cf38a21a5` נבנה מ־`9b7a132`; הדומיין החי וכתובת ה־deployment החזירו `200`, ו־`/api/health` החזיר `{"status":"ok","database":"ready"}` בשניהם.
- השלמת התשתית אינה מאשרת תוכן רפואי כלשהו ואינה סוגרת את `CONTENT-001`, ‏`CLIN-001` או `CLIN-002`.
- תיעוד: [content-editor-workflow.md](../development/content-editor-workflow.md).

### CONTENT-001 remediation snapshot — 2026-10-01

- הוחלפו מקומית חמש כתובות Drive שגויות בכתובות המודולים התואמים בריפו: יחידות `03`, `06`, `10`, `15` ו-`45`. השינוי מתקן `47` הופעות בלי לשנות תוכן או משמעות קלינית.
- הוסרו תווי `l` זרים משתי וריאציות URL משובשות של מאמר ההחייאה מאיחוד הצלה. שמונה ההופעות מפנות כעת לכתובת המקורית המיועדת, שמחזירה `200`; מקור `2020` עצמו עדיין דורש review גרסה קליני.
- חמש כתובות ה-Drive והכתובת המתוקנת מאיחוד הצלה החזירו `200`; כתובות ה-Drive הופיעו ב-UI המקומי תחת התווית הנכונה. JSON, ‏`build`, ‏`lint`, ‏`42/42` בדיקות ושני coverage gates עברו.
- הסריקה לאחר התיקונים כוללת עדיין `317` הופעות אך ירדה מ-`54` ל-`51` כתובות ייחודיות, משום שהכתובות המתוקנות מתאחדות עם כתובות תקינות שכבר שימשו צמתים אחרים.
- המשימה נשארת פתוחה: קישורי ה-PDF של נלוקסון ואנפילקסיס החזירו לסירוגין `200` ו-`404` ולכן דורשים בדיקה ידנית יציבה; חמישה דפי `gov.il` מחזירים `403` לבודק ושלושה דפי מד"א מחזירים קוד לא-תקני `247`.
- אין להחליף בשקט את מקורות ההחייאה משנת `2020` או מקור רפואי אחר. מעבר ל-AHA 2025, לעמוד איחוד הצלה המעודכן מ-`2025-12-29`, או למקור חלופי אחר דורש מפת שינוי ואישור בעל תוכן קליני לפני פרסום.
- השינוי טרם פורסם, לא נדחף ולא נפרס לפרודקשן.

### FLOW-001 technical audit snapshot — 2026-10-02

- בדיקת גרף אוטומטית משחזרת 205 צמתים, 358 קשתות מוצהרות, 357 קשתות ניווט אפקטיביות, 193 צמתים נגישים ו-12 צמתים לא נגישים.
- 12 הצמתים מתחלקים ל-4 רכיבים מנותקים: `pulse_check`; ‏`airway_check_cpr -> ventilations`; ‏`pneumothorax`; ורכיב `cardiovascular_problem` עם שבעת צמתי ההמשך שלו.
- אין dangling targets ואין אי-התאמות בין מפתח צומת ל-`id`.
- החלטת מוצר מ-2026-10-02 סיווגה 7 צמתים קרדיולוגיים מתקדמים כחומר העשרה נפרד ממסלול הפעולה. נוספו manifest, סימון UI ו-guardrails; לא שונו קשתות או תוכן קליני.
- 5 צמתים נשארים `unresolved`: `pulse_check`, ‏`airway_check_cpr`, ‏`ventilations`, ‏`pneumothorax`, ‏`hypertensive_emergency`. בדיקות regression מפורטות ב-[FLOW-001 graph integrity audit](./flow-001-graph-integrity-audit.md).

### P1 — אמינות קלינית, כיסוי תרחישים ו-parity

| ID | סטטוס | ממצא עובדתי | פעולה נדרשת | Definition of Done | אימות |
|---|---|---|---|---|---|
| `CONTENT-001` | Open — partial remediation local | חמש כתובות Drive שגויות ושתי וריאציות URL משובשות תוקנו מקומית ב-55 הופעות. נשארו קישורי `404`, חריגי `gov.il`/מד"א ומקורות החייאה ישנים שדורשים הכרעה קלינית; ראו snapshot מ-`2026-10-01`. | לאמת ידנית את החריגים, לאשר מפת מקורות קלינית, לתקן את יתר הקישורים ולתעד כתובת וגרסה מאושרות לכל מקור. | אין `404/400` במקורות המאושרים; לכל חסימת בודק יש תוצאת בדיקה ידנית מתועדת; מקורות ההחייאה תואמים לגרסה שאושרה; אין אובדן מקור קליני. | סריקת כל 51 הכתובות + בדיקה ידנית לחריגים + review בעל תוכן + spot-check ב-UI מקומי ובפרודקשן. |
| `FLOW-001` | Open — 7 reference, 5 unresolved | 12 צמתים אינם נגישים מ-`report_departure`. שבעת הנושאים הקרדיולוגיים המתקדמים שאושרו מוצגים כחומר העשרה נפרד עם guardrails; `pulse_check`, `airway_check_cpr`, `ventilations`, `pneumothorax`, `hypertensive_emergency` נשארים ללא הכרעה. | בעל התוכן יכריע עבור 5 הצמתים שנותרו אם לחבר לזרימה, להסיר כ-legacy או לסמן במפורש כ-reference; אין לשנות קישור קליני ללא הכרעה. | אין צומת production יתום ללא החלטה מתועדת; 0 dangling edges; מסלולים מחוברים תואמים להחלטה הקלינית. | בדיקות reachability וגבול reference ב-`protocolGraphAudit.test.ts` וב-`advancedReferences.test.ts`; ראו [דוח audit](./flow-001-graph-integrity-audit.md). |
| `QA-005` | Technical suite implemented locally — CI pending; clinical review pending | כל 17 תרחישי הייחוס מקודדים כמקרי בדיקה דטרמיניסטיים מול נתוני הזרימה הפעילים. המנוע מאמת reachability לפי סדר checkpoints, הסתעפויות מפורשות, back, יעד cross-protocol ונתיב כשל; מעבר טכני מופרד מ-`clinicalReviewStatus: pending`. | להריץ את ענף האינטגרציה ב-CI ולקבל artifact תקין; להעביר בנפרד את משמעות התוצאות והנתיבים ל-review קליני מוסמך. | כל 17 התרחישים רצים באופן דטרמיניסטי מקומית וב-CI, עם artifact בכשל; אישור קליני מתועד בנפרד ואינו נגזר מתוצאת הבדיקה. | מקומית: `npm run test:reference-scenarios` עבר עם 20/20 בדיקות (17 תרחישים + 3 חוזי suite) ו-JSON report; `67/67` בדיקות client, build, lint ושני coverage gates עברו. CI טרם רץ על השינוי ולכן המשימה אינה Closed. |
| `DEV-001` | Open | Pages+D1 מקומי נכשל ללא schema ועם API base שגוי; README מתאר בעיקר Vite+Express. | להוסיף setup/script מתועד ל-Cloudflare Pages+D1 עם migration ו-`VITE_API_URL=/api`. | checkout חדש יכול להרים סביבת parity, לקבל `200` מ-health/comments וללא שגיאת comments בקונסול. | לבצע את המדריך מסביבה נקייה ולשמור פקודות ותוצאות ב-tracker/audit. |
| `CLIN-001` | Open | סף adult בקוד הוא `>8 years`; AHA 2025 משתמש בסימני התבגרות. זו אי-התאמה הדורשת הכרעת בעל תוכן מול פרוטוקול ישראלי/איחוד הצלה. | לבצע review קליני מתועד לסף הגיל ולמדגם צמתים בסיכון גבוה, עם גרסת מקור ובעל אישור. | קיימת החלטה קלינית חתומה/מתועדת; התוכן והבדיקות תואמים לה; אין שינוי רפואי על בסיס הנחה. | השוואת תוכן מול המקור המאושר + review בעל תוכן + regression לתרחישים שהושפעו. |
| `CLIN-002` | Open | אין בזרימה הראשית disclaimer גלובלי; disclaimer קיים רק באזור Vital Signs. | לאשר נוסח scope שמבהיר שזה כלי למידה ולא הוראות טיפול, ולהציגו בנקודות המתאימות. | הנוסח המאושר נגיש וברור בכניסה ובממשק, ללא פגיעה בשימושיות או נגישות. | review קליני/משפטי לפי הצורך + בדיקת desktop/mobile + axe/Lighthouse. |
| `AUTH-001` | Open | נתיבי auth שליליים נבדקו, אך login אמיתי ו-create/reply/like/view/delete/admin-delete לא נבדקו בפרודקשן. | להגדיר חשבון בדיקה מורשה ו-suite/smoke מתועד לכל lifecycle הקהילה. | כל הפעולות עוברות בהרשאות הנכונות; פעולות אסורות נדחות; נתוני הבדיקה מנוקים. | הרצת smoke מאומתת בפרודקשן עם evidence לא-רגיש לכל פעולה. |

### P2 — נגישות, UX, ביצועים ו-SEO

| ID | סטטוס | ממצא עובדתי | פעולה נדרשת | Definition of Done | אימות |
|---|---|---|---|---|---|
| `AUTH-002` | Open | בקונסול מקומי ובפרודקשן מופיעה אזהרת GSI על `google.accounts.id.initialize()` מספר פעמים. | לרכז את אתחול Google Identity ולמנוע אתחול כפול מרכיבי login מרובים. | אתחול יחיד במחזור טעינה, בלי האזהרה, וכל נקודות הכניסה ל-login ממשיכות לעבוד. | בדיקת console + login desktop/mobile + regression אוטומטי אם ניתן. |
| `A11Y-001` | Open | מגירת quick tools הסגורה נשארת בעץ הנגישות והכפתורים שלה focusable משום שהיא מוסתרת רק ב-transform. | להוסיף conditional mount או `inert`/`aria-hidden`, ניהול focus, Escape והחזרת focus. | אין focus בתוך מגירה סגורה; פתיחה/סגירה תקינות במקלדת ובקורא מסך. | keyboard walkthrough + accessibility tree + axe. |
| `A11Y-002` | Open | audit מצא 6 כשלי `label-content-name-mismatch`: quick tools, option ו-4 כפתורי סטטיסטיקת comments. | ליישר accessible names לטקסט החזותי ולכוונה של כל כפתור. | 0 כשלים מסוג זה בכל המצבים הרלוונטיים. | Lighthouse/axe + בדיקת שמות בעץ הנגישות. |
| `UX-001` | Open | לחיצה על “כלי מערכת מתקדמים” סוגרת את התפריט, ולכן צריך לפתוח אותו שוב כדי להגיע ל“פתח מבט מערכת”. | להפוך את הזרימה לפעולה אחת ברורה: פתיחה ישירה או חשיפת הפעולה בלי סגירת התפריט. | משתמש מגיע למבט המערכת בלחיצה אחת צפויה; אין regression בתפריט. | בדיקה ידנית + E2E ב-desktop וב-mobile. |
| `PERF-001` | Open | Lighthouse: Performance 67, ‏FCP 4.3s, ‏LCP 5.5s, כ-115KiB JS לא מנוצל ו-Google Fonts חוסמים render. | לבצע profiling, לפצל/להשהות קוד, ולייעל טעינת fonts/assets עם תקציב מדיד. | באותה סביבת מדידה LCP ≤2.5s ו-Performance ≥90, או חריגה מתועדת ומאושרת; אין regression פונקציונלי. | 3 ריצות Lighthouse עקביות לפני/אחרי + bundle analysis + smoke. |
| `SEO-001` | Open | `/robots.txt` מחזיר תוכן Cloudflare Managed ואחריו `index.html`; Lighthouse דיווח 20 שגיאות. metadata באנגלית בעוד המוצר בעברית. | להגיש robots תקין ויחיד, לעדכן title/description בעברית ולהגדיר canonical/OpenGraph לפי הצורך. | robots עובר parser ללא שגיאות; metadata משקף את המוצר והשפה; SEO audit נקי מהכשל. | `curl /robots.txt` + validator + Lighthouse + inspection של HTML חי. |
| `QA-006` | Open | coverage הלוגי גבוה אך רכיבי UI מרונדרים אינם חלק מה-gate; ממצאי menu/drawer/comments עברו רק smoke ידני. | להוסיף regression tests לרכיבי UI הקריטיים ולמצבי loading/error/empty ב-desktop/mobile. | קיימות בדיקות רינדור/דפדפן למגירה, תפריט, vital signs, comments ומבט מלא, והן רצות ב-CI. | ריצת suite מקומית וב-CI + הוכחת fail-before/pass-after לממצאים שתוקנו. |

### P3 — תחזוקת קוד, קונפיגורציה ו-hardening

| ID | סטטוס | ממצא עובדתי | פעולה נדרשת | Definition of Done | אימות |
|---|---|---|---|---|---|
| `CODE-001` | Open | `knip` מצא 5 קבצי client, ‏`clsx`, ‏`tailwind-merge` ו-exports כלא בשימוש. | לאמת כל ממצא, להסיר dead code/dependencies או לתעד false positive בקונפיגורציה. | אין ממצאי unused לא מוסברים; build/tests נשארים ירוקים. | `knip` + build/lint/tests + bundle comparison. |
| `CODE-002` | Open | `jscpd` מצא 13 קבוצות ו-3.57% שכפול; JSON עומד על 13.33% ובעיקר כולל עותקי protocol/backup. | להגדיר מקור JSON קנוני, generation/archive לעותקים, ולהפחית שכפול ללא שינוי תוכן. | עותקי backup אינם מקור runtime מתחרה; מנגנון הסנכרון מתועד; אחוז השכפול יורד או מוחרג באופן מנומק. | `jscpd` לפני/אחרי + checksum/semantic comparison + tests. |
| `CODE-003` | Open | `StepByStepView.tsx` מכיל 1,163 שורות ומרכז אחריות UI מרובה. | לפצל לרכיבים/hooks ממוקדים בלי שינוי התנהגות. | הקובץ והיחידות החדשות בעלות אחריות ברורה; אין שינוי UX לא מאושר. | component/E2E regression + build/lint/tests + review diff. |
| `CONFIG-001` | Open | `flow-config.json` מצהיר `startNode: safety` ו-continuous-scroll, בעוד הזרימה בפועל מתחילה ב-`report_departure` ופועלת step-by-step. | לאמת שימוש, להסיר קונפיגורציה מתה או ליישר אותה למימוש ולמקור האמת. | אין config סותר/לא בשימוש ללא הסבר; start node ומצב התצוגה מוגדרים במקום קנוני אחד. | חיפוש references + tests לגרסת config + smoke התחלה. |
| `SEC-003` | Open | בפרודקשן לא נצפו CSP, HSTS, X-Frame-Options או Permissions-Policy. | להגדיר מדיניות headers תואמת Cloudflare ו-Google OAuth, תחילה ב-report-only כאשר מתאים. | headers מאושרים מופיעים בתגובות בלי לשבור OAuth, assets, navigation או API. | `curl -I` + CSP report review + login/smoke + security headers scan. |
| `ENV-002` | Open | validation תחת Node 20 עבר, אך shell אוטומטי לא-login הציג בתחילת ה-audit Node 22.23.2 בניגוד ל-`.nvmrc`. | ליישר או לתעד במפורש את טעינת Node עבור CI, automation ו-shell לא-interactive. | פקודות הפרויקט משתמשות ב-Node 20.20.2 בכל נתיב נתמך, או נכשלות מוקדם עם הודעה ברורה. | `node -v` ב-login/non-login/CI + full validation. |
| `ENV-003` | Open | `npm ci` ו-`npm install --ignore-scripts` נתקעו מקומית ב-2026-08-18; ב-2026-08-26 `npm ci --dry-run` עבר אך עדיין זיהה aliases/packages `extraneous`, ו-`npm ls --depth=0` חזר `0` עם packages `extraneous`. | לבדוק למה npm משאיר/מייצר packages `extraneous`, לנקות install state מקומי בלי לפגוע ב-lockfile, ולתעד פקודת התקנה אמינה. | `npm ci` מלא מסתיים בזמן סביר; `npm ls --depth=0` ללא `extraneous`; validation מלא נשאר ירוק. | `npm ci` מסביבה נקייה + `npm ls --depth=0` + build/lint/test/coverage/audit. |
| `DOC-001` | Open | בכספת קיים קובץ לא-קנוני `tasks 3.md` לצד `tasks.md`, עם תוכן ישן וסיכון לסתירה. | לבדוק אם יש בו מידע ייחודי, למזג רק מידע תקף ואז לארכב/להסיר את כפילות הסנכרון באישור מתאים. | קיים קובץ tasks קנוני אחד בלבד ואין אובדן מידע תקף. | השוואת diff + חיפוש קישורים + בדיקת Git/Obsidian לאחר הטיפול. |

## הושלם לאחרונה

| ID | נסגר | תוצאה | הוכחה |
|---|---|---|---|
| `QA-004` | `2026-08-14` | נוסף client test harness עם 12 בדיקות ו-gate ממוקד ללוגיקה קריטית | [QA Coverage Gate Audit](./qa-coverage-gate-audit.md), CI `31800392473` |
| `QA-003` | `2026-08-14` | back navigation משחזר protocol ו-node לאחר מעבר חוצה-פרוטוקולים | unit regression + forward/back בדפדפן המקומי |
| `QA-002` | `2026-08-14` | נוספו ארבע בדיקות ל-Cloudflare Auth production handlers | 30 בדיקות server עברו; production API coverage כולל auth |
| `QA-001` | `2026-08-14` | coverage הועבר מ-Express legacy ל-Cloudflare Production API ונוסף gate ל-CI | thresholds ‏80/70/80/80; CI `31800392473` עבר |
| `ENV-001` | `2026-08-14` | `fnm 1.39.0` הוגדר עם Node `20.20.2` כברירת מחדל ומעבר אוטומטי לפי `.nvmrc` | shell חדש: `node -v` = `v20.20.2`; `npm ci`, `build`, `lint`, `26/26` בדיקות ושני האודיטים עברו |
| `SEC-001` | `2026-08-14` | `nanoid` עודכן מ-`3.3.16` ל-`3.3.18`; production audit נקי | commit `3deeb9d`, `npm audit --omit=dev` = 0 |
| `SEC-002` | `2026-08-14` | `brace-expansion` עודכן מ-`5.0.8` ל-`5.0.9`; audit מלא נקי | commit `3deeb9d`, `npm audit` = 0 |
| `CI-001` | `2026-08-14` | נוסף gate של `npm audit --omit=dev --audit-level=high` | GitHub Actions `31793152326` עבר |

## מועמדים שאינם backlog פעיל

אין כרגע מועמדים פתוחים: כל ממצאי ה-audit שנדרשת עבורם פעולה קונקרטית קודמו ל-backlog לעיל. `QA-CANDIDATE-001` ההיסטורי עבר audit, פוצל ל-`QA-001` עד `QA-004` ונסגר.

## כללי Validation קבועים

```bash
npm ci
npm run build
npm run lint
npm test
npm run test:coverage
npm audit
npm audit --omit=dev
```

לאחר שינוי שנפרס:

1. לוודא ש-GitHub Actions עבר על ה-commit הנכון.
2. לוודא ש-Cloudflare Pages deployment מצביע לאותו commit.
3. לבדוק את הדומיין החי, `/api/health` ונתיב API רלוונטי.
4. לאמת bundle חי כאשר השינוי נוגע ל-client.
5. לסנכרן כאן את הסטטוס ואז לעדכן את תקציר הכספת.

## מסמכי היסטוריה והוכחה

### שלבים סגורים

- [UI/UX redesign task list](../redesign/ui-ux-redesign-task-list.md) — Phases 1–9 הושלמו.
- [Phase 4 UI/UX tracker](./protocol-gap-tracker-phase-4-ui-ux.md) — סגור.
- [Post Phase 4 remaining work](./post-phase-4-remaining-work.md) — `REM-001` עד `REM-003` הושלמו.
- [Comments Layer Redesign task list](./comments-layer-redesign-task-list.md) — המימוש והאימות הושלמו; המסמך נשמר כהיסטוריית ביצוע.

### מסמכי gate ואימות

- [REM-003 Audit Gate](./rem-003-audit-gate.md)
- [Reference scenarios E2E](./reference-scenarios-e2e.md)
- [Coverage proof units 3–5](./coverage-proof-units-3-5.md)
- [QA Coverage Gate Audit](./qa-coverage-gate-audit.md)
- [REM-002 sync verification](./rem-002-sync-verification.md)

## סגירת פער מקורות האמת

ב-`2026-08-14` אוחד ניהול הפרויקט למודל הבא:

- המסמך הזה הוא tracker מורחב וקנוני בריפו.
- הכספת מחזיקה רק overview, current ו-tasks תמציתיים.
- רשומת UI/UX הישנה בכספת נסגרה.
- מסמכי שלבים סגורים מפנים לכאן ואינם מוגדרים עוד כ-backlog פעיל.
