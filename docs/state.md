---
updated: 2026-11-14
milestone: 4 — v2 shipped to production
next_action: content is real — polish passes only; no placeholders left
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
| Live | https://juliolv.github.io/portfolio/ — the v2 TUI, deployed 2026-11-14 |
| Repo About | homepage set to the live URL, description, 6 topics (astro, portfolio, design-system, i18n, github-pages, accessibility) |
| Host | GitHub Pages, project subpath `/portfolio` (NOT Vercel) |
| Stack | Astro 7 static, hand-authored CSS, ~10 KB vanilla TS, no UI framework |
| Languages | EN / ES rendered at build time, toggled with CSS |
| Build | `pnpm build` → `dist/` (7 pages: `/`, `/404`, three forwards, `/og`, `/icon`) |
| Verified | 2026-11-14, live after the merge: `/` 200 in Wave with six turns, picker 12 cards, `/design-system/` lands on the view, `/v2/` lands on the root, 0 overflow at 1440 and 390 |

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
   Done: §2 tokens + six themes (dark and light each) + AA gate (`pnpm contrast`);
   §4/§5 shell at `/v2`
   with all six transcript turns rendering from the collections and data files,
   bilingual, no horizontal scroll; §5.1 prompt with 16 slash commands and live
   search over every section; §5.2 dialogs — theme picker (six themes × two
   variants, `tui.skin` + `tui.mode`), keyboard, commands; §5.3/§5.4 section tracking,
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

## §9 acceptance run — 2026-11-14, branch `feat/tui-v2`

Run in Chromium through CDP, not by eye. Evidence is the measurement next to each
line, because "looks fine" is what this section exists to replace. Re-run after the
theme rework: six themes with two variants each, Wave, and the picker's state model.

| Check | Result |
|---|---|
| Console errors, 360/375/393/412/430/1366/1440/1536/1920 × light/dark | pass — 0 errors in 18 loads |
| No horizontal page scroll at those widths | pass — 0px at every width |
| AA across the themes | pass — `pnpm contrast`, 12 palettes (six themes × dark/light) |
| Sticky prompts | pass — the section prompt pins at 49px, exactly `--bar-h` |
| Context meter | simulated — 21% → 98% of the 1M window; `aria-valuenow` agrees with the label |
| Phone dock | pass — the bar slides 27px down on scroll down and back on scroll up; its box stays 94px, so nothing reflows |
| No layout shift while scrolling | pass — document height constant (5333 phone / 3610 desktop) and the dock stays at one y through the whole page, including the end |
| Touch: chips, 44px targets, `menu` label | pass — 4 chips in 2 rows, no tappable under 44px |
| Reduced motion | pass — full role text, caret `animation-name: none`, `--dur-fast: 0ms` |
| Theme picker by keyboard | pass — opens on the saved card, any arrow steps one and wraps, Enter saves, Esc reverts |
| Default theme and the OS flip | pass — `wave` with no stored choice, #16161e → #eef0f6 when the scheme flips, no script |
| Explicit variant beats the OS | pass — gruvbox/dark stays dark under a light OS |
| Legacy ids migrate | pass — `dracula` → `wave`; no id without tokens |
| Prompt: autofocus, Tab completes, `/wo` matches | pass — completes to `/work ` and keeps focus in the field |
| Spanish, visible copy | pass — 258 EN/ES pairs, 36 identical: tech names, placeholder orgs, dates, theme names, `esc` |
| Command palette (§5.2) | pass — Ctrl K, 22 entries in four groups, focus lands in the field |
| Single keys `t` `l` `j` `k` `?` + switch | pass — `t` opens the picker, `l` switches to Spanish, ignored while typing or in a dialog |
| aria-labels, `data-tip` tooltips | pass — 15 attribute strings per language, none shared between them |
| `/design-system/`, `/skins/` | pass — both forward to the `#design-system` view |
| Design-system view | pass — 3 tabs, 12 theme cards in 3 columns, 9 specimens, 0 overflow |
| Sidebar rule | pass — reaches the viewport edge at 1300 and 900 tall, top and bottom of the page |
| 404 | pass — Wave, 404 heading, four ways back |
| Share images | regenerated from `/og` and `/icon` in Wave; 76 KB, 1 KB, <1 KB |

## Merge — done 2026-11-14

The v2 branch became `main` in one commit, and v1 came down with it. What happened,
in the order it happened, because the next session will wonder why `v2.astro` is a
forward:

1. `src/pages/v2.astro` → `src/pages/index.astro` (v1's index removed first, so the
   move is a rename in git, not a delete-plus-add).
2. `design-system.astro` and `skins.astro` now forward to `/#design-system`.
3. `src/pages/v2.astro` was re-created as a forward to `/`: the preview URL was
   shared, and a bookmark should not 404.
4. Deleted: `layouts/Base.astro`, `Topbar`, `StatusBar`, `Palette`, and the five v1
   section components, `scripts/client.ts`, `scripts/design-system.ts`,
   `styles/design.css`, `styles/app.css`.
5. `theme-color` on the root page still carried the old palette (#0c0f14/#fbf9f5);
   it is Wave now (#16161e/#eef0f6). `noindex` came off with the preview status.

## Content

Real as of 2026-11-15, from the owner's CV (public on LinkedIn as well): Mazatlán,
México (UTC−7); julio.lv7@gmail.com; linkedin.com/in/julio-lv; three roles
(Terramar DMC 2019–, ADSI 2016–2018, Sigma 2015–2016), the degree at Universidad de
Occidente, and four project cards (operations platform, clinic management, Nova Vida,
this site). The CV PDF is committed at `public/cv.pdf`.

**The privacy rule changed with it.** `AGENTS.md` used to say never commit employers,
emails or locations — right for a public repo full of placeholders, wrong for a
public portfolio. It now says: publish what the owner has approved, keep everything
else out. The terms that became public left `.guard/denylist.txt`; the client
project slug stays blocked, and credentials, other people's details and private
documents are still refused.

Two stale-value bugs surfaced while doing this, both the same shape as the devlog
specimen: the contact section printed a hardcoded `linkedin.com/in/your-handle`, and
the design-system timeline specimen still rendered `[Role title]` / `20XX`. Both read
real data now. The CV link also needed `url()` — it pointed at `/cv.pdf`, which does
not exist under the `/portfolio` subpath.

## Devlog

`src/data/devlog.json` now carries the real history: fifteen entries, grouped into
five phases, each with a date, a status, a one-sentence note and the commits it
lives in. The section renders them under phase headings; the sidebar shows only the
phase in flight and counts `done/total`.

Every entry is a real issue now: #1–#14 closed (history), #15 open (what is left of
this section). The row id links to the issue.

**State comes from the repo, at build time.** `scripts/fetch-devlog.mjs` reads the
issues labelled `devlog` and writes `src/data/devlog-live.json`: number, state and
title. `pnpm build` runs it first, and CI passes `GITHUB_TOKEN` to the build step.

The split is deliberate. GitHub owns *state* (open/closed) and the English title;
`devlog.json` owns the Spanish copy, the note, the phase and the date the work
happened — an issue cannot know when the thing it records was written, and the
issues were created retroactively in one minute. Close an issue and the log follows
on the next build.

If the API is unreachable, the script exits 0 and the committed file stands. A build
that ships yesterday's state is better than one that fails; both are better than
invented state.

Ids come from `issueId(entry, index)` — the ordinal while an entry has no issue, the
issue number once it does. It takes both arguments and the sidebar must pass the
index, or it prints `NaN`; that bug shipped once already.

The proposals live next to it: `docs/devlog/proposal.md` (why not four issues) and
`docs/devlog/issues.md` (the drafts, one per issue).

## Dock compaction

The reference compacts the phone dock by shrinking its box: padding tightens, the
input drops 44 → 34, the status line is hidden. That is a layout change, and layout
changes move the reader.

What it caused here: `--dock-h` (the space the transcript reserves) followed the
dock's live height, so compacting shortened the document by 49px, which changed
whether the dock was "at the end of the page", which un-compacted it, which made
the document taller again. Reaching the bottom produced a visible bounce, and the
top bar moved with it because the whole page was reflowing.

The dock now keeps its box and slides down by its status-line height instead, the
shell clips the overflow a transform still creates, `--dock-h` only ever measures
the expanded dock, and reaching the end no longer expands the bar. Document height
is constant from top to bottom; the bar appears to shrink without moving anything.

## Themes

| id | name | credit | ships |
| --- | --- | --- | --- |
| `wave` | Wave | by juliolv — the default, after Tokyo Night | dark + light |
| `ayu` | Ayu | by dempfi | dark + light |
| `catppuccin` | Catppuccin | Mocha / Latte | dark + light |
| `rose-pine` | Rosé Pine | by mvllow | Pine + Dawn |
| `solarized` | Solarized | by Ethan Schoonover | dark + light |
| `gruvbox` | Gruvbox | by morhetz | dark + light |

**Choosing.** The picker offers both variants of every theme side by side, and
either is a real choice: `tui.skin` holds the theme, `tui.mode` holds `dark` or
`light`. Each preview forces its own `data-mode`, so a dark and a light palette
can sit next to each other while the page renders one of them.

**What the picker shows.** The saved choice is marked by its border alone — an
accent border with an inset ring, so it reads heavier than the keyboard focus
ring, which is also accent-coloured. There is no "current" label and no hover
preview: colours change only when a card takes focus, and they revert on Esc.

**What `prefers-color-scheme` decides.** Exactly one thing: when `tui.mode` is
absent, the OS picks the variant — which means the default `wave` theme is dark
or light according to the device, with no script and nothing to flash. The moment
a variant is chosen, `data-mode` is set and the media query has no say. Absence of
`data-mode` is the "follow the system" state; there is no third attribute value.

Only themes with a real light variant are in the table. Dracula, Tokyo Night and
Nord are dark-only, so they are not here. `themes.ts` maps the old nine-skin ids
onto the six (`dracula` → `wave`): an unknown id means no tokens at all, which
is an unstyled page.

**Tokens are not a theme's business.** `tokens.css` opens with the reference's
typography, spacing, elevation, z-index and motion tokens. Replacing the file
without them yields a page that looks broken rather than unstyled — no `--font`,
no `--elev`, no `--side-w` — so the audit in `scripts/check-contrast.mjs` and the
names in that block are the thing to check first if the layout goes strange.

## Known issues

- `og.png`, `favicon-32.png` and `apple-touch-icon.png` are captured from the
  `/og` and `/icon` routes (2x/4x, LANCZOS downscale) and committed. Re-run the
  capture after a design change; the routes are `noindex` and stay out of the
  sitemap. `icon.astro` now reads tokens — it used to hardcode the ported palette,
  so a "regenerated" icon still came out in the old colours.
- `public/favicon.svg` is hand-written, not generated: it is the title-bar mark on
  a rounded Wave tile. It shipped as the default **Astro logo** for days because
  nothing in the build owns it — if the mark changes, this file has to change too.
- `/design-system/` is still the v1 page; the v2 view lives at `#design-system`.
  The 404 already links to the hash — reconcile at merge.
- **Testing note:** the browser harness reports `hover: none`, so the reference's
  `@media (hover: none)` rule hides every tooltip there. Tooltips have to be
  checked with that override forced, or they look broken when they are not.
- **Port pitfall:** a component rendered twice (skin cards in the picker and in
  the design-system view) makes `querySelectorAll` return two populations. Scope
  the query to the surface that owns the behaviour, or a hidden copy silently
  absorbs focus and arrow steps.
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
