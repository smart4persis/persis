## Persis Biryani Indian Grill — Online Menu Agent Notes

# Requirements
- Ignore the Specials category from the online menu
- Separate page for lunch menu
- No more than 11 pages
- Should be able to update easily by fetching latest data from clover_categories.json
- Do not hardcode. Use the data from clover_categories.json

## How to update the menu
1. Pull latest Clover data: `node scripts/fetch-clover-categories.js` (items sorted by similarity clusters, then price ascending within each cluster)
2. Edit `assets/menu-config.json` to change page layout or ignored categories (category names must match Clover)
3. Refresh `index.html` in the browser

## QR menu sign
- Printable sign for `persisbiryanihouston.com/menu` lives in `assets/qr-menu-sign.png` and `assets/qr-menu-sign.pdf` (4×6 in, 300 DPI)
- Regenerate after URL/branding changes: `python3 scripts/generate-qr-sign.py` (requires `npm install` in `scripts/`)
- Source template: `qr-sign.html` (browser preview)

Sections only reference Clover **category names** — items, prices, and descriptions come entirely from the Clover export. Compact grouping is the default for all sections; set `"display": "standard"` on a section to use a flat item list instead.
