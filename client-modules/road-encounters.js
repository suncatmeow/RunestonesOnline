const BMRoadEncounters=(()=>{
 const key=n=>n.instanceId+':'+n.index,close=['close_dialogue',null];
 function prepare(n){if(!n.roadEncounter||n._dialogueConsumed)return;const kind=n.roadEncounter.kind,act=(choice)=>[['road_encounter',{index:n.index,choice}]];n.companionEligible=false;
  const choices=kind==='riddle'?[...(n.roadEncounter.answers||['A towel','A river','A candle']).slice(0,3),'Leave']:kind==='hunt'?['Help','Leave']:kind==='game'?['Play','Leave']:['Well done','Leave'];
  n.options=choices;n.choiceActions=choices.map((_,i)=>act(i===choices.length-1?'leave':kind==='riddle'?i===(n.roadEncounter.correct??0)?'right':'wrong':'accept'));n.yesActions=n.choiceActions[0];n.noActions=n.choiceActions[1];n.endActions=[close];
 }
 function action(payload,d){const n=d.npcs.find(n=>n.index===payload?.index&&!n.isDead),kind=n?.roadEncounter?.kind;if(!n||n._dialogueConsumed||n.instanceId!==d.customMapInstance)return;
  const id=key(n),choice=payload.choice;if(!['leave','accept','right','wrong'].includes(choice))return;
  if(kind==='game'&&choice==='accept'){if(BMCamp.open('blackjack','',n)){BMDialogueFlow.done(n);d.currentSpeaker=null;d.actionQueue=[];d.isProcessingActions=false;}else n.customDialogue=['It is too dangerous to play just now. Try again when the road is clear.'];return;}
  BMDialogueFlow.done(n);const actions=[close];
  if(choice==='leave'){d.actionQueue.unshift(...actions);return;}
  if(kind==='riddle'){
   const success=choice==='right';if(success)actions.push(['give_card',{card:28,once:'road-riddle:'+id,text:'Correct: '+(n.roadEncounter.answers?.[n.roadEncounter.correct]||'A towel')+'. You win a Potion card.'}]);
   else actions.push(['remove_card',{card:28,text:'The answer was '+(n.roadEncounter.answers?.[n.roadEncounter.correct]||'a towel')+'. You lose one Potion card.'}],['notify',{text:'The answer was '+(n.roadEncounter.answers?.[n.roadEncounter.correct]||'a towel')+'. If you had no Potion card, you owe nothing.',soft:true}]);
  }else if(kind==='hunt'){
   const foe=d.npcs.find(v=>v.index===n.roadEncounter.targetIndex);
   if(!foe||foe.isDead)actions.push(['notify',{text:'Someone already dealt with the raider. Keep the reward for your next adventure.',soft:true}]);
   else {(d.memory.roadHunts??={})[id]={instanceId:n.instanceId,target:foe.index,done:false};actions.push(['notify',{text:'Defeat the nearby road raider. Your reward is a Potion card; no need to return to the traveller.',soft:true}]);}
  }else actions.push(['notify',{text:'“I knew you would recognize greatness! It was a very fierce rabbit.”',soft:true}]);
  d.actionQueue.unshift(...actions);d.requestSave();
 }
 function run(payload,d=Dungeon){return action(payload,d);}
 const kill=Explore.prototype.killNPC;Explore.prototype.killNPC=function(n,skip=false,reason='combat',...args){const alive=n&&!n.isDead,result=kill.call(this,n,skip,reason,...args);if(alive&&n.isDead&&!['npc_infighting','suncat_combat','smite','dialogue','despawn','story_event'].includes(reason)){
  for(const [id,h]of Object.entries(this.memory.roadHunts||{}))if(!h.done&&h.instanceId===this.customMapInstance&&h.target===n.index){h.done=true;this.requestSave();this.executeActions([['give_card',{card:28,once:'road-hunt:'+id,text:'The road is safer. The traveller’s promised Potion card is yours.'}]]);}
 }return result;};
 return {prepare,action:run};
})();globalThis.BMRoadEncounters=BMRoadEncounters;