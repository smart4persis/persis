/**
 * Renders menu pages as HTML strings.
 */
import {
  biryaniBodyLayout,
  pageBodyClass,
  sectionClassAttr,
} from "./menu-layout.js";

function asset(path) {
  return globalThis.__MENU_BASE__ + String(path).replace(/^\.\//, "");
}

function applyAssets(assets, ctx) {
  ctx.menuAssets = {
    logo: assets?.logo || "./assets/logo-new.png",
    background: assets?.background || "./assets/background.jpg",
  };
  document.documentElement.style.setProperty(
    "--menu-bg",
    `url("${asset(ctx.menuAssets.background)}")`
  );
}

function pageDecorations() {
  return `
        <div class="page-bg" aria-hidden="true"></div>
        <div class="page-border"></div>`;
}

function pageHeader(name, ctx) {
  return `<header class="page-header"><img class="page-logo" src="${ctx.menuAssets.logo}" alt="${name}" width="180" height="68" /></header>`;
}

function renderItem(item) {
  const desc = item.description ? `<p class="item-desc">${item.description}</p>` : "";
  return `
        <article class="menu-item">
          <div class="item-header">
            <span class="item-name">${item.name}</span>
            <span class="item-price">${item.price}</span>
          </div>
          ${desc}
        </article>`;
}

function renderCompactGroup(g, section) {
  const note = section.note ? `<p class="biryani-note">${section.note}</p>` : "";
  if (g.variants.length === 1) {
    const v = g.variants[0];
    const desc = v.description ? `<p class="item-desc">${v.description}</p>` : "";
    return `
              <div class="biryani-section">
                <div class="biryani-item-block">
                  <div class="biryani-item">
                    <span class="item-name">${g.title}</span>
                    <span class="item-price">${v.price}</span>
                  </div>
                  ${desc}
                </div>
                ${note}
              </div>`;
  }
  const items = g.variants
    .map((v) => {
      const desc = v.description ? `<p class="item-desc">${v.description}</p>` : "";
      return `
        <div class="biryani-item-block">
          <div class="biryani-item">
            <span class="item-name">${v.label}</span>
            <span class="item-price">${v.price}</span>
          </div>
          ${desc}
        </div>`;
    })
    .join("");
  return `
              <div class="biryani-section biryani-section--variants">
                <h4 class="biryani-section-title">${g.title}</h4>
                <div class="biryani-items">${items}</div>
                ${note}
              </div>`;
}

function renderSection(section, page, ctx) {
  const classAttr = sectionClassAttr(section, page, ctx);
  const subtitle = section.subtitle
    ? `<p class="section-subtitle">${section.subtitle}</p>`
    : "";
  if (section.groups?.length) {
    const groups = section.groups.map((g) => renderCompactGroup(g, section)).join("");
    return `
        <section${classAttr}>
          <h2 class="section-title">${section.title}</h2>
          ${subtitle}
          ${groups}
        </section>`;
  }
  const items = (section.items || []).map(renderItem).join("");
  return `
        <section${classAttr}>
          <h2 class="section-title">${section.title}</h2>
          ${subtitle}
          ${items}
        </section>`;
}

function renderBiryaniSectionContent(section) {
  const subtitle = section.subtitle
    ? `<p class="section-subtitle">${section.subtitle}</p>`
    : "";
  const categoryHeader = `<h3 class="biryani-category-title">${section.title}</h3>`;
  const groups = (section.groups || []).map((g) => renderCompactGroup(g, section)).join("");
  return categoryHeader + subtitle + groups;
}

function renderBiryaniBody(page, ctx) {
  const sections = page.sections || [];
  const bodyClass = biryaniBodyLayout(page, ctx);
  let body;

  if (bodyClass === "two-col-grid" || bodyClass === "sections-stack") {
    body = sections
      .map(
        (section) =>
          `<div class="biryani-column">${renderBiryaniSectionContent(section)}</div>`
      )
      .join("");
  } else {
    body = sections.map(renderBiryaniSectionContent).join("");
  }

  return { body, bodyClass };
}

function renderBiryaniPage(page, r, ctx) {
  const pageSubtitle = page.subtitle
    ? `<p class="section-subtitle biryani-page-subtitle">${page.subtitle}</p>`
    : "";
  const { body, bodyClass } = renderBiryaniBody(page, ctx);

  const chrome = `
            ${pageHeader(r.name, ctx)}
            <h2 class="biryani-page-title">${page.title || ""}</h2>
            ${pageSubtitle}`;

  return `
        <div class="page" data-page="${page.id}">
          ${pageDecorations()}
          <div class="page-inner">
            <div class="page-chrome">${chrome}</div>
            <div class="page-body${bodyClass ? ` ${bodyClass}` : ""}">${body}</div>
          </div>
        </div>`;
}

function renderCover(r, ctx) {
  return `
        <div class="page cover" data-page="cover">
          <div class="page-bg" aria-hidden="true"></div>
          <div class="page-border"></div>
          <div class="page-inner">
            <div class="ornament" aria-hidden="true"></div>
            <p class="cover-welcome">Welcome to</p>
            <img class="cover-logo" src="${ctx.menuAssets.logo}" alt="${r.name}" width="320" height="120" />
            <p class="cover-desc">${r.welcome}</p>
            <div class="ornament" aria-hidden="true"></div>
            <p class="cover-tagline">${r.tagline}</p>
          </div>
        </div>`;
}

const socialIcons = {
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 3h3.9L15 8.7h3.5L17.8 14h-3.3v7h-4.2v-7H8.5v-5.3h1.8V9.5c0-2.2 1.3-4.1 3.9-4.1.9 0 1.7.1 2.3.2V3z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.6A4.4 4.4 0 1 0 16.4 12 4.4 4.4 0 0 0 12 7.6zm5.9-2.3a1 1 0 1 0-1 1 1 1 0 0 0 1-1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z"/></svg>`,
};

function renderBack(r, ctx) {
  const social = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: r.whatsapp,
      qr: "assets/qr-whatsapp-code.png",
    },
    {
      key: "facebook",
      label: "Facebook",
      url: r.facebook,
      qr: "assets/qr-facebook-code.png",
    },
    {
      key: "instagram",
      label: "Instagram",
      url: r.instagram,
      qr: "assets/qr-instagram-code.png",
    },
  ];

  const socialLinks = social
    .map(
      (s) =>
        `<a class="back-social-link back-social-link--${s.key}" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">${socialIcons[s.key]}</a>`
    )
    .join("");

  const socialQrs = social
    .map(
      (s) => `
            <div class="back-social-qr-item">
              <div class="back-social-qr-wrap">
                <img src="${asset(s.qr)}" alt="${s.label} QR code" width="156" height="156" />
              </div>
              <div class="back-social-qr-icon back-social-qr-icon--${s.key}" aria-label="${s.label}">${socialIcons[s.key]}</div>
            </div>`
    )
    .join("");

  return `
        <div class="page back" data-page="back">
          <div class="page-bg" aria-hidden="true"></div>
          <div class="page-border"></div>
          <div class="page-inner">
            <img class="back-logo" src="${ctx.menuAssets.logo}" alt="${r.name}" width="240" height="90" />
            <div class="ornament" aria-hidden="true"></div>
            <h2 class="back-title">Thank You</h2>
            <p class="back-sub">We Do All Kind of Caterings</p>
            <div class="ornament" aria-hidden="true"></div>
            <div class="back-contact">
              <p><strong>Restaurant:</strong> ${r.phone}</p>
              <p><strong>Catering:</strong> ${r.phone}</p>
              <p>${r.address}</p>
            </div>
            <div class="back-social">
              <p class="back-social-heading">Follow Us</p>
              <div class="back-social-links screen-only">${socialLinks}</div>
              <div class="back-social-qrs print-only">${socialQrs}</div>
            </div>
            <p class="back-website">${r.website}</p>
          </div>
        </div>`;
}

function renderStandardPage(page, r, ctx) {
  const cols = page.sections.map((section) => renderSection(section, page, ctx)).join("");
  return `
        <div class="page" data-page="${page.id}">
          ${pageDecorations()}
          <div class="page-inner">
            <div class="page-chrome">${pageHeader(r.name, ctx)}</div>
            <div class="page-body ${pageBodyClass(page, ctx)}">${cols}</div>
          </div>
        </div>`;
}

function renderMultiPage(page, r, ctx) {
  const sections = page.sections.map((section) => renderSection(section, page, ctx)).join("");
  return `
        <div class="page" data-page="${page.id}">
          ${pageDecorations()}
          <div class="page-inner">
            <div class="page-chrome">${pageHeader(r.name, ctx)}</div>
            <div class="page-body ${pageBodyClass(page, ctx)}">${sections}</div>
          </div>
        </div>`;
}

function renderContentPage(page, r, ctx) {
  if (page.type === "biryani") return renderBiryaniPage(page, r, ctx);
  if (page.type === "multi") return renderMultiPage(page, r, ctx);
  return renderStandardPage(page, r, ctx);
}

function isContentPage(page) {
  return page.type !== "cover" && page.type !== "back";
}

function renderMobileSectionBlock(page, ctx) {
  let html = "";
  if (page.title) {
    html += `<h2 class="mobile-page-heading">${page.title}</h2>`;
    if (page.subtitle) {
      html += `<p class="section-subtitle biryani-page-subtitle">${page.subtitle}</p>`;
    }
  }
  const mobilePage = { ...page, type: "one-col", typeWithDescription: "one-col" };
  html += (page.sections || [])
    .map((section) =>
      renderSection(
        {
          ...section,
          layout: "one-col",
          layoutWithDescription: "one-col",
          itemColumns: 1,
        },
        mobilePage,
        ctx
      )
    )
    .join("");
  return html;
}

function renderMobileMenuPage(pages, ctx) {
  const body = pages.map((page) => renderMobileSectionBlock(page, ctx)).join("");
  return `
        <div class="page page--mobile-menu" data-page="menu">
          ${pageDecorations()}
          <div class="page-inner">
            <div class="page-body mobile-sections-stack">${body}</div>
          </div>
        </div>`;
}

export function renderMenu(data, ctx, options = {}) {
  const r = data.restaurant;
  if (data.assets) applyAssets(data.assets, ctx);

  if (options.mobile) {
    const contentPages = data.pages.filter(isContentPage);
    return [renderCover(r, ctx), renderMobileMenuPage(contentPages, ctx), renderBack(r, ctx)].join(
      ""
    );
  }

  return data.pages
    .map((page) => {
      switch (page.type) {
        case "cover":
          return renderCover(r, ctx);
        case "back":
          return renderBack(r, ctx);
        default:
          return renderContentPage(page, r, ctx);
      }
    })
    .join("");
}
