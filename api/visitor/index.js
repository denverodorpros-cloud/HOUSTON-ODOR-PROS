const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

const ORIGINS = new Set(['https://www.houstonodorpros.com', 'https://houstonodorpros.com']);
const PATHS = new Set(['/', '/services', '/about', '/faq', '/service-area',
  '/odor-removal-houston', '/pet-odor-removal-houston', '/smoke-odor-removal-houston',
  '/cooking-odor-removal-houston', '/vehicle-odor-removal-houston',
  '/real-estate-odor-removal-houston', '/boat-rv-odor-removal-houston', '/thank-you']);
const BOT = /bot|crawl|spider|slurp|preview|headless|facebookexternalhit|facebot|whatsapp|telegram|twitter|slack|discord|linkedin|pinterest|embedly|skypeuripreview|google-inspectiontool|lighthouse|pagespeed|curl|wget|python|node-fetch|undici|go-http-client/i;
const COOKIE = '__Host-hop_visitor';
// Best-effort, per warm function instance. No IP addresses or customer data are used.
let attempts = [];
const sessions = new Map();

function signature(value, token) {
  return createHmac('sha256', token).update('houston-visitor-v1:' + value).digest('hex');
}
function hasSessionCookie(header, token) {
  const cookie = String(header || '').split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE + '='));
  if (!cookie) return false;
  const value = cookie.slice(COOKIE.length + 1);
  const match = /^([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return false;
  return timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(signature(match[1], token), 'hex'));
}
function pathOnly(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) return null;
  const pathname = value.split(/[?#]/, 1)[0];
  return PATHS.has(pathname) ? pathname : null;
}

function approximateLocation(headers) {
  // Vercel supplies coarse geolocation. Never forward the underlying IP or coordinates.
  let city = '';
  try { city = decodeURIComponent(headers['x-vercel-ip-city'] || ''); } catch { /* Unknown city. */ }
  city = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,63}$/u.test(city) ? city : '';
  const region = /^[A-Za-z0-9-]{1,8}$/.test(headers['x-vercel-ip-country-region'] || '') ? headers['x-vercel-ip-country-region'].toUpperCase() : '';
  const country = /^[A-Za-z]{2}$/.test(headers['x-vercel-ip-country'] || '') ? headers['x-vercel-ip-country'].toUpperCase() : '';
  return [city, region, country].filter(Boolean).join(', ') || 'Unavailable';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  const origin = req.headers.origin;
  if (!ORIGINS.has(origin) || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) {
    return res.status(403).json({ ok: false });
  }
  // No CORS headers: unrelated origins cannot read or invoke this through normal browsers.
  const userAgent = String(req.headers['user-agent'] || '');
  if (!userAgent || BOT.test(userAgent)) return res.status(200).json({ ok: true, status: 'ignored' });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ ok: false });
  const body = req.body;
  const pagePath = pathOnly(body?.path);
  const sessionId = body?.sessionId;
  if (!pagePath || typeof sessionId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(sessionId)) {
    return res.status(400).json({ ok: false });
  }
  const token = process.env.PUSHOVER_APP_TOKEN;
  const user = process.env.PUSHOVER_USER_KEY;
  if (!token || !user) return res.status(503).json({ ok: false });
  if (hasSessionCookie(req.headers.cookie, token)) return res.status(200).json({ ok: true, status: 'suppressed' });

  const now = Date.now();
  for (const [id, at] of sessions) if (now - at > 6 * 60 * 60 * 1000) sessions.delete(id);
  if (sessions.has(sessionId)) return res.status(200).json({ ok: true, status: 'suppressed' });
  // Record attempted sessions, including provider failures/throttling: never retry into a flood.
  if (sessions.size >= 2000) sessions.delete(sessions.keys().next().value);
  sessions.set(sessionId, now);
  const cookieId = randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `${COOKIE}=${cookieId}.${signature(cookieId, token)}; Path=/; Secure; HttpOnly; SameSite=Lax`);
  attempts = attempts.filter(at => now - at < 60 * 60 * 1000);
  if (attempts.filter(at => now - at < 60000).length >= 3 || attempts.length >= 30) {
    return res.status(200).json({ ok: true, status: 'throttled' });
  }
  attempts.push(now);
  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000),
      body: JSON.stringify({
        token, user, priority: 0,
        title: 'HOUSTON ODOR PROS — Website visitor',
        message: `${body.testOnly === true ? 'TEST ONLY — visitor integration check.' : 'New browser session.'}\nPage: ${pagePath}\nApprox. location: ${approximateLocation(req.headers)}`
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.status !== 1) return res.status(503).json({ ok: false });
    // Never return or log credentials, provider payloads, or visitor data.
    return res.status(200).json({ ok: true, status: 'accepted' });
  } catch {
    return res.status(503).json({ ok: false });
  }
};
