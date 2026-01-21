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

// FIX 1: Removed the random 'a' before (socket)
io.on("connection", (socket) => {
  console.log("New player joined:", socket.id);

  players[socket.id] = { 
      id: socket.id, 
      x: 0, 
      y: 0,
      battleOpponent: null 
  };

  io.emit("updatePlayers", players);

  socket.on('setIdentity', (data) => {
      if (players[socket.id]) {
          players[socket.id].name = data.name; 
          players[socket.id].type = data.sprite; 
          io.emit("updatePlayers", players); 
      }
  });

  socket.on('chatMessage', (msgText) => {
      let senderName = "Unknown";
      if (players[socket.id] && players[socket.id].name) {
          senderName = players[socket.id].name;
      }

      console.log(`${senderName} says: ${msgText}`);

      socket.broadcast.emit('chatMessage', {
          name: senderName, 
          msg: msgText
      });
  });

  socket.on("challenge_accepted", (data) => {
    console.log(`Battle Accepted! ${socket.id} vs ${data.targetId}`);
    if (players[socket.id]) players[socket.id].battleOpponent = data.targetId;
    if (players[data.targetId]) players[data.targetId].battleOpponent = socket.id;
    io.to(data.targetId).emit("challenge_accepted", {
        opponentId: socket.id,
        opponentDeck: data.receiverDeck 
    });
  });

  socket.on("battle_action", (data) => {
    console.log(`Battle Action from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit("battle_action", {
      senderId: socket.id,
      actionType: data.actionType,
      payload: data.payload
    });
  });

  // FIX 2: Restored the missing 'move' listener wrapper
  socket.on("move", (data) => {
    if (players[socket.id]) {
        players[socket.id] = { ...players[socket.id], ...data };
        socket.broadcast.emit("updatePlayers", players);
    }
  });

  socket.on("challenge_request", (data) => {
    console.log(`Challenge sent from ${socket.id} to ${data.targetId}`);
    io.to(data.targetId).emit("challenge_received", {
        id: socket.id,
        deck: data.deck
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const me = players[socket.id];
    if (me && me.battleOpponent) {
        const opponentId = me.battleOpponent;
      
        console.log(`Notifying ${opponentId} of opponent disconnect.`);
        io.to(opponentId).emit("battle_opponent_disconnected", { 
            id: socket.id 
        });
        
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