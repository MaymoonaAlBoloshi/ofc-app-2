import {investmentReportStyle} from './investment-report-style.mjs';
import { renderReportBrief, renderReportNarrative, sectionNeedsEvidence } from '../report-presentation.mjs';
import { documentTypes, validatePdfDocument } from '../investment-documents.mjs';
const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export function investmentDocumentHtml(input) {
  const doc = validatePdfDocument(input);
  const report=['pin','fip'].includes(doc.type);
  const register=[...new Set(doc.sections.flatMap(s=>s.references||[]))];
  const sections=doc.sections.filter(s=>!(doc.brief&&s.key==='executive'&&s.text.length<=600));
  const chapter=(number,title,newPage=false)=>`<div class="chapter-heading${newPage?' new-page':''}"><span class="chapter-number">${number}</span><div><p class="kicker">Investment review</p><h2>${escape(title)}</h2></div></div>`;
  const pending=doc.sections.filter(sectionNeedsEvidence);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(doc.title)} | ${escape(documentTypes[doc.type])}</title><style>${investmentReportStyle}</style></head><body><header class="report-header"><p class="brand">OMAN FOOD CAPITAL</p><p class="report-type">${escape(documentTypes[doc.type])}</p><h1>${escape(doc.title)}</h1><div class="report-meta"><span class="status">${escape(doc.status)} · Version ${doc.version}</span><span>${escape(doc.savedAt.slice(0,10))}</span><span>Prepared by ${escape(doc.actor)}</span></div></header>
  <p class="notice">${doc.sections.some(s=>s.text.startsWith('Demonstration assessment.'))?'DEMONSTRATION REPORT. Fictional examples are labelled in the report.':'Drafts may contain demonstration data.'} Verify source figures and assumptions before relying on this report. Recorded review is separate from investment approval.</p>
  ${doc.brief?renderReportBrief(doc.brief,escape,true):''}
  ${pending.length?`<p class="evidence-needed">Evidence needed: ${escape(pending.map(s=>s.title).join('; '))}.</p>`:''}
  ${sections.map((s,i)=>`${report?(i===0?chapter('01','The opportunity'):s.key==='economics'?chapter('02','Economics and delivery',true):s.key==='risk'?chapter('03','Risks and next steps',true):''):''}<section class="report-section"><h2><span class="section-number">${String(i+1).padStart(2,'0')}</span>${escape(s.title)}</h2>${sectionNeedsEvidence(s)?'<p class="evidence-needed">Evidence needed</p>':''}${renderReportNarrative(s.text||s.gap||s.guidance,escape)}${s.gap&&s.text.trim()?`<p><b>Outstanding evidence</b><br>${escape(s.gap)}</p>`:''}${s.references?.length?`<p class="source-ref">References: ${escape(s.references.map(r=>r.split(':')[0]).join(', '))}. See source register.</p>`:''}</section>`).join('')}
  <section class="source-register"><p class="kicker">Supporting material</p><h2>${report?'Evidence appendix: source register':'Source snapshot'}</h2>${doc.options?.additionalRequirements?`<p><b>Requested coverage</b><br>${escape(doc.options.additionalRequirements)}</p>`:''}${register.length&&!doc.sources?`<ul>${register.map(r=>`<li>${escape(r)}</li>`).join('')}</ul>`:''}${report?doc.sources.split(/\n\s*\n/).filter(Boolean).map(entry=>{const [title,...lines]=entry.split('\n');return `<div class="source-entry"><h3>${escape(title)}</h3><p>${escape(lines.join('\n'))}</p></div>`;}).join(''):`<pre>${escape(doc.sources)}</pre>`}${report?'<p>Full saved extracts and review history are available through Download evidence appendix in the report workspace. File metadata alone does not verify document contents.</p>':''}</section></body></html>`;
}
export async function renderInvestmentDocumentPdf(input) {
  const html = investmentDocumentHtml(input);
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.SIRAAJ_CHROME_PATH || '/usr/bin/google-chrome',
  });
  try {
    const page = await browser.newPage();
    await page.route('**/*', (route) => route.abort());
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({ format: 'A4', printBackground: true, displayHeaderFooter:true, headerTemplate:'<span></span>',footerTemplate:'<div style="font:9px Arial;width:100%;margin:0 18mm;color:#526457;display:flex;justify-content:space-between"><span>OFC · Investment report</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>' });
  } finally {
    await browser.close();
  }
}
export async function handleInvestmentPdf(request, render = renderInvestmentDocumentPdf) {
  const url = new URL(request.url),
    expected = `${url.protocol}//${request.headers.get('host') || url.host}`;
  if (request.headers.get('origin') !== expected)
    return Response.json({ error: 'Export documents from the OFC app.' }, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return Response.json({ error: 'Expected JSON.' }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'Document is required.' }, { status: 400 });
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 180000) {
        await reader.cancel();
        return Response.json({ error: 'Document is too large.' }, { status: 413 });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let doc;
  try {
    doc = validatePdfDocument(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch {
    return Response.json({ error: 'Invalid document content.' }, { status: 400 });
  }
  try {
    const pdf = await render(doc);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${doc.type}-v${doc.version}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json(
      { error: 'PDF export is unavailable. Please try again.' },
      { status: 503 },
    );
  }
}
