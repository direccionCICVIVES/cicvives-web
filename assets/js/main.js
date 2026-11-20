
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

// header + menu
const hdr=$('header.site'); addEventListener('scroll',()=>hdr.classList.toggle('scrolled',scrollY>10),{passive:true});
const mb=$('.menu-btn'), menu=$('#menu');
mb.addEventListener('click',()=>{const o=menu.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
const PG=document.body.dataset.page; $$('#menu a').forEach(a=>{if(a.dataset.p===PG){a.classList.add('active');a.setAttribute('aria-current','page')}});
// UTC clock
if($('#utc')){
const utc=$('#utc'); const tick=()=>utc.textContent=new Date().toISOString().slice(11,19); tick(); setInterval(tick,1000);

}
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
$$('.rv').forEach((el,i)=>{el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)});

// counters
if($('.stats')){
const fmt=n=>n.toLocaleString('es-MX');
new IntersectionObserver((es,ob)=>es.forEach(e=>{if(!e.isIntersecting)return;ob.disconnect();
  $$('[data-count]').forEach(el=>{const t=+el.dataset.count,p=el.dataset.prefix||'',s=el.dataset.suffix||'';
    if(RM){el.textContent=p+fmt(t)+s;return}
    const t0=performance.now();const step=now=>{const k=Math.min(1,(now-t0)/1600),e=1-Math.pow(1-k,3);el.textContent=p+fmt(Math.round(t*e))+s;if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})
}),{threshold:.3}).observe($('.stats'));

}
// timeline nav
if($('#tl')){
const tl=$('#tl'); $$('.tl-nav button').forEach(b=>b.addEventListener('click',()=>tl.scrollBy({left:+b.dataset.dir*300*2,behavior:RM?'auto':'smooth'})));

}
// compare slider
if($('#compare')){
const cmp=$('#compare'),cr=$('input',cmp);
const setC=v=>{$('.top',cmp).style.clipPath=`inset(0 ${100-v}% 0 0)`;$('.bar',cmp).style.left=v+'%';$('.knob',cmp).style.left=v+'%'};
cr.addEventListener('input',()=>setC(cr.value));

}
// mortality bars + tooltip
if($('#mortCard')){
const tip1=$('#tip1'),card=$('#mortCard');
new IntersectionObserver((es,ob)=>es.forEach(e=>{if(e.isIntersecting){ob.disconnect();$$('#bars .fill').forEach(f=>f.style.width=f.dataset.w+'%')}}),{threshold:.4}).observe(card);
$$('#bars .barrow').forEach(r=>{
  r.addEventListener('mousemove',ev=>{const b=card.getBoundingClientRect();tip1.innerHTML=r.dataset.tip;tip1.style.opacity=1;
    let x=ev.clientX-b.left+14,y=ev.clientY-b.top+14;if(x>b.width-270)x=b.width-270;tip1.style.left=x+'px';tip1.style.top=y+'px'});
  r.addEventListener('mouseleave',()=>tip1.style.opacity=0)});

}
// gallery lightbox
if($('#lb')){
const lb=$('#lb');
$$('#gallery figure').forEach(f=>{const open=()=>{$('img',lb).src=$('img',f).src;$('img',lb).alt=$('img',f).alt;$('p',lb).textContent=$('figcaption',f).textContent;lb.classList.add('open');$('button',lb).focus()};
  f.addEventListener('click',open);f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});
const closeLb=()=>lb.classList.remove('open');
$('button',lb).addEventListener('click',closeLb);lb.addEventListener('click',e=>{if(e.target===lb)closeLb()});addEventListener('keydown',e=>{if(e.key==='Escape')closeLb()});

}
// gallery color/original toggle
$$('.gal-head .seg button').forEach(b=>b.addEventListener('click',()=>{$$('.gal-head .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  $$('#gallery img[data-bw]').forEach(im=>{im.dataset.color=im.dataset.color||im.src;im.style.opacity=0;setTimeout(()=>{im.src=b.dataset.mode==='bw'?im.dataset.bw:im.dataset.color;im.style.opacity=1},RM?0:250)})}));
// flip cards (touch/keyboard)
$$('.pcard').forEach(c=>{c.addEventListener('click',()=>c.classList.toggle('flip'));c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();c.classList.toggle('flip')}})});

// tabs
const tabs=$$('[role=tab]');
function sel(t){tabs.forEach(x=>{const on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;$('#'+x.getAttribute('aria-controls')).classList.toggle('on',on)})}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>sel(t));t.addEventListener('keydown',e=>{let j=null;if(e.key==='ArrowRight')j=(i+1)%tabs.length;if(e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length;if(j!==null){sel(tabs[j]);tabs[j].focus()}})});

// stars canvas
if($('#stars')){
(function(){const c=$('#stars'),x=c.getContext('2d');let W,H,S=[];
  function rs(){W=c.width=c.offsetWidth*devicePixelRatio;H=c.height=c.offsetHeight*devicePixelRatio;S=Array.from({length:160},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.3*devicePixelRatio,p:Math.random()*6}))}
  rs();addEventListener('resize',rs);
  function d(t){x.clearRect(0,0,W,H);S.forEach(s=>{x.globalAlpha=.25+.45*(RM?.5:(Math.sin(t/900+s.p)+1)/2);x.fillStyle='#C8DDD3';x.beginPath();x.arc(s.x,s.y,s.r,0,7);x.fill()});if(!RM)requestAnimationFrame(d)}
  requestAnimationFrame(d)})();

}
// map
if($('#map')){
const SITES={"La Paz": [500.5, 381.0], "Isla Espíritu Santo": [499.1, 356.7], "Bahía Tortugas": [177.2, 102.7], "Punta Abreojos": [270.4, 179.5], "Isla Natividad": [154.6, 88.6], "Isla de Cedros": [157.4, 64.3], "Loreto": [427.8, 234.4], "Cabo San Lucas": [528.7, 479.0]};
const INFO={
 'La Paz':['Base de demostración','Entorno accesible para el núcleo de prueba: base costera y sensores de energía o agua. Punto de partida de la red.'],
 'Isla Espíritu Santo':['Referencia territorial','Sede histórica de la estación de San Gabriel. Cualquier actuación requiere validación de sitio y autorizaciones de ANP.'],
 'Bahía Tortugas':['Caso de estudio','Comunidad del Pacífico candidata para monitoreo de servicios y corredor regional.'],
 'Punta Abreojos':['Caso de estudio','Candidata para sistemas aislados y validación de electrónica en campo.'],
 'Isla Natividad':['Caso de estudio','Isla candidata para energía, agua y cadena de frío, sujeta a acuerdos con operadores.'],
 'Isla de Cedros':['Coordinación interestatal','Pertenece a Baja California; su integración requiere coordinación entre estados.'],
 'Loreto':['Relevo de estudio','Punto intermedio del Golfo para evaluar trayectos y despeje de enlaces.'],
 'Cabo San Lucas':['Relevo de estudio','Extremo sur para evaluar la continuidad del corredor peninsular.']};
const svg=$('#map'),NS='http://www.w3.org/2000/svg';
const g=$('#grid');for(let i=0;i<600;i+=40){const l=document.createElementNS(NS,'line');l.setAttribute('x1',i);l.setAttribute('x2',i);l.setAttribute('y1',0);l.setAttribute('y2',502);g.appendChild(l)}for(let i=0;i<502;i+=40){const l=document.createElementNS(NS,'line');l.setAttribute('y1',i);l.setAttribute('y2',i);l.setAttribute('x1',0);l.setAttribute('x2',600);g.appendChild(l)}
const pairs=[['La Paz','Isla Espíritu Santo'],['La Paz','Loreto'],['Loreto','Punta Abreojos'],['Punta Abreojos','Bahía Tortugas'],['Bahía Tortugas','Isla Natividad'],['Isla Natividad','Isla de Cedros'],['La Paz','Cabo San Lucas']];
pairs.forEach(([a,b])=>{const [x1,y1]=SITES[a],[x2,y2]=SITES[b];const p=document.createElementNS(NS,'path');const mx=(x1+x2)/2,my=(y1+y2)/2-Math.hypot(x2-x1,y2-y1)*.15;p.setAttribute('d',`M${x1},${y1} Q${mx},${my} ${x2},${y2}`);p.setAttribute('class','link');$('#links').appendChild(p)});
const si=$('#siteinfo');
function show(n){$$('.site').forEach(s=>s.classList.toggle('sel',s.dataset.n===n));const [st,tx]=INFO[n];si.innerHTML=`<div class="st">${st}</div><h4 style="margin-top:8px">${n}</h4><p style="margin:6px 0 0;color:var(--tinta-2)">${tx}</p>`}
Object.entries(SITES).forEach(([n,[x,y]])=>{const s=document.createElementNS(NS,'g');s.setAttribute('class','site');s.dataset.n=n;s.setAttribute('tabindex','0');s.setAttribute('role','button');s.setAttribute('aria-label',n);
  const LBL={'Isla de Cedros':[-11,-4,'end'],'Isla Natividad':[-11,6,'end'],'Bahía Tortugas':[11,10,'start'],'Punta Abreojos':[11,6,'start'],'Isla Espíritu Santo':[-11,-6,'end'],'La Paz':[-11,12,'end'],'Loreto':[11,4,'start'],'Cabo San Lucas':[-11,8,'end']};const [dx,dy,an]=LBL[n]||[11,4,'start'];s.innerHTML=`<circle cx="${x}" cy="${y}" r="16" fill="transparent" style="cursor:pointer"/><circle class="p" cx="${x}" cy="${y}" r="5"/><circle class="c" cx="${x}" cy="${y}" r="6"/><text x="${x+dx}" y="${y+dy}" text-anchor="${an}">${n}</text>`;
  s.addEventListener('click',()=>show(n));s.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(n)}});$('#sites').appendChild(s)});
show('La Paz');

}
// synthetic dashboard
if($('#chart')){
function rng(seed){return()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}}
const r=rng(20261119),N=30,end=new Date(Date.UTC(2026,10,18)),days=[...Array(N)].map((_,i)=>new Date(end-(N-1-i)*864e5));
const missing=new Set([9,10,21]);
const DATA={soc:[],tank:[],kwh:[]};let s=78,t=64;
days.forEach((d,i)=>{const cloud=r()<.18;const k=+(cloud?6+r()*4:12+r()*3.5).toFixed(1);s=Math.max(22,Math.min(98,s+(cloud?-9:4)+(r()-.5)*6));t=Math.max(18,Math.min(96,t-5+(i%4===0?18:0)+(r()-.5)*4));
  const m=missing.has(i);DATA.kwh.push(m?null:k);DATA.soc.push(m?null:Math.round(s));DATA.tank.push(m?null:Math.round(t))});
const META={soc:{u:'%',lbl:'Estado de carga de batería',max:100},tank:{u:'%',lbl:'Nivel de tanque',max:100},kwh:{u:'kWh',lbl:'Generación solar diaria',max:18}};
let cur='soc';const ch=$('#chart'),tip2=$('#tip2');
const dfmt=d=>d.toLocaleDateString('es-MX',{day:'numeric',month:'short',timeZone:'UTC'});
function draw(){const W=ch.clientWidth,H=320,m={l:40,r:14,t:16,b:30},iw=W-m.l-m.r,ih=H-m.t-m.b;ch.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const v=DATA[cur],M=META[cur],X=i=>m.l+i*iw/(N-1),Y=y=>m.t+ih-(y/M.max)*ih;let h=`<defs><linearGradient id="ga" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6EAAA0" stop-opacity=".28"/><stop offset="1" stop-color="#6EAAA0" stop-opacity="0"/></linearGradient></defs>`;
  for(let k=0;k<=4;k++){const yv=M.max*k/4;h+=`<line class="gridl" x1="${m.l}" x2="${W-m.r}" y1="${Y(yv)}" y2="${Y(yv)}"/><text class="axis" x="${m.l-8}" y="${Y(yv)+4}" text-anchor="end">${Math.round(yv)}</text>`}
  [...missing].forEach(i=>h+=`<rect class="gap" x="${X(i)-iw/(N-1)/2}" y="${m.t}" width="${iw/(N-1)}" height="${ih}"/>`);
  [0,7,14,21,29].forEach(i=>h+=`<text class="axis" x="${X(i)}" y="${H-8}" text-anchor="middle">${dfmt(days[i])}</text>`);
  let segs=[],cs=[];v.forEach((y,i)=>{if(y==null){if(cs.length)segs.push(cs);cs=[]}else cs.push([X(i),Y(y)])});if(cs.length)segs.push(cs);
  segs.forEach(sg=>{const d='M'+sg.map(p=>p.join(',')).join(' L');h+=`<path class="area" d="${d} L${sg.at(-1)[0]},${Y(0)} L${sg[0][0]},${Y(0)}Z"/><path class="line" d="${d}"/>`});
  h+=`<line class="xh" id="xh" y1="${m.t}" y2="${m.t+ih}" style="display:none"/><circle class="pt" id="pt" r="5" style="display:none"/><rect id="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/>`;
  ch.innerHTML=h;
  const hit=$('#hit',ch),xh=$('#xh',ch),pt=$('#pt',ch),box=ch.parentElement;
  hit.addEventListener('mousemove',e=>{const b=ch.getBoundingClientRect(),px=e.clientX-b.left,i=Math.max(0,Math.min(N-1,Math.round((px-m.l)/(iw/(N-1))))),y=v[i];
    xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.style.display='';
    if(y==null){pt.style.display='none'}else{pt.setAttribute('cx',X(i));pt.setAttribute('cy',Y(y));pt.style.display=''}
    const pb=box.getBoundingClientRect();tip2.innerHTML=`${dfmt(days[i])} · ${M.lbl}<br><b>${y==null?'Sin dato registrado':y+' '+M.u}</b>`;tip2.style.opacity=1;
    let tx=b.left-pb.left+X(i)+14;if(tx>pb.width-200)tx-=210;tip2.style.left=tx+'px';tip2.style.top=(b.top-pb.top+30)+'px'});
  hit.addEventListener('mouseleave',()=>{tip2.style.opacity=0;xh.style.display='none';pt.style.display='none'});
  const last=[...v].reverse().find(x=>x!=null);$('#k1').textContent=last+' '+M.u;$('#k1d').textContent=M.lbl+' · '+dfmt(days[N-1]);
  const ok=v.filter(x=>x!=null).length;$('#k2').textContent=Math.round(ok/N*100)+'%';$('#unit').textContent=M.u;$('#corte').textContent=days[N-1].toISOString().slice(0,10);
  ch.setAttribute('aria-label',`${M.lbl}, serie diaria sintética de 30 días. Último valor ${last} ${M.u}.`)}
$$('.dtop .seg button').forEach(b=>b.addEventListener('click',()=>{$$('.dtop .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));cur=b.dataset.v;draw()}));
addEventListener('resize',draw);draw();
$('#csv').addEventListener('click',()=>{let csv='record_id,site_id,device_id,variable,timestamp_utc,unidad,valor,calidad,metodo\n';
  Object.keys(DATA).forEach(k=>DATA[k].forEach((y,i)=>{csv+=`${k}-${i+1},LPZ-DEMO,DEMO-01,${k},${days[i].toISOString()},${META[k].u},${y??''},${y==null?'faltante':'sintetico'},generador_demo\n`}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='CICVIVES_demo_continuidad_sintetico.csv';a.click()});

}
// contact (mailto)
if($('#cform')){
$('#cform').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);
  const body=`Nombre: ${f.get('nombre')}\nOrganización: ${f.get('org')}\nInterés: ${f.get('interes')}\n\n${f.get('msg')}`;
  location.href=`mailto:contacto@centrogastonjvives.org?subject=${encodeURIComponent('Contacto CIC VIVES · '+f.get('interes'))}&body=${encodeURIComponent(body)}`});

}
// open tab from hash
if(location.hash){const hp=document.querySelector(location.hash+'[role=tabpanel]');if(hp){sel(document.getElementById(hp.getAttribute('aria-labelledby')));setTimeout(()=>document.getElementById('programas').scrollIntoView(),50)}}
