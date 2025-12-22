@echo off
title E-Commerce Frontend
cd /d "%~dp0frontend"
echo Starting Frontend on http://localhost:3000...
echo.
node node_modules/vite/bin/vite.js --port 3000
