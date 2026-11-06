const BMFishing=(()=>{
 let cast=null,water=null,checked=0,cacheKey='',notice='',noticeUntil=0,reveal=null,controls=null,reel=null,rod=null,last=0;
 const safe=()=>BMTouch.live()&&!Dungeon.isDead&&!Dungeon.inCombat&&!Dungeon.isThreatNearby&&!Dungeon.isAggroDashing;
 function nearby(now=performance.now()){const key=[Dungeon.mapID,Math.floor(Dungeon.x),Math.floor(Dungeon.y)].join(':');if(now-checked<300&&key===cacheKey)return water;checked=now;cacheKey=key;water=null;if(!safe())return null;let best=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=Math.floor(Dungeon.x)+dx,y=Math.floor(Dungeon.y)+dy,t=Dungeon.maze[y]?.[x];if(![92,93].includes(t))continue;if(dx&&dy&&(BMPlayerMotion.blocked(x,Math.floor(Dungeon.y))||BMPlayerMotion.blocked(Math.floor(Dungeon.x),y)))continue;const dist=Math.hypot(x+.5-Dungeon.x,y+.5-Dungeon.y);if(dist<best){water={x,y};best=dist;}}return water;
 }
 function say(s,now=performance.now()){notice=s;noticeUntil=now+4000;}
 function finish(ok,message){if(!cast)return;const g=cast;g.message=message;BMCraftMastery.finish(g,ok);cast=null;if(controls)controls.hidden=true;say(message);if(!ok)BMCraftAudio.result(false);}
 function cancel(){if(cast)finish(false,'Line reeled in.');}
 function ui(){if(controls)return;controls=document.createElement('div');controls.id='bm-fishing-controls';controls.style.cssText='position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:980;display:flex;gap:8px;padding:8px;background:#12201de8;border:1px solid #a18e5d;border-radius:12px;color:#eadfbe';controls.hidden=true;document.body.append(controls);
  const style=document.createElement('style');style.textContent='#bm-fishing-controls[hidden]{display:none}#bm-fishing-controls button{min-height:48px;padding:9px 16px;border:1px solid #a28e61;background:#283a2c;color:#eadfbe;border-radius:9px;font:15px system-ui;touch-action:none}';document.head.append(style);
  for(const t of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend','click','keydown','keyup'])controls.addEventListener(t,e=>e.stopPropagation());
  reel=document.createElement('button');reel.textContent='Hold to reel';controls.append(reel);reel.onpointerdown=e=>{if(!cast)return;e.preventDefault();reel.setPointerCapture(e.pointerId);cast.reeling=true;};const release=()=>{if(cast)cast.reeling=false;};reel.onpointerup=reel.onpointercancel=reel.onlostpointercapture=release;reel.onkeydown=e=>{if([' ','Enter'].includes(e.key)&&cast){e.preventDefault();cast.reeling=true;}};reel.onkeyup=release;
  rod=document.createElement('button');rod.textContent='↔ Rod';rod.setAttribute('aria-label','Drag the rod against the fish’s pull');controls.append(rod);let origin=null;rod.onpointerdown=e=>{origin=e.clientX;rod.setPointerCapture(e.pointerId);};rod.onpointermove=e=>{if(origin!==null&&cast)cast.rod=Math.max(-1,Math.min(1,(e.clientX-origin)/55));};rod.onpointerup=rod.onpointercancel=()=>{origin=null;if(cast)cast.rod=0;};rod.onkeydown=e=>{if(cast&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();cast.rod=e.key==='ArrowLeft'?-1:1;}};rod.onkeyup=()=>{if(cast)cast.rod=0;};
  const stop=document.createElement('button');stop.textContent='Stop';stop.onclick=cancel;controls.append(stop);
 }
 function catchFish(now){const g=cast;if(!g)return;if(!BMCraftMastery.checkpoint(g,'landing',.95,true)){g.distance=.1;return;}
  const fishIndex=g.fishIndex,name=BMFishSprites.species[fishIndex].name,cm=g.cm,record=Dungeon.memory.fishingRecord??={catches:0,bestCm:0};record.catches++;record.bestCm=Math.max(record.bestCm,cm);record.lastSpecies=name;
  BMInventory.add({key:'fish:'+fishIndex,name,kind:'fish',fishIndex},1);BMActivity.record('fish_caught','Caught a '+cm+' cm '+name+'.',{fish:name,fishIndex,cm});finish(true,name+' · '+cm+' cm');reveal={index:fishIndex,at:now,until:now+2600,map:Dungeon.mapID};BMCraftAudio.cue('craftSplash');BMCraftAudio.result(true);Dungeon.requestSave();
 }
 function tick(now=performance.now()){const dt=Math.max(0,Math.min(.15,(now-last)/1000));last=now;if(reveal&&(now>reveal.until||!safe()))reveal=null;if(!cast){if(controls)controls.hidden=true;return;}
  if(!safe()||cast.map!==Dungeon.mapID||Math.hypot(Dungeon.x-cast.x,Dungeon.y-cast.y)>.12||Dungeon.isSlidingToTile){cancel();return;}
  if(cast.phase==='wait'){if(now>=cast.bite&&!cast.sounded){cast.sounded=true;BMCraftAudio.cue('craftBite');}if(now>cast.bite+2200)finish(false,'The fish slipped away.');return;}
  const g=cast;g.elapsed+=dt;const run=(g.elapsed%5.5)<1.8&&g.energy>.18;g.running=run;g.pull=Math.sin(g.elapsed*1.1+.8)>.0?1:-1;const counter=Math.max(0,-g.rod*g.pull),bad=Math.max(0,g.rod*g.pull);
  g.tension+=(g.reeling?(run?.30:.055):-.17)*dt+(run?.10:0)*dt+bad*.11*dt-counter*.14*dt;g.tension=Math.max(0,Math.min(1.1,g.tension));
  if(g.tension>.25&&g.tension<.86)g.energy=Math.max(0,g.energy-dt*(.045+counter*.035));
  if(g.reeling&&!run)g.distance=Math.max(0,g.distance-dt*(.025+(1-g.energy)*.11));else if(run)g.distance=Math.min(1,g.distance+dt*.025);
  g.slack=g.tension<.08?g.slack+dt:0;g.strain=g.tension>.96?g.strain+dt:0;
  if(g.strain>.8){finish(false,'The line snapped. Release the reel during strong runs.');return;}if(g.slack>2.5){finish(false,'The hook slipped. Keep a little tension on the line.');return;}
  if(reel)reel.textContent=run?'Release · fish running':'Hold to reel';if(rod)rod.textContent=g.pull>0?'← Pull left':'Pull right →';
  if(g.distance<=.02&&g.energy<.30)catchFish(now);
 }
 function press(now=performance.now()){tick(now);if(!safe())return;if(cast){if(cast.phase==='fight'){cast.reeling=!cast.reeling;return;}if(now<cast.bite){cancel();return;}cast.phase='fight';cast.elapsed=0;cast.tension=.48;cast.energy=1;cast.distance=1;cast.rod=0;cast.pull=1;cast.reeling=false;cast.slack=cast.strain=0;ui();controls.hidden=false;BMCraftAudio.cue('craftReel');return;}
  if(Dungeon.isSlidingToTile||!nearby(now)||!BMCraftMastery.canBegin())return;cast={kind:'fishing',phase:'wait',x:Dungeon.x,y:Dungeon.y,map:Dungeon.mapID,bite:now+1800+Math.random()*2600,fishIndex:Math.floor(Math.random()*BMFishSprites.species.length),cm:8+Math.floor(Math.random()*44)};last=now;BMCraftMastery.begin(cast);BMCraftAudio.cue('craftSplash');BMActivity.record('fishing_started','Cast a fishing line beside the water.');notice='';
 }
 function draw(){if(!BMTouch.live())return;const now=performance.now(),g=cast;if(reveal){const a=Math.max(0,Math.min(1,(reveal.until-now)/400));ctx.save();ctx.globalAlpha=a;BMFishSprites.draw(reveal.index,tX+tL*.5,tY+tH*.34,Math.min(190,tL*.34),(now-reveal.at)/1000);ctx.restore();}
  const message=g?g.phase==='wait'?(now>=g.bite?'Bite! Tap Reel.':'Waiting for a bite…'):(g.running?'Let it run. Guide the rod against its pull.':'Reel steadily. Keep the line balanced.'):now<noticeUntil?notice:'';if(!message)return;
  const x=tX+tL*.10,y=tY+tH*.36,w=tL*.80,h=Math.max(100,tL*.23);ctx.save();ctx.fillStyle='#071512dc';ctx.fillRect(x,y,w,h);ctx.textAlign='center';ctx.fillStyle='#e8ddbb';ctx.font=Math.max(12,Math.min(17,tL*.026))+'px system-ui';ctx.fillText(message,x+w/2,y+22,w-12);
  if(g?.phase==='fight'){const sx=x+w*.20,sy=y+h*.74,ex=x+w*(.5+g.rod*.16),ey=y+h*.32;ctx.strokeStyle='#aa7c47';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(ex-g.pull*20*g.tension,sy-45,ex,ey);ctx.stroke();ctx.strokeStyle=g.tension>.85?'#e79579':'#ddd8b8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ex,ey);ctx.quadraticCurveTo(ex+g.pull*40,ey+25,x+w*(.73+g.pull*.09),y+h*.67);ctx.stroke();
   for(const [i,label,value,color]of [[0,'Tension',g.tension,g.tension>.85?'#dc8368':'#c7c787'],[1,'Fish',g.energy,'#89b9d4'],[2,'Distance',g.distance,'#8bc4a0']]){const by=y+h-27+i*8;ctx.fillStyle='#243d32';ctx.fillRect(x+75,by,w-90,5);ctx.fillStyle=color;ctx.fillRect(x+75,by,(w-90)*Math.min(1,value),5);ctx.textAlign='right';ctx.font='9px system-ui';ctx.fillText(label,x+69,by+5);}
  }ctx.restore();
 }
 return {available:()=>safe()&&(!!cast||!!nearby()),press,tick,cancel,draw,reset(){cancel();water=null;cacheKey='';checked=0;reveal=null;notice='';},get message(){return notice;},get active(){return !!cast;},get biting(){return !!cast&&performance.now()>=cast.bite;},get state(){return cast;}};
})();
