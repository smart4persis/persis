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

  function sectionHeaderUnit(section) {
    return {
      kind: "section-header",
      sectionTitle: section.title,
      subtitle: section.subtitle,
      layout: section.layout,
      layoutWithDescription: section.layoutWithDescription,
      itemColumns: section.itemColumns,
    };
  }

  function flattenSection(section) {
    return [sectionHeaderUnit(section), ...sectionUnits(section)];
  }

  function flattenPage(page) {
    const units = [];
    if (page.type === "biryani") {
      if (page.title) units.push({ kind: "biryani-title" });
      if (page.subtitle) units.push({ kind: "biryani-subtitle" });
    }

    for (const section of page.sections || []) {
      units.push(sectionHeaderUnit(section));
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
        layoutWithDescription: unit.layoutWithDescription,
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
      if (meta?.layoutWithDescription) copy.layoutWithDescription = meta.layoutWithDescription;
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

  function buildTwoColPairPage(page, leftUnits, rightUnits, chunkIndex, sectionMeta, biryaniUnits) {
    const leftSections = rebuildSections(leftUnits, sectionMeta);
    const rightSections = rebuildSections(rightUnits, sectionMeta);
    const pageCopy = clone(page);
    pageCopy.continuation = chunkIndex > 0;
    pageCopy.continuationIndex = chunkIndex + 1;

    if (page.type === "biryani") {
      if (pageCopy.continuation) {
        delete pageCopy.title;
        delete pageCopy.subtitle;
      } else {
        if (!biryaniUnits.some((unit) => unit.kind === "biryani-title")) delete pageCopy.title;
        if (!biryaniUnits.some((unit) => unit.kind === "biryani-subtitle")) delete pageCopy.subtitle;
      }
    }

    function sectionHasContent(section) {
      return Boolean(section?.items?.length || section?.groups?.length);
    }

    const pageSections = [];
    if (sectionHasContent(leftSections[0])) pageSections.push(leftSections[0]);
    if (sectionHasContent(rightSections[0])) pageSections.push(rightSections[0]);

    if (!pageSections.length) {
      pageSections.push(leftSections[0] || rightSections[0] || { title: page.sections[0].title, items: [] });
    }

    pageCopy.sections = pageSections;

    for (const section of pageCopy.sections) {
      const meta = sectionMeta.get(section.title);
      if (meta?.layout) section.layout = meta.layout;
      if (meta?.layoutWithDescription) section.layoutWithDescription = meta.layoutWithDescription;
      if (meta?.itemColumns != null) section.itemColumns = meta.itemColumns;
    }

    return pageCopy;
  }

  function measurePairPage(page, leftUnits, rightUnits, chunkIndex, sectionMeta, biryaniUnits, measurePage) {
    return measurePage(buildTwoColPairPage(page, leftUnits, rightUnits, chunkIndex, sectionMeta, biryaniUnits));
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

  function packTwoColParallel(page, measurePage) {
    const sections = page.sections || [];
    const sectionMeta = sectionMetaFromUnits(flattenPage(page));
    const biryaniUnits = flattenPage(page).filter(
      (unit) => unit.kind === "biryani-title" || unit.kind === "biryani-subtitle"
    );
    const leftAll = flattenSection(sections[0]);
    const rightAll = flattenSection(sections[1]);

    const pages = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < leftAll.length || rightIndex < rightAll.length) {
      let leftChunk = [];
      let rightChunk = [];
      let chunkIndex = pages.length;

      while (leftIndex < leftAll.length || rightIndex < rightAll.length) {
        let added = false;

        if (leftIndex < leftAll.length) {
          const nextLeft = leftAll[leftIndex];
          const overflow = measurePairPage(
            page,
            leftChunk.concat(nextLeft),
            rightChunk,
            chunkIndex,
            sectionMeta,
            biryaniUnits,
            measurePage
          );
          if (overflow <= 0) {
            leftChunk.push(nextLeft);
            leftIndex += 1;
            added = true;
          }
        }

        if (rightIndex < rightAll.length) {
          const nextRight = rightAll[rightIndex];
          const overflow = measurePairPage(
            page,
            leftChunk,
            rightChunk.concat(nextRight),
            chunkIndex,
            sectionMeta,
            biryaniUnits,
            measurePage
          );
          if (overflow <= 0) {
            rightChunk.push(nextRight);
            rightIndex += 1;
            added = true;
          }
        }

        if (!added) break;
      }

      if (!leftChunk.length && !rightChunk.length) {
        if (leftIndex < leftAll.length) {
          leftChunk.push(leftAll[leftIndex]);
          leftIndex += 1;
        } else if (rightIndex < rightAll.length) {
          rightChunk.push(rightAll[rightIndex]);
          rightIndex += 1;
        }
      }

      pages.push(buildTwoColPairPage(page, leftChunk, rightChunk, chunkIndex, sectionMeta, biryaniUnits));
    }

    return pages;
  }

  function shouldUseParallelTwoCol(page, getEffectivePageType) {
    if (!getEffectivePageType) return false;
    if ((page.sections || []).length !== 2) return false;
    return getEffectivePageType(page) === "two-col";
  }

  function paginateMenu(menu, measurePage, options) {
    const getEffectivePageType = options?.getEffectivePageType;
    const pages = [];

    for (const page of menu.pages) {
      if (!page.sections || page.type === "cover" || page.type === "back") {
        pages.push(page);
        continue;
      }

      if (page.paginate === false) {
        pages.push(page);
        continue;
      }

      if (shouldUseParallelTwoCol(page, getEffectivePageType)) {
        pages.push(...packTwoColParallel(page, measurePage));
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
