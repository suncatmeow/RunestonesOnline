const BMStronghold=(()=>{
 const LAB=[884201,884202,884203,884204,884205,884206],CHEST=884220,REWARDS=[270,315];
 const CHESTS=[{"id":884220,"x":35.5,"y":4.5,"area":"Laboratory","cards":[270,315],"silver":0,"items":[],"requires":[884201,884202,884203,884204,884205,884206]},{"id":884230,"x":34.5,"y":24.5,"area":"Barracks","cards":[],"silver":12,"items":[],"requires":[]},{"id":884231,"x":26.5,"y":34.5,"area":"Officer room","cards":[],"silver":20,"items":[],"requires":[]},{"id":884232,"x":8.5,"y":33.5,"area":"Armory","cards":[50],"silver":6,"items":[],"requires":[]},{"id":884233,"x":34.5,"y":34.5,"area":"Dining room","cards":[],"silver":0,"items":[{"key":"dish:mushroom_stew","name":"Mushroom Stew","kind":"consumable","effect":"ward","count":2}],"requires":[]}];
 let claiming=false;
 const labRows=[
  [884201,34.5,5.5,330,'Scientist',14,true,[26,12,28]],
  [884202,31.5,10.5,56,'Imp',10,false,[26]],
  [884203,36.5,10.5,56,'Imp',10,false,[26]],
  [884204,31.5,6.5,318,'Ghoul',11,false,[50]],
  [884205,36.5,7.5,282,'Beast-Man',11,false,[50]],
  [884206,34.5,8.5,270,'Questing Beast',13,true,[50,26]]
 ];
 const torches=[[19.25,35.5],[21.75,35.5],[19.25,30],[21.75,25],[19.25,19],[21.75,13],
  [5.25,20],[15.7,26.5],[24.25,20],[34.7,26.5],[13.25,6],[27.7,6],[17,11.7],[24,11.7],[31.25,13],[36.7,4.5],[5.25,31.5],[13.7,36.5],[24.7,31.5],[28.7,36.5],[31.7,31.5],[36.7,36.5]];
 function prepare(m,d){
  for(const [x,y,w,h]of [[4,30,11,8],[8,28,3,3],[24,30,6,8],[25,28,3,3],[31,30,7,8],[32,28,3,3]])for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)m.maze[yy][xx]=0;
  for(let y=3;y<16;y++)for(let x=30;x<38;x++)m.maze[y][x]=0;
  for(let y=15;y<19;y++)for(let x=32;x<35;x++)m.maze[y][x]=0;
  m.maze=m.maze.map(row=>row.map(v=>v===1?25:v));
  Object.assign(m,{name:'Sect Stronghold',skyColor:'#111016',floorColor:'#292a30',biome:'None',sectInterior:true});
  const quads=[],light=Array.from({length:40},()=>Array(40).fill(0));
  for(let y=0;y<40;y++)for(let x=0;x<40;x++){
   let glow=0;for(const [tx,ty]of torches)glow=Math.max(glow,Math.max(0,1-Math.hypot(x+.5-tx,y+.5-ty)/4.5));light[y][x]=glow;
   if(m.maze[y][x]!==0)continue;
   const v=35+((x*17+y*13)%3)*4;quads.push({x,y,w:.98,h:.98,color:`rgb(${Math.round(v+glow*47)},${Math.round(v+glow*25)},${Math.round(v+5+glow*5)})`});
   m.slabs.push({x,y,bottom:2.2,top:2.35,tile:25});
  }
  m.sectLight=light;m.torches=torches;
  // A plain reading-room runner; no religious or occult symbols.
  quads.push({x:18.5,y:4,w:4,h:8,color:'#433b40'});
  m.sectFloor=quads;
  let serial=884300;
  function decor(x,y,sprite,name,z=0,scale){m.npcs.push({index:serial++,x,y,sprite,name,role:'decoration',alignment:'friendly',state:'stationary',isCinematic:true,companionEligible:false,groundZ:z,hideMinimap:true,nonBlocking:true,onSpawn(n){Object.assign(n,{hideMinimap:true,nonBlocking:true,groundZ:sprite===-205?0:z,_sectHover:sprite===-205?z:0,fixedWorldAngle:Math.PI/2});if(sprite>=1165){BMClassArt.resource(n,sprite);}if(scale)n._sectScale=scale;}});}
  for(const [x,y]of [[6.5,17.25],[9.5,17.25],[12.5,17.25],[5.25,27.5],[14.5,27.5],[14.5,3.25],[18.5,3.25],[22.5,3.25],[26.5,3.25]])decor(x,y,1165,'Bookcase');
  for(const [x,y]of torches){decor(x,y,1166,'Torch stand');decor(x,y,-205,'Torch',.3,.34);}
  // Side workbenches leave a wide central route through the laboratory.
  for(const [x,y]of [[30,4],[31,4],[36,4],[37,4],[30,11],[37,11]])m.slabs.push({x,y,bottom:0,top:.4,tile:15});
  for(const [x,y]of [[30.5,4.5],[37.5,4.5],[30.5,11.5],[37.5,11.5]])decor(x,y,1167,'Specimen jar',.4);
  for(const [index,x,y,sprite,name,level,isBoss,spells]of labRows)m.npcs.push({index,x,y,sprite,name,level,isBoss,deck:spells,role:'battle',alignment:'foe',state:'stationary',onSpawn(n){Object.assign(n,{_guildStronghold:true,_sectLab:true,isRanged:[330,56].includes(sprite),innateSpells:spells.slice(),respawnTime:Infinity});if(BMGuildStory.state(d).visit?.defeated?.includes(index))Object.assign(n,{isDead:true,visible:false});}});
  const books=[
   [884221,10.5,20.5,'Field Notes',['Wisps keep a steady charge when the lamps are shielded. Shades retreat from direct light. Imps can tend the apparatus, but must be kept away from the written records.','The Ghouls show movement without recovery. The Beast-Man survived the binding. The Questing Beast refuses every command. The Scientist has requested stronger restraints.']],
   [884222,25.5,19.5,'Shipping Ledger',['Books, glassware and dark cards arrived through the southeast port. Payments were divided among several ordinary shops.','The guild was only one destination. Other consignments went toward the mountain roads, the desert crossings and the western border. Each shipment carries a different seal.']],
   [884223,33.5,5.5,'Sealed Instructions',['Delay the guild. Interrupt the couriers. Empty the granaries before winter. Let each failure appear to have a different cause.','The one directing this stronghold is responsible for only a single part. No commander is to receive the full list of targets. When the rulers turn to one crisis, begin the next.']]
  ];
  for(const [index,x,y,name,lines]of books){m.slabs.push({x:Math.floor(x),y:Math.floor(y),bottom:0,top:.3,tile:15});m.npcs.push({index,x,y,sprite:1163,name,role:'dialogue',alignment:'friendly',state:'stationary',groundZ:.3,isCinematic:true,companionEligible:false,customDialogue:lines,onSpawn(n){n._guildProp='book:'+index;BMClassArt.resource(n,1163);}});}
  for(const reward of CHESTS)m.npcs.push({index:reward.id,x:reward.x,y:reward.y,sprite:1169,name:'Chest',role:'dialogue',alignment:'friendly',state:'stationary',isCinematic:true,companionEligible:false,onSpawn(n){n._guildProp='stronghold_chest';BMClassArt.resource(n,1169);}});
  // Bunks, officers' beds, low mess tables and weapon racks establish daily life.
  for(const [x,y]of [[24.5,23.5],[24.5,26.5],[28.5,24.5],[28.5,27.5],[25.5,36.5],[28.5,36.5]])decor(x,y,1170,'Bed');
  for(const [x,y]of [[6.5,31.2],[9.5,31.2],[12.5,31.2]])decor(x,y,1168,'Weapon rack');
  for(const x of [33,34,35])for(const y of [32,36])m.slabs.push({x,y,bottom:0,top:.3,tile:15});
  for(const [x,y]of [[32.5,32.5],[36.5,32.5],[32.5,36.5],[36.5,36.5]])m.slabs.push({x:Math.floor(x),y:Math.floor(y),bottom:0,top:.18,tile:15});
  for(const [index,x,y,sprite,name,level]of [[884240,9.5,35.5,252,'Sect guard',9],[884241,27.5,32.5,261,'Inner disciple',12],[884242,34.5,36.5,252,'Sect member',8]])m.npcs.push({index,x,y,sprite,name,level,deck:sprite===261?[26,12]:[50],role:'battle',alignment:'foe',state:'stationary',onSpawn(n){Object.assign(n,{_guildStronghold:true,isRanged:sprite===261,innateSpells:sprite===261?[26,12]:[50],respawnTime:Infinity});if(BMGuildStory.state(d).visit?.defeated?.includes(index))Object.assign(n,{isDead:true,visible:false});}});
  m.npcs.push({index:884224,x:27.5,y:35.5,sprite:1163,name:'Duty Roster',role:'dialogue',alignment:'friendly',state:'stationary',isCinematic:true,companionEligible:false,customDialogue:['Outer members keep watch, carry supplies and train in the yard. Inner disciples study the ward records and direct the experiments. Officers answer to the Sect Elder.','Food allotments have been cut again. Most of the main force is away. The residents left here are ordered to keep the workshops running and delay anyone who reaches the archive.'],onSpawn(n){n._guildProp='book:884224';BMClassArt.resource(n,1163);}});

 }
 function configure(d){
  if(d._sectDefaults){for(const [key,value]of Object.entries(d._sectDefaults))d[key]=value;delete d._sectDefaults;}
  const m=MAP_DB[d.mapID];d._sectLight=null;if(!m?.sectInterior)return;
  d._sectDefaults={wallColors:d.wallColors,parsedWallColors:d.parsedWallColors,tileHeights:d.tileHeights,noiseLevels:d.noiseLevels};
  d.wallColors={...d.wallColors,25:'#41424c'};d.parsedWallColors={...d.parsedWallColors,25:d.parseColor('#41424c')};d.tileHeights={...d.tileHeights,25:2.2};d.noiseLevels={...d.noiseLevels,25:2};
  d.skyColor=m.skyColor;d.floorColor=m.floorColor;d.biome='None';d._sectLight=m.sectLight;BMGuildDecor.addSurface(d.mapID,m.sectFloor);
 }
 function chest(n){
  if(claiming)return true;const reward=CHESTS.find(c=>c.id===n.index);if(!reward)return false;
  const c=BMGuildStory.chapter();c.chests??={};if(c.labChestClaimed)c.chests[CHEST]=true;
  const say=text=>{n.customDialogue=[text];n.options=null;n.endActions=[['close_dialogue',null]];n.startDialogue(Dungeon);};
  if(c.chests[n.index]){say('The chest is empty.');return true;}
  if(!reward.requires.every(id=>BMGuildStory.state().visit?.defeated?.includes(id))){say('The Scientist’s seal holds the chest shut. Defeat the laboratory experiments and their keepers first.');return true;}
  const mark=()=>{c.chests[n.index]=true;if(n.index===CHEST)c.labChestClaimed=true;Dungeon.requestSave();};
  if(BMGuildStory.sharedVisit()){
   const map=Dungeon.mapID;claiming=true;BMOnline.chapter({action:'stronghold_chest',index:n.index},r=>{claiming=false;if(!r?.ok){if(Dungeon.mapID===map)say(r?.error||'The chest could not be opened. Try again.');return;}mark();if(Dungeon.mapID===map)say('You open the chest. Its contents lie beside it.');});
  }else{
   const id=(n.index===CHEST?'sect-laboratory:':'sect-chest:'+n.index+':')+BMGuildStory.state().visit.map;
   BMGroundLoot.drop(Dungeon,n,{id,cards:reward.cards,silver:reward.silver,items:reward.items});mark();say(n.index===CHEST?'The seal breaks. A Questing Beast card and a Flying Sword card lie beside the chest.':'You open the chest. Its contents lie beside it.');
  }
  return true;
 }

 const load=Explore.prototype.loadMap;Explore.prototype.loadMap=function(...a){const out=load.apply(this,a);configure(this);return out;};
 return {prepare,configure,chest,LAB,CHEST,CHESTS,REWARDS,labRows};
})();globalThis.BMStronghold=BMStronghold;