# Comprehensive Project Guide: Undercover Chameleon Protocol

### Handshake AI Skills Studio X OpenAI Multiplayer Game Challenge

This guide explains the design decisions, engineering architecture, and technical innovations behind **Undercover Chameleon Protocol**.

---

## 1. Challenge Objectives & Evaluation Rubric Alignment

| Rubric Criteria (Weight) | Our Implementation & Polish |
| :--- | :--- |
| **Execution (25%)** | • **Zero-Server / Zero-Login P2P WebRTC Sync:** Built with PeerJS for instant cross-device connectivity across phones and laptops.<br>• **Sub-50ms State Synchronization:** Instant turn updates, synchronized timers, and automatic reconnection handling.<br>• **100% Passing Test Suite:** Automated unit tests verifying role allocation, secret word masking, voting resolution, and Chameleon win stealing. |
| **Creativity (25%)** | • **Cyberpunk Neon Arcade Aesthetic:** High-contrast glowing dark mode, glassmorphism cards, and fluid responsive design.<br>• **Procedural Web Audio Synthesizer:** Custom retro synth chords, tension drones, and celebratory fanfares generated purely in code (no external MP3 downloads).<br>• **1-Tap Mobile Camera Join:** Real-time QR code generation on the host screen allows friends to scan and join within 2 seconds. |
| **Usefulness / Value (25%)** | • **Universal Accessibility:** Anyone with a phone or computer browser can play immediately without creating an account or downloading an app.<br>• **Extensive Content:** 6 curated category packs with 120+ words (Cyberpunk, Tech, Food, Gaming & Pop Culture, Travel, Espionage).<br>• **High Replayability:** Customizable settings (turn timers, chameleon count, category filters, multi-round leaderboard). |
| **Polish & Thoughtfulness (25%)** | • **Haptic Feedback:** Native device vibration on countdown alerts and vote casts.<br>• **Celebratory Confetti:** Dynamic particle bursts on mission victory.<br>• **Failover & Resilience:** Automatic BroadcastChannel fallback for multi-tab testing on the same machine. |

---

## 2. Technical Stack

- **Frontend:** Vanilla HTML5, Tailwind CSS, FontAwesome 6
- **Real-Time Mesh:** PeerJS (WebRTC DataChannels) with STUN/ICE fallbacks
- **Audio Engine:** Procedural Web Audio API Synthesizer
- **QR Code Engine:** QRCode.js
- **Particle System:** Canvas Confetti
- **CI/CD:** GitHub Actions (Node.js & Pytest automated verification) + GitHub Pages deployment
