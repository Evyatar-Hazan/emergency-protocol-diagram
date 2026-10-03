import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import vitalSignsData from '../../data/vital-signs.json';
import { VitalSignsView } from './VitalSignsView';
import {
  filterVitalSignCards,
  getVitalSignProvenance,
  getVitalSignProvenancePresentation,
  matchesVitalSignsQuery,
  normalizeVitalSignsSearch,
  vitalSignsProvenanceManifest,
  type VitalSignSearchCard,
  type VitalSignsAgeGroup,
  type VitalSignsCategoryKey,
} from './vitalSignsRetrieval';

const oxygenCard: VitalSignSearchCard = {
  id: 'breathing:oxygen_saturation',
  categoryKey: 'breathing',
  categoryTitle: 'נשימה (Breathing)',
  parameterKey: 'oxygen_saturation',
  parameterName: 'רוויון חמצן (SpO2)',
  entries: [
    { key: 'normal', label: 'תקין', value: '95-100%' },
    { key: 'severe', label: 'חמור', value: '<85%' },
  ],
  sourceLabel: 'איחוד הצלה - יחידה 06 אנמנזה וגישה לחולה',
  sourceVersion: null,
};

const heartRateCard: VitalSignSearchCard = {
  id: 'circulation:heart_rate',
  categoryKey: 'circulation',
  categoryTitle: 'מחזור דם (Circulation)',
  parameterKey: 'heart_rate',
  parameterName: 'דופק',
  entries: [{ key: 'normal', label: 'תקין', value: '60-100 פעימות/דקה' }],
};

describe('vital-sign retrieval', () => {
  it('normalizes mixed Hebrew, English, punctuation, and units', () => {
    expect(normalizeVitalSignsSearch('  SpO2 / רִוּוּי־חמצן  ')).toBe('spo2 רווי-חמצן');
    expect(normalizeVitalSignsSearch('120/80 mmHg')).toBe('120 80 mmhg');
  });

  it.each(['סטורציה', 'SpO2', 'oxygen saturation', '95-100%', '<85']) (
    'finds oxygen saturation by alias or value: %s',
    (query) => {
      expect(matchesVitalSignsQuery(oxygenCard, query)).toBe(true);
    },
  );

  it('uses all query terms and avoids unrelated matches', () => {
    expect(matchesVitalSignsQuery(oxygenCard, 'סטורציה 95')).toBe(true);
    expect(matchesVitalSignsQuery(oxygenCard, 'סטורציה דופק')).toBe(false);
  });

  it('combines category, favorites, and query filters', () => {
    expect(
      filterVitalSignCards([oxygenCard, heartRateCard], {
        query: 'דופק',
        activeCategory: 'circulation',
        showFavoritesOnly: true,
        favorites: new Set([heartRateCard.id]),
      }),
    ).toEqual([heartRateCard]);

    expect(
      filterVitalSignCards([oxygenCard, heartRateCard], {
        query: 'סטורציה',
        activeCategory: 'circulation',
        showFavoritesOnly: false,
        favorites: new Set(),
      }),
    ).toEqual([]);

    expect(
      filterVitalSignCards([oxygenCard, heartRateCard], {
        query: '',
        activeCategory: 'all',
        showFavoritesOnly: true,
        favorites: new Set([oxygenCard.id]),
      }),
    ).toEqual([oxygenCard]);
  });

  it('fails closed when a card or its mapped source is missing', () => {
    expect(getVitalSignProvenance('airway', 'unknown_parameter', 'adult')).toBeNull();

    const mapping = vitalSignsProvenanceManifest.parameters['airway:airway_patency'];
    const originalSourceId = mapping.source_id;
    mapping.source_id = 'src_missing0000000';
    expect(getVitalSignProvenance('airway', 'airway_patency', 'adult')).toBeNull();
    mapping.source_id = originalSourceId;
  });

  it('never turns the vitals-only mapping into a clinical approval', () => {
    expect(getVitalSignProvenancePresentation(null)).toEqual({
      approved: false,
      reviewLabel: 'עקיבות חסרה',
      versionLabel: 'לא תועדה',
      reviewedAtLabel: 'טרם נבדק',
    });

    const pendingSource = getVitalSignProvenance('disability', 'gcs', 'adult');
    expect(pendingSource).not.toBeNull();

    const unsupportedApproval = {
      ...pendingSource!,
      review_status: 'approved_for_stated_use' as const,
      version_or_date: 'synthetic-version',
      reviewed_at: '2026-10-02T00:00:00Z',
    };
    const presentation = getVitalSignProvenancePresentation(unsupportedApproval);

    expect(presentation.approved).toBe(false);
    expect(presentation.reviewLabel).toBe('אין אישור תקף במניפסט המדדים');
    expect(presentation.versionLabel).toBe('synthetic-version');
    expect(presentation.reviewedAtLabel).not.toBe('טרם נבדק');
  });

  it('maps every adult and child card to an existing fail-closed source', () => {
    const categories = Object.entries(vitalSignsData) as Array<[
      VitalSignsCategoryKey,
      (typeof vitalSignsData)[keyof typeof vitalSignsData],
    ]>;

    for (const [categoryKey, category] of categories) {
      for (const ageGroup of ['adult', 'child'] as VitalSignsAgeGroup[]) {
        for (const parameterKey of Object.keys(category[ageGroup])) {
          const mapping = vitalSignsProvenanceManifest.parameters[`${categoryKey}:${parameterKey}`];
          const source = getVitalSignProvenance(categoryKey, parameterKey, ageGroup);

          expect(mapping, `${ageGroup}:${categoryKey}:${parameterKey}`).toBeDefined();
          expect(source, `${ageGroup}:${categoryKey}:${parameterKey}`).not.toBeNull();
          expect(source?.version_or_date).toBeNull();
          expect(source?.source_status).toBe('pending');
          expect(source?.review_status).toBe('pending');
          expect(source?.authority_status).toBe('unknown');
          expect(getVitalSignProvenancePresentation(source).approved).toBe(false);
        }
      }
    }
  });

  it('renders source, version, review status, and retrieval summary in the cards', () => {
    const html = renderToStaticMarkup(createElement(VitalSignsView));

    expect(html).toContain('נמצאו 17 מתוך 17 מדדים עבור מבוגר');
    expect(html).toContain('מקור וגרסת תוכן');
    expect(html).toContain('ממתין לסקירה');
    expect(html).toContain('לא תועדה');
    expect(html).toContain('טרם נבדק');
    expect(html).toContain('עקיבות בלבד ואינו מהווה אישור לערכים בכרטיס');
  });
});
