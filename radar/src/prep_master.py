import json, math, re
B=json.load(open('data/base_v03.json')); L=json.load(open('data/layers.json'))
R=B['R']
def hav(a,b,c,d):
    p=math.pi/180; x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 12742*math.asin(math.sqrt(x))
for r in R:
    if r.get('lat') is None or r.get('line'): continue
    best=min(L['SE_HV'],key=lambda s:hav(r['lat'],r['lon'],s[1],s[0]))
    r['se']=[round(hav(r['lat'],r['lon'],best[1],best[0]),1),best[3],best[2]]
    # sistemas aislados: BCS no tiene 400; Mulegé sin 230
# fecha de encendido para la carrera
pat=re.compile(r'operaci|Inaugur|energiz|100%|Conectada',re.I)
for r in R:
    if r['stage']==5:
        h=[x for x in r['hitos'] if pat.search(x[1])]
        r['fop']=(h[-1] if h else r['hitos'][-1])[0]
METAS=[
 {"id":"meta-32gw","f":"2026-11-12","t":"Nueva capacidad de generación a 2030","v":"32,000 MW","n":32000,"d":"≈22,000 MW renovables (≈70%) y ≈10,000 MW de ciclo combinado","k":"meta"},
 {"id":"meta-ren","f":"2026-11-12","t":"Participación renovable en la generación","v":"23% → 38%","d":"De 2024 a 2030","k":"indicador"},
 {"id":"meta-est","f":"2026-11-12","t":"Participación del Estado en la energía","v":"≥ 54%","d":"Meta de política para CFE","k":"indicador"},
 {"id":"av-cc","f":"2026-11-12","t":"Ciclos combinados en operación","v":"6 · 3,204 MW","d":"Primeros dos años; 4 más con 3,075 MW previstos para el próximo año","k":"avance"},
 {"id":"av-mix","f":"2026-11-12","t":"Proyectos mixtos y privados","v":"102 + 19","d":"Fotovoltaicos y eólicos, ≈18,000 MW adicionales","k":"avance"},
 {"id":"hito-140","f":"2026-11-12","t":"Centrales en construcción","v":"> 140","d":"Hacia finales de 2027","k":"hito"},
 {"id":"pr-tx","f":"2026-11-12","t":"Transmisión","v":"161.2 mil M MXN","d":"35 obras concluidas, 83 en ejecución y 37 por iniciar","k":"programa","chg":"Mutación: 172 mil M MXN el 2 jul 2026 → 161.2 mil M el 7 oct y el 12 nov; un medio reporta 165.2 mil M."},
 {"id":"pr-dx","f":"2026-11-12","t":"Distribución","v":"72.4 mil M MXN","d":"Más de 1,338 obras de modernización","k":"programa"},
 {"id":"pr-elec","f":"2026-11-12","t":"Electrificación","v":"21,359 obras","d":"13 mil comunidades, 600 mil personas, 12,807 M MXN en dos años; meta de 42,221 obras","k":"programa"}
]
CONC=[  # conciliación de la comparecencia con el radar (N4+)
 ["Meta 2030 vs. expediente","32,000 MW declarados; el radar tiene expediente para el 69.6% y encendido el 13.4%."],
 ["Ciclos combinados del próximo año","SENER: 4 centrales con 3,075 MW. Radar: 2,228 MW en obra. Diferencia por identificar: ≈850 MW."],
 ["Mixtos y privados","SENER: ≈18,000 MW. Radar: ≈12,000 MW trazables en las dos convocatorias mixtas; los privados no tienen expediente aún."],
 ["Transmisión","Bandera de mutación: 172 → 161.2 mil M MXN entre julio y noviembre."],
 ["Centrales en construcción","Nuevo hito nacional: más de 140 a diciembre de 2027."]
]
# Demanda BCS
dm=json.load(open('/mnt/user-data/uploads/Documents/80_DATOS_GIS/BCS_Intelligence_Hub_GPT/Electrico BCS Intelligence Hub/demanda-maxima-bcs.json'))
DEM=[[x['anio'],x['sibcs_mw'],x.get('simul_mw'),x['estado_dato']] for x in dm['datos']]
bcs_op=sum(c[2] for c in L['CE'] if c[8]=='Baja California Sur' and c[4]=='op')
bcs_pipe={k:round(sum(c[2] for c in L['CE'] if c[8]=='Baja California Sur' and c[4]==k),1) for k in ('obra','perm','sinp')}
nat_op={}
for c in L['CE']:
    if c[4]=='op': nat_op[c[3]]=nat_op.get(c[3],0)+c[2]
CTX={"dem_max_2024":55528,"tmca":2.5,"cons_2024_gwh":359807,"cap_op_planeas":round(sum(nat_op.values())),"cap_op_tech":{k:round(v) for k,v in nat_op.items()},
     "bcs_op":round(bcs_op,1),"bcs_pipe":bcs_pipe}
INTERNO=[  # solo N5
 ["10 nov 2026","Tarjeta informativa · reunión CFE Zona La Paz","+120 MW diésel incorporados en Los Cabos en 2026; nuevo estudio de límite de generación distribuida en 2027; CFE Distribución no conoce la cartera en puerta; cartera turística SECTUR ≈ US$3,800 M."],
 ["12 nov 2026","Comparecencia SENER · captura por WhatsApp","Cifras de prensa en nivel C hasta cotejar con la versión estenográfica del Senado."]
]
print('bcs_op',bcs_op,bcs_pipe,CTX['cap_op_planeas'])
json.dump({**B,"R":R,"METAS":METAS,"CONC":CONC,"DEM":DEM,"CTX":CTX,"INTERNO":INTERNO},open('data/master.json','w'),ensure_ascii=False,indent=1)
for r in R:
    if r.get('se'): print(r['id'],r['se'],r.get('fop',''))
