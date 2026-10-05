# Jarvis 66 — חבילת מסירה ל־retention ו־triage

סטטוס: `local-only; planning-approved; ready-for-review`

בסיס מאומת: `main` ‏`36cfc831589f7e4090bd340faa078faae1a67458`.

## מה כלול

- audit תפעולי ממוזער ללא תוכן, עם קישורי תגובה ו־actor nullable.
- מחיקת תגובה או actor מאפסת את שני הקישורים ומתחילה חלון retention חדש של 90 יום.
- migration ‏`0003-community-audit-retention.sql` שמשמרת אירועים קיימים ומוסיפה expiry.
- `pending` נשמר עד הכרעה; reports שנפתרו מקבלים expiry של 90 יום.
- preview read-only עם מזהים פסאודונימיים, גיבוי מוצפן ל־7 ימים ואישור הקשור
  ל־fingerprint של ה־batch; purge מפורש מוגבל ל־500 רשומות audit/report בהרצה.
- לוג purge ממוזער עם digest וספירות בלבד נשמר 90 יום.
- דוח יומי מצטבר read-only ללא תוכן, מזהים או קריאה מטבלת users; אין יעד פעיל.
- triage סינתטי שמקצה את Jarvis למיון, מסלים החלטות בעלים/איש מקצוע ומפיק מעטפת
  התראה מצומצמת במצב `not_configured`.
- אין hide, delete, approve או אישור קליני אוטומטיים.

## ראיות

- שרשרת migration מסכמת הבסיס דרך `0002` ו־`0003` תואמת לסכמה החדשה בעמודות,
  indexes, foreign keys ו־triggers.
- rollback טרנזקציוני של שתי המיגרציות ושל migration ה־retention עבר על SQLite סינתטי.
- מחיקת תגובה/actor משמרת audit ממוזער; reports נשארים תחת התנהגות ה־cascade הקיימת.
- preview ספר 501 רשומות זכאיות ו־purge יחיד מחק 500 בלבד; רשומה עתידית ורשומה
  זכאית נוספת נשמרו. purge ללא אישור מחק 0.
- בדיקות התחזוקה, migration, parity ודוח read-only עברו מקומית; החבילה המלאה
  נדרשת שוב לפני פרסום.

## מצב upstream ו־production

- `main` המאומת הוא `36cfc831`; אין טענת deployment חדשה עבור המועמד המקומי.
- ענף ה־retention אינו קיים ב־remote ולא נפתח עבורו PR.
- moderation בפרודקשן נשאר feature-gated; לא הופעלה migration ולא בוצע purge חי.

## סדר שילוב עתידי

1. לאמת מחדש `main`, deployment והיעדר שינוי schema מתחרה.
2. לבצע review ל־migration, לבקר התחזוקה ול־backup/restore על staging או clone מאושר.
4. לפרסם קוד כשהשערים נשארים כבויים.
5. רק באישור ממוקד: backup, migrations ‏`0002` ו־`0003`, schema readback ו־smoke.
6. להפעיל נתיב דיווח יחיד עם קריאת aggregates בלבד; אין ליצור automation מקביל.
7. להפעיל שער שרת ולקוח רק לאחר שכל השערים והבדיקות התפעוליות נסגרו.

## הכרעות

כל הכרעות התכנון נסגרו: בעלים בלבד לפעולות moderation, יעדי טיפול ושעות פעילות,
retention של 90 יום, דוח יומי פרטי מצטבר, preview, גיבוי מוצפן ל־7 ימים, max 500,
לוג 90 יום ואישור נקודתי. אין בכך הרשאת הפעלה או שינוי הרשאות חי.

המסמך אינו אישור לפרסום, migration, purge, שינוי admin או חיבור אוטומטי.
