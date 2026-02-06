import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DATA_PATH = path.resolve(__dirname, '../api/posts/dev_posts.json');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/posts', (req, res) => {
  const rows = readData();
  rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(rows);
});

app.post('/api/posts', (req, res) => {
  const body = req.body;
  const id = randomUUID();
  const slug = body.slug || (body.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g,'-');
  const now = new Date().toISOString();
  const row = {
    id,
    slug,
    title: body.title,
    date: body.date,
    excerpt: body.excerpt,
    image: body.image,
    category: body.category,
    featured: body.featured ?? false,
    content: body.content,
    status: body.status,
    created_at: now,
    updated_at: now,
    version: 1,
  };
  const data = readData();
  data.push(row);
  writeData(data);
  res.status(201).json(row);
});

app.get('/api/posts/:id', (req, res) => {
  const data = readData();
  const row = data.find(r => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found' });
  res.json(row);
});

app.put('/api/posts/:id', (req, res) => {
  const body = req.body;
  const data = readData();
  const idx = data.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  const now = new Date().toISOString();
  const updated = Object.assign({}, data[idx], {
    title: body.title,
    date: body.date,
    excerpt: body.excerpt,
    image: body.image,
    category: body.category,
    featured: body.featured ?? false,
    content: body.content,
    status: body.status,
    slug: body.slug,
    updated_at: now,
    version: (data[idx].version || 0) + 1,
  });
  data[idx] = updated;
  writeData(data);
  res.json(updated);
});

// Support query-string id to match frontend dev requests.
app.put('/api/posts', (req, res) => {
  const id = req.query.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing post ID' });
  }

  const body = req.body;
  const data = readData();
  const idx = data.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });

  const now = new Date().toISOString();
  const updated = Object.assign({}, data[idx], {
    title: body.title,
    date: body.date,
    excerpt: body.excerpt,
    image: body.image,
    category: body.category,
    featured: body.featured ?? false,
    content: body.content,
    status: body.status,
    slug: body.slug,
    updated_at: now,
    version: (data[idx].version || 0) + 1,
  });
  data[idx] = updated;
  writeData(data);
  res.json(updated);
});

app.delete('/api/posts/:id', (req, res) => {
  const data = readData();
  const idx = data.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  const removed = data.splice(idx,1);
  writeData(data);
  res.status(204).end();
});

// Support query-string id to match frontend dev requests.
app.delete('/api/posts', (req, res) => {
  const id = req.query.id;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing post ID' });
  }

  const data = readData();
  const idx = data.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Post not found' });
  data.splice(idx, 1);
  writeData(data);
  res.status(204).end();
});

const PORT = process.env.DEV_API_PORT || 3001;
app.listen(PORT, () => console.log(`Dev API listening on http://localhost:${PORT}`));
