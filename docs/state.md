---
updated: 2026-11-13
milestone: 2 — case studies and live devlog
next_action: add /work/[slug] case-study routes
owner: julio
---

# Project state

Read this file before doing anything in this repo. It is the handoff contract
between sessions, between the orchestrator and its fleet, and between you and
the future you who forgot why a decision was made.

Update it at the **end** of every work session, and again when a milestone
closes. `pnpm state` prints it and fails if a required section is missing.

## Snapshot

| | |
|---|---|
| Repo | https://github.com/juliolv/portfolio (public, history is permanent) |
| Live | https://juliolv.github.io/portfolio/ — deploys on every push to `main` |
| Host | GitHub Pages, project subpath `/portfolio` (NOT Vercel) |
| Stack | Astro 7 static, hand-authored CSS, ~10 KB vanilla TS, no UI framework |
| Languages | EN / ES rendered at build time, toggled with CSS |
| Build | `pnpm build` → `dist/` (3 pages: `/`, `/design-system/`, `404.html`) |
| Verified | 2026-11-13: live 200s, zero failed resources, reduced-motion + palette keyboard paths pass |

## Milestone

**Done:** design-system port, motion/interaction handoff, GitHub Pages deploy.
**Now:** case-study routes and a devlog that mirrors real GitHub issues.
**Then:** real content (blocked on the owner), then launch polish.

## Next actions

1. `/work/[slug]` case-study routes — the content collection already carries
   `order`, `slug` and bilingual frontmatter; this is one route file plus
   making the cards links.
2. Devlog from live issues: build-time fetch, `GITHUB_TOKEN` in CI, cached
   JSON, fall back to `src/data/devlog.json` when the API fails.
3. Open issues #1–#4 so the devlog has something to mirror (owner approval).
4. Replace placeholder content — **needs the owner**: city, contact email, CV
   PDF, one metric per project.

## Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-11-13 | Astro over Next.js | Static content, GitHub Pages, near-zero JS; Next would ship ~100 KB to reproduce CSS motion |
| 2026-11-13 | No Tailwind | The design is token-first CSS already; Tailwind would re-encode 62 tokens |
| 2026-11-13 | Bilingual pairs + CSS toggle | No reload, no layout shift, no per-language re-render |
| 2026-11-13 | `/design-system/` is a route, not a JS view | Real URL, indexable, works without JS (deviation from handoff §7, documented in client.ts) |
| 2026-11-13 | Boot steps each run in a guard | One throwing step used to kill scroll tracking and nav handlers |
| 2026-11-13 | Placeholder content only | Public repo; real employers/projects must never enter history |

## Known issues

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | major | No sitemap.xml, robots.txt, canonical, og:*/twitter:* tags | add `@astrojs/sitemap`, static robots, OG image |
| 2 | major | `SITE.links.cv` points at `/portfolio/cv.pdf`, which does not exist | ship the PDF or hide the button until it exists |
| 3 | minor | `.tabs` shows scrollbar stepper arrows in headless Chrome when it overflows | cosmetic; only reproducible with overlay scrollbars disabled |
| 4 | minor | Every work/experience record is a marked placeholder | content debt, tracked by issue #3 |
| 5 | info | Free/cheap model tiers on the sub are unbenchmarked for code edits | benchmark before routing writers to them |

## Verification

```sh
pnpm build                                  # 3 pages, no errors
pnpm exec astro check                        # 0 errors (needs typescript@6, not 7)
node scripts/guard-secrets.mjs --all         # privacy gate on tracked files
node scripts/state.mjs                       # this file is well-formed
# Subpath check (Pages serves /portfolio/): copy dist into a /portfolio folder
# and serve the parent before trusting a local pass.
```

## Environment

- Node 24.15, pnpm 11.17, WSL at `/home/julio`
- Model provider: `opencode-go` (`https://opencode.ai/zen/go/v1`), 30 models
- Astro 7.4.11 · Framer Motion is NOT used · TypeScript 6 for `astro check`
- Commit identity is a GitHub noreply address; never change it in this repo

## Handoff ritual

1. `pnpm state` — read the snapshot, milestone and next action.
2. `git log --oneline -5` and `git status` — trust the repo over this file.
3. Pick the first item under **Next actions** that is not blocked.
4. If you fan out, follow `docs/orchestration.md`.
5. Before you stop: update this file (milestone, next action, new decisions,
   new issues), commit, push. A session that ends without updating this file
   is an unfinished session.
