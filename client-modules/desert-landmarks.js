const BMDesertLandmarks=(()=>{
 let serial=887000;
 const surfaces={};
 function floor(id,x,y,w,h,a,b){const q=surfaces[id]??=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)q.push({x:x+i,y:y+j,w:1,h:1,color:(i+j)%2?a:b});}
 function slab(m,x,y,bottom,top,tile){m.slabs??=[];if(top>bottom+.12)m.slabs.push({x,y,bottom,top,tile});}
 function decor(m,x,y,sprite,name,z=0){m.npcs.push({index:serial++,x,y,sprite,name,role:'decoration',state:'stationary',alignment:'friendly',isCinematic:true,companionEligible:false,hideMinimap:true,nonBlocking:true,groundZ:z,onSpawn(n){Object.assign(n,{hideMinimap:true,nonBlocking:true,groundZ:z,fixedWorldAngle:0});BMClassArt.resource(n,sprite);}});}
 function torch(m,x,y){decor(m,x,y,1166,'Lamp');m.npcs.push({index:serial++,x,y,sprite:-205,role:'decoration',state:'stationary',alignment:'friendly',isCinematic:true,hideMinimap:true,nonBlocking:true,onSpawn(n){Object.assign(n,{hideMinimap:true,nonBlocking:true,groundZ:0,_sectHover:.62});}});}
 function person(m,x,y,sprite,name,text,stock){const close=[['close_dialogue',null]];m.npcs.push({index:serial++,x,y,sprite,name,role:'dialogue',state:'stationary',alignment:'friendly',companionEligible:false,customDialogue:text,options:stock?['Shop','Leave']:null,yesActions:stock?[['open_shop',stock]]:close,noActions:close,endActions:close,onSpawn(n){n.serviceStock=stock;n.nonBlocking=false;}});}
 function house(m,id,x,y,w,h,door,style){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){m.maze[j][i]=0;const edge=j===y||j===y+h-1||i===x||i===x+w-1,entry=j===y+h-1&&Math.abs(i-door)<=0,window=edge&&!entry&&((i===x||i===x+w-1)&&j===y+2||j===y&&i===x+2);if(edge&&!entry){if(window){slab(m,i,j,0,.85,1);slab(m,i,j,1.7,2.9,1);}else slab(m,i,j,0,2.9,1);}slab(m,i,j,2.9,3.06,15);}
  floor(id,x+1,y+1,w-2,h-2,style[0],style[1]);floor(id,door,y+h-1,1,2,style[0],style[1]);return {x,y,w,h,door};}
 function desert(){const id=4,m=MAP_DB[id];m.slabs??=[];
  // Replace the old port's disconnected walls; preserve its shore and ship.
  for(let y=70;y<=97;y++)for(let x=19;x<=38;x++)if(m.maze[y][x]===1)m.maze[y][x]=0;
  const sailor=house(m,id,29,71,7,8,32,['#80634b','#886b51']);
  const market=house(m,id,27,82,10,7,31,['#a18360','#967957']);
  const inn=house(m,id,20,91,11,7,25,['#785a43','#826449']);
  // A worn dockside path uses irregular paving patches rather than a broad stripe.
  for(let y=78;y<91;y++)for(let x=25;x<=28;x++)if((x+y)%4!==0)(surfaces[id]??=[]).push({x:x+.08,y:y+.07,w:.72,h:.79,color:(x+y)%2?'#b99c70':'#c2a57a'});
  person(m,32.5,74.5,252,'Sailor',['The ship carries travellers to Tintagel. Ask at the gangway when you are ready.','Rest here before crossing the dunes. The red pyramid stands in the southeast.']);
  person(m,34.5,85.5,41,'Merchant',['Water, supplies, and cards for the desert road.'],[15,16,25,26,27,50,64]);
  person(m,28.5,93.5,297,'Innkeeper',['Come in out of the heat. We keep the lamps burning for returning travellers.']);
  decor(m,30.45,72.5,1170,'Bed');decor(m,34.5,72.5,1169,'Sea chest');decor(m,34.5,76.5,1163,'Charts',.28);slab(m,34,76,0,.28,15);decor(m,30.5,76.5,1172,'Water barrel');
  for(let y=84;y<=86;y++)slab(m,33,y,0,.28,15);decor(m,33.5,84.5,1163,'Ledger',.28);decor(m,28.5,83.5,1165,'Shelf');decor(m,35.5,83.5,1169,'Card chest');decor(m,28.5,87.5,1171,'Crates');
  for(const [x,y]of [[22,93],[26,95]])slab(m,x,y,0,.28,15);decor(m,21.5,92.5,1170,'Bed');decor(m,29.5,96.5,1172,'Water barrel');decor(m,22.5,93.5,1167,'Jug',.28);torch(m,29.5,92.5);torch(m,28.5,83.5);torch(m,30.5,72.5);
  m.portBuildings={sailor,market,inn};
  // Triangular footprint with rising red stone terraces and a clear front gate.
  for(let y=59;y<=79;y++)for(let x=63;x<=91;x++)if(m.maze[y][x]===5)m.maze[y][x]=0;
  for(let y=60;y<=78;y++)for(let x=63;x<=91;x++){const side=.72*(y-60)-Math.abs(x-77);if(side<0)continue;const inset=Math.min((78-y)/6,(y-60)/12,side/8.64),top=.65+Math.max(0,Math.floor(inset*6))*1.1;m.maze[y][x]=0;
   if(Math.abs(x-77)<=1&&y>=75)slab(m,x,y,2.2,Math.max(2.4,top),5);else slab(m,x,y,0,top,5);}
  const entry=m.npcs.find(n=>n.index===1&&n.role==='portal');Object.assign(entry,{x:77.5,y:77.5});entry.deck=[8.5,23.5,31,0];
  const guards={6:[74.5,80.5],7:[80.5,80.5],8:[75.5,83.5],9:[79.5,83.5],10:[84.5,81.5],11:[70.5,81.5],910000:[63.5,75.5],910001:[89.5,79.5],910002:[64.5,70.5]};for(const n of m.npcs)if(guards[n.index])[n.x,n.y]=guards[n.index];
  floor(id,76,78,3,4,'#ac7353','#b5805d');torch(m,75.5,79.5);torch(m,79.5,79.5);
  m.landmark={shape:'triangular-pyramid',center:[77,72],entrance:[77.5,77.5]};
 }
 function sapphire(){const m=MAP_DB[6];m.slabs??=[];for(let y=22;y<=31;y++)for(let x=42;x<=50;x++)if(m.maze[y][x]===25)m.maze[y][x]=0;for(let y=7;y<=22;y++)for(let x=39;x<=53;x++){if(m.maze[y][x]===9)m.maze[y][x]=0;const distance=Math.abs(x-46)+Math.abs(y-14);if(distance>7)continue;m.maze[y][x]=0;const top=.7+Math.floor((7-distance)/1.2)*1.25;if(x===46&&y>=17)slab(m,x,y,2.2,Math.max(2.4,top),9);else slab(m,x,y,0,top,9);}
  floor(6,46,19,1,5,'#688aab','#7e9fba');m.landmark={shape:'diamond-pyramid',center:[46,14],entrance:[46.5,19.5]};
 }
 function interior(){const m=MAP_DB[31];m.name='Red Pyramid';m.skyColor='#20171d';m.floorColor='#796153';m.slabs=[];m.maze=Array.from({length:25},()=>Array(17).fill(5));const carve=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)m.maze[j][i]=0;};
  carve(3,1,11,5);carve(6,5,5,19);carve(1,8,4,8);carve(12,8,4,8);carve(1,12,15,3);carve(1,18,5,4);carve(11,18,5,4);carve(4,19,9,2);
  for(let y=0;y<25;y++)for(let x=0;x<17;x++){if(m.maze[y][x]===5)slab(m,x,y,0,4.8,5);else slab(m,x,y,y<=5?4.6:3.5,y<=5?4.8:3.7,5);}
  floor(31,0,0,17,25,'#796355','#856c59');floor(31,7,5,3,19,'#9a7657','#a4805f');floor(31,4,1,9,4,'#815256','#915c5e');
  for(const n of m.npcs){if(n.index===2&&n.role==='portal')n.deck=[77.5,80.5,4,2];if(n.sprite===-27&&n.index===9){n.x=14.5;n.y=9.5;}if(n.sprite===-27&&n.index===10){n.x=2.5;n.y=9.5;}}
  for(const x of [1.4,3.6])for(const y of [8.5,10.5])decor(m,x,y,1165,'Bookshelf');decor(m,2.5,11.5,1163,'Book');
  decor(m,15.5,10.5,1168,'Weapon rack');decor(m,12.5,8.5,1169,'Chest');decor(m,15.5,14.5,1171,'Crates');
  for(const x of [1.5,3.5])decor(m,x,18.5,1170,'Bed');for(const y of [19,20])slab(m,13,y,0,.28,15);decor(m,13.5,19.5,1167,'Jug',.28);decor(m,15.5,21.5,1172,'Barrel');
  for(const [x,y]of [[5.5,2.5],[11.5,2.5],[6.5,7.5],[10.5,7.5],[6.5,16.5],[10.5,16.5],[7.5,22.5],[9.5,22.5]])torch(m,x,y);
  // Side plinths frame the Queen while leaving her and the Djinn reachable.
  for(const x of [4,12])slab(m,x,2,0,.45,15);m.landmark={shape:'pyramid-interior',exit:[8.5,23.5]};
 }
 desert();sapphire();interior();MAP_DB[31].torchPools=Array.from({length:25},(_,y)=>Array.from({length:17},(_,x)=>Math.min(.8,MAP_DB[31].npcs.filter(n=>n.sprite===-205).reduce((sum,n)=>sum+Math.max(0,1-Math.hypot(x+.5-n.x,y+.5-n.y)/5)*.55,0))));for(const [id,q]of Object.entries(surfaces))BMGuildDecor.addSurface(Number(id),q);
 // Color overrides are scoped to these maps and restored on every transition.
 let previous=null;const load=Explore.prototype.loadMap;Explore.prototype.loadMap=function(id,...args){this._landmarkLight=0;this._landmarkStone=false;if(previous){Object.assign(this.wallColors,previous.wall);Object.assign(this.parsedWallColors,previous.parsed);previous=null;}const result=load.call(this,id,...args);if([4,6,31].includes(Number(id))){this._landmarkLight=Number(id)===31?.4:.65;this._landmarkStone=Number(id)!==6;if(Number(id)===31)this._sectLight=MAP_DB[31].torchPools;previous={wall:{},parsed:{}};for(const [tile,color]of Object.entries(Number(id)===6?{9:'#255b94'}:Number(id)===31?{5:'#593d40'}:{5:'#9a4838',1:'#89674f'})){previous.wall[tile]=this.wallColors[tile];previous.parsed[tile]=this.parsedWallColors[tile];this.wallColors[tile]=color;this.parsedWallColors[tile]={r:parseInt(color.slice(1,3),16),g:parseInt(color.slice(3,5),16),b:parseInt(color.slice(5,7),16)};}}return result;};
 return {surfaces};
})();globalThis.BMDesertLandmarks=BMDesertLandmarks;