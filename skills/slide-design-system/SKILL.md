---
name: slide-design-system
description: TypeUI-derived design-system guidance for this Reveal.js deck. Use when creating or revising slide layouts, visual motifs, CSS rules, or slide patterns so changes stay polished, varied, and presentation-safe.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Open Location Stack Slide Design System

## Mission
Create Reveal.js slides that feel deliberate, high-signal, and varied without drifting into generic SaaS UI tropes or overbuilt front-end patterns. The deck should read clearly at presentation distance, preserve the static repo workflow, and keep visual decisions implementation-ready in `slides.md`, `open-location-stack.css`, and local assets.

## Brand
- Product/brand: Open Location Stack deck starter
- Audience: conference attendees, prospects, partners, internal product or proposal audiences
- Product surface: static Reveal.js presentation

## Style Foundations
- Visual style: editorial, map-forward, technical, calm, precise, modern
- Typography scale:
  - overline: `0.72rem / 0.12em tracking`
  - body: `0.95rem` to `1.05rem`
  - supporting caption: `0.82rem`
  - section heading: `1.35rem` to `1.7rem`
  - slide title: `2.4rem` to `3.4rem`
  - hero statement: `3.6rem` to `4.8rem`
- Color palette:
  - canvas: warm white or soft stone
  - text primary: near-black slate
  - text secondary: muted steel
  - accent: one strong blue family for key emphasis
  - support accents: restrained teal, sand, moss, or rust only when tied to content blocks
  - avoid neon, purple-heavy AI gradients, and unrelated rainbow palettes
- Spacing scale:
  - micro: `0.35rem`
  - tight: `0.65rem`
  - base: `1rem`
  - roomy: `1.5rem`
  - section gap: `2.25rem`
  - slide breathing room: `3rem` or more
- Radius/shadow/motion tokens:
  - radius: `12px` to `28px`
  - borders: `1px` low-contrast strokes before shadows
  - shadows: subtle and soft, used sparingly
  - motion: minimal reveal transitions only; no decorative perpetual animation

## Accessibility
- Target: WCAG 2.2 AA where practical inside presentation constraints
- Keyboard-first interactions required for any interactive controls
- Focus-visible rules required when links or controls are present
- Contrast constraints required for all text over imagery or colored panels

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use one dominant slide idea and one dominant visual hierarchy per slide.
- Use asymmetry, cropping, pull quotes, metric blocks, or map-like diagrams to create variation between adjacent slides.
- Reuse semantic CSS classes and existing layout primitives before adding one-off slide-specific markup.
- Treat negative space as a layout tool; split a crowded concept into multiple slides instead of shrinking text.
- Keep accents tied to meaning: blue for key emphasis, secondary accents for categorization only.
- Use local SVGs, masks, dividers, and simple shapes to introduce distinction before resorting to screenshots.
- Make each slide title carry the takeaway, not just the topic.
- Design for presentation distance first; every slide must still scan from the back of the room.
- When adding new slide patterns, encode them in `open-location-stack.css` as reusable blocks.

## Rules: Don't
- Do not turn slides into webpages, dashboards, or card grids by default.
- Do not center every slide or repeat the same left-title-plus-bullets composition across a section.
- Do not use more than one primary accent family on a single slide.
- Do not rely on tiny UI chrome, dense labels, or multi-column microcopy.
- Do not add framework assumptions, package dependencies, or runtime-heavy behavior.
- Do not use decorative motion, glassmorphism, or glossy effects unless the user explicitly asks for a more stylized direction.
- Do not hide important copy over busy photography without an overlay or contrast treatment.

## Guideline Authoring Workflow
1. Restate the slide's takeaway and the audience action or perception it should create.
2. Choose a slide pattern that contrasts with adjacent slides while fitting the content density.
3. Define the hierarchy: title, proof, supporting detail, and visual anchor.
4. Apply spacing, color, and emphasis rules from this system before introducing new styling.
5. If new markup or CSS is needed, make it reusable and name it semantically.
6. Verify readability, variation, and implementation simplicity before finalizing.

## Required Output Structure
- Slide intent and audience takeaway
- Recommended layout pattern and hierarchy
- Styling or CSS guidance tied to existing repo files
- Copy-density guidance and emphasis strategy
- Accessibility and readability checks
- Risks or anti-patterns to avoid

## Component Rule Expectations
- Cover slides must combine a strong statement, clear brand context, and a restrained supporting meta row.
- Proof or capability slides must separate the headline claim from supporting evidence visually.
- Comparison slides must make the contrast obvious within one glance.
- Image-led slides must specify overlay treatment, crop behavior, and fallback text contrast handling.
- Link, QR, or CTA blocks must remain obvious without overpowering the slide narrative.
- Any card, stat, or quote pattern must define title, body, spacing, and max-density behavior.

## Quality Gates
- Every non-negotiable rule uses "must".
- Every recommendation uses "should".
- Each section of the deck should include at least two distinct layout rhythms.
- Adjacent slides should not repeat the same structural pattern more than twice unless repetition is intentionally signaling sequence.
- New CSS should reduce future repetition instead of introducing single-use exceptions.
- The final slide set should feel more varied and more coherent at the same time.

## Repo-Specific Implementation Notes
- Read [skills/typeui/DESIGN.md](/Users/ianhannigan/Downloads/geoit-reveal-starter/skills/typeui/DESIGN.md) when extending this skill or creating adjacent design guidance.
- Apply this system through [slides.md](/Users/ianhannigan/Downloads/geoit-reveal-starter/slides.md), [open-location-stack.css](/Users/ianhannigan/Downloads/geoit-reveal-starter/open-location-stack.css), and local assets.
- Keep the repo static. Do not add frameworks, bundlers, or package manifests unless explicitly requested.

<!-- TYPEUI_SH_MANAGED_END -->
