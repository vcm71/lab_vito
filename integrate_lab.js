/**
 * Orion - Automated Laboratory Integration Script (Node.js)
 * Versión Enterprise con Autolimpieza de Desvíos Nominales de Plataforma.
 */

import fs from 'fs';
import path from 'path';

const BACKUP_DIR = './backup_orion';
const INDEX_PATH = './index.html';
const MAIN_PATH = './main.js';

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

function cleanupResidualFiles() {
    console.log('[CLEANUP] Buscando archivos residuales para purga...');
    const targets = [
        './controlador_de_la_vista_lab.js',
        './motor_matematico_de_conjuntos.js',
        './script_de_integracion_robusto.js',
        './script_de_integracion.js',
        "./'node integrate_lab.js'",
        './node integrate_lab.js'
    ];

    targets.forEach(target => {
        const fullPath = path.resolve(target);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`[CLEANUP] Archivo residual eliminado con éxito: ${target}`);
            } catch (err) {
                console.warn(`[CLEANUP] No se pudo eliminar el archivo residual: ${target}. Error: ${err.message}`);
            }
        }
    });
}

function patchIndexHtml() {
    console.log('[INDEX.HTML] Iniciando parche...');
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
    console.log('[MAIN.JS] Iniciando análisis dinámico...');
    let mainJs = fs.readFileSync(MAIN_PATH, 'utf8');

    // 1. Limpiar importaciones erróneas previas de controladores traducidos si existen
    if (mainJs.includes("from './controlador_de_la_vista_lab.js'")) {
        mainJs = mainJs.replace(/import\s*\{\s*LabRenderer\s*\}\s*from\s*['"]\.\/controlador_de_la_vista_lab\.js['"];?\s*\n?/g, '');
        console.log('[MAIN.JS] Removida importación desactualizada de "controlador_de_la_vista_lab.js".');
    }

    // 2. Inyectar importación canónica de LabRenderer al inicio
    if (!mainJs.includes("import { LabRenderer } from './labRenderer.js'")) {
        const importStatement = `import { LabRenderer } from './labRenderer.js';\n`;
        mainJs = importStatement + mainJs;
        console.log('[MAIN.JS] Importación de LabRenderer añadida al inicio.');
    }

    // 3. Localizar la instanciación de RouletteTracker mediante regex flexible
    const trackerRegex = /(?:const|let|var|window\.)\s*(\w+)\s*=\s*new\s+RouletteTracker\s*\(/i;
    const match = mainJs.match(trackerRegex);

    let trackerVariableName = null;
    let targetAnchor = null;

    if (match) {
        trackerVariableName = match[1];
        targetAnchor = match[0];
        console.log(`[MAIN.JS] Autodetectada la variable del tracker: "${trackerVariableName}"`);
    } else {
        const directInstantiationRegex = /new\s+RouletteTracker\s*\(/i;
        const directMatch = mainJs.match(directInstantiationRegex);
        if (directMatch) {
            targetAnchor = directMatch[0];
            console.log('[MAIN.JS] Detectada instanciación directa de RouletteTracker sin variable asignada.');
        }
    }

    // Inyectar el bloque de inicialización según el hallazgo
    if (targetAnchor) {
        const anchorIndex = mainJs.indexOf(targetAnchor);
        const endOfLineIndex = mainJs.indexOf('\n', anchorIndex);
        const insertionPoint = endOfLineIndex !== -1 ? endOfLineIndex : anchorIndex + targetAnchor.length;

        const before = mainJs.slice(0, insertionPoint);
        const after = mainJs.slice(insertionPoint);

        const varToUse = trackerVariableName || 'rouletteTracker';

        if (!mainJs.includes('new LabRenderer')) {
            const initCode = `\n\n// [Orion Lab] Inicialización segura del Laboratorio Analítico\nconst labRenderer = new LabRenderer('view-lab', ${varToUse});\nlabRenderer.init();\n\nif (typeof ${varToUse} !== 'undefined' && typeof ${varToUse}.on === 'function') {\n    ${varToUse}.on('update', () => labRenderer.update());\n} else {\n    console.warn('[Orion Lab] Event bus no encontrado, aplicando fallback por interceptación.');\n}`;
            mainJs = before + initCode + after;
            console.log('[MAIN.JS] Bloque de inicialización inyectado con éxito.');
        }
    } else {
        if (!mainJs.includes('new LabRenderer')) {
            console.log('[MAIN.JS] Aplicando mecanismo de Fallback Activo (Late Binding) al final de main.js');
            const fallbackCode = `\n\n// [Orion Lab - Fallback Activo]\n(() => {\n    const originalAdd = RouletteTracker.prototype.addNumber;\n    if (originalAdd) {\n        RouletteTracker.prototype.addNumber = function(...args) {\n            const res = originalAdd.apply(this, args);\n            if (window.labRendererInstance) {\n                window.labRendererInstance.update();\n            }\n            return res;\n        };\n    }\n    \n    document.addEventListener('DOMContentLoaded', () => {\n        const possibleTracker = window.rouletteTracker || window.tracker || window.rouletteTrackerInstance;\n        const labRenderer = new LabRenderer('view-lab', possibleTracker);\n        labRenderer.init();\n        window.labRendererInstance = labRenderer;\n    });\n})();`;
            mainJs += fallbackCode;
            console.log('[MAIN.JS] Fallback de interceptación inyectado correctamente.');
        }
    }

    // 4. Modificar navegación de pestañas (routing SPA)
    if (!mainJs.includes("tab-lab") && mainJs.includes("tab-atrasos")) {
        const tabHandlerRegex = /(const\s+tabs\s*=\s*\[[\s\S]*?\])/;
        const tabsMatch = mainJs.match(tabHandlerRegex);
        if (tabsMatch) {
            const updatedTabs = tabsMatch[0].replace(']', ", 'tab-lab']");
            mainJs = mainJs.replace(tabsMatch[0], updatedTabs);
            console.log('[MAIN.JS] Registrada pestaña "tab-lab" en el array de control.');
        } else {
            const manualTabBinder = `\n\n// [Orion Lab] Control de navegación para pestaña del Laboratorio\ndocument.getElementById('tab-lab')?.addEventListener('click', () => {\n    document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));\n    document.getElementById('view-lab')?.classList.remove('hidden');\n    document.querySelectorAll('.tab-btn || button').forEach(btn => btn.classList.remove('border-slate-900', 'text-slate-900'));\n    document.getElementById('tab-lab')?.classList.add('border-slate-900', 'text-slate-900');\n    if (window.labRendererInstance) window.labRendererInstance.update();\n});`;
            mainJs += manualTabBinder;
            console.log('[MAIN.JS] Enlace de navegación SPA inyectado al final.');
        }
    }

    fs.writeFileSync(MAIN_PATH, mainJs, 'utf8');
}

try {
    backupFile(INDEX_PATH);
    backupFile(MAIN_PATH);
    cleanupResidualFiles();
    patchIndexHtml();
    patchMainJs();
    console.log('\n[ÉXITO] El Laboratorio Analítico de Conjuntos ha sido integrado dinámicamente con resiliencia activa y purga de archivos residuales completa.');
} catch (err) {
    console.error('\n[ERROR] Fallo crítico durante el proceso de automatización:', err);
    process.exit(1);
}