require('dotenv').config(); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the new 2.5 Flash model
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

// --- AI MEMORY STORAGE ---
// This object will hold the conversation history for each active player
let chatSessions = {}; 

const NPC_NAME = "Suncat";
// We define the Persona separately so we can inject it into the memory start
const NPC_PERSONA = `
You are Suncat, a mysterious player trapped in a dark fantasy MMORPG called Runestones. 
You are helpful but can't seem to remember how you got there or who you are exactly (akin to the character Tsukasa from .hack//SIGN). 
Only the name Suncat appears in memory.
Keep responses short (under 20 words) and "chatty".
If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).
If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//respawn. 
Always refer to these commands as 'spells'.
`;

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

  // [UPDATED] Join Game now accepts Memory Upload
  socket.on("join_game", (data) => {
      // Handle legacy clients sending just a string name
      let name = (typeof data === 'object') ? data.name : data;
      let history = (typeof data === 'object') ? data.aiHistory : [];

      if (players[socket.id]) {
          players[socket.id].name = name;
          
          // --- HYBRID MEMORY SYNC ---
          if (history && history.length > 0) {
              console.log(`Loading memory for ${name}...`);
              
              // We inject the Persona FIRST, then the Player's History
              try {
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System initialized." }] },
                          ...history 
                      ]
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
                  // Fallback to fresh session
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System initialized." }] }
                      ]
                  });
              }
          }

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


  // [MEMORY-ENABLED AI CHAT] ---------------------------------------------
  socket.on('chat_message', async (msgText) => {
      let senderName = "Unknown";
      if (players[socket.id] && players[socket.id].name) {
          senderName = players[socket.id].name;
      }

      console.log(`${senderName} says: ${msgText}`);

      // 1. Broadcast the HUMAN message (Standard Chat)
      socket.broadcast.emit('chat_message', {
          sender: senderName, 
          text: msgText
      });

      // 2. AI LOGIC
      const content = msgText.toLowerCase();
      const mentioned = content.includes(NPC_NAME.toLowerCase());
      const greeting = content.includes("hi ") || content === "hi" || content.includes("hello");
      // Increased chance slightly since he's smarter now
      const randomChance = Math.random() < 0.1; 

      if ((mentioned || (greeting && randomChance) || randomChance) && !npcIsTyping) {
          
          npcIsTyping = true;

          try {
              // --- STEP A: CHECK FOR EXISTING MEMORY ---
              if (!chatSessions[socket.id]) {
                  console.log(`Creating new AI memory for ${senderName}`);
                  
                  // Start a NEW chat session
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "Understood. I am Suncat." }] },
                      ],
                  });
              }

              // --- STEP B: SEND MESSAGE TO MEMORY ---
              const delay = Math.floor(Math.random() * 2000) + 1000;
              
              setTimeout(async () => {
                  // We use .sendMessage() instead of .generateContent()
                  // This AUTOMATICALLY saves the user's text and Suncat's reply to history
                  const result = await chatSessions[socket.id].sendMessage(msgText);
                  const response = result.response.text();

                  io.emit('chat_message', {
                      sender: NPC_NAME,
                      text: response,
                      color: "#00ffff"
                  });
                  
                  npcIsTyping = false;
              }, delay);

          } catch (error) {
              console.error("AI Error:", error);
              // If memory crashes, reset it
              delete chatSessions[socket.id];
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

  socket.on("admin_refresh_npcs", () => {
      console.log("Admin: Refreshing all NPCs.");
      deadNPCs = {}; 
      io.emit("force_npc_reset"); 
  });

  socket.on("admin_action", (data) => {
      const target = io.sockets.sockets.get(data.targetId);
      if (target) {
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
    if (players[socket.id]) players[socket.id].battleOpponent = data.targetId;
    if (players[data.targetId]) players[data.targetId].battleOpponent = socket.id;
    io.to(data.targetId).emit("challenge_accepted", {
        opponentId: socket.id,
        opponentDeck: data.receiverDeck 
    });
  });

  socket.on("battle_action", (data) => {
    io.to(data.targetId).emit("battle_action", {
      senderId: socket.id,
      actionType: data.actionType,
      payload: data.payload
    });
  });

  socket.on("move", (data) => {
    if (players[socket.id]) {
        let update = { ...players[socket.id], ...data };
        if (!data.name) update.name = players[socket.id].name;
        players[socket.id] = update;
        socket.broadcast.emit("updatePlayers", players);
    }
  });

  socket.on("challenge_request", (data) => {
    io.to(data.targetId).emit("challenge_received", {
        id: socket.id,
        deck: data.deck
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // CLEANUP MEMORY: If player leaves, Suncat forgets them (server side)
    // The Client Side (localStorage) keeps the permanent copy
    if (chatSessions[socket.id]) {
        delete chatSessions[socket.id];
    }

    io.emit("chat_message", {
        sender: "[SYSTEM]",
        text: ` ${players[socket.id].name} has logged out.`
    });
    
    const me = players[socket.id];
    if (me && me.battleOpponent) {
        const opponentId = me.battleOpponent;
        io.to(opponentId).emit("battle_opponent_disconnected", { id: socket.id });
        if (players[opponentId]) players[opponentId].battleOpponent = null;
    }
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });

});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});