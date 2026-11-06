const BMDebugProgression=(()=>{
 function learnable(id){
  if(!Number.isFinite(id)||id<0||!BMHotbar.playable(id)||BMEquipment.isEquip(id))return false;
  const card=CARD_MANIFEST_DB[id],spell=SPELL_REGISTRY[id];
  return card?.type==='spell'||card?.type==='monster'||spell&& !String(spell.type).startsWith('item_')||Object.values(BM_TRAINER_CATALOGS).some(list=>list.some(lesson=>lesson.id===id));
 }
 function say(text){chatLog.push('[SYSTEM]: '+text);if(chatLog.length>100)chatLog.shift();}
 function normalize(text){return String(text).normalize('NFKC').trim().replace(/^\.hack(?:\s*\/\/\s*|\s+)(?=(?:level(?:up)?|master|learn)\b)/i,'.hack//');}
 function command(text){
  const match=/^\.hack\/\/(levelup|level|master|learn)(?:\s+(.*))?$/i.exec(normalize(text));if(!match)return false;
  const action=match[1].toLowerCase(),arg=(match[2]||'').trim();
  if(action==='master'){
   if(arg){say('Use .hack//master to master all crafting skills.');return true;}
   const state=BMCraftMastery.state();for(const id of Object.keys(BMCraftMastery.definitions))state.disciplines[id].xp=BMCraftMastery.target(id)[3];
   Dungeon.updateSkills();Dungeon.requestSave();BMShell.invalidate();say('All crafting skills: Master. Crafting bonuses updated; book discoveries are unchanged.');return true;
  }
  if(action==='level'&&arg.toLowerCase()!=='up'){
   if(!/^\d+$/.test(arg)||!Number.isSafeInteger(Number(arg))||Number(arg)>10000){say('Use .hack//level 20 to reset level training, or .hack//level up to gain one level.');return true;}
   const level=Number(arg);Dungeon.stat=Dungeon.stat.map(()=>[1,4,0]);Dungeon.statProgress=[0,0,0,0];Dungeon.level=level;Dungeon.xp=0;Dungeon.xpNeeded=Math.floor(100*Math.pow(level+1,1.8));Dungeon.power=100+level*13;
   Dungeon.statPoints=level*(String(Dungeon.playerClass).toLowerCase()==='battle-mage'?9:4);Dungeon.syncLivingPlayerCards?.();Dungeon.updateSkills();Dungeon.requestSave();BMShell.invalidate();
   say('Level '+level+' · base dice reset · '+Dungeon.statPoints+' points available. Craft attainment and separate bonuses are retained.');return true;
  }
  if(action==='levelup'||action==='level'&&arg.toLowerCase()==='up'){
   if(arg&&!(action==='level'&&arg.toLowerCase()==='up')){say('Use .hack//levelup to gain one level.');return true;}
   const before=Dungeon.level||0,points=Dungeon.statPoints||0,needed=Math.floor(100*Math.pow(before+1,1.8));
   if(!Number.isSafeInteger(needed)||!Number.isFinite(Dungeon.xp||0)){say('Unable to advance this character level.');return true;}
   Dungeon.xp=(Dungeon.xp||0)+needed;Dungeon.levelUpPlayer();Dungeon.updateSkills();
   BMActivity.record('level_up','Testing command: advanced to level '+Dungeon.level+'.',{level:Dungeon.level,testing:true});
   Dungeon.requestSave();BMShell.invalidate();
   say('Level '+Dungeon.level+' · +'+((Dungeon.statPoints||0)-points)+' stat points. Open Player to assign them.');return true;
  }
  const all=!arg||arg.toLowerCase()==='all';
  if(!all&&!/^\d+(?:\.\d+)?$/.test(arg)){say('Use .hack//learn for all spells and summons, or .hack//learn ID (Strength: 8).');return true;}
  const ids=all?[...new Set([...Object.keys(SPELL_REGISTRY),...Object.keys(CARD_MANIFEST_DB)].map(Number))].filter(learnable).sort((a,b)=>a-b):[Number(arg)];
  if(!all&&!learnable(ids[0])){say('No learnable spell or summon with ID '+arg+'. Strength is 8.');return true;}
  Dungeon.spellsLearned??={};let added=0;
  for(const id of ids){if(!Dungeon.spellsLearned[id]){Dungeon.spellsLearned[id]=true;added++;}}
  // A specifically requested spell should immediately be available for testing.
  if(!all&&Dungeon.memory?.disabledSkills)delete Dungeon.memory.disabledSkills[ids[0]];
  Dungeon.updateSkills();Dungeon.requestSave();BMShell.invalidate();
  const name=all?added+' new spells and summons':BMLearning.name(ids[0])+' (ID '+ids[0]+')';
  say((all||added?'Learned ':'Already learned ')+name+'. Open Player → Spells for the 3D preview.');
  return true;
 }
 return {command,learnable,normalize};
})();