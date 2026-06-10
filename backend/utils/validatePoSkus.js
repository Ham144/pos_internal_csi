import InventoryRefrensi from "../models/InventoryRefrensi.model.js";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function findInventoryBySku(sku) {
  const trimmed = sku?.trim();
  if (!trimmed) return null;
  return InventoryRefrensi.findOne({
    sku: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
  });
}

// validasi & normalisasi sku item PO ke sku canonical di database
export async function validatePoItems(items = []) {
  const missingSkus = [];
  const duplicatedSkus = [];
  const skuSet = new Set();
  const normalizedItems = [];

  for (const item of items) {
    const rawSku = item.sku?.trim();
    if (!rawSku) {
      missingSkus.push("(kosong)");
      continue;
    }

    const key = rawSku.toUpperCase();
    if (skuSet.has(key)) {
      duplicatedSkus.push(rawSku);
      continue;
    }
    skuSet.add(key);

    const inventory = await findInventoryBySku(rawSku);
    if (!inventory) {
      missingSkus.push(rawSku);
      continue;
    }

    normalizedItems.push({
      ...item,
      sku: inventory.sku,
      barcodeItem: item.barcodeItem || item.barcode || "",
    });
  }

  return {
    missingSkus: [...new Set(missingSkus)],
    duplicatedSkus: [...new Set(duplicatedSkus)],
    normalizedItems,
  };
}
