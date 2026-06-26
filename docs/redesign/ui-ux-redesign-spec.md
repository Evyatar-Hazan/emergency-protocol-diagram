# UI/UX Redesign Spec

## Project Framing

The product should become a clinical learning platform for emergency medicine trainees.
It is primarily a guided academic learning experience, with an aspirational path toward real-world relevance before or after live incidents.

This is not a pure field operations tool.
It is not a generic content site.
It is not a social feed.

It should feel like a modern medical learning system:

- trustworthy
- academic
- clinically sharp
- mobile-first
- visually memorable
- socially professional

## Core Product Narrative

The interface should communicate:

1. Learn to think like a medic, step by step.
2. Every screen presents one clear clinical decision or learning unit.
3. Deeper context is always available, but never overwhelms the core action.
4. Fast reference information is immediately accessible.
5. Professional discussion strengthens the learning journey.

Primary message:

`Learning clinical reasoning for emergency care, one step at a time.`

## Product Priorities

1. Step-by-step learning flow is the main product.
2. Quick vital signs reference is the secondary high-value utility.
3. Professional discussion/community is the tertiary but strategic layer.
4. Full flow diagram is no longer a primary experience.

## Recommended Information Architecture

### Primary Navigation

1. Learning Path
2. Quick Reference
3. Community
4. Profile

### Learning Path

This is the primary experience and should include:

- onboarding or entry selection
- guided node-by-node flow
- learning mode
- future practice mode
- bookmarks and review
- node-specific professional discussion

### Quick Reference

This should function as a compact retrieval tool:

- age group switching
- ABCDE filters
- search
- favorites
- compact cards

### Community

This should support high-trust professional interaction:

- node-based discussions
- questions
- clarifications
- field tips
- instructor-endorsed guidance

## Visual Direction

### Tone

- academic
- clinical
- premium
- calm
- precise

### Aesthetic

Editorial medical interface.
Not military.
Not generic SaaS.
Not playful consumer social.

### Emotional Effect

The user should feel:

- guided
- safe
- focused
- intellectually engaged
- proud to use the product

## Design System Direction

Implementation checkpoint on 2026-06-26:

- global design tokens established in CSS and Tailwind
- foundation typography shifted away from default system styling
- shell-level surface, background, and header treatment introduced

### Typography

Use a more distinctive Hebrew-friendly typographic system.
Avoid relying only on Segoe UI or other default system-feeling combinations.

Recommended structure:

- Display font for titles and section framing
- Refined sans-serif for body text
- Monospace only for rare technical/internal metadata

Typography goals:

- high readability on mobile
- strong hierarchy
- professional academic feel

### Color System

Adopt a restrained clinical palette:

- warm ivory / soft paper base
- surgical blue or deep teal as primary
- slate and deep graphite for text
- amber for educational emphasis
- controlled red for urgent warnings
- measured green for stable or correct states

Color must signal meaning, not just decorate blocks.

### Iconography

Reduce emoji-heavy UI.
Replace the core interface language with a coherent icon system.
Emojis may remain only where they add warmth without weakening trust.

### Background and Surfaces

Replace flat generic gray backgrounds with a more intentional atmosphere:

- soft textured light surface
- subtle gradients
- layered cards with stronger composition
- elevated but calm shadows

### Motion

Use minimal but meaningful motion:

- staged page entry
- smooth node transition
- refined section expansion
- no noisy micro-interactions

## Experience Principles

1. One primary action per screen.
2. Immediate content first, interpretation second, deep learning third.
3. Secondary tools must not compete with the current step.
4. Mobile usability is mandatory.
5. Language must be consistently Hebrew-first in the visible product.
6. Community should support the journey without interrupting it.
7. The interface should feel clinically authoritative, not technically improvised.

## Step-by-Step Experience Redesign

### Goal

Turn each node into a narrative clinical learning card instead of a stack of equal accordions.

### Recommended Screen Structure

1. Top context bar
2. Node hero
3. Primary clinical action zone
4. Core assessment details
5. Interpretation and deeper learning
6. Community layer
7. Next-step footer

### 1. Top Context Bar

Should include:

- current path or section
- step count or progress
- severity/status
- bookmark
- back

Should not include:

- prominent raw internal node IDs
- too many competing controls

### 2. Node Hero

Should include:

- strong title
- concise subtitle
- why this matters
- severity signal

This area should establish confidence and orientation instantly.

### 3. Primary Clinical Action Zone

This is the most important area of the screen.
It should contain the immediate task:

- what to assess
- what question to answer
- what branch to choose
- what action to take next

### 4. Core Assessment Details

This layer should include:

- how to check
- what to look for
- red flags

It should remain easy to scan and not feel like documentation clutter.

### 5. Interpretation and Deep Learning

This layer should include:

- explanation
- clinical reasoning
- theoretical context
- urgency framing

This should be visually distinct from the immediate action layer.

### 6. Community Layer

Community should not sit inline with equal visual importance to the clinical content.

Preferred approaches:

- secondary tab
- collapsible drawer
- bottom sheet on mobile
- lower-priority panel after the core action

### 7. Next-Step Footer

This area must make progression obvious.
The user should always know what comes next.

## Node Content Hierarchy

Every node should be organized into three levels:

1. Immediate
2. Interpretation
3. Deep Learning

This hierarchy should replace the current feeling of many equal accordion blocks.

## Community Product Layer

The long-term goal is a small professional social network around protocol learning.

### Community Content Types

- field tip
- teaching clarification
- question
- instructor note
- best practice reminder

### Community Features

- useful/upvote
- pinned or endorsed replies
- role badges
- question sorting
- FAQ extraction per node

### Community Tone

- professional
- compact
- medically respectful
- never noisy or feed-like

## Quick Reference Redesign

Quick Reference should be rebuilt as a retrieval-first product surface.

### Requirements

- instant search
- age segmentation
- ABCDE segmentation
- compact visual cards
- ability to save favorites

### Tone

Fast, clean, utility-driven.
Less narrative than Learning Path.
More direct and compact.

## Full Flow Diagram

The full diagram should no longer be a primary navigation destination.

Recommended options:

1. Remove from primary product flow
2. Keep as instructor/debug/advanced study tool

## Accessibility and Trust

Mandatory redesign standards:

- AA contrast
- mobile tap targets
- visible focus states
- Hebrew-first visible text
- calm, useful error states
- no raw network error language inside core learning moments
- no mixed-language core UI

## Current UX Problems Driving This Redesign

1. Mobile layout breaks horizontally.
2. Main screen lacks strong product identity.
3. Too many controls compete in the top action area.
4. Comments interrupt the learning flow.
5. Content hierarchy is too flat.
6. Visual language feels generic and inconsistent.
7. Emoji-heavy UI weakens academic trust.
8. Quick reference does not yet feel retrieval-first.
9. Diagram mode takes too much conceptual space for its value.
10. The interface mixes clinical action, learning depth, and community with weak separation.

## Success Criteria

The redesign is successful when:

1. The product immediately feels like a premium clinical learning tool.
2. The step-by-step flow becomes the obvious center of gravity.
3. Mobile usage feels first-class.
4. Deep learning remains available without overwhelming the user.
5. Community feels professional and valuable.
6. The product gains a distinct visual identity that fits emergency medicine training.
