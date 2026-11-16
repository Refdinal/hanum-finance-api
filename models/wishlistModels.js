const pool = require("../config/db");

const getWishlist = async () => {
  const result = await pool.query("SELECT id, nama, harga FROM wishlist ORDER BY dibuat_pada, id");
  return result.rows;
};

const createWishlistItem = async ({ nama, harga }) => {
  const namaBersih = String(nama || "").trim();
  const hargaAngka = Number(harga);
  if (!namaBersih) throw new Error("Nama item wajib diisi");
  if (!Number.isFinite(hargaAngka) || hargaAngka <= 0) throw new Error("Harga harus lebih dari 0");

  const result = await pool.query(
    "INSERT INTO wishlist (nama, harga) VALUES ($1, $2) RETURNING id, nama, harga",
    [namaBersih, hargaAngka],
  );
  return result.rows[0];
};

const deleteWishlistItem = async (id) => {
  const result = await pool.query("DELETE FROM wishlist WHERE id = $1", [id]);
  return { deleted: result.rowCount };
};

module.exports = { getWishlist, createWishlistItem, deleteWishlistItem };
