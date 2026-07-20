/**
 * Resolves page/section layout based on page config and description visibility.
 */

export function effectivePageType(page, ctx) {
  if (ctx.descriptionsVisible && page.typeWithDescription) {
    return page.typeWithDescription;
  }
  return page.type;
}

export function effectiveSectionLayout(section, page, ctx) {
  if (ctx.descriptionsVisible && section.layoutWithDescription) {
    return section.layoutWithDescription;
  }
  const pageType = effectivePageType(page, ctx);
  return section.layout || (pageType === "one-col" ? "one-col" : "two-col");
}

function usesMergedOneColFlow(page, ctx) {
  if (ctx.descriptionsVisible) return false;
  if (page.type !== "one-col") return false;
  const sections = page.sections || [];
  if (sections.length < 2) return false;
  return sections.every((section) => section.layout === "two-col");
}

export function pageBodyClass(page, ctx) {
  const pageType = effectivePageType(page, ctx);
  const sectionCount = page.sections?.length || 0;
  if (pageType === "biryani") return "";
  if (pageType === "two-col") {
    return sectionCount > 1 ? "two-col-grid" : "sections-stack";
  }
  if (pageType === "multi") return "multi-grid";
  if (usesMergedOneColFlow(page, ctx)) return "one-col-grid";
  return "sections-stack";
}

export function resolvedItemColumns(section, page, ctx) {
  if (section.itemColumns != null) return section.itemColumns;
  if (usesMergedOneColFlow(page, ctx)) return 1;
  const pageType = effectivePageType(page, ctx);
  const layout = effectiveSectionLayout(section, page, ctx);
  if (layout === "two-col" && pageType === "one-col") return 2;
  return 1;
}

export function sectionClassAttr(section, page, ctx) {
  const pageType = effectivePageType(page, ctx);
  const layout = effectiveSectionLayout(section, page, ctx);
  const itemColumns = resolvedItemColumns(section, page, ctx);
  const classes = [];
  if (layout === "two-col" && (pageType === "two-col" || pageType === "multi")) {
    classes.push("section--two-col");
  }
  if (itemColumns === 2) classes.push("section--items-2");
  return classes.length ? ` class="${classes.join(" ")}"` : "";
}

export function biryaniBodyLayout(page, ctx) {
  const layout = effectivePageType(page, ctx);
  const sectionCount = page.sections?.length || 0;
  if (layout === "two-col" && sectionCount > 1) return "two-col-grid";
  if (layout === "one-col" && sectionCount > 1) return "sections-stack";
  return "";
}
