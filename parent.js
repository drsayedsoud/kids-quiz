// parent.js – Dashboard for parents to view a child’s quiz results
// ---------------------------------------------------------------
// This module expects the user to be logged in as a parent (the same
// Firebase auth used throughout the app). It loads the list of children
// linked under `/parents/{parentUid}/children` and, when a child is
// selected, reads that child’s results from `/results/{childUid}/{quizType}`.
// The results are rendered with Chart.js as a simple bar chart showing
// the time taken for each question and indicating correctness via bar
// colour (green = correct, red = wrong).

import { db, currentUser } from "./firebase-init.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// -----------------------------------------------------------------
// Helper: Populate the children <select>
function loadChildren() {
  const user = currentUser();
  if (!user) return;
  const parentUid = user.uid;
  const childrenRef = ref(db, `parents/${parentUid}/children`);
  onValue(childrenRef, snap => {
    const select = document.getElementById('child-select');
    // Clear existing options except the placeholder
    select.innerHTML = '<option value="" disabled selected>— اختر طفلاً —</option>';
    const children = snap.val() || {};
    Object.keys(children).forEach(childUid => {
      const opt = document.createElement('option');
      opt.value = childUid;
      // You may store a friendly name under children/{uid}/name
      opt.textContent = children[childUid].name || childUid;
      select.appendChild(opt);
    });
  }, err => console.error('Error loading children:', err));
}

// -----------------------------------------------------------------
// Helper: Render results for the selected child
function renderResults(childUid) {
  const quizType = localStorage.getItem('quizType') || 'mixed';
  const resultsRef = ref(db, `results/${childUid}/${quizType}`);
  get(resultsRef).then(snap => {
    const data = snap.val() || {};
    const labels = [];
    const times = [];
    const correctness = [];
    Object.entries(data).forEach(([questionId, rec]) => {
      labels.push(questionId);
      times.push(rec.time || 0);
      correctness.push(rec.correct ? 1 : 0);
    });
    drawChart(labels, times, correctness);
  }).catch(err => console.error('Error loading results:', err));
}

// -----------------------------------------------------------------
// Helper: Draw a Chart.js bar chart
let chartInstance = null;
function drawChart(labels, times, correctness) {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'الوقت (مللي ثانية)',
        data: times,
        backgroundColor: '#3d8bfd',
        borderColor: '#1a5cc0',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const idx = ctx.dataIndex;
              const correct = correctness[idx] ? '✔️ صحيح' : '❌ خاطئ';
              return `${ctx.dataset.label}: ${ctx.formattedValue} – ${correct}`;
            }
          }
        }
      }
    }
  });
}

// -----------------------------------------------------------------
// Initialise UI
document.addEventListener('DOMContentLoaded', () => {
  loadChildren();
  const select = document.getElementById('child-select');
  select.addEventListener('change', e => {
    const uid = e.target.value;
    if (uid) renderResults(uid);
  });
});
