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
let deadNPCs = {};
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

  socket.emit("load_dead_npcs", deadNPCs);

  socket.on('setIdentity', (data) => {
      if (players[socket.id]) {
          players[socket.id].name = data.name; 
          players[socket.id].type = data.sprite; 
          io.emit("updatePlayers", players); 
          io.emit("chat_message", {
          sender: "[SYSTEM]",
          text: `${data.name} has entered the Pocket Plane.`
      });
      }
  });
      io.emit("chat_message", {
          sender: "[SYSTEM]",
          text: `${players[socket.id].name} logged in.`});
   
  socket.on("npc_died", (data) => {
      // Create a unique ID string (e.g., "1_5" for Map 1, NPC 5)
      let uniqueID = data.mapID + "_" + data.index;
      
      // Save it to server memory
      deadNPCs[uniqueID] = true;

      // Broadcast to everyone else so the NPC dies on their screens too
      socket.broadcast.emit("npc_died", data);
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

  // --- ADMIN & DEBUG FUNCTIONS ---

  // 1. Refresh All NPCs (Global)
  socket.on("admin_refresh_npcs", () => {
      console.log("Admin: Refreshing all NPCs.");
      deadNPCs = {}; // Clear server memory of dead NPCs
      io.emit("force_npc_reset"); // Tell all clients to respawn everything
  });

  // 2. Targeted Player Actions
  socket.on("admin_action", (data) => {
      // data = { targetId, action, payload }
      const target = io.sockets.sockets.get(data.targetId);
      
      if (target) {
          console.log(`Admin performing ${data.action} on ${data.targetId}`);
          
          if (data.action === 'kick') {
              // Tell client to reload, then disconnect socket
              target.emit("admin_command", { type: 'kick' });
              target.disconnect(true);
          }
          else if (data.action === 'banish') {
              // Tell client they are banned
              target.emit("admin_command", { type: 'banish' });
              target.disconnect(true);
              // Note: For true IP banning, you'd need a blacklist array checking socket.handshake.address
          }
          else if (data.action === 'vanquish') {
              // Delete save file
              target.emit("admin_command", { type: 'vanquish' });
          }
          else if (data.action === 'give_card') {
              // Push a card
              target.emit("receive_card", { cardIndex: data.payload });
          }
      }
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

socket.on("move", (data) => {
    if (players[socket.id]) {
        
        // FIX: Create a safe update object
        // We copy x, y, dir, etc. blindly, but we protect the name.
        let update = { ...players[socket.id], ...data };

        // If the incoming data has a bad name (undefined/null), 
        // REVERT to the name we already had in memory.
        if (!data.name) {
            update.name = players[socket.id].name;
        }

        players[socket.id] = update;
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
    io.emit("chat_message", {
        sender: "[SYSTEM]",
        text: ` ${players[socket.id].name} has logged out.`
    });
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