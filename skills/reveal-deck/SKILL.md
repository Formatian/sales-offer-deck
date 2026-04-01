# Reveal Deck Maintenance

Use this skill when working on slide content, styling, or static presentation assets in this project.

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

1. Inspect `slides.md` and `open-location-stack.css` before changing structure or tone.
2. Prefer editing existing slides rather than adding complex runtime behavior.
3. If a new concept needs a visual, prefer simple local SVG diagrams over screenshots.
4. Keep copy concise and presentation-oriented, not website-paragraph oriented.
5. After edits, preview locally with:

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
- Reuse `assets/open-location-stack-logo.svg` for branding.
- Avoid adding external asset dependencies when a local SVG will do.

## Validation

- Ensure `index.html` still loads `slides.md`.
- Ensure linked assets exist.
- Check that no old `presentation-test-performance` branding or imagery remains.
- If a local preview is running, verify the main routes return `200`.
