#!/usr/bin/env node
/**
 * Privacy + secret guard for a public repo.
 *
 * Two jobs:
 *   1. Fail if a real-world term (employer, university, personal email) from the
 *      local denylist appears in a file that is about to be published.
 *   2. Fail on credential-shaped strings (keys, tokens, private keys) and
 *      personal email addresses.
 *
 * The denylist lives in .guard/denylist.txt and is gitignored, because a
 * denylist of real employers would itself be the leak.
 *
 * Usage:
 *   node scripts/guard-secrets.mjs          # staged files (run by pre-commit)
 *   node scripts/guard-secrets.mjs --all    # every tracked file
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

/* Addresses that are published on purpose. The owner's contact address is on the
   site, in the README's own links and in his CV; warning about it on every commit
   would train everyone to ignore the warning. */
const ALLOWED_EMAIL =
  /@(users\.noreply\.github\.com|example\.(com|org|net)|localhost)$/i;
const PUBLISHED_EMAILS = [/^julio\.lv7@gmail\.com$/i];
const MAX_BYTES = 2_000_000;

const SECRET_RULES = [
  ['private-key', /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{20,}/],
  ['openai-key', /\bsk-(?!ant-)[A-Za-z0-9_-]{20,}/],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['stripe-live-key', /\bsk_live_[A-Za-z0-9]{10,}/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['generic-secret', /\b(?:api[_-]?key|secret|password|passwd|client[_-]?secret|access[_-]?token)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/i],
];

// Warning-only: noisy enough that it must not block a commit.
const WARN_RULES = [
  ['personal-email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g],
  ['phone-number', /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g],
];

const redact = (s) => (s.length <= 6 ? '***' : `${s.slice(0, 4)}…${s.slice(-2)}`);

function targetFiles() {
  if (process.argv.includes('--all')) {
    return execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
  }
  return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

const errors = [];
const warnings = [];

const denyPath = '.guard/denylist.txt';
const denyTerms = existsSync(denyPath)
  ? readFileSync(denyPath, 'utf8')
      .split('\n')
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith('#'))
  : [];

if (!denyTerms.length) {
  console.warn('[guard] No .guard/denylist.txt found — only credential patterns were checked.');
}

const files = targetFiles();
if (!files.length) {
  console.log('[guard] Nothing staged.');
  process.exit(0);
}

for (const file of files) {
  if (!existsSync(file)) continue;
  let buf;
  try {
    buf = readFileSync(file);
  } catch {
    continue;
  }
  if (buf.length > MAX_BYTES || buf.includes(0)) continue; // binary or huge: skip
  const text = buf.toString('utf8');
  const lines = text.split('\n');

  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`;

    for (const term of denyTerms) {
      if (line.toLowerCase().includes(term)) {
        errors.push(`${at}  real-data term matched: "${term}"`);
      }
    }

    for (const [rule, re] of SECRET_RULES) {
      re.lastIndex = 0;
      const m = line.match(re);
      if (m) errors.push(`${at}  ${rule}: ${redact(m[0])}`);
    }

    for (const [rule, re] of WARN_RULES) {
      re.lastIndex = 0;
      for (const m of line.matchAll(re)) {
        if (rule === 'personal-email' && (ALLOWED_EMAIL.test(m[0]) || PUBLISHED_EMAILS.some((re) => re.test(m[0])))) continue;
        if (rule === 'phone-number' && !/[+]/.test(m[0])) continue;
        warnings.push(`${at}  ${rule}: ${redact(m[0])}`);
      }
    }
  });
}

// Commits carry the author address forever; keep the personal one out of history.
try {
  const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
  if (email && !ALLOWED_EMAIL.test(email)) {
    errors.push(
      `git identity: user.email is "${email}" — use your GitHub noreply address ` +
        `(git config user.email "<id>+<user>@users.noreply.github.com")`
    );
  }
} catch {
  /* no identity configured yet */
}

for (const w of warnings.slice(0, 15)) console.warn(`[guard] warn  ${w}`);
if (warnings.length > 15) console.warn(`[guard] warn  …and ${warnings.length - 15} more`);

if (errors.length) {
  console.error('\n[guard] BLOCKED — these would be published:');
  for (const e of errors) console.error(`  ✕ ${e}`);
  console.error(
    '\nFix the content to use placeholders, or stage only what is safe.\n' +
      'Bypass is deliberate and recorded: git commit --no-verify\n'
  );
  process.exit(1);
}

console.log(`[guard] ok — ${files.length} file(s) clean.`);
