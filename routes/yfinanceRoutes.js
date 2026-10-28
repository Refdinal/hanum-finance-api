const express = require("express");
const routerYfinance = express.Router();
const yahooFinance = require("yahoo-finance2").default;

// Cache dan waktu terakhir update
let cachedGoldPrice = null;
let lastFetched = null;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 24 jam

routerYfinance.get("/gold", async (req, res) => {
  try {
    const now = Date.now();

    // Kalau belum ada cache atau cache sudah lebih dari 24 jam
    if (!cachedGoldPrice || now - lastFetched > CACHE_DURATION_MS) {
      console.log("🔁 Mengambil data baru dari Yahoo Finance");

      try {
        const gold = await yahooFinance.quote("GC=F");
        const idr = await yahooFinance.quote("IDR=X");

        const harga = (gold.regularMarketPrice / 31.1035) * idr.regularMarketPrice;

        // Simpan cache hanya kalau berhasil
        cachedGoldPrice = {
          emas: Math.round(harga),
          updated_at: new Date().toISOString(),
        };
        lastFetched = now;
      } catch (error) {
        console.error("❌ Gagal mengambil data baru:", error);

        // Kalau cache belum pernah ada, kirim error
        if (!cachedGoldPrice) {
          return res.status(500).json({ error: "Gagal mengambil data dan belum ada cache." });
        }

        // Kalau cache lama masih ada, pakai cache terakhir
        console.warn("⚠️ Menggunakan data cache lama");
      }
    }

    res.json(cachedGoldPrice);
  } catch (error) {
    console.error("Gagal mengambil data ", error);
    res.status(500).json({ error: "Gagal mengambil data " });
  }
});

module.exports = routerYfinance;
