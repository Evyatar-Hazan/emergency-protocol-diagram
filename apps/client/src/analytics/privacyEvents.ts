export const MEASUREMENT_SCHEMA_VERSION = 1 as const;

export type LearningExperience = 'guided_flow' | 'vital_signs' | 'system_map';
export type DepthBucket = '1' | '2-5' | '6-10' | '11-20' | '21+';
export type ElapsedBucket = 'under_2m' | '2_to_5m' | '5_to_10m' | 'over_10m';
export type ReferenceType = 'source' | 'vital_sign';

export type MeasurementEvent =
  | {
      schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
      event: 'learning_started';
      experience: LearningExperience;
      contentVersion: string;
    }
  | {
      schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
      event: 'learning_step_viewed';
      experience: 'guided_flow';
      contentVersion: string;
      nodeId: string;
      depthBucket: DepthBucket;
    }
  | {
      schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
      event: 'learning_completed';
      experience: 'guided_flow';
      contentVersion: string;
      elapsedBucket: ElapsedBucket;
    }
  | {
      schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
      event: 'reference_opened';
      referenceType: ReferenceType;
      contentVersion: string;
      contentId: string;
    };

export type MeasurementCatalog = Readonly<{
  contentVersion: string;
  nodeIds: ReadonlySet<string>;
  referenceIds: ReadonlySet<string>;
}>;

export type MeasurementValidationResult =
  | { ok: true; event: MeasurementEvent }
  | {
      ok: false;
      reason:
        | 'not_an_object'
        | 'forbidden_field'
        | 'unsupported_event'
        | 'unexpected_field'
        | 'invalid_value'
        | 'unknown_content_id';
    };

const forbiddenFieldNames = new Set([
  'address',
  'authtoken',
  'birthdate',
  'comment',
  'cookieid',
  'diagnosis',
  'deviceid',
  'email',
  'freetext',
  'fullname',
  'googleid',
  'ip',
  'ipaddress',
  'latitude',
  'location',
  'longitude',
  'medications',
  'name',
  'notes',
  'patientid',
  'phone',
  'query',
  'referrer',
  'sessionid',
  'symptoms',
  'timestamp',
  'url',
  'useragent',
  'userid',
  'vitals',
]);

const experiences = new Set<LearningExperience>(['guided_flow', 'vital_signs', 'system_map']);
const depthBuckets = new Set<DepthBucket>(['1', '2-5', '6-10', '11-20', '21+']);
const elapsedBuckets = new Set<ElapsedBucket>([
  'under_2m',
  '2_to_5m',
  '5_to_10m',
  'over_10m',
]);
const referenceTypes = new Set<ReferenceType>(['source', 'vital_sign']);

function normalizeFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function containsForbiddenField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenField);
  }

  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, nestedValue]) =>
      forbiddenFieldNames.has(normalizeFieldName(key)) || containsForbiddenField(nestedValue),
  );
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hasValidCommonFields(
  value: Record<string, unknown>,
  catalog: MeasurementCatalog,
): boolean {
  return (
    value.schemaVersion === MEASUREMENT_SCHEMA_VERSION &&
    value.contentVersion === catalog.contentVersion &&
    typeof value.contentVersion === 'string' &&
    value.contentVersion.length > 0 &&
    value.contentVersion.length <= 64
  );
}

export function validateMeasurementEvent(
  input: unknown,
  catalog: MeasurementCatalog,
): MeasurementValidationResult {
  if (!isPlainRecord(input)) {
    return { ok: false, reason: 'not_an_object' };
  }

  if (containsForbiddenField(input)) {
    return { ok: false, reason: 'forbidden_field' };
  }

  if (typeof input.event !== 'string') {
    return { ok: false, reason: 'unsupported_event' };
  }

  if (!hasValidCommonFields(input, catalog)) {
    return { ok: false, reason: 'invalid_value' };
  }

  switch (input.event) {
    case 'learning_started': {
      if (!hasExactKeys(input, ['schemaVersion', 'event', 'experience', 'contentVersion'])) {
        return { ok: false, reason: 'unexpected_field' };
      }
      if (!experiences.has(input.experience as LearningExperience)) {
        return { ok: false, reason: 'invalid_value' };
      }
      return { ok: true, event: input as MeasurementEvent };
    }

    case 'learning_step_viewed': {
      if (
        !hasExactKeys(input, [
          'schemaVersion',
          'event',
          'experience',
          'contentVersion',
          'nodeId',
          'depthBucket',
        ])
      ) {
        return { ok: false, reason: 'unexpected_field' };
      }
      if (input.experience !== 'guided_flow' || !depthBuckets.has(input.depthBucket as DepthBucket)) {
        return { ok: false, reason: 'invalid_value' };
      }
      if (typeof input.nodeId !== 'string' || !catalog.nodeIds.has(input.nodeId)) {
        return { ok: false, reason: 'unknown_content_id' };
      }
      return { ok: true, event: input as MeasurementEvent };
    }

    case 'learning_completed': {
      if (
        !hasExactKeys(input, [
          'schemaVersion',
          'event',
          'experience',
          'contentVersion',
          'elapsedBucket',
        ])
      ) {
        return { ok: false, reason: 'unexpected_field' };
      }
      if (
        input.experience !== 'guided_flow' ||
        !elapsedBuckets.has(input.elapsedBucket as ElapsedBucket)
      ) {
        return { ok: false, reason: 'invalid_value' };
      }
      return { ok: true, event: input as MeasurementEvent };
    }

    case 'reference_opened': {
      if (
        !hasExactKeys(input, [
          'schemaVersion',
          'event',
          'referenceType',
          'contentVersion',
          'contentId',
        ])
      ) {
        return { ok: false, reason: 'unexpected_field' };
      }
      if (!referenceTypes.has(input.referenceType as ReferenceType)) {
        return { ok: false, reason: 'invalid_value' };
      }
      if (typeof input.contentId !== 'string' || !catalog.referenceIds.has(input.contentId)) {
        return { ok: false, reason: 'unknown_content_id' };
      }
      return { ok: true, event: input as MeasurementEvent };
    }

    default:
      return { ok: false, reason: 'unsupported_event' };
  }
}
