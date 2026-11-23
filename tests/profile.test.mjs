import assert from 'node:assert/strict';
import {pbkdf2Sync, webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const code = readFileSync(new URL('../web/profile.js', import.meta.url), 'utf8');

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  get firstElementChild() { return this.children[0]; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  setAttribute() {}
  focus() {}
  select() {}
}

const storage = initial => {
  const values = new Map(Object.entries(initial));
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)};
};
const profile = (id, pass) => ({id, name: id, lock: {salt: id, hash: pbkdf2Sync(pass, id, 150000, 32, 'sha256').toString('hex')}});
const descendants = node => node instanceof Element ? [node, ...node.children.flatMap(descendants)] : [];

function page(localStorage = storage({}), sessionStorage = storage({})) {
  const body = new Element('body'), window = {};
  let reloads = 0;
  vm.runInNewContext(code, {
    window, localStorage, sessionStorage, crypto: webcrypto, TextEncoder,
    location: {reload: () => reloads++},
    document: {readyState: 'complete', body, documentElement: {dataset: {}, classList: {add() {}}}, createElement: tag => new Element(tag), getElementById: () => null},
  });
  const find = predicate => descendants(body).find(predicate);
  return {find, localStorage, sessionStorage, profile: window.Profile, reloads: () => reloads,
    async submit(value) {
      const form = find(node => node.tag === 'form');
      assert.deepEqual(form.children.filter(node => node.tag === 'input').map(node => node.type), ['password']);
      form.children[0].value = value;
      await form.handlers.submit({preventDefault() {}});
    },
  };
}

test('an existing phrase opens its existing profile and data without a username', async () => {
  const local = storage({profiles: JSON.stringify([profile('first', 'garden fox'), profile('second', 'bench boost')]), 'profile-active': '"first"', 'p:second:dash-notes': '"keep me"'});
  const p = page(local);
  await p.submit('wrong phrase');
  assert.equal(p.reloads(), 0);
  await p.submit('bench boost');
  assert.equal(p.reloads(), 1);
  const next = page(local, p.sessionStorage);
  assert.equal(next.profile.locked, false);
  assert.equal(next.profile.key('dash-notes'), 'p:second:dash-notes');
  assert.equal(local.getItem(next.profile.key('dash-notes')), '"keep me"');
});

test('first use needs only a phrase; the phrase is not saved in clear text', async () => {
  const p = page();
  await p.submit('short');
  assert.equal(p.reloads(), 0);
  await p.submit('local green field');
  assert.equal(p.reloads(), 1);
  assert(!p.localStorage.getItem('profiles').includes('local green field'));
  assert.equal(page(p.localStorage, p.sessionStorage).profile.locked, false);
});

test('legacy duplicate phrases require a profile choice after verification', async () => {
  const local = storage({profiles: JSON.stringify([profile('North', 'shared phrase'), profile('South', 'shared phrase')])});
  const p = page(local);
  assert.equal(p.find(node => node.textContent === 'South'), undefined);
  await p.submit('shared phrase');
  assert.equal(p.reloads(), 0);
  p.find(node => node.textContent === 'South').handlers.click();
  assert.equal(page(local, p.sessionStorage).profile.me.id, 'South');
});
