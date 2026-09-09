// ==========================================
// تدريبات رياضية: منطق المسائل منقول من تطبيق «محمود» (Mahmoud/app.js) كما هو
// (الجمع والطرح رقمين/٣ أرقام رأسي وأفقي، الشطب والحمل والاستلاف، قفص الضرب، لوحة الأرقام،
//  التحقق التلقائي، جداول الضرب، والمسائل الكلامية) مع ربطه بتطبيق kids:
//  - الحصالة واحدة (piggy.js): كل إجابة صحيحة تزوّد الرصيد بقيمة المسألة والخطأ يخصمها، والنطق والشيك من هناك
//  - اسم الطفل من بطاقة البطل، والمسائل الكلامية تُولَّد من أسماء بابا وماما والإخوة والأصحاب (ملفي)
// ==========================================
(function () {
  'use strict';
  if (window.KidsTheme) KidsTheme.activate();

  // ---------- أدوات ----------
  const $ = id => document.getElementById(id);
  const HINDI_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toHindi = val => (val === null || val === undefined) ? '' : val.toString().replace(/\d/g, d => HINDI_DIGITS[d]);
  const toWestern = val => {
    if (!val) return '';
    let str = val.toString();
    for (let i = 0; i < 10; i++) str = str.split(HINDI_DIGITS[i]).join(i.toString());
    return str;
  };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  const soundOn = () => get('soundOn', 'true') !== 'false';
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = list => list[Math.floor(Math.random() * list.length)];

  // ---------- الإعدادات (محفوظة على الجهاز) ----------
  const SETTINGS_KEY = 'kids_math_settings';
  let saved = {}; try { saved = JSON.parse(get(SETTINGS_KEY, '{}')) || {}; } catch (e) { saved = {}; }
  const state = {
    mode: ['add_sub', 'multiplication', 'word'].includes(saved.mode) ? saved.mode : 'add_sub',
    digits: saved.digits === 3 ? 3 : 2,
    opType: ['+', '-', 'mix'].includes(saved.opType) ? saved.opType : '+',
    layout: saved.layout === 'horizontal' ? 'horizontal' : 'vertical',
    table: saved.table || 'all',
    wdiff: ['easy', 'medium', 'hard'].includes(saved.wdiff) ? saved.wdiff : 'easy',
    wop: ['+', '-', '×', 'mix'].includes(saved.wop) ? saved.wop : '+',
    currentProblem: null,
    onesVal: '', tensVal: '', hundredsVal: '',
    activeBox: 'ones',
    scratches: {},
    selectedTarget: null,
    busy: false
  };
  function saveSettings() {
    set(SETTINGS_KEY, JSON.stringify({ mode: state.mode, digits: state.digits, opType: state.opType, layout: state.layout, table: state.table, wdiff: state.wdiff, wop: state.wop }));
  }

  // ---------- الطفل والعائلة (من صفحة ملفي) ----------
  const childName = () => (window.Piggy ? Piggy.name() : (get('mp_playerName', '') || '').trim());
  const who = () => childName() || 'يا بطل';
  const list = k => get(k, '').split(/[،,]/).map(s => s.trim()).filter(Boolean);
  function family() {
    const father = get('kids_father', '').trim(), mother = get('kids_mother', '').trim();
    const sibs = list('kids_siblings'), friends = list('kids_friends');
    return {
      me: childName() || 'البطل',
      father: father ? 'بابا ' + father : 'بابا',
      mother: mother ? 'ماما ' + mother : 'ماما',
      sib: sibs.length ? pick(sibs) : 'أخوه',
      sibs: sibs,
      friend: friends.length ? pick(friends) : 'صاحبه',
      friends: friends
    };
  }

  // ---------- عناصر الواجهة ----------
  const problemContainer = $('problemContainer');
  const mathCard = $('mathCard'), wordCard = $('wordCard');
  const sidebarDrawer = $('sidebarDrawer'), sidebarOverlay = $('sidebarOverlay');
  const scratchModal = $('scratchModal'), scratchOptions = $('scratchOptions');
  const toastMessage = $('toastMessage');
  const setupInfoText = $('setupInfoText');

  // ---------- الحصالة الموحدة ----------
  function renderPiggy(animate, delta) {
    if (!window.Piggy) return;
    const bal = Piggy.balance();
    $('piggyWho').textContent = childName() || 'البطل';
    const amt = $('piggyAmount');
    amt.textContent = Piggy.words(bal);
    $('piggyStep').textContent = '(المسألة ' + Piggy.words(Piggy.step()) + ')';
    if (animate) { amt.classList.remove('pop', 'dip'); void amt.offsetWidth; amt.classList.add(delta > 0 ? 'pop' : 'dip'); }
  }
  if (window.Piggy) Piggy.onChange = () => renderPiggy(false);
  $('piggyChip').onclick = () => { if (window.Piggy) Piggy.cheque(); };
  $('openChequeBtn').onclick = () => { closeSidebar(); if (window.Piggy) Piggy.cheque(); };

  // ---------- القائمة الجانبية ----------
  function openSidebar() { sidebarDrawer.classList.remove('closed'); sidebarOverlay.classList.remove('hidden'); }
  function closeSidebar() { sidebarDrawer.classList.add('closed'); sidebarOverlay.classList.add('hidden'); }
  $('menuBtn').addEventListener('click', openSidebar);
  $('closeSidebarBtn').addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  function updateSetupInfoSummary() {
    let text = '';
    if (state.mode === 'multiplication') text = '✖️ جدول الضرب (' + (state.table === 'all' ? 'عشوائي' : 'جدول ' + toHindi(state.table)) + ') | ' + (state.layout === 'horizontal' ? 'أفقي ➡️' : 'رأسي ⬇️');
    else if (state.mode === 'word') {
      const d = { easy: 'سهل', medium: 'متوسط', hard: 'سوبر' }[state.wdiff];
      const o = { '+': 'جمع', '-': 'طرح', '×': 'ضرب', 'mix': 'مختلط' }[state.wop];
      text = '📖 مسائل كلامية · ' + o + ' · ' + d;
    } else {
      const opText = { '+': 'جمع ➕', '-': 'طرح ➖', 'mix': 'مختلط 🎲' }[state.opType] || 'جمع ➕';
      text = opText + ' (' + (state.digits === 3 ? '٣ أرقام' : 'رقمين') + ') | ' + (state.layout === 'horizontal' ? 'أفقي ➡️' : 'رأسي ⬇️');
    }
    setupInfoText.textContent = text;
  }

  function applyModeUI() {
    // كل نوع تدريب قسم في القائمة الجانبية، والقسم المختار يفتح خياراته الفرعية تحته
    document.querySelectorAll('.mode-item').forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === state.mode));
    const note = $('wordFamilyNote');
    if (note) { const f = family(); const names = [f.father, f.mother].concat(f.sibs).concat(f.friends).filter(n => n && !/^(بابا|ماما)$/.test(n)); note.textContent = names.length ? names.slice(0, 5).join('، ') : 'العائلة والأصحاب'; }
    mathCard.classList.toggle('hidden-area', state.mode === 'word');
    wordCard.classList.toggle('hidden-area', state.mode !== 'word');
    updateSetupInfoSummary();
  }
  function syncSegments() {
    document.querySelectorAll('#digitGroup .segment-btn').forEach(b => b.classList.toggle('active', parseInt(b.getAttribute('data-digits'), 10) === state.digits));
    document.querySelectorAll('#opTypeGroup .segment-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-op') === state.opType));
    document.querySelectorAll('.layout-seg .segment-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-layout') === state.layout));
    document.querySelectorAll('#wordDiffGroup .segment-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-wdiff') === state.wdiff));
    document.querySelectorAll('#wordOpGroup .segment-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-wop') === state.wop));
    $('tableSelect').value = state.table;
  }

  // ---------- الصوت والاحتفال ----------
  const play = name => { if (window.KidsTheme && soundOn()) KidsTheme.play(name); };
  // احتفال مرئي فقط (بلا صوت) حتى لا يغطي على قراءة الرسالة
  function celebrate() {
    if (!window.KidsTheme) return;
    KidsTheme.burst(window.innerWidth / 2, window.innerHeight / 2, 18);
    KidsTheme.confetti(2200);
  }

  // ---------- رسائل التشجيع (باسم الطفل ورصيد الحصالة) ----------
  const SUCCESS = [
    'برافو {name}! 🌟 كسبت {step} جديدة!',
    'أحسنت {name}! إجابة عبقرية! 🎉 معاك دلوقتي {bal}',
    'ممتاز جداً {name}! استمر يا بطل! 🚀 رصيدك {bal}',
    'الله عليك {name} يا فنان! إجابة صحيحة 💯',
    'ذكاء خارق {name}! 🏆 معاك دلوقتي {bal}'
  ];
  const ERROR = [
    'حاول تاني {name}، أنت بطل وتقدر تحلها! 💡',
    'معلش {name}، ركز في الرقم الجاي! 🎯 باقي معاك {bal}',
    'خطأ بسيط {name}، فكر تاني وهتجيبها صح! ✨',
    '{name} مش بيستسلم، جرب كمان مرة! 🚀'
  ];
  function message(ok) {
    const n = childName() ? 'يا ' + childName() : 'يا بطل';
    const bal = window.Piggy ? Piggy.words(Piggy.balance()) : '';
    const step = window.Piggy ? Piggy.words(Piggy.step()) : '';
    return pick(ok ? SUCCESS : ERROR).replace(/\{name\}/g, n).replace(/\{bal\}/g, bal).replace(/\{step\}/g, step);
  }

  // ---------- التوست ----------
  let toastTimeout = null;
  function showToast(text, type) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMessage.textContent = text;
    toastMessage.className = 'toast-message show ' + (type || '');
    toastTimeout = setTimeout(() => { toastMessage.className = 'toast-message'; }, 6000);
  }
  toastMessage.addEventListener('click', () => { toastMessage.className = 'toast-message'; });

  // ==========================================
  // توليد المسائل الرياضية (كما في محمود)
  // ==========================================
  function generateProblem() {
    cancelAutoCheck();
    state.busy = false;
    state.scratches = {};
    state.onesVal = ''; state.tensVal = ''; state.hundredsVal = '';
    state.activeBox = 'ones';

    let num1 = 0, num2 = 0, op = '+';
    if (state.mode === 'multiplication') {
      op = '×';
      if (state.table === 'all') { num1 = rnd(12, 91); num2 = rnd(2, 9); }
      else { num2 = parseInt(state.table, 10); num1 = rnd(12, 91); }
    } else {
      op = state.opType === 'mix' ? (Math.random() > 0.5 ? '+' : '-') : state.opType;
      const min = state.digits === 2 ? 10 : 100, max = state.digits === 2 ? 99 : 999;
      num1 = rnd(min, max); num2 = rnd(min, max);
      if (op === '-' && num1 < num2) { const t = num1; num1 = num2; num2 = t; }
    }
    const answer = op === '+' ? num1 + num2 : op === '-' ? num1 - num2 : num1 * num2;
    state.currentProblem = { num1, num2, op, answer };
    renderProblem();
  }

  // ==========================================
  // رسم المسألة التفاعلية والشطب وخانات الإجابة (كما في محمود)
  // ==========================================
  // قفص الأرقام المحبوسة 🔒 (الرقم المحمول في الضرب)
  function cageHtml() {
    const cageVal = state.scratches['carry_1'] !== undefined ? toHindi(state.scratches['carry_1']) : '';
    return `
        <div class="number-cage-wrapper">
          <div class="cage-title">🔒 قفص الأرقام</div>
          <div class="cage-box" data-target="carry_1" title="انقر لحبس الرقم المحمول داخل القفص!">${cageVal}</div>
        </div>`;
  }

  function renderProblem() {
    const p = state.currentProblem;
    if (!p) return;
    const layout = state.layout; // الضرب أيضاً يُعرض رأسياً أو أفقياً حسب الإعداد
    problemContainer.className = 'problem-display ' + layout;

    const str1 = p.num1.toString(), str2 = p.num2.toString();
    const maxLen = Math.max(str1.length, str2.length);

    let answerBoxesHtml = '<div class="answer-boxes-row">';
    if (maxLen >= 3 || p.op === '×' || (p.num1 + p.num2) >= 100) {
      answerBoxesHtml += `
        <div class="sub-answer-box hundreds-box ${state.activeBox === 'hundreds' ? 'active' : ''}" data-box="hundreds">
          <input type="tel" inputmode="numeric" pattern="[0-9]*" class="answer-input hundreds-input" id="hundredsInput" value="${toHindi(state.hundredsVal || '')}" maxlength="1" autocomplete="off">
        </div>
        <div class="sub-answer-box tens-box ${state.activeBox === 'tens' ? 'active' : ''}" data-box="tens">
          <input type="tel" inputmode="numeric" pattern="[0-9]*" class="answer-input tens-input" id="tensInput" value="${toHindi(state.tensVal || '')}" maxlength="1" autocomplete="off">
        </div>
        <div class="sub-answer-box ones-box ${state.activeBox === 'ones' ? 'active' : ''}" data-box="ones">
          <input type="tel" inputmode="numeric" pattern="[0-9]*" class="answer-input ones-input" id="onesInput" value="${toHindi(state.onesVal || '')}" maxlength="1" autocomplete="off">
        </div>`;
    } else {
      answerBoxesHtml += `
        <div class="sub-answer-box tens-box ${state.activeBox === 'tens' ? 'active' : ''}" data-box="tens">
          <input type="tel" inputmode="numeric" pattern="[0-9]*" class="answer-input tens-input" id="tensInput" value="${toHindi(state.tensVal || '')}" maxlength="1" autocomplete="off">
        </div>
        <div class="sub-answer-box ones-box ${state.activeBox === 'ones' ? 'active' : ''}" data-box="ones">
          <input type="tel" inputmode="numeric" pattern="[0-9]*" class="answer-input ones-input" id="onesInput" value="${toHindi(state.onesVal || '')}" maxlength="1" autocomplete="off">
        </div>`;
    }
    answerBoxesHtml += '</div>';

    if (layout === 'horizontal') {
      // الأفقي: صف مربعات علوية فوق الرقم الأول (مخفي بالـ CSS كما في محمود) وصفّا شطب
      let hScratchRowHtml = '<div class="num-row inline-digits h-scratch-row">';
      for (let i = 0; i < str1.length; i++) {
        const colFromRight = str1.length - 1 - i;
        const key = `num1_${i}`, carryKey = `carry_${colFromRight}`;
        if (p.op === '+' && colFromRight === 0) hScratchRowHtml += '<div class="scratch-box-empty"></div>';
        else {
          const targetKey = p.op === '+' ? carryKey : key;
          const val = state.scratches[targetKey] !== undefined ? toHindi(state.scratches[targetKey]) : '';
          hScratchRowHtml += `<div class="scratch-box" data-target="${targetKey}">${val}</div>`;
        }
      }
      hScratchRowHtml += '</div>';
      let num1Html = '', num2Html = '';
      for (let i = 0; i < str1.length; i++) { const key = `num1_${i}`; num1Html += `<div class="digit-slot ${state.scratches[key] !== undefined ? 'scratched' : ''}" data-target="${key}">${toHindi(str1[i])}</div>`; }
      for (let i = 0; i < str2.length; i++) { const key = `num2_${i}`; num2Html += `<div class="digit-slot ${state.scratches[key] !== undefined ? 'scratched' : ''}" data-target="${key}">${toHindi(str2[i])}</div>`; }
      problemContainer.innerHTML = `
        <div class="horizontal-wrapper">
          <div class="horizontal-problem-row">
            <div class="num-with-scratch">${hScratchRowHtml}<div class="num-row inline-digits">${num1Html}</div></div>
            <span class="op-sign-horizontal">${p.op}</span>
            <div class="num-row inline-digits">${num2Html}</div>
            <span class="op-sign-horizontal">=</span>
            ${answerBoxesHtml}
          </div>
          ${p.op === '×' ? cageHtml() : ''}
        </div>`;
    } else if (p.op === '×') {
      // الضرب الرأسي: قفص الأرقام المحبوسة 🔒 بجوار المسألة
      let num1DigitsHtml = '<div class="num-row vertical-row">';
      for (let i = 0; i < str1.length; i++) num1DigitsHtml += `<div class="digit-slot" data-target="num1_${i}">${toHindi(str1[i])}</div>`;
      num1DigitsHtml += '<div class="op-cell-space"></div></div>';
      let num2DigitsHtml = '<div class="num-row vertical-row">';
      for (let i = 0; i < str2.length; i++) num2DigitsHtml += `<div class="digit-slot" data-target="num2_${i}">${toHindi(str2[i])}</div>`;
      num2DigitsHtml += `<div class="op-cell-space"><span class="op-sign-right">${p.op}</span></div></div>`;
      problemContainer.innerHTML = `
        <div class="multiplication-layout">
          <div class="vertical-problem-main">
            ${num1DigitsHtml}
            ${num2DigitsHtml}
            <div class="problem-line"></div>
            <div class="num-row vertical-row answer-v-row">${answerBoxesHtml}<div class="op-cell-space"></div></div>
          </div>
          ${cageHtml()}
        </div>`;
    } else {
      // الرأسي للجمع والطرح: صف الصناديق العلوية (الحمل/الاستلاف) فوق الأرقام
      let scratchRowHtml = '<div class="num-row vertical-row">';
      for (let i = 0; i < maxLen; i++) {
        const colFromRight = maxLen - 1 - i;
        const key = `carry_${colFromRight}`;
        if (p.op === '+' && colFromRight === 0) scratchRowHtml += '<div class="scratch-box-empty"></div>';
        else {
          const val = state.scratches[key] !== undefined ? toHindi(state.scratches[key]) : '';
          scratchRowHtml += `<div class="scratch-box" data-target="${key}" title="الرقم المحمول/المستلف فوق هذه الخانة">${val}</div>`;
        }
      }
      scratchRowHtml += '<div class="op-cell-space"></div></div>';
      let num1DigitsHtml = '<div class="num-row vertical-row">';
      for (let i = 0; i < str1.length; i++) { const key = `num1_${i}`; num1DigitsHtml += `<div class="digit-slot ${state.scratches[key] !== undefined ? 'scratched' : ''}" data-target="${key}" title="انقر للتفاعل مع الرقم">${toHindi(str1[i])}</div>`; }
      num1DigitsHtml += '<div class="op-cell-space"></div></div>';
      let num2DigitsHtml = '<div class="num-row vertical-row">';
      for (let i = 0; i < str2.length; i++) { const key = `num2_${i}`; num2DigitsHtml += `<div class="digit-slot ${state.scratches[key] !== undefined ? 'scratched' : ''}" data-target="${key}" title="انقر للتفاعل مع الرقم">${toHindi(str2[i])}</div>`; }
      num2DigitsHtml += `<div class="op-cell-space"><span class="op-sign-right">${p.op}</span></div></div>`;
      problemContainer.innerHTML = `
        ${scratchRowHtml}
        ${num1DigitsHtml}
        ${num2DigitsHtml}
        <div class="problem-line"></div>
        <div class="num-row vertical-row answer-v-row">${answerBoxesHtml}<div class="op-cell-space"></div></div>`;
    }

    bindAnswerInputs();
    problemContainer.querySelectorAll('.scratch-box, .cage-box').forEach(el => el.addEventListener('click', () => openScratchModal(el.getAttribute('data-target'))));
    problemContainer.querySelectorAll('.digit-slot').forEach(el => {
      el.addEventListener('click', () => {
        const targetKey = el.getAttribute('data-target');
        if (state.currentProblem.op === '+' || state.currentProblem.op === '×') {
          showToast('نكتب الرقم الزيادة المحمول في الصندوق بالأعلى! 💡');
          openScratchModal('carry_' + targetKey.split('_')[1]);
        } else openScratchModal(targetKey);
      });
    });
  }

  // ---------- نافذة الشطب والاستلاف والقفص ----------
  function openScratchModal(targetKey) {
    state.selectedTarget = targetKey;
    scratchOptions.innerHTML = '';
    for (let i = 0; i <= 19; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scratch-num-btn';
      btn.textContent = toHindi(i);
      btn.addEventListener('click', () => { state.scratches[targetKey] = i; scratchModal.classList.add('hidden'); play('pop'); renderProblem(); });
      scratchOptions.appendChild(btn);
    }
    scratchModal.classList.remove('hidden');
  }
  $('closeScratchModal').addEventListener('click', () => scratchModal.classList.add('hidden'));
  $('unscratchBtn').addEventListener('click', () => { if (state.selectedTarget) delete state.scratches[state.selectedTarget]; scratchModal.classList.add('hidden'); renderProblem(); });
  scratchModal.addEventListener('click', e => { if (e.target === scratchModal) scratchModal.classList.add('hidden'); });
  $('clearScratchBtn').addEventListener('click', () => { state.scratches = {}; renderProblem(); showToast('تمت إعادة الأرقام إلى وضعها الأصلي 🔄'); });

  // ---------- خانات الإجابة ----------
  function bindAnswerInputs() {
    const onesInput = $('onesInput'), tensInput = $('tensInput'), hundredsInput = $('hundredsInput');
    if (onesInput) {
      onesInput.addEventListener('input', e => {
        let val = toWestern(e.target.value).replace(/\D/g, ''); if (val.length > 1) val = val.slice(-1);
        state.onesVal = val; e.target.value = toHindi(val);
        if (val !== '' && tensInput) { state.activeBox = 'tens'; highlightActiveBox(); tensInput.focus(); }
        checkAutoSubmit();
      });
      onesInput.addEventListener('focus', () => { state.activeBox = 'ones'; highlightActiveBox(); });
    }
    if (tensInput) {
      tensInput.addEventListener('input', e => {
        let val = toWestern(e.target.value).replace(/\D/g, ''); const maxL = hundredsInput ? 1 : 2; if (val.length > maxL) val = val.slice(0, maxL);
        state.tensVal = val; e.target.value = toHindi(val);
        if (val !== '' && hundredsInput) { state.activeBox = 'hundreds'; highlightActiveBox(); hundredsInput.focus(); }
        checkAutoSubmit();
      });
      tensInput.addEventListener('focus', () => { state.activeBox = 'tens'; highlightActiveBox(); });
    }
    if (hundredsInput) {
      hundredsInput.addEventListener('input', e => {
        let val = toWestern(e.target.value).replace(/\D/g, ''); if (val.length > 2) val = val.slice(0, 2);
        state.hundredsVal = val; e.target.value = toHindi(val);
        checkAutoSubmit();
      });
      hundredsInput.addEventListener('focus', () => { state.activeBox = 'hundreds'; highlightActiveBox(); });
    }
    // الضغط على المربع نفسه يجعله الخانة النشطة للوحة الأرقام
    problemContainer.querySelectorAll('.sub-answer-box').forEach(box => box.addEventListener('click', () => { state.activeBox = box.getAttribute('data-box'); highlightActiveBox(); }));
  }
  function highlightActiveBox() {
    document.querySelectorAll('.sub-answer-box').forEach(box => box.classList.toggle('active', box.getAttribute('data-box') === state.activeBox));
  }

  let autoCheckTimer = null;
  function cancelAutoCheck() { if (autoCheckTimer) { clearTimeout(autoCheckTimer); autoCheckTimer = null; } }
  function checkAutoSubmit() {
    cancelAutoCheck();
    if (!state.currentProblem || state.busy) return;
    const fullStr = (state.hundredsVal || '') + (state.tensVal || '') + (state.onesVal || '');
    if (!fullStr) return;
    if (fullStr.length >= state.currentProblem.answer.toString().length) {
      autoCheckTimer = setTimeout(() => { autoCheckTimer = null; checkAnswer(); }, 1200);
    }
  }

  function handleInputDigit(valStr) {
    if (state.busy) return;
    cancelAutoCheck();
    play('click');
    const expectedLength = state.currentProblem ? state.currentProblem.answer.toString().length : 2;
    if (state.activeBox === 'ones') { state.onesVal = valStr; state.activeBox = 'tens'; }
    else if (state.activeBox === 'tens') {
      if (expectedLength >= 3) { state.tensVal = valStr; state.activeBox = 'hundreds'; }
      else if (state.tensVal.length < 2) state.tensVal += valStr;
    } else if (state.activeBox === 'hundreds') {
      // الخانة الأخيرة تتسع لرقمين (المئات ثم الآلاف): الطفل يكتب من اليمين لليسار، فالرقم الجديد يسبق الموجود
      if (state.hundredsVal.length < 2) state.hundredsVal = valStr + state.hundredsVal;
    }
    renderProblem();
    checkAutoSubmit();
  }
  function backspace() {
    cancelAutoCheck();
    if (state.activeBox === 'hundreds') { if (state.hundredsVal.length > 0) state.hundredsVal = state.hundredsVal.slice(1); else state.activeBox = 'tens'; }
    else if (state.activeBox === 'tens') { if (state.tensVal.length > 0) state.tensVal = state.tensVal.slice(0, -1); else state.activeBox = 'ones'; }
    else if (state.activeBox === 'ones') state.onesVal = '';
    renderProblem();
  }
  document.querySelectorAll('.numpad .num-btn[data-val]').forEach(btn => btn.addEventListener('click', () => handleInputDigit(btn.getAttribute('data-val'))));
  $('backspaceBtn').addEventListener('click', backspace);
  $('clearAnswerBtn').addEventListener('click', () => { cancelAutoCheck(); state.onesVal = ''; state.tensVal = ''; state.hundredsVal = ''; state.activeBox = 'ones'; renderProblem(); });

  window.addEventListener('keydown', e => {
    if (!scratchModal.classList.contains('hidden') || state.mode === 'word') return;
    if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && !/answer-input/.test(e.target.className)) return;
    if (e.key >= '0' && e.key <= '9') { if (!/answer-input/.test((e.target && e.target.className) || '')) handleInputDigit(e.key); }
    else if (e.key === 'Backspace') { if (!/answer-input/.test((e.target && e.target.className) || '')) backspace(); }
    else if (e.key === 'Enter') checkAnswer();
  });

  // ==========================================
  // التحقق من الإجابة: الحصالة الموحدة + النطق + الاحتفال
  // ==========================================
  // يزوّد أو يخصم قيمة المسألة وينطق الرسالة باسم الطفل بلا مؤثرات صوتية (الصوت الوحيد هو قراءة الرسالة)،
  // ويعيد وعداً ينتهي بانتهاء القراءة حتى تنتقل المسألة بعدها
  function reward(ok) {
    const p = window.Piggy ? Piggy.answer(ok, { quiet: true }) : Promise.resolve();
    if (window.Piggy) {
      p.then(() => renderPiggy(true, ok ? Piggy.step() : -Piggy.step()));
    }
    return Promise.race([p, new Promise(r => setTimeout(r, 16000))]);
  }
  function checkAnswer() {
    cancelAutoCheck();
    if (state.busy || !state.currentProblem) return;
    const fullStr = (state.hundredsVal || '') + (state.tensVal || '') + (state.onesVal || '');
    if (fullStr === '') { showToast('من فضلك اكتب الإجابة في خانات الآحاد والعشرات أولاً ' + who() + '! ✍️'); return; }
    const userVal = parseInt(fullStr, 10), correctVal = state.currentProblem.answer;
    if (userVal === correctVal) {
      state.busy = true;
      celebrate();
      renderPiggy(true, window.Piggy ? Piggy.step() : 0);
      if (window.Piggy) {
        Piggy.answer(true, { quiet: true }).then(msg => {
          showToast(msg || message(true), 'success');
          setTimeout(() => generateProblem(), 1200);
        }).catch(() => {
          showToast(message(true), 'success');
          setTimeout(() => generateProblem(), 1200);
        });
      } else {
        showToast(message(true), 'success');
        setTimeout(() => generateProblem(), 1200);
      }
    } else {
      mathCard.classList.add('sad-shake');
      setTimeout(() => mathCard.classList.remove('sad-shake'), 800);
      renderPiggy(true, window.Piggy ? -Piggy.step() : 0);
      if (window.Piggy) {
        Piggy.answer(false, { quiet: true }).then(msg => {
          showToast(msg || message(false), 'error');
          setTimeout(() => generateProblem(), 1200);
        }).catch(() => {
          showToast(message(false), 'error');
          setTimeout(() => generateProblem(), 1200);
        });
      } else {
        showToast(message(false), 'error');
        setTimeout(() => generateProblem(), 1200);
      }
    }
  }
  $('submitBtn').addEventListener('click', checkAnswer);
  $('nextProblemBtn').addEventListener('click', () => { play('whoosh'); generateProblem(); });

  // ==========================================
  // الإعدادات: التبويبات والمجموعات
  // ==========================================
  document.querySelectorAll('.mode-item .mode-head').forEach(head => head.addEventListener('click', () => {
    state.mode = head.parentElement.getAttribute('data-mode');
    saveSettings(); applyModeUI(); play('pop');
    if (state.mode === 'word') generateWordProblem(); else generateProblem();
  }));
  document.querySelectorAll('#digitGroup .segment-btn').forEach(btn => btn.addEventListener('click', () => { state.digits = parseInt(btn.getAttribute('data-digits'), 10); saveSettings(); syncSegments(); updateSetupInfoSummary(); generateProblem(); }));
  document.querySelectorAll('#opTypeGroup .segment-btn').forEach(btn => btn.addEventListener('click', () => { state.opType = btn.getAttribute('data-op'); saveSettings(); syncSegments(); updateSetupInfoSummary(); generateProblem(); }));
  document.querySelectorAll('.layout-seg .segment-btn').forEach(btn => btn.addEventListener('click', () => { state.layout = btn.getAttribute('data-layout'); saveSettings(); syncSegments(); updateSetupInfoSummary(); renderProblem(); }));
  $('tableSelect').addEventListener('change', () => { state.table = $('tableSelect').value; saveSettings(); updateSetupInfoSummary(); generateProblem(); });
  document.querySelectorAll('#wordDiffGroup .segment-btn').forEach(btn => btn.addEventListener('click', () => { state.wdiff = btn.getAttribute('data-wdiff'); saveSettings(); syncSegments(); updateSetupInfoSummary(); generateWordProblem(); }));
  document.querySelectorAll('#wordOpGroup .segment-btn').forEach(btn => btn.addEventListener('click', () => { state.wop = btn.getAttribute('data-wop'); saveSettings(); syncSegments(); updateSetupInfoSummary(); generateWordProblem(); }));

  const soundToggleBtn = $('soundToggleBtn');
  soundToggleBtn.textContent = soundOn() ? '🔊' : '🔇';
  soundToggleBtn.addEventListener('click', () => {
    set('soundOn', soundOn() ? 'false' : 'true');
    soundToggleBtn.textContent = soundOn() ? '🔊' : '🔇';
    if (!soundOn() && window.speechSynthesis) speechSynthesis.cancel();
    showToast(soundOn() ? 'تم تشغيل الصوت 🔊' : 'تم كتم الصوت 🔇');
  });

  // ==========================================
  // المسائل الكلامية: حكايات عن الطفل وبابا وماما والإخوة والأصحاب
  // ==========================================
  const WORD_TEMPLATES = {
    '+': [
      { who: f => f.father, text: (a, b, f) => `رجع ${f.father} من الشغل وإدّى ${f.me} ${a} جنيه، وبعدين إدّته ${f.mother} ${b} جنيه كمان.`, q: f => `كم جنيه مع ${f.me} دلوقتي؟` },
      { who: f => f.friend, text: (a, b, f) => `كان مع ${f.me} ${a} كرة زجاجية، وإدّاه صاحبه ${f.friend} ${b} كرة جديدة.`, q: f => `كم كرة بقت مع ${f.me}؟` },
      { who: f => f.sib, text: (a, b, f) => `جمع ${f.me} ${a} نجمة في المدرسة، وجمع ${f.sib} ${b} نجمة.`, q: () => `كم نجمة جمعوا مع بعض؟` },
      { who: f => f.mother, text: (a, b, f) => `عملت ${f.mother} ${a} قطعة بسكويت الصبح، و${b} قطعة بالليل.`, q: f => `كم قطعة بسكويت عملت ${f.mother}؟` },
      { who: f => f.friend, text: (a, b, f) => `في الحفلة نفخ ${f.me} ${a} بالونة، ونفخ ${f.friend} ${b} بالونة.`, q: () => `كم بالونة نفخوا كلهم؟` },
      { who: f => f.father, text: (a, b, f) => `اشترى ${f.father} لـ${f.me} ${a} قلم أزرق و${b} قلم أحمر.`, q: f => `كم قلم اشترى ${f.father}؟` }
    ],
    '-': [
      { who: f => f.me, text: (a, b, f) => `كان مع ${f.me} ${a} جنيه، واشترى عصير بـ${b} جنيه.`, q: f => `كم جنيه فضل مع ${f.me}؟` },
      { who: f => f.sib, text: (a, b, f) => `كان مع ${f.me} ${a} قطعة شوكولاتة، إدّى ${f.sib} ${b} قطعة.`, q: f => `كم قطعة فضلت مع ${f.me}؟` },
      { who: f => f.mother, text: (a, b, f) => `عندنا في البيت ${a} تفاحة، أكل ${f.father} و${f.mother} ${b} تفاحة.`, q: () => `كم تفاحة فضلت؟` },
      { who: f => f.friend, text: (a, b, f) => `نفخ ${f.me} ${a} بالونة، وفرقعت ${b} بالونة وهو بيلعب مع ${f.friend}.`, q: () => `كم بالونة فضلت سليمة؟` },
      { who: f => f.friend, text: (a, b, f) => `راح ${f.me} و${f.friend} الحديقة وشافوا ${a} عصفورة، طار منهم ${b} عصفورة.`, q: () => `كم عصفورة فضلت؟` },
      { who: f => f.father, text: (a, b, f) => `كان مع ${f.father} ${a} جنيه، إدّى ${f.me} ${b} جنيه مصروف.`, q: f => `كم جنيه فضل مع ${f.father}؟` }
    ],
    '×': [
      { who: f => f.father, text: (a, b, f) => `اشترى ${f.father} ${a} علبة ألوان لـ${f.me}، في كل علبة ${b} لون.`, q: () => `كم لون كلهم؟` },
      { who: f => f.mother, text: (a, b, f) => `عملت ${f.mother} ${a} طبق، في كل طبق ${b} قطعة كيك.`, q: () => `كم قطعة كيك كلها؟` },
      { who: f => f.friend, text: (a, b, f) => `لعب ${f.me} مع ${f.friend} ${a} جولة، وكسب في كل جولة ${b} نقطة.`, q: f => `كم نقطة كسب ${f.me}؟` },
      { who: f => f.sib, text: (a, b, f) => `عند ${f.sib} ${a} كيس بلي، في كل كيس ${b} بلية.`, q: f => `كم بلية عند ${f.sib}؟` },
      { who: f => f.mother, text: (a, b, f) => `في حفلة ${f.me} ${a} ترابيزة، على كل ترابيزة ${b} بالونة.`, q: () => `كم بالونة في الحفلة؟` },
      { who: f => f.me, text: (a, b, f) => `${f.me} بيقرأ ${b} صفحة كل يوم لمدة ${a} يوم.`, q: f => `كم صفحة قرأ ${f.me}؟` }
    ]
  };
  const word = { story: null, options: [], lastIndex: -1 };

  function generateWordProblem() {
    let op = state.wop;
    if (op === 'mix') op = pick(['+', '-', '×']);
    let num1 = 0, num2 = 0;
    if (state.wdiff === 'easy') { if (op === '×') { num1 = rnd(2, 6); num2 = rnd(2, 6); } else { num1 = rnd(2, 9); num2 = rnd(2, 9); } }
    else if (state.wdiff === 'medium') { if (op === '×') { num1 = rnd(10, 19); num2 = rnd(2, 6); } else { num1 = rnd(12, 91); num2 = rnd(2, 9); } }
    else { if (op === '×') { num1 = rnd(10, 24); num2 = rnd(2, 9); } else { num1 = rnd(12, 91); num2 = rnd(12, 91); } }
    if (op === '-' && num1 < num2) { const t = num1; num1 = num2; num2 = t; }
    const answer = op === '+' ? num1 + num2 : op === '-' ? num1 - num2 : num1 * num2;

    const templates = WORD_TEMPLATES[op];
    let idx = Math.floor(Math.random() * templates.length);
    if (templates.length > 1 && idx === word.lastIndex) idx = (idx + 1) % templates.length;
    word.lastIndex = idx;
    const t = templates[idx], f = family();

    let opts = [answer, answer + rnd(1, 5), Math.max(0, answer - rnd(1, 5)), answer + 10];
    opts = [...new Set(opts)];
    while (opts.length < 4) { const n = answer + rnd(1, 15); if (!opts.includes(n)) opts.push(n); }
    opts.sort(() => Math.random() - 0.5);
    word.options = opts;
    word.story = { num1, num2, op, answer, charName: t.who(f), text: t.text(toHindi(num1), toHindi(num2), f), questionText: t.q(f) };
    word.locked = false;
    renderWordStory();
    if (window.KidsTheme && KidsTheme.readEnabled && KidsTheme.readEnabled()) setTimeout(readStory, 300);
  }
  function renderWordStory() {
    const st = word.story; if (!st) return;
    $('wordStoryCard').innerHTML = '<div class="story-character-tag">✨ ' + esc(st.charName) + '</div><div class="word-story-text">' + esc(st.text) + '</div><div class="word-story-question">❓ ' + esc(st.questionText) + '</div>';
    const box = $('wordMCQContainer'); box.innerHTML = '';
    word.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'mcq-btn'; btn.textContent = toHindi(opt);
      btn.onclick = () => handleMCQ(opt, btn);
      box.appendChild(btn);
    });
  }
  function readStory() {
    if (!word.story || !soundOn() || !window.KidsTheme) return;
    KidsTheme.speak(word.story.text + ' ' + word.story.questionText);
  }
  $('wordReadBtn').addEventListener('click', readStory);
  $('nextWordStoryBtn').addEventListener('click', () => { play('whoosh'); generateWordProblem(); });

  function handleMCQ(selected, btn) {
    if (word.locked || !word.story) return;
    word.locked = true;
    const ok = selected === word.story.answer;
    document.querySelectorAll('#wordMCQContainer .mcq-btn').forEach(b => { b.onclick = null; b.style.pointerEvents = 'none'; });
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (ok) {
      btn.classList.add('correct');
      celebrate();
      showToast(message(true), 'success');
      reward(true).then(() => setTimeout(generateWordProblem, 400));
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('#wordMCQContainer .mcq-btn').forEach(b => { if (b.textContent === toHindi(word.story.answer)) b.classList.add('blink'); });
      showToast(message(false), 'error');
      reward(false).then(() => setTimeout(generateWordProblem, 900));
    }
  }

  // ==========================================
  // جداول الضرب (استعراض)
  // ==========================================
  const selectorModal = $('multiplicationSelectorModal'), viewerModal = $('multiplicationViewerModal');
  const openTables = () => { closeSidebar(); selectorModal.classList.remove('hidden'); };
  $('multiplicationTableBtn').addEventListener('click', openTables);
  $('openTablesBtn').addEventListener('click', openTables);
  $('closeMultiplicationSelectorBtn').addEventListener('click', () => selectorModal.classList.add('hidden'));
  $('closeMultiplicationViewerBtn').addEventListener('click', () => viewerModal.classList.add('hidden'));
  $('backToTableSelectorBtn').addEventListener('click', () => { viewerModal.classList.add('hidden'); selectorModal.classList.remove('hidden'); });
  selectorModal.addEventListener('click', e => { if (e.target === selectorModal) selectorModal.classList.add('hidden'); });
  viewerModal.addEventListener('click', e => { if (e.target === viewerModal) viewerModal.classList.add('hidden'); });
  $('tableSelectorGrid').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => showMultiplicationTable(parseInt(btn.getAttribute('data-table'), 10))));
  function showMultiplicationTable(tableNum) {
    selectorModal.classList.add('hidden');
    $('multiplicationViewerTitle').textContent = 'جدول ' + toHindi(tableNum);
    const content = $('multiplicationViewerContent'); content.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
      const row = document.createElement('div'); row.className = 'table-row';
      row.innerHTML = '<span class="table-expr">' + toHindi(tableNum) + ' × ' + toHindi(i) + '</span><span class="table-equals">=</span><span class="table-result">' + toHindi(tableNum * i) + '</span>';
      row.addEventListener('click', () => { if (window.KidsTheme && soundOn()) KidsTheme.speak(toHindi(tableNum) + ' × ' + toHindi(i) + ' = ' + toHindi(tableNum * i)); });
      content.appendChild(row);
    }
    viewerModal.classList.remove('hidden');
  }

  // ==========================================
  // التهيئة
  // ==========================================
  syncSegments();
  applyModeUI();
  renderPiggy(false);
  if (state.mode === 'word') generateWordProblem(); else generateProblem();
  // لو لسه مفيش اسم للطفل: نطلبه مرة واحدة عشان الرسائل والشيك يبقوا باسمه
  if (window.Piggy && !Piggy.name() && !sessionStorage.getItem('math_name_asked')) {
    try { sessionStorage.setItem('math_name_asked', '1'); } catch (e) {}
    setTimeout(() => Piggy.askName(() => renderPiggy(false)), 600);
  }
  setTimeout(() => {
    if (window.KidsTheme && soundOn()) {
      const name = childName() || 'يا بطل';
      KidsTheme.speak('مرحبا ' + name + '! هيا نحل مسائل رياضية 🧮');
    }
  }, 800);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
