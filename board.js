// board.js - السبورة الذكية المنطق البرمجي

const Board = {
  ctx: null,
  isDrawing: false,
  color: '#ffffff',
  size: 10,
  autoCheckTimer: null,
  checking: false,
  
  // Game State
  mode: 'number', // 'number' or 'word'
  levelNumber: parseInt(localStorage.getItem('board_level_number')) || 1,
  streakNumber: parseInt(localStorage.getItem('board_streak_number')) || 0,
  levelWord: parseInt(localStorage.getItem('board_level_word')) || 1,
  streakWord: parseInt(localStorage.getItem('board_streak_word')) || 0,
  
  currentAnswer: '',
  wordBoxes: [], // Array of canvas contexts for words
  
  // Configuration
  LEVELS: {
    number: [
      { digits: 1, nextAt: 5 },  
      { digits: 2, nextAt: 10 }, 
      { digits: 3, nextAt: 15 }, 
      { digits: 4, nextAt: 20 },
      { digits: 5, nextAt: 25 },
      { digits: 6, nextAt: 999 }
    ],
    word: [
      { length: 2, nextAt: 5 },
      { length: 3, nextAt: 10 },
      { length: 4, nextAt: 15 },
      { length: 5, nextAt: 20 },
      { length: 6, nextAt: 25 },
      { length: 7, nextAt: 999 }
    ]
  },
  
  DICTIONARY: {
    2: ['أب', 'أم', 'أخ', 'يد', 'فم', 'دب', 'قط', 'كل', 'هل', 'جد', 'عم', 'خس', 'بط'],
    3: ['أسد', 'بحر', 'قمر', 'شمس', 'قلم', 'ولد', 'بنت', 'باب', 'نمر', 'عنب', 'عمر', 'نمل', 'نحل', 'جمل', 'فأر', 'كلب', 'بيت', 'عين', 'أذن', 'أنف'],
    4: ['قطار', 'كتاب', 'طائر', 'تفاح', 'حليب', 'مسجد', 'خروف', 'حصان', 'حمار', 'ثعلب', 'غراب', 'عنكب', 'سيارة', 'شجرة', 'وردة', 'زهرة', 'موزة'], // Note: some are 5 letters but stored in 4 length category by mistake? Let's fix lengths exactly.
    5: ['سيارة', 'دراجة', 'طائرة', 'فراشة', 'عصفور', 'برتقال', 'فراولة', 'تفاحة', 'حمامة', 'طاووس', 'تمساح', 'مدرسة'],
    6: ['ديناصور', 'مستشفى', 'تلفزيون', 'ميكروب', 'اسكندر'],
    7: ['مستوصف', 'اخطبوط', 'اسماعيل', 'ميكانيك']
  },

  init() {
    // Clean up dictionary by actual length
    for (const key in this.DICTIONARY) {
      this.DICTIONARY[key] = this.DICTIONARY[key].filter(w => w.length === parseInt(key));
    }
    // Backup words if empty
    this.DICTIONARY[4] = ['قطار', 'كتاب', 'طائر', 'تفاح', 'حليب', 'مسجد', 'خروف', 'حصان', 'حمار', 'ثعلب', 'غراب', 'شجرة', 'وردة', 'زهرة', 'موزة'].filter(w => w.length === 4);
    
    // Clear any stale dismissal flag from previous sessions
    try { sessionStorage.removeItem('board_landscape_dismissed'); } catch (e) {}

    this.setupUI();
    this.setupEvents();
    this.updatePiggyUI();
    this.preloadOCR();
    
    // Greet the hero!
    setTimeout(() => {
      const name = (window.Piggy && Piggy.name()) || localStorage.getItem('mp_playerName') || 'بطل';
      if (window.KidsTheme && KidsTheme.speak) {
        KidsTheme.speak(`أهلاً يا بطل ${name} في السبورة الذكية!`);
      }
      this.generateQuestion();
    }, 1000);
  },

  setupUI() {
    const mainCanvas = document.getElementById('main-board');
    this.ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
    
    // Resize main canvas
    this.resizeCanvas(mainCanvas);
    window.addEventListener('resize', () => {
      this.resizeCanvas(mainCanvas);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(mainCanvas), 250);
    });
    
    // Set initial canvas styles
    this.clearBoard();
  },

  resizeCanvas(canvas) {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    const padX = isLandscape ? 32 : 20;
    const padY = isLandscape ? 14 : 20;
    let targetWidth = Math.floor(rect.width - padX);
    let targetHeight = Math.floor(rect.height - padY);
    
    // In landscape mode allow canvas to stretch wide across the screen
    const maxAllowedWidth = isLandscape ? 1100 : 600;
    if (targetWidth > maxAllowedWidth) targetWidth = maxAllowedWidth;
    if (targetWidth < 260) targetWidth = 260;
    if (targetHeight < 120) targetHeight = 120;
    
    if (canvas.width === targetWidth && canvas.height === targetHeight) return;

    // Backup current drawing if any
    let backupCanvas = null;
    if (this.ctx && canvas.width > 0 && canvas.height > 0 && this.hasInk(canvas)) {
      backupCanvas = document.createElement('canvas');
      backupCanvas.width = canvas.width;
      backupCanvas.height = canvas.height;
      const bCtx = backupCanvas.getContext('2d');
      bCtx.drawImage(canvas, 0, 0);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (backupCanvas) {
      this.ctx.drawImage(backupCanvas, 0, 0, canvas.width, canvas.height);
    }
  },

  setupEvents() {
    const mainCanvas = document.getElementById('main-board');
    
    // Drawing Events for Main Canvas with accurate scaling
    const getPos = (e, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      const scaleX = canvas.width / (rect.width || 1);
      const scaleY = canvas.height / (rect.height || 1);
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDraw = (e, ctx, canvas) => {
      e.preventDefault();
      this.isDrawing = true;
      this.resetAutoCheck();
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
    };

    const draw = (e, ctx, canvas) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDraw = (e) => {
      e.preventDefault();
      this.isDrawing = false;
      this.startAutoCheck();
    };

    mainCanvas.addEventListener('mousedown', (e) => startDraw(e, this.ctx, mainCanvas));
    mainCanvas.addEventListener('mousemove', (e) => draw(e, this.ctx, mainCanvas));
    mainCanvas.addEventListener('mouseup', stopDraw);
    mainCanvas.addEventListener('mouseout', stopDraw);

    mainCanvas.addEventListener('touchstart', (e) => startDraw(e, this.ctx, mainCanvas), {passive: false});
    mainCanvas.addEventListener('touchmove', (e) => draw(e, this.ctx, mainCanvas), {passive: false});
    mainCanvas.addEventListener('touchend', stopDraw, {passive: false});

    // Toolbar Events
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.color = btn.dataset.color;
      };
    });

    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.size = parseInt(btn.dataset.size);
      };
    });

    document.getElementById('clear-btn').onclick = () => this.clearBoard();
    document.getElementById('check-btn').onclick = () => this.checkAnswer();
    document.getElementById('audio-btn').onclick = () => this.playQuestionAudio();

    const pageOpenedAt = Date.now();

    // Landscape Overlay Dismiss / Close logic (stay in portrait)
    const dismissLandscape = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent accidental ghost click right when page opens
      if (Date.now() - pageOpenedAt < 350) return;

      document.body.classList.add('landscape-hint-dismissed');
      const overlay = document.getElementById('landscape-overlay');
      if (overlay) overlay.classList.add('dismissed');
      setTimeout(() => {
        this.resizeCanvas(mainCanvas);
      }, 60);
    };

    const closeLandscapeBtn = document.getElementById('close-landscape-btn');
    if (closeLandscapeBtn) closeLandscapeBtn.onclick = dismissLandscape;

    const continuePortraitBtn = document.getElementById('continue-portrait-btn');
    if (continuePortraitBtn) continuePortraitBtn.onclick = dismissLandscape;

    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.onclick = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (e) {
          console.error("Orientation lock failed:", e);
        }
        if (document.fullscreenElement) document.body.classList.add('landscape-locked');
        setTimeout(() => {
          this.resizeCanvas(mainCanvas);
        }, 300);
      };
    }

    // Clean up fullscreen / orientation when clicking back to home
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
      backBtn.onclick = () => {
        try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
        try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch (e) {}
      };
    }

    // Leave the forced landscape mode: unlock the orientation and exit fullscreen.
    const exitBtn = document.getElementById('exit-landscape-btn');
    if (exitBtn) {
      exitBtn.onclick = async () => {
        try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
        try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (e) {}
        document.body.classList.remove('landscape-locked');
        setTimeout(() => {
          this.resizeCanvas(mainCanvas);
        }, 300);
      };
    }
    document.addEventListener('fullscreenchange', () => {
      document.body.classList.toggle('landscape-locked', !!document.fullscreenElement);
      setTimeout(() => {
        this.resizeCanvas(mainCanvas);
      }, 200);
    });
  },

  clearBoard() {
    if (this.mode === 'number') {
      this.ctx.fillStyle = '#0f172a'; // Blackboard color
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    } else {
      this.wordBoxes.forEach(box => {
        box.ctx.fillStyle = '#0f172a';
        box.ctx.fillRect(0, 0, box.canvas.width, box.canvas.height);
      });
    }
  },

  generateQuestion() {
    this.clearBoard();
    this.mode = Math.random() > 0.5 ? 'number' : 'word';
    
    const ar = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

    if (this.mode === 'number') {
      document.getElementById('main-board').style.display = 'block';
      document.getElementById('word-boxes').style.display = 'none';
      
      const config = this.LEVELS.number[Math.min(this.levelNumber - 1, this.LEVELS.number.length - 1)];
      let min = Math.pow(10, config.digits - 1);
      let max = Math.pow(10, config.digits) - 1;
      if (config.digits === 1) min = 0;
      
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      this.currentAnswer = num.toString();
      document.getElementById('question-text').textContent = `🎧 استمع واكتب يا بطل!`;
      document.getElementById('current-level-text').textContent = ar(this.levelNumber);
      
    } else {
      document.getElementById('main-board').style.display = 'none';
      const boxesContainer = document.getElementById('word-boxes');
      boxesContainer.style.display = 'flex';
      boxesContainer.innerHTML = '';
      
      const config = this.LEVELS.word[Math.min(this.levelWord - 1, this.LEVELS.word.length - 1)];
      const words = this.DICTIONARY[config.length] || this.DICTIONARY[2];
      this.currentAnswer = words[Math.floor(Math.random() * words.length)];
      
      document.getElementById('question-text').textContent = `🎧 استمع واكتب يا بطل!`;
      document.getElementById('current-level-text').textContent = ar(this.levelWord);

      
      this.wordBoxes = [];
      for (let i = 0; i < this.currentAnswer.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.className = 'word-box';
        canvas.width = 120;
        canvas.height = 120;
        boxesContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.wordBoxes.push({ canvas, ctx, letter: this.currentAnswer[i], drawn: false });
        this.attachBoxEvents(canvas, ctx, i);
      }
    }
    
    this.playQuestionAudio();
  },
  resetAutoCheck() {
    if (this.autoCheckTimer) clearTimeout(this.autoCheckTimer);
  },

  startAutoCheck() {
    this.resetAutoCheck();
    this.autoCheckTimer = setTimeout(() => {
      // Don't auto check if nothing was drawn
      if (this.mode === 'number') {
        this.checkAnswer();
      } else {
        const allDrawn = this.wordBoxes.every(b => b.drawn);
        if (allDrawn) this.checkAnswer();
      }
    }, 3000); // Wait 3 seconds after the last stroke (kids pause between digits)
  },
  
  attachBoxEvents(canvas, ctx, index) {
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    let boxDrawing = false;
    const start = (e) => {
      e.preventDefault(); boxDrawing = true;
      this.resetAutoCheck();
      this.wordBoxes[index].drawn = true; // Mark as drawn
      const pos = getPos(e);
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = this.color; ctx.lineWidth = this.size;
    };
    const move = (e) => {
      e.preventDefault(); if (!boxDrawing) return;
      const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    };
    const stop = (e) => { 
      e.preventDefault(); 
      boxDrawing = false; 
      this.startAutoCheck();
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', move, {passive: false});
    canvas.addEventListener('touchend', stop, {passive: false});
  },

  playQuestionAudio() {
    const ar = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    if (window.KidsTheme && KidsTheme.speak) {
      if (this.mode === 'number') {
        KidsTheme.speak(`اكتب رقم ${ar(this.currentAnswer)}`);
      } else {
        KidsTheme.speak(`اكتب كلمة ${this.currentAnswer}`);
      }
    }
  },

  // Background colour of every board / box is #0f172a; anything far from it is ink.
  isInk(r, g, b) {
    return Math.abs(r - 15) > 40 || Math.abs(g - 23) > 40 || Math.abs(b - 42) > 40;
  },

  hasInk(canvas) {
    if (!window.GlyphMatch || !GlyphMatch._maskFromCanvas) return false;
    try {
      return GlyphMatch._maskFromCanvas(canvas, this.isInk).inkCount >= 25;
    } catch (e) {
      return false;
    }
  },

  // Build the glyph templates in the background so the first check is instant.
  preloadOCR() {
    if (window.GlyphMatch) GlyphMatch.init();
  },

  normalizeLetter(ch) {
    const map = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': 'ا' };
    return map[ch] || ch;
  },

  async checkAnswer() {
    if (this.checking) return;
    this.resetAutoCheck();
    if (!window.GlyphMatch) {
      if (window.KidsTheme) KidsTheme.speak('لم أستطع التحقق الآن، حاول مرة أخرى');
      return;
    }

    // Nothing drawn yet? Ask the child to write first instead of judging.
    const nothingDrawn = this.mode === 'number'
      ? !this.hasInk(this.ctx.canvas)
      : this.wordBoxes.every(b => !b.drawn);
    if (nothingDrawn) {
      if (window.KidsTheme) KidsTheme.speak('اكتب على السبورة أولاً يا بطل');
      return;
    }

    this.checking = true;
    document.getElementById('ai-loading').style.display = 'flex';
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    let isCorrect = false;
    let wrongBoxes = [];
    let unreadable = false;

    try {
      if (this.mode === 'number') {
        const r = await GlyphMatch.checkNumber(this.ctx.canvas, this.isInk, this.currentAnswer);
        console.log('Board number:', r.status, 'read', r.recognized, 'expected', this.currentAnswer, r.judged);
        isCorrect = r.status === 'ok';
        unreadable = r.status === 'empty';
      } else {
        let recognizedWord = '';
        for (let i = 0; i < this.wordBoxes.length; i++) {
          const box = this.wordBoxes[i];
          const expected = this.normalizeLetter(box.letter);
          if (!box.drawn) { wrongBoxes.push(i); recognizedWord += '_'; continue; }
          const r = await GlyphMatch.checkLetter(box.canvas, this.isInk, expected);
          console.log('Board letter', i, ':', r.status, 'read', r.recognized, 'expected', expected, r.judged);
          recognizedWord += r.recognized || '_';
          if (r.status !== 'ok') wrongBoxes.push(i);
        }
        console.log('Board word: read', recognizedWord, 'expected', this.currentAnswer);
        isCorrect = wrongBoxes.length === 0;
      }
    } catch (e) {
      console.error('Check error:', e);
      document.getElementById('ai-loading').style.display = 'none';
      this.checking = false;
      if (window.KidsTheme) KidsTheme.speak('لم أستطع التحقق الآن، حاول مرة أخرى');
      return;
    }

    document.getElementById('ai-loading').style.display = 'none';
    this.checking = false;
    this.handleResult(isCorrect, { wrongBoxes, unreadable });
  },

  handleResult(isCorrect, info = {}) {
    if (isCorrect) {
      // Success!
      if (window.KidsTheme) {
        KidsTheme.play('star');
        KidsTheme.confetti(3000);
      }

      // Update Piggy Bank
      if (window.Piggy) {
        Piggy.answer(true, {quiet: true});
        this.updatePiggyUI();
      } else {
        // Fallback if piggy logic isn't loaded fully
        let bal = parseInt(localStorage.getItem('piggyBalance')) || 0;
        localStorage.setItem('piggyBalance', bal + 10);
        this.updatePiggyUI();
      }

      // Update Adaptive Level
      if (this.mode === 'number') {
        this.streakNumber++;
        const config = this.LEVELS.number[Math.min(this.levelNumber - 1, this.LEVELS.number.length - 1)];
        if (this.streakNumber >= config.nextAt && this.levelNumber < this.LEVELS.number.length) {
          this.levelNumber++;
          this.streakNumber = 0;
          if (window.KidsTheme) KidsTheme.speak('رائع! لقد وصلت لمستوى جديد في الأرقام!');
        }
        localStorage.setItem('board_level_number', this.levelNumber);
        localStorage.setItem('board_streak_number', this.streakNumber);
      } else {
        this.streakWord++;
        const config = this.LEVELS.word[Math.min(this.levelWord - 1, this.LEVELS.word.length - 1)];
        if (this.streakWord >= config.nextAt && this.levelWord < this.LEVELS.word.length) {
          this.levelWord++;
          this.streakWord = 0;
          if (window.KidsTheme) KidsTheme.speak('رائع! لقد وصلت لمستوى جديد في الكلمات!');
        }
        localStorage.setItem('board_level_word', this.levelWord);
        localStorage.setItem('board_streak_word', this.streakWord);
      }

      setTimeout(() => {
        this.generateQuestion();
      }, 3500);

    } else {
      // Incorrect
      const ar = s => String(s).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
      if (window.KidsTheme) {
        KidsTheme.play('lose');
        if (info.unreadable) {
          KidsTheme.speak('لم أفهم كتابتك، اكتب بوضوح وبحجم أكبر يا بطل');
        } else if (this.mode === 'number') {
          KidsTheme.speak(`ليس صحيحاً، المطلوب رقم ${ar(this.currentAnswer)}. حاول مرة أخرى يا بطل!`);
        } else {
          KidsTheme.speak(`ليس صحيحاً، المطلوب كلمة ${this.currentAnswer}. صحّح الحروف الحمراء يا بطل!`);
        }
      }

      // Reset the streak (no level drop on a single mistake, to avoid frustration)
      if (this.mode === 'number') {
        this.streakNumber = 0;
        localStorage.setItem('board_streak_number', 0);
      } else {
        this.streakWord = 0;
        localStorage.setItem('board_streak_word', 0);
      }

      if (this.mode === 'number') {
        setTimeout(() => this.clearBoard(), 2000);
      } else {
        // Only the wrong letters are cleared; correct ones stay.
        const wrong = info.wrongBoxes && info.wrongBoxes.length ? info.wrongBoxes : this.wordBoxes.map((_, i) => i);
        wrong.forEach(i => this.wordBoxes[i].canvas.classList.add('wrong'));
        setTimeout(() => {
          wrong.forEach(i => {
            const box = this.wordBoxes[i];
            box.ctx.fillStyle = '#0f172a';
            box.ctx.fillRect(0, 0, box.canvas.width, box.canvas.height);
            box.drawn = false;
            box.canvas.classList.remove('wrong');
          });
        }, 2000);
      }
    }
  },

  updatePiggyUI() {
    let bal = parseInt(localStorage.getItem('piggyBalance')) || 0;
    const display = document.getElementById('board-piggy-amount');
    if (display) {
      if (window.Piggy && Piggy.words) {
        display.textContent = Piggy.words(bal);
      } else {
        display.textContent = bal + ' قرش';
      }
    }
  }
};

window.addEventListener('load', () => {
  Board.init();
});
