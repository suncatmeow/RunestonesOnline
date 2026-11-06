/* BM_MATERIALS_BEGIN — shared client/server rules; no DOM or generated executable code. */
function createMaterialWorkshop(env){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x)),cap=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
 const effects={str:{name:'Strength',symbol:'◆',color:'#e6c04d'},con:{name:'Constitution',symbol:'⬡',color:'#6dc180'},int:{name:'Intelligence',symbol:'✦',color:'#d98391'},agi:{name:'Agility',symbol:'➤',color:'#79b3ef'},speed:{name:'Movement speed',symbol:'»',color:'#9bc8ed'},recovery:{name:'Ward recovery',symbol:'↟',color:'#75c9a2'},poison:{name:'Poison',symbol:'●',color:'#a7c458'},ward:{name:'Ward restoration',symbol:'◈',color:'#8de0d0'},burn:{name:'Burn',symbol:'♨',color:'#e79455'}};
 const materials={
  'herb:moonleaf':{name:'Moonleaf',kind:'herb',color:'#92c5ae',rank:0,props:{agi:1,recovery:1},delicate:true,flavor:{bitter:1},tags:['plant','seasoning']},
  'herb:sunsage':{name:'Sunsage',kind:'herb',color:'#e4bd5f',rank:0,props:{str:1,ward:1},delicate:true,flavor:{sweet:1},tags:['plant','seasoning']},
  'herb:bitterroot':{name:'Bitterroot',kind:'herb',color:'#b394c9',rank:1,props:{speed:1,recovery:-1},flavor:{bitter:2},tags:['plant','seasoning']},
  'herb:glowcap':{name:'Glowcap',kind:'herb',color:'#74dde5',rank:1,props:{int:1,poison:-1},delicate:true,flavor:{savory:1},tags:['plant','seasoning']},
  'herb:cavefern':{name:'Cavefern',kind:'herb',color:'#89f1bd',rank:2,props:{con:1,poison:-1},flavor:{bitter:1},tags:['plant','seasoning']},
  'material:meat':{name:'Raw meat',rank:0,props:{ward:1},flavor:{savory:2},tags:['food','raw']},
  'material:mushroom':{name:'Mushroom',rank:0,props:{ward:.5},flavor:{savory:1},tags:['food','seasoning']},
  'material:grass':{name:'Wild greens',rank:0,props:{con:1},flavor:{bitter:1},tags:['food','plant']},
  'material:salt':{name:'Salt',rank:0,props:{con:1},flavor:{salt:1},tags:['seasoning']},
  'material:berries':{name:'Berries',rank:0,props:{agi:1},flavor:{sweet:2},delicate:true,tags:['food','seasoning']},
  'material:spider_leg':{name:'Spider leg',rank:2,props:{agi:1,poison:.5},flavor:{savory:1},tags:['food','raw','animal','rigid'],parts:{head:{agi:1,poison:.5},grip:{speed:1}}},
  'material:scorpion_gland':{name:'Scorpion gland',rank:2,props:{poison:2,recovery:-1},tags:['animal'],parts:{fitting:{poison:1}}},
  'material:werewolf_organ':{name:'Werewolf organ',rank:2,props:{recovery:2,burn:.5},tags:['animal'],parts:{fitting:{recovery:1,burn:.5}}},
  'material:chitin':{name:'Chitin',rank:1,props:{con:1},tags:['rigid','animal'],parts:{head:{con:1,agi:1},grip:{agi:1}}},
  'material:boar_tusk':{name:'Boar tusk',rank:1,props:{str:1},tags:['rigid','animal'],parts:{head:{str:1,agi:1},grip:{agi:1}}},
  'material:wolf_tooth':{name:'Wolf tooth',rank:1,props:{agi:1},tags:['rigid','animal'],parts:{head:{agi:1},fitting:{str:1}}},
  'material:bear_claw':{name:'Bear claw',rank:1,props:{str:1,recovery:-1},tags:['rigid','animal'],parts:{head:{str:2},fitting:{str:1}}},
  'material:fur':{name:'Fur',rank:0,props:{con:.5},tags:['flexible'],parts:{grip:{con:1}}},
  'material:pixie_thread':{name:'Thread',rank:1,props:{int:1},tags:['flexible'],parts:{grip:{int:1},fitting:{agi:1}}},
  'material:spriggan_heartwood':{name:'Heartwood',rank:2,props:{int:1,recovery:1},tags:['rigid'],parts:{head:{int:2},grip:{recovery:1}}},
  'ore:iron':{name:'Iron',rank:0,props:{con:1,speed:-1},tags:['rigid','metal'],parts:{head:{str:2,speed:-1},grip:{con:1,speed:-1}}},
  'ore:gold':{name:'Gold',rank:1,props:{int:1},tags:['metal'],parts:{fitting:{int:1}}},
  'ore:ruby':{name:'Ruby',rank:2,props:{str:1,burn:1},tags:['gem'],parts:{fitting:{burn:1}}},
  'ore:ice':{name:'Ice crystal',rank:1,props:{burn:-1,con:1},tags:['gem'],parts:{fitting:{con:1}}},
  'ore:fire':{name:'Fire crystal',rank:1,props:{burn:1,str:1},tags:['gem'],parts:{fitting:{burn:1}}},
  'ore:blood':{name:'Blood stone',rank:2,props:{recovery:1,poison:1},tags:['gem'],parts:{fitting:{recovery:1}}},
  'fish:0':{name:'Ward fish',rank:0,props:{ward:1},flavor:{savory:2},tags:['food','raw']},
  'fish:1':{name:'Cleansing fish',rank:0,props:{poison:-2},flavor:{savory:2},tags:['food','raw']},
  'fish:2':{name:'Silver fish',rank:1,props:{agi:1,int:1},flavor:{savory:2},tags:['food','raw']}
 };
 const books={
  spider:{key:'book:spider_notes',name:'A traveller’s journal',text:'The apothecary dried the spider’s legs beside the hearth, then ground them into a fine powder. A little restored the lightness of tired feet; a careless measure left the drinker ill.',facts:{'material:spider_leg':['agi','poison']}},
  tusk:{key:'book:smith_notes',name:'Workshop notes',text:'I kept the boar’s tusks when the others sold theirs. One made a light dagger blade; the other sat comfortably in a handle. A master can take apart a weapon made from separate pieces and preserve the sound components.',facts:{'material:boar_tusk':['str']}},
  venom:{key:'book:field_notes',name:'Field notes',text:'The scorpion’s gland kept its venom after the shell had dried. Cavefern tempered its poison, but did nothing for the weary feeling left by the extract.',facts:{'material:scorpion_gland':['poison','recovery'],'herb:cavefern':['poison']}},
  kitchen:{key:'book:kitchen_notes',name:'Kitchen notes',text:'Sweet berries softened the greens’ bitterness. A pinch of salt suited the meat; a handful spoiled the pot. Delicate leaves went in last, after the pan left the flame.',facts:{'material:berries':['agi'],'material:salt':['con'],'herb:moonleaf':['agi','recovery']}}
 };
 function state(){const m=env.memory();let s=m.materialWorkshop;if(!s||s.version!==1)s=m.materialWorkshop={version:1,knowledge:{},recipes:[],active:null,sequence:0};s.knowledge??={};s.recipes??=[];return s;}
 function rank(id){return cap(env.rank?.(id),0,3);}
 function item(key){return env.entries()[key];}
 function definition(value){const v=typeof value==='string'?(item(value)||{key:value}):value;if(!v)return null;const key=v.key||'';
  if(v.craftData?.version===1)return {name:v.name,kind:v.kind,rank:v.craftData.knowledgeRank??1,props:v.craftData.props||{},effects:v.craftData.effects,tags:v.craftData.tags||['extract'],color:v.craftData.color||'#b9b89a',parts:v.craftData.parts,flavor:v.craftData.flavor||{},delicate:false};
  if(materials[key])return {...materials[key],key};
  if(key.startsWith('powder:')){const original=materials['herb:'+key.slice(7)]||materials['material:'+key.slice(7)];if(original)return {...original,key,kind:'powder',delicate:false};}
  return null;
 }
 function known(value,discipline='alchemy'){const v=typeof value==='string'?(item(value)||{key:value}):value,d=definition(v);if(!d)return null;
  const k=state().knowledge[v.key]||{},r=rank(discipline),recognized=r>=d.rank||!!k.method;
  const names=Object.keys(d.props||{}).filter(id=>r>=d.rank||k[id]);return {recognized,props:Object.fromEntries(names.map(id=>[id,d.props[id]])),source:k.source||'',canRefine:recognized&&r>=Math.min(d.rank,2),parts:discipline==='smithing'&&recognized?Object.keys(d.parts||{}):[],rank:d.rank};
 }
 function learn(key,props,source){const d=definition(key);if(!d)return false;const k=state().knowledge[key]??={};k.method=true;k.source=String(source||'Experiment').slice(0,100);for(const id of props||Object.keys(d.props))if(effects[id])k[id]=true;env.save?.();return true;}
 function read(book){const b=Object.values(books).find(b=>b.key===(typeof book==='string'?book:book.key));if(!b)return false;for(const [key,ids]of Object.entries(b.facts))learn(key,ids,b.name);return true;}
 function inspect(key,discipline='alchemy'){const v=item(key),d=definition(v),k=known(v,discipline);if(!v)return null;return {key,name:v.name,count:v.count,...(!d?{}:k?.recognized?{properties:k.props,uses:discipline==='smithing'?k.parts:['refine','combine'],canRefine:k.canRefine,source:k.source}:{})};}
 function fingerprint(value){let h=2166136261;for(const ch of JSON.stringify(value))h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0).toString(36);}
 function merge(rows){const result=[];for(const id of Object.keys(effects)){const xs=rows.filter(e=>e.id===id&&Number.isFinite(e.amount)&&Number.isFinite(e.duration)&&e.duration>0).map(e=>({...e,start:cap(e.start,0,300),end:cap((e.start||0)+e.duration,0,300)})),ends=[...new Set(xs.flatMap(e=>[e.start,e.end]))].sort((a,b)=>a-b);for(let j=1;j<ends.length;j++){const amount=xs.filter(e=>e.start<=ends[j-1]&&e.end>=ends[j]).reduce((s,e)=>s+e.amount,0);if(Math.abs(amount)>.001){const next={id,amount:Math.round(cap(amount,-8,8)*100)/100,start:ends[j-1],duration:ends[j]-ends[j-1]},old=result.at(-1);if(old?.id===id&&old.amount===next.amount&&old.start+old.duration===next.start)old.duration+=next.duration;else result.push(next);}}}return result;}

 function properties(rows){const p={};for(const e of rows)if(!(e.start>0))p[e.id]=(p[e.id]||0)+e.amount;return p;}
 function rawEffects(v){const d=definition(v);if(!d)return [];return d.effects?clone(d.effects):Object.entries(d.props).map(([id,amount])=>({id,amount,duration:60}));}
 function available(mode){return Object.values(env.entries()).filter(v=>v.count>0&&definition(v)&&!v.craftData?.components&&!v.craftData?.component&&(mode!=='cooking'||definition(v).tags.some(t=>['food','seasoning','plant','extract'].includes(t))));}
 function start(mode,options={}){if(!['alchemy','cooking'].includes(mode)||state().active?.status==='playing'||env.canBegin?.()===false)return false;
  const operation=mode==='cooking'?'cook':options.operation||'brew';if(!['cook','brew','refine','isolate','concentrate','coating'].includes(operation)||operation==='isolate'&&(rank('alchemy')<2||!effects[options.property]))return false;
  const s=state();s.active={id:'batch-'+(++s.sequence),kind:mode==='cooking'?'fish':'alchemy',mode,operation,property:options.property||null,method:['fry','soup','roast'].includes(options.method)?options.method:'fry',status:'playing',elapsed:0,heat:55,temp:20,progress:0,stirAge:0,stirs:0,flips:0,side:0,brown:[0,0],scorch:0,inputs:[],actions:[],message:'Choose an ingredient.',guide:options.guide||null};env.event?.('craft_started','Started '+mode+'.',{operation});env.save?.();return s.active;}
 function add(key){const g=state().active,v=item(key),d=definition(v);if(g?.status!=='playing'||!v?.count||!d||g.inputs.length>=8||v.craftData?.components||v.craftData?.component)return false;
  if(g.mode==='cooking'&&!d.tags.some(t=>['food','plant','seasoning','extract'].includes(t)))return false;
  if(['refine','isolate','concentrate'].includes(g.operation)&&!known(v)?.canRefine)return false;
  if(g.operation==='isolate'&&!Object.hasOwn(known(v).props,g.property))return false;
  if(!env.take({[key]:1}))return false;
  g.inputs.push({item:clone({...v,count:1}),at:g.elapsed,delicate:!!d.delicate,damage:0,prepared:0});g.actions.push({action:'add',key,at:Math.round(g.elapsed*10)/10,heat:g.heat});g.message='Added '+v.name+'.';if(g.inputs.length===1||g.mode==='cooking'&&d.tags.includes('raw'))g.progress=0;env.save?.();return true;
 }
 function control(action,value){const g=state().active;if(g?.status!=='playing')return false;
  if(action==='heat')g.heat=cap(value,0,100);
  else if(action==='stir'){if(g.elapsed-(g.lastStir??-10)<.45)return false;g.stirAge=0;g.lastStir=g.elapsed;g.stirs++;g.message='Stirred.';}
  else if(action==='flip'){if(g.mode!=='cooking'||g.method==='soup'||g.elapsed-(g.lastFlip??-10)<.6)return false;g.side=1-g.side;g.flips++;g.lastFlip=g.elapsed;g.message='Turned.';}
  else return false;g.actions.push({action,value:action==='heat'?g.heat:undefined,at:Math.round(g.elapsed*10)/10});if(g.actions.length>160)g.actions.splice(0,g.actions.length-160);env.save?.();return true;
 }
 function tick(dt){const g=state().active;if(g?.status!=='playing')return false;dt=cap(dt,0,.2);g.elapsed+=dt;g.stirAge+=dt;g.temp+=(20+g.heat*.85-g.temp)*(1-Math.exp(-dt/2));if(!g.inputs.length)return true;
  const effective=g.temp>42&&g.temp<88;g.progress+=effective?dt*(g.operation==='refine'?.06:.045):g.temp>=88?dt*.025:0;
  if(g.temp>88)g.scorch+=(g.temp-88)*dt*.004;
  if(g.mode==='alchemy'||g.method==='soup'){if(g.stirAge>7&&g.temp>55)g.scorch+=dt*.017;}
  else {if(g.method==='roast')g.side=Math.floor(g.elapsed/4)%2;g.brown[g.side]+=Math.max(0,g.temp-42)*dt*.0012;if(g.brown[g.side]>1.15)g.scorch+=dt*.05;}
  for(const input of g.inputs){if(effective)input.prepared=(input.prepared||0)+dt*.05;}
  if(g.mode==='cooking')for(const input of g.inputs)if(definition(input.item).tags.includes('raw'))g.progress=Math.min(g.progress,input.prepared||0);
  for(const input of g.inputs)if(input.delicate&&g.temp>65)input.damage=cap(input.damage+(g.temp-65)*dt*.002,0,1);
  if(g.scorch>=1.5)finish(true);if(Math.floor(g.elapsed)!==g.savedSecond){g.savedSecond=Math.floor(g.elapsed);env.save?.();}return true;
 }
 function preview(g=state().active){if(!g)return null;const rows=[],flavor={sweet:0,bitter:0,salt:0,savory:0};let food=0,seasonings=0;const notes=[];
  for(const input of g.inputs){const d=definition(input.item),q=input.item.craftData?1:cap(input.item.quality??1,.1,1),survival=1-input.damage*.8;if(input.damage>.25)notes.push(input.item.name+' lost delicate properties to heat.');
   for(const e of rawEffects(input.item))rows.push({...e,amount:e.amount*q*survival});for(const [id,n]of Object.entries(d.flavor||{}))flavor[id]=(flavor[id]||0)+n;if(d.tags.includes('food'))food++;else if(d.tags.includes('seasoning')||d.tags.includes('plant')||d.tags.includes('extract'))seasonings++;
  }
  // Flavor is another opposing-property system; seasoning tolerance follows portions.
  let flavorPenalty=0;if(g.mode==='cooking'){const balance=flavor.sweet-flavor.bitter;flavorPenalty=Math.max(0,Math.abs(balance)-2)*.08+Math.max(0,flavor.salt-Math.max(1,food))*.18+Math.max(0,seasonings-Math.max(2,food*2))*.12;
   if(flavor.sweet&&flavor.bitter)notes.push('Sweetness balanced bitterness.');if(flavor.salt>0&&flavor.salt<=Math.max(1,food)&&flavor.savory>0){rows.push({id:'con',amount:.25,duration:60});notes.push('Salt complemented the savory ingredients.');}if(flavorPenalty>.1)notes.push('Too much seasoning overpowered the dish.');
  }
  let quality=cap(1-g.scorch*.5-flavorPenalty-(g.mode==='cooking'&&g.method==='fry'&&g.flips<1?.2:0),.1,1),combined=merge(rows);
  const ids=new Set(rows.map(e=>e.id));for(const id of ids)if(rows.some(e=>e.id===id&&e.amount>0)&&rows.some(e=>e.id===id&&e.amount<0))notes.push(effects[id].name+': opposing properties balanced each other.');
  if(g.operation==='coating'){combined=combined.filter(e=>['poison','burn'].includes(e.id)&&e.amount>0);notes.push('Coatings carry poison or burn on physical hits.');}
  if(g.operation==='isolate'){combined=combined.filter(e=>e.id===g.property);quality*=.75;notes.push('Isolation retained one property and reduced the yield.');}
  if(g.operation==='concentrate'){combined=combined.map(e=>({...e,amount:cap(e.amount*.8,-8,8)}));notes.push('Several measures concentrated into one; some potency was lost.');}
  if(g.mode==='alchemy'&&g.operation==='brew'&&g.stirs<1)quality*=.6;
  combined=combined.map(e=>({...e,amount:Math.round(e.amount*quality*100)/100}));return {effects:combined,props:properties(combined),flavor,quality,food,notes};
 }
 function finish(forced=false){const g=state().active;if(g?.status!=='playing')return false;if(!g.inputs.length||!forced&&g.progress<1){g.message='Keep a gentle heat until ready.';return false;}
  const result=preview(g),needsTwo=['concentrate'].includes(g.operation);if(!forced&&needsTwo&&g.inputs.length<2){g.message='Use at least two measures to concentrate.';return false;}
  const good=!forced&&g.scorch<1.25&&(g.mode!=='cooking'||result.food>0)&&result.quality>=.25&&result.effects.length>0;
  g.status=good?'success':'failed';g.result=result;
  if(good){const powder=['refine','isolate','concentrate'].includes(g.operation),coating=g.operation==='coating';const name=g.mode==='cooking'?({fry:'Pan meal',soup:'Stew',roast:'Roast'}[g.method]):powder?(g.property?effects[g.property].name+' powder':g.inputs.length===1?g.inputs[0].item.name+' powder':'Mixed powder'):coating?'Weapon coating':'Potion';
   const data={version:1,form:g.mode==='cooking'?'meal':powder?'powder':coating?'coating':'potion',props:result.props,effects:result.effects,tags:[powder?'extract':coating?'coating':'consumable'],flavor:result.flavor,color:effects[Object.keys(result.props)[0]]?.color||'#a5be86',origin:g.inputs.map(v=>v.item.key)};
   let output={key:'craft:'+data.form+':'+fingerprint(data),name,kind:powder?'powder':'consumable',effect:'crafted',quality:result.quality,grade:result.quality>=.86?'Perfect':result.quality>=.62?'Good':'Rustic',craftData:data};
   output=env.output?.(g,result,output)||output;
   if(!env.add(output,1)){g.status='failed';g.message='The result could not be stored.';env.save?.();return false;}g.output=output;learn(output.key,Object.keys(data.props),'Experiment');
   for(const input of g.inputs)learn(input.item.key,Object.keys(definition(input.item).props),'Experiment');
   g.message=name+' ready.';
  }else g.message=g.scorch>=1.25?'The batch scorched.':g.mode==='cooking'&&!result.food?'Seasoning alone did not make a meal.':g.operation==='coating'&&!result.effects.length?'The mixture has no poison or burn to coat a weapon.':'The mixture spoiled.';
  env.finish?.(g,good);env.event?.(g.mode==='cooking'?'cooking_result':'alchemy_result',g.message,{success:good,quality:result.quality,properties:result.props,notes:result.notes});env.save?.();return good;
 }
 function saveRecipe(name){const g=state().active;if(g?.status!=='success'||!g.output)return false;const recipe={name:String(name||g.output.name).slice(0,60),mode:g.mode,operation:g.operation,property:g.property,method:g.method,ingredients:g.inputs.map(i=>i.item.key),actions:clone(g.actions),id:fingerprint([g.mode,g.operation,g.inputs.map(i=>i.item.key),g.property])};const list=state().recipes,i=list.findIndex(r=>r.id===recipe.id);if(i>=0)list[i]=recipe;else list.push(recipe);if(list.length>60)list.shift();env.save?.();return recipe;}
 function abandon(){const g=state().active;if(g?.status==='playing'){g.status='failed';g.message='Work abandoned.';env.finish?.(g,false);}state().active=null;env.save?.();return true;}
 function component(value,slot){const v=typeof value==='string'?item(value):value;if(!v)return null;
  if(v.craftData?.component){if(v.craftData.component.slot!==slot)return null;return {key:v.key,kind:'material',name:v.name,craftData:clone(v.craftData)};}
  const d=definition(v),props=d?.parts?.[slot];if(!props)return null;const data={version:1,form:'component',props:clone(props),tags:['component'],color:d.color||'#b8a889',component:{slot,source:v.key,quality:cap(v.quality??1,.1,1)}};
  return {key:'craft:part:'+fingerprint(data),kind:'material',name:d.name+' '+({head:'blade',grip:'handle',fitting:'fitting'}[slot]),craftData:data};
 }
 function assemble(selection){if(rank('smithing')<3||state().active?.status==='playing'||env.canBegin?.()===false)return {ok:false,error:'Requires Master Smithing.'};
  const form=['dagger','sword','staff'].includes(selection?.form)?selection.form:'dagger',parts=[],req={};for(const slot of ['head','grip','fitting']){const key=selection?.[slot];if(!key&&slot==='fitting')continue;const p=component(key,slot);if(!key||!p)return {ok:false,error:'Choose a suitable '+slot+'.'};req[key]=(req[key]||0)+1;parts.push(p);}
  const originals=Object.fromEntries(Object.keys(req).map(k=>[k,clone(item(k)||{})]));
  if(parts.length<2||!env.take(req))return {ok:false,error:'Missing components.'};
  const rows=parts.flatMap(p=>Object.entries(p.craftData.props).map(([id,amount])=>({id,amount:amount*p.craftData.component.quality,duration:60}))),props=properties(merge(rows)),data={version:1,form:'weapon',weaponType:form,props,effects:merge(rows),components:parts,tags:['weapon']};
  const signature=fingerprint(data),output={key:'craft:weapon:'+signature,name:'Crafted '+form,kind:'equipment',spellId:2000000+parseInt(signature,36)%100000000,craftData:data,grade:'Good',quality:.7};
  if(!env.add(output,1)){for(const [key,n]of Object.entries(req))env.add(originals[key],n);return {ok:false,error:'Unable to store weapon.'};}env.event?.('weapon_assembled','Assembled a '+form+'.',{properties:props,components:parts.map(p=>p.name)});env.save?.();return {ok:true,item:output};
 }
 function disassemble(key){const v=item(key);if(state().active?.status==='playing'||env.canBegin?.()===false)return {ok:false,error:'Finish your current work first.'};if(rank('smithing')<3)return {ok:false,error:'Requires Master Smithing.'};if(!v?.craftData?.components?.length)return {ok:false,error:'This weapon was not made from recoverable components.'};if(env.equipped?.(v))return {ok:false,error:'Unequip the weapon first.'};if(!env.take({[key]:1}))return {ok:false,error:'Weapon unavailable.'};for(const p of v.craftData.components)env.add(clone(p),1);env.event?.('weapon_disassembled','Recovered the weapon’s components.',{});env.save?.();return {ok:true,parts:clone(v.craftData.components)};}
 function reward(spec){if(!spec||!['potion','meal','powder','coating'].includes(spec.form))throw Error('Unsupported reward form.');const entries=Object.entries(spec.props||{});if(!entries.length||entries.length>4||entries.some(([id,n])=>!effects[id]||!Number.isFinite(n)||Math.abs(n)>2||n===0))throw Error('Use one to four supported properties, each between -2 and 2.');if(spec.form==='coating'&&entries.some(([id,n])=>!['poison','burn'].includes(id)||n<=0))throw Error('Coatings require poison or burn.');const duration=cap(spec.duration??60,5,120),data={version:1,form:spec.form,props:Object.fromEntries(entries),effects:entries.map(([id,amount])=>({id,amount,start:0,duration})),tags:[spec.form==='powder'?'extract':'consumable'],color:effects[entries[0][0]].color,origin:['reward'],knowledgeRank:1};return {key:'craft:reward:'+fingerprint(data),name:String(spec.name||({potion:'Potion',meal:'Meal',powder:'Powder',coating:'Coating'}[spec.form])).slice(0,60),kind:spec.form==='powder'?'powder':'consumable',effect:'crafted',craftData:data};}
 function describe(v,discipline='alchemy'){const k=known(v,discipline);if(!k?.recognized)return 'Sellable material.';const props=Object.entries(k.props).map(([id,n])=>(n>0?'+':'')+Math.round(n*100)/100+' '+effects[id].name).join(' · ');return [props,discipline==='smithing'&&k.parts.length?'Component: '+k.parts.join(', '):k.canRefine?'Can be refined.':'Preparation needs more skill.'].filter(Boolean).join(' · ');}
 return {materials,effects,books,state,rank,definition,known,learn,read,inspect,merge,properties,available,start,add,control,tick,preview,finish,saveRecipe,abandon,component,assemble,disassemble,reward,describe,fingerprint};
}
/* BM_MATERIALS_END */
