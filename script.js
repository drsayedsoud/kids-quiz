window.showBalloonFestival = function() {
    let container = document.getElementById("balloon-festival");
    if (!container) {
        container = document.createElement('div');
        container.id = "balloon-festival";
        container.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden;";
        document.body.appendChild(container);

        // Inject balloon CSS if not present
        if (!document.getElementById('balloon-styles')) {
            const style = document.createElement('style');
            style.id = 'balloon-styles';
            style.innerHTML = `
                .kid-balloon {
                    position: absolute;
                    bottom: -100px;
                    width: 40px;
                    height: 60px;
                    border-radius: 50% 50% 40% 40%;
                    animation: floatUp 4s ease-out forwards;
                    z-index: 9999;
                    box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2);
                }
                .kid-balloon::before {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    height: 50px;
                    background: rgba(255,255,255,0.5);
                }
                @keyframes floatUp {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    container.innerHTML = "";
    for (let i = 0; i < 25; i++) {
        const balloon = document.createElement("div");
        balloon.className = "kid-balloon";
        balloon.style.left = Math.random() * 100 + "vw";
        balloon.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 65%)`;
        balloon.style.animationDelay = `${Math.random() * 0.5}s`;
        balloon.style.animationDuration = `${3 + Math.random() * 2}s`;
        container.appendChild(balloon);
    }
};

// ====== بداية كود script.js الكامل مع زر كتم الصوت ======

let quizData = [];

let currentIndex = 0;



let heroPosition = 0;
let streak = 0;
let bestStreak = 0;
let wrongAnswers = [];
let answeredCount = 0;

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
}

function showStreakToast(count) {
  let el = document.getElementById('streak-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'streak-toast';
    el.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%) scale(0.8);background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;font-weight:900;font-family:Cairo,sans-serif;padding:10px 22px;border-radius:999px;box-shadow:0 8px 20px rgba(239,68,68,0.4);z-index:9000;opacity:0;transition:all 0.25s;pointer-events:none;font-size:1.05em;';
    document.body.appendChild(el);
  }
  el.textContent = '🔥 ' + count + ' إجابات صحيحة متتالية!';
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) scale(1)';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) scale(0.8)'; }, 1600);
}
let quizType = localStorage.getItem("quizType") || "mixed";


// Handle multiplayer juz selection embedded in quizType
if (quizType.includes('_juz_')) {
    const parts = quizType.split('_juz_');
    quizType = parts[0];
    localStorage.setItem('selectedJuz', parts[1]);
}


let selectedSura = localStorage.getItem("selectedSura") || null;

let selectedJuz = localStorage.getItem("selectedJuz") || null;

let totalTime = 600;

let questionTime = 30; // مدة السؤال الواحدة

let totalTimerInterval;

let questionTimerInterval;

let correctCount = 0;

// متغير شريط التقدم وساعة السؤال

let questionProgressBar;

let questionTimeLeft = questionTime;

// حالة الصوت (مفعّل أو مكتوم)

let soundEnabled = localStorage.getItem("soundOn");

if (soundEnabled === null) {

  soundEnabled = true; // القيمة الافتراضية صوت شغال

} else {

  soundEnabled = (soundEnabled === "true");

}

// Per-question record for the parent report (parent.html): results/<uid>/<quizType>/<questionId>.
// script.js is a classic script, so Firebase is loaded lazily; a failure here never touches the quiz.
function saveResult(correct, timeMs, answer) {
  const q = quizData && quizData[currentIndex];
  const qId = String((q && (q.questionId || q.id)) || `q${currentIndex}`).replace(/[.#$\[\]\/]/g, '_');
  const type = String(quizType || 'general').replace(/[.#$\[\]\/]/g, '_');
  const payload = {
    correct: !!correct,
    time: Math.max(0, Math.min(Math.round(timeMs) || 0, 3600000)),
    answer: String(answer ?? '').slice(0, 200),
    timestamp: Date.now()
  };
  import('./firebase-init.js').then(({ db, ref, set, currentUser }) => {
    const user = currentUser();
    if (!user) return;
    return set(ref(db, `results/${user.uid}/${type}/${qId}`), payload);
  }).catch(err => console.warn('Error saving result:', err));
}




// الأصوات
// الأصوات
let winSound;
try {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("child.html")) {
    winSound = new Audio("assets/wow.mp3");
  } else {
    winSound = new Audio("assets/win.mp3");
  }
} catch (e) {
  winSound = new Audio("assets/win.mp3"); // fallback
}
const loseSound = new Audio("assets/lose.mp3");

// دالة لتشغيل الصوت فقط إذا كانت مفعلة

function playSound(sound) {

  if (soundEnabled) {

    sound.currentTime = 0;

    sound.play().catch(() => {});

  }

}



// دالة إنشاء زر كتم الصوت أسفل شريط التقدم

function createMuteButton() {

  const container = document.querySelector(".progress-bar-container-3d");

  if (!container) return;

  // تأكد من عدم إضافة الزر مرتين

  if (document.getElementById("mute-sound-btn")) return;

  const btn = document.createElement("button");

  btn.id = "mute-sound-btn";

  btn.textContent = soundEnabled ? "🔊" : "🔇";

  btn.title = "تشغيل / إيقاف الصوت";

  btn.style.cssText = `

    margin-top: 10px;

    font-size: 24px;

    background: none;

    border: none;

    color: white;

    cursor: pointer;

    display: block;

    margin-left: auto;

    margin-right: auto;

  `;

  btn.onclick = () => {

    soundEnabled = !soundEnabled;

    localStorage.setItem("soundOn", soundEnabled);

    btn.textContent = soundEnabled ? "🔊" : "🔇";

  };

  container.parentElement.appendChild(btn);

}





window.onload = function () {

  checkIndexedDB();

  startTotalTimer();

  loadQuestions();

  questionProgressBar = document.getElementById('question-progress-bar');

  updateProgressBar3D(questionTime);

  createMuteButton();

};



// IndexedDB إعدادات

const dbName = 'QuranDB';

const storeName = 'quranData';

const dataKey = 'quranJSON';
// Bump whenever quran.zip changes so devices with an older cached bank download the new one
const DATA_VERSION = 5; // legacy; the bank is now versioned by data/manifest.json

let db;



function openDatabase() {

  return new Promise((resolve, reject) => {

    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {

      db = event.target.result;

      if (!db.objectStoreNames.contains(storeName)) {

        db.createObjectStore(storeName);

      }

    };

    request.onsuccess = (event) => {

      db = event.target.result;

      resolve(db);

    };

    request.onerror = (event) => {

      reject('خطأ في فتح قاعدة البيانات: ' + event.target.errorCode);

    };

  });

}



// ---------- Question bank: one small file per category, cached in IndexedDB, versioned by data/manifest.json ----------
const CATEGORY_FILE = { quiz: 'quiz', words: 'words', sera: 'sera', sona: 'sona', general: 'general', kids_1: 'kids_1', kids_2: 'kids_2', kids_3: 'kids_3' };

function neededCategories(type) {
  const need = new Set();
  String(type || 'mixed').split(',').map(t => t.trim()).forEach(t => {
    const base = t.split('_juz_')[0];
    if (base === 'mixed') need.add('quiz');
    else if (base === 'meanings') need.add('words');
    else if (base === 'seerah') need.add('sera');
    else if (base === 'fiqh') need.add('sona');
    else if (base === 'general') need.add('general');
    else if (base === 'clock') need.add('kids_2'); // clock questions are in the grade-2 bank
    else if (base === 'english') { need.add('kids_1'); need.add('kids_2'); need.add('kids_3'); } // English questions from every class bank
    else if (base === 'daily') { const c = dailyClass(); if (c) need.add(c); else { need.add('kids_1'); need.add('kids_2'); need.add('kids_3'); } } // daily challenge: the chosen class bank
    else if (base === 'review' || base === 'favorites') { /* local banks only */ }
    else if (base === 'kids_piggy') need.add('kids_2'); // piggy-bank level plays the level-2 bank
    else if (CATEGORY_FILE[base]) need.add(base);
    else need.add('quiz');
  });
  return [...need];
}

function idbGet(key) {
  return new Promise(async (resolve) => {
    try {
      db = await openDatabase();
      const req = db.transaction([storeName], 'readonly').objectStore(storeName).get(key);
      req.onsuccess = e => resolve(e.target.result || null);
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}
function idbPut(key, value) {
  return new Promise(async (resolve) => {
    try {
      db = await openDatabase();
      const tx = db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) { resolve(false); }
  });
}

async function fetchManifest() {
  try {
    const r = await fetch('./data/manifest.json', { cache: 'no-cache' });
    if (r.ok) return await r.json();
  } catch (e) { /* offline or not built yet */ }
  return null;
}

async function unzipJson(bytes, entryName) {
  try {
    const zip = await JSZip.loadAsync(bytes);
    const file = zip.file(entryName) || zip.file(Object.keys(zip.files)[0]);
    return JSON.parse(await file.async('string'));
  } catch (e) {
    return JSON.parse(new TextDecoder().decode(bytes));
  }
}

async function downloadCategory(cat, onProgress) {
  let response = await fetch('./data/' + CATEGORY_FILE[cat] + '.zip');
  if (response.ok) return unzipJson(await readBytesWithProgress(response, onProgress), CATEGORY_FILE[cat] + '.json');
  // Fallback: the old single bundle
  response = await fetch('./quran.zip');
  if (!response.ok) throw new Error('Could not fetch the question bank');
  const all = await unzipJson(await readBytesWithProgress(response, onProgress), 'quran.json');
  return all[cat] || [];
}

// ---------- Resume a long solo quiz exactly where it stopped ----------
const isMultiplayerGame = () => !!localStorage.getItem('mp_roomCode');
function saveResume() {
  if (isMultiplayerGame() || !quizData || !quizData.length) return;
  try {
    localStorage.setItem('soloResume', JSON.stringify({
      type: quizType, title: localStorage.getItem('quizTitle') || '', questions: quizData, index: currentIndex + 1,
      correct: correctCount, answered: answeredCount, streak, bestStreak, wrong: wrongAnswers, totalTime, at: Date.now()
    }));
  } catch (e) { /* storage full */ }
}
function clearResume() { localStorage.removeItem('soloResume'); localStorage.removeItem('resumeNow'); }
function tryResume() {
  if (localStorage.getItem('resumeNow') !== '1') return false;
  localStorage.removeItem('resumeNow');
  let r = null;
  try { r = JSON.parse(localStorage.getItem('soloResume') || 'null'); } catch (e) {}
  if (!r || !Array.isArray(r.questions) || !r.questions.length || r.index >= r.questions.length) return false;
  quizData = r.questions; currentIndex = r.index; correctCount = r.correct || 0; answeredCount = r.answered || 0;
  qResults = Array.from({ length: currentIndex }, () => 'done'); // earlier questions show as done (their result is not stored)
  streak = r.streak || 0; bestStreak = r.bestStreak || 0; wrongAnswers = Array.isArray(r.wrong) ? r.wrong : [];
  if (r.totalTime) totalTime = r.totalTime;
  quizType = r.type || quizType;
  const c = document.getElementById('correct-counter'); if (c) c.textContent = correctCount;
  return true;
}

// Which class the child is playing (kids_1 = kindergarten): the daily challenge and the piggy level map to their class
function kidsClass() {
  const t = String(quizType || '').split(',')[0].split('_juz_')[0];
  if (t === 'daily') return dailyClass() || localStorage.getItem('kids_class') || '';
  if (t === 'kids_piggy') return 'kids_2';
  return /^kids_[123]$/.test(t) ? t : '';
}
// Solo timer setting from the profile page: 'auto' (kindergarten plays without a clock, other classes with one), 'on' or 'off'.
// The old opt_notimer flag is still honoured.
function soloTimerOff() {
  if (localStorage.getItem('opt_notimer') === '1') return true;
  const pref = localStorage.getItem('kids_timer') || 'auto';
  if (pref === 'off') return true;
  if (pref === 'on') return false;
  return kidsClass() === 'kids_1';
}
function applySoloOptions() {
  if (isMultiplayerGame()) return;
  if (soloTimerOff()) {
    questionTime = 3600; questionTimeLeft = questionTime; totalTime = 6 * 3600;
    document.body.classList.add('no-timer');
    const tb = document.querySelector('.timer-box');
    if (tb) { ['total-timer', 'question-timer'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; }); }
    const bar = document.querySelector('.progress-bar-container-3d'); if (bar) bar.style.display = 'none';
    const hint = document.createElement('div'); hint.className = 'no-timer-hint'; hint.textContent = '🧘 بلا وقت، خذ راحتك';
    if (tb) tb.appendChild(hint);
  }
}
// One dot per question: green after a right answer, soft red after a wrong one or a timeout, the current one pulses.
// Long games (time mode, piggy) fall back to a short "٣ / ٢٠" pill.
let qResults = [];
function renderDots() {
  const box = document.getElementById('q-dots');
  if (!box || !quizData || !quizData.length) return;
  const n = quizData.length;
  // Long games show ten dots at a time (the current block of ten) plus a small "٣ / ٥٠ ⭐ ٢" pill
  const windowed = n > 20;
  const start = windowed ? Math.floor(currentIndex / 10) * 10 : 0;
  const end = windowed ? Math.min(n, start + 10) : n;
  box.className = windowed ? 'windowed' : '';
  let html = '';
  for (let i = start; i < end; i++) {
    const r = qResults[i];
    html += '<i class="' + (r === 'ok' ? 'ok' : r === 'done' ? 'done' : r ? 'bad' : '') + (i === currentIndex ? ' now' : '') + '"></i>';
  }
  if (windowed) html += '<span class="pill">' + toArabicDigits((currentIndex + 1) + ' / ' + n) + ' · ⭐ ' + toArabicDigits(correctCount) + '</span>';
  box.innerHTML = html;
}
// The friendly explanation: inside the page (and read aloud) instead of a system alert()
function showExplanation() {
  const q = quizData && quizData[currentIndex];
  const text = q && q.explanation ? String(q.explanation) : 'لا يوجد شرح لهذا السؤال.';
  if (window.UI) UI.dialog({ emoji: '💡', title: 'لماذا؟', text, primary: 'فهمت' });
  else alert(text);
  if (window.KidsTheme && KidsTheme.isActive() && q && q.explanation) KidsTheme.speak(text);
}
// Stop button: always behind a confirmation so a stray tap never ends the game
async function confirmEndQuiz() {
  const ask = window.askToLeave || (o => window.UI ? UI.dialog({ emoji: o.emoji, title: o.title, text: o.text, primary: o.leave, secondary: o.stay, danger: true }) : Promise.resolve(confirm(o.title)));
  const leave = await ask({ emoji: '🛑', title: 'تريد التوقف الآن؟', text: 'ستُحفظ نتيجتك حتى هذا السؤال، ويمكنك اللعب مرة أخرى في أي وقت.', stay: 'أكمل اللعب', leave: 'نعم، توقف' });
  if (leave) endQuiz();
}
// After an answer (solo): show the big "next" button; move on by itself only after a right answer
let advanceTimer = null;
let advancing = false;
function goNext() {
  if (advancing) return;
  advancing = true;
  clearTimeout(advanceTimer);
  hideInlineExplanation();
  const acts = document.getElementById('answer-actions'); if (acts) acts.style.display = 'none';
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  currentIndex++;
  displayQuestion();
}
function afterAnswer(ok, q) {
  advancing = false;
  saveResume();
  // Compute elapsed time for this question and store the result
  const elapsed = Date.now() - (window.questionStartMs ?? Date.now());
  const chosen = q?.userAnswer ?? q?.answer ?? '';
  saveResult(ok, elapsed, chosen);
  const mp = isMultiplayerGame();
  const explanation = q && q.explanation ? String(q.explanation) : '';
  if (!mp && !ok && explanation) {
    showInlineExplanation(explanation);
    if (window.KidsTheme && KidsTheme.isActive() && KidsTheme.readEnabled()) setTimeout(() => KidsTheme.speak(explanation), 900);
  }
  const acts = document.getElementById('answer-actions');
  if (acts && !mp) { acts.style.display = 'block'; const b = document.getElementById('next-btn'); if (b) b.textContent = ok ? 'التالي ⬅' : 'فهمت، التالي ⬅'; }
  const piggyPause = window.Piggy && window.Piggy.active ? 4300 : 2600; // time for the spoken balance message
  clearTimeout(advanceTimer);
  if (ok || mp) advanceTimer = setTimeout(goNext, ok ? piggyPause : 3000);
}
// The clock ran out: show the right answer, count it as a miss (with a picture for the review) and move on gently
function handleTimeout() {
  clearInterval(questionTimerInterval);
  if (questionProgressBar) questionProgressBar.classList.remove('blinking');
  const q = quizData[currentIndex] || {};
  // Teacher mode reveals answers itself: keep the old silent step there
  if (isMultiplayerGame() && localStorage.getItem('mp_sync') === 'true') { currentIndex++; displayQuestion(); return; }
  advanceCurriculum(q);
  document.querySelectorAll('.option').forEach(btn => { btn.disabled = true; if (isCorrectChoice(btn, q.correct_answer)) btn.classList.add('correct'); });
  answeredCount++;
  streak = 0;
  qResults[currentIndex] = 'late';
  if (window.Progress && quizType !== 'review') Progress.addWrong(q, quizType);
  wrongAnswers.push({
    question: cleanQuestionText(q.question),
    image: String(q.image || q.emoji || '').trim(),
    chosen: '⏰ انتهى الوقت',
    correct: window.KidsTheme && KidsTheme.choiceLabel ? KidsTheme.choiceLabel(q.correct_answer) : String(q.correct_answer),
    explanation: q.explanation ? String(q.explanation) : ''
  });
  if (window.KidsTheme && KidsTheme.isActive()) { KidsTheme.play('boing'); KidsTheme.cheer('انتهى الوقت ⏰', '#b3743f'); }
  updateHeroTrack();
  renderDots();
  document.dispatchEvent(new CustomEvent('quiz-answer', { detail: { ok: false, index: currentIndex, timeout: true } }));
  afterAnswer(false, q);
}
// The hero walks from the start to the finish flag as the questions go by (never resets mid-game)
function updateHeroTrack(done) {
  const heroProgress = document.getElementById('kids-hero-progress');
  if (!heroProgress || !quizData || !quizData.length) return;
  if (typeof done !== 'number') done = currentIndex + 1;
  heroPosition = Math.min(100, Math.max(0, Math.round((done / quizData.length) * 100)));
  heroProgress.style.width = heroPosition + '%';
}

function showInlineExplanation(text) {
  let box = document.getElementById('inline-explanation');
  if (!box) {
    box = document.createElement('div');
    box.id = 'inline-explanation';
    box.style.cssText = 'margin-top:12px;background:rgba(66,153,225,0.12);border:1px solid rgba(66,153,225,0.5);border-radius:14px;padding:10px 14px;font-size:0.95em;line-height:1.7;text-align:right;color:inherit;';
    const opts = document.querySelector('.options');
    if (opts) opts.after(box); else return;
  }
  box.textContent = '💡 ' + text;
  box.style.display = 'block';
}
function hideInlineExplanation() { const b = document.getElementById('inline-explanation'); if (b) b.style.display = 'none'; }

async function loadQuestions() {
  const loadingOverlay = document.getElementById("loading-overlay");
  applySoloOptions();
  if (tryResume()) {
    if (loadingOverlay) loadingOverlay.classList.add("hidden");
    displayQuestion();
    return;
  }
  clearResume();
  const L = window.UI && window.UI.loader;
  const show = html => { if (loadingOverlay) { loadingOverlay.classList.remove("hidden"); loadingOverlay.innerHTML = html; } };
  // Three visible stages: check the device bank -> download (with a real progress bar) -> prepare the quiz
  const stage = (step, title, sub, progress, hint) => {
    if (L) L.show({ title, sub, progress, hint, step, steps: 3 });
    else show("<div style='font-size:1.5em;'>" + title + "</div>");
  };
  // Give the overlay a frame to paint before a long synchronous step blocks the thread
  // (a plain timeout, not requestAnimationFrame: rAF never fires while the tab is in the background and the quiz would hang)
  const paint = () => new Promise(r => setTimeout(r, 40));
  stage(1, 'جاري التجهيز...', 'نفحص الأسئلة المحفوظة على جهازك');
  try {
    const cats = neededCategories(quizType);
    const manifest = await fetchManifest();
    const data = {};
    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i];
      const cached = await idbGet('cat:' + cat);
      const fresh = cached && Array.isArray(cached.items) && cached.items.length && (!manifest || cached.v === manifest.version);
      if (fresh) { data[cat] = cached.items; continue; }
      if (cached && cached.items && cached.items.length && !manifest) { data[cat] = cached.items; continue; }
      const label = cats.length > 1 ? ' (' + (i + 1) + '/' + cats.length + ')' : '';
      stage(2, '⬇️ جاري تنزيل أسئلة هذا القسم' + label, 'لحظات من فضلك', null, 'تُحفظ على جهازك ولن تُنزَّل مرة أخرى');
      const items = await downloadCategory(cat, (pct, mb) => {
        stage(2, '⬇️ جاري تنزيل أسئلة هذا القسم' + label, (pct === null ? '' : pct + '% · ') + mb + ' ميجابايت', pct, 'تُحفظ على جهازك ولن تُنزَّل مرة أخرى');
      });
      data[cat] = items;
      idbPut('cat:' + cat, { v: manifest ? manifest.version : 'unknown', items });
    }
    stage(3, 'جاري تهيئة المسابقة...', 'نختار الأسئلة ونرتّبها لك');
    await paint();
    processParsedJSON(data);
  } catch (err) {
    console.error(err);
    const why = window.UI ? window.UI.explain(err) : null;
    if (L) {
      L.error({ title: 'تعذر تحميل الأسئلة', text: why ? why.text : 'تأكد من اتصالك بالإنترنت ثم أعد المحاولة',
        retry: () => location.reload(), home: () => { location.href = 'index.html'; } });
    } else if (loadingOverlay) {
      show('<div style="text-align:center;max-width:320px;padding:0 16px;">' +
        '<div style="font-size:2.5em;">📡</div><div style="font-size:1.2em;font-weight:800;margin:6px 0;">تعذر تحميل الأسئلة</div>' +
        '<div style="font-size:0.9em;color:#cbd5e0;">تأكد من اتصالك بالإنترنت ثم أعد المحاولة</div>' +
        '<button onclick="location.reload()" style="margin-top:16px;padding:12px 26px;border:none;border-radius:999px;background:#10b981;color:#fff;font-weight:800;font-family:inherit;font-size:1em;cursor:pointer;">🔄 إعادة المحاولة</button>' +
        '<br><button onclick="location.href=\'index.html\'" style="margin-top:10px;background:transparent;border:none;color:#a0aec0;font-family:inherit;cursor:pointer;">الرئيسية</button></div>');
    } else {
      alert("خطأ في قراءة البيانات: " + err.message);
    }
  }
}

// Empty result after filtering: explain and offer the way back instead of a bare alert
function noQuestions(text) {
  const overlay = document.getElementById("loading-overlay");
  const home = () => { location.href = 'index.html'; };
  if (window.UI) {
    window.UI.loader.error({ emoji: '🔍', title: 'لا توجد أسئلة هنا', text: text + ' جرّب قسماً أو جزءاً آخر.', retry: home, retryLabel: 'اختيار قسم آخر' });
  } else {
    alert(text);
    if (overlay) overlay.classList.add("hidden");
  }
}

// Reads a body chunk by chunk so downloads can show real progress
async function readBytesWithProgress(response, onProgress) {
  if (!response.body || !response.body.getReader) return new Uint8Array(await response.arrayBuffer());
  const total = parseInt(response.headers.get('Content-Length')) || 0;
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0, lastTick = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress && Date.now() - lastTick > 150) {
      lastTick = Date.now();
      onProgress(total ? Math.min(99, Math.round(received / total * 100)) : null, (received / 1048576).toFixed(1));
    }
  }
  if (onProgress) onProgress(100, (received / 1048576).toFixed(1));
  const all = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) { all.set(c, offset); offset += c.length; }
  return all;
}

// Strips numbering artefacts such as "Q(462): " from imported questions
// Western digits -> Arabic-Indic digits for display (answers are compared on the raw value, see isCorrectChoice)
function toArabicDigits(text) {
  return String(text ?? '').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
function isCorrectChoice(btn, correctAnswer) {
  const raw = btn && btn.dataset && btn.dataset.value !== undefined ? btn.dataset.value : (btn ? btn.textContent : '');
  return String(raw) === String(correctAnswer);
}

function questionHash(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 10);
}

function cleanQuestionText(text) {
  return String(text || '').replace(/^\s*Q\s*\(\s*\d+\s*\)\s*[:：\-]?\s*/i, '').replace(/^\s*س\s*\d+\s*[:：\-]\s*/, '').trim();
}

// Daily challenge: same 10 questions for everyone on a given day
// The class the player picked for today's challenge on the home page (kids_1 / kids_2 / kids_3)
function dailyClass() { const c = localStorage.getItem('daily_class') || ''; return /^kids_[123]$/.test(c) ? c : ''; }
function dailyQuestions(jsonData) {
  // Kids app: the question of the day comes from the chosen class bank (same 10 for every child of that class that day)
  const cls = dailyClass();
  const pool = cls ? (jsonData[cls] || []) : [].concat(jsonData.kids_1 || [], jsonData.kids_2 || [], jsonData.kids_3 || [], jsonData.sera || [], jsonData.sona || [], jsonData.general || []);
  const dayKey = new Date().toISOString().slice(0, 10) + (cls ? '|' + cls : '');
  let seed = 0;
  for (let i = 0; i < dayKey.length; i++) seed = (seed * 31 + dayKey.charCodeAt(i)) % 233280;
  const picked = [];
  const used = new Set();
  while (picked.length < 10 && used.size < pool.length) {
    seed = (seed * 9301 + 49297) % 233280;
    const idx = Math.floor(seed / 233280 * pool.length);
    if (!used.has(idx)) { used.add(idx); picked.push(pool[idx]); }
  }
  return picked;
}

function recordDaily(session) {
  if (session.type !== 'daily') return;
  const dayKey = new Date().toISOString().slice(0, 10);
  let best = null;
  try { best = JSON.parse(localStorage.getItem('daily_best') || 'null'); } catch (e) {}
  if (!best || best.date !== dayKey || session.score > best.score) {
    localStorage.setItem('daily_best', JSON.stringify({ date: dayKey, score: session.score, total: session.total }));
  }
}



function processParsedJSON(jsonData) {
  let source = [];
  if (!quizType) quizType = 'mixed';
  const types = quizType.split(',').map(t => t.trim());
  
  
    if (quizType.startsWith('kids') && quizType !== 'kids_piggy') {
        const track = document.getElementById('kids-hero-track');
        if(track) track.style.display = 'block';
    }

    types.forEach(type => {

      if (type === "kids_piggy" && jsonData.kids_2) source = source.concat(jsonData.kids_2);
      else if (type === "clock" && jsonData.kids_2) {
        const clockQuestions = jsonData.kids_2.filter(q => q.type === 'clock');
        if (clockQuestions.length > 0) source = source.concat(clockQuestions);
      }
      else if (type === "english") {
        ['kids_1', 'kids_2', 'kids_3'].forEach(cat => { if (jsonData[cat]) source = source.concat(jsonData[cat].filter(q => /إنجليز|english/i.test(q.type || ''))); });
      }
      else if (type === "seerah" && jsonData.sera) source = source.concat(jsonData.sera);
      else if (type === "fiqh" && jsonData.sona) source = source.concat(jsonData.sona);
      else if (type === "mixed" && jsonData.quiz) source = source.concat(jsonData.quiz);
      else if (type === "meanings" && jsonData.words) source = source.concat(jsonData.words);
      else if (type === "kids" && jsonData.kids) source = source.concat(jsonData.kids);
      else if (type === "general" && jsonData.general) source = source.concat(jsonData.general);
      else if (type === "daily") source = source.concat(dailyQuestions(jsonData));
      else if (type === "review") source = source.concat(window.Progress ? Progress.getWrong() : []);
      else if (type === "favorites") source = source.concat(window.Progress ? Progress.getFav() : []);
      else if (Array.isArray(jsonData[type])) source = source.concat(jsonData[type]);
      else if (jsonData.quiz) {
          const filtered = jsonData.quiz.filter(q => q.type === type);
          if (filtered) source = source.concat(filtered);
      }
  });



  if (!source || source.length === 0) {

    noQuestions("لا توجد بيانات متاحة لهذا النوع من المسابقة.");

    return;

  }



  let filteredSource = source.filter(q =>

    q &&

    typeof q.question === 'string' && q.question.trim() !== '' &&

    typeof q.correct_answer === 'string' && q.correct_answer.trim() !== '' &&

    typeof q.choice1 === 'string' &&

    typeof q.choice2 === 'string' &&

    typeof q.choice3 === 'string' &&

    typeof q.choice4 === 'string' &&

    q.choice1.trim() !== '' &&

    q.choice2.trim() !== '' &&

    q.choice3.trim() !== '' &&

    q.choice4.trim() !== ''

  );



  if (quizType === 'review' || quizType === 'favorites') { /* already scoped */ } else if (selectedSura) {

    filteredSource = filteredSource.filter(q => q.sura_info === selectedSura);

  } else if (selectedJuz) {

    filteredSource = filteredSource.filter(q => String(q.juz_number).replace(".0", "") === selectedJuz);

  }



  // Curriculum questions (those with an "order" number, e.g. term 1 then term 2) come first, in order, before the
  // random pool. A per-device cursor remembers how far the child got so the next game continues from there
  // (rooms use the host's cursor, shared through the room settings, plus the rematch round).
  const isMpGame = !!localStorage.getItem('mp_roomCode');
  const hasOrder = q => q.order !== undefined && q.order !== null && q.order !== '' && !isNaN(parseFloat(q.order));
  const ordered = filteredSource.filter(hasOrder)
    .sort((a, b) => parseFloat(a.order) - parseFloat(b.order))
    .map((q, i) => Object.assign({}, q, { _ordIdx: i }));
  const pool = shuffle(filteredSource.filter(q => !hasOrder(q)));
  // remember how long each class curriculum is so the home page can draw a progress bar per class
  try { const m = JSON.parse(localStorage.getItem('kids_curriculum') || '{}'); m[curriculumKey().replace('kids_cursor_', '')] = ordered.length; localStorage.setItem('kids_curriculum', JSON.stringify(m)); } catch (e) {}
  const qMode = questionOrderMode();
  if (ordered.length && qMode !== 'ordered' && quizType !== 'daily') {
    // Owner asked for random questions: term 1 = upper half of the sheet, term 2 = lower half, all = whole year.
    // No curriculum cursor here (nothing to "continue from"), and _ordIdx is dropped so the cursor is not advanced.
    const half = Math.ceil(ordered.length / 2);
    const subset = qMode === 'term1' ? ordered.slice(0, half) : qMode === 'term2' ? ordered.slice(half) : ordered.slice();
    const mixed = shuffle(subset.map(q => { const c = Object.assign({}, q); delete c._ordIdx; return c; }));
    let start = 0;
    if (isMpGame) {
      // rematch rounds move along the (room-seeded, identical for every player) shuffled list
      const round = parseInt(localStorage.getItem('mp_round')) || 1;
      const per = (localStorage.getItem('mp_mode') || 'questions') === 'questions' ? (parseInt(localStorage.getItem('mp_val')) || 10) : 30;
      start = (round - 1) * per;
      if (start >= mixed.length) start = 0;
    }
    quizData = mixed.slice(start).concat(mixed.slice(0, start)).concat(pool);
  } else if (ordered.length) {
    let start = 0;
    if (isMpGame) {
      const round = parseInt(localStorage.getItem('mp_round')) || 1;
      const per = (localStorage.getItem('mp_mode') || 'questions') === 'questions' ? (parseInt(localStorage.getItem('mp_val')) || 10) : 30;
      start = (parseInt(localStorage.getItem('mp_qstart')) || 0) + (round - 1) * per;
    } else {
      start = curriculumCursor();
    }
    if (start >= ordered.length) start = 0; // finished the whole curriculum: start over from term 1
    quizData = ordered.slice(start).concat(pool);
  } else {
    quizData = pool;
  }

  // Spaced repetition (solo only): questions this player missed in this section come back after two days,
  // a few per quiz, mixed into the first ten so they are actually reached
  const isMp = localStorage.getItem('mp_roomCode');
  if (!isMp && window.Progress && !['review', 'favorites', 'daily'].includes(quizType)) {
    try {
      const base = quizType.split('_juz_')[0];
      const due = Progress.getWrong().filter(w => w && w.question && String(w.src || '').split('_juz_')[0] === base && Date.now() - (w.at || 0) > 2 * 86400000);
      const seen = new Set(quizData.map(q => cleanQuestionText(q.question)));
      const picks = shuffle(due.filter(w => w.choice1 && w.choice2 && w.choice3 && w.choice4 && w.correct_answer && !seen.has(cleanQuestionText(w.question)))).slice(0, 3);
      if (picks.length) {
        picks.forEach(w => quizData.splice(Math.floor(Math.random() * Math.min(10, quizData.length + 1)), 0, Object.assign({ _repeat: true }, w)));
        if (window.UI) setTimeout(() => UI.toast('🔁 ' + picks.length + ' من الأسئلة التي أخطأت فيها سابقاً ستعود لك في هذه المسابقة', { type: 'info', ms: 4500 }), 1200);
      }
    } catch (e) { console.warn('spaced repetition', e); }
  }

    // MP LOGIC PATCH
    if (isMp) {
        const mpMode = localStorage.getItem('mp_mode') || 'questions';
        const mpVal = parseInt(localStorage.getItem('mp_val')) || 10;
        
        const pick = (localStorage.getItem('mp_pick') || '').split(',').filter(Boolean);
        if (pick.length) {
            const byHash = new Map(filteredSource.map(q => [questionHash(q.question), q]));
            const chosen = pick.map(h => byHash.get(h)).filter(Boolean);
            if (chosen.length) quizData = chosen;
        }
        const mpQTime = parseInt(localStorage.getItem('mp_qtime'));
        if (mpQTime >= 5 && mpQTime <= 180) { questionTime = mpQTime; questionTimeLeft = questionTime; }
        if (mpMode === 'questions') {
            quizData = quizData.slice(0, mpVal);
        } else if (mpMode === 'time') {
            // Time mode: they can answer as many as they want, time is limited
            totalTime = mpVal * 60; // mpVal is in minutes
        }
    } else {
        // For solo, let's just cap it at 20 to prevent infinite games, unless it's a specific Juz maybe?
        // Actually, we'll leave it as is or cap to 30.
        if (quizType === 'daily') quizData = quizData.slice(0, 10);
        if (quizData.length > 50) {
            quizData = quizData.slice(0, 50); // Cap solo games to 50 max
        }
    }




  if (!quizData || quizData.length === 0) {

    noQuestions("لا توجد أسئلة متاحة بعد التصفية النهائية.");

    return;

  }



  document.getElementById("loading-overlay").classList.add("hidden");

  displayQuestion();

}



let mpSeed = null;
function getRandom() {
    if (localStorage.getItem('mp_roomCode')) {
        if (mpSeed === null) {
            const code = localStorage.getItem('mp_roomCode');
            mpSeed = 0;
            for (let i = 0; i < code.length; i++) {
                mpSeed += code.charCodeAt(i) * (i + 1);
            }
        }
        mpSeed = (mpSeed * 9301 + 49297) % 233280;
        return mpSeed / 233280;
    }
    return Math.random();
}

// Owner's choice from the admin panel (config/questionOrder, cached as kids_qorder by the home page):
// 'ordered' (default) | 'term1' (shuffle upper half) | 'term2' (shuffle lower half) | 'all' (shuffle the whole sheet).
// Inside a room the host's choice travels with the room settings (mp_qorder) so everyone shuffles the same way.
function questionOrderMode() {
  const ok = v => /^(ordered|term1|term2|all)$/.test(v || '');
  if (localStorage.getItem('mp_roomCode')) { const m = localStorage.getItem('mp_qorder'); return ok(m) ? m : 'ordered'; }
  const m = localStorage.getItem('kids_qorder');
  return ok(m) ? m : 'ordered';
}

// How many curriculum (ordered) questions of this class the child has already been through on this device.
// The piggy-bank level plays the level-2 bank, so it shares that cursor.
function curriculumKey() { const t = String(quizType || '').split('_juz_')[0]; return 'kids_cursor_' + (t === 'kids_piggy' ? 'kids_2' : t); }
function curriculumCursor() { return Math.max(0, parseInt(localStorage.getItem(curriculumKey())) || 0); }
function advanceCurriculum(q) {
  if (!q || q._ordIdx === undefined) return;
  const next = q._ordIdx + 1;
  if (next > curriculumCursor()) { try { localStorage.setItem(curriculumKey(), String(next)); } catch (e) {} }
}
window.curriculumCursor = curriculumCursor;

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(getRandom() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}



function finishQuiz() {
  clearResume();
  clearInterval(totalTimerInterval);
  clearInterval(questionTimerInterval);
  const email = localStorage.getItem("userEmail") || "غير معروف";
  const session = {
    date: new Date().toLocaleString("ar-EG"),
    at: Date.now(),
    email: email,
    score: correctCount,
    total: Math.max(answeredCount, currentIndex),
    type: quizType,
    wrong: wrongAnswers.slice(0, 60),
    bestStreak: bestStreak,
    title: localStorage.getItem("quizTitle") || ""
  };
  let sessions = JSON.parse(localStorage.getItem("userSessions") || "[]");
  sessions.push(session);
  clearResume();
  localStorage.setItem("userSessions", JSON.stringify(sessions));
  recordDaily(session);
  if (window.Progress) { try { Progress.onSessionSaved(session); } catch (e) { console.error(e); } }
  window.location.href = "finish.html";
}

function startTotalTimer() {

  updateTotalTimerDisplay();

  totalTimerInterval = setInterval(() => {

    totalTime--;

    updateTotalTimerDisplay();

    if (totalTime <= 0) {

      clearInterval(totalTimerInterval);

      clearInterval(questionTimerInterval);

      if (questionProgressBar) {

        questionProgressBar.classList.remove('blinking');

        questionProgressBar.style.width = '0%';

        questionProgressBar.style.background = '#dc3545';

      }

      finishQuiz();

    }

  }, 1000);

}



function updateTotalTimerDisplay() {

  const min = Math.floor(totalTime / 60).toString().padStart(2, "0");

  const sec = (totalTime % 60).toString().padStart(2, "0");

  const totalTimerElement = document.getElementById("total-timer");

  if (totalTimerElement) {

    totalTimerElement.textContent = `${min}:${sec}`;

  }

}



// تحديث شريط التقدم 3D

function updateProgressBar3D(timeRemaining) {

  if (!questionProgressBar) return;



  const percentage = (timeRemaining / questionTime) * 100;

  questionProgressBar.style.width = `${percentage}%`;



  const hue = (percentage / 100) * 120;

  questionProgressBar.style.background = `hsl(${hue}, 70%, 50%)`;



  if (timeRemaining <= 10 && timeRemaining > 0) {

    questionProgressBar.classList.add('blinking');

    questionProgressBar.style.background = '#dc3545';

  } else {

    questionProgressBar.classList.remove('blinking');

  }

}



function displayQuestion() {

  if (currentIndex >= quizData.length) {

    clearInterval(totalTimerInterval);

    clearInterval(questionTimerInterval);

    if (questionProgressBar) {

      questionProgressBar.classList.remove('blinking');

      questionProgressBar.style.width = '0%';

      questionProgressBar.style.background = '#dc3545';

    }

    const email = localStorage.getItem("userEmail") || "غير معروف";

    const session = {

      date: new Date().toLocaleString("ar-EG"),
    at: Date.now(),

      email: email,

      score: correctCount,

      total: Math.max(answeredCount, currentIndex),

      type: quizType,

      wrong: wrongAnswers.slice(0, 60),

      bestStreak: bestStreak,

      title: localStorage.getItem("quizTitle") || ""

    };

    let sessions = JSON.parse(localStorage.getItem("userSessions") || "[]");

    sessions.push(session);

    clearResume();
  localStorage.setItem("userSessions", JSON.stringify(sessions));
  recordDaily(session);
  if (window.Progress) { try { Progress.onSessionSaved(session); } catch (e) { console.error(e); } }

    window.location.href = "finish.html";

    return;

  }



  const q = quizData[currentIndex];



  const questionTextElement = document.getElementById("question-text");

  if (!questionTextElement) return;

  advancing = false;
  clearTimeout(advanceTimer);
  hideInlineExplanation();
  const actsBox = document.getElementById('answer-actions'); if (actsBox) actsBox.style.display = 'none';
  renderDots();
  updateHeroTrack(currentIndex);
  if (window.KidsTheme && KidsTheme.isActive() && KidsTheme.ensureReadButton) KidsTheme.ensureReadButton();



  if (q.question.includes("ما الآية التالية")) {

    const ayaText = q.question.replace("ما الآية التالية لهذه الآية؟", "").replace(/^\s*الآية\s*[:：]\s*/, "").trim();

    questionTextElement.innerHTML = `

      <div style="font-size: 14px; color: #bbb;">ما الآية التالية لهذه الآية؟</div>

      <div style="font-size: 28px; margin-top: 10px; font-family: 'Amiri', serif; line-height: 2; color: #fff;">

        ❝ ${ayaText} ❞

      </div>

    `;

  } else {
    questionTextElement.textContent = toArabicDigits(cleanQuestionText(q.question));
  }
  // Optional picture for the question (the "image" column in the bank): an emoji such as 🐇 shown big above the text
  (function () {
    let box = document.getElementById('question-image');
    if (!box) {
      box = document.createElement('div');
      box.id = 'question-image';
      box.setAttribute('aria-hidden', 'true');
      questionTextElement.before(box);
    }
    const img = String(q.image || q.emoji || '').trim();
    // emoji, or an analog clock drawn by code ("clock:3:30"), or both
    if (img && window.KidsTheme && KidsTheme.richHtml) box.innerHTML = KidsTheme.richHtml(img, window.innerWidth < 480 ? 170 : 210);
    else box.textContent = img;
    box.classList.toggle('has-clock', /clock:/i.test(img));
    box.style.display = img ? 'flex' : 'none';
  })();
  const favBtn = document.getElementById('fav-btn');
  if (favBtn && window.Progress) {
    const on = Progress.isFav(q);
    favBtn.textContent = on ? '💛 محفوظ' : '☆ حفظ السؤال';
    favBtn.onclick = () => { const now = Progress.toggleFav(q, quizType); favBtn.textContent = now ? '💛 محفوظ' : '☆ حفظ السؤال'; if (window.KidsTheme && KidsTheme.isActive()) KidsTheme.play(now ? 'star' : 'pop'); };
  }
  if (window.KidsTheme && KidsTheme.isActive() && KidsTheme.readEnabled()) KidsTheme.speak(cleanQuestionText(q.question), [q.choice1, q.choice2, q.choice3, q.choice4].map(c => KidsTheme.choiceLabel ? KidsTheme.choiceLabel(c) : c));



  const currentQuestionElement = document.getElementById("current-question");

  if (currentQuestionElement) currentQuestionElement.textContent = currentIndex + 1;



  const correctCounterElement = document.getElementById("correct-counter");

  if (correctCounterElement) correctCounterElement.textContent = correctCount;



  const options = shuffle([q.choice1, q.choice2, q.choice3, q.choice4]);

  const buttons = document.querySelectorAll(".option");



  if (buttons.length === 0) return;



  buttons.forEach((btn, i) => {

    btn.dataset.value = String(options[i]);
    const clk = window.KidsTheme && KidsTheme.parseClock ? KidsTheme.parseClock(options[i]) : null;
    if (clk) {
      // a choice that is itself a clock face ("which clock shows quarter past four?")
      btn.innerHTML = KidsTheme.clockSvg(clk.h, clk.m, 96);
      btn.dataset.label = KidsTheme.clockLabel(clk.h, clk.m);
      btn.className = "option option-clock";
    } else {
      const label = toArabicDigits(options[i]);
      btn.textContent = label;
      btn.dataset.label = label;
      btn.className = "option";
      // A small speaker on every choice: tapping it reads that choice instead of answering
      if (window.KidsTheme && KidsTheme.isActive() && 'speechSynthesis' in window) {
        const say = document.createElement('span');
        say.className = 'say';
        say.textContent = '🔊';
        say.setAttribute('role', 'button');
        say.setAttribute('aria-label', 'اسمع هذا الاختيار');
        btn.appendChild(say);
      }
    }

    btn.disabled = false;

    btn.onclick = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('.say')) { e.preventDefault(); KidsTheme.speak(btn.dataset.label || btn.textContent); return; }
      handleAnswer(btn, q.correct_answer);
    };

  });
  // Record when the question became visible so we can compute elapsed time later
  window.questionStartMs = Date.now();



  const explanationBtn = document.getElementById("explanation-btn");

  if (explanationBtn) {

    explanationBtn.style.display = q.explanation ? '' : 'none';

    explanationBtn.onclick = showExplanation;

  }



  clearInterval(questionTimerInterval);

  questionTimeLeft = questionTime;

  const questionTimerElement = document.getElementById("question-timer");

  if (questionTimerElement) questionTimerElement.textContent = questionTimeLeft;

  updateProgressBar3D(questionTimeLeft);



  questionTimerInterval = setInterval(() => {

    questionTimeLeft--;

    if (questionTimerElement) questionTimerElement.textContent = questionTimeLeft;

    updateProgressBar3D(questionTimeLeft);



    if (questionTimeLeft <= 0) {

      clearInterval(questionTimerInterval);

      handleTimeout();

    }

  }, 1000);

}




function handleAnswer(button, correctAnswer) {
  advanceCurriculum(quizData[currentIndex]);
  const buttons = document.querySelectorAll(".option");
  clearInterval(questionTimerInterval);
  if (questionProgressBar) questionProgressBar.classList.remove('blinking');

  // The hero walks one step closer to the flag after every answer, right or wrong
  updateHeroTrack(currentIndex + 1);
  qResults[currentIndex] = isCorrectChoice(button, correctAnswer) ? 'ok' : 'bad';

  buttons.forEach(btn => {


    btn.disabled = true;

    if (isCorrectChoice(btn, correctAnswer)) {

      btn.classList.add("correct");

    } else if (btn === button) {

      btn.classList.add("wrong");

    }

  });



if (isCorrectChoice(button, correctAnswer)) {
    if (quizType.startsWith('kids') || quizType === 'daily') {
        if (window.KidsTheme) {
            KidsTheme.correct(button);
        } else {
            let wowSound = new Audio('assets/wow.mp3');
            wowSound.play().catch(e => console.log('Audio error:', e));
            if (typeof showBalloonFestival === "function") showBalloonFestival();
        }
    } else if (window.KidsTheme) {
        KidsTheme.play('star');
    } else {
        playSound(winSound);
    }

  answeredCount++;
  correctCount++;
  if (window.Progress && quizType === 'review') Progress.removeWrong(quizData[currentIndex] || {});
  streak++;
  if (streak > bestStreak) bestStreak = streak;
  if (streak >= 3) showStreakToast(streak);
  vibrate(40);
  const correctCounterElement = document.getElementById("correct-counter");
  if (correctCounterElement) correctCounterElement.textContent = correctCount;
} else {
  answeredCount++;
  streak = 0;
  vibrate([60, 40, 60]);
  const currentQ = quizData[currentIndex] || {};
  if (window.Progress && quizType !== 'review') Progress.addWrong(currentQ, quizType);
  wrongAnswers.push({
    question: cleanQuestionText(currentQ.question),
    image: String(currentQ.image || currentQ.emoji || '').trim(),
    chosen: button ? (button.dataset.label || button.textContent) : '',
    correct: window.KidsTheme && KidsTheme.choiceLabel ? KidsTheme.choiceLabel(correctAnswer) : String(correctAnswer),
    explanation: currentQ.explanation ? String(currentQ.explanation) : ''
  });
  if ((quizType.startsWith('kids') || quizType === 'daily') && window.KidsTheme) KidsTheme.wrong(button);
  else if (window.KidsTheme) KidsTheme.play('wrong');
  else playSound(loseSound);
}



  renderDots();
  // Add-ons (piggy bank level, etc.) react to every answer through this event
  document.dispatchEvent(new CustomEvent('quiz-answer', { detail: { ok: isCorrectChoice(button, correctAnswer), index: currentIndex } }));
  afterAnswer(isCorrectChoice(button, correctAnswer), quizData[currentIndex] || {});

}



async function checkIndexedDB() { /* replaced by the per-category loader */ }



function endQuiz() {
  clearResume();

  clearInterval(totalTimerInterval);

  clearInterval(questionTimerInterval);

  if (questionProgressBar) {

    questionProgressBar.classList.remove('blinking');

    questionProgressBar.style.width = '0%';

    questionProgressBar.style.background = '#dc3545';

  }

  const email = localStorage.getItem("userEmail") || "غير معروف";

  const session = {

    date: new Date().toLocaleString("ar-EG"),
    at: Date.now(),

    email: email,

    score: correctCount,

    total: Math.max(answeredCount, currentIndex),

    type: quizType,

    wrong: wrongAnswers.slice(0, 60),

    bestStreak: bestStreak,

    title: localStorage.getItem("quizTitle") || ""

  };

  let sessions = JSON.parse(localStorage.getItem("userSessions") || "[]");

  sessions.push(session);

  clearResume();
  localStorage.setItem("userSessions", JSON.stringify(sessions));
  recordDaily(session);
  if (window.Progress) { try { Progress.onSessionSaved(session); } catch (e) { console.error(e); } }

  window.location.href = "finish.html";

}

// ====== نهاية الكود ======
