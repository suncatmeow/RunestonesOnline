const BMStairs=(()=>{
 const caches=new WeakMap();
 function catalog(d){const prior=caches.get(d);if(prior?.revision===d.layerRevision&&prior.maze===d.maze)return prior.cells;
  const cells=new Map(),w=d.maze[0].length;
  const tops=(x,y)=>(d.layerCells?.[y*w+x]||[]).map(s=>s.top);
  const add=(x,y,z,dx,dy,landing='')=>{const key=x+','+y,a=cells.get(key)||[];const prior=a.find(p=>Math.abs(p.z-z)<.02);if(!prior)a.push({z,dx,dy,landing});else if(landing)Object.assign(prior,{dx,dy,landing});cells.set(key,a);};
  for(const [key,slabs]of Object.entries(d.layerCells||{})){const x=Number(key)%w,y=Math.floor(Number(key)/w);
   for(const s of slabs)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])for(const z1 of tops(x+dx,y+dy)){
    const step=z1-s.top;if(step<.124||step>.501)continue;
    if(!tops(x+2*dx,y+2*dy).some(z=>Math.abs(z-z1-step)<.02))continue;
    for(let i=0;i<3;i++)add(x+i*dx,y+i*dy,s.top+i*step,dx,dy);
   }
  }
  const guild=MAP_DB[d.mapID]?.guildBuilding;
  if(guild){const a=guild.stairs,b=guild.landing,dx=Math.sign(b.x-a.x),dy=Math.sign(b.y-a.y);add(Math.floor(a.x),Math.floor(a.y),a.z,dx,dy,'UP');add(Math.floor(b.x),Math.floor(b.y),b.z,-dx,-dy,'DN');}
  caches.set(d,{revision:d.layerRevision,maze:d.maze,cells});return cells;
 }
 function marker(d,x,y){const a=catalog(d).get(x+','+y);return a?.filter(p=>Math.abs(p.z-(d.groundZ||0))<1.3).sort((a,b)=>Math.abs(a.z-(d.groundZ||0))-Math.abs(b.z-(d.groundZ||0)))[0];}
 function draw(d,c,x,y,px,py,w,h){const m=marker(d,x,y);if(!m)return;c.save();c.translate(px+w/2,py+h/2);c.scale(w/48,h/48);c.rotate(Math.atan2(m.dy,m.dx));
  c.fillStyle='#615644';c.fillRect(-24,-24,48,48);c.strokeStyle='#dfcba1';c.lineWidth=2;
  for(let i=-17;i<=17;i+=8){c.beginPath();c.moveTo(i,-16);c.lineTo(i,16);c.stroke();}
  c.strokeStyle='#fff0bc';c.lineWidth=3;c.beginPath();c.moveTo(-13,0);c.lineTo(16,0);c.lineTo(8,-7);c.moveTo(16,0);c.lineTo(8,7);c.stroke();
  c.restore();if(m.landing&&w>=18){c.save();c.font='bold '+Math.max(8,Math.min(12,w*.27))+'px system-ui';c.textAlign='center';c.fillStyle='#171a16';c.fillRect(px+w*.15,py+h*.63,w*.7,h*.34);c.fillStyle='#fff0bc';c.fillText(m.landing,px+w/2,py+h*.91);c.restore();}
 }
 return {catalog,marker,draw};
})();

const BMGuildDecor=(()=>{
 const floorQuads=[],surfaces=new Map(),surfaceTiles=new Map();
 function inside(points,x,y){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function addSurface(id,quads){surfaces.set(id,id===0?[...floorQuads,...quads]:quads);const cells=new Map();for(const q of quads)for(let y=Math.floor(q.y);y<q.y+q.h;y++)for(let x=Math.floor(q.x);x<q.x+q.w;x++)if(q.points?inside(q.points,x+.5,y+.5):x+.5>=q.x&&x+.5<q.x+q.w&&y+.5>=q.y&&y+.5<q.y+q.h)cells.set(x+','+y,q.color);surfaceTiles.set(id,cells);}
 // Fewer than 100 cached room quads, no extra solid slabs or per-pixel textures.
 for(let y=16;y<33;y++){floorQuads.push({x:46,y,w:15,h:1,color:y%2?'#735039':'#6a4732'});for(let x=46+(y%2)*2;x<61;x+=4)floorQuads.push({x,y,w:.025,h:1,color:'#392b23'});}
 for(const [x,y,w,h,color]of [[51.5,17,4,5,'#603839'],[51.65,17.15,3.7,4.7,'#a7804c'],[51.8,17.3,3.4,4.4,'#4b3435']])floorQuads.push({x,y,w,h,color});
 function indoor(d,x,y){return d.mapID===0&&x>=46&&x<61&&y>=16&&y<33;}
 function tile(d,c,x,y,px,py,w,h,id){const shade=surfaceTiles.get(d.mapID)?.get(x+','+y);if(shade&&id===0){c.fillStyle=shade;c.fillRect(px,py,w+.5,h+.5);}if(!indoor(d,x,y)||![0,15].includes(id))return;if(id===15){c.fillStyle='#906240';c.fillRect(px,py,w+.5,h+.5);c.strokeStyle='#493521';c.lineWidth=1.5;c.strokeRect(px+1,py+1,w-2,h-2);for(const offset of [.3,.65]){c.beginPath();c.moveTo(px,py+h*offset);c.lineTo(px+w,py+h*offset);c.stroke();}return;}c.fillStyle=y%2?'#735039':'#6a4732';c.fillRect(px,py,w+.5,h+.5);c.strokeStyle='#38291f';c.lineWidth=1;c.strokeRect(px,py,w,h);if(x>=52&&x<55&&y>=17&&y<22){c.fillStyle='#6e3f3d';c.fillRect(px+1,py+1,w-2,h-2);}}
 function floor(d,c,{viewX,viewY,viewW,viewH,camX,camY,dirX,dirY,planeX,planeY,horizon,wallScale}){
  const quads=surfaces.get(d.mapID)||(d.mapID===0?floorQuads:null);if(!quads)return;
  const det=planeX*dirY-dirX*planeY,inv=1/det,z=0;if(d.camZ<=z)return;
  const transform=(x,y)=>{const dx=x-camX,dy=y-camY;return [inv*(dirY*dx-dirX*dy),inv*(-planeY*dx+planeX*dy)];};
  c.save();c.beginPath();c.rect(viewX,viewY,viewW,viewH);c.clip();
  for(const q of quads){if(camX<q.x-32||camX>q.x+q.w+32||camY<q.y-32||camY>q.y+q.h+32)continue;let points=(q.points||[[q.x,q.y],[q.x+q.w,q.y],[q.x+q.w,q.y+q.h],[q.x,q.y+q.h]]).map(([x,y])=>transform(x,y));
   const clipped=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=a[1]>=.08,inb=b[1]>=.08;if(ina)clipped.push(a);if(ina!==inb){const t=(.08-a[1])/(b[1]-a[1]);clipped.push([a[0]+(b[0]-a[0])*t,.08]);}}
   if(clipped.length<3)continue;c.beginPath();clipped.forEach(([x,y],i)=>{const px=viewX+viewW/2*(1+x/y),py=viewY+horizon+wallScale*(d.camZ-z)/y;i?c.lineTo(px,py):c.moveTo(px,py);});c.closePath();c.fillStyle=q.color;c.fill();
  }c.restore();
 }
 return {floor,tile,indoor,addSurface,color:(id,x,y)=>surfaceTiles.get(id)?.get(x+','+y)};
})();
window.BMGuildDecor=BMGuildDecor;window.BMStairs=BMStairs;

const BMGuildBuilding=(()=>{
 const floor=2.125,roof=4,bounds={left:45,right:61,back:15,front:33};
 // A narrow, worn track bends around the ponds. Build its soft shoulders once.
 function track(knots){const points=[],quads=[];
  for(let i=0;i<knots.length-1;i++){const a=knots[Math.max(0,i-1)],b=knots[i],c=knots[i+1],d=knots[Math.min(knots.length-1,i+2)];
   for(let j=0;j<3;j++){const t=j/3;points.push([0,1].map(k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t)));}}
  points.push(knots.at(-1));const normals=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [-(b[1]-a[1])/len,(b[0]-a[0])/len];});
  for(const [outer,inner,color]of [[1,-1,'#344324'],[.79,-.79,'#4c5030'],[.56,-.56,'#665c3d']])for(let i=0;i<points.length-1;i++){
   const edge=(j,k)=>points[j].map((v,a)=>v+normals[j][a]*k*(.72+.07*Math.sin(j*1.9)));
   const p=[edge(i,outer),edge(i+1,outer),edge(i+1,inner),edge(i,inner)],xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),x=Math.min(...xs),y=Math.min(...ys);
   quads.push({x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,points:p,color});
  }return quads;
 }
 const road=track([[53.5,33],[53.5,37],[55,40.5],[61,41.7],[68,42.8],[76,41.5],[83,42],[88.8,43],[89.1,51],[88.7,60],[89.3,68],[89.5,76],[89.5,84],[89,88.5],[89,91.5]]);
 road.push(...track([[89,84],[85,83.8],[80.5,84.2],[77.5,84.5]]));
 const tavernLines=['Experts come here to hunt and discuss ideas.','I come for the cheap ale.','*burp*'];
 function resident(n){
  if(!n||['ally','escort','escort_combat'].includes(n.alignment)||String(n.alignment).startsWith('foe')||n.summonTag)return false;
  const type=Math.floor(Number(n.type??n.sprite));
  return n.index===2970||([297,298,299].includes(type)&&(n.role??n.interaction??'dialogue')==='dialogue'&&!n.service&&!n.objectiveKind&&!n.isTarget&&!BMDialogueFlow.scripted(n));
 }
 function reconcile(d){
  if(d.mapID!==0)return;
  const residents=d.npcs.filter(resident),ids=new Set([2970,...residents.map(n=>n.index)]);
  const records=d.memory.spawned_0||[];for(const n of records)if(resident(n))ids.add(n.index);
  // Saved/random copies must not override the authored regular on the next visit.
  d.memory.spawned_0=records.filter(n=>!resident(n));
  let regular=residents.find(n=>n.index===2970);
  d.npcs=d.npcs.filter(n=>!resident(n));
  if(!regular){const def=MAP_DB[0].npcs.find(n=>n.index===2970);regular=d.buildNPC(def,0);
   const death=d.memory['0_2970'];if(death?.permanent||death?.respawnAt>Date.now())Object.assign(regular,{isDead:true,visible:false,respawnTime:death.respawnAt});
  }
  Object.assign(regular,{companionEligible:false,customDialogue:tavernLines.slice(),dialogueFactory:null,options:null,yesActions:null,noActions:null,endActions:[],rewardCard:null});
  if(!regular.isDead)Object.assign(regular,{x:49.5,y:19.5,groundZ:0,homeX:49.5,homeY:19.5,state:'stationary',isSliding:false,isMoving:false,targetX:49.5,targetY:19.5,nextX:49.5,nextY:19.5});
  d.npcs.push(regular);
  // Free a companion slot accidentally claimed by the old generic meal menu;
  // retain its history and every other companion's record.
  const friends=d.memory.companions;if(friends?.slots)friends.slots=friends.slots.filter(key=>![...ids].some(id=>key.startsWith('0::'+id+':')));
 }
 function install(){const m=MAP_DB[0];if(!m||m.name!=='Moors'||m.guildBuilding)return;
  const slabs=[],add=(x,y,bottom,top,tile=1)=>slabs.push({x,y,bottom,top,tile});
  // Replace only the existing guild footprint; retain the surrounding Moors.
  for(let y=14;y<=34;y++)for(let x=44;x<=62;x++)m.maze[y][x]=0;
  // The original building extended one tile farther east; remove its orphan wall.
  for(let y=15;y<=34;y++)if(m.maze[y][63]===1)m.maze[y][63]=0;
  for(let y=15;y<=33;y++)for(let x=45;x<=61;x++){
   const edge=x===45||x===61||y===15||y===33,door=y===33&&x>=52&&x<=54;
   if(edge){
    if(door)add(x,y,2,roof);
    else if((x===45||x===61)&&[19,24,29].includes(y)){add(x,y,0,.65);add(x,y,1.5,2.5);add(x,y,2.95,roof);}
    else add(x,y,0,roof);
    continue;
   }
   const atrium=x>=51&&x<=55&&y>=23&&y<=27,stairs=x===46&&y>=17&&y<=25;
   if(!atrium&&!stairs)add(x,y,2,floor);
   add(x,y,roof-.125,roof);
  }
  // The same nine shallow steps now climb north along the west wall, behind Warrior.
  for(let y=25;y>=17;y--)add(46,y,0,(26-y)*floor/9);
  // Solid balustrades leave a clear, generous gallery around the open hall.
  for(let y=22;y<=28;y++)for(let x=50;x<=56;x++)if(x===50||x===56||y===22||y===28)add(x,y,floor,floor+.55);
  for(let y=17;y<=25;y++)add(47,y,floor,floor+.55);
  // Library cases along the upper back wall, away from the staircase.
  for(const x of [49,50,51,55,56,57])add(x,16,floor,floor+.65,3);
  // Keep the former low chair tiles as tables; remove the larger table slabs.
  for(const [x,y]of [[50,19],[49,21],[56,26],[57,26],[49,29],[50,29]])add(x,y,0,.25,15);
  for(let x=57;x<=59;x++)add(x,17,0,.25,15);
  // The upstairs library keeps its bookcases and clear reading space.
  m.slabs=[...(m.slabs||[]).filter(s=>s.x<44||s.x>62||s.y<14||s.y>34),...slabs];
  const positions={201:[53.5,16.5,0],205:[48.5,19.5,floor],206:[58.5,19.5,floor],207:[53.5,17.5,floor],8001:[47.5,23.5,0],8002:[59.5,23.5,0],8003:[59.5,29.5,0],8004:[47.5,27.5,0],8005:[55.5,35.5,0],8006:[57.5,21.5,0],2970:[49.5,19.5,0]};
  // One authored tavern regular; old random wildlife copies are reconciled on load.
  const drunk=m.wildlife?.find(n=>n.type==='moorDrunk');
  m.wildlife=(m.wildlife||[]).filter(n=>n.type!=='moorDrunk');
  m.npcs=(m.npcs||[]).filter(n=>!resident(n));
  m.npcs.push({index:2970,x:49.5,y:19.5,sprite:297,state:'stationary',role:'dialogue',alignment:'defender',level:drunk?.level??10,companionEligible:false,customDialogue:tavernLines.slice()});
  for(const n of m.npcs||[]){const p=positions[n.index];if(p)Object.assign(n,{x:p[0],y:p[1],groundZ:p[2],homeX:p[0],homeY:p[1]});}
  const clerk=m.npcs.find(n=>n.index===201),original=clerk?.dialogueFactory;
  if(clerk){const spawn=clerk.onSpawn;clerk.onSpawn=(n,d)=>{spawn?.(n,d);Object.assign(n,{fixedWorldAngle:Math.PI/2,dirX:0,dirY:1});};}
  if(original)clerk.dialogueFactory=d=>{const q=original(d);return {...q,text:[...q.text,'Most trainers are here on the ground floor; the Knight guards the entrance outside. Hunter now teaches from his cabin in Savage Forest, through the eastern gap beyond Tintagel. The King, Queen, Elder and library are upstairs. Take the staircase on the left.']};};
  m.guildBuilding={floor,roof,bounds,entrance:{x:53.5,y:34.5,z:0},stairs:{x:46.5,y:26.5,z:0},landing:{x:46.5,y:16.5,z:floor}};
 }
 install();return {floor,roof,bounds,road,resident,reconcile};
})();