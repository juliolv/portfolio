# Orchestration

How this project uses one orchestrator plus a fleet of cheap subagents, and how
to keep it affordable. The orchestrator is whichever Hermes session the owner is
talking to. The fleet is `delegate_task` children.

Read `docs/state.md` first. This file describes *how* to work; that file
describes *what* is true right now.

## Ground rules

1. **The orchestrator never delegates a decision it must own.** Architecture,
   design taste, what ships, and whether the site is good enough stay in the
   orchestrating session. Children execute bounded work.
2. **Children cannot ask questions.** Every brief must contain the paths, the
   constraints, the acceptance check, and the exact output shape. If a brief
   needs a judgement call, the brief is not ready to dispatch.
3. **Children cannot close work.** Their report is a claim. The orchestrator
   re-runs the verification command before believing it.
4. **Reports are bounded.** Ask for a maximum line count and a format. An
   unbounded report is a context bomb that costs more than the task.
5. **Partition writes.** Children share one filesystem. Two writers on the same
   file set corrupt each other. Either give each writer a disjoint file list, or
   keep writes serial and fan out only reads.

## Roles

| Role | Does | May write | Typical brief |
|---|---|---|---|
| **Orchestrator** | Plans, dispatches, integrates, verifies, commits, updates `docs/state.md` | yes | — |
| **Builder** | Implements one slice against a fixed file list | yes, only its files | "Add `/work/[slug]` using this collection schema; touch only these 3 files" |
| **Auditor** | Read-only checks: a11y, motion, links, i18n, privacy | no | "Report violations with severity + file:line, max 40 lines" |
| **Reviewer** | Reads a diff and argues about it | no | "Find what breaks, not what you would rename" |
| **Researcher** | Pins down an API or version fact | no | "What does Astro 7 change about X? Cite the doc line" |
| **Designer** | Taste, hierarchy, density, affordance, UX critique — judges, never ships | no | "Critique the hero's hierarchy and the three worst affordances; 5 numbered findings" |

Auditors and reviewers are the cheapest, highest-value fan-out: they never
conflict on disk, and their output is short.

## Model tiers

`delegation.model` pins **all** children at once, so models are assigned per
**batch**, not per agent. `node scripts/fleet.mjs` switches the tier:

| Agent | Tier | Model |
|---|---|---|
| Orchestrator | main session | whatever the session runs (currently `deepseek-v4.1-flash`) |
| Builder | code | `deepseek-v4.1-flash` |
| Auditor | code | `deepseek-v4.1-flash` |
| Reviewer | code | `deepseek-v4.1-flash` |
| Researcher | code | `deepseek-v4.1-flash` |
| Designer | design | `gpt-6-luna` |

```sh
node scripts/fleet.mjs design   # children -> gpt-6-luna (design batch)
node scripts/fleet.mjs code     # children -> deepseek-v4.1-flash (work batch)
node scripts/fleet.mjs          # print the roster and what children resolve to
```

**The limitation, stated plainly:** the Designer cannot run on `gpt-6-luna` in
the same batch as builders on `deepseek-v4.1-flash`. Design critiques therefore
run as their own batch (usually one child), and their findings come back to the
orchestrator, which implements them. Per-agent parallel models need the
community `delegation-model-map` plugin (`delegation.backends.model_map`);
it is not installed — ask the owner first.

## Cost model

All children inherit the parent model unless pinned. The parent runs
`deepseek-v4.1-flash` on `opencode-go`, which is already the cheap tier, so the
default fleet is affordable without extra configuration.

Levers, in order of effect:

1. **Fewer, tighter briefs.** Cost scales with child turns, and child turns
   scale with scope. "Audit the whole repo" costs 10× "check these 7 files".
2. **Cap concurrency.** Dispatch 3–4 children, not 10. Parallel children each
   carry their own context; ten of them is ten times the input tokens.
3. **No free models.** Ruled out by the owner: unpredictable quality, rate
   limits and no support path are not worth the saving. Every child runs a paid
   model, and the cheap tier is the floor: `deepseek-v4.1-flash` (default),
   `glm-5.3-flash`, `mimo-v2.6-flash`, `qwen3.8-flash`, `claude-haiku-5-5`.
4. **Pin children cheaper than the parent** when the parent does the thinking:

   ```sh
   hermes config set delegation.model <cheap-model>
   ```

   This applies to *all* children; there is no per-task model in `delegate_task`.
   Per-tier routing would need the `advanced-delegation` plugin's `model_map`.
5. **Never fan out taste.** Ten agents do not improve a design decision; they
   just buy ten opinions and one merge conflict.

## Brief template

```
goal:        one imperative sentence, bounded
context:     repo path, files in scope, what exists already, base path/deploy URL
constraints: read-only or exact file list; public-repo privacy rules; no commits
verify:      the command whose output proves the work (build, astro check, guard)
output:      shape + maximum length, e.g. "numbered findings, severity, file:line, ≤40 lines"
```

## Verification gate

Nothing is "done" until the orchestrator runs, in this order:

```sh
pnpm build
pnpm exec astro check
node scripts/guard-secrets.mjs --all
node scripts/state.mjs
```

plus, for anything visual or interactive, a real browser pass at 1440 and 390
including `prefers-reduced-motion: reduce`. A child saying "tests pass" is not
evidence; the command's output is.

## Handoff

Sessions end without warning. The repo is the memory:

1. `docs/state.md` — milestone, next action, decisions, known issues.
2. `docs/orchestration.md` — this file, the working method.
3. `git log` — the truth about what happened.
4. The `portfolio-orchestrator` skill — the same procedure, loaded automatically
   by any future session that recognises the task.

A session is finished only when `docs/state.md` is updated, committed and pushed.
