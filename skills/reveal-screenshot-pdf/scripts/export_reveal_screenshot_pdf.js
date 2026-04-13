#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

function usage() {
  console.error(
    'Usage: export_reveal_screenshot_pdf.js <deck-url> [output.pdf] [--width N] [--height N] [--wait-ms N] [--chrome-path PATH]'
  );
}

function parseArgs(argv) {
  if (argv.length < 3) {
    usage();
    process.exit(1);
  }

  const options = {
    deckUrl: argv[2],
    outputPdf: path.join(os.homedir(), 'Downloads', 'open-location-stack-geoit.pdf'),
    width: 1600,
    height: 900,
    waitMs: 250,
    chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  };

  let i = 3;
  if (argv[i] && !argv[i].startsWith('--')) {
    options.outputPdf = argv[i];
    i += 1;
  }

  for (; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--width' && next) {
      options.width = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--height' && next) {
      options.height = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--wait-ms' && next) {
      options.waitMs = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--chrome-path' && next) {
      options.chromePath = next;
      i += 1;
      continue;
    }

    console.error(`Unknown argument: ${arg}`);
    usage();
    process.exit(1);
  }

  return options;
}

function listDirsSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function findPlaywrightModuleDir() {
  const candidates = [];

  candidates.push(path.join(process.cwd(), 'node_modules', 'playwright'));

  const npxRoot = path.join(os.homedir(), '.npm', '_npx');
  for (const dirent of listDirsSafe(npxRoot)) {
    if (!dirent.isDirectory()) continue;
    candidates.push(path.join(npxRoot, dirent.name, 'node_modules', 'playwright'));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }

  throw new Error(
    'Could not find a Playwright installation. Run `npx playwright --help` once or install Playwright locally.'
  );
}

function loadPlaywright() {
  const moduleDir = findPlaywrightModuleDir();
  const requireFrom = createRequire(path.join(process.cwd(), 'tmp-playwright-runner.cjs'));
  return requireFrom(moduleDir);
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

function pngToDataUri(filePath) {
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

async function main() {
  const options = parseArgs(process.argv);
  const { chromium } = loadPlaywright();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reveal-screenshot-pdf-'));
  const slidesDir = path.join(workDir, 'slides');
  const htmlPath = path.join(workDir, 'slides.html');
  const outputPdf = path.resolve(options.outputPdf);

  fs.mkdirSync(slidesDir, { recursive: true });
  ensureParentDir(outputPdf);

  const browser = await chromium.launch({
    headless: true,
    executablePath: options.chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
    });

    await page.goto(options.deckUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
    await page.evaluate(() => {
      window.Reveal.configure({
        transition: 'none',
        backgroundTransition: 'none',
        autoAnimate: false,
      });
    });
    await page.addStyleTag({
      content: '.reveal .progress { display: none !important; }'
    });

    const slides = await page.evaluate(() => {
      return window.Reveal.getSlides().map((slide, index) => {
        const indices = window.Reveal.getIndices(slide);
        return {
          index,
          h: indices.h,
          v: indices.v || 0,
        };
      });
    });

    const shotPaths = [];

    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      const shotPath = path.join(slidesDir, `${String(i + 1).padStart(2, '0')}.png`);

      await page.evaluate(({ h, v }) => {
        window.Reveal.slide(h, v, 0);
      }, slide);
      await page.waitForTimeout(options.waitMs);
      await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });

      await page.screenshot({ path: shotPath });
      shotPaths.push(shotPath);
    }

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: ${options.width}px ${options.height}px; margin: 0; }
  html, body { margin: 0; padding: 0; background: white; }
  .page { width: ${options.width}px; height: ${options.height}px; break-after: page; page-break-after: always; }
  .page:last-child { break-after: auto; page-break-after: auto; }
  img { display: block; width: ${options.width}px; height: ${options.height}px; }
</style>
</head>
<body>
${shotPaths.map(shotPath => `<div class="page"><img src="${pngToDataUri(shotPath)}" alt="" /></div>`).join('\n')}
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);

    const pdfPage = await browser.newPage();
    await pdfPage.goto(`file://${htmlPath}`, { waitUntil: 'load' });
    await pdfPage.pdf({
      path: outputPdf,
      printBackground: true,
      width: `${options.width}px`,
      height: `${options.height}px`,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });

    console.log(`Saved ${slides.length}-slide PDF to ${outputPdf}`);
  } finally {
    await browser.close();
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
