# Jarvis 62 — כלי מדריך וקבוצות סינתטיות

## סטטוס והיקף

מימוש מקומי בלבד על בסיס `e0150487106337dbd7c0c0b1dee054cb7349d7c3`, עם מנוע ההערכה ממשימה 60 ומצב התרגול ממשימה 59. לא נוצרו חשבונות אמיתיים, לא ניתנו הרשאות למשתמשים חיים, לא בוצעו פנייה למדריכים, deployment או שינוי production.

הכלי מיועד להדגמת הקצאת `SCN-01` לקבוצות סינתטיות ולצפייה בתוצאות מצרפיות בלבד. המחוון הוא `0.1.0-pending-review`, המשוב לימודי בלבד ואינו קובע כשירות קלינית או מעניק הסמכה.

## ברירות מחדל מצומצמות

- ממשק המדריך כבוי כברירת מחדל ונחשף רק עם `VITE_ENABLE_SYNTHETIC_INSTRUCTOR_TOOLS=true`.
- תפקידי ההדרכה נפרדים מ־`isAdmin` ודורשים רשומה מפורשת ב־`training_roles` עם `scope=synthetic_only`.
- אין endpoint להענקת תפקיד ואין role seed בסכמת הבסיס.
- אין טבלת לומדים או תוצאות אישיות. במסד נשמרים רק group metadata, assignment ואגרגטים.
- חתך עם פחות מ־10 השלמות מוסתר כולו; גם המספר המדויק והתפלגות הביניים אינם מוחזרים.
- ה־API מקבל allowlist סגור של `SCN-01` ושל גרסת המחוון הקיימת; שדות נוספים נדחים.
- שם קבוצה אינו free text: ה־API מקבל רק `labelCode` מתוך allowlist סינתטי ומפיק ממנו תווית קבועה, כדי שלא יוזנו שמות או פרטים מזהים.
- fixture מקומי משתמש רק בזהויות `.invalid` ובמזהים המסומנים `synthetic`.

## רכיבים

- `functions/api/training/[[path]].ts` — groups, assignment ו־aggregate summary.
- `functions/_lib/training.ts` — אימות תפקיד, ownership, allowlist ומזעור aggregate.
- `sql/migrations/0003-synthetic-training-groups.sql` — סכמת D1 מקומית ללא role grants.
- `sql/fixtures/option12-synthetic-groups.sql` — שתי קבוצות סינתטיות בלבד.
- `apps/client/src/components/InstructorGroups/InstructorGroupsPanel.tsx` — שולחן מדריך feature-gated.
- `apps/client/src/instructor/instructorGroups.ts` — מודל demo ו־suppression.

## מטריצת הרשאות

| פעולה | ללא session | משתמש רגיל | instructor בעל הקבוצה | instructor אחר | training_admin |
|---|---:|---:|---:|---:|---:|
| רשימת קבוצות | 401 | 403 | קבוצות בבעלותו | קבוצות בבעלותו | כל הקבוצות הסינתטיות |
| יצירת קבוצה סינתטית | 401 | 403 | מותר | מותר | מותר |
| הקצאת SCN-01 | 401 | 403 | מותר | 403 | מותר |
| תוצאות מצרפיות | 401 | 403 | מותר עם suppression | 403 | מותר עם suppression |

## הפעלה מקומית

1. להחיל `sql/d1-community-schema.sql` על D1 מקומי בלבד.
2. להחיל `sql/fixtures/option12-synthetic-groups.sql` רק בסביבת בדיקה.
3. לבנות או להריץ client עם `VITE_ENABLE_SYNTHETIC_INSTRUCTOR_TOOLS=true`.

אין להחיל את fixture או להעניק `training_roles` בסביבה חיה ללא אישור נפרד.

## אימות מקומי שבוצע

- client tests: ‏`113/113`.
- server tests: ‏`49/49`, כולל `8/8` בדיקות חדשות לחוזה ההרשאות.
- client coverage: ‏`94.25%` statements, ‏`88.70%` branches, ‏`100%` functions, ‏`98.43%` lines.
- server coverage: ‏`81.62%` statements, ‏`72.62%` branches, ‏`81.81%` functions, ‏`84.07%` lines.
- `npm run lint` עבר; client ו־server builds עברו תחת Node `20.20.2`.
- סכמת D1 וה־fixture הוחלו על SQLite זמני והחזירו את שתי הקבוצות והאגרגטים הצפויים.
- Playwright עבר ב־desktop וב־`390×844`: פתיחת כלי מדריך, הצגת aggregate לקבוצה הגדולה, suppression לקבוצה הקטנה, הקצאת `SCN-01` ומעבר למצב התרגול.
- screenshot: `output/playwright/task62-instructor-groups-desktop.png`.
- ב־Vite-only browser run נרשמו שתי שגיאות proxy קיימות ל־comments משום ששרת ה־API המקומי לא הופעל; הן אינן מגיעות מכלי המדריך ולא השפיעו על תרחישי Jarvis 62.
