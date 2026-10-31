/**
 * Undercover Chameleon - Real-Time P2P WebRTC Network Coordinator
 * Uses PeerJS for zero-server, zero-login, instant multiplayer synchronization.
 * Includes BroadcastChannel fallback for multi-tab local testing.
 */

class NetworkCoordinator {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.hostConnection = null;
    this.isHost = false;
    this.roomCode = null;
    this.myPeerId = null;
    this.myPlayerId = null;
    this.localChannel = null;
    this.latestState = null;

    // Callbacks
    this.onStateReceived = () => {};
    this.onPlayerAction = () => {};
    this.onPeerJoin = () => {};
    this.onPeerLeave = () => {};
    this.onError = () => {};
  }

  generateRoomCode() {
    const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
    const vowels = "AEIOU";
    return (
      consonants[Math.floor(Math.random() * consonants.length)] +
      vowels[Math.floor(Math.random() * vowels.length)] +
      consonants[Math.floor(Math.random() * consonants.length)] +
      vowels[Math.floor(Math.random() * vowels.length)]
    );
  }

  getIceConfig() {
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" }
      ]
    };
  }

  createRoom(customCode = null) {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.roomCode = (customCode || this.generateRoomCode()).toUpperCase();
      const hostPeerId = `chameleon-${this.roomCode}-v1`;

      this.setupLocalBroadcastChannel();

      try {
        this.peer = new Peer(hostPeerId, {
          debug: 1,
          config: this.getIceConfig()
        });
      } catch (err) {
        return reject(err);
      }

      this.peer.on("open", (id) => {
        this.myPeerId = id;
        resolve({ roomCode: this.roomCode, hostId: id });
      });

      this.peer.on("connection", (conn) => {
        this.handleIncomingClientConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.warn("PeerJS Host Event:", err);
        if (err.type === "unavailable-id") {
          // If room ID is taken, retry with a fresh code
          this.peer.destroy();
          this.createRoom().then(resolve).catch(reject);
        } else {
          this.onError(err);
        }
      });
    });
  }

  joinRoom(roomCode, playerInfo) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomCode = roomCode.toUpperCase().trim();
      this.myPlayerId = playerInfo.id;
      const hostPeerId = `chameleon-${this.roomCode}-v1`;
      const clientPeerId = `chameleon-${this.roomCode}-p-${Math.random().toString(36).substring(2, 8)}`;

      this.setupLocalBroadcastChannel();

      try {
        this.peer = new Peer(clientPeerId, {
          debug: 1,
          config: this.getIceConfig()
        });
      } catch (err) {
        return reject(err);
      }

      this.peer.on("open", (id) => {
        this.myPeerId = id;

        // Connect to host
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.hostConnection = conn;

        const sendJoin = () => {
          conn.send({
            type: "JOIN",
            player: playerInfo
          });
          resolve({ roomCode: this.roomCode, hostId: hostPeerId });
        };

        if (conn.open) {
          sendJoin();
        } else {
          conn.on("open", () => {
            sendJoin();
          });
        }

        conn.on("data", (data) => {
          if (data && data.type === "SYNC_STATE") {
            this.onStateReceived(data.state);
          }
        });

        conn.on("close", () => {
          this.onError({ message: "Host closed or connection lost." });
        });

        conn.on("error", (err) => {
          console.warn("Client connection error:", err);
          this.onError(err);
        });

        // 6-second fallback to local channel if WebRTC signaling is delayed
        setTimeout(() => {
          if (!conn.open) {
            if (this.localChannel) {
              this.localChannel.postMessage({
                type: "LOCAL_JOIN",
                player: playerInfo
              });
              resolve({ roomCode: this.roomCode, hostId: "local-host" });
            } else {
              reject(new Error("Unable to reach room host. Please verify room code."));
            }
          }
        }, 6000);
      });

      this.peer.on("error", (err) => {
        console.warn("PeerJS Client Event:", err);
        this.onError(err);
        reject(err);
      });
    });
  }

  handleIncomingClientConnection(conn) {
    // Add connection to tracking map immediately
    this.connections.set(conn.peer, conn);

    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      // If we have an existing game state, push it to new client immediately
      if (this.latestState) {
        conn.send({
          type: "SYNC_STATE",
          state: this.latestState
        });
      }
    });

    conn.on("data", (data) => {
      if (!data) return;

      if (data.type === "JOIN") {
        this.connections.set(conn.peer, conn);
        this.onPeerJoin(data.player, conn.peer);

        // Instantly reply with current game state
        if (this.latestState) {
          conn.send({
            type: "SYNC_STATE",
            state: this.latestState
          });
        }
      } else {
        this.onPlayerAction(data);
      }
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.onPeerLeave(conn.peer);
    });

    conn.on("error", (err) => {
      console.warn("Connection error with peer:", conn.peer, err);
      this.connections.delete(conn.peer);
    });
  }

  broadcastState(gameState) {
    this.latestState = gameState;
    const payload = {
      type: "SYNC_STATE",
      state: gameState
    };

    // 1. Send via WebRTC Data Channels
    this.connections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.warn("Error sending to peer:", e);
        }
      }
    });

    // 2. Send via Local BroadcastChannel
    if (this.localChannel) {
      this.localChannel.postMessage(payload);
    }
  }

  sendActionToHost(action) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(action);
    } else if (this.localChannel) {
      this.localChannel.postMessage(action);
    }
  }

  setupLocalBroadcastChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      this.localChannel = new BroadcastChannel(`chameleon_room_${this.roomCode}`);
      this.localChannel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (this.isHost) {
          if (data.type === "LOCAL_JOIN") {
            this.onPeerJoin(data.player, "local-peer");
            if (this.latestState) {
              this.localChannel.postMessage({
                type: "SYNC_STATE",
                state: this.latestState
              });
            }
          } else if (data.type !== "SYNC_STATE") {
            this.onPlayerAction(data);
          }
        } else {
          if (data.type === "SYNC_STATE") {
            this.onStateReceived(data.state);
          }
        }
      };
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }
    this.connections.clear();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { NetworkCoordinator };
}
