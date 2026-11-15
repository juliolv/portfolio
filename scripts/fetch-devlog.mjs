#!/usr/bin/env node
/**
 * Pull the devlog's state from GitHub, at build time.
 *
 *   node scripts/fetch-devlog.mjs           # refresh src/data/devlog-live.json
 *   node scripts/fetch-devlog.mjs --check   # exit 1 if the file is stale
 *
 * The site must never depend on GitHub being reachable: if the API fails, times
 * out or there is no token, this exits 0 with a warning and whatever file is
 * already on disk stands. A build that quietly ships last week's state is better
 * than a build that fails, and both are better than fabricated state.
 *
 * What comes from GitHub: the issue's state (open/closed) and its title. What does
 * not: the Spanish copy, the note, the phase and the date of the *work*. Those live
 * in src/data/devlog.json, keyed by issue number, because an issue cannot know when
 * the thing it records was written.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const REPO = process.env.GITHUB_REPOSITORY || 'juliolv/portfolio';
const LABEL = 'devlog';
const OUT = new URL('../src/data/devlog-live.json', import.meta.url);
const CHECK = process.argv.includes('--check');

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

function previous() {
  if (!existsSync(OUT)) return { issues: [], syncedAt: null };
  try {
    return JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {
    return { issues: [], syncedAt: null };
  }
}

const before = previous();
const t = token();

if (!t) {
  console.warn(`[devlog] no token — keeping ${before.issues.length} issue(s) from ${before.syncedAt ?? 'the last sync'}`);
  process.exit(0);
}

const url = `https://api.github.com/repos/${REPO}/issues?labels=${LABEL}&state=all&per_page=100`;

let issues;
try {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'juliolv-portfolio-build',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();
  // Pull requests are issues too, and a PR is not a devlog entry.
  issues = json
    .filter((i) => !i.pull_request)
    .map((i) => ({ number: i.number, title: i.title, state: i.state }))
    .sort((a, b) => a.number - b.number);
} catch (error) {
  console.warn(`[devlog] GitHub unreachable (${error.message}) — keeping ${before.issues.length} issue(s) from ${before.syncedAt ?? 'the last sync'}`);
  process.exit(0);
}

const next = { syncedAt: new Date().toISOString(), repo: REPO, issues };
const same = JSON.stringify(before.issues) === JSON.stringify(next.issues);

if (CHECK) {
  if (!same) {
    console.error(`[devlog] stale — ${issues.length} issue(s) on GitHub, ${before.issues.length} on disk`);
    process.exit(1);
  }
  console.log(`[devlog] up to date — ${issues.length} issue(s)`);
  process.exit(0);
}

writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
console.log(
  `[devlog] ${issues.length} issue(s) from ${REPO}${same ? ' (unchanged)' : ''} — ` +
    `${issues.filter((i) => i.state === 'closed').length} closed, ${issues.filter((i) => i.state === 'open').length} open`
);
