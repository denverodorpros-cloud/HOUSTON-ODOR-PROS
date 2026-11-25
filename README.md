# HOUSTON ODOR PROS

Separate Houston edition of the LA ODOR PROS website. Domain: https://www.houstonodorpros.com. Email: houstonodorpros@gmail.com.

## Preview
Run `node preview-server.cjs` and open http://127.0.0.1:8097/. Clean page URLs and the existing redirects are supported. Local preview never sends real email. The original `python preview.py` static preview remains available on port 8096.

For local form QA only, add `?previewEmail=accept` or `?previewEmail=reject` to a page URL. A visible simulation banner appears; the unchanged estimate handler runs against a mock provider. Without that query the local endpoint reports an unconfigured backend and the form shows the Houston phone/email fallback. These modes exist only in the local preview server, not the deployed API.

Checks: `node tests/site-checks.cjs`, `node tests/estimate-api.cjs`, and `node tests/chatbot.cjs`. The site preservation check compares with the current Git HEAD and is intended to review the pending redesign.

## Visitor notifications

The visitor-only `/api/visitor` endpoint uses production Secrets `PUSHOVER_APP_TOKEN` and `PUSHOVER_USER_KEY`. Never put their values in source, browser configuration, or logs. The shared script waits four continuous seconds on a visible production page and attempts one notification per browser session. It sends only a known public page path and a random session identifier to the endpoint; the provider receives only the path, fixed title, normal priority, and the server-side Pushover credentials. Visitor alerts are independent of forms; separate estimate alerts were enabled at the user's request on November 25, 2026.

Suppression uses sessionStorage, an opaque signed `__Host-hop_visitor` cookie (`Secure; HttpOnly; SameSite=Lax; Path=/`, no persistent expiry), and a bounded in-memory session cache. Common crawlers, preview agents, and browser automation are skipped. Requests without an allowed Houston Origin, or with a cross-site Fetch Metadata header, are rejected. Origin checks are browser protections, not authentication against a caller spoofing HTTP headers.

The function allows at most 3 attempts per minute and 30 per hour **per warm server instance**. These are best-effort limits, not a durable global cap: cold starts or parallel instances reset/separate counters. No IP-based tracking or shared database is used. Genuine visits above those limits are skipped for that session. Provider outages are not retried during the same session. Pushover account quotas, blocked JavaScript/storage/cookies, browser session restoration, and simultaneous first visits in different tabs can affect delivery or deduplication. A visitor leaving or hiding the page before four seconds does not alert.

Run `node tests/visitor.cjs` for mocked notification, privacy, security, session, visibility-delay and throttling checks. No live notifications are sent by this test. The endpoint accepts `testOnly:true` for a clearly labelled test message; it does not bypass cookie/session suppression, origin checks, bot filtering, or throttling.

## Estimate notifications

After Resend accepts a valid estimate request for email delivery, `/api/estimate` sends a normal-priority Pushover alert titled `HOUSTON ODOR PROS — Free Estimate request`. This covers the homepage, landing page, boat/RV form, and chat estimate form, all using the existing endpoint. The alert contains only a fixed service label and an allowlisted Houston page path. It never includes names, phone numbers, email addresses, property addresses, messages, query parameters, or chat history. Full request details remain in the existing business email.

These alerts reuse Houston's production Pushover secrets and are independent of visitor-session suppression, so separate successful requests in the same session can each alert. Invalid requests and rejected emails do not generate an estimate alert. Missing Pushover credentials, provider rejection, or a notification timeout (4 seconds maximum) never changes a successfully emailed request into a form error. The response includes a non-sensitive `notification` status for diagnostics. No automatic push retry is performed. `testOnly:true` labels a QA notification but does not skip validation or email delivery. Run `node tests/estimate-api.cjs` for privacy and failure checks with mocked providers.

## Deploy
Deploy this folder as its own Vercel project, using the existing vercel.json. Do not deploy over the LA project. No build step is needed. Forms post to /api/estimate; configure RESEND_API_KEY, LEAD_TO_EMAIL=houstonodorpros@gmail.com, and a verified LEAD_FROM_EMAIL in that project. The onboarding@resend.dev default is for restricted Resend test sending only; production delivery requires a verified sender/domain.

Houston phone: (713) 444-4742. Click-to-call links use tel:+17134444742; estimate and email contact remain available. Chat answers FAQs and opens the Free Estimate form instead of giving prices.

Google tracking is intentionally blank pending the separate Houston tag. Add the Houston ID to site-config.js when supplied. Tawk.to monitoring is also blank until a Houston property is supplied, so no Houston traffic is sent to the LA property. Retain the existing chatbot.

Review cards were replaced with service expectations. No LA reviews are represented as Houston reviews. No business street address, reviews, or opening hours were invented.

## Files
service-area.html explains core, regional, and extended appointment areas. SERVICE-AREA-RESEARCH.md records the sources and distance qualifications. texas.css adds the Houston-specific styling while preserving the familiar page structure.
