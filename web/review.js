// Game review: replays a finished Champions VGC game in the bot's worker and shows what
// Discharge would have played in the player's seat at every decision. Original code for
// this site; runs fully on this device.
(() => {
  const KEY = 'offline-showdown-games';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const SVG = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}, text) => { const x = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v); if (text !== undefined) x.textContent = text; return x; };
  const pct = v => (Math.round(v) + '%');
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(g => g && g.id && g.record) : []; } catch { return []; } };
  const save = games => { try { localStorage.setItem(KEY, JSON.stringify(games)); } catch { /* storage full or blocked: the review still shows */ } };
  const species = packed => String(packed || '').split(']').map(set => { const f = set.split('|'); return f[1] || f[0]; }).filter(Boolean);

  let games = load(), worker = null, current = null, steps = [];

  function listGames() {
    const list = $('rv-games'); list.replaceChildren(); $('rv-empty').hidden = games.length > 0;
    for (const g of games) {
      const li = el('li'), b = el('button'); b.type = 'button'; b.setAttribute('aria-current', String(current?.id === g.id));
      b.append(el('span', 'tag ' + (g.result === 'win' ? 'win' : g.result === 'loss' ? 'loss' : ''), g.result === 'win' ? 'Win' : g.result === 'loss' ? 'Loss' : 'Tie'));
      b.append(el('strong', '', new Date(g.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })));
      b.append(el('span', 'team', species(g.record.p1).join(', ') + ' vs ' + species(g.record.p2).join(', ')));
      if (g.review) b.append(el('span', 'tag', 'Reviewed'));
      b.addEventListener('click', () => open(g)); li.append(b); list.append(li);
    }
  }

  // Short plain-language recap of what the player saw between two decisions.
  function recap(lines) {
    const name = s => String(s || '').replace(/^p1[a-d]?: /, 'Your ').replace(/^p2[a-d]?: /, 'Their '), out = [];
    for (const line of lines) {
      const p = line.split('|');
      if (p[1] === 'move') out.push(`${name(p[2])} used ${p[3]}`);
      else if (p[1] === 'switch' || p[1] === 'drag') out.push(`${/^p1/.test(p[2]) ? 'You' : 'They'} sent out ${p[3].split(',')[0]}`);
      else if (p[1] === 'faint') out.push(`${name(p[2])} fainted`);
      else if (p[1] === 'detailschange' && /-Mega/.test(p[3])) out.push(`${name(p[2])} Mega Evolved`);
      else if (p[1] === 'cant') out.push(`${name(p[2])} could not move`);
      else if (p[1] === '-crit') out.push('A critical hit');
      else if (p[1] === '-miss') out.push(`${name(p[2])} missed`);
    }
    return out;
  }

  function stepCard(s) {
    const box = el('section', 'rv-box rv-step'); box.id = 'rv-step-' + s.n;
    const head = el('div', 'rv-head'), title = s.kind === 'preview' ? 'Team preview' : s.kind === 'replace' ? `Turn ${s.turn}: replacement` : `Turn ${s.turn}`;
    head.append(el('h3', '', title));
    if (s.board?.yours?.length) head.append(el('span', 'rv-board', `${s.board.yours.join(' + ')} vs ${s.board.theirs.join(' + ')}`));
    box.append(head);
    const pick = el('dl', 'rv-pick'), row = (label, text, chance) => { pick.append(el('dt', '', label), el('dd', '', text), el('dd', 'pc', chance === undefined ? '' : pct(chance))); };
    row('You played', s.yours.label, s.yours.chance);
    if (s.bot && !s.same) row(s.kind === 'preview' ? 'Discharge would bring' : 'Discharge would play', s.bot.label, s.bot.chance);
    box.append(pick);
    let verdict = '', cls = '';
    if (s.error) verdict = s.midTurn ? 'A switch in the middle of a turn: no comparison for this one.' : 'Discharge could not analyse this decision.';
    else if (s.kind === 'preview') verdict = s.same ? 'Same four and same leads as Discharge.' : s.sameFour ? 'Same four as Discharge, different leads. The first two listed are the leads.' : 'Discharge would bring a different four. The first two listed are the leads.';
    else if (s.same) { verdict = 'Same choice as Discharge.'; cls = 'ok'; }
    else if (s.loss === undefined) verdict = s.kind === 'replace' ? 'Discharge would send in a different Pokémon.' : '';
    else if (s.loss >= 10) { verdict = `This cost about ${Math.round(s.loss)} points of win chance.`; cls = 'bad'; }
    else if (s.loss >= 3) verdict = `A little worse than Discharge’s choice (about ${Math.round(s.loss)} points).`;
    else { verdict = 'About as good as Discharge’s choice.'; cls = 'ok'; }
    if (verdict) box.append(el('p', 'rv-verdict ' + cls, verdict));
    if (s.rows?.length && s.kind === 'move') {
      const d = el('details'), sum = el('summary', '', 'Options Discharge compared, and the replies it expected'); d.append(sum);
      const wrap = el('div', 'rv-scroll'), t = el('table', 'rv-table'), thead = el('thead'), hr = el('tr');
      hr.append(el('th', '', 'Your option'), el('th', '', 'Discharge plays it'), el('th', '', 'Win chance'));
      for (const r of s.replies || []) { const th = el('th'); th.append(document.createTextNode('If they reply: ' + r.label), el('br'), document.createTextNode(`(expected ${pct(r.share)} of the time)`)); hr.append(th); }
      thead.append(hr); t.append(thead); const tb = el('tbody');
      for (const r of s.rows) { const tr = el('tr', r.you ? 'you' : ''); tr.append(el('td', '', r.label + (r.you ? ' (yours)' : '')), el('td', '', pct(r.share)), el('td', '', pct(r.chance))); for (const g of r.grid || []) tr.append(el('td', '', pct(g))); tb.append(tr); }
      t.append(tb); wrap.append(t); d.append(wrap);
      d.append(el('p', 'rv-note', '“Discharge plays it” is how often Discharge picks that option here; it mixes close options so it is harder to read.'));
      box.append(d);
    } else if (s.rows?.length > 1 && s.kind === 'replace' && !s.same) {
      box.append(el('p', 'rv-note', 'Discharge’s picks: ' + s.rows.map(r => `${r.label} (${pct(r.share)})`).join(', ')));
    }
    const happened = recap(s.lines || []);
    if (happened.length) { const d = el('details'); d.append(el('summary', '', 'What happened just before')); const ul = el('ul', 'rv-log'); for (const h of happened) ul.append(el('li', '', h)); d.append(ul); box.append(d); }
    return box;
  }

  function chart(points) {
    const host = $('rv-chart'); host.replaceChildren(); if (points.length < 2) return;
    const W = Math.max(300, Math.round(host.clientWidth || 760)), H = W < 500 ? 200 : 240, L = 38, R = 14, T = 12, B = 30, x = i => L + (W - L - R) * (points.length === 1 ? .5 : i / (points.length - 1)), y = v => T + (H - T - B) * (1 - v / 100);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart of your estimated win chance after each decision' });
    for (const v of [0, 25, 50, 75, 100]) { root.append(svg('line', { class: v === 50 ? 'mid' : 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) })); root.append(svg('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, v + '%')); }
    const every = Math.max(1, Math.ceil(points.length / Math.max(4, Math.floor(W / 60))));
    points.forEach((p, i) => { if (i % every === 0 || i === points.length - 1) root.append(svg('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, 'T' + p.turn)); });
    root.append(svg('path', { class: 'line', d: points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.chance).toFixed(1)}`).join(' ') }));
    const cross = svg('line', { class: 'cross', y1: T, y2: H - B }); root.append(cross);
    points.forEach((p, i) => root.append(svg('circle', { class: 'dot' + (p.loss >= 10 ? ' miss' : ''), cx: x(i), cy: y(p.chance), r: p.loss >= 10 ? 5 : 4 })));
    const tip = el('div', 'rv-tip'); tip.hidden = true; host.append(root, tip);
    const show = i => { const p = points[i]; cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.visibility = 'visible'; tip.hidden = false; tip.replaceChildren(el('strong', '', `Turn ${p.turn}: ${pct(p.chance)}`), el('br'), document.createTextNode(p.loss >= 3 ? `Best option was ${pct(p.best)} (${Math.round(p.loss)} points better)` : 'Close to the best option'));
      const r = host.getBoundingClientRect(), k = r.width / W; tip.style.left = Math.min(r.width - 90, Math.max(90, x(i) * k)) + 'px'; tip.style.top = (y(p.chance) * k - 10) + 'px'; };
    const hide = () => { tip.hidden = true; cross.style.visibility = 'hidden'; };
    const band = (W - L - R) / Math.max(1, points.length - 1);
    points.forEach((p, i) => { const hit = svg('rect', { class: 'hit', x: x(i) - band / 2, y: T, width: band, height: H - T - B, tabindex: 0, 'aria-label': `Turn ${p.turn}: win chance ${pct(p.chance)}` });
      hit.addEventListener('pointerenter', () => show(i)); hit.addEventListener('focus', () => show(i)); hit.addEventListener('pointerleave', hide); hit.addEventListener('blur', hide);
      hit.addEventListener('click', () => $('rv-step-' + p.n)?.scrollIntoView({ behavior: 'smooth', block: 'start' })); root.append(hit); });
  }

  function summary(done) {
    const moves = steps.filter(s => s.kind === 'move' && s.yours.chance !== undefined), points = moves.map(s => ({ n: s.n, turn: s.turn, chance: s.yours.chance, best: s.bot.chance, loss: s.loss || 0 }));
    $('rv-summary').hidden = moves.length === 0; if (!moves.length) return;
    const same = moves.filter(s => s.same || s.loss < 3).length, lost = moves.reduce((a, s) => a + (s.loss || 0), 0) / moves.length, stats = $('rv-stats'); stats.replaceChildren();
    const stat = (big, small) => { const d = el('div', 'rv-stat'); d.append(el('b', '', big), el('span', '', small)); stats.append(d); };
    stat(`${same} of ${moves.length}`, 'turns as good as Discharge’s choice');
    stat(`${lost.toFixed(1)} pts`, 'win chance given up per turn, on average');
    if (done) stat(current.result === 'win' ? 'Win' : current.result === 'loss' ? 'Loss' : 'Tie', 'result of the game');
    chart(points);
    const worst = moves.filter(s => s.loss >= 10).sort((a, b) => b.loss - a.loss).slice(0, 3), host = $('rv-mistakes'); host.replaceChildren();
    if (done) {
      if (!worst.length) host.append(el('p', 'rv-note', 'No choice cost you 10 points or more.'));
      else { host.append(el('h2', '', 'Costliest choices')); const ol = el('ol', 'rv-miss'); for (const s of worst) { const li = el('li'), b = el('a', '', `Turn ${s.turn}: about ${Math.round(s.loss)} points.`); b.href = '#rv-step-' + s.n; li.append(b, document.createTextNode(` Discharge would play ${s.bot.label}.`)); ol.append(li); } host.append(ol); }
    }
  }

  function render(done) { summary(done); const host = $('rv-steps'); while (host.children.length < steps.length) host.append(stepCard(steps[host.children.length])); }

  function open(g) {
    worker?.terminate(); worker = null; current = g; steps = []; $('rv-steps').replaceChildren(); $('rv-summary').hidden = true; listGames();
    try { history.replaceState(null, '', '?game=' + encodeURIComponent(g.id)); } catch {}
    if (g.review?.steps?.length) { steps = g.review.steps; $('rv-status').hidden = true; render(true); return; }
    const status = $('rv-status'), text = $('rv-status-text'), bar = $('rv-progress'); status.hidden = false; bar.hidden = false; bar.value = 0; text.textContent = 'Loading Discharge…';
    const fail = message => { text.textContent = message; bar.hidden = true; worker?.terminate(); worker = null; };
    worker = new Worker(new URL('./champions.worker.js', location.href), { type: 'module' });
    worker.onerror = e => fail('The review could not run: ' + (e.message || 'the bot failed to load') + '.');
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { text.textContent = 'Replaying the game…'; worker.postMessage({ type: 'review', record: g.record }); }
      else if (data.type === 'review-step') { steps.push(data.step); bar.value = 100 * data.step.n / Math.max(1, data.step.of); text.textContent = `Reviewing decision ${data.step.n} of ${data.step.of}…`; render(false); }
      else if (data.type === 'review-done') { status.hidden = true; worker.terminate(); worker = null; g.review = { steps, at: Date.now() }; save(games); render(true); listGames(); }
      else if (data.type === 'review-error' || data.type === 'error') fail('The review stopped: ' + data.message);
    };
  }

  listGames();
  const wanted = new URLSearchParams(location.search).get('game'), first = games.find(g => g.id === wanted);
  if (first) open(first);
  Object.defineProperty(window, 'gameReview', { value: { state: () => ({ games: games.length, current: current?.id || null, steps: steps.length, running: !!worker }) } });
})();
