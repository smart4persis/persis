/**
 * Post-render fitting: splits overflowing flow-cols pages into continuations.
 *
 * With column-fill:balance (default), columns grow equally. If content exceeds
 * the container height, scrollHeight > clientHeight. We detect that and move
 * the overflow items onto a new continuation page.
 */

function getAllFlowItems(flowBody) {
  const items = [];
  for (const section of flowBody.querySelectorAll(":scope > section")) {
    const children = [...section.children];
    for (const child of children) {
      if (
        child.classList.contains("menu-item") ||
        child.classList.contains("biryani-section") ||
        child.classList.contains("biryani-item-block")
      ) {
        items.push({ el: child, section });
      }
    }
  }
  return items;
}

function findOverflowItems(flowBody) {
  const containerRect = flowBody.getBoundingClientRect();
  const cutoffBottom = containerRect.top + flowBody.clientHeight;
  const cutoffRight = containerRect.left + flowBody.clientWidth;

  const items = getAllFlowItems(flowBody);
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].el.getBoundingClientRect();
    // Item overflows vertically (below balanced columns) or horizontally (extra columns)
    if (rect.top >= cutoffBottom - 1 || rect.left >= cutoffRight - 1) {
      return { splitIdx: i, items };
    }
  }
  return { splitIdx: -1, items };
}

function createContinuationPage(sourcePageEl) {
  const cont = document.createElement("div");
  cont.className = sourcePageEl.className;

  const bg = sourcePageEl.querySelector(".page-bg");
  if (bg) cont.appendChild(bg.cloneNode(true));
  const border = sourcePageEl.querySelector(".page-border");
  if (border) cont.appendChild(border.cloneNode(true));

  const inner = document.createElement("div");
  inner.className = "page-inner";
  const chrome = sourcePageEl.querySelector(".page-chrome");
  if (chrome) inner.appendChild(chrome.cloneNode(true));

  const body = document.createElement("div");
  body.className = sourcePageEl.querySelector(".page-body").className;
  inner.appendChild(body);
  cont.appendChild(inner);

  return { cont, body };
}

function splitFlowPage(pageEl) {
  const flowBody = pageEl.querySelector(".flow-cols");
  if (!flowBody) return false;

  const { splitIdx, items } = findOverflowItems(flowBody);
  if (splitIdx < 0) return false;

  const splitItem = items[splitIdx];
  const { cont, body } = createContinuationPage(pageEl);
  const sections = [...flowBody.querySelectorAll(":scope > section")];
  const splitSection = splitItem.section;
  const splitSectionIdx = sections.indexOf(splitSection);

  // Find item's position within its section
  const sectionItems = [...splitSection.querySelectorAll(
    ":scope > .menu-item, :scope > .biryani-section, :scope > .biryani-item-block"
  )];
  const itemIdx = sectionItems.indexOf(splitItem.el);

  if (itemIdx === 0) {
    // Move entire section and all after
    for (let i = splitSectionIdx; i < sections.length; i++) {
      body.appendChild(sections[i]);
    }
  } else {
    // Mid-section split
    const contSection = document.createElement("section");
    contSection.className = splitSection.className;
    const titleEl = splitSection.querySelector(":scope > .section-title");
    if (titleEl) contSection.appendChild(titleEl.cloneNode(true));
    const subtitleEl = splitSection.querySelector(":scope > .section-subtitle");
    if (subtitleEl) contSection.appendChild(subtitleEl.cloneNode(true));

    for (let j = itemIdx; j < sectionItems.length; j++) {
      contSection.appendChild(sectionItems[j]);
    }
    body.appendChild(contSection);

    for (let i = splitSectionIdx + 1; i < sections.length; i++) {
      body.appendChild(sections[i]);
    }
  }

  pageEl.after(cont);
  return true;
}

function lockFlowHeights(rootEl) {
  for (const flowBody of rootEl.querySelectorAll(".flow-cols")) {
    flowBody.style.height = flowBody.clientHeight + "px";
  }
}

export function fitContentPages(rootEl) {
  if (!rootEl) return;

  // Set explicit pixel height so column-fill:auto has a definite height
  lockFlowHeights(rootEl);

  let maxPasses = 20;
  while (maxPasses-- > 0) {
    const flowPages = rootEl.querySelectorAll(".page:has(.flow-cols)");
    let didSplit = false;
    for (const pageEl of flowPages) {
      if (splitFlowPage(pageEl)) {
        // Lock height on the new continuation page too
        const next = pageEl.nextElementSibling;
        if (next) {
          const fb = next.querySelector(".flow-cols");
          if (fb) fb.style.height = fb.clientHeight + "px";
        }
        didSplit = true;
        break;
      }
    }
    if (!didSplit) break;
  }
}
