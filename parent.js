// Parent report charts (parent.html), two views:
//  1. sessions finished on this device (userSessions): every game, including forest, runner and math rooms;
//  2. per-question answers the quiz saves to results/<uid>/<quizType>/<questionId> (time + right/wrong).
// firebase-init.js finishes signing in (top-level await) before this module runs, so the page is already
// parsed by then: render straight away. Waiting for DOMContentLoaded here left the page stuck on "loading".
import { db, auth, ref, get } from "./firebase-init.js";

const categoryLabels = {
  kids_1: 'تحديات الحضانة والبراعم',
  kids_2: 'تحديات الصف الثاني',
  kids_3: 'تحديات الصف الثالث',
  kids_forest: 'مغامرة الغابة',
  kids_runner: 'سباق البطل',
  kids_piggy: 'مسائل الحصالة والمال',
  mixed: 'القرآن الكريم والحديث',
  seerah: 'السيرة النبوية الشريفة',
  math: 'الرياضيات والعمليات الحسابية',
  english: 'اللغة الإنجليزية',
  general: 'معلومات عامة وثقافية',
  review: 'مراجعة الأخطاء',
  daily: 'التحدي اليومي'
};
const getCategoryName = cat => categoryLabels[cat] || (cat ? String(cat).replace('kids_', 'أطفال ').split('_')[0] : 'تدريب عام');

const container = document.getElementById('results-container');
const isDark = () => document.body.classList.contains('kids-dark');
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

function getLocalSessions() {
  try {
    const list = JSON.parse(localStorage.getItem('userSessions') || '[]');
    return Array.isArray(list) ? list.filter(s => s && typeof s.score === 'number' && s.total > 0) : [];
  } catch (e) {
    return [];
  }
}

async function loadCloudResults() {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const snap = await withTimeout(get(ref(db, `results/${user.uid}`)), 10000);
    return snap.val();
  } catch (e) {
    console.warn('Cloud results unavailable, showing this device only:', e.message || e);
    return null;
  }
}

function sectionHead(title, hint) {
  const head = document.createElement('div');
  head.className = 'section-head';
  const h = document.createElement('h2');
  h.textContent = title;
  const p = document.createElement('p');
  p.textContent = hint;
  head.append(h, p);
  container.appendChild(head);
}

// One card: title, stat pills, a canvas ready for the chart
function addCard(title, pills) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  const head = document.createElement('div');
  head.className = 'chart-head';
  const h3 = document.createElement('h3');
  h3.className = 'chart-title';
  h3.textContent = '📚 ' + title;
  const pillsBox = document.createElement('div');
  pillsBox.className = 'chart-stats-pills';
  pills.forEach(([text, accent]) => {
    const span = document.createElement('span');
    span.className = accent ? 'pill accent' : 'pill';
    span.textContent = text;
    pillsBox.appendChild(span);
  });
  head.append(h3, pillsBox);
  const wrap = document.createElement('div');
  wrap.className = 'canvas-wrap';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  card.append(head, wrap);
  container.appendChild(card);
  return canvas;
}

function drawBars(canvas, { labels, values, colors, yTick, yTitle, max, tooltip }) {
  const text = isDark() ? '#e2e8f0' : '#334155';
  const grid = isDark() ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const font = { family: "'Cairo', sans-serif", weight: 'bold' };
  new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c[0]),
        borderColor: colors.map(c => c[1]),
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max,
          title: yTitle ? { display: true, text: yTitle, color: text, font } : undefined,
          ticks: { callback: yTick, color: text, font },
          grid: { color: grid }
        },
        x: {
          ticks: { color: text, font, maxRotation: 0, autoSkip: true },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: { ...font, size: 13 },
          bodyFont: { ...font, size: 12 },
          padding: 10,
          callbacks: { label: tooltip }
        }
      }
    }
  });
}

const GREEN = ['#10b981', '#059669'];
const AMBER = ['#f59e0b', '#d97706'];
const RED = ['#ef4444', '#dc2626'];
const shortDate = at => new Date(at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' });

// View 1: the last 15 sessions of every game type, as mastery %
function renderSessions(sessions) {
  const groups = {};
  sessions.forEach(s => { (groups[s.type || 'general'] = groups[s.type || 'general'] || []).push(s); });
  Object.entries(groups).forEach(([type, list]) => {
    list.sort((a, b) => (a.at || 0) - (b.at || 0));
    const correct = list.reduce((a, s) => a + (s.score || 0), 0);
    const total = list.reduce((a, s) => a + (s.total || 0), 0);
    const recent = list.slice(-15);
    const scores = recent.map(s => Math.round((s.score / s.total) * 100));
    const canvas = addCard(getCategoryName(type), [
      [`الجلسات: ${list.length}`],
      [`نسبة الإتقان: ${total ? Math.round((correct / total) * 100) : 0}%`, true],
      [`الإجابات الصحيحة: ${correct}/${total}`]
    ]);
    drawBars(canvas, {
      labels: recent.map((s, i) => s.at ? shortDate(s.at) : `تحدي ${i + 1}`),
      values: scores,
      colors: scores.map(p => p >= 80 ? GREEN : p >= 60 ? AMBER : RED),
      yTick: v => `${v}%`,
      max: 100,
      tooltip: c => {
        const s = recent[c.dataIndex];
        return [`نسبة الإتقان: ${c.formattedValue}%`, `الإجابات: ${s.score} من ${s.total}`];
      }
    });
  });
  return Object.keys(groups).length;
}

// View 2: the last 20 answered questions of every quiz type, as time per question, green/red by correctness
function renderQuestions(data) {
  let cards = 0;
  Object.entries(data).forEach(([type, questions]) => {
    if (!questions || typeof questions !== 'object') return;
    const recs = Object.values(questions)
      .filter(r => r && typeof r === 'object')
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .slice(-20);
    if (!recs.length) return;
    const times = recs.map(r => Math.round((r.time || 0) / 100) / 10);
    const right = recs.filter(r => r.correct).length;
    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1);
    const canvas = addCard(getCategoryName(type), [
      [`آخر ${recs.length} سؤالاً`],
      [`صحيحة: ${Math.round((right / recs.length) * 100)}%`, true],
      [`متوسط الوقت: ${avg} ث`]
    ]);
    drawBars(canvas, {
      labels: recs.map((r, i) => `${i + 1}`),
      values: times,
      colors: recs.map(r => r.correct ? GREEN : RED),
      yTick: v => `${v} ث`,
      yTitle: 'الوقت المستغرق (بالثواني)',
      tooltip: c => {
        const r = recs[c.dataIndex];
        const lines = [`الوقت: ${c.formattedValue} ثانية`, `النتيجة: ${r.correct ? '✔️ صحيحة' : '❌ تحتاج مراجعة'}`];
        if (r.timestamp) lines.push(`التاريخ: ${shortDate(r.timestamp)}`);
        return lines;
      }
    });
    cards++;
  });
  return cards;
}

function renderMessage(emoji, title, text, withButton) {
  container.innerHTML = `
    <div class="hero-box" style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 3em; margin-bottom: 12px;">${emoji}</div>
      <h2 style="color: #5f27cd; font-size: 1.25em; margin: 0 0 8px;">${title}</h2>
      <p style="color: #475569; font-weight: 700; margin: 0 0 20px;">${text}</p>
      ${withButton ? '<a href="index.html" class="nav-btn" style="background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 1em;">🎮 ابدأ تحدياً الآن</a>' : ''}
    </div>`;
}

async function render() {
  if (typeof Chart === 'undefined') {
    renderMessage('📡', 'تعذر تحميل الرسوم البيانية', 'تأكد من اتصال الإنترنت ثم أعد فتح الصفحة.', false);
    return;
  }
  const sessions = getLocalSessions();
  const cloud = await loadCloudResults();
  container.innerHTML = '';
  let cards = 0;
  if (sessions.length) {
    sectionHead('🎮 نتائج التحديات والألعاب', 'نسبة الإتقان في آخر 15 جلسة لكل قسم على هذا الجهاز (أخضر 80% فأكثر، برتقالي 60–79%، أحمر أقل من 60%).');
    cards += renderSessions(sessions);
  }
  if (cloud && typeof cloud === 'object') {
    const before = container.childElementCount;
    sectionHead('⏱️ سجل الأسئلة التفصيلي', 'آخر 20 سؤالاً في كل قسم: ارتفاع العمود هو وقت الإجابة بالثواني، الأخضر إجابة صحيحة والأحمر تحتاج مراجعة.');
    const added = renderQuestions(cloud);
    if (!added) while (container.childElementCount > before) container.lastChild.remove();
    cards += added;
  }
  if (!cards) renderMessage('🌟', 'لا توجد نتائج مسجلة حتى الآن', 'ابدأ أول تحدٍّ مع طفلك ليتم تسجيل النتائج والرسوم البيانية هنا!', true);
}

render().catch(err => {
  console.error('parent report:', err);
  renderMessage('⚠️', 'حدث خطأ أثناء عرض النتائج', 'أعد فتح الصفحة، وإذا تكرر الخطأ أخبرنا.', false);
});
