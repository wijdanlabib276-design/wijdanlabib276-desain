/*
 * ============================================================
 *   © 2026 PPSZ NW Pasangkayu. All Rights Reserved.
 *   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
 * ============================================================
 */

// Konfirmasi sebelum menghapus
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      const msg = el.getAttribute('data-confirm') || 'Yakin ingin melanjutkan?';
      if (!window.confirm(msg)) {
        e.preventDefault();
      }
    });
  });

  // Auto-hide alert success setelah 4 detik
  document.querySelectorAll('.alert-success').forEach(function (alert) {
    setTimeout(function () {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(function () { alert.remove(); }, 500);
    }, 4000);
  });
});
