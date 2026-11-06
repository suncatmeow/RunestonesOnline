const BMGroundLoot=(()=>{
 const BAG=-210,IMPACT=-209;let serial=0,last=0,busy=new Set(),retryAt=new Map(),reported=new Set();
 const identity=d=>String(d.mapID)+':'+(d.mapID===999?d.customMapInstance||'':'');
 const store=d=>{d.memory??={};return d.memory.groundLoot??={version:1,piles:[]};};
 function art(){spriteCache[BAG]=BMWorldItemArt.stamp(BMShopModels.mesh('misc'));SPRITE_CONFIGS[BAG]={scale:.27,hover:0,faceZ:.7,facePan:0};}
 function drop(d,n,payload={}){
  const key=payload.mapKey||identity(d),records=store(d).piles;
  if(payload.id&&records.some(p=>p.id===payload.id))return records.find(p=>p.id===payload.id);
  const items=(payload.items||[]).filter(i=>i&&typeof i.key==='string'&&Number.isInteger(i.count)&&i.count>0).map(i=>({...i})),cards=(payload.cards||[]).filter(i=>Number.isInteger(i)&&!!CARD_MANIFEST_DB[i]);
  if(!items.length&&!cards.length&&!(payload.silver>0))return null;
  const x=Number(n?.x),y=Number(n?.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const z=Number.isFinite(n.groundZ)?n.groundZ:BMTerrainPhysics.feet(d,n);
  let p=!payload.id&&records.find(p=>!p.server&&p.mapKey===key&&Math.abs(p.z-z)<.15&&Math.hypot(p.x-x,p.y-y)<.75);
  if(!p){p={id:payload.id||'local:'+Date.now().toString(36)+':'+(++serial),mapKey:key,mapID:payload.mapID??d.mapID,x,y,z,items:[],cards:[],silver:0,server:!!payload.server,createdAt:Date.now()};records.push(p);}
  for(const item of items){const old=p.items.find(i=>i.key===item.key);if(old)old.count+=item.count;else p.items.push(item);}
  p.cards.push(...cards);p.silver+=Math.max(0,Number(payload.silver)||0);sync(d);d.requestSave();return p;
 }
 function sync(d=Dungeon){const records=store(d).piles.filter(p=>p.mapKey===identity(d)&&Math.hypot(p.x-d.x,p.y-d.y)<32);const ids=new Set(records.map(p=>p.id));d.npcs=d.npcs.filter(n=>!n._groundLoot||ids.has(n._groundLoot));
  const drawn=new Map(d.npcs.filter(n=>n._groundLoot).map(n=>[n._groundLoot,n]));for(const p of records){let n=drawn.get(p.id);if(!n){n=new NPC('loot:'+p.id,p.x,p.y,BAG,'stationary','#dfbd67',p.cards.length?[p.cards[0]]:[],'decoration',false,'friendly');Object.assign(n,{_groundLoot:p.id,nonBlocking:true,hideMinimap:true,companionEligible:false,isCinematic:true,groundZ:p.z});d.npcs.push(n);}n.type=BAG;n.cachedBillboard=BMWorldItemArt.loot(p);n.deck=p.cards.length?[p.cards[0]]:[];n.groundZ=p.z;}
 }
 function collect(p,d=Dungeon){const rows=store(d).piles,at=rows.indexOf(p);if(at<0)return false;const summary=[];
  for(const item of p.items){BMInventory.add(item,item.count);summary.push(item.name+' × '+item.count);}for(const id of p.cards){d.extra.push(new Card(id,0));summary.push((CARD_MANIFEST_DB[id]?.name||'Card')+' card');}if(p.silver){BMCurrency.add(p.silver);summary.push(p.silver+' silver');}
  rows.splice(at,1);d.npcs=d.npcs.filter(n=>n._groundLoot!==p.id);BMActivity.record('loot_pickup','Picked up '+summary.join(', ')+'.',{pile:p.id,mapID:p.mapID,items:p.items,cards:p.cards});chatLog.push({text:'Loot: '+summary.join(', '),color:'#e6dcbd'});if(chatLog.length>100)chatLog.shift();MusicEngine.play3DSFX('loot');d.requestSave();return true;
 }
 function pickup(p){if(busy.has(p.id)||(retryAt.get(p.id)||0)>Date.now())return;if(!p.server){collect(p);return;}if(!socket?.connected||!socket._bmGroundLoot)return;
  busy.add(p.id);socket.timeout(3500).emit('online_loot_pickup',{id:p.id},(err,result)=>{busy.delete(p.id);if(err||!result?.ok){retryAt.set(p.id,Date.now()+5000);if(result?.error&&!reported.has(p.id)){reported.add(p.id);chatLog.push({text:'[ONLINE]: '+result.error,color:'#d6b3ff'});}return;}retryAt.delete(p.id);if(!err&&result?.ok){collect(p);Promise.resolve(BMStorage.flush()).then(()=>socket.emit('online_loot_ack',{id:p.id})).catch(()=>{});}});
 }
 function tick(now=performance.now()){if(now-last<150||startGame!=='explore'||Dungeon.isLoading||Dungeon.isDead||Dungeon.isDying)return;last=now;sync();if(BMPlayerMotion.airborne)return;for(const p of store(Dungeon).piles){if(p.mapKey!==identity(Dungeon)||Math.hypot(p.x-Dungeon.x,p.y-Dungeon.y)>.7||Math.abs(p.z-BMTerrainPhysics.feet(Dungeon,Dungeon))>.3)continue;if(BMTerrainPhysics.trace(Dungeon,Dungeon.x,Dungeon.y,p.z+.2,p.x,p.y,p.z+.2))pickup(p);}}
 function reward(data){const n=Dungeon.npcs.find(n=>n.index===(data.lootIndex??data.index));const x=Number.isFinite(data.x)?data.x:n?.x??Dungeon.x,y=Number.isFinite(data.y)?data.y:n?.y??Dungeon.y;
  const items=[...(Number.isFinite(data.lootType)?[...BMMonsterLoot.roll({type:data.lootType,alignment:'foe'}),...BMFieldCraft.loot({type:data.lootType,alignment:'foe'})]:[]),...(Array.isArray(data.items)?data.items.filter(i=>i&&typeof i.key==='string'&&Number.isInteger(i.count)&&i.count>0&&i.count<=99).slice(0,32):[])],card=typeof data.card==='object'?data.card?.index:data.card;
  return drop(Dungeon,{x,y,groundZ:Number.isFinite(data.z)?data.z:n?.groundZ??0},{id:data.id,mapID:data.mapID??Dungeon.mapID,mapKey:String(data.mapID??Dungeon.mapID)+':'+(data.mapID===999?data.instanceId||Dungeon.customMapInstance||'':''),items,cards:Number.isInteger(card)?[card]:[],silver:data.silver||0,server:data.groundLoot===1});
 }
 function install(){art();const load=Explore.prototype.loadMap;Explore.prototype.loadMap=function(...a){const result=load.apply(this,a);sync(this);return result;};const update=NPC.prototype.update;NPC.prototype.update=function(...a){if(this._groundLoot)return;return update.apply(this,a);};
  socket?.on('online_capabilities',v=>socket._bmGroundLoot=v?.groundLoot===1);socket?.on('disconnect',()=>{socket._bmGroundLoot=false;busy.clear();retryAt.clear();});
 }
 return {drop,collect,pickup,tick,sync,reward,store,install,IMPACT,BAG};
})();globalThis.BMGroundLoot=BMGroundLoot;BMGroundLoot.install();