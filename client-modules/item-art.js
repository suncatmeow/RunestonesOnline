const BMItemArt=(()=>{
  const models=new Map(),books=new Map(),cards=new Map(),potions=new Map(),powders=new Map();
  // Stoppered jars make powders readable even at inventory-thumbnail size.
  function powderMesh(color){
    if(powders.has(color))return powders.get(color);
    const m={vertices:[],faces:[],outwardRects:true},rgb={r:parseInt(color.slice(1,3),16)/255,g:parseInt(color.slice(3,5),16)/255,b:parseInt(color.slice(5,7),16)/255};
    const part=(type,x,y,z,sx,sy,sz,c)=>add3dShapeRigged(m,type,{x,y,z,rx:0,ry:0,rz:0},sx,sy,sz,c);
    const glass={r:.43,g:.61,b:.62},rim={r:.72,g:.84,b:.81};
    part('rec',0,.12,0,.39,.43,.29,glass);part('rec',0,.23,-.025,.32,.29,.29,rgb);
    part('arc',0,-.30,0,.39,.15,.29,glass);part('rec',0,-.48,0,.19,.15,.19,rim);
    part('rec',0,-.64,0,.20,.06,.20,{r:.45,g:.28,b:.14});part('rec',0,.13,-.326,.25,.15,.013,{r:.91,g:.85,b:.65});
    part('arc',0,.13,-.345,.075,.08,.018,rgb);part('rec',-.29,-.03,-.31,.022,.20,.012,{r:.9,g:.99,b:.95});
    prepareSpriteNormals(m);powders.set(color,m);return m;
  }
  const materials=new Map();
  function materialMesh(subject){
    const kind=/thread|silk|string/.test(subject)?'thread':/claw/.test(subject)?'claw':/tusk/.test(subject)?'tusk':'tooth';if(materials.has(kind))return materials.get(kind);
    const m={vertices:[],faces:[],outwardRects:true},ivory={r:.91,g:.83,b:.63},root={r:.43,g:.32,b:.20};
    const part=(type,x,y,z,sx,sy,sz,c,rx=0,rz=0)=>add3dShapeRigged(m,type,{x,y,z,rx,ry:0,rz},sx,sy,sz,c);
    if(kind==='thread'){
      const wood={r:.43,g:.24,b:.10};part('arc',0,0,0,.23,.56,.23,wood);for(const y of [-.56,.56])part('arc',0,y,0,.44,.075,.44,wood);
      for(let i=0;i<13;i++)part('arc',0,-.46+i*.077,0,.38,.035,.38,i%2?ivory:{r:.75,g:.63,b:.44});
      part('rec',.48,.36,0,.025,.28,.025,ivory,0,-.5);
    }else{
      const count=kind==='claw'?3:1,N=8;
      for(let t=0;t<count;t++){
        const ox=(t-(count-1)/2)*.38,scale=count===3?.68:1,start=m.vertices.length;
        const rings=kind==='tusk'?[[0,-.63,.21],[.17,-.34,.19],[.26,.04,.15],[.18,.38,.085],[0,.61,.03]]:[[0,-.62,.20],[.13,-.35,.18],[.22,-.04,.13],[.17,.29,.067],[0,.62,.018]];
        for(const [x,y,r]of rings)for(let i=0;i<N;i++){const a=i*Math.PI*2/N;m.vertices.push([ox+(x+r*Math.cos(a))*scale,y*scale,(r*Math.sin(a))*scale]);}
        const tip=m.vertices.length;m.vertices.push([ox-.13*scale,.76*scale,0]);
        for(let j=0;j<rings.length;j++)for(let i=0;i<N;i++){const a=start+j*N+i,b=start+j*N+(i+1)%N,c=j===rings.length-1?tip:start+(j+1)*N+(i+1)%N,d=start+(j+1)*N+i;m.faces.push({indices:(j===rings.length-1?[a,b,c]:[a,b,c,d]).reverse(),color:j===0?root:ivory});}
        m.faces.push({indices:Array.from({length:N},(_,i)=>start+i),color:root});
      }
    }
    prepareSpriteNormals(m);materials.set(kind,m);return m;
  }
  const plants=new Map();
  function herbMesh(value){
    const id=String(value||'moonleaf').split(':').at(-1);if(plants.has(id))return plants.get(id);
    const m={vertices:[],faces:[],outwardRects:true},green={r:.26,g:.49,b:.29},light={r:.48,g:.65,b:.38},stem={r:.34,g:.39,b:.18};
    const p=(shape,x,y,z,sx,sy,sz,c,rz=0,ry=0)=>add3dShapeRigged(m,shape,{x,y,z,rx:0,ry,rz},sx,sy,sz,c);
    if(/glowcap|mushroom/.test(id)){
      for(const [x,y,z,k]of [[-.24,.22,-.1,.7],[.22,-.12,.12,1]]){p('arc',x,y+.23,z,.075*k,.43*k,.075*k,{r:.74,g:.82,b:.70});p('arc',x,y-.17,z,.37*k,.16*k,.33*k,{r:.25,g:.70,b:.72});for(const a of [-.8,.5,2.1])p('arc',x+Math.cos(a)*.2*k,y-.30,z+Math.sin(a)*.18*k,.043*k,.024*k,.043*k,{r:.83,g:1,b:.89});}
    }else if(/bitterroot/.test(id)){
      p('arc',0,.28,0,.19,.42,.15,{r:.55,g:.34,b:.23});for(const [x,rz]of [[-.16,.4],[.15,-.3]])p('arc',x,.61,0,.045,.28,.05,{r:.62,g:.44,b:.29},rz);
      for(let i=0;i<5;i++){const a=i*1.26;p('arc',Math.cos(a)*.24,-.34,Math.sin(a)*.16,.10,.34,.08,i%2?light:green,Math.cos(a)*.5,a);}
    }else{
      const fern=/fern/.test(id),sage=/sunsage/.test(id),leaf=sage?{r:.46,g:.59,b:.32}:fern?{r:.33,g:.68,b:.47}:{r:.55,g:.74,b:.66};
      for(let j=0;j<3;j++){const x=(j-1)*.22,z=(j%2)*.16-.08,top=-.62+(j%2)*.12;p('arc',x,(top+.6)/2,z,.025,(.6-top)/2,.025,stem);
        const count=fern?6:3;for(let k=0;k<count;k++)for(const side of [-1,1]){const y=top+.18+k*(fern?.14:.25),dx=side*(fern?.12:.17),turn=j*.65;
          p('arc',x+dx,y-.05,z+side*.045,fern?.18:.20,fern?.037:.08,fern?.045:.07,leaf,-side*.38,turn);
          p('rec',x+dx*.85,y-.04,z-.05,.12,.008,.008,light,-side*.38,turn);
        }
        if(sage)for(let k=0;k<3;k++)p('arc',x,top-k*.06,z,.061,.047,.06,{r:.93,g:.72,b:.25});
      }
    }
    prepareSpriteNormals(m);plants.set(id,m);return m;
  }
  function animalMaterial(subject){const hide=/fur|hide|skin|leather|pelt/.test(String(subject)),key=hide?'hide':'meat';if(materials.has(key))return materials.get(key);
    const m={vertices:[],faces:[],outwardRects:true},p=(shape,x,y,z,sx,sy,sz,c,rz=0)=>add3dShapeRigged(m,shape,{x,y,z,rx:0,ry:0,rz},sx,sy,sz,c);
    if(hide){const outline=[[-.30,-.58],[.12,-.62],[.40,-.46],[.55,-.55],[.63,-.30],[.38,-.16],[.43,.20],[.61,.44],[.40,.60],[.20,.48],[-.16,.58],[-.37,.48],[-.57,.60],[-.65,.37],[-.43,.18],[-.40,-.17],[-.61,-.36],[-.49,-.54]],n=outline.length;
     for(const z of [-.065,.065])for(const [x,y]of outline)m.vertices.push([x,y,z]);m.faces.push({indices:outline.map((_,i)=>i).reverse(),color:{r:.44,g:.27,b:.14}},{indices:outline.map((_,i)=>n+i),color:{r:.64,g:.44,b:.26}});
     for(let i=0;i<n;i++)m.faces.push({indices:[i,(i+1)%n,(i+1)%n+n,i+n],color:{r:.31,g:.19,b:.10}});
     for(let i=0;i<12;i++){const x=(i%3-1)*.21,y=Math.floor(i/3)*.24-.36;p('tri',x,y,-.075,.06,.10,.025,{r:.54+(i%2)*.07,g:.35,b:.19},.18);}
    }else{const flesh={r:.62,g:.18,b:.16},fat={r:.88,g:.69,b:.54};p('arc',-.08,.03,0,.50,.34,.30,flesh);p('arc',.23,-.22,.04,.29,.24,.24,{r:.73,g:.25,b:.22});p('rec',.41,.20,.03,.31,.065,.07,fat,.42);for(const y of [.25,.36])p('arc',.65,y,.03,.10,.09,.085,fat);for(let i=0;i<3;i++)p('arc',-.30+i*.19,-.02,-.267,.035,.14,.015,fat,-.35);}
    prepareSpriteNormals(m);materials.set(key,m);return m;
  }
  function scrapMesh(){if(materials.has('scrap'))return materials.get('scrap');const m={vertices:[],faces:[],outwardRects:true};
    const p=(x,y,z,sx,sy,sz,c,rx,rz)=>add3dShapeRigged(m,'rec',{x,y,z,rx,ry:.2,rz},sx,sy,sz,c);
    p(-.17,.1,.04,.38,.10,.29,{r:.40,g:.46,b:.48},.3,-.42);p(.18,-.18,-.1,.30,.07,.17,{r:.64,g:.68,b:.67},-.35,.47);p(.05,.3,-.2,.34,.055,.12,{r:.49,g:.30,b:.18},-.3,-.2);
    for(let i=0;i<4;i++)p(-.32+i*.15,-.02,-.27,.025,.03,.018,{r:.77,g:.75,b:.62},0,-.42);prepareSpriteNormals(m);materials.set('scrap',m);return m;
  }
  function bookMesh(magic=true){
    if(books.has(magic))return books.get(magic);
    const m={vertices:[],faces:[],outwardRects:true};
    const color=(r,g,b)=>({r,g,b}),cover=magic?color(.18,.12,.35):color(.31,.15,.075),gold=color(.87,.66,.27),paper=color(.86,.79,.61),ink=color(.055,.045,.09);
    const part=(type,x,y,z,sx,sy,sz,c,rz=0)=>add3dShapeRigged(m,type,{x,y,z,rx:0,ry:0,rz},sx,sy,sz,c);
    // Separate covers, exposed page block, rounded spine, binding ribs and clasp.
    part('rec',.02,0,0,.50,.68,.135,paper);
    for(const z of [-.19,.19]){part('rec',0,0,z,.57,.76,.045,cover);for(const x of [-.46,.46])for(const y of [-.65,.65])part('rec',x,y,z+(z<0?-.05:.05),.085,.085,.015,gold);}
    part('arc',-.55,0,0,.095,.76,.235,cover);
    for(const y of [-.52,-.26,.26,.52])part('rec',-.565,y,0,.09,.027,.245,gold);
    for(let y=-.61;y<=.61;y+=.065)part('rec',.525,y,0,.009,.004,.13,gold);
    part('rec',0,-.20,-.243,.37,.32,.007,ink);
    part('rec',0,-.20,-.257,.22,.22,.018,gold,Math.PI/4);
    part('arc',0,-.20,-.29,.13,.17,.07,magic?color(.35,.82,.96):cover);
    // An embossed back makes the volume recognizable through a full rotation.
    part('rec',0,0,.245,.25,.34,.008,gold);part('rec',0,0,.257,.23,.32,.008,cover);
    part('rec',0,0,.270,.10,.10,.009,gold,Math.PI/4);
    for(const y of [.26,.34,.42])part('rec',0,y,-.245,.27,.009,.008,gold);
    part('rec',.47,.12,-.245,.17,.065,.018,gold);part('arc',.47,.12,-.272,.025,.03,.014,paper);
    part('rec',.20,.81,.10,.055,.16,.018,magic?color(.25,.63,.78):color(.55,.09,.12));
    prepareSpriteNormals(m);books.set(magic,m);return m;
  }
  function potionMesh(color){
    if(potions.has(color))return potions.get(color);const m={vertices:[],faces:[],outwardRects:true},rgb={r:parseInt(color.slice(1,3),16)/255,g:parseInt(color.slice(3,5),16)/255,b:parseInt(color.slice(5,7),16)/255};
    const part=(shape,x,y,z,sx,sy,sz,c)=>add3dShapeRigged(m,shape,{x,y,z,rx:0,ry:0,rz:0},sx,sy,sz,c);
    part('arc',0,.15,0,.43,.49,.30,{r:.61,g:.70,b:.68});part('arc',0,.20,-.10,.34,.34,.25,rgb);part('rec',0,-.44,0,.16,.22,.17,{r:.73,g:.82,b:.78});part('rec',0,-.69,0,.18,.065,.18,{r:.43,g:.27,b:.13});part('rec',-.21,.09,-.34,.035,.18,.012,{r:.9,g:.97,b:.91});prepareSpriteNormals(m);potions.set(color,m);return m;
  }
  function spriteModel(id){
    if(models.has(id))return models.get(id);
    const d=spriteDefinition(id);if(!d)return null;
    const had=Object.hasOwn(window,'cacheAngle'),old=window.cacheAngle;let mesh;
    try{window.cacheAngle=0;mesh=drawSpritePaths(d.base,5,5,9,0,0,0,d.variant,true);}finally{if(had)window.cacheAngle=old;else delete window.cacheAngle;}
    if(!mesh?.vertices?.length||!mesh.faces?.length)return null;
    prepareSpriteNormals(mesh);const bounds=[Infinity,Infinity,-Infinity,-Infinity];
    for(let dir=0;dir<8;dir++){const b=spriteBoundsForView(mesh,dir);for(let i=0;i<4;i++)bounds[i]=i<2?Math.min(bounds[i],b[i]):Math.max(bounds[i],b[i]);}
    const scale=Math.min(7.8/((bounds[2]-bounds[0])/.9),7.8/((bounds[3]-bounds[1])/.9))*.9;
    const result={mesh,scale,x:5-((bounds[0]+bounds[2])/2-.5)/.9*scale,y:5-((bounds[1]+bounds[3])/2-.45)/.9*scale};
    if(models.size>=48)models.delete(models.keys().next().value);models.set(id,result);return result;
  }
  function lampMesh(){
    if(materials.has('lamp'))return materials.get('lamp');
    const m={vertices:[],faces:[],outwardRects:true},gold={r:.86,g:.62,b:.20},dark={r:.48,g:.28,b:.08};
    const p=(shape,x,y,z,sx,sy,sz,c,rz=0)=>add3dShapeRigged(m,shape,{x,y,z,rx:0,ry:0,rz},sx,sy,sz,c);
    p('arc',0,.1,0,.48,.24,.31,gold);p('arc',0,.36,0,.25,.06,.20,dark);p('arc',0,-.17,0,.33,.08,.24,gold);p('arc',0,-.29,0,.06,.08,.06,gold);
    p('rec',.48,-.01,0,.26,.075,.075,gold,-.42);p('arc',.70,-.16,0,.10,.05,.08,dark);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;p('arc',-.47+Math.cos(a)*.20,-.07+Math.sin(a)*.22,0,.05,.05,.05,gold);}
    prepareSpriteNormals(m);materials.set('lamp',m);return m;
  }
  function artwork(picture){
    picture=BMArtwork.normalize(picture);
    if(BMPortableArt.has(picture))return {kind:'mesh',mesh:BMPortableArt.mesh(picture)};
    const model=BMInventoryModels.mesh(picture);if(model)return {kind:'mesh',mesh:model};
    const upgraded=MODEL_UPGRADES[picture]?.id;
    if(spriteDefinition(upgraded))return {kind:'sprite',id:upgraded};
    return spriteDefinition(picture)?{kind:'sprite',id:picture}:{kind:'portrait',id:picture};
  }
  function portrait(value){
    const id=BMInventoryModels.source(value);
    if(id===89||id===98)return artwork(375);
    if(id===44)return {kind:'mesh',mesh:lampMesh(),scale:15};
    if(BMPortableArt.has(id))return {kind:'mesh',mesh:BMPortableArt.mesh(id),...(id===1008?{scale:18}:{})};
    if(id===31||id===1123)return {kind:'book',magic:true};
    const named={22:'Wand',50:'Sword',64:'Shield',36:'Hourglass'};
    if(named[id])return {kind:'mesh',mesh:BMMenuModels.mesh(named[id])};
    const mesh=BMInventoryModels.mesh(id);if(mesh)return {kind:'mesh',mesh};
    const summon=SPELL_REGISTRY[id]?.summonType;
    if(summon!==undefined)return artwork(MODEL_UPGRADES[summon]?.id??summon);
    // A card's artwork is only its subject. Card borders and rules belong to cardPortrait().
    return artwork(BMArtwork.cardPortrait(id));
  }
  const previewFits=new WeakMap();
  function fitPreview(mesh){
    let fit=previewFits.get(mesh);if(fit)return fit;
    const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
    for(const v of mesh.vertices)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i]);}
    const center=lo.map((n,i)=>(n+hi[i])/2),size=Math.max(...hi.map((n,i)=>n-lo[i]),.001);
    // Work on a copy: fitted thumbnails must never resize world meshes or hitboxes.
    const copy={...mesh,vertices:mesh.vertices.map(v=>v.map((n,i)=>(n-center[i])*1.6/size))};
    const bounds=[Infinity,Infinity,-Infinity,-Infinity];
    for(let i=0;i<=12;i++){const q=spriteRotation(.12,-.25+i*.1,0);for(const v of copy.vertices){const p=projectVertex3D(rotateSpritePoint(v,q),1,0,0,4);bounds[0]=Math.min(bounds[0],p[0]);bounds[1]=Math.min(bounds[1],p[1]);bounds[2]=Math.max(bounds[2],p[0]);bounds[3]=Math.max(bounds[3],p[1]);}}
    const scale=7.6/Math.max(bounds[2]-bounds[0],bounds[3]-bounds[1],.001);
    fit={mesh:copy,scale,x:5-(bounds[0]+bounds[2])*scale/2,y:5-(bounds[1]+bounds[3])*scale/2};previewFits.set(mesh,fit);return fit;
  }
  function preview(art){return {...art,itemSprite:false,inventoryPreview:true};}
  function preparePreview(art){
    art.previewReady=true;
    let mesh=art.mesh;
    if(art.kind==='sprite')mesh=spriteModel(art.id)?.mesh;
    else if(art.kind==='powder')mesh=powderMesh(art.color);
    else if(art.kind==='potion')mesh=potionMesh(art.color);
    else if(art.kind==='material')mesh=materialMesh(art.subject);
    else if(art.kind==='book')mesh=bookMesh(art.magic);
    else if(art.kind==='fish')mesh=BMFishSprites.mesh(art.id);
    else if(art.kind==='scroll')mesh=BMPortableArt.mesh(1133);
    if(mesh?.vertices?.length&&mesh.faces?.length){art.previewFit=fitPreview(mesh);art.previewMesh=mesh;}
    return art;
  }

  function resolveBase(item={}){
    item={...item};for(const key of ['spriteId','portraitId','spellId']){const n=BMArtwork.id(item[key]);if(n!==null)item[key]=n;}
    if(item.kind==='skillbook'||item.kind==='book')return {kind:'book',magic:item.kind==='skillbook'||item.magic===true};
    if(item.kind==='powder'){const id=item.herbId||String(item.key).split(':')[1],herb=BMHerbs.species.find(h=>h.id===id),color=herb?.color||'#d7c4a0';return {kind:'powder',color,glow:['glowcap','cavefern'].includes(id),mesh:powderMesh(color)};}
    if(item.kind==='material'&&/meat|fur|hide|skin|leather|pelt/.test(String(item.key)))return {kind:'mesh',mesh:animalMaterial(item.key)};
    if(item.kind==='material'&&/tooth|teeth|fang|tusk|claw|thread|silk|string/.test(String(item.key)))return {kind:'mesh',mesh:materialMesh(item.key)};
    if(/metal.?scrap/i.test(String(item.key)+' '+String(item.name)))return {kind:'mesh',mesh:scrapMesh()};
    if(item.kind==='herb')return {kind:'mesh',mesh:herbMesh(item.herbId||String(item.key).split(':')[1]),glow:/glowcap|cavefern/.test(String(item.key))};
    // Native item identity wins over generic legacy inventory-bag portraits.
    if(['equipment','artifact'].includes(item.kind)){
      const id=Number(item.spellId??/^equipment:(\d+)/.exec(String(item.key))?.[1]);
      if(Number.isFinite(id)&&(SPELL_REGISTRY[id]||CARD_MANIFEST_DB[id]))return portrait(id);
    }
    if(Number.isFinite(item.spriteId)&&BMPortableArt.has(item.spriteId))return {kind:'mesh',mesh:BMPortableArt.mesh(item.spriteId)};
    if(Number.isFinite(item.spriteId)&&spriteDefinition(item.spriteId))return {kind:'sprite',id:item.spriteId};
    if(Number.isFinite(item.portraitId)&&BMPortableArt.has(item.portraitId))return {kind:'mesh',mesh:BMPortableArt.mesh(item.portraitId)};
    if(Number.isFinite(item.portraitId)&&spriteDefinition(item.portraitId))return {kind:'sprite',id:item.portraitId};
    if(Number.isFinite(item.spriteId)&&BMArtwork.exists(item.spriteId))return artwork(item.spriteId);
    if(Number.isFinite(item.portraitId)&&BMArtwork.exists(item.portraitId))return artwork(item.portraitId);
    const key=String(item.key||''),name=String(item.name||'');
    if(item.kind==='scroll')return {kind:'mesh',mesh:BMPortableArt.mesh(1133)};
    if(key==='material:wolf_tooth')return {kind:'mesh',mesh:BMPortableArt.mesh(1134)};
    if(typeof BMItemRules!=='undefined'){const potion=BMItemRules.potionArt(item);if(potion)return potion;}
    const meal=globalThis.BMTavern?.mealArt(key);if(meal)return {kind:'mesh',mesh:meal};
    if(item.kind==='consumable'&&/cooked:meat/.test(key))return {kind:'sprite',id:326};
    if(item.kind==='consumable'&&key.startsWith('dish:')){const m={vertices:[],faces:[],outwardRects:true};for(const [y,sy,color]of [[.14,.32,{r:.43,g:.27,b:.12}],[-.17,.045,{r:.68,g:.59,b:.31}]])add3dShapeRigged(m,'arc',{x:0,y,z:0,rx:0,ry:0,rz:0},.65,sy,.5,color);prepareSpriteNormals(m);return {kind:'mesh',mesh:m};}
    if(item.kind==='powder'){const id=item.herbId||key.split(':')[1],herb=BMHerbs.species.find(h=>h.id===id),color=herb?.color||'#d7c4a0';return {kind:'powder',color,glow:['glowcap','cavefern'].includes(id),mesh:powderMesh(color)};}
    if(item.kind==='fish'||item.fishIndex!==undefined)return {kind:'fish',id:item.fishIndex||0};
    if(/mushroom|glowcap/i.test(key+' '+name))return {kind:'mesh',mesh:herbMesh('glowcap'),glow:/glowcap/i.test(key+' '+name)};
    if(item.kind==='herb'||/material:grass/.test(key))return {kind:'mesh',mesh:herbMesh(item.herbId||'moonleaf'),glow:/cavefern/.test(key)};
    if(/material:meat/.test(key))return {kind:'mesh',mesh:animalMaterial('meat')};
    if(/material:fur/.test(key))return {kind:'mesh',mesh:animalMaterial('fur')};
    if(item.kind==='equipment'&&Number(item.spellId??1008)===1008)return {kind:'mesh',mesh:BMPortableArt.mesh(1008),scale:18};
    if(item.kind==='equipment')return portrait(item.spellId);
    if(item.kind==='artifact'&&Number.isFinite(item.spellId)&&(SPELL_REGISTRY[item.spellId]||CARD_MANIFEST_DB[item.spellId]))return portrait(item.spellId);
    if(item.kind==='consumable')return {kind:'mesh',mesh:BMShopModels.mesh('use')};
    if(/magicward/.test(key))return {kind:'sprite',id:329,glow:true};
    if(/tooth|teeth|fang|tusk|claw|thread|silk/.test(key))return {kind:'mesh',mesh:materialMesh(key)};
    return {kind:'mesh',mesh:BMShopModels.mesh('misc')};
  }
  function resolve(item={}){const art={...resolveBase(item),itemSprite:true};
    if(Number.isFinite(item.quality)||item.grade){const perfect=Number.isFinite(item.quality)?item.quality>=.99:item.grade==='Perfect',natural=art.kind==='powder'&&['glowcap','cavefern'].includes(item.herbId||String(item.key).split(':')[1]);return {...art,glow:perfect||natural,perfect};}
    return art;
  }
  function draw(art,now=0,reduced=false){
    if(art.itemSprite){now=0;reduced=true;}
    if(art.inventoryPreview&&!art.previewReady)preparePreview(art);
    const angle=art.inventoryPreview?(reduced?.35:.35+Math.sin(now/3200)*.50):(reduced?.45:now/2600+.45),u=tL/10;
    ctx.save();
    if(art.kind==='potion'&&art.glow){const g=ctx.createRadialGradient(tL*.5,tH*.5,4,tL*.5,tH*.5,tL*.44);g.addColorStop(0,art.color+'66');g.addColorStop(1,art.color+'00');ctx.fillStyle=g;ctx.fillRect(0,0,tL,tH);}
    if(art.kind==='book'&&art.magic||art.glow&&art.kind!=='potion'){
      const g=ctx.createRadialGradient(tL*.5,tH*.5,4,tL*.5,tH*.5,tL*.48);g.addColorStop(0,art.color?art.color+'66':'rgba(93,188,255,.32)');g.addColorStop(1,art.color?art.color+'00':'rgba(93,120,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,tL,tH);
      ctx.fillStyle='#9de8ff';for(let i=0;i<7;i++){const a=i*Math.PI*2/7+(reduced?0:now/6000),r=tL*(.30+.04*Math.sin(i));ctx.globalAlpha=.45+.25*Math.sin(i+(reduced?0:now/600));ctx.fillRect(tL*.5+Math.cos(a)*r,tH*.5+Math.sin(a)*r,2,2);}ctx.globalAlpha=1;
    }
    if(art.previewFit){const f=art.previewFit;render3dMesh(f.mesh,f.x,f.y,f.scale,.12,angle,0);}
    else if(art.kind==='powder')render3dMesh(art.mesh||powderMesh(art.color),5,5,11,.12,angle,0);
    else if(art.kind==='potion')render3dMesh(potionMesh(art.color),5,5,11,.12,angle,0);
    else if(art.kind==='scroll'){ctx.fillStyle='#e8d9ae';ctx.strokeStyle='#927a4b';ctx.lineWidth=2;ctx.fillRect(tL*.28,tH*.21,tL*.44,tH*.58);ctx.strokeRect(tL*.28,tH*.21,tL*.44,tH*.58);for(const y of [.21,.79]){ctx.beginPath();ctx.ellipse(tL*.5,tH*y,tL*.28,tH*.07,0,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.fillStyle='#ad5147';ctx.fillRect(tL*.42,tH*.46,tL*.16,tH*.09);}
    else if(art.kind==='book')render3dMesh(bookMesh(art.magic),5,5,13,.16,angle,0);
    else if(art.kind==='sprite'){const m=spriteModel(art.id);if(m)render3dMesh(m.mesh,m.x,m.y,m.scale,0,angle,0);else drawPortrait(art.id,.6,.6,.88,0,0,0,CARD_PORTRAIT_PIXELS);}
    else if(art.kind==='mesh')render3dMesh(art.mesh,5,5,art.scale||10,.12,angle,0);
    else if(art.kind==='fish')render3dMesh(BMFishSprites.mesh(art.id),5,5,10,.1,angle,0);
    else if(art.kind==='portrait')drawPortrait(art.id,.6,.6,.88,0,0,0,CARD_PORTRAIT_PIXELS);
    else if(art.kind==='boots'){
      // Existing boots have no card portrait. A clear paired-boot icon avoids Card's default actor.
      ctx.fillStyle='#725335';ctx.strokeStyle='#c5ab78';ctx.lineWidth=2;
      for(const x of [2,5.1]){ctx.beginPath();ctx.moveTo(x*u,2*u);ctx.lineTo((x+1.7)*u,2*u);ctx.lineTo((x+1.6)*u,6*u);ctx.quadraticCurveTo((x+3)*u,6*u,(x+2.6)*u,7.8*u);ctx.lineTo(x*u,7.8*u);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#b8a28a';ctx.fillRect(x*u,2*u,1.7*u,.6*u);ctx.fillStyle='#725335';}
    }else if(art.kind==='material'){
      ctx.strokeStyle='#c7b798';ctx.fillStyle='#e7ddbe';ctx.lineWidth=3;
      if(/thread/.test(art.subject)){for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(5*u,5*u,(2+i*.08)*u,1.8*u,i*.16,0,Math.PI*2);ctx.stroke();}}
      else{const n=/claw/.test(art.subject)?3:1;for(let i=0;i<n;i++){const x=(3+i*1.7)*u;ctx.beginPath();ctx.moveTo(x,2*u);ctx.quadraticCurveTo(x+3*u,5*u,x-.1*u,8*u);ctx.quadraticCurveTo(x+1*u,5*u,x-.6*u,2.5*u);ctx.closePath();ctx.fill();ctx.stroke();}}
    }
    ctx.restore();
  }
  function animated(art){if(art?.itemSprite)return false;if(art?.inventoryPreview)return art.previewReady?!!art.previewFit:art.kind!=='portrait';return !['portrait','boots','material','scroll'].includes(art.kind);}
  function meshFor(art){const view=preparePreview({...art});return view.previewMesh||BMShopModels.mesh('misc');}
  return {bookMesh,powderMesh,materialMesh,herbMesh,animalMaterial,meshFor,fitPreview,resolve,portrait,preview,draw,animated};
})();