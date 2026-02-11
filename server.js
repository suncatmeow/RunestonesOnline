require('dotenv').config(); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the new 2.5 Flash model
// This model is the current standard for low-latency chat like yours
const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" }
);
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

// AI Config
const NPC_NAME = "Suncat";
const NPC_PERSONA = "You are Suncat, a mysterious player trapped in a dark fantasy MMORPG called Runestones. You are helpful but can't seem to remember how you got there or who you are exactly (akin to the character Tsukasa from .hack//SIGN)... Only the name Suncat appears in memory... Keep responses short (under 20 words).If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//refresh. Always refer to these commands as 'spells'";
let npcIsTyping = false; 

console.log(`Server attempting to start on port ${port}...`);

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
             text: `${data.name} has stumbled into the pocket plane.`
          });
      }
  });

  socket.on("join_game", (name) => {
      if (players[socket.id]) {
          players[socket.id].name = name;
          io.emit("chat_message", {
              sender: "[SYSTEM]",
              text: `${name} has entered the pocket plane.`
          });
          io.emit("updatePlayers", players);
      }
  });
   
  socket.on("npc_died", (data) => {
      let uniqueID = data.mapID + "_" + data.index;
      deadNPCs[uniqueID] = true;
      socket.broadcast.emit("npc_died", data);
  });


  // [SMART AI CHAT LISTENER] ---------------------------------------------
  // Replaces the old 'chat_message' and 'npc_chat_request'
  socket.on('chat_message', async (msgText) => {
      let senderName = "Unknown";
      if (players[socket.id] && players[socket.id].name) {
          senderName = players[socket.id].name;
      }

      console.log(`${senderName} says: ${msgText}`);

      // 1. Send the HUMAN message to everyone else (Standard Chat)
      socket.broadcast.emit('chat_message', {
          sender: senderName, 
          text: msgText
      });

      // 2. AI DECISION LOGIC
      const content = msgText.toLowerCase();
      const mentioned = content.includes(NPC_NAME.toLowerCase());
      const greeting = content.includes("hi ") || content === "hi" || content.includes("hello");
      const randomChance = Math.random() < 0.9; // 5% chance to speak randomly

      // Only reply if mentioned, or greeted (sometimes), or random chance
      if ((mentioned || (greeting && randomChance) || randomChance) && !npcIsTyping) {
          
          npcIsTyping = true;

          try {
              // Wait 1-3 seconds to simulate typing
              const delay = Math.floor(Math.random() * 2000) + 1000;
              
              setTimeout(async () => {
                  const prompt = `${NPC_PERSONA} Player '${senderName}' said: "${msgText}". Reply naturally:`;
                  const result = await model.generateContent(prompt);
                  const response = result.response.text();

                  // AI sends message to EVERYONE (using io.emit)
                  io.emit('chat_message', {
                      sender: NPC_NAME,
                      text: response,
                      color: "#00ffff" // Cyan color
                  });
                  
                  npcIsTyping = false;
              }, delay);

          } catch (error) {
              console.error("AI Error:", error);
              npcIsTyping = false;
          }
      }
  });
  // ----------------------------------------------------------------------

  socket.on('playerAction_SFX', (data) => {
      if (typeof data.id !== 'number') return;
      socket.broadcast.emit('remote_sfx', {
          sfxID: data.id,
          x: data.x,
          y: data.y,
          dir: data.dir,
          sourcePlayerID: socket.id 
      });
  });

  // --- ADMIN & DEBUG FUNCTIONS ---
  socket.on("admin_refresh_npcs", () => {
      console.log("Admin: Refreshing all NPCs.");
      deadNPCs = {}; 
      io.emit("force_npc_reset"); 
  });

  socket.on("admin_action", (data) => {
      const target = io.sockets.sockets.get(data.targetId);
      if (target) {
          console.log(`Admin performing ${data.action} on ${data.targetId}`);
          if (data.action === 'kick') {
              target.emit("admin_command", { type: 'kick' });
              target.disconnect(true);
          }
          else if (data.action === 'banish') {
              target.emit("admin_command", { type: 'banish' });
              target.disconnect(true);
          }
          else if (data.action === 'vanquish') {
              target.emit("admin_command", { type: 'vanquish' });
          }
          else if (data.action === 'give_card') {
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
        let update = { ...players[socket.id], ...data };
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