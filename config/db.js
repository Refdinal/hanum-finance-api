const { Pool, types } = require("pg");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first"); // <--- FIX VERCEL DNS BUG

// Kembalikan TIMESTAMP tanpa zona sebagai string apa adanya (jangan dikonversi ke
// Date/UTC) agar waktu yang disimpan tidak bergeser saat dibaca/diedit.
types.setTypeParser(1114, (v) => v); // timestamp without time zone

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,

  // 🔥 WAJIB UNTUK SUPABASE + VERCEL (SSL aktif)
  ssl: { rejectUnauthorized: false },

  // Serverless-friendly pool config
  max: 3,                          // kurangi max connection (serverless banyak instance)
  idleTimeoutMillis: 10000,        // tutup koneksi idle lebih cepat (10s)
  connectionTimeoutMillis: 10000,  // timeout koneksi lebih panjang (10s)
  keepAlive: true,                 // jaga koneksi TCP tetap hidup
  keepAliveInitialDelayMillis: 0,  // langsung aktifkan keepAlive
});

// Prevent unhandled error saat koneksi idle terputus
pool.on("error", (err) => {
  console.error("Unexpected pool error:", err.message);
});

module.exports = pool;
