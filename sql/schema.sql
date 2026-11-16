-- Skema "Idle Finance" (schema final: hanya tabel transaksi).
-- File ini idempotent (CREATE TABLE IF NOT EXISTS) dan TIDAK menghapus data.
-- Jangan tambahkan statement DROP di file ini.

CREATE TABLE IF NOT EXISTS transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grup_id UUID,
    tanggal TIMESTAMP,
    tipe TEXT,
    arah TEXT,
    kategori TEXT,
    asal TEXT,
    tujuan TEXT,
    deskripsi TEXT,
    jumlah NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi (tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_tipe ON transaksi (tipe);
CREATE INDEX IF NOT EXISTS idx_transaksi_asal ON transaksi (asal);
CREATE INDEX IF NOT EXISTS idx_transaksi_tujuan ON transaksi (tujuan);
CREATE INDEX IF NOT EXISTS idx_transaksi_grup ON transaksi (grup_id);

CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    harga NUMERIC NOT NULL CHECK (harga > 0),
    volume NUMERIC NOT NULL DEFAULT 1 CHECK (volume > 0),
    satuan TEXT NOT NULL DEFAULT 'pcs',
    status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'checkout')),
    dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS volume NUMERIC NOT NULL DEFAULT 1 CHECK (volume > 0);
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS satuan TEXT NOT NULL DEFAULT 'pcs';
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'checkout'));

CREATE INDEX IF NOT EXISTS idx_wishlist_dibuat_pada ON wishlist (dibuat_pada DESC);
