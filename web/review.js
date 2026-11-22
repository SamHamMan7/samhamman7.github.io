// Game review: a Showdown replay of a finished Champions game with, for every decision,
// what Discharge would have played in your seat. Runs on this device.
(() => {
  const KEY = 'offline-showdown-games';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const SVG = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}) => { const x = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v); return x; };
  const pct = v => Math.round(v) + '%';
  const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(g => g && g.id && g.record) : []; } catch { return []; } };
  const save = games => { try { localStorage.setItem(KEY, JSON.stringify(games)); } catch {} };
  const species = packed => String(packed || '').split(']').map(set => { const f = set.split('|'); return f[1] || f[0]; }).filter(Boolean);
  const SPEED = { fast: [50, 1], normal: [300, 1], slow: [500, 1000] };

  let games = load(), worker = null, current = null, steps = [], tail = [], battle = null, chartTurns = [];

  function listGames() {
    const list = $('rv-games'); list.replaceChildren(); $('rv-empty').hidden = games.length > 0;
    for (const g of games) {
      const b = el('button'); b.type = 'button'; b.setAttribute('aria-current', String(current?.id === g.id));
      b.append(el('strong', '', (g.result === 'win' ? 'Win' : g.result === 'loss' ? 'Loss' : 'Game') + ' · ' + new Date(g.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })), el('br'), document.createTextNode(species(g.record.p1).slice(0, 3).join(', ') + '…'));
      b.addEventListener('click', () => open(g)); list.append(b);
    }
  }

  // ---- Replay player (the Showdown client's renderer) ----
  function fullLog() { return [...steps.flatMap(s => s.lines || []), ...tail]; }
  function setupPlayer() {
    if (!window.ShowdownScene) return;
    battle = window.ShowdownScene.show($('rv-frame'), $('rv-log'), fullLog());
    battle.seekTurn(0, true);
    battle.subscribe(state => { $('sd-play').textContent = battle.paused ? '▶ Play' : '⏸ Pause'; $('nv-play').textContent = battle.paused ? 'Play' : 'Pause'; if (state === 'turn' || state === 'atqueueend') markTurn(battle.turn); });
    applySpeed('normal'); $('rv-player').hidden = false; $('rv-nav').hidden = false;
  }
  function seek(turn) { if (!battle) return; battle.seekTurn(Math.max(0, turn), true); markTurn(battle.turn); }
  function togglePlay() { if (!battle) return; if (battle.paused || battle.atQueueEnd) { if (battle.atQueueEnd) battle.seekTurn(0, true); battle.play(); } else battle.pause(); }
  function applySpeed(k) { if (!battle) return; [battle.messageFadeTime, battle.messageShownTime] = SPEED[k]; document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.speed === k))); }
  $('sd-play').addEventListener('click', togglePlay); $('nv-play').addEventListener('click', togglePlay);
  $('sd-first').addEventListener('click', () => seek(0)); $('sd-end').addEventListener('click', () => battle && (battle.seekTurn(Infinity, true), markTurn(battle.turn)));
  for (const id of ['sd-prev', 'nv-prev']) $(id).addEventListener('click', () => battle && seek(battle.turn - 1));
  for (const id of ['sd-next', 'nv-next']) $(id).addEventListener('click', () => battle && seek(battle.turn + 1));
  for (const id of ['sd-sides', 'nv-sides']) $(id).addEventListener('click', () => battle?.switchViewpoint());
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => applySpeed(b.dataset.speed)));

  function markTurn(turn) {
    document.querySelectorAll('.card').forEach(c => c.classList.toggle('now', +c.dataset.turn === turn));
    const cur = $('rv-chart').querySelector('.cur'); if (cur && chartTurns.length) { const i = chartTurns.findIndex(t => t >= turn); const x = cur._x(i < 0 ? chartTurns.length - 1 : i); cur.setAttribute('x1', x); cur.setAttribute('x2', x); }
  }

  // ---- Win-chance strip ----
  function chart() {
    const moves = steps.filter(s => s.kind === 'move' && s.yours.chance !== undefined), host = $('rv-chart'); host.replaceChildren();
    $('rv-chartbox').hidden = moves.length < 2; if (moves.length < 2) return;
    chartTurns = moves.map(s => s.turn);
    const W = 600, H = 90, P = 8, x = i => P + (W - 2 * P) * i / (moves.length - 1), y = v => P + (H - 2 * P) * (1 - v / 100);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Your win chance after each decision; tap to jump to that turn' });
    root.append(svg('line', { class: 'mid', x1: P, x2: W - P, y1: y(50), y2: y(50) }));
    root.append(Object.assign(svg('path', { class: 'ln', d: moves.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s.yours.chance).toFixed(1)}`).join(' ') })));
    moves.forEach((s, i) => { if (s.loss >= 10) root.append(svg('circle', { class: 'miss', cx: x(i), cy: y(s.yours.chance), r: 5 })); });
    const cur = svg('line', { class: 'cur', x1: x(0), x2: x(0), y1: 2, y2: H - 2 }); cur._x = x; root.append(cur);
    root.addEventListener('click', e => { const r = root.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(moves.length - 1, Math.round((fx - P) / (W - 2 * P) * (moves.length - 1)))); seek(moves[i].turn - 1); $('card-' + moves[i].n)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    host.append(root);
  }

  // ---- The bot's thinking per decision ----
  function card(s) {
    const box = el('section', 'card'); box.id = 'card-' + s.n; box.dataset.turn = s.kind === 'preview' ? 0 : s.turn;
    const hd = el('div', 'hd'); hd.append(el('span', 'k', s.kind === 'preview' ? 'Team preview' : s.kind === 'replace' ? `Turn ${s.turn} · replacement` : `Turn ${s.turn}`));
    const jump = el('button', 'pill', 'show on board'); jump.type = 'button'; jump.style.border = '0'; jump.style.cursor = 'pointer'; jump.addEventListener('click', () => { seek(s.kind === 'preview' ? 0 : s.turn - 1); $('rv-player').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    hd.append(jump); box.append(hd);
    const big = el('div', 'big'), play = el('div', 'play'); play.append(el('b', '', 'You played'), document.createTextNode(s.yours.label || '—'));
    if (s.bot && !s.same) { play.append(el('b', '', 'Discharge would play'), document.createTextNode(s.bot.label)); play.lastChild.previousSibling.style.marginTop = '8px'; }
    const pc = el('div', 'pc'); if (s.bot?.chance !== undefined) { pc.append(el('small', '', 'Win chance'), document.createTextNode(pct(s.yours.chance ?? s.bot.chance))); }
    big.append(play, pc); box.append(big);
    let verdict = '', cls = '';
    if (s.error) verdict = s.midTurn ? 'A switch in the middle of a turn: no comparison here.' : 'Discharge could not analyse this decision.';
    else if (s.kind === 'preview') verdict = s.same ? 'Same four and leads as Discharge.' : s.sameFour ? 'Same four as Discharge, different leads (first two listed lead).' : 'Discharge would bring a different four (first two listed lead).';
    else if (s.same) { verdict = 'Same choice as Discharge.'; cls = 'good'; }
    else if (s.loss >= 10) { verdict = `Cost about ${Math.round(s.loss)} points of win chance (best was ${pct(s.bot.chance)}).`; cls = 'bad'; }
    else if (s.loss >= 3) verdict = `A little worse than Discharge's choice (about ${Math.round(s.loss)} points).`;
    else if (s.loss !== undefined) { verdict = 'About as good as Discharge\'s choice.'; cls = 'good'; }
    if (verdict) box.append(el('p', 'verdict ' + cls, verdict));
    if (s.replies?.length) box.append(el('p', 'why', 'Expected their side to play: ' + s.replies.map(r => `${r.label} (${pct(r.share)})`).join('; ') + '.'));
    if (s.rows?.length && s.kind === 'move') {
      const wrap = el('div', 'tbl'), t = el('table'), hr = el('tr'); hr.append(el('th', '', 'Option'), el('th', '', 'Plays it'), el('th', '', 'Win chance')); t.append(Object.assign(el('thead'), {}).appendChild(hr).parentNode);
      const best = Math.max(...s.rows.map(r => r.chance)), tb = el('tbody');
      for (const r of s.rows) { const tr = el('tr', (r.chance === best ? 'best ' : '') + (r.you ? 'you' : '')); tr.append(el('td', '', r.label + (r.you ? ' (yours)' : '')), el('td', '', pct(r.share)), el('td', '', pct(r.chance))); tb.append(tr); }
      t.append(tb); wrap.append(t); box.append(wrap);
    }
    return box;
  }

  function summary(done) {
    const moves = steps.filter(s => s.kind === 'move' && s.yours.chance !== undefined), box = $('rv-stats'); box.replaceChildren();
    if (!moves.length) return;
    const same = moves.filter(s => s.same || s.loss < 3).length, lost = moves.reduce((a, s) => a + (s.loss || 0), 0) / moves.length, worst = [...moves].sort((a, b) => (b.loss || 0) - (a.loss || 0))[0];
    const stat = (b, t) => { const d = el('div', 'stat'); d.append(el('b', '', b), el('span', '', t)); box.append(d); };
    stat(`${same}/${moves.length}`, 'turns as good as Discharge'); stat(`${lost.toFixed(1)}`, 'points lost per turn'); stat(worst && worst.loss >= 3 ? `T${worst.turn}` : '–', worst && worst.loss >= 3 ? `costliest turn (−${Math.round(worst.loss)})` : 'no costly turn');
  }

  function render(done) {
    summary(done); chart();
    const host = $('rv-cards'); while (host.children.length < steps.length) host.append(card(steps[host.children.length]));
    $('rv-think').hidden = steps.length === 0;
    if (done && !battle) setupPlayer();
  }

  function open(g) {
    worker?.terminate(); worker = null; current = g; steps = []; tail = []; battle = null; $('rv-cards').replaceChildren(); $('rv-player').hidden = true; $('rv-nav').hidden = true; $('rv-chartbox').hidden = true; listGames();
    const opp = 'Discharge'; $('rv-title').textContent = `You vs ${opp}`;
    $('rv-sub').replaceChildren(document.createTextNode(g.result === 'win' ? 'You won' : g.result === 'loss' ? `${opp} won` : 'Finished'), el('span', 'chip ' + (g.result === 'win' ? 'win' : 'loss'), g.result === 'win' ? 'you won' : 'bot won'));
    try { history.replaceState(null, '', '?game=' + encodeURIComponent(g.id)); } catch {}
    if (g.review?.steps?.length) { steps = g.review.steps; tail = g.review.tail || []; $('rv-status').hidden = true; render(true); return; }
    const status = $('rv-status'), text = $('rv-status-text'), bar = $('rv-progress'); status.hidden = false; bar.value = 0; text.textContent = 'Loading Discharge…';
    const fail = m => { text.textContent = m; worker?.terminate(); worker = null; };
    worker = new Worker(new URL('./champions.worker.js', location.href), { type: 'module' });
    worker.onerror = e => fail('The review could not run: ' + (e.message || 'the bot failed to load') + '.');
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') { text.textContent = 'Replaying the game…'; worker.postMessage({ type: 'review', record: g.record }); }
      else if (data.type === 'review-step') { steps.push(data.step); bar.value = 100 * data.step.n / Math.max(1, data.step.of); text.textContent = `Discharge is looking at decision ${data.step.n} of ${data.step.of}…`; render(false); }
      else if (data.type === 'review-done') { status.hidden = true; tail = data.lines || []; worker.terminate(); worker = null; g.review = { steps, tail, at: Date.now() }; save(games); render(true); }
      else if (data.type === 'review-error' || data.type === 'error') fail('The review stopped: ' + data.message);
    };
  }

  listGames();
  const wanted = new URLSearchParams(location.search).get('game'), first = games.find(g => g.id === wanted) || games[0];
  if (first) open(first);
  Object.defineProperty(window, 'gameReview', { value: { state: () => ({ games: games.length, current: current?.id || null, steps: steps.length, running: !!worker, player: !!battle, turn: battle?.turn }) } });
})();
