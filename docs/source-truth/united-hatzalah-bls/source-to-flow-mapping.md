# מיפוי מקור אמת לצמתי הזרימה

## מטרה

המסמך הזה מרכז במקום אחד את הקשר בין מודולי מקור האמת בתיקיית `איחוד הצלה` לבין צמתי הזרימה הפעילים באתר.

הוא נועד לענות על שלוש שאלות:

1. איזה מודול מקור כבר מיוצג בפועל ב-`unified-flow.json`
2. דרך אילו צמתים הוא מיוצג
3. האם הכיסוי מלא, חלקי, משני בלבד, או מחוץ לליבת הזרימה

## היקף

- מקור הזרימה הפעיל: `apps/client/src/protocols/unified-flow.json`
- מקור האמת התיעודי: `docs/source-truth/united-hatzalah-bls/modules/*.md`
- סטטוסים:
  - `מכוסה` - יש ייצוג ברור ומעשי בצמתי הזרימה
  - `חלקי-טוב` - יש ייצוג שימושי, אך נדרש חידוד/העמקה עתידית
  - `משני` - התוכן שייך יותר לשכבת עזר, reference או תפעול
  - `לא יעד זרימה` - התוכן אינו אמור להפוך למסלול ראשי באתר

## יחידה 1 - יסודות, אנטומיה והחייאה

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `01-intro-to-course` | מבוא ארגוני וקורסי | `report_departure`, `report_arrival`, `scene_assessment` | משני | המסלול מייצג את פתיחת האירוע, אבל תוכן המבוא עצמו אינו יעד לזרימה קלינית. |
| `02-intro-to-cpr` | עקרונות החייאה בסיסיים | `breathing_check`, `pulse_check`, `cpr_protocol`, `start_compressions`, `ventilations`, `cpr_cycle`, `rosc_check` | מכוסה | ליבת ההחייאה קיימת בפועל. |
| `03-adult-cpr-single-rescuer-and-aed` | החייאת מבוגר + AED | `cpr_protocol`, `defib_check`, `attach_defib`, `defib_analysis_check`, `defib_analysis`, `deliver_shock`, `post_rosc` | מכוסה | ה-AED והמעבר בין CPR לאנליזה מיוצגים היטב. |
| `04-team-cpr-and-equipment` | החייאה בצוות, ציוד ותיאום | `cpr_protocol`, `attach_defib`, `team_management_operational`, `operational_support_overview` | חלקי-טוב | שכבת צוות וציוד קיימת, אך חלק מהדגשים נשארים בשכבת reference ולא בזרימת ליבה. |
| `05-pediatric-cpr-and-choking` | החייאת ילדים/תינוקות וחנק | `choking_protocol`, `infant_choking`, `special_case_choking`, `special_patient_pediatric`, `cpr_protocol` | מכוסה | יש כיסוי פעיל לחנק ולהחייאת ילד/תינוק. |
| `06-anamnesis-and-patient-approach` | אנמנזה וגישה לחולה | `scene_assessment`, `initial_presentation_gate`, `abcde_assessment`, `secondary_survey` | מכוסה | מסלול ההתרשמות, הכניסה והאנמנזה קיים. |
| `07-neurological-anatomy` | אנטומיה נוירולוגית | `disability_assessment`, `disability_status`, `stroke`, `seizure` | משני | תומך בהבנה, אך לא כיעד זרימה בפני עצמו. |
| `08-respiratory-anatomy` | אנטומיה של מערכת הנשימה | `airway_assessment`, `breathing_assessment`, `airway_status`, `breathing_status` | משני | אנטומיה משמשת כרקע לצמתים הקליניים, לא כענף נפרד. |
| `09-cardiovascular-anatomy` | אנטומיה של הלב וכלי הדם | `circulation_assessment`, `circulation_status`, `acute_coronary_syndrome`, `shock_type` | משני | רקע חשוב, לא מסלול עצמאי. |
| `10-from-theory-to-practice` | מעבר מתאוריה לשטח | `scene_assessment`, `abcde_assessment`, `secondary_survey` | משני | מעוצב כיום דרך מבנה הזרימה כולו, לא כצומת נפרד. |
| `11-decision-making-under-pressure` | קבלת החלטות תחת לחץ | `initial_presentation_gate`, `abcde_assessment`, `shock_type`, `secondary_survey` | משני | המודל בא לידי ביטוי בשערי ההכרעה, אך לא כמסלול עומד לבדו. |

## יחידה 2 - גישה לחולה ומצבי חירום רפואיים

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `12-unconscious-breathing-syncope-and-seizures` | מחוסר הכרה נושם, עלפון, פרכוסים | `disability_assessment`, `disability_status`, `unconscious_breathing`, `seizure`, `syncope`, `altered_mental_status` | מכוסה | כולל כיום גם צומת-על מפורש למחוסר הכרה נושם. |
| `13-neurological-emergencies` | שבץ, TIA, FAST | `disability_assessment`, `disability_status`, `stroke`, `head_trauma` | מכוסה | צומת `stroke` עודכן לשבץ/TIA. |
| `14-diabetes-and-poisoning` | סוכר, הרעלות, מינון יתר | `disability_blood_sugar`, `hypoglycemia`, `hyperglycemia`, `poisoning_overdose`, `altered_mental_status` | מכוסה | כיסוי טוב של עולם D והרעלות. |
| `15-respiratory-emergencies` | אסטמה, COPD, אנפילקסיס, היפרוונטילציה | `breathing_assessment`, `breathing_status`, `asthma_attack`, `copd_exacerbation`, `anaphylaxis_breathing`, `hyperventilation`, `pneumonia` | מכוסה | תוקן ואומת ישירות מול המקור. |
| `16-cardiac-emergencies` | ACS, אי ספיקת לב, בצקת ריאות | `circulation_assessment`, `circulation_status`, `acs_assessment`, `acute_coronary_syndrome`, `silent_infarction`, `left_heart_failure`, `right_heart_failure`, `pulmonary_edema` | מכוסה | כולל גם תסמינים לא טיפוסיים. |

## יחידה 3 - טראומה

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `17-intro-to-trauma` | מבוא לטראומה | `scene_assessment`, `trauma_protocol`, `abcde_trauma` | מכוסה | מבוא הטראומה ממומש ככניסה למסלול XABCDE. |
| `18-trauma-approach-and-treatment-stages` | שלבי גישה לפצוע | `trauma_primary_priorities`, `trauma_avpu_check`, `trauma_airway_gate`, `trauma_breathing_gate`, `trauma_circulation_gate`, `trauma_disability_gate`, `trauma_exposure_gate` | מכוסה | מסלול שלבים רציף קיים. |
| `19-shock-and-hemorrhage-control` | הלם ודימום | `trauma_protocol`, `stop_bleeding`, `external_bleeding`, `shock_type`, `hypovolemic_shock` | חלקי-טוב | דימום מסכן חיים קיים היטב; הלם עדיין עשוי להעמיק. |
| `20-face-neck-and-head-trauma` | פגיעות פנים/צוואר/ראש | `trauma_airway`, `head_trauma`, `trauma_disability_gate` | מכוסה | ייצוג פעיל בזרימה. |
| `21-chest-trauma` | חבלת חזה | `trauma_breathing_gate`, `flail_chest`, `sucking_chest_wound`, `hemothorax`, `pneumothorax` | מכוסה | צמתי חזה עיקריים קיימים. |
| `22-abdominal-trauma` | פגיעות בטן/אגן | `trauma_abdomen_pelvis`, `abdominal_emergency`, `acute_abdomen`, `gi_bleed` | חלקי-טוב | קיים בזרימה, עם מקום לעידון נוסף. |
| `23-musculoskeletal-trauma-and-splinting` | שלד, קיבועים, גפיים | `trauma_spine_extremity`, `secondary_survey` | חלקי-טוב | עולם השלד והקיבועים מיוצג בעיקר דרך צומת הגפיים/עמ"ש והסקר המשני, בלי פיצול מלא לכל סוג שבר. |
| `24-spinal-trauma-and-extrication` | עמ"ש וחילוץ | `trauma_spine_extremity`, `trauma_secondary_survey`, `trauma_airway` | חלקי-טוב | דגשי C-spine קיימים, חילוץ מלא נשאר ברובו שכבת עזר. |
| `25-soft-tissue-burns-and-smoke-inhalation` | כוויות, שאיפת עשן | `burns`, `exposure_assessment`, `airway_assessment`, `breathing_assessment` | חלקי-טוב | כוויות מכוסות; שאיפת עשן עדיין מפוזרת בין A/B/E ויכולה להתחדד עוד. |
| `26-drowning-and-electrical-injury` | טביעה והתחשמלות | `rescue_breathing`, `cpr_protocol`, `secondary_survey`, `scene_assessment` | חלקי-טוב | עולם הטביעה/התחשמלות מיוצג חלקית דרך החייאה, זירה וסקר משני, אך לא כענף עומק מלא לכל תרחיש. |
| `27-environmental-injuries` | פגיעות אקלים | `trauma_environmental`, `hypothermia`, `hyperthermia`, `exposure_status` | מכוסה | קיים בצורה שימושית. |
| `28-animal-bites-venomous-and-marine-injuries` | בעלי חיים, ארס, פגיעות ימיות | `trauma_animal_bites`, `secondary_survey`, `anaphylaxis_breathing` | חלקי-טוב | יש ייצוג כללי, וחלק מהפיצול נשאר עתידי. |

## יחידה 4 - השלמות רפואיות ומצבים מיוחדים

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `29-respiratory-emergencies-advanced` | דלקת ריאות, PE, השלמות נשימה | `breathing_status`, `breathing_problem_type`, `pneumonia`, `pulmonary_embolism`, `hyperventilation`, `shock_type` | מכוסה | `PE` מחובר כעת בצורה מפורשת גם משער המיון הנשימתי, בנוסף לצומת הייעודי. |
| `30-cardiac-emergencies-advanced` | הפרעות קצב, פתולוגיות אאורטה | `circulation_status`, `acs_assessment`, `arrhythmia_bradycardia`, `arrhythmia_svt`, `arrhythmia_afib`, `arrhythmia_vt`, `aortic_dissection`, `non_cardiac_chest_pain` | מכוסה | נוספה כעת גם שכבת זהירות ל"כאב חזה ממקור אחר אפשרי" לצד צומת אאורטה קיים, בלי לחרוג מגבולות ה-BLS. |
| `31-abdominal-emergencies` | בטן חריפה, GI bleed, UTI, כליות | `abdominal_emergency`, `acute_abdomen`, `gi_bleed`, `appendicitis_suspicion`, `bowel_obstruction`, `renal_colic_uti`, `pelvic_gynecologic_emergency`, `secondary_survey` | מכוסה | נוסף כעת גם כיסוי ייעודי לחסימת מעיים ולהריון חוץ רחמי/כאב אגן דחוף. |
| `32-infectious-diseases` | זיהומים, חשיפה ביולוגית, מנינגיטיס | `meningitis`, `septic_shock`, `infectious_exposure_control`, `infection_control_precautions`, `bloodborne_exposure_response`, `infection_scene_hygiene`, `secondary_survey` | מכוסה | פוצל כעת לשער מסודר שמבדיל בין חולה מדבק, post-exposure לצוות והיגיינת זירה. |
| `33-special-patient` | ילד, קשיש, סיעודי, תקשורת | `special_patient_primary_modifiers_medical`, `special_patient_primary_modifiers_trauma`, `special_patient_overview`, `special_patient_elderly`, `special_patient_pediatric`, `special_patient_dependent`, `special_patient_communication` | מכוסה | משולב רוחבית גם בתוך A/B/C/D/E. |
| `34-diving-emergencies` | צלילה, דקומפרסיה, ברוטראומה | `diving_emergency_overview`, `diving_history`, `diving_barotrauma_lung`, `diving_decompression`, `diving_bls_management` | חלקי-טוב | נכנס כרגע דרך `secondary_survey`, לא מוקדם יותר. |
| `35-iv-access-and-fluid-infusion` | וריד, עירוי נוזלים | `operational_support_overview` | לא יעד זרימה | ברמת BLS/חובש זה יותר reference מאשר מסלול ראשי. |
| `36-medical-documentation-app` | תיעוד באפליקציית כוננים | `documentation_handoff`, `operational_support_overview` | משני | קיים כשכבת תפעול משנית. |

## יחידה 5 - אירועים מיוחדים, תפעול ונהיגה

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `37-mass-casualty-incident` | אר"ן | `mass_casualty_protocol`, `scene_assessment`, `initial_presentation_gate` | מכוסה | קיים ככניסת זירה מוקדמת. |
| `38-hazmat-incidents` | חומ"ס | `hazmat_protocol`, `scene_assessment` | מכוסה | קיים ככניסת זירה מוקדמת. |
| `39-pregnancy-and-delivery` | הריון ולידה | `special_patient_pregnancy`, `pregnancy_special_considerations`, `labor_assessment`, `imminent_delivery` | מכוסה | קיים ענף ייעודי. |
| `40-obstetric-emergencies` | מצבי חירום בלידה | `labor_assessment`, `obstetric_transport`, `imminent_delivery`, `newborn_initial_care`, `obstetric_emergency` | חלקי-טוב | ייצוג טוב, עם מקום להרחבה רוחבית. |
| `41-prevention-and-healthy-lifestyle` | מניעה ואורח חיים | `secondary_survey` | לא יעד זרימה | תוכן חינוכי/מניעתי, לא פרוטוקול שטח. |
| `42-home-medications-awareness` | תרופות בבית המטופל | `secondary_survey`, `altered_mental_status`, `poisoning_overdose` | משני | חלק חשוב לאנמנזה, לא מסלול נפרד. |
| `43-monitor-and-ecg-operation` | מוניטור/ECG | `monitor_ecg_operation`, `operational_support_overview` | משני | נשמר נכון כשכבת תפעול. |
| `44-team-management` | ניהול צוות | `team_management_operational`, `operational_support_overview` | משני | מיוצג בשכבת תפעול. |
| `45-ambulance-operation-and-driving-protocol` | נהיגה והפעלת אמבולנס | `ambulance_operations`, `operational_support_overview` | משני | מתאים לשכבת reference/תפעול. |

## קבצים משלימים

| מודול מקור | נושא | צמתים רלוונטיים ב-`unified-flow.json` | סטטוס | הערות |
|---|---|---|---|---|
| `46-mass-casualty-incident-operational-protocol-2025` | נוהל אר"ן תפעולי מעודכן | `mass_casualty_protocol` | מכוסה | משמש מקור עיקרי לחיזוק מסלול אר"ן. |

## מסקנות

1. לכל מודול מקור קליני או תפעולי משמעותי יש כעת נקודת מיפוי גלויה מול צמתי האתר.
2. רוב יחידה 2, טראומה הליבתית, חולה מיוחד, אר"ן, חומ"ס והריון/לידה כבר מקבלים ייצוג פעיל בזרימה.
3. עיקר הפערים שנותרו אינם "חוסר מיפוי", אלא עומק/חדות/פיצול עתידי של צמתים קיימים.
4. מודולים כמו אנטומיה, מניעה, עירוי נוזלים ונהיגה באמבולנס ממופים במכוון כמשניים או כלא-יעד-זרימה, כדי לשמור על ליבת הפרוטוקול נקייה.
