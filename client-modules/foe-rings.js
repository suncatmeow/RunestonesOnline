const BMFoeRings=(()=>{
 const eligible=n=>!!n&&!n.isPlayer&&!n.isDead&&n.visible!==false&&String(n.alignment||'').startsWith('foe');
 function state(d,n){const max=a=>{let sum=0;for(let i=0;i<4;i++){const v=a.getEffectiveDice?.(i)||{numDice:a.stat?.[i]?.[0]||1,diceSides:a.stat?.[i]?.[1]||4,flatMod:a.stat?.[i]?.[2]||0};sum+=v.numDice*v.diceSides+v.flatMod;}return sum;};const diff=Math.floor(max(n)*(n.isBoss?1.5:1))-max(d),base=diff>=15?'#FF0000':diff>=5?'#FFFF00':diff>=-4?'#FFFFFF':diff>=-12?'#1E90FF':diff>=-19?'#00FFFF':'#00FF00',colors=[base];
  for(const [name,color]of [['Burn','#FF4500'],['Poison','#32CD32'],['Curse','#8A2BE2'],['Webbed','#FFFFFF']])if(n.activeBuffs?.some(b=>b.name===name||name==='Webbed'&&b.bind))colors.push(color);
  const total=n.maxWards*(n.timePerWard||3),percent=Number.isFinite(n.currentWardTime)&&total>0?Math.max(0,Math.min(1,n.currentWardTime/total)):1;
  return {color:colors[Math.floor(Date.now()/600)%colors.length],percent};
 }
 function draw(d,n,c,x,y,r,squash=.35,width=1.6){if(!eligible(n)||![x,y,r].every(Number.isFinite))return;const v=state(d,n);c.save();c.filter='none';c.globalCompositeOperation='source-over';c.lineWidth=width+2;c.globalAlpha=.65;c.strokeStyle='#080c12';c.beginPath();c.ellipse(x,y,r,r*squash,0,0,Math.PI*2);c.stroke();c.lineWidth=width;c.strokeStyle=v.color;c.globalAlpha=.3;c.stroke();if(v.percent>0){c.globalAlpha=.95;c.beginPath();c.ellipse(x,y,r,r*squash,0,-Math.PI/2,-Math.PI/2+Math.PI*2*v.percent);c.stroke();}c.restore();}
 return {eligible,state,draw};
})();globalThis.BMFoeRings=BMFoeRings;