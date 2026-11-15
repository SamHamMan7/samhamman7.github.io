// Cloudflare Worker: signs in to College Station ISD's Home Access Center with the username
// and password it is sent and returns the grade pages (class work, report card, transcript)
// for the site to read in the browser. Nothing is stored or logged. The HAC address is fixed,
// so this cannot be pointed at other sites, and only the pages in ALLOWED may call it.
const HAC = 'https://hac.csisd.org';
const ALLOWED = ['https://samhamman7.github.io', 'http://127.0.0.1:4175', 'http://localhost:4175'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const PAGES = { assignments: '/HomeAccess/Content/Student/Assignments.aspx', reportCard: '/HomeAccess/Content/Student/ReportCards.aspx', transcript: '/HomeAccess/Content/Student/Transcript.aspx' };

const attr = (tag, name) => (tag.match(new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"', 'i')) || [])[1];
const unescape = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const signedOut = html => /LogOnDetails\.Password/i.test(html);
// Only the page body matters to the site; scripts and styles are dropped to keep replies small.
const trim = html => { const a = html.search(/<body[\s>]/i); return (a < 0 ? html : html.slice(a)).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<input[^>]*name="__(VIEWSTATE|EVENTVALIDATION)[^"]*"[^>]*>/gi, ''); };

// Keeps cookies across the sign-in redirects, which fetch does not do by itself.
export function session(base = HAC) {
  const cookies = new Map();
  async function go(path, init = {}, hops = 0) {
    const url = new URL(path, base).href, headers = { 'User-Agent': UA, ...(init.headers || {}) };
    if (cookies.size) headers.Cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(url, { ...init, headers, redirect: 'manual' });
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get('set-cookie') || '').split(/,(?=\s*[^;,=\s]+=)/);
    for (const c of set) { const m = c.match(/^\s*([^=;\s]+)=([^;]*)/); if (m) cookies.set(m[1], m[2]); }
    const next = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && next && hops < 6) return go(new URL(next, url).href, { headers: init.headers }, hops + 1);
    return { url, status: res.status, html: await res.text() };
  }
  // Fills in an ASP.NET form the way the browser would: hidden fields, selected options, and
  // any overrides (e.g. the six-weeks picker), then posts it back.
  async function postBack(page, overrides, submitName) {
    const form = (page.html.match(/<form[\s\S]*?<\/form>/i) || [])[0]; if (!form) return null;
    const body = new URLSearchParams();
    for (const tag of form.match(/<input[^>]*>/gi) || []) { const n = attr(tag, 'name'), t = (attr(tag, 'type') || 'text').toLowerCase(); if (n && (t === 'hidden' || t === 'text')) body.set(n, unescape(attr(tag, 'value') || '')); }
    for (const sel of form.match(/<select[\s\S]*?<\/select>/gi) || []) { const n = attr(sel, 'name'), opt = (sel.match(/<option[^>]*selected[^>]*>/i) || sel.match(/<option[^>]*>/i) || [])[0]; if (n && opt) body.set(n, unescape(attr(opt, 'value') || '')); }
    for (const [k, v] of Object.entries(overrides)) body.set(k, v);
    if (submitName) { const button = (form.match(new RegExp('<(?:input|button)[^>]*name="([^"]*' + submitName + '[^"]*)"[^>]*>', 'i')) || []); if (button[1]) body.set(button[1], unescape(attr(button[0], 'value') || '')); }
    const action = unescape(attr(form.match(/<form[^>]*>/i)[0], 'action') || page.url);
    return go(new URL(action, page.url).href, { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: page.url, Origin: new URL(base).origin } });
  }
  return { go, postBack };
}

export async function signIn(s) {
  const page = await s.go('/HomeAccess/Account/LogOn');
  if (!/<form[^>]*LogOn/i.test(page.html)) return { error: 'HAC did not show its sign-in page.', status: 502 };
  return { page };
}

export async function readHac(user, pass, { want = 'all', run = '' } = {}, base = HAC) {
  const s = session(base), start = await signIn(s); if (start.error) return start;
  const after = await s.postBack(start.page, { VerificationOption: 'UsernamePassword', 'LogOnDetails.UserName': user, 'LogOnDetails.Password': pass, tempUN: '', tempPW: '' });
  if (!after || signedOut(after.html)) return { error: 'HAC did not accept that username and password.', status: 401 };
  let work = await s.go(PAGES.assignments);
  if (signedOut(work.html)) return { error: 'HAC signed in but would not open the grades page.', status: 502 };
  if (run) {
    // The six-weeks picker is an ASP.NET dropdown; choosing one posts the page back.
    const name = (work.html.match(/<select[^>]*name="([^"]*ReportCardRun[^"]*)"/i) || [])[1];
    if (!name) return { error: 'HAC did not offer other grading periods.', status: 502 };
    const next = await s.postBack(work, { [name]: run }, 'RefreshView'); if (!next || signedOut(next.html)) return { error: 'HAC would not switch grading periods.', status: 502 };
    work = next;
  }
  const pages = { assignments: trim(work.html) };
  if (want === 'all') for (const key of ['reportCard', 'transcript']) { const r = await s.go(PAGES[key]); if (!signedOut(r.html)) pages[key] = trim(r.html); }
  return { pages, fetchedAt: new Date().toISOString() };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '', cors = { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin', 'Cache-Control': 'no-store' };
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: true, about: 'HAC grades reader, version 2. POST {user, pass, want, run}.' });
    if (origin && !ALLOWED.includes(origin)) return json({ error: 'This page is not allowed to use this reader.' }, 403);
    let input; try { input = await request.json(); } catch { return json({ error: 'Send JSON.' }, 400); }
    const user = String(input.user || '').trim(), pass = String(input.pass || ''), want = input.want === 'run' ? 'run' : 'all', run = String(input.run || '').slice(0, 40);
    if (!user || !pass || user.length > 80 || pass.length > 200) return json({ error: 'Username and password are required.' }, 400);
    try { const out = await readHac(user, pass, { want, run }); return out.error ? json({ error: out.error }, out.status) : json(out); }
    catch { return json({ error: 'Could not reach HAC. Try again in a minute.' }, 502); }
  },
};
