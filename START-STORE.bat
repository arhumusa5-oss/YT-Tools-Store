@echo off
title YT Tools Store - Development Server
cd /d "%~dp0"
echo ========================================================
echo        STARTING YT TOOLS STORE DEVELOPMENT SERVER
echo ========================================================
echo.
echo Storefront:  http://localhost:3000
echo Admin Panel: http://localhost:3000/admin (PIN: 12388127)
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000
npm.cmd run dev
pause
