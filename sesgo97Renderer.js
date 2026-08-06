/**
 * Renderer para la pestaña 97_sesgo.
 * Diseño premium para visualización de sesgos físicos y auditoría estadística.
 */
import { RED_NUMBERS } from './src/utils/numberMeta.js';

export function Sesgo97(logicResult) {
  const container = document.getElementById('tab-97-sesgo');
  if (!container) return;

  if (!logicResult) {
    container.innerHTML = `
      <section class="panel">
        <div class="empty-msg">No hay suficientes datos para realizar el análisis de sesgo 97.</div>
      </section>
    `;
    return;
  }

  const { totalSpins, startRow, endRow, sectorSize, topSectorSize, expectedPerNumber, dualSesgo, rankingSectores, audit } = logicResult;

  let html = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 2rem;">
      <section class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;background:linear-gradient(145deg,#0f172a,#1e293b);border:1px solid rgba(251,191,36,0.18);">
        <div>
          <div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Pestaña Sesgo97</div>
          <div style="font-size:1rem;font-weight:800;color:#fbbf24;">Análisis de sesgo físico y auditoría estadística</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Muestra analizada</div>
          <div id="display-97-total-sample" style="font-size:1.25rem;font-family:var(--font-numbers);font-weight:800;color:#34d399;">${totalSpins}</div>
        </div>
      </section>
      
      <!-- ANALISIS_SESGO_DUAL -->
      <section class="panel" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b;">
        <h2 style="text-align: center; font-size: 1.1rem; color: #000; margin-bottom: 0.25rem; font-weight: 800;">Análisis Dual de Sesgo de Ruleta</h2>
        <div style="text-align: center; font-size: 0.7rem; color: #64748b; font-style: italic; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
          Giros analizados: filas ${startRow} a ${endRow === 0 ? 'FIN' : endRow} | Configuración: ${totalSpins} Giros | Tamaño del Sector: ${sectorSize} Números
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <thead>
              <tr>
                <th colspan="2" style="background: #e11d48; color: #fff; padding: 0.4rem; font-size: 0.75rem; text-transform: uppercase;">SECTOR CALIENTE (MÁXIMO SESGO)</th>
              </tr>
            </thead>
            <tbody style="font-size: 0.75rem;">
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9; width: 40%;">Mejor Offset:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.hot.offset}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Sector Caliente:</td>
                <td style="padding: 0.4rem; text-align: right; font-weight: bold;">${dualSesgo.hot.numeros.join(', ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Frec. Observada:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.hot.frecuencia}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Frec. Esperada:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.hot.esperada.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Comparativa:</td>
                <td style="padding: 0.4rem;">
                   <div style="display: flex; height: 14px; width: 60px; margin-left: auto; border: 1px solid #94a3b8;">
                      <div style="width: ${Math.min(100, (dualSesgo.hot.frecuencia / (dualSesgo.hot.esperada * 1.5)) * 100)}%; background: #e11d48;"></div>
                      <div style="flex: 1; background: #cbd5e1;"></div>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
            <thead>
              <tr>
                <th colspan="2" style="background: #16a34a; color: #fff; padding: 0.4rem; font-size: 0.75rem; text-transform: uppercase;">SECTOR FRÍO (MÍNIMO SESGO)</th>
              </tr>
            </thead>
            <tbody style="font-size: 0.75rem;">
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9; width: 40%;">Mejor Offset:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.cold.offset}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Sector Frío:</td>
                <td style="padding: 0.4rem; text-align: right; font-weight: bold;">${dualSesgo.cold.numeros.join(', ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Frec. Observada:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.cold.frecuencia}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Frec. Esperada:</td>
                <td style="padding: 0.4rem; text-align: right;">${dualSesgo.cold.esperada.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 0.4rem; font-weight: bold; background: #f1f5f9;">Comparativa:</td>
                <td style="padding: 0.4rem;">
                   <div style="display: flex; height: 14px; width: 60px; margin-left: auto; border: 1px solid #94a3b8;">
                      <div style="width: ${Math.min(100, (dualSesgo.cold.frecuencia / (dualSesgo.cold.esperada * 1.5)) * 100)}%; background: #16a34a;"></div>
                      <div style="flex: 1; background: #cbd5e1;"></div>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- TEST: AUDITORÍA TÉCNICA DETALLADA (Solicitado por Imagen) -->
      <section class="panel" style="background: #fff; border: 1px solid #cbd5e1; color: #1e293b; padding: 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
          <thead>
            <tr>
              <th colspan="2" style="background: #fcd34d; color: #000; padding: 0.6rem; text-align: left; font-size: 0.9rem;">🎯 ANÁLISIS DE SESGOS EN RULETA AMERICANA</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.5rem; background: #f8fafc; font-weight: 500;">Rango evaluado</td>
              <td style="padding: 0.5rem; text-align: right; color: #475569;">Filas ${startRow} a ${endRow === 0 ? 'FIN' : endRow}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.5rem; background: #f8fafc; font-weight: 500;">Tiradas analizadas</td>
              <td style="padding: 0.5rem; text-align: right; font-weight: bold;">${totalSpins}</td>
            </tr>
            <tr style="border-bottom: 2px solid #cbd5e1;">
              <td style="padding: 0.5rem; background: #f8fafc; font-weight: 500;">Número esperado por casilla</td>
              <td style="padding: 0.5rem; text-align: right;">${expectedPerNumber.toFixed(2)}</td>
            </tr>

            <!-- SESGO LOCAL -->
            <tr>
              <th colspan="2" style="background: #fee2e2; color: #991b1b; padding: 0.5rem; text-align: left; font-size: 0.75rem;">🔥 SESGO LOCAL (Ventana de 5 números)</th>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">¿Dónde inicia ventana?</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">${audit.sesgoLocal.inicio}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Sector analizado</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-family: monospace;">${audit.sesgoLocal.numeros.join(', ')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Observados en ventana</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold;">${audit.sesgoLocal.frecuencia}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Esperados en ventana</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">${audit.sesgoLocal.esperado.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Desviación absoluta</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold; color: #dc2626;">${audit.sesgoLocal.desviacion.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #cbd5e1;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Porcentaje de sesgo</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: 900; color: #dc2626;">${audit.sesgoLocal.porcentajeSesgo.toFixed(2)} %</td>
            </tr>

            <!-- SESGO GLOBAL -->
            <tr>
              <th colspan="2" style="background: #dbeafe; color: #1e40af; padding: 0.5rem; text-align: left; font-size: 0.75rem;">🔵 SESGO GLOBAL ANGULAR (Sector 1/3 rueda)</th>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">¿Dónde inicia sector?</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">${audit.sesgoGlobal.inicio}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Sector analizado</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-family: monospace;">${audit.sesgoGlobal.numeros.join(', ')}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Observados en sector</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold;">${audit.sesgoGlobal.frecuencia}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Esperados en sector</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">${audit.sesgoGlobal.esperado.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Desviación absoluta</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold; color: #2563eb;">${audit.sesgoGlobal.desviacion.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #cbd5e1;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Porcentaje de sesgo</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: 900; color: #2563eb;">${audit.sesgoGlobal.porcentajeSesgo.toFixed(2)} %</td>
            </tr>

            <!-- PRUEBA CHI-CUADRADO -->
            <tr>
              <th colspan="2" style="background: #dcfce7; color: #166534; padding: 0.5rem; text-align: left; font-size: 0.75rem;">📊 PRUEBA CHI-CUADRADO</th>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Casilla con mayor contribución CHI</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">Número: ${audit.maxChiContrib.numero}, contribución: ${audit.maxChiContrib.valor.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Chi-cuadrado observado</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold;">${audit.chiCuadrado.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Valor crítico 5% (37 gl)</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; color: #16a34a; font-weight: bold;">${audit.chiCritico.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">% observado respecto al crítico</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold;">${audit.porcentajeRespectoCritico.toFixed(2)} %</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Sesgo significativo (> crítico)</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right; font-weight: bold;">${audit.esSignificativo ? '✔ Sí' : '✘ No'}</td>
            </tr>
            <tr>
              <td style="padding: 0.4rem 0.5rem; background: #fff;">Significancia empleada</td>
              <td style="padding: 0.4rem 0.5rem; text-align: right;">${audit.significancia}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- TOP_SESGO_DUAL (Ranking) -->
      <section class="panel" style="background: #fff; border: 1px solid #cbd5e1; color: #334155; padding: 0;">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: #475569; color: #fff; text-align: left;">
                <th style="padding: 0.6rem; border: 1px solid #cbd5e1;">Ranking ⇅</th>
                <th style="padding: 0.6rem; border: 1px solid #cbd5e1;">Frecuencia ⇅</th>
                <th style="padding: 0.6rem; border: 1px solid #cbd5e1;">Sector (${topSectorSize} números) ⇅</th>
                <th style="padding: 0.6rem; border: 1px solid #cbd5e1;">Vecinos del Sector ⇅</th>
              </tr>
            </thead>
            <tbody>
              ${rankingSectores.map((s, i) => `
                <tr style="background: ${i % 2 === 0 ? '#fff' : '#f8fafc'};">
                  <td style="padding: 0.5rem; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${i + 1}</td>
                  <td style="padding: 0.5rem; border: 1px solid #cbd5e1; text-align: center; font-weight: 800;">${s.frecuencia}</td>
                  <td style="padding: 0.5rem; border: 1px solid #cbd5e1; font-weight: 500; font-family: monospace;">${s.numeros.join(', ')}</td>
                  <td style="padding: 0.5rem; border: 1px solid #cbd5e1; color: #64748b; font-size: 0.7rem; font-family: monospace;">${s.vecinos.join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  `;

  container.innerHTML = html;
}

export { Sesgo97 as renderSesgo97Tab };

function renderNumberTag(num, fontSize = '0.8rem') {
  let color = '#334155'; // Gris para Negro
  if (num === '0' || num === '00') color = '#16a34a';
  else if (RED_NUMBERS.includes(num)) color = '#dc2626';
  else color = '#000';

  return `
    <span style="
      background: ${color};
      color: #fff;
      font-size: ${fontSize};
      font-weight: 900;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      min-width: 1.2rem;
      text-align: center;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.1);
    ">${num}</span>
  `;
}
