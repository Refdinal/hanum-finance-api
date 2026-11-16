const pool = require("../config/db");

const getWishlist = async () => {
  const result = await pool.query("SELECT id, nama, volume, satuan, harga, status FROM wishlist ORDER BY dibuat_pada, id");
  return result.rows;
};

const normalizeItem = ({ nama, volume = 1, satuan = "pcs", harga }) => {
  const namaBersih = String(nama || "").trim();
  const volumeAngka = Number(volume);
  const satuanBersih = String(satuan || "").trim();
  const hargaAngka = Number(harga);
  if (!namaBersih) throw new Error("Nama item wajib diisi");
  if (!Number.isFinite(volumeAngka) || volumeAngka <= 0) throw new Error("Volume harus lebih dari 0");
  if (!satuanBersih) throw new Error("Satuan wajib diisi");
  if (!Number.isFinite(hargaAngka) || hargaAngka <= 0) throw new Error("Harga satuan harus lebih dari 0");
  return { namaBersih, volumeAngka, satuanBersih, hargaAngka };
};

const createWishlistItem = async (input) => {
  const { namaBersih, volumeAngka, satuanBersih, hargaAngka } = normalizeItem(input);

  const result = await pool.query(
    "INSERT INTO wishlist (nama, volume, satuan, harga) VALUES ($1, $2, $3, $4) RETURNING id, nama, volume, satuan, harga, status",
    [namaBersih, volumeAngka, satuanBersih, hargaAngka],
  );
  return result.rows[0];
};

const updateWishlistItem = async (id, input) => {
  const { namaBersih, volumeAngka, satuanBersih, hargaAngka } = normalizeItem(input);

  const result = await pool.query(
    "UPDATE wishlist SET nama = $1, volume = $2, satuan = $3, harga = $4 WHERE id = $5 RETURNING id, nama, volume, satuan, harga, status",
    [namaBersih, volumeAngka, satuanBersih, hargaAngka, id],
  );
  if (result.rowCount === 0) throw new Error("Item Wishlist tidak ditemukan");
  return result.rows[0];
};

const checkoutWishlistItem = async (id) => {
  const result = await pool.query(
    "UPDATE wishlist SET status = 'checkout' WHERE id = $1 AND status = 'wishlist' RETURNING id, nama, volume, satuan, harga, status",
    [id],
  );
  if (result.rowCount === 0) throw new Error("Item Wishlist tidak ditemukan");
  return result.rows[0];
};

const deleteWishlistItem = async (id) => {
  const result = await pool.query("DELETE FROM wishlist WHERE id = $1", [id]);
  return { deleted: result.rowCount };
};

module.exports = { getWishlist, createWishlistItem, updateWishlistItem, deleteWishlistItem, checkoutWishlistItem };
