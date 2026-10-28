const pool = require("../config/db");
const crypto = require("crypto");
const {
  AKUN,
  TIPE,
  KATEGORI,
  TUJUAN_BELANJA,
  TUJUAN_AMAL,
  SUMBER_PENDAPATAN,
} = require("../config/keuangan");

const LIQUID = AKUN.liquid;
const INVESTASI = AKUN.investasi;

// Bulatkan nominal ke 2 desimal (sen).
const round2 = (nilai) => Math.round(Number(nilai) * 100) / 100;

// --- Validasi payload per tipe ---
const validateTransaksi = (p) => {
  if (!p || !TIPE.some((t) => t.key === p.tipe)) throw new Error("Tipe transaksi tidak valid");
  if (!(Number(p.jumlah) > 0)) throw new Error("Jumlah harus lebih dari 0");
  if (!p.tanggal) throw new Error("Tanggal wajib diisi");

  switch (p.tipe) {
    case "pendapatan":
      if (!SUMBER_PENDAPATAN.includes(p.asal))
        throw new Error("Sumber pendapatan tidak valid");
      if (!LIQUID.includes(p.tujuan))
        throw new Error("Tujuan pendapatan harus akun liquid");
      break;
    case "pengeluaran":
      if (!KATEGORI.map((k) => k.key).includes(p.kategori)) throw new Error("Kategori tidak valid");
      if (!LIQUID.includes(p.asal)) throw new Error("Asal pengeluaran harus akun liquid");
      if (p.kategori === "belanja" && !TUJUAN_BELANJA.includes(p.tujuan))
        throw new Error("Tujuan belanja tidak valid");
      if (p.kategori === "amal" && !TUJUAN_AMAL.includes(p.tujuan))
        throw new Error("Tujuan amal tidak valid");
      break;
    case "pemindahan":
      if (!LIQUID.includes(p.asal) || !LIQUID.includes(p.tujuan))
        throw new Error("Akun pemindahan tidak valid");
      if (p.asal === p.tujuan) throw new Error("Asal dan tujuan tidak boleh sama");
      break;
    case "masuk_investasi":
      if (!LIQUID.includes(p.asal)) throw new Error("Asal masuk investasi tidak valid");
      if (!INVESTASI.includes(p.tujuan)) throw new Error("Tujuan masuk investasi tidak valid");
      break;
    case "tarik_investasi":
      if (!INVESTASI.includes(p.asal)) throw new Error("Asal tarik investasi tidak valid");
      if (!LIQUID.includes(p.tujuan)) throw new Error("Tujuan tarik investasi tidak valid");
      break;
    default:
      throw new Error("Tipe transaksi tidak valid");
  }
};

// --- CREATE (menangani semua tipe) ---
const createTransaksi = async (p) => {
  validateTransaksi(p);
  const jumlah = round2(p.jumlah);
  const tanggal = p.tanggal;
  const deskripsi = p.deskripsi || null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const insTrx = (f) =>
      client.query(
        `INSERT INTO transaksi (grup_id, tanggal, tipe, arah, kategori, asal, tujuan, deskripsi, jumlah)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          f.grup_id || null,
          tanggal,
          p.tipe,
          f.arah,
          f.kategori || null,
          f.asal,
          f.tujuan,
          deskripsi,
          jumlah,
        ],
      );

    const created = [];

    if (p.tipe === "pendapatan") {
      const t = await insTrx({ arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(t.rows[0]);
    } else if (p.tipe === "pengeluaran") {
      const t = await insTrx({ arah: "keluar", kategori: p.kategori, asal: p.asal, tujuan: p.tujuan });
      created.push(t.rows[0]);
    } else if (p.tipe === "pemindahan") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
    } else if (p.tipe === "masuk_investasi") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
    } else if (p.tipe === "tarik_investasi") {
      const grup = crypto.randomUUID();
      const keluar = await insTrx({ grup_id: grup, arah: "keluar", asal: p.asal, tujuan: p.tujuan });
      const masuk = await insTrx({ grup_id: grup, arah: "masuk", asal: p.asal, tujuan: p.tujuan });
      created.push(keluar.rows[0], masuk.rows[0]);
    }

    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllTransaksi = async (limit, filters = {}) => {
  const { q, tipe, asal, tujuan, dari, sampai } = filters;
  const kondisi = [];
  const params = [];

  if (tipe) {
    params.push(tipe);
    kondisi.push(`tipe = $${params.length}`);
  }
  if (asal) {
    params.push(asal);
    kondisi.push(`asal = $${params.length}`);
  }
  if (tujuan) {
    params.push(tujuan);
    kondisi.push(`tujuan = $${params.length}`);
  }
  if (dari) {
    params.push(dari);
    kondisi.push(`tanggal >= $${params.length}::date`);
  }
  if (sampai) {
    params.push(sampai);
    kondisi.push(`tanggal < ($${params.length}::date + INTERVAL '1 day')`);
  }
  if (q) {
    params.push(`%${q}%`);
    kondisi.push(
      `(deskripsi ILIKE $${params.length} OR kategori ILIKE $${params.length} OR asal ILIKE $${params.length} OR tujuan ILIKE $${params.length})`,
    );
  }

  params.push(limit);
  const where = kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM transaksi ${where} ORDER BY tanggal DESC, id DESC LIMIT $${params.length}`,
    params,
  );
  return result.rows;
};

const getFilterOpsi = async () => {
  const [asal, tujuan] = await Promise.all([
    pool.query(
      `SELECT DISTINCT asal FROM transaksi WHERE asal IS NOT NULL AND asal <> '' ORDER BY asal`,
    ),
    pool.query(
      `SELECT DISTINCT tujuan FROM transaksi WHERE tujuan IS NOT NULL AND tujuan <> '' ORDER BY tujuan`,
    ),
  ]);
  return {
    asal: asal.rows.map((r) => r.asal),
    tujuan: tujuan.rows.map((r) => r.tujuan),
  };
};

const getTransaksiById = async (id) => {
  const result = await pool.query("SELECT * FROM transaksi WHERE id = $1", [id]);
  return result.rows;
};

const deleteTransaksi = async (id) => {
  const rows = await getTransaksiById(id);
  if (rows.length === 0) return { deleted: 0, grup_id: null };
  const grupId = rows[0].grup_id;
  let result;
  if (grupId) {
    result = await pool.query("DELETE FROM transaksi WHERE grup_id = $1", [grupId]);
  } else {
    result = await pool.query("DELETE FROM transaksi WHERE id = $1", [id]);
  }
  return { deleted: result.rowCount, grup_id: grupId };
};

// Edit: hapus transaksi (beserta pasangan grup), lalu buat ulang.
const updateTransaksi = async (id, payload) => {
  const rows = await getTransaksiById(id);
  if (rows.length === 0) throw new Error("Transaksi tidak ditemukan");
  await deleteTransaksi(id);
  const created = await createTransaksi(payload);
  return created;
};

// Saldo per akun: arah masuk menambah tujuan, arah keluar mengurangi asal.
const getSaldo = async () => {
  const result = await pool.query(`
    SELECT akun, SUM(saldo) AS saldo FROM (
      SELECT tujuan AS akun, jumlah AS saldo FROM transaksi WHERE arah = 'masuk'
      UNION ALL
      SELECT asal AS akun, -jumlah AS saldo FROM transaksi WHERE arah = 'keluar'
    ) t
    WHERE akun IS NOT NULL
    GROUP BY akun
    ORDER BY akun;
  `);
  return result.rows;
};

// Nilai investasi = saldo akun investasi.
const getInvestasi = async (saldoRows) => {
  const saldo = saldoRows || (await getSaldo());
  const rincian = INVESTASI.map((akun) => {
    const row = saldo.find((s) => s.akun === akun);
    return { akun, saldo: row ? Number(row.saldo) : 0 };
  });
  const total = rincian.reduce((s, r) => s + r.saldo, 0);
  return { total, rincian };
};

// Pengeluaran 12 bulan terakhir: pokok (sandang/pangan/papan) dan total (+sekunder/tersier/amal).
const getBelanjaBulanan = async () => {
  // Patokan bulan = bulan pengeluaran terakhir di database (bukan bulan sekarang),
  // agar jendela 12 bulan selalu memuat data pengeluaran.
  const anchorRes = await pool.query(
    "SELECT MAX(tanggal) AS max_tanggal FROM transaksi WHERE tipe = 'pengeluaran' AND arah = 'keluar'",
  );
  const maxTanggal = anchorRes.rows[0].max_tanggal;

  const result = await pool.query(
    `SELECT
      DATE_TRUNC('month', tanggal) AS bulan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'sandang'), 0) AS sandang,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'pangan'), 0) AS pangan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'papan'), 0) AS papan,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'sekunder'), 0) AS sekunder,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'belanja' AND tujuan = 'tersier'), 0) AS tersier,
      COALESCE(SUM(jumlah) FILTER (WHERE kategori = 'amal'), 0) AS amal
    FROM transaksi
    WHERE tipe = 'pengeluaran' AND arah = 'keluar'
      AND tanggal >= DATE_TRUNC('month', $1::timestamp) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', tanggal)
    ORDER BY 1;`,
    [maxTanggal],
  );

  const map = {};
  result.rows.forEach((r) => {
    const d = new Date(r.bulan);
    map[`${d.getFullYear()}-${d.getMonth()}`] = r;
  });

  // Susun 12 bulan terakhir (berakhir di bulan transaksi terakhir), bulan tanpa data = 0.
  const now = maxTanggal ? new Date(maxTanggal) : new Date();
  const out = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const r = map[`${d.getFullYear()}-${d.getMonth()}`];
    const n = (k) => (r ? Number(r[k]) : 0);
    const sandang = n("sandang");
    const pangan = n("pangan");
    const papan = n("papan");
    const sekunder = n("sekunder");
    const tersier = n("tersier");
    const amal = n("amal");
    const pokok = sandang + pangan + papan;
    const sekunder_tersier = sekunder + tersier;
    out.push({
      bulan: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      sandang,
      pangan,
      papan,
      pokok,
      sekunder,
      tersier,
      sekunder_tersier,
      amal,
      total: pokok + sekunder_tersier + amal,
    });
  }
  return out;
};

// Transaksi pengeluaran yang masuk ke grafik (belanja + amal) pada 12 bulan terakhir.
const getBelanjaTransaksi = async (limit = 200) => {
  const anchorRes = await pool.query(
    "SELECT MAX(tanggal) AS max_tanggal FROM transaksi WHERE tipe = 'pengeluaran' AND arah = 'keluar'",
  );
  const maxTanggal = anchorRes.rows[0].max_tanggal;
  const result = await pool.query(
    `SELECT id, tanggal, kategori, asal, tujuan, deskripsi, jumlah
     FROM transaksi
     WHERE tipe = 'pengeluaran' AND arah = 'keluar' AND (kategori = 'belanja' OR kategori = 'amal')
       AND tanggal >= DATE_TRUNC('month', $1::timestamp) - INTERVAL '11 months'
     ORDER BY tanggal DESC
     LIMIT $2`,
    [maxTanggal, limit],
  );
  return result.rows;
};

const getDashboard = async () => {
  const saldo = await getSaldo();
  const investasi = await getInvestasi(saldo);
  const belanja_bulanan = await getBelanjaBulanan();
  const belanja_transaksi = await getBelanjaTransaksi();

  const jumlahAkun = (keys) =>
    saldo.filter((s) => keys.includes(s.akun)).reduce((sum, s) => sum + Number(s.saldo), 0);

  const totalLiquid = jumlahAkun(LIQUID);
  const totalAset = saldo.reduce((s, r) => s + Number(r.saldo), 0);

  return {
    saldo,
    investasi,
    belanja_bulanan,
    belanja_transaksi,
    akun: AKUN,
    ringkasan: {
      total_liquid: totalLiquid,
      total_investasi: investasi.total,
      total_aset: totalAset,
    },
  };
};

module.exports = {
  createTransaksi,
  getAllTransaksi,
  getFilterOpsi,
  getTransaksiById,
  updateTransaksi,
  deleteTransaksi,
  getSaldo,
  getInvestasi,
  getDashboard,
};
