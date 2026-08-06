# 🛠️ SKILL CARD: Respaldo y Restauración Total del Sistema ORION
**Identificador de Skill:** `orion-backup-restore`
**Entorno de Operación:** Linux (Bash) + Google Chrome (IndexedDB)
**Versión:** 1.0.0

---

## 🎯 Objetivo de la Skill
Capacidad para realizar respaldos integrales y restauraciones de alta fidelidad al 100% de la aplicación **ORION**, salvaguardando no solo el código fuente y las configuraciones del desarrollador, sino también los datos reales del usuario (historial de tiradas y configuraciones de sesión) alojados en la base de datos IndexedDB del navegador Google Chrome.

---

## 📋 Requisitos y Configuración Previa

1.  **Ruta de Base de Datos de Google Chrome**:
    *   La base de datos IndexedDB de Chrome para el origen local del servidor Vite debe estar ubicada en:
        `/home/wsoporte/.config/google-chrome/Default/IndexedDB/http_localhost_5173.indexeddb.leveldb`
2.  **Rclone (Google Drive)**:
    *   `rclone` debe estar configurado con un perfil llamado `gdrive` apuntando a la nube de copias de seguridad:
        `gdrive:/Backups`
3.  **Entorno Node.js**:
    *   `npm` y `node` instalados en el sistema para permitir la autocompilación y el servidor de desarrollo Vite.

---

## 💾 1. Sub-Skill: Respaldo Completo (`backup_full_orion.sh`)

### ⚡ Comando de Ejecución:
```bash
./backup_full_orion.sh
```

### 🔍 Flujo de Trabajo y Garantías de Seguridad:
1.  **Detección e Inyección de Base de Datos del Navegador**:
    *   Ubica el directorio `http_localhost_5173.indexeddb.leveldb` en tu perfil de Chrome.
    *   Copia los archivos a la carpeta temporal `chrome_database_backup` en el workspace.
    *   Purga de forma segura el archivo `LOCK` para evitar errores de bloqueo de base de datos durante la posterior compresión o descompresión.
2.  **Generación Dinámica de Metadatos (`backup_info.txt`)**:
    *   Registra fecha, hora, usuario ejecutor y el estado actual de Git (rama y último commit realizado).
3.  **Compresión Optimizada con Exclusión**:
    *   Comprime el workspace en un archivo `.tar.gz` con el formato `ORION_FULL_BACKUP_YYYY-MM-DD_HHMMSS.tar.gz`.
    *   **Exclusiones Estrictas** para mantener el tamaño liviano:
        *   `node_modules/` (Paquetes NPM regenerables).
        *   `.git/` (Historial Git).
        *   `dist/` (Bundles estáticos que se autocompilan al restaurar).
        *   `backup_Orion/` y otros temporales de backup (Evita bucles de compresión).
4.  **Subida Automática a Google Drive**:
    *   Sube de forma síncrona el archivo generado a la nube a través de `rclone copy`.
5.  **Rotación Inteligente (Máximo 7 Archivos)**:
    *   Ordena los respaldos locales antiguos y elimina los sobrantes que superen el límite de 7 archivos más recientes.

---

## 🔄 2. Sub-Skill: Restauración Inteligente (`recupera_Orionfull.sh`)

### ⚡ Comando de Ejecución:
```bash
./recupera_Orionfull.sh
```

### 🔍 Flujo de Trabajo y Garantías de Seguridad:
1.  **Menú Interactivo de Selección**:
    *   Lista los backups locales del más reciente al más antiguo indicando fecha y tamaño exacto.
    *   Si no se encuentran copias locales, permite conectarse a Google Drive para descargar la última copia automáticamente.
2.  **Control de Ejecución de Google Chrome**:
    *   Monitorea procesos activos de Google Chrome y solicita/fuerza su cierre para asegurar la descompresión sin corrupción de la base de datos `LevelDB`.
3.  **Limpieza Segura de Espacio de Trabajo**:
    *   Limpia el código viejo del sistema para evitar colisiones de archivos, pero **conserva obligatoriamente**:
        *   La carpeta `.git/` (Historial de cambios).
        *   La carpeta `backup_Orion/` (Tus copias de seguridad locales).
        *   La carpeta `node_modules/` (Librerías instaladas).
        *   Los propios scripts de respaldo y recuperación.
4.  **Inyección Directa en el Perfil de Chrome**:
    *   Vacía por completo el directorio IndexedDB de Chrome para `localhost:5173`.
    *   Copia los archivos restaurados desde `chrome_database_backup` en el perfil activo de Google Chrome.
    *   Limpia los temporales del código fuente para dejar el workspace reluciente.
5.  **Autocompilación Vite (`npm run build`)**:
    *   Ejecuta `npm run build` al terminar para asegurar que Vite compile las últimas actualizaciones en el bundle estático.

---

## 🛠️ Protocolo de Instrucción para Agentes de IA (Pair Programming)

Si eres un asistente de Inteligencia Artificial que ha tomado el control de esta sesión, sigue estas instrucciones sin excepción para realizar cambios de forma segura:

1.  **Antes de realizar cambios destructivos o refactorizaciones**:
    *   Ejecuta siempre el comando de respaldo:
        `bash backup_full_orion.sh`
    *   Verifica que termine con el código de salida `0` y la subida exitosa.
2.  **Si una actualización de código causa una regresión o mal funcionamiento**:
    *   Ejecuta el script de recuperación:
        `bash recupera_Orionfull.sh`
    *   Selecciona la versión `0` (el último respaldo generado antes del cambio) para restaurar el estado completamente funcional en segundos.
3.  **Preservación de Permisos**:
    *   Asegúrate de que ambos scripts mantengan permisos de ejecución correctos:
        `chmod +x backup_full_orion.sh recupera_Orionfull.sh`
