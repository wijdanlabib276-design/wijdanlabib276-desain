/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const { db } = require('../database');

function requireOrtu(req, res, next) {
  if (req.session && req.session.ortuId) return next();
  return res.redirect('/ortu/login');
}

// GET /ortu/login
router.get('/login', (req, res) => {
  if (req.session && req.session.ortuId) return res.redirect('/ortu/dashboard');
  res.render('ortu/login', { error: null });
});

// POST /ortu/login
router.post('/login', (req, res) => {
  const { kode_akses } = req.body;
  const santri = db.prepare('SELECT * FROM santri WHERE kode_akses = ?').get(kode_akses);
  if (!santri) {
    return res.render('ortu/login', { error: 'Kode akses tidak ditemukan. Silakan periksa kembali.' });
  }
  req.session.ortuId = santri.id;
  req.session.ortuNama = santri.nama;
  res.redirect('/ortu/dashboard');
});

// GET /ortu/dashboard
router.get('/dashboard', requireOrtu, (req, res) => {
  const santri = db.prepare('SELECT * FROM santri WHERE id = ?').get(req.session.ortuId);
  const transaksi = db.prepare('SELECT * FROM transaksi WHERE santri_id = ? ORDER BY tanggal DESC, id DESC LIMIT 50').all(santri.id);
  const totalMasuk = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE santri_id=? AND jenis='masuk'").get(santri.id).t;
  const totalKeluar = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE santri_id=? AND jenis='keluar'").get(santri.id).t;
  const saldo = totalMasuk - totalKeluar;
  res.render('ortu/dashboard', { santri, transaksi, totalMasuk, totalKeluar, saldo });
});

// GET /ortu/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/ortu/login');
  });
});

module.exports = router;
