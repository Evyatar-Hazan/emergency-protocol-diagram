import type { SourceProvenance } from '../../types/sourceProvenance';
import vitalSignsProvenanceData from '../../data/vital-signs-provenance.json';

export type VitalSignsAgeGroup = 'adult' | 'child';
export type VitalSignsCategoryKey =
  | 'airway'
  | 'breathing'
  | 'circulation'
  | 'disability'
  | 'exposure';

export interface VitalSignSearchEntry {
  key: string;
  label: string;
  value: string;
}

export interface VitalSignSearchCard {
  id: string;
  categoryKey: VitalSignsCategoryKey;
  categoryTitle: string;
  parameterKey: string;
  parameterName: string;
  entries: VitalSignSearchEntry[];
  sourceLabel?: string;
  sourceVersion?: string | null;
}

interface VitalSignsProvenanceMapping {
  related_node_id: string;
  source_id: string;
  applies_to: VitalSignsAgeGroup[];
}

interface VitalSignsProvenanceManifest {
  schema_version: '1.0.0';
  generated_from: string;
  review_notice: string;
  pending_defaults: Omit<SourceProvenance, 'source_id' | 'source_index' | 'label' | 'url'>;
  sources: Record<string, Pick<SourceProvenance, 'label' | 'url'>>;
  parameters: Record<string, VitalSignsProvenanceMapping>;
}

export const vitalSignsProvenanceManifest =
  vitalSignsProvenanceData as VitalSignsProvenanceManifest;

const pendingReviewLabels: Partial<Record<SourceProvenance['review_status'], string>> = {
  not_requested: 'טרם התבקשה סקירה',
  pending: 'ממתין לסקירה',
  in_review: 'בסקירה',
  changes_requested: 'נדרשים שינויים',
  scope_blocked: 'חסום מחוץ להיקף',
  rejected: 'נדחה',
  expired: 'תוקף הסקירה פג',
  withdrawn: 'נמשך',
};

const searchAliases: Record<string, string[]> = {
  respiratory_rate: ['קצב נשימה', 'מספר נשימות', 'respiratory rate', 'rr'],
  airway_patency: ['פתיחות נתיב אוויר', 'דרכי אוויר', 'airway', 'patency'],
  oxygen_saturation: ['סטורציה', 'ריווי חמצן', 'רוויון חמצן', 'spo2', 'oxygen saturation'],
  breath_sounds: ['קולות נשימה', 'צלילי נשימה', 'breath sounds', 'wheezing', 'צפצופים'],
  chest_expansion: ['התרחבות בית החזה', 'סימטריית חזה', 'chest expansion'],
  work_of_breathing: ['מאמץ נשימתי', 'עבודת נשימה', 'work of breathing', 'wob'],
  heart_rate: ['דופק', 'קצב לב', 'heart rate', 'pulse', 'bpm'],
  blood_pressure: ['לחץ דם', 'blood pressure', 'bp', 'mmhg'],
  capillary_refill: ['מילוי נימי', 'capillary refill', 'crt'],
  skin_color: ['צבע עור', 'גוון עור', 'skin color', 'cyanosis', 'ציאנוזה'],
  pulse_quality: ['איכות דופק', 'עוצמת דופק', 'pulse quality'],
  gcs: ['גלזגו', 'glasgow coma scale', 'gcs'],
  avpu: ['מצב הכרה', 'alert verbal pain unresponsive', 'avpu'],
  pupils: ['אישונים', 'pupils', 'perrla', 'אניזוקוריה'],
  blood_glucose: ['סוכר', 'גלוקוז', 'blood glucose', 'glucose', 'mg dl'],
  body_temperature: ['טמפרטורה', 'חום גוף', 'body temperature', 'celsius'],
  skin_integrity: ['שלמות העור', 'פצעים', 'skin integrity'],
};

export function getVitalSignProvenance(
  categoryKey: VitalSignsCategoryKey,
  parameterKey: string,
  ageGroup: VitalSignsAgeGroup,
): SourceProvenance | null {
  const mapping = vitalSignsProvenanceManifest.parameters[`${categoryKey}:${parameterKey}`];
  if (!mapping || !mapping.applies_to.includes(ageGroup)) {
    return null;
  }

  const source = vitalSignsProvenanceManifest.sources[mapping.source_id];
  if (!source) {
    return null;
  }

  return {
    source_id: mapping.source_id,
    source_index: 0,
    ...source,
    ...vitalSignsProvenanceManifest.pending_defaults,
    note: `מיפוי עקיבות מכרטיס המדד לצומת ${mapping.related_node_id}; אין בכך אישור לערכי הכרטיס.`,
  };
}

export function getVitalSignProvenancePresentation(source: SourceProvenance | null) {
  if (!source) {
    return {
      approved: false,
      reviewLabel: 'עקיבות חסרה',
      versionLabel: 'לא תועדה',
      reviewedAtLabel: 'טרם נבדק',
    };
  }

  return {
    approved: false,
    reviewLabel:
      pendingReviewLabels[source.review_status] ?? 'אין אישור תקף במניפסט המדדים',
    versionLabel: source.version_or_date ?? 'לא תועדה',
    reviewedAtLabel: source.reviewed_at
      ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium' }).format(new Date(source.reviewed_at))
      : 'טרם נבדק',
  };
}

export function normalizeVitalSignsSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[־‐‑‒–—]/g, '-')
    .replace(/[\u0591-\u05c7]/g, '')
    .toLocaleLowerCase('he-IL')
    .replace(/[^\p{L}\p{N}<>=%+-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function matchesVitalSignsQuery(card: VitalSignSearchCard, query: string): boolean {
  const normalizedQuery = normalizeVitalSignsSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  const aliases = searchAliases[card.parameterKey] ?? [];
  const haystack = normalizeVitalSignsSearch(
    [
      card.categoryTitle,
      card.parameterName,
      card.parameterKey,
      card.sourceLabel,
      card.sourceVersion,
      ...aliases,
      ...card.entries.flatMap((entry) => [entry.label, entry.value, entry.key]),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' '),
  );

  return normalizedQuery.split(' ').every((token) => haystack.includes(token));
}

export function filterVitalSignCards<T extends VitalSignSearchCard>(
  cards: T[],
  options: {
    query: string;
    activeCategory: 'all' | VitalSignsCategoryKey;
    showFavoritesOnly: boolean;
    favorites: ReadonlySet<string>;
  },
): T[] {
  return cards.filter((card) => {
    if (options.activeCategory !== 'all' && card.categoryKey !== options.activeCategory) {
      return false;
    }

    if (options.showFavoritesOnly && !options.favorites.has(card.id)) {
      return false;
    }

    return matchesVitalSignsQuery(card, options.query);
  });
}
