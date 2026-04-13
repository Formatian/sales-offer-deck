const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXPORTS_DIR = path.join(ROOT, 'exports');
const CONFIG_PATH = path.join(EXPORTS_DIR, 'pdf-config.json');
const MANIFEST_PATH = path.join(EXPORTS_DIR, 'pdf-manifest.json');
const EXPORT_SCRIPT = path.join(ROOT, 'skills', 'reveal-screenshot-pdf', 'scripts', 'export_reveal_screenshot_pdf.js');
const DOCUMENT_EXPORT_SCRIPT = path.join(ROOT, 'scripts', 'export-document-pdf.js');
const PDF_VIEWS = ['slides', 'document'];

const CONTENT_SLIDE_SOURCES = {
  'refund-website': { en: 'slides.md', de: 'slides.de.md' },
  offer: { en: 'slides.md', de: 'slides.de.md' },
  kaldewei: { en: 'slides.kaldewei.md', de: 'slides.kaldewei.de.md' },
  'widget-lab': { en: 'slides.widget-lab.md', de: 'slides.widget-lab.de.md' },
  'hoffest-2025': { en: 'slides.hoffest-2025.md', de: 'slides.hoffest-2025.de.md' },
  nobaxx: { en: 'slides.nobaxx.md', de: 'slides.nobaxx.de.md' },
  'xyz-sales': { en: 'slides.xyz-sales.md', de: 'slides.xyz-sales.de.md' },
  'delta-campus': { en: 'slides.delta-campus.md', de: 'slides.delta-campus.de.md' }
};

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function readConfig() {
  return readJson(CONFIG_PATH, { variants: [] });
}

function readManifest() {
  const manifest = readJson(MANIFEST_PATH, { generatedAt: null, files: {} });
  manifest.files = manifest.files && typeof manifest.files === 'object' ? manifest.files : {};
  return manifest;
}

function writeManifest(manifest) {
  writeJson(MANIFEST_PATH, manifest);
}

function makeKey({ content, theme, lang }) {
  return `${content}|${theme}|${lang}`;
}

function normalizePdfView(view) {
  return view === 'document' ? 'document' : 'slides';
}

function makePdfKey(variant) {
  const view = normalizePdfView(variant.view);
  const key = makeKey(variant);
  return view === 'document' ? `${view}|${key}` : key;
}

function makeFileName({ content, theme, lang }) {
  return `${content}__${theme}__${lang}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '-');
}

function makePdfFileName(variant) {
  const view = normalizePdfView(variant.view);
  if (view === 'document') {
    return `${variant.content}__${variant.theme}__${variant.lang}__document.pdf`.replace(/[^a-zA-Z0-9_.-]/g, '-');
  }
  return makeFileName(variant);
}

function normalizeFilterValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildVariants(config, filters = {}) {
  const contentFilter = normalizeFilterValue(filters.content);
  const themeFilter = normalizeFilterValue(filters.theme);
  const langFilter = normalizeFilterValue(filters.lang);
  const variants = [];

  for (const entry of config.variants || []) {
    if (contentFilter && entry.content !== contentFilter) {
      continue;
    }

    for (const theme of entry.themes || []) {
      if (themeFilter && theme !== themeFilter) {
        continue;
      }

      for (const lang of entry.languages || []) {
        if (langFilter && lang !== langFilter) {
          continue;
        }

        variants.push({ content: entry.content, theme, lang });
      }
    }
  }

  return variants;
}

function findVariant(config, variant) {
  return buildVariants(config, variant).find(candidate => makeKey(candidate) === makeKey(variant)) || null;
}

function buildDeckUrl(baseUrl, variant) {
  const url = new URL(baseUrl);
  url.searchParams.set('content', variant.content);
  url.searchParams.set('theme', variant.theme);
  url.searchParams.set('lang', variant.lang);
  url.searchParams.set('view', normalizePdfView(variant.view));
  return url.toString();
}

function listFilesRecursive(dir, options = {}) {
  const ignoredParts = new Set(options.ignoredParts || []);
  const files = [];

  function visit(currentDir) {
    if (!fs.existsSync(currentDir)) {
      return;
    }

    for (const dirent of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (ignoredParts.has(dirent.name)) {
        continue;
      }

      const fullPath = path.join(currentDir, dirent.name);
      if (dirent.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (dirent.isFile()) {
        files.push(fullPath);
      }
    }
  }

  visit(dir);
  return files;
}

function getVariantSourceFiles(variant) {
  const files = [
    path.join(ROOT, 'index.html'),
    path.join(ROOT, 'open-location-stack.css'),
    CONFIG_PATH
  ];

  const slideSource = CONTENT_SLIDE_SOURCES[variant.content]?.[variant.lang];
  if (slideSource) {
    files.push(path.join(ROOT, slideSource));
  }

  files.push(...listFilesRecursive(path.join(ROOT, 'assets'), {
    ignoredParts: new Set(['vendor'])
  }));

  return files
    .filter(filePath => fs.existsSync(filePath))
    .sort();
}

function computeSourceSignature(variant) {
  const hash = crypto.createHash('sha256');
  for (const filePath of getVariantSourceFiles(variant)) {
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(ROOT, filePath);
    hash.update(`${relativePath}\0${stat.size}\0${Math.trunc(stat.mtimeMs)}\n`);
  }
  return hash.digest('hex');
}

function getPdfStatus(variant, manifest = readManifest()) {
  const key = makePdfKey(variant);
  const entry = manifest.files[key] || null;
  const sourceSignature = computeSourceSignature(variant);
  const absolutePdfPath = entry?.href ? path.join(ROOT, entry.href) : '';
  const exists = Boolean(absolutePdfPath && fs.existsSync(absolutePdfPath));
  const stale = !entry || !exists || entry.sourceSignature !== sourceSignature;

  return {
    key,
    exists,
    stale,
    href: exists ? entry.href : '',
    sourceSignature,
    entry
  };
}

function pruneManifest(config, manifest = readManifest(), options = {}) {
  const validKeys = new Set();
  for (const variant of buildVariants(config)) {
    for (const view of PDF_VIEWS) {
      validKeys.add(makePdfKey({ ...variant, view }));
    }
  }
  const keepFiles = new Set();
  let changed = false;

  for (const [key, entry] of Object.entries(manifest.files)) {
    if (validKeys.has(key) && entry?.href) {
      keepFiles.add(path.resolve(ROOT, entry.href));
      continue;
    }

    if (entry?.href && options.deleteFiles !== false) {
      fs.rmSync(path.resolve(ROOT, entry.href), { force: true });
    }
    delete manifest.files[key];
    changed = true;
  }

  if (options.deleteFiles !== false && fs.existsSync(EXPORTS_DIR)) {
    for (const filePath of listFilesRecursive(EXPORTS_DIR)) {
      if (!filePath.endsWith('.pdf')) {
        continue;
      }
      if (!keepFiles.has(path.resolve(filePath))) {
        fs.rmSync(filePath, { force: true });
      }
    }
  }

  if (changed) {
    manifest.generatedAt = new Date().toISOString();
  }

  return { manifest, changed };
}

module.exports = {
  ROOT,
  EXPORTS_DIR,
  CONFIG_PATH,
  DOCUMENT_EXPORT_SCRIPT,
  MANIFEST_PATH,
  EXPORT_SCRIPT,
  buildDeckUrl,
  buildVariants,
  computeSourceSignature,
  findVariant,
  getPdfStatus,
  makeFileName,
  makeKey,
  makePdfFileName,
  makePdfKey,
  normalizePdfView,
  pruneManifest,
  readConfig,
  readManifest,
  writeManifest
};
