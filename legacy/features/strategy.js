import { dashboardCreateLink } from "./dashboard-create-link.js";
import { REV_A, REV_B, EB_A, EB_B, SUBS, DECISIONS } from "./group-data";
import { createShared } from "./shared";
export function initialize(scope) {
  const APP_ID = 'strategy',
    APP_NAME = 'Strategy';
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
     Strategy app · Oman Food Capital (Investment Department, Strategy Division)
     Structure (trackers, dashboards, AI reports) follows the OFC deck.
     Corporate BSC, KPI mix, department scores and decisions come from OFC's
     current build; other figures are illustrative and tie to F&A and Treasury.
     ===================================================================== */

  /* ---------------- Data ----------------
     From OFC's current build: corporate BSC 76%, the 12-KPI status mix,
     department BSC scores and the five decisions. Everything else is
     illustrative sample data, consistent with Finance & Accounts and Treasury. */
  const BSC = 76;
  const DEPT_BSC = [['Investment', 74, 'Target'], ['Finance', 81, 'Target'], ['Corporate Support', 69, 'Below Target'], ['GRC', 88, 'Above Target'], ['Internal Audit', 92, 'Above Target'], ['Stakeholders', 77, 'Target']];
  const KPI_ST = [['Exceptional', '#A9CD69'], ['Above Target', '#B7C997'], ['Target', '#344B37'], ['Below Target', '#F3BD7A'], ['Not started', '#D8DFCA']];
  const KPI_C = Object.fromEntries(KPI_ST);
  let CLOCAL = [];
  try {
    CLOCAL = JSON.parse(localStorage.getItem('ofc-local-records') || '[]');
  } catch (e) {
    CLOCAL = [];
  }
  /* Five-year plan, OMR m */
  const YRS = ['2025A', '2026', '2027', '2028', '2029', '2030'];
  const BP = {
    rev: [231.4, 262.0, 305.0, 360.0, 410.0, 455.0],
    eb: [25.5, 34.5, 45.8, 58.0, 69.5, 81.9],
    capex: [31.2, 36.0, 48.0, 42.0, 30.0, 28.0],
    newinv: [0, 0, 35.0, 45.0, 40.0, 30.0],
    ops: [14, 15, 17, 18, 19, 20]
  };
  const F26 = {
    rev: 249.8,
    eb: 30.1,
    ops: 14
  };
  /* YTD Aug 2026 (from Finance & Accounts) */
  const YTD = {
    rev: [162.4, 170.8],
    eb: [19.7, 22.4],
    np: [6.2, 8.9],
    capex: [22.6, 24.0]
  };
  const SUBV = [['A', 34.6, 35.2], ['B', 27.8, 28.9], ['C', 22.4, 23.1], ['E', 16.9, 18.4], ['F', 14.2, 14.0], ['G', 12.1, 13.0], ['H', 9.8, 10.2], ['I', 8.6, 8.9], ['J', 6.7, 7.4], ['K', 5.9, 7.8], ['L', 4.3, 4.1], ['M', 3.6, 3.8], ['N', 2.2, 2.6], ['O', 1.3, 1.4]];
  /* Funding plan by year: requirement and sources */
  const FUND = [{
    y: '2026',
    capex: 36.0,
    inv: 0,
    rep: 17.7,
    ocf: 16.0,
    debt: 28.0,
    eq: 12.0,
    div: 0,
    st: 'Approved'
  }, {
    y: '2027',
    capex: 48.0,
    inv: 35.0,
    rep: 17.2,
    ocf: 28.0,
    debt: 25.0,
    eq: 30.0,
    div: 14.0,
    st: 'Draft'
  }, {
    y: '2028',
    capex: 42.0,
    inv: 45.0,
    rep: 26.4,
    ocf: 38.0,
    debt: 35.0,
    eq: 35.0,
    div: 0,
    st: 'Indicative'
  }, {
    y: '2029',
    capex: 30.0,
    inv: 40.0,
    rep: 19.8,
    ocf: 48.0,
    debt: 25.0,
    eq: 15.0,
    div: 0,
    st: 'Indicative'
  }, {
    y: '2030',
    capex: 28.0,
    inv: 30.0,
    rep: 22.1,
    ocf: 58.0,
    debt: 20.0,
    eq: 0,
    div: 0,
    st: 'Indicative'
  }].map(f => ({
    ...f,
    req: f.capex + f.inv + f.rep,
    src: f.ocf + f.debt + f.eq + f.div
  }));
  const MEETINGS = [['2026-09-30', 'Divestment Committee', 'AAAID consideration price'], ['2026-10-05', 'Transformation Committee', 'Subsidiary D recovery plan'], ['2026-10-07', 'Executive Committee', 'Group ERP vendor selection; 2027 budget guidelines'], ['2026-10-12', 'Audit & Risk Committee', 'Monitoring and reporting controls'], ['2026-10-14', 'Board Executive Committee', 'Al Jazir FID financing'], ['2026-10-22', 'Board of Directors', 'Q3 performance; strategy session'], ['2026-11-10', 'Shareholder quarterly review', 'Q3 shareholder report']];
  const SH_REPORTS = [['FY2025 annual report', '2026-03-31', '2026-03-29', 'Submitted'], ['Q1 2026 performance report', '2026-04-30', '2026-04-28', 'Submitted'], ['Q2 2026 performance report', '2026-07-31', '2026-07-30', 'Submitted'], ['Q3 2026 performance report', '2026-10-31', '', 'Not started'], ['2027–2031 business plan', '2026-12-31', '', 'In progress']];

  /* ---------------- Trackers (names from the deck) ---------------- */
  const ENT = ['Holding', 'All entities', ...'ABCDEFGHIJKLMNOPQ'.split('').map(x => 'Subsidiary ' + x)];
  const DEPTS = ['Strategy', 'Investment', 'Finance', 'Treasury', 'FP&A', 'PMO', 'Asset Management', 'Corporate Support', 'GRC', 'Internal Audit', 'CEO Office'];
  const DONE = new Set(['Completed', 'Approved', 'Submitted', 'On track', 'Exceptional', 'Above Target', 'Target', 'Achieved']);
  const TRK = {
    init: {
      n: 'Strategic Plan, Initiatives & Value Creation Tracker',
      d: 'Corporate strategic initiatives and the value they are expected to create',
      fields: [{
        k: 't',
        l: 'Initiative',
        req: 1,
        full: 1
      }, {
        k: 'dept',
        l: 'Lead department',
        type: 'select',
        o: DEPTS
      }, {
        k: 'owner',
        l: 'Sponsor'
      }, {
        k: 'value',
        l: 'Expected value (OMR m a year)',
        type: 'number'
      }, {
        k: 'prog',
        l: 'Progress %',
        type: 'number'
      }, {
        k: 'date',
        l: 'Target completion',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['On track', 'At risk', 'Delayed', 'Completed']
      }, {
        k: 'next',
        l: 'Value creation lever / notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Initiative'], ['dept', 'Lead'], ['owner', 'Sponsor'], ['value', 'Value / year', 'm'], ['prog', 'Progress', 'prog'], ['date', 'Target', 'date'], ['status', 'Status', 'status']],
      noOverdue: 1,
      rows: [['Group ERP implementation', 'Corporate Support', 'CFO', 1.2, 20, '2027-12-31', 'At risk', 'Cost efficiency and faster close; vendor selection deadlocked at EC'], ['Subsidiary D completion and ramp-up', 'Investment', 'CIO', 8.5, 62, '2027-06-30', 'Delayed', 'New operating company; mobilisation delay escalated'], ['Portfolio operating model and value creation plans', 'Asset Management', 'CIO', 4.0, 55, '2027-03-31', 'On track', 'EBITDA uplift across the five largest subsidiaries'], ['Divestment of AAAID stake (ABMC/ANPC)', 'Investment', 'CIO', 14.0, 40, '2027-03-31', 'On track', 'One-off proceeds recycled into new investments']].map(r => ({
        t: r[0],
        dept: r[1],
        owner: r[2],
        value: r[3],
        prog: r[4],
        date: r[5],
        status: r[6],
        next: r[7]
      }))
    },
    bp: {
      n: '5-Year Business Plan Tracker',
      d: '2027–2031 business plan refresh · Board approval due before year end',
      fields: [{
        k: 't',
        l: 'Workstream',
        req: 1,
        full: 1
      }, {
        k: 'owner',
        l: 'Owner',
        type: 'select',
        o: DEPTS
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'prog',
        l: 'Progress %',
        type: 'number'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not started', 'In progress', 'Completed']
      }, {
        k: 'next',
        l: 'Notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Workstream'], ['owner', 'Owner'], ['date', 'Due', 'date'], ['prog', 'Progress', 'prog'], ['status', 'Status', 'status']],
      rows: [['Macroeconomic and market assumptions', 'Strategy', '2026-09-30', 70, 'In progress'], ['Subsidiary business plans (17 entities)', 'Asset Management', '2026-10-31', 20, 'In progress'], ['Investment pipeline and new deals', 'Investment', '2026-10-31', 35, 'In progress'], ['Funding plan and capital structure', 'Treasury', '2026-11-15', 0, 'Not started'], ['Consolidated financial model', 'Strategy', '2026-11-20', 0, 'Not started'], ['Scenarios and sensitivities', 'Strategy', '2026-11-25', 0, 'Not started'], ['Executive Committee review', 'Strategy', '2026-12-01', 0, 'Not started'], ['Board approval', 'CEO Office', '2026-12-17', 0, 'Not started']].map(r => ({
        t: r[0],
        owner: r[1],
        date: r[2],
        prog: r[3],
        status: r[4]
      }))
    },
    budget: {
      n: 'Annual Budget Tracker',
      d: '2027 budget cycle · Board approval 15 Dec 2026',
      fields: [{
        k: 't',
        l: 'Milestone',
        req: 1,
        full: 1
      }, {
        k: 'owner',
        l: 'Owner',
        type: 'select',
        o: DEPTS
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not started', 'In progress', 'Completed']
      }, {
        k: 'next',
        l: 'Notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Milestone'], ['owner', 'Owner'], ['date', 'Due', 'date'], ['status', 'Status', 'status']],
      rows: [['Budget guidelines and planning assumptions issued', 'Strategy', '2026-09-30', 'In progress'], ['Budget kick-off with subsidiaries', 'FP&A', '2026-10-05', 'Not started'], ['Subsidiary draft budgets submitted', 'Asset Management', '2026-10-31', 'Not started'], ['Alignment review against the business plan', 'Strategy', '2026-11-10', 'Not started'], ['Consolidated draft to CFO and CIO', 'FP&A', '2026-11-17', 'Not started'], ['Executive Committee review', 'Strategy', '2026-11-24', 'Not started'], ['Board approval', 'CEO Office', '2026-12-15', 'Not started'], ['Budget loaded to reporting systems', 'FP&A', '2026-12-31', 'Not started'], ['2026 budget approved by the Board', 'CEO Office', '2025-12-16', 'Completed']].map(r => ({
        t: r[0],
        owner: r[1],
        date: r[2],
        status: r[3]
      }))
    },
    fund: {
      n: 'Funding Plan Tracker',
      d: 'Five-year funding requirement and sources · OMR m',
      fields: [{
        k: 't',
        l: 'Year',
        type: 'select',
        o: ['2026', '2027', '2028', '2029', '2030', '2031'],
        req: 1
      }, {
        k: 'req',
        l: 'Funding requirement',
        type: 'number'
      }, {
        k: 'ocf',
        l: 'Operating cash flow',
        type: 'number'
      }, {
        k: 'debt',
        l: 'New debt',
        type: 'number'
      }, {
        k: 'eq',
        l: 'Shareholder equity',
        type: 'number'
      }, {
        k: 'div',
        l: 'Divestment proceeds',
        type: 'number'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Indicative', 'Draft', 'Approved']
      }],
      cols: [['t', 'Year'], ['req', 'Requirement', 'm'], ['ocf', 'Operating cash', 'm'], ['debt', 'New debt', 'm'], ['eq', 'Equity', 'm'], ['div', 'Divestments', 'm'], ['gap', 'Gap', 'gap'], ['status', 'Status', 'status']],
      noOverdue: 1,
      calc: r => {
        ['req', 'ocf', 'debt', 'eq', 'div'].forEach(k => r[k] = +r[k] || 0);
        r.gap = r.req - (r.ocf + r.debt + r.eq + r.div);
      },
      rows: FUND.map(f => ({
        t: f.y,
        req: f.req,
        ocf: f.ocf,
        debt: f.debt,
        eq: f.eq,
        div: f.div,
        status: f.st
      }))
    },
    target: {
      n: 'Portfolio Target Tracker',
      d: 'Long-term portfolio targets against the 2030 ambition',
      fields: [{
        k: 't',
        l: 'Target',
        req: 1,
        full: 1
      }, {
        k: 'base',
        l: '2025 baseline'
      }, {
        k: 'tgt26',
        l: '2026 target'
      }, {
        k: 'fc26',
        l: '2026 forecast'
      }, {
        k: 'tgt30',
        l: '2030 target'
      }, {
        k: 'dept',
        l: 'Owner',
        type: 'select',
        o: DEPTS
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['On track', 'Behind', 'At risk']
      }],
      cols: [['t', 'Target'], ['base', '2025'], ['tgt26', '2026 target'], ['fc26', '2026 forecast'], ['tgt30', '2030 target'], ['dept', 'Owner'], ['status', 'Status', 'status']],
      noOverdue: 1,
      rows: [['Portfolio revenue', '231.4m', '262.0m', '249.8m', '455.0m', 'Asset Management', 'Behind'], ['EBITDA margin', '11.0%', '13.2%', '12.0%', '18.0%', 'Asset Management', 'Behind'], ['Operating portfolio companies', '14', '15', '14', '20', 'Investment', 'At risk'], ['Return on invested capital', '3.8%', '4.5%', '4.2%', '9.0%', 'Strategy', 'Behind'], ['New investments reaching FID', '1', '2', '1', '8 (cumulative)', 'Investment', 'At risk'], ['Protein production capacity (000 tonnes)', '142', '150', '151', '220', 'Asset Management', 'On track'], ['First dividend to the shareholder', '—', '—', '—', 'From 2029', 'Strategy', 'On track']].map(r => ({
        t: r[0],
        base: r[1],
        tgt26: r[2],
        fc26: r[3],
        tgt30: r[4],
        dept: r[5],
        status: r[6]
      }))
    },
    actions: {
      n: 'Strategy Actions / Interventions / Tasks Tracker',
      d: 'Strategy Division actions, interventions and tasks',
      fields: [{
        k: 'kind',
        l: 'Type',
        type: 'select',
        o: ['Action', 'Intervention', 'Task']
      }, {
        k: 'rel',
        l: 'Related to',
        type: 'select',
        o: ['Board / EC', 'Shareholder', 'Executives', 'Subsidiaries', 'Budget and planning', 'Other']
      }, {
        k: 't',
        l: 'Description',
        req: 1,
        full: 1
      }, {
        k: 'owner',
        l: 'Owner'
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Not started', 'In progress', 'Completed']
      }, {
        k: 'next',
        l: 'Next step',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Description'], ['kind', 'Type'], ['rel', 'Related to'], ['owner', 'Owner'], ['date', 'Due', 'date'], ['status', 'Status', 'status']],
      rows: [['EC paper on Group ERP vendor options (decision INT-004)', 'Action', 'Board / EC', 'Strategy Manager', '2026-09-18', 'In progress'], ['Recovery plan for the Subsidiary D delay, with the PMO', 'Intervention', 'Subsidiaries', 'CIO', '2026-09-25', 'In progress'], ['Issue 2027 budget guidelines and assumptions', 'Task', 'Budget and planning', 'Head of Strategy', '2026-09-30', 'In progress'], ['Refresh five-year plan macro assumptions', 'Task', 'Budget and planning', 'Strategy Analyst', '2026-09-30', 'In progress'], ['Q3 corporate KPI data collection', 'Task', 'Executives', 'Performance Analyst', '2026-10-12', 'Not started'], ['Portfolio review: future of Subsidiaries K and N', 'Intervention', 'Subsidiaries', 'Head of Strategy', '2026-10-20', 'Not started'], ['Update the funding plan for the 2027 capital call', 'Task', 'Shareholder', 'Strategy Manager', '2026-10-30', 'In progress'], ['Q3 shareholder performance report', 'Task', 'Shareholder', 'Head of Strategy', '2026-10-31', 'Not started'], ['Board strategy session materials', 'Action', 'Board / EC', 'Head of Strategy', '2026-11-10', 'Not started'], ['Mid-year strategy review with the CEO', 'Task', 'Executives', 'Head of Strategy', '2026-07-30', 'Completed']].map(r => ({
        t: r[0],
        kind: r[1],
        rel: r[2],
        owner: r[3],
        date: r[4],
        status: r[5]
      }))
    },
    kpi: {
      n: 'OFC Corporate KPIs Tracker',
      d: 'The 12 strategic KPIs in the corporate balanced scorecard · YTD Aug 2026',
      fields: [{
        k: 't',
        l: 'KPI',
        req: 1,
        full: 1
      }, {
        k: 'persp',
        l: 'Perspective',
        type: 'select',
        o: ['Financial', 'Portfolio & stakeholders', 'Internal processes', 'Learning & growth']
      }, {
        k: 'dept',
        l: 'Owner',
        type: 'select',
        o: DEPTS
      }, {
        k: 'target',
        l: 'Target'
      }, {
        k: 'actual',
        l: 'Actual'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Exceptional', 'Above Target', 'Target', 'Below Target', 'Not started']
      }, {
        k: 'next',
        l: 'Commentary',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'KPI'], ['persp', 'Perspective'], ['dept', 'Owner'], ['target', 'Target'], ['actual', 'Actual'], ['status', 'Status', 'kpi']],
      noOverdue: 1,
      rows: [['Revenue growth on last year', 'Financial', 'Finance', '5.0%', '7.4%', 'Exceptional', 'Growth from Subsidiaries A and F'], ['Revenue against budget', 'Financial', 'Finance', '100%', '95.1%', 'Below Target', 'Volume shortfall at K, E and B'], ['EBITDA margin', 'Financial', 'Finance', '13.1%', '12.1%', 'Below Target', 'Feed costs at poultry operations'], ['Net profit against budget', 'Financial', 'Finance', '8.9m', '6.2m', 'Below Target', 'EBITDA shortfall and higher finance costs'], ['Net debt / EBITDA', 'Financial', 'Treasury', '4.50x or lower', '4.69x', 'Below Target', 'Covenant limit is 5.00x'], ['Portfolio companies meeting revenue budget', 'Portfolio & stakeholders', 'Asset Management', '10 of 14', '2 of 14', 'Below Target', 'Only F and L ahead of budget'], ['Local protein production growth', 'Portfolio & stakeholders', 'Asset Management', '8.0%', '12.0%', 'Exceptional', 'Capacity additions at A and B'], ['Shareholder reports submitted on time', 'Portfolio & stakeholders', 'Strategy', '3 of 3', '3 of 3', 'Target', ''], ['New opportunities screened', 'Internal processes', 'Investment', '12', '19', 'Exceptional', 'Strong origination pipeline'], ['Stage-gate decisions within agreed time', 'Internal processes', 'Investment', '90%', '91%', 'Target', ''], ['Internal audit plan completion', 'Internal processes', 'Internal Audit', '70%', '78%', 'Above Target', ''], ['Employee engagement score', 'Learning & growth', 'Corporate Support', '75', '—', 'Not started', 'Survey runs in November']].map(r => ({
        t: r[0],
        persp: r[1],
        dept: r[2],
        target: r[3],
        actual: r[4],
        status: r[5],
        next: r[6]
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
      _local: r.id
    }));
    /* initiatives added on the Corporate page also appear here */
    const corp = key === 'init' ? CLOCAL.filter(r => r.reg === 'Initiatives').map(r => ({
      t: r.t,
      dept: r.dept,
      owner: r.by || '—',
      date: r.date,
      status: r.s === 'Closed' ? 'Completed' : r.s === 'Escalated' ? 'At risk' : 'On track',
      _corp: 1
    })) : [];
    return [...local, ...corp, ...T.rows].map(r => {
      const o = {
        ...r
      };
      if (T.calc) T.calc(o);
      o.overdue = !!(!T.noOverdue && o.date && !DONE.has(o.status) && daysLate(o.date) > 0);
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
  const OKS = new Set(['Completed', 'Approved', 'Submitted', 'On track', 'Achieved', 'Aligned']);
  const BAD = new Set(['Delayed', 'Behind', 'Escalated']);
  const NEU = new Set(['Not started', 'Indicative', 'Draft', 'Planned']);
  function pill(s) {
    const c = OKS.has(s) ? 'ok' : BAD.has(s) ? 'esc' : NEU.has(s) ? 'neu' : 'pend';
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
    pstrat: 'Portfolio Strategy',
    bpd: 'Business Plan (5 years)',
    bva: 'Budget vs Actual',
    fcp: 'Funding and Capital Planning',
    gov: 'Governance & Shareholder',
    acts: 'Strategy Interventions, Actions & Tasks',
    kpid: 'Corporate KPIs',
    'rep-exec': 'Executive Strategy Report',
    'rep-review': 'Portfolio Strategy Review / Updates',
    'rep-funding': 'Funding Requirement Report',
    'rep-kpi': 'Executive Corporate KPI Performance Report',
    'rep-bp': '5-Year Business Plan & Strategy Report'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['pstrat', 'bpd', 'bva', 'fcp', 'gov', 'acts', 'kpid'];
  const REPS = ['rep-exec', 'rep-review', 'rep-funding', 'rep-kpi', 'rep-bp'];
  let view = 'home',
    param = '';
  function section(v) {
    return v === 'home' ? 'home' : v.startsWith('trk-') ? 'input' : v.startsWith('rep-') ? 'reports' : 'dashboards';
  }
  function go(v, push = true) {
    const [b, p] = String(v).split('|');
    view = VIEWS[b] ? b : 'home';
    param = p || '';
    const h = view + (param ? '|' + param : '');
    if (push && decodeURIComponent(location.hash.slice(1)) !== h) history.pushState(null, '', '#' + h);
    hidePane();
    closeSheet();
    render();
    window.scrollTo({
      top: 0
    });
  }
  scope.listen(window, 'popstate', () => {
    const [b, p] = decodeURIComponent(location.hash.slice(1) || 'home').split('|');
    view = VIEWS[b] ? b : 'home';
    param = p || '';
    hidePane();
    closeSheet();
    render();
  });
  const vh = (t, d, actions = '') => `<div class="vh"><div><h2>${t}</h2>${d ? `<p>${d}</p>` : ''}</div><div class="vh-actions noprint">${actions}</div></div>`;
  const exportBtn = `<button class="btn ghost sm" data-export>${ico.dl}Export CSV</button>`;
  const printBtn = `<button class="btn ghost sm" data-print>${ico.print}Print / PDF</button>`;
  const m1 = v => (+v).toFixed(1),
    pc = (a, b) => a / b * 100;
  const hbar = (l, v, max, fill, val) => `<div class="hb"><span>${l}</span><span class="tr"><span class="fl" style="width:${Math.max(0, v / max * 100)}%;${fill ? `background:${fill}` : ''}"></span></span><span class="v">${val ?? m1(v)}</span></div>`;
  const progBar = p => `<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;height:8px;border-radius:4px;background:var(--line-2);overflow:hidden;min-width:70px"><span style="display:block;height:100%;width:${Math.min(100, +p || 0)}%;background:#A1C364"></span></span><span class="num" style="font-size:12px;width:34px;text-align:right">${(+p || 0).toFixed(0)}%</span></div>`;
  const kpiPill = s => `<span class="pill" style="background:${s === 'Target' ? '#E3E8E2' : s === 'Below Target' ? 'var(--peach)' : s === 'Not started' ? '#EEF0EC' : 'var(--pill)'};color:${s === 'Target' ? '#344B37' : s === 'Below Target' ? 'var(--peach-ink)' : s === 'Not started' ? 'var(--ink-2)' : 'var(--pill-ink)'}"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${KPI_C[s]};margin-right:6px"></i>${escH(s)}</span>`;
  function donut(size = 170) {
    const K = trkRows('kpi'),
      tot = K.length,
      r = 15.915;
    let off = 0;
    const segs = KPI_ST.map(([k, c]) => {
      const n = K.filter(x => x.status === k).length;
      const p = n / tot * 100;
      const e = n ? `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="${p - .8} ${100 - p + .8}" stroke-dashoffset="${-off}"/>` : '';
      off += p;
      return e;
    }).join('');
    const leg = KPI_ST.map(([k, c]) => {
      const n = K.filter(x => x.status === k).length;
      return `<li><i style="background:${c}"></i><span>${k}</span><span class="n num">${n}</span><span class="p num">${Math.round(n / tot * 100)}%</span></li>`;
    }).join('');
    return `<div style="display:grid;grid-template-columns:${size}px 1fr;gap:22px;align-items:center" class="dn"><div class="donut" style="position:relative;width:${size}px;height:${size}px"><svg viewBox="0 0 42 42" style="width:100%;height:100%;transform:rotate(-90deg)">${segs}</svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><b class="num" style="display:block;font-size:34px;font-weight:300;line-height:1">${tot}</b><span style="font-size:12px;color:var(--ink-2)">KPIs</span></div></div></div><ul class="legend" style="list-style:none;margin:0;padding:0">${leg}</ul></div>`;
  }
  function render() {
    $('#crumbView').innerHTML = view === 'home' ? '' : `<span class="sep">/</span><span>${escH(VIEWS[view])}</span>`;
    document.title = `${VIEWS[view]} · ${APP_NAME} · Oman Food Capital`;
    syncRail();
    refreshBadge();
    const el = $('#view');
    if (!role.apps.includes(APP_ID)) {
      el.innerHTML = `<div class="noaccess"><h2>You don't have access to ${APP_NAME}</h2><p>${escH(role.n)} can't open this app. Switch role from your profile picture, or return to Corporate.</p><a class="btn" style="display:inline-flex;align-items:center;text-decoration:none" href="/corporate">Back to Corporate</a></div>`;
      return;
    }
    const V = {
      home: vHome,
      pstrat: vPStrat,
      bpd: vBP,
      bva: vBvA,
      fcp: vFCP,
      gov: vGov,
      acts: vActs,
      kpid: vKPI
    };
    if (V[view]) el.innerHTML = V[view]();else if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
    } else el.innerHTML = vRep(view);
  }

  /* ---- Shared pieces ---- */
  function initList() {
    return trkRows('init').map(r => `<li><span style="flex:1;min-width:0">${escH(r.t)}${r._corp ? '<span class="newtag">New</span>' : ''}<small>${escH(r.dept)} · target ${fmtDate(r.date)}${r.value ? ` · ${m1(r.value)}m a year` : ''}</small><span style="display:block;margin-top:6px">${progBar(r.prog)}</span></span>${pill(r.status)}</li>`).join('');
  }
  function warnings() {
    const k = trkRows('kpi').filter(r => r.status === 'Below Target'),
      i = trkRows('init').filter(r => ['At risk', 'Delayed'].includes(r.status));
    return [{
      t: `2026 revenue forecast of ${m1(F26.rev)}m is ${m1((1 - F26.rev / BP.rev[1]) * 100)}% below the business plan`,
      m: `Reaching the 2027 plan of ${m1(BP.rev[2])}m would need ${m1((BP.rev[2] / F26.rev - 1) * 100)}% growth next year`,
      v: 'bpd'
    }, {
      t: `EBITDA margin of 12.1% is below the ${m1(BP.eb[1] / BP.rev[1] * 100)}% plan path`,
      m: 'Feed costs and volume shortfalls at three subsidiaries',
      v: 'bva'
    }, {
      t: `${i.length} of ${trkRows('init').length} strategic initiatives are off track`,
      m: i.map(x => `${x.t} (${x.status.toLowerCase()})`).join(' · '),
      v: 'trk-init'
    }, {
      t: 'Net debt / EBITDA at 4.69x limits new debt in the 2027 funding plan',
      m: 'Covenant limit 5.00x · the plan assumes 25.0m of new debt in 2027',
      v: 'fcp'
    }, {
      t: `${k.length} of 12 corporate KPIs are below target`,
      m: k.map(x => x.t).slice(0, 3).join(' · ') + (k.length > 3 ? ' …' : ''),
      v: 'kpid'
    }];
  }
  const warnList = ws => `<ul class="att">${ws.map(a => `<li><button data-go="${a.v}"><span class="ic">${ico.warn}</span><span><div class="t">${escH(a.t)}</div><div class="m">${escH(a.m)}</div></span><span></span>${chev}</button></li>`).join('')}</ul>`;

  /* ---- Home ---- */
  function vHome() {
    const K = trkRows('kpi'),
      below = K.filter(r => r.status === 'Below Target').length,
      I = trkRows('init'),
      onI = I.filter(r => r.status === 'On track' || r.status === 'Completed').length;
    const B = trkRows('bp'),
      bpP = B.reduce((a, r) => a + (+r.prog || 0), 0) / B.length,
      Bu = trkRows('budget').filter(r => r.date >= '2026-06'),
      bu = Bu.filter(r => DONE.has(r.status)).length;
    const A = trkRows('actions'),
      od = A.filter(r => r.overdue);
    const up = [...trkRows('actions').filter(r => !DONE.has(r.status)).map(r => ({
      d: r.date,
      t: r.t,
      m: `${r.kind} · ${r.owner}`,
      v: 'trk-actions',
      o: r.overdue
    })), ...Bu.filter(r => !DONE.has(r.status)).map(r => ({
      d: r.date,
      t: r.t,
      m: `2027 budget · ${r.owner}`,
      v: 'trk-budget'
    })), ...B.filter(r => !DONE.has(r.status)).map(r => ({
      d: r.date,
      t: r.t,
      m: `Business plan · ${r.owner}`,
      v: 'trk-bp'
    }))].sort((a, b) => a.d.localeCompare(b.d)).filter(x => -daysLate(x.d) <= 45).slice(0, 7);
    return `<div class="stack">${vh('Overview', 'Strategy Division · corporate performance, strategic initiatives and the planning cycle')}
  <div class="kpi5">
    <button class="kc" data-go="kpid"><span class="lbl">Corporate performance</span><span class="val num">${BSC}<small>%</small></span><span class="ctx">Corporate BSC · 12 strategic KPIs · <span class="pill" style="height:20px">Target</span></span><span class="go">Corporate KPIs ↗</span></button>
    <button class="kc peach" data-go="kpid"><span class="lbl">KPIs below target</span><span class="val num">${below}<small>of ${K.length}</small></span><span class="ctx">All five in the financial and portfolio areas</span><span class="go">Corporate KPIs ↗</span></button>
    <button class="kc" data-go="trk-init"><span class="lbl">Strategic initiatives</span><span class="val num">${I.length}</span><span class="ctx">${onI} on track · ${I.length - onI} off track</span><span class="go">Initiatives Tracker ↗</span></button>
    <button class="kc" data-go="trk-bp"><span class="lbl">2027–2031 business plan</span><span class="val num">${Math.round(bpP)}<small>%</small></span><span class="ctx">Board approval 17 Dec 2026</span><span class="go">Business Plan Tracker ↗</span></button>
    <button class="kc mint" data-go="trk-budget"><span class="lbl">2027 budget cycle</span><span class="val num">${bu}<small>of ${Bu.length} milestones</small></span><span class="ctx">Guidelines due 30 Sep</span><span class="go">Annual Budget Tracker ↗</span></button>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Strategic initiatives</h2><p>Progress and status</p></div><button class="see" data-go="trk-init">Tracker ↗</button></div><ul class="mini-list">${initList()}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Scorecard balance</h2><p>How the 12 strategic KPIs are performing</p></div><button class="see" data-go="kpid">All KPIs ↗</button></div>${donut(150)}</section>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Coming up</h2><p>Next 45 days · actions, 2027 budget and business plan</p></div></div>
      <ul class="att">${up.map(x => `<li><button data-go="${x.v}"><span class="ic${x.o ? '' : ' soft'}">${x.o ? ico.warn : ico.clock}</span><span><div class="t">${escH(x.t)}</div><div class="m">${escH(x.m)} · ${x.o ? `<span class="neg">${daysLate(x.d)} days overdue</span>` : 'due ' + fmtDate(x.d)}</div></span><span></span>${chev}</button></li>`).join('')}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Early warnings</h2><p>Drafted by OFC AI</p></div><button class="see" data-go="pstrat">Portfolio Strategy ↗</button></div>${warnList(warnings().slice(0, 4))}</section>
  </div></div>`;
  }

  /* ---- Dashboards ---- */
  function vPStrat() {
    const T = trkRows('target'),
      F = FUND,
      req = F.reduce((a, f) => a + f.req, 0),
      src = F.reduce((a, f) => a + f.src, 0);
    const pathRev = colsChart(YRS, [{
      name: 'Business plan',
      kind: 'bar',
      v: BP.rev,
      fill: 'url(#hatchS)'
    }, {
      name: 'Actual / forecast',
      kind: 'line',
      v: [BP.rev[0], F26.rev, null, null, null, null].map((v, i) => v ?? BP.rev[i]),
      stroke: '#344B37'
    }], {
      aria: 'Revenue path to 2030'
    });
    return `<div class="stack">${vh('Portfolio Strategy', 'Long-term strategy execution · the CIO view from the deck', printBtn)}
  <div class="kpi5">
    <div class="kc"><span class="lbl">Corporate performance</span><span class="val num">${BSC}<small>%</small></span><span class="ctx">Corporate BSC · on target</span></div>
    <div class="kc peach"><span class="lbl">2026 revenue vs plan</span><span class="val num">${m1(F26.rev)}<small>m</small></span><span class="ctx">Plan ${m1(BP.rev[1])}m · <span class="neg">${m1((F26.rev / BP.rev[1] - 1) * 100)}%</span></span></div>
    <div class="kc"><span class="lbl">2030 revenue ambition</span><span class="val num">${m1(BP.rev[5])}<small>m</small></span><span class="ctx">${m1((Math.pow(BP.rev[5] / F26.rev, 1 / 4) - 1) * 100)}% a year needed from 2026</span></div>
    <div class="kc"><span class="lbl">Portfolio targets on track</span><span class="val num">${T.filter(r => r.status === 'On track').length}<small>of ${T.length}</small></span><span class="ctx">${T.filter(r => r.status === 'Behind').length} behind · ${T.filter(r => r.status === 'At risk').length} at risk</span></div>
    <div class="kc"><span class="lbl">Five-year funding need</span><span class="val num">${m1(req)}<small>m</small></span><span class="ctx">Gap of ${m1(req - src)}m on current sources</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Revenue path to 2030</h2><p>Business plan vs actual and forecast, OMR m</p></div><button class="see" data-go="bpd">Business Plan ↗</button></div>
      <div class="legend-s"><span><i style="background:#B7C997"></i>Business plan</span><span><i class="line" style="background:#344B37"></i>2025 actual, 2026 forecast, then plan</span></div>${pathRev}</section>
    <section class="wp"><div class="wp-h"><div><h2>Early warnings</h2><p>Drafted by OFC AI</p></div></div>${warnList(warnings())}</section>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Portfolio targets</h2><p>2026 and the 2030 ambition</p></div><button class="see" data-go="trk-target">Tracker ↗</button></div>
      <div class="tscroll"><table class="ttbl"><thead><tr><th>Target</th><th>2025</th><th>2026 target</th><th>2026 forecast</th><th>2030</th><th>Status</th></tr></thead><tbody>${T.map(r => `<tr><td>${escH(r.t)}</td><td class="nw num">${escH(r.base)}</td><td class="nw num">${escH(r.tgt26)}</td><td class="nw num">${escH(r.fc26)}</td><td class="nw num">${escH(r.tgt30)}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="wp"><div class="wp-h"><div><h2>Strategic priorities</h2><p>Initiatives and value creation</p></div><button class="see" data-go="trk-init">Tracker ↗</button></div><ul class="mini-list">${initList()}</ul></section>
  </div>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Corporate KPIs</h2><p>12 strategic KPIs</p></div><button class="see" data-go="kpid">Corporate KPIs ↗</button></div>${donut(150)}</section>
    <section class="wp"><div class="wp-h"><div><h2>Annual budget alignment</h2><p>Budget against the business plan, OMR m</p></div><button class="see" data-go="bva">Budget vs Actual ↗</button></div>
      <ul class="mini-list"><li><span>2026 budget revenue<small>Business plan 262.0m · budget set equal to the plan</small></span><span class="pill ok">Aligned</span></li><li><span>2026 full-year forecast<small>${m1(F26.rev)}m revenue · ${m1(F26.eb)}m EBITDA</small></span><span class="pill esc">Below plan</span></li><li><span>2027 budget<small>Plan 305.0m · guidelines due 30 Sep</small></span><span class="pill pend">In progress</span></li></ul></section>
  </div></div>`;
  }
  function vBP() {
    const mg = BP.rev.map((r, i) => BP.eb[i] / r * 100);
    return `<div class="stack">${vh('Business Plan (5 years)', '2026–2030 business plan against 2025 actual and the 2026 forecast · OMR m', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">2030 revenue</span><span class="val num">${m1(BP.rev[5])}<small>m</small></span><span class="ctx">${m1((Math.pow(BP.rev[5] / BP.rev[0], 1 / 5) - 1) * 100)}% a year from 2025</span></div>
    <div class="kc"><span class="lbl">2030 EBITDA</span><span class="val num">${m1(BP.eb[5])}<small>m</small></span><span class="ctx">${m1(mg[5])}% margin, from ${m1(mg[0])}% in 2025</span></div>
    <div class="kc"><span class="lbl">Capex and new investment</span><span class="val num">${m1(BP.capex.slice(1).reduce((a, b) => a + b, 0) + BP.newinv.reduce((a, b) => a + b, 0))}<small>m</small></span><span class="ctx">2026–2030 total</span></div>
    <div class="kc peach"><span class="lbl">2026 forecast vs plan</span><span class="val num">${m1(F26.rev - BP.rev[1])}<small>m</small></span><span class="ctx">Revenue · EBITDA ${m1(F26.eb - BP.eb[1])}m</span></div>
  </div>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Revenue</h2><p>OMR m</p></div></div>${colsChart(YRS, [{
      name: 'Business plan',
      kind: 'bar',
      v: BP.rev,
      fill: 'url(#hatchG)'
    }], {
      labels: 1
    })}</section>
    <section class="wp"><div class="wp-h"><div><h2>EBITDA</h2><p>OMR m</p></div></div>${colsChart(YRS, [{
      name: 'Business plan',
      kind: 'bar',
      v: BP.eb,
      fill: 'url(#hatchS)'
    }], {
      labels: 1
    })}</section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Plan summary</h2><p>2025 is actual; 2026 shows plan with the forecast alongside</p></div><button class="see" data-go="trk-bp">2027–2031 refresh ↗</button></div>
    <div class="tscroll"><table class="stmt"><thead><tr><th>OMR m</th><th>2025 actual</th><th>2026 plan</th><th>2026 forecast</th><th>2027</th><th>2028</th><th>2029</th><th>2030</th></tr></thead><tbody>
      <tr><td>Revenue</td><td>${m1(BP.rev[0])}</td><td>${m1(BP.rev[1])}</td><td class="neg">${m1(F26.rev)}</td>${BP.rev.slice(2).map(v => `<td>${m1(v)}</td>`).join('')}</tr>
      <tr><td>EBITDA</td><td>${m1(BP.eb[0])}</td><td>${m1(BP.eb[1])}</td><td class="neg">${m1(F26.eb)}</td>${BP.eb.slice(2).map(v => `<td>${m1(v)}</td>`).join('')}</tr>
      <tr><td>EBITDA margin</td><td>${m1(mg[0])}%</td><td>${m1(mg[1])}%</td><td class="neg">${m1(F26.eb / F26.rev * 100)}%</td>${mg.slice(2).map(v => `<td>${m1(v)}%</td>`).join('')}</tr>
      <tr><td>Capital expenditure</td><td>${m1(BP.capex[0])}</td><td>${m1(BP.capex[1])}</td><td>34.8</td>${BP.capex.slice(2).map(v => `<td>${m1(v)}</td>`).join('')}</tr>
      <tr><td>New investments</td><td>—</td><td>—</td><td>—</td>${BP.newinv.slice(2).map(v => `<td>${m1(v)}</td>`).join('')}</tr>
      <tr class="sub"><td>Operating portfolio companies</td><td>${BP.ops[0]}</td><td>${BP.ops[1]}</td><td class="neg">${F26.ops}</td>${BP.ops.slice(2).map(v => `<td>${v}</td>`).join('')}</tr></tbody></table></div></section></div>`;
  }
  function vBvA() {
    const k = (l, a, b) => {
      const v = (a / b - 1) * 100;
      return `<div class="kc"><span class="lbl">${l}</span><span class="val num">${m1(a)}<small>m</small></span><span class="ctx">Budget ${m1(b)}m · <span class="${v >= 0 ? 'pos' : 'neg'}">${v >= 0 ? '+' : ''}${m1(v)}%</span></span></div>`;
    };
    const sv = SUBV.map(s => ({
        n: 'Subsidiary ' + s[0],
        a: s[1],
        b: s[2],
        d: s[1] - s[2]
      })).sort((a, b) => a.d - b.d),
      mx = Math.max(...sv.map(s => Math.abs(s.d)));
    return `<div class="stack">${vh('Budget vs Actual', '2026 year to date (August) and full-year forecast · OMR m', printBtn + `<a class="btn ghost sm" style="text-decoration:none" href="/finance#pl">Full P&amp;L in Finance &amp; Accounts ↗</a>`)}
  <div class="kpi4">${k('Revenue YTD', ...YTD.rev)}${k('EBITDA YTD', ...YTD.eb)}${k('Net profit YTD', ...YTD.np)}${k('Capex YTD', ...YTD.capex)}</div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Monthly revenue</h2><p>Actual vs budget, OMR m</p></div></div><div class="legend-s"><span><i style="background:#A1C364"></i>Actual</span><span><i class="line" style="background:#344B37"></i>Budget</span></div>${colsChart(MON.slice(0, 8), [{
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
    <section class="wp"><div class="wp-h"><div><h2>Full-year view</h2><p>2026 budget vs forecast, OMR m</p></div></div>
      <ul class="mini-list"><li><span>Revenue<small>Budget ${m1(BP.rev[1])} · forecast ${m1(F26.rev)}</small></span><span class="neg num">${m1(F26.rev - BP.rev[1])}</span></li><li><span>EBITDA<small>Budget ${m1(BP.eb[1])} · forecast ${m1(F26.eb)}</small></span><span class="neg num">${m1(F26.eb - BP.eb[1])}</span></li><li><span>Capital expenditure<small>Budget 36.0 · forecast 34.8</small></span><span class="pos num">-1.2</span></li><li><span>Operating companies<small>Budget 15 · forecast 14 (Subsidiary D to 2027)</small></span><span class="neg num">-1</span></li></ul></section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Revenue variance by subsidiary</h2><p>YTD actual less budget, OMR m</p></div><a class="see" style="text-decoration:none" href="/finance#subs">Subsidiary performance ↗</a></div>
    <div class="grid-eq">${[sv.slice(0, 7), sv.slice(7)].map(col => `<div>${col.map(s => `<div class="hb"><span>${s.n}</span><span class="tr"><span class="fl ${s.d < 0 ? 'below' : ''}" style="width:${Math.abs(s.d) / mx * 100}%"></span></span><span class="v ${s.d < 0 ? 'neg' : 'pos'}">${s.d > 0 ? '+' : ''}${m1(s.d)}</span></div>`).join('')}</div>`).join('')}</div></section></div>`;
  }
  function vFCP() {
    const F = trkRows('fund'),
      req = F.reduce((a, f) => a + f.req, 0),
      eq = F.reduce((a, f) => a + f.eq, 0),
      gap = F.reduce((a, f) => a + f.gap, 0);
    const labels = F.map(f => f.t);
    return `<div class="stack">${vh('Funding and Capital Planning', 'Five-year funding requirement and sources · OMR m', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Funding requirement 2026–2030</span><span class="val num">${m1(req)}<small>m</small></span><span class="ctx">Capex, new investments and debt repayments</span></div>
    <div class="kc"><span class="lbl">Shareholder equity needed</span><span class="val num">${m1(eq)}<small>m</small></span><span class="ctx">Of which 12.0m requested for 2026</span></div>
    <div class="kc peach"><span class="lbl">Unfunded gap</span><span class="val num">${m1(gap)}<small>m</small></span><span class="ctx">Largest in 2028</span></div>
    <div class="kc"><span class="lbl">Divestment proceeds</span><span class="val num">14.0<small>m</small></span><span class="ctx">AAAID stake, planned 2027</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Requirement vs sources by year</h2><p>OMR m</p></div><button class="see" data-go="rep-funding">Funding report ↗</button></div>
    <div class="legend-s"><span><i style="background:#F3BD7A"></i>Requirement</span><span><i style="background:#A1C364"></i>Identified sources</span></div>
    ${colsChart(labels, [{
      name: 'Requirement',
      kind: 'bar',
      v: F.map(f => f.req),
      fill: '#F3BD7A'
    }, {
      name: 'Sources',
      kind: 'bar',
      v: F.map(f => f.ocf + f.debt + f.eq + f.div),
      fill: 'url(#hatchG)'
    }], {
      labels: 1,
      h: 300,
      w: 1100
    })}</section>
  <section class="wp"><div class="wp-h"><div><h2>Funding plan</h2><p>From the Funding Plan Tracker</p></div><button class="see" data-go="trk-fund">Tracker ↗</button></div>
    <div class="tscroll"><table class="stmt"><thead><tr><th>OMR m</th>${labels.map(l => `<th>${l}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    ${[['Capital expenditure', 'capex'], ['New investments', 'inv'], ['Debt repayments', 'rep']].map(([l, k]) => `<tr class="ind"><td>${l}</td>${FUND.map(f => `<td>${m1(f[k])}</td>`).join('')}<td>${m1(FUND.reduce((a, f) => a + f[k], 0))}</td></tr>`).join('')}
    <tr class="sub"><td>Funding requirement</td>${F.map(f => `<td>${m1(f.req)}</td>`).join('')}<td>${m1(req)}</td></tr>
    ${[['Operating cash flow', 'ocf'], ['New debt', 'debt'], ['Shareholder equity', 'eq'], ['Divestment proceeds', 'div']].map(([l, k]) => `<tr class="ind"><td>${l}</td>${F.map(f => `<td>${f[k] ? m1(f[k]) : '—'}</td>`).join('')}<td>${m1(F.reduce((a, f) => a + f[k], 0))}</td></tr>`).join('')}
    <tr class="total"><td>Gap / (surplus)</td>${F.map(f => `<td class="${f.gap > 0 ? 'neg' : 'pos'}">${f1(f.gap)}</td>`).join('')}<td class="neg">${m1(gap)}</td></tr></tbody></table></div>
    <p class="src">2026 ties to Treasury: 12.0m capital call pending, 28.0m of drawdowns including Facility C tranche 2. <a class="see" style="text-decoration:none" href="/treasury#fund">Treasury funding view ↗</a></p></section></div>`;
  }
  function vGov() {
    const dec = [...DECISIONS, ...CLOCAL.filter(r => r.reg === 'Decisions').map(r => ({
      id: r.id,
      t: r.t,
      dept: r.dept,
      by: r.by || '—',
      forum: r.forum || '—',
      date: r.date,
      s: r.s,
      local: 1
    }))].filter(d => d.s !== 'Closed');
    const esc = dec.filter(d => d.s === 'Escalated').length,
      late = dec.filter(d => d.date && daysLate(d.date) > 0).length;
    return `<div class="stack">${vh('Governance & Shareholder', 'Decisions awaiting forums, the governance calendar and shareholder reporting', printBtn)}
  <div class="kpi4">
    <div class="kc peach"><span class="lbl">Decisions required</span><span class="val num">${dec.length}</span><span class="ctx">${esc} escalated · ${dec.length - esc} pending</span></div>
    <div class="kc peach"><span class="lbl">Past decision date</span><span class="val num">${late}</span><span class="ctx">Of ${dec.length} open decisions</span></div>
    <div class="kc"><span class="lbl">Forums in the next 30 days</span><span class="val num">${MEETINGS.filter(m => -daysLate(m[0]) <= 30).length}</span><span class="ctx">Next: ${MEETINGS[0][1]}, ${fmtDate(MEETINGS[0][0])}</span></div>
    <div class="kc"><span class="lbl">Shareholder reports on time</span><span class="val num">3<small>of 3</small></span><span class="ctx">Q3 report due 31 Oct</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Decisions awaiting a forum</h2><p>From the Corporate decisions register</p></div><a class="see" style="text-decoration:none" href="/corporate">Corporate ↗</a></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Decision</th><th>Department</th><th>Raised by</th><th>Forum</th><th>Decision by</th><th>Status</th></tr></thead><tbody>${dec.sort((a, b) => (a.s === 'Escalated' ? 0 : 1) - (b.s === 'Escalated' ? 0 : 1)).map(d => `<tr><td>${escH(d.t)}${d.local ? '<span class="newtag">New</span>' : ''}<small style="display:block;color:var(--ink-3)">${escH(d.id)}</small></td><td class="nw">${escH(d.dept)}</td><td class="nw">${escH(d.by)}</td><td class="nw">${escH(d.forum)}</td><td class="nw">${fmtDate(d.date)}${d.date && daysLate(d.date) > 0 ? `<span class="od">${daysLate(d.date)}d late</span>` : ''}</td><td class="nw"><span class="pill ${d.s === 'Escalated' ? 'esc' : 'pend'}">${escH(d.s)}</span></td></tr>`).join('')}</tbody></table></div></section>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Governance calendar</h2><p>Board, committees and shareholder</p></div></div>
      <ul class="mini-list">${MEETINGS.map(m => `<li><span>${m[1]}<small>${m[2]}</small></span><span class="chip-s" style="height:24px">${fmtDate(m[0])}</span></li>`).join('')}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Shareholder reporting</h2></div></div>
      <ul class="mini-list">${SH_REPORTS.map(r => `<li><span>${r[0]}<small>Due ${fmtDate(r[1])}${r[2] ? ' · submitted ' + fmtDate(r[2]) : ''}</small></span>${pill(r[3])}</li>`).join('')}</ul></section>
  </div></div>`;
  }
  function vActs() {
    const A = trkRows('actions'),
      open = A.filter(r => !DONE.has(r.status)),
      od = A.filter(r => r.overdue),
      by = k => {
        const o = {};
        A.forEach(r => o[r[k]] = (o[r[k]] || 0) + 1);
        return Object.entries(o).sort((a, b) => b[1] - a[1]);
      };
    const own = {};
    open.forEach(r => own[r.owner] = (own[r.owner] || 0) + 1);
    const O = Object.entries(own).sort((a, b) => b[1] - a[1]);
    return `<div class="stack">${vh('Strategy Interventions, Actions & Tasks', 'Strategy Division workload and delivery', `<button class="btn sm" data-new="actions">${ico.plus}New entry</button>` + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Open items</span><span class="val num">${open.length}</span><span class="ctx">Of ${A.length} this year</span></div>
    <div class="kc peach"><span class="lbl">Overdue</span><span class="val num">${od.length}</span><span class="ctx">${od.map(r => r.t.split(' ').slice(0, 4).join(' ')).join(' · ') || 'None'}</span></div>
    <div class="kc"><span class="lbl">Due in the next 14 days</span><span class="val num">${open.filter(r => !r.overdue && -daysLate(r.date) <= 14).length}</span><span class="ctx">Budget guidelines and plan assumptions</span></div>
    <div class="kc"><span class="lbl">Interventions</span><span class="val num">${A.filter(r => r.kind === 'Intervention').length}</span><span class="ctx">Subsidiary D recovery · K and N review</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Open items</h2><p>Soonest first</p></div><button class="see" data-go="trk-actions">Tracker ↗</button></div>
      <ul class="att">${open.sort((a, b) => a.date.localeCompare(b.date)).map(r => `<li><button data-go="trk-actions"><span class="ic${r.overdue ? '' : ' soft'}">${r.overdue ? ico.warn : ico.clock}</span><span><div class="t">${escH(r.t)}</div><div class="m">${escH(r.kind)} · ${escH(r.owner)} · ${r.overdue ? `<span class="neg">${daysLate(r.date)} days overdue</span>` : 'due ' + fmtDate(r.date)}</div></span><span>${pill(r.status)}</span>${chev}</button></li>`).join('')}</ul></section>
    <div class="stack">
      <section class="wp"><div class="wp-h"><div><h2>By type</h2></div></div>${by('kind').map(([k, v]) => hbar(k, v, A.length, null, v)).join('')}</section>
      <section class="wp"><div class="wp-h"><div><h2>Open by owner</h2></div></div>${O.map(([k, v]) => hbar(k, v, O[0][1], null, v)).join('')}</section>
      <section class="wp"><div class="wp-h"><div><h2>By area</h2></div></div>${by('rel').map(([k, v]) => hbar(k, v, A.length, null, v)).join('')}</section>
    </div>
  </div></div>`;
  }
  function vKPI() {
    const K = trkRows('kpi'),
      P = ['Financial', 'Portfolio & stakeholders', 'Internal processes', 'Learning & growth'];
    return `<div class="stack">${vh('Corporate KPIs', 'Corporate balanced scorecard · YTD Aug 2026', exportBtn + printBtn)}
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Corporate performance</h2><p>Corporate BSC · reported score</p></div></div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><span class="num" style="font-size:56px;font-weight:300;letter-spacing:-1.5px;line-height:1">${BSC}%</span><span class="pill">Target</span></div>
      <h3 style="font-size:13px;font-weight:500;margin:4px 0 10px">Department BSC</h3>
      ${DEPT_BSC.map(d => `<div class="hb w"><span>${d[0]}</span><span class="tr"><span class="fl ${d[2] === 'Below Target' ? 'below' : ''}" style="width:${d[1]}%;${d[2] === 'Above Target' ? 'background:repeating-linear-gradient(135deg,#A1C364 0 2px,#B2D17E 2px 5px)' : ''}"></span></span><span class="v">${d[1]}% · ${d[2].replace(' Target', '')}</span></div>`).join('')}</section>
    <section class="wp"><div class="wp-h"><div><h2>Scorecard balance</h2><p>How the 12 strategic KPIs are performing</p></div></div>${donut(160)}</section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>All 12 KPIs</h2><p>By balanced scorecard perspective</p></div><button class="see" data-go="trk-kpi">KPI Tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>KPI</th><th>Owner</th><th>Target</th><th>Actual</th><th>Status</th><th>Commentary</th></tr></thead><tbody>${P.map(p => `<tr><td colspan="6" style="font-size:12px;color:var(--ink-2);font-weight:500;background:#FAFBF8">${p}</td></tr>` + K.filter(r => r.persp === p).map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.dept)}</td><td class="nw num">${escH(r.target)}</td><td class="nw num">${escH(r.actual)}</td><td class="nw">${kpiPill(r.status)}</td><td style="color:var(--ink-2)">${escH(r.next || '')}</td></tr>`).join('')).join('')}</tbody></table></div></section></div>`;
  }

  /* ---- Trackers ---- */
  let tState = {
    q: '',
    status: 'All',
    entity: 'All'
  };
  const entKeyOf = T => ['dept', 'owner', 'persp', 'kind'].find(k => T.cols.some(c => c[0] === k)) || null;
  function vTrk(key) {
    const T = TRK[key];
    tState = {
      q: param || '',
      status: 'All',
      entity: 'All'
    };
    const rows = trkRows(key),
      sts = [...new Set(rows.map(r => r.status))],
      ek = entKeyOf(T),
      ents = ek ? [...new Set(rows.map(r => r[ek]))] : [];
    const lab = {
      dept: 'departments',
      owner: 'owners',
      persp: 'perspectives',
      kind: 'types'
    }[ek];
    return `<div>${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">${ico.plus}New entry</button>` + exportBtn)}
  <section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker" value="${escH(tState.q)}">
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
    if (type === 'status') return `<td class="nw">${pill(v)}${r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''}</td>`;
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

  /* ---- AI reports ---- */
  function repHead(title, sub, sources, actions = '') {
    return `<div class="vh"><div><span class="ai-badge">${ico.spark}Drafted by OFC AI</span><h2 style="margin-top:10px">${title}</h2><p>${sub}</p><p class="src">Sources: <b>${sources}</b></p></div><div class="vh-actions noprint"><button class="btn ghost sm" data-regen>${ico.spark}Regenerate</button>${actions}${printBtn}<button class="btn sm" data-toast="Shared with the CIO for review.">Share</button></div></div>`;
  }
  function vRep(v) {
    const K = trkRows('kpi'),
      bel = K.filter(r => r.status === 'Below Target'),
      exc = K.filter(r => ['Exceptional', 'Above Target'].includes(r.status)),
      I = trkRows('init'),
      T = trkRows('target'),
      F = trkRows('fund');
    const req = F.reduce((a, f) => a + f.req, 0),
      gap = F.reduce((a, f) => a + f.gap, 0);
    let b = '';
    if (v === 'rep-exec') {
      b = repHead('Executive Strategy Report', 'FY2026 · issued at the start of the year, refreshed with results to August', 'Business plan, Corporate KPIs, Initiatives and Portfolio Target trackers') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">2026 is the first year of the plan to grow portfolio revenue to <b>${m1(BP.rev[5])}m</b> and EBITDA margin to <b>18%</b> by 2030. Eight months in, corporate performance stands at <b>${BSC}%</b> and on target, but the financial plan is behind: revenue is forecast at <b>${m1(F26.rev)}m</b> against a plan of ${m1(BP.rev[1])}m.</p>
    <h3>2026 strategic priorities</h3><ul class="pts">${I.map(i => `<li><b style="font-weight:600">${escH(i.t)}</b>: ${escH(i.status.toLowerCase())}, ${i.prog || 0}% complete${i.value ? `, worth about ${m1(i.value)}m a year` : ''}.</li>`).join('')}</ul>
    <h3>Targets for the year</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Target</th><th>2026 target</th><th>2026 forecast</th><th>Status</th></tr></thead><tbody>${T.slice(0, 6).map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.tgt26)}</td><td class="nw">${escH(r.fc26)}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div>
    <h3>Focus for the rest of the year</h3><ul class="pts"><li>Recover Subsidiary D's schedule so it becomes the 15th operating company in 2027.</li><li>Unblock the Group ERP vendor decision at the next Executive Committee.</li><li>Close the AAAID divestment and recycle the proceeds into the pipeline.</li><li>Lift the EBITDA margin through the value creation plans at the five largest subsidiaries.</li></ul></section>`;
    } else if (v === 'rep-review') {
      b = repHead('Portfolio Strategy Review / Updates', 'Q3 2026 update · periodic', 'Subsidiary performance, Portfolio Target Tracker, Initiatives, Funding Plan') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">The portfolio is growing (revenue up 7.4% on last year) but not fast enough for the plan. Growth is concentrated in a few companies: only <b>2 of 14</b> operating subsidiaries are ahead of their revenue budget.</p>
    <h3>Portfolio by role</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Role</th><th>Companies</th><th>Assessment</th></tr></thead><tbody>
      <tr><td class="nw">Core earners</td><td>A, B, C</td><td>45% of revenue. A and C near budget; B affected by lower prices.</td></tr>
      <tr><td class="nw">Growth</td><td>E, F, G, H, I</td><td>F ahead of budget; E and G held back by lower catch volumes.</td></tr>
      <tr><td class="nw">Under review</td><td>K, N</td><td>Both below budget and EBITDA negative. A review of their future is scheduled for 20 Oct.</td></tr>
      <tr><td class="nw">Build</td><td>D, P, Q</td><td>Not yet operating. D is delayed to 2027.</td></tr>
      <tr><td class="nw">Exit</td><td>AAAID stake</td><td>Divestment on track; price decision at the 30 Sep Divestment Committee.</td></tr></tbody></table></div>
    <h3>Recommendations</h3><ul class="pts"><li>Decide on Subsidiaries K and N before the 2027 budget is set, so their plans reflect the outcome.</li><li>Rebase the 2027 revenue plan for Subsidiary D's delay.</li><li>Prioritise pipeline deals that add EBITDA in 2027–2028 to close the gap to the 2030 ambition.</li></ul></section>`;
    } else if (v === 'rep-funding') {
      b = repHead('Funding Requirement Report', '2026–2030 · supports the 2027 shareholder funding request', 'Funding Plan Tracker, Business plan, Treasury funding view', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">The business plan needs <b>${m1(req)}m</b> of funding over five years. Identified sources leave a gap of <span class="neg"><b>${m1(gap)}m</b></span>, and shareholder equity of <b>${m1(F.reduce((a, f) => a + f.eq, 0))}m</b> is assumed, including <b>30.0m in 2027</b>.</p>
    ${colsChart(F.map(f => f.t), [{
        name: 'Requirement',
        kind: 'bar',
        v: F.map(f => f.req),
        fill: '#F3BD7A'
      }, {
        name: 'Sources',
        kind: 'bar',
        v: F.map(f => f.ocf + f.debt + f.eq + f.div),
        fill: 'url(#hatchG)'
      }], {
        labels: 1,
        h: 280,
        w: 1100
      })}
    <h3>The 2027 request</h3><ul class="pts"><li>2027 needs ${m1(F[1].req)}m: ${m1(FUND[1].capex)}m of capex, ${m1(FUND[1].inv)}m of new investments and ${m1(FUND[1].rep)}m of debt repayments.</li><li>Operating cash flow (${m1(F[1].ocf)}m), new debt (${m1(F[1].debt)}m) and the AAAID proceeds (${m1(F[1].div)}m) cover ${m1((F[1].ocf + F[1].debt + F[1].div) / F[1].req * 100)}%.</li><li>A shareholder contribution of 30.0m is requested for the remainder; ${m1(F[1].gap)}m is still unfunded.</li></ul>
    <h3>Constraints</h3><ul class="pts"><li>Net debt / EBITDA of 4.69x against a 5.00x covenant limits how much of the gap can be met with debt.</li><li>The 2026 capital call of 12.0m is still under shareholder review; delay would shift pressure into 2027.</li></ul></section>`;
    } else if (v === 'rep-kpi') {
      b = repHead('Executive Corporate KPI Performance Report', 'YTD August 2026', 'OFC Corporate KPIs Tracker, department balanced scorecards') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Corporate performance is <b>${BSC}%</b>, on target. <b>${exc.length}</b> KPIs are at or above target and <b>${bel.length}</b> are below; all ${bel.length} below-target KPIs are financial or portfolio measures.</p>
    ${donut(150)}
    <h3>Below target</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>KPI</th><th>Target</th><th>Actual</th><th>Why</th><th>Owner</th></tr></thead><tbody>${bel.map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.target)}</td><td class="nw neg">${escH(r.actual)}</td><td>${escH(r.next)}</td><td class="nw">${escH(r.dept)}</td></tr>`).join('')}</tbody></table></div>
    <h3>Strong performance</h3><ul class="pts">${exc.map(r => `<li>${escH(r.t)}: ${escH(r.actual)} against ${escH(r.target)}.</li>`).join('')}</ul>
    <h3>Departments</h3><ul class="pts"><li>Corporate Support (69%) is the only department below target, driven by the ERP delay.</li><li>Internal Audit (92%) and GRC (88%) lead.</li></ul></section>`;
    } else {
      const B = trkRows('bp'),
        p = B.reduce((a, r) => a + (+r.prog || 0), 0) / B.length;
      b = repHead('5-Year Business Plan & Strategy Report', '2027–2031 · draft ahead of Board approval before year end', '5-Year Business Plan Tracker, business plan model, Funding Plan Tracker') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">The 2027–2031 plan refresh is <b>${Math.round(p)}% complete</b>, with Board approval scheduled for <b>17 Dec 2026</b>. The current plan targets <b>${m1(BP.rev[5])}m</b> revenue and <b>${m1(BP.eb[5])}m</b> EBITDA in 2030.</p>
    <h3>Refresh status</h3><ul class="checkl">${B.map(r => `<li><span class="ck ${DONE.has(r.status) ? 'ok' : r.prog > 0 ? 'ok' : 'no'}">${r.prog > 0 ? '✓' : '·'}</span><span>${escH(r.t)}<small>${escH(r.owner)} · due ${fmtDate(r.date)} · ${r.prog || 0}%</small></span>${pill(r.status)}</li>`).join('')}</ul>
    <h3>Changes the refresh needs to reflect</h3><ul class="pts"><li>Rebase 2026 to the ${m1(F26.rev)}m forecast; the 2027 plan of ${m1(BP.rev[2])}m would otherwise need ${m1((BP.rev[2] / F26.rev - 1) * 100)}% growth.</li><li>Move Subsidiary D's first revenue into 2027.</li><li>Reflect the outcome of the Subsidiaries K and N review.</li><li>Test the funding plan against the 5.00x covenant limit.</li></ul>
    <h3>Scenarios to run</h3><ul class="pts"><li>Base: current pipeline and capex plan.</li><li>Downside: feed prices 10% higher and one new deal deferred.</li><li>Upside: two additional deals reaching FID in 2027.</li></ul></section>`;
    }
    return `<div class="stack">${b}</div>`;
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
    if (view === 'bpd') return download('business-plan-2026-2030.csv', [['Line', ...YRS], ['Revenue', ...BP.rev], ['EBITDA', ...BP.eb], ['Capex', ...BP.capex], ['New investments', ...BP.newinv], ['Operating companies', ...BP.ops]]);
    if (view === 'fcp' || view === 'rep-funding') return download('funding-plan-2026-2030.csv', [['Year', 'Capex', 'New investments', 'Debt repayments', 'Requirement', 'Operating cash', 'New debt', 'Equity', 'Divestments', 'Gap'], ...trkRows('fund').map(f => {
      const x = FUND.find(z => z.y === f.t) || {};
      return [f.t, x.capex, x.inv, x.rep, m1(f.req), f.ocf, f.debt, f.eq, f.div, m1(f.gap)];
    })]);
    if (view === 'kpid') return download('corporate-kpis.csv', [['KPI', 'Perspective', 'Owner', 'Target', 'Actual', 'Status'], ...trkRows('kpi').map(r => [r.t, r.persp, r.dept, r.target, r.actual, r.status])]);
    toast('Exported.');
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
    closeFlyouts();
    hidePane();
    sheetKey = key;
    sheetOpen = true;
    const T = TRK[key];
    $('#panelT').textContent = 'New entry';
    $('#panelB').innerHTML = `<div class="trk-meta"><span class="hp-mi" style="background:${APP.c}"><svg viewBox="0 0 24 24">${APP.g}</svg></span><span>${escH(T.n)}</span></div>
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
      app: APP_ID,
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
  {
    const [b, p] = decodeURIComponent(location.hash.slice(1) || 'home').split('|');
    view = VIEWS[b] ? b : 'home';
    param = p || '';
  }
  render();
}