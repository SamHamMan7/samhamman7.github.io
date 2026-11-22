// "What would you do?": the Champions worker sets up a mid-game position (two pool teams,
// open team sheets), the player picks a move for each Pokémon, then Discharge's search grades
// every option and the turn plays out in the Showdown battle screen.
(() => {
  const $id = id => document.getElementById(id);
  const el = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; };
  const KEY = 'puzzle-stats';
  let stats = { played: 0, best: 0, loss: 0 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Number.isFinite(s.played)) stats = s; } catch {}
  const saveStats = () => { try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch {} };
  const showStats = () => { $id('pz-played').textContent = stats.played; $id('pz-best').textContent = stats.best; $id('pz-avg').textContent = stats.played ? (Math.round(stats.loss / stats.played * 10) / 10) + '%' : '–'; };

  const TYPE = { Normal: '#9a9a7a', Fire: '#ef7f30', Water: '#5b8ef0', Electric: '#e2b71a', Grass: '#62b743', Ice: '#6cc9c9', Fighting: '#c22f28', Poison: '#9d40a0', Ground: '#d4ac52', Flying: '#9a85ec', Psychic: '#f25483', Bug: '#a1b220', Rock: '#b49a3a', Ghost: '#6d5797', Dragon: '#6a3cf3', Dark: '#6d574a', Steel: '#9b9bbd', Fairy: '#e486ad' };
  const moveOf = label => label.replace(/^Mega \+ /, '').split(' → ')[0];
  const moveInfo = name => { try { const m = window.Dex?.moves.get(name); return m?.exists ? m : null; } catch { return null; } };
  const hpText = c => { if (!c) return ''; if (/ fnt$/.test(c) || c === '0 fnt') return 'fainted'; const [a, b] = c.split(' ')[0].split('/').map(Number); return b ? Math.max(1, Math.round(a / b * 100)) + '%' : c; };

  let worker = null, pz = null, battle = null, picks = [], busy = false;

  function teamList(box, mons, mine) {
    box.replaceChildren();
    for (const m of mons) {
      const row = el('div', 'mon' + (mine && /fnt/.test(m.condition) ? ' out' : '') + (mine && m.active ? ' on' : ''));
      const left = el('div'); left.append(el('b', '', m.species)); left.append(el('div', 'small', `${m.item || 'No item'} · ${m.ability}`));
      row.append(left, el('span', '', (mine ? hpText(m.condition) + ' · ' : '') + m.moves.join(', ')));
      box.append(row);
    }
  }

  // Options for one slot that still fit with what is picked in the other slots.
  const fits = (slot, part) => pz.legal.some(c => { const ps = c.split(', '); return ps[slot] === part && picks.every((p, i) => i === slot || !p || ps[i] === p); });

  function drawSlots() {
    const box = $id('pz-slots'); box.replaceChildren();
    pz.slots.forEach((opts, i) => {
      const s = el('div', 'slot'), h = el('h3', '', pz.names[i] || 'Pokémon ' + (i + 1)), me = pz.you.find(m => m.active && m.species === pz.names[i]);
      if (me) h.append(el('span', '', hpText(me.condition)));
      const grid = el('div', 'opts'), rank = o => /^Switch/.test(o.label) ? 2 : /^Mega \+/.test(o.label) ? 1 : 0;
      for (const o of [...opts].sort((a, b) => rank(a) - rank(b))) {
        const b = el('button', 'opt'); b.type = 'button'; b.setAttribute('aria-pressed', String(picks[i] === o.part)); b.disabled = !fits(i, o.part);
        const mv = moveInfo(moveOf(o.label));
        if (/^Switch/.test(o.label)) b.style.setProperty('--tc', '#888'); else if (mv) b.style.setProperty('--tc', TYPE[mv.type] || '#888');
        const [main, target] = o.label.split(' → ');
        b.append(document.createTextNode(main));
        if (target || (mv && !/^Switch/.test(o.label))) b.append(el('small', '', [target && '→ ' + target, mv && mv.category !== 'Status' && mv.basePower ? `${mv.type} · ${mv.basePower} BP` : mv ? mv.type + ' · status' : ''].filter(Boolean).join(' · ')));
        b.addEventListener('click', () => { picks[i] = picks[i] === o.part ? null : o.part; for (let j = 0; j < picks.length; j++) if (j !== i && picks[j] && !fits(j, picks[j])) picks[j] = null; drawSlots(); });
        grid.append(b);
      }
      s.append(h, grid); box.append(s);
    });
    $id('pz-lock').disabled = !(picks.every(Boolean) && pz.legal.includes(picks.join(', ')));
  }

  function render() {
    battle = window.ShowdownScene ? window.ShowdownScene.show($id('pz-frame'), $id('pz-log'), pz.log, { maxScale: 1.6 }) : null;
    $id('pz-what').textContent = `Turn ${pz.turn}: what do you do? Their ${pz.foeActive.filter(Boolean).join(' and ')} are in.`;
    picks = pz.slots.map(o => o.length === 1 ? o[0].part : null);
    teamList($id('pz-you'), pz.you, true); teamList($id('pz-theirs'), pz.theirs, false);
    $id('pz-pick').hidden = false; $id('pz-wait').hidden = true; $id('pz-result').hidden = true; busy = false;
    drawSlots();
  }

  function grade(loss) { return loss <= 1 ? ['Best move!', 'good'] : loss <= 4 ? ['Good move', 'good'] : loss <= 10 ? ['Inaccuracy', 'ok'] : ['Mistake', 'bad']; }

  function showResult({ step, lines }) {
    $id('pz-wait').hidden = true;
    const box = $id('pz-result'); box.replaceChildren(); box.hidden = false;
    if (step.error || step.yours.chance === undefined) {
      box.className = 'result'; box.append(el('h2', '', 'Discharge could not grade this one'), el('p', 'muted', step.error || 'Your choice was not among the options it checked.'));
    } else {
      const loss = Math.max(0, step.loss || 0), [title, cls] = step.same ? ['Best move!', 'good'] : grade(loss);
      stats.played++; stats.loss += loss; if (step.same || loss <= 1) stats.best++; saveStats(); showStats();
      box.className = 'result ' + cls; box.append(el('h2', '', title + (loss > 1 ? ` (−${loss}%)` : '')));
      const vs = el('div', 'vs'), card = (k, label, pc) => { const d = el('div'); d.append(el('b', '', k), el('div', 'pc', pc + '%'), el('div', 'small', label)); return d; };
      vs.append(card('You played', step.yours.label, step.yours.chance), card("Discharge's pick", step.bot.label, step.bot.chance)); box.append(vs);
      const t = el('table'), head = el('tr'); for (const h of ['Option', 'Win chance']) head.append(el('th', '', h)); t.append(head);
      for (const r of step.rows || []) { const tr = el('tr', (r.you ? 'you ' : '') + (r.chance === step.bot.chance ? 'best' : '')); tr.append(el('td', '', r.label + (r.you ? ' (you)' : '')), el('td', '', r.chance + '%')); t.append(tr); }
      box.append(t);
      if (step.replies?.length) { box.append(el('p', 'small', 'Replies Discharge expected: ' + step.replies.map(r => `${r.label} (${r.share}%)`).join(' · '))); }
    }
    box.append(el('p', 'muted', 'Playing out the turn: your move against a reply drawn from what Discharge expected.'));
    if (battle && lines?.length) window.ShowdownScene.play(battle, lines);
    const next = el('button', 'btn go', 'Next puzzle'); next.type = 'button'; next.addEventListener('click', ask); box.append(next);
  }

  $id('pz-lock').addEventListener('click', () => {
    if (!pz || busy) return; const choice = picks.join(', '); if (!pz.legal.includes(choice)) return;
    busy = true; $id('pz-pick').hidden = true; $id('pz-wait').hidden = false; worker.postMessage({ type: 'puzzle-answer', choice });
  });

  function ask() {
    if (!worker) return; busy = true; $id('pz-pick').hidden = true; $id('pz-result').hidden = true; $id('pz-wait').hidden = true;
    $id('pz-what').textContent = 'Setting up a position…';
    worker.postMessage({ type: 'puzzle', seed: crypto.getRandomValues(new Uint32Array(1))[0] || 1 });
  }

  showStats();
  try {
    worker = new Worker(new URL('./champions.worker.js', location.href), { type: 'module' });
    worker.onerror = e => { $id('pz-what').textContent = 'The simulator could not load: ' + (e.message || 'unknown error') + '.'; };
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') ask();
      else if (data.type === 'puzzle') { pz = data.puzzle; try { render(); } catch (e) { $id('pz-what').textContent = 'Could not draw the battle: ' + e.message; } }
      else if (data.type === 'puzzle-result') showResult(data.result);
      else if (data.type === 'error') { $id('pz-wait').hidden = true; $id('pz-what').textContent = 'Something went wrong: ' + data.message + '.'; const b = el('button', 'btn', 'Try another'); b.type = 'button'; b.addEventListener('click', ask); $id('pz-result').replaceChildren(b); $id('pz-result').hidden = false; }
    };
  } catch { $id('pz-what').textContent = 'This browser cannot run the simulator here.'; }
  Object.defineProperty(window, 'puzzleGame', { value: { puzzle: () => pz, picks: () => picks } });
})();
