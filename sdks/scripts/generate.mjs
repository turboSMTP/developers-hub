#!/usr/bin/env node
/**
 * TurboSMTP SDK — Layer 1 generation pipeline (task 1.6).
 *
 * Pipeline:  overlay  →  bundle  →  filter-by-domain (+ prune)  →  generate per language
 *   0. overlay  : apply api-reference/overlays/*.yaml to the synced spec              (openapi-format)
 *                 → build/turbo-smtp.overlaid.yaml. SKIPPED ENTIRELY when no overlay exists, so
 *                 the default path is byte-for-byte what it was before overlays landed.
 *   1. bundle   : → build/turbo-smtp.bundled.yaml                                     (redocly bundle)
 *   2. filter   : keep only the target domain's tag(s), drop orphaned components  (redocly filter-in
 *                 + --remove-unused-components) → build/turbo-smtp.<domain>.yaml
 *   3. generate : openapi-generator-cli generate -c config/<lang>.yaml            (version pinned in
 *                 sdks/openapitools.json, passed explicitly — see GENERATOR_CONFIG below).
 *                 Fed the 3.1 spec directly — no down-convert (see 1.3/1.4).
 *
 * Overlays are a GENERATION-ONLY concern: GitHub Pages serves api-reference/upstream/ verbatim, so
 * an overlay never reaches the published contract. It may change operationIds, naming and `x-`
 * extensions; it may never change wire semantics. See api-reference/overlays/README.md and
 * sdks/docs/adr/0013-openapi-overlays.md — those rules are what make this reconcilable with the
 * single-source-of-truth constraint.
 *
 * All three tools are pinned to an exact version. Neither the overlay step nor the bundler is a
 * passive step: their output is the generator's input, so a minor in either changes the committed
 * Layer 1 without any spec change. ADR-0004 rules 1-2 apply — never a range permitting minors, and
 * the floor is the version actually validated.
 *
 * Cross-platform by design: pure Node + `npx`, so it runs identically on Windows (local) and Linux
 * (CI). Requires Node 18+ and a JVM (the generator is Java; the npm wrapper downloads the jar).
 *
 * Usage (run from anywhere):
 *   node sdks/scripts/generate.mjs [--domain=mail] [--lang=node,python,...] [--out-root=<dir>]
 *                                  [--tags=tagA,tagB] [--skip-bundle]
 *
 * Examples:
 *   node sdks/scripts/generate.mjs                        # P0: mail domain, all 5 languages, canonical layout
 *   node sdks/scripts/generate.mjs --lang=node            # just the Node reference (task 2.1)
 *   node sdks/scripts/generate.mjs --out-root=build/generated   # safe dry run into build/ (git-ignored)
 *
 * Notes:
 *   - Layer 1 lands in an internal namespace per language (see config/README.md); the hand-written
 *     Layer 2 facade owns the public entrypoint and packaging. Skipping generated project files
 *     (package.json / .csproj / composer.json) is handled per-package at scaffolding time (2.1+).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(SDK_ROOT, '..');
const BUILD_DIR = join(SDK_ROOT, 'build');

/** Exact, not a range: see the pipeline note above. Verified against this repository's spec. */
const REDOCLY = '@redocly/cli@2.47.0';

/**
 * Overlay applier. Redocly cannot do this: 2.47.0 has no `overlay` command, and an `overlays:` key
 * is rejected both at config root and under `apis.<name>` — after which `bundle` silently emits the
 * unmodified document, which is the dangerous failure mode. Hence a second pinned tool.
 *
 * `--no-sort` is MANDATORY: openapi-format reorders keys by default, which would rewrite the whole
 * bundle and bury the overlay's actual effect in the diff.
 */
const OVERLAY_TOOL = 'openapi-format@1.33.7';

/**
 * Passed to every generator invocation as `--openapitools`. Do not rely on the wrapper finding
 * this file on its own: its implicit lookup does not honour `cwd` consistently across shells.
 * Spawned through a Windows shell it skips this file, silently re-pins to the latest release and
 * writes a fresh `openapitools.json` at the repository root to record it — so the "pinned"
 * generator floats, and the only visible symptom is a changed `.openapi-generator/VERSION` inside
 * the regenerated Layer 1. Naming the file explicitly makes the pin hold on every platform.
 */
const GENERATOR_CONFIG = join(SDK_ROOT, 'openapitools.json');

const SPEC_IN = join(REPO_ROOT, 'api-reference', 'upstream', 'turbo-smtp.yaml');
const OVERLAY_DIR = join(REPO_ROOT, 'api-reference', 'overlays');
const OVERLAID = join(BUILD_DIR, 'turbo-smtp.overlaid.yaml');
const BUNDLED = join(BUILD_DIR, 'turbo-smtp.bundled.yaml');

// Domain → OpenAPI tag(s). Verified: mail, validation. Others are placeholders for later tiers —
// confirm the actual tag strings against the spec when those domains are implemented, or pass --tags.
const DOMAIN_TAGS = {
  mail: ['mail'],
  validation: ['email-validator'],
  analytics: ['analytics'],
  suppressions: ['suppressions'],
  subaccounts: ['subaccounts'],
  account: ['consumerkey', 'authentication'],
};

// Language → generator config + canonical Layer 1 output dir (relative to SDK_ROOT).
const LANGS = {
  node: { config: 'config/node.yaml', out: 'packages/node/src/generated' },
  python: { config: 'config/python.yaml', out: 'packages/python' },
  csharp: { config: 'config/csharp.yaml', out: 'packages/csharp' },
  go: { config: 'config/go.yaml', out: 'packages/go/generated' },
  php: { config: 'config/php.yaml', out: 'packages/php' },
};

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (!m) fail(`Unrecognized argument: ${a}`);
    args[m[1]] = m[2] ?? true;
  }
  return args;
}

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/** Run a command string via the shell (cross-platform npx resolution), cwd = sdks/.
 *  Aborts the pipeline on non-zero exit. */
function run(label, cmd) {
  console.log(`\n▶ ${label}\n  ${cmd}`);
  const r = spawnSync(cmd, { cwd: SDK_ROOT, shell: true, stdio: 'inherit' });
  if (r.status !== 0) fail(`${label} failed (exit ${r.status ?? r.signal}).`);
}

/** Overlay documents to apply, in lexicographic order. Empty is the normal state. */
function listOverlays() {
  if (!existsSync(OVERLAY_DIR)) return [];
  return readdirSync(OVERLAY_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map((f) => join(OVERLAY_DIR, f));
}

/**
 * Apply every overlay to the synced spec, returning the path the bundler should read.
 * With no overlays present this returns SPEC_IN untouched — the step costs nothing and changes
 * nothing, so Layer 1 stays byte-identical until an overlay is deliberately added.
 *
 * openapi-format takes one --overlayFile per run, so several are applied by chaining.
 */
function applyOverlays() {
  const overlays = listOverlays();
  if (overlays.length === 0) {
    console.log('\n▶ overlay\n  none in api-reference/overlays/ — using the synced spec as-is');
    return SPEC_IN;
  }
  let input = SPEC_IN;
  overlays.forEach((overlay, i) => {
    // Chain through distinct files so a failure leaves the inputs inspectable.
    const output = i === overlays.length - 1 ? OVERLAID : join(BUILD_DIR, `_overlay-${i}.yaml`);
    run(
      `overlay ${i + 1}/${overlays.length} → ${overlay.split(/[\\/]/).pop()}`,
      `npx --yes ${OVERLAY_TOOL} "${input}" -o "${output}" --overlayFile "${overlay}" --no-sort`,
    );
    input = output;
  });
  return OVERLAID;
}

function main() {
  const args = parseArgs(process.argv);
  const domain = args.domain || 'mail';
  const tags = args.tags ? String(args.tags).split(',') : DOMAIN_TAGS[domain];
  if (!tags)
    fail(`Unknown domain "${domain}". Known: ${Object.keys(DOMAIN_TAGS).join(', ')} (or pass --tags).`);

  const langs = args.lang ? String(args.lang).split(',') : Object.keys(LANGS);
  for (const l of langs)
    if (!LANGS[l]) fail(`Unknown language "${l}". Known: ${Object.keys(LANGS).join(', ')}.`);

  mkdirSync(BUILD_DIR, { recursive: true });

  // 0-1. Apply overlays (generation-only), then bundle. Both are skipped by --skip-bundle, which
  // reuses an existing BUNDLED: the overlay feeds the bundler, so skipping one must skip the other.
  if (!args['skip-bundle']) {
    const specForBundle = applyOverlays();
    run('bundle spec', `npx --yes ${REDOCLY} bundle "${specForBundle}" -o "${BUNDLED}"`);
  }

  // 2. Filter to the domain's tag(s) and prune orphaned components.
  const filterCfg = join(BUILD_DIR, `_filter-${domain}.yaml`);
  const filtered = join(BUILD_DIR, `turbo-smtp.${domain}.yaml`);
  writeFileSync(
    filterCfg,
    `decorators:\n  filter-in:\n    property: tags\n    matchStrategy: any\n    value:\n${tags.map((t) => `      - ${t}`).join('\n')}\n`,
  );
  run(
    `filter → ${domain} [${tags.join(', ')}]`,
    `npx --yes ${REDOCLY} bundle "${BUNDLED}" --config "${filterCfg}" --remove-unused-components -o "${filtered}"`,
  );

  // 3. Generate each language from the filtered, domain-scoped spec.
  for (const l of langs) {
    const outDir = args['out-root']
      ? join(resolve(String(args['out-root'])), l)
      : join(SDK_ROOT, LANGS[l].out);
    run(
      `generate ${l} (${domain})`,
      `npx --yes @openapitools/openapi-generator-cli --openapitools "${GENERATOR_CONFIG}" generate ` +
        `-i "${filtered}" -c "${join(SDK_ROOT, LANGS[l].config)}" -o "${outDir}"`,
    );
  }

  console.log(`\n✔ Done — domain "${domain}", languages: ${langs.join(', ')}.`);
}

main();
