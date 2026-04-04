#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const englishPath = path.join(repoRoot, 'slides.md');
const germanPath = path.join(repoRoot, 'slides.de.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function splitSlides(source) {
  return source
    .split(/^---$/m)
    .map(part => part.trim())
    .filter(Boolean);
}

function getDirective(slide) {
  return slide.match(/^<!--\s*\.slide:.*-->$/m)?.[0]?.trim() || '';
}

function getHeading(slide) {
  const markdownHeading = slide.match(/^(#{1,6})\s+(.+)$/m);
  if (markdownHeading) {
    return markdownHeading[2].trim();
  }

  const htmlHeading = slide.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/is);
  if (htmlHeading) {
    return htmlHeading[1].replace(/<[^>]+>/g, '').trim();
  }

  return '(no heading)';
}

function structuralFingerprint(slide) {
  return slide
    .replace(/^<!--\s*\.slide:.*-->$/gm, '<!-- .slide -->')
    .replace(/^(#{1,6})\s+.*$/gm, '$1')
    .replace(/>[^<]+</g, '><')
    .replace(/"[^"]*"/g, '""')
    .replace(/\b\d[\d.,%€/\s-]*\b/g, '0')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(slide, pattern) {
  return (slide.match(pattern) || []).length;
}

function collectSignals(slide) {
  return {
    proposalCards: countMatches(slide, /class="[^"]*\bproposal-card\b[^"]*"/g),
    closingCards: countMatches(slide, /class="[^"]*\bclosing-card-prepared\b[^"]*"/g),
    linkedinPreviews: countMatches(slide, /class="[^"]*\blinkedin-preview\b[^"]*"/g),
    metaPills: countMatches(slide, /class="[^"]*\bcover-meta-pill\b[^"]*"/g),
    brandRows: countMatches(slide, /class="[^"]*\bcover-brand-row\b[^"]*"/g),
    mailtoLinks: countMatches(slide, /href="mailto:/g),
    externalLinks: countMatches(slide, /href="https?:\/\//g)
  };
}

function compareSignals(englishSignals, germanSignals) {
  const failures = [];

  for (const key of Object.keys(englishSignals)) {
    if (englishSignals[key] !== germanSignals[key]) {
      failures.push(`${key} mismatch (en=${englishSignals[key]}, de=${germanSignals[key]})`);
    }
  }

  return failures;
}

function main() {
  const englishSlides = splitSlides(read(englishPath));
  const germanSlides = splitSlides(read(germanPath));
  const failures = [];

  if (englishSlides.length !== germanSlides.length) {
    failures.push(
      `slide-count mismatch: English has ${englishSlides.length} slide(s), German has ${germanSlides.length} slide(s).`
    );
  }

  const sharedCount = Math.min(englishSlides.length, germanSlides.length);

  for (let index = 0; index < sharedCount; index += 1) {
    const englishSlide = englishSlides[index];
    const germanSlide = germanSlides[index];
    const englishHeading = getHeading(englishSlide);
    const germanHeading = getHeading(germanSlide);
    const label = `slide ${index + 1} (en: ${englishHeading} / de: ${germanHeading})`;

    const englishDirective = getDirective(englishSlide);
    const germanDirective = getDirective(germanSlide);
    if (englishDirective !== germanDirective) {
      failures.push(`${label}: slide directive mismatch.`);
    }

    const englishFingerprint = structuralFingerprint(englishSlide);
    const germanFingerprint = structuralFingerprint(germanSlide);
    if (englishFingerprint !== germanFingerprint) {
      failures.push(`${label}: structural fingerprint mismatch.`);
    }

    const signalFailures = compareSignals(collectSignals(englishSlide), collectSignals(germanSlide));
    for (const failure of signalFailures) {
      failures.push(`${label}: ${failure}.`);
    }
  }

  if (failures.length > 0) {
    console.error('Translation sync check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Translation sync check passed for ${englishSlides.length} slide(s).`);
}

main();
