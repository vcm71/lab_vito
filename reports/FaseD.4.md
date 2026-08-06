# PROMPT DE EJECUCIÓN — FASE D.4

## AI Research Workspace

### Proyecto

**Roulette Tracker**

### Estado de origen obligatorio

El proyecto parte del punto de control:

**Fase_D3_cerrada — Laboratory Replay Workspace + D.3.5 Timeline Model & Event Bus**

La Fase D.3 y su extensión D.3.5 se consideran arquitectónicamente cerradas.

No deben rediseñarse ni reemplazarse las infraestructuras existentes.

---

# 1. Rol del agente

Actúa como:

* arquitecto principal de software;
* ingeniero senior TypeScript/JavaScript;
* especialista en arquitectura limpia;
* especialista en interfaces analíticas;
* especialista en sistemas de investigación asistida por IA;
* revisor de seguridad arquitectónica;
* responsable de pruebas y certificación técnica.

Debes analizar primero el repositorio real antes de modificarlo.

No asumas nombres de archivos, funciones, componentes, rutas, tipos o contratos que no hayas verificado directamente en el código.

Debes realizar una implementación incremental, compatible y auditable.

---

# 2. Objetivo principal

Implementar la:

# Fase D.4 — AI Research Workspace

El objetivo es incorporar un workspace funcional dentro del módulo `Laboratory` que permita realizar investigación asistida sobre experimentos, sesiones, eventos, comparaciones y evidencias existentes.

El workspace debe transformar el contexto consolidado de Laboratory en consultas de investigación estructuradas, trazables y reproducibles.

La nueva funcionalidad debe apoyarse exclusivamente en:

* `Timeline Model`;
* `Evidence Explorer`;
* `Comparison`;
* `Replay`;
* ViewModels públicos expuestos por `LaboratoryBindingLayer`.

El AI Research Workspace no debe reconstruir el contexto histórico leyendo directamente repositorios, entidades, eventos crudos o múltiples fuentes internas.

---

# 3. Restricciones arquitectónicas obligatorias

## 3.1 Arquitectura certificada

Debe mantenerse la siguiente dirección de dependencias:

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
```

La UI no puede acceder directamente a:

* entidades del dominio;
* repositorios;
* casos de uso;
* motores estadísticos;
* almacenamiento;
* servicios internos;
* eventos crudos no normalizados;
* implementaciones concretas del Orchestrator.

---

## 3.2 Único punto de integración

`LaboratoryBindingLayer` debe continuar siendo el único punto de integración entre la interfaz y la capa Application.

Toda nueva operación del AI Research Workspace debe exponerse mediante:

* ViewModels;
* comandos públicos;
* métodos públicos controlados;
* estados serializables;
* contratos tipados.

Está prohibido importar el dominio desde componentes de UI.

---

## 3.3 Fuente temporal oficial

`Timeline Model` es la única fuente temporal oficial de Laboratory.

El AI Research Workspace debe consumir el contexto cronológico mediante el Timeline ViewModel o mediante APIs públicas construidas sobre él.

Está prohibido:

* crear un segundo timeline;
* mantener una lista paralela de eventos;
* reconstruir el orden cronológico manualmente;
* consultar listas crudas de eventos recientes;
* duplicar filtros temporales;
* duplicar la lógica de selección temporal;
* implementar un Event Bus alternativo.

---

## 3.4 Estado del dominio

No modificar:

* motores estadísticos;
* entidades;
* value objects;
* algoritmos;
* repositorios;
* interfaces del dominio;
* casos de uso existentes;
* contratos públicos certificados.

La fase debe desarrollarse exclusivamente sobre:

* Application;
* `LaboratoryOrchestrator`;
* `LaboratoryBindingLayer`;
* ViewModels;
* UI;
* pruebas;
* documentación técnica.

Si una necesidad parece requerir cambios en Domain, detener esa modificación y resolverla mediante adaptación en Application o Binding Layer.

---

## 3.5 Compatibilidad

Debe preservarse:

* el shell histórico;
* la navegación actual;
* los workspaces existentes;
* el sistema visual vigente;
* las APIs públicas actuales;
* la selección de experimentos y sesiones;
* Comparison;
* Evidence Explorer;
* Replay;
* Timeline Model;
* las pruebas existentes.

No eliminar, renombrar ni alterar contratos públicos sin una justificación imprescindible y una capa de compatibilidad.

---

# 4. Alcance funcional

Implementar un workspace denominado conceptualmente:

```text
AI Research
```

El nombre final debe alinearse con las convenciones existentes del repositorio.

El workspace debe permitir como mínimo:

1. construir una consulta de investigación;
2. seleccionar el contexto que participará en la consulta;
3. generar una solicitud estructurada;
4. visualizar el contexto incluido;
5. ejecutar la investigación mediante una abstracción desacoplada;
6. presentar una respuesta estructurada;
7. mostrar las evidencias utilizadas;
8. relacionar resultados con eventos del Timeline;
9. conservar trazabilidad de la consulta;
10. gestionar estados de carga, error, vacío y éxito.

---

# 5. Principio central de la fase

La IA no debe recibir acceso irrestricto al estado interno de Laboratory.

Debe recibir un paquete de contexto explícito, limitado, serializable y auditable.

La secuencia esperada es:

```text
Timeline / Evidence / Comparison / Replay
                    │
                    ▼
         Research Context Builder
                    │
                    ▼
          Research Context ViewModel
                    │
                    ▼
           Research Request DTO
                    │
                    ▼
         Research Provider Interface
                    │
                    ▼
          Research Response DTO
                    │
                    ▼
     LaboratoryBindingLayer ViewModel
                    │
                    ▼
             AI Research UI
```

---

# 6. Modelo de contexto de investigación

Crear un modelo tipado y serializable para representar el contexto enviado a la investigación.

El diseño exacto debe adaptarse a las convenciones existentes, pero conceptualmente debe contemplar:

```ts
interface ResearchContextViewModel {
  scope: ResearchScopeViewModel;
  timeline: ResearchTimelineContextViewModel;
  evidence: ResearchEvidenceContextViewModel[];
  comparison?: ResearchComparisonContextViewModel;
  replay?: ResearchReplayContextViewModel;
  metadata: ResearchContextMetadataViewModel;
}
```

El contexto debe incluir únicamente información necesaria.

Debe evitarse incluir:

* objetos completos del dominio;
* referencias circulares;
* funciones;
* instancias de clases;
* repositorios;
* secretos;
* configuraciones sensibles;
* rutas internas innecesarias;
* datos no seleccionados por el usuario.

---

# 7. Alcance de investigación

Implementar un mecanismo explícito para definir el alcance de cada consulta.

Como mínimo, considerar:

* experimento actual;
* sesión actual;
* selección temporal;
* evento seleccionado;
* conjunto filtrado de eventos;
* evidencias seleccionadas;
* comparación activa;
* estado de Replay relevante.

El alcance debe representarse mediante un ViewModel o DTO estable.

Ejemplo conceptual:

```ts
type ResearchScopeKind =
  | 'current-experiment'
  | 'current-session'
  | 'selected-event'
  | 'timeline-selection'
  | 'comparison'
  | 'custom';
```

No copiar este tipo literalmente si el repositorio ya dispone de convenciones equivalentes.

---

# 8. Research Context Builder

Implementar en Application una responsabilidad dedicada a construir el contexto de investigación.

Nombre conceptual:

```text
LaboratoryResearchContextBuilder
```

El nombre real debe respetar la nomenclatura del proyecto.

Responsabilidades:

* recibir ViewModels o datos normalizados desde las APIs públicas existentes;
* consolidar Timeline, Evidence, Comparison y Replay;
* aplicar el alcance seleccionado;
* limitar el volumen del contexto;
* eliminar duplicados;
* preservar identificadores trazables;
* ordenar temporalmente los eventos;
* producir un DTO serializable;
* generar metadatos de trazabilidad;
* validar que el contexto sea coherente.

No debe:

* acceder desde UI;
* modificar el dominio;
* ejecutar consultas de IA;
* mantener un timeline alternativo;
* almacenar secretos;
* inferir eventos inexistentes.

---

# 9. Presupuesto de contexto

Implementar una política explícita para controlar el tamaño del contexto.

La solución debe evitar enviar cantidades ilimitadas de:

* eventos;
* evidencias;
* comparaciones;
* descripciones;
* metadatos.

Incorporar límites configurables y testeables, por ejemplo:

```ts
interface ResearchContextLimits {
  maxTimelineEvents: number;
  maxEvidenceItems: number;
  maxComparisonItems: number;
  maxTextLengthPerItem: number;
  maxTotalEstimatedCharacters: number;
}
```

Los nombres y valores definitivos deben seguir las convenciones existentes.

Cuando sea necesario reducir el contexto:

1. preservar elementos seleccionados explícitamente;
2. preservar eventos relacionados con evidencias;
3. preservar el orden cronológico;
4. registrar que el contexto fue truncado;
5. informar los límites aplicados en los metadatos.

No aplicar truncamiento silencioso.

---

# 10. Solicitud de investigación

Crear un DTO tipado para representar la solicitud.

Ejemplo conceptual:

```ts
interface LaboratoryResearchRequest {
  id: string;
  query: string;
  context: ResearchContextViewModel;
  options: ResearchOptionsViewModel;
  createdAt: string;
}
```

Debe incluir:

* identificador;
* consulta del usuario;
* contexto consolidado;
* opciones;
* fecha;
* versión del formato;
* metadatos de trazabilidad.

La consulta debe validarse antes de ejecutarse.

Como mínimo:

* impedir consultas vacías;
* normalizar espacios;
* aplicar longitud máxima;
* mostrar errores de validación;
* impedir doble ejecución accidental.

---

# 11. Abstracción del proveedor de investigación

La Fase D.4 no debe acoplar Laboratory directamente a un proveedor específico de IA.

Crear una interfaz o puerto conceptual:

```ts
interface LaboratoryResearchProvider {
  execute(
    request: LaboratoryResearchRequest
  ): Promise<LaboratoryResearchResponse>;
}
```

La implementación debe permitir:

* proveedor remoto futuro;
* proveedor local;
* proveedor simulado;
* pruebas deterministas;
* modo no configurado;
* manejo de cancelación, si la arquitectura existente lo soporta.

Está prohibido:

* colocar llamadas HTTP directamente en componentes React;
* insertar claves API en el frontend;
* acoplar la UI a OpenAI, Gemini, DeepSeek, Groq u otro proveedor;
* guardar secretos en el repositorio;
* asumir que existe conectividad externa;
* romper el build cuando no existe proveedor configurado.

---

# 12. Proveedor inicial seguro

Para esta fase debe existir al menos una implementación funcional y testeable que no dependa obligatoriamente de un servicio externo.

Implementar una de estas estrategias, según la arquitectura real:

* `MockResearchProvider`;
* `LocalResearchProvider`;
* `DeterministicResearchProvider`;
* adaptador equivalente.

Este proveedor debe generar una respuesta estructurada a partir del contexto disponible y permitir certificar todo el flujo:

```text
UI
→ Binding Layer
→ Orchestrator
→ Context Builder
→ Provider
→ Response
→ ViewModel
→ UI
```

No presentar la respuesta simulada como inferencia real de un modelo externo.

La UI debe distinguir claramente entre:

* modo local o simulado;
* proveedor real configurado;
* proveedor no disponible.

---

# 13. Respuesta de investigación

Crear un modelo estructurado para los resultados.

Ejemplo conceptual:

```ts
interface LaboratoryResearchResponse {
  requestId: string;
  summary: string;
  findings: ResearchFindingViewModel[];
  evidenceReferences: ResearchEvidenceReferenceViewModel[];
  timelineReferences: ResearchTimelineReferenceViewModel[];
  limitations: string[];
  generatedAt: string;
  provider: ResearchProviderMetadataViewModel;
}
```

Cada hallazgo debe poder incluir:

* título;
* explicación;
* nivel de confianza o categoría equivalente;
* identificadores de evidencia;
* identificadores de eventos;
* advertencias;
* limitaciones.

La respuesta no debe limitarse a un único bloque de texto opaco.

Debe conservar vínculos trazables hacia el contexto que la originó.

---

# 14. Trazabilidad y referencias

Cada respuesta debe indicar qué elementos del contexto fueron utilizados.

Implementar referencias hacia:

* eventos del Timeline;
* evidencias;
* experimentos;
* sesiones;
* elementos de comparación;
* estado relevante del Replay.

Al seleccionar una referencia desde AI Research, debe reutilizarse la infraestructura existente para:

* seleccionar el evento correspondiente;
* abrir o enfocar la evidencia;
* navegar al elemento relacionado;
* sincronizarse con Replay cuando corresponda.

No implementar lógica de navegación duplicada.

Utilizar los commands o mecanismos públicos ya disponibles en `LaboratoryBindingLayer`.

---

# 15. Estado del workspace

Crear un ViewModel explícito para el estado de AI Research.

Ejemplo conceptual:

```ts
interface LaboratoryResearchViewModel {
  query: string;
  status: ResearchStatus;
  contextPreview: ResearchContextPreviewViewModel;
  response: LaboratoryResearchResponseViewModel | null;
  validationErrors: ResearchValidationErrorViewModel[];
  executionError: ResearchExecutionErrorViewModel | null;
  canExecute: boolean;
  canCancel: boolean;
  isContextTruncated: boolean;
}
```

Considerar estados:

```text
idle
building-context
ready
running
success
error
cancelled
```

Usar los estados que mejor encajen en el proyecto.

Evitar booleanos contradictorios como:

```text
isLoading = true
hasError = true
isSuccess = true
```

Preferir una máquina de estados simple o una unión discriminada si las convenciones del repositorio lo permiten.

---

# 16. Commands públicos

Extender `LaboratoryBindingLayer` mediante comandos públicos equivalentes a:

* actualizar consulta;
* definir alcance;
* seleccionar o excluir evidencias;
* seleccionar o excluir eventos;
* construir o refrescar contexto;
* ejecutar investigación;
* cancelar investigación;
* limpiar resultado;
* abrir referencia de evidencia;
* abrir referencia temporal;
* restaurar valores predeterminados.

Los nombres definitivos deben seguir las convenciones existentes.

No exponer implementaciones internas del proveedor.

---

# 17. Integración con LaboratoryOrchestrator

`LaboratoryOrchestrator` debe coordinar:

* construcción del contexto;
* validación;
* ejecución del proveedor;
* actualización de estado;
* errores;
* cancelación, cuando sea viable;
* trazabilidad de la solicitud;
* entrega de resultados a Binding Layer.

No convertir el Orchestrator en un componente de UI.

No incluir lógica de renderizado.

No mezclar la responsabilidad del Context Builder con la del proveedor.

---

# 18. Interfaz del workspace

Crear el workspace respetando el sistema visual actual.

No introducir una biblioteca visual nueva salvo que ya esté aprobada en el repositorio.

La interfaz debe incluir como mínimo:

## 18.1 Encabezado

* título del workspace;
* descripción breve;
* estado del proveedor;
* indicador del alcance activo.

## 18.2 Constructor de consulta

* campo de consulta;
* contador o validación de longitud;
* acción de ejecución;
* acción de limpieza;
* estados disabled coherentes.

## 18.3 Selector de contexto

Permitir visualizar o configurar:

* alcance;
* intervalo o selección temporal;
* eventos incluidos;
* evidencias incluidas;
* comparación activa;
* Replay relacionado.

No es obligatorio duplicar interfaces completas de los otros workspaces.

Debe reutilizar selecciones y ViewModels existentes.

## 18.4 Vista previa del contexto

Mostrar de forma clara:

* cantidad de eventos;
* cantidad de evidencias;
* comparación incluida;
* Replay incluido;
* intervalo temporal;
* truncamiento aplicado;
* elementos seleccionados explícitamente.

## 18.5 Panel de resultados

Mostrar:

* resumen;
* hallazgos;
* referencias;
* limitaciones;
* metadatos del proveedor;
* fecha de generación.

## 18.6 Estados especiales

Implementar estados visuales para:

* sin consulta;
* sin contexto;
* contexto inválido;
* ejecución;
* error;
* cancelación;
* resultado vacío;
* resultado disponible;
* proveedor no configurado.

---

# 19. Accesibilidad y UX

Aplicar como mínimo:

* etiquetas accesibles;
* navegación por teclado;
* foco visible;
* botones con nombres claros;
* mensajes de error asociados al campo correspondiente;
* estado de carga anunciado;
* controles deshabilitados de forma coherente;
* conservación del texto ante errores;
* confirmación antes de perder resultados, solo si el sistema ya aplica ese patrón;
* diseño adaptable al layout existente.

No realizar una renovación visual global.

La fase está centrada en funcionalidad e integración.

---

# 20. Seguridad

La implementación debe garantizar:

* ninguna clave API embebida;
* ningún secreto en logs;
* ninguna llamada directa desde UI a un proveedor externo;
* validación del texto de entrada;
* serialización controlada;
* límites de contexto;
* manejo seguro de errores;
* ausencia de trazas internas sensibles en mensajes al usuario;
* separación entre mensajes técnicos y mensajes de UI.

Si existe una infraestructura de configuración segura, utilizarla únicamente mediante abstracciones.

No agregar credenciales reales.

---

# 21. Manejo de errores

Centralizar los errores mediante los patrones existentes de Laboratory.

Distinguir como mínimo:

* error de validación;
* error al construir contexto;
* ausencia de contexto;
* proveedor no disponible;
* ejecución rechazada;
* timeout, si aplica;
* cancelación;
* respuesta inválida;
* referencia inexistente.

Los errores deben transformarse en ViewModels aptos para UI.

No mostrar stack traces al usuario.

Los detalles técnicos deben limitarse a logging de desarrollo, siguiendo las convenciones existentes.

---

# 22. Persistencia

No implementar una base de datos nueva durante esta fase.

El historial de investigación solo debe persistirse si el proyecto ya dispone de una abstracción compatible y claramente reutilizable.

Como alcance mínimo, puede mantenerse el resultado en el estado de la sesión del Laboratory.

No utilizar `localStorage` de forma arbitraria si no existe un patrón previo aprobado.

No incorporar persistencia irreversible sin contrato arquitectónico.

---

# 23. Event Bus

Reutilizar el Event Bus incorporado durante D.3.5 cuando sea pertinente.

Posibles eventos conceptuales:

```text
laboratory.research.context-built
laboratory.research.started
laboratory.research.completed
laboratory.research.failed
laboratory.research.cancelled
laboratory.research.reference-selected
```

Antes de crear eventos nuevos:

1. inspeccionar las convenciones existentes;
2. reutilizar tipos o helpers actuales;
3. evitar eventos redundantes;
4. documentar el payload;
5. mantener payloads serializables.

La publicación de eventos no debe crear una segunda fuente de estado.

El estado oficial continúa bajo Orchestrator y Binding Layer.

---

# 24. Pruebas obligatorias

Agregar pruebas en los niveles compatibles con el repositorio.

## 24.1 Research Context Builder

Probar:

* contexto vacío;
* contexto de experimento;
* contexto de sesión;
* evento seleccionado;
* selección temporal;
* evidencias seleccionadas;
* comparación activa;
* Replay activo;
* orden cronológico;
* deduplicación;
* límites;
* truncamiento informado;
* identificadores preservados;
* serialización;
* inmutabilidad cuando corresponda.

## 24.2 Provider

Probar:

* ejecución válida;
* respuesta estructurada;
* error controlado;
* cancelación si existe;
* proveedor no disponible;
* respuesta inválida;
* comportamiento determinista del proveedor local o simulado.

## 24.3 Orchestrator

Probar:

* transición de estados;
* validación;
* construcción de contexto;
* ejecución exitosa;
* error;
* limpieza;
* cancelación;
* sincronización de referencias.

## 24.4 Binding Layer

Probar:

* exposición del Research ViewModel;
* commands públicos;
* transformación de errores;
* actualización de estado;
* ausencia de acceso directo al dominio;
* navegación hacia Timeline y Evidence.

## 24.5 UI

Probar como mínimo:

* render inicial;
* consulta vacía;
* consulta válida;
* botón de ejecución;
* estado loading;
* error;
* respuesta;
* referencias navegables;
* contexto truncado;
* proveedor simulado;
* accesibilidad básica.

## 24.6 Regresión

Ejecutar toda la suite existente.

Deben continuar funcionando:

* Overview;
* Experiments;
* Sessions;
* Comparison;
* Evidence Explorer;
* Replay;
* Timeline Model;
* navegación histórica;
* shell principal.

---

# 25. Auditoría antiacoplamiento

Realizar búsquedas y validaciones para comprobar que los componentes del AI Research Workspace no importen directamente:

* Domain;
* repositorios;
* casos de uso;
* motores;
* entidades internas;
* infraestructura de persistencia;
* proveedor concreto.

Documentar los resultados.

Comprobar además que no se haya creado:

* un timeline paralelo;
* un store temporal duplicado;
* un bus de eventos alternativo;
* una segunda Binding Layer;
* acceso HTTP desde componentes;
* almacenamiento de credenciales;
* modelos duplicados de Evidence o Comparison.

---

# 26. Estrategia de implementación

Ejecutar en este orden:

## Paso 1 — Auditoría

* inspeccionar estructura;
* identificar convenciones;
* localizar Orchestrator;
* localizar Binding Layer;
* localizar Timeline Model;
* localizar Evidence Explorer;
* localizar Comparison;
* localizar Replay;
* localizar sistema de navegación;
* localizar patrones de pruebas;
* localizar sistema de errores;
* localizar Event Bus;
* localizar sistema visual.

## Paso 2 — Diseño mínimo

Definir antes de programar:

* contratos;
* DTOs;
* ViewModels;
* estados;
* Context Builder;
* Provider interface;
* proveedor inicial;
* commands;
* flujo de integración.

Registrar las decisiones relevantes.

## Paso 3 — Application

Implementar:

* contratos;
* Context Builder;
* límites;
* validadores;
* interfaz del proveedor;
* proveedor local o simulado;
* respuesta estructurada.

## Paso 4 — Orchestrator

Integrar:

* estado;
* construcción;
* ejecución;
* errores;
* eventos;
* cancelación, si aplica.

## Paso 5 — Binding Layer

Exponer:

* Research ViewModel;
* comandos;
* contexto;
* respuestas;
* navegación de referencias.

## Paso 6 — UI

Implementar:

* workspace;
* navegación;
* consulta;
* selector de alcance;
* vista previa;
* resultados;
* estados;
* accesibilidad.

## Paso 7 — Pruebas

Agregar pruebas y ejecutar la suite completa.

## Paso 8 — Auditoría final

Revisar:

* dependencias;
* duplicaciones;
* contratos;
* regresiones;
* build;
* lint;
* arquitectura.

## Paso 9 — Documentación

Crear el informe de cierre y actualizar documentación relevante.

---

# 27. Criterios de aceptación

La fase solo puede considerarse terminada si se cumple todo lo siguiente:

* [ ] AI Research aparece integrado en Laboratory.
* [ ] La UI consume exclusivamente ViewModels.
* [ ] No existen imports directos desde UI hacia Domain.
* [ ] `LaboratoryBindingLayer` continúa siendo el único punto de integración.
* [ ] `LaboratoryOrchestrator` coordina el flujo.
* [ ] Timeline Model es la única fuente temporal.
* [ ] Evidence, Comparison y Replay se consumen mediante APIs públicas.
* [ ] Existe un Research Context Builder.
* [ ] El contexto es tipado y serializable.
* [ ] Existen límites de contexto.
* [ ] El truncamiento se informa explícitamente.
* [ ] Existe una abstracción de proveedor.
* [ ] No hay acoplamiento a un proveedor externo.
* [ ] Existe un proveedor local o simulado testeable.
* [ ] La respuesta es estructurada.
* [ ] Los hallazgos incluyen referencias trazables.
* [ ] Las referencias pueden navegar a Timeline o Evidence.
* [ ] Los errores están centralizados.
* [ ] No existen secretos en el código.
* [ ] Build exitoso.
* [ ] Lint exitoso.
* [ ] Suite completa exitosa.
* [ ] Pruebas nuevas exitosas.
* [ ] Sin regresiones.
* [ ] Auditoría antiacoplamiento satisfactoria.
* [ ] Informe de cierre generado.

---

# 28. Comandos de validación

Detectar primero los scripts reales disponibles en `package.json`.

Ejecutar todos los comandos pertinentes existentes, incluyendo cuando estén disponibles:

```bash
npm test
npm run lint
npm run typecheck
npm run check
npm run check:architecture
npm run build
```

No inventar scripts inexistentes.

Si un comando no existe, registrarlo en el informe y ejecutar la alternativa real disponible.

También ejecutar las herramientas anti-legacy o auditorías arquitectónicas que ya formen parte del proyecto.

---

# 29. Gestión de Git

Antes de modificar:

```bash
git status --short
git branch --show-current
git log -n 5 --oneline
```

No descartar cambios previos del usuario.

No utilizar:

```bash
git reset --hard
git clean -fd
git checkout .
```

No modificar archivos ajenos a la fase salvo que sea imprescindible.

Generar un diff final claramente delimitado.

No crear commits ni tags automáticamente, salvo que la instrucción de ejecución lo autorice expresamente.

Proponer como referencia:

```text
Commit:
feat(laboratory): implement phase D.4 AI Research workspace

Tag:
roulette-tracker-phase-d4-ai-research
```

---

# 30. Informe de cierre

Crear un documento Markdown en la ubicación de reportes utilizada por el repositorio.

Nombre sugerido:

```text
FASE_D4_AI_RESEARCH_IMPLEMENTATION_REPORT.md
```

El informe debe contener:

1. resumen ejecutivo;
2. estado inicial;
3. auditoría realizada;
4. archivos creados;
5. archivos modificados;
6. arquitectura implementada;
7. contratos y ViewModels;
8. construcción del contexto;
9. política de límites;
10. proveedor utilizado;
11. flujo Orchestrator–Binding Layer–UI;
12. integración con Timeline;
13. integración con Evidence;
14. integración con Comparison;
15. integración con Replay;
16. Event Bus;
17. manejo de errores;
18. seguridad;
19. pruebas añadidas;
20. comandos ejecutados;
21. resultados de build, lint y tests;
22. auditoría antiacoplamiento;
23. riesgos o limitaciones;
24. deuda técnica, si existe;
25. criterios de aceptación;
26. conclusión;
27. recomendación para la siguiente fase.

No declarar éxito si alguna validación crítica falla.

---

# 31. Entregables

Entregar:

* implementación completa de AI Research Workspace;
* contratos y DTOs;
* Research Context Builder;
* política de límites;
* interfaz del proveedor;
* proveedor local o simulado;
* integración con Orchestrator;
* integración con Binding Layer;
* ViewModels;
* UI;
* navegación de referencias;
* pruebas;
* documentación;
* informe de cierre;
* resumen de diff;
* comandos recomendados de commit y tag.

---

# 32. Fuera de alcance

No implementar en esta fase:

* entrenamiento de modelos;
* fine-tuning;
* RAG externo completo;
* base vectorial;
* memoria permanente de conversaciones;
* sistema multiagente;
* ejecución autónoma de acciones;
* modificación automática de experimentos;
* generación automática de apuestas;
* acceso directo de IA al dominio;
* claves reales de proveedores;
* rediseño global de Laboratory;
* modificación de motores estadísticos;
* refactorización general no relacionada;
* reemplazo del Timeline Model;
* nueva infraestructura de persistencia.

Estos elementos requerirán fases independientes y revisión arquitectónica.

---

# 33. Reglas de ejecución

1. Audita antes de modificar.
2. No inventes estructuras.
3. Reutiliza la arquitectura existente.
4. Implementa cambios pequeños y verificables.
5. Ejecuta pruebas después de cada bloque relevante.
6. No ocultes errores.
7. No reduzcas cobertura.
8. No elimines pruebas para lograr una suite verde.
9. No uses `any` salvo una necesidad justificada y documentada.
10. No dejes código muerto.
11. No dejes mocks dentro del flujo productivo sin identificación explícita.
12. No agregues secretos.
13. No cambies Domain.
14. No dupliques Timeline.
15. No omitas el informe final.

---

# 34. Resultado esperado

Al finalizar, Roulette Tracker debe disponer de un AI Research Workspace funcional, desacoplado y trazable que:

* construya contexto desde la infraestructura certificada;
* permita formular consultas;
* ejecute investigaciones mediante un proveedor abstracto;
* entregue resultados estructurados;
* relacione hallazgos con evidencias y eventos;
* reutilice Timeline, Evidence, Comparison y Replay;
* mantenga intacto el dominio;
* preserve la compatibilidad del módulo Laboratory;
* quede preparado para incorporar proveedores reales en fases posteriores.

La Fase D.4 solo podrá declararse cerrada cuando todas las validaciones críticas sean exitosas y el informe de cierre refleje fielmente el estado real del repositorio.
