/**
 * Scales overflowing page content to fit within the fixed page height.
 */

const SKIP_PAGE_TYPES = new Set(["cover", "back"]);

export function fitContentPages(rootEl) {
  if (!rootEl) return;

  for (const pageEl of rootEl.querySelectorAll(".page")) {
    const pageType = pageEl.dataset.page;
    if (!SKIP_PAGE_TYPES.has(pageType)) continue;

    const body = pageEl.querySelector(".page-body");
    if (!body) continue;

    body.classList.add("page-body--fit");
    body.style.zoom = "1";

    const available = body.clientHeight;
    const content = body.scrollHeight;
    if (!available || content <= available) continue;

    body.style.zoom = String((available / content) * 0.96);
  }
}
