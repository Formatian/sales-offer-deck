#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const QUALITY = "82";
const VALID_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

function usage() {
  console.error("Usage: convert_bitmap_to_webp.js <file1> [file2 ...]");
}

function convertFile(inputPath) {
  const absoluteInput = path.resolve(inputPath);
  const extension = path.extname(absoluteInput).toLowerCase();

  if (!VALID_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported bitmap extension for ${inputPath}`);
  }

  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  const outputPath = absoluteInput.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  const result = spawnSync("cwebp", ["-q", QUALITY, absoluteInput, "-o", outputPath], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `cwebp failed for ${inputPath}`);
  }

  return outputPath;
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    usage();
    process.exit(1);
  }

  for (const file of files) {
    const outputPath = convertFile(file);
    console.log(outputPath);
  }
}

main();
