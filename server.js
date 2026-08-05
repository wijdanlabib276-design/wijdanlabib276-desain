const express = require('express');
const session = require('express-session');
const path = require('path');
const os = require('os');

const { db } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bisa diakses dari perangkat lain (HP) di jaringan yang sama

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(
  session({
    secret: 'keuangan-santri-pasangkayu-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 jam
  })
);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper untuk format rupiah
app.locals.formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

// Routes
app.use('/', require('./routes/index'));
app.use('/admin', require('./routes/admin'));
app.use('/ortu', require('./routes/ortu'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { error: err.message });
});

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log('============================================');
  console.log('  SISTEM KEUANGAN SANTRI PPSZ NW PASANGKAYU');
  console.log('============================================');
  console.log(`  Di komputer ini : http://localhost:${PORT}`);
  console.log(`  Dari HP (LAN)   : http://${lanIp}:${PORT}`);
  console.log('  Pastikan HP & komputer terhubung WiFi yang sama.');
  console.log('============================================');
});
