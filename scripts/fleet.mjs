#!/usr/bin/env node
/**
 * The fleet roster and its model tiers.
 *
 *   node scripts/fleet.mjs            # show the roster and the current child model
 *   node scripts/fleet.mjs design     # children run on the design tier
 *   node scripts/fleet.mjs code       # children run on the code tier
 *
 * Why a switch and not a mapping: Hermes pins ALL delegated children to
 * `delegation.model`; there is no per-task model in `delegate_task`. So tiers
 * are per BATCH. Parallel mixed models would need the community
 * `delegation-model-map` plugin (model_map backend), which is deliberately not
 * installed — ask the owner before adding it.
 */

import { execSync } from 'node:child_process';

const TIERS = {
  code: { model: 'deepseek-v4.1-flash', why: 'cheap, fast, good enough for edits and audits' },
  design: { model: 'gpt-6-luna', why: 'taste, hierarchy, UX critique' },
};

const ROLE_TIER = {
  Orchestrator: 'parent',
  Builder: 'code',
  Auditor: 'code',
  Reviewer: 'code',
  Researcher: 'code',
  Designer: 'design',
};

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const arg = (process.argv[2] ?? 'status').toLowerCase();

if (arg in TIERS) {
  run(`hermes config set delegation.model ${TIERS[arg].model}`);
  console.log(`children now run on the ${arg} tier: ${TIERS[arg].model} — ${TIERS[arg].why}`);
} else if (arg !== 'status') {
  console.error(`unknown tier "${arg}" — use: status | ${Object.keys(TIERS).join(' | ')}`);
  process.exit(1);
}

const current = run('hermes config get delegation.model') || '(inherits parent)';
const parent = run('hermes config get model.default') || '(unknown)';

const rows = Object.entries(ROLE_TIER).map(([role, tier]) => {
  if (tier === 'parent') return [role, 'main session', parent];
  const model = TIERS[tier].model;
  const active = model === current ? 'now' : 'when active';
  return [role, tier, `${model}  (${active})`];
});

const width = (i) => Math.max(...rows.map((r) => r[i].length), 12);
const pad = (s, n) => s.padEnd(n);

console.log('');
console.log('portfolio fleet');
console.log('─'.repeat(74));
console.log(`${pad('agent', width(0))}  ${pad('tier', width(1))}  model`);
console.log('─'.repeat(74));
for (const [role, tier, model] of rows) console.log(`${pad(role, width(0))}  ${pad(tier, width(1))}  ${model}`);
console.log('─'.repeat(74));
console.log(`children currently resolve to: ${current}`);
console.log(`max parallel children: 4 (cap in docs/orchestration.md; runtime default 10)`);
console.log('');
console.log('Reminder: tiers are per batch. Design and code batches run one after');
console.log('another, not side by side, unless the model_map plugin is installed.');
