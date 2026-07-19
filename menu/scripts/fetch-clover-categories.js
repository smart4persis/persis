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

function words(name) {
  return (name || "").trim().split(/\s+/);
}

function longestCommonWordPrefix(names) {
  if (!names.length) return "";
  const first = words(names[0]);
  let matchLen = 0;
  for (let i = 1; i <= first.length; i++) {
    const prefix = `${first.slice(0, i).join(" ")} `;
    if (names.every((name) => name.startsWith(prefix))) matchLen = i;
    else break;
  }
  return matchLen ? `${first.slice(0, matchLen).join(" ")} ` : "";
}

function prefixWordCount(prefix) {
  return words(prefix.trim()).length;
}

function styleSuffix(name) {
  const parts = words(name);
  if (parts.length < 3) return "";
  return parts.slice(1).join(" ");
}


function clusterBySharedPrefix(items) {
  const clusters = [];
  const consumed = new Set();

  for (let i = 0; i < items.length; i++) {
    if (consumed.has(i)) continue;

    const cluster = [items[i]];
    const clusterIndices = [i];

    for (let j = i + 1; j < items.length; j++) {
      if (consumed.has(j)) continue;
      const prefix = longestCommonWordPrefix([
        ...cluster.map((item) => item.name),
        items[j].name,
      ]);
      if (prefixWordCount(prefix) >= 2) {
        cluster.push(items[j]);
        clusterIndices.push(j);
      }
    }

    if (
      cluster.length >= 2 &&
      prefixWordCount(longestCommonWordPrefix(cluster.map((item) => item.name))) >= 2
    ) {
      clusterIndices.forEach((idx) => consumed.add(idx));
      clusters.push(cluster);
    }
  }

  return {
    clusters,
    remaining: items.filter((_, idx) => !consumed.has(idx)),
  };
}

function clusterByStyleSuffix(items) {
  const clusters = [];
  const consumed = new Set();
  const bySuffix = new Map();

  items.forEach((item, idx) => {
    const suffix = styleSuffix(item.name);
    if (!suffix) return;
    if (!bySuffix.has(suffix)) bySuffix.set(suffix, []);
    bySuffix.get(suffix).push({ item, idx });
  });

  for (const entries of bySuffix.values()) {
    if (entries.length < 2) continue;
    if (entries.some(({ idx }) => consumed.has(idx))) continue;
    entries.forEach(({ idx }) => consumed.add(idx));
    clusters.push(entries.map(({ item }) => item));
  }

  return {
    clusters,
    remaining: items.filter((_, idx) => !consumed.has(idx)),
  };
}

function clusterSimilarItems(items) {
  const clusters = [];
  const consumed = new Set();

  for (const item of items) {
    const groupId = item.itemGroup?.id;
    if (!groupId) continue;
    if (!clusters.some((cluster) => cluster[0]?.itemGroup?.id === groupId)) {
      const groupItems = items.filter((candidate) => candidate.itemGroup?.id === groupId);
      groupItems.forEach((candidate) => consumed.add(candidate.id));
      clusters.push(groupItems);
    }
  }

  let remaining = items.filter((item) => !consumed.has(item.id));

  const prefixPass = clusterBySharedPrefix(remaining);
  clusters.push(...prefixPass.clusters);
  remaining = prefixPass.remaining;

  const suffixPass = clusterByStyleSuffix(remaining);
  clusters.push(...suffixPass.clusters);
  remaining = suffixPass.remaining;

  for (const item of remaining) {
    clusters.push([item]);
  }

  return clusters;
}

function sortItemsBySimilarityThenPrice(items) {
  const clusters = clusterSimilarItems(items);

  clusters.sort((a, b) => {
    const minA = Math.min(...a.map((item) => item.price ?? 0));
    const minB = Math.min(...b.map((item) => item.price ?? 0));
    if (minA !== minB) return minA - minB;
    return a[0].name.localeCompare(b[0].name, undefined, { sensitivity: "base" });
  });

  const result = [];
  for (const cluster of clusters) {
    cluster.sort((a, b) => {
      const priceDiff = (a.price ?? 0) - (b.price ?? 0);
      if (priceDiff !== 0) return priceDiff;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    result.push(...cluster);
  }

  return result;
}

function normalizeItem(item, descriptions) {
  const next = { ...item };
  const menuDescription = descriptions.get(item.id);
  if (menuDescription) next.menuDescription = menuDescription;
  else delete next.menuDescription;
  return next;
}

function normalizeCategory(category, descriptions) {
  const items = sortItemsBySimilarityThenPrice(
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
