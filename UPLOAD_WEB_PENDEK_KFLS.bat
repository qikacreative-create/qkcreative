@echo off
title Aktifkan ^& Upload Web Pendek kfls.web.app (Proyek: kafilasuci3)
color 0A
echo ============================================================================
echo   KHUSUS WEB PENDEK BIO IG ^& BOOKING: https://kfls.web.app
echo   Proyek Firebase: kafilasuci3
echo   (Terpisah dari Web Utama kflsagnd.web.app agar tidak pernah mengganggu!)
echo ============================================================================
echo.

if not exist "dist\index.html" (
    echo [INFO] Folder dist belum ditemukan, menjalankan build terlebih dahulu...
    call npm install
    call npm run build
)

echo [1/2] Mendaftarkan site pendek "kfls" di proyek kafilasuci3 (jika belum ada)...
call npx firebase-tools hosting:sites:create kfls --project kafilasuci3

echo.
echo [2/2] Meng-upload Website Profesional ^& Form Booking ke https://kfls.web.app ...
call npx firebase-tools deploy --only hosting --config firebase-kfls.json --project kafilasuci3

echo.
echo ============================================================================
echo   JIKA BERHASIL, LINK PENDEK BAPAK SUDAH AKTIF DI:
echo   - Website Profesional (Bio IG) : https://kfls.web.app/[username]
echo   - Form Booking Super Pendek    : https://kfls.web.app/b/[username]
echo ============================================================================
pause
