/**
 * Report export — generates Markdown reports from simulation results
 * and provides download helpers for .md and .pdf formats.
 */

import { LOADING_BAY_WIDTH_M } from './model-data';
import { HANDLEIDING_SECTIONS } from './content';
import { DMI, CLUSTER_COLORS, PERIOD_COLORS } from './dmi-theme';
import type { SimulationResult, VehicleDef, FunctionDef } from './simulation';

export interface ReportInput {
  functionCounts: Record<string, number>;
  clusterAssignments: Record<string, number>;
  clusterServiceLevels: Record<number, number>;
  clusterNames: Record<number, string>;
  numSimulations: number;
  results: SimulationResult;
  allFunctions: FunctionDef[];
  allVehicles: VehicleDef[];
}

function getLimitationsParagraphs(): string[] {
  const section = HANDLEIDING_SECTIONS.find((s) => s.title.includes('Beperkingen'));
  if (!section) return [];
  return section.paragraphs;
}

function getClusterIds(assignments: Record<string, number>): number[] {
  return [...new Set(Object.values(assignments))].sort((a, b) => a - b);
}

function bold(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Markdown export (unchanged)
// ---------------------------------------------------------------------------

function getLimitationsMarkdown(): string {
  const section = HANDLEIDING_SECTIONS.find((s) => s.title.includes('Beperkingen'));
  if (!section) return '';
  return section.paragraphs
    .map((p) => (p.startsWith('**') && p.includes(':**') ? `- ${p}` : p))
    .join('\n');
}

export function generateReportMarkdown(input: ReportInput): string {
  const { functionCounts, clusterAssignments, clusterServiceLevels, clusterNames, numSimulations, results, allFunctions, allVehicles } = input;

  const now = new Date();
  const dateStr = now.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const clusterIds = getClusterIds(clusterAssignments);
  const totalVehiclesPerDay = results.vehicleResults.reduce((s, vr) => s + vr.totalArrivalsPerDay, 0);
  const avgServiceLevel = clusterIds.length > 0 ? clusterIds.reduce((s, cid) => s + (clusterServiceLevels[cid] ?? 0.95), 0) / clusterIds.length : 0;
  const activeFunctions = allFunctions.filter((f) => (functionCounts[f.id] ?? 0) > 0);

  const L: string[] = [];
  L.push('# Rapport Ruimtemodel Stadslogistiek', '', `**Datum:** ${dateStr}`, `**Aantal simulaties:** ${numSimulations}`, '', '---', '');
  L.push('## Samenvatting', '', '| Kengetal | Waarde |', '| --- | --- |');
  L.push(`| Totaal functies | ${activeFunctions.reduce((s, f) => s + (functionCounts[f.id] ?? 0), 0)} |`);
  L.push(`| Verwacht aantal voertuigen/dag | ${Math.round(totalVehiclesPerDay)} |`);
  L.push(`| Gemiddeld service level | ${Math.round(avgServiceLevel * 100)}% |`);
  L.push(`| Benodigde lengte | ${round1(results.totalSpaceM2)} meter |`);
  L.push(`| Benodigde oppervlakte | ${round1(results.totalSpaceM2 * LOADING_BAY_WIDTH_M)} m² |`, '');
  L.push('## Invoer: Functies', '', '| Functie | Aantal |', '| --- | ---: |');
  for (const f of allFunctions) { const c = functionCounts[f.id] ?? 0; if (c > 0) L.push(`| ${f.name} | ${c} |`); }
  L.push('');
  L.push('## Invoer: Clusters en Service Levels', '');
  for (const cid of clusterIds) {
    const cName = clusterNames[cid] || `Cluster ${cid}`;
    const vehs = allVehicles.filter((v) => clusterAssignments[v.id] === cid);
    L.push(`**${cName}** — Service level: ${Math.round((clusterServiceLevels[cid] ?? 0.95) * 100)}%`, '', `Voertuigtypen: ${vehs.map((v) => v.name).join(', ')}`, '');
  }
  L.push('## Resultaten per Cluster', '', '| Cluster | Service Level | Benodigde Lengte | Oppervlakte |', '| --- | ---: | ---: | ---: |');
  for (const cr of results.clusterResults) {
    L.push(`| ${clusterNames[cr.clusterId] || `Cluster ${cr.clusterId}`} | ${Math.round(cr.serviceLevel * 100)}% | ${round1(cr.totalSpaceM2)} m | ${round1(cr.totalSpaceM2 * LOADING_BAY_WIDTH_M)} m² |`);
  }
  L.push(`| **Totaal** | — | **${round1(results.totalSpaceM2)} m** | **${round1(results.totalSpaceM2 * LOADING_BAY_WIDTH_M)} m²** |`, '');
  L.push('## Resultaten per Voertuigtype', '', '| Voertuigtype | Verwacht/dag | Lengte | Benodigde Ruimte |', '| --- | ---: | ---: | ---: |');
  for (const vr of results.vehicleResults) { if (vr.totalArrivalsPerDay > 0) L.push(`| ${vr.vehicleName} | ${round1(vr.totalArrivalsPerDay)} | ${vr.vehicleLength} m | ${round1(vr.requiredSpaceM2)} m |`); }
  L.push('');
  L.push('## Piekbelasting per Dagdeel', '', '| Dagdeel | Benodigde Ruimte |', '| --- | ---: |');
  for (const p of results.peakByPeriod) L.push(`| ${p.period} | ${round1(p.space)} m |`);
  L.push('', '---', '', '## Beperkingen en Aandachtspunten', '', getLimitationsMarkdown(), '');
  L.push('---', '', '## Beoogd Gebruik', '');
  L.push('Het Ruimtemodel Stadslogistiek kan zelfstandig worden gebruikt door gemeenten, stedenbouwkundigen en vastgoedontwikkelaars. Het model biedt een eerste, onderbouwde inschatting van de ruimtevraag van stadslogistiek op gebiedsniveau. Voor een optimale toepassing adviseren wij om de resultaten te bespreken met logistiek experts of ruimtelijk adviseurs, zodat de uitkomsten goed kunnen worden vertaald naar de lokale context.', '');
  L.push('Het model kan worden ingezet bij zowel herinrichtingsprojecten (bestaande situatie) als bij nieuwe gebiedsontwikkelingen. De output vormt een basis voor het opstellen van ruimtelijke scenario\'s, het onderbouwen van beleidsadvies, en het faciliteren van een geïnformeerd gesprek tussen stedenbouwkundigen, beleidsadviseurs, vastgoedontwikkelaars en logistiek adviseurs.', '');
  L.push('De modelresultaten zijn uitdrukkelijk **geen definitief ontwerp**. Een ruimtelijke vertaling — rekening houdend met het straatprofiel, de inrichting, en lokale omstandigheden — is altijd noodzakelijk. Het wordt aanbevolen om de resultaten te valideren met lokale kennis en veldonderzoek.', '');
  L.push('---', '', '## Disclaimer', '');
  L.push('De resultaten van het Ruimtemodel Stadslogistiek zijn indicatief en dienen met zorg te worden geïnterpreteerd. Het model levert inschattingen op basis van generieke aannames en vereenvoudigingen van de werkelijkheid. De uitkomsten zijn geen definitieve ontwerpen en geen vervanging voor professioneel advies of veldonderzoek.', '');
  L.push('Aan de resultaten van dit model kunnen **geen rechten worden ontleend**. De ontwikkelaars en samenwerkingspartners aanvaarden **geen aansprakelijkheid** voor eventuele schade of onjuistheden die voortvloeien uit het gebruik van de resultaten van dit model. Gebruik van de tool geschiedt geheel op eigen risico.', '');
  L.push('---', '', '*Gegenereerd met het Ruimtemodel Stadslogistiek — een open source tool (EUPL-1.2) gerealiseerd door Rebel Group, in samenwerking met HAN, Breda University of Applied Sciences en Posad Maxwan, mede-gerealiseerd vanuit het DMI Ecosysteem.*', '');
  return L.join('\n');
}

export function downloadMarkdown(content: string, filename = 'rapport-ruimtemodel.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// PDF export — builds styled HTML directly from data with DMI branding
// ---------------------------------------------------------------------------

function svgBarChartHorizontal(
  data: { label: string; value: number; color: string }[],
  opts: { width?: number; barHeight?: number; title?: string; unit?: string } = {},
): string {
  const { width = 600, barHeight = 32, title, unit = 'm' } = opts;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const labelWidth = 160;
  const valueWidth = 60;
  const chartWidth = width - labelWidth - valueWidth - 20;
  const gap = 6;
  const svgHeight = data.length * (barHeight + gap) + (title ? 30 : 0) + 10;
  const yStart = title ? 30 : 5;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${svgHeight}" style="font-family:'IBM Plex Sans',sans-serif;">`;
  if (title) {
    svg += `<text x="0" y="18" font-size="13" font-weight="600" fill="${DMI.darkBlue}">${title}</text>`;
  }
  data.forEach((d, i) => {
    const y = yStart + i * (barHeight + gap);
    const barW = Math.max(2, (d.value / maxVal) * chartWidth);
    svg += `<text x="0" y="${y + barHeight / 2 + 4}" font-size="11" fill="${DMI.darkGray}">${d.label}</text>`;
    svg += `<rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="3" fill="${d.color}" />`;
    svg += `<text x="${labelWidth + barW + 6}" y="${y + barHeight / 2 + 4}" font-size="11" font-weight="600" fill="${DMI.darkBlue}">${round1(d.value)} ${unit}</text>`;
  });
  svg += '</svg>';
  return svg;
}

function svgBarChartVertical(
  data: { label: string; value: number; color: string }[],
  opts: { width?: number; height?: number; title?: string; unit?: string } = {},
): string {
  const { width = 500, height = 200, title, unit = 'm' } = opts;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const titleH = title ? 30 : 0;
  const bottomPad = 40;
  const topPad = 20 + titleH;
  const chartH = height - topPad - bottomPad;
  const barGap = 20;
  const barW = Math.min(80, (width - barGap * (data.length + 1)) / data.length);
  const totalBarsW = data.length * barW + (data.length - 1) * barGap;
  const startX = (width - totalBarsW) / 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="font-family:'IBM Plex Sans',sans-serif;">`;
  if (title) {
    svg += `<text x="0" y="18" font-size="13" font-weight="600" fill="${DMI.darkBlue}">${title}</text>`;
  }
  // Baseline
  svg += `<line x1="${startX - 10}" y1="${topPad + chartH}" x2="${startX + totalBarsW + 10}" y2="${topPad + chartH}" stroke="${DMI.lightGray}" stroke-width="1" />`;
  data.forEach((d, i) => {
    const x = startX + i * (barW + barGap);
    const barH = Math.max(2, (d.value / maxVal) * chartH);
    const y = topPad + chartH - barH;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${d.color}" />`;
    svg += `<text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" font-size="11" font-weight="600" fill="${DMI.darkBlue}">${round1(d.value)} ${unit}</text>`;
    svg += `<text x="${x + barW / 2}" y="${topPad + chartH + 16}" text-anchor="middle" font-size="10" fill="${DMI.darkGray}">${d.label}</text>`;
  });
  svg += '</svg>';
  return svg;
}

export function downloadPdf(input: ReportInput, filename = 'rapport-ruimtemodel') {
  const { functionCounts, clusterAssignments, clusterServiceLevels, clusterNames, numSimulations, results, allFunctions, allVehicles } = input;

  const now = new Date();
  const dateStr = now.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const clusterIds = getClusterIds(clusterAssignments);
  const totalVehiclesPerDay = results.vehicleResults.reduce((s, vr) => s + vr.totalArrivalsPerDay, 0);
  const avgServiceLevel = clusterIds.length > 0 ? clusterIds.reduce((s, cid) => s + (clusterServiceLevels[cid] ?? 0.95), 0) / clusterIds.length : 0;
  const activeFunctions = allFunctions.filter((f) => (functionCounts[f.id] ?? 0) > 0);
  const totalUnits = activeFunctions.reduce((s, f) => s + (functionCounts[f.id] ?? 0), 0);
  const origin = window.location.origin;

  // --- SVG Charts ---
  const clusterChartSvg = svgBarChartHorizontal(
    results.clusterResults.map((cr) => ({
      label: clusterNames[cr.clusterId] || `Cluster ${cr.clusterId}`,
      value: cr.totalSpaceM2,
      color: CLUSTER_COLORS[cr.clusterId] ?? DMI.mediumBlue,
    })),
    { title: 'Benodigde ruimte per cluster', unit: 'm' },
  );

  const periodChartSvg = svgBarChartVertical(
    results.peakByPeriod.map((p, i) => ({
      label: p.period,
      value: p.space,
      color: PERIOD_COLORS[i] ?? DMI.mediumBlue,
    })),
    { title: 'Piekbelasting per dagdeel', unit: 'm' },
  );

  const vehicleChartSvg = svgBarChartHorizontal(
    results.vehicleResults
      .filter((vr) => vr.requiredSpaceM2 > 0)
      .map((vr) => ({
        label: vr.vehicleName,
        value: vr.requiredSpaceM2,
        color: CLUSTER_COLORS[vr.clusterId] ?? DMI.mediumBlue,
      })),
    { title: 'Benodigde lengte per voertuigtype', unit: 'm' },
  );

  // --- Table helper ---
  const th = (text: string, align = 'left') =>
    `<th style="text-align:${align};padding:8px 12px;border-bottom:2px solid ${DMI.darkBlue};font-size:0.8rem;font-weight:600;color:${DMI.darkBlue};font-family:'IBM Plex Sans Condensed',sans-serif;text-transform:uppercase;letter-spacing:0.03em;">${text}</th>`;
  const td = (text: string, align = 'left', isBold = false) =>
    `<td style="text-align:${align};padding:6px 12px;border-bottom:1px solid ${DMI.lightGray};font-size:0.85rem;color:${DMI.darkGray};${isBold ? `font-weight:700;color:${DMI.darkBlue};` : ''}">${text}</td>`;

  // --- Build HTML ---
  const limitations = getLimitationsParagraphs();

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 18mm 20mm; }
    * { box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; color: ${DMI.darkGray}; max-width: 800px; margin: 0 auto; padding: 24px; line-height: 1.55; font-size: 0.9rem; }
    h1 { font-family: 'IBM Plex Sans Condensed', sans-serif; font-size: 1.5rem; color: ${DMI.darkBlue}; margin: 0 0 4px; font-weight: 700; }
    h2 { font-family: 'IBM Plex Sans Condensed', sans-serif; font-size: 1.1rem; color: ${DMI.darkBlue}; margin: 28px 0 10px; font-weight: 700; border-bottom: 2px solid ${DMI.yellow}; padding-bottom: 4px; page-break-after: avoid; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; }
    hr { border: none; border-top: 1px solid ${DMI.lightGray}; margin: 28px 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
    .kpi-card { background: ${DMI.blueTint3}; border-radius: 8px; padding: 14px 16px; border-left: 4px solid ${DMI.mediumBlue}; }
    .kpi-label { font-family: 'IBM Plex Sans Condensed', sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${DMI.mediumBlue}; font-weight: 600; }
    .kpi-value { font-size: 1.4rem; font-weight: 700; color: ${DMI.darkBlue}; margin-top: 2px; }
    .kpi-unit { font-size: 0.75rem; color: ${DMI.darkGray}; font-weight: 400; }
    .chart-section { margin: 20px 0; page-break-inside: avoid; }
    .limitation-item { margin: 6px 0; font-size: 0.82rem; line-height: 1.5; }
    .footer { font-size: 0.75rem; color: ${DMI.darkGray}; font-style: italic; margin-top: 16px; }
    @media print { body { padding: 0; } .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
  </style>
</head>
<body>

  <!-- Header with DMI logo -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid ${DMI.darkBlue};">
    <div>
      <h1>Rapport Ruimtemodel Stadslogistiek</h1>
      <div style="font-size:0.8rem;color:${DMI.darkGray};margin-top:4px;">
        <strong>Datum:</strong> ${dateStr} &nbsp;&nbsp; <strong>Simulaties:</strong> ${numSimulations}
      </div>
    </div>
    <img src="${origin}/dmi-logo.png" alt="DMI" style="height:50px;object-fit:contain;" crossorigin="anonymous" />
  </div>

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Totaal Functies</div>
      <div class="kpi-value">${totalUnits}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Verwacht Voertuigen/dag</div>
      <div class="kpi-value">${Math.round(totalVehiclesPerDay)}</div>
    </div>
    <div class="kpi-card" style="border-left-color:${DMI.yellow};">
      <div class="kpi-label">Gemiddeld Service Level</div>
      <div class="kpi-value">${Math.round(avgServiceLevel * 100)}%</div>
    </div>
    <div class="kpi-card" style="border-left-color:${DMI.themeAreaDev};">
      <div class="kpi-label">Benodigde Lengte</div>
      <div class="kpi-value">${round1(results.totalSpaceM2)} <span class="kpi-unit">meter</span></div>
    </div>
    <div class="kpi-card" style="border-left-color:${DMI.themeLogistics};">
      <div class="kpi-label">Benodigde Oppervlakte</div>
      <div class="kpi-value">${round1(results.totalSpaceM2 * LOADING_BAY_WIDTH_M)} <span class="kpi-unit">m²</span></div>
    </div>
    <div class="kpi-card" style="border-left-color:${DMI.themeMobility};">
      <div class="kpi-label">Aantal Clusters</div>
      <div class="kpi-value">${results.clusterResults.length}</div>
    </div>
  </div>

  <!-- Input: Functions -->
  <h2>Invoer: Functies</h2>
  <table>
    <thead><tr>${th('Functie')}${th('Aantal', 'right')}</tr></thead>
    <tbody>
      ${activeFunctions.map((f) => `<tr>${td(f.name)}${td(String(functionCounts[f.id] ?? 0), 'right')}</tr>`).join('\n      ')}
    </tbody>
  </table>

  <!-- Input: Clusters -->
  <h2>Invoer: Clusters en Service Levels</h2>
  ${clusterIds.map((cid) => {
    const cName = clusterNames[cid] || `Cluster ${cid}`;
    const sl = clusterServiceLevels[cid] ?? 0.95;
    const vehs = allVehicles.filter((v) => clusterAssignments[v.id] === cid);
    return `<p style="margin:8px 0;"><strong style="color:${DMI.darkBlue};">${cName}</strong> — Service level: ${Math.round(sl * 100)}%<br/>
    <span style="font-size:0.82rem;">Voertuigtypen: ${vehs.map((v) => v.name).join(', ')}</span></p>`;
  }).join('\n  ')}

  <!-- Chart: Cluster breakdown -->
  <div class="chart-section">${clusterChartSvg}</div>

  <!-- Table: Results per cluster -->
  <h2>Resultaten per Cluster</h2>
  <table>
    <thead><tr>${th('Cluster')}${th('Service Level', 'right')}${th('Benodigde Lengte', 'right')}${th('Oppervlakte', 'right')}</tr></thead>
    <tbody>
      ${results.clusterResults.map((cr) => {
        const cName = clusterNames[cr.clusterId] || `Cluster ${cr.clusterId}`;
        return `<tr>${td(cName)}${td(`${Math.round(cr.serviceLevel * 100)}%`, 'right')}${td(`${round1(cr.totalSpaceM2)} m`, 'right')}${td(`${round1(cr.totalSpaceM2 * LOADING_BAY_WIDTH_M)} m²`, 'right')}</tr>`;
      }).join('\n      ')}
      <tr>${td('Totaal', 'left', true)}${td('—', 'right', true)}${td(`${round1(results.totalSpaceM2)} m`, 'right', true)}${td(`${round1(results.totalSpaceM2 * LOADING_BAY_WIDTH_M)} m²`, 'right', true)}</tr>
    </tbody>
  </table>

  <!-- Chart: Vehicle breakdown -->
  <div class="chart-section">${vehicleChartSvg}</div>

  <!-- Table: Results per vehicle -->
  <h2>Resultaten per Voertuigtype</h2>
  <table>
    <thead><tr>${th('Voertuigtype')}${th('Verwacht/dag', 'right')}${th('Lengte', 'right')}${th('Benodigde Ruimte', 'right')}</tr></thead>
    <tbody>
      ${results.vehicleResults.filter((vr) => vr.totalArrivalsPerDay > 0).map((vr) =>
        `<tr>${td(vr.vehicleName)}${td(String(round1(vr.totalArrivalsPerDay)), 'right')}${td(`${vr.vehicleLength} m`, 'right')}${td(`${round1(vr.requiredSpaceM2)} m`, 'right')}</tr>`
      ).join('\n      ')}
    </tbody>
  </table>

  <!-- Chart: Peak by period -->
  <div class="chart-section">${periodChartSvg}</div>

  <!-- Table: Peak by period -->
  <h2>Piekbelasting per Dagdeel</h2>
  <table>
    <thead><tr>${th('Dagdeel')}${th('Benodigde Ruimte', 'right')}</tr></thead>
    <tbody>
      ${results.peakByPeriod.map((p) => `<tr>${td(p.period)}${td(`${round1(p.space)} m`, 'right')}</tr>`).join('\n      ')}
    </tbody>
  </table>

  <hr>

  <!-- Limitations -->
  <h2>Beperkingen en Aandachtspunten</h2>
  ${limitations.map((p) => {
    if (p.startsWith('**') && p.includes(':**')) {
      return `<div class="limitation-item">${bold(p)}</div>`;
    }
    return `<p style="font-size:0.85rem;line-height:1.5;">${bold(p)}</p>`;
  }).join('\n  ')}

  <hr>

  <!-- Intended use -->
  <h2>Beoogd Gebruik</h2>
  <p style="font-size:0.85rem;line-height:1.5;">Het Ruimtemodel Stadslogistiek kan zelfstandig worden gebruikt door gemeenten, stedenbouwkundigen en vastgoedontwikkelaars. Het model biedt een eerste, onderbouwde inschatting van de ruimtevraag van stadslogistiek op gebiedsniveau. Voor een optimale toepassing adviseren wij om de resultaten te bespreken met logistiek experts of ruimtelijk adviseurs, zodat de uitkomsten goed kunnen worden vertaald naar de lokale context.</p>
  <p style="font-size:0.85rem;line-height:1.5;">Het model kan worden ingezet bij zowel herinrichtingsprojecten (bestaande situatie) als bij nieuwe gebiedsontwikkelingen. De output vormt een basis voor het opstellen van ruimtelijke scenario's, het onderbouwen van beleidsadvies, en het faciliteren van een geïnformeerd gesprek tussen stedenbouwkundigen, beleidsadviseurs, vastgoedontwikkelaars en logistiek adviseurs.</p>
  <p style="font-size:0.85rem;line-height:1.5;">De modelresultaten zijn uitdrukkelijk <strong>geen definitief ontwerp</strong>. Een ruimtelijke vertaling — rekening houdend met het straatprofiel, de inrichting, en lokale omstandigheden — is altijd noodzakelijk. Het wordt aanbevolen om de resultaten te valideren met lokale kennis en veldonderzoek.</p>

  <hr>

  <!-- Disclaimer -->
  <h2>Disclaimer</h2>
  <p style="font-size:0.85rem;line-height:1.5;">De resultaten van het Ruimtemodel Stadslogistiek zijn indicatief en dienen met zorg te worden geïnterpreteerd. Het model levert inschattingen op basis van generieke aannames en vereenvoudigingen van de werkelijkheid. De uitkomsten zijn geen definitieve ontwerpen en geen vervanging voor professioneel advies of veldonderzoek.</p>
  <p style="font-size:0.85rem;line-height:1.5;">Aan de resultaten van dit model kunnen <strong>geen rechten worden ontleend</strong>. De ontwikkelaars en samenwerkingspartners aanvaarden <strong>geen aansprakelijkheid</strong> voor eventuele schade of onjuistheden die voortvloeien uit het gebruik van de resultaten van dit model. Gebruik van de tool geschiedt geheel op eigen risico.</p>

  <hr>

  <p class="footer">Gegenereerd met het Ruimtemodel Stadslogistiek — een open source tool (EUPL-1.2) gerealiseerd door Rebel Group, in samenwerking met HAN, Breda University of Applied Sciences en Posad Maxwan, mede-gerealiseerd vanuit het DMI Ecosysteem.</p>

</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for fonts and image to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 300);
  };
  setTimeout(() => printWindow.print(), 1000);
}
