# Portfolio

**Live: [juliolv.github.io/portfolio](https://juliolv.github.io/portfolio/)** ·
[design system](https://juliolv.github.io/portfolio/#design-system) ·
[devlog](https://juliolv.github.io/portfolio/#devlog)

A terminal-inspired portfolio that behaves like an editor: a transcript of six
sections, a file tree and reading meter in the sidebar, and a prompt docked at the
bottom that takes slash commands.

Static Astro output. No UI framework. Every interaction is a few kilobytes of
vanilla TypeScript on top of hand-authored CSS.

## What is in it

- **Six themes, twelve palettes.** Wave (the site's own, after Tokyo Night), Ayu,
  Catppuccin, Rosé Pine, Solarized, Gruvbox — each with a real dark and light
  variant, every pair checked against WCAG AA in CI. The mode follows your device
  until you choose one.
- **EN / ES**, both rendered at build time and toggled with CSS: no reload, no
  layout shift, and the language resolves before first paint.
- **A design system that cannot drift.** `#design-system` reads live token values
  off the page, so changing the theme changes the swatches.
- **A devlog that reads its own issues.** The entries on the site are the issues in
  this repo, fetched at build time; close an issue and the log follows.
- **Real content.** Employers, roles, dates and projects, all of which are public
  on LinkedIn and in the CV linked from the site.

## Stack

| | |
| --- | --- |
| Framework | Astro 7, static output, no adapter |
| Styles | Hand-authored CSS, tokens as custom properties |
| Scripts | ~10 KB of vanilla TypeScript, no UI framework |
| Content | Markdown collection for work, small JSON files for experience and stack |
| Host | GitHub Pages, project subpath `/portfolio` |

## Commands

```sh
pnpm install
pnpm dev        # dev server at localhost:4321/portfolio/
pnpm build      # refresh devlog state from GitHub, then build to ./dist
pnpm preview    # preview the build
pnpm check      # astro check
pnpm contrast   # WCAG AA gate for every theme, in both modes
pnpm guard      # secrets + privacy check on staged files (also a git hook)
pnpm state      # print docs/state.md, the session handoff
pnpm devlog     # refresh src/data/devlog-live.json from the repo's issues
```

## Structure

```text
src/
├─ content/work/         # one markdown file per project
├─ data/                 # experience, stack, devlog copy, fetched devlog state, themes
├─ i18n/                 # en.json / es.json — all user-facing copy
├─ components/           # Bi (bilingual span), RedirectTo, v2/DesignSystemView
├─ scripts/              # shell, prompt, dialogs, design-system view, motion
├─ pages/
│  ├─ index.astro        # the site: transcript, sidebar, dock, dialogs
│  ├─ 404.astro          # same language as the site, keeps your theme
│  ├─ og.astro           # share card, rendered in real tokens
│  ├─ icon.astro         # icon tile, rendered in real tokens
│  └─ design-system.astro, skins.astro, v2.astro   # forwards to #design-system
└─ styles/
   ├─ tokens.css         # tokens + the twelve palettes
   ├─ base-v2.css        # reset, layout, the overrides the reference needs
   └─ components.css     # components, ported from the design handoff
```

## How the devlog works

`scripts/fetch-devlog.mjs` reads the issues labelled `devlog` and writes
`src/data/devlog-live.json`. The page merges live **state** and **title** onto the
copy in `src/data/devlog.json`, which owns the Spanish text, the note, the phase and
the date the work happened — an issue cannot know when the thing it records was
written.

If the API is unreachable the script exits 0 and the committed file stands: a build
that ships yesterday's state beats one that fails.

## Accessibility

Every theme passes AA in both modes on every documented pair (`pnpm contrast`),
the site holds 0 horizontal overflow from 360px to 1920px, every tappable target is
at least 44px, the theme picker works from the keyboard alone, and reduced motion is
honoured throughout. `docs/state.md` carries the measurements.

## Privacy

This repository is public and its history is permanent, so what enters it is
deliberate:

- Only what the owner has approved is published — the content that is already on
  LinkedIn and in the CV. Client names, other people's details and anything from a
  private document stay out.
- `.guard/denylist.txt` (gitignored) holds the terms that must never appear;
  `scripts/guard-secrets.mjs` blocks a commit if one of them, or anything shaped
  like a credential, shows up in a staged file.
- Commits use a GitHub noreply address, never a personal one.

## Roadmap

Shipped, in the order it happened — each line is an issue in this repo, and the
[devlog](https://juliolv.github.io/portfolio/#devlog) carries the detail:

- [x] [#1](https://github.com/juliolv/portfolio/issues/1) Port the terminal design to Astro, and put it on Pages
- [x] [#2](https://github.com/juliolv/portfolio/issues/2) Motion, and the bug hiding inside it
- [x] [#3](https://github.com/juliolv/portfolio/issues/3) The first audit fleet, and what it found
- [x] [#4](https://github.com/juliolv/portfolio/issues/4) Case studies: built, then removed
- [x] [#5](https://github.com/juliolv/portfolio/issues/5) Tokens, nine skins, and a contrast gate
- [x] [#6](https://github.com/juliolv/portfolio/issues/6) The shell
- [x] [#7](https://github.com/juliolv/portfolio/issues/7) Prompt, dialogs, and a keyboard-first picker
- [x] [#8](https://github.com/juliolv/portfolio/issues/8) Reading state: where you are, how far you've read
- [x] [#9](https://github.com/juliolv/portfolio/issues/9) Phones
- [x] [#10](https://github.com/juliolv/portfolio/issues/10) The design system as a view, and sharing
- [x] [#11](https://github.com/juliolv/portfolio/issues/11) Nine skins became six themes
- [x] [#12](https://github.com/juliolv/portfolio/issues/12) Wave, and a picker that stopped lying
- [x] [#13](https://github.com/juliolv/portfolio/issues/13) What shipped broken: a rule, a bounce, and the tab icon
- [x] [#14](https://github.com/juliolv/portfolio/issues/14) v2 becomes the site
- [x] [#15](https://github.com/juliolv/portfolio/issues/15) A devlog that mirrors the repo — fetch, and phases that fold

What is open is the issue list, not a checklist here: anything planned carries the
`devlog` label and appears on the site the next time it builds.
