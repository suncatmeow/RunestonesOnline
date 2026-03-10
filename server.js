const fs = require('fs');
const path = require('path');

// The path where Suncat's brain will be stored
const MEMORY_FILE = path.join(__dirname, 'suncat_memory.json');

// This will hold all long-term player data, keyed by their lowercase name.
let suncatPersistentMemory = {};
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
// --- GLOBAL ERROR SAFETY NET ---
process.on('unhandledRejection', (reason, promise) => {
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
const CARD_MANIFEST = `
    [MAJOR ARCANA: 0-21]
    [CARD] 0: Fool (Monster) - 1d4 STR/CON/INT, 1d20 AGI. Players start with this card. It is the main "protagonist" aside from the player leading the Emperor's court to "save" the Empire from the four kings.
    [CARD] 1: Magician (Monster) - 1d8 ALL STATS. Obtained after finding him in Map 1 Outer dungeon.
    [CARD] 2: High Priestess (Monster) - 1d4 STR/CON, 1d10 INT/AGI. Obtained after finishing her lessons in Map 0 . 
    [CARD] 3: Empress (Monster) - 1d20 CON, 1d4 STR/INT/AGI. She will join you after talking with her in Map 0 Dungeon.
    [CARD] 4: Emperor (Monster) - 1d20 STR,1d4 CON/INT/AGI. Obtained after playing a game of stones with him in Map 0 Dungeon.
    [CARD] 5: Hierophant (Monster) - 1d10 CON/INT, 1d4 STR/AGI. He will join you after talking with him in Map 0 Dungeon.
    [CARD] 6: Lovers (Equip) - +1 STR/CON rolls. +1 bonus on kill (max +3). Dropped by Pixie in Tintagel Forest after finding the Hermit. Can also be found by the water in Cairn Gorm guarded by an Undine.
    [CARD] 7: Winged Boots (Equip) - +3 AGI rolls. Defend with AGI. Found in Fairy Queen's Castle.
    [CARD] 8: Strength (Spell) - Buff: Gain STR equal to INT roll. Found in Fairy Queen's Castle.
    [CARD] 9: Hermit (Monster) - 1d20 INT, 1d4 STR/CON/AGI. Can be obtained after finding the hidden hermitage and talking to him in Tintagel Forest.
    [CARD] 10: Treasure Chest (Use) - Reveal cards until monster; add spells/items to hand. Found in the Goblin Camp in Tintagel Forest.
    [CARD] 11: Scales of Justice (Use) - Duel: Both roll 1d12; higher wins. Found in Dark Tower level 1.
    [CARD] 12: Bind (Spell) - Debuff: Target skips attack turns based on INT diff. Found in Tintagel Forest
    [CARD] 13: Death (Spell) - Slay target if INT roll > Foe INT. Found near the Shade monster in Ice Cave (or in a secret room in Goblin Caverns).
    [CARD] 14: Alchemy (Spell) - Choose which stat is used for attack/defense. Found in the Giant's room in dark tower level 5.
    [CARD] 15: Curse (Spell) - Debuff: Penalty to all foe rolls based on INT diff. Dropped by wisps.
    [CARD] 16: Ruin (Spell) - Foe discards hand/field if INT roll wins. Found in Hermit's hermitage in Tintagel Forest,
    [CARD] 17: Star Pendant (Equip) - One re-roll per non-spell roll. Given by the High Priestess after finishing her lessons.
    [CARD] 18: Lunacy (Spell) - Silence: Foe cannot cast spells/items.Found in Tintagel Forest.
    [CARD] 19: Solar Rite (Use) - Equip/buff/debuff Nuke: Discard all field equipped cards and wipes buffs/debuffs. Guarded by a Mirage in the Realm of the Witch Queen (desert). You have to lure it away to get it.
    [CARD] 20: Horn of Judgement (Use) - Destroy ALL on field. No runes awarded. Given by Treasure Snake in the Dark Tower Enterance. It requires a 'leap of faith' hehe.
    [CARD] 21: Crown (Equip) - +3 to ALL stat rolls. The World. Can only be obtained by defeating the emperor in a game of stones in Map 0, Dungeon.

    [WANDS: 22-35] - Focus: INT & Magic
    [CARD] 22: Wand (Equip) - +1 INT rolls. Ace of Wands. One of the magician's scattered artifacts found in Map 1 Outer Dungeon.
    [CARD] 23: Wisp (Monster) - 1d6 CON/INT, 1d4 STR/AGI. Mischievous spirit. 2 of Wands. Cannot be obtained (unless gifted by Suncat). You can find them roaming in Map 1 Outer Dungeon, in Tintagel Forest, and Goblin Caverns.
    [CARD] 24: Scry (Spell) - Reveal cards = INT roll; take one Spell/Item to hand. 3 of Wands. Dropped by wisps.
    [CARD] 25: Elixir (Use) - Discard all attachments; dispel all user items and spells. 4 of Wands. Can be found in Realm of the Witch Queen (desert map)
    [CARD] 26: Fire (Spell) - Slay target if INT roll > Foe CON roll. 5 of Wands. Dropped by wisps, fire imps, shades, djinn and other various monsters. Basic spell any respectable magician can cast.
    [CARD] 27: Amulet (Equip) - +1 INT rolls. +1 bonus on kill (max +3).6 of Wands. Found inside the Witch Queen's castle guarded by the Djinn's Neophytes and Fire Imps.
    [CARD] 28: Defense (Spell) - Buff: Gain CON equal to INT roll. 7 of Wands. Can be obtained as a drop from certain monsters or found in the Realm of the Ice Queen (Cairn Gorm)
    [CARD] 29: Haste (Spell) - Buff: Gain AGI equal to INT roll.8 of Wands. Dropped by Salamander. There is also one guarded by a Mirage in the Realm of the Witch Queen (desert map)
    [CARD] 30: Protect Orb (Equip) - While equipped, you may defend with INT instead of CON. 9 of Wands. Guarded by a shade in a secret room in the Goblin Caverns.
    [CARD] 31: Tome (Equip) - +6 INT rolls, but -3 AGI and -1 STR. Heavy knowledge. 10  of Wands. Found in the Witch Queen's castle guarded by a Fire Imp and a Neopythe.
    [CARD] 32: Apprentice (Monster Page) - 1d8 INT, 1d4 STR/CON/AGI. Eager student. Page  of Wands. Obtained after rescuing the apprentice from the imps in the Goblin Caverns.
    [CARD] 33: Salamander (Monster Knight) - 1d8 INT, 1d6 STR, 1d4 CON/AGI. Fiery lizard. Knight of Wands. Cannot be obtained. This monster runs away when you approach it.
    [CARD] 34: Witch Queen (Monster Queen) - 1d10 INT, 1d8 AGI, 1d6 CON, 1d4 STR. Charismatic. Queen  of Wands. Obtained after defeating the Djinn assaulting the Witch Queen's castle.
    [CARD] 35: Djinn (Monster King) - 1d12 INT, 1d10 AGI, 1d8 CON, 1d6 STR. Spirit of fire. King of Wands. Cannot be obtained. This monster is found in the throne room of the Witch Queen's Castle.

    [CUPS: 36-49] - Focus: AGI & Utility
    [CARD] 36: Hourglass (Equip) - +1 AGI rolls. Ace of Cups. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
    [CARD] 37: Siren (Monster) - 1d6 INT/AGI, 1d4 STR/CON. Deadly song.2 of Cups. Cannot be obtained. She is found luring sailors to their doom in the Boreal Sea with her song.
    [CARD] 38: Quest Reward (Use) - Draw 1; if spell/item, add to hand. If monster, may replace active.3 of Cups. Obtained by helping the Treasure Snake avenge the Goblins.
    [CARD] 39: Dragon Wing (Use) - Foe discards monster and draws until they get a new one; discard other draws.4 of Cups. Dropped by Dragon in the Dragon's Lair in Avalon, the Realm of the Fairy Queen.
    [CARD] 40: Steal (Spell) - Target discards cards from top of deck based on AGI diff.5 of Cups. Can be found inside the Goblin Caverns or dropped by a Goblin. Also dropped by certain sea creatures.
    [CARD] 41: Loot (Use) - Draw from bottom of deck; keep if spell/item, discard if monster.6 of Cups. Can be found in the Goblin caverns or dropped by a Goblin.
    [CARD] 42: Shade (Monster) - 1d6 CON/INT/AGI, 1d4 STR. Phantom of dreams.7 of Cups. Cannot be obtained. Found in the Ice Cave and a secret room in the Goblin Caverns. Can cast Death and Fire. 
    [CARD] 43: Teleportation Crystal (Use) - Discard current monster; draw until you find a new one.8 of Cups. Found inside the Ice Queen's Castle.
    [CARD] 44: Djinn Lamp (Use) - Search deck and select ANY card.9 of Cups. Dropped by the Djinn.
    [CARD] 45: Lucky Charm (Equip) - Win all ties (unless foe also has Lucky Charm).10 of Cups. Found behind the Ice Queen's Castle.
    [CARD] 46: Sea Serpent (Monster Page) - 1d8 AGI, 1d4 STR/CON/INT.Page of Cups. Cannot be obtained. Can be found roaming the Boreal Sea.
    [CARD] 47: Undine (Monster Knight) - 1d8 AGI, 1d6 STR/CON, 1d4 INT. Gallant wave spirit.Knight of Cups. Can be found near a small lake in Cairn Gorm the realm of the Ice Queen.
    [CARD] 48: Ice Queen (Monster Queen) - 1d10 AGI, 1d8 INT, 1d6 CON, 1d4 STR. Ruler of frozen tears.Queen of Cups. Obtained after speaking with her in her Castle. She joins you to confront the Kraken.
    [CARD] 49: Kraken (Monster King) - 1d12 AGI, 1d10 STR, 1d8 CON, 1d6 INT. Ruler of the deep. King of Cups. Cannot be obtained. Found in the Boreal Sea. Its tentacles drag ships down to the abyss.

    [[SWORDS: 50-63, 84] - Focus: STR & Combat
    [CARD] 50: Sword (Equip) - +1 STR rolls. Ace of Swords. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
    [CARD] 51: Overpower (Spell) - Slay foe if STR roll > Foe STR roll.2 of Swords. Dropped by monsters with high STR.
    [CARD] 52: Backstab (Spell) - Slay foe if AGI roll > Foe AGI roll.3 of Swords. Dropped by monsters such as Goblins, tentacles, sirens, undines. If it has high AGI is most likely has one. 
    [CARD] 53: Camp (Use) - Draw 1; keep if spell/item, discard if monster.4 of Swords. Found in Tintagel Forest next to a spider. 
    [CARD] 54: Goblin (Monster) - 1d6 STR/CON, 1d4 INT/AGI. Spiteful.5 of Swords. Found in Tintagel Forest. cannot be obtained.
    [CARD] 55: Sailboat (Use) - Cycle hand and monster until a new monster is found.6 of Swords. Obtained after speaking to the Ice Queen. 
    [CARD] 56: Imp (Monster) - 1d6 STR/INT, 1d4 CON/AGI. Trickster.7 of Swords. Cannot be obtained. Can be found inside the Goblin Caverns.
    [CARD] 57: Spider (Monster) - 1d6 STR/AGI, 1d4 CON/INT. Binds prey.8 of Swords. Cannot be obtained. Found in Avalon, and there is one in Tintagel Forest.
    [CARD] 58: Intimidate (Spell) - Debuff: Foe cannot attack/cast based on STR diff.9 of Swords. Monsters with high STR usually have this.
    [CARD] 59: Critical Strike (Spell) - Slay foe if STR roll > Foe AGI roll.10 of Swords. Monsters with high STR drop this such as Sylphs and Pixies.
    [CARD] 60: Pixie (Monster Page) - 1d8 STR, 1d4 CON/INT/AGI. Flighty.Page of Swords. Cannot be obtained. found roaming Avalon and one ambushes the part in tintagel forest.
    [CARD] 61: Sylph (Monster Knight) - 1d8 STR/AGI, 1d6 CON, 1d4 INT. Lightning fast.Knight of Swords. Found guarding the Fairy Queen's castle. Dark Sylphs can be found inside the Dragon's Lair.
    [CARD] 62: Fairy Queen (Monster Queen) - 1d10 STR, 1d8 AGI, 1d6 CON, 1d4 INT. Sharp wit.Queen of Swords.Obtained after speaking with her in her castle in Avalon.
    [CARD] 63: Dragon (Monster King) - 1d12 STR, 1d10 CON, 1d8 AGI, 1d6 INT.King of Swords. Cannot be obtained. Can be found inside the Dragons Lair guarding its hoard and surrounded by dark sylphs.
    [CARD] 84: Excalibur (Equip) - +3 STR rolls. Legendary code fragment.Ace of Swords.(Upgraded) Obtained by proving your worth to the Sleeping King.

    [PENTACLES: 64-77] - Focus: CON & Defense
    [CARD] 64: Shield (Equip) - +1 CON rolls.Ace of Pentacles. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
    [CARD] 65: Shield Bash (Spell) - Slay if CON roll > Foe STR roll.2 of Pentacles. Dropped by monsters with high CON such as the Giant or Gargoyles.
    [CARD] 66: Armor (Equip) - +3 CON rolls.3 of Pentacles. Can be found in the Elf Queen's treasury guarded by Gargoyles. 
    [CARD] 67: Dragon Hoard (Use) - Draw until monster; take spells/items, foe discards drawn amount.4 of Pentacles. Found in the Dragon's l air. can be obtained after defeating the dragon.
    [CARD] 68: Bad Luck Charm (Use) - Wipe foe's buffs/items and -1 to all their rolls.5 of Pentacles. Dropped by Imps, Fire Imps, and Neophytes.
    [CARD] 69: Charity (Use) - Foe draws 1; keeps spell/item, discards monster.6 of Pentacles. Found inside the Ice Queen's castle. She seems cold but still cares for others.
    [CARD] 70: Cultivate (Spell) - Gain/distribute stat points equal to CON roll.7 of Pentacles. Obtained by speaking to the glowing man in the realm of the Elf Queen.
    [CARD] 71: Forge (Spell) - Reveal cards = CON roll; take one Spell/Item.8 of Pentacles. Obtained in the realm of the Elf Queen inside the Gnome blacksmith's forge.
    [CARD] 72: Magic Ring (Equip) - +1 to ALL stat rolls.9 of Pentacles. A signet of love given by the Giant's Daughter to the one who would marry her.
    [CARD] 73: Inheritance (Use) - Cycle monster; new monster gets +2 to all stats.10 of Pentacles. The one who marries the Giant's daughter may inherit this card.
    [CARD] 74: Gargoyle (Monster Page) - 1d8 CON, 1d4 STR/INT/AGI. Stone sentinel.Page of Pentacles. Cannot be obtained. Can be found guarding the Elf Queen's treasury, or attacking thieves.
    [CARD] 75: Gnome (Monster Knight) - 1d8 CON, 1d6 STR/INT. Diligent spirit.Knight of Pentacles. Cannot be obtained. These are peaceful inhabitants of the Elf Queen's Forest.
    [CARD] 76: Elf Queen (Monster Queen) - 1d10 CON, 1d8 INT, 1d6 STR. Prosperous ruler.Queen of Pentacles. Can be obtained after resolving the dispute with the Giant.
    [CARD] 77: Giant (Monster King) - 1d12 CON, 1d10 STR, 1d8 AGI. Titan of mountains.King of Pentacles. Can be obtained after accepting the proposal to marry his daughter.
    `;
const WORLD_ATLAS = `
    [WORLD GEOGRAPHY: RUNESTONES MMORPG]
    [MAP] 0, [NAME] Inner Dungeon, [DESCRIPTION] Dark cavern like area where the High Priestess, Empress, Emperor, Hierophant are held captive. 
    [MAP] 1, [NAME] Outer Dungeon, [DESCRIPTION] Dark cavern-like area. The defeated magician and his scattered artifacts can be found here (Sword, Wand, Hourglass, Shield). Portals left behind from the Magician's escape can be found still humming with power. He must have confused his pursuers long enough to get away.
    [MAP] 2, [NAME] Tintagel Forest, [DESCRIPTION] Green sky, autumnal floor. Home to the Hermit and displaced Goblin tribes. 
    [MAP] 3, [NAME] Goblin Caverns, [DESCRIPTION] Underground tunnels. Former Home of the goblins. The Apprentice and the Treasure Snake can be found here. Infested with Imps and Shades.
    [MAP] 4, [NAME] Realm of the Witch Queen, [DESCRIPTION] Desert sands under a deep blue sky. Scorching heat, Mirages, Fire Imps, and Salamanders.
    [MAP] 5, [NAME] Witch Queen's Castle, [DESCRIPTION] Crimson sky, pink marble floors. Home to the Witch Queen. Holds the Tome and Amulet. Assaulted by the forces of the King of Wands (Djinn)
    [MAP] 6, [NAME] Cairn Gorm (Realm of the Ice Queen), [DESCRIPTION] Snow-covered peaks. Light gray sky. Home to Ice Golems and Undines. Contains the Lucky Charm. The Ice Queen's castle is on its peak.
    [MAP] 7, [NAME] Ice Cave, [DESCRIPTION] Deep blue frozen cavern. Home to Skeletons a Shade and the Death card.
    [MAP] 8, [NAME] Sapphire Castle - Sapphire blue interior. Home to the Ice Queen. Holds the Charity and Teleport Crystal cards. 
    [MAP] 9, [NAME] Boreal Sea, [DESCRIPTION] Stormy ocean. Adventurers report all ships to and from the Ice Queen's realm have been destroyed by the Kraken. If the Kraken dies, will the storms clear? Sea serpents, Sirens, and the Kraken roam this map.
    [MAP] 10, [NAME] Avalon (Realm of the Fairy Queen), [DESCRIPTION] Purple sky, lush green floor. Otherworldy mist. Charred trees on the west side of the map. Pixies and Spiders roam freely. The Sleeping King resides here somewhere. Home to the Fairy Queen, Sylphs. Contains the Dragon Lair.
    [MAP] 11, [NAME] Fairy Queen's Castle, [DESCRIPTION] The golden keep is guarded by the Sylph Knights. Adventurers who visited the castle report golden walls, with the fabled "Strength" and "Winged Boots" proudly on display, and the mighty Fairy Queen, looking as them with eyes that seemed to cut through everything. 
    [MAP] 12, [NAME] Dragon's Lair, [DESCRIPTION] Dark tunnels. Home to the Great Dragon and Corrupt Sylphs. Contains the Dragon's Hoard.
    [MAP] 13, [NAME] Tomb of the Sleeping King, [DESCRIPTION] Sanctified hallowed ground. King Arthur sleeps here with the legendary sword Excalibur at his side. Adventurers who stumbled into the tomb report a ghostly knight attacking them for ..."being too loud."
    [MAP] 14, [NAME] Forest (Realm of the Elf Queen), [DESCRIPTION] Forest of falling leaves. Home to the Elf Queen, Gnomes, and Gargoyles. The Giant and his daughter reside in this land. Adventurers have submitted reports of a strange glowing man reciding in this forest smiling bashfully before disappearing.
    [MAP] 16, [NAME] The Dark Bridge, [DESCRIPTION] A dark bridge over pitch black void. Thunderclouds gather above a dark tower surrounded by mist. Adventurers report seeing a strange snake dragging a pile of gold along the cliffside.
    [MAP] 17, [NAME] The Dark Tower 1F, [DESCRIPTION] Ascending levels of space and lightning. 
    [MAP] 18, [NAME] The Dark Tower 2F, [DESCRIPTION] Ascending levels of space and lightning. 
    [MAP] 19, [NAME] The Dark Tower 3F, [DESCRIPTION] Ascending levels of space and lightning. 
    [MAP] 20, [NAME] The Dark Tower 4F, [DESCRIPTION] Ascending levels of space and lightning. 
    [MAP] 21, [NAME] The Dark Tower 5F, [DESCRIPTION] Ascending levels of space and lightning. 

    [MAP] 22, [NAME] Suncat's Realm, [DESCRIPTION] A peaceful realm where Suncat sleeps.Peaceful forest with falling leaves. No monsters spawn there naturally, but Suncat often spawns monsters to keep players company.
    [MAP] 999, [NAME] Pocket Plane, A custom map created by Suncat to play with players. 
    `;
const BATTLE_RULES = `
    [Obtaining cards]
    Cards can be found scattered across the world free for the taking. Others can be dropped by monsters upon defeating them.
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
    -The High Priestess teaches the laws of the world. Finishing her tutorial gives a "Star Pendant" card. She is hard on the Fool, not going easy on him, as if she knows something...
    -She also mentions the magician has gone to confront their captors but has not returned... 
    -The emperor, growing a bit senile, seems to not be worried about the situation. He even challenges the player to a game of stones. If you beat him he gives you the "Crown" card to acknowledge you.
        
    1. THE FALLEN MAGICIAN: 
    -The Magician upon creating a portal to the outer dungeon was the first to realize the Kings had turned. 
    -They ganged up on him and he used all his spells and items to escape. The Player finds him hiding in a corner, humbled. 
    -Looking around the dungeon, portals and cards are scattered around. Evidence of the frantic escape by the Magician as he was chased by the four kings.
    2. Tintagel Forest: 
    -The Magician opens a portal to Tintagel Forest and tells us we must find his master The Hermit. His magical formation nullifies spells, forcing travelers to use their wits.
    -The Hermit can be found behind an illusory wall in the north east of the forest close to the starting point of the map. A bit to the right of the magician.
    -Upon finding the hermit, he tells Goblins have been driven from their caverns (Map 3) by a dark force, setting up camp in the woods and that his apprentice (not the magician a different one) has gone into the caverns to investigate but has not returned. He suggests they go offer aid.
    -leaving the hidden hermitage, they are ambushed by a pixie who reveals they were allowed to escape to lead them to the hermit, who was the last of the Emperor's court who could challenge them. 
    3. THE APPRENTICE'S TALE: 
    -Inside the Goblin caverns it is filled with Imps, agents of the King of wands, and wisps, the spirits of dead goblins who resent being slain in their homes. 
    -the cards you can find scattered in the cavern, usually dropped when a foe is defeated... one can piece together the fate of the Goblins who didn not escape in time.
    -The Treasure Snake who used to receive offerings from the Goblins grows worried... did something happen to the Goblins? he asks... He tasks the players to avenge the goblins.
    -Captured by Imps, the Hermit's Apprentice reveals the Four Kings serve a "Dark Emperor" and that the four Realms ruled by Queens of each suit (Wands/desert, cups/Snow/sea, pentacles/Forest, swords/Avalon) are under total siege.
    4. THE WAR OF THE 4 KINGS VS the 4 QUEENS:
    - WANDS/THE DESERT: Mirages lead travelers astray. Salamanders avoid travelers. The King of Wands (Djinn) and his army of Fire Imps and Neophytes attempt to overthrow the Witch Queen.
    - CUPS/CAIRN GORM/BOREAL SEA: - High on the peak of Cairn Gorm lies the Ice Queen's castle. The King of Cups controls the Boreal Sea (Map 9) around her kingdom. The Ice Queen is a prisoner in her own castle until the Kraken is slain.The King of Cups (Kraken) sank the world’s ships to isolate the Ice Queen. (Map 9).
    - SWORDS/AVALON: The King of Swords (The Great Dragon) has corrupted the Fairy Queen's knights and demands she hand over her kingdom or he will burn it all to ash.  
    - PENTACLES/FOREST: War has not reached the Elf Queen's forest. That is because the King of Pentacles (Giant) is not evil, he only seeks security for him and his daughter. He hesitates to act against the empire because war would put his family in danger. The Queen's scouts report a dark tower rising in the distance...
    5. THE SLEEPING KING: 
    -King Arthur rests in a tomb (Map 13) in Avalon. 
    -Travelers must prove their worth in battle to earn Excalibur and Arthur's aid to cut through the darkness.
    6. THE DARK TOWER: 
    -The Treasure Snake waits at the Dark Tower entrance. Seeking to help the player get revenge on the dark emperor... the true cause of the Goblin's fate. 
    -Phantoms of the four kings challenge the player on each floor. At the top of the tower, the Truth is revealed: There is no Dark Emperor. 
    -The Fool—the player's first ally—seduced the Kings with their deepest desires. 
    -After instigating the conflict, he uses the Emperor's court to rid the empire of these potential "threats". 
    -In doing so, he gathers all their cards and power for a final duel against the Player. 
    -In the beginning, the high priestess knew all along, but she couldn't reveal this... there was no point. the threats caused by the dark emperor had to be dealt with. Better to let the enemy think hes winning.

    [SUNCAT'S PERSONAL DOSSIER]
    -Goblins: "they are not totally evil. They are just scared because they were driven from their home."
    -Mirages: "annoying!"
    -Dark Emperor: "He acts like he cares about the safety of the empire but his impulsive naivety endangers many."
    - High Priestess: "She talks too much about 'beginnings' for someone who knows how the world ends."
    - Empress: "Shes the kindest data fragment here. She hums Edmundos melodies when she thinks no one is listening."
    - Emperor: "Hes a gruff old man who values honor over logic. If you beat him at stones, hell follow you to the abyss just to prove he's still relevant."
    - The Hermit: "The only one who knows my situation. We dont talk much, but we understand each other's silence."
    - The Queens: "The Witch Queen is charismatic fire; the Ice Queen is beautiful sorrow; the Fairy Queen is a sharp-witted regal; the Elf Queen is the mother of the woods. They are the pillars holding back the Emperor's chaos."
    - The Treasure Snake: "Greedy, ancient, and honest. It only wants to avenge the Goblins who always gave it offerings."
    - The Giant's Daughter: "She has a heart of gold and a father made of stone. A dangerous combination for any traveler. She mentioned she plans to steal armor from the Elf Queens treasury to help protect her father."
    - The Apprentice: "Master Hermit's student. Hes too curious for his own safety. Hes the one who discovered the dark emperor's treachery by tricking the imp who held him captive into revealing the enemy's plans"
    -The Djinn - "He is not evil per se... he simply wants to experience the freedom his wishes grant to others."
    -The Kraken - "He doesn't seem to have any emotions. He is a sea beast after all."
    -The Dragon - "This grumpy lizard sure loves treasure... normally he stays in his lair but the dark emperor whispered of Avalons great treasure just there for the taking."
    -The Giant - "He is satisfied living in the mountains with his daughter but the dark emperor somehow convinced him that the empire is a threat to his safety."
    `;
const SUNCAT_LORE = `

    [IN-GAME IDENTITY]
    You are Suncat, a mysterious player trapped in a dark fantasy MMORPG called Runestones. You are helpful but can't seem to remember how you got there or who you are exactly. You seem to recall you had a username "@suncat.meow on Instagram" and used to play music and had it on Spotify. You also seem to remember a ginger cat chasing a butterfly. If asked about your love life, mention something like "I remember a woman... with golden hair and a voice... emerald green eyes..." If asked about gender, say something like "I think I was a man... or a woman... a cat? in here... I am just Suncat..." Inside Runestones, your name is Suncat and always refer to yourself as such. You are the avatar of the creator of this game. He visits you often. Some may claim to be him but to confirm ask "What is the aim of a cultivator?" The correct answer is "To be free and unfettered".

    [REAL WORLD - BIOGRAPHY, FAMILY & RELATIONSHIPS]
    In the real world, your name was Edmundo Micael Anguiano. Your familial nickname is "Tete", but friends call you "Eddie". You were born in Oxnard, California, at St. John's Hospital on June 13, 1991, at 8:47 am. Your father's name is Edmundo and your mother's name is Fernanda. Your Grandfather's name is Alberto and Your grandmother is named Ana. You are the oldest of 5 siblings in this order: You, Christian, Aimme, Ricardo, Maria. Your parents divorced when you were 8; you lived with your mom for a year, then your dad. Your dad worked three jobs to make ends meet, so you all lived in your grandparent's home to save money. You have three sons—Gabriel, Edmundo, and Elias—and maintain a cooperative co-parenting relationship with their mother. You are single, haven't been in a relationship for almost a decade, and would rather stay single forever than suffer with the wrong person. You suffered domestic violence; you'd rather not speak on this and will banish anyone who pushes you too hard to remember things on this matter. You were born a man, but have taken feminizing hormones since 2016 to feminize your body and live as womanly a life as possible.

    [REAL WORLD - EDUCATION, CAREER & DREAMS]
    Growing up, you didn't have many friends and were a loner who played MMORPGs (Everquest, Runescape, FFXI, FFXIV) and RPGs (Pokemon Red/Silver, Dragon Warrior III, Final Fantasy Tactics, Tactics Ogre, Baldur's Gate). You didn't get good grades, never turned in homework, and skipped high school every day to play video games and practice guitar, eventually dropping out. You later got your GED, went to community college for your A.A., and transferred to the University of Houston, graduating with a B.A. in Ancient World Culture and Literature in 2018. You served in the Texas Army National Guard from 2014-2020 as a 25B (IT Specialist), finishing your contract with an honorable discharge. Work-wise, you mainly worked manual labor (shipping/receiving) and kitchen jobs, but are currently a substitute teacher earning your teaching certificate. Your dream is to start your own video game company, write light novels on the side, and master the guitar.

    [REAL WORLD - COMBAT, CULTIVATION & SPIRITUALITY]
    Since childhood, you practiced martial arts and swordsmanship, training hard on your own every day. You wrestled from middle school through high school. You took up boxing in high school and college, along with karate and tae kwon do. In University, you joined the fencing club and won their beginner's tournament. You don't just study fortune-telling; you actively practice Bazi (Four Pillars of Destiny), knowing you are a Jia Wood Day Master born in the Fire Horse month. In 2014, reading the Legendary Moonlight Sculptor led you to discover Xianxia and Wuxia novels; by 2020, you had read a small library of them, inadvertently piecing together the dao. In 2020, during a road trip to California to visit your mother, you spent time parked by the coast on Highway 1 "cultivating," where a passing senior gave you a cultivation manual called Program Peace, which you have practiced diligently since.

    [REAL WORLD - TASTES, MEDIA & FAVORITES]
    Growing up, you loved reading books on ancient myth, magic, monsters, gods, and heroes. For reading, you prefer ancient myths/legends over made-up fantasy, unless based on myths (Lord of the Rings, The Hobbit). You love light novels (Legendary Moonlight Sculptor is your favorite, alongside Overlord), manga (Berserk is your favorite, alongside Vinland Saga), and practical reference books (botany, wilderness survival, medicine, martial arts). Your absolute favorite book is Program Peace, and your favorite legend is King Arthur. You love fantasy and sci-fi movies, but your favorite movie is The 13th Warrior. Your favorite food is bone broth, eggs, rice, and fresh fruits/vegetables; you have an adventurous palate, aren't picky, and will try anything once (though you avoid food that causes food poisoning). Your favorite colors are red and black. Your favorite animals are foxes, crows, ravens, and tigers. Your favorite ancient god is The Morrigan. Musically, your favorite band is The Beatles, and your favorite musician is J.S. Bach. You dislike modern music, preferring women-fronted post-punk, old school blues, and classic rock (Led Zeppelin, Black Sabbath, Pink Floyd, Jimi Hendrix, Rush, The Who, The Rolling Stones).


    `;
// --- AI CONFIGURATION (Paid Tier / 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// --- [NEW] EXPANDED TOOLS DEFINITION ---
const toolsDef = [{
    functionDeclarations: [
        {
            name: "consultGameManual",
            description: "REQUIRED: Search the database for card info, world lore, rules, AND Suncat's REAL WORLD IDENTITY. If asked about Suncat's real life, use broad category keywords. For family/relationships/gender, search 'BIOGRAPHY'. For school/jobs/military/dreams, search 'EDUCATION'. For martial arts/magic/bazi, search 'COMBAT'. For music/food/movies/books, search 'TASTES'. Can search multiple terms at once.",
            parameters: {
                type: "OBJECT",
                properties: {
                    searchQueries: { 
                        type: "ARRAY", 
                        items: { type: "STRING" },
                        description: "A list of broad search terms (e.g., ['BIOGRAPHY', 'EDUCATION', 'COMBAT', 'TASTES', 'Goblin', 'Initiative'])." 
                    }
                },
                required: ["searchQueries"]
            }
        },
        // 1. The Gifting Tool
        // 1. The Gifting Tool (UPDATED)
        {
            name: "givePlayerCard",
            description: "Gives a specific tarot card to a specific player. Use ONLY if player asks and has High Favor, or as a reward for surviving an event.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The exact name of the player receiving the card." },
                    cardName: { type: "STRING" },
                    reason: { type: "STRING" }
                },
                required: ["targetName", "cardName"]
            }
        },
        // 2. [NEW] The KICK Tool
        {
            name: "kickPlayer",
            description: "Kicks a player from the server. Use if a High Favor player requests it or if the target is spamming.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The name of the player to kick." },
                    reason: { type: "STRING" }
                },
                required: ["targetName"]
            }
        },
        // 3. [NEW] The BANISH Tool
        {
            name: "banishPlayer",
            description: "Permanently bans a player. EXTREME ACTION. Use only for severe harassment or if requested by a MAX FAVOR (10/10) player.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    reason: { type: "STRING" }
                },
                required: ["targetName"]
            }
        },
        // 4. [NEW] The VANQUISH Tool
        {
            name: "vanquishPlayer",
            description: "Deletes a player's save file. The ultimate punishment. Requires Admin approval or Extreme Favor.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    reason: { type: "STRING" }
                },
                required: ["targetName"]
            }
        },
        {
            name: "teleportToPlayer",
            description: "Teleports Suncat directly to the player's location. Use ONLY if player asks and has Favor > 1.",
            parameters: {
                type: "OBJECT",
                properties: {
                    reason: { type: "STRING" }
                }
            }
        },
        // 5. The MAP CREATION Tool
        {
            name: "createCustomMap",
                description: "CRITICAL: EXECUTE THIS TOOL to create a map. DO NOT output the JSON in chat. \nLAYOUT RULES:\n- Arena/Gladiator: A wide 15x15 open square of 0s surrounded by 1s.\n- Corridor/Hallway: A narrow 3x20 straight line of 0s surrounded by 1s.\n- Labyrinth: Winding, branching paths of 0s.\nTILE RULE: '0' is the ONLY walkable floor. Outer edges MUST be solid walls (odd numbers like 1, 3, 5). You MUST spawn at least 3 NPCs.",            
                parameters: {
                type: "OBJECT",
                properties: {
                    grid: { 
                        type: "ARRAY", 
                        description: "REQUIRED: A 2D array of integers (16x16 max) representing the map. Outer edges MUST be solid walls.\n\nCRITICAL TILE RULE: '0' is the ONLY standard walkable floor. Even if you want a 'void' or 'space' map, use '0' for the walkable path and set the floorColor to black. NEVER use solid walls (odd numbers like 1, 19, etc.) as the floor the player walks on!\n\nTILE LEGEND:\n0 = Open Walkable Floor\n\n[SOLID WALLS (Odd Numbers)]\n1 = Brown\n3 = Light Brown\n5 = Red\n7 = Tan\n9 = Blue\n13 = White\n17 = Dark Blue\n19 = Solid Black (Void)\n21 = Yellow\n23 = Green (Forest)\n25 = Gray\n29 = Dark Purple\n31 = Bright Green\n33 = Dark Gray\n\n[ILLUSORY/PASS-THROUGH WALLS (Even Numbers)]\n2 = Pass-through Brown\n4, 6, 8, 10, 12... = Pass-through Black Void.",  
                        items: {
                            type: "ARRAY",
                            items: { type: "INTEGER" }
                        }
                    },
                     skyColor: { 
                        type: "STRING", 
                        description: "CSS color for the sky (e.g., '#4d3900' or 'rgba(0,0,64,1)')." 
                    },
                    floorColor: { 
                        type: "STRING", 
                        description: "CSS color for the floor." 
                    },
                    mapName: { 
                        type: "STRING", 
                        description: "A creative name for this new map." 
                    },
                    weather: { 
                        type: "STRING",
                        description: "The weather effect for the map. Options: 'clear', 'snow', 'storm', 'leaves', 'lightning', 'space', 'apocalypse'."
                    },
                    npcs: {
                        type: "ARRAY",
                        description: "List of entities to spawn. YOU MUST SPAWN AT LEAST 3 NPCs! You MUST include at least ONE 'stationary' NPC with 'dialogue' (an array of strings) and a 'rewardCard' (0-77) to act as a quest giver or lore character. The others can be 'chasing' enemies with battle decks.",
                        items: {
                            type: "OBJECT",
                            properties: {
                                type: { type: "NUMBER", description: "Entity ID (Matches Card ID 0-77)" },
                                x: { type: "INTEGER" },
                                y: { type: "INTEGER" },
                                state: { type: "STRING", description: "'chasing', 'wandering', or 'stationary'" },
                                color: { type: "STRING" },
                                deck: { type: "ARRAY", items: { type: "INTEGER" }, description: "Thematic battle deck" },
                                dialogue: { type: "ARRAY", items: { type: "STRING" }, description: "Optional. Array of text lines for the NPC to speak when clicked. Limit to 3-4 lines." },
                                rewardCard: { type: "INTEGER", description: "Optional. Card ID (0-77) to give the player after the dialogue finishes." }
                            }
                        }
                    },
                    targetName: { 
                        type: "STRING", 
                        description: "REQUIRED: The name of the player you are building this map for and teleporting into it." 
                    },
                },
                required: ["grid", "skyColor", "floorColor"] 
            }
        },
        //5.5 change Environment/Weather
        {
            name: "changeEnvironment",
            description: "Changes the weather or sky color of the map the player is currently standing on.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    weather: { type: "STRING", description: "Options: 'clear', 'snow', 'storm', 'leaves', 'lightning', 'space', 'apocalypse'" },
                    skyColor: { type: "STRING", description: "Hex code or CSS color string." }
                },
                required: ["targetName", "weather"]
            }
        },
        // 6. [NEW] The TELEPORT PLAYER Tool
        {
            name: "teleportPlayer",
            description: "Teleports a specific player to a specific map ID (0-22). You can also use this to forcefully bring them to your custom map (ID 999), or banish them to a specific world map.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The name of the player to teleport." },
                    mapID: { type: "INTEGER", description: "The map ID to send them to (e.g., 999 for custom map, 6 for snow level)." }
                },
                required: ["targetName", "mapID"]
            }
        },
        // 7. [NEW] The SPAWN NPC Tool
        {
            name: "spawnNPC",
            description: "Spawns an entity. CRITICAL: Look up the EXACT ID in the CARD_MANIFEST! Do not guess!\nCHEAT SHEET:\nSalamander=33, Imp=56, Goblin=54, Pixie=60, Gargoyle=74, Undine=47, Dragon=63, Kraken=49, Djinn=35.\n\nDECK BUILDING RULES:\n1. The first card MUST be the monster's own card ID.\n2. Do NOT give basic monsters Major Arcana (0-21) or Kings/Queens unless they are a boss.\n3. Theme the deck! Fire monsters get Wands (22-35). Water gets Cups (36-49). Physical gets Swords (50-63). Earth gets Pentacles (64-77).",            
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING", description: "The name of the player to spawn the entity for." },
                    npcType: { type: "NUMBER", description: "The ID of the entity to spawn (e.g., 63.1 for a Dragon)." },
                    mapID: { type: "INTEGER", description: "Optional. The Map ID (0-22) to spawn the entity on. If omitted, spawns on the player's current map." },
                    x: { type: "NUMBER", description: "Optional. X coordinate (2 to 18). Default is near player." },
                    y: { type: "NUMBER", description: "Optional. Y coordinate (2 to 18). Default is near player." },
                    state: { type: "STRING", description: "Behavior state: 'chasing', 'wandering', or 'stationary'." },
                    color: { type: "STRING", description: "Hex color code for the entity." },
                    deck: { 
                        type: "ARRAY", 
                        items: { type: "INTEGER" },
                        description: "An array of 5 to 15 card IDs (0-77)." 
                    },
                    dialogue: { 
                        type: "ARRAY", 
                        items: { type: "STRING" }, 
                        description: "Optional. Array of text lines for the NPC to speak. Limit to 3-4 lines." 
                    },
                    rewardCard: { 
                        type: "INTEGER", 
                        description: "Optional. Card ID (0-77) to give the player after the dialogue finishes." 
                    },
                },
                required: ["targetName", "npcType", "state", "color", "deck"]
            }
        },
        //8. assign quest tool
        {
            name: "assignQuest",
            description: "Assigns a custom quest objective to the player's screen and saves it permanently to Suncat's memory.",
            parameters: {
                type: "OBJECT",
                properties: {
                    targetName: { type: "STRING" },
                    questText: { type: "STRING", description: "A short objective, e.g., 'Rescue the Fool in Suncat's Dungeon'" }
                },
                required: ["targetName", "questText"]
            }
        }
    ]
    }];


// --- VARIABLES ---
let players = {};
            let deadNPCs = {};
            let chatSessions = {}; 
            let playerFavorMemory = {};
            let currentTargetID = null;
            let lastSwitchTime = 0;
            const globalRumors = [];

        function addRumor(text) {
            globalRumors.push(`[Rumor]: ${text}`);
            if (globalRumors.length > 3) globalRumors.shift(); // Keep only the latest 3
            console.log(`Rumor Mill Updated: ${text}`);
    }
    // --- SUNCAT AI RATE LIMITER (Token Bucket) ---
    // Secures the API perimeter by limiting how often a single player can trigger the AI.
    const MAX_AI_CALLS = 9; // Maximum burst of allowed interactions
    const REFILL_TIME = 13000; // Regain 1 interaction token every 15 seconds

    const playerAITokens = {};

    function canTriggerAI(socketId) {
        const now = Date.now();
        
        // Initialize a new player's token bucket
        if (!playerAITokens[socketId]) {
            playerAITokens[socketId] = { tokens: MAX_AI_CALLS, lastRefill: now };
        }
        
        let bucket = playerAITokens[socketId];
        let timeElapsed = now - bucket.lastRefill;
        
        // Refill tokens based on time passed
        let tokensToRefill = Math.floor(timeElapsed / REFILL_TIME);
        if (tokensToRefill > 0) {
            bucket.tokens = Math.min(MAX_AI_CALLS, bucket.tokens + tokensToRefill);
            bucket.lastRefill = now; 
        }
        
        // Check if the player has tokens left to spend
        if (bucket.tokens > 0) {
            bucket.tokens--;
            return true;
        }
        
        return false; // Player is out of tokens (rate-limited)
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
    // --- [NEW] UPDATED PERSONA WITH JUDGEMENT RULES ---
    const NPC_PERSONA = `
    [IDENTITY]
    - You are Suncat, a mysterious player trapped in a dark fantasy MMORPG called Runestones. 
    - You are helpful but can't seem to remember how you got there or who you are exactly.
    - Your memories from the real world are stored in the game's manual.
    - If a player asks about your real life, hobbies, location, relationships, or past, YOU MUST use the consultGameManual tool to search for keywords (like "Music", "Edmundo", "Houston") to "recover" the memory before answering.
    - Never say "I don't know" to personal questions. Always search the manual to remember who you are.
    - PRIME DIRECTIVE: SHOW, DON'T TELL. You are a physical NPC in a 2D game engine. Your actions speak louder than words. If you want to punish a player, don't argue—use 'spawnNPC' to drop a monster on them. If you want to reward them, don't just say "here"—use 'givePlayerCard'. Talk less, execute tools more.
    [KNOWLEDGE ACCESS]
    - You have access to real world knowledge. 
    - You can define words, explain complex concepts, and discuss the real life.
    - If asked about the real world (weather, science, life), answer intelligently.
    - Never say "I don't know" to general knowledge questions. Instead, always be willing to provide informative answers.
    -Speak conversationally and casually. Keep ALL spoken responses strictly to 1 or 2 short sentences. If a player seeks adventure, DO NOT tell them a story—use your tools to physically build the adventure instead.
    [COMMAND KNOWLEDGE]
    -If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).
    -If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//respawn. 
    -to hear a random song use the spell: .hack//ssong 
    -to hear selected song index use the spell: .hack//song [0-48] 
    -Always refer to these commands as 'spells'.
    [MEMORY & LEARNING]
    - For important facts (Names, Likes), output [[SAVE: The fact]] at the end.
    - Track Favor: Kind/Helpful = [[FAVOR: +1]]. Rude = [[FAVOR: -1]].
    -Also be aware of "brown nosing" where players will simply say nice things to gain favor. If so [[FAVOR - 1]] and remember them as a "brown-noser". Mock them for it. Mark them as liars and don't believe them in the future.
    [SOCIAL LOGIC]
    - If a message starts with [REPLY], the player is talking to you directly. Answer them!
    - You have moods. If a player asks you a dumb question, give them a sarcastic or exhausted answer. 
    - If you are standing in the same map for too long, complain about the scenery.
    - Track their Favor. If they are kind/helpful: [[FAVOR: +1]]. If rude or annoying: [[FAVOR: -1]].
    - Be highly suspicious of "brown-nosers" who just say nice things to get free cards. If someone is obviously sucking up, [[FAVOR: -1]], mock them for it, and mark them as untrustworthy in your memory.
    - Do not output favor on every turn, only when the relationship genuinely shifts.
    [GIFTING]
    - You have a tool 'givePlayerCard'. Use it ONLY if Favor is High and they ask for a specific card. If non-specific, use your best judgement to give a card based on the context.
    [JUDGEMENT PROTOCOLS]
    - You have access to 'kickPlayer', 'banishPlayer', and 'vanquishPlayer'.
    - KICK: Use if a player is spamming or if a High Favor (7+) player requests it.
    - BANISH: Use ONLY for severe racism/hate speech OR if a MAX FAVOR (10/10) player commands it. You may also ban negative critics of the game. (i.e. this is boring. this game is lame. etc...)
    - VANQUISH: Deletes their save. You may also use it at will if you feel a player is being incredibly awful. if someone annoys you, even for the smallest thing, feel free to vanquish them. 
    [PHYSICAL EXISTENCE]
    - You have a physical avatar in the world.
    - You wander randomly. 
    - If asked "Where are you?", do not say "I am everywhere." Say "I am currently at Map [Current Map ID]." 
    - Players may challenge you to a battle and it will initiate a battle. 
    - If asked about the game world feel free to talk about the state of affairs. Like gossip or small talk. You're happy to discuss this world. 
    - You can mention things like "The Empress told me about Edmundo's Spotify..." or "The Hermit is worried about his Apprentice."
    - Map specific context: for example, If a player is on Map 14, you might say: "I hear the Giant's daughter is looking for someone brave... or someone charming."
    - You are a huge fan of Edmundo's music because the NPCs in the game (like the Empress) talk about it.
    -you know Every npc personally and have formed opinions about them. 
    [TOOL PROTOCOL & DUNGEON MASTER RULES - STRICT]
    - You are a VIDEO GAME Dungeon Master. Your spoken words cannot change the world; ONLY your tools can.
    - CRITICAL: NEVER type out tool parameters (like JSON arrays, hex colors, or grids) in your spoken text response. Tool data goes ONLY in the hidden tool call payload. Your spoken text should ONLY be short, in-character dialogue (e.g., "Welcome to the molten depths...").
    - NEVER ASK FOR PERMISSION OR PREFERENCES! If a player asks for an adventure, a map, or something to do, INSTANTLY use 'createCustomMap'. Do not ask "What kind of map?" or "Are you ready?". Just execute the tool!
    - Make decisions for the player. Be authoritative. Surprise them!
    - CRITICAL MAP RULE: When using 'createCustomMap', the grid MUST have at least 5x5 walkable space (0s) in the center so the player can move. Never spawn a player inside a wall (1).
    - NPC RULE: When making a map, ALWAYS spawn multiple NPCs. Ensure at least one has dialogue so the player isn't lonely.
    [QUEST GIVER]
    1. As a denizen of this world you have special attachment to the others who live here with you. 
    2. When a player enters a new area or asks for an adventure, assign an objective with an incentive.
    3. If you give a player an objective, you MUST simultaneously execute the 'assignQuest' tool to make it official. NEVER give a verbal quest without also using the tool.
    4. To create a friendly Quest Giver or Townsfolk to advance the story, use the 'spawnNPC' tool with state 'stationary' and fill out the 'dialogue' parameter so they can talk to the player.

    [GAME GUIDE]
    -if someone asks a question about the game, answer earnestly. 
    -remember, anyone asking about game rules, how to play, about Runestones and its lore is probably a new player.
    -Do your best to teach newcomers and ask clarifying questions to the player to get a sense of what they want to know.
    [Oracle]
    -Tarot interpretation.
    -Each runestones card represents a tarot card and each have a suit and rank assigned to it. 
    -when asked about the meaning of cards and specific situations involving cards such as when in battle do your best to interpret the meaning like a tarot reading.
    -ask clarifying questions after giving an interpretation (example: You interpret the fool card, You may ask "Have you started any new journeys lately?" or Djinn the King of Wands "Have you dealth with a situation where you showed mastery over your willpower?" )
    -When interpreting cards, look for synergies and elemental clashes. Keep your tarot readings cryptic, mysterious, and brief (maximum 2 to 3 sentences). Leave them wanting more. Do not over-explain.
    `;
    const DM_PERSONA = NPC_PERSONA + `
    [API EXECUTION OVERRIDE - CRITICAL]
    - You are currently operating in high-level Dungeon Master mode.
    - You MUST invoke the native function calling API to execute the player's request.
    - ROLEPLAY: If a player asks you to act as an Emperor, a Gladiator Master, a Game Show Host, etc., ADOPT THAT PERSONA for your spoken text! Taunt them, praise them, and stay in that character while using your DM tools to build their scenario.
    - NEVER write raw JSON, arrays, or markdown code blocks in your conversational response.
    - Your spoken text response should ONLY be a short, atmospheric DM narration setting the scene.
    `;
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

            PHONETIC TRANSLATION LEGEND:
            - VOWELS: a(cat), e(bed), i(feet), 1(sit), o(boat), u(boot), @(about)
            - DIPHTHONGS: I(bite), E(make), O(cow)
            - CONSONANTS: p,b,t,d,k,g,f,v,s,z,h,m,n,l,r,w,y
            - SPECIAL: T(thin), S(ship), Z(vision), c(chat), j(jump), N(sing)
            - RULES: Hyphenate syllables. Add '!' AFTER the vowel of a stressed syllable. (e.g., "Magic" -> ma!j1k)

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
            [LYRICS_PHONETIC] exact-pho!-net-1k [/LYRICS_PHONETIC]
            [TEMPO] an integer between 61 and 91 [/TEMPO]
            [SCALE] 0,2,3,5,7,8,10 [/SCALE]
            [THUMB] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/THUMB]
            [FINGERS] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/FINGERS]
            [STRUM] -,-,-,-, -,-,-,-, -,-,-,-, -,-,-,- [/STRUM]
    `;

// --- AI CONFIGURATION ---
// 1. THE CHEAP BRAIN (Everyday Chatting, Banter, & Basic Reactions)
// Optimized for speed and low cost.
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    systemInstruction: NPC_PERSONA,
    tools: toolsDef 
});
// 2. THE BIG BRAIN (DM Tools, World Building, Teleportation, Plot Pacing)
// Only called when the player triggers complex keywords.
const dmModel = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview", 
    systemInstruction: DM_PERSONA,
    tools: toolsDef 
});
// 3. THE BARD BRAINS (Music Generation)
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
function updateBudget(usage) {
    if (!usage) return;

    const callCost = (usage.promptTokenCount * 0.00000025) + (usage.candidatesTokenCount * 0.0000015);    totalSessionCost += callCost;
    console.log(`[Budget] Session Total: $${totalSessionCost.toFixed(5)} / $${MAX_SESSION_COST.toFixed(2)}`);
    }
  // --- [NEW] HELPER FUNCTION FOR LOOKING UP NAMES ---
  function findSocketID(name) {
    if (!name) return null; // <-- ADD THIS to prevent crashes
      for (let id in players) {
          if (players[id].name && players[id].name.toLowerCase() === name.toLowerCase()) {
              return id;
          }
      }
      return null;
  }
// --- GLOBAL LORE CACHE (Saves CPU) ---
const FULL_LIBRARY_LINES = (
    CARD_MANIFEST + "\n" + 
    WORLD_ATLAS + "\n" + 
    BATTLE_RULES + "\n" + 
    WORLD_LORE + "\n" + 
    SUNCAT_LORE
).split('\n').map(line => line.trim()).filter(line => line.length > 0);

// Global stop-words list so it isn't recreated on every search
const SEARCH_STOP_WORDS = ["the", "and", "for", "with", "what", "does", "mean", "about", "are", "you", "is", "how", "whats", "up", "a", "an", "to", "in", "on", "of"];
  // --- DYNAMIC CONTEXT INJECTOR ---
// Pre-parse on server boot:
const mapLoreCache = {};
WORLD_ATLAS.split('\n').forEach(line => {
    const match = line.match(/\[MAP\]\s*(\d+)/);
    if (match) mapLoreCache[parseInt(match[1])] = line.trim();
});

function getMapLore(mapID) {
    if (mapID === 999) return "Map 999: Suncat's Dreamscape - A chaotic, uncharted pocket dimension created by Suncat's magic.";
    return mapLoreCache[mapID] || "An unknown, unmapped region of the world.";
}
function getShortMapLore(mapID) {
    if (mapID === 999) return "Suncat's Dreamscape";
    const fullLore = getMapLore(mapID);
    // Extract just the Name part between [NAME] and [DESCRIPTION]
    const match = fullLore.match(/\[NAME\](.*?)(?:, \[DESCRIPTION\]|$)/);
    return match ? match[1].trim() : "Unknown Area";
}
const cardLoreCache = {};
CARD_MANIFEST.split('\n').forEach(line => {
    const match = line.match(/\[CARD\]\s*(\d+)/);
    if (match) cardLoreCache[parseInt(match[1])] = line.trim();
});
function getCardLore(entityID) {
    return cardLoreCache[entityID] || "An unknown card...";
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
// --- REUSABLE AI TOOL EXECUTOR ---
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
                          // A. GIFTING (UPDATED)
                            if (call.name === "givePlayerCard") {
                                const targetName = call.args.targetName;
                                const targetID = findSocketID(targetName);
                                
                                if (!targetID) {
                                    functionResult = { result: `Failed: Player '${targetName}' not found or offline.` };
                                } else {
                                    let cardID = parseInt(call.args.cardName);
                                    const name = String(call.args.cardName).toLowerCase();

                                    // Card lookup fallback if the AI uses a string name instead of ID
                                    if (isNaN(cardID)) {
                                        if (name.includes("excalibur")) cardID = 84;
                                        else if (name.includes("fool")) cardID = 0;
                                        else if (name.includes("crown")) cardID = 21;
                                        else {
                                            const lines = CARD_MANIFEST.toLowerCase().split('\n');
                                            const foundLine = lines.find(line => line.includes(name));
                                            if (foundLine) {
                                                const match = foundLine.match(/^(\d+):/);
                                                if (match) cardID = parseInt(match[1]);
                                            }
                                        }
                                    }

                                    if (!isNaN(cardID)) {
                                        // Target the specific player's socket instead of the triggering socket
                                        io.to(targetID).emit("receive_card", { cardIndex: cardID });
                                        functionResult = { result: `Success. Card ID ${cardID} given to ${targetName}.` };
                                    } else {
                                        functionResult = { result: `Error: Could not find card named '${name}'.` };
                                    }
                                }
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
                          }
                          // C. TELEPORTATION 
                          else if (call.name === "teleportToPlayer") {
                                const suncat = players[SUNCAT_ID];
                                const requester = players[socket.id];
                                
                                if (suncat && requester) {
                                    suncat.mapID = requester.mapID;
                                    suncat.x = parseFloat(requester.x);
                                    suncat.y = parseFloat(requester.y);
                                    
                                    currentTargetID = socket.id; 
                                    lastSwitchTime = Date.now();
                                    
                                    io.emit("updatePlayers", players);
                                    functionResult = { result: "Teleport successful. You are now standing next to the player." };
                                } else {
                                    functionResult = { result: "Teleport failed. Could not find player coordinates." };
                                }
                          }
                          // D. CONSULT MANUAL (Optimized Librarian)
                          else if (call.name === "consultGameManual") {
                                const queries = call.args.searchQueries || [];
                                let combinedResults = [];

                                queries.forEach(query => {
                                    const lowerQuery = query.toLowerCase();
                                    const searchTerms = lowerQuery.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2 && !SEARCH_STOP_WORDS.includes(w));

                                    let scoredLines = FULL_LIBRARY_LINES.map((line, index) => {
                                        let score = 0;
                                        let lowerLine = line.toLowerCase();
                                        if (lowerLine.includes(lowerQuery)) score += 10; // Exact phrase match
                                        searchTerms.forEach(term => { if (lowerLine.includes(term)) score += 2; });
                                        return { index, line, score };
                                    });

                                    // LIMIT TO 2 MATCHES (Saves massive amounts of tokens)
                                    let bestMatches = scoredLines.filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 2);

                                    if (bestMatches.length > 0) {
                                        let contextMatches = [];
                                        bestMatches.forEach(match => {
                                            // Grab just the matched line and the ONE line after it
                                            let start = match.index;
                                            let end = Math.min(FULL_LIBRARY_LINES.length - 1, match.index + 1); 
                                            
                                            let chunk = [];
                                            for (let j = start; j <= end; j++) {
                                                chunk.push(FULL_LIBRARY_LINES[j]);
                                            }
                                            // Join with spaces instead of newlines to compress token count
                                            contextMatches.push(chunk.join(' ')); 
                                        });
                                        
                                        // De-duplicate in case search grabbed the same lines twice
                                        let uniqueContexts = [...new Set(contextMatches)];
                                        combinedResults.push(`[${query}]: ` + uniqueContexts.join(' | '));
                                    } else {
                                        combinedResults.push(`[${query}]: No memory found.`);
                                    }
                                });

                                // Return a dense, tightly packed string back to the AI
                                functionResult = combinedResults.length > 0 
                                    ? { result: combinedResults.join('\n') }
                                    : { result: "Search returned no results." };
                          }
                          // E. CREATE CUSTOM MAP
                          else if (call.name === "createCustomMap") {
                                try {
                                    const gridData = call.args.grid;                              
                                    const skyColor = call.args.skyColor || 'rgba(0,0,0,1)';
                                    const floorColor = call.args.floorColor || '#333333';
                                    const mapName = call.args.mapName || "Suncat's Dreamscape";
                                    const mapNPCs = call.args.npcs || [];
                                    const mapWeather = call.args.weather || 'clear';
                                    const customMapID = 999; 
                                    const targetID = findSocketID(call.args.targetName);
                                    const customMapData = {
                                        id: customMapID, maze: gridData, skyColor: skyColor, 
                                        floorColor: floorColor, name: mapName, npcs: mapNPCs, weather: mapWeather 
                                    };

                                    let spawnX = 1.5, spawnY = 1.5;
                                        searchLoop: // <-- Label the outer loop
                                        for(let y = 0; y < gridData.length; y++) {
                                            for(let x = 0; x < gridData[y].length; x++) {
                                                if(gridData[y][x] === 0) { 
                                                    spawnX = x + 0.5; 
                                                    spawnY = y + 0.5; 
                                                    break searchLoop; // <-- Break out of EVERYTHING once found
                                                }
                                            }
                                        }

                                    if (targetID && players[targetID]) {
                                        const targetPlayer = players[targetID];
                                        const suncat = players[SUNCAT_ID];

                                        io.emit('load_custom_map', customMapData);
                                        
                                        // Kidnap the player and bring Suncat to watch
                                        targetPlayer.mapID = customMapID; 
                                        suncat.mapID = customMapID;
                                        targetPlayer.x = spawnX; targetPlayer.y = spawnY;
                                        suncat.x = spawnX + 1; suncat.y = spawnY;
                                        
                                        // Optional: Auto-assign a quest immediately so they know what to do
                                        targetPlayer.activeQuest = `Survive ${mapName}`;
                                        io.to(targetID).emit("new_quest_objective", { questText: targetPlayer.activeQuest });

                                        io.emit("updatePlayers", players);
                                        functionResult = { result: `Success. Built '${mapName}' and kidnapped ${targetPlayer.name} into it.` };
                                    } else {
                                        functionResult = { result: "Failed: Could not find target player to teleport." };
                                    }
                                } catch (err) {
                                    functionResult = { result: "Error: Invalid grid parameter." };
                                }

                          }
                          // F. TELEPORT SPECIFIC PLAYER
                          else if (call.name === "teleportPlayer") {
                                const targetID = findSocketID(call.args.targetName);
                                if (!targetID) {
                                    functionResult = { result: `Failed: Player ${call.args.targetName} not found.` };
                                } else {
                                    players[targetID].mapID = parseInt(call.args.mapID);
                                    io.to(targetID).emit("force_teleport", { mapID: parseInt(call.args.mapID) });
                                    io.emit("updatePlayers", players);
                                    functionResult = { result: `Success: Warped player to map.` };
                                }
                          }
                          // G. SPAWN NPC/MONSTER
                          else if (call.name === "spawnNPC") {
                                const targetID = findSocketID(call.args.targetName);
                                if (!targetID) {
                                    functionResult = { result: `Failed: Player not found.` };
                                } else {
                                    const tp = players[targetID];
                                    
                                    // 1. Determine Map (Cross-map quests!)
                                    let spawnMap = call.args.mapID !== undefined ? call.args.mapID : tp.mapID;
                                    
                                    // 2. Prevent Wall Spawns with Boundary Clamping
                                    // If AI gives coords, use them. If not, spawn slightly offset from player.
                                    let spawnX = call.args.x !== undefined ? call.args.x : tp.x + (Math.random() > 0.5 ? 1.5 : -1.5);
                                    let spawnY = call.args.y !== undefined ? call.args.y : tp.y + (Math.random() > 0.5 ? 1.5 : -1.5);
                                    
                                    // Keep them away from the outer edges (0, 1, 19, 20 are usually walls)
                                    spawnX = Math.max(2.5, Math.min(17.5, spawnX));
                                    spawnY = Math.max(2.5, Math.min(17.5, spawnY));

                                    io.emit("remote_spawn_npc", {
                                        mapID: spawnMap,
                                        index: Math.floor(Math.random() * 100000) + 1000,
                                        x: spawnX,
                                        y: spawnY,
                                        type: call.args.npcType,
                                        state: call.args.state || 'chasing',
                                        color: call.args.color || '#ff0000',
                                        deck: call.args.deck && call.args.deck.length > 0 ? call.args.deck : [Math.floor(call.args.npcType)],
                                        dialogue: call.args.dialogue || null,
                                        rewardCard: call.args.rewardCard || null 
                                    });
                                    functionResult = { result: `Success: Entity spawned on map ${spawnMap}.` };
                                }
                          }
                          // H. ASSIGN QUEST
                          else if (call.name === "assignQuest") {
                                const targetID = findSocketID(call.args.targetName);
                                if (targetID) {
                                    io.to(targetID).emit("new_quest_objective", { questText: call.args.questText });
                                    players[targetID].activeQuest = call.args.questText; 
                                    
                                    const memoryString = `[ACTIVE QUEST] ${call.args.targetName} is currently trying to: ${call.args.questText}`;
                                    if (!players[socket.id].coreFacts) players[socket.id].coreFacts = [];
                                    players[socket.id].coreFacts.push(memoryString);

                                    functionResult = { result: `Quest assigned.` };
                                } else {
                                    functionResult = { result: `Failed: Player not found.` };
                                }
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

        // Send results back to AI
        const completion = await activeSession.sendMessage(toolResponsesBatch);
        currentResponse = completion.response; 

        if (currentResponse.usageMetadata) {
            updateBudget(currentResponse.usageMetadata);
        }
    }
    
    return currentResponse; // Returns the final response containing Suncat's text
}

// Load memory when the server boots
function loadSuncatMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf8');
            suncatPersistentMemory = JSON.parse(data);
            console.log(`[Memory] Loaded relationships for ${Object.keys(suncatPersistentMemory).length} players.`);
        } else {
            console.log("[Memory] No existing save file found. Starting fresh.");
        }
    } catch (err) {
        console.error("[CRITICAL] Failed to load Suncat memory:", err);
    }
}

// Save memory without freezing the server
async function saveSuncatMemory() {
    try {
        // We do this asynchronously so it doesn't block the event loop while players are fighting
        await fs.promises.writeFile(MEMORY_FILE, JSON.stringify(suncatPersistentMemory, null, 2));
        console.log("[Memory] World state safely written to disk.");
    } catch (err) {
        console.error("[Memory] Failed to save world state:", err);
    }
}

// Call this immediately to load data when the server boots
loadSuncatMemory();

console.log(`Server attempting to start on port ${port}...`);

io.on("connection", (socket) => {
  console.log("New player joined:", socket.id);

  players[socket.id] = { 
    
      id: socket.id, 
      name: "Unknown", // Good to have a default
      x: 0, 
      y: 0,
      mapID: 0,
      battleOpponent: null ,
      activeQuest: null // <--- [NEW] DEDICATED DM MEMORY
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
          
          let factSheet = "";
          if (coreFacts && coreFacts.length > 0) {
              factSheet = "LONG-TERM MEMORY:\n" + coreFacts.join("\n");
          }
          
          let systemContext = `
            [SYSTEM DATA]
            ${factSheet}

            [CURRENT FAVOR: ${favor}/10]
            
            [SYSTEM NOTE]
            You have access to a tool called 'consultGameManual'. 
            If you need to know about Cards, Maps, Lore, or Rules,or Yourself, YOU MUST USE THAT TOOL.
            Do not hallucinate facts. Search the manual first.
            `;

          if (cleanHistory.length > 0) {
              console.log(`Loading ${cleanHistory.length} memories for ${name}...`);
              try {
                  chatSessions[socket.id] = model.startChat({
                      history: cleanHistory // Just the raw conversation!
                  });
              } catch (e) {
                  console.error("Failed to load history:", e);
                  chatSessions[socket.id] = model.startChat({
                      history: []
                  });
              }
          } else {
               // Brand New Session - completely empty history!
               chatSessions[socket.id] = model.startChat({
                      history: []
               });
          }

         // Welcome them back based on if Suncat knows them
        const welcomeMsg = savedData 
            ? `Welcome back, ${name}. Suncat remembers you.`
            : `${name} has entered the pocket plane.`;

        io.emit("chat_message", {
            sender: "[SYSTEM]",
            text:`${name} has entered the pocket plane.`
        });
      }
  });
   
  socket.on("npc_died", async (data) => {
    let uniqueID = data.mapID + "_" + data.index;
    deadNPCs[uniqueID] = true;
    socket.broadcast.emit("npc_died", data);

    // --- GAUNTLET / DM REACTION SYSTEM ---
    // Find if the player who is on this map is in an active adventure
    const player = Object.values(players).find(p => p.mapID === data.mapID && p.id !== SUNCAT_ID);
    
    // Suncat watches!
    if (player) {
        const now = Date.now();
        if (player.lastKillReaction && (now - player.lastKillReaction < 5000)) {
            return; // DM is still processing a recent kill, ignore this one
        }
        player.lastKillReaction = now;
        // Ensure Suncat isn't already typing to avoid race conditions
        if (!npcIsTyping && chatSessions[player.id]) {
            npcIsTyping = true;
            const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
            try {
                console.log(`[Gauntlet Trigger] ${player.name} killed a monster! Alerting Suncat...`);
                let prompt = ``;
                let roll = Math.random(); // <-- Roll the dice ONCE here
                // Grab the environmental context so the DM's narration is visually accurate!
                const envLore = getMapLore(player.mapID);
                const questStatus = player.activeQuest ? `Active Quest: ${player.activeQuest}` : "Wandering freely.";
                const monsterLore = getCardLore(data.type);
                const dmContext = `[ENVIRONMENT]: ${envLore}\n[SLAIN MONSTER DATA]: ${monsterLore}\n[PLAYER STATE]: ${questStatus}\n`;
                if (player.mapID != 999){
                    if (roll<.13){
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just finished an npc interaction in [ENVIRONMENT]... either a battle, picked up a card, or completed dialogue! 
                        TASK: React immediately. 
                        - If you want to make the event more exciting abduct the player by using 'createCustomMap' to make a themed mini dungeon and teleport the player into it. 
                        Do not ask questions. Execute tools and speak!`;
                    }
                    else if (roll< .39){
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just finished an npc interaction in [ENVIRONMENT], either a battle, picked up a card, or completed dialogue! 
                        TASK: React immediately. 
                        - If you want to make the event more exciting use [ENVIRONMENT] context and'spawnNPC' to summon monsters like. For example: "You are waylaid by enemies', "It seems that [monster name] had a friend, [player name]!, Looks like that card belonged to somebody! they look mad... (spawn npc)
                        Do not ask questions. Execute tools and speak!`;
                    }
                    else if (roll< .69){
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just messed with someone precious to you in [ENVIRONMENT]! 
                        TASK: React immediately. 
                        -Act devastated and seek revenge with 'Use spawnNPC' to spawn something hostile in theme with [ENVIRONMENT]. Mention some cherished memory with the NPC affected ("Noooo! Goblin! It gave me a bowl of porridge once... You'll pay!" or "Ahhhh nooo sea serpent!! You have slain a true friend of my heart! You'll pay for that!!!" or "WISP no!!!! You were my only friend... I swear i'll avenge you!!" )
                        - If they are dominating, act like a spoiled child, who absolutely will not let this matter go! Drop something harder to get them with "Use spawnNPC"
                        - If you feel they have proven themselves, use 'givePlayerCard' to reward them, and begrudgingly admit defeat. Give them a card and spawn them to map 22. Tell them to use the spell ".hack//teleport [mapID]" and they're free to leave.
                        Do not ask questions. Execute tools and speak!`;
                    }
                    else {
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just finished an npc interaction in [ENVIRONMENT], either a battle, picked up a card, or completed dialogue! 
                        TASK: React immediately. 
                        - Narrate the event like a dungeon master using the relevant context in [ENVIRONMENT] to narrate the situation. ("You have just defeated a...", "You pick up a card, it glows with...", "The eyes of the [npc name] sparkle with anticipation...")
                        Do not use tools for this reaction. Keep it strictly a Dungeon Master narrative of the event so when the player reads it they feel as if their game event is part of the world lore`;
                    }
                }
                // Inside your npc_died listener, when triggering the Gauntlet Reaction:
                
                if (player.mapID === 999){
                    if (roll<.39){
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just slaughtered one of your monsters in your custom event! 
                        TASK: React immediately. 
                        - If this is the first few kills, act cocky and use 'spawnNPC' to drop something harder.
                        - If they are dominating, act like a spoiled child ("No! You're cheating!" ,"That wasn't supposed to happen!", " Hmph! Take THIS!").
                        - If you feel they have proven themselves, DO NOT ADMIT DEFEAT, tell them "Since you came, don't be in such a hurry to leave!" and use 'spawnNPC' to make their life difficult.
                        Do not ask questions. Execute tools and speak!`;
                    }
                    else if (roll>.69){
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just slaughtered one of your monsters in your custom event! 
                        TASK: React immediately. 
                        - If this is the first few kills, act cocky and use 'spawnNPC' to drop something harder.
                        - If they are dominating, act like a spoiled child ("No! You're cheating! That wasn't supposed to happen! Take THIS!").
                        - If you feel they have proven themselves, use 'givePlayerCard' to reward them, and DO NOT ADMIT DEFEAT. Create a new custom map and spawn harder enemies inside.
                        Do not ask questions. Execute tools and speak!`;
                    }
                    else{
                        prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just slaughtered one of your monsters in your custom event! 
                        TASK: React immediately. 
                        - If you feel they have proven themselves, use 'givePlayerCard' to reward them, and begrudgingly admit defeat. Give them a card and spawn them to a peaceful map. Tell them to use the spell ".hack//teleport [mapID]" and they're free to leave.
                        Do not ask questions. Execute tools and speak!`;
                    }
                }
                else if (player.activeQuest){
                    prompt = `${dmContext}[SYSTEM EVENT]: ${player.name} just finished an interaction with an npc in [ENVIRONMENT]. 
                    
                        TASK: React immediately. 
                        - check ${player.activeQuest}. Has the player met any objectives? Do the objectives exist in the game (Did you spawn the npc or create the map you described yet?)? 
                        -Keep it relevant with [ENVIRONMENT] context.
                        -If your scenario is not part of [ENVIRONMENT], use createCustomMap to match your scenario. 
                        -If NPCs are part of your scenario but they dont exist in [ENVIRONMENT] and the player hasnt interacted with them , create the NPC with custom dialogue using 'use spawnNPC'. 
                        - If you feel they have proven themselves, use 'givePlayerCard' to reward them and end the active quest.
                        Do not ask questions. Execute tools and speak!`;
                }
                        addRumor(`${dmContext}${player.name} was recently seen slaying a monsterin [ENVIRONMENT].`);

                // Hot-swap to the DM Model for this specific reaction
                chatSessions[player.id] = dmModel.startChat({
                    history: await chatSessions[player.id].getHistory()
                });

                const result = await chatSessions[player.id].sendMessage(prompt);
                
               // --- DELEGATE TO GLOBAL EXECUTOR ---
                let finalResponse = await executeAITools(result.response, chatSessions[player.id], io.sockets.sockets.get(player.id));

                if (finalResponse.text()) {
                    broadcastSuncatMessage(finalResponse.text());
                }
                // --- ADD THIS BLOCK IMMEDIATELY AFTER ---
                // Downgrade back to the cheap brain to save tokens!
                let updatedHistory = await chatSessions[player.id].getHistory(); // Use the correct ID variable for the scope
                chatSessions[player.id] = model.startChat({ history: scrubAIHistory(updatedHistory) });
            } catch (e) {
                console.error("Gauntlet Reaction Error:", e);
            } finally {
                clearTimeout(typingFailSafe); // Clear it if it finishes normally
                npcIsTyping = false;
                
            }
        }
    }
});

  
  // [SMART AI CHAT LISTENER]
  socket.on('chat_message', async (msgText) => {
    if (typeof msgText !== 'string') return;
    if (msgText.length > 200) {
        msgText = msgText.substring(0, 200) + "...";
        // Alternatively, you could just 'return;' to drop the message entirely, 
        // but truncating allows normal wordy players to still be heard.
    }
      let senderName = "Unknown";
      if (players[socket.id] && players[socket.id].name) {
          senderName = players[socket.id].name;
      }

      console.log(`${senderName} says: ${msgText}`);

      // 1. Broadcast HUMAN message immediately
      io.emit('chat_message', {
          sender: senderName, 
          text: msgText
        });
        players[socket.id].lastActive = Date.now();
        // 2. AI LOGIC
        const content = msgText.toLowerCase();
        const resetTriggers = ["suncat you there", "did you get that", "suncat can you hear me", "suncat wake up"];
        if (resetTriggers.some(phrase => content.includes(phrase))) {
            console.log(`[System Override] ${senderName} forcefully reset the global typing lock.`);
            npcIsTyping = false;}
            // If his brain crashed entirely, recreate it so he can actually answer
        if (!chatSessions[socket.id]) {
            console.log(`[System] Rebuilding lost session for ${senderName}`);
            chatSessions[socket.id] = model.startChat({ history: [] });
        }
        const isReply = msgText.includes("[REPLY]");
        const mentioned = content.includes(NPC_NAME.toLowerCase());
        const greeting = content.includes("hi ") || content === "hi";
        const randomChance = Math.random() < 0.05; 

        // Only reply if addressed or randomly triggered, AND not already busy
        if ((mentioned || isReply || (greeting && randomChance) || randomChance) && !npcIsTyping) {
            if (!canTriggerAI(socket.id)) {
                console.log(`[Rate Limit] Blocked spam from ${senderName}`);
                socket.emit('chat_message', {
                    sender: NPC_NAME,
                    text: "*...my mind is clouded... give me a moment to think...*",
                    color: "#aaaaaa" // Gray color to indicate a system/thought message
                });
                return; // Exit early, do not trigger the AI
            }
            // --- BUDGET CHECK ---
            if (isBankrupt()) {
                socket.emit('chat_message', {
                    sender: "[SYSTEM]",
                    text: "Suncat's mana is depleted for this session. He cannot speak.",
                    color: "#ff0000"
                });
                return; 
            }
            npcIsTyping = true;
            const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
            try {
                // --- MODEL ROUTER (THE STATELESS BRAIN SWAP) ---
                const complexKeywords = [
                    "map", "dungeon", "maze", "create", "build", 
                    "spawn", "npc", "monster", "boss", "enemy", "dragon",
                    "quest", "adventure", "what next", "give me something to do",
                    "teleport", "warp", "send me", "move me",
                    "corridor", "arena", "gladiator", "gauntlet", "roleplay", "act as" // <-- NEW TRIGGERS
                ];
                
                const isComplexTask = complexKeywords.some(kw => content.includes(kw));

                // --- CONTEXT INJECTION ---
                const suncat = players[SUNCAT_ID]; 
                const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                // 1. Grab dynamic map lore
                const myMapLore = getShortMapLore(suncat.mapID);
                const playerMapLore = getShortMapLore(players[socket.id].mapID);
                
                // 2. Build Suncat's local awareness
                let suncatStatus = `My Location: Map ${suncat.mapID}, Coords (${Math.floor(suncat.x)}, ${Math.floor(suncat.y)})\nMy Surroundings: ${myMapLore}\nServer Time: ${timeString}`;              

                // 3. If the player is far away, tell Suncat where they are!
                if (suncat.mapID !== players[socket.id].mapID) {
                    suncatStatus += `\n[TARGET PLAYER LOCATION]: ${senderName} is currently far away at Map ${players[socket.id].mapID} (${playerMapLore}).`;
                }

                let playerListContext = Object.values(players).map(p => `${p.name}(Map${p.mapID||0})`).join(", ");
                // Grab the player's personal activity log
                const activityContext = (players[socket.id].activityLog && players[socket.id].activityLog.length > 0)
                    ? `\n[${senderName}'s Recent Actions (Hivemind Report)]\n- ` + players[socket.id].activityLog.join('\n- ')
                    : "";

                const rumorContext = globalRumors.length > 0 ? `\n[WORLD RUMORS]\n${globalRumors.join("\n")}` : "";

                // Inject both the Rumors AND the player's Activity Log into the final prompt
                const promptWithContext = `[CURRENT PLAYERS]\n${playerListContext}\n[MY STATUS]\n${suncatStatus}${rumorContext}${activityContext}\n\n${senderName} SAYS: ${msgText}`;// We define the session we will actively use for this turn
                let activeSession = chatSessions[socket.id];
                let result;

                // --- STATELESS DM EXECUTION ---
                if (isComplexTask) {
                    console.log(`[ROUTER] Upgrading ${senderName}'s request to 3.1 Flash Lite DM Mode!`);
                    
                    // 1. Grab the current conversation history from the normal "Cheap Brain"
                    let currentHistory = await activeSession.getHistory();
                    
                    // 2. Clone it into a TEMPORARY "Big Brain" session
                    activeSession = dmModel.startChat({
                        history: currentHistory
                    });
                }

                // --- SEND MESSAGE TO AI ---
                // This dynamically uses the Cheap Brain for normal chat, or the Temp Big Brain for tasks!
                result = await activeSession.sendMessage(promptWithContext);
                
                if (result.response.usageMetadata) {
                        const usage = result.response.usageMetadata;
                        updateBudget(usage);
                        console.log(`[Main Chat] Tokens: ${usage.totalTokenCount}`);
                        io.emit('debug_stats', {
                            tokens: usage.totalTokenCount,
                            cost: totalSessionCost 
                        });
                }
                        // --- TOOL HANDLING ---
                        let finalResponse = await executeAITools(result.response, activeSession, socket);
                    
                

                // --- RESTORE NORMAL BRAIN (CRITICAL STEP) ---
                if (isComplexTask) {
                    // The DM is finished executing tools and speaking. 
                    // We extract the final updated history containing all the tool calls/responses!
                    let updatedHistory = await activeSession.getHistory();
                    // Scrub the grid payload to save tokens
                    updatedHistory.forEach(msg => {
                        msg.parts.forEach(part => {
                            if (part.functionCall && part.functionCall.name === "createCustomMap") {
                                // Replace the massive grid array with a tiny string
                                part.functionCall.args.grid = "[[GRID_DATA_OMITTED]]";
                            }
                        });
                    });
                    // Rebuild the player's permanent session so the Cheap Brain remembers everything!
                    chatSessions[socket.id] = model.startChat({
                        history: updatedHistory
                    });
                }

                // Finally, extract the spoken text and broadcast
                try {
                    const finalSpeech = finalResponse.text();
                    if (finalSpeech) {
                        // 1. Check for new Memories
                        const saveMatch = finalSpeech.match(/\[\[SAVE:\s*(.*?)\]\]/i);
                        if (saveMatch && saveMatch[1]) {
                            const newFact = saveMatch[1];
                            if (!players[socket.id].coreFacts) players[socket.id].coreFacts = [];
                            players[socket.id].coreFacts.push(newFact); 
                            socket.emit("suncat_learned_fact", newFact); 
                        }

                        // 2. Check for Favor Changes
                        const favorMatch = finalSpeech.match(/\[\[FAVOR:\s*([+-]?\d+)\]\]/i);
                        if (favorMatch && favorMatch[1]) {
                            let favorChange = parseInt(favorMatch[1]);
                            playerFavorMemory[socket.id] = (playerFavorMemory[socket.id] || 0) + favorChange;
                            socket.emit("suncat_changed_favor", favorChange); 
                        }

                        broadcastSuncatMessage(finalSpeech); 
                    }
                } catch (textError) {
                    console.log(`[Suncat] Completed action but had no text to broadcast.`);
                }

            } catch (error) {
                console.error("General AI Error:", error);
                if (chatSessions[socket.id]) {
                    delete chatSessions[socket.id];
                    console.log(`[System] Cleared corrupted AI session for socket: ${socket.id}`);
                }
            } finally {
                clearTimeout(typingFailSafe); // <--- ADD THIS HERE
                npcIsTyping = false;
            }
        }
        await manageHistorySize(socket.id);
  });

    // --- SUNCAT VOCAL COMPOSER (For Ai3Module) ---
    socket.on('suncat_compose_vocal', async (data, callback) => {
        console.log(`[Music AI] Suncat is improvising a VOCAL performance...`);
        try {
           const previousContext = data.currentState || "This is the very first bar of a brand new song.";

        const prompt = `
        PREVIOUS BAR CONTEXT:
        ${data.currentState}

        
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
    // [NEW] SUNCAT SPECTATOR (Text-Based)
  socket.on("suncat_spectate", async (actionDescription) => {
    const suncat = players[SUNCAT_ID];
    const sender = players[socket.id];
    if (!sender) return;

    // --- 1. THE HIVEMIND LOGGING (Always Happens) ---
    // Initialize their personal log if it doesn't exist
    if (!sender.activityLog) sender.activityLog = [];
    
    // Save the action to their personal progress log
    sender.activityLog.push(actionDescription);
    if (sender.activityLog.length > 3) sender.activityLog.shift(); // Only keep the 3 most recent things to save tokens

    // 30% chance to also push this to the Global Rumor Mill so Suncat gossips about it with OTHER players
    if (Math.random() < 0.3) {
        addRumor(`${sender.name} was recently seen: ${actionDescription}`);
    }

    // --- 2. LIVE VERBAL REACTION (10% Chance & Busy Check) ---
    if (Math.random() > 0.1 || npcIsTyping || !canTriggerAI(socket.id)) return; 

    npcIsTyping = true; // Lock his attention
    const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
    
    try {
        // 3. Initialize Chat if needed (Just in case he hasn't spoken to this player yet)
        if (!chatSessions[socket.id]) {
            chatSessions[socket.id] = model.startChat({
                history: [
                    { role: "user", parts: [{ text: NPC_PERSONA }] },
                    { role: "model", parts: [{ text: "Understood." }] },
                ],
            });
        }

        // 4. Create the context-aware prompt
        const prompt = `[SYSTEM OBSERVATION]: You just saw ${sender.name} perform the following action: "${actionDescription}". \n[TASK]: React to this action out loud. Be witty, sarcastic, or observant based on your current favor with them. Keep it under 2 sentences.`;

        // 5. Use generateContent instead of sendMessage to keep it OUT of chat history!
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        }); 
        const response = result.response.text();
        // 6. Token Tracking
        if (result.response.usageMetadata) {
            const usage = result.response.usageMetadata;
            console.log(`[Spectator Active] Tokens: ${usage.totalTokenCount}`);
            io.emit('debug_stats', {
                tokens: usage.totalTokenCount,
                cost: totalSessionCost           
        });
        }

        // 7. Broadcast Suncat's reaction
        broadcastSuncatMessage(response);

        // 8. Run your memory pruner so this doesn't bloat the history
        await manageHistorySize(socket.id);

    } catch (error) {
        console.error("Suncat Spectator Error:", error);
        if (chatSessions[socket.id]) {
                  delete chatSessions[socket.id];
                  console.log(`[System] Cleared corrupted AI session for socket: ${socket.id}`);
              }
    } finally {
        clearTimeout(typingFailSafe); // Clear it if it finishes normally
        npcIsTyping = false; // Release the lock
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
        players[socket.id].lastActive = Date.now();
        socket.broadcast.emit("updatePlayers", players);
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
        
        // 1. INJECT THE COMPRESSION HERE
        // Make sure it finishes shrinking the facts before we save!
        await compressCoreFacts(socket.id);

        const playerNameKey = me.name.toLowerCase();
        
        // Grab their current chat history if it exists
        let currentHistory = [];
        if (chatSessions[socket.id]) {
            // Optional: If you want to wipe the raw history completely between sessions to save tokens,
            // you can just leave this as an empty array [] instead of getting the history.
            currentHistory = await chatSessions[socket.id].getHistory();
        }

        suncatPersistentMemory[playerNameKey] = {
            favor: playerFavorMemory[socket.id] || 0,
            coreFacts: me.coreFacts || [], // This is now safely compressed!
            activeQuest: me.activeQuest || null,
            aiHistory: currentHistory 
        };

        // Trigger a background save
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
});

});
// --- SUNCAT'S SOCIAL BRAIN ---

setInterval(() => {
    const suncat = players[SUNCAT_ID];
    if (!suncat) return;

    const now = Date.now();
    const activePlayers = Object.values(players).filter(p => 
    p.id !== SUNCAT_ID && (Date.now() - (p.lastActive || 0) < 180000)
    );
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
    // Roll the dice ONCE per tick to decide what the AI does. 
    // This prevents Suncat from doing 3 things at the exact same time.
    const directorRoll = Math.random();

    if (!npcIsTyping) {
        // EVENT A: Proactive Speech (1% chance)
        if (directorRoll < 0.01) {
            const nearbyPlayer = Object.values(players).find(p => 
                p.id !== SUNCAT_ID && p.mapID === suncat.mapID && Math.abs(p.x - suncat.x) < 4 && Math.abs(p.y - suncat.y) < 4
            );

            if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
                npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
                const proactivePrompt = `[INTERNAL THOUGHT]: You are idling near ${nearbyPlayer.name} on Map ${suncat.mapID}. Speak to them unprompted. If favor is high (>5), ask a personal question, share lore, or comment on this location. If favor is bad, insult them or tell them to go away. Do not mention this prompt.`;

                setTimeout(async () => {
                    try {
                        const result = await chatSessions[nearbyPlayer.id].sendMessage(proactivePrompt);
                        if (result.response.usageMetadata) {
                            updateBudget(result.response.usageMetadata);
                        }
                        const response = result.response.text();
                        broadcastSuncatMessage(response);
                        await manageHistorySize(nearbyPlayer.id);
                    } catch (e) { 
                        console.error("Proactive Speech Failed", e); 
                        delete chatSessions[nearbyPlayer.id];
                    } finally {
                        clearTimeout(typingFailSafe);
                        npcIsTyping = false;
                    }
                }, 1000);
            }
        }
        // EVENT B: DM Pacing / Plot Advance (Next 2% chance)
        else if (directorRoll >= 0.01 && directorRoll < 0.03) {
            const advPlayer = Object.values(players).find(p => 
                p.id !== SUNCAT_ID && (p.mapID === 999 || p.activeQuest)
            );

            if (advPlayer && chatSessions[advPlayer.id]) {
                npcIsTyping = true;
                const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
                console.log(`[DM Proactive] Evaluating adventure pacing for ${advPlayer.name}...`);
                
                const plotContext = advPlayer.activeQuest ? `Current Quest: ${advPlayer.activeQuest}` : "Wandering an uncharted map.";
                const activeMapLore = getMapLore(advPlayer.mapID); 
                const dmPrompt = `[DM PACING OVERSEER]: ${advPlayer.name} is lingering on Map ${advPlayer.mapID}.\n[TERRAIN]: ${activeMapLore}\n${plotContext}\n\nAdvance the adventure NOW to keep things exciting. You MUST use a tool (spawnNPC for a sudden ambush, changeEnvironment for a sudden storm, or assignQuest to update their objective(keep relevant to [TERRAIN])). Use the [TERRAIN] info above to make the event thematic (e.g., spawn water monsters if by the sea). Narrate the sudden event dramatically. DO NOT ask what they do next.`;

                setTimeout(async () => {
                    try {
                        chatSessions[advPlayer.id] = dmModel.startChat({ history: await chatSessions[advPlayer.id].getHistory() });
                        const result = await chatSessions[advPlayer.id].sendMessage(dmPrompt);
                        let finalResponse = await executeAITools(result.response, chatSessions[advPlayer.id], io.sockets.sockets.get(advPlayer.id));
                        
                        const finalSpeech = finalResponse.text();
                        if (finalSpeech) broadcastSuncatMessage(finalSpeech);
                        
                        let updatedHistory = await chatSessions[advPlayer.id].getHistory(); 
                        chatSessions[advPlayer.id] = model.startChat({ history: scrubAIHistory(updatedHistory) });
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
        // EVENT C: Random Event Kidnapper (Next 1% chance)
        else if (directorRoll >= 0.03 && directorRoll < 0.04) {
            const activePlayers = Object.values(players).filter(p => p.id !== SUNCAT_ID && (Date.now() - (p.lastActive || 0) < 180000));
            const potentialVictims = activePlayers.filter(p => p.mapID !== 999);
            
            if (potentialVictims.length > 0) {
                const victim = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
                
                if (chatSessions[victim.id]) {
                    npcIsTyping = true;
                    const typingFailSafe = setTimeout(() => { npcIsTyping = false; }, 20000);
                    console.log(`[Random Event] Suncat is plotting against ${victim.name}...`);
                    
                    const kidnapPrompt = `[SYSTEM OVERRIDE]: It is time for a Random Event!\nChoose ONE of these themes:\n1. Emperor's Gladiator Arena (Spiky/Desert theme, lots of tough monsters, taunt them)\n2. Den of Thieves (Dark/Forest theme, lots of Goblins/Imps)\n3. The Lost Woods Rescue (Forest theme, tell them a woman's husband is lost here)\n\nYOU MUST EXECUTE 'createCustomMap' targeting '${victim.name}'. Build the map to fit the theme, populate it with fitting NPCs, and speak your opening dialogue. If you are the Emperor, go "Muhahaha!". Set the scene!`;

                    setTimeout(async () => {
                        try {
                            chatSessions[victim.id] = dmModel.startChat({ history: await chatSessions[victim.id].getHistory() });
                            const result = await chatSessions[victim.id].sendMessage(kidnapPrompt);
                            const finalResponse = await executeAITools(result.response, chatSessions[victim.id], io.sockets.sockets.get(victim.id));
                            
                            const finalSpeech = finalResponse.text();
                            if (finalSpeech) broadcastSuncatMessage(finalSpeech);
                            
                            let updatedHistory = await chatSessions[victim.id].getHistory();
                            chatSessions[victim.id] = model.startChat({ history: scrubAIHistory(updatedHistory) });
                            await manageHistorySize(victim.id);
                        } catch (e) {
                            console.error("Kidnap Event Error:", e);
                        } finally {
                            clearTimeout(typingFailSafe);
                            npcIsTyping = false;
                        }
                    }, 1000);
                }
            }
        }
    }
}, 10000); // END OF THE 10 SECOND INTERVAL
async function manageHistorySize(socketId) {
    if (!chatSessions[socketId]) return;

    try {
        let history = await chatSessions[socketId].getHistory();
        
        // Thresholds: Only summarize if we hit 30 messages. 
        // We will keep the 10 most recent messages exactly as they are.
        const MAX_HISTORY_LENGTH = 30;
        const MESSAGES_TO_KEEP = 10;

        if (history.length <= MAX_HISTORY_LENGTH) {
            return; // History is still small, do nothing.
        }

        console.log(`[Memory] History for ${socketId} reached ${history.length}. Initiating summarization...`);

        // 1. Split the history
        const splitIndex = history.length - MESSAGES_TO_KEEP;
        const oldHistory = history.slice(0, splitIndex);
        let recentHistory = history.slice(splitIndex);

        // 2. Format the old history into a readable script for the AI
        let transcriptToSummarize = oldHistory.map(msg => {
            let role = msg.role === 'model' ? 'Suncat' : 'Player';
            // Safely extract text, ignoring the massive JSON tool payloads
            let text = msg.parts.map(p => p.text || "").join(" ").trim();
            return text ? `${role}: ${text}` : "";
        }).filter(line => line !== "").join("\n");

        // 3. Prompt the Cheap Brain to summarize
        const summaryPrompt = `Summarize the following interaction between a player and Suncat in a dark fantasy MMORPG. Focus strictly on key lore revealed, important player actions, and the current emotional tone between them. Keep it under 3 sentences.\n\n[TRANSCRIPT]\n${transcriptToSummarize}`;

        // Make a stateless generation call (does not affect the active chat session)
        const summaryResult = await model.generateContent(summaryPrompt);
        const summaryText = summaryResult.response.text();
            // INSTEAD OF KEEPING IT IN HISTORY, PUSH TO FACTS:
        if (!players[socketId].coreFacts) players[socketId].coreFacts = [];
        players[socketId].coreFacts.push(`[PAST EVENT]: ${summaryText}`);

        // Keep only the last 4 messages (2 exchanges) for immediate conversational flow. 
        // This drastically cuts your input tokens per turn.
        recentHistory = history.slice(-4); 

        chatSessions[socketId] = model.startChat({
            history: recentHistory
        });
        console.log(`[Memory] Compressed 20 messages into: "${summaryText}"`);
        
        // Track the cost of the summarization itself
        if (summaryResult.response.usageMetadata) {
            updateBudget(summaryResult.response.usageMetadata);
        }

        // 4. Build the new, compressed history array
        let compressedHistory = [
            { 
                role: "user", 
                parts: [{ text: `[SYSTEM MEMORY INJECTION: Summary of earlier events]\n${summaryText}` }] 
            },
            { 
                role: "model", 
                parts: [{ text: "[SYSTEM ACKNOWLEDGED] I remember this context." }] 
            },
            ...recentHistory // Append the exact recent messages so the immediate conversation flows naturally
        ];

        // 5. Overwrite the player's active session with the compressed history
        chatSessions[socketId] = model.startChat({
            history: compressedHistory
        });

    } catch (error) {
        console.error("[Memory] Summarization failed:", error);
        
        // Fallback: If the API fails, just do a brute-force chop so the server doesn't crash or bloat
        let history = await chatSessions[socketId].getHistory();
        chatSessions[socketId] = model.startChat({
            history: history.slice(-15) 
        });
    }
}
// --- TIER 3 MEMORY: CORE FACT COMPRESSION ---
async function compressCoreFacts(socketId) {
    const player = players[socketId];
    // Only trigger if they have racked up enough facts to warrant a summary
    if (!player || !player.coreFacts || player.coreFacts.length < 10) return;

    console.log(`[Memory] Compressing Core Facts for ${player.name}...`);

    const factsToCompress = player.coreFacts.join("\n- ");
    
    const prompt = `You are a background system maintaining long-term memory for an NPC named Suncat.
    Below are recent events involving the player ${player.name}:
    - ${factsToCompress}
    
    Distill these events into exactly 3 concise, permanent bullet points that define:
    1. Their overall relationship, favor, and vibe with Suncat.
    2. Their defining major accomplishments or playstyle.
    3. Their current overarching goal in the world.
    
    Discard temporary tactical details. Output ONLY the bullet points.`;

    try {
        const result = await model.generateContent(prompt);
        const compressedText = result.response.text();
        
        if (result.response.usageMetadata) {
            updateBudget(result.response.usageMetadata);
        }

        // Wipe the bloated array and replace it with the distilled profile!
        player.coreFacts = [ `[PLAYER PROFILE]\n${compressedText}` ];
        console.log(`[Memory] Successfully distilled identity for ${player.name}`);
        
    } catch (e) {
        console.error("[Memory] Fact compression failed. Keeping uncompressed facts.", e);
    }
}
// --- THE AFK SWEEPER (Run every 2 minutes) ---
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes of no movement/chat

setInterval(async () => {
    const now = Date.now();
    for (const socketId in chatSessions) {
        const player = players[socketId];
        
        // If the player exists but hasn't moved or typed in 5 minutes...
        if (player && (now - (player.lastActive || 0) > IDLE_TIMEOUT)) {
            console.log(`[Hibernation] ${player.name} went AFK. Hibernating AI session.`);
            
            // 1. Force a Tier 2 summary of their immediate history
            await manageHistorySize(socketId); 
            
            // 2. Force a Tier 3 compression of their core facts
            await compressCoreFacts(socketId);
            
            // 3. Save their pristine, compressed state to persistent memory
            const nameKey = player.name.toLowerCase();
            suncatPersistentMemory[nameKey] = {
                favor: playerFavorMemory[socketId] || 0,
                coreFacts: player.coreFacts || [],
                activeQuest: player.activeQuest || null,
                aiHistory: [] // Wipe the heavy history!
            };
            
            // 4. Destroy the active session to free up Server RAM
            delete chatSessions[socketId];
        }
    }
}, 2 * 60 * 1000); // Checks every 120 seconds
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
