2026-08-05T21:00:55-04:00

# Reporte técnico de Lab_Con

## 1) Resumen ejecutivo

La pestaña **Lab_Con** del localhost `Roulette Tracker Pro` está montada como un **Laboratory UI Shell**. En la interfaz real verificada, la vista no ejecuta todavía lógica de dominio; su objetivo es mostrar la estructura visual, navegación, barras de herramientas y paneles preparados para futuras fases C.3–C.7.

La pantalla activa muestra:
- encabezado de laboratorio,
- navegación lateral por secciones,
- toolbar con búsqueda, orden, filtros y acciones simuladas,
- workspace principal,
- barra de estado inferior,
- overlay host para diálogos/tostadas.

## 2) Qué representa Lab_Con en negocio

Lab_Con funciona como el espacio de trabajo visual del laboratorio. Su papel es:
- organizar experimentos,
- revisar sesiones,
- comparar resultados,
- consultar evidencia,
- reproducir eventos,
- preparar investigación asistida,
- y mantener un scaffold de ajustes visuales.

En esta fase, el sistema prioriza la navegación y el binding visual por encima del cálculo real.

## 3) Estado verificado en la UI local

Verificación en `http://localhost:3000`:
- la pestaña activa es **🧠 Lab_Con**,
- el área principal muestra **🧪 LABORATORY UI SHELL**,
- la vista indica explícitamente que está preparada para fases **C.3–C.7**,
- el texto visible confirma que es una **selección visual local sin conexión al dominio**.

La navegación interna expone estas vistas:
- Overview Shell
- Experiments C.3
- Sessions C.4
- Comparison C.5
- Evidence C.5
- Replay C.6
- AI Research C.7
- Settings Visual

## 4) Flujo general de la pestaña

Paso a paso:

1. El usuario hace clic en la pestaña **Lab_Con** del navbar superior.
2. `main.js` mantiene el estado de la pestaña activa y pide refrescar la vista del laboratorio.
3. `LabRenderer` monta el shell visual dentro del contenedor principal.
4. `renderLayout()` construye el esqueleto general de la pantalla.
5. `cacheDom()` guarda referencias a nodos clave.
6. `bindEvents()` conecta clicks y cambios de controles.
7. `syncAll()` sincroniza sidebar, toolbar, breadcrumb, workspace, status y overlay.
8. Cada interacción del usuario actualiza el estado local y re-renderiza solo la parte necesaria.

## 5) Módulos principales y sus funciones

### 5.1 `LabRenderer` — controlador principal de la vista

Archivo: `controlador_de_la_vista_lab.js`

Este es el componente que gobierna toda la pestaña Lab_Con.

Responsabilidades:
- leer preferencias visuales guardadas,
- decidir la vista activa,
- renderizar el shell,
- escuchar eventos de UI,
- sincronizar estado y DOM,
- delegar al binding si existe una vista más rica.

#### Constructor

`constructor(containerId, trackerInstance, options = {})`

Paso a paso:
1. Busca el contenedor DOM por `containerId`.
2. Detecta si `trackerInstance` expone `getViewModel()`.
3. Si existe, lo usa como binding; si no, opera en modo visual local.
4. Carga preferencias guardadas.
5. Inicializa el estado interno:
   - vista activa,
   - item seleccionado,
   - query de búsqueda,
   - modo de orden,
   - filtros,
   - grupos expandidos,
   - sidebar colapsado,
   - estado de toolbar,
   - estado de breadcrumb,
   - tema,
   - overlay.

#### `init()`

Paso a paso:
1. Verifica que exista contenedor.
2. Llama a `renderLayout()`.
3. Registra eventos una sola vez con `bindEvents()`.
4. Ejecuta `syncAll()`.

#### `renderLayout()`

Es el montaje estructural de la pestaña.

Paso a paso:
1. Obtiene la vista activa con `getView()`.
2. Inserta el HTML base del laboratorio.
3. Construye encabezado, sidebar, toolbar, workspace, status bar y overlay host.
4. Inserta botones de navegación por vista.
5. Llama a `cacheDom()` para guardar referencias.

#### `cacheDom()`

Paso a paso:
1. Busca y guarda referencias a:
   - sidebar toggle,
   - breadcrumb host,
   - search input,
   - sort select,
   - título del workspace,
   - subtítulo,
   - badge,
   - summary,
   - body del workspace,
   - label de toolbar,
   - copy de estado,
   - overlay host,
   - botones de vistas,
   - filtros,
   - botones de estado.
2. Evita repetir búsquedas DOM en cada interacción.

#### `bindEvents()`

Es la capa de captura de eventos.

Paso a paso:
1. Escucha clicks dentro del contenedor.
2. Si el click cae en un botón de vista, llama a `setActiveView()`.
3. Si cae en un filtro, llama a `toggleFilter()`.
4. Si cae en un botón de estado, llama a `setStatus()`.
5. Si cae en una acción de toolbar, llama a `handleToolbarAction()`.
6. Si cae en un grupo expandible, llama a `toggleGroup()`.
7. Si cae en elementos de evidencia o replay, llama a sus acciones específicas.
8. Si cae en un item selectable, llama a `selectItem()`.

#### `setActiveView(viewId)`

Paso a paso:
1. Valida que `viewId` exista en las vistas permitidas.
2. Actualiza `state.activeViewId`.
3. Recalcula el breadcrumb.
4. Ajusta el item seleccionado si no es visible en la nueva vista.
5. Marca la toolbar como navegación.
6. Si el binding existe, notifica el cambio.
7. Persiste preferencias visuales.
8. Ejecuta `syncAll()`.

#### `setSearchQuery(value)`

Paso a paso:
1. Guarda el texto de búsqueda.
2. Cambia el estado de toolbar a `searching` o `idle`.
3. Sincroniza toolbar, workspace y status.

#### `setSortMode(sortMode)`

Paso a paso:
1. Verifica que el modo exista.
2. Guarda el nuevo criterio.
3. Marca la toolbar como `sorting`.
4. Persiste preferencias.
5. Sincroniza toolbar, workspace y status.
6. Programa el retorno a `idle`.

#### `toggleFilter(filterId)`

Paso a paso:
1. Verifica que el filtro sea válido.
2. Si se pulsa `All`, deja solo `All` activo.
3. Si se desactiva el último filtro, vuelve a activar `All`.
4. Si se activa un filtro nuevo, desactiva `All`.
5. Marca la toolbar como `filtering`.
6. Persiste preferencias.
7. Sincroniza toolbar, workspace y status.
8. Programa el reset visual.

#### `toggleSidebarCollapsed()`

Paso a paso:
1. Invierte el estado de sidebar colapsado.
2. Persiste preferencias.
3. Reaplica sidebar y toolbar.

#### `toggleGroup(groupId)`

Paso a paso:
1. Valida que exista un `groupId`.
2. Alterna su estado entre expandido y colapsado.
3. Marca la toolbar como `workspace`.
4. Sincroniza workspace, toolbar y status.

#### `selectItem(itemId, itemKind = null)`

Paso a paso:
1. Si no hay `itemId`, no hace nada.
2. Si la vista activa es `comparison`, redirige a selección comparativa.
3. Si la vista activa es `ai-research`, redirige a selección de investigación.
4. En el caso general, guarda el item seleccionado.
5. Actualiza el workspace actual.
6. Marca la toolbar como `selection`.
7. Ajusta el estado de status a `placeholder-updated`.
8. Sincroniza workspace, toolbar y status.
9. Programa el reset de toolbar.

#### `handleToolbarAction(action)`

Es el router de acciones rápidas.

Acciones principales:
- `refresh`: simula refresco.
- `toast`: abre un toast visual.
- `confirm`: abre un overlay de confirmación.
- `info`: abre un overlay informativo.
- `warning`: abre un overlay de advertencia.
- `build-research-context`: prepara contexto de investigación.
- `execute-research`: ejecuta borrador de investigación.
- `cancel-research`: cancela la investigación.
- `reset-research`: reinicia el workspace de research.
- `ai-research`: activa la zona de investigación.

Paso a paso general:
1. Identifica la acción.
2. Actualiza el estado de toolbar.
3. Dispara la acción visual o delegada.
4. Sincroniza vista.
5. Programa el retorno a estado neutral.

#### `syncAll()`

Es el sincronizador global.

Paso a paso:
1. Actualiza sidebar.
2. Actualiza toolbar.
3. Actualiza breadcrumb.
4. Actualiza workspace.
5. Actualiza status.
6. Actualiza overlay.

### 5.2 Módulo `buildViewMarkup()` — selector de vistas

Función central que decide qué panel dibujar dentro del workspace.

Paso a paso:
1. Construye una línea resumen con vista, item, búsqueda y orden.
2. Lee `view.id`.
3. Selecciona la función de render adecuada.
4. Si hay `bindingViewModel`, usa la versión rica.
5. Si no hay binding, usa el scaffold visual placeholder.

#### Vistas soportadas

##### `overview`
- Usa `buildOverviewViewMarkup()` si hay binding.
- Si no, muestra resumen, cards y comandos de ejemplo.

##### `experiments`
- Usa `buildExperimentsViewMarkup()` si hay binding.
- Si no, muestra un lanzador visual y snapshots de experimento.

##### `sessions`
- Usa `buildSessionsViewMarkup()` si hay binding.
- Si no, muestra una línea temporal y lista de sesiones.

##### `comparison`
- Usa `buildComparisonViewMarkup()` si hay binding.
- Si no, muestra una matriz comparativa placeholder.

##### `evidence`
- Usa `buildEvidenceViewMarkup()` si hay binding.
- Si no, muestra tarjetas de evidencia y una lista skeleton.

##### `replay`
- Usa `buildReplayViewMarkup()` si hay binding.
- Si no, muestra pista de replay y pasos simulados.

##### `ai-research`
- Usa `buildAiResearchViewMarkup()` si hay binding.
- Si no, muestra un espacio vacío de investigación asistida.

##### `settings`
- Muestra scaffolding visual de ajustes.

### 5.3 Módulos de render por vista

#### `buildOverviewViewMarkup(viewModel, state)`

Paso a paso:
1. Lee KPIs, actividad reciente y comandos.
2. Construye panel principal de resumen.
3. Renderiza actividad reciente con tarjetas.
4. Renderiza comandos como chips.

Uso funcional:
- da la primera lectura del laboratorio,
- resume el estado global,
- enseña accesos rápidos.

#### `buildExperimentsViewMarkup(viewModel, state)`

Paso a paso:
1. Lee experimentos, experimento activo y workspace.
2. Construye tarjeta del experimento actual.
3. Muestra metadatos del workspace.
4. Lista experimentos disponibles.

Uso funcional:
- agrupa hipótesis, objetivos y resultados por experimento.

#### `buildSessionsViewMarkup(viewModel, state)`

Paso a paso:
1. Lee sesiones, sesión activa y resultado de sesión.
2. Construye tarjeta de sesión actual.
3. Muestra resultado, duración y errores.
4. Lista la línea temporal de sesiones.

Uso funcional:
- permite revisar la ejecución paso a paso de cada sesión.

#### `buildComparisonViewMarkup(viewModel, state)`

Paso a paso:
1. Lee comparación activa, métricas y resumen.
2. Construye selector de elementos comparables.
3. Indica estado de selección.
4. Muestra métricas, diferencias y conclusiones.
5. Incluye acciones para refrescar o limpiar selección.

Uso funcional:
- compara sesiones, experimentos o elementos visuales.

#### `buildEvidenceViewMarkup(viewModel, state)`

Paso a paso:
1. Lee reportes de evidencia.
2. Filtra por búsqueda y por tipo de evidencia.
3. Resalta el reporte seleccionado.
4. Muestra detalle del reporte.
5. Permite refrescar o limpiar selección.

Uso funcional:
- centraliza trazabilidad, capturas y resultados.

#### `buildReplayViewMarkup(viewModel, state)`

Paso a paso:
1. Lee fuentes de replay y timeline.
2. Determina evento seleccionado.
3. Dibuja controles de reproducción.
4. Lista eventos de la secuencia.
5. Muestra detalle del evento, su metadata y relaciones.

Uso funcional:
- reconstruye la secuencia de hechos del laboratorio.

#### `buildAiResearchViewMarkup(viewModel, state)`

Paso a paso:
1. Lee contexto, selección y respuesta.
2. Muestra query, scope y provider.
3. Permite construir contexto.
4. Permite ejecutar borrador, cancelar o reiniciar.
5. Presenta fuentes de contexto.
6. Renderiza el draft o una ayuda visual.

Uso funcional:
- prepara investigación asistida sin romper el perímetro local.

### 5.4 Modos placeholder sin binding

Cuando no hay `bindingViewModel`, el shell usa tarjetas y listas skeleton.

Eso significa:
- la UI sigue siendo navegable,
- el layout se puede validar,
- y el diseño queda listo para integrar la lógica real después.

## 6) Componentes de sincronización visual

### `syncSidebar()`

Paso a paso:
1. Aplica clase de sidebar colapsado al contenedor.
2. Actualiza el texto del botón.
3. Marca la vista activa como `aria-selected`.

### `syncToolbar()`

Paso a paso:
1. Sincroniza el valor del search input.
2. Sincroniza el select de sort.
3. Actualiza estado visual de filtros.
4. Reescribe el texto del estado de toolbar.

### `syncBreadcrumb()`

Paso a paso:
1. Toma el breadcrumb activo.
2. Construye botones con separadores `›`.
3. Marca el último como activo.

### `syncWorkspace()`

Paso a paso:
1. Obtiene la vista activa.
2. Pide el viewModel del binding si existe.
3. Inserta resumen de binding + markup de vista.
4. Actualiza título, subtítulo, badge y summary.
5. Recalcula estado de paneles expandibles.

### `syncStatus()` y `syncOverlay()`

Aunque no se detallen aquí línea por línea, su función es mantener:
- barra de estado,
- copy inferior,
- overlays de confirmación, info, warning o toast,
- y el feedback visual inmediato.

## 7) Relación con `main.js`

La pestaña Lab_Con no vive aislada. `main.js` actúa como puente de navegación del shell general.

Flujo:
1. El usuario elige la pestaña Lab_Con.
2. El router de la app activa la vista correspondiente.
3. El renderer del laboratorio recibe la señal.
4. `update()` o `syncAll()` refrescan la UI visible.

## 8) Observaciones funcionales importantes

- La vista actual está diseñada como shell, no como motor de negocio definitivo.
- La frase visible “Sin conexión al dominio” es literal: esta fase es de maqueta funcional.
- El patrón está preparado para evolucionar sin rediseñar la estructura base.
- Cada sección tiene una intención clara:
  - Overview: resumen,
  - Experiments: definición y seguimiento,
  - Sessions: ejecución temporal,
  - Comparison: contraste,
  - Evidence: trazabilidad,
  - Replay: reproducción,
  - AI Research: asistencia,
  - Settings: ajustes visuales.

## 9) Conclusión

Lab_Con es el centro de trabajo visual del laboratorio. Su valor actual no está en calcular resultados, sino en organizar el recorrido operativo de análisis: entrar, seleccionar, comparar, revisar evidencia, reproducir eventos y preparar investigación.

La arquitectura está bien separada en tres capas:
- montaje de layout,
- manejo de eventos,
- sincronización de estado.

Eso hace que la vista sea extensible y que futuras fases puedan conectar lógica real sin reescribir la interfaz completa.
