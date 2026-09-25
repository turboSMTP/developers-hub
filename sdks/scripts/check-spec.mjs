#!/usr/bin/env node
/**
 * TurboSMTP — spec-drift guard.
 *
 * Two independent checks, both runnable offline:
 *
 *   1. SYNC INTEGRITY — the synced copy still matches the checksum recorded when it was
 *      synced. Catches a hand-edit to api-reference/upstream/turbo-smtp.yaml — a synced
 *      copy that is never hand-edited — which nothing else detects.
 *
 *   2. OVERLAY BOUNDARY — every overlay in api-reference/overlays/ changes only what
 *      the boundary permits: operationIds, naming, documentation and `x-` extensions. Never
 *      wire semantics. Enforced by bundling the spec twice — once bare, once overlaid —
 *      and rejecting any difference outside the allowlist below.
 *
 * Both bundles go through the same pinned redocly, so normalization cancels out and the
 * diff is exactly the overlays' effect. Redocly emits JSON when the output file says
 * `.json`, which is why no YAML parser is needed here.
 *
 * WHAT CHECK 1 IS AND IS NOT. The checksum lives beside the file it describes, so anyone
 * editing both passes. It is a tripwire against an accidental in-place edit — the realistic
 * failure, especially from an agent "fixing" the spec where it sits — not a control against
 * someone who means to bypass it. Its second job is making the sync auditable: a spec change
 * that did not come from a sync shows up in review as a spec diff with no checksum change,
 * or a checksum change with no sync commit. Comparing against the canonical repository is
 * the stronger check and is not possible from a GitHub-hosted runner, because the canonical
 * repository is self-hosted and unreachable from one. That variant remains a follow-up.
 *
 * Usage:
 *   node sdks/scripts/check-spec.mjs                  # verify (what CI runs)
 *   node sdks/scripts/check-spec.mjs --write-checksum # record after syncing the spec
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(SDK_ROOT, '..');
const BUILD_DIR = join(SDK_ROOT, 'build');

/** Kept in step with generate.mjs — both feed the same pipeline. */
const REDOCLY = '@redocly/cli@2.47.0';
const OVERLAY_TOOL = 'openapi-format@1.33.7';

const SPEC = join(REPO_ROOT, 'api-reference', 'upstream', 'turbo-smtp.yaml');
const CHECKSUM = join(REPO_ROOT, 'api-reference', 'upstream', 'turbo-smtp.sha256');
const OVERLAY_DIR = join(REPO_ROOT, 'api-reference', 'overlays');

/**
 * Keys an overlay may change. Everything else is wire semantics by default: the list is an
 * allowlist precisely so that a field nobody thought about fails closed.
 *
 * `tags` is here because generate.mjs filters domains by tag, so retagging decides which SDK
 * an operation lands in — a generation concern. It does not alter the operation itself.
 */
const MUTABLE_KEYS = new Set(['operationId', 'summary', 'description', 'tags']);

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function run(label, cmd) {
  const r = spawnSync(cmd, { cwd: SDK_ROOT, shell: true, stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stdout ?? '');
    console.error(r.stderr ?? '');
    fail(`${label} failed (exit ${r.status ?? r.signal}).`);
  }
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function listOverlays() {
  if (!existsSync(OVERLAY_DIR)) return [];
  return readdirSync(OVERLAY_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort()
    .map((f) => join(OVERLAY_DIR, f));
}

// ── 1. Sync integrity ───────────────────────────────────────────────────────────────────

function writeChecksum() {
  const digest = sha256(SPEC);
  writeFileSync(CHECKSUM, `${digest}  turbo-smtp.yaml\n`);
  console.log(`✔ Recorded ${digest}\n  → ${CHECKSUM}`);
}

function checkChecksum() {
  if (!existsSync(CHECKSUM)) {
    fail(
      `No checksum at api-reference/upstream/turbo-smtp.sha256.\n` +
        `  If you have just synced the spec, record it:\n` +
        `      node sdks/scripts/check-spec.mjs --write-checksum`,
    );
  }
  const recorded = readFileSync(CHECKSUM, 'utf8').trim().split(/\s+/)[0];
  const actual = sha256(SPEC);
  if (recorded !== actual) {
    fail(
      `The synced spec does not match its recorded checksum.\n` +
        `      recorded: ${recorded}\n` +
        `      actual:   ${actual}\n\n` +
        `  api-reference/upstream/turbo-smtp.yaml is a synced copy and is never hand-edited.\n` +
        `  Either:\n` +
        `    - the spec was edited in place — revert it and make the change upstream in\n` +
        `      turbo-smtp-openapi, then re-sync; or\n` +
        `    - you have just re-synced legitimately — re-record the checksum:\n` +
        `          node sdks/scripts/check-spec.mjs --write-checksum\n\n` +
        `  If the goal was to change generated SDK code rather than the API contract, an\n` +
        `  overlay in api-reference/overlays/ is the sanctioned route.`,
    );
  }
  console.log(`✔ Sync integrity — spec matches its recorded checksum (${actual.slice(0, 12)}…)`);
}

// ── 2. Overlay boundary ─────────────────────────────────────────────────────────────────

/** The last segment of a path that names a key rather than an array index. */
function leafKey(path) {
  for (let i = path.length - 1; i >= 0; i--) {
    if (!/^\d+$/.test(path[i])) return { key: path[i], index: i };
  }
  return { key: undefined, index: -1 };
}

function isAllowed(path) {
  // Anything inside an `x-` extension subtree is fair game.
  if (path.some((segment) => segment.startsWith('x-'))) return true;

  const { key, index } = leafKey(path);
  if (key === undefined || !MUTABLE_KEYS.has(key)) return false;

  // A schema property may legitimately be *named* `description` or `tags`; that is part of
  // the payload shape, not documentation. Anything directly under `properties` is a field
  // name, so the allowlist must not apply to it.
  if (index > 0 && path[index - 1] === 'properties') return false;

  return true;
}

function isObject(v) {
  return v !== null && typeof v === 'object';
}

/** Every path at which `before` and `after` differ, as {path, kind}. */
function diff(before, after, path = [], out = []) {
  if (before === after) return out;

  if (!isObject(before) || !isObject(after) || Array.isArray(before) !== Array.isArray(after)) {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      out.push({ path, kind: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed' });
    }
    return out;
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const a = before[key];
    const b = after[key];
    if (a === undefined) out.push({ path: [...path, key], kind: 'added' });
    else if (b === undefined) out.push({ path: [...path, key], kind: 'removed' });
    else diff(a, b, [...path, key], out);
  }
  return out;
}

function checkOverlays() {
  const overlays = listOverlays();

  if (overlays.length === 0) {
    console.log('✔ Overlay boundary — no overlays present, nothing to check');
    return;
  }

  // Format gate: an OpenAPI fragment dropped in here would be applied as nothing at all.
  for (const overlay of overlays) {
    const text = readFileSync(overlay, 'utf8');
    if (!/^overlay:\s*['"]?1\.0\.0['"]?\s*$/m.test(text)) {
      fail(
        `${overlay} does not declare \`overlay: 1.0.0\`.\n` +
          `  api-reference/overlays/ holds OpenAPI Overlay documents only.`,
      );
    }
  }

  mkdirSync(BUILD_DIR, { recursive: true });
  const bare = join(BUILD_DIR, '_guard-upstream.json');
  const overlaid = join(BUILD_DIR, '_guard-overlaid.json');

  run('bundle upstream', `npx --yes ${REDOCLY} bundle "${SPEC}" -o "${bare}"`);

  let input = SPEC;
  overlays.forEach((overlay, i) => {
    const output = join(BUILD_DIR, `_guard-overlay-${i}.yaml`);
    run(
      `apply ${overlay}`,
      `npx --yes ${OVERLAY_TOOL} "${input}" -o "${output}" --overlayFile "${overlay}" --no-sort`,
    );
    input = output;
  });
  run('bundle overlaid', `npx --yes ${REDOCLY} bundle "${input}" -o "${overlaid}"`);

  const changes = diff(JSON.parse(readFileSync(bare, 'utf8')), JSON.parse(readFileSync(overlaid, 'utf8')));

  if (changes.length === 0) {
    fail(
      `${overlays.length} overlay(s) present, but they change nothing.\n` +
        `  An overlay that has no effect is dead — its target probably no longer matches, which\n` +
        `  means the defect it compensated for is silently back. Fix the target or delete the file\n` +
        `  An overlay is deleted when the upstream issue it compensates for closes.`,
    );
  }

  const violations = changes.filter((c) => !isAllowed(c.path));
  if (violations.length > 0) {
    const shown = violations.slice(0, 20).map((v) => `      ${v.kind.padEnd(7)} ${v.path.join('.')}`);
    fail(
      `An overlay changes wire semantics, which is prohibited.\n\n` +
        `  Overlays may change operationIds, naming, documentation and \`x-\` extensions only.\n` +
        `  These ${violations.length} change(s) are outside that boundary:\n\n` +
        `${shown.join('\n')}` +
        `${violations.length > 20 ? `\n      … and ${violations.length - 20} more` : ''}\n\n` +
        `  If the specification is wrong about what the API does, that is a specification\n` +
        `  correction to raise upstream in turbo-smtp-openapi — it is never absorbed locally.`,
    );
  }

  console.log(
    `✔ Overlay boundary — ${overlays.length} overlay(s), ${changes.length} change(s), all within the boundary`,
  );
}

// ── Entry point ─────────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(SPEC)) fail(`No spec at ${SPEC}`);

  if (process.argv.includes('--write-checksum')) {
    writeChecksum();
    return;
  }

  checkChecksum();
  checkOverlays();
  console.log('\n✔ Spec-drift guard passed.');
}

main();
