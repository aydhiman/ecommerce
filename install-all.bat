@echo off
echo ========================================
echo   E-Commerce Platform Setup
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo Backend dependencies installed successfully!
echo.

echo Step 2: Installing Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create admin account: cd backend ^& node create-admin.js
echo 2. Start backend: cd backend ^& npm start
echo 3. Start frontend: cd frontend ^& npm run dev
echo.
pause
