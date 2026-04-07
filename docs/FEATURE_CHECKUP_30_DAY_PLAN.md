# Feature Checkup and Improvement Plan

This plan prioritizes improving existing features before adding major new ones.

## Decision Framework

For each area, decide with:

- Keep as-is
- Improve now (high ROI)
- Build later (new capability)

Scoring model (1-5):

- Business impact
- User frequency
- Risk reduction
- Effort (reverse score: lower effort = higher score)

---

## Feature Matrix (Current App)

### 1) Auth and Session

- **Status:** Working, recently hardened
- **Decision:** Improve now
- **Why:** Core security and reliability impact every role
- **Actions:**
  - Add a small `/api/auth/me` integration test (authorized and unauthorized)
  - Enforce consistent unauthorized response shape across auth-related endpoints
  - Add user-facing session-expired handling in dashboard shell

### 2) Role and Permission System

- **Status:** Improved for expenses and key APIs
- **Decision:** Improve now
- **Why:** Highest regression risk; affects admin trust
- **Actions:**
  - Centralize permission checks in `lib/apiAuth.js` + shared helper for category permission mapping
  - Add matrix tests: ADMIN, WARDEN master, WARDEN granular, no-access user
  - Add explicit UI badges for access mode where sensitive actions exist

### 3) Expenses Module

- **Status:** Functional, permission bug fixed
- **Decision:** Improve now
- **Why:** High-frequency operational workflow
- **Actions:**
  - Standardize mutation error messages and status codes in expenses APIs
  - Add optimistic UI safeguards for inline editing conflicts
  - Add lightweight audit log entries for status changes and deletes

### 4) Payments and Refunds

- **Status:** Hardened endpoints, complex workflows
- **Decision:** Improve now
- **Why:** Financial domain, critical correctness
- **Actions:**
  - Add idempotency key support for sensitive POST routes (reconcile/refund/security-refund)
  - Normalize approval status transitions and reject invalid transitions
  - Add admin-only bulk-approve test coverage

### 5) Users and Profile Management

- **Status:** Core APIs available, broad data exposure risk reduced
- **Decision:** Improve now
- **Why:** PII and identity workflows
- **Actions:**
  - Paginate heavy profile payload segments (`bookings`, `payments`, activity)
  - Add self/admin policy tests for profile routes
  - Mask sensitive fields for non-admin roles where possible

### 6) Hostels and Rooms

- **Status:** Stable, mostly CRUD-driven
- **Decision:** Improve now
- **Why:** Frequent admin/warden usage and data consistency impact
- **Actions:**
  - Add strict role checks on all mutating hostel/room routes
  - Add conflict-safe room creation/edit validation (capacity, duplicates)
  - Add clearer action confirmations for destructive ops

### 7) Reports and Analytics

- **Status:** Useful but heavy and permission-sensitive
- **Decision:** Improve now
- **Why:** Decision-making tool; must be fast and accurate
- **Actions:**
  - Cache report queries by period/hostel with short TTL
  - Add role-aware report scope tests
  - Split global vs hostel report endpoints for predictable payload size

### 8) Audit and Activity Visibility

- **Status:** Present in places, not unified
- **Decision:** Build later (small version now)
- **Why:** Major trust and accountability feature
- **Actions (phase 2/3):**
  - Introduce unified audit event model (`actor`, `action`, `target`, `diff`, `timestamp`)
  - Log critical actions first (permission changes, payment approvals, expense status updates)

### 9) Search, Filtering, and Saved Views

- **Status:** Basic filtering exists
- **Decision:** Build later
- **Why:** UX multiplier after stability baseline
- **Actions:**
  - Add saved filter presets for admin and warden dashboards
  - Add global search only after API pagination and indexing pass

### 10) Notifications and Communication

- **Status:** Email notifications exist
- **Decision:** Improve now
- **Why:** Operational clarity and fewer manual follow-ups
- **Actions:**
  - Add delivery/error telemetry for critical emails
  - Add in-app notification feed for approvals and rejections

---

## 30-Day Execution Plan

## Phase 1 (Days 1-10): Stabilize Critical Flows

- Finish remaining route hardening with `requireAuth/requireRoles/requireSelfOrRoles`
- Add API response consistency for auth/permission failures
- Add permission matrix tests for expenses and payments
- Add smoke tests for login/session bootstrap (`/api/auth/me`)

## Phase 2 (Days 11-20): Reliability and Performance

- Split heavy profile/report payloads and add pagination
- Add short-lived caching for report endpoints
- Add idempotency checks for sensitive payment mutations
- Improve destructive action UX (clear confirmations and feedback)

## Phase 3 (Days 21-30): Quality and Operations

- Add structured audit logging for critical actions
- Add basic in-app notification feed for approvals/rejections
- Expand regression tests for role-based access
- Prepare release checklist and hardening report

### Release Checklist (Hardening Gate)

- Verify auth guard coverage on all write routes (`POST`, `PATCH`, `DELETE`)
- Verify permission updates, payment status updates, and expense status updates emit audit logs
- Run regression tests for permission matrix and auth session bootstrap
- Confirm idempotency behavior for payment reconcile/refund routes with duplicate requests
- Verify report caching and profile pagination do not change response contracts
- Smoke test core journeys: login, create booking, collect payment, approve/reject expense

### Hardening Report Template

- Scope: routes touched, roles impacted, and data models affected
- Security controls: authn/authz, token handling, idempotency, auditability
- Reliability controls: pagination, caching, error response consistency
- Test evidence: unit/integration suite results and manual smoke checks
- Residual risks: known gaps and mitigations with owners and due dates

---

## Immediate Sprint Backlog (Start Now)

1. Add standardized auth/forbidden response helper and migrate top 5 routes.
2. Add permission matrix tests for expense routes.
3. Add idempotency guard for payment reconcile/refund routes.
4. Add profile endpoint pagination for bookings and payments.
5. Add audit event write on payment status update and expense status update.

