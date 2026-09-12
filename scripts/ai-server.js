const express = require('express');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// Local tool only (run with `npm run api` next to Ollama): it listens on this computer alone and never goes to Vercel.
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const root = path.join(__dirname, '..');
const CATEGORY_RE = /^[a-z0-9_]{1,32}$/; // a bank file name such as kids_2: no dots or slashes, so it cannot leave data/
const dataDir = path.join(root, 'data');

// ========== ZIP Utilities (من append-questions.js) ==========
function readFirstEntry(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('not a zip file');
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const method = buf.readUInt16LE(cdOffset + 10);
  const compSize = buf.readUInt32LE(cdOffset + 20);
  const localOffset = buf.readUInt32LE(cdOffset + 42);
  const lNameLen = buf.readUInt16LE(localOffset + 26);
  const lExtraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + lNameLen + lExtraLen;
  const data = buf.slice(dataStart, dataStart + compSize);
  return method === 8 ? zlib.inflateRawSync(data) : data;
}

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function writeZip(entryName, content) {
  const nameBuf = Buffer.from(entryName);
  const deflated = zlib.deflateRawSync(content, { level: 9 });
  const crc = crc32(content);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0, 10); local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(deflated.length, 18);
  local.writeUInt32LE(content.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(deflated.length, 20); central.writeUInt32LE(content.length, 24); central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38); central.writeUInt32LE(0, 42);
  const cdOffset = local.length + nameBuf.length + deflated.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length + nameBuf.length, 12); eocd.writeUInt32LE(cdOffset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([local, nameBuf, deflated, central, nameBuf, eocd]);
}

// ========== Ollama Integration ==========
async function generateQuestionsWithOllama(topic, count, category) {
  const prompt = `أنت معلم عبقري. توليد ${count} أسئلة تعليمية للأطفال (الصف الثاني والثالث الابتدائي) عن "${topic}" بصيغة JSON صارمة فقط، بدون أي نص إضافي.

كل سؤال يجب أن يحتوي على:
- question: السؤال بالعربية (واضح وبسيط)
- choice1, choice2, choice3, choice4: أربع خيارات مختلفة (واحد صحيح، ثلاثة خاطئة لكن معقولة)
- correct_answer: الإجابة الصحيحة (يجب أن تطابق أحد الخيارات تماماً)
- explanation: شرح مختصر (جملة واحدة) للإجابة
- type: "${category}"

ملاحظات مهمة:
1. الخيارات الأربعة يجب أن تكون مختلفة تماماً
2. الإجابة الصحيحة يجب أن تكون صحيحة 100%
3. الخيارات الخاطئة يجب أن تكون معقولة (تخادع الطفل قليلاً)
4. لا تستخدم كلمات صعبة جداً
5. ارجع JSON array فقط بدون أي نص آخر

[JSON array here]`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.statusText}`);
    const data = await response.json();
    const responseText = data.response;

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const questions = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    throw new Error(`Ollama generation failed: ${error.message}`);
  }
}

// ========== Validation ==========
function validateQuestion(q) {
  const errors = [];

  if (!q.question || typeof q.question !== 'string') errors.push('question مفقود أو غير نص');
  if (!q.choice1 || !q.choice2 || !q.choice3 || !q.choice4) errors.push('خيار واحد أو أكثر مفقود');

  const choices = [q.choice1, q.choice2, q.choice3, q.choice4].filter(Boolean);
  const uniqueChoices = new Set(choices.map(c => String(c).trim()));
  if (uniqueChoices.size !== 4) errors.push('الخيارات ليست فريدة');

  if (!q.correct_answer || !choices.includes(q.correct_answer)) {
    errors.push('correct_answer مفقود أو غير موجود في الخيارات');
  }

  if (!q.explanation || typeof q.explanation !== 'string') errors.push('explanation مفقود');

  return errors.length === 0 ? null : errors;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return 'يجب أن تكون النتيجة array';

  const allErrors = {};
  questions.forEach((q, i) => {
    const errors = validateQuestion(q);
    if (errors) allErrors[i] = errors;
  });

  return Object.keys(allErrors).length > 0 ? allErrors : null;
}

// ========== Endpoints ==========

// POST /api/generate-questions
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { topic, count, category } = req.body;

    if (!topic || !count || !category) {
      return res.status(400).json({ error: 'topic, count, category مطلوبة' });
    }

    if (count < 1 || count > 50) {
      return res.status(400).json({ error: 'count يجب أن يكون بين 1 و 50' });
    }

    console.log(`🤖 Generating ${count} questions about "${topic}" for ${category}...`);

    const questions = await generateQuestionsWithOllama(topic, count, category);
    const validationErrors = validateQuestions(questions);

    if (validationErrors) {
      return res.status(422).json({
        error: 'بعض الأسئلة غير صحيحة',
        details: validationErrors,
        questions // ارجع الأسئلة ليعدلها المستخدم
      });
    }

    res.json({
      success: true,
      count: questions.length,
      questions,
      message: `تم توليد ${questions.length} سؤال بنجاح ✅`
    });
  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      error: error.message,
      hint: 'تأكد من تشغيل Ollama: ollama serve'
    });
  }
});

// POST /api/publish
app.post('/api/publish', async (req, res) => {
  try {
    const { category, questions, gitMessage } = req.body;

    if (!category || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'category و questions (array) مطلوبة' });
    }
    if (!CATEGORY_RE.test(category)) {
      return res.status(400).json({ error: 'اسم الفئة غير صالح' });
    }

    const zipPath = path.join(dataDir, category + '.zip');
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ error: `الفئة ${category} غير موجودة` });
    }

    console.log(`📦 Publishing ${questions.length} questions to ${category}...`);

    // Read existing ZIP
    const zipBuffer = fs.readFileSync(zipPath);
    const jsonBuffer = readFirstEntry(zipBuffer);
    const existingQuestions = JSON.parse(jsonBuffer.toString('utf8'));

    // Merge questions (keep by question text + image)
    const newQuestions = [...existingQuestions];
    questions.forEach(q => {
      const idx = newQuestions.findIndex(eq =>
        eq.question === q.question && eq.image === q.image
      );
      if (idx >= 0) {
        newQuestions[idx] = { ...newQuestions[idx], ...q };
      } else {
        // Add new question with order
        const maxOrder = Math.max(...newQuestions.map(eq => parseFloat(eq.order) || 0), 0);
        newQuestions.push({ ...q, order: maxOrder + 1 });
      }
    });

    // Write ZIP
    fs.writeFileSync(zipPath, writeZip(category + '.json', Buffer.from(JSON.stringify(newQuestions))));

    // Update manifest
    const manifestPath = path.join(dataDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const hash = crypto.createHash('sha1');
    const categoryFiles = Object.keys(manifest.categories || {});
    categoryFiles.forEach(cat => {
      const p = path.join(dataDir, cat + '.zip');
      if (fs.existsSync(p)) hash.update(fs.readFileSync(p));
    });

    manifest.version = hash.digest('hex').slice(0, 10);
    manifest.builtAt = new Date().toISOString();
    manifest.categories[category] = {
      count: newQuestions.length,
      bytes: fs.statSync(zipPath).size
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    // Git commit + push
    try {
      // arguments go straight to git (no shell), and only the question bank is staged
      const message = String(gitMessage || `Add AI-generated questions to ${category}`).slice(0, 200);
      execFileSync('git', ['add', '--', path.join('data', category + '.zip'), path.join('data', 'manifest.json')], { cwd: root });
      execFileSync('git', ['commit', '-m', message], { cwd: root });
      execFileSync('git', ['push', 'origin', 'main'], { cwd: root });
      console.log('✅ Published to GitHub');
    } catch (gitError) {
      console.warn('⚠️ Git push failed (might be offline):', gitError.message);
    }

    res.json({
      success: true,
      message: `تم نشر ${questions.length} سؤال إلى ${category} ✅`,
      manifest: manifest.categories[category]
    });
  } catch (error) {
    console.error('❌ Publish error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   - POST /api/generate-questions - توليد أسئلة`);
  console.log(`   - POST /api/publish - نشر الأسئلة`);
  console.log(`   - GET /api/health - فحص الحالة`);
});
