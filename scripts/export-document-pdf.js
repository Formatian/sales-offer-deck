#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

function usage() {
  console.error(
    'Usage: export-document-pdf.js <document-url> [output.pdf] [--wait-ms N] [--chrome-path PATH]'
  );
}

function parseArgs(argv) {
  if (argv.length < 3) {
    usage();
    process.exit(1);
  }

  const options = {
    documentUrl: argv[2],
    outputPdf: path.join(os.homedir(), 'Downloads', 'document.pdf'),
    waitMs: 500,
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

async function main() {
  const options = parseArgs(process.argv);
  const { chromium } = loadPlaywright();
  const outputPdf = path.resolve(options.outputPdf);

  ensureParentDir(outputPdf);

  const browser = await chromium.launch({
    headless: true,
    executablePath: options.chromePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 1,
    });

    await page.goto(options.documentUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
    await page.waitForFunction(() => document.body.classList.contains('document-mode'));
    await page.waitForFunction(() => {
      const documentView = document.getElementById('document-view');
      return documentView && !documentView.hidden;
    });

    if (options.waitMs > 0) {
      await page.waitForTimeout(options.waitMs);
    }

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => undefined);
      }

      const images = Array.from(document.images || []);
      await Promise.all(images.map(image => {
        if (image.complete) return Promise.resolve();
        if (typeof image.decode === 'function') {
          return image.decode().catch(() => undefined);
        }
        return new Promise(resolve => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }));
    });

    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });

    const pageCount = await page.evaluate(() => document.querySelectorAll('.document-canvas.is-active .document-page').length);
    console.log(`Saved ${pageCount}-page document PDF to ${outputPdf}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
