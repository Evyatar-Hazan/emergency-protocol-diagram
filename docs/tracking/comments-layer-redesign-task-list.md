# Comments Layer Redesign Task List

## סטטוס מסמך

- תאריך: `2026-07-08`
- סטטוס: `active-backlog`
- מסמך אפיון קשור: [comments-layer-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/comments-layer-redesign-spec.md)

## עקרון ניהול

המשימות כאן נגזרות ישירות מ:

1. הדרישות שהוגדרו על ידי המשתמש
2. המימוש הקיים בפועל
3. הפער בין "שכבת קהילה חינוכית" לבין "שכבת תגובות פשוטה בסגנון feed"

## 1. Product Alignment

### 1.1 ליישר את מסמכי התגובות למודל החדש

- סטטוס: `done`
- מה לעשות:
  - לסמן את [community-shared-learning-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/community-shared-learning-spec.md) כמסמך ישן/חלקי בהקשר התגובות.
  - להגדיר שהמסמך הפעיל לשכבת התגובות הוא [comments-layer-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/comments-layer-redesign-spec.md).
- רמת קושי: `נמוכה`
- זמן משוער: `15-30 דקות`
- Definition of Done:
  - אין בפרויקט שני מסמכים שסותרים אחד את השני לגבי מטרת שכבת התגובות.

### 1.2 להכריע החלטות פתוחות

- סטטוס: `done`
- מה לעשות:
  - להכריע אם משתמש רגיל יכול למחוק את התגובה של עצמו.
  - להכריע אם edit נשאר ב-MVP.
  - להכריע אם like נשאר פתוח לאורחים או עובר למחוברים בלבד.
- רמת קושי: `נמוכה`
- זמן משוער: `15-45 דקות`
- Definition of Done:
  - כל החלטה פתוחה באפיון מקבלת מצב `approved`.
- הוכרע בפועל:
  - `self-delete`: כן
  - `like`: רק למחוברים
  - `views`: של כולם, מוצג כ-metadata קטן
  - `edit`: מחוץ ל-MVP הראשוני

## 2. Access Rules

### 2.1 להסיר הרשאת תגובה מ-guest login

- סטטוס: `done`
- מה לעשות:
  - לבדוק איפה `guest login` פותח `isAuthenticated`.
  - להבטיח שרק Google-authenticated user יכול ליצור comment או reply.
  - להבטיח שרק Google-authenticated user יכול לעשות like.
  - לשמור אפשרות קריאה חופשית.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - guest לא יכול ליצור תגובה גם אם הוא "מחובר" במסלול ישן.
  - guest לא יכול לעשות like גם אם הוא "מחובר" במסלול ישן.
  - Google login כן יכול.
- בדיקה:
  - ניסיון create עם guest נכשל.
  - ניסיון like עם guest נכשל.
  - ניסיון create עם Google user מצליח.
  - ניסיון like עם Google user מצליח.

### 2.2 להקשיח מחיקת תגובה לאדמין

- סטטוס: `done`
- מה לעשות:
  - לוודא שאדמין יכול למחוק כל תגובה.
  - לוודא שמשתמש רגיל לא יכול למחוק תגובה של אחר.
  - לשמר self-delete למשתמש רגיל.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - delete obeys policy exactly.
- בדיקה:
  - regular user cannot delete foreign comment.
  - regular user can delete own comment.
  - admin can delete any comment.

## 3. Data Model

### 3.1 להוסיף likes

- סטטוס: `done`
- מה לעשות:
  - להוסיף schema ל-`CommentLike`.
  - להגדיר unique guard למניעת duplicate likes לפי user.
  - להחזיר counts ל-client.
- רמת קושי: `בינונית-גבוהה`
- זמן משוער: `2-4 שעות`
- Definition of Done:
  - לכל תגובה יש like count תקין.
  - אין double-like לאותו actor.

### 3.2 להוסיף views

- סטטוס: `done`
- מה לעשות:
  - להוסיף schema ל-`CommentView` או מנגנון שקול.
  - להגדיר policy לספירת צפייה.
  - להציג count ב-client.
- רמת קושי: `בינונית-גבוהה`
- זמן משוער: `3-5 שעות`
- Definition of Done:
  - view count גלוי לכל תגובה.
  - refresh מהיר לא מנפח count באופן שגוי.

## 4. API And Server

### 4.1 להרחיב את endpoints של comments

- סטטוס: `done`
- מה לעשות:
  - להוסיף endpoint ל-like / unlike או toggle-like.
  - להוסיף endpoint ל-view tracking.
  - להחזיר metadata מורחב ב-`GET comments`.
- רמת קושי: `בינונית`
- זמן משוער: `2-4 שעות`
- Definition of Done:
  - ה-client מקבל את כל הנתונים הדרושים ל-render מלא.

### 4.2 להוסיף ולתקן tests בצד השרת

- סטטוס: `todo`
- מה לעשות:
  - להוסיף integration tests ל-auth rules.
  - להוסיף integration tests ל-like.
  - להוסיף integration tests ל-view.
  - להוסיף negative tests ל-permissions.
- רמת קושי: `בינונית`
- זמן משוער: `2-4 שעות`
- Definition of Done:
  - test suite מכסה את כל חוקי ההרשאה החדשים.

## 5. Client UX

### 5.1 להחליף את ה-CommentsThread למבנה feed פשוט

- סטטוס: `done`
- מה לעשות:
  - להסיר badges, prompts, taxonomy, educational empty states.
  - לכתוב header קומפקטי.
  - להציג composer קצר או CTA להתחברות.
- רמת קושי: `בינונית`
- זמן משוער: `2-4 שעות`
- Definition of Done:
  - האזור מרגיש כמו פיד תגובות פשוט ולא כמו בלוק mentoring.

### 5.2 לשנות את CommentForm לכתיבה מהירה

- סטטוס: `done`
- מה לעשות:
  - להסיר בחירת סוג תגובה.
  - לקצר טקסטים.
  - להציג CTA ברור ל-Google login בלבד.
  - לא להציג אפשרות edit בגרסת ה-MVP.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - משתמש מבין תוך שנייה איך מגיבים.

### 5.3 לעדכן את CommentItem

- סטטוס: `done`
- מה לעשות:
  - להוסיף שורת actions בסגנון `like / reply / delete`.
  - להציג counts.
  - להציג `views` כ-metadata קטן.
  - לשמור על RTL ומובייל תקין.
- רמת קושי: `בינונית`
- זמן משוער: `2-4 שעות`
- Definition of Done:
  - כל תגובה נראית כמו unit social פשוט וברור.

### 5.4 לוודא מיקום קבוע מתחת ל-"מה הצעד הבא"

- סטטוס: `done`
- מה לעשות:
  - לבדוק ב-`StepByStepView` שהדיון יושב רק אחרי `מה הצעד הבא`.
  - להסיר אלמנטים שעדיין "צועקים קהילה".
- רמת קושי: `נמוכה`
- זמן משוער: `30-60 דקות`
- Definition of Done:
  - התגובות אינן מפריעות לזרימה.

## 6. Abuse Prevention

### 6.1 ליישם guard ל-like למחוברים בלבד

- סטטוס: `done`
- מה לעשות:
  - לחייב משתמש מחובר עבור like.
  - להוסיף dedupe לפי user.
  - לתעד UX של CTA להתחברות.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - guest לא יכול לעשות like.
  - user מחובר לא יכול לבצע like כפול.

### 6.2 לקבוע guard ל-view count

- סטטוס: `done`
- מה לעשות:
  - להגדיר throttle או dedupe window.
  - לתעד מה נחשב view.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - view count behaves predictably in manual testing.

## 7. End-To-End Verification

### 7.1 sanity checks פונקציונליים

- סטטוס: `todo`
- מה לעשות:
  - אורח רואה תגובות.
  - אורח לא יכול להגיב.
  - Google user יכול להגיב.
  - reply עובד.
  - like עובד.
  - view count עובד.
  - admin delete עובד.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - כל תרחיש מסומן `pass` עם הוכחה.

### 7.2 sanity checks רגרסיה

- סטטוס: `todo`
- מה לעשות:
  - לבדוק שה-flow הראשי לא נשבר.
  - לבדוק mobile layout.
  - לבדוק empty state.
  - לבדוק reload.
  - לבדוק build/test/lint.
- רמת קושי: `בינונית`
- זמן משוער: `1-2 שעות`
- Definition of Done:
  - אין regression בזרימת הפרוטוקול.

## 8. Deployment And Production Proof

### 8.1 לפרוס ולאמת בפרודקשן

- סטטוס: `done`
- מה לעשות:
  - push ל-`main`
  - לחכות ל-`Validate`
  - לאמת bundle חי
  - לאמת ידנית בפרודקשן
- רמת קושי: `בינונית`
- זמן משוער: `30-90 דקות`
- הושלם בפועל:
  - `2026-07-08`: commit `2352b43` נבדק לוקאלית, עבר `Validate` בריצה `28969443064`, נפרס ידנית ל-Cloudflare Pages ואומת על `https://bls-protocol.evyatarhazan.com/` עם bundle `index-CLDEH-e1.js`.
- Definition of Done:
  - יש הוכחה שהפיצ'ר חי ולא רק מקומית.

## 9. Documentation Sync

### 9.1 ליישר tracker + vault

- סטטוס: `todo`
- מה לעשות:
  - לעדכן את מסמכי ה-tracking בריפו.
  - לעדכן `current.md` ו-`tasks.md` בכספת.
  - לציין מה הושלם ומה נשאר.
- רמת קושי: `נמוכה`
- זמן משוער: `15-30 דקות`
- Definition of Done:
  - אין פער בין מצב הקוד למצב התיעוד.
