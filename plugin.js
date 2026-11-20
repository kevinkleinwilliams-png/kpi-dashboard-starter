// KPI Dashboard Starter: builds 4 boards (hoofd + detail, 7 en 30 dagen) met werkende prototype-interacties.
const C={navy:'#0F2A43',teal:'#0D9488',old:'#94A3B8',bg:'#F4F6F9',line:'#E2E8F0',mute:'#64748B',amb:'#F59E0B',ambT:'#B45309',green:'#15803D',greenBg:'#DCFCE7',white:'#FFFFFF',ghost:'#CBD5E1'};
const NLM=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
const fmt=n=>n.toFixed(1).replace('.',',');
const med=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const gen=(n,b,a,sd)=>Array.from({length:n},(_,i)=>+(b+a*Math.sin(i*1.7+sd)+a*0.6*Math.cos(i*2.9+sd*2)).toFixed(1));
const OLD30=gen(30,17.1,.5,1), PIL30=gen(30,14.2,.45,2);
const PLAN=15;
const WITHIN={7:[68,90],30:[71,92]};
const PARTS=[['Ochtendspits',1.075,1.05],['Middag',.93,.92],['Avondspits',1.03,1.035]];
const mk=p=>{const o=OLD30.slice(-p),q=PIL30.slice(-p),mo=+med(o).toFixed(1),mp=+med(q).toFixed(1);
  return{label:p+' dagen',n:p,old:o,pil:q,mo,mp,inOld:WITHIN[p][0],inPil:WITHIN[p][1],parts:PARTS.map(x=>[x[0],+(mo*x[1]).toFixed(1),+(mp*x[2]).toFixed(1)])};};
const DATA={7:mk(7),30:mk(30)};
let inter=null; try{inter=penpot.fonts.findByName('Inter');}catch(e){}
let ctx=null; const hooks=[]; const boards={};

function made(s){ctx.made.push(s);return s;}
function place(s,x,y){s.x=ctx.ox+x;s.y=ctx.oy+y;}
function rect(x,y,w,h,fill,o={}){
  const s=penpot.createRectangle(); s.resize(w,h); ctx.board.appendChild(s); place(s,x,y);
  s.fills=fill?[{fillColor:fill}]:[];
  if(o.r) s.borderRadius=o.r;
  if(o.stroke) s.strokes=[{strokeColor:o.stroke,strokeWidth:o.sw||1,strokeAlignment:'inner',strokeStyle:o.dash?'dashed':'solid'}];
  if(o.name) s.name=o.name;
  return made(s);
}
function ell(x,y,w,h,fill,stroke){
  const s=penpot.createEllipse(); s.resize(w,h); ctx.board.appendChild(s); place(s,x,y);
  s.fills=fill?[{fillColor:fill}]:[];
  if(stroke) s.strokes=[{strokeColor:stroke,strokeWidth:2,strokeAlignment:'inner'}];
  return made(s);
}
function path(pts,color,w,dash,name){
  const s=penpot.createPath(); ctx.board.appendChild(s);
  s.content=pts.map((p,i)=>({command:i?'L':'M',params:{x:ctx.ox+p[0],y:ctx.oy+p[1]}}));
  s.fills=[]; s.strokes=[{strokeColor:color,strokeWidth:w,strokeStyle:dash?'dashed':'solid',strokeAlignment:'center'}];
  if(name) s.name=name; return made(s);
}
function text(x,y,str,sz,color,w,anchor,name){
  const t=penpot.createText(str); if(!t) return null; ctx.board.appendChild(t);
  w=w||400; anchor=anchor||'start';
  try{ const v=inter&&inter.variants.find(v=>v.fontWeight===String(w)&&v.fontStyle==='normal'); if(v) inter.applyToText(t,v); else t.fontWeight=String(w);}catch(e){}
  t.fontSize=String(sz); t.fills=[{fillColor:color}];
  if(anchor==='start'){t.growType='auto-width'; t.x=ctx.ox+x;}
  else{const BW=360; t.growType='fixed'; t.resize(BW,Math.round(sz*1.4)); t.textAlign=anchor==='middle'?'center':'right'; t.x=ctx.ox+(anchor==='middle'?x-BW/2:x-BW);}
  t.y=ctx.oy+y-sz*0.95; t.name=name||String(str).slice(0,40);
  return made(t);
}
function grp(name,fn,dest){
  const s=ctx.made.length; fn(); const items=ctx.made.splice(s);
  let g=items.length>1?penpot.group(items):items[0]; if(!g) return null;
  g.name=name; ctx.made.push(g); if(dest) hooks.push([g,dest]); return g;
}
function newBoard(name,x){
  const b=penpot.createBoard(); b.name=name; b.resize(1440,900); b.x=x; b.y=0;
  b.fills=[{fillColor:C.bg}]; b.clipContent=true;
  ctx={board:b,ox:x,oy:0,made:[]}; return b;
}

function header(kind,p){
  rect(0,0,1440,80,C.white,{name:'Header-achtergrond'}); rect(0,80,1440,1,C.line,{name:'Header-lijn'});
  if(kind==='main'){
    rect(40,24,32,32,C.teal,{r:8,name:'Logo'}); text(56,46,'S',18,C.white,700,'middle','Logo-letter');
    text(86,48,'Shuttle KPI-dashboard',22,C.navy,700,'start','Titel');
  } else {
    grp('Knop-terug',()=>{rect(40,24,150,34,C.white,{r:17,stroke:C.line,name:'Knop-vlak'}); text(115,46,'←  Dashboard',14,C.navy,600,'middle');},`main-${p}`);
    text(215,48,'Snelheid route – detail',22,C.navy,700,'start','Titel');
  }
  text(990,48,'Periode',13,C.mute,500,'end');
  grp('Periode-schakelaar',()=>{
    rect(1000,24,190,34,C.white,{r:8,stroke:C.line,name:'Schakelaar-vlak'});
    [7,30].forEach((q,i)=>{
      const x=1002+i*94, act=q===p;
      grp(`Chip-${q}-dagen`,()=>{rect(x,26,92,30,act?C.teal:null,{r:6,name:'Chip-vlak'}); text(x+46,46,DATA[q].label,13,act?C.white:C.navy,act?700:500,'middle');},act?null:`${kind}-${q}`);
    });
  });
  grp('Legenda',()=>{
    ell(1232,28,10,10,C.old); text(1248,38,'Oud',13,C.mute); ell(1306,28,10,10,C.teal); text(1322,38,'Pilot',13,C.mute);
    text(1232,62,'Voorbeelddata',11,C.mute);
  });
}

function ghost(x,y,i){
  grp(`Slot-KPI-teamlid-${i}`,()=>{
    rect(x,y,437,330,C.bg,{r:16,stroke:C.ghost,dash:true,sw:2,name:'Kader'});
    text(x+218,y+160,'KPI teamlid',16,'#94A3B8',600,'middle'); text(x+218,y+184,'Uitgewerkt door: [Teamlid]',13,'#94A3B8',400,'middle');
  });
}
function mainScreen(p,x0){
  const D=DATA[p], mo=D.mo, mp=D.mp;
  newBoard(`Hoofdscherm – ${D.label}`,x0); boards[`main-${p}`]=ctx.board; header('main',p);
  const x=40,y=120,sc=v=>v/20*300;
  grp('KPI-Snelheid-route',()=>{
    rect(x,y,437,330,C.white,{r:16,stroke:C.line,name:'Kaart'}); rect(x,y,6,330,C.teal,{name:'Accent'});
    text(x+28,y+40,'Snelheid route',18,C.navy,700); text(x+28,y+62,'Mediane ritduur in minuten',13,C.mute);
    text(x+28,y+128,fmt(mp),64,C.navy,700,'start','Hoofdwaarde'); text(x+168,y+128,'min',22,C.mute,500);
    rect(x+250,y+92,159,34,C.greenBg,{r:17,name:'Delta-chip'}); text(x+329,y+114,`▼ ${fmt(mo-mp)} min sneller`,13,C.green,700,'middle','Delta');
    text(x+250,y+148,`t.o.v. oude situatie (${fmt(mo)})`,12,C.mute);
    [['Oud',mo,C.old],['Pilot',mp,C.teal]].forEach(([l,v,c],k)=>{
      const yy=y+176+k*44; text(x+28,yy+18,l,13,C.mute,500); rect(x+70,yy,sc(v),26,c,{r:6,name:`Balk-${l}`}); text(x+70+sc(v)+8,yy+18,fmt(v),13,C.navy,700);
    });
    const px=x+70+sc(PLAN); path([[px,y+168],[px,y+262]],C.amb,2,true,'Gepland-lijn'); text(px,y+278,`Gepland: ${fmt(PLAN)} min`,12,C.ambT,600,'middle');
    rect(x,y+292,437,1,C.line); text(x+28,y+316,'Uitgewerkt door: [Naam]',12,C.mute);
    grp('Knop-details',()=>{rect(x+300,y+296,121,28,C.teal,{r:14,name:'Knop-vlak'}); text(x+360,y+315,'Details  →',13,C.white,600,'middle');},`detail-${p}`);
  },`detail-${p}`);
  [[501,120],[962,120],[40,474],[501,474],[962,474]].forEach(([gx,gy],i)=>ghost(gx,gy,i+2));
  text(40,872,'Bron: logfile shuttle (geplande vs. gerealiseerde tijden) · Klik op een KPI voor details',12,C.mute,400,'start','Bron');
}

function detailScreen(p,x0){
  const D=DATA[p], mo=D.mo, mp=D.mp, n=D.n;
  newBoard(`Detailscherm – ${D.label}`,x0); boards[`detail-${p}`]=ctx.board; header('detail',p);
  const tiles=[['Mediane ritduur pilot',`${fmt(mp)} min`,`▼ ${fmt(mo-mp)} min vs oud`,C.teal,C.teal],['Geplande ritduur',`${fmt(PLAN)} min`,'vaste dienstregeling',C.amb,C.ambT],
    ['Afwijking t.o.v. plan',`${mp<PLAN?'−':'+'}${fmt(Math.abs(mp-PLAN))} min`,mp<PLAN?'pilot is sneller dan gepland':'pilot is trager dan gepland',C.green,C.green],
    ['Ritten binnen plan',`${D.inPil}%`,`oud: ${D.inOld}%  (▲ ${D.inPil-D.inOld} pp)`,C.teal,C.teal]];
  tiles.forEach(([l,v,s,c,tc],i)=>{const x=40+i*356; grp(`Tegel-${i+1}`,()=>{
    rect(x,104,332,112,C.white,{r:14,stroke:C.line,name:'Kaart'}); rect(x,104,6,112,c,{name:'Accent'});
    text(x+24,134,l,13,C.mute,500); text(x+24,180,v,34,C.navy,700); text(x+24,203,s,12,tc,600);});});
  // lijngrafiek
  const X0=40,Y0=240,W=800,H=420, px=X0+80,py=Y0+90,pw=W-120,ph=H-170, yv=v=>py+ph-(v-10)/10*ph;
  const xs=Array.from({length:n},(_,i)=>px+20+i*(pw-80)/(n-1));
  grp('Grafiek-ritduur-per-dag',()=>{
    rect(X0,Y0,W,H,C.white,{r:14,stroke:C.line,name:'Kaart'});
    text(X0+24,Y0+36,'Ritduur per dag',17,C.navy,700); text(X0+24,Y0+56,`Ritduur in minuten, laatste ${n} dagen`,12,C.mute);
    text(px-12,py-14,'Minuten',12,C.mute,500,'end','As-titel-y');
    for(let v=10;v<=20;v+=2){rect(px,yv(v),pw,1,C.line,{name:`Gridlijn-${v}`}); text(px-12,yv(v)+4,String(v),12,C.mute,400,'end');}
    const step=n<=7?1:n<=14?3:5, end=new Date(2026,10,19);
    for(let i=0;i<n;i+=step){ if(n-1-i<2&&i!==n-1) continue; const d=new Date(end.getTime()-(n-1-i)*864e5); text(xs[i],py+ph+24,`${d.getDate()} ${NLM[d.getMonth()]}`,12,C.mute,400,'middle'); }
    text(xs[n-1],py+ph+24,`${end.getDate()} ${NLM[end.getMonth()]}`,12,C.mute,400,'middle');
    path([[px,yv(PLAN)],[px+pw,yv(PLAN)]],C.amb,2,true,'Gepland-lijn'); text(px+pw,yv(PLAN)-8,`Gepland ${fmt(PLAN)}`,12,C.ambT,600,'end');
    [[D.old,C.old,'Oud'],[D.pil,C.teal,'Pilot']].forEach(([d,c,nm])=>{
      path(d.map((v,i)=>[xs[i],yv(v)]),c,3,false,`Lijn-${nm}`);
      if(n<=14) d.forEach((v,i)=>ell(xs[i]-3.5,yv(v)-3.5,7,7,C.white,c));
    });
    text(xs[n-1]+10,yv(D.old[n-1])+4,`Oud ${fmt(D.old[n-1])}`,12,'#475569',700,'start'); text(xs[n-1]+10,yv(D.pil[n-1])+4,`Pilot ${fmt(D.pil[n-1])}`,12,'#0F766E',700,'start');
    ell(X0+24,Y0+H-28,10,10,C.old); text(X0+40,Y0+H-18,'Oud (trein)',12,C.mute); ell(X0+130,Y0+H-28,10,10,C.teal); text(X0+146,Y0+H-18,'Pilot (shuttle)',12,C.mute);
    path([[X0+260,Y0+H-23],[X0+284,Y0+H-23]],C.amb,2,true,'Legenda-gepland'); text(X0+292,Y0+H-18,'Geplande tijd',12,C.mute);
  });
  // staafgrafiek
  const X1=864,W1=536,bx=X1+60,by=Y0+90,bw=W1-90,bh=H-170,yb=v=>by+bh-v/20*bh,gw=bw/3;
  grp('Grafiek-ritduur-per-dagdeel',()=>{
    rect(X1,Y0,W1,H,C.white,{r:14,stroke:C.line,name:'Kaart'});
    text(X1+24,Y0+36,'Ritduur per dagdeel',17,C.navy,700); text(X1+24,Y0+56,'Mediane ritduur in minuten, oud vs. pilot',12,C.mute);
    text(bx-10,by-14,'Minuten',12,C.mute,500,'end','As-titel-y');
    for(let v=0;v<=20;v+=5){rect(bx,yb(v),bw,1,C.line,{name:`Gridlijn-${v}`}); text(bx-10,yb(v)+4,String(v),12,C.mute,400,'end');}
    D.parts.forEach(([nm,o,pl],i)=>{const gx=bx+i*gw+gw/2;
      [[-34,o,C.old,'Oud'],[4,pl,C.teal,'Pilot']].forEach(([dx,v,c,l])=>{rect(gx+dx,yb(v),30,by+bh-yb(v),c,{r:4,name:`Balk-${nm}-${l}`}); text(gx+dx+15,yb(v)-6,fmt(v),12,C.navy,700,'middle');});
      text(gx,by+bh+22,nm,13,C.navy,500,'middle');});
    path([[bx,yb(PLAN)],[bx+bw,yb(PLAN)]],C.amb,2,true,'Gepland-lijn'); text(bx+bw,yb(PLAN)-6,`Gepland ${fmt(PLAN)}`,12,C.ambT,600,'end');
    ell(X1+24,Y0+H-28,10,10,C.old); text(X1+40,Y0+H-18,'Oud',12,C.mute); ell(X1+90,Y0+H-28,10,10,C.teal); text(X1+106,Y0+H-18,'Pilot',12,C.mute);
  });
  const best=[...D.parts].sort((a,b)=>(b[1]-b[2])-(a[1]-a[2]))[0];
  grp('Inzicht',()=>{
    rect(40,684,1360,150,C.white,{r:14,stroke:C.line,name:'Kaart'}); rect(40,684,6,150,C.teal,{name:'Accent'});
    text(70,718,'Wat betekent dit?',16,C.navy,700);
    text(70,748,`De shuttle is in de pilot ${fmt(mo-mp)} minuten sneller dan de oude trein en rijdt structureel onder de geplande ${fmt(PLAN)} minuten.`,14,C.navy);
    text(70,772,`Grootste winst in de ${best[0].toLowerCase()}: −${fmt(best[1]-best[2])} min. ${D.inPil}% van de ritten blijft binnen plan (oud: ${D.inOld}%).`,14,C.navy);
    text(70,806,'Meting: gerealiseerde minus geplande tijd per rit, uit de logfile. Centrummaat: mediaan (robuust tegen uitschieters door storingen).',12,C.mute);
  });
  text(40,872,'Uitgewerkt door: [Naam]  ·  KPI 4 – Snelheid route (in minuten)  ·  Voorbeelddata',12,C.mute,400,'start','Voettekst');
}

try{
  mainScreen(30,0); detailScreen(30,1560); mainScreen(7,3120); detailScreen(7,4680);
  hooks.forEach(([shape,dest])=>{ const d=boards[dest]; if(!d) return;
    try{shape.addInteraction('click',{type:'navigate-to',destination:d,preserveScrollPosition:false,animation:{type:'dissolve',duration:250,easing:'ease-in-out'}});}catch(e){console.log('interactie mislukt',e);} });
  try{penpot.currentPage.createFlow('KPI Snelheid route',boards['main-30']);}catch(e){console.log('flow mislukt',e);}
  penpot.selection=Object.values(boards);
}catch(e){console.log('Fout in plugin:',e);}
penpot.closePlugin();
