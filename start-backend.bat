@echo off
title E-Commerce Backend Server
cd /d "%~dp0backend"
echo Starting Backend Server on http://localhost:5000...
echo WebSocket Server on ws://localhost:5000
echo.
node server.js
