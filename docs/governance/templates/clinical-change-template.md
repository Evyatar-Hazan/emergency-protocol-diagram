# Task 53 — תבנית החלטת שינוי קליני

> אין לצרף נתוני מטופלים. אין לסמן אישור בלי scope, מקור, כשירות ותוקף.

## זיהוי

- `change_id`:
- כותרת:
- מחבר:
- שימוש מבוקש: `learning_only / training_facilitation / unknown`
- תחום: `non_clinical / product_scope / bls / als / organizational_policy / legal / unknown`
- רמת סיכון: `G0 / G1 / G2 / G3 / unknown`
- סטטוס review: `not_requested / pending / in_review / changes_requested / scope_blocked / approved_for_stated_use / rejected / expired / withdrawn`
- סטטוס סמכות: `unknown / unassigned / nominated / confirmed / declined`
- סטטוס מקור: `missing / pending / verified / rejected`

## מקור

- דרגת מקור: `S1 / S1_DERIVED / S2_CANDIDATE / S3_SUPPLEMENTARY / RUNTIME / COMMUNITY / unknown`
- מפרסם:
- שם המסמך:
- גרסה/תאריך:
- URL יציב או נתיב repo:
- עמוד/סעיף/anchor:
- תאריך גישה:
- סטטוס ארגוני: `public / organization_approved / unknown`
- מצב עדכניות: `as_received / current_verified / superseded / conflicting / unknown`

## פערים

לכל פער יש לתעד:

- domain: `source / content_alignment / ui_design / none / unknown`
- type:
- status: `open / pending / resolved / accepted / unknown`
- evidence paths:
- owner role:

פער `source` אינו פער עיצוב. פער `ui_design` אינו מאפשר להשלים עובדה רפואית חסרה.

## diff

- נתיבים מושפעים:
- protocols/nodes מושפעים:
- `before_exact`:
- `after_exact`:
- `semantic_diff`:
- למה השינוי נדרש:
- אי־בהירויות ידועות:
- עותקי runtime/backup/fallback מושפעים:

## אימות

- בדיקות נדרשות:
- תרחישי קצה:
- rollback:
- תוצאות בדיקה:

## סקירה

- שם הסוקר:
- תפקיד: `product_owner / change_author / source_curator / bls_reviewer / clinical_approver / organizational_approver / legal_reviewer / release_owner`
- סטטוס מינוי: `unknown / unassigned / nominated / confirmed / declined`
- בסיס סמכות: `user_attested_certification / verified_certification / documented_appointment / organization_mandate / professional_license / unknown`
- כשירות/תפקיד:
- הצהרת scope:
- בלתי תלוי במחבר: `כן / לא`
- החלטה: `מאשר / מבקש שינוי / מחוץ לתחום`
- שימוש מאושר במפורש:
- הסתייגויות:
- תאריך החלטה:
- review due:

## שחרור

- release SHA:
- סביבת preview:
- production readback:
- סטטוס פרסום: `draft / blocked / release_ready / published / superseded / withdrawn`

סטטוס review וסטטוס פרסום נשמרים בנפרד. פרסום טכני אינו יוצר אישור קליני.
