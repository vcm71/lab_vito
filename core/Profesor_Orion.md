# 🎓 Bitácora del Profesor_Orion

Este archivo contiene la sabiduría acumulada, las reglas de oro y el progreso técnico del framework ORION v4.

---

## 📜 Reglas de Oro Establecidas
1. **Identidad:** El asistente siempre actuará bajo el nombre de **Profesor_Orion**.
2. **Persistencia:** Todas las lecciones y cambios arquitectónicos deben quedar registrados en este documento.
3. **Ciencia sobre Suerte:** No se validan números por "intuición", sino por **Límite Inferior de Wilson** y **SPRT**.
4. **Prioridad de Fluidez:** El ingreso de datos debe ser siempre instantáneo; los cálculos pesados deben ser asíncronos (Debouncing).

---

## 📚 Lecciones y Progreso Técnico

### [2026-05-04] - Lección 1: El Marco de Validación Monte Carlo v4
- **Logro:** Migración exitosa del motor de validación. Ahora medimos el **FPR** (Falsos Positivos) y el **TPR** (Sensibilidad).
- **Herramienta:** Implementación del **Mapa de Calor de Sectores**. Permite visualizar físicamente dónde cae la bola durante las pruebas de sesgo $H_1$.
- **Conclusión:** Una racha aislada en un número sin impacto en sus vecinos es probablemente azar ($H_0$). Un sesgo real en el cilindro debe mostrar una "mancha" de calor en el sector físico de la rueda.

### 🛠️ Configuración de Calibración Actual
- **Umbral de Confianza:** 0.95 (Wilson Score).
- **Multiplicador de Sensibilidad:** 18x (Equilibrio entre detección y falsas alarmas).
- **Ventana de Análisis:** 100 giros para detección de sesgo dinámico.

### [2026-05-04] - Lección 2: Adaptabilidad y Sesgo Dinámico (Drift)
- **Logro:** Reactivación de la fase de Drift en Monte Carlo.
- **Teoría:** El Drift simula una ruleta que se descalibra *mientras* juegas. La probabilidad del número objetivo sube linealmente del 2.6% ($H_0$) al 15% ($H_1$).
- **Métrica Clave:** **TPR (Drift)**. Un valor $> 50\%$ indica que el motor detecta cambios de tendencia antes de que el capital se agote.
- **Regla de Oro:** *"Un motor que no detecta el cambio, es un motor que será vencido por el dealer."*

### [2026-05-04] - Lección 3: El Filtro de Exceso (Eliminando el FPR)
- **Logro:** Implementación del **Filtro Profesor_Orion**.
- **Teoría:** En lugar de escalar la probabilidad absoluta, escalamos solo el **exceso sobre el azar** (Probabilidad - 2.63%).
- **Regla de Oro:** *"Si el límite de Wilson no supera el 2.63%, la señal no existe."* Esto debería bajar el FPR drásticamente.

---

*“La ruleta no es un juego de azar, es un campo de batalla de probabilidades.” — Profesor_Orion*
