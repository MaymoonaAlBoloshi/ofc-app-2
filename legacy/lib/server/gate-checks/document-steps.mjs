import {demoPinSections} from './demo-pin.mjs';
import { generateDocument } from '../../investment-documents.mjs';
import { normalizePinOptions } from '../../pin-options.mjs';
const mockedPages = new WeakSet();
export async function mockPinGeneration(page) {
  if (mockedPages.has(page)) return;
  mockedPages.add(page);
  await page.route('**/api/investment-documents/draft', async (route) => {
    const { snapshot, options, type = 'pin' } = route.request().postDataJSON();
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        sections: type === 'pin' ? demoPinSections(snapshot,options) : generateDocument(type, snapshot, options).map((section) => ({
          ...section,
          text:
            section.text ||
            `Demonstration assessment for ${section.title}.\n\nFinding: The playback covers the review workflow for ${snapshot.deal.t}. A real decision would require transaction-specific evidence.\n\nOpen questions: ${section.guidance} The reviewer must resolve these questions before relying on a production report.`,
        })),
        options: normalizePinOptions(options),
        method: 'recorded',
        notice:
          'Simulated drafting response for playback. Recorded facts are reused; missing assessments require review.',
      }),
    });
  });
}
// Simulated narrative for browser verification only. Never a client investment assessment.
export async function prepareTestPin(page, dealId) {
  await mockPinGeneration(page);
  const panel = page
    .locator('[data-document-panel]')
    .filter({ has: page.locator(`[data-doc-generate=pin][data-doc-deal="${dealId}"]`) });
  await panel.locator('[data-pin-option=executive]').check();
  await page.locator(`[data-doc-generate="pin"][data-doc-deal="${dealId}"]`).click();
  const form = page.locator('#investmentDocForm');
  await form.waitFor();
  await form.locator('[data-doc-action="review-submit"]').click();
  await page
    .getByText('Confirm that you reviewed the full report before submitting.', { exact: true })
    .waitFor();
  await form.locator('#pinReportConfirmed').check();
  await form.locator('[data-doc-action="review-submit"]').click();
  await form.getByText('Version 2 · Submitted', { exact: true }).waitFor();
  const doc = await page.evaluate(
    (dealId) =>
      JSON.parse(localStorage.getItem('ofc-investment-documents')).find(
        (d) => d.dealId === dealId && d.type === 'pin' && d.version === 2,
      ),
    dealId,
  );
  await form.locator('[data-doc-action="close"]').click();
  return doc;
}

export async function prepareTestFip(page,dealId) {
  await mockPinGeneration(page);
  await page.locator(`[data-doc-generate="fip"][data-doc-deal="${dealId}"]`).click();
  const form=page.locator('#investmentDocForm');
  await form.waitFor();
  if(await form.locator('textarea:visible').count())throw Error('The FIP should open as a readable report.');
  const sections=form.locator('[data-report-section]');
  for(const section of await sections.all())await section.scrollIntoViewIfNeeded();
  await form.locator('#pinReportConfirmed').check();
  await form.locator('[data-doc-action=confirm-review]').click();
  await form.getByText(/Version \d+ · Reviewed/).waitFor();
  await form.getByRole('link',{name:'Continue to gate decision',exact:true}).click();
}
