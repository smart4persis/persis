## Persis Biryani Indian Grill — Online Menu Agent Notes

# Requirements
- Ignore the Specials category from the online menu
- Separate page for lunch menu
- No more than 11 pages
- Should be able to update easily by fetching latest data from clover_categories.json
- Do not hardcode. Use the data from clover_categories.json

## How to update the menu
1. Pull latest Clover data: `node scripts/fetch-clover-categories.js` (items sorted by price ascending, then name)
2. Edit `assets/menu-config.json` to change page layout or ignored categories (category names must match Clover)
3. Preview: `npx serve .` from repo root, open `/menu/`

## JavaScript modules (`js/`)
| File | Role |
|------|------|
| `menu-app.js` | Entry point: fetch JSON, bootstrap UI |
| `menu-builder.js` | Merge config + Clover data into page objects |
| `menu-grouping.js` | Compact display grouping heuristics |
| `menu-layout.js` | Page/section layout resolution |
| `menu-renderer.js` | HTML rendering |
| `menu-fit.js` | CSS zoom to fit overflowing page content |

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
- **Page `"type": "flow"`** — CSS multi-column flow layout; all sections flow continuously through two columns. When a section overflows the first column it continues in the second, and the next section picks up where the previous left off (no forced grid cell assignment)
- Optional `"itemColumns": 1 | 2` overrides the layout default
- On mobile (≤900px), all item columns and flow-cols collapse to a single column for readability

### Page overflow (CSS fit)
- After render, each content page is measured against the fixed page height (`--page-h`)
- When content overflows, the page body is scaled down uniformly with CSS `zoom` so it fits on one printed page
- Cover and back pages are never scaled
- If a page scales too small, split it into two pages in `menu-config.json` (e.g. move one section to a new page entry)
- Fit recalculates on window resize and when descriptions are toggled
