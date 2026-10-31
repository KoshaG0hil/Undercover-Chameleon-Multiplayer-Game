@echo off
echo ==========================================================
echo   Undercover Chameleon - Real-Time Multiplayer Party Game
echo   OpenAI x Handshake Multiplayer Game Challenge 2026
echo ==========================================================

echo.
echo [+] Running Unit Tests...
node tests/test_game_logic.js

echo.
echo [+] Starting Game Server on http://localhost:8000...
start http://localhost:8000
python -m http.server 8000
