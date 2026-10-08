#!/usr/bin/env node
/**
 * TurboSMTP — spec-drift guard.
 *
 * One check, runnable offline:
 *
 *   SYNC INTEGRITY — the synced copy still matches the checksum recorded when it was
 *   synced. Catches a hand-edit to api-integrations/upstream/turbo-smtp.yaml — a synced
 *   copy that is never hand-edited — which nothing else detects.
 *
 * WHAT THIS IS AND IS NOT. The checksum lives beside the file it describes, so anyone
 * editing both passes. It is a tripwire against an accidental in-place edit — the realistic
 * failure, especially from an agent "fixing" the spec where it sits — not a control against
 * someone who means to bypass it. Its second job is making the sync auditable: a spec change
 * that did not come from a sync shows up in review as a spec diff with no checksum change,
 * or a checksum change with no sync commit. Comparing against the canonical repository is
 * the stronger check and is not possible from a GitHub-hosted runner, because the canonical
 * repository is self-hosted and unreachable from one. That variant remains a follow-up.
 *
 * Pure Node: no subprocess, no network, no npx. The spec is read and hashed, nothing else.
 *
 * Usage:
 *   node sdk-integrations/scripts/check-spec.mjs                  # verify (what CI runs)
 *   node sdk-integrations/scripts/check-spec.mjs --write-checksum # record after syncing the spec
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SDK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(SDK_ROOT, '..');

const SPEC = join(REPO_ROOT, 'api-integrations', 'upstream', 'turbo-smtp.yaml');
const CHECKSUM = join(REPO_ROOT, 'api-integrations', 'upstream', 'turbo-smtp.sha256');

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

// ── Sync integrity ──────────────────────────────────────────────────────────────────────

function writeChecksum() {
  const digest = sha256(SPEC);
  writeFileSync(CHECKSUM, `${digest}  turbo-smtp.yaml\n`);
  console.log(`✔ Recorded ${digest}\n  → ${CHECKSUM}`);
}

function checkChecksum() {
  if (!existsSync(CHECKSUM)) {
    fail(
      `No checksum at api-integrations/upstream/turbo-smtp.sha256.\n` +
        `  If you have just synced the spec, record it:\n` +
        `      node sdk-integrations/scripts/check-spec.mjs --write-checksum`,
    );
  }
  const recorded = readFileSync(CHECKSUM, 'utf8').trim().split(/\s+/)[0];
  const actual = sha256(SPEC);
  if (recorded !== actual) {
    fail(
      `The synced spec does not match its recorded checksum.\n` +
        `      recorded: ${recorded}\n` +
        `      actual:   ${actual}\n\n` +
        `  api-integrations/upstream/turbo-smtp.yaml is a synced copy and is never hand-edited.\n` +
        `  Either:\n` +
        `    - the spec was edited in place — revert it and make the change upstream in\n` +
        `      turbo-smtp-openapi, then re-sync; or\n` +
        `    - you have just re-synced legitimately — re-record the checksum:\n` +
        `          node sdk-integrations/scripts/check-spec.mjs --write-checksum\n\n` +
        `  This holds whether the goal was to change the API contract or only to change what\n` +
        `  the generator produces. There is no local route: both are specification corrections\n` +
        `  raised upstream in turbo-smtp-openapi and brought back by a sync.`,
    );
  }
  console.log(`✔ Sync integrity — spec matches its recorded checksum (${actual.slice(0, 12)}…)`);
}

// ── Entry point ─────────────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(SPEC)) fail(`No spec at ${SPEC}`);

  if (process.argv.includes('--write-checksum')) {
    writeChecksum();
    return;
  }

  checkChecksum();
  console.log('\n✔ Spec-drift guard passed.');
}

main();
