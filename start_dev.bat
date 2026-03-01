@echo off
echo ==========================================
echo       Starting Fuel Rescue Project
echo ==========================================

echo.
echo [1/2] Launching Backend Server...
start "Fuel Rescue Backend" cmd /k "cd server && echo Installing Backend Dependencies... && npm install && echo Starting Backend... && npm start"

echo.
echo [2/2] Launching Frontend Client...
start "Fuel Rescue Frontend" cmd /k "cd client && echo Installing Frontend Dependencies... && npm install && echo Starting Frontend... && npm run dev"

echo.
echo ==========================================
echo Both servers are launching in new windows.
echo If they close immediately, please check if Node.js is installed.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ==========================================
pause
