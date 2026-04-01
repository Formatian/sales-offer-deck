# AGENTS.md

Guidance for agents working in `/Users/ianhannigan/Downloads/geoit-reveal-starter`.

## Project purpose

This is a standalone Reveal.js presentation starter for a new project.

- Format: static Reveal.js deck loaded from `index.html` and `slides.md`
- Goal: adapt quickly for a specific product, launch, proposal, or conference talk

## Files that matter

- `index.html`: Reveal.js entrypoint and runtime behavior
- `slides.md`: slide content and structure
- `open-location-stack.css`: presentation theme and layout styling
- `assets/`: local visuals used by the deck
- `wrangler.jsonc`: optional Cloudflare Pages configuration
- `publish.sh`: optional deployment helper

## Working rules

- Keep the project static. Do not add frameworks, bundlers, or package manifests unless explicitly requested.
- Prefer editing `slides.md`, `open-location-stack.css`, and local SVG assets over introducing extra tooling.
- Keep copy concise and presentation-oriented.
- Convert new bitmap assets to `.webp` before committing them.
- Do not publish, deploy, commit, or push unless the user explicitly asks.

## Build and preview

Primary local preview:

```bash
bunx serve .
```

Then open `http://localhost:3000`.

Optional Cloudflare-style local preview:

```bash
npx wrangler pages dev .
```
