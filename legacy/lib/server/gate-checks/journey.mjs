import { chromium } from 'playwright-core';
import { prepareTestPin, prepareTestFip } from './document-steps.mjs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateTestCase, gateTestSource } from './test-case.mjs';
import { clientGateSource, createClientReview } from './client-requirements.mjs';
export const gateStages = [
  { id: 'G1', title: 'Origination and CEO decision' },
  { id: 'G2', title: 'Assessment and EC decision' },
  { id: 'G3', title: 'Due diligence, FID and PMO handover' },
  { id: 'G4', title: 'Commissioning and operations acceptance' },
  { id: 'G5', title: 'Operating asset and financial records' },
];
export async function runGateJourney({
  baseURL,
  artifactDir,
  onProgress = () => {},
  browserType = chromium,
  executablePath = process.env.SIRAAJ_CHROME_PATH || '/usr/bin/google-chrome',
  headless = true,
  slowMo = 0,
  stagePause = 0,
  finishPause = 0,
  recordVideo = false,
  beforeClose = async () => {},
  onPage = async (page) => {},
  onStage = async (stage) => {},
}) {
  await mkdir(artifactDir, { recursive: true });
  const browser = await browserType.launch({
    headless,
    executablePath,
    slowMo,
  });
  const deadline = setTimeout(
    () => {
      void browser.close().catch(() => {});
    },
    180000 + slowMo * 500 + stagePause * 5 + finishPause,
  );
  deadline.unref();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ...(recordVideo
      ? {
          recordVideo: {
            dir: path.join(artifactDir, 'video'),
            size: { width: 1440, height: 1000 },
          },
        }
      : {}),
  });
  let page;
  try {
    page = await context.newPage();
    await onPage(page);
  } catch (error) {
    clearTimeout(deadline);
    await browser.close();
    throw error;
  }
  const video = page.video();
  const card = async (title, lines, duration) => {
    if (!recordVideo) return;
    await page.evaluate(
      ({ title, lines }) => {
        const panel = document.createElement('section');
        panel.id = 'gate-recording-card';
        panel.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;background:#f5f6f0;color:#1e4b3c;display:flex;flex-direction:column;justify-content:center;padding:90px;font:24px/1.6 Arial,sans-serif;box-sizing:border-box';
        const eyebrow = document.createElement('p');
        eyebrow.textContent = 'OFC · DEMO WORKFLOW VERIFICATION';
        eyebrow.style.cssText = 'font-size:18px;letter-spacing:3px;color:#68765c';
        const heading = document.createElement('h1');
        heading.textContent = title;
        heading.style.cssText = 'font-size:44px;line-height:1.2;margin:12px 0 28px';
        panel.append(eyebrow, heading);
        for (const line of lines) {
          const p = document.createElement('p');
          p.textContent = line;
          p.style.margin = '8px 0';
          panel.append(p);
        }
        document.body.append(panel);
      },
      { title, lines },
    );
    await page.waitForTimeout(duration);
    await page.locator('#gate-recording-card').evaluate((el) => el.remove());
  };
  page.setDefaultTimeout(12000);
  const result = {
    source: clientGateSource,
    testCase: gateTestCase,
    clientRequirementsStatus: 'not-tested',
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    stages: gateStages.map((g) => ({
      ...g,
      status: 'pending',
      checks: [],
      error: null,
      screenshot: false,
      clientReview: createClientReview(g.id),
    })),
    notes: [
      'Runs in a fresh browser context with test-only browser storage.',
      'ONLDC-test is a simulation; the existing ONLDC company is separate. The supplied MIS file is reference material, not the source of the simulated investment amounts.',
      'Checks the demo workflow, not real-world approval authority or external document authenticity.',
    ],
  };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const name = gateTestCase.name;
  let dealId, assetCode;
  const today = new Date().toISOString().slice(0, 10),
    due = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const read = async (key) =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), key);
  const ensure = (truth, message) => {
    if (!truth) throw Error(message);
  };
  const update = () => onProgress(structuredClone(result));
  const gap = (stage, finding) => {
    stage.clientReview.status = 'gaps-found';
    stage.clientReview.findings.push(finding);
    result.clientRequirementsStatus = 'gaps-found';
    update();
  };
  const visit = async (route) => {
    await page.goto(baseURL + route);
    await page.waitForFunction(() => Boolean(document.documentElement.dataset.workspaceReady));
  };
  const fill = async (values) => {
    for (const [key, value] of Object.entries(values)) {
      const control = page.locator(`#trkForm [name="${key}"]`);
      const tag = await control.evaluate((el) => el.tagName);
      if (tag === 'SELECT') await control.selectOption(String(value));
      else await control.fill(String(value));
    }
  };
  const save = async () => {
    await page.locator('#trkForm [type="submit"]').click();
    await page.waitForFunction(
      () =>
        location.pathname !== '/investment/entry' &&
        document.querySelector('#panel')?.getAttribute('aria-hidden') === 'true',
    );
  };
  const check = async (stage, label, action) => {
    await action();
    stage.checks.push(label);
    update();
  };
  const state = async () => {
    const rows = (await read('ofc-tracker-entries')) || [];
    const base = rows.find((r) => r.id === dealId)?.d;
    return { ...base, ...(await read('ofc-deal-state'))?.[dealId] };
  };
  const decision = async (label, expected) => {
    await page.locator(`[data-gate-deal="${dealId}"]`).filter({ hasText: label }).click();
    ensure((await state()).stage === expected, `${label} did not reach ${expected}.`);
  };
  const assertBlocked = async label => {
    const button=page.locator(`[data-gate-deal="${dealId}"]`).filter({hasText:label});
    ensure(await button.isDisabled(),label+' must be disabled while requirements are missing.');
    const before=JSON.stringify(await state()),history=JSON.stringify(await read('ofc-investment-history'));
    await button.evaluate(b=>{b.disabled=false;b.click();});
    ensure(JSON.stringify(await state())===before,label+' bypassed the decision handler.');
    ensure(JSON.stringify(await read('ofc-investment-history'))===history,'Blocked decision changed the audit history.');
  };
  const addInvestment = async (key, values) => {
    await page.locator(`[data-invest-add="${key}"][data-invest-deal="${dealId}"]`).click();
    await fill(values);
    await save();
  };
  const addPmo = async (key, values) => {
    await visit(`/pmo#trk-${key}`);
    await page.locator(`[data-new="${key}"]`).click();
    await fill({
      project: name,
      owner: 'Gate check operator',
      date: due,
      next: 'Simulated evidence for workflow verification.',
      ...values,
    });
    await save();
  };
  const pmoButton = () => page.locator(`[data-pmo-handover="${name}"]`);
  const phases = [
    async (stage) => {
      await visit('/investment#pipe');
      await page.locator('[data-new="pipe"]').first().click();
      await page.locator('#trkForm [type="submit"]').click();
      await page.locator('#trkErr:not([hidden])').waitFor();
      stage.checks.push('Required fields reject an empty opportunity.');
      await fill({
        t: name,
        partner: gateTestCase.partner,
        sector: gateTestCase.sector,
        source: gateTestCase.source,
        value: '2',
        ofc: '3',
        date: due,
        scr: today,
        prob: '50',
        prog: '0',
        next: gateTestCase.note + ' Prepare the test PIN.',
      });
      await page.locator('#trkForm [type="submit"]').click();
      await page
        .getByText('OFC requirement cannot exceed the total investment value.', { exact: true })
        .waitFor();
      stage.checks.push('OFC funding cannot exceed the investment value.');
      await fill({ ofc: '1' });
      await save();
      dealId = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.t === name && r.trk === 'Investment Pipeline Tracker',
      )?.id;
      ensure(dealId, 'New opportunity was not saved.');
      ensure((await state()).stage === 'Screening', 'New opportunities must start at Screening.');
      await visit('/investment/documents?opportunity=' + encodeURIComponent(dealId));
      await page
        .locator('#investmentUploadForm [name=files]')
        .setInputFiles(fileURLToPath(gateTestSource));
      await page.locator('#investmentUploadForm [name=category]').selectOption('Financial');
      await page.getByRole('button', { name: 'Upload documents', exact: true }).click();
      await page.getByRole('heading', { name: 'Uploaded files (1)', exact: true }).waitFor();
      const sourceFiles = await read('ofc-investment-uploads');
      ensure(
        sourceFiles.some((f) => f.dealId === dealId && f.fileName === 'MIS Feb 2026 OFC.xlsx'),
        'ONLDC reference file was not linked to the test opportunity.',
      );
      stage.checks.push(
        'ONLDC-test has the supplied February 2026 MIS reference file in its document library.',
      );
      await visit('/investment#tx|' + dealId);

      await check(stage, 'Screening advances to PIN.', () => decision('Approve to PIN', 'PIN'));
      await check(stage, 'A CEO information request keeps the opportunity at PIN.', () =>
        decision('CEO requests more information', 'PIN'),
      );
      await page
        .locator(`[data-gate-deal="${dealId}"]`)
        .filter({ hasText: 'CEO approves' })
        .click();
      ensure((await state()).stage === 'PIN', 'CEO approval bypassed the required submitted PIN.');
      const pin = await prepareTestPin(page, dealId);
      ensure(
        pin.snapshot.records.some(
          (r) => r.key === 'uploads' && r.data.fileName === 'MIS Feb 2026 OFC.xlsx',
        ),
        'PIN lost its ONLDC source-file reference.',
      );
      stage.checks.push(
        'Missing PIN blocks approval; a completed, reviewed version is submitted through the document editor.',
      );
      await check(stage, 'CEO approval reaches assessment (G2).', () =>
        decision('CEO approves', 'EC'),
      );
      const pinDecision = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.dealId === dealId && r.d?.pinDocumentId === pin.id,
      );
      ensure(
        pinDecision?.d.pinVersion === 2,
        'CEO approval did not retain the submitted PIN version.',
      );
      stage.checks.push(
        'CEO approval links to the exact submitted PIN version, including SG1 value assurance.',
      );
      stage.clientReview.findings.push(
        'PIN workflow verified with simulated narrative. Source authenticity, real approval identity and closure-report approval remain unverified.',
      );
      await page.reload();
      await page.locator(`[data-gate-deal="${dealId}"]`).first().waitFor();
      ensure((await state()).stage === 'EC', 'CEO approval did not survive reload.');
      stage.checks.push('Opportunity and CEO decisions survive reload.');
    },
    async (stage) => {
      await assertBlocked('EC: recommend proceeding');
      ensure(await page.getByRole('button',{name:'EC: request further due diligence',exact:true}).isEnabled(),'Requests for more work must remain available.');
      stage.checks.push('EC progression is blocked without a completed assessment, including direct click attempts.');
      await addInvestment('assessment', {
        deal: name,
        t: 'SG2 pre-feasibility test',
        owner: 'Gate check analyst',
        date: today,
        eq: '1',
        debt: '1',
        irr: '12',
        npv: '0.5',
        pb: '7',
        find: 'Simulated development-option comparison for SG2.',
        flags: 'Simulated market risk; validate demand before commitment.',
        rec: 'Simulated recommendation for further evaluation.',
        status: 'Completed',
      });
      const assessment = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.dealId === dealId && r.d?.t === 'SG2 pre-feasibility test',
      );
      ensure(
        assessment &&
          Number(assessment.d.irr) === 12 &&
          Number(assessment.d.npv) === 0.5 &&
          assessment.d.owner &&
          assessment.d.date,
        'SG2 assessment lost its financial KPIs, author or date.',
      );
      stage.checks.push(
        'SG2 assessment saves development option, risks, financial KPIs, author and date against the opportunity.',
      );
      await check(stage, 'EC approval advances to due diligence (G3).', () =>
        decision('EC: recommend proceeding', 'DD'),
      );
      const history = await read('ofc-investment-history');
      ensure(
        history.some((r) => r.dealId === dealId && r.from === 'EC' && r.to === 'DD'),
        'EC decision is missing from the audit history.',
      );
      stage.checks.push('EC decision is recorded against the same opportunity.');
      gap(
        stage,
        'EC advanced to SG3 with an assessment entry but without a recorded CEO/CIO pre-feasibility review, SG2 value assurance or approved studies budget.',
      );
    },
    async (stage) => {
      await assertBlocked('Complete DD and submit for FID');
      stage.checks.push('DD completion is required before submission for FID.');
      await addInvestment('dd', {
        t: 'Financial DD',
        deal: name,
        cons: 'Simulated external consultant',
        scope: 'SG3 financial feasibility verification',
        budget: '10',
        start: today,
        date: due,
        prog: '100',
        status: 'Completed',
        find: 'Simulated diligence findings for the test only.',
      });
      const diligence = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.dealId === dealId && r.d?.t === 'Financial DD',
      );
      ensure(
        diligence && Number(diligence.d.budget) === 10 && diligence.d.status === 'Completed',
        'The due-diligence workstream was not saved.',
      );
      stage.checks.push(
        'SG3 diligence records consultant, scope, budget, dates, progress and findings.',
      );
      gap(
        stage,
        'An external-consultant workstream was saved without Finance budget verification or a procurement/appointment approval record.',
      );
      await check(stage, 'Completed due diligence reaches FID.', () =>
        decision('Complete DD and submit for FID', 'FID'),
      );
      await assertBlocked('Board: approve FID');
      ensure(await page.getByRole('button',{name:'Board: decline',exact:true}).isEnabled(),'Decline must remain available.');
      await prepareTestFip(page,dealId);
      stage.checks.push('FID requires a complete reviewed FIP; missing reports cannot be bypassed by enabling the button.');
      await check(stage, 'Board approval reaches legal closing.', () =>
        decision('Board: approve FID', 'Closing'),
      );
      gap(
        stage,
        'FID requires and retains a reviewed FIP version. Independent SG3 value assurance and applicable permit/agreement approvals are not separately verified.',
      );
      const transfer = () => page.locator(`[data-invest-handover="${dealId}"]`);
      ensure(await transfer().isDisabled(), 'PMO transfer was enabled without handover evidence.');
      stage.checks.push('PMO transfer is blocked without evidence.');
      await addInvestment('close', {
        t: 'Test signed closing agreements',
        deal: name,
        date: due,
        status: 'Completed',
        legal: 'Simulated signed closing evidence.',
      });
      await addInvestment('hand', {
        t: 'PMO acceptance',
        deal: name,
        owner: 'PMO',
        date: due,
        status: 'In progress',
        next: 'PMO acceptance pending for this test.',
      });
      await addInvestment('hand', {
        t: 'FID package',
        deal: name,
        owner: 'PMO',
        date: due,
        status: 'Ready',
        next: 'Simulated approved FID package.',
      });
      ensure(await transfer().isDisabled(), 'PMO transfer ignored an incomplete handover item.');
      stage.checks.push('Incomplete handover evidence keeps the transfer blocked.');
      const item = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.dealId === dealId && r.d?.t === 'PMO acceptance',
      );
      const generatedHandover = (await read('ofc-tracker-entries')).filter(
        (r) => r.d?.dealId === dealId && r.d?.automationKey?.includes(':hand:'),
      );
      ensure(generatedHandover.length===13,'Closing did not generate the full handover checklist.');
      ensure(await transfer().isDisabled(),'Generated checklist items bypassed readiness.');
      await visit('/investment#trk-hand');
      await page.locator('#te').selectOption(name);
      for(const row of [item,...generatedHandover])
        await page.locator(`[data-invest-status="${row.id}"]`).selectOption('Ready');
      await visit('/investment#tx|'+dealId);
      stage.checks.push('All 13 generated handover items require explicit readiness review.');
      ensure(await transfer().isEnabled(), 'Ready handover evidence did not enable PMO transfer.');
      await transfer().click();
      const projects = await read('ofc-live-projects');
      ensure(
        projects.filter((p) => p.dealId === dealId).length === 1,
        'PMO handover must create exactly one project.',
      );
      ensure(
        (await state()).status === 'Handed over to PMO',
        'Investment did not record the handover.',
      );
      stage.checks.push('Handover creates one linked PMO project and closes Investment ownership.');
      await page.reload();
      await page
        .getByRole('link', { name: /Handed over.*Open PMO/ })
        .first()
        .waitFor();
      ensure(
        (await read('ofc-live-projects')).filter((p) => p.dealId === dealId).length === 1,
        'Reload duplicated the PMO project.',
      );
      stage.checks.push('A repeated transfer is unavailable after handover.');
      const packageRecords = projects.find((p) => p.dealId === dealId).investmentHandover?.records;
      ensure(
        packageRecords?.some((r) => r.key === 'tasks' && r.status === 'Not started'),
        'Open tasks were lost during handover.',
      );
      ensure(
        packageRecords.some((r) => r.key === 'close' && r.t === 'Test signed closing agreements'),
        'Closing references were lost during handover.',
      );
      await visit('/pmo#delivery');
      await page.getByRole('heading', { name: 'Investment handover packages' }).waitFor();
      const packageDetails = page.locator('details').filter({ hasText: name + ':' });
      await packageDetails.locator('summary').click();
      await packageDetails.getByText('Test signed closing agreements', { exact: true }).waitFor();
      stage.checks.push('PMO displays the transferred records, open tasks and source link.');
    },
    async (stage) => {
      await visit('/pmo#readiness');
      await pmoButton().waitFor();
      ensure(await pmoButton().isDisabled(), 'Operations transfer was enabled without evidence.');
      await addPmo('handover', {
        t: 'Training evidence',
        category: 'Training',
        status: 'Completed',
      });
      await visit('/pmo#readiness');
      ensure(
        await pmoButton().isDisabled(),
        'Completed handover rows bypassed commissioning and acceptance.',
      );
      stage.checks.push(
        'Handover records alone cannot bypass commissioning and operations acceptance.',
      );
      await addPmo('commission', {
        t: 'Integrated commissioning test',
        criteria: 'Signed test result',
        prog: '50',
        status: 'In progress',
      });
      await addPmo('punch', { t: 'High priority defect', priority: 'High', status: 'In progress' });
      await addPmo('handover', {
        t: 'Operations acceptance certificate',
        category: 'Operations acceptance',
        status: 'Completed',
      });
      await visit('/pmo#readiness');
      ensure(
        await pmoButton().isDisabled(),
        'Acceptance bypassed outstanding commissioning and defects.',
      );
      await visit('/pmo#trk-commission');
      const commission = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.project === name && r.d?.t === 'Integrated commissioning test',
      );
      await page.locator(`[data-status-id="${commission.id}"]`).selectOption('Completed');
      await visit('/pmo#readiness');
      ensure(
        await pmoButton().isDisabled(),
        'An open high-priority defect did not block operations transfer.',
      );
      stage.checks.push('Open high-priority defects block G5 even after commissioning.');
      await visit('/pmo#trk-punch');
      const punch = (await read('ofc-tracker-entries')).find(
        (r) => r.d?.project === name && r.d?.t === 'High priority defect',
      );
      await page.locator(`[data-status-id="${punch.id}"]`).selectOption('Completed');
      await visit('/pmo#readiness');
      ensure(await pmoButton().isDisabled(),'Transfer must require project and financial closeout.');
      await pmoButton().evaluate(b=>{b.disabled=false;b.click();});
      ensure(!((await read('ofc-live-assets'))||[]).some(a=>a.dealId===dealId),'Direct click bypassed closeout requirements.');
      await addPmo('closeout',{t:'Project closure and contractual settlement review',status:'Completed'});
      await addPmo('finance',{t:'Final cost reconciliation and settlement',kind:'Final account',amount:'2',status:'Completed'});
      await visit('/pmo#readiness');
      ensure(await pmoButton().isEnabled(),'Completed commissioning, acceptance and closeout must enable transfer.');
      stage.checks.push('Operations transfer checks project and financial closeout in the action handler.');
      await pmoButton().click();
      gap(
        stage,
        'Completed project and financial closeout records are required. Authenticity of closure evidence and exhaustive invoice/contract settlement coverage remain unverified.',
      );
      const assets = await read('ofc-live-assets');
      ensure(
        assets.filter((a) => a.dealId === dealId).length === 1,
        'Operations transfer must create exactly one operating asset.',
      );
      assetCode = assets.find((a) => a.dealId === dealId).code;
      ensure(assetCode !== 'ONLDC', 'Test asset must not replace the existing ONLDC company.');
      stage.checks.push('ONLDC-test has a separate asset identity from the real ONLDC company.');
      stage.checks.push('Completed readiness checks transfer one linked operating asset to G5.');
      await page.reload();
      await page
        .getByRole('link', { name: /Handed over.*Open operating asset/ })
        .first()
        .waitFor();
      ensure(
        (await read('ofc-live-assets')).filter((a) => a.dealId === dealId).length === 1,
        'Reload duplicated the operating asset.',
      );
      stage.checks.push('G5 transfer persists without duplicating the asset.');
    },
    async (stage) => {
      await visit(`/asset-management#company|${encodeURIComponent(assetCode)}|about`);
      await page.locator('#view').getByText('Received from PMO.', { exact: false }).waitFor();
      ensure(
        (await page.locator('#view').innerText()).includes(name),
        'The handed-over asset is missing from Company 360.',
      );
      stage.checks.push('The operating asset appears in Company 360 with PMO provenance.');
      await visit('/asset-management#trk-financials');
      await page.locator('[data-new="financials"]').click();
      await fill({
        sub: name,
        period: 'Gate verification period',
        rev: '1.2',
        bud: '1.5',
        eb: '0.2',
        owner: 'Gate check analyst',
      });
      await save();
      await page.reload();
      await page.locator('#view').getByText('Gate verification period', { exact: true }).waitFor();
      ensure(
        (await read('ofc-tracker-entries')).some(
          (r) => r.trk === 'Asset Financial Data' && r.d?.sub === name && r.d?.rev === 1.2,
        ),
        'Operating financials were not persisted.',
      );
      stage.checks.push('Financial actuals can be added and survive reload.');
      await visit(`/asset-management#company|${encodeURIComponent(assetCode)}|budget`);
      const visible = await page.locator('#view').innerText();
      ensure(
        visible.includes('1.2') && visible.includes('1.5'),
        'Company view did not use the uploaded actual and budget values.',
      );
      stage.checks.push('Company performance uses the new operating financials.');
      ensure(!errors.length, 'Browser errors occurred: ' + errors.slice(0, 2).join('; '));
      stage.checks.push('No browser runtime errors occurred during the journey.');
      stage.clientReview.findings.push(
        'Operating financials were tested. PIR preparation, benefits review, lessons learned, Project Assurance site verification and management review were not exercised; G5 process coverage remains incomplete.',
      );
    },
  ];
  try {
    await mkdir(artifactDir, { recursive: true });
    update();
    for (let i = 0; i < phases.length; i++) {
      const stage = result.stages[i];
      stage.status = 'running';
      stage.startedAt = new Date().toISOString();
      update();
      try {
        await onStage(structuredClone(stage));
        await card(
          `${stage.id}: ${stage.title}`,
          [
            'Automated browser run using simulated test records.',
            'Demonstrates the workflow; full client-process acceptance is not established.',
          ],
          3000,
        );
        await phases[i](stage);
        stage.status = 'passed';
      } catch (error) {
        stage.status = 'failed';
        stage.error = String(error.message || error).slice(0, 2000);
        result.stages.slice(i + 1).forEach((s) => {
          s.status = 'skipped';
        });
        result.status = 'failed';
      }
      stage.finishedAt = new Date().toISOString();
      try {
        await page.screenshot({ path: path.join(artifactDir, stage.id + '.png'), fullPage: false });
        stage.screenshot = true;
      } catch {}
      update();
      if (stagePause) await page.waitForTimeout(stagePause);
      if (stage.status === 'failed') break;
    }
    if (result.status === 'running')
      result.status =
        result.clientRequirementsStatus === 'gaps-found' ? 'needs-attention' : 'passed';
    result.finishedAt = new Date().toISOString();
    update();
    await card(
      result.stages.every((s) => s.status === 'passed')
        ? 'All five demo workflows completed'
        : 'The workflow check found a failure',
      [
        result.stages.map((s) => `${s.id}: ${s.status}`).join(' · '),
        'Known gaps: approval evidence, budget verification, FID documentation and project closeout.',
        'Post-implementation review remains untested. See the accompanying results for details.',
        'This is demo evidence, not full client-process acceptance.',
      ],
      9000,
    );
    if (finishPause) await page.waitForTimeout(finishPause);
    clearTimeout(deadline);
    await beforeClose();
    return result;
  } finally {
    clearTimeout(deadline);
    try {
      await context.close();
      if (video) await video.saveAs(path.join(artifactDir, 'ofc-g1-to-g5-demo.webm'));
    } finally {
      await browser.close();
    }
  }
}
