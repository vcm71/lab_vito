# Win-Win: Análisis de Rachas Cortas (Racimos)

> Documentación técnica del sistema de detección de rachas cortas en la ruleta,
> diseñado para el proyecto **Roulette Tracker (ORION)**.

---

## 1. Concepto fundamental

**Win-Win** detecta patrones donde una serie personalizada (conjunto de números)
aparece repetidamente en intervalos cortos. La intuición es que ciertos números
tienden a "racimarse" — aparecer en clusters separados por pocos giros — en lugar
de distribuirse uniformemente.

La métrica central es la **distancia entre aciertos consecutivos**, medida en
número de giros. Una racha Win-Win ocurre cuando esta distancia es ≤ 5 para
varios aciertos seguidos.

---

## 2. Arquitectura

### 2.1 Clase: `WinWinEngine` (`src/engines/WinWin/WinWinEngine.js`)

Hereda de `BaseEngine`. Se integra al ciclo de vida ORION (initialize → start →
stop → dispose). Se construye con una instancia del tracker (domain o legacy) y
persiste los máximos históricos en IndexedDB.

### 2.2 Almacenamiento: `winwinHistoricalMaxesStore.js`

- **DB:** `orion_winwin_maxes` (IndexedDB)
- **Versión:** 1
- **Store:** `state`
- **Clave:** `historical-maxes`
- **Estructura:**
  ```js
  {
    externals: { "Rojo": 12, "Negro": 8, ... },
    dozens:    { "D1": 15, "C2": 11, ... },
    seisenas:  { "S3": 21, ... },
    series:    { "MiSerie": 32, ... }
  }
  ```
- Incluye caché en memoria y operaciones asíncronas encoladas para evitar
  escrituras concurrentes.

### 2.3 Consumidores

| Consumidor | Ubicación | Uso |
|---|---|---|
| `renderWinWinTab()` | `main.js:2432` | Pestaña Win-Win actual (datos) |
| `renderTesterTable()` | `main.js:851` | Pestaña Tester (simulación de apuestas) |
| `LogicEngine` | `src/engines/Orion/LogicEngine.js:58` | Recibe WinWinEngine como dependencia |

---

## 3. Algoritmos clave

### 3.1 `_calcularDistancias(giros, nums)` — distancias entre aciertos

```js
_calcularDistancias(giros, nums) {
    // Encuentra índices donde un número de la serie aparece
    const targetSet = new Set(nums.map(n => n.toString()));
    let idxs = [];
    giros.forEach((g, i) => {
        if (targetSet.has(g.toString())) idxs.push(i);
    });
    // Calcula diferencias entre índices consecutivos
    let res = [];
    for (let i = 1; i < idxs.length; i++)
        res.push(idxs[i] - idxs[i - 1]);
    return res;
}
```

- **Entrada:** Array de giros (`["5","14","23","5","0","5"]`) y números objetivo
  de la serie (`["5","23"]`)
- **Lógica:** Marca la posición (índice) de cada acierto, luego calcula la
  diferencia (en giros) entre aciertos consecutivos
- **Ejemplo:** giros `[A, _, _, A, _, A]` (A = acierto) → distancias `[3, 1]`
- **Salida:** Array de distancias enteras `[3, 1]`

### 3.2 `_calcularAtraso(giros, nums)` — giros desde el último acierto

```js
_calcularAtraso(giros, nums) {
    const targetSet = new Set(nums.map(n => n.toString()));
    const idx = giros.map(g => targetSet.has(g.toString())).lastIndexOf(true);
    return idx === -1 ? giros.length : giros.length - 1 - idx;
}
```

- Devuelve cuántos giros han pasado desde el último acierto de la serie
- Si nunca acertó, devuelve la longitud total (todos son atraso)
- Se usa como filtro: `analyzeWinWin` solo procesa series con `atraso ≤ 5`

### 3.3 `_getWinWinLevel(dists)` — clasificación de la racha

```js
_getWinWinLevel(dists) {
    for (let n = Math.min(dists.length, 10); n >= 2; n--) {
        if (dists.slice(-n).every(d => d <= 5)) {
            return n >= 3 ? `WIN-WIN(${n - 2})` : `WIN`;
        }
    }
    return null;
}
```

| Distancias consecutivas ≤ 5 | Nivel | Clasificación |
|---|---|---|
| Últimas 0-1 | N/A | `null` (no hay racha) |
| Últimas 2 | 2 aciertos cerca | `WIN` |
| Últimas 3 | 4 aciertos en racha | `WIN-WIN(1)` |
| Últimas 4 | 5 aciertos en racha | `WIN-WIN(2)` |
| Últimas 5 | 6 aciertos en racha | `WIN-WIN(3)` |
| ... | ... | `WIN-WIN(N-2)` |
| Hasta 10 | 11+ aciertos en racha | `WIN-WIN(8)` |

**Regla central:** busca el prefijo más largo del final del array de distancias
donde **todas** las distancias sean ≤ 5. Empieza desde `n=10` (o el máximo
disponible) y baja hasta `n=2`. La primera coincidencia es la clasificación.

### 3.4 `_getLastDistances(giros, nums)` — últimas distancias (recientes primero)

```js
_getLastDistances(giros, nums) {
    // Itera hacia adelante, guarda distancias entre aciertos
    // Retorna el array invertido: las más recientes primero
    return distances.reverse();
}
```

Usado por `analyzeSeriesAtrasadas` para detectar "debilidad" (distancias > 37).

---

## 4. API Pública

### 4.1 `analyzeWinWin(spins, series, windowSize = null)`

```js
engine.analyzeWinWin(spins, series, windowSize)
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `spins` | `Spin[]` | Array de giros (objetos con `.number`) |
| `series` | `{name, numbers}[]` | Series personalizadas activas |
| `windowSize` | `number\|null` | Subventana opcional (ej: últimos 200 giros) |

**Retorno:** `Array<{name, type, lastDists, atraso}>`

```js
[
  { name: "Números Calientes",  type: "WIN-WIN(2)", lastDists: "2, 3, 5, 1", atraso: 0 },
  { name: "Sectores Fríos",     type: "WIN",         lastDists: "4, 3",        atraso: 3 },
]
```

**Flujo interno:**
1. Si `windowSize` está definido, recorta `spins` a los últimos N
2. Convierte giros a array plano de strings (`.number`)
3. Por cada serie activa:
   a. Calcula distancias entre aciertos (`_calcularDistancias`)
   b. Calcula atraso actual (`_calcularAtraso`)
   c. Si atraso ≤ 5, clasifica el nivel (`_getWinWinLevel`)
   d. Si hay nivel, añade al resultado con las últimas 5 distancias

---

## 5. Integración en el Tester (Simulador de Apuestas)

En la pestaña Tester (`main.js:838-1150`), el patrón Win-Win se usa como
**señal de entrada para apuestas progresivas**:

### 5.1 Ciclo de vida de una apuesta Win-Win

```
ESTADO INICIAL
  step=0, hasFirstWin=false, isWinWinActive=false

PRIMER ACIERTO (step cualquiera)
  → hasFirstWin = true
  → isWinWinActive = false (vigilancia)
  → Registra lastWinIndex

SEGUNDO ACIERTO dentro de maxWinWinDist (por defecto ≤6 giros)
  → isWinWinActive = true
  → Empieza la fase de apuesta

ACUMULACIÖN (isWinWinActive=true)
  → Cada giro: step++
  → Cuando acierta de nuevo:
    → Calcula coste total acumulado (step apuestas × unidades)
    → Calcula payout: 35 × unidad_actual
    → Balance += payout - coste_total
    → step = 0 (reset)

FRACASO
  → Si pasan maxWinWinDist giros sin acierto:
    → Calcula coste de fallo: suma de N apuestas (spinsForFailure)
    → Balance -= coste_de_fallo
    → hasFirstWin = false, isWinWinActive = false
```

### 5.2 Configuración del Tester para Win-Win

| Control HTML | ID | Default | Descripción |
|---|---|---|---|
| Checkbox | `tester-cfg-fibonacci` | false | Usar progresión Fibonacci vs. unidades fijas |
| Input | `tester-cfg-units` | 1 | Unidades base por apuesta |
| Input | `tester-cfg-max-attempts` | 5 | N° máx de apuestas por ciclo Win-Win |
| Input | `tester-cfg-spins-failure` | 5 | Giros sin acierto para declarar fallo |
| Input | `tester-cfg-winwin-dist` | 6 | Distancia máxima entre aciertos para Win-Win |

### 5.3 Progresión Fibonacci

```
FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]
```

- La apuesta en el giro `N` del ciclo = `FIBONACCI[N-1]`
- Si `N > 17`, usa el último valor disponible (1597)
- Efecto: las apuestas crecen lentamente al principio, luego se aceleran

---

## 6. Pestaña Win-Win existente (`main.js:2488-2507`)

Actualmente muestra los resultados de `analyzeWinWin` en una fila de tabla con
tres columnas:

| Columna | Contenido |
|---|---|
| **col1** | Series con racha activa: `Nombre(TIPO)` — ej: `Calientes(WIN-WIN(2))` |
| **col2** | Números objetivo de cada serie — ej: `Calientes(5,14,23)` |
| **col3** | Últimas 8 distancias + atraso — ej: `Calientes(2,3,5,1,4)_(0)` |

---

## 7. Para una nueva pestaña Win-Win dedicada

### 7.1 Visualizaciones recomendadas

1. **Tabla de rachas activas** — series con nivel Win-Win, atraso, distancias
   recientes, tendencia (¿está fortaleciéndose o debilitándose la racha?)
2. **Gráfico de distancias** — histograma de distancias entre aciertos para cada
   serie (ver la distribución)
3. **Línea de tiempo** — cada acierto marcado en una línea de giros, con
   conexiones visuales entre aciertos cercanos (≤5) vs. lejanos
4. **Contador de rachas** — medidor visual del nivel actual (WIN → WIN-WIN(1) →
   WIN-WIN(2) → ...)
5. **Máximos históricos** — mejor racha registrada para cada serie (desde
   IndexedDB)

### 7.2 Datos a exponer por serie

```js
{
  name: string;           // Nombre de la serie
  numbers: string[];      // Números objetivo
  level: string | null;   // WIN | WIN-WIN(N) | null
  atraso: number;         // Giros desde último acierto
  distances: number[];    // Últimas N distancias
  maxStreak: number;      // Máximo nivel alcanzado en esta sesión
  historicalMax: number;  // Máximo nivel registrado (IndexedDB)
  hitCount: number;       // Total de aciertos en la ventana
  avgDistance: number;    // Distancia promedio entre aciertos
  isStreaking: boolean;   // ¿Racha activa ahora?
}
```

### 7.3 Configuración de la pestaña

| Control | Propósito | Default |
|---|---|---|
| Selector de ventana | Cuántos giros analizar | 200 |
| Slider umbral Win-Win | Distancia máxima para contar como racha | 5 |
| Filtro por serie | Elegir qué series monitorear | Todas activas |
| Botón "Reset récords" | Reiniciar máximos históricos | — |

### 7.4 Almacenamiento de récords

Usar `winwinHistoricalMaxesStore` (IndexedDB) para persistir:
- Mejor racha (nivel más alto) por serie
- Fecha/hora de la mejor racha
- Distancias de la mejor racha
- Número de rachas WIN-WIN detectadas (total histórico)

La estructura actual permite agregar un campo `winwin` a `historicalMaxes.series`:
```js
historicalMaxes.series["MiSerie"] = {
  maxLevel: 4,           // WIN-WIN(4)
  maxLevelDate: "2026-07-26T22:00:00",
  totalStreaks: 12,
  bestDistances: "1,2,3,5,1"
}
```

### 7.5 Integración con MonteCarloValidator

El `MonteCarloValidator` puede generar datos sintéticos para probar:
- ¿Cuántas rachas WIN-WIN se esperan por azar en N giros?
- ¿La frecuencia observada de rachas es estadísticamente significativa?
- Percentiles de distancia entre aciertos para distribución uniforme vs. sesgada

---

## 8. Ejemplo completo

### Datos de entrada
```
Giros: ["5", "14", "23", "0", "5", "0", "32", "15", "5", "14", "7"]
Serie: { name: "Calientes", numbers: ["5", "14", "23"] }
```

### Cálculo paso a paso

1. **Índices de aciertos:** `[0, 1, 2, 4, 8, 9]` (giros 0,1,2,4,8,9)
2. **Distancias:** `[1, 1, 2, 4, 1]` (diferencias consecutivas)
3. **Últimas 5 distancias:** `"1, 1, 2, 4, 1"`
4. **Atraso:** desde giro 9 han pasado 2 giros → `atraso=2`
5. **Clasificación:** últimas 3 distancias `[4, 1, x]`... chequea n=5: `[1,2,4,1,x]`
   todas ≤5 → `WIN-WIN(3)` (n=5 → 5-2 = 3)
6. **Resultado:**
   ```json
   { "name": "Calientes", "type": "WIN-WIN(3)",
     "lastDists": "1, 1, 2, 4, 1", "atraso": 2 }
   ```

---

## 9. Limitaciones conocidas

1. **Falsos positivos:** En una distribución uniforme sobre 38 números, la
   probabilidad de que 2 aciertos caigan dentro de 5 giros es alta
   (~P ≈ 1 - (37/38)^5 ≈ 12.4%). El nivel WIN-WIN(1) necesita 3 aciertos
   seguidos con distancia ≤5, lo que reduce los falsos positivos
   (~P ≈ (12.4%)^2 ≈ 1.5%).
2. **Dependencia de ventana:** El resultado cambia drásticamente según la
   ventana elegida. Ventanas pequeñas (37-74 giros) dan poca significancia
   estadística.
3. **Sin normalización:** No se ajusta por la frecuencia esperada de la serie.
   Una serie con 12 números acertará ~1 de cada 3 giros de media, haciendo que
   distancias ≤5 sean esperables.
4. **No hay corrección de Bonferroni:** Al analizar M series simultáneamente,
   crece la probabilidad de encontrar al menos una racha falsa.
