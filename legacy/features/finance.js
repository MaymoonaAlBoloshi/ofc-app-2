import { dashboardCreateLink } from "./dashboard-create-link.js";
import { REV_A, REV_B, EB_A, EB_B, SUBS, DECISIONS } from "./group-data";
import { createShared } from "./shared";
export function initialize(scope) {
  const APP_ID = 'fa',
    APP_NAME = 'Finance & Accounts';
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

  /* =====================================================================
     Finance & Accounts app · Oman Food Capital
     Structure (trackers, dashboards, AI reports) follows the OFC deck.
     Figures are illustrative sample data, internally consistent, OMR m.
     ===================================================================== */

  /* ---------------- Sample financials (OMR m, YTD 31 Aug 2026) ---------------- */
  const M8 = MON.slice(0, 8);
  const PL = [['Revenue', 162.4, 170.8, 151.2, 'sub'], ['Cost of sales', -118.6, -123.4, -111.0], ['Gross profit', 43.8, 47.4, 40.2, 'sub'], ['Operating expenses', -24.1, -25.0, -22.9], ['EBITDA', 19.7, 22.4, 17.3, 'sub'], ['Depreciation & amortisation', -8.2, -8.4, -7.6], ['EBIT', 11.5, 14.0, 9.7, 'sub'], ['Finance costs', -5.3, -5.0, -4.9], ['Share of results of associates', 1.1, 1.2, 0.9], ['Profit before tax', 7.3, 10.2, 5.7, 'sub'], ['Income tax', -1.1, -1.3, -0.6], ['Net profit', 6.2, 8.9, 5.1, 'total']];
  const PLv = k => PL.find(r => r[0] === k);
  const BS = [['Non-current assets', null, null, 'head'], ['Property, plant & equipment', 412.6, 398.2], ['Investments in associates', 37.8, 37.6], ['Intangible assets & goodwill', 21.7, 22.3], ['Other non-current assets', 9.3, 9.1], ['Total non-current assets', 481.4, 467.2, 'sub'], ['Current assets', null, null, 'head'], ['Inventories', 46.2, 41.0], ['Trade receivables', 39.8, 35.2], ['Other receivables', 12.1, 10.1], ['Cash & cash equivalents', 57.4, 64.8], ['Total current assets', 155.5, 151.1, 'sub'], ['Total assets', 636.9, 618.3, 'total'], ['Equity', null, null, 'head'], ['Share capital', 300.0, 300.0], ['Reserves & retained earnings', 64.3, 59.1], ['Non-controlling interests', 18.2, 18.0], ['Total equity', 382.5, 377.1, 'sub'], ['Non-current liabilities', null, null, 'head'], ['Borrowings', 168.4, 158.1], ['Lease liabilities', 11.6, 12.3], ['Other non-current liabilities', 5.5, 4.6], ['Total non-current liabilities', 185.5, 175.0, 'sub'], ['Current liabilities', null, null, 'head'], ['Trade payables', 41.7, 39.6], ['Borrowings (current portion)', 19.8, 18.8], ['Accruals & other payables', 7.4, 7.8], ['Total current liabilities', 68.9, 66.2, 'sub'], ['Total equity & liabilities', 636.9, 618.3, 'total']];
  const CF = [['Operating activities', null, 'head'], ['EBITDA', 19.7], ['Increase in trade receivables', -4.6], ['Increase in inventories', -5.2], ['Increase in trade payables', 2.1], ['Other working capital movements', -2.4], ['Income tax paid', -0.5], ['Net cash from operating activities', 9.1, 'sub'], ['Investing activities', null, 'head'], ['Capital expenditure', -22.6], ['Dividends received from associates', 0.9], ['Net cash used in investing activities', -21.7, 'sub'], ['Financing activities', null, 'head'], ['Borrowings drawn', 18.0], ['Borrowings repaid', -6.7], ['Interest paid', -5.3], ['Dividends paid to non-controlling interests', -0.8], ['Net cash from financing activities', 5.2, 'sub'], ['Net change in cash', -7.4, 'sub'], ['Cash at 1 January 2026', 64.8], ['Cash at 31 August 2026', 57.4, 'total']];
  const ELIM = 8.0,
    HOLD = -2.4;

  /* ---------------- Trackers (names and structure from the deck) ---------------- */
  const ENT = ['Holding', 'All entities', ...'ABCDEFGHIJKLMNOPQ'.split('').map(x => 'Subsidiary ' + x)];
  const DONE = new Set(['Completed', 'Accepted', 'Filed', 'Filed & paid', 'Matched', 'Resolved', 'Approved', 'Closed']);
  const TRK = {
    closing: {
      n: 'Monthly Closing Tracker',
      d: 'August 2026 close · target sign-off 30 Sep 2026',
      fields: [{
        k: 't',
        l: 'Close task',
        req: 1,
        full: 1
      }, {
        k: 'entity',
        l: 'Entity',
        type: 'select',
        o: ENT
      }, {
        k: 'owner',
        l: 'Owner'
      }, {
        k: 'period',
        l: 'Period',
        type: 'select',
        o: ['Aug 2026', 'Sep 2026']
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not started', 'In progress', 'Completed']
      }],
      cols: [['t', 'Close task'], ['entity', 'Entity'], ['owner', 'Owner'], ['date', 'Due date', 'date'], ['status', 'Status', 'status']],
      rows: [['Bank reconciliations', 'All entities', 'Treasury Accountant', '2026-09-10', 'Completed'], ['Payroll journals', 'All entities', 'Payroll Officer', '2026-09-10', 'Completed'], ['AP cut-off & invoice accruals', 'All entities', 'AP Lead', '2026-09-12', 'Completed'], ['AR cut-off & revenue recognition review', 'All entities', 'AR Lead', '2026-09-12', 'Completed'], ['Fixed asset additions & depreciation run', 'All entities', 'Fixed Asset Accountant', '2026-09-15', 'Completed'], ['Inventory valuation & count adjustments', 'Subsidiary C', 'Cost Accountant', '2026-09-17', 'In progress'], ['Accruals & provisions review', 'All entities', 'Financial Controller', '2026-09-18', 'Completed'], ['Intercompany reconciliation & matching', 'All entities', 'Group Reporting', '2026-09-24', 'In progress'], ['Subsidiary submissions review', 'All entities', 'Group Reporting', '2026-09-24', 'In progress'], ['Consolidation & eliminations', 'Holding', 'Consolidation Manager', '2026-09-27', 'Not started'], ['Management accounts pack', 'Holding', 'Financial Controller', '2026-09-29', 'Not started'], ['CFO review & sign-off', 'Holding', 'Group CFO', '2026-09-30', 'Not started']].map(r => ({
        t: r[0],
        entity: r[1],
        owner: r[2],
        date: r[3],
        status: r[4],
        period: 'Aug 2026'
      }))
    },
    submission: {
      n: 'Financial Reporting Submission Tracker',
      d: 'August 2026 management accounts · due 15 Sep 2026',
      fields: [{
        k: 'sub',
        l: 'Entity',
        type: 'select',
        o: ENT.slice(2),
        req: 1
      }, {
        k: 't',
        l: 'Submission',
        type: 'select',
        o: ['Monthly management accounts', 'Quarterly financial statements', 'Audited financial statements', 'Budget pack'],
        req: 1
      }, {
        k: 'period',
        l: 'Period',
        type: 'select',
        o: ['Aug 2026', 'Sep 2026', 'Q3 2026']
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'subm',
        l: 'Submitted on',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not submitted', 'Submitted', 'Under review', 'Accepted']
      }],
      cols: [['sub', 'Entity'], ['t', 'Submission'], ['date', 'Due date', 'date'], ['subm', 'Submitted on', 'date'], ['status', 'Status', 'sstatus']],
      rows: [['A', '2026-09-11', 'Accepted'], ['B', '2026-09-12', 'Accepted'], ['C', '2026-09-10', 'Accepted'], ['D', '2026-09-14', 'Accepted'], ['E', '2026-09-15', 'Accepted'], ['F', '2026-09-13', 'Accepted'], ['G', '2026-09-15', 'Accepted'], ['H', '2026-09-12', 'Accepted'], ['I', '2026-09-14', 'Accepted'], ['J', '2026-09-15', 'Under review'], ['K', '', 'Not submitted'], ['L', '2026-09-15', 'Under review'], ['M', '2026-09-11', 'Accepted'], ['N', '', 'Not submitted'], ['O', '2026-09-19', 'Submitted'], ['P', '2026-09-09', 'Accepted'], ['Q', '2026-09-10', 'Accepted']].map(r => ({
        sub: 'Subsidiary ' + r[0],
        t: 'Monthly management accounts',
        period: 'Aug 2026',
        date: '2026-09-15',
        subm: r[1],
        status: r[2]
      }))
    },
    tax: {
      n: 'Tax / Regulatory Compliance Tracker',
      d: 'Filings and regulatory obligations across the group',
      fields: [{
        k: 't',
        l: 'Obligation',
        req: 1,
        full: 1
      }, {
        k: 'entity',
        l: 'Entity',
        type: 'select',
        o: ENT
      }, {
        k: 'auth',
        l: 'Authority'
      }, {
        k: 'period',
        l: 'Period'
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not started', 'In preparation', 'Filed', 'Filed & paid']
      }],
      cols: [['t', 'Obligation'], ['entity', 'Entity'], ['auth', 'Authority'], ['period', 'Period'], ['date', 'Due date', 'date'], ['status', 'Status', 'status']],
      rows: [['Corporate income tax return', 'All entities', 'Oman Tax Authority', 'FY2025', '2026-04-30', 'Filed'], ['VAT return', 'All entities', 'Oman Tax Authority', 'Q2 2026', '2026-07-30', 'Filed & paid'], ['Withholding tax return', 'Holding', 'Oman Tax Authority', 'Aug 2026', '2026-09-14', 'Filed & paid'], ['Tax assessment query response', 'Subsidiary B', 'Oman Tax Authority', 'FY2022', '2026-10-08', 'In preparation'], ['Commercial registration renewal', 'Subsidiary G', 'Ministry of Commerce, Industry & Investment Promotion', '2026', '2026-10-12', 'Not started'], ['Withholding tax return', 'Holding', 'Oman Tax Authority', 'Sep 2026', '2026-10-14', 'Not started'], ['VAT return', 'All entities', 'Oman Tax Authority', 'Q3 2026', '2026-10-30', 'In preparation']].map(r => ({
        t: r[0],
        entity: r[1],
        auth: r[2],
        period: r[3],
        date: r[4],
        status: r[5]
      }))
    },
    ic: {
      n: 'Intercompany Reconciliation Tracker',
      d: 'August 2026 intercompany balances · OMR thousands',
      fields: [{
        k: 't',
        l: 'Counterparty pair',
        req: 1,
        full: 1,
        ph: 'e.g. Holding ↔ Subsidiary A'
      }, {
        k: 'period',
        l: 'Period',
        type: 'select',
        o: ['Aug 2026', 'Sep 2026']
      }, {
        k: 'owner',
        l: 'Owner'
      }, {
        k: 'balA',
        l: 'Balance per first entity (OMR k)',
        type: 'number'
      }, {
        k: 'balB',
        l: 'Balance per second entity (OMR k)',
        type: 'number'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Unmatched', 'Under investigation', 'Matched', 'Resolved']
      }, {
        k: 'next',
        l: 'Notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Counterparty pair'], ['balA', 'Per first entity', 'num'], ['balB', 'Per second entity', 'num'], ['diff', 'Difference', 'diff'], ['owner', 'Owner'], ['status', 'Status', 'status']],
      rows: [['Holding ↔ Subsidiary A', 4210, 4210, 'Matched'], ['Holding ↔ Subsidiary B', 2965, 2965, 'Matched'], ['Holding ↔ Subsidiary C', 1840, 1840, 'Matched'], ['Holding ↔ Subsidiary D', 12400, 12150, 'Unmatched', 'Shareholder funding transfer in transit at month end'], ['Subsidiary A ↔ Subsidiary H', 612, 612, 'Matched'], ['Subsidiary H ↔ Subsidiary B', 488, 451, 'Under investigation', 'Feed invoice dispute on one delivery'], ['Subsidiary C ↔ Subsidiary K', 305, 305, 'Matched'], ['Holding ↔ Subsidiary K', 1120, 1120, 'Matched'], ['Subsidiary E ↔ Subsidiary G', 96, 96, 'Matched']].map(r => ({
        t: r[0],
        balA: r[1],
        balB: r[2],
        status: r[3],
        next: r[4] || '',
        owner: 'Group Reporting',
        period: 'Aug 2026'
      }))
    },
    prov: {
      n: 'Provision / Accrual Tracker',
      d: 'Month-end provisions and accruals · OMR thousands',
      fields: [{
        k: 't',
        l: 'Provision / accrual',
        req: 1,
        full: 1
      }, {
        k: 'entity',
        l: 'Entity',
        type: 'select',
        o: ENT
      }, {
        k: 'type',
        l: 'Type',
        type: 'select',
        o: ['Provision', 'Accrual']
      }, {
        k: 'amount',
        l: 'Closing balance (OMR k)',
        type: 'number'
      }, {
        k: 'move',
        l: 'Movement this month (OMR k)',
        type: 'number'
      }, {
        k: 'owner',
        l: 'Owner'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Draft', 'Under review', 'Approved']
      }, {
        k: 'next',
        l: 'Basis / notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Provision / accrual'], ['entity', 'Entity'], ['type', 'Type'], ['amount', 'Balance', 'num'], ['move', 'Movement', 'mv'], ['owner', 'Owner'], ['status', 'Status', 'status']],
      rows: [['Expected credit loss on trade receivables', 'All entities', 'Provision', 1860, 140, 'Credit Controller', 'Under review'], ['End-of-service benefits', 'All entities', 'Provision', 3240, 96, 'HR Finance', 'Approved'], ['Staff bonus accrual', 'All entities', 'Accrual', 1150, 120, 'Financial Controller', 'Approved'], ['Inventory obsolescence', 'Subsidiary C', 'Provision', 420, 35, 'Cost Accountant', 'Approved'], ['Legal claim', 'Subsidiary K', 'Provision', 275, 0, 'Financial Controller', 'Under review'], ['Utilities & fuel accrual', 'Subsidiary A', 'Accrual', 188, 12, 'Plant Accountant', 'Draft'], ['Audit fee accrual', 'Holding', 'Accrual', 96, 12, 'Financial Controller', 'Approved']].map(r => ({
        t: r[0],
        entity: r[1],
        type: r[2],
        amount: r[3],
        move: r[4],
        owner: r[5],
        status: r[6]
      }))
    },
    audit: {
      n: 'Audit Findings & Action Tracker',
      d: 'External and internal audit findings with management actions',
      fields: [{
        k: 't',
        l: 'Finding',
        req: 1,
        full: 1
      }, {
        k: 'source',
        l: 'Source',
        type: 'select',
        o: ['External audit FY2025', 'Internal audit', 'Regulator']
      }, {
        k: 'entity',
        l: 'Entity',
        type: 'select',
        o: ENT
      }, {
        k: 'rating',
        l: 'Rating',
        type: 'select',
        o: ['High', 'Medium', 'Low']
      }, {
        k: 'owner',
        l: 'Owner'
      }, {
        k: 'date',
        l: 'Target date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Open', 'In progress', 'Closed']
      }, {
        k: 'next',
        l: 'Management action',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Finding'], ['source', 'Source'], ['entity', 'Entity'], ['rating', 'Rating', 'rating'], ['owner', 'Owner'], ['date', 'Target date', 'date'], ['status', 'Status', 'status']],
      rows: [['Manual journals approved by the preparer', 'Internal audit', 'All entities', 'High', 'Group Reporting', '2026-09-20', 'Open'], ['Segregation of duties over supplier master data changes', 'External audit FY2025', 'Holding', 'High', 'Financial Controller', '2026-09-30', 'In progress'], ['Inventory count differences not investigated promptly', 'External audit FY2025', 'Subsidiary C', 'Medium', 'Cost Accountant', '2026-08-31', 'In progress'], ['Fixed asset register not reconciled to the ledger quarterly', 'Internal audit', 'Subsidiary E', 'Medium', 'Fixed Asset Accountant', '2026-10-15', 'Open'], ['Intercompany balances not confirmed at year end', 'External audit FY2025', 'All entities', 'Medium', 'Consolidation Manager', '2026-11-30', 'In progress'], ['Related-party disclosure checklist incomplete', 'External audit FY2025', 'Holding', 'Low', 'Group Reporting', '2026-12-31', 'Open'], ['Bank signatory list outdated', 'Internal audit', 'Subsidiary G', 'Low', 'Treasury', '2026-06-30', 'Closed']].map(r => ({
        t: r[0],
        source: r[1],
        entity: r[2],
        rating: r[3],
        owner: r[4],
        date: r[5],
        status: r[6]
      }))
    }
  };
  const TRK_KEYS = Object.keys(TRK);
  let TLOCAL = [];
  try {
    TLOCAL = JSON.parse(localStorage.getItem('ofc-tracker-entries') || '[]');
  } catch (e) {
    TLOCAL = [];
  }
  function saveT() {
    try {
      localStorage.setItem('ofc-tracker-entries', JSON.stringify(TLOCAL));
    } catch (e) {}
  }
  function trkRows(key) {
    const T = TRK[key];
    const local = TLOCAL.filter(r => r.app === APP_ID && r.trk === T.n).map(r => ({
      ...r.d,
      t: r.d.t || r.t,
      _local: r.id,
      _id: r.id
    }));
    const seed = T.rows.map((r, i) => ({
      ...r,
      _id: key + ':' + i
    }));
    return [...local, ...seed].map(r => {
      const o = {
        ...r
      };
      if (key === 'ic') {
        o.balA = +o.balA || 0;
        o.balB = +o.balB || 0;
        o.diff = o.balA - o.balB;
      }
      if (key === 'submission') {
        o.late = !o.subm && daysLate(o.date) > 0 || o.subm && o.subm > o.date;
      }
      o.overdue = !!(o.date && !DONE.has(o.status) && daysLate(o.date) > 0 && key !== 'submission');
      o.wf = wfState(o._id, !!o._local);
      return o;
    });
  }
  const openCount = key => trkRows(key).filter(r => !DONE.has(r.status)).length;

  /* ---------------- Charts ---------------- */
  function ring(p) {
    const r = 15.915,
      c = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="4.5"/><circle cx="21" cy="21" r="${r}" fill="none" stroke="#A1C364" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${p} ${100 - p}"/>`;
    return `<div class="ring"><svg viewBox="0 0 42 42">${c}</svg><div class="c"><div><b class="num">${Math.round(p)}%</b><span>complete</span></div></div></div>`;
  }

  /* ---------------- Status helpers ---------------- */
  function pill(s) {
    const c = DONE.has(s) ? 'ok' : ['Not submitted', 'Unmatched', 'Rejected'].includes(s) ? 'esc' : ['Not started', 'Open', 'Draft'].includes(s) ? 'neu' : 'pend';
    return `<span class="pill ${c}">${escH(s)}</span>`;
  }
  const ico = {
    warn: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l6.5 11.5h-13z"/><path d="M8 6.5v3M8 11.5v.3"/></svg>',
    clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.8V8.2l2.2 1.3"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M3 8h10"/></svg>',
    dl: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2.5V11M4.5 7.5L8 11l3.5-3.5M2.5 13.5h11"/></svg>',
    print: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6V2h8v4M4 11H2.5V6h11v5H12M4 9h8v5H4z"/></svg>',
    spark: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l1.6 4.4L14 6l-4.4 1.6L8 12 6.4 7.6 2 6l4.4-1.6z"/></svg>',
    sort: '<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" opacity=".6"><path d="M5 1l3 3.5H2zM5 9L2 5.5h6z"/></svg>'
  };
  const chev = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--ink-3)"><path d="M5 3l4 4-4 4"/></svg>';

  /* ---------------- Views ---------------- */
  const VIEWS = {
    home: 'Overview',
    pl: 'Group P&L',
    bs: 'Balance Sheet',
    cf: 'Cash Flow Statement',
    subs: 'Subsidiary Financial Performance',
    consol: 'Consolidated Financial Statements',
    'rep-summary': 'Monthly financial performance summary',
    'rep-variance': 'Variance explanations',
    'rep-anomaly': 'Accounting anomaly detection',
    'rep-alerts': 'Missing / unusual transaction alerts',
    'rep-consol': 'Consolidated financial reporting',
    'rep-audit': 'Audit information pack'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['pl', 'bs', 'cf', 'subs', 'consol'];
  const REPS = ['rep-summary', 'rep-variance', 'rep-anomaly', 'rep-alerts', 'rep-consol', 'rep-audit'];
  let view = 'home';
  function section(v) {
    return v === 'home' ? 'home' : v.startsWith('trk-') ? 'input' : v.startsWith('rep-') ? 'reports' : 'dashboards';
  }
  function go(v, push = true) {
    if (!VIEWS[v]) v = 'home';
    view = v;
    if (push && location.hash.slice(1) !== v) history.pushState(null, '', '#' + v);
    hidePane();
    closeSheet();
    render();
    window.scrollTo({
      top: 0
    });
  }
  scope.listen(window, 'popstate', () => {
    const v = location.hash.slice(1) || 'home';
    view = VIEWS[v] ? v : 'home';
    hidePane();
    closeSheet();
    render();
  });
  const vh = (t, d, actions = '') => `<div class="vh"><div><h2>${t}</h2>${d ? `<p>${d}</p>` : ''}</div><div class="vh-actions noprint">${actions}</div></div>`;
  const exportBtn = `<button class="btn ghost sm" data-export>${ico.dl}Export CSV</button>`;
  const printBtn = `<button class="btn ghost sm" data-print>${ico.print}Print / PDF</button>`;
  function render() {
    $('#crumbView').innerHTML = view === 'home' ? '' : `<span class="sep">/</span><span>${escH(VIEWS[view])}</span>`;
    document.title = `${VIEWS[view]} · Finance & Accounts · Oman Food Capital`;
    syncRail();
    refreshBadge();
    const el = $('#view');
    if (!role.apps.includes('fa')) {
      el.innerHTML = `<div class="noaccess"><h2>You don't have access to Finance &amp; Accounts</h2><p>${escH(role.n)} can't open this app. Switch role from your profile picture, or return to Corporate.</p><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none" href="/corporate">Back to Corporate</a></div>`;
      return;
    }
    if (view === 'home') el.innerHTML = vHome();else if (view === 'pl') el.innerHTML = vPL();else if (view === 'bs') el.innerHTML = vBS();else if (view === 'cf') el.innerHTML = vCF();else if (view === 'subs') {
      el.innerHTML = vSubs();
      fillSubs();
    } else if (view === 'consol') el.innerHTML = vConsol();else if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
    } else el.innerHTML = vRep(view);
  }

  /* ---- Home ---- */
  function attention() {
    const items = [];
    trkRows('closing').filter(r => r.overdue).forEach(r => items.push({
      s: 3,
      t: r.t,
      m: `Monthly close · ${r.owner} · ${daysLate(r.date)} days overdue`,
      v: 'trk-closing'
    }));
    trkRows('submission').filter(r => r.late).forEach(r => items.push({
      s: r.subm ? 1 : 3,
      t: `${r.sub} ${r.subm ? 'submitted late' : 'has not submitted'}`,
      m: `August management accounts · due ${fmtDate(r.date)}`,
      v: 'trk-submission'
    }));
    trkRows('ic').filter(r => !DONE.has(r.status)).forEach(r => items.push({
      s: 2,
      t: `${r.t} · difference OMR ${nk(Math.abs(r.diff))}k`,
      m: `Intercompany · ${r.status}`,
      v: 'trk-ic'
    }));
    trkRows('audit').filter(r => !DONE.has(r.status) && (r.overdue || r.rating === 'High')).forEach(r => items.push({
      s: r.overdue ? 3 : 2,
      t: r.t,
      m: `Audit finding · ${r.rating} · ${r.overdue ? daysLate(r.date) + ' days overdue' : 'due ' + fmtDate(r.date)}`,
      v: 'trk-audit'
    }));
    trkRows('tax').filter(r => !DONE.has(r.status) && -daysLate(r.date) <= 21 && -daysLate(r.date) >= 0).forEach(r => items.push({
      s: 1,
      t: `${r.t} · ${r.entity}`,
      m: `Tax / regulatory · due ${fmtDate(r.date)} (${-daysLate(r.date)} days)`,
      v: 'trk-tax',
      soft: 1
    }));
    TRK_KEYS.forEach(key => trkRows(key).filter(r => r.wf === 'Submitted').forEach(r => items.push({
      s: 3,
      t: `Pending review: ${r.t}`,
      m: `${TRK[key].n} · submitted for approval`,
      v: 'trk-' + key
    })));
    return items.sort((a, b) => b.s - a.s);
  }
  function vHome() {
    const [, ra, rb] = PLv('Revenue'),
      [, ea, eb] = PLv('EBITDA'),
      [, na, nb] = PLv('Net profit');
    const cl = trkRows('closing'),
      done = cl.filter(r => DONE.has(r.status)).length,
      od = cl.filter(r => r.overdue).length,
      p = done / cl.length * 100;
    const sb = trkRows('submission'),
      rec = sb.filter(r => r.subm).length,
      late = sb.filter(r => r.late);
    const att = attention();
    const nextTasks = cl.filter(r => !DONE.has(r.status)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    return `<div class="stack">
  ${vh('Overview', 'August 2026 close, group results and what needs attention')}
  <div class="kpi5">
    <button class="kc" data-go="pl"><span class="lbl">Revenue YTD</span><span class="val num">${ra.toFixed(1)}<small>m</small></span><span class="ctx"><span class="neg">${sp(pct(ra, rb))}</span> vs budget · <span class="pos">${sp(pct(ra, PLv('Revenue')[3]))}</span> vs last year</span><span class="go">Group P&amp;L ↗</span></button>
    <button class="kc" data-go="pl"><span class="lbl">EBITDA YTD</span><span class="val num">${ea.toFixed(1)}<small>m</small></span><span class="ctx">${(ea / ra * 100).toFixed(1)}% margin · <span class="neg">${sp(pct(ea, eb))}</span> vs budget</span><span class="go">Group P&amp;L ↗</span></button>
    <button class="kc" data-go="pl"><span class="lbl">Net profit YTD</span><span class="val num">${na.toFixed(1)}<small>m</small></span><span class="ctx">Budget ${nb.toFixed(1)}m · <span class="neg">${sp(pct(na, nb))}</span></span><span class="go">Group P&amp;L ↗</span></button>
    <button class="kc" data-go="cf"><span class="lbl">Cash &amp; equivalents</span><span class="val num">57.4<small>m</small></span><span class="ctx">Down 7.4m since 1 January</span><span class="go">Cash flow ↗</span></button>
    <button class="kc mint" data-go="trk-closing"><span class="lbl">August close</span><span class="val num">${Math.round(p)}<small>%</small></span><span class="ctx">${done} of ${cl.length} tasks done${od ? ` · <span class="neg">${od} overdue</span>` : ''}</span><span class="go">Monthly Closing Tracker ↗</span></button>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Revenue vs budget</h2><p>Monthly, OMR m · 2026</p></div><button class="see" data-go="pl">Group P&amp;L ↗</button></div>
      <div class="legend-s"><span><i style="background:#A1C364"></i>Actual</span><span><i class="line" style="background:#344B37"></i>Budget</span></div>
      ${colsChart(M8, [{
      name: 'Actual',
      kind: 'bar',
      v: REV_A,
      fill: 'url(#hatchG)'
    }, {
      name: 'Budget',
      kind: 'line',
      v: REV_B,
      stroke: '#344B37',
      dash: 1
    }], {
      labels: 1,
      aria: 'Monthly revenue actual versus budget'
    })}
    </section>
    <section class="wp"><div class="wp-h"><div><h2>August close</h2><p>Target sign-off 30 Sep 2026</p></div><button class="see" data-go="trk-closing">Tracker ↗</button></div>
      <div class="close-top">${ring(p)}<div class="close-stats"><span><b>${done}</b> tasks complete</span><span><b>${cl.length - done - od}</b> on track</span><span class="${od ? 'neg' : ''}"><b>${od}</b> overdue</span></div></div>
      <ul class="mini-list">${nextTasks.map(r => `<li><span>${escH(r.t)}<small>${escH(r.owner)} · due ${fmtDate(r.date)}</small></span>${r.overdue ? '<span class="pill esc">Overdue</span>' : pill(r.status)}</li>`).join('')}</ul>
    </section>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Needs attention</h2><p>From the Finance &amp; Accounts trackers</p></div></div>
      <ul class="att">${att.slice(0, 7).map(a => `<li><button data-go="${a.v}"><span class="ic${a.soft ? ' soft' : ''}">${a.soft ? ico.clock : ico.warn}</span><span><div class="t">${escH(a.t)}</div><div class="m">${escH(a.m)}</div></span><span></span>${chev}</button></li>`).join('')}</ul>
    </section>
    <section class="wp"><div class="wp-h"><div><h2>Reporting submissions</h2><p>August management accounts · due 15 Sep</p></div><button class="see" data-go="trk-submission">Tracker ↗</button></div>
      <div class="kc" style="box-shadow:none;padding:0"><span class="val num">${rec}<small>of ${sb.length} received</small></span></div>
      <div class="meter2"><span style="width:${(rec - late.filter(r => r.subm).length) / sb.length * 100}%;background:#A1C364"></span><span style="width:${late.filter(r => r.subm).length / sb.length * 100}%;background:#F3BD7A"></span></div>
      <p style="font-size:12px;color:var(--ink-2);margin:0 0 12px">${rec - late.filter(r => r.subm).length} on time · ${late.filter(r => r.subm).length} late · ${sb.length - rec} outstanding</p>
      <ul class="mini-list">${late.map(r => `<li><span>${escH(r.sub)}<small>${r.subm ? 'Submitted ' + fmtDate(r.subm) : daysLate(r.date) + ' days overdue'}</small></span>${pill(r.status)}</li>`).join('')}</ul>
    </section>
  </div></div>`;
  }

  /* ---- Dashboards ---- */
  function plTable() {
    return `<div class="tscroll"><table class="stmt"><thead><tr><th>OMR m · YTD Aug</th><th>Actual</th><th>Budget</th><th>Variance</th><th>Var %</th><th>Last year</th></tr></thead><tbody>${PL.map(r => {
      const v = r[1] - r[2];
      return `<tr class="${r[4] || ''}"><td>${r[0]}</td><td>${f1(r[1])}</td><td>${f1(r[2])}</td><td class="${v >= 0 ? 'pos' : 'neg'}">${v >= 0 ? '+' : ''}${v.toFixed(1)}</td><td class="${v >= 0 ? 'pos' : 'neg'}">${sp(v / Math.abs(r[2]) * 100)}</td><td>${f1(r[3])}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function vPL() {
    const k = (l, a, b, extra, series) => {
      const v = pct(a, b);
      return `<div class="kc"><span class="lbl">${l}</span><span class="val num">${a.toFixed(1)}<small>m</small></span><span class="ctx">Budget ${b.toFixed(1)}m · <span class="${v >= 0 ? 'pos' : 'neg'}">${sp(v)}</span>${extra || ''}</span>${series ? spark(series) : ''}</div>`;
    };
    const [, ra, rb] = PLv('Revenue'),
      [, ga, gb] = PLv('Gross profit'),
      [, ea, eb] = PLv('EBITDA'),
      [, na, nb] = PLv('Net profit');
    const sv = subVar(),
      neg = sv.filter(s => s.d < 0),
      top3 = neg.slice(0, 3),
      top3sum = top3.reduce((a, s) => a + s.d, 0);
    return `<div class="stack">${vh('Group P&amp;L', 'Consolidated income statement · year to date 31 August 2026', exportBtn + printBtn)}
  <div class="kpi4">${k('Revenue', ra, rb, '', REV_A)}${k('Gross profit', ga, gb, ` · ${(ga / ra * 100).toFixed(1)}% margin`)}${k('EBITDA', ea, eb, ` · ${(ea / ra * 100).toFixed(1)}% margin`, EB_A)}${k('Net profit', na, nb)}</div>
  <div class="insight"><span class="status warn"></span><span>Revenue is <b>${sp(pct(ra, rb))}</b> against budget YTD, mainly Subsidiaries ${listN(top3.map(s => s.code))} (OMR ${Math.abs(top3sum).toFixed(1)}m combined). EBITDA of OMR ${ea.toFixed(1)}m is ${gap(ea, eb)} budget; margin is <b>${(ea / ra * 100).toFixed(1)}%</b> against a budgeted ${(eb / rb * 100).toFixed(1)}%. <button class="see" data-go="rep-variance">Full variance explanation ↗</button></span></div>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Revenue</h2><p>Monthly actual vs budget, OMR m</p></div></div><div class="legend-s"><span><i style="background:#A1C364"></i>Actual</span><span><i class="line" style="background:#344B37"></i>Budget</span></div>${colsChart(M8, [{
      name: 'Actual',
      kind: 'bar',
      v: REV_A,
      fill: 'url(#hatchG)'
    }, {
      name: 'Budget',
      kind: 'line',
      v: REV_B,
      stroke: '#344B37',
      dash: 1
    }], {
      labels: 1
    })}</section>
    <section class="wp"><div class="wp-h"><div><h2>EBITDA</h2><p>Monthly actual vs budget, OMR m</p></div></div><div class="legend-s"><span><i style="background:#B7C997"></i>Actual</span><span><i class="line" style="background:#344B37"></i>Budget</span></div>${colsChart(M8, [{
      name: 'Actual',
      kind: 'bar',
      v: EB_A,
      fill: 'url(#hatchS)'
    }, {
      name: 'Budget',
      kind: 'line',
      v: EB_B,
      stroke: '#344B37',
      dash: 1
    }], {
      labels: 1
    })}</section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Income statement</h2><p>Favourable variances in green, adverse in orange</p></div><button class="see" data-go="rep-variance">Variance explanations ↗</button></div>${plTable()}</section></div>`;
  }
  function bsTable() {
    return `<div class="tscroll"><table class="stmt"><thead><tr><th>OMR m</th><th>31 Aug 2026</th><th>31 Dec 2025</th><th>Movement</th></tr></thead><tbody>${BS.map(r => r[3] === 'head' ? `<tr class="head"><td colspan="4">${r[0]}</td></tr>` : `<tr class="${r[3] || 'ind'}"><td>${r[0]}</td><td>${r[1].toFixed(1)}</td><td>${r[2].toFixed(1)}</td><td>${(r[1] - r[2] >= 0 ? '+' : '') + (r[1] - r[2]).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function vBS() {
    const debt = 168.4 + 19.8,
      nd = debt - 57.4,
      ndD = 176.9 - 64.8,
      eq = 382.5,
      eqD = 377.1,
      assets = 636.9;
    const days = 243,
      cos = 118.6,
      rev = 162.4;
    const dso = 39.8 / (rev / days),
      dio = 46.2 / (cos / days),
      dpo = 41.7 / (cos / days);
    const bar = (l, v, max, c) => `<div class="hb"><span>${l}</span><span class="tr"><span class="fl" style="width:${v / max * 100}%;${c ? `background:${c}` : ''}"></span></span><span class="v">${v.toFixed(0)} days</span></div>`;
    const [, na] = PLv('Net profit'),
      margin = na / rev * 100,
      turns = rev / assets * 100,
      lev = assets / eq * 100,
      roe = na / eq * 100;
    const ratio = (l, v, unit, ctx) => `<div class="ratio-card"><span class="lbl">${l}</span><span class="val num">${v.toFixed(2)}<small>${unit}</small></span><span class="ctx">${ctx}</span></div>`;
    return `<div class="stack">${vh('Balance Sheet', 'Consolidated statement of financial position · 31 August 2026', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Total assets</span><span class="val num">636.9<small>m</small></span><span class="ctx">+18.6m since 31 Dec 2025</span></div>
    <div class="kc"><span class="lbl">Net debt</span><span class="val num">${nd.toFixed(1)}<small>m</small></span><span class="ctx">+${(nd - ndD).toFixed(1)}m since 31 Dec 2025</span></div>
    <div class="kc"><span class="lbl">Gearing (net debt / equity)</span><span class="val num">${(nd / eq * 100).toFixed(1)}<small>%</small></span><span class="ctx">${(ndD / eqD * 100).toFixed(1)}% at 31 Dec 2025</span></div>
    <div class="kc"><span class="lbl">Current ratio</span><span class="val num">${(155.5 / 68.9).toFixed(2)}<small>x</small></span><span class="ctx">${(151.1 / 66.2).toFixed(2)}x at 31 Dec 2025</span></div>
  </div>
  <div class="insight"><span class="status ${nd / eq > 0.4 ? 'warn' : 'ok'}"></span><span>Gearing of <b>${(nd / eq * 100).toFixed(1)}%</b> is ${gap(nd / eq * 100, ndD / eqD * 100)} December as net debt funded Subsidiary D capex. Working capital absorbed OMR 9.8m YTD as inventory and receivables built up ahead of the Q4 selling season.</span></div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Statement of financial position</h2></div></div>${bsTable()}</section>
    <div class="stack">
      <section class="wp"><div class="wp-h"><div><h2>Working capital</h2><p>Days, based on YTD activity</p></div></div>
        ${bar('Receivable days', dso, 110)}${bar('Inventory days', dio, 110)}${bar('Payable days', dpo, 110)}
        <div class="note" style="margin-top:14px"><span>Cash conversion cycle <b style="font-weight:600">${(dso + dio - dpo).toFixed(0)} days</b>. Inventory and receivables rose 9.8m since December.</span></div></section>
      <section class="wp"><div class="wp-h"><div><h2>Funding mix</h2><p>31 Aug 2026, OMR m</p></div></div>
        ${[['Equity', 382.5, '#344B37'], ['Borrowings', 188.2, '#A1C364'], ['Other liabilities', 66.2, '#D8DFCA']].map(([l, v, c]) => `<div class="hb"><span>${l}</span><span class="tr"><span class="fl" style="width:${v / 636.9 * 100}%;background:${c}"></span></span><span class="v">${v.toFixed(1)}</span></div>`).join('')}
      </section>
    </div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Return on equity</h2><p>Net margin × asset turnover × leverage, YTD to 31 August 2026 (not annualised)</p></div></div>
    <div class="ratio-row">${ratio('Net margin', margin, '%', 'Net profit / revenue')}<span class="op">×</span>${ratio('Asset turnover', turns, '%', 'Revenue / total assets')}<span class="op">×</span>${ratio('Leverage', lev, '%', 'Total assets / equity')}<span class="op">=</span>${ratio('Return on equity', roe, '%', 'Net profit / equity')}</div></section>
  <section class="wp"><div class="wp-h"><div><h2>Balance sheet bridge</h2><p>Equity, 31 Dec 2025 to 31 Aug 2026, OMR m</p></div></div>${waterfall([{
      l: 'Opening|equity',
      v: eqD,
      total: 1
    }, {
      l: 'Reserves &|retained earnings',
      v: 64.3 - 59.1
    }, {
      l: 'Non-controlling|interests',
      v: 18.2 - 18.0
    }, {
      l: 'Closing|equity',
      v: eq,
      total: 1
    }], 'Balance sheet bridge')}</section></div>`;
  }
  function vCF() {
    return `<div class="stack">${vh('Cash Flow Statement', 'Consolidated cash flows · year to date 31 August 2026', exportBtn + printBtn)}
  <div class="kpi5">
    <div class="kc"><span class="lbl">Operating cash flow</span><span class="val num">9.1<small>m</small></span><span class="ctx">${(9.1 / 19.7 * 100).toFixed(0)}% of EBITDA converted to cash</span></div>
    <div class="kc"><span class="lbl">Capital expenditure</span><span class="val num">22.6<small>m</small></span><span class="ctx">Mainly Subsidiary D construction</span></div>
    <div class="kc"><span class="lbl">Free cash flow</span><span class="val num neg">(13.5)<small>m</small></span><span class="ctx">Operating cash less capex</span></div>
    <div class="kc"><span class="lbl">Net borrowing</span><span class="val num">11.3<small>m</small></span><span class="ctx">18.0m drawn · 6.7m repaid</span></div>
    <div class="kc"><span class="lbl">Closing cash</span><span class="val num">57.4<small>m</small></span><span class="ctx">64.8m at 1 January</span></div>
  </div>
  <div class="insight"><span class="status warn"></span><span>Operating cash flow of OMR 9.1m converted only <b>46%</b> of EBITDA, as working capital absorbed OMR 10.1m. Capex of OMR 22.6m (mainly Subsidiary D) outpaced operating cash flow by OMR 13.5m, funded by OMR 11.3m of net new borrowing; cash fell OMR 7.4m to OMR 57.4m.</span></div>
  <section class="wp"><div class="wp-h"><div><h2>Cash bridge</h2><p>1 January to 31 August 2026, OMR m</p></div></div>
    ${waterfall([{
      l: 'Cash|1 Jan',
      v: 64.8,
      total: 1
    }, {
      l: 'Operating|cash flow',
      v: 9.1
    }, {
      l: 'Capital|expenditure',
      v: -22.6
    }, {
      l: 'Associate|dividends',
      v: 0.9
    }, {
      l: 'Net|borrowing',
      v: 11.3
    }, {
      l: 'Interest|paid',
      v: -5.3
    }, {
      l: 'NCI|dividends',
      v: -0.8
    }, {
      l: 'Cash|31 Aug',
      v: 57.4,
      total: 1
    }], 'Cash bridge')}</section>
  <section class="wp"><div class="wp-h"><div><h2>Statement of cash flows</h2></div></div><div class="tscroll"><table class="stmt"><thead><tr><th>OMR m · YTD Aug</th><th>2026</th></tr></thead><tbody>${CF.map(r => r[2] === 'head' ? `<tr class="head"><td colspan="2">${r[0]}</td></tr>` : `<tr class="${r[2] || 'ind'}"><td>${r[0]}</td><td>${f1(r[1])}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  let subsSort = {
      k: 'rev',
      d: -1
    },
    subsFilter = 'All';
  function vSubs() {
    const ops = SUBS.filter(s => s.rev > 0),
      tot = SUBS.reduce((a, s) => a + s.rev, 0),
      totB = SUBS.reduce((a, s) => a + s.bud, 0),
      below = ops.filter(s => s.rev < s.bud).length,
      loss = SUBS.filter(s => s.eb < 0).length;
    const max = Math.max(...ops.map(s => Math.max(s.rev, s.bud)));
    return `<div class="stack">${vh('Subsidiary Financial Performance', '17 subsidiaries · year to date 31 August 2026 · before intercompany eliminations', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Subsidiary revenue</span><span class="val num">${tot.toFixed(1)}<small>m</small></span><span class="ctx">Budget ${totB.toFixed(1)}m · <span class="neg">${sp(pct(tot, totB))}</span></span></div>
    <div class="kc"><span class="lbl">Below revenue budget</span><span class="val num">${below}<small>of ${ops.length} operating</small></span><span class="ctx">Largest gap: Subsidiary K</span></div>
    <div class="kc"><span class="lbl">EBITDA negative</span><span class="val num">${loss}<small>of 17</small></span><span class="ctx">Includes 3 not yet operating</span></div>
    <div class="kc"><span class="lbl">Not yet operating</span><span class="val num">${SUBS.length - ops.length}</span><span class="ctx">Subsidiary D in execution (SG4)</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>All subsidiaries</h2><p>Select a column to sort</p></div>
      <select id="subF" class="noprint" style="height:34px;border:1px solid var(--line);border-radius:6px;background:var(--callout);padding:0 10px;font:inherit;font-size:13px"><option>All</option><option>Operating</option><option>Not yet operating</option></select></div>
      <div class="tscroll"><table class="ttbl" id="subT"></table></div></section>
    <section class="wp"><div class="wp-h"><div><h2>Revenue vs budget</h2><p>Operating subsidiaries, OMR m · bar = actual, line = budget</p></div></div>
      ${ops.map(s => `<div class="hb"><span>${s.n.replace('Subsidiary ', 'Sub. ')}</span><span class="tr"><span class="fl ${s.rev < s.bud ? 'below' : ''}" style="width:${s.rev / max * 100}%"></span><span class="bm" style="left:${s.bud / max * 100}%"></span></span><span class="v">${s.rev.toFixed(1)}</span></div>`).join('')}
    </section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Revenue driver bridge</h2><p>Budget to actual, OMR m · largest movers by subsidiary</p></div></div>${revBridge()}</section></div>`;
  }
  function revBridge() {
    const sv = subVar(),
      tot = SUBS.reduce((a, s) => a + s.rev, 0),
      totB = SUBS.reduce((a, s) => a + s.bud, 0);
    const sorted = [...sv].sort((a, b) => a.d - b.d),
      neg = sorted.filter(s => s.d < 0).slice(0, 3),
      pos = sorted.filter(s => s.d > 0).slice(-2).reverse();
    const shown = new Set([...neg, ...pos].map(s => s.code)),
      other = sorted.filter(s => !shown.has(s.code)).reduce((a, s) => a + s.d, 0);
    const step = s => ({
      l: 'Sub. ' + s.code + '|' + (s.d >= 0 ? '+' : '') + s.d.toFixed(1),
      v: s.d
    });
    return waterfall([{
      l: 'Budget|revenue',
      v: totB,
      total: 1
    }, ...neg.map(step), ...pos.map(step), {
      l: 'Other|subsidiaries',
      v: other
    }, {
      l: 'Actual|revenue',
      v: tot,
      total: 1
    }], 'Revenue driver bridge');
  }
  function fillSubs() {
    const sub = Object.fromEntries(trkRows('submission').map(r => [r.sub, r]));
    let rows = SUBS.filter(s => subsFilter === 'All' || (subsFilter === 'Operating' ? s.rev > 0 : s.rev === 0)).map(s => ({
      ...s,
      var: s.bud ? pct(s.rev, s.bud) : null,
      mg: s.rev ? s.eb / s.rev * 100 : null,
      rs: sub[s.n]
    }));
    const k = subsSort.k,
      d = subsSort.d;
    rows.sort((a, b) => ((a[k] ?? -999) > (b[k] ?? -999) ? 1 : -1) * d);
    const th = (k, l, r) => `<th class="${r ? 'r' : ''}"><button data-sort="${k}">${l}${ico.sort}</button></th>`;
    $('#subT').innerHTML = `<thead><tr>${th('n', 'Subsidiary')}${th('st', 'Status')}${th('rev', 'Revenue', 1)}${th('bud', 'Budget', 1)}${th('var', 'Var %', 1)}${th('eb', 'EBITDA', 1)}${th('mg', 'Margin', 1)}<th>August pack</th></tr></thead><tbody>${rows.map(s => `<tr><td class="nw">${s.n}</td><td class="nw">${s.st}</td><td class="r num">${s.rev.toFixed(1)}</td><td class="r num">${s.bud.toFixed(1)}</td><td class="r num ${s.var == null ? '' : s.var >= 0 ? 'pos' : 'neg'}">${s.var == null ? '—' : sp(s.var)}</td><td class="r num ${s.eb < 0 ? 'neg' : ''}">${f1(s.eb)}</td><td class="r num">${s.mg == null ? '—' : s.mg.toFixed(1) + '%'}</td><td>${s.rs ? pill(s.rs.status) : '—'}</td></tr>`).join('')}</tbody>`;
  }
  function vConsol() {
    const lines = [['Revenue', 170.4, 0, -8.0], ['Cost of sales', -126.6, 0, 8.0], ['Gross profit', 43.8, 0, 0, 'sub'], ['Operating expenses', -21.7, -2.4, 0], ['EBITDA', 22.1, -2.4, 0, 'total']];
    const sb = trkRows('submission'),
      rec = sb.filter(r => r.subm).length,
      ic = trkRows('ic'),
      icm = ic.filter(r => DONE.has(r.status)).length;
    const cl = trkRows('closing'),
      st = t => cl.find(r => r.t === t)?.status || 'Not started';
    const chk = [[rec === sb.length, 'Subsidiary August packs received', `${rec} of ${sb.length} received`], [icm === ic.length, 'Intercompany balances matched', `${icm} of ${ic.length} pairs matched`], [true, 'Intercompany revenue and cost eliminations prepared', 'OMR 8.0m eliminated YTD'], [DONE.has(st('Consolidation & eliminations')), 'Consolidation journals posted', st('Consolidation & eliminations')], [DONE.has(st('Management accounts pack')), 'Group management accounts pack', st('Management accounts pack')]];
    return `<div class="stack">${vh('Consolidated Financial Statements', 'Group consolidation · year to date 31 August 2026 · 17 subsidiaries and holding company', exportBtn + printBtn)}
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Consolidation worksheet</h2><p>OMR m · subsidiaries to group</p></div><button class="see" data-go="rep-consol">Consolidated report ↗</button></div>
      <div class="tscroll"><table class="stmt"><thead><tr><th>Line</th><th>Subsidiaries</th><th>Holding</th><th>Eliminations</th><th>Group</th></tr></thead><tbody>${lines.map(r => `<tr class="${r[4] || ''}"><td>${r[0]}</td><td>${f1(r[1])}</td><td>${r[2] ? f1(r[2]) : '—'}</td><td>${r[3] ? f1(r[3]) : '—'}</td><td>${f1(r[1] + r[2] + r[3])}</td></tr>`).join('')}</tbody></table></div>
      <p class="src">Below EBITDA, group depreciation, finance costs, associates and tax are consolidated at group level. Full statements: <button class="see" data-go="pl">P&amp;L</button> · <button class="see" data-go="bs">Balance Sheet</button> · <button class="see" data-go="cf">Cash Flow</button></p>
    </section>
    <section class="wp"><div class="wp-h"><div><h2>August consolidation status</h2><p>From the close and reconciliation trackers</p></div></div>
      <ul class="checkl">${chk.map(([ok, t, s]) => `<li><span class="ck ${ok ? 'ok' : 'no'}">${ok ? '✓' : '!'}</span><span>${t}<small>${escH(s)}</small></span><span></span></li>`).join('')}</ul>
    </section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Top risks and actions</h2><p>Highest-severity items across the Finance &amp; Accounts trackers</p></div></div>
    <ul class="att">${attention().slice(0, 3).map(a => `<li><button data-go="${a.v}"><span class="ic${a.soft ? ' soft' : ''}">${a.soft ? ico.clock : ico.warn}</span><span><div class="t">${escH(a.t)}</div><div class="m">${escH(a.m)}</div></span><span></span>${chev}</button></li>`).join('')}</ul></section>
  <section class="wp"><div class="wp-h"><div><h2>Group statements at a glance</h2><p>OMR m</p></div></div>
    <div class="kpi4">
      <button class="kc" data-go="pl" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">Net profit YTD</span><span class="val num">6.2<small>m</small></span><span class="ctx">Income statement ↗</span></button>
      <button class="kc" data-go="bs" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">Total equity</span><span class="val num">382.5<small>m</small></span><span class="ctx">Financial position ↗</span></button>
      <button class="kc" data-go="bs" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">Total assets</span><span class="val num">636.9<small>m</small></span><span class="ctx">Financial position ↗</span></button>
      <button class="kc" data-go="cf" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">Net change in cash</span><span class="val num neg">(7.4)<small>m</small></span><span class="ctx">Cash flows ↗</span></button>
    </div></section></div>`;
  }

  /* ---- Trackers ---- */
  let tState = {
    q: '',
    status: 'All',
    entity: 'All'
  };
  function vTrk(key) {
    const T = TRK[key];
    tState = {
      q: '',
      status: 'All',
      entity: 'All'
    };
    const rows = trkRows(key),
      sts = [...new Set(rows.map(r => r.status))],
      entKey = T.cols.find(c => c[0] === 'entity' || c[0] === 'sub')?.[0];
    const ents = entKey ? [...new Set(rows.map(r => r[entKey]))] : [];
    return `<div>${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">${ico.plus}New entry</button>` + exportBtn)}
  <section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker">
    <select id="ts" aria-label="Status"><option value="All">All statuses</option>${sts.map(s => `<option>${escH(s)}</option>`).join('')}</select>
    ${entKey ? `<select id="te" aria-label="Entity"><option value="All">All entities</option>${ents.map(s => `<option>${escH(s)}</option>`).join('')}</select>` : ''}
    <span class="cnt" id="tc"></span></div>
    <div class="sumchips" id="tchips"></div>
    <div class="tscroll"><table class="ttbl" id="tt"></table></div></section></div>`;
  }
  function trkFiltered() {
    const key = view.slice(4),
      T = TRK[key],
      entKey = T.cols.find(c => c[0] === 'entity' || c[0] === 'sub')?.[0],
      q = tState.q.toLowerCase();
    return trkRows(key).filter(r => (tState.status === 'All' || r.status === tState.status) && (tState.entity === 'All' || r[entKey] === tState.entity) && (!q || Object.values(r).join(' ').toLowerCase().includes(q)));
  }
  function cell(r, c) {
    const [k,, type] = c,
      v = r[k];
    if (type === 'date') return `<td class="nw">${fmtDate(v)}</td>`;
    if (type === 'status') return `<td class="nw">${pill(v)}${r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''}</td>`;
    if (type === 'sstatus') return `<td class="nw">${pill(v)}${r.late ? `<span class="od">${r.subm ? 'late' : daysLate(r.date) + 'd overdue'}</span>` : ''}</td>`;
    if (type === 'num') return `<td class="r num">${nk(v)}</td>`;
    if (type === 'mv') return `<td class="r num">${+v > 0 ? '+' : ''}${nk(v)}</td>`;
    if (type === 'diff') return `<td class="r num ${v ? 'neg' : ''}">${v ? nk(v) : '—'}</td>`;
    if (type === 'rating') return `<td><span class="pill ${v === 'High' ? 'hi' : v === 'Medium' ? 'md' : 'lo'}">${escH(v)}</span></td>`;
    return `<td>${escH(v || '—')}${k === 't' && r._local ? '<span class="newtag">New</span>' : ''}${k === 't' && r.next && TRK[view.slice(4)].cols.every(c => c[0] !== 'next') ? `<small style="display:block;color:var(--ink-2);margin-top:2px">${escH(r.next)}</small>` : ''}</td>`;
  }
  function fillTrk() {
    const key = view.slice(4),
      T = TRK[key],
      all = trkRows(key),
      rows = trkFiltered();
    const numCols = ['num', 'mv', 'diff'];
    $('#tt').innerHTML = `<thead><tr>${T.cols.map(c => `<th class="${numCols.includes(c[2]) ? 'r' : ''}">${c[1]}</th>`).join('')}<th>Workflow</th></tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${T.cols.map(c => cell(r, c)).join('')}<td class="nw">${pill(r.wf)}${wfActions(r._id, r.wf)}${r._local ? `<button class="pbtn noprint" data-tdel="${r._local}" aria-label="Remove entry" style="width:28px;height:28px"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>` : ''}</td></tr>`).join('') : `<tr><td colspan="${T.cols.length + 1}" style="text-align:center;color:var(--ink-2);padding:28px">No entries match these filters.</td></tr>`}</tbody>`;
    $('#tc').textContent = `${rows.length} of ${all.length} entries`;
    const by = {};
    all.forEach(r => by[r.status] = (by[r.status] || 0) + 1);
    const od = all.filter(r => r.overdue).length,
      late = all.filter(r => r.late).length;
    let extra = '';
    if (key === 'ic') {
      const d = all.reduce((a, r) => a + Math.abs(r.diff), 0);
      extra = `<span class="${d ? 'warn' : ''}">Unreconciled <b>OMR ${nk(d)}k</b></span>`;
    }
    if (key === 'prov') {
      extra = `<span>Total balance <b>OMR ${nk(all.reduce((a, r) => a + (+r.amount || 0), 0))}k</b></span><span>Movement <b>+${nk(all.reduce((a, r) => a + (+r.move || 0), 0))}k</b></span>`;
    }
    $('#tchips').innerHTML = Object.entries(by).map(([k, v]) => `<span>${escH(k)} <b>${v}</b></span>`).join('') + (od ? `<span class="warn">Overdue <b>${od}</b></span>` : '') + (late ? `<span class="warn">Late or missing <b>${late}</b></span>` : '') + extra;
  }

  /* ---- AI reports ---- */
  function repHead(title, sources, actions = '') {
    return `<div class="vh"><div><span class="ai-badge">${ico.spark}Drafted by OFC AI</span><h2 style="margin-top:10px">${title}</h2><p>Generated 23 Sep 2026, 08:40 · Period: August 2026</p><p class="src">Sources: <b>${sources}</b></p></div><div class="vh-actions noprint"><button class="btn ghost sm" data-regen>${ico.spark}Regenerate</button>${actions}${printBtn}<button class="btn sm" data-toast="Shared with the Group CFO for review.">Share</button></div></div>`;
  }
  function subVar() {
    return SUBS.filter(s => s.bud).map(s => ({
      ...s,
      d: s.rev - s.bud
    })).sort((a, b) => a.d - b.d);
  }
  function vRep(v) {
    const [, ra, rb, rp] = PLv('Revenue'),
      [, ea, eb] = PLv('EBITDA'),
      [, na, nb] = PLv('Net profit');
    const sv = subVar(),
      neg = sv.filter(s => s.d < 0),
      top3 = neg.slice(0, 3),
      top3sum = top3.reduce((a, s) => a + s.d, 0);
    const cl = trkRows('closing'),
      done = cl.filter(r => DONE.has(r.status)).length,
      sb = trkRows('submission'),
      miss = sb.filter(r => !r.subm);
    let body = '';
    if (v === 'rep-summary') {
      body = repHead('Monthly financial performance summary', 'Group P&amp;L, Balance Sheet, Cash Flow, Monthly Closing and Submission trackers') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">August revenue of <b>OMR 21.3m</b> was ${gap(21.3, 22.4)} budget. Year to date, revenue of <b>OMR ${ra.toFixed(1)}m</b> is ${gap(ra, rb)} budget but ${gap(ra, rp, 'ahead of', 'behind')} last year.</p>
    <h3>Key messages</h3><ul class="pts">
      <li>EBITDA of OMR ${ea.toFixed(1)}m is ${gap(ea, eb)} budget; margin is ${(ea / ra * 100).toFixed(1)}% against a budgeted ${(eb / rb * 100).toFixed(1)}%.</li>
      <li>Net profit of OMR ${na.toFixed(1)}m is ${gap(na, nb)} budget, reflecting the EBITDA shortfall and OMR 0.3m of higher finance costs.</li>
      <li>Subsidiaries ${listN(top3.map(s => s.code))} account for OMR ${Math.abs(top3sum).toFixed(1)}m of the OMR ${(rb - ra).toFixed(1)}m revenue gap.</li>
      <li>Cash fell OMR 7.4m to OMR 57.4m as OMR 22.6m of capital expenditure outpaced OMR 9.1m of operating cash flow; OMR 11.3m of net borrowing funded the difference.</li>
      <li>Working capital absorbed OMR 10.1m, mainly higher inventories (+5.2m) and receivables (+4.6m).</li></ul>
    <h3>Headline numbers</h3>${plTable()}
    <h3>Close and reporting status</h3><ul class="pts">
      <li>August close is ${Math.round(done / cl.length * 100)}% complete (${done} of ${cl.length} tasks); ${cl.filter(r => r.overdue).map(r => r.t.toLowerCase()).join(', ') || 'no tasks'} ${cl.filter(r => r.overdue).length === 1 ? 'is' : 'are'} overdue.</li>
      <li>${sb.length - miss.length} of ${sb.length} subsidiary packs received; ${miss.length > 1 ? 'Subsidiaries ' + listN(miss.map(r => r.sub.replace('Subsidiary ', ''))) : miss.map(r => r.sub).join('')} ${miss.length === 1 ? 'has' : 'have'} not submitted.</li></ul></section>`;
    } else if (v === 'rep-variance') {
      const exp = {
        'Revenue': `Volume shortfall at Subsidiaries ${listN(top3.map(s => s.code))} accounts for OMR ${Math.abs(top3sum).toFixed(1)}m of the gap.`,
        'Cost of sales': 'Lower volumes reduced cost of sales; gross margin fell to 27.0% from a budgeted 27.8% on higher feed prices.',
        'Operating expenses': 'Hiring deferred at the holding company and two subsidiaries.',
        'Depreciation & amortisation': 'Later capitalisation of Subsidiary D assets.',
        'Finance costs': 'Earlier drawdown on the Subsidiary D facility.',
        'Share of results of associates': 'Lower associate earnings in the second quarter.',
        'Income tax': 'Lower taxable profits.'
      };
      body = repHead('Variance explanations', 'Group P&amp;L, Subsidiary Financial Performance, general ledger', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Year-to-date EBITDA is <b>OMR ${(eb - ea).toFixed(1)}m</b> below budget. Revenue explains most of the gap; lower costs offset part of it.</p>
    <h3>By income statement line</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Line</th><th class="r">Actual</th><th class="r">Budget</th><th class="r">Variance</th><th>Explanation</th></tr></thead><tbody>${PL.filter(r => exp[r[0]]).map(r => {
        const d = r[1] - r[2];
        return `<tr><td class="nw">${r[0]}</td><td class="r num">${f1(r[1])}</td><td class="r num">${f1(r[2])}</td><td class="r num ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '+' : ''}${d.toFixed(1)}</td><td>${exp[r[0]]}</td></tr>`;
      }).join('')}</tbody></table></div>
    <h3>Largest subsidiary revenue variances</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Subsidiary</th><th class="r">Actual</th><th class="r">Budget</th><th class="r">Variance</th><th>Likely driver</th></tr></thead><tbody>${[...neg.slice(0, 5), ...sv.filter(s => s.d > 0)].map(s => `<tr><td class="nw">${s.n}</td><td class="r num">${s.rev.toFixed(1)}</td><td class="r num">${s.bud.toFixed(1)}</td><td class="r num ${s.d >= 0 ? 'pos' : 'neg'}">${s.d >= 0 ? '+' : ''}${s.d.toFixed(1)}</td><td>${{
        K: 'Production line downtime in Q2 cut volumes.',
        E: 'Lower catch volumes during the summer season.',
        B: 'Lower selling prices on higher market supply.',
        G: 'Vessel maintenance reduced fishing days.',
        C: 'Delayed launch of a new product range.',
        J: 'Lower greenhouse yields in the hot season.',
        F: 'Higher export volumes than planned.',
        L: 'Stronger local demand.'
      }[s.code] || 'Under review with the subsidiary finance team.'}</td></tr>`).join('')}</tbody></table></div></section>`;
    } else if (v === 'rep-anomaly') {
      const A = [['JE-08-4471', 'Holding', '2026-08-30', 185000, 'Manual journal posted on a weekend above the approval threshold', .91], ['AP-08-1187 / 1193', 'Subsidiary E', '2026-08-22', 12640, 'Possible duplicate supplier invoice: same supplier and amount, three days apart', .84], ['JE-08-3902', 'Subsidiary B', '2026-08-28', 42000, 'Round-sum accrual with no supporting document attached', .78], ['JE-08-4520', 'Subsidiary K', '2026-08-31', 67500, 'Revenue reversal posted after the cut-off date', .72], ['JE-07-2231', 'Subsidiary A', '2026-07-31', 23800, 'July accrual not reversed in August', .66]];
      body = repHead('Accounting anomaly detection', 'General ledger journals, accounts payable sub-ledger', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">OFC AI scanned <b>2,184 journals</b> posted for August across 18 entities and flagged <b>${A.length}</b> for review. Two score above 0.8 and should be cleared before consolidation.</p>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Reference</th><th>Entity</th><th>Posted</th><th class="r">Amount (OMR)</th><th>Why it was flagged</th><th class="r">Risk score</th></tr></thead><tbody>${A.map(a => `<tr><td class="nw">${a[0]}</td><td class="nw">${a[1]}</td><td class="nw">${fmtDate(a[2])}</td><td class="r num">${nk(a[3])}</td><td>${a[4]}</td><td class="r"><span class="score ${a[5] >= .8 ? 'h' : 'm'}">${a[5].toFixed(2)}</span></td></tr>`).join('')}</tbody></table></div>
    <h3>How entries are scored</h3><ul class="pts"><li>Rules: weekend or out-of-hours posting, round sums, duplicate supplier and amount pairs, postings after cut-off, unreversed accruals.</li><li>The score blends rule hits with how unusual the entry is for that account and entity over the last 12 months.</li></ul></section>`;
    } else if (v === 'rep-alerts') {
      const miss2 = [['Subsidiary O', 'No August payroll journal posted', 'Payroll has posted every month since January'], ['Subsidiary K', 'Monthly rent accrual missing', 'Posted every month from January to July'], ['Subsidiary Q', 'Depreciation run not posted for August', 'Asset register shows 14 assets in use']];
      const unus = [['Subsidiary E', 'Freight costs 38% above the six-month average', 'OMR 214k in August against an average of OMR 155k'], ['Subsidiary B', 'Credit notes 2.3 times the monthly average', 'Concentrated on two customers'], ['Subsidiary N', 'Cash balance down 61% month on month', 'Large supplier payment on 27 Aug']];
      const li = (a, soft) => `<li><button data-toast="Opened in the general ledger (demo)."><span class="ic${soft ? ' soft' : ''}">${soft ? ico.clock : ico.warn}</span><span><div class="t">${a[0]} · ${a[1]}</div><div class="m">${a[2]}</div></span><span></span>${chev}</button></li>`;
      body = repHead('Missing / unusual transaction alerts', 'General ledger, payroll and fixed asset sub-ledgers') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">For August, OFC AI found <b>${miss2.length} expected transactions missing</b> and <b>${unus.length} unusual movements</b> compared with each entity's normal pattern.</p>
    <h3>Missing transactions</h3><ul class="att">${miss2.map(a => li(a)).join('')}</ul>
    <h3>Unusual movements</h3><ul class="att">${unus.map(a => li(a, 1)).join('')}</ul></section>`;
    } else if (v === 'rep-consol') {
      body = repHead('Consolidated financial reporting', 'Consolidation worksheet, Group P&amp;L, Balance Sheet, Cash Flow') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Condensed consolidated financial statements of Oman Food Capital for the eight months to 31 August 2026, covering the holding company and 17 subsidiaries. Intercompany revenue of OMR 8.0m has been eliminated.</p>
    <h3>Consolidated income statement</h3>${plTable()}
    <h3>Consolidated statement of financial position</h3>${bsTable()}
    <h3>Notes</h3><ul class="pts"><li>Figures for Subsidiaries K and N are based on July submissions rolled forward, pending their August packs.</li><li>The Holding ↔ Subsidiary D difference of OMR 250k is a transfer in transit and will be eliminated on receipt.</li></ul></section>`;
    } else {
      const sbR = sb.length - miss.length,
        ic = trkRows('ic'),
        au = trkRows('audit');
      const items = [[sbR === sb.length, 'Trial balances for all entities', `${sbR} of ${sb.length} subsidiaries plus holding`], [true, 'Consolidation workings', 'Worksheet and elimination schedules'], [true, 'Bank reconciliations and confirmations', 'All entities, 31 Aug 2026'], [true, 'Fixed asset register and additions', 'Additions OMR 22.6m YTD'], [ic.every(r => DONE.has(r.status)), 'Intercompany confirmations', `${ic.filter(r => DONE.has(r.status)).length} of ${ic.length} pairs matched`], [true, 'Provisions and accruals schedule', `${trkRows('prov').length} items`], [true, 'Tax computations and filings', 'From the Tax / Regulatory Compliance Tracker'], [au.every(r => DONE.has(r.status)), 'Status of prior audit findings', `${au.filter(r => !DONE.has(r.status)).length} findings still open`], [false, 'Related-party transactions schedule', 'Disclosure checklist incomplete']];
      body = repHead('Audit information pack', 'All Finance &amp; Accounts trackers, ledgers and statements') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">OFC AI has assembled the audit information pack for the period to 31 August 2026. <b>${items.filter(i => i[0]).length} of ${items.length}</b> sections are complete; the rest are listed with what is missing.</p>
    <ul class="checkl">${items.map(([ok, t, s]) => `<li><span class="ck ${ok ? 'ok' : 'no'}">${ok ? '✓' : '!'}</span><span>${t}<small>${s}</small></span>${ok ? '<span class="pill ok">Ready</span>' : '<span class="pill esc">Missing</span>'}</li>`).join('')}</ul>
    <div style="display:flex;justify-content:flex-end;margin-top:16px" class="noprint"><button class="btn" data-genpack>${ico.spark} Generate pack</button></div></section>`;
    }
    return `<div class="stack">${body}</div>`;
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
      b = hpSec('Finance &amp; Accounts trackers') + TRK_KEYS.map(key => hpItem(`data-go="trk-${key}"`, IC.table, TRK[key].n, openCount(key) ? openCount(key) + ' open' : '', view === 'trk-' + key)).join('') + (recent.length ? hpSec('Recent items') + recent.map(r => hpItem(`data-go="trk-${TRK_KEYS.find(x => TRK[x].n === r.trk)}"`, IC.rec, escH(r.t))).join('') : '');
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
  function openSheet(key) {
    closeFlyouts();
    hidePane();
    sheetKey = key;
    sheetOpen = true;
    const T = TRK[key];
    $('#panelT').textContent = 'New entry';
    $('#panelB').innerHTML = `<div class="trk-meta"><span class="hp-mi" style="background:#4B6B78"><svg viewBox="0 0 24 24">${APPS[2].g}</svg></span><span>${escH(T.n)}</span></div>
  <form class="pform" id="trkForm" novalidate>${T.fields.map(fieldHTML).join('')}<p class="err" id="trkErr" hidden>Fill in the fields marked *.</p><div class="full pf-foot"><span>Saved in this browser and shown in the tracker.</span><button class="btn" type="submit">Add to tracker</button></div></form>`;
    $('#panel').classList.add('open');
    $('#panel').setAttribute('aria-hidden', 'false');
    $('#pscrim').classList.add('open');
    syncRail();
    scope.setTimeout(() => {
      const f = $('#trkForm [name]');
      f && f.focus();
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
    const f = e.target,
      T = TRK[sheetKey],
      d = {};
    let bad = false;
    T.fields.forEach(x => {
      const el = f.elements[x.k];
      const v = (el.value || '').trim();
      d[x.k] = x.type === 'number' && v !== '' ? +v : v;
      if (x.req && !v) {
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
      app: 'fa',
      trk: T.n,
      t: d.t,
      d
    });
    saveT();
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

  /* ---------------- Export ---------------- */
  function download(name, rows) {
    const csv = rows.map(r => r.map(v => {
      v = String(v ?? '');
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {
      type: 'text/csv'
    }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    scope.setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  function exportView() {
    if (view.startsWith('trk-')) {
      const T = TRK[view.slice(4)];
      download(`${T.n.replace(/[^\w]+/g, '-').toLowerCase()}.csv`, [T.cols.map(c => c[1]), ...trkFiltered().map(r => T.cols.map(c => c[2] === 'date' ? fmtDate(r[c[0]]) : r[c[0]]))]);
      return;
    }
    if (view === 'pl' || view === 'rep-variance') return download('group-pl-ytd-aug-2026.csv', [['Line', 'Actual', 'Budget', 'Variance', 'Last year'], ...PL.map(r => [r[0], r[1], r[2], (r[1] - r[2]).toFixed(1), r[3]])]);
    if (view === 'bs') return download('balance-sheet-31-aug-2026.csv', [['Line', '31 Aug 2026', '31 Dec 2025'], ...BS.map(r => [r[0], r[1] ?? '', r[2] ?? ''])]);
    if (view === 'cf') return download('cash-flow-ytd-aug-2026.csv', [['Line', '2026'], ...CF.map(r => [r[0], r[1] ?? ''])]);
    if (view === 'subs') return download('subsidiary-performance-ytd-aug-2026.csv', [['Subsidiary', 'Status', 'Revenue', 'Budget', 'EBITDA'], ...SUBS.map(s => [s.n, s.st, s.rev, s.bud, s.eb])]);
    if (view === 'consol') return download('consolidation-worksheet.csv', [['Line', 'Subsidiaries', 'Holding', 'Eliminations', 'Group'], ['Revenue', 170.4, 0, -8.0, 162.4], ['Cost of sales', -126.6, 0, 8.0, -118.6], ['Operating expenses', -21.7, -2.4, 0, -24.1], ['EBITDA', 22.1, -2.4, 0, 19.7]]);
    if (view === 'rep-anomaly') return toast('Exported flagged journals to CSV.');
    toast('Exported.');
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
    const wf = e.target.closest('[data-wf-action]');
    if (wf) {
      const id = wf.dataset.wfId,
        action = wf.dataset.wfAction;
      if (action === 'submit') {
        if (setWorkflow(id, 'Submitted')) toast('Submitted for review.');
      } else if (action === 'approve') {
        if (setWorkflow(id, 'Approved')) toast('Entry approved.');
      } else if (action === 'reject') {
        const note = prompt('Reason for sending this back?') || '';
        if (note.trim() && setWorkflow(id, 'Rejected', note.trim())) toast('Sent back for revision.');else return;
      } else if (action === 'resubmit') {
        if (setWorkflow(id, 'Submitted')) toast('Resubmitted for review.');
      }
      fillTrk();
      return;
    }
    const s = e.target.closest('[data-sort]');
    if (s) {
      const k = s.dataset.sort;
      subsSort = {
        k,
        d: subsSort.k === k ? -subsSort.d : k === 'n' || k === 'st' ? 1 : -1
      };
      fillSubs();
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
      const d = $('#repDoc');
      d.classList.add('run');
      scope.setTimeout(() => {
        d.classList.remove('run');
        toast('Report regenerated from the latest tracker data.');
      }, 1100);
      return;
    }
    if (e.target.closest('[data-genpack]')) {
      const d = $('#repDoc');
      d.classList.add('run');
      scope.setTimeout(() => {
        d.classList.remove('run');
        toast('Audit pack generated with 2 sections flagged as missing.');
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
    if (e.target.id === 'subF') {
      subsFilter = e.target.value;
      fillSubs();
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
    } else toast(`No results for "${e.target.value.trim()}" in Finance & Accounts.`);
  });

  /* ---------------- Init ---------------- */
  renderRoles();
  renderLauncher();
  view = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
  render();
}