# Prompt completo para Hermes + DeepSeek CLI
## Mejora visual y nitidez del módulo `St_win`

# MISIÓN: MEJORAR NITIDEZ, CONTRASTE Y JERARQUÍA VISUAL DEL MÓDULO ST_WIN

Actúa como arquitecto senior de frontend, especialista en UX/UI para paneles estadísticos, JavaScript, CSS responsive, accesibilidad visual y mantenimiento de aplicaciones existentes.

Debes trabajar directamente sobre el proyecto:

```bash
/home/shared/lab_vito
```

El módulo objetivo es la pestaña:

```text
St_win
```

También puede aparecer en archivos, clases, selectores o funciones con nombres como:

```text
stWin
st_win
StWin
stWinRenderer
renderStWinTab
metricCardHtml
Win-Win
WIN-WIN
```

---

# 1. OBJETIVO GENERAL

Mejorar la nitidez visual de los paneles de la pestaña `St_win` sin modificar la lógica estadística existente.

Actualmente la lógica funcional es correcta, pero la interfaz presenta los siguientes problemas:

- Poco contraste entre fondo general, paneles, secciones y tarjetas.
- Bordes demasiado tenues.
- Textos secundarios demasiado pequeños.
- Exceso de brillos o efectos `glow`.
- Colores que compiten entre sí.
- Barras estadísticas demasiado finas.
- Tarjetas con anchos inconsistentes.
- Exceso de contenedores visuales anidados.
- Baja legibilidad cuando el zoom del panel disminuye.
- Algunos estados y métricas no tienen una jerarquía visual clara.
- Las tarjetas individuales pueden ocupar toda la fila innecesariamente.
- El contenido se ve correcto, pero poco definido y visualmente borroso.

El resultado debe conservar el estilo oscuro profesional del proyecto, pero hacerlo más limpio, nítido, legible y coherente.

---

# 2. REGLA PRINCIPAL

## NO MODIFICAR LA LÓGICA ESTADÍSTICA

Está prohibido cambiar:

- Cálculo de distancias.
- Cálculo de atrasos.
- Clasificación `WIN`.
- Clasificación `WIN-WIN(n)`.
- Umbral de distancia `<= 5`.
- Cálculo de `hits`.
- Cálculo del esperado matemático.
- Ventana de análisis.
- Números asociados a apuestas.
- Definición de docenas, columnas, seisenas, plenos o sectores.
- Estado lógico `isActive`.
- Persistencia de zoom.
- Persistencia del orden de widgets.
- Persistencia del tamaño del panel.
- Flujo de actualización.
- Drag and drop existente.
- Nombres y datos expuestos por las tarjetas.

La misión es exclusivamente:

```text
Refactor visual + mejora de CSS + ajustes mínimos de HTML necesarios para claridad.
```

No reescribas el motor estadístico ni cambies resultados.

---

# 3. METODOLOGÍA OBLIGATORIA

Antes de modificar cualquier archivo:

1. Inspecciona la estructura completa del proyecto.
2. Identifica los archivos exactos responsables de:
   - Renderizado de `St_win`.
   - HTML de tarjetas.
   - CSS de tarjetas.
   - CSS global.
   - Zoom del módulo.
   - Grid o layout.
   - Leyenda Win-Win.
   - Barras de hits versus esperado.
3. Busca duplicaciones de estilos.
4. Identifica estilos inline generados desde JavaScript.
5. Detecta selectores CSS globales que puedan afectar otros módulos.
6. Comprueba si existe un sistema de variables CSS.
7. Comprueba si el proyecto utiliza:
   - CSS plano.
   - CSS generado desde JavaScript.
   - Plantillas HTML.
   - Componentes.
   - Tailwind.
   - Sass.
   - Estilos inline.
8. Haz una copia o registra el estado inicial con Git antes de modificar.
9. No inventes rutas ni nombres de archivos.
10. Trabaja solamente sobre archivos que existan realmente.

Empieza ejecutando comandos similares a:

```bash
cd /home/shared/lab_vito

pwd
git status --short
find . -maxdepth 3 -type f | sort | sed -n '1,240p'

grep -RniE \
  "stWin|st_win|StWin|renderStWinTab|metricCardHtml|WIN-WIN|RACHA ACTIVA|DISTANCIAS|ESP " \
  . \
  --exclude-dir=node_modules \
  --exclude-dir=.git
```

Si el proyecto tiene muchos archivos, limita la búsqueda a los directorios reales de fuente.

---

# 4. RESULTADO VISUAL ESPERADO

La interfaz final debe conservar:

- Tema oscuro.
- Identidad visual de Roulette Tracker.
- Colores funcionales de niveles Win-Win.
- Tarjetas compactas.
- Información estadística completa.
- Zoom configurable.
- Ordenamiento de bloques.
- Diseño responsive.

Pero debe mejorar claramente:

- Contraste.
- Separación entre capas.
- Tipografía.
- Espaciado.
- Legibilidad.
- Consistencia.
- Nitidez.
- Jerarquía visual.
- Accesibilidad.
- Comportamiento responsive.

---

# 5. SISTEMA DE CAPAS VISUALES

Debes establecer una diferenciación clara entre:

1. Fondo de la página.
2. Contenedor principal.
3. Sección estadística.
4. Tarjeta individual.
5. Elementos destacados dentro de la tarjeta.

Usa variables CSS o adapta las existentes.

Referencia conceptual:

```css
:root {
  --stwin-bg-page: #090d14;
  --stwin-bg-panel: #101827;
  --stwin-bg-section: #172235;
  --stwin-bg-card: #202c3d;
  --stwin-bg-card-hover: #263449;

  --stwin-text-primary: #f8fafc;
  --stwin-text-secondary: #cbd5e1;
  --stwin-text-muted: #94a3b8;

  --stwin-border-soft: rgba(148, 163, 184, 0.28);
  --stwin-border-strong: rgba(148, 163, 184, 0.45);

  --stwin-green: #10b981;
  --stwin-blue: #0ea5e9;
  --stwin-amber: #f59e0b;
  --stwin-red: #ef4444;
  --stwin-yellow: #facc15;
}
```

No copies estos valores ciegamente si el proyecto ya tiene una paleta coherente.

Primero inspecciona las variables existentes y reutilízalas cuando sea razonable.

La prioridad es:

```text
consistencia con el proyecto > copiar valores exactos del ejemplo
```

---

# 6. MEJORA DE TARJETAS

Cada tarjeta debe quedar visualmente definida.

Aplicar criterios similares a:

```css
.stwin-card {
  background: var(--stwin-bg-card);
  border: 1px solid var(--stwin-border-soft);
  border-radius: 10px;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 8px 20px rgba(0, 0, 0, 0.18);
}
```

Para tarjetas activas:

```css
.stwin-card.is-active {
  border-color: rgba(16, 185, 129, 0.72);
  box-shadow:
    0 0 0 1px rgba(16, 185, 129, 0.10),
    0 8px 20px rgba(0, 0, 0, 0.25);
}
```

Evita brillos excesivos.

No uses sombras difusas grandes alrededor de todas las tarjetas.

La tarjeta debe verse definida por:

- Fondo.
- Borde.
- Espaciado.
- Jerarquía interna.

No debe depender de un glow fuerte.

---

# 7. TIPOGRAFÍA Y LEGIBILIDAD

No debe existir texto funcional crítico inferior a `10px`.

Escala orientativa:

```css
.stwin-card-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.stwin-card-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.stwin-card-meta {
  font-size: 11px;
  font-weight: 600;
}

.stwin-card-status {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.03em;
}
```

Cuando el zoom disminuya, no permitas que el texto se vuelva ilegible.

Revisa si el zoom se implementa usando:

```css
transform: scale(...)
```

o mediante:

```css
zoom: ...
```

Si el escalado actual provoca desenfoque, considera una solución más nítida basada en:

- Tamaños CSS calculados.
- Variables.
- `rem`.
- `clamp()`.
- Ajuste del grid.
- Densidad configurable.

No elimines el control de zoom.

No rompas su persistencia.

Si cambiar la estrategia de zoom implica demasiado riesgo, conserva la implementación y mejora la base tipográfica para minimizar el desenfoque.

Documenta la decisión.

---

# 8. BADGES DE NIVEL WIN-WIN

Los indicadores:

```text
WIN
WW1
WW2
WW3
WW4
WW5+
```

deben conservar sus colores semánticos:

```text
WIN            azul
WIN-WIN(1-2)   verde
WIN-WIN(3-4)   ámbar
WIN-WIN(5+)    rojo
Inactivo       gris
```

Pero reduce el brillo.

Referencia:

```css
.stwin-level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  min-width: 34px;
  height: 34px;
  padding: 0 7px;

  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);

  font-size: 10px;
  font-weight: 800;
  line-height: 1;

  box-shadow: none;
}
```

Permite un glow moderado solamente para niveles excepcionales:

```css
.level-ww-high {
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.30);
}
```

No uses sombras intensas para todos los niveles.

---

# 9. HITS Y ATRASO

Los indicadores:

```text
🎯 hits
⌛ atraso
```

deben ser legibles y consistentes.

Referencia:

```css
.stwin-stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  min-height: 23px;
  padding: 3px 7px;

  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;

  box-shadow: none;
}
```

Requisitos:

- No usar colores arbitrarios.
- El color debe tener un significado consistente.
- No pintar el atraso en rojo salvo que represente un umbral de alerta.
- Asegurar suficiente contraste.
- Mantener los iconos existentes.
- Mantener los valores existentes.

---

# 10. DISTANCIAS

Las cajas de distancias deben ser más legibles y uniformes.

Referencia:

```css
.stwin-distance {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 22px;
  height: 22px;
  padding: 0 5px;

  border-radius: 5px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}
```

Estados:

```css
.stwin-distance.is-short {
  background: #16a34a;
  color: #f0fdf4;
}

.stwin-distance.is-long {
  background: #dc2626;
  color: #fff1f2;
}
```

Mantener exactamente la lógica:

```text
verde: distancia <= 5
rojo: distancia > 5
```

Agregar separación consistente:

```css
.stwin-distances {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
```

No modificar el orden de las distancias.

No modificar la cantidad mostrada, salvo que ya exista un criterio responsive implementado.

---

# 11. ESTADOS TEXTUALES

Los estados como:

```text
RACHA MÍNIMA
RACHA ACTIVA
RACHA EXTREMA
INACTIVO
```

deben conservar su lógica actual.

Solo mejorar:

- Contraste.
- Tamaño.
- Alineación.
- Espaciado.
- Consistencia cromática.

Evitar texto rojo intenso sobre fondos de contraste insuficiente.

Considerar:

```css
.stwin-status {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

---

# 12. BARRA DE HITS VS. ESPERADO

La barra inferior debe hacerse más clara.

Debe conservar:

- Hits reales.
- Marcador de esperado.
- Proporción existente.
- Cálculo actual.

Mejoras requeridas:

```css
.stwin-progress {
  position: relative;
  height: 7px;
  border-radius: 999px;
  background: #334155;
  overflow: visible;
}
```

El relleno:

```css
.stwin-progress-fill {
  height: 100%;
  border-radius: inherit;
}
```

La marca del esperado:

```css
.stwin-progress-expected {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  background: #facc15;
  box-shadow: 0 0 4px rgba(250, 204, 21, 0.55);
}
```

Asegurar que:

- La línea de esperado se vea claramente.
- El relleno no tape el marcador.
- La barra no quede demasiado fina.
- La barra no desborde la tarjeta.
- Los valores extremos no rompan el layout.

Mantener etiquetas:

```text
21 HITS
ESP 15.8
```

Opcionalmente, si no altera demasiado el diseño, mostrar una diferencia legible:

```text
21 observados · 15.8 esperados · +5.2
```

Pero no agregues esta información si requiere modificar la lógica o genera ruido excesivo.

---

# 13. GRID Y DISTRIBUCIÓN

El layout debe usar una cuadrícula uniforme.

Referencia:

```css
.stwin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}
```

Requisitos:

- Evitar que una tarjeta individual ocupe toda una fila sin necesidad.
- Corregir reglas como:

```css
grid-column: 1 / -1;
```

si están aplicadas indebidamente a tarjetas como `Pasa (19-36)`.

Las seis suertes sencillas deberían distribuirse de forma estable.

Ejemplos aceptables en escritorio:

```text
Rojo | Negro | Par
Impar | Falta | Pasa
```

o, si el ancho lo permite:

```text
Rojo | Negro | Par | Impar | Falta | Pasa
```

El layout debe adaptarse según ancho real, no mediante tamaños rígidos.

Responsive mínimo esperado:

```css
@media (max-width: 900px) {
  .stwin-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .stwin-grid {
    grid-template-columns: 1fr;
  }
}
```

Adapta estos puntos de corte al proyecto real.

---

# 14. REDUCIR CONTENEDORES ANIDADOS

Actualmente puede haber demasiadas capas visuales:

```text
panel
  sección
    cabecera
      subsección
        tarjeta
```

Revisa si alguna capa puede simplificarse sin eliminar estructura funcional.

Por ejemplo, el encabezado:

```text
NIVEL DE RACHA CORTA
```

puede convertirse en una línea de sección más limpia:

```css
.stwin-subsection-header {
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 0;
}
```

No elimines información.

Solo reduce la sensación de “cajas dentro de cajas”.

---

# 15. LEYENDA

La leyenda debe seguir mostrando:

```text
WIN
WIN-WIN(1-2)
WIN-WIN(3-4)
WIN-WIN(5+)
Inactivo
Distancias <= 5 = racha
```

Mejorar:

- Separación.
- Alineación.
- Contraste.
- Tamaño.
- Responsive.
- Consistencia de círculos y colores.

La leyenda no debe ocupar más espacio del necesario.

Debe poder envolver sus elementos correctamente en pantallas pequeñas.

---

# 16. ACCESIBILIDAD

Aplicar criterios básicos:

- Contraste suficiente.
- No depender únicamente del color.
- Mantener textos `WIN`, `WW`, estado y valores.
- Añadir `title` o `aria-label` cuando los iconos no sean claros.
- Mantener foco visible en controles interactivos.
- No eliminar navegación mediante teclado.
- No usar opacidades extremadamente bajas para textos funcionales.
- Respetar `prefers-reduced-motion`.

Ejemplo:

```css
@media (prefers-reduced-motion: reduce) {
  .stwin-card,
  .stwin-level-badge,
  .stwin-progress-fill {
    transition: none !important;
    animation: none !important;
  }
}
```

---

# 17. ANIMACIONES

Evita animaciones excesivas.

Si existen pulsos o glows continuos:

- Reducirlos.
- Mantenerlos solo en eventos realmente importantes.
- Asegurar que no afecten la nitidez.
- Respetar `prefers-reduced-motion`.

No agregues nuevas animaciones decorativas.

---

# 18. AISLAMIENTO DE ESTILOS

Todos los cambios deben estar limitados al módulo `St_win`.

Preferir selectores bajo un contenedor raíz, por ejemplo:

```css
#st-win-panel .metric-card {
  ...
}
```

o:

```css
.stwin-root .metric-card {
  ...
}
```

No modificar clases globales genéricas como:

```css
.card
.panel
.badge
.progress
.grid
```

sin comprobar antes si afectan otros módulos.

No deteriorar:

- Tomador.
- Atrasos.
- Lab_Con.
- Ajustes_vito.
- Navegación.
- Cabecera.
- Otros dashboards.

Si existen clases genéricas compartidas, crear clases específicas para `St_win`.

---

# 19. CONSERVAR FUNCIONALIDADES

Después del cambio deben seguir funcionando:

- Botón `Actualizar`.
- Control de zoom.
- Valor porcentual del zoom.
- Persistencia del zoom.
- Restablecer orden.
- Drag and drop.
- Orden de widgets.
- Tamaño del panel.
- Cambio de ventana de giros.
- Renderizado de todas las apuestas.
- Paneles de suertes sencillas.
- Docenas.
- Columnas.
- Seisenas.
- Plenos.
- Series y sectores.
- Estados activos e inactivos.
- Barras de hits versus esperado.
- Leyenda.
- Responsive.

---

# 20. CONTROL DE CALIDAD

Antes de finalizar, realiza las siguientes comprobaciones.

## 20.1 Sintaxis

Ejecuta los comandos disponibles en el proyecto:

```bash
npm test
npm run lint
npm run check
npm run build
npm run check:architecture
```

No asumas que todos existen.

Primero inspecciona:

```bash
cat package.json
```

Ejecuta solo scripts reales.

Si no existe `package.json`, identifica el mecanismo correcto de validación.

## 20.2 JavaScript

Comprueba:

- Sin errores de sintaxis.
- Sin variables no definidas.
- Sin selectores rotos.
- Sin HTML mal cerrado.
- Sin cambios en cálculos.
- Sin regresiones en eventos.
- Sin duplicación de listeners.
- Sin pérdida del drag and drop.
- Sin pérdida de persistencia.

## 20.3 CSS

Comprueba:

- Sin reglas globales peligrosas.
- Sin `!important` innecesarios.
- Sin desbordamientos horizontales.
- Sin texto cortado.
- Sin barras fuera de las tarjetas.
- Sin badges superpuestos.
- Sin tarjetas que colapsen.
- Sin pérdida de contraste.
- Sin glows excesivos.
- Sin tamaños menores de 10 px en información importante.

## 20.4 Responsive

Validar al menos conceptualmente:

```text
1366 px
1024 px
768 px
480 px
```

Si hay herramientas disponibles, usa capturas o inspección automatizada.

## 20.5 Zoom

Validar al menos:

```text
80 %
100 %
106 %
124 %
```

Asegurar que:

- No desaparezcan textos.
- No se superpongan datos.
- No se deformen las tarjetas.
- El grid siga siendo usable.

---

# 21. COMPARACIÓN ANTES Y DESPUÉS

Debes registrar qué cambió.

Incluye una tabla en el informe:

| Área | Antes | Después |
|---|---|---|
| Contraste | Capas visuales similares | Capas diferenciadas |
| Bordes | Tenues | Claros y moderados |
| Texto | Pequeño y opaco | Más legible |
| Glow | Excesivo | Reducido |
| Distancias | Pequeñas | Más nítidas |
| Barra | Muy fina | Más visible |
| Grid | Anchos inconsistentes | Distribución uniforme |
| Responsive | Riesgo de desborde | Adaptativo |
| Accesibilidad | Limitada | Mejorada |

No inventes resultados.

Describe solamente lo que realmente hayas implementado.

---

# 22. GIT Y SEGURIDAD

Antes de modificar:

```bash
git status --short
git branch --show-current
git rev-parse --short HEAD
```

No borres cambios existentes del usuario.

No ejecutes:

```bash
git reset --hard
git clean -fd
git checkout -- .
```

No sobrescribas trabajo ajeno.

Si el árbol está sucio:

- Continúa con precaución.
- Identifica qué archivos ya estaban modificados.
- No reviertas esos cambios.
- Documenta el estado inicial.

Genera un diff final:

```bash
git diff --stat
git diff -- <archivos_modificados>
```

No hagas `push`.

No hagas `merge`.

No hagas `rebase`.

No crees un commit salvo que se solicite expresamente.

---

# 23. ARCHIVOS DE INFORME

Crear un informe final en:

```text
reports/STWIN_VISUAL_CLARITY_REFACTOR_2026-07-27.md
```

Si la carpeta no existe, créala.

El informe debe contener:

```markdown
# Refactor visual St_win

## 1. Resumen ejecutivo

## 2. Problemas detectados

## 3. Archivos inspeccionados

## 4. Archivos modificados

## 5. Cambios implementados

## 6. Decisiones de diseño

## 7. Lógica preservada

## 8. Responsive

## 9. Accesibilidad

## 10. Validaciones ejecutadas

## 11. Resultado de pruebas

## 12. Riesgos o pendientes

## 13. Diff resumido

## 14. Recomendaciones futuras
```

No declares pruebas exitosas si no se ejecutaron.

Usa estados claros:

```text
PASS
FAIL
NO DISPONIBLE
NO EJECUTADO
```

---

# 24. ENTREGABLES OBLIGATORIOS

Al finalizar, entregar:

1. Código modificado.
2. CSS mejorado y aislado.
3. HTML ajustado solo si era necesario.
4. Lógica estadística intacta.
5. Informe:

```text
reports/STWIN_VISUAL_CLARITY_REFACTOR_2026-07-27.md
```

6. Resumen de archivos modificados.
7. Resultado de pruebas.
8. Diff resumido.
9. Riesgos pendientes.
10. Instrucciones para revisar manualmente.

---

# 25. CRITERIOS DE ACEPTACIÓN

La tarea se considera completa solamente si:

- La pestaña `St_win` se ve claramente más nítida.
- Las tarjetas se distinguen del fondo.
- Los textos son legibles.
- Los bordes son visibles sin ser agresivos.
- Los glows se redujeron.
- Los badges tienen jerarquía consistente.
- Las distancias se leen fácilmente.
- La barra de hits versus esperado es clara.
- El marcador esperado se distingue.
- Las tarjetas usan un grid uniforme.
- `Pasa (19-36)` no ocupa toda la fila sin justificación.
- El diseño sigue siendo responsive.
- El zoom sigue funcionando.
- El orden de widgets sigue funcionando.
- El drag and drop sigue funcionando.
- La lógica estadística no cambió.
- No se afectaron otros módulos.
- No existen errores de sintaxis.
- Se generó el informe solicitado.

---

# 26. RESTRICCIONES

No debes:

- Rediseñar toda la aplicación.
- Cambiar navegación.
- Cambiar nombres de apuestas.
- Cambiar lógica de negocio.
- Cambiar fórmulas.
- Cambiar resultados estadísticos.
- Introducir frameworks nuevos.
- Agregar dependencias sin necesidad.
- Reescribir todo el renderer.
- Eliminar funcionalidades.
- Romper compatibilidad.
- Usar colores excesivamente brillantes.
- Agregar animaciones innecesarias.
- Aplicar estilos globales peligrosos.
- Ocultar información para simplificar.
- Hacer commits o push sin autorización.

---

# 27. ORDEN DE EJECUCIÓN

Sigue exactamente este orden:

```text
1. Inspeccionar proyecto.
2. Revisar estado Git.
3. Localizar archivos de St_win.
4. Comprender HTML y CSS actual.
5. Identificar selectores globales.
6. Crear plan breve de cambios.
7. Aplicar refactor visual mínimo y controlado.
8. Revisar layout.
9. Revisar zoom.
10. Revisar responsive.
11. Ejecutar validaciones disponibles.
12. Revisar diff.
13. Crear informe.
14. Mostrar resumen final.
```

---

# 28. FORMATO DE RESPUESTA FINAL

Al terminar, responde exactamente con esta estructura:

```markdown
# Implementación finalizada: nitidez visual St_win

## Estado
PASS / PARCIAL / FAIL

## Archivos modificados
- ruta
- ruta

## Cambios principales
- ...
- ...
- ...

## Lógica preservada
- Cálculo de distancias: intacto
- Cálculo de atraso: intacto
- Clasificación Win-Win: intacta
- Hits y esperado: intactos
- Persistencia: intacta

## Validaciones
| Validación | Resultado |
|---|---|
| Sintaxis | PASS/FAIL |
| Tests | PASS/FAIL/NO DISPONIBLE |
| Build | PASS/FAIL/NO DISPONIBLE |
| Responsive | PASS/PARCIAL |
| Zoom | PASS/PARCIAL |
| Otros módulos | PASS/PARCIAL |

## Informe generado
`reports/STWIN_VISUAL_CLARITY_REFACTOR_2026-07-27.md`

## Riesgos o pendientes
- ...

## Revisión manual recomendada
1. Abrir `http://localhost:3000`.
2. Ir a `St_win`.
3. Probar zoom 80 %, 100 %, 106 % y 124 %.
4. Probar botón Actualizar.
5. Reordenar widgets.
6. Restablecer orden.
7. Revisar Suertes Sencillas, Docenas, Columnas, Seisenas, Plenos y Series.
```

---

# INSTRUCCIÓN FINAL

Ejecuta la tarea completa.

No te limites a recomendar cambios.

Inspecciona el código real, implementa las mejoras, valida el resultado y genera el informe.

Prioriza cambios mínimos, seguros, mantenibles y claramente visibles.

La lógica existente funciona y debe preservarse exactamente.
