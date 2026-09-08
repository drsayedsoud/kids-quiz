// Opening screen for children (home page only, once per app open): the icon pops in, a few stars twinkle,
// the child is greeted by name, and one big "let's play" button starts the welcome chime and the spoken greeting.
// Pure CSS/SVG animation (no Lottie file or library), so it works offline and stays light on old phones.
(function () {
    if (!/(^\/$|index\.html$)/.test(location.pathname.toLowerCase())) return;
    try { if (sessionStorage.getItem('kids_splash_seen')) return; } catch (e) { /* storage blocked: show it anyway */ }
    if (new URLSearchParams(location.search).get('nosplash') === '1') return;
    let standalone = false;
    try { standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}

    function childName() {
        try {
            const card = JSON.parse(localStorage.getItem('gbCard') || 'null');
            return String((card && card.name) || localStorage.getItem('mp_playerName') || localStorage.getItem('piggyName') || '').trim();
        } catch (e) { return ''; }
    }
    const greeting = name => (name ? 'أهلاً يا ' + name : 'أهلاً يا بطل') + '، هيا نلعب ونتعلم';

    // Installed as an app: the phone already showed its own opening screen (icon + name from the manifest), a second
    // one that waits for a tap would be a double welcome, so the page opens straight away. The child is still greeted
    // by name: a small welcome bubble, the chime and the spoken greeting play at once when the phone allows sound on
    // open (installed apps usually do), otherwise on the first tap anywhere.
    if (standalone) {
        const run = () => {
            try { if (sessionStorage.getItem('kids_splash_seen')) return; sessionStorage.setItem('kids_splash_seen', '1'); } catch (e) {}
            const name = childName();
            if (window.UI && UI.toast) UI.toast((name ? 'أهلاً يا ' + name : 'أهلاً يا بطل') + '! هيا نلعب 👋', { type: 'ok', ms: 3500 });
            if (!window.KidsTheme) return;
            let done = false;
            const greet = () => {
                if (done) return Promise.resolve(true);
                done = true;
                KidsTheme.play('tada');
                return KidsTheme.readEnabled() ? KidsTheme.speak(greeting(name)) : Promise.resolve(true);
            };
            const EVS = ['pointerdown', 'touchstart', 'keydown'];
            const onTap = () => { EVS.forEach(ev => document.removeEventListener(ev, onTap)); done = false; greet(); };
            const tryNow = () => greet().then(ok => { if (!ok) EVS.forEach(ev => document.addEventListener(ev, onTap, { passive: true })); });
            // voices load lazily on some phones: give them a moment, then greet
            if ('speechSynthesis' in window && !speechSynthesis.getVoices().length) {
                let fired = false; const go = () => { if (!fired) { fired = true; tryNow(); } };
                speechSynthesis.addEventListener('voiceschanged', go, { once: true }); setTimeout(go, 1200);
            } else setTimeout(tryNow, 400);
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
        return;
    }

    const css = `
    #kids-splash { position: fixed; inset: 0; z-index: 10060; display: flex; align-items: center; justify-content: center; direction: rtl; font-family: 'Cairo', sans-serif;
        background: linear-gradient(180deg, #5db4ff 0%, #9bd6ff 45%, #e9f6ff 100%); color: #2b3550; overflow: hidden; animation: splashIn 0.4s ease-out; }
    #kids-splash.out { animation: splashOut 0.45s ease-in forwards; pointer-events: none; }
    #kids-splash .hill { position: absolute; left: -10%; right: -10%; bottom: -12vh; height: 34vh; border-radius: 50% 50% 0 0; background: #cde9c0; }
    #kids-splash .hill.b { bottom: -18vh; height: 30vh; left: 30%; right: -30%; background: #b7dfa7; }
    #kids-splash .sun { position: absolute; top: 7vh; inset-inline-end: 8vw; width: 64px; height: 64px; border-radius: 50%; background: #ffd66b; box-shadow: 0 0 0 14px rgba(255,214,107,0.25), 0 0 0 30px rgba(255,214,107,0.12); animation: sunUp 1.2s ease-out both; }
    #kids-splash .cloud { position: absolute; width: 110px; height: 36px; border-radius: 999px; background: rgba(255,255,255,0.9); opacity: 0; animation: cloudIn 1s ease-out 0.3s both; }
    #kids-splash .cloud::before { content: ''; position: absolute; left: 22px; top: -18px; width: 44px; height: 44px; border-radius: 50%; background: inherit; }
    #kids-splash .cloud.c1 { top: 12vh; left: 8vw; } #kids-splash .cloud.c2 { top: 22vh; right: 14vw; width: 80px; animation-delay: 0.55s; }
    #kids-splash .box { position: relative; text-align: center; padding: 0 20px; width: 100%; max-width: 420px; }
    #kids-splash .logo { width: 132px; height: 132px; border-radius: 34px; box-shadow: 0 16px 34px rgba(43,53,80,0.25); animation: logoPop 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) 0.15s both, logoFloat 3.2s ease-in-out 1s infinite; }
    #kids-splash .star { position: absolute; font-size: 1.6em; opacity: 0; animation: starPop 0.9s ease-out both; }
    #kids-splash .star.s1 { top: -6px; left: 14%; animation-delay: 0.7s; }
    #kids-splash .star.s2 { top: 30px; right: 12%; animation-delay: 0.9s; font-size: 1.2em; }
    #kids-splash .star.s3 { top: 110px; left: 22%; animation-delay: 1.1s; font-size: 1.1em; }
    #kids-splash .star.s4 { top: 96px; right: 20%; animation-delay: 1.25s; }
    #kids-splash h1 { margin: 22px 0 4px; font-size: 1.55em; font-weight: 900; color: #fff; text-shadow: 0 3px 0 rgba(0,0,0,0.12), 0 8px 18px rgba(0,0,0,0.18); animation: riseIn 0.6s ease-out 0.5s both; }
    #kids-splash .hi { margin: 0 0 22px; font-size: 1.25em; font-weight: 900; color: #2b3550; background: rgba(255,255,255,0.85); display: inline-block; padding: 6px 18px; border-radius: 999px; animation: riseIn 0.6s ease-out 0.75s both; }
    #kids-splash .go { display: block; width: 100%; min-height: 66px; border: 3px solid #fff; border-radius: 999px; padding: 14px 20px; background: linear-gradient(135deg, #43e2a0, #22b57a); color: #fff; font-family: inherit; font-size: 1.5em; font-weight: 900; cursor: pointer;
        box-shadow: 0 6px 0 #17925f, 0 14px 28px rgba(34,181,122,0.35); animation: riseIn 0.6s ease-out 1.1s both, goPulse 2.2s ease-in-out 2s infinite; }
    #kids-splash .go:active { transform: translateY(4px); box-shadow: 0 2px 0 #17925f; }
    #kids-splash .skip { margin-top: 14px; background: none; border: none; color: #3f5a86; font-family: inherit; font-weight: 800; font-size: 0.9em; cursor: pointer; opacity: 0.8; animation: riseIn 0.6s ease-out 1.5s both; }
    @keyframes splashIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes splashOut { to { opacity: 0; transform: scale(1.04); } }
    @keyframes logoPop { from { transform: scale(0.2) rotate(-12deg); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
    @keyframes starPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.35); opacity: 1; } 100% { transform: scale(1); opacity: 0.9; } }
    @keyframes riseIn { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes sunUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes cloudIn { from { transform: translateX(-30px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes goPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
    @media (prefers-reduced-motion: reduce) { #kids-splash *, #kids-splash { animation-duration: 0.01s !important; animation-iteration-count: 1 !important; } }`;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function mount() {
        const name = childName();
        const hi = name ? 'أهلاً يا ' + name + '! 👋' : 'أهلاً يا بطل! 👋';
        const el = document.createElement('div');
        el.id = 'kids-splash';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'شاشة الترحيب');
        el.innerHTML =
            '<div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="hill"></div><div class="hill b"></div>' +
            '<div class="box">' +
            '<span class="star s1">⭐</span><span class="star s2">✨</span><span class="star s3">🌟</span><span class="star s4">⭐</span>' +
            '<img class="logo" src="assets/icon-512.png" alt="">' +
            '<h1>بطل المستقبل</h1>' +
            '<div class="hi">' + esc(hi) + '</div>' +
            '<button type="button" class="go">🚀 هيا نلعب!</button>' +
            '<button type="button" class="skip">تخطّي</button>' +
            '</div>';
        (document.body || document.documentElement).appendChild(el);

        let done = false;
        const close = () => {
            if (done) return;
            done = true;
            try { sessionStorage.setItem('kids_splash_seen', '1'); } catch (e) {}
            el.classList.add('out');
            setTimeout(() => el.remove(), 480);
        };
        window.closeKidsSplash = close;

        el.querySelector('.go').onclick = () => {
            // The tap is the user gesture browsers need before any sound can play
            if (window.KidsTheme) {
                KidsTheme.play('tada');
                KidsTheme.burst(window.innerWidth / 2, window.innerHeight * 0.4, 16);
                if (KidsTheme.readEnabled() && 'speechSynthesis' in window) {
                    setTimeout(() => KidsTheme.speak(greeting(name)), 350);
                }
            }
            setTimeout(close, 650);
        };
        el.querySelector('.skip').onclick = close;
        // Never keep a parent waiting: the screen leaves by itself after a while (silently, since there was no tap)
        setTimeout(close, 9000);
    }

    // Mounted right away (the script runs in <head>, so on <html> until <body> exists): the page must never show for a
    // moment before the welcome screen covers it
    mount();
})();
