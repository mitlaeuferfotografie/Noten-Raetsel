const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5181;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

http
  .createServer((req, res) => {
    let filePath = decodeURIComponent(req.url.split('?')[0]);
    if (filePath === '/') filePath = '/index.html';
    const fullPath = path.join(ROOT, filePath);

    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(fullPath);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`Serving Noten-Rätsel at http://localhost:${PORT}`);
  });
