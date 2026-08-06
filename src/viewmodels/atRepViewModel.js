/**
 * atRepViewModel.js — ViewModel para AtRep (Atracción / Repulsión).
 *
 * Prepara un contrato serializable para el renderer.
 * No toca DOM. No accede a persistencia. No contiene lógica estadística.
 *
 * Uso:
 *   import { createAtRepViewModel } from './atRepViewModel.js';
 *   const vm = createAtRepViewModel(engine, activeSets);
 *   // vm es un objeto plano, serializable, seguro para tests
 */

import { SUBCONJUNTOS, UNIVERSO_RULETA } from '../../atRepEngine.js';

// ── Constantes de tono visual ─────────────────────────────
export const TONE = Object.freeze({
  ATTRACTION: 'attraction',
  REPULSION: 'repulsion',
  CSR: 'csr',
  INSUFFICIENT: 'insufficient',
  WARNING: 'warning',
  SUCCESS: 'success'
});

// ── Textos seguros (lenguaje descriptivo, no predictivo) ──
export const LABELS = Object.freeze({
  HEADER_TITLE: 'AtRep',
  HEADER_SUBTITLE: 'Atracción / Repulsión',
  REFERENCE_TEXT: 'Basado en: core/AtRep.md · Función K de Ripley · g(r) · PCI',
  DISCLAIMER: 'Lectura descriptiva de la ventana activa. No predice próximos resultados.',
  PCI_TOOLTIP: 'PCI descriptivo. No implica probabilidad futura.',
  TOTAL_SPINS: 'Total Spins',
  MUESTRA_ACTIVA: 'Muestra Activa',
  CONJUNTOS: 'Conjuntos',
  MAYOR_AGRUPAMIENTO: 'Mayor agrupamiento observado',
  MAYOR_SEPARACION: 'Mayor separación observada',
  SCORES_SECTION: 'Scores descriptivos por número (PCI — Par Correlation Index)',
  SET_DETAILS: 'Detalles de Conjuntos (Atracción / Repulsión)',
  INTERSECCIONES: 'Intersecciones con mayor desviación descriptiva',
  LECTURA_DESCRIPTIVA: 'Lectura descriptiva',
  SELECTOR_TITLE: 'Seleccionar Conjuntos',
  SIN_DATOS: 'Sin datos suficientes',
  NO_INTERSECCIONES: 'No se encontraron intersecciones con datos suficientes. Agrega más conjuntos.'
});

/**
 * Crea el ViewModel serializable para AtRep.
 *
 * @param {object} engine — Instancia de AtRepEngine (ya con refresh() ejecutado)
 * @param {string[]} activeSets — Nombres de conjuntos activos
 * @param {object} [options] — Opciones adicionales
 * @param {string} [options.disclaimer] — Texto de disclaimer (default: LABELS.DISCLAIMER)
 * @param {string} [options.pciTooltip] — Texto tooltip PCI (default: LABELS.PCI_TOOLTIP)
 * @returns {object} Contrato serializable
 */
export function createAtRepViewModel(engine, activeSets, options = {}) {
  const disclaimer = options.disclaimer || LABELS.DISCLAIMER;
  const pciTooltip = options.pciTooltip || LABELS.PCI_TOOLTIP;

  // ── Obtener datos del engine ────────────────────────────
  const spins = engine._spins || [];
  const totalSampleSize = engine._totalSampleSize || 0; // ← total real de la BD
  const maxWindow = engine._windowSize || 100;
  const muestraActiva = spins.length; // ← lo que cabe en la ventana

  // Top K configurable desde Ajustes_vito
  const settings = engine.domainTracker ? engine.domainTracker.getSettings() : {};
  const topK = settings.atRepTopK || 5;

  const summary = engine.getGlobalSummary(activeSets);
  const scores = engine.getNumeroScores(activeSets);
  const { setDetails } = engine.getSetDetails(activeSets);
  const intersections = engine.buscarInterseccionesOptimas(activeSets, 5);

  // ── Top números (excluyendo 0 y 00) ──────────────────────
  const withPci = scores.filter(s => s.pci !== null && s.pci > 1.05 && String(s.number) !== '0' && String(s.number) !== '00');
  const topAttraction = [...withPci].sort((a, b) => b.pci - a.pci).slice(0, topK);
  const topRepulsion = scores.filter(s => s.pci !== null && s.pci < 0.95 && String(s.number) !== '0' && String(s.number) !== '00')
    .sort((a, b) => a.pci - b.pci).slice(0, topK);

  // ── Grid de scores por número ────────────────────────────
  const scoreGrid = scores.map(s => {
    let tone;
    if (s.pci === null) {
      tone = TONE.INSUFFICIENT;
    } else if (s.pci > 1.05) {
      tone = TONE.ATTRACTION;
    } else if (s.pci < 0.95) {
      tone = TONE.REPULSION;
    } else {
      tone = TONE.CSR;
    }

    const label = s.number === '00' ? '00' : String(s.number);
    const ariaLabel = s.pci !== null
      ? `Número ${label}, PCI ${s.pci.toFixed(3)}, ${s.verdict}. ${pciTooltip}`
      : `Número ${label}. ${LABELS.SIN_DATOS} (${s.occurrences || 0} ocurrencias)`;

    return {
      number: s.number,
      label,
      pci: s.pci,
      verdict: s.verdict,
      tone,
      pciFormatted: s.pci !== null ? s.pci.toFixed(3) : null,
      individualPci: s.individualPci,
      groupPci: s.groupPci,
      occurrences: s.occurrences || 0,
      ariaLabel
    };
  });

  // ── Summary cards ────────────────────────────────────────
  const summaryCards = [
    {
      id: 'totalSpins',
      label: LABELS.TOTAL_SPINS,
      value: totalSampleSize,
      tone: TONE.WARNING
    },
    {
      id: 'activeSample',
      label: LABELS.MUESTRA_ACTIVA,
      value: muestraActiva,
      detail: `ventana: ${maxWindow}`,
      tone: TONE.SUCCESS
    },
    {
      id: 'sets',
      label: LABELS.CONJUNTOS,
      value: activeSets.length,
      detail: `${summary.attraction} agrupamiento · ${summary.repulsion} separación`,
      tone: TONE.WARNING
    },
    {
      id: 'observedGrouping',
      label: LABELS.MAYOR_AGRUPAMIENTO,
      items: topAttraction.map(s => ({
        number: s.number,
        label: s.number === '00' ? '00' : String(s.number),
        pci: s.pci,
        pciFormatted: s.pci.toFixed(2)
      })),
      tone: TONE.ATTRACTION
    },
    {
      id: 'observedSeparation',
      label: LABELS.MAYOR_SEPARACION,
      items: topRepulsion.map(s => ({
        number: s.number,
        label: s.number === '00' ? '00' : String(s.number),
        pci: s.pci,
        pciFormatted: s.pci.toFixed(2)
      })),
      tone: TONE.REPULSION
    }
  ];

  // ── Set details con labels seguros ───────────────────────
  const setDetailsVM = setDetails.map(d => {
    const isAttr = d.pci !== null && d.pci > 1.05;
    const isRep = d.pci !== null && d.pci < 0.95;
    return {
      label: d.label,
      occurrences: d.occurrences,
      meanDist: d.meanDist,
      expectedDist: d.expectedDist,
      pci: d.pci,
      verdict: d.verdict || '—',
      tone: isAttr ? TONE.ATTRACTION : isRep ? TONE.REPULSION : TONE.CSR,
      meanDistFormatted: d.meanDist !== null ? d.meanDist.toFixed(1) + 'g' : '—',
      expectedDistFormatted: d.expectedDist !== null ? d.expectedDist.toFixed(1) + 'g' : '—',
      pciFormatted: d.pci !== null ? d.pci.toFixed(3) : '—'
    };
  });

  // ── Intersecciones con labels seguros ────────────────────
  const intersectionsVM = intersections.map(inter => {
    const isAttr = inter.avgPci > 1.05;
    const isRep = inter.avgPci < 0.95;
    return {
      label: inter.label,
      numbers: inter.numbers,
      numbersDisplay: inter.numbers.slice(0, 6).join(', ')
        + (inter.numbers.length > 6 ? '...' : ''),
      count: inter.count,
      avgPci: inter.avgPci,
      avgPciFormatted: inter.avgPci.toFixed(3),
      verdict: inter.verdict,
      tone: isAttr ? TONE.ATTRACTION : isRep ? TONE.REPULSION : TONE.CSR
    };
  });

  // ── Selector de conjuntos (incluye series y sectores) ────
  const catalog = engine._allDefinitions && engine._allDefinitions.length > 0
    ? engine._allDefinitions : SUBCONJUNTOS;
  const setSelector = catalog.map(def => ({
    name: def.name,
    label: def.label,
    type: def.type || 'conjunto',
    selected: activeSets.includes(def.name)
  }));

  return {
    title: LABELS.HEADER_TITLE,
    subtitle: LABELS.HEADER_SUBTITLE,
    referenceText: LABELS.REFERENCE_TEXT,
    disclaimer,
    pciTooltip,
    summaryCards,
    scoreGrid,
    setDetails: setDetailsVM,
    intersections: intersectionsVM,
    setSelector,
    hasIntersections: intersectionsVM.length > 0,
    // Metadatos para debugging
    _meta: {
      totalSpins: totalSampleSize,
      muestraActiva,
      maxWindow,
      universoTamaño: UNIVERSO_RULETA.length,
      conjuntosActivos: activeSets.length,
      conjuntosAtraccion: summary.attraction,
      conjuntosRepulsion: summary.repulsion,
      conjuntosCSR: summary.csr,
      conjuntosInsuficientes: summary.insufficient
    }
  };
}
