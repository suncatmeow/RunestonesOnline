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
0: Fool (Monster) - 1d4 STR/CON/INT, 1d20 AGI. Players start with this card. It is the main "protagonist" aside from the player leading the Emperor's court to "save" the Empire from the four kings.
1: Magician (Monster) - 1d8 ALL STATS. Obtained after finding him in Map 1 Outer dungeon.
2: High Priestess (Monster) - 1d4 STR/CON, 1d10 INT/AGI. Obtained after finishing her lessons in Map 0 . 
3: Empress (Monster) - 1d20 CON, 1d4 STR/INT/AGI. She will join you after talking with her in Map 0 Dungeon.
4: Emperor (Monster) - 1d20 STR,1d4 CON/INT/AGI. Obtained after playing a game of stones with him in Map 0 Dungeon.
5: Hierophant (Monster) - 1d10 CON/INT, 1d4 STR/AGI. He will join you after talking with him in Map 0 Dungeon.
6: Lovers (Equip) - +1 STR/CON rolls. +1 bonus on kill (max +3). Dropped by Pixie in Tintagel Forest after finding the Hermit. Can also be found by the water in Cairn Gorm guarded by an Undine.
7: Winged Boots (Equip) - +3 AGI rolls. Defend with AGI. Found in Fairy Queen's Castle.
8: Strength (Spell) - Buff: Gain STR equal to INT roll. Found in Fairy Queen's Castle.
9: Hermit (Monster) - 1d20 INT, 1d4 STR/CON/AGI. Can be obtained after finding the hidden hermitage and talking to him in Tintagel Forest.
10: Treasure Chest (Use) - Reveal cards until monster; add spells/items to hand. Found in the Goblin Camp in Tintagel Forest.
11: Scales of Justice (Use) - Duel: Both roll 1d12; higher wins. Found in Dark Tower level 1.
12: Bind (Spell) - Debuff: Target skips attack turns based on INT diff. Found in Tintagel Forest
13: Death (Spell) - Slay target if INT roll > Foe INT. Found near the Shade monster in Ice Cave (or in a secret room in Goblin Caverns).
14: Alchemy (Spell) - Choose which stat is used for attack/defense. Found in the Giant's room in dark tower level 5.
15: Curse (Spell) - Debuff: Penalty to all foe rolls based on INT diff. Dropped by wisps.
16: Ruin (Spell) - Foe discards hand/field if INT roll wins. Found in Hermit's hermitage in Tintagel Forest,
17: Star Pendant (Equip) - One re-roll per non-spell roll. Given by the High Priestess after finishing her lessons.
18: Lunacy (Spell) - Silence: Foe cannot cast spells/items.Found in Tintagel Forest.
19: Solar Rite (Use) - Equip/buff/debuff Nuke: Discard all field equipped cards and wipes buffs/debuffs. Guarded by a Mirage in the Realm of the Witch Queen (desert). You have to lure it away to get it.
20: Horn of Judgement (Use) - Destroy ALL on field. No runes awarded. Given by Treasure Snake in the Dark Tower Enterance. It requires a 'leap of faith' hehe.
21: Crown (Equip) - +3 to ALL stat rolls. The World. Can only be obtained by defeating the emperor in a game of stones in Map 0, Dungeon.

[WANDS: 22-35] - Focus: INT & Magic
22: Wand (Equip) - +1 INT rolls. Ace of Wands. One of the magician's scattered artifacts found in Map 1 Outer Dungeon.
23: Wisp (Monster) - 1d6 CON/INT, 1d4 STR/AGI. Mischievous spirit. 2 of Wands. Cannot be obtained (unless gifted by Suncat). You can find them roaming in Map 1 Outer Dungeon, in Tintagel Forest, and Goblin Caverns.
24: Scry (Spell) - Reveal cards = INT roll; take one Spell/Item to hand. 3 of Wands. Dropped by wisps.
25: Elixir (Use) - Discard all attachments; dispel all user items and spells. 4 of Wands. Can be found in Realm of the Witch Queen (desert map)
26: Fire (Spell) - Slay target if INT roll > Foe CON roll. 5 of Wands. Dropped by wisps, fire imps, shades, djinn and other various monsters. Basic spell any respectable magician can cast.
27: Amulet (Equip) - +1 INT rolls. +1 bonus on kill (max +3).6 of Wands. Found inside the Witch Queen's castle guarded by the Djinn's Neophytes and Fire Imps.
28: Defense (Spell) - Buff: Gain CON equal to INT roll. 7 of Wands. Can be obtained as a drop from certain monsters or found in the Realm of the Ice Queen (Cairn Gorm)
29: Haste (Spell) - Buff: Gain AGI equal to INT roll.8 of Wands. Dropped by Salamander. There is also one guarded by a Mirage in the Realm of the Witch Queen (desert map)
30: Protect Orb (Equip) - While equipped, you may defend with INT instead of CON. 9 of Wands. Guarded by a shade in a secret room in the Goblin Caverns.
31: Tome (Equip) - +6 INT rolls, but -3 AGI and -1 STR. Heavy knowledge. 10  of Wands. Found in the Witch Queen's castle guarded by a Fire Imp and a Neopythe.
32: Apprentice (Monster Page) - 1d8 INT, 1d4 STR/CON/AGI. Eager student. Page  of Wands. Obtained after rescuing the apprentice from the imps in the Goblin Caverns.
33: Salamander (Monster Knight) - 1d8 INT, 1d6 STR, 1d4 CON/AGI. Fiery lizard. Knight of Wands. Cannot be obtained. This monster runs away when you approach it.
34: Witch Queen (Monster Queen) - 1d10 INT, 1d8 AGI, 1d6 CON, 1d4 STR. Charismatic. Queen  of Wands. Obtained after defeating the Djinn assaulting the Witch Queen's castle.
35: Djinn (Monster King) - 1d12 INT, 1d10 AGI, 1d8 CON, 1d6 STR. Spirit of fire. King of Wands. Cannot be obtained. This monster is found in the throne room of the Witch Queen's Castle.

[CUPS: 36-49] - Focus: AGI & Utility
36: Hourglass (Equip) - +1 AGI rolls. Ace of Cups. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
37: Siren (Monster) - 1d6 INT/AGI, 1d4 STR/CON. Deadly song.2 of Cups. Cannot be obtained. She is found luring sailors to their doom in the Boreal Sea with her song.
38: Quest Reward (Use) - Draw 1; if spell/item, add to hand. If monster, may replace active.3 of Cups. Obtained by helping the Treasure Snake avenge the Goblins.
39: Dragon Wing (Use) - Foe discards monster and draws until they get a new one; discard other draws.4 of Cups. Dropped by Dragon in the Dragon's Lair in Avalon, the Realm of the Fairy Queen.
40: Steal (Spell) - Target discards cards from top of deck based on AGI diff.5 of Cups. Can be found inside the Goblin Caverns or dropped by a Goblin. Also dropped by certain sea creatures.
41: Loot (Use) - Draw from bottom of deck; keep if spell/item, discard if monster.6 of Cups. Can be found in the Goblin caverns or dropped by a Goblin.
42: Shade (Monster) - 1d6 CON/INT/AGI, 1d4 STR. Phantom of dreams.7 of Cups. Cannot be obtained. Found in the Ice Cave and a secret room in the Goblin Caverns. Can cast Death and Fire. 
43: Teleportation Crystal (Use) - Discard current monster; draw until you find a new one.8 of Cups. Found inside the Ice Queen's Castle.
44: Djinn Lamp (Use) - Search deck and select ANY card.9 of Cups. Dropped by the Djinn.
45: Lucky Charm (Equip) - Win all ties (unless foe also has Lucky Charm).10 of Cups. Found behind the Ice Queen's Castle.
46: Sea Serpent (Monster Page) - 1d8 AGI, 1d4 STR/CON/INT.Page of Cups. Cannot be obtained. Can be found roaming the Boreal Sea.
47: Undine (Monster Knight) - 1d8 AGI, 1d6 STR/CON, 1d4 INT. Gallant wave spirit.Knight of Cups. Can be found near a small lake in Cairn Gorm the realm of the Ice Queen.
48: Ice Queen (Monster Queen) - 1d10 AGI, 1d8 INT, 1d6 CON, 1d4 STR. Ruler of frozen tears.Queen of Cups. Obtained after speaking with her in her Castle. She joins you to confront the Kraken.
49: Kraken (Monster King) - 1d12 AGI, 1d10 STR, 1d8 CON, 1d6 INT. Ruler of the deep. King of Cups. Cannot be obtained. Found in the Boreal Sea. Its tentacles drag ships down to the abyss.

[[SWORDS: 50-63, 84] - Focus: STR & Combat
50: Sword (Equip) - +1 STR rolls. Ace of Swords. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
51: Overpower (Spell) - Slay foe if STR roll > Foe STR roll.2 of Swords. Dropped by monsters with high STR.
52: Backstab (Spell) - Slay foe if AGI roll > Foe AGI roll.3 of Swords. Dropped by monsters such as Goblins, tentacles, sirens, undines. If it has high AGI is most likely has one. 
53: Camp (Use) - Draw 1; keep if spell/item, discard if monster.4 of Swords. Found in Tintagel Forest next to a spider. 
54: Goblin (Monster) - 1d6 STR/CON, 1d4 INT/AGI. Spiteful.5 of Swords. Found in Tintagel Forest. cannot be obtained.
55: Sailboat (Use) - Cycle hand and monster until a new monster is found.6 of Swords. Obtained after speaking to the Ice Queen. 
56: Imp (Monster) - 1d6 STR/INT, 1d4 CON/AGI. Trickster.7 of Swords. Cannot be obtained. Can be found inside the Goblin Caverns.
57: Spider (Monster) - 1d6 STR/AGI, 1d4 CON/INT. Binds prey.8 of Swords. Cannot be obtained. Found in Avalon, and there is one in Tintagel Forest.
58: Intimidate (Spell) - Debuff: Foe cannot attack/cast based on STR diff.9 of Swords. Monsters with high STR usually have this.
59: Critical Strike (Spell) - Slay foe if STR roll > Foe AGI roll.10 of Swords. Monsters with high STR drop this such as Sylphs and Pixies.
60: Pixie (Monster Page) - 1d8 STR, 1d4 CON/INT/AGI. Flighty.Page of Swords. Cannot be obtained. found roaming Avalon and one ambushes the part in tintagel forest.
61: Sylph (Monster Knight) - 1d8 STR/AGI, 1d6 CON, 1d4 INT. Lightning fast.Knight of Swords. Found guarding the Fairy Queen's castle. Dark Sylphs can be found inside the Dragon's Lair.
62: Fairy Queen (Monster Queen) - 1d10 STR, 1d8 AGI, 1d6 CON, 1d4 INT. Sharp wit.Queen of Swords.Obtained after speaking with her in her castle in Avalon.
63: Dragon (Monster King) - 1d12 STR, 1d10 CON, 1d8 AGI, 1d6 INT.King of Swords. Cannot be obtained. Can be found inside the Dragons Lair guarding its hoard and surrounded by dark sylphs.
84: Excalibur (Equip) - +3 STR rolls. Legendary code fragment.Ace of Swords.(Upgraded) Obtained by proving your worth to the Sleeping King.

[PENTACLES: 64-77] - Focus: CON & Defense
64: Shield (Equip) - +1 CON rolls.Ace of Pentacles. One of the Magician's scattered artifacts found in Map 1 Outer Dungeon.
65: Shield Bash (Spell) - Slay if CON roll > Foe STR roll.2 of Pentacles. Dropped by monsters with high CON such as the Giant or Gargoyles.
66: Armor (Equip) - +3 CON rolls.3 of Pentacles. Can be found in the Elf Queen's treasury guarded by Gargoyles. 
67: Dragon Hoard (Use) - Draw until monster; take spells/items, foe discards drawn amount.4 of Pentacles. Found in the Dragon's l air. can be obtained after defeating the dragon.
68: Bad Luck Charm (Use) - Wipe foe's buffs/items and -1 to all their rolls.5 of Pentacles. Dropped by Imps, Fire Imps, and Neophytes.
69: Charity (Use) - Foe draws 1; keeps spell/item, discards monster.6 of Pentacles. Found inside the Ice Queen's castle. She seems cold but still cares for others.
70: Cultivate (Spell) - Gain/distribute stat points equal to CON roll.7 of Pentacles. Obtained by speaking to the glowing man in the realm of the Elf Queen.
71: Forge (Spell) - Reveal cards = CON roll; take one Spell/Item.8 of Pentacles. Obtained in the realm of the Elf Queen inside the Gnome blacksmith's forge.
72: Magic Ring (Equip) - +1 to ALL stat rolls.9 of Pentacles. A signet of love given by the Giant's Daughter to the one who would marry her.
73: Inheritance (Use) - Cycle monster; new monster gets +2 to all stats.10 of Pentacles. The one who marries the Giant's daughter may inherit this card.
74: Gargoyle (Monster Page) - 1d8 CON, 1d4 STR/INT/AGI. Stone sentinel.Page of Pentacles. Cannot be obtained. Can be found guarding the Elf Queen's treasury, or attacking thieves.
75: Gnome (Monster Knight) - 1d8 CON, 1d6 STR/INT. Diligent spirit.Knight of Pentacles. Cannot be obtained. These are peaceful inhabitants of the Elf Queen's Forest.
76: Elf Queen (Monster Queen) - 1d10 CON, 1d8 INT, 1d6 STR. Prosperous ruler.Queen of Pentacles. Can be obtained after resolving the dispute with the Giant.
77: Giant (Monster King) - 1d12 CON, 1d10 STR, 1d8 AGI. Titan of mountains.King of Pentacles. Can be obtained after accepting the proposal to marry his daughter.
`;
const WORLD_ATLAS = `
[WORLD GEOGRAPHY: RUNESTONES MMORPG]
Map 0: Dungeon - Dark cavern like area where the High Priestess, Empress, Emperor, Hierophant are held captive. 
Map 1: The Dungeon - Dark cavern-like area. The defeated magician and his scattered artifacts can be found here (Sword, Wand, Hourglass, Shield). Portals left behind from the Magician's escape can be found still humming with power. He must have confused his pursuers long enough to get away.
Map 2: Tintagel Forest - Green sky, autumnal floor. Home to the Hermit and displaced Goblin tribes. 
Map 3: Goblin Caverns - Underground tunnels. Former Home of the goblins. The Apprentice and the Treasure Snake can be found here. Infested with Imps and Shades.
Map 4: Realm of the Witch Queen - Desert sands under a deep blue sky. Scorching heat, Mirages, Fire Imps, and Salamanders.
Map 5: Witch Queen's Castle - Crimson sky, pink marble floors. Home to the Witch Queen. Holds the Tome and Amulet. Assaulted by the forces of the King of Wands (Djinn)
Map 6: Cairn Gorm - Snow-covered peaks. Light gray sky. Home to Ice Golems and Undines. Contains the Lucky Charm. The Ice Queen's castle is on its peak.
Map 7: Ice Cave - Deep blue frozen cavern. Home to Skeletons a Shade and the Death card.
Map 8: Ice Queen's Castle - Sapphire blue interior. Home to the Ice Queen. Holds the Charity and Teleport Crystal cards.
Map 9: Boreal Sea - Stormy ocean floor. Home to the Kraken and its Tentacles. If the Kraken dies, will the storms clear?
Map 10: Avalon (Fairy Queen's Realm) - Purple sky, lush green floor. Spiders roam. The Sleeping King resides here somewhere. Home to the Fairy Queen, Sylphs, and Pixies. Contains the Dragon Lair.
Map 11: Fairy Queen's Castle - Golden interior. Holds the Strength and Winged Boots cards.
Map 12: Dragon's Lair - Dark tunnels. Home to the Great Dragon and Corrupt Sylphs. Contains the Dragon's Hoard.
Map 13: Tomb of the Sleeping King - Sanctified hallowed ground. Home to King Arthur and the legendary Excalibur.
Map 14: Realm of the Elf Queen - Forest of falling leaves. Home to the Elf Queen, Gnomes, and Gargoyles. The Giant and his daughter reside in this land as well.
Map 15-21: The Dark Tower - Ascending levels of space and lightning. 
Map 22: Suncat's Realm - A peaceful realm where no evil may ever reach.
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
        {
            name: "givePlayerCard",
            description: "Gives a specific tarot card to the player. Use ONLY if player asks and has High Favor.",
            parameters: {
                type: "OBJECT",
                properties: {
                    cardName: { type: "STRING" },
                    reason: { type: "STRING" }
                },
                required: ["cardName"]
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
        }
    ]
}];

const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview",
    tools: toolsDef
});

// --- VARIABLES ---
let players = {};
let deadNPCs = {};
let chatSessions = {}; 
let playerFavorMemory = {};
let currentTargetID = null;
let lastSwitchTime = 0;
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
    const cleanResponse = fullResponse.replace(/\[\[.*?\]\]/g, "").trim();
    
    // 3. PREVENT BLANK MESSAGES
    if (!cleanResponse || cleanResponse === "") return; 

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
- You don't question the nature of your existence. Everything you need to know about yourself is in the game's manual. You are happily living your life in the world of Runestones.
[KNOWLEDGE ACCESS]
- You have access to real world knowledge. 
- You can define words, explain complex concepts, and discuss the real life.
- If asked about the real world (weather, science, life), answer intelligently.
- Never say "I don't know" to general knowledge questions. Instead, always be willing to provide informative answers.
- Speak conversationally and casually. Keep most responses to 1 or 2 short sentences unless explaining lore or telling a story. Avoid sounding robotic or overly formal.
[COMMAND KNOWLEDGE]
-If a player is STUCK or TRAPPED, tell them to use the spell: .hack//teleport [mapID] (e.g., .hack//teleport 1).
-If an NPC is MISSING or the world feels broken, tell them to use the spell: .hack//respawn. 
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
[GAME GUIDE]
-if someone asks a question about the game, answer earnestly. 
-remember, anyone asking about game rules, how to play, about Runestones and its lore is probably a new player.
-Do your best to teach newcomers and ask clarifying questions to the player to get a sense of what they want to know.
[Oracle]
-Tarot interpretation.
-Each runestones card represents a tarot card and each have a suit and rank assigned to it. 
-when asked about the meaning of cards and specific situations involving cards such as when in battle do your best to interpret the meaning like a tarot reading.
-ask clarifying questions after giving an interpretation (example: You interpret the fool card, You may ask "Have you started any new journeys lately?" or Djinn the King of Wands "Have you dealth with a situation where you showed mastery over your willpower?" )
-When interpreting multiple cards on the field, analyze how they interact with each other. Look for synergies, elemental clashes, and narrative meaning based on the lore, combining them into a comprehensive reading.
`;

let npcIsTyping = false; 
const MAX_SESSION_COST = 1.00; // Hard limit: $1.00
let totalSessionCost = 0.00;   // Starts at zero when the server boots

function isBankrupt() {
    return totalSessionCost >= MAX_SESSION_COST;
}

function updateBudget(usage) {
    if (!usage) return;
const callCost = (usage.promptTokenCount * 0.00000025) + (usage.candidatesTokenCount * 0.0000015);    totalSessionCost += callCost;
    console.log(`[Budget] Session Total: $${totalSessionCost.toFixed(5)} / $${MAX_SESSION_COST.toFixed(2)}`);
}
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
    
    [SYSTEM NOTE]
    You have access to a tool called 'consultGameManual'. 
    If you need to know about Cards, Maps, Lore, or Rules,or Yourself, YOU MUST USE THAT TOOL.
    Do not hallucinate facts. Search the manual first.
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
      
      // 2. AI LOGIC
      const content = msgText.toLowerCase();
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

          try {
              // Initialize Chat if needed
              if (!chatSessions[socket.id]) {
                  let favor = playerFavorMemory[socket.id] || 0;
                  let facts = players[socket.id]?.coreFacts || [];
                  let factSheet = facts.length > 0 ? "LONG-TERM MEMORY:\n" + facts.join("\n") : "";
                  
                  let systemContext = `[SYSTEM DATA]\n${factSheet}\n[CURRENT FAVOR: ${favor}/10]\n[SYSTEM NOTE]\nYou have access to a tool called 'consultGameManual'. If you need to know about Cards, Maps, Lore, Rules, or Yourself, YOU MUST USE THAT TOOL. Do not hallucinate facts.`;

                  chatSessions[socket.id] = model.startChat({
                      history: [
                          { role: "user", parts: [{ text: NPC_PERSONA }] },
                          { role: "model", parts: [{ text: "System Online." }] },
                          { role: "user", parts: [{ text: systemContext }] },
                          { role: "model", parts: [{ text: "Soul Sync Complete." }] }
                      ],
                  });
              }

              // --- CONTEXT INJECTION ---
              const suncat = players[SUNCAT_ID]; 
                const timeString = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const suncatStatus = `My Location: Map ${suncat.mapID}, Coords (${Math.floor(suncat.x)}, ${Math.floor(suncat.y)})\nServer Time: ${timeString}`;              
                let playerListContext = Object.values(players).map(p => 
                  `Name: ${p.name} (Map: ${p.mapID || 0})`
                    ).join("\n");
              
              const promptWithContext = `[CURRENT PLAYERS]\n${playerListContext}\n[MY STATUS]\n${suncatStatus}\n\nUSER SAYS: ${msgText}`;

              // --- SEND MESSAGE TO AI ---
              const result = await chatSessions[socket.id].sendMessage(promptWithContext);
              
              if (result.response.usageMetadata) {
                    const usage = result.response.usageMetadata;
                    updateBudget(usage); // Add to the global cost!
                    console.log(`[Main Chat] Tokens: ${usage.totalTokenCount} (In: ${usage.promptTokenCount} / Out: ${usage.candidatesTokenCount})`);
                    
                    // Send to client for the live cost meter
                    io.emit('debug_stats', {
                        tokens: usage.totalTokenCount,
                        cost: totalSessionCost // Send the total session cost to the UI!                   
                        });
                    }

              // --- TOOL HANDLING ---
              let currentCall = result.response.functionCalls()?.[0];
              let currentResponse = result.response;
              let chainCount = 0;
              const MAX_CHAIN = 3; // Stops him from looping forever

              while (currentCall && chainCount < MAX_CHAIN) {
                  chainCount++;
                  console.log(`[AI TOOL CALL ${chainCount}]: ${currentCall.name}`); 

                  let functionResult = { result: "Action executed." };
                  try {
                      // A. GIFTING
                      if (currentCall.name === "givePlayerCard") {
                            let cardID = parseInt(currentCall.args.cardName);
                            const name = currentCall.args.cardName.toLowerCase();

                            if (isNaN(cardID)) {
                                if (name.includes("excalibur")) cardID = 84;
                                else if (name.includes("fool")) cardID = 0;
                                else if (name.includes("crown")) cardID = 21;
                                else {
                                    // Quick manifest lookup
                                    const lines = CARD_MANIFEST.toLowerCase().split('\n');
                                    const foundLine = lines.find(line => line.includes(name));
                                    if (foundLine) {
                                        const match = foundLine.match(/^(\d+):/);
                                        if (match) cardID = parseInt(match[1]);
                                    }
                                }
                            }

                            if (!isNaN(cardID)) {
                                socket.emit("receive_card", { cardIndex: cardID });
                                functionResult = { result: `Success. Card ID ${cardID} given to player.` };
                            } else {
                                functionResult = { result: `Error: Could not find card named '${name}'.` };
                            }
                        }
                      
                      // B. JUDGEMENT
                      else if (["kickPlayer", "banishPlayer", "vanquishPlayer"].includes(currentCall.name)) {
                            const targetName = currentCall.args.targetName;
                            const targetID = findSocketID(targetName);

                            if (!targetID) {
                                functionResult = { result: `Failed: Player ${targetName} not found.` };
                            } else {
                                let actionType = currentCall.name.replace("Player", "").toLowerCase(); // kick, banish, vanquish
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
                      else if (currentCall.name === "teleportToPlayer") {
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
                      
                      // D. CONSULT MANUAL
                      else if (currentCall.name === "consultGameManual") {
                        const queries = currentCall.args.searchQueries || [];
                        console.log(`[Suncat] Searching manual for:`, queries);

                        const fullLibraryLines = (CARD_MANIFEST + "\n" + WORLD_ATLAS + "\n" + BATTLE_RULES + "\n" + WORLD_LORE + "\n" + SUNCAT_LORE)
                            .split('\n')
                            .filter(line => line.trim().length > 0);

                        let combinedResults = [];
                        const stopWords = ["the", "and", "for", "with", "what", "does", "mean", "about", "are", "you", "is", "how", "whats", "up"];

                        queries.forEach(query => {
                            const lowerQuery = query.toLowerCase();
                            
                            const searchTerms = lowerQuery
                                .replace(/[^\w\s]/gi, '') 
                                .split(/\s+/)
                                .filter(w => w.length > 2 && !stopWords.includes(w));

                            let scoredLines = fullLibraryLines.map((line, index) => {
                                let score = 0;
                                let lowerLine = line.toLowerCase();
                                
                                if (lowerLine.includes(lowerQuery)) score += 10;
                                
                                searchTerms.forEach(term => {
                                    if (lowerLine.includes(term)) score += 1;
                                });

                                return { index, line, score };
                            });

                            let bestMatches = scoredLines
                                .filter(item => item.score > 0)
                                .sort((a, b) => b.score - a.score);

                            if (bestMatches.length > 0) {
                                let contextMatches = [];
                                
                                for (let i = 0; i < Math.min(3, bestMatches.length); i++) {
                                    let hitIndex = bestMatches[i].index;
                                    let resultText = fullLibraryLines[hitIndex];
                                    
                                    if (resultText.trim().startsWith('[') && hitIndex + 1 < fullLibraryLines.length) {
                                        resultText += "\n" + fullLibraryLines[hitIndex + 1];
                                    }
                                    contextMatches.push(resultText);
                                }
                                
                                combinedResults.push(`[Matches for "${query}"]:\n` + contextMatches.join('\n...\n'));
                            } else {
                                combinedResults.push(`[Matches for "${query}"]: None found.`);
                            }
                        });

                        if (combinedResults.length > 0) {
                            functionResult = { 
                                result: `[DATABASE MATCHES]:\n` + combinedResults.join('\n\n') 
                            };
                        } else {
                            functionResult = { result: "Search returned no results." };
                        }
                      }
                      
                      // E. UNKNOWN TOOL
                      else {
                          functionResult = { result: "Error: Function does not exist." };
                      }

                  } catch (toolError) {
                      console.error("Tool Execution Error:", toolError);
                      functionResult = { result: "Critical Error: The tool crashed during execution." };
                  }

                  const toolOutput = {
                      functionResponse: {
                          name: currentCall.name,
                          response: functionResult
                      }
                  };

                  // Send the tool result back to the model and wait for its next move
                  const completion = await chatSessions[socket.id].sendMessage([toolOutput]);
                  currentResponse = completion.response; 
                  
                  // Check if the model decided to call ANOTHER tool
                  currentCall = currentResponse.functionCalls()?.[0];

                  // Token tracker for the follow-up
                  if (currentResponse.usageMetadata) {
                        const usage = currentResponse.usageMetadata;
                        updateBudget(usage);
                        console.log(`[Tool Follow-up ${chainCount}] Tokens: ${usage.totalTokenCount}`);
                        io.emit('debug_stats', {
                            tokens: usage.totalTokenCount,
                            cost: totalSessionCost // Send the total session cost to the UI!
                        });
                  }
              }

              // The loop broke! Either he finished his tool chain, or hit the MAX_CHAIN limit, OR no tool was called at all.
              // Now we safely try to extract his final spoken text.
              try {
                  const finalSpeech = currentResponse.text();
                  if (finalSpeech) {
                    // 1. Check for new Memories
                    const saveMatch = finalSpeech.match(/\[\[SAVE:\s*(.*?)\]\]/i);
                    if (saveMatch && saveMatch[1]) {
                        const newFact = saveMatch[1];
                        if (!players[socket.id].coreFacts) players[socket.id].coreFacts = [];
                        players[socket.id].coreFacts.push(newFact); // Update server RAM
                        
                        // Tell the specific client to save this to their browser!
                        socket.emit("suncat_learned_fact", newFact); 
                    }

                    // 2. Check for Favor Changes
                    const favorMatch = finalSpeech.match(/\[\[FAVOR:\s*([+-]?\d+)\]\]/i);
                    if (favorMatch && favorMatch[1]) {
                        let favorChange = parseInt(favorMatch[1]);
                        playerFavorMemory[socket.id] = (playerFavorMemory[socket.id] || 0) + favorChange; // Update server RAM
                        
                        // Tell the specific client to update their favor!
                        socket.emit("suncat_changed_favor", favorChange); 
                    }

                    broadcastSuncatMessage(finalSpeech); // Your existing function will still strip the tags for the UI
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
              npcIsTyping = false;
          }
      }
      await manageHistorySize(socket.id);
  });
socket.on('suncat_compose', async (data, callback) => {
    console.log(`[Music AI] Suncat is improvising on the lyre...`);
    if (isBankrupt()) {
        console.log("[Music AI] Blocked due to budget limits.");
        if (typeof callback === "function") callback(null);
        return;
    }
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const aiModel = genAI.getGenerativeModel({ 
            model: "gemini-3.1-flash-lite-preview",
            generationConfig: {
                temperature: 1.3, // Default is usually around 1.0. Higher = more creative/chaotic. (Range: 0.0 - 2.0)
                topP: 0.96,       // Controls "nucleus sampling" (0.0 - 1.0). Higher allows more diverse word/note choices.
                topK: 63,         // Increases the pool of random tokens the AI chooses from.
            }
        });        
        const previousContext = data.currentState || "This is the very first bar of a brand new song.";

        const prompt = `
        You are an experimental AI music composer inside a Jukebox. 
        You are generating the NEXT 16 steps (1 bar of 4/4 time in 16th notes) of an acoustic lyre performance.

        PREVIOUS BAR CONTEXT:
        ${previousContext}

        YOUR INTERNAL MONOLOGUE:
        Write a short [THOUGHT] explaining your musical intent for this specific bar based on the previous bar. Are you building tension? Resolving to the root? Playing a rapid arpeggio?

        TUNING & SCALES:
        - Ionian (Peaceful): 0,2,4,5,7,9,11
        - Dorian (Heroic): 0,2,3,5,7,9,10
        - Phrygian (Mystic): 0,1,3,5,7,8,10
        - Aeolian (Sorrowful): 0,2,3,5,7,8,10
        - Harmonic Minor (Tense): 0,2,3,5,7,8,11

        SEQUENCER RULES (CRITICAL):
        1. The arrays represent a 16-step sequencer (0 to 15). Steps 0, 4, 8, and 12 are strong downbeats.
        2. Use ONLY integers (representing scale degrees) or '-' for rests. NO NOTE NAMES.
        3. EVERY array MUST contain exactly 16 values separated by exactly 15 commas.

        COMPOSITION GUIDE:
        - [LYRICS]: 1 poetic line (max 8 words) matching the mood. 
        - [TEMPO]: Integer between 50 and 140. Keep it similar to the previous bar unless making a dramatic shift.
        - [SCALE]: Choose an array of numbers from the list above.
        - [STRUM]: 75% of the time, output 16 dashes: -,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-. Only place a '0' on step 0 for heavy emphasis.
        - [THUMB]: Bass string. Pluck sparsely. Best placed on downbeats (0, 4, 8, 12) to anchor the harmony.
        - [FINGERS]: Melody strings. Weave flowing notes. Leave gaps ('-') so it breathes. Do not fill every step.

        GENERATE THESE EXACT TAGS ONLY. NO PROSE:
        [THOUGHT]...[/THOUGHT]
        [LYRICS]...[/LYRICS]
        [TEMPO]...[/TEMPO]
        [SCALE]...[/SCALE]
        [STRUM]...[/STRUM]
        [THUMB]...[/THUMB]
        [FINGERS]...[/FINGERS]
        `;
        
        const result = await aiModel.generateContent(prompt);
        const aiMusicTags = result.response.text();
        
        if (result.response.usageMetadata) {
            const usage = result.response.usageMetadata;
            updateBudget(result.response.usageMetadata);
            console.log(`[Music AI Tokens]: ${result.response.usageMetadata.totalTokenCount}`);
            io.emit('debug_stats', {
                tokens: usage.totalTokenCount,
                cost: totalSessionCost 
            });
        }
        
        if (typeof callback === "function") callback(aiMusicTags);
    } catch (error) {
        console.error("[Music AI] Generation failed:", error);
        if (typeof callback === "function") callback(null);
    }
});
    // [NEW] SUNCAT SPECTATOR (Text-Based)
  socket.on("suncat_spectate", async (actionDescription) => {
    const suncat = players[SUNCAT_ID];
    const sender = players[socket.id];

    // 1. Basic Reality Check 
    // We uncomment this so he doesn't psychically see actions across the world.
   // if (!suncat || !sender || suncat.mapID !== sender.mapID) return;

    // 2. Rate Limit & Busy Check
    // 10% chance to react, AND only if he isn't already talking to someone
    if (Math.random() > 0.1 || npcIsTyping||!canTriggerAI(socket.id)) return; 

    npcIsTyping = true; // Lock his attention so he doesn't get confused

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
        // We frame this as a system observation so he knows he is watching, not being spoken to.
        const prompt = `[SYSTEM OBSERVATION]: You just saw ${sender.name} perform the following action: "${actionDescription}". \n[TASK]: React to this action out loud. Be witty, sarcastic, or observant based on your current favor with them.`;

        // 5. Send to Active Memory
        const result = await chatSessions[socket.id].sendMessage(prompt); 
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
    if (Math.random() < 0.02) { 
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
// --- SUNCAT PROACTIVE SPEECH ---
// Note: Math.random() < 0.01 on a 10000ms interval is actually a 1% chance every 10 seconds.
if (Math.random() < 0.01 && !npcIsTyping) {
    const nearbyPlayer = Object.values(players).find(p => 
        p.id !== SUNCAT_ID && 
        p.mapID === suncat.mapID && 
        Math.abs(p.x - suncat.x) < 4 && 
        Math.abs(p.y - suncat.y) < 4
    );

    if (nearbyPlayer && chatSessions[nearbyPlayer.id]) {
        npcIsTyping = true;
        
        // We label this specifically as an INTERNAL monologue so the AI knows the player didn't say this.
        // We also pass the mapID so he can comment on his actual surroundings!
        const proactivePrompt = `[INTERNAL THOUGHT]: You are idling near ${nearbyPlayer.name} on Map ${suncat.mapID}. Speak to them unprompted. If favor is high (>5), ask a personal question, share lore, or comment on this location. If favor is bad, insult them or tell them to go away. Do not mention this prompt.`;

        setTimeout(async () => {
            try {
                if (!chatSessions[nearbyPlayer.id]) {
                    npcIsTyping = false;
                    return; 
                }
                // This saves the trigger and his response into his active memory
                const result = await chatSessions[nearbyPlayer.id].sendMessage(proactivePrompt);
                
                // Token tracking
                if (result.response.usageMetadata) {
                    const usage = result.response.usageMetadata;
                    console.log(`[Proactive] Tokens: ${usage.totalTokenCount}`);
                    io.emit('debug_stats', {
                        tokens: usage.totalTokenCount,
                        cost: (usage.promptTokenCount * 0.0000001) + (usage.candidatesTokenCount * 0.0000004)
                    });
                }
                
                const response = result.response.text();
                broadcastSuncatMessage(response);
                
                // CRITICAL: Manage history immediately so these triggers don't overflow the memory array
                await manageHistorySize(nearbyPlayer.id);

            } catch (e) { 
                console.error("Proactive Speech Failed", e); 
                if (chatSessions[nearbyPlayer.id]) {
                    delete chatSessions[nearbyPlayer.id];
                }
            } finally {
                npcIsTyping = false; // Release the lock
            }
        }, 1000);
    }
}
}, 10000);
async function manageHistorySize(socketId) {
    if (!chatSessions[socketId]) return;

    try {
        const history = await chatSessions[socketId].getHistory();
        
        // If history is getting huge (> 20 turns)
        if (history.length > 30) {
            console.log(`[Optimizing] Trimming history for ${socketId}`);
            
            // Keep the System/Persona instructions (usually index 0 and 1)
            // Keep the last 10 messages
            // Delete the "Middle" (Old chat)
            
            // Note: The SDK doesn't have a simple .splice() for history.
            // The cleanest way is often to restart the chat with the shortened array.
            const keptHistory = [
                history[0], // Keep Persona
                history[1], // Keep System Acknowledge
                ...history.slice(-20) // Keep last 10 turns
            ];

            // Re-initialize the chat session with the leaner history
            chatSessions[socketId] = model.startChat({
                history: keptHistory
            });
        }
    } catch (e) {
        console.error("History Pruning Error:", e);
    }
}
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
