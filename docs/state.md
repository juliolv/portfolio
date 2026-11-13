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
| Repo About | homepage set to the live URL, description, 6 topics (astro, portfolio, design-system, i18n, github-pages, accessibility) |
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

1. `/work/[slug]` case-study routes — **in flight** (Builder batch: route page,
   card links, generated sitemap; then audit and review batches).
2. Devlog from live issues: build-time fetch, `GITHUB_TOKEN` in CI, cached
   JSON, fall back to `src/data/devlog.json` when the API fails.
3. Open issues #1–#4 so the devlog has something to mirror (owner approval).
4. Design pass on hero density and affordances (Designer agent, one batch).
5. Replace placeholder content — **needs the owner**: city, contact email, CV
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
| 2026-11-13 | No free models in the fleet | Owner ruled them out: predictable quality beats marginal savings |
| 2026-11-13 | Per-role model tiers | `delegation.model` is global: one role per batch (build → audit → review). Builder `deepseek-v4.1-flash`, Auditor `qwen3.8-flash`, Reviewer **`glm-5.3-flash`** (mandated), Designer `gpt-6-luna` |

## Known issues

Triaged from the first audit fleet (2026-11-13). Fixed items are gone from this
table; they live in the git log.

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | major | ~20 `s('en', …)` call sites bypass `Bi`, so the design-system page, hero `cardMeta`/kv keys, tab labels and 404 buttons stay English under `data-lang="es"` | wrap each in `Bi` (mechanical; one Builder batch) |
| 2 | major | Palette: group headings are `role="presentation"` (grouping invisible to AT), no live region announcing filter results, no `inert`/scroll lock behind the dialog | `role="group"` + label, `aria-live` counter, `main.inert` + `html { overflow: hidden }` |
| 3 | minor | Tabpanels lack `tabindex="0"`; motion-demo buttons misuse `aria-pressed`; decorative `›` glyphs not `aria-hidden`; palette trigger's accessible name does not start with its visible "Ctrl K" | APG fixes, one pass |
| 4 | minor | `#ds-components` link targets a heading inside the hidden components tabpanel, so the anchor never scrolls | make the link activate the tab instead |
| 5 | major | Contact email and LinkedIn are literal placeholders; `cv.pdf` does not exist | blocked on the owner's real data and CV |
| 6 | info | Cheap paid tiers beyond `deepseek-v4.1-flash` are unbenchmarked for code edits (free tiers ruled out) | benchmark before routing writers to them |

Fixed this session: skip-link target (focus lands on `main#top`), Spanish
`aria-label`s on nav/brand/theme/language/skip, palette focus ring
(`.palette__field:focus-within` → accent), `aria-expanded` true/false lifecycle,
canonical + OG/Twitter + 1200×630 `og.png`, `robots.txt`, `sitemap.xml`, ES
counterparts for experience `when`/`org` and work `period` (schema now requires
them), single live region in the status bar, palette CV command now base-prefixed.

## Design backlog

Review by the **Designer** agent (`gpt-6-luna`, 11 calls, 151s — this run also
proved the design tier resolves for delegation). Dispositions are the
orchestrator's call; taste belongs to the owner.

| Finding | Disposition |
|---|---|
| Hero lacks a proof line; "10+ years" is buried in the summary card | **defer** — strongest suggestion, but it reorders the owner's designed hierarchy and needs real numbers |
| Work section padding 72→48px, card gaps 16→12px | **defer** — `--sp-8` is the site-wide section rhythm; revisit once real copy replaces the placeholder rows and cards get shorter naturally |
| Cards lift on hover but contain no link | **fixed** — `.card:hover:not(:has(a))` neutralises the lift/shadow until `/work/[slug]` exists, and restores it automatically when a card gains a link |
| Faux command lines and 28px status bar read as control, not content | **rejected as intent** — the terminal metaphor is the identity, and the same review credits the paths with wayfinding |
| Section headings and card titles both `--fs-5` | **fixed** — card titles now `--fs-4` (17px vs 22px, verified in the browser) |

Both fixes live in `src/styles/app.css`; `design.css` stays the untouched
reference implementation.

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
