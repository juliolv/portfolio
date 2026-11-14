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

**Done:** design-system port, motion/interaction handoff, GitHub Pages deploy,
/work/[slug] case studies with linked cards, a generated sitemap and
per-language markdown bodies.
**Now:** the v2 TUI rewrite, on branch `feat/tui-v2` (main stays live until the
handoff's §9 checklist passes). Case-study routes removed from both branches. Handoff: `docs/design/v2/portfolio-tui-handoff/`.
After that: the devlog mirroring real GitHub issues.
**Then:** real content (blocked on the owner), then launch polish.

## Next actions

1. v2 port, one issue at a time (`HERMES_HANDOFF.md` §8), branch `feat/tui-v2`.
   Done: §2 tokens + nine skins + AA gate (`pnpm contrast`); §4/§5 shell at `/v2`
   with all six transcript turns rendering from the collections and data files,
   bilingual, no horizontal scroll; §5.1 prompt with 16 slash commands and live
   search over every section; §5.2 dialogs — theme picker (System + nine skins,
   `tui.skin`, live OS follow), keyboard, commands; §5.3/§5.4 section tracking,
   the sidebar reading meter and the EN/ES switch; §7 phones — touch chips, 44px
   targets, the compact dock, gutters; §6 motion — typed role line, reveal,
   prompt flash, theme cross-fade, reduced motion; §8 sidebar extras — agents
   from SITE.agents and the compact todo from the devlog; §10 the design-system
   view at #design-system (live tokens, skins, component specimens); §12 sharing
   — meta, generated OG card and icons, and a 404 in the v2 language. Next: §9,
   the pre-merge checklist, run against the whole branch in one pass.
2. Devlog from live issues: build-time fetch, `GITHUB_TOKEN` in CI, cached
   JSON, fall back to `src/data/devlog.json` when the API fails.
2. Open issues #1–#4 so the devlog has something to mirror (owner approval).
3. Design pass on hero density and affordances (Designer agent, one batch).
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
| 2026-11-13 | `/work/[slug]` dropped | owner decision: v2 expands project rows in place, so the routes, bodies, sitemap entries and `case.*` copy are gone |
| 2026-11-13 | Design system stays a real route | shareable URL and its own canonical/OG beat a hash view; the spec's tabs port into the route |
| 2026-11-13 | v2 lands on `feat/tui-v2`, not `main` | a shell rewrite this size needs a preview branch until §9 passes |
| 2026-11-13 | Themes use official palettes, green/amber included | handoff §3.2 reverses the earlier no-green rule on purpose |
| 2026-11-13 | Browser tab title/meta follow the language switch; the URL does not fork | cheap bilingual signal without canonical/hreflang complexity; crawlers see English |
| 2026-11-13 | No free models in the fleet | Owner ruled them out: predictable quality beats marginal savings |
| 2026-11-13 | Per-role model tiers | `delegation.model` is global: one role per batch (build → audit → review). Builder `deepseek-v4.1-flash`, Auditor `qwen3.8-flash`, Reviewer **`glm-5.3-flash`** (mandated), Designer `gpt-6-luna` |

## Known issues

- `og.png`, `favicon-32.png` and `apple-touch-icon.png` are captured from the
  `/og` and `/icon` routes (2x, LANCZOS downscale). Re-run the capture after a
  design change; the routes are `noindex` and stay out of the sitemap.
- `/design-system/` is still the v1 page; the v2 view lives at `#design-system`.
  The 404 already links to the hash — reconcile at merge.
- **Handoff bug:** §5.5 specifies `rootMargin: '0 0 -8% 0'` for the reveal
  observer. IntersectionObserver rejects negative percentages, and the throw
  takes the whole motion module with it. Implemented as -8% of the viewport in
  pixels.

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
