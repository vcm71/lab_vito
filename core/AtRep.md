# AtRep — Atracción / Repulsión (Roulette Tracker Pro)

> **Archivo de documentación dual:** teoría estadística + implementación del motor y renderizador.
> Código fuente: `atRepEngine.js` (motor), `atRepRenderer.js` (UI).

---

## 1. Visión general de la pestaña

**AtRep** (Atracción / Repulsión) es la quinta pestaña del Roulette Tracker. Analiza si los números de la ruleta tienden a aparecer **más juntos** (atracción) o **más separados** (repulsión) de lo esperado bajo independencia estadística, usando el **Par Correlation Index (PCI)**.

| Aspecto | Detalle |
|---------|---------|
| Nombre visible | 🧲 AtRep (Atracción / Repulsión) |
| Engine | `AtRepEngine` en `atRepEngine.js` |
| Renderer | `AtRepRenderer` en `atRepRenderer.js` |
| Conjuntos | 18 subconjuntos (6 suertes sencillas + 3 docenas + 3 columnas + 6 seisenas) |
| Números | 38 (0–36 + 00, ruleta americana) |
| Ventana | `atrasosMaxWindow` global (settings raíz) |
| Selección por defecto | 12 conjuntos externos (suertes, docenas, columnas) — sin seisenas |

---

## 2. Fundamento teórico

### 2.1. Procesos puntuales espaciales

En estadística formal, **atracción** y **repulsión** son conceptos de **procesos puntuales espaciales** (spatial point processes): patrones de puntos en un espacio (árboles, células, delitos, defectos industriales).

| Término | Sentido formal | Lectura práctica |
|---------|---------------|------------------|
| **Atracción** | Puntos aparecen **más cerca** de lo esperado bajo aleatoriedad | Agrupamiento, clustering, asociación positiva |
| **Repulsión** | Puntos aparecen **más separados** de lo esperado | Inhibición, regularidad, separación |
| **CSR** | No hay evidencia de atracción ni repulsión | Compatible con independencia |

### 2.2. Función K de Ripley y función de correlación de pares g(r)

La **K de Ripley** mide cuántos puntos vecinos se esperan dentro de una distancia `r`. La **función de correlación de pares** `g(r)` deriva de K:

- `g(r) = 1` → sin interacción (CSR)
- `g(r) > 1` → atracción/clustering a distancia `r`
- `g(r) < 1` → repulsión/inhibición a distancia `r`

### 2.3. El Par Correlation Index (PCI)

El PCI es una adaptación unidimensional de `g(r)` para secuencias temporales de ocurrencias:

```
PCI(set) = media_esperada / media_observada
```

Donde:
- **media_observada** = distancia promedio entre ocurrencias consecutivas de cualquier miembro del conjunto en la ventana activa
- **media_esperada** = `38 / |set|` (bajo hipótesis CSR)

#### Umbrales de clasificación

| Rango PCI | Clasificación | Color UI |
|-----------|--------------|----------|
| ≥ 1.15 | Atracción alta | Verde intenso (#34d399) |
| 1.05 – 1.15 | Atracción leve | Verde claro |
| 0.95 – 1.05 | CSR (independencia) | Gris (#94a3b8) |
| 0.85 – 0.95 | Repulsión leve | Rojo claro |
| ≤ 0.85 | Repulsión alta | Rojo intenso (#ef4444) |

### 2.4. Advertencia crítica

> En eventos independientes como la ruleta, el PCI describe patrones **pasados**. **NO es predictivo.** No implica causalidad, no recomienda apuestas, no promete resultados futuros. La falacia del jugador (NBER, Gambler's Fallacy) consiste precisamente en creer que la probabilidad cambia porque ocurrió recientemente.

---

## 3. Engine: `atRepEngine.js` — Motor de cálculo

### 3.1. Estructura de datos

**`SUBCONJUNTOS`** (array de 18 objetos):
```js
{ name: 'Rojo', label: 'Rojo', numbers: [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36] }
{ name: 'Negro', label: 'Negro', numbers: [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35] }
{ name: 'Par', label: 'Par', numbers: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36] }
{ name: 'Impar', label: 'Impar', numbers: [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35] }
{ name: 'Falta', label: 'Falta', numbers: [1..18] }
{ name: 'Pasa', label: 'Pasa', numbers: [19..36] }
{ name: 'Docena1'/'Docena2'/'Docena3', ... }  // 12 números c/u
{ name: 'Columna1'/'Columna2'/'Columna3', ... } // 12 números c/u
{ name: 'Sixena1'..'Sixena6', ... }  // 6 números c/u
```

**`UNIVERSO_RULETA`**: `[0, 1, 2, ..., 36, '00']` (38 elementos)

### 3.2. Clase `AtRepEngine`

**Constructor:**
```js
constructor(domainTracker)
```
- Recibe el Domain Tracker como fuente de datos
- Estado interno: `_spins[]`, `_windowSize`, `_setResults{}`, `_numberResults{}`, `_globalTotal`, `_insufficientCount`

---

### 3.3. Métodos — Flujo de ejecución

#### `refresh()` — Paso principal (línea 75-99)

```
1. Leer settings.atrasosMaxWindow del Domain Tracker
2. Obtener todos los spins: domainTracker.getSpins()
3. Recortar a ventana activa: spins.slice(-windowSize)
4. Reiniciar _setResults, _numberResults, _insufficientCount
5. Si _globalTotal < 2 → abortar
6. Para cada uno de los 18 SUBCONJUNTOS → _calcSetPCI(set)
7. Para cada uno de los 38 UNIVERSO_RULETA → _calcNumberPCI(num)
```

#### `_calcSetPCI(set)` — PCI de un conjunto (línea 104-144)

```
1. Recorrer _spins, registrar índices donde spin.number ∈ set.numbers
2. Si count < 2:
     → _setResults[name] = { occurrences: count, pci: null, verdict: "Sin datos"/"Insuficiente" }
     → añadir a _insufficientCount
3. Si count ≥ 2:
   a. Calcular distancias entre posiciones consecutivas: [pos[1]-pos[0], pos[2]-pos[1], ...]
   b. meanDist = promedio de distancias
   c. expectedDist = 38 / set.numbers.length
      (ej: rojo → 38/18 ≈ 2.11; docena → 38/12 ≈ 3.17; sixena → 38/6 ≈ 6.33)
   d. pci = expectedDist / meanDist
   e. Clasificar con _classify(pci)
   f. Guardar en _setResults[name]
```

#### `_calcNumberPCI(num)` — PCI de un número individual (línea 149-185)

```
Igual que _calcSetPCI pero:
- expectedDist = 38 (un número específico aparece 1 vez cada 38 giros)
- Sin _insufficientCount
```

#### `_classify(ratio)` — Clasificación (línea 195-201)

```js
ratio ≥ 1.15 → 'Atracción alta'
ratio ≥ 1.05 → 'Atracción leve'
ratio ≤ 0.85 → 'Repulsión alta'
ratio ≤ 0.95 → 'Repulsión leve'
else         → 'CSR (independencia)'
```

---

### 3.4. Métodos de consulta

#### `getSetDetails(activeSetNames)` — Detalles por conjunto (línea 208-231)

```
Entrada:  array de nombres de conjuntos activos
Salida:   { setDetails[], globalTotal }

Por cada conjunto activo:
  - Buscar definición en SUBCONJUNTOS
  - Obtener resultado de _setResults[name]
  - Incluir numberScores[]: PCI de cada número miembro del conjunto
```

#### `getNumeroScores(activeSetNames)` — Scores compuestos por número (línea 240-299)

```
Entrada:  array de nombres de conjuntos activos
Salida:   [{ number, pci, verdict, setsIn, individualPci }]  // 38 elementos

Por cada número del universo:
  1. Encontrar qué conjuntos activos lo contienen (setsIn)
  2. Si setsIn > 0:
     a. Recolectar PCI de cada conjunto que lo contiene
     b. Añadir su PCI individual
     c. Promediar todo → pci compuesto
  3. Si setsIn === 0:
     → Usar solo su PCI individual
```

#### `buscarInterseccionesOptimas(activeSetNames, topK=5)` — Intersecciones (línea 308-343)

```
Entrada:  conjuntos activos, topK (default 5)
Salida:   [{ label, numbers[], count, avgPci, verdict }]

1. Obtener número scores con getNumeroScores()
2. Generar todos los pares (i, j) de conjuntos activos
3. Para cada par:
   a. Calcular intersección: numbers comunes entre ambos
   b. Si intersección vacía → skip
   c. PCI promedio = promedio de scores de los números en la intersección
   d. Guardar candidato
4. Ordenar por |avgPci - 1| descendente (mayor desviación primero)
5. Devolver topK
```

#### `getGlobalSummary(activeSetNames)` — Resumen global (línea 349-374)

```
Entrada:  conjuntos activos
Salida:   { totalSets, attraction, repulsion, csr, insufficient }

Contar:
  - PCI > 1.05   → attraction++
  - PCI < 0.95   → repulsion++
  - else         → csr++
  - Sin datos    → insufficient++
```

### 3.5. Cache

```js
let _cache = {};
export function invalidateCache() { _cache = {}; }
```
- Cache global para resultados de conjuntos (se invalida al cambiar ventana)
- Actualmente declarado pero no usado en `refresh()` (se recalcula todo)

---

## 4. Renderer: `atRepRenderer.js` — Interfaz de usuario

### 4.1. Clase `AtRepRenderer`

**Constructor:**
```js
constructor(containerId, domainTracker)
```
- `containerId`: ID del elemento DOM (ej. `'view-at-rep'`)
- Crea `AtRepEngine` interno
- `_selectedSetNames`: `Set<string>` de conjuntos activos

**`init()`** (línea 28-32):
- Configura conjuntos por defecto: Rojo, Negro, Par, Impar, Falta, Pasa, 3 docenas, 3 columnas (12 conjuntos)

**`toggleSet(setName)`** (línea 42-48):
- Agrega o quita del Set de seleccionados
- Inmediatamente re-renderiza con `update()`

### 4.2. Método `update()` — Renderizado completo

```js
update() {
  container = document.getElementById(containerId)
  container.innerHTML = ''
  container.appendChild(_buildLayout())
}
```

#### `_buildLayout()` — Ensamblaje (línea 64-78)

Orden de construcción:

```
1. engine.refresh()                    → recalcula todo
2. _createHeader()                     → título + referencia
3. _createGlobalSummary()              → 5 tarjetas de resumen
4. _createScoreSection()               → grid 38 números coloreados
5. _createSetDetails()                 → tabla de conjuntos
6. _createIntersections()              → tabla de intersecciones óptimas
7. _createSetSelector()                → botones toggle de conjuntos
```

---

### 4.3. Componentes UI detallados

#### `_createHeader()` — Header (línea 80-90)

```
┌──────────────────────────────────────────────────┐
│ 🧲 AtRep (Atracción / Repulsión)    core/AtRep.md│
└──────────────────────────────────────────────────┘
```

#### `_createGlobalSummary()` — Resumen global (línea 92-145)

5 tarjetas en grid responsivo:

| Tarjeta | Valor | Color |
|---------|-------|-------|
| Total Spins | `spins.length` | Ámbar (#fbbf24) |
| Muestra Activa | `min(total, maxWindow)` | Verde (#34d399) |
| Conjuntos | N activos + desglose attr/rep | Ámbar |
| Top Atracción | Top 3 números con PCI > 1 | Verde |
| Top Repulsión | Top 3 números con PCI < 1 | Rojo (#ef4444) |

#### `_createScoreSection()` — Grid de scores individuales (línea 147-225)

Grid de 38 chips (32×32px) en fila flexible:

- **Cada chip** representa un número del 0 al 36 + 00
- **Color de fondo**: intensidad proporcional a desviación del PCI respecto a 1
  - Verde (atracción): `rgba(52,211,153, intensidad)` — más intenso cuanto mayor el PCI
  - Rojo (repulsión): `rgba(239,68,68, intensidad)` — más intenso cuanto menor el PCI
  - Gris (CSR): `#1e293b` con borde `#334155`
- **Tooltip**: muestra valor exacto del PCI + veredicto
- **Leyenda**: 3 ítems al pie (verde = atracción, rojo = repulsión, gris = CSR)

#### `_createSetDetails()` — Tabla de conjuntos (línea 227-289)

Tabla con 6 columnas:

| Conjunto | Ocurrencias | Media Obs. | Media Esp. | PCI | Veredicto |
|----------|-------------|------------|------------|-----|-----------|
| Rojo | 12 | 2.1g | 2.1g | 1.023 | CSR |
| Negro | 8 | 3.8g | 2.1g | 0.553 | Repulsión alta |

- `g` = gaps (distancia entre ocurrencias)
- Fondo verde tenue si atracción, rojo tenue si repulsión
- PCI en color según clasificación

#### `_createIntersections()` — Intersecciones óptimas (línea 291-345)

Tabla con 5 columnas:

| Intersección | Números | Cobertura | PCI Prom. | Veredicto |
|-------------|---------|-----------|-----------|-----------|
| Rojo ∩ Docena3 | 19, 21, 23, 25, 27 | 5 | 1.245 | Atracción alta |

- Label en violeta (#a78bfa)
- Muestra hasta 6 números de la intersección (con `...` si excede)
- Ordenado por `|PCI - 1|` descendente
- Si no hay intersecciones con datos → mensaje informativo

#### `_createSetSelector()` — Selector de conjuntos (línea 347-380)

18 botones toggle en fila flexible:

- **Azul** (#3b82f6) = conjunto seleccionado
- **Gris** (#1e293b) = no seleccionado
- Click → llama `toggleSet()` → `update()`
- Separado por línea divisoria del contenido anterior

---

## 5. Flujo completo de ejecución

```
Inicio de sesión / navegación a pestaña AtRep
│
├─ Renderer.init() → _setupDefaultSets() // 12 conjuntos externos
│
└─ Renderer.update()
     │
     ├─ Engine.refresh()
     │   ├─ Lee atrasosMaxWindow del settings global
     │   ├─ Obtiene spins del Domain Tracker
     │   ├─ slice(-windowSize) → ventana activa
     │   ├─ Para 18 SUBCONJUNTOS → _calcSetPCI()
     │   └─ Para 38 números → _calcNumberPCI()
     │
     ├─ _createHeader()
     ├─ _createGlobalSummary()
     │   └─ Engine.getGlobalSummary() + getNumeroScores()
     ├─ _createScoreSection()
     │   └─ Engine.getNumeroScores() → grid 38 chips
     ├─ _createSetDetails()
     │   └─ Engine.getSetDetails() → tabla
     ├─ _createIntersections()
     │   └─ Engine.buscarInterseccionesOptimas() → tabla
     └─ _createSetSelector()
          └─ SUBCONJUNTOS → botones toggle
               │
               └─ Click → toggleSet() → update()
```

---

## 6. Dependencias

| Dependencia | Tipo | Propósito |
|-------------|------|-----------|
| `domainTracker` (RouletteTracker) | Inyección | `getSpins()`, `getSettings()` |
| `rouletteSettingsStore` | Import | `getSnapshot()` para `atrasosMaxWindow` |
| `SUBCONJUNTOS` | Propia | Catálogo de 18 conjuntos |
| `UNIVERSO_RULETA` | Propia | 38 números |

---

## 7. Invariantes y reglas de negocio

1. **Ventana global única**: todos los conjuntos usan el mismo `atrasosMaxWindow` (settings raíz)
2. **Mínimo 2 ocurrencias**: si un conjunto o número tiene < 2 ocurrencias en la ventana, PCI = null
3. **PCI compuesto**: el score de un número es el **promedio** del PCI de todos los conjuntos activos que lo contienen + su PCI individual
4. **Sin cache actualmente**: cada `refresh()` recalcula todo — no hay caché diferencial activa
5. **Muestra Activa**: la card de resumen muestra `min(totalSpins, atrasosMaxWindow)` para indicar cuántos giros se están analizando realmente

---

## 8. Fuentes formales

1. **NIST CSRC** — Eventos estadísticamente independientes: `P(A ∩ B) = P(A)P(B)`
2. **spatstat.explore / R** — `pcf()` función de correlación de pares: `g(r) > 1` = clustering
3. **PMC / COVID-19 spatial analysis** — `K(r) = πr²` bajo CSR
4. **Smith** — *A Scale-Sensitive Test of Attraction and Repulsion Between Spatial Point Patterns*
5. **Biscio y Lavancier** — *Quantifying repulsiveness of determinantal point processes* (arXiv:1406.2796)
6. **NBER** — *The Gambler's Fallacy* (Paper #3769)
7. **spatstat.model / R** — `repul()` para índices de repulsión DPP

---

> **Última actualización:** julio 2026 · Fase5.5.5
> **Build:** 80 módulos · Tests: 128/128
