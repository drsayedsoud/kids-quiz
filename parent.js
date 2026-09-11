import { db, currentUser } from "./firebase-init.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const categoryLabels = {
  kids_1: 'تحديات الحضانة والبراعم',
  kids_2: 'تحديات الصف الثاني',
  kids_3: 'تحديات الصف الثالث',
  mixed: 'القرآن الكريم والحديث',
  seerah: 'السيرة النبوية الشريفة',
  math: 'الرياضيات والعمليات الحسابية',
  english: 'اللغة الإنجليزية',
  general: 'معلومات عامة وثقافية',
  kids_piggy: 'مسائل الحصالة والمال',
  daily: 'التحدي اليومي'
};

const getCategoryName = cat => categoryLabels[cat] || (cat ? cat.replace('kids_', 'أطفال ').split('_')[0] : 'تدريب عام');

function getLocalSessions() {
  try {
    const raw = localStorage.getItem('userSessions');
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
}

function renderLocalSessions(container) {
  const sessions = getLocalSessions().filter(s => s && typeof s.score === 'number' && s.total > 0);
  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="hero-box" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3em; margin-bottom: 12px;">🌟</div>
        <h2 style="color: #5f27cd; font-size: 1.25em; margin: 0 0 8px;">لا توجد نتائج مسجلة حتى الآن</h2>
        <p style="color: #475569; font-weight: 700; margin: 0 0 20px;">ابدأ أول تحدٍّ مع طفلك ليتم تسجيل النتائج والرسوم البيانية بدقة هنا!</p>
        <a href="index.html" class="nav-btn" style="background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 1em;">🎮 ابدأ تحدياً الآن</a>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  // تجميع الجلسات حسب نوع التحدي
  const groups = {};
  sessions.forEach(s => {
    const type = s.type || 'general';
    if (!groups[type]) groups[type] = [];
    groups[type].push(s);
  });

  Object.entries(groups).forEach(([quizType, list]) => {
    const card = document.createElement('div');
    card.className = 'chart-card';

    // إحصائيات سريعة للقسم
    const totalCorrect = list.reduce((a, s) => a + (s.score || 0), 0);
    const totalQuestions = list.reduce((a, s) => a + (s.total || 0), 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const head = document.createElement('div');
    head.className = 'chart-head';
    head.innerHTML = `
      <h3 class="chart-title">
        <span>📚</span>
        <span>${getCategoryName(quizType)}</span>
      </h3>
      <div class="chart-stats-pills">
        <span class="pill">الجلسات: ${list.length}</span>
        <span class="pill accent">نسبة الإتقان: ${accuracy}%</span>
        <span class="pill">الأسئلة: ${totalCorrect}/${totalQuestions}</span>
      </div>
    `;
    card.appendChild(head);

    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrap';

    const canvas = document.createElement('canvas');
    canvasWrapper.appendChild(canvas);
    card.appendChild(canvasWrapper);
    container.appendChild(card);

    // تجهيز بيانات آخر 15 جلسة
    const recent = list.slice(-15);
    const labels = recent.map((s, idx) => `تحدي ${idx + 1}`);
    const scores = recent.map(s => Math.round(((s.score || 0) / (s.total || 1)) * 100));
    const correctness = scores.map(pct => pct >= 60);

    drawSessionChart(canvas, labels, scores, correctness);
  });
}

function drawSessionChart(canvas, labels, scores, correctness) {
  const ctx = canvas.getContext('2d');
  Chart.defaults.font.family = "'Cairo', sans-serif";
  Chart.defaults.font.size = 12;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'نسبة الإتقان (%)',
        data: scores,
        backgroundColor: scores.map(s => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'),
        borderColor: scores.map(s => s >= 80 ? '#059669' : s >= 60 ? '#d97706' : '#dc2626'),
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
          max: 100,
          ticks: {
            callback: v => `${v}%`,
            font: { family: "'Cairo', sans-serif", weight: 'bold' }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          ticks: { font: { family: "'Cairo', sans-serif", weight: 'bold' } },
          grid: { display: false }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: { family: "'Cairo', sans-serif", size: 13, weight: 'bold' },
          bodyFont: { family: "'Cairo', sans-serif", size: 12, weight: 'bold' },
          padding: 10,
          callbacks: {
            label: ctx => `نسبة النجاح: ${ctx.formattedValue}%`
          }
        },
        legend: { display: false }
      }
    }
  });
}

function renderAllResults(user) {
  const container = document.getElementById('results-container');
  
  if (!user) {
    // إذا لم يكن مسجلاً، اعرض النتائج المحلية المسجلة على الجهاز
    renderLocalSessions(container);
    return;
  }
  
  const resultsRef = ref(db, `results/${user.uid}`);
  get(resultsRef).then(snap => {
    const data = snap.val();
    if (!data) {
      // إذا لم توجد نتائج في السحابة بعد، اعرض النتائج المحلية
      renderLocalSessions(container);
      return;
    }
    
    container.innerHTML = '';
    
    // Each key in data is a quizType, like 'mixed', 'english', etc.
    Object.entries(data).forEach(([quizType, questions]) => {
      const card = document.createElement('div');
      card.className = 'chart-card';
      
      const questionEntries = Object.entries(questions).slice(-20);
      const correctCount = questionEntries.filter(([, r]) => !!r.correct).length;
      const totalCount = questionEntries.length;
      const correctPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      
      const timesInSeconds = questionEntries.map(([, r]) => Math.round((r.time || 0) / 100) / 10);
      const avgTime = timesInSeconds.length > 0 ? (timesInSeconds.reduce((a, b) => a + b, 0) / timesInSeconds.length).toFixed(1) : 0;

      const head = document.createElement('div');
      head.className = 'chart-head';
      head.innerHTML = `
        <h3 class="chart-title">
          <span>📚</span>
          <span>${getCategoryName(quizType)}</span>
        </h3>
        <div class="chart-stats-pills">
          <span class="pill">آخر ${totalCount} سؤالاً</span>
          <span class="pill accent">نسبة الإتقان: ${correctPct}%</span>
          <span class="pill">متوسط الوقت: ${avgTime}ث</span>
        </div>
      `;
      card.appendChild(head);
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'canvas-wrap';
      
      const canvas = document.createElement('canvas');
      canvasWrapper.appendChild(canvas);
      card.appendChild(canvasWrapper);
      
      container.appendChild(card);
      
      const labels = [];
      const times = [];
      const correctness = [];
      
      questionEntries.forEach(([qId, rec], index) => {
        labels.push(`سؤال ${index + 1}`);
        times.push(Math.round((rec.time || 0) / 100) / 10); // تحويل للثواني
        correctness.push(rec.correct ? true : false);
      });
      
      drawChart(canvas, labels, times, correctness);
    });
    
  }).catch(err => {
    console.warn('Error loading cloud results, falling back to local:', err);
    renderLocalSessions(container);
  });
}

function drawChart(canvas, labels, times, correctness) {
  const ctx = canvas.getContext('2d');
  
  Chart.defaults.color = '#475569';
  Chart.defaults.font.family = "'Cairo', sans-serif";
  Chart.defaults.font.size = 12;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'الوقت المستغرق (ثانية)',
        data: times,
        backgroundColor: correctness.map(c => c ? '#10b981' : '#ef4444'),
        borderColor: correctness.map(c => c ? '#059669' : '#dc2626'),
        borderWidth: 2,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'الوقت المستغرق (بالثواني)', font: { family: "'Cairo', sans-serif", weight: 'bold', size: 12 } },
          ticks: { callback: v => `${v} ث`, font: { family: "'Cairo', sans-serif", weight: 'bold' } },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          ticks: { font: { family: "'Cairo', sans-serif", weight: 'bold' } },
          grid: { display: false }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: { family: "'Cairo', sans-serif", size: 13, weight: 'bold' },
          bodyFont: { family: "'Cairo', sans-serif", size: 12, weight: 'bold' },
          padding: 10,
          callbacks: {
            label: ctx => {
              const idx = ctx.dataIndex;
              const correct = correctness[idx] ? '✔️ صحيحة' : '❌ تحتاج مراجعة';
              return [`الوقت: ${ctx.formattedValue} ثانية`, `النتيجة: ${correct}`];
            }
          }
        },
        legend: { display: false }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    renderAllResults(user);
  });
});

