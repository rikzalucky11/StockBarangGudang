import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "data", "barang.xlsx");
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    const result = {};
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      result[sheetName] = data;
    });

    res.status(200).json({
      sheets: workbook.SheetNames,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal membaca Excel" });
  }
}
