const http = require('http');
const server = http.createServer((req, res) => {
  // This allows you to visit the URL in your browser to confirm it's working
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('BattleMage Server is Alive!');
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Allow connection from your GitHub Pages
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

let players = {};

console.log(`Server attempting to start on port ${port}...`);

io.on("connection", (socket) => {
  console.log("New player joined:", socket.id);
socket.on("challenge_accepted", (targetSocketId) => {
    console.log(`Battle Accepted! ${socket.id} vs ${targetSocketId}`);
// Tell the Challenger (Player A) to start the game
    // We send back 'socket.id' so Player A knows who accepted
    io.to(targetSocketId).emit("challenge_accepted", socket.id);
  });
// --- BATTLE RELAY ---
  socket.on("battle_action", (data) => {
    // data contains: { targetId, actionType, payload }
    console.log(`Battle Action from ${socket.id} to ${data.targetId}`);
    
    // Forward the action to the specific opponent
    io.to(data.targetId).emit("battle_action", {
      senderId: socket.id,
      actionType: data.actionType,
      payload: data.payload
    });
  });
  // 1. Move Listener
  socket.on("move", (data) => {
    players[socket.id] = data;
    socket.broadcast.emit("updatePlayers", players);
  });

  // 2. Challenge Listener (MUST be separate from 'move')
  socket.on("challenge_request", (targetSocketId) => {
    console.log(`Challenge sent from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit("challenge_received", socket.id);
  });

  // 3. Disconnect Listener
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

// IMPORTANT: Listen on the 'server', not 'io' directly
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});