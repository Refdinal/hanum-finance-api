// Konfigurasi domain keuangan (hardcoded, mudah diubah).

const AKUN = {
  liquid: ["bri", "nagari", "seabank", "cash", "dana"],
  investasi: ["reksadana", "emas fisik"],
};

const SEMUA_AKUN = [...AKUN.liquid, ...AKUN.investasi];

const TIPE = [
  { key: "pendapatan", label: "Pendapatan" },
  { key: "pengeluaran", label: "Pengeluaran" },
  { key: "pemindahan", label: "Pemindahan" },
  { key: "masuk_investasi", label: "Masuk Investasi" },
  { key: "tarik_investasi", label: "Tarik Investasi" },
];

const KATEGORI = [
  { key: "belanja", label: "Belanja" },
  { key: "amal", label: "Amal" },
];

const TUJUAN_BELANJA = ["sandang", "pangan", "papan", "sekunder", "tersier"];
const TUJUAN_AMAL = ["sedekah"];

// Sumber/asal dana untuk tipe Pendapatan.
const SUMBER_PENDAPATAN = ["gaji", "pendapatan lain"];

module.exports = {
  AKUN,
  SEMUA_AKUN,
  TIPE,
  KATEGORI,
  TUJUAN_BELANJA,
  TUJUAN_AMAL,
  SUMBER_PENDAPATAN,
};
