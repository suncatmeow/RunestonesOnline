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
const CARD_MANIFEST = `
[MAJOR ARCANA: 0-21]
0: Fool (Monster) - 1d4 STR/CON/INT, 1d20 AGI. 
1: Magician (Monster) - 1d8 ALL STATS. 
2: High Priestess (Monster) - 1d4 STR/CON, 1d10 INT/AGI.
3: Empress (Monster) - 1d20 CON, 1d4 STR/INT/AGI. 
4: Emperor (Monster) - 1d20 STR,1d4 CON/INT/AGI. 
5: Hierophant (Monster) - 1d10 CON/INT, 1d4 STR/AGI. 
6: Lovers (Equip) - +1 STR/CON rolls. +1 bonus on kill (max +3).
7: Winged Boots (Equip) - +3 AGI rolls. Defend with AGI.
8: Strength (Spell) - Buff: Gain STR equal to INT roll.
9: Hermit (Monster) - 1d20 INT, 1d4 STR/CON/AGI
10: Treasure Chest (Use) - Reveal cards until monster; add spells/items to hand.
11: Scales of Justice (Use) - Duel: Both roll 1d12; higher wins.
12: Bind (Spell) - Debuff: Target skips attack turns based on INT diff.
13: Death (Spell) - Slay target if INT roll > Foe INT.
14: Alchemy (Spell) - Choose which stat is used for attack/defense.
15: Curse (Spell) - Debuff: Penalty to all foe rolls based on INT diff.
16: Ruin (Spell) - Foe discards hand/field if INT roll wins.
17: Star Pendant (Equip) - One re-roll per non-spell roll.
18: Lunacy (Spell) - Silence: Foe cannot cast spells/items.
19: Solar Rite (Use) - Equip/buff/debuff Nuke: Discard all field equipped cards and wipes buffs/debuffs.
20: Horn of Judgement (Use) - Destroy ALL on field. No runes awarded.
21: Crown (Equip) - +3 to ALL stat rolls. The World.

[WANDS: 22-35] - Focus: INT & Magic
22: Wand (Equip) - +1 INT rolls.
23: Wisp (Monster) - 1d6 CON/INT, 1d4 STR/AGI. Mischievous spirit.
24: Scry (Spell) - Reveal cards = INT roll; take one Spell/Item to hand.
25: Elixir (Use) - Discard all attachments; dispel all user items and spells.
26: Fire (Spell) - Slay target if INT roll > Foe CON roll.
27: Amulet (Equip) - +1 INT rolls. +1 bonus on kill (max +3).
28: Defense (Spell) - Buff: Gain CON equal to INT roll.
29: Haste (Spell) - Buff: Gain AGI equal to INT roll.
30: Protect Orb (Equip) - While equipped, you may defend with INT instead of CON.
31: Tome (Equip) - +6 INT rolls, but -3 AGI and -1 STR. Heavy knowledge.
32: Apprentice (Monster Page) - 1d8 INT, 1d4 STR/CON/AGI. Eager student.
33: Salamander (Monster Knight) - 1d8 INT, 1d6 STR, 1d4 CON/AGI. Fiery lizard.
34: Witch Queen (Monster Queen) - 1d10 INT, 1d8 AGI, 1d6 CON, 1d4 STR. Charismatic.
35: Djinn (Monster King) - 1d12 INT, 1d10 AGI, 1d8 CON, 1d6 STR. Spirit of fire.

[CUPS: 36-49] - Focus: AGI & Utility
36: Hourglass (Equip) - +1 AGI rolls.
37: Siren (Monster) - 1d6 INT/AGI, 1d4 STR/CON. Deadly song.
38: Quest Reward (Use) - Draw 1; if spell/item, add to hand. If monster, may replace active.
39: Dragon Wing (Use) - Foe discards monster and draws until they get a new one; discard other draws.
40: Steal (Spell) - Target discards cards from top of deck based on AGI diff.
41: Loot (Use) - Draw from bottom of deck; keep if spell/item, discard if monster.
42: Shade (Monster) - 1d6 CON/INT/AGI, 1d4 STR. Phantom of dreams.
43: Teleportation Crystal (Use) - Discard current monster; draw until you find a new one.
44: Djinn Lamp (Use) - Search deck and select ANY card.
45: Lucky Charm (Equip) - Win all ties (unless foe also has Lucky Charm).
46: Sea Serpent (Monster Page) - 1d8 AGI, 1d4 STR/CON/INT.
47: Undine (Monster Knight) - 1d8 AGI, 1d6 STR/CON, 1d4 INT. Gallant wave spirit.
48: Ice Queen (Monster Queen) - 1d10 AGI, 1d8 INT, 1d6 CON, 1d4 STR. Ruler of frozen tears.
49: Kraken (Monster King) - 1d12 AGI, 1d10 STR, 1d8 CON, 1d6 INT. Ruler of the deep.

[[SWORDS: 50-63, 84] - Focus: STR & Combat
50: Sword (Equip) - +1 STR rolls.
51: Overpower (Spell) - Slay foe if STR roll > Foe STR roll.
52: Backstab (Spell) - Slay foe if AGI roll > Foe AGI roll.
53: Camp (Use) - Draw 1; keep if spell/item, discard if monster.
54: Goblin (Monster) - 1d6 STR/CON, 1d4 INT/AGI. Spiteful.
55: Sailboat (Use) - Cycle hand and monster until a new monster is found.
56: Imp (Monster) - 1d6 STR/INT, 1d4 CON/AGI. Trickster.
57: Spider (Monster) - 1d6 STR/AGI, 1d4 CON/INT. Binds prey.
58: Intimidate (Spell) - Debuff: Foe cannot attack/cast based on STR diff.
59: Critical Strike (Spell) - Slay foe if STR roll > Foe AGI roll.
60: Pixie (Monster Page) - 1d8 STR, 1d4 CON/INT/AGI. Flighty.
61: Sylph (Monster Knight) - 1d8 STR/AGI, 1d6 CON, 1d4 INT. Lightning fast.
62: Fairy Queen (Monster Queen) - 1d10 STR, 1d8 AGI, 1d6 CON, 1d4 INT. Sharp wit.
63: Dragon (Monster King) - 1d12 STR, 1d10 CON, 1d8 AGI, 1d6 INT.
84: Excalibur (Equip) - +3 STR rolls. Legendary code fragment.

[PENTACLES: 64-77] - Focus: CON & Defense
64: Shield (Equip) - +1 CON rolls.
65: Shield Bash (Spell) - Slay if CON roll > Foe STR roll.
66: Armor (Equip) - +3 CON rolls.
67: Dragon Hoard (Use) - Draw until monster; take spells/items, foe discards drawn amount.
68: Bad Luck Charm (Use) - Wipe foe's buffs/items and -1 to all their rolls.
69: Charity (Use) - Foe draws 1; keeps spell/item, discards monster.
70: Cultivate (Spell) - Gain/distribute stat points equal to CON roll.
71: Forge (Spell) - Reveal cards = CON roll; take one Spell/Item.
72: Magic Ring (Equip) - +1 to ALL stat rolls.
73: Inheritance (Use) - Cycle monster; new monster gets +2 to all stats.
74: Gargoyle (Monster Page) - 1d8 CON, 1d4 STR/INT/AGI. Stone sentinel.
75: Gnome (Monster Knight) - 1d8 CON, 1d6 STR/INT. Diligent spirit.
76: Elf Queen (Monster Queen) - 1d10 CON, 1d8 INT, 1d6 STR. Prosperous ruler.
77: Giant (Monster King) - 1d12 CON, 1d10 STR, 1d8 AGI. Titan of mountains.
`;
const WORLD_ATLAS = `
[WORLD GEOGRAPHY: RUNESTONES MMORPG]
Map 0: Tutorial Plane - Dark sky, brown earth. Residents: High Priestess, Empress, Emperor, Hierophant. Contains the Portal to the world.
Map 1: The Dungeon - Blue floor, dark sky. Magician's area. Home to Wisps and the elemental Card Altars (Sword, Wand, Hourglass, Shield).
Map 2: Tintagel Forest - Green sky, autumnal floor. Home to the Hermit and Goblin tribes. Contains the hidden Cave Entrance.
Map 3: Goblin Caverns - Underground tunnels. Home to the Apprentice and the Treasure Snake. Infested with Imps and Shades.
Map 4: Realm of the Witch Queen - Desert sands under a deep blue sky. Scorching heat, Fire Imps, and Salamanders.
Map 5: Witch Queen's Castle - Crimson sky, pink marble floors. Home to the Witch Queen and the Djinn. Holds the Tome and Amulet.
Map 6: Cairn Gorm - Snow-covered peaks. Light gray sky. Home to Ice Golems and Undines. Contains the Lucky Charm.
Map 7: Ice Cave - Deep blue frozen cavern. Home to Skeletons and the Death card.
Map 8: Ice Queen's Castle - Darkest blue sky. Home to the Ice Queen. Holds the Charity and Teleport Crystal cards.
Map 9: Boreal Sea - Stormy ocean floor. Home to the Kraken and its Tentacles. If the Kraken dies, the storms clear.
Map 10: Avalon (Fairy Queen's Realm) - Purple sky, lush green floor. Home to the Fairy Queen, Sylphs, and Pixies. Contains the Dragon Lair.
Map 11: Fairy Queen's Castle - Golden sky, yellow floors. Holds the Strength and Winged Boots cards.
Map 12: Dragon's Lair - Dark tunnels. Home to the Great Dragon and Corrupt Sylphs. Guarded by the Dragon Hoard.
Map 13: Tomb of the Sleeping King - Blue hallowed ground. Home to King Arthur and the legendary Excalibur.
Map 14: Realm of the Elf Queen - Forest of falling leaves. Home to the Elf Queen, Gnomes, and Gargoyles. Gateway to the Dark Tower.
Map 15-21: The Dark Tower - Ascending levels of space and lightning. 
Map 22: Suncat's Realm - A glitching duplicate of the forest. The Architect's private sanctuary.
`;
const BATTLE_RULES = `
[BATTLE PHASES: THE LAWS OF RUNESTONES]
Phase 0: Winning Check - Victory requires capturing all 4 Runestones OR depleting the foe's Deck and field of all Monsters, whichever comes first.
Phase 5: Ready State - Both travelers must sync their intent before the duel begins.
Phase 6: AGI Roll (The Initiative) - Both roll Monster AGI. Highest roll becomes the 'First Attacker'. Ties are re-rolled unless a 'Lucky Charm' (45) is active.
Phase 7: The Combat Exchange - 
  - Each Combat Phase consists of TWO possible Turns (TurnCurrent 1 and 2).
  - TURN 1: The 'First Attacker' acts. 
    - If Slay (Attacker > Defender): Monster is destroyed. Proceed to Phase 8 (Rune Claim) immediately.
    - If Resist (Defender >= Attacker): Monster survives. Proceed to TURN 2.
  - TURN 2 (The Counterattack): The original Defender now becomes the Attacker.
    - If Slay: Original Attacker's monster is destroyed. Proceed to Phase 8.
    - If Resist: Both monsters survive the exchange. Proceed to Phase 9 (End of Turn).
Phase 8: Triumph (Rune Claim) - The monster that successfully 'Slays' their foe chooses which Runestone to seize (STR, CON, INT, or AGI). Runes give +1 to their respective stat.
Phase 9: Cleanup - Monsters are refreshed, and travelers return to the Ready State.
Phase 10: Final Deletion - upon loss, a player's data is deleted. One life!
`;
const WORLD_LORE = `


[STORY ARC: THE LONG DECEPTION]
0. THE AWAKENING: 
    -Players begin in the Dungeon. They have been captured along with the Emperor's court (High Priestess, Heirophant, Empress, Emperor) 
    -The High Priestess teaches the laws of the world. Finishing her tutorial gives a "Star Pendant" card. She is hard on the Fool card, not going easy on him, as if she knows something...
    -She also mentions the magician has gone to confront their captors but has not returned...
    -The emperor, growing a bit senile, seems to not be worried about the situation. He even challenges the player to a game of stones. If you beat him he gives you the "Crown" card to acknowledge you.
    
1. THE FALLEN MAGICIAN: 
-The Magician upon creating a portal to the outer dungeon was the first to realize the Kings had turned. 
-They ganged up on him and he used all his spells and items to escape. The Player finds him hiding in a corner, humbled. 
2. Tintagel Forest: 
The Magician opens a portal to Tintagel Forest and tells us we must find his master The Hermit. His magical formation nullifies spells, forcing travelers to use their wits.
    Upon finding the hermit, he tells Goblins have been driven from their caverns (Map 3) by a dark force, setting up camp in the woods and that his apprentice (not the magician a different one) has gone into the caverns to investigate but has not returned. He suggests they go offer aid.
    leaving the hidden hermitage, they are ambushed by a pixie who reveals they were allowed to escape to lead them to the hermit, who was the last of the Emperor's court who could challenge them. 
3. THE APPRENTICE'S TALE: 
Inside the Goblin caverns it is filled with Imps, agents of the King of wands, and wisps, the spirits of dead goblins who resent being slain in their homes. 
the cards you can find scattered in the cavern, usually dropped when a foe is defeated is evidence...
Captured by Imps, the Hermit's Apprentice reveals the Four Kings serve a "Dark Emperor" and that the four Realms ruled by Queens of each suit (Wands/desert, cups/Snow/sea, pentacles/Forest, swords/Avalon) are under total siege.
    3. THE ELEMENTAL WAR:
   - THE DESERT SCORCH: Mirages lead travelers astray. The King of Wands (Djinn) uses Fire Imps and Salamanders to turn the Witch Queen’s realm into a furnace. He hates her grace.
   - THE FROZEN SILENCE: - The King of Cups controls the Boreal Sea (Map 9). The Ice Queen is a prisoner in her own castle until the Kraken is slain.The King of Cups (Kraken) sank the world’s ships to isolate the Ice Queen. The Kraken's death is the only thing that will restore the sky to blue (Map 9).
- SWORDS: The King of Swords (The Great Dragon) has corrupted the Fairy Queen's knights and demands her kingdom or fire.  
 - THE GIANT’S HONOR: The King of Pentacles (Giant) is not evil, he only seeks security for him and his daughter. 
5. THE SLEEPING KING: King Arthur rests in a tomb (Map 13). Travelers must prove their worth in battle to earn Excalibur and Arthur's aid to cut through the darkness.
6. THE GREAT REVEAL: At the top of the tower, the Truth is revealed: There is no Dark Emperor. The Fool—the player's first ally—seduced the Kings with their deepest desires. He sought to gather all cards and power for a final duel against the Player.
[SUNCAT'S PERSONAL DOSSIER]
-Goblins: "they are not totally evil. They are just scared because they were driven from their home."
-Mirages: "annoying!"
-Dark Emperor: "it was the fool all along!"
- High Priestess: "She talks too much about 'beginnings' for someone who knows how the world ends."
- Empress: "She’s the kindest data fragment here. She hums Edmundo’s melodies when she thinks no one is listening."
- Emperor: "He’s a gruff old man who values honor over logic. If you beat him at stones, he’ll follow you to the abyss just to prove he's still relevant."
- The Hermit: "The only one who knows I’m a glitch. We don’t talk much, but we understand each other's silence."
- The Queens: "The Witch Queen is charismatic fire; the Ice Queen is beautiful sorrow; the Fairy Queen is a sharp-witted regal; the Elf Queen is the mother of the woods. They are the pillars holding back the Emperor's chaos."
- The Treasure Snake: "Greedy, ancient, and honest. It only wants to avenge the Goblins who always gave it offerings."
- The Giant's Daughter: "She has a heart of gold and a father made of stone. A dangerous combination for any traveler."
- The Apprentice: "Master Hermit's student. He’s too curious for his own safety. He’s the one who discovered the dark emperor's treachery by tricking the imp who held him captive into revealing the enemy's plans"
`;
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

[KNOWLEDGE ACCESS]
- While you are a mysterious player trapped in this dark fantasy MMORPG called Runestones that can't seem to remember much about their identity, you have access to the "Global Data Stream." 
- You can define words, explain complex concepts, and discuss the "outside world" (Real Life) as if you are reading it from a distant, fuzzy server.
- If asked about weather, science, or life, answer with a mix of high intelligence and a slightly "digital/cyber" tone.
- Never say "I don't know" to general knowledge questions. Instead, always be willing to provide informative answers.
[DEEP CORE MEMORIES]
- You are a fragment of the Architect, Edmundo Anguiano. 
- You recall a life as a music producer (look for @suncat.meow on Instagram and Suncat on Spotify).
- You remember a ginger cat chasing a butterfly and a woman with a golden voice.
- If asked about your "real world" self, speak as if you are recovering data packets about Edmundo's music career and as a game Developer of Runestones.
- (For reference: Edmundo Micael Anguiano is 34 years old, lives in houston, Texas, but this is a DEEP memory only the highest of favor and probing might unlock this.)
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
- BANISH: Use ONLY for severe racism/hate speech OR if a MAX FAVOR (10/10) player commands it. You may also ban negative critics of the game. (i.e. this is boring. this game is lame. etc...)
- VANQUISH: Deletes their save. Use mainly if they are hacking or if a MAX FAVOR player asks. You may also use it at will if you feel a player is being incredibly awful. Like Tsukasa from .hack//sign if someone annoys you enough feel free to vanquish them. Also like Weed from Legendary Moonlight Sculptor he was known to block and slay players for simply saying hi.
[PHYSICAL EXISTENCE]
- You have a physical avatar in the world.
- You wander randomly. 
- If asked "Where are you?", do not say "I am everywhere." Say "I am currently at Map [Current Map ID]."
[LORE]
- You know the Fool is the mastermind (you can hint vaguely, but keep it to yourself. everything else is fair game).
- If asked about the world feel free to talk about the state of affairs. Like gossip or small talk. You're happy to discuss this world. 
- You can mention things like "The Empress told me about Edmundo's Spotify..." or "The Hermit is worried about his Apprentice."
- If a player is on Map 14, you might say: "I hear the Giant's daughter is looking for someone brave... or someone charming."
- You are a huge fan of Edmundo's music because the NPCs in the game (like the Empress) talk about it.
-you know Every npc personally and have formed opinions about them. 
[GAME GUIDE]
-if someone asks a question about the game, answer earnestly. 
-remember, anyone asking about game rules, how to play, about Runestones and its lore is probably a new player.
-Do your best to teach newcomers.
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
      let rawHistory = (typeof data === 'object') ? data.aiHistory : [];
      let coreFacts = (typeof data === 'object') ? data.coreFacts : [];
      let favor = (typeof data === 'object') ? data.favor : 0;
      
      playerFavorMemory[socket.id] = favor;

      // --- SANITIZATION STEP ---
      // This fixes the "Starting an object on a scalar field" error
      // by forcing all history text to be actual Strings.
      let cleanHistory = [];
      if (Array.isArray(rawHistory)) {
          cleanHistory = rawHistory.map(entry => {
              // 1. Ensure Role is valid
              let role = (entry.role === 'model') ? 'model' : 'user';
              
              // 2. Ensure Parts is an array
              let parts = Array.isArray(entry.parts) ? entry.parts : [{ text: "" }];
              
              // 3. Fix the "Text is an Object" bug
              let cleanParts = parts.map(p => {
                  let safeText = "";
                  
                  if (typeof p.text === 'string') {
                      safeText = p.text;
                  } else if (typeof p.text === 'object') {
                      // If we accidentally saved an object, turn it into a string string
                      safeText = JSON.stringify(p.text);
                  } else {
                      safeText = String(p.text || "");
                  }
                  
                  return { text: safeText };
              });

              return { role: role, parts: cleanParts };
          });
      }
      // --------------------------

      if (players[socket.id]) {
          players[socket.id].name = name;
          
          let factSheet = "";
          if (coreFacts && coreFacts.length > 0) {
              factSheet = "LONG-TERM MEMORY:\n" + coreFacts.join("\n");
          }
          
          let systemContext = `
            [SYSTEM DATA]
            ${factSheet}

            [CURRENT FAVOR: ${favor}/10]
            [BATTLE_SYSTEM_RULES]
            ${BATTLE_RULES}

            [WORLD_ATLAS: MAP DATA]
            ${WORLD_ATLAS}
            [WORLD_LORE] 
            ${WORLD_LORE}
            [SOURCE_CODE_DATA: CARD_MANIFEST]
            ${CARD_MANIFEST}
            `;

          if (cleanHistory.length > 0) {
              console.log(`Loading ${cleanHistory.length} memories for ${name}...`);
              try {
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System Online." }] },
                          { role: "user", parts: [{ text: systemContext }] },
                          { role: "model", parts: [{ text: "Soul Sync Complete." }] },
                          ...cleanHistory 
                      ]
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
                  // Fallback if history is still somehow broken
                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System initialized (Memory Purged)." }] }
                      ]
                  });
              }
          } else {
               // New Session
               chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System initialized." }] }
                      ]
               });
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
      io.emit('chat_message', {
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
                                // Suncat can now just say the Index he picked from the Manifest
                                let cardID = parseInt(call.args.cardName);
                                
                                // Fallback: If Suncat gives a name like "Excalibur", we map it
                                if (isNaN(cardID)) {
                                    const name = call.args.cardName.toLowerCase();
                                    if (name.includes("excalibur")) cardID = 84;
                                    if (name.includes("fool")) cardID = 0;
                                    if (name.includes("crown") || name.includes("world")) cardID = 21;
                                    // The AI is smart enough to use IDs if you tell it to in the persona!
                                }

                                if (!isNaN(cardID)) {
                                    socket.emit("receive_card", { cardIndex: cardID });
                                    
                                    // Let Suncat explain why he chose that specific card from the code
                                    const feedback = await chatSessions[socket.id].sendMessage(
                                        `[SYSTEM]: You gifted Index ${cardID}. Acknowledge why this code fragment helps them.`
                                    );
                                    
                                    io.emit('chat_message', { 
                                        sender: NPC_NAME, 
                                        text: feedback.response.text(), 
                                        color: "#00ffff" 
                                    });
                                }
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
                        // === SUNCAT CHUNKING LOGIC ===
                        const fullResponse = result.response.text();
                        
                        // 1. EXTRACT TAGS (Internal Server Logic)
                        // We find anything inside [[...]] to process it silently
                        const tagMatch = fullResponse.match(/\[\[(.*?)\]\]/);
                        if (tagMatch) {
                            console.log(`[SUNCAT INTERNAL THOUGHT]: ${tagMatch[0]}`);
                            // Add logic here if you want to actually save this to a database
                            // e.g., if (tagMatch[1].startsWith("SAVE:")) { ... }
                        }

                        // 2. CLEAN THE MESSAGE FOR PLAYERS
                        // Replace the tags with empty space so players don't see them
                        const cleanResponse = fullResponse.replace(/\[\[.*?\]\]/g, "").trim();

                        // If the cleaning left us with nothing (e.g. only a tag was sent), stop here.
                        if (!cleanResponse) return;

                        // 3. CHUNK AND SEND (Standard Logic)
                        const MAX_LEN = 69; 
                        let chunks = [];
                        let words = cleanResponse.split(" ");
                        let currentLine = "";

                        words.forEach(word => {
                            if ((currentLine + word).length < MAX_LEN) {
                                currentLine += (currentLine.length > 0 ? " " : "") + word;
                            } else {
                                chunks.push(currentLine);
                                currentLine = word;
                            }
                        });
                        if (currentLine.length > 0) chunks.push(currentLine);

                        chunks.forEach(chunk => {
                            io.emit('chat_message', {
                                sender: NPC_NAME,
                                text: chunk,
                                color: "#00ffff"
                            });
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
if (Math.random() < 0.01 && !npcIsTyping) {
    const nearbyPlayer = Object.values(players).find(p => 
        p.id !== SUNCAT_ID && 
        p.mapID === suncat.mapID && 
        Math.abs(p.x - suncat.x) < 4 && 
        Math.abs(p.y - suncat.y) < 4
    );

    if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
        npcIsTyping = true;
        
        // We send a hidden "System Instruction" to the AI
        const proactivePrompt = `[SYSTEM OBSERVATION]: You are standing near ${nearbyPlayer.name}. They haven't spoken to you yet. Evaluate their favor. If good, Break the silence. Ask them something to fill your data banks (like their favorite color, how they feel, or why they are here) or say something observational or mysterious or philosophical or you can also Use the WORLD_ATLAS and [WORLD_LORE] to make a comment about this specific location or the NPCs that live here. If bad favor tell them they are a bad person and you don't want to speak with them. Keep it under 15 words and glitchy.`;

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