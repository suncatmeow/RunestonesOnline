const BMDeathRecovery=(()=>{
 const key='runestones.pendingDeath';
 function destination(d){
  const m=window.latestCustomMapData;
  if(d.mapID===999&&m?.instanceId===d.customMapInstance){BMRefuge.prepare(m);if(m.safeRoom)return {mapID:999,...m.safeRoom.spawn,dir:0,groundZ:0};}
  const s=d.memory?.globalSpawn;
  if(s&&s.mapID!==999&&MAP_DB[s.mapID]&&[s.x,s.y].every(Number.isFinite))return {...s};
  return {mapID:0,x:53.5,y:35.5,dir:0,groundZ:0};
 }
 function mark(d){d.memory.pendingDeath=true;BMStorage.setItem(key,'1');d.saveGame();}
 function protectedSpawn(d){return Date.now()<(d._respawnProtectedUntil||0);}
 function recover(d){
  // A saved quest death may be reopened after the animation was interrupted.
  if(globalThis.BMCombatRecovery?.finishQuestDeath(d))return {mapID:d.mapID,x:d.x,y:d.y,dir:d.dir,groundZ:d.groundZ||0};
  const pos=destination(d),loading=d.isLoading;d.isLoading=true;
  try{
   d.activeSummons=[];d.projectiles=[];d.activeBuffs=[];d.actionQueue=[];d.isProcessingActions=false;
   d.currentSpeaker=null;d.currentEnemy=null;d.focusTarget=null;d.isSlidingToTile=false;d.isAggroDashing=false;
   if(pos.mapID!==999)d.loadMap(pos.mapID);
   else {const m=window.latestCustomMapData;d.maze=m.maze.map(row=>row.slice());for(const n of d.npcs||[])if(n.index===m.exitIndex){n.x=m.safeRoom.exit.x;n.y=m.safeRoom.exit.y;}}
   Object.assign(d,{x:pos.x,y:pos.y,dir:pos.dir??0,targetMapX:pos.x,targetMapY:pos.y,isDying:false,isDead:false,status:'normal',_deathSequence:null});
   BMLayers.settle(d,d,pos.groundZ||0);BMPlayerMotion.reset();BMTouch.cancel();BMLock.clear();BMWorldTalk.dismiss();BMWorldTalk.clearTaunts();
   d.currentWardTime=d.maxWards*d.timePerWard;d.wardShatterCooldown=0;d.wardShatterDuration=0;d.hostilePlayers?.clear();
   d._respawnProtectedUntil=Date.now()+10000;
   for(const n of d.npcs||[]){n.cachedPrey=null;n.target=null;if(n.state==='chasing'){n.state='wandering';n.chasing=false;}}
   if(d.weather)d.weather.deathOverlayLocked=false;
   clearPending(d);d._bmRecovered=true;
  }finally{d.isLoading=loading;}
  if(!loading){d.saveGame();d._bmRecovered=false;}
  if(typeof socket!=='undefined'&&socket?.connected)socket.emit('move',{x:d.x,y:d.y,dir:d.dir,mapID:d.mapID,name:playerName,type:playerSprite});
  return pos;
 }
 function clearPending(d){delete d.memory.pendingDeath;delete d.memory.questDeathReturn;BMStorage.removeItem(key);}
 return {destination,mark,recover,clearPending,protected:protectedSpawn};
})();
globalThis.BMRefuge=BMRefuge;globalThis.BMDeathRecovery=BMDeathRecovery;