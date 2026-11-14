@echo off
title YT Tools Store - WhatsApp Bot Gateway
cd /d "%~dp0whatsapp-bot-gateway"
echo ========================================================
echo   YT Tools Store - Automated WhatsApp Bot Gateway
echo ========================================================
echo Bot shuru ho raha hai... WhatsApp auto-connect ho raha hai.
echo.
node server.js
if errorlevel 1 (
  echo.
  echo Bot kisi error ki wajah se stop ho gaya hai.
  pause
)
