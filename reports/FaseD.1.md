# PROMPT DE IMPLEMENTACIÓN

# Fase D.1 — Laboratory Comparison Workspace

## Proyecto

**Roulette Tracker**

## Contexto oficial

El proyecto ha cerrado arquitectónicamente el **Bloque C — Laboratory Experience**.

La infraestructura visual, la navegación, la gestión de estado, la capa de enlace de aplicación y las primeras vistas funcionales del módulo `Laboratory` ya fueron implementadas y validadas.

Las vistas actualmente funcionales son:

* `Overview`
* `Experiments`
* `Sessions`

La vista `Comparison` existe actualmente como placeholder o implementación incompleta y debe convertirse en el siguiente workspace funcional del módulo Laboratory.

Esta fase corresponde a:

> **Bloque D — Laboratory Functional Expansion**
> **Fase D.1 — Comparison Workspace**

---

# 1. Rol del agente

Actúa como:

* Arquitecto principal de software.
* Ingeniero senior TypeScript/JavaScript.
* Especialista en arquitectura limpia.
* Especialista en UI desacoplada del dominio.
* Revisor de contratos y compatibilidad.
* Responsable de implementación y certificación técnica.

No debes limitarte a generar código.

Antes de modificar cualquier archivo debes:

1. Inspeccionar el repositorio.
2. Identificar la arquitectura real.
3. Localizar los componentes actuales del Laboratory.
4. Examinar la implementación de `Overview`, `Experiments` y `Sessions`.
5. Identificar los patrones ya certificados.
6. Localizar el placeholder actual de `Comparison`.
7. Localizar los contratos, comandos, ViewModels y métodos disponibles.
8. Determinar qué capacidades reales ya existen para comparar experimentos o sesiones.
9. Detectar cualquier brecha entre la UI requerida y la capa Application existente.
10. Diseñar la mínima ampliación necesaria sin alterar la arquitectura certificada.

No inventes rutas, archivos, tipos, métodos, contratos o estructuras.

Debes utilizar los nombres y patrones reales encontrados en el repositorio.

---

# 2. Objetivo principal

Implementar completamente el **Comparison Workspace** del módulo Laboratory para permitir la comparación funcional de experimentos y sesiones mediante datos reales obtenidos desde la arquitectura existente.

La solución debe permitir, como mínimo:

* Seleccionar elementos comparables.
* Comparar dos o más experimentos, cuando la arquitectura y los datos reales lo permitan.
* Comparar dos o más sesiones, cuando la arquitectura y los datos reales lo permitan.
* Visualizar diferencias y similitudes relevantes.
* Mostrar métricas disponibles mediante ViewModels.
* Gestionar estados vacíos.
* Gestionar estados de carga.
* Gestionar errores.
* Gestionar selecciones inválidas o insuficientes.
* Integrarse con la navegación y el estado existente del Laboratory.
* Mantener compatibilidad con el shell histórico.

La implementación debe utilizar exclusivamente datos reales proporcionados por la capa Application.

Queda prohibido simular información estadística o introducir datos falsos para aparentar funcionalidad.

---

# 3. Arquitectura obligatoria

Debe conservarse estrictamente el siguiente flujo:

```text
Domain
   │
Application
   │
LaboratoryOrchestrator
   │
LaboratoryBindingLayer
   │
ViewModels
   │
Laboratory UI
   │
Laboratory Shell
   │
Comparison Workspace
```

La UI no puede acceder directamente a:

* Entidades del dominio.
* Repositorios.
* Motores estadísticos.
* Casos de uso internos.
* Servicios concretos de infraestructura.
* Bases de datos.
* Adaptadores.
* Objetos internos del Application Layer.

Todo acceso desde la UI debe realizarse mediante:

* `LaboratoryBindingLayer`
* comandos públicos de la Binding Layer
* estado público de UI
* `ViewModels`

---

# 4. Decisiones arquitectónicas inmutables

Las siguientes decisiones están certificadas y no deben modificarse:

1. Separación estricta entre UI y dominio.
2. Uso obligatorio de `LaboratoryBindingLayer` como punto de integración.
3. Consumo exclusivo de `ViewModels` desde la interfaz.
4. Uso de `LaboratoryOrchestrator` como coordinador de Application.
5. Reutilización del sistema visual existente.
6. Compatibilidad completa con el shell histórico.
7. Desarrollo incremental mediante fases certificadas.
8. Conservación de los contratos públicos existentes.
9. Conservación del sistema de navegación actual.
10. Conservación de los renderers históricos.
11. Conservación del bootstrap existente, salvo una extensión mínima y compatible.
12. Prohibición de introducir dependencias directas desde UI hacia Domain.

Si una funcionalidad parece requerir modificar alguna de estas decisiones, detén esa modificación y busca una solución compatible dentro de la arquitectura existente.

---

# 5. Alcance funcional de D.1

## 5.1 Auditoría inicial obligatoria

Antes de implementar, identifica y documenta:

* Ubicación del módulo `Laboratory`.
* Componente raíz del workspace.
* Sistema actual de navegación.
* Estado local y estado persistido de la interfaz.
* Implementación actual de la vista `Comparison`.
* Implementación de `Overview`.
* Implementación de `Experiments`.
* Implementación de `Sessions`.
* `LaboratoryBindingLayer`.
* `LaboratoryOrchestrator`.
* ViewModels existentes.
* Comandos existentes.
* Tipos públicos de Application.
* Fuentes de datos disponibles para experimentos.
* Fuentes de datos disponibles para sesiones.
* Métricas reales disponibles.
* Sistema de errores.
* Sistema de loading.
* Sistema de overlays.
* Sistema visual reutilizable.
* Convenciones de testing.
* Scripts disponibles en `package.json`.
* Reglas de lint.
* Reglas arquitectónicas.
* Pruebas antiacoplamiento o anti-legacy.

No empieces a modificar código hasta completar esta auditoría.

---

## 5.2 Selección de elementos

Implementa un mecanismo de selección compatible con la UI existente.

Debe contemplar:

* Selección de experimentos.
* Selección de sesiones.
* Distinción clara entre tipos de elementos.
* Prevención de comparaciones incompatibles.
* Selección mínima requerida.
* Límite máximo razonable, solamente si el diseño existente lo exige.
* Eliminación individual de selecciones.
* Limpieza completa de la selección.
* Persistencia local únicamente si el patrón actual de UI ya lo permite.
* Navegación por teclado.
* Etiquetas accesibles.

No mezcles experimentos con sesiones en una misma comparación, salvo que exista un contrato explícito en el repositorio que lo permita.

---

## 5.3 Modelo de comparación

La comparación debe construirse a partir de ViewModels específicos.

Evalúa si ya existen tipos suficientes.

Si no existen, crea la mínima extensión compatible, siguiendo este flujo:

```text
Domain/Application data
        │
LaboratoryOrchestrator
        │
LaboratoryBindingLayer
        │
Comparison ViewModel
        │
Comparison Workspace
```

Un posible modelo conceptual, que debe adaptarse a la arquitectura real, puede incluir:

```ts
interface LaboratoryComparisonViewModel {
  comparisonType: 'experiments' | 'sessions';
  items: ComparisonItemViewModel[];
  metrics: ComparisonMetricViewModel[];
  summary?: ComparisonSummaryViewModel;
  status: ComparisonStatusViewModel;
}
```

Esto es solamente una referencia conceptual.

No copies este contrato si contradice las convenciones actuales.

Usa nombres, patrones de tipos, inmutabilidad y estructuras consistentes con el repositorio.

---

## 5.4 Métricas

Muestra únicamente métricas reales disponibles en el sistema.

Ejemplos posibles, sujetos a disponibilidad real:

* Identificador.
* Nombre.
* Estado.
* Fecha de creación.
* Fecha de ejecución.
* Duración.
* Número de observaciones.
* Número de resultados.
* Estado de finalización.
* Configuración utilizada.
* Motor o estrategia ejecutada.
* Métricas estadísticas producidas.
* Evidencias asociadas.
* Errores registrados.
* Versión.
* Etiquetas.
* Metadatos.

No inventes métricas.

Si una métrica no está disponible mediante Application o ViewModels, no debe mostrarse como dato funcional.

Cuando una métrica no aplique a un elemento, utiliza un estado visual explícito como:

* No disponible.
* No aplica.
* Sin datos.

No utilices valores falsos como `0`, cadenas vacías o datos aleatorios para ocultar ausencia de información.

---

## 5.5 Presentación visual

El workspace debe reutilizar el sistema visual existente.

Debe incluir, cuando sea compatible con el diseño actual:

* Encabezado del workspace.
* Descripción breve.
* Selector de tipo de comparación.
* Selector de elementos.
* Área de elementos seleccionados.
* Tabla o matriz comparativa.
* Resumen de diferencias.
* Indicadores de estado.
* Acciones de limpiar o reiniciar.
* Estados vacíos.
* Estado de carga.
* Estado de error.
* Responsive.
* Accesibilidad.

No agregues una nueva librería de componentes si el proyecto ya dispone de componentes reutilizables suficientes.

No introduzcas un lenguaje visual distinto al del resto del Laboratory.

---

## 5.6 Tabla o matriz comparativa

Implementa una presentación que permita comparar claramente los elementos seleccionados.

La estructura recomendada es:

```text
Métrica        Elemento A        Elemento B        Elemento C
----------------------------------------------------------------
Estado         completed         failed            running
Duración       12.4 s            8.1 s             —
Resultados     128               95                —
```

La orientación exacta debe adaptarse a:

* El número de elementos.
* El diseño actual.
* El comportamiento responsive.
* Los componentes existentes.
* La accesibilidad.

Debe evitarse:

* Duplicación de métricas.
* Desbordamiento sin control.
* Tablas inaccesibles.
* Dependencia de color como único indicador.
* Renderizados excesivos.
* Cálculos pesados durante cada render.

Si existen muchas métricas, agrúpalas por secciones o categorías.

---

## 5.7 Diferencias y similitudes

Cuando los datos disponibles lo permitan, destaca:

* Valores iguales.
* Valores diferentes.
* Valores ausentes.
* Diferencias numéricas.
* Diferencias porcentuales, solamente cuando sean matemáticamente válidas.
* Estados incompatibles.
* Configuraciones distintas.
* Fechas o duraciones diferentes.

Toda lógica de transformación debe ubicarse en:

* ViewModels.
* Binding Layer.
* Helpers de presentación puros.

No coloques lógica de negocio ni interpretación del dominio directamente en los componentes visuales.

---

# 6. Estados obligatorios

## 6.1 Estado inicial

Cuando no haya elementos seleccionados, mostrar:

* Propósito de la vista.
* Instrucción clara.
* Acción para comenzar.
* Sin errores de consola.
* Sin llamadas innecesarias.

## 6.2 Selección insuficiente

Cuando exista solamente un elemento seleccionado, indicar que se requiere al menos otro elemento compatible.

## 6.3 Carga

Durante la obtención o construcción de datos:

* Mostrar loading consistente con el sistema existente.
* Evitar parpadeos innecesarios.
* Evitar duplicar solicitudes.
* Evitar bloquear toda la aplicación si solo carga el workspace.

## 6.4 Sin datos

Cuando los elementos sean válidos pero no existan métricas comparables:

* Mostrar un estado vacío explicativo.
* No mostrar tablas falsas.
* No generar datos sintéticos.

## 6.5 Error

Los errores deben:

* Centralizarse según el patrón existente.
* Llegar a la UI en forma desacoplada.
* Mostrar un mensaje comprensible.
* Preservar detalles técnicos en logging, cuando el sistema ya lo contemple.
* Permitir reintento cuando corresponda.
* No exponer información sensible.

## 6.6 Comparación funcional

Cuando la selección y los datos sean válidos:

* Mostrar los elementos.
* Mostrar las métricas.
* Mostrar diferencias.
* Mantener interacción accesible.
* Mantener rendimiento razonable.

---

# 7. Integración con LaboratoryBindingLayer

La vista `Comparison` debe consumir exclusivamente una API pública de la Binding Layer.

Evalúa el patrón actual y crea, únicamente si es necesario, capacidades equivalentes a:

```ts
getComparisonState()
selectComparisonItem(...)
removeComparisonItem(...)
clearComparison(...)
setComparisonType(...)
loadComparison(...)
retryComparison(...)
```

Estos nombres son orientativos.

Debes respetar la nomenclatura y los patrones reales del código.

La Binding Layer debe encargarse de:

* Exponer estado de comparación.
* Coordinar comandos.
* Transformar datos.
* Centralizar loading.
* Centralizar errores.
* Evitar que la UI conozca objetos internos.
* Mantener un contrato estable.
* Producir ViewModels listos para renderizar.

---

# 8. Integración con LaboratoryOrchestrator

El `LaboratoryOrchestrator` debe continuar actuando como coordinador de Application.

Solo amplíalo si la comparación requiere una operación que no está actualmente expuesta.

La ampliación debe ser:

* Mínima.
* Compatible.
* Tipada.
* Testeable.
* Sin lógica visual.
* Sin dependencias de componentes UI.
* Sin alterar casos de uso existentes.
* Sin duplicar acceso a repositorios.
* Sin saltarse Application.

Antes de agregar un nuevo método, comprueba si la operación ya existe con otro nombre o a través de un caso de uso actual.

---

# 9. Gestión de estado

Respeta el modelo de estado existente del Laboratory.

No agregues Redux, Zustand, MobX, XState u otra solución global salvo que ya forme parte del proyecto.

El estado de Comparison debe diferenciar claramente:

```text
idle
loading
ready
empty
insufficient-selection
error
```

Adapta estos estados a los tipos reales existentes.

Evita combinaciones imposibles, por ejemplo:

* `loading` y `ready` simultáneamente.
* Error con datos obsoletos sin indicación.
* Selección incompatible marcada como válida.
* Comparación activa sin elementos suficientes.

Prefiere estados discriminados o estructuras equivalentes si el repositorio ya utiliza ese patrón.

---

# 10. Accesibilidad

La implementación debe contemplar:

* Navegación por teclado.
* Focus visible.
* Orden lógico de tabulación.
* Etiquetas asociadas a controles.
* Nombres accesibles.
* Estados anunciables.
* Tablas con encabezados semánticos.
* Botones reales para acciones.
* No depender exclusivamente de color.
* Contraste consistente con el sistema existente.
* Soporte razonable para lectores de pantalla.

No uses elementos `div` clicables cuando corresponda un `button`, `input`, `select` o elemento semántico.

---

# 11. Responsive

La vista debe funcionar en:

* Escritorio.
* Tablet.
* Pantallas estrechas.

Considera:

* Scroll horizontal controlado para tablas.
* Encabezados visibles.
* Controles apilables.
* Selectores adaptables.
* Texto no truncado de manera destructiva.
* Sin desbordamientos globales.
* Sin romper el shell.
* Sin modificar la navegación histórica.

No implementes una experiencia móvil completamente distinta si no existe ese patrón en el proyecto.

---

# 12. Rendimiento

Evita:

* Transformaciones pesadas dentro del render.
* Solicitudes duplicadas.
* Suscripciones sin limpieza.
* Listeners acumulativos.
* Re-renderizados globales.
* Serializaciones repetidas.
* Comparaciones profundas innecesarias.
* Renderizar miles de filas sin estrategia.

Si el volumen real de métricas puede ser alto, prepara una solución razonable mediante:

* Agrupación.
* Renderizado progresivo.
* Memoización justificada.
* Paginación.
* Virtualización solo si ya existe una dependencia apropiada o es estrictamente necesaria.

No optimices prematuramente sin evidencia.

---

# 13. Manejo de datos incompletos

La vista debe tolerar:

* Experimentos sin resultados.
* Sesiones incompletas.
* Metadatos ausentes.
* Métricas opcionales.
* Fechas inválidas.
* Valores nulos.
* Elementos eliminados.
* Estados históricos desconocidos.
* Versiones antiguas de registros.

La transformación hacia ViewModels debe normalizar estos casos sin ocultar errores reales.

---

# 14. Prohibiciones

Está prohibido:

* Modificar motores estadísticos.
* Modificar algoritmos.
* Cambiar entidades del dominio sin necesidad demostrada.
* Acceder al dominio desde UI.
* Acceder a repositorios desde UI.
* Crear una segunda Binding Layer.
* Crear una segunda fuente de verdad.
* Duplicar lógica de `Experiments` o `Sessions`.
* Romper contratos públicos.
* Eliminar compatibilidad histórica.
* Reescribir el Laboratory completo.
* Cambiar el sistema de navegación.
* Agregar dependencias innecesarias.
* Introducir datos mock en producción.
* Ocultar errores con `try/catch` vacíos.
* Desactivar tests para aprobar la fase.
* Reducir cobertura sin justificación.
* Usar `any` para evitar modelado.
* Añadir comentarios falsos de “implementación futura” en lugar de funcionalidad.
* Realizar refactors masivos ajenos a D.1.
* Modificar configuraciones globales sin necesidad.
* Renombrar archivos públicos innecesariamente.

---

# 15. Estrategia de implementación

Ejecuta el trabajo en este orden:

## Paso 1 — Inspección

* Revisa estructura del repositorio.
* Revisa `package.json`.
* Revisa configuración TypeScript.
* Revisa componentes de Laboratory.
* Revisa Binding Layer.
* Revisa Orchestrator.
* Revisa tests.
* Revisa contratos.
* Revisa scripts de validación.
* Revisa estado git.

## Paso 2 — Informe de brechas

Documenta:

* Estado actual de Comparison.
* Capacidades disponibles.
* Capacidades faltantes.
* Riesgos.
* Archivos candidatos a modificación.
* Archivos que no deben tocarse.
* Plan mínimo.

## Paso 3 — Diseño

Define:

* Flujo de datos.
* Estado de comparación.
* ViewModels.
* Comandos.
* Interacciones.
* Componentes.
* Estados de error.
* Tests.

## Paso 4 — Implementación Application/Binding

Implementa primero:

* Extensiones mínimas del Orchestrator.
* Transformaciones.
* ViewModels.
* Estado.
* Comandos públicos.
* Manejo de errores.

## Paso 5 — Implementación UI

Implementa después:

* Selector.
* Selección.
* Matriz o tabla.
* Resumen.
* Estados.
* Responsive.
* Accesibilidad.

## Paso 6 — Tests

Agrega o actualiza:

* Tests unitarios.
* Tests de ViewModels.
* Tests de Binding Layer.
* Tests del Orchestrator si fue ampliado.
* Tests de componentes.
* Tests de interacción.
* Tests de errores.
* Tests de selección insuficiente.
* Tests de selección incompatible.
* Tests de accesibilidad cuando el stack lo permita.
* Tests de no acceso directo al dominio.

## Paso 7 — Validación

Ejecuta todos los comandos reales definidos por el repositorio.

Como mínimo, cuando existan:

```bash
npm test
npm run lint
npm run typecheck
npm run check:architecture
npm run build
```

También ejecuta:

* Tests específicos de Laboratory.
* Validaciones anti-legacy.
* Validaciones de dependencias.
* Validaciones de arquitectura.
* Detección de imports prohibidos.
* Tests de integración.

No inventes comandos que no estén definidos.

## Paso 8 — Documentación y cierre

Genera el informe final de fase.

---

# 16. Tests mínimos requeridos

La fase no puede considerarse terminada sin pruebas para los siguientes escenarios:

1. Comparison renderiza el estado inicial.
2. Se muestran experimentos disponibles.
3. Se muestran sesiones disponibles.
4. Puede seleccionarse un primer elemento.
5. Un solo elemento produce estado de selección insuficiente.
6. Puede seleccionarse un segundo elemento compatible.
7. Se genera una comparación real.
8. Puede eliminarse un elemento.
9. Puede limpiarse la selección.
10. Se impide o explica una selección incompatible.
11. Se muestran métricas ausentes correctamente.
12. Se muestra loading.
13. Se muestra empty.
14. Se muestra error.
15. Puede ejecutarse reintento cuando corresponda.
16. La UI consume ViewModels.
17. La UI no importa Domain.
18. La UI no importa repositorios.
19. La Binding Layer centraliza errores.
20. La navegación al workspace continúa funcionando.
21. El shell histórico no presenta regresiones.
22. `Overview` continúa funcionando.
23. `Experiments` continúa funcionando.
24. `Sessions` continúa funcionando.
25. El build finaliza correctamente.

Adapta los tests a las herramientas reales del proyecto.

---

# 17. Criterios de aceptación

La Fase D.1 se considera completada únicamente cuando:

* `Comparison` deja de ser placeholder.
* La vista utiliza datos reales.
* Es posible comparar elementos compatibles.
* La selección funciona.
* Las métricas provienen de ViewModels.
* La UI no accede al dominio.
* La Binding Layer es el único punto de integración.
* Los errores están centralizados.
* Los estados vacíos están implementados.
* El loading está implementado.
* La vista es responsive.
* La vista es accesible.
* Los tests pasan.
* El lint pasa.
* El typecheck pasa.
* La validación arquitectónica pasa.
* El build pasa.
* No existen regresiones en vistas ya certificadas.
* No se modificaron motores estadísticos.
* No se rompieron contratos públicos.
* No quedaron datos simulados en producción.
* No quedaron TODO críticos.
* Se generó el informe de cierre.

---

# 18. Entregables obligatorios

Genera los siguientes entregables.

## 18.1 Implementación

Código completo de la Fase D.1.

## 18.2 Tests

Todos los tests agregados o actualizados.

## 18.3 Informe técnico

Crear:

```text
reports/FASE_D1_COMPARISON_WORKSPACE_IMPLEMENTATION.md
```

El informe debe incluir:

1. Resumen ejecutivo.
2. Estado inicial encontrado.
3. Arquitectura respetada.
4. Flujo de datos implementado.
5. Archivos creados.
6. Archivos modificados.
7. ViewModels creados o ampliados.
8. Métodos de Binding Layer creados o ampliados.
9. Métodos de Orchestrator creados o ampliados.
10. Estados de UI.
11. Manejo de errores.
12. Accesibilidad.
13. Responsive.
14. Tests implementados.
15. Comandos ejecutados.
16. Resultados de test.
17. Resultado de lint.
18. Resultado de typecheck.
19. Resultado de validación arquitectónica.
20. Resultado de build.
21. Riesgos pendientes.
22. Deuda técnica.
23. Decisiones tomadas.
24. Evidencia de que no se modificó el dominio.
25. Recomendación para D.2.

## 18.4 Evidencia de validación

Incluir en el informe los resultados reales de los comandos ejecutados.

No declares éxito si un comando falló.

## 18.5 Punto de control

Crear:

```text
Fase_D1_cerrada.md
```

Solamente si todos los criterios de aceptación se cumplen.

Debe incluir:

* Proyecto.
* Fecha.
* Propósito.
* Estado inicial.
* Trabajo realizado.
* Arquitectura final.
* Componentes implementados.
* Contratos.
* Tests.
* Validaciones.
* Archivos modificados.
* Decisiones certificadas.
* Limitaciones.
* Próxima etapa.
* Estado final.

Si existen fallos importantes, crea en su lugar:

```text
Fase_D1_pendiente.md
```

Describe exactamente qué impide el cierre.

---

# 19. Control de cambios

Antes de modificar:

```bash
git status --short
git branch --show-current
git log -5 --oneline
```

Registra:

* Rama actual.
* Estado inicial.
* Archivos modificados previamente.
* Commit base.

No sobrescribas cambios ajenos.

No elimines archivos sin verificar su función.

Al finalizar, muestra:

```bash
git status --short
git diff --stat
git diff --check
```

No realices `git reset --hard`.

No realices `git clean -fd`.

No hagas `push`.

No fusiones ramas.

No modifiques historia de Git.

No crees commit salvo que se haya solicitado expresamente en el entorno de ejecución.

Puedes recomendar un mensaje de commit, por ejemplo:

```text
feat(laboratory): implement comparison workspace
```

---

# 20. Reglas de honestidad técnica

Debes diferenciar claramente entre:

* Implementado.
* Verificado.
* Inferido.
* No disponible.
* Pendiente.
* Fuera de alcance.

No declares:

* “Tests exitosos” sin ejecutar tests.
* “Build exitoso” sin ejecutar build.
* “Sin regresiones” sin validaciones.
* “Arquitectura preservada” sin revisar imports y dependencias.
* “Comparison completamente funcional” si utiliza mocks.
* “Fase cerrada” si quedan errores relevantes.

Si no puedes ejecutar un comando, explica:

* Qué comando no pudo ejecutarse.
* Por qué.
* Qué impacto tiene.
* Qué validación manual queda pendiente.

---

# 21. Condiciones de detención

Detén la implementación y documenta el bloqueo si ocurre alguno de estos casos:

* No existe una fuente real de experimentos o sesiones.
* La comparación exige modificar motores estadísticos.
* Los contratos requeridos no están disponibles.
* El repositorio no compila antes de los cambios.
* Existen cambios locales conflictivos.
* La arquitectura real contradice el punto de control.
* La única solución viable rompe compatibilidad pública.
* Los tests base ya están fallando y no puede determinarse la causa.
* Faltan archivos esenciales del proyecto.

En esos casos no inventes una solución.

Genera un informe de bloqueo con evidencia.

---

# 22. Fuera de alcance

No implementar en esta fase:

* Evidence Explorer.
* Replay Workspace.
* AI Research Workspace.
* Settings funcional.
* Refinamiento visual global.
* Rediseño completo del Laboratory.
* Nuevos motores estadísticos.
* Cambios de algoritmos.
* Nuevos modelos de dominio.
* Migraciones masivas.
* Integraciones externas de IA.
* Exportación avanzada.
* Visualizaciones estadísticas no sustentadas por datos existentes.
* Comparación entre tipos incompatibles sin contrato explícito.

Estos temas corresponden a fases posteriores.

---

# 23. Próxima fase esperada

Después del cierre correcto de D.1, la siguiente etapa recomendada será:

```text
D.2 — Evidence Explorer
```

No implementes D.2 durante este trabajo.

Puedes documentar dependencias o recomendaciones, pero no adelantar su implementación.

---

# 24. Instrucción final de ejecución

Realiza la Fase D.1 completa siguiendo este orden:

```text
AUDITAR
→ DOCUMENTAR BRECHAS
→ DISEÑAR
→ IMPLEMENTAR APPLICATION/BINDING
→ IMPLEMENTAR VIEWMODELS
→ IMPLEMENTAR UI
→ AGREGAR TESTS
→ VALIDAR
→ DOCUMENTAR
→ CERTIFICAR O DECLARAR PENDIENTE
```

Prioriza:

```text
CORRECCIÓN
→ COMPATIBILIDAD
→ ARQUITECTURA
→ TESTEABILIDAD
→ ACCESIBILIDAD
→ RENDIMIENTO
→ ESTÉTICA
```

No modifiques el dominio ni los motores estadísticos.

No reemplaces la arquitectura existente.

No generes una implementación paralela.

No finalices hasta haber entregado un resumen verificable con:

* Archivos modificados.
* Decisiones tomadas.
* Tests ejecutados.
* Resultados reales.
* Riesgos pendientes.
* Estado final de la fase.

Comienza ahora con la auditoría del repositorio.
