# HOUSTON ODOR PROS

Separate Houston edition of the LA ODOR PROS website. Domain: https://www.houstonodorpros.com. Email: houstonodorpros@gmail.com.

## Preview
Run `python preview.py` and open http://127.0.0.1:8096/. Clean page URLs are supported. Local preview does not send real email.

## Deploy
Deploy this folder as its own Vercel project, using the existing vercel.json. Do not deploy over the LA project. No build step is needed. Forms post to /api/estimate; configure RESEND_API_KEY, LEAD_TO_EMAIL=houstonodorpros@gmail.com, and a verified LEAD_FROM_EMAIL in that project. The onboarding@resend.dev default is for restricted Resend test sending only; production delivery requires a verified sender/domain.

Houston phone: (713) 444-4742. Click-to-call links use tel:+17134444742; estimate and email contact remain available. Chat answers FAQs and opens the Free Estimate form instead of giving prices.

Google tracking is intentionally blank pending the separate Houston tag. Add the Houston ID to site-config.js when supplied. Tawk.to monitoring is also blank until a Houston property is supplied, so no Houston traffic is sent to the LA property. Retain the existing chatbot.

Review cards were replaced with service expectations. No LA reviews are represented as Houston reviews. No business street address, reviews, or opening hours were invented.

## Files
service-area.html explains core, regional, and extended appointment areas. SERVICE-AREA-RESEARCH.md records the sources and distance qualifications. texas.css adds the Houston-specific styling while preserving the familiar page structure.
