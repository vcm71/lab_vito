# Contexto del Proyecto ORION Roulette - V5.5 (14 de Mayo 2026)

**Documento heredado.** La lectura canónica de inicio de sesión es:
1. [arnes_orion.md](/home/shared/arnes_orion.md)
2. [contexto_orion.md](/home/shared/contexto_orion.md)

Este documento sirve como memoria persistente para el asistente IA. Resume la evolución técnica y las capacidades críticas del sistema tras la gran actualización de Mayo.

## 🕹️ El Sistema ORION V5.5
ORION ha evolucionado a una plataforma de análisis de **Firma de Crupier (Dealer Signature)** y análisis de tendencias en tiempo real.

### Arquitectura de Datos y Persistencia
- **Persistencia Blindada**: Se eliminó la dependencia de `sessionId`. Los datos se guardan bajo la clave global `roulette_spins_v5`.
- **Formato Ultra-Compacto**: Las tiradas se almacenan como arrays `[number, timestamp, dealer_id]` para optimizar el espacio del navegador (soporta +5,000 registros).
- **Rastreo de Firma**: Cada registro incluye el nombre del crupier, mesa y casino para detectar sesgos mecánicos por operador.

## 🎨 Interfaz de Usuario Profesional (UI)
El Dashboard se ha reconfigurado para un entorno de alta concentración:
- **Alineación Táctica**: Aplicación alineada a la **izquierda**, optimizando el espacio visual para herramientas auxiliares.
- **Header Integrado**: La navegación (pestañas) se trasladó del footer al cabezal superior para maximizar el área de datos vertical.
- **Visualización Limpia**: Eliminados los fondos sólidos del paño; implementación de estilo Glassmorphism.
- **Historial Táctico**: Etiquetas traducidas a **Menor/Mayor** (1-18 / 19-36).
- **Atrasos Independiente**: La pestaña `Atrasos` usa solo la sección `ATRASOS` de `Ajustes` para `Límite alcanzado`, `Crítico` y `Máximo (últimos N)`.

## 🧪 Motor de Análisis y Validación
- **Sincronización de Ventana (Window Sync)**: Los módulos **Series** y **Tester** comparten selectores de muestra (`Total`, `100`, `200`).
- **Cronología de Precisión**: Gráficos etiquetados con IDs reales de tirada (`T5590`, `T5591...`).
- **Foco en lo Actual**: Los gráficos de 100/200 muestras se centran automáticamente en los últimos 20 aciertos para detectar cambios de tendencia inmediatos.

## 🛡️ Seguridad y Respaldo
- **Backup Maestro**: Script `backup_full_orion.sh` operativo con subida a Google Drive vía `rclone`.
- **Último hito de estabilización**: 14-May-2026 06:10 (local) - Implementada sincronización perfecta entre Tomador y Ajustes.

## 🚀 Próximos Pasos (Roadmap Actualizado)
- [ ] Implementar un módulo de auditoría de Crupier para agrupar estadísticas por nombre de operador.
- [ ] Desarrollar un endpoint de API para sincronización remota (Backend) para 1,000 usuarios concurrentes.
- [ ] Optimizar el renderizado del historial para gestionar desplazamientos fluidos en bases de datos de +10,000 giros.

---
**Instrucción para el próximo modelo:** Este proyecto prioriza la precisión de los datos y la agilidad visual. No añadir placeholders; siempre usar `generate_image` para activos visuales y mantener la sincronización entre el Tomador y los Ajustes.
