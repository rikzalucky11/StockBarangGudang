import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [sheets, setSheets] = useState([]);
  const [excelData, setExcelData] = useState({});
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedHeader, setSelectedHeader] = useState("");
  const [loading, setLoading] = useState(false);

  // Ambil semua sheet + data sekali di awal
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/uploadExcel"); // endpoint yang baca barang.xlsx
        const json = await res.json();
        setSheets(json.sheets || []);
        setExcelData(json.data || {});
        if ((json.sheets || []).length > 0) setSelectedSheet(json.sheets[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Header yang tersedia pada sheet terpilih (tanpa yang mengandung "stock")
  const availableHeaders = useMemo(() => {
    const rows = excelData[selectedSheet] || [];
    if (!rows.length) return [];
    const headers = Object.keys(rows[0] || {});
    return headers.filter((h) => !String(h).toLowerCase().includes("stock"));
  }, [excelData, selectedSheet]);

  // Tentukan pasangan kolom stok (sebelah kanan/kiri; fallback: cari pola "STOCK{HEADER}")
  const columnsToShow = useMemo(() => {
    if (!selectedSheet || !selectedHeader) return [];
    const rows = excelData[selectedSheet] || [];
    if (!rows.length) return [];

    const headers = Object.keys(rows[0]);
    const idx = headers.indexOf(selectedHeader);
    let stockCol = null;

    // 1) cek kanan
    if (idx !== -1 && headers[idx + 1] && /stock/i.test(headers[idx + 1])) {
      stockCol = headers[idx + 1];
    }
    // 3) fallback cari nama yang mengandung "stock" + header (tanpa spasi)
    if (!stockCol) {
      const needle = "stock" + String(selectedHeader).replace(/\s+/g, "").toLowerCase();
      stockCol = headers.find(
        (h) => String(h).replace(/\s+/g, "").toLowerCase() === needle
      ) || headers.find(
        (h) =>
          /stock/i.test(h) &&
          String(h).replace(/\s+/g, "").toLowerCase().includes(
            String(selectedHeader).replace(/\s+/g, "").toLowerCase()
          )
      );
    }

    return stockCol ? [selectedHeader, stockCol] : [selectedHeader];
  }, [excelData, selectedSheet, selectedHeader]);

  const rowsToRender = useMemo(() => {
    if (!selectedSheet || !selectedHeader) return [];
    const rows = excelData[selectedSheet] || [];
    return rows.map((r) => {
      const obj = {};
      columnsToShow.forEach((c) => (obj[c] = r[c]));
      return obj;
    });
  }, [excelData, selectedSheet, selectedHeader, columnsToShow]);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#004aad", color: "white", padding: "15px 30px", fontSize: "24px", fontWeight: "bold" }}>
        Reza Jaya Elektronik
      </div>

      {/* Konten di tengah */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", width: "80%", maxWidth: "600px", backgroundColor: "#f8f9fa", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
          <h1 style={{ marginBottom: "20px", color: "#333" }}>Lihat Stok Barang Gudang</h1>

          {/* Pilih Sheet */}
          <div style={{ marginBottom: "15px", display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
            <label style={{ fontWeight: "bold" }}>Pilih Sheet:</label>
            <select
              value={selectedSheet}
              onChange={(e) => { setSelectedSheet(e.target.value); setSelectedHeader(""); }}
              style={{ padding: "10px", minWidth: 220, border: "1px solid #ccc", borderRadius: "5px" }}
            >
              {sheets.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Pilih Kolom */}
          <div style={{ marginBottom: "20px", display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
            <label style={{ fontWeight: "bold" }}>Pilih Kolom:</label>
            <select
              value={selectedHeader}
              onChange={(e) => setSelectedHeader(e.target.value)}
              style={{ padding: "10px", minWidth: 220, border: "1px solid #ccc", borderRadius: "5px" }}
              disabled={!availableHeaders.length}
            >
              <option value="">-- Pilih Kolom --</option>
              {availableHeaders.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {loading && <p>Sedang memuat...</p>}

          {/* Tabel hasil: hanya kolom terpilih + kolom stok pasangannya */}
          {selectedHeader && rowsToRender.length > 0 && (
            <table style={{ margin: "0 auto", borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr style={{ backgroundColor: "#004aad", color: "white" }}>
                  {columnsToShow.map((col) => (
                    <th key={col} style={{ padding: "10px", border: "1px solid #ddd" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f1f1f1" }}>
                    {columnsToShow.map((col) => (
                      <td key={col} style={{ padding: "10px", border: "1px solid #ddd", textAlign: col === selectedHeader ? "left" : "center" }}>
                        {row[col] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Info jika kolom dipilih tapi stok-nya tidak ketemu */}
          {selectedHeader && rowsToRender.length === 0 && !loading && (
            <p style={{ color: "#888", marginTop: "20px" }}>Tidak ada data pada kolom ini.</p>
          )}
          {selectedHeader && columnsToShow.length === 1 && (excelData[selectedSheet]?.length ?? 0) > 0 && (
            <p style={{ color: "#888", marginTop: "10px" }}>
              Kolom stok pasangan tidak ditemukan. Menampilkan kolom <b>{selectedHeader}</b> saja.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
