# Community And Shared Learning Spec

## סטטוס מסמך

- סטטוס: `legacy-partial`
- הערה: המסמך הזה עדיין רלוונטי לשכבת `shared learning`, אבל אינו מסמך האמת החדש עבור מודל התגובות.
- מסמך התגובות הפעיל כעת: [comments-layer-redesign-spec.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/tracking/comments-layer-redesign-spec.md)

## מטרה

האתר אינו רק תרשים זרימה סגור. הוא צריך לאפשר שכבת למידה משותפת שמשרתת את הזרימה הראשית בלי לשבור אותה.

העקרונות:

1. הפרוטוקול הראשי נשאר קשיח: `S -> התרשמות זירה -> AVPU -> המשך לפי ממצאים`.
2. שכבת הדיון היא משנית ותומכת.
3. שכבת הלמידה נועדה לעזור ללומד להבין מה קל לפספס, מה חשוב לזכור, ואיך לתרגל חשיבה קלינית נכונה.

## מה הוטמע בפועל

### 1. Discussion Taxonomy

נוספה היררכיית תגובות מובנית במסך הדיון:

- `שאלה`
- `הבהרה`
- `טיפ ביצועי`
- `תיקון קליני`
- `מקור`
- `סיכום`

הטקסונומיה הזו ממסגרת את הדיון ככלי למידה מקצועי ולא כפיד תגובות כללי.

### 2. Empty State מכוון

נוסף Empty State שמסביר:

- מה שייך לדיון טוב
- איך מתחילים דיון ראשון
- איך נראית תרומה איכותית

בנוסף נוספו prompts ללחיצה שמייצרים פתיח לדיון:

- טעות ביצועית שקל לפספס
- ממצא קריטי שמקדם לשלב הבא
- שאלה אנמנסטית חשובה

בנוסף נוספה שכבת `seed prompts` לפי צומת, כך שבמצב ריק או בתחילת דיון המשתמש מקבל פתיחים מקצועיים שמותאמים לנושא הקליני עצמו, ולא רק הצעות כלליות.

### 3. Shared Learning Layer

לצמתים מרכזיים נוספה שכבת למידה משלימה:

- `דגשי מדריך`
- `טעויות נפוצות`
- `שאלות חזרה`
- `הערת מדריך`

השכבה הוטמעה כרגע בצמתים הבאים:

- `scene_assessment`
- `avpu_check`
- `airway_assessment`
- `breathing_assessment`
- `circulation_assessment`
- `abcde_assessment`
- `cpr_protocol`
- `trauma_protocol`
- `choking_protocol`
- `acute_coronary_syndrome`
- `stroke`
- `seizure`
- `trauma_shock_assessment`
- `imminent_delivery`
- `obstetric_emergency`
- `pulmonary_embolism`
- `bowel_obstruction`
- `pelvic_gynecologic_emergency`
- `diving_emergency_overview`
- `bloodborne_exposure_response`

## Definition of Done לשכבת Community / Shared Learning

הפער ייחשב סגור כאשר:

1. משתמש מבין למה שכבת הדיון קיימת.
2. אפשר לפרסם תגובה מסוג ברור ולא תגובה כללית ושטוחה.
3. מסך בלי תגובות עדיין נותן ערך ומכוון לכתיבה איכותית.
4. לפחות בצמתי הליבה יש שכבת mentorship ברורה שלא מחליפה את הפרוטוקול.
5. השכבות המשניות לא משנות את סדר הזרימה הראשי.

## מה נשאר להרחיב בעתיד

- הרחבת שכבת `דגשי מדריך / טעויות / שאלות חזרה` לעוד צמתים קליניים מעבר ל-batch שכבר הוטמע.
- הרחבת `seed prompts` לעוד צמתים מעבר ל-batch הראשון.
- הוספת סינון/חיפוש לפי סוג תגובה אם נפח הדיון יגדל.
- חיבור עתידי בין sources, דיון ותיקונים מקצועיים למסלול editorial מסודר.
