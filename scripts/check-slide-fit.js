#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const baseUrl = process.env.DECK_URL || 'http://localhost:3000';
const chromePath =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeDebugUrl = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9222';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Unexpected status ${response.statusCode} from ${url}`));
        return;
      }

      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(1000, () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function openBrowser() {
  try {
    const version = await fetchJson(`${chromeDebugUrl}/json/version`);
    if (version.webSocketDebuggerUrl) {
      return {
        browser: await puppeteer.connect({ browserWSEndpoint: version.webSocketDebuggerUrl }),
        cleanup: async browser => {
          await browser.disconnect();
        },
        mode: 'connected',
      };
    }
  } catch {
    // Fall back to launching an isolated browser for the check.
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'open-location-stack-slide-fit-'));
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    pipe: true,
    userDataDir,
    defaultViewport: {
      width: 1600,
      height: 900,
      deviceScaleFactor: 1,
    },
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
    ],
    timeout: 60000,
  });

  return {
    browser,
    cleanup: async launchedBrowser => {
      await launchedBrowser.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    },
    mode: 'launched',
  };
}

async function main() {
  const { browser, cleanup, mode } = await openBrowser();

  try {
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());

    const total = await page.evaluate(() => window.Reveal.getTotalSlides());
    const failures = [];

    for (let index = 0; index < total; index += 1) {
      await page.evaluate(slideIndex => {
        window.Reveal.slide(slideIndex);
      }, index);

      await page.waitForFunction(expectedIndex => {
        return window.Reveal.getIndices().h === expectedIndex;
      }, {}, index);

      await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });

      const result = await page.evaluate(() => {
        const toRect = rect => ({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        });
        const slide = window.Reveal.getCurrentSlide();
        const footer = document.querySelector('.slide-footer');
        const visibleBottom =
          footer && getComputedStyle(footer).display !== 'none'
            ? footer.getBoundingClientRect().top - 8
            : window.innerHeight - 8;
        const children = Array.from(slide.children).filter(child => {
          const style = window.getComputedStyle(child);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
        const hiddenTextChildren = Array.from(slide.children)
          .filter(child => {
            const style = window.getComputedStyle(child);
            const text = child.textContent?.trim() || '';
            return text.length > 0 && (style.display === 'none' || style.visibility === 'hidden');
          })
          .map(child => child.tagName.toLowerCase());

        const contentBottom = children.reduce((maxBottom, child) => {
          const rect = child.getBoundingClientRect();
          return Math.max(maxBottom, rect.bottom);
        }, slide.getBoundingClientRect().top);

        const slideRect = slide.getBoundingClientRect();
        const overflow = Math.max(0, Math.ceil(contentBottom - visibleBottom));

        return {
          index: window.Reveal.getSlidePastCount() + 1,
          title: slide.querySelector('h1, h2')?.textContent?.trim() || '(untitled)',
          overflow,
          hiddenTextChildren,
          slideRect: toRect(slideRect),
          visibleBottom,
          zoom: slide.style.zoom || '1',
        };
      });

      if (result.overflow > 0 || result.hiddenTextChildren.length > 0) {
        failures.push(result);
      }
    }

    if (failures.length > 0) {
      console.error('Slides with bottom overflow:');
      for (const failure of failures) {
        const problems = [];
        if (failure.overflow > 0) {
          problems.push(`overflow ${failure.overflow}px`);
        }
        if (failure.hiddenTextChildren.length > 0) {
          problems.push(`hidden text elements: ${failure.hiddenTextChildren.join(', ')}`);
        }

        console.error(`- Slide ${failure.index} "${failure.title}": ${problems.join('; ')} (zoom ${failure.zoom})`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`All ${total} slides fit within a 1600x900 viewport (${mode} browser).`);
  } finally {
    await cleanup(browser);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
