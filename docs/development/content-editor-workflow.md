# משימה 68 — סביבת עריכת תוכן מקומית

## מטרה וגבולות

הסביבה מאפשרת להכין שינוי תוכן בצורה מקומית ומבוקרת:

1. פתיחת טיוטה מצומת קיים.
2. עריכת JSON של עותק הטיוטה בלבד.
3. preview diff ברמת שדה מול גרסת הבסיס.
4. validation של מבנה, מקורות, יעדי ניווט וחבילת הראיות.
5. מעבר דרך שערי סקירה במצב fail-closed.
6. שמירת revisions ו־rollback כגרסה חדשה, בלי מחיקת היסטוריה.

אין בסביבה פעולת `publish`, כתיבה ל־`unified-flow.json`, merge, deploy, שינוי הרשאות או חיבור לנתוני משתמשים חיים. טיוטות נשמרות ב־`localStorage` של הדפדפן בלבד.

## הפעלה מקומית

ב־Vite dev הסביבה מופעלת אוטומטית:

```bash
npm run dev:client
```

בתפריט הראשי:

```text
כלי מערכת מתקדמים
→ פתח סביבת עריכת תוכן מקומית
```

ב־production build הכניסה מוסתרת כברירת מחדל. לצורך preview מקומי בלבד ניתן לבנות עם:

```bash
VITE_ENABLE_CONTENT_EDITOR=true npm run build:client
```

אין להגדיר את הדגל בפרודקשן במסגרת משימה זו.

## מודל הגרסאות

- יצירת טיוטה משכפלת את הצומת הקנוני ל־revision מספר 1.
- כל שמירה יוצרת revision חדש ומחזירה את הסטטוס ל־`draft`.
- כל שינוי סטטוס יוצר revision נפרד מסוג `transition`.
- rollback אינו מוחק או משכתב גרסה; הוא יוצר revision חדש מסוג `rollback` ומפנה לגרסה ששוחזרה.
- כל revision כולל parent, גרסת פרוטוקול בסיס, timestamp, מחבר, `change_id`, רמת סיכון, נימוק ו־semantic diff.

## שערי validation

לפני `evidence_ready` נדרשים:

- `change_id` בתבנית `CLIN-YYYY-NNN`;
- מחבר מזוהה;
- סיווג `G0`–`G3`;
- נימוק ותיאור שינוי משמעות;
- כותרת וסוג node תקינים;
- לפחות מקור HTTPS אחד עם label;
- כל יעדי הניווט קיימים;
- אין שדות node/content שאינם בחוזה הקנוני.

שינוי מזהה node חסום.

## שערי סקירה

חוזה ה־provenance נטען מ־`/generated/source-provenance-runtime.json` באמצעות `useSourceProvenanceRuntime`.

- רק מצב `ready` יכול להשתתף בחישוב אישור.
- `loading`, ‏`error` ו־`stale` נכשלות סגור.
- מקור חדש או מקור ששונה ואינו תואם ל־runtime manifest מאפס את שער הסקירה.
- `pending` ו־`unknown` אינם אישור.
- `G2/G3` דורשים לפחות שני reviewers מזוהים וראיית reviewer בלתי תלוי במחבר.
- תעודת BLS, בעלות מוצר או מעבר בדיקות תוכנה אינם משנים סמכות ל־`confirmed`.
- אין מעבר ל־`approved_for_stated_use` או `release_ready` בלי שכל המקורות עוברים את החוזה הקנוני.

נכון לבסיס משימה 68, המקורות הקיימים נשארים `pending` והסמכות `unknown`; לכן ניתן לבדוק את ה־workflow, אך לא לייצר טענת אישור או release candidate אמיתי.

## בדיקות

```bash
npm run test:client -- --run \
  src/content-editor/contentWorkflow.test.ts \
  src/content-editor/contentDraftStorage.test.ts
npm run lint:client
npm run build:client
```

הבדיקות מכסות בידוד מה־runtime, diff, יעדי ניווט חסרים, מעבר עד `in_review`, חסימת `pending/unknown`, חסימה במצבי טעינה לא תקינים, מניעת אישור עצמי, persistence מקומי ו־rollback append-only.

## handoff לשילוב

ה־workflow נשען על חוזה runtime של משימה 69:

- `apps/client/src/protocols/useSourceProvenanceRuntime.ts`
- `apps/client/src/protocols/sourceProvenanceRuntime.ts`
- `apps/client/src/types/sourceProvenance.ts`

אין להחזיר ייבוא סינכרוני של `source-provenance.json` אל ה־client.
