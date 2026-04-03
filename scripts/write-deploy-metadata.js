#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'assets', 'deploy-meta.json');

function readGitValue(command) {
  try {
    return execSync(command, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim();
  } catch (error) {
    return '';
  }
}

const deployedAt = new Date().toISOString();
const commit = readGitValue('git rev-parse --short HEAD');
const branch = readGitValue('git rev-parse --abbrev-ref HEAD');

const payload = {
  deployedAt,
  commit,
  branch
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(repoRoot, outputPath)} at ${deployedAt}`);
