# Undercover Chameleon | Multiplayer Cyber Party Game

[![CI - Undercover Chameleon](https://github.com/KoshaG0hil/Undercover-Chameleon-Multiplayer-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/KoshaG0hil/Undercover-Chameleon-Multiplayer-Game/actions/workflows/ci.yml)
[![Live Game](https://img.shields.io/badge/Play_Live_Game-GitHub_Pages-06b6d4?logo=github)](https://koshag0hil.github.io/Undercover-Chameleon-Multiplayer-Game/)
[![Challenge](https://img.shields.io/badge/OpenAI_x_Handshake-Multiplayer_Challenge_2026-pink)](https://github.com/KoshaG0hil/Undercover-Chameleon-Multiplayer-Game)
[![Real-Time WebRTC](https://img.shields.io/badge/P2P_Networking-PeerJS_WebRTC-emerald)](https://peerjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A real-time, zero-install, zero-login multiplayer social deduction game built for the **Handshake AI Skills Studio X OpenAI Multiplayer Game Challenge**.

Playable from any mobile phone or laptop browser with an instant 4-letter room code or 1-tap QR code scan!

Architected by **[Kosha Gohil](https://www.linkedin.com/in/kosha-gohil/)**.

---

## 🎮 Play Live Right Now

👉 **[https://koshag0hil.github.io/Undercover-Chameleon-Multiplayer-Game/](https://koshag0hil.github.io/Undercover-Chameleon-Multiplayer-Game/)**

1. Open the link on your laptop, tablet, or phone.
2. Tap **Create Room (Host)** to get a 4-letter room code.
3. Show the QR code to friends or send the invite link.
4. Friends join instantly from their own devices—no account or download required!

---

## ⚡ Game Features & Innovations

- **Zero-Server P2P Synchronization:** Uses WebRTC data channels via PeerJS. All players' screens stay in lockstep with sub-50ms latency.
- **1-Tap Mobile Camera Join:** Generates an interactive QR code on the host's screen for effortless mobile onboarding.
- **Procedural Web Audio Synthesizer:** Built-in retro cyberpunk synth audio effects generated entirely in code via the Web Audio API—zero external audio assets required.
- **Tactile Haptic Feedback:** Vibrates phones on countdown ticks, clue turns, and voting locks.
- **6 Rich Category Packs (120+ Words):** Cyberpunk & Sci-Fi, Tech & Internet, Food & Midnight Snacks, Gaming & Pop Culture, World Landmarks, and Secret Agents.
- **Chameleon's Last Stand:** If caught by the agents, the Chameleon gets one final chance to guess the secret word from a 6-candidate grid to steal the win!
- **Celebratory Confetti:** Particle burst animations celebrate agent or chameleon triumphs.

---

## 📁 Repository Structure

```
Undercover-Chameleon-Multiplayer-Game/
├── .github/workflows/
│   ├── ci.yml                     # Automated Node & Pytest CI suite
│   └── pages.yml                  # Automated GitHub Pages deploy
├── css/
│   └── style.css                  # Custom Neon Cyber Arcade stylesheet
├── docs/
│   └── ARCHITECTURE.md            # Topology and WebRTC state machine
├── js/
│   ├── app.js                     # UI controller & event binder
│   ├── audio.js                   # Web Audio API synthesizer & haptics
│   ├── game.js                    # Authoritative game logic engine
│   ├── network.js                 # PeerJS P2P WebRTC coordinator
│   └── words.js                   # Curated word packs & guess generator
├── server/
│   ├── index.js                   # Optional Node.js WebSocket relay server
│   └── package.json
├── tests/
│   ├── test_game_logic.js         # Core game logic unit tests
│   └── test_game_engine.py        # Python test runner wrapper
├── index.html                     # Full responsive mobile/desktop web app
├── GAME_RULES.md                  # Complete gameplay guide
├── HOW_TO_RUN.md                  # Local and server execution runbook
├── PROJECT_GUIDE.md               # Contest submission guide & rubric alignment
├── Dockerfile                     # Containerized image definition
├── run.ps1 / run.sh / run.bat     # One-click execution scripts
└── LICENSE / requirements.txt
```

---

## 👩‍💻 Author

**Kosha Gohil**  
Cloud Security & Software Engineer  
- 💼 LinkedIn: [linkedin.com/in/kosha-gohil](https://www.linkedin.com/in/kosha-gohil/)  
- 🐙 GitHub: [@KoshaG0hil](https://github.com/KoshaG0hil)  
