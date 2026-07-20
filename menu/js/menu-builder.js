/**
 * Builds printable menu pages from menu-config.json + clover_categories.json.
 *
 * Pipeline: raw Clover items → filter section → compact groups OR flat items → page objects
 */
import { buildCompactGroups, itemFromClover } from "./menu-grouping.js";

const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

function rawCategoryItems(categories, name, ignored) {
  if (ignored.includes(name)) return [];
  const cat = categories.find((c) => c.name === name && !c.deleted);
  if (!cat) return [];
  return (cat.items || []).filter((i) => !i.deleted && !i.hidden);
}

function isVegetarianSection(section) {
  const label = `${section.category || ""} ${section.title || ""}`.toLowerCase();
  if (/\bnon-?\s*veg\b/.test(label)) return false;
  return /\bveg\b/.test(label);
}

function sortSectionsVegetarianFirst(sections) {
  return [...sections].sort((a, b) => {
    const av = isVegetarianSection(a);
    const bv = isVegetarianSection(b);
    if (av === bv) return 0;
    return av ? -1 : 1;
  });
}

function matchesSectionFilter(raw, section) {
  const name = raw.name || "";
  if (section.names?.length && !section.names.includes(name)) return false;
  if (section.nameIncludes && !name.includes(section.nameIncludes)) return false;
  const excludes = [].concat(section.nameExcludes || []).filter(Boolean);
  if (excludes.some((part) => name.includes(part))) return false;
  return true;
}

function resolveSection(section, categories, ignored) {
  const title = section.title || section.category;
  let raw = rawCategoryItems(categories, section.category, ignored);
  if (section.names || section.nameIncludes || section.nameExcludes) {
    raw = raw.filter((item) => matchesSectionFilter(item, section));
  }
  const offset = section.offset || 0;
  if (section.limit != null) raw = raw.slice(offset, offset + section.limit);
  else if (offset) raw = raw.slice(offset);

  const display = section.display ?? "compact";
  const layout = section.layout;
  const layoutWithDescription =
    section.layoutWithDescription || section.typeWithDescription || null;
  if (layout != null && layout !== "one-col" && layout !== "two-col") {
    throw new Error(
      `Section "${title}" has invalid layout "${layout}"; use "one-col" or "two-col".`
    );
  }
  if (
    layoutWithDescription != null &&
    layoutWithDescription !== "one-col" &&
    layoutWithDescription !== "two-col"
  ) {
    throw new Error(
      `Section "${title}" has invalid layoutWithDescription "${layoutWithDescription}".`
    );
  }

  let itemColumns = section.itemColumns;
  if (itemColumns != null && itemColumns !== 1 && itemColumns !== 2) {
    throw new Error(
      `Section "${title}" has invalid itemColumns "${itemColumns}"; use 1 or 2.`
    );
  }

  if (display === "compact") {
    return {
      title,
      subtitle: section.subtitle,
      note: section.note,
      layout,
      layoutWithDescription,
      itemColumns,
      groups: buildCompactGroups(raw, title, fmt),
    };
  }

  return {
    title,
    subtitle: section.subtitle,
    note: section.note,
    layout,
    layoutWithDescription,
    itemColumns,
    items: raw.map((i) => itemFromClover(i, fmt)),
  };
}

function resolvePage(page, categories, ignored) {
  if (!page.sections) return page;
  if (
    page.typeWithDescription != null &&
    page.typeWithDescription !== "one-col" &&
    page.typeWithDescription !== "two-col" &&
    page.typeWithDescription !== "multi" &&
    page.typeWithDescription !== "biryani"
  ) {
    throw new Error(
      `Page "${page.id}" has invalid typeWithDescription "${page.typeWithDescription}".`
    );
  }
  const sections = sortSectionsVegetarianFirst(page.sections);
  return {
    ...page,
    sections: sections.map((s) => resolveSection(s, categories, ignored)),
  };
}

export function buildMenu(config, categories) {
  const ignored = config.ignoredCategories || [];
  const maxPages = config.maxPages ?? 11;

  const menu = {
    restaurant: config.restaurant,
    assets: config.assets,
    pages: config.pages.map((p) => resolvePage(p, categories, ignored)),
  };

  if (menu.pages.length > maxPages) {
    throw new Error(
      `Menu config has ${menu.pages.length} pages; maximum allowed is ${maxPages}.`
    );
  }

  return menu;
}
