# Start Niti AI - Causal Churn Agent
# Run this script from the project root directory

Write-Host "🚀 Starting Niti AI..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path "nitiai/.env")) {
    Write-Host "⚠️  Warning: nitiai/.env not found. Create it with your GOOGLE_API_KEY" -ForegroundColor Yellow
}

# Start backend in background
Write-Host "📦 Starting Backend (FastAPI on port 8000)..." -ForegroundColor Green
$backend = Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd nitiai; `$env:PYTHONPATH='src'; .venv\Scripts\python -m uvicorn retention_reasoning.api:app --reload --host 0.0.0.0 --port 8000" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "🎨 Starting Frontend (Vite on port 3000)..." -ForegroundColor Green
$frontend = Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd re; npm run dev" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Both servers starting!" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C in each window to stop" -ForegroundColor Gray
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"
