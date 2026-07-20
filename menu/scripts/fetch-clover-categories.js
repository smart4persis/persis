#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const MENU_DIR = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const OUT_PATH = path.join(MENU_DIR, "assets", "clover_categories.json");
const DESC_PATH = path.join(MENU_DIR, "assets", "menu-descriptions-report.json");
const CLIENT_PATH = path.join(ROOT, "clovercli", "dist", "lib", "client.js");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
  if (process.env.CLOVER_REGION) {
    process.env.CLOVER_REGION = process.env.CLOVER_REGION.toLowerCase();
  }
}

function descriptionMapFromFile(filePath) {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const categories = Array.isArray(data) ? data : data.items || [];

  if (Array.isArray(data)) {
    for (const category of categories) {
      for (const item of category.items || []) {
        if (item.id && item.menuDescription) map.set(item.id, item.menuDescription);
      }
    }
    return map;
  }

  for (const item of categories) {
    if (item.id && item.menuDescription) map.set(item.id, item.menuDescription);
  }
  return map;
}

function sortItemsByPriceThenName(items) {
  return [...items].sort((a, b) => {
    const priceDiff = (a.price ?? 0) - (b.price ?? 0);
    if (priceDiff !== 0) return priceDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function normalizeItem(item, descriptions) {
  const next = { ...item };
  const menuDescription = descriptions.get(item.id);
  if (menuDescription) next.menuDescription = menuDescription;
  else delete next.menuDescription;
  return next;
}

function normalizeCategory(category, descriptions) {
  const items = sortItemsByPriceThenName(
    (category.items?.elements || category.items || []).map((item) =>
      normalizeItem(item, descriptions)
    )
  );

  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    deleted: category.deleted ?? false,
    items,
  };
}

async function fetchCategories(client) {
  const all = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const data = await client.request(
      "GET",
      `/v3/merchants/{mId}/categories?expand=items&limit=${limit}&offset=${offset}`
    );
    const batch = data.elements || [];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return all;
}

async function main() {
  loadEnv(ENV_PATH);

  const descriptions = descriptionMapFromFile(OUT_PATH);
  for (const [id, desc] of descriptionMapFromFile(DESC_PATH)) {
    if (!descriptions.has(id)) descriptions.set(id, desc);
  }

  const { CloverClient } = await import(CLIENT_PATH);
  const client = new CloverClient();
  const categories = await fetchCategories(client);

  const normalized = categories
    .map((category) => normalizeCategory(category, descriptions))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  const itemCount = normalized.reduce((sum, cat) => sum + cat.items.length, 0);
  const describedCount = normalized.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.menuDescription).length,
    0
  );

  console.log(`Updated ${OUT_PATH}`);
  console.log(`Categories: ${normalized.length}`);
  console.log(`Items: ${itemCount}`);
  console.log(`Items with menuDescription: ${describedCount}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
