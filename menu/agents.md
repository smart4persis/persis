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

### Section layout
- Page `"type"` sets the default layout; optional `"typeWithDescription"` overrides it while descriptions are visible (e.g. `"one-col"` normally, `"two-col"` when descriptions are on)
- Section `"layoutWithDescription"` overrides section `"layout"` while descriptions are visible (legacy alias: section `"typeWithDescription"`)
- `"layout": "one-col"` — single column of items (default on stacked pages)
- `"layout": "two-col"` on a stacked/`one-col` page — items flow in **two columns** within the section (e.g. Entrees without descriptions)
- `"layout": "two-col"` on a `two-col` page — section sits in half the page, single-column items
- Optional `"itemColumns": 1 | 2` overrides the layout default
- On mobile (≤900px), all item columns collapse to a single column for readability

### Automatic continuation pages
- On every load (and on resize / description toggle), content pages are measured against the fixed page height
- When items no longer fit — because Clover added more items, descriptions are shown, or the viewport is narrower — overflow is moved to a new continuation page with the same logo header
- Cover and back are never split
- `maxPages` in config applies to configured pages; continuation pages from overflow may push the printed total higher (a console warning is logged)
