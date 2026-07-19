/**
 * Builds printable menu pages from menu-config.json + clover_categories.json.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.buildMenu = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

  function getItemDescription(i) {
    if (i.menuDescription) return i.menuDescription;
    if (i.description) return i.description;
    if (i.onlineDescription) return i.onlineDescription;
    if (i.descriptionText) return i.descriptionText;
    if (i.descriptionHtml) return i.descriptionHtml.replace(/<[^>]*>/g, "").trim();
    return "";
  }

  function itemFromClover(i) {
    return {
      name: i.onlineName || i.name,
      groupName: i.name,
      price: fmt(i.price),
      priceCents: i.price ?? 0,
      description: getItemDescription(i),
    };
  }

  function groupingName(item) {
    return item.groupName || item.name;
  }

  function words(name) {
    return name.trim().split(/\s+/);
  }

  function dominantFirstToken(items) {
    const counts = {};
    for (const item of items) {
      const token = words(groupingName(item))[0];
      if (token) counts[token] = (counts[token] || 0) + 1;
    }
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return null;
    const [token, count] = ranked[0];
    return count >= items.length * 0.6 ? token : null;
  }

  function longestCommonWordPrefix(names) {
    if (!names.length) return "";
    const first = words(names[0]);
    let matchLen = 0;
    for (let i = 1; i <= first.length; i++) {
      const prefix = `${first.slice(0, i).join(" ")} `;
      if (names.every((n) => n.startsWith(prefix))) matchLen = i;
      else break;
    }
    return matchLen ? `${first.slice(0, matchLen).join(" ")} ` : "";
  }

  function pickGroupBlurb(items) {
    const descs = items.map((i) => (i.description || "").trim()).filter(Boolean);
    if (!descs.length) return "";
    return descs.reduce((best, d) => (d.length > best.length ? d : best), descs[0]);
  }

  function variantFromItem(item, label) {
    return {
      label,
      price: item.price,
      priceCents: item.priceCents ?? 0,
      description: item.description || "",
    };
  }

  function isNonVegetarianName(name) {
    return /\b(chicken|mutton|lamb|goat|shrimp|prawn|fish|egg|meat|non-?\s*veg|chevon|beef|pork|seafood|crab|nugget)\b/i.test(
      name.trim()
    );
  }

  function isVegetarianName(name) {
    if (isNonVegetarianName(name)) return false;
    const l = name.trim().toLowerCase();
    if (l.startsWith("veg ") || l === "veg") return true;
    if (l.includes("vegetable")) return true;
    if (/\bveg\b/.test(l)) return true;
    if (l.includes("paneer")) return true;
    return false;
  }

  function vegetarianPriority(name) {
    if (isNonVegetarianName(name)) return 2;
    if (isVegetarianName(name)) return 0;
    return 1;
  }

  function vegetarianSortRank(name) {
    const l = name.trim().toLowerCase();
    if (l.startsWith("veg ") || l === "veg") return 0;
    if (l.includes("paneer")) return 1;
    if (l.includes("vegetable")) return 2;
    if (/\bveg\b/.test(l)) return 3;
    return 4;
  }

  function compareVegetarianFirst(aName, bName) {
    const ap = vegetarianPriority(aName);
    const bp = vegetarianPriority(bName);
    if (ap !== bp) return ap - bp;
    if (ap === 0) return vegetarianSortRank(aName) - vegetarianSortRank(bName);
    return 0;
  }

  function sortItemsVegetarianFirst(items) {
    return [...items].sort((a, b) => compareVegetarianFirst(a.name, b.name));
  }

  function sortItemsByPriceThenName(items) {
    return [...items].sort((a, b) => {
      const priceDiff = (a.priceCents ?? 0) - (b.priceCents ?? 0);
      if (priceDiff !== 0) return priceDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  function sortVariantsByPriceThenName(variants) {
    return [...variants].sort((a, b) => {
      const priceDiff = (a.priceCents ?? 0) - (b.priceCents ?? 0);
      if (priceDiff !== 0) return priceDiff;
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });
  }

  function groupMinPriceCents(group) {
    return Math.min(...group.variants.map((variant) => variant.priceCents ?? 0));
  }

  function sortGroupsByPriceThenName(groups) {
    return [...groups].sort((a, b) => {
      const priceDiff = groupMinPriceCents(a) - groupMinPriceCents(b);
      if (priceDiff !== 0) return priceDiff;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }

  function withPriceSortedVariants(group) {
    return { ...group, variants: sortVariantsByPriceThenName(group.variants) };
  }

  function groupFromSharedPrefix(items, title) {
    const names = items.map((i) => groupingName(i));
    const prefix = longestCommonWordPrefix(names);
    const groupTitle = prefix.trim() || title || names[0];
    return {
      title: groupTitle,
      blurb: pickGroupBlurb(items),
      variants: items.map((item) => {
        const name = groupingName(item);
        return variantFromItem(
          item,
          prefix ? name.slice(prefix.length).trim() || name : name
        );
      }),
    };
  }

  function prefixWordCount(prefix) {
    return words(prefix.trim()).length;
  }

  function stripLeadingToken(name, token) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return name.replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
  }

  function clusterBySharedPrefix(rawItems) {
    const groups = [];
    const consumed = new Set();

    for (let i = 0; i < rawItems.length; i++) {
      if (consumed.has(i)) continue;

      let cluster = [rawItems[i]];
      let clusterIndices = [i];

      for (let j = i + 1; j < rawItems.length; j++) {
        if (consumed.has(j)) continue;
        const prefix = longestCommonWordPrefix([
          ...cluster.map((raw) => raw.name),
          rawItems[j].name,
        ]);
        if (prefixWordCount(prefix) >= 2) {
          cluster.push(rawItems[j]);
          clusterIndices.push(j);
        }
      }

      if (cluster.length >= 2 && prefixWordCount(longestCommonWordPrefix(cluster.map((raw) => raw.name))) >= 2) {
        clusterIndices.forEach((idx) => consumed.add(idx));
        groups.push(groupFromSharedPrefix(cluster.map(itemFromClover)));
      }
    }

    return { groups, remaining: rawItems.filter((_, idx) => !consumed.has(idx)) };
  }

  function clusterUngroupedCompactGroups(rawItems, sectionTitle) {
    const { groups, remaining: afterPrefix } = clusterBySharedPrefix(rawItems);
    const remainingRaw = afterPrefix;
    const remainingItems = remainingRaw.map(itemFromClover);

    if (remainingItems.length >= 2) {
      const token = dominantFirstToken(remainingItems);
      if (token) {
        const clusterRaw = remainingRaw.filter(
          (raw) => words(raw.name)[0]?.toLowerCase() === token.toLowerCase()
        );
        const clusterItems = clusterRaw.map(itemFromClover);
        if (clusterRaw.length >= 2) {
          const sample = stripLeadingToken(groupingName(clusterItems[0]), token);
          if (sample && !/^&/.test(sample)) {
            const clusterSet = new Set(clusterRaw);
            return [
              ...groups,
              groupFromDominantPrefix(clusterItems, sectionTitle),
              ...groupByStyleSuffix(
                remainingRaw.filter((raw) => !clusterSet.has(raw)).map(itemFromClover)
              ),
            ];
          }
        }
      }
    }

    if (remainingItems.length) {
      return [...groups, ...groupByStyleSuffix(remainingItems)];
    }

    return groups;
  }

  function groupFromDominantPrefix(items, sectionTitle) {
    const token = dominantFirstToken(items);
    return {
      title: sectionTitle,
      blurb: pickGroupBlurb(items),
      variants: items.map((item) => {
        const name = groupingName(item);
        return variantFromItem(item, stripLeadingToken(name, token) || name);
      }),
    };
  }

  function groupByStyleSuffix(items) {
    const map = new Map();
    for (const item of items) {
      const name = groupingName(item);
      const parts = words(name);
      if (parts.length === 2) {
        map.set(`__solo__${name}`, {
          title: name,
          blurb: item.description,
          solo: true,
          variants: [variantFromItem(item, parts[0])],
        });
        continue;
      }
      if (parts.length < 2) {
        map.set(`__solo__${name}`, {
          title: name,
          blurb: item.description,
          solo: true,
          variants: [variantFromItem(item, name)],
        });
        continue;
      }
      const style = parts.slice(1).join(" ");
      if (!map.has(style)) map.set(style, { title: style, variants: [] });
      const group = map.get(style);
      group.variants.push(variantFromItem(item, parts[0]));
    }

    return [...map.values()].map((group) => {
      const blurb = pickGroupBlurb(group.variants);
      if (group.solo) return { ...group, blurb: blurb || group.blurb };
      if (group.variants.length === 1) {
        const v = group.variants[0];
        const full = `${v.label} ${group.title}`.trim();
        return {
          title: full,
          blurb: blurb || v.description,
          variants: [{ ...v, label: v.label }],
        };
      }
      return { ...group, blurb };
    });
  }

  function buildCompactGroupsForPrice(rawItems, sectionTitle) {
    if (!rawItems.length) return [];

    const byItemGroup = new Map();
    const ungroupedRaw = [];

    for (const raw of rawItems) {
      const gid = raw.itemGroup?.id;
      if (gid) {
        if (!byItemGroup.has(gid)) byItemGroup.set(gid, []);
        byItemGroup.get(gid).push(raw);
      } else {
        ungroupedRaw.push(raw);
      }
    }

    const groups = [];

    for (const [, cluster] of byItemGroup) {
      groups.push(groupFromSharedPrefix(cluster.map(itemFromClover)));
    }

    if (ungroupedRaw.length) {
      groups.push(...clusterUngroupedCompactGroups(ungroupedRaw, sectionTitle));
    }

    return groups;
  }

  function buildCompactGroups(rawItems, sectionTitle) {
    if (!rawItems.length) return [];

    const groups = buildCompactGroupsForPrice(rawItems, sectionTitle);
    return sortGroupsByPriceThenName(groups.map(withPriceSortedVariants));
  }

  function categoryItems(categories, name, ignored) {
    if (ignored.includes(name)) return [];
    const cat = categories.find((c) => c.name === name && !c.deleted);
    if (!cat) return [];
    return (cat.items || []).filter((i) => !i.deleted && !i.hidden).map(itemFromClover);
  }

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
    if (display === "compact") {
      return {
        title,
        subtitle: section.subtitle,
        note: section.note,
        groups: buildCompactGroups(raw, title),
      };
    }

    return {
      title,
      subtitle: section.subtitle,
      items: raw.map(itemFromClover),
    };
  }

  function resolvePage(page, categories, ignored) {
    if (!page.sections) return page;
    const sections = sortSectionsVegetarianFirst(page.sections);
    return {
      ...page,
      sections: sections.map((s) => resolveSection(s, categories, ignored)),
    };
  }

  function buildMenu(config, categories) {
    const ignored = config.ignoredCategories || [];
    const maxPages = config.maxPages ?? 11;

    const menu = {
      restaurant: config.restaurant,
      assets: config.assets,
      pages: config.pages.map((p) => resolvePage(p, categories, ignored)),
    };

    if (menu.pages.length > maxPages) {
      throw new Error(`Menu has ${menu.pages.length} pages; maximum allowed is ${maxPages}.`);
    }

    return menu;
  }

  return buildMenu;
});
