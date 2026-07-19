/**
 * Splits overflowing menu pages into continuation pages using DOM measurement.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.paginateMenu = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sectionUnits(section) {
    const units = [];
    if (section.items?.length) {
      section.items.forEach((item, index) => {
        units.push({ kind: "item", sectionTitle: section.title, item, index });
      });
      return units;
    }
    if (section.groups?.length) {
      section.groups.forEach((group, index) => {
        if (group.variants.length <= 1) {
          units.push({ kind: "group", sectionTitle: section.title, group, index });
          return;
        }
        units.push({ kind: "group-shell", sectionTitle: section.title, group, index });
        group.variants.forEach((variant, variantIndex) => {
          units.push({
            kind: "variant",
            sectionTitle: section.title,
            group,
            groupIndex: index,
            variant,
            variantIndex,
          });
        });
      });
    }
    return units;
  }

  function flattenPage(page) {
    const units = [];
    if (page.type === "biryani") {
      if (page.title) units.push({ kind: "biryani-title" });
      if (page.subtitle) units.push({ kind: "biryani-subtitle" });
    }

    for (const section of page.sections || []) {
      units.push({
        kind: "section-header",
        sectionTitle: section.title,
        subtitle: section.subtitle,
        layout: section.layout,
        itemColumns: section.itemColumns,
      });
      units.push(...sectionUnits(section));
    }
    return units;
  }

  function sectionMetaFromUnits(units) {
    const meta = new Map();
    for (const unit of units) {
      if (unit.kind !== "section-header" || meta.has(unit.sectionTitle)) continue;
      meta.set(unit.sectionTitle, {
        layout: unit.layout,
        itemColumns: unit.itemColumns,
      });
    }
    return meta;
  }

  function rebuildSections(units, sectionMeta) {
    const sections = [];
    const byTitle = new Map();

    function ensureSection(title, subtitle) {
      if (!byTitle.has(title)) {
        const section = { title, subtitle, items: null, groups: null, _itemList: null, _groupList: null };
        byTitle.set(title, section);
        sections.push(section);
      }
      const section = byTitle.get(title);
      if (subtitle && !section.subtitle) section.subtitle = subtitle;
      return section;
    }

    for (const unit of units) {
      if (unit.kind === "section-header") continue;

      const section = ensureSection(unit.sectionTitle);

      if (unit.kind === "item") {
        if (!section._itemList) {
          section._itemList = [];
          section.items = section._itemList;
        }
        section._itemList.push(clone(unit.item));
        continue;
      }

      if (!section._groupList) {
        section._groupList = [];
        section.groups = section._groupList;
      }

      if (unit.kind === "group") {
        section._groupList.push(clone(unit.group));
        continue;
      }

      if (unit.kind === "group-shell") {
        section._groupList.push({
          title: unit.group.title,
          blurb: unit.group.blurb,
          variants: [],
        });
        continue;
      }

      if (unit.kind === "variant") {
        let group = section._groupList[section._groupList.length - 1];
        if (!group || group.title !== unit.group.title) {
          group = { title: unit.group.title, blurb: unit.group.blurb, variants: [] };
          section._groupList.push(group);
        }
        group.variants.push(clone(unit.variant));
      }
    }

    return sections.map((section) => {
      const copy = { title: section.title };
      if (section.subtitle) copy.subtitle = section.subtitle;
      if (section.items?.length) copy.items = section.items;
      if (section.groups?.length) copy.groups = section.groups;
      const meta = sectionMeta?.get(section.title);
      if (meta?.layout) copy.layout = meta.layout;
      if (meta?.itemColumns != null) copy.itemColumns = meta.itemColumns;
      return copy;
    });
  }

  function chunkMeta(page, chunkUnits, chunkIndex, sectionMeta) {
    const hasBiryaniTitle = chunkUnits.some((unit) => unit.kind === "biryani-title");
    const hasBiryaniSubtitle = chunkUnits.some((unit) => unit.kind === "biryani-subtitle");
    const bodyUnits = chunkUnits.filter(
      (unit) => unit.kind !== "biryani-title" && unit.kind !== "biryani-subtitle"
    );

    const pageCopy = clone(page);
    pageCopy.continuation = chunkIndex > 0;
    pageCopy.continuationIndex = chunkIndex + 1;

    if (page.type === "biryani") {
      if (pageCopy.continuation) {
        delete pageCopy.title;
        delete pageCopy.subtitle;
      } else {
        if (!hasBiryaniTitle) delete pageCopy.title;
        if (!hasBiryaniSubtitle) delete pageCopy.subtitle;
      }
    }

    pageCopy.sections = rebuildSections(bodyUnits, sectionMeta);
    return pageCopy;
  }

  function packUnits(units, page, measurePage) {
    if (!units.length) return [page];

    const sectionMeta = sectionMetaFromUnits(units);
    const chunks = [];
    let current = [];

    for (const unit of units) {
      const candidateUnits = current.concat(unit);
      const candidatePage = chunkMeta(page, candidateUnits, chunks.length, sectionMeta);
      const overflow = measurePage(candidatePage);

      if (overflow > 0 && current.length > 0) {
        chunks.push(current);
        current = [unit];
      } else {
        current.push(unit);
      }
    }

    if (current.length) chunks.push(current);

    return chunks.map((chunkUnits, index) => chunkMeta(page, chunkUnits, index, sectionMeta));
  }

  function paginateMenu(menu, measurePage) {
    const pages = [];

    for (const page of menu.pages) {
      if (!page.sections || page.type === "cover" || page.type === "back") {
        pages.push(page);
        continue;
      }

      const units = flattenPage(page);
      const splitPages = packUnits(units, page, measurePage);
      pages.push(...splitPages);
    }

    return { ...menu, pages };
  }

  return paginateMenu;
});
