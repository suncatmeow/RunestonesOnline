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

socket.on("challenge_accepted", (data) => {
    // data is now an object: { targetId, receiverDeck }
    console.log(`Battle Accepted! ${socket.id} vs ${data.targetId}`);
    
    // Send the Receiver's ID AND their Deck to the Challenger
    io.to(data.targetId).emit("challenge_accepted", {
        opponentId: socket.id,
        opponentDeck: data.receiverDeck // Pass the deck along
    });
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
socket.on("challenge_request", (data) => {
    // data comes in as: { targetId: "...", deck: [...] }
    console.log(`Challenge sent from ${socket.id} to ${data.targetId}`);
    
    // We must send BOTH the ID and the Deck to the receiver
    io.to(data.targetId).emit("challenge_received", {
        id: socket.id,
        deck: data.deck
    });
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