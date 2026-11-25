import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const port = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true,
    fallthrough: true,
  }),
);

app.use(
  '/src/assets',
  express.static(path.join(distDir, 'src', 'assets'), {
    maxAge: '1y',
    immutable: true,
    fallthrough: true,
  }),
);

app.use(
  express.static(distDir, {
    index: false,
    setHeaders(res, filePath) {
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.get('*', (_req, res) => {
  if (!fs.existsSync(indexHtmlPath)) {
    res.status(503).send('Build output not found. Run npm run build first.');
    return;
  }
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(indexHtmlPath);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
