@echo off
echo Starting Niti AI - Causal Churn Agent
echo.

REM Start backend
echo Starting Backend...
start "Backend" cmd /k "cd /d %~dp0nitiai && set PYTHONPATH=src && .venv\Scripts\python -m uvicorn retention_reasoning.api:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

REM Start frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0re && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo Both servers starting!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo Opening browser...

timeout /t 2 /nobreak > nul
start http://localhost:3000
