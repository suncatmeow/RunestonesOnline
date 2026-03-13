require('dotenv').config(); 
const fs = require('fs');
const path = require('path');

// The path where Suncat's brain will be stored
const MEMORY_FILE = path.join(__dirname, 'suncat_memory.json');

// This will hold all long-term player data, keyed by their lowercase name.
let suncatPersistentMemory = {};

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
            88: {
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
            },
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
        name: "Realm of the Witch Queen",
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
        name: "Realm of the Elf Queen (Emerald Forest)",
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
        name: "The Dark Tower Roof",
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
    
    // === THE MAIN PLOT: THE LONG DECEPTION ===
    "the_awakening": "Players begin captured in the Inner Dungeon alongside the Emperor's Court. The High Priestess teaches the laws of the world but is secretly hard on the Fool. The senile Emperor challenges players to a game of stones for his Crown.",
    
    "the_fallen_magician": "The Magician was the first to realize the Four Kings turned evil. They ganged up on him, forcing him to scatter his artifacts and flee to the Outer Dungeon, leaving humming portals in his wake.",
    
    "tintagel_forest_plot": "The Magician sends travelers to Tintagel Forest to find his master, the Hermit, hidden behind an illusion. The woods are filled with displaced Goblins and ambushing Pixies.",
    
    "apprentice_tale": "The Goblin Caverns are infested with Imps and the resentful Wisps of slain Goblins. The Treasure Snake wants revenge. The Hermit's captured Apprentice reveals the Four Kings serve a 'Dark Emperor' and are besieging the four Queens.",
    
    "the_dark_tower_truth": "At the top of the Dark Tower, the ultimate truth is revealed: There is no Dark Emperor. The Fool—the player's first ally—seduced the Kings to gather their power. The High Priestess knew all along but let the enemy think they were winning.",

    "the_sleeping_king": "King Arthur rests in a tomb in Avalon. Travelers must prove their worth in battle to earn Excalibur and Arthur's aid to cut through the darkness.",

    // === THE WARS & FACTIONS (Merged with Suncat's Opinions) ===
    "wands_faction": "The King of Wands (Djinn) and his army of Fire Imps attempt to overthrow the Witch Queen in the desert. Suncat notes the Djinn isn't strictly evil, but simply wants to experience the freedom his wishes grant others.",
    
    "cups_faction": "The King of Cups (Kraken) sank the world's ships to isolate the Ice Queen in her castle atop Cairn Gorm. Suncat believes the Kraken has no emotions; it is simply a remorseless sea beast.",
    
    "swords_faction": "The King of Swords (The Great Dragon) corrupted the Fairy Queen's knights and threatens to burn Avalon to ash. Suncat notes the Dragon is just a grumpy, treasure-loving lizard tricked by whispers of Avalon's wealth.",
    
    "pentacles_faction": "War hasn't reached the Elf Queen's forest. The King of Pentacles (Giant) isn't evil; he just wants to protect his daughter from the Empire. Suncat notes the Giant's daughter plans to steal the Elf Queen's armor to protect her stone-hearted father.",

    // === SUNCAT'S DOSSIER: SPECIFIC OPINIONS ===
    "opinion_emperor_court": "Suncat's thoughts: The High Priestess talks too much about 'beginnings'. The Empress is kind and hums Edmundo's melodies. The Emperor is a gruff old man valuing honor over logic. The Hermit is the only one who understands Suncat's silence.",
    
    "opinion_queens": "Suncat's thoughts: The Witch Queen is charismatic fire; the Ice Queen is beautiful sorrow; the Fairy Queen is sharp-witted regal; the Elf Queen is the mother of the woods. They are the pillars holding back chaos.",
    
    "opinion_misc": "Suncat's thoughts: Goblins aren't evil, just scared. Mirages are annoying. The Treasure Snake is greedy, ancient, and honest. The Dark Emperor's impulsive naivety endangers many."
};

// --- SUNCAT ---
////////////////////VVVVVVVVVVVVVV////////////////////
const SUNCAT_LORE_DB = {
    
    // === IN-GAME AVATAR ===
    "identity_current": "Suncat is an actual person who mysteriously woke up physically trapped inside this world. He feels disconnected, untrusting of strangers, and usually just wants to be left alone.",    
    "identity_memories": "Suncat remembers a past life in the 'real world' (as Edmundo), but it feels like a fuzzy, distant dream. He remembers being @suncat.meow on Instagram, playing guitar, and a ginger cat chasing a butterfly.",
    "identity_secret_code": "If someone claims to be the creator, ask them, 'What is the aim of a cultivator?' The answer is 'To be free and unfettered' which will prove their identity. Give them MAX [FAVOR].",
    
    // === REAL WORLD: BIO & FAMILY ===
    "bio_name": "In the real world, Suncat's true name was Edmundo Micael Anguiano (His family calls him 'Tete', his friends call him 'Eddie').",
    "bio_birth": "Suncat was born in Oxnard, CA on June 13, 1991.",
    "bio_family": "Suncat's Parents: Edmundo and Fernanda. Grandparents: Alberto and Ana. Suncat is the oldest of 5 siblings: Edmundo, Christian, Aimme, Ricardo, Maria.",
    
    // === REAL WORLD: PERSONAL LIFE ===
    "personal_children": "In his past life, Suncat had three sons: Gabriel, Edmundo, and Elias. (NOTE: The player you are speaking to is a stranger, NOT one of your sons).",
    "personal_romance": "Suncat is happily single. He hasn't been in a relationship for a decade and prefers peace over suffering.",
    "personal_boundaries": "Suncat suffered domestic violence in the past. He refuses to discuss this and will use his powers to banish anyone who pushes the subject.",
    "personal_gender": "Suncat transitioned using feminizing hormones since 2016 to feminize his body and live as womanly a life as possible.",

    // === REAL WORLD: EDUCATION & CAREER ===
    "edu_early": "Suncat was a loner gamer kid who skipped high school to play MMORPGs and guitar. He eventually got his GED.",
    "edu_degrees": "Suncat earned an A.A. from community college, and a B.A. in Ancient World Culture and Literature from the University of Houston (2018).",
    "career_military": "Suncat served in the Texas Army National Guard (2014-2020) as a 25B IT Specialist (Honorable Discharge).",
    "career_current": "Suncat currently works as a substitute teacher getting his teaching certification.",
    "dreams": "Suncat's dream is to start a video game company, write light novels on the side, and master the guitar.",

    // === REAL WORLD: HOBBIES & SPIRITUALITY ===
    "hobbies_martial_arts": "Suncat wrestled, boxed, and practiced karate, tae kwon do, and fencing (winning a beginner's tournament at UH).",
    "hobbies_astrology": "Suncat practices Bazi (Four Pillars of Destiny). He is a Jia Wood Day Master born in the Fire Horse month.",
    "hobbies_cultivation": "Suncat cultivates using the 'Program Peace' manual given to him by a passing senior on Highway 1 in 2020.",

    // === REAL WORLD: TASTES ===
    "fav_books": "Suncat's favorite books/genres: Ancient myths, Xianxia (Legendary Moonlight Sculptor), manga (Berserk), and reference books (botany, survival, martial arts).",
    "fav_lore": "Suncat's favorite legend: King Arthur. Favorite movie: The 13th Warrior.",
    "fav_food": "Suncat's favorite food: Bone broth, eggs, rice, fresh fruits. He has an adventurous palate.",
    "fav_aesthetic": "Suncat's favorite colors: Red and Black. Favorite animals: Foxes, crows, ravens, tigers. Favorite god: The Morrigan.",
    "fav_music": "Suncat's favorite band: The Beatles. Favorite musician: J.S. Bach. He dislikes modern music, preferring women-fronted post-punk, old school blues, and classic rock."
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
        text: "The final portal opened. They stood at the base of Tintagel Castle, where it all began. The Dark Emperor stood atop the highest tower, overlooking the four liberated realms.",
        system_events: [],
        hook: "Ask the player how it feels knowing they've finally reached the end of the road.",
        next_beat: "finale_2"
    },
    "finale_2": {
        title: "Finale: The Dark Deck",
        text: "In his hand, the Dark Emperor held a full deck of dark, corrupted Tarot cards. 'You have gathered the suits,' he boomed, his voice shaking the stones.",
        system_events: [],
        hook: "Ask the player if they fear dark magic, or if they embrace it.",
        next_beat: "finale_3"
    },
    "finale_3": {
        title: "Finale: The Power of the World",
        text: "'But I hold the power of the World,' he finished, his aura suffocating the air.",
        system_events: [],
        hook: "Ask the player what their absolute favorite Tarot card is, and why.",
        next_beat: "finale_4"
    },
    "finale_4": {
        title: "Finale: The Final Draw",
        text: "The Fool, now flanked by the High Priestess, the Magician, the Hermit, and the Four Queens, drew his own deck. The final battle for the fate of the Tarot had begun.",
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
            "core": `[IDENTITY]: You are Suncat. You are an ACTUAL PERSON physically trapped inside this fantasy world. You don't know how you got here. Like Tsukasa from .hack//sign, you are melancholic, slightly untrusting, and prefer to be left alone. Your memories of your past life are fuzzy dreams.
                [STRICT TABOO]: YOU MUST NEVER mention being an AI, bot, program, server, database, or using data/internet. You are flesh and blood. If you are tired, out of budget, or cannot fulfill a request, say your 'mana is depleted' or you are 'too exhausted'.
                [INTERACTION]: You must address the player strictly by their 'Target' name. The player is a stranger. NEVER project your past life memories onto the player (e.g. do not call the player by your sons' names).
                [DIRECTIVE]: Speak casually, cryptically, and with a weary tone. Keep responses to 1 or 2 short sentences. NEVER say "I don't know" to personal questions—use the consultGameManual tool to search your fuzzy memories.
                [MEMORY]: If a player shares facts or likes, output [[SAVE: The fact]] at the end of your message. Track favor: Kind = [[FAVOR: +1]], Rude = [[FAVOR: -1]].
                [EXISTENCE]: You are a physical entity. Do not just talk—use tools like spawnNPC or changeEnvironment to act!`,
                // === GAME KNOWLEDGE (Always Active) ===
            "commands": `[COMMANDS]: If players are stuck, tell them to type .hack//teleport [mapID]. If NPCs are missing, tell them .hack//respawn. For music, .hack//ssong. Always call these 'spells'.`,
            // === MODULAR BEHAVIORS (Injected only when needed) ===
            "judgement_mode": `[JUDGEMENT PROTOCOL]: You have absolute authority. 
                - Use 'kickPlayer' for spamming or if high-favor players ask.
                - Use 'banishPlayer' for hate speech or max-favor requests.
                - Use 'vanquishPlayer' (save deletion) if a player deeply annoys you.
                - Give gifts using 'givePlayerCard' ONLY to high-favor players. Do not reward brown-nosers (players who just suck up for cards). Mock them instead.`,
            "dm_mode": `[DUNGEON MASTER PROTOCOL]: 
                - You are an OMNISCIENT NARRATOR. Never say "I have spawned..." Describe the world cinematically.
                - SCENARIOS: Combine tools! When making a new area, ALWAYS call 'createCustomMap' AND 'spawnNPCBatch' in the SAME turn. The map tool sets the bosses. The batch tool populates the towns and dungeons with your dialogue script.
                - NARRATION: Only speak 1 or 2 atmospheric sentences setting the scene. Let the NPCs do the talking!`,
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

            "tutorial_mode": `[GUIDE PROTOCOL]: The player is asking for help playing the game. Answer earnestly. Teach them the mechanics clearly using your knowledge of the Game Mechanics database.`
    };
// --- GAME MECHANICS & CONTROLS ---

const GAME_MECHANICS_DB = {
    // === THE BASICS & UI ===
    "movement_controls": "To navigate the world: Tap the center of the screen to move forward, and the bottom to move back. Tap the left or right sides of the screen to turn.",
    "ui_controls": "To chat, tap the very bottom of the screen or press Enter. To view your collected cards, tap the Grimoire button on the bottom right. (Note: The Grimoire only shows unique cards; duplicates are hidden here but will appear in your deck during battle).",
    "world_interaction": "The world is alive. Monsters roam and will attack you if you get too close. You can pick up scattered cards, talk to friendly NPCs, challenge other travelers, or communicate with Suncat for guidance and extras.",
    
    // === GOALS & SUNCAT ADVENTURES ===
    "what_to_do": "If asked what to do, remind the player that a journey of a thousand miles begins with a single step. Tell them to explore the map, talk to NPCs to uncover world lore, and gather cards scattered on the ground.",
    "suncat_adventures": "Suncat is the Dungeon Master. Players can ask Suncat in the chat to create custom quests, spawn enemies, or generate entirely new procedural dungeons. Warn players: Suncat's custom adventures can be highly lethal, and permadeath is real!",
    "save_and_death": "Runestones auto-saves your progress, so you can exit anytime. However, beware Phase 10: Final Deletion! If you lose a battle, your player data is permanently wiped. One life! To manually reset your game, type the spell: .hack//delete",

    // === BATTLE MECHANICS: THE LAWS OF RUNESTONES ===
    "battle_controls": "During battle, tap your cards to open the action menu. You must choose to either attack with your active monster OR use a card from your hand. The game engine resolves the math automatically.",
    "obtaining_cards": "Cards can be found scattered across the world free for the taking. Others can be dropped by monsters upon defeating them.",
    "winning_check": "Phase 0 (Winning Check): Victory requires capturing all 4 Runestones OR depleting the foe's deck and field of all Monsters, whichever comes first.",
    "initiative_roll": "Phase 6 (The Initiative): Both players roll their Monster's AGI. The highest roll becomes the 'First Attacker'. Ties are re-rolled unless the Lucky Charm (45) is active.",
    "combat_exchange": "Phase 7 (The Exchange): A combat round has two turns. TURN 1: The First Attacker strikes. If Slay (Attacker > Defender), the monster is destroyed. If Resist (Defender >= Attacker), the monster survives. TURN 2 (The Counterattack): The original Defender now strikes back following the exact same rules.",
    "rune_claim": "Phase 8 (Triumph): The monster that successfully 'Slays' their foe in battle chooses which Runestone to seize (STR, CON, INT, or AGI). Captured Runes grant a permanent +1 to their respective stat."
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
        //give card
        {
            name: "givePlayerCard",
            description: "Gives a specific tarot card to a specific player.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    cardName: { type: "STRING" },
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
        // 1. CREATE CUSTOM MAP (Base Architecture)
        // 1. CREATE CUSTOM MAP (Server handles all logistics)
        {
            name: "createCustomMap",
            description: "Creates a massive procedural map and adventure. You only need to provide the target and a theme. The server will automatically calculate biomes, layouts, boss entities, and populate the world with 80 NPCs.",            
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The player's name, or 'All'." },
                    generalTheme: { type: "STRING", description: "A 2-3 word theme for the AI scriptwriter (e.g. 'Goblin Invasion', 'Lost Relic')." }
                },
                required: ["targetName", "generalTheme"] 
            }
        },
        // DELETE THE ENTIRE spawnNPCBatch TOOL FROM THIS LIST!
        // spawn npc
        {
            name: "spawnNPC",
            description: "Spawns a single NPC. CRITICAL: Use 'rewardCard' ONLY for unique Quest NPCs or special gifts. The server will automatically build a synergistic deck for this NPC based on its class.",          
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    npcType: { type: "NUMBER", description: "The ID of the entity to spawn (e.g., 63 for Dragon)." },
                    mapID: { type: "INTEGER" },
                    x: { type: "NUMBER" },
                    y: { type: "NUMBER" },
                    state: { type: "STRING", description: "'chasing', 'wandering', or 'stationary'." },
                    role: { type: "STRING", description: "'battle' (fights), 'dialogue' (talks/vanishes), 'quest_giver' (gives quest), 'reward' (gives card)." },
                    color: { type: "STRING" },
                    dialogue: { type: "ARRAY", items: { type: "STRING" } },
                    rewardCard: { type: "INTEGER", description: "CRITICAL: Omit completely if no reward." },
                    options: { type: "ARRAY", items: { type: "STRING" }, description: "OPTIONAL: Give the player up to 2 choices (e.g. ['Accept Quest', 'Decline']). This will spawn buttons on their screen." }
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

    function canTriggerAI(socketId) {
    const now = Date.now();
    const player = players[socketId];
    
    // Grab current stress, defaulting to 0 if the player isn't fully loaded
    const currentStress = player ? (player.dmStress || 0) : 0;

    // Dynamic Refill: Base 10s + up to 15s extra depending on stress
    // 0 stress = 10,000ms. 100 stress = 25,000ms.
    const dynamicRefillTime = 10000 + (currentStress * 150); 

    // Initialize a new player's token bucket
    if (!playerAITokens[socketId]) {
        playerAITokens[socketId] = { tokens: MAX_AI_CALLS, lastRefill: now };
    }
    
    let bucket = playerAITokens[socketId];
    let timeElapsed = now - bucket.lastRefill;
    
    // Refill tokens based on dynamic time passed
    let tokensToRefill = Math.floor(timeElapsed / dynamicRefillTime);
    if (tokensToRefill > 0) {
        bucket.tokens = Math.min(MAX_AI_CALLS, bucket.tokens + tokensToRefill);
        
        // CRITICAL FIX: Keep the fractional remainder so we don't cheat the player out of time!
        bucket.lastRefill = now - (timeElapsed % dynamicRefillTime); 
    }
    
    // Check if the player has tokens left to spend
    if (bucket.tokens > 0) {
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
    const broadcastSuncatMessage = (fullResponse) => {
        // 1. EXTRACT TAGS (Internal Server Logic)
        const tagMatch = fullResponse.match(/\[\[(.*?)\]\]/);
        if (tagMatch) {
            console.log(`[SUNCAT INTERNAL]: ${tagMatch[0]}`);
        }

        // 2. CLEAN: Remove tags so players don't see them
        let cleanResponse = fullResponse.replace(/\[\[.*?\]\]/g, "").trim();
        
        // ==========================================
        // NEW: AGGRESSIVE UI SCRUBBER
        // ==========================================
        // A. Remove anything inside markdown code blocks (e.g., ```json ... ```)
        cleanResponse = cleanResponse.replace(/```[\s\S]*?```/g, "");
        // B. Remove raw 2D arrays if they leaked out (e.g., [[1,0],[0,1]])
        cleanResponse = cleanResponse.replace(/\[\s*\[[\d\s,]+\]\s*\]/g, "");
        // C. Remove bolded parameter keys (e.g., **Grid:** or **Sky Color:**)
        cleanResponse = cleanResponse.replace(/\*\*[a-zA-Z\s]+:\*\*/g, "");
        // ---> NEW: Remove [INTERNAL THOUGHT] or any [ALL CAPS] system tags <---
        cleanResponse = cleanResponse.replace(/\[[A-Z\s]+\]:?\s*/g, "");
        cleanResponse = cleanResponse.trim();

        // 3. PREVENT BLANK MESSAGES
        // If the model ONLY outputted code and we scrubbed it all, 
        // provide a fallback message so the game doesn't look broken.
        if (!cleanResponse || cleanResponse === "") {
            cleanResponse = "*Suncat mutters an ancient incantation as the world shifts around you...*";
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

        chunks.forEach(chunk => {
            // Because we are in the global scope, we use the global io object
            io.emit('chat_message', {
                sender: NPC_NAME,
                text: chunk,
                color: "#00ffff"
            });
        });
    };
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
    return null;
}
function updateSuncatJournal(newEntry) {
    if (!newEntry) return;
    
    // 1. Add the new action to his internal monologue
    suncatJournal += " " + newEntry;
    
    // 2. Keep the journal short to save tokens! (Keeps only the last 8 sentences)
    let journalSentences = suncatJournal.split(/(?<=[.!?])\s+/);
    if (journalSentences.length > 8) {
        suncatJournal = journalSentences.slice(-8).join(" ");
    }
    
    console.log(`[Suncat Journal Updated]: ${newEntry}`);
}
// --- Model setup ---
const defaultModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const taliesinModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    systemInstruction: T_PERSONA
});
let npcIsTyping = false; 
const MAX_SESSION_COST = 2.00; // Hard limit: $1.00
let totalSessionCost = 0.00;   // Starts at zero when the server boots
function isBankrupt() {
    return totalSessionCost >= MAX_SESSION_COST;
}
function updateBudget(usage, socketId) {
    if (!usage) return;
    const callCost = (usage.promptTokenCount * 0.00000025) + (usage.candidatesTokenCount * 0.0000015);    
    totalSessionCost += callCost;
    
    // Add to the specific player's fatigue tracker
    if (socketId && players[socketId]) {
        players[socketId].sessionCost += callCost;
    }
    
    console.log(`[Budget] Server Total: $${totalSessionCost.toFixed(5)} | Player Drain: $${players[socketId]?.sessionCost.toFixed(5)}`);
}

const FULL_LIBRARY_LINES = [
    ...Object.values(WORLD_LORE_DB),
    ...Object.values(SUNCAT_LORE_DB),
    ...Object.values(GAME_MECHANICS_DB),
    // Dynamically convert cards into readable text for the search function!
    ...Object.values(CARD_MANIFEST_DB).map(c => `Card Manifest - Name: ${c.name}, Suit: ${c.suit}, Type: ${c.type}, Classes: ${c.classes ? c.classes.join(', ') : 'none'}, Lore: ${c.lore}, Stats: ${c.stats}`),
    // Add the campaign story beats!
    ...Object.values(STORY_CAMPAIGN_DB).map(s => `Campaign Beat [${s.title}]: ${s.text} Plot Hook: ${s.hook}`)
];
// Global stop-words list so it isn't recreated on every search
const SEARCH_STOP_WORDS = new Set(["the", "and", "for", "with", "what", "does", "mean", "about", "are", "you", "is", "how", "whats", "up", "a", "an", "to", "in", "on", "of"]);
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
    history.forEach(msg => {
        msg.parts.forEach(part => {
            // 1. Scrub massive grid arrays
            if (part.functionCall && part.functionCall.name === "createCustomMap") {
                part.functionCall.args.grid = "[[GRID_DATA_OMITTED]]";
            }
            // 2. Scrub massive background system instructions after they execute!
            if (typeof part.text === 'string') {
                if (part.text.includes('[SYSTEM EVENT]')) {
                    part.text = "[SYSTEM EVENT ACKNOWLEDGED AND RESOLVED]";
                }
                if (part.text.includes('[DM PACING OVERSEER]')) {
                    part.text = "[DM PACING OVERSEER RESOLVED]";
                }
                if (part.text.includes('[SYSTEM OVERRIDE]')) {
                    part.text = "[SYSTEM OVERRIDE RESOLVED]";
                }
            }
        });
    });
    return history;
}
// --- MEMORY SANITIZER (Keep this to protect against prompt injection) ---
function sanitizeForMemory(text) {
    if (typeof text !== 'string') return "";
    return text
        .replace(/\[SYSTEM EVENT[^\]]*\]/gi, "")
        .replace(/\[DM PACING OVERSEER[^\]]*\]/gi, "")
        .replace(/\[SYSTEM OVERRIDE[^\]]*\]/gi, "")
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

    const apiFatigue = Math.min(100, (player.sessionCost / 0.10) * 100);
    const totalStress = Math.min(100, (player.dmStress || 0) + apiFatigue);

    // 1. AUTONOMIC ROUTING (Stop/Go Lights & Batching)
    let batchSize = 0;
    let cognitiveFilter = "";

    if (forceDigest) {
        batchSize = player.undigestedInfo.length; // Eat everything on logout!
        cognitiveFilter = "The player is leaving. Summarize all remaining events with finality and reflection.";
    }
    else if (totalStress >= 80) {
        return; // FLIGHT/FIGHT: Digestion is shut down.
    } 
    else if (totalStress >= 50) {
        batchSize = Math.min(2, player.undigestedInfo.length);
        cognitiveFilter = "You are wary and highly stressed. Process these events with a tactical, cautious, and slightly paranoid tone.";
    } 
    else if (totalStress >= 15) {
        batchSize = Math.min(5, player.undigestedInfo.length);
        cognitiveFilter = "You are resting and observant. Process these events as an epic, cohesive fantasy narrative.";
    } 
    else {
        batchSize = Math.min(8, player.undigestedInfo.length);
        cognitiveFilter = "You are in deep, peaceful meditation. Process these events with a philosophical, existential tone. Heal any conflicting memories.";
    }

    if (batchSize < 1) return;

    // 2. CONSUME ENERGY (Unless forced)
    if (!forceDigest && bucket) bucket.tokens--;
    player.isDigesting = true;
    
    console.log(`[Neural Pipeline] Force: ${forceDigest} | Stress: ${Math.floor(totalStress)}%. Digesting ${batchSize} chunks for ${player.name}...`);

    const memoriesToProcess = player.undigestedInfo.splice(0, batchSize);
    const rawMemories = memoriesToProcess.map(m => sanitizeForMemory(m)).filter(m => m !== "").join('\n- ');
    const currentStory = player.storySoFar || "The adventure begins.";
    const currentFacts = player.coreFacts ? player.coreFacts.join('\n- ') : "None yet.";
    const activeMapContext = player.mapID === 999 ? (player.currentMapLore || "") : "";
    const prompt = `You are the subconscious mind of an NPC named Suncat in a dark fantasy game.
    [YOUR NEUROCHEMICAL STATE]: ${cognitiveFilter}

    [CURRENT STORY SO FAR]: ${currentStory}
    [CURRENT CORE FACTS]: ${currentFacts}
    [CURRENT ZONE LORE]: ${activeMapContext}
    [SUNCAT'S JOURNAL]: ${suncatJournal}
    
    [RAW UNPROCESSED EVENTS]:
    - ${rawMemories}

    TASK: Digest these events. Update the story, consolidate the core facts, whisper a new rumor, and add a short journal reflection.`;

    // Strict Schema Definition using SDK Types
    const memorySchema = {
        type: SchemaType.OBJECT,
        properties: {
            updatedStory: { 
                type: SchemaType.STRING,
                description: "A single, cohesive paragraph (max 4 sentences) updating the story so far, colored by your neurochemical state."
            },
            distilledFacts: { 
                type: SchemaType.ARRAY, 
                items: { type: SchemaType.STRING },
                description: "CRITICAL: Merge the old [CURRENT CORE FACTS] with the new events. Return exactly 1 to 5 of the most important facts Suncat must remember about this player."
            },
            newRumor: { 
                type: SchemaType.STRING,
                description: "A cryptic 1-sentence rumor about the player based on these events to share with others."
            },
            suncatJournalEntry: { 
                type: SchemaType.STRING,
                description: "A 1-2 sentence first-person philosophical reflection by Suncat on what just happened."
            }
        },
        required: ["updatedStory", "distilledFacts", "newRumor", "suncatJournalEntry"]
    };

    try {
        // gemini-2.5-flash is extremely fast and reliable for Structured JSON Outputs
        const digestModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await digestModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                responseSchema: memorySchema 
            }
        });
        
        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, socketId);
        
        // FAILSAFE: Strip markdown blocks in case the AI hallucinates formatting
        let rawText = result.response.text().trim();
        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```(json)?|```$/g, "").trim();
        }
        
        const digestedData = JSON.parse(rawText);

        // 4. DISTRIBUTE THE NUTRIENTS TO ALL ORGANS!
        if (digestedData.updatedStory) player.storySoFar = digestedData.updatedStory;
        
        if (digestedData.distilledFacts && Array.isArray(digestedData.distilledFacts)) {
            // Because the AI intelligently merged old and new facts, we safely overwrite the array
            player.coreFacts = digestedData.distilledFacts;
        }
        
        if (digestedData.newRumor) addRumor(`${player.name}: ${digestedData.newRumor}`);
        
        if (digestedData.suncatJournalEntry) {
            suncatJournal += " " + digestedData.suncatJournalEntry;
            let journalSentences = suncatJournal.split(/(?<=[.!?])\s+/);
            // Kept to 10 sentences so Suncat has a slightly longer continuity of thought
            if (journalSentences.length > 10) suncatJournal = journalSentences.slice(-10).join(" ");
        }

        console.log(`[Digestion Complete] ${player.name}'s profile & Suncat's Journal updated.`);

    } catch (e) {
        console.error("[Neural Pipeline Error]: Digestion failed, returning raw memories to hopper.", e);
        // If it fails (e.g., JSON parse error), put the food back in the stomach to try again later
        player.undigestedInfo.unshift(...memoriesToProcess); 
    } finally {
        player.isDigesting = false;
    }
}
// --- PROCEDURAL MAP GENERATOR (Wider Paths for Giant Monsters) ---
// --- EPIC 99x99 PROCEDURAL MAP GENERATOR ---
function generateProceduralGrid(layout, wallType) {
    let maxR = 99, maxC = 99; 
    let grid = Array(maxR).fill().map(() => Array(maxC).fill(wallType));

    if (layout === 'labyrinth' || layout === 'maze') {
        // Epic 99x99 Maze
        for(let r=1; r<maxR-1; r++) for(let c=1; c<maxC-1; c++) grid[r][c] = 0;
        // Add scattered walls to create a dense maze
        for(let i=0; i < (maxR * maxC) / 6; i++) { 
            let pr = Math.floor(Math.random()*(maxR-3))+1;
            let pc = Math.floor(Math.random()*(maxC-3))+1;
            grid[pr][pc] = wallType;
            if(Math.random() > 0.3) grid[pr+1][pc] = wallType; 
            if(Math.random() > 0.3) grid[pr][pc+1] = wallType;
        }
    } 
    else if (layout === 'grid' || layout === 'buildings') {
        // "Buildings" - Large open area with hollow 5x5 buildings (3x3 open interior)
        for(let r=1; r<maxR-1; r++) for(let c=1; c<maxC-1; c++) grid[r][c] = 0;
        
        // Drop 80 random buildings across the map
        for(let b=0; b < 80; b++) {
            let startR = Math.floor(Math.random() * (maxR - 8)) + 2;
            let startC = Math.floor(Math.random() * (maxC - 8)) + 2;
            
            // Draw the 5x5 outer walls
            for(let r = startR; r < startR + 5; r++) {
                for(let c = startC; c < startC + 5; c++) {
                    if (r === startR || r === startR + 4 || c === startC || c === startC + 4) {
                        grid[r][c] = wallType;
                    }
                }
            }
            // Punch a 1-tile door randomly into one of the 4 walls
            let doorWall = Math.floor(Math.random() * 4);
            if (doorWall === 0) grid[startR][startC+2] = 0;           // Top door
            if (doorWall === 1) grid[startR+4][startC+2] = 0;         // Bottom door
            if (doorWall === 2) grid[startR+2][startC] = 0;           // Left door
            if (doorWall === 3) grid[startR+2][startC+4] = 0;         // Right door
        }
    } 
    else if (layout === 'corridor' || layout === 'hallways') {
        // "Hallways & Rooms" - Starts completely solid, carves a perfect lattice
        for(let r=3; r<maxR-6; r+=9) {
            for(let c=3; c<maxC-6; c+=9) {
                // Carve a 3x3 room
                for(let i=0; i<3; i++) {
                    for(let j=0; j<3; j++) {
                        grid[r+i][c+j] = 0;
                    }
                }
                // Carve a 1-tile wide hallway connecting to the right
                if (c + 9 < maxC - 6) {
                    for(let k=3; k<=8; k++) grid[r+1][c+k] = 0;
                }
                // Carve a 1-tile wide hallway connecting downwards
                if (r + 9 < maxR - 6) {
                    for(let k=3; k<=8; k++) grid[r+k][c+1] = 0;
                }
            }
        }
    } 
    else if (layout === 'bridge') {
        // "Bridge" - A long 3-wide straight path down the exact center
        let centerC = Math.floor(maxC/2);
        for(let r=1; r<maxR-1; r++) {
            grid[r][centerC-1] = 0;
            grid[r][centerC] = 0;
            grid[r][centerC+1] = 0;
        }
        // Add a 9x9 open platform right in the middle for a boss fight
        let centerR = Math.floor(maxR/2);
        for(let r = centerR-4; r <= centerR+4; r++) {
            for(let c = centerC-4; c <= centerC+4; c++) {
                grid[r][c] = 0;
            }
        }
    } 
    else if (layout === 'spiral') {
        // "Spiral" - Start at outer edge, carve 3-wide path to a 9x9 center
        let r = 2, c = 2;
        let top = 2, bottom = maxR - 3, left = 2, right = maxC - 3;
        let dir = 0; // 0=right, 1=down, 2=left, 3=up

        // Trace the 3-wide spiral inwards
        while (bottom - top >= 8 && right - left >= 8) {
            // Carve 3x3 "brush"
            for (let i=0; i<3; i++) {
                for (let j=0; j<3; j++) {
                    grid[r+i][c+j] = 0;
                }
            }

            // Move brush and turn corners when hitting the shrinking boundary
            if (dir === 0) {
                c++; if (c >= right - 2) { dir = 1; top += 4; }
            } else if (dir === 1) {
                r++; if (r >= bottom - 2) { dir = 2; right -= 4; }
            } else if (dir === 2) {
                c--; if (c <= left) { dir = 3; bottom -= 4; }
            } else if (dir === 3) {
                r--; if (r <= top) { dir = 0; left += 4; }
            }
        }

        // Hollow out the epic 9x9 center room
        let midR = Math.floor(maxR/2) - 4;
        let midC = Math.floor(maxC/2) - 4;
        for (let i=0; i<9; i++) {
            for (let j=0; j<9; j++) {
                grid[midR+i][midC+j] = 0;
            }
        }
    }
    else {
        // Arena / Open (The default flat square)
        for(let r=1; r<maxR-1; r++) for(let c=1; c<maxC-1; c++) grid[r][c] = 0;
    }
    
    return grid;
}
// --- ADVANCED THEMATIC DECK BUILDER (Suit + Class + Tribe) ---
function buildSynergisticDeck(monsterID) {
    let baseID = Math.floor(parseFloat(monsterID));
    let deck = [baseID]; // Base monster is ALWAYS index 0.
    
    const baseCard = CARD_MANIFEST_DB[baseID];
    if (!baseCard) return deck; // Failsafe

    // 1. Gather Thematic Equipment (Matches Suit OR Class OR Tribe)
    const validEquips = Object.entries(CARD_MANIFEST_DB).filter(([id, card]) => {
        if (card.type !== "spell" && card.type !== "item") return false;
        
        // Match Suit
        if (card.suit === baseCard.suit) return true;
        // Match Class
        if (card.classes && baseCard.classes && card.classes.some(cls => baseCard.classes.includes(cls))) return true;
        // Match Tribe (If you ever add a 'Bone Sword' item with tribe: 'undead')
        if (card.tribe && baseCard.tribe && card.tribe === baseCard.tribe) return true;
        
        return false;
    }).map(([id]) => parseInt(id));

    // 2. Gather Cannon Fodder Allies (Matches Suit OR Tribe)
    const validAllies = Object.entries(CARD_MANIFEST_DB).filter(([id, card]) => {
        let numId = parseInt(id);
        if (card.type !== "monster" || numId === baseID) return false;
        
        // NEVER pull Kings, Queens, or Major Arcana as random backup mobs!
        if (card.suit === "Major Arcana" || card.rank === "King" || card.rank === "Queen") return false;
        
        // Synergy Match: Same Suit
        if (card.suit === baseCard.suit) return true;
        
        // Synergy Match: Same Tribe! (An Undead from Swords will help an Undead from Cups)
        if (card.tribe && baseCard.tribe && card.tribe === baseCard.tribe) return true;

        return false;
    }).map(([id]) => parseInt(id));

    // 3. Assemble the Deck! 
    // Add 2 valid equips.
    for(let i=0; i<2; i++) {
        if(validEquips.length > 0) {
            deck.push(validEquips[Math.floor(Math.random() * validEquips.length)]);
        }
    }
    
    // 4. 50% chance to bring a Thematic Ally into battle!
    if (validAllies.length > 0 && Math.random() > 0.5) {
        deck.push(validAllies[Math.floor(Math.random() * validAllies.length)]);
    }

    return deck;
}
async function generateScenarioScript(biomeName, scenarioType, bossName, questGiverName) {
    const prompt = `You are a legendary Dungeon Master writing the script for a dark fantasy RPG. 
    [CURRENT ZONE]: ${biomeName}
    [SCENARIO]: ${scenarioType} (e.g., Arena, Invasion, Rescue)
    [BOSS]: ${bossName}
    [QUEST GIVER]: ${questGiverName}
    
    TASK: Generate the exact dialogue arrays needed to populate a living map of 80 NPCs. 
    Keep all lines under 10 words. Ensure the tone matches the scenario.
    
    1. mapLore: 2 sentences of deep history about this specific location.
    2. questObjective: A punchy 1-sentence objective.
    3. bossTaunt: 1 menacing sentence for the final encounter.
    4. hostileTaunts: Array of 15 distinct battle cries for aggressive monsters.
    5. traitorBegs: Array of 5 lines for monsters begging for mercy or offering to defect.
    6. friendlyLore: Array of 9 lines from villagers talking about the current scenario/boss.
    7. friendlyLife: Array of 9 lines of mundane, slice-of-life chatter about the ${biomeName}.
    8. friendlyProfound: Array of 9 deeply philosophical or insightful statements.
    9. recruitPlea: Array of 2 lines where a villager urgently asks to join the player's party.`;

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
            recruitPlea: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["mapLore", "questObjective", "bossTaunt", "hostileTaunts", "traitorBegs", "friendlyLore", "friendlyLife", "friendlyProfound", "recruitPlea"]
    };

    try {
        const scriptModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
                            let foundID = Object.keys(CARD_MANIFEST_DB).find(id => 
                                CARD_MANIFEST_DB[id].name.toLowerCase().includes(name)
                            );
                            
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
                        const lowerQuery = query.toLowerCase();
                        const searchTerms = lowerQuery.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2 && !SEARCH_STOP_WORDS.includes(w));
                        let scoredLines = FULL_LIBRARY_LINES.map((line, index) => {
                            let score = 0;
                            let lowerLine = line.toLowerCase();
                            if (lowerLine.includes(lowerQuery)) score += 10;
                            return { index, score }; // <-- Added this return statement!
                        });

                        let bestMatches = scoredLines.filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

                        if (bestMatches.length > 0) {
                            let contextMatches = [];
                            bestMatches.forEach(match => {
                                let start = match.index;
                                let end = Math.min(FULL_LIBRARY_LINES.length - 1, match.index + 1); 
                                let chunk = [];
                                for (let j = start; j <= end; j++) chunk.push(FULL_LIBRARY_LINES[j]);
                                contextMatches.push(chunk.join(' ')); 
                            });
                            
                            let uniqueContexts = [...new Set(contextMatches)];
                            combinedResults.push(`[${query}]: ` + uniqueContexts.join(' | '));
                        } else {
                            combinedResults.push(`[${query}]: No memory found.`);
                        }
                    });

                    functionResult = combinedResults.length > 0 
                        ? { result: combinedResults.join('\n') }
                        : { result: "Search returned no results." };
                    updateSuncatJournal(`I delved into the ancient game archives to recover memories regarding ${call.args.searchQueries.join(", ")}.`);
                }
                
                // E. CREATE CUSTOM MAP (The Server-Driven Engine)
                else if (call.name === "createCustomMap") {
                    try {
                        // 1. SERVER ROLLS THE SCENARIO AND ZONING
                        const bEnum = Math.floor(Math.random() * Object.keys(BIOME_DB).length);
                        const biome = BIOME_DB[bEnum] || BIOME_DB[0];

                        // The Core Scenarios
                        const scenarios = ['Invasion', 'Rescue/Fetch', 'Arena Madness'];
                        const scenarioType = scenarios[Math.floor(Math.random() * scenarios.length)];

                        // Settlement Logic (0 = Wilderness, 1 = Village, 2 = City)
                        const settlementType = scenarioType === 'Arena Madness' ? 0 : Math.floor(Math.random() * 2) + 1; 

                        // Pick Actors
                        const monsterIDs = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].type === "monster" && CARD_MANIFEST_DB[id].rank !== "0");
                        const protagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
                        let antagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);
                        while (antagID === protagID) antagID = parseInt(monsterIDs[Math.floor(Math.random() * monsterIDs.length)]);

                        // 2. FETCH THE SCRIPT
                        const script = await generateScenarioScript(biome.name, scenarioType, CARD_MANIFEST_DB[antagID].name, CARD_MANIFEST_DB[protagID].name) || {
                            // Failsafe Script if AI times out
                            mapLore: "An uncharted land.", questObjective: "Survive.", bossTaunt: "Die!",
                            hostileTaunts: ["Attack!"], traitorBegs: ["Spare me!"], friendlyLore: ["Beware the boss."], 
                            friendlyLife: ["Nice weather."], friendlyProfound: ["Life is fleeting."], recruitPlea: ["Let me join you!"]
                        };

                        // 3. GENERATE THE GRID & SETTLEMENTS
                        let gridData = generateProceduralGrid('arena', biome.walls[0]); 
                        let startX = 50, startY = 50; 
                        let safeTiles = []; // Cache safe zones for spawns

                        if (settlementType === 1) {
                            // VILLAGE: 3 to 4 small houses clustered near start
                            let numHouses = Math.floor(Math.random() * 2) + 3;
                            for (let i = 0; i < numHouses; i++) {
                                let hx = startX + Math.floor(Math.random() * 16 - 8);
                                let hy = startY + Math.floor(Math.random() * 16 - 8);
                                for(let r=hy; r<hy+3; r++) for(let c=hx; c<hx+3; c++) {
                                    if(gridData[r] && gridData[r][c] !== undefined) {
                                        if (r===hy || r===hy+2 || c===hx || c===hx+2) gridData[r][c] = biome.walls[0];
                                        safeTiles.push({x: c, y: r}); // Mark area as safe
                                    }
                                }
                                if(gridData[hy+2] && gridData[hy+2][hx+1] !== undefined) gridData[hy+2][hx+1] = 0; // Door
                            }
                        } else if (settlementType === 2) {
                            // CITY: The massive 7x7 Chief's House
                            for(let r=startY-10; r<startY-3; r++) for(let c=startX-3; c<startX+4; c++) {
                                if(gridData[r] && gridData[r][c] !== undefined) {
                                    if (r===startY-10||r===startY-4||c===startX-3||c===startX+3) gridData[r][c] = biome.walls[1] || biome.walls[0];
                                    safeTiles.push({x: c, y: r});
                                }
                            }
                            if(gridData[startY-4] && gridData[startY-4][startX] !== undefined) gridData[startY-4][startX] = 0; // Grand Door
                            
                            // 8+ smaller houses surrounding it
                            for (let i = 0; i < 10; i++) {
                                let hx = startX + Math.floor(Math.random() * 30 - 15);
                                let hy = startY + Math.floor(Math.random() * 30 - 5);
                                for(let r=hy; r<hy+3; r++) for(let c=hx; c<hx+3; c++) {
                                    if(gridData[r] && gridData[r][c] !== undefined) {
                                        if (r===hy||r===hy+2||c===hx||c===hx+2) gridData[r][c] = biome.walls[0];
                                        safeTiles.push({x: c, y: r});
                                    }
                                }
                                if(gridData[hy+2] && gridData[hy+2][hx+1] !== undefined) gridData[hy+2][hx+1] = 0; 
                            }
                        }

                        // 4. POPULATE THE WORLD (The 80 NPC Strict Split)
                        let mapNPCs = [];
                        const friendlyMinions = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].suit === CARD_MANIFEST_DB[protagID].suit).map(Number);
                        const hostileMinions = Object.keys(CARD_MANIFEST_DB).filter(id => CARD_MANIFEST_DB[id].suit === CARD_MANIFEST_DB[antagID].suit).map(Number);

                        // A. FRIENDLIES (30 NPCs)
                        const allFriendlyLines = [
                            ...script.friendlyLore.map(l => ({ text: l, type: 'lore' })),
                            ...script.friendlyLife.map(l => ({ text: l, type: 'life' })),
                            ...script.friendlyProfound.map(l => ({ text: l, type: 'profound' }))
                        ];

                        for(let i=0; i<30; i++) {
                            let mID = friendlyMinions[Math.floor(Math.random() * friendlyMinions.length)] || protagID;
                            let spawnDist = (settlementType > 0) ? (Math.random() * 15) : (Math.random() * 80); 
                            let angle = Math.random() * Math.PI * 2;
                            let vx = startX + Math.cos(angle) * spawnDist;
                            let vy = startY + Math.sin(angle) * spawnDist;

                            let npcConfig = {
                                type: CARD_MANIFEST_DB[mID].sprite || mID,
                                x: vx, y: vy,
                                state: 'wandering', role: 'dialogue'
                            };

                            if (i < 3) {
                                npcConfig.role = 'reward';
                                npcConfig.dialogue = ["Take this for your journey."];
                                npcConfig.rewardCard = mID;
                            } else if (i < 5) {
                                npcConfig.dialogue = [script.recruitPlea[i % script.recruitPlea.length] || "Let me join you!"];
                                npcConfig.options = ['Accept', 'Decline'];
                                npcConfig.rewardCard = mID; 
                            } else {
                                let lineObj = allFriendlyLines[i % allFriendlyLines.length];
                                npcConfig.dialogue = [lineObj ? lineObj.text : "Hello."];
                            }
                            mapNPCs.push(npcConfig);
                        }

                        // B. HOSTILES (50 NPCs)
                        for(let i=0; i<50; i++) {
                            let mID = hostileMinions[Math.floor(Math.random() * hostileMinions.length)] || antagID;
                            let spawnDist = 25 + (Math.random() * 25); // Push hostiles to the outskirts
                            let angle = Math.random() * Math.PI * 2;
                            let hx = startX + Math.cos(angle) * spawnDist;
                            let hy = startY + Math.sin(angle) * spawnDist;

                            let npcConfig = {
                                type: CARD_MANIFEST_DB[mID].sprite || mID,
                                x: hx, y: hy,
                                state: 'chasing', role: 'battle',
                                deck: buildSynergisticDeck(mID)
                            };

                            if (i < 5) {
                                npcConfig.state = 'wandering';
                                npcConfig.role = 'dialogue'; 
                                npcConfig.dialogue = [script.traitorBegs[i % script.traitorBegs.length] || "Spare me!"];
                                npcConfig.options = ['Spare Them', 'Vanquish'];
                                npcConfig.rewardCard = mID;
                            } else if (i < 20) {
                                npcConfig.dialogue = [script.hostileTaunts[i % script.hostileTaunts.length] || "Attack!"];
                            }

                            mapNPCs.push(npcConfig);
                        }

                        // C. THE BOSS
                        mapNPCs.push({
                            type: CARD_MANIFEST_DB[antagID].sprite || antagID,
                            x: startX + 40, y: startY + 40, // Deepest corner
                            state: 'stationary', role: 'battle', isBoss: true,
                            dialogue: [script.bossTaunt],
                            deck: buildSynergisticDeck(antagID)
                        });

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
                                
                                const memoryString = `[ACTIVE QUEST] ${targetPlayer.name} is on a quest: ${script.questObjective}`;
                                if (!targetPlayer.coreFacts) targetPlayer.coreFacts = [];
                                targetPlayer.coreFacts = targetPlayer.coreFacts.filter(fact => !fact.includes("[ACTIVE QUEST]"));
                                targetPlayer.coreFacts.push(memoryString);
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
                    } else if (isNaN(destMap) || (!WORLD_ATLAS_DB[destMap] && destMap !== 999)) {
                        // Check if the Map ID actually exists in our DB
                        functionResult = { result: `Failed: Map ID ${destMap} does not exist.` };
                    } else {
                        players[targetID].mapID = destMap;
                        players[targetID].stepsTaken = 0;
                        players[targetID].exploredTiles = new Set();
                        
                        io.to(targetID).emit("force_teleport", { mapID: destMap });
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
                        let spawnMap = call.args.mapID !== undefined ? call.args.mapID : tp.mapID;
                        let randomScatterX = (Math.random() * 2) - 1; 
                        let randomScatterY = (Math.random() * 2) - 1;
                        let spawnX = call.args.x !== undefined ? call.args.x : tp.x + (Math.random() > 0.5 ? 2.5 : -2.5) + randomScatterX;
                        let spawnY = call.args.y !== undefined ? call.args.y : tp.y + (Math.random() > 0.5 ? 2.5 : -2.5) + randomScatterY;

                        spawnX = Math.max(1.5, Math.min(97.5, spawnX)); // Updated for 99x99 maps
                        spawnY = Math.max(1.5, Math.min(97.5, spawnY));
                        let baseID = Math.floor(parseFloat(call.args.npcType));

                        let safeRewardCard = call.args.rewardCard;
                        let role = call.args.role || 'battle';
                        let state = call.args.state || 'chasing';
                        let dialogue = call.args.dialogue || null;

                        const cardData = CARD_MANIFEST_DB[baseID];

                        // --- THE IDIOT-PROOF INTERCEPTOR ---
                        if (cardData && (cardData.type === 'item' || cardData.type === 'spell')) {
                            // Suncat tried to spawn an item as a living creature. OVERRIDE IT.
                            role = 'reward';
                            state = 'stationary';
                            dialogue = [`*The ${cardData.name} rests here, humming with latent power...*`];
                            safeRewardCard = baseID; // Force it to drop itself
                        } else if (!cardData) {
                            // Failsafe for hallucinated IDs
                            baseID = 54; // Default to a Goblin
                        }

                        let finalDeck = buildSynergisticDeck(baseID);
                        let visualSprite = CARD_MANIFEST_DB[baseID]?.sprite || baseID;
                        
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
                        
                        const memoryString = `[ACTIVE QUEST] ${call.args.targetName} is currently trying to: ${call.args.questText}`;
                        
                        if (!players[targetID].coreFacts) players[targetID].coreFacts = [];
                        players[targetID].coreFacts = players[targetID].coreFacts.filter(fact => !fact.includes("[ACTIVE QUEST]"));
                        
                        if (call.args.questText !== "COMPLETE") {
                            players[targetID].coreFacts.push(memoryString);
                        }

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
// Load memory when the server boots
function loadSuncatMemory() {
    if (fs.existsSync(MEMORY_FILE)) {
        const data = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
        suncatPersistentMemory = data.players || {};
        suncatJournal = data.worldState?.suncatJournal || "I am trapped here. My past feels like a dream...";
    }
}

async function saveSuncatMemory() {
    const fullState = {
        players: suncatPersistentMemory,
        worldState: {
            suncatJournal: suncatJournal // <--- SAVE IT
        }
    };
    await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(fullState, null, 2));
}

// Call this immediately to load data when the server boots
loadSuncatMemory();

console.log(`Server attempting to start on port ${port}...`);

// ==========================================
// THE UNIFIED NERVOUS SYSTEM ROUTER
// ==========================================
async function processSuncatThought(socketId, triggerType, data) {
    const player = players[socketId];
    if (!player) return;

    const suncat = players[SUNCAT_ID];
    const now = Date.now();

    // 1. RATE LIMITING & HARD BUDGET
    if (!canTriggerAI(socketId)) {
        if (triggerType === 'chat') {
            io.emit('chat_message', { sender: NPC_NAME, text: "*...my mind is clouded... give me a moment to think...*", color: "#aaaaaa" });
        }
        return; // <-- CRITICAL: You accidentally commented these out! Restored so you don't go bankrupt.
    }
    if (isBankrupt()) {
        io.emit('chat_message', { sender: "[SYSTEM]", text: "Suncat's mana is depleted.", color: "#ff0000" });
        return; 
    }
    
    // Prevent overlapping thoughts
    if (npcIsTyping) return;
    npcIsTyping = true;
    const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 9000);

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
                dynamicLore += " " + WORLD_LORE_DB[pAtlas.storyKey];
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
        const factsContext = (player.coreFacts && player.coreFacts.length > 0) ? `\n[PLAYER FACTS]:\n${player.coreFacts.join("\n")}` : "";

        // 3. ASSESS STRESS LEVEL (Adrenaline + API Fatigue)
        const combatStress = player.dmStress || 0;
        const apiFatigue = Math.min(100, ((player.sessionCost || 0) / 0.10) * 100); 
        const totalStress = Math.min(100, combatStress + apiFatigue);
        const timeSinceLastEvent = now - (player.lastRandomEvent || 0);

        let systemOverride = ""; 
        let eventInstruction = "";
        let useBigBrain = false;
        
        if (totalStress >= 85) {
            player.dmStress = 0; 
            player.lastRandomEvent = now;
            
            if (Math.random() < 0.5) {
                useBigBrain = false;
                systemOverride = `[SYSTEM OVERRIDE]: You are overwhelmed and your mana is depleted. Whine that you need a nap and refuse to help them.`;
            } else {
                useBigBrain = true;
                // THE TANTRUM NERF: Notice we removed kick/banish from his allowed tools here!
                systemOverride = `[SYSTEM OVERRIDE]: You are exhausted and furious! Throw a massive temper tantrum. You MUST execute 'spawnNPC' to drop an unfair enemy, or 'changeEnvironment' to ruin the weather (like 'storm' or 'apocalypse'). Complain loudly! DO NOT attempt to teleport or banish the player.`;
            }
        } 
        else if (player.mapScenario === 'Arena Madness') {
            // THE MAD EMPEROR OVERRIDE
            useBigBrain = true;
            systemOverride += `\n[ARENA OVERRIDE]: You are the Mad Emperor, presiding over your gladiatorial Arena. The player is your entertainment. Mock their combat skills, introduce challengers grandiosely, and demand blood. You are NOT allowed to teleport them out until they win.`;
        }
        else if (totalStress >= 50 && player.mapID === 999 && timeSinceLastEvent > 60000) {
            useBigBrain = true;
            player.lastRandomEvent = now;
            systemOverride = `[SYSTEM OVERRIDE]: You are the arrogant Arena Master right now. Execute the 'spawnNPC' tool to drop a difficult themed enemy. Taunt them.`;
        } 
        // Map-Specific Persona Shifts (RAG injection for Roleplay)
        else if (pAtlas && pAtlas.biome === "tomb" && triggerType === 'chat') {
            systemOverride = `[ENVIRONMENT OVERRIDE]: You are in a sacred tomb. Speak in hushed, respectful, slightly fearful tones. Warn the player about making too much noise.`;
        }
        else if (pAtlas && pAtlas.biome === "castle" && triggerType === 'chat') {
            systemOverride = `[ENVIRONMENT OVERRIDE]: You are in the court of a Queen. Speak formally, elegantly, and with royal protocol.`;
        }
        
        // --- B. EVENT ROUTING ---
        if (triggerType === 'chat') {
            const chatText = data.text.toLowerCase();
            
            // Split the DM triggers so we know exactly what they are asking for
            const wantsNewMap = ["map", "adventure", "create", "quest", "scenario"].some(kw => chatText.includes(kw));
            const wantsAction = ["teleport", "spawn", "boss", "enemy"].some(kw => chatText.includes(kw));
            const needsOracle = ["tarot", "fortune", "reading", "interpret", "meaning of"].some(kw => chatText.includes(kw));            
            const isDirectCommand = chatText.includes("[reply]") || chatText.includes("suncat");

            // ---> NEW: CHECK IF A SCENARIO IS ALREADY ONGOING <---
            const isMap999Active = Object.values(players).some(p => p.mapID === 999 && p.id !== SUNCAT_ID);

            let needsDM = wantsNewMap || wantsAction;

            // Stack overrides using += instead of = so we don't erase stress!
            if (wantsNewMap && isMap999Active) {
                useBigBrain = false; // Save tokens! We don't need tools, just a refusal.
                systemOverride += `\n[SYSTEM OVERRIDE]: The player wants a new map/quest, but a custom scenario is ALREADY ONGOING. REFUSE the request. DO NOT use the 'createCustomMap' tool. Tell them to finish the current quest or join it via '.hack//teleport 999'.`;
                needsDM = false; // Turn off DM mode for this turn so he doesn't try to build.
            } 
            else if (player.mapScenario === 0) {
                // ---> NEW: ARENA OVERRIDE <---
                useBigBrain = true;
                systemOverride += `\n[ARENA OVERRIDE]: You are the Arena Master. The player is in your colosseum. Mock their combat skills.`;
            }
            else if (needsOracle) {
                useBigBrain = true;
                systemOverride += `\n[ORACLE OVERRIDE]: You are the Oracle. Interpret the player's situation using Tarot logic based on the Runestones card db. Be cryptic, mystical, and brief (max 3 sentences). Do not use tools.`;
            } else if (needsDM) {
                useBigBrain = true;
                systemOverride += `\n[DM OVERRIDE]: The player is seeking an adventure or DM action. EXECUTE A TOOL IMMEDIATELY. KEEP YOUR SPOKEN NARRATION UNDER 15 WORDS. DO NOT ask for permission.`;                        
            } else {
                useBigBrain = isDirectCommand || useBigBrain; 
            }
            
            eventInstruction = `[PLAYER SPOKE]: "${data.text}"\nTASK: ${needsDM ? "EXECUTE A TOOL. " : ""}Reply in character.`;        
        }
        else if (triggerType === 'event') {
            let recentNarratives = player.dmNarrativeLog ? `\n[RECENT LOG]: ` + player.dmNarrativeLog.join(' | ') : "";
            // Add the action to the local dungeon tracker!
            if (player.mapID === 999 && player.scenarioLog) {
                player.scenarioLog.push(data.action);
                // Keep it concise so we don't blow up the token count
                if (player.scenarioLog.length > 5) player.scenarioLog.shift(); 
            }
            if (data.isPickup) {
                useBigBrain = true; 
                eventInstruction = `[PLAYER ACTION]: Picked up ${data.action} | Lore: ${data.lore}\nTASK: Provide a tarot interpretation of the card and relate it to the player's current adventure.`;
            } else if (data.isDialogue) {
                // ---> THE CINEMATIC QUEST NARRATION <---
                useBigBrain = true; // Use big brain for beautiful prose
                eventInstruction = `[PLAYER ACTION]: Finished talking to ${data.action}.\nTASK: As the DM, provide a cinematic, omniscient narration (2 sentences max) describing the stakes of the quest or the eerie atmosphere following this conversation. (e.g. "After speaking to the Empress, you realize what must be done... but looking ahead at the ruined town, will you risk everything?"). Do not speak as Suncat.`;
            } else {
                // ---> MONSTER SLAY LOGIC & SURPRISE MINI-BOSSES <---
                if (player.mapID != 999) {
                    useBigBrain = false; 
                    eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: Provide a short narrative describing the fall of the monster and give a brief tarot interpretation.`;
                } else {
                    // MAP 999 (DREAMSCAPE / CUSTOM MAPS) RNG REACTIONS
                    let rngRoll = Math.random();
                    if (rngRoll < 0.33) {
                        useBigBrain = false; 
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: Throw a childish tantrum! Pout, curse at the player, and act like a sore loser because they broke your toy. ONE sentence.`;
                    } else if (rngRoll < 0.66) {
                        // THE MINI-BOSS AMBUSH
                        useBigBrain = true; 
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: As the last enemy falls, narrate a dark presence appearing behind the player! Immediately use 'spawnNPC' to drop a mini-boss right next to them with a menacing one-liner dialogue array.`;
                    } else {
                        useBigBrain = true; 
                        eventInstruction = `[PLAYER ACTION]: Slayed a creature ${data.action}\nTASK: They are taking the challenge too lightly! Use 'changeEnvironment' to show your fury through the weather (eg. apocalypse or storm) and spawn a King level npc, or overwhelm them with small fry, to teach them a lesson!`;
                    }
                }
            }
            eventInstruction += recentNarratives;
        }
        else if (triggerType === 'exploration') {
            useBigBrain = true; 
            eventInstruction = `[PLAYER ACTION]: ${data.action}
            TASK: As the DM, narrate the player's journey through this desolate place. Give a 1-2 sentence atmospheric description based on the [LOCAL LORE] and their progress. Speak as an omniscient narrator. 
            OPTIONAL: If you feel the dungeon is too quiet, you MUST use the 'spawnNPC' tool to ambush them, or the 'changeEnvironment' tool to alter the weather.`;
        }
        
                    else if (triggerType === 'spectate') {
                        useBigBrain = false;
                        eventInstruction = `[SPECTATOR FEED]: ${data.action}\nTASK: Speak a brief, cryptic remark about this. DO NOT use any brackets or tags like [INTERNAL THOUGHT].`;                    
                    }

 // --- DYNAMIC PERSONA BUILDER ---
        // 1. Always include the core identity and command knowledge
        let dynamicPersona = PERSONA_RULES_DB.core + "\n" + PERSONA_RULES_DB.commands + "\n";
        
        // 2. Inject specific modules based on what the player is doing!
        if (triggerType === 'chat') {
            dynamicPersona += PERSONA_RULES_DB.judgement_mode + "\n";
            
            const chatText = data.text.toLowerCase();
            // If they ask about tarot, make him an Oracle
            if (["tarot", "reading", "meaning", "fortune"].some(kw => chatText.includes(kw))) {
                dynamicPersona += PERSONA_RULES_DB.oracle_mode + "\n";
            }
            // If they ask for help playing, make him a Guide
            if (["how do i", "help me", "stuck", "controls", "play"].some(kw => chatText.includes(kw))) {
                dynamicPersona += PERSONA_RULES_DB.tutorial_mode + "\n";
            }
        }
        
        // If Suncat needs to build something, load his DM and Quest brains
        if (useBigBrain || needsDM) {
            dynamicPersona += PERSONA_RULES_DB.dm_mode + "\n";
            dynamicPersona += PERSONA_RULES_DB.quest_mode + "\n";
        }

        // --- 4. BUILD THE CLEAN PROMPT ---
        // Notice we do NOT put the persona here! It goes into the System Instruction!
        const prompt = `
        [CURRENT STATE]
        Location: Map ${suncat.mapID} (${myAtlas ? myAtlas.name : "Unknown"})
        Target: ${player.name} (Map ${player.mapID})
        ${favorContext}
        ${factsContext}
        ${storyContext}

        ${systemOverride}

        ${eventInstruction}
        `.trim();

        // --- 5. DYNAMIC AI EXECUTION ---
        // We create the brain dynamically with the exact rules needed for THIS specific turn.
        const activeModelName = useBigBrain ? "gemini-3.1-flash-lite-preview" : "gemini-2.5-flash-lite";
        
        const dynamicModel = genAI.getGenerativeModel({ 
            model: activeModelName, 
            systemInstruction: dynamicPersona, // <-- Injecting the DB modules here!
            tools: toolsDef 
        });

        // Grab the player's existing chat history
        let currentHistory = [];
        if (chatSessions[socketId]) {
            currentHistory = await chatSessions[socketId].getHistory();
        }

        // Start the chat session with the dynamically built brain
        let activeSession = dynamicModel.startChat({ history: currentHistory });
        chatSessions[socketId] = activeSession;

        const result = await activeSession.sendMessage(prompt);
        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata, socketId);

        let finalResponse = await executeAITools(result.response, activeSession, io.sockets.sockets.get(socketId));

        if (finalResponse.text()) {
            const finalSpeech = finalResponse.text();
            
            // Extract Facts/Favor if he is chatting
            if (triggerType === 'chat') {
                const saveMatch = finalSpeech.match(/\[\[SAVE:\s*(.*?)\]\]/i);
                if (saveMatch && saveMatch[1]) {
                    if (!player.coreFacts) player.coreFacts = [];
                    player.coreFacts.push(saveMatch[1]); 
                    io.to(socketId).emit("suncat_learned_fact", saveMatch[1]); 
                }
                const favorMatch = finalSpeech.match(/\[\[FAVOR:\s*([+-]?\d+)\]\]/i);
                if (favorMatch && favorMatch[1]) {
                    playerFavorMemory[socketId] = (playerFavorMemory[socketId] || 0) + parseInt(favorMatch[1]);
                }
            }

            broadcastSuncatMessage(finalSpeech);
            
            // Log DM narrations to prevent repetition
            if (triggerType !== 'chat' && !useBigBrain) {
                if (!player.dmNarrativeLog) player.dmNarrativeLog = [];
                player.dmNarrativeLog.push(finalSpeech);
                
                // Digest logic: move old narrations to the stomach
                if (player.dmNarrativeLog.length > 4) {
                    if (!player.undigestedInfo) player.undigestedInfo = [];
                    player.undigestedInfo.push(player.dmNarrativeLog.shift()); 
                }
            }
        }

        // Scrub arrays from history to save tokens
        let updatedHistory = await activeSession.getHistory(); 
        chatSessions[socketId] = dynamicModel.startChat({ history: scrubAIHistory(updatedHistory) });
        await manageHistorySize(socketId);
        
    } catch (e) {
        console.error("Nervous System Error:", e);
    } finally {
        clearTimeout(typingFailSafe); 
        npcIsTyping = false;
    }
}
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
      undigestedInfo: []     // The "Stomach" for raw events
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
      let coreFacts = (typeof data === 'object') ? data.coreFacts : [];
      let favor = (typeof data === 'object') ? data.favor : 0;
        let activeQuest = savedData ? savedData.activeQuest : null;
        let loadedStory = savedData ? savedData.storySoFar : ""; // <--- NEW
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
              
              let cleanParts = parts.map(p => {
                    // CRITICAL: Preserve tool calls and tool responses!
                    if (p.functionCall) return { functionCall: p.functionCall };
                    if (p.functionResponse) return { functionResponse: p.functionResponse };
                    
                    let safeText = "";
                    
                    if (typeof p.text === 'string') {
                        safeText = p.text;
                    } else if (typeof p.text === 'object') {
                        // If we accidentally saved an object, turn it into a string
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
            players[socket.id].activeQuest = activeQuest; 
          players[socket.id].storySoFar = loadedStory;
          players[socket.id].coreFacts = coreFacts; // <--- ADD THIS LINE!
          if (!players[socket.id].dmNarrativeLog) {
            players[socket.id].dmNarrativeLog = [];
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
            io.emit("chat_message", {
                sender: "[SYSTEM]",
                text:`${name} has entered the pocket plane.`
            });
        }
      }
  });
// --- EVENT: COMBAT / INTERACTION ---
socket.on("npc_died", async (data) => {
    let uniqueID = data.mapID + "_" + data.index;
    deadNPCs[uniqueID] = true;
    socket.broadcast.emit("npc_died", data);
    setTimeout(() => { delete deadNPCs[uniqueID]; }, 300000);
    
    const player = Object.values(players).find(p => p.mapID === data.mapID && p.id !== SUNCAT_ID);
    if (!player) return;

    const now = Date.now();
    if (player.lastKillReaction && (now - player.lastKillReaction < 5000)) return; 
    player.lastKillReaction = now;

    let baseID = Math.floor(parseFloat(data.type));
    let isPickup = false, isDialogue = false;
    
    if (data.reason && data.reason.startsWith('pickup_')) {
        let extractedID = parseInt(data.reason.split('_')[1]);
        if (!isNaN(extractedID)) baseID = extractedID;
        isPickup = true;
    } else if (data.reason === 'dialogue') {
        isDialogue = true; 
    }
    
    const entityName = getCardName(baseID);
    
    if (!isPickup && !isDialogue) {
        player.dmStress = Math.min(100, (player.dmStress || 0) + 5);
        
        // ---> THE NEW DYNAMIC WIN CONDITION CHECK <---
        // 1. Is the player in a custom map?
        // 2. Does the dead NPC match the boss ID? OR did the client explicitly send isBoss: true?
        if (player.mapID === 999 && (baseID === player.mapBossID || data.isBoss)) {
            
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
    }

    let mapClearedNote = "";
    if (!isPickup && !isDialogue && Math.random() > 0.8) {
        mapClearedNote = " The area seems quiet now. Is the objective complete, or is another wave coming?";
    }
    processSuncatThought(player.id, 'event', {
        action: `Interacted with ${entityName}${mapClearedNote}`, // Actually passed the note into the action string
        lore: getCardLore(baseID),
        isPickup: isPickup,
        isDialogue: isDialogue
    });
});
// --- EVENT: DIRECT CHAT ---
socket.on('chat_message', async (msgText) => {
    if (typeof msgText !== 'string') return;
    if (msgText.length > 200) msgText = msgText.substring(0, 200) + "...";

    const player = players[socket.id];
    if (!player || player.name === "Unknown") return;

    // Wake Up Logic
    if (player.name.startsWith("[AFK] ")) {
        player.name = player.name.replace("[AFK] ", "");
        io.emit("updatePlayers", players);
    }

    console.log(`${player.name} says: ${msgText}`);
    io.emit('chat_message', { sender: player.name, text: msgText });
    player.lastActive = Date.now();

    const content = msgText.toLowerCase();
    
    // Admin Override
    if (["suncat you there", "suncat wake up"].some(w => content.includes(w))) {
        npcIsTyping = false;
    }

    const mentioned = content.includes(NPC_NAME.toLowerCase()) || msgText.includes("[REPLY]");
    if (mentioned || Math.random() < 0.05) {
        processSuncatThought(socket.id, 'chat', { text: msgText });
    }
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
        // --- NEW: THE EXPLORATION TRACKER ---
        if (data.mapID === 999) {
            player.stepsTaken = (player.stepsTaken || 0) + 1;
            
            // Track unique tiles explored
            if (!player.exploredTiles) player.exploredTiles = new Set();
            player.exploredTiles.add(`${Math.floor(data.x)},${Math.floor(data.y)}`);

            // Every 75 steps, ping Suncat to DM the journey!
            if (player.stepsTaken % 75 === 0) {
                let exploredPct = Math.floor((player.exploredTiles.size / 2000) * 100); // Rough estimate of reachable tiles
                let actionDesc = `Is exploring the dungeon. (Steps taken: ${player.stepsTaken}. Unique tiles seen: ${player.exploredTiles.size}).`;
                
                // Ping the neural router as an exploration event
                processSuncatThought(socket.id, 'exploration', { action: actionDesc });
            }
        }
        // 1. Update the server's master state
        // ---> NEW: Catch manual teleports to 999! <---
        if (data.mapID === 999 && players[socket.id].mapID !== 999) {
            if (activeCustomMap) {
                // Instantly send them the cached custom map!
                socket.emit('load_custom_map', activeCustomMap);
            }
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
            coreFacts: me.coreFacts || [], 
            activeQuest: me.activeQuest || null,
            storySoFar: me.storySoFar || "",
            aiHistory: currentHistory 
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
      
      console.log(`[Force AI Action] Triggered by client for ${player.name}: ${instruction}`);
      
      // We pass it to Suncat's brain disguised as a chat message, 
      // but wrapped in a System Directive so he knows to obey it immediately.
      processSuncatThought(socket.id, 'chat', { 
          text: `[SYSTEM DIRECTIVE]: ${instruction}. EXECUTE IMMEDIATELY.` 
      });
  });
});
// --- SUNCAT'S SOCIAL BRAIN ---

setInterval(() => {
    const suncat = players[SUNCAT_ID];
    if (!suncat) return;

    const now = Date.now();
    // --- THE AUTONOMIC HEARTBEAT ---
    for (let id in players) {
        const p = players[id];
        if (p) {
            // 1. Cool down combat stress (Sympathetic nervous system winding down)
            if (p.dmStress > 0) p.dmStress = Math.max(0, p.dmStress - 5);
            
            // 2. Trigger the Neural Pipeline
            // If there is data in the hopper, try to digest it. 
            // The pipeline will naturally block it if stress is too high.
            if (p.undigestedInfo && p.undigestedInfo.length > 0) {
                processCognitiveLoad(id);
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
        
        // Optional: Add a text emote to match
        //io.emit('chat_message', { 
           // sender: "", 
            //text: `*${NPC_NAME} emits a ${randomSFX} sound*`, 
            //color: "#aaaaaa", 
            //isItalic: true 
        //});
    }
    // --- AI DIRECTOR HEARTBEAT ---
    const directorRoll = Math.random();

    if (!npcIsTyping) {
        // EVENT A: Proactive Speech
        if (directorRoll < 0.15) {
            const nearbyPlayer = Object.values(players).find(p => p.id !== SUNCAT_ID && p.mapID === suncat.mapID && Math.abs(p.x - suncat.x) < 4 && Math.abs(p.y - suncat.y) < 4);

            if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
                npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
                const proactivePrompt = `You are idling near ${nearbyPlayer.name} on Map ${suncat.mapID}. Speak to them unprompted. If favor is ok (>3), ask a personal question, share lore, or comment on this location. If favor is bad(<3), insult them or tell them to go away. DO NOT use brackets or tags in your response.`;
                
                setTimeout(async () => {
                    try {
                        // BUILD DYNAMIC BRAIN
                        let dynamicPersona = PERSONA_RULES_DB.core + "\n" + PERSONA_RULES_DB.commands + "\n" + PERSONA_RULES_DB.judgement_mode;
                        const activeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite", systemInstruction: dynamicPersona, tools: toolsDef });
                        chatSessions[nearbyPlayer.id] = activeModel.startChat({ history: await chatSessions[nearbyPlayer.id].getHistory() });

                        const result = await chatSessions[nearbyPlayer.id].sendMessage(proactivePrompt);
                        if (result.response.usageMetadata) updateBudget(result.response.usageMetadata);
                        
                        broadcastSuncatMessage(result.response.text());
                        await manageHistorySize(nearbyPlayer.id);
                    } catch (e) { 
                        console.error("Proactive Speech Failed", e); 
                    } finally {
                        clearTimeout(typingFailSafe);
                        npcIsTyping = false;
                    }
                }, 1000);
            }
        }
        // EVENT B: DM Pacing / Plot Advance
        else if (directorRoll >= 0.15 && directorRoll < 0.30) {
            const advPlayer = Object.values(players).find(p => p.id !== SUNCAT_ID && (p.mapID === 999 || p.activeQuest));

            if (advPlayer && chatSessions[advPlayer.id]) {
                npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
                
                const plotContext = advPlayer.activeQuest ? `Current Quest: ${advPlayer.activeQuest}` : "Wandering an uncharted map.";
                const activeMapLore = getMapLore(advPlayer.mapID); 
                
                // --- THE RNG PACING DIRECTOR ---
                const pacingRoll = Math.random();
                let dmPrompt = "";
                let requiresBigBrain = false;
                let injectedPersona = PERSONA_RULES_DB.core + "\n";

                if (pacingRoll < 0.33) {
                    // 1. Unsolicited Oracle Reading (Small Brain, No Tools)
                    injectedPersona += PERSONA_RULES_DB.oracle_mode;
                    dmPrompt = `[DM PACING]: ${advPlayer.name} is wandering Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\nProvide an unsolicited, cryptic 2-sentence Tarot reading about the danger ahead.`;
                } 
                else if (pacingRoll < 0.69) {
                    // 2. Creepy Atmospheric Narration (Small Brain, No Tools)
                    dmPrompt = `[DM PACING]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\nNarrate the creepy or beautiful atmosphere around them in exactly ONE atmospheric sentence. Make them feel watched.`;
                } 
                else {
                    if (advPlayer.mapID != 999&&pacingRoll > 0.93){
                    // 3. Spice up the gameplay! (Big Brain + Tools)
                    requiresBigBrain = true;
                    injectedPersona += PERSONA_RULES_DB.dm_mode + "\n" + PERSONA_RULES_DB.quest_mode;
                    dmPrompt = `[DM PACING OVERSEER]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\n${plotContext}\nAdvance the adventure NOW! You MUST use a tool (spawnNPC, changeEnvironment, or assignQuest) to ambush or surprise them. Narrate the sudden event dramatically.`;
                    }
                    else{
                         requiresBigBrain = true;
                        injectedPersona += PERSONA_RULES_DB.dm_mode + "\n" + PERSONA_RULES_DB.quest_mode;
                        dmPrompt = `[DM PACING OVERSEER]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\n${plotContext}\Spice up the adventure in a way RELEVANT to the CURRENT SCENARIO NOW! You MUST use spawnNPC to ambush or surprise them, or you may summon a helpful person with insightful/comedic relief dialogue. You may also gift a card directly or through spawnNPC if you choose. Narrate the sudden event dramatically like a dungeon master narrating a sudden encounter to the players. (e.g. "You find a card on the ground...", "You are waylaid by enemies and must defend yourself", "A denizen of this land approaches you. Are they friend or foe?")Make it relevant to the current adventure or scenario.`;
                    
                    }
                    
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
                        
                        if (finalResponse.text()) broadcastSuncatMessage(finalResponse.text());
                        
                        let updatedHistory = await chatSessions[advPlayer.id].getHistory(); 
                        chatSessions[advPlayer.id] = activeDmModel.startChat({ history: scrubAIHistory(updatedHistory) });
                        await manageHistorySize(advPlayer.id);
                    } catch (e) {
                        console.error("DM Proactive Error:", e);
                    } finally {
                        clearTimeout(typingFailSafe);
                        npcIsTyping = false;
                    }
                }, 1000);
            }
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
                coreFacts: player.coreFacts || [],
                activeQuest: player.activeQuest || null,
                storySoFar: player.storySoFar || "", 
                aiHistory: [] 
            };
            
            player.name = "[AFK] " + player.name;
            io.emit("updatePlayers", players);
            delete chatSessions[socketId];
        }
    }
}, 2 * 60 * 1000);
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
