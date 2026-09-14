// Owner's "question order" choice from the admin panel (config/questionOrder), cached as kids_qorder by the home page
// and, inside a room, shared by the host as mp_qorder so every player shuffles the same way:
//   'ordered' (default) - curriculum rows in their Excel order, each child continues where they stopped
//   'term1' / 'term2'   - random questions of that term only (plus the class's general rows, which belong to no term)
//   'all'               - random questions from the whole class bank
// Which term a row belongs to: the "term" column of the Excel when it says 1 or 2; otherwise curriculum rows (those
// with an "order" number) are split in half by their order, and rows without any order number are general.
// Shared by the quiz engine (script.js), the forest (forest.js) and the runner (runner.js).
(function () {
  const MODES = /^(ordered|term1|term2|all)$/;
  const ok = v => MODES.test(v || '');
  const hasOrder = q => q && q.order !== undefined && q.order !== null && q.order !== '' && !isNaN(parseFloat(q.order));
  const termCol = q => { const t = parseInt(q && q.term); return t === 1 || t === 2 ? t : 0; };

  function mode(opts) {
    const inRoom = !(opts && opts.soloOnly) && localStorage.getItem('mp_roomCode');
    if (inRoom) { const m = localStorage.getItem('mp_qorder'); return ok(m) ? m : 'ordered'; }
    const m = localStorage.getItem('kids_qorder');
    return ok(m) ? m : 'ordered';
  }

  // Term of every item: 1, 2 or 0 (general, plays in both terms). Returned as a Map(item -> term).
  function terms(items) {
    const map = new Map();
    const ordered = items.filter(hasOrder).sort((a, b) => parseFloat(a.order) - parseFloat(b.order));
    const sheetHasTerms = items.some(termCol);
    const half = Math.ceil(ordered.length / 2);
    // a sheet with a "term" column decides for itself (rows left blank are general); without one, halves by order
    ordered.forEach((q, i) => map.set(q, sheetHasTerms ? termCol(q) : (i < half ? 1 : 2)));
    items.forEach(q => { if (!map.has(q)) map.set(q, termCol(q)); });
    return map;
  }

  // The items the current mode allows: everything for 'ordered' and 'all', one term (plus general rows) for term1/term2.
  function allowed(items, m) {
    m = ok(m) ? m : mode();
    if (m !== 'term1' && m !== 'term2') return items.slice();
    const want = m === 'term1' ? 1 : 2;
    const t = terms(items);
    return items.filter(q => { const k = t.get(q); return k === 0 || k === want; });
  }

  window.QOrder = { mode, terms, allowed, hasOrder, isMode: ok };
})();
