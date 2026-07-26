# 🧠 WINWIN ROULETTE TRACKER: BLUEPRINT LÓGICO v2.0 (ORION ENGINE)

Este documento resume la arquitectura de inteligencia, los modelos matemáticos y la lógica de decisión implementada en el proyecto WinWin Roulette Tracker bajo el motor **ORION**.

---

## 1. 🏗️ ESTRUCTURA DEL SISTEMA (AISLAMIENTO MODULAR)
El sistema opera bajo una **Arquitectura de Aislamiento Total**:
- **Core Estable**: Los módulos de Tracker, WinWin, Stats y Series son independientes y prioritarios.
- **ORION (Módulo Pasivo)**: Funciona como un observador externo. Lee datos pero no puede bloquear la ejecución de los módulos core.
- **Seguridad en Cascada**: Cada componente de la UI está aislado en contenedores `try/catch` para garantizar que un fallo en la IA no detenga la captura de datos o el análisis estadístico base.

---

## 2. 🎯 EL MOTOR ORION (TRIANGULACIÓN)
El núcleo de la toma de decisiones cruza cuatro ejes para generar una **Matriz de Oportunidad**:
1. **Eje Estratégico (Series)**: Análisis de 9 Series Maestras (S_1 a S_73) y sus atrasos netos.
2. **Eje Matemático (Bias)**: Integración del Sesgo CHI-Cuadrado (df=37) y Anomalías del Intervalo de Wilson.
3. **Eje Físico (Cilindro)**: Análisis de sectores fríos y densidad de la serie en el orden `AMERICAN_WHEEL_ORDER`.
4. **Eje Adaptativo (Cold Start)**: Priorización de Docenas/Columnas/Chances Sencillas cuando el historial es < 30 tiradas.

---

## 3. 🌋 ANALIZADOR DE CAOS vs FIRMA
Sistema de detección de la "Firma del Crupier" basado en la **Varianza de Saltos**:
- **FIRMA (Varianza < 15)**: Alta jugabilidad física. El crupier es consistente.
- **NORMAL (Varianza 15-40)**: Equilibrio entre azar y técnica.
- **CAOS (Varianza > 40)**: Ruleta dispareja. Los saltos son erráticos e impredecibles.
- **ALERTA DE TRANSICIÓN**: El sistema notifica instantáneamente cuando la Firma se rompe.

---

## 4. 📈 GESTIÓN DE PROGRESIONES Y APRENDIZAJE
El sistema no solo propone números, sino **métodos de ejecución**:
- **Shadow Testing**: Todas las estrategias (Martingala, D'Alembert, Paroli, Plana) corren en segundo plano.
- **Performance Index**: Cada estrategia gana o pierde puntos según su éxito simulado en la sesión.
- **Recomendación Táctica**: Cada oportunidad de la matriz incluye la estrategia que mejor está "leyendo" la mesa actualmente.

---

## 5. 💰 CONVERSACIÓN CON KELLY (BANKROLL)
La Matriz de Oportunidad exporta señales al KellyManager:
- **Score de Confluencia**: Se traduce en una fracción de Kelly (0 a 1).
- **Inversión Proporcional**: Kelly ajusta el tamaño de la ficha según la confianza de ORION.
- **Matriz de Riesgo**: Clasificación de señales en `CRITICAL`, `STABLE` y `SPECULATIVE`.

---

## 📜 REGLAS DE ORO DE DESARROLLO (MODULARIDAD)

Para garantizar la estabilidad a largo plazo, todo desarrollo debe seguir estas reglas:
1. **Inmutabilidad del Core**: Un módulo funcional y aprobado (ej: WinWin, Tracker) **no puede ser modificado** por un nuevo módulo. Solo se permite la lectura de sus datos.
2. **Desacoplamiento Total**: La comunicación entre módulos se realiza exclusivamente mediante métodos públicos (`API`). Ningún módulo puede alterar variables internas de otro.
3. **Fallo Aislado**: Si un módulo experimental (ej: ORION) tiene un error, debe fallar de forma silenciosa y aislada sin afectar el flujo de los módulos estables.
4. **Arquitectura Plug-and-Play**: Los nuevos módulos deben diseñarse como "complementos" que se conectan al sistema, no como parches que se integran en el código existente.

---
*Documento generado por Antigravity para WinWin Roulette Tracker.*
