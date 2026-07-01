# Reference Scenarios E2E

## מטרה

המסמך הזה הוא שכבת ה-`coverage proof` ברמת תרחיש משתמש מלא.

במקום לבדוק רק צומת בודד, הוא בודק האם לומד/חובש יכול לעבור מסלול שלם מהזירה עד הענף המתאים בלי "להיאבד".

## סטטוסים

- `עובר`
- `עובר עם שכבת עזר`
- `חלקי אך מובן`

## תרחישים

| # | תרחיש | נתיב עיקרי באתר | סטטוס | הערת אימות |
|---|---|---|---|---|
| 1 | החייאת מבוגר ללא נשימה וללא דופק | `report_departure -> report_arrival -> scene_assessment -> initial_presentation_gate -> avpu_check -> breathing_check -> cpr_protocol -> attach_defib` | עובר | הזרימה הקשיחה נשמרת ומגיעה ל-CPR/AED בלי קפיצות מבלבלות |
| 2 | חנק בילד/תינוק | `scene_assessment -> avpu_check -> airway_assessment -> choking_protocol / infant_choking` | עובר | יש פיצול ברור לפי גיל וסוג חסימה |
| 3 | חולה נשימתי עם PE / דלקת ריאות / אסטמה | `scene_assessment -> avpu_check -> abcde_assessment -> breathing_assessment -> breathing_problem_type` | עובר | ענף הנשימה מחובר טוב גם להשלמות מתקדמות |
| 4 | כאב חזה / ACS / דיסקציה / כאב לא קרדיאלי | `scene_assessment -> avpu_check -> abcde_assessment -> circulation_assessment -> acs_assessment` | עובר | יש הבחנה בטיחותית טובה בלי לקבוע אבחנה סופית בשטח |
| 5 | טראומה עם דימום מסכן חיים | `scene_assessment -> initial_presentation_gate -> trauma_protocol -> stop_bleeding -> trauma_bleeding_control -> trauma_tourniquet_control / trauma_wound_packing -> trauma_shock_assessment` | עובר | המסלול מתחיל נכון ב-X, וממשיך כעת גם להחלטה ברורה בין לחץ ישיר, packing, חסם עורקים והערכת הלם |
| 6 | חבלת חזה | `scene_assessment -> trauma_protocol -> abcde_trauma -> trauma_breathing_gate` | עובר | תתי-ענפים קיימים ומובחנים |
| 7 | בטן חריפה / GI bleed / חסימת מעיים / כאב אגן | `scene_assessment -> avpu_check -> abcde_assessment -> circulation_assessment -> abdominal_emergency` | עובר | יש רצף שימושי לענפי הבטן |
| 8 | חשד לשבץ / פרכוס / שינוי הכרה | `scene_assessment -> avpu_check -> disability_assessment -> disability_status` | עובר | ענפי D בנויים היטב אחרי הסבבים הקודמים |
| 9 | חולה מדבק / דקירת מחט / חשיפה לנוזלי גוף | `scene_assessment -> ... -> secondary_survey_finish -> infectious_exposure_control` | עובר עם שכבת עזר | לא ענף ליבה מוקדם, אבל קיים כשכבת המשך ברורה |
| 10 | תאונת צלילה | `scene_assessment -> diving_emergency_overview` | עובר | נוסף חיבור מוקדם מהזירה |
| 11 | הריון / לידה / מצב חירום מיילדותי | `scene_assessment -> avpu_check -> special_patient_pregnancy -> labor_assessment / obstetric_emergency` | עובר | יש פיצול טוב בין לידה קרובה לסיבוך |
| 12 | אר"ן | `scene_assessment -> mass_casualty_protocol` | עובר | זיהוי מוקדם מהזירה |
| 13 | חומ"ס | `scene_assessment -> hazmat_protocol` | עובר | זיהוי מוקדם מהזירה |
| 14 | פגיעות שלד / עמ"ש / קיבועים | `scene_assessment -> trauma_protocol -> abcde_trauma -> trauma_spine_extremity -> trauma_spine_precautions / trauma_fracture_assessment -> trauma_splinting` | עובר | נוסף פיצול ברור בין חשד לעמ"ש, שבר/פריקה, שבר פתוח וקיבוע עם PMS |
| 15 | טביעה / התחשמלות | `scene_assessment -> trauma_environmental -> drowning_incident / electrical_injury -> drowning_resuscitation / drowning_post_rescue / electrical_resuscitation / electrical_conscious_management` | עובר | נוסף שער כניסה ייעודי מהזירה ופיצול ברור לפי מנגנון ומצב המטופל |
| 16 | נשיכה / הכשה / פגיעה ימית | `scene_assessment -> trauma_protocol -> abcde_trauma -> trauma_exposure_gate -> trauma_animal_bites -> animal_bite_rabies / venomous_bite_sting / marine_animal_injury / bee_sting_reaction` | עובר | נוסף פיצול ברור בין חשד לכלבת, ארס, פגיעה ימית ועקיצת דבורה עם חיבור לאנפילקסיס כשצריך |

## מסקנה

1. תרחישי הליבה של BLS, טראומה, חולה רפואי, הריון/לידה, אר"ן וחומ"ס עוברים היטב.
2. הפערים שנותרו הם בעיקר בעולמות שהוגדרו כבר כ-`חלקי-טוב`, ולא כאזורי שבירה לא ידועים.
3. בכך שכבת ה-`coverage proof` ברמת תרחיש משתמש קיימת כעת באופן מפורש ומתועד.
