
<script>
(function () {
  'use strict';

  /* ========================================================================
     SITE DATA: language-neutral values. Replace placeholders here.
     ======================================================================== */
  var SITE = {
    email: 'you@example.com',
    links: {
      github: 'https://github.com/juliolv',
      linkedin: 'https://www.linkedin.com/in/your-handle',
      cv: 'https://example.com/your-cv.pdf',
      repo: 'https://github.com/juliolv/portfolio',
      pages: 'https://juliolv.github.io/portfolio/'
    },
    work: [
      { slug: 'operations-platform', stack: ['TypeScript', 'React', 'Node.js', 'AWS'], href: null },
      { slug: 'booking-system', stack: ['MongoDB', 'Express', 'React', 'Node.js', 'Monorepo'], href: null },
      { slug: 'storefront', stack: ['Next.js', 'Prisma', 'Tailwind CSS', 'shadcn/ui'], href: null },
      { slug: 'this-site', stack: ['Astro', 'CSS', 'TypeScript', 'Hermes Agent'], href: 'https://github.com/juliolv/portfolio' }
    ],
    devlog: [
      { issue: 1, status: 'done', date: '2026-11-13' },
      { issue: 2, status: 'progress', date: '2026-11-13' },
      { issue: 3, status: 'planned', date: null },
      { issue: 4, status: 'planned', date: null }
    ],
    stack: [
      { dir: 'languages', items: ['TypeScript', 'JavaScript (ES6+)', 'HTML5 / CSS3'] },
      { dir: 'frontend', items: ['React', 'Next.js', 'Tailwind CSS', 'shadcn/ui', 'TanStack Table', 'Redux Toolkit / Zustand', 'MUI'] },
      { dir: 'backend', items: ['Node.js', 'REST APIs', 'Prisma / Drizzle', 'PostgreSQL / MySQL', 'MongoDB', 'Zod / Yup'] },
      { dir: 'infra-tooling', items: ['AWS (Amplify, Lambda, S3, SES)', 'Vercel', 'Docker', 'GitHub Actions', 'Monorepos', 'Git · WSL2 Ubuntu', 'OpenCode · Claude Code', 'Hermes Agent (learning)'] }
    ],
    chips: ['/work', '/devlog', '/contact', '/theme'],
    /* the agents I actually use; 'learning' or 'active' */
    agents: [
      { id: 'hermes', name: 'hermes', status: 'learning' },
      { id: 'opencode', name: 'opencode', status: 'active', subs: ['orchestrator', 'specialists'] },
      { id: 'claude', name: 'claude code', status: 'active' }
    ],
    tips: [
      { id: 'work', label: '/work', act: 'cmd:/work' },
      { id: 'theme', label: '/theme', act: 'cmd:/theme' },
      { id: 'palette', label: '{k}', act: 'palette' },
      { id: 'help', label: '?', act: 'help' }
    ]
  };
  /* Open-source themes mapped onto the token set (see the CSS skin blocks). */
  var SKINS = [
    { id: 'ayu-dark', name: 'Ayu Dark', kind: 'dark', by: 'ayu' },
    { id: 'ayu-light', name: 'Ayu Light', kind: 'light', by: 'ayu' },
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', kind: 'dark', by: 'Catppuccin' },
    { id: 'catppuccin-latte', name: 'Catppuccin Latte', kind: 'light', by: 'Catppuccin' },
    { id: 'dracula', name: 'Dracula', kind: 'dark', by: 'Dracula' },
    { id: 'tokyo-night', name: 'Tokyo Night', kind: 'dark', by: 'enkia' },
    { id: 'nord', name: 'Nord', kind: 'dark', by: 'Arctic Ice Studio' },
    { id: 'rose-pine', name: 'Rosé Pine', kind: 'dark', by: 'Rosé Pine' },
    { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn', kind: 'light', by: 'Rosé Pine' }
  ];
  var SKIN_IDS = SKINS.map(function (s) { return s.id; });

  /* ========================================================================
     I18N: every piece of copy, keyed by section.
     ======================================================================== */
  var I18N = {};
  I18N.en = {
    meta: {
      title: 'Julio López · Senior full-stack software engineer',
      description: 'Portfolio of Julio López, a senior full-stack engineer with 10+ years building web platforms and internal tools, now focused on agentic developer tooling. Built in public with Hermes Agent.'
    },
    a11y: { home: 'Julio, back to top', files: 'Sections', sidebar: 'Session', language: 'Language', theme: 'Theme', prompt: 'Command prompt', menu: 'Commands', skins: 'Quick theme switch' },
    ui: {
      placeholder: 'Search projects and skills, or type / for commands…', hintTouch: 'tap ❯ to search · / commands', menuShort: 'menu', tipMode: 'Mode', tipModel: 'Model', tipVariant: 'Variant', srMode: 'Mode: ', srModel: 'Model: ', srVariant: 'Variant: ', placeholderShort: 'Search, or type /…', hint: '? shortcuts · / commands · {k} palette', hintOff: '{k} palette · /help shortcuts', hintShort: '/ commands',
      copied: 'copied', copyFailed: 'select the address to copy it', close: 'Close', ready: 'ready', matches: 'matches', current: 'current'
    },
    nav: { work: 'work', devlog: 'devlog', experience: 'experience', stack: 'stack', about: 'about', contact: 'contact', design: 'design-system' },
    side: { files: 'Files', todo: 'Todo ', theme: 'Theme', keys: 'keyboard shortcuts', context: 'Context', contextLabel: 'How much of the page you have read',
      tokens: 'tokens', read: 'sections read', agents: 'Agents', learning: 'learning', active: 'active' },
    agents: {
      hermes: 'building this site · {issue}', opencode: 'AI code review in GitHub Actions', claude: 'everyday coding, remote sessions',
      orchestrator: 'orchestrator · read-only', specialists: 'specialist reviewers'
    },
    status: { done: 'done', progress: 'in progress', planned: 'planned', tbd: 'TBD' },
    hero: {
      role: 'senior full-stack software engineer',
      pitch: 'Senior engineer with 10+ years across the full development lifecycle. I turn legacy systems into fast, cloud-native web platforms and build the internal tools teams run on. Lately I focus on agentic developer tooling, like AI-assisted code review that runs in GitHub Actions.',
      cv: 'Download CV', email: 'Copy email',
      available: 'available', availableNote: 'for senior full-stack roles · [City, time zone] · remote friendly',
      profile: 'Profile', tipsTitle: 'Try this',
      card: [['role', 'Senior software engineer'], ['experience', '10+ years, since 2015'], ['focus', 'Web platforms, internal tools, AI-assisted dev workflows'], ['stack', 'TypeScript · React · Next.js · Node.js · AWS'], ['speaks', 'Spanish (native) · English (professional)'], ['based', '[City, country]']],
      tips: { work: 'See selected work', theme: 'Try a color theme', palette: 'Command palette', help: 'Keyboard shortcuts' }
    },
    work: {
      q: 'What has Julio built?', note: 'Placeholder projects for now. Select a row to expand it. Full case studies are in progress.', view: 'View the repo', soon: 'case study in progress',
      labels: { problem: 'Problem', role: 'Role', stack: 'Stack', outcome: 'Outcome' },
      items: [
        { period: '20XX — present', name: 'Operations platform', problem: 'An enterprise operations platform outgrew its legacy framework and the web interfaces built on top of it.', role: '[Placeholder.] Senior engineer leading a multi-year migration.', outcome: 'Modern full-stack ecosystem with internal tools for proprietary workflows. [Add one metric.]' },
        { period: '20XX — present', name: 'Booking and scheduling system', problem: 'One business needed a single system for records, scheduling and billing instead of three disconnected tools.', role: '[Placeholder.] Freelance engineer. Designed the monorepo behind the client and admin apps.', outcome: 'Shared data models across apps and dual-entry accounting. [Add one metric.]' },
        { period: 'planned', name: 'E-commerce storefront', problem: 'A small retailer needed fast pages, strong SEO, secure payments and automated inventory.', role: '[Placeholder.] Built from scratch as a technical showcase.', outcome: 'In progress. Payments, inventory and storefront are being built in the open.' },
        { period: '2026', name: 'This portfolio', problem: 'I wanted to learn an agent-driven workflow on a real project and show the process, not only the result.', role: 'Design, engineering and writing, with the agent as a pair.', outcome: 'A bilingual site with a public design system. [Add one metric.]' }
      ]
    },
    devlog: {
      q: 'How is he learning Hermes Agent?', issue: 'issue', repo: 'Public repo', hosted: 'Published from the repo with',
      intro: 'I am learning Hermes Agent, the open-source agent from Nous Research, by using it to build this site. Each phase is a GitHub issue, and this list follows them.',
      items: [
        { title: 'Environment setup', note: 'Run Hermes Agent in Docker with a reproducible config, and write down what tripped me up.' },
        { title: 'Design system', note: 'Tokens, skins and components for the TUI design language. You are looking at the first pass.' },
        { title: 'Content and case studies', note: 'Replace placeholders with real projects, experience and a CV.' },
        { title: 'Publish', note: 'Port to the final stack, deploy to GitHub Pages and write the retrospective.' }
      ]
    },
    experience: {
      q: 'Where has he worked?',
      items: [
        { when: '20XX — present', role: 'Senior Software Engineer', org: 'Example Corp', text: '[Scope, the systems you own, and one measurable outcome.]' },
        { when: '20XX — 20XX', role: 'Mid-Level Software Engineer', org: 'Example Inc', text: '[End-to-end feature ownership and the consolidation of a fragmented codebase.]' },
        { when: '20XX — 20XX', role: 'Junior Software Engineer', org: 'Example Ltd', text: '[Building and maintaining modules for business applications.]' },
        { when: '20XX — 20XX', role: 'BSc in Computer Science', org: 'Example University', text: '[Thesis topic or honours.]', edu: true }
      ]
    },
    stack: { q: 'What does he build with?', groups: ['Languages', 'Frontend', 'Backend and data', 'Infrastructure, tooling and AI-assisted workflows'] },
    about: {
      q: 'Who is Julio?',
      body: ['I am Julio, a software engineer with a decade of shipping web products. I like software that feels obvious to use and stays calm to maintain, and I care about the small details that make both true.', 'Lately most of my curiosity goes into agentic developer tooling. I designed an automated code review workflow for GitHub Actions, with a read-only orchestrator, specialist subagents and review comments that update in place instead of piling up. I work from WSL2 on Ubuntu, and I am learning Hermes Agent by building this site in public.', '[Add one or two sentences: what you value in a team and what you do away from the keyboard.]']
    },
    contact: {
      q: 'How do I reach him?', lede: 'The fastest way is email. I usually reply within a day.',
      copy: 'Copy', open: 'Open in mail app', colophon: 'Built in public with Hermes Agent. No frameworks, no trackers.', colophonLink: 'See the design system'
    },
    cmd: {
      work: 'Selected work', devlog: 'Building in public', experience: 'Experience', stack: 'Stack', about: 'About', contact: 'Contact', design: 'Design system',
      theme: 'Choose a color theme', lang: 'Switch language', copy: 'Copy email address', hire: 'Jump to contact and copy email', help: 'Keyboard shortcuts',
      clear: 'Clear search results', github: 'Open GitHub', linkedin: 'Open LinkedIn', cv: 'Open CV', repo: 'Open the portfolio repo'
    },
    search: { result: '{n} matches for "{q}"', none: 'No matches for "{q}". Try a skill like react, or type / for commands.', unknown: 'Unknown command {c}. Type / to see all commands.', badarg: 'Unknown option {a} for {c}.', running: 'running' },
    palette: {
      title: 'Command palette', placeholder: 'Type a command or search…', empty: 'No matching commands.', hNav: 'navigate', hRun: 'run', hClose: 'close',
      gGo: 'Go to', gApp: 'Appearance', gLinks: 'Links', gActions: 'Actions', themePrefix: 'Theme: ', langPrefix: 'Language: '
    },
    themes: {
      title: 'Choose a theme', note: 'Colors preview as you move.', hMove: 'preview', hApply: 'apply', hCancel: 'cancel',
      dark: 'dark', light: 'light', desc: { system: 'follows your OS · Ayu' }
    },
    help: {
      title: 'Keyboard shortcuts', inPrompt: 'In the prompt', always: 'Always on', single: 'Single-key shortcuts',
      toggle: 'Single-key shortcuts', on: 'on', off: 'off',
      toggleNote: 'These fire on one key press. Turn them off if they get in the way of a screen reader, voice control or typing.',
      alwaysRows: [['{k}', 'Command palette'], ['esc', 'Close, or leave the prompt']],
      singleRows: [['/', 'Focus the prompt'], ['?', 'Show this help'], ['t', 'Choose a theme'], ['l', 'Switch language'], ['j / k', 'Next / previous section']],
      prompt: [['↑ ↓', 'Move in the command list'], ['tab', 'Complete the command'], ['enter', 'Run it']]
    },
    ds: {
      q: 'Show me the design system.', title: 'Design system', lede: 'The tokens, skins and components this site is built from. Values are read live from the page, so they change with the skin.',
      tabTokens: 'tokens', tabSkins: 'skins', tabComponents: 'components',
      color: 'color', colorNote: 'Each theme keeps its own accent, used for what is active or actionable. Status colors are the theme’s own green, yellow and red, and always come with a glyph and a label.',
      type: 'type (mono)', space: 'space (4px base)', shape: 'radius and border', motion: 'motion', motionNote: 'Select a row to play it. Durations drop to zero under prefers-reduced-motion.', layers: 'z-index',
      sample: 'Sharp, quiet, confident.', skinsNote: 'Nine open-source themes plus system, which uses Ayu Dark or Ayu Light to match your OS. Each keeps its official palette, mapped onto the same tokens. Colors that fail WCAG AA are adjusted just enough to pass, mostly in the light themes. Select a card to apply it.',
      sPrimary: 'Primary', sDefault: 'Default', sDisabled: 'Disabled', sLink: 'Inline link', sTipTarget: 'Hover or focus me', sTip: 'Tooltip text',
      sThemeBtn: 'Theme picker', sPaletteBtn: 'Command palette', sPrompt: 'What has Julio built?', sResult: 'Result text sits under the tool call.',
      sLogo: 'The jl mark: a j followed by a block cursor that doubles as the l. It is the title bar logo and the favicon, which switches between Ayu Dark and Ayu Light with your OS. ⠚, the letter j in Braille, appears only while something is loading.',
      sTodo: 'Design system', sRole: '[Role title]', sOrg: '[Company] · [Place]'
    }
  };
