@echo off
title E-Commerce Platform
echo ========================================
echo   E-Commerce Platform Quick Start
echo ========================================
echo.
echo Starting both servers...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo WebSocket: ws://localhost:5000
echo.
echo Opening terminals...
echo.

start "Backend Server" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd /d %~dp0frontend && node node_modules/vite/bin/vite.js --port 3000"

echo.
echo ========================================
echo Servers are starting in new windows!
echo.
echo Admin Login:
echo   URL: http://localhost:3000/admin/login
echo   Email: admin@ecommerce.com
echo   Password: admin123
echo.
echo ========================================
timeout /t 5
start http://localhost:3000
