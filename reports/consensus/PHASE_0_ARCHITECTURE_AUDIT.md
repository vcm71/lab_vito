Fecha: 2026-07-29T22:22:06-04:00
Estado: COMPLETADO
Proyecto: Roulette Tracker (Orion)
Alcance: auditoría arquitectónica de Lab_Con, Lab_Con1, AtRep y configuración compartida.

## 1. Resumen ejecutivo
- El repositorio ya está en una fase de composición root: `main.js` inicializa `OrionKernel`, obtiene el `domainTracker` y conecta motores/renderers.
- La arquitectura global está razonablemente separada entre tracker, motores y renderers, pero todavía hay acoplamientos fuertes con detalles internos del engine en AtRep.
- Hallazgo principal: `atRepEngine.getNumeroScores()` tiene un error lógico en el filtrado de conjuntos activos que puede distorsionar `setsIn`, `groupPci` y el PCI combinado.
- Hallazgo secundario: AtRep aún conserva vestigios del formato de dos círculos en la leyenda y en el contrato de datos (`groupPci`), aunque el render visible ya es de un solo círculo.
- Verificación de calidad: `npm run test` pasa, `npm run build` pasa, `npm run lint` falla por imports no usados en tests.

## 2. Estado del repositorio
- `git status --short` muestra un worktree no limpio, con múltiples archivos modificados, eliminados y no rastreados preexistentes.
- Archivos relevantes visibles en el estado actual: `main.js`, `labEngine.js`, `labCon1Engine.js`, `atRepEngine.js`, `atRepRenderer.js`, `rouletteSettingsStore.js`, `controlador_de_la_vista_lab.js`, `index.html`, `tests/*`, entre muchos otros.
- Esta auditoría no modificó código productivo; solo se generó este informe en `reports/consensus/`.

## 3. Alcance auditado
- Flujo de spins e historial: `src/tracker/SpinManager.js`, `src/tracker/RouletteTracker.js`, `rouletteSpinsStore.js`.
- Configuración compartida: `rouletteSettingsStore.js`, `src/tracker/SettingsManager.js`.
- Motores de análisis: `labEngine.js`, `labCon1Engine.js`, `atRepEngine.js`.
- Capa de presentación AtRep: `src/viewmodels/atRepViewModel.js`, `atRepRenderer.js`.
- Composición y bootstrap: `main.js`, `src/core/OrionKernel.js`, `src/core/Bootstrap.js`.
- Evidencia de pruebas: `tests/atRepEngine.test.js`, `tests/atRepViewModel.test.js`, `tests/atRepRenderer.test.js`, `tests/integration/*`, `tests/unit/*`.

## 4. Inventario de archivos
- `main.js` — composition root; sincroniza UI, tracker y engines.
- `src/tracker/RouletteTracker.js` — propietario del estado de spins/config/historial.
- `src/tracker/SpinManager.js` — CRUD de spins y normalización/validación.
- `src/tracker/DelayManager.js` — cálculo de atrasos con cache.
- `src/tracker/SettingsManager.js` — persistencia y actualización de settings.
- `rouletteSettingsStore.js` — snapshot persistente de settings globales.
- `rouletteSpinsStore.js` — persistencia de spins.
- `labEngine.js` — motor Lab_Con (atrasos + pesos por conjunto).
- `labCon1Engine.js` — motor Lab_Con1 (Win-Win / streaks / distancias).
- `atRepEngine.js` — motor PCI / atracción-repulsión.
- `src/viewmodels/atRepViewModel.js` — contrato serializable para AtRep.
- `atRepRenderer.js` — UI de AtRep.
- `src/core/OrionKernel.js`, `src/core/Bootstrap.js`, `src/core/EngineRegistry.js` — inicialización y registro.

## 5. Arquitectura actual
- `main.js` actúa como composition root: importa renderers, crea `OrionKernel`, llama `kernel.bootstrap()`, obtiene `domainTracker` y crea `RouletteAnalytics`.
- `src/tracker/RouletteTracker.js` concentra la orquestación: carga settings, historial y spins desde stores, y delega en managers.
- `SpinManager` es la única pieza que muta directamente el array de spins; `getSpins()` devuelve la referencia interna.
- `DelayManager` y ambos motores Lab leen la historia a través del tracker y dependen de `rouletteSettingsStore.getSnapshot()`.
- AtRep se separa en engine + viewmodel + renderer; esa separación es buena, pero el engine aún expone un contrato algo más amplio del que la UI consume.

## 6. Flujo de datos global
- Fuente de spins: `rouletteSpinsStore.load()` en `RouletteTracker.initialize()`.
- Fuente de settings: `SettingsManager.load()` + `rouletteSettingsStore.getSnapshot()`.
- Spin ingestion: `RouletteTracker.addSpin()` → `SpinManager.addSpin()` → push a `state.spins`.
- Shared window: `atrasosMaxWindow` se usa como ventana común para Lab_Con, Lab_Con1 y AtRep ViewModel.
- Lab_Con: tracker spins + settings → `LabEngine._getSetStats()` → pesos por conjunto → `resolverScoresIndividuales()`.
- Lab_Con1: tracker spins + settings → `LabCon1Engine._getNumberHistory()` / `_getSetWinWinStats()` → `resolverScoresIndividuales()`.
- AtRep: engine calcula PCI por número y conjunto → viewmodel filtra y ordena → renderer dibuja.

## 7. Auditoría de Lab_Con
- `labEngine.js:73-108` calcula `actualDelay` y `maxDelay` por conjunto usando solo la ventana activa (`atrasosMaxWindow`).
- `labEngine.js:115-127` convierte esos atrasos en una ponderación continua basada en probabilidad y ratio actual/máximo.
- `labEngine.js:159-172` distribuye el peso de cada conjunto activo a todos sus números miembros, lo que concuerda con la fórmula descrita en el archivo.
- `labEngine.js:77-85` confirma que el motor depende de `tracker.getSpins()` y `rouletteSettingsStore.getSnapshot()`.
- Riesgo funcional: el peso cambia de forma sensible si la ventana global se reduce demasiado; esto es un efecto de diseño, no un bug.

## 8. Auditoría de Lab_Con1
- `labCon1Engine.js:106-144` recorta la historia a `atrasosMaxWindow`, calcula distancias, atraso y estado activo del conjunto.
- `labCon1Engine.js:153-177` usa la racha Win-Win y el atraso para construir un peso en el rango 0..1.
- `labCon1Engine.js:211-224` resuelve scores por número sumando el peso de cada conjunto activo.
- Igual que Lab_Con, este motor depende del tracker para el historial y del snapshot de settings para la ventana/thresholds.
- El enfoque estadístico es distinto al de Lab_Con: aquí el peso está guiado por rachas y distancia, no por atraso puro.

## 9. Auditoría de AtRep
- `atRepEngine.js:269-349` genera el score agregado por número.
- Hallazgo crítico: en `getNumeroScores()` la línea `containingSets = activeDefs.filter(d => strSet.has(key))` usa un `Set` de unión global, no la pertenencia real por conjunto. Resultado: si un número pertenece a cualquier conjunto activo, el filtro puede tratarlo como miembro de todos los conjuntos activos.
- Ese error altera `setsIn`, `groupPci` y el PCI combinado de los números afectados.
- `src/viewmodels/atRepViewModel.js:75-79` excluye `0` y `00` de los listados top de atracción/repulsión, alineado con la regla del proyecto.
- `atRepRenderer.js:309-320` renderiza un único círculo con `individualPci`; sin embargo, `atRepRenderer.js:329-337` todavía muestra en la leyenda el texto “1er círculo: individual · 2º círculo: grupal”, lo que ya no coincide con el formato visible.
- `src/viewmodels/atRepViewModel.js:99-109` todavía expone `groupPci`; aunque hoy el renderer no lo pinta, ese dato puede reintroducir ambigüedad si se consume después.

## 10. Auditoría de configuración
- `rouletteSettingsStore.js` centraliza settings persistentes compartidos.
- `main.js:60-87` sincroniza `atrasosMaxWindow`, `atRepTopK`, thresholds de Win-Win y umbrales por módulo hacia la UI.
- `labEngine.js:80-85` y `labCon1Engine.js:111-124` consumen `atrasosMaxWindow` y `moduleThresholds` directamente del snapshot.
- `src/viewmodels/atRepViewModel.js:66-79` lee `atRepTopK` desde `domainTracker.getSettings()`.
- Esto hace que la ventana activa sea una política global y no una propiedad aislada de cada motor.

## 11. Comparación de motores
- Lab_Con: enfoque de atraso/escasez por conjunto, ponderado por ventana y probabilidad relativa.
- Lab_Con1: enfoque de racha Win-Win con threshold de distancia; prioriza continuidad reciente.
- AtRep: enfoque por PCI descriptivo sobre números individuales y agregación por conjuntos activos.
- Los tres comparten la misma base de datos de spins y la misma ventana global, pero resuelven señales distintas.
- Lab_Con y Lab_Con1 son motores de conjunto; AtRep es principalmente de número individual con proyección de conjunto.

## 12. Contrato de señales candidato
- Contrato mínimo recomendado para Fase 1: `number`, `pci`, `individualPci`, `verdict`, `tone`, `occurrences`, `ariaLabel`.
- El renderer de AtRep solo necesita el PCI individual para el círculo visible; `groupPci` debería considerarse un dato interno o deprecado si se mantiene el formato de un solo círculo.
- La separación actual `engine -> viewmodel -> renderer` es correcta; el contrato debería quedar estable y serializable.
- `src/viewmodels/atRepViewModel.js` ya cumple la mayor parte de ese objetivo, salvo la exposición adicional de `groupPci`.

## 13. Disponibilidad de datos
- Spins: disponibles en `RouletteTracker.getSpins()` y persistidos en `rouletteSpinsStore`.
- Settings: disponibles vía `SettingsManager` y snapshot global en `rouletteSettingsStore`.
- Historial: `RouletteTracker.getHistory()` / `HistoryManager`.
- Muestra activa: derivada de `atrasosMaxWindow` en Lab_Con, Lab_Con1 y AtRep ViewModel.
- No se observó dependencia externa obligatoria para el análisis de estas señales.

## 14. Acoplamientos detectados
- `main.js` sigue importando muchos renderers directamente; es aceptable como composition root, pero concentra mucho conocimiento de UI.
- `src/viewmodels/atRepViewModel.js` accede a `engine._spins`, `engine._totalSampleSize` y `engine._windowSize`, es decir, a campos privados o internos.
- `labEngine.js` y `labCon1Engine.js` dependen de `rouletteSettingsStore.getSnapshot()` en lugar de recibir settings ya resueltos por un adaptador.
- `atRepRenderer.js` depende de la forma exacta del VM y mantiene texto de leyenda que ya no coincide con el render real.

## 15. Riesgos arquitectónicos
- Riesgo alto: el bug de `atRepEngine.getNumeroScores()` puede invalidar la lectura PCI de números en ciertas combinaciones de conjuntos activos.
- Riesgo medio: `AtRepViewModel` y `AtRepRenderer` todavía arrastran semántica de “grupo” pese al formato visual de un solo círculo.
- Riesgo medio: `main.js` es muy grande y mezcla bootstrap, UI wiring y lógica de coordinación; eso dificulta cambios futuros.
- Riesgo bajo/aceptable: la ventana global compartida simplifica el sistema, pero también homogeneiza la sensibilidad de motores con necesidades diferentes.

## 16. Riesgos estadísticos
- En AtRep, un error en la agregación de conjuntos afecta directamente la clasificación ATRACCIÓN/REPULSIÓN/CSR.
- En Lab_Con y Lab_Con1, una ventana demasiado pequeña puede subestimar atrasos y rachas; el sistema depende de que `atrasosMaxWindow` sea razonable.
- `atRepViewModel.js:75-79` excluye 0/00 de las listas top, lo cual es coherente con la regla del proyecto; no obstante, el grid completo sí los conserva.
- `labCon1Engine.js` usa un threshold por defecto de 5 si la configuración no está presente, lo cual puede ocultar un error de configuración si no se revisa.

## 17. Testabilidad
- Muy buena: `src/viewmodels/atRepViewModel.js` produce un contrato serializable y por eso es fácil de probar.
- Muy buena: `SpinManager`, `DelayManager`, `RouletteTracker` y los motores tienen cobertura de tests existente.
- Limitación: el acceso de AtRep ViewModel a campos internos del engine reduce la pureza del contrato y vuelve más frágil el test de integración.
- Verificación real: `npm run test` → 13 test files, 163 tests, 163 passed.

## 18. Deuda técnica
- `atRepEngine.getNumeroScores()` debe corregirse para filtrar por pertenencia real del número a cada conjunto activo.
- `atRepRenderer.js` conserva texto de leyenda legado sobre un “2º círculo” que ya no existe en la UI visible.
- `src/viewmodels/atRepViewModel.js` expone `groupPci` aunque la interfaz actual usa un único círculo.
- `main.js` sigue siendo extenso y difícil de auditar de forma manual.
- `npm run lint` falla por imports no usados en tests, lo que deja pendiente el ordenamiento del suite aunque la funcionalidad pase.

## 19. Cambios mínimos propuestos para Fase 1
- Corregir la lógica de membresía en `atRepEngine.getNumeroScores()`.
- Reducir el contrato AtRep a un solo PCI visible y eliminar la semántica dual de la leyenda.
- Mantener `atrasosMaxWindow` como ventana común, pero documentar explícitamente su impacto en cada motor.
- Ajustar los tests/lint de `tests/atRepRenderer.test.js` y `tests/atRepViewModel.test.js` para eliminar imports no usados.

## 20. Archivos candidatos para Fase 1
- `atRepEngine.js` — corrección lógica del agregado por número.
- `src/viewmodels/atRepViewModel.js` — contrato de datos más estricto y sin vestigios de doble círculo.
- `atRepRenderer.js` — leyenda y render alineados con el formato real.
- `tests/atRepEngine.test.js`, `tests/atRepViewModel.test.js`, `tests/atRepRenderer.test.js` — cobertura de regresión.
- Opcionalmente `main.js` solo si la Fase 1 requiere ajustar el wiring del VM/renderer.

## 21. Archivos que no deben modificarse
- `rouletteSpinsStore.js` — persistencia de spins ya alineada con el tracker.
- `rouletteSettingsStore.js` — fuente compartida de settings; tocarlo sin necesidad ampliaría el riesgo.
- `src/tracker/SpinManager.js` — validación y CRUD ya están estables.
- `src/tracker/DelayManager.js` — cálculo de atrasos ya está cubierto y aislado.
- `src/tracker/RouletteTracker.js` — orquestación base del dominio; solo debe cambiar si el contrato de dominio lo exige.
- `src/utils/numberMeta.js` — metadatos de ruleta son infraestructura base.

## 22. Criterios de aceptación para Fase 1
- La agregación AtRep por número debe coincidir con la pertenencia real de cada conjunto activo.
- La UI AtRep debe mostrar solo un círculo visible por número, sin lenguaje residual de “grupal”.
- `0` y `00` deben seguir excluidos de los listados top de AtRep salvo requerimiento explícito contrario.
- `npm run test` debe seguir pasando.
- `npm run build` debe seguir pasando.
- Idealmente `npm run lint` también debe quedar limpio en la suite de tests.

## 23. Preguntas abiertas
- ¿`groupPci` debe eliminarse por completo del contrato de AtRep o mantenerse internamente para diagnóstico?
- ¿La leyenda de AtRep debe reescribirse solo para reflejar el círculo individual o también eliminar referencias al concepto grupal de la documentación?
- ¿La Fase 1 debe tocar únicamente AtRep o también normalizar el uso de `main.js` como composition root?
- ¿Se requiere una política explícita para `atrasosMaxWindow` por motor, o la política global es definitiva?

## 24. Conclusión
- La base arquitectónica es buena: tracker central, settings central, motores diferenciados y renderers separados.
- El principal problema técnico detectado está en AtRep, donde la agregación por conjuntos tiene un error lógico y la UI conserva semántica heredada que ya no coincide con el formato visible.
- El sistema es testeable y compilable; el siguiente paso razonable es cerrar la brecha AtRep antes de ampliar alcance.

## 25. Evidencias y referencias
- `main.js:15-23` — bootstrap del kernel, tracker y analytics.
- `src/tracker/RouletteTracker.js:114-120` — carga de settings, history y spins.
- `src/tracker/SpinManager.js:58-72` — creación y almacenamiento del spin.
- `labEngine.js:73-108` y `labEngine.js:159-172` — atraso, ventana y distribución de pesos.
- `labCon1Engine.js:106-144` y `labCon1Engine.js:211-224` — historial recortado, Win-Win y scores.
- `atRepEngine.js:269-349` — agregado PCI; contiene el bug de membresía detectado.
- `src/viewmodels/atRepViewModel.js:75-79` y `:99-109` — exclusión de 0/00 y contrato serializable.
- `atRepRenderer.js:309-320` y `:329-337` — un solo círculo visible; leyenda todavía dual.
- `package.json:6-13` — scripts de verificación ejecutados.
- `npm run test` — 163/163 tests passed.
- `npm run lint` — 5 errores por imports no usados en tests.
- `npm run build` — build completado con warning de chunk grande, sin fallos.