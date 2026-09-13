// story.js - محرك القصص التفاعلية الذكي

const FALLBACK_STORIES = [
  {
    title: "رحلة {name} إلى القمر",
    emoji: "🚀",
    chapters: [
      { title: "بداية الرحلة", text: "في يوم من الأيام، {name} كان قاعد في جنينة البيت مع {friend}، وفجأة شافوا صاروخ صغير نازل من السما ببطء واستقر قدامهم!", emoji: "🌳" },
      { title: "التحدي الفضائي", text: "{name} و{friend} قرروا يركبوا الصاروخ. طار بيهم الصاروخ وسط النجوم الجميلة! بس فجأة الصاروخ وقف وقال: «لازم تجاوب على السؤال ده عشان نكمل الرحلة للقمر!»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "بعد ما {name} جاوب صح، الصاروخ عمل صوت فرحة (بيييب بيييب) وكمل طيران بسرعة لحد ما نزل بسلام على سطح القمر اللي كان بيلمع زي الفضة.", emoji: "🌙" },
      { title: "العودة للبيت", text: "{name} رجع البيت و{mother} كانت مستنياه. حكى لها كل اللي حصل، و{mother} حضنته وقالت: «أنت بطل وذكي يا {name}! دايما بتتعلم حاجات جديدة». وتوتة توتة خلصت الحدوتة.", emoji: "💫" }
    ]
  },
  {
    title: "مغامرة {name} في الغابة السحرية",
    emoji: "🦁",
    chapters: [
      { title: "اكتشاف الباب السحري", text: "{name} كان بيلعب مع إخواته {siblings}، وفجأة لقوا باب خشب قديم متغطي بورق الشجر. لما فتحوه، لقوا نفسهم في غابة سحرية مليانة ألوان عجيبة!", emoji: "🚪" },
      { title: "لغز البومة الحكيمة", text: "في الغابة، قابلوا بومة حكيمة لابسة نضارة. البومة قالت: «أهلا يا {name}.. مش هتقدر تعدي الجسر إلا لما تحل اللغز ده!»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "لما {name} جاوب صح، البومة ابتسمت والجسر السحري ظهر من تحت الأرض عشان يكملوا طريقهم لمكان مليان فراشات بتنور في الضلمة.", emoji: "🦋" },
      { title: "رجوع الأبطال", text: "بعد يوم طويل من اللعب والاستكشاف، {name} وإخواته رجعوا البيت و{father} جابلهم عشا لذيذ. قالهم {father}: «مغامرات بكرا أحلى إن شاء الله». نام {name} وهو مبسوط.", emoji: "💤" }
    ]
  },
  {
    title: "{name} والكنز المفقود",
    emoji: "🏴‍☠️",
    chapters: [
      { title: "خريطة قديمة", text: "{name} كان بيقلب في كتب قديمة ولقى خريطة كنز! جرى بسرعة وراها لصاحبه {friend} وقرروا يروحوا يدوروا على الكنز المفقود في جزيرة الأسرار.", emoji: "🗺️" },
      { title: "صندوق الكنز", text: "وصلوا لمكان الصندوق، بس كان مقفول بقفل إلكتروني غريب. القفل كتب على شاشته: «أثبت ذكاءك عشان تتفتح!»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "برافو يا {name}! القفل نور أخضر والصندوق اتفتح. كان جواه كتب جميلة وألعاب جديدة بتلمع.", emoji: "🎁" },
      { title: "أحلى كنز", text: "{name} رجع البيت ووزع الهدايا على {siblings} و{mother} و{father}. الكل كان مبسوط جدا، وعرف {name} إن أحلى كنز هو العيلة.", emoji: "❤️" }
    ]
  },
  {
    title: "{name} وبطل الرياضة",
    emoji: "⚽",
    chapters: [
      { title: "يوم الماتش", text: "النهاردة يوم مهم جدا! {name} هيلعب ماتش كورة كبير في النادي، و{father} و{mother} رايحين يشجعوه من المدرجات.", emoji: "🏟️" },
      { title: "ضربة الجزاء", text: "الماتش كان صعب جدا، وفي آخر دقيقة الحكم حسب ضربة جزاء لصالح فريق {name}. بس المدرب قال: «قبل ما تشوط، لازم تركز وتحل المسألة دي».\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "ذكاء {name} خلاه يجاوب صح ويشوط الكورة بقوة وتركيز.. وجووووول! الفريق كسب الماتش والكل كان بيصقف.", emoji: "🏆" },
      { title: "الاحتفال", text: "{father} جاب آيس كريم لـ {name} وكل صحابه للاحتفال بالفوز. {name} اتعلم إن العقل السليم في الجسم السليم.", emoji: "🍦" }
    ]
  },
  {
    title: "مزرعة الحيوانات السعيدة",
    emoji: "🐄",
    chapters: [
      { title: "رحلة المزرعة", text: "يوم الجمعة، {name} راح مع {father} مزرعة كبيرة. كان فيها بقر وخرفان وحصنة حلوة جدا. {name} كان متحمس يأكلهم.", emoji: "🚜" },
      { title: "مساعدة المزارع", text: "عم المزارع طلب من {name} يساعده في عد المحصول، وقاله: «يا بطل، عشان أعرف إنك مركز معايا، جاوبني على ده»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "{name} جاوب بسرعة وصح! عم المزارع فرح جدا وشكره، واداله فرصة يركب الحصان الصغير ويلف بيه المزرعة.", emoji: "🐴" },
      { title: "نهاية اليوم", text: "الرحلة خلصت ورجع {name} البيت وهو شايل تفاح طازة من المزرعة لـ {mother}. نام {name} وهو بيحلم بالحيوانات.", emoji: "🍎" }
    ]
  },
  {
    title: "الغواصة العجيبة",
    emoji: "🚤",
    chapters: [
      { title: "النزول للأعماق", text: "{name} اخترع غواصة صغيرة عشان يستكشف قاع البحر. نزل في المية العميقة مع صاحبه {friend} وشافوا سمك ألوانه بتخطف العين.", emoji: "🐠" },
      { title: "سمكة القرش الطيبة", text: "فجأة، ظهرت سمكة قرش كبيرة بس شكلها طيب. القرش قال: «ممنوع المرور من هنا إلا للأذكياء فقط!»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "لما {name} جاوب بذكاء، سمكة القرش ضحكت ووسعت لهم الطريق. وكملوا غطس لحد ما وصلوا لمدينة المرجان.", emoji: "🪸" },
      { title: "حكايات البحر", text: "لما رجعوا، {name} قعد يحكي لـ {siblings} كل الحكايات عن الأسماك الغريبة. كانت مغامرة تحت المية مش هتتنسي.", emoji: "🌊" }
    ]
  },
  {
    title: "قطار المفاجآت",
    emoji: "🚂",
    chapters: [
      { title: "تذكرة السفر", text: "{name} لقى تذكرة سفر ذهبية لقطار المفاجآت السريع. ركب القطر ولقى كراسي من القطن الناعم ومزيكا هادية شغالة.", emoji: "🎫" },
      { title: "مفتش التذاكر", text: "مفتش التذاكر كان أرنب لابس طاقية. بص في التذكرة وقال: «علشان أدخلك عربة الألعاب، لازم تحل اللغز ده الأول»\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "{name} فكر شوية وجاوب صح. الأرنب ابتسم وفتح باب عربية كلها ملاهي وزحاليق وألعاب لكل الركاب.", emoji: "🎢" },
      { title: "محطة الوصول", text: "القطر وصل المحطة الأخيرة، ولقى {mother} و{father} مستنيينه. {name} كان طاير من الفرحة بيوم كله مفاجآت.", emoji: "🎉" }
    ]
  },
  {
    title: "حديقة الديناصورات",
    emoji: "🦕",
    chapters: [
      { title: "آلة الزمن", text: "{name} شغل آلة الزمن اللي اخترعها ورجع لورا ملايين السنين! لقى نفسه وسط ديناصورات ضخمة بس طيبة وبتاكل زرع.", emoji: "⏳" },
      { title: "لغز الديناصور الصغير", text: "ديناصور صغير كان ضايع وعايز يرجع لمامته، بس كان خايف. {name} قرر يساعده بس لازم يحل المشكلة دي الأول:\n\n[QUESTION_HERE]", emoji: "❓" },
      { title: "بعد الإجابة", text: "بسبب شطارة {name} في الإجابة، عرف الطريق الصح ووصل الديناصور الصغير لمامته اللي شكرت {name} جدا.", emoji: "🦖" },
      { title: "الرجوع للحاضر", text: "{name} داس على زرار آلة الزمن ورجع بيته في سلام. غسل سنانه ونام استعدادا لمغامرة جديدة بكرا.", emoji: "🪥" }
    ]
  }
];

class StoryEngine {
  constructor() {
    this.childData = this.loadChildData();
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
    this.currentStory = null;
    this.currentChapter = 0;
    this.question = null;
    
    // UI Elements
    this.views = {
      loading: document.getElementById('loading-view'),
      story: document.getElementById('story-view'),
      finish: document.getElementById('finish-view')
    };
    
    this.btnNext = document.getElementById('btn-next');
    this.btnPrev = document.getElementById('btn-prev');
    this.btnRead = document.getElementById('btn-read');
    this.qArea = document.getElementById('question-area');
    
    // Bind Events
    this.btnNext.onclick = () => this.nextChapter();
    this.btnPrev.onclick = () => this.prevChapter();
    this.btnRead.onclick = () => this.readCurrentChapter();
    
    // Start
    this.init();
  }

  loadChildData() {
    return {
      name: localStorage.getItem('piggyName') || localStorage.getItem('mp_playerName') || 'بطل المستقبل',
      age: localStorage.getItem('kids_age') || '8',
      school: localStorage.getItem('kids_school') || 'المدرسة',
      father: localStorage.getItem('kids_father') || 'بابا',
      mother: localStorage.getItem('kids_mother') || 'ماما',
      siblings: localStorage.getItem('kids_siblings') || 'إخواتي',
      friend: (localStorage.getItem('kids_friends') || '').split('،')[0] || 'صاحبي',
      grade: localStorage.getItem('kids_class') || 'kids_2'
    };
  }

  async init() {
    // 1. Fetch Question
    this.question = await this.fetchQuestion();
    
    // 2. Generate or Load Story
    if (this.apiKey) {
      try {
        this.currentStory = await this.generateStoryWithGemini();
      } catch (err) {
        console.error('Gemini error:', err);
        UI.toast('حصل مشكلة في الذكاء الاصطناعي.. هنقرأ قصة من المكتبة 📚', { type: 'warn' });
        this.currentStory = this.getFallbackStory();
      }
    } else {
      UI.toast('تقدر تضيف مفتاح Gemini من الإعدادات عشان نخلق لك قصص جديدة كل يوم! ✨', { type: 'warn' });
      this.currentStory = this.getFallbackStory();
    }
    
    // 3. Start Story
    this.showView('story');
    this.renderChapter();
  }

  showView(viewName) {
    Object.values(this.views).forEach(v => v.classList.remove('active'));
    this.views[viewName].classList.add('active');
  }

  getFallbackStory() {
    let idx = parseInt(localStorage.getItem('story_index') || '0');
    if (idx >= FALLBACK_STORIES.length) idx = 0;
    
    const template = FALLBACK_STORIES[idx];
    localStorage.setItem('story_index', idx + 1);
    
    // Replace names
    const d = this.childData;
    const format = (text) => text
      .replace(/\{name\}/g, d.name)
      .replace(/\{friend\}/g, d.friend)
      .replace(/\{father\}/g, d.father)
      .replace(/\{mother\}/g, d.mother)
      .replace(/\{siblings\}/g, d.siblings);
      
    return {
      title: format(template.title),
      emoji: template.emoji,
      chapters: template.chapters.map(ch => ({
        title: ch.title,
        text: format(ch.text),
        emoji: ch.emoji
      }))
    };
  }

  async generateStoryWithGemini() {
    const d = this.childData;
    const themes = ["مغامرة في الفضاء", "رحلة في الغابة", "البحث عن كنز", "السفر عبر الزمن", "بطل خارق ينقذ المدينة", "رحلة تحت البحر", "اختراع عجيب"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    const prompt = `أنت راوي قصص أطفال مصري. اكتب قصة قصيرة مسلية ومفيدة من 4 فصول قصيرة (كل فصل 2-4 جمل) للطفل "${d.name}" عمره ${d.age} سنوات.

الشخصيات:
- البطل: ${d.name}
- الأب: ${d.father}
- الأم: ${d.mother}
- الإخوة: ${d.siblings}
- الأصدقاء: ${d.friend}

الموضوع: ${randomTheme}

القواعد:
1. اكتب بالعامية المصرية البسيطة المناسبة للأطفال
2. القصة يجب أن تكون إيجابية ومشجعة
3. الفصل الثاني ينتهي بتحدٍ يحتاج إجابة سؤال
4. في الفصل الثاني اكتب بالضبط: [QUESTION_HERE]
5. الفصل الثالث يبدأ بـ "بعد ما ${d.name} فكر بذكاء وجاوب صح..."
6. الفصل الرابع هو النهاية السعيدة مع درس مستفاد

أرجع JSON فقط بهذا الشكل وبدون أي نصوص إضافية:
{"title":"عنوان","emoji":"🌟","chapters":[{"title":"..","text":"..","emoji":".."},{"title":"..","text":".. [QUESTION_HERE]","emoji":".."},{"title":"..","text":"..","emoji":".."},{"title":"..","text":"..","emoji":".."}]}
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    const textRes = data.candidates[0].content.parts[0].text;
    
    let storyJson;
    try {
      storyJson = JSON.parse(textRes);
    } catch (e) {
      // Clean markdown if present
      const clean = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
      storyJson = JSON.parse(clean);
    }
    
    // Ensure format
    if (!storyJson.chapters || storyJson.chapters.length !== 4) {
      throw new Error('Invalid format returned');
    }
    
    return storyJson;
  }

  async fetchQuestion() {
    let cat = this.childData.grade;
    if (!['kids_1', 'kids_2', 'kids_3'].includes(cat)) cat = 'kids_2';
    
    try {
      // 1. Try to get from IndexedDB (already loaded by script.js)
      const db = await this.openDB();
      const cached = await this.idbGet(db, 'cat:' + cat);
      if (cached && cached.items && cached.items.length > 0) {
        return this.pickRandomQuestion(cached.items);
      }
      
      // 2. Not in DB? Let's fetch zip
      UI.toast('بنجهز الأسئلة أول مرة.. ثواني بس ⏳', { type: 'info' });
      const res = await fetch(`data/${cat}.zip`);
      const buffer = await res.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const jsonFile = zip.file(`${cat}.json`);
      if (jsonFile) {
        const text = await jsonFile.async('string');
        const items = JSON.parse(text);
        return this.pickRandomQuestion(items);
      }
    } catch (err) {
      console.warn('Could not fetch real question, using fallback', err);
    }
    
    // Fallback simple question
    return {
      question: "كم يساوي ٥ + ٤ ؟",
      choice1: "٧",
      choice2: "٨",
      choice3: "٩",
      choice4: "١٠",
      correct_answer: "٩",
      emoji: "🧮"
    };
  }

  pickRandomQuestion(items) {
    const valid = items.filter(q => q && q.question && q.choice1 && q.correct_answer);
    return valid[Math.floor(Math.random() * valid.length)];
  }

  renderChapter() {
    const ch = this.currentStory.chapters[this.currentChapter];
    document.getElementById('story-title').textContent = this.currentStory.title;
    document.getElementById('chapter-badge').textContent = `فصل ${this.currentChapter + 1} / 4`;
    document.getElementById('progress-fill').style.width = `${((this.currentChapter + 1) / 4) * 100}%`;
    
    document.getElementById('chapter-emoji').textContent = ch.emoji || '✨';
    document.getElementById('chapter-title').textContent = ch.title || '';
    
    // Parse text for question marker
    const hasQuestion = ch.text.includes('[QUESTION_HERE]');
    let safeText = ch.text.replace('[QUESTION_HERE]', '').trim();
    document.getElementById('chapter-text').textContent = safeText;
    
    // Update Question Area
    if (hasQuestion && this.question) {
      this.qArea.style.display = 'block';
      this.btnNext.style.display = 'none'; // Must answer to proceed
      document.getElementById('q-text').textContent = (this.question.emoji ? this.question.emoji + ' ' : '') + this.question.question;
      
      const choices = [this.question.choice1, this.question.choice2, this.question.choice3, this.question.choice4];
      choices.sort(() => Math.random() - 0.5); // shuffle
      
      const grid = document.getElementById('choices-grid');
      grid.innerHTML = '';
      choices.forEach(c => {
        if (!c) return;
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = c;
        btn.onclick = () => this.handleAnswer(btn, c);
        grid.appendChild(btn);
      });
    } else {
      this.qArea.style.display = 'none';
      this.btnNext.style.display = 'block';
    }

    // Update controls
    this.btnPrev.disabled = this.currentChapter === 0;
    
    if (this.currentChapter === this.currentStory.chapters.length - 1) {
      this.btnNext.textContent = 'النهاية 🌟';
      this.btnNext.classList.replace('primary', 'success');
    } else {
      this.btnNext.textContent = 'التالي ➔';
      this.btnNext.classList.replace('success', 'primary');
    }
    
    // Auto-read if enabled
    if (localStorage.getItem('kids_read') !== 'off') {
      setTimeout(() => this.readCurrentChapter(), 300);
    }
  }

  handleAnswer(btn, answer) {
    if (this.answered) return;
    
    const isCorrect = answer === this.question.correct_answer;
    
    if (isCorrect) {
      this.answered = true;
      btn.classList.add('correct');
      if (window.KidsTheme) KidsTheme.play('star');
      
      // Add piggy bank points
      let step = parseInt(localStorage.getItem('piggyStep')) || 10;
      let bal = parseInt(localStorage.getItem('piggyBalance')) || 0;
      localStorage.setItem('piggyBalance', bal + step);
      document.getElementById('piggy-ui-wrap').style.display = 'inline-block';
      document.getElementById('piggy-ui').textContent = (bal + step) + ' قرش';
      
      setTimeout(() => {
        this.nextChapter();
      }, 1500);
    } else {
      btn.classList.add('wrong');
      if (window.KidsTheme) KidsTheme.play('wrong');
      btn.disabled = true;
    }
  }

  nextChapter() {
    if (this.currentChapter < this.currentStory.chapters.length - 1) {
      this.currentChapter++;
      this.answered = false;
      this.renderChapter();
    } else {
      // Finish
      if (window.KidsTheme) KidsTheme.play('fanfare');
      this.showView('finish');
    }
  }

  prevChapter() {
    if (this.currentChapter > 0) {
      this.currentChapter--;
      this.answered = false;
      this.renderChapter();
    }
  }

  readCurrentChapter() {
    if (!window.KidsTheme) return;
    const ch = this.currentStory.chapters[this.currentChapter];
    let txtToRead = ch.text.replace('[QUESTION_HERE]', '');
    if (this.qArea.style.display !== 'none' && this.question) {
      txtToRead += ' .. ' + this.question.question;
    }
    KidsTheme.speak(txtToRead);
  }

  // --- Minimal IndexedDB Helper ---
  openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('QuranDB', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('quranData')) db.createObjectStore('quranData');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  idbGet(db, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('quranData', 'readonly');
      const store = tx.objectStore('quranData');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StoryEngine();
});
