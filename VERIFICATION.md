# Houston edition verification — November 9, 2026

## Local redesign review — November 24, 2026

This section records the current local redesign; the older entries below are historical. The initial review was local only. The user approved committing and pushing the finished redesign on November 24, 2026. Baseline: `d89fcfd`.

- Inspected the current live Houston site, repository, and Denver visual reference. Used layout, spacing, typography, palette, button treatment, and city-badge styling as reference only. Houston's existing header logo was preserved byte-for-byte; existing photos, six services, contact details, regional coverage, URLs, metadata, schema, redirects, email handler, and integration configuration were retained.
- Unified navigation across pages. Header Free Estimate goes to the separate existing `/odor-removal-houston` landing page. Home remains available in the mobile dropdown. Added original Houston hero/getting-started copy, consistent photo cards, a clear process section, dimensional green city badges, updated estimate layout, and a contact footer without a logo. Removed an existing LA wording error and unsupported result-guarantee claims from the landing page, smoke page, and chatbot.
- Reviews omitted at the user's request; Houston's widget/Business Profile will be supplied later. No Denver or LA reviews, profile, ratings, certifications, or business data were inserted.
- Cropped the supplied favicon's whitespace (original 1024-square source; emblem bounds 313,306–712,708), retained a small safe margin, and created 32px/192px browser PNGs, 180px Apple touch icon, and ICO sizes 16–256px. All page icon URLs use `?v=20261124`.

### Verification evidence

- Static preservation check passed: 14 HTML documents (13 public pages plus the legacy redirect document), 4 valid JSON-LD blocks, and 332 local references. Existing title/meta/canonical/schema strings match baseline. Header logo, `vercel.json`, `site-config.js`, and `api/estimate/index.js` are unchanged. All telephone and email links are Houston's. HTML attribute-duplication check passed.
- Browser layout checks passed for all 13 public pages at desktop 1440×1000, phone 390×844, and narrow 320×740: no horizontal overflow or broken loaded images. Visually inspected home, mobile menu, estimate landing page, city badges, and service-page layout. Screenshots are kept locally in ignored `.local-preview/`.
- Clicked all six service-directory links and confirmed destinations. Clicked header Free Estimate to the separate landing page. Mobile dropdown opens/closes; Free Estimate navigates and closes the menu; Home returns to the homepage. Telephone targets verified as `tel:+17134444742`; no actual phone call was placed.
- Browser form checks: required inputs and invalid email are blocked; missing local email configuration and simulated provider rejection show the Houston call/email fallback, retain fields, and re-enable submission. Simulated accepted submissions from the landing page, homepage at mobile width, and dedicated boat/RV form redirect to `/thank-you`. Boat/RV required fields and unit selection verified. No local test sends email.
- API mocked-provider checks passed for 405, invalid input 400, missing config 500, provider rejection 502, network failure 500, accepted response, HTML escaping, and Houston recipient. Existing chatbot regression suite passed (20 FAQ answers, 15 conversation cases, quote routing, success redirect and failure fallback). No unexpected console errors observed in the final browser check.
- One authorized live **TEST ONLY** request submitted directly to `https://www.houstonodorpros.com/api/estimate`. Used the public Houston business email and a message explicitly stating not to schedule or call back. HTTP 200 returned `ok:true`, provider ID `01a20ed5-d81e-7a29-93db-71384c7dce3c`. This confirms provider acceptance, not confirmed inbox delivery. No second live request was sent. Local browser tests exercised the form UI separately.
- Analytics/Tawk loader code remains present and unchanged; `site-config.js` still has empty Houston Google tag/Tawk values. No explicit Google Ads conversion event was present in the baseline. Analytics collection and conversion attribution therefore have **not** been verified. No Denver or LA tracking IDs were substituted.

### Remaining items

- Local preview approved for commit and push on November 24, 2026. Live deployment verification remains separate.
- Add Houston's own reviews widget/Business Profile later, as requested.
- Supply Houston analytics/Google Ads configuration when ready; then verify actual events and conversions separately.
- Confirm the TEST ONLY email in the destination inbox if delivery confirmation is needed.

---

Built as a separate project for houstonodorpros.com. The LA website and its repository were not changed or deployed.

## Passed

- Twelve page documents: home, services directory, five services, about, 20-question FAQ, service area, Google Ads landing page, and thank-you page.
- Internal links, local assets, and anchor targets resolve. Structured-data JSON parses. No LA phone, domain, email, Google tag, or Tawk property appears in the Houston page content.
- Houston-specific titles, descriptions, canonicals, robots.txt, sitemap, and LocalBusiness schema. No phone number or street address invented.
- Original globe PNG used as favicon, Apple touch icon, and chat header icon. Supplied wide logo preserved; a background-removed variant used in headers and footer.
- Desktop home screenshot checked. All twelve pages checked at phone width; no horizontal overflow detected. Mobile navigation opens correctly. No broken images reported in those page checks.
- Browser chat test confirmed a pricing question opens the integrated Free Estimate form and displays no price. Browser console showed no JavaScript errors in the checked home flow.
- Offline chatbot checks: 20 FAQ answers, 15 conversation cases, eight quote requests opening the form without amounts, auto-open/close/reopen, square-footage prefill, submission payload/history, success redirect, and failure fallback.
- Email handler checked with a mocked provider: Houston recipient, Houston branding, and success response. No real email sent.
- Google tracking and Tawk.to configuration left empty for separate Houston accounts.

## Before launch

- Houston phone added: (713) 444-4742. All twelve pages have click-to-call links using tel:+17134444742; chatbot contact replies and business schema updated.
- Add the separate Houston Google tag when supplied.
- Configure Resend credentials, recipient, and a verified sender in the separate Houston Vercel project; confirm a real submitted lead arrives. Local preview deliberately does not send email.
- Add a separate Houston Tawk.to property if desired. LA visitor tracking is not reused.
- Domain connection and public deployment have not been performed.

## Visual-check access

Automatic approval review rejected reading the entire ChatGPT window because unrelated private conversation content could be exposed. A narrower, isolated Houston browser-tab check succeeded; no full-window retry was made.

## Service menu update
Standalone marijuana odor service removed from public marketing, forms, schema, and sitemap. Old service URLs redirect to smoke odor removal. Four promoted services remain. FAQ retains 20 entries, with move-in odor preparation replacing the cannabis question. Chat directs related questions to general smoke odor removal without quoting prices. LA website unchanged.

## Cooking odor service
Added cooking-odor-removal-houston.html, matching home/services/landing cards, estimate and chat form options, footer link, business schema, sitemap, redirect configuration, and chatbot service support. Service menu now contains five promoted services. Source cleaning is explained; no automatic pricing added. Kitchen photo from https://www.pexels.com/photo/steam-coming-out-of-a-pot-standing-on-an-electric-stove-8093839/ under the Pexels license.

## Cooking image replacement
Home and services cards plus the cooking page hero now use assets/cooking-kitchen-stove.png. Created with built-in ImageGen: photorealistic wide Texas home kitchen, food actively cooking in a skillet and saucepan, visible steam, no people or lettering. Visually inspected before installation. Supersedes the previous close-up stock cooking photo.

## Combined boat and RV service
Added exactly one page at /boat-rv-odor-removal-houston, with boat and RV sections, five FAQs, preparation/process information, Houston-area coverage, and one dedicated estimate form. Added the combined service to home/services/landing cards, general estimate/chat dropdowns, homepage footer, schema, sitemap, and redirects. Service menu now has six promoted services. Browser checks passed on desktop and at 390px phone width with no horizontal overflow. Corrected the unit-type dropdown during QA and verified its five options, selecting an RV and submitting a local test to confirm the contact fallback. No live email sent. Offline chatbot tests include boats, RVs, motorhomes, campervans, travel trailers, and quote routing without prices.

Image asset: assets/boat-rv-marina.png. Built-in ImageGen prompt: photorealistic wide Houston-area marina scene with a motorhome parked on land and cabin cruiser moored beside it, natural daylight, no text or people. Inspected before use.

## Texas vehicle image
Replaced sports-car stock imagery with assets/vehicle-odor-texas-pickup.png on the home card, services directory, and vehicle page hero. Created with built-in ImageGen using the prompt: photorealistic navy Texas pickup on a Houston brick-home driveway, open passenger door revealing a clean tan cabin, oak trees and natural daylight. Visually inspected; descriptive alt text updated.

## Texas logo colors
Recolored the wide logo and globe icon with built-in ImageGen to navy #122D4C, brick red #AD3E32, and white. Prompt: color change only, preserving the supplied ozone/tree/wave emblem, O3, exact HOUSTON ODOR PROS lettering, and Breathe Easy Again slogan; transparent background. Inspected both variants and applied assets/houston-wordmark-texas.png and assets/houston-globe-texas.png across headers, chat, favicons, Apple touch icons, and business schema. Originals preserved; footer logo remains removed.
