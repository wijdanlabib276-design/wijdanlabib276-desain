' ============================================================
'   (c) 2026 PPSZ NW Pasangkayu. All Rights Reserved.
'   Dilarang menyalin, mengubah, atau mendistribusikan tanpa izin.
' ============================================================
' Script untuk menjalankan Sistem Keuangan Santri secara otomatis
' Membuka server + browser tanpa jendela terminal hitam
Set WshShell = CreateObject("WScript.Shell")
projectDir = "c:\Users\Matrix Computer\Videos\catatn keuangan pasangkayu"

' Buka server di latar belakang
WshShell.CurrentDirectory = projectDir
WshShell.Run "cmd /c npm start", 0, False

' Tunggu server siap lalu buka browser
WScript.Sleep 4000
WshShell.Run "http://localhost:3000/", 1, False
