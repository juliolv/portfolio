# Devlog proposal — the journey we actually had

Status: **decided, drafts ready, nothing created yet.**

Decided on review: cut to fourteen entries (the handoff and fleet entries went, and
the three bug entries became one), failures stay in, one issue per entry. Shipped
entries are created and closed immediately; the last one stays open. The drafts are
in `docs/devlog/issues.md`, and no issue exists until they are approved.

## Why not four issues

The four-issue plan (`#1 Environment setup … #4 Publish`) came from the handoff,
which was written before the work. The work turned out to be 80 commits over two
days, and the interesting part is not "environment setup" — it is that we built
case-study routes and then removed them, that nine skins became six themes, that a
theme rework silently deleted 39 tokens and broke the fonts, that the tab icon
shipped as the Astro logo for two days.

A devlog of four tidy phases would be a lie about how software this size actually
gets made. A devlog of what happened is the thing worth publishing, and it is also
the thing that makes "building in public" mean something.

## What is being proposed

**Sixteen entries, grouped in five phases.** Each becomes one GitHub issue (closed
ones carry the history; the open ones are the roadmap). The devlog section renders
them, in order, with status and date — the same shape it already has, just with
real content and more of it.

Every entry below has: what happened, what it cost, and the commits it lives in, so
any claim can be checked. Nothing is invented; where something was a mistake, the
entry says so.

---

## Phase 0 — The design handoff (2026-11-12 → 11-13)

Design happened outside the repo, in Claude artifacts: a terminal/IDE design
language, EN/ES, seven anchored sections, a design-system page. It arrived as one
self-contained HTML file plus a handoff bundle with a written spec (§2 tokens, §4–5
shell, §9 acceptance).

**1. A design handed over, not designed in code**
One HTML artifact → a reference bundle we could port from and measure against.
Cost: the port has to prove it matches, not approximate it.
Evidence: `76f0ce0`, `56d593b`.

## Phase 1 — v1, live in a day (2026-11-13)

**2. Port the terminal design system to static Astro**
Astro over Next: the site is content plus motion, and Next would ship ~100 KB of
runtime to reproduce CSS transitions. ~10 KB of vanilla TS, no UI framework.
Evidence: `2b2763b`.

**3. Motion, and the bug hiding inside it**
Hero stagger, typed role line, reveal-on-scroll, section tracker, crossfade, palette.
The handoff's reveal observer used a negative percentage in `rootMargin`, which
throws — and took the whole motion module with it. Boot steps are isolated now.
Evidence: `7b66da6`, `33a5bf9`.

**4. GitHub Pages under a subpath**
Project pages live at `/portfolio/`, so every link, image and canonical had to be
base-aware. Deploy on push to `main`.
Evidence: `f97701e`.

**5. The first audit fleet, and what it found**
Three cheap agents audited a11y, SEO and i18n in parallel; the orchestrator
re-verified rather than trusting the reports. Skip link, ES aria-labels, canonical,
`og:image`, `robots.txt`, sitemap.
Evidence: `bf2c687`, `6f652e0`.

**6. Case studies: built, then removed**
`/work/[slug]` routes with per-language markdown bodies, linked cards, generated
sitemap — then dropped by decision, because v2 expands rows in place and two
mechanisms for the same content is one too many.
Cost: a day of routes and eight markdown files, deleted on purpose.
Evidence: `f1e20b8`, `768d0d3`, then `28f916f`, `9bcd54a`.

## Phase 2 — The fleet (2026-11-13)

**7. Cheap models, in roles, with the orchestrator keeping the taste**
Builder, Auditor, Designer, Reviewer — different families for the audit so the
errors are not shared. Ten children maximum, no questions asked of children, every
report re-checked by the parent. This is how most of v2 got built without the
orchestrator's context drowning.
Evidence: `a19dcbd`, `c9dec90`, `8dc315c`.

## Phase 3 — v2: the TUI rewrite (2026-11-13)

**8. Tokens, nine skins, and a contrast gate**
Every skin checked against AA on every documented pair, in code, before a single
component used it. Nine skins, each a fixed dark or light palette.
Evidence: `398d46d`.

**9. The shell**
Title bar, tab strip, welcome box, six transcript turns from real data, sidebar,
prompt dock. Two traps: the CSS reference files are fragments ending in `</style>`,
and without the base layer the page renders on transparent — correct-looking, but
no background at all.
Evidence: `82bce0e`, `a3ff66e`.

**10. Prompt, dialogs, and a picker that had to work from the keyboard**
Slash commands, live search, `Ctrl K`. The theme picker took three passes before it
was honest: arrows preview, Enter saves, Esc reverts, one tab stop, focus ring.
Evidence: `f511bf4`, `c60ba7c`, `4f91ebc`, `3a74003`, `d2f7004`.

**11. Reading state: where you are, how far you've read**
Section tracking under a sticky bar, a context meter, the EN/ES switch. The meter
is **simulated** — a section of reading costs a block of tokens so it fills 21% →
98% of a 1M window, because the real count is ~2k and a meter pinned at 0.2% is a
lie of a different kind. It is documented as simulated everywhere.
Evidence: `f6fe5e3`, `b61ceac`, `558a347`.

**12. Phones**
Touch chips in a 2×2 grid, 44px targets, the dock that compacts as you read, no
horizontal scroll at 360–430.
Evidence: `f886465`.

**13. The design system as a view, not a page**
`#design-system` reads the live tokens off the page — change the theme and the
swatches change — with tabs for tokens, themes and components.
Evidence: `8b57828`, `184857d`.

**14. Sharing, and a 404 that speaks the same language**
Meta, OG card and icons generated from routes in real tokens rather than exported
by hand; a 404 in the v2 language that keeps your theme and language.
Evidence: `0cded01`.

## Phase 4 — Themes, and the things that broke (2026-11-14)

**15. Nine skins became six themes**
Nine fixed palettes, of which only three families had a light variant. Replaced by
six themes that each ship dark **and** light, with the mode following the system
until you choose. Dracula, Tokyo Night and Nord were dropped for being half a
theme; Solarized and Gruvbox came in.

This is also the entry where the rework deleted the base token layer — `--font`,
`--elev`, `--side-w`, the type scale — so the page did not look unstyled, it looked
broken. A token audit now fails if any `var(--x)` has no definition.
Evidence: `f0ad1d8`, `34c9d30`.

**16. Wave, and a picker that stopped lying**
The site's own theme: cyan on near-black indigo, after Tokyo Night, with a paper
light variant. In the same pass: the "current" mark stopped following the mouse,
preview and selection became separate, the "· current" label went away in favour of
the border, hovering stopped repainting the page, and arrows stopped walking a
single variant column.
Evidence: `d8e0acc`.

**17. Three layout bugs with one theme**
The sidebar rule was drawn three times before it was right: a border on the sidebar
(stops where the content stops), a rule on the shell (painted under the dock), and
finally one pixel to the right, in the sidebar's own column. Then the dock's
compaction turned out to be a feedback loop — shrinking the box changed the page
height, which changed whether the dock was at the end, which un-shrank it — and the
fix for *that* clipped the prompt's focus ring, because a 2px outline at a 2px
offset needs 4px outside the box.
Evidence: `44daa46`, `4a0ec95`, `a896d4e`, `961c6cb`.

**18. The tab icon was the Astro logo for two days**
`public/favicon.svg` was never replaced after the scaffold. Meanwhile `icon.astro`
hardcoded the old palette in hex, so "regenerating" the icons produced the old
colours while looking like it had worked. Both are fixed; the icon route reads
tokens now.
Evidence: `a896d4e`.

## Phase 5 — Ship (2026-11-14)

**19. v2 becomes the site**
53 commits merged, v1 deleted — layout, chrome, section components, two
stylesheets, the client script. Old URLs forward rather than 404, including `/v2/`
itself, because the preview URL had been shared. Deployed, then verified against
production rather than the local build.
Evidence: `73f33a2`, `6ae9990`, deploy runs green.

---

## What I'd like you to decide

1. **Which of these 19 ship?** My suggestion is to cut to ~14: drop 1 (handoff) and
   7 (the fleet), and fold 16–18 into two entries ("themes" and "what we shipped
   broken"), because three bug entries in a row reads as self-flagellation rather
   than a log.
2. **Do the failures stay in?** I think they should — a devlog where nothing ever
   breaks is a marketing page. But it is your name on it.
3. **One issue per entry, or one issue per phase?** Entry-level gives the devlog
   real anchors and a readable timeline; phase-level keeps the repo tidy.
4. **Closed or open?** Phase 0–4 issues would be opened and closed immediately so
   they carry dates; Phase 5 and anything still pending stay open. That does mean
   creating ~14 issues in public in one go.

## If it ships, what it costs

- 19 → ~14 entries, each with an EN and ES title and note (~56 strings), matched to
  the existing `devlog.json` shape.
- Build-time fetch of the repo's issues by label (`devlog`), cached JSON, falling
  back to `src/data/devlog.json` when the API fails — so the page never depends on
  GitHub being up.
- The devlog section needs grouping by phase once it has more than eight rows;
  today it is a flat list of four.
