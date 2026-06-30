import type { Protocol, ReferenceSource } from '../types/protocol';

const madaEmergency2024: ReferenceSource = {
  label: 'מד"א - רפואת חירום (מהדורה ציבורית 2024)',
  url: 'https://www.mdais.org/Media/file_download/Refuat_Herumpdf_2024.pdf',
  note: 'עקרונות ABCDE, ניטור, זיהוי אי-יציבות והמשך טיפול בשטח.',
};

const madaTrauma2016: ReferenceSource = {
  label: 'מד"א - פרוטוקולים והנחיות לטיפול בנפגעי טראומה ובמצבי חירום (מהדורה ציבורית 2016)',
  url: 'https://www.mdais.org/media/1730/%D7%A4%D7%A8%D7%95%D7%98%D7%95%D7%A7%D7%95%D7%9C%D7%99%D7%9D-2016.pdf',
  note: 'בטיחות זירה, טראומה, עצירת דימום, וגישת טיפול ראשונית בשטח.',
};

const madaHeartAttack: ReferenceSource = {
  label: 'מד"א - כיצד לזהות התקף לב',
  url: 'https://www.mdais.org/101/mi-signs',
  note: 'סימני אזהרה של כאב חזה, אוטם, ואי-יציבות הדורשת פינוי דחוף.',
};

const sourceFallbacks: Record<string, ReferenceSource[]> = {
  report_arrival: [madaEmergency2024],
  safety: [madaTrauma2016],
  scene_assessment: [madaEmergency2024, madaTrauma2016],
  trauma_protocol: [madaTrauma2016],
  stop_bleeding: [madaTrauma2016],
  medical_protocol: [madaEmergency2024],
  avpu_check: [madaEmergency2024],
  voice_check: [madaEmergency2024],
  pain_check: [madaEmergency2024],
  unresponsive_check: [madaEmergency2024],
  breathing_present: [madaEmergency2024],
  pulse_check: [madaEmergency2024],
  abcde_assessment: [madaEmergency2024],
  abcde_medical: [madaEmergency2024],
  abcde_trauma: [madaTrauma2016],
  airway_assessment: [madaEmergency2024],
  airway_status: [madaEmergency2024],
  airway_patent: [madaEmergency2024],
  airway_obstruction: [madaEmergency2024],
  trauma_airway: [madaTrauma2016],
  airway_complete: [madaEmergency2024],
  breathing_assessment: [madaEmergency2024],
  breathing_status: [madaEmergency2024],
  breathing_complete: [madaEmergency2024],
  breathing_problem_type: [madaEmergency2024],
  sucking_chest_wound: [madaTrauma2016],
  pulmonary_edema: [madaEmergency2024],
  circulation_assessment: [madaEmergency2024],
  circulation_status: [madaEmergency2024],
  chest_pain_stable: [madaEmergency2024, madaHeartAttack],
  acute_coronary_syndrome: [madaEmergency2024, madaHeartAttack],
  silent_infarction: [madaEmergency2024, madaHeartAttack],
  right_heart_failure: [madaEmergency2024],
  left_heart_failure: [madaEmergency2024],
  disability_status: [madaEmergency2024],
  disability_complete: [madaEmergency2024],
  head_trauma: [madaTrauma2016],
  exposure_complete: [madaEmergency2024],
};

export function applySourceFallbacks(protocol: Protocol): Protocol {
  const nextProtocol: Protocol = JSON.parse(JSON.stringify(protocol));

  for (const [nodeId, sources] of Object.entries(sourceFallbacks)) {
    const node = nextProtocol.nodes[nodeId];

    if (!node) {
      continue;
    }

    if (!node.content) {
      node.content = {};
    }

    const hasSources = Array.isArray(node.content.sources) && node.content.sources.length > 0;
    if (!hasSources) {
      node.content.sources = sources;
    }
  }

  return nextProtocol;
}
