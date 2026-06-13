/**
 * Tiny static + SPA-fallback server. Resolves real files first (so the per-shoe
 * /shoe/<slug>/index.html stubs serve their OG cards to social bots), then
 * falls back to /index.html for unknown paths (so client-side routes like
 * /quiz/1 deep-link correctly into the SPA).
 *
 * `serve --single` rewrites EVERYTHING to /index.html unconditionally, and
 * serve.json `rewrites` apply BEFORE filesystem resolution — both kill the
 * per-shoe stubs. This is ~30 lines and does what we need.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve as pathResolve } from 'node:path';

const ROOT = pathResolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 3000);
const HOST = '0.0.0.0';
const INDEX = join(ROOT, 'index.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const IMMUTABLE = /^\/(?:_expo\/static|assets)\//;

function send(res, file, status = 200) {
  const ext = extname(file).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  createReadStream(file).pipe(res);
}

function resolveFile(urlPath) {
  // resist traversal — normalise then verify resolved path stays under ROOT
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safe = normalize(decoded).replace(/^(\.{2}(\/|\\|$))+/, '');
  const candidate = join(ROOT, safe);
  if (!candidate.startsWith(ROOT)) return null;
  if (existsSync(candidate)) {
    const stat = statSync(candidate);
    if (stat.isFile()) return candidate;
    if (stat.isDirectory()) {
      const idx = join(candidate, 'index.html');
      if (existsSync(idx)) return idx;
    }
  }
  // cleanUrls behaviour — try .html for extensionless paths
  if (!extname(safe)) {
    const withHtml = `${candidate}.html`;
    if (existsSync(withHtml)) return withHtml;
  }
  return null;
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url ?? '/');
  if (file) {
    if (IMMUTABLE.test(req.url ?? '')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return send(res, file);
  }
  // SPA fallback
  return send(res, INDEX, 200);
});

server.listen(PORT, HOST, () => {
  console.log(`static-server listening on ${HOST}:${PORT} serving ${ROOT}`);
});
