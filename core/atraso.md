# Prompt para Google Antigravity: Pestaña "Atrasos" v3 (Alertas Dinámicas de Color en Apuestas Externas)

Actúa como un desarrollador Full-Stack experto integrado en Google Antigravity. Necesito actualizar el componente de la pestaña **"Atrasos"** en nuestro proyecto **Roulette Tracker** en `localhost`. 

El objetivo es añadir una capa de **Alertas Visuales por Código de Color** en los círculos de atraso, aplicando de forma estricta las reglas basadas en la configuración de parámetros y límites establecidos.

## 🎨 Reglas de Color Dinámico para los Círculos de Atraso

Las alertas cromáticas se aplicarán **exclusivamente a las apuestas externas** (Docenas, Columnas, Rojo/Negro, Par/Impar, Falta/Pasa). *No debes considerar ni aplicar estas alertas a las Series/Sectores (S0, S1, S12, etc.)*.

Modifica el renderizado de los círculos de la siguiente manera:

1. **Estado Normal (Gris/Por defecto):** El círculo mantiene su color neutro de fondo mientras el atraso esté por debajo de su límite correspondiente.
2. **Estado de Alerta Inicial (Color Naranjo):** El color del círculo de atraso debe cambiar automáticamente a **Naranjo** cuando el valor del atraso alcance de forma exacta el límite paramétrico definido para esa apuesta externa (por ejemplo, el límite configurado para Docenas/Columnas o Suertes Sencillas).
3. **Estado de Alerta Crítica (Color Rojo):** De forma prioritaria y absoluta, cuando el atraso de **cualquiera** de las apuestas externas alcance o supere el valor de **9**, el círculo de atraso debe cambiar inmediatamente a **Rojo**.

## ⚙️ Integración con los Límites y Mapeo del 00

- Sigue leyendo de forma dinámica el **00** de la Ruleta Americana, el cual incrementa el atraso de todas las suertes sencillas, docenas y columnas cuando sale, ya que no pertenece a ninguna de estas categorías de apuestas externas.
- Vincula los umbrales de activación de la alerta naranja directamente con los valores límite del objeto de configuración global de la aplicación (los parámetros mostrados en el panel de control de límites).

Por favor, actualiza los estilos reactivos del frontend en el mapeo de los badges de apuestas externas y compila los cambios en el servidor local.
