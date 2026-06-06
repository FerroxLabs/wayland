import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ajv = new Ajv2020({ strict: false });
// ajv-formats resolves its own nested copy of ajv, so its Plugin signature is
// nominally distinct from the top-level Ajv2020 class even though the runtime
// instance is fully compatible. Cast to the exact parameter type ajv-formats expects.
addFormats(ajv as unknown as Parameters<typeof addFormats>[0]);
const entrySchema = JSON.parse(readFileSync(join(root, 'schema/entry.schema.json'), 'utf8'));
const catalogSchema = JSON.parse(readFileSync(join(root, 'schema/catalog.schema.json'), 'utf8'));
const validateEntry = ajv.compile(entrySchema);
const validateCatalog = ajv.compile(catalogSchema);

let errors = 0;
for (const file of readdirSync(join(root, 'entries'))) {
  if (!file.endsWith('.json')) continue;
  const data = JSON.parse(readFileSync(join(root, 'entries', file), 'utf8'));
  if (!validateEntry(data)) {
    console.error(`x ${file}:`, validateEntry.errors);
    errors++;
  }
}
const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
if (!validateCatalog(catalog)) {
  console.error('x catalog.json:', validateCatalog.errors);
  errors++;
}
if (errors > 0) {
  console.error(`${errors} schema violations.`);
  process.exit(1);
}
console.log('All catalog files valid.');
