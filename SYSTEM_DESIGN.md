# System Design Write-up

## 1. Complaint History Model

A complaint's `status` field (Open / InProgress / Resolved) stores only the *current* state — it cannot, by itself, answer "who changed this, when, and why." To satisfy the requirement for a full audit trail, every status transition is written as an immutable row in a separate `ComplaintHistory` table: `{ complaintId, actorId, oldStatus, newStatus, note, changedAt }`.

This append-only design has three advantages. First, it is a true audit log — rows are never updated or deleted, so the timeline can always be reconstructed exactly as it happened, which matters for accountability in a shared-living context where residents may dispute what was promised. Second, it decouples "current state" from "history," keeping the hot-path query (list complaints by status) cheap, since it reads a single indexed column on `Complaint` rather than aggregating history rows. Third, it generalizes cleanly: the very first "Open" state is logged the same way as any later transition (with `oldStatus = null`), so a resident's complaint page and an admin's audit view both pull from one consistent source.

Status transitions are constrained server-side: `Open → InProgress → Resolved`, with `InProgress → Open` allowed for reopening, but nothing is allowed once a complaint reaches `Resolved` — the API returns 409 on any further mutation attempt. This lifecycle validation lives in the controller, not the database, since Prisma/SQLite enums don't enforce transition rules, only value membership.

## 2. Overdue Detection

Overdue status is **computed at query time** rather than stored as a persisted flag that a background job updates. A complaint is overdue if `status != Resolved` and `now - createdAt > threshold`. This avoids a whole class of staleness bugs: a cron-based approach risks a complaint sitting incorrectly flagged (or unflagged) between job runs, and adds an operational dependency (a scheduler that must run reliably) for a value that's cheap to derive on read.

The threshold itself is configurable, stored in a generic `Setting` key-value table rather than hardcoded, so an admin can change "3 days" to "5 days" without a deploy. The admin complaint list endpoint annotates each complaint with `isOverdue` after fetching, then sorts by `(isOverdue desc, priorityRank asc, createdAt asc)` — overdue items float to the top regardless of priority, and within each overdue/non-overdue group, High priority and older complaints surface first. This mirrors how an admin actually triages: "what's breaching SLA" beats "what's merely important."

The trade-off is that this calculation happens in application code on every list request rather than in a single indexed SQL predicate. At the scale of a single society (dozens to low hundreds of open complaints), this is negligible; if it needed to scale to thousands of societies, the same logic could be pushed into a SQL `CASE WHEN` expression or a materialized column refreshed by a periodic job, without changing the API contract.

## 3. Photo Handling

Photos are uploaded as `multipart/form-data` alongside the complaint fields, validated server-side for MIME type (JPEG/PNG/WEBP only) and size (5MB cap) using `multer`. Only the resulting URL is stored on the `Complaint` row (`photoUrl` column) — never binary data in the database — keeping the DB small and query-fast.

The upload destination is pluggable via an `UPLOAD_STRATEGY` env var: `local` (default) writes to a disk folder served statically at `/uploads/*`, requiring zero external accounts and making the project runnable immediately. `cloudinary` is a drop-in swap for production, where photos should live on durable, CDN-backed storage rather than the app server's ephemeral disk (most PaaS free tiers wipe local disk on redeploy). Because the controller only ever deals with a `photoUrl` string, switching strategies doesn't touch any other layer of the app.

## 4. Notification Flow

Two triggers fire emails: a complaint's status changing, and a new notice being marked important. Both go through the same `emailService`, which is also strategy-pluggable (`console` for local dev — logs the email instead of sending it, so the flow is fully testable with no SMTP account — or `smtp` for real delivery via any free-tier provider).

Both send calls are fire-and-forget from the request handler's perspective: the HTTP response for "update status" or "post notice" does not await email delivery, and a failure is caught and logged rather than propagated. This is a deliberate reliability trade-off — a resident's status update should never fail because an email provider is down or rate-limited; the state change in the database is the source of truth, and the email is a best-effort courtesy on top of it. For important notices specifically, this matters more, since the recipient list is every resident in the society and a single bad address shouldn't block the notice from being created or the other emails from going out — each recipient's send is attempted independently.
