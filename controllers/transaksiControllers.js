const model = require("../models/transaksiModels");
const keuangan = require("../config/keuangan");

const ok = (res, data) => res.status(200).json({ status: "success", ...data });
const err = (res, error) => res.status(400).json({ status: "error", message: error.message });

const getMeta = async (req, res) => {
  try {
    return ok(res, { meta: keuangan });
  } catch (error) {
    return err(res, error);
  }
};

const getAllTransaksi = async (req, res) => {
  try {
    const { q, tipe, asal, tujuan, dari, sampai } = req.query;
    const transaksi = await model.getAllTransaksi(req.params.limit || 50, { q, tipe, asal, tujuan, dari, sampai });
    return ok(res, { transaksi });
  } catch (error) {
    return err(res, error);
  }
};

const getFilterOpsi = async (req, res) => {
  try {
    const opsi = await model.getFilterOpsi();
    return ok(res, { opsi });
  } catch (error) {
    return err(res, error);
  }
};

const getTransaksiById = async (req, res) => {
  try {
    const transaksi = await model.getTransaksiById(req.params.id);
    return ok(res, { transaksi });
  } catch (error) {
    return err(res, error);
  }
};

const insertTransaksi = async (req, res) => {
  try {
    const transaksi = await model.createTransaksi(req.body);
    return ok(res, { transaksi });
  } catch (error) {
    return err(res, error);
  }
};

const updateTransaksi = async (req, res) => {
  try {
    const transaksi = await model.updateTransaksi(req.params.id, req.body);
    return ok(res, { transaksi });
  } catch (error) {
    return err(res, error);
  }
};

const deleteTransaksiById = async (req, res) => {
  try {
    const result = await model.deleteTransaksi(req.params.id);
    return ok(res, { result });
  } catch (error) {
    return err(res, error);
  }
};

const getSaldo = async (req, res) => {
  try {
    const saldo = await model.getSaldo();
    return ok(res, { saldo });
  } catch (error) {
    return err(res, error);
  }
};

const getInvestasi = async (req, res) => {
  try {
    const investasi = await model.getInvestasi();
    return ok(res, { investasi });
  } catch (error) {
    return err(res, error);
  }
};

const getDashboard = async (req, res) => {
  try {
    const dashboard = await model.getDashboard();
    return ok(res, dashboard);
  } catch (error) {
    return err(res, error);
  }
};

module.exports = {
  getMeta,
  getAllTransaksi,
  getFilterOpsi,
  getTransaksiById,
  insertTransaksi,
  updateTransaksi,
  deleteTransaksiById,
  getSaldo,
  getInvestasi,
  getDashboard,
};
