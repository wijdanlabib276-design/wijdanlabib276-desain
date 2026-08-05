/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const totalSantri = db.prepare('SELECT COUNT(*) AS c FROM santri').get().c;
  const totalTransaksi = db.prepare('SELECT COUNT(*) AS c FROM transaksi').get().c;
  const totalMasuk = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE jenis='masuk'").get().t;
  const totalKeluar = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE jenis='keluar'").get().t;
  res.render('index', {
    totalSantri,
    totalTransaksi,
    totalMasuk,
    totalKeluar,
  });
});

module.exports = router;
