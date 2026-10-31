# Architecture Specification: Undercover Chameleon Multiplayer

This document outlines the architectural topology, peer-to-peer WebRTC state synchronization, and state machine design of the **Undercover Chameleon Multiplayer Game**.

---

## 1. System Topology Overview

```
+---------------------------------------------------------------------------------------------------+
|                                     Multi-Device Network Mesh                                     |
|                                                                                                   |
|     [ Host Device (Laptop / TV / Phone) ] <===============> [ PeerJS Cloud Signaling Broker ]      |
|       - Authoritative Game Engine                                     (0.peerjs.com)              |
|       - Room ID: chameleon-CYBR-v1                                                                |
|                                                                                                   |
|            ^                                     ^                                     ^          |
|            | WebRTC P2P DataChannel              | WebRTC P2P DataChannel              |          |
|            v                                     v                                     v          |
|   [ Player 2 (iPhone) ]                [ Player 3 (Android) ]                [ Player 4 (MacBook) ]|
|   - Masked State View                  - Masked State View                  - Masked State View    |
|   - Submits Clues / Votes              - Submits Clues / Votes              - Submits Clues / Votes|
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Zero-Login P2P Room Synchronization Protocol

1. **Room Creation:**
   - Host generates a random 4-letter room code (e.g. `CYBR`, `NEON`, `HACK`).
   - Host registers with PeerJS broker using deterministic ID `chameleon-${roomCode}-v1`.
   - Host renders an interactive QR code containing `https://<site>/?room=${roomCode}`.
2. **Client Onboarding:**
   - Client scans the QR code or opens the URL with `?room=CYBR`.
   - Client connects to the host's peer ID with reliable data channel mode.
   - Client sends handshake `{ type: "JOIN", player: { id, name, avatar } }`.
3. **State Authoritative Broadcasting:**
   - The host maintains the single source of truth (`GameEngine`).
   - Whenever any phase advances (clue submitted, vote cast, timer tick), the host calls `broadcastState(gameState)`.
   - Connected clients load the new state instantaneously with `< 50ms` latency.
4. **Local Fallback:**
   - In offline environments or multi-tab testing on a single computer, `BroadcastChannel('chameleon_room_${roomCode}')` mirrors all events seamlessly.

---

## 3. Cryptographic Role Masking

To prevent client-side inspection or network snooping:
- The Host strips the `secretWord` from the state payload sent to Chameleon players (`"??? [SECRET MASKED]"`).
- Other players' roles remain `"UNKNOWN"` until the `ROUND_OVER` phase concludes.
