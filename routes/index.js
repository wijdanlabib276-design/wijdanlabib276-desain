/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const { supabase } = require('../database');

router.get('/', async (req, res, next) => {
  try {
    const [santriRes, transaksiRes, masukRes, keluarRes] = await Promise.all([
      supabase.from('santri').select('*', { count: 'exact', head: true }),
      supabase.from('transaksi').select('*', { count: 'exact', head: true }),
      supabase.from('transaksi').select('jumlah').eq('jenis', 'masuk'),
      supabase.from('transaksi').select('jumlah').eq('jenis', 'keluar'),
    ]);

    const totalSantri = santriRes.count || 0;
    const totalTransaksi = transaksiRes.count || 0;
    const totalMasuk = (masukRes.data || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);
    const totalKeluar = (keluarRes.data || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);

    res.render('index', {
      totalSantri,
      totalTransaksi,
      totalMasuk,
      totalKeluar,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
