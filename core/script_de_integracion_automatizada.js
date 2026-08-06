/**
 * Orion - Automated Laboratory Integration Script (Node.js)
 * Realiza parches seguros en index.html y main.js con backups automáticos en entorno Vite.
 */

import fs from 'fs';
import path from 'path';

const BACKUP_DIR = './backup_orion';
const INDEX_PATH = './index.html';
const MAIN_PATH = './main.js';

// Asegurar existencia del directorio de backups
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function backupFile(filepath) {
    if (fs.existsSync(filepath)) {
        const filename = path.basename(filepath);
        const timestamp = Date.now();
        const backupPath = path.join(BACKUP_DIR, `${filename}.${timestamp}.bak`);
        fs.copyFileSync(filepath, backupPath);
        console.log(`[BACKUP] Copia de seguridad creada para ${filename} en: ${backupPath}`);
    } else {
        console.error(`[ERROR] Archivo no encontrado para backup: ${filepath}`);
        process.exit(1);
    }
}

function patchIndexHtml() {
    console.log('[INDEX.HTML] Iniciando parche...');
    backupFile(INDEX_PATH);
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    // 1. Inyectar botón de pestaña si no existe
    if (!html.includes('id="tab-lab"')) {
        const tabAnchor = html.match(/<button id="tab-atrasos"[\s\S]*?<\/button>/);
        if (tabAnchor) {
            const newTabButton = `\n                <button id="tab-lab" class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-all duration-150">
                    Laboratorio Conjuntos
                </button>`;
            html = html.replace(tabAnchor[0], `${tabAnchor[0]}${newTabButton}`);
            console.log('[INDEX.HTML] Botón "tab-lab" inyectado con éxito.');
        } else {
            console.warn('[INDEX.HTML] Advertencia: No se encontró el botón "tab-atrasos" para anclaje.');
        }
    } else {
        console.log('[INDEX.HTML] El botón "tab-lab" ya está presente.');
    }

    // 2. Inyectar contenedor de vista
    if (!html.includes('id="view-lab"')) {
        const viewAnchor = html.match(/<div id="view-atrasos"[\s\S]*?<\/div>([\s]*?<\/div>)/);
        if (viewAnchor) {
            const newViewDiv = `\n            <div id="view-lab" class="hidden tab-view">
                <!-- Montado dinámico de la UI de Teoría de Conjuntos por labRenderer -->
            </div>`;
            html = html.replace(viewAnchor[0], `${viewAnchor[0]}${newViewDiv}`);
            console.log('[INDEX.HTML] Contenedor "view-lab" inyectado con éxito.');
        } else {
             const mainCloseAnchor = html.indexOf('</main>');
             if (mainCloseAnchor !== -1) {
                 const newViewDiv = `\n            <div id="view-lab" class="hidden tab-view"></div>`;
                 html = html.slice(0, mainCloseAnchor) + newViewDiv + html.slice(mainCloseAnchor);
                 console.log('[INDEX.HTML] Contenedor "view-lab" inyectado mediante fallback.');
             }
        }
    } else {
        console.log('[INDEX.HTML] El contenedor "view-lab" ya está presente.');
    }

    fs.writeFileSync(INDEX_PATH, html, 'utf8');
}

function patchMainJs() {
    console.log('[MAIN.JS] Iniciando parche...');
    backupFile(MAIN_PATH);
    let mainJs = fs.readFileSync(MAIN_PATH, 'utf8');

    // 1. Inyectar importación de LabRenderer al inicio
    if (!mainJs.includes("import { LabRenderer } from './labRenderer.js'")) {
        const importStatement = `import { LabRenderer } from './labRenderer.js';\n`;
        mainJs = importStatement + mainJs;
        console.log('[MAIN.JS] Importación de LabRenderer inyectada.');
    }

    // 2. Inyectar instanciación e inicialización
    if (!mainJs.includes('new LabRenderer')) {
        const initializationMarker = mainJs.match(/(const\s+rouletteTracker\s*=\s*new\s*RouletteTracker\([\s\S]*?\);?)/);
        if (initializationMarker) {
            const initCode = `\n\n// Inicialización del Laboratorio Analítico de Teoría de Conjuntos\nconst labRenderer = new LabRenderer('view-lab', rouletteTracker);\nlabRenderer.init();\n\n// Sincronización en tiempo real ante eventos de actualización del tracker\nif (typeof rouletteTracker.on === 'function') {\n    rouletteTracker.on('update', () => labRenderer.update());\n} else {\n    const originalAddNumber = rouletteTracker.addNumber;\n    if (originalAddNumber) {\n        rouletteTracker.addNumber = function(...args) {\n            const res = originalAddNumber.apply(this, args);\n            labRenderer.update();\n            return res;\n        };\n    }\n}`;
            mainJs = mainJs.replace(initializationMarker[0], `${initializationMarker[0]}${initCode}`);
            console.log('[MAIN.JS] Lógica de inicialización acoplada.');
        } else {
            console.error('[MAIN.JS] Error crítico: No se encontró la instanciación de "RouletteTracker".');
            process.exit(1);
        }
    } else {
        console.log('[MAIN.JS] La lógica de LabRenderer ya se encuentra inicializada.');
    }

    // 3. Modificar lógica de pestañas (routing SPA nativo)
    if (!mainJs.includes("tab-lab") && mainJs.includes("tab-atrasos")) {
        const tabHandlerRegex = /(const\s+tabs\s*=\s*\[[\s\S]*?\])/;
        const tabsMatch = mainJs.match(tabHandlerRegex);
        if (tabsMatch) {
            const updatedTabs = tabsMatch[0].replace(']', ", 'tab-lab']");
            mainJs = mainJs.replace(tabsMatch[0], updatedTabs);
            console.log('[MAIN.JS] Registrada pestaña "tab-lab" en el array de control.');
        } else {
            const manualTabBinder = `\n\n// Manejo de visibilidad de la pestaña del Laboratorio\ndocument.getElementById('tab-lab')?.addEventListener('click', () => {\n    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));\n    document.getElementById('view-lab')?.classList.remove('hidden');\n    document.querySelectorAll('.tab-btn || button').forEach(btn => btn.classList.remove('border-slate-900', 'text-slate-900'));\n    document.getElementById('tab-lab')?.classList.add('border-slate-900', 'text-slate-900');\n    labRenderer.update();\n});`;
            mainJs += manualTabBinder;
            console.log('[MAIN.JS] Enlace de evento de clic inyectado.');
        }
    }

    fs.writeFileSync(MAIN_PATH, mainJs, 'utf8');
}

try {
    patchIndexHtml();
    patchMainJs();
    console.log('\n[ÉXITO] El Laboratorio Analítico de Conjuntos ha sido integrado nativamente.');
} catch (err) {
    console.error('\n[ERROR] Error durante la ejecución del parche automático:', err);
    process.exit(1);
}