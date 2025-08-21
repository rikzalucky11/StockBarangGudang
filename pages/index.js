import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [sheets, setSheets] = useState([]);
  const [excelData, setExcelData] = useState({});
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedHeader, setSelectedHeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [jumlahKurang, setJumlahKurang] = useState({}); // simpan jumlah tiap baris

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/uploadExcel");
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

  useEffect(() => {
    loadData();
  }, []);

  const availableHeaders = useMemo(() => {
    const rows = excelData[selectedSheet] || [];
    if (!rows.length) return [];
    const headers = Object.keys(rows[0] || {});
    return headers.filter((h) => !String(h).toLowerCase().includes("stock"));
  }, [excelData, selectedSheet]);

  const columnsToShow = useMemo(() => {
    if (!selectedSheet || !selectedHeader) return [];
    const rows = excelData[selectedSheet] || [];
    if (!rows.length) return [];

    const headers = Object.keys(rows[0]);
    const idx = headers.indexOf(selectedHeader);
    let stockCol = null;

    if (idx !== -1 && headers[idx + 1] && /stock/i.test(headers[idx + 1])) {
      stockCol = headers[idx + 1];
    }
    if (!stockCol) {
      const needle =
        "stock" + String(selectedHeader).replace(/\s+/g, "").toLowerCase();
      stockCol =
        headers.find(
          (h) =>
            String(h).replace(/\s+/g, "").toLowerCase() === needle
        ) ||
        headers.find(
          (h) =>
            /stock/i.test(h) &&
            String(h)
              .replace(/\s+/g, "")
              .toLowerCase()
              .includes(
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

  // Handler kurangi stok dengan jumlah custom
  const handleKurangi = async (namaBarang, stockCol, jumlah) => {
    if (!jumlah || jumlah <= 0) {
      alert("Masukkan jumlah yang valid");
      return;
    }
    const res = await fetch("/api/updateStock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheet: selectedSheet,
        header: selectedHeader,
        nama: namaBarang,
        stockCol: stockCol,
        jumlah: jumlah,
      }),
    });
    const json = await res.json();
    alert(json.message);

    // hapus input jumlah yang sudah dipakai
    setJumlahKurang((prev) => {
      const updated = { ...prev };
      delete updated[namaBarang];
      return updated;
    });

     // reload data
    await loadData();

    // langsung reload page
    window.location.reload();
    };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#004aad",
          color: "white",
          padding: "15px 30px",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      >
        Reza Jaya Elektronik
      </div>

      {/* Konten */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            width: "90%",
            maxWidth: "900px",
            backgroundColor: "#f8f9fa",
            padding: "30px",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h1 style={{ marginBottom: "20px", color: "#333" }}>
            Lihat Stok Barang Gudang
          </h1>

          {/* Pilih Sheet */}
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: "bold" }}>Pilih Sheet:</label>
            <select
              value={selectedSheet}
              onChange={(e) => {
                setSelectedSheet(e.target.value);
                setSelectedHeader("");
              }}
              style={{
                padding: "10px",
                minWidth: 220,
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
            >
              {sheets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Kolom */}
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <label style={{ fontWeight: "bold" }}>Pilih Kolom:</label>
            <select
              value={selectedHeader}
              onChange={(e) => setSelectedHeader(e.target.value)}
              style={{
                padding: "10px",
                minWidth: 220,
                border: "1px solid #ccc",
                borderRadius: "5px",
              }}
              disabled={!availableHeaders.length}
            >
              <option value="">-- Pilih Kolom --</option>
              {availableHeaders.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {loading && <p>Sedang memuat...</p>}

          {/* Tabel hasil */}
          {selectedHeader && rowsToRender.length > 0 && (
            <table
              style={{
                margin: "0 auto",
                borderCollapse: "collapse",
                width: "100%",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#004aad", color: "white" }}>
                  {columnsToShow.map((col) => (
                    <th
                      key={col}
                      style={{ padding: "10px", border: "1px solid #ddd" }}
                    >
                      {col}
                    </th>
                  ))}
                  {columnsToShow.length > 1 && (
                    <>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Jumlah
                      </th>
                      <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                        Aksi
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rowsToRender.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f1f1f1",
                    }}
                  >
                    {columnsToShow.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: "10px",
                          border: "1px solid #ddd",
                          textAlign:
                            col === selectedHeader ? "left" : "center",
                        }}
                      >
                        {row[col] ?? ""}
                      </td>
                    ))}
                    {columnsToShow.length > 1 && (
                      <>
                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                          <input
                            type="number"
                            min="1"
                            value={jumlahKurang[row[selectedHeader]] || ""}
                            onChange={(e) =>
                              setJumlahKurang({
                                ...jumlahKurang,
                                [row[selectedHeader]]: e.target.value,
                              })
                            }
                            style={{ width: "70px", padding: "5px" }}
                          />
                        </td>
                        <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                          <button
                            onClick={() =>
                              handleKurangi(
                                row[selectedHeader],
                                columnsToShow[1],
                                parseInt(
                                  jumlahKurang[row[selectedHeader]] || "0",
                                  10
                                )
                              )
                            }
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Kurangi
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
