// Assembles the publishable API reference from this repository's two halves: the
// vendored Swagger UI in api-integrations/swagger-ui/, and the synced spec at
// api-integrations/upstream/turbo-smtp.yaml.
//
// WHY THIS EXISTS. developers-hub does not serve GitHub Pages. The site is published
// from turbosmtp-swagger-ui, a read-only mirror, and that mirror is FLAT: index.html
// and turbo-smtp.yaml sit side by side. The flatness is what lets
// swagger-ui/swagger-initializer.js keep `url: "./turbo-smtp.yaml"` exactly as shipped
// -- the path already resolves in the mirror, so the UI assets need no local divergence
// and can be refreshed by a blanket overwrite.
//
// The spec is deliberately NOT stored flat here. It lives at upstream/turbo-smtp.yaml
// because it is the source of truth for five SDKs, read by scripts/generate.mjs and
// scripts/check-spec.mjs. Flattening happens at assembly and nowhere else.
//
// Both publish-api-reference.yml and the local page check call this script, so what CI
// publishes and what you verify by hand cannot drift apart.
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

// Refuse to write inside the repository. The output is generated and this repository is
// public -- a generated tree committed here is what sdk-integrations/build/ is git-ignored
// to prevent.
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
