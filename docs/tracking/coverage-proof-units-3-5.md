# Coverage Proof - Units 3-5

## מטרה

המסמך הזה הוא שכבת ההוכחה החסרה עבור יחידות 3-5 מול האתר בפועל.

הוא לא מנסה "לייפות" את הכיסוי, אלא לקבוע לכל מודול אחד משלושה מצבים ברורים:

- `מכוסה`
- `חלקי-טוב`
- `משני / לא יעד זרימה`

בנוסף, לכל מודול יש:

1. נקודת כניסה בפועל באתר
2. צמתי המשך מרכזיים
3. מה נחשב מוכח
4. מה עוד נשאר כהרחבה עתידית, אם בכלל

מקור המיפוי:

- [source-to-flow-mapping.md](/Users/evyatarhazan/Desktop/project/emergency-protocol-diagram/docs/source-truth/united-hatzalah-bls/source-to-flow-mapping.md)
- `apps/client/src/protocols/unified-flow.json`

## יחידה 3 - טראומה

| מודול | סטטוס | נקודת כניסה | צמתים מרכזיים | מה מוכח | מה נשאר עתידי |
|---|---|---|---|---|---|
| `17-intro-to-trauma` | מכוסה | `scene_assessment` | `trauma_protocol`, `abcde_trauma` | יש כניסה ברורה למסלול טראומה | אין |
| `18-trauma-approach-and-treatment-stages` | מכוסה | `trauma_protocol` | `trauma_primary_priorities`, `trauma_*_gate` | יש רצף XABCDE מסודר | אין |
| `19-shock-and-hemorrhage-control` | חלקי-טוב | `trauma_protocol` | `stop_bleeding`, `external_bleeding`, `shock_type`, `hypovolemic_shock` | עצירת דימום והלם היפוולמי מיוצגים | אפשר להעמיק עוד בענפי הלם טראומטי |
| `20-face-neck-and-head-trauma` | מכוסה | `trauma_airway_gate` | `trauma_airway`, `head_trauma` | ראש/פנים/צוואר מיוצגים בענפי A ו-D | אין |
| `21-chest-trauma` | מכוסה | `trauma_breathing_gate` | `flail_chest`, `sucking_chest_wound`, `hemothorax`, `pneumothorax` | תתי-תרחישי חזה קיימים | אין |
| `22-abdominal-trauma` | חלקי-טוב | `trauma_circulation_gate` | `trauma_abdomen_pelvis`, `abdominal_emergency`, `acute_abdomen`, `gi_bleed` | בטן/אגן מיוצגים היטב כענף פעיל | אפשר לפצל עוד תתי-דפוסי טראומה בטנית |
| `23-musculoskeletal-trauma-and-splinting` | מכוסה | `trauma_secondary_survey` | `trauma_spine_extremity`, `trauma_fracture_assessment`, `trauma_splinting`, `trauma_open_fracture_bleeding` | יש כעת פיצול מפורש בין הערכת שבר/פריקה, שליטה בדימום/שבר פתוח וקיבוע עם PMS | אין |
| `24-spinal-trauma-and-extrication` | מכוסה | `trauma_airway_gate` | `trauma_airway`, `trauma_spine_extremity`, `trauma_spine_precautions`, `trauma_secondary_survey` | C-spine משולב רוחבית, ונוסף כעת ענף ייעודי לחשד לעמ\"ש, הערכה נוירולוגית וחילוץ זהיר | חילוץ מתקדם נשאר guidance ולא תמרון טכני מלא |
| `25-soft-tissue-burns-and-smoke-inhalation` | חלקי-טוב | `exposure_assessment` | `burns`, `airway_assessment`, `breathing_assessment` | כוויות מיוצגות היטב, ושאיפת עשן נלכדת דרך A/B | אין ענף עשן עצמאי |
| `26-drowning-and-electrical-injury` | חלקי-טוב | `scene_assessment` | `rescue_breathing`, `cpr_protocol`, `secondary_survey` | טביעה/התחשמלות מכוונות דרך זירה + החייאה | אין ענף ייעודי מלא לכל מנגנון |
| `27-environmental-injuries` | מכוסה | `exposure_assessment` | `trauma_environmental`, `hypothermia`, `hyperthermia` | חום/קור מיוצגים כענף מלא | אין |
| `28-animal-bites-venomous-and-marine-injuries` | חלקי-טוב | `secondary_survey` | `trauma_animal_bites`, `anaphylaxis_breathing` | יש ייצוג ראשוני שימושי | אין פיצול מלא לארס/ימי/נשיכות |

## יחידה 4 - השלמות רפואיות ומצבים מיוחדים

| מודול | סטטוס | נקודת כניסה | צמתים מרכזיים | מה מוכח | מה נשאר עתידי |
|---|---|---|---|---|---|
| `29-respiratory-emergencies-advanced` | מכוסה | `breathing_problem_type` | `pneumonia`, `pulmonary_embolism`, `hyperventilation` | השלמות נשימה מחוברות במפורש | אין |
| `30-cardiac-emergencies-advanced` | מכוסה | `acs_assessment` | `arrhythmia_*`, `aortic_dissection`, `non_cardiac_chest_pain` | קרדיו מתקדם מיוצג ברמת BLS | אין |
| `31-abdominal-emergencies` | מכוסה | `abdominal_emergency` | `acute_abdomen`, `gi_bleed`, `appendicitis_suspicion`, `bowel_obstruction`, `renal_colic_uti`, `pelvic_gynecologic_emergency` | הבטן השלמתית מכוסה ישירות | אין |
| `32-infectious-diseases` | מכוסה | `secondary_survey_finish` | `infectious_exposure_control`, `infection_control_precautions`, `bloodborne_exposure_response`, `infection_scene_hygiene`, `meningitis`, `septic_shock` | יש שער מסודר לזיהומים וחשיפה | אין |
| `33-special-patient` | מכוסה | `special_patient_primary_modifiers_*` | `special_patient_overview`, `special_patient_*` | חולה מיוחד מיוצג מוקדם ורוחבית | אין |
| `34-diving-emergencies` | מכוסה | `scene_assessment` | `diving_emergency_overview`, `diving_history`, `diving_barotrauma_lung`, `diving_decompression`, `diving_bls_management` | יש כניסה מוקדמת ותת-ענפים ייעודיים | אין |
| `35-iv-access-and-fluid-infusion` | לא יעד זרימה | `operational_support_overview` | `operational_support_overview` | מסווג במכוון כ-reference | לא אמור להפוך לענף ראשי |
| `36-medical-documentation-app` | משני | `secondary_survey_finish` | `documentation_handoff`, `operational_support_overview` | מיוצג כשכבת תפעול | לא נדרש ענף קליני |

## יחידה 5 - אירועים מיוחדים, תפעול ונהיגה

| מודול | סטטוס | נקודת כניסה | צמתים מרכזיים | מה מוכח | מה נשאר עתידי |
|---|---|---|---|---|---|
| `37-mass-casualty-incident` | מכוסה | `scene_assessment` | `mass_casualty_protocol` | אר"ן נכנס כבר מהזירה | אין |
| `38-hazmat-incidents` | מכוסה | `scene_assessment` | `hazmat_protocol` | חומ"ס נכנס כבר מהזירה | אין |
| `39-pregnancy-and-delivery` | מכוסה | `special_patient_pregnancy` | `pregnancy_special_considerations`, `labor_assessment`, `imminent_delivery` | הריון ולידה מיוצגים | אין |
| `40-obstetric-emergencies` | חלקי-טוב | `special_patient_pregnancy` | `obstetric_emergency`, `obstetric_transport`, `imminent_delivery`, `newborn_initial_care`, `postpartum_maternal_care` | מצבי חירום מיילדותיים מיוצגים באופן שימושי | אפשר להרחיב עוד תתי-סיבוכים אם נרצה |
| `41-prevention-and-healthy-lifestyle` | לא יעד זרימה | `secondary_survey` | `secondary_survey` | לא מיועד לזרימת שטח | אין |
| `42-home-medications-awareness` | משני | `secondary_survey` | `secondary_survey`, `altered_mental_status`, `poisoning_overdose` | קיים כאנמנזה משלימה | אין |
| `43-monitor-and-ecg-operation` | משני | `secondary_survey_finish` | `monitor_ecg_operation`, `operational_support_overview` | מיוצג נכון כשכבת תפעול | אין |
| `44-team-management` | משני | `secondary_survey_finish` | `team_management_operational`, `operational_support_overview` | מיוצג כשכבת תפעול | אין |
| `45-ambulance-operation-and-driving-protocol` | משני | `secondary_survey_finish` | `ambulance_operations`, `operational_support_overview` | מיוצג כשכבת תפעול | אין |

## מסקנה

1. לכל מודול ביחידות 3-5 יש כעת סטטוס מפורש וראיית מיפוי ברורה.
2. `חלקי-טוב` כעת אינו "חור לא ידוע", אלא בחירה מתועדת של רמת עומק נוכחית.
3. מודולים שסווגו כ-`משני` או `לא יעד זרימה` לא מהווים חוסר, אלא החלטת מוצר לשמור על הזרימה הראשית נקייה.
4. אזור `שלד / קיבועים / עמ"ש` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר פיצול ייעודי לצמתי `trauma_spine_precautions`, `trauma_fracture_assessment`, `trauma_splinting` ו-`trauma_open_fracture_bleeding`.
