# Persis Biryani Indian Grill — Website Agent Notes

## Current Goal
Maintain a single-page, SEO-optimized restaurant website for local discovery and foot traffic.

## Business Details
- Name: Persis Biryani Indian Grill
- Address: 1460 Eldridge Pkwy Ste 130, Houston, TX 77077
- Website: https://www.persisbiryanihouston.com
- Primary ordering URL: https://www.clover.com/online-ordering/persis-biryani-indian-gr-houston
- Google Maps URL (current): https://www.google.com/maps/place/Persis+Biryani+Indian+grill/@29.7591235,-95.6260007,17z

## Site Requirements (Active)
- Single page only
- Premium Indian restaurant visual style
- High-quality food visuals
- Mobile-first layout
- Google Maps integration
- Fast loading and clean UI

## SEO Requirements (Active)
- Optimize for local intent: "Restaurant near me", "Restaurant", "Indian", "Biryani", "Butter Chicken", "Naan", "Tandoori", "Lamb Chops", "Tandoori Lamb Chops", "Persis", "Persis Biryani", "Persis Indian", "Persis Indian Grill",  "Persis Biryani Indian Grill"
- Whole Houston coverage — Energy Corridor, River Oaks, Tanglewood, Bellaire, Sugar Land, Katy, The Woodlands, Memorial, Westchase, and 30+ neighborhoods
- Include Restaurant schema and accurate business hours

## Menu Highlights to Keep
- Hyderabad Dum Biryani (Chicken / Goat)
- Tandoori Lamb Chops
- Karampodi Chicken
- Chicken 65
- Ghee Roast
- Rich Indian Entrees

## Business Hours (from provided Google hours)
- Monday: Closed
- Tuesday: 11:30 AM–2:30 PM, 5:00 PM–9:30 PM
- Wednesday: 11:30 AM–2:30 PM, 5:00 PM–9:30 PM
- Thursday: 11:30 AM–2:30 PM, 5:00 PM–9:30 PM
- Friday: 11:30 AM–3:00 PM, 5:00 PM–10:00 PM
- Saturday: 11:30 AM–3:00 PM, 5:00 PM–10:00 PM
- Sunday: 11:30 AM–3:00 PM, 5:00 PM–9:30 PM

## Asset Organization (Current)
Primary page assets are now under:
- `assets/images/hero/`
- `assets/images/menu/`
- `assets/images/brand/`
- `assets/images/badges/`

### Used in page currently
- `assets/images/hero/background.webp`
- `assets/images/hero/hero.webp` (og:image / twitter meta only)
- `assets/images/menu/biryanis.webp`
- `assets/images/menu/image.webp`
- `assets/images/menu/entrees-table.webp`
- `assets/images/brand/persis-logo.webp`
- `assets/images/badges/halal-logo.webp`
- `assets/images/badges/doordash.webp`
- `assets/images/badges/ubereats.webp`
- `assets/images/badges/grubhub.webp`

## Audit & Fixes (April 5, 2026)
- Fixed FAQ accordion: restructured from plain `<p>` tags to proper `<button class="faq-btn">` + `<div class="faq-body" hidden>` pattern; wired up event listeners (previously `toggleFaq()` was defined but never called)
- Added `og:image` and `twitter:image` meta tags pointing to `hero.webp`
- Added `<link rel="canonical" href="https://www.persisbiryani.com/" />`
- Added `"telephone": "+1-832-534-3813"` to Restaurant schema
- Expanded FAQ answers with more detailed copy
- Canonical domain: `https://www.persisbiryanihouston.com/`

## SEO Improvements (April 5, 2026)
- Added `<link rel="preload">` for hero image (LCP optimization)
- Added FAQPage structured data (JSON-LD) for Google rich results
- Enhanced Restaurant schema: added `image`, `geo`, `description`, `acceptsReservations`, `currenciesAccepted`, `paymentAccepted`, expanded `areaServed` (Katy, Briar Forest)
- Fixed `og:url` to use canonical domain instead of Clover URL
- Added 3 more FAQ items: halal, business hours, vegetarian — targets long-tail local queries
- Added visible hours grid to the location section (not only in footer)
- Added section label + heading hierarchy to location section for crawl/structure
- Created `robots.txt`
- Created `sitemap.xml` pointing to canonical homepage

## How to Run Locally
- **Always use `npx serve .`** — do NOT use any other server
- `npx serve .` from the project root to start a local server
- Open `http://localhost:3000` in a browser
- No build step required — single static HTML file with inline CSS/JS

## Delivery Partners (April 10, 2026)
- Added DoorDash, Uber Eats, and Grubhub as delivery partners
- Links appear in hero section (below CTA) and menu section ("Why Locals Choose Us" card)
- Official badge images stored in `assets/images/badges/`
- DoorDash: https://www.doordash.com/store/persis-biryani-indian-grill-houston-42125831/
- Uber Eats: https://www.ubereats.com/store/persis-biryani-indian-grill-houston-tx/48G73c39VamktUwAq7Hmig
- Grubhub: https://www.grubhub.com/restaurant/persis-biryani-indian-grill-1460-eldridge-parkway-130-houston/14326704
- Updated Restaurant schema `sameAs` to include all delivery partner URLs
- Updated FAQ answer for pickup/delivery to mention all partners
- Cleaned up all unused images; moved `biryanis.png` from `src-images/` to `assets/images/menu/`
- `src-images/` folder is now empty

## SEO Updates (April 11, 2026)
- Simplified `<title>` from "Persis Biryani Indian Grill | Restaurant Near Me in Houston, TX 77077" to "Persis Biryani Indian Grill | Houston, TX 77077"
- Expanded `keywords` meta tag: added `restaurant`, `indian restaurant`, `indian restaurant in houston`, `best lamb chops`, `best tandoori`; moved generic terms earlier in the list for priority weighting

## SEO & Menu Updates (April 14, 2026)
- Added **Tandoori Lamb Chops** as a featured menu item across the site:
  - Added to `keywords` meta: `lamb chops`, `lamb chops Houston`, `lamb chops near me`, `best lamb chops Houston`, `Indian lamb chops`, `tandoori lamb chops`, `tandoori lamb chops Houston`
  - Added to `meta description` and `og:description`
  - Added to Restaurant schema `servesCuisine` ("Lamb Chops")
  - Added to schema `description`
  - Added to FAQ answer for popular dishes (both schema and visible)
  - Added to hero description paragraph
- Broadened SEO and copy for **whole Houston** (not just Energy Corridor):
  - Expanded `areaServed` schema to 39 areas: River Oaks, Tanglewood, West University Place, Bellaire, Piney Point Village, Hunters Creek Village, Bunker Hill Village, Hedwig Village, Spring Valley Village, Memorial Villages, Sugar Land, Missouri City, Stafford, Pearland, Friendswood, The Woodlands, Spring Branch, Garden Oaks, Heights, Galleria, Greenway Plaza, Midtown Houston, Museum District, Meyerland, Alief, Cypress, Spring
  - Updated `keywords` to include `Houston restaurant`, `best Indian restaurant Houston`, `Houston TX Indian restaurant`
  - Updated hero eyebrow from "Houston Energy Corridor · Est. in Houston, TX" to "1460 Eldridge Pkwy · Houston, TX 77077"
  - Updated hero desc to "Serving all of Houston, TX"
  - Updated meta description to "Serving all of Houston"
  - Updated schema description to reference full Houston coverage
  - Updated FAQ "areas served" answer (schema + visible) to list River Oaks, Tanglewood, Bellaire, Sugar Land, The Woodlands, etc.

## Notes
- Keep content wording stable unless explicitly requested; design/layout updates are allowed.