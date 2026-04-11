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
- Optimize for local intent: "Restaurant near me", "Restaurant", "Indian", "Biryani", "Butter Chicken", "Naan", "Tandoori", "Persis", "Persis Biryani", "Persis Indian", "Persis Indian Grill",  "Persis Biryani Indian Grill"
- Houston neighborhood relevance (Energy Corridor, West Houston, Westchase, Memorial)
- Include Restaurant schema and accurate business hours

## Menu Highlights to Keep
- Hyderabad Dum Biryani (Chicken / Goat)
- Karampodi Chicken
- Chicken 65
- Ghee Roast
- Rich Indian Entrees

## Business Hours (from provided Google hours)
- Monday: Closed
- Tuesday: 11:00 AM–2:30 PM, 5:00 PM–9:00 PM
- Wednesday: 11:00 AM–2:30 PM, 5:00 PM–9:00 PM
- Thursday: 11:00 AM–2:30 PM, 5:00 PM–9:00 PM
- Friday: 11:00 AM–3:00 PM, 5:00 PM–9:30 PM
- Saturday: 11:00 AM–3:00 PM, 5:00 PM–9:30 PM
- Sunday: 11:00 AM–3:00 PM, 5:00 PM–9:00 PM

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

## Notes
- Keep content wording stable unless explicitly requested; design/layout updates are allowed.