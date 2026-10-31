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

    // Callbacks
    this.onStateReceived = () => {};
    this.onPlayerAction = () => {};
    this.onPeerJoin = () => {};
    this.onPeerLeave = () => {};
    this.onError = () => {};
  }

  /**
   * Generates a 4-letter memorable cyberpunk room code
   */
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

  /**
   * Host initializes a new multiplayer game room
   */
  createRoom(customCode = null) {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.roomCode = (customCode || this.generateRoomCode()).toUpperCase();
      const hostPeerId = `chameleon-${this.roomCode}-v1`;

      this.setupLocalBroadcastChannel();

      // Initialize PeerJS host
      this.peer = new Peer(hostPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.myPeerId = id;
        resolve({ roomCode: this.roomCode, hostId: id });
      });

      this.peer.on("connection", (conn) => {
        this.handleIncomingClientConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS Host Error:", err);
        // If room ID is taken, retry with a fresh code
        if (err.type === "unavailable-id") {
          this.peer.destroy();
          this.createRoom().then(resolve).catch(reject);
        } else {
          this.onError(err);
          reject(err);
        }
      });
    });
  }

  /**
   * Client joins an existing room hosted by a friend
   */
  joinRoom(roomCode, playerInfo) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomCode = roomCode.toUpperCase().trim();
      this.myPlayerId = playerInfo.id;
      const hostPeerId = `chameleon-${this.roomCode}-v1`;
      const clientPeerId = `chameleon-${this.roomCode}-p-${Math.random().toString(36).substring(2, 8)}`;

      this.setupLocalBroadcastChannel();

      this.peer = new Peer(clientPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.myPeerId = id;

        // Connect to host
        const conn = this.peer.connect(hostPeerId, { reliable: true });
        this.hostConnection = conn;

        conn.on("open", () => {
          // Send Join handshake
          conn.send({
            type: "JOIN",
            player: playerInfo
          });
          resolve({ roomCode: this.roomCode, hostId: hostPeerId });
        });

        conn.on("data", (data) => {
          if (data && data.type === "SYNC_STATE") {
            this.onStateReceived(data.state);
          }
        });

        conn.on("close", () => {
          this.onError({ message: "Lost connection to room host." });
        });

        conn.on("error", (err) => {
          this.onError(err);
          reject(err);
        });

        // Timeout fallback
        setTimeout(() => {
          if (!conn.open) {
            // Also notify via BroadcastChannel for multi-tab local play
            if (this.localChannel) {
              this.localChannel.postMessage({
                type: "LOCAL_JOIN",
                player: playerInfo
              });
              resolve({ roomCode: this.roomCode, hostId: "local-host" });
            } else {
              reject(new Error("Unable to connect to host. Please verify the room code."));
            }
          }
        }, 5000);
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS Client Error:", err);
        this.onError(err);
        reject(err);
      });
    });
  }

  handleIncomingClientConnection(conn) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on("data", (data) => {
      if (!data) return;

      if (data.type === "JOIN") {
        this.onPeerJoin(data.player, conn.peer);
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

  /**
   * Broadcasts updated authoritative game state to all connected players
   */
  broadcastState(gameState) {
    const payload = {
      type: "SYNC_STATE",
      state: gameState
    };

    // 1. Send via WebRTC Data Channels
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(payload);
      }
    });

    // 2. Send via Local BroadcastChannel (for testing tabs on same computer)
    if (this.localChannel) {
      this.localChannel.postMessage(payload);
    }
  }

  /**
   * Client sends an action to the room host
   */
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
