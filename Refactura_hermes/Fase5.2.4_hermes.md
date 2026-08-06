# ORION REFACTOR
# ETAPA 2
# FASE 5.2.4
# PREPARACIÓN DE CONSUMIDORES PARA LA INVERSIÓN DEL OWNERSHIP

## Contexto

La Fase 5.2.3 concluyó mediante una reauditoría independiente que `RouletteTracker` implementa el contrato funcional requerido para la gestión de Spins.

Resultado:

✔ Contrato funcional equivalente.

Sin embargo, la auditoría identificó dependencias de integración que impedirían invertir el ownership de forma segura.

Estas dependencias no pertenecen al dominio.

Pertenecen a los consumidores del dominio.

Esta fase elimina dichas dependencias.

NO modifica todavía el ownership.

---

# Objetivo

Preparar el sistema para que ningún componente dependa directamente de implementaciones internas del Legacy Tracker.

Al finalizar esta fase:

- los consumidores deberán utilizar APIs públicas;
- el dominio podrá convertirse en la futura fuente de verdad;
- el Legacy quedará preparado para actuar únicamente como adaptador de compatibilidad.

---

# Riesgos identificados en la Fase 5.2.3

R01

deleteSpin()/updateSpin() no atraviesan completamente TrackerSyncAdapter.

---

R02

WinWinEngine accede directamente a:

tracker._freq

---

R03

Pequeña diferencia en el tratamiento de metadatos.

Legacy:

valor raw

Domain:

valor || ''

---

R04

Existen referencias directas a:

this.tracker._freq

---

R05

Persistencia automática después de operaciones CRUD aún depende parcialmente del flujo Legacy.

---

R06

Existen Engines que aún consideran al Legacy Tracker como fuente principal.

---

# Objetivo técnico

Eliminar dependencias hacia:

- estado interno
- propiedades privadas
- caches internas
- detalles de implementación Legacy

Mantener únicamente dependencias hacia APIs públicas.

---

# Trabajo requerido

## 1.

Extender TrackerSyncAdapter.

Verificar que todas las operaciones relacionadas con Spins atraviesen el adaptador.

Como mínimo revisar:

- addSpin()
- deleteSpin()
- updateSpin()
- clear()
- import()
- cualquier otra operación equivalente.

No deben existir operaciones que actualicen solamente uno de los modelos.

---

## 2.

Auditar todos los Engines.

Buscar referencias a:

- this.tracker
- tracker._freq
- propiedades privadas
- estructuras internas Legacy

Migrarlas para consumir exclusivamente APIs públicas.

Ejemplos:

getSpins()

getHitMap()

getHistory()

o equivalentes del dominio.

No introducir APIs nuevas si ya existen equivalentes.

---

## 3.

Eliminar dependencias de _freq.

Si el dominio ya ofrece la información mediante:

getHitMap()

o equivalente,

reemplazar completamente los accesos a:

tracker._freq

No mantener ambas rutas.

---

## 4.

Persistencia.

Verificar que las operaciones CRUD realizadas desde el dominio disparen correctamente la persistencia correspondiente.

No duplicar persistencia.

No introducir persistencias paralelas.

Mantener una única infraestructura.

---

## 5.

Metadatos.

Unificar el comportamiento entre Legacy y Domain.

Eliminar pequeñas diferencias de representación cuando no sean necesarias.

No modificar el formato persistido.

No romper compatibilidad.

---

## 6.

Compatibilidad.

Verificar que continúe funcionando:

UI

↓

TrackerSyncAdapter

↓

Legacy Tracker

↓

RouletteTracker

La sincronización debe seguir siendo completa.

No invertir todavía el flujo.

---

# Restricciones

NO invertir el ownership.

NO eliminar Legacy Tracker.

NO eliminar TrackerSyncAdapter.

NO eliminar código Legacy.

NO modificar UI.

NO modificar HTML.

NO modificar CSS.

NO modificar Renderers.

NO introducir nuevas funcionalidades.

NO reorganizar archivos.

NO romper compatibilidad.

NO modificar comportamiento observable.

---

# Restricciones de arquitectura

Toda dependencia hacia Spins debe realizarse mediante APIs públicas.

No acceder a:

- propiedades privadas
- caches internas
- estructuras internas
- estado interno Legacy

No introducir nuevas dependencias entre capas.

Mantener separación entre:

Dominio

Infraestructura

Presentación

Engines

---

# Verificaciones

Comprobar:

✓ TrackerSyncAdapter sincroniza todas las operaciones CRUD.

✓ Ningún Engine utiliza _freq.

✓ Ningún Engine depende de estado interno Legacy.

✓ Persistencia permanece funcional.

✓ Hidratación permanece funcional.

✓ Compatibilidad completa.

✓ Build limpio.

Ejecutar obligatoriamente:

```bash
npm run build
```

La fase no puede finalizar con errores.

---

# Entregables

Generar:

```
reports/

FASE_5_2_4_CONSUMER_PREPARATION.md
```

Contenido mínimo:

1. Resumen ejecutivo

2. Riesgos abordados

3. Consumidores auditados

4. Cambios realizados

5. APIs públicas utilizadas

6. Dependencias Legacy eliminadas

7. Compatibilidad

8. Riesgos remanentes

9. Resultado del build

10. Recomendación

---

# Criterio de aceptación

La fase se considera completada únicamente si:

- ningún consumidor depende de propiedades internas del Legacy;
- todos los Engines consumen únicamente APIs públicas;
- TrackerSyncAdapter sincroniza todas las operaciones relevantes;
- la persistencia continúa siendo única y consistente;
- no existen regresiones funcionales;
- el proyecto compila sin errores.

---

# Criterio de salida

Al finalizar esta fase, el sistema deberá estar completamente desacoplado de las implementaciones internas del Legacy Tracker.

El único paso restante será cambiar la dirección del flujo de sincronización.

La siguiente fase será:

# ETAPA 2
# FASE 5.2.5
# INVERSIÓN DEL OWNERSHIP DE SPINS

Esta fase deberá limitarse a:

- convertir `RouletteTracker` en la única fuente de verdad;
- relegar al Legacy Tracker al rol de adaptador temporal de compatibilidad;
- mantener el comportamiento observable del sistema;
- validar la ausencia de regresiones mediante compilación y pruebas de integración.
