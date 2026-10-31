# How to Run & Play: Undercover Chameleon Multiplayer

Follow this guide to run the game locally, host on a local network, or deploy to production.

---

## 1. Quickest Way: Play Live via GitHub Pages
No installation or sign-up needed! Simply open:
👉 **[https://koshag0hil.github.io/Undercover-Chameleon-Multiplayer-Game/](https://koshag0hil.github.io/Undercover-Chameleon-Multiplayer-Game/)**

1. Player 1 taps **"Create Room (Host)"**.
2. Player 1 shares the 4-letter room code (or shows the on-screen QR code).
3. Friends scan the QR code with their mobile phone cameras to join instantly!
4. Press **"Launch Mission"** to play!

---

## 2. Local Static Execution (Any Browser)

Double click `index.html` or start a local HTTP server:

```bash
# Python 3
python -m http.server 8000

# Open in browser:
# http://localhost:8000
```

---

## 3. Optional Node.js WebSocket Relay Server

```bash
cd server
npm install
npm start

# Runs at http://localhost:3000
```

---

## 4. Running the Automated Unit Test Suite

```bash
# Node.js direct test run:
node tests/test_game_logic.js

# Or Pytest run:
pytest -v tests/test_game_engine.py
```
