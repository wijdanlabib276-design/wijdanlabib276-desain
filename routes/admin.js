/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, verifyPassword, hashPassword } = require('../database');

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login');
}

function reqOrtuLogin(req, res, next) {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return res.render('admin/login', { error: 'Username atau password salah!' });
  }
  req.session.adminId = admin.id;
  req.session.adminNama = admin.nama;
  req.session.save(() => res.redirect('/admin/dashboard'));
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
router.get('/dashboard', requireAdmin, (req, res) => {
  const totalSantri = db.prepare('SELECT COUNT(*) AS c FROM santri').get().c;
  const totalMasuk = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE jenis='masuk'").get().t;
  const totalKeluar = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE jenis='keluar'").get().t;
  const saldo = totalMasuk - totalKeluar;

  const transaksiTerbaru = db.prepare(`
    SELECT t.*, s.nama AS nama_santri
    FROM transaksi t
    JOIN santri s ON s.id = t.santri_id
    ORDER BY t.tanggal DESC, t.id DESC
    LIMIT 10
  `).all();

  res.render('admin/dashboard', {
    totalSantri,
    totalMasuk,
    totalKeluar,
    saldo,
    transaksiTerbaru,
    adminNama: req.session.adminNama,
  });
});

// GET /admin/santri
router.get('/santri', requireAdmin, (req, res) => {
  const santri = db.prepare('SELECT * FROM santri ORDER BY nama').all();
  const q = (req.query.q || '').toLowerCase();
  const hasil = q ? santri.filter(s => s.nama.toLowerCase().includes(q) || s.kelas.toLowerCase().includes(q) || s.asrama.toLowerCase().includes(q)) : santri;
  res.render('admin/santri', {
    santri: hasil,
    q,
    adminNama: req.session.adminNama,
    message: req.query.msg || null,
  });
});

// GET /admin/santri/tambah
router.get('/santri/tambah', requireAdmin, (req, res) => {
  res.render('admin/santri_form', { santri: null, adminNama: req.session.adminNama, error: null });
});

// POST /admin/santri/tambah
router.post('/santri/tambah', requireAdmin, (req, res) => {
  const { nama, kelas, asrama, nama_ortu, kontak_ortu } = req.body;
  if (!nama || !nama.trim()) {
    return res.render('admin/santri_form', { santri: null, adminNama: req.session.adminNama, error: 'Nama santri wajib diisi!' });
  }
  let kode = generateKodeAkses();
  while (db.prepare('SELECT COUNT(*) AS c FROM santri WHERE kode_akses = ?').get(kode).c > 0) {
    kode = generateKodeAkses();
  }
  db.prepare('INSERT INTO santri (nama, kelas, asrama, nama_ortu, kontak_ortu, kode_akses) VALUES (?,?,?,?,?,?)')
    .run(nama.trim(), kelas || '', asrama || '', nama_ortu || '', kontak_ortu || '', kode);
  res.redirect('/admin/santri?msg=' + encodeURIComponent('Data santri berhasil ditambahkan. Kode akses: ' + kode));
});

// GET /admin/santri/:id/edit
router.get('/santri/:id/edit', requireAdmin, (req, res) => {
  const santri = db.prepare('SELECT * FROM santri WHERE id = ?').get(req.params.id);
  if (!santri) return res.redirect('/admin/santri?msg=' + encodeURIComponent('Santri tidak ditemukan'));
  res.render('admin/santri_form', { santri, adminNama: req.session.adminNama, error: null });
});

// POST /admin/santri/:id/edit
router.post('/santri/:id/edit', requireAdmin, (req, res) => {
  const { nama, kelas, asrama, nama_ortu, kontak_ortu } = req.body;
  if (!nama || !nama.trim()) {
    const santri = db.prepare('SELECT * FROM santri WHERE id = ?').get(req.params.id);
    return res.render('admin/santri_form', { santri, adminNama: req.session.adminNama, error: 'Nama santri wajib diisi!' });
  }
  db.prepare('UPDATE santri SET nama=?, kelas=?, asrama=?, nama_ortu=?, kontak_ortu=? WHERE id=?')
    .run(nama.trim(), kelas || '', asrama || '', nama_ortu || '', kontak_ortu || '', req.params.id);
  res.redirect('/admin/santri?msg=' + encodeURIComponent('Data santri berhasil diperbarui'));
});

// GET /admin/santri/:id/hapus
router.get('/santri/:id/hapus', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM santri WHERE id = ?').run(req.params.id);
  res.redirect('/admin/santri?msg=' + encodeURIComponent('Data santri beserta transaksinya dihapus'));
});

// GET /admin/santri/:id/transaksi
router.get('/santri/:id/transaksi', requireAdmin, (req, res) => {
  const santri = db.prepare('SELECT * FROM santri WHERE id = ?').get(req.params.id);
  if (!santri) return res.redirect('/admin/santri');
  const transaksi = db.prepare('SELECT * FROM transaksi WHERE santri_id = ? ORDER BY tanggal DESC, id DESC').all(santri.id);
  const totalMasuk = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE santri_id=? AND jenis='masuk'").get(santri.id).t;
  const totalKeluar = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS t FROM transaksi WHERE santri_id=? AND jenis='keluar'").get(santri.id).t;
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
});

// POST /admin/santri/:id/transaksi
router.post('/santri/:id/transaksi', requireAdmin, (req, res) => {
  const { jenis, jumlah, kategori, keterangan, tanggal } = req.body;
  const jumlahInt = parseInt(jumlah, 10);
  if (!jenis || isNaN(jumlahInt) || jumlahInt <= 0) {
    return res.redirect('/admin/santri/' + req.params.id + '/transaksi?msg=' + encodeURIComponent('Data transaksi tidak valid'));
  }
  db.prepare('INSERT INTO transaksi (santri_id, jenis, jumlah, kategori, keterangan, tanggal, admin_id) VALUES (?,?,?,?,?,?,?)')
    .run(req.params.id, jenis, jumlahInt, kategori || '', keterangan || '', tanggal || new Date().toISOString().slice(0, 10), req.session.adminId);
  res.redirect('/admin/santri/' + req.params.id + '/transaksi?msg=' + encodeURIComponent('Transaksi berhasil ditambahkan'));
});

// GET /admin/transaksi
router.get('/transaksi', requireAdmin, (req, res) => {
  const { dari, sampai, jenis } = req.query;
  let sql = `SELECT t.*, s.nama AS nama_santri FROM transaksi t JOIN santri s ON s.id = t.santri_id WHERE 1=1 `;
  const params = [];
  if (dari) { sql += 'AND t.tanggal >= ? '; params.push(dari); }
  if (sampai) { sql += 'AND t.tanggal <= ? '; params.push(sampai); }
  if (jenis === 'masuk' || jenis === 'keluar') { sql += 'AND t.jenis = ? '; params.push(jenis); }
  sql += 'ORDER BY t.tanggal DESC, t.id DESC';
  const transaksi = db.prepare(sql).all(...params);

  let totalMasuk = 0, totalKeluar = 0;
  for (const t of transaksi) {
    if (t.jenis === 'masuk') totalMasuk += t.jumlah;
    else totalKeluar += t.jumlah;
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
});

// GET /admin/transaksi/hapus/:id
router.get('/transaksi/hapus/:id', requireAdmin, (req, res) => {
  const t = db.prepare('SELECT * FROM transaksi WHERE id = ?').get(req.params.id);
  if (t) {
    db.prepare('DELETE FROM transaksi WHERE id = ?').run(req.params.id);
    res.redirect('/admin/santri/' + t.santri_id + '/transaksi?msg=' + encodeURIComponent('Transaksi dihapus'));
  } else {
    res.redirect('/admin/transaksi?msg=' + encodeURIComponent('Transaksi tidak ditemukan'));
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
router.post('/ganti-password', requireAdmin, (req, res) => {
  const { password_lama, password_baru, password_baru2 } = req.body;
  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.session.adminId);

  if (!admin || !verifyPassword(password_lama, admin.password_hash)) {
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
  db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(newHash, req.session.adminId);
  res.render('admin/ganti_password', {
    adminNama: req.session.adminNama,
    error: null,
    success: 'Password berhasil diganti! 😊',
  });
});

function generateKodeAkses() {
  return 'SPS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

module.exports = router;
