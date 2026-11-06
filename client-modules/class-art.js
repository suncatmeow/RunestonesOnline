const BMClassArt=(()=>{
 const cache=new Map();
 function model(id){if(cache.has(id))return cache.get(id);let result;
  if(id===1160){const source=BattleMusic.spriteDisplay.model(249,{width:8.1,height:8.3,centerY:5});result={...source,meshes:source.meshes.map(row=>row.map(mesh=>({...mesh,faces:mesh.faces.map(f=>{let color=f.color;if(color&&Math.abs(color.r-.10)<.001&&Math.abs(color.g-.05)<.001&&Math.abs(color.b-.08)<.001)color={...color,r:.31,g:.14,b:.055};else if(color&&Math.abs(color.r-.70)<.001&&Math.abs(color.g-.10)<.001&&Math.abs(color.b-.40)<.001)color={...color,r:.69,g:.045,b:.12};return {...f,color};})})))};}
  else {let mesh;if(id===1163)mesh=BMPortableArt.mesh(1133);else if(id===1169)mesh=BMPortableArt.mesh(1110);else if(id===1164){const base=BMPortableArt.mesh(1118);mesh={...base,faces:base.faces.map(f=>({...f,color:{r:.2,g:.55,b:.85}}))};}else{mesh={vertices:[],faces:[],outwardRects:true};const p=(shape,x,y,z,sx,sy,sz,c,rz=0)=>add3dShapeRigged(mesh,shape,{x,y,z,rx:0,ry:0,rz},sx,sy,sz,c),stem={r:.34,g:.48,b:.18};
    if(id===1165){
     const wood={r:.22,g:.13,b:.10};for(const x of [-.48,.48])p('rec',x,0,0,.035,.65,.16,wood);p('rec',0,0,.14,.48,.65,.025,wood);
     for(const y of [-.64,-.22,.20,.62])p('rec',0,y,0,.5,.025,.18,wood);
     const colors=[{r:.35,g:.13,b:.13},{r:.19,g:.25,b:.23},{r:.45,g:.34,b:.18},{r:.25,g:.21,b:.32}];
     for(let row=0;row<3;row++)for(let i=0;i<8;i++){const y=-.44+row*.42,x=-.40+i*.115,h=.14+(i%3)*.018;p('rec',x,y,0,.045,h,.12,colors[(row+i)%4]);p('rec',x,y-h*.5,-.125,.035,.009,.006,{r:.65,g:.49,b:.25});}
    }else if(id===1168){
     const wood={r:.27,g:.16,b:.10},iron={r:.57,g:.62,b:.65};for(const x of [-.55,.55]){p('rec',x,0,0,.045,.63,.055,wood);p('rec',x,.58,0,.12,.045,.25,wood);}for(const y of [-.38,.31])p('rec',0,y,0,.61,.05,.07,wood);
     for(const x of [-.33,0,.33]){p('rec',x,-.17,-.1,.045,.40,.025,iron);p('tri',x,-.61,-.1,.045,.08,.025,iron,Math.PI);p('rec',x,.25,-.1,.13,.025,.04,iron);p('rec',x,.39,-.1,.035,.12,.035,wood);}
    }else if(id===1166){const iron={r:.13,g:.12,b:.13};p('rec',0,.55,0,.23,.04,.23,iron);p('arc',0,.04,0,.035,.52,.035,iron);p('arc',0,-.48,0,.18,.07,.18,iron);}
    else if(id===1167){p('arc',0,.15,0,.20,.3,.20,{r:.18,g:.35,b:.29,a:.65});p('arc',0,-.18,0,.22,.04,.22,{r:.2,g:.16,b:.13});p('arc',0,.14,0,.12,.18,.12,{r:.42,g:.44,b:.22});}
    else if(id===1171){const wood={r:.44,g:.29,b:.15},rim={r:.27,g:.17,b:.09};p('rec',0,.03,0,.46,.43,.40,wood);for(const x of [-.40,0,.40]){p('rec',x,.03,-.415,.025,.43,.025,rim);p('rec',x,.03,.415,.025,.43,.025,rim);}for(const y of [-.37,.43])p('rec',0,y,-.44,.47,.035,.025,rim);p('rec',0,.03,-.47,.025,.54,.025,rim,.8);}
    else if(id===1172){const wood={r:.42,g:.27,b:.13},iron={r:.22,g:.23,b:.22};p('arc',0,0,0,.39,.49,.39,wood);for(const y of [-.37,.34])p('arc',0,y,0,.40,.035,.40,iron);p('arc',0,-.49,0,.32,.025,.32,{r:.53,g:.36,b:.18});}
    else if(id===1170){const wood={r:.24,g:.15,b:.1};p('rec',0,.25,0,.38,.06,.65,wood);for(const x of [-.32,.32])for(const z of [-.59,.59])p('rec',x,.39,z,.035,.16,.035,wood);p('rec',0,.14,0,.34,.06,.6,{r:.28,g:.27,b:.31});p('rec',0,.07,-.43,.3,.05,.15,{r:.65,g:.63,b:.56});}
    else if(id===1161){p('arc',0,.18,0,.055,.5,.055,stem);for(const [x,y,a]of [[-.23,-.05,-.6],[.23,-.3,.6],[-.18,-.46,-.6]]){p('arc',x,y,0,.29,.11,.12,{r:.24,g:.62,b:.39},a);p('rec',x,y-.035,-.1,.23,.015,.012,{r:.8,g:.91,b:.76},a);}}
    else{p('arc',0,.22,0,.13,.48,.13,{r:.84,g:.79,b:.65});p('arc',0,-.27,0,.56,.26,.49,{r:.27,g:.29,b:.49});for(const [x,z]of [[-.21,-.3],[.19,-.3],[.31,.1],[-.31,.1],[0,0]])p('arc',x,-.5,z,.07,.025,.07,{r:.44,g:.81,b:.96});}prepareSpriteNormals(mesh);}
   result={meshes:[[mesh]],x:5,y:5,scale:12};}
  cache.set(id,result);return result;
 }
 function draw(id,angle=.2,pose=0,frame=0){const m=model(id),row=m.meshes[pose%m.meshes.length];render3dMesh(row[frame%row.length],m.x,m.y,m.scale,0,angle,0);}
 function bake(id){if(spriteCache[id])return;const saved={ctx,tX,tY,tL,tH};try{const dirs=[];for(let dir=0;dir<8;dir++){const frames=[];for(let frame=0;frame<(id===1160?4:1);frame++){const c=document.createElement('canvas');c.width=c.height=256;ctx=c.getContext('2d');tX=tY=0;tL=tH=256;draw(id,dir*Math.PI/4,0,frame);const pixels=ctx.getImageData(0,0,256,256).data;let bottom=255;while(bottom>0&&!Array.from({length:256},(_,x)=>pixels[(bottom*256+x)*4+3]).some(a=>a>8))bottom--;const ground=document.createElement('canvas');ground.width=ground.height=256;ground.getContext('2d').drawImage(c,0,255-bottom);frames.push(ground);}dirs.push(frames);}spriteCache[id]=dirs;SPRITE_CONFIGS[id]={...(SPRITE_CONFIGS[249]||{}),scale:id===1160?.8:id===1165?1.55:id===1166?1.1:id===1169?.55:id===1168?.75:id===1170?1.05:id===1171?.6:id===1172?.65:.28,hover:0,faceZ:.5,facePan:0};}finally{({ctx,tX,tY,tL,tH}=saved);}}
 function pupil(n){bake(1160);n._classArt=1160;}
 function resource(n,id){bake(id);n._classArt=id;}
 return {model,draw,pupil,resource};
})();
globalThis.BMClassArt=BMClassArt;