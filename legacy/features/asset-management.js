import { dashboardCreateLink } from "./dashboard-create-link.js";
import { gateReadiness, renderGateReadiness } from '../lib/gate-readiness.mjs';
import { REV_A, REV_B, EB_A, EB_B, SUBS, DECISIONS } from "./group-data";
import { createShared } from "./shared";
export function initialize(scope) {
  const XLSX = window.XLSX;
  const APP_ID = 'am',
    APP_NAME = 'Asset Management';
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

  /* Sample SG5 workspace. Financial baselines are copied at build time from Finance. */
  const liveAssets = () => liveRegister('ofc-live-assets').filter(a => a.code !== 'ONLDC' && !SUBS.some(s => s.code === a.code));
  const isLiveCode = code => code === 'ONLDC' || liveAssets().some(a => a.code === code);
  const OPS = () => effectiveSubs().filter(s => s.st === 'Operating');
  const ENT = [...SUBS.map(s => s.n), 'ONLDC', ...liveAssets().map(s => s.n)];
  const COMPANY_SECTIONS = [['about', 'About the company'], ['capital', 'Capital vs invested amount'], ['ownership', 'Shareholder structure'], ['board', 'Board seats'], ['debt', 'Debt facility & terms'], ['org', 'Organisation & HR'], ['components', 'Project components'], ['plan', '5-year business plan'], ['budget', 'Yearly budget'], ['audited', 'Audited financial statements'], ['quarterly', 'Quarterly financials & operations'], ['treasury', 'Treasury & debt repayments'], ['risk', 'Risk register'], ['audit', 'Internal audit'], ['legal', 'Legal cases']];
  const FOLDERS = ['Company information', 'Investment', 'Divestment', 'Business plan', 'Operations', 'Funding', 'Legal', 'Meeting packs', 'Communications', 'Financial performance', 'Consultancy services', 'Research & assessment', 'Valuations'];
  const STATES = ['Not started', 'In progress', 'Blocked', 'Completed', 'Closed'];
  const DONE = new Set(['Completed', 'Closed', 'Approved', 'Accepted']);
  const field = (k, l, type = 'text', extra = {}) => ({
    k,
    l,
    type,
    ...extra
  });
  const subField = field('sub', 'Subsidiary / asset', 'select', {
    o: ENT,
    req: 1
  });
  const titleField = field('t', 'Title', 'text', {
    req: 1,
    full: 1
  });
  const ownerField = field('owner', 'Owner and support', 'text', {
    req: 1
  });
  const dateField = field('date', 'Due date', 'date', {
    req: 1
  });
  const statusField = field('status', 'Status', 'select', {
    o: STATES
  });
  const noteField = field('next', 'Next step / commentary', 'textarea', {
    full: 1
  });
  const fileField = field('file', 'Attachment (up to 10 MB, stored in this browser)', 'file', {
    full: 1
  });
  const sample = (t, sub, owner, date, status, next, extra = {}) => ({
    t,
    sub,
    owner,
    date,
    status,
    next,
    ...extra
  });
  const taskCols = [['t', 'Task'], ['sub', 'Asset'], ['type', 'Type'], ['prio', 'Priority'], ['owner', 'Owner'], ['date', 'Due', 'date'], ['status', 'Status', 'status'], ['progress', 'Progress', 'progress'], ['next', 'Next step']];
  const TRK = {
    actions: {
      n: 'Asset Management Tracker',
      d: 'Weekly interventions, actions and requests across the portfolio.',
      fields: [subField, field('type', 'Type of task', 'select', {
        o: ['AM Intervention', 'Action Task', 'Ad Hoc request', 'Other']
      }), titleField, field('desc', 'Task description', 'textarea', {
        full: 1
      }), field('party', 'Related party'), field('prio', 'Criticality / priority', 'select', {
        o: ['Critical', 'High', 'Medium', 'Low']
      }), statusField, ownerField, dateField, field('progress', 'Progress (%)', 'number', {
        min: 0,
        max: 100,
        req: 1
      }), field('newdate', 'New target date', 'date'), noteField],
      cols: taskCols,
      rows: [sample('Production line recovery plan', 'Subsidiary K', 'AM Director', '2026-09-18', 'Blocked', 'Agree plant restart schedule with management.', {
        type: 'AM Intervention',
        prio: 'Critical',
        progress: 35,
        desc: 'Recover lost production following Q2 downtime.',
        party: 'Company management'
      }), sample('Feed procurement and margin recovery', 'Subsidiary B', 'Portfolio Manager', '2026-09-30', 'In progress', 'Review feed contracts and weekly margin bridge.', {
        type: 'AM Intervention',
        prio: 'High',
        progress: 55,
        party: 'Procurement / management'
      }), sample('Strategic options review', 'Subsidiary N', 'AM Director', '2026-10-20', 'In progress', 'Prepare hold, improve or exit options for the CIO.', {
        type: 'AM Intervention',
        prio: 'High',
        progress: 30,
        party: 'CIO'
      }), sample('August management accounts submission', 'Subsidiary K', 'Finance Controller', '2026-09-15', 'Not started', 'Submit missing management accounts to Group Finance.', {
        type: 'Action Task',
        prio: 'High',
        progress: 0,
        party: 'Group Finance'
      }), sample('August management accounts submission', 'Subsidiary N', 'Finance Controller', '2026-09-15', 'In progress', 'Resolve reconciliation questions and submit pack.', {
        type: 'Action Task',
        prio: 'High',
        progress: 60,
        party: 'Group Finance'
      }), sample('Export capacity review', 'Subsidiary F', 'Portfolio Manager', '2026-10-05', 'In progress', 'Validate growth capacity before committing capex.', {
        type: 'Ad Hoc request',
        prio: 'Medium',
        progress: 65,
        party: 'Commercial team'
      }), sample('Quarterly board action follow-up', 'Subsidiary A', 'Board Secretary', '2026-09-20', 'Completed', 'All recorded board actions closed.', {
        type: 'Action Task',
        prio: 'Medium',
        progress: 100,
        party: 'Board'
      }), sample('Catch-volume recovery assessment', 'Subsidiary E', 'Portfolio Manager', '2026-10-12', 'Not started', 'Assess fleet availability and catch recovery.', {
        type: 'AM Intervention',
        prio: 'Medium',
        progress: 0,
        party: 'Operations'
      }), sample('ONLDC critical fund presentation', 'ONLDC', 'Ishaq', '2026-04-10', 'In progress', 'Present funding requirement and cash runway to OIA following the Q1 export shortfall.', {
        type: 'AM Intervention',
        prio: 'Critical',
        progress: 60,
        desc: 'Real item from the AM weekly tracker — funding, liquidity & cash management.',
        party: 'OIA'
      }), sample('ONLDC request for additional facility / working capital', 'ONLDC', 'Ishaq', '2026-04-24', 'In progress', 'Follow up bank response; Q1 export decline increased the working-capital need.', {
        type: 'AM Intervention',
        prio: 'Critical',
        progress: 40,
        desc: 'Real item from the AM weekly tracker.',
        party: 'OIA'
      }), sample('AM Q1 2026 report — ONLDC', 'ONLDC', 'Rayyan K', '2026-04-30', 'Completed', 'Revenue OMR 2.66m, 19% below budget; export sales fell to zero in March.', {
        type: 'Action Task',
        prio: 'High',
        progress: 100,
        desc: 'Quarterly AM performance report to the Investment Department.',
        party: 'Investment Dept'
      }), sample('ONLDC 2026 balance scorecard', 'ONLDC', 'Ishaq', '2026-03-15', 'Completed', 'FY2026 scorecard agreed with company management.', {
        type: 'Action Task',
        prio: 'High',
        progress: 100,
        desc: 'Real item from the AM weekly tracker.',
        party: 'Company Management'
      })]
    },
    overview: {
      n: 'Asset Management Overview',
      d: 'Company 360° updates by section and reporting period. Upload source evidence or add commentary.',
      fields: [subField, field('section', 'Section', 'select', {
        o: COMPANY_SECTIONS.map(s => s[1])
      }), field('t', 'Period / update title', 'text', {
        req: 1,
        full: 1
      }), ownerField, field('date', 'As-of date', 'date', {
        req: 1
      }), statusField, noteField, fileField],
      cols: [['t', 'Period / update'], ['sub', 'Asset'], ['section', 'Section'], ['date', 'As of', 'date'], ['owner', 'Owner'], ['status', 'Status', 'status'], ['next', 'Commentary'], ['fileName', 'Evidence', 'file']],
      noOverdue: true,
      rows: [sample('August 2026 operating review', 'Subsidiary K', 'Portfolio Manager', '2026-09-20', 'In progress', 'Revenue 5.9m against a 7.8m budget; production downtime is the main driver.', {
        section: 'Quarterly financials & operations'
      }), sample('October strategic review', 'Subsidiary N', 'AM Director', '2026-09-23', 'In progress', 'Review scheduled for 20 October; compare turnaround and exit options.', {
        section: '5-year business plan'
      }), sample('Board representation review', 'Subsidiary A', 'Board Secretary', '2026-09-15', 'Completed', 'Illustrative board register reviewed; verify appointments against the legal register.', {
        section: 'Board seats'
      }), sample('Q1 2026 performance update', 'ONLDC', 'Rayyan K', '2026-04-30', 'In progress', 'Revenue OMR 2.66m, 19% below Q1 budget on a 37% export decline; local sales reached 82% of target. Net profit of OMR 0.572m was helped by a one-off Al Bashayer cost recovery.', {
        section: 'Quarterly financials & operations'
      })]
    },
    docs: {
      n: 'Asset Documentation',
      d: 'Local document vault organised by asset and folder. Uploaded file contents remain in this browser.',
      fields: [subField, field('folder', 'Folder', 'select', {
        o: FOLDERS
      }), titleField, ownerField, field('date', 'Document date', 'date', {
        req: 1
      }), statusField, noteField, fileField],
      cols: [['t', 'Document'], ['sub', 'Asset'], ['folder', 'Folder'], ['date', 'Date', 'date'], ['owner', 'Owner'], ['status', 'Status', 'status'], ['fileName', 'File', 'file']],
      noOverdue: true,
      rows: [sample('Company information sheet', 'Subsidiary A', 'Portfolio Manager', '2026-09-01', 'Completed', 'Illustrative company summary, not a legal record.', {
        folder: 'Company information',
        sampleFile: true
      }), sample('Production recovery brief', 'Subsidiary K', 'AM Director', '2026-09-20', 'In progress', 'Restart plan remains under review.', {
        folder: 'Operations',
        sampleFile: true
      }), sample('Annual accounts evidence request', 'Subsidiary N', 'Finance Controller', '2026-09-22', 'Not started', 'Audited statements have not been attached in this demo.', {
        folder: 'Financial performance'
      })]
    },
    packs: {
      n: 'Board / EC / Audit Packs',
      d: 'Meeting papers, review status, decisions and follow-up owners.',
      fields: [subField, field('forum', 'Forum', 'select', {
        o: ['Board', 'Executive Committee', 'Audit Committee', 'Shareholder Committee', 'Constitutive Meeting']
      }), titleField, field('date', 'Meeting date', 'date', {
        req: 1
      }), ownerField, field('status', 'Review status', 'select', {
        o: ['Draft', 'Under review', 'Approved', 'Completed']
      }), field('decision', 'Decision / recommendation', 'textarea', {
        full: 1
      }), noteField, fileField],
      cols: [['t', 'Pack'], ['sub', 'Asset'], ['forum', 'Forum'], ['date', 'Meeting', 'date'], ['owner', 'Reviewer'], ['status', 'Status', 'status'], ['decision', 'Decision / recommendation'], ['fileName', 'Pack file', 'file']],
      noOverdue: true,
      rows: [sample('Q3 performance and recovery', 'Subsidiary K', 'AM Director', '2026-10-01', 'Under review', 'Add a timed recovery plan before Board review.', {
        forum: 'Board',
        decision: 'Request a management recovery plan; decision pending.',
        sampleFile: true
      }), sample('Feed cost intervention', 'Subsidiary B', 'Portfolio Manager', '2026-10-06', 'Draft', 'Complete cost sensitivity and procurement options.', {
        forum: 'Executive Committee',
        decision: 'Review proposed feed purchasing strategy.',
        sampleFile: true
      }), sample('Internal control action review', 'Subsidiary N', 'Audit Committee Secretary', '2026-10-12', 'Under review', 'Obtain evidence for outstanding actions.', {
        forum: 'Audit Committee',
        decision: 'Keep findings open until evidence is reviewed.'
      }), sample('Q1 2026 AM report to OIA — ONLDC', 'ONLDC', 'AM Director', '2026-04-30', 'Completed', 'Q1 performance below budget; recovery actions and export-market monitoring agreed.', {
        forum: 'Shareholder Committee',
        decision: 'Noted the Q1 shortfall; requested monthly export tracking and embedding of the OIA governance framework and risk register.'
      })]
    },
    comms: {
      n: 'Asset Communications',
      d: 'Record incoming and outgoing correspondence and response follow-up. This register does not send messages.',
      fields: [subField, field('dir', 'Direction', 'select', {
        o: ['Inbox', 'Outbox']
      }), field('t', 'Subject', 'text', {
        req: 1,
        full: 1
      }), field('from', 'From / to', 'text', {
        req: 1
      }), field('date', 'Date received / recorded', 'date', {
        req: 1
      }), field('newdate', 'Response due date', 'date'), ownerField, statusField, noteField, fileField],
      cols: [['t', 'Subject'], ['sub', 'Asset'], ['dir', 'Direction'], ['from', 'From / to'], ['date', 'Recorded', 'date'], ['newdate', 'Response due', 'date'], ['owner', 'Response owner'], ['status', 'Status', 'status'], ['next', 'Response / next step'], ['fileName', 'Attachment', 'file']],
      rows: [sample('Request revised plant restart dates', 'Subsidiary K', 'AM Director', '2026-09-17', 'In progress', 'Management response outstanding.', {
        dir: 'Outbox',
        from: 'Company CEO',
        newdate: '2026-09-21'
      }), sample('August accounts clarification', 'Subsidiary N', 'Finance Controller', '2026-09-21', 'In progress', 'Resolve reconciliation queries.', {
        dir: 'Inbox',
        from: 'Company finance team',
        newdate: '2026-09-25'
      }), sample('Export growth update', 'Subsidiary F', 'Portfolio Manager', '2026-09-20', 'Completed', 'Included in the monthly portfolio review.', {
        dir: 'Inbox',
        from: 'Commercial Director',
        newdate: '2026-09-22'
      })]
    },
    financials: {
      n: 'Asset Financial Data',
      d: 'Upload a subsidiary’s actual revenue, budget and EBITDA. Portfolio Overall Performance and the Company 360° pages use the most recent entry for that asset in place of the sample baseline.',
      fields: [subField, field('xlsx', 'Import figures from a spreadsheet (optional)', 'excel', {
        full: 1
      }), field('period', 'Period', 'text', {
        req: 1,
        ph: 'e.g. Aug 2026'
      }), field('rev', 'Revenue (OMR m)', 'number', {
        req: 1,
        min: 0
      }), field('bud', 'Revenue budget (OMR m)', 'number', {
        min: 0
      }), field('eb', 'EBITDA (OMR m)', 'number'), ownerField, fileField],
      cols: [['sub', 'Asset'], ['period', 'Period'], ['rev', 'Revenue'], ['bud', 'Budget'], ['eb', 'EBITDA'], ['owner', 'Submitted by'], ['fileName', 'Evidence', 'file']],
      noOverdue: true,
      rows: []
    }
  };
  const TRK_KEYS = Object.keys(TRK);
  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : fallback;
    } catch {
      return fallback;
    }
  }
  let TLOCAL = readJSON('ofc-tracker-entries', []);
  if (!Array.isArray(TLOCAL)) TLOCAL = [];
  let EDITS = readJSON('ofc-am-edits', {});
  if (Array.isArray(EDITS)) EDITS = {};
  function saveT() {
    try {
      localStorage.setItem('ofc-tracker-entries', JSON.stringify(TLOCAL));
      return true;
    } catch {
      toast('Changes could not be saved. Browser storage may be full.');
      return false;
    }
  }
  function trkRows(key) {
    const T = TRK[key];
    return [...TLOCAL.filter(r => r.app === APP_ID && r.trk === T.n && r.d).map(r => ({
      ...r.d,
      t: r.d.t || r.t,
      _id: r.id,
      _local: r.id
    })), ...T.rows.map((r, i) => ({
      ...r,
      _id: key + ':' + i
    }))].map(r => {
      const o = {
        ...r,
        ...EDITS[r._id]
      };
      const due = key === 'comms' ? o.newdate : o.newdate || o.date;
      return {
        ...o,
        overdue: !!(!T.noOverdue && due && !DONE.has(o.status) && daysLate(due) > 0),
        due
      };
    });
  }
  const openCount = k => trkRows(k).filter(r => !DONE.has(r.status)).length;
  /* Subsidiary financials with the latest uploaded Asset Financial Data entry
     applied on top of the sample baseline, per asset. Everything that reads
     company revenue/budget/EBITDA (Portfolio Overall Performance, Company
     360°, reports, CSV export) calls this instead of SUBS directly, so an
     upload is reflected everywhere without a second code path. */
  function effectiveSubs() {
    const latest = {};
    for (const r of trkRows('financials')) {
      if (!(r.sub in latest)) latest[r.sub] = r;
    }
    const statuses = Object.fromEntries(liveRegister('ofc-live-asset-status').map(a => [a.code, a.st]));
    return [...SUBS.map(s => ({
      ...s,
      st: statuses[s.code] || s.st
    })), ...liveAssets()].map(s => {
      const f = latest[s.n];
      if (!f) return s;
      const num = (v, fallback) => v !== '' && v != null && Number.isFinite(+v) ? +v : fallback;
      return {
        ...s,
        rev: num(f.rev, s.rev),
        bud: num(f.bud, s.bud),
        eb: num(f.eb, s.eb),
        _uploaded: true,
        _period: f.period
      };
    });
  }
  /* Three-year sample history per subsidiary for the Asset Performance
     Dashboard. Only Aug-2026-YTD actuals exist in the source data (SUBS /
     an uploaded financials entry); everything else here is illustrative,
     formula-derived from that one snapshot so it stays internally
     consistent per asset: EBITDA margin held flat across years, revenue
     annualised from the 8-month YTD run rate, D&A/finance cost/tax/capex
     applied as fixed ratios of revenue. Sample data, like the rest of the
     demo -- replace with real multi-year actuals when available. */
  function subHistory(code) {
    const s = effectiveSubs().find(x => x.code === code) || effectiveSubs()[0];
    const margin = s.rev ? s.eb / s.rev : -0.15;
    const daRate = .06,
      finRate = .02,
      taxRate = .15,
      ocfRate = .55,
      capexRate = s.st === 'Operating' ? .10 : .35;
    const mk = rev => {
      const eb = rev * margin,
        op = eb - rev * daRate,
        fin = rev * finRate,
        pbt = op - fin,
        tax = Math.max(0, pbt * taxRate),
        np = pbt - tax;
      const ocf = eb * ocfRate,
        capex = rev * capexRate;
      return {
        rev,
        eb,
        op,
        np,
        ocf,
        capex,
        fcf: ocf - capex,
        ebMg: rev ? eb / rev * 100 : 0,
        opMg: rev ? op / rev * 100 : 0,
        npMg: rev ? np / rev * 100 : 0
      };
    };
    const annualRev = s.rev / 8 * 12,
      annualBud = s.bud / 8 * 12,
      forecast = mk(annualRev * .97);
    return {
      code: s.code,
      name: s.n,
      st: s.st,
      uploaded: !!s._uploaded,
      2024: {
        actual: mk(annualRev / 1.1)
      },
      2025: {
        actual: mk(annualRev / 1.05)
      },
      // Bear/bull re-run every line through mk() off a +-10% revenue swing
      // rather than scaling each metric independently, so a structurally
      // negative line (e.g. free cash flow) stays correctly signed and every
      // figure in a scenario column is internally consistent with the others.
      2026: {
        budget: mk(annualBud),
        actual: mk(annualRev),
        forecast,
        bear: mk(forecast.rev * .9),
        bull: mk(forecast.rev * 1.1)
      }
    };
  }

  /* ---------------- ONLDC: a real portfolio company ----------------
     Omani National Livestock Development Company SAOC. Every figure below
     comes from ONLDC's own documents supplied by Asset Management (signed
     audited financial statements FY2015-2025, the FY2026 budget workbook,
     the Feb-2026 management accounts, and the real ONLDC dashboard/AM
     weekly tracker) -- not the formulaic sample data the rest of the
     portfolio uses. Two things are estimated rather than sourced directly,
     and are flagged where used: EBITDA for FY2024/2025 (derived from the
     audited operating profit plus a depreciation/amortisation estimate
     rolled forward from the balance sheet, since the source extraction
     didn't carry the cash-flow D&A line), and the FY2026 YTD cash-flow
     budget split (the real YTD cash flow is actual only; the budget split
     is estimated off the EBITDA budget's usual conversion rate). ONLDC is
     deliberately kept out of SUBS/effectiveSubs(): its real Jan-Feb 2026
     YTD is a different scale and period to the other (fictional) 8-month
     subsidiaries, and folding it into the group consolidation totals used
     across Finance & Accounts/Strategy/Investment would require rebasing
     every hardcoded group figure and its narrative text. It lives here as
     a fully real, standalone asset instead. */
  const ONLDC = {
    code: 'ONLDC',
    name: 'ONLDC',
    legalName: 'Omani National Livestock Development Company SAOC',
    sector: 'Animal feed manufacturing (cattle & poultry feed)',
    location: 'Raysut Industrial Estate, Salalah, Oman',
    founded: '1998 as National Feed; feed mill built 2005, 110,000 MT/year capacity',
    ownership: [['Oman Food Capital (OFC)', 59.25], ['Shk. Mustahil Trading', 30.33], ['Farm Commodities', 10.42]],
    employees: 98,
    omanisation: 54,
    board: ['Ahmed Ali Issa Akaak (Chairman)', 'Miqdad Al Lawati (Vice Chairman)', 'Ahmed Issa Al Mashani (Director)', 'Mohammed Tabouk (Director)', 'Ahmed Al Naabi (Director)'],
    auditor: 'PricewaterhouseCoopers LLC (FY2025 signed 12 Feb 2026); Grant Thornton for FY2018–19',
    products: ['Ruminant feed (general, camel, high-fattening, dairy, sheep)', 'Poultry feed (broiler starter/grower/finisher, layer)', 'Bird feed (pigeon starter)', 'Raw materials (wheat bran, corn, barley bran mix)'],
    /* OMR m, from the audited financial statements each year */
    trend: [{
      year: 2015,
      rev: 10.904,
      np: 0.346
    }, {
      year: 2016,
      rev: 9.152,
      np: 0.296
    }, {
      year: 2017,
      rev: 10.394,
      np: 0.174
    }, {
      year: 2018,
      rev: 9.585,
      np: 0.111
    }, {
      year: 2019,
      rev: 10.993,
      np: 0.379,
      eb: 0.790
    }, {
      year: 2020,
      rev: 12.726,
      np: 0.364,
      eb: 0.891
    }, {
      year: 2021,
      rev: 12.852,
      np: -0.766
    }, {
      year: 2022,
      rev: 14.323,
      np: -1.850
    }, {
      year: 2023,
      rev: 10.256,
      np: -0.126
    }, {
      year: 2024,
      rev: 12.277,
      np: 0.223,
      eb: 0.635,
      assets: 8.751,
      equity: 5.029
    }, {
      year: 2025,
      rev: 12.276,
      np: 0.523,
      eb: 0.937,
      assets: 9.175,
      equity: 5.552
    }],
    /* Full OMR, audited FY2025 financial statements (FY2024 is the FS's own comparative column) */
    pl: {
      2024: {
        revenue: 12277453,
        cos: -10720826,
        gp: 1556627,
        otherIncome: 9074,
        ga: -684503,
        sd: -384465,
        financeCost: -159094,
        financeIncome: 55019,
        ecl: -114365,
        pbt: 278293,
        tax: -55302,
        np: 222991
      },
      2025: {
        revenue: 12276014,
        cos: -10379875,
        gp: 1896139,
        otherIncome: 100373,
        ga: -800820,
        sd: -363971,
        financeCost: -162792,
        financeIncome: 42780,
        ecl: -147434,
        pbt: 564275,
        tax: -41599,
        np: 522676
      }
    },
    bs: {
      2024: {
        ppe: 3126587,
        rou: 139178,
        intangibles: 114268,
        ncaTotal: 3710424,
        inventories: 1436026,
        receivables: 1952588,
        cash: 270902,
        caTotal: 5040894,
        totalAssets: 8751317,
        shareCapital: 6558417,
        legalReserve: 304764,
        accumLosses: -1839627,
        equity: 5029326,
        termLoanNC: 486132,
        termLoanCurrent: 233328,
        bankBorrowings: 1686554,
        payables: 742642,
        liabTotal: 3721991
      },
      2025: {
        ppe: 3246176,
        rou: 129828,
        intangibles: 80402,
        ncaTotal: 3795210,
        inventories: 2870407,
        receivables: 1284388,
        cash: 132327,
        caTotal: 5379968,
        totalAssets: 9175178,
        shareCapital: 6558417,
        legalReserve: 357032,
        accumLosses: -1369219,
        equity: 5552002,
        termLoanNC: 252804,
        termLoanCurrent: 233328,
        bankBorrowings: 1798013,
        payables: 769655,
        liabTotal: 3623176
      }
    },
    cf: {
      2025: {
        cfo: 452320,
        cfi: -287913,
        cff: -302982,
        netChange: -138575,
        openingCash: 270902,
        closingCash: 132327
      },
      2024: {
        cfo: 1099501
      }
    },
    budget2026: {
      revenue: 13176597,
      cos: -11003632,
      gp: 2172965,
      opex: -1443975,
      operatingProfit: 728450,
      financeCost: -175192,
      pbt: 553259,
      tax: -82989,
      np: 470270,
      ebitda: 992531,
      volumeMT: 94555
    },
    budget2025: {
      revenue: 13535406,
      np: 481961
    },
    /* Jan-Feb 2026 management accounts, real */
    ytd2026: {
      actual: {
        revenue: 1848105,
        cos: -1546755,
        gp: 301350,
        otherIncome: 18469,
        indirectExp: -190927,
        pbt: 128891,
        np: 109595,
        ocf: 118331,
        cfi: -55048,
        cff: 268998
      },
      budget: {
        revenue: 2170032,
        cos: -1811395,
        gp: 358637,
        otherIncome: 11086,
        indirectExp: -250864,
        pbt: 118859
      },
      priorYear: {
        revenue: 2176554,
        gp: 348150,
        pbt: 221032
      }
    },
    bsFeb2026: {
      totalAssets: 9288928,
      equity: 5659040,
      liabTotal: 3629888,
      bankBorrowings: 2105751,
      payables: 343441,
      workingCapital: 2373767
    },
    production: {
      q1_2026: {
        ruminantActual: 11481,
        ruminantBudget: 11765,
        poultryActual: 5922,
        poultryBudget: 7845,
        rawActual: 1619,
        rawBudget: 4135
      },
      fy: {
        2022: {
          ruminant: 30325,
          poultry: 50412,
          raw: 2925
        },
        2023: {
          ruminant: 33990,
          poultry: 19790,
          raw: 14065
        },
        2024: {
          ruminant: 36409,
          poultry: 28096,
          raw: 25817
        },
        2025: {
          ruminant: 39685,
          poultry: 37648,
          raw: 33304
        }
      }
    },
    kpisQ1_2026: {
      dso: 35,
      dpo: 19,
      dio: 83,
      capacityUtilisation: 67,
      capacityTarget: 85
    },
    risks: ['Geopolitical instability and MENA export disruption (Qatar, Yemen)', 'Freight and insurance costs (around US$3,000 per container)', 'Raw-material price volatility and government pricing regulation', 'East Africa shipment delays; Jebel Ali port congestion'],
    strategy: ['Explore synergies with strategic investor JBS (Al Bashayer Meat Company, A’Namaa)', 'Align offerings with Mazoon, NSA, ORA and BW', 'Embed the OIA governance framework, risk register and annual compliance reviews', 'Diversify export markets after the Q1 2026 disruption'],
    narrative: {
      q1_2026: 'Q1 2026 revenue missed budget by 19% on a 37% export decline, with zero export sales in March; local sales still reached 82% of target. EBITDA fell 61% quarter on quarter, though net profit of OMR 0.572m was supported by a one-off recovery of previously-expensed Al Bashayer Meat Company investment costs. Capacity utilisation was 67% against an 85% target.',
      fy2025: 'FY2025 revenue of OMR 12.28m was 9.3% below the OMR 13.54m budget, but audited net profit of OMR 0.523m beat the OMR 0.482m budget as cost discipline offset the volume shortfall — profit more than doubled versus FY2024’s OMR 0.223m. Cash fell from OMR 0.271m to OMR 0.132m as inventory build-up (OMR 1.44m → OMR 2.87m) absorbed working capital.'
    }
  };
  function onldcHistory() {
    const mkMg = r => ({
      ...r,
      ebMg: r.rev ? r.eb / r.rev * 100 : 0,
      opMg: r.rev ? r.op / r.rev * 100 : 0,
      npMg: r.rev ? r.np / r.rev * 100 : 0
    });
    const scale = (r, f) => mkMg({
      rev: r.rev * f,
      eb: r.eb * f,
      op: r.op * f,
      np: r.np * f,
      ocf: r.ocf * f,
      capex: r.capex * f,
      fcf: r.fcf * f
    });
    // FY2024/2025: EBITDA/operating profit estimated (see file header comment); everything else is the audited P&L directly.
    const y2024 = mkMg({
      rev: 12.277,
      eb: 0.635,
      op: 0.382,
      np: 0.223,
      ocf: 1.100,
      capex: 0.040,
      fcf: 1.060
    });
    const y2025 = mkMg({
      rev: 12.276,
      eb: 0.937,
      op: 0.684,
      np: 0.523,
      ocf: 0.452,
      capex: 0.288,
      fcf: 0.164
    });
    const budget = mkMg({
      rev: 2.170,
      eb: 0.163,
      op: 0.119,
      np: 0.101,
      ocf: 0.099,
      capex: 0.058,
      fcf: 0.041
    });
    const actual = mkMg({
      rev: 1.848,
      eb: 0.173,
      op: 0.129,
      np: 0.110,
      ocf: 0.118,
      capex: 0.055,
      fcf: 0.063
    });
    return {
      code: 'ONLDC',
      name: 'ONLDC',
      st: 'Operating',
      periodLabel: 'ONLDC · real data · FY2026 YTD to February (management accounts)',
      2024: {
        actual: y2024
      },
      2025: {
        actual: y2025
      },
      2026: {
        budget,
        actual,
        forecast: actual,
        bear: scale(actual, .9),
        bull: scale(actual, 1.1)
      }
    };
  }
  function onldcSection(key) {
    const caption = '<p class="src">Real data from ONLDC’s audited financial statements, FY2026 budget and management accounts.</p>';
    const board = b => {
      const m = /^(.*) \((.*)\)$/.exec(b);
      return m ? [m[1], m[2]] : [b, 'Director'];
    };
    const extra = key === 'about' ? facts([['Legal name', ONLDC.legalName], ['Sector', ONLDC.sector], ['Location', ONLDC.location], ['Founded', ONLDC.founded], ['Employees', ONLDC.employees + ' (' + ONLDC.omanisation + '% Omanisation)'], ['Auditor', ONLDC.auditor]]) : key === 'capital' ? facts([['Share capital', m1(ONLDC.bs[2025].shareCapital / 1e6) + 'm'], ['Legal reserve', m1(ONLDC.bs[2025].legalReserve / 1e6) + 'm'], ['Accumulated losses', m1(ONLDC.bs[2025].accumLosses / 1e6) + 'm'], ['Total equity, FY2025', m1(ONLDC.bs[2025].equity / 1e6) + 'm']]) : key === 'ownership' ? table(['Shareholder', 'Ownership'], ONLDC.ownership.map(([n, p]) => [n, p + '%'])) : key === 'board' ? table(['Board member', 'Role'], ONLDC.board.map(board)) : key === 'debt' ? facts([['Term loan (non-current)', m1(ONLDC.bs[2025].termLoanNC / 1e6) + 'm'], ['Term loan (current)', m1(ONLDC.bs[2025].termLoanCurrent / 1e6) + 'm'], ['Bank borrowings', m1(ONLDC.bs[2025].bankBorrowings / 1e6) + 'm'], ['Bank borrowings, Feb 2026', m1(ONLDC.bsFeb2026.bankBorrowings / 1e6) + 'm']]) : key === 'org' ? facts([['Headcount', ONLDC.employees], ['Omanisation', ONLDC.omanisation + '%'], ['Products', ONLDC.products.join('; ')]]) : key === 'components' ? table(['Product line', 'Q1 2026 actual (MT)', 'Q1 2026 budget (MT)'], [['Ruminant feed', nk(ONLDC.production.q1_2026.ruminantActual), nk(ONLDC.production.q1_2026.ruminantBudget)], ['Poultry feed', nk(ONLDC.production.q1_2026.poultryActual), nk(ONLDC.production.q1_2026.poultryBudget)], ['Raw materials', nk(ONLDC.production.q1_2026.rawActual), nk(ONLDC.production.q1_2026.rawBudget)]]) : key === 'plan' ? facts([['FY2026 budgeted revenue', m1(ONLDC.budget2026.revenue / 1e6) + 'm'], ['FY2026 budgeted volume', nk(ONLDC.budget2026.volumeMT) + ' MT'], ['Strategic priorities', ONLDC.strategy.join('; ')]]) : key === 'budget' ? table(['Measure', 'FY2026 budget', 'FY2025 actual'], [['Revenue OMR m', m1(ONLDC.budget2026.revenue / 1e6), m1(ONLDC.pl[2025].revenue / 1e6)], ['Gross profit OMR m', m1(ONLDC.budget2026.gp / 1e6), m1(ONLDC.pl[2025].gp / 1e6)], ['Net profit OMR m', m1(ONLDC.budget2026.np / 1e6), m1(ONLDC.pl[2025].np / 1e6)]]) : key === 'audited' ? table(['FY', 'Revenue OMR m', 'Net profit / (loss) OMR m', 'Total assets OMR m', 'Total equity OMR m'], ONLDC.trend.map(t => [t.year, m1(t.rev), m1(t.np), t.assets ? m1(t.assets) : '—', t.equity ? m1(t.equity) : '—'])) + `<p class="src">11-year audited trend. Total assets/equity shown for FY2024–25 only (not extracted for earlier years). ${ONLDC.narrative.fy2025}</p>` : key === 'quarterly' ? table(['OMR m', 'Q1 2026 actual', 'Q1 2026 budget', 'Q1 2025 actual'], [['Revenue', m1(ONLDC.ytd2026.actual.revenue / 1e6), m1(ONLDC.ytd2026.budget.revenue / 1e6), m1(ONLDC.ytd2026.priorYear.revenue / 1e6)], ['Gross profit', m1(ONLDC.ytd2026.actual.gp / 1e6), m1(ONLDC.ytd2026.budget.gp / 1e6), m1(ONLDC.ytd2026.priorYear.gp / 1e6)], ['Profit before tax', m1(ONLDC.ytd2026.actual.pbt / 1e6), m1(ONLDC.ytd2026.budget.pbt / 1e6), m1(ONLDC.ytd2026.priorYear.pbt / 1e6)]]) + `<p class="src">${ONLDC.narrative.q1_2026}</p>` : key === 'treasury' ? facts([['Bank borrowings, Feb 2026', m1(ONLDC.bsFeb2026.bankBorrowings / 1e6) + 'm'], ['Working capital, Feb 2026', m1(ONLDC.bsFeb2026.workingCapital / 1e6) + 'm'], ['DSO / DPO / DIO, Q1 2026', ONLDC.kpisQ1_2026.dso + 'd / ' + ONLDC.kpisQ1_2026.dpo + 'd / ' + ONLDC.kpisQ1_2026.dio + 'd']]) : key === 'risk' ? table(['Risk'], ONLDC.risks.map(r => [r])) : key === 'audit' ? facts([['Auditor', ONLDC.auditor], ['Last signed FS', 'FY2025, signed 12 Feb 2026']]) : '<p>No legal case register supplied for ONLDC in this data set.</p>';
    return extra + caption;
  }
  async function handleFinancialsImport(input) {
    const file = input.files[0];
    if (!file) return;
    if (!window.XLSX) {
      toast('The spreadsheet reader needs internet access to load. Fill in the figures below by hand.');
      return;
    }
    const form = input.closest('form');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {
        type: 'array'
      });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        defval: ''
      });
      if (!rows.length) {
        toast('That spreadsheet has no data rows.');
        return;
      }
      const norm = k => String(k).trim().toLowerCase();
      const get = (row, ...keys) => {
        for (const rk of Object.keys(row)) if (keys.includes(norm(rk))) return row[rk];
        return '';
      };
      const sub = (form.elements.sub.value || '').toLowerCase();
      const match = rows.find(r => {
        const a = norm(get(r, 'asset', 'subsidiary', 'company'));
        return a && (sub.includes(a) || a.includes(sub));
      }) || (rows.length === 1 ? rows[0] : null);
      if (!match) {
        toast(`Found ${rows.length} rows but none matched "${form.elements.sub.value}" by name. Pick the right asset first, or check the file's Asset column.`);
        return;
      }
      const period = get(match, 'period', 'month', 'as of', 'date'),
        rev = get(match, 'revenue', 'rev'),
        bud = get(match, 'budget', 'revenue budget', 'bud'),
        eb = get(match, 'ebitda', 'eb');
      if (period) form.elements.period.value = period;
      if (rev !== '') form.elements.rev.value = +rev || 0;
      if (bud !== '') form.elements.bud.value = +bud || 0;
      if (eb !== '') form.elements.eb.value = +eb || 0;
      toast(`Filled from ${file.name}. Review the figures, then add to the tracker.`);
    } catch {
      toast('Could not read that spreadsheet. Check the file and try again.');
    }
  }
  const VIEWS = {
    home: 'Overview',
    portfolio: 'Portfolio Overall Performance',
    interventions: 'Interventions & Actions',
    company: 'Asset / Company 360°',
    assetperf: 'Asset Performance Dashboard',
    'rep-interventions': 'Portfolio Interventions',
    'rep-period': 'Monthly & Quarterly Report',
    'rep-packs': 'Board / EC / Audit Pack Review',
    'rep-cases': 'Intervention Reports / Case Studies',
    'rep-benchmark': 'Assessment / Benchmark Reports',
    'rep-valuation': 'Valuation Reports',
    'rep-adhoc': 'Ad Hoc Report'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['portfolio', 'interventions', 'company', 'assetperf'],
    REPS = Object.keys(VIEWS).filter(k => k.startsWith('rep-'));
  let view = 'home',
    companyCode = 'A',
    companySection = 'about',
    assetFilter = 'All',
    portfolioQuery = '',
    sortBy = 'rev',
    sortDir = -1,
    perfCode = 'A',
    perfYear = '2026';
  function section(v) {
    return v === 'home' ? 'home' : v.startsWith('trk-') ? 'input' : v.startsWith('rep-') ? 'reports' : 'dashboards';
  }
  function readRoute() {
    let parts;
    try {
      parts = decodeURIComponent(location.hash.slice(1)).split('|');
    } catch {
      parts = [];
    }
    view = VIEWS[parts[0]] ? parts[0] : 'home';
    if (view === 'company') {
      companyCode = SUBS.some(s => s.code === parts[1]) || isLiveCode(parts[1]) ? parts[1] : 'A';
      companySection = COMPANY_SECTIONS.some(s => s[0] === parts[2]) ? parts[2] : 'about';
    }
    if (view === 'assetperf') {
      perfCode = SUBS.some(s => s.code === parts[1]) || isLiveCode(parts[1]) ? parts[1] : 'A';
      perfYear = ['2024', '2025', '2026'].includes(parts[2]) ? parts[2] : '2026';
    }
  }
  function go(route, push = true) {
    const value = String(route || 'home');
    if (push && location.hash.slice(1) !== value) history.pushState(null, '', '#' + value);
    readRoute();
    hidePane();
    closeSheet();
    tState = {
      q: '',
      status: 'All',
      entity: 'All'
    };
    render();
    window.scrollTo({
      top: 0
    });
  }
  scope.listen(window, 'popstate', () => {
    readRoute();
    hidePane();
    closeSheet();
    tState = {
      q: '',
      status: 'All',
      entity: 'All'
    };
    render();
  });
  const m1 = v => (+v).toFixed(1),
    ico = {
      plus: '+',
      spark: '✦'
    };
  const pill = s => `<span class="pill ${['Blocked', 'Critical', 'Below budget'].includes(s) ? 'esc' : DONE.has(s) || s === 'Above budget' ? 'ok' : 'pend'}">${escH(s)}</span>`;
  const progBar = p => `<div class="am-progress"><meter min="0" max="100" value="${Math.max(0, Math.min(100, +p || 0))}" aria-label="Progress"></meter><span>${Math.round(+p || 0)}%</span></div>`;
  const printBtn = '<button class="btn ghost sm" data-print>Print / PDF</button>',
    exportBtn = '<button class="btn ghost sm" data-export>Export CSV</button>';
  const vh = (t, d, actions = '') => `<div class="vh"><div><h2>${escH(t)}</h2><p>${escH(d)}</p></div><div class="vh-actions noprint">${actions}</div></div>`;
  const block = (t, b, a = '') => `<section class="wp"><div class="wp-h"><h2>${escH(t)}</h2>${a}</div>${b}</section>`;
  const table = (heads, rows) => `<div class="tscroll"><table class="ttbl"><thead><tr>${heads.map(h => `<th>${escH(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${heads.length}" class="am-empty">No records match this selection.</td></tr>`}</tbody></table></div>`;
  const facts = entries => `<dl class="am-facts">${entries.map(([label, value]) => `<div><dt>${escH(label)}</dt><dd>${escH(value)}</dd></div>`).join('')}</dl>`;
  const companyLink = s => `<button class="am-name" data-go="company|${s.code}|about">${s.n}</button>`;
  const assetRows = k => trkRows(k).filter(r => assetFilter === 'All' || r.sub === assetFilter);
  const assetSelector = () => `<div class="am-toolbar noprint"><label>Asset <select id="assetFilter"><option value="All">All assets</option>${ENT.map(n => `<option${assetFilter === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label><span class="am-badge">As of 23 Sep 2026</span><span class="am-badge">Financials: Aug 2026 YTD</span></div>`;
  function taskTable(rows) {
    return table(['Action', 'Asset', 'Owner', 'Due', 'Priority', 'Status', 'Progress'], rows.map(r => [`<button class="am-name" data-edit="${escH(r._id)}" data-key="actions">${escH(r.t)}</button>`, escH(r.sub), escH(r.owner), fmtDate(r.due) + (r.overdue ? `<span class="od">${daysLate(r.due)}d overdue</span>` : ''), pill(r.prio || 'Medium'), pill(r.status), progBar(r.progress)]));
  }
  const kpi = (label, value, context, target) => `<button class="kc am-kpi" data-go="${target}"><span class="lbl">${label}</span><span class="val num">${value}</span><span class="ctx">${context}</span><span class="see">View details ↗</span></button>`;
  function vHome() {
    const A = trkRows('actions'),
      open = A.filter(r => !DONE.has(r.status)),
      late = open.filter(r => r.overdue),
      packs = trkRows('packs').filter(r => !DONE.has(r.status));
    return `<div class="stack">${vh('Operating assets, active stewardship', 'SG5 · portfolio performance, interventions and governance', printBtn)}
 <div class="kpi5">${kpi('Operating companies', OPS().length, effectiveSubs().length + ' subsidiaries across the group', 'portfolio')}${kpi('Group revenue', '162.4m', '4.9% below budget · after eliminations', 'portfolio')}${kpi('Open AM actions', open.length, `${late.length} overdue · current tracker`, 'interventions')}${kpi('Above revenue budget', OPS().filter(s => s.bud > 0 && s.rev > s.bud).length + ' / ' + OPS().length, 'Current operating portfolio', 'portfolio')}${kpi('Packs awaiting review', packs.length, 'Board, EC and Audit Committee', 'trk-packs')}</div>
 <div class="am-flow"><div><b>SG5 · Hold, improve, grow or exit</b><p>Operating assets remain under active stewardship. ${effectiveSubs().filter(s => s.st !== 'Operating').map(s => escH(s.n)).join(', ') || 'No assets'} remain in execution.</p></div><a class="see" href="/pmo#readiness">PMO handover readiness ↗</a></div>
 <div class="am-flow" style="background:var(--pill)"><div><b>ONLDC · a real portfolio company</b><p>Audited financials FY2015–2025, the FY2026 budget and Feb-2026 management accounts, supplied by Asset Management.</p></div><span><a class="see" data-go="company|ONLDC|about">Company 360° ↗</a> &nbsp; <a class="see" data-go="assetperf|ONLDC|2026">Performance Dashboard ↗</a></span></div>
 <div class="grid2">${block('Needs attention', taskTable(open.filter(r => r.overdue || r.prio === 'Critical' || r.status === 'Blocked').slice(0, 5)), '<button class="see" data-go="interventions">All interventions ↗</button>')}${block('Revenue against budget', effectiveSubs().filter(s => s.st === 'Operating' && s.bud > 0).sort((a, b) => a.rev / a.bud - b.rev / b.bud).slice(0, 6).map(s => `<div class="am-variance">${companyLink(s)}<span class="track"><span class="bar below" style="width:${Math.min(100, s.rev / s.bud * 100)}%"></span></span><span>${m1((s.rev / s.bud - 1) * 100)}%</span></div>`).join('') + '<p class="src">Six largest percentage shortfalls · Aug 2026 YTD</p>', '<button class="see" data-go="portfolio">Portfolio ↗</button>')}</div>
 ${block('Upcoming governance reviews', packCards(packs), '<button class="see" data-go="trk-packs">Meeting packs ↗</button>')}
 <p class="src">Sample data. Financial baselines match Finance & Accounts. Task vocabulary follows the supplied prototype; the original weekly tracker has not been provided.</p></div>`;
  }
  function portfolioRows() {
    return effectiveSubs().filter(s => (assetFilter === 'All' || s.n === assetFilter) && (!portfolioQuery || s.n.toLowerCase().includes(portfolioQuery.toLowerCase()))).sort((a, b) => sortDir * (sortBy === 'n' ? a.n.localeCompare(b.n) : sortBy === 'variance' ? a.rev - a.bud - (b.rev - b.bud) : a[sortBy] - b[sortBy]));
  }
  function portfolioTable() {
    const rows = portfolioRows();
    return `<div class="tscroll"><table class="ttbl"><thead><tr>${[['n', 'Asset'], ['st', 'Stage'], ['rev', 'Revenue'], ['bud', 'Budget'], ['variance', 'Variance'], ['eb', 'EBITDA']].map(([k, n]) => `<th>${k === 'st' ? n : `<button class="am-sort" data-sort="${k}">${n}${sortBy === k ? sortDir === 1 ? ' ↑' : ' ↓' : ' ↕'}</button>`}</th>`).join('')}<th>Position</th></tr></thead><tbody>${rows.map(s => `<tr><td>${companyLink(s)}</td><td>${s.st === 'Operating' ? 'SG5 · Operating' : 'SG4 · Pre-operational'}</td><td class="num">${m1(s.rev)}</td><td class="num">${m1(s.bud)}</td><td class="num ${s.rev < s.bud ? 'neg' : 'pos'}">${m1(s.rev - s.bud)}</td><td class="num ${s.eb < 0 ? 'neg' : ''}">${m1(s.eb)}</td><td>${s.st === 'Operating' ? s.source === 'pmo' && !s._uploaded ? 'Awaiting financials' : pill(s.rev >= s.bud ? 'Above budget' : 'Below budget') : '<a class="see" href="/pmo">PMO ↗</a>'}</td></tr>`).join('') || '<tr><td colspan="7" class="am-empty">No matching assets.</td></tr>'}</tbody></table></div>`;
  }
  function vPortfolio() {
    const sum = k => effectiveSubs().reduce((n, s) => n + s[k], 0),
      rev = sum('rev'),
      bud = sum('bud'),
      eb = sum('eb');
    const kpi5 = (l, v, ctx) => `<div class="kc"><span class="lbl">${l}</span><span class="val num">${v}</span><span class="ctx">${ctx}</span></div>`;
    return `<div class="stack">${vh('Portfolio Overall Performance', 'August 2026 YTD · OMR m · click a company to open its 360°', exportBtn + printBtn)}
  <div class="kpi4">${kpi5('Subsidiary revenue', m1(rev) + 'm', 'Budget ' + m1(bud) + 'm · ' + sp(pct(rev, bud)))}${kpi5('Subsidiary EBITDA', m1(eb) + 'm', rev ? m1(eb / rev * 100) + '% margin' : '—')}${kpi5('Group revenue', m1(162.4) + 'm', 'After eliminations · ' + sp(pct(162.4, 170.8)) + ' vs budget')}${kpi5('Above revenue budget', effectiveSubs().filter(s => s.st === 'Operating' && s.bud > 0 && s.rev >= s.bud).length + ' of ' + effectiveSubs().filter(s => s.st === 'Operating').length, 'Operating subsidiaries')}</div>
  ${assetSelector()}${block('Subsidiary performance', '<div class="am-toolbar noprint"><input id="portfolioQuery" type="search" aria-label="Search assets" placeholder="Find an asset" value="' + escH(portfolioQuery) + '"></div><div id="portfolioTable">' + portfolioTable() + '</div>')}
  ${block('Bridge to the consolidated group', waterfall([{
      l: 'Subsidiaries|revenue',
      v: rev,
      total: 1
    }, {
      l: 'Group|eliminations',
      v: 162.4 - rev
    }, {
      l: 'Consolidated|group revenue',
      v: 162.4,
      total: 1
    }], 'Bridge to the consolidated group'))}
  <p class="src">The reconciliation always covers the full group, independent of the asset filter. SG4 entities contribute pre-operating costs but no operating revenue.</p><a class="see" href="/finance#subs">Finance & Accounts subsidiary detail ↗</a></div>`;
  }
  function vInterventions() {
    const rows = assetRows('actions'),
      open = rows.filter(r => !DONE.has(r.status));
    return `<div class="stack">${vh('Interventions & Actions', 'Weekly priorities, accountable owners and progress', `<button class="btn sm" data-new="actions">New entry</button>` + exportBtn + printBtn)}${assetSelector()}<div class="kpi4">${kpi('Open actions', open.length, 'Selected asset scope', 'trk-actions')}${kpi('Overdue', open.filter(r => r.overdue).length, 'Against current target date', 'trk-actions')}${kpi('Critical / high', open.filter(r => ['Critical', 'High'].includes(r.prio)).length, 'Open priorities', 'trk-actions')}${kpi('Completed', rows.filter(r => DONE.has(r.status)).length, 'Current tracker', 'trk-actions')}</div>${block('Action register', taskTable(rows))}</div>`;
  }
  function packCards(rows) {
    return rows.length ? rows.map(r => `<div class="am-pack"><h3><button class="am-name" data-edit="${escH(r._id)}" data-key="packs">${escH(r.t)}</button></h3><p>${escH(r.sub)} · ${escH(r.forum)} · ${fmtDate(r.date)} · ${pill(r.status)}</p><p>${escH(r.decision || 'Decision not yet recorded.')}</p><p class="src">${escH(r.owner)} · ${escH(r.next || '')}</p></div>`).join('') : '<p class="am-empty">No meeting packs in this selection.</p>';
  }
  function profile(s) {
    const i = SUBS.findIndex(x => x.code === s.code),
      operating = s.st === 'Operating';
    return {
      sector: ['Food production', 'Poultry', 'Food processing', 'Fisheries', 'Food distribution'][i % 5],
      capital: +Math.max(8, s.rev * 1.4).toFixed(1),
      invested: +Math.max(6, s.rev * 1.1).toFixed(1),
      share: 60,
      board: 5,
      ofcSeats: 3,
      staff: operating ? Math.round(55 + s.rev * 8) : 24,
      debt: +Math.max(3, s.rev * .7).toFixed(1),
      rate: 5.8,
      operating
    };
  }
  function baselineSection(s, key) {
    if (s.source === 'pmo' && s._uploaded && ['budget', 'quarterly'].includes(key)) {
      return `<p class="src">Reporting period: ${escH(s._period || 'Not specified')}. Source: Asset Financial Data.</p>` + table(['Measure', 'Budget', 'Actual', 'Variance'], [['Revenue OMR m', m1(s.bud), m1(s.rev), m1(s.rev - s.bud)], ['EBITDA OMR m', 'Not supplied', m1(s.eb), 'Not available']]);
    }
    if (s.source === 'pmo') return '<p>Received from PMO. No historical company data has been supplied. Add section updates and financial evidence below.</p><a class="see" href="/pmo#trk-handover">View handover evidence</a>';
    const p = profile(s),
      caption = '<p class="src">Illustrative company detail for this demo; verify against the source register. Financial actuals below come from Finance & Accounts.</p>';
    const extra = key === 'about' ? facts([['Stage', p.operating ? 'SG5 · Operating' : 'SG4 · Execution'], ['Sector (sample)', p.sector], ['Portfolio owner', 'Asset Management'], ['Reporting period', 'Aug 2026 YTD'], ['Company', s.n], ['Stewardship focus', ['K', 'N'].includes(s.code) ? 'Strategic review' : p.operating ? 'Performance and value creation' : 'Await PMO acceptance']]) : key === 'capital' ? facts([['Share capital (sample)', m1(p.capital) + 'm'], ['OFC invested (sample)', m1(p.invested) + 'm'], ['Basis', 'Illustrative OMR m']]) : key === 'ownership' ? table(['Shareholder (sample)', 'Ownership'], [['OFC', '60%'], ['Co-investor', '40%']]) : key === 'board' ? table(['Seat (sample)', 'Nomination', 'Term review'], [['Chair', 'OFC', 'Dec 2026'], ['Director 1', 'OFC', 'Dec 2026'], ['Director 2', 'OFC', 'Dec 2026'], ['Director 3', 'Co-investor', 'Dec 2026'], ['Director 4', 'Co-investor', 'Dec 2026']]) : key === 'debt' ? facts([['Facility (sample)', m1(p.debt) + 'm'], ['Rate (sample)', p.rate + '%'], ['Maturity (sample)', '31 Dec 2030'], ['Lender', 'Illustrative Bank A'], ['Security', 'Refer to signed facility'], ['Covenants', 'Verify with Treasury']]) : key === 'org' ? facts([['Headcount (sample)', p.staff], ['Accountable executive', 'Company CEO'], ['Functions', 'Operations, Finance, Commercial'], ['Reporting line', 'Company board'], ['HR focus', 'Capability and succession'], ['Workforce detail', 'Upload current organisation chart']]) : key === 'components' ? table(['Component', 'Stage', 'Follow-up'], [['Production / processing', p.operating ? 'Operating' : 'Execution', p.operating ? 'Capacity and maintenance' : 'PMO acceptance'], ['Utilities and infrastructure', p.operating ? 'Operating' : 'Commissioning', 'Condition and service availability'], ['Storage and distribution', p.operating ? 'Operating' : 'Pre-operational', 'Service levels and throughput']]) : key === 'plan' ? table(['Planning year', 'Revenue scenario OMR m', 'Basis'], [2026, 2027, 2028, 2029, 2030].map((y, i) => [y, m1(s.rev * 1.5 * Math.pow(1.05, i)), 'Illustrative scenario: annualised YTD × 5% yearly growth'])) + '<p class="src">Scenario only; not an approved business plan. Upload the approved plan below.</p>' : key === 'budget' ? table(['Measure', 'YTD budget', 'YTD actual', 'Variance'], [['Revenue OMR m', m1(s.bud), m1(s.rev), m1(s.rev - s.bud)]]) + waterfall([{
      l: 'Budget|revenue',
      v: s.bud,
      total: 1
    }, {
      l: 'Variance|to budget',
      v: s.rev - s.bud
    }, {
      l: 'Actual|revenue',
      v: s.rev,
      total: 1
    }], 'Budget to actual bridge') + '<p>Annual budget evidence can be recorded below; the baseline here is August YTD.</p>' : key === 'audited' ? '<p>No signed audited financial statements are bundled with the demo. Add the signed statements and reporting period using “Add update”.</p>' : key === 'quarterly' ? `<div class="kpi4"><div class="kc"><span class="lbl">YTD revenue</span><span class="val num">${m1(s.rev)}<small>m</small></span><span class="ctx">Budget ${m1(s.bud)}m · <span class="${s.rev >= s.bud ? 'pos' : 'neg'}">${sp(pct(s.rev, s.bud))}</span></span></div><div class="kc"><span class="lbl">YTD EBITDA</span><span class="val num">${m1(s.eb)}<small>m</small></span><span class="ctx">${s.rev ? m1(s.eb / s.rev * 100) + '% margin' : 'Pre-operational'}</span></div><div class="kc"><span class="lbl">Period</span><span class="val num" style="font-size:20px">Aug 2026<small>YTD</small></span><span class="ctx">Source: Finance &amp; Accounts${s._uploaded ? ' · updated financials on file' : ''}</span></div></div>` + waterfall([{
      l: 'Budget|revenue',
      v: s.bud,
      total: 1
    }, {
      l: 'Variance|to budget',
      v: s.rev - s.bud
    }, {
      l: 'Actual|revenue',
      v: s.rev,
      total: 1
    }], 'Revenue bridge') + `<div class="insight"><span class="status ${s.rev >= s.bud ? 'ok' : 'warn'}"></span><span>Revenue is <b>${sp(pct(s.rev, s.bud))}</b> against budget YTD${s._uploaded ? ', based on the uploaded Asset Financial Data entry' : ''}.</span></div>` + '<p class="src">Quarter-specific results need an uploaded reporting pack; YTD is not a standalone quarter.</p>' : key === 'treasury' ? '<p>Cash, debt service and covenant schedules are owned by Treasury. Record asset-level updates and evidence below.</p><a class="see" href="/treasury#debtd">Treasury debt dashboard ↗</a>' : key === 'risk' ? table(['Exposure', 'Assessment', 'Response'], [[s.rev < s.bud ? 'Revenue shortfall' : 'Capacity / growth execution', s.rev < s.bud ? m1((s.rev / s.bud - 1) * 100) + '% against revenue budget' : 'Monitor growth quality', 'Review in weekly AM actions'], ['Operating margin', s.eb < 0 ? 'Negative EBITDA' : 'Positive EBITDA', 'Review cost and production drivers']]) : key === 'audit' ? '<p>Maintain findings, due dates and closure evidence in the section updates. No signed internal audit opinion is supplied in this demo.</p>' : '<p>No legal case register is supplied. Add case references, counsel updates and evidence here. An empty demo register does not establish that the company has no cases.</p>';
    return extra + (!['budget', 'quarterly', 'audited', 'treasury', 'audit', 'legal', 'risk'].includes(key) ? caption : '');
  }
  function sectionMatches(label, key) {
    if (key === 'org') return ['Organisation & HR', 'Organization structure', 'Headcount & HR'].includes(label);
    return label === COMPANY_SECTIONS.find(s => s[0] === key)?.[1];
  }
  function vCompany() {
    const es = effectiveSubs(),
      isOnldc = companyCode === 'ONLDC',
      s = isOnldc ? {
        code: 'ONLDC',
        n: 'ONLDC',
        st: 'Operating'
      } : es.find(x => x.code === companyCode) || es[0],
      label = COMPANY_SECTIONS.find(x => x[0] === companySection)[1],
      updates = trkRows('overview').filter(r => r.sub === s.n && sectionMatches(r.section, companySection)),
      tasks = trkRows('actions').filter(r => r.sub === s.n && !DONE.has(r.status));
    return `<div class="stack">${vh(s.n + ' · Company 360°' + (isOnldc ? ' · real data' : s._uploaded ? ' · updated financials' : ''), isOnldc ? 'SG5 · operating company · real financials from Asset Management' : s.st === 'Operating' ? 'SG5 · operating company' : 'SG4 · pre-operational; asset detail for visibility', `<button class="btn sm" data-company-update>Add update</button>` + exportBtn + printBtn)}<div class="am-toolbar noprint"><label>Company <select id="companyPick">${es.map(x => `<option value="${x.code}"${x.code === s.code ? ' selected' : ''}>${x.n}</option>`).join('')}<option value="ONLDC"${isOnldc ? ' selected' : ''}>ONLDC (real data)</option></select></label><span class="am-badge">15 sections</span><button class="see" data-go="trk-docs">Document vault ↗</button></div>
 ${s.source==='pmo'?block('Gate 5 monitoring',renderGateReadiness(gateReadiness({gate:5,deal:{id:s.dealId},asset:s,rows:{financials:trkRows('financials').filter(r=>r.sub===s.n)}}),escH)):''}<div class="am-company"><nav class="am-tabs" aria-label="Company sections">${COMPANY_SECTIONS.map(([k, n]) => `<button data-go="company|${s.code}|${k}"${k === companySection ? ' aria-current="page"' : ''}>${n}</button>`).join('')}</nav><div class="am-detail">${block(label, isOnldc ? onldcSection(companySection) : baselineSection(s, companySection))}${block('Section updates and evidence', updates.length ? updates.map(r => `<article class="am-pack"><h3><button class="am-name" data-edit="${escH(r._id)}" data-key="overview">${escH(r.t)}</button></h3><p>${fmtDate(r.date)} · ${escH(r.owner || 'Unassigned')} · ${pill(r.status || 'In progress')}</p><p class="am-text">${escH(r.next || 'No commentary.')}</p>${fileCell(r)}</article>`).join('') : '<p class="am-empty">No updates recorded for this section. Add commentary or attach source evidence.</p>')}${block('Open AM follow-up', taskTable(tasks))}</div></div></div>`;
  }
  function vAssetPerf() {
    const asset = effectiveSubs().find(s => s.code === perfCode);
    if (asset?.source === 'pmo') return `<div class="stack">${vh(asset.n + ' · Asset Performance', 'SG5 · newly handed-over operating asset', printBtn)}<section class="wp"><p>No audited history or forecast has been supplied. Record financial actuals in the Asset Financial Data tracker.</p><button class="btn" data-go="trk-financials">Add financial data</button><button class="see" data-go="company|${escH(asset.code)}|about">Company 360°</button></section></div>`;
    const isOnldc = perfCode === 'ONLDC';
    const h = isOnldc ? onldcHistory() : subHistory(perfCode),
      y = perfYear,
      cur = h[y].actual,
      hasBudget = !!h[y].budget;
    const filters = `<div class="am-toolbar noprint">
    <label>Asset <select id="perfAsset">${effectiveSubs().map(s => `<option value="${s.code}"${perfCode === s.code ? ' selected' : ''}>${s.n}</option>`).join('')}<option value="ONLDC"${isOnldc ? ' selected' : ''}>ONLDC (real data)</option></select></label>
    <label>Year <select id="perfYearSel">${['2024', '2025', '2026'].map(yy => `<option value="${yy}"${y === yy ? ' selected' : ''}>${yy}</option>`).join('')}</select></label>
    <span class="am-badge">${hasBudget ? 'Budget, actual and forecast' : 'Actual only · no budget set for closed years'}</span>${h.uploaded ? '<span class="am-badge">Updated financials on file</span>' : ''}
  </div>`;
    const kpiCard = (label, key, fmt, pp) => {
      const trend = ['2024', '2025', '2026'].map(yy => h[yy].actual[key]);
      const val = cur[key];
      let ctx,
        foot = '';
      if (hasBudget) {
        const b = h[y].budget[key],
          delta = pp ? val - b : pct(val, b);
        ctx = `Budget ${fmt(b)} · <span class="${delta >= 0 ? 'pos' : 'neg'}">${pp ? (delta >= 0 ? '+' : '') + delta.toFixed(1) + 'pp' : sp(delta)}</span>`;
        foot = `<div class="am-kpi-foot"><span>Budget ${fmt(b)}</span><span>Forecast ${fmt(h[y].forecast[key])}</span></div>`;
      } else ctx = `${y} actual`;
      return `<div class="kc"><span class="lbl">${label}</span><span class="val num">${fmt(val)}</span><span class="ctx">${ctx}</span>${spark(trend)}${foot}</div>`;
    };
    const mOMR = v => (Math.abs(v) < 10 ? (+v).toFixed(2) : m1(v)) + 'm',
      mPct = v => v.toFixed(1) + '%';
    const kpis = `<div class="kpi6">${kpiCard('Revenue', 'rev', mOMR)}${kpiCard('EBITDA margin', 'ebMg', mPct, true)}${kpiCard('Operating profit', 'op', mOMR)}${kpiCard('Net profit', 'np', mOMR)}${kpiCard('Operating cash flow', 'ocf', mOMR)}${kpiCard('Capital expenditure', 'capex', mOMR)}</div>`;
    const perfSeries = keys => hasBudget ? [{
      name: 'Budget',
      kind: 'bar',
      v: keys.map(k => h[y].budget[k]),
      fill: '#D8DFCA'
    }, {
      name: 'Actual',
      kind: 'bar',
      v: keys.map(k => cur[k]),
      fill: 'url(#hatchG)'
    }, {
      name: 'Forecast',
      kind: 'bar',
      v: keys.map(k => h[y].forecast[k]),
      fill: '#B7C997'
    }] : [{
      name: 'Actual',
      kind: 'bar',
      v: keys.map(k => cur[k]),
      fill: 'url(#hatchG)'
    }];
    const revChart = colsChart(['Revenue', 'EBITDA', 'Operating profit', 'Net profit'], perfSeries(['rev', 'eb', 'op', 'np']), {
      labels: 1,
      aria: 'Financial performance'
    });
    const cfChart = colsChart(['Operating cash flow', 'CapEx', 'Free cash flow'], perfSeries(['ocf', 'capex', 'fcf']), {
      labels: 1,
      aria: 'Cash flow performance'
    });
    const marginChart = colsChart(['2024', '2025', '2026'], [{
      name: 'EBITDA margin',
      kind: 'line',
      v: ['2024', '2025', '2026'].map(yy => h[yy].actual.ebMg),
      stroke: '#344B37'
    }, {
      name: 'Operating margin',
      kind: 'line',
      v: ['2024', '2025', '2026'].map(yy => h[yy].actual.opMg),
      stroke: '#7FA84A',
      dash: 1
    }, {
      name: 'Net margin',
      kind: 'line',
      v: ['2024', '2025', '2026'].map(yy => h[yy].actual.npMg),
      stroke: '#B4653F',
      dash: 1
    }], {
      aria: 'Margin trend'
    });
    let bridges = '',
      scenario = '';
    if (hasBudget) {
      const b = h[y].budget,
        f = h[y].actual;
      const revImpact = (f.rev - b.rev) / b.rev * b.op; // portion of the OP move explained by the revenue move, at budgeted margin
      const costImpact = f.op - b.op - revImpact;
      bridges = `<div class="grid2">
      <section class="wp"><div class="wp-h"><div><h2>Revenue bridge</h2><p>Budget to actual, OMR m</p></div></div>${waterfall([{
        l: 'Budget|revenue',
        v: b.rev,
        total: 1
      }, {
        l: 'Variance|to budget',
        v: f.rev - b.rev
      }, {
        l: 'Actual|revenue',
        v: f.rev,
        total: 1
      }], 'Revenue bridge')}</section>
      <section class="wp"><div class="wp-h"><div><h2>Operating profit bridge</h2><p>Budget to actual, OMR m</p></div></div>${waterfall([{
        l: 'Budget|operating profit',
        v: b.op,
        total: 1
      }, {
        l: 'Revenue|impact',
        v: revImpact
      }, {
        l: 'Cost &|margin impact',
        v: costImpact
      }, {
        l: 'Actual|operating profit',
        v: f.op,
        total: 1
      }], 'Operating profit bridge')}</section>
    </div>`;
      const scRow = (label, key, fmt) => `<tr><td>${label}</td><td class="r num">${fmt(h[y].bear[key])}</td><td class="r num">${fmt(h[y].forecast[key])}</td><td class="r num">${fmt(h[y].bull[key])}</td></tr>`;
      scenario = block('Scenario outlook', '<p class="src">Bear/bull = ±10% on full-year forecast revenue, flowed through at the same cost ratios as the base case. Illustrative sensitivity, not a separately modelled scenario.</p>' + `<div class="tscroll"><table class="ttbl am-scenario"><thead><tr><th>Metric</th><th class="r bear">Bear (-10%)</th><th class="r">Base (forecast)</th><th class="r bull">Bull (+10%)</th></tr></thead><tbody>${scRow('Revenue', 'rev', mOMR)}${scRow('EBITDA', 'eb', mOMR)}${scRow('Operating profit', 'op', mOMR)}${scRow('Net profit', 'np', mOMR)}${scRow('Free cash flow', 'fcf', mOMR)}</tbody></table></div>`);
    } else {
      bridges = `<div class="insight"><span class="status"></span><span>${y} is a closed year: no budget was set to bridge against. Switch to 2026 for the revenue and operating-profit bridges and the scenario outlook.</span></div>`;
    }
    const risks = trkRows('actions').filter(r => r.sub === h.name && !DONE.has(r.status));
    return `<div class="stack">${vh('Asset Performance Dashboard', h.periodLabel || h.name + ' · ' + y + (hasBudget ? ' YTD, annualised' : ' full year'), exportBtn + printBtn)}
  ${filters}
  ${kpis}
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Financial performance</h2><p>OMR m · ${hasBudget ? 'budget, actual, forecast' : 'actual'}</p></div></div>${revChart}</section>
    <section class="wp"><div class="wp-h"><div><h2>Cash flow performance</h2><p>OMR m · ${hasBudget ? 'budget, actual, forecast' : 'actual'}</p></div></div>${cfChart}</section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Margin trend</h2><p>EBITDA, operating and net margin, % · 2024–2026 actual</p></div></div>${marginChart}</section>
  ${bridges}
  ${scenario}
  ${block('Top risks and actions', risks.length ? taskTable(risks) : '<p class="am-empty">No open actions for this asset.</p>')}
  </div>`;
  }

  /* Tracker tables and editor. Records use the same shared key as Corporate. */
  let tState = {
      q: '',
      status: 'All',
      entity: 'All'
    },
    sheetKey = null,
    editingId = null,
    formBusy = false;
  function trkFiltered() {
    return trkRows(view.slice(4)).filter(r => (tState.status === 'All' || r.status === tState.status) && (tState.entity === 'All' || r.sub === tState.entity) && (!tState.q || Object.values(r).join(' ').toLowerCase().includes(tState.q.toLowerCase())));
  }
  function fileCell(r) {
    if (r.fileId) return `<button class="see" data-file="${escH(r._id)}" data-file-key="${escH(r._key || '')}">Download ${escH(r.fileName || 'attachment')}</button>`;
    if (r.sampleFile) return `<button class="see" data-sample="${escH(r._id)}">Download sample brief</button><small class="am-doc-note">Illustrative text, not a source document</small>`;
    return '<span class="am-doc-note">No attachment</span>';
  }
  function cell(r, c) {
    const [k,, type] = c,
      v = r[k];
    if (type === 'file') return fileCell(r);
    if (type === 'progress') return progBar(v);
    if (type === 'status') return pill(v || 'Not started') + (r.overdue ? `<span class="od">${daysLate(r.due)}d overdue</span>` : '');
    if (type === 'date') return fmtDate(v);
    return escH(v ?? '—');
  }
  function vTrk(key) {
    const T = TRK[key],
      rows = trkRows(key),
      statuses = [...new Set([...rows.map(r => r.status).filter(Boolean), ...(T.fields.find(f => f.k === 'status')?.o || [])])];
    return `<div class="stack">${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">+ New entry</button>` + exportBtn + printBtn)}<section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker" value="${escH(tState.q)}"><select id="te" aria-label="Filter by asset"><option value="All">All assets</option>${ENT.map(n => `<option${tState.entity === n ? ' selected' : ''}>${n}</option>`).join('')}</select><select id="ts" aria-label="Filter by status"><option value="All">All statuses</option>${statuses.map(s => `<option${tState.status === s ? ' selected' : ''}>${escH(s)}</option>`).join('')}</select><span class="cnt" id="tc"></span></div><div class="sumchips" id="tchips"></div><div class="tscroll"><table class="ttbl" id="tt"></table></div></section></div>`;
  }
  function fillTrk() {
    if (!view.startsWith('trk-')) return;
    const key = view.slice(4),
      T = TRK[key],
      rows = trkFiltered();
    $('#tt').innerHTML = `<thead><tr>${T.cols.map(c => `<th>${escH(c[1])}</th>`).join('')}<th class="noprint">Actions</th></tr></thead><tbody>${rows.map(r => `<tr>${T.cols.map(c => `<td>${cell(r, c)}</td>`).join('')}<td class="noprint"><button class="see" data-edit="${escH(r._id)}" data-key="${key}">Edit</button>${r._local ? ` · <button class="see" data-delete="${escH(r._id)}">Remove</button>` : ''}</td></tr>`).join('') || `<tr><td colspan="${T.cols.length + 1}" class="am-empty">No entries match these filters.</td></tr>`}</tbody>`;
    $('#tc').textContent = `${rows.length} of ${trkRows(key).length} entries`;
    $('#tchips').innerHTML = `<span>Open <b>${rows.filter(r => !DONE.has(r.status)).length}</b></span><span>Overdue <b>${rows.filter(r => r.overdue).length}</b></span>`;
  }
  function fieldHTML(f, record = {}) {
    const value = record[f.k] ?? '',
      req = f.req ? ' required' : '',
      bounds = (f.min !== undefined ? ` min="${f.min}"` : '') + (f.max !== undefined ? ` max="${f.max}"` : '');
    let control;
    if (f.type === 'select') control = `<select name="${f.k}"${req}>${[...new Set([...f.o, ...(value ? [value] : [])])].map(v => `<option${v === value ? ' selected' : ''}>${escH(v)}</option>`).join('')}</select>`;else if (f.type === 'textarea') control = `<textarea name="${f.k}" rows="3"${req}>${escH(value)}</textarea>`;else if (f.type === 'file') control = `<input name="file" type="file"><small>${record.fileId ? 'Current: ' + escH(record.fileName) + '. Choose a file to replace it.' : 'Optional attachment; no upload leaves a metadata-only record.'}</small>`;else if (f.type === 'excel') control = `<input name="${f.k}" type="file" accept=".xlsx,.xls,.csv" data-role="financials-import"><small>${window.XLSX ? 'Pick a spreadsheet with Asset, Period, Revenue, Budget and EBITDA columns to fill in the fields below.' : 'The spreadsheet reader needs internet access to load; fill in the figures below by hand, or attach the file as evidence.'}</small>`;else control = `<input name="${f.k}" type="${f.type}" value="${escH(value)}"${req}${bounds}${f.type === 'number' ? ' step="any"' : ''} autocomplete="off">`;
    return `<label class="${f.full ? 'full' : ''}"><span>${escH(f.l)}${f.req ? ' *' : ''}</span>${control}</label>`;
  }
  function openSheet(key, id = null, preset = {}) {
    if (!role.apps.includes(APP_ID)) return toast('Switch role to access Asset Management.');
    if (formBusy) return;
    closeFlyouts();
    hidePane();
    sheetKey = key;
    editingId = id;
    sheetOpen = true;
    const record = id ? trkRows(key).find(r => r._id === id) : preset;
    if (!record) return;
    $('#panelT').textContent = id ? 'Edit entry' : 'New entry';
    $('#panelB').innerHTML = `<div class="trk-meta">${escH(TRK[key].n)}</div><form class="pform" id="trkForm" novalidate>${TRK[key].fields.map(f => fieldHTML(f, record)).join('')}<p class="err full" id="trkErr" role="alert" hidden></p><div class="full pf-foot"><span>Saved in this browser.</span><button class="btn" type="submit">${id ? 'Save changes' : 'Add to tracker'}</button></div></form>`;
    $('#panel').classList.add('open');
    $('#panel').setAttribute('aria-hidden', 'false');
    $('#pscrim').classList.add('open');
    syncRail();
    scope.setTimeout(() => $('#trkForm [name]')?.focus(), 30);
  }
  function closeSheet() {
    if (formBusy) return;
    sheetOpen = false;
    $('#panel').classList.remove('open');
    $('#panel').setAttribute('aria-hidden', 'true');
    $('#pscrim').classList.remove('open');
    syncRail();
  }
  function refreshBadge() {
    const n = TLOCAL.filter(r => r.app === APP_ID).length;
    $('#railCount').hidden = !n;
    $('#railCount').textContent = n;
  }
  let dbPromise;
  function db() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('ofc-am-files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function fileStore(action, id, value) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', action === 'get' ? 'readonly' : 'readwrite'),
        store = tx.objectStore('files');
      const req = action === 'put' ? store.put(value, id) : action === 'delete' ? store.delete(id) : store.get(id);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || Error('File storage failed'));
    });
  }
  async function submitForm(e) {
    e.preventDefault();
    if (formBusy || !role.apps.includes(APP_ID)) return;
    const f = e.target,
      key = sheetKey,
      id = editingId,
      record = id ? trkRows(key).find(r => r._id === id) : {},
      d = {};
    let error = '';
    for (const x of TRK[key].fields) {
      if (x.type === 'file' || x.type === 'excel') continue;
      const el = f.elements[x.k],
        v = el.value.trim();
      el.classList.remove('bad');
      if (x.req && !v || x.type === 'number' && v !== '' && (!Number.isFinite(+v) || x.min !== undefined && +v < x.min || x.max !== undefined && +v > x.max) || !el.validity.valid) {
        el.classList.add('bad');
        error = 'Complete required fields and keep progress between 0 and 100.';
      }
      d[x.k] = x.type === 'number' && v !== '' ? +v : v;
    }
    if (d.newdate && d.date && d.newdate < d.date) {
      error = 'The new target / response date must not be earlier than the original date.';
    }
    const file = f.elements.file?.files[0];
    if (file?.size > 10 * 1024 * 1024) error = 'Choose an attachment no larger than 10 MB.';
    if (error) {
      $('#trkErr').textContent = error;
      $('#trkErr').hidden = false;
      f.querySelector('.bad')?.focus();
      return;
    }
    formBusy = true;
    const submit = f.querySelector('[type=submit]');
    submit.disabled = true;
    submit.textContent = 'Saving…';
    let fileId;
    try {
      if (file) {
        fileId = 'AMF-' + crypto.randomUUID();
        await fileStore('put', fileId, file);
        d.fileId = fileId;
        d.fileName = file.name;
        d.fileSize = file.size;
        d.sampleFile = false;
      }
      if (!role.apps.includes(APP_ID)) throw Error('Your role no longer has access.');
      if (id) {
        const current = readJSON('ofc-am-edits', {}),
          next = {
            ...current,
            [id]: {
              ...(current[id] || {}),
              ...d
            }
          };
        localStorage.setItem('ofc-am-edits', JSON.stringify(next));
        EDITS = next;
      } else {
        const current = readJSON('ofc-tracker-entries', []);
        if (!Array.isArray(current)) throw Error('Stored tracker data could not be read.');
        const entry = {
          id: 'AM-' + crypto.randomUUID(),
          at: Date.now(),
          app: APP_ID,
          trk: TRK[key].n,
          t: d.t,
          d
        };
        localStorage.setItem('ofc-tracker-entries', JSON.stringify([entry, ...current]));
        TLOCAL = [entry, ...current];
      }
      if (fileId && record?.fileId) fileStore('delete', record.fileId).catch(() => {});
      formBusy = false;
      closeSheet();
      if (view.startsWith('trk-')) {
        render();
      } else if (view === 'company' || view === 'interventions' || view.startsWith('rep-')) render();else go('trk-' + key);
      toast(id ? 'Entry updated.' : 'Entry saved.');
    } catch (err) {
      if (fileId) fileStore('delete', fileId).catch(() => {});
      formBusy = false;
      submit.disabled = false;
      submit.textContent = id ? 'Save changes' : 'Add to tracker';
      $('#trkErr').hidden = false;
      $('#trkErr').textContent = 'Could not save this entry. ' + (err.message || 'Browser storage is unavailable.');
    } finally {
      formBusy = false;
    }
  }
  scope.listen($('#panel'), 'submit', submitForm);
  $('#pClose').onclick = closeSheet;
  $('#pscrim').onclick = closeSheet;
  const findRecord = id => TRK_KEYS.flatMap(k => trkRows(k).map(r => ({
    ...r,
    _key: k
  }))).find(r => r._id === id);
  function saveBlob(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    scope.setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }
  async function downloadFile(id) {
    if (!role.apps.includes(APP_ID)) return;
    const record = findRecord(id);
    if (!record?.fileId) return;
    try {
      const blob = await fileStore('get', record.fileId);
      if (!blob) throw Error('not found');
      saveBlob(record.fileName || 'attachment', blob);
    } catch {
      toast('Attachment is unavailable in this browser. Reattach the source file.');
    }
  }
  function sampleDownload(id) {
    const r = findRecord(id);
    if (!r || !role.apps.includes(APP_ID)) return;
    saveBlob('ofc-sample-brief.txt', new Blob([`OFC DEMO — ILLUSTRATIVE BRIEF\n\n${r.t}\n${r.sub}\nOwner: ${r.owner}\nDate: ${r.date}\nStatus: ${r.status}\n\n${r.decision || ''}\n${r.next || ''}\n\nThis is generated sample text, not an original company document.`], {
      type: 'text/plain;charset=utf-8'
    }));
  }
  function removeRecord(id) {
    if (!role.apps.includes(APP_ID)) return;
    const record = findRecord(id);
    if (!record?._local) return;
    const current = readJSON('ofc-tracker-entries', []);
    try {
      const next = current.filter(r => r.id !== id);
      localStorage.setItem('ofc-tracker-entries', JSON.stringify(next));
      TLOCAL = next;
      if (record.fileId) fileStore('delete', record.fileId).catch(() => {});
      render();
      toast('Entry removed.');
    } catch {
      toast('Entry could not be removed from browser storage.');
    }
  }

  /* Reports are deterministic demo drafts, assembled from the selected asset records. */
  function vRep(v) {
    const actions = assetRows('actions'),
      open = actions.filter(r => !DONE.has(r.status)),
      late = open.filter(r => r.overdue),
      packs = assetRows('packs'),
      companies = effectiveSubs().filter(s => assetFilter === 'All' || s.n === assetFilter),
      operating = companies.filter(s => s.st === 'Operating');
    let body = '';
    if (v === 'rep-interventions') body = `<p class="lead">${open.length} AM actions remain open in the selected scope; ${late.length} are overdue. ${open.filter(r => ['High', 'Critical'].includes(r.prio)).length} carry high or critical priority.</p><h3>Priority interventions</h3>${taskTable(open)}<h3>Follow-up</h3><p>Confirm owners and revised target dates in the weekly tracker. Closing an action updates this report; revised target dates preserve the original due date in the source record.</p>`;
    if (v === 'rep-period') body = `<p class="lead">${operating.length} operating companies are in scope. ${operating.filter(s => s.rev >= s.bud).length} meet or exceed their revenue budgets.</p>${table(['Asset', 'YTD revenue', 'YTD budget', 'EBITDA'], companies.map(s => [s.n, m1(s.rev), m1(s.bud), m1(s.eb)]))}<h3>Performance narrative</h3><p>Group revenue is 162.4m against 170.8m budget after eliminations. K and N remain the focus of the October strategic review; F and L exceed revenue budget. The group figures always refer to all assets.</p><h3>Open interventions in scope</h3>${taskTable(open)}<p class="src">Financial data is August YTD. Standalone quarter figures are not supplied; use Company 360° to attach the quarterly pack.</p>`;
    if (v === 'rep-packs') body = `<p class="lead">${packs.filter(r => !DONE.has(r.status)).length} of ${packs.length} meeting packs in scope await review or approval.</p>${packCards(packs)}<h3>Review checklist</h3><p>Check financial reconciliations, a clear decision request, supporting evidence and an accountable follow-up owner. No approval or communication is sent by this demo.</p>`;
    if (v === 'rep-cases') body = `<p class="lead">Intervention case notes from the current AM tracker.</p>${actions.filter(r => r.type === 'AM Intervention').map(r => `<article class="am-pack"><h3>${escH(r.t)} · ${escH(r.sub)}</h3><p><b>Issue:</b> ${escH(r.desc || r.t)}</p><p><b>Response:</b> ${escH(r.next || 'No response recorded.')}</p><p><b>Accountability:</b> ${escH(r.owner)} · target ${fmtDate(r.due)}</p><p><b>Outcome so far:</b> ${escH(r.status)}, ${+r.progress || 0}% recorded progress. Financial benefits have not been verified.</p></article>`).join('') || '<p>No intervention cases in this scope.</p>'}`;
    if (v === 'rep-benchmark') body = `<p class="lead">Internal comparison of operating assets using revenue delivery and EBITDA margin.</p>${table(['Asset', 'Revenue / budget', 'EBITDA margin', 'Assessment'], operating.map(s => [s.n, m1(s.rev / s.bud * 100) + '%', m1(s.eb / s.rev * 100) + '%', s.eb < 0 ? 'Negative EBITDA; investigate' : s.rev < s.bud ? 'Revenue recovery needed' : 'Above revenue budget']))}<p class="src">This is an internal comparison, not an external peer benchmark. Different subsectors and capital intensity limit comparability.</p>`;
    if (v === 'rep-valuation') body = `<p class="lead">Illustrative valuation sensitivity using annualised YTD EBITDA. This is a demo scenario, not a valuation opinion.</p>${table(['Asset', 'Annualised EBITDA', '5× EV', '6× EV', '7× EV'], operating.map(s => {
      const e = s.eb * 1.5;
      return [s.n, m1(e), e > 0 ? m1(e * 5) : 'Not meaningful', e > 0 ? m1(e * 6) : 'Not meaningful', e > 0 ? m1(e * 7) : 'Not meaningful'];
    }))}<h3>Assumptions and missing evidence</h3><p>Annualised EBITDA = August YTD × 12/8. Multiples of 5–7× are arbitrary demo assumptions. Enterprise value excludes a net-debt adjustment; equity value, ownership attribution and transaction pricing are not calculated. Seasonal earnings, forecasts, audited accounts and an independent assessment need review.</p>`;
    if (v === 'rep-adhoc') body = `<p class="lead">Briefing for ${escH(assetFilter === 'All' ? 'the full portfolio' : assetFilter)}.</p><h3>Open actions</h3>${taskTable(open)}<h3>Outstanding correspondence</h3>${table(['Subject', 'Asset', 'Response owner', 'Response due', 'Next step'], assetRows('comms').filter(r => !DONE.has(r.status)).map(r => [escH(r.t), escH(r.sub), escH(r.owner), fmtDate(r.newdate), escH(r.next)]))}<h3>Recent company updates</h3>${table(['Update', 'Asset', 'Section', 'Commentary'], assetRows('overview').map(r => [escH(r.t), escH(r.sub), escH(r.section), escH(r.next)]))}`;
    return `<div class="stack">${vh(VIEWS[v], 'Demo draft · current tracker data and August YTD financial baseline', `<button class="btn ghost sm" data-regen>Regenerate</button>` + exportBtn + printBtn)}${assetSelector()}<section class="wp rep-doc am-report" id="repDoc"><span class="ai-badge">✦ AI report preview · template-generated</span><p class="src">Scope: ${escH(assetFilter)} · as of 23 September 2026. Sources: Finance & Accounts sample baseline and AM browser records. No external AI service is connected. Review before use.</p>${body}</section></div>`;
  }
  function render() {
    ENT.splice(0, ENT.length, ...SUBS.map(s => s.n), 'ONLDC', ...liveAssets().map(s => s.n));
    document.title = `${VIEWS[view]} · Asset Management · Oman Food Capital`;
    $('#crumbView').textContent = view === 'home' ? '' : ' / ' + VIEWS[view];
    syncRail();
    refreshBadge();
    const el = $('#view');
    if (!role.apps.includes(APP_ID)) {
      el.innerHTML = '<div class="noaccess"><h2>You do not have access to Asset Management</h2><p>Switch to Group CEO, Group CIO or Asset Management Director from your profile picture.</p><a class="see" href="/corporate">Back to Corporate</a></div>';
      return;
    }
    if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
    } else el.innerHTML = view === 'home' ? vHome() : view === 'portfolio' ? vPortfolio() : view === 'interventions' ? vInterventions() : view === 'company' ? vCompany() : view === 'assetperf' ? vAssetPerf() : vRep(view);
  }
  function download(name, rows) {
    const csv = '\uFEFF' + rows.map(r => r.map(v => '"' + String(v ?? '').replace(/^[=+@\-]/, "'$&").replace(/"/g, '""') + '"').join(',')).join('\r\n');
    saveBlob(name, new Blob([csv], {
      type: 'text/csv;charset=utf-8'
    }));
  }
  function exportView() {
    if (!role.apps.includes(APP_ID)) return;
    if (view.startsWith('trk-')) {
      const T = TRK[view.slice(4)];
      download(`am-${view}.csv`, [T.cols.map(c => c[1]), ...trkFiltered().map(r => T.cols.map(c => r[c[0]]))]);
      return;
    }
    if (view === 'portfolio') {
      download('am-portfolio.csv', [['Asset', 'Stage', 'Revenue OMR m', 'Budget OMR m', 'EBITDA OMR m'], ...portfolioRows().map(s => [s.n, s.st, s.rev, s.bud, s.eb])]);
      return;
    }
    if (view === 'company') {
      const isOnldc = companyCode === 'ONLDC',
        s = isOnldc ? {
          code: 'ONLDC',
          n: 'ONLDC'
        } : effectiveSubs().find(s => s.code === companyCode);
      download(`am-${s.code}-${companySection}.csv`, [['Asset', 'Section', 'Update', 'As of', 'Owner', 'Status', 'Commentary'], ...trkRows('overview').filter(r => r.sub === s.n && sectionMatches(r.section, companySection)).map(r => [r.sub, r.section, r.t, r.date, r.owner, r.status, r.next]), [], isOnldc ? ['FY2025 audited', 'Revenue OMR m', 'Net profit OMR m'] : ['Finance baseline', 'Revenue OMR m', 'Budget OMR m', 'EBITDA OMR m'], isOnldc ? [s.n, ONLDC.pl[2025].revenue / 1e6, ONLDC.pl[2025].np / 1e6] : [s.n, s.rev, s.bud, s.eb]]);
      return;
    }
    if (view.startsWith('rep-')) {
      const doc = $('#repDoc');
      download(`am-${view}.csv`, [['Report', VIEWS[view]], ['Scope', assetFilter], ['Draft text', doc?.innerText || '']]);
      return;
    }
    download('am-interventions.csv', [taskCols.map(c => c[1]), ...assetRows('actions').map(r => taskCols.map(c => r[c[0]]))]);
  }
  scope.listen(document, 'click', e => {
    if (!role.apps.includes(APP_ID)) return;
    const edit = e.target.closest('[data-edit]');
    if (edit) {
      openSheet(edit.dataset.key, edit.dataset.edit);
      return;
    }
    const del = e.target.closest('[data-delete]');
    if (del) {
      removeRecord(del.dataset.delete);
      return;
    }
    const file = e.target.closest('[data-file]');
    if (file) {
      downloadFile(file.dataset.file);
      return;
    }
    const sample = e.target.closest('[data-sample]');
    if (sample) {
      sampleDownload(sample.dataset.sample);
      return;
    }
    if (e.target.closest('[data-company-update]')) {
      openSheet('overview', null, {
        sub: 'Subsidiary ' + companyCode,
        section: COMPANY_SECTIONS.find(s => s[0] === companySection)[1]
      });
      return;
    }
    const sort = e.target.closest('[data-sort]');
    if (sort) {
      sortDir = sortBy === sort.dataset.sort ? -sortDir : -1;
      sortBy = sort.dataset.sort;
      $('#portfolioTable').innerHTML = portfolioTable();
    }
  });
  scope.listen(document, 'change', e => {
    if (e.target.id === 'assetFilter') {
      assetFilter = e.target.value;
      render();
    }
    if (e.target.id === 'companyPick') go('company|' + e.target.value + '|' + companySection);
    if (e.target.id === 'perfAsset') go('assetperf|' + e.target.value + '|' + perfYear);
    if (e.target.id === 'perfYearSel') go('assetperf|' + perfCode + '|' + e.target.value);
    if (e.target.matches('[data-role="financials-import"]')) handleFinancialsImport(e.target);
  });
  scope.listen(document, 'input', e => {
    if (e.target.id === 'portfolioQuery') {
      portfolioQuery = e.target.value;
      $('#portfolioTable').innerHTML = portfolioTable();
    }
  });
  scope.listen(window, 'storage', e => {
    if (['ofc-tracker-entries', 'ofc-am-edits', 'ofc-live-assets', 'ofc-live-asset-status'].includes(e.key)) {
      const rows = readJSON('ofc-tracker-entries', []);
      if (Array.isArray(rows)) TLOCAL = rows;
      EDITS = readJSON('ofc-am-edits', {});
      if (!sheetOpen) render();
    }
  });

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
      toast('Draft refreshed from the current tracker data.');
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
  readRoute();
  render();
}
