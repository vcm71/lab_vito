2026-08-03T03:04:11Z
Fase 6.B.1 — Laboratory Discovery Audit

Estado: completado
Alcance: análisis de la arquitectura del Laboratorio (Lab / Lab_Con / Lab_Con1), AtRep, WinWin, DA, capa de consenso y Historical Evidence.

Resumen ejecutivo
- El “Laboratorio” no aparece como un único módulo autónomo, sino como una superficie compuesta por varias vistas/tablas y motores especializados.
- La ruta visual principal del laboratorio está montada en `index.html` con pestañas separadas para `Lab_Con`, `Lab_Con1` y `AtRep`.
- `Lab_Con` es el motor base de atrasos; `Lab_Con1` replica la interfaz pero cambia la lógica a Win-Win; `AtRep` calcula PCI individual y combinado sobre conjuntos.
- La capa de consenso integra los tres motores mediante adaptadores dedicados y un `SignalCollector` que los orquesta.
- Historical Evidence está expuesto como un barrel público de dominio/aplicación/infraestructura, no como un único almacén monolítico.

1) Origen y superficie visual del Laboratorio
- `index.html:24-30` define las pestañas visibles: `Lab_Con`, `Lab_Con1` y `AtRep`.
- `index.html:180-200` monta los contenedores `tab-lab-con` y `tab-lab-con1` con `view-lab` y `view-lab-con1`.
- `main.js:419-423` mantiene compatibilidad con las claves antiguas `tab-lab` / `view-lab` y las redirige a `tab-lab-con`.

Lectura funcional:
- La interfaz del laboratorio está organizada por paneles, no por una sola vista general.
- Existe una transición explícita desde una nomenclatura legacy (`tab-lab`) hacia la pestaña actual `tab-lab-con`.

2) Lab_Con: motor de atrasos clásico
- `labEngine.js:68-70` define `LabEngine` como clase que recibe `trackerInstance`.
- `labEngine.js:15-17` declara `SUBCONJUNTOS` y el universo de ruleta en el propio archivo.
- `labEngine.js:115-139` calcula el peso por atraso y expone `getSetDetails`.
- `labEngine.js:159-184` resuelve scores por número e intersecciones óptimas.
- `controlador_de_la_vista_lab.js:117-140` renderiza el bloque de estado con “Muestra Activa”, “Peso Global” y “Mejor Cruce”.
- `controlador_de_la_vista_lab.js:225-243` actualiza la vista con `resolverScoresIndividuales`, `getSetDetails` y `buscarInterseccionesOptimas`.
- `controlador_de_la_vista_lab.js:285-370` construye el heatmap, el perfil de conjuntos y las recomendaciones.

Lectura funcional:
- `Lab_Con` es el motor de referencia de atrasos y cruces.
- Su UI ya muestra un contrato claro de entrada: conjuntos activos, peso global, top cruces y números calientes.
- En el top de números se excluyen `0` y `00`, manteniendo la convención de negocio observada en el proyecto.

3) Lab_Con1: misma UI, otra métrica de negocio
- `labCon1Renderer.js:2-6` declara explícitamente que la interfaz es la misma que `Lab_Con`, pero usando datos Win-Win.
- `labCon1Renderer.js:24-33` monta la vista sobre `view-lab-con1` y construye su propio `LabCon1Engine`.
- `labCon1Renderer.js:71-120` rehace la UI en cada update y persiste zoom local.
- `labCon1Engine.js:97-113` obtiene historial desde `tracker.getSpins()` y limita la ventana con `rouletteSettingsStore.atrasosMaxWindow`.
- `labCon1Engine.js:183-231` calcula detalles de conjuntos, scores individuales y cruces óptimos usando pesos Win-Win.

Lectura funcional:
- `Lab_Con1` es un clon visual de `Lab_Con`, pero su semántica ya no depende de atrasos clásicos sino de la capa Win-Win.
- El uso de `atrasosMaxWindow` confirma que la muestra activa sigue estando gobernada por la ventana global de ajustes.
- La vista y el motor comparten la misma filosofía de interacción que `Lab_Con`, lo que facilita comparabilidad entre tabs.

4) AtRep: PCI individual y agregado sobre conjuntos
- `atRepEngine.js:84-86` define `AtRepEngine` recibiendo `domainTracker`.
- `atRepEngine.js:240-263` devuelve detalles de conjuntos activos, incluyendo PCI por número.
- `atRepEngine.js:269-349` construye scores combinados por número y distingue `individualPci` / `groupPci`.
- `atRepEngine.js:356-371` calcula intersecciones óptimas maximizando el promedio de atracción combinada.
- `src/consensus/adapters/AtRepAdapter.js:8-10` importa `AtRepEngine` desde la raíz y lo registra como fuente `AtRep`.
- `src/consensus/adapters/AtRepAdapter.js:237-280` transforma la salida del motor en señales de consenso.

Lectura funcional:
- El motor AtRep no inventa una métrica separada: combina PCI individual con PCI de los conjuntos que contienen cada número.
- El contrato de salida está claramente orientado a consenso, no solo a visualización.
- La capa adaptadora deja claro que AtRep participa como fuente formal del sistema de consenso.

5) Capa de consenso: contrato común y orquestación
- `src/consensus/constants/consensusConstants.js:7-11` define las fuentes oficiales: `Lab_Con`, `Lab_Con1` y `AtRep`.
- `src/consensus/index.js:1-20` exporta constantes, adaptadores, `SignalCollector`, estrategias y motor de consenso.
- `src/consensus/adapters/index.js:1-3` reexporta los tres adaptadores principales.
- `src/consensus/collection/SignalCollector.js:27-39` mapea cada fuente de consenso a su adaptador.
- `src/consensus/collection/SignalCollector.js:102-109` exige un objeto con `labConAdapter`, `labCon1Adapter` y `atRepAdapter`.
- `src/consensus/collection/SignalCollector.js:149-156` ejecuta cada adaptador por separado y recolecta sus señales.
- `src/consensus/collection/SignalCollector.js:364-377` registra metadatos con provenance del colector y los tres adaptadores.
- `src/consensus/adapters/LabConAdapter.js:1-5` y `src/consensus/adapters/LabCon1Adapter.js:1-5` muestran imports directos de los motores raíz y del store de ajustes.

Lectura funcional:
- La capa de consenso es explícitamente multi-fuente y no depende de magia implícita.
- El contrato central de las señales está concentrado en un collector que conoce exactamente tres adaptadores.
- Hay acoplamiento directo entre adaptadores y motores raíz, lo cual simplifica trazabilidad pero también crea dependencia estructural clara.

6) Historical Evidence: barrel público por capas
- `src/historical-evidence/index.js:1-173` reexporta dominio completo de evidencia, datasets, comparaciones, lineage y split leakage.
- `src/historical-evidence/index.js:175-211` reexporta la capa de aplicación: use cases, builders, verifiers, comparators y splitters.
- `src/historical-evidence/index.js:213-217` reexporta la infraestructura in-memory.

Lectura funcional:
- Historical Evidence está diseñado como un subsistema en capas, no como un archivo único de persistencia.
- La presencia de `InMemoryEvidenceRepository` e `InMemoryCalibrationObservationRepository` sugiere soporte para pruebas y ejecución local controlada.
- El barrel público da una frontera clara de API para que otras partes del sistema consuman evidencia sin importar la estructura interna.

7) WinWin y DA como motores de apoyo
- `src/engines/WinWin/WinWinEngine.js:6-10` extiende `BaseEngine` y usa `winwinHistoricalMaxesStore`.
- `src/engines/WinWin/WinWinEngine.js:83-85` resetea y reescanea historial completo.
- `src/engines/WinWin/WinWinEngine.js:197-238` implementa análisis CHI y Win-Win.
- `src/engines/DA/DAEngine.js:6-12` extiende `BaseEngine` y organiza grupos `series` / `externals` / `groups`.
- `src/engines/DA/DAEngine.js:52-56` calcula secuencias DA desde `tracker.getSpins()`.
- `src/engines/DA/DAEngine.js:96-124` arma la evaluación final de grupos y categorías.

Lectura funcional:
- WinWin y DA ya están formalizados como motores de primer nivel y no como utilidades sueltas.
- WinWin además mantiene estado histórico persistido, lo que lo vuelve más cercano a un motor con memoria.

Conclusión
- El “Laboratorio” actual es una composición de tres capas: motor de visualización/atrasos (`Lab_Con`), variante Win-Win (`Lab_Con1`) y métrica PCI (`AtRep`).
- La integración está razonablemente bien delimitada por adaptadores y un collector de señales.
- Historical Evidence está suficientemente desacoplado para servir como base de evolución futura sin mezclar dominio, casos de uso e infraestructura.
- La transición legacy→actual deja rastros explícitos en `main.js`, pero el contrato visible ya apunta a `tab-lab-con` y `tab-lab-con1`.

Archivos revisados
- `/home/shared/lab_vito/index.html`
- `/home/shared/lab_vito/main.js`
- `/home/shared/lab_vito/labEngine.js`
- `/home/shared/lab_vito/controlador_de_la_vista_lab.js`
- `/home/shared/lab_vito/labCon1Engine.js`
- `/home/shared/lab_vito/labCon1Renderer.js`
- `/home/shared/lab_vito/atRepEngine.js`
- `/home/shared/lab_vito/src/consensus/index.js`
- `/home/shared/lab_vito/src/consensus/constants/consensusConstants.js`
- `/home/shared/lab_vito/src/consensus/adapters/index.js`
- `/home/shared/lab_vito/src/consensus/adapters/LabConAdapter.js`
- `/home/shared/lab_vito/src/consensus/adapters/LabCon1Adapter.js`
- `/home/shared/lab_vito/src/consensus/adapters/AtRepAdapter.js`
- `/home/shared/lab_vito/src/consensus/collection/SignalCollector.js`
- `/home/shared/lab_vito/src/historical-evidence/index.js`
- `/home/shared/lab_vito/src/engines/WinWin/WinWinEngine.js`
- `/home/shared/lab_vito/src/engines/DA/DAEngine.js`

Fin del reporte.
