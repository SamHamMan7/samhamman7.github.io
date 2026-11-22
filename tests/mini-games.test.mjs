import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Small DOM/worker harness: run the actual page code, including its event
// handlers, without loading the simulator or needing a browser in Pages CI.
function page(name) {
  class Element {
    constructor(tag = 'div') { this.tagName = tag; this.children = []; this.handlers = {}; this.style = { setProperty() {} }; this.hidden = false; this.disabled = false; this.attributes = {}; this._value = ''; this._max = ''; this._text = ''; }
    append(...xs) { this.children.push(...xs); }
    replaceChildren(...xs) { this.children = xs; this._text = ''; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text + this.children.map(x => x.textContent ?? x).join(''); }
    set max(v) { this._max = String(v); }
    get max() { return this._max; }
    set value(v) { this._value = String(this.type === 'range' ? Math.max(0, Math.min(Number(this.max), Number(v))) : v); }
    get value() { return this._value; }
    setAttribute(k, v) { this.attributes[k] = v; }
    addEventListener(k, fn) { this.handlers[k] = fn; }
    fire(k, e = {}) { this.handlers[k]?.({ target: this, ...e }); }
    focus() {}
  }
  const nodes = new Map(), node = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
  const html = fs.readFileSync(new URL(`../web/${name}.html`, import.meta.url), 'utf8');
  for (const input of html.matchAll(/<input\b[^>]*>/g)) {
    const attrs = Object.fromEntries([...input[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(x => [x[1], x[2]]));
    if (!attrs.id) continue;
    const n = node(attrs.id); n.type = attrs.type; if (attrs.max) n.max = attrs.max; if (attrs.value) n.value = attrs.value;
  }
  let worker;
  const window = {}, document = { getElementById: node, createElement: tag => new Element(tag), createTextNode: text => ({ textContent: text }) };
  const localStorage = { getItem() { return null; }, setItem() {} };
  const context = vm.createContext({ window, document, localStorage, URL, location: { href: `https://test.invalid/${name}.html` }, crypto: { getRandomValues(a) { a[0] = 731; return a; } }, Worker: class { constructor() { worker = this; this.sent = []; } postMessage(msg) { this.sent.push(msg); } } });
  vm.runInContext(fs.readFileSync(new URL(`../web/${name}.js`, import.meta.url), 'utf8'), context);
  return { node, window, html, worker, receive(data) { worker.onmessage({ data }); } };
}

function question(min = 221.3, max = 260) {
  const mon = { species: 'Test', types: ['Steel'], item: '', ability: '', nature: '', stats: { hp: 160, atk: 100, def: 100, spe: 100 }, boosts: {} };
  return { log: [], attacker: mon, defender: mon, move: { name: 'Steel Roller', type: 'Steel', category: 'Physical', basePower: 130 }, field: {}, crit: false, rolls: [354, 356, 360, 366, 368, 374, 378, 380, 386, 390, 396, 398, 402, 408, 410, 416], hp: 160, maxhp: 160, min, max, koRolls: 16 };
}

test('Steel Roller overkill: 150%+ scores full points and reveals the actual range', () => {
  const p = page('damage'); p.receive({ type: 'calc', question: question() });
  assert.equal(p.node('dg-range').max, '150'); assert.equal(p.node('dg-num').max, '150');
  p.node('dg-range').value = 150; p.node('dg-range').fire('input');
  assert.equal(p.node('dg-num').value, '150'); assert.equal(p.node('dg-out').textContent, '150%+');
  p.node('dg-lock').fire('click');
  assert.match(p.node('dg-result').textContent, /Inside the range! \+100/);
  assert.match(p.node('dg-result').textContent, /221\.3% – 260%/);
  assert.match(p.node('dg-result').textContent, /You guessed 150%\+/);
  assert.equal(p.node('dg-played').textContent, '1');
});

test('150%+ is correct when rolls cross 150% and misses when they all fall below it', () => {
  const p = page('damage');
  p.receive({ type: 'calc', question: question(140, 160) });
  p.node('dg-num').value = 250; p.node('dg-num').fire('input');
  assert.equal(p.node('dg-range').value, '150'); assert.equal(p.node('dg-num').value, '150');
  p.node('dg-lock').fire('click');
  assert.match(p.node('dg-result').textContent, /Inside the range! \+100/);
  p.receive({ type: 'calc', question: question(112, 132) });
  assert.equal(p.node('dg-num').value, '50');
  p.node('dg-quick').children.at(-1).fire('click');
  p.node('dg-lock').fire('click');
  assert.match(p.node('dg-result').textContent, /18% off · \+10/);
});

test('puzzle picks only submit a legal joint action; grading and next position work', () => {
  const p = page('puzzle'); p.receive({ type: 'ready' });
  assert.equal(p.worker.sent.at(-1).type, 'puzzle');
  const puzzle = { turn: 4, log: [], foeActive: ['Milotic', 'Gholdengo'], names: ['Kingambit', 'Rillaboom'], you: [], theirs: [], legal: ['move 1, move 3 2', 'switch 3, move 3 2', 'move 1, switch 3'], slots: [[{ part: 'move 1', label: 'Protect' }, { part: 'switch 3', label: 'Switch to Incineroar' }], [{ part: 'move 3 2', label: 'Grassy Glide → Gholdengo' }, { part: 'switch 3', label: 'Switch to Incineroar' }]] };
  p.receive({ type: 'puzzle', puzzle }); assert.equal(p.node('pz-lock').disabled, true);
  let slots = p.node('pz-slots').children;
  slots[0].children[1].children[1].fire('click'); // switch slot A
  slots = p.node('pz-slots').children;
  assert.equal(slots[1].children[1].children[1].disabled, true); // duplicate switch forbidden
  slots[1].children[1].children[0].fire('click');
  assert.equal(p.node('pz-lock').disabled, false);
  p.node('pz-lock').fire('click');
  assert.equal(p.worker.sent.at(-1).choice, 'switch 3, move 3 2');
  p.receive({ type: 'puzzle-result', result: { step: { same: true, loss: 0, yours: { label: 'Chosen', chance: 60 }, bot: { label: 'Chosen', chance: 60 }, rows: [] }, lines: [] } });
  assert.match(p.node('pz-result').textContent, /Best move!/);
  assert.equal(p.node('pz-played').textContent, '1');
  p.node('pz-result').children.at(-1).fire('click');
  assert.equal(p.worker.sent.at(-1).type, 'puzzle');
});

test('Games exposes puzzles, and both practice pages link to each other', () => {
  const home = fs.readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
  assert.match(home, /href="\.\/puzzle.html"/); assert.match(home, /What would you do\?/);
  assert.match(page('damage').html, /href="\.\/puzzle.html"/);
  assert.match(page('puzzle').html, /href="\.\/damage.html"/);
});
