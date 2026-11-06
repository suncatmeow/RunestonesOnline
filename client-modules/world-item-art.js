const BMWorldItemArt=(()=>{
 const cache=new Map();let cards,coins;
 function stamp(mesh,size=128,angle=.55){const saved={ctx,tX,tY,tL,tH};try{const c=document.createElement('canvas');c.width=c.height=size;ctx=c.getContext('2d');tX=tY=0;tL=tH=size;ctx.lineWidth=.45;const f=BMItemArt.fitPreview(mesh);render3dMesh(f.mesh,f.x,f.y,f.scale,.25,angle,0);
  const data=ctx.getImageData(0,0,size,size).data;let bottom=0;for(let i=3;i<data.length;i+=4)if(data[i]>8)bottom=Math.floor((i/4)/size);const ground=document.createElement('canvas');ground.width=ground.height=size;ground.getContext('2d').drawImage(c,0,size-1-bottom);return ground;
 }finally{({ctx,tX,tY,tL,tH}=saved);}}
 function token(card){if(card?cards:coins)return card?cards:coins;const m={vertices:[],faces:[],outwardRects:true};const p=(shape,x,y,z,sx,sy,sz,c,rz=0)=>add3dShapeRigged(m,shape,{x,y,z,rx:0,ry:0,rz},sx,sy,sz,c);
  if(card){for(let i=0;i<3;i++){p('rec',i*.09,0,i*.055,.39,.55,.022,{r:.73,g:.60,b:.32},i*.08);p('rec',i*.09,0,i*.055-.027,.34,.49,.006,{r:.06,g:.07,b:.37},i*.08);}p('rec',.09,0,-.034,.12,.12,.01,{r:.85,g:.7,b:.38},Math.PI/4);cards=m;}
  else{for(let i=0;i<4;i++)p('arc',(i%2)*.32-.16,-i*.09,0,.28,.05,.28,{r:.72,g:.76,b:.8});coins=m;}prepareSpriteNormals(m);return m;
 }
 function loot(p){const items=p.items.slice(0,3),key=JSON.stringify([items.map(i=>[i.key,i.spriteId,i.spellId,i.fishIndex]),p.cards.slice(0,3),p.cards.length,!!p.silver]);if(cache.has(key))return cache.get(key);
  const parts=items.map(item=>BMItemArt.meshFor(BMItemArt.resolve(item)));if(p.silver&&parts.length<3)parts.push(token(false));if(!parts.length&&!p.cards.length)parts.push(BMShopModels.mesh('misc'));
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),list=parts.slice(0,3);list.forEach((m,i)=>{const art=stamp(m,96),size=list.length===1?116:80;g.drawImage(art,list.length===1?6:[0,48,23][i],list.length===1?12:[34,36,48][i],size,size);});
  if(p.cards.length){g.save();g.fillStyle='#0008';g.beginPath();g.ellipse(64,121,43,5,0,0,Math.PI*2);g.fill();for(let i=Math.min(2,p.cards.length-1);i>=0;i--){g.drawImage(BMWorldCards.get(p.cards[i],128),7+i*5,3-i*3,114,114);}if(p.cards.length>1){g.fillStyle='#151a22';g.fillRect(91,98,32,22);g.fillStyle='#f3dd9b';g.font='bold 15px sans-serif';g.textAlign='center';g.fillText('×'+p.cards.length,107,114);}g.restore();}
  if(cache.size>=48)cache.delete(cache.keys().next().value);cache.set(key,c);return c;
 }
 return {stamp,loot,get cached(){return cache.size;}};
})();globalThis.BMWorldItemArt=BMWorldItemArt;