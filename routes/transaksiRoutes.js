const express = require("express");
const c = require("../controllers/transaksiControllers");
const routerTransaksi = express.Router();

routerTransaksi.get("/meta", c.getMeta);
routerTransaksi.get("/dashboard", c.getDashboard);
routerTransaksi.get("/saldo", c.getSaldo);
routerTransaksi.get("/investasi", c.getInvestasi);

routerTransaksi.get("/filteropsi", c.getFilterOpsi);
routerTransaksi.get("/alltransaksi/:limit", c.getAllTransaksi);
routerTransaksi.get("/id/:id", c.getTransaksiById);
routerTransaksi.post("/inserttransaksi", c.insertTransaksi);
routerTransaksi.put("/update/:id", c.updateTransaksi);
routerTransaksi.delete("/delete/:id", c.deleteTransaksiById);

module.exports = routerTransaksi;
