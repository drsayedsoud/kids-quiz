// board.js - السبورة الذكية المنطق البرمجي

const Board = {
  ctx: null,
  isDrawing: false,
  color: '#ffffff',
  size: 10,
  
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
      { digits: 1, nextAt: 5 }, // 5 correct to reach 2 digits
      { digits: 2, nextAt: 15 }, // 15 correct to reach 3 digits
      { digits: 3, nextAt: 50 }, // 50 correct to reach 4 digits
      { digits: 4, nextAt: 50 },
      { digits: 5, nextAt: 999 }
    ],
    word: [
      { length: 2, nextAt: 5 },
      { length: 3, nextAt: 15 },
      { length: 4, nextAt: 50 },
      { length: 5, nextAt: 999 }
    ]
  },
  
  DICTIONARY: {
    2: ['أب', 'أم', 'أخ', 'يد', 'فم', 'دب', 'قط', 'كل', 'هل'],
    3: ['أسد', 'بحر', 'قمر', 'شمس', 'قلم', 'ولد', 'بنت', 'باب', 'نمر', 'عنب', 'عمر'],
    4: ['قطار', 'كتاب', 'طائر', 'تفاح', 'حليب', 'مسجد', 'خروف', 'حصان'],
    5: ['سيارة', 'دراجة', 'طائرة', 'فراشة', 'عصفور', 'برتقال']
  },

  init() {
    this.setupUI();
    this.setupEvents();
    this.updatePiggyUI();
    
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
      // We shouldn't clear, but resizing resets canvas. We will just clear for now.
      this.clearBoard();
    });
    
    // Set initial canvas styles
    this.clearBoard();
  },

  resizeCanvas(canvas) {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 20; // Padding
    canvas.height = rect.height - 20;
    if (canvas.width > 600) canvas.width = 600;
  },

  setupEvents() {
    const mainCanvas = document.getElementById('main-board');
    
    // Drawing Events for Main Canvas
    const getPos = (e, canvas) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e, ctx, canvas) => {
      e.preventDefault();
      this.isDrawing = true;
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
    // Alternate or Random? Let's do random.
    this.mode = Math.random() > 0.5 ? 'number' : 'word';
    
    if (this.mode === 'number') {
      document.getElementById('main-board').style.display = 'block';
      document.getElementById('word-boxes').style.display = 'none';
      
      const config = this.LEVELS.number[Math.min(this.levelNumber - 1, this.LEVELS.number.length - 1)];
      let min = Math.pow(10, config.digits - 1);
      let max = Math.pow(10, config.digits) - 1;
      if (config.digits === 1) min = 0;
      
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      this.currentAnswer = num.toString();
      document.getElementById('question-text').textContent = `اكتب رقم ${this.currentAnswer}`;
      document.getElementById('current-level-text').textContent = this.levelNumber;
      
    } else {
      document.getElementById('main-board').style.display = 'none';
      const boxesContainer = document.getElementById('word-boxes');
      boxesContainer.style.display = 'flex';
      boxesContainer.innerHTML = ''; // Clear old boxes
      
      const config = this.LEVELS.word[Math.min(this.levelWord - 1, this.LEVELS.word.length - 1)];
      const words = this.DICTIONARY[config.length] || this.DICTIONARY[2];
      this.currentAnswer = words[Math.floor(Math.random() * words.length)];
      
      document.getElementById('question-text').textContent = `اكتب كلمة "${this.currentAnswer}"`;
      document.getElementById('current-level-text').textContent = this.levelWord;
      
      this.wordBoxes = [];
      // Create boxes for each letter
      for (let i = 0; i < this.currentAnswer.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.className = 'word-box';
        canvas.width = 120;
        canvas.height = 120;
        boxesContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        this.wordBoxes.push({ canvas, ctx, letter: this.currentAnswer[i] });
        
        // Attach drawing events to this box
        this.attachBoxEvents(canvas, ctx);
      }
    }
    
    this.playQuestionAudio();
  },
  
  attachBoxEvents(canvas, ctx) {
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      // Scale coordinates based on actual rendered size vs internal resolution
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    let boxDrawing = false;
    const start = (e) => {
      e.preventDefault(); boxDrawing = true;
      const pos = getPos(e);
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = this.color; ctx.lineWidth = this.size;
    };
    const move = (e) => {
      e.preventDefault(); if (!boxDrawing) return;
      const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    };
    const stop = (e) => { e.preventDefault(); boxDrawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', move, {passive: false});
    canvas.addEventListener('touchend', stop, {passive: false});
  },

  playQuestionAudio() {
    if (window.KidsTheme && KidsTheme.speak) {
      if (this.mode === 'number') {
        KidsTheme.speak(`اكتب رقم ${this.currentAnswer}`);
      } else {
        KidsTheme.speak(`اكتب كلمة ${this.currentAnswer}`);
      }
    }
  },

  // Prepare canvas for OCR (Tesseract expects black text on white background)
  prepareCanvasForOCR(sourceCanvas) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceCanvas.width;
    tempCanvas.height = sourceCanvas.height;
    const tCtx = tempCanvas.getContext('2d');
    
    // Fill white background
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the source canvas on top. But since the user might have drawn in white/yellow,
    // we need to force all non-background pixels to be BLACK.
    const imgData = sourceCanvas.getContext('2d').getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imgData.data;
    
    const tImgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const tData = tImgData.data;
    
    // #0f172a is rgb(15, 23, 42) -> our background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      // If it's not the background color (allow some threshold)
      if (Math.abs(r - 15) > 10 || Math.abs(g - 23) > 10 || Math.abs(b - 42) > 10) {
        // Make it black on the white canvas
        tData[i] = 0;   // R
        tData[i+1] = 0; // G
        tData[i+2] = 0; // B
        tData[i+3] = 255; // A
      }
    }
    tCtx.putImageData(tImgData, 0, 0);
    return tempCanvas.toDataURL('image/png');
  },

  async checkAnswer() {
    document.getElementById('ai-loading').style.display = 'flex';
    let isCorrect = false;
    
    try {
      if (this.mode === 'number') {
        const img = this.prepareCanvasForOCR(this.ctx.canvas);
        const { data: { text } } = await Tesseract.recognize(img, 'eng');
        // Clean text (allow arabic numerals or english)
        const recognized = text.replace(/[^0-9٠-٩]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
        console.log("Recognized Number:", recognized);
        
        if (recognized === this.currentAnswer) {
          isCorrect = true;
        }
      } else {
        // Check each word box
        let recognizedWord = '';
        for (let i = 0; i < this.wordBoxes.length; i++) {
          const img = this.prepareCanvasForOCR(this.wordBoxes[i].canvas);
          const { data: { text } } = await Tesseract.recognize(img, 'ara');
          // Get first arabic letter
          const letter = text.replace(/[^أ-ي]/g, '').charAt(0) || '';
          recognizedWord += letter;
          console.log(`Box ${i} recognized:`, letter);
        }
        
        console.log("Recognized Word:", recognizedWord);
        // Compare with tolerance
        if (recognizedWord === this.currentAnswer) {
          isCorrect = true;
        } else {
          // Fallback: sometimes kids write the full word in one box, or OCR misses a dot.
          // In a real production app, we'd use a better model. For now, strict match or 1 letter typo allowance.
          let matches = 0;
          for (let i = 0; i < this.currentAnswer.length; i++) {
             if (recognizedWord[i] === this.currentAnswer[i]) matches++;
          }
          if (matches >= this.currentAnswer.length - 1 && this.currentAnswer.length > 2) {
             isCorrect = true; // Allow 1 mistake for long words
          } else if (matches === this.currentAnswer.length) {
             isCorrect = true;
          }
        }
      }
    } catch (e) {
      console.error("OCR Error:", e);
    }
    
    document.getElementById('ai-loading').style.display = 'none';
    this.handleResult(isCorrect);
  },

  handleResult(isCorrect) {
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
      if (window.KidsTheme) {
        KidsTheme.play('lose');
        KidsTheme.speak('حاول مرة أخرى يا بطل!');
      }
      
      // Level down logic on failure
      if (this.mode === 'number') {
        this.streakNumber = 0; // Reset streak
        // Simple downgrade rule: if they fail, maybe they need easier? 
        // We won't strictly downgrade on 1 fail to avoid frustration, but we reset streak.
        localStorage.setItem('board_streak_number', 0);
      } else {
        this.streakWord = 0;
        localStorage.setItem('board_streak_word', 0);
      }
      
      // Clear board for retry
      setTimeout(() => this.clearBoard(), 2000);
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
