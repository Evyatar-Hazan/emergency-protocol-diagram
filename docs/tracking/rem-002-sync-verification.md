# REM-002 Repo-Production-Vault Sync Verification

## Goal

להפוך את משימת היישור בין ריפו, פרודקשן וכספת ממשימה כללית לסטטוס מאומת עם ראיות.

## What Was Checked

1. שהשינוי קיים בריפו המקומי.
2. שהשינוי נבנה ועובר בדיקות.
3. שהשינוי נדחף ל-`main`.
4. ש-`Validate` עובר על ה-commit האחרון.
5. שהפרודקשן החי מגיש את הבאנדל החדש.
6. שהכספת וה-tracker עודכנו לאותו מצב.

## Evidence Shape

סגירה של משימת sync נחשבת תקפה רק אם כל השכבות הבאות מיושרות:

- `repo` - הקוד בפועל קיים ב-`HEAD`
- `ci` - ריצת `Validate` ירוקה על אותו `headSha`
- `production` - הבאנדל החי כולל את המחרוזות או השינוי שנבדק
- `vault` - `current.md` ו-`tasks.md` מעודכנים
- `tracker` - מסמך המעקב משקף את אותו מצב

## Closure Rule

`REM-002` נחשב סגור רק כאשר אין mismatch פתוח ידוע בין:

- הקוד
- מצב `main`
- ה-CI
- הפרודקשן החי
- מסמכי המעקב
- הכספת

## Verification

המסמך הזה יושלם סופית לאחר:

- `build`
- `test`
- `push`
- `Validate`
- בדיקת bundle חי
