# Sug_guardian_ApRep.md

## Prompt para Hermes DeepSeek — Mejora arquitectónica y UX segura de AtRep / ApRep

> **Autor:** GPTS_ElGuardianDeOrion  
> **Destino sugerido:** Hermes DeepSeek  
> **Proyecto visible:** Roulette Tracker  
> **Módulo objetivo:** AtRep / ApRep — Atracción / Repulsión  
> **Modo recomendado inicial:** `REVIEW_ONLY`  
> **Nivel de riesgo:** Medio-Alto si se modifica UI/estadística; Bajo si solo se audita.

---

## 1. Contexto operativo

Estamos trabajando en **Roulette Tracker**, una aplicación local de análisis descriptivo de ruleta.  
La pestaña **AtRep / ApRep** analiza patrones de **Atracción / Repulsión** mediante el **Par Correlation Index (PCI)**.

El módulo documentado actualmente está compuesto por:

- `atRepEngine.js`: motor estadístico.
- `atRepRenderer.js`: interfaz visual.
- `AtRep.md`: documentación teórica y técnica del módulo.

La interfaz actual incluye:

1. Header técnico.
2. Cards de resumen global.
3. Grid de 38 números con color por PCI.
4. Tabla de detalles por conjunto.
5. Tabla de intersecciones.
6. Selector de conjuntos.

---

## 2. Ancla obligatoria

```text
La matemática manda; todo fluye; el operador decide.
```

La pestaña AtRep / ApRep debe observar, medir, comparar y advertir.  
No debe prometer predicción, no debe recomendar apuesta y no debe presentar rankings como señal operativa.

---

## 3. Objetivo del trabajo

Revisar y preparar una mejora incremental para que **AtRep / ApRep** quede más profesional, modular, testeable, responsive y segura en lenguaje estadístico.

La mejora debe cumplir cuatro objetivos:

1. **Separar cálculo, ViewModel y renderizado.**
2. **Mantener la UI pasiva.**
3. **Reducir lenguaje que pueda sonar predictivo o de apuesta.**
4. **Agregar validaciones y pruebas suficientes para proteger PCI, `0`, `00`, ventana activa e intersecciones.**

---

## 4. EXECUTION_MODE

```text
EXECUTION_MODE=REVIEW_ONLY
```

En esta primera fase, Hermes DeepSeek NO debe modificar archivos.  
Debe producir un plan técnico, inventario de archivos, diff propuesto en formato explicativo y lista de pruebas necesarias.

Solo pasar a `BUILD/RUN` cuando el usuario apruebe explícitamente:

```text
APROBADO_BUILD_RUN_ATREP_VIEWMODEL_UI_SEGURA
```

---

## 5. PROJECT_PATH y REPORTS_PATH

Usar estos valores por defecto si no se indica otra ruta:

```bash
PROJECT_PATH="/home/shared/ORION_v2"
REPORTS_PATH="/home/shared/ORION_v2/reports"
```

Aunque el producto visible se llame **Roulette Tracker**, el workspace puede seguir usando la ruta técnica existente.

---

## 6. TARGET_AGENT

```text
TARGET_AGENT=Hermes DeepSeek
```

Hermes debe actuar como:

- auditor técnico;
- arquitecto frontend modular;
- revisor de seguridad de lenguaje estadístico;
- diseñador de plan incremental;
- validador de tests.

---

## 7. Alcance funcional permitido

### Archivos candidatos a revisar

```text
AtRep.md
src/core/atRepEngine.js
src/viewmodels/atRepViewModel.js
src/ui/atRepRenderer.js
src/ui/styles.css
src/app/appController.js
src/ui/tabs.js
src/ui/appShell.js
test/atRepEngine.test.js
test/atRepViewModel.test.js
test/atRepRenderer.test.js
tests/atRepEngine.test.js
tests/atRepViewModel.test.js
tests/atRepRenderer.test.js
contexto_orionv2.md
```

No todos tienen que existir. Hermes debe detectar los nombres reales del proyecto antes de proponer cambios.

### Cambios esperados

1. Crear o proponer `src/viewmodels/atRepViewModel.js`.
2. Mover preparación de datos visuales desde `atRepRenderer.js` hacia el ViewModel.
3. Mantener `atRepEngine.js` como motor puro de cálculo.
4. Mantener `atRepRenderer.js` como renderer pasivo.
5. Cambiar textos de riesgo:
   - “Intersecciones óptimas” → “Intersecciones con mayor desviación descriptiva”.
   - “Top Atracción” → “Mayor agrupamiento observado”.
   - “Top Repulsión” → “Mayor separación observada”.
6. Agregar microcopy visible:
   ```text
   Lectura descriptiva de la ventana activa. No predice próximos resultados.
   ```
7. Asegurar soporte responsive móvil.
8. Añadir accesibilidad mínima:
   - `aria-label` en chips;
   - no depender solo del color;
   - tooltip o texto equivalente;
   - contraste suficiente.
9. Agregar pruebas unitarias y de render básico.

---

## 8. No-touch absoluto

Hermes DeepSeek NO debe tocar:

```text
node_modules/
dist/
build/
.git/
.cache/
logs/
backups/
temp_recovery/
data_muestras/
reports/ antiguos salvo crear un informe nuevo con timestamp
src/persistence/indexedDbAdapter.js salvo auditoría de frontera
src/persistence/localStorageAdapter.js salvo auditoría de frontera
src/charts/chartJsAdapter.js salvo que AtRep use charts, cosa que no debería requerir
src/workers/ salvo auditoría de frontera
```

No usar:

```bash
git add .
git reset --hard
git clean
rm -rf
```

No introducir dependencias nuevas sin justificación explícita.

---

## 9. Reglas no negociables de arquitectura

Hermes debe verificar y proteger:

1. AppState es la fuente runtime.
2. ViewModels son la frontera de lectura.
3. UI es pasiva.
4. UI no contiene negocio estadístico.
5. UI no accede a IndexedDB.
6. UI no accede a localStorage.
7. UI no hace `fetch`.
8. Persistencia vive en adapter/repository.
9. `0` y `00` permanecen separados.
10. `90` nunca es dato canónico.
11. `90 -> 00` solo se permite en importación/migración legacy con warning.
12. Workers sin DOM ni persistencia directa.
13. Chart.js solo mediante adapter.
14. No prometer predicción.
15. No recomendar apuesta.
16. No usar Kelly, bankroll, sizing, riesgo de ruina o lenguaje operativo.

Si encuentra violación, debe responder:

```text
STOP_ARCHITECTURE_BOUNDARY
```

Y explicar:

```text
Archivo:
Evidencia:
Regla violada:
Riesgo:
Corrección segura:
Test requerido:
```

---

## 10. Lógica estadística que debe preservarse

### Universo

```js
UNIVERSO_RULETA = [0, 1, 2, ..., 36, '00']
```

Debe haber 38 elementos.  
`0` y `'00'` deben ser valores distintos.

### Subconjuntos

AtRep / ApRep debe contemplar 18 subconjuntos:

```text
Rojo
Negro
Par
Impar
Falta
Pasa
Docena1
Docena2
Docena3
Columna1
Columna2
Columna3
Sixena1
Sixena2
Sixena3
Sixena4
Sixena5
Sixena6
```

La selección inicial recomendada es de 12 conjuntos:

```text
Rojo, Negro, Par, Impar, Falta, Pasa,
Docena1, Docena2, Docena3,
Columna1, Columna2, Columna3
```

Las seisenas quedan desactivadas por defecto, pero disponibles.

### Fórmula PCI

```text
PCI(set) = media_esperada / media_observada
```

Donde:

```text
media_observada = promedio de gaps entre ocurrencias consecutivas
media_esperada = 38 / tamaño_del_conjunto
```

Para número individual:

```text
media_esperada = 38
```

### Clasificación

```js
if (pci >= 1.15) return 'Atracción alta'
if (pci >= 1.05) return 'Atracción leve'
if (pci <= 0.85) return 'Repulsión alta'
if (pci <= 0.95) return 'Repulsión leve'
return 'CSR (independencia)'
```

### Insuficiencia

Si un conjunto o número tiene menos de 2 ocurrencias en la ventana activa:

```text
PCI = null
veredicto = "Sin datos" o "Insuficiente"
```

No inventar valores.

---

## 11. Arquitectura objetivo propuesta

Hermes debe proponer esta separación:

```text
src/core/atRepEngine.js
  - SUBCONJUNTOS
  - UNIVERSO_RULETA
  - refresh/calculators
  - _calcSetPCI
  - _calcNumberPCI
  - _classify
  - getSetDetails
  - getNumeroScores
  - buscarInterseccionesOptimas
  - getGlobalSummary

src/viewmodels/atRepViewModel.js
  - createAtRepViewModel(engine, selectedSetNames, options)
  - prepara cards
  - prepara chips
  - prepara tabla de conjuntos
  - prepara tabla de intersecciones
  - prepara selector de conjuntos
  - prepara textos seguros y disclaimers
  - no toca DOM
  - no accede a persistencia

src/ui/atRepRenderer.js
  - renderiza DOM pasivo
  - recibe ViewModel o factory inyectada
  - registra handlers
  - no calcula PCI
  - no clasifica
  - no ordena rankings estadísticos
  - no accede a storage/fetch

src/ui/styles.css
  - estilos responsive
  - clases por estado: attraction, repulsion, csr, insufficient
  - soporte accesible
```

---

## 12. Contrato mínimo del ViewModel

Hermes debe proponer un contrato serializable parecido a este:

```js
{
  title: 'AtRep',
  subtitle: 'Atracción / Repulsión',
  referenceText: 'Función K de Ripley · g(r) · PCI',
  disclaimer: 'Lectura descriptiva de la ventana activa. No predice próximos resultados.',
  summaryCards: [
    { id: 'totalSpins', label: 'Total spins', value: 5599, tone: 'warning' },
    { id: 'activeSample', label: 'Muestra activa', value: 200, detail: 'ventana: 200', tone: 'success' },
    { id: 'sets', label: 'Conjuntos', value: 12, detail: '4 agrupamiento · 4 separación', tone: 'warning' },
    { id: 'observedGrouping', label: 'Mayor agrupamiento observado', items: [] },
    { id: 'observedSeparation', label: 'Mayor separación observada', items: [] }
  ],
  scoreGrid: [
    {
      number: 0,
      label: '0',
      pci: 2.38,
      verdict: 'Atracción alta',
      tone: 'attraction-high',
      ariaLabel: 'Número 0, PCI 2.38, atracción alta, lectura descriptiva'
    }
  ],
  setDetails: [],
  intersections: [],
  setSelector: []
}
```

El contrato debe ser simple, serializable y testeable sin DOM.

---

## 13. Cambios de lenguaje UX solicitados

Reemplazar textos con potencial de interpretación operativa:

| Texto actual | Texto recomendado |
|---|---|
| Top Atracción | Mayor agrupamiento observado |
| Top Repulsión | Mayor separación observada |
| Intersecciones óptimas | Intersecciones con mayor desviación descriptiva |
| Atracción / Repulsión como señal | Atracción / Repulsión descriptiva |
| Óptimas | Destacadas por desviación |
| Scores individuales | Scores descriptivos por número |
| Veredicto | Lectura descriptiva |

Agregar en header o cerca de los rankings:

```text
Lectura descriptiva de la ventana activa. No predice próximos resultados.
```

Agregar en tooltip/chip:

```text
PCI descriptivo. No implica probabilidad futura.
```

---

## 14. Requisitos de pruebas

Hermes debe proponer o implementar tests focales para:

### Engine

```text
[ ] UNIVERSO_RULETA tiene 38 elementos.
[ ] 0 y '00' permanecen separados.
[ ] No existe 90 como dato canónico.
[ ] PCI de conjunto usa 38 / tamaño_del_conjunto.
[ ] PCI individual usa 38.
[ ] Menos de 2 ocurrencias devuelve PCI null.
[ ] _classify respeta todos los umbrales.
[ ] getGlobalSummary cuenta atracción, repulsión, csr e insuficientes.
[ ] buscarInterseccionesOptimas ordena por |avgPci - 1|.
[ ] getNumeroScores promedia PCI de conjuntos activos + PCI individual.
```

### ViewModel

```text
[ ] Devuelve contrato serializable.
[ ] No devuelve nodos DOM.
[ ] Prepara labels seguros.
[ ] Reemplaza Top Atracción/Repulsión por textos descriptivos.
[ ] Incluye disclaimer no predictivo.
[ ] Formatea PCI a 3 decimales.
[ ] Formatea medias como "g".
[ ] Prepara ariaLabel para chips.
```

### Renderer

```text
[ ] No importa engine directamente si se usa ViewModel inyectado.
[ ] No calcula PCI.
[ ] No clasifica veredictos.
[ ] Renderiza las 5 cards.
[ ] Renderiza 38 chips.
[ ] Renderiza tabla de conjuntos.
[ ] Renderiza tabla de intersecciones.
[ ] Botones toggle llaman handler y re-renderizan.
[ ] No accede a IndexedDB/localStorage/fetch.
```

### Arquitectura

```text
[ ] npm test pasa.
[ ] npm run check:architecture pasa.
[ ] npm run build pasa si hubo cambios de UI/build.
```

---

## 15. Validación DevSecOps requerida

Hermes debe entregar un **log único** con:

```text
preflight
git status inicial
objetivo
PROJECT_PATH
REPORTS_PATH
TARGET_AGENT
EXECUTION_MODE
allowlist
no-touch
archivos detectados
plan propuesto
diff propuesto o diff real según modo
tests focales propuestos/ejecutados
npm test
npm run check:architecture
npm run build si aplica
git status final
no-touch audit
veredicto terminal
```

En `REVIEW_ONLY`, no debe modificar archivos.  
En `BUILD/RUN`, debe escribir log y resumen con timestamp en `REPORTS_PATH`.

---

## 16. Comandos de validación esperados

Hermes debe usar comandos seguros y explícitos:

```bash
cd "$PROJECT_PATH" && git status --short
cd "$PROJECT_PATH" && npm test
cd "$PROJECT_PATH" && npm run check:architecture
cd "$PROJECT_PATH" && npm run build
```

Para tests focales, detectar rutas reales y usar algo equivalente a:

```bash
cd "$PROJECT_PATH" && node --test tests/atRepEngine.test.js tests/atRepViewModel.test.js tests/atRepRenderer.test.js
```

Si las rutas no existen, Hermes debe proponer los archivos de test correctos, no inventar éxito.

---

## 17. Resultado esperado en REVIEW_ONLY

Hermes DeepSeek debe responder con:

```text
VEREDICTO: PASS / WARN / FAIL / STOP_ARCHITECTURE_BOUNDARY

1. Inventario de archivos AtRep/ApRep detectados.
2. Diagnóstico de separación Engine / ViewModel / Renderer.
3. Riesgos encontrados.
4. Cambios recomendados por archivo.
5. Plan incremental en 2 fases:
   - Fase A: ViewModel + lenguaje seguro + tests.
   - Fase B: renderer pasivo + responsive/accesibilidad.
6. Diff conceptual por archivo.
7. Tests requeridos.
8. Comandos exactos de validación.
9. Frase exacta para autorizar BUILD/RUN.
```

---

## 18. Resultado esperado en BUILD/RUN

Solo si el usuario autoriza:

```text
APROBADO_BUILD_RUN_ATREP_VIEWMODEL_UI_SEGURA
```

Hermes podrá:

1. Crear o modificar `src/viewmodels/atRepViewModel.js`.
2. Ajustar `src/ui/atRepRenderer.js` para consumir ViewModel.
3. Ajustar textos seguros de UI.
4. Ajustar estilos responsive/accesibles.
5. Crear o actualizar tests.
6. Actualizar documentación `AtRep.md` si el cambio altera contratos.
7. Actualizar `contexto_orionv2.md` si el proyecto lo usa como bitácora viva.

Debe evitar refactor masivo.

---

## 19. Criterio de éxito

La tarea queda aprobada si:

```text
[ ] Engine sigue puro y no toca DOM.
[ ] Renderer queda pasivo.
[ ] ViewModel existe o queda propuesto con contrato claro.
[ ] UI no contiene negocio estadístico.
[ ] UI no accede a IndexedDB/localStorage/fetch.
[ ] 0 y 00 siguen separados.
[ ] 90 no aparece como canónico.
[ ] PCI conserva fórmula y umbrales.
[ ] Lenguaje predictivo fue eliminado o marcado como descriptivo.
[ ] Hay disclaimer no predictivo visible.
[ ] Tests focales pasan.
[ ] npm test pasa.
[ ] npm run check:architecture pasa.
[ ] npm run build pasa si aplica.
[ ] Log único y resumen fueron generados.
```

---

## 20. Criterio de bloqueo

Bloquear con `STOP_ARCHITECTURE_BOUNDARY` si ocurre cualquiera de estos casos:

```text
[ ] Renderer calcula PCI.
[ ] Renderer accede a storage/fetch.
[ ] Engine toca DOM.
[ ] Se mezcla 0 con 00.
[ ] Se introduce 90 como dato canónico.
[ ] Se cambia la fórmula PCI sin justificación formal.
[ ] Se presenta PCI como predicción.
[ ] Se recomienda apuesta.
[ ] Se usa lenguaje de banca, Kelly, sizing o ruina.
[ ] Se introduce dependencia nueva sin justificación.
[ ] Se toca persistencia sin necesidad.
[ ] Se modifica dist/build/logs/backups junto con fuente.
[ ] Tests o check de arquitectura fallan.
```

---

## 21. Prompt listo para copiar y pegar en Hermes DeepSeek

```text
TARGET_AGENT=Hermes DeepSeek
PROJECT_PATH="/home/shared/ORION_v2"
REPORTS_PATH="/home/shared/ORION_v2/reports"
EXECUTION_MODE=REVIEW_ONLY

Actúa como auditor técnico, arquitecto frontend modular y revisor DevSecOps para el módulo AtRep / ApRep de Roulette Tracker.

ANCLA:
La matemática manda; todo fluye; el operador decide.

CONTEXTO:
AtRep / ApRep analiza Atracción / Repulsión mediante PCI.
El motor actual esperado es atRepEngine.js.
El renderer actual esperado es atRepRenderer.js.
La documentación base es AtRep.md.
El producto visible se llama Roulette Tracker.

OBJETIVO:
Revisar y proponer una mejora incremental para separar Engine, ViewModel y Renderer.
Mantener el motor estadístico puro.
Crear/proponer src/viewmodels/atRepViewModel.js.
Dejar atRepRenderer.js como UI pasiva.
Cambiar lenguaje de riesgo por lenguaje descriptivo.
Agregar disclaimer no predictivo.
Definir tests focales para engine, ViewModel y renderer.
No modificar archivos en esta fase REVIEW_ONLY.

REGLAS NO NEGOCIABLES:
- AppState es fuente runtime.
- ViewModels son frontera de lectura.
- UI es pasiva.
- UI no contiene negocio estadístico.
- UI no accede a IndexedDB, localStorage ni fetch.
- Persistencia vive en adapter/repository.
- 0 y 00 permanecen separados.
- 90 nunca es dato canónico.
- 90 -> 00 solo en importación/migración legacy con warning.
- Engine no toca DOM.
- Renderer no calcula PCI.
- Renderer no clasifica resultados.
- No introducir dependencias sin justificación.
- No hacer refactor masivo.
- No prometer predicción.
- No recomendar apuesta.
- No usar Kelly, bankroll, sizing ni riesgo de ruina.

LÓGICA QUE DEBE PRESERVARSE:
UNIVERSO_RULETA = [0, 1, 2, ..., 36, '00'].
Debe haber 38 elementos.
SUBCONJUNTOS: 18 grupos.
Selección inicial: 12 conjuntos externos sin seisenas.
PCI(set) = media_esperada / media_observada.
media_esperada conjunto = 38 / tamaño_del_conjunto.
media_esperada número individual = 38.
Menos de 2 ocurrencias => PCI null / Insuficiente.
Umbrales:
- pci >= 1.15 => Atracción alta
- pci >= 1.05 => Atracción leve
- pci <= 0.85 => Repulsión alta
- pci <= 0.95 => Repulsión leve
- otro => CSR (independencia)

CAMBIOS UX SUGERIDOS:
- “Top Atracción” => “Mayor agrupamiento observado”
- “Top Repulsión” => “Mayor separación observada”
- “Intersecciones óptimas” => “Intersecciones con mayor desviación descriptiva”
- “Scores individuales” => “Scores descriptivos por número”
- Agregar disclaimer visible:
  “Lectura descriptiva de la ventana activa. No predice próximos resultados.”
- Agregar tooltip o aria-label:
  “PCI descriptivo. No implica probabilidad futura.”

ARQUITECTURA OBJETIVO:
src/core/atRepEngine.js:
- cálculo PCI, clasificación, detalles, scores, intersecciones, summary.

src/viewmodels/atRepViewModel.js:
- prepara contrato serializable para cards, grid, tablas, selector y disclaimers.
- no toca DOM.
- no toca persistencia.

src/ui/atRepRenderer.js:
- render DOM pasivo.
- consume ViewModel.
- registra handlers.
- no calcula PCI ni clasifica.

ALLOWLIST:
AtRep.md
src/core/atRepEngine.js
src/viewmodels/atRepViewModel.js
src/ui/atRepRenderer.js
src/ui/styles.css
src/app/appController.js
src/ui/tabs.js
src/ui/appShell.js
tests/atRepEngine.test.js
tests/atRepViewModel.test.js
tests/atRepRenderer.test.js
test/atRepEngine.test.js
test/atRepViewModel.test.js
test/atRepRenderer.test.js
contexto_orionv2.md

NO-TOUCH:
node_modules/
dist/
build/
.git/
.cache/
logs/
backups/
temp_recovery/
data_muestras/
reports/ antiguos
src/persistence/indexedDbAdapter.js
src/persistence/localStorageAdapter.js
src/workers/
src/charts/chartJsAdapter.js salvo auditoría sin modificación

COMANDOS DE AUDITORÍA EN REVIEW_ONLY:
cd "$PROJECT_PATH" && git status --short
cd "$PROJECT_PATH" && find . -path './node_modules' -prune -o -path './dist' -prune -o -path './build' -prune -o -path './.git' -prune -o -type f \( -iname '*atrep*' -o -iname '*aprep*' \) -print
cd "$PROJECT_PATH" && grep -R "Top Atracción\|Top Repulsión\|Intersecciones óptimas\|shouldBet\|Kelly\|bankroll\|fetch\|localStorage\|indexedDB" src test tests 2>/dev/null || true

RESULTADO ESPERADO:
Entregar:
1. VEREDICTO: PASS / WARN / FAIL / STOP_ARCHITECTURE_BOUNDARY.
2. Inventario de archivos AtRep/ApRep encontrados.
3. Diagnóstico Engine / ViewModel / Renderer.
4. Riesgos por severidad.
5. Plan incremental.
6. Diff conceptual por archivo.
7. Tests requeridos.
8. Comandos de validación.
9. Frase exacta para autorizar BUILD/RUN:
   APROBADO_BUILD_RUN_ATREP_VIEWMODEL_UI_SEGURA

CRITERIO DE BLOQUEO:
Responder STOP_ARCHITECTURE_BOUNDARY si:
- UI calcula PCI.
- UI accede a IndexedDB/localStorage/fetch.
- Engine toca DOM.
- Se mezcla 0 con 00.
- Aparece 90 como dato canónico.
- Se presenta PCI como predicción.
- Se recomienda apuesta.
- Se cambia fórmula PCI sin justificación.
- Se toca persistencia sin necesidad.
- Fallan tests o check de arquitectura.

NO MODIFIQUES ARCHIVOS EN REVIEW_ONLY.
```

---

## 22. Comando recomendado posterior a aprobación BUILD/RUN

Cuando el usuario apruebe `BUILD/RUN`, Hermes debe ejecutar con log único y validaciones.  
El estándar operativo exige log, resumen, traps, ejecución reproducible y salida auditable.

Comandos de validación mínimos:

```bash
cd /home/shared/ORION_v2 && npm test
cd /home/shared/ORION_v2 && npm run check:architecture
cd /home/shared/ORION_v2 && npm run build
```

---

## 23. Nota final del Guardián

Este prompt no autoriza cambios destructivos.  
Primero exige revisión, inventario y plan.  
Después, con aprobación explícita, permite una mejora incremental, modular, medible y reversible.
