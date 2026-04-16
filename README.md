# Project Reveal Starter

Static Reveal.js presentation starter adapted from an existing reveal deck structure.

This repo is intentionally minimal:

- `index.html`: Reveal.js entrypoint
- `slides.md`: slide content
- `open-location-stack.css`: presentation theme and layout styling
- `assets/`: local images and SVGs

## Local preview

```bash
bunx serve .
```

Then open [http://localhost:3000](http://localhost:3000).

Optional Cloudflare-style preview:

```bash
npx wrangler pages dev .
```

## What to replace first

- Project name and subtitle in `slides.md`
- Presenter name
- Footer URL and copyright line in `index.html`
- Placeholder slides with your actual narrative
- Placeholder logo in `assets/project-mark.svg`

## Notes

- This is a static deck. No framework or bundler is required.
- Keep assets local so the presentation works offline.

## Design References

The curated `DESIGN.md` collection from `VoltAgent/awesome-design-md` is vendored into [vendor/awesome-design-md](/Users/ianhannigan/Downloads/geoit-reveal-starter/vendor/awesome-design-md/README.md) for local reference.

Use those files as source material when adapting the deck theme, copy direction, or visual system without relying on a network fetch.
