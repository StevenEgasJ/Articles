import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const MAX_ROWS = process.env.MAX_ROWS ? parseInt(process.env.MAX_ROWS) : 25;
const MAILTO = process.env.CROSSREF_MAILTO || '';

// Very small in-memory rate limiter per IP (simple)
const requests: Record<string, number[]> = {};
const LIMIT = 30; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

function rateLimit(reqIp: string) {
  const now = Date.now();
  if (!requests[reqIp]) requests[reqIp] = [];
  requests[reqIp] = requests[reqIp].filter((t) => now - t < WINDOW_MS);
  if (requests[reqIp].length >= LIMIT) return false;
  requests[reqIp].push(now);
  return true;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const rows = Math.min(MAX_ROWS, Number(req.query.rows) || 20);
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';

    if (!rateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests, slow down' });
    }

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const crossrefUrl = 'https://api.crossref.org/works';
    const params: Record<string, string | number> = { query: q, rows: rows };
    if (MAILTO) (params as any).mailto = MAILTO;

    const response = await axios.get(crossrefUrl, { params, timeout: 10000 });
    const items = response.data?.message?.items || [];

    // Normalize items
    const results = items.map((it: any) => {
      const title = Array.isArray(it.title) ? it.title[0] : it.title || '';
      const authors = (it.author || []).map((a: any) => {
        const family = a.family || '';
        const given = a.given || '';
        return `${given} ${family}`.trim();
      });
      const journal = Array.isArray(it['container-title']) ? it['container-title'][0] : it['container-title'] || '';
      const year = it['issued']?.['date-parts']?.[0]?.[0] || it['created']?.['date-parts']?.[0]?.[0] || '';
      const doi = it.DOI || '';
      const abstract = it.abstract || '';
      const url = it.URL || '';
      return { title, authors, journal, year, doi, abstract, url };
    });

    res.json({ total: response.data?.message?.['total-results'] || results.length, results });
  } catch (err: any) {
    console.error('Search error', err?.message || err);
    if (err.code === 'ECONNABORTED') return res.status(504).json({ error: 'Upstream timeout' });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend in production (if built into frontend/dist/frontend)
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'frontend');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => res.sendFile(path.join(staticPath, 'index.html')));
}

app.listen(PORT, () => console.log(`Research backend running on http://localhost:${PORT}`));