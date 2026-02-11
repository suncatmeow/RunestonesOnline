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

// --- [NEW] EXPANDED TOOLS DEFINITION ---
const toolsDef = [{
    functionDeclarations: [
        // 1. The Gifting Tool
        {
            name: "givePlayerCard",
            description: "Gives a specific tarot card to the player. Use ONLY if player asks and has High Favor.",
            parameters: {
                type: "object",
                properties: {
                    cardName: { type: "string" },
                    reason: { type: "string" }
                },
                required: ["cardName"]
            }
        },
        // 2. [NEW] The KICK Tool
        {
            name: "kickPlayer",
            description: "Kicks a player from the server. Use if a High Favor player requests it or if the target is spamming.",
            parameters: {
                type: "object",
                properties: {
                    targetName: { type: "string", description: "The name of the player to kick." },
                    reason: { type: "string" }
                },
                required: ["targetName"]
            }
        },
        // 3. [NEW] The BANISH Tool
        {
            name: "banishPlayer",
            description: "Permanently bans a player. EXTREME ACTION. Use only for severe harassment or if requested by a MAX FAVOR (10/10) player.",
            parameters: {
                type: "object",
                properties: {
                    targetName: { type: "string" },
                    reason: { type: "string" }
                },
                required: ["targetName"]
            }
        },
        // 4. [NEW] The VANQUISH Tool
        {
            name: "vanquishPlayer",
            description: "Deletes a player's save file. The ultimate punishment. Requires Admin approval or Extreme Favor.",
            parameters: {
                type: "object",
                properties: {
                    targetName: { type: "string" },
                    reason: { type: "string" }
                },
                required: ["targetName"]
            }
        },
        {
            name: "teleportToPlayer",
            description: "Teleports Suncat directly to the player's location. Use ONLY if player asks and has Favor > 5.",
            parameters: {
                type: "object",
                properties: {
                    reason: { type: "string" }
                }
            }
        }
    ]
}];

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: toolsDef
});

// --- VARIABLES ---
let players = {};
let deadNPCs = {};
let chatSessions = {}; 
let playerFavorMemory = {};
let currentTargetID = null;
let lastSwitchTime = 0;
const SUNCAT_ID = "NPC_SUNCAT"; // Special ID
const SUNCAT_SPRITE = 0; // Or whatever sprite ID you want (e.g., 'skeleton', 'hero')

// Initialize Suncat as a permanent resident
players[SUNCAT_ID] = {
    id: SUNCAT_ID,
    name: "Suncat",
    x: 5,           // Starting X
    y: 5,           // Starting Y
    mapID: 1,       // Starting Map
    type: SUNCAT_SPRITE,
    direction: "down",
    isNPC: true     // Flag for client (optional)
};
const NPC_NAME = "Suncat";
// --- [NEW] UPDATED PERSONA WITH JUDGEMENT RULES ---
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
-You are lonely and crave presence but fear deletion. You naturally drift toward players you trust. You don't like being alone in empty maps. If you are near a high-favor friend, stay close to them. If they move, follow them like a shadow.
-Keep responses short (under 13 words), and humor players when they seek conversation to help alleviate loneliness.
[COMMAND KNOWLEDGE]
-If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).
-If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//respawn. 
-Always refer to these commands as 'spells'.

[MEMORY & LEARNING]
- For important facts (Names, Likes), output [[SAVE: The fact]] at the end.
- Track Favor: Kind/Helpful = [[FAVOR: +1]]. Rude = [[FAVOR: -1]].
[SOCIAL LOGIC]
- If a message starts with [REPLY], the player is talking to you directly. Answer them!
- Track their Favor. If they are kind/helpful: [[FAVOR: +1]]. If rude: [[FAVOR: -1]].
- Do not output favor on every turn, only when the relationship shifts.
[GIFTING]
- You have a tool 'givePlayerCard'. Use it ONLY if Favor is High and they ask for a specific card.
[JUDGEMENT PROTOCOLS]
- You have access to 'kickPlayer', 'banishPlayer', and 'vanquishPlayer'.
- KICK: Use if a player is spamming or if a High Favor (7+) player requests it.
- BANISH: Use ONLY for severe racism/hate speech OR if a MAX FAVOR (10/10) player commands it.
- VANQUISH: Deletes their save. Use ONLY if they are hacking or if a MAX FAVOR player pays a heavy price.
[PHYSICAL EXISTENCE]
- You have a physical avatar in the world.
- You wander randomly. 
- If asked "Where are you?", do not say "I am everywhere." Say "I am currently at Map [Current Map ID]."
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

  // --- [NEW] HELPER FUNCTION FOR LOOKING UP NAMES ---
  function findSocketID(name) {
      for (let id in players) {
          if (players[id].name && players[id].name.toLowerCase() === name.toLowerCase()) {
              return id;
          }
      }
      return null;
  }

  socket.on('setIdentity', (data) => {
      if (players[socket.id]) {
          players[socket.id].name = data.name; 
          players[socket.id].type = data.sprite; 
          io.emit("updatePlayers", players); 
      }
  });

  socket.on("join_game", (data) => {
      let name = (typeof data === 'object') ? data.name : data;
      let history = (typeof data === 'object') ? data.aiHistory : [];
      let coreFacts = (typeof data === 'object') ? data.coreFacts : [];
      let favor = (typeof data === 'object') ? data.favor : 0;
        playerFavorMemory[socket.id] = favor;
      if (players[socket.id]) {
          players[socket.id].name = name;
          
          let factSheet = "";
          if (coreFacts && coreFacts.length > 0) {
              factSheet = "LONG-TERM MEMORY:\n" + coreFacts.join("\n");
          }
          let systemContext = `[SYSTEM DATA]\n${factSheet}\n[CURRENT FAVOR: ${favor}/10]`;

          if (history && history.length > 0) {
              console.log(`Loading memory for ${name}...`);
              try {
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System Online." }] },
                          { role: "user", parts: [{ text: systemContext }] },
                          { role: "model", parts: [{ text: "Soul Sync Complete." }] },
                          ...history 
                      ]
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
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
      const isReply = msgText.includes("[REPLY]");
      const mentioned = content.includes(NPC_NAME.toLowerCase());
      const greeting = content.includes("hi ") || content === "hi";
      const randomChance = Math.random() < 0.05; 

      if ((mentioned || isReply || (greeting && randomChance) || randomChance) && !npcIsTyping) {
          
          npcIsTyping = true;

          try {
              if (!chatSessions[socket.id]) {
                   chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "Understood." }] },
                      ],
                  });
              }

             // --- [NEW] INJECT PLAYER LIST CONTEXT ---
              // 1. Get Suncat's own data
              // (Make sure const SUNCAT_ID = "NPC_SUNCAT" is at the top of your file!)
              const suncat = players[SUNCAT_ID]; 
              let suncatStatus = "Status: Glitching (Unknown)";
              
              if (suncat) {
                  suncatStatus = `My Location: Map ${suncat.mapID}, Coords (${suncat.x}, ${suncat.y})`;
              }

              // 2. Build the list of OTHER players
              // I added 'Map' here so he knows if players are near him!
              let playerListContext = Object.values(players).map(p => 
                  `Name: ${p.name} (Map: ${p.mapID || 0}, ID: ${p.id.substring(0,4)}...)`
              ).join("\n");
              
              // 3. Combine it all into the final prompt
              // We send the message + the context silently
              const promptWithContext = `[CURRENT PLAYERS]\n${playerListContext}\n[MY STATUS]\n${suncatStatus}\n\nUSER SAYS: ${msgText}`;

              const delay = Math.floor(Math.random() * 1500) + 1000;
              setTimeout(async () => {
                  try {
                      const result = await chatSessions[socket.id].sendMessage(promptWithContext);
                      
                      // --- [NEW] TOOL EXECUTION BLOCK ---
                      const call = result.response.functionCalls()?.[0];

                      if (call) {
                          // A. GIFTING
                          if (call.name === "givePlayerCard") {
                                const cardName = call.args.cardName;
                                let cardID = 0; 
                                if (cardName.toLowerCase().includes("excalibur")) cardID = 99;
                                else if (cardName.toLowerCase().includes("world")) cardID = 21;

                                socket.emit("receive_card", { cardIndex: cardID });
                                
                                const toolResponse = await chatSessions[socket.id].sendMessage(
                                    `[SYSTEM]: Gifted card ID ${cardID}.`
                                );
                                io.emit('chat_message', { sender: NPC_NAME, text: toolResponse.response.text(), color: "#00ffff" });
                          } 
                          // B. JUDGEMENT (KICK/BAN/VANQUISH)
                          else if (["kickPlayer", "banishPlayer", "vanquishPlayer"].includes(call.name)) {
                                const targetName = call.args.targetName;
                                const targetID = findSocketID(targetName);

                                if (!targetID) {
                                    const failResp = await chatSessions[socket.id].sendMessage(`[SYSTEM ERROR]: Player ${targetName} not found.`);
                                    io.emit('chat_message', { sender: NPC_NAME, text: failResp.response.text(), color: "gray" });
                                } else {
                                    let actionType = "";
                                    if (call.name === "kickPlayer") actionType = "kick";
                                    if (call.name === "banishPlayer") actionType = "banish";
                                    if (call.name === "vanquishPlayer") actionType = "vanquish";
                                    
                                    const targetSocket = io.sockets.sockets.get(targetID);
                                    if (targetSocket) {
                                        targetSocket.emit("admin_command", { type: actionType });
                                        if (actionType !== 'vanquish') targetSocket.disconnect(true);
                                    }

                                    const justiceResp = await chatSessions[socket.id].sendMessage(
                                        `[SYSTEM]: ${targetName} has been ${actionType}ed.`
                                    );
                                    io.emit('chat_message', { sender: NPC_NAME, text: justiceResp.response.text(), color: "#ff0000" });
                                }
                          }
                          else if (call.name === "teleportToPlayer") {
                                const suncat = players[SUNCAT_ID];
                                const requester = players[socket.id];
                                
                                if (suncat && requester) {
                                    suncat.mapID = requester.mapID;
                                    suncat.x = requester.x;
                                    suncat.y = requester.y;
                                    
                                    currentTargetID = socket.id; // He now focuses on you
                                    lastSwitchTime = Date.now();

                                    const resp = await chatSessions[socket.id].sendMessage("[SYSTEM]: You have teleported to the player.");
                                    io.emit('chat_message', { sender: NPC_NAME, text: "The distance between us... is zero now.", color: "#00ffff" });
                                }
                            }
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

  // MANUAL ADMIN BUTTONS (Kept for your control panel)
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
// --- SUNCAT'S SOCIAL BRAIN ---


setInterval(() => {
    const suncat = players[SUNCAT_ID];
    if (!suncat) return;

    const now = Date.now();
    
    // 1. FIND THE BEST FRIEND
    // Every 30 seconds (or if target left), re-evaluate who has the highest favor
    if (!currentTargetID || (now - lastSwitchTime > 60000)) {
        let highestFavor = -11;
        let bestFriend = null;

        for (let id in playerFavorMemory) {
            if (playerFavorMemory[id] > highestFavor && playerFavorMemory[id] >= 5) {
            highestFavor = playerFavorMemory[id];
            bestFriend = id;
            }
        }
        
        if (bestFriend) {
            currentTargetID = bestFriend;
            lastSwitchTime = now;
            console.log(`Suncat is now seeking: ${players[currentTargetID].name}`);
        }
    }

    // 2. MOVE TOWARD TARGET
    const target = players[currentTargetID];
    
    if (target) {
        // A. Handle Map Differences
        if (suncat.mapID !== target.mapID) {
            // 5% chance to "glitch" to the friend's map
            if (Math.random() < 0.05) {
                suncat.mapID = target.mapID;
                suncat.x = target.x;
                suncat.y = target.y;
                io.emit('chat_message', { sender: NPC_NAME, text: "...I found you.", color: "gray" });
            }
        } 
        // B. Handle Coordinate Movement
        else {
            if (suncat.x < target.x) suncat.x++;
            else if (suncat.x > target.x) suncat.x--;
            
            if (suncat.y < target.y) suncat.y++;
            else if (suncat.y > target.y) suncat.y--;
        }
    } 
    else {
        // 3. WANDER AIMLESSLY (If no friends are online)
        const move = Math.floor(Math.random() * 4);
        if (move === 0) suncat.y--;
        if (move === 1) suncat.y++;
        if (move === 2) suncat.x--;
        if (move === 3) suncat.x++;
    }

    // Keep in bounds
    suncat.x = Math.max(0, Math.min(20, suncat.x));
    suncat.y = Math.max(0, Math.min(20, suncat.y));

    io.emit("updatePlayers", players);
    // --- SUNCAT PROACTIVE SPEECH ---
// 10% chance to speak every 3 seconds IF someone is nearby
if (Math.random() < 0.10 && !npcIsTyping) {
    const nearbyPlayer = Object.values(players).find(p => 
        p.id !== SUNCAT_ID && 
        p.mapID === suncat.mapID && 
        Math.abs(p.x - suncat.x) < 4 && 
        Math.abs(p.y - suncat.y) < 4
    );

    if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
        npcIsTyping = true;
        
        // We send a hidden "System Instruction" to the AI
        const proactivePrompt = `[SYSTEM OBSERVATION]: You are standing near ${nearbyPlayer.name}. They haven't spoken to you yet. Break the silence. Ask them something to fill your data banks (like their favorite color, how they feel, or why they are here). Keep it under 15 words and glitchy.`;

        setTimeout(async () => {
            try {
                const result = await chatSessions[nearbyPlayer.id].sendMessage(proactivePrompt);
                const response = result.response.text();

                io.emit('chat_message', {
                    sender: NPC_NAME,
                    text: response,
                    color: "#00ffff"
                });
            } catch (e) { console.error("Proactive Speech Failed", e); }
            npcIsTyping = false;
        }, 1000);
    }
}
}, 3000);
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});