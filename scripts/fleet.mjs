#!/usr/bin/env node
/**
 * Fleet roster and per-role model tiers.
 *
 *   node scripts/fleet.mjs            # roster + what children resolve to now
 *   node scripts/fleet.mjs build      # switch children to the Builder model
 *   node scripts/fleet.mjs audit      # ... Auditor model
 *   node scripts/fleet.mjs review     # ... Reviewer model
 *   node scripts/fleet.mjs design     # ... Designer model
 *
 * Why a switch and not a mapping: Hermes pins ALL delegated children to
 * `delegation.model`; there is no per-task model in `delegate_task`. The
 * pipeline is sequential (build -> audit -> review), so one role per batch
 * gives each agent its own model without the community model_map plugin.
 */

import { execSync } from 'node:child_process';

const ROLES = {
  build: {
    agent: 'Builder',
    model: 'deepseek-v4.1-flash',
    why: 'cheap, fast, writes the slice',
    writes: 'its own files only',
  },
  audit: {
    agent: 'Auditor',
    model: 'qwen3.8-flash',
    why: 'different family from the Builder and Reviewer, so it fails differently',
    writes: 'no — read-only',
  },
  review: {
    agent: 'Reviewer',
    model: 'glm-5.3-flash',
    why: 'owner-mandated reviewer model',
    writes: 'no — read-only',
  },
  design: {
    agent: 'Designer',
    model: 'gpt-6-luna',
    why: 'taste, hierarchy and UX critique',
    writes: 'no — read-only',
  },
};

const PARENT = 'deepseek-v4.1-flash';
const ALIAS = { code: 'build' };

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const arg = (process.argv[2] ?? 'status').toLowerCase();
const role = ALIAS[arg] ?? arg;

if (role in ROLES) {
  run(`hermes config set delegation.model ${ROLES[role].model}`);
  console.log(`children now resolve to the ${role} tier: ${ROLES[role].model}`);
  console.log(`(${ROLES[role].agent}; ${ROLES[role].why})`);
} else if (arg !== 'status') {
  console.error(`unknown role "${arg}" — use: status | ${Object.keys(ROLES).join(' | ')}`);
  process.exit(1);
}

const current = run('hermes config get delegation.model') || '(inherits parent)';
const parentModel = run('hermes config get model.default') || PARENT;

const pad = (s, n) => String(s).padEnd(n);
const rows = Object.entries(ROLES).map(([key, r]) => ({
  key,
  ...r,
  active: r.model === current,
}));

const w = (f) => Math.max(...rows.map((r) => String(f(r)).length), 12);

console.log('');
console.log('portfolio fleet — per-role model tiers');
console.log('─'.repeat(88));
console.log(`${pad('batch', w((r) => r.key))}  ${pad('agent', w((r) => r.agent))}  ${pad('model', w((r) => r.model))}  writes`);
console.log('─'.repeat(88));
for (const r of rows) {
  const mark = r.active ? ' ← active' : '';
  console.log(`${pad(r.key, w((x) => x.key))}  ${pad(r.agent, w((x) => x.agent))}  ${pad(r.model, w((x) => x.model))}  ${r.writes}${mark}`);
}
console.log('─'.repeat(88));
console.log(`orchestrator (this session): ${parentModel}`);
console.log(`children resolve to:        ${current}`);
console.log('max parallel children:     4');
console.log('');
console.log('Run one role per batch: build -> audit -> review. Design is its own batch.');
console.log('The orchestrator implements; no child ever ships.');
