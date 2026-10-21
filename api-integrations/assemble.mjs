// Assembles the publishable API reference from this repository's two halves: the
// vendored Swagger UI in api-integrations/swagger-ui/, and the synced spec at
// api-integrations/upstream/turbo-smtp.yaml.
//
// WHY THIS EXISTS. The mirror this publishes to is FLAT: index.html and turbo-smtp.yaml sit
// side by side. That flatness is what lets swagger-ui/swagger-initializer.js keep
// `url: "./turbo-smtp.yaml"` exactly as shipped -- the path already resolves there, so the UI
// needs no local divergence and can be refreshed by a blanket overwrite.
//
// The spec is deliberately NOT stored flat here: it lives at upstream/turbo-smtp.yaml because
// that is the generation input. Flattening happens at assembly and nowhere else.
//
// CI and the local page check both run this script, so a change here moves both.
//
// Usage: node api-integrations/assemble.mjs --out <dir>

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const UI_DIR = join(HERE, 'swagger-ui');
const SPEC = join(HERE, 'upstream', 'turbo-smtp.yaml');

function fail(message) {
  console.error(`assemble: ${message}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
const i = argv.indexOf('--out');
if (i === -1 || !argv[i + 1]) fail('usage: node api-integrations/assemble.mjs --out <dir>');
const OUT = resolve(argv[i + 1]);

// Refuse to write inside the repository: the output is generated and this repository is public.
const rel = relative(REPO_ROOT, OUT);
if (rel && !rel.startsWith('..')) fail(`--out must be outside the repository; got ${OUT}`);

if (!existsSync(UI_DIR)) fail(`missing ${UI_DIR}`);
if (!existsSync(SPEC)) fail(`missing ${SPEC}`);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

cpSync(UI_DIR, OUT, { recursive: true }); // the vendored UI, verbatim
cpSync(SPEC, join(OUT, 'turbo-smtp.yaml')); // the spec, FLATTENED beside index.html

// Pages on the mirror is branch-source, where Jekyll runs, so .nojekyll has to be there.
// Written at assembly rather than committed so swagger-ui/ stays exactly what turbo-api-2 ships.
writeFileSync(join(OUT, '.nojekyll'), '');

console.log(`assemble: wrote ${OUT}`);
