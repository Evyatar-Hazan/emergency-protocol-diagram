import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const examplesRoot = new URL('../docs/governance/examples/', import.meta.url);
const schema = JSON.parse(await readFile(
  new URL('../docs/governance/schemas/clinical-review.schema.json', import.meta.url),
  'utf8',
));

const ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const fixtures = [
  { file: 'clinical-review.approved.valid.json', valid: true },
  { file: 'clinical-review.example.json', valid: true },
  { file: 'clinical-review.approved.invalid-source-null.json', valid: false, path: '/source' },
  { file: 'clinical-review.approved.invalid-decided-at-null.json', valid: false, path: '/decided_at' },
  { file: 'clinical-review.approved.invalid-review-due-null.json', valid: false, path: '/review_due' },
];

const failures = [];
for (const fixture of fixtures) {
  const value = JSON.parse(await readFile(new URL(fixture.file, examplesRoot), 'utf8'));
  const actual = validate(value);
  const errors = structuredClone(validate.errors ?? []);

  if (actual !== fixture.valid) {
    failures.push(`${fixture.file}: expected ${fixture.valid ? 'valid' : 'invalid'}, received ${actual ? 'valid' : 'invalid'} (${ajv.errorsText(errors)})`);
    continue;
  }
  if (!fixture.valid && !errors.some((error) => error.instancePath === fixture.path && error.keyword === 'type')) {
    failures.push(`${fixture.file}: expected a type error at ${fixture.path}; received ${ajv.errorsText(errors)}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Clinical review schema validation failed:\n${failures.join('\n')}`);
}

console.log(`Validated ${fixtures.length} clinical review fixtures with Draft 2020-12 and format checks from ${repositoryRoot}.`);
