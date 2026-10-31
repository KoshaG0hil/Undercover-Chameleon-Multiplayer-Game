Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Undercover Chameleon - Real-Time Multiplayer Party Game" -ForegroundColor Cyan
Write-Host "  OpenAI x Handshake Multiplayer Game Challenge 2026" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Run tests
Write-Host "`n[+] Executing Unit Test Suite..." -ForegroundColor Yellow
node tests/test_game_logic.js

# Launch local server
Write-Host "`n[+] Starting Local Game Server on http://localhost:8000..." -ForegroundColor Green
Start-Process "http://localhost:8000"
python -m http.server 8000
