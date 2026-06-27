# UI/UX Redesign Task List

## Goal

Complete the redesign of the emergency protocol product into a clinically trustworthy, academic, mobile-first learning platform centered on the step-by-step flow.

## Execution Principles

1. Work from foundation to product surface.
2. Finish each phase with visual and functional verification.
3. Keep the step-by-step flow as the central success metric.
4. Avoid partially redesigning isolated components without aligning them to the system.

## Phase 0: Audit Freeze and Alignment

### Task 0.1

Create and approve the redesign source-of-truth documents.

Deliverables:

- approved redesign spec
- approved task list

### Task 0.2

Define a strict product architecture decision.

Decision:

- Learning Path is primary
- Quick Reference is secondary
- Community is supporting but strategic
- Full Diagram is demoted or removed from primary navigation

### Task 0.3

List all visible product surfaces that must follow the redesign.

Surface inventory:

- app shell
- main navigation
- step-by-step screen
- quick reference screen
- comments/community UI
- auth-related surfaces
- empty states
- error states
- loading states

## Phase 1: Brand and Design Foundation

Status: Completed on 2026-06-26

### Task 1.1

Define the brand direction in implementation-ready terms.

Deliverables:

- visual keywords
- tone rules
- anti-pattern list

### Task 1.2

Create a design token system.

Deliverables:

- color tokens
- typography tokens
- spacing scale
- radius scale
- shadow scale
- motion tokens

### Task 1.3

Replace generic typography with a deliberate font pairing.

Requirements:

- Hebrew-friendly
- strong title hierarchy
- excellent mobile readability

### Task 1.4

Create consistent iconography rules.

Requirements:

- decide where emojis remain
- replace core UI semantics with consistent icons

### Task 1.5

Redefine page background and surface system.

Deliverables:

- background treatment
- card surfaces
- elevation rules

Phase 1 implementation note:

- design tokens were added to global CSS and Tailwind
- typography foundation was replaced with a Hebrew-friendly pairing
- emergency colors were normalized into a more clinical palette
- app shell received the first implementation of the new academic-medical visual direction

## Phase 2: Responsive and Layout Infrastructure

Status: Completed on 2026-06-26

### Task 2.1

Fix mobile overflow and horizontal layout breakage.

Verification:

- no horizontal clipping on 390px width
- no off-screen primary CTA

### Task 2.2

Create a responsive shell layout for all main surfaces.

Deliverables:

- top bar or app shell
- mobile-safe content width
- safe spacing rules

### Task 2.3

Define breakpoint behavior for all primary components.

Requirements:

- mobile
- tablet
- desktop

### Task 2.4

Audit every major container for spacing and width consistency.

Phase 2 implementation note:

- mobile horizontal clipping was removed from the step-by-step experience
- top control area was rebuilt to wrap and stack correctly on smaller screens
- content widths were normalized around a shared max-width shell
- node header, content spacing, and next-step action areas now respond more consistently across breakpoints

## Phase 3: Navigation and Product Architecture

Status: Completed on 2026-06-26

### Task 3.1

Redesign the main navigation.

Target structure:

- Learning Path
- Quick Reference
- Community
- Profile

### Task 3.2

Remove Full Diagram from the primary top-level experience.

Options:

- move to secondary tools
- hide behind advanced view
- remove entirely from current MVP

### Task 3.3

Design entry points into Learning Path.

Possible entry methods:

- continue last session
- choose protocol family
- recommended starting modules
- bookmarks

Phase 3 implementation note:

- navigation now treats Learning Path and Quick Reference as the two primary product paths
- Full Diagram was demoted from primary mode selection into a secondary advanced-system tool
- menu framing now explains the product hierarchy directly inside the UI

## Phase 4: Step-by-Step Core Redesign

Status: Completed on 2026-06-26

### Task 4.1

Redesign the step-by-step top context bar.

Remove clutter and establish:

- progress
- location
- severity
- bookmarking
- back

### Task 4.2

Design the node hero section.

Include:

- title
- short description
- why it matters
- severity cue

### Task 4.3

Build a primary clinical action area.

Goal:

- present the immediate step clearly
- make the next action obvious

### Task 4.4

Rebuild content hierarchy inside each node.

New layers:

- Immediate
- Interpretation
- Deep Learning

### Task 4.5

Refactor all current content blocks into the new hierarchy.

Applies to:

- check method
- what to look for
- assessment
- explanation
- treatment
- equipment
- questions
- vitals

### Task 4.6

Design and implement a clear next-step footer.

Requirements:

- strong CTA
- clean branching when multiple options exist
- visible progression logic

### Task 4.7

Remove low-value technical UI from primary focus areas.

Examples:

- raw node ID prominence
- excessive button competition

Phase 4 implementation note:

- the step-by-step screen now uses a narrative hierarchy instead of a flat accordion stack
- the top context bar was rebuilt around protocol context, step count, severity, navigation, and bookmarking
- the node hero now frames each step as a focused clinical learning unit with summary cards and a side focus panel
- content is grouped into immediate action, clinical interpretation, deep learning, and professional discussion
- the next-step footer now presents a stronger single-decision continuation pattern

## Phase 5: Quick Reference Redesign

Status: Completed on 2026-06-26

### Task 5.1

Redesign the quick reference landing structure.

Requirements:

- retrieval-first layout
- minimal narrative overhead

### Task 5.2

Add instant search and filtering.

Filters:

- age group
- ABCDE section
- status/normality if relevant

### Task 5.3

Convert current reference content into compact, scannable cards.

### Task 5.4

Add favorites or saved quick-reference items.

Phase 5 implementation note:

- the quick reference screen was rebuilt into a retrieval-first surface instead of a long academic list
- users can now switch age group, filter by ABCDE section, search by term, and narrow to saved items
- each metric now appears as a compact clinical card with clearer severity/status chips
- a lightweight quick-pick row was added to surface the first most useful metrics without overwhelming the screen

## Phase 6: Community Layer Redesign

Status: Completed on 2026-06-27

### Task 6.1

Reposition comments as a secondary but important layer.

Requirements:

- no longer interrupt the primary learning flow

### Task 6.2

Design a professional comment card system.

Include:

- author role clarity
- timestamps
- reply structure
- helpfulness controls

### Task 6.3

Introduce comment type taxonomy.

Types:

- field tip
- teaching clarification
- question
- instructor note

### Task 6.4

Create polished empty, loading, and error states for community.

Requirements:

- Hebrew-first
- no raw network error feel
- trustworthy messaging

### Task 6.5

Plan future social features.

Future backlog:

- endorsed answers
- FAQ extraction
- profile reputation

Phase 6 implementation note:

- the community layer was reframed as a secondary professional discussion surface instead of a raw technical comment block
- comment entry, loading, empty, and error states were rewritten into Hebrew-first academic-medical messaging
- comment cards now clarify author role, time context, reply depth, and moderation actions more cleanly
- reply and edit flows were integrated into calmer card-based interaction patterns that no longer compete visually with core learning content

## Phase 7: Trust, Language, and Accessibility

Status: Completed on 2026-06-27

### Task 7.1

Remove mixed-language core UI.

### Task 7.2

Audit and improve all critical error states.

### Task 7.3

Audit keyboard and focus behavior.

### Task 7.4

Ensure AA contrast across redesigned surfaces.

### Task 7.5

Improve screen-reader and semantic clarity where needed.

Phase 7 implementation note:

- visible English product labels were reduced across the core learning, quick-reference, auth, and discussion surfaces
- menu, search, bookmark, and next-step interactions received stronger `aria` labeling and expansion state hints
- login and trust messaging were rewritten into Hebrew-first product language
- the product now presents a more consistent trust layer before the final polish and launch pass

## Phase 8: Visual Polish and Product Character

Status: Completed on 2026-06-27

### Task 8.1

Add controlled motion and transitions.

### Task 8.2

Polish empty states and onboarding copy.

### Task 8.3

Refine illustrations, icons, and accent details.

### Task 8.4

Check that the final result feels distinct and not generic.

Phase 8 implementation note:

- shared motion, hover-lift, shimmer, and rise-in behaviors were added to make the product feel intentional rather than static
- key learning and quick-reference surfaces now use more layered polish through texture, sheen, and refined elevation
- loading and hero states were upgraded to feel closer to a finished academic-clinical product

## Phase 9: Verification and Launch Readiness

### Task 9.1

Verify redesigned Learning Path on mobile, tablet, and desktop.

### Task 9.2

Verify Quick Reference performance and usability.

### Task 9.3

Verify Community layer for readability and non-interference.

### Task 9.4

Run final UI/UX regression pass against current feature set.

### Task 9.5

Run production verification after deployment.

Checks:

- live layout
- mobile behavior
- navigation
- language consistency
- community states

## Suggested Execution Order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 6
6. Phase 5
7. Phase 7
8. Phase 8
9. Phase 9

## Definition of Done

The redesign is complete when:

1. Learning Path feels like the clear main product.
2. Mobile step-by-step flow is polished and stable.
3. Quick Reference is genuinely fast to use.
4. Community feels professional and useful.
5. The product has a coherent academic medical visual identity.
6. The production site matches the approved redesign direction.
