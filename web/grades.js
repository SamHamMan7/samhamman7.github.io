// Grades tab: reads Home Access Center through the user's own reader (hac-worker/), then shows
// classes with every assignment and category, what-if scores, other grading periods, the report
// card with semester averages, the transcript with HAC's GPA and rank, and a GPA calculator.
// The reader returns HAC's own pages; they are read here, in the browser, by column headings
// ("Assignment", "Score", "Category Weight", "Sem1"...), so layout differences between districts
// matter less. Everything is kept in this browser, per account.
window.SiteGrades = (() => {
  const root = document.getElementById('grades'); if (!root) return null;
  const P = window.Profile || { key: k => k, isOwner: true };
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const load = (k, f) => { try { return JSON.parse(localStorage.getItem(P.key(k))) ?? f; } catch { return f; } };
  const save = (k, v) => { try { localStorage.setItem(P.key(k), JSON.stringify(v)); } catch {} };
  const shared = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch { return ''; } };
  const secret = (v) => { const k = P.key('hac-pass'); try { if (v === undefined) return sessionStorage.getItem(k) || ''; v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch { return ''; } };
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const num = s => { const m = String(s ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; };
  const fmt = (n, d = 2) => n === null || n === undefined || !isFinite(n) ? '–' : String(Number(n.toFixed(d)));
  const letter = n => n === null ? '' : n >= 90 ? 'A' : n >= 80 ? 'B' : n >= 70 ? 'C' : 'F';

  // ---------- reading HAC pages ----------
  const parse = html => new DOMParser().parseFromString(html || '', 'text/html');
  function readTable(t) {
    const rows = [...t.rows];
    let hi = rows.findIndex(r => /header/i.test(r.className) || r.querySelector('th')); if (hi < 0) hi = 0;
    const head = rows[hi] ? [...rows[hi].cells].map(c => clean(c.textContent)) : [];
    const body = rows.slice(hi + 1).filter(r => !/header/i.test(r.className)).map(r => [...r.cells].map(c => clean(c.textContent))).filter(r => r.length >= 2 && r.some(Boolean));
    return { head, body };
  }
  const col = (head, re, not) => head.findIndex(h => re.test(h) && !(not && not.test(h)));
  function readAssignmentsPage(html) {
    const doc = parse(html), runSelect = doc.querySelector('select[name*="ReportCardRun" i], select[id*="ReportCardRun" i]');
    const runs = runSelect ? [...runSelect.options].map(o => ({ value: o.value, label: clean(o.textContent), selected: o.selected })) : [];
    const blocks = [...doc.querySelectorAll('.AssignmentClass')], classes = [];
    for (const block of blocks) {
      const header = block.querySelector('.sg-header') || block, link = header.querySelector('a') || header.querySelector('.sg-header-heading');
      const full = clean(link?.textContent), avgEl = header.querySelector('[id*="lblHdrAverage" i]') || [...header.querySelectorAll('.sg-header-heading')].find(e => e !== link);
      const c = { name: full.replace(/^[\w.]+\s*-\s*\d+\s+/, '') || 'Class', code: (full.match(/^[\w.]+\s*-\s*\d+/) || [''])[0], average: num(avgEl?.textContent), assignments: [], categories: [] };
      for (const t of block.querySelectorAll('table')) {
        const { head, body } = readTable(t);
        if (col(head, /assignment/i) >= 0 && col(head, /score/i) >= 0) {
          const i = { due: col(head, /due/i), assigned: col(head, /assigned/i), name: col(head, /assignment/i), cat: col(head, /category/i), score: col(head, /^score/i), total: col(head, /total|max/i, /weighted/i), weight: col(head, /^weight$/i), pct: col(head, /percent/i) };
          for (const r of body) c.assignments.push({ due: r[i.due] || '', assigned: r[i.assigned] || '', name: (r[i.name] || '').replace(/\s*\*+$/, ''), category: r[i.cat] || '', score: r[i.score] ?? '', total: num(r[i.total]), weight: i.weight >= 0 ? (num(r[i.weight]) ?? 1) : 1, percent: num(r[i.pct]) });
        } else if (col(head, /category/i) >= 0 && (col(head, /weight/i) >= 0 || col(head, /percent/i) >= 0)) {
          const i = { name: col(head, /category/i, /points|weight/i), pts: col(head, /student|earned/i), max: col(head, /max/i), pct: col(head, /percent/i), weight: col(head, /weight/i) };
          for (const r of body) { const name = r[i.name] || ''; if (!name || /^total/i.test(name)) continue; c.categories.push({ name, points: num(r[i.pts]), max: num(r[i.max]), percent: num(r[i.pct]), weight: num(r[i.weight]) }); }
        }
      }
      classes.push(c);
    }
    return { runs, classes };
  }
  function readReportCard(html) {
    const doc = parse(html), tables = [...doc.querySelectorAll('table')].map(readTable).filter(t => col(t.head, /course|description/i) >= 0 && t.body.length);
    return tables.sort((a, b) => b.body.length * b.head.length - a.body.length * a.head.length)[0] || null;
  }
  function readTranscript(html) {
    const doc = parse(html), groups = [], facts = [];
    let label = '';
    for (const t of doc.querySelectorAll('table')) {
      if (t.querySelector('table')) continue; // outer layout tables
      const { head, body } = readTable(t), text = clean(t.textContent);
      if (col(head, /description|course/i) >= 0 && (col(head, /credit/i) >= 0 || col(head, /sem|^s\d$/i) >= 0)) { groups.push({ label, head, body }); continue; }
      if (/year/i.test(text) && /grade/i.test(text) && t.rows.length <= 3) { label = [...t.rows].flatMap(r => [...r.cells].map(c => clean(c.textContent))).filter(Boolean).join(' · '); continue; }
      for (const r of [head, ...body]) for (let k = 0; k < r.length - 1; k++) if (/gpa|rank/i.test(r[k]) && num(r[k + 1]) !== null) facts.push({ label: r[k].replace(/[*:]+$/, '').trim(), value: r[k + 1] });
    }
    return { groups, facts: facts.filter((f, i) => facts.findIndex(g => g.label === f.label) === i) };
  }

  // ---------- averages and what-if ----------
  // HAC's rule: each category's percent is its weighted points over weighted possible points,
  // and the class average is those percents combined by category weight.
  function average(c, rows) {
    const byCat = new Map();
    for (const a of rows) { const s = num(a.score); if (s === null || !a.total) continue; const w = a.weight || 1, k = a.category || ''; const t = byCat.get(k) || { s: 0, t: 0 }; t.s += s * w; t.t += a.total * w; byCat.set(k, t); }
    const weights = new Map(c.categories.filter(x => x.weight).map(x => [x.name.toLowerCase(), x.weight]));
    if (weights.size) { let sum = 0, wsum = 0; for (const [k, t] of byCat) { const w = weights.get(k.toLowerCase()); if (!w || !t.t) continue; sum += t.s / t.t * 100 * w; wsum += w; } return wsum ? sum / wsum : null; }
    let s = 0, t = 0; for (const v of byCat.values()) { s += v.s; t += v.t; } return t ? s / t * 100 : null;
  }

  // ---------- GPA ----------
  const TYPES = { regular: 'Regular', honors: 'Honors / Pre-AP', ap: 'AP / Dual' };
  const guessType = name => /pre-?ap|honou?rs|\b(H|GT|adv)\b/i.test(name) ? 'honors' : /\b(AP|IB|dual|DC)\b/i.test(name) ? 'ap' : 'regular';
  const points = (grade, type, set) => grade === null ? null : grade >= 70 ? (grade >= 90 ? 4 : grade >= 80 ? 3 : 2) + (type === 'ap' ? set.ap : type === 'honors' ? set.honors : 0) : 0;
  function gpa(items, set) { let u = 0, w = 0, cr = 0; for (const it of items) { if (it.grade === null) continue; const c = it.credit || 1; u += points(it.grade, 'regular', set) * c; w += points(it.grade, it.type, set) * c; cr += c; } return cr ? { unweighted: u / cr, weighted: w / cr, credits: cr } : null; }

  // ---------- state, sync ----------
  let data = load('hac-data', null), view = null, openClass = null;
  const whatIf = new Map(); // class name -> { edits: Map(index -> score), extra: [] }
  const msg = $('gr-msg'), form = $('gr-form'), syncBtn = $('gr-sync'), runSel = $('gr-run');
  async function request(body) {
    const url = shared('hac-worker'); if (!/^https:\/\//.test(url)) throw Object.assign(new Error('Add your reader address first.'), { needForm: true });
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let out = {}; try { out = await res.json(); } catch {}
    if (!res.ok || !out.pages) { const e = new Error(out.error || (out.classes ? 'Your reader is the old version. Paste the new worker.js into Cloudflare.' : 'HAC sync failed.')); e.status = res.status; throw e; }
    return out;
  }
  async function sync({ run = '' } = {}, creds = null) {
    const user = creds?.user || load('hac-user', ''), pass = creds?.pass || secret();
    if (!user || !pass || !shared('hac-worker')) { showForm(); return false; }
    msg.textContent = run ? 'Opening that grading period…' : 'Signing in to HAC…'; msg.className = 'small gr-msg'; syncBtn.disabled = runSel.disabled = true;
    try {
      const out = await request({ user, pass, want: run ? 'run' : 'all', run }), work = readAssignmentsPage(out.pages.assignments);
      if (!work.classes.length) throw new Error('Signed in, but no classes were found on the grades page.');
      if (run) view = { ...work, fetchedAt: out.fetchedAt, run };
      else {
        data = { ...work, fetchedAt: out.fetchedAt, reportCard: out.pages.reportCard ? readReportCard(out.pages.reportCard) : data?.reportCard || null, transcript: out.pages.transcript ? readTranscript(out.pages.transcript) : data?.transcript || null };
        save('hac-data', data); view = null;
        // the Home panel's short list follows the current grading period
        save('dash-grades', data.classes.map(c => [c.name, c.average === null ? '' : String(c.average)])); save('dash-grades-at', data.fetchedAt);
        window.dispatchEvent(new Event('grades-changed'));
      }
      if (creds) { save('hac-user', user); if (creds.keep) secret(pass); }
      msg.textContent = ''; whatIf.clear(); draw(); return true;
    } catch (e) {
      if (e.needForm) showForm(); if (e.status === 401) secret(null);
      msg.textContent = navigator.onLine === false ? 'You’re offline. Showing your last sync.' : e.message === 'Failed to fetch' ? 'Couldn’t reach your reader. Check its address.' : e.message; msg.className = 'small gr-msg bad'; return false;
    } finally { syncBtn.disabled = runSel.disabled = false; }
  }
  function showForm() { form.hidden = false; $('gr-url').value = shared('hac-worker'); $('gr-user').value = load('hac-user', ''); ($('gr-url').value ? $('gr-user').value ? $('gr-pass') : $('gr-user') : $('gr-url')).focus(); }
  form.addEventListener('submit', async e => { e.preventDefault(); shared('hac-worker', $('gr-url').value.trim()); const ok = await sync({}, { user: $('gr-user').value.trim(), pass: $('gr-pass').value, keep: $('gr-keep').checked }); if (ok) form.hidden = true; $('gr-pass').value = ''; });
  syncBtn.addEventListener('click', () => sync());
  $('gr-signin').addEventListener('click', () => form.hidden ? showForm() : (form.hidden = true));
  runSel.addEventListener('change', () => { const current = (data?.runs || []).find(r => r.selected)?.value; if (!runSel.value || runSel.value === current) { view = null; draw(); } else sync({ run: runSel.value }); });

  // ---------- drawing ----------
  const tag = n => { const t = el('span', 'grade-tag' + (n === null ? '' : ' g-' + letter(n)), letter(n)); return t; };
  function classCard(c) {
    const card = el('button', 'gr-class' + (openClass === c.name ? ' open' : '')); card.type = 'button'; card.setAttribute('aria-expanded', String(openClass === c.name));
    const proj = projected(c), shown = proj ?? c.average;
    const top = el('span', 'gr-class-top'); top.append(el('span', 'gr-class-name', c.name), tag(shown));
    const n = el('span', 'gr-class-avg', c.average === null ? '–' : fmt(c.average));
    if (proj !== null && Math.abs(proj - (c.average ?? 0)) > .004) n.append(el('small', proj > (c.average ?? 0) ? 'up' : 'down', ` → ${fmt(proj)}`));
    card.append(top, n, el('span', 'gr-class-sub', `${c.assignments.filter(a => num(a.score) !== null).length} graded · ${c.categories.map(x => `${x.name.replace(/\s*grades?$/i, '')} ${x.weight ? fmt(x.weight, 0) + '%' : ''}`).join(' · ')}`));
    card.addEventListener('click', () => { openClass = openClass === c.name ? null : c.name; draw(); document.getElementById('gr-detail')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    return card;
  }
  function wi(c) { if (!whatIf.has(c.name)) whatIf.set(c.name, { edits: new Map(), extra: [] }); return whatIf.get(c.name); }
  function rowsWith(c) { const w = whatIf.get(c.name); if (!w) return c.assignments; return [...c.assignments.map((a, i) => w.edits.has(i) ? { ...a, score: w.edits.get(i) } : a), ...w.extra]; }
  function projected(c) { const w = whatIf.get(c.name); if (!w || (!w.edits.size && !w.extra.length)) return null; const base = average(c, c.assignments), next = average(c, rowsWith(c)); if (next === null) return null; return c.average !== null && base !== null ? c.average + (next - base) : next; }
  function detail(c) {
    const box = el('section', 'panel gr-detail'); box.id = 'gr-detail';
    const head = el('div', 'gr-detail-head'); head.append(el('h2', '', c.name)); const close = el('button', 'task-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.addEventListener('click', () => { openClass = null; draw(); }); head.append(close); box.append(head);
    const proj = projected(c), stats = el('div', 'gr-stats');
    const stat = (label, value, cls = '') => { const s = el('div', 'gr-stat ' + cls); s.append(el('strong', '', value), el('span', '', label)); return s; };
    stats.append(stat('HAC average', c.average === null ? '–' : fmt(c.average)));
    if (proj !== null) stats.append(stat('What-if average', fmt(proj), proj >= (c.average ?? 0) ? 'up' : 'down'));
    for (const k of c.categories) stats.append(stat(`${k.name}${k.weight ? ` · ${fmt(k.weight, 0)}%` : ''}`, k.percent === null ? '–' : fmt(k.percent) + '%'));
    box.append(stats);
    const w = wi(c), table = el('table', 'gr-table'), thead = el('thead'), tbody = el('tbody'), hr = el('tr');
    for (const [h, k] of [['Due', 'gr-date'], ['Assignment', 'gr-name'], ['Category', 'gr-cat'], ['Score', 'gr-score'], ['Out of', 'gr-out'], ['%', 'gr-pct']]) hr.append(el('th', k, h)); thead.append(hr);
    c.assignments.forEach((a, i) => {
      const tr = el('tr'), input = el('input'), edited = w.edits.has(i);
      input.type = 'text'; input.inputMode = 'decimal'; input.value = edited ? w.edits.get(i) : a.score; input.setAttribute('aria-label', `Score for ${a.name}`); input.className = edited ? 'edited' : '';
      input.addEventListener('change', () => { const v = input.value.trim(); if (v === String(a.score)) w.edits.delete(i); else w.edits.set(i, v); draw(); });
      const s = num(edited ? w.edits.get(i) : a.score), pct = s !== null && a.total ? s / a.total * 100 : a.percent;
      const cell = el('td', 'gr-score'); cell.append(input);
      tr.append(el('td', 'gr-date', a.due.replace(/\/\d{4}$/, '')), el('td', 'gr-name', a.name), el('td', 'gr-cat', a.category), cell, el('td', 'gr-out', a.total === null ? '' : fmt(a.total)), el('td', 'gr-pct', pct === null ? '' : fmt(pct, 0)));
      if (pct !== null) tr.classList.add('g-row-' + letter(pct)); tbody.append(tr);
    });
    w.extra.forEach((a, i) => { const tr = el('tr', 'gr-extra'), x = el('button', 'task-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Remove what-if'); x.addEventListener('click', () => { w.extra.splice(i, 1); draw(); }); const nameCell = el('td', 'gr-name', a.name); nameCell.append(x); const s = num(a.score); tr.append(el('td', 'gr-date', 'what-if'), nameCell, el('td', 'gr-cat', a.category), el('td', 'gr-score', a.score), el('td', 'gr-out', fmt(a.total)), el('td', 'gr-pct', s !== null && a.total ? fmt(s / a.total * 100, 0) : '')); tbody.append(tr); });
    table.append(thead, tbody); const wrap = el('div', 'gr-table-wrap'); wrap.append(table); box.append(wrap);
    if (!c.assignments.length) box.append(el('p', 'muted', 'No assignments listed for this grading period.'));
    // add a what-if assignment
    const add = el('form', 'gr-add'), cat = el('select'), sc = el('input'), tot = el('input'), go = el('button', '', 'Add what-if'), reset = el('button', 'linkish', 'Reset what-if');
    for (const k of (c.categories.length ? c.categories.map(x => x.name) : [...new Set(c.assignments.map(a => a.category))])) cat.append(new Option(k, k));
    cat.setAttribute('aria-label', 'Category'); sc.placeholder = 'Score'; tot.placeholder = 'Out of'; tot.value = '100'; sc.inputMode = tot.inputMode = 'decimal'; sc.setAttribute('aria-label', 'What-if score'); tot.setAttribute('aria-label', 'Out of'); go.type = 'submit'; reset.type = 'button';
    add.addEventListener('submit', e => { e.preventDefault(); const s = num(sc.value), t = num(tot.value); if (s === null || !t) return; w.extra.push({ name: 'What-if', category: cat.value, score: String(s), total: t, weight: 1 }); draw(); });
    reset.addEventListener('click', () => { whatIf.delete(c.name); draw(); });
    add.append(cat, sc, tot, go, reset); box.append(add, el('p', 'small muted', 'Change any score or add a pretend one to see what your average would become. Nothing here is sent anywhere.'));
    return box;
  }
  function genericTable(t, highlight) {
    const table = el('table', 'gr-table gr-generic'), thead = el('thead'), tbody = el('tbody'), hr = el('tr');
    // empty columns (grading periods not reached yet) are left out; only grade columns are coloured
    const keep = t.head.map((h, i) => i).filter(i => t.body.some(r => r[i])), gradeCol = i => /^\d(st|nd|rd|th)$|exam|sem|^s\d|avg|average|grade/i.test(t.head[i] || '') && !/grade level/i.test(t.head[i] || '');
    for (const i of keep) { const th = el('th', highlight?.test(t.head[i]) ? 'hl' : '', t.head[i]); hr.append(th); } thead.append(hr);
    for (const r of t.body) { const tr = el('tr'); for (const i of keep) { const v = r[i] ?? '', n = num(v), td = el('td', (highlight?.test(t.head[i]) ? 'hl ' : '') + (gradeCol(i) && n !== null && /^\s*-?\d+(\.\d+)?\s*%?$/.test(v) ? 'n g-txt-' + letter(n) : ''), v); tr.append(td); } tbody.append(tr); }
    table.append(thead, tbody); const wrap = el('div', 'gr-table-wrap'); wrap.append(table); return wrap;
  }
  function gpaPanel() {
    const set = Object.assign({ honors: .5, ap: 1, types: {}, transcript: true }, load('gpa-settings', {}));
    const persist = () => { save('gpa-settings', set); drawGpa(); };
    const box = $('gr-gpa'); box.replaceChildren();
    const current = (data?.classes || []).filter(c => c.average !== null).map(c => ({ name: c.name, grade: c.average, credit: 1, type: set.types[c.name] || guessType(c.name) }));
    const past = [];
    for (const g of data?.transcript?.groups || []) {
      const semCols = g.head.map((h, i) => /^(sem|s)\s*\d|semester|^[12]$/i.test(h) ? i : -1).filter(i => i >= 0), d = col(g.head, /description/i) >= 0 ? col(g.head, /description/i) : col(g.head, /course/i);
      for (const r of g.body) for (const i of semCols) { const n = num(r[i]); if (n === null || n > 110) continue; const name = r[d] || ''; past.push({ name, grade: n, credit: .5, type: set.types[name] || guessType(name) }); }
    }
    const result = el('div', 'gr-gpa-out');
    function drawGpa() {
      result.replaceChildren();
      const now = gpa(current, set), all = set.transcript && past.length ? gpa([...past, ...current.map(c => ({ ...c, credit: .5 }))], set) : null;
      const card = (title, g, note) => { const d = el('div', 'gr-gpa-card'); d.append(el('span', 'gr-gpa-title', title)); if (!g) { d.append(el('strong', '', '–')); return d; } const row = el('div', 'gr-gpa-row'); for (const [k, v] of [['Weighted', g.weighted], ['Unweighted', g.unweighted]]) { const s = el('div'); s.append(el('strong', '', v.toFixed(2)), el('span', '', k)); row.append(s); } d.append(row); if (note) d.append(el('span', 'small muted', note)); return d; };
      result.append(card('This grading period', now, `${current.length} classes`));
      if (past.length) result.append(card('Cumulative estimate', all, set.transcript ? `${past.length} transcript semesters + this period` : 'Turn on transcript below'));
      for (const f of data?.transcript?.facts || []) { const d = el('div', 'gr-gpa-card official'); d.append(el('span', 'gr-gpa-title', 'From HAC · ' + f.label), el('strong', '', f.value)); result.append(d); }
    }
    const list = el('div', 'gr-gpa-classes');
    for (const c of current) { const r = el('label', 'gr-gpa-class'), s = el('select'); for (const [k, v] of Object.entries(TYPES)) s.append(new Option(v, k, false, c.type === k)); s.addEventListener('change', () => { set.types[c.name] = s.value; c.type = s.value; persist(); }); r.append(el('span', '', c.name), el('span', 'gr-gpa-grade', fmt(c.grade)), s); list.append(r); }
    const opts = el('div', 'gr-gpa-opts'), hon = el('input'), ap = el('input'), tr = el('input');
    hon.type = ap.type = 'number'; hon.step = ap.step = '0.1'; hon.min = ap.min = '0'; hon.max = ap.max = '2'; hon.value = set.honors; ap.value = set.ap; tr.type = 'checkbox'; tr.checked = set.transcript;
    hon.addEventListener('change', () => { set.honors = Math.max(0, Math.min(2, +hon.value || 0)); persist(); }); ap.addEventListener('change', () => { set.ap = Math.max(0, Math.min(2, +ap.value || 0)); persist(); }); tr.addEventListener('change', () => { set.transcript = tr.checked; persist(); });
    const l1 = el('label'), l2 = el('label'), l3 = el('label', 'profile-check'); l1.append('Honors bonus +', hon); l2.append('AP bonus +', ap); l3.append(tr, 'Include transcript in the cumulative estimate'); opts.append(l1, l2); if (past.length) opts.append(l3);
    box.append(result, list, opts, el('p', 'small muted', 'Estimate on a 4.0 scale (90+ A = 4, 80s B = 3, 70s C = 2, below 70 = 0) plus the bonus for weighted classes. Your school’s official GPA, when HAC shows it, is in the “From HAC” box and on the transcript.'));
    drawGpa();
  }
  function draw() {
    const has = !!data?.classes?.length, show = view || data;
    $('gr-empty').hidden = has; $('gr-body').hidden = !has;
    $('gr-when').textContent = data?.fetchedAt ? `Synced ${new Date(data.fetchedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : '';
    syncBtn.hidden = !(load('hac-user', '') && shared('hac-worker')); $('gr-signin').textContent = syncBtn.hidden ? 'Connect HAC' : 'Change login';
    if (!has) return;
    runSel.replaceChildren(...(data.runs || []).map(r => new Option(r.label, r.value, false, view ? r.value === view.run : r.selected))); runSel.hidden = !(data.runs || []).length;
    $('gr-run-note').textContent = view ? 'Past grading period (what-if and GPA use the current one).' : '';
    const grid = $('gr-classes'); grid.replaceChildren(...show.classes.map(classCard));
    const open = show.classes.find(c => c.name === openClass); $('gr-detail-slot').replaceChildren(...(open ? [detail(open)] : []));
    const rc = data.reportCard; $('gr-report').replaceChildren(...(rc ? [genericTable(rc, /^(sem|s)\s*\d|semester|exam/i)] : [el('p', 'muted', 'HAC didn’t return a report card.')]));
    const tr = data.transcript, tbox = $('gr-transcript'); tbox.replaceChildren();
    if (tr?.facts?.length) { const f = el('div', 'gr-facts'); for (const x of tr.facts) { const d = el('div', 'gr-stat'); d.append(el('strong', '', x.value), el('span', '', x.label)); f.append(d); } tbox.append(f); }
    for (const g of tr?.groups || []) { const d = el('details', 'gr-year'); d.append(el('summary', '', g.label || 'Courses'), genericTable(g, /^(sem|s)\s*\d|semester/i)); tbox.append(d); }
    if (!tbox.children.length) tbox.append(el('p', 'muted', 'HAC didn’t return a transcript.'));
    gpaPanel();
  }
  draw();
  return { sync, open: () => { location.hash = '#grades'; if (!syncBtn.hidden) sync(); else showForm(); }, readAssignmentsPage, readReportCard, readTranscript, average };
})();
