## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Read this first

1. `docs/state.md` — the living handoff: milestone, next action, decisions, known issues.
2. `docs/orchestration.md` — how work is split between the orchestrator and a cheap subagent fleet.
3. Run `pnpm state` — it prints both the summary and whether the handoff file is stale.

A session that ends without updating `docs/state.md` is unfinished, even if the code works.

## Project rules

**This repo is public and its git history is permanent.**

1. **Publish only what the owner has approved.** The site now carries real content:
   his employers, city, contact address and CV, all of which are already public on
   LinkedIn and in the CV he supplied. Everything else stays out — other people's
   names, client names he has not approved, phone numbers, home address, anything
   from a private document. When in doubt, leave it out and ask.
   `.guard/denylist.txt` (gitignored) holds the terms that must still never appear;
   a term leaves that file only when the owner says it is public.
2. Run `pnpm guard` before committing. The pre-commit hook runs it too; it fails
   the commit on real-world terms from `.guard/denylist.txt` (gitignored) and on
   credential-shaped strings.
3. Commit as the GitHub noreply address. `git config user.email` is set per-repo
   for exactly this reason — do not change it to a personal address.
4. `src/styles/tokens.css` is the single source of token values. Components read
   `var(--token)`, never literals. `/design-system` reads them live off the page, so
   a new token shows up in the public spec automatically.
5. All user-facing copy goes through `src/i18n/{en,es}.json`; render both languages
   with the `Bi` component so switching stays a CSS toggle with no re-render.
6. Do not add a UI framework. The interaction budget is: theme, language,
   command palette, section tracking, reveal. That is deliberately ~5 KB.
