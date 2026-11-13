---
slug: "booking-system"
lang: "en"
---

### Context

Scheduling, records and billing lived in three tools that disagreed with each other. Staff reconciled them by hand at the end of every week.

### Approach

- One monorepo, two apps: the front desk needs speed, administration needs completeness.
- Shared data models so a record entered once is the same record everywhere.
- Dual-entry accounting, because payments and expenses have to balance whether or not the UI is honest about it.

### What I would measure

Minutes of weekly reconciliation, duplicate records per month, and the time to close a billing period. [Add one metric.]
