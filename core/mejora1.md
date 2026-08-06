# Prompt para Hermes + DeepSeek CLI

## Configuración independiente de distancia máxima Win-Win (`mejora1`)

# MISIÓN

Implementar una evolución del módulo **St_win** para que la **distancia
máxima utilizada por el algoritmo Win-Win sea configurable por tipo de
apuesta**, preservando completamente la lógica estadística existente.

Trabaja sobre el proyecto:

``` bash
/home/shared/lab_vito
```

No inventes rutas. Inspecciona primero el proyecto y localiza los
archivos reales.

------------------------------------------------------------------------

# OBJETIVO

Actualmente existe un único ajuste:

``` text
Distancia máxima Win-Win = 5
```

Debe reemplazarse por **tres configuraciones independientes** en la
pestaña **Ajustes_vito**, sección **Win-Win**.

## Nueva configuración

### 1. Suertes sencillas (externas 1:1)

Aplica a:

-   Rojo
-   Negro
-   Par
-   Impar
-   Falta (1--18)
-   Pasa (19--36)

Guardar como:

``` text
winWinMaxDistanceEvenMoney
```

------------------------------------------------------------------------

### 2. Docenas y Columnas

Aplica a:

-   1ª Docena
-   2ª Docena
-   3ª Docena
-   Columna 1
-   Columna 2
-   Columna 3

Guardar como:

``` text
winWinMaxDistanceDozensColumns
```

------------------------------------------------------------------------

### 3. Series / Sectores

Aplica a:

-   S1
-   S11
-   S14
-   S5
-   S0
-   S3
-   S21

Guardar como:

``` text
winWinMaxDistanceSectors
```

------------------------------------------------------------------------

# REGLAS

No modificar:

-   cálculo de distancias
-   cálculo de hits
-   cálculo del esperado
-   clasificación WIN/WIN-WIN
-   renderizado estadístico
-   zoom
-   drag & drop
-   persistencia existente

Solo reemplazar el límite fijo por el correspondiente a cada grupo.

------------------------------------------------------------------------

# IMPLEMENTACIÓN

Localiza el lugar donde actualmente exista algo similar a:

``` js
d <= 5
```

o

``` js
maxDistance = 5
```

y reemplázalo por un parámetro configurable.

El algoritmo esperado debe comportarse conceptualmente así:

``` js
const maxDistance = getMaxDistanceForGroup(settings, betGroup);

const level = getWinWinLevel(dists, maxDistance);

const isActive =
    level !== null &&
    atraso <= maxDistance;
```

Implementa una función equivalente a:

``` js
getMaxDistanceForGroup(settings, group)
```

que devuelva:

-   even-money
-   dozens-columns
-   sectors

y un fallback seguro de 5.

------------------------------------------------------------------------

# MIGRACIÓN

Si existe la clave antigua:

``` text
winWinMaxDistance
```

úsala para inicializar automáticamente las tres nuevas configuraciones.

Después del primer guardado deben persistirse solamente las nuevas
claves.

------------------------------------------------------------------------

# AJUSTES_VITO

Reemplazar el campo único por tres campos:

``` text
DISTANCIA MÁXIMA — SUERTES SENCILLAS

[ 5 ]
Rojo · Negro · Par · Impar · Falta · Pasa

--------------------------------

DISTANCIA MÁXIMA — DOCENAS Y COLUMNAS

[ 5 ]
1ª · 2ª · 3ª · C1 · C2 · C3

--------------------------------

DISTANCIA MÁXIMA — SERIES / SECTORES

[ 5 ]
S1 · S11 · S14 · S5 · S0 · S3 · S21
```

Usar:

``` html
<input type="number" min="1" max="30" step="1">
```

------------------------------------------------------------------------

# LEYENDA ST_WIN

Eliminar el texto fijo:

``` text
Distancias <=5 = racha
```

y sustituirlo por una leyenda dinámica, por ejemplo:

``` text
Máx.:
Sencillas ≤X
Doc./Col. ≤Y
Sectores ≤Z
```

Los valores deben reflejar la configuración actual.

------------------------------------------------------------------------

# SEISENAS Y PLENOS

No cambiar su comportamiento.

Mientras no tengan configuración propia deben seguir utilizando:

``` text
5
```

como fallback.

------------------------------------------------------------------------

# VALIDACIONES

Verificar:

-   carga de ajustes
-   guardado
-   persistencia
-   renderizado
-   clasificación Win-Win
-   zoom
-   responsive
-   ausencia de regresiones

Ejecutar únicamente los scripts realmente disponibles en package.json.

------------------------------------------------------------------------

# GIT

No hacer:

-   reset
-   clean
-   push
-   merge
-   rebase

No sobrescribir cambios del usuario.

------------------------------------------------------------------------

# INFORME

Generar:

``` text
reports/STWIN_CONFIGURABLE_MAX_DISTANCE_2026-07-27.md
```

con:

-   archivos modificados
-   decisiones
-   migración
-   pruebas
-   riesgos
-   diff resumido

------------------------------------------------------------------------

# CRITERIOS DE ACEPTACIÓN

PASS únicamente si:

-   existen tres configuraciones independientes;
-   Suertes sencillas usan su límite;
-   Docenas y Columnas usan el suyo;
-   Series/Sectores usan el suyo;
-   Seisenas y Plenos conservan fallback = 5;
-   no cambia la lógica estadística;
-   no se rompen otros módulos;
-   se genera el informe solicitado.
