#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(__dirname, 'translation-sync.json');

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const failures = [];

  for (const [key, entry] of Object.entries(manifest)) {
    const englishContent = readFile(entry.englishFile);
    const germanContent = readFile(entry.germanFile);

    if (!englishContent.includes(entry.english)) {
      failures.push(
        `${key}: English source no longer matches ${entry.englishFile}. Update the German copy and refresh scripts/translation-sync.json.`
      );
    }

    if (!germanContent.includes(entry.german)) {
      failures.push(
        `${key}: German source no longer matches ${entry.germanFile}. Update the translation and refresh scripts/translation-sync.json.`
      );
    }
  }

  if (failures.length > 0) {
    console.error('Translation sync check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Translation sync check passed for ${Object.keys(manifest).length} block(s).`);
}

main();
