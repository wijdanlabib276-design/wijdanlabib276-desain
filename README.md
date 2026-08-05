# 📖 Website Keuangan Santri — PPSZ NW Pasangkayu

Sistem Informasi Keuangan Santri untuk Pondok Pesantren Syaih Zainuddin NW Pasangkayu.
Website ini mencatat uang masuk/keluar santri dan memungkinkan orang tua/wali memantau saldo serta riwayat transaksi secara transparan.

## ✨ Fitur

**Untuk Admin:**
- Login dengan username & password
- Dashboard dengan ringkasan keuangan (total santri, uang masuk/keluar, saldo)
- CRUD data santri (nama, kelas, asrama, orang tua, kontak)
- Kode akses otomatis per santri untuk login orang tua
- Pencatatan transaksi uang masuk/keluar per santri
- Filter riwayat transaksi berdasarkan tanggal & jenis
- Hapus transaksi / santri
- **Ganti password admin** (menu "Ganti Password" di navbar admin)

**Untuk Orang Tua / Wali:**
- Login cukup dengan **Kode Akses** (tanpa password)
- Melihat data santri, total uang masuk/keluar, saldo
- Melihat riwayat transaksi (50 transaksi terakhir)

## 🚀 Cara Menjalankan

```bash
# 1. Install dependency
npm install

# 2. Jalankan server
npm start
# atau
node server.js
```

Buka di browser: **http://localhost:3000**

### 📱 Cara Akses dari HP / Smartphone

Agar orang tua bisa membuka aplikasi dari HP, pastikan HP dan komputer terhubung ke **WiFi / jaringan yang sama**, lalu:

1. Jalankan server (`npm start`)
2. Lihat alamat LAN yang muncul di terminal, contoh: `http://10.17.200.217:3000`
3. Di HP, buka browser (Chrome/Opera) lalu ketik alamat tersebut
4. Orang tua cukup login dengan **Kode Akses** santri

> 💡 **Tips:**
> - Server sudah otomatis mengikat ke semua jaringan (`0.0.0.0`)
> - Aturan firewall Windows untuk port 3000 sudah dibuat otomatis
> - Jika tidak bisa diakses, cek firewall mengizinkan Node.js / port 3000
> - Untuk akses dari luar rumah (internet), gunakan **ngrok** atau layanan tunnel


>

## 📂 Struktur Proyek

```
├── server.js              # Entry point utama (Express)
├── database.js            # Koneksi database SQLite + skema
├── package.json
├── routes/
│   ├── index.js           # Landing page
│   ├── admin.js           # Routes admin
│   └── ortu.js            # Routes orang tua
├── views/                 # Template EJS
│   ├── index.ejs          # Landing page
│   ├── admin/             # Halaman admin (login, dashboard, santri, transaksi)
│   ├── ortu/              # Halaman orang tua (login, info saldo)
│   ├── partials/          # Header & footer
│   ├── 404.ejs
│   └── 500.ejs
├── public/                # Aset statis (CSS & JS)
│   ├── css/style.css
│   └── js/main.js
└── data/                  # Database SQLite (otomatis dibuat)
    └── keuangan.db
```

## 🗄️ Teknologi

- **Node.js** + **Express** — server & routing
- **EJS** — template engine
- **better-sqlite3** — database SQLite (tanpa server, mudah dipindah)
- **express-session** — autentikasi session
- **CSS murni (custom)** — tampilan responsif tanpa framework tambahan

## 🔐 Keamanan

- Password admin di-hash dengan `scrypt` + salt
- Session expire otomatis setelah 8 jam
- Kode akses santri di-generate acak (hex)
- Validasi input dasar pada server

## 📝 Lisensi

**© 2026 PPSZ NW Pasangkayu. All Rights Reserved.**

Kode ini dilindungi hak cipta. Dilarang menyalin, mengubah, memodifikasi, atau
mendistribusikan kode ini (sebagian maupun seluruhnya) tanpa izin tertulis dari
pemilik. Lihat file [LICENSE](LICENSE) untuk detail.

