# St_win: Pestaña de Rachas Cortas (Win-Win por Apuesta)

> Documentación de la lógica empleada en la pestaña **St_win** del Roulette Tracker.
> Fecha: 2026-07-26

---

## 1. Concepto

**St_win** (Statistic Wins) es una pestaña que analiza para **cada tipo de apuesta** de la ruleta (rojo, negro, docenas, columnas, seisenas, plenos, sectores) si existe una **racha corta activa** (Win-Win).

En lugar de mostrar retrasos/atrasos (cuántos giros sin acertar), St_win muestra **rachas de aciertos consecutivos cercanos**: cuándo una apuesta está acertando repetidamente con pocos giros de separación.

---

## 2. La métrica central: distancia entre aciertos

Dado un array de giros `[G1, G2, G3, ..., GN]` y un conjunto de números objetivo (ej: los 18 rojos):

```
giros:     [5, 14, 23, 5, 0, 5]
objetivo:  {5, 23}

paso 1 — marcar posiciones de aciertos:
  G1=5 → ✓ (índice 0)
  G2=14 → ✗
  G3=23 → ✓ (índice 2)
  G4=5 → ✓ (índice 3)
  G5=0 → ✗
  G6=5 → ✓ (índice 5)
  → índices = [0, 2, 3, 5]

paso 2 — calcular distancias entre consecutivos:
  [2-0, 3-2, 5-3] = [2, 1, 2]
```

**Distancia** = cuántos giros pasan entre un acierto y el siguiente para una misma apuesta.

---

## 3. Clasificación Win-Win (`_getWinWinLevel`)

### 3.1 Algoritmo

```
_getWinWinLevel(dists):
   1. Empezar desde n = min(dists.length, 10), bajar hasta n = 2
   2. Si las últimas n distancias son TODAS ≤ 5:
        - Si n ≥ 3 → "WIN-WIN(n-2)"     (ej: n=3 → WIN-WIN(1), n=10 → WIN-WIN(8))
        - Si n = 2 → "WIN"
   3. Si ninguna coincide → null
```

### 3.2 Tabla de clasificación

| Últimas distancias consecutivas ≤ 5 | Nivel | Significado |
|---|---|---|
| 0 o 1 | `null` | Sin racha (muy pocos aciertos) |
| 2 | `WIN` | Racha mínima — 2 aciertos seguidos |
| 3 | `WIN-WIN(1)` | 4 aciertos en racha |
| 4 | `WIN-WIN(2)` | 5 aciertos en racha |
| 5 | `WIN-WIN(3)` | 6 aciertos en racha |
| 6 | `WIN-WIN(4)` | 7 aciertos en racha |
| 7 | `WIN-WIN(5)` | 8 aciertos en racha |
| 8 | `WIN-WIN(6)` | 9 aciertos en racha |
| 9 | `WIN-WIN(7)` | 10 aciertos en racha |
| 10 | `WIN-WIN(8)` | 11+ aciertos en racha |

### 3.3 Ejemplo concreto

```
Distancias de "Rojo": [3, 1, 7, 2, 4, 1, 3, 2]

Últimas 2: [3, 2] → ambas ≤ 5? sí → nivel mínimo WIN
Últimas 3: [1, 3, 2] → todas ≤ 5? sí → WIN-WIN(1)
Últimas 4: [4, 1, 3, 2] → todas ≤ 5? sí → WIN-WIN(2)
Últimas 5: [2, 4, 1, 3, 2] → todas ≤ 5? sí → WIN-WIN(3)
Últimas 6: [7, 2, 4, 1, 3, 2] → 7 > 5 → NO

→ Resultado: WIN-WIN(3) — 6 aciertos seguidos con distancias ≤ 5
```

---

## 4. Datos que se muestran por cada apuesta

Cada tarjeta (widget card) expone:

```
{
  name:       string     // "Rojo", "1ª Docena", "S1 (1-6)", etc.
  numbers:    string[]   // Números objetivo de la apuesta (ej: ["1","3","5",...])
  level:      string|null// "WIN" | "WIN-WIN(1-8)" | null
  wins:       number     // Total de aciertos en la ventana
  total:      number     // Total de giros en la ventana
  atraso:     number     // Giros desde el último acierto
  dists:      number[]   // Últimas 5 distancias entre aciertos
  isActive:   boolean    // level !== null && atraso ≤ 5
}
```

### 4.1 Elementos visuales de cada tarjeta

```
┌──────────────────────────────────────┐
│  [●●]  Rojo                🎯 9  ⌛2 │
│         distancias                   │
│  [3] [1] [5] [4] [2]  Racha activa  │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░               │
│  9 hits          esp 8.5            │
└──────────────────────────────────────┘
```

- **[●●]** — Círculo con el nivel Win-Win (color según severidad)
- **🎯 9** — Total de aciertos en la ventana
- **⌛ 2** — Atraso (giros desde el último acierto)
- **[3] [1] [5] [4] [2]** — Últimas 5 distancias (verde ≤5, rojo >5)
- **Racha activa** — Estado textual de la racha
- **Barra** — Hits reales vs. esperado matemático (línea dorada)

### 4.2 Código de colores del círculo de nivel

| Nivel | Color | Brillo |
|---|---|---|
| `null` | Gris (#374151) | Sin brillo |
| `WIN` | Azul (#0ea5e9) | Brillo suave |
| `WIN-WIN(1-2)` | Verde (#10b981) | Brillo medio |
| `WIN-WIN(3-4)` | Ámbar (#f59e0b) | Brillo fuerte |
| `WIN-WIN(5+)` | Rojo intenso (#ef4444) | Brillo máximo |

> **Nota:** A mayor nivel, más intenso es el color. WIN-WIN(8) es rojo brillante porque indica una racha extraordinariamente larga de aciertos cercanos.

---

## 5. Ventana de análisis ("Últimos N números global")

La pestaña usa la misma configuración que la pestaña de atrasos: el campo **`atrasosMaxWindow`** guardado en `Ajustes_vito`.

```
windowSpins = spins.slice(-maxWindow)
```

Donde:
- `spins` = todos los giros registrados
- `maxWindow` = valor de "Últimos N números (global)" en Ajustes_vito (default: 100)
- Solo los últimos N giros se analizan para Win-Win

---

## 6. Apuestas analizadas

### Suertes Sencillas (6 apuestas)
| Apuesta | Números objetivo | Probabilidad |
|---|---|---|
| Rojo | 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36 | 18/38 |
| Negro | 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35 | 18/38 |
| Par | 2,4,6,...,36 | 18/38 |
| Impar | 1,3,5,...,35 | 18/38 |
| Falta (1-18) | 1..18 | 18/38 |
| Pasa (19-36) | 19..36 | 18/38 |

### Docenas (3 apuestas)
| Apuesta | Números | Probabilidad |
|---|---|---|
| 1ª Docena | 1..12 | 12/38 |
| 2ª Docena | 13..24 | 12/38 |
| 3ª Docena | 25..36 | 12/38 |

### Columnas (3 apuestas)
| Apuesta | Números (mod 3) | Probabilidad |
|---|---|---|
| Columna 1 | 1,4,7,...,34 | 12/38 |
| Columna 2 | 2,5,8,...,35 | 12/38 |
| Columna 3 | 3,6,9,...,36 | 12/38 |

### Seisenas (6 apuestas)
| Apuesta | Números | Probabilidad |
|---|---|---|
| S1 | 1..6 | 6/38 |
| S2 | 7..12 | 6/38 |
| S3 | 13..18 | 6/38 |
| S4 | 19..24 | 6/38 |
| S5 | 25..30 | 6/38 |
| S6 | 31..36 | 6/38 |

### Plenos (38 apuestas individuales)
00, 0, 1, 2, 3, ..., 36 — cada uno con probabilidad 1/38.

### Series / Sectores (7 apuestas)
| Sector | Números | Probabilidad |
|---|---|---|
| S1 | 1,27,2,26,7 | 5/38 |
| S11 | 12,19,11,17,34 | 5/38 |
| S14 | 15,24,16,14,28 | 5/38 |
| S5 | 32,5,31,33,23 | 5/38 |
| S0 | 00,10,0,30,20 | 5/38 |
| S3 | 3,4,6,8,9,13,18 | 7/38 |
| S21 | 21,22,25,29,35,36 | 6/38 |

---

## 7. Diferencia con la pestaña "atrasos"

| Aspecto | atrasos | St_win |
|---|---|---|
| Métrica principal | **Atraso** (giros sin acertar) | **Win-Win level** (rachas de aciertos cercanos) |
| Color bueno | Azul/verde (poco atraso) | Verde (racha activa) |
| Color malo | Rojo (mucho atraso) | Rojo intenso (racha extrema) |
| Datos auxiliares | Máximo histórico de atraso | Distancias entre aciertos, hits totales |
| Barra comparativa | atraso actual vs. máx histórico | hits reales vs. esperado matemático |
| Sentido | "Hace cuánto no sale" | "Está saliendo seguido" |

---

## 8. Implementación técnica

### 8.1 Funciones inline (replican WinWinEngine)

Las tres funciones clave están implementadas directamente en `stWinRenderer.js` sin depender del motor `WinWinEngine`:

```js
// (1) Distancias entre aciertos consecutivos
calcularDistancias(giros, nums) {
  const targetSet = new Set(nums.map(n => n.toString()));
  const idxs = [];
  giros.forEach((g, i) => {
    if (targetSet.has(g.toString())) idxs.push(i);
  });
  const res = [];
  for (let i = 1; i < idxs.length; i++) res.push(idxs[i] - idxs[i - 1]);
  return res;
}

// (2) Atraso actual (giros desde el último acierto)
calcularAtraso(giros, nums) {
  const targetSet = new Set(nums.map(n => n.toString()));
  const idx = giros.map(g => targetSet.has(g.toString())).lastIndexOf(true);
  return idx === -1 ? giros.length : giros.length - 1 - idx;
}

// (3) Clasificación Win-Win
getWinWinLevel(dists) {
  for (let n = Math.min(dists.length, 10); n >= 2; n--) {
    if (dists.slice(-n).every(d => d <= 5)) {
      return n >= 3 ? `WIN-WIN(${n - 2})` : `WIN`;
    }
  }
  return null;
}
```

### 8.2 Integración

```
renderStWinTab(tracker)
  ↓
getSpins() → slice(-maxWindow) → convert to strings[]
  ↓
buildWidgets(giros) → for each bet type:
  ↓
analyzeWinWinForBet(giros, numbers):
  → calcularDistancias()
  → calcularAtraso()
  → getWinWinLevel(dists)
  → { wins, total, atraso, level, dists, isActive }
  ↓
metricCardHtml(item) → HTML de la tarjeta
```

### 8.3 Persistencia

| Dato | Almacenamiento | Clave |
|---|---|---|
| Orden de widgets | localStorage | `orion_stwin_widget_order` |
| Zoom del grid | localStorage | `orion_stwin_panel_zoom` |
| Tamaño del panel | localStorage | `orion_stwin_panel_size` |
| Ventana de giros | Ajustes_vito | `atrasosMaxWindow` (SettingsStore) |

---

## 9. Interpretación práctica

- **Una apuesta con WIN-WIN(3+)** significa que sus números objetivo han salido **al menos 4 veces seguidas** con separaciones de ≤5 giros entre cada una. Esto es una señal de concentración (racimo).
- **Una apuesta con `null`** significa que no ha tenido suficientes aciertos cercanos para formar una racha detectable.
- **Las suertes sencillas** (18/38 de probabilidad) tienden a producir rachas WIN-WIN más a menudo simplemente por probabilidad. Las rachas más notables son en apuestas de menor probabilidad (plenos, seisenas).
- **El color rojo intenso** en WIN-WIN(5+) **no es malo** — es una señal de que la apuesta está teniendo una racha de aciertos excepcionalmente concentrada.
