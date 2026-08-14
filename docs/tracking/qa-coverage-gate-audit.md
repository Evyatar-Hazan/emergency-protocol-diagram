# QA Coverage Gate Audit

## מטרה

לקבוע האם נכון להפוך code coverage ל-gate מחייב, על איזה קוד הוא רשאי לדווח, ומה ימנע מהאחוז לייצר false confidence.

## Scope ומקורות אמת

נבדקו ב-`2026-08-14`:

- `package.json` וקובצי ה-workspaces.
- `.github/workflows/validate.yml`.
- קונפיגורציית Vitest והבדיקות תחת `apps/server`.
- runtime הפרודקשני תחת `functions/`.
- לוגיקת client קריטית: navigation store, comment taxonomy ו-source fallbacks.
- האפליקציה המקומית ב-`http://127.0.0.1:4175/` במסלול `report_departure -> report_arrival -> back`.

לא נכללו באחוז:

- רכיבי React מרונדרים שאינם חלק משלושת מודולי הלוגיקה המוגדרים.
- JSON קליני ותרחישי משתמש מלאים; אלה נשארים תחת מסמכי ה-coverage proof וה-reference scenarios.
- שרת Express הישן תחת `apps/server/src`; הוא נבדק ברגרסיה, אך אינו runtime הפרודקשני ב-Cloudflare.

## Baseline לפני התיקון

| מדידה | Statements | Branches | Functions | Lines | מגבלה |
|---|---:|---:|---:|---:|---|
| coverage הישן | 54.62% | 38.46% | 35.71% | 54.62% | מדד רק את Express והחריג את `functions/` שמשרת את Production |
| client | לא קיים | לא קיים | לא קיים | לא קיים | לא היו test files או test script |

לכן baseline הישן לא היה מתאים ל-gate: הוא יכול היה להיכשל בגלל קוד legacy ובו-זמן לא למדוד את ה-API החי.

## ממצאים קונקרטיים

### QA-001 — coverage לא מדד את Production API

- `apps/server/vitest.config.ts` כלל `src/**/*.ts` בלבד.
- בדיקות Cloudflare אמנם רצו, אך קובצי `functions/**/*.ts` לא נכללו באחוז.
- דרך תיקון: root משותף לריפו ו-coverage include מפורש ל-`functions/**/*.ts`.

### QA-002 — נתיב Cloudflare Auth לא נבדק

- `functions/api/auth/[[path]].ts` לא יובא בבדיקות.
- לא הייתה הוכחה אוטומטית ל-missing token, token שנדחה על ידי Google, session מוצלח או `/me` עם JWT תקין.
- דרך תיקון: ארבע בדיקות אינטגרציה מול handlers הפרודקשניים, עם fetch ו-D1 מדומים בגבול החיצוני בלבד.

### QA-003 — חזרה לאחר מעבר בין פרוטוקולים הייתה שבורה

- ההיסטוריה שמרה node IDs רגילים בתוך פרוטוקול ורק מעבר חיצוני בפורמט `protocol:node`.
- `goBack` פתר את הצומת הקודם מתוך הפרוטוקול הפעיל החדש, ולכן צומת מהפרוטוקול הקודם יכול להפוך ל-`undefined`.
- דרך תיקון: כל entry בהיסטוריה כולל protocol ID; פעולת back משחזרת גם protocol וגם node.

### QA-004 — ל-client לא הייתה שכבת בדיקות אוטומטית

- לא נמצא אף `*.test.ts(x)` תחת `apps/client/src`.
- דרך תיקון: Vitest client נפרד ובדיקות ממוקדות לניווט, taxonomy ומקורות fallback.

## תיקון ויעדי Gate

### Production API

| Metric | Baseline אחרי תיקון | סף CI |
|---|---:|---:|
| Statements | 83.85% | 80% |
| Branches | 71.21% | 70% |
| Functions | 83.33% | 80% |
| Lines | 84.65% | 80% |

### Client critical logic

| Metric | Baseline אחרי תיקון | סף CI |
|---|---:|---:|
| Statements | 96.62% | 90% |
| Branches | 92.10% | 80% |
| Functions | 100% | 90% |
| Lines | 97.64% | 90% |

הספים נמוכים מעט מה-baseline כדי לאפשר refactor קטן, אך מספיק גבוהים כדי לחסום ירידה ממשית.

## הגנות נגד False Confidence

1. שם שלב ה-CI הוא `Enforce scoped coverage gates`; הוא מפעיל שני scopes מפורשים ואינו טוען ל-coverage מלא של המוצר.
2. client coverage מוגבל לשלושה מודולי לוגיקה מפורשים; אין טענה שרכיבי React מכוסים.
3. build, lint, tests, dependency audits, reference scenarios ו-Production smoke נשארים gates נפרדים.
4. אחוזים אינם מחליפים בדיקות הרשאה, בדיקות שליליות או בדיקת UI מרונדרת.

## Definition of Done

- ה-Production API נמדד ולא שרת legacy בלבד.
- Cloudflare auth handler מכוסה ב-positive וב-negative paths.
- client critical logic מקבלת suite ו-thresholds משלה.
- cross-protocol back משחזר protocol ו-node קודמים.
- CI נכשל אם אחד משני ה-coverage scopes יורד מתחת לספים.
- `npm ci`, build, lint, tests, coverage ושני audits עוברים תחת Node 20.
- אינטראקציית forward/back עוברת באפליקציה המרונדרת.

## Function Context Analysis

הניתוח הבא תחום לפונקציות שהיו בלב פער ה-QA.

### `functions/api/auth/[[path]].ts::onRequestPost` — שורות 14–41

**Purpose:** handler זה הוא נקודת הכניסה של Cloudflare ל-Google login. הוא מתרגם Request לא מאומת ל-session מקומי רק לאחר אימות חיצוני ו-upsert ב-D1.

**Inputs & Assumptions:**

- `context.request` מגיע מהאינטרנט ואינו מהימן.
- pathname חייב להסתיים ב-`/google-login`.
- JSON יכול להיות חסר או לא תקין.
- Google tokeninfo הוא גבול חיצוני שעלול לדחות או להחזיר payload בלתי מתאים.
- `env.DB`, ‏`JWT_SECRET` ו-`GOOGLE_CLIENT_ID` חייבים להתאים לסביבת Production.

**Outputs & Effects:**

- `400` ללא token, ‏`401` ל-token לא תקף, ‏`404` למסלול אחר ו-`500` לכשל persistence/signing.
- הצלחה מבצעת upsert למשתמש ומחזירה JWT ו-user.
- אין כתיבת D1 לפני ש-`verifyGoogleIdToken` החזיר payload תקף.

**Block-by-Block:**

- שורות 15–23: route + input validation. המיקום קודם ל-fetch מונע קריאה חיצונית מיותרת; First Principle: אין לאמת נתון שלא סופק.
- שורות 25–29: אימות Google. למה נדרש: token הוא input עוין עד ששירות המקור מאשר audience ו-email verification.
- שורות 31–37: upsert ו-signing בתוך try/catch. איך נשמרת האטומיות ההתנהגותית: כשל אינו מחזיר session חלקי ללקוח.
- שורה 40: deny-by-default למסלול לא מוכר.

**Invariants:**

- session לא נוצר ללא token מאומת.
- email נשמר normalized על ידי `upsertUserFromGoogle`.
- שגיאת persistence/signing אינה מוחזרת כהצלחה.

**Cross-Function Dependencies and Risks:**

- `verifyGoogleIdToken` תלויה ב-Google; נבדקו response לא תקין ו-payload תקין.
- `upsertUserFromGoogle` תלויה ב-D1 וב-`crypto.randomUUID`; נבדקה כתיבה והפקת session.
- `signJwt` תלויה ב-Web Crypto וב-secret; session חי נבדק חזרה דרך `/me`.

### `apps/client/src/store/flowStore.ts::navigateToNode` — שורות 82–136

**Purpose:** הפעולה מעבירה את הלומד לצומת הבא בתוך אותו פרוטוקול או לפרוטוקול אחר, ומעדכנת היסטוריה אטומית עבור back navigation.

**Inputs & Assumptions:**

- `nodeId` מגיע מה-flow data או מקיצור UI.
- ערך עם `:` מייצג `protocol:node`.
- protocol ו-node חייבים להימצא ב-`flowData`.
- ניווט מקומי דורש protocol פעיל.
- `window.scrollTo` זמין רק ב-client runtime.

**Outputs & Effects:**

- מעדכנת protocol, node והיסטוריה יחד במעבר חיצוני.
- מעדכנת node והיסטוריה במעבר מקומי.
- target חסר משאיר את המצב ללא שינוי.
- הצלחה גוללת את viewport לראש הצעד.

**Block-by-Block:**

- שורות 86–100: parse ואימות target חיצוני לפני state write. למה: state חלקי היה מנתק protocol מ-node.
- שורות 102–113: state write יחיד והיסטוריה qualified. איך: כל entry שומר את שני המפתחות הדרושים לשחזור.
- שורות 117–126: guards למעבר מקומי. First Principle: node אינו ניתן לפתרון בלי protocol פעיל.
- שורות 128–135: commit של node והיסטוריה ואז scroll כתופעת UI משנית.

**Invariants:**

- `activeProtocolId`, ‏`activeProtocol`, ‏`currentNodeId` ו-`currentNode` מתייחסים לאותו יעד.
- כל history entry הוא `protocol:node`.
- target חסר אינו משנה state.

**Cross-Function Dependencies and Risks:**

- `setActiveProtocol` יוצר entry ראשון באותו format.
- `goBack` מפרק את entry ומשחזר protocol + node; בדיקה חדשה מוכיחה מעבר וחזרה חוצי-פרוטוקולים.
- `FlowNavigation` מפרק את entry לתצוגת breadcrumb; protocol קודם מוצג לפי node ID כאשר אינו ה-active protocol.

### `apps/client/src/store/flowStore.ts::goBack` — שורות 139–161

**Purpose:** הפעולה משחזרת את מצב הניווט הקודם בלי לנחש שהצומת שייך לפרוטוקול הפעיל הנוכחי. זהו התיקון הישיר ל-bug שנמצא ב-audit.

**Inputs & Assumptions:**

- history מכילה entries בפורמט `protocol:node`.
- entry האחרון הוא המצב הנוכחי.
- `flowData` עדיין מכיל את protocol וה-node הקודמים.
- history באורך 0–1 אינה מאפשרת back.
- state write מתבצע רק לאחר resolution מלא.

**Outputs & Effects:**

- מסירה entry נוכחי בעותק זמני.
- משחזרת active protocol ו-current node יחד.
- history חסרה או stale אינה משנה state.

**Block-by-Block:**

- שורות 140–141: guard על עומק history; למה: אין יעד קודם.
- שורות 143–147: pop זמני ו-resolution לפי שני המפתחות; 5 Whys: node ID לבדו אינו ייחודי בין פרוטוקולים.
- שורות 149–152: guard נגד history stale; איך: נמנע commit חלקי.
- שורות 154–160: commit אטומי של כל שדות הניווט.

**Invariants:**

- back לעולם אינו משאיר active protocol חדש עם node ישן.
- failure משאיר את ההיסטוריה המקורית ללא שינוי.
- success מקטין את עומק ההיסטוריה בדיוק באחד.

**Cross-Function Dependencies and Risks:**

- תלויה ב-format שנוצר על ידי `setActiveProtocol` ו-`navigateToNode`.
- תלויה ב-`loadData`; החלפת flow data יכולה להפוך history ל-stale ולכן יש guard.
- נצרכת על ידי כפתור `← חזור`; האינטראקציה forward/back אומתה בדפדפן.

## תוצאת Audit

כל חמש שאלות הפתיחה של REM-003 נענו `כן`. ה-audit הצדיק את `QA-001` עד `QA-004`, והן נסגרות רק לאחר CI ו-Production smoke על ה-commit הסופי.
