export type NodeReference = `${string}:${string}`;

export interface BranchExpectation {
  from: NodeReference;
  targets: NodeReference[];
}

export interface ReferenceScenario {
  id: number;
  title: string;
  /**
   * Ordered waypoints copied from the reference-scenario document. The runner
   * proves that the learner-facing navigation graph can reach them in order;
   * it does not assert that the medical meaning of the route is correct.
   */
  checkpoints: NodeReference[];
  /** Exact learner-visible branch targets explicitly named by the document. */
  branches?: BranchExpectation[];
  clinicalReviewStatus: 'pending';
}

const unified = (nodeId: string): NodeReference => `unified_flow:${nodeId}`;

export const referenceScenarios: ReferenceScenario[] = [
  {
    id: 1,
    title: 'החייאת מבוגר ללא נשימה וללא דופק',
    checkpoints: [
      'report_departure', 'report_arrival', 'scene_assessment', 'initial_presentation_gate',
      'avpu_check', 'breathing_check', 'cpr_protocol', 'attach_defib',
    ].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 2,
    title: 'חנק בילד/תינוק',
    checkpoints: ['scene_assessment', 'avpu_check', 'airway_assessment', 'choking_protocol'].map(unified),
    branches: [
      { from: unified('airway_obstruction'), targets: [unified('choking_protocol')] },
      { from: unified('complete_obstruction'), targets: [unified('infant_choking')] },
    ],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 3,
    title: 'חולה נשימתי עם PE / דלקת ריאות / אסטמה',
    checkpoints: [
      'scene_assessment', 'avpu_check', 'abcde_assessment', 'breathing_assessment',
      'breathing_problem_type',
    ].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 4,
    title: 'כאב חזה / ACS / דיסקציה / כאב לא קרדיאלי',
    checkpoints: [
      'scene_assessment', 'avpu_check', 'abcde_assessment', 'circulation_assessment',
      'acs_assessment',
    ].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 5,
    title: 'טראומה עם דימום מסכן חיים',
    checkpoints: [
      'scene_assessment', 'initial_presentation_gate', 'trauma_protocol', 'stop_bleeding',
      'trauma_bleeding_control', 'trauma_shock_assessment',
    ].map(unified),
    branches: [{
      from: unified('trauma_bleeding_control'),
      targets: [unified('trauma_wound_packing'), unified('trauma_tourniquet_control')],
    }],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 6,
    title: 'חבלת חזה',
    checkpoints: ['scene_assessment', 'trauma_protocol', 'abcde_trauma', 'trauma_breathing_gate'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 7,
    title: 'טראומת בטן / אגן / יציאת איברים',
    checkpoints: [
      'scene_assessment', 'trauma_protocol', 'abcde_trauma', 'trauma_circulation_gate',
      'trauma_abdomen_pelvis',
    ].map(unified),
    branches: [{
      from: unified('trauma_abdomen_pelvis'),
      targets: [
        unified('trauma_penetrating_abdomen'), unified('trauma_blunt_abdomen'),
        unified('trauma_evisceration'), unified('trauma_pelvic_injury'),
      ],
    }],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 8,
    title: 'חשד לשבץ / פרכוס / שינוי הכרה',
    checkpoints: ['scene_assessment', 'avpu_check', 'disability_assessment', 'disability_status'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 9,
    title: 'חולה מדבק / דקירת מחט / חשיפה לנוזלי גוף',
    checkpoints: ['scene_assessment', 'secondary_survey_finish', 'infectious_exposure_control'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 10,
    title: 'תאונת צלילה',
    checkpoints: ['scene_assessment', 'diving_emergency_overview'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 11,
    title: 'הריון / לידה / מצב חירום מיילדותי',
    checkpoints: ['scene_assessment', 'avpu_check', 'special_patient_pregnancy'].map(unified),
    branches: [
      {
        from: unified('special_patient_pregnancy'),
        targets: [unified('labor_assessment'), unified('obstetric_emergency')],
      },
      {
        from: unified('obstetric_emergency'),
        targets: [
          unified('preeclampsia_eclampsia'), unified('pregnancy_bleeding_emergency'),
          unified('ectopic_pregnancy_emergency'), unified('obstetric_delivery_complication'),
          unified('pregnancy_trauma_emergency'),
        ],
      },
    ],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 12,
    title: 'אר״ן',
    checkpoints: ['scene_assessment', 'mass_casualty_protocol'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 13,
    title: 'חומ״ס',
    checkpoints: ['scene_assessment', 'hazmat_protocol'].map(unified),
    clinicalReviewStatus: 'pending',
  },
  {
    id: 14,
    title: 'פגיעות שלד / עמ״ש / קיבועים',
    checkpoints: ['scene_assessment', 'trauma_protocol', 'abcde_trauma', 'trauma_spine_extremity'].map(unified),
    branches: [
      {
        from: unified('trauma_spine_extremity'),
        targets: [unified('trauma_spine_precautions'), unified('trauma_fracture_assessment')],
      },
      { from: unified('trauma_fracture_assessment'), targets: [unified('trauma_splinting')] },
    ],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 15,
    title: 'טביעה / התחשמלות',
    checkpoints: ['scene_assessment', 'trauma_environmental'].map(unified),
    branches: [
      { from: unified('trauma_environmental'), targets: [unified('drowning_incident'), unified('electrical_injury')] },
      { from: unified('drowning_incident'), targets: [unified('drowning_resuscitation'), unified('drowning_post_rescue')] },
      { from: unified('electrical_injury'), targets: [unified('electrical_resuscitation'), unified('electrical_conscious_management')] },
    ],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 16,
    title: 'נשיכה / הכשה / פגיעה ימית',
    checkpoints: [
      'scene_assessment', 'trauma_protocol', 'abcde_trauma', 'trauma_exposure_gate',
      'trauma_animal_bites',
    ].map(unified),
    branches: [{
      from: unified('trauma_animal_bites'),
      targets: [
        unified('animal_bite_rabies'), unified('venomous_bite_sting'),
        unified('marine_animal_injury'), unified('bee_sting_reaction'),
      ],
    }],
    clinicalReviewStatus: 'pending',
  },
  {
    id: 17,
    title: 'כוויה / שאיפת עשן / פצע רקמה רכה',
    checkpoints: [
      'scene_assessment', 'trauma_protocol', 'abcde_trauma', 'trauma_exposure_gate',
      'trauma_soft_tissue_burns',
    ].map(unified),
    branches: [{
      from: unified('trauma_soft_tissue_burns'),
      targets: [unified('burns'), unified('smoke_inhalation'), unified('soft_tissue_wound_support')],
    }],
    clinicalReviewStatus: 'pending',
  },
];
