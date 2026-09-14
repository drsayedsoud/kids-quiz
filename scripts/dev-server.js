// scripts/dev-server.js - معاينة محلية: يخدم ملفات المشروع ويشغّل دوال api/ كما تفعل Vercel
// التشغيل: node scripts/dev-server.js   ثم افتح http://localhost:3999/story.html
const express = require('express');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const app = express();
app.use(express.json({ limit: '1mb' }));

fs.readdirSync(path.join(root, 'api')).filter(f => f.endsWith('.js')).forEach(f => {
  const route = '/api/' + f.replace(/\.js$/, '');
  const handler = require(path.join(root, 'api', f));
  app.all(route, (req, res) => Promise.resolve(handler(req, res)).catch(err => { console.error(err); res.status(500).json({ error: err.message }); }));
  console.log('mounted', route);
});

app.use(express.static(root, { etag: false, maxAge: 0 }));
const port = process.env.PORT || 3999;
app.listen(port, () => console.log(`dev server on http://localhost:${port}`));
