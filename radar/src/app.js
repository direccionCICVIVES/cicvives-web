/* Radar Eléctrico MX · v1.0 · una sola plantilla, cinco niveles.
   Los datos que no corresponden al nivel no se incrustan en el archivo (los filtra build.py). */
const LV = CFG.level, can = n => LV >= n;
const TODAY = new Date(CFG.today + "T12:00:00");
const R = D.R, PROGRAMS = D.PROGRAMS, METAS = D.METAS || [];
const TECH = {
  cc:{n:"Ciclo combinado"}, fv:{n:"Fotovoltaica"}, eol:{n:"Eólica"}, csp:{n:"Termosolar / híbrida"},
  ci:{n:"Combustión interna"}, cog:{n:"Cogeneración"}, mix:{n:"Cartera solar-eólica"}, tx:{n:"Transmisión / subestación"}, dem:{n:"Demanda (data center, industria)"}
};
const STAGES = ["Anuncio","Planeación","Licitación / evaluación","Adjudicado / contrato","Construcción","Operación"];
const STAGE_SHORT = ["Anuncio","Planeación","Licitación","Contrato","Obra","Operación"];
const stageName = s => s===9 ? "Detenido" : STAGES[s];
const stageVar = s => `var(--s${s})`;
const techVar = t => `var(--t-${t})`;
const LVL = {A:"Oficial federal",B:"Estatal / empresa",C:"Medio especializado",D:"Medio general"};
const TIERNAME = {1:"Abierto",2:"Boletín",3:"Plataforma",4:"Inteligencia",5:"Dirección"};
const REGION = s => ({
 "Baja California":"Baja California","Baja California Sur":"Baja California Sur","Sonora":"Noroeste","Sinaloa":"Noroeste",
 "Chihuahua":"Norte","Durango":"Norte","Coahuila":"Noreste","Nuevo León":"Noreste","Tamaulipas":"Noreste",
 "Guanajuato":"Occidental","Querétaro":"Occidental","San Luis Potosí":"Occidental","Colima":"Occidental","Jalisco":"Occidental","Michoacán":"Occidental","Aguascalientes":"Occidental","Zacatecas":"Occidental","Nayarit":"Occidental",
 "Hidalgo":"Central","Ciudad de México":"Central","México":"Central","Morelos":"Central",
 "Veracruz":"Oriental","Puebla":"Oriental","Oaxaca":"Oriental","Guerrero":"Oriental","Tlaxcala":"Oriental","Chiapas":"Oriental","Tabasco":"Oriental",
 "Yucatán":"Peninsular","Quintana Roo":"Peninsular","Campeche":"Peninsular"}[s] || "Nacional / varias");
const parse = s => new Date((s.length===4?s+"-07-01":s.length===7?s+"-15":s)+"T12:00:00");
const fmtD = s => { if(s.length===4) return s; if(s.length===7) return parse(s).toLocaleDateString("es-MX",{month:"short",year:"numeric"}).replace(".",""); return parse(s).toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}).replace(".",""); };
const nf = new Intl.NumberFormat("es-MX",{maximumFractionDigits:0});
const nf1 = new Intl.NumberFormat("es-MX",{maximumFractionDigits:1});
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tierOf = d => d==null?null : d>=9999?{t:"Sistema aislado",c:"var(--danger)",k:4} : d<=5?{t:"Junto a la red",c:"var(--ok)",k:0} : d<=25?{t:"Cercano",c:"var(--fg)",k:1} : d<=100?{t:"Requiere enlace",c:"var(--amber)",k:2} : {t:"Lejos de la red troncal",c:"var(--danger)",k:3};
const BANDT = ["Junto a la red","Cercano","Requiere enlace","Lejos de la red troncal","Sistema aislado"];

/* ---- bloqueo: tarjeta que invita al nivel siguiente ---- */
const LOCKSVG = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="8" width="12" height="8" rx="2" fill="none" stroke="var(--amber)" stroke-width="1.5"/><path d="M6 8V5.5a3 3 0 0 1 6 0V8" fill="none" stroke="var(--amber)" stroke-width="1.5"/></svg>`;
function lock(min, title, text){
  return `<div class="lock"><div class="lk">${LOCKSVG}<div><b>${title}</b><span>${text} Disponible desde el nivel ${min} · ${TIERNAME[min]}.</span></div></div><a href="#niveles">Ver niveles →</a></div>`;
}

/* ---- derivados ---- */
R.forEach(r=>{
  r.region = REGION(r.state);
  if(r.dist===undefined){ const g=r.grid; r.dist = g ? (g.hv ? g.hv[0] : 9999) : null; }
  if(r.hitos){ r.last = r.hitos[r.hitos.length-1]; }
  if(r.next && r.alert===undefined){
    const days = Math.round((parse(r.next[0]) - TODAY)/864e5); r.days = days;
    r.alert = days===0?"today":days<0?"over":days<=45?"soon":null;
  }
  if(can(3)){
    const base = {0:10,1:25,2:40,3:55,4:75,5:100,9:5}[r.stage];
    r.idx = Math.max(0,Math.min(100, base + (r.lvl==="A"&&r.stage!==9?5:0) - (r.alert==="over"?15:0) - (r.chg?5:0)));
  }
  r.tier = r.band!=null ? r.band : (tierOf(r.dist)||{}).k;
});
const GEN = R.filter(r=>r.tech!=="dem" && r.tech!=="tx" && r.mw);

/* ---- estado ---- */
const S = {selLine:null, net:"hv", tech:new Set(Object.keys(TECH)), stage:new Set([0,1,2,3,4,5,9]), lvl:new Set(["A","B","C","D"]), q:"", colorBy:"stage", heat:"gap",
  sel:"ci-loscabos", layers:new Set(), sCols:["orig","sch","tech","region","stage"], sWeight:"mw", sColor:"stage", sortK:"next", sortDir:1};
if(!can(3)) S.sCols=["orig","sch","stage"];
const visible = () => R.filter(r => S.tech.has(r.tech) && S.stage.has(r.stage) && (!can(3)||S.lvl.has(r.lvl)) &&
  (!S.q || (r.name+" "+r.state+" "+(r.mun||"")+" "+(r.orig||"")+" "+TECH[r.tech].n).toLowerCase().includes(S.q)));
const colorOf = r => S.colorBy==="stage" ? stageVar(r.stage) : techVar(r.tech);

/* ---- KPIs ---- */
function renderKPIs(){
  const tot=d3.sum(GEN,r=>r.mw), op=d3.sum(GEN.filter(r=>r.stage===5),r=>r.mw), ob=d3.sum(GEN.filter(r=>r.stage===4),r=>r.mw), ct=d3.sum(GEN.filter(r=>r.stage===3),r=>r.mw), pap=tot-op-ob-ct;
  const dem=R.filter(r=>r.tech==="dem"), alerts=R.filter(r=>r.alert==="today"||r.alert==="over").length;
  const seg=(x,c)=>`<i style="width:${(x/tot*100).toFixed(1)}%;background:${c}"></i>`;
  $("kpis").innerHTML = `
   <div class="kpi"><small>Capacidad de generación registrada</small><strong>${nf.format(tot)} MW</strong><em>${GEN.length} registros con MW</em>
     <div class="bar" aria-hidden="true">${seg(op,"var(--s5)")}${seg(ob,"var(--s4)")}${seg(ct,"var(--s3)")}${seg(pap,"var(--s0)")}</div></div>
   <div class="kpi"><small>Encendida (en operación)</small><strong style="color:var(--s5)">${nf1.format(op/tot*100)}%</strong><em>${nf.format(op)} MW · obra ${nf.format(ob)} MW</em></div>
   <div class="kpi"><small>Con contrato pero sin obra</small><strong>${nf.format(ct)} MW</strong><em>sobre todo esquema mixto 2026</em></div>
   <div class="kpi"><small>Solo anuncio, planeación o concurso</small><strong>${nf.format(pap)} MW</strong><em>${nf1.format(pap/tot*100)}% de lo registrado</em></div>
   <div class="kpi"><small>Demanda anunciada (data centers)</small><strong>${nf.format(d3.sum(dem,r=>r.mw||0))} MW</strong><em>${dem.length} anuncios · 1 detenido</em></div>
   <div class="kpi"><small>Alertas de hito</small><strong style="color:var(--danger)">${alerts}</strong><em>vencidas o del día, sin evidencia</em></div>`;
  $("vl-n").textContent = `${R.length} registros · ${PROGRAMS.length} programas marco · ${METAS.length} metas declaradas`;
}

/* ---- embudo ---- */
function renderFunnel(){
  const meta = (METAS.find(m=>m.id==="meta-32gw")||{n:32000}).n;
  const tot=d3.sum(GEN,r=>r.mw), c3=d3.sum(GEN.filter(r=>r.stage>=3&&r.stage<=5),r=>r.mw), c4=d3.sum(GEN.filter(r=>r.stage>=4&&r.stage<=5),r=>r.mw), c5=d3.sum(GEN.filter(r=>r.stage===5),r=>r.mw);
  const rows=[["Meta oficial a 2030",meta,"var(--line2)","Declarada por SENER"],["Con proyecto, lugar y etapa",tot,"var(--s1)","Expediente en el radar"],["Con contrato o más",c3,"var(--s3)","Adjudicado, en obra u operando"],["En obra o encendido",c4,"var(--s4)","Construcción u operación"],["Encendido",c5,"var(--s5)","En operación comercial"]];
  const w=640,rowH=64,h=rows.length*rowH+8,cx=320,maxW=300,sc=v=>v/meta*maxW;
  let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Embudo de materialización: ${rows.map(r=>r[0]+" "+nf.format(r[1])+" MW").join(", ")}">`;
  rows.forEach((r,i)=>{
    const y=i*rowH+6, bw=sc(r[1]), x0=cx-bw/2;
    if(i<rows.length-1){const nb=sc(rows[i+1][1]);
      s+=`<path d="M${x0},${y+34} L${x0+bw},${y+34} L${cx+nb/2},${y+rowH} L${cx-nb/2},${y+rowH}Z" fill="${rows[i+1][2]}" opacity=".16"/>`;}
    s+=`<rect x="${x0}" y="${y}" width="${Math.max(2,bw)}" height="34" rx="4" fill="${r[2]}"${i===0?' fill-opacity=".55" stroke="var(--muted)" stroke-dasharray="4 3"':''}/>`;
    s+=`<text x="12" y="${y+15}" style="fill:var(--fg);font-weight:600">${r[0]}</text><text x="12" y="${y+31}" style="font-size:11px">${r[3]}</text>`;
    s+=`<text x="${w-8}" y="${y+16}" text-anchor="end" class="big" style="font-size:20px">${nf.format(r[1])}</text><text x="${w-8}" y="${y+31}" text-anchor="end" class="mono" style="font-size:11px">MW · ${nf1.format(r[1]/meta*100)}% de la meta</text>`;
  });
  $("funnel").innerHTML=s+`</svg>`;
  return {meta,tot,c3,c4,c5};
}

/* ---- carrera contra 2030 ---- */
function renderRace(F){
  const t0=new Date("2025-01-01T12:00:00"), t1=new Date("2030-12-31T12:00:00");
  const ops=GEN.filter(r=>r.stage===5 && r.fop).map(r=>({d:parse(r.fop),mw:r.mw,n:r.name})).sort((a,b)=>a.d-b.d);
  let acc=0; const steps=[{d:t0,v:0}]; ops.forEach(o=>{steps.push({d:o.d,v:acc}); acc+=o.mw; steps.push({d:o.d,v:acc,n:o.n,mw:o.mw});}); steps.push({d:TODAY,v:acc});
  const months=(TODAY-t0)/2.63e9, rate=acc/months, need=F.meta/((t1-t0)/2.63e9);
  const proj=acc+rate*((t1-TODAY)/2.63e9);
  const dm=CFG.ctx.dem_max_2024, g=CFG.ctx.tmca/100;
  const demLine=d3.range(2025,2031).map(y=>({d:new Date(y+"-12-31T12:00:00"),v:dm*(Math.pow(1+g,y-2024)-1)})); demLine.unshift({d:t0,v:dm*g*0});
  const w=640,h=330,m={l:52,r:120,t:16,b:30};
  const x=d3.scaleTime().domain([t0,t1]).range([m.l,w-m.r]), y=d3.scaleLinear().domain([0,F.meta*1.05]).range([h-m.b,m.t]);
  const L=d3.line().x(d=>x(d.d)).y(d=>y(d.v));
  let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Carrera de capacidad encendida contra la meta de 2030">`;
  y.ticks(5).forEach(t=>{s+=`<line x1="${m.l}" x2="${w-m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${m.l-6}" y="${y(t)+4}" text-anchor="end" class="mono" style="font-size:10.5px">${nf.format(t/1000)}k</text>`;});
  d3.range(2025,2031).forEach(yr=>{const xx=x(new Date(yr+"-01-01T12:00:00"));s+=`<text x="${xx}" y="${h-10}" class="mono" style="font-size:10.5px">${yr}</text>`;});
  s+=`<path d="${L([{d:t0,v:0},{d:t1,v:F.meta}])}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="6 4" fill="none"/>`;
  s+=`<text x="${x(t1)+6}" y="${y(F.meta)+4}" style="font-size:11px;fill:var(--fg)">Meta 32 GW</text><text x="${x(t1)+6}" y="${y(F.meta)+18}" class="mono" style="font-size:10px">≈${nf.format(need)} MW/mes</text>`;
  s+=`<path d="${L(demLine)}" stroke="var(--dem)" stroke-width="1.6" stroke-dasharray="2 3" fill="none"/>`;
  s+=`<text x="${x(t1)+6}" y="${y(demLine[demLine.length-1].v)+4}" style="font-size:11px;fill:var(--dem)">+${nf.format(demLine[demLine.length-1].v)} MW</text><text x="${x(t1)+6}" y="${y(demLine[demLine.length-1].v)+18}" style="font-size:10px">demanda máxima</text>`;
  const area=d3.area().x(d=>x(d.d)).y0(y(0)).y1(d=>y(d.v));
  s+=`<path d="${area(steps)}" fill="var(--s5)" fill-opacity=".28"/><path d="${L(steps)}" stroke="var(--s5)" stroke-width="2" fill="none"/>`;
  s+=`<path d="${L([{d:TODAY,v:acc},{d:t1,v:proj}])}" stroke="var(--s5)" stroke-width="1.2" stroke-dasharray="3 3" fill="none"/>`;
  s+=`<text x="${x(t1)+6}" y="${y(proj)+4}" style="font-size:11px;fill:var(--s5)">${nf.format(proj)} MW</text><text x="${x(t1)+6}" y="${y(proj)+18}" style="font-size:10px">al ritmo actual</text>`;
  // barra «hoy»: lo que está en tubería
  const ob=F.c4-F.c5, ct=F.c3-F.c4, pap=F.tot-F.c3; let yy=acc; const bx=x(TODAY)-5;
  [[ob,"var(--s4)","Obra"],[ct,"var(--s3)","Contrato"],[pap,"var(--s0)","Papel"]].forEach(([v,c,l])=>{s+=`<rect x="${bx}" y="${y(yy+v)}" width="10" height="${y(yy)-y(yy+v)}" fill="${c}" opacity=".85"><title>${l}: ${nf.format(v)} MW</title></rect>`; yy+=v;});
  s+=`<line x1="${x(TODAY)}" x2="${x(TODAY)}" y1="${m.t}" y2="${h-m.b}" stroke="var(--line2)"/><text x="${x(TODAY)+8}" y="${y(yy)+4}" style="font-size:10.5px">en tubería: ${nf.format(F.tot-acc)} MW</text><text x="${x(TODAY)+8}" y="${m.t+10}" class="mono" style="font-size:10px">corte</text>`;
  if(can(3)) steps.filter(st=>st.n).forEach(st=>{s+=`<circle cx="${x(st.d)}" cy="${y(st.v)}" r="3" fill="var(--s5)"><title>${esc(st.n)}: +${nf.format(st.mw)} MW · ${st.d.toLocaleDateString("es-MX",{month:"short",year:"numeric"})}</title></circle>`;});
  $("race").innerHTML=s+`</svg><p class="note" style="margin-top:6px">La línea de demanda es el crecimiento esperado de la demanda máxima nacional desde 2024 (${nf.format(dm)} MW, ${CFG.ctx.tmca}% anual, planeación oficial). La proyección al ritmo actual es lineal y solo ilustrativa.</p>`;
  $("insight").innerHTML=`<div><strong>${nf.format(rate)} MW/mes</strong><span>ritmo de encendido registrado desde enero de 2025, frente a ${nf.format(need)} MW/mes que pide la meta</span></div>
   <div><strong>${nf1.format(F.c5/F.meta*100)}%</strong><span>de la meta 2030 ya opera; ${nf1.format((F.c3)/F.meta*100)}% tiene al menos contrato</span></div>
   <div><strong>${nf.format(F.tot-F.c3)} MW</strong><span>anunciados que siguen sin contrato: el tramo del embudo donde más se pierde</span></div>`;
}

/* ---- filtros UI ---- */
function chip(label,color,pressed,onClick){
  const b=document.createElement("button"); b.className="chip"; b.type="button"; b.setAttribute("aria-pressed",pressed);
  b.innerHTML=(color?`<i style="background:${color}"></i>`:"")+label; b.onclick=()=>onClick(b); return b;
}
function toggleSet(set,val,b){ set.has(val)?set.delete(val):set.add(val); b.setAttribute("aria-pressed",set.has(val)); renderAll(); }
function segs(id,fn){ const el=$(id); if(!el) return; el.querySelectorAll("button").forEach(b=>b.onclick=()=>{el.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));fn(b.dataset.v);}); }
function buildFilters(){
  Object.entries(TECH).forEach(([k,t])=>$("f-tech").appendChild(chip(t.n.split(" (")[0],techVar(k),true,b=>toggleSet(S.tech,k,b))));
  [0,1,2,3,4,5,9].forEach(s=>$("f-stage").appendChild(chip(s===9?"Detenido":STAGE_SHORT[s],stageVar(s),true,b=>toggleSet(S.stage,s,b))));
  if($("f-lvl")) ["A","B","C","D"].forEach(l=>{const c=chip(l,null,true,b=>toggleSet(S.lvl,l,b)); c.title=LVL[l]; $("f-lvl").appendChild(c);});
  if($("f-layers")){
    const LY=[["se","Subestaciones ≥230 kV","var(--se)"],["ce","Centrales existentes","var(--ce)"],["cm","Consumo municipal","var(--dem)"]];
    if(D.CE && D.CE.some(c=>c[4]==="perm")) LY.push(["cp","Privados con permiso","var(--ok)"]);
    LY.forEach(([k,n,c])=>$("f-layers").appendChild(chip(n,c,false,b=>{S.layers.has(k)?S.layers.delete(k):S.layers.add(k);b.setAttribute("aria-pressed",S.layers.has(k));renderLayers();renderLegend();})));
  }
  segs("colorby",v=>{S.colorBy=v;renderMap();});
  segs("heat",v=>{S.heat=v;renderMap();});
  segs("net",v=>{S.net=v;renderNet();renderLegend();});
  segs("sweight",v=>{S.sWeight=v;renderSankey();});
  segs("scolor",v=>{S.sColor=v;renderSankey();});
  if($("q")) $("q").addEventListener("input",e=>{S.q=e.target.value.trim().toLowerCase();renderAll();});
  if($("s-cols")){
    const COLS=[["orig","Origen"],["sch","Esquema"],["tech","Tecnología"],["region","Región"],["stage","Etapa"]];
    COLS.forEach(([k,n])=>$("s-cols").appendChild(chip(n,null,S.sCols.includes(k),b=>{
      const on=S.sCols.includes(k); if(on && S.sCols.length<=2) return;
      S.sCols = on ? S.sCols.filter(x=>x!==k) : COLS.map(c=>c[0]).filter(c=>c===k||S.sCols.includes(c));
      b.setAttribute("aria-pressed",!on); renderSankey();
    })));
  }
}

/* ---- mapa ---- */
const W=900,H=600;
const states=topojson.feature(D.TOPO,D.TOPO.objects[Object.keys(D.TOPO.objects)[0]]);
const stName = n => n.replace(" de Zaragoza","").replace(" de Ocampo","").replace(" de Ignacio de la Llave","");
const proj=d3.geoConicConformal().parallels([17.5,29.5]).rotate([102,0]).fitExtent([[14,14],[W-14,H-56]],states);
const path=d3.geoPath(proj);
const svg=d3.select("#map");
svg.append("rect").attr("width",W).attr("height",H).attr("fill","var(--sea)");
const gRoot=svg.append("g");
gRoot.append("path").attr("class","grat").attr("d",path(d3.geoGraticule().step([5,5]).extent([[-125,5],[-75,40]])()));
const gNeigh=gRoot.append("g"), gStates=gRoot.append("g"), gHeat=gRoot.append("g"), gSea=gRoot.append("g"), gCM=gRoot.append("g"), gCE=gRoot.append("g"), gNet=gRoot.append("g"), gSE=gRoot.append("g"), gLabels=gRoot.append("g"), gCty=gRoot.append("g"), gLines=gRoot.append("g"), gPts=gRoot.append("g");
if(D.NEIGH){ const nf_=topojson.feature(D.NEIGH,D.NEIGH.objects[Object.keys(D.NEIGH.objects)[0]]);
  gNeigh.selectAll("path").data(nf_.features).join("path").attr("class","neigh").attr("d",path); }
gStates.selectAll("path").data(states.features).join("path").attr("class","st").attr("d",path);
const SEAS=[["Océano Pacífico",-109.5,16.6,15,0],["Golfo de México",-93.2,24.6,13,0],["Golfo de California",-111.6,28.3,9,-48],["Mar Caribe",-85.2,18.2,10,0],["Estados Unidos",-103.5,32.9,10,0],["Guatemala",-90.6,15.4,8,0]];
gSea.selectAll("text").data(SEAS).join("text").attr("class","sealab").attr("text-anchor","middle")
  .attr("transform",d=>{const p=proj([d[1],d[2]]);return `translate(${p})rotate(${d[4]})`;}).attr("data-fs",d=>d[3]).style("font-size",d=>d[3]+"px").text(d=>d[0]);
const CITIES=[["Ciudad de México",-99.13,19.43,1],["Guadalajara",-103.35,20.67,1],["Monterrey",-100.31,25.67,1],["Tijuana",-117.04,32.53,1],["Mexicali",-115.45,32.62,2],["Hermosillo",-110.96,29.07,1],["Chihuahua",-106.09,28.63,2],["La Paz",-110.31,24.14,1],["Los Cabos",-109.70,23.06,2],["Mérida",-89.62,20.97,1],["Cancún",-86.85,21.16,1],["Querétaro",-100.39,20.59,2],["Puebla",-98.20,19.04,2],["Veracruz",-96.13,19.18,2],["Villahermosa",-92.93,17.99,2],["Culiacán",-107.39,24.81,2],["Torreón",-103.41,25.54,2],["San Luis Potosí",-100.98,22.15,2],["León",-101.68,21.12,2],["Oaxaca",-96.73,17.07,2],["Tuxtla Gutiérrez",-93.12,16.75,2],["Saltillo",-101.0,25.42,2],["Mazatlán",-106.42,23.24,2],["Guerrero Negro",-114.05,27.96,2],["Ciudad Constitución",-111.66,25.03,2]];
const gC=gCty.selectAll("g").data(CITIES).join("g").attr("transform",d=>`translate(${proj([d[1],d[2]])})`);
gC.append("circle").attr("class","cty"); gC.append("text").attr("class","ctylab").attr("x",4).attr("y",-4).text(d=>d[0]);
const hvF=topojson.feature(D.LT_HV,D.LT_HV.objects[Object.keys(D.LT_HV.objects)[0]]).features;
const mvF=D.LT_MV?topojson.feature(D.LT_MV,D.LT_MV.objects[Object.keys(D.LT_MV.objects)[0]]):null;
const gMv=gNet.append("path").attr("class","net").attr("stroke","var(--n115)").attr("stroke-width",.7);
const gHv=gNet.append("g");
const silOf = p => p.v>=400&&!p.o ? 550*(p.c||1) : 150*(p.c||1);
function lineTip(p){
  if(!p.n) return `<b>Línea de ${p.v} kV en operación</b><span>Nombre, circuitos y capacidad de referencia desde el nivel 3 · Plataforma.</span>`;
  return `<b>${esc(p.n)}</b><span>${p.v} kV${p.o?" (opera en 230 kV)":""} · ${p.c?p.c+" circuito"+(p.c>1?"s":""):"circuitos s/d"}${p.cd?" · "+p.cd+" ACSR":""} · ${nf1.format(p.k||0)} km<br>Capacidad ref. ≈ ${nf.format(silOf(p))} MW · en operación</span>`;
}
const tip=$("tip"), mapbox=$("mapbox");
function placeTip(e,html){ const b=mapbox.getBoundingClientRect(); tip.innerHTML=html; tip.hidden=false; let x=e.clientX-b.left+14; if(x>b.width-270) x=e.clientX-b.left-270; tip.style.left=x+"px"; tip.style.top=(e.clientY-b.top+14)+"px"; }
function renderNet(){
  gMv.attr("d",S.net==="all"&&mvF?path(mvF):null);
  const d=S.net==="none"?[]:hvF;
  gHv.selectAll("path").data(d).join("path").attr("class","net hv").attr("d",path)
    .attr("stroke",f=>f.properties.v>=400?"var(--n400)":"var(--n230)")
    .classed("sel",f=>f.properties.i!=null&&f.properties.i===S.selLine)
    .attr("stroke-width",f=>f.properties.i===S.selLine&&S.selLine?3.5:f.properties.v>=400?1.5:1)
    .on("click",(e,f)=>{ if(can(3)) selectLine(f.properties.i,false); })
    .on("mousemove",(e,f)=>placeTip(e,lineTip(f.properties))).on("mouseleave",()=>tip.hidden=true);
}
let K=1;
const zoom=d3.zoom().filter(e=>(e.type!=="wheel"||e.ctrlKey||e.metaKey)&&!e.button).scaleExtent([1,12]).translateExtent([[0,0],[W,H]]).on("zoom",e=>{K=e.transform.k;gRoot.attr("transform",e.transform);sizeMarks();renderScale();});
svg.call(zoom).on("dblclick.zoom",null);
$("zin").onclick=()=>svg.transition().duration(400).call(zoom.scaleBy,1.6);
$("zout").onclick=()=>svg.transition().duration(400).call(zoom.scaleBy,1/1.6);
const PRESETS=[["México",null],["Noroeste",[[-117.5,26.5],[-108.5,33]]],["BCS",[[-115.5,22.6],[-108.8,28.2]]],["Bajío",[[-103,19],[-98.8,22.4]]],["Península",[[-92.6,17.6],[-86.6,22]]]];
PRESETS.forEach(([n,b])=>{const x=document.createElement("button");x.textContent=n;x.type="button";x.onclick=()=>flyTo(b);$("presets").appendChild(x);});
function flyTo(b){
  if(!b){svg.transition().duration(600).call(zoom.transform,d3.zoomIdentity);return;}
  const [[x0,y0],[x1,y1]]=[proj(b[0]),proj(b[1])];
  const bx0=Math.min(x0,x1),bx1=Math.max(x0,x1),by0=Math.min(y0,y1),by1=Math.max(y0,y1);
  const k=Math.min(12,0.9/Math.max((bx1-bx0)/W,(by1-by0)/H));
  svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(bx0+bx1)/2,-(by0+by1)/2));
}
function renderScale(){
  // 1° de latitud ≈ 111.2 km: medida local en el centro de la vista
  const c=proj.invert([W/2,H/2]); if(!c) return;
  const p0=proj([c[0],c[1]]), p1=proj([c[0],c[1]+1]); const pxPerKm=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])/111.2*K;
  const box=mapbox.getBoundingClientRect(), scr=box.width/W;
  const opts=[25,50,100,200,250,500]; let km=opts.find(o=>o*pxPerKm*scr>=70)||500;
  $("scalebar").innerHTML=`${km} km<i style="width:${km*pxPerKm*scr}px"></i>`;
}
const rOf = r => r.tech==="tx" ? 4.2 : (r.mw ? 3.2+Math.sqrt(r.mw)*0.36 : 5.5);
function sizeMarks(){
  gPts.selectAll(".mk").each(function(r){
    const s=rOf(r)/Math.sqrt(K), g=d3.select(this);
    g.select(".core").attr("r",s).attr("width",s*1.7).attr("height",s*1.7).attr("x",-s*.85).attr("y",-s*.85);
    g.select(".halo").attr("r",s+2/K);
    g.select(".xmark").attr("d",`M${-s*.6},${-s*.6}L${s*.6},${s*.6}M${s*.6},${-s*.6}L${-s*.6},${s*.6}`);
  });
  gLabels.selectAll("text").style("font-size",(9/K)+"px");
  gSea.selectAll("text").style("font-size",function(){return (+this.getAttribute("data-fs"))/Math.sqrt(K)+"px";});
  gCty.selectAll("g").style("display",d=>d[3]===1||K>=2.2?null:"none");
  gCty.selectAll("circle").attr("r",2/Math.sqrt(K)).attr("stroke-width",.8);
  gCty.selectAll("text").style("font-size",(10/K)+"px").attr("x",4/K).attr("y",-4/K).style("stroke-width",(2.5/K)+"px");
  gSE.selectAll("rect").attr("width",4/Math.sqrt(K)).attr("height",4/Math.sqrt(K)).attr("x",-2/Math.sqrt(K)).attr("y",-2/Math.sqrt(K));
  gCE.selectAll("circle").attr("r",d=>(1.2+Math.sqrt(d[2])*0.18)/Math.sqrt(K));
  gCM.selectAll("circle").attr("r",d=>(0.6+Math.sqrt(d[2])*0.09)/Math.sqrt(K));
}
gLabels.selectAll("text").data(states.features.filter(f=>d3.geoArea(f)>0.0018)).join("text").attr("class","maplabel")
  .attr("text-anchor","middle").attr("x",f=>path.centroid(f)[0]).attr("y",f=>path.centroid(f)[1])
  .text(f=>stName(f.properties.NOM_ENT).toUpperCase().replace("BAJA CALIFORNIA SUR","BCS").replace("BAJA CALIFORNIA","B. CALIFORNIA").replace("CIUDAD DE MÉXICO","").replace("TLAXCALA","").replace("MORELOS","").replace("AGUASCALIENTES",""));
const TECN={cc:"Ciclo combinado",term:"Térmica",hid:"Hidroeléctrica",eol:"Eólica",fv:"Fotovoltaica",carb:"Carboeléctrica",nuc:"Nuclear",geo:"Geotérmica"};
function renderLayers(){
  const se=S.layers.has("se")&&D.SE_HV?D.SE_HV:[];
  gSE.selectAll("g").data(se).join(en=>{const g=en.append("g");g.append("rect").attr("class","se230");return g;})
    .attr("transform",d=>`translate(${proj([d[0],d[1]])})`).on("mousemove",(e,d)=>placeTip(e,`<b>SE ${esc(d[3])}</b><span>${d[2]} kV · ${esc(d[4])} · en operación</span>`)).on("mouseleave",()=>tip.hidden=true)
    .select("rect").attr("fill",d=>d[2]>=400?"var(--n400)":"var(--se)");
  const ce=D.CE?D.CE.filter(c=>(S.layers.has("ce")&&c[4]==="op")||(S.layers.has("cp")&&c[4]==="perm")):[];
  gCE.selectAll("circle").data(ce,d=>d[5]+d[0]).join("circle").attr("class",d=>d[4]==="op"?"ceop":"ceperm")
    .attr("cx",d=>proj([d[0],d[1]])[0]).attr("cy",d=>proj([d[0],d[1]])[1])
    .on("mousemove",(e,d)=>placeTip(e,`<b>${esc(d[5])}</b><span>${TECN[d[3]]||d[3]} · ${nf1.format(d[2])} MW · ${d[6]==="P"?"Público":"Privado"} · ${d[4]==="op"?"en operación"+(d[7]?" desde "+d[7]:""):"en proyecto con permiso"} · ${esc(d[8])}</span>`)).on("mouseleave",()=>tip.hidden=true);
  const cm=S.layers.has("cm")&&D.CM?D.CM.filter(c=>c[2]>20):[];
  gCM.selectAll("circle").data(cm,d=>d[4]+d[5]).join("circle").attr("class","cmun")
    .attr("cx",d=>proj([d[0],d[1]])[0]).attr("cy",d=>proj([d[0],d[1]])[1])
    .on("mousemove",(e,d)=>placeTip(e,`<b>${esc(d[4])}, ${esc(d[5])}</b><span>Consumo facturado 2018: ${nf.format(d[2])} GWh · industria y servicios ${nf.format(d[3])} GWh</span>`)).on("mouseleave",()=>tip.hidden=true);
  sizeMarks();
}
function showTip(e,r){ placeTip(e,`<b>${esc(r.name)}</b><span>${r.state} · ${stageName(r.stage)}${r.mw?` · ${nf1.format(r.mw)} MW`:""}</span>`); }
function renderMap(){
  const vis=visible();
  let byState, mx;
  if(S.heat==="gap"){ byState=d3.rollup(vis.filter(r=>r.stage<=2&&r.mw&&r.tech!=="dem"&&r.lat!=null),v=>d3.sum(v,r=>r.mw),r=>r.state); }
  else if(S.heat==="cons"){ byState=new Map(states.features.map(f=>[stName(f.properties.NOM_ENT),(D.CONS_ST[f.properties.CVE_ENT]||[0])[0]])); }
  mx=byState?d3.max([...byState.values()])||1:1;
  gHeat.selectAll("path").data(S.heat!=="none"?states.features:[]).join("path").attr("class","st-heat").attr("d",path)
    .style("fill",S.heat==="cons"?"var(--dem)":"var(--fg)")
    .attr("fill-opacity",f=>{const v=byState.get(stName(f.properties.NOM_ENT));return v?(S.heat==="cons"?0.04+0.42*Math.sqrt(v/mx):0.05+0.2*Math.sqrt(v/mx)):0;})
    .on("mousemove",(e,f)=>{ if(S.heat!=="cons") return; const c=D.CONS_ST[f.properties.CVE_ENT]; if(c) placeTip(e,`<b>${stName(f.properties.NOM_ENT)}</b><span>Consumo facturado 2018: ${nf.format(c[0])} GWh · industria y servicios ${nf.format(c[1])} GWh · doméstico ${nf.format(c[2])} GWh</span>`);})
    .on("mouseleave",()=>tip.hidden=true).style("pointer-events",S.heat==="cons"?"auto":"none");
  const lines=vis.filter(r=>r.line);
  gLines.selectAll("path").data(lines,r=>r.id).join("path").attr("class","txline")
    .attr("d",r=>path({type:"LineString",coordinates:r.line})).attr("stroke",r=>colorOf(r)).attr("stroke-width",r=>r.id===S.sel?4:2.4)
    .attr("stroke-dasharray",r=>r.stage<5?"6 4":null).on("mousemove",(e,r)=>showTip(e,r)).on("mouseleave",()=>tip.hidden=true).on("click",(e,r)=>select(r.id));
  const pts=vis.filter(r=>r.lat!=null && !r.line).sort((a,b)=>(b.mw||0)-(a.mw||0));
  const g=gPts.selectAll(".mk").data(pts,r=>r.id).join(enter=>{
    const m=enter.append("g").attr("class","mk").attr("tabindex",0).attr("role","button");
    m.append("circle").attr("class","halo");
    m.each(function(r){ const s=d3.select(this);
      if(r.tech==="dem") s.append("rect").attr("class","core").attr("transform","rotate(45)"); else s.append("circle").attr("class","core");
      if(r.stage===9) s.append("path").attr("class","xmark").attr("stroke","var(--bg)").attr("stroke-width",1.6).attr("vector-effect","non-scaling-stroke"); });
    return m;
  });
  g.attr("transform",r=>`translate(${proj([r.lon,r.lat])})`).attr("aria-label",r=>r.name)
   .classed("alert",r=>r.alert==="today"||r.alert==="over").classed("sel",r=>r.id===S.sel)
   .on("mousemove",(e,r)=>showTip(e,r)).on("mouseleave",()=>tip.hidden=true)
   .on("click",(e,r)=>select(r.id)).on("keydown",(e,r)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(r.id);}});
  g.select(".halo").attr("stroke",r=>r.alert==="over"?"var(--danger)":"var(--amber)");
  g.select(".core").attr("fill",r=>r.stage===0?"transparent":colorOf(r)).attr("fill-opacity",r=>r.stage===0?0:(r.tech==="dem"?0.25:0.9))
   .attr("stroke",r=>r.id===S.sel?"var(--fg)":(r.stage===0||r.tech==="dem")?colorOf(r):"var(--bg)")
   .attr("stroke-width",r=>r.id===S.sel?2.4:(r.stage===0||r.tech==="dem")?1.8:0.8)
   .attr("stroke-dasharray",r=>r.stage===0||r.approx?"3 2":null).attr("vector-effect","non-scaling-stroke");
  sizeMarks(); renderLegend();
  const off=vis.filter(r=>r.lat==null);
  $("offmap").innerHTML = off.length ? off.map(r=>`<button type="button" data-id="${r.id}"><span class="pill" style="background:${stageVar(r.stage)}">${STAGE_SHORT[r.stage]||"Det."}</span> ${esc(r.name)} · <span class="num">${r.mw?nf.format(r.mw)+" MW":"—"}</span></button>`).join("") : `<span class="sub">Ninguno con los filtros actuales.</span>`;
  document.querySelectorAll("#offmap button").forEach(b=>b.onclick=()=>select(b.dataset.id));
}
function renderLegend(){
  const items = S.colorBy==="stage" ? [0,1,2,3,4,5,9].map(s=>`<span><i style="background:${stageVar(s)}"></i>${s===9?"Detenido":STAGE_SHORT[s]}</span>`).join("")
    : Object.keys(TECH).map(k=>`<span><i style="background:${techVar(k)}"></i>${TECH[k].n.split(" (")[0]}</span>`).join("");
  $("legend").innerHTML = items + `<span><i class="ring"></i>Solo anuncio o lugar aproximado</span><span><i class="dia" style="background:transparent;border:1.5px solid var(--muted)"></i>Demanda</span>`
    +(S.heat==="gap"?`<span><i style="background:var(--fg);opacity:.25;border-radius:2px"></i>Más claro = más MW sin contrato</span>`:S.heat==="cons"?`<span><i style="background:var(--dem);opacity:.45;border-radius:2px"></i>Consumo eléctrico 2018</span>`:"")
    +(S.net!=="none"?`<span><i style="height:3px;border-radius:0;background:var(--n400)"></i>400 kV</span><span><i style="height:2px;border-radius:0;background:var(--n230)"></i>230 kV</span>`:"")
    +(S.layers.has("se")?`<span><i style="border-radius:1px;background:var(--se)"></i>Subestación ≥230 kV</span>`:"")
    +(S.layers.has("ce")?`<span><i style="background:var(--ce);opacity:.5"></i>Central existente</span>`:"")
    +(S.layers.has("cm")?`<span><i style="background:var(--dem);opacity:.5"></i>Consumo municipal</span>`:"");
}

/* ---- ficha ---- */
function select(id,scroll){ S.sel=id; renderMap(); renderFicha(); renderTable(); if(scroll) $("mapa").scrollIntoView({behavior:"smooth"}); }
function gridBox(r){
  if(r.tech==="tx"){ const c=D.BASECHK&&D.BASECHK[r.id]; return c?`<div class="gridbox"><b class="t">Contraste con la red de 2024</b>${c}</div>`:""; }
  if(r.tier==null) return "";
  const t=tierOf(r.dist!=null?r.dist:[2,15,50,150,9999][r.tier]);
  if(!can(3)) return `<div class="gridbox"><b class="t">Red existente</b><span class="tier" style="color:${t.c}">${BANDT[r.tier]}</span><div class="sub" style="margin-top:6px">Kilómetros exactos, línea y subestación más cercanas desde el nivel 3.</div></div>`;
  const hv=r.grid&&r.grid.hv, an=r.grid&&r.grid.any;
  const prec=(r.prec==="municipio"||r.prec==="estado"||r.prec==="aproximada")?`<br><span class="sub">Distancia indicativa: precisión de ${r.prec}; el error puede superar 10 km.</span>`:"";
  return `<div class="gridbox"><b class="t">Red existente</b><span class="tier" style="color:${t.c}">${t.t}</span>
   ${hv?`<div style="margin-top:6px">Línea ≥230 kV: <b class="num">${nf1.format(hv[0])} km</b> · ${esc(hv[1])} (${hv[2]} kV)</div>`:`<div style="margin-top:6px">Sin red de 230 o 400 kV en este sistema eléctrico.</div>`}
   ${an?`<div>Cualquier tensión: <b class="num">${nf1.format(an[0])} km</b> · ${esc(an[1])} (${an[2]} kV)</div>`:""}
   ${r.se?`<div>Subestación ≥230 kV: <b class="num">${nf1.format(r.se[0])} km</b> · ${esc(r.se[1])} (${r.se[2]} kV)</div>`:""}${prec}</div>`;
}
function renderFicha(){
  const r=R.find(x=>x.id===S.sel), F=$("ficha");
  if(!r){F.innerHTML=`<p class="note">Selecciona un marcador.</p>`;return;}
  const ladder=[0,1,2,3,4,5].map(i=>`<div style="background:${r.stage===9?(i===0?"var(--s9)":"var(--line)"):(i<=r.stage?stageVar(i):"var(--line)")}"></div>`).join("");
  let hit="", alertBox="";
  if(can(2) && r.hitos){
    const nextLi=r.next?`<li class="${r.alert==="over"?"over":"next"}"><time>${fmtD(r.next[0])}${r.alert==="over"?" · vencido":r.alert==="today"?" · hoy":r.days>0?` · en ${r.days} días`:""}</time>${esc(r.next[1])}</li>`:"";
    hit=`<div><div class="kick" style="margin-bottom:6px">Hitos registrados</div><ul class="tl">${r.hitos.map(h=>`<li><time>${fmtD(h[0])}</time>${esc(h[1])}</li>`).join("")}${nextLi}</ul></div>`;
    alertBox = r.alert==="today"?`<div class="flag"><b>Hito hoy.</b> ${esc(r.next[1])}. Verificar resultado en la fuente oficial.</div>`:r.alert==="over"?`<div class="flag red"><b>Hito vencido sin evidencia.</b> ${esc(r.next[1])} estaba previsto para el ${fmtD(r.next[0])}.</div>`:"";
  } else if(r.alert){ alertBox=`<div class="flag${r.alert==="over"?" red":""}"><b>${r.alert==="over"?"Tiene un hito vencido sin evidencia.":"Tiene un hito próximo."}</b> La fecha y el detalle llegan en el boletín semanal.</div>`; }
  const src = can(4)&&r.src ? `<div class="src"><span class="lvl" title="${LVL[r.lvl]}">${r.lvl}</span>${LVL[r.lvl]} · origen: ${esc(r.orig)}<br><a href="${r.src[1]}" target="_blank" rel="noopener">${esc(r.src[0])}</a></div>`
    : can(3)&&r.lvl ? `<div class="src"><span class="lvl" title="${LVL[r.lvl]}">${r.lvl}</span>${LVL[r.lvl]} · origen: ${esc(r.orig)}${r.src?` · ${esc(r.src[0])}`:""}<span class="locktag">enlace nivel 4</span></div>`
    : `<div class="src">Anunciado por: ${esc(r.orig)}</div>`;
  const ups = !can(3) ? lock(can(2)?3:2, can(2)?"Índice, distancia exacta, banderas y certeza de la fuente":"Hitos, fechas comprometidas y alertas", can(2)?"La ficha completa muestra el índice 0–100, la línea y subestación más cercanas y las banderas de duda.":"La línea de tiempo de cada proyecto y su próximo hito.") : "";
  F.innerHTML = `
   <div><div class="kick">Ficha de proyecto${can(3)?" · "+r.id:""}</div><h3>${esc(r.name)}</h3></div>
   <div class="tags"><span class="tag"><i style="background:${techVar(r.tech)}"></i>${TECH[r.tech].n}</span><span class="tag">${r.sch}</span><span class="pill" style="background:${stageVar(r.stage)}">${stageName(r.stage)}</span></div>
   <p class="note">${r.state}${r.mun?" · "+esc(r.mun):""}${r.prec?" · precisión: <b>"+r.prec+"</b>":""}${r.inf?" · inferida":""} · región ${r.region}</p>
   <div class="mgrid">
     <div><small>${r.tech==="dem"?"Carga anunciada":"Capacidad"}</small><strong>${r.mw?nf1.format(r.mw)+" MW":"—"}</strong></div>
     <div><small>Inversión</small><strong>${r.usd?nf.format(r.usd)+" M USD":can(3)?"—":'<span class="locktag" style="margin:0">nivel 3</span>'}</strong></div>
     <div><small>Índice</small><strong style="color:${r.idx>=75?"var(--s5)":r.idx<30?"var(--danger)":"var(--fg)"}">${r.idx!=null?r.idx:'<span class="locktag" style="margin:0">nivel 3</span>'}</strong></div>
   </div>
   <div><div class="ladder" aria-hidden="true">${ladder}</div><div class="ladderlab">${STAGE_SHORT.map(s=>`<span>${s}</span>`).join("")}</div></div>
   ${alertBox}${hit}${gridBox(r)}${(r.flags||[]).map(f=>`<div class="flag">${esc(f)}</div>`).join("")}${src}${ups}`;
}

/* ---- tabla ---- */
const meter = r => `<span class="meter" aria-hidden="true">${[0,1,2,3,4,5].map(i=>`<i style="${r.stage===9?(i===0?"background:var(--s9)":""):(i<=r.stage?`background:${stageVar(i)}`:"")}"></i>`).join("")}</span>`;
const COLS=[["name","Proyecto",1],["state","Estado",1],["tech","Tecnología",1],["mw","MW",1,"r"],["stage","Etapa",1],["last","Último hito",2],["next","Próximo hito",2],["dist","Red ≥230 kV",1,"r"],["lvl","Fuente",3],["idx","Índice",3,"r"]];
function buildHead(){ $("thead").innerHTML=COLS.filter(c=>can(c[2])).map(c=>`<th${c[3]?' class="r"':""} data-k="${c[0]}">${c[1]}</th>`).join("");
  document.querySelectorAll("#tbl th").forEach(th=>th.onclick=()=>{const k=th.dataset.k;S.sortDir=S.sortK===k?-S.sortDir:1;S.sortK=k;renderTable();}); }
function renderTable(){
  let v=visible().slice();
  if(!can(2)&&S.sortK==="next") S.sortK="mw", S.sortDir=-1;
  const key={name:r=>r.name,state:r=>r.state,tech:r=>TECH[r.tech].n,mw:r=>r.mw||-1,stage:r=>r.stage===9?-1:r.stage,last:r=>r.last?r.last[0]:"",next:r=>r.next?r.next[0]:"9999",lvl:r=>r.lvl||"",idx:r=>r.idx||0,dist:r=>r.dist!=null?r.dist:(r.tier!=null?r.tier:-1)}[S.sortK];
  v.sort((a,b)=>{const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*S.sortDir;});
  const total=v.length; if(!can(2)) v=v.slice(0,8);
  $("tbl").querySelector("tbody").innerHTML=v.map(r=>{
    const al=r.alert==="today"?`<span class="alertchip today">HOY</span> `:r.alert==="over"?`<span class="alertchip over">VENCIDO</span> `:r.alert==="soon"?`<span class="alertchip soon">${r.days} d</span> `:"";
    const dist = r.dist!=null ? (r.dist>=9999?'<span class="tier" style="color:var(--danger)">aislado</span>':`<span class="num" style="color:${tierOf(r.dist).c}">${nf1.format(r.dist)} km</span>`)
      : r.tier!=null ? `<span class="tier" style="color:${tierOf([2,15,50,150,9999][r.tier]).c}">${BANDT[r.tier]}</span>` : '<span class="sub">—</span>';
    const cells={name:`<td><b>${esc(r.name)}</b><span class="sub">${r.sch} · ${esc(r.orig||"")}</span></td>`,state:`<td>${r.state}<span class="sub">${r.region}</span></td>`,
      tech:`<td><span class="tag"><i style="background:${techVar(r.tech)}"></i>${TECH[r.tech].n.split(" (")[0]}</span></td>`,mw:`<td class="r num">${r.mw?nf1.format(r.mw):"—"}</td>`,
      stage:`<td style="white-space:nowrap">${meter(r)}${stageName(r.stage)}</td>`,
      last:`<td>${r.last?`<span class="num" style="font-size:11.5px">${fmtD(r.last[0])}</span><span class="sub">${esc(r.last[1])}</span>`:""}</td>`,
      next:`<td>${r.next?`${al}<span class="num" style="font-size:11.5px">${fmtD(r.next[0])}</span><span class="sub">${esc(r.next[1])}</span>`:'<span class="sub">Sin fecha comprometida</span>'}</td>`,
      dist:`<td class="r">${dist}</td>`,lvl:`<td><span class="lvl" title="${LVL[r.lvl]}">${r.lvl}</span></td>`,
      idx:`<td class="r"><span class="idx" style="color:${r.idx>=75?"var(--s5)":r.idx<30?"var(--danger)":"var(--fg)"}">${r.idx}</span></td>`};
    return `<tr data-id="${r.id}"${r.id===S.sel?' style="background:var(--panel2)"':""}>${COLS.filter(c=>can(c[2])).map(c=>cells[c[0]]).join("")}</tr>`;
  }).join("") + (!can(2)&&total>8 ? `<tr class="blurrow"><td colspan="6">Proyecto adicional · estado · etapa · hito comprometido</td></tr><tr class="blurrow"><td colspan="6">Proyecto adicional · estado · etapa · hito comprometido</td></tr>`:"");
  document.querySelectorAll("#tbl tbody tr[data-id]").forEach(tr=>tr.onclick=()=>select(tr.dataset.id,true));
  $("tbl-lock").innerHTML = !can(2) ? `<div style="margin-top:10px">${lock(2,`${total-8} proyectos más, con su último y próximo hito`,"El boletín semanal incluye la tabla completa, las fechas comprometidas y las alertas de vencimiento.")}</div>`
    : !can(3) ? `<div style="margin-top:10px">${lock(3,"Índice de materialización y certeza de cada fuente","La plataforma agrega el índice 0–100, la fuente de cada registro, filtros, búsqueda y la distancia exacta a la red.")}</div>` : "";
}

/* ---- sankey ---- */
const COLNAME={orig:"Origen del anuncio",sch:"Esquema",tech:"Tecnología",region:"Región de control",stage:"Etapa actual"};
const val=(r,k)=>k==="stage"?stageName(r.stage):k==="tech"?TECH[r.tech].n.split(" (")[0]:k==="region"?r.region:r[k];
function renderSankey(){
  const el=$("sankey"), w=Math.max(760,el.parentElement.clientWidth-24), h=can(3)?520:440;
  const wt=S.sWeight==="mw"?r=>r.mw:S.sWeight==="usd"?r=>r.usd:()=>1;
  let vis=visible(); const all=vis.length;
  vis = S.sWeight==="mw" ? vis.filter(r=>r.mw&&r.tech!=="tx"&&r.tech!=="dem") : vis.filter(r=>wt(r));
  $("snote").textContent = S.sWeight==="n"?`${vis.length} registros`:`${vis.length} de ${all} registros con ${S.sWeight==="mw"?"MW de generación (sin transmisión ni demanda)":"monto en USD"}`;
  const cols=S.sCols, nodes=new Map(), links=new Map();
  vis.forEach(r=>{
    cols.forEach((c,i)=>{const id=c+"|"+val(r,c); if(!nodes.has(id)) nodes.set(id,{id,name:val(r,c),col:i,key:c,raw:r});});
    for(let i=0;i<cols.length-1;i++){
      const s=cols[i]+"|"+val(r,cols[i]), t=cols[i+1]+"|"+val(r,cols[i+1]), ck=S.sColor==="stage"?"s"+r.stage:"t"+r.tech, id=s+">"+t+">"+ck;
      const L=links.get(id)||{source:s,target:t,value:0,ck,n:0}; L.value+=wt(r); L.n++; links.set(id,L);
    }
  });
  const sk=d3.sankey().nodeId(d=>d.id).nodeWidth(12).nodePadding(12).nodeAlign(d3.sankeyJustify)
    .nodeSort((a,b)=>{ if(a.key==="stage"){const o=n=>n.name==="Detenido"?-1:STAGES.indexOf(n.name);return o(b)-o(a);} return b.value-a.value; })
    .extent([[190,26],[w-170,h-8]]);
  const svgS=d3.select(el).attr("viewBox",`0 0 ${w} ${h}`); svgS.selectAll("*").remove();
  if(!links.size){svgS.append("text").attr("x",20).attr("y",40).attr("fill","var(--muted)").text("Sin datos con los filtros actuales.");return;}
  const G=sk({nodes:[...nodes.values()].map(d=>({...d})),links:[...links.values()].map(d=>({...d}))});
  const fmtV=v=>S.sWeight==="mw"?nf.format(v)+" MW":S.sWeight==="usd"?nf.format(v)+" M USD":v+" reg.";
  const xs=d3.rollup(G.nodes,v=>d3.mean(v,d=>d.x0),d=>d.col);
  cols.forEach((c,i)=>{const x=xs.get(i); if(x==null) return; svgS.append("text").attr("class","colhead").attr("x",x+6).attr("y",14).attr("text-anchor",i===0?"start":i===cols.length-1?"end":"middle").attr("dx",i===0?-6:i===cols.length-1?6:0).text(COLNAME[c]);});
  svgS.append("g").selectAll("path").data(G.links).join("path").attr("class","slink").attr("d",d3.sankeyLinkHorizontal())
    .attr("stroke",d=>d.ck[0]==="s"?stageVar(d.ck.slice(1)):techVar(d.ck.slice(1))).attr("stroke-width",d=>Math.max(1,d.width))
    .append("title").text(d=>`${d.source.name} → ${d.target.name}\n${fmtV(d.value)} · ${d.n} registro(s)`);
  const nd=svgS.append("g").selectAll("g").data(G.nodes).join("g").attr("class","snode");
  nd.append("rect").attr("x",d=>d.x0).attr("y",d=>d.y0).attr("width",d=>d.x1-d.x0).attr("height",d=>Math.max(1,d.y1-d.y0)).attr("fill",d=>d.key==="stage"?stageVar(d.raw.stage):d.key==="tech"?techVar(d.raw.tech):"var(--muted)");
  nd.append("title").text(d=>`${d.name}: ${fmtV(d.value)}`);
  const t=nd.append("text").attr("x",d=>d.col===0?d.x0-6:d.x1+6).attr("y",d=>(d.y0+d.y1)/2).attr("dy","0.35em").attr("text-anchor",d=>d.col===0?"end":"start");
  t.text(d=>d.name.length>30?d.name.slice(0,29)+"…":d.name);
  t.append("tspan").attr("x",d=>d.col===0?d.x0-6:d.x1+6).attr("dy","1.25em").text(d=>fmtV(d.value)).filter(d=>d.y1-d.y0<20).remove();
  if($("sankey-lock")) $("sankey-lock").innerHTML=lock(3,"Sankey configurable","Combina origen, esquema, tecnología, región y etapa, y pondera por MW, inversión o número de registros.");
}

/* ---- brecha ---- */
function renderRegions(){
  const v=visible().filter(r=>r.mw&&r.lat!=null&&r.tech!=="tx"&&r.tech!=="dem");
  const regs=d3.groups(v,r=>r.region).map(([k,a])=>({k,a,tot:d3.sum(a,r=>r.mw)})).sort((a,b)=>b.tot-a.tot);
  const el=$("regchart"); if(!regs.length){el.innerHTML=`<p class="note">Sin datos con los filtros actuales.</p>`;return;}
  const w=620,rowH=30,top=8,left=128,right=130,h=top+regs.length*rowH+24;
  const x=d3.scaleLinear().domain([0,d3.max(regs,d=>d.tot)]).nice().range([left,w-right]);
  let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="MW por región y etapa">`;
  x.ticks(4).forEach(t=>{s+=`<line x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${h-20}" stroke="var(--line)"/><text x="${x(t)}" y="${h-6}" text-anchor="middle">${nf.format(t)}</text>`;});
  regs.forEach((d,i)=>{ const y=top+i*rowH; let x0=left;
    s+=`<text class="rl" x="${left-8}" y="${y+rowH/2+4}" text-anchor="end">${d.k}</text>`;
    [5,4,3,2,1,0,9].forEach(st=>{const m=d3.sum(d.a.filter(r=>r.stage===st),r=>r.mw); if(!m) return; const wd=x(m)-x(0); s+=`<rect x="${x0}" y="${y+5}" width="${Math.max(1,wd-1)}" height="${rowH-10}" rx="2" fill="${stageVar(st)}"><title>${d.k} · ${stageName(st)}: ${nf.format(m)} MW</title></rect>`; x0+=wd;});
    const op=d3.sum(d.a.filter(r=>r.stage===5),r=>r.mw); s+=`<text x="${x0+6}" y="${y+rowH/2+4}" class="num">${nf.format(d.tot)} · ${Math.round(op/d.tot*100)}% op.</text>`; });
  el.innerHTML=s+`</svg><div class="legend" style="position:static;border:0;padding:6px 0 0;background:transparent">${[5,4,3,2,1,0].map(st=>`<span><i style="background:${stageVar(st)}"></i>${STAGE_SHORT[st]}</span>`).join("")}</div>`;
}
function renderBCS(){
  const dem=D.DEM.filter(d=>d[1]!=null), off=dem.filter(d=>d[3]==="oficial"), pre=dem.filter(d=>d[3]!=="oficial");
  const first=off[0], lastO=off[off.length-1], g=Math.pow(lastO[1]/first[1],1/(lastO[0]-first[0]))-1;
  const proj30=lastO[1]*Math.pow(1+g,2030-lastO[0]);
  const bcsAnn=R.filter(r=>r.state==="Baja California Sur"&&r.mw&&r.tech!=="dem"&&!/Mulegé/.test(r.mun||""));
  const annMW=d3.sum(bcsAnn,r=>r.mw), annC=d3.sum(bcsAnn.filter(r=>r.stage>=3&&r.stage<=5),r=>r.mw);
  const cap=CFG.ctx.bcs_op;
  const w=620,h=300,m={l:46,r:150,t:14,b:26};
  const x=d3.scaleLinear().domain([2010,2030]).range([m.l,w-m.r]), y=d3.scaleLinear().domain([0,Math.max(cap+annMW,proj30)*1.08]).range([h-m.b,m.t]);
  let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Demanda máxima de BCS frente a capacidad y anuncios">`;
  y.ticks(5).forEach(t=>{s+=`<line x1="${m.l}" x2="${w-m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${m.l-6}" y="${y(t)+4}" text-anchor="end" class="mono" style="font-size:10.5px">${nf.format(t)}</text>`;});
  [2010,2015,2020,2025,2030].forEach(t=>{s+=`<text x="${x(t)}" y="${h-8}" text-anchor="middle" class="mono" style="font-size:10.5px">${t}</text>`;});
  s+=`<rect x="${x(2010)}" y="${y(cap)}" width="${x(2030)-x(2010)}" height="${y(0)-y(cap)}" fill="var(--ce)" opacity=".08"/><line x1="${x(2010)}" x2="${x(2030)}" y1="${y(cap)}" y2="${y(cap)}" stroke="var(--ce)" stroke-dasharray="4 3"/>`;
  s+=`<text x="${x(2030)+6}" y="${y(cap)+4}" style="font-size:11px;fill:var(--fg)">${nf.format(cap)} MW</text><text x="${x(2030)+6}" y="${y(cap)+17}" style="font-size:10px">capacidad registrada</text><text x="${x(2030)+6}" y="${y(cap)+29}" style="font-size:10px">en operación (no firme)</text>`;
  let yy=cap; const bx=x(2028.6);
  [[annC,"var(--s3)","con contrato"],[annMW-annC,"var(--s1)","anunciado sin contrato"]].forEach(([v,c,l])=>{ if(v<=0) return; s+=`<rect x="${bx}" y="${y(yy+v)}" width="22" height="${y(yy)-y(yy+v)}" fill="${c}"><title>${l}: ${nf.format(v)} MW</title></rect>`; yy+=v; });
  s+=`<text x="${x(2030)+6}" y="${y(yy)+4}" style="font-size:11px;fill:var(--s1)">+${nf.format(annMW)} MW</text><text x="${x(2030)+6}" y="${y(yy)+17}" style="font-size:10px">anunciados · ${nf.format(annC)} con contrato</text>`;
  const L=d3.line().x(d=>x(d[0])).y(d=>y(d[1]));
  s+=`<path d="${L(off)}" stroke="var(--dem)" stroke-width="2.2" fill="none"/>`;
  s+=`<path d="${L([[lastO[0],lastO[1]],[2030,proj30]])}" stroke="var(--dem)" stroke-width="1.4" stroke-dasharray="3 3" fill="none"/>`;
  off.forEach(d=>{s+=`<circle cx="${x(d[0])}" cy="${y(d[1])}" r="2.4" fill="var(--dem)"><title>${d[0]}: ${nf.format(d[1])} MW</title></circle>`;});
  pre.forEach(d=>{s+=`<circle cx="${x(d[0])}" cy="${y(d[1])}" r="3.2" fill="none" stroke="var(--dem)"><title>${d[0]}: ${nf.format(d[1])} MW (preliminar)</title></circle>`;});
  let yd=y(proj30); if(Math.abs(yd-y(cap))<40) yd=y(cap)+44;
  s+=`<text x="${x(2030)+6}" y="${yd+4}" style="font-size:11px;fill:var(--dem)">≈${nf.format(proj30)} MW</text><text x="${x(2030)+6}" y="${yd+17}" style="font-size:10px">demanda 2030 al ritmo</text><text x="${x(2030)+6}" y="${yd+29}" style="font-size:10px">2010–${lastO[0]} (${nf1.format(g*100)}%/año)</text>`;
  $("bcs").innerHTML=s+`</svg><p style="margin-top:8px">Demanda máxima integrada del sistema BCS ${first[0]}–${lastO[0]} (planeación oficial con datos del operador)${pre.length?"; círculos huecos: cifras preliminares por conciliar":""}. La capacidad registrada suma unidades, no equivale a capacidad firme. Sin contar Mulegé, sistema aparte.</p>`;
}
function renderQro(){
  const rows=[{l:"Demanda anunciada",v:1200,c:"var(--t-dem)",h:true,n:"CloudHQ 900 MW + ODATA ~300 MW TI"},{l:"Suministro asegurado (fase 1)",v:200,c:"var(--s4)",n:"Energía inicial para los primeros 200 MW"},{l:"Subestaciones energizadas ene 2026",v:26.8,c:"var(--s5)",n:"SE FINSA y 2ª SE"},{l:"Transmisión adicional en proyecto",v:800,c:"var(--s1)",h:true,n:"Hasta 800 MW al operar las obras"}];
  $("qro").innerHTML=rows.map(r=>`<div class="gbar"><span>${r.l}<span class="sub">${r.n}</span></span><div class="track"><div class="fill${r.h?" hatch":""}" style="width:${r.v/1200*100}%;${r.h?`color:${r.c}`:`background:${r.c}`}"></div></div><span class="v">${nf1.format(r.v)} MW</span></div>`).join("")+
    `<p style="margin-top:12px">Lectura: la demanda anunciada en un solo estado equivale a más de cuatro veces el suministro confirmado públicamente.</p>`;
}
function renderMut(id,rows){ if($(id)) $(id).innerHTML=rows.map(([f,t,c])=>`<div class="row ${c||""}"><time>${f}</time><span class="dot"></span><span>${t}</span></div>`).join(""); }
function renderDist(){
  const pts=R.filter(r=>r.tier!=null);
  const bands=[0,1,2,3,4].map(k=>({k,n:pts.filter(r=>r.tier===k).length,mw:d3.sum(pts.filter(r=>r.tier===k&&r.tech!=="dem"),r=>r.mw||0)}));
  const col=["var(--ok)","var(--fg)","var(--amber)","var(--danger)","var(--danger)"], rng=["≤ 5 km","5–25 km","25–100 km","> 100 km","sin 230 kV"];
  $("bands").innerHTML=`<div class="bands">${bands.map(b=>`<div><small style="color:${col[b.k]}">${BANDT[b.k]}</small><strong>${b.n}</strong><span>proyectos · ${rng[b.k]}</span><span>${nf.format(b.mw)} MW</span></div>`).join("")}</div>`;
  const el=$("dplot");
  if(!can(3)){ el.innerHTML=""; $("dplot-lock").innerHTML=`<div style="margin-top:12px">${lock(3,"Distancia de cada proyecto, en kilómetros","La gráfica por proyecto, con la línea y la subestación ≥230 kV más cercanas.")}</div>`; return; }
  const v=visible().filter(r=>r.dist!=null).sort((a,b)=>b.dist-a.dist);
  if(!v.length){el.innerHTML=`<p class="note">Sin datos con los filtros actuales.</p>`;return;}
  const w=980,left=300,right=150,rowH=20,top=26,h=top+v.length*rowH+10, x=d3.scaleLog().domain([0.1,400]).range([left,w-right]).clamp(true);
  let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Distancia de proyectos a la red de 230/400 kV">`;
  [[0.1,5,"var(--ok)","Junto a la red ≤5 km"],[5,25,"var(--fg)","Cercano"],[25,100,"var(--amber)","Requiere enlace"],[100,400,"var(--danger)","Lejos"]].forEach(([a,b,c,l])=>{s+=`<rect x="${x(a)}" y="${top-6}" width="${x(b)-x(a)}" height="${h-top}" fill="${c}" opacity=".06"/><text x="${(x(a)+x(b))/2}" y="${top-10}" text-anchor="middle" style="font-size:10px">${l}</text>`;});
  [0.1,1,5,10,25,100,400].forEach(t=>{s+=`<line x1="${x(t)}" x2="${x(t)}" y1="${top-4}" y2="${h-6}" stroke="var(--line)"/>`;});
  v.forEach((r,i)=>{ const y=top+i*rowH+rowH/2, iso=r.dist>=9999, xv=iso?w-right:x(Math.max(0.1,r.dist));
    s+=`<text class="rl" x="${left-10}" y="${y+4}" text-anchor="end">${esc(r.name.length>40?r.name.slice(0,39)+"…":r.name)}</text><line x1="${left}" x2="${xv}" y1="${y}" y2="${y}" stroke="var(--line2)"/>`;
    if(r.se&&!iso) s+=`<rect x="${x(Math.max(0.1,r.se[0]))-3}" y="${y-3}" width="6" height="6" fill="none" stroke="var(--se)"><title>Subestación ≥230 kV: ${nf1.format(r.se[0])} km · ${esc(r.se[1])}</title></rect>`;
    s+=`<circle cx="${xv}" cy="${y}" r="5" fill="${stageVar(r.stage)}" stroke="var(--bg)"><title>${esc(r.name)}: ${iso?"sistema aislado":nf1.format(r.dist)+" km"}</title></circle><text x="${xv+10}" y="${y+4}" class="num">${iso?"aislado (sin 230 kV)":nf1.format(r.dist)+" km"}</text>`; });
  [0.1,1,5,25,100,400].forEach(t=>{s+=`<text x="${x(t)}" y="${h}" text-anchor="middle" style="font-size:10px">${t}</text>`;});
  el.innerHTML=s+`</svg><p class="note">Círculo: línea de 230/400 kV más cercana. Cuadro: subestación de 230/400 kV más cercana.</p>`;
}
function renderProg(){
  $("prog").innerHTML=PROGRAMS.map(p=>`<div><time>${fmtD(p.f)}</time><strong>${p.v}</strong><b style="font-size:13px">${p.t}</b><br><span>${p.s}</span></div>`).join("");
  $("metas").innerHTML=METAS.map(m=>`<div><small>${fmtD(m.f)} · ${m.k}</small><strong>${m.v}</strong><b style="font-size:13px">${m.t}</b><br><span>${m.d}</span>${m.chg&&can(3)?`<div class="chg">${m.chg}</div>`:""}</div>`).join("");
  if($("conc")&&D.CONC) $("conc").innerHTML=`<b class="t">Conciliación de la comparecencia del 12 nov con el radar</b>`+D.CONC.map(c=>`<div style="margin-top:6px"><b>${c[0]}.</b> ${c[1]}</div>`).join("");
}

/* ---- red ---- */
function renderVbars(){
  const VS=D.VSTATS, mx=d3.max(VS,d=>d[1]);
  $("vbars").innerHTML=VS.map(([l,km,n])=>`<div class="vbar"><span>${l}</span><div class="track"><i style="width:${km/mx*100}%;background:${l==="400 kV"?"var(--n400)":l==="230 kV"?"var(--n230)":"var(--line2)"}"></i></div><span class="v">${nf.format(km)} km · ${nf.format(n)} tramos</span></div>`).join("")
    +`<p style="margin-top:12px">Baja California y BCS no tienen líneas de 400 kV. El sistema de Mulegé no tiene red de 230 kV.</p>`;
  if(CFG.sestats) $("sestats").innerHTML=`<p><b>${nf.format(CFG.sestats.hv)} subestaciones de 230 y 400 kV</b> y ${nf.format(CFG.sestats.mv)} de menor tensión en operación completan la capa base${can(3)?"; actívalas en el mapa desde «Capas»":""}.</p>`;
}
function renderFindings(){
  const el=$("find"), F=D.FINDINGS;
  el.innerHTML=F.map(f=>{ const [sv,id,t,d]=f; const open=d!=null;
    return `<button type="button" data-id="${id}"${open?"":" disabled"} style="${open?"":"cursor:default;opacity:.75"}"><span class="sev ${sv}">${sv==="crit"?"CRÍTICO":sv==="warn"?"ATENCIÓN":"VALIDACIÓN"}</span><b>${esc(t)}</b><span class="d">${open?esc(d):'<span class="locktag">análisis completo · nivel 3</span>'}</span></button>`;}).join("");
  el.querySelectorAll("button:not([disabled])").forEach(b=>b.onclick=()=>select(b.dataset.id,true));
}
const LS={kv:"all",q:"",n:can(3)?40:12,k:"k",dir:-1};
function renderLineTable(){
  const src = D.LCAT || hvF.map(f=>f.properties);
  let v=src.filter(p=>(LS.kv==="all"||String(p.v)===LS.kv)&&(!LS.q||(p.n||"").toLowerCase().includes(LS.q)));
  const key={n:p=>p.n,v:p=>p.v,c:p=>p.c||0,cd:p=>p.cd||"",k:p=>p.k||0,s:p=>silOf(p)}[LS.k];
  v.sort((a,b)=>{const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*LS.dir;});
  if($("lcount")) $("lcount").textContent=`${nf.format(v.length)} líneas · ${nf.format(d3.sum(v,p=>p.k))} km`;
  $("ltbl").querySelector("tbody").innerHTML=v.slice(0,LS.n).map(p=>`<tr data-i="${p.i}"${p.i===S.selLine?' style="background:var(--panel2)"':""}><td><b>${esc(p.n)}</b>${p.o?'<span class="sub">Clasificada en 400 kV, opera en 230 kV</span>':""}</td>
    <td class="r num" style="color:${p.v>=400?"var(--n400)":"var(--n230)"}">${p.v}</td><td class="r num">${p.c||"—"}</td><td class="num">${p.cd?p.cd+" ACSR":"—"}</td><td class="r num">${nf1.format(p.k||0)} km</td><td class="r num">≈ ${nf.format(silOf(p))} MW</td></tr>`).join("");
  if(can(3)) document.querySelectorAll("#ltbl tbody tr").forEach(tr=>tr.onclick=()=>selectLine(tr.dataset.i,true));
  if($("lmore")) $("lmore").hidden=v.length<=LS.n;
  if(!can(3)) $("ltbl-lock").innerHTML=`<div style="margin-top:10px">${lock(3,"Catálogo completo de 869 líneas troncales","Búsqueda por línea o subestación, filtros por tensión y selección en el mapa.")}</div>`;
}
function selectLine(id,fly){
  S.selLine=id; if(S.net==="none"){S.net="hv";document.querySelectorAll("#net button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v==="hv"));}
  renderNet(); renderLineTable();
  if(fly){ const f=hvF.find(x=>x.properties.i===id); if(!f) return; $("mapa").scrollIntoView({behavior:"smooth"});
    const [[x0,y0],[x1,y1]]=path.bounds(f), k=Math.min(12,0.6/Math.max((x1-x0)/W,(y1-y0)/H,0.02));
    svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2)); }
}
function buildLineUI(){
  segs("lkv",v=>{LS.kv=v;LS.n=40;renderLineTable();});
  if($("lq")) $("lq").addEventListener("input",e=>{LS.q=e.target.value.trim().toLowerCase();LS.n=40;renderLineTable();});
  if($("lmore")) $("lmore").onclick=()=>{LS.n+=40;renderLineTable();};
  if(can(3)) document.querySelectorAll("#ltbl th").forEach(th=>th.onclick=()=>{const k=th.dataset.k;LS.dir=LS.k===k?-LS.dir:(k==="n"||k==="cd"?1:-1);LS.k=k;renderLineTable();});
}

/* ---- esta semana ---- */
function renderWeek(){
  if(!$("w-alerts")) return;
  const al=R.filter(r=>r.next&&(r.alert||r.days<=60)).sort((a,b)=>a.next[0]<b.next[0]?-1:1);
  $("w-alerts").innerHTML=al.map(r=>`<div class="wrow"><time>${fmtD(r.next[0])}</time><span>${r.alert==="over"?'<span class="alertchip over">VENCIDO</span> ':r.alert==="today"?'<span class="alertchip today">HOY</span> ':`<span class="alertchip soon">${r.days} d</span> `}<b>${esc(r.name)}</b> · ${esc(r.next[1])}</span></div>`).join("")||`<p class="note">Sin alertas.</p>`;
  $("w-caps").innerHTML=METAS.slice(0,6).map(m=>`<div class="wrow"><time>${fmtD(m.f)}</time><span><b>${m.t}:</b> ${m.v}. ${m.d}.</span></div>`).join("")+`<p class="note" style="margin-top:8px">Fuente de la semana: comparecencia de la Secretaria de Energía ante la Comisión de Energía del Senado.</p>`;
}

/* ---- niveles y modelo ---- */
function renderTiers(){
  const el=$("tiers"); if(!el) return;
  const T=CFG.tiers;
  el.innerHTML=T.map(t=>`<div class="tiercard${t.n===LV?" cur":""}${t.feat?" feat":""}">${t.n===LV?'<span class="here">Estás aquí</span>':""}
    <div class="tn">Nivel ${t.n}</div><h3>${t.name}</h3><div class="price">${t.price}<small> ${t.per}</small></div><div class="alt">${t.alt}</div>
    <ul>${t.items.map(i=>`<li>${i}</li>`).join("")}</ul>
    <a class="cta-btn${t.feat?" solid":""}" href="${t.href}" ${t.href.startsWith("http")?'target="_blank" rel="noopener"':""}>${t.cta}</a>
    <div class="who">${t.who}</div></div>`).join("");
  const f=$("signup"); if(f) f.onsubmit=e=>{e.preventDefault(); const m=f.querySelector("input").value; location.href=CFG.signup.replace("{email}",encodeURIComponent(m));};
}
function renderCalc(){
  const el=$("calc"); if(!el) return;
  const P=[["b_n","Suscriptores boletín (anual)",120],["b_p","Cuota boletín anual (MXN)",1490],["p_n","Usuarios plataforma (anual)",25],["p_p","Cuota plataforma anual (MXN)",5900],["i_n","Instituciones nivel 4",6],["i_p","Cuota institucional (MXN)",36000],["a_n","Aliados del radar",1],["a_p","Aportación aliado (MXN)",120000],
    ["c_sup","Supervisión y revisión (MXN/mes)",22000],["c_bec","Becas: 2 estudiantes (MXN/mes)",12000],["c_inf","Almacenamiento, cómputo, IA (MXN/mes)",4500],["c_div","Divulgación y eventos (MXN/mes)",3500],["fee","Comisiones de cobro (%)",4.5]];
  el.innerHTML=P.map(([k,l,v])=>`<label>${l}<input type="number" id="c-${k}" value="${v}" min="0"></label>`).join("");
  const upd=()=>{ const g=k=>+$("c-"+k).value||0;
    const ing=g("b_n")*g("b_p")+g("p_n")*g("p_p")+g("i_n")*g("i_p")+g("a_n")*g("a_p"), net=ing*(1-g("fee")/100), cost=12*(g("c_sup")+g("c_bec")+g("c_inf")+g("c_div"));
    $("calcout").innerHTML=`<div class="insight"><div><strong>${nf.format(ing)} MXN</strong><span>ingreso bruto anual · neto de comisiones ${nf.format(net)}</span></div><div><strong>${nf.format(cost)} MXN</strong><span>costo anual del piloto</span></div><div style="border-color:${net>=cost?"var(--ok)":"var(--danger)"}"><strong style="color:${net>=cost?"var(--ok)":"var(--danger)"}">${net>=cost?"+":""}${nf.format(net-cost)} MXN</strong><span>${net>=cost?"superávit: se reinvierte en becas y cobertura":"déficit: falta cubrir con aliados o donativos"}</span></div></div>
      <p class="note" style="margin-top:10px">Si CIC VIVES es donataria autorizada, las cuotas por servicios distintos de su objeto no deben pasar del 10% de sus ingresos anuales; las aportaciones de aliados sin contraprestación pueden recibirse como donativo. Validar la clasificación con el contador antes de publicar precios.</p>`; };
  el.querySelectorAll("input").forEach(i=>i.oninput=upd); upd();
}
function renderInterno(){ if($("interno")&&D.INTERNO) $("interno").innerHTML=D.INTERNO.map(i=>`<div class="wrow"><time>${i[0]}</time><span><b>${esc(i[1])}.</b> ${esc(i[2])}</span></div>`).join(""); }
function exportCSV(){
  const v=visible(), cols=["id","name","tech","sch","state","mun","lat","lon","prec","mw","usd","stage","lvl","orig","idx","dist"];
  const csv=[cols.join(",")].concat(v.map(r=>cols.map(c=>{const x=r[c]==null?"":String(r[c]);return /[",\n]/.test(x)?`"${x.replace(/"/g,'""')}"`:x;}).join(","))).join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv"})); a.download=`radar_electrico_${CFG.today}.csv`; a.click();
}

function renderAll(){renderMap();renderFicha();renderTable();renderSankey();renderRegions();renderDist();}
buildFilters(); buildLineUI(); buildHead(); renderKPIs(); renderRace(renderFunnel()); renderNet(); renderLayers(); renderAll(); renderVbars(); renderFindings(); renderLineTable(); renderQro(); renderBCS(); renderProg(); renderWeek(); renderTiers(); renderCalc(); renderInterno(); renderScale();
if($("csv")) $("csv").onclick=exportCSV;
renderMut("mut-cabos",D.MUT_CABOS); renderMut("mut-tesla",D.MUT_TESLA);
let rT; window.addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(()=>{renderSankey();renderScale();},150);});
