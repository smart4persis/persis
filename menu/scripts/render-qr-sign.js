#!/usr/bin/env node
"use strict";

const { chromium } = require("playwright");
const path = require("path");

const MENU_DIR = path.join(__dirname, "..");
const HTML_PATH = path.join(MENU_DIR, "qr-sign.html");
const PNG_PATH = path.join(MENU_DIR, "assets", "qr-menu-sign.png");
const PDF_PATH = path.join(MENU_DIR, "assets", "qr-menu-sign.pdf");

const PAGE_W_IN = 4;
const PAGE_H_IN = 6;
const RENDER_DPI = 300;
const CSS_DPI = 96;
const SCALE = RENDER_DPI / CSS_DPI;
const VIEWPORT_W = Math.round(PAGE_W_IN * CSS_DPI);
const VIEWPORT_H = Math.round(PAGE_H_IN * CSS_DPI);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_W, height: VIEWPORT_H },
    deviceScaleFactor: SCALE,
  });
  const page = await context.newPage();

  await page.goto(`file://${HTML_PATH}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  await page.pdf({
    path: PDF_PATH,
    width: `${PAGE_W_IN}in`,
    height: `${PAGE_H_IN}in`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.screenshot({
    path: PNG_PATH,
    type: "png",
    fullPage: false,
    animations: "disabled",
  });

  await browser.close();
  console.log(`Wrote ${PNG_PATH} (${PAGE_W_IN}x${PAGE_H_IN} in @ ${RENDER_DPI} DPI)`);
  console.log(`Wrote ${PDF_PATH} (${PAGE_W_IN}x${PAGE_H_IN} in)`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
