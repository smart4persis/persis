/**
 * Resolves page layout: only "one-col" (stacked) or "flow" (CSS 2-column flow).
 */

export function effectivePageType(page, ctx) {
  if (ctx.descriptionsVisible && page.typeWithDescription) {
    return page.typeWithDescription;
  }
  return page.type;
}

export function pageBodyClass(page, ctx) {
  const pageType = effectivePageType(page, ctx);
  if (pageType === "flow") return "flow-cols";
  return "sections-stack";
}
