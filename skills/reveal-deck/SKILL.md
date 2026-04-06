# Reveal Deck Maintenance

Use this skill when working on slide content, styling, or static presentation assets in this project.

Before making substantial visual or structural slide changes, read [slide-design-system](/Users/ianhannigan/Downloads/geoit-reveal-starter/skills/slide-design-system/SKILL.md). It is the repo-specific TypeUI-derived source of truth for slide quality, layout variation, and reusable design rules.

## Goals

- Keep the deck easy to edit and easy to preview locally
- Preserve the Open RTLS website visual language
- Maintain the indoor-mapping-centric story for GEOIT unless the user asks otherwise

## Primary files

- `slides.md`
- `open-location-stack.css`
- `index.html`
- `assets/*.svg`

## Workflow

1. Inspect `slides.md`, `open-location-stack.css`, and `skills/slide-design-system/SKILL.md` before changing structure or tone.
2. Choose slide patterns that add contrast with nearby slides instead of repeating the same composition through a section.
3. Prefer editing existing slides and reusable CSS patterns rather than adding complex runtime behavior.
4. If a new concept needs a visual, prefer simple local SVG diagrams, masks, or editorial composition over screenshots.
5. Keep copy concise and presentation-oriented, not website-paragraph oriented.
6. After edits, preview locally with:

```bash
bunx serve .
```

## Content guidelines

- Lead with indoor mapping, IMDF, interoperability, and operational map workflows.
- Keep OMLOX and MQTT as supporting standards, not the opening frame.
- Avoid code samples unless explicitly requested.
- Use short, high-signal bullets and clear slide titles.

## Visual guidelines

- Light backgrounds only unless the user explicitly wants a darker theme.
- Keep borders, cards, and typography minimal and editorial.
- Use the slide design system to increase variation through hierarchy, spacing, asymmetry, and motif changes before adding ornament.
- Encode new successful patterns in reusable CSS classes instead of per-slide inline exceptions.
- Reuse `assets/open-location-stack-logo.svg` for branding.
- Avoid adding external asset dependencies when a local SVG will do.
- Open all external links in a new tab using `target="_blank"` with `rel="noreferrer noopener"`.

## Validation

- Ensure `index.html` still loads `slides.md`.
- Ensure linked assets exist.
- Check that no old `presentation-test-performance` branding or imagery remains.
- If a local preview is running, verify the main routes return `200`.
