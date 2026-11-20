#!/usr/bin/env python3
"""Radar Eléctrico MX · generador por niveles.
Una sola base (data/master.json + capas) → cinco HTML. Cada nivel incrusta SOLO los datos que le tocan:
lo que no se ve en un nivel no viaja en el archivo, así que no se puede extraer del código fuente.
Uso: python3 src/build.py [--hoy AAAA-MM-DD]
"""
import json, re, copy, sys, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
D = ROOT / "data"; OUT = ROOT / "dist"; OUT.mkdir(exist_ok=True)
HOY = sys.argv[sys.argv.index("--hoy")+1] if "--hoy" in sys.argv else datetime.date.today().isoformat()
CORTE = "9 nov 2026 · capturas al 12 nov"
M = json.load(open(D/"master.json")); LY = json.load(open(D/"layers.json"))
GEO = {k: json.load(open(D/f"{k}.json")) for k in ("TOPO","LT_HV","LT_MV","NEIGH")}
CONF = json.load(open(ROOT/"config.json"))
NAMES = {1:"Abierto",2:"Boletín",3:"Plataforma",4:"Inteligencia",5:"Dirección"}

MUT_CABOS = [["mar 2025","Gobierno de BCS anuncia una central de combustión interna a gas para Los Cabos; cita 272 M USD."],
 ["2025","El Plan de Expansión la registra con 240 MW y 473.9 M USD.","chg"],["24 oct 2025","Ingresa la manifestación de impacto ambiental."],
 ["22 dic 2025","SENER la reporta «en proceso de reevaluación».","red"],
 ["28 ago 2026","Se convoca como central co-localizada: 130 MW de combustión interna, más fotovoltaica y almacenamiento.","chg"],
 ["9 nov 2026","Fecha prevista del fallo de la licitación; sin resultado verificado al corte.","red"],["2 dic 2026","Inicio de construcción programado.","fut"]]
MUT_TESLA = [["1 mar 2023","Se confirma la planta; el gobierno federal habla de 5,000 M USD y el estatal de 15,000 M USD."],
 ["2023","Sin permisos federales meses después del anuncio; solo preparación de terreno.","chg"],
 ["jul 2024","La obra se frena; el estado dice no haber recibido aviso formal.","red"],["2026","Predio abandonado y en disputa legal; ~30 proveedores sí llegaron a Nuevo León.","red"]]
PUBLIC_FINDINGS = {"h2-oasis","csp-comondu","cc-tula"}

def band(r):
    g = M["PROX"].get(r["id"])
    if not g: return None
    d = g["hv"][0] if g.get("hv") else 9999
    return 4 if d >= 9999 else 0 if d <= 5 else 1 if d <= 25 else 2 if d <= 100 else 3

def records(lv):
    out = []
    for r0 in M["R"]:
        r = {k: r0[k] for k in ("id","name","tech","sch","state","mun","lat","lon","mw","stage","orig") if k in r0}
        if r0.get("line"): r["line"] = r0["line"]
        if r0.get("fop"): r["fop"] = r0["fop"]
        r["approx"] = r0.get("prec") in ("aproximada","estado")
        if lv >= 2:
            r["hitos"] = r0["hitos"]
            if r0.get("next"): r["next"] = r0["next"]
        else:
            if r0.get("next"):   # solo el tipo de alerta, sin fecha ni texto
                days = (datetime.date.fromisoformat(r0["next"][0]) - datetime.date.fromisoformat(HOY)).days
                r["alert"] = "today" if days == 0 else "over" if days < 0 else ("soon" if days <= 45 else None)
        if lv >= 3:
            for k in ("prec","inf","chg","lvl","flags","usd","se","iso"):
                if r0.get(k) is not None: r[k] = r0[k]
            if r0["id"] in M["PROX"]: r["grid"] = M["PROX"][r0["id"]]
            r["src"] = r0["src"] if lv >= 4 else [r0["src"][0]]
            r.pop("approx")
            r["approx"] = r0.get("prec") in ("aproximada","estado")
        else:
            b = band(r0)
            if b is not None: r["band"] = b
        out.append(r)
    return out

def strip_hv(topo, lv):
    t = copy.deepcopy(topo)
    if lv >= 3: return t
    for g in list(t["objects"].values())[0]["geometries"]:
        p = g.get("properties", {}); g["properties"] = {"v": p.get("v"), "o": p.get("o", 0)}
    return t

def catalog_sample():
    props = [g["properties"] for g in list(GEO["LT_HV"]["objects"].values())[0]["geometries"]]
    return sorted(props, key=lambda p: -(p.get("k") or 0))[:12]

def data_for(lv):
    d = {"R": records(lv), "PROGRAMS": M["PROGRAMS"], "METAS": M["METAS"], "VSTATS": M["VSTATS"],
         "TOPO": GEO["TOPO"], "NEIGH": GEO["NEIGH"], "LT_HV": strip_hv(GEO["LT_HV"], lv),
         "CONS_ST": LY["CONS_ST"], "MUT_CABOS": MUT_CABOS,
         "DEM": [x for x in M["DEM"] if lv >= 5 or x[3] == "oficial"]}
    d["FINDINGS"] = [f if (lv >= 3 or f[1] in PUBLIC_FINDINGS) else [f[0], f[1], f[2], None] for f in M["FINDINGS"]]
    if lv >= 2: d["MUT_TESLA"] = MUT_TESLA
    if lv < 3: d["LCAT"] = catalog_sample()
    if lv >= 3:
        d.update({"BASECHK": M["BASECHK"], "LT_MV": GEO["LT_MV"], "SE_HV": LY["SE_HV"], "CM": LY["CM"],
                  "CE": [c for c in LY["CE"] if c[4] == "op" or (lv >= 4 and c[4] == "perm")]})
    if lv >= 4: d["CONC"] = M["CONC"]
    if lv >= 5: d["INTERNO"] = M["INTERNO"]
    return d

def tiers():
    L = CONF["links"]
    return [
     {"n":1,"name":"Radar abierto","price":"Gratis","per":"","alt":"Corte mensual por correo, sin costo","href":L["n1"],"cta":"Recibir el corte mensual",
      "items":["Mapa georreferenciado con la red troncal","Embudo de materialización y carrera contra 2030","Brecha por región, BCS y Querétaro","Programas marco y metas oficiales"],"who":"Público, estudiantes y prensa"},
     {"n":2,"name":"Boletín semanal","price":"$149","per":"MXN / mes","alt":"o $1,490 al año · académicos y estudiantes $790 al año","href":L["n2"],"cta":"Suscribirme",
      "items":["Reporte cada lunes con alertas de hito","Tabla completa con último y próximo hito","Línea de tiempo de cada proyecto","Capturas y metas de la semana"],"who":"Analistas, consultores y periodistas especializados"},
     {"n":3,"name":"Plataforma","price":"$590","per":"MXN / mes","alt":"o $5,900 al año por persona · académicos 50%","href":L["n3"],"cta":"Activar plataforma","feat":True,
      "items":["Consola completa con filtros y búsqueda","Índice 0–100 y certeza de cada fuente","Distancia exacta a líneas y subestaciones","Capas: subestaciones, centrales existentes y consumo de 2,463 municipios","Sankey configurable y catálogo de 869 líneas"],"who":"Empresas, desarrolladores, académicos e inversionistas"},
     {"n":4,"name":"Inteligencia institucional","price":"$36,000","per":"MXN / año","alt":"Hasta 5 usuarios, por convenio con factura · Aliado del radar: $120,000 al año con un becario dedicado","href":L["n4"],"cta":"Agendar una conversación",
      "items":["Todo lo de Plataforma","Enlace a cada fuente y exportación CSV","Cartera privada con permiso de la CRE","Conciliación de metas oficiales contra la cartera","Briefing trimestral y notas técnicas a la medida"],"who":"Gobiernos, cámaras, fondos y universidades"}]

def strip_blocks(html, lv):
    pat = re.compile(r"<!--@(min|max) (\d)-->((?:(?!<!--@).)*?)<!--@end-->", re.S)
    keep = lambda m: m.group(3) if ((m.group(1) == "min" and lv >= int(m.group(2))) or (m.group(1) == "max" and lv <= int(m.group(2)))) else ""
    while True:   # de adentro hacia afuera, para bloques anidados
        h2 = pat.sub(keep, html)
        if h2 == html: break
        html = h2
    assert "<!--@" not in html, "marcador sin cerrar"
    return html

import base64
def img64(f): return "data:image/png;base64," + base64.b64encode((ROOT/"src"/f).read_bytes()).decode()

def build(lv):
    tpl = (ROOT/"src/template.html").read_text()
    css = (ROOT/"src/base.css").read_text() + (ROOT/"src/extra.css").read_text() + (ROOT/"src/cic.css").read_text()
    js = (ROOT/"src/app.js").read_text()
    if lv < 5:   # el JS de dirección no viaja en los niveles bajos
        js = re.sub(r"function renderCalc\(\)\{.*?\n\}\n", "function renderCalc(){}\n", js, flags=re.S)
    cfg = {"level": lv, "today": HOY, "tiers": tiers(), "signup": CONF["links"]["signup"],
           "ctx": {k: M["CTX"][k] for k in ("dem_max_2024","tmca","bcs_op")},
           "sestats": {"hv": len(LY["SE_HV"]), "mv": len(LY["SE_MV"])}}
    credit = ("Cartografía base: INEGI · Red eléctrica en operación, 2024 · Elaboración: CIC VIVES" if lv < 3 else
              "Marco geoestadístico INEGI 2023 · Líneas, subestaciones y centrales eléctricas 2024 · Consumo eléctrico municipal 2018 · Natural Earth · Elaboración: CIC VIVES")
    html = strip_blocks(tpl, lv)
    rep = {"__TITLE__": f"Nivel {lv} · {NAMES[lv]}", "__LV__": str(lv), "__LVNAME__": NAMES[lv], "__CORTE__": CORTE,
           "__ROBOTS__": "index,follow" if lv == 1 else "noindex,nofollow", "__MAPCREDIT__": credit, "__SYMBOL__": img64("symbol_96.png"), "__LOGO__": img64("logo_light_360.png")}
    for k, v in rep.items(): html = html.replace(k, v)
    html = html.replace("/*__CSS__*/", css).replace("/*__CFG__*/", json.dumps(cfg, ensure_ascii=False))
    html = html.replace("/*__DATA__*/", json.dumps(data_for(lv), ensure_ascii=False, separators=(",",":"))).replace("/*__JS__*/", js)
    name = {1:"index.html",2:"boletin.html",3:"plataforma.html",4:"inteligencia.html",5:"direccion.html"}[lv]
    (OUT/f"nivel{lv}_{name}").write_text(html)
    return len(html)

def weekly():
    """Reporte semanal de muestra (nivel 2), en HTML apto para correo."""
    hoy = datetime.date.fromisoformat(HOY); rs = []
    for r in M["R"]:
        if r.get("next"):
            d = (datetime.date.fromisoformat(r["next"][0]) - hoy).days
            if d <= 60: rs.append((r["next"][0], d, r))
    rs.sort(key=lambda t: t[0])
    gen = [r for r in M["R"] if r.get("mw") and r["tech"] not in ("tx","dem")]
    tot = sum(r["mw"] for r in gen); op = sum(r["mw"] for r in gen if r["stage"] == 5)
    rows = "".join(f'<tr><td style="padding:8px 10px;border-bottom:1px solid #24423A;font:12px JetBrains Mono,monospace;color:{"#E5856B" if d<0 else "#D7A45B"};white-space:nowrap">{"VENCIDO" if d<0 else f"en {d} d"}</td><td style="padding:8px 10px;border-bottom:1px solid #24423A;font:13px Inter,Arial;color:#E9EFEA"><b>{r["name"]}</b><br><span style="color:#A9C4BA">{r["next"][1]} · {f}</span></td></tr>' for f, d, r in rs)
    caps = "".join(f'<li style="margin:0 0 8px"><b>{m["t"]}:</b> {m["v"]}. {m["d"]}.</li>' for m in M["METAS"][:6])
    html = f"""<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Radar semanal · {HOY}</title></head>
<body style="margin:0;background:#0E211C;padding:24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#132C26;border:1px solid #24423A;border-radius:12px">
<tr><td style="padding:24px 28px 8px;font:600 11px JetBrains Mono,monospace;letter-spacing:.14em;color:#6EAAA0">RADAR ELÉCTRICO MX · BOLETÍN SEMANAL · {HOY}</td></tr>
<tr><td style="padding:0 28px;font:300 30px Fraunces,Georgia,serif;color:#E9EFEA;line-height:1.05">Del anuncio al <span style="color:#D7A45B">megawatt</span>: lo que vence esta semana</td></tr>
<tr><td style="padding:14px 28px;font:14px Inter,Arial;color:#A9C4BA">Del total registrado ({tot:,.0f} MW), <b style="color:#D7A45B">{op/tot*100:.1f}% ya opera</b>. La meta oficial a 2030 es de 32,000 MW.</td></tr>
<tr><td style="padding:8px 28px;font:600 11px JetBrains Mono,monospace;letter-spacing:.12em;color:#7E9D93">ALERTAS DE HITO</td></tr>
<tr><td style="padding:0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{rows}</table></td></tr>
<tr><td style="padding:18px 28px 6px;font:600 11px JetBrains Mono,monospace;letter-spacing:.12em;color:#7E9D93">LO QUE SE DIJO · COMPARECENCIA SENER, 12 NOV</td></tr>
<tr><td style="padding:0 28px;font:13px/1.55 Inter,Arial;color:#E9EFEA"><ul style="padding-left:18px;margin:0">{caps}</ul></td></tr>
<tr><td style="padding:18px 28px"><a href="{CONF['links']['radar']}" style="display:inline-block;background:#D7A45B;color:#0E211C;font:600 13px Inter,Arial;padding:10px 18px;border-radius:999px;text-decoration:none">Abrir el radar</a></td></tr>
<tr><td style="padding:12px 28px 24px;font:11px Inter,Arial;color:#7E9D93;border-top:1px solid #24423A">Radar Eléctrico MX es un proyecto colaborativo de CIC VIVES, asociación sin fines de lucro. Tu suscripción cubre supervisión de datos, almacenamiento y becas para estudiantes. La información está sujeta a actualización y sirve para orientar, revisar y evaluar ideas; CIC VIVES no se hace responsable de decisiones tomadas con base en ella.</td></tr>
</table></td></tr></table></body></html>"""
    (OUT/f"boletin_semanal_muestra_{HOY}.html").write_text(html)

if __name__ == "__main__":
    for lv in range(1, 6): print(lv, NAMES[lv], f"{build(lv)/1024:.0f} KB")
    weekly(); print("boletín de muestra listo")
