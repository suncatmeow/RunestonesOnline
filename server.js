const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('BattleMage Server is Alive!');
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

let players = {};

console.log(`Server attempting to start on port ${port}...`);

io.on("connection", (socket) => {
  console.log("New player joined:", socket.id);

  // 1. INITIALIZATION FIX: 
  // Create a default entry for the player immediately upon connection.
  // You can change 'x: 0, y: 0' to whatever your starting position is.
  players[socket.id] = { 
      id: socket.id, 
      x: 0, 
      y: 0,
      battleOpponent: null // <--- NEW: Track who they are fighting
      // Add other default props here (e.g., deck: [], health: 100)
  };

  // 2. Notify EVERYONE (including the new player) that the list updated
  io.emit("updatePlayers", players);

  socket.on("challenge_accepted", (data) => {
    console.log(`Battle Accepted! ${socket.id} vs ${data.targetId}`);
    // 1. SERVER MEMORY: Link the two players
    if (players[socket.id]) players[socket.id].battleOpponent = data.targetId;
    if (players[data.targetId]) players[data.targetId].battleOpponent = socket.id;
    io.to(data.targetId).emit("challenge_accepted", {
        opponentId: socket.id,
        opponentDeck: data.receiverDeck 
    });
  });

  // --- BATTLE RELAY ---
  socket.on("battle_action", (data) => {
    console.log(`Battle Action from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit("battle_action", {
      senderId: socket.id,
      actionType: data.actionType,
      payload: data.payload
    });
  });

  // 3. Move Listener
  socket.on("move", (data) => {
    // Update the server's record of this player
    // We use "..." to spread existing data so we don't accidentally wipe 
    // properties (like their deck) if 'data' only contains x/y.
    players[socket.id] = { ...players[socket.id], ...data };
    
    // Broadcast means "Tell everyone ELSE, but not me"
    // (Since I moved locally, I don't need the server to tell me I moved)
    socket.broadcast.emit("updatePlayers", players);
  });

  socket.on("challenge_request", (data) => {
    console.log(`Challenge sent from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit("challenge_received", {
        id: socket.id,
        deck: data.deck
    });
  });

  // --- UPDATED DISCONNECT LISTENER ---
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // 1. Check if they were in a battle
    const me = players[socket.id];
    if (me && me.battleOpponent) {
        const opponentId = me.battleOpponent;
        
        // 2. Notify the opponent SPECIFICALLY
        console.log(`Notifying ${opponentId} of opponent disconnect.`);
        io.to(opponentId).emit("battle_opponent_disconnected", { 
            id: socket.id 
        });
        
        // 3. Clear the opponent's battle status in server memory
        if (players[opponentId]) {
            players[opponentId].battleOpponent = null;
        }
    }

    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});