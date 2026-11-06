const BMClassicDialogue=(()=>{
 let session=null;
 const fields=['customDialogue','options','choiceActions','yesActions','noActions','endActions','rewardCard','dialogueFactory'];
 function pages(text){const out=[];for(let part of (Array.isArray(text)?text:[String(text||'…')]))for(let line of String(part).split(/\n\s*\n/)){while(line.length>150){let cut=line.lastIndexOf(' ',150);if(cut<60)cut=150;out.push(line.slice(0,cut).trim());line=line.slice(cut).trim();}if(line)out.push(line);}return out.length?out:['…'];}
 function paint(){const s=session;if(!s)return;const all=s.data.options||[],many=all.length>3,at=s.page*2;
  s.choices=many?all.slice(at,at+2):all.slice();if(many)s.choices.push({label:at+2<all.length?'More':'First choices',action:()=>{s.page=at+2<all.length?s.page+1:0;paint();},navigation:true});
  s.choices.push({label:s.data.closeLabel||'Leave',action:s.onClose,close:true});
  Object.assign(s.n,{customDialogue:s.lines,options:s.choices.map(o=>o.label),choiceActions:null,yesActions:null,noActions:null,endActions:[],rewardCard:null});
  Dungeon.currentSpeaker=s.n;startGame='dialogue';BMClassicChoices.hide();
 }
 function dismiss(){const s=session;session=null;if(!s)return;Object.assign(s.n,s.saved);BMClassicChoices.hide();
  if(Dungeon===s.owner){if(s.view)window.gameViewMode=s.view;if(s.camera)Dungeon.cameraMode=s.camera;}
 }
 function show(data,onClose){dismiss();const n=data.speaker||Dungeon.currentSpeaker||{type:-37,role:'notification',name:data.title||'',x:Dungeon.x,y:Dungeon.y};
  session={n,data,onClose,owner:Dungeon,map:Dungeon.mapID,page:0,lines:pages(data.text),saved:Object.fromEntries(fields.map(k=>[k,n[k]])),view:window.gameViewMode,camera:Dungeon.cameraMode};
  Dungeon.savedViewMode=window.gameViewMode;Dungeon.savedCameraMode=Dungeon.cameraMode;window.gameViewMode='3d';Dungeon.cameraMode='first_person';Dungeon.dCounter=0;Dungeon.currentSpeaker=n;const dx=Dungeon.x-n.x,dy=Dungeon.y-n.y,len=Math.hypot(dx,dy);if(len>0){n.dirX=dx/len;n.dirY=dy/len;}beginNpcConversation(n);BMTouch.cancel();BMLock.clear();window.activeMoveKey=null;paint();BMShell.invalidate();return true;
 }
 function choose(i){const s=session,o=s?.choices[i];if(!s||!o||o.disabled||Dungeon.isDying||Dungeon.isDead)return false;if(o.navigation){o.action();return true;}
  dismiss();Dungeon.currentSpeaker=s.n;Dungeon.dCounter=0;startGame='explore';o.action?.();
  if(startGame==='explore'&&Dungeon.currentSpeaker===s.n){Dungeon.currentSpeaker=null;BMDialogueFlow.closed(s.n);}return true;
 }
 function advance(close=false){if(!session)return false;if(Dungeon.dCounter<session.lines.length-1)Dungeon.dCounter++;else if(close||!session.data.options?.length)choose(session.choices.length-1);return true;}
 function tick(){if(session&&(session.owner!==Dungeon||session.map!==Dungeon.mapID||startGame!=='dialogue'||Dungeon.isDying||Dungeon.isDead))dismiss();}
 window.addEventListener('keydown',e=>{if(!session||e.key!=='Escape'||e.target?.matches('input,textarea'))return;e.preventDefault();e.stopImmediatePropagation();choose(session.choices.length-1);},true);
 return {show,dismiss,choose,advance,tick,pages,disabled:(n,i)=>session?.n===n&&!!session.choices[i]?.disabled,owns:n=>session?.n===n,get active(){return !!session;},get index(){return session?Dungeon.dCounter:undefined;}};
})();globalThis.BMClassicDialogue=BMClassicDialogue;