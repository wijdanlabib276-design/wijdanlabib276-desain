@echo off
REM ============================================================
REM   (c) 2026 PPSZ NW Pasangkayu. All Rights Reserved.
REM   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
REM ============================================================
title Sistem Keuangan Santri PPSZ NW Pasangkayu
color 0A
echo ============================================
echo   MENJALANKAN SISTEM KEUANGAN SANTRI
echo   PPSZ NW PASANGKAYU
echo ============================================
echo.
echo Folder proyek : %~dp0
echo.

:: Pindah ke folder proyek
cd /d "%~dp0"

:: Jalankan server di latar belakang
start "" /b cmd /c "npm start"

:: Tunggu server siap lalu buka browser
echo Membuka browser setelah server siap...
timeout /t 4 /nobreak >nul
start "" http://localhost:3000/

echo.
echo Server sedang berjalan. Tekan Ctrl+C atau tutup jendela untuk menghentikan.
pause >nul
