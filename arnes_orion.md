# 📎 Arnés de contexto para el proyecto Orion

**Regla de sesión:** este es el primer archivo que debe leerse al comenzar una sesión.  
Después de este archivo, leer `contexto_orion.md`.

## 1️⃣ Hacia dónde vamos
- **Objetivo principal:** Reparar *Roulette Tracker Pro* para que sea totalmente funcional en el host local y ofrecer una experiencia de simulación de ruleta premium y visualmente impactante.
- **Metas intermedias:**
  - Configurar el entorno de desarrollo con Vite.
  - Garantizar que la UI cargue sin errores.
  - Validar la lógica de los motores (`LogicEngine`, `WinWinEngine`, `DAEngine`, etc.) y la persistencia de datos.
  - Añadir mejoras de usabilidad y estética premium (tema oscuro, micro‑animaciones, tipografía moderna).
  - **Refactorizar umbrales de alerta:** Migrar de umbrales planos globales (`atrasosLimit`, `atrasosCritical`, `atrasosMaxWindow`) a umbrales independientes por módulo (`moduleThresholds` con 6 módulos: docenas, columnas, suertesSencillas, sixenas, ceros, seriesSectores), con interfaz de acordeón en Ajustes_vito y persistencia en IndexedDB.
  - Mantener un respaldo previo al trabajo con rotación automática de 3 copias en `backup_orion/`.

## 2️⃣ Dónde estamos
- **Estado actual del proyecto** (a 22 jul 2026):
  - **`Lab_Con` (Laboratorio Analítico) rediseñado y funcional:**
    - Se reemplazaron las clases de Tailwind por estilos nativos, unificando la estética visual con la pestaña premium `ORION`.
    - Se implementó un "Tapete Estocástico" hiper-compacto, mini-barras de progreso de presión y filtros tipo píldora (`btn-outline`).
    - Se agregó una nueva sección de "Top Números Individuales Más Calientes" que destaca los 5 números individuales más probables en tiempo real.
    - Se corrigió un bug grave en `labEngine.js` donde los atrasos de conjuntos daban siempre 0; ahora lee e itera correctamente el historial directo de `RouletteTracker.spins`.
  - **Umbrales por módulo implementados (jul 22):**
    - `rouletteSettingsStore.js`: Nuevo esquema `moduleThresholds` con 6 módulos y migración automática desde campos planos (`atrasosLimit`/`atrasosCritical`/`atrasosMaxWindow` → todos los módulos).
    - `index.html`: Panel Ajustes_vito rediseñado con acordeón `<details>`/`<summary>` para los 6 módulos, cada uno con campos Límite, Crítico y Máximo.
    - `main.js`: DOM refs reemplazadas por objeto `MODULE_INPUTS`, `syncSettingsForm` y save handler adaptados a inputs por módulo.
    - `atrasosRenderer.js`: `buildWidgets` ahora recibe `(getStatsFactory, thresholds)` en vez de `(getDelayStats, settings)`. Cada widget (suertes, docenas, columnas, seisenas) usa sus propios `limit`, `critical` y `maxWindow`. Se eliminó un duplicado "Rojo" que era bug previo.
    - `labEngine.js`: Nuevo mapping `SET_TO_MODULE` para lookup de módulo por nombre de conjunto. `_getSetStats` usa `moduleThresholds[moduleKey].maxWindow` en vez del campo plano global.
  - El diseño modular de `Atrasos` funciona correctamente.
  - Compilación Vite y UI sin errores críticos (verificado con `npm run build` — 38 módulos, 394ms).
  - Backups periódicos guardados en `backup_orion/`.
- **Pendientes visibles:**
  - Probar la simulación con una mayor cantidad de datos reales en tiempo continuo para auditar el rendimiento del Laboratorio Analítico y los nuevos umbrales por módulo.
  - Expandir el diseño premium de ORION al resto de pestañas restantes si es necesario.
  - Explorar posibles mejoras en `labEngine.js` para usar módulos `ceros` y `seriesSectores` (actualmente usan maxWindow fijo=100).

## 3️⃣ Cómo podemos seguir avanzando
- **Próximos pasos inmediatos:**
  1. Abrir el navegador en `http://localhost:3000` y confirmar que la UI carga sin errores visuales.
  2. Probar el nuevo acordeón de Ajustes_vito: cambiar valores por módulo, guardar, recargar y verificar que persisten.
  3. Verificar que las tarjetas de atrasos en cada sección reflejan los umbrales correctos (límite, crítico, ventana de máximo histórico).
  4. Interactuar con los controles de simulación para detectar posibles excepciones o datos faltantes.
  5. Si aparecen errores, inspeccionarlos y corregir importaciones o lógica en los módulos JS.
- **Iteraciones posteriores:**
  - Añadir tests unitarios para los motores de lógica.
  - Implementar un tema oscuro avanzado y micro‑animaciones (usar CSS variables, `@keyframes`).
  - Documentar la arquitectura en un `README.md` con instrucciones de despliegue y uso.
  - Preparar un script de `build` y generar una versión estática para despliegue.
- **Mantenimiento continuo:**
  - Mantener actualizado `package.json` y ejecutar `npm audit fix` regularmente.
  - Ejecutar `./backup_orion.sh` antes de cambios y conservar solo los 3 respaldos más recientes.
  - Guardar este arnés actualizado en `arnes_orion.md` y referenciarlo en cada sesión de desarrollo.
  - Considerar `contexto_orion.md` como la segunda lectura obligatoria de la sesión.
- **Regla de confirmación**: antes de cualquier cambio destructivo, refactorización, escritura de archivos o acción irreversible, **pedir confirmación al usuario**. No ejecutar sin consentimiento explícito.

---
**Nota:** Cada vez que avances, actualiza este archivo con la información más reciente para que siempre tengas a mano respuestas claras a las tres preguntas clave.
