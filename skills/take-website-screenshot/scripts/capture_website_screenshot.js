#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { createRequire } = require("module");

function usage() {
  console.error(
    "Usage: capture_website_screenshot.js <url> <output.png> [--width N] [--height N] [--wait-ms N] [--wait-for-selector SELECTOR] [--dismiss-selector CSS_OR_PLAYWRIGHT]"
  );
}

function parseArgs(argv) {
  if (argv.length < 4) {
    usage();
    process.exit(1);
  }

  const options = {
    url: argv[2],
    output: argv[3],
    width: 1440,
    height: 900,
    waitMs: 1200,
    waitForSelector: null,
    dismissSelectors: [],
  };

  for (let i = 4; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--width" && next) {
      options.width = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--height" && next) {
      options.height = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--wait-ms" && next) {
      options.waitMs = Number(next);
      i += 1;
      continue;
    }
    if (arg === "--wait-for-selector" && next) {
      options.waitForSelector = next;
      i += 1;
      continue;
    }
    if (arg === "--dismiss-selector" && next) {
      options.dismissSelectors.push(next);
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

  if (process.env.PLAYWRIGHT_MODULE_DIR) {
    candidates.push(process.env.PLAYWRIGHT_MODULE_DIR);
  }

  candidates.push(path.join(process.cwd(), "node_modules", "playwright"));
  candidates.push(path.join(__dirname, "..", "..", "..", "..", "node_modules", "playwright"));

  const npxRoot = path.join(os.homedir(), ".npm", "_npx");
  for (const dirent of listDirsSafe(npxRoot)) {
    if (!dirent.isDirectory()) continue;
    candidates.push(path.join(npxRoot, dirent.name, "node_modules", "playwright"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }

  return null;
}

function loadPlaywright() {
  const moduleDir = findPlaywrightModuleDir();
  if (!moduleDir) {
    throw new Error(
      "Could not find a Playwright installation. Run `npx playwright --help` once or set PLAYWRIGHT_MODULE_DIR."
    );
  }

  const requireFrom = createRequire(__filename);
  return requireFrom(moduleDir);
}

async function clickIfPresent(page, selector) {
  const locator = page.locator(selector);
  const count = await locator.count().catch(() => 0);
  if (!count) return false;
  await locator.first().click({ timeout: 5000 }).catch(() => {});
  return true;
}

async function dismissCookiePopup(page, extraSelectors) {
  const selectors = [
    "[data-cookie-accept]",
    "[data-cookie-accept-all]",
    "[data-accept-cookies]",
    "button:has-text('Accept')",
    "button:has-text('Accept all')",
    "button:has-text('Accept cookies')",
    "button:has-text('Allow all cookies')",
    "button:has-text('I agree')",
    "button:has-text('OK')",
    "text=Accept cookies",
    "text=Accept all",
    ...extraSelectors,
  ];

  for (const selector of selectors) {
    if (await clickIfPresent(page, selector)) {
      return selector;
    }
  }

  return null;
}

async function main() {
  const options = parseArgs(process.argv);
  const { chromium } = loadPlaywright();

  fs.mkdirSync(path.dirname(options.output), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: 1,
  });

  try {
    await page.goto(options.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    if (options.waitForSelector) {
      await page.locator(options.waitForSelector).first().waitFor({ timeout: 15000 }).catch(() => {});
    }
    await page.waitForTimeout(options.waitMs);
    const dismissed = await dismissCookiePopup(page, options.dismissSelectors);
    if (dismissed) {
      console.error(`Dismissed cookie UI with selector: ${dismissed}`);
      await page.waitForTimeout(options.waitMs);
    } else {
      console.error("No cookie selector matched.");
    }
    await page.screenshot({ path: options.output, fullPage: false });
    console.error(`Saved screenshot to ${options.output}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
