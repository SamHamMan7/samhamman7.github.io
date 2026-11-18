// Damage guess: the Champions worker builds a real position from the bot's team pool and
// returns all 16 damage rolls of one move; you guess the % before seeing them. Offline.
(() => {
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const KEY = 'damage-guess-stats';
  const NATURE = { Adamant: ['atk', 'spa'], Bold: ['def', 'atk'], Brave: ['atk', 'spe'], Calm: ['spd', 'atk'], Careful: ['spd', 'spa'], Gentle: ['spd', 'def'], Hasty: ['spe', 'def'], Impish: ['def', 'spa'], Jolly: ['spe', 'spa'], Lax: ['def', 'spd'], Lonely: ['atk', 'def'], Mild: ['spa', 'def'], Modest: ['spa', 'atk'], Naive: ['spe', 'spd'], Naughty: ['atk', 'spd'], Quiet: ['spa', 'spe'], Rash: ['spa', 'spd'], Relaxed: ['def', 'spe'], Sassy: ['spd', 'spe'], Timid: ['spe', 'atk'] };
  const LABEL = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
  let stats = { played: 0, total: 0, streak: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Number.isFinite(s.played)) stats = s; } catch {}
  const saveStats = () => { try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch {} };
  const showStats = () => { $('dg-played').textContent = stats.played; $('dg-avg').textContent = stats.played ? Math.round(stats.total / stats.played) : '–'; $('dg-streak').textContent = stats.streak; };
  try { const c = localStorage.getItem('damage-guess-crit'); if (c !== null) $('dg-crit').checked = c === '1'; } catch {}
  $('dg-crit').addEventListener('change', () => { try { localStorage.setItem('damage-guess-crit', $('dg-crit').checked ? '1' : '0'); } catch {} });

  let worker = null, q = null, locked = false;
  const sprite = (m, img) => { img.alt = ''; img.loading = 'lazy'; const base = String(m.sprite || '').replace(/-mega.*$/, ''); img.src = `./sprites/gen5/${m.sprite}.png`; img.onerror = () => { if (base && !img.src.endsWith(`/${base}.png`)) img.src = `./sprites/gen5/${base}.png`; else img.hidden = true; }; return img; };
  const boostText = b => Object.entries(b || {}).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${LABEL[k] || k}`).join(', ');
  const natureText = n => NATURE[n] ? `${n} (+${LABEL[NATURE[n][0]]}, −${LABEL[NATURE[n][1]]})` : (n || 'Neutral');

  function monCard(m, role, keys) {
    const box = el('div', 'dg-mon'), who = el('div', 'who'), name = el('div');
    name.append(el('div', 'role', role), el('h2', '', m.species));
    who.append(sprite(m, el('img')), name); box.append(who);
    const dl = el('dl'), row = (k, v) => { if (v) dl.append(el('dt', '', k), el('dd', '', v)); };
    row('Type', m.types.join(' / ')); row('Item', m.item || 'none'); row('Ability', m.ability); row('Nature', natureText(m.nature));
    row('Stats', keys.map(k => `${m.stats[k]} ${LABEL[k]}`).join(' · '));
    row('Boosts', boostText(m.boosts)); if (m.status) row('Status', m.status.toUpperCase());
    box.append(dl); return box;
  }

  function render() {
    const box = $('dg-q'); box.replaceChildren();
    const physical = q.move.category === 'Physical', mons = el('div', 'dg-mons'), mv = el('div', 'dg-move');
    mv.append(el('span', 'arrow', '→'), el('strong', '', q.move.name));
    mv.append(el('span', 'tag', `${q.move.type} · ${q.move.category} · ${q.move.basePower} BP`));
    if (q.move.spread) mv.append(el('span', 'tag', 'Hits both foes (×0.75)'));
    if (q.crit) mv.append(el('span', 'tag hot', 'Critical hit'));
    if (q.attacker.mega) mv.append(el('span', 'tag', 'Mega Evolved'));
    mons.append(monCard(q.attacker, 'Attacker', [physical ? 'atk' : 'spa']), mv, monCard(q.defender, 'Defender', ['hp', physical ? 'def' : 'spd']));
    box.append(mons);
    const f = q.field, parts = [];
    if (f.weather) parts.push(`Weather: ${f.weather}`); if (f.terrain) parts.push(`Terrain: ${f.terrain}`);
    if (f.attackerSide?.length) parts.push(`Attacker’s side: ${f.attackerSide.join(', ')}`); if (f.defenderSide?.length) parts.push(`Defender’s side: ${f.defenderSide.join(', ')}`);
    if (f.partner?.attacker || f.partner?.defender) parts.push(`Partners on the field: ${f.partner.attacker || '–'} (attacker’s), ${f.partner.defender || '–'} (defender’s)`);
    box.append(el('p', 'dg-field', parts.length ? parts.join(' · ') : 'No weather, terrain or screens.'));
    $('dg-guess').hidden = false; $('dg-result').hidden = true; locked = false; setGuess(50); $('dg-range').focus({ preventScroll: true });
  }

  function setGuess(v) { v = Math.max(0, Math.min(300, Math.round(Number(v) || 0))); $('dg-range').value = Math.min(150, v); $('dg-num').value = v; $('dg-out').textContent = v + '%'; }
  $('dg-range').addEventListener('input', e => setGuess(e.target.value));
  $('dg-num').addEventListener('input', e => setGuess(e.target.value));
  $('dg-num').addEventListener('keydown', e => { if (e.key === 'Enter') lock(); });
  $('dg-lock').addEventListener('click', () => lock());

  function lock() {
    if (!q || locked) return; locked = true;
    const guess = Number($('dg-num').value), off = guess < q.min ? q.min - guess : guess > q.max ? guess - q.max : 0, score = Math.max(0, Math.round(100 - 5 * off));
    stats.played++; stats.total += score; stats.streak = off === 0 ? stats.streak + 1 : 0; saveStats(); showStats();
    const box = $('dg-result'); box.replaceChildren(); box.hidden = false; box.className = 'dg-box dg-result ' + (off === 0 ? 'good' : off > 10 ? 'bad' : '');
    box.append(el('h2', '', off === 0 ? 'Inside the range!' : `${Math.round(off * 10) / 10}% off`));
    box.append(el('p', 'pts', `Real damage: ${q.min}% – ${q.max}% (${q.rolls[0]}–${q.rolls[15]} of ${q.maxhp} HP). You guessed ${guess}%. Score: ${score}.`));
    const top = Math.max(110, Math.ceil((Math.max(q.max, guess) + 10) / 10) * 10), pos = v => `${Math.min(100, v / top * 100)}%`;
    const bar = el('div', 'dg-bar'), range = el('div', 'range'), ko = el('div', 'ko'), you = el('div', 'you');
    range.style.left = pos(q.min); range.style.width = `calc(${pos(q.max)} - ${pos(q.min)} + 2px)`; ko.style.left = pos(100); you.style.left = pos(guess);
    bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `Damage range ${q.min} to ${q.max} percent; your guess ${guess} percent`); bar.append(range, ko, you);
    const axis = el('div', 'dg-axis'); for (let v = 0; v <= top; v += top > 150 ? 50 : 25) { const s = el('span', '', v + '%'); s.style.left = pos(v); axis.append(s); }
    box.append(bar, axis);
    box.append(el('p', 'dg-note', 'Shaded: the real range. Red line: 100% (a KO from full HP). Dark line: your guess.'));
    box.append(el('p', '', q.koRolls === 16 ? 'It is a guaranteed KO from full HP.' : q.koRolls ? `It KOs from full HP on ${q.koRolls} of 16 rolls (${Math.round(q.koRolls / 16 * 100)}%).` : `It needs ${Math.ceil(100 / q.max)} or more hits like this to KO from full HP${q.effectiveness === 0 ? '' : ''}.`));
    if (q.effectiveness !== 1) box.append(el('p', '', q.effectiveness > 1 ? `Super effective (×${q.effectiveness}).` : `Not very effective (×${q.effectiveness}).`));
    box.append(el('p', 'dg-rolls', 'All 16 rolls (HP): ' + q.rolls.join(', ')));
    const next = el('button', 'dg-next', 'Next question'); next.type = 'button'; next.addEventListener('click', ask); box.append(next);
    next.focus({ preventScroll: true }); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function ask() {
    if (!worker) return;
    $('dg-guess').hidden = true; $('dg-result').hidden = true;
    worker.postMessage({ type: 'calc', seed: crypto.getRandomValues(new Uint32Array(1))[0] || 1, crit: $('dg-crit').checked });
  }

  showStats();
  try {
    worker = new Worker(new URL('./champions.worker.js', location.href), { type: 'module' });
    worker.onerror = e => { $('dg-q').replaceChildren(el('p', '', 'The simulator could not load: ' + (e.message || 'unknown error') + '.')); };
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') ask();
      else if (data.type === 'calc') { q = data.question; render(); }
      else if (data.type === 'error') $('dg-q').replaceChildren(el('p', '', 'Something went wrong: ' + data.message + '. Try reloading.'));
    };
  } catch (e) { $('dg-q').replaceChildren(el('p', '', 'This browser cannot run the simulator here.')); }
  Object.defineProperty(window, 'damageGuess', { value: { question: () => q, lock, setGuess } });
})();
