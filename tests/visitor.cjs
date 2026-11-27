const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const apiSource = fs.readFileSync('api/visitor/index.js', 'utf8');
const sharedScript = fs.readFileSync('script.js', 'utf8');
const clientSource = sharedScript.slice(sharedScript.indexOf('(function setupHoustonVisitorAlert()'));
const browserUA = 'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36';
function server({ configured = true, provider = 'ok' } = {}) {
  let clock = 1000000000;
  const calls = [];
  const sandbox = { require, module: { exports: {} }, process: { env: configured ? { PUSHOVER_APP_TOKEN: 'mock-app-not-real', PUSHOVER_USER_KEY: 'mock-user-not-real' } : {} },
    Date: { now: () => clock }, AbortSignal, Buffer, fetch: async (url, options) => {
      calls.push({ url, ...JSON.parse(options.body) });
      if (provider === 'network') throw new Error('mock network failure');
      return { ok: provider !== 'http-failure', json: async () => ({ status: provider === 'ok' ? 1 : 0 }) };
    } };
  vm.runInNewContext(apiSource, sandbox);
  return { calls, advance: ms => clock += ms, async request(overrides = {}) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    const req = { method: 'POST', headers: { origin: 'https://www.houstonodorpros.com', 'sec-fetch-site': 'same-origin', 'user-agent': browserUA, 'content-type': 'application/json' }, body: { path: '/', sessionId: 'test-session-00000001' }, ...overrides };
    await sandbox.module.exports(req, res);
    return res;
  } };
}
function client({ visible = true, storageBlocked = false, webdriver = false, userAgent = browserUA, existing = false, providerFailure = false } = {}) {
  const calls = [], timers = new Map(), stored = new Map(existing ? [['hop_visitor_attempt_v1', '1']] : []), listeners = {};
  let next = 1;
  const sandbox = {
    window: { location: { protocol: 'https:', hostname: 'www.houstonodorpros.com', pathname: '/services', href: 'https://www.houstonodorpros.com/services?email=private@example.com#secret' } },
    document: { visibilityState: visible ? 'visible' : 'hidden', addEventListener: (type, fn) => listeners[type] = fn },
    navigator: { userAgent, webdriver },
    sessionStorage: { getItem(key) { if (storageBlocked) throw Error('blocked'); return stored.get(key) || null; }, setItem(key, value) { if (storageBlocked) throw Error('blocked'); stored.set(key, value); } },
    crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' }, AbortSignal: { timeout: () => ({}) },
    setTimeout: (fn, ms) => { const id = next++; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
    fetch: (url, options) => { calls.push({ url, ...options }); return providerFailure ? Promise.reject(Error('offline')) : Promise.resolve({ ok: true }); }
  };
  vm.runInNewContext(clientSource, sandbox);
  return { calls, timers, stored, visibility(value) { sandbox.document.visibilityState = value; listeners.visibilitychange?.(); }, run() { const [id, timer] = [...timers][0]; timers.delete(id); timer.fn(); } };
}
(async () => {
  let s = server();
  assert.equal((await s.request({ method: 'GET' })).code, 405);
  for (const origin of ['https://other.example', 'null', undefined]) assert.equal((await s.request({ headers: { origin } })).code, 403);
  assert.equal(s.calls.length, 0);
  for (const ua of ['Googlebot', 'TelegramBot', 'WhatsApp/2', 'facebookexternalhit', 'Twitterbot', 'Slackbot', 'HeadlessChrome', 'curl/8']) {
    const res = await s.request({ headers: { origin: 'https://www.houstonodorpros.com', 'user-agent': ua } });
    assert.equal(res.body.status, 'ignored');
  }
  assert.equal(s.calls.length, 0);
  assert.equal((await server({ configured: false }).request()).code, 503);
  assert.equal((await s.request({ body: { path: '/unknown/private@example.com', sessionId: 'test-session-00000001' } })).code, 400);
  const ok = await s.request({ headers: { origin: 'https://www.houstonodorpros.com', 'user-agent': browserUA, 'content-type': 'application/json', 'x-vercel-ip-city': 'Sugar%20Land', 'x-vercel-ip-country-region': 'TX', 'x-vercel-ip-country': 'US', 'x-real-ip': '192.0.2.123', 'x-vercel-ip-latitude': '29.6197' }, body: { path: '/services?email=private@example.com#contact', sessionId: 'test-session-00000001', testOnly: true, Email: 'must-not-send@example.com' } });
  assert.equal(ok.code, 200); assert.equal(ok.body.status, 'accepted');
  const sent = s.calls[0];
  assert.equal(sent.title, 'HOUSTON ODOR PROS — Website visitor'); assert.equal(sent.priority, 0);
  assert.equal(sent.message, 'TEST ONLY — visitor integration check.\nApprox. location: Sugar Land, TX, US');
  assert.doesNotMatch(sent.message, /Page:|\/services/);
  assert.deepEqual(Object.keys(sent).sort(), ['message', 'priority', 'title', 'token', 'url', 'user']);
  assert.doesNotMatch(JSON.stringify(sent), /private@|must-not-send|\?|#contact|192\.0\.2\.123|29\.6197/);
  const unavailable = server(); await unavailable.request(); assert.equal(unavailable.calls[0].message, 'Approx. location: Unavailable');
  const malformed = server(); await malformed.request({ headers: { origin: 'https://www.houstonodorpros.com', 'user-agent': browserUA, 'content-type': 'application/json', 'x-vercel-ip-city': 'private%40example.com', 'x-vercel-ip-country-region': 'invalid\nheader', 'x-vercel-ip-country': 'invalid' } }); assert.match(malformed.calls[0].message, /Approx\. location: Unavailable$/);
  const cookie = ok.headers['Set-Cookie'];
  assert.match(cookie, /__Host-hop_visitor=/); assert.match(cookie, /Secure; HttpOnly; SameSite=Lax/); assert.doesNotMatch(cookie, /Max-Age|Expires/);
  const repeat = await s.request({ headers: { origin: 'https://www.houstonodorpros.com', 'user-agent': browserUA, 'content-type': 'application/json', cookie: cookie.split(';')[0] }, body: { path: '/about', sessionId: 'test-session-00000002' } });
  assert.equal(repeat.body.status, 'suppressed'); assert.equal(s.calls.length, 1);
  assert.equal((await s.request()).body.status, 'suppressed');
  for (const provider of ['http-failure', 'bad-status', 'network']) {
    const failing = server({ provider });
    assert.equal((await failing.request()).code, 503);
    assert.equal((await failing.request()).body.status, 'suppressed');
    assert.equal(failing.calls.length, 1);
  }
  s = server();
  for (let i = 0; i < 4; i++) { const r = await s.request({ body: { path: '/', sessionId: 'minute-session-000' + i } }); assert.equal(r.body.status, i < 3 ? 'accepted' : 'throttled'); }
  assert.equal(s.calls.length, 3);
  s = server();
  for (let i = 0; i < 31; i++) { s.advance(70000); const r = await s.request({ body: { path: '/', sessionId: 'hourly-session-000' + i } }); assert.equal(r.body.status, i < 30 ? 'accepted' : 'throttled'); }
  assert.equal(s.calls.length, 30);
  let c = client({ visible: false }); assert.equal(c.timers.size, 0);
  c.visibility('visible'); assert.equal([...c.timers.values()][0].ms, 4000);
  c.visibility('hidden'); assert.equal(c.timers.size, 0);
  c.visibility('visible'); c.run(); assert.equal(c.calls.length, 1);
  assert.equal(JSON.parse(c.calls[0].body).path, '/services'); assert.doesNotMatch(c.calls[0].body, /private@|\?|secret/);
  assert.equal(c.stored.get('hop_visitor_attempt_v1'), '1');
  c.visibility('visible'); assert.equal(c.timers.size, 0);
  for (const options of [{ existing: true }, { webdriver: true }, { userAgent: 'TelegramBot' }]) assert.equal(client(options).timers.size, 0);
  c = client({ storageBlocked: true, providerFailure: true }); c.run(); await Promise.resolve(); c.visibility('visible'); assert.equal(c.calls.length, 1); assert.equal(c.timers.size, 0);
  console.log('PASS: visitor acceptance, missing secrets, provider failures, origin rejection, bots, signed secure session cookie, sessionStorage, visible 4s delay, query/contact stripping, session deduplication, 3/min + 30/hour throttles, and non-blocking client failures. No live notifications sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
