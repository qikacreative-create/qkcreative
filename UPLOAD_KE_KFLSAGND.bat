@echo off
title Upload 3 Detik ke kflsagnd.web.app (Proyek: kafilasuci3)
color 0B
echo ============================================================================
echo   KAFELA'S AGENDA - UPLOAD INSTAN 3 DETIK KE KFLSAGND.WEB.APP
echo   Proyek Firebase: kafilasuci3
echo   1. Web Utama Aplikasi  : https://kflsagnd.web.app
echo   2. Link Pendek Bio IG  : https://kflsagnd.web.app/[username]
echo   3. Link Pendek Booking : https://kflsagnd.web.app/b/[username]
echo   (Folder "dist" SUDAH MATANG - Langsung Upload Tanpa Build Ulang!)
echo ============================================================================
echo.

if not exist "dist\index.html" (
    echo [INFO] Folder dist belum ditemukan, menjalankan build terlebih dahulu...
    call npm install
    call npm run build
)

echo Meng-upload langsung ke https://kflsagnd.web.app ...
call npx firebase-tools deploy --only hosting --project kafilasuci3
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Jika belum login Firebase di PC ini, silakan login terlebih dahulu:
    call npx firebase-tools login
    call npx firebase-tools deploy --only hosting --project kafilasuci3
)

echo.
echo ============================================================================
echo   SELESAI! APLIKASI SUDAH AKTIF DI:
echo   - Web Utama Aplikasi  : https://kflsagnd.web.app
echo   - Link Pendek Bio IG  : https://kflsagnd.web.app/[username]
echo   - Link Pendek Booking : https://kflsagnd.web.app/b/[username]
echo ============================================================================
pause
