@echo off
setlocal enabledelayedexpansion
title Busan Ordinance System Launcher

echo ======================================================================
echo  Busan Metropolitan Council Ordinance Monitoring System Setup
echo ======================================================================
echo.

REM 1. Clear existing processes on port 8000
echo [1/4] Checking and clearing port 8000 / 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM 2. Install backend dependencies and seed DB
echo [2/4] Initializing Database and Seed data...
cd /d "%~dp0backend"
python -m pip install -q -r requirements.txt
python app/seeder.py
if errorlevel 1 (
    echo [ERROR] Seeder execution failed.
    pause
    exit /b 1
)

REM 3. Launch Backend FastAPI server
echo [3/4] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Busan-FastAPI-Backend" /min cmd /c "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

REM 4. Launch Frontend Next.js app
echo [4/4] Starting Next.js Frontend on http://localhost:3000 ...
start "Busan-NextJS-Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

timeout /t 4 /nobreak > nul

echo.
echo ======================================================================
echo  System successfully started!
echo  Opening browser at: http://localhost:3000
echo ======================================================================
start http://localhost:3000

echo.
echo Press any key to exit launcher window (servers will continue running in background).
pause > nul
