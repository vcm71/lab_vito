# Archivos de contexto para el proyecto Orion

**Orden canónico de lectura de sesión:**
1. [arnes_orion.md](./arnes_orion.md)
2. [contexto_orion.md](./contexto_orion.md)

Los documentos `ORION_PROJECT_CONTEXT.md`, `ORION_SESSION_CONTEXT.md` y `orion_contexto_paraGPT` se consideran referencia heredada.

---

### Listado de referencia técnica

1. `package.json` – metadatos y scripts de Vite.
   [package.json](./package.json)

2. `index.html` – plantilla HTML principal. Incluye acordeón de Ajustes_vito con 6 módulos (`moduleThresholds`): docenas, columnas, suertesSencillas, sixenas, ceros, seriesSectores.
   [index.html](./index.html)

3. `main.js` – punto de entrada JS. Inicializa motores. Define `MODULE_INPUTS` con refs a inputs del acordeón. `syncSettingsForm` y save handler trabajan con `moduleThresholds`.
   [main.js](./main.js)

4. `rouletteTracker.js` – clase central del rastreador de historial de giros.
   [rouletteTracker.js](./rouletteTracker.js)

5. `vite.config.js` – configuración de Vite.
   [vite.config.js](./vite.config.js)

6. `atrasosRenderer.js` – renderiza la pestaña Atrasos. Usa `buildWidgets(getStatsFactory, thresholds)` donde `thresholds` es `settings.moduleThresholds`. Cada sección (suertes, docenas, columnas, seisenas) consume sus propios umbrales de módulo. CerOS y series usan maxWindow fijo=100.
   [atrasosRenderer.js](./atrasosRenderer.js)

7. `rouletteSettingsStore.js` – almacén de configuración con persistencia IndexedDB. Define `DEFAULT_SETTINGS` con `moduleThresholds` (6 módulos, cada uno con `limit:5`, `critical:9`, `maxWindow:100`). Migración automática desde campos planos `atrasosLimit`/`atrasosCritical`/`atrasosMaxWindow` en `normalizeSettings`.
   [rouletteSettingsStore.js](./rouletteSettingsStore.js)

8. `controlador_de_la_vista_lab.js` – interfaz ultra-compacta y estética premium (estilo ORION) para la pestaña Lab_Con (Teoría de Conjuntos).
   [controlador_de_la_vista_lab.js](./controlador_de_la_vista_lab.js)

9. `labEngine.js` – motor matemático del Laboratorio Analítico. Incluye `SET_TO_MODULE` (mapping de nombre de conjunto a clave de módulo). `_getSetStats` lee `maxWindow` desde `settings.moduleThresholds[moduleKey]` en vez del campo plano global.
   [labEngine.js](./labEngine.js)

---

### Estructura de moduleThresholds

```js
moduleThresholds = {
  docenas:          { limit: 5, critical: 9, maxWindow: 100 },
  columnas:         { limit: 5, critical: 9, maxWindow: 100 },
  suertesSencillas: { limit: 5, critical: 9, maxWindow: 100 },
  sixenas:          { limit: 5, critical: 9, maxWindow: 100 },
  ceros:            { limit: 5, critical: 9, maxWindow: 100 },
  seriesSectores:   { limit: 5, critical: 9, maxWindow: 100 }
}
```

IDs en HTML: `set-atrasos-{modulo}-{campo}` (ej: `set-atrasos-docenas-limit`).
