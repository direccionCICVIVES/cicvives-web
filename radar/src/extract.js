// Evalúa el bloque de datos del v0.3 y lo exporta a JSON
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const m=html.match(/<script>\n([\s\S]*?)<\/script>\s*$/);
let js=m[1];
const cut=js.indexOf('/* ---- derivados ---- */');
let head=js.slice(0,cut);
const tailFind=js.slice(js.indexOf('const VSTATS'), js.indexOf('function renderFindings'));
head=head.replace(/const /g,'var ');
const t2=tailFind.replace(/const /g,'var ').replace(/function renderVbars[\s\S]*?\n}\n/,'');
const ctx={};
const fn=new Function(head+'\n'+t2+'\nreturn {TOPO,LT_HV,LT_MV,PROX,R,PROGRAMS,BASECHK,VSTATS,FINDINGS,U};');
const o=fn();
for(const k of ['TOPO','LT_HV','LT_MV']) fs.writeFileSync(`data/${k}.json`,JSON.stringify(o[k]));
fs.writeFileSync('data/base_v03.json',JSON.stringify({PROX:o.PROX,R:o.R,PROGRAMS:o.PROGRAMS,BASECHK:o.BASECHK,VSTATS:o.VSTATS,FINDINGS:o.FINDINGS},null,1));
console.log(o.R.length, Object.keys(o.PROX).length, o.FINDINGS.length);
