---
name: take-website-screenshot
description: Capture clean website screenshots for decks, documents, reviews, or assets. Use when Codex needs to take a screenshot of a public website, refresh an existing website screenshot, compare pages visually, or save a page image without cookie consent popups obscuring the content.
---

# Take Website Screenshot

Use this skill to capture a clean viewport screenshot of a website and dismiss cookie consent UI before saving the image.

Prefer the bundled script for repeatable results.

## Workflow

1. Choose an output path under the current workspace, typically `assets/screenshots/<name>.png`.
2. Run the bundled script:

```bash
node skills/take-website-screenshot/scripts/capture_website_screenshot.js <url> <output.png>
```

3. If the page uses a non-standard cookie banner, pass one or more explicit dismiss selectors:

```bash
node skills/take-website-screenshot/scripts/capture_website_screenshot.js \
  https://example.com \
  assets/screenshots/example.png \
  --dismiss-selector '[data-cookie-accept]' \
  --dismiss-selector 'button:has-text("Accept")'
```

4. Re-open the saved image or deck slide and verify that:
   - cookie UI is gone
   - the important part of the page is in frame
   - the viewport height is suitable for the target slide or document

## Defaults

- Capture a viewport screenshot, not a full-page strip.
- Use `1440x900` unless the target format needs something else.
- Wait briefly after load and after dismissing the banner so animations settle.
- Dismiss cookie popups before capture. This is part of the job, not an optional cleanup step.

## Cookie Banner Handling

Try the script defaults first. It already attempts common selectors and button labels, including:

- `[data-cookie-accept]`
- `[data-cookie-accept-all]`
- `[data-accept-cookies]`
- `button:has-text("Accept")`
- `button:has-text("Accept all")`
- `button:has-text("Accept cookies")`
- `button:has-text("Allow all cookies")`
- `button:has-text("I agree")`
- `button:has-text("OK")`

If the site still shows a banner:

- Inspect the page HTML for consent-related attributes or button text.
- Re-run the script with `--dismiss-selector` for the site-specific button.
- If necessary, pass `--wait-ms` with a larger value for slow overlays.
- If hero media or late content is still missing, pass `--wait-for-selector` for a stable element before capture.

## Examples

Refresh a screenshot asset for a slide deck:

```bash
node skills/take-website-screenshot/scripts/capture_website_screenshot.js \
  https://tryformation.com \
  assets/screenshots/tryformation.png
```

Capture a page with an explicit consent selector:

```bash
node skills/take-website-screenshot/scripts/capture_website_screenshot.js \
  https://formationxyz.com \
  assets/screenshots/formationxyz.png \
  --dismiss-selector '[data-cookie-accept]'
```

Capture a media-heavy page and wait for a stable element:

```bash
node skills/take-website-screenshot/scripts/capture_website_screenshot.js \
  https://tryformation.com \
  assets/screenshots/tryformation.png \
  --wait-for-selector 'text=The power to know where'
```

## Script

Use [capture_website_screenshot.js](/Users/jillesvangurp/git/reveal-presentations/open-rtls-geoit/skills/take-website-screenshot/scripts/capture_website_screenshot.js).

The script:

- resolves a Playwright install from the normal `npx` cache or local `node_modules`
- launches Chromium headlessly
- attempts cookie dismissal automatically
- accepts extra dismiss selectors
- writes a PNG to the requested location

If Playwright cannot be found, install or invoke it once with `npx playwright --help` so the package exists in the `npx` cache, then rerun the script.
