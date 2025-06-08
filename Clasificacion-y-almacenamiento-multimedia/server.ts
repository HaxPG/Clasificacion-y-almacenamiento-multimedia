import 'zone.js/node';
import express from 'express';
import { join } from 'path';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync, readFileSync } from 'fs';
import { renderApplication } from '@angular/platform-server';
import AppServerModule from './src/main.server';

const DIST_FOLDER = join(process.cwd(), 'dist/clasificacion-y-almacenamiento-multimedia/browser');
const INDEX_HTML = existsSync(join(DIST_FOLDER, 'index.original.html'))
  ? 'index.original.html'
  : 'index.html';

const app = express();

app.get('*.*', express.static(DIST_FOLDER, {
  maxAge: '1y'
}));

app.get('*', async (req, res) => {
  try {
    const indexHtml = readFileSync(join(DIST_FOLDER, INDEX_HTML)).toString();

    const html = await renderApplication(AppServerModule, {
      document: indexHtml,
      url: req.originalUrl,
      platformProviders: [
        { provide: APP_BASE_HREF, useValue: req.baseUrl }
      ]
    });

    res.status(200).send(html);
  } catch (err: any) {
    console.error('Error during server-side rendering:', err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env['PORT'] || 4000;
app.listen(PORT, () => {
  console.log(`Node server listening on http://localhost:${PORT}`);
});

