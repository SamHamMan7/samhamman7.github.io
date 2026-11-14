// Cloudflare Worker: signs in to College Station ISD's Home Access Center with the
// username and password it is sent, reads the class averages, and returns them as JSON.
// Nothing is stored or logged. The HAC address is fixed, so this cannot be pointed at
// other sites, and only the pages listed in ALLOWED may call it from a browser.
const HAC = 'https://hac.csisd.org';
const ALLOWED = ['https://samhamman7.github.io', 'http://127.0.0.1:4175', 'http://localhost:4175'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const text = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => (tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i')) || [])[1];

// Keeps cookies across the sign-in redirects, which fetch does not do by itself.
function jar() {
  const cookies = new Map();
  return async function go(url, init = {}, hops = 0) {
    const headers = { 'User-Agent': UA, ...(init.headers || {}) };
    if (cookies.size) headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(url, { ...init, headers, redirect: 'manual' });
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') || '').split(/,(?=\s*[^;,=\s]+=)/);
    for (const c of set) { const m = c.match(/^\s*([^=;\s]+)=([^;]*)/); if (m) cookies.set(m[1], m[2]); }
    const next = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && next && hops < 6) return go(new URL(next, url).href, { headers: init.headers }, hops + 1);
    return { url, status: res.status, html: await res.text() };
  };
}

export function parseGrades(html) {
  const classes = [];
  for (const block of html.split(/<div[^>]*class="[^"]*\bAssignmentClass\b[^"]*"/i).slice(1)) {
    const name = (block.match(/class="[^"]*sg-header-heading[^"]*"[^>]*>([\s\S]*?)<\/a>/i) || [])[1];
    const avg = (block.match(/id="[^"]*lblHdrAverage[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || [])[1];
    if (!name) continue;
    const full = text(name), number = avg ? (text(avg).match(/-?\d+(?:\.\d+)?/) || [])[0] : undefined;
    // "1234 - 1 AP Chemistry" -> "AP Chemistry"
    classes.push({ name: full.replace(/^[\w.]+\s*-\s*\d+\s+/, ''), code: (full.match(/^[\w.]+\s*-\s*\d+/) || [''])[0], average: number === undefined ? null : Number(number) });
  }
  return classes;
}

export async function readGrades(user, pass) {
  const go = jar(), logon = HAC + '/HomeAccess/Account/LogOn';
  const page = await go(logon);
  const form = (page.html.match(/<form[^>]*action="[^"]*LogOn[^"]*"[\s\S]*?<\/form>/i) || [])[0];
  if (!form) return { error: 'HAC did not show its sign-in page.', status: 502 };
  const body = new URLSearchParams();
  for (const tag of form.match(/<input[^>]*>/gi) || []) { const n = attr(tag, 'name'); if (n && /hidden/i.test(attr(tag, 'type') || '')) body.set(n, attr(tag, 'value') || ''); }
  for (const sel of form.match(/<select[^>]*name="[^"]*"[\s\S]*?<\/select>/gi) || []) { const n = attr(sel, 'name'), opt = (sel.match(/<option[^>]*selected[^>]*>/i) || sel.match(/<option[^>]*>/i) || [])[0]; if (n && opt) body.set(n, attr(opt, 'value') || ''); }
  body.set('VerificationOption', 'UsernamePassword'); body.set('LogOnDetails.UserName', user); body.set('LogOnDetails.Password', pass); body.set('tempUN', ''); body.set('tempPW', '');
  const after = await go(page.url, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: page.url, Origin: HAC } });
  if (/LogOnDetails\.Password/i.test(after.html)) return { error: 'HAC did not accept that username and password.', status: 401 };
  const grades = await go(HAC + '/HomeAccess/Content/Student/Assignments.aspx');
  if (/LogOnDetails\.Password/i.test(grades.html)) return { error: 'HAC signed in but would not open the grades page.', status: 502 };
  const classes = parseGrades(grades.html);
  if (!classes.length) return { error: 'Signed in, but no classes were found on the grades page.', status: 502 };
  return { classes, fetchedAt: new Date().toISOString() };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '', cors = { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin', 'Cache-Control': 'no-store' };
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: true, about: 'HAC grades reader. POST {user, pass}.' });
    if (origin && !ALLOWED.includes(origin)) return json({ error: 'This page is not allowed to use this reader.' }, 403);
    let input; try { input = await request.json(); } catch { return json({ error: 'Send JSON.' }, 400); }
    const user = String(input.user || '').trim(), pass = String(input.pass || '');
    if (!user || !pass || user.length > 80 || pass.length > 200) return json({ error: 'Username and password are required.' }, 400);
    try { const out = await readGrades(user, pass); return out.error ? json({ error: out.error }, out.status) : json(out); }
    catch { return json({ error: 'Could not reach HAC. Try again in a minute.' }, 502); }
  },
};
