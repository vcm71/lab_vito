# Documentación de Lógica de Paneles — Roulette Tracker Pro

> **Archivo:** `log_hermes_RT.md`
> **Propósito:** Documentar la lógica completa de 4 paneles críticos en las pestañas Lab_Con, Lab_Con1 y AtRep.
> **Última actualización:** 2026-07-29

---

## Panel 1: "NÚMEROS INDIVIDUALES MÁS CALIENTES" (Lab_Con)

### Ubicación
- **Pestaña:** Lab_Con
- **ID del contenedor HTML:** `#lab-top-numbers`
- **Archivos fuente:**
  - Renderer/Controller: `controlador_de_la_vista_lab.js` (método `renderTopNumbers()`)
  - Engine: `labEngine.js` (clase `LabEngine`, método `resolverScoresIndividuales()`)
  - Almacén de configuración: `rouletteSettingsStore.js`

### Flujo de datos

1. **Entrada:** El usuario selecciona conjuntos activos mediante los filtros `#lab-set-filters`. Cada clic en un botón `[data-set-name]` agrega o remueve el nombre del conjunto en `this.selectedSets`.

2. **Cálculo de scores** (`update()` → `resolverScoresIndividuales`):
   ```js
   this.scores = this.engine.resolverScoresIndividuales(this.selectedSets);
   ```
   - El método recorre cada conjunto activo (`activeSets.forEach`).
   - Para cada conjunto, obtiene su peso mediante `calcularPesoRetraso(setName)`.
   - Distribuye ese peso a cada número miembro del conjunto: `SUBCONJUNTOS[setName].forEach(num => scores[num] += weight)`.
   - El score de cada número es la **suma de los pesos** de todos los conjuntos activos que contienen a ese número.

3. **Cálculo del peso de un conjunto** (`calcularPesoRetraso`):
   ```js
   weight = ratio_limite * (1.0 - probabilidad_demora)
   ```
   Donde:
   - `actual` = atraso actual del conjunto (giros desde su última ocurrencia)
   - `max` = atraso máximo histórico del conjunto en la ventana activa
   - `ratio_limite = actual / max` — qué tan cerca está del máximo histórico
   - `p_hit = |set| / 38` — probabilidad de que el conjunto acierte en un giro
   - `probabilidad_demora = (1.0 - p_hit)^actual` — probabilidad de que haya fallado `actual` veces consecutivas
   - `1.0 - probabilidad_demora` — factor de certeza (qué tan "seguro" es que ya debería haber salido)

4. **Filtrado y ordenamiento** (`renderTopNumbers`):
   ```js
   const scoreArray = Array.from(UNIVERSO_RULETA)
     .map(num => ({ num, score: this.scores[num] || 0 }))
     .filter(item => item.score > 0 && item.num !== "0" && item.num !== "00")
     .sort((a, b) => b.score - a.score)
     .slice(0, 5);
   ```
   - Convierte el objeto `scores` a array.
   - **Excluye** 0 y 00 (cero simple y doble cero).
   - **Filtra** solo números con score > 0 (que están en al menos un conjunto activo con peso > 0).
   - **Ordena** descendente por score.
   - **Toma top 5.**

5. **Renderizado**:
   - Cada número se muestra en un `div` cuadrado de 3.5rem × 3.5rem.
   - Color de borde y sombra basado en el score:
     - `score > 0.8` → rojo `#ef4444`
     - `score > 0.4` → amarillo `#f59e0b`
     - `score ≤ 0.4` → verde `#10b981`
   - Muestra el número en grande (1.2rem, blanco) y el score debajo con formato `SCORE X.X`.

### Consideraciones
- Si no hay números con score > 0, se muestra el mensaje "Esperando datos...".
- Ventana activa controlada por `atrasosMaxWindow` desde `rouletteSettingsStore`.
- El engine utiliza `SUBCONJUNTOS` del catálogo estándar (rojo, negro, pares, docenas, columnas, seisenas).

---

## Panel 2: "Top Números" (Lab_Con1)

### Ubicación
- **Pestaña:** Lab_Con1
- **Archivos fuente:**
  - Renderer: `labCon1Renderer.js` (clase `LabCon1Renderer`, método `_createScoreSection()` parcialmente; resumen global con método `_createGlobalSummary()`)
  - Engine: `labCon1Engine.js` (clase `LabCon1Engine`, método `resolverScoresIndividuales()`)

### Flujo de datos

1. **Entrada:** Los conjuntos activos se seleccionan por defecto (Rojo, Negro, Par, Impar, 3 docenas, 3 columnas) y el usuario puede alternarlos mediante `toggleSet()`.

2. **Cálculo de scores** (`update()` → `_createGlobalSummary()` → `resolverScoresIndividuales`):
   ```js
   const scores = this.engine.resolverScoresIndividuales(this.selectedSets);
   ```
   - Estructura idéntica al LabEngine pero usa `calcularPesoWinWin(setName)` en lugar de `calcularPesoRetraso`.
   - Distribuye el peso Win-Win de cada conjunto a sus números miembro.

3. **Cálculo del peso Win-Win** (`calcularPesoWinWin`):
   ```js
   weight = baseWeight + streakBonus + recencyBonus
   ```
   Donde:
   - **Conjuntos con racha activa:**
     - `baseWeight = 0.4`
     - `streakBonus = min(streakLength / 8, 0.4)` — bonificación por longitud de racha Win-Win
     - `recencyBonus = (1 - atraso/threshold) * 0.2` — bonificación por actualidad (menos atraso = más reciente)
     - Peso máximo: `1.0`
   - **Conjuntos sin racha activa:**
     - `weight = max(0, 1 - atraso/(threshold*3)) * 0.25` — decaimiento suave

4. **Top Números** (dentro de `_createGlobalSummary`):
   ```js
   const topThreshold = Math.max(...Object.values(scores), 0.001);
   // Se ordenan los pares [número, score]
   Object.entries(scores)
     .filter(([n]) => n !== '0' && n !== '00')
     .sort(([, a], [, b]) => b - a)
     .slice(0, 5)
   ```
   - **Excluye** 0 y 00.
   - **Ordena** descendente por score Win-Win.
   - **Toma top 5** para mostrar en la tarjeta "Top Números".

5. **Renderizado del score grid completo** (`_createScoreSection`):
   - Se renderizan TODOS los 38 números del universo en una cuadrícula.
   - Cada número se muestra como un chip de 32×32px.
   - La intensidad del color dorado (`rgba(251,191,36, 0.2 + pct * 0.6)`) es proporcional al ratio `score / topThreshold`.
   - Números con score = 0 se muestran en gris oscuro (`#1e293b`).
   - Al hacer hover se ve el score exacto en el `title`.

### Diferencia clave con Lab_Con
- Lab_Con usa **peso por atraso** (stress/delay weight), más tradicional.
- Lab_Con1 usa **peso por racha Win-Win**, que favorece conjuntos con rachas activas recientes de aciertos consecutivos.

---

## Panel 3: "Mayor agrupamiento observado" (AtRep)

### Ubicación
- **Pestaña:** AtRep
- **Archivos fuente:**
  - ViewModel: `src/viewmodels/atRepViewModel.js` (función `createAtRepViewModel`, tarjeta `observedGrouping`)
  - Engine: `atRepEngine.js` (clase `AtRepEngine`, métodos `refresh()`, `_calcNumberPCI()`, `_calcSetPCI()`, `getNumeroScores()`)
  - Renderer: `atRepRenderer.js` (método `_createGlobalSummary()`)

### Flujo de datos

1. **Cálculo base — PCI individual** (`_calcNumberPCI`):
   Para cada número individual del universo:
   ```js
   Path: spins → positions (índices donde aparece el número) → distances → meanDist → PCI
   ```
   - `meanDist = promedio(distances)` — distancia promedio entre ocurrencias consecutivas
   - `expectedDist = 38` — para un número individual en ruleta americana
   - `PCI = expectedDist / meanDist`
   - Mínimo 2 ocurrencias requeridas; si no, PCI = null.

2. **Cálculo base — PCI de conjuntos** (`_calcSetPCI`):
   Para cada definición del catálogo (conjuntos estándar, series, sectores):
   ```js
   Path: spins → positions (índices donde ocurre cualquier miembro del conjunto) → distances → meanDist
   ```
   - `expectedDist = 38 / |set|` — distancia esperada para el tamaño del conjunto
   - `PCI = expectedDist / meanDist`
   - Mínimo 2 ocurrencias requeridas.

3. **Combinación por número** (`getNumeroScores`):
   Para cada número del universo, dado un conjunto de conjuntos activos:
   ```js
   // Si el número está en N conjuntos activos:
   pcValues = [PCI_individual, PCI_conjunto_1, ..., PCI_conjunto_N]
   combinedPci = average(pcValues)
   ```
   - Números no contenidos en ningún conjunto activo: `pci = individualPci` (sin promedio).
   - Números con insuficientes datos: PCI = null.

4. **Filtrado "Mayor agrupamiento observado"** (ViewModel):
   ```js
   const withPci = scores.filter(s =>
     s.pci !== null &&
     s.pci > 1.05 &&
     String(s.number) !== '0' &&
     String(s.number) !== '00'
   );
   const topAttraction = [...withPci]
     .sort((a, b) => b.pci - a.pci)
     .slice(0, topK);
   ```
   - **Criterio de atracción:** PCI > 1.05 (los números aparecen más juntos de lo esperado bajo CSR).
   - **Excluye** 0 y 00.
   - **Ordena** descendente por PCI (mayor atracción primero).
   - **Top K:** configurable mediante `atRepTopK` (default 5, rango 1–20).

5. **Renderizado** (Renderer → `_createGlobalSummary`):
   - Se muestra una tarjeta con etiqueta "Mayor agrupamiento observado" y color verde `#34d399`.
   - Cada número se muestra como:
     ```
     <número> (PCI.toFixed(2))
     ```
   - Ejemplo: `35 (1.25)` significa número 35 con PCI combinado de 1.25.

### Clasificación de PCI (veredicto)
| Rango | Clasificación |
|---|---|
| PCI ≥ 1.15 | Atracción alta |
| 1.05 ≤ PCI < 1.15 | Atracción leve |
| 0.95 < PCI < 1.05 | CSR (independencia) |
| 0.85 < PCI ≤ 0.95 | Repulsión leve |
| PCI ≤ 0.85 | Repulsión alta |

---

## Panel 4: "Mayor separación observada" (AtRep)

### Ubicación
- **Pestaña:** AtRep
- **Archivos fuente:**
  - ViewModel: `src/viewmodels/atRepViewModel.js` (tarjeta `observedSeparation`)
  - Engine: `atRepEngine.js` (mismo que el Panel 3)
  - Renderer: `atRepRenderer.js` (mismo método `_createGlobalSummary()`)

### Flujo de datos

1. **Cálculo base:** Idéntico al Panel 3 — usa los mismos PCI individual + combinado de `getNumeroScores()`.

2. **Filtrado "Mayor separación observada"** (ViewModel):
   ```js
   const topRepulsion = scores.filter(s =>
     s.pci !== null &&
     s.pci < 0.95 &&
     String(s.number) !== '0' &&
     String(s.number) !== '00'
   )
     .sort((a, b) => a.pci - b.pci)
     .slice(0, topK);
   ```
   - **Criterio de repulsión:** PCI < 0.95 (los números aparecen más separados de lo esperado bajo CSR).
   - **Excluye** 0 y 00.
   - **Ordena** ascendente por PCI (menor PCI = mayor repulsión primero).
   - **Top K:** mismo límite `atRepTopK` que el panel de agrupamiento.

3. **Renderizado** (Renderer → `_createGlobalSummary`):
   - Se muestra una tarjeta con etiqueta "Mayor separación observada" y color rojo `#ef4444`.
   - Cada número se muestra como:
     ```
     <número> (PCI.toFixed(2))
     ```
   - Ejemplo: `15 (0.82)` significa número 15 con PCI combinado de 0.82.

---

## Relación entre los cuatro paneles

| Panel | Pestaña | Métrica base | Filtro principal | Top K | Excluye |
|---|---|---|---|---|---|
| NÚMEROS INDIVIDUALES MÁS CALIENTES | Lab_Con | Suma de pesos de atraso | score > 0 | 5 | 0, 00 |
| Top Números | Lab_Con1 | Suma de pesos Win-Win | score > 0 | 5 | 0, 00 |
| Mayor agrupamiento observado | AtRep | PCI combinado (individuo + conjuntos) | PCI > 1.05 (atracción) | atRepTopK (defecto 5) | 0, 00 |
| Mayor separación observada | AtRep | PCI combinado (individuo + conjuntos) | PCI < 0.95 (repulsión) | atRepTopK (defecto 5) | 0, 00 |

### Diferencias fundamentales
- **Lab_Con / Lab_Con1:** Usan **scores acumulativos** (suma de pesos de conjuntos). Miden qué números están más "presionados" por la inercia de los conjuntos que los contienen. Lab_Con usa atraso, Lab_Con1 usa rachas Win-Win.
- **AtRep:** Usa **PCI** (Par Correlation Index), una métrica de distancia inter-ocurrencia que mide si los números aparecen más juntos (atracción) o más separados (repulsión) de lo esperado por azar.

### Configuración compartida
- **Ventana de muestreo:** Todos los paneles usan `atrasosMaxWindow` desde `rouletteSettingsStore` para limitar el historial de giros considerados.
- **Conjuntos activos:** AtRep usa por defecto todas las apuestas externas (suertes sencillas, docenas, columnas). Lab_Con/Lab_Con1 permiten al usuario seleccionar qué conjuntos incluir.
- **atRepTopK:** Controla cuántos números mostrar en ambos paneles de AtRep (agrupamiento y separación), configurable desde Ajustes_vito → Sección AtRep.
