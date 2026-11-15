# Devlog issues — drafts for approval

**Created 2026-11-15.** Fourteen issues from these drafts (#1–#14, closed), plus
#15 for the entry still in flight, which stays open. Label `devlog`. The site links
each row to its issue, so a claim and its evidence are one click apart.

**Decision on state:** 1–14 are created and **closed immediately** — they are
history, and closing them keeps the repo's issue list honest as a to-do. Their
bodies carry the real dates, because GitHub would otherwise stamp them all with
today. 14 stays **open** until the next phase has something to be open about.

Each body ends with the commits it lives in, so a reader can check the claim.

---

## 1. Port the terminal design to Astro, and put it on Pages

**ES:** Llevar el diseño de terminal a Astro y publicarlo en Pages
**Date:** 2026-11-13 · **Status:** done
**Note:** The design arrived as a Claude artifact; the port had to match it, not
approximate it. Astro over Next, because the site is content plus motion.
**ES note:** El diseño llegó como artefacto de Claude; el port tenía que igualarlo, no aproximarse. Astro en vez de Next, porque el sitio es contenido más movimiento.

**Body**
The design language (terminal/IDE, EN/ES, seven sections, a design-system page) was
designed outside the repo and handed over as one self-contained HTML file plus a
written spec. That spec is the reason the port could be verified instead of
eyeballed.

Astro, not Next: ~10 KB of vanilla TS against ~100 KB of runtime to reproduce
transitions that are CSS anyway.

Pages project sites live at `/portfolio/`, so every link, image and canonical had
to be base-aware — including the ones that were hardcoded before.

Commits: `2b2763b`, `f97701e`.

---

## 2. Motion, and the bug hiding inside it

**ES:** El movimiento, y el bug que venía dentro
**Date:** 2026-11-13 · **Status:** done
**Note:** Hero stagger, typed role, reveal, trackers. The handoff's reveal observer threw on a negative percentage and took the whole motion module with it.
**ES note:** Entrada escalonada, rol escrito, revelado, seguimiento. El observer del handoff lanzaba error con un porcentaje negativo y se llevaba todo el módulo.

**Body**
The ported motion — stagger, typed role line, reveal on scroll, section tracker,
crossfade, palette — looked fine until one `rootMargin: '0 0 -8% 0'`. A negative
percentage is invalid in `IntersectionObserver`, the constructor throws, and every
handler after it in the same module never registers. The page still rendered; it
just stopped responding.

Boot steps are isolated now: one throwing step can no longer kill the rest.

Commits: `7b66da6`, `33a5bf9`.

---

## 3. The first audit fleet, and what it found

**ES:** La primera flota de auditoría y lo que encontró
**Date:** 2026-11-13 · **Status:** done
**Note:** Three cheap agents in parallel, reports re-checked by the orchestrator — which caught findings that were true and fixes that were not.
**ES note:** Tres agentes baratos en paralelo, con los informes revisados por el orquestador: aparecieron hallazgos ciertos y arreglos falsos.

**Body**
Accessibility, SEO and i18n audited by three agents at once. Findings acted on:
the skip link pointed at a target that did not exist, Spanish `aria-label`s were
still English, `og:image` 404'd on subpages, the card hover lied about being
clickable.

The orchestrator re-verified every report rather than trusting it: a claimed fix
that had not been applied is worse than no fix, because it closes the ticket.

Commits: `bf2c687`, `6f652e0`.

---

## 4. Case studies: built, then removed

**ES:** Los casos de estudio: construidos y luego eliminados
**Date:** 2026-11-13 · **Status:** done
**Note:** Routes, sitemap and eight markdown bodies — deleted on purpose when v2 expanded rows in place instead.
**ES note:** Rutas, sitemap y ocho textos en markdown, eliminados a propósito cuando v2 pasó a expandir filas en su sitio.

**Body**
`/work/[slug]` shipped with per-language markdown bodies, linked cards and a
generated sitemap. The v2 design expands a row in place instead, so keeping both
meant two mechanisms for the same content and two places to forget to update.

Deleting working code is the part of this log that looks wasteful and is not: the
cost was a day, and the alternative was maintaining it forever.

Commits: `f1e20b8`, `768d0d3` — removed in `28f916f`, `9bcd54a`.

---

## 5. Tokens, nine skins, and a contrast gate

**ES:** Tokens, nueve pieles y una compuerta de contraste
**Date:** 2026-11-13 · **Status:** done
**Note:** Every skin checked against AA on every documented pair, in code, before a component used it.
**ES note:** Cada piel comprobada contra AA en cada par documentado, en código, antes de que un componente la usara.

**Body**
Nine palettes mapped onto one set of token names, and a script that reads the real
stylesheet — not a copy — and fails on any text pair under 4.5:1 or any border
under 3:1.

The gate came first on purpose. A palette that fails is cheap to fix before twelve
components depend on it and expensive afterwards, and the check runs in CI, so a
hand-edited hex cannot sneak past review.

Commit: `398d46d`.

---

## 6. The shell

**ES:** El armazón
**Date:** 2026-11-13 · **Status:** done
**Note:** Title bar, tab strip, welcome, six transcript turns from real data, sidebar, prompt dock.
**ES note:** Barra de título, pestañas, bienvenida, seis turnos del transcript con datos reales, barra lateral y dock.

**Body**
Two traps, both silent. The CSS reference files are fragments — one of them ends in
a stray `</style>`, which killed the minifier and failed the build at a line number
that had nothing to do with the cause. And the shell without its base layer renders
correctly *on transparent*: right alignment, right type, no background. Only
`getComputedStyle(body).backgroundColor` said so.

Commits: `82bce0e`, `a3ff66e`.

---

## 7. Prompt, dialogs, and a picker that had to work from the keyboard

**ES:** Prompt, diálogos y un selector que tenía que funcionar con teclado
**Date:** 2026-11-13 · **Status:** done
**Note:** Slash commands and live search; the theme picker took three passes before arrows preview, Enter saves and Esc reverts.
**ES note:** Comandos con barra y búsqueda en vivo; el selector de temas necesitó tres pasadas hasta que las flechas previsualizan, Enter guarda y Esc revierte.

**Body**
The prompt carries sixteen commands and searches every section as you type. The
dialogs use the reference's model: roving tabindex, a focus trap, `inert` on the
page behind.

The picker was the part that needed honesty. First pass: the cards used a swatch
component with no height and collapsed to a line. Second: `[hidden]` lost to
`.dialog { display: flex }`. Third: keyboard selection looked like it worked but
previewed without saving, so Esc reverted to something the user had never chosen.

Commits: `f511bf4`, `c60ba7c`, `4f91ebc`, `3a74003`, `d2f7004`.

---

## 8. Reading state: where you are, how far you've read

**ES:** Estado de lectura: dónde estás y cuánto llevas leído
**Date:** 2026-11-14 · **Status:** done
**Note:** Section tracking under a sticky bar, a context meter, the language switch. The meter is simulated, and says so.
**ES note:** Seguimiento de sección bajo la barra, medidor de contexto y cambio de idioma. El medidor es simulado, y lo dice.

**Body**
Tracking a section under a fixed bar is a small problem with many wrong answers: a
line at a fixed fraction of the viewport skips short sections, `scrollIntoView`
parks a section below the line, and the page height changes under the rule when the
dock compacts or Spanish reflows.

The context meter is **simulated** — a section of reading costs a block of tokens so
it fills 21% → 98% of a 1M window. The honest count is around 2k, and a meter pinned
at 0.2% is a different kind of dishonesty. It is documented as simulated in the
state file and the design system.

Commits: `f6fe5e3`, `b61ceac`, `558a347`.

---

## 9. Phones

**ES:** Teléfonos
**Date:** 2026-11-13 · **Status:** done
**Note:** Touch chips in a 2×2 grid, 44px targets, a dock that compacts as you read, no horizontal scroll at 360–430.
**ES note:** Chips táctiles en rejilla 2×2, objetivos de 44px, un dock que se compacta al leer, sin scroll horizontal entre 360 y 430.

**Body**
The phone layout was not a smaller desktop: the sidebar becomes a tab strip, the
shortcut tips become chips, the skin label disappears, and the keyboard legend is
hidden where it cannot be used.

The dock compacts on scroll down and returns on scroll up. That behaviour later
turned out to be a feedback loop — see issue 13.

Commit: `f886465`.

---

## 10. The design system as a view, and sharing

**ES:** El sistema de diseño como vista, y compartir
**Date:** 2026-11-13 · **Status:** done
**Note:** `#design-system` reads the live tokens off the page; the OG card and icons are generated from routes in real tokens.
**ES note:** `#design-system` lee los tokens vivos de la página; la tarjeta OG y los iconos se generan desde rutas con los tokens reales.

**Body**
The design system is a view inside the app, not a second page: it reads
`getComputedStyle` off `:root`, so changing the theme changes the swatches, and the
tabs are a roving-tabindex group.

Sharing assets are generated, not exported by hand: `/og` and `/icon` are routes
that render in the site's own tokens, screenshotted at 2× and downsampled. The 404
fills the same slot and keeps your theme and language.

Commits: `8b57828`, `184857d`, `0cded01`.

---

## 11. Nine skins became six themes

**ES:** Nueve pieles se convirtieron en seis temas
**Date:** 2026-11-14 · **Status:** done
**Note:** Nine fixed palettes to six themes that each ship dark and light. The rework also deleted the base token layer and broke the type.
**ES note:** De nueve paletas fijas a seis temas con variante clara y oscura. El cambio además borró la capa base de tokens y rompió la tipografía.

**Body**
Only three of the nine families had both a dark and a light palette, so the picker
was really offering three themes and six half-themes. Replaced by six themes that
each ship both, with the mode following the device until a choice is made.
Dracula, Tokyo Night and Nord were dropped for being half a theme; Solarized and
Gruvbox came in.

Rewriting `tokens.css` replaced the whole file and took the base layer with it:
`--font`, `--elev`, `--side-w`, `--app-w`, the type scale. The page did not look
unstyled — it looked broken, in ways that took longer to trace than the feature took
to build. There is now an audit that fails if any `var(--x)` has no definition.

Commits: `f0ad1d8`, `34c9d30`.

---

## 12. Wave, and a picker that stopped lying

**ES:** Wave, y un selector que dejó de mentir
**Date:** 2026-11-14 · **Status:** done
**Note:** The site's own theme, cyan on near-black indigo. The "current" mark stopped following focus, hover preview went away.
**ES note:** El tema propio del sitio, cian sobre índigo casi negro. La marca de "actual" dejó de seguir al foco y la vista previa al pasar el ratón desapareció.

**Body**
Wave is the site's own palette after Tokyo Night: cyan accent, near-black indigo,
and a cool paper light variant. It replaced a "custom" theme that was a placeholder
with the name "Custom".

The picker lied in two ways. The visible "current" label moved with the preview, so
looking at another theme moved the mark that is supposed to mean "this is saved";
preview and selection are separate now, and the mark is the border alone. And
hovering repainted the whole page, which made selection look like it followed the
mouse. Arrow keys also stepped a whole theme, which kept the variant column and left
the last theme as a dead end.

Commit: `d8e0acc`.

---

## 13. What shipped broken: a rule, a bounce, and the tab icon

**ES:** Lo que salió roto: una línea, un rebote y el icono
**Date:** 2026-11-14 · **Status:** done
**Note:** The sidebar rule took three attempts, the dock's compaction was a feedback loop, and the favicon was still the Astro logo.
**ES note:** La línea de la barra lateral necesitó tres intentos, la compactación del dock era un bucle, y el favicon seguía siendo el logo de Astro.

**Body**
Three bugs, all of them things that looked like they worked.

**The rule.** A border on the sidebar stops where the sidebar's content stops — 834px
of a 3553px column. Moving it to the shell fixed the length and revealed that the
dock was painting over its last pixel. Third time, one pixel to the right, in the
sidebar's own column.

**The bounce.** The phone dock compacts by shrinking its box, and the space the
transcript reserved was measured from the dock's live height. Compacting shortened
the page by 49px, which changed whether the dock was at the end, which un-compacted
it, which made the page taller again. Reaching the bottom moved the page — and the
sticky top bar with it.

**The icon.** `public/favicon.svg` was the default Astro logo, untouched since the
scaffold, so the tab never carried the site's mark. Meanwhile the icon route
hardcoded the old palette in hex, which meant "regenerating" the PNGs produced icons
in the old colours while looking like it had worked. It reads tokens now.

Commits: `44daa46`, `4a0ec95`, `a896d4e`, `961c6cb`.

---

## 14. v2 becomes the site

**ES:** v2 pasa a ser el sitio
**Date:** 2026-11-14 · **Status:** open until the next phase
**Note:** 53 commits merged, v1 deleted, old URLs forward instead of 404.
**ES note:** 53 commits fusionados, v1 eliminado, las URL antiguas redirigen en vez de dar 404.

**Body**
The port replaced the site in one merge: `v2.astro` became `index.astro`, v1's
layout, chrome, section components, client script and two stylesheets were deleted,
and the two old design-system URLs forward to the view instead of 404ing. `/v2/`
itself forwards too — the preview URL had been shared.

Verified against production rather than the local build: the page renders in Wave
with six turns, the picker has twelve cards, `/design-system/` lands on the view,
the sitemap holds one URL, and there is no horizontal scroll at 1440 or 390.

Commits: `73f33a2`, `6ae9990`.
