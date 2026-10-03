import { describe, expect, it } from 'vitest';
import { MEASUREMENT_SCHEMA_VERSION, validateMeasurementEvent } from './privacyEvents';

const catalog = {
  contentVersion: 'synthetic-v1',
  nodeIds: new Set(['training_node_alpha']),
  referenceIds: new Set(['training_reference_alpha']),
};

describe('privacy-preserving measurement events', () => {
  it.each([
    {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'learning_started',
      experience: 'guided_flow',
      contentVersion: 'synthetic-v1',
    },
    {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'learning_step_viewed',
      experience: 'guided_flow',
      contentVersion: 'synthetic-v1',
      nodeId: 'training_node_alpha',
      depthBucket: '2-5',
    },
    {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'learning_completed',
      experience: 'guided_flow',
      contentVersion: 'synthetic-v1',
      elapsedBucket: '5_to_10m',
    },
    {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'reference_opened',
      referenceType: 'source',
      contentVersion: 'synthetic-v1',
      contentId: 'training_reference_alpha',
    },
  ])('accepts the minimal allowlisted event %#', (event) => {
    expect(validateMeasurementEvent(event, catalog)).toEqual({ ok: true, event });
  });

  it.each(['patient_id', 'userId', 'session_id', 'email', 'deviceId', 'google_id'])(
    'rejects identifier field %s',
    (field) => {
      const event = {
        schemaVersion: MEASUREMENT_SCHEMA_VERSION,
        event: 'learning_started',
        experience: 'guided_flow',
        contentVersion: 'synthetic-v1',
        [field]: 'synthetic-forbidden-value',
      };

      expect(validateMeasurementEvent(event, catalog)).toEqual({
        ok: false,
        reason: 'forbidden_field',
      });
    },
  );

  it.each(['free_text', 'notes', 'symptoms', 'vitals', 'diagnosis', 'comment'])(
    'rejects personal or clinical payload field %s',
    (field) => {
      const event = {
        schemaVersion: MEASUREMENT_SCHEMA_VERSION,
        event: 'learning_started',
        experience: 'guided_flow',
        contentVersion: 'synthetic-v1',
        [field]: 'synthetic-forbidden-value',
      };

      expect(validateMeasurementEvent(event, catalog)).toEqual({
        ok: false,
        reason: 'forbidden_field',
      });
    },
  );

  it.each(['timestamp', 'url', 'referrer', 'ip_address', 'user_agent', 'location'])(
    'rejects fine-grained tracking field %s',
    (field) => {
      const event = {
        schemaVersion: MEASUREMENT_SCHEMA_VERSION,
        event: 'learning_started',
        experience: 'guided_flow',
        contentVersion: 'synthetic-v1',
        [field]: 'synthetic-forbidden-value',
      };

      expect(validateMeasurementEvent(event, catalog)).toEqual({
        ok: false,
        reason: 'forbidden_field',
      });
    },
  );

  it('rejects unknown fields even when they do not match the forbidden-name list', () => {
    const event = {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'learning_started',
      experience: 'guided_flow',
      contentVersion: 'synthetic-v1',
      campaign: 'synthetic-campaign',
    };

    expect(validateMeasurementEvent(event, catalog)).toEqual({
      ok: false,
      reason: 'unexpected_field',
    });
  });

  it('rejects content identifiers that are not in the supplied catalog', () => {
    const event = {
      schemaVersion: MEASUREMENT_SCHEMA_VERSION,
      event: 'learning_step_viewed',
      experience: 'guided_flow',
      contentVersion: 'synthetic-v1',
      nodeId: 'free_form_value_is_not_allowed',
      depthBucket: '2-5',
    };

    expect(validateMeasurementEvent(event, catalog)).toEqual({
      ok: false,
      reason: 'unknown_content_id',
    });
  });

  it('rejects event versions and content versions outside the active contract', () => {
    expect(
      validateMeasurementEvent(
        {
          schemaVersion: 2,
          event: 'learning_started',
          experience: 'guided_flow',
          contentVersion: 'synthetic-v2',
        },
        catalog,
      ),
    ).toEqual({ ok: false, reason: 'invalid_value' });
  });
});
