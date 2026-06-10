import fs from "fs";

// Deteksi delimiter ; atau , dari baris pertama (Excel Indonesia biasanya ;)
export const detectCsvSeparator = (firstLine = "") => {
  const line = firstLine.replace(/^\uFEFF/, "");
  const semicolons = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (semicolons > commas) return ";";
  if (commas > semicolons) return ",";
  return ";";
};

export const detectCsvSeparatorFromFile = (filePath) => {
  const sample = fs.readFileSync(filePath, { encoding: "utf8" }).slice(0, 8192);
  const firstLine = sample.split(/\r?\n/).find((line) => line.trim()) || "";
  return detectCsvSeparator(firstLine);
};

// Ambil nilai cell CSV (header case-insensitive + strip BOM)
export const csvCell = (row, key) => {
  const raw =
    row[key] ??
    row[
      Object.keys(row).find(
        (k) =>
          k.replace(/^\uFEFF/, "").trim().toLowerCase() === key.toLowerCase(),
      )
    ];
  if (raw === undefined || raw === null) return "";
  return typeof raw === "string" ? raw.trim() : String(raw).trim();
};
