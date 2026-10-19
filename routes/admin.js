/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase, verifyPassword, hashPassword } = require('../database');

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login');
}

async function reqOrtuLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    const { data: admin, error } = await supabase
      .from('admin')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !admin || !verifyPassword(password, admin.password_hash)) {
      return res.render('admin/login', { error: 'Username atau password salah!' });
    }
    req.session.adminId = admin.id;
    req.session.adminNama = admin.nama;
    req.session.save(() => res.redirect('/admin/dashboard'));
  } catch (err) {
    next(err);
  }
}

// GET /admin/login
router.get('/login', (req, res) => {
  if (req.session && req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

// POST /admin/login
router.post('/login', reqOrtuLogin);

// GET /admin/logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// GET /admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const [santriRes, masukRes, keluarRes, transaksiRes] = await Promise.all([
      supabase.from('santri').select('*', { count: 'exact', head: true }),
      supabase.from('transaksi').select('jumlah').eq('jenis', 'masuk'),
      supabase.from('transaksi').select('jumlah').eq('jenis', 'keluar'),
      supabase
        .from('transaksi')
        .select('*, santri(nama)')
        .order('tanggal', { ascending: false })
        .order('id', { ascending: false })
        .limit(10),
    ]);

    const totalSantri = santriRes.count || 0;
    const totalMasuk = (masukRes.data || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);
    const totalKeluar = (keluarRes.data || []).reduce((acc, curr) => acc + Number(curr.jumlah || 0), 0);
    const saldo = totalMasuk - totalKeluar;

    const transaksiTerbaru = (transaksiRes.data || []).map((t) => ({
      ...t,
      nama_santri: t.santri ? t.santri.nama : '-',
    }));

    res.render('admin/dashboard', {
      totalSantri,
      totalMasuk,
      totalKeluar,
      saldo,
      transaksiTerbaru,
      adminNama: req.session.adminNama,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/santri
router.get('/santri', requireAdmin, async (req, res, next) => {
  try {
    const { data: santriList, error } = await supabase
      .from('santri')
      .select('*')
      .order('nama', { ascending: true });

    if (error) throw error;

    const santri = santriList || [];
    const q = (req.query.q || '').toLowerCase();
    const hasil = q
      ? santri.filter(
          (s) =>
            (s.nama || '').toLowerCase().includes(q) ||
            (s.kelas || '').toLowerCase().includes(q) ||
            (s.asrama || '').toLowerCase().includes(q)
        )
      : santri;

    res.render('admin/santri', {
      santri: hasil,
      q,
      adminNama: req.session.adminNama,
      message: req.query.msg || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/santri/tambah
router.get('/santri/tambah', requireAdmin, (req, res) => {
  res.render('admin/santri_form', { santri: null, adminNama: req.session.adminNama, error: null });
});

// POST /admin/santri/tambah
router.post('/santri/tambah', requireAdmin, async (req, res, next) => {
  try {
    const { nama, kelas, asrama, nama_ortu, kontak_ortu } = req.body;
    if (!nama || !nama.trim()) {
      return res.render('admin/santri_form', {
        santri: null,
        adminNama: req.session.adminNama,
        error: 'Nama santri wajib diisi!',
      });
    }

    let kode = generateKodeAkses();
    let isUnique = false;
    while (!isUnique) {
      const { count } = await supabase
        .from('santri')
        .select('*', { count: 'exact', head: true })
        .eq('kode_akses', kode);
      if (!count || count === 0) {
        isUnique = true;
      } else {
        kode = generateKodeAkses();
      }
    }

    const { error } = await supabase.from('santri').insert([
      {
        nama: nama.trim(),
        kelas: kelas || '',
        asrama: asrama || '',
        nama_ortu: nama_ortu || '',
        kontak_ortu: kontak_ortu || '',
        kode_akses: kode,
      },
    ]);

    if (error) throw error;

    res.redirect(
      '/admin/santri?msg=' +
        encodeURIComponent('Data santri berhasil ditambahkan. Kode akses: ' + kode)
    );
  } catch (err) {
    next(err);
  }
});

// GET /admin/santri/:id/edit
router.get('/santri/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const { data: santri, error } = await supabase
      .from('santri')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !santri) {
      return res.redirect('/admin/santri?msg=' + encodeURIComponent('Santri tidak ditemukan'));
    }

    res.render('admin/santri_form', { santri, adminNama: req.session.adminNama, error: null });
  } catch (err) {
    next(err);
  }
});

// POST /admin/santri/:id/edit
router.post('/santri/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const { nama, kelas, asrama, nama_ortu, kontak_ortu } = req.body;
    if (!nama || !nama.trim()) {
      const { data: santri } = await supabase
        .from('santri')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
      return res.render('admin/santri_form', {
        santri,
        adminNama: req.session.adminNama,
        error: 'Nama santri wajib diisi!',
      });
    }

    const { error } = await supabase
      .from('santri')
      .update({
        nama: nama.trim(),
        kelas: kelas || '',
        asrama: asrama || '',
        nama_ortu: nama_ortu || '',
        kontak_ortu: kontak_ortu || '',
      })
      .eq('id', req.params.id);

    if (error) throw error;

    res.redirect('/admin/santri?msg=' + encodeURIComponent('Data santri berhasil diperbarui'));
  } catch (err) {
    next(err);
  }
});

// GET /admin/santri/:id/hapus
router.get('/santri/:id/hapus', requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase.from('santri').delete().eq('id', req.params.id);
    if (error) throw error;

    res.redirect('/admin/santri?msg=' + encodeURIComponent('Data santri beserta transaksinya dihapus'));
  } catch (err) {
    next(err);
  }
});

// GET /admin/santri/:id/transaksi
router.get('/santri/:id/transaksi', requireAdmin, async (req, res, next) => {
  try {
    const [santriRes, transaksiRes] = await Promise.all([
      supabase.from('santri').select('*').eq('id', req.params.id).maybeSingle(),
      supabase
        .from('transaksi')
        .select('*')
        .eq('santri_id', req.params.id)
        .order('tanggal', { ascending: false })
        .order('id', { ascending: false }),
    ]);

    const santri = santriRes.data;
    if (!santri) return res.redirect('/admin/santri');

    const transaksi = transaksiRes.data || [];
    let totalMasuk = 0;
    let totalKeluar = 0;
    for (const t of transaksi) {
      if (t.jenis === 'masuk') totalMasuk += Number(t.jumlah || 0);
      else totalKeluar += Number(t.jumlah || 0);
    }
    const saldo = totalMasuk - totalKeluar;

    res.render('admin/transaksi_santri', {
      santri,
      transaksi,
      totalMasuk,
      totalKeluar,
      saldo,
      adminNama: req.session.adminNama,
      message: req.query.msg || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/santri/:id/transaksi
router.post('/santri/:id/transaksi', requireAdmin, async (req, res, next) => {
  try {
    const { jenis, jumlah, kategori, keterangan, tanggal } = req.body;
    const jumlahInt = parseInt(jumlah, 10);
    if (!jenis || isNaN(jumlahInt) || jumlahInt <= 0) {
      return res.redirect(
        '/admin/santri/' + req.params.id + '/transaksi?msg=' + encodeURIComponent('Data transaksi tidak valid')
      );
    }

    const { error } = await supabase.from('transaksi').insert([
      {
        santri_id: req.params.id,
        jenis,
        jumlah: jumlahInt,
        kategori: kategori || '',
        keterangan: keterangan || '',
        tanggal: tanggal || new Date().toISOString().slice(0, 10),
        admin_id: req.session.adminId,
      },
    ]);

    if (error) throw error;

    res.redirect(
      '/admin/santri/' + req.params.id + '/transaksi?msg=' + encodeURIComponent('Transaksi berhasil ditambahkan')
    );
  } catch (err) {
    next(err);
  }
});

// GET /admin/transaksi
router.get('/transaksi', requireAdmin, async (req, res, next) => {
  try {
    const { dari, sampai, jenis } = req.query;
    let query = supabase
      .from('transaksi')
      .select('*, santri(nama)')
      .order('tanggal', { ascending: false })
      .order('id', { ascending: false });

    if (dari) query = query.gte('tanggal', dari);
    if (sampai) query = query.lte('tanggal', sampai);
    if (jenis === 'masuk' || jenis === 'keluar') query = query.eq('jenis', jenis);

    const { data: rawTransaksi, error } = await query;
    if (error) throw error;

    const transaksi = (rawTransaksi || []).map((t) => ({
      ...t,
      nama_santri: t.santri ? t.santri.nama : '-',
    }));

    let totalMasuk = 0;
    let totalKeluar = 0;
    for (const t of transaksi) {
      if (t.jenis === 'masuk') totalMasuk += Number(t.jumlah || 0);
      else totalKeluar += Number(t.jumlah || 0);
    }

    res.render('admin/transaksi', {
      transaksi,
      dari: dari || '',
      sampai: sampai || '',
      jenis: jenis || '',
      totalMasuk,
      totalKeluar,
      adminNama: req.session.adminNama,
      message: req.query.msg || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/transaksi/hapus/:id
router.get('/transaksi/hapus/:id', requireAdmin, async (req, res, next) => {
  try {
    const { data: t } = await supabase
      .from('transaksi')
      .select('santri_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (t) {
      await supabase.from('transaksi').delete().eq('id', req.params.id);
      res.redirect(
        '/admin/santri/' + t.santri_id + '/transaksi?msg=' + encodeURIComponent('Transaksi dihapus')
      );
    } else {
      res.redirect('/admin/transaksi?msg=' + encodeURIComponent('Transaksi tidak ditemukan'));
    }
  } catch (err) {
    next(err);
  }
});

// GET /admin/ganti-password
router.get('/ganti-password', requireAdmin, (req, res) => {
  res.render('admin/ganti_password', {
    adminNama: req.session.adminNama,
    error: null,
    success: null,
  });
});

// POST /admin/ganti-password
router.post('/ganti-password', requireAdmin, async (req, res, next) => {
  try {
    const { password_lama, password_baru, password_baru2 } = req.body;
    const { data: admin, error } = await supabase
      .from('admin')
      .select('*')
      .eq('id', req.session.adminId)
      .maybeSingle();

    if (error || !admin || !verifyPassword(password_lama, admin.password_hash)) {
      return res.render('admin/ganti_password', {
        adminNama: req.session.adminNama,
        error: 'Password lama salah!',
        success: null,
      });
    }

    if (!password_baru || password_baru.length < 6) {
      return res.render('admin/ganti_password', {
        adminNama: req.session.adminNama,
        error: 'Password baru minimal 6 karakter!',
        success: null,
      });
    }

    if (password_baru !== password_baru2) {
      return res.render('admin/ganti_password', {
        adminNama: req.session.adminNama,
        error: 'Konfirmasi password baru tidak cocok!',
        success: null,
      });
    }

    const newHash = hashPassword(password_baru);
    const { error: updateError } = await supabase
      .from('admin')
      .update({ password_hash: newHash })
      .eq('id', req.session.adminId);

    if (updateError) throw updateError;

    res.render('admin/ganti_password', {
      adminNama: req.session.adminNama,
      error: null,
      success: 'Password berhasil diganti! 😊',
    });
  } catch (err) {
    next(err);
  }
});

function generateKodeAkses() {
  return 'SPS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

module.exports = router;
