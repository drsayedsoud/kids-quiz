import { db, currentUser } from "./firebase-init.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

function renderAllResults(user) {
  const container = document.getElementById('results-container');
  
  if (!user) {
    container.innerHTML = '<p style="text-align:center; color:#ef4444; font-weight:bold; font-size:1.1em; padding: 30px 0;">يجب تسجيل الدخول لعرض النتائج.</p>';
    return;
  }
  
  const resultsRef = ref(db, `results/${user.uid}`);
  get(resultsRef).then(snap => {
    const data = snap.val();
    if (!data) {
      container.innerHTML = '<p style="text-align:center; color:#5f6c7b; font-weight:bold; font-size:1.1em; padding: 30px 0;">لا توجد نتائج مسجلة حتى الآن.<br>ابدأ اللعب لتظهر النتائج هنا!</p>';
      return;
    }
    
    container.innerHTML = '';
    
    // Each key in data is a quizType, like 'mixed', 'english', etc.
    Object.entries(data).forEach(([quizType, questions]) => {
      const section = document.createElement('div');
      section.style.marginBottom = '32px';
      
      const title = document.createElement('h3');
      const titleName = quizType === 'mixed' ? 'تدريب عام' : quizType === 'english' ? 'لغة إنجليزية' : quizType;
      title.textContent = 'نوع التدريب: ' + titleName;
      title.style.color = '#5f27cd';
      title.style.borderBottom = '2px dashed #c8b6ff';
      title.style.paddingBottom = '8px';
      title.style.marginBottom = '16px';
      section.appendChild(title);
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.style.position = 'relative';
      canvasWrapper.style.height = '250px';
      canvasWrapper.style.width = '100%';
      
      const canvas = document.createElement('canvas');
      canvasWrapper.appendChild(canvas);
      section.appendChild(canvasWrapper);
      
      container.appendChild(section);
      
      const labels = [];
      const times = [];
      const correctness = [];
      
      // Limit to the last 20 questions for clarity
      const questionEntries = Object.entries(questions).slice(-20);
      
      questionEntries.forEach(([qId, rec], index) => {
        labels.push(`سؤال ${index + 1}`);
        times.push(rec.time || 0);
        correctness.push(rec.correct ? true : false);
      });
      
      drawChart(canvas, labels, times, correctness);
    });
    
  }).catch(err => {
    console.error('Error loading results:', err);
    container.innerHTML = '<p style="text-align:center; color:#ef4444; font-weight:bold; font-size:1.1em;">حدث خطأ أثناء تحميل النتائج.</p>';
  });
}

function drawChart(canvas, labels, times, correctness) {
  const ctx = canvas.getContext('2d');
  
  Chart.defaults.color = '#5f6c7b';
  Chart.defaults.font.family = "'Cairo', sans-serif";
  Chart.defaults.font.size = 13;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'الوقت المستغرق (م.ث)',
        data: times,
        backgroundColor: correctness.map(c => c ? '#10b981' : '#ef4444'),
        borderColor: correctness.map(c => c ? '#059669' : '#b91c1c'),
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true,
          title: { display: true, text: 'الوقت بالمللي ثانية' }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(47, 59, 82, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          titleFont: { family: "'Cairo', sans-serif", size: 14 },
          bodyFont: { family: "'Cairo', sans-serif", size: 13, weight: 'bold' },
          padding: 10,
          callbacks: {
            label: ctx => {
              const idx = ctx.dataIndex;
              const correct = correctness[idx] ? '✔️ صحيحة' : '❌ خاطئة';
              return [`الوقت: ${ctx.formattedValue} م.ث`, `النتيجة: ${correct}`];
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
    if (user) {
      renderAllResults(user);
    } else {
      document.getElementById('results-container').innerHTML = '<p style="text-align:center; color:#ef4444; font-weight:bold; font-size:1.1em; padding: 30px 0;">يجب تسجيل الدخول لعرض النتائج.</p>';
    }
  });
});
