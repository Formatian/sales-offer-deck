#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const {
  ROOT,
  findVariant,
  getPdfStatus,
  makeKey,
  makePdfKey,
  normalizePdfView,
  pruneManifest,
  readConfig,
  readManifest,
  writeManifest
} = require('./pdf-export-utils');

const PORT = Number(process.env.PORT || 3000);
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const activeExports = new Map();

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function parseVariantFromUrl(requestUrl) {
  const url = new URL(requestUrl, `http://localhost:${PORT}`);
  return {
    content: url.searchParams.get('content') || '',
    theme: url.searchParams.get('theme') || '',
    lang: url.searchParams.get('lang') || '',
    view: normalizePdfView(url.searchParams.get('view') || 'slides')
  };
}

function getVariantOrSendError(request, response) {
  const requested = parseVariantFromUrl(request.url);
  const config = readConfig();
  const variant = findVariant(config, requested);
  if (!variant) {
    sendJson(response, 404, {
      ok: false,
      error: `No PDF export variant configured for ${makeKey(requested)}.`
    });
    return null;
  }

  return { config, variant: { ...variant, view: requested.view } };
}

function getStatusPayload(variant) {
  const status = getPdfStatus(variant);
  return {
    ok: true,
    key: status.key,
    exists: status.exists,
    stale: status.stale,
    href: status.href,
    generatedAt: status.entry?.generatedAt || null
  };
}

function handleStatus(request, response) {
  const result = getVariantOrSendError(request, response);
  if (!result) {
    return;
  }

  const { config, variant } = result;
  const manifest = readManifest();
  const pruneResult = pruneManifest(config, manifest, { deleteFiles: true });
  if (pruneResult.changed) {
    writeManifest(pruneResult.manifest);
  }

  sendJson(response, 200, getStatusPayload(variant));
}

function handleExport(request, response) {
  const result = getVariantOrSendError(request, response);
  if (!result) {
    return;
  }

  const { config, variant } = result;
  const key = makePdfKey(variant);
  if (activeExports.has(key)) {
    sendJson(response, 202, {
      ok: true,
      key,
      running: true,
      message: 'PDF export already running.'
    });
    return;
  }

  const manifest = readManifest();
  const pruneResult = pruneManifest(config, manifest, { deleteFiles: true });
  if (pruneResult.changed) {
    writeManifest(pruneResult.manifest);
  }

  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });

  const args = [
    path.join(ROOT, 'scripts', 'export-pdf-variants.js'),
    '--base-url',
    `http://localhost:${PORT}/`,
    '--content',
    variant.content,
    '--theme',
    variant.theme,
    '--lang',
    variant.lang,
    '--view',
    variant.view
  ];
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  activeExports.set(key, child);
  let output = '';
  child.stdout.on('data', chunk => {
    output += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    output += chunk.toString();
  });
  child.on('close', code => {
    activeExports.delete(key);
    if (code !== 0) {
      response.end(`${JSON.stringify({
        ok: false,
        key,
        error: `PDF export failed for ${key}.`,
        output
      }, null, 2)}\n`);
      return;
    }

    response.end(`${JSON.stringify({
      ...getStatusPayload(variant),
      output
    }, null, 2)}\n`);
  });
}

function serveStatic(request, response) {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.resolve(ROOT, `.${pathname}`);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': url.pathname.startsWith('/exports/') ? 'no-store' : 'public, max-age=0'
  });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  if (request.method === 'GET' && url.pathname === '/api/pdf-status') {
    handleStatus(request, response);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/export-pdf') {
    handleExport(request, response);
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    serveStatic(request, response);
    return;
  }

  response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Serving deck with PDF export at http://localhost:${PORT}`);
});
