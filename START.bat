@echo off
title Abandoned but Not Forgotten - Quick Start
cd /d "%~dp0"
echo.
echo  ABANDONED BUT NOT FORGOTTEN
echo  NASA Space Apps Challenge 2026
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/ and run START.bat again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing project dependencies. This may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection.
    pause
    exit /b 1
  )
)
echo Checking mission data...
call npm run validate
if errorlevel 1 (
  echo Mission data validation failed.
  pause
  exit /b 1
)
echo Starting local website...
start "" http://localhost:5173
call npm run dev
pause
