// عالم المدينة لمغامرة forest.html: خمس مراحل في شوارع المدينة والميدان والسوق والحديقة والمدينة ليلاً.
// يُحمَّل قبل forest.js ويعرّف window.CityWorld = { OB, LEVELS, layers } ليدمجه محرك المغامرة مع عالم الغابة.
(function () {
    'use strict';
    const em = (x, y, s, ch, cls) => '<text x="' + x + '" y="' + y + '" font-size="' + s + '" text-anchor="middle"' + (cls ? ' class="' + cls + '"' : '') + '>' + ch + '</text>';

    // ---------- street furniture ----------
    const lamp = (x, th) => '<rect x="' + (x - 4) + '" y="330" width="8" height="200" fill="#4a4f55"/><rect x="' + (x - 16) + '" y="322" width="32" height="14" rx="5" fill="#3b4045"/><ellipse cx="' + x + '" cy="336" rx="10" ry="5" fill="' + (th.night ? '#ffe9a0' : '#d9dde2') + '"/>' + (th.night ? '<circle cx="' + x + '" cy="340" r="46" fill="#ffe9a0" opacity="0.12"/>' : '');
    const planter = (x, th) => '<rect x="' + (x - 26) + '" y="500" width="52" height="30" rx="4" fill="#8a6a4a"/><rect x="' + (x - 3) + '" y="440" width="6" height="62" fill="#5a4030"/><circle cx="' + x + '" cy="430" r="34" fill="' + th.leaf + '"/><circle cx="' + (x - 18) + '" cy="445" r="22" fill="' + th.leaf + '"/><circle cx="' + (x + 18) + '" cy="445" r="22" fill="' + th.leaf + '"/>';
    const hydrant = x => '<rect x="' + (x - 9) + '" y="490" width="18" height="40" rx="5" fill="#c9463d"/><rect x="' + (x - 14) + '" y="500" width="28" height="8" rx="3" fill="#c9463d"/><circle cx="' + x + '" cy="488" r="8" fill="#c9463d"/>';
    const bench = x => '<rect x="' + (x - 40) + '" y="500" width="80" height="8" rx="3" fill="#8a5a33"/><rect x="' + (x - 40) + '" y="486" width="80" height="8" rx="3" fill="#8a5a33"/><rect x="' + (x - 36) + '" y="508" width="6" height="22" fill="#3b4045"/><rect x="' + (x + 30) + '" y="508" width="6" height="22" fill="#3b4045"/>';

    // ---------- buildings ----------
    function skyline(len, base, seed, fill, rng) {
        const r = rng(seed); let s = '', x = 0;
        while (x < len + 300) { const w = 60 + r() * 120, h = 80 + r() * 220; s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>'; if (r() < 0.3) s += '<rect x="' + (x + w / 2 - 2) + '" y="' + (base - h - 30) + '" width="4" height="30" fill="' + fill + '"/>'; x += w + r() * 20; }
        return s;
    }
    function buildingRow(len, base, hMin, hMax, seed, th, rng, avoid, shops) {
        const r = rng(seed); let s = '', x = 20;
        while (x < len + 300) {
            const w = 120 + r() * 140, h = hMin + r() * (hMax - hMin), skip = avoid && avoid.some(a => Math.abs(x + w / 2 - a) < 40 && false);
            const c = th.walls[Math.floor(r() * th.walls.length)];
            if (!skip) {
                s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" fill="' + c + '"/><rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="10" fill="rgba(0,0,0,0.18)"/>';
                const cols = Math.max(2, Math.floor(w / 36)), rows = Math.max(1, Math.floor((h - 60) / 44));
                for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const lit = th.night ? r() < 0.55 : false; s += '<rect x="' + (x + 12 + i * ((w - 24) / cols)) + '" y="' + (base - h + 22 + j * 44) + '" width="18" height="24" rx="2" fill="' + (lit ? '#ffe28a' : th.night ? '#1f2a3d' : '#cfe3ee') + '"/>'; }
                if (shops && r() < 0.6) { const ac = th.awnings[Math.floor(r() * th.awnings.length)]; s += '<rect x="' + (x + 10) + '" y="' + (base - 60) + '" width="' + (w - 20) + '" height="50" fill="' + (th.night ? '#2a3348' : '#f3efe4') + '"/><path d="M' + (x + 4) + ' ' + (base - 64) + ' h' + (w - 8) + ' l-8 18 h' + (-(w - 24)) + ' z" fill="' + ac + '"/>' + em(x + w / 2, base - 24, 22, ['🍞', '🍎', '📚', '🧸', '🍬', '☕'][Math.floor(r() * 6)]); }
                else if (r() < 0.5) s += '<rect x="' + (x + w / 2 - 16) + '" y="' + (base - 50) + '" width="32" height="50" rx="3" fill="' + (th.night ? '#3b4457' : '#6b5a48') + '"/>';
            }
            x += w + 14 + r() * 30;
        }
        return s;
    }

    // ---------- obstacles ----------
    const carSvg = (x, c) => '<rect x="' + (x - 80) + '" y="500" width="160" height="44" rx="14" fill="' + c + '"/><path d="M' + (x - 50) + ' 502 q12 -30 40 -30 h30 q28 0 40 30 z" fill="' + c + '"/><path d="M' + (x - 42) + ' 500 q10 -22 32 -22 h20 v22 z M' + (x + 14) + ' 478 h14 q22 0 32 22 h-46 z" fill="#cfe6f4"/><circle cx="' + (x - 45) + '" cy="546" r="16" fill="#2b2f33"/><circle cx="' + (x + 45) + '" cy="546" r="16" fill="#2b2f33"/><circle cx="' + (x - 45) + '" cy="546" r="7" fill="#9aa1a8"/><circle cx="' + (x + 45) + '" cy="546" r="7" fill="#9aa1a8"/><rect x="' + (x + 72) + '" y="516" width="8" height="10" rx="2" fill="#ffe08a"/>';
    const busSvg = (x, c, label) => '<rect x="' + (x - 110) + '" y="440" width="220" height="104" rx="14" fill="' + c + '"/><rect x="' + (x - 100) + '" y="452" width="200" height="34" rx="6" fill="#cfe6f4"/>' + [-70, -20, 30, 80].map(d => '<rect x="' + (x + d - 20) + '" y="456" width="36" height="26" rx="3" fill="#8fc3dd"/>').join('') + '<rect x="' + (x - 100) + '" y="496" width="200" height="8" fill="rgba(0,0,0,0.15)"/><circle cx="' + (x - 65) + '" cy="548" r="17" fill="#2b2f33"/><circle cx="' + (x + 65) + '" cy="548" r="17" fill="#2b2f33"/>' + (label ? em(x, 528, 18, label) : '');
    const cart = (x, top, c) => '<rect x="' + (x - 60) + '" y="486" width="120" height="54" rx="8" fill="' + c + '"/><rect x="' + (x - 66) + '" y="430" width="132" height="14" rx="4" fill="#c9463d"/><path d="M' + (x - 66) + ' 444 h132 l-6 14 h-120 z" fill="#f3d3a0"/><rect x="' + (x - 62) + '" y="444" width="4" height="42" fill="#3b4045"/><rect x="' + (x + 58) + '" y="444" width="4" height="42" fill="#3b4045"/><circle cx="' + (x - 34) + '" cy="548" r="12" fill="#2b2f33"/><circle cx="' + (x + 34) + '" cy="548" r="12" fill="#2b2f33"/>' + em(x, 478, 30, top);

    const OB = {
        cones: { ic: '🚧', name: 'أعمال طريق', line: 'الطريق مقفول بمخاريط برتقالية! جاوب صح علشان العامل يفتح لك', pass: 'العامل رفع الحاجز وعدّيت!', amb: 'traffic',
            draw: x => [-60, 0, 60].map(d => '<path d="M' + (x + d - 18) + ' 552 l14 -50 h8 l14 50 z" fill="#f28c28"/><rect x="' + (x + d - 12) + '" y="524" width="24" height="7" fill="#fff"/><rect x="' + (x + d - 24) + '" y="550" width="48" height="6" rx="2" fill="#2b2f33"/>').join('') + '<rect x="' + (x - 80) + '" y="500" width="160" height="12" fill="#f28c28"/>' + [-70, -40, -10, 20, 50].map(d => '<rect x="' + (x + d) + '" y="500" width="14" height="12" fill="#fff"/>').join('') },
        cat: { ic: '🐈', name: 'القطة', line: 'قطة صغيرة قاعدة في نص الطريق وبتموء! جاوب صح علشان تفسح لك', pass: 'القطة مشيت وأنت عدّيت بلطف!', amb: 'meow', draw: x => em(x, 552, 58, '🐈', 'bob') },
        puddle: { ic: '💧', name: 'بركة مطر', line: 'بركة مية من المطر! جاوب صح علشان تقفز فوقها', pass: 'قفزت فوق البركة وجزمتك فضلت ناشفة!', amb: 'water', draw: x => '<ellipse cx="' + x + '" cy="548" rx="90" ry="20" fill="#6f95ad"/><ellipse cx="' + (x - 20) + '" cy="544" rx="40" ry="8" fill="#a9c8da" opacity="0.7" class="ripple"/>' },
        pigeons: { ic: '🕊️', name: 'الحمام', line: 'سرب حمام واقف على الرصيف! جاوب صح علشان يطير ويفسح لك', pass: 'الحمام طار وأنت عدّيت!', amb: 'birds', draw: x => em(x - 40, 550, 34, '🕊️', 'bob') + em(x + 10, 552, 34, '🕊️', 'bob') + em(x + 55, 548, 34, '🕊️', 'bob') },
        bicycle: { ic: '🚲', name: 'العجلة', line: 'عجلة واقفة عرض الطريق! جاوب صح علشان صاحبها يزيحها', pass: 'صاحب العجلة زاحها وقال لك شكراً!', amb: 'bell', draw: x => em(x, 552, 66, '🚲') },
        bench: { ic: '🪑', name: 'الكرسي', line: 'كرسي الحديقة في نص الممر! جاوب صح علشان تقفز فوقه', pass: 'قفزت فوق الكرسي زي البطل!', amb: 'step', draw: x => bench(x) },
        crossing: { ic: '🚦', name: 'إشارة المرور', line: 'الإشارة حمرا! جاوب صح علشان تبقى خضرا وتعدّي الشارع', pass: 'الإشارة بقت خضرا وعدّيت من ممر المشاة!', amb: 'traffic',
            draw: x => [-90, -60, -30, 0, 30, 60].map(d => '<rect x="' + (x + d) + '" y="505" width="18" height="70" fill="#f1f1ec" opacity="0.9"/>').join('') + '<rect x="' + (x + 100) + '" y="380" width="8" height="180" fill="#4a4f55"/><rect x="' + (x + 84) + '" y="360" width="40" height="86" rx="8" fill="#2b2f33"/><circle cx="' + (x + 104) + '" cy="376" r="10" fill="#e64a3b"/><circle cx="' + (x + 104) + '" cy="402" r="10" fill="#5a5340"/><circle cx="' + (x + 104) + '" cy="428" r="10" fill="#3f5a3f"/>' },
        dog: { ic: '🐕', name: 'الكلب', line: 'كلب لطيف واقف في الطريق وبيهز ديله! جاوب صح علشان يجري ويلعب', pass: 'الكلب جري فرحان وأنت عدّيت!', amb: 'bark', draw: x => em(x, 552, 62, '🐕', 'bob') },
        kiosk: { ic: '🏪', name: 'الكشك', line: 'عم حسن صاحب الكشك عنده سؤال ليك! جاوب صح وياخد بالك من الحلويات', pass: 'عم حسن قال: برافو يا شاطر!', amb: 'traffic',
            draw: x => '<rect x="' + (x - 60) + '" y="420" width="120" height="120" fill="#4c7a9c"/><rect x="' + (x - 50) + '" y="440" width="100" height="50" fill="#f3efe4"/><path d="M' + (x - 70) + ' 420 h140 l-10 22 h-120 z" fill="#c9463d"/>' + [-50, -10, 30].map(d => '<rect x="' + (x + d) + '" y="420" width="20" height="22" fill="#fff"/>').join('') + em(x, 478, 26, '🍬') + em(x + 30, 476, 20, '🥤') },
        balloon: { ic: '🎈', name: 'البالون الهارب', line: 'بالون طفل صغير طار وعلق فوق الطريق! جاوب صح علشان ترجّعه له', pass: 'رجّعت البالون للطفل وهو فرح جداً!', amb: 'birds', draw: x => '<line x1="' + x + '" y1="470" x2="' + (x + 10) + '" y2="560" stroke="#fff" stroke-width="2"/>' + em(x, 470, 60, '🎈', 'bob') },
        parkgate: { ic: '🚪', name: 'بوابة الحديقة', line: 'بوابة الحديقة مقفولة! الإجابة الصحيحة هي المفتاح', pass: 'البوابة اتفتحت! يلا كمّل', amb: 'step',
            draw: x => '<rect x="' + (x - 90) + '" y="400" width="18" height="160" fill="#7a7f85"/><rect x="' + (x + 72) + '" y="400" width="18" height="160" fill="#7a7f85"/><rect x="' + (x - 100) + '" y="390" width="200" height="12" rx="4" fill="#5f646a"/>' + [-60, -40, -20, 0, 20, 40, 60].map(d => '<rect x="' + (x + d - 3) + '" y="402" width="6" height="158" fill="#5f646a"/>').join('') + '<rect x="' + (x - 72) + '" y="470" width="144" height="8" fill="#5f646a"/>' + em(x, 460, 24, '🔒') },
        fountain: { ic: '⛲', name: 'النافورة', line: 'نافورة الميدان الكبيرة والمية بتطلع لفوق! جاوب صح علشان تلف حواليها', pass: 'لفّيت حوالين النافورة والرذاذ بردك!', amb: 'water',
            draw: x => '<ellipse cx="' + x + '" cy="548" rx="120" ry="24" fill="#8a9aa6"/><ellipse cx="' + x + '" cy="542" rx="104" ry="16" fill="#79b8d8"/><rect x="' + (x - 12) + '" y="440" width="24" height="100" fill="#8a9aa6"/><ellipse cx="' + x + '" cy="440" rx="40" ry="10" fill="#8a9aa6"/><g class="wave" stroke="#cfe8f4" stroke-width="4" fill="none"><path d="M' + x + ' 436 q-30 -40 -60 0"/><path d="M' + x + ' 436 q30 -40 60 0"/><path d="M' + x + ' 436 v-40"/></g>' },
        statue: { ic: '🦁', name: 'تمثال الأسد', line: 'أسد الكوبري الحجري عنده سؤال لكل مغامر يعدّي! جاوب صح', pass: 'الأسد الحجري قال: عدّي يا بطل!', amb: 'traffic', draw: x => '<rect x="' + (x - 50) + '" y="500" width="100" height="56" fill="#9a9c98"/><rect x="' + (x - 60) + '" y="494" width="120" height="10" fill="#b5b7b3"/>' + em(x, 498, 60, '🦁') },
        police: { ic: '👮', name: 'عسكري المرور', line: 'عسكري المرور رافع إيده: استنى! جاوب على سؤاله علشان يسمح لك تعدّي', pass: 'العسكري أدّى لك التحية وعدّيت!', amb: 'whistle', draw: x => em(x, 552, 66, '👮', 'bob') + em(x + 40, 500, 26, '✋') },
        car: { ic: '🚗', name: 'عربية واقفة', line: 'عربية واقفة عرض الطريق! جاوب صح علشان السواق يحرّكها', pass: 'السواق زمّر لك وحرّك العربية!', amb: 'horn', draw: x => carSvg(x, '#d9573f') },
        bus: { ic: '🚌', name: 'أتوبيس المدرسة', line: 'أتوبيس المدرسة واقف والأطفال بيلوّحوا لك! جاوب صح علشان يمشي', pass: 'الأطفال صقّفوا لك من الشباك!', amb: 'horn', draw: x => busSvg(x, '#f2b53a', '🚌') },
        icecream: { ic: '🍦', name: 'عربية الآيس كريم', line: 'عم أحمد بيّاع الآيس كريم عنده سؤال! جاوب صح وياخد بالك من الجايزة', pass: 'عم أحمد قال: برافو، خد آيس كريم!', amb: 'bell', draw: x => cart(x, '🍦', '#f4e8ff') },
        juice: { ic: '🍹', name: 'بيّاع العصير', line: 'بيّاع العصير في السوق نادى عليك بسؤال! جاوب صح', pass: 'شربت عصير قصب وكمّلت الطريق!', amb: 'market', draw: x => cart(x, '🍹', '#c9e6c0') },
        fruit: { ic: '🍎', name: 'عربية الفاكهة', line: 'عربية الفاكهة مالية الطريق! جاوب صح علشان صاحبها يفسح لك', pass: 'صاحب العربية إداك تفاحة وعدّيت!', amb: 'market', draw: x => cart(x, '🍎', '#f7d9a8') + em(x - 30, 480, 22, '🍌') + em(x + 30, 480, 22, '🍊') },
        crates: { ic: '📦', name: 'صناديق السوق', line: 'صناديق متراكمة قافلة الطريق! جاوب صح علشان تقفز فوقها', pass: 'قفزت فوق الصناديق!', amb: 'step',
            draw: x => [[-60, 500], [-6, 500], [48, 500], [-33, 454], [21, 454]].map(([d, y]) => '<rect x="' + (x + d) + '" y="' + y + '" width="52" height="46" rx="3" fill="#c39a63"/><rect x="' + (x + d + 6) + '" y="' + (y + 6) + '" width="40" height="34" fill="none" stroke="#9c7548" stroke-width="2"/>').join('') },
        swing: { ic: '🎠', name: 'المرجيحة', line: 'المرجيحة بتتمرجح في الطريق! جاوب صح علشان تستنى وتعدّي', pass: 'المرجيحة وقفت وعدّيت!', amb: 'birds',
            draw: x => '<path d="M' + (x - 80) + ' 560 L' + (x - 50) + ' 400 L' + (x + 50) + ' 400 L' + (x + 80) + ' 560" stroke="#7a5537" stroke-width="10" fill="none"/><g class="wave"><line x1="' + (x - 20) + '" y1="400" x2="' + (x - 20) + '" y2="500" stroke="#4a4f55" stroke-width="3"/><line x1="' + (x + 20) + '" y1="400" x2="' + (x + 20) + '" y2="500" stroke="#4a4f55" stroke-width="3"/><rect x="' + (x - 30) + '" y="498" width="60" height="10" rx="3" fill="#c9463d"/></g>' },
        pond: { ic: '🦆', name: 'بحيرة البط', line: 'البط عايم في البحيرة وبيبصّ لك! جاوب صح علشان تعدّي على الجسر الصغير', pass: 'عدّيت والبط بطبط لك!', amb: 'water', draw: x => '<ellipse cx="' + x + '" cy="548" rx="120" ry="24" fill="#6ea9c9"/><rect x="' + (x - 130) + '" y="520" width="260" height="10" rx="4" fill="#8a5a33"/>' + em(x - 40, 552, 30, '🦆', 'bob') + em(x + 40, 546, 30, '🦆', 'bob') },
        kite: { ic: '🪁', name: 'الطيارة الورقية', line: 'طيارة ورق علقت في الشجرة! جاوب صح علشان تنزّلها لصاحبها', pass: 'نزّلت الطيارة وصاحبها فرح!', amb: 'wind', draw: (x, th) => '<rect x="' + (x + 30) + '" y="430" width="10" height="130" fill="#5a4030"/><circle cx="' + (x + 35) + '" cy="410" r="50" fill="' + th.leaf + '"/>' + em(x - 10, 400, 46, '🪁', 'bob') },
        flowers: { ic: '🌷', name: 'حوض الزهور', line: 'حوض زهور جميل في نص الممر! جاوب صح علشان تعدّي من غير ما تدوس عليه', pass: 'عدّيت والزهور فضلت جميلة!', amb: 'birds', draw: x => '<rect x="' + (x - 90) + '" y="526" width="180" height="26" rx="6" fill="#8a6a4a"/>' + [-70, -40, -10, 20, 50, 80].map((d, i) => em(x + d - 8, 528, 26, ['🌷', '🌼', '🌸', '🌻'][i % 4])).join('') },
        bigtree: { ic: '🌳', name: 'الشجرة الكبيرة', line: 'شجرة الحديقة الكبيرة جذورها طالعة في الطريق! جاوب صح علشان تقفز فوقها', pass: 'قفزت فوق الجذور!', amb: 'wind', draw: (x, th) => '<path d="M' + (x - 30) + ' 560 q0 -120 30 -160 q30 40 30 160 z" fill="#5a4030"/><path d="M' + (x - 80) + ' 556 q40 -20 80 0 q40 -20 80 0" stroke="#5a4030" stroke-width="12" fill="none"/><circle cx="' + x + '" cy="360" r="90" fill="' + th.leaf + '"/><circle cx="' + (x - 60) + '" cy="400" r="60" fill="' + th.leaf + '"/><circle cx="' + (x + 60) + '" cy="400" r="60" fill="' + th.leaf + '"/>' },
        lamppost: { ic: '💡', name: 'عمود النور', line: 'عمود النور مطفي والشارع ضلمة! جاوب صح علشان ينوّر', pass: 'النور نوّر الشارع كله!', amb: 'traffic', draw: x => '<rect x="' + (x - 4) + '" y="330" width="8" height="230" fill="#4a4f55"/><rect x="' + (x - 18) + '" y="320" width="36" height="16" rx="5" fill="#3b4045"/><ellipse cx="' + x + '" cy="336" rx="12" ry="6" fill="#6b7076"/>' + em(x, 470, 30, '🌑') },
        nightbus: { ic: '🚍', name: 'أتوبيس الليل', line: 'أتوبيس الليل واقف في المحطة والسواق بيسأل! جاوب صح', pass: 'السواق زمّر مرتين: برافو!', amb: 'horn', draw: x => busSvg(x, '#3d6bb5', '🌙') },
        metro: { ic: '🚇', name: 'محطة المترو', line: 'مدخل المترو قدامك والبوابة مقفولة! جاوب صح علشان تفتح', pass: 'البوابة فتحت وعدّيت!', amb: 'traffic', draw: x => '<rect x="' + (x - 80) + '" y="420" width="160" height="140" fill="#2f3b52"/><rect x="' + (x - 70) + '" y="430" width="140" height="30" rx="4" fill="#c9463d"/>' + em(x, 452, 20, 'M مترو') + '<rect x="' + (x - 20) + '" y="470" width="40" height="90" fill="#151c2a"/>' + em(x, 530, 24, '🚧') },
        citybridge: { sp: 'ob-bridge-city', ic: '🌉', name: 'الكوبري', line: 'كوبري صغير فوق الترعة! جاوب صح علشان تعدّي عليه', pass: 'عدّيت الكوبري وشفت المية من فوق!', amb: 'water', draw: x => '<rect x="' + (x - 130) + '" y="540" width="260" height="40" fill="#6ea9c9"/><path d="M' + (x - 120) + ' 560 q120 -90 240 0" stroke="#9a9c98" stroke-width="16" fill="none"/><path d="M' + (x - 120) + ' 560 q120 -90 240 0" stroke="#b5b7b3" stroke-width="6" fill="none"/>' + [-90, -60, -30, 0, 30, 60, 90].map(d => '<rect x="' + (x + d - 2) + '" y="' + (500 - Math.max(0, 40 - Math.abs(d) * 0.45)) + '" width="4" height="30" fill="#b5b7b3"/>').join('') },
        library: { ic: '📚', name: 'مكتبة المدينة', line: 'أمينة المكتبة بتسأل كل طفل سؤال قبل ما يدخل! جاوب صح', pass: 'أمينة المكتبة صقّفت لك!', amb: 'traffic', draw: x => '<rect x="' + (x - 90) + '" y="400" width="180" height="160" fill="#c9b79a"/><path d="M' + (x - 100) + ' 400 h200 l-100 -40 z" fill="#8a5a33"/>' + [-60, -20, 20].map(d => '<rect x="' + (x + d) + '" y="430" width="16" height="130" fill="#e8dcc4"/>').join('') + em(x + 60, 520, 30, '📚') }
    };

    const LEVELS = [
        { id: 1, name: 'شارع الحي', ic: '🏘️', c: '#5f8fb0', pet: { ic: '🐈', name: 'بسبس' }, intro: 'الشارع اللي بيتك فيه: الجيران، الكشك، والقطة بسبس. كل حاجة في الشارع ممكن تسألك سؤال!',
          obst: ['cones', 'cat', 'puddle', 'pigeons', 'bicycle', 'bench', 'crossing', 'dog', 'kiosk', 'balloon', 'car', 'parkgate'],
          th: { kind: 'city', sky: ['#a4cdec', '#f2e9d6'], sun: { x: 0.78, y: 105, r: 44, c: '#fff4c2' }, skyline: ['#a9bccb', '#8fa3b5'], walls: ['#e6c9a8', '#d9b8a0', '#cfd8c8', '#e2d3b3', '#c7b8d6', '#f0dcc2'], awnings: ['#c9463d', '#3d8b6e', '#3d6bb5', '#e0a030'], leaf: '#5f9e6a', pave: ['#d8d5cc', '#bfbcb2'], road: ['#6e7378', '#55595e'], fog: '#eef2f4', fogA: 0.4, rays: true, fore: '#4a5158' } },
        { id: 2, name: 'الميدان الكبير', ic: '⛲', c: '#c98a3f', pet: { ic: '🐕', name: 'بوبي' }, intro: 'ميدان المدينة الكبير: النافورة، تمثال الأسد، أتوبيس المدرسة وعسكري المرور. خلّي بالك من الإشارة!',
          obst: ['fountain', 'statue', 'police', 'car', 'bus', 'icecream', 'pigeons', 'crossing', 'cones', 'cat', 'citybridge', 'parkgate'],
          th: { kind: 'city', sky: ['#9fc4e8', '#f7efe0'], sun: { x: 0.25, y: 110, r: 46, c: '#fff8d6' }, skyline: ['#b3a89a', '#978b7c'], walls: ['#e9d6b4', '#d8c19c', '#efe2c8', '#cdb28f', '#dcc7a6', '#f2e4cd'], awnings: ['#c9463d', '#2f7f6a', '#e0a030', '#7d5ba6'], leaf: '#5f9e6a', pave: ['#e3ddd0', '#c9c2b3'], road: ['#787a7a', '#5e6060'], fog: '#f3efe6', fogA: 0.35, rays: false, fore: '#5a5047' } },
        { id: 3, name: 'السوق الشعبي', ic: '🧺', c: '#b3612e', pet: { ic: '🕊️', name: 'زغلول' }, intro: 'السوق مليان ألوان وأصوات: عربية الفاكهة، بيّاع العصير، والصناديق في كل مكان. جاوب صح وعدّي!',
          obst: ['fruit', 'crates', 'cat', 'juice', 'balloon', 'dog', 'puddle', 'bicycle', 'kiosk', 'pigeons', 'crates', 'parkgate'],
          th: { kind: 'city', sky: ['#f0d1a8', '#fbeedc'], sun: { x: 0.7, y: 130, r: 48, c: '#ffe2a8' }, skyline: ['#c4a184', '#a5846a'], walls: ['#e9c496', '#d9a877', '#efd5b0', '#c9956a', '#e7cfa9', '#f3dfc0'], awnings: ['#c9463d', '#e0a030', '#3d8b6e', '#3d6bb5', '#9c4f9e'], leaf: '#7fa060', pave: ['#d9c9ad', '#bfaa8a'], road: ['#8a7a66', '#6f6252'], fog: '#f8ead8', fogA: 0.4, rays: true, fore: '#6b4d31' } },
        { id: 4, name: 'حديقة المدينة', ic: '🌳', c: '#4f9e63', pet: { ic: '🐇', name: 'أرنوب' }, intro: 'حديقة المدينة الخضرا: المرجيحة، بحيرة البط، والطيارة الورقية. مغامرة هادية وسط الزهور!',
          obst: ['flowers', 'swing', 'pond', 'bench', 'kite', 'balloon', 'dog', 'cat', 'bigtree', 'pigeons', 'fountain', 'parkgate'],
          th: { kind: 'city', park: true, sky: ['#b4dbef', '#eef6e6'], sun: { x: 0.3, y: 100, r: 44, c: '#fff8d6' }, skyline: ['#9fb8c9', '#87a1b3'], walls: ['#dfe8d6', '#cfdcc4'], awnings: ['#3d8b6e'], leaf: '#5f9e6a', pave: ['#8fb56a', '#6f9650'], road: ['#c9b78a', '#a6955f'], fog: '#eef6ee', fogA: 0.45, rays: false, fore: '#2f5236' } },
        { id: 5, name: 'المدينة ليلاً', ic: '🌃', c: '#3e4d8a', pet: { ic: '🐕', name: 'بوبي' }, intro: 'المدينة بالليل: النور في الشبابيك، أتوبيس الليل، ومحطة المترو. المغامرة الأخيرة في المدينة والكنز الكبير في آخرها!',
          obst: ['lamppost', 'cat', 'nightbus', 'puddle', 'metro', 'police', 'library', 'crossing', 'cones', 'statue', 'citybridge', 'parkgate'],
          th: { kind: 'city', night: true, stars: true, sky: ['#0d1533', '#2b3f6e'], moon: { x: 0.76, y: 100, r: 38 }, skyline: ['#1b2540', '#131c33'], walls: ['#3b4457', '#2f3a4e', '#44506a', '#37425a'], awnings: ['#7a3d3d', '#2f5a52', '#3d4f8a'], leaf: '#2b4a3a', pave: ['#6a6f78', '#525760'], road: ['#2f343b', '#22262b'], fog: '#3a4f70', fogA: 0.35, rays: false, fore: '#141a22' } }
    ];

    // ---------- scene layers (everything between the sky and the foreground; ctx comes from forest.js) ----------
    function layers(level, ctx) {
        const th = level.th, L = ctx.L, avoid = ctx.avoid, rng = ctx.rng, r = rng(101);
        const furniture = (() => { let s = '', x = 200; while (x < L(1) + 300) { if (!avoid.some(a => Math.abs(x - a) < 220)) { const k = r(); s += k < 0.35 ? lamp(x, th) : k < 0.7 ? planter(x, th) : k < 0.85 ? hydrant(x) : bench(x); } x += 320 + r() * 260; } return s; })();
        const park = th.park;
        const back = [
            { f: 0.12, s: skyline(L(0.12), 470, 21, th.skyline[0], rng), ph: true },
            { f: 0.2, s: skyline(L(0.2), 480, 33, th.skyline[1], rng), ph: true },
            { f: 0.38, s: park ? ctx.treeRow(L(0.38), 484, 70, 130, 60, 41, '#7fa58a', '#7fa58a', 0.3) : buildingRow(L(0.38), 486, 120, 260, 41, th, rng), ph: true },
            { f: 0.38, s: '<rect x="-400" y="400" width="' + (L(0.38) + 800) + '" height="110" fill="url(#gFog)" class="mist"/>' },
            { f: 0.62, s: park ? ctx.treeRow(L(0.62), 494, 130, 230, 95, 57, '#5f9e6a', '#5a4030', 0.2) : buildingRow(L(0.62), 494, 150, 320, 57, th, rng, null, true), ph: true },
            { f: 1, s: '<rect x="-400" y="470" width="' + (L(1) + 800) + '" height="40" fill="' + th.pave[0] + '"/><rect x="-400" y="504" width="' + (L(1) + 800) + '" height="6" fill="' + th.pave[1] + '"/><rect x="-400" y="510" width="' + (L(1) + 800) + '" height="100" fill="' + th.road[0] + '"/><rect x="-400" y="585" width="' + (L(1) + 800) + '" height="25" fill="' + th.road[1] + '"/>' + (park ? '' : (function () { let s = ''; for (let x = -400; x < L(1) + 800; x += 90) s += '<rect x="' + x + '" y="548" width="50" height="5" rx="2" fill="#d8d5cc" opacity="0.5"/>'; return s; })()) + furniture, id: 'L-near' }
        ];
        return { back, front: [] };
    }

    window.CityWorld = { OB, LEVELS, layers };
})();
