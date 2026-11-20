# Radar Eléctrico MX · v1.0 por niveles

Una sola base de datos genera cinco versiones. Cada archivo lleva **solo** los datos de su nivel. Lo que un nivel no ve no viaja en el HTML, así que tampoco se puede sacar del código fuente.

## Generar

```
python3 src/build.py --hoy 2026-11-20
```

Salida en `dist/`:

| Archivo | Nivel | Dónde vive |
|---|---|---|
| `nivel1_index.html` | 1 · Abierto | Público: `cicvives.org/radar/` (GitHub Pages) |
| `nivel2_boletin.html` | 2 · Boletín | Detrás de acceso de suscriptores |
| `nivel3_plataforma.html` | 3 · Plataforma | Detrás de acceso (Cloudflare Access) |
| `nivel4_inteligencia.html` | 4 · Inteligencia | Detrás de acceso; exporta CSV |
| `nivel5_direccion.html` | 5 · Dirección | Solo local. **No publicar**: contiene notas internas |
| `boletin_semanal_muestra_*.html` | Correo del nivel 2 | Plantilla del envío semanal |

## Qué ve cada nivel

| Contenido | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Mapa georreferenciado, red 230/400 kV, consumo por estado | ✓ | ✓ | ✓ | ✓ | ✓ |
| Embudo, carrera contra 2030 y caso BCS de demanda | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tabla del termómetro | 8 filas | completa | + índice y fuente | ✓ | ✓ |
| Hitos, fechas y alertas («Esta semana») | aviso | ✓ | ✓ | ✓ | ✓ |
| Distancia a la red | por bandas | por bandas | km, línea y subestación | ✓ | ✓ |
| Hallazgos de la red | 3 de 10 | 3 de 10 | 10 | 10 | 10 |
| Catálogo de líneas | 12 | 12 | 869 con búsqueda | ✓ | ✓ |
| Capas: subestaciones, centrales, consumo municipal | — | — | ✓ | ✓ + privados con permiso CRE | ✓ |
| Sankey | fijo | fijo | configurable | ✓ | ✓ |
| Enlaces a fuentes, CSV, conciliación de metas | — | — | — | ✓ | ✓ |
| Método «Información con lugar», fuentes por nombre, hoja de ruta, notas internas, calculadora | — | — | — | — | ✓ |

Los niveles 1 a 4 explican el método en términos generales: qué se mide, cómo se verifica y el índice. No dicen cómo se integra la información ni de dónde sale.

## Actualizar datos

1. Se editan `data/master.json` (registros `R`, `PROGRAMS`, `METAS`, `CONC`, `INTERNO`, `DEM`) o las capas en `data/`.
2. Se corre `build.py`.
3. Se publica el nivel 1 en el repositorio del sitio y se sube el resto a sus rutas protegidas.

Las capas se regeneran con `src/prep_master.py` a partir de tus archivos de `Documents/80_DATOS_GIS`. `src/extract.js` recupera los datos del v0.3.

## Cobro y acceso (recomendado)

- **Cobro**
  - Stripe: precios en MXN, cuotas mensual y anual, portal para cancelar. Comisión de 3.6% + $3 MXN por tarjeta nacional.
  - Si se usa Ghost: Ghost(Pro) Publisher, unos USD 29 al mes. Se pone en `radar.cicvives.org`, maneja altas gratuitas, niveles pagados y el envío semanal, y no cobra comisión sobre las suscripciones.
- **Canal complementario:** links de planes de suscripción de Mercado Pago para WhatsApp y redes. Quien pague por ahí se da de alta a mano como miembro.
- **Acceso a niveles 3 y 4:** Cloudflare Access con PIN por correo. Es gratis hasta 50 usuarios: al confirmar el pago se agrega el correo a la política.
- **Nivel 4:** convenio con CFDI.
- **Enlaces:** se cambian en `config.json` (hoy apuntan a contacto@cicvives.org).

**Nota fiscal:** si CIC VIVES es donataria autorizada, los ingresos por actividades distintas de su objeto no deben pasar del 10% del total anual. Hay que validar con el contador si las suscripciones se facturan como cuota de recuperación o como servicio, y si las aportaciones de aliados se reciben como donativo.
