import { reportTypes, reportSections, reportAudiences } from '../report-schema.mjs';
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (value) =>
  Number(value).toLocaleString('en-GB', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
export function reportHtml(report) {
  const { snapshot, scope } = report,
    m = snapshot.metrics;
  const sources = snapshot.evidence
    .map(
      (e, i) =>
        `<li id="source-${i + 1}"><b>[${i + 1}] ${escape(e.path)}</b><br>${escape(e.locator)}<br><small>SHA-256: ${escape(e.hash)}</small></li>`,
    )
    .join('');
  const citations = (ids) =>
    ids.map((id) => `[${snapshot.evidence.findIndex((e) => e.id === id) + 1}]`).join(' ');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ONLDC report</title><style>@page{size:A4;margin:19mm}body{font:11px/1.6 Arial,sans-serif;color:#253c35}header{border-bottom:3px solid #214a3c;padding-bottom:16px}h1{font-size:25px;line-height:1.25;margin:10px 0}h2{font-size:15px;margin:24px 0 8px;break-after:avoid}p{white-space:pre-wrap}small,.muted{color:#607268}table{border-collapse:collapse;width:100%;margin:15px 0}th,td{padding:8px;text-align:left;border-bottom:1px solid #dce4d8}th{background:#f0f4ed}section{break-inside:auto}li{margin-bottom:8px}li, tr{break-inside:avoid}.sources{font-size:9px;overflow-wrap:anywhere}.notice{background:#f7f3e9;padding:12px}.status{font-weight:bold;text-transform:uppercase}</style></head><body><header><div>OMAN FOOD CAPITAL · SIRAAJ</div><h1>ONLDC ${escape(reportTypes[scope.type])}</h1><div>${escape(snapshot.periodLabel)} · ${escape(reportAudiences[scope.audience])}</div><div class="status">${escape(report.status)} · Version ${report.version}</div><small>Saved ${escape(report.savedAt)}. ${report.status === 'reviewed' ? 'Marked reviewed by the demo user; not a formal approval.' : 'AI-assisted draft. Review before circulation.'}</small></header>
 <h2>Revenue against budget</h2><table><thead><tr><th>Actual (OMR)</th><th>Budget (OMR)</th><th>Variance (OMR)</th><th>Variance (%)</th></tr></thead><tbody><tr><td>${money(m.actual)}</td><td>${money(m.budget)}</td><td>${money(m.gap)}</td><td>${m.variance.toFixed(2)}%</td></tr></tbody></table><small>Calculated from ${escape(m.actualLocator)} and ${escape(m.budgetLocator)}. ${citations([m.sourceId])}</small>
 ${Object.entries(reportSections)
   .map(
     ([key, label]) =>
       `<section><h2>${escape(label)}</h2><p>${escape(report.sections[key].text)}</p><small>Sources: ${citations(report.sections[key].sourceIds)}</small></section>`,
   )
   .join('')}
 <h2>Recorded critical tasks</h2><p class="muted">Tracker snapshot date unconfirmed. These are not asserted to be period-end or current statuses.</p><table><thead><tr><th>Task</th><th>Owner</th><th>Recorded status</th></tr></thead><tbody>${snapshot.tasks.map((t) => `<tr><td>${escape(t.title)} ${citations([t.id])}</td><td>${escape(t.owner)}</td><td>${escape(t.status)}</td></tr>`).join('')}</tbody></table>
 <h2>Coverage and limitations</h2><ul class="notice">${snapshot.warnings.map((w) => `<li>${escape(w)}</li>`).join('')}</ul><h2>Source register</h2><p class="muted">Source snapshot captured ${escape(snapshot.snapshotAt)}. Each saved report retains this evidence even if the search index is refreshed.</p><ol class="sources">${sources}</ol></body></html>`;
}
export async function renderReportPdf(report) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.SIRAAJ_CHROME_PATH || '/usr/bin/google-chrome',
  });
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => route.abort());
    await page.setContent(reportHtml(report), { waitUntil: 'load' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="font-size:9px;color:#68766b;width:100%;text-align:center">Oman Food Capital · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '19mm', right: '19mm', bottom: '20mm', left: '19mm' },
    });
  } finally {
    await browser.close();
  }
}
