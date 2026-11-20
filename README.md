# cicvives.org

Sitio público del **Centro de Investigación y Conservación Gaston J. Vives Gourieux, A.C.** (CIC VIVES), La Paz, Baja California Sur.

## Estructura
```
index.html          Inicio
centro.html         Identidad, objeto social y plan de 90 días
programas.html      Cuatro programas base
pilotos.html        Pilotos, líneas demostrativas y Red LoRa Peninsular
datos.html          Laboratorio de datos (vista previa con datos sintéticos)
valores.html        Decálogo de San Gabriel
inspiracion.html    Gastón J. Vives, citas del informe, ilustración y archivo visual
colaborar.html      Formas de colaborar y contacto
assets/css/style.css   Estilos compartidos
assets/js/main.js      Interacciones (menú, tablero, mapa, galería, formulario)
assets/img/            Imágenes e ilustraciones
CNAME               Dominio para GitHub Pages (cicvives.org)
CHANGELOG.md        Historial de versiones
```

## Cómo actualizar sin romper lo que funciona
1. Cada cambio se hace en una **rama** nueva (p. ej. `actualiza-pilotos-dic-2026`), nunca directo en `main`.
2. Se abre un **pull request** que describe qué cambió y se revisa.
3. Al aprobarlo se fusiona en `main`; GitHub Pages publica en uno o dos minutos.
4. Se anota en `CHANGELOG.md` y, si corresponde, se crea un **Release** con su etiqueta (`v1.1.0`).

Dónde se hacen los cambios frecuentes:
- **Estado de un piloto:** `pilotos.html` (tarjeta) e `index.html` (lista «Primeros pilotos»).
- **Contacto:** `colaborar.html`, pie de página de cada página y `assets/js/main.js` (formulario).
- **Programas:** `programas.html`.

## Volver a una versión anterior
GitHub → *Releases* → elegir la versión, o revertir el pull request correspondiente.
