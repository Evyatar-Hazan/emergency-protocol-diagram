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
| `19-shock-and-hemorrhage-control` | מכוסה | `trauma_protocol` | `stop_bleeding`, `trauma_bleeding_control`, `trauma_wound_packing`, `trauma_tourniquet_control`, `trauma_shock_assessment`, `trauma_compensated_shock`, `trauma_decompensated_shock`, `trauma_internal_bleeding` | יש כעת פיצול מפורש בין לחץ ישיר, packing, חסם עורקים, הלם מפוצה/בלתי מפוצה וחשד לדימום פנימי בטראומה | פרוטוקולי fluid resuscitation ו-ALS נשארים מחוץ ליעד ה-BLS |
| `20-face-neck-and-head-trauma` | מכוסה | `trauma_airway_gate` | `trauma_airway`, `head_trauma` | ראש/פנים/צוואר מיוצגים בענפי A ו-D | אין |
| `21-chest-trauma` | מכוסה | `trauma_breathing_gate` | `flail_chest`, `sucking_chest_wound`, `hemothorax`, `pneumothorax` | תתי-תרחישי חזה קיימים | אין |
| `22-abdominal-trauma` | מכוסה | `trauma_circulation_gate` | `trauma_abdomen_pelvis`, `trauma_penetrating_abdomen`, `trauma_blunt_abdomen`, `trauma_evisceration`, `trauma_pelvic_injury` | יש כעת פיצול מפורש בין פגיעה חודרת, קהה, יציאת איברים ופגיעת אגן, עם דגש על דימום פנימי ופינוי דחוף | אבחון האיבר הפגוע והטיפול הכירורגי נשארים מחוץ ליעד ה-BLS |
| `23-musculoskeletal-trauma-and-splinting` | מכוסה | `trauma_secondary_survey` | `trauma_spine_extremity`, `trauma_fracture_assessment`, `trauma_splinting`, `trauma_open_fracture_bleeding` | יש כעת פיצול מפורש בין הערכת שבר/פריקה, שליטה בדימום/שבר פתוח וקיבוע עם PMS | אין |
| `24-spinal-trauma-and-extrication` | מכוסה | `trauma_airway_gate` | `trauma_airway`, `trauma_spine_extremity`, `trauma_spine_precautions`, `trauma_secondary_survey` | C-spine משולב רוחבית, ונוסף כעת ענף ייעודי לחשד לעמ\"ש, הערכה נוירולוגית וחילוץ זהיר | חילוץ מתקדם נשאר guidance ולא תמרון טכני מלא |
| `25-soft-tissue-burns-and-smoke-inhalation` | מכוסה | `trauma_exposure_gate` | `trauma_soft_tissue_burns`, `burns`, `smoke_inhalation`, `soft_tissue_wound_support` | יש כעת שער ייעודי שמפריד בין כוויה, שאיפת עשן ופצעי רקמה רכה/גוף זר תקוע, כולל החמרה נשימתית אפשרית גם כשחיצונית המטופל נראה יציב | הרחבת ALS מתקדמת ושיקולי נוזלים נשארים מחוץ ליעד ה-BLS |
| `26-drowning-and-electrical-injury` | מכוסה | `scene_assessment` | `trauma_environmental`, `drowning_incident`, `drowning_resuscitation`, `drowning_post_rescue`, `electrical_injury`, `electrical_resuscitation`, `electrical_conscious_management` | יש כעת שער כניסה ייעודי מהזירה, ופיצול מפורש בין טביעה להתחשמלות ובין מצב החייאתי למטופל נושם/בהכרה | אין |
| `27-environmental-injuries` | מכוסה | `exposure_assessment` | `trauma_environmental`, `hypothermia`, `hyperthermia` | חום/קור מיוצגים כענף מלא | אין |
| `28-animal-bites-venomous-and-marine-injuries` | מכוסה | `trauma_exposure_gate` | `trauma_animal_bites`, `animal_bite_rabies`, `venomous_bite_sting`, `marine_animal_injury`, `bee_sting_reaction`, `bee_sting_local_management`, `anaphylaxis_breathing` | יש כעת פיצול מפורש בין חשד לכלבת, הכשה/עקיצה ארסית, פגיעה ימית ותגובה לעקיצת דבורה, כולל חיבור לאנפילקסיס כשצריך | לכידת בעל החיים וטיפול אנטי-סרומי נשארים מחוץ ליעד ה-BLS |

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
4. אזור `הלם / עצירת דימומים` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר פיצול לצמתי `trauma_bleeding_control`, `trauma_wound_packing`, `trauma_tourniquet_control`, `trauma_shock_assessment`, `trauma_compensated_shock`, `trauma_decompensated_shock` ו-`trauma_internal_bleeding`.
5. אזור `טראומת בטן / אגן` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר פיצול לצמתי `trauma_penetrating_abdomen`, `trauma_blunt_abdomen`, `trauma_evisceration` ו-`trauma_pelvic_injury`.
6. אזור `שלד / קיבועים / עמ"ש` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר פיצול ייעודי לצמתי `trauma_spine_precautions`, `trauma_fracture_assessment`, `trauma_splinting` ו-`trauma_open_fracture_bleeding`.
7. אזור `טביעה / התחשמלות` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר הוספת שער כניסה סביבתי וצמתי משנה נפרדים לטביעה, התחשמלות ומצבי חום/קור.
8. אזור `נשיכות / הכשות / פגיעות ימיות` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר פיצול לצמתי `animal_bite_rabies`, `venomous_bite_sting`, `marine_animal_injury`, `bee_sting_reaction` ו-`bee_sting_local_management`.
9. אזור `רקמות רכות / כוויות / שאיפת עשן` הועלה מ-`חלקי-טוב` ל-`מכוסה` לאחר הוספת שער `trauma_soft_tissue_burns` ופיצול לצמתי `burns`, `smoke_inhalation` ו-`soft_tissue_wound_support`.
