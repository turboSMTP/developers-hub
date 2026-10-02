#!/usr/bin/env node
/**
 * TurboSMTP SDK — Layer 1 generation pipeline.
 *
 * Pipeline:  overlay  →  bundle  →  filter-by-domain (+ prune)  →  generate per language
 *   0. overlay  : apply api-integrations/overlays/*.yaml to the synced spec              (openapi-format)
 *                 → build/turbo-smtp.overlaid.yaml. SKIPPED ENTIRELY when no overlay exists, so
 *                 the default path is byte-for-byte what it was before overlays landed.
 *   1. bundle   : → build/turbo-smtp.bundled.yaml                                     (redocly bundle)
 *   2. filter   : keep only the target domain's tag(s), drop orphaned components  (redocly filter-in
 *                 + --remove-unused-components) → build/turbo-smtp.<domain>.yaml
 *   3. generate : openapi-generator-cli generate -c config/<lang>.yaml            (version pinned in
 *                 sdk-integrations/openapitools.json, passed explicitly — see GENERATOR_CONFIG below).
 *                 Fed the 3.1 spec directly — no down-convert shim.
 *
 * Overlays are a GENERATION-ONLY concern: what is published is api-integrations/upstream/ verbatim,
 * assembled by api-integrations/assemble.mjs, which never reads overlays/ -- so an overlay cannot
 * reach the published contract. It may change operationIds, naming and `x-`
 * extensions; it may never change wire semantics. See api-integrations/overlays/README.md — those
 * rules are what make this reconcilable with the single-source-of-truth constraint.
 *
 * All three tools are pinned to an exact version. Neither the overlay step nor the bundler is a
 * passive step: their output is the generator's input, so a minor in either changes the committed
 * Layer 1 without any spec change. Hence the policy: never a range permitting minors, and
 * the floor is the version actually validated.
 *
 * Cross-platform by design: pure Node + `npx`, so it runs identically on Windows (local) and Linux
 * (CI). Requires Node 18+ and a JDK — Java 17 is what this project runs. The generator is a Java
 * program and the npm wrapper only downloads its jar, not a runtime, so a machine without a JDK
 * fails here rather than at install time.
 *
 * Usage (run from anywhere):
 *   node sdk-integrations/scripts/generate.mjs [--domain=mail] [--lang=node,python,...] [--out-root=<dir>]
 *                                  [--tags=tagA,tagB] [--skip-bundle]
 *
 * Examples:
 *   node sdk-integrations/scripts/generate.mjs                        # P0: mail domain, all 5 languages, canonical layout
 *   node sdk-integrations/scripts/generate.mjs --lang=node            # just the Node reference
 *   node sdk-integrations/scripts/generate.mjs --out-root=build/generated   # safe dry run into build/ (git-ignored)
 *
 * Notes:
 *   - Layer 1 lands in an internal namespace per language (see config/README.md); the hand-written
 *     Layer 2 facade owns the public entrypoint and packaging. Skipping generated project files
 *     (package.json / .csproj / composer.json) is handled per-package when that package is scaffolded.
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
 * Passed to every generator invocation as `--openapitools`. The wrapper's implicit lookup does not
 * honour `cwd` consistently across shells — spawned through a Windows shell it skips this file and
 * the pin silently floats, with no failure. Naming the file explicitly makes it hold on every
 * platform.
 */
const GENERATOR_CONFIG = join(SDK_ROOT, 'openapitools.json');

const SPEC_IN = join(REPO_ROOT, 'api-integrations', 'upstream', 'turbo-smtp.yaml');
const OVERLAY_DIR = join(REPO_ROOT, 'api-integrations', 'overlays');
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

// A language ships two API packages, and the domain decides which one a run targets: `mail`
// generates into the mail package, every other domain into the unified one. The generator config
// is shared — it is domain-agnostic by design (see config/README.md) — so what differs per package
// is the output directory and the published name the generator stamps into its own docs.
const MAIL = 'mail';
const UNIFIED = 'unified';

// Language → generator config + per-package Layer 1 output dir (relative to SDK_ROOT) and
// published package name.
const LANGS = {
  node: {
    config: 'config/node.yaml',
    nameProp: 'npmName',
    mail: { out: 'packages/node-mail/src/generated', name: '@turbosmtp/mail' },
    unified: { out: 'packages/node/src/generated', name: '@turbosmtp/sdk' },
  },
  python: {
    config: 'config/python.yaml',
    nameProp: 'projectName',
    mail: { out: 'packages/python-mail', name: 'turbosmtp-mail' },
    unified: { out: 'packages/python', name: 'turbosmtp' },
  },
  csharp: {
    config: 'config/csharp.yaml',
    nameProp: 'packageName',
    mail: { out: 'packages/csharp-mail', name: 'TurboSMTP.Mail.Generated' },
    unified: { out: 'packages/csharp', name: 'TurboSMTP.Generated' },
  },
  go: {
    config: 'config/go.yaml',
    mail: { out: 'packages/go-mail/generated' },
    unified: { out: 'packages/go/generated' },
  },
  php: {
    config: 'config/php.yaml',
    mail: { out: 'packages/php-mail' },
    unified: { out: 'packages/php' },
  },
};

// Which API package a domain's Layer 1 belongs to.
const packageFor = (domain) => (domain === MAIL ? MAIL : UNIFIED);

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

/** Run a command string via the shell (cross-platform npx resolution), cwd = sdk-integrations/.
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
    console.log('\n▶ overlay\n  none in api-integrations/overlays/ — using the synced spec as-is');
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

  // 3. Generate each language from the filtered, domain-scoped spec, into the API package the
  //    domain belongs to. --out-root keys on package as well as language, or two domains would
  //    overwrite each other in a dry run.
  const pkg = packageFor(domain);
  for (const l of langs) {
    const target = LANGS[l][pkg];
    const outDir = args['out-root']
      ? join(resolve(String(args['out-root'])), l, pkg)
      : join(SDK_ROOT, target.out);
    // The published name is a per-run value, not a second config file: one config per language
    // stays domain-agnostic, and the CLI property overrides the config's default.
    const nameOverride =
      LANGS[l].nameProp && target.name ? ` --additional-properties=${LANGS[l].nameProp}=${target.name}` : '';
    run(
      `generate ${l} (${domain} → ${pkg} package)`,
      `npx --yes @openapitools/openapi-generator-cli --openapitools "${GENERATOR_CONFIG}" generate ` +
        `-i "${filtered}" -c "${join(SDK_ROOT, LANGS[l].config)}" -o "${outDir}"${nameOverride}`,
    );
  }

  console.log(`\n✔ Done — domain "${domain}" → ${pkg} package, languages: ${langs.join(', ')}.`);
}

main();
