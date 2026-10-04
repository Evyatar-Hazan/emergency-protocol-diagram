# Jarvis 66 — חבילת מסירה ל־retention ו־triage

סטטוס: `local-only; ready-for-owner-decisions-and-review`

בסיס מאומת: `main` ‏`8c6747e57773e8f180176cdca4a6f51cff1ddb26`.

## מה כלול

- audit תפעולי ממוזער ללא תוכן, עם קישורי תגובה ו־actor nullable.
- מחיקת תגובה או actor מאפסת את שני הקישורים ומתחילה חלון retention חדש של 90 יום.
- migration ‏`0003-community-audit-retention.sql` שמשמרת אירועים קיימים ומוסיפה expiry.
- preview read-only של מועמדי purge ו־purge מפורש המוגבל ל־500 רשומות בריצה.
- triage סינתטי שמקצה את Jarvis למיון, מסלים החלטות בעלים/איש מקצוע ומפיק מעטפת
  התראה מצומצמת במצב `not_configured`.
- אין hide, delete, approve או אישור קליני אוטומטיים.

## ראיות

- שרשרת migration מסכמת הבסיס דרך `0002` ו־`0003` תואמת לסכמה החדשה בעמודות,
  indexes, foreign keys ו־triggers.
- rollback טרנזקציוני של שתי המיגרציות ושל migration ה־retention עבר על SQLite סינתטי.
- מחיקת תגובה/actor משמרת audit ממוזער; reports נשארים תחת התנהגות ה־cascade הקיימת.
- preview ספר 501 רשומות זכאיות ו־purge יחיד מחק 500 בלבד; רשומה עתידית נשמרה.
- build, lint, client tests, server tests ושני coverage gates עברו מקומית.

## מצב upstream ו־production

- `main` ו־Cloudflare Production עדיין מצביעים ל־`8c6747e`.
- ענף ה־retention אינו קיים ב־remote ולא נפתח עבורו PR.
- moderation בפרודקשן נשאר feature-gated; לא הופעלה migration ולא בוצע purge חי.

## סדר שילוב עתידי

1. לאמת מחדש `main`, deployment והיעדר שינוי schema מתחרה.
2. לאשר SLA, מודל admin, retention של reports וחיבור automation.
3. לבצע review ל־migration ול־backup/restore על סביבת staging או D1 סינתטי מאושר.
4. לפרסם קוד כשהשערים נשארים כבויים.
5. רק באישור ממוקד: backup, migrations ‏`0002` ו־`0003`, schema readback ו־smoke.
6. לחבר ל־Jarvis גישת triage מצומצמת ויעד התראה; הרשאת כתיבה תישאר נפרדת.
7. להפעיל שער שרת ולקוח רק לאחר שכל השערים והבדיקות התפעוליות נסגרו.

## החלטות בעלים שנותרו

- SLA: cadence, שעות פעילות, זמני תגובה והסלמה כשאין מענה.
- admin: מי רשאי לבצע hide/restore/dismiss ומי מעניק או מבטל הרשאה.
- reports: retention נפרד ל־`dismissed` ול־`actioned`; ‏`pending` אינו מועמד למחיקה.
- automation: polling או event source, הרשאת D1 מינימלית, יעד הצ׳אט, dedupe/retry,
  עלות ותיעוד ריצה.
- purge: backup/PITR מאומת, גודל batch, תדירות ואישור לכך שמחיקה לאחר commit היא
  בלתי־הפיכה ברמת האפליקציה.

המסמך אינו אישור לפרסום, migration, purge, שינוי admin או חיבור אוטומטי.
