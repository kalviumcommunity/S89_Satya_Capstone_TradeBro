@echo off
echo Starting TradeBro Application...
echo.

echo Starting Backend Server...
start "TradeBro Backend" cmd /k "cd server && npm run dev"

timeout /t 5 /nobreak > nul

echo Starting Frontend Client...
start "TradeBro Frontend" cmd /k "cd client && npm run dev"

echo.
echo TradeBro is starting up!
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul