// Generates 100 "compare two 2-digit numbers" questions (>, <, =) for grade 2 (kids_2) and appends them
// to data/kids_2.zip through append-questions.js (existing questions are updated, never duplicated).
// Deterministic (seeded), so re-running produces the same 100 questions.
// Usage: node scripts/add-compare-questions.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const AR = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const TYPE = 'رياضيات - ثاني ابتدائي';
const FIRST_ORDER = 900; // after the last existing maths question (889)

// Small seeded RNG so the bank is stable between runs
let seed = 20260906;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const tens = n => Math.floor(n / 10), units = n => n % 10;
function whyCompare(a, b) {
    if (a === b) return `العددان متساويان: ${AR(a)} = ${AR(b)}`;
    const [big, small] = a > b ? [a, b] : [b, a];
    const sign = a > b ? '>' : '<';
    if (tens(a) !== tens(b)) return `ننظر إلى العشرات أولاً: ${AR(big)} فيه ${AR(tens(big))} عشرات و${AR(small)} فيه ${AR(tens(small))} عشرات، فـ ${AR(big)} أكبر. إذن ${AR(a)} ${sign} ${AR(b)}`;
    return `العشرات متساوية (${AR(tens(a))})، فننظر إلى الآحاد: ${AR(units(big))} أكبر من ${AR(units(small))}، فـ ${AR(big)} أكبر. إذن ${AR(a)} ${sign} ${AR(b)}`;
}

const out = [];
const seen = new Set();
// The bank identifies a question by its text, so every one of the 100 needs a distinct text
const add = q => { if (seen.has(q.question)) return false; seen.add(q.question); out.push(q); return true; };

// ---- A) 40 × "which sign?"  a ▢ b  (8 equal pairs, 12 same-tens pairs, 6 swapped-digit pairs, 14 free) ----
const pairsA = [];
const pairKeys = new Set();
const pushPair = (a, b) => { const k = a + '|' + b; if (pairKeys.has(k)) return; pairKeys.add(k); pairsA.push([a, b]); };
while (pairsA.length < 8) { const a = int(10, 99); pushPair(a, a); }
while (pairsA.length < 20) { const t = int(1, 9), u1 = int(0, 9), u2 = int(0, 9); if (u1 !== u2) pushPair(t * 10 + u1, t * 10 + u2); }
while (pairsA.length < 26) { const t = int(1, 9), u = int(1, 9); if (t !== u) pushPair(t * 10 + u, u * 10 + t); }
while (pairsA.length < 40) { const a = int(10, 99), b = int(10, 99); if (a !== b) pushPair(a, b); }
shuffle(pairsA).forEach(([a, b]) => {
    const sign = a > b ? '>' : a < b ? '<' : '=';
    const correct = `${AR(a)} ${sign} ${AR(b)}`;
    const wrong = ['>', '<', '='].filter(s => s !== sign).map(s => `${AR(a)} ${s} ${AR(b)}`);
    // fourth choice: a reversed statement that is also false
    wrong.push(a === b ? `${AR(a)} = ${AR(a + (a < 99 ? 1 : -1))}` : (a > b ? `${AR(b)} > ${AR(a)}` : `${AR(b)} < ${AR(a)}`));
    const [c1, c2, c3, c4] = shuffle([correct].concat(wrong));
    add({ question: `ما العلامة المناسبة؟  ${AR(a)} ▢ ${AR(b)}`, choice1: c1, choice2: c2, choice3: c3, choice4: c4, correct_answer: correct,
        explanation: 'مقارنة · ' + whyCompare(a, b), type: TYPE, subject: 'math', term: 1 });
});

// ---- B) 20 × "which number is greater than N?" / C) 20 × "which number is smaller than N?" ----
function around(n, greater) {
    // one correct number on the asked side, three distractors on the other side (or equal), all two-digit and distinct
    const set = new Set([n]);
    const take = (lo, hi) => { for (let k = 0; k < 200; k++) { const v = int(lo, hi); if (!set.has(v)) { set.add(v); return v; } } return null; };
    const good = greater ? take(n + 1, 99) : take(10, n - 1);
    const bads = [];
    while (bads.length < 3) { const v = greater ? take(10, n) : take(n, 99); if (v !== null) bads.push(v); }
    if (!bads.includes(n) && rnd() < 0.5) bads[0] = n; // the number itself is a classic trap ("greater than" is not "equal")
    return { good, bads: Array.from(new Set(bads)) };
}
let made = 0;
while (made < 20) {
    const n = int(20, 89); const { good, bads } = around(n, true); if (bads.length < 3) continue;
    const [c1, c2, c3, c4] = shuffle([good].concat(bads)).map(AR);
    if (add({ question: `أي عدد أكبر من ${AR(n)}؟`, choice1: c1, choice2: c2, choice3: c3, choice4: c4, correct_answer: AR(good),
        explanation: `مقارنة · ${whyCompare(good, n)}`, type: TYPE, subject: 'math', term: 1 })) made++;
}
made = 0;
while (made < 20) {
    const n = int(20, 89); const { good, bads } = around(n, false); if (bads.length < 3) continue;
    const [c1, c2, c3, c4] = shuffle([good].concat(bads)).map(AR);
    if (add({ question: `أي عدد أصغر من ${AR(n)}؟`, choice1: c1, choice2: c2, choice3: c3, choice4: c4, correct_answer: AR(good),
        explanation: `مقارنة · ${whyCompare(good, n)}`, type: TYPE, subject: 'math', term: 1 })) made++;
}

// ---- D) 10 × "the biggest of these" + 10 × "the smallest of these" ----
function fourDistinct(sameTens) {
    const set = new Set();
    const t = int(1, 9);
    while (set.size < 4) set.add(sameTens ? t * 10 + int(0, 9) : int(10, 99));
    return Array.from(set);
}
for (const biggest of [true, false]) {
    made = 0;
    while (made < 10) {
        const nums = fourDistinct(made % 2 === 0); // half the sets share the tens digit, so the units decide
        const ans = biggest ? Math.max(...nums) : Math.min(...nums);
        const [c1, c2, c3, c4] = shuffle(nums).map(AR);
        const sorted = nums.slice().sort((x, y) => x - y).map(AR).join(' ، ');
        const listed = [c1, c2, c3, c4].join(' ، ');
        if (add({ question: (biggest ? 'ما أكبر عدد من هذه الأعداد: ' : 'ما أصغر عدد من هذه الأعداد: ') + listed + '؟', choice1: c1, choice2: c2, choice3: c3, choice4: c4, correct_answer: AR(ans),
            explanation: `مقارنة · نرتّب الأعداد من الأصغر إلى الأكبر: ${sorted}، ف${biggest ? 'أكبرها' : 'أصغرها'} ${AR(ans)}`, type: TYPE, subject: 'math', term: 1 })) made++;
    }
}

if (out.length !== 100) throw new Error('expected 100 questions, got ' + out.length);
out.forEach((q, i) => { q.order = FIRST_ORDER + i; });

const tmp = path.join(os.tmpdir(), 'kids2-compare-questions.json');
fs.writeFileSync(tmp, JSON.stringify(out));
console.log(execFileSync('node', [path.join(__dirname, 'append-questions.js'), 'kids_2', tmp], { encoding: 'utf8' }).trim());
