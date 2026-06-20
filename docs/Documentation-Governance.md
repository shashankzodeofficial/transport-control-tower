# Documentation Governance
## Transport Control Tower (TCT)

**Version:** 1.0
**Effective Date:** 2026-06-19
**Owner:** Shashank Zode, Transport Transformation Leader
**Applies To:** All contributors, feature branches, and releases

---

## Purpose

This document establishes mandatory documentation standards for the Transport Control Tower project. No development task is considered complete until the relevant documentation is updated. This governance ensures that the `docs/` folder always reflects the live system — not a snapshot from an earlier sprint.

---

## Table of Contents

1. [The Completion Rule](#1-the-completion-rule)
2. [Documentation Trigger Matrix](#2-documentation-trigger-matrix)
3. [Mandatory Update Rules](#3-mandatory-update-rules)
4. [Templates](#4-templates)
   - [4.1 Release Template](#41-release-template)
   - [4.2 Change Request Template](#42-change-request-template)
   - [4.3 Enhancement Template](#43-enhancement-template)
5. [Doc File Ownership Map](#5-doc-file-ownership-map)
6. [Review Checklist](#6-review-checklist)
7. [Violation Consequences](#7-violation-consequences)

---

## 1. The Completion Rule

> **A development task is NOT complete until all triggered documentation files are updated, reviewed, and committed in the same branch as the code change.**

"Done" means:
- Code written and tested
- Documentation updated (per §2 trigger matrix)
- Both committed together — doc updates must not be a follow-up commit

This rule applies to:
- New features
- Bug fixes that change observable behaviour
- Refactors that change data shapes, API contracts, or workflow logic
- Configuration changes that affect deployments
- Any removal or deprecation

---

## 2. Documentation Trigger Matrix

Use this matrix to determine which doc files must be updated for any given change. Check every row. Multiple docs may be triggered by a single change.

| Change Type | Change-Log | API-Spec | Process-Flows | Data-Dictionary | Release-Notes | Future-Roadmap |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| New feature or module | ✅ | If API added | If workflow added | If entity added | ✅ on release | Remove from roadmap |
| New API endpoint | ✅ | ✅ | If flow changed | — | ✅ on release | — |
| API endpoint modified (params, response shape) | ✅ | ✅ | If flow changed | If entity changed | ✅ on release | — |
| API endpoint removed | ✅ | ✅ | If flow changed | — | ✅ on release | — |
| New database entity / table | ✅ | If API added | If flow changed | ✅ | ✅ on release | — |
| Entity field added, renamed, or removed | ✅ | If exposed in API | — | ✅ | ✅ on release | — |
| New enum value | ✅ | If in request/response | — | ✅ | ✅ on release | — |
| Enum value renamed or removed | ✅ | ✅ | — | ✅ | ✅ on release | — |
| Workflow step added or reordered | ✅ | If API changes | ✅ | — | ✅ on release | — |
| Workflow step removed | ✅ | If API changes | ✅ | — | ✅ on release | — |
| Business rule change | ✅ | If enforced by API | ✅ | If affects fields | ✅ on release | — |
| Bug fix (no behaviour change) | ✅ | — | — | — | ✅ on release | — |
| Bug fix (behaviour change) | ✅ | If API affected | If flow affected | If data affected | ✅ on release | — |
| Performance optimisation | ✅ | — | — | — | ✅ on release | — |
| New planned enhancement identified | — | — | — | — | — | ✅ |
| Enhancement delivered | ✅ | Per above rows | Per above rows | Per above rows | ✅ on release | ✅ remove |
| Enhancement cancelled | — | — | — | — | — | ✅ remove/note |
| Dependency upgrade (breaking) | ✅ | If contract changed | — | — | ✅ on release | — |
| Dependency upgrade (non-breaking) | ✅ | — | — | — | ✅ on release | — |
| Configuration / env change | ✅ | If affects base URL or auth | — | — | ✅ on release | — |
| Release cut | ✅ | — | — | — | ✅ | — |

---

## 3. Mandatory Update Rules

### Rule 1 — Feature Changes → Change-Log.md

**Trigger:** Any code change that adds, removes, or alters observable behaviour.

**What to add:**
- Which version section it belongs to (use `[Unreleased]` until the version is tagged)
- Category: `Added`, `Changed`, `Fixed`, `Removed`, or `Deprecated`
- One-line description of the change — what changed and why, not how
- Reference the affected file or module in parentheses

**Not required for:**
- Comment-only changes
- Code formatting / linting fixes with zero behaviour change
- Renaming internal variables that have no external surface

**Format:** See [4.2 Change Request Template](#42-change-request-template).

---

### Rule 2 — API Changes → API-Spec.md

**Trigger:** Any addition, modification, or removal of an endpoint, request parameter, response field, or error code.

**What to update:**
- Add the new endpoint section under the correct module group
- Update the request payload table if parameters changed
- Update the response payload JSON example if the shape changed
- Add new error codes to both the endpoint's error table and §15 Common Error Code Reference
- Remove or mark `[REMOVED in vX.Y.Z]` any deleted endpoints — do not silently delete them

**Accuracy requirement:** Every field name in API-Spec.md must match the TypeScript interface exactly. If a TypeScript interface changes, API-Spec.md must change in the same commit.

**Format:** Follow the structure established in §2 through §14 of `docs/API-Spec.md`. Use the same heading pattern: Endpoint Name, Method, Description, Request Payload, Response Payload, Authentication Requirement, Error Codes.

---

### Rule 3 — Workflow Changes → Process-Flows.md

**Trigger:** Any change to the sequence of steps in a business process, state machine, or user-facing workflow.

**What to update:**
- The relevant workflow section (stage order, step names, decision points)
- ASCII flow diagram if the shape changes
- Business rules that govern the flow
- Edge cases section if new cases emerge

**Trigger examples:**
- A new `LifecycleStatus` stage is inserted or removed
- The dispatch board adds a new tab
- The exception acknowledgement flow gains a new field
- A new reconciliation state is added between `in_progress` and `approved`

---

### Rule 4 — Database/Entity Changes → Data-Dictionary.md

**Trigger:** Any change to a TypeScript interface, enum, or mock data structure that represents a stored or transferred entity.

**What to update:**
- The entity table (add row for new field, update type or nullable status, remove row for deleted field)
- The enumeration section if enum values change
- The computed field definitions section if a formula changes
- The relationship map if a new FK-like reference is introduced

**Accuracy requirement:** Field names in Data-Dictionary.md must be copied verbatim from the TypeScript source. No paraphrasing. If the TypeScript uses `huCount`, the doc must say `huCount` — not `hucount` or `hu_count`.

---

### Rule 5 — Releases → Release-Notes.md

**Trigger:** Every version tag cut on the `main` branch.

**What to add:**
- New `## [vX.Y.Z] — YYYY-MM-DD` section above the previous release
- Summary line (one sentence — what this release is about)
- Subsections: Added, Changed, Fixed, Removed (only include subsections that have entries)
- Each entry references the relevant module or file
- Update `[Unreleased]` → cut it into the version section; create a fresh empty `[Unreleased]` section above

**Versioning convention:**
- `vX.0.0` — breaking change (API contract change, major workflow change, data model incompatibility)
- `vX.Y.0` — new feature or significant enhancement (backward-compatible)
- `vX.Y.Z` — bug fix or patch (no new capability)

**Format:** See [4.1 Release Template](#41-release-template).

---

### Rule 6 — Enhancements → Future-Roadmap.md

**Trigger A — New enhancement identified:** When any stakeholder identifies a future improvement that will not be in the current sprint, add it to the roadmap under the appropriate phase.

**Trigger B — Enhancement delivered:** When a roadmap item is implemented, remove it from Future-Roadmap.md and ensure it appears in Change-Log.md and Release-Notes.md.

**Trigger C — Enhancement cancelled:** Add a brief note under the phase: `~~Item name~~ — Cancelled YYYY-MM-DD: reason`.

**Format:** See [4.3 Enhancement Template](#43-enhancement-template).

---

## 4. Templates

---

### 4.1 Release Template

Copy this block into `Release-Notes.md` when cutting a new version. Place it above the previous release section.

```markdown
## [vX.Y.Z] — YYYY-MM-DD

### <One-sentence summary of what this release delivers>

#### Added
- **`ComponentOrModuleName`** — Description of what was added and why. (Closes enhancement: Phase N item name from Future-Roadmap.md)

#### Changed
- **`ComponentOrModuleName`** — Description of what changed. Note any backward-compatibility impact.

#### Fixed
- **`ComponentOrModuleName`** — Description of the bug and what the correct behaviour now is.

#### Removed
- **`ComponentOrModuleName`** — Description of what was removed. Note migration path if applicable.

#### Known Issues
- Description of any known issues shipping in this version and the workaround.

---
```

**Rules for filling it in:**
- Use only the subsections that have entries. Remove empty subsections.
- `ComponentOrModuleName` should be the page, context, hook, or utility affected — e.g. `ExceptionBoard`, `FilterContext`, `useActiveFilters`.
- Do not copy the entire Change-Log entry; Release Notes is a reader-friendly summary, Change-Log is the detailed record.
- If the release closes a Future-Roadmap item, reference it explicitly.

---

### 4.2 Change Request Template

Copy this block into the `[Unreleased]` section of `Change-Log.md` for every development task.

```markdown
### [Unreleased]

#### Added
- `ModuleName` — Short description of the new capability. Explain the why, not the how.

#### Changed
- `ModuleName` — What changed and the reason for the change.
  - Sub-detail if the change has multiple distinct parts.

#### Fixed
- `ModuleName` — Bug description. State what the wrong behaviour was and what it is now.

#### Removed
- `ModuleName` — What was removed and why. If it was deprecated first, note when.

#### Deprecated
- `ModuleName` — What is being deprecated, what replaces it, and when it will be removed.
```

**Documentation checklist for the developer (attach to every PR/commit):**

```
Change Request Documentation Checklist
=======================================
Task / Feature: _______________________________________________
Developer:      _______________________________________________
Date:           _______________________________________________
Version target: _______________________________________________

Trigger Matrix — check all that apply and confirm doc is updated:

[ ] Change-Log.md updated under [Unreleased]
    Category used: Added / Changed / Fixed / Removed / Deprecated

[ ] API-Spec.md updated
    Endpoints added:    ________________________________________
    Endpoints changed:  ________________________________________
    Endpoints removed:  ________________________________________
    N/A — no API surface change

[ ] Process-Flows.md updated
    Workflow affected:  ________________________________________
    N/A — no workflow change

[ ] Data-Dictionary.md updated
    Entities changed:   ________________________________________
    Fields added:       ________________________________________
    Fields removed:     ________________________________________
    Enums changed:      ________________________________________
    N/A — no data shape change

[ ] Release-Notes.md — will be updated at release cut (not per-task)

[ ] Future-Roadmap.md updated
    Item implemented (removed from roadmap): ___________________
    New item added: ____________________________________________
    N/A — no roadmap impact

Confirmation:
[ ] All triggered docs updated in this same branch/commit
[ ] No doc file references a field or endpoint that no longer exists in code
[ ] All TypeScript field names in docs match the source exactly (case-sensitive)
```

---

### 4.3 Enhancement Template

Copy this block when adding a new item to `Future-Roadmap.md`.

```markdown
### N.X <Enhancement Title>

**Priority:** P0 / P1 / P2 / P3
**Effort:** Small / Medium / Large / X-Large
**Status:** Concept / Planned / In Progress / Delivered / Cancelled
**Requested by:** <Stakeholder name or role>
**Requested on:** YYYY-MM-DD
**Target phase:** Phase N — <Phase name>

#### Problem Statement
One paragraph describing the current gap or pain point this enhancement addresses. Be specific — what breaks, what is missing, what is slow.

#### Proposed Solution
One paragraph describing the intended approach. Do not over-specify implementation detail; this is a planning document, not a design doc.

#### Success Criteria
- Bullet list of measurable outcomes that define "done"
- e.g. "OTD filter applies correctly to carrier scorecard"
- e.g. "Alert SLA closure time visible on CT Alerts analytics tab"

#### Dependencies
- List any other roadmap items, integrations, or infrastructure this enhancement depends on
- e.g. "Requires Phase 1 Backend API Integration to be live"

#### Doc Files That Will Need Updating When Delivered
- [ ] Change-Log.md
- [ ] API-Spec.md (if applicable)
- [ ] Process-Flows.md (if applicable)
- [ ] Data-Dictionary.md (if applicable)
- [ ] Release-Notes.md
- [ ] Future-Roadmap.md (remove this item)
```

**When an enhancement is delivered:**

1. Remove the enhancement block from `Future-Roadmap.md`
2. Update the roadmap summary table: change status to `Delivered` in the row, then remove the row in the next roadmap review
3. Add a `Change-Log.md` entry under `[Unreleased]`
4. Add to `Release-Notes.md` at the next version cut with a reference: `(Closes Phase N: Enhancement Title)`

**When an enhancement is cancelled:**

Replace the full block with a single line:

```markdown
~~N.X Enhancement Title~~ — Cancelled YYYY-MM-DD: <one-line reason>
```

---

## 5. Doc File Ownership Map

Each documentation file has a single accountable owner. The owner is responsible for reviewing that their file is accurate before any release is tagged.

| File | Purpose | Owner Role | Update Frequency |
|---|---|---|---|
| `docs/Change-Log.md` | Detailed record of all changes per version | Lead Developer | Every commit with behaviour change |
| `docs/API-Spec.md` | Planned API contracts derived from TypeScript interfaces | Backend Lead / Lead Developer | Every API surface change |
| `docs/Process-Flows.md` | Business workflows, state machines, decision logic | Product Owner / Lead Developer | Every workflow change |
| `docs/Data-Dictionary.md` | All entities, fields, types, relationships, computed formulas | Lead Developer | Every data model change |
| `docs/Release-Notes.md` | Reader-friendly release summaries | Release Manager / Lead Developer | Every version tag |
| `docs/Future-Roadmap.md` | Planned enhancements by phase and priority | Product Owner | When items added, delivered, or cancelled |
| `docs/Architecture.md` | System architecture, component topology, tech stack | Lead Developer | When architecture changes |
| `docs/PRD.md` | Product requirements and module specifications | Product Owner | When module scope changes |
| `docs/Documentation-Governance.md` | This file — governance rules and templates | Lead Developer | When governance rules change |

---

## 6. Review Checklist

Run this checklist before tagging any release.

```
Pre-Release Documentation Review
==================================
Release version:  _______________________________________________
Review date:      _______________________________________________
Reviewer:         _______________________________________________

CHANGE-LOG.MD
[ ] [Unreleased] section has entries for all changes in this release
[ ] No entry references a file or component that was renamed without updating the entry
[ ] All entries use the correct category (Added / Changed / Fixed / Removed)
[ ] [Unreleased] will be renamed to [vX.Y.Z] — YYYY-MM-DD at release cut

API-SPEC.MD
[ ] Every endpoint in the codebase has a matching section in API-Spec.md
[ ] No endpoint in API-Spec.md references a field that no longer exists in the TypeScript interface
[ ] All new error codes from this release appear in both the endpoint section and §15
[ ] Response payload JSON examples match the current TypeScript interface field names exactly
[ ] Authentication requirements reflect the current role set

DATA-DICTIONARY.MD
[ ] Every TypeScript interface that represents a data entity has a table in §1
[ ] All field names are copied verbatim from source (case-sensitive)
[ ] Nullable column is accurate — fields without `?` in TypeScript are marked No
[ ] All enumeration values in §2 match the TypeScript source
[ ] Computed field formulas in §8 reflect the current implementation

PROCESS-FLOWS.MD
[ ] Every module listed in the router has a corresponding workflow section
[ ] Stage orders in lifecycle sections match LIFECYCLE_STAGES array order
[ ] Hub and destination status orders match STATUS_ORDER constants
[ ] Business rules reflect current implementation, not intended future state

RELEASE-NOTES.MD
[ ] A new release section exists for this version
[ ] Summary line accurately describes the release theme
[ ] All significant changes appear (does not need to repeat every line of Change-Log)
[ ] Known issues section is present if anything ships with a known defect

FUTURE-ROADMAP.MD
[ ] Items delivered in this release have been removed from the roadmap
[ ] Roadmap summary table status column is current
[ ] No roadmap item is described as "planned" if it was cancelled

Sign-off:
[ ] All checklist items passed
[ ] Release may be tagged
```

---

## 7. Violation Consequences

### What constitutes a governance violation

1. Code is committed to `main` without updating triggered documentation
2. A documentation file references a field, endpoint, or module that no longer exists in the codebase
3. A TypeScript field name in any doc file does not match the source exactly
4. A release is tagged without a corresponding Release-Notes.md entry
5. A Future-Roadmap item is delivered without being removed from the roadmap

### How violations are handled

| Severity | Example | Action |
|---|---|---|
| Critical | Release tagged with no Release-Notes entry | Block merge; doc must be updated before release |
| High | API-Spec.md references a field deleted from TypeScript | Must be fixed in the next commit; flagged in review |
| Medium | Change-Log missing an entry for a delivered fix | Add in next commit; noted in PR review |
| Low | Roadmap item still listed as "Planned" after delivery | Clean up in next routine doc review |

### Routine documentation review cadence

- **Per-commit:** Developer self-checks the change request documentation checklist (§4.2)
- **Per-release:** Full pre-release documentation review (§6)
- **Monthly:** Owner of each doc file reviews their file for staleness; updates anything that drifted from the codebase
- **Quarterly:** Full audit — read the docs against the live source code; file discrepancies as issues

---

## Appendix — Documentation File Index

| File | Last Verified Against Code | Current Version |
|---|---|---|
| `docs/Change-Log.md` | 2026-06-19 | v1.3.0 |
| `docs/API-Spec.md` | 2026-06-19 | v3.0 |
| `docs/Process-Flows.md` | 2026-06-19 | v2.0 |
| `docs/Data-Dictionary.md` | 2026-06-19 | v3.0 |
| `docs/Release-Notes.md` | 2026-06-19 | v1.3.0 |
| `docs/Future-Roadmap.md` | 2026-06-19 | v1.0 |
| `docs/Architecture.md` | 2026-06-19 | v2.0 |
| `docs/PRD.md` | 2026-06-19 | v2.0 |
| `docs/Documentation-Governance.md` | 2026-06-19 | v1.0 |
