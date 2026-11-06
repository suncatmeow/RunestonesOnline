const BMPort=(()=>{
 const m=MAP_DB[0],revealed=d=>!!d.memory.guildStory?.chapter?.clues?.length||!!d.memory.guildStory?.chapter?.complete;
 const NPCS=[
  [886001,86.5,79.5,2,'Card merchant',['Welcome, traveller. Dark cards are hard to find inland. Have a look; a card is only a tool.'],['So you found the storehouse. I sell cards. Who buys them is their own affair.'],[5,56,57,82,86,12,26,92]],
  [886002,93.5,89.5,252,'Storekeeper',['Keep to the road after sunset. Our north storeroom is private. The guild can put you up if you need a bed.'],['Those marching orders were never meant to leave the storeroom. You had better speak to your guild.']],
  [886003,89.5,83.5,312,'Port resident',['The ships bring good business. We look after one another here.'],['Sect Elder promised the port would be spared. We were told the guild would never discover the passage.']],
  [886004,93.5,81.5,258,'Dock worker',['Another guild traveller? The sailors will know which ships are ready.'],['I carried their crates. I did not ask what was inside. The seal on those orders is ours.']],
  [886005,77.5,82.5,252,'Sailor',['Strange things happen on the roads at night. Stay near the port until dawn—or make for the guild before dark.','We carry plenty of guild travellers to other lands. Their hall is the safest place nearby.'],['The guild was right about this place. We will keep the gangway clear for anyone who needs shelter.']]
 ];
 function install(){
  for(const [id,x,y,sprite,name,before,after,stock]of NPCS){m.npcs=m.npcs.filter(n=>n.index!==id);const close=[['close_dialogue',null]];m.npcs.push({index:id,x,y,sprite,name,role:'dialogue',state:'stationary',alignment:'friendly',companionEligible:false,dialogueFactory:d=>({text:revealed(d)?after:before,options:stock?['Shop','Leave']:null,yesActions:stock?[['open_shop',stock]]:close,noActions:close,endActions:close}),onSpawn(n){n._portResident=true;n.serviceStock=stock;}});}
  // Side counters leave the shop's two doors and the storehouse passage clear.
  m.slabs??=[];for(const [x,y]of [[85,80],[87,80],[92,86],[93,86],[78,85]])m.slabs.push({x,y,bottom:0,top:.25,tile:15});
  const floors=[...BMGuildBuilding.road];
  for(const [x,y,w,h,colors]of [[76,81,3,6,['#62503a','#6a553e']],[85,78,3,4,['#69533c','#725b43']],[92,86,6,4,['#55534b','#5e5b51']]]){
   for(let row=0;row<h;row++){floors.push({x,y:y+row,w,h:1,color:colors[row%2]});for(let col=0;col<w;col+=2)floors.push({x:x+col+(row%2)*.45,y:y+row,w:.025,h:1,color:'#352d23'});}
  }
  for(const [x,y,w,h]of [[75,84,1,1],[77,87,1,2],[86,77,1,1],[86,82,1,1],[90,88,2,1]])floors.push({x,y,w,h,color:'#65533c'});
  floors.push({x:77.1,y:83.2,w:1.1,h:2.1,color:'#494b50'});BMGuildDecor.addSurface(0,floors);
  let serial=886100;
  const decor=(x,y,sprite,name,z=0)=>m.npcs.push({index:serial++,x,y,sprite,name,role:'decoration',state:'stationary',alignment:'friendly',isCinematic:true,companionEligible:false,hideMinimap:true,nonBlocking:true,groundZ:z,onSpawn(n){Object.assign(n,{hideMinimap:true,nonBlocking:true,groundZ:z,fixedWorldAngle:Math.PI/2});BMClassArt.resource(n,sprite);}});
  // Sailor's home faces the original ship; keep both exits clear.
  decor(76.45,81.8,1170,'Bed');decor(78.55,81.35,1169,'Sea chest');decor(78.5,85.5,1163,'Chart',.25);decor(76.45,86.45,1172,'Water barrel');
  // Card merchant's records and stock stay against the side walls.
  decor(85.35,78.5,1165,'Shelf');decor(87.5,80.5,1163,'Ledger',.25);decor(87.55,81.4,1169,'Card chest');
  // Stored cargo leaves the middle aisle and the sect doorway unobstructed.
  for(const [x,y]of [[92.5,86.5],[93.5,86.5]])decor(x,y,1171,'Crate',.25);
  decor(97.5,86.5,1172,'Barrel');decor(97.5,89.5,1171,'Crate');decor(92.5,89.5,1169,'Chest');
  m.portBuildings={sailor:{left:75,top:80,right:79,bottom:87},shop:{left:84,top:77,right:88,bottom:82},storehouse:{left:91,top:85,right:98,bottom:90}};
 }
 install();return {revealed,NPCS};
})();globalThis.BMPort=BMPort;