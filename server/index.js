/**
 * Undercover Chameleon - Centralized WebSocket Relay Server
 * An optional Node.js server for enterprise deployments or dedicated game lobbies.
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Serve static assets from project root
app.use(express.static(path.join(__dirname, "..")));

// Active Rooms State Store
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("CREATE_ROOM", ({ roomCode, hostPlayer }) => {
    socket.join(roomCode);
    rooms.set(roomCode, {
      hostId: socket.id,
      players: [hostPlayer]
    });
    socket.emit("ROOM_CREATED", { roomCode });
    console.log(`Room created: ${roomCode}`);
  });

  socket.on("JOIN_ROOM", ({ roomCode, player }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit("ERROR", { message: "Room not found." });
      return;
    }
    socket.join(roomCode);
    room.players.push(player);
    io.to(roomCode).emit("PLAYER_JOINED", { player, players: room.players });
  });

  socket.on("SYNC_STATE", ({ roomCode, state }) => {
    socket.to(roomCode).emit("STATE_UPDATED", state);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Undercover Chameleon Server running on http://localhost:${PORT}`);
});
