import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { sheet, header, nama, stockCol, jumlah } = req.body;
  if (!sheet || !header || !nama || !stockCol) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    const filePath = path.join(process.cwd(), "data", "barang.xlsx");
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[sheet];
    let data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // cari baris yang cocok
    const idx = data.findIndex((r) => String(r[header]).trim() === String(nama).trim());
    if (idx === -1) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    // update stok
    const currentStock = parseInt(data[idx][stockCol] || 0, 10);
    data[idx][stockCol] = Math.max(0, currentStock - (jumlah || 1));

    // tulis balik ke excel
    const newWs = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[sheet] = newWs;
    XLSX.writeFile(workbook, filePath);

    return res.status(200).json({ message: "Stok berhasil dikurangi" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Gagal update stok" });
  }
}
