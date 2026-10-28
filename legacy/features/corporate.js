import { dashboardCreateLink } from "./dashboard-create-link.js";
import { REV_A, REV_B, EB_A, EB_B, SUBS, DECISIONS } from "./group-data";
import marketSnapshot from "../lib/market-snapshot.json";
export function initialize(scope) {
  /* ---------- Data: taken only from the current OFC build ---------- */
  const DEPTS = [{
    n: 'Investment',
    v: 74,
    s: 'Target',
    app: 'investment'
  }, {
    n: 'Finance',
    v: 81,
    s: 'Target'
  }, {
    n: 'Corporate Support',
    v: 69,
    s: 'Below Target'
  }, {
    n: 'GRC',
    v: 88,
    s: 'Above Target'
  }, {
    n: 'Internal Audit',
    v: 92,
    s: 'Above Target'
  }, {
    n: 'Stakeholders',
    v: 77,
    s: 'Target'
  }];
  const SCORE = [{
    k: 'Target',
    n: 2,
    c: '#344B37'
  }, {
    k: 'Above Target',
    n: 1,
    c: '#B7C997'
  }, {
    k: 'Exceptional',
    n: 3,
    c: '#A9CD69'
  }, {
    k: 'Below Target',
    n: 5,
    c: '#F3BD7A'
  }, {
    k: 'Not started',
    n: 1,
    c: '#D8DFCA'
  }];
  /* Same 12 KPIs as the Strategy app's OFC Corporate KPIs Tracker, so each links straight to its cause (Commentary). */
  const KPIS = [{
    t: 'Revenue growth on last year',
    dept: 'Finance',
    target: '5.0%',
    actual: '7.4%',
    status: 'Exceptional',
    next: 'Growth from Subsidiaries A and F'
  }, {
    t: 'Revenue against budget',
    dept: 'Finance',
    target: '100%',
    actual: '95.1%',
    status: 'Below Target',
    next: 'Volume shortfall at K, E and B'
  }, {
    t: 'EBITDA margin',
    dept: 'Finance',
    target: '13.1%',
    actual: '12.1%',
    status: 'Below Target',
    next: 'Feed costs at poultry operations'
  }, {
    t: 'Net profit against budget',
    dept: 'Finance',
    target: '8.9m',
    actual: '6.2m',
    status: 'Below Target',
    next: 'EBITDA shortfall and higher finance costs'
  }, {
    t: 'Net debt / EBITDA',
    dept: 'Treasury',
    target: '4.50x or lower',
    actual: '4.69x',
    status: 'Below Target',
    next: 'Covenant limit is 5.00x'
  }, {
    t: 'Portfolio companies meeting revenue budget',
    dept: 'Asset Management',
    target: '10 of 14',
    actual: '2 of 14',
    status: 'Below Target',
    next: 'Only F and L ahead of budget'
  }, {
    t: 'Local protein production growth',
    dept: 'Asset Management',
    target: '8.0%',
    actual: '12.0%',
    status: 'Exceptional',
    next: 'Capacity additions at A and B'
  }, {
    t: 'Shareholder reports submitted on time',
    dept: 'Strategy',
    target: '3 of 3',
    actual: '3 of 3',
    status: 'Target',
    next: ''
  }, {
    t: 'New opportunities screened',
    dept: 'Investment',
    target: '12',
    actual: '19',
    status: 'Exceptional',
    next: 'Strong origination pipeline'
  }, {
    t: 'Stage-gate decisions within agreed time',
    dept: 'Investment',
    target: '90%',
    actual: '91%',
    status: 'Target',
    next: ''
  }, {
    t: 'Internal audit plan completion',
    dept: 'Internal Audit',
    target: '70%',
    actual: '78%',
    status: 'Above Target',
    next: ''
  }, {
    t: 'Employee engagement score',
    dept: 'Corporate Support',
    target: '75',
    actual: '—',
    status: 'Not started',
    next: 'Survey runs in November'
  }];
  /* ---------- Apps (from the department structure) ---------- */
  const APPS = [{
    id: 'corporate',
    n: 'Corporate',
    c: '#214A3C',
    g: '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="#fff"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="#fff"/>'
  }, {
    id: 'fa',
    n: 'Finance & Accounts',
    c: '#4B6B78',
    g: '<path d="M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1z" fill="#fff" opacity=".7"/><path d="M20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1z" fill="#fff"/>'
  }, {
    id: 'treasury',
    n: 'Treasury',
    c: '#6E7F3A',
    g: '<path d="M12 3l9 5H3z" fill="#fff"/><rect x="5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="10.75" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="16.5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="3" y="18" width="18" height="2.5" rx=".5" fill="#fff"/>'
  }, {
    id: 'strategy',
    n: 'Strategy',
    c: '#3E6A3F',
    g: '<circle cx="12" cy="12" r="8.5" fill="#fff" opacity=".45"/><circle cx="12" cy="12" r="5.5" fill="#fff" opacity=".75"/><circle cx="12" cy="12" r="2.5" fill="#fff"/>'
  }, {
    id: 'investment',
    n: 'Investment & Deals',
    c: '#7FA84A',
    g: '<path d="M5 19L17 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 6h10v10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  }, {
    id: 'pmo',
    n: 'PMO',
    c: '#8A6B4E',
    g: '<rect x="4" y="5" width="9" height="3.5" rx="1.5" fill="#fff"/><rect x="8" y="10.25" width="10" height="3.5" rx="1.5" fill="#fff" opacity=".75"/><rect x="12" y="15.5" width="8" height="3.5" rx="1.5" fill="#fff" opacity=".55"/>'
  }, {
    id: 'am',
    n: 'Asset Management',
    c: '#2D5A6B',
    g: '<path d="M12 3l9 4.5-9 4.5-9-4.5z" fill="#fff"/><path d="M3 12l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".75"/><path d="M3 16.5l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>'
  }, {
    id: 'admin',
    n: 'Admin / Settings',
    c: '#56645C',
    g: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
  }];
  const ROLES = [{
    id: 'ceo',
    n: 'Group CEO',
    i: 'CEO',
    d: 'All apps',
    apps: APPS.map(a => a.id)
  }, {
    id: 'cfo',
    n: 'Group CFO',
    i: 'CFO',
    d: 'Corporate and Finance apps',
    apps: ['corporate', 'fa', 'treasury']
  }, {
    id: 'cio',
    n: 'Group CIO',
    i: 'CIO',
    d: 'Corporate and Investment apps',
    apps: ['corporate', 'strategy', 'investment', 'pmo', 'am']
  }, {
    id: 'amd',
    n: 'Asset Management Director',
    i: 'AMD',
    d: 'Corporate and Asset Management',
    apps: ['corporate', 'am']
  }];
  let role = ROLES[0];
  try {
    role = ROLES.find(r => r.id === localStorage.getItem('ofc-role')) || ROLES[0];
  } catch (e) {}

  /* ---------- Helpers ---------- */
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  function toast(m) {
    const t = $('#toast');
    t.textContent = m;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = scope.setTimeout(() => t.classList.remove('show'), 3000);
  }
  const arrow = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10l6-6M5 4h5v5"/></svg>';
  function openApp(id) {
    const a = APPS.find(x => x.id === id);
    if (!a) return;
    closeFlyouts();
    if (!role.apps.includes(id)) {
      toast(`${role.n} doesn't have access to ${a.n}.`);
      return;
    }
    if (id === 'corporate') {
      toast('You are in Corporate.');
      return;
    }
    if (APP_FILES[id]) {
      location.href = APP_FILES[id];
      return;
    }
    toast(`Opening ${a.n}…`);
  }

  /* ---------- Department BSC ---------- */
  const cls = s => s === 'Below Target' ? 'below' : s === 'Above Target' ? 'above' : 'target';
  $('#cols').innerHTML = DEPTS.map((d, i) => `<div class="col${d.app ? ' link' : ''}" ${d.app ? `data-app="${d.app}" role="button" tabindex="0" aria-label="${d.n} ${d.v}%, open app"` : `aria-label="${d.n} ${d.v}%"`}><div class="bar ${cls(d.s)}" style="height:${d.v}%;animation-delay:${i * 50}ms"><span class="v num">${d.v}%</span></div></div>`).join('');
  $('#xlabels').innerHTML = DEPTS.map(d => `<div><b>${d.n}</b><span>${d.s}</span>${d.app ? `<button class="open" data-app="${d.app}">Open app${arrow}</button>` : ''}</div>`).join('');
  function kpiPill(s) {
    return `<span class="pill${s === 'Below Target' ? ' below' : s === 'Not started' ? ' neu' : ''}">${escH(s)}</span>`;
  }
  function renderKPICauses() {
    $('#kpiCauses').innerHTML = KPIS.map(k => `<li><button class="kpi-link" data-link="/strategy#trk-kpi|${escH(encodeURIComponent(k.t))}" data-lapp="strategy" aria-label="${escH(k.t)}, ${escH(k.status)}, see cause in Strategy">
    <span><b>${escH(k.t)}</b><small>${escH(k.dept)} · target ${escH(k.target)} · actual ${escH(k.actual)}</small></span>
    ${kpiPill(k.status)}</button></li>`).join('');
  }

  /* ---------- Scorecard donut ---------- */
  (function () {
    const tot = SCORE.reduce((a, b) => a + b.n, 0),
      r = 15.915;
    let off = 0;
    $('#donut').innerHTML = SCORE.map(s => {
      const p = s.n / tot * 100;
      const e = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${s.c}" stroke-width="5" stroke-dasharray="${p - .8} ${100 - p + .8}" stroke-dashoffset="${-off}"/>`;
      off += p;
      return e;
    }).join('');
    $('#legend').innerHTML = SCORE.map(s => `<li><i style="background:${s.c}"></i><span>${s.k}</span><span class="n num">${s.n}</span><span class="p num">${Math.round(s.n / tot * 100)}%</span></li>`).join('');
  })();

  /* ---------- Needs your attention ---------- */
  const icoEsc = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.2"/><path d="M8 4.8V8.2l2.2 1.3"/></svg>';
  const icoPend = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1.8l6 6.2-6 6.2L2 8z"/></svg>';
  /* rendered by refresh() */

  /* ================= Side bar: input, reports, dashboards ================= */
  const BASE = {
    actions: 6,
    actionsOpen: 3,
    initiatives: 4
  };
  const REGS = ['Decisions', 'Actions', 'Initiatives'];
  const DEPT_LIST = ['Corporate', 'Investment', 'Finance', 'Corporate Support', 'GRC', 'Internal Audit', 'Stakeholders', 'CEO Office'];
  const STATUS_LIST = ['Open', 'Pending', 'Escalated', 'Closed'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DASH = [{
    app: 'fa',
    items: ['Group P&L', 'Balance Sheet', 'Cash Flow Statement', 'Subsidiary Financial Performance', 'Consolidated Financial Statements']
  }, {
    app: 'treasury',
    items: ['Group Cash Position', 'Liquidity', 'Debt', 'Banking Facilities', 'Funding']
  }, {
    app: 'strategy',
    items: ['Portfolio Strategy', 'Business Plan (5 years)', 'Budget vs Actual', 'Funding and Capital Planning', 'Governance & Shareholder', 'Strategy Interventions, Actions & Tasks', 'Corporate KPIs']
  }, {
    app: 'investment',
    items: ['Pipeline Overview', 'Transaction Overview', 'Opportunity Screening & Origination', 'Partner / KYC & Background Check', 'PIN / Origination Approval', 'In-House Assessment / Pre-Feasibility', 'Executive Committee Review', 'Due Diligence / Independent Vetting', 'Final Evaluation & FID', 'Post-FID Legal Closing & PMO Handover']
  }, {
    app: 'pmo',
    items: ['Project Delivery', 'Commissioning & Punch Lists', 'Operations Handover Readiness', 'Risks & Escalations', 'Financial Close-out']
  }, {
    app: 'am',
    items: ['Portfolio Overall Performance', 'Interventions & Actions', 'Asset / Company 360°']
  }];
  const TRACKERS = [{
    sec: 'Finance',
    app: 'fa',
    dept: 'Finance / Accounts',
    items: ['Monthly Closing Tracker', 'Financial Reporting Submission Tracker', 'Tax / Regulatory Compliance Tracker', 'Intercompany Reconciliation Tracker', 'Provision / Accrual Tracker', 'Audit Findings & Action Tracker']
  }, {
    sec: 'Finance',
    app: 'treasury',
    dept: 'Treasury',
    items: ['Daily / Weekly Cash Tracker', 'Debt Repayment Tracker', 'Facility Utilization Tracker', 'Covenant Tracker', 'Bank Guarantee Tracker', 'LC / Trade Finance Tracker', 'Shareholder Funding Tracker', 'Equity Injection / Shareholder Loan Tracker', 'Refinancing Tracker', 'Bank Negotiation / Term Sheet Tracker']
  }, {
    sec: 'Investment',
    app: 'strategy',
    dept: 'Strategy',
    items: ['Strategic Plan, Initiatives & Value Creation Tracker', '5-Year Business Plan Tracker', 'Annual Budget Tracker', 'Funding Plan Tracker', 'Portfolio Target Tracker', 'Strategy Actions / Interventions / Tasks Tracker', 'OFC Corporate KPIs Tracker']
  }, {
    sec: 'Investment',
    app: 'investment',
    dept: 'Investment & Deal Sourcing',
    items: ['Investment Pipeline Tracker', 'Stage-Gate & Approval Tracker', 'Due Diligence / Vetting Tracker', 'Partner / KYC Tracker', 'Investment Tasks Tracker', 'Legal Closing & CP Tracker', 'PMO Handover Tracker']
  }, {
    sec: 'Investment',
    app: 'pmo',
    dept: 'Project Management',
    items: ['Project Milestone Tracker', 'Commissioning Plan Tracker', 'Punch List Tracker', 'Project Risk Register', 'Operations Handover Tracker', 'Project Close-out Checklist', 'Financial Closure Tracker']
  }, {
    sec: 'Investment',
    app: 'am',
    dept: 'Asset Management',
    items: ['Asset Management Tracker', 'Asset Management Overview', 'Asset Documentation', 'Board / EC / Audit Packs', 'Asset Communications']
  }];
  /* Tracker fields. Where the deck lists a tracker's fields they are used as given;
     other trackers use the Finance central action tracker fields from the deck. */
  const OPT = {
    status: ['Not started', 'In progress', 'On hold', 'Completed'],
    priority: ['Critical', 'High', 'Medium', 'Low'],
    stage: ['Screening', 'PIN', 'CEO', 'EC', 'DD', 'Board', 'FID', 'Closing', 'Handover']
  };
  const GENERIC = [{
    k: 't',
    l: 'Description / action required',
    req: 1,
    full: 1
  }, {
    k: 'owner',
    l: 'Responsible owner'
  }, {
    k: 'date',
    l: 'Target completion date',
    type: 'date'
  }, {
    k: 'status',
    l: 'Current status',
    type: 'select',
    o: OPT.status
  }, {
    k: 'dep',
    l: 'Key dependencies / issues',
    type: 'textarea',
    full: 1
  }, {
    k: 'next',
    l: 'Next steps',
    type: 'textarea',
    full: 1
  }];
  const SUB = {
    k: 'sub',
    l: 'Subsidiary / asset',
    req: 1
  };
  const SCHEMA = {
    'Investment Pipeline Tracker': [{
      k: 't',
      l: 'Opportunity name',
      req: 1,
      full: 1
    }, {
      k: 'partner',
      l: 'Partner name'
    }, {
      k: 'sector',
      l: 'Sector'
    }, {
      k: 'type',
      l: 'Type of investment',
      type: 'select',
      o: ['Greenfield – Capital Project', 'Brownfield – M&A', 'Divestment']
    }, {
      k: 'value',
      l: 'Investment / divestment value',
      type: 'number'
    }, {
      k: 'stage',
      l: 'Current stage',
      type: 'select',
      o: OPT.stage
    }, {
      k: 'fit',
      l: 'Strategic fit'
    }, {
      k: 'owner',
      l: 'Owner'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Active', 'Inactive', 'Deferred', 'Approved for next stage', 'Declined']
    }, {
      k: 'date',
      l: 'Target date',
      type: 'date'
    }, {
      k: 'progress',
      l: 'Progress %',
      type: 'number'
    }, {
      k: 'next',
      l: 'Next step',
      full: 1
    }],
    'Stage-Gate & Approval Tracker': [{
      k: 't',
      l: 'Opportunity',
      req: 1,
      full: 1
    }, {
      k: 'stage',
      l: 'Stage',
      type: 'select',
      o: OPT.stage
    }, {
      k: 'decision',
      l: 'Decision'
    }, {
      k: 'subm',
      l: 'Submission date',
      type: 'date'
    }, {
      k: 'date',
      l: 'Approval date',
      type: 'date'
    }, {
      k: 'cond',
      l: 'Conditions',
      type: 'textarea',
      full: 1
    }, {
      k: 'pend',
      l: 'Pending requirements',
      type: 'textarea',
      full: 1
    }, {
      k: 'comm',
      l: 'Comments',
      type: 'textarea',
      full: 1
    }],
    'Due Diligence / Vetting Tracker': [{
      k: 'ws',
      l: 'Workstream',
      type: 'select',
      o: ['Commercial DD', 'Financial DD', 'Technical DD', 'Legal DD', 'Market DD', 'Tax DD', 'ESG DD', 'Valuation', 'Financial model review', 'Independent feasibility-study vetting', 'Partner DD']
    }, {
      k: 'consultant',
      l: 'Consultant'
    }, {
      k: 't',
      l: 'Scope',
      req: 1,
      full: 1
    }, {
      k: 'budget',
      l: 'Budget',
      type: 'number'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'start',
      l: 'Start date',
      type: 'date'
    }, {
      k: 'date',
      l: 'Due date',
      type: 'date'
    }, {
      k: 'find',
      l: 'Key findings',
      type: 'textarea',
      full: 1
    }, {
      k: 'flags',
      l: 'Red flags',
      type: 'textarea',
      full: 1
    }, {
      k: 'out',
      l: 'Outstanding items',
      type: 'textarea',
      full: 1
    }],
    'Partner / KYC Tracker': [{
      k: 't',
      l: 'Partner name',
      req: 1,
      full: 1
    }, {
      k: 'ubo',
      l: 'Ownership / UBO'
    }, {
      k: 'cred',
      l: 'Partner credentials'
    }, {
      k: 'fin',
      l: 'Financial standing'
    }, {
      k: 'comp',
      l: 'Compliance'
    }, {
      k: 'conf',
      l: 'Conflicts'
    }, {
      k: 'docs',
      l: 'Documentation'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Cleared', 'Pending', 'Information Required', 'Concern', 'Reject']
    }, {
      k: 'flags',
      l: 'Red flags',
      type: 'textarea',
      full: 1
    }],
    'Investment Tasks Tracker': [{
      k: 'cat',
      l: 'Related to',
      type: 'select',
      o: ['Shareholder', 'Board / EC', 'Executives', 'Transaction / investors', 'Consultants / engagements', 'Others']
    }, {
      k: 'kind',
      l: 'Type',
      type: 'select',
      o: ['Action', 'Task', 'Intervention']
    }, {
      k: 't',
      l: 'Action / task / intervention',
      req: 1,
      full: 1
    }, {
      k: 'opp',
      l: 'Investment opportunity name'
    }, {
      k: 'owner',
      l: 'Owner'
    }, {
      k: 'date',
      l: 'Due date',
      type: 'date'
    }, {
      k: 'prio',
      l: 'Priority',
      type: 'select',
      o: OPT.priority
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'dep',
      l: 'Dependency'
    }, {
      k: 'next',
      l: 'Next step',
      full: 1
    }],
    'Legal Closing & CP Tracker': [{
      k: 'doc',
      l: 'Document / CP',
      type: 'select',
      o: ['SHA', 'SPA', 'JV Agreement', 'Financing Agreement', 'Loan Agreement', 'Offtake Agreement', 'Technical Service Agreement', 'Supply Agreements', 'Condition precedent', 'Other transaction document']
    }, {
      k: 'owner',
      l: 'Owner / responsible party'
    }, {
      k: 't',
      l: 'Description',
      req: 1,
      full: 1
    }, {
      k: 'legal',
      l: 'Legal status'
    }, {
      k: 'cps',
      l: 'Counterparty status'
    }, {
      k: 'neg',
      l: 'Negotiation status'
    }, {
      k: 'date',
      l: 'Target signing / due date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Final status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'evid',
      l: 'Supporting evidence',
      type: 'file',
      full: 1
    }],
    'PMO Handover Tracker': [{
      k: 't',
      l: 'Investment / project',
      req: 1,
      full: 1
    }, {
      k: 'item',
      l: 'Handover item',
      type: 'select',
      o: ['Approved scope', 'Budget', 'Schedule', 'Financial model', 'Feasibility study', 'DD reports', 'Risk register', 'Legal documents', 'Board conditions', 'Handover acceptance']
    }, {
      k: 'owner',
      l: 'Owner'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'date',
      l: 'Target date',
      type: 'date'
    }, {
      k: 'next',
      l: 'Notes',
      type: 'textarea',
      full: 1
    }],
    'Asset Management Tracker': [SUB, {
      k: 'type',
      l: 'Type of task',
      type: 'select',
      o: ['AM Intervention', 'Action Task', 'Ad Hoc request', 'Other']
    }, {
      k: 't',
      l: 'Task title',
      req: 1,
      full: 1
    }, {
      k: 'desc',
      l: 'Task description',
      type: 'textarea',
      full: 1
    }, {
      k: 'party',
      l: 'Related party'
    }, {
      k: 'prio',
      l: 'Criticality / priority',
      type: 'select',
      o: OPT.priority
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'owner',
      l: 'Owner and support'
    }, {
      k: 'date',
      l: 'Due date',
      type: 'date'
    }, {
      k: 'progress',
      l: 'Progress %',
      type: 'number'
    }, {
      k: 'newdate',
      l: 'New target date',
      type: 'date'
    }, {
      k: 'next',
      l: 'Next step'
    }],
    'Asset Management Overview': [SUB, {
      k: 'section',
      l: 'Section',
      type: 'select',
      o: ['About the company', 'Capital vs invested amount', 'Shareholder structure', 'Board seats', 'Debt facility & terms', 'Organization structure', 'Project components', '5-year business plan', 'Yearly budget', 'Audited financial statements', 'Quarterly financials & operations', 'Treasury & debt repayments', 'Headcount & HR', 'Risk register', 'Internal audit', 'Legal cases']
    }, {
      k: 't',
      l: 'Period',
      req: 1,
      full: 1,
      ph: 'e.g. FY2026 or Q3 2026'
    }, {
      k: 'file',
      l: 'Workbook or file',
      type: 'file',
      full: 1
    }, {
      k: 'next',
      l: 'Notes',
      type: 'textarea',
      full: 1
    }],
    'Asset Documentation': [SUB, {
      k: 'folder',
      l: 'Folder',
      type: 'select',
      o: ['Company information', 'Investment', 'Divestment', 'Business plan', 'Operations', 'Funding', 'Legal', 'Meeting packs', 'Communications', 'Financial performance', 'Consultancy services', 'Research & assessment', 'Valuations']
    }, {
      k: 't',
      l: 'Document title',
      req: 1,
      full: 1
    }, {
      k: 'file',
      l: 'File',
      type: 'file',
      full: 1
    }],
    'Board / EC / Audit Packs': [SUB, {
      k: 'forum',
      l: 'Forum',
      type: 'select',
      o: ['Board', 'Executive Committee', 'Audit Committee', 'Shareholder Committee', 'Constitutive Meeting']
    }, {
      k: 't',
      l: 'Pack title',
      req: 1,
      full: 1
    }, {
      k: 'date',
      l: 'Meeting date',
      type: 'date'
    }, {
      k: 'file',
      l: 'Pack file',
      type: 'file'
    }],
    'Asset Communications': [SUB, {
      k: 'dir',
      l: 'Direction',
      type: 'select',
      o: ['Inbox', 'Outbox']
    }, {
      k: 't',
      l: 'Subject',
      req: 1,
      full: 1
    }, {
      k: 'from',
      l: 'From / to'
    }, {
      k: 'date',
      l: 'Date received',
      type: 'date'
    }, {
      k: 'owner',
      l: 'Response owner'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: OPT.status
    }, {
      k: 'next',
      l: 'Response / next step',
      type: 'textarea',
      full: 1
    }]
  };
  const APP_REPORTS = [{
    app: 'pmo',
    items: ['PMO Executive Summary', 'Delivery Risk Report', 'Operations Handover Report']
  }, {
    app: 'fa',
    items: ['Monthly financial performance summary', 'Variance explanations', 'Accounting anomaly detection', 'Missing / unusual transaction alerts', 'Consolidated financial reporting', 'Audit information pack']
  }, {
    app: 'treasury',
    items: ['Cash-flow forecasting', 'Liquidity shortage alerts', 'Upcoming repayment alerts', 'Covenant breach warnings', 'Funding gap identification', 'Optimal funding-source recommendations', 'Treasury / debt summary for CFO and EC']
  }, {
    app: 'strategy',
    items: ['Executive Strategy Report', 'Portfolio Strategy Review / Updates', 'Funding Requirement Report', 'Executive Corporate KPI Performance Report', '5-Year Business Plan & Strategy Report']
  }, {
    app: 'investment',
    items: ['Weekly Investment Pipeline Report', 'Monthly Investment Portfolio / Pipeline Report', 'Pipeline Movement Report', 'Overdue Actions & Decisions Report', 'Investment Risk / Red-Flag Report', 'Upcoming Approval / Decision Calendar', 'Investment Summary']
  }, {
    app: 'am',
    items: ['Portfolio Interventions', 'Monthly & Quarterly Report', 'Board / EC / Audit Pack Review', 'Intervention Reports / Case Studies', 'Assessment / Benchmark Reports', 'Valuation Reports', 'Ad Hoc Report']
  }];
  /* Finance & Accounts tracker fields (same as the Finance & Accounts app) */
  const ENT = ['Holding', 'All entities', ...'ABCDEFGHIJKLMNOPQ'.split('').map(x => 'Subsidiary ' + x)];
  Object.assign(SCHEMA, {
    'Monthly Closing Tracker': [{
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
    'Financial Reporting Submission Tracker': [{
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
    'Tax / Regulatory Compliance Tracker': [{
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
    'Intercompany Reconciliation Tracker': [{
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
    'Provision / Accrual Tracker': [{
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
    'Audit Findings & Action Tracker': [{
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
    }]
  });
  /* Treasury tracker fields (same as the Treasury app) */
  const BANKS = ['Bank A', 'Bank B', 'Bank C', 'Bank D', 'Bank E (Islamic)', 'Bank F'];
  const FAC_N = ['Facility A', 'Facility B', 'Facility C', 'Facility D', 'Facility E', 'Facility F', 'Facility G'];
  Object.assign(SCHEMA, {
    'Daily / Weekly Cash Tracker': [{
      k: 'date',
      l: 'Week ending',
      type: 'date',
      req: 1
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Draft', 'Final']
    }, {
      k: 'open',
      l: 'Opening balance',
      type: 'number'
    }, {
      k: 'rec',
      l: 'Receipts',
      type: 'number'
    }, {
      k: 'pay',
      l: 'Payments',
      type: 'number'
    }, {
      k: 't',
      l: 'Commentary',
      req: 1,
      full: 1
    }],
    'Debt Repayment Tracker': [{
      k: 't',
      l: 'Facility',
      type: 'select',
      o: FAC_N,
      req: 1
    }, {
      k: 'bank',
      l: 'Bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'entity',
      l: 'Borrower',
      type: 'select',
      o: ENT
    }, {
      k: 'date',
      l: 'Due date',
      type: 'date'
    }, {
      k: 'prin',
      l: 'Principal (OMR m)',
      type: 'number'
    }, {
      k: 'int',
      l: 'Interest / profit (OMR m)',
      type: 'number'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Scheduled', 'Funds reserved', 'Paid']
    }, {
      k: 'next',
      l: 'Notes',
      type: 'textarea',
      full: 1
    }],
    'Facility Utilization Tracker': [{
      k: 't',
      l: 'Facility',
      req: 1
    }, {
      k: 'bank',
      l: 'Bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'entity',
      l: 'Borrower',
      type: 'select',
      o: ENT
    }, {
      k: 'type',
      l: 'Type',
      type: 'select',
      o: ['Term loan', 'Project finance', 'Revolving credit', 'Overdraft', 'Ijara', 'Murabaha', 'Trade finance line']
    }, {
      k: 'limit',
      l: 'Limit (OMR m)',
      type: 'number'
    }, {
      k: 'drawn',
      l: 'Drawn (OMR m)',
      type: 'number'
    }, {
      k: 'rate',
      l: 'Rate / profit rate %',
      type: 'number'
    }, {
      k: 'mat',
      l: 'Maturity',
      type: 'date'
    }, {
      k: 'status',
      l: 'Commitment',
      type: 'select',
      o: ['Committed', 'Uncommitted']
    }],
    'Covenant Tracker': [{
      k: 't',
      l: 'Covenant',
      req: 1,
      full: 1
    }, {
      k: 'fac',
      l: 'Facility',
      type: 'select',
      o: FAC_N
    }, {
      k: 'test',
      l: 'Requirement'
    }, {
      k: 'actual',
      l: 'Latest actual'
    }, {
      k: 'proj',
      l: 'Projected at next test'
    }, {
      k: 'date',
      l: 'Next test date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Compliant', 'At risk', 'Breach risk', 'Cure required']
    }, {
      k: 'next',
      l: 'Notes',
      type: 'textarea',
      full: 1
    }],
    'Bank Guarantee Tracker': [{
      k: 't',
      l: 'Guarantee',
      req: 1,
      full: 1
    }, {
      k: 'kind',
      l: 'Type',
      type: 'select',
      o: ['Performance', 'Advance payment', 'Bid bond', 'Customs', 'Financial', 'Other']
    }, {
      k: 'entity',
      l: 'Entity',
      type: 'select',
      o: ENT
    }, {
      k: 'benef',
      l: 'Beneficiary / counterparty'
    }, {
      k: 'bank',
      l: 'Bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'amt',
      l: 'Amount (OMR m)',
      type: 'number'
    }, {
      k: 'date',
      l: 'Expiry date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Active', 'Extension requested', 'Released', 'Called']
    }],
    'LC / Trade Finance Tracker': [{
      k: 't',
      l: 'LC reference',
      req: 1
    }, {
      k: 'entity',
      l: 'Applicant',
      type: 'select',
      o: ENT
    }, {
      k: 'supplier',
      l: 'Supplier / goods',
      full: 1
    }, {
      k: 'bank',
      l: 'Issuing bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'ccy',
      l: 'Currency',
      type: 'select',
      o: ['USD', 'EUR', 'OMR']
    }, {
      k: 'amt',
      l: 'Amount (m)',
      type: 'number'
    }, {
      k: 'ship',
      l: 'Latest shipment date',
      type: 'date'
    }, {
      k: 'date',
      l: 'Expiry date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Issued', 'Documents presented', 'Accepted', 'Paid', 'Expired']
    }],
    'Shareholder Funding Tracker': [{
      k: 't',
      l: 'Funding request',
      req: 1,
      full: 1
    }, {
      k: 'purpose',
      l: 'Purpose',
      full: 1
    }, {
      k: 'amt',
      l: 'Amount (OMR m)',
      type: 'number'
    }, {
      k: 'reqd',
      l: 'Requested on',
      type: 'date'
    }, {
      k: 'date',
      l: 'Expected receipt',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Draft', 'Submitted', 'Under shareholder review', 'Approved', 'Received']
    }],
    'Equity Injection / Shareholder Loan Tracker': [{
      k: 't',
      l: 'Recipient entity',
      type: 'select',
      o: ENT.slice(2),
      req: 1
    }, {
      k: 'kind',
      l: 'Type',
      type: 'select',
      o: ['Equity injection', 'Shareholder loan']
    }, {
      k: 'amt',
      l: 'Amount (OMR m)',
      type: 'number'
    }, {
      k: 'date',
      l: 'Date',
      type: 'date'
    }, {
      k: 'rate',
      l: 'Interest rate % (loans)',
      type: 'number'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Planned', 'Approved', 'Paid', 'Repaid']
    }, {
      k: 'next',
      l: 'Purpose / notes',
      type: 'textarea',
      full: 1
    }],
    'Refinancing Tracker': [{
      k: 't',
      l: 'Facility',
      type: 'select',
      o: FAC_N,
      req: 1
    }, {
      k: 'bank',
      l: 'Current bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'amt',
      l: 'Amount (OMR m)',
      type: 'number'
    }, {
      k: 'option',
      l: 'Refinancing option',
      full: 1
    }, {
      k: 'saving',
      l: 'Estimated annual saving (OMR m)',
      type: 'number'
    }, {
      k: 'date',
      l: 'Target date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Not started', 'Exploring', 'Term sheet received', 'Credit approval', 'Signed']
    }],
    'Bank Negotiation / Term Sheet Tracker': [{
      k: 't',
      l: 'Negotiation',
      req: 1,
      full: 1
    }, {
      k: 'bank',
      l: 'Bank',
      type: 'select',
      o: BANKS
    }, {
      k: 'amt',
      l: 'Amount (OMR m)',
      type: 'number'
    }, {
      k: 'price',
      l: 'Pricing'
    }, {
      k: 'tenor',
      l: 'Tenor'
    }, {
      k: 'date',
      l: 'Next milestone',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Initial discussion', 'Indicative terms', 'Term sheet received', 'Credit committee', 'Agreed', 'Declined']
    }, {
      k: 'next',
      l: 'Next step',
      type: 'textarea',
      full: 1
    }]
  });
  /* Strategy tracker fields (same as the Strategy app) */
  const ST_DEPTS = ['Strategy', 'Investment', 'Finance', 'Treasury', 'FP&A', 'PMO', 'Asset Management', 'Corporate Support', 'GRC', 'Internal Audit', 'CEO Office'];
  Object.assign(SCHEMA, {
    'Strategic Plan, Initiatives & Value Creation Tracker': [{
      k: 't',
      l: 'Initiative',
      req: 1,
      full: 1
    }, {
      k: 'dept',
      l: 'Lead department',
      type: 'select',
      o: ST_DEPTS
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
    '5-Year Business Plan Tracker': [{
      k: 't',
      l: 'Workstream',
      req: 1,
      full: 1
    }, {
      k: 'owner',
      l: 'Owner',
      type: 'select',
      o: ST_DEPTS
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
    'Annual Budget Tracker': [{
      k: 't',
      l: 'Milestone',
      req: 1,
      full: 1
    }, {
      k: 'owner',
      l: 'Owner',
      type: 'select',
      o: ST_DEPTS
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
    'Funding Plan Tracker': [{
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
    'Portfolio Target Tracker': [{
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
      o: ST_DEPTS
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['On track', 'Behind', 'At risk']
    }],
    'Strategy Actions / Interventions / Tasks Tracker': [{
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
    'OFC Corporate KPIs Tracker': [{
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
      o: ST_DEPTS
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
    }]
  });
  /* Investment tracker fields (same as the Investment app) */
  const INV_STEPS = ['Screening', 'PIN', 'CEO', 'EC', 'DD', 'Board', 'FID', 'Closing', 'Handover'];
  const INV_OWNERS = ['Senior Investment Manager', 'Investment Manager 1', 'Investment Manager 2', 'Investment Analyst', 'CIO'];
  const INV_DEALS = ['Al Jazir', 'AAAID stake divestment (ABMC/ANPC)', 'Project Nakhla', 'Project Marai', 'Project Sunbul', 'Project Raha', 'Subsidiary B capacity expansion', 'Project Bahr', 'Project Mawj', 'Project Sanam', 'Project Wadi', 'Project Seed', 'Project Laban', 'Project Burj', 'Project Jana', 'Project Samak', 'Project Qamh', 'Project Zaytoon', 'Project Karak', 'Project Luban', 'Project Rimal'];
  Object.assign(SCHEMA, {
    'Investment Pipeline Tracker': [{
      k: 't',
      l: 'Opportunity name',
      req: 1,
      full: 1
    }, {
      k: 'partner',
      l: 'Partner name'
    }, {
      k: 'sector',
      l: 'Sector'
    }, {
      k: 'type',
      l: 'Type of investment',
      type: 'select',
      o: ['Greenfield', 'Brownfield', 'Divestment']
    }, {
      k: 'value',
      l: 'Investment / divestment value (OMR m)',
      type: 'number'
    }, {
      k: 'ofc',
      l: 'Indicative OFC requirement (OMR m)',
      type: 'number'
    }, {
      k: 'stage',
      l: 'Current stage',
      type: 'select',
      o: INV_STEPS
    }, {
      k: 'fit',
      l: 'Strategic fit',
      type: 'select',
      o: ['High', 'Medium', 'Low']
    }, {
      k: 'prob',
      l: 'Probability %',
      type: 'number'
    }, {
      k: 'owner',
      l: 'Owner',
      type: 'select',
      o: INV_OWNERS
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Active', 'Inactive', 'Deferred', 'Approved for next stage', 'Declined']
    }, {
      k: 'date',
      l: 'Target date',
      type: 'date'
    }, {
      k: 'prog',
      l: 'Progress %',
      type: 'number'
    }, {
      k: 'next',
      l: 'Next step',
      full: 1
    }],
    'Stage-Gate & Approval Tracker': [{
      k: 't',
      l: 'Opportunity',
      type: 'select',
      o: INV_DEALS,
      req: 1,
      full: 1
    }, {
      k: 'step',
      l: 'Stage',
      type: 'select',
      o: INV_STEPS
    }, {
      k: 'subm',
      l: 'Submission date',
      type: 'date'
    }, {
      k: 'date',
      l: 'Approval / decision date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Decision',
      type: 'select',
      o: ['Pending', 'Approved to proceed', 'Approved subject to conditions', 'Additional information required', 'Deferred', 'Declined']
    }, {
      k: 'cond',
      l: 'Conditions',
      full: 1
    }, {
      k: 'pend',
      l: 'Pending requirements',
      full: 1
    }, {
      k: 'comm',
      l: 'Comments',
      type: 'textarea',
      full: 1
    }],
    'Due Diligence / Vetting Tracker': [{
      k: 't',
      l: 'Workstream',
      type: 'select',
      o: ['Commercial DD', 'Financial DD', 'Technical DD', 'Legal DD', 'Market DD', 'Tax DD', 'ESG DD', 'Valuation', 'Financial model review', 'Independent feasibility-study vetting', 'Partner DD'],
      req: 1
    }, {
      k: 'deal',
      l: 'Opportunity',
      type: 'select',
      o: INV_DEALS
    }, {
      k: 'cons',
      l: 'Consultant'
    }, {
      k: 'scope',
      l: 'Scope',
      full: 1
    }, {
      k: 'budget',
      l: 'Budget (OMR k)',
      type: 'number'
    }, {
      k: 'start',
      l: 'Start date',
      type: 'date'
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
      k: 'find',
      l: 'Key findings',
      type: 'textarea',
      full: 1
    }, {
      k: 'flags',
      l: 'Red flags',
      type: 'textarea',
      full: 1
    }, {
      k: 'out',
      l: 'Outstanding items',
      type: 'textarea',
      full: 1
    }],
    'Partner / KYC Tracker': [{
      k: 't',
      l: 'Partner',
      req: 1,
      full: 1
    }, {
      k: 'deal',
      l: 'Opportunity',
      type: 'select',
      o: INV_DEALS
    }, {
      k: 'ubo',
      l: 'Ownership / UBO'
    }, {
      k: 'cred',
      l: 'Credentials'
    }, {
      k: 'fin',
      l: 'Financial standing'
    }, {
      k: 'comp',
      l: 'Compliance / sanctions'
    }, {
      k: 'conf',
      l: 'Conflict of interest'
    }, {
      k: 'docs',
      l: 'Documentation'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Cleared', 'Pending', 'Information Required', 'Concern', 'Reject']
    }, {
      k: 'flags',
      l: 'Red flags',
      type: 'textarea',
      full: 1
    }],
    'Investment Tasks Tracker': [{
      k: 'cat',
      l: 'Related to',
      type: 'select',
      o: ['Shareholder', 'Board / EC', 'Executives', 'Transaction / investors', 'Consultants / engagements', 'Others']
    }, {
      k: 'kind',
      l: 'Type',
      type: 'select',
      o: ['Action', 'Task', 'Intervention']
    }, {
      k: 't',
      l: 'Action / task / intervention',
      req: 1,
      full: 1
    }, {
      k: 'deal',
      l: 'Investment opportunity',
      type: 'select',
      o: ['—', ...INV_DEALS]
    }, {
      k: 'owner',
      l: 'Owner',
      type: 'select',
      o: INV_OWNERS
    }, {
      k: 'date',
      l: 'Due date',
      type: 'date'
    }, {
      k: 'prio',
      l: 'Priority',
      type: 'select',
      o: ['Critical', 'High', 'Medium', 'Low']
    }, {
      k: 'attn',
      l: 'Needs attention from',
      type: 'select',
      o: ['—', 'CIO', 'CEO', 'CFO']
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Not started', 'In progress', 'Completed']
    }, {
      k: 'dep',
      l: 'Dependency'
    }, {
      k: 'next',
      l: 'Next step',
      full: 1
    }],
    'Legal Closing & CP Tracker': [{
      k: 't',
      l: 'Document / condition precedent',
      req: 1,
      full: 1
    }, {
      k: 'deal',
      l: 'Opportunity',
      type: 'select',
      o: INV_DEALS
    }, {
      k: 'kind',
      l: 'Type',
      type: 'select',
      o: ['Document', 'Condition precedent']
    }, {
      k: 'owner',
      l: 'Owner / responsible party'
    }, {
      k: 'legal',
      l: 'Legal status'
    }, {
      k: 'cps',
      l: 'Counterparty status'
    }, {
      k: 'neg',
      l: 'Negotiation status'
    }, {
      k: 'date',
      l: 'Target signing / due date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Final status',
      type: 'select',
      o: ['Not started', 'In negotiation', 'Agreed', 'Signed', 'Pending', 'Completed']
    }, {
      k: 'evid',
      l: 'Supporting evidence',
      type: 'file',
      full: 1
    }],
    'PMO Handover Tracker': [{
      k: 't',
      l: 'Handover item',
      type: 'select',
      o: ['FID package', 'Approved scope', 'Approved CAPEX', 'Approved schedule', 'Financial model', 'Feasibility study', 'DD reports', 'Risk register', 'Legal agreements', 'Key commitments', 'Board conditions', 'Handover meeting', 'PMO acceptance'],
      req: 1
    }, {
      k: 'deal',
      l: 'Opportunity',
      type: 'select',
      o: INV_DEALS
    }, {
      k: 'owner',
      l: 'Owner',
      type: 'select',
      o: [...INV_OWNERS, 'PMO']
    }, {
      k: 'date',
      l: 'Target date',
      type: 'date'
    }, {
      k: 'status',
      l: 'Status',
      type: 'select',
      o: ['Not started', 'In progress', 'Ready']
    }, {
      k: 'next',
      l: 'Notes',
      type: 'textarea',
      full: 1
    }]
  });
  const APP_FILES = {
    am: '/asset-management',
    pmo: '/pmo',
    fa: '/finance',
    treasury: '/treasury',
    strategy: '/strategy',
    investment: '/investment'
  };
  const PMO_LINKS = {
    'Project Delivery': 'delivery',
    'Commissioning & Punch Lists': 'commissioning',
    'Operations Handover Readiness': 'readiness',
    'Risks & Escalations': 'risks',
    'Financial Close-out': 'financial',
    'PMO Executive Summary': 'rep-exec',
    'Delivery Risk Report': 'rep-risk',
    'Operations Handover Report': 'rep-handover',
    'Project Milestone Tracker': 'trk-schedule',
    'Commissioning Plan Tracker': 'trk-commission',
    'Punch List Tracker': 'trk-punch',
    'Project Risk Register': 'trk-risk',
    'Operations Handover Tracker': 'trk-handover',
    'Project Close-out Checklist': 'trk-closeout',
    'Financial Closure Tracker': 'trk-finance'
  };
  const AM_LINKS = {
    'Portfolio Overall Performance': 'portfolio',
    'Interventions & Actions': 'interventions',
    'Asset / Company 360°': 'company',
    'Asset Management Tracker': 'trk-actions',
    'Asset Management Overview': 'trk-overview',
    'Asset Documentation': 'trk-docs',
    'Board / EC / Audit Packs': 'trk-packs',
    'Asset Communications': 'trk-comms',
    'Portfolio Interventions': 'rep-interventions',
    'Monthly & Quarterly Report': 'rep-period',
    'Board / EC / Audit Pack Review': 'rep-packs',
    'Intervention Reports / Case Studies': 'rep-cases',
    'Assessment / Benchmark Reports': 'rep-benchmark',
    'Valuation Reports': 'rep-valuation',
    'Ad Hoc Report': 'rep-adhoc'
  };
  const INV_LINKS = {
    'Pipeline Overview': 'pipe',
    'Transaction Overview': 'tx',
    'Opportunity Screening & Origination': 'scr',
    'Partner / KYC & Background Check': 'kycd',
    'PIN / Origination Approval': 'pin',
    'In-House Assessment / Pre-Feasibility': 'assess',
    'Executive Committee Review': 'ec',
    'Due Diligence / Independent Vetting': 'ddd',
    'Final Evaluation & FID': 'fid',
    'Post-FID Legal Closing & PMO Handover': 'closed',
    'Weekly Investment Pipeline Report': 'rep-weekly',
    'Monthly Investment Portfolio / Pipeline Report': 'rep-monthly',
    'Pipeline Movement Report': 'rep-move',
    'Overdue Actions & Decisions Report': 'rep-overdue',
    'Investment Risk / Red-Flag Report': 'rep-risk',
    'Upcoming Approval / Decision Calendar': 'rep-cal',
    'Investment Summary': 'rep-summary'
  };
  const ST_LINKS = {
    'Portfolio Strategy': 'pstrat',
    'Business Plan (5 years)': 'bpd',
    'Budget vs Actual': 'bva',
    'Funding and Capital Planning': 'fcp',
    'Governance & Shareholder': 'gov',
    'Strategy Interventions, Actions & Tasks': 'acts',
    'Corporate KPIs': 'kpid',
    'Executive Strategy Report': 'rep-exec',
    'Portfolio Strategy Review / Updates': 'rep-review',
    'Funding Requirement Report': 'rep-funding',
    'Executive Corporate KPI Performance Report': 'rep-kpi',
    '5-Year Business Plan & Strategy Report': 'rep-bp'
  };
  const TR_LINKS = {
    'Group Cash Position': 'cash',
    'Liquidity': 'liq',
    'Debt': 'debtd',
    'Banking Facilities': 'facd',
    'Funding': 'fund',
    'Cash-flow forecasting': 'rep-forecast',
    'Liquidity shortage alerts': 'rep-liq',
    'Upcoming repayment alerts': 'rep-repay',
    'Covenant breach warnings': 'rep-cov',
    'Funding gap identification': 'rep-gap',
    'Optimal funding-source recommendations': 'rep-source',
    'Treasury / debt summary for CFO and EC': 'rep-summary'
  };
  const FA_LINKS = {
    'Group P&L': 'pl',
    'Balance Sheet': 'bs',
    'Cash Flow Statement': 'cf',
    'Subsidiary Financial Performance': 'subs',
    'Consolidated Financial Statements': 'consol',
    'Monthly financial performance summary': 'rep-summary',
    'Variance explanations': 'rep-variance',
    'Accounting anomaly detection': 'rep-anomaly',
    'Missing / unusual transaction alerts': 'rep-alerts',
    'Consolidated financial reporting': 'rep-consol',
    'Audit information pack': 'rep-audit'
  };
  const REPORTS = [{
    id: 'decisions',
    n: 'Decisions report',
    d: 'Decisions awaiting a forum'
  }, {
    id: 'actions',
    n: 'Actions report',
    d: 'Key actions and interventions'
  }, {
    id: 'initiatives',
    n: 'Initiatives report',
    d: 'Strategic initiatives'
  }, {
    id: 'scorecard',
    n: 'Scorecard report',
    d: 'Department BSC and KPI status'
  }];
  const escH = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
  function fmtDate(v) {
    if (!v) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? `${m[3]}-${MON[+m[2] - 1]}-${m[1]}` : v;
  }
  let LOCAL = [];
  try {
    LOCAL = JSON.parse(localStorage.getItem('ofc-local-records') || '[]');
  } catch (e) {
    LOCAL = [];
  }
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
  function saveLocal() {
    try {
      localStorage.setItem('ofc-local-records', JSON.stringify(LOCAL));
    } catch (e) {}
  }
  const isOpen = s => s !== 'Closed';
  function allDecisions() {
    return DECISIONS.map(d => ({
      ...d,
      date: fmtDate(d.date)
    })).concat(LOCAL.filter(r => r.reg === 'Decisions').map(r => ({
      id: r.id,
      t: r.t,
      dept: r.dept,
      by: r.by || '—',
      forum: r.forum || '—',
      date: fmtDate(r.date),
      s: r.s,
      local: true
    })));
  }

  /* ---------- Page state ---------- */
  function refresh() {
    const dec = allDecisions().filter(d => isOpen(d.s));
    const esc = dec.filter(d => d.s === 'Escalated').length;
    $('#kDec').textContent = dec.length;
    $('#kDecSub').textContent = `${esc} escalated · ${dec.length - esc} pending`;
    const la = LOCAL.filter(r => r.reg === 'Actions');
    $('#kAct').textContent = BASE.actions + la.length;
    $('#kActSub').textContent = `${BASE.actionsOpen + la.filter(r => isOpen(r.s)).length} open actions`;
    $('#kIni').textContent = BASE.initiatives + LOCAL.filter(r => r.reg === 'Initiatives').length;
    const nLoc = LOCAL.length + TLOCAL.length;
    const rc = $('#railCount');
    rc.hidden = !nLoc;
    rc.textContent = nLoc;
    if (typeof pane !== 'undefined' && pane) renderPane(pane);
    const sorted = [...dec].sort((a, b) => a.s === 'Escalated' === (b.s === 'Escalated') ? 0 : a.s === 'Escalated' ? -1 : 1);
    $('#dlist').innerHTML = sorted.map(d => {
      const e = d.s === 'Escalated';
      return `<li><button class="drow" data-dec="${escH(d.id)}">
    <span class="ico ${e ? 'esc' : 'pend'}">${e ? icoEsc : icoPend}</span>
    <span><div class="t">${escH(d.t)}${d.local ? '<span class="newtag">New</span>' : ''}</div><div class="m">${escH(d.dept)} · ${escH(d.forum)}</div></span>
    <span class="col2"><small>Raised by</small>${escH(d.by)}</span>
    <span class="col2 num"><small>Decision by</small>${escH(d.date)}</span>
    <span class="st"><span class="pill ${e ? 'esc' : 'pend'}">${escH(d.s)}</span></span>
    <svg class="chev" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 3l4 4-4 4"/></svg>
  </button></li>`;
    }).join('');
  }

  /* ---------- Hover pane (SharePoint app bar) ---------- */
  const IC = {
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 3v10M3 8h10"/></svg>',
    upload: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M8 10.5V2.5M5 5.5l3-3 3 3M3 13.5h10"/></svg>',
    table: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="11" height="10" rx="1.2"/><path d="M2.5 6.5h11M6.5 6.5V13"/></svg>',
    doc: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 1.8h5.5l3 3v9.4H4z"/><path d="M9.5 1.8v3h3M6 8.5h4.5M6 11h4.5"/></svg>',
    dash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="2" width="5" height="6.5" rx="1"/><rect x="9" y="2" width="5" height="4" rx="1"/><rect x="9" y="8" width="5" height="6" rx="1"/><rect x="2" y="10.5" width="5" height="3.5" rx="1"/></svg>',
    chart: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 13.5h12M3.5 11l3-3.5 2.5 2 4-5"/></svg>',
    rec: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.2"/></svg>',
    chev: '<svg class="hp-cv" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 2.5L7.5 6 4 9.5"/></svg>',
    lock: '<svg class="hp-lock" viewBox="0 0 10 10" fill="currentColor"><rect x="1.5" y="4.5" width="7" height="5" rx="1"/><path d="M3 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'
  };
  let pane = null,
    pinned = false,
    hideT = null,
    showT = null,
    sheetKind = null;
  const openGroups = {
    input: new Set(),
    reports: new Set(),
    dashboards: new Set()
  };
  const hpItem = (attrs, icon, label, meta) => `<button class="hp-item" ${attrs}><span class="hp-ic">${icon}</span><span class="hp-t">${label}</span>${meta ? `<span class="hp-m">${meta}</span>` : ''}</button>`;
  const hpSec = t => `<div class="hp-sec">${t}</div>`;
  function hpGroups(kind, data, icon) {
    return data.map(g => {
      const a = APPS.find(x => x.id === g.app),
        locked = !role.apps.includes(a.id),
        open = openGroups[kind].has(a.id) && !locked;
      const head = `<button class="hp-g${locked ? ' locked' : ''}" data-grp="${kind}:${a.id}" aria-expanded="${open}"><span class="hp-mi" style="background:${a.c}"><svg viewBox="0 0 24 24">${a.g}</svg></span><span class="hp-t">${escH(g.dept || a.n)}</span>${locked ? IC.lock : `<span class="hp-m">${g.items.length || ''}</span>${IC.chev}`}</button>`;
      const body = open ? `<div class="hp-gb">${g.items.length ? g.items.map(i => {
        const n = kind === 'input' ? TLOCAL.filter(r => r.app === a.id && r.trk === i).length : 0;
        return hpItem(kind === 'input' ? `data-trk="${escH(i)}" data-dapp="${a.id}"` : `data-ext="${escH(i)}" data-dapp="${a.id}"`, icon, escH(i), n || '');
      }).join('') : `<div class="hp-note">${g.note || ''}</div>`}</div>` : '';
      return `<div class="hp-grp" data-open="${open}">${head}${body}</div>`;
    }).join('');
  }
  function renderPane(k) {
    $('#hpT').textContent = {
      input: 'Input',
      reports: 'Reports',
      dashboards: 'Dashboards'
    }[k];
    const cnt = {
      Decisions: allDecisions().length,
      Actions: BASE.actions + LOCAL.filter(r => r.reg === 'Actions').length,
      Initiatives: BASE.initiatives + LOCAL.filter(r => r.reg === 'Initiatives').length
    };
    let b = '';
    if (k === 'input') {
      const recent = [...LOCAL.map(r => ({
        at: r.at || 0,
        t: r.t,
        attr: `data-recent="${r.reg.toLowerCase()}"`
      })), ...TLOCAL.map(r => ({
        at: r.at,
        t: r.t,
        attr: `data-trk="${escH(r.trk)}" data-dapp="${r.app}"`
      }))].sort((x, y) => y.at - x.at).slice(0, 3);
      b = hpSec('Corporate') + REGS.map(r => hpItem(`data-reg="${r}"`, IC.table, `${r} tracker`, cnt[r])).join('') + hpItem('data-sheet="csv"', IC.upload, 'Import CSV') + hpSec('Finance') + hpGroups('input', TRACKERS.filter(t => t.sec === 'Finance'), IC.table) + hpSec('Investment') + hpGroups('input', TRACKERS.filter(t => t.sec === 'Investment'), IC.table) + (recent.length ? hpSec('Recent items') + recent.map(r => hpItem(r.attr, IC.rec, escH(r.t))).join('') : '');
    } else if (k === 'reports') {
      b = '<button type="button" class="hp-item" aria-label="Create client report" data-report-studio><span class="hp-t">Create client report</span><span class="hp-m">Siraaj</span></button>' + REPORTS.map(r => hpItem(`data-report="${r.id}"`, IC.doc, r.n, r.id === 'scorecard' ? '' : cnt[r.id[0].toUpperCase() + r.id.slice(1)])).join('') + hpSec('Department reports') + hpGroups('reports', APP_REPORTS, IC.doc);
    } else {
      b = hpItem('data-here', IC.dash, 'Corporate overview', '<span class="here">You are here</span>') + hpSec('Department dashboards') + hpGroups('dashboards', DASH, IC.chart) + dashboardCreateLink;
    }
    const sc = $('#hpB').scrollTop;
    $('#hpB').innerHTML = b;
    $('#hpB').scrollTop = sc;
  }
  function syncRail() {
    const k = pane || sheetKind || 'home';
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
    $('#hpB').scrollTop = 0;
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
  function railClick(k) {
    if (k === 'home') {
      hidePane();
      closeSheet();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    if (pane === k && pinned) {
      hidePane();
      return;
    }
    showPane(k, true);
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
  scope.listen($('#hpane'), 'click', e => {
    e.stopPropagation();
    closeFlyouts();
    const g = e.target.closest('[data-grp]');
    if (g) {
      const [k, id] = g.dataset.grp.split(':');
      const a = APPS.find(x => x.id === id);
      if (!role.apps.includes(id)) {
        toast(`${role.n} doesn't have access to ${a.n}.`);
        return;
      }
      pinned = true;
      openGroups[k].has(id) ? openGroups[k].delete(id) : openGroups[k].add(id);
      renderPane(k);
      return;
    }
    const sh = e.target.closest('[data-sheet]');
    if (sh) {
      openInputSheet(sh.dataset.sheet);
      return;
    }
    const rg = e.target.closest('[data-reg]');
    if (rg) {
      openInputSheet('new', rg.dataset.reg);
      return;
    }
    const rc = e.target.closest('[data-recent]');
    if (rc) {
      openReport(rc.dataset.recent);
      return;
    }
    const rp = e.target.closest('[data-report]');
    if (rp) {
      openReport(rp.dataset.report);
      return;
    }
    if (e.target.closest('[data-here]')) {
      hidePane();
      closeSheet();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    const tk = e.target.closest('[data-trk]');
    if (tk) {
      const a = APPS.find(y => y.id === tk.dataset.dapp);
      if (!role.apps.includes(a.id)) {
        toast(`${role.n} doesn't have access to ${a.n}.`);
        return;
      }
      if (a.id === 'am') {
        location.href = APP_FILES.am + '#' + AM_LINKS[tk.dataset.trk];
        return;
      }
      if (a.id === 'pmo') {
        location.href = APP_FILES.pmo + '#' + PMO_LINKS[tk.dataset.trk];
        return;
      }
      openTrackerSheet(a.id, tk.dataset.trk);
      return;
    }
    const x = e.target.closest('[data-ext]');
    if (x && APP_FILES[x.dataset.dapp]) {
      const L = {
          am: AM_LINKS,
          pmo: PMO_LINKS,
          fa: FA_LINKS,
          treasury: TR_LINKS,
          strategy: ST_LINKS,
          investment: INV_LINKS
        }[x.dataset.dapp],
        h = L[x.dataset.ext],
        ap = APPS.find(y => y.id === x.dataset.dapp);
      if (h) {
        if (!role.apps.includes(ap.id)) {
          toast(`${role.n} doesn't have access to ${ap.n}.`);
          return;
        }
        location.href = APP_FILES[ap.id] + '#' + h;
        return;
      }
    }
    if (x) {
      const a = APPS.find(y => y.id === x.dataset.dapp);
      hidePane();
      toast(`Opening ${x.dataset.ext} in ${a.n}…`);
      return;
    }
  });

  /* ---------- Sheet (form, import and report views) ---------- */
  function openSheet(kind) {
    closeFlyouts();
    hidePane();
    sheetKind = kind;
    syncRail();
    const p = $('#panel');
    p.classList.add('open');
    p.setAttribute('aria-hidden', 'false');
    $('#pscrim').classList.add('open');
    $('#pBack').hidden = true;
    $('#panelB').innerHTML = '';
    $('#panelB').scrollTop = 0;
  }
  function closeSheet() {
    sheetKind = null;
    syncRail();
    const p = $('#panel');
    p.classList.remove('open', 'wide');
    p.setAttribute('aria-hidden', 'true');
    $('#pscrim').classList.remove('open');
    document.body.classList.remove('print-report');
  }
  function openInputSheet(mode, reg) {
    openSheet('input');
    $('#panel').classList.remove('wide');
    document.body.classList.remove('print-report');
    renderInput(mode, reg);
  }
  const closePanel = closeSheet;
  let trk = null;
  function openTrackerSheet(app, name) {
    openSheet('input');
    $('#panel').classList.remove('wide');
    document.body.classList.remove('print-report');
    trk = {
      app,
      name
    };
    renderTracker();
  }
  function fieldHTML(f) {
    const lab = `<span>${escH(f.l)}${f.req ? ' <span class="req">*</span>' : ''}</span>`;
    let c;
    if (f.type === 'select') c = `<select name="${f.k}">${f.o.map(o => `<option>${escH(o)}</option>`).join('')}</select>`;else if (f.type === 'textarea') c = `<textarea name="${f.k}" rows="2"></textarea>`;else if (f.type === 'file') c = `<input type="file" name="${f.k}">`;else c = `<input name="${f.k}" type="${f.type || 'text'}"${f.type === 'number' ? ' min="0" step="any"' : ''}${f.ph ? ` placeholder="${escH(f.ph)}"` : ''} autocomplete="off"${f.req ? ' data-req="1"' : ''}>`;
    return `<label class="${f.full ? 'full' : ''}">${lab}${c}</label>`;
  }
  function renderTracker() {
    const {
        app,
        name
      } = trk,
      a = APPS.find(x => x.id === app),
      g = TRACKERS.find(t => t.app === app),
      fields = SCHEMA[name] || GENERIC;
    const entries = TLOCAL.filter(r => r.app === app && r.trk === name);
    $('#panelT').textContent = name;
    $('#panelB').innerHTML = `<div class="trk-meta"><span class="hp-mi" style="background:${a.c}"><svg viewBox="0 0 24 24">${a.g}</svg></span><span>${escH(g.dept)} · ${g.sec}</span></div>
  <form class="pform" id="trkForm" novalidate>${fields.map(fieldHTML).join('')}
    <p class="err" id="trkErr" hidden>Fill in the fields marked *.</p>
    <div class="full pf-foot"><span>Saved in this browser.</span><button class="btn" type="submit">Add to tracker</button></div>
  </form>
  ${entries.length ? `<div class="loc"><div class="loc-h"><h3>Added to this tracker (${entries.length})</h3></div><ul>${entries.map(r => `<li><span><b>${escH(r.t)}</b><small>${escH([r.d.sub, r.d.owner, r.d.status, r.d.date && fmtDate(r.d.date)].filter(Boolean).join(' · ') || '—')}</small></span><button class="pbtn" data-tdel="${r.id}" aria-label="Remove ${escH(r.t)}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></li>`).join('')}</ul></div>` : ''}`;
  }
  function onTrackerSubmit(f) {
    const fields = SCHEMA[trk.name] || GENERIC,
      d = {};
    let bad = false;
    fields.forEach(x => {
      const el = f.elements[x.k];
      let v = x.type === 'file' ? el.files[0] ? el.files[0].name : '' : (el.value || '').trim();
      d[x.k] = v;
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
      app: trk.app,
      trk: trk.name,
      t: d.t,
      d
    });
    saveT();
    refresh();
    renderTracker();
    toast(`Added to ${trk.name}.`);
  }

  /* ---------- Input data ---------- */
  let inputMode = 'new',
    inputReg = 'Decisions',
    csvRows = [];
  function renderInput(mode, reg) {
    inputMode = mode;
    inputReg = reg || inputReg || 'Decisions';
    $('#panelT').textContent = mode === 'csv' ? 'Import CSV' : `New record`;
    const opts = (a, sel) => a.map(o => `<option${o === sel ? ' selected' : ''}>${o}</option>`).join('');
    const form = `<form class="pform" id="recForm" novalidate>
    <label>Register<select name="reg">${opts(REGS, inputReg)}</select></label>
    <label>Status<select name="s">${opts(STATUS_LIST, inputReg === 'Decisions' ? 'Pending' : 'Open')}</select></label>
    <label class="full">Title<input name="t" autocomplete="off" placeholder="What needs deciding or doing"></label>
    <label>Department<select name="dept">${opts(DEPT_LIST, 'Corporate')}</select></label>
    <label>Owner / raised by<input name="by" autocomplete="off"></label>
    <label>Due / decision date<input type="date" name="date"></label>
    <label>Forum<input name="forum" autocomplete="off" placeholder="e.g. EC, BEC"></label>
    <p class="err" id="recErr" hidden>Add a title to save this record.</p>
    <div class="full pf-foot"><span>Saved in this browser and included in reports.</span><button class="btn" type="submit">Save record</button></div>
  </form>`;
    const csv = `<div class="csv">
    <p>Check rows before adding them. Expected columns:</p>
    <p><code>register, title, department, owner, date, forum, status</code></p>
    <button class="linkbtn" data-template>Download CSV template</button>
    <label class="drop" id="drop"><input type="file" accept=".csv,text/csv" id="csvIn"><b>Choose a CSV file</b><span>or drop it here</span></label>
    <div id="csvPrev"></div>
  </div>`;
    const loc = LOCAL.length ? `<div class="loc"><div class="loc-h"><h3>Added in this browser (${LOCAL.length})</h3><button class="linkbtn" data-clear>Clear all</button></div><ul>${LOCAL.map(r => `<li><span><b>${escH(r.t)}</b><small>${r.reg} · ${escH(r.dept)} · ${escH(r.s)}${r.date ? ' · ' + fmtDate(r.date) : ''}</small></span><button class="pbtn" data-del="${r.id}" aria-label="Remove ${escH(r.t)}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></li>`).join('')}</ul></div>` : '';
    $('#panelB').innerHTML = `<div class="pseg" role="tablist"><button role="tab" aria-selected="${mode === 'new'}" data-imode="new">New record</button><button role="tab" aria-selected="${mode === 'csv'}" data-imode="csv">Import CSV</button></div>` + (mode === 'new' ? form : csv) + loc;
    if (mode === 'csv') bindCsv();
  }
  function addRecord(r) {
    LOCAL.unshift({
      at: Date.now(),
      id: 'LOC-' + Date.now().toString(36).slice(-5).toUpperCase(),
      reg: r.reg,
      t: r.t,
      dept: r.dept || 'Corporate',
      by: r.by || '',
      date: r.date || '',
      forum: r.forum || '',
      s: r.s || 'Open'
    });
  }
  function onSubmit(f) {
    const d = Object.fromEntries(new FormData(f).entries());
    d.t = (d.t || '').trim();
    if (!d.t) {
      f.t.classList.add('bad');
      $('#recErr').hidden = false;
      f.t.focus();
      return;
    }
    addRecord(d);
    inputReg = d.reg;
    saveLocal();
    refresh();
    renderInput('new');
    toast(d.reg === 'Decisions' && isOpen(d.s) ? 'Record saved. It now shows in Needs your attention.' : `Record saved to ${d.reg}.`);
  }
  function parseCSV(text) {
    const rows = [];
    let row = [],
      f = '',
      q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            f += '"';
            i++;
          } else q = false;
        } else f += c;
      } else if (c === '"') q = true;else if (c === ',') {
        row.push(f);
        f = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f);
        f = '';
        if (row.some(x => x.trim())) rows.push(row);
        row = [];
      } else f += c;
    }
    row.push(f);
    if (row.some(x => x.trim())) rows.push(row);
    return rows;
  }
  function checkRows(rows) {
    const head = rows[0].map(h => h.trim().toLowerCase());
    const idx = k => head.indexOf(k);
    const get = (r, k) => idx(k) > -1 ? (r[idx(k)] || '').trim() : '';
    return rows.slice(1).map(r => {
      const regRaw = get(r, 'register').toLowerCase();
      const reg = REGS.find(x => x.toLowerCase() === regRaw || x.toLowerCase().slice(0, -1) === regRaw);
      const sRaw = get(r, 'status');
      const s = STATUS_LIST.find(x => x.toLowerCase() === sRaw.toLowerCase()) || (sRaw ? null : 'Open');
      const t = get(r, 'title');
      const issues = [];
      if (!reg) issues.push('Unknown register');
      if (!t) issues.push('Missing title');
      if (!s) issues.push('Unknown status');
      return {
        reg,
        t,
        dept: get(r, 'department') || 'Corporate',
        by: get(r, 'owner'),
        date: get(r, 'date'),
        forum: get(r, 'forum'),
        s,
        issues
      };
    });
  }
  function bindCsv() {
    const inp = $('#csvIn'),
      drop = $('#drop');
    ['dragenter', 'dragover'].forEach(ev => scope.listen(drop, ev, () => drop.classList.add('over')));
    ['dragleave', 'drop'].forEach(ev => scope.listen(drop, ev, () => drop.classList.remove('over')));
    inp.onchange = () => {
      const file = inp.files[0];
      if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        const rows = parseCSV(String(rd.result));
        if (rows.length < 2) {
          $('#csvPrev').innerHTML = '<p class="warn">The file has no data rows. Use the template to check the column names.</p>';
          return;
        }
        csvRows = checkRows(rows);
        const ok = csvRows.filter(r => !r.issues.length).length;
        $('#csvPrev').innerHTML = `<p><b style="font-weight:500">${escH(file.name)}</b> · ${csvRows.length} rows · <span class="ok">${ok} ready</span>${csvRows.length - ok ? ` · <span class="warn">${csvRows.length - ok} need fixing</span>` : ''}</p>
      <div style="overflow-x:auto"><table class="ptbl"><thead><tr><th>#</th><th>Register</th><th>Title</th><th>Check</th></tr></thead><tbody>${csvRows.map((r, i) => `<tr><td>${i + 1}</td><td>${escH(r.reg || '—')}</td><td>${escH(r.t || '—')}</td><td class="${r.issues.length ? 'warn' : 'ok'}">${r.issues.length ? escH(r.issues.join(', ')) : 'Ready'}</td></tr>`).join('')}</tbody></table></div>
      <button class="btn" data-addcsv ${ok ? '' : 'disabled'}>Add ${ok} row${ok === 1 ? '' : 's'}</button>`;
      };
      rd.readAsText(file);
    };
  }
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

  /* ---------- Reports ---------- */
  const repIcon = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 2.5h7l4 4v11H5z"/><path d="M12 2.5v4h4M8 10.5h5M8 13.5h5"/></svg>';
  let repState = {
    id: 'decisions',
    dept: 'All',
    status: 'All'
  };
  function openReport(id) {
    openSheet('reports');
    repState = {
      id,
      dept: 'All',
      status: 'All'
    };
    drawReport();
  }
  function reportRows() {
    const id = repState.id;
    if (id === 'decisions') return allDecisions();
    const reg = id === 'actions' ? 'Actions' : 'Initiatives';
    return LOCAL.filter(r => r.reg === reg).map(r => ({
      id: r.id,
      t: r.t,
      dept: r.dept,
      by: r.by || '—',
      forum: r.forum || '—',
      date: fmtDate(r.date),
      s: r.s,
      local: true
    }));
  }
  function drawReport() {
    const {
      id
    } = repState;
    const R = REPORTS.find(r => r.id === id);
    $('#panelT').textContent = R.n;
    $('#panel').classList.add('wide');
    document.body.classList.add('print-report');
    const head = `<div class="rep-top"><div><div class="org">Oman Food Capital · Corporate</div><h3>${R.n}</h3><div class="meta" id="repMeta"></div></div><div class="rep-count"><b class="num" id="repN"></b><span id="repUnit">records</span></div></div>`;
    if (id === 'scorecard') {
      const tot = SCORE.reduce((a, b) => a + b.n, 0);
      $('#panelB').innerHTML = head + `<div class="rfilters noprint" style="grid-template-columns:1fr auto auto"><span></span><button class="btn ghost" data-export>Export CSV</button><button class="btn" data-print>Print / PDF</button></div>
      <div class="rtbl-wrap"><table class="rtbl"><thead><tr><th>Department</th><th>Reported score</th><th>Status</th></tr></thead><tbody>${DEPTS.map(d => `<tr><td>${d.n}</td><td class="num">${d.v}%</td><td><span class="pill ${d.s === 'Below Target' ? 'below' : ''}">${d.s}</span></td></tr>`).join('')}</tbody></table></div>
      <div class="rtbl-wrap" style="margin-top:18px"><table class="rtbl"><thead><tr><th>KPI status</th><th>KPIs</th><th>Share</th></tr></thead><tbody>${SCORE.map(s => `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s.c};margin-right:8px"></span>${s.k}</td><td class="num">${s.n}</td><td class="num">${Math.round(s.n / tot * 100)}%</td></tr>`).join('')}</tbody></table></div>
      <p class="rnote">Corporate BSC 76% · 12 strategic KPIs · Generated 23/09/2026</p>`;
      $('#repN').textContent = '12';
      $('#repUnit').textContent = 'KPIs';
      $('#repMeta').textContent = 'All departments · Generated 23/09/2026';
      return;
    }
    const all = reportRows();
    const depts = ['All', ...new Set(all.map(r => r.dept))],
      sts = ['All', ...new Set(all.map(r => r.s))];
    const o = (a, v) => a.map(x => `<option${x === v ? ' selected' : ''}>${escH(x)}</option>`).join('');
    $('#panelB').innerHTML = head + `<div class="rfilters noprint">
      <label>Department<select id="fDept">${o(depts, repState.dept).replace('>All<', '>All departments<')}</select></label>
      <label>Status<select id="fStat">${o(sts, repState.status).replace('>All<', '>All statuses<')}</select></label>
      <button class="btn ghost" data-export>Export CSV</button><button class="btn" data-print>Print / PDF</button></div>
    <div class="chips" id="repChips"></div><div id="repBody"></div>`;
    $('#fDept').onchange = e => {
      repState.dept = e.target.value === 'All departments' ? 'All' : e.target.value;
      fillReport();
    };
    $('#fStat').onchange = e => {
      repState.status = e.target.value === 'All statuses' ? 'All' : e.target.value;
      fillReport();
    };
    fillReport();
  }
  function filteredRows() {
    return reportRows().filter(r => (repState.dept === 'All' || r.dept === repState.dept) && (repState.status === 'All' || r.s === repState.status));
  }
  function fillReport() {
    const rows = filteredRows(),
      id = repState.id;
    $('#repN').textContent = rows.length;
    $('#repUnit').textContent = rows.length === 1 ? 'record' : 'records';
    $('#repMeta').textContent = `${repState.dept === 'All' ? 'All departments' : repState.dept} · ${repState.status === 'All' ? 'All statuses' : repState.status} · Generated 23/09/2026`;
    const counts = {};
    rows.forEach(r => counts[r.s] = (counts[r.s] || 0) + 1);
    $('#repChips').innerHTML = Object.entries(counts).map(([k, v]) => `<span class="chip">${escH(k)} <b>${v}</b></span>`).join('');
    const isDec = id === 'decisions';
    const base = id === 'actions' ? BASE.actions : id === 'initiatives' ? BASE.initiatives : 0;
    if (!rows.length) {
      $('#repBody').innerHTML = `<div class="rempty"><p>${base ? `The ${base} ${id} held in the Corporate tracker appear in the full build. Records you add here show in this report.` : 'No records match these filters.'}</p>${base ? `<button class="btn" data-reg="${id === 'actions' ? 'Actions' : 'Initiatives'}">Add a record</button>` : ''}</div>`;
      return;
    }
    $('#repBody').innerHTML = `<div class="rtbl-wrap"><table class="rtbl"><thead><tr><th>${isDec ? 'Decision required' : 'Title'}</th><th>Department</th><th>${isDec ? 'Raised by' : 'Owner'}</th><th>Forum</th><th>${isDec ? 'Decision by' : 'Due date'}</th><th>Status</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escH(r.t)}${r.local ? '<span class="newtag">New</span>' : ''}<small>${escH(r.id)}</small></td><td>${escH(r.dept)}</td><td>${escH(r.by)}</td><td>${escH(r.forum)}</td><td class="num">${escH(r.date)}</td><td><span class="pill ${r.s === 'Escalated' ? 'esc' : r.s === 'Closed' ? '' : 'pend'}">${escH(r.s)}</span></td></tr>`).join('')}</tbody></table></div>
  <p class="rnote">${isDec ? 'Client sample and locally entered records.' : `${base} records held in the Corporate tracker are not listed here. Showing records added in this browser.`}</p>`;
  }
  function exportReport() {
    if (repState.id === 'scorecard') {
      download('scorecard-report.csv', [['Department', 'Score', 'Status'], ...DEPTS.map(d => [d.n, d.v + '%', d.s]), [], ['KPI status', 'KPIs'], ...SCORE.map(s => [s.k, s.n])]);
      return;
    }
    download(`${repState.id}-report.csv`, [['ID', 'Title', 'Department', 'Raised by / owner', 'Forum', 'Date', 'Status'], ...filteredRows().map(r => [r.id, r.t, r.dept, r.by, r.forum, r.date, r.s])]);
  }

  /* ---------- Sheet events ---------- */
  $('#pClose').onclick = closeSheet;
  $('#pscrim').onclick = closeSheet;
  scope.listen($('#panel'), 'submit', e => {
    if (e.target.id === 'recForm') {
      e.preventDefault();
      onSubmit(e.target);
    }
    if (e.target.id === 'trkForm') {
      e.preventDefault();
      onTrackerSubmit(e.target);
    }
  });
  scope.listen($('#panel'), 'input', e => {
    if (e.target.classList.contains('bad')) {
      e.target.classList.remove('bad');
      ['#recErr', '#trkErr'].forEach(s => {
        const er = $(s);
        if (er && !$('#panelB .bad')) er.hidden = true;
      });
    }
  });
  scope.listen($('#panel'), 'click', e => {
    e.stopPropagation();
    closeFlyouts();
    const m = e.target.closest('[data-imode]');
    if (m) {
      renderInput(m.dataset.imode);
      return;
    }
    const td = e.target.closest('[data-tdel]');
    if (td) {
      TLOCAL = TLOCAL.filter(r => r.id !== td.dataset.tdel);
      saveT();
      refresh();
      renderTracker();
      return;
    }
    const d = e.target.closest('[data-del]');
    if (d) {
      LOCAL = LOCAL.filter(r => r.id !== d.dataset.del);
      saveLocal();
      refresh();
      renderInput(inputMode);
      return;
    }
    if (e.target.closest('[data-clear]')) {
      LOCAL = [];
      saveLocal();
      refresh();
      renderInput(inputMode);
      toast('Cleared records added in this browser.');
      return;
    }
    if (e.target.closest('[data-template]')) {
      download('ofc-import-template.csv', [['register', 'title', 'department', 'owner', 'date', 'forum', 'status'], ['Decisions', 'Example decision title', 'Investment', 'CIO', '2026-10-15', 'EC', 'Pending']]);
      return;
    }
    if (e.target.closest('[data-addcsv]')) {
      const ok = csvRows.filter(r => !r.issues.length);
      ok.forEach(addRecord);
      saveLocal();
      refresh();
      renderInput('csv');
      toast(`Added ${ok.length} row${ok.length === 1 ? '' : 's'} from CSV.`);
      return;
    }
    const rg = e.target.closest('[data-reg]');
    if (rg) {
      openInputSheet('new', rg.dataset.reg);
      return;
    }
    if (e.target.closest('[data-export]')) {
      exportReport();
      return;
    }
    if (e.target.closest('[data-print]')) {
      window.print();
      return;
    }
  });

  /* ---------- Launcher ---------- */
  function renderLauncher(q = '') {
    q = q.trim().toLowerCase();
    const list = APPS.filter(a => !q || a.n.toLowerCase().includes(q));
    $('#lgrid').innerHTML = list.map(a => {
      const locked = !role.apps.includes(a.id);
      return `<button class="app${a.id === 'corporate' ? ' current' : ''}${locked ? ' locked' : ''}" data-app="${a.id}" aria-label="${a.n}${locked ? ', no access' : ''}">
    <span class="ai" style="background:${a.c}"><svg viewBox="0 0 24 24" aria-hidden="true">${a.g}</svg></span>
    ${locked ? '<span class="lock"><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><rect x="1.5" y="4.5" width="7" height="5" rx="1"/><path d="M3 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span>' : ''}
    <span class="nm">${a.n}</span></button>`;
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
    setLauncher(o);
  };
  $('#meBtn').onclick = e => {
    e.stopPropagation();
    const o = !$('#roleMenu').classList.contains('open');
    closeFlyouts();
    setMenu(o);
  };
  $('#lsearch').oninput = e => renderLauncher(e.target.value);
  scope.listen(document, 'keydown', e => {
    if (e.key === 'Escape') {
      const w = $('#launcher').classList.contains('open');
      const hadFly = w || $('#roleMenu').classList.contains('open');
      closeFlyouts();
      if (w) $('#waffle').focus();
      if (!hadFly) {
        if (pane) hidePane();else if (sheetKind) closeSheet();
      }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.col.link')) {
      e.preventDefault();
      openApp(e.target.dataset.app);
    }
  });

  /* ---------- Roles ---------- */
  function renderRoles() {
    $('#roles').innerHTML = ROLES.map(r => `<button role="menuitemradio" aria-checked="${r.id === role.id}" data-role="${r.id}"><span class="avatar" style="width:30px;height:30px">${r.i}</span><span><span class="t">${r.n}</span><br><span class="m">${r.d}</span></span><svg class="chk" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3 3 7-7"/></svg></button>`).join('');
  }

  /* ---------- Click handling ---------- */
  scope.listen(document, 'click', e => {
    const inFly = e.target.closest('.launcher,.menu,.newmenu');
    const r = e.target.closest('[data-role]');
    if (r) {
      role = ROLES.find(x => x.id === r.dataset.role);
      try {
        localStorage.setItem('ofc-role', role.id);
      } catch (err) {}
      $('#meInit').textContent = role.i;
      renderRoles();
      renderLauncher();
      setMenu(false);
      if (pane) renderPane(pane);
      toast(`Viewing as ${role.n}. Open the app launcher to see their apps.`);
      return;
    }
    const rl = e.target.closest('[data-rail]');
    if (rl) {
      railClick(rl.dataset.rail);
      return;
    }
    if (e.target.closest('.hpane,.panel')) return;
    if (pane) hidePane();
    const lk = e.target.closest('[data-link]');
    if (lk) {
      const ap = APPS.find(x => x.id === lk.dataset.lapp);
      if (ap && !role.apps.includes(ap.id)) {
        toast(`${role.n} doesn't have access to ${ap.n}.`);
        return;
      }
      location.href = lk.dataset.link;
      return;
    }
    const a = e.target.closest('[data-app]');
    if (a) {
      closeSheet();
      openApp(a.dataset.app);
      return;
    }
    const tr = e.target.closest('[data-tracker]');
    if (tr) {
      openReport(tr.dataset.tracker);
      return;
    }
    const dc = e.target.closest('[data-dec]');
    if (dc) {
      openReport('decisions');
      return;
    }
    const t = e.target.closest('[data-toast]');
    if (t) {
      toast(t.dataset.toast);
      return;
    }
    if (!inFly) closeFlyouts();
  });
  $('#follow').onclick = () => {
    const p = $('#follow').getAttribute('aria-pressed') !== 'true';
    $('#follow').setAttribute('aria-pressed', p);
    $('#follow span').textContent = p ? 'Following' : 'Not following';
  };
  scope.listen($('#gsearch'), 'keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) toast(`Searching for "${e.target.value.trim()}"`);
  });
  $('#meInit').textContent = role.i;
  renderRoles();
  renderLauncher();
  renderKPICauses();
  refresh();
  window.OFC_MARKET = marketSnapshot;
  (() => {
    'use strict';

    let data = window.OFC_MARKET,
      refreshing = false;
    const root = document.querySelector('#marketGrid'),
      note = document.querySelector('#marketStatus');
    const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
    const dateLabel = date => new Date(date.slice(0, 10) + 'T00:00:00Z').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
    const monthLabel = date => new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC'
    });
    function chart(c) {
      const h = c.history || [];
      if (h.length < 2) return '<div class="market-empty">Daily history unavailable</div>';
      const min = Math.min(...h.map(p => p.close)),
        max = Math.max(...h.map(p => p.close)),
        start = Date.parse(c.start),
        end = Date.parse(c.end),
        span = max - min || max * .02 || 1;
      const x = d => 4 + (Date.parse(d) - start) / (end - start) * 192,
        y = p => 43 - (p - min) / span * 34;
      const points = h.map(p => `${x(p.date).toFixed(2)},${y(p.close).toFixed(2)}`);
      const line = 'M' + points.join(' L');
      return `<svg class="market-chart" viewBox="0 0 200 50" preserveAspectRatio="none" role="img" tabindex="0" data-symbol="${c.symbol}" aria-label="${escape(c.name)} daily closing prices, ${escape(dateLabel(c.start))} to ${escape(dateLabel(c.end))}; ${h.length} recorded trading days. Use left and right arrows to inspect prices."><title>${escape(c.name)} · two-year daily closing prices · ${h.length} recorded trading days</title><path class="area" d="${line} L${x(h.at(-1).date)},49 L${x(h[0].date)},49 Z"/><path d="${line}"/><line class="crosshair" y1="3" y2="49" x1="196" x2="196"/><circle cx="${x(h.at(-1).date)}" cy="${y(h.at(-1).close)}" r="2"/></svg><div class="market-range"><span>${monthLabel(c.start)}</span><span>2Y · daily</span><span>${monthLabel(c.end)}</span></div>`;
    }
    function render() {
      if (!data?.companies) {
        note.textContent = 'Market data is unavailable.';
        return;
      }
      root.innerHTML = data.companies.map(c => {
        const change = c.changePct,
          sign = change > 0 ? '+' : '',
          direction = change > 0 ? 'up' : change < 0 ? 'down' : '',
          quote = c.quote;
        return `<article class="market-card"><div class="market-brand">${c.logo ? `<img class="market-logo${c.darkLogo ? ' dark' : ''}" src="${c.logo}" alt="${escape(c.name)} logo">` : `<span class="market-symbol">${c.symbol}</span>`}<div><a href="${c.source}" target="_blank" rel="noopener">${escape(c.name)}</a><span class="market-symbol">MSX · ${c.symbol}</span></div></div><div class="market-price">${quote ? quote.price.toFixed(3) : '—'}<small>OMR</small></div><div class="market-change ${direction}" title="${c.previous ? 'Compared with the last recorded daily close on ' + dateLabel(c.previous.date) : 'Previous close unavailable'}">${change !== null && change !== undefined ? `${sign}${c.change.toFixed(3)} (${sign}${change.toFixed(2)}%)` : '—'} <span>vs prev. close</span></div>${chart(c)}<div class="market-asof${c.error ? ' market-stale' : ''}" data-asof="${c.symbol}" title="${escape(c.error || 'Latest available exchange observation; prices may be delayed by 15 minutes.')}" aria-live="polite">${quote ? `${dateLabel(quote.at)}${quote.intraday ? ' · ' + quote.at.slice(11, 16) : ' · close'} GST` : 'No quote available'}</div></article>`;
      }).join('');
      note.textContent = data.companies.some(c => c.error) ? 'Some updates unavailable · last verified prices shown' : 'MSX · delayed 15 min · OMR';
    }
    function inspect(svg, index) {
      const c = data.companies.find(c => c.symbol === svg.dataset.symbol),
        h = c.history || [];
      if (!h.length) return;
      index = Math.max(0, Math.min(h.length - 1, index));
      svg.dataset.index = index;
      const point = h[index],
        line = svg.querySelector('.crosshair'),
        x = 4 + (Date.parse(point.date) - Date.parse(c.start)) / (Date.parse(c.end) - Date.parse(c.start)) * 192;
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      root.querySelector(`[data-asof="${c.symbol}"]`).textContent = `${dateLabel(point.date)} · ${point.close.toFixed(3)} OMR`;
    }
    scope.listen(root, 'pointermove', event => {
      const svg = event.target.closest('.market-chart');
      if (!svg) return;
      const c = data.companies.find(c => c.symbol === svg.dataset.symbol),
        box = svg.getBoundingClientRect(),
        t = Date.parse(c.start) + (event.clientX - box.left) / box.width * (Date.parse(c.end) - Date.parse(c.start));
      let index = 0;
      c.history.forEach((p, i) => {
        if (Math.abs(Date.parse(p.date) - t) < Math.abs(Date.parse(c.history[index].date) - t)) index = i;
      });
      inspect(svg, index);
    });
    scope.listen(root, 'keydown', event => {
      const svg = event.target.closest('.market-chart');
      if (!svg || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const h = data.companies.find(c => c.symbol === svg.dataset.symbol).history;
      inspect(svg, event.key === 'Home' ? 0 : event.key === 'End' ? h.length - 1 : Number(svg.dataset.index ?? h.length - 1) + (event.key === 'ArrowRight' ? 1 : -1));
    });
    scope.listen(root, 'pointerout', event => {
      const svg = event.target.closest('.market-chart');
      if (!svg || svg.contains(event.relatedTarget)) return;
      const c = data.companies.find(c => c.symbol === svg.dataset.symbol);
      root.querySelector(`[data-asof="${c.symbol}"]`).textContent = `${dateLabel(c.quote.at)}${c.quote.intraday ? ' · ' + c.quote.at.slice(11, 16) : ' · close'} GST`;
    });
    async function refresh() {
      if (refreshing) return;
      if (location.protocol === 'file:') {
        note.textContent = 'Saved MSX snapshot · run the local app server for updates';
        return;
      }
      refreshing = true;
      const button = document.querySelector('#marketRefresh');
      button.disabled = true;
      note.textContent = 'Checking latest MSX observations…';
      try {
        const response = await scope.fetch('/api/market', {
          signal: AbortSignal.timeout(85000)
        });
        if (!response.ok) throw Error('Unavailable');
        const next = await response.json();
        if (!Array.isArray(next.companies) || next.companies.length !== 6) throw Error('Invalid response');
        data = next;
        render();
      } catch {
        note.textContent = 'Update unavailable · saved prices and timestamps shown';
      } finally {
        refreshing = false;
        button.disabled = false;
      }
    }
    scope.listen(document.querySelector('#marketRefresh'), 'click', refresh);
    render();
    refresh();
    scope.setInterval(() => {
      if (!document.hidden) refresh();
    }, 15 * 60 * 1000);
  })();
}