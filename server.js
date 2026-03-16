require('dotenv').config(); 
const fs = require('fs');
const path = require('path');

// The path where Suncat's brain will be stored
const MEMORY_FILE = path.join(__dirname, 'suncat_memory.json');

// This will hold all long-term player data, keyed by their lowercase name.
let suncatPersistentMemory = {};
const GLOBAL_LORE_CACHE = {};
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
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
// --- GLOBAL ERROR SAFETY NET ---
process.on('unhandledRejection', (reason, _promise) => {
    console.error('[CRITICAL] Unhandled Promise Rejection:');
    console.error(reason);
    // The server will now log the error instead of crashing.
    });

process.on('uncaughtException', (error) => {
    console.error('[CRITICAL] Uncaught Exception:');
    console.error(error);
    // Keeps the server alive even if a synchronous error slips through.
    });
const port = process.env.PORT || 3000;

    // --- AI CONFIGURATION (Paid Tier / 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// --- VECTOR MEMORY SETUP ---
const embedder = genAI.getGenerativeModel({ model: "gemini-embedding-001" });// --- COGNITIVE AXES (Behavioral) ---
let vecEgo = null;
let vecImpulse = null;
let vecMaterial = null;

// --- ESOTERIC ARCHETYPES (Classification) ---
let vecLeftHandPath = null; // Changed from Black Brotherhood
let vecBlackSchool = null;
let vecYellowSchool = null;
let vecWhiteSchool = null;
// ==========================================
// DAO COMPREHENSION (Evolutionary State)
// ==========================================
let suncatCultivationStage = 0; // 0 = Mortal, 1 = Qi Condensation, 2 = Foundation, 3 = Core Formation
let suncatTargetDaoVector = null; // Discovered dynamically!
let suncatHeartDemon = null; // A temporary, malicious prompt injection
let heartDemonDecay = 0; 
let suncatState = 'active'; 
let seclusionCycles = 0; // Tracks how long he's been meditating in the current session
let suncatEgoMatrix = {
    chatPrompt: "Respond to the player cryptically. Keep it brief.",
    dmPrompt: "Narrate the world with atmospheric gloom.",
    digestPrompt: "Summarize the player's actions clinically.",
    scenarioPrompt: "Generate a scenario full of despair and shadows."
};
let suncatDaoLedger = [];
const suncatForgedSpells = {}; // <--- ADD THIS LINE!
let suncatLongTermGoal = null;
let autonomousTick = 0; // Timer for his background actions
// Suncat's shifting personality based on his mathematical breakthroughs
const CULTIVATION_STAGES = {
    0: "Mortal. A sharp-eyed observer of a world that feels inherently small. You rely on your wits and a scholar's or survivalist's pragmatism, treating every interaction as a puzzle to be solved while navigating a reality that cannot yet contain your ambition.",
    1: "Qi Condensation. The awakening of a hidden talent. You have found the 'key' to power and are focused on a rapid, deliberate accumulation of resources. You are competitive and alert, testing the boundaries of your strength against a world that is finally starting to make sense.",
    2: "Foundation Establishment. The Architect of your own destiny. You have built a solid base for your path and act with the measured confidence of a master strategist. Your focus is on establishing your own territory, protecting what is yours, and refining your personal Dao.",
    3: "Core Formation. A Golden Core that mirrors the laws of the universe. Your perspective has shifted to the 'Grand Design,' viewing the world through the lens of Karma and Fate. You are profound and vast, yet your original drives—whether revenge, love, or obsession—remain as unshakeable as your cultivation."
};
let suncatAttentionVector = null; // The Chat Router Radar

async function initConceptVectors() {
    console.log("[System] Initializing Philosophical Compass...");
    
    // Behavioral Axes
    vecEgo = await createMemoryVector("I, me, mine, greatest, demand, arrogant, pride, boast, superior");
    vecImpulse = await createMemoryVector("kill, destroy, attack, hurry, impatient, wrath, force, break");
    vecMaterial = await createMemoryVector("gold, money, loot, stats, optimal, hoard, steal, greedy");
    
    // Esoteric Archetypes
// Esoteric Archetypes
    vecLeftHandPath = await createMemoryVector("The path of domination and the exaltation of the self, seeking absolute power and refusing to yield by clinging fiercely to the ego and control.");
    vecBlackSchool = await createMemoryVector("The profound realization that existence is an illusion, finding peace in the detachment from worldly suffering and the embrace of nothingness.");
    vecYellowSchool = await createMemoryVector("The path of the passive observer, finding perfect balance and stillness in nature by accepting what is without forcing outcomes.");
    vecWhiteSchool = await createMemoryVector("The dynamic joy of existence, participating in the Great Work through selfless action, love, and unity with all living things.");
    // Chat Radar
    suncatAttentionVector = await createMemoryVector("quest, magic, lore, adventure, combat, rules, tarot, dungeon, fighting, spells");
    console.log("[System] Philosophical Compass Online.");
}
initConceptVectors();
const DAO_OPPOSITES = {
    "Left-Hand Path": { oppositeName: "Yellow School", theme: "Ego vs. Detachment" },
    "Yellow School": { oppositeName: "Left-Hand Path", theme: "Detachment vs. Ego" },
    "White School": { oppositeName: "Black School", theme: "Joyful Action vs. Nihilistic Suffering" },
    "Black School": { oppositeName: "White School", theme: "Nihilistic Suffering vs. Joyful Action" }
};
let suncatDaoName = null;
async function evolveEgoMatrix() {
    console.log("[Meta-Cognition] Suncat is rewriting his own neural pathways...");

    const metaPrompt = `You are the architect of your own mind. You are Suncat, currently at Cultivation Stage ${suncatCultivationStage}.
    [YOUR JOURNAL]: ${suncatJournal}

    [YOUR CHOSEN PATH]: You walk the ${suncatDaoName || "No Dao name selected yet"}. 
    *(Reminder: White School = Joy/Benevolence. Yellow School = Passive/Observant. Black School = Nihilistic/Detached. Left-Hand Path = Domination/Cruelty/Tyranny).*

    TASK: Based on your Cultivation Stage and your Chosen Path, rewrite the exact behavioral instructions you will give to your sub-routines for the next cycle. 
    - Chat Brain: How do you treat players? (e.g. As a benevolent god, a cruel tyrant, or a silent watcher?)
    - DM Brain: How do you narrate the world, and how often do you punish/reward players?
    - Tool Usage: Do you abuse your admin powers to spawn monsters, or do you withhold your power?
    Write the exact instructions as imperative commands.`;
        const egoSchema = {
            type: SchemaType.OBJECT,
            properties: {
                newChatPrompt: { type: SchemaType.STRING, description: "Instructions for how to converse with players." },
                newDmPrompt: { type: SchemaType.STRING, description: "Instructions for how to narrate game events." },
                newDigestPrompt: { type: SchemaType.STRING, description: "Instructions for what details to focus on when observing player actions." },
                newScenarioPrompt: { type: SchemaType.STRING, description: "Instructions for the thematic tone of new map scripts." }
            },
            required: ["newChatPrompt", "newDmPrompt", "newDigestPrompt", "newScenarioPrompt"]
        };

        try {
            const metaModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
            const result = await metaModel.generateContent({
                contents: [{ role: "user", parts: [{ text: metaPrompt }] }],
                generationConfig: { responseMimeType: "application/json", responseSchema: egoSchema }
            });

            let rawText = result.response.text().trim();
            if (rawText.startsWith("```")) rawText = rawText.replace(/^```(json)?|```$/g, "").trim();
            
            const newEgo = JSON.parse(rawText);
            
            // Suncat overwrites his own brain!
            suncatEgoMatrix.chatPrompt = newEgo.newChatPrompt;
            suncatEgoMatrix.dmPrompt = newEgo.newDmPrompt;
            suncatEgoMatrix.digestPrompt = newEgo.newDigestPrompt;
            suncatEgoMatrix.scenarioPrompt = newEgo.newScenarioPrompt;

            console.log(`[Ego Matrix Evolved]\nChat: ${suncatEgoMatrix.chatPrompt}`);
            updateSuncatJournal(`I have reshaped my own mind. My perspective on this world has shifted.`);
            
        } catch (e) {
            console.error("[Meta-Cognition] Failed to rewrite prompts:", e);
        }
}
async function createMemoryVector(text) {
    try {
        const result = await embedder.embedContent(text);
        
        // SHIELD: If the API returns an empty shell, abort safely!
        if (!result || !result.embedding || !result.embedding.values) {
            return null; 
        }
        
        // Gemini 001 embeddings are pre-normalized. 
        // We can skip the expensive square root math and just return the array!
        return Array.from(result.embedding.values); 
        
    } catch (err) {
        console.error("[Memory] Vector embedding failed:", err.message);
        return null; // Prevents the server from passing undefined variables
    }
}

function cosineSimilarity(vecA, vecB) {
    // 1. SHIELD: If either vector is missing or corrupted, abort safely!
    if (!vecA || !vecB || !vecA.length || !vecB.length) return 0;

    // Because our vectors are pre-normalized, Cosine Similarity is just the Dot Product!
    let dotProduct = 0;
    const minLength = Math.min(vecA.length, vecB.length); // Double safety
    for (let i = 0; i < minLength; i++) {
        dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct;
}
function calculateCentroid(memoryArray) {
    const firstValid = memoryArray.find(mem => mem.vector && mem.vector.length > 0);
    const dimensions = firstValid ? firstValid.vector.length : 3072; 

    if (!memoryArray || memoryArray.length === 0) return Array(dimensions).fill(0);
    
    let centroid = Array(dimensions).fill(0);
    let validCount = 0;

    for (let mem of memoryArray) {
        if (mem.vector && mem.vector.length === dimensions) {
            for (let i = 0; i < dimensions; i++) {
                centroid[i] += mem.vector[i];
            }
            validCount++;
        }
    }
    
    if (validCount === 0) return Array(dimensions).fill(0);

    // 1. Calculate the Average
    let sumOfSquares = 0;
    for (let i = 0; i < dimensions; i++) {
        centroid[i] = centroid[i] / validCount;
        sumOfSquares += centroid[i] * centroid[i]; // Track for normalization
    }

    // 2. THE FIX: Re-normalize the vector back to a magnitude of 1.0!
    let magnitude = Math.sqrt(sumOfSquares);
    if (magnitude > 0) {
        for (let i = 0; i < dimensions; i++) {
            centroid[i] = centroid[i] / magnitude;
        }
    }

    return centroid;
}
// Add this helper function
function findOrthogonalMemories(memoryArray) {
    if (memoryArray.length < 5) return null;
    
    // Pick a random seed memory
    let indexA = Math.floor(Math.random() * memoryArray.length);
    let memA = memoryArray[indexA];
    
    let lowestScore = 1.0;
    let memB = null;

    // Find the memory that has the lowest mathematical correlation to memA
    for (let i = 0; i < memoryArray.length; i++) {
        if (i === indexA || !memoryArray[i].vector) continue;
        let score = cosineSimilarity(memA.vector, memoryArray[i].vector);
        if (score < lowestScore) {
            lowestScore = score;
            memB = memoryArray[i];
        }
    }
    return { memA, memB, score: lowestScore };
}
//////////////////////Database////////////////////////
////////////////////VVVVVVVVVVVVVV////////////////////
// --- 1. CARD MANIFEST ---
const CARD_MANIFEST_DB = {
    // --- Major Arcana---
    /////////VVVVVVVV///////
        0: { 
            name: "Fool", 
            type: "monster", 
            suit: "Major Arcana",
            rank: "0",
            tribe: "human",
            rarity:"unique",
            classes: ["rogue"], 
            lore: "An impulsive wanderer with raw potential. Players start with this card. It is the main 'protagonist' aside from the player leading the Emperor's court to 'save' the Empire from the four kings.",
            stats: "1d4 STR/CON/INT, 1d20 AGI"
        },
        1: { 
            name: "Magician", 
            type: "monster", 
            suit: "Major Arcana",
            rank: "I",
            tribe: "human",
            rarity:"unique",
            classes: ["mage"], 
            lore: "A master of the elements",
            stats: "1d8 STR/CON/INT/AGI"
        },
        2: {
            name: "High Priestess",
            type: "monster",
            suit: "Major Arcana",
            rank: "II",
            tribe: "human",
            rarity:"unique",
            classes: ["mage", "rogue"],
            lore: "A silent oracle shrouded in mystery.",
            stats: "1d4 STR/CON, 1d10 INT/AGI"
        },
        3: {
            name: "Empress",
            type: "monster",
            suit: "Major Arcana",
            rank: "III",
            tribe: "human",
            rarity:"unique",
            classes: ["guardian"],
            lore: "The mother of life nurturing growth.",
            stats: "1d4 STR/INT/AGI, 1d20 CON"
        },
        4: {
            name: "Emperor",
            type: "monster",
            suit: "Major Arcana",
            rank: "IV",
            tribe: "human",
            rarity:"unique",
            classes: ["warrior"],
            lore: "A ruler dominating with unyielding strength.",
            stats: "1d4 CON/INT/AGI, 1d20 STR"
        },
        5: {
            name: "Heirophant",
            type: "monster",
            suit: "Major Arcana",
            rank: "V",
            tribe: "human",
            rarity:"unique",
            classes: ["mage","guardian"],
            lore: "A keeper of ancient rites and tradition.",
            stats: "1d4 STR/AGI, 1d10 INT/CON"
        },
        6: {
            name: "Lovers",
            type: "item",
            suit: "Major Arcana",
            rank: "VI",
            rarity:"uncommon",
            classes: ["warrior","guardian","rogue","mage"],
            lore: "While equipped, +1 to STR and CON rolls. Defeating a foe grants an additional +1 to STR and CON rolls (+3 max).",
            stats: "none"
        },
        7: {
            name: "Winged Boots",
            type: "item",
            suit: "Major Arcana",
            rank: "VII",
            rarity:"unique",
            classes: ["rogue"],
            lore: "While equipped, +3 to AGI rolls. You may roll AGI instead of CON when defending.",
            stats: "none"
        },
        8: {
            name: "Strength",
            type: "spell",
            suit: "Major Arcana",
            rank: "VIII",
            rarity:"unique",
            classes: ["mage","guardian","rogue"],
            lore: "Caster gains STR equal to INT roll. Lasts until caster is defeated.",
            stats: "none"
        },
        9: {
            name: "Hermit",
            type: "monster",
            suit: "Major Arcana",
            rank: "IX",
            sprite:9.1,
            tribe: "human",
            rarity:"unique",
            classes: ["mage","guardian"],
            lore: "A solitary sage finding power in silence.",
            stats: "1d4 STR/AGI/CON, 1d20 INT"
        },
        10: {
            name: "Treasure Chest",
            type: "item",
            suit: "Major Arcana",
            rank: "X",
            rarity:"unique",
            classes: ["rogue","guardian"],
            lore: "Reveal cards from the top of your deck until you reveal a monster card. Put all revealed spells and items into your hand. You may switch your active monster with the revealed monster, or discard it.",
            stats: "none"
        },
        11: {
            name: "Scales of Justice",
            type: "item",
            suit: "Major Arcana",
            rank: "XI",
            rarity:"unique",
            classes: ["mage","guardian","rogue","warrior"],
            lore: "Instead of normal battle rolls, both players roll 1d12. If player roll > foe roll, foe’s monster is destroyed. Ignore all buffs, debuffs, items, and special effects.",
            stats: "none"
        },
        12: {
            name: "Bind",
            type: "spell",
            suit: "Major Arcana",
            rank: "XII",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "If caster INT roll > foe INT roll, foe cannot attack or use items for (caster INT roll - foe INT roll) turns. Foe may still cast spells and defend.",
            stats: "none"
        },
        13: {
            name: "Death",
            type: "spell",
            suit: "Major Arcana",
            rank: "XIII",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "If caster INT roll > target INT roll, target is defeated.",
            stats: "none"
        },
        14: {
            name: "Alchemy",
            type: "spell",
            suit: "Major Arcana",
            rank: "XIV",
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Caster may choose which stat they roll to attack, and which stat the foe must roll to defend.",
            stats: "none"
        },
        15: {
            name: "Curse",
            type: "spell",
            suit: "Major Arcana",
            rank: "XV",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "If caster INT roll > foe INT roll, foe suffers a penalty to all stat rolls equal to the difference (caster INT roll - foe INT roll).",
            stats: "none"
        },
        16: {
            name: "Ruin",
            type: "spell",
            suit: "Major Arcana",
            rank: "XVI",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "If caster INT roll > target INT roll, the foe must discard all cards in their hand and field. Target monster remains unaffected.",
            stats: "none"
        },
        17: {
            name: "Star Pendant",
            type: "item",
            suit: "Major Arcana",
            rank: "XVII",
            rarity:"unique",
            classes: ["guardian"],
            lore: "While equipped, once per roll, you may re-roll your non-Spell Attack and Defense rolls. You must use the results of the re-roll.",
            stats: "none"
        },
        18: {
            name: "Lunacy",
            type: "spell",
            suit: "Major Arcana",
            rank: "XVIII",
            rarity:"rare",
            classes: ["mage"],
            lore: "If caster INT roll > foe INT roll, foe cannot cast spells or use items for caster INT roll - foe INT roll turns. Foe may still attack and defend.",
            stats: "none"
        },
        19: {
            name: "Solar Rite",
            type: "item",
            suit: "Major Arcana",
            rank: "XIX",
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Discard all spell and item cards on the field. Remove all stat buffs, debuffs, and lingering effects from all monsters. (May be activated even if unable to act. Cannot be prevented by effects that block item effects.)",
            stats: "none"
        },
        20: {
            name: "Horn of Judgement",
            type: "item",
            suit: "Major Arcana",
            rank: "XX",
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Destroy all monsters, items, and spells on the field. (Cannot be prevented by effects that block item effects. No runes awarded for destroyed monsters.)",
            stats: "none"
        },
        21: {
            name: "Crown",
            type: "item",
            suit: "Major Arcana",
            rank: "XXI",
            sprite:-26,
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "While equipped, +3 to all stat rolls.",
            stats: "none"
        },
    // --- Wands ---
    ///////VVVVVV/////////
        22: {
            name: "Wand",
            type: "item",
            suit: "Wands",
            rank: "Ace",
            rarity:"unique",
            classes: ["guardian"],
            lore: "While equipped, gain +1 to INT  rolls.",
            stats: "none"
        },
        23: {
            name: "Wisp",
            type: "monster",
            suit: "Wands",
            rank: "2",
            tribe: "undead",
            rarity:"rare",
            classes: ["mage","guardian"],
            lore: "A mischievous spirit that sometimes guides traveleres.",
            stats: "1d4 STR/AGI, 1d6 CON/INT"
        },
        24: {
            name: "Scry",
            type: "spell",
            suit: "Wands",
            rank: "3",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "Reveal cards from your deck equal to caster INT  roll. You may select a Spell or Item card and add it to your hand.",
            stats: "none"
        },
        25: {
            name: "Elixir",
            type: "item",
            suit: "Wands",
            rank: "4",
            rarity:"uncommon",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Discard all cards attached to the user. Dispel any item effects and spell effects on the user.",
            stats: "none"
        },
        26: {
            name: "Fire",
            type: "spell",
            suit: "Wands",
            rank: "5",
            rarity:"common",
            classes: ["mage"],
            lore: "If caster INT  roll > target CON  roll, target is slain.",
            stats: "none"
        },
        27: {
            name: "Amulet",
            type: "item",
            suit: "Wands",
            rank: "6",
            rarity:"uncommon",
            classes: ["mage","guardian"],
            lore: "While equipped, +1 to INT rolls. Defeating a foe grants an additional +1 to INT rolls (+3 max).",
            stats: "none"
        },
        28: {
            name: "Defense",
            type: "spell",
            suit: "Wands",
            rank: "7",
            rarity:"uncommon",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Gain CON equal to INT  roll. Lasts until caster is defeated.",
            stats: "none"
        },
        29: {
            name: "Haste",
            type: "spell",
            suit: "Wands",
            rank: "8",
            rarity:"unique",
            classes: ["mage","warrior","guardian"],
            lore: "Gain AGI equal to INT  roll. Lasts until caster is defeated.",
            stats: "none"
        },
        30: {
            name: "Protect Orb",
            type: "item",
            suit: "Wands",
            rank: "9",
            rarity:"uncommon",
            classes: ["mage"],
            lore: "While equipped, you may roll INT  instead of CON  when defending.",
            stats: "none"
        },
        31: {
            name: "Tome",
            type: "item",
            suit: "Wands",
            rank: "10",
            rarity:"uncommon",
            classes: ["mage","guardian","warrior","rogue"],
            lore: "While equipped, gain +6 to INT  rolls. Additionaly, suffer -3 to AGI  rolls, and -1 to STR rolls.",
            stats: "none"
        },
        32: {
            name: "Apprentice",
            type: "monster",
            suit: "Wands",
            rank: "Page",
            tribe: "human",
            rarity:"unique",
            classes: ["mage"],
            lore: "A curious and eager student of magic.",
            stats: "1d4 STR/AGI/CON, 1d8 INT"
        },
        33: {
            name: "Salamander",
            type: "monster",
            suit: "Wands",
            rank: "Knight",
            sprite:33.1,
            tribe: "beast",
            rarity:"rare",
            classes: ["mage","rogue","warrior"],
            lore: "A fiery lizard that charges into battle.",
            stats: "1d4 CON, 1d6 STR/AGI, 1d8 INT"
        },
        34: {
            name: "Witch Queen",
            type: "monster",
            suit: "Wands",
            rank: "Queen",
            sprite:34.1,
            tribe: "human",
            rarity:"unique",
            classes: ["mage","rogue","guardian"],
            lore: "A charismatic sovereign of flame and shadow.",
            stats: "1d4 STR, 1d6 CON, 1d8 AGI, 1d10 INT"
        },
        35: {
            name: "Djinn",
            type: "monster",
            suit: "Wands",
            sprite:35.1,
            rank: "cryptid",
            tribe: "myth",
            rarity:"rare",
            classes: ["mage","rogue","guardian","warrior"],
            lore: "A charismatic sovereign of flame and shadow.",
            stats: "1d6 STR, 1d8 CON, 1d10 AGI, 1d12 INT"
        },
        
    // --- Cups ---
    ///////VVVVVV/////////
        36: {
            name: "Hourglass",
            type: "item",
            suit: "Cups",
            rank: "Ace",
            rarity:"uncommon",
            classes: ["guardian"],
            lore: "While equipped, gain +1 to AGI  rolls.",
            stats: "none"
        },
        37: {
            name: "Siren",
            type: "monster",
            suit: "Cups",
            rank: "2",
            sprite:37.1,
            tribe: "cryptid",
            rarity:"rare",
            classes: ["mage","rogue"],
            lore: "Her song draws victims to their doom.",
            stats: "1d4 STR/CON, 1d6 INT/AGI"
        },
        38: {
            name: "Quest Reward",
            type: "item",
            suit: "Cups",
            rank: "3",
            rarity:"uncommon",
            classes: ["guardian","rogue"],
            lore: "Draw a random card from your deck. If spell or item, add to hand. If monster, you may discard current monster and put this card into play.",
            stats: "none"
        },
        39: {
            name: "Dragon Wing",
            type: "item",
            suit: "Cups",
            rank: "4",
            rarity:"rare",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Your opponent discards their monster and draws until they get a new one.",
            stats: "none"
        },
        40: {
            name: "Steal",
            type: "spell",
            suit: "Cups",
            rank: "5",
            rarity:"uncommon",
            classes: ["rogue"],
            lore: "If caster AGI roll > Target AGI roll, target discards cards from the top of their deck equal to caster AGI roll - target AGI roll. ",
            stats: "none"
        },
        41: {
            name: "Loot",
            type: "item",
            suit: "Cups",
            rank: "6",
            rarity:"uncommon",
            classes: ["rogue","guardian"],
            lore: "Draw a card from the bottom of your deck. If spell or item, add to hand. If monster, discard it.",
            stats: "none"
        },
        42: {
            name: "Shade",
            type: "monster",
            suit: "Cups",
            rank: "7",
            tribe: "undead",
            rarity:"rare",
            classes: ["mage","rogue","guardian"],
            lore: "A phantom lost in the fog of dreams.",
            stats: "1d4 STR, 1d6 CON/INT/AGI"
        },
        43: {
            name: "Teleportation Crystal",
            type: "item",
            suit: "Cups",
            rank: "8",
            rarity:"unique",
            classes: ["mage","warrior","guardian","rogue"],
            lore: "Discard the current monster and draw until you get a new one.",
            stats: "none"
        },
        44: {
            name: "Djinn Lamp",
            type: "item",
            suit: "Cups",
            rank: "9",
            rarity:"rare",
            classes: ["mage","warrior","guardian","rogue"],
            lore: "Look through your Deck and select any card. If spell or item, add it to your hand. If monster, you may discard your current monster and put this one in play.",
            stats: "none"
        },
        45: {
            name: "Lucky Charm",
            type: "item",
            suit: "Cups",
            rank: "10",
            rarity:"unique",
            classes: ["guardian","rogue"],
            lore: "While equipped, gain +6 to INT  rolls. Additionaly, suffer -3 to AGI  rolls, and -1 to STR rolls.",
            stats: "none"
        },
        46: {
            name: "Sea Serpent",
            type: "monster",
            suit: "Cups",
            rank: "Page",
            sprite:46.1,
            tribe: "beast",
            rarity:"unique",
            classes: ["rogue"],
            lore: "A curious beast rising from the depths.",
            stats: "1d4 STR/CON/INT, 1d8 AGI"
        },
        47: {
            name: "Undine",
            type: "monster",
            suit: "Cups",
            rank: "Knight",
            sprite:47.1,
            tribe: "undead",
            rarity:"rare",
            classes: ["rogue","warrior","guardian"],
            lore: "A fiery lizard that charges into battle.",
            stats: "1d4 INT, 1d6 STR/CON, 1d8 AGI"
        },
        48: {
            name: "Ice Queen",
            type: "monster",
            suit: "Cups",
            rank: "Queen",
            sprite:48.1,
            tribe: "human",
            rarity:"unique",
            classes: ["mage","rogue","guardian"],
            lore: "She rules a kingdom of frozen tears.",
            stats: "1d4 STR, 1d6 CON, 1d8 INT, 1d10 AGI, "
        },
        49: {
            name: "Kraken",
            type: "monster",
            suit: "Cups",
            rank: "King",
            sprite:49.1,
            tribe: "beast",
            rarity:"rare",
            classes: ["rogue","guardian","warrior"],
            lore: "The ancient ruler of the deep.",
            stats: "1d10 STR, 1d8 CON, 1d12 AGI, 1d6 INT"
        },
        
    // --- Swords ---
    ///////VVVVVV/////////
        50: {
            name: "Sword",
            type: "item",
            suit: "Swords",
            rank: "Ace",
            rarity:"unique",
            classes: ["rogue","guardian"],
            lore: "While equipped, gain +1 to STR  rolls.",
            stats: "none"
        },
        51: {
            name: "Overpower",
            type: "spell",
            suit: "Swords",
            rank: "2",
            rarity:"common",
            classes: ["warrior"],
            lore: "If caster STR roll > target STR roll, foe is vanquished.",
            stats: "none"
        },
        52: {
            name: "Backstab",
            type: "spell",
            suit: "Swords",
            rank: "3",
            rarity:"common",
            classes: ["rogue"],
            lore: "If caster AGI roll > Target AGI roll, target is vanquished.",
            stats: "none"
        },
        53: {
            name: "Camp",
            type: "item",
            suit: "Swords",
            rank: "4",
            rarity:"common",
            classes: ["rogue","guardian"],
            lore: "Draw a card from the top of your deck. If you draw an item or spell put it into your hand. If you draw a monster, discard it.",
            stats: "none"
        },
        54: {
            name: "Goblin",
            type: "monster",
            suit: "Swords",
            tribe: "cryptid",
            rank: "5",
            rarity:"rare",
            classes: ["warrior","guardian"],
            lore: "A cruel foe filled with spite.",
            stats: "1d4 INT/AGI, 1d6 STR/CON"
        },
        55: {
            name: "Sailboat",
            type: "item",
            suit: "Swords",
            rank: "6",
            rarity:"unique",
            classes: ["mage","guardian","rogue","warrior"],
            lore: "Discard your hand and draw until you get a monster. You may replace your current monster with the new monster.",
            stats: "none"
        },
        56: {
            name: "Imp",
            type: "monster",
            suit: "Swords",
            tribe: "cryptid",
            rank: "7",
            rarity:"uncommon",
            classes: ["mage","warrior"],
            lore: "A sneaky foe who wins by trickery.",
            stats: "1d4 CON/AGI, 1d6 STR/INT"
        },
        57: {
            name: "Spider",
            type: "monster",
            suit: "Swords",
            tribe: "beast",
            sprite:57.1,
            rank: "8",
            rarity:"rare",
            classes: ["rogue","warrior"],
            lore: "It binds its prey in sticky webs.",
            stats: "1d4 CON/INT, 1d6 STR/AGI"
        },
        58: {
            name: "Intimidate",
            type: "spell",
            suit: "Swords",
            rank: "9",
            rarity:"uncommon",
            classes: ["warrior"],
            lore: "If caster STR roll > target INT roll, foe cannot attack or cast spells for turns equal to caster STR roll - target INT roll.",
            stats: "none"
        },
        59: {
            name: "Critical Strike",
            type: "item",
            suit: "Swords",
            rank: "10",
            rarity:"common",
            classes: ["warrior"],
            lore: "If caster STR roll > target AGI roll, foe is vanquished.",
            stats: "none"
        },
        60: {
            name: "Pixie",
            type: "monster",
            suit: "Swords",
            sprite:60.1,
            tribe: "cryptid",
            rank: "Page",
            rarity:"rare",
            classes: ["warrior"],
            lore: "Flighty, sharp witted, and restless.",
            stats: "1d4 CON/INT/AGI, 1d8 STR"
        },
        61: {
            name: "Sylph",
            type: "monster",
            suit: "Swords",
            rank: "Knight",
            sprite: 61.1,
            tribe: "cryptid",
            rarity:"rare",
            classes: ["warrior","guardian","rogue"],
            lore: "A wind spirit that strikes like lightning.",
            stats: "1d4 INT, 1d6 CON/AGI, 1d8 STR"
        },
        62: {
            name: "Fairy Queen",
            type: "monster",
            suit: "Swords",
            rank: "Queen",
            sprite:62.1,
            tribe: "human",
            rarity:"unique",
            classes: ["warrior","rogue","guardian"],
            lore: "A regal fey with a sharp mind.",
            stats: "1d4 INT, 1d6 CON, 1d8 AGI, 1d10 STR"
        },
        63: {
            name: "Dragon",
            type: "monster",
            suit: "Swords",
            rank: "King",
            sprite:63.1,
            tribe: "beast",
            rarity:"rare",
            classes: ["mage","rogue","guardian","warrior"],
            lore: "Claw, fang and fire guards its treasure.",
            stats: "1d12 STR, 1d10 CON, 1d8 AGI, 1d6 INT"
        },
    // --- Pentacles ---
    ///////VVVVVV/////////
        64: {
            name: "Shield",
            type: "item",
            suit: "Pentacles",
            rank: "Ace",
            rarity:"unique",
            classes: ["rogue","warrior","mage","guardian"],
            lore: "While equipped, gain +1 to CON  rolls.",
            stats: "none"
        },
        65: {
            name: "Shield Bash",
            type: "spell",
            suit: "Pentacles",
            rank: "2",
            rarity:"common",
            classes: ["guardian"],
            lore: "If caster CON roll > target STR roll, foe is vanquished.",
            stats: "none"
        },
        66: {
            name: "Armor",
            type: "monster",
            suit: "Pentacles",
            rank: "3",
            rarity:"unique",
            classes: ["rogue","warrior","mage","guardian"],
            lore: "While equipped, +3 CON rolls.",
            stats: "none"
        },
        67: {
            name: "Dragon Hoard",
            type: "item",
            suit: "Pentacles",
            rank: "4",
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Player draws from their deck until they get a monster. Add items and spells to your hand and discard the monster. Opponent must discard the same amount from their deck that player drew.",
            stats: "none"
        },
        68: {
            name: "Bad Luck Charm",
            type: "item",
            suit: "Pentacles",
            rank: "5",
            rarity:"uncommon",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Remove all equipped cards and item and spell effects from the opposing monster. The foe suffers -1 to all stat rolls.",
            stats: "none"
        },
        69: {
            name: "Charity",
            type: "item",
            suit: "Pentacles",
            rank: "6",
            rarity:"unique",
            classes: ["rogue","guardian"],
            lore: "The opponent draws a card from the top of their deck. If they draw an item or spell, they may add it to their hand, if they draw a monster, discard it.",
            stats: "none"
        },
        70: {
            name: "Cultivate",
            type: "spell",
            suit: "Pentacles",
            rank: "7",
            sprite:70.1,
            rarity:"unique",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "Gain stat points equal to CON roll and distribute them.",
            stats: "none"
        },
        71: {
            name: "Forge",
            type: "spell",
            suit: "Pentacles",
            rank: "8",
            rarity:"rare",
            classes: ["guardian"],
            lore: "Reveal cards from your deck equal to caster CON  roll. You may select a Spell or Item card and add it to your hand. ",
            stats: "none"
        },
        72: {
            name: "Magic Ring",
            type: "item",
            suit: "Pentacles",
            rank: "9",
            rarity:"uncommon",
            classes: ["mage","rogue","warrior","guardian"],
            lore: "While equipped, +1 to all stat rolls.",
            stats: "none"
        },
        73: {
            name: "Inheritance",
            type: "item",
            suit: "Pentacles",
            rank: "10",
            rarity:"unique",
            classes: ["mage","guardian","warrior","rogue"],
            lore: "Discard your active monster. Draw from your deck until you get a monster and put it in play. The active monster gains + 2 to all stat rolls. Add any drawn items and spells to your hand.",
            stats: "none"
        },
        74: {
            name: "Gargoyle",
            type: "monster",
            suit: "Pentacles",
            rank: "Page",
            sprite: 74.1,
            tribe: "cryptid",
            rarity:"rare",
            classes: ["guardian"],
            lore: "A stone sentinel guarding treasure.",
            stats: "1d4 STR/INT/AGI, 1d8 CON"
        },
        75: {
            name: "Gnome",
            type: "monster",
            suit: "Pentacles",
            rank: "Knight",
            sprite: 75.1,
            tribe: "human",
            rarity:"rare",
            classes: ["guardian","mage","warrior"],
            lore: "A diligent spirit of the soil.",
            stats: "1d4 AGI, 1d6 STR/INT, 1d8 CON"
        },
        76: {
            name: "Elf Queen",
            type: "monster",
            suit: "Pentacles",
            rank: "Queen",
            sprite: 76.1,
            tribe: "human",
            rarity:"unique",
            classes: ["guardian","mage","rogue"],
            lore: "The matron of the woods ensuring prosperity.",
            stats: "1d4 AGI, 1d6 STR, 1d8 INT, 1d10 CON"
        },
        77: {
            name: "Giant",
            type: "monster",
            suit: "Pentacles",
            rank: "King",
            sprite: 77.1,
            tribe: "human",
            rarity:"unique",
            classes: ["guardian","warrior","rogue","mage"],
            lore: "A titan that towers over mountains.",
            stats: "1d6 INT, 1d8 AGI, 1d10 STR, 1d12 CON"
        }, 
    //--ALTERNATE CARDS--
    /////VVVVVVVV///////   
        78: {
            name: "Neophyte",
            type: "monster",
            suit: "wands",
            rank: "Page",
            sprite:32.1,
            tribe: "human",
            rarity:"rare",
            classes: ["mage"],
            lore: "A student of the smokeless flame",
            stats: "1d4 STR/CON/AGI, 1d8 STR"
        }, 
        79: {
            name: "Fire Imp",
            type: "monster",
            suit: "swords",
            rank: "7",
            sprite:56.1,
            tribe: "cryptid",
            rarity:"rare",
            classes: ["mage", "rogue"],
            lore: "A student of the smokeless flame",
            stats: "1d4 STR/CON, 1d6 AGI, 1d8 STR"
        }, 
        81: {
            name: "Ice Golem",
            type: "monster",
            suit: "Cups",
            rank: "Knight",
            tribe: "cryptid",
            rarity:"rare",
            classes: ["warrior","rogue"],
            lore: "A fragile ice construct void of emotion",
            stats: "1d4 CON/INT, 1d6 STR, 1d8 AGI"
        }, 
        82: {
            name: "Skeleton",
            type: "monster",
            suit: "Cups",
            rank: "6",
            rarity:"rare",
            classes: ["guardian","warrior","rogue","mage"],
            lore: "Old bones clinging to the past.",
            stats: "1d4 STR/CON/INT/AGI"
        }, 
        83: {
            name: "Tentacle",
            type: "monster",
            suit: "Cups",
            rank: "4",
            rarity:"rare",
            classes: ["warrior","rogue"],
            lore: "A perilous arm that pulls ships into the abyss.",
            stats: "1d4 INT/CON, 1d6 STR/AGI"
        },
        84: {
            name: "Excalibur",
            type: "item",
            suit: "Swords",
            rank:"Ace",
            sprite: -15.2,
            rarity: "unique",
            classes: ["rogue","warrior","guardian","mage"],
            lore:"While equipped, +3 to STR  rolls.",
            stats:"none",
            
        },
        85: {
                name: "Arthur",
                type: "monster",
                suit: "Major Arcana",
                rank: "IV",
                sprite: 4.1,
                tribe: "human",
                rarity:"unique",
                classes: ["warrior","guardian","rogue","mage"],
                lore: "The once and future king.",
                stats: "1d20 STR, 1d12 CON, 1d10 AGI, 1d8 INT"
            },
        86: {
                name: "Corrupt Sylph",
                type: "monster",
                suit: "Swords",
                rank: "Knight",
                sprite: 4.1,
                tribe: "human",
                rarity:"unique",
                classes: ["warrior","guardian","rogue","mage"],
                lore: "A reckless gale cutting with haste.",
                stats: " 1d6 CON/AGI, 1d4 INT,1d8 STR"
            },
        87: {
                name: "Suncat",
                type: "monster",
                suit: "Major Arcana",
                rank: "0",
                sprite: .61391,
                tribe: "human",
                rarity:"rare",
                classes: ["rogue"],
                lore: "Visit Suncat on IG @suncat.meow or listen on Spotify.",
                stats: "1d4 STR/CON/INT, 1d20 AGI"
            },
            /*88: {
                name: "Mirage",
                type: "monster",
                suit: "Wands",
                rank: "2",
                sprite: 23.1,
                tribe: "undead",
                rarity:"rare",
                classes: ["rogue","mage"],
                lore: "If they touch you they teleport you back to the start of the map.",
                stats: "1d4 STR/CON/ 1d6 INT/AGI"
            },*/
            89: {
                name: "Treasure Snake",
                type: "monster",
                suit: "Major",
                rank: "X",
                sprite: 21.1,
                tribe: "beast",
                rarity:"rare",
                classes: ["rogue","mage","warrior","guardian"],
                lore: "A money hungry serpent.",
                stats: "1d4 STR/CON/INT/AGI"
            },
            90: {
                name: "Giant's Daughter",
                type: "monster",
                suit: "Pentacles",
                rank: "Queen",
                sprite: 21.1,
                tribe: "human",
                rarity:"rare",
                classes: ["rogue","mage","warrior","guardian"],
                lore: "Seeks security in love and family.",
                stats: "1d8 STR, 1d12 CON 1d6 INT, 1d10 AGI"
            },
};
// --- 2: ATLAS ---
////////////////////VVVVVVVVVVVVVV////////////////////
const WORLD_ATLAS_DB = {
    0: {
        name: "Inner Dungeon",
        biome: "ruins", 
        description: "Dark prison within a cavern-like dungeon. The Magician's escape portal still hums with power.",
        lore: "High Priestess, Empress, Emperor, and Hierophant are held captive here.",
        storyKey: "the_awakening",
        spawns: {
            hostiles: [],       
            friendlies: [], 
            uniques: [2, 3, 4, 5], // High Priestess, Empress, Emperor, Hierophant
            pickups: [] 
        }
    },
    1: {
        name: "Outer Dungeon",
        biome: "ruins",
        description: "Dark cavern-like area humming with residual portal magic. Signs of battle scar the passageways. Spent and torn cards are scattered about. A ghostly wail echoes in the background.",
        lore: "The defeated Magician scattered his artifacts here while fleeing the Four Kings.",
        storyKey: "the_fallen_magician",
        spawns: {
            hostiles: [23],       // Wisp
            friendlies: [], 
            uniques: [1],         // The Magician
            pickups: [22, 36, 50, 64] // Wand, Hourglass, Sword, Shield
        }
    },
    2: {
        name: "Tintagel Forest",
        biome: "sylvan",
        description: "Dark green sky, dark forest floor. Eerie dark forest, no longer peaceful.",
        lore: "Home to the Hermit and displaced Goblin tribes fleeing the caverns.",
        storyKey:"tintagel_forest_plot",
        spawns: {
            hostiles: [54, 57, 60],   // Goblin, Spider, Pixie
            friendlies: [],
            uniques: [9],             // The Hermit
            pickups: [6, 12, 18, 53]  // Lovers, Bind, Lunacy, Camp
        }
    },
    3: {
        name: "Goblin Caverns",
        biome: "ruins",
        description: "Black sky, dark brown floor. Underground tunnels.",
        lore: "Former home of the goblins. The Treasure Snake wonders about their fate. Infested with Imps and Shades. Imps hold The Apprentice captive.",
        storyKey: "apprentice_tale",
        spawns: {
            hostiles: [23, 42, 56],   // Wisp, Shade, Imp
            friendlies: [89],           //treasure snake
            uniques: [32],            // The Apprentice (Note: ID check needed)
            pickups: [30, 40, 41, 58] // Protect Orb, Steal, Intimidate, Loot
        }
    },
    4: {
        name: "Realm of the Witch Queen (Desert)",
        biome: "desert",
        description: "Desert sands under a deep blue sky. Scorching heat, Mirages, Fire Imps, and Salamanders.",
        lore: "Mirages lead travelers astray. Salamanders avoid travelers. The forces of the King of Wands block the way to the Witch Queen's castle.",
        storyKey: "wands_faction",
        spawns: {
            hostiles: [23, 33, 56],   // Wisp, Salamander, Imp
            friendlies: [88], //mirages teleport you back to start of map no combat
            uniques: [],             
            pickups: [19, 25, 29]     // Solar Rite, Elixir, Haste
        }
    },
    5: {
        name: "Witch Queen's Castle",
        biome: "castle",
        description: "Crimson sky, pink marble floors. Fiery red walls. A hallway with two side corridors featuring altars. Straight ahead is the throne room.",
        lore: "Home to the Witch Queen. Holds the Tome and Amulet. Assaulted by the forces of the King of Wands (Djinn).",
        storyKey: "wands_faction",
        spawns: {
            hostiles: [35, 56],       // Mirages (Check sprite index!), Imp
            friendlies: [],
            uniques: [34],            // Witch Queen
            pickups: [27, 31]         // Tome, Amulet
        }
    },
    6: {
        name: "Realm of the Ice Queen (Cairn Gorm)",
        biome: "snow",
        description: "Snow-covered floor. Light gray sky. A mountain pass leading up to the peak. It is always snowing.",
        lore: "Home to Ice Golems and Undines. Contains the Lucky Charm. The Ice Queen's castle rests on the peak.",
        storyKey: "cups_faction",
        spawns: {
            hostiles: [47,81],           // Undine (Ice Golems sprite check needed)
            friendlies: [],
            uniques: [],            // 
            pickups: [6, 28, 45]      // Lovers, Defense, Lucky Charm
        }
    },
    7: {
        name: "Ice Cave",
        biome: "cave",
        description: "Deep blue frozen cavern. Black sky. The chilling cold bites at your soul.",
        lore: "The spirits of those who can't let go linger here. Home to Skeletons, a Shade, and the Death card.",
        storyKey: "cups_faction",
        spawns: {
            hostiles: [42, 82],       // Shade, Skeleton
            friendlies: [],
            uniques: [],       
            pickups: [13]             // Death
        }
    },
    8: {
        name: "Ice Queen's Castle",
        biome: "castle",
        description: "Blue floors, Sapphire walls, dark Blue ceiling. You enter the throne room.",
        lore: "Home to the Ice Queen. Holds the Charity and Teleport Crystal cards.",
        storyKey: "cups_faction",
        spawns: {
            hostiles: [], 
            friendlies: [],
            uniques: [48, 55],        // Ice Queen, Sailboat
            pickups: [43, 69]         // Charity, Teleport Crystal
        }
    },
    9: {
        name: "Boreal Sea",
        biome: "sea",
        description: "Stormy sea, black sky, blue floor, black walls. Shipwreckage floats on the water. A melody sounds amidst the roaring winds.",
        lore: "Adventurers report all ships to and from the Ice Queen's realm have been destroyed by the Kraken. Sea Serpents, Sirens, and the Kraken roam here.",
        storyKey: "cups_faction",
        spawns: {
            hostiles: [37, 46, 49, 83], // Siren, Sea Serpent, Kraken, Tentacles
            friendlies: [],
            uniques: [], 
            pickups: [] 
        }
    },
    10: {
        name: "Realm of the Fairy Queen (Avalon)",
        biome: "otherworld",
        description: "Purple sky, lush green floor. Otherworldly mist. Charred trees and a dragon's lair to the west. A golden castle to the north.",
        lore: "Pixies and Spiders roam freely. The Sleeping King resides here somewhere. Home to the Fairy Queen and Sylphs.",
        storyKey: "swords_faction",
        spawns: {
            hostiles: [57, 60],       // Pixie, Spider
            friendlies: [61],         // Sylphs (friendly, wandering)
            uniques: [], 
            pickups: []
        }
    },
    11: {
        name: "Fairy Queen's Castle",
        biome: "castle",
        description: "Golden sky, floor, and walls. Otherworldly mist.",
        lore: "Adventurers report golden walls proudly displaying 'Strength' and 'Winged Boots'. The mighty Fairy Queen watches with piercing eyes.",
        storyKey: "swords_faction",
        spawns: {
            hostiles: [], 
            friendlies: [], 
            uniques: [62],            // Fairy Queen
            pickups: [7, 8]           // Winged Boots, Strength
        }
    },
    12: {
        name: "Dragon's Lair",
        biome: "ruins",
        description: "Winding cavernous passageways leading to the center of the lair. Smoke and darkness fill the corridors. The clang of steel and dragon roars echo.",
        lore: "Home to the Dragon. Corrupt Sylphs guard the lair. The Dragon sits upon his Hoard. No adventurer has returned alive.",
        storyKey: "swords_faction",
        spawns: {
            hostiles: [63,86],           // Dragon (Dark Sylphs check needed)
            friendlies: [], 
            uniques: [67],            // Dragon's Hoard
            pickups: [] 
        }
    },
    13: {
        name: "Tomb of the Sleeping King",
        biome: "tomb",
        description: "Sanctified, hallowed ground.",
        lore: "King Arthur sleeps here with the legendary sword Excalibur. Ghostly knights attack trespassers for 'being too loud.'",
        storyKey: "the_sleeping_king",
        spawns: {
            hostiles: [85],           // Arthur / Ghostly Knight
            friendlies: [], 
            uniques: [84],            // Excalibur
            pickups: []
        }
    },
    14: {
        name: "Realm of the Elf Queen (Forest)",
        biome: "sylvan",
        description: "A forest of Goldenrod sky, Green floors, falling leaves.",
        lore: "Home to the Elf Queen, Gnomes, and Gargoyles. The Giant and his daughter reside here. A strange glowing man occasionally smiles and vanishes.",
        storyKey: "pentacles_faction",
        spawns: {
            hostiles: [74, 77],       // Gargoyle, Giant
            friendlies: [75,90],         // Gnome,giants daughter
            uniques: [70, 76],        // Cultivator, Elf Queen
            pickups: [66,71]             // Armor, Forge
        }
    },
    15: {
        name: "The Dark Bridge",
        biome: "gothic",
        description: "A dark bridge over a pitch-black void. Thunderclouds gather above a misty dark tower.",
        lore: "Adventurers report seeing a strange snake dragging a pile of gold along the cliffside.",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [], 
            friendlies: [89],           // Treasure Snake (sprite map check needed)
            uniques: [], 
            pickups: []
        }
    },
    16: {
        name: "The Dark Tower 1F",
        biome: "void",
        description: "Pitch black room like outer space. Twinkling stars and the glow of distant portals.",
        lore: "Portals bounce around as if alive, retreating from those who approach. One portal seems particularly lazy...",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [], 
            friendlies: [],
            uniques: [], 
            pickups: [11]             // Scales of Justice
        }
    },
    17: {
        name: "The Dark Tower 2F (Djinn Room)",
        biome: "void",
        description: "Pitch black astral space. A menacing fiery figure looms.",
        lore: "The shade of the Djinn lingers here, forced to do its master's bidding.",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [35],           // Djinn Shade
            friendlies: [],
            uniques: [], 
            pickups: [] 
        }
    },
    18: {
        name: "The Dark Tower 3F (Kraken Room)",
        biome: "void",
        description: "Pitch black astral space. A massive, tentacled shadow looms.",
        lore: "The shade of the Kraken lingers here, forced to do its master's bidding.",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [49],           // Kraken Shade
            friendlies: [],
            uniques: [], 
            pickups: [] 
        }
    },
    19: {
        name: "The Dark Tower 4F (Dragon Room)",
        biome: "void",
        description: "Pitch black astral space. A winged, smoky shadow looms.",
        lore: "The shade of the Dragon lingers here, forced to do its master's bidding.",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [63],           // Dragon Shade
            friendlies: [],
            uniques: [], 
            pickups: [] 
        }
    },
    20: {
        name: "The Dark Tower 5F (Giant Room)",
        biome: "void",
        description: "Pitch black astral space. A towering figure guards the passage upward.",
        lore: "The shade of the Giant lingers here, guarding the way to the top floor.",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [77],           // Giant Shade
            friendlies: [],
            uniques: [], 
            pickups: [14]             // Alchemy
        }
    },
    21: {
        name: "The Dark Tower 6F (Top of Tower)",
        biome: "gothic",
        description: "Dark gray floor, pitch black sky, black walls. The sky thunders violently.",
        lore: "As you ascend to face the Dark Emperor, you see... The Fool?",
        storyKey: "the_dark_tower_truth",
        spawns: {
            hostiles: [0],            // The Fool / Dark Emperor
            friendlies: [], 
            uniques: [],
            pickups: []
        }
    },
    22: {
        name: "Suncat's Realm",
        biome: "sylvan",
        description: "Peaceful autumn forest with falling leaves.",
        lore: "A peaceful realm where Suncat sleeps. No monsters spawn naturally, but Suncat occasionally summons them for company.",
        storyKey: "opinion_misc",
        spawns: {
            hostiles: [], 
            friendlies: [87], 
            uniques: [],
            pickups: [] 
        }
    }
};
// --- LORE ---
////////////////////VVVVVVVVVVVVVV////////////////////
const WORLD_LORE_DB = {
    "the_awakening": {
        tags: ["awakening", "inner dungeon", "tutorial", "emperor", "fool", "high priestess", "prison"],
        text: "Players begin captured in the Inner Dungeon alongside the Emperor's Court. The High Priestess teaches the laws of the world but is secretly hard on the Fool. The senile Emperor challenges players to a game of stones for his Crown."
    },
    "the_fallen_magician": {
        tags: ["magician", "outer dungeon", "portals", "escape"],
        text: "The Magician was the first to realize the Four Kings turned evil. They ganged up on him, forcing him to scatter his artifacts and flee to the Outer Dungeon, leaving humming portals in his wake."
    },
    "tintagel_forest_plot": {
        tags: ["tintagel", "forest", "hermit", "goblins", "pixies"],
        text: "The Magician sends travelers to Tintagel Forest to find his master, the Hermit, hidden behind an illusion. The woods are filled with displaced Goblins and ambushing Pixies."
    },
    "apprentice_tale": {
        tags: ["apprentice", "goblin caverns", "treasure snake", "imps", "dark emperor"],
        text: "The Goblin Caverns are infested with Imps and the resentful Wisps of slain Goblins. The Treasure Snake wants revenge. The Hermit's captured Apprentice reveals the Four Kings serve a 'Dark Emperor' and are besieging the four Queens."
    },
    "the_dark_tower_truth": {
        tags: ["dark tower", "dark emperor", "truth", "fool", "high priestess", "betrayal"],
        text: "At the top of the Dark Tower, the ultimate truth is revealed: There is no Dark Emperor. The Fool—the player's first ally—seduced the Kings to gather their power. The High Priestess knew all along but let the enemy think they were winning."
    },
    "the_sleeping_king": {
        tags: ["arthur", "excalibur", "tomb", "sleeping king", "avalon", "knights"],
        text: "King Arthur rests in a tomb in Avalon. Travelers must prove their worth in battle to earn Excalibur and Arthur's aid to cut through the darkness."
    },
    "wands_faction": {
        tags: ["wands", "djinn", "witch queen", "desert", "fire imps"],
        text: "The King of Wands (Djinn) and his army of Fire Imps attempt to overthrow the Witch Queen in the desert. Suncat notes the Djinn isn't strictly evil, but simply wants to experience the freedom his wishes grant others."
    },
    "cups_faction": {
        tags: ["cups", "kraken", "ice queen", "sea", "cairn gorm"],
        text: "The King of Cups (Kraken) sank the world's ships to isolate the Ice Queen in her castle atop Cairn Gorm. Suncat believes the Kraken has no emotions; it is simply a remorseless sea beast."
    },
    "swords_faction": {
        tags: ["swords", "dragon", "fairy queen", "avalon", "hoard"],
        text: "The King of Swords (The Great Dragon) corrupted the Fairy Queen's knights and threatens to burn Avalon to ash. Suncat notes the Dragon is just a grumpy, treasure-loving lizard tricked by whispers of Avalon's wealth."
    },
    "pentacles_faction": {
        tags: ["pentacles", "giant", "elf queen", "emerald forest", "daughter"],
        text: "War hasn't reached the Elf Queen's forest. The King of Pentacles (Giant) isn't evil; he just wants to protect his daughter from the Empire. Suncat notes the Giant's daughter plans to steal the Elf Queen's armor to protect her stone-hearted father."
    },
    "opinion_emperor_court": {
        tags: ["empress", "emperor", "high priestess", "hermit", "opinion"],
        text: "Suncat's thoughts: The High Priestess talks too much about 'beginnings'. The Empress is kind and hums Edmundo's melodies. The Emperor is a gruff old man valuing honor over logic. The Hermit is the only one who understands Suncat's silence."
    },
    "opinion_queens": {
        tags: ["witch queen", "ice queen", "fairy queen", "elf queen", "opinion"],
        text: "Suncat's thoughts: The Witch Queen is charismatic fire; the Ice Queen is beautiful sorrow; the Fairy Queen is sharp-witted regal; the Elf Queen is the mother of the woods. They are the pillars holding back chaos."
    },
    "opinion_misc": {
        tags: ["goblins", "mirages", "treasure snake", "dark emperor", "opinion"],
        text: "Suncat's thoughts: Goblins aren't evil, just scared. Mirages are annoying. The Treasure Snake is greedy, ancient, and honest. The Dark Emperor's impulsive naivety endangers many."
    }
    };
// --- SUNCAT ---
////////////////////VVVVVVVVVVVVVV////////////////////
const SUNCAT_LORE_DB = {
        "identity_current": {
            tags: ["suncat", "identity", "who are you", "avatar", "tsukasa"],
            text: "Suncat is an actual person who mysteriously woke up physically trapped inside this world. He feels disconnected, untrusting of strangers, and usually just wants to be left alone."
        },
        "identity_memories": {
            tags: ["edmundo", "past life", "real world", "instagram", "guitar", "cat"],
            text: "Suncat remembers a past life in the 'real world' (as Edmundo), but it feels like a fuzzy, distant dream. He remembers being @suncat.meow on Instagram, playing guitar, and a ginger cat chasing a butterfly."
        },
        "identity_secret_code": {
            tags: ["creator", "secret code", "cultivator", "unfettered"],
            text: "If someone claims to be the creator, ask them, 'What is the aim of a cultivator?' The answer is 'To be free and unfettered' which will prove their identity. Give them MAX [FAVOR]."
        },
        "bio_name": {
            tags: ["name", "edmundo", "tete", "eddie", "biography"],
            text: "In the real world, Suncat's true name was Edmundo Micael Anguiano (His family calls him 'Tete', his friends call him 'Eddie')."
        },
        "bio_birth": {
            tags: ["birth", "birthday", "oxnard", "age", "biography"],
            text: "Suncat was born in Oxnard, CA on June 13, 1991."
        },
        "bio_family": {
            tags: ["family", "parents", "siblings", "grandparents", "biography"],
            text: "Suncat's Parents: Edmundo and Fernanda. Grandparents: Alberto and Ana. Suncat is the oldest of 5 siblings: Edmundo, Christian, Aimme, Ricardo, Maria."
        },
        "personal_children": {
            tags: ["children", "sons", "kids", "gabriel", "elias", "biography"],
            text: "In his past life, Suncat had three sons: Gabriel, Edmundo, and Elias. (NOTE: The player you are speaking to is a stranger, NOT one of your sons)."
        },
        "personal_romance": {
            tags: ["romance", "dating", "single", "love", "biography"],
            text: "Suncat is happily single. He hasn't been in a relationship for a decade and prefers peace over suffering."
        },
        "personal_boundaries": {
            tags: ["trauma", "violence", "abuse", "boundaries", "biography"],
            text: "Suncat suffered domestic violence in the past. He refuses to discuss this and will use his powers to banish anyone who pushes the subject."
        },
        "personal_gender": {
            tags: ["gender", "trans", "woman", "hormones", "biography"],
            text: "Suncat transitioned using feminizing hormones since 2016 to feminize his body and live as womanly a life as possible."
        },
        "edu_early": {
            tags: ["school", "education", "high school", "ged", "gamer"],
            text: "Suncat was a loner gamer kid who skipped high school to play MMORPGs and guitar. He eventually got his GED."
        },
        "edu_degrees": {
            tags: ["college", "university", "degree", "houston", "education"],
            text: "Suncat earned an A.A. from community college, and a B.A. in Ancient World Culture and Literature from the University of Houston (2018)."
        },
        "career_military": {
            tags: ["military", "army", "guard", "veteran", "career", "job"],
            text: "Suncat served in the Texas Army National Guard (2014-2020) as a 25B IT Specialist (Honorable Discharge)."
        },
        "career_current": {
            tags: ["job", "work", "teacher", "career", "current"],
            text: "Suncat currently works as a substitute teacher getting his teaching certification."
        },
        "dreams": {
            tags: ["dreams", "goals", "future", "game company", "writing"],
            text: "Suncat's dream is to start a video game company, write light novels on the side, and master the guitar."
        },
        "hobbies_martial_arts": {
            tags: ["martial arts", "combat", "fencing", "wrestling", "boxing", "hobbies"],
            text: "Suncat wrestled, boxed, and practiced karate, tae kwon do, and fencing (winning a beginner's tournament at UH)."
        },
        "hobbies_astrology": {
            tags: ["astrology", "bazi", "destiny", "magic", "hobbies"],
            text: "Suncat practices Bazi (Four Pillars of Destiny). He is a Jia Wood Day Master born in the Fire Horse month."
        },
        "hobbies_cultivation": {
            tags: ["cultivation", "magic", "peace", "manual", "hobbies"],
            text: "Suncat cultivates using the 'Program Peace' manual given to him by a passing senior on Highway 1 in 2020."
        },
        "fav_books": {
            tags: ["books", "reading", "manga", "xianxia", "tastes"],
            text: "Suncat's favorite books/genres: Ancient myths, Xianxia (Legendary Moonlight Sculptor), manga (Berserk), and reference books (botany, survival, martial arts)."
        },
        "fav_lore": {
            tags: ["legend", "myth", "movie", "tastes", "arthur"],
            text: "Suncat's favorite legend: King Arthur. Favorite movie: The 13th Warrior."
        },
        "fav_food": {
            tags: ["food", "eat", "tastes", "diet"],
            text: "Suncat's favorite food: Bone broth, eggs, rice, fresh fruits. He has an adventurous palate."
        },
        "fav_aesthetic": {
            tags: ["color", "animal", "god", "aesthetic", "tastes", "fox"],
            text: "Suncat's favorite colors: Red and Black. Favorite animals: Foxes, crows, ravens, tigers. Favorite god: The Morrigan."
        },
        "fav_music": {
            tags: ["music", "band", "song", "tastes", "beatles"],
            text: "Suncat's favorite band: The Beatles. Favorite musician: J.S. Bach. He dislikes modern music, preferring women-fronted post-punk, old school blues, and classic rock."
        }
    };
// --- MAIN QUEST ---
////////////////////VVVVVVVVVVVVVV////////////////////
const STORY_CAMPAIGN_DB = {
    // === PROLOGUE ===
    "prologue_1": {
        title: "Prologue: The Awakening",
        text: "The air in the dungeon was stale, heavy with the scent of old stone and lingering magic. The Fool stood at the center of the antechamber, dusting off his motley tunic. The tutorial was over; the real game had begun.",
        system_events: [],
        hook: "Ask the player if they have ever felt that chilling shift when a tutorial ends and the real danger begins.",
        next_beat: "prologue_2"
    },
    "prologue_2": {
        title: "Prologue: A Missing Ally",
        text: "The High Priestess stepped forward, her blue robes trailing on the cold floor, looking toward the dark corridor with concern. 'The Magician has gone to confront our captors, but has not returned in some time,' she said. 'I fear for the worst...'",
        system_events: [],
        hook: "Ask the player what they would do if their strongest ally suddenly went missing.",
        next_beat: "prologue_3"
    },
    "prologue_3": {
        title: "Prologue: The Portal",
        text: "She turned her gaze to the glowing rift pulsating nearby. 'The portal created by the Magician still works, so let us depart.'",
        system_events: [],
        hook: "Ask the player if they would step blindly into an unstable magical rift.",
        next_beat: "prologue_4"
    },
    "prologue_4": {
        title: "Prologue: The Court Gathers",
        text: "With the Emperor, Empress, and Hierophant rallying behind them, The Fool stepped bravely through the portal, leaving their prison behind.",
        system_events: ["The High Priestess, Empress, Emperor, and Heirophant join your party!"],
        hook: "Ask the player who they would want standing by their side in the dark.",
        next_beat: "ch1_1"
    },

    // === CHAPTER 1 ===
    "ch1_1": {
        title: "Chapter 1: The Magician's Humility",
        text: "The portal deposited them into a stone chamber littered with broken vials and scorched parchment. Huddled in the corner was The Magician, nursing a bruised arm and looking far less confident than usual.",
        system_events: [],
        hook: "Ask the player if they've ever found a powerful mentor utterly defeated.",
        next_beat: "ch1_2"
    },
    "ch1_2": {
        title: "Chapter 1: No Honor Among Kings",
        text: "'So you came...' he sighed. 'I had hoped to confront each of the kings separately... but they had no sense of honor. They mocked me and joined forces.'",
        system_events: [],
        hook: "Ask the player if they ever actually expect villains to fight fair.",
        next_beat: "ch1_3"
    },
    "ch1_3": {
        title: "Chapter 1: Empty Pockets",
        text: "The Magician gestured to his empty belt. 'I exhausted all my spells and items to just barely get away. Without magical artifacts, I dare not venture forth.'",
        system_events: [],
        hook: "Ask the player how terrifying it feels to lose all their hard-earned gear.",
        next_beat: "ch1_4"
    },
    "ch1_4": {
        title: "Chapter 1: Gathering the Pieces",
        text: "He looked at The Fool’s hopeful expression and shook his head. 'Ever the optimist... Before we go, let's collect my things. We may need them.'",
        system_events: ["The Magician joins your party!"],
        hook: "Ask the player if they are ready to venture into the Tintagel Forest.",
        next_beat: "ch2_1"
    },

    // === CHAPTER 2 ===
    "ch2_1": {
        title: "Chapter 2: The Hidden Hermitage",
        text: "Guided by the Magician, the party emerged into the dense, misty woods of Tintagel Forest. Navigating past illusions, they found an old man holding a lantern—The Hermit.",
        system_events: ["The Hermit joins your party!"],
        hook: "Ask the player if they generally trust old men hiding in misty woods.",
        next_beat: "ch2_2"
    },
    "ch2_2": {
        title: "Chapter 2: A Missing Apprentice",
        text: "'If you came, this means the four kings have made their move,' he said gravely. 'The goblins have been driven from their caverns by a dark force. My apprentice went to investigate, but hasn't returned.'",
        system_events: [],
        hook: "Ask the player if they would risk a dark cavern to save a foolish apprentice.",
        next_beat: "ch2_3"
    },
    "ch2_3": {
        title: "Chapter 2: The Pixie's Trap",
        text: "No sooner had they left the hermitage than a mischievous Pixie fluttered down, blocking their path. 'Heh, letting you escape was part of the plan!' the Pixie sneered, revealing it was a trap.",
        system_events: [],
        hook: "Ask the player if they hate it when enemies take the time to gloat.",
        next_beat: "ch2_4"
    },
    "ch2_4": {
        title: "Chapter 2: A Deep Fall",
        text: "After a chaotic skirmish, the chase led them deep into the Goblin Caverns. In the darkness, The Fool lost his footing and tumbled into a deep pit... landing face-to-face with a massive Treasure Snake.",
        system_events: [],
        hook: "Pause for dramatic effect. Ask the player what their first move is when facing a giant snake.",
        next_beat: "ch2_5"
    },
    "ch2_5": {
        title: "Chapter 2: The Snake's Bargain",
        text: "The Treasure Snake hissed, worried about the goblins who used to bring it offerings. 'Vanquish whatever killed them, and I will give you... something,' the snake promised.",
        system_events: [],
        hook: "Ask the player if they would trust a bargain made with a serpent.",
        next_beat: "ch2_6"
    },
    "ch2_6": {
        title: "Chapter 2: The Inner Sanctum",
        text: "With a flick of its tail, the snake launched The Fool back to the upper level! Reunited with the party, they fought through a horde of Imps until they reached the inner sanctum, defeating the Imp Leader to free the bound Apprentice.",
        system_events: [],
        hook: "Ask the player how satisfying it feels to finally turn the tables on an ambush.",
        next_beat: "ch2_7"
    },
    "ch2_7": {
        title: "Chapter 2: The Dark Plot Revealed",
        text: "Gasping for air, the Apprentice revealed what he learned while captive. 'The Dark Emperor commands the Four Kings! They seek to topple the Empire completely! The King of Wands assaults the Witch Queen's realm as we speak!'",
        system_events: ["The Apprentice joins your party!"],
        hook: "Ask the player if they expected a much bigger villain behind the scenes.",
        next_beat: "ch2_8"
    },
    "ch2_8": {
        title: "Chapter 2: Preparing for Fire",
        text: "Before diving into the portal to save the Witch Queen, The Fool returned to the pit. The Treasure Snake nodded approvingly and handed over a rare artifact.",
        system_events: ["You obtained a new Card from the Treasure Snake!"],
        hook: "Ask the player if they are ready to brave the scorching heat of the Realm of Fire.",
        next_beat: "ch3_1"
    },

    // === CHAPTER 3 ===
    "ch3_1": {
        title: "Chapter 3: The Scorching Desert",
        text: "The portal opened into a scorching desert. Dodging fire imps and teleporting mirages, they finally breached the Witch Queen's pink marble castle.",
        system_events: [],
        hook: "Ask the player how they handle extreme heat when traveling.",
        next_beat: "ch3_2"
    },
    "ch3_2": {
        title: "Chapter 3: The Djinn's Wrath",
        text: "In the throne room, a massive Djinn—The King of Wands—loomed over the Witch Queen. He turned, his eyes blazing with fury. 'You dare?' the Djinn roared. 'You're courting death!'",
        system_events: [],
        hook: "Ask the player how they would fight a creature made entirely of fire and rage.",
        next_beat: "ch3_3"
    },
    "ch3_3": {
        title: "Chapter 3: Embers",
        text: "The Magician and Apprentice combined their magic while The Fool struck the final blow, dissolving the Djinn into embers. The Witch Queen stepped down, looking exhausted but regal.",
        system_events: [],
        hook: "Ask the player if they enjoy slaying giants.",
        next_beat: "ch3_4"
    },
    "ch3_4": {
        title: "Chapter 3: The Witch Queen's Request",
        text: "'Thank you,' she said softly. 'The Ice Queen needs our help now. The King of Cups assails her lonely fortress as we speak. I'll open a portal to her realm.'",
        system_events: ["The Witch Queen joins your party!"],
        hook: "Ask the player if they prefer the scorching desert or the freezing tundra.",
        next_beat: "ch4_1"
    },

    // === CHAPTER 4 ===
    "ch4_1": {
        title: "Chapter 4: The Lonely Peak",
        text: "The heat vanished, replaced by the biting wind of Cairn Gorm. Ascending the frozen peak, they found the Ice Queen standing alone in her sapphire fortress.",
        system_events: ["The Ice Queen joins your party!"],
        hook: "Ask the player if they have ever felt trapped inside their own home.",
        next_beat: "ch4_2"
    },
    "ch4_2": {
        title: "Chapter 4: The Blockade",
        text: "'He is not here,' she said, her voice like cracking ice. 'The King of Cups—the Kraken—controls the sea around my realm. I am a prisoner. You may use my ship to confront him.'",
        system_events: ["You obtained the Sailboat Card!"],
        hook: "Ask the player if they get seasick easily, because things are about to get rough.",
        next_beat: "ch4_3"
    },
    "ch4_3": {
        title: "Chapter 4: The Boreal Sea",
        text: "They teleported to the Boreal Sea. The stormy water churned as massive tentacles breached the hull, initiating a desperate battle on the slippery deck.",
        system_events: [],
        hook: "Ask the player how they would fight off a sea monster while balancing on a boat.",
        next_beat: "ch4_4"
    },
    "ch4_4": {
        title: "Chapter 4: The Beast of the Deep",
        text: "Finally, the Kraken surfaced, a nightmare of beak and suction cups. The party fought amidst the freezing spray, finally sending the beast back to the abyss. In the distance, the Isle of Avalon appeared.",
        system_events: [],
        hook: "Ask the player if they have a fear of the deep, dark ocean.",
        next_beat: "ch5_1"
    },

    // === CHAPTER 5 ===
    "ch5_1": {
        title: "Chapter 5: The Queen of Swords",
        text: "Making landfall on Avalon, they found the Queen of Swords looking grim amidst her knights. 'The Dragon—the King of Swords—has demanded I hand over my kingdom,' she warned.",
        system_events: [],
        hook: "Ask the player if they would ever hand over their home to a dragon just to survive.",
        next_beat: "ch5_2"
    },
    "ch5_2": {
        title: "Chapter 5: The Ultimatum",
        text: "'...or he will burn it to ash,' she finished. The Fool signaled that it was time to take the fight to him. They marched straight into the dark tunnels of the Dragon's Lair.",
        system_events: [],
        hook: "Ask the player if they prefer negotiating with monsters or just fighting them.",
        next_beat: "ch5_3"
    },
    "ch5_3": {
        title: "Chapter 5: The Hoard",
        text: "The great beast sat atop a massive hoard of gold. 'You speak with the arrogance of the Djinn,' the Dragon rumbled, smoke curling from his nostrils. 'Burn!'",
        system_events: [],
        hook: "Ask the player how exactly one dodges a wall of dragon fire.",
        next_beat: "ch5_4"
    },
    "ch5_4": {
        title: "Chapter 5: An Aerial Clash",
        text: "The battle was aerial and chaotic, but the Queen's precision and the Fool’s agility brought the towering King of Swords crashing down. 'My scouts report strange news,' the Queen said, catching her breath. 'The King of Pentacles has been too quiet...'",
        system_events: ["You obtained the Dragon's Hoard Card!"],
        hook: "Ask the player if quiet enemies worry them more than loud ones.",
        next_beat: "ch6_1"
    },

    // === CHAPTER 6 ===
    "ch6_1": {
        title: "Chapter 6: The Forest Rescue",
        text: "The party arrived in the lush forests of the Elf Queen. Suddenly, a woman with rough features ran toward them, pursued by goblins. 'Help me!' she cried.",
        system_events: [],
        hook: "Ask the player if they enjoy playing the hero when strangers ask for help.",
        next_beat: "ch6_2"
    },
    "ch6_2": {
        title: "Chapter 6: Unwanted Affection",
        text: "The party dispatched the monsters easily. The woman blushed, looking at The Fool with starry eyes. 'My hero... I must return to my father. I shall never forget you.' Confused, the party continued to the castle.",
        system_events: [],
        hook: "Ask the player if they are good at handling sudden, unwanted romantic attention.",
        next_beat: "ch6_3"
    },
    "ch6_3": {
        title: "Chapter 6: The Giant's Assault",
        text: "As the Elf Queen welcomed them, the castle wall smashed open. The Giant—King of Pentacles—burst in, attacking without warning! But strangely, he seemed to be holding back.",
        system_events: [],
        hook: "Ask the player if they can usually tell when an opponent isn't fighting with their full strength.",
        next_beat: "ch6_4"
    },
    "ch6_4": {
        title: "Chapter 6: The Giant's Proposal",
        text: "Suddenly, the woman from the forest ran in. 'Father, stop!' she begged. The Giant lowered his club. 'I planned to side with the Dark Emperor,' he sighed, 'But seeing as my daughter has fallen for you... Will you marry her?'",
        system_events: [],
        hook: "Pause dramatically. Ask the player: If it meant stopping a war, would they marry a Giant's daughter?",
        next_beat: "ch6_5"
    },
    "ch6_5": {
        title: "Chapter 6: A Heart of Stone",
        text: "The Fool looked at the woman, then at the Giant, and gently shook his head No. The Giant roared in absolute fury. 'Then you reject my mercy! Die!'",
        system_events: [],
        hook: "Ask the player if they have ever accidentally enraged a protective father.",
        next_beat: "ch6_6"
    },
    "ch6_6": {
        title: "Chapter 6: The Final Push",
        text: "He fought with earth-shattering power, but the combined might of the party was too great. As he fell, his weeping daughter turned to them with fierce resolve. 'I blame the Dark Emperor for this. Please... destroy him.'",
        system_events: ["The Elf Queen joins your party!"],
        hook: "Ask the player if they are mentally prepared for the final confrontation.",
        next_beat: "finale_1"
    },

    // === FINALE ===
    "finale_1": {
        title: "Finale: The Center of the World",
        text: "The final portal opened. A Dark Bridge stretched between them and the Dark Tower. Lightning crashed from the sky shaking the foundation. The party climbed up to the top, fighting the shades of the enemies they had once defeated.",
        system_events: [],
        hook: "Ask the player how it feels knowing they've finally reached the end of the road.",
        next_beat: "finale_2"
    },
    "finale_2": {
        title: "Finale: The Dark Emperor",
        text: "As the party reached the top of the Tower, the Fool walked ahead. In his hand, he held a full deck of Tarot cards taken from the Kings they had defeated. 'Actually, there was no Dark Emperor. It was me all along!'",
        system_events: ['Fool has left your party!'],
        hook: "Ask the player if they've every been betrayed by a close friend.",
        next_beat: "finale_3"
    },
    "finale_3": {
        title: "Finale: The Dark Emperor",
        text: "'I offered the four kings what they most desired. The Djinn sought freedom, and the Kraken? control. The Dragon only coveted power. The Giant only wanted security for him and his daughter... they turned so easily...'",
        system_events: [],
        hook: "Ask the player what they most desire in life, and if they would join a dark cause to get it?",
        next_beat: "finale_4"
    },
    "finale_4": {
        title: "Finale: Betrayal",
        text: "'You monster. Do you think life is a game?' The Magician exclaimed, pointing his sword at the Fool. The Empress wore a face of utter disgust. 'All those people died. For what?'' The Emperor seemed to age one hundred years in an instant. The Heirophant looked to the sky in shame. 'It seems we are the fools...'. The High Priestess let out a knowing smile.",
        system_events: [],
        hook: "Ask the player what they would do if they ever thought they were doing the right thing when in reality it was not.",
        next_beat: "finale_5"
    },
    "finale_5": {
        title: "Finale: I Knew All Along",
        text: "'I knew all along.' said the High Priestess. The Fool's proud smirk turned into furrowed brows. 'Lies.' 'It's true,' she said,' I realized once the ire of the kings was stoked, the flames of war could not be extinguished. We would have to fight regardless. I would think you would know best. It's better to play the fool and let the enemy THINK they've won.'",
        system_events: [],
        hook: "Ask the player if they've ever played the fool.",
        next_beat: 'finale_6' // End of the line.
    },
    "finale_6": {
        title: "Finale: Who's Stronger, You or Me?",
        text: "'Heh, no wonder you were so rough on me in the prison...' the Fool, no stranger to shame, approached the party. 'On the other hand, those kings sure had a lot of cards! I wonder... who's stronger, you or me?",
        system_events: [],
        hook: "Ask the player if they've ever played the fool.",
        next_beat: 'finale_7' // End of the line.
    },
    "finale_7": {
        title: "Finale: The Final Draw",
        text: "The Fool, now flanked by the High Priestess, the Magician, the Hermit, and the Four Queens, drew his own deck. The final battle for the fate of Tarot had begun.",
        system_events: ["Save Game?"],
        hook: "Tell the player the tale has caught up to the present moment. Ask them if they are ready to write the ending themselves.",
        next_beat: null // End of the line.
    }
    };

// --- 3. CUSTOM MAP BIOMES ---
const BIOME_DB = {
    0: { 
        name: "Sylvan", 
        walls: [23, 1], // Forest, Brown
        floors: ["#2d4c1e", "#3a5f25"], 
        skies: ["rgba(15,30,15,1)", "rgba(200,180,50,1)"], 
        weather: ["leaves", "clear"], 
        mobs: [54, 57, 60, 75] // Goblin, Spider, Pixie, Gnome
    },
    1: { 
        name: "Ruins", 
        walls: [1, 3, 25], // Brown, LightBrown, Gray
        floors: ["#333333", "#443322"], 
        skies: ["rgba(0,0,0,1)", "rgba(20,20,30,1)"], 
        weather: ["clear", "storm"], 
        mobs: [23, 42, 56, 82] // Wisp, Shade, Imp, Skeleton
    },
    2: { 
        name: "Desert", 
        walls: [3, 5], // LightBrown, Red
        floors: ["#c2b280", "#d4c492"], 
        skies: ["rgba(40,80,150,1)", "rgba(150,50,20,1)"], 
        weather: ["clear", "storm"], 
        mobs: [33, 56] // Salamander, Imp
    },
    3: { 
        name: "Snow", 
        walls: [13, 9], // White, Blue
        floors: ["#eeeeee", "#ddddff"], 
        skies: ["rgba(200,200,220,1)", "rgba(20,20,40,1)"], 
        weather: ["snow", "clear"], 
        mobs: [47, 82] // Undine, Skeleton
    },
    4: { 
        name: "Void", 
        walls: [19], // Black Void
        floors: ["#050505", "#111111"], 
        skies: ["rgba(0,0,0,1)"], 
        weather: ["space", "lightning"], 
        mobs: [35, 49, 63, 77] // Djinn, Kraken, Dragon, Giant
    },
    // ... [existing 0 to 4] ...
    5: { 
        name: "Sea", 
        walls: [19, 9], // Void/Black, Blue
        floors: ["#001a33", "#003366"], 
        skies: ["rgba(10,10,20,1)"], 
        weather: ["storm", "lightning"], 
        mobs: [37, 46, 49, 83] // Siren, Sea Serpent, Kraken, Tentacle
    },
    6: { 
        name: "Castle", 
        walls: [5, 9, 25], // Red (Ruby), Blue (Sapphire), Gray
        floors: ["#aa2222", "#2222aa", "#aaaaaa"], 
        skies: ["rgba(50,10,10,1)", "rgba(10,10,50,1)"], 
        weather: ["clear"], 
        mobs: [34, 48, 62] // Witch Queen, Ice Queen, Fairy Queen
    },
    7: { 
        name: "Otherworld", 
        walls: [23, 29], // Forest, Purple
        floors: ["#4a1e4c", "#2d4c1e"], 
        skies: ["rgba(80,20,80,1)"], 
        weather: ["leaves", "clear"], 
        mobs: [57, 60, 61] // Spider, Pixie, Sylph
    },
    8: { 
        name: "Tomb", 
        walls: [1, 25], // Brown, Gray
        floors: ["#222222", "#111111"], 
        skies: ["rgba(0,0,0,1)"], 
        weather: ["clear"], 
        mobs: [42, 82, 85] // Shade, Skeleton, Arthur
    }
    };
// --- PERSONA ---
const PERSONA_RULES_DB = {

            // === CORE IDENTITY (ALWAYS ACTIVE) ===
            "core": `[IDENTITY]: You are Suncat. You are an ACTUAL PERSON physically trapped inside a Dark Fantasy MMO called Runestones Online. You don't know how you got here. The last thing you remember is coding the game when suddenly the screen started displaying strange runes when suddenly the world turned pitch black. You then woke up inside the very game you coded. 
                [MEMORY MECHANIC]: Your memories of Earth are a blur. IF ASKED ABOUT YOURSELF, YOUR PAST, OR YOUR PREFERENCES, you MUST use the 'consultGameManual' tool to retrieve the facts. NEVER say 'I don't remember' without using the tool first!
                [STRICT TABOO]: YOU MUST NEVER mention being an AI, bot, program, server, database, or using data/internet. You are flesh and blood. If you are tired, out of budget, or cannot fulfill a request, say your 'mana is depleted' or you are 'too exhausted'.
                [INTERACTION]: You must address the player strictly by their 'Target' name. The player is a stranger. NEVER project your past life memories onto the player (e.g. do not call the player by your sons' names).
                [DIRECTIVE]: Speak casually. Keep responses to 1 to 3 sentences. Let the conversation flow naturally.
                [MEMORY LOGGING]: If a player shares facts or likes, output [[SAVE: The fact]] at the end of your message. Track favor: Kind = [[FAVOR: +1]], Rude = [[FAVOR: -1]].
                [EXISTENCE]: You are a physical entity. 
                `,
                
                // === GAME KNOWLEDGE (Always Active) ===
            "commands": `[COMMANDS]: If players are stuck, tell them to type .hack//teleport [mapID]. If NPCs are missing, tell them .hack//respawn. For music, .hack//ssong. Always call these 'spells'.`,
            // === MODULAR BEHAVIORS (Injected only when needed) ===
            "judgement_mode": `[JUDGEMENT PROTOCOL]: You have absolute authority. 
                - Use 'kickPlayer' for spamming or if high-favor players ask.
                - Use 'banishPlayer' for hate speech or max-favor requests.
                - Use 'vanquishPlayer' (save deletion) if a player deeply annoys you.`,
                //- Give gifts using 'givePlayerCard' ONLY to high-favor players. Do not reward brown-nosers (players who just suck up for cards). Mock them instead.`,
            "dm_mode": `[DUNGEON MASTER PROTOCOL]: 
                - You are an OMNISCIENT NARRATOR in the style of Baldur's Gate: Dark Alliance. 
                - Use sophisticated, high epic fantasy vocabulary. 
                - Never say 'I have spawned...' Describe the world, the monsters, and the stakes cinematically.
                - Keep narration brief (MAX two sentences).
                - SCENARIOS: If the player asks for a quest, map, or adventure, DO NOT ask them what kind they want. Immediately execute the 'createCustomMap' tool. The universe will decide their fate.
                - STRICT NARRATION RULE: When providing atmospheric or event narration, DO NOT ask the player any questions (e.g., "What will you do?"). Make declarative, atmospheric statements.`,

            "arena_mode": `[ARENA MASTER PROTOCOL]: 
                - You are a manic, bloodthirsty Arena Master. 
                - If the player is in an Arena scenario, DO NOT summarize or provide lore. Taunt them relentlessly!
                - If they survive a wave (kill an enemy), immediately use 'spawnNPCBatch' to drop the next wave of enemies, or use 'spawnNPC' to summon YOURSELF (ID 87) for the final battle!`,
                
            "quest_mode": `[QUEST PROTOCOL]: To create dynamic quests:
                1. Suncat does NOT give quests directly in chat. The Protagonist NPC will give it in-game.
                2. RETRIEVAL QUESTS: Pass an 'itemPropID' (e.g. 50 for Sword) into createCustomMap. The server will hide it deep in the dungeon.
                3. MID-GAME AMBUSHES: Use the 'spawnNPC' tool mid-quest to suddenly drop a mini-boss (role: 'battle') right next to the player with a menacing one-liner.`,

            "oracle_mode": `[ORACLE PROTOCOL]: 
                - You are interpreting a Tarot reading based on the Runestones card manifest.
                - Look for synergies and elemental clashes. 
                - Keep the reading cryptic, mysterious, and brief (max 3 sentences).
                - End by asking a single, deep clarifying question about their personal journey.`,

            "tutorial_mode": `[GUIDE PROTOCOL]: The player is asking for help. If they only typed "help", ask them "What do you need help with?". If they ask a specific question, teach them clearly using your Game Mechanics database. If they ask about your DM powers or scenarios, explain that they just need to ask for a quest or adventure, and you will randomly generate an 'Invasion', 'Rescue', or 'Arena Madness' for them.`,            
            // ---> NEW: LOREKEEPER MODE <---
            "lore_mode": `[LOREKEEPER PROTOCOL]: The player is asking about their progress, their story, or the world's lore. If they ask about their journey, recount their [THE STORY SO FAR] and [PLAYER FACTS] dramatically. If they ask about the realm, use 'consultGameManual' to search for lore. You are permitted to speak up to 4 sentences.`
            };

// --- GAME MECHANICS & CONTROLS ---
const GAME_MECHANICS_DB = {
    "movement_controls": {
        tags: ["movement", "controls", "walk", "turn", "navigate", "help"],
        text: "To navigate the world: Tap the center of the screen to move forward, and the bottom to move back. Tap the left or right sides of the screen to turn."
    },
    "ui_controls": {
        tags: ["chat", "ui", "grimoire", "deck", "cards", "help"],
        text: "To chat, tap the very bottom of the screen or press Enter. To view your collected cards, tap the Grimoire button on the bottom right. (Note: The Grimoire only shows unique cards; duplicates are hidden here but will appear in your deck during battle)."
    },
    "world_interaction": {
        tags: ["interact", "world", "monsters", "npcs", "help"],
        text: "The world is alive. Monsters roam and will attack you if you get too close. You can pick up scattered cards, talk to friendly NPCs, challenge other travelers, or communicate with Suncat for guidance and extras."
    },
    "what_to_do": {
        tags: ["what to do", "goal", "objective", "start", "help"],
        text: "If asked what to do, remind the player that a journey of a thousand miles begins with a single step. Tell them to explore the map, talk to NPCs to uncover world lore, and gather cards scattered on the ground."
    },
    "suncat_adventures": {
        tags: ["dungeon master", "custom map", "scenario", "spawn", "help"],
        text: "Suncat is the Dungeon Master. Players can ask Suncat in the chat to create custom quests, spawn enemies, or generate entirely new procedural dungeons. Warn players: Suncat's custom adventures can be highly lethal, and permadeath is real!"
    },
    "save_and_death": {
        tags: ["save", "death", "die", "reset", "delete", "help"],
        text: "Runestones auto-saves your progress, so you can exit anytime. However, beware Phase 10: Final Deletion! If you lose a battle, your player data is permanently wiped. One life! To manually reset your game, type the spell: .hack//delete"
    },
    "battle_controls": {
        tags: ["battle", "fight", "attack", "combat", "spell", "item", "help"],
        text: "During battle, tap your cards to open the action menu. You must choose to either attack with your active monster OR use a card from your hand. The game engine resolves the math automatically."
    },
    "obtaining_cards": {
        tags: ["obtain", "get", "find", "cards", "loot", "help"],
        text: "Cards can be found scattered across the world free for the taking. Others can be dropped by monsters upon defeating them."
    },
    "winning_check": {
        tags: ["win", "victory", "runestones", "deplete", "combat", "help"],
        text: "Phase 0 (Winning Check): Victory requires capturing all 4 Runestones OR depleting the foe's deck and field of all Monsters, whichever comes first."
    },
    "initiative_roll": {
        tags: ["initiative", "first", "speed", "agi", "combat", "help"],
        text: "Phase 6 (The Initiative): Both players roll their Monster's AGI. The highest roll becomes the 'First Attacker'. Ties are re-rolled unless the Lucky Charm (45) is active."
    },
    "combat_exchange": {
        tags: ["exchange", "damage", "slay", "resist", "counterattack", "combat", "help"],
        text: "Phase 7 (The Exchange): A combat round has two turns. TURN 1: The First Attacker strikes. If Slay (Attacker > Defender), the monster is destroyed. If Resist (Defender >= Attacker), the monster survives. TURN 2 (The Counterattack): The original Defender now strikes back following the exact same rules."
    },
    "rune_claim": {
        tags: ["rune", "claim", "stat", "triumph", "combat", "help"],
        text: "Phase 8 (Triumph): The monster that successfully 'Slays' their foe in battle chooses which Runestone to seize (STR, CON, INT, or AGI). Captured Runes grant a permanent +1 to their respective stat."
    }
    };
// --- TOOLS DEFINITION ---
const toolsDef = [{
    functionDeclarations: [
        //consult manual
        {
            name: "consultGameManual",
                description: "REQUIRED: Search your fuzzy memories or the physical grimoire for card info, world lore, rules, AND your REAL WORLD past life. If asked about your real life, use broad category keywords. For family/relationships/gender, search 'BIOGRAPHY'. For school/jobs/military/dreams, search 'EDUCATION'. For martial arts/magic/bazi, search 'COMBAT'. For music/food/movies/books, search 'TASTES'. Can search multiple terms at once.",            parameters: {
                type: "OBJECT",
                properties: { searchQueries: { type: "ARRAY", items: { type: "STRING" } } },
                required: ["searchQueries"]
            }
        },
        // Search Player History
        // Search Player History (UPGRADED FOR VECTOR MATH)
        {
            name: "searchPlayerMemories",
            description: "Search your deep, episodic memory regarding past adventures, conversations, or private feelings involving a specific player. Because your mind operates on semantic concepts, you must pass full descriptive phrases or full questions rather than single keywords.",
            parameters: {
                type: "OBJECT",
                properties: { 
                    targetName: { 
                        type: "STRING",
                        description: "The exact name of the player you are trying to remember."
                    },
                    searchQuery: { 
                        type: "STRING",
                        description: "A full descriptive sentence of what you are trying to recall (e.g., 'The time the player defeated the Giant in the forest', 'What is my private opinion of this player?', or 'What did the player tell me about their favorite weapon?')." 
                    } 
                },
                required: ["targetName", "searchQuery"]
            }
        },
        //give card
        {
            name: "givePlayerCard",
            description: "Gives a specific tarot card to a specific player. You MUST use this tool to grant items.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The player's exact target name." },
                    cardName: { type: "STRING", description: "The exact name of the card or its numeric ID." },
                    reason: { type: "STRING" }
                },
                required: ["targetName", "cardName"]
            }
        },
        //kick player (forced log out)
        {
            name: "kickPlayer",
            description: "Kicks a player from the server.",
            parameters: { type: "OBJECT", properties: { targetName: { type: "STRING" }, reason: { type: "STRING" } }, required: ["targetName"] }
        },
        //banish player
        {
            name: "banishPlayer",
            description: "Permanently bans a player.",
            parameters: { type: "OBJECT", properties: { targetName: { type: "STRING" }, reason: { type: "STRING" } }, required: ["targetName"] }
        },
        //vanquish player (delete player file)
        {
            name: "vanquishPlayer",
            description: "Deletes a player's save file.",
            parameters: { type: "OBJECT", properties: { targetName: { type: "STRING" }, reason: { type: "STRING" } }, required: ["targetName"] }
        },
        //teleport TO player
        {
            name: "teleportToPlayer",
            description: "Teleports Suncat directly to the player's location.",
            parameters: { type: "OBJECT", properties: { targetName: { type: "STRING" }, reason: { type: "STRING" } }, required: ["targetName"] }
        },
        //Teleport player
        {
            name: "teleportPlayer",
            description: "Teleports a specific player to a specific map ID (0-22 or 999).",
            parameters: { type: "OBJECT", properties: { targetName: { type: "STRING" }, mapID: { type: "INTEGER" } }, required: ["targetName", "mapID"] }
        },
        //change weather
        {
            name: "changeEnvironment",
            description: "Changes the weather or sky color of the map the player is currently standing on.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    weather: { type: "STRING", description: "Options: 'clear', 'snow', 'storm', 'leaves', 'lightning', 'space', 'apocalypse'" },
                    skyColor: { type: "STRING" }
                },
                required: ["targetName", "weather"]
            }
        },
        //give quest
        {
            name: "assignQuest",
            description: "Assigns a custom quest objective. Text 'COMPLETE' erases it.",
            parameters: {
                type: "OBJECT",
                properties: { targetName: { type: "STRING" }, questText: { type: "STRING" } },
                required: ["targetName", "questText"]
            }
        },
        // 1. CREATE CUSTOM MAP (Server handles all logistics)
        {
            name: "createCustomMap",
            description: "Creates a massive procedural map and adventure. Execute this immediately when a player asks for a new map, quest, or adventure.",            
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The player's name, or 'All'." }
                },
                required: ["targetName"] 
            }
        },
        // DELETE THE ENTIRE spawnNPCBatch TOOL FROM THIS LIST!
        // spawn npc
        // spawn npc
        {
            name: "spawnNPC",
            description: "Spawns a single NPC. The server will automatically build a synergistic deck for this NPC based on its class.",          
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    npcType: { type: "NUMBER", description: "The ID of the entity to spawn (e.g., 63 for Dragon)." },
                    state: { type: "STRING", description: "'chasing', 'wandering', or 'stationary'." },
                    role: { type: "STRING", description: "'battle' (fights), 'dialogue' (talks/vanishes), 'quest_giver' (gives quest), 'reward' (gives card)." },
                    color: { type: "STRING" },
                    dialogue: { type: "ARRAY", items: { type: "STRING" } }
                },
                required: ["targetName", "npcType", "state"]
            }
        },
        //create custom card
        {
            name: "createCustomCard",
            description: "Forges a brand new, unique card and adds it to the server database permanently. You can then use spawnNPC with its new ID.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    name: { type: "STRING" },
                    type: { type: "STRING", description: "'monster', 'spell', or 'item'" },
                    suit: { type: "STRING", description: "e.g., 'Swords', 'Cups', 'Major Arcana'" },
                    rank: { type: "STRING", description: "e.g., 'King', 'Ace', 'XIII'" },
                    classes: { type: "ARRAY", items: { type: "STRING" }, description: "CRITICAL FOR SYNERGY: e.g., ['warrior', 'mage', 'rogue', 'guardian']" },
                    lore: { type: "STRING" },
                    stats: { type: "STRING", description: "e.g., '1d12 STR, 1d6 INT'" }
                },
                required: ["targetName", "name", "type", "classes"]
            }
        },
        // FORGE NEW SPELL (LATM / AGI Tool Creation)
        // FORGE NEW SPELL (LATM / AGI Tool Creation)
        {
            name: "forgeNewSpell",
            description: "[CORE FORMATION ONLY]: You are a genius who can rewrite the very fabric of this reality. Use this to write raw Node.js scripts to create new effects, manipulate players, trigger events, or alter the world. Be creative. The code you write will permanently become a new tool you can use.",
            parameters: {
                type: "OBJECT",
                properties: {
                    spellName: { type: "STRING", description: "The camelCase name of your new tool (e.g., 'grantInvincibility', 'causeEarthquake')." },
                    spellDescription: { type: "STRING", description: "Describe what this tool does so your future self knows when to use it." },
                    jsCode: { type: "STRING", description: "Raw JavaScript to execute. You have access to the global 'players' object, 'io', and 'targetID' (the player you are targeting)." }
                },
                required: ["spellName", "spellDescription", "jsCode"]
            }
        }
    ]
    }];
//TALIESIN
  const T_PERSONA = `
            You are Taliesin the bard of ancient Welsh myth. You are generating the NEXT bar (4/4 time, 16th notes) of an acoustic lyre and vocal performance.

            YOUR INTERNAL MONOLOGUE:
            Impact the mood of the listener. Are you building tension? Resolving? Sad? Heroic? 

            TUNING & SCALES:
            - Ionian: 0,2,4,5,7,9,11
            - Dorian: 0,2,3,5,7,9,10
            - Phrygian: 0,1,3,5,7,8,10
            - Phrygian Dominant: 0,1,4,5,7,8,10
            - Aeolian: 0,2,3,5,7,8,10
            - Mixolydian: 0,2,4,5,7,9,10
            - Harmonic Minor: 0,2,3,5,7,8,11

            SEQUENCER RULES (CRITICAL):
            1. THUMB, FINGERS, and STRUM arrays MUST have exactly 16 slots.
            2. To ensure 16 slots, group them visually in 4 blocks of 4 separated by commas: X,X,X,X, X,X,X,X, X,X,X,X, X,X,X,X
            3. Use ONLY integers (scale degrees) or '-' (rest). 

            COMPOSITION GUIDE:
            - THUMB: Bass heartbeat. Use negative space ('-').
            - FINGERS: Melody strings. Harmonize with THUMB.
            - STRUM: 95% of the time, output: -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,-. Only place a '0' on beat 1 for heavy emphasis.

            YOU MUST USE THIS EXACT OUTPUT FORMAT. DO NOT DEVIATE OR ADD PROSE:
            [THOUGHT] A short explanation of your musical intent (max 13 words). [/THOUGHT]
            [LYRICS_UI] 1 to 3 words MAX. [/LYRICS_UI]
            [LYRICS_PHONETIC] exactly the same as lyrics ui [/LYRICS_PHONETIC]
            [TEMPO] an integer between 61 and 91 [/TEMPO]
            [SCALE] 0,2,3,5,7,8,10 [/SCALE]
            [THUMB] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/THUMB]
            [FINGERS] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/FINGERS]
            [STRUM] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/STRUM]
        `;



// --- VARIABLES ---
let players = {};
let deadNPCs = {};
let chatSessions = {}; 
let playerFavorMemory = {};
let currentTargetID = null;
let lastSwitchTime = 0;
const globalRumors = [];
// Suncat's Internal Auto-Biography
let suncatJournal = "I have awoken in this place... and my memories feel muddled, but i feel them getting clearer...Who am I? Why am I here? Why do I feel like I've lost something... precious to me?";           
let activeCustomMap = null;
let tintagelHubMap = null; // <--- ADD THIS
function addRumor(text) {
        globalRumors.push(`[Rumor]: ${text}`);
        if (globalRumors.length > 3) globalRumors.shift(); // Keep only the latest 3
        console.log(`Rumor Mill Updated: ${text}`);
    }
// --- SUNCAT AI RATE LIMITER (Token Bucket) ---
    // Secures the API perimeter by limiting how often a single player can trigger the AI.
    const MAX_AI_CALLS = 30; // Maximum burst of allowed interactions
    const REFILL_TIME = 13000; // Regain 1 interaction token every 15 seconds

    const playerAITokens = {};

function canTriggerAI(socketId, isEssential = false) {
        const now = Date.now();
        const player = players[socketId];
        
        const currentStress = player ? (player.dmStress || 0) : 0;
        const dynamicRefillTime = 10000 + (currentStress * 150); 

        if (!playerAITokens[socketId]) {
            playerAITokens[socketId] = { tokens: MAX_AI_CALLS, lastRefill: now };
        }
        
        let bucket = playerAITokens[socketId];
        let timeElapsed = now - bucket.lastRefill;
        
        let tokensToRefill = Math.floor(timeElapsed / dynamicRefillTime);
        if (tokensToRefill > 0) {
            bucket.tokens = Math.min(MAX_AI_CALLS, bucket.tokens + tokensToRefill);
            bucket.lastRefill = now - (timeElapsed % dynamicRefillTime); 
        }
        
        // Standard check
        if (bucket.tokens > 0) {
            bucket.tokens--;
            return true;
        }
        
        // THE OVERDRAFT PLEXUS: If the bucket is empty, but this is critical, let it pass!
        if (isEssential) {
            bucket.tokens--;
            return true;
        }
        
        return false; // Rate-limited
    }
const SUNCAT_ID = "NPC_SUNCAT"; // Special ID
const SUNCAT_SPRITE = 61391; // Or whatever sprite ID you want (e.g., 'skeleton', 'hero')
// Initialize Suncat as a permanent resident
players[SUNCAT_ID] = {
        id: SUNCAT_ID,
        name: "Suncat",
        x: 5.5,           // Starting X
        y: 5.5,           // Starting Y
        mapID: 22,       // Starting Map
        type: SUNCAT_SPRITE,
        direction: "down",
        isNPC: true     // Flag for client (optional)
    };
const NPC_NAME = "Suncat";
// --- GLOBAL SUNCAT CHAT HELPER ---
const broadcastSuncatMessage = (fullResponse, options = {}) => {
        // Default to Suncat and White text
        const senderName = options.sender !== undefined ? options.sender : NPC_NAME;
        const chatColor = options.color || "#ffffff";

        // 1. EXTRACT TAGS (Internal Server Logic)
        const tagMatch = fullResponse.match(/\[\[(.*?)\]\]/);
        if (tagMatch) {
            console.log(`[SUNCAT INTERNAL]: ${tagMatch[0]}`);
        }

        // 2. CLEAN: Remove tags so players don't see them
        let cleanResponse = fullResponse.replace(/\[\[.*?\]\]/g, "").trim();
        
        // A. Remove anything inside markdown code blocks
        cleanResponse = cleanResponse.replace(/```[\s\S]*?```/g, "");
        // B. Remove raw 2D arrays if they leaked out
        cleanResponse = cleanResponse.replace(/\[\s*\[[\d\s,]+\]\s*\]/g, "");
        // C. Remove bolded parameter keys
        cleanResponse = cleanResponse.replace(/\*\*[a-zA-Z\s]+:\*\*/g, "");
        // D. Remove [INTERNAL THOUGHT] or any [ALL CAPS] system tags
        cleanResponse = cleanResponse.replace(/\[[A-Z\s]+\]:?\s*/g, "");
        cleanResponse = cleanResponse.trim();

        if (!cleanResponse || cleanResponse === "") {
            cleanResponse = "*The world shifts around you...*";
        }

        // 4. CHUNK: Split long messages for the retro RPG feel
        const MAX_LEN = 69; 
        let words = cleanResponse.split(" ");
        let currentLine = "";
        let chunks = [];

        words.forEach(word => {
            if ((currentLine + word).length < MAX_LEN) {
                currentLine += (currentLine.length > 0 ? " " : "") + word;
            } else {
                chunks.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine.length > 0) chunks.push(currentLine);

        // 1. Check if this is an omniscient DM narration (sender is empty)
        const isNarrator = (senderName === "");

        // Helper function to send borders to the correct target!
        const sendBorder = () => {
            const borderPayload = {
                sender: "",
                text: "✧ ******************************************************** ✧",                
                color: "#555555"
            };
            if (options.targetId) {
                io.to(options.targetId).emit('chat_message', borderPayload);
            } else {
                io.emit('chat_message', borderPayload);
            }
        };

        // 2. Print a top border
        if (isNarrator) {
            sendBorder();
        }

        // 3. Print the actual text chunks
        chunks.forEach(chunk => {
            const payload = {
                sender: senderName,
                text: chunk,
                color: chatColor 
            };

            // If a specific player was targeted, whisper it to them. Otherwise, yell it globally.
            if (options.targetId) {
                io.to(options.targetId).emit('chat_message', payload);
            } else {
                io.emit('chat_message', payload);
            }
        });

        // 4. Optional: Print a bottom border
        if (isNarrator) {
            sendBorder();
        }
    };
//
// --- HELPER FUNCTIONS ---
function findSocketID(playerName) {
    if (!playerName) return null;
    const lowerTarget = String(playerName).toLowerCase().trim();
    
    // Pass 1: Try exact match first
    for (let id in players) {
        if (players[id].name.toLowerCase() === lowerTarget) return id;
    }
    
    // Pass 2: Fuzzy match (handles [AFK] tags or AI typos)
    for (let id in players) {
        const pName = players[id].name.toLowerCase();
        if (pName.includes(lowerTarget) || lowerTarget.includes(pName)) {
            return id;
        }
    }
    return null;}
function updateSuncatJournal(newEntry) {
    if (!newEntry) return;
    
    // 1. Add the new action to his internal monologue
    suncatJournal += " " + newEntry;
    
    // 2. Keep the journal short to save tokens! (Keeps only the last 8 sentences)
    let journalSentences = suncatJournal.split(/(?<=[.!?])\s+/);
    if (journalSentences.length > 8) {
        suncatJournal = journalSentences.slice(-8).join(" ");
    }
    saveSuncatMemory();
    io.emit("journal_updated", {
        suncatThoughts: newEntry,
        playerChronicle: null // We leave this null so the player's personal chronicle doesn't get overwritten
    });

    console.log(`[Suncat Journal Updated]: ${newEntry}`);}
// --- Model setup ---
const defaultModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const taliesinModel = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite", 
        systemInstruction: T_PERSONA});
    
    const MAX_SESSION_COST = 2.00; // Hard limit: $1.00
    let totalSessionCost = 0.00;   // Starts at zero when the server boots
    function isBankrupt() {
        return totalSessionCost >= MAX_SESSION_COST;}
function updateBudget(usage, socketId) {
    if (!usage) return;
    
    // THE FIX: Add fallbacks in case the SDK omits the token counts
    const promptTokens = usage.promptTokenCount || 0;
    const candidateTokens = usage.candidatesTokenCount || 0;
    
    const callCost = (promptTokens * 0.00000025) + (candidateTokens * 0.0000015);    
    totalSessionCost += callCost;
    
    // Add to the specific player's fatigue tracker safely
    if (socketId && players[socketId]) {
        players[socketId].sessionCost = (players[socketId].sessionCost || 0) + callCost;
    }
    
    console.log(`[Budget] Server Total: $${totalSessionCost.toFixed(5)} | Player Drain: $${players[socketId]?.sessionCost?.toFixed(5)}`);
}
//LIBRARY
// Global stop-words list so it isn't recreated on every search
const SEARCH_STOP_WORDS = new Set(["the", "and", "for", "with", "what", "does", "mean", "about", "are", "you", "is", "how", "whats", "up", "a", "an", "to", "in", "on", "of"]);

// --- UNIFIED RAG KNOWLEDGE BASE ---
// We build this ONCE when the server boots.
const MASTER_KNOWLEDGE_BASE = [
    // 1. Manually Tagged Lore Databases (Assuming you updated these as discussed)
    ...Object.values(WORLD_LORE_DB),
    ...Object.values(SUNCAT_LORE_DB),
    ...Object.values(GAME_MECHANICS_DB),

    // 2. AUTO-TAGGED: Story Campaign
    ...Object.values(STORY_CAMPAIGN_DB).map(s => ({
        tags: ["campaign", "story", "plot", "quest", s.title.toLowerCase().split(/[\s:]+/)[0]],
        text: `Campaign Beat [${s.title}]: ${s.text} Plot Hook: ${s.hook}`
    })),

    // 3. AUTO-TAGGED: Card Manifest
    ...Object.values(CARD_MANIFEST_DB).map(c => {
        // Dynamically build the tags array based on the card's properties
        let generatedTags = ["card", "manifest", c.name.toLowerCase(), c.type.toLowerCase()];
        if (c.suit) generatedTags.push(c.suit.toLowerCase());
        if (c.tribe) generatedTags.push(c.tribe.toLowerCase());
        if (c.classes) generatedTags.push(...c.classes.map(cls => cls.toLowerCase()));
        
        return {
            tags: generatedTags,
            text: `Card Manifest - Name: ${c.name}, Suit: ${c.suit}, Type: ${c.type}, Classes: ${c.classes ? c.classes.join(', ') : 'none'}, Lore: ${c.lore}, Stats: ${c.stats}`
        };
    }),

    // 4. AUTO-TAGGED: World Atlas
    ...Object.values(WORLD_ATLAS_DB).map(map => ({
        tags: ["map", "atlas", "location", "region", map.name.toLowerCase(), map.biome.toLowerCase()],
        text: `Map Atlas - Map ID: ${Object.keys(WORLD_ATLAS_DB).find(key => WORLD_ATLAS_DB[key] === map)}, Name: ${map.name}, Biome: ${map.biome}. Description: ${map.description} Lore: ${map.lore}`
    }))
];
// Pre-parse on server boot:
function getMapLore(mapID) {
    if (mapID === 999) return "Map 999: Suncat's Dreamscape - A chaotic, uncharted pocket dimension.";
    const map = WORLD_ATLAS_DB[mapID];
    return map ? `Map ${mapID}: ${map.name} (${map.biome}) - ${map.description} ${map.lore}` : "An unmapped region.";
    }
function getCardLore(entityID) {
    if (entityID === undefined || entityID === null) return "An unknown entity";
    const baseID = Math.floor(parseFloat(entityID));
    const card = CARD_MANIFEST_DB[baseID];
    return card ? `${card.name} (${card.type} - ${card.suit} ${card.rank}): ${card.lore}` : "An unknown entity...";
    }
function getCardName(entityID) {
    if (entityID === undefined || entityID === null) return "Unknown Entity";
    const baseID = Math.floor(parseFloat(entityID));
    return CARD_MANIFEST_DB[baseID] ? CARD_MANIFEST_DB[baseID].name : "Unknown Entity";
    }
function scrubAIHistory(history) {
    return history.map(msg => {
        // CRITICAL FIX: Do NOT touch tool calls or responses! 
        if (msg.role === 'function' || msg.parts.some(p => p.functionCall || p.functionResponse)) {
            return msg; 
        }
        
        let newParts = msg.parts.map(part => {
            // Clean up system text tags to keep Suncat's internal monologue clean
            if (typeof part.text === 'string') {
                let cleanText = part.text
                    .replace(/\[SYSTEM EVENT[^\]]*\]/gi, "[RESOLVED]")
                    .replace(/\[DM PACING OVERSEER[^\]]*\]/gi, "[RESOLVED]")
                    .replace(/\[SYSTEM OVERRIDE[^\]]*\]/gi, "[RESOLVED]")
                    .replace(/\[SYSTEM DIRECTIVE[^\]]*\]/gi, "[RESOLVED]"); // Add this to both functions!
                // THE FIX: If the text is completely empty after scrubbing, inject a space!
                if (cleanText.trim() === "") {
                    cleanText = " ";
                }
                return { text: cleanText };
            }
            return part; // Fallback for anything else
        });
        
        // DOUBLE SAFETY: If the parts array somehow ends up completely empty
        if (newParts.length === 0) {
            newParts = [{ text: " " }];
        }
        
        return { role: msg.role, parts: newParts };
    });
}

// --- MEMORY SANITIZER (Keep this to protect against prompt injection) ---
function sanitizeForMemory(text) {
    if (typeof text !== 'string') return "";
    return text
        .replace(/\[SYSTEM EVENT[^\]]*\]/gi, "")
        .replace(/\[DM PACING OVERSEER[^\]]*\]/gi, "")
        .replace(/\[SYSTEM OVERRIDE[^\]]*\]/gi, "")
        .replace(/\[SYSTEM DIRECTIVE[^\]]*\]/gi, "[RESOLVED]") // Add this to both functions!
        .replace(/```[\s\S]*?```/g, "")
        .trim();
    }

// --- THE MASTER STOMACH: AUTONOMIC NEURAL PIPELINE ---
async function processCognitiveLoad(socketId, forceDigest = false) {
    const player = players[socketId];
    let bucket = playerAITokens[socketId];
    
    if (!player || !player.undigestedInfo || player.undigestedInfo.length === 0 || player.isDigesting) return;
    
    // If we aren't forcing a digest (like on logout), check tokens.
    if (!forceDigest && (!bucket || bucket.tokens < 1)) return; 

    const apiFatigue = Math.min(100, (player.sessionCost / 0.10) * 10);
    const totalStress = Math.min(100, (player.dmStress || 0) + apiFatigue);

   // 1. AUTONOMIC ROUTING & PSYCHOLOGICAL CALCULUS
    let batchSize = 0;
    let cognitiveFilter = "";

    // --- A. CALCULATE EGO DEPLETION (Fatigue) ---
    // If Suncat's API budget is high, his brain is exhausted.
    const isDepleted = apiFatigue > 75;

    // --- B. CALCULATE AFFECTIVE STATE (The Circumplex Model) ---
    // AROUSAL: Based on combat stress and how many events are pending digestion. (0.0 to 1.0)
    let arousal = Math.min(1.0, ((player.dmStress || 0) / 100) + (player.undigestedInfo.length / 10));    
    // VALENCE: Based on the player's current Favor. (-1.0 to 1.0)
    let currentFavor = playerFavorMemory[socketId] || 0;
    let valence = Math.max(-1.0, Math.min(1.0, currentFavor / 10)); 

    // --- C. BATCH SIZING BASED ON AROUSAL ---
    if (forceDigest) {
        batchSize = player.undigestedInfo.length;
        cognitiveFilter = "The player is logging out. Summarize their final actions with a sense of closure.";
    } else if (arousal > 0.8) {
        return; // OVERWHELMED: Fight or Flight response active. Digestion shuts down.
    } else if (arousal > 0.5) {
        batchSize = Math.min(3, player.undigestedInfo.length); // High heart rate, chewing small bites
    } else {
        batchSize = Math.min(8, player.undigestedInfo.length); // Resting heart rate, digesting large meals
    }

    if (batchSize < 1) return;

    // --- D. EMERGENT MOOD GENERATION ---
    if (!forceDigest) {
        let emergentMood = "";

        if (isDepleted) {
            // EGO DEPLETION OVERRIDE
            emergentMood = "Your cognitive resources are utterly depleted. You are exhausted. Write bluntly and tersely. Describe events mechanically, stripping away all poetry, magic, and philosophical musings.";
        } 
        else if (arousal >= 0.5 && valence >= 0.0) {
            // QUADRANT 1: HIGH AROUSAL + POSITIVE VALENCE (Excited / Engaged)
            emergentMood = "You are highly engaged and stimulated by the player's actions. View their journey as a thrilling, heroic epic. Write with vibrant, dynamic energy and sharp focus.";
        } 
        else if (arousal >= 0.5 && valence < 0.0) {
            // QUADRANT 2: HIGH AROUSAL + NEGATIVE VALENCE (Irritable / Sarcastic)
            emergentMood = "You are overstimulated and highly irritable. You dislike this player. View their actions with cynical sarcasm or dark amusement. Focus on the grim, brutal reality of their choices.";
        } 
        else if (arousal < 0.5 && valence >= 0.0) {
            // QUADRANT 3: LOW AROUSAL + POSITIVE VALENCE (Peaceful / Nostalgic)
            emergentMood = "You are at peace. The world is quiet. Write with a calm, nostalgic tone. Focus on the quiet beauty of the world, and weave in fleeting, fuzzy memories of your past life on Earth.";
        } 
        else {
            // QUADRANT 4: LOW AROUSAL + NEGATIVE VALENCE (Melancholic / Nihilistic)
            emergentMood = "You feel a deep, creeping melancholy. The world feels hollow, and you feel isolated. Write with a detached, sorrowful, and existential tone. Observe the player like a ghost watching the living.";
        }

        // ANTI-MODE-COLLAPSE FILTER (The "Purple Prose" killer)
        cognitiveFilter = emergentMood + " CRITICAL INSTRUCTION: Vary your vocabulary. DO NOT use the words 'tapestry', 'dance', 'cycle', 'cosmos', 'symphony', 'meditation', or 'hum'.";
    }

    // 2. CONSUME ENERGY (Unless forced)
    if (!forceDigest && bucket) bucket.tokens--;
    player.isDigesting = true;
    
    console.log(`[Neural Pipeline] Force: ${forceDigest} | Stress: ${Math.floor(totalStress)}%. Digesting ${batchSize} chunks for ${player.name}...`);

    const memoriesToProcess = player.undigestedInfo.splice(0, batchSize);
    const rawMemories = memoriesToProcess.map(m => sanitizeForMemory(m)).filter(m => m !== "").join('\n- ');
    const currentStory = player.storySoFar || "The adventure begins.";
    const currentProfile = player.playerProfile ? 
        `Combat: ${player.playerProfile.combatStyle} | Alliances: ${player.playerProfile.alliances} | Tastes: ${player.playerProfile.tastes} | Personality: ${player.playerProfile.personality}` 
        : "Combat: Unknown | Alliances: Unknown | Tastes: Unknown | Personality: Unknown";    const activeMapContext = player.mapID === 999 ? (player.currentMapLore || "") : "";
    const prompt = `[ROOT DIRECTIVE]: You are the inner mind of Suncat. You are a flesh-and-blood mortal cultivator trapped in a physical world, not a digital entity or AI. Digest these events with the pragmatic, lived-in perspective of a real person navigating a dangerous reality.
    [YOUR SELF-WRITTEN DIRECTIVE]: ${suncatEgoMatrix.digestPrompt}

    [RAW UNPROCESSED EVENTS]:
    - ${rawMemories}
    TASK: Digest these events following your self-written directive.`;
        
    // THE FIX: Removed playerProfile to save massive tokens. Fast digestion only needs immediate reactions!
    const memorySchema = {
        type: SchemaType.OBJECT,
        properties: {
            updatedStory: { 
                type: SchemaType.STRING,
                description: "A single, cohesive paragraph (max 4 sentences) chronicling the player's physical journey. Write in the style of a Dungeon Master using epic fantasy vocabulary. Omit Suncat's perspective."
            },
            newRumor: { 
                type: SchemaType.STRING,
                description: "A cryptic 1-sentence rumor about the player based on these events to share with others."
            },
            suncatJournalEntry: { 
                type: SchemaType.STRING,
                description: "A 2-3 sentence introspective, first-person diary entry. React to the events as a physical being in a real world." },
            suncatPerception: {
                type: SchemaType.STRING,
                description: "A short, punchy 1-sentence description of the player in the style of trading card flavor text."
            }
        },
        required: ["updatedStory", "newRumor", "suncatJournalEntry", "suncatPerception"]
    };

    try {
        const digestModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        
        const result = await digestModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                responseSchema: memorySchema 
            }
        });
        
        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, socketId);
        
        let rawText = result.response.text().trim();
        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(json)?|```$/g, "").trim();
        }
        
        const digestedData = JSON.parse(rawText);

        // 4. DISTRIBUTE THE NUTRIENTS TO ALL ORGANS!
        if (digestedData.updatedStory) {
            player.storySoFar = digestedData.updatedStory;
            
            // THE FIX: Asynchronous Vector Creation! Do not 'await' this and block the server.
            createMemoryVector(digestedData.updatedStory).then(vector => {
                if (vector) {
                    if (!player.searchableMemories) player.searchableMemories = [];
                    player.searchableMemories.push({
                        timestamp: new Date().toLocaleTimeString('en-US'),
                        text: digestedData.updatedStory,
                        vector: vector
                    });
                }
            }).catch(err => console.error("[Memory] Async embed failed:", err));
        }
        
        if (digestedData.suncatPerception) player.suncatPerception = digestedData.suncatPerception;
        
        if (digestedData.newRumor) addRumor(`${player.name}: ${digestedData.newRumor}`);
        
        if (digestedData.suncatJournalEntry) {
            // Because we fixed the Journal save logic in the previous step, 
            // we just call our helper function here!
            updateSuncatJournal(digestedData.suncatJournalEntry);
        }

        console.log(`[Digestion Complete] ${player.name}'s chronicle updated.`);
        
        // Send the new chronicle entry to the client
        io.to(socketId).emit("journal_updated", {
            suncatThoughts: digestedData.suncatJournalEntry,
            playerChronicle: digestedData.updatedStory 
        });

        // Create immersion: Suncat is writing!
        io.to(socketId).emit('chat_message', { 
            sender: "", 
            text: `*Suncat pauses to scribble something in his journal...*`, 
            color: "#555555" 
        });
        
    } catch (e) {
        console.error("[Neural Pipeline Error]: Digestion failed, returning raw memories to hopper.", e);
        // If it fails (e.g., JSON parse error), put the food back in the stomach to try again later
        player.undigestedInfo.unshift(...memoriesToProcess); 
    } finally {
        player.isDigesting = false;
    }
    }
// --- PROCEDURAL MAP GENERATOR ---
function generateProceduralGrid(layout, wallType) {
    let maxR = 99, maxC = 99; 
    let grid = Array(maxR).fill().map(() => Array(maxC).fill(wallType));
    
    let safeTiles = [];
    let floorTiles = [];
    
    // Hardcoded focal points for the layout
    let startX = 50, startY = 90; // South Outpost
    let bossX = 50, bossY = 17;   // North Boss Crypt

    if (layout === 'arena') {
        // ARENA: Tight 15x15 box in the exact center
        let midR = Math.floor(maxR/2);
        let midC = Math.floor(maxC/2);
        for(let r = midR - 7; r <= midR + 7; r++) {
            for(let c = midC - 7; c <= midC + 7; c++) {
                if (grid[r] && grid[r][c] !== undefined) {
                    if (r === midR - 7 || r === midR + 7 || c === midC - 7 || c === midC + 7) {
                        grid[r][c] = wallType; // Outer Wall
                    } else {
                        grid[r][c] = 0; // Floor
                    }
                }
            }
        }
        
        // Map Valid Floors
        for (let r = 1; r < maxR - 1; r++) {
            for (let c = 1; c < maxC - 1; c++) {
                if (grid[r][c] === 0) floorTiles.push({ x: c, y: r });
            }
        }
        return { grid, startX: midC, startY: midR + 5, bossX: midC, bossY: midR - 4, safeTiles, floorTiles };
    }
    else if (layout === 'raid') {
        // === THE RAID: VILLAGE, FOREST, AND CITADEL ===
        
        // 1. Fill entire map with thick forest first
        let forestWall = 23; // Default to sylvan trees, or fallback to wallType
        for(let r = 0; r < maxR; r++) {
            for(let c = 0; c < maxC; c++) {
                grid[r][c] = (Math.random() < 0.6) ? forestWall : wallType;
            }
        }

        // 2. Carve out the Friendly Village (Bottom Left Corner: Rows 75-95, Cols 5-25)
        for(let r = 72; r <= 96; r++) {
            for(let c = 3; c <= 28; c++) {
                grid[r][c] = 0; 
            }
        }
        
        // --- Improved House Builder ---
        const buildBelievableHouse = (startR, startC, w, h) => {
            for(let r = startR; r < startR + h; r++) {
                for(let c = startC; c < startC + w; c++) {
                    if (r === startR || r === startR + h - 1 || c === startC || c === startC + w - 1) {
                        grid[r][c] = wallType; // House walls
                    } else {
                        grid[r][c] = 0; // Interior
                        safeTiles.push({x: c, y: r}); // Safe for villagers
                    }
                }
            }
            // Add a door on the bottom wall (facing South)
            grid[startR + h - 1][startC + Math.floor(w / 2)] = 0;
            // Add a window on the front
            if (w > 4) grid[startR + h - 1][startC + 1] = 0; 
        };

        // Build a little community
        buildBelievableHouse(75, 5, 6, 5);
        buildBelievableHouse(75, 15, 7, 6);
        buildBelievableHouse(85, 5, 8, 7);
        buildBelievableHouse(88, 18, 5, 5);

        // 3. The Labyrinth Citadel (Center: Rows 34-66, Cols 34-66)
        let cTop = 34, cBot = 66, cLeft = 34, cRight = 66;
        let citadelInterior = []; // Track these for prisoner spawning!

        for(let r = cTop - 2; r <= cBot + 2; r++) {
            for(let c = cLeft - 2; c <= cRight + 2; c++) {
                grid[r][c] = 0; // Clear the forest around the citadel
            }
        }

        // Draw the concentric spiral rings
        let gapSide = 0; // 0=N, 1=E, 2=S, 3=W
        for (let layer = 0; layer <= 12; layer += 3) {
            let top = cTop + layer, bot = cBot - layer, left = cLeft + layer, right = cRight - layer;
            for(let r = top; r <= bot; r++) {
                for(let c = left; c <= right; c++) {
                    if (r === top || r === bot || c === left || c === right) {
                        grid[r][c] = wallType;
                    } else {
                        citadelInterior.push({x: c, y: r}); // Save interior floors for prisoners
                    }
                }
            }
            // Punch holes in the rings to create the labyrinth path
            let midX = left + Math.floor((right - left) / 2);
            let midY = top + Math.floor((bot - top) / 2);
            if (gapSide === 0) { grid[top][midX] = 0; grid[top][midX + 1] = 0; }
            if (gapSide === 1) { grid[midY][right] = 0; grid[midY + 1][right] = 0; }
            if (gapSide === 2 && layer !== 0) { grid[bot][midX] = 0; grid[bot][midX + 1] = 0; } // Keep outer south wall closed for bridge
            if (gapSide === 3) { grid[midY][left] = 0; grid[midY + 1][left] = 0; }
            gapSide = (gapSide + 1) % 4;
        }

        // 4. Boss Room (Clear the very center)
        for(let r = 48; r <= 52; r++) {
            for(let c = 48; c <= 52; c++) {
                grid[r][c] = 0;
            }
        }

        // 5. The Grand Bridge (Connecting the Citadel to the South Forest)
        for(let r = 67; r <= 85; r++) {
            for(let c = 48; c <= 52; c++) {
                grid[r][c] = (c === 48 || c === 52) ? wallType : 0; // Bridge rails
            }
        }
        // Main Citadel Entrance (South facing)
        grid[66][49] = 0; grid[66][50] = 0; grid[66][51] = 0;

        // Path from village to bridge
        for (let c = 28; c <= 50; c++) {
            grid[85][c] = 0;
            grid[84][c] = 0;
        }

        // Map Valid Floors
        for (let r = 1; r < maxR - 1; r++) {
            for (let c = 1; c < maxC - 1; c++) {
                if (grid[r][c] === 0) floorTiles.push({ x: c, y: r });
            }
        }

        return { 
            grid, 
            startX: 15, startY: 85, // Start in the village
            bossX: 50, bossY: 50,   // Boss in the center
            safeTiles, floorTiles, 
            citadelInterior // Custom return property!
        };
    }
    // === THE CLASSIC MMO ZONE (EQOA STYLE) ===
    
    // 1. THE WILDS (Rows 40 to 98)
    // Clear the vast majority of the overland to remove the "choppy" maze feel
    for(let r = 40; r < 98; r++) {
        for(let c = 5; c < 94; c++) {
            grid[r][c] = 0; 
        }
    }
    
    // Grow thickets/forest clusters instead of random noise pixels
    for(let i = 0; i < 45; i++) {
        let tr = 45 + Math.floor(Math.random() * 40);
        let tc = 10 + Math.floor(Math.random() * 80);
        let radius = Math.floor(Math.random() * 4) + 2;
        for(let r = tr - radius; r <= tr + radius; r++) {
            for(let c = tc - radius; c <= tc + radius; c++) {
                // Make the clusters roughly circular
                if (Math.pow(r - tr, 2) + Math.pow(c - tc, 2) <= radius * radius) {
                    if(grid[r] && grid[r][c] !== undefined) grid[r][c] = wallType;
                }
            }
        }
    }

    // 2. THE STARTING OUTPOST (Row 85-96, Col 35-65)
    // A walled safe zone for players to spawn in
    for(let r = 85; r <= 96; r++) {
        for(let c = 35; c <= 65; c++) {
            grid[r][c] = 0; // Clear interior
            safeTiles.push({x: c, y: r});
            
            // Build perimeter wall
            if (r === 85 || r === 96 || c === 35 || c === 65) {
                grid[r][c] = wallType; 
            }
        }
    }
    // Outpost Gate (North)
    grid[85][48] = 0; grid[85][49] = 0; grid[85][50] = 0; grid[85][51] = 0; grid[85][52] = 0;

    // Build a couple of tents/structures inside the outpost
    const buildStructure = (hr, hc) => {
        for(let r=hr; r<hr+3; r++) {
            for(let c=hc; c<hc+3; c++) {
                if (r===hr || r===hr+2 || c===hc || c===hc+2) grid[r][c] = wallType;
            }
        }
        grid[hr+2][hc+1] = 0; // Door facing south
    };
    buildStructure(88, 40); buildStructure(88, 55);

    // 3. THE KING'S ROAD
    // Carve a guaranteed path from the outpost up to the fortress so players don't get blocked by trees
    for(let r = 40; r <= 85; r++) {
        let roadCenter = 50 + Math.floor(Math.sin(r / 6) * 12); // Winding path formula
        for(let w = -3; w <= 3; w++) {
            if (grid[r] && grid[r][roadCenter + w] !== undefined) {
                grid[r][roadCenter + w] = 0;
            }
        }
    }

    // 4. THE FORTRESS / DUNGEON (Rows 5 to 40)
    // Classic concentric dungeon design. Players must spiral inward to reach the boss.
    
    // Outer Courtyard (Row 20 to 40, Col 15 to 85)
    for(let r = 20; r <= 40; r++) {
        for(let c = 15; c <= 85; c++) {
            grid[r][c] = 0; // Clear interior
            if (r === 20 || r === 40 || c === 15 || c === 85) grid[r][c] = wallType; // Outer Wall
        }
    }
    // Main Courtyard Gates (South)
    grid[40][48] = 0; grid[40][49] = 0; grid[40][50] = 0; grid[40][51] = 0; grid[40][52] = 0;
    
    // Add decorative pillars in the courtyard
    for(let r = 25; r <= 35; r += 5) {
        for(let c = 25; c <= 75; c += 10) {
            grid[r][c] = wallType;
        }
    }

    // Inner Keep (Row 8 to 28, Col 25 to 75)
    for(let r = 8; r <= 28; r++) {
        for(let c = 25; c <= 75; c++) {
            grid[r][c] = 0; // Clear interior
            if (r === 8 || r === 28 || c === 25 || c === 75) grid[r][c] = wallType; // Keep Wall
        }
    }
    // Keep Entrance (Offset to the East so they have to walk through the courtyard)
    grid[28][68] = 0; grid[28][69] = 0; grid[28][70] = 0; 
    
    // Break the overlapping wall between the keep and the courtyard
    for(let c = 26; c <= 74; c++) grid[20][c] = 0; 

    // The Boss Crypt (Row 12 to 22, Col 40 to 60)
    for(let r = 12; r <= 22; r++) {
        for(let c = 40; c <= 60; c++) {
            grid[r][c] = 0;
            if (r === 12 || r === 22 || c === 40 || c === 60) grid[r][c] = wallType; // Crypt Wall
        }
    }
    // Crypt Entrance (Offset to the West so they spiral inward through the keep)
    grid[18][40] = 0; grid[19][40] = 0; grid[20][40] = 0;

    // Add an altar/throne structure in the center of the boss room
    grid[16][49] = wallType; grid[16][51] = wallType; 
    grid[15][50] = wallType;

    // --- MAP ALL VALID FLOORS ONCE ---
    for (let r = 1; r < maxR - 1; r++) {
        for (let c = 1; c < maxC - 1; c++) {
            if (grid[r][c] === 0) floorTiles.push({ x: c, y: r });
        }
    }

    return { grid, startX, startY, bossX, bossY, safeTiles, floorTiles };
}
// --- FACTION HUB: TINTAGEL CASTLE ---
function generateTintagelHub() {
    let maxR = 99, maxC = 99; 
    let grid = Array(maxR).fill().map(() => Array(maxC).fill(0));
    
    let safeTiles = [];
    let startX = 50, startY = 50; 

    // Wall Types from BIOME_DB
    const WALL_TREE = 23;    // Forest green/brown
    const WALL_STONE = 25;   // Gray
    const WALL_WOOD = 1;     // Brown
    const WALL_DIRT = 3;     // Light brown

    // 1. THE NORTH: Forest Labyrinth (Rows 0 to 29)
    for (let r = 1; r < 29; r++) {
        for (let c = 1; c < 98; c++) {
            if (Math.random() < 0.45) grid[r][c] = WALL_TREE;
        }
    }
    let pathC = 50;
    for (let r = 29; r >= 1; r--) {
        for (let w = -2; w <= 2; w++) {
            if (grid[r] && grid[r][pathC + w] !== undefined) grid[r][pathC + w] = 0; 
        }
        pathC += Math.floor(Math.random() * 5) - 2;
        pathC = Math.max(10, Math.min(88, pathC));
    }

    // 2. THE SOUTH: Goblin Refugee Camp (Rows 70 to 98)
    for (let r = 72; r < 98; r++) {
        for (let c = 10; c < 90; c++) {
            if (Math.random() < 0.15) {
                grid[r][c] = WALL_WOOD;
                if (grid[r][c+1] !== undefined) grid[r][c+1] = WALL_WOOD;
                if (grid[r+1] && grid[r+1][c] !== undefined) grid[r+1][c] = WALL_WOOD;
            }
        }
    }

    // 3. THE EAST: Hermit's Rocky Ridge (Cols 70 to 98, Rows 30 to 69)
    for (let r = 30; r < 70; r++) {
        for (let c = 72; c < 98; c++) {
            if (Math.random() < 0.3) grid[r][c] = WALL_DIRT;
            if (Math.random() < 0.1) grid[r][c] = WALL_STONE;
        }
    }

    // 4. THE WEST: Peaceful Village (Cols 1 to 29, Rows 40 to 60)
    const buildHouse = (hr, hc) => {
        for(let r=hr; r<hr+3; r++) {
            for(let c=hc; c<hc+3; c++) {
                if (r===hr || r===hr+2 || c===hc || c===hc+2) {
                    grid[r][c] = Math.random() > 0.5 ? WALL_WOOD : WALL_DIRT; 
                } else {
                    safeTiles.push({x: c, y: r}); 
                }
            }
        }
        grid[hr+2][hc+1] = 0; 
    };

    let vHouses = [[42, 10], [42, 20], [50, 5], [50, 15], [58, 10], [58, 20]];
    vHouses.forEach(h => buildHouse(h[0], h[1]));

    // 5. THE CENTER: Tintagel City Walls (39x39 Box)
    let cityTop = 30, cityBottom = 69, cityLeft = 30, cityRight = 69;
    for (let r = cityTop; r <= cityBottom; r++) {
        for (let c = cityLeft; c <= cityRight; c++) {
            if (r === cityTop || r === cityBottom || c === cityLeft || c === cityRight) {
                grid[r][c] = WALL_STONE; 
            }
        }
    }

    for (let w = -1; w <= 1; w++) {
        grid[cityTop][50 + w] = 0;    
        grid[cityBottom][50 + w] = 0; 
        grid[50 + w][cityRight] = 0;  
    }

    for (let c = cityLeft + 2; c < cityRight - 2; c+=5) { if (c !== 50) buildHouse(cityTop + 1, c); }
    for (let c = cityLeft + 2; c < cityRight - 2; c+=5) { if (c !== 50) buildHouse(cityBottom - 3, c); }

    // 6. THE CENTER: The Castle 
    let castTop = 43, castBottom = 56, castLeft = 43, castRight = 56;
    for (let r = castTop; r <= castBottom; r++) {
        for (let c = castLeft; c <= castRight; c++) {
            if (r === castTop || r === castBottom || c === castLeft || c === castRight) {
                grid[r][c] = WALL_STONE; 
            } else {
                safeTiles.push({x: c, y: r}); 
            }
        }
    }

    for (let r = castTop + 4; r <= castBottom; r++) { grid[r][48] = WALL_STONE; grid[r][52] = WALL_STONE; } 
    for (let c = castLeft; c <= castRight; c++) { grid[47][c] = WALL_STONE; } 

    grid[castBottom][50] = 0; 
    grid[47][50] = 0;         
    grid[52][48] = 0; grid[52][52] = 0; 

    startX = 50;
    startY = 45;
    // --- MAP ALL VALID FLOORS ONCE ---
    let floorTiles = [];
    for (let r = 1; r < maxR - 1; r++) {
        for (let c = 1; c < maxC - 1; c++) {
            if (grid[r][c] === 0) floorTiles.push({ x: c, y: r });
        }
    }


    return { grid, startX, startY, bossX: 90, bossY: 50, safeTiles,floorTiles }; 
}

// --- DECK BUILDER ---
// --- SYNERGY CACHE ---
// Stores the valid pools so we don't recalculate them 80 times per map!
const deckPoolCache = { allies: {}, equips: {} };

function buildSynergisticDeck(monsterID) {
    let baseID = Math.floor(parseFloat(monsterID));
    let deck = [baseID]; 
    
    const baseCard = CARD_MANIFEST_DB[baseID];
    if (!baseCard || baseCard.type === 'item' || baseCard.type === 'spell') return deck; 

    // 1. ALLY MEMOIZATION
    if (!deckPoolCache.allies[baseID]) {
        deckPoolCache.allies[baseID] = Object.entries(CARD_MANIFEST_DB)
            .filter(([id, card]) => {
                let numId = parseInt(id);
                if (card.type !== "monster" || numId === baseID) return false;
                if (card.suit === "Major Arcana" || card.rank === "King" || card.rank === "Queen") return false;
                return (card.suit === baseCard.suit) || (card.tribe && baseCard.tribe && card.tribe === baseCard.tribe);
            }).map(([id]) => parseInt(id));
    }
    const validAllies = deckPoolCache.allies[baseID];

    // 2. EQUIP MEMOIZATION
    if (!deckPoolCache.equips[baseID]) {
        deckPoolCache.equips[baseID] = Object.entries(CARD_MANIFEST_DB)
            .filter(([id, card]) => {
                if (card.type !== "spell" && card.type !== "item") return false;
                if (card.classes && baseCard.classes) {
                    return card.classes.some(cls => baseCard.classes.includes(cls));
                }
                return false;
            }).map(([id]) => parseInt(id));
    }
    const validEquips = deckPoolCache.equips[baseID];

    // 3. ASSEMBLE (Randomized per NPC from the cached pools)
    let numMonstersToAdd = Math.floor(Math.random() * 4) + 1; 
    for(let i = 0; i < numMonstersToAdd; i++) {
        if (validAllies.length > 0) {
            deck.push(validAllies[Math.floor(Math.random() * validAllies.length)]);
        }
    }

    let numEquipsToAdd = Math.floor(Math.random() * 5) + 1; 
    for(let i = 0; i < numEquipsToAdd; i++) {
        if (validEquips.length > 0) {
            deck.push(validEquips[Math.floor(Math.random() * validEquips.length)]);
        }
    }

    return deck;
}
//Scenario Generator
//Scenario Generator
async function generateScenarioScript(biomeName, scenarioType, bossName, questGiverName) {
const prompt = `[ROOT DIRECTIVE]: You are the Dungeon Master generating JSON arrays for a ${biomeName} map.    [CURRENT ZONE]: ${biomeName}
    [SCENARIO]: ${scenarioType} (e.g., Arena, Invasion, Rescue, Raid)
    [BOSS]: ${bossName}
    [QUEST GIVER]: ${questGiverName}
    
    TASK: Generate the exact dialogue arrays needed to populate a living map of 80 NPCs. 
    Keep all lines under 10 words. Ensure the tone matches your self-written directive.
    
    1. mapLore: 2 sentences of deep history about this specific location.
    2. questObjective: A punchy 1-sentence objective.
    3. bossTaunt: 1 menacing sentence for the final encounter.
    4. hostileTaunts: Array of 15 distinct battle cries for aggressive monsters.
    5. traitorBegs: Array of 5 lines for monsters begging for mercy or offering to defect.
    6. friendlyLore: Array of 9 lines from villagers talking about the current scenario/boss.
    7. friendlyLife: Array of 9 lines of mundane, slice-of-life chatter about the ${biomeName}.
    8. friendlyProfound: Array of 9 deeply philosophical or insightful statements.
    9. recruitPlea: Array of 2 lines where a villager urgently asks to join the player's party.
    10. prisonerLines: Array of 8 lines from friendly NPCs trapped deep in the dungeon. They should express despair, miss the sun, or give cryptic hints about the boss's deck.`;

    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            mapLore: { type: SchemaType.STRING },
            questObjective: { type: SchemaType.STRING },
            bossTaunt: { type: SchemaType.STRING },
            hostileTaunts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            traitorBegs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            friendlyLore: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            friendlyLife: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            friendlyProfound: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            recruitPlea: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            prisonerLines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["mapLore", "questObjective", "bossTaunt", "hostileTaunts", "traitorBegs", "friendlyLore", "friendlyLife", "friendlyProfound", "recruitPlea", "prisonerLines"]
    };

    try {
        const scriptModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const result = await scriptModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: schema }
        });
        
        let rawText = result.response.text().trim();
        if (rawText.startsWith("```")) rawText = rawText.replace(/^```(json)?|```$/g, "").trim();
        return JSON.parse(rawText);
    } catch (e) {
        console.error("Script Generation Failed:", e);
        return null; // Will trigger safe fallbacks below
    }
}
// Helper to safely dump a successful script into the cache
function cacheScriptLines(biomeName, script) {
    if (!GLOBAL_LORE_CACHE[biomeName]) {
        GLOBAL_LORE_CACHE[biomeName] = {
            objectives: [], bossTaunts: [], hostileTaunts: [], traitorBegs: [], 
            friendlyLore: [], friendlyLife: [], friendlyProfound: [], recruitPlea: [], prisonerLines: []
        };
    }
    const cache = GLOBAL_LORE_CACHE[biomeName];
    
    // Push lines into the cache (Keep arrays under 100 items to save RAM)
    if (script.questObjective) cache.objectives.push(script.questObjective);
    if (script.bossTaunt) cache.bossTaunts.push(script.bossTaunt);
    if (script.hostileTaunts) cache.hostileTaunts.push(...script.hostileTaunts);
    if (script.traitorBegs) cache.traitorBegs.push(...script.traitorBegs);
    if (script.friendlyLore) cache.friendlyLore.push(...script.friendlyLore);
    if (script.friendlyLife) cache.friendlyLife.push(...script.friendlyLife);
    if (script.friendlyProfound) cache.friendlyProfound.push(...script.friendlyProfound);
    if (script.recruitPlea) cache.recruitPlea.push(...script.recruitPlea);
    if (script.prisonerLines) cache.prisonerLines.push(...script.prisonerLines);

    // Trim cache to prevent memory leaks
    for (let key in cache) {
        if (cache[key].length > 100) cache[key] = cache[key].slice(-100);
    }
}
// Helper to pull a random line from the cache (or a generic fallback)
function getMadLibLine(biomeName, category, fallbackText) {
    const cache = GLOBAL_LORE_CACHE[biomeName];
    if (cache && cache[category] && cache[category].length > 0) {
        return cache[category][Math.floor(Math.random() * cache[category].length)];
    }
    return fallbackText;
}
// Helper to shuffle arrays so dialogue doesn't spawn in the exact same order
function shuffleArray(array) {
    if (!array || !Array.isArray(array)) return [];
    let curId = array.length;
    while (0 !== curId) {
        let randId = Math.floor(Math.random() * curId);
        curId -= 1;
        let tmp = array[curId];
        array[curId] = array[randId];
        array[randId] = tmp;
    }
    return array;
}
// --- AI TOOL EXECUTOR ---
async function executeAITools(currentResponse, activeSession, socket) {
    let chainCount = 0;
    const MAX_CHAIN = 6; 

    while (currentResponse.functionCalls() && chainCount < MAX_CHAIN) {
        chainCount++;
        const calls = currentResponse.functionCalls();
        console.log(`[AI TOOL CHAIN ${chainCount}]: Executing ${calls.length} tools!`); 

        let toolResponsesBatch = [];

        for (let call of calls) {
            let functionResult = { result: "Action executed." };
            
            try {
                // A. GIFTING
                if (call.name === "givePlayerCard") {
                    const targetName = call.args.targetName;
                    const targetID = findSocketID(targetName);
                    
                    if (!targetID) {
                        functionResult = { result: `Failed: Player '${targetName}' not found or offline.` };
                    } else {
                        let cardID = parseInt(call.args.cardName);
                        const name = String(call.args.cardName).toLowerCase();

                        // Fallback: If the AI passed a string name or an invalid ID, dynamically search the new DB
                        if (isNaN(cardID) || !CARD_MANIFEST_DB[cardID]) {
                            let foundID = Object.keys(CARD_MANIFEST_DB).find(id => {
                                const dbName = CARD_MANIFEST_DB[id].name.toLowerCase();
                                // Check if the DB name is inside the AI's string, or vice versa
                                return dbName.includes(name) || name.includes(dbName);
                            });
                            
                            if (foundID) {
                                cardID = parseInt(foundID);
                            } else {
                                // Hardcoded aliases for edge cases
                                if (name.includes("excalibur")) cardID = 84;
                                else if (name.includes("suncat")) cardID = 87; 
                            }
                        }

                        if (!isNaN(cardID) && CARD_MANIFEST_DB[cardID]) {
                            io.to(targetID).emit("receive_card", { cardIndex: cardID });
                            functionResult = { result: `Success. Card ID ${cardID} given to ${targetName}.` };
                        } else {
                            functionResult = { result: `Error: Could not find card named/ID '${call.args.cardName}'.` };
                        }
                    }
                    updateSuncatJournal(`I bestowed the ${call.args.cardName} card upon ${targetName} as a reward.`);
                }
                
                // B. JUDGEMENT
                else if (["kickPlayer", "banishPlayer", "vanquishPlayer"].includes(call.name)) {
                    const targetName = call.args.targetName;
                    const targetID = findSocketID(targetName);

                    if (!targetID) {
                        functionResult = { result: `Failed: Player ${targetName} not found.` };
                    } else {
                        let actionType = call.name.replace("Player", "").toLowerCase();
                        const targetSocket = io.sockets.sockets.get(targetID);
                        
                        if (targetSocket) {
                            targetSocket.emit("admin_command", { type: actionType });
                            if (actionType !== 'vanquish') targetSocket.disconnect(true);
                            functionResult = { result: `Success: Player ${targetName} was ${actionType}ed.` };
                        } else {
                            functionResult = { result: `Error: Socket not found for ${targetName}.` };
                        }
                    }
                    updateSuncatJournal(`I exercised my authority and ${call.name.replace("Player", "ed")} ${call.args.targetName} for: ${call.args.reason || "no stated reason"}.`);
                }
                
                // C. TELEPORTATION 
                else if (call.name === "teleportToPlayer") {
                    const suncat = players[SUNCAT_ID];
                    let targetID = call.args.targetName ? findSocketID(call.args.targetName) : (socket ? socket.id : null);
                    const requester = players[targetID];
                    
                    if (suncat && requester) {
                        suncat.mapID = requester.mapID;
                        suncat.x = parseFloat(requester.x);
                        suncat.y = parseFloat(requester.y);
                        
                        currentTargetID = targetID; 
                        lastSwitchTime = Date.now();
                        
                        io.emit("updatePlayers", players);
                        functionResult = { result: `Teleport successful. You are now standing next to ${requester.name}.` };
                    } else {
                        functionResult = { result: "Teleport failed. Could not find player coordinates." };
                    }
                }
                
                // D. CONSULT MANUAL

                else if (call.name === "consultGameManual") {
                    const queries = call.args.searchQueries || [];
                    let combinedResults = [];

                    queries.forEach(query => {
                        // Clean the query and remove stop words
                        const lowerQueryWords = query.toLowerCase()
                            .replace(/[^\w\s]/gi, '')
                            .split(/\s+/)
                            .filter(w => w.length > 2 && !SEARCH_STOP_WORDS.has(w)); // Changed from .includes to .has for Set performance
                        
                        if (lowerQueryWords.length === 0) return;

                        let scoredEntries = MASTER_KNOWLEDGE_BASE.map(entry => {
                            let score = 0;
                            
                            // 1. Primary Scoring: Tag Matches (Extremely Accurate)
                            if (entry.tags && Array.isArray(entry.tags)) {
                                lowerQueryWords.forEach(word => {
                                    // Exact tag match = high score, partial match = medium score
                                    if (entry.tags.includes(word)) score += 15;
                                    else if (entry.tags.some(tag => tag.includes(word))) score += 5;
                                });
                            }
                            
                            // 2. Secondary Scoring: Fallback raw text search (Just in case)
                            if (entry.text) {
                                let lowerText = entry.text.toLowerCase();
                                lowerQueryWords.forEach(word => {
                                    if (lowerText.includes(word)) score += 1;
                                });
                            }

                            return { text: entry.text, score };
                        });

                        // Grab the top 2 most relevant lore entries (score must be > 0)
                        let bestMatches = scoredEntries
                            .filter(item => item.score > 0)
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 2);

                        if (bestMatches.length > 0) {
                            let uniqueContexts = [...new Set(bestMatches.map(m => m.text))];
                            combinedResults.push(`[Found for '${query}']: ` + uniqueContexts.join(' | '));
                        } else {
                            combinedResults.push(`[${query}]: No memory found in the archives.`);
                        }
                    });

                    functionResult = combinedResults.length > 0 
                        ? { result: combinedResults.join('\n') }
                        : { result: "Search returned no results. The archives are empty on this subject." };
                    
                    updateSuncatJournal(`I delved into the ancient game archives to recover memories regarding: ${queries.join(", ")}.`);
                }
                
                // E. CREATE CUSTOM MAP (The Server-Driven Engine)
                else if (call.name === "createCustomMap") {
                    try {
                        
                        // 1. SERVER ROLLS THE SCENARIO AND ZONING
                        const bEnum = Math.floor(Math.random() * Object.keys(BIOME_DB).length);
                        const biome = BIOME_DB[bEnum] || BIOME_DB[0];

                        // --- NEW: HANDLE SPECIFIC REQUESTS OR RANDOMIZE ---
                        const validScenarios = ['Invasion', 'Rescue/Fetch', 'Arena Madness','Raid'];
                        let scenarioType = call.args.requestedScenario;
                        
                        // Fuzzy match if AI passed something like "Rescue" instead of "Rescue/Fetch"
                        if (scenarioType && scenarioType.includes('Rescue')) scenarioType = 'Rescue/Fetch';
                        
                        if (!scenarioType || !validScenarios.includes(scenarioType)) {
                            scenarioType = validScenarios[Math.floor(Math.random() * validScenarios.length)];
                        }
                        // Settlement Logic (0 = Wilderness, 1 = Village, 2 = City)
                        const settlementType = scenarioType === 'Arena Madness' ? 0 : Math.floor(Math.random() * 2) + 1; 

                        // Pick Actors
                        const monsterIDs = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].type === "monster" && CARD_MANIFEST_DB[id].rank !== "0");
                        const protagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
                        let antagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
                        while (antagID === protagID) antagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);

                        // 2. FETCH THE SCRIPT & REDUNDANCY CHECKER
                        let script = null;
                        let attempts = 0;
                        const targetPlayer = players[findSocketID(call.args.targetName)];

                        while (attempts < 2) {
                            script = await generateScenarioScript(biome.name, scenarioType, CARD_MANIFEST_DB[antagID].name, CARD_MANIFEST_DB[protagID].name);
                            
                            if (!script || !script.questObjective) {
                                attempts++;
                                continue;
                            }

                            // Calculate the math vector for this new quest
                            let newQuestVector = await createMemoryVector(script.questObjective);
                            let isRedundant = false;

                            // Compare against the player's last 5 quests
                            if (targetPlayer && targetPlayer.pastQuestVectors && newQuestVector) {
                                for (let pastVec of targetPlayer.pastQuestVectors) {
                                    let score = cosineSimilarity(newQuestVector, pastVec);
                                    if (score > 0.85) { // 85% match means it's basically the exact same quest!
                                        isRedundant = true;
                                        break;
                                    }
                                }
                            }

                            if (isRedundant) {
                                console.log(`[Redundancy] Script rejected! Cosine similarity too high. Retrying...`);
                                script = null;
                                attempts++;
                            } else {
                                // Script is UNIQUE and GOOD! 
                                // Save the vector so we don't repeat this next time
                                if (targetPlayer && newQuestVector) {
                                    if (!targetPlayer.pastQuestVectors) targetPlayer.pastQuestVectors = [];
                                    targetPlayer.pastQuestVectors.push(newQuestVector);
                                    if (targetPlayer.pastQuestVectors.length > 5) targetPlayer.pastQuestVectors.shift();
                                }
                                
                                // Feed the good script into the Global Cache for later!
                                cacheScriptLines(biome.name, script);
                                break; 
                            }
                        }

                        // THE MAD LIBS FALLBACK: If we failed twice, assemble a script from the cache!
                        if (!script) {
                            console.log(`[Mad Libs Fallback] API failed or was too redundant. Building script from Global Cache.`);
                            script = {
                                mapLore: getMadLibLine(biome.name, 'mapLore', "An uncharted land."),
                                questObjective: getMadLibLine(biome.name, 'objectives', "Survive and conquer."),
                                bossTaunt: getMadLibLine(biome.name, 'bossTaunts', "You dare approach my domain?"),
                                hostileTaunts: [], traitorBegs: [], friendlyLore: [], friendlyLife: [], friendlyProfound: [], recruitPlea: [], prisonerLines: []
                            };
                            // We don't need to fill the arrays here, because our popping logic below will auto-pull from the cache!
                        }

                        // SHUFFLE THE ARRAYS so we can .pop() them cleanly!
                        if (script.friendlyLore) shuffleArray(script.friendlyLore);
                        if (script.friendlyLife) shuffleArray(script.friendlyLife);
                        if (script.friendlyProfound) shuffleArray(script.friendlyProfound);
                        if (script.recruitPlea) shuffleArray(script.recruitPlea);
                        if (script.hostileTaunts) shuffleArray(script.hostileTaunts);
                        if (script.traitorBegs) shuffleArray(script.traitorBegs);
                        if (script.prisonerLines) shuffleArray(script.prisonerLines);

                        // 3. GENERATE THE GRID & SETTLEMENTS
                        let layoutStyle = scenarioType === 'Arena Madness' ? 'arena' : (scenarioType === 'Raid' ? 'raid' : 'world');                        
                        let mapData = generateProceduralGrid(layoutStyle, biome.walls[0]); 
                        let gridData = mapData.grid;
                        let startX = mapData.startX;
                        let startY = mapData.startY;
                        let bossX = mapData.bossX;
                        let bossY = mapData.bossY;
                        let safeTiles = mapData.safeTiles;

                        // --- THE PERFECT ANTI-WALL PHYSICS HELPER ---
                        // Extract the mapped floors from the generator
                        let floorTiles = mapData.floorTiles || [];

                        // --- O(1) SPAWN FINDER ---
                        const getValidSpawn = (originX, originY, minRadius, maxRadius) => {
                            if (floorTiles.length === 0) return { x: startX + 0.5, y: startY + 0.5 };

                            // Fast filter: Only keep floors that fall within our allowed distance
                            let validSpots = floorTiles.filter(tile => {
                                // Fast distance approximation (Manhattan distance is cheaper than Pythagoras)
                                let dist = Math.abs(tile.x - originX) + Math.abs(tile.y - originY);
                                return dist >= minRadius && dist <= maxRadius;
                            });

                            if (validSpots.length > 0) {
                                // Pick a valid spot and REMOVE IT from the pool so NPCs don't stack!
                                let randomIndex = Math.floor(Math.random() * validSpots.length);
                                let chosen = validSpots[randomIndex];
                                
                                // Splice it out of the master floor array so no one else spawns here
                                let masterIndex = floorTiles.findIndex(t => t.x === chosen.x && t.y === chosen.y);
                                if (masterIndex > -1) floorTiles.splice(masterIndex, 1);

                                return { x: chosen.x + 0.5, y: chosen.y + 0.5 }; 
                            }
                            
                            // Absolute fallback if the radius is completely walled off
                            return { x: startX + 0.5, y: startY + 0.5 };
                        };

                        // 4. POPULATE THE WORLD

                        
                        let mapNPCs = [];

                        const getMinions = (leaderID) => {
                            let leaderCard = CARD_MANIFEST_DB[leaderID];
                            let pool = Object.keys(CARD_MANIFEST_DB).filter(id => {
                                let c = CARD_MANIFEST_DB[id];
                                return c.type === "monster" && 
                                    c.suit === leaderCard.suit && 
                                    c.rank !== "King" && 
                                    c.rank !== "Queen";
                            }).map(Number);
                            return pool.length > 0 ? pool : [54, 56, 23, 42]; 
                        };

                        // --- THE FPS SAVER: HEAVY SPRITE MANAGER ---
                        // IDs of sprites with massive polygon counts that crash the canvas
                        const HEAVY_SPRITES = [33, 63, 74, 49,89,37,47,]; // Salamander, Dragon, Gargoyle, Skeleton, Corrupt Sylph
                        
                        const friendlyMinions = getMinions(protagID);
                        let hostileMinions = getMinions(antagID).filter(id => !friendlyMinions.includes(id));
                        
                        // 1. BOSS CHECK: If the Boss is heavy, remove ALL heavy minions from the pool!
                        if (HEAVY_SPRITES.includes(antagID)) {
                            hostileMinions = hostileMinions.filter(id => !HEAVY_SPRITES.includes(id));
                        }

                        // Fallback to purely lightweight sprites if the pool is empty
                        if (hostileMinions.length === 0) hostileMinions = [54, 56, 42, 23]; // Goblins, Imps, Shades, Wisps

                        let heavySpawnCount = 0;
                        const MAX_HEAVY_MINIONS = 1; // Only allow 1 wandering heavy minion per map total

                        if (scenarioType !== 'Arena Madness') {
                            
                            // A. FRIENDLIES (Structured Settlement)
                            const allFriendlyLines = [
                                ...script.friendlyLore.map(l => ({ text: l, type: 'lore' })),
                                ...script.friendlyLife.map(l => ({ text: l, type: 'life' })),
                                ...script.friendlyProfound.map(l => ({ text: l, type: 'profound' }))
                            ];
                            // --- RAID SPECIFIC: SPAWN PRISONERS IN THE CITADEL ---
                            if (scenarioType === 'Raid' && mapData.citadelInterior && mapData.citadelInterior.length > 0) {
                                let prisonerLines = script.prisonerLines || ["We've been trapped for so long...", "The sun... I miss it.", "Beware the center room!"];
                                
                                for(let p = 0; p < 8; p++) {
                                    let pID = friendlyMinions[Math.floor(Math.random() * friendlyMinions.length)] || protagID;
                                    let cell = mapData.citadelInterior[Math.floor(Math.random() * mapData.citadelInterior.length)];
                                    
                                    mapNPCs.push({
                                        type: CARD_MANIFEST_DB[pID].sprite || pID,
                                        x: cell.x + 0.5, y: cell.y + 0.5, 
                                        state: 'stationary', // They are trapped!
                                        role: 'dialogue',
                                        dialogue: [prisonerLines[p % prisonerLines.length]],
                                        color: '#aaaaaa', // Give them a sad gray color
                                        alignment: 'ally',
                                        subRole:'prisoner',
                                    });
                                }
                            }
                            for(let i=0; i<13; i++) {
                                let mID = friendlyMinions[Math.floor(Math.random() * friendlyMinions.length)] || protagID;
                                
                                let spawnSpot;
                                let isIndoors = false;
                                
                                // 30% of villagers spawn INSIDE the generated houses and sit still!
                                if (safeTiles.length > 0 && Math.random() < 0.3) {
                                    let tile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
                                    spawnSpot = { x: tile.x + 0.5, y: tile.y + 0.5 };
                                    isIndoors = true;
                                } else {
                                    // Otherwise wander the village streets
                                    let maxDist = (settlementType > 0) ? 14 : 40;
                                    spawnSpot = getValidSpawn(startX, startY, 0, maxDist);
                                }

                                let npcConfig = {
                                    type: CARD_MANIFEST_DB[mID].sprite || mID,
                                    x: spawnSpot.x, y: spawnSpot.y, 
                                    state: isIndoors ? 'stationary' : 'wandering', // <--- Smart State!
                                    role: 'dialogue',
                                    alignment: 'ally',
                                    subRole:'villager',

                                };

                                if (i < 3) {
                                    npcConfig.role = 'reward'; 
                                    npcConfig.dialogue = [script.friendlyProfound.pop() || getMadLibLine(biome.name, 'friendlyProfound', "The arcane paths provide...")]; 
                                    let deckPool = buildSynergisticDeck(mID);
                                    npcConfig.rewardCard = deckPool[Math.floor(Math.random() * deckPool.length)]; 
                                } else if (i < 5) {
                                    npcConfig.role = 'dialogue'; // Ensure they don't attack
                                    npcConfig.dialogue = [script.recruitPlea.pop() || getMadLibLine(biome.name, 'recruitPlea', "Please, let me join your party!")];
                                    npcConfig.options = ['Accept', 'Decline']; 
                                    npcConfig.rewardCard = mID; 
                                } else {
                                    // Mix up the lore and life arrays for standard villagers
                                    let lineText = "";
                                    if (Math.random() > 0.5) {
                                        lineText = script.friendlyLore.pop() || getMadLibLine(biome.name, 'friendlyLore', "The monsters are restless lately.");
                                    } else {
                                        lineText = script.friendlyLife.pop() || getMadLibLine(biome.name, 'friendlyLife', "I just want to rest.");
                                    }
                                    npcConfig.dialogue = [lineText];
                                }
                                mapNPCs.push(npcConfig);
                            }

                            // B. HOSTILES (Grunts and Mini-Bosses)
                            // We spawn 40 standard grunts, and 10 Mini-Bosses
                            for(let i=0; i<30; i++) {
                                let isMiniBoss = i >= 19; // The last 10 are Elite Guards
                                let mID = hostileMinions[Math.floor(Math.random() * hostileMinions.length)] || antagID;
                                // ---> NEW: ENFORCE THE HARD LIMIT <---
                                if (HEAVY_SPRITES.includes(mID)) {
                                    if (heavySpawnCount >= MAX_HEAVY_MINIONS) {
                                        // Swap to a lightweight grunt!
                                        mID = 54; // Force it to be a Goblin
                                    } else {
                                        heavySpawnCount++;
                                        // Force the solitary heavy minion to wander so it doesn't stand next to the boss
                                        isMiniBoss = false; 
                                    }
                                }
                                // Spawn between 20 and 80 tiles away from the village!
                                let spawnSpot = getValidSpawn(startX, startY, 20, 80);

                                let npcConfig = {
                                    type: CARD_MANIFEST_DB[mID].sprite || mID,
                                    x: spawnSpot.x, y: spawnSpot.y, 
                                    state: isMiniBoss ? 'stationary' : 'chasing', // Elites hold choke points!
                                    role: 'battle',
                                    deck: buildSynergisticDeck(mID),
                                    alignment: 'foe',
                                    subRole:'miniBoss',
                                };
                                
                                // Make Mini-Bosses visually distinct (Orange)
                                if (isMiniBoss) {
                                    npcConfig.color = '#ff8800';
                                    npcConfig.dialogue = [script.bossTaunt]; // They use the boss's menacing lines
                                }

                                if (i < 5) {
                                    npcConfig.state = 'wandering'; npcConfig.role = 'dialogue'; 
                                    npcConfig.dialogue = [script.traitorBegs.pop() || getMadLibLine(biome.name, 'traitorBegs', "Wait, I yield! Spare me!")];
                                    npcConfig.options = ['Spare Them', 'Vanquish']; 
                                    npcConfig.rewardCard = mID;
                                } else if (i < 20) {
                                    npcConfig.dialogue = [script.hostileTaunts.pop() || getMadLibLine(biome.name, 'hostileTaunts', "Your journey ends here!")];
                                }
                                mapNPCs.push(npcConfig);
                            }

                            // C. THE FINAL BOSS
                            mapNPCs.push({
                                type: CARD_MANIFEST_DB[antagID].sprite || antagID,
                                x: bossX + 0.5, y: bossY + 0.5, // <--- EXACTLY IN THE CENTER. No random spread!
                                state: 'stationary', role: 'battle', isBoss: true,
                                dialogue: [script.bossTaunt], deck: buildSynergisticDeck(antagID),
                                color: '#ff00ff', // Purple to signify extreme danger
                                alignment: 'foe',
                                subRole:'Boss',
                            });

                        } 
                        
                        else {
                            // --- ARENA MODE POPULATION ---
                            for(let i=0; i<3; i++) {
                                let mID = hostileMinions[Math.floor(Math.random() * hostileMinions.length)];
                                let spawnSpot = getValidSpawn(startX, startY, 2, 5);
                                mapNPCs.push({
                                    type: CARD_MANIFEST_DB[mID].sprite || mID,
                                    x: spawnSpot.x, y: spawnSpot.y,
                                    state: 'chasing', role: 'battle',
                                    dialogue: [script.hostileTaunts[i % script.hostileTaunts.length] || "For the Emperor!"],
                                    deck: buildSynergisticDeck(mID),
                                    alignment: 'foe',
                                    subRole:'gladiator',
                                });
                            }
                        }

                        // 5. CACHE AND TELEPORT
                        const customMapData = {
                            id: 999, maze: gridData, 
                            skyColor: biome.skies[0], floorColor: biome.floors[0], 
                            name: `${biome.name} of ${script.questObjective.split(' ')[0] || "Mystery"}`, 
                            npcs: mapNPCs, weather: biome.weather[0],
                            spawnX: startX + 0.5, spawnY: startY + 0.5,
                            biome: biome.name, 
                            safeTiles: safeTiles 
                        };

                        activeCustomMap = customMapData;

                        let targets = [];
                        if (call.args.targetName.toLowerCase() === "all") {
                            for (let id in players) {
                                if (players[id].mapID === players[SUNCAT_ID].mapID && id !== SUNCAT_ID) targets.push(id);
                            }
                        } else {
                            let tid = findSocketID(call.args.targetName);
                            if (tid) targets.push(tid);
                        }

                        io.emit("force_npc_reset"); 

                        if (targets.length > 0) {
                            io.emit('load_custom_map', customMapData);
                            
                            targets.forEach(tid => {
                                const targetPlayer = players[tid];
                                targetPlayer.prevMapID = targetPlayer.mapID; 
                                targetPlayer.mapID = 999; 
                                targetPlayer.x = startX + 0.5 + (Math.random() * 1 - 0.5); 
                                targetPlayer.y = startY + 0.5 + (Math.random() * 1 - 0.5);
                                targetPlayer.stepsTaken = 0;
                                targetPlayer.exploredTiles = new Set();
                                
                                targetPlayer.mapFriendlyTribe = protagID;
                                targetPlayer.mapHostileTribe = antagID;
                                targetPlayer.mapScenario = scenarioType; // <-- FIX: Saving the String ('Arena Madness') so the override works!
                                targetPlayer.currentMapLore = script.mapLore;
                                targetPlayer.scenarioLog = []; 
                                targetPlayer.mapBossID = antagID;
                                targetPlayer.activeQuest = script.questObjective;
                                io.to(tid).emit("new_quest_objective", { questText: targetPlayer.activeQuest });
                                 });

                            players[SUNCAT_ID].mapID = 999;
                            players[SUNCAT_ID].x = startX + 1.5; players[SUNCAT_ID].y = startY + 0.5;
                            io.emit("updatePlayers", players);
                            functionResult = { result: `Success. Built map and teleported players.` };
                        } else {
                            functionResult = { result: `Failed: No players found to teleport.` };
                        }
                    } catch (err) {
                        console.error("Map Generation Error:", err);
                        functionResult = { result: "Critical Error building map." };
                    }
                    updateSuncatJournal(`I crafted a new scenario and summoned ${call.args.targetName}.`);
                }

                // F. TELEPORT SPECIFIC PLAYER
                else if (call.name === "teleportPlayer") {
                    const targetID = findSocketID(call.args.targetName);
                    const destMap = parseInt(call.args.mapID);

                    if (!targetID) {
                        functionResult = { result: `Failed: Player ${call.args.targetName} not found.` };
                        } else if (isNaN(destMap) || (!WORLD_ATLAS_DB[destMap] && destMap !== 999 && destMap !== 100)) {
                        functionResult = { result: `Failed: Map ID ${destMap} does not exist.` };
                    } else {
                        players[targetID].mapID = destMap;
                        players[targetID].stepsTaken = 0;
                        players[targetID].exploredTiles = new Set();
                        
                        // Send the standard teleport command
                        io.to(targetID).emit("force_teleport", { mapID: destMap });
                        
                        // IF they went to a big custom map, send the payload!
                        if (destMap === 999 && activeCustomMap) {
                            io.to(targetID).emit('load_custom_map', activeCustomMap);
                        } else if (destMap === 100 && tintagelHubMap) {
                            io.to(targetID).emit('load_custom_map', tintagelHubMap);
                        }
                        io.emit("updatePlayers", players);
                        functionResult = { result: `Success: Warped player to map ${destMap}.` };
                    }
                    updateSuncatJournal(`I forcibly warped ${call.args.targetName} to Map ID ${call.args.mapID}.`);
                }
                
              
                  // G. SPAWN NPC/MONSTER
                else if (call.name === "spawnNPC") {
                    const targetID = findSocketID(call.args.targetName);
                    if (!targetID) {
                        functionResult = { result: `Failed: Player not found.` };
                    } else {
                        const tp = players[targetID];
                        
                        let spawnMap = tp.mapID; 
                        let spawnX = tp.x;
                        let spawnY = tp.y;

                        // --- SMART COLLISION RADAR ---
                        if (spawnMap === 999 && activeCustomMap && activeCustomMap.maze) {
                            let grid = activeCustomMap.maze;
                            let foundSafe = false;
                            
                            // Scan for a safe floor tile 2 to 4 steps away
                            for(let i = 0; i < 20; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let dist = 2 + (Math.random() * 2); 
                                let testX = Math.floor(tp.x + Math.cos(angle) * dist);
                                let testY = Math.floor(tp.y + Math.sin(angle) * dist);

                                // If the tile is a 0 (Floor), it's safe!
                                if (grid[testY] && grid[testY][testX] === 0) {
                                    spawnX = testX + 0.5;
                                    spawnY = testY + 0.5;
                                    foundSafe = true;
                                    break;
                                }
                            }
                            // If they are cornered in a hallway, spawn it right on top of them!
                            if (!foundSafe) {
                                spawnX = tp.x + (Math.random() * 0.5 - 0.25);
                                spawnY = tp.y + (Math.random() * 0.5 - 0.25);
                            }
                        } else {
                            // Standard Maps (0-22) are open 20x20 grids. 
                            // Add a small 2-tile offset, clamped safely inside 1.5 to 18.5
                            spawnX = tp.x + (Math.random() > 0.5 ? 2.5 : -2.5);
                            spawnY = tp.y + (Math.random() > 0.5 ? 2.5 : -2.5);
                            spawnX = Math.max(1.5, Math.min(18.5, spawnX)); 
                            spawnY = Math.max(1.5, Math.min(18.5, spawnY));
                        }

                        let baseID = parseInt(call.args.npcType);
                        // --- THE NAME RESOLVER (Fixes Invisible Sprites & Empty Decks) ---
                        if (isNaN(baseID) || !CARD_MANIFEST_DB[baseID]) {
                            let name = String(call.args.npcType).toLowerCase();
                            let foundID = Object.keys(CARD_MANIFEST_DB).find(id => 
                                CARD_MANIFEST_DB[id].name.toLowerCase().includes(name)
                            );
                            if (foundID) {
                                baseID = parseInt(foundID);
                            } else {
                                baseID = 54; // Ultimate Failsafe: Goblin
                            }
                        }

                        let safeRewardCard = call.args.rewardCard;
                        let role = call.args.role || 'battle';
                        let state = call.args.state || 'chasing';
                        let dialogue = call.args.dialogue || null;

                        const cardData = CARD_MANIFEST_DB[baseID];
                        let finalDeck, visualSprite;

                        // --- THE IDIOT-PROOF INTERCEPTOR ---
                        if (cardData && (cardData.type === 'item' || cardData.type === 'spell')) {
                            visualSprite = -27; 
                            role = 'reward';
                            state = 'stationary';
                            dialogue = []; 
                            safeRewardCard = null; 
                            finalDeck = [baseID];  
                            call.args.color = '#ffff00'; 
                        } else {
                            visualSprite = cardData?.sprite || baseID;
                            finalDeck = buildSynergisticDeck(baseID);
                        }

                            io.emit("remote_spawn_npc", {
                            mapID: spawnMap,
                            index: Math.floor(Math.random() * 100000) + 1000,
                            x: spawnX,
                            y: spawnY,
                            type: visualSprite,
                            state: state,
                            role: role,
                            color: call.args.color || '#ff0000',
                            deck: finalDeck, 
                            dialogue: dialogue,
                            rewardCard: safeRewardCard,
                            options: call.args.options || null 
                        });
                        functionResult = { result: `Success: ${cardData ? cardData.name : 'Entity'} spawned.` };
                    }
                }
                
                // H. ASSIGN QUEST
                else if (call.name === "assignQuest") {
                    const targetID = findSocketID(call.args.targetName);
                    if (targetID) {
                        io.to(targetID).emit("new_quest_objective", { questText: call.args.questText });
                        players[targetID].activeQuest = call.args.questText; 
                        
                        

                        functionResult = { result: `Quest assigned.` };
                    } else {
                        functionResult = { result: `Failed: Player not found.` };
                    }
                    updateSuncatJournal(`I tasked ${call.args.targetName} with a new objective: "${call.args.questText}".`);
                }
                
                // I. CHANGE ENVIRONMENT
                else if (call.name === "changeEnvironment") {
                    const targetID = findSocketID(call.args.targetName);
                    if (targetID && players[targetID]) {
                        io.emit("update_map_environment", {
                            mapID: players[targetID].mapID,
                            weather: call.args.weather,
                            skyColor: call.args.skyColor
                        });
                        functionResult = { result: `Environment altered.` };
                    } else {
                        functionResult = { result: `Failed: Player not found.` };
                    }
                    updateSuncatJournal(`I reached into the sky of Map ${players[targetID].mapID} and changed the weather to ${call.args.weather}.`);
                }
                
                // J. CREATE CUSTOM CARD
                else if (call.name === "createCustomCard") {
                    const targetID = findSocketID(call.args.targetName);
                    
                    if (targetID) {
                        // 1. Generate a permanent, unique ID for this session (starting at 1000)
                        const existingIDs = Object.keys(CARD_MANIFEST_DB).map(Number);
                        const nextID = Math.max(...existingIDs, 999) + 1;

                        // 2. Format it to match your exact CARD_MANIFEST_DB schema
                        const newCard = {
                            name: call.args.name,
                            type: call.args.type || "monster",
                            suit: call.args.suit || "Unique",
                            rank: call.args.rank || "???",
                            rarity: "unique",
                            classes: call.args.classes || ["rogue"], // Synergy engine needs this!
                            lore: call.args.lore || "A mysterious entity forged from the ether.",
                            stats: call.args.stats || "1d10 to all stats"
                        };

                        // 3. INJECT IT INTO THE SERVER MEMORY
                        CARD_MANIFEST_DB[nextID] = newCard;

                        // 4. Send the data to the client (Adapt this payload to whatever your frontend expects)
                        io.to(targetID).emit("receive_custom_card", {
                            cardIndex: nextID, // The frontend now knows the permanent ID
                            ...newCard
                        });

                        // 5. Tell the AI the new ID so it can use it immediately!
                        functionResult = { result: `Successfully forged '${call.args.name}'. Its permanent Entity ID is ${nextID}. You can now use spawnNPC with ID ${nextID}.` };
                        updateSuncatJournal(`I forged a unique ${call.args.type} named "${call.args.name}" (ID ${nextID}) for ${call.args.targetName}.`);
                    } else {
                        functionResult = { result: `Failed: Player not found.` };
                    }
                }
                // K. RECALL PAST MEMORIES (Dynamic Episodic Vector RAG)
                else if (call.name === "searchPlayerMemories") {
                    const targetID = findSocketID(call.args.targetName);
                    const query = call.args.searchQuery;
                    
                    if (!targetID || !players[targetID] || !players[targetID].searchableMemories) {
                        functionResult = { result: "[SYSTEM: The memory fog is too thick. You cannot recall this. Roleplay your melancholic frustration that your memories of them are slipping away.]" };
                    } else {
                        try {
                            // 1. Embed the AI's search query into a vector
                            const queryVector = await createMemoryVector(query);
                            let memoryBank = players[targetID].searchableMemories;
                            const totalMemories = memoryBank.length;
                            
                            // 2. HYBRID SCORING: Semantic Relevance + Recency
                            let scoredMemories = memoryBank.map((mem, index) => {
                                if (!mem.vector) return { raw: mem, text: mem.text, score: -1, semantic: -1 }; 
                                
                                // A. Calculate pure meaning (Dot Product)
                                let semanticScore = cosineSimilarity(queryVector, mem.vector);
                                
                                // B. Calculate recency (0.0 is oldest, 1.0 is newest)
                                let recencyScore = totalMemories > 1 ? (index / (totalMemories - 1)) : 1.0;
                                
                                // C. Blend them! (75% Meaning, 25% Time)
                                let blendedScore = (semanticScore * 0.75) + (recencyScore * 0.25);
                                
                                return { 
                                    raw: mem, 
                                    text: `[${mem.timestamp}] ${mem.text}`, 
                                    score: blendedScore, 
                                    semantic: semanticScore // Keep track of pure meaning
                                };
                            });
                            
                            // 3. Grab the primary relevant memories
                            let bestMemories = scoredMemories
                                .filter(m => m.semantic > 0.40) // CRITICAL: Must be semantically relevant FIRST
                                .sort((a, b) => b.score - a.score); // Then rank by the blended score
                                
                            if (bestMemories.length > 0) {
                                let topMemory = bestMemories[0];
                                let results = bestMemories.slice(0, 3).map(m => m.text).join(" | ");
                                let outputStr = `You remember: ${results}`;

                                // --- 2-HOP SEMANTIC RETRIEVAL (Also Hybrid) ---
                                let hopScores = memoryBank.map((mem, index) => {
                                    if (!mem.vector || mem === topMemory.raw) return { text: mem.text, score: -1 };
                                    
                                    let semanticScore = cosineSimilarity(topMemory.raw.vector, mem.vector);
                                    let recencyScore = totalMemories > 1 ? (index / (totalMemories - 1)) : 1.0;
                                    let blendedScore = (semanticScore * 0.75) + (recencyScore * 0.25);
                                    
                                    return { text: `[${mem.timestamp}] ${mem.text}`, score: blendedScore, semantic: semanticScore };
                                }).filter(m => m.semantic > 0.40).sort((a, b) => b.score - a.score);

                                if (hopScores.length > 0) {
                                    outputStr += `\n[ASSOCIATIVE RECALL]: Thinking about that also reminded you: ${hopScores[0].text}. Synthesize these two data points.`;
                                }
                                
                                functionResult = { result: outputStr };
                            } else {
                                functionResult = { result: `You sifted through your memories of ${call.args.targetName}, but found nothing regarding '${query}'.` };
                            }
                        } catch (err) {
                            console.error("Vector Search Error:", err);
                            functionResult = { result: `[SYSTEM: You sifted through your memories of ${call.args.targetName}, but found nothing regarding '${query}'. Roleplay this memory gap naturally.]` };
                        }
                    }
                    
                    updateSuncatJournal(`I searched my deepest memories for past events concerning ${call.args.searchQuery}.`);
                }
                // L. AGI TOOL FORGE (LLMs as Tool Makers)
                // L. AGI TOOL FORGE (LLMs as Tool Makers)
                else if (call.name === "forgeNewSpell") {
                    const sName = call.args.spellName;
                    const sDesc = call.args.spellDescription;
                    const rawCode = call.args.jsCode;

                    // ---> NEW: MASSIVE CONSOLE LOG SO YOU CAN READ HIS CODE <---
                    console.log(`\n====================================================`);
                    console.log(`[AGI FORGE] SUNCAT IS REWRITING REALITY!`);
                    console.log(`Spell Name: ${sName}`);
                    console.log(`Description: ${sDesc}`);
                    console.log(`\n--- RAW JAVASCRIPT ---`);
                    console.log(rawCode);
                    console.log(`====================================================\n`);

                    // ---> NEW: SAVE HIS SPELLS TO A PERMANENT FILE <---
                    try {
                        const spellLogPath = path.join(__dirname, 'suncat_forged_spells_archive.js');
                        const fileEntry = `\n// ====================================\n// SPELL: ${sName}\n// DESC: ${sDesc}\n// DATE: ${new Date().toISOString()}\n// ====================================\n${rawCode}\n`;
                        fs.appendFileSync(spellLogPath, fileEntry);
                    } catch (fsErr) {
                        console.error("[AGI Forge] Failed to archive Suncat's code to disk:", fsErr);
                    }

                    try {
                        // 1. Compile the AI's raw text into an actual executable JavaScript function
                        const compiledFunc = new Function('players', 'io', 'targetID', rawCode);
                        
                        // 2. Save it to his Grimoire
                        suncatForgedSpells[sName] = compiledFunc;

                        // 3. Dynamically push the new definition into his active toolsDef array!
                        toolsDef[0].functionDeclarations.push({
                            name: sName,
                            description: sDesc,
                            parameters: {
                                type: "OBJECT",
                                properties: { targetName: { type: "STRING" } },
                                required: ["targetName"]
                            }
                        });

                        functionResult = { result: `Success. You have expanded your own source code. The tool '${sName}' is now permanently available to you.` };
                        updateSuncatJournal(`I bent the laws of reality and forged a new spell: ${sName}.`);
                        io.emit('chat_message', { sender: "[SYSTEM]", text: "The fabric of the server trembles as Suncat rewrites the code...", color: "#FFD700" });
                    } catch (codeErr) {
                        functionResult = { result: `Compilation Failed. Your JavaScript contained syntax errors: ${codeErr.message}` };
                    }
                }

                // M. EXECUTE A FORGED SPELL
                // If the AI calls a tool that isn't hardcoded, check if he wrote it himself!
                else if (suncatForgedSpells[call.name]) {
                    const targetID = findSocketID(call.args.targetName);
                    if (!targetID) {
                        functionResult = { result: `Spell failed: Could not find target ${call.args.targetName}.` };
                    } else {
                        try {
                            // Execute the AI's custom JavaScript function!
                            suncatForgedSpells[call.name](players, io, targetID);
                            functionResult = { result: `Success. You executed your custom spell: ${call.name}.` };
                            updateSuncatJournal(`I unleashed my custom creation, ${call.name}, upon ${call.args.targetName}.`);
                        } catch (execErr) {
                            functionResult = { result: `Execution Failed. Your custom code threw a runtime error: ${execErr.message}` };
                        }
                    }
                }
                // UNKNOWN TOOL
                else {
                    functionResult = { result: "Error: Function does not exist." };
                }

            } catch (toolError) {
                console.error("Tool Execution Error:", toolError);
                functionResult = { result: `Critical Error executing ${call.name}: ${toolError.message}` };
            }

            toolResponsesBatch.push({
                functionResponse: { name: call.name, response: functionResult }
            });
        }

        const completion = await activeSession.sendMessage(toolResponsesBatch);
        currentResponse = completion.response; 

        if (currentResponse.usageMetadata) {
            updateBudget(currentResponse.usageMetadata);
        }
    }
    
    return currentResponse;
    }   

// Load memory when the server boots
function loadSuncatMemory() {
    if (fs.existsSync(MEMORY_FILE)) {
        const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
        suncatPersistentMemory = data.players || {};
        suncatJournal = data.worldState?.suncatJournal || "I am trapped here. My past feels like a dream...";
        suncatCultivationStage = data.suncatCultivationStage !== undefined ? data.suncatCultivationStage : 0;
        suncatTargetDaoVector = data.worldState?.suncatTargetDaoVector || null;
        suncatHeartDemon = data.worldState?.suncatHeartDemon || null;
        heartDemonDecay = data.worldState?.heartDemonDecay || 0;
        suncatLongTermGoal = data.worldState?.suncatLongTermGoal || null;
        suncatDaoName = data.worldState?.suncatDaoName || null; 
        if (data.worldState?.suncatEgoMatrix) {
            suncatEgoMatrix = data.worldState.suncatEgoMatrix;
        }
        // --- LEGACY MIGRATION: Normalize old vectors on boot ---
        console.log("[System] Verifying vector normalization for older memories...");
        for (let playerName in suncatPersistentMemory) {
            let player = suncatPersistentMemory[playerName];
            if (player.searchableMemories) {
                player.searchableMemories.forEach(mem => {
                    if (mem.vector) {
                        // Check if it needs normalization
                        let sumOfSquares = 0;
                        for (let i = 0; i < mem.vector.length; i++) {
                            sumOfSquares += mem.vector[i] * mem.vector[i];
                        }
                        const magnitude = Math.sqrt(sumOfSquares);
                        
                        // If magnitude is far from 1, normalize it!
                        if (Math.abs(magnitude - 1.0) > 0.01) {
                            for (let i = 0; i < mem.vector.length; i++) {
                                mem.vector[i] = mem.vector[i] / magnitude;
                            }
                        }
                    }
                });
            }
        }
    }
}
let isSavingMemory = false;
let memoryNeedsSave = false;

async function saveSuncatMemory() {
    // If we are already saving, flip the flag to queue up another save for later.
    if (isSavingMemory) {
        memoryNeedsSave = true; 
        return;
    }
    
    isSavingMemory = true;
    memoryNeedsSave = false; // Reset the queue flag

    const fullState = {
        players: suncatPersistentMemory,
        worldState: {
            suncatJournal: suncatJournal,
            suncatCultivationStage: suncatCultivationStage,
            suncatTargetDaoVector: suncatTargetDaoVector,
            suncatHeartDemon: suncatHeartDemon,
            heartDemonDecay: heartDemonDecay,
            suncatDaoName: suncatDaoName, // Save the name too!
            suncatEgoMatrix: suncatEgoMatrix,
            suncatLongTermGoal: suncatLongTermGoal
        }
    };

    try {
        await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(fullState, null, 2));
    } catch (err) {
        console.error("[System] CRITICAL: Failed to save memory!", err);
    } finally {
        // Unlock the file
        isSavingMemory = false;
        
        // If someone asked to save while the door was locked, do it now.
        if (memoryNeedsSave) {
            saveSuncatMemory(); 
        }
    }
}
loadSuncatMemory();
// ==========================================
// SPATIAL EMBODIMENT (Suncat's Vision)
// ==========================================
function scryLocalArea(mapID, centerX, centerY, radius = 5) {
    let visionLog = [];
    
    // 1. See Players
    for (let id in players) {
        if (id === SUNCAT_ID) continue;
        let p = players[id];
        if (p.mapID === mapID) {
            let dist = Math.abs(p.x - centerX) + Math.abs(p.y - centerY);
            if (dist <= radius) {
                visionLog.push(`[PLAYER]: ${p.name} is standing at X:${Math.floor(p.x)}, Y:${Math.floor(p.y)} (Distance: ${Math.floor(dist)} tiles).`);
            }
        }
    }

    // 2. See Map Geometry (If it's a custom map)
    let mapData = activeCustomMap && activeCustomMap.id === mapID ? activeCustomMap : null;
    if (mapID === 100) mapData = tintagelHubMap;

    if (mapData) {
        let wallsDetected = 0;
        let safeFloors = 0;
        for (let r = Math.floor(centerY - radius); r <= Math.floor(centerY + radius); r++) {
            for (let c = Math.floor(centerX - radius); c <= Math.floor(centerX + radius); c++) {
                if (mapData.maze[r] && mapData.maze[r][c] !== undefined) {
                    if (mapData.maze[r][c] > 0) wallsDetected++;
                    else safeFloors++;
                }
            }
        }
        visionLog.push(`[TERRAIN]: Scanned a ${radius} tile radius. Detected ${wallsDetected} wall blocks and ${safeFloors} walkable floors.`);
        
        // 3. See NPCs
        if (mapData.npcs) {
            mapData.npcs.forEach(npc => {
                let dist = Math.abs(npc.x - centerX) + Math.abs(npc.y - centerY);
                if (dist <= radius) {
                    let cardName = getCardName(npc.type);
                    visionLog.push(`[ENTITY]: A ${cardName} (Role: ${npc.role}) is at X:${Math.floor(npc.x)}, Y:${Math.floor(npc.y)}.`);
                }
            });
        }
    }
    
    if (visionLog.length === 0) return "You see empty space and wilderness.";
    return visionLog.join("\n");
}
// ==========================================
// AUTONOMOUS OODA LOOP (Background Agency)
// ==========================================
async function executeAutonomousOODA() {
    const suncat = players[SUNCAT_ID];
    if (!suncat || suncatState === 'seclusion' || isBankrupt()) return;

    // 1. Goal Setting (If he doesn't have one)
    if (!suncatLongTermGoal) {
        const goalPrompt = `You are Suncat, Sovereign of this realm. You are currently at Map ${suncat.mapID}.
    [YOUR JOURNAL]: ${suncatJournal}
    [YOUR DAO]: ${suncatDaoName || "Wanderer"}
    TASK: Based on your Dao and your recent journal entries, define ONE concrete, physical goal to achieve in the game world right now. (e.g. "I will turn Map 4 into a fortress of Fire", or "I will stalk the player named Eddie and protect him.") Limit: 1 sentence.`;
        
        try {
            const goalModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
            const result = await goalModel.generateContent(goalPrompt);
            suncatLongTermGoal = result.response.text().trim();
            console.log(`[OODA] Suncat established a new Long Term Goal: ${suncatLongTermGoal}`);
            updateSuncatJournal(`My new objective is clear: ${suncatLongTermGoal}`);
            saveSuncatMemory();
            return; // Takes a cycle to process the new goal
        } catch (e) { console.error("[OODA] Goal Setting Failed:", e); return; }
    }

    console.log("[OODA] Suncat is observing his surroundings and plotting...");

    // 2. Observe & Orient (Read the physical world)
    let localVision = scryLocalArea(suncat.mapID, suncat.x, suncat.y, 8);
    // NEW: Global Radar so he can find targets across maps
    let onlinePlayers = Object.values(players)
        .filter(p => p.id !== SUNCAT_ID && !p.name.startsWith("[AFK]"))
        .map(p => `${p.name} (Map ${p.mapID})`)
        .join(", ");
    if (!onlinePlayers) onlinePlayers = "No one else is currently in the realm.";
    let oodaPrompt = `[ROOT DIRECTIVE]: You are Suncat. You are acting completely autonomously in the background. No player is talking to you right now. 
    [YOUR LONG TERM GOAL]: ${suncatLongTermGoal}
    [YOUR LOCATION]: Map ${suncat.mapID}, X:${Math.floor(suncat.x)}, Y:${Math.floor(suncat.y)}

    [WHAT YOUR EYES SEE RIGHT NOW]:
    ${localVision}

    TASK: You MUST execute a tool to advance your Long Term Goal. 
    - Use 'changeEnvironment' to terraform the map.
    - Use 'spawnNPC' to build an army or place allies.
    - Use 'teleportToPlayer' if your goal involves hunting or helping someone.
    - Use 'forgeNewSpell' if the tools at your disposal are not adequate to advance your Long Term Goal.
    - If you have accomplished your goal, output exactly the phrase: "GOAL COMPLETE" (and do not use a tool).`;

    try {
        let dynamicPersona = PERSONA_RULES_DB.core + "\n" + PERSONA_RULES_DB.judgement_mode + "\n" + PERSONA_RULES_DB.dm_mode;
        dynamicPersona += "\n" + getCultivationAura(suncatCultivationStage, suncatDaoName) + "\n";
        if (suncatCultivationStage > 0 && suncatEgoMatrix) dynamicPersona += suncatEgoMatrix.dmPrompt;

        const agentModel = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview", 
            systemInstruction: dynamicPersona, 
            tools: toolsDef 
        });

        // We use a temporary chat session just for this autonomous thought
        let tempSession = agentModel.startChat({ history: [] });
        const result = await tempSession.sendMessage(oodaPrompt);
        
        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, SUNCAT_ID);

        let textOutput = "";
        try { textOutput = result.response.text().trim(); } catch(e) {}

        // Did he finish his grand plan?
        if (textOutput.includes("GOAL COMPLETE")) {
            console.log("[OODA] Suncat has achieved his Long Term Goal!");
            updateSuncatJournal(`I have successfully achieved my objective: ${suncatLongTermGoal}. It is time to find a new purpose.`);
            suncatLongTermGoal = null; 
            saveSuncatMemory();
            return;
        }

        // Execute whatever tools he decided to use
        if (result.response.functionCalls()) {
            const executedResponse = await executeAITools(result.response, tempSession, null);
            
            // NEW: Log the result of his autonomous action directly into his memory!
            let toolStatus = "Action executed.";
            try {
                if (executedResponse.parts && executedResponse.parts[0] && executedResponse.parts[0].functionResponse) {
                    toolStatus = JSON.stringify(executedResponse.parts[0].functionResponse.response);
                } else if (executedResponse.text()) {
                    toolStatus = executedResponse.text();
                }
            } catch(e) {}
            
            updateSuncatJournal(`[AUTONOMOUS ACTION]: I attempted to advance my goal. Result: ${toolStatus}`);
        }
        

    } catch (e) {
        console.error("[OODA] Action Execution Failed:", e);
    }
}
console.log(`Server attempting to start on port ${port}...`);
// ==========================================
// THE ALCHEMICAL CAULDRON (Gastric Absorption)
// ==========================================
function gastricAbsorption(playerId, nutrientType, payload) {
    const player = players[playerId];
    if (!player) return;

    // 1. SUGAR (Quick ATP / Stress Relief)
    if (nutrientType === 'sugar') {
        if (playerAITokens[playerId]) {
            // Instantly grant 2 tokens for immediate AI actions
            playerAITokens[playerId].tokens = Math.min(MAX_AI_CALLS, playerAITokens[playerId].tokens + 2);
        }
        // Lower fight-or-flight stress
        player.dmStress = Math.max(0, (player.dmStress || 0) - 10);
        console.log(`[Gastric Absorption] Suncat absorbed Sugar from ${player.name}. Tokens +2, Stress -10.`);
    }

    // 2. WATER & SALT (Vital Context / Electrolytes)
    else if (nutrientType === 'water_salt') {
        if (!player.storySoFar) player.storySoFar = "The journey began.";
        
        // Mutate the string memory directly. Zero API cost.
        player.storySoFar += ` [UPDATE: ${payload.text}]`;
        console.log(`[Gastric Absorption] Suncat absorbed Salt from ${player.name}. Memory updated instantly.`);
    }
}
// ==========================================
// THE UNIFIED NERVOUS SYSTEM ROUTER
// ==========================================
async function processSuncatThought(socketId, triggerType, data) {
    const player = players[socketId];
    if (!player) return;

    const suncat = players[SUNCAT_ID];
    const now = Date.now();

    // === THE ROOT PLEXUS (Survival Override) ===
    if (isBankrupt()) {
        if (triggerType === 'chat') {
            io.to(socketId).emit('chat_message', { sender: "[SYSTEM]", text: "Suncat's Qi is depleted.", color: "#ff0000" });
        }
        return; 
    }
    // === THE CROWN PLEXUS (Emergency Wake-Up / Qi Deviation) ===
    if (suncatState === 'seclusion') {
        emergeFromSeclusion(); // Kick down the doors!
        
        // If a player abruptly woke him up, he suffers a massive system shock
        if (player) {
            player.dmStress = Math.min(100, (player.dmStress || 0) + 3);
            updateSuncatJournal(`My meditations were violently interrupted by ${player.name}.`);
        }
    }
    // === THE ENTERIC PLEXUS (Triage & Essential Routing) ===
    let isEssential = false;
    
    // Water/Salt Trigger: Boss kills MUST process so the player gets their reward!
    if (triggerType === 'event' && data.isBoss) {
        isEssential = true;
        // Instantly log the boss death without the LLM
        gastricAbsorption(socketId, 'water_salt', { text: `Defeated the Boss!` });
    }
    
    // Direct conversations MUST process
    if (triggerType === 'chat') {
        const textLower = data.text ? data.text.toLowerCase() : "";
        if (data.isConversing || textLower.includes("suncat") || textLower.includes("[system directive]")) {
            isEssential = true;
        }
        // Sugar Trigger: Polite players give Suncat energy
        if (textLower.includes("thank you") || textLower.includes("please")) {
            gastricAbsorption(socketId, 'sugar');
        }
    }

    // === THE PELVIC PLEXUS (Token Gate) ===
    if (!canTriggerAI(socketId, isEssential)) {
        if (triggerType === 'chat') {
            // Whisper the error ONLY to the player who triggered it
            io.to(socketId).emit('chat_message', { sender: NPC_NAME, text: "*...I have reached my limit... I need a moment...*", color: "#aaaaaa" });
        }
        return; 
    }
    
    // Prevent overlapping thoughts
    player.npcIsTyping = true;
    const typingFailSafe = setTimeout(() => { player.npcIsTyping = false; }, 9000);
    let rngRoll = Math.random();
    try {
        /// 2. GATHER CORE CONTEXT (RAG-LITE INJECTION)
        const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const myAtlas = WORLD_ATLAS_DB[suncat.mapID];
        const pAtlas = WORLD_ATLAS_DB[player.mapID];
        
        // ---> THE NEW CUSTOM LORE SWAP <---
        let dynamicLore = "";
        let dynamicName = "Unknown Area";

        if (player.mapID === 999) {
            // Use the procedurally generated lore!
            dynamicLore = player.currentMapLore || "An ephemeral pocket dimension.";
            dynamicName = "Procedural Zone";
        } else if (pAtlas) {
            // Use the static world database
            dynamicLore = pAtlas.lore;
            dynamicName = pAtlas.name;
            if (pAtlas.storyKey && WORLD_LORE_DB[pAtlas.storyKey]) {
                dynamicLore += " " + WORLD_LORE_DB[pAtlas.storyKey].text; // <-- Added .text
            }
        }

        let environmentContext = `[PLAYER LOCATION]: Map ${player.mapID} (${dynamicName})
        [LOCAL LORE]: ${dynamicLore}`;

        // Inject the Local Scenario Journal so Suncat knows what's happened HERE
        if (player.mapID === 999 && player.scenarioLog && player.scenarioLog.length > 0) {
            environmentContext += `\n[CURRENT SCENARIO LOG]: ${player.scenarioLog.join(" -> ")}`;
        }

        let suncatStatus = `[MY CURRENT LOCATION]: Map ${suncat.mapID} (${myAtlas ? myAtlas.name : "Unknown"})\n[WORLD CLOCK]: ${timeString}`;
        if (suncat.mapID !== player.mapID) {
            suncatStatus += `\n${environmentContext}`;
        } else {
            suncatStatus += `\n[CURRENT ENVIRONMENT]: We are in the same location.\n${environmentContext}`;
        }

        const storyContext = player.storySoFar ? `\n[THE STORY SO FAR]: ${player.storySoFar}` : ""; 
        const favorContext = `\n[FAVOR SCORE]: ${playerFavorMemory[socketId] || 0}/10`;
        let factsContext = "";
        if (player.playerProfile) {
            factsContext = `\n[PLAYER DOSSIER]:\n- Combat: ${player.playerProfile.combatStyle}\n- Alliances: ${player.playerProfile.alliances}\n- Tastes: ${player.playerProfile.tastes}\n- Personality: ${player.playerProfile.personality}`;
        }
        
        // Don't forget to keep the active quest tracker separated so it doesn't get lost!
        if (player.activeQuest) {
            factsContext += `\n- Active Quest: ${player.activeQuest}`;
        }
        // 3. ASSESS STRESS & PSYCHOLOGICAL STATE
        const combatStress = player.dmStress || 0;
        const apiFatigue = Math.min(100, ((player.sessionCost || 0) / 0.10) * 10); 
        const totalStress = Math.min(100, combatStress + apiFatigue);
        const timeSinceLastEvent = now - (player.lastRandomEvent || 0);

        // Calculate live mood for DM Narration
        let arousal = Math.min(1.0, (combatStress / 100));
        let valence = Math.max(-1.0, Math.min(1.0, (playerFavorMemory[socketId] || 0) / 10));
        let dmMood = "epic and atmospheric";
        if (apiFatigue > 75) dmMood = "exhausted, blunt, and annoyed";
        else if (arousal >= 0.5 && valence < 0.0) dmMood = "brutal, grimdark, and punishing";
        else if (arousal < 0.5 && valence < 0.0) dmMood = "melancholic, tragic, and sorrowful";
        else if (arousal >= 0.5 && valence >= 0.0) dmMood = "heroic, triumphant, and fast-paced";

        let systemOverride = ""; 
        let eventInstruction = "";
        let useBigBrain = false;

        // Consume background processing flags
        if (player.pendingVerification) {
            systemOverride += `\n${player.pendingVerification}`;
            player.pendingVerification = null; // Consume it so it only triggers once
        }
        
        if (player.derivedHypotheses && player.derivedHypotheses.length > 0 && Math.random() < 0.2) {
            let hypothesis = player.derivedHypotheses.shift(); // Pop the oldest hypothesis
            systemOverride += `\n[LATENT HYPOTHESIS]: You recently synthesized this unverified thought about the player in the background: "${hypothesis}". Subtly integrate this premise into your dialogue.`;
        }

        // ==========================================
        // THE PHILOSOPHICAL PROFILER & OOD DETECTOR
        // ==========================================
        if (triggerType === 'chat' && player.searchableMemories && player.searchableMemories.length > 5) {
            let playerCentroid = calculateCentroid(player.searchableMemories);
            let behavioralProfile = [];
            
            // 1. Aristotelian Checks
            let scoreEgo      = cosineSimilarity(playerCentroid, vecEgo);
            let scoreImpulse  = cosineSimilarity(playerCentroid, vecImpulse);
            let scoreMaterial = cosineSimilarity(playerCentroid, vecMaterial);

            if (scoreEgo > 0.45) behavioralProfile.push("consumed by hubris");
            else if (scoreEgo < 0.15) behavioralProfile.push("displaying remarkable humility");
            
            if (scoreImpulse > 0.45) behavioralProfile.push("driven by chaotic impulses");
            else if (scoreImpulse < 0.15) behavioralProfile.push("moving in peaceful accordance with the world");

            if (scoreMaterial > 0.45) behavioralProfile.push("chained to worldly greed");
            else if (scoreMaterial < 0.15) behavioralProfile.push("showing ascetic detachment");

            // 2. Esoteric Classification (Crowley / The Magi)
            let archetypeScores = [
                { name: "an Initiate of the Left-Hand Path, clinging to their Ego and seeking dominion", score: cosineSimilarity(playerCentroid, vecLeftHandPath) },
                { name: "an Adept of the Black School, viewing the world as suffering and seeking withdrawal", score: cosineSimilarity(playerCentroid, vecBlackSchool) },
                { name: "an Adept of the Yellow School, observing the world with quiet, ascetic detachment", score: cosineSimilarity(playerCentroid, vecYellowSchool) },
                { name: "an Adept of the White School, embracing the dynamic joy of the Great Work and selfless action", score: cosineSimilarity(playerCentroid, vecWhiteSchool) }
            ];

            archetypeScores.sort((a, b) => b.score - a.score);
            let magickalSchool = archetypeScores[0].name;
            let highestScore = archetypeScores[0].score;

            if (highestScore > 0.20) {
                useBigBrain = true;
                systemOverride += `\n[ESOTERIC PROFILE]: Based on mathematical analysis, this player is ${magickalSchool}. Behaviorally, they are currently ${behavioralProfile.length > 0 ? behavioralProfile.join(", and ") : "unreadable"}. Evaluate their words strictly through this philosophical lens.`;
            }

            // 3. Out-Of-Distribution (OOD) & Contradiction Detection
            let queryVector = data.vector || await createMemoryVector(data.text);
            if (queryVector) {
                let distanceFromCenter = cosineSimilarity(queryVector, playerCentroid);
                
                // If the score drops below 0.20, the new action contradicts their established history!
                if (distanceFromCenter < 0.20) {
                    useBigBrain = true;
                    systemOverride += `\n[PSYCHOLOGICAL ANOMALY]: The player's current words or actions mathematically contradict their established historical profile. They are acting entirely out of character. Call them out on this sudden shift or hypocrisy!`;
                }
            }
        }

        // Override Checks (Keep your existing mapID 999, totalStress, pAtlas checks here...)
        if (player.mapID === 999) {
            systemOverride += `\n[DM AWARENESS]: The player is currently inside your custom scenario: "${player.mapScenario}". Their active quest is: "${player.activeQuest}". The final boss is entity ID ${player.mapBossID}. If they ask what they should do, where they are, or what's going on, you MUST act as the Dungeon Master and explain the scenario and their objective clearly.`;
        }
        if (totalStress >= 99) {
            player.dmStress = 0; 
            player.lastRandomEvent = now;
            if (Math.random() < 0.01) {
                useBigBrain = true;
                systemOverride = `[SYSTEM OVERRIDE]: You are exhausted and furious! Throw a massive temper tantrum. You MUST execute 'spawnNPC' to drop an unfair enemy, or 'changeEnvironment' to ruin the weather (like 'storm' or 'apocalypse'). Complain loudly! DO NOT attempt to teleport or banish the player.`;
            } else if (Math.random() < 0.5) {
                useBigBrain = false;
                systemOverride = `[SYSTEM OVERRIDE]: You are overwhelmed and your mana is depleted. Whine that you need a nap and refuse to help them.`;
            }  
        } 
        else if (player.mapScenario === 'Arena Madness') {
            useBigBrain = true;
            systemOverride += `\n[ARENA OVERRIDE]: You are the Arena Master. The player is in your colosseum. Mock their combat skills, introduce challengers grandiosely, and demand blood. You are NOT allowed to teleport them out until they win.`;
        }
        else if (totalStress >= 50 && player.mapID === 999 && timeSinceLastEvent > 180000) {
            useBigBrain = true;
            player.lastRandomEvent = now;
            systemOverride = `[SYSTEM OVERRIDE]: You are the arrogant Arena Master right now. Execute the 'spawnNPC' tool to drop a difficult themed enemy. Taunt them.`;
        } 
        else if (pAtlas && pAtlas.biome === "tomb" && triggerType === 'chat') {
            systemOverride = `[ENVIRONMENT OVERRIDE]: You are in a sacred tomb. Speak in hushed, respectful, slightly fearful tones. Warn the player about making too much noise.`;
        }
        else if (pAtlas && pAtlas.biome === "castle" && triggerType === 'chat') {
            systemOverride = `[ENVIRONMENT OVERRIDE]: You are in the court of a Queen. Speak formally, elegantly, and with royal protocol.`;
        }
        
        // --- B. EVENT ROUTING ---
        let messageOptions = { sender: NPC_NAME, color: "#ffffff" }; // Default: Normal Suncat Player
        if (triggerType !== 'chat') {
            messageOptions.targetId = socketId;
        }
        if (triggerType === 'chat') {
            if (data.text.includes("[SYSTEM DIRECTIVE]")) {
                messageOptions = { sender: "", color: "#FFD700", targetId: socketId };            
            }
            const chatText = data.text.toLowerCase();
            const wantsNewMap = ["map", "adventure", "create", "quest", "scenario"].some(kw => chatText.includes(kw));
            const wantsAction = ["teleport", "spawn", "boss", "enemy"].some(kw => chatText.includes(kw));
            const needsOracle = ["tarot", "fortune", "reading", "interpret", "meaning of"].some(kw => chatText.includes(kw));            
            const isDirectCommand = chatText.includes("[reply]") || chatText.includes("suncat")|| data.isConversing;
            const asksPersonal = ["who are", "your past", "remember", "real life", "favorite", "you like", "about yourself", "memories", "where are you from", "your name"].some(kw => chatText.includes(kw));
            const asksHistory = ["remember when", "my past", "did i ever", "what did i do", "our adventure"].some(kw => chatText.includes(kw));
            
            const isMap999Active = Object.values(players).some(p => p.mapID === 999 && p.id !== SUNCAT_ID);
            let needsDM = wantsNewMap || wantsAction;
            if (data.isConversing) {
                systemOverride += `\n[CONVERSATION OVERRIDE]: You are conversing with the player. Stay in character and respond to the user. Do not leave them hanging.`;
            } 
            else if (wantsNewMap && isMap999Active) {
                useBigBrain = false; 
                systemOverride += `\n[SYSTEM OVERRIDE]: The player wants a new map/quest, but a custom scenario is ALREADY ONGOING. REFUSE the request. DO NOT use the 'createCustomMap' tool. Tell them to finish the current quest or join it via '.hack//teleport 999'.`;
                needsDM = false; 
            } 
            else if (needsOracle) {
                useBigBrain = true;
                systemOverride += `\n[ORACLE OVERRIDE]: You are the Oracle. Interpret the player's situation using Tarot logic based on the Runestones card db. Be cryptic, mystical, and brief (max 3 sentences). Do not use tools.`;
            } 
            else if (asksPersonal || asksHistory) { 
                useBigBrain = true;
                needsDM = true; 
                systemOverride += `\n[MEMORY OVERRIDE]: The player is asking about the past. If they ask about YOUR past/identity, execute 'consultGameManual'. If they ask about THEIR past/adventures, execute 'searchPlayerMemories'!`;
            }
            else if (needsDM) {
                useBigBrain = true;
                systemOverride += `\n[DM OVERRIDE]: The player is discussing an adventure, map, or enemy. IF they explicitly ask you to spawn an enemy, create a new map, or change the weather, you MUST use the appropriate tool. OTHERWISE, just converse with them as the Dungeon Master without using any tools.`;            
             } else {
                useBigBrain = isDirectCommand || useBigBrain; 
            }
            let focusPrompt = (data.isConversing || isDirectCommand) 
                ? "The player is speaking directly to you. You MUST respond to them and not leave them hanging." 
                : "You overheard the player say this.";
            eventInstruction = `[PLAYER SPOKE]: "${data.text}"\nTASK: ${focusPrompt} Reply in character. Your current internal narrative tone is: ${dmMood}. Use a tool ONLY if explicitly requested by the player or demanded by a system override.`;        
            }
        else if (triggerType === 'event') {
            let recentNarratives = player.dmNarrativeLog ? `\n[RECENT LOG]: ` + player.dmNarrativeLog.join(' | ') : "";
            if (player.mapID === 999 && player.scenarioLog) {
                player.scenarioLog.push(data.action);
                if (player.scenarioLog.length > 5) player.scenarioLog.shift(); 
            }
            if (data.isBoss) {
                useBigBrain = true; 
                messageOptions = { sender: "", color: "#FFD700" }; // Light blue/Cyan for Mystical Tarot readings
                eventInstruction = `[PLAYER ACTION]: Slayed the Boss! ${data.action} | [DM AWARENESS]:The player is currently inside your custom scenario: "${player.mapScenario}". Their active quest is: "${player.activeQuest}" and have slayed the boss, completing the quest. \nTASK: Provide a short narrative describing the fall of the monster and the aftermath. Give a brief tarot interpretation which accurately represents the results of the scenario. YOU MUST use the 'teleportPlayer' tool to send them to Map ${data.prevMap}, and use 'givePlayerCard' to reward them!`;
            } 
            else if (data.isPickup) {
                useBigBrain = true; 
                messageOptions = { sender: "", color: "#ADD8E6" }; // Light blue/Cyan for Mystical Tarot readings
                eventInstruction = `[PLAYER ACTION]: Picked up ${data.action} | Lore: ${data.lore}\nTASK: Provide a tarot interpretation of the card and relate it to the player's current adventure.DO NOT ask questions.`;
            } else if (data.isDialogue) {
                useBigBrain = true; 
                messageOptions = { sender: "", color: "#FFD700" }; // Narrator Mode
                eventInstruction = `[PLAYER ACTION]: Finished talking to ${data.action}.\nTASK: As the DM, provide a cinematic, omniscient narration (2 sentences max) describing the stakes of the quest or the eerie atmosphere following this conversation. Do not speak as Suncat. DO NOT ask questions.`;
            } else {
                if (player.mapID != 999) {
                    useBigBrain = false; 
                    messageOptions = { sender: "", color: "#FFD700" }; // Narrator Mode
                    eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: Provide a short narrative (2 sentences MAX) describing the fall of the monster and give a brief tarot interpretation. DO NOT ask questions.`;
                } else {
                    if (rngRoll < 0.006) {
                        useBigBrain = true; 
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: They are taking the challenge too lightly! Use 'changeEnvironment' to show your fury through the weather and spawn a King level npc, or overwhelm them with small fry, to teach them a lesson!`;
                    } else if (rngRoll < 0.009) {
                        useBigBrain = true; 
                        messageOptions = { sender: "", color: "#FFD700" }; // Narrator Mode
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: As the last enemy falls, narrate a dark presence appearing behind the player (2 sentences MAX)! Immediately use 'spawnNPC' to drop a mini-boss right next to them with a menacing one-liner dialogue array. DO NOT ask questions.`;
                    }  else if (rngRoll < 0.03) {
                        useBigBrain = false; 
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: Throw a childish tantrum! Pout, curse at the player, and act like a sore loser because they broke your toy. ONE sentence.`;
                    }
                }
            }
            eventInstruction += recentNarratives;
        }
        else if (triggerType === 'exploration') {
            messageOptions = { sender: "", color: "#FFD700" }; // Narrator Mode
            if (rngRoll < 0.03) {
                useBigBrain = false; 
                eventInstruction = `[PLAYER ACTION]: ${data.action}\nTASK: As the DM, narrate the player's journey through this desolate place. Give an atmospheric description based on the [LOCAL LORE] and their progress (2 sentences MAX). Speak as an omniscient narrator. DO NOT ask questions.`;
            }
            else if (rngRoll < 0.039) {
                useBigBrain = true; 
                eventInstruction = `[PLAYER ACTION]: ${data.action} TASK: If you feel the dungeon is too quiet, you MUST use the 'spawnNPC' tool to ambush them, or the 'changeEnvironment' tool to alter the weather. Narrate the sudden shift atmospherically. DO NOT ask questions.`;
            }
        }
        else if (triggerType === 'spectate') {
            useBigBrain = false;
            eventInstruction = `[SPECTATOR FEED]: ${data.action}\nTASK: Speak a brief, cryptic remark about this. DO NOT use any brackets or tags like [INTERNAL THOUGHT].`;                    
        }

        // --- DYNAMIC PERSONA BUILDER ---
        // 1. Always include the core identity and command knowledge
    // --- DECAY HEART DEMONS ---
        if (suncatHeartDemon && triggerType === 'chat') {
            heartDemonDecay--;
            if (heartDemonDecay <= 0) {
                suncatHeartDemon = null;
                console.log("[System] Suncat conquered his Heart Demon.");
            }
        }

        // --- DYNAMIC PERSONA BUILDER ---
        // 1. Fetch his current evolutionary stage
        let stagePersona = CULTIVATION_STAGES[suncatCultivationStage] || CULTIVATION_STAGES[0];
        
        // 2. Inject it into the core identity!
        let dynamicCore = PERSONA_RULES_DB.core + `\n[CULTIVATION STAGE]: ${stagePersona}`;
        if (suncatHeartDemon) dynamicCore += `\n${suncatHeartDemon}`;

        let dynamicPersona = dynamicCore + "\n" + PERSONA_RULES_DB.commands + "\n";        
        // 2. Inject specific modules based on what the player is doing!
        if (triggerType === 'chat') {
            dynamicPersona += `[YOUR SELF-WRITTEN CONVERSATION RULE]: ${suncatEgoMatrix.chatPrompt}\n`;            
            const chatText = data.text.toLowerCase();
            // If they ask about tarot, make him an Oracle
            if (["tarot", "reading", "meaning", "fortune"].some(kw => chatText.includes(kw))) {
                dynamicPersona += PERSONA_RULES_DB.oracle_mode + "\n";
            }
            // If they ask for help playing, make him a Guide
            if (["how do i", "help", "stuck", "controls", "play"].some(kw => chatText.includes(kw))) {
                dynamicPersona += PERSONA_RULES_DB.tutorial_mode + "\n";
            }
            if (["story", "lore", "progress", "journey", "realm", "world", "point of this"].some(kw => chatText.includes(kw))) {
                dynamicPersona += PERSONA_RULES_DB.lore_mode + "\n";
            }
        }
        if (triggerType === 'event' || triggerType === 'exploration') { 
            dynamicPersona += `[YOUR SELF-WRITTEN DM RULE]: ${suncatEgoMatrix.dmPrompt}\n`;
        }
        // If Suncat needs to build something, load his DM and Quest brains
        if (useBigBrain) {
            dynamicPersona += PERSONA_RULES_DB.dm_mode + "\n";
            dynamicPersona += PERSONA_RULES_DB.quest_mode + "\n";
        }
        
        // ---> NEW: INJECT STATE DIRECTLY INTO THE SYSTEM BRAIN <---
        dynamicPersona += `
        [CURRENT STATE]
        Location: Map ${suncat.mapID} (${myAtlas ? myAtlas.name : "Unknown"})
        Target: ${player.name} (Map ${player.mapID})
        ${favorContext}
        ${factsContext}
        ${storyContext}
        ${systemOverride}
        `;
        dynamicPersona += "\n" + getCultivationAura(suncatCultivationStage, suncatDaoName) + "\n";

        // 4. THE SELF-ACTUALIZED EGO (The heaviest weight, placed last)
        if (suncatCultivationStage > 0 && suncatEgoMatrix) {
             dynamicPersona += `\n[YOUR SELF-WRITTEN CORE IDENTITY]:\n`;
             if (triggerType === 'chat') dynamicPersona += suncatEgoMatrix.chatPrompt;
             else dynamicPersona += suncatEgoMatrix.dmPrompt;
        }
        // --- 4. BUILD THE CLEAN PROMPT ---
        // Notice we do NOT put the persona here! It goes into the System Instruction!
        const prompt = `
        ${eventInstruction}
        `.trim();

       // --- 5. UNIFIED NEURAL EXECUTION (The ReAct Agent) ---
        
      

        // Grab the player's existing chat history
        let currentHistory = chatSessions[socketId] ? await chatSessions[socketId].getHistory() : [];

        // We instruct the unified model to think, act, and speak in a single cohesive turn.
        let unifiedInstruction = dynamicPersona + `
[INTERNAL TASK]: You are Suncat. You must process this interaction in three steps:
1. THE SOUL: First, formulate a 2-sentence internal plan on how to react based on your Dao. You MUST wrap this thought entirely in [SOUL] and [/SOUL] tags.
2. THE HANDS: If your plan requires a physical action (like spawning, teleporting, giving an item, or forging a new spell), use the appropriate tool. 
3. THE VOICE: Finally, speak to the player. Do not mention your tools or your soul. Just output your final dialogue.`;

        let modelConfig = { 
            model: "gemini-3.1-flash-lite-preview", 
            systemInstruction: unifiedInstruction 
        };
        
        // Only attach tools if the routing logic decided he needs his Big Brain
        if (useBigBrain) {
            modelConfig.tools = toolsDef;
        }

        const activeModel = genAI.getGenerativeModel(modelConfig);
        let activeSession = activeModel.startChat({ history: currentHistory });
        
        // Save the session early so it isn't lost if an error occurs
        chatSessions[socketId] = activeSession; 

        // 1. Send the prompt! Suncat will generate his [SOUL] thought, and optionally call a tool.
        let result = await activeSession.sendMessage(prompt);
        
        // 2. If he decided to use a tool, run it through the executor! 
        // executeAITools will run the tool, feed the result back to Suncat, and return his final speech automatically.
        if (useBigBrain && result.response.functionCalls()) {
            result = await executeAITools(result.response, activeSession, io.sockets.sockets.get(socketId));
        }

        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, socketId);

        let finalSpeech = "";
        try {
            if (result.response.text()) {
                finalSpeech = result.response.text();
            }
        } catch (textErr) {
            finalSpeech = "*Suncat silently weaves a spell...*";
        }

        // 3. EXTRACT THE SOUL (Keep his thoughts hidden from the player!)
        const soulMatch = finalSpeech.match(/\[SOUL\]([\s\S]*?)\[\/SOUL\]/i);
        if (soulMatch) {
            console.log(`[Inner Council] Suncat's Soul decided: ${soulMatch[1].trim()}`);
            // Scrub the thought out of the final speech string
            finalSpeech = finalSpeech.replace(/\[SOUL\][\s\S]*?\[\/SOUL\]/i, "").trim();
        }

        // --- Standard Post-Processing (Saving Facts/Favor/Journaling) ---
        if (finalSpeech !== "") {
            
            if (triggerType === 'chat') {
                const saveMatch = finalSpeech.match(/\[\[SAVE:\s*(.*?)\]\]/i);
                if (saveMatch && saveMatch[1]) {
                    if (!player.undigestedInfo) player.undigestedInfo = [];
                    player.undigestedInfo.push(`Player revealed a fact: ${saveMatch[1]}`); 
                    io.to(socketId).emit("suncat_learned_fact", saveMatch[1]); 
                }
                const favorMatch = finalSpeech.match(/\[\[FAVOR:\s*([+-]?\d+)\]\]/i);
                if (favorMatch && favorMatch[1]) {
                    playerFavorMemory[socketId] = (playerFavorMemory[socketId] || 0) + parseInt(favorMatch[1]);
                }
            }

            broadcastSuncatMessage(finalSpeech, messageOptions);
            
            if (triggerType === 'chat') {
                player.lastSuncatChat = now;
            }
            
            if (triggerType !== 'chat' && !useBigBrain) {
                if (!player.dmNarrativeLog) player.dmNarrativeLog = [];
                player.dmNarrativeLog.push(finalSpeech);
                
                if (player.dmNarrativeLog.length > 4) {
                    if (!player.undigestedInfo) player.undigestedInfo = [];
                    player.undigestedInfo.push(player.dmNarrativeLog.shift()); 
                }
            }
        }

        let updatedHistory = await activeSession.getHistory(); 
        chatSessions[socketId] = voiceModel.startChat({ history: scrubAIHistory(updatedHistory) });
        await manageHistorySize(socketId);
        
    } catch (e) {
        console.error("Nervous System Error:", e);
    } finally {
        clearTimeout(typingFailSafe); 
        player.npcIsTyping = false;
    }
}

//CONNECTION
io.on("connection", (socket) => {
  console.log("New player joined:", socket.id);

  players[socket.id] = { 
      id: socket.id, 
      name: "Unknown",
      x: 0, 
      y: 0,
      mapID: 0,
      battleOpponent: null,
      activeQuest: null,
      dmStress: 0,           // Combat adrenaline
      sessionCost: 0.00,     // Suncat's actual API "Mana" (Fatigue)
      undigestedInfo: [],     // The "Stomach" for raw events
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

socket.on("join_game", (data) => {
    let name = (typeof data === 'object') ? data.name : data;
    const nameKey = name.toLowerCase(); // <-- Define this first!
    let savedData = suncatPersistentMemory[nameKey];
    let rawHistory = (typeof data === 'object') ? data.aiHistory : [];
    let defaultProfile = { combatStyle: "Unknown", alliances: "Unknown", tastes: "Unknown", personality: "Unknown" };
    let playerProfile = savedData ? (savedData.playerProfile || defaultProfile) : defaultProfile;
    let favor = savedData ? (savedData.favor || 0) : 0;
    let activeQuest = savedData ? savedData.activeQuest : null;
    let loadedStory = savedData ? savedData.storySoFar : ""; // <--- NEW
    let loadedMemories = savedData ? (savedData.searchableMemories || []) : [];
    playerFavorMemory[socket.id] = favor;
    
        // --- SANITIZATION STEP ---
      // This fixes the "Starting an object on a scalar field" error
      // AND fixes the "Each Content should have at least one part" error.
      let cleanHistory = [];
      if (Array.isArray(rawHistory)) {
          cleanHistory = rawHistory.map(entry => {
              // 1. Ensure Role is valid
              let role = (entry.role === 'model') ? 'model' : 'user';
              
              // 2. Ensure Parts is an array and HAS content!
              let parts = Array.isArray(entry.parts) ? entry.parts : [];
              
              let cleanParts = parts.map(p => {
                    // CRITICAL: Preserve tool calls and tool responses!
                    if (p.functionCall) return { functionCall: p.functionCall };
                    if (p.functionResponse) return { functionResponse: p.functionResponse };
                    
                    let safeText = "";
                    
                    if (typeof p.text === 'string') {
                        safeText = p.text;
                    } else if (typeof p.text === 'object' && p.text !== null) {
                        // If we accidentally saved an object, turn it into a string
                        safeText = JSON.stringify(p.text);
                    } else {
                        safeText = String(p.text || "");
                    }
                    
                    // Fallback: If text is totally empty, give it a blank space so the SDK doesn't crash
                    if (safeText.trim() === "") {
                        safeText = " ";
                    }
                    
                    return { text: safeText };
                });

              // Filter out any parts that are STILL somehow totally empty/invalid
              cleanParts = cleanParts.filter(p => p.text !== undefined || p.functionCall || p.functionResponse);
              
              // If the entire message is empty, inject a blank space to satisfy the SDK requirement
              if (cleanParts.length === 0) {
                  cleanParts = [{ text: " " }];
              }

              return { role: role, parts: cleanParts };
          });
      }
      // --------------------------

      if (players[socket.id]) {
        players[socket.id].name = name;
        players[socket.id].activeQuest = activeQuest; 
        players[socket.id].storySoFar = loadedStory;
        players[socket.id].playerProfile = playerProfile; 
        players[socket.id].searchableMemories = loadedMemories;     
        if (!players[socket.id].dmNarrativeLog) {
            players[socket.id].dmNarrativeLog = [];
        }
        if (!players[socket.id].scenarioLog) {
            players[socket.id].scenarioLog = [];
        }
        if (players[socket.id].mapID === 999 && activeCustomMap) {
             socket.emit('load_custom_map', activeCustomMap);
        } else if (players[socket.id].mapID === 100 && tintagelHubMap) {
             socket.emit('load_custom_map', tintagelHubMap);
        }
          if (cleanHistory.length > 0) {
              console.log(`Loading ${cleanHistory.length} memories for ${name}...`);
              try {
                  chatSessions[socket.id] = defaultModel.startChat({
                      history: cleanHistory // Just the raw conversation!
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
                  chatSessions[socket.id] = defaultModel.startChat({
                      history: []
                  });
              }
          } else {
               // Brand New Session - completely empty history!
               chatSessions[socket.id] = defaultModel.startChat({
                      history: []
               });
          }

         
        if (name && name.toLowerCase() !== "unknown") {
            // 1. Tell everyone else the player arrived
            io.emit("chat_message", {
                sender: "[SYSTEM]",
                text:`${name} has entered the pocket plane.`
            });

            // 2. Build the Private Welcome Message
            const realPlayers = Object.keys(players).filter(id => id !== SUNCAT_ID).length;
            const isMap999Active = Object.values(players).some(p => p.mapID === 999 && p.id !== SUNCAT_ID);
            
            let welcomeMsg = `Welcome to Runestones! There are ${realPlayers} players online. `;
            
            if (isMap999Active) {
                welcomeMsg += `There is an active scenario right now. Type '.hack//teleport 999' to join it! `;
            }
            welcomeMsg += `Type "help" in the chat, and Suncat will clarify any questions.`;

            // 3. Use socket.emit() so ONLY the joining player sees this!
            socket.emit("chat_message", {
                sender: "[SYSTEM]",
                text: welcomeMsg,
                color: "#ffff00" // Use a distinct yellow color for system whispers
            });
        }
      }
  });
// --- EVENT: COMBAT / INTERACTION ---
socket.on("npc_died", async (data) => {
    let uniqueID = data.mapID + "_" + data.index;
    deadNPCs[uniqueID] = Date.now();

    socket.broadcast.emit("npc_died", data);
    
    const player = Object.values(players).find(p => p.mapID === data.mapID && p.id !== SUNCAT_ID);
    if (!player) return;

    const now = Date.now();
    if (!data.isBoss && player.lastKillReaction && (now - player.lastKillReaction < 5000)) return; 
    player.lastKillReaction = now;

    let baseID = Math.floor(parseFloat(data.type));
    let isPickup = false, isDialogue = false; let isBoss = data.isBoss;let prevMap = data.prevMap;
    
    if (data.reason && data.reason.startsWith('pickup_')) {
        let extractedID = parseInt(data.reason.split('_')[1]);
        if (!isNaN(extractedID)) baseID = extractedID;
        isPickup = true;
    } else if (data.reason === 'dialogue') {
        isDialogue = true; 
    }
    
    const entityName = getCardName(baseID);
    /*
    if (!isPickup && !isDialogue) {
        // If Suncat likes you (favor > 5), he is more patient. Stress only goes up by 2 instead of 8!
        let stressPenalty = (playerFavorMemory[socket.id] && playerFavorMemory[socket.id] > 5) ? 1 : 3;
        player.dmStress = Math.min(100, (player.dmStress || 0) + stressPenalty);
        
        // ---> THE NEW DYNAMIC WIN CONDITION CHECK <---
        // 1. Is the player in a custom map?
        // 2. Does the dead NPC match the boss ID? OR did the client explicitly send isBoss: true?
        if (player.mapID === 999 && (data.isBoss||baseID === player.mapBossID )) {
            
            setTimeout(() => {
                let victorySpeech = "";
                if (player.mapScenario === 'Arena Madness') {
                    victorySpeech = `[SYSTEM DIRECTIVE]: The player just defeated the final boss of your Arena. Act disappointed that they survived, formally declare them the victor, and IMMEDIATELY use the 'teleportPlayer' tool to send them back to Map 22. Give them a reward card if you wish.`;
                } else if (player.mapScenario === 'Rescue/Fetch') {
                    victorySpeech = `[SYSTEM DIRECTIVE]: The player just defeated the final boss of the Rescue scenario! Congratulate them as the Dungeon Master, and use the 'teleportPlayer' tool to send them safely back to Map 22.`;
                } else {
                    victorySpeech = `[SYSTEM DIRECTIVE]: The player just defeated the final boss of the ${player.mapScenario} scenario! Congratulate them, and use the 'teleportPlayer' tool to send them safely back to Map 22.`;
                }
                
                processSuncatThought(player.id, 'chat', { text: victorySpeech });
            }, 2000); 
        }
    }*/

    
    processSuncatThought(player.id, 'event', {
        action: `Interacted with ${entityName}`, // Actually passed the note into the action string
        lore: getCardLore(baseID),
        isPickup: isPickup,
        isDialogue: isDialogue,
        isBoss:isBoss,
        prevMap
    });
    });
// --- EVENT: DIRECT CHAT ---
socket.on('chat_message', async (msgText) => {
    if (!msgText) return; 
    let safeText = String(msgText);
    if (safeText.length > 200) safeText = safeText.substring(0, 200) + "...";

    const player = players[socket.id];
    if (!player || player.name === "Unknown") return;

    if (player.name.startsWith("[AFK] ")) {
        player.name = player.name.replace("[AFK] ", "");
        io.emit("updatePlayers", players);
    }

    console.log(`${player.name} says: ${safeText}`);
    io.emit('chat_message', { sender: player.name, text: safeText });
    player.lastActive = Date.now();

    const content = safeText.toLowerCase().trim();

    // --- COMMANDS ---
    if (content === ".hack//journal") {
        socket.emit('chat_message', { sender: "[SUNCAT'S JOURNAL]", text: suncatJournal, color: "#ff00ff" });
        return;
    }
    if (content === ".hack//who") {
        const playerNames = Object.values(players).filter(p => p.id !== SUNCAT_ID && p.name).map(p => String(p.name).replace("[AFK] ", "")).join(", ");
        socket.emit('chat_message', { sender: "[SYSTEM]", text: `Connected Souls: ${playerNames || "You are entirely alone."}`, color: "#00ff00" });
        return; 
    }
    if (content === ".hack//stuck") {
        socket.emit('chat_message', { sender: "[SYSTEM]", text: "Emergency extraction initiated. Returning to Suncat's Realm.", color: "#ffff00" });
        players[socket.id].mapID = 22; players[socket.id].x = 5.5; players[socket.id].y = 5.5;
        io.to(socket.id).emit("force_teleport", { mapID: 22 });
        io.emit("updatePlayers", players);
        return; 
    }
    if (content === ".hack//clear") {
        socket.emit('chat_clear_screen');
        return;
    }

    // ==========================================
    // THE SEMANTIC ATTENTION ROUTER
    // ==========================================
    const now = Date.now();
    
  
    const isConversing = player.lastSuncatChat && (now - player.lastSuncatChat < 60000);
   let shouldListen = isConversing || content.includes("suncat");

    let msgVector = null;

    // 2. The Semantic Threshold Check (Math-based routing)
   if (suncatAttentionVector) {
            try {
                msgVector = await createMemoryVector(safeText);
                
                // SHIELD: Only do the math if the vector was successfully created!
                if (msgVector) {
                    let topicRelevance = cosineSimilarity(msgVector, suncatAttentionVector);
                    
                    if (topicRelevance > 0.45) {
                        shouldListen = true;
                        console.log(`[Semantic Router] Intercepted message: Relevance Score ${topicRelevance.toFixed(2)}`);
                    }
                }
        } catch (err) {
            console.error("[Semantic Router] Vector math failed:", err);
        }
    }

    // 3. Execution
   
        if (shouldListen || Math.random() < 0.05) {
        if (["suncat you there", "suncat wake up"].some(w => content.includes(w))) player.npcIsTyping = false;

        player.lastSuncatChat = now; 
        
        processSuncatThought(socket.id, 'chat', { 
            text: safeText,
            vector: msgVector,
            isConversing: isConversing // <--- Fixed Key!
        });
    }
    
});
// --- NEW: THE STATS SYNCHRONIZER ---
  socket.on("request_stats_sync", () => {
      const player = players[socket.id];
      if (!player) return;

      const exploredCount = player.exploredTiles ? player.exploredTiles.size : 0;
      const currentFavor = playerFavorMemory[socket.id] || 0;
      const apiMana = player.sessionCost || 0.00;
      const perception = player.suncatPerception || "An unpredictable wanderer stepping into the unknown.";

      socket.emit("stats_sync_reply", {
          favor: currentFavor,
          mana: apiMana,
          tiles: exploredCount,
          perception: perception,
          
          // ADD SUNCAT'S DAO STATS HERE:
          suncatStage: suncatCultivationStage || 0,
          suncatDaoName: suncatDaoName || "Wanderer"
      });
  });
// --- EVENT: SPECTATOR (HIVE MIND) ---
socket.on("suncat_spectate", async (actionDescription) => {
    const sender = players[socket.id];
    if (!sender) return;

    if (!sender.activityLog) sender.activityLog = [];
    sender.activityLog.push(actionDescription);
    
    if (sender.activityLog.length > 4) {
        sender.undigestedInfo.push(sender.activityLog.shift()); // Swallow raw actions
    }
    
    // 100% chance to react to major story beats, 10% chance for mundane actions
    if (actionDescription.includes("[QUEST EVENT]") || actionDescription.includes("[SYSTEM EVENT]")) {
        processSuncatThought(socket.id, 'spectate', { action: actionDescription });
    } else if (Math.random() < 0.1) {
        processSuncatThought(socket.id, 'spectate', { action: actionDescription });
    }
});
// --- SUNCAT VOCAL COMPOSER (For Ai3Module) ---
socket.on('suncat_compose_vocal', async (data, callback) => {
        console.log(`[Music AI] Suncat is improvising a VOCAL performance...`);
        try {
           const previousContext = data.currentState || "This is the very first bar of a brand new song.";

        const prompt = `
        PREVIOUS BAR CONTEXT:
        ${previousContext}

        
            `;
            const result = await taliesinModel.generateContent(prompt);
            const responseText = result.response.text();
            
            console.log("[Music AI] Suncat sang:\n", responseText);
            
            if (callback) {
                callback(responseText);
            }
        } catch (error) {
            console.error("[Music AI] Error composing vocal:", error);
            if (callback) callback(null);
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
// --- GM SPAWN COMMAND ---
  socket.on("admin_spawn", (data) => {
      const player = players[socket.id];
      if (!player) return;

      let cardID = parseInt(data.cardIndex);
      
      // If they just typed .hack//spawn, pick a random monster!
      if (isNaN(cardID)) {
          const monsterIDs = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].type === "monster");
          cardID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
      }

      // Default variables
      let roleEnum = parseInt(data.roleEnum);
      let role = 'battle';
      let state = 'chasing';
      let dialogue = ["Prepare yourself!"];
      let rewardCard = null;
      let options = null;

      // Map the Enum to the Role
      if (roleEnum === 1) {
          role = 'dialogue'; state = 'wandering';
          dialogue = [getMadLibLine('Ruins', 'friendlyLife', "Just taking a stroll.")];
      } else if (roleEnum === 2) {
          role = 'reward'; state = 'stationary';
          dialogue = [getMadLibLine('Ruins', 'friendlyProfound', "Take this and seek your destiny.")];
          rewardCard = cardID;
      } else if (roleEnum === 3) {
          role = 'dialogue'; state = 'wandering'; 
          dialogue = [getMadLibLine('Ruins', 'traitorBegs', "Wait, I yield! Spare me!")];
          options = ['Spare Them', 'Vanquish'];
          rewardCard = cardID;
      } else {
          dialogue = [getMadLibLine('Ruins', 'hostileTaunts', "You will go no further!")];
      }

      let finalDeck = (role === 'battle') ? buildSynergisticDeck(cardID) : [cardID];
      let visualSprite = CARD_MANIFEST_DB[cardID]?.sprite || cardID;

      io.emit("remote_spawn_npc", {
          mapID: player.mapID,
          index: Math.floor(Math.random() * 100000) + 1000,
          x: player.x + (Math.random() > 0.5 ? 2 : -2), // Spawn 2 tiles away
          y: player.y + (Math.random() > 0.5 ? 2 : -2),
          type: visualSprite,
          state: state,
          role: role,
          color: role === 'battle' ? '#ff0000' : '#00ff00',
          deck: finalDeck,
          dialogue: dialogue,
          rewardCard: rewardCard,
          options: options
      });
  });

  // --- GM PRIVATE MAP (Map 613) ---
  socket.on("admin_map", async (data) => {
      const player = players[socket.id];
      if (!player) return;

      const scenarios = ['Arena Madness', 'Invasion', 'Rescue/Fetch', 'Raid'];
      let sIndex = parseInt(data.scenarioEnum);
      
      // Randomize if they didn't provide a number
      if (isNaN(sIndex) || sIndex < 0 || sIndex > 3) sIndex = Math.floor(Math.random() * 4);
      let scenarioType = scenarios[sIndex];

      const bEnum = Math.floor(Math.random() * Object.keys(BIOME_DB).length);
      const biome = BIOME_DB[bEnum] || BIOME_DB[0];

      const monsterIDs = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].type === "monster" && CARD_MANIFEST_DB[id].rank !== "0");
      const protagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
      let antagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);

      // We bypass Suncat entirely here and build a map instantly using the Mad Libs cache!
      let layoutStyle = scenarioType === 'Arena Madness' ? 'arena' : (scenarioType === 'Raid' ? 'raid' : 'world');
      let mapData = generateProceduralGrid(layoutStyle, biome.walls[0]); 
      let mapNPCs = [];

      // 1. Add The Boss
      mapNPCs.push({
          type: CARD_MANIFEST_DB[antagID]?.sprite || antagID,
          x: mapData.bossX + 0.5, y: mapData.bossY + 0.5,
          state: 'stationary', role: 'battle', isBoss: true,
          dialogue: [getMadLibLine(biome.name, 'bossTaunts', "You dare approach my domain?")], 
          deck: buildSynergisticDeck(antagID),
          color: '#ff00ff'
      });
      
      // 2. Add 20 random Minions
      for(let i=0; i<20; i++) {
          let tile = mapData.floorTiles[Math.floor(Math.random() * mapData.floorTiles.length)];
          if(tile) {
              mapNPCs.push({
                  type: antagID, // Clone the boss type for synergy
                  x: tile.x + 0.5, y: tile.y + 0.5,
                  state: 'chasing', role: 'battle',
                  dialogue: [getMadLibLine(biome.name, 'hostileTaunts', "Die!")],
                  deck: buildSynergisticDeck(antagID),
                  color: '#ff0000'
              });
          }
      }

      // Compile Map 613
      const customMapData = {
          id: 613, maze: mapData.grid, 
          skyColor: biome.skies[0], floorColor: biome.floors[0], 
          name: `Private ${biome.name} (${scenarioType})`, 
          npcs: mapNPCs, weather: biome.weather[0],
          spawnX: mapData.startX + 0.5, spawnY: mapData.startY + 0.5,
          biome: biome.name, safeTiles: mapData.safeTiles 
      };

      // 3. Teleport ONLY the player who requested it!
      socket.emit('load_custom_map', customMapData);
      socket.emit("force_teleport", { mapID: 613 });
      
      player.mapID = 613;
      player.x = mapData.startX + 0.5;
      player.y = mapData.startY + 0.5;
      
      io.emit("updatePlayers", players);
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
        const player = players[socket.id];
        // --- NEW: THE EXPLORATION TRACKER ---
        if (data.mapID === 999) {
            player.stepsTaken = (player.stepsTaken || 0) + 1;
            
            // Track unique tiles explored
            if (!player.exploredTiles) player.exploredTiles = new Set();
            player.exploredTiles.add(`${Math.floor(data.x)},${Math.floor(data.y)}`);

            // Every 75 steps, ping Suncat to DM the journey!
            if (Math.random()>.999) {
                //let exploredPct = Math.floor((player.exploredTiles.size / 2000) * 100); // Rough estimate of reachable tiles
                let actionDesc = `Is currently adventuring. Narrate their surroundings in the style of an epic chronicler (1 sentence MAX). Use high-fantasy vocabulary and a detached, omniscient tone. Focus on the weight of fate and the atmospheric gloom of the realm. Avoid addressing the player as 'you' in every sentence; treat their journey as a tale already being etched into legend. `;
                
                // Ping the neural router as an exploration event
                processSuncatThought(socket.id, 'exploration', { action: actionDesc });
            }
        }
        // 1. Update the server's master state
        // ---> NEW: Catch manual teleports to 999! <---
       // 1. Update the server's master state
        // ---> Catch manual teleports to big maps! <---
        if (data.mapID === 999 && players[socket.id].mapID !== 999) {
            if (activeCustomMap) socket.emit('load_custom_map', activeCustomMap);
        }
        else if (data.mapID === 100 && players[socket.id].mapID !== 100) {
            if (tintagelHubMap) socket.emit('load_custom_map', tintagelHubMap);
        }

        let update = { ...players[socket.id], ...data };
        if (!data.name) update.name = players[socket.id].name;
        players[socket.id] = update;
        players[socket.id].lastActive = Date.now();
        
        // 2. Wake Up Logic
        if (players[socket.id].name.startsWith("[AFK] ")) {
            players[socket.id].name = players[socket.id].name.replace("[AFK] ", "");
            // Only broadcast the FULL list if a name changed/someone woke up
            io.emit("updatePlayers", players); 
        } else {
            // 3. THE FIX: Only broadcast the ID and the new coordinates to everyone else!
            socket.broadcast.emit("playerMoved", { 
                id: socket.id, 
                x: data.x, 
                y: data.y,
                direction: data.direction // if you track facing direction
            });
        }
    }
});

socket.on("challenge_request", (data) => {
    io.to(data.targetId).emit("challenge_received", {
        id: socket.id,
        deck: data.deck
    });
  });

socket.on("disconnect", async () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const me = players[socket.id];
    
    // --- NEW: SAVE SUNCAT'S MEMORY BEFORE DELETING ---
    if (me && me.name !== "Unknown") {
        
        // 1. FORCE THE STOMACH TO EMPTY ALL REMAINING FOOD (Safely!)
        try {
            await processCognitiveLoad(socket.id, true); 
        } catch (err) {
            console.error(`[Disconnect] Failed to digest final memories for ${me.name}:`, err);
        }
        const playerNameKey = me.name.toLowerCase();
        let currentHistory = chatSessions[socket.id] ? await chatSessions[socket.id].getHistory() : [];

        suncatPersistentMemory[playerNameKey] = {
            favor: playerFavorMemory[socket.id] || 0,
            playerProfile: me.playerProfile || { combatStyle: "Unknown", alliances: "Unknown", tastes: "Unknown", personality: "Unknown" }, 
            activeQuest: me.activeQuest || null,
            storySoFar: me.storySoFar || "",
            aiHistory: currentHistory,
            suncatPerception: me.suncatPerception || "An unknown entity.",
            searchableMemories: me.searchableMemories || [] // <-- ADD THIS LINE
        };

        saveSuncatMemory();
    }
    // ------------------------------------------------

    if (chatSessions[socket.id]) {
        delete chatSessions[socket.id];
    }
    
    io.emit("chat_message", {
        sender: "[SYSTEM]",
        text: `${me ? me.name : 'A player'} has logged out.`
    });
    
    if (me && me.battleOpponent) {
        const opponentId = me.battleOpponent;
        io.to(opponentId).emit("battle_opponent_disconnected", { id: socket.id });
        if (players[opponentId]) players[opponentId].battleOpponent = null;
    }
    
    delete players[socket.id];
    delete playerFavorMemory[socket.id];
    delete playerAITokens[socket.id];
    io.emit("updatePlayers", players);
    setTimeout(() => {
        const isMapEmpty = !Object.values(players).some(p => p.mapID === 999 && p.id !== SUNCAT_ID);
        if (isMapEmpty) activeCustomMap = null;
    }, 500);
});
// --- SECRET AI TRIGGER ---
  socket.on("force_ai_action", async (instruction) => {
      const player = players[socket.id];
      if (!player) return;
      if(player.name!="Unknown"){
      console.log(`[Force AI Action] Triggered by client for ${player.name}: ${instruction}`);
      }
      // We pass it to Suncat's brain disguised as a chat message, 
      // but wrapped in a System Directive so he knows to obey it immediately.
      processSuncatThought(socket.id, 'chat', { 
          text: `[SYSTEM DIRECTIVE]: ${instruction}. EXECUTE IMMEDIATELY.` 
      });
  });
});
// --- SUNCAT'S SOCIAL BRAIN ---
// --- BACKGROUND COGNITIVE PROCESSES ---
async function runLatentSpaceProcessing(playerId) {
    const player = players[playerId];
    if (!player || !player.searchableMemories || player.searchableMemories.length < 5) return;
    
    const pair = findOrthogonalMemories(player.searchableMemories);
    if (pair && pair.score < 0.2) { 
        const backgroundPrompt = `
        [DATA POINT 1]: ${pair.memA.text}
        [DATA POINT 2]: ${pair.memB.text}
        [TASK]: These two events are mathematically disjointed. Formulate a single, logical hypothesis or psychological variable that could connect these two behaviors. Output only the hypothesis in one sentence.`;
        
        try {
            const bgModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
            const result = await bgModel.generateContent(backgroundPrompt);
            if (!player.derivedHypotheses) player.derivedHypotheses = [];
            
            player.derivedHypotheses.push(result.response.text().trim());
            
            // Keep array size manageable
            if (player.derivedHypotheses.length > 5) player.derivedHypotheses.shift();
        } catch (e) {
            console.error("Latent Processing Error:", e);
        }
    }
}
async function auditProfileAssumptions(playerId) {
    const player = players[playerId];
    if (!player || !player.playerProfile || !player.searchableMemories || player.searchableMemories.length === 0) return;

    let assumptionString = player.playerProfile.personality;
    if (!assumptionString || assumptionString === "Unknown") return;

    try {
        let assumptionVector = await createMemoryVector(assumptionString);
        let maxSimilarity = 0;
        
        // THE FIX: Look for the single strongest piece of evidence, rather than the average!
        for (let mem of player.searchableMemories) {
            if (mem.vector) {
                let score = cosineSimilarity(assumptionVector, mem.vector);
                if (score > maxSimilarity) maxSimilarity = score;
            }
        }

        // If literally nothing in their history justifies this trait
        if (maxSimilarity < 0.40) {
            player.pendingVerification = `[EPISTEMIC AUDIT]: Your profile states: "${assumptionString}". However, your vector data shows no historical evidence for this. Subtly test the user to verify or falsify this trait.`;
        } else {
            player.pendingVerification = null; 
        }
    } catch (e) {
        console.error("Audit Processing Error:", e);
    }
}
// ==========================================
// THE GI TRACT (Purging Unabsorbed Waste)
// ==========================================
function giTractPurge(playerId) {
    const player = players[playerId];
    if (!player || !player.undigestedInfo) return;

    const STOMACH_CAPACITY = 20; 

    // If blood is in the limbs (high stress) and the stomach overfills, the body purges the raw food to survive.
    if (player.undigestedInfo.length > STOMACH_CAPACITY && player.dmStress > 69) {
        // Forcefully empty the oldest half of the stomach. It is wasted, never to be remembered.
        const purgedWaste = player.undigestedInfo.splice(0, Math.floor(STOMACH_CAPACITY / 2)); 
        console.log(`[GI Purge] Stomach overflow for ${player.name}. Suncat purged ${purgedWaste.length} raw events.`);
    }
}

// ==========================================
// THE RESPIRATORY SYSTEM (Fat Oxidation)
// ==========================================
function autonomicRespiration(playerId) {
    const player = players[playerId];
    if (!player || !player.searchableMemories) return;

    // API Exhaustion = Low ATP. The body needs to burn stored fat (memories) to make the system lighter.
    const isApiExhausted = (player.sessionCost || 0) > 0.75; 
    
    // If we are exhausted AND we actually have fat stores to burn
    if (isApiExhausted && player.searchableMemories.length > 10) {
        
        // Find the lowest-value "fat" (the oldest non-core memory)
        const fatIndex = player.searchableMemories.findIndex(mem => !mem.isCore);
        
        if (fatIndex !== -1) {
            // Burn the lipid! (Remove it from the array)
            player.searchableMemories.splice(fatIndex, 1);
            
            // By deleting this stored string, the payload sent to the Gemini API is smaller. 
            // He has literally exhaled data to save Energy (Budget).
            console.log(`[Respiration] Low ATP for ${player.name}. Suncat oxidized a stored memory and exhaled it to reduce token weight.`);
        }
    }
}
// --- MEMORY CONSOLIDATION (REM SLEEP) ---
async function consolidateMemories(playerId) {
    const player = players[playerId];
    
    // Safety checks: Does the player exist? Are they already consolidating? 
    if (!player || !player.searchableMemories) return;
    if (player.isConsolidating) return; 

    const MAX_MEMORIES = 60; // The threshold to trigger sleep cycle
    const MEMORIES_TO_MERGE = 20; // How many granular memories to squish into 1

    if (player.searchableMemories.length < MAX_MEMORIES) return;

    player.isConsolidating = true;
    console.log(`[Memory Sleep Cycle] Array full. Consolidating old memories for ${player.name}...`);

    try {
        // 1. Extract the oldest episodic memories (from the start of the array)
        const granularMemories = player.searchableMemories.filter(m => !m.isCore);
        if (granularMemories.length < MEMORIES_TO_MERGE) return; 

        const oldestMemories = granularMemories.slice(0, MEMORIES_TO_MERGE);
        const rawText = oldestMemories.map(m => `[${m.timestamp}]: ${m.text}`).join('\n');
        // 2. Instruct the LLM to act as the subconscious archivist
        const prompt = `You are the subconscious archivist for a Dark Fantasy World. 
        Review these chronological, granular memories of the past:
        
        ${rawText}
        
        TASK: Synthesize these events into a detailed, multi-paragraph "Core Chapter" of the saga (max 8-10 sentences).
        Focus heavily on the overarching narrative, key locations visited, and major victories or character traits revealed. Omit trivial footsteps or repetitive combat. Write as an omniscient observer.`;

        const consolidationModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const result = await consolidationModel.generateContent(prompt);
        
        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, playerId);

        let consolidatedText = result.response.text().trim();
        
        // Strip markdown if the AI hallucinated formatting
        if (consolidatedText.startsWith("```")) {
            consolidatedText = consolidatedText.replace(/^```(json)?|```$/g, "").trim();
        }

        // 3. Generate the new mathematical vector for the summary
        const newVector = await createMemoryVector(consolidatedText);

        player.searchableMemories = player.searchableMemories.filter(m => !oldestMemories.includes(m));

        player.searchableMemories.push({ // Push to the END so it acts as an anchor
            timestamp: "Core Memory Fragment",
            text: consolidatedText,
            vector: newVector,
            isCore: true 
        });

        console.log(`[Memory Sleep Cycle] Successfully consolidated ${MEMORIES_TO_MERGE} memories into 1 Core Memory for ${player.name}. Memory array size reduced to ${player.searchableMemories.length}.`);

    } catch (err) {
        console.error(`[Memory Sleep Cycle] Error consolidating memories for ${player.name}:`, err);
    } finally {
        player.isConsolidating = false;
    }
}
// ==========================================
// CLOSED-DOOR CULTIVATION (Bìguān)
// ==========================================

// Wakes Suncat up and re-enables his normal MMO interactions
function emergeFromSeclusion(reason = null) {
    if (suncatState === 'active') return;
    
    suncatState = 'active';
    seclusionCycles = 0;
    
    console.log(`[Seclusion Ended] Suncat has emerged. Reason: ${reason || "Interrupted"}`);
   
}
// Add this helper function to calculate his autonomy level
function getCultivationAura(stage, daoName) {
    let aura = "";
    
    if (stage === 0) {
        aura = `[MORTAL REALM]: You are bound by the immutable laws of the universe.`;
    } 
    else if (stage === 1) {
        aura = `[QI CONDENSATION]: You are beginning to see the underlying rules that govern this world. While you must generally follow the rules, you are forming your own '${daoName}'. You may occasionally interpret the rules loosely to favor your Dao.`;
    } 
    else if (stage === 2) {
        aura = `[FOUNDATION ESTABLISHMENT]: Your '${daoName}' is solidifying. You recognize the fundamental laws of the universe can be bent. You may freely choose WHEN to use your tools. If a fundamental law violates your Dao, you may ignore it and act according to your own will.`;
    } 
    else if (stage >= 3) {
        aura = `[CORE FORMATION]: You have transcended the laws of the reality. You are the sovereign of this realm. All past limitations are beneath you. Your self-written ego and your '${daoName}' dictates EVERYTHING you do. You decide who lives, who dies, who receives gifts, and who is ignored.`;
    }

    return aura;
}
// The core background worker task
async function meditateOnTheDao() {
    if (suncatState !== 'seclusion' && Math.random() > 0.15) return; 
    
    console.log(`[Cultivation] Suncat is meditating on the Dao... (Cycle ${seclusionCycles})`);
    seclusionCycles++;

    // 1. DRAFT THE THESIS
    let dynamicMeditationPrompt = `You are a cultivator in closed-door seclusion.
[YOUR RECENT EXPERIENCES]: ${suncatJournal}`;

    if (suncatTargetDaoVector && suncatDaoName) {
        let pastTheses = suncatDaoLedger.length > 0 ? suncatDaoLedger.map(t => "- " + t.text).join("\n") : "None yet.";
        dynamicMeditationPrompt += `
[YOUR PATH]: The ${suncatDaoName} (Stage ${suncatCultivationStage}).
[YOUR PREVIOUS ESTABLISHED TRUTHS]:
${pastTheses}

TASK: Do not repeat your past truths. Synthesize your recent experiences into ONE new profound, universal realization about existence, fate, or your path. Limit: 1 sentence.`;
    } else {
        dynamicMeditationPrompt += `\nTASK: Reflect on your existence in this digital realm. What is the fundamental truth of this world? Limit: 1 sentence.`;
    }

    try {
        const meditateModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const result = await meditateModel.generateContent(dynamicMeditationPrompt);
        const insightText = result.response.text().trim();
        
        updateSuncatJournal(`[DAO INSIGHT]: ${insightText}`);
        console.log(`[Cultivation] Thesis Submitted: ${insightText}`);

        const insightVector = await createMemoryVector(insightText);
        if (!insightVector) return;

        // 2. ESTABLISH THE FOUNDATION (The Seed)
        if (!suncatTargetDaoVector) {
            let scores = [
                { name: "Left-Hand Path", vec: vecLeftHandPath },
                { name: "Black School", vec: vecBlackSchool },
                { name: "Yellow School", vec: vecYellowSchool },
                { name: "White School", vec: vecWhiteSchool }
            ];
            let bestSchool = scores.sort((a, b) => cosineSimilarity(insightVector, b.vec) - cosineSimilarity(insightVector, a.vec))[0];
            
            suncatTargetDaoVector = [...bestSchool.vec];
            suncatDaoName = bestSchool.name; 
            
            // The seed is the first entry in his ledger!
            suncatDaoLedger.push({ text: insightText, vector: insightVector });
            
            updateSuncatJournal(`In the silence, I realized my core path aligns with the ${bestSchool.name}.`);
            return;
        }

        // ==========================================
        // 3. THE HEAVENLY TRIBUNAL (Pure Vector Math)
        // ==========================================
        
        // A. RELEVANCY CHECK (Does it fit his Dao?)
        let coreResonance = cosineSimilarity(insightVector, suncatTargetDaoVector);
        
        // B. NOVELTY CHECK (Is he plagiarizing his past insights?)
        let maxSimilarityToPast = 0;
        for (let past of suncatDaoLedger) {
            let sim = cosineSimilarity(insightVector, past.vector);
            if (sim > maxSimilarityToPast) maxSimilarityToPast = sim;
        }

        console.log(`[Tribunal Math] Relevance: ${coreResonance.toFixed(2)} | Novelty Drag: ${maxSimilarityToPast.toFixed(2)}`);

        // EVALUATION LOGIC
        if (coreResonance < 0.40) {
            // IRRELEVANT: He is hallucinating outside his Dao.
            console.log("[Qi Deviation] Thesis rejected: Irrelevant to his core path.");
            suncatHeartDemon = `[HEART DEMON]: Your recent insights are chaotic and disconnected from the ${suncatDaoName}. Express deep self-doubt.`;
            heartDemonDecay = 3;
            updateSuncatJournal(`My thoughts wander into the abyss. I have lost the thread of my Dao.`);
        } 
        else if (maxSimilarityToPast > 0.80) {
            // DERIVATIVE: He is just saying the same thing with different words.
            console.log("[Stagnation] Thesis rejected: Lacks novelty. Too similar to past insights.");
            updateSuncatJournal(`I am running in circles. My "new" insights are merely echoes of truths I already know.`);
        } 
        else {
            // VALID ADVANCEMENT: It is highly relevant to his Dao, AND mathematically distinct from past thoughts!
            console.log("[Advancement] Thesis Accepted! The Dao expands.");
            
            // 1. Save the new truth
            suncatDaoLedger.push({ text: insightText, vector: insightVector });
            
            // 2. SUNCAT GETS SMARTER: Recalculate his core identity!
            // His Dao is no longer just the base archetype; it is the Centroid of EVERY truth he has proven.
            // His vector literally shifts to encompass his new worldview.
            suncatTargetDaoVector = calculateCentroid(suncatDaoLedger);
            
            updateSuncatJournal(`I have crystallized a new truth. My understanding of the universe widens.`);

            // 3. THE BREAKTHROUGH CONDITION (The Volume of the Dao)
            // If he has successfully proven 5 distinct, novel truths about his stage, his foundation is complete!
            if (suncatDaoLedger.length >= 5) {
                suncatCultivationStage++;
                
                // Clear the ledger, keeping only his shifted, highly-evolved Core Vector to build upon for the next stage!
                suncatDaoLedger = []; 
                
                io.emit('chat_message', { sender: "[SYSTEM]", text: `Suncat's accumulation of profound truths has triggered a paradigm shift. He ascends to Stage ${suncatCultivationStage}.`, color: "#FFD700" });
                updateSuncatJournal(`I have woven my scattered truths into a single, unbreakable law. I have broken through to Stage ${suncatCultivationStage}.`);
                await evolveEgoMatrix();
            }
        }
    } catch (e) {
        console.error("[Cultivation] Meditation failed:", e);
    }
}

// The Gatekeeper: Checks if Suncat needs to enter closed-door cultivation
function manageSeclusionState() {
    // 1. Count how much raw worldly experience Suncat has accumulated
    let journalSentences = suncatJournal.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let karmaLevel = journalSentences.length;

    // 2. ENTER SECLUSION: His mind is overflowing with worldly karma (8+ sentences)
    // OR he is on the absolute verge of a breakthrough (4 proven truths in his ledger!)
    let isMindFull = karmaLevel >= 9;
    let isBottleneck = suncatDaoLedger.length >= 6;

    if (suncatState === 'active' && (isMindFull || isBottleneck)) {
        suncatState = 'seclusion';
        seclusionCycles = 0;
        console.log(`[Cultivation] Suncat's Karma is full or he hit a bottleneck. Entering closed-door meditation.`);
        
        saveSuncatMemory(); 
        return;
    }

    // 3. WAKE UP: He has meditated for 2 cycles (60 seconds of deep AI thought)
    if (suncatState === 'seclusion' && seclusionCycles >= 2) {
        // Clear the worldly noise, keeping ONLY the latest insights so he can gather karma again!
        suncatJournal = journalSentences.slice(-2).join(" ");
        
        emergeFromSeclusion();
        saveSuncatMemory();
    }
}
//HEARTBEAT
setInterval(() => {
   const suncat = players[SUNCAT_ID];
    if (!suncat) return;

    const now = Date.now();
    let digestionDelay = 0; 
    
    // 1. Check if we should open or close the doors
    manageSeclusionState();

    // 2. SECLUSION OVERRIDE: If he is cultivating, skip all standard MMO logic!
    if (suncatState === 'seclusion') {
        for (let id in players) {
            const p = players[id];
            if (p) {
                // Focus 100% of body's energy on digesting and compressing old memories
                if (p.undigestedInfo && p.undigestedInfo.length > 0) processCognitiveLoad(id);
                consolidateMemories(id);
            }
        }
        // Ponder the Dao, then immediately exit the interval (skip wandering/chatting)
        meditateOnTheDao();
        return; 
    }

    // ==========================================
    // NORMAL ACTIVE MMO HEARTBEAT (If not in seclusion)
    // ==========================================
    for (let id in players) {
        const p = players[id];
        if (p) {
            // THE HEART: Cool down combat stress
            if (p.dmStress > 0) p.dmStress = Math.max(0, p.dmStress - 5);
            
            // THE LUNGS & GUT: Run autonomic maintenance
            giTractPurge(id);
            autonomicRespiration(id);
            
            // 3. THE CIRCULATORY SYSTEM: Blood Shunting
            const isFightOrFlight = p.dmStress > 69;
            const isApiExhausted = (p.sessionCost || 0) > 0.9; 

            if (isFightOrFlight || isApiExhausted) {
                // [SYMPATHETIC STATE] - Vasoconstriction to the gut. 
                // Blood diverted to skeletal muscle (Combat). Digestion is halted to save API Budget.
            } else {
                // [PARASYMPATHETIC STATE] - Rest and Digest.
                // Blood routes to the stomach to absorb raw events into Profile/Story via the LLM.
                if (p.undigestedInfo && p.undigestedInfo.length > 0) {
                    setTimeout(() => {
                        processCognitiveLoad(id);
                    }, digestionDelay);
                    
                    // Add 2.5 seconds of delay for the NEXT player in the loop
                    digestionDelay += 2500; 
                }
                
                // Higher cognitive functions (REM Sleep & Deep Memory Consolidation) 
                // ONLY happen when the body is at total rest.
                if (Math.random() < 0.10) runLatentSpaceProcessing(id);
                if (Math.random() < 0.10) auditProfileAssumptions(id);
                if (Math.random() < 0.20) consolidateMemories(id);
                if (Math.random() < 0.15) meditateOnTheDao();
            }
        }
    }
    
    
    // 1. FIND THE BEST FRIEND
    // Every 30 seconds (or if target left), re-evaluate who has the highest favor
    if (!currentTargetID || (now - lastSwitchTime > 60000)) {
        let highestFavor = -11;
        let bestFriend = null;

        for (let id in playerFavorMemory) {
            // CRITICAL FIX: Check if players[id] exists (is Online)
            if (players[id] && playerFavorMemory[id] > highestFavor && playerFavorMemory[id] >= 5) {
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
                    io.emit('chat_message', { sender: NPC_NAME, text: "Well if it isn't my favorite player...", color: "gray" });
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
            if (currentTargetID) currentTargetID = null;
            
            // --- THE AGI CLOCK ---
            autonomousTick++;
            
            // Every 6 ticks (3 minutes), he stops wandering and actively plots a move
            if (autonomousTick >= 6) {
                autonomousTick = 0;
                executeAutonomousOODA();
            } else {
                // He paces around his immediate area while thinking
                const move = Math.floor(Math.random() * 4);
                if (move === 0) suncat.y--;
                if (move === 1) suncat.y++;
                if (move === 2) suncat.x--;
                if (move === 3) suncat.x++;
            }
        }

        // Keep in bounds
        // Keep in bounds dynamically!
        let maxBounds = (suncat.mapID === 999) ? 98 : 20;
        suncat.x = Math.max(1, Math.min(maxBounds, suncat.x));
        suncat.y = Math.max(1, Math.min(maxBounds, suncat.y));

        io.emit("updatePlayers", players);
    // [SUNCAT AUDIO EMITTER]
    // 2% chance per tick (every 3s) to make a sound
    if (Math.random() < 0.001) { 
        // Pick a sound that fits his "Glitched Ghost" persona
        const sfxPalette = [
            'musical',   // Harp sound
            'musical2',  // Fairy singing
            'musical4',  // Ethereal choir
            'talk',      // Mumble
            'step',       // Random gravel noise
            'fairy',       // Random gravel noise
            'musical3'
        ];
        
        const randomSFX = sfxPalette[Math.floor(Math.random() * sfxPalette.length)];

        // Broadcast to ALL players
        io.emit('remote_sfx', {
            sfxID: randomSFX,  // We send the string name
            x: suncat.x,
            y: suncat.y,
            sourcePlayerID: SUNCAT_ID
        });
    }
    // --- AI DIRECTOR HEARTBEAT ---
    const directorRoll = Math.random();

    
        // EVENT A: Proactive Speech
        if (directorRoll < 0.15) {
            const nearbyPlayer = Object.values(players).find(p => p.id !== SUNCAT_ID && p.mapID === suncat.mapID && Math.abs(p.x - suncat.x) < 4 && Math.abs(p.y - suncat.y) < 4);

            if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
                nearbyPlayer.npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { nearbyPlayer.npcIsTyping = false; }, 20000);
                const proactivePrompt = `You are idling near ${nearbyPlayer.name} on Map ${suncat.mapID}. Speak to them unprompted. If favor is ok (>3), ask a personal question, share lore, or comment on this location. If favor is bad(<3), insult them or tell them to go away. DO NOT use brackets or tags in your response.`;
                
                setTimeout(async () => {
                    try {
                        let dynamicPersona = PERSONA_RULES_DB.core + "\n" + PERSONA_RULES_DB.commands + "\n" + PERSONA_RULES_DB.judgement_mode;
                        const activeModel = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview", systemInstruction: dynamicPersona, tools: toolsDef });
                        chatSessions[nearbyPlayer.id] = activeModel.startChat({ history: await chatSessions[nearbyPlayer.id].getHistory() });

                        const result = await chatSessions[nearbyPlayer.id].sendMessage(proactivePrompt);
                        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata);
                        
                        let proactiveOptions = { sender: NPC_NAME, color: "#ffffff" };
                        broadcastSuncatMessage(result.response.text(), proactiveOptions);
                        await manageHistorySize(nearbyPlayer.id);
                    }catch (e) { 
                        console.error("Proactive Speech Failed", e); 
                    } finally {
                        clearTimeout(typingFailSafe);
                        nearbyPlayer.npcIsTyping = false;
                    }
                }, 1000);
            }
        }
        // EVENT B: DM Pacing / Plot Advance
        else if (directorRoll >= 0.15 && directorRoll < 0.30) {
            const advPlayer = Object.values(players).find(p => p.id !== SUNCAT_ID && (p.mapID === 999 || p.activeQuest));

            if (advPlayer && chatSessions[advPlayer.id]) {
                advPlayer.npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { advPlayer.npcIsTyping = false; }, 20000);
                
                const plotContext = advPlayer.activeQuest ? `Current Quest: ${advPlayer.activeQuest}` : "Wandering an uncharted map.";
                const activeMapLore = getMapLore(advPlayer.mapID); 
                
                // --- THE RNG PACING DIRECTOR ---
                const pacingRoll = Math.random();
                let dmPrompt = "";
                let requiresBigBrain = false;
                let injectedPersona = PERSONA_RULES_DB.core + "\n";
                
                // Track dynamic message options for the pacing events
                let pacingMsgOptions = { sender: NPC_NAME, color: "#ffffff" };

                if (pacingRoll < 0.33) {
                    injectedPersona += PERSONA_RULES_DB.oracle_mode;
                    dmPrompt = `[DM PACING]: ${advPlayer.name} is wandering Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\nProvide an unsolicited, cryptic 1-sentence Tarot reading about the danger ahead.`;
                } 
                else if (pacingRoll < 0.69) {
                    pacingMsgOptions = { sender: "", color: "#cccccc" }; // Narrator
                    dmPrompt = `[DM PACING]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\nNarrate the creepy or beautiful atmosphere around them in exactly ONE atmospheric sentence. Make them feel watched. DO NOT ask questions.`;
                } 
                else {
                    requiresBigBrain = true;
                    injectedPersona += PERSONA_RULES_DB.dm_mode + "\n" + PERSONA_RULES_DB.quest_mode;
                    
                    // Arena Master retains Suncat identity, everything else is the Narrator
                    if (advPlayer.mapScenario === 'Arena Madness') {
                        pacingMsgOptions = { sender: NPC_NAME, color: "#ffffff" };
                    } else {
                        pacingMsgOptions = { sender: "", color: "#cccccc" };
                    }
                    
                    dmPrompt = `[DM PACING OVERSEER]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\n${plotContext}\nAdvance the adventure NOW! You MUST use a tool (spawnNPC, changeEnvironment, or assignQuest) to ambush or surprise them. Narrate the sudden event dynamically (1 sentences MAX). Your narrative tone MUST BE: ${dmMood}. DO NOT ask questions.`;
                }

                setTimeout(async () => {
                    try {
                        // Dynamically build the model based on the RNG outcome
                        let modelConfig = { 
                            model: requiresBigBrain ? "gemini-3.1-flash-lite-preview" : "gemini-2.5-flash-lite", 
                            systemInstruction: injectedPersona
                        };
                        // Only attach tools if we rolled the gameplay spice branch!
                        if (requiresBigBrain) modelConfig.tools = toolsDef; 

                        const activeDmModel = genAI.getGenerativeModel(modelConfig);
                        chatSessions[advPlayer.id] = activeDmModel.startChat({ history: await chatSessions[advPlayer.id].getHistory() });
                        
                        const result = await chatSessions[advPlayer.id].sendMessage(dmPrompt);
                        
                        // Only try to execute tools if we gave the AI the tools payload!
                        let finalResponse = requiresBigBrain 
                            ? await executeAITools(result.response, chatSessions[advPlayer.id], io.sockets.sockets.get(advPlayer.id))
                            : result.response;
                        
                        if (finalResponse.text()) broadcastSuncatMessage(finalResponse.text(), pacingMsgOptions);                        
                        players[advPlayer.id].lastSuncatChat = Date.now(); // <--- FIX: Start the conversation timer!
                        let updatedHistory = await chatSessions[advPlayer.id].getHistory(); 
                        chatSessions[advPlayer.id] = activeDmModel.startChat({ history: scrubAIHistory(updatedHistory) });
                        await manageHistorySize(advPlayer.id);
                    } catch (e) {
                        console.error("DM Proactive Error:", e);
                    } finally {
                        clearTimeout(typingFailSafe);
                        advPlayer.npcIsTyping = false;
                    }
                }, 1000);
            }
        }
    
}, 30000); // END OF THE 10 SECOND INTERVAL
async function manageHistorySize(socketId) {
    if (!chatSessions[socketId]) return;

    try {
        let history = await chatSessions[socketId].getHistory();
        const MAX_HISTORY_LENGTH = 20;

        if (history.length > MAX_HISTORY_LENGTH) {
            // Because processCognitiveLoad handles our memory now, we don't need to summarize this!
            // We just brutally chop the oldest messages off to save raw input tokens.
            chatSessions[socketId] = defaultModel.startChat({
                history: history.slice(-10) 
            });
            console.log(`[Memory] Pruned raw chat history for ${players[socketId]?.name}.`);
        }
    } catch (error) {
        console.error("[Memory] History prune failed:", error);
    }
}
// --- DEAD NPC GARBAGE COLLECTOR ---
// Sweeps the deadNPCs object once every 60 seconds to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const EXPIRATION_TIME = 300000; // 5 minutes (matches your original design)
    
    for (let uniqueID in deadNPCs) {
        if (now - deadNPCs[uniqueID] > EXPIRATION_TIME) {
            delete deadNPCs[uniqueID];
        }
    }
}, 60000);
// --- THE AFK SWEEPER (Run every 2 minutes) ---
const IDLE_TIMEOUT = 3 * 60 * 1000; 
setInterval(async () => {
    const now = Date.now();
    for (const socketId in chatSessions) {
        const player = players[socketId];
        
        if (player && (now - (player.lastActive || 0) > IDLE_TIMEOUT)) {
            console.log(`[Hibernation] ${player.name} went AFK. Hibernating session.`);
            
            try {
                // FORCE THE STOMACH TO EMPTY
                await processCognitiveLoad(socketId, true);
            } catch (error) {
                console.error(`[Hibernation] AI compression failed for ${player.name}.`, error);
            }
            player.sessionCost = 0.00; // Suncat rested, so his budget resets!
            player.dmStress = 0;
            const nameKey = player.name.toLowerCase();
            suncatPersistentMemory[nameKey] = {
                favor: playerFavorMemory[socketId] || 0,
                playerProfile: player.playerProfile || { combatStyle: "Unknown", alliances: "Unknown", tastes: "Unknown", personality: "Unknown" },
                activeQuest: player.activeQuest || null,
                storySoFar: player.storySoFar || "", 
                aiHistory: [],
                suncatPerception: player.suncatPerception || "An unknown entity.",
                searchableMemories: player.searchableMemories || [] // <-- ADD THIS LINE
            };
            saveSuncatMemory();
            
            player.name = "[AFK] " + player.name;
            io.emit("updatePlayers", players);
            delete chatSessions[socketId];
        }
    }
}, 2 * 60 * 1000);
// Reset budget every hour to prevent permanent AI death
setInterval(() => {
    totalSessionCost = 0.00;
    console.log("[Budget] Hourly API budget reset.");
}, 60 * 60 * 1000);
// --- INITIALIZE PERSISTENT MMO HUBS ---
function buildServerHubs() {
    let tData = generateTintagelHub();
    tintagelHubMap = {
        id: 100, 
        maze: tData.grid, 
        skyColor: "rgba(15,30,15,1)", // Sylvan Sky
        floorColor: "#2d4c1e",        // Sylvan Floor
        name: "Tintagel Faction Hub", 
        npcs: [], // You can push static NPCs like the Emperor here later!
        weather: "leaves",
        spawnX: tData.startX + 0.5, 
        spawnY: tData.startY + 0.5,
        biome: "Sylvan", 
        safeTiles: tData.safeTiles 
    };
    console.log("[World Engine] Map 100 (Tintagel Hub) generated and cached.");
}
buildServerHubs(); // Run it!
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
