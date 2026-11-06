const BMCombatRecovery=(()=>{
 function clearDeath(d){clearTimeout(d._deathTimeout);d._deathSequence=null;d.isDead=d.isDying=false;d.status='normal';d.currentWardTime=d.maxWards*d.timePerWard;d._respawnProtectedUntil=Date.now()+10000;d.wardShatterCooldown=0;d.wardShatterDuration=0;d.activeBuffs=[];d.isAggroDashing=false;d.actionQueue=[];d.isProcessingActions=false;d.currentSpeaker=d.currentEnemy=null;if(d.weather){d.weather.deathOverlayLocked=false;d.weather.setMode(MAP_DB[d.mapID]?.weather||'clear');d.weather.dyingTimer=0;}BMDeathRecovery.clearPending(d);BMClassicChoices.hide();BMLock.clear();}
 function questRoute(d){
  const kind=BMClassPaths.inTrial(d)?'trial':BMGuildFinale.active(d)?'finale':BMGuildStory.active(d)?'stronghold':null;
  return kind?{kind,mapID:d.mapID}:null;
 }
 function finishQuestDeath(d){
  const saved=d.memory?.questDeathReturn,route=questRoute(d);
  if(!saved||!route||saved.kind!==route.kind||saved.mapID!==d.mapID)return false;
  d.projectiles=[];d.activeBuffs=[];d.activeSummons=[];
  if(route.kind==='trial')BMClassPaths.leaveTrial(false);
  else if(route.kind==='finale')BMGuildFinale.revive(d);
  else Object.assign(d,{x:20.5,y:36.5,targetMapX:20.5,targetMapY:36.5,groundZ:0,isSlidingToTile:false});
  clearDeath(d);d.focusTarget=null;d.isSlidingToTile=false;d.hostilePlayers?.clear();
  for(const n of d.npcs||[]){n.cachedPrey=null;n.target=null;}
  BMPlayerMotion.reset();BMTouch.cancel();BMWorldTalk.dismiss();BMWorldTalk.clearTaunts();
  startGame=preGame='explore';d._bmRecovered=true;if(!d.isLoading){d.saveGame();d._bmRecovered=false;}
  if(socket?.connected)socket.emit('move',{x:d.x,y:d.y,dir:d.dir,mapID:d.mapID,name:playerName,type:playerSprite});
  return true;
 }
 const die=Explore.prototype.killPlayer;Explore.prototype.killPlayer=function(...args){
  if(this.isDying||this.isDead)return;
  BMWorldTalk.dismiss();const route=questRoute(this);this.memory??={};
  if(route){this.memory.questDeathReturn=route;this.projectiles=[];}else delete this.memory.questDeathReturn;
  // Use the original killer dialogue, stat-scaled timer, dark tunnel and white light.
  // Only the destination after that sequence differs in a quest area.
  return die.apply(this,args);
 };
 const render=Explore.prototype.render;Explore.prototype.render=function(...a){BMGroundLoot.tick();return render.apply(this,a);};
 let shown=false;window.addEventListener('error',e=>{if(shown||!BattleMageStartup?.ready||BMEngine.runtime.running)return;shown=true;console.error('Battle Mage frame stopped',e.error||e.message);const box=document.createElement('div');box.id='bm-game-error';box.style.cssText='position:fixed;z-index:999999;inset:20% 8% auto;padding:20px;background:#101724;color:#eee;border:2px solid #bda96d;font:16px/1.5 system-ui';const text=document.createElement('p');text.textContent='The game stopped drawing. You can return to safety. '+String(e.message||'Unexpected rendering error').slice(0,180);box.append(text);const b=document.createElement('button');b.textContent='Return to safety';b.style.cssText='padding:12px;font:inherit';b.onclick=()=>{box.remove();shown=false;clearDeath(Dungeon);if(BMGuildStory.active())BMGuildStory.leave();else BMDeathRecovery.recover(Dungeon);canvas.width=canvas.width;resizeCanvas();startGame='explore';BMEngine.start();};box.append(b);document.body.append(box);});
 return {clearDeath,finishQuestDeath};
})();globalThis.BMCombatRecovery=BMCombatRecovery;