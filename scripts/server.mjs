import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const homeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const frontendEntries = ['index.html', 'css', 'js', 'assets'];
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};

function reply(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(text);
}

function within(root, file) { return file === root || file.startsWith(`${root}${path.sep}`); }

export async function startServer({ dist = false } = {}) {
  const root = dist ? path.join(homeRoot, 'dist') : homeRoot;
  try { await stat(path.join(root, 'index.html')); } catch {
    throw new Error(dist ? '没有可预览的 dist，请先运行 npm run build。' : '找不到主页 index.html。');
  }
  const actualRoot = await realpath(root);
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须为 1–65535 的整数。');
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some((part) => part === '..' || part.startsWith('.'))) {
        return reply(res, 403, '禁止访问此路径。');
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return reply(res, 405, '仅支持 GET 和 HEAD。');
      }
      const relative = pathname.slice(1) || 'index.html';
      if (!frontendEntries.includes(relative.split('/')[0])) return reply(res, 404, '找不到这个文件。');
      let file = path.resolve(root, relative);
      if (!within(root, file)) return reply(res, 403, '禁止访问此路径。');
      let info = await stat(file);
      if (info.isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(308, { Location: `${pathname}/` });
          return res.end();
        }
        file = path.join(file, 'index.html');
        info = await stat(file);
      }
      if (!info.isFile()) return reply(res, 404, '找不到这个文件。');
      if (!within(actualRoot, await realpath(file))) return reply(res, 403, '禁止访问此路径。');
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error instanceof URIError || error.code === 'ERR_INVALID_URL') return reply(res, 400, '无效的请求地址。');
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return reply(res, 404, '找不到这个文件。');
      console.error(error);
      reply(res, 500, '读取文件失败。');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  console.log(`奶龙游乐园${dist ? '（构建预览）' : ''}：http://127.0.0.1:${port}/`);
  console.log('按 Ctrl+C 停止服务。');
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer({ dist: process.argv.includes('--dist') }).catch((error) => {
    console.error(error.code === 'EADDRINUSE' ? `端口 ${process.env.PORT || 8787} 已被占用，请关闭已有服务或使用 PORT=8788 npm run dev。` : error.message);
    process.exitCode = 1;
  });
}
