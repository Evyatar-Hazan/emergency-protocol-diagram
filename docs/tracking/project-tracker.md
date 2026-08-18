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

## Backlog פעיל

כל המשימות להלן נפתחו על בסיס ה-audit העובדתי מ-`2026-08-14` ועומדות ב-[REM-003 Audit Gate](./rem-003-audit-gate.md).

### P1 — אמינות קלינית, כיסוי תרחישים ו-parity

| ID | סטטוס | ממצא עובדתי | פעולה נדרשת | Definition of Done | אימות |
|---|---|---|---|---|---|
| `CONTENT-001` | Open | 6 כתובות מחזירות `404` ב-53 הופעות; Drive אחד מחזיר `400` בשתי הופעות; 5 כתובות `gov.il` חסומות לבודק עם `403`. | לתקן או להחליף את המקורות המתים, לבדוק ידנית את Drive ו-`gov.il`, ולתעד כתובת מאושרת לכל מקור. | אין `404/400` במקורות המאושרים; לכל `403` יש תוצאת בדיקה ידנית מתועדת; אין אובדן מקור קליני. | סריקת כל 54 הכתובות + בדיקה ידנית לחריגים + spot-check ב-UI מקומי ובפרודקשן. |
| `FLOW-001` | Open | 12 צמתים אינם נגישים מ-`report_departure`: `pulse_check`, `airway_check_cpr`, `ventilations`, `pneumothorax`, `cardiovascular_problem`, `mi_stemi`, `arrhythmia_vt`, `arrhythmia_svt`, `arrhythmia_afib`, `arrhythmia_bradycardia`, `aortic_dissection`, `hypertensive_emergency`. | בעל התוכן יחליט עבור כל צומת אם לחבר לזרימה או להסיר כ-legacy, ואז לעדכן את הגרף. | אין צומת production יתום ללא החלטה מתועדת; 0 dangling edges; מסלולים מחוברים תואמים להחלטה הקלינית. | בדיקת reachability אוטומטית + מעבר ידני בכל מסלול ששונה. |
| `QA-005` | Open | קיימים 17 תרחישי ייחוס כתובים, אך אין suite E2E בר-הרצה. | לממש E2E אוטומטי לתרחישים, כולל navigation, back, cross-protocol ונתיבי קצה. | כל 17 התרחישים רצים באופן דטרמיניסטי מקומית וב-CI, עם artifacts בכשל. | פקודת E2E מתועדת + ריצת CI ירוקה + דוח 17/17. |
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
