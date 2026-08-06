# 🧠 Blueprint Técnico: Motor ORION (Versión Cuantitativa)

## 1. Arquitectura de Puntuación (Scoring)
El motor ORION utiliza una función de agregación multi-señal parametrizada. Cada característica (feature) se normaliza individualmente antes de ser ponderada.

### Función de Normalización Tanh
Se utiliza la función tangente hiperbólica para acotar todas las señales al rango `[-1, 1]`. Esto evita la saturación por outliers (ej. un atraso infinito) y permite una confluencia de evidencia equilibrada.
$$S_n = \tanh\left(\frac{V_n}{Scale}\right)$$

## 2. Configuración de Pesos (Weights)
Los pesos han sido validados mediante Monte Carlo (5,000 iteraciones) para maximizar la Precisión:
- **Z-Score de Frecuencia (30%)**: Detecta números calientes.
- **Rareza por Ausencia (25%)**: Detecta atrasos logarítmicos.
- **Anomalía Chi-Cuadrado (20%)**: Valida la ruptura de la entropía.
- **Dealer Jump (15%)**: Detecta firmas físicas de lanzamiento.
- **Runs Test (10%)**: Detecta clustering o alternancia.

## 3. Umbrales de Decisión (Thresholds)
- **Edge (0.85)**: Nivel de entrada. Indica una anomalía estadística probable.
- **Strong Edge (0.95)**: Nivel de confianza crítica. Probabilidad de azar < 5%.
- **Ventana Mínima (50 tiradas)**: Por debajo de este umbral, el error estándar es demasiado alto para una decisión fiable.

## 4. Resultados de Validación Monte Carlo
Bajo H0 (Ruleta Uniforme Perfecta):
- **Media Edge Score**: 0.13 - 0.21
- **95th Percentile (p95)**: 0.94 - 0.95
- **FPR (False Positive Rate)**: **5.0%**

Bajo H1 (Sesgo de 5%):
- **TPR (True Positive Rate)**: > 70% (en ventanas de 200+ tiradas).
- **Precisión Global**: ~75%.

## 5. Limitaciones Conocidas
- **Masa Crítica**: El motor requiere al menos 50 tiradas para que el Chi-cuadrado tenga validez estadística.
- **Varianza de Corto Plazo**: En ventanas < 20, el sistema puede ignorar sesgos reales para proteger la tasa de Falsos Positivos.

---
*Documento generado por el Principal Software Engineer / Quantitative Analyst.*
