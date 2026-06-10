import fs from "fs";
import path from "path";
import csv from "csv-parser";
import DaftarPromo from "../models/DaftarPromo.model.js";
import Outlet from "../models/Outlet.model.js";
import { findInventoryBySku } from "../utils/validatePoSkus.js";
import { resolveSkuFromReq } from "../utils/resolveSku.js";
import {
  csvCell,
  detectCsvSeparatorFromFile,
} from "../utils/csvDelimiter.js";

const parseCommaList = (raw) => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const getAllPromo = async (req, res) => {
  const promos = await DaftarPromo.find({});
  return res.json({ message: "berhasil", data: promos, length: promos.length });
};

export const registerPromo = async (req, res) => {
  const {
    judulPromo,
    skuList,
    quantityBerlaku,
    berlakuDari,
    berlakuHingga,
    syaratQuantity,
    syaratTotalRp,
    skuBarangBonus,
    quantityBonus,
    authorizedOutlets,
    mode,
  } = req.body;

  try {
    // Validate required fields
    if (!judulPromo) {
      return res.status(400).json({ message: "judulPromo is required" });
    }
    if (!quantityBerlaku) {
      return res.status(400).json({ message: "quantityBerlaku is required" });
    }
    if (!berlakuHingga) {
      return res.status(400).json({ message: "berlakuHingga is required" });
    }
    if (!skuBarangBonus) {
      return res.status(400).json({ message: "skuBarangBonus is required" });
    }

    const promoData = {
      judulPromo,
      skuList: skuList || [],
      quantityBerlaku: parseInt(quantityBerlaku),
      berlakuDari: berlakuDari ? new Date(berlakuDari) : new Date(),
      berlakuHingga: new Date(berlakuHingga),
      syaratQuantity: syaratQuantity || null,
      syaratTotalRp: syaratTotalRp || null,
      skuBarangBonus,
      quantityBonus: parseInt(quantityBonus) || 1,
      authorizedOutlets,
      mode,
    };

    const response = await DaftarPromo.create(promoData);

    return res.json({
      message: "berhasil register promo baru",
      data: response,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(500).json({
        message: "gagal register promo, duplikat judulPromo",
        error: error,
      });
    }
    console.log("Error creating promo:", error);
    return res
      .status(400)
      .json({ message: "terjadi kesalahan", error: error.message });
  }
};

export const updatePromo = async (req, res) => {
  const {
    _id,
    judulPromo,
    skuList,
    quantityBerlaku,
    berlakuDari,
    berlakuHingga,
    syaratQuantity,
    syaratTotalRp,
    skuBarangBonus,
    quantityBonus,
    authorizedOutlets,
    mode,
  } = req.body;

  if (!mode) return res.status(400).json({ message: "ga ada mode" });

  await DaftarPromo.findByIdAndUpdate(
    _id,
    {
      judulPromo: judulPromo,
      skuList,
      quantityBerlaku,
      berlakuDari,
      berlakuHingga,
      syaratQuantity,
      syaratTotalRp,
      skuBarangBonus,
      quantityBonus,
      authorizedOutlets,
      mode: mode,
    },
    { new: true }
  );

  return res.json({ message: "berhasil update" });
};

export const getAllPromoByProduct = async (req, res) => {
  const sku = resolveSkuFromReq(req);
  if (!sku) {
    return res.status(400).json({ message: "sku diperlukan" });
  }

  const promos = await DaftarPromo.find({ skuList: { $in: [sku] } });
  return res.json({ message: "berhasil", data: promos, length: promos.length });
};

export const deletePromo = async (req, res) => {
  const { id } = req.params;
  await DaftarPromo.findByIdAndDelete(id);
  return res.json({ message: "berhasil menghapus promo" });
};

// import CSV promo (delimiter ;)
export const importPromoCsv = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "File CSV diperlukan" });
  }

  const filePath =
    file.path || path.join(process.cwd(), "uploads", file.filename);
  const rows = [];

  const separator = detectCsvSeparatorFromFile(filePath);

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator }))
        .on("data", (row) => {
          const judulPromo = csvCell(row, "Judul Promo");
          if (!judulPromo) return;

          rows.push({
            judulPromo,
            mode: csvCell(row, "Mode"),
            skuRaw: csvCell(row, "SKU Terkait"),
            outletRaw: csvCell(row, "Outlet"),
            quantityBerlaku: csvCell(row, "Kuota"),
            berlakuDari: csvCell(row, "Berlaku Dari"),
            berlakuHingga: csvCell(row, "Berlaku Hingga"),
            syaratQuantity: csvCell(row, "Syarat Quantity"),
            syaratTotalRp: csvCell(row, "Syarat Total Rp"),
            skuBarangBonus: csvCell(row, "SKU Barang Bonus"),
            quantityBonus: csvCell(row, "Quantity Bonus"),
          });
        })
        .on("end", resolve)
        .on("error", reject);
    });
  } catch {
    return res.status(400).json({ message: "Gagal membaca file CSV" });
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  if (!rows.length) {
    return res.status(400).json({ message: "Tidak ada data valid di CSV" });
  }

  const errors = [];
  const allMissingSkus = new Set();
  const judulInFile = new Set();
  const prepared = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const judulKey = row.judulPromo.toLowerCase();

    if (judulInFile.has(judulKey)) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Judul promo duplikat dalam file",
      });
      continue;
    }
    judulInFile.add(judulKey);

    if (!row.quantityBerlaku) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Kuota wajib diisi",
      });
      continue;
    }
    if (!row.berlakuHingga) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Berlaku Hingga wajib diisi",
      });
      continue;
    }
    if (!row.skuBarangBonus) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "SKU Barang Bonus wajib diisi",
      });
      continue;
    }
    if (!row.quantityBonus) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Quantity Bonus wajib diisi",
      });
      continue;
    }

    const hasSyaratQty = row.syaratQuantity !== "";
    const hasSyaratRp = row.syaratTotalRp !== "";
    if (!hasSyaratQty && !hasSyaratRp) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Syarat Quantity atau Syarat Total Rp wajib diisi salah satu",
      });
      continue;
    }
    if (hasSyaratQty && hasSyaratRp) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Hanya boleh mengisi Syarat Quantity atau Syarat Total Rp",
      });
      continue;
    }

    const mode = row.mode || "particular";
    if (!["simple_total", "particular"].includes(mode)) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Mode harus particular atau simple_total",
      });
      continue;
    }

    const skuListRaw = parseCommaList(row.skuRaw);
    const normalizedSkus = [];
    let skuError = false;

    for (const sku of skuListRaw) {
      const inventory = await findInventoryBySku(sku);
      if (!inventory) {
        allMissingSkus.add(sku);
        errors.push({
          row: rowNum,
          judul: row.judulPromo,
          reason: `SKU tidak terdaftar: ${sku}`,
        });
        skuError = true;
        break;
      }
      normalizedSkus.push(inventory.sku);
    }
    if (skuError) continue;

    const bonusInventory = await findInventoryBySku(row.skuBarangBonus);
    if (!bonusInventory) {
      allMissingSkus.add(row.skuBarangBonus);
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: `SKU Barang Bonus tidak terdaftar: ${row.skuBarangBonus}`,
      });
      continue;
    }

    const outletNames = parseCommaList(row.outletRaw);
    const authorizedOutlets = [];
    for (const nama of outletNames) {
      const outlet = await Outlet.findOne({ namaOutlet: nama });
      if (!outlet) {
        errors.push({
          row: rowNum,
          judul: row.judulPromo,
          reason: `Outlet tidak ditemukan: ${nama}`,
        });
        skuError = true;
        break;
      }
      authorizedOutlets.push(outlet._id);
    }
    if (skuError) continue;

    const berlakuDari = row.berlakuDari
      ? new Date(row.berlakuDari)
      : new Date();
    const berlakuHingga = new Date(row.berlakuHingga);

    if (isNaN(berlakuDari.getTime()) || isNaN(berlakuHingga.getTime())) {
      errors.push({
        row: rowNum,
        judul: row.judulPromo,
        reason: "Format tanggal tidak valid",
      });
      continue;
    }

    prepared.push({
      judulPromo: row.judulPromo,
      mode,
      skuList: normalizedSkus,
      authorizedOutlets,
      quantityBerlaku: parseInt(row.quantityBerlaku),
      berlakuDari,
      berlakuHingga,
      syaratQuantity: hasSyaratQty ? parseInt(row.syaratQuantity) : null,
      syaratTotalRp: hasSyaratRp
        ? Number(row.syaratTotalRp.replace(/[^\d]/g, ""))
        : null,
      skuBarangBonus: bonusInventory.sku,
      quantityBonus: parseInt(row.quantityBonus) || 1,
    });
  }

  if (errors.length) {
    return res.status(400).json({
      message: "Gagal memproses data promo",
      details: errors,
      missingSkus: [...allMissingSkus],
    });
  }

  try {
    const skipped = [];
    const toInsert = [];

    for (const item of prepared) {
      const existing = await DaftarPromo.findOne({
        judulPromo: item.judulPromo,
      });
      if (existing) {
        skipped.push(item.judulPromo);
        continue;
      }
      toInsert.push(item);
    }

    if (toInsert.length) {
      await DaftarPromo.insertMany(toInsert);
    }

    const createdCount = toInsert.length;
    const skippedCount = skipped.length;

    let message = `Berhasil import ${createdCount} promo`;
    if (skippedCount) {
      message += ` (${skippedCount} dilewati karena duplikat)`;
    }
    if (!createdCount && skippedCount) {
      message = `Semua baris dilewati karena judul sudah ada (${skippedCount})`;
    }

    return res.json({
      message,
      createdCount,
      skippedCount,
      skipped,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal import promo",
      error: error.message,
    });
  }
};
