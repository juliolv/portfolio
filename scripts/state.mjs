#!/usr/bin/env node
/**
 * Prints the project handoff state and checks it is still well-formed.
 *
 *   node scripts/state.mjs           # summary + warnings
 *   node scripts/state.mjs --check   # exit 1 if the contract is broken
 *
 * The point is that a session cannot end "successfully" with a stale or
 * malformed handoff: whoever picks this up next gets the truth or an error.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const PATH = 'docs/state.md';
const REQUIRED_SECTIONS = [
  '## Snapshot',
  '## Milestone',
  '## Next actions',
  '## Decisions',
  '## Known issues',
  '## Verification',
  '## Handoff ritual',
];
const REQUIRED_KEYS = ['updated', 'milestone', 'next_action'];

const check = process.argv.includes('--check');
const problems = [];

if (!existsSync(PATH)) {
  console.error(`state: ${PATH} is missing. Every session must keep a handoff file.`);
  process.exit(1);
}

const raw = readFileSync(PATH, 'utf8');

/* --- frontmatter --- */
const meta = {};
const fm = raw.match(/^---\n([\s\S]*?)\n---/);
if (fm) {
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
} else {
  problems.push('no YAML frontmatter');
}

for (const key of REQUIRED_KEYS) {
  if (!meta[key]) problems.push(`frontmatter is missing "${key}"`);
}

/* --- sections --- */
const body = raw.replace(/^---\n[\s\S]*?\n---/, '');
for (const section of REQUIRED_SECTIONS) {
  if (!body.includes(section)) problems.push(`missing section "${section}"`);
}

/* --- git context --- */
const git = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const head = git('git log -1 --format="%h %s"');
const dirty = git('git status --porcelain');
const lastSrcCommit = git('git log -1 --format=%cs -- src/ scripts/ docs/');

/* --- staleness: state file older than the last source change --- */
if (meta.updated && lastSrcCommit && meta.updated < lastSrcCommit) {
  problems.push(
    `state says updated ${meta.updated}, but src/ changed on ${lastSrcCommit} — the handoff is stale`
  );
}

const issueRows = (body.match(/^\|\s*\d+\s*\|/gm) ?? []).length;

console.log('portfolio · handoff state');
console.log('─'.repeat(46));
console.log(`updated      ${meta.updated ?? '?'}`);
console.log(`milestone    ${meta.milestone ?? '?'}`);
console.log(`next action  ${meta.next_action ?? '?'}`);
console.log(`open issues  ${issueRows}`);
console.log(`HEAD         ${head || '(not a git repo)'}`);
console.log(`working tree ${dirty ? 'dirty — commit or stash before handing off' : 'clean'}`);
console.log('─'.repeat(46));

if (problems.length) {
  console.error('state problems:');
  for (const p of problems) console.error(`  ✕ ${p}`);
  if (check) process.exit(1);
  console.error('(run with --check to fail the build)');
} else {
  console.log('handoff file is well-formed.');
}

if (!check && dirty) {
  console.log('\nRemember: update docs/state.md, commit, push before you stop.');
}
