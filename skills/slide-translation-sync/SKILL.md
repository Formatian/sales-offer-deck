---
name: slide-translation-sync
description: Keep slides.de.md structurally synchronized with slides.md in this Reveal.js deck. Use whenever English slide content, structure, links, or presenter blocks change and the German deck must remain aligned.
---

# Slide Translation Sync

Use this skill when `slides.md` changes and `slides.de.md` must keep up.

## Goal

- Prevent the German deck from drifting behind the English deck
- Keep slide count, slide directives, layout structure, cards, links, and major blocks aligned
- Catch structural drift immediately after English edits

## Required workflow

1. Edit the English source in `slides.md`.
2. Mirror the same structural change in `slides.de.md`.
3. Translate any changed copy into presentation-quality German.
4. Run:

```bash
node scripts/check-translation-sync.js
```

5. If the check fails, fix `slides.de.md` before considering the deck done.

## What the sync check enforces

- Same slide count
- Same `<!-- .slide: ... -->` directive per slide
- Same slide-level structural fingerprint after text is stripped
- Same counts for key block types, including:
  - proposal cards
  - closing cards
  - LinkedIn preview blocks
  - cover meta pills
  - cover brand rows
  - mailto links
  - external links

## Translation guidance

- Preserve the English slide structure first, then translate the copy
- Keep proper nouns, company names, product names, URLs, and email addresses unchanged unless the user asks otherwise
- Keep the German concise and presentation-first, not document-like
- When English adds a new proof point, card, or CTA, German must get the corresponding block in the same slide

## Boundaries

- This skill is about EN/DE deck synchronization, not broad visual redesign
- Do not leave the German deck “approximately updated”; it should either pass the sync check or be treated as incomplete
