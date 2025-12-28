# ley-29090-expediente-generator (v1)

Generador de EXPEDIENTE (HTML + PDF vía impresión del navegador) para trámites bajo TUO Ley 29090.

## Qué hace
- Importa el JSON exportado desde el Motor de decisión (archivo `ley29090_resultado.json`)
- Permite completar metadatos del expediente (Municipalidad, administrado, predio, profesionales, etc.)
- Genera un **Expediente en HTML** (portada + ficha + ruta + alertas + anexos)
- Botón **Imprimir / Guardar PDF** (usa "Guardar como PDF" del navegador)

## Estructura
- `/docs/index.html` UI + preview imprimible
- `/docs/app/*` lógica (parseo, plantilla, render)
- `/docs/data/plantillas_expediente.json` plantillas por modalidad (extensible)

## GitHub Pages
Settings → Pages → Deploy from a branch → main → /docs

## Nota importante
El PDF se obtiene mediante la función de impresión del navegador (Chrome/Edge → Imprimir → "Guardar como PDF").
Esto mantiene la app 100% estática, compatible con GitHub Pages.
