const BMInventoryModels=(()=>{
 const cache=new Map();
 const aliases={512:12,515:15,518:18,558:58,601:8,602:1000,603:93,604:26,9998:26,9999:50};
 const ids=new Set([6,7,8,10,11,12,14,16,17,18,19,20,21,24,25,26,27,28,29,30,38,39,40,41,43,45,51,52,53,58,59,65,66,67,68,69,70,71,72,73,84,92,93,95,96,600,1001,1005,1006,1007]);
 function mesh(value){
  const id=aliases[value]??Number(value);if(!ids.has(id))return null;if(cache.has(id))return cache.get(id);
  const m={vertices:[],faces:[],outwardRects:true},c=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
  const gold=c('#e7b54b'),silver=c('#c5d5df'),iron=c('#6a7e94'),wood=c('#7c431f'),dark=c('#202532'),white=c('#eef2dd'),red=c('#ec394c'),blue=c('#447fe9'),green=c('#41c987'),violet=c('#b169e5'),skin=c('#eab078');
  const part=(shape,x,y,z,sx,sy,sz,color,rz=0,rx=0)=>add3dShapeRigged(m,shape,{x,y,z,rx,ry:0,rz},sx,sy,sz,color);
  const box=(x,y,z,sx,sy,sz,color,rz=0)=>part('rec',x,y,z,sx,sy,sz,color,rz);
  // A small latitude mesh gives bottles, gems and magic spheres real depth.
  function ball(x,y,z,sx,sy,sz,color){
   const o=m.vertices.length,N=10,R=6;
   for(let j=0;j<=R;j++)for(let i=0;i<N;i++){const a=i*2*Math.PI/N,b=j*Math.PI/R;m.vertices.push([x+Math.cos(a)*Math.sin(b)*sx,y-Math.cos(b)*sy,z+Math.sin(a)*Math.sin(b)*sz]);}
   for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=o+j*N+i,b=o+j*N+(i+1)%N,d=a+N,e=b+N;m.faces.push({indices:(j===0?[a,e,d]:j===R-1?[a,b,d]:[a,b,e,d]).reverse(),color});}
  }
  function ring(x,y,z,rx,ry,t,color,turn=0){
   const o=m.vertices.length,N=20,K=5;
   for(let i=0;i<N;i++)for(let j=0;j<K;j++){const a=i*2*Math.PI/N,b=j*2*Math.PI/K,X=(rx+t*Math.cos(b))*Math.cos(a),Y=(ry+t*Math.cos(b))*Math.sin(a);m.vertices.push([x+X*Math.cos(turn)-Y*Math.sin(turn),y+X*Math.sin(turn)+Y*Math.cos(turn),z+t*Math.sin(b)]);}
   for(let i=0;i<N;i++)for(let j=0;j<K;j++)m.faces.push({indices:[o+i*K+j,o+((i+1)%N)*K+j,o+((i+1)%N)*K+(j+1)%K,o+i*K+(j+1)%K],color});
  }
  function bar(x1,y1,x2,y2,z,r,color){box((x1+x2)/2,(y1+y2)/2,z,r,Math.hypot(x2-x1,y2-y1)/2,r,color,-Math.atan2(x2-x1,y2-y1));}
  // Triangulate notched icons too, so lightning and broken stone shade correctly.
  function plate(points,z,depth,color){
   if(points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0)<0)points=points.slice().reverse();
   const o=m.vertices.length,n=points.length,remaining=points.map((_,i)=>i),triangles=[];
   const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
   while(remaining.length>3){let clipped=false;
    for(let j=0;j<remaining.length;j++){const a=remaining[(j+remaining.length-1)%remaining.length],b=remaining[j],c=remaining[(j+1)%remaining.length];if(cross(points[a],points[b],points[c])<=1e-9)continue;
     if(remaining.some(k=>k!==a&&k!==b&&k!==c&&cross(points[a],points[b],points[k])>=-1e-9&&cross(points[b],points[c],points[k])>=-1e-9&&cross(points[c],points[a],points[k])>=-1e-9))continue;
     triangles.push([a,b,c]);remaining.splice(j,1);clipped=true;break;
    }
    if(!clipped)break;
   }
   if(remaining.length===3)triangles.push(remaining);
   for(const dz of [-depth,depth])for(const [x,y]of points)m.vertices.push([x,y,z+dz]);
   for(const tri of triangles)m.faces.push({indices:tri.map(i=>o+i).reverse(),color},{indices:tri.map(i=>o+n+i),color});
   for(let i=0;i<n;i++)m.faces.push({indices:[o+i,o+(i+1)%n,o+n+(i+1)%n,o+n+i],color});
  }
  function heart(x=0,y=0,z=0,s=1,color=red){ball(x-.25*s,y-.22*s,z,.32*s,.31*s,.20*s,color);ball(x+.25*s,y-.22*s,z,.32*s,.31*s,.20*s,color);plate([[x-.55*s,y-.12*s],[x+.55*s,y-.12*s],[x+.35*s,y+.25*s],[x,y+.66*s],[x-.35*s,y+.25*s]],z,.15*s,color);}
  function sword(color=silver,short=false){plate([[-.09,.28],[-.09,short?-.44:-.80],[0,short?-.65:-1.05],[.09,short?-.44:-.80],[.09,.28]],0,.055,color);box(0,.34,0,.34,.055,.09,gold);box(0,.60,0,.08,.21,.08,wood);ball(0,.85,0,.11,.09,.11,gold);}
  function shield(color=iron,emblem=blue){plate([[-.65,-.70],[.65,-.70],[.59,.23],[0,.87],[-.59,.23]],0,.12,color);box(0,-.10,-.14,.04,.58,.025,emblem);box(0,-.32,-.14,.53,.04,.025,emblem);}
  function wing(x,y,z,side=1,s=1){for(let i=0;i<5;i++){const a=side*(.25+i*.22),X=x+side*(.12+i*.085)*s,Y=y-i*.08*s;part('arc',X,Y,z,.08*s,(.48-i*.04)*s,.05*s,white,a);}}
  function boot(){box(-.16,-.28,0,.26,.43,.23,wood);ball(.04,.30,-.10,.49,.22,.28,wood);box(.03,.51,-.10,.51,.045,.30,dark);box(-.16,-.62,-.03,.27,.07,.25,gold);wing(.08,-.13,-.25,1,.8);}
  function coin(x,y,z,r=.22){ball(x,y,z,r,r,.06,gold);box(x,y,z-.065,.025,r*.6,.014,white);}
  function charm(color){ring(0,-.22,.05,.46,.56,.028,gold);ball(0,.45,-.07,.24,.28,.13,color);ring(0,.44,-.08,.25,.29,.025,gold);}
  function flame(){ball(0,.33,0,.56,.44,.24,c('#f45b19'));for(const [x,y,s]of [[-.37,-.15,.72],[0,-.40,1],[.39,-.1,.70]])plate([[x-.23*s,.38],[x+.23*s,.38],[x+.15*s,y],[x-.12*s,y-.50*s]],.02,.14,c('#f78616'));ball(0,.42,-.18,.34,.28,.14,c('#ffe55d'));plate([[-.24,.41],[.26,.41],[.10,-.29],[0,-.62]],-.16,.065,c('#ffe55d'));}
  function bottle(color){ball(0,.24,0,.48,.54,.33,c('#accace'));ball(0,.33,-.11,.37,.34,.28,color);box(0,-.40,0,.15,.20,.15,c('#d1e7df'));box(0,-.66,0,.18,.07,.18,wood);box(-.22,.10,-.33,.028,.18,.012,white);}
  switch(id){
   case 6:heart(-.28,.07,.08,.74);heart(.32,-.03,-.14,.74,c('#efa0bc'));break;
   case 7:case 29:boot();break;
   case 8:{
    // One flexed elbow: rounded biceps, tapered upright forearm and a closed fist.
    const shade=c('#c98a59'),warm=c('#e4a56e');
    ball(-.51,.42,.02,.25,.28,.25,skin);
    ball(-.06,.47,.02,.53,.19,.25,warm);
    ball(-.04,.28,-.035,.36,.28,.28,skin);
    ball(.43,.42,.01,.22,.21,.23,warm);
    ball(.43,.02,.01,.18,.43,.22,skin);
    ball(.35,-.34,.005,.14,.18,.17,skin);
    box(.28,-.56,0,.24,.17,.18,skin);
    for(let i=0;i<4;i++)ball(.10+i*.115,-.68,-.035,.075,.085,.17,skin);
    ball(.10,-.47,-.18,.105,.13,.09,warm);
    bar(.14,-.51,.31,-.48,-.192,.016,shade);
    bar(.25,.27,.34,.17,-.216,.014,shade);
    break;
   }
   case 10:case 73:case 67:box(0,.18,0,.68,.40,.40,wood);ball(0,-.22,0,.69,.33,.41,wood);for(const x of [-.47,.47])box(x,.10,-.42,.04,.49,.025,gold);box(0,.06,-.45,.12,.16,.03,gold);if(id===67)for(let i=0;i<7;i++)coin((i%4-1.5)*.32,.68+Math.floor(i/4)*.12,-.4,.16);break;
   case 11:bar(0,.77,0,-.82,0,.05,gold);bar(-.72,-.40,.72,-.40,0,.04,gold);box(0,.77,0,.42,.06,.24,wood);for(const x of [-.60,.60]){bar(x,-.40,x,.14,0,.017,gold);ball(x,.23,0,.31,.10,.24,gold);}break;
   case 12:for(let i=0;i<5;i++)ring(-.42+i*.22,-.63+i*.30,0,.17,.24,.04,i%2?silver:iron,i%2?.4:-.3);break;
   case 14:ball(0,0,0,.74,.74,.18,white);for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/12,b=a+Math.PI/12;plate([[0,0],[.74*Math.cos(a),.74*Math.sin(a)],[.74*Math.cos(b),.74*Math.sin(b)]],-.18,.01,dark);}ball(0,-.37,-.20,.37,.37,.04,dark);ball(0,.37,-.21,.37,.37,.04,white);ball(0,-.37,-.25,.09,.09,.02,white);ball(0,.37,-.26,.09,.09,.02,dark);break;
   case 16:box(0,.12,0,.41,.61,.32,iron);for(const x of [-.36,0,.36])box(x,-.61,0,.13,.17,.34,silver);plate([[-.06,-.5],[.10,-.08],[-.10,.17],[.06,.69],[-.19,.20],[-.06,-.06]],-.335,.02,dark);for(const [x,y]of [[-.62,.65],[.57,.56],[-.64,-.2]])box(x,y,0,.12,.12,.14,iron,.4);break;
   case 17:case 38:for(let i=0;i<5;i++){const a=i*2*Math.PI/5-Math.PI/2;plate([[0,0],[Math.cos(a-.6)*.34,Math.sin(a-.6)*.34],[Math.cos(a)*.8,Math.sin(a)*.8],[Math.cos(a+.6)*.34,Math.sin(a+.6)*.34]],0,.09,gold);}if(id===17)ring(0,-.38,.14,.45,.62,.025,gold);else{box(-.25,.78,.13,.15,.35,.03,blue,.2);box(.25,.78,.13,.15,.35,.03,red,-.2);}break;
   case 18:for(let i=0;i<14;i++){const a=-1.35+i*2.7/14,b=a+2.7/14;plate([[-Math.cos(a)*.75,Math.sin(a)*.82],[-Math.cos(b)*.75,Math.sin(b)*.82],[.10-Math.cos(b)*.43,Math.sin(b)*.72],[.10-Math.cos(a)*.43,Math.sin(a)*.72]],0,.12,gold);}break;
   case 19:ball(0,0,0,.47,.47,.22,gold);for(let i=0;i<10;i++){const a=i*Math.PI/5;bar(Math.cos(a)*.60,Math.sin(a)*.60,Math.cos(a)*.87,Math.sin(a)*.87,0,.035,gold);}break;
   case 20:for(let i=0;i<8;i++){const a=i/7,yy=.65-a*1.15;ball(-.40+a*.75,yy,0,.08+a*.20,.10,.08+a*.12,gold);}ring(.35,-.56,0,.28,.15,.04,gold);break;
   case 21:box(0,.35,0,.65,.17,.28,gold);for(const x of [-.5,0,.5]){plate([[x-.18,.2],[x+.18,.2],[x,-.60]],-.09,.15,gold);ball(x,-.58,-.09,.07,.07,.07,red);}for(const x of [-.46,0,.46])ball(x,.35,-.30,.075,.085,.025,x===0?blue:red);break;
   case 24:ring(.23,-.27,0,.48,.48,.07,silver);ball(.23,-.27,.02,.44,.44,.035,{...c('#a7e9f0'),a:.3});bar(-.11,.10,-.66,.71,0,.10,wood);bar(.10,-.58,.39,-.46,-.06,.025,white);break;
   case 25:bottle(red);break;
   case 26:flame();break;
   case 27:charm(red);break;
   case 28:shield(silver,blue);break;
   case 30:ball(0,0,0,.65,.65,.65,c('#de45e5'));ball(-.23,-.25,-.49,.17,.20,.08,c('#ffc2fc'));break;
   case 39:wing(-.30,.15,0,1,1.8);bar(-.32,.57,-.23,-.54,0,.04,gold);break;
   case 40:box(0,.23,0,.27,.34,.15,skin);for(let i=0;i<4;i++)bar(-.21+i*.14,.09,-.25+i*.13,-.51-(i===1||i===2?.15:0),0,.052,skin);bar(-.20,.26,-.49,.02,-.03,.08,skin);coin(.30,-.44,-.17,.24);break;
   case 41:ball(0,.15,0,.53,.57,.31,wood);box(0,-.37,0,.23,.08,.24,gold);plate([[-.22,-.44],[.22,-.44],[.31,-.76],[-.31,-.76]],0,.12,wood);coin(.48,.55,-.20);break;
   case 43:plate([[-.36,-.32],[0,-.90],[.36,-.32],[.29,.52],[0,.84],[-.29,.52]],0,.24,c('#72daf8'));plate([[0,-.87],[.30,-.31],[0,.77]],-.25,.03,c('#c1f5ff'));break;
   case 45:charm(gold);break;
   case 51:case 52:case 59:case 95:sword(silver,id===52);if(id!==52)for(let i=0;i<(id===95?3:2);i++)bar(-.70+i*.32,-.65,-.45+i*.32,.22,-.17,.025,id===51?gold:red);break;
   case 53:plate([[-.82,.57],[0,-.73],[.82,.57]],.1,.36,c('#bfa371'));plate([[-.26,.58],[0,-.14],[.26,.58]],-.275,.01,dark);bar(-.86,.61,0,-.79,-.28,.025,wood);bar(0,-.79,.86,.61,-.28,.025,wood);break;
   case 58:ball(0,0,.08,.75,.58,.23,dark);for(const side of [-1,1]){plate([[side*.10,.02],[side*.64,-.26],[side*.54,.11]],-.20,.05,red);bar(side*.15,-.14,side*.60,-.37,-.25,.025,iron);}break;
   case 65:shield(iron,gold);for(const x of [-.73,.73])bar(x,-.28,x*1.2,-.49,0,.027,gold);break;
   case 66:box(0,.05,0,.49,.61,.27,iron);for(const x of [-.55,.55])ball(x,-.47,0,.23,.18,.29,silver);box(0,.64,0,.49,.07,.29,gold);box(0,-.26,-.29,.04,.29,.025,silver);break;
   case 68:charm(violet);for(const x of [-.17,.17])bar(x-.08,.17,x+.08,.66,-.24,.025,red);break;
   case 69:for(const [x,y]of [[-.35,.35],[.05,.16],[.36,.38]])coin(x,y,0,.29);heart(0,-.48,0,.50);break;
   case 70:bar(0,.71,0,-.60,0,.035,green);for(const s of [-1,1]){part('arc',s*.28,-.16,0,.34,.13,.11,green,-s*.5);bar(0,.30,s*.21,.58,0,.025,wood);}break;
   case 71:bar(-.40,.80,.26,-.45,0,.08,wood);box(.25,-.48,0,.48,.18,.22,iron,.35);box(-.06,.79,.04,.63,.12,.28,iron);break;
   case 72:ring(0,.09,0,.58,.58,.085,gold);ball(0,-.55,-.08,.25,.20,.22,red);break;
   case 84:case 92:case 1005:case 1006:sword(id===92?c('#ff771f'):id===1005?green:id===1006?violet:silver,id===1006);if(id===84)ball(0,.31,-.10,.10,.09,.04,blue);break;
   case 93:plate([[.03,-.96],[.49,-.96],[.05,-.12],[.43,-.12],[-.36,.96],[-.08,.13],[-.43,.13]],0,.10,c('#ffea4d'));break;
   case 96:shield(c('#8bc8e4'),white);break;
   case 600:bottle(green);break;
   case 1001:ball(0,-.14,0,.49,.55,.32,violet);for(const x of [-.20,.20])ball(x,-.20,-.31,.13,.14,.04,dark);for(let i=0;i<4;i++)box(-.22+i*.15,.36,-.08,.045,.15,.16,white);ring(0,0,.14,.80,.72,.035,red);break;
   case 1007:box(0,.34,0,.075,.54,.075,wood);ball(0,-.38,0,.31,.31,.31,iron);for(let i=0;i<6;i++){const a=i*Math.PI/3;plate([[Math.cos(a-.25)*.23,-.38+Math.sin(a-.25)*.23],[Math.cos(a+.25)*.23,-.38+Math.sin(a+.25)*.23],[Math.cos(a)*.57,-.38+Math.sin(a)*.57]],0,.10,silver);}break;
  }
  if(!m.faces.length)return null;
  prepareSpriteNormals(m);cache.set(id,m);return m;
 }
 return {mesh,source:value=>aliases[value]??Number(value)};
})();