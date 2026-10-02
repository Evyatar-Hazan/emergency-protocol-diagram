# Task 60 — Learning assessment and mastery feedback

## Scope

This implementation provides a deterministic, local learning-assessment engine and a draft rubric for `SCN-01`. It is based on the Task 58 competency map and its Task 60 input schema.

The result is **learning feedback only**. It does not establish clinical competence, certify a learner, approve content, replace instructor observation, or authorize action during a live event.

## Current review status

- All Task 58 learning outcomes are `pending`.
- The rubric is `draft_pending_instructor_review`.
- Critical errors remain candidates. Recording one adds review feedback but does not apply a pass/fail rule or score cap.
- Practical skills remain `instructor_only` and cannot be digitally scored.
- Reliability against an instructor rating has not been tested.

## Implemented contract

The `SCN-01` draft rubric contains four observable learning criteria linked to:

- `BLS-C01` / `LO-01-01`: route ordering and scene-entry boundary.
- `BLS-C02` / `LO-01-01`: identification of assessment gates.
- `BLS-C03` / `LO-01-02`: identification of learning-path decision points.
- `BLS-C10` / `LO-01-02`: explanation of the learning-only usage boundary.

Each digitally scored draft criterion uses an explicit `0/1/2` evidence level. The percentage and band are provisional practice indicators. They are never converted to `competent`, `certified`, `approved`, or a clinical claim.

## Local data boundary

Only structured identifiers, evidence ratings, provisional score/band and a critical-error-candidate boolean may be stored in browser storage. Prompts, feedback text, free text, user identifiers, patient information and live-event data are excluded. History is capped at 20 local attempts. No network transport or external provider is used.

## Task 61 event contract

`apps/client/src/assessment/adaptiveReviewEvents.ts` emits an identifier-only `assessment_learning_result_recorded` event. It maps each rubric item to one of:

- `revisit`
- `reinforce`
- `maintain`
- `instructor_required`

The formal payload schema is `task-61-assessment-learning-event.schema.json`. Consumers must validate the event against the active rubric so that item, outcome and competency mappings cannot be substituted. The event contains no learner identifier, prompt, response text, patient data or credential claim.

## Validation boundary

Automated tests cover calculation, feedback, missing evidence, candidate critical errors, practical-skill blocking, local-storage minimization and the Task 61 event contract. These are software tests only; no clinical validation, instructor reliability study, learner pilot, certification review, merge, push or deployment was performed.
