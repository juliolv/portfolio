# Portfolio TUI: build handoff for Hermes Agent

You are building Julio López's portfolio site, a terminal UI (TUI) in the style of Claude Code and OpenCode, for GitHub Pages at `https://juliolv.github.io/portfolio/`.

A complete, tested reference build already exists in `reference/`. Your job is to port it into the repo's real stack, keep every behavior below, and track the work as GitHub issues. Where this document and the reference disagree, the reference wins. Flag the difference in the issue rather than guessing.

Primary audience: recruiters and hiring managers. They skim. The name, role, pitch, actions and availability must be readable in the first screen on a 360px phone and a 1366px laptop.

---

## 0. Ground rules

1. Do not invent content. Every project, employer and date is a placeholder until Julio supplies the real value. Keep the brackets (`[Add one metric.]`, `Example Corp`, `20XX`).
2. No personal data in the repo: no real email, city, employer names or client names. The email is `you@example.com` until Julio changes it.
3. All copy lives in one i18n dictionary, keyed by section, in English and Spanish. No hard-coded strings in components.
4. Every color, size, spacing, radius, duration and z-index is a design token (CSS custom property). Components never use literal values.
5. The page must be readable without JavaScript. The English content is rendered into the HTML at build time; JavaScript adds the interactions.
6. WCAG AA everywhere:
   - **Contrast:** 4.5:1 for text and 3:1 for control borders, in every theme.
   - **Keyboard:** visible focus and full keyboard use.
   - **Motion:** prefers-reduced-motion is respected.
   - **Shortcuts:** single-key shortcuts can be switched off.
7. No external runtime dependencies, no trackers, system font stacks only.
8. Commit in small steps, one issue at a time. Link each commit to its issue.

---

## 1. What you are given

```
reference/
  site/                  the deployable output (open site/index.html to see the target)
    index.html  404.html  og.png  favicon.svg  favicon-32.png  apple-touch-icon.png
  src/                   the source the reference is built from
    p1-head.html         theme boot script, design tokens, 9 theme palettes, base CSS
    p2-css.html          every component's CSS
    p3-body.html         page markup (title bar, transcript, sidebar, dock, dialog, design-system view)
    p4-en.js             SITE data (links, projects, devlog, stack, agents, themes) + English copy
    p5-es.js             Spanish copy
    p6-core.js           helpers, state, storage, themes, i18n applier, status line, copy email
    p7-render.js         renderers (hero, work, devlog, experience, stack, about, agents, context, design system), language switch, rows, tabs
    p8-app.js            router, focus handling, section tracking, commands, prompt + live search, dialogs, shortcuts, hero typing, reveal, boot
    build.js             assembles parts, pre-renders English content, writes site/ (meta tags, PNGs, 404)
    gen_skins.py         generates the 9 theme blocks from official palettes and adjusts colors only to pass AA
    skins.json           generated theme values (used by build.js for theme-color, favicon, OG card)
    og-src.html          1200×630 Open Graph card, screenshotted into og.png
    404.html             404 page source
    favicon.svg  apple-icon.svg  logo.svg
    tests/               Playwright checks used during development (paths point at /home/claude/tui, adjust them)
```

`src/` is one HTML file split into parts so it ports cleanly. In the target stack, each `/* COMPONENT: … */` block in CSS and JS becomes one component.

---

## 2. Target stack

The live site already uses Astro. Unless Julio says otherwise:

- **Astro, static output**, deployed to GitHub Pages with `base: '/portfolio/'`.
- **Components:** `.astro` files for markup. Interaction scripts are plain TypeScript modules in `<script>` blocks, one per component. No UI framework is needed; the reference is vanilla JS.
- **Styles:** `src/styles/tokens.css` (tokens + themes), `src/styles/base.css`, and component-scoped CSS.
- **Copy:** `src/i18n/en.ts` and `src/i18n/es.ts`, same shape as `I18N.en` / `I18N.es`. `src/data/site.ts` holds the `SITE` and `SKINS` data.
- **Rendering:** Astro renders English at build time. That replaces `build.js`'s pre-render step, so you don't need Playwright to produce HTML. Keep the client-side language switch to Spanish (no reload, no `/es/` route for now).
- **Generated assets:** keep `gen_skins.py` (or port it to a Node script) and generate `og.png`, `favicon-32.png` and `apple-touch-icon.png` in a build script or commit them.

Ask Julio before choosing anything else (Next.js static export is the other option he has mentioned).

---

## 3. Design system

### 3.1 Tokens (from `p1-head.html`)

| Group | Tokens |
|---|---|
| Color | `--bg --panel --element --border --border-strong --text --muted --accent --accent-fg --accent-subtle --ok --warn --danger --select --shadow` |
| Font | `--font` = `ui-monospace, "SF Mono", SFMono-Regular, "Cascadia Code", "JetBrains Mono", Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace`. Everything is monospace. |
| Type | `--fs-1..--fs-7`; base 12/13/14/16/20/28px, name `clamp(30px, 6.2vw, 48px)` |
| Line height | `--lh-tight 1.1`, `--lh-snug 1.4`, `--lh-body 1.6`; letter spacing `--ls-tight -0.02em`, `--ls-wide 0.08em` |
| Space | `--sp-1..--sp-8` = 4, 8, 12, 16, 24, 32, 48, 72px |
| Shape | `--r-0 0`, `--r-1 2px`, `--r-box 6px`, `--bw 1px`, `--bw-2 2px`, `--elev` |
| Layers | `--z-bar 20`, `--z-dock 30`, `--z-menu 35`, `--z-dialog 50`, `--z-tip 60`; sticky prompts use 5 |
| Motion | `--dur-fast 120ms`, `--dur-base 220ms`, `--dur-slow 520ms`, `--ease-out cubic-bezier(0.2,0.7,0.2,1)`, `--ease-in-out cubic-bezier(0.6,0,0.2,1)`; all durations become 0ms under reduced motion |
| Layout | `--bar-h` 49px (89px under 900px, when the tab strip shows), `--side-w`, `--app-w` |

Responsive type scale (desktop text was too small, keep this):

| Viewport | fs-1 / fs-2 / fs-3 / fs-4 / fs-5 | Name | `--app-w` | `--side-w` |
|---|---|---|---|---|
| < 1200px | 12 / 13 / 14 / 16 / 20 | clamp(30px, 6.2vw, 48px) | 1280px | 288px |
| ≥ 1200px | 13 / 14 / 15 / 17 / 21 | clamp(40px, 3.4vw, 54px) | 1360px | 304px |
| ≥ 1600px | 14 / 15 / 16 / 18 / 22 | clamp(48px, 3.2vw, 60px) | 1520px | 336px |
| ≤ 640px | base sizes | clamp(28px, 8.6vw, 38px) | full width | hidden |

Breakpoints: 1600, 1200, 899 (sidebar → tab strip), 700, 640 (phone layout), 560, 480, plus `(pointer: coarse)` for touch targets.

### 3.2 Themes

Nine open-source themes plus `system`. Each theme uses its **official** palette: its own accent, green (`--ok`), yellow (`--warn`) and red (`--danger`). Julio chose this over the earlier no-green/no-amber rule.

| id | Name | Kind |
|---|---|---|
| `ayu-dark` | Ayu Dark | dark (the `:root` fallback) |
| `ayu-light` | Ayu Light | light |
| `catppuccin-mocha` | Catppuccin Mocha | dark |
| `catppuccin-latte` | Catppuccin Latte | light |
| `dracula` | Dracula | dark |
| `tokyo-night` | Tokyo Night | dark |
| `nord` | Nord | dark |
| `rose-pine` | Rosé Pine | dark |
| `rose-pine-dawn` | Rosé Pine Dawn | light |

- **Contrast adjustments:** `gen_skins.py` darkens (light themes) or lightens (dark themes) only the tokens that fail AA, in 3% steps toward black or white. It prints every change; keep that log in the issue. Ayu Light's body text is set to `#3e4348` so it stays darker than muted text.
- **`system`** resolves to Ayu Light or Ayu Dark. It follows the host's `data-theme="light|dark"` attribute when present, otherwise `prefers-color-scheme`. It re-resolves live when either changes (MutationObserver + matchMedia listener).
- **No flash on load:** an inline script in `<head>`, before any CSS paints, reads `localStorage['tui.skin']`, resolves `system`, sets `data-skin` on `<html>`, and adds the `js` class. Without JavaScript, `:root` is Ayu Dark and a `prefers-color-scheme: light` block applies Ayu Light to `:root:not([data-skin])`.
- **Theme blocks:** they are written as `[data-skin="id"] { … }` (not `:root[...]`), so any element with `data-skin` previews that theme. The theme picker swatches and the design-system skin cards rely on this.
- **Theme change:** add a `theme-anim` class to `<html>` for 320ms so background, text, border and fill colors cross-fade over `--dur-base`. It never animates on first paint.

### 3.3 Brand

- **jl mark (`logo.svg`):** a lowercase **j** (square dot + descender hook) followed by a solid block cursor that is also the **l**. Colors are `var(--accent)` for the j and `var(--text)` for the cursor, so it follows the theme. It is used in the title bar and the 404 page, and nowhere else.
- **Favicon (`favicon.svg`):** the same mark on a rounded tile, Ayu Dark by default. An embedded `@media (prefers-color-scheme: light)` swaps it to Ayu Light. It follows the visitor's OS, not the in-page theme. `favicon-32.png` is the fallback (Safari ignores scheme-aware SVG favicons) and `apple-touch-icon.png` is 180px.
- **⠚ (j in Braille) is the loading glyph only:**
  - **Status-line spinner:** cycles ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏ every 80ms.
  - **Welcome box title on load:** shows the same spinner while the role line types, rests on ⠚ for 450ms, then hides.
  - **Reduced motion:** a static ⠚ instead of the animation.
  - It never appears at rest.

---

## 4. Layout and components

### Title bar (sticky, top)
- **Left:** jl logo + `julio` + breadcrumb of the current section (`/work`).
- **Right:** EN/ES switch (radiogroup), theme button (swatch strip + theme name, opens the picker), palette button (`Ctrl K` / `⌘K`; reads `menu` on touch).
- **Tooltips:** custom `[data-tip]` tooltips below each control, not the native `title`.
- **Under 900px:** a second row shows a scrollable tab strip of the sections, with a sliding 2px underline indicator. It auto-scrolls to keep the active tab centered.

### Transcript (main column)
- **Welcome box:** a bordered box with the legend `portfolio v1.0`.
  - **Left:**
    - h1 `Julio López`.
    - Typed role line `› senior full-stack software engineer` (lowercase) with a blinking block caret. This is the only blinking caret on the site.
    - Pitch.
    - Actions: Download CV, Copy email, GitHub, LinkedIn.
    - `● available` (lowercase) + note.
  - **Right:** Profile key/value list, then "Try this" tips.
- **Turns:** every section is a turn, in this order:
  1. A **prompt line** (h2): `❯ What has Julio built?` with the command `/work` right-aligned. The command is hidden on phones.
  2. A **tool call**: `● List (work/)`.
  3. A **result** with an L-shaped tree connector.
- **Sticky prompts:** each prompt line is `position: sticky; top: calc(var(--bar-h) + env(safe-area-inset-top))`. It stays under the title bar while its answer scrolls, and the next prompt pushes it out, as in Claude Code.
- **Current section:** its prompt gets an inset 2px accent edge.

| Section | Tool call | Result |
|---|---|---|
| work | `List(work/)` | Expandable project rows. Each row shows ▸/▾, name, period and a one-line problem. Expanded: man-page `dl` (Role / Stack tags / Outcome) + "case study in progress" tag, or a repo link. The first row is open by default. Expand animates with the `grid-template-rows` 0fr→1fr trick plus `visibility` so collapsed links aren't focusable. Without JS all rows are open. |
| devlog | `Update Todos(TODO.md)` | Intro paragraph, then a todo list: `#n`, status (● done / ◐ in progress / ○ planned, glyph + word), date or TBD, title, `issue #n ↗` link to `repo/issues/n`, note. Footer: public repo link + "Published with GitHub Pages". |
| experience | `Bash(git log --graph --career)` | Git-graph timeline: accent dot per role, muted dot for education. |
| stack | `Bash(tree stack/)` | 2×2 grid of `tree` blocks with `├──` / `└──` connectors (CSS `content` with empty alt text). |
| about | none | Assistant message with a `●` bullet and paragraphs. |
| contact | `Read(contact.md)` | Key/value list: email (selectable, 14px like the links) + Copy + "Open in mail app", github, linkedin, cv. Colophon links to the design system. |

### Sidebar (desktop ≥ 900px, sticky, scrolls inside)
Order: Files, Context, Agents, Todo, then a "keyboard shortcuts" button.
- **Files:** section links styled as file names (`work/`, `experience.md`, …), with a vertically sliding 2px accent indicator and a `❯` marker on the current item.
- **Context:** a reading meter.
  - **Display:** a 14-cell block bar (`█` filled, `░` empty), a percentage, `≈ used / total tokens` and `n/7 sections read`.
  - **Counting:** tokens ≈ section text length ÷ 4. A section counts as read once its top passes 85% of the viewport height.
  - **Monotonic:** it only grows, like a context window.
  - **Accessibility and language:** it is a `role="progressbar"`, and it recounts on language change.
- **Agents:** data in `SITE.agents`.
  - `hermes · learning` ("building this site · #2 Design system"; the issue comes from the devlog item marked in progress).
  - `opencode · active`, with sub-agents `orchestrator · read-only` and `specialist reviewers`.
  - `claude code · active`.
- **Todo:** a compact devlog with a done/total count.

### Dock (sticky, bottom of the main column)
- **Prompt box:** `❯` + input. Placeholder: "Search projects and skills, or type / for commands…"; "Search, or type /…" at ≤ 640px. The focus ring is drawn on the box.
- **Status line:**
  - **Left:** a hint (`? shortcuts · / commands · Ctrl K palette`; touch: `tap ❯ to search · / commands`; shortcuts off: `Ctrl K palette · /help shortcuts`) or a transient message with the spinner. Hidden at ≤ 640px except when showing a message.
  - **Right:** **`build`** (accent tag), `julio-lopez / senior-full-stack` (phones: `sr-fs`). Each part has an upward tooltip: Mode, Model, Variant (Modo, Modelo, Variante in Spanish), plus screen-reader-only labels.
- **Phones:** the dock compacts from about 94px to about 45px while scrolling down (input 34px tall, status line hidden). It expands on scroll up, at the top or bottom of the page, and when the prompt is focused.

### Dialog (one shared component)
`role="dialog"`, `aria-modal`, backdrop `--bg` at 82%, panel rises in. Tab is trapped inside, Esc closes, and focus returns to the opener.
- **Command palette** (`Ctrl/⌘K`, the palette button, `/` commands): a combobox input + listbox, grouped into Go to, Appearance (each theme, each language), Links and Actions. Arrows move, Enter runs, hover selects, and Esc closes.
- **Theme picker** (`t`, `/theme`, theme button):
  - **List:** system + 9 themes, each with a 5-color swatch, its name, "dark · Catppuccin"-style text, and "● current" on the active one.
  - **Live preview:** arrows, Home/End and mouse hover (pointer devices only) apply the theme instantly.
  - **Apply or cancel:** Enter or click applies and saves; Esc or the backdrop reverts.
- **Help** (`?`, `/help`, sidebar button): the single-key shortcut switch (`role="switch"`, saved in `localStorage['tui.keys']`) and the shortcut tables (Always on / Single-key / In the prompt).

### Design-system view (`#design-system`)
A separate view routed by hash, with an h1 prompt line and tabs (tokens / skins / components).
- **Tabs:** `role="tablist"`, roving tabindex, arrows, Home/End.
- **Tokens tab:** live color swatches read with `getComputedStyle`, so they update with the theme. Also type scale, spacing bars, radius/border shapes, motion rows (click to play that duration and easing) and z-index.
- **Skins tab:** a mini preview card per theme (scoped `data-skin`); clicking a card applies the theme.
- **Components tab:** live specimens of every component, including the logo and the ⠚ loading mark.

### 404 page
- **Look:** styled like a failed `cd` in the transcript: `❯ cd /portfolio/old-page` (the requested path), `● Error (404)`, a message, and buttons to the portfolio, /work, /devlog and /contact.
- **Theme and language:** uses the same tokens and theme boot, in English or Spanish from `tui.lang` or the browser language.
- **Head and links:** `noindex`. Links are absolute (`/portfolio/…`) because GitHub Pages serves it at any depth.

---

## 5. Behavior specs

### 5.1 Prompt: slash commands + live search
- **Starts with `/`:** a command menu above the prompt, filtered by prefix (or by description once two or more characters are typed).
  - **Commands:** `/work /devlog /experience /stack /about /contact /design /theme /lang /github /linkedin /cv /repo /copy /hire /help`.
  - **Arguments:** `/theme <id>` and `/lang <en|es>` complete their arguments (Tab after `/theme` adds a space and lists the themes).
  - **Unknown command:** shows "Unknown command /x. Type / to see all commands." inside the menu.
- **Plain text:** a live search inside the same menu. The page does not scroll or jump.
  - **Searches:** sections, projects (name, stack tags, problem/role/outcome), devlog issues, experience (role, org), stack items, and non-navigation commands.
  - **Matching:** every typed word must match somewhere.
  - **Ranking:** label starts with query +100, word start +60, contains +40; tag exact +50, contains +25; location +10; body text +5. Top 8 results.
  - **Display:** the match in the label is underlined in the accent color. The description shows where the item lives and, when the match came from a tag, which tag (`work/ · 20XX — present · React`). A note line shows "3 matches for "react"" or the no-match hint, and the status line announces it after 600ms.
- **Selecting a result:**
  - **Section:** jumps there.
  - **Project:** expands its row, scrolls it to the center and focuses its header.
- **Keys:** ↑/↓ move in the menu, or recall history when the menu is closed. Tab completes slash commands. Enter runs the selection. Esc closes the menu, then leaves the prompt. Clicks on the menu don't blur the input (`mousedown` preventDefault).
- **Running a section command:** shows `⠋ running /work` in the status line for 320ms, then navigates and shows `✓ /work`. With reduced motion there is no delay.
- **`/hire`:** jumps to contact, then copies the email.
- **Copy email:** uses `navigator.clipboard.writeText` inside the click handler. On success: `✓ copied you@example.com`. On failure: the visible address is selected and the status says how to copy it.

### 5.2 Navigation and focus
- **Routing:** plain `#name` hashes only. Sections: `top`, `work`, `devlog`, `experience`, `stack`, `about`, `contact`. Views: `#design-system`; everything else is home. Clicking a link to the current hash re-runs the route.
- **Focus moves to the heading** (`tabindex="-1"`, `focus({ preventScroll: true })`) after any section command, palette pick, nav click, `j`/`k`, or view change. Not on the first load.
- **No mouse focus ring:** `h1/h2[tabindex="-1"]:focus:not(:focus-visible)` has no outline.
- **Active section:** the last section whose top is above 38% of the viewport height, or `contact` at the very bottom of the page. Recomputed on scroll and resize in one requestAnimationFrame pass, which also updates the nav indicators, the breadcrumb, the current-prompt edge, the context meter and the dock.
- **Clipped focus rings:** inside scrolling or clipped containers (sidebar, tab strip, design-system tabs, expanded project bodies), focus rings use `outline-offset: -2px` so they are never cut off.

### 5.3 Shortcuts
- **Always on:** `Ctrl/⌘K` palette and `Esc`.
- **Single-key (switchable):**
  - `/` focuses the prompt.
  - `?` opens help.
  - `t` opens the theme picker.
  - `l` toggles the language.
  - `j` / `k` jump to the next or previous section.
- **When single keys are ignored:** while typing, inside listbox, tablist or radiogroup widgets, or with any modifier. There is no `e` shortcut (removed so the email can't be copied by accident).

### 5.4 Language
- **Default:** `localStorage['tui.lang']`, else Spanish if `navigator.language` starts with `es`, else English.
- **Switching:** no reload. It updates `<html lang>`, `document.title`, the meta description, every `data-i18n` / `data-i18n-attr` element and every rendered list. Open project rows stay open.

### 5.5 Motion
- **Welcome box:** children rise in, staggered 0–300ms (`--dur-slow`).
- **Role line:** types at 26–56ms per character, with no layout shift (an invisible ghost copy reserves the space). A language switch mid-typing shows the full text.
- **Scroll reveal:** only turns that start below the fold fade up once (IntersectionObserver, `rootMargin 0 0 -8% 0`). Content already on screen is never hidden.
- **Prompt flash:** after navigation, the target prompt line gets a 900ms accent outline that fades out.
- **Reduced motion:** every duration becomes 0; no typing (full text), no spinner animation (static ⠚), no reveal.

### 5.6 Phones and touch
- **Touch detection:** `(hover: none) and (pointer: coarse)`. "Try this" becomes chips (`/work /devlog /contact /theme`), the palette button reads `menu`, and the status hint is the touch version.
- **Tap targets:** `(pointer: coarse)` raises buttons, segmented options, project row headers and inline links (issue links, repo link, contact links, colophon) to at least 44px.
- **≤ 640px:** tighter welcome box padding, `--sp-6` gaps between turns, and the prompt-line command hidden.
- **Tested widths:** 360, 375, 393, 412 and 430px. None scrolls sideways, and name, role, pitch, actions and availability fit the first screen.

---

## 6. Sharing and SEO (`site/index.html` head)

`<title>` and `meta description` are per language at runtime, with English as the static default:
- EN title: `Julio López · Senior full-stack software engineer`
- ES title: `Julio López · Ingeniero de software full-stack senior`

Static head tags:
- **Basics:** `canonical`, and `theme-color` for dark (`#0d1017`) and light (`#fcfcfc`).
- **Icons:** `icon` (SVG + 32px PNG) and `apple-touch-icon`.
- **Open Graph:** `og:type/site_name/title/description/url/image(+width/height/alt)/locale(en_US)/locale:alternate(es_ES)`.
- **Twitter:** `twitter:card=summary_large_image` + title, description and image.
- **Absolute URLs:** `og:image` must be absolute: `https://juliolv.github.io/portfolio/og.png`. If the repo name or a custom domain changes, update `SITE_URL` and the 404 links in one place.

`og.png` is 1200×630, Ayu Dark: logo + `julio/portfolio`, a box with `portfolio v1.0`, the name, the role line with an amber caret, the focus line, `● available`, and `/work /devlog /contact`.

---

## 7. Content still owed by Julio

Leave these as visible placeholders and list them in the content issue:

- **Contact:** email (`SITE.email`), LinkedIn handle, CV URL.
- **Hero:** `[City, time zone]` and `[City, country]`.
- **Projects:** real projects or anonymized case studies, one metric each, and case-study links.
- **Experience:** employers, dates and descriptions (`Example Corp/Inc/Ltd/University`, `20XX`).
- **About:** the closing paragraph about team values and life away from the keyboard.
- **Opencode paragraph:** confirm he is comfortable describing his work code review workflow publicly. It is described without the employer's name.

---

## 8. Suggested issues (devlog phases)

Open one GitHub issue per line, in order. Each lists its acceptance checks from §9.

1. **Scaffold:** Astro project, GitHub Pages workflow, `base: '/portfolio/'`, empty layout.
2. **Tokens + themes:** `tokens.css`, the theme generator, the head boot script, the reduced-motion and responsive scales.
3. **i18n + data:** `en.ts`, `es.ts`, `site.ts`; language switch; per-language title and description.
4. **Shell:** title bar, tab strip, sidebar, dock, status line, sticky prompts, nav indicators, section tracking.
5. **Content sections:** welcome box, work rows, devlog todos, experience graph, stack trees, about, contact.
6. **Prompt:** slash menu, live search, history, run feedback, copy email, `/hire`.
7. **Dialogs:** palette, theme picker with live preview, help with the shortcut switch.
8. **Sidebar extras:** context meter, agents, todo.
9. **Design-system view:** tabs, live tokens, skins, component specimens.
10. **Motion + loading:** hero typing, ⠚ spinner, reveal, theme cross-fade, flash.
11. **Phones:** touch chips, 44px targets, compact dock, ≤ 640px layout.
12. **Sharing:** meta tags, OG image, favicons, 404 page.
13. **Accessibility + QA pass:** run §9 in full and fix what fails.
14. **Content:** replace the placeholders once Julio sends the real data.

---

## 9. Acceptance checklist

Run these in a real browser and with Playwright. The scripts in `src/tests/` show how each was checked.

- [ ] No console errors at 360, 375, 393, 412, 430, 1366, 1440, 1536 and 1920px, in system light and dark.
- [ ] No horizontal page scroll at any of those widths.
- [ ] Every theme passes AA: text, muted and accent against bg, panel, element and accent-subtle (4.5:1); status colors against bg and panel (4.5:1); `--border-strong` (3:1). Use `tests/contrast.py`.
- [ ] With JavaScript disabled, the name, role, pitch, all projects (expanded), experience, stack, devlog and email are present and readable. JS-only controls are hidden.
- [ ] A first visit follows the OS: Ayu Dark or Ayu Light. A stored theme applies before first paint, with no flash.
- [ ] The favicon switches with the OS scheme (Chrome/Firefox).
- [ ] Typing `react` in the prompt shows React first, then the projects tagged React, and the page does not move.
- [ ] Enter on `booking` expands and focuses that project.
- [ ] `/wo` + Enter navigates to Work and focuses its heading. `j` focuses the next section's heading. A palette pick focuses the chosen section's heading.
- [ ] Theme picker: arrows preview, Esc reverts, Enter saves across reloads.
- [ ] The help switch turns single-key shortcuts off. `t` then does nothing, `Ctrl K` still works, and the setting survives a reload.
- [ ] Sticky prompts: on desktop the active prompt sits at 49px from the top; on a phone, at 89px and one line tall. The next prompt pushes the previous one out.
- [ ] Phone dock: about 94px at rest, about 45px while scrolling down, back to full size on scroll up or prompt focus.
- [ ] On touch: chips instead of keyboard tips, every tappable item at least 44px tall.
- [ ] Reduced motion: no typing, no spinner animation, no reveal, instant theme change.
- [ ] Spanish: every visible string, the tooltips, `document.title` and `<html lang>` switch.
- [ ] `/portfolio/anything` serves the 404 page with the path shown and working links.
- [ ] A link preview (Slack, LinkedIn or opengraph.xyz) shows the title, description and `og.png`.

---

## 10. Things not to do

- Don't add multi-page routes or case-study pages yet. Everything is one page plus the `#design-system` view.
- Don't reintroduce the old scroll percentage, the theme swatches in the sidebar, the `✻` glyph, the `e` shortcut, or search results appended to the bottom of the page. Each was removed on purpose.
- Don't show the jl logo inside the welcome box title. It shows only the ⠚ spinner while loading.
- Don't use native `title` tooltips; use the shared `[data-tip]` component (`tip-up` variant in the dock).
- Don't use `window.print`, `alert`, `confirm` or `prompt`.
