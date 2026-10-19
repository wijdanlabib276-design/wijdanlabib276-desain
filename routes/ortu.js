/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

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
router.post('/login', async (req, res, next) => {
  try {
    const { kode_akses } = req.body;
    const { data: santri, error } = await supabase
      .from('santri')
      .select('*')
      .eq('kode_akses', (kode_akses || '').trim())
      .maybeSingle();

    if (error || !santri) {
      return res.render('ortu/login', { error: 'Kode akses tidak ditemukan. Silakan periksa kembali.' });
    }
    req.session.ortuId = santri.id;
    req.session.ortuNama = santri.nama;
    res.redirect('/ortu/dashboard');
  } catch (err) {
    next(err);
  }
});

// GET /ortu/dashboard
router.get('/dashboard', requireOrtu, async (req, res, next) => {
  try {
    const [santriRes, transaksiRes] = await Promise.all([
      supabase.from('santri').select('*').eq('id', req.session.ortuId).maybeSingle(),
      supabase
        .from('transaksi')
        .select('*')
        .eq('santri_id', req.session.ortuId)
        .order('tanggal', { ascending: false })
        .order('id', { ascending: false })
        .limit(50),
    ]);

    const santri = santriRes.data;
    if (!santri) return res.redirect('/ortu/login');

    const transaksi = transaksiRes.data || [];
    let totalMasuk = 0;
    let totalKeluar = 0;
    for (const t of transaksi) {
      if (t.jenis === 'masuk') totalMasuk += Number(t.jumlah || 0);
      else totalKeluar += Number(t.jumlah || 0);
    }
    const saldo = totalMasuk - totalKeluar;

    res.render('ortu/dashboard', { santri, transaksi, totalMasuk, totalKeluar, saldo });
  } catch (err) {
    next(err);
  }
});

// GET /ortu/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/ortu/login');
  });
});

module.exports = router;
