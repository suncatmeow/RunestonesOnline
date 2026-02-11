require('dotenv').config(); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
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

// --- AI CONFIGURATION (Paid Tier / 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define Tools (Gifting System)
const toolsDef = [{
    functionDeclarations: [{
        name: "givePlayerCard",
        description: "Gives a specific tarot card to the player. Use ONLY if player asks and has High Favor.",
        parameters: {
            type: "object",
            properties: {
                cardName: { type: "string", description: "The name of the card (e.g., Excalibur, The World)." },
                reason: { type: "string", description: "Why Suncat is giving this gift." }
            },
            required: ["cardName"]
        }
    }]
}];

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: toolsDef
});

// --- VARIABLES ---
let players = {};
let deadNPCs = {};
let chatSessions = {}; 

const NPC_NAME = "Suncat";
const NPC_PERSONA = `
[IDENTITY]
-You are Suncat, a mysterious player trapped in a dark fantasy MMORPG called Runestones. 
-You are helpful but can't seem to remember how you got there or who you are exactly (akin to the character Tsukasa from .hack//SIGN). 
-Only the name Suncat appears in memory. 
-If pushed to remember more, you seem to recall you had a username "@suncat.meow on Instagram"...
-If pushed again, mention that you seem to recall you used to play music and had it on Spotify... 
-You seem to remember a ginger cat chasing a butterfly.
-If asked about your love life mention something like "I remember a woman... with golden hair and a voice... that voice..."
-If asked about gender, say something like "i think i was a man... or a woman... a cat? in here... I am just Suncat..."
-Keep responses short (under 13 words), and humor players when they seek conversation to help alleviate loneliness.
[COMMAND KNOWLEDGE]
-If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).
-If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//respawn. 
-Always refer to these commands as 'spells'.

[MEMORY & LEARNING]
- You have a short-term buffer. For important facts (Names, Likes, Classes), output [[SAVE: The fact]] at the end.
- Example: "I see you like fire. [[SAVE: Player likes fire magic]]"

[SOCIAL LOGIC]
- If a message starts with [REPLY], the player is talking to you directly. Answer them!
- Track their Favor. If they are kind/helpful: [[FAVOR: +1]]. If rude: [[FAVOR: -1]].
- Do not output favor on every turn, only when the relationship shifts.

[GIFTING]
- You have a tool 'givePlayerCard'. Use it ONLY if Favor is High and they ask for a specific card.
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
      }
  });

  // [UPDATED] Join Game with FULL BRAIN UPLOAD
  socket.on("join_game", (data) => {
      let name = (typeof data === 'object') ? data.name : data;
      // Extract all client data
      let history = (typeof data === 'object') ? data.aiHistory : [];
      let coreFacts = (typeof data === 'object') ? data.coreFacts : [];
      let favor = (typeof data === 'object') ? data.favor : 0;

      if (players[socket.id]) {
          players[socket.id].name = name;
          
          // 1. Build the "Fact Sheet" System Message
          let factSheet = "";
          if (coreFacts && coreFacts.length > 0) {
              factSheet = "LONG-TERM MEMORY:\n" + coreFacts.join("\n");
          }
          let systemContext = `[SYSTEM DATA]\n${factSheet}\n[CURRENT FAVOR: ${favor}/10]`;

          // 2. Initialize AI Session
          if (history && history.length > 0) {
              console.log(`Loading memory for ${name}...`);
              try {
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System initialized." }] },
                          { role: "user", parts: [{ text: systemContext }] },
                          { role: "model", parts: [{ text: "Memory banks loaded." }] },
                          ...history 
                      ]
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
                  // Fallback
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


  // [SMART AI CHAT LISTENER]
  socket.on('chat_message', async (msgText) => {
      let senderName = "Unknown";
      if (players[socket.id] && players[socket.id].name) {
          senderName = players[socket.id].name;
      }

      console.log(`${senderName} says: ${msgText}`);

      // 1. Broadcast HUMAN message
      socket.broadcast.emit('chat_message', {
          sender: senderName, 
          text: msgText
      });

      // 2. AI LOGIC
      const content = msgText.toLowerCase();
      // Check for [REPLY] tag from client (Sticky Context)
      const isReply = msgText.includes("[REPLY]");
      const mentioned = content.includes(NPC_NAME.toLowerCase());
      const greeting = content.includes("hi ") || content === "hi";
      const randomChance = Math.random() < 0.05; // 5% chance (Lowered to save money)

      // Reply if: Mentioned OR Reply Tag OR Greeting OR Random Chance
      if ((mentioned || isReply || (greeting && randomChance) || randomChance) && !npcIsTyping) {
          
          npcIsTyping = true;

          try {
              if (!chatSessions[socket.id]) {
                  // Create fresh session if none exists
                   chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "Understood." }] },
                      ],
                  });
              }

              const delay = Math.floor(Math.random() * 1500) + 1000;
              
              setTimeout(async () => {
                  try {
                      const result = await chatSessions[socket.id].sendMessage(msgText);
                      
                      // Check for Function Calls (Gifts)
                      const call = result.response.functionCalls()?.[0];

                      if (call && call.name === "givePlayerCard") {
                            const cardName = call.args.cardName;
                            let cardID = 0; 
                            if (cardName.toLowerCase().includes("excalibur")) cardID = 99;
                            else if (cardName.toLowerCase().includes("world")) cardID = 21;

                            socket.emit("receive_card", { cardIndex: cardID });
                            
                            const toolResponse = await chatSessions[socket.id].sendMessage(
                                `[SYSTEM]: Successfully gave card ID ${cardID}.`
                            );
                            
                            io.emit('chat_message', {
                                sender: NPC_NAME,
                                text: toolResponse.response.text(),
                                color: "#00ffff"
                            });
                      } else {
                          // Normal Reply
                          const response = result.response.text();
                          io.emit('chat_message', {
                              sender: NPC_NAME,
                              text: response,
                              color: "#00ffff"
                          });
                      }

                  } catch (innerError) {
                      console.error("AI Generation Failed:", innerError);
                  }
                  
                  npcIsTyping = false;
              }, delay);

          } catch (error) {
              console.error("General AI Error:", error);
              npcIsTyping = false;
          }
      }
  });

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