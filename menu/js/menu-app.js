/**
 * Menu app bootstrap: load data, render pages, fit overflow, wire UI.
 */
import { buildMenu } from "./menu-builder.js";
import { fitContentPages } from "./menu-fit.js";
import { renderMenu } from "./menu-renderer.js";

function asset(path) {
  return globalThis.__MENU_BASE__ + String(path).replace(/^\.\//, "");
}

const ctx = {
  menuData: null,
  menuAssets: {
    logo: "./assets/logo-new.png",
    background: "./assets/background.jpg",
  },
  descriptionsVisible: true,
};

let refitTimer = null;

const descIconShow = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16M4 10h16M4 14h10" />
        <path d="M18 16v4" />
        <path d="M16 18h4" />
      </svg>`;
const descIconHide = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16M4 10h16M4 14h16" />
      </svg>`;

function isMobileView() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function shouldUseMobileLayout(options = {}) {
  if (options.mobile === false) return false;
  if (options.mobile === true) return true;
  return isMobileView();
}

function mountMenu(options = {}) {
  if (!ctx.menuData) return;
  const root = document.getElementById("menu-root");
  const mobile = shouldUseMobileLayout(options);
  document.body.classList.toggle("mobile-menu", mobile);
  root.innerHTML = renderMenu(ctx.menuData, ctx, { mobile });
  if (!mobile) {
    requestAnimationFrame(() => fitContentPages(root));
  }
}

function mountDesktopForPrint() {
  mountMenu({ mobile: false });
  fitContentPages(document.getElementById("menu-root"));
}

function restoreScreenLayout() {
  mountMenu();
}

function scheduleRefit() {
  clearTimeout(refitTimer);
  refitTimer = setTimeout(() => {
    requestAnimationFrame(() => mountMenu());
  }, 80);
}

function updateDescriptionsToggle(toggleBtn) {
  document.body.classList.toggle("show-descriptions", ctx.descriptionsVisible);
  toggleBtn.setAttribute("aria-pressed", String(ctx.descriptionsVisible));
  const label = ctx.descriptionsVisible ? "Hide descriptions" : "Show descriptions";
  toggleBtn.title = label;
  toggleBtn.setAttribute("aria-label", label);
  toggleBtn.innerHTML = ctx.descriptionsVisible ? descIconHide : descIconShow;
}

const toggleDescriptionsBtn = document.getElementById("toggle-descriptions");
const printMenuBtn = document.getElementById("print-menu");

toggleDescriptionsBtn.addEventListener("click", () => {
  ctx.descriptionsVisible = !ctx.descriptionsVisible;
  updateDescriptionsToggle(toggleDescriptionsBtn);
  scheduleRefit();
});

printMenuBtn.addEventListener("click", () => {
  mountDesktopForPrint();
  requestAnimationFrame(() => window.print());
});
window.addEventListener("resize", scheduleRefit);
window.addEventListener("beforeprint", mountDesktopForPrint);
window.addEventListener("afterprint", restoreScreenLayout);

Promise.all([
  fetch(asset("assets/menu-config.json")).then((res) => {
    if (!res.ok) throw new Error("Failed to load menu-config.json");
    return res.json();
  }),
  fetch(asset("assets/clover_categories.json")).then((res) => {
    if (!res.ok) throw new Error("Failed to load clover_categories.json");
    return res.json();
  }),
])
  .then(([config, categories]) => {
    ctx.menuData = buildMenu(config, categories);
    updateDescriptionsToggle(toggleDescriptionsBtn);
    mountMenu();
  })
  .catch((err) => {
    document.getElementById("menu-root").innerHTML =
      `<p class="loading">Could not load menu: ${err.message}. Run from a local server (npx serve .).</p>`;
  });
