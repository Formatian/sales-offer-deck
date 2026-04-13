#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');
const {
  EXPORT_SCRIPT,
  ROOT,
  buildDeckUrl,
  buildVariants,
  computeSourceSignature,
  makeFileName,
  makeKey,
  pruneManifest,
  readConfig,
  readManifest,
  writeManifest
} = require('./pdf-export-utils');

function usage() {
  console.error([
    'Usage: node scripts/export-pdf-variants.js [--base-url URL] [--content ID] [--theme ID] [--lang en|de] [--all] [--prune]',
    '',
    'Examples:',
    '  node scripts/export-pdf-variants.js --content offer --theme lear --lang en',
    '  node scripts/export-pdf-variants.js --content offer --lang en --all',
    '  node scripts/export-pdf-variants.js --all',
    '  node scripts/export-pdf-variants.js --prune'
  ].join('\n'));
}

function parseArgs(argv) {
  const options = {
    baseUrl: 'http://localhost:3000/',
    content: '',
    theme: '',
    lang: '',
    all: false,
    prune: false,
    waitMs: '500'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--base-url' && next) {
      options.baseUrl = next;
      i += 1;
      continue;
    }

    if (arg === '--content' && next) {
      options.content = next;
      i += 1;
      continue;
    }

    if (arg === '--theme' && next) {
      options.theme = next;
      i += 1;
      continue;
    }

    if (arg === '--lang' && next) {
      options.lang = next;
      i += 1;
      continue;
    }

    if (arg === '--wait-ms' && next) {
      options.waitMs = next;
      i += 1;
      continue;
    }

    if (arg === '--all') {
      options.all = true;
      continue;
    }

    if (arg === '--prune') {
      options.prune = true;
      continue;
    }

    usage();
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function exportVariant(variant, options, manifest) {
  const fileName = makeFileName(variant);
  const outputPath = path.join(ROOT, 'exports', fileName);
  const deckUrl = buildDeckUrl(options.baseUrl, variant);
  const key = makeKey(variant);

  console.log(`Exporting ${key}`);
  const result = spawnSync(process.execPath, [
    EXPORT_SCRIPT,
    deckUrl,
    outputPath,
    '--wait-ms',
    options.waitMs
  ], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`PDF export failed for ${key}.`);
  }

  manifest.files[key] = {
    href: `exports/${fileName}`,
    content: variant.content,
    theme: variant.theme,
    lang: variant.lang,
    sourceSignature: computeSourceSignature(variant),
    generatedAt: new Date().toISOString()
  };
}

function main() {
  const options = parseArgs(process.argv);
  const config = readConfig();
  const manifest = readManifest();
  const pruneResult = pruneManifest(config, manifest, { deleteFiles: true });

  if (options.prune && !options.content && !options.theme && !options.lang && !options.all) {
    writeManifest(pruneResult.manifest);
    console.log(`Pruned stale PDF manifest entries and files.`);
    return;
  }

  const variants = buildVariants(config, options);
  if (!variants.length) {
    usage();
    throw new Error('No matching PDF variants found in exports/pdf-config.json.');
  }

  if (!options.all && variants.length > 1) {
    usage();
    throw new Error('Multiple variants matched. Add --all or narrow with --content, --theme, and --lang.');
  }

  for (const variant of variants) {
    exportVariant(variant, options, pruneResult.manifest);
  }

  pruneResult.manifest.generatedAt = new Date().toISOString();
  writeManifest(pruneResult.manifest);
  console.log(`Updated exports/pdf-manifest.json`);
}

main();
