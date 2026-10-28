import { dashboardCreateLink } from "./dashboard-create-link.js";
import { gateReadiness, renderGateReadiness, renderGateBlockers } from '../lib/gate-readiness.mjs';
import { REV_A, REV_B, EB_A, EB_B, SUBS, DECISIONS } from "./group-data";
import { createShared } from "./shared";
export function initialize(scope) {
  const APP_ID = 'pmo',
    APP_NAME = 'PMO';
  let {
    $,
    $$,
    TODAY,
    MON,
    escH,
    fmtDate,
    toD,
    daysLate,
    f1,
    pct,
    sp,
    gap,
    listN,
    nk,
    toast,
    APPS,
    ROLES,
    role,
    APP_URL,
    openApp,
    niceScale,
    niceMax,
    colsChart,
    waterfall,
    spark,
    wfKey,
    wfOverlay,
    wfState,
    wfNote,
    setWorkflow,
    wfActions,
    recordOverlay,
    fieldOverlay,
    handoverWrite,
    recordPatch,
    patchRecord,
    liveRegister,
    pushLive
  } = createShared(scope, APP_ID, {
    closeFlyouts: () => closeFlyouts(),
    go: v => go(v),
    getRole: () => role
  });

  /* PMO demo scope drafted from the SG4 brief; all project figures are illustrative. */
  const PROJECTS = [{
    t: 'Subsidiary D',
    phase: 'Construction',
    budget: 96,
    spent: 57.6,
    forecast: 101.2,
    plan: 72,
    prog: 60,
    baseline: '2026-12-15',
    date: '2027-03-31',
    status: 'Delayed',
    owner: 'PMO Director',
    next: 'Agree contractor mobilisation recovery plan with the Transformation Committee.'
  }, {
    t: 'Subsidiary P',
    phase: 'Commissioning',
    budget: 18,
    spent: 15.3,
    forecast: 18,
    plan: 85,
    prog: 85,
    baseline: '2026-11-30',
    date: '2026-11-30',
    status: 'On track',
    owner: 'Commissioning Manager',
    next: 'Complete performance trials and obtain operations acceptance.'
  }, {
    t: 'Subsidiary Q',
    phase: 'Pre-commissioning',
    budget: 14,
    spent: 10.5,
    forecast: 14,
    plan: 75,
    prog: 75,
    baseline: '2026-12-20',
    date: '2026-12-20',
    status: 'On track',
    owner: 'Project Manager',
    next: 'Complete utility energisation before integrated testing.'
  }];
  function projectsAll() {
    const base = [...PROJECTS, ...liveRegister('ofc-live-projects').filter(p => !PROJECTS.some(b => b.t === p.t))];
    return base.map(p => ({
      ...p,
      ...recordPatch('ofc-pmo-project-state', p.t)
    }));
  }
  const PROJECT_NAMES = projectsAll().map(p => p.t);
  const DONE = new Set(['Completed', 'Closed', 'Accepted']);
  const field = (k, l, type = 'text', extra = {}) => ({
    k,
    l,
    type,
    ...extra
  });
  const common = [field('t', 'Item / deliverable', 'text', {
    req: 1,
    full: 1
  }), field('project', 'Project', 'select', {
    o: PROJECT_NAMES
  }), field('owner', 'Accountable owner', 'text', {
    req: 1
  }), field('date', 'Due date', 'date', {
    req: 1
  })];
  const status = field('status', 'Status', 'select', {
    o: ['Not started', 'In progress', 'Blocked', 'Completed']
  });
  const notes = field('next', 'Next action / evidence', 'textarea', {
    full: 1
  });
  const baseCols = [['t', 'Item'], ['project', 'Project'], ['owner', 'Owner'], ['date', 'Due date', 'date'], ['status', 'Status', 'status']];
  function tracker(n, d, extra, cols, rows) {
    return {
      n,
      d,
      fields: [...common, ...extra, status, notes],
      cols: [...baseCols, ...cols, ['next', 'Next action / evidence']],
      rows
    };
  }
  const row = (t, project, owner, date, status, next, extra = {}) => ({
    t,
    project,
    owner,
    date,
    status,
    next,
    ...extra
  });
  const TRK = {
    schedule: tracker('Project Milestone Tracker', 'Construction milestones and forecast delivery dates.', [field('prog', 'Progress (%)', 'number', {
      min: 0,
      max: 100,
      req: 1
    })], [['prog', 'Progress', 'prog']], [row('Contractor mobilisation recovery', 'Subsidiary D', 'PMO Director', '2026-09-10', 'Blocked', 'INT-003: Transformation Committee decision outstanding.', {
      prog: 40
    }), row('Civil works complete', 'Subsidiary D', 'Construction Manager', '2026-11-30', 'In progress', 'Resequence work packages following mobilisation.', {
      prog: 60
    }), row('Performance trial complete', 'Subsidiary P', 'Commissioning Manager', '2026-10-25', 'In progress', 'Run continuous production test.', {
      prog: 75
    }), row('Utilities energised', 'Subsidiary Q', 'Project Manager', '2026-10-10', 'In progress', 'Confirm power connection and safety inspection.', {
      prog: 70
    })]),
    commission: tracker('Commissioning Plan Tracker', 'Testing, acceptance criteria and commissioning evidence.', [field('criteria', 'Acceptance criteria', 'text', {
      req: 1
    }), field('prog', 'Progress (%)', 'number', {
      min: 0,
      max: 100,
      req: 1
    })], [['criteria', 'Acceptance criteria'], ['prog', 'Progress', 'prog']], [row('Integrated performance test', 'Subsidiary P', 'Commissioning Manager', '2026-10-25', 'In progress', 'Operations to witness 72-hour trial.', {
      criteria: '72 hours at design throughput',
      prog: 75
    }), row('Safety interlock verification', 'Subsidiary P', 'HSE Lead', '2026-09-30', 'Completed', 'Signed test certificate available.', {
      criteria: 'All emergency stops pass',
      prog: 100
    }), row('Utility readiness inspection', 'Subsidiary Q', 'Engineering Lead', '2026-10-10', 'In progress', 'Complete energisation permit.', {
      criteria: 'Power and water certified',
      prog: 50
    }), row('Commissioning plan approval', 'Subsidiary D', 'Project Manager', '2026-12-15', 'Not started', 'Rebase plan to March 2027 completion.', {
      criteria: 'Operations approve revised plan',
      prog: 0
    })]),
    punch: tracker('Punch List Tracker', 'Defects to resolve before operational acceptance.', [field('priority', 'Criticality', 'select', {
      o: ['Critical', 'High', 'Medium', 'Low']
    })], [['priority', 'Criticality']], [row('Emergency stop retest', 'Subsidiary P', 'HSE Lead', '2026-09-30', 'In progress', 'Retest under full load; acceptance blocker.', {
      priority: 'Critical'
    }), row('Replace damaged insulation', 'Subsidiary P', 'Contractor', '2026-10-05', 'Not started', 'Replace and photograph repair.', {
      priority: 'Medium'
    }), row('Calibrate flow meters', 'Subsidiary Q', 'Instrumentation Lead', '2026-10-12', 'In progress', 'Provide calibration certificates.', {
      priority: 'High'
    }), row('Verify equipment labels', 'Subsidiary Q', 'Contractor', '2026-09-20', 'Completed', 'Labels checked against as-built drawings.', {
      priority: 'Low'
    })]),
    risk: tracker('Project Risk Register', 'Delivery risks, accountable owners and mitigating actions.', [field('probability', 'Likelihood (1–5)', 'number', {
      min: 1,
      max: 5,
      req: 1
    }), field('impact', 'Impact (1–5)', 'number', {
      min: 1,
      max: 5,
      req: 1
    })], [['probability', 'Likelihood'], ['impact', 'Impact']], [row('Mobilisation delay moves first revenue into 2027', 'Subsidiary D', 'PMO Director', '2026-09-10', 'Blocked', 'Escalate recovery plan under INT-003.', {
      probability: 5,
      impact: 5
    }), row('Facility C tranche 2 funding timing', 'Subsidiary D', 'Treasury / PMO', '2026-10-30', 'In progress', 'Track conditions precedent for the committed 10.0m draw.', {
      probability: 3,
      impact: 5
    }), row('Performance test below design capacity', 'Subsidiary P', 'Commissioning Manager', '2026-10-25', 'In progress', 'Keep vendor support on site through trial.', {
      probability: 3,
      impact: 4
    }), row('Utility connection delayed', 'Subsidiary Q', 'Project Manager', '2026-10-10', 'In progress', 'Confirm utility provider mobilisation.', {
      probability: 2,
      impact: 4
    })]),
    handover: tracker('Operations Handover Tracker', 'Evidence and sign-offs for the SG4 → SG5 gate.', [field('category', 'Deliverable type', 'select', {
      o: ['Operations acceptance', 'Training', 'As-built drawings', 'O&M manuals', 'Warranty']
    })], [['category', 'Deliverable type']], [...PROJECTS.map(p => p.t).map(project => row('Operations acceptance certificate', project, 'Operations Director', PROJECTS.find(p => p.t === project).date, 'Not started', 'Operations signature required after commissioning.', {
      category: 'Operations acceptance'
    })), row('Operator training and competency', 'Subsidiary P', 'Operations Manager', '2026-10-30', 'In progress', 'Complete training for the final shift.', {
      category: 'Training'
    }), row('As-built drawing pack', 'Subsidiary P', 'Engineering Lead', '2026-09-20', 'Completed', 'Reviewed drawing register issued.', {
      category: 'As-built drawings'
    }), row('O&M manuals', 'Subsidiary Q', 'Engineering Lead', '2026-11-15', 'In progress', 'Collect vendor manuals.', {
      category: 'O&M manuals'
    })]),
    closeout: tracker('Project Close-out Checklist', 'Contractual, technical and document close-out.', [], [], [row('Final HSE dossier', 'Subsidiary P', 'HSE Lead', '2026-11-15', 'In progress', 'Compile certificates and incident close-out.'), row('Lessons learned workshop', 'Subsidiary Q', 'Project Manager', '2026-12-15', 'Not started', 'Invite Investment and Operations.'), row('Contract completion certificate', 'Subsidiary D', 'Commercial Manager', '2027-03-31', 'Not started', 'Subject to revised completion date.')]),
    finance: tracker('Financial Closure Tracker', 'Final accounts, claims, retentions and capitalisation. Values in OMR m.', [field('amount', 'Amount (OMR m)', 'number', {
      min: 0,
      req: 1
    }), field('kind', 'Account type', 'select', {
      o: ['Final account', 'Retention', 'Claim', 'Capitalisation']
    })], [['kind', 'Account type'], ['amount', 'OMR m', 'm']], [row('Agree contractor final account', 'Subsidiary P', 'Commercial Manager', '2026-11-20', 'In progress', 'Reconcile certified quantities.', {
      amount: 1.2,
      kind: 'Final account'
    }), row('Retention release review', 'Subsidiary Q', 'Finance Controller', '2026-12-20', 'Not started', 'Verify contractual release conditions.', {
      amount: 0.7,
      kind: 'Retention'
    }), row('Mobilisation extension claim', 'Subsidiary D', 'Commercial Manager', '2026-10-15', 'Blocked', 'Validate entitlement before approval.', {
      amount: 5.2,
      kind: 'Claim'
    }), row('Asset capitalisation pack', 'Subsidiary P', 'Finance Controller', '2026-11-30', 'Not started', 'Provide asset register to Finance & Accounts.', {
      amount: 18,
      kind: 'Capitalisation'
    })])
  };
  const TRK_KEYS = Object.keys(TRK);
  let TLOCAL = [];
  try {
    const stored = JSON.parse(localStorage.getItem('ofc-tracker-entries') || '[]');
    TLOCAL = Array.isArray(stored) ? stored : [];
  } catch {}
  function saveT() {
    try {
      localStorage.setItem('ofc-tracker-entries', JSON.stringify(TLOCAL));
      return true;
    } catch {
      toast('Browser storage is unavailable. Your changes could not be saved.');
      return false;
    }
  }
  let STATUS_EDITS = {};
  try {
    const value = JSON.parse(localStorage.getItem('ofc-pmo-status') || '{}');
    if (value && typeof value === 'object' && !Array.isArray(value)) STATUS_EDITS = value;
  } catch {}
  function trkRows(key) {
    return [...TLOCAL.filter(r => r.app === APP_ID && r.trk === TRK[key].n && r.d).map(r => ({
      ...r.d,
      _local: r.id,
      _id: r.id
    })), ...TRK[key].rows.map((r, i) => ({
      ...r,
      _id: key + ':' + i
    }))].map(r => {
      const status = STATUS_EDITS[r._id] || r.status;
      return {
        ...r,
        status,
        overdue: !!(r.date && !DONE.has(status) && daysLate(r.date) > 0)
      };
    });
  }
  function statusControl(r) {
    return `<select class="pmo-status noprint" data-status-id="${escH(r._id)}" aria-label="Status for ${escH(r.t)}">${['Not started', 'In progress', 'Blocked', 'Completed'].map(s => `<option${r.status === s ? ' selected' : ''}>${s}</option>`).join('')}</select><span class="pmo-print-status">${pill(r.status)}</span>`;
  }
  scope.listen(document, 'change', e => {
    const id = e.target.dataset.statusId;
    if (!id || !role.apps.includes(APP_ID)) return;
    const previous = STATUS_EDITS[id];
    STATUS_EDITS[id] = e.target.value;
    try {
      localStorage.setItem('ofc-pmo-status', JSON.stringify(STATUS_EDITS));
    } catch {
      if (previous === undefined) delete STATUS_EDITS[id];else STATUS_EDITS[id] = previous;
      toast('Status could not be saved.');
      fillTrk();
      return;
    }
    fillTrk();
    toast('Status updated. Dashboards and reports reflect this change.');
  });
  const openCount = key => trkRows(key).filter(r => !DONE.has(r.status)).length;
  const VIEWS = {
    home: 'Overview',
    delivery: 'Project Delivery',
    commissioning: 'Commissioning & Punch Lists',
    readiness: 'Operations Handover Readiness',
    risks: 'Risks & Escalations',
    financial: 'Financial Close-out',
    'rep-exec': 'PMO Executive Summary',
    'rep-risk': 'Delivery Risk Report',
    'rep-handover': 'Operations Handover Report'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['delivery', 'commissioning', 'readiness', 'risks', 'financial'];
  const REPS = ['rep-exec', 'rep-risk', 'rep-handover'];
  let view = 'home';
  function section(v) {
    return v === 'home' ? 'home' : v.startsWith('trk-') ? 'input' : v.startsWith('rep-') ? 'reports' : 'dashboards';
  }
  function go(v, push = true) {
    view = VIEWS[v] ? v : 'home';
    if (push && location.hash.slice(1) !== view) history.pushState(null, '', '#' + view);
    hidePane();
    closeSheet();
    render();
    window.scrollTo({
      top: 0
    });
  }
  scope.listen(window, 'popstate', () => go(location.hash.slice(1) || 'home', false));
  const vh = (t, d, actions = '') => `<div class="vh"><div><h2>${escH(t)}</h2><p>${escH(d)}</p></div><div class="vh-actions noprint">${actions}</div></div>`;
  const exportBtn = '<button class="btn ghost sm" data-export>Export CSV</button>';
  const printBtn = '<button class="btn ghost sm" data-print>Print / PDF</button>';
  const m1 = v => (+v).toFixed(1);
  const progBar = p => `<div class="pmo-progress"><meter min="0" max="100" value="${Math.max(0, Math.min(100, +p || 0))}" aria-label="Progress"></meter><span>${Math.round(+p || 0)}%</span></div>`;
  const pill = s => `<span class="pill ${['Blocked', 'Delayed'].includes(s) ? 'esc' : DONE.has(s) ? 'ok' : 'pend'}">${escH(s)}</span>`;
  const ico = {
    plus: '+',
    spark: '✦'
  };
  const allRows = () => TRK_KEYS.flatMap(key => trkRows(key).map(r => ({
    ...r,
    key
  })));
  const projectRows = (key, p) => trkRows(key).filter(r => r.project === p);
  const completePct = rows => rows.length ? Math.round(rows.filter(r => DONE.has(r.status)).length / rows.length * 100) : 0;
  function pmoReadiness(p) {
    return gateReadiness({gate:4,deal:{id:p.dealId,owner:p.owner},rows:Object.fromEntries(['commission','punch','handover','closeout','finance'].map(k=>[k,projectRows(k,p.t)]))});
  }
  function gate(p) {
    const tests = projectRows('commission', p),
      punch = projectRows('punch', p).filter(r => ['Critical', 'High'].includes(r.priority) && !DONE.has(r.status)),
      handover = projectRows('handover', p),
      acceptance = handover.filter(r => r.category === 'Operations acceptance');
    return {
      tests: completePct(tests),
      docs: completePct(handover),
      punch: punch.length,
      ready: !pmoReadiness(projectsAll().find(project=>project.t===p)||{t:p}).pending.length
    };
  }
  const table = (heads, rows) => `<div class="tscroll"><table class="ttbl"><thead><tr>${heads.map(h => `<th>${escH(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${heads.length}">No items to show.</td></tr>`}</tbody></table></div>`;
  const card = (label, value, context, target) => `<button class="kc" data-go="${target}" style="text-align:left"><span class="lbl">${label}</span><div class="val num">${value}</div><div class="ctx">${context}</div><span class="see">View details ↗</span></button>`;
  const block = (title, body, link = '') => `<section class="wp"><div class="wp-h"><h2>${title}</h2>${link}</div>${body}</section>`;
  function delivery() {
    return table(['Project / phase', 'Approved capex', 'Spent', 'Forecast at completion', 'Delivery progress', 'Baseline → forecast', 'Status'], projectsAll().map(p => [`<b>${escH(p.t)}</b><small style="display:block">${escH(p.phase)}</small>`, m1(p.budget), m1(p.spent), `${m1(p.forecast)}${p.forecast > p.budget ? ` <span class="neg">(+${m1(p.forecast - p.budget)})</span>` : ''}`, progBar(p.prog) + `<small>Baseline ${p.plan}%</small>`, `${fmtDate(p.baseline)} → ${fmtDate(p.date)}`, projectControls(p)]));
  }
  function readiness() {
    return projectsAll().map(p=>`<details class="pmo-readiness-detail"><summary>${escH(p.t)}: ${gate(p.t).ready?'Ready for operations review':'Preparation needed'}</summary>${renderGateReadiness(pmoReadiness(p),escH)}</details>`).join('') + table(['Project', 'Commissioning complete', 'Handover evidence complete', 'Critical / high punch items', 'SG5 gate'], projectsAll().map(p => {
      const g = gate(p.t);
      return [escH(p.t), progBar(g.tests), progBar(g.docs), g.punch, pill(g.ready ? 'Accepted' : 'Blocked')];
    }));
  }
  function itemTable(rows) {
    return table(['Item', 'Project', 'Owner', 'Due', 'Status', 'Next action'], rows.map(r => [escH(r.t), escH(r.project), escH(r.owner), fmtDate(r.date) + (r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''), pill(r.status), escH(r.next)]));
  }
  function vHome() {
    const rows = allRows(),
      late = rows.filter(r => r.overdue),
      risks = trkRows('risk').filter(r => !DONE.has(r.status) && r.probability * r.impact >= 15),
      ready = projectsAll().filter(p => gate(p.t).ready).length;
    return `<div class="stack">${vh('Execution to operational readiness', 'SG4 · portfolio snapshot at 23 September 2026', printBtn)}<div class="kpi5">${card('Projects in execution', projectsAll().length, 'Construction through commissioning', 'delivery')}${card('Approved capex', m1(projectsAll().reduce((n, p) => n + p.budget, 0)) + 'm', 'Forecast at completion ' + m1(projectsAll().reduce((n, p) => n + p.forecast, 0)) + 'm', 'financial')}${card('Overdue tracker items', late.length, 'Across all seven PMO trackers', 'risks')}${card('High delivery risks', risks.length, 'Risk score 15 or higher', 'risks')}${card('Ready for operations', `${ready} / ${projectsAll().length}`, 'Evidence and acceptance required', 'readiness')}</div>
 <section class="wp pmo-gate"><div><span class="pill">SG3 · Investment</span><p>FID, closing and transfer</p><a class="see" href="/investment#closed">Investment handover ↗</a></div><div class="pmo-current"><span class="pill">SG4 · PMO</span><p>Build → commission → close out</p><b>Operations acceptance is the exit gate</b></div><div><span class="pill">SG5 · Operations</span><p>Accepted assets enter operation</p><button class="see" data-go="readiness">Review readiness ↗</button></div></section>
 ${block('Projects in execution', delivery(), '<button class="see" data-go="trk-schedule">Milestone tracker ↗</button>')}
 <div class="grid2">${block('Needs attention', itemTable(rows.filter(r => r.status === 'Blocked' || r.overdue).slice(0, 6)))}${block('Commissioning and acceptance', readiness(), '<button class="see" data-go="readiness">Gate checklist ↗</button>')}</div>
 <p class="src">Sample figures. Project budgets and phases match Investment. Tracker scope is a proposed SG4 demo for PMO review.</p></div>`;
  }
  function investmentPackages() {
    const projects = projectsAll().filter(p => p.investmentHandover);
    if (!projects.length) return '';
    return block('Investment handover packages', '<p class="src">Records captured at transfer, including open work and conditions. Open Investment for current records and attached files.</p>' + projects.map(p =>
      `<details><summary>${escH(p.t)}: ${p.investmentHandover.records.length} transferred records</summary><a class="see" href="/investment#tx|${encodeURIComponent(p.dealId)}">Open source records and documents</a>${table(['Item', 'Owner', 'Due', 'Status', 'Notes / conditions', 'Document'], p.investmentHandover.records.map(r => [escH(r.t), escH(r.owner), fmtDate(r.date), pill(r.status), escH([r.next, r.conditions].filter(Boolean).join('; ')), escH(r.fileName)]))}</details>`
    ).join(''));
  }
  function vDashboard(v) {
    let body = '';
    if (v === 'delivery') body = investmentPackages() + block('Delivery baseline', delivery()) + block('Milestones and recovery actions', itemTable(trkRows('schedule')), '<button class="see" data-go="trk-schedule">Manage milestones ↗</button>');
    if (v === 'commissioning') body = block('Commissioning plan', itemTable(trkRows('commission')), '<button class="see" data-go="trk-commission">Manage tests ↗</button>') + block('Open punch items', itemTable(trkRows('punch').filter(r => !DONE.has(r.status))), '<button class="see" data-go="trk-punch">Manage punch list ↗</button>');
    if (v === 'readiness') body = block('SG4 → SG5 acceptance', readiness()) + '<p class="src">Ready requires all commissioning and handover records completed, no open critical / high punch items, and an operations acceptance certificate. Confirm handover below when the operations handover evidence is completed.</p>' + block('Handover evidence', itemTable(trkRows('handover')), '<button class="see" data-go="trk-handover">Manage evidence ↗</button>') + block('Project close-out', itemTable(trkRows('closeout')), '<button class="see" data-go="trk-closeout">Manage checklist ↗</button>');
    if (v === 'risks') body = block('Risk exposure', table(['Risk', 'Project', 'Score / 25', 'Owner', 'Mitigation', 'Status'], trkRows('risk').map(r => [escH(r.t), escH(r.project), `<b class="${r.probability * r.impact >= 15 ? 'neg' : ''}">${r.probability * r.impact}</b>`, escH(r.owner), escH(r.next), pill(r.status)])), '<button class="see" data-go="trk-risk">Risk register ↗</button>') + block('Overdue actions across PMO', itemTable(allRows().filter(r => r.overdue))) + '<p class="src">Score = likelihood × impact, each from 1 to 5; high risk ≥ 15. Subsidiary D mobilisation is escalated under Corporate decision INT-003.</p>';
    if (v === 'financial') {
      const f = trkRows('finance');
      body = block('Capex and cost to complete', table(['Project', 'Approved OMR m', 'Spent OMR m', 'Forecast OMR m', 'Cost to complete OMR m'], projectsAll().map(p => [escH(p.t), m1(p.budget), m1(p.spent), m1(p.forecast), m1(p.forecast - p.spent)]))) + block('Financial closure', itemTable(f), '<button class="see" data-go="trk-finance">Manage financial closure ↗</button>') + block('Open amounts by account type', table(['Type', 'Open OMR m'], ['Final account', 'Retention', 'Claim', 'Capitalisation'].map(kind => [kind, m1(f.filter(r => r.kind === kind && !DONE.has(r.status)).reduce((sum, r) => sum + (+r.amount || 0), 0))]))) + '<p class="src">Account types are shown separately: capitalisation and settlement records can overlap and must not be added together. Cost forecasts are sample baselines; new financial closure records do not change approved budgets.</p><a class="see" href="/treasury#fund">Treasury funding and Facility C ↗</a>';
    }
    return `<div class="stack">${vh(VIEWS[v], 'SG4 · sample baseline and current browser tracker entries', exportBtn + printBtn)}${body}${v === 'readiness' ? pmoHandovers() : ''}</div>`;
  }
  function vRep(v) {
    const rows = allRows(),
      risks = trkRows('risk').filter(r => !DONE.has(r.status) && r.probability * r.impact >= 15),
      late = rows.filter(r => r.overdue),
      ready = projectsAll().filter(p => gate(p.t).ready);
    let body = '';
    if (v === 'rep-exec') body = `<p class="lead">The execution portfolio holds <b>${projectsAll().length} projects</b> with approved capex of <b>OMR ${m1(projectsAll().reduce((n, p) => n + p.budget, 0))}m</b>. Forecast cost is <b>OMR ${m1(projectsAll().reduce((n, p) => n + p.forecast, 0))}m</b>, including a 5.2m overrun at Subsidiary D. Its forecast completion remains <b>31 March 2027</b>.</p><h3>Delivery priorities</h3>${itemTable(rows.filter(r => r.status === 'Blocked' || r.overdue))}<h3>Decisions and dependencies</h3><p>Resolve INT-003 with the Transformation Committee. Coordinate the committed 10.0m Facility C tranche 2 draw with Treasury; ${projectsAll().some(p => p.t === 'Al Jazir') ? 'Al Jazir has been handed over by Investment and is included in the execution portfolio.' : 'Al Jazir remains in Investment pending FID and is excluded from the execution portfolio.'}</p>`;
    if (v === 'rep-risk') body = `<p class="lead"><b>${risks.length} high delivery risks</b> remain open and <b>${late.length} tracker items</b> are overdue at the demo reporting date.</p><h3>High exposure items</h3>${itemTable(risks)}<h3>Overdue follow-up</h3>${itemTable(late)}`;
    if (v === 'rep-handover') body = `<p class="lead"><b>${ready.length} of ${projectsAll().length} projects</b> meet the recorded operations acceptance checks.</p>${readiness()}<h3>Outstanding acceptance evidence</h3>${itemTable(trkRows('handover').filter(r => !DONE.has(r.status)))}<h3>Gate recommendation</h3><p>${ready.length ? `Review completed evidence for ${ready.map(p => p.t).join(', ')} before formal acceptance.` : 'Keep the SG4 gate open until testing, critical defects and operations sign-off are complete.'}</p>`;
    return `<div class="stack">${vh(VIEWS[v], 'Demo draft · assembled locally from current tracker data', `<button class="btn ghost sm" data-regen>Regenerate</button>` + exportBtn + printBtn)}<section class="wp rep-doc" id="repDoc"><span class="ai-badge">✦ AI report preview · template-generated</span><p class="src">As of 23 September 2026 · Sources: project baseline and PMO trackers. No external AI service is connected. Review before use.</p>${body}</section></div>`;
  }
  function render() {
    PROJECT_NAMES.splice(0, PROJECT_NAMES.length, ...projectsAll().map(p => p.t));
    document.title = `${VIEWS[view]} · PMO · Oman Food Capital`;
    $('#crumbView').textContent = view === 'home' ? '' : ' / ' + VIEWS[view];
    syncRail();
    refreshBadge();
    const el = $('#view');
    if (!role.apps.includes(APP_ID)) {
      el.innerHTML = '<div class="noaccess"><h2>You do not have access to PMO</h2><p>Switch to Group CEO or Group CIO from your profile picture.</p><a class="see" href="/corporate">Back to Corporate</a></div>';
      return;
    }
    if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
      if (view === 'trk-handover') el.insertAdjacentHTML('beforeend', pmoHandovers());
    } else el.innerHTML = view === 'home' ? vHome() : view.startsWith('rep-') ? vRep(view) : vDashboard(view);
  }
  function download(name, rows) {
    const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v ?? '').replace(/^[=+@\-]/, "'$&").replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {
      type: 'text/csv;charset=utf-8'
    }));
    a.download = name;
    a.click();
    scope.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportView() {
    if (view.startsWith('trk-')) {
      const T = TRK[view.slice(4)];
      download(`pmo-${view}.csv`, [T.cols.map(c => c[1]), ...trkFiltered().map(r => T.cols.map(c => r[c[0]]))]);
      return;
    }
    const keys = {
      delivery: ['schedule'],
      commissioning: ['commission', 'punch'],
      readiness: ['handover', 'closeout'],
      risks: ['risk'],
      financial: ['finance'],
      'rep-exec': TRK_KEYS,
      'rep-risk': ['risk'],
      'rep-handover': ['commission', 'punch', 'handover']
    }[view] || TRK_KEYS;
    download(`pmo-${view}.csv`, [['Tracker', 'Item', 'Project', 'Owner', 'Due date', 'Status', 'Next action', 'Progress %', 'Amount OMR m', 'Account type'], ...keys.flatMap(k => trkRows(k).map(r => [TRK[k].n, r.t, r.project, r.owner, r.date, r.status, r.next, r.prog ?? '', r.amount ?? '', r.kind ?? '']))]);
  }
  function projectControls(p) {
    return '<label>Status <select data-project-status="' + escH(p.t) + '">' + ['On track', 'Delayed', 'Blocked', 'Completed', ...(assetHandoverRecord(p)?['Handed over to Asset Management']:[])].map(x => '<option' + (p.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label><label> Progress (%) <input type="number" min="0" max="100" value="' + p.prog + '" data-project-progress="' + escH(p.t) + '" style="width:70px"></label>';
  }
  function assetHandoverRecord(p) {
    return [...liveRegister('ofc-live-assets'), ...liveRegister('ofc-live-asset-status')].find(a => a.projectId === (p.projectId || p.t));
  }
  function pmoHandovers() {
    return block('Transfer to Asset Management', projectsAll().map(p => {
      const rows = projectRows('handover', p.t),
        ready = gate(p.t).ready,
        sent = assetHandoverRecord(p);
      return '<p><b>' + escH(p.t) + '</b> ' + (sent ? '<a class="see" href="/asset-management#company|' + encodeURIComponent(sent.code) + '|about">Handed over · Open operating asset</a>' : '<button class="btn sm" data-pmo-handover="' + escH(p.t) + '" ' + (ready ? '' : 'disabled') + '>Confirm handover to Asset Management</button>') + '<small style="display:block">' + (rows.length ? 'Complete commissioning and handover records, close critical or high punch items, and record operations acceptance.' : 'Add commissioning, operations acceptance and handover evidence for this project.') + '</small></p>' + (sent?'':renderGateBlockers(pmoReadiness(p).pending,escH));
    }).join(''));
  }
  function pmoHandover(name) {
    const p = projectsAll().find(p => p.t === name),
      rows = projectRows('handover', name);
    if (!p || assetHandoverRecord(p) || !gate(name).ready) return;
    const projectId = p.projectId || p.t,
      known = {
        'Subsidiary D': 'D',
        'Subsidiary P': 'P',
        'Subsidiary Q': 'Q'
      }[p.t],
      code = known || 'LIVE-' + encodeURIComponent(projectId),
      key = known ? 'ofc-live-asset-status' : 'ofc-live-assets',
      at = Date.now(),
      asset = {
        code,
        n: p.t,
        st: 'Operating',
        rev: 0,
        bud: 0,
        eb: 0,
        source: 'pmo',
        projectId,
        dealId: p.dealId,
        at
      },
      current = liveRegister('ofc-tracker-entries'),
      audit = {
        id: 'PMO-' + crypto.randomUUID(),
        at,
        app: APP_ID,
        trk: TRK.closeout.n,
        t: 'SG5 handover confirmed',
        d: {
          t: 'SG5 handover confirmed',
          project: p.t,
          owner: p.owner,
          date: new Date().toISOString().slice(0, 10),
          status: 'Completed',
          next: 'Asset Management accepted operating asset ' + code
        }
      };
    if (!handoverWrite({
      [key]: [...liveRegister(key), asset],
      'ofc-pmo-project-state': {
        ...recordOverlay('ofc-pmo-project-state'),
        [p.t]: {
          ...recordPatch('ofc-pmo-project-state', p.t),
          status: 'Handed over to Asset Management',
          phase: 'Operations',
          prog: 100,
          at
        }
      },
      'ofc-tracker-entries': [audit, ...current]
    })) return;
    TLOCAL = [audit, ...current];
    render();
    toast('Operating asset received by Asset Management.');
  }
  scope.listen(document, 'click', e => {
    const b = e.target.closest('[data-pmo-handover]');
    if (b && role.apps.includes(APP_ID)) pmoHandover(b.dataset.pmoHandover);
  });
  scope.listen(document, 'change', e => {
    if (!role.apps.includes(APP_ID)) return;
    const name = e.target.dataset.projectStatus || e.target.dataset.projectProgress;
    if (name) {
      const progress = e.target.dataset.projectProgress;
      if(!progress&&e.target.value==='Handed over to Asset Management'&&!assetHandoverRecord(projectsAll().find(p=>p.t===name)||{t:name})){toast('Complete the handover checks and use Confirm handover to Asset Management.');render();return;}
      if (progress && (!e.target.validity.valid || e.target.value === '')) {
        render();
        return;
      }
      if (patchRecord('ofc-pmo-project-state', name, progress ? {
        prog: +e.target.value
      } : {
        status: e.target.value
      })) render();
    } else if (e.target.dataset.statusId && view === 'trk-handover') render();
  });
  scope.listen(window, 'storage', e => {
    if (e.key?.startsWith('ofc-') && !sheetOpen) {
      TLOCAL = liveRegister('ofc-tracker-entries');
      STATUS_EDITS = recordOverlay('ofc-pmo-status');
      render();
    }
  });

  /* ---- Trackers ---- */
  let tState = {
    q: '',
    status: 'All',
    entity: 'All'
  };
  const entKeyOf = T => ['project', 'dept', 'owner', 'persp', 'kind'].find(k => T.cols.some(c => c[0] === k)) || null;
  function vTrk(key) {
    const T = TRK[key];
    tState = {
      q: '',
      status: 'All',
      entity: 'All'
    };
    const rows = trkRows(key),
      sts = [...new Set(rows.map(r => r.status))],
      ek = entKeyOf(T),
      ents = ek ? [...new Set(rows.map(r => r[ek]))] : [];
    const lab = {
      project: 'projects',
      dept: 'departments',
      owner: 'owners',
      persp: 'perspectives',
      kind: 'types'
    }[ek];
    return `<div>${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">${ico.plus}New entry</button>` + exportBtn + printBtn)}
  <section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker">
    <select id="ts" aria-label="Status"><option value="All">All statuses</option>${sts.map(s => `<option>${escH(s)}</option>`).join('')}</select>
    ${ek ? `<select id="te" aria-label="Filter"><option value="All">All ${lab}</option>${ents.map(s => `<option>${escH(s)}</option>`).join('')}</select>` : ''}
    <span class="cnt" id="tc"></span></div>
    <div class="sumchips" id="tchips"></div>
    <div class="tscroll"><table class="ttbl" id="tt"></table></div></section></div>`;
  }
  function trkFiltered() {
    const T = TRK[view.slice(4)],
      ek = entKeyOf(T),
      q = tState.q.toLowerCase();
    return trkRows(view.slice(4)).filter(r => (tState.status === 'All' || r.status === tState.status) && (tState.entity === 'All' || r[ek] === tState.entity) && (!q || Object.values(r).join(' ').toLowerCase().includes(q)));
  }
  function cell(r, c) {
    const [k,, type] = c,
      v = r[k];
    if (type === 'date') return `<td class="nw">${fmtDate(v)}</td>`;
    if (type === 'status') return `<td class="nw">${statusControl(r)}${r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''}</td>`;
    if (type === 'kpi') return `<td class="nw">${kpiPill(v)}</td>`;
    if (type === 'm') return `<td class="r num">${v === '' || v == null ? '—' : +v ? m1(v) : '—'}</td>`;
    if (type === 'gap') return `<td class="r num ${v > 0 ? 'neg' : 'pos'}" style="font-weight:600">${f1(v)}</td>`;
    if (type === 'prog') return `<td style="min-width:130px">${progBar(v)}</td>`;
    return `<td${['dept', 'owner', 'kind', 'rel', 'persp', 'target', 'actual', 'base', 'tgt26', 'fc26', 'tgt30'].includes(k) ? ' class="nw"' : ''}>${escH(v || '—')}${k === 't' && (r._local || r._corp) ? '<span class="newtag">New</span>' : ''}${k === 't' && r.next && TRK[view.slice(4)].cols.every(c => c[0] !== 'next') ? `<small style="display:block;color:var(--ink-2);margin-top:2px">${escH(r.next)}</small>` : ''}</td>`;
  }
  function fillTrk() {
    const key = view.slice(4),
      T = TRK[key],
      all = trkRows(key),
      rows = trkFiltered(),
      numT = ['m', 'gap'];
    $('#tt').innerHTML = `<thead><tr>${T.cols.map(c => `<th class="${numT.includes(c[2]) ? 'r' : ''}">${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${T.cols.map(c => cell(r, c)).join('')}<td class="r">${r._local ? `<button class="pbtn noprint" data-tdel="${r._local}" aria-label="Remove entry" style="width:28px;height:28px"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>` : ''}</td></tr>`).join('') : `<tr><td colspan="${T.cols.length + 1}" style="text-align:center;color:var(--ink-2);padding:28px">No entries match these filters.</td></tr>`}</tbody>`;
    $('#tc').textContent = `${rows.length} of ${all.length} entries`;
    const by = {};
    all.forEach(r => by[r.status] = (by[r.status] || 0) + 1);
    const od = all.filter(r => r.overdue).length;
    let extra = '';
    if (key === 'init') extra = `<span>Expected value <b>${m1(all.reduce((a, r) => a + (+r.value || 0), 0))}m a year</b></span>`;
    if (key === 'fund') extra = `<span class="warn">Five-year gap <b>${m1(all.reduce((a, r) => a + r.gap, 0))}m</b></span>`;
    if (key === 'bp') {
      const p = all.reduce((a, r) => a + (+r.prog || 0), 0) / all.length;
      extra = `<span>Overall progress <b>${Math.round(p)}%</b></span>`;
    }
    $('#tchips').innerHTML = Object.entries(by).map(([k, v]) => `<span>${escH(k)} <b>${v}</b></span>`).join('') + (od ? `<span class="warn">Overdue <b>${od}</b></span>` : '') + extra;
  }

  /* ---------------- Hover pane ---------------- */
  const IC = {
    table: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="11" height="10" rx="1.2"/><path d="M2.5 6.5h11M6.5 6.5V13"/></svg>',
    doc: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 1.8h5.5l3 3v9.4H4z"/><path d="M9.5 1.8v3h3M6 8.5h4.5M6 11h4.5"/></svg>',
    chart: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 13.5h12M3.5 11l3-3.5 2.5 2 4-5"/></svg>',
    dash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="5" height="6.5" rx="1"/><rect x="9" y="2" width="5" height="4" rx="1"/><rect x="9" y="8" width="5" height="6" rx="1"/><rect x="2" y="10.5" width="5" height="3.5" rx="1"/></svg>',
    rec: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.2"/></svg>',
    spark: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.4 3.8L13 6.2 9.4 7.6 8 11.4 6.6 7.6 3 6.2l3.6-1.4z"/></svg>'
  };
  const hpItem = (attrs, icon, label, meta, cur) => `<button class="hp-item" ${attrs}${cur ? ' aria-current="page" style="background:rgba(37,60,53,.06);font-weight:500"' : ''}><span class="hp-ic">${icon}</span><span class="hp-t">${label}</span>${meta !== undefined && meta !== '' ? `<span class="hp-m">${meta}</span>` : ''}</button>`;
  const hpSec = t => `<div class="hp-sec">${t}</div>`;
  let pane = null,
    pinned = false,
    hideT = null,
    showT = null,
    sheetOpen = false;
  function renderPane(k) {
    $('#hpT').textContent = {
      input: 'Input',
      reports: 'Reports',
      dashboards: 'Dashboards'
    }[k];
    let b = '';
    if (k === 'input') {
      const recent = TLOCAL.filter(r => r.app === APP_ID).slice(0, 3);
      b = hpSec(escH(APP_NAME) + ' trackers') + TRK_KEYS.map(key => hpItem(`data-go="trk-${key}"`, IC.table, TRK[key].n, openCount(key) ? openCount(key) + ' open' : '', view === 'trk-' + key)).join('') + (recent.length ? hpSec('Recent items') + recent.map(r => hpItem(`data-go="trk-${TRK_KEYS.find(x => TRK[x].n === r.trk)}"`, IC.rec, escH(r.t))).join('') : '');
    } else if (k === 'reports') {
      b = '<button type="button" class="hp-item" aria-label="Create client report" data-report-studio><span class="hp-t">Create client report</span><span class="hp-m">Siraaj</span></button>' + hpSec('Sample report previews') + REPS.map(r => hpItem(`data-go="${r}"`, IC.spark, VIEWS[r], '', view === r)).join('');
    } else {
      b = hpItem('data-go="home"', IC.dash, 'Overview', '', view === 'home') + hpSec('Dashboards') + DASHES.map(d => hpItem(`data-go="${d}"`, IC.chart, VIEWS[d], '', view === d)).join('') + dashboardCreateLink;
    }
    $('#hpB').innerHTML = b;
  }
  function syncRail() {
    const k = pane || (sheetOpen ? 'input' : section(view));
    $$('.rbtn').forEach(b => b.setAttribute('aria-current', String(b.dataset.rail === k)));
  }
  function showPane(k, pin) {
    clearTimeout(hideT);
    clearTimeout(showT);
    if (pane === k) {
      if (pin) pinned = true;
      return;
    }
    closeFlyouts();
    pane = k;
    pinned = !!pin;
    renderPane(k);
    $('#hpane').classList.add('open');
    $('#hpane').setAttribute('aria-hidden', 'false');
    syncRail();
  }
  function hidePane() {
    clearTimeout(hideT);
    clearTimeout(showT);
    pane = null;
    pinned = false;
    $('#hpane').classList.remove('open');
    $('#hpane').setAttribute('aria-hidden', 'true');
    syncRail();
  }
  function scheduleHide() {
    clearTimeout(showT);
    if (pinned) return;
    clearTimeout(hideT);
    hideT = scope.setTimeout(hidePane, 260);
  }
  $$('.rbtn').forEach(b => {
    const k = b.dataset.rail;
    if (k === 'home') return;
    scope.listen(b, 'mouseenter', () => {
      clearTimeout(hideT);
      clearTimeout(showT);
      showT = scope.setTimeout(() => showPane(k), pane ? 0 : 90);
    });
    scope.listen(b, 'mouseleave', scheduleHide);
  });
  scope.listen($('#hpane'), 'mouseenter', () => clearTimeout(hideT));
  scope.listen($('#hpane'), 'mouseleave', scheduleHide);
  $('#hpClose').onclick = hidePane;

  /* ---------------- Sheet: new tracker entry ---------------- */
  let sheetKey = null;
  function fieldHTML(f) {
    const lab = `<span>${escH(f.l)}${f.req ? ' <span class="req">*</span>' : ''}</span>`;
    let c;
    if (f.type === 'select') c = `<select name="${f.k}">${f.o.map(o => `<option>${escH(o)}</option>`).join('')}</select>`;else if (f.type === 'textarea') c = `<textarea name="${f.k}" rows="2"></textarea>`;else c = `<input name="${f.k}" type="${f.type || 'text'}"${f.type === 'number' ? ' step="any"' : ''}${f.ph ? ` placeholder="${escH(f.ph)}"` : ''} autocomplete="off">`;
    return `<label class="${f.full ? 'full' : ''}">${lab}${c}</label>`;
  }
  const APP = APPS.find(a => a.id === APP_ID);
  function openSheet(key) {
    if (!role.apps.includes(APP_ID)) {
      toast('Switch role to access PMO.');
      return;
    }
    closeFlyouts();
    hidePane();
    sheetKey = key;
    sheetOpen = true;
    const T = TRK[key];
    $('#panelT').textContent = 'New entry';
    $('#panelB').innerHTML = `<div class="trk-meta"><span class="hp-mi" style="background:${APP.c}"><svg viewBox="0 0 24 24">${APP.g}</svg></span><span>${escH(T.n)}</span></div>
  <form class="pform" id="trkForm" novalidate>${T.fields.map(fieldHTML).join('')}<p class="err" id="trkErr" hidden>Fill in required fields; progress must be 0–100, risk scores 1–5, and amounts non-negative.</p><div class="full pf-foot"><span>Saved in this browser and shown in the tracker.</span><button class="btn" type="submit">Add to tracker</button></div></form>`;
    $('#panel').classList.add('open');
    $('#panel').setAttribute('aria-hidden', 'false');
    $('#pscrim').classList.add('open');
    syncRail();
    scope.setTimeout(() => {
      const f = $('#trkForm [name]');
      if (f && !$('#panel').contains(document.activeElement)) f.focus();
    }, 80);
  }
  function closeSheet() {
    sheetOpen = false;
    $('#panel').classList.remove('open');
    $('#panel').setAttribute('aria-hidden', 'true');
    $('#pscrim').classList.remove('open');
    syncRail();
  }
  $('#pClose').onclick = closeSheet;
  $('#pscrim').onclick = closeSheet;
  scope.listen($('#panel'), 'submit', e => {
    e.preventDefault();
    if (!role.apps.includes(APP_ID)) return;
    const f = e.target,
      T = TRK[sheetKey],
      d = {};
    let bad = false;
    T.fields.forEach(x => {
      const el = f.elements[x.k];
      const v = (el.value || '').trim();
      d[x.k] = x.type === 'number' && v !== '' ? +v : v;
      if (x.req && !v || x.type === 'number' && v !== '' && (!Number.isFinite(+v) || x.min !== undefined && +v < x.min || x.max !== undefined && +v > x.max)) {
        el.classList.add('bad');
        bad = true;
      }
    });
    if (bad) {
      $('#trkErr').hidden = false;
      f.querySelector('.bad').focus();
      return;
    }
    TLOCAL.unshift({
      id: 'TRK-' + Date.now().toString(36).slice(-5).toUpperCase(),
      at: Date.now(),
      app: APP_ID,
      trk: T.n,
      t: d.t,
      d
    });
    if (!saveT()) {
      TLOCAL.shift();
      return;
    }
    closeSheet();
    toast(`Added to ${T.n}.`);
    if (view !== 'trk-' + sheetKey) go('trk-' + sheetKey);else {
      render();
    }
  });
  scope.listen($('#panel'), 'input', e => {
    if (e.target.classList.contains('bad')) {
      e.target.classList.remove('bad');
      if (!$('#panelB .bad')) $('#trkErr').hidden = true;
    }
  });
  function refreshBadge() {
    const n = TLOCAL.filter(r => r.app === APP_ID).length;
    const rc = $('#railCount');
    rc.hidden = !n;
    rc.textContent = n;
  }

  /* ---------------- Launcher & roles ---------------- */
  function renderLauncher(q = '') {
    q = q.trim().toLowerCase();
    const list = APPS.filter(a => !q || a.n.toLowerCase().includes(q));
    $('#lgrid').innerHTML = list.map(a => {
      const locked = !role.apps.includes(a.id);
      return `<button class="app${a.id === APP_ID ? ' current' : ''}${locked ? ' locked' : ''}" data-app="${a.id}" aria-label="${a.n}${locked ? ', no access' : ''}"><span class="ai" style="background:${a.c}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.g}</svg></span>${locked ? '<span class="lock"><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="1.5" y="4.5" width="7" height="5" rx="1"/><path d="M3 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span>' : ''}<span class="nm">${a.n}</span></button>`;
    }).join('') || '<p style="grid-column:1/-1;padding:12px;color:var(--ink-2);margin:0">No apps match.</p>';
    $('#accessNote').textContent = `${role.apps.length} of ${APPS.length} apps available`;
  }
  function setLauncher(o) {
    $('#launcher').classList.toggle('open', o);
    $('#waffle').setAttribute('aria-expanded', o);
    if (o) {
      $('#lsearch').value = '';
      renderLauncher();
      scope.setTimeout(() => $('#lsearch').focus(), 50);
    }
  }
  function setMenu(o) {
    $('#roleMenu').classList.toggle('open', o);
    $('#meBtn').setAttribute('aria-expanded', o);
  }
  function closeFlyouts() {
    setLauncher(false);
    setMenu(false);
  }
  $('#waffle').onclick = e => {
    e.stopPropagation();
    const o = !$('#launcher').classList.contains('open');
    closeFlyouts();
    hidePane();
    setLauncher(o);
  };
  $('#meBtn').onclick = e => {
    e.stopPropagation();
    const o = !$('#roleMenu').classList.contains('open');
    closeFlyouts();
    hidePane();
    setMenu(o);
  };
  $('#lsearch').oninput = e => renderLauncher(e.target.value);
  function renderRoles() {
    $('#roles').innerHTML = ROLES.map(r => `<button role="menuitemradio" aria-checked="${r.id === role.id}" data-role="${r.id}"><span class="avatar" style="width:30px;height:30px">${r.i}</span><span><span class="t">${r.n}</span><br><span class="m">${r.d}</span></span><svg class="chk" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3 3 7-7"/></svg></button>`).join('');
    $('#meInit').textContent = role.i;
  }

  /* ---------------- Events ---------------- */
  scope.listen($('#hpane'), 'click', e => {
    e.stopPropagation();
    const g = e.target.closest('[data-go]');
    if (g) go(g.dataset.go);
  });
  scope.listen(document, 'click', e => {
    const r = e.target.closest('[data-role]');
    if (r) {
      role = ROLES.find(x => x.id === r.dataset.role);
      try {
        localStorage.setItem('ofc-role', role.id);
      } catch (err) {}
      closeSheet();
      renderRoles();
      renderLauncher();
      setMenu(false);
      render();
      toast(`Viewing as ${role.n}.`);
      return;
    }
    const rl = e.target.closest('[data-rail]');
    if (rl) {
      const k = rl.dataset.rail;
      if (k === 'home') {
        go('home');
        return;
      }
      if (pane === k && pinned) {
        hidePane();
        return;
      }
      showPane(k, true);
      return;
    }
    if (e.target.closest('.panel')) return;
    if (pane && !e.target.closest('.hpane')) hidePane();
    const a = e.target.closest('[data-app]');
    if (a) {
      openApp(a.dataset.app);
      return;
    }
    const g = e.target.closest('[data-go]');
    if (g) {
      go(g.dataset.go);
      return;
    }
    const n = e.target.closest('[data-new]');
    if (n) {
      openSheet(n.dataset.new);
      return;
    }
    const td = e.target.closest('[data-tdel]');
    if (td) {
      TLOCAL = TLOCAL.filter(x => x.id !== td.dataset.tdel);
      saveT();
      fillTrk();
      refreshBadge();
      toast('Entry removed.');
      return;
    }
    if (e.target.closest('[data-export]')) {
      exportView();
      return;
    }
    if (e.target.closest('[data-print]')) {
      window.print();
      return;
    }
    if (e.target.closest('[data-regen]')) {
      render();
      toast('Draft regenerated from the latest tracker data.');
      return;
    }
    if (e.target.closest('[data-genpack]')) {
      const d = $('#repDoc');
      d.classList.add('run');
      scope.setTimeout(() => {
        d.classList.remove('run');
        toast('Done.');
      }, 1300);
      return;
    }
    const t = e.target.closest('[data-toast]');
    if (t) {
      toast(t.dataset.toast);
      return;
    }
    if (!e.target.closest('.launcher,.menu')) closeFlyouts();
  });
  scope.listen(document, 'input', e => {
    if (e.target.id === 'tq') {
      tState.q = e.target.value;
      fillTrk();
    }
  });
  scope.listen(document, 'change', e => {
    if (e.target.id === 'ts') {
      tState.status = e.target.value;
      fillTrk();
    }
    if (e.target.id === 'te') {
      tState.entity = e.target.value;
      fillTrk();
    }
    if (e.target.id === 'scn') {
      scenario = e.target.value;
      render();
    }
  });
  scope.listen(document, 'keydown', e => {
    if (e.key === 'Escape') {
      const w = $('#launcher').classList.contains('open') || $('#roleMenu').classList.contains('open');
      closeFlyouts();
      if (!w) {
        if (pane) hidePane();else if (sheetOpen) closeSheet();
      }
    }
  });
  $('#follow').onclick = () => {
    const p = $('#follow').getAttribute('aria-pressed') !== 'true';
    $('#follow').setAttribute('aria-pressed', p);
    $('#follow span').textContent = p ? 'Following' : 'Not following';
  };
  scope.listen($('#gsearch'), 'keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const hit = Object.entries(VIEWS).find(([k, v]) => v.toLowerCase().includes(q));
    if (hit) {
      go(hit[0]);
      e.target.value = '';
    } else toast(`No results for "${e.target.value.trim()}" in ${APP_NAME}.`);
  });

  /* ---------------- Init ---------------- */
  renderRoles();
  renderLauncher();
  view = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
  render();
}