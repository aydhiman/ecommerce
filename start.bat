@echo off
REM E-Commerce Platform - Start Script (Batch)
REM This script starts both backend and frontend servers

echo Starting E-Commerce Platform...
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    pause
    exit /b 1
)

REM Install Backend Dependencies
echo Checking backend dependencies...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)
cd ..

REM Install Frontend Dependencies
echo Checking frontend dependencies...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)
cd ..

echo.
echo All dependencies are ready!
echo.

REM Start Backend Server
echo Starting Backend Server on port 5000...
cd backend
start "Backend Server" cmd /k npm start
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo Starting Frontend Server on port 3000...
cd frontend
start "Frontend Server" cmd /k npm run dev
cd ..

echo.
echo ================================
echo Both servers are starting!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ================================
echo.
echo Close the terminal windows to stop the servers
echo.
pause
