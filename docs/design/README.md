# Design references

Tracked design artifacts live here. The rule is one line: **placeholder data
only**.

## What belongs here

A design file that has already been scrubbed — fictional employers, `20XX`
dates, `[Add one metric.]`, `you@example.com`. Something a stranger could read
without learning anything about a real person or client.

## What does not

The raw export from Claude, Figma or anywhere else, straight out of the session
that produced it. Those carry real names, real dates and a real email by default.
They go in `/design/` at the repo root, which is gitignored:

```
design/                      ← gitignored, raw exports, never committed
docs/design/                 ← tracked, scrubbed references
```

## Workflow

1. Drop the raw file in `design/`.
2. Say what it is (a direction to refine, or the final look to reproduce).
3. It gets scanned — denylist terms, personal emails, phone numbers, credential
   shapes — and the findings are reported before anything is staged.
4. Only the clean copy is committed here, by hand, not by `git add -A`.

The pre-commit hook is the backstop: it blocks the commit if a denylisted term
or a credential shape appears in a staged file. It is not a reason to skip the
scan — the denylist only knows the names we already thought of.
