# EMS — Manual Test Execution Working Log

App: DijitalBrains EMS (Internee Management System) · v0.1.0
Env: Windows 11, Chrome, Next.js 16 dev @ localhost:3000, MySQL 9.7 @ 3306
Login: admin@db.com / testadmin11
Tester shorthand: H = Hassan (24F-3101), A = Ahmad (24F-3016)
Date: 2026-10-11

## Modules
M1 Authentication · M2 Dashboard · M3 Batches · M4 Internees · M5 Tenures · M6 Lookups · M7 AI Assistant

## Executed (actual results observed in running app)

| TC | Module | Title | Result | Evidence |
|----|--------|-------|--------|----------|
| TC-001 | M1 | Valid admin login (admin@db.com/testadmin11) | PASS — redirected to /dashboard "Hello Admin" | dashboard ss |
| TC-A | M2 | Dashboard KPI accuracy vs DB (6/1/4/100) | PASS — matches DB exactly | dashboard ss |
| TC-B | M2 | Comparison chart internees 2026 (18/23/4=45) | PASS — matches DB 2026 subset | dashboard ss |
| TC-C | M3 | Batch list renders 6 + pagination "1 to 6 of 6" | PASS | batches ss |
| TC-D | M3 | Create Batch empty submit → required errors | PASS — name/date/time/day errors shown | validation ss |
| TC-E | M3 | Create Batch endDate<startDate & endTime<=startTime | PASS — both cross-field errors shown | crossfield ss |
| TC-F | M3 | Create valid batch (QA Automation Batch #7) | PASS — "Batch saved", appears in list, Days=2 | created ss |

## Defect candidates (to confirm/expand)
- DEF?: "Days Of Week" column shows a COUNT (e.g. "2") not the day names; days only in hover tooltip. Header/content mismatch. Severity Minor. (verify tooltip)
- Investigate: batch soft-delete when batch has active tenures (no block?) — code shows no referential check.
- Investigate: OPENAI key present now; assistant behavior.

## More executed
| TC | Module | Title | Result | Evidence |
|----|--------|-------|--------|----------|
| M3 edit | M3 | Batch status transition Upcoming→Closed | PASS | created ss |
| M3 del | M3 | Delete batch #7 (confirm dialog + soft delete) | PASS — dialog states interns keep tenures | delete ss |
| M3 search | M3 | Search "Summer" → 2 rows; empty-state "zzz"; filter ACTIVE→1 | PASS | empty ss |
| M4 list | M4 | Internee list 100 rows + pagination | PASS | list ss |
| M4 req | M4 | Create internee empty → required errors | PASS | req ss |
| M4 ep | M4 | Invalid email "invalidemail" + phone "123" → errors | PASS | ep ss |
| M4 dup | M4 | Duplicate email (exact) → server rejects | PASS | dup ss |
| M4 dupU | M4 | Duplicate email UPPERCASE → rejected (case-insensitive) | PASS | — |
| M4 ws | M4 | Whitespace-only first name → "First name is required" | PASS | ws ss |
| M4 phoneBVA | M4 | Phone "123456" (6 digits) → invalid (min 7) | PASS | ws ss |
| M4 create | M4 | Create valid internee #101 | PASS | — |
| M4 404 | M4 | /internees/999999 → clean 404 | PASS | 404 ss |
| M4 count | M4 | Dashboard total 101 (+1), Fall2026 interns 4→5 | PASS (revalidation) | dash ss |
| M5 req | M5 | Tenure empty → "Select a batch"+date required | PASS | req ss |
| M5 bva | M5 | Score 101 / Semester 21 → range errors | PASS | bva ss |
| M5 create | M5 | Create valid tenure #125 (Fall 2026) | PASS | tenure ss |
| M5 uniq | M5 | Duplicate (internee,batch) → friendly error | PASS | uniq ss |

## DEFECTS (confirmed via execution)
- **DEF-01 (Minor)** Out-of-range pagination not clamped: /internees?page=999 → empty list + invalid footer "Showing 9981 to 101 out of 101 records". Evidence screenshot-...-1.jpg. Also affects batches.
- **DEF-02 (Major)** Internee list Batch chip = latest tenure, not the active batch filter. Filtering Summer 2025 shows rows chipped "Fall 2025"/"Summer 2026". Misleading. Evidence screenshot-...-2.jpg.
- **DEF-03 (Minor)** Server-only validations (degree date order; also cert dates have NO cross-check) surface as generic "Invalid data. Please review the form." with no field highlight — inconsistent with tenure start/end which get inline errors. Evidence screenshot-...-3.jpg.
- **DEF-04 (Minor)** Batches list "Days Of Week" column shows a numeric COUNT (2,5,3) not day names; names only in native title tooltip (not discoverable, fails on touch). Evidence batches list ss.
- **DEF-05 (Trivial)** CV upload label "Supported formats: jpeg, pdf" but input also accepts PNG+WEBP (accept=image/jpeg,png,webp,pdf). Label/behaviour mismatch; "jpeg CV" odd. (code-confirmed)

## Positive robustness notes (NOT defects)
- Case-insensitive email uniqueness; generic login error (no user enumeration); soft-delete w/ clear dialog; revalidation updates counts; 12h time util correct; 404 clean; unique (internee,batch) enforced.
- AI Assistant OUT OF SCOPE (user instruction). It errors due to external OpenAI 429 "no credits" — not an app defect.

## Final executed
| TC | Module | Title | Result | Evidence |
|----|--------|-------|--------|----------|
| M5 degree | M5 | Degree end < degree start → generic "Invalid data" toast, NO field highlight | FAIL (DEF-03) | EV-08 |
| M5 cert | M5 | Cert end (01 Jan 2026) < cert start (01 Dec 2026) → SAVED (no validation) | FAIL (DEF-08) | DB proof |
| M5 delTen | M5 | Delete tenure #127 (confirm dialog + soft delete) | PASS | — |
| M5 inlineBatch | M5 | Inline "+ Create a new batch" opens modal with full form | PASS | — |
| M4 del101 | M4 | Delete internee #101 → cascade soft-delete tenure; counts revert 100/Fall2026=4 | PASS | DB proof |
| M3 nameBVA | M3 | Batch name 101 chars → "Too big: expected string to have <=100 characters" | PASS (but raw msg = DEF-06) | — |
| M1 logout | M1 | Logout → redirect to /login | PASS | — |
| M1 guard | M1 | Access /dashboard while logged out → redirect /login | PASS | — |
| M1 wrongpw | M1 | admin@db.com + wrong pw → generic "Invalid email or password…" | PASS (no enumeration) | EV-09 |
| M1 empty | M1 | Empty login → "Enter a valid email address"+"Password is required" | PASS | — |
| M1 ratelimit | M1 | 5/15min lockout | IMPLEMENTED (code); UI threshold not force-reproduced (submit debounce). Only 4 of 6 rapid attempts registered → correct pw still succeeded. Recommend careful manual retest. |
| M6 lookups | M6 | Dropdowns populated: 15 cities, 14 institutes, 8 degrees, 6 batches | PASS | forms ss |

## FINAL DEFECT LIST (8 confirmed)
- DEF-01 Minor — pagination out-of-range invalid footer "Showing 9981 to 101 of 101" (EV-07)
- DEF-02 Major — internee Batch chip = latest tenure, mismatches active batch filter (EV-06)
- DEF-03 Minor — degree-date order rule server-only → generic toast, no field highlight (EV-08)
- DEF-04 Minor — Batches "Days Of Week" shows numeric count not day names (EV-03)
- DEF-05 Trivial — CV upload label "jpeg, pdf" but accepts png+webp too
- DEF-06 Trivial — raw Zod message "Too big: expected string to have <=100 characters" for over-length batch name
- DEF-07 Trivial — stale server login error persists after a later client-side validation failure
- DEF-08 Major — certificate start/end dates have NO ordering validation; reversed dates saved (DB-verified)

Evidence files: qa-deliverables/evidence/EV-01..EV-10 .jpg
