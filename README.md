# Portfolio

**Live: [juliolv.github.io/portfolio](https://juliolv.github.io/portfolio/)** · [design system](https://juliolv.github.io/portfolio/design-system/)

A terminal-inspired portfolio, built in public. Static Astro output, one small
script for theme / language / command palette, and a design-system page that
reads its tokens from the real stylesheet so it cannot drift.

## Status

Deployed on GitHub Pages (push to `main` deploys). The design system, the
motion/interaction handoff and a first accessibility/SEO/i18n audit pass are
done; case-study routes are in progress. Content is **placeholder** on purpose —
every employer, project and metric in this repo is fictional and marked as such
(real content lands in issue #3).

## Stack

- **Astro 7** — static output, no adapter, no server runtime
- **Hand-authored CSS** — tokens as custom properties in `src/styles/design.css`
- **No UI framework** — ~5 KB of vanilla TypeScript for theme, i18n, palette
- **EN / ES** — both languages rendered at build time, toggled with CSS

## Commands

```sh
pnpm install
pnpm dev        # local dev server
pnpm build      # static build to ./dist
pnpm preview    # preview the build
pnpm guard      # privacy + secret check on staged files (also a git hook)
```

## Structure

```text
src/
├─ content/work/       # one markdown file per project; filename = future slug
├─ data/               # devlog, experience and stack (JSON, placeholders)
├─ i18n/               # en.json / es.json — UI copy only
├─ components/         # Astro components, one per page section
├─ layouts/Base.astro  # document shell, top bar, status bar, palette
├─ pages/
│  ├─ index.astro      # single page, anchored sections
│  └─ design-system.astro
└─ styles/
   ├─ design.css       # tokens + components (the reference implementation)
   └─ app.css          # bilingual toggling, skip link, small additions
```

## Privacy

This repository is public and its history is permanent, so nothing sensitive
enters a commit in the first place:

- All content is fictional placeholder data.
- `.guard/denylist.txt` holds real-world terms (gitignored) and
  `scripts/guard-secrets.mjs` blocks a commit if any of them — or anything
  that looks like a credential — appears in a staged file.
- Commits use a GitHub noreply address, never a personal email.

## Roadmap

- [x] Design system: tokens, components, both themes, both languages
- [x] Command palette, status bar, section tracking
- [x] Public design-system page generated from the stylesheet
- [ ] `/work/[slug]` case-study routes (content model already supports them)
- [ ] Devlog fetched from real GitHub issues at build time
- [ ] Real content, CV, and launch
