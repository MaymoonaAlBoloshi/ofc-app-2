import { dashboardCreateLink } from "./dashboard-create-link.js";
import { createShared } from "./shared";
export function initialize(scope) {
  const APP_ID = 'treasury',
    APP_NAME = 'Treasury';
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
     Treasury app · Oman Food Capital
     Structure (trackers, dashboards, AI reports) follows the OFC deck.
     Figures are illustrative sample data, consistent with Finance & Accounts.
     ===================================================================== */

  /* ---------------- Sample treasury data (OMR m) ----------------
     Consistent with the Finance & Accounts app: cash 57.4m and borrowings
     188.2m at 31 Aug 2026; net debt 130.8m; LTM EBITDA 27.9m. */
  const ASAT = '22 Sep 2026',
    CASH = 54.9,
    BUFFER = 35.0,
    LTM_EBITDA = 27.9,
    DEBT = 188.2;
  const TREND_L = ['2 Jul', '9 Jul', '16 Jul', '23 Jul', '30 Jul', '6 Aug', '13 Aug', '20 Aug', '27 Aug', '3 Sep', '10 Sep', '17 Sep', '22 Sep'];
  const TREND = [67.4, 66.1, 65.0, 63.9, 62.2, 63.5, 61.0, 59.6, 58.3, 56.9, 56.4, 55.8, 54.9];
  const BY_BANK = [['Bank A', 18.4], ['Bank B', 12.7], ['Bank C', 9.8], ['Bank D', 6.1], ['Bank E (Islamic)', 5.2], ['Bank F', 2.7]];
  const BY_ENT = [['Holding', 22.3], ['Subsidiary A', 7.6], ['Subsidiary C', 5.1], ['Subsidiary D', 5.9], ['Subsidiary B', 4.8], ['Subsidiary E', 2.4], ['Subsidiary F', 1.9], ['Subsidiary G', 1.5], ['Subsidiary H', 1.2], ['Other 8 entities', 2.2]];
  const BY_TYPE = [['Current accounts', 22.6, '#344B37'], ['Term deposits', 20.0, '#A1C364'], ['Call deposits', 9.8, '#B7C997'], ['Restricted (DSRA)', 2.5, '#F3BD7A']];
  const LOW_CASH = [['Subsidiary K', 0.21, 0.62, 'Payroll of 0.18m due 1 Oct'], ['Subsidiary N', 0.14, 0.39, 'Balance down 61% month on month'], ['Subsidiary O', 0.09, 0.21, 'Supplier run of 0.07m due 5 Oct']];
  /* 13-week forecast, weeks commencing (Sun) */
  const WK = ['27 Sep', '4 Oct', '11 Oct', '18 Oct', '25 Oct', '1 Nov', '8 Nov', '15 Nov', '22 Nov', '29 Nov', '6 Dec', '13 Dec', '20 Dec'];
  const WK_START = ['2026-09-27', '2026-10-04', '2026-10-11', '2026-10-18', '2026-10-25', '2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29', '2026-12-06', '2026-12-13', '2026-12-20'];
  const FC = {
    rec: [4.8, 5.1, 4.9, 5.0, 5.2, 4.9, 5.0, 4.8, 5.1, 5.0, 5.2, 5.0, 5.3],
    opx: [4.5, 4.3, 4.4, 4.6, 4.3, 4.5, 4.4, 4.6, 4.3, 4.5, 4.4, 4.6, 4.7],
    capex: [0, 2.6, 0, 6.8, 0, 2.1, 3.5, 5.4, 0, 0, 2.0, 0, 3.0],
    tax: [0, 0, 0.2, 0, 1.2, 0, 0, 0, 0, 0, 0, 0, 0],
    fund: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12.0, 0]
  };
  /* Facilities */
  const FACS = [{
    t: 'Facility A',
    bank: 'Bank A',
    entity: 'Holding',
    type: 'Term loan',
    limit: 64.0,
    drawn: 64.0,
    rate: 5.75,
    fix: 'Fixed',
    mat: '2031-03-31',
    status: 'Committed'
  }, {
    t: 'Facility B',
    bank: 'Bank B',
    entity: 'Subsidiary A',
    type: 'Term loan',
    limit: 32.5,
    drawn: 32.5,
    rate: 6.10,
    fix: 'Floating',
    mat: '2029-05-31',
    status: 'Committed'
  }, {
    t: 'Facility C',
    bank: 'Bank C',
    entity: 'Subsidiary D',
    type: 'Project finance',
    limit: 60.0,
    drawn: 42.0,
    rate: 6.40,
    fix: 'Floating',
    mat: '2036-11-16',
    status: 'Committed'
  }, {
    t: 'Facility D',
    bank: 'Bank E (Islamic)',
    entity: 'Subsidiary C',
    type: 'Ijara',
    limit: 21.7,
    drawn: 21.7,
    rate: 5.90,
    fix: 'Fixed',
    mat: '2032-07-15',
    status: 'Committed'
  }, {
    t: 'Facility E',
    bank: 'Bank D',
    entity: 'Holding',
    type: 'Revolving credit',
    limit: 20.0,
    drawn: 8.0,
    rate: 5.50,
    fix: 'Floating',
    mat: '2028-06-30',
    status: 'Committed'
  }, {
    t: 'Facility F',
    bank: 'Bank A',
    entity: 'Subsidiary B',
    type: 'Overdraft',
    limit: 10.0,
    drawn: 3.4,
    rate: 6.75,
    fix: 'Floating',
    mat: '2026-12-31',
    status: 'Uncommitted'
  }, {
    t: 'Facility G',
    bank: 'Bank F',
    entity: 'Subsidiary B',
    type: 'Term loan',
    limit: 16.6,
    drawn: 16.6,
    rate: 6.20,
    fix: 'Floating',
    mat: '2030-12-15',
    status: 'Committed'
  }];
  const MATURITY = [['2026', 11.0], ['2027', 17.2], ['2028', 26.4], ['2029', 19.8], ['2030', 22.1], ['2031', 38.5], ['2032+', 53.2]];
  /* 12-month funding view, Oct 2026 to Sep 2027 */
  const USES = [['Capital expenditure', 38.6, '#F3BD7A'], ['Debt principal repayments', 16.4, '#E9A27A'], ['Interest and profit payments', 11.3, '#D8B48E'], ['Tax payments', 3.1, '#EBD3B8']];
  const SOURCES = [['Operating cash flow', 21.5, '#344B37', 1], ['Cash above the 35.0m buffer', 19.9, '#A1C364', 1], ['Facility C undrawn (committed)', 18.0, '#B7C997', 1], ['Shareholder capital call (pending)', 12.0, '#D8DFCA', 0]];

  /* ---------------- Trackers (names from the deck) ---------------- */
  const ENT = ['Holding', 'All entities', ...'ABCDEFGHIJKLMNOPQ'.split('').map(x => 'Subsidiary ' + x)];
  const BANKS = ['Bank A', 'Bank B', 'Bank C', 'Bank D', 'Bank E (Islamic)', 'Bank F'];
  const FAC_N = FACS.map(f => f.t);
  const DONE = new Set(['Completed', 'Paid', 'Received', 'Released', 'Final', 'Signed', 'Agreed', 'Declined', 'Repaid', 'Expired', 'Compliant', 'Renewed', 'Called']);
  const TRK = {
    cash: {
      n: 'Daily / Weekly Cash Tracker',
      d: 'Group cash position by week · OMR m',
      fields: [{
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
      cols: [['date', 'Week ending', 'date'], ['open', 'Opening', 'm'], ['rec', 'Receipts', 'm'], ['pay', 'Payments', 'm'], ['close', 'Closing', 'mb'], ['t', 'Commentary'], ['status', 'Status', 'status']],
      calc: r => {
        r.open = +r.open || 0;
        r.rec = +r.rec || 0;
        r.pay = +r.pay || 0;
        r.close = r.open + r.rec - r.pay;
      },
      noOverdue: 1,
      rows: [['2026-09-17', 56.4, 4.9, 5.5, 'Withholding tax for August paid (0.2m)'], ['2026-09-10', 56.9, 5.2, 5.7, 'Normal trading week'], ['2026-09-03', 58.3, 5.0, 6.4, 'August payroll across all entities'], ['2026-08-27', 59.6, 4.7, 6.0, 'Supplier payment run'], ['2026-08-20', 61.0, 5.1, 6.5, 'Subsidiary D contractor milestone (1.2m)'], ['2026-08-13', 63.5, 4.9, 7.4, 'Subsidiary D contractor milestone (2.3m)'], ['2026-08-06', 62.2, 7.9, 6.6, 'Facility C drawdown of 3.0m received'], ['2026-07-30', 63.9, 4.8, 6.5, 'Subsidiary D equipment payment (1.9m)']].map(r => ({
        date: r[0],
        open: r[1],
        rec: r[2],
        pay: r[3],
        t: r[4],
        status: 'Final'
      }))
    },
    debt: {
      n: 'Debt Repayment Tracker',
      d: 'Principal and interest due on group borrowings · OMR m',
      fields: [{
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
      cols: [['date', 'Due date', 'date'], ['t', 'Facility'], ['bank', 'Bank'], ['entity', 'Borrower'], ['prin', 'Principal', 'm'], ['int', 'Interest / profit', 'm'], ['tot', 'Total', 'mb'], ['status', 'Status', 'status']],
      calc: r => {
        r.prin = +r.prin || 0;
        r.int = +r.int || 0;
        r.tot = r.prin + r.int;
      },
      rows: [['2026-09-30', 'Facility A', 'Bank A', 'Holding', 3.40, 0.92, 'Funds reserved'], ['2026-09-30', 'Facility E', 'Bank D', 'Holding', 0, 0.11, 'Funds reserved'], ['2026-10-15', 'Facility D', 'Bank E (Islamic)', 'Subsidiary C', 0.65, 0.32, 'Scheduled'], ['2026-11-16', 'Facility C', 'Bank C', 'Subsidiary D', 0, 1.34, 'Scheduled'], ['2026-11-30', 'Facility B', 'Bank B', 'Subsidiary A', 2.50, 0.99, 'Scheduled'], ['2026-12-15', 'Facility G', 'Bank F', 'Subsidiary B', 1.00, 0.52, 'Scheduled'], ['2026-07-15', 'Facility D', 'Bank E (Islamic)', 'Subsidiary C', 0.65, 0.33, 'Paid'], ['2026-06-30', 'Facility A', 'Bank A', 'Holding', 0, 0.94, 'Paid'], ['2026-05-31', 'Facility B', 'Bank B', 'Subsidiary A', 2.50, 1.07, 'Paid']].map(r => ({
        date: r[0],
        t: r[1],
        bank: r[2],
        entity: r[3],
        prin: r[4],
        int: r[5],
        status: r[6]
      }))
    },
    fac: {
      n: 'Facility Utilization Tracker',
      d: 'Limits and drawings by facility · OMR m',
      fields: [{
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
      cols: [['t', 'Facility'], ['bank', 'Bank'], ['entity', 'Borrower'], ['type', 'Type'], ['limit', 'Limit', 'm'], ['drawn', 'Drawn', 'm'], ['avail', 'Available', 'm'], ['util', 'Utilisation', 'util'], ['rate', 'Rate', 'rate'], ['mat', 'Maturity', 'date'], ['status', 'Commitment', 'status']],
      calc: r => {
        r.limit = +r.limit || 0;
        r.drawn = +r.drawn || 0;
        r.avail = r.limit - r.drawn;
        r.util = r.limit ? r.drawn / r.limit * 100 : 0;
      },
      noOverdue: 1,
      rows: FACS.map(f => ({
        ...f
      }))
    },
    cov: {
      n: 'Covenant Tracker',
      d: 'Financial covenants on group facilities',
      fields: [{
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
      cols: [['t', 'Covenant'], ['fac', 'Facility'], ['test', 'Requirement'], ['actual', 'Latest actual'], ['proj', 'Projected'], ['date', 'Next test', 'date'], ['status', 'Status', 'status']],
      noOverdue: 1,
      rows: [['Net debt / EBITDA', 'Facility A', '5.00x or lower', '4.69x', '4.80x', '2026-09-30', 'At risk', 'Projected 4.90x at the 31 Dec test'], ['Debt service reserve account', 'Facility C', '6 months of debt service (2.68m)', '2.50m', '2.50m', '2026-11-16', 'Cure required', 'Shortfall of 0.18m to be topped up before 16 Nov'], ['Debt service coverage ratio', 'Facility A', '1.25x or higher', '1.41x', '1.36x', '2026-09-30', 'Compliant', ''], ['Interest cover', 'Facility E', '3.00x or higher', '3.53x', '3.41x', '2026-12-31', 'Compliant', ''], ['Gearing (net debt / equity)', 'Facility B', '60% or lower', '34.2%', '35.1%', '2026-12-31', 'Compliant', ''], ['Current ratio (Subsidiary C)', 'Facility D', '1.20x or higher', '1.61x', '1.58x', '2026-12-31', 'Compliant', ''], ['Tangible net worth (Subsidiary B)', 'Facility G', '15.0m or higher', '17.8m', '17.4m', '2026-12-31', 'Compliant', '']].map(r => ({
        t: r[0],
        fac: r[1],
        test: r[2],
        actual: r[3],
        proj: r[4],
        date: r[5],
        status: r[6],
        next: r[7]
      }))
    },
    bg: {
      n: 'Bank Guarantee Tracker',
      d: 'Guarantees issued and held by group entities · OMR m',
      fields: [{
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
      cols: [['t', 'Guarantee'], ['kind', 'Type'], ['entity', 'Entity'], ['benef', 'Beneficiary'], ['bank', 'Bank'], ['amt', 'Amount', 'm'], ['date', 'Expiry', 'date'], ['status', 'Status', 'status']],
      calc: r => {
        const d = -daysLate(r.date);
        r.soon = !DONE.has(r.status) && d >= 0 && d <= 30;
      },
      rows: [['Land lease performance guarantee', 'Performance', 'Subsidiary J', 'Ministry of Agriculture, Fisheries & Water Resources', 'Bank B', 0.45, '2026-10-15', 'Extension requested'], ['Advance payment guarantee from EPC contractor', 'Advance payment', 'Subsidiary D', 'EPC contractor (held by OFC)', 'Bank C', 4.20, '2026-11-30', 'Active'], ['Customs duty guarantee', 'Customs', 'Subsidiary E', 'Directorate General of Customs', 'Bank A', 0.30, '2026-12-31', 'Active'], ['Parent company guarantee for Facility G', 'Financial', 'Holding', 'Bank F', 'Bank F', 16.60, '2030-12-15', 'Active'], ['Supply contract performance bond', 'Performance', 'Subsidiary A', 'Government catering contract', 'Bank A', 0.80, '2027-03-31', 'Active'], ['Tender bid bond', 'Bid bond', 'Subsidiary B', 'Government tender', 'Bank A', 0.12, '2026-07-31', 'Released']].map(r => ({
        t: r[0],
        kind: r[1],
        entity: r[2],
        benef: r[3],
        bank: r[4],
        amt: r[5],
        date: r[6],
        status: r[7]
      }))
    },
    lc: {
      n: 'LC / Trade Finance Tracker',
      d: 'Import letters of credit and trade finance',
      fields: [{
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
      cols: [['t', 'LC reference'], ['entity', 'Applicant'], ['supplier', 'Supplier / goods'], ['bank', 'Issuing bank'], ['amt', 'Amount', 'ccy'], ['date', 'Expiry', 'date'], ['status', 'Status', 'status']],
      rows: [['LC-26-009', 'Subsidiary A', 'Processing line equipment', 'Bank A', 'EUR', 1.20, '2026-09-30', 'Accepted'], ['LC-26-014', 'Subsidiary B', 'Feed grain import', 'Bank A', 'USD', 2.40, '2026-10-15', 'Documents presented'], ['LC-26-017', 'Subsidiary H', 'Soybean meal import', 'Bank B', 'USD', 1.85, '2026-10-30', 'Issued'], ['LC-26-011', 'Subsidiary D', 'Hatchery equipment', 'Bank C', 'USD', 3.60, '2026-11-20', 'Issued'], ['LC-26-003', 'Subsidiary E', 'Refrigerated trucks', 'Bank D', 'USD', 0.95, '2026-06-30', 'Paid']].map(r => ({
        t: r[0],
        entity: r[1],
        supplier: r[2],
        bank: r[3],
        ccy: r[4],
        amt: r[5],
        date: r[6],
        status: r[7]
      }))
    },
    shf: {
      n: 'Shareholder Funding Tracker',
      d: 'Funding requests to the shareholder · OMR m',
      fields: [{
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
      cols: [['t', 'Funding request'], ['purpose', 'Purpose'], ['amt', 'Amount', 'm'], ['reqd', 'Requested on', 'date'], ['date', 'Expected receipt', 'date'], ['status', 'Status', 'status']],
      rows: [['2026 capital call, tranche 1', 'Subsidiary D completion capex', 12.0, '2026-09-01', '2026-12-14', 'Under shareholder review'], ['2027 funding request', '2027 business plan investments', 30.0, '', '2027-03-31', 'Draft'], ['2025 capital call', 'Subsidiary D construction and working capital', 25.0, '2025-09-01', '2025-11-20', 'Received']].map(r => ({
        t: r[0],
        purpose: r[1],
        amt: r[2],
        reqd: r[3],
        date: r[4],
        status: r[5]
      }))
    },
    eq: {
      n: 'Equity Injection / Shareholder Loan Tracker',
      d: 'Funding from the holding company to subsidiaries · OMR m',
      fields: [{
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
      cols: [['t', 'Recipient'], ['kind', 'Type'], ['amt', 'Amount', 'm'], ['date', 'Date', 'date'], ['rate', 'Rate', 'rate'], ['status', 'Status', 'status']],
      rows: [['Subsidiary D', 'Equity injection', 8.00, '2026-11-15', '', 'Planned', 'Completion capex; needs Board approval'], ['Subsidiary Q', 'Equity injection', 1.50, '2026-10-20', '', 'Approved', 'Pre-operating costs'], ['Subsidiary P', 'Equity injection', 2.50, '2026-08-12', '', 'Paid', 'Pre-operating costs'], ['Subsidiary D', 'Equity injection', 6.00, '2026-06-10', '', 'Paid', 'Construction'], ['Subsidiary K', 'Shareholder loan', 1.12, '2026-05-20', 4.0, 'Paid', 'Working capital'], ['Subsidiary D', 'Shareholder loan', 12.40, '2026-03-15', 4.0, 'Paid', 'Construction bridge']].map(r => ({
        t: r[0],
        kind: r[1],
        amt: r[2],
        date: r[3],
        rate: r[4],
        status: r[5],
        next: r[6]
      }))
    },
    refi: {
      n: 'Refinancing Tracker',
      d: 'Facilities due for renewal or refinancing',
      fields: [{
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
      cols: [['t', 'Facility'], ['bank', 'Current bank'], ['amt', 'Amount', 'm'], ['option', 'Option'], ['saving', 'Annual saving', 'm'], ['date', 'Target date', 'date'], ['status', 'Status', 'status']],
      rows: [['Facility F', 'Bank A', 10.0, 'Annual overdraft renewal', 0, '2026-12-31', 'Credit approval'], ['Facility A', 'Bank A', 64.0, 'Refinance at a lower margin', 0.22, '2027-03-31', 'Term sheet received'], ['Facility G', 'Bank F', 16.6, 'Fold into the Facility A refinancing', 0.05, '2027-06-30', 'Exploring']].map(r => ({
        t: r[0],
        bank: r[1],
        amt: r[2],
        option: r[3],
        saving: r[4],
        date: r[5],
        status: r[6]
      }))
    },
    neg: {
      n: 'Bank Negotiation / Term Sheet Tracker',
      d: 'Live negotiations and term sheets',
      fields: [{
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
      }],
      cols: [['t', 'Negotiation'], ['bank', 'Bank'], ['amt', 'Amount', 'm'], ['price', 'Pricing'], ['tenor', 'Tenor'], ['date', 'Next milestone', 'date'], ['status', 'Status', 'status']],
      rows: [['Facility A refinancing', 'Bank D', 64.0, '20 bps below current margin', '7 years', '2026-10-05', 'Indicative terms', 'Ask for a formal term sheet'], ['Facility A refinancing', 'Bank C', 64.0, '35 bps below current margin', '7 years', '2026-10-08', 'Term sheet received', 'Compare with Bank D, then EC paper'], ['Working capital line, Subsidiary K', 'Bank B', 2.0, 'To be agreed', '1 year', '2026-10-15', 'Initial discussion', 'Share Subsidiary K forecasts'], ['Facility C tranche 2 conditions precedent', 'Bank C', 10.0, 'Per existing agreement', 'Existing', '2026-10-30', 'Credit committee', 'Submit updated project progress report']].map(r => ({
        t: r[0],
        bank: r[1],
        amt: r[2],
        price: r[3],
        tenor: r[4],
        date: r[5],
        status: r[6],
        next: r[7]
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
    return [...local, ...T.rows].map(r => {
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
  const OKS = new Set(['Completed', 'Paid', 'Received', 'Released', 'Final', 'Signed', 'Agreed', 'Repaid', 'Compliant', 'Committed', 'Approved', 'Funds reserved', 'Accepted']);
  const BAD = new Set(['Cure required', 'Breach risk', 'Called', 'Expired', 'Declined']);
  const NEU = new Set(['Draft', 'Planned', 'Not started', 'Initial discussion', 'Uncommitted']);
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

  /* ---------------- Forecast engine ---------------- */
  let scenario = 'base';
  function forecast(sc = scenario) {
    const debt = WK_START.map((s, i) => {
      const e = i < 12 ? WK_START[i + 1] : '2026-12-27';
      return trkRows('debt').filter(r => !DONE.has(r.status) && r.date >= s && r.date < e).reduce((a, r) => a + r.tot, 0);
    });
    const rec = FC.rec.map(v => sc === 'down' ? v * 0.9 : v),
      capex = FC.capex.map((v, i) => sc === 'delay' ? FC.capex[i - 4] || 0 : v);
    let bal = CASH;
    const rows = WK.map((w, i) => {
      const net = rec[i] - FC.opx[i] - capex[i] - debt[i] - FC.tax[i] + FC.fund[i];
      const open = bal;
      bal += net;
      return {
        w,
        open,
        rec: rec[i],
        opx: FC.opx[i],
        capex: capex[i],
        debt: debt[i],
        tax: FC.tax[i],
        fund: FC.fund[i],
        net,
        close: bal
      };
    });
    const low = rows.reduce((a, r) => r.close < a.close ? r : a, rows[0]);
    const below = rows.filter(r => r.close < BUFFER);
    return {
      rows,
      low,
      below,
      first: below[0],
      gap: Math.max(0, BUFFER - low.close)
    };
  }
  const SCN = {
    base: 'Base case',
    down: 'Receipts 10% lower',
    delay: 'Capex paid 4 weeks earlier'
  };
  /* note: 'delay' shifts each capex payment 4 weeks later (a timing scenario) */
  SCN.delay = 'Capex paid 4 weeks later';
  const facSum = () => {
    const F = trkRows('fac');
    const limit = F.reduce((a, f) => a + f.limit, 0),
      drawn = F.reduce((a, f) => a + f.drawn, 0),
      cu = F.filter(f => f.status === 'Committed').reduce((a, f) => a + f.avail, 0);
    return {
      F,
      limit,
      drawn,
      avail: limit - drawn,
      cu
    };
  };
  const netDebt = () => DEBT - CASH;

  /* ---------------- Views ---------------- */
  const VIEWS = {
    home: 'Overview',
    cash: 'Group Cash Position',
    liq: 'Liquidity Dashboard',
    debtd: 'Debt Dashboard',
    facd: 'Banking Facilities Dashboard',
    fund: 'Funding Dashboard',
    'rep-forecast': 'Cash-flow forecasting',
    'rep-liq': 'Liquidity shortage alerts',
    'rep-repay': 'Upcoming repayment alerts',
    'rep-cov': 'Covenant breach warnings',
    'rep-gap': 'Funding gap identification',
    'rep-source': 'Optimal funding-source recommendations',
    'rep-summary': 'Treasury / debt summary for CFO and EC'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['cash', 'liq', 'debtd', 'facd', 'fund'];
  const REPS = ['rep-forecast', 'rep-liq', 'rep-repay', 'rep-cov', 'rep-gap', 'rep-source', 'rep-summary'];
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
  const m2 = v => (+v).toFixed(2),
    m1 = v => (+v).toFixed(1);
  const hbar = (l, v, max, fill, val) => `<div class="hb"><span>${l}</span><span class="tr"><span class="fl" style="width:${Math.max(0, v / max * 100)}%;${fill ? `background:${fill}` : ''}"></span></span><span class="v">${val ?? m1(v)}</span></div>`;
  const scnSel = () => `<select id="scn" class="noprint" aria-label="Scenario" style="height:34px;border:1px solid var(--line);border-radius:6px;background:var(--callout);padding:0 10px;font:inherit;font-size:13px">${Object.entries(SCN).map(([k, v]) => `<option value="${k}"${k === scenario ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
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
    if (view === 'home') el.innerHTML = vHome();else if (view === 'cash') el.innerHTML = vCash();else if (view === 'liq') el.innerHTML = vLiq();else if (view === 'debtd') el.innerHTML = vDebt();else if (view === 'facd') el.innerHTML = vFac();else if (view === 'fund') el.innerHTML = vFund();else if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
    } else el.innerHTML = vRep(view);
  }

  /* ---- Forecast chart ---- */
  function fcChart(fc, h = 250, W = 720) {
    const H = h,
      pl = 40,
      pr = 10,
      pt = 18,
      pb = 28,
      iw = W - pl - pr,
      ih = H - pt - pb;
    const vals = fc.rows.map(r => r.close),
      n = vals.length;
    const {
      max
    } = niceScale(Math.max(...vals, BUFFER, CASH));
    const x = i => pl + iw * (i + .5) / n,
      y = v => pt + ih - v / max * ih;
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4,
        yy = y(v);
      g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl - 8}" y="${yy + 4}" class="ax" text-anchor="end">${+v.toFixed(0)}</text>`;
    }
    const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const area = `<polygon points="${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}" fill="rgba(169,205,105,.18)"/>`;
    const buf = `<rect x="${pl}" y="${y(BUFFER)}" width="${iw}" height="${y(0) - y(BUFFER)}" fill="rgba(243,189,122,.08)"/><line x1="${pl}" x2="${W - pr}" y1="${y(BUFFER)}" y2="${y(BUFFER)}" stroke="#C98B3E" stroke-width="1.5" stroke-dasharray="6 4"/><text x="${pl + 6}" y="${y(BUFFER) + 15}" class="ax" text-anchor="start" style="fill:#A55E36">Minimum cash buffer ${BUFFER.toFixed(1)}</text>`;
    const dots = vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${v < BUFFER ? 4.5 : 3.2}" fill="${v < BUFFER ? '#F3BD7A' : '#fff'}" stroke="${v < BUFFER ? '#C98B3E' : '#344B37'}" stroke-width="2"><title>Week of ${WK[i]}: ${v.toFixed(1)}</title></circle>`).join('');
    const lbl = vals.map((v, i) => i === 0 || i === n - 1 || v === fc.low.close ? `<text x="${x(i)}" y="${y(v) - 10}" class="vl" text-anchor="middle">${v.toFixed(1)}</text>` : '').join('');
    const xl = WK.map((w, i) => `<text x="${x(i)}" y="${H - 8}" class="xl" text-anchor="middle" style="font-size:10.5px">${w}</text>`).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="13-week closing cash forecast">${g}${buf}${area}<polyline points="${pts}" fill="none" stroke="#344B37" stroke-width="2"/>${dots}${lbl}${xl}</svg>`;
  }
  function trendChart() {
    const W = 720,
      H = 230,
      pl = 40,
      pr = 10,
      pt = 18,
      pb = 28,
      iw = W - pl - pr,
      ih = H - pt - pb,
      n = TREND.length;
    const lo = 50,
      hi = 70;
    const x = i => pl + iw * (i + .5) / n,
      y = v => pt + ih - (v - lo) / (hi - lo) * ih;
    let g = '';
    for (let v = lo; v <= hi; v += 5) {
      g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${pl - 8}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
    }
    const pts = TREND.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly group cash">${g}<polygon points="${x(0)},${y(lo)} ${pts} ${x(n - 1)},${y(lo)}" fill="rgba(169,205,105,.18)"/><polyline points="${pts}" fill="none" stroke="#344B37" stroke-width="2"/>${TREND.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#fff" stroke="#344B37" stroke-width="2"><title>${TREND_L[i]}: ${v.toFixed(1)}</title></circle>`).join('')}<text x="${x(n - 1)}" y="${y(TREND[n - 1]) - 10}" class="vl" text-anchor="middle">${TREND[n - 1].toFixed(1)}</text><text x="${x(0)}" y="${y(TREND[0]) - 10}" class="vl" text-anchor="middle">${TREND[0].toFixed(1)}</text>${TREND_L.map((l, i) => `<text x="${x(i)}" y="${H - 8}" class="xl" text-anchor="middle" style="font-size:10.5px">${l}</text>`).join('')}</svg>`;
  }
  function stackBar(parts, total) {
    return `<div class="meter2" style="height:14px;border-radius:4px">${parts.map(p => `<span title="${escH(p[0])}: ${m1(p[1])}" style="width:${p[1] / total * 100}%;background:${p[2]}"></span>`).join('')}</div><div class="legend-s" style="margin:8px 0 0">${parts.map(p => `<span><i style="background:${p[2]}"></i>${p[0]} · ${m1(p[1])}</span>`).join('')}</div>`;
  }

  /* ---- Home ---- */
  function attention() {
    const it = [],
      fc = forecast('base');
    trkRows('cov').filter(r => r.status !== 'Compliant').forEach(r => it.push({
      s: r.status === 'Cure required' ? 3 : 2,
      t: `${r.t} · ${r.fac}`,
      m: `${r.status} · latest ${r.actual}, requirement ${r.test} · test ${fmtDate(r.date)}`,
      v: 'trk-cov'
    }));
    if (fc.first) it.push({
      s: 3,
      t: `Cash forecast below the ${BUFFER.toFixed(1)}m buffer from the week of ${fc.first.w}`,
      m: `Low of ${fc.low.close.toFixed(1)}m in the week of ${fc.low.w} · ${fc.below.length} weeks below buffer`,
      v: 'liq'
    });
    trkRows('debt').filter(r => !DONE.has(r.status) && -daysLate(r.date) <= 14).forEach(r => it.push({
      s: 1,
      soft: 1,
      t: `${r.t} repayment of ${m2(r.tot)}m due ${fmtDate(r.date)}`,
      m: `${r.bank} · ${r.status}`,
      v: 'trk-debt'
    }));
    trkRows('bg').filter(r => r.soon).forEach(r => it.push({
      s: 2,
      t: `${r.t} expires ${fmtDate(r.date)}`,
      m: `${r.entity} · ${r.benef} · ${r.status}`,
      v: 'trk-bg'
    }));
    trkRows('lc').filter(r => !DONE.has(r.status) && -daysLate(r.date) <= 14 && -daysLate(r.date) >= 0).forEach(r => it.push({
      s: 1,
      soft: 1,
      t: `${r.t} expires ${fmtDate(r.date)}`,
      m: `${r.entity} · ${r.supplier} · ${r.ccy} ${m2(r.amt)}m · ${r.status}`,
      v: 'trk-lc'
    }));
    trkRows('shf').filter(r => r.status === 'Under shareholder review').forEach(r => it.push({
      s: 1,
      soft: 1,
      t: `${r.t} of ${m1(r.amt)}m awaiting shareholder approval`,
      m: `Expected ${fmtDate(r.date)} · the forecast relies on it`,
      v: 'trk-shf'
    }));
    return it.sort((a, b) => b.s - a.s);
  }
  function vHome() {
    const fc = forecast('base'),
      fs = facSum(),
      nd = netDebt(),
      nde = 130.8 / LTM_EBITDA;
    const up = trkRows('debt').filter(r => !DONE.has(r.status)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    const att = attention();
    return `<div class="stack">${vh('Overview', `Cash, liquidity and debt · cash position as at ${ASAT}`)}
  <div class="kpi5">
    <button class="kc" data-go="cash"><span class="lbl">Cash position</span><span class="val num">${m1(CASH)}<small>m</small></span><span class="ctx">As at ${ASAT} · <span class="neg">−2.5m</span> since 31 Aug</span><span class="go">Group Cash Position ↗</span></button>
    <button class="kc" data-go="liq"><span class="lbl">Total liquidity</span><span class="val num">${m1(CASH + fs.cu)}<small>m</small></span><span class="ctx">Cash plus ${m1(fs.cu)}m committed undrawn</span><span class="go">Liquidity ↗</span></button>
    <button class="kc" data-go="debtd"><span class="lbl">Gross debt</span><span class="val num">${m1(DEBT)}<small>m</small></span><span class="ctx">Net debt ${m1(nd)}m</span><span class="go">Debt ↗</span></button>
    <button class="kc peach" data-go="trk-cov"><span class="lbl">Net debt / EBITDA</span><span class="val num">${nde.toFixed(2)}<small>x</small></span><span class="ctx">Limit 5.00x · projected 4.80x at 30 Sep</span><span class="go">Covenant Tracker ↗</span></button>
    <button class="kc peach" data-go="liq"><span class="lbl">Lowest forecast cash</span><span class="val num">${m1(fc.low.close)}<small>m</small></span><span class="ctx">Week of ${fc.low.w} · buffer ${m1(BUFFER)}m</span><span class="go">13-week forecast ↗</span></button>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>13-week cash forecast</h2><p>Closing cash by week, OMR m · base case</p></div><button class="see" data-go="rep-forecast">Forecast report ↗</button></div>${fcChart(fc)}</section>
    <section class="wp"><div class="wp-h"><div><h2>Upcoming repayments</h2><p>Principal and interest, OMR m</p></div><button class="see" data-go="trk-debt">Tracker ↗</button></div>
      <ul class="mini-list">${up.map(r => `<li><span>${escH(r.t)} · ${m2(r.tot)}m<small>${escH(r.bank)} · due ${fmtDate(r.date)}</small></span>${pill(r.status)}</li>`).join('')}</ul></section>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Needs attention</h2><p>From the Treasury trackers and forecast</p></div></div>
      <ul class="att">${att.slice(0, 7).map(a => `<li><button data-go="${a.v}"><span class="ic${a.soft ? ' soft' : ''}">${a.soft ? ico.clock : ico.warn}</span><span><div class="t">${escH(a.t)}</div><div class="m">${escH(a.m)}</div></span><span></span>${chev}</button></li>`).join('')}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Facility utilisation</h2><p>Drawn against limit, OMR m</p></div><button class="see" data-go="facd">Facilities ↗</button></div>
      ${fs.F.map(f => `<div class="hb w"><span>${f.t}</span><span class="tr"><span class="fl" style="width:${f.util}%;${f.util >= 100 ? 'background:#D8DFCA' : ''}"></span></span><span class="v">${m1(f.drawn)} / ${m1(f.limit)}</span></div>`).join('')}
      <p class="src">Undrawn ${m1(fs.avail)}m, of which ${m1(fs.cu)}m committed.</p></section>
  </div></div>`;
  }

  /* ---- Dashboards ---- */
  function vCash() {
    const ent = [...BY_ENT].sort((a, b) => b[1] - a[1]),
      mx = ent[0][1],
      bmx = Math.max(...BY_BANK.map(b => b[1]));
    return `<div class="stack">${vh('Group Cash Position', `All entities and banks · as at ${ASAT}`, exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Total cash</span><span class="val num">${m1(CASH)}<small>m</small></span><span class="ctx"><span class="neg">−2.5m</span> since 31 Aug · <span class="neg">−9.9m</span> since 1 Jan</span></div>
    <div class="kc"><span class="lbl">Unrestricted cash</span><span class="val num">52.4<small>m</small></span><span class="ctx">2.5m held in the Facility C reserve account</span></div>
    <div class="kc"><span class="lbl">Deposits</span><span class="val num">29.8<small>m</small></span><span class="ctx">20.0m term · 9.8m call</span></div>
    <div class="kc peach"><span class="lbl">Entities with low cash</span><span class="val num">${LOW_CASH.length}</span><span class="ctx">Under two weeks of payments</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Weekly cash balance</h2><p>Group, OMR m · last 12 weeks</p></div><button class="see" data-go="trk-cash">Cash Tracker ↗</button></div>${trendChart()}</section>
    <section class="wp"><div class="wp-h"><div><h2>By bank</h2><p>OMR m</p></div></div>${BY_BANK.map(b => hbar(b[0], b[1], bmx)).join('')}
      <h3 style="font-size:13px;font-weight:500;margin:18px 0 8px">By account type</h3>${stackBar(BY_TYPE, CASH)}</section>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>By entity</h2><p>OMR m</p></div></div>${ent.map(e => hbar(e[0], e[1], mx)).join('')}</section>
    <section class="wp"><div class="wp-h"><div><h2>Low cash entities</h2><p>Cash against the next two weeks of payments</p></div><button class="see" data-go="rep-liq">Alerts ↗</button></div>
      <ul class="mini-list">${LOW_CASH.map(l => `<li><span>${l[0]} · ${m2(l[1])}m<small>${l[3]}</small></span><span class="pill esc">${(l[1] / l[2] * 2).toFixed(1)} weeks</span></li>`).join('')}</ul></section>
  </div></div>`;
  }
  function fcTable(fc) {
    const line = (l, k, neg, b) => `<tr class="${b ? 'sub' : ''}"><td>${l}</td>${fc.rows.map(r => {
      const v = r[k];
      return `<td class="${k === 'close' && v < BUFFER ? 'neg' : ''}">${!v && !b ? '—' : neg && v ? '(' + m1(v) + ')' : m1(v)}</td>`;
    }).join('')}</tr>`;
    return `<div class="tscroll"><table class="stmt" style="min-width:1100px"><thead><tr><th>Week of</th>${WK.map(w => `<th>${w}</th>`).join('')}</tr></thead><tbody>${line('Opening cash', 'open', 0, 1)}${line('Operating receipts', 'rec')}${line('Operating payments', 'opx', 1)}${line('Capital expenditure', 'capex', 1)}${line('Debt service', 'debt', 1)}${line('Tax', 'tax', 1)}${line('Shareholder funding', 'fund')}${line('Closing cash', 'close', 0, 1)}</tbody></table></div>`;
  }
  function vLiq() {
    const fc = forecast(),
      fs = facSum();
    return `<div class="stack">${vh('Liquidity Dashboard', '13-week cash forecast against the minimum cash buffer', scnSel() + exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Total liquidity</span><span class="val num">${m1(CASH + fs.cu)}<small>m</small></span><span class="ctx">Cash ${m1(CASH)}m · committed undrawn ${m1(fs.cu)}m</span></div>
    <div class="kc"><span class="lbl">Minimum cash buffer</span><span class="val num">${m1(BUFFER)}<small>m</small></span><span class="ctx">Treasury policy</span></div>
    <div class="kc ${fc.gap ? 'peach' : ''}"><span class="lbl">Lowest forecast cash</span><span class="val num">${m1(fc.low.close)}<small>m</small></span><span class="ctx">Week of ${fc.low.w}${fc.gap ? ` · ${m1(fc.gap)}m below buffer` : ''}</span></div>
    <div class="kc ${fc.below.length ? 'peach' : ''}"><span class="lbl">Weeks below buffer</span><span class="val num">${fc.below.length}<small>of 13</small></span><span class="ctx">${fc.first ? 'From the week of ' + fc.first.w : 'None in this scenario'}</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Closing cash by week</h2><p>${SCN[scenario]} · OMR m</p></div><button class="see" data-go="rep-source">Funding options ↗</button></div>${fcChart(fc, 300, 1100)}</section>
  <section class="wp"><div class="wp-h"><div><h2>Forecast detail</h2><p>OMR m · debt service comes from the Debt Repayment Tracker</p></div></div>${fcTable(fc)}</section></div>`;
  }
  function vDebt() {
    const F = trkRows('fac').filter(f => f.drawn > 0),
      tot = F.reduce((a, f) => a + f.drawn, 0),
      wac = F.reduce((a, f) => a + f.drawn * f.rate, 0) / tot;
    const yrs = F.reduce((a, f) => a + f.drawn * ((toD(f.mat) - TODAY) / 31557600000), 0) / tot;
    const lend = {};
    F.forEach(f => lend[f.bank] = (lend[f.bank] || 0) + f.drawn);
    const L = Object.entries(lend).sort((a, b) => b[1] - a[1]);
    const fixed = F.filter(f => f.fix === 'Fixed').reduce((a, f) => a + f.drawn, 0),
      isl = F.filter(f => /Islamic/.test(f.bank)).reduce((a, f) => a + f.drawn, 0);
    const cov = trkRows('cov');
    return `<div class="stack">${vh('Debt Dashboard', `Group borrowings · as at ${ASAT}`, exportBtn + printBtn)}
  <div class="kpi5">
    <div class="kc"><span class="lbl">Gross debt</span><span class="val num">${m1(tot)}<small>m</small></span><span class="ctx">${F.length} facilities · 6 banks</span></div>
    <div class="kc"><span class="lbl">Net debt</span><span class="val num">${m1(tot - CASH)}<small>m</small></span><span class="ctx">130.8m at 31 Aug</span></div>
    <div class="kc"><span class="lbl">Weighted average cost</span><span class="val num">${wac.toFixed(2)}<small>%</small></span><span class="ctx">Rate and profit rate, by drawn amount</span></div>
    <div class="kc"><span class="lbl">Average maturity</span><span class="val num">${yrs.toFixed(1)}<small>years</small></span><span class="ctx">To final maturity, by drawn amount</span></div>
    <div class="kc"><span class="lbl">Principal due in 12 months</span><span class="val num">16.4<small>m</small></span><span class="ctx">Next: 3.4m on 30 Sep</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Maturity profile</h2><p>Principal by year, OMR m</p></div><button class="see" data-go="trk-refi">Refinancing ↗</button></div>
      ${colsChart(MATURITY.map(m => m[0]), [{
      name: 'Principal',
      kind: 'bar',
      v: MATURITY.map(m => m[1]),
      fill: 'url(#hatchS)'
    }], {
      labels: 1,
      aria: 'Debt maturity profile'
    })}</section>
    <section class="wp"><div class="wp-h"><div><h2>By lender</h2><p>Drawn, OMR m</p></div></div>${L.map(l => hbar(l[0], l[1], L[0][1])).join('')}
      <h3 style="font-size:13px;font-weight:500;margin:18px 0 8px">Rate mix</h3>${stackBar([['Fixed', fixed, '#344B37'], ['Floating', tot - fixed, '#A1C364']], tot)}
      <h3 style="font-size:13px;font-weight:500;margin:18px 0 8px">Structure</h3>${stackBar([['Conventional', tot - isl, '#B7C997'], ['Islamic', isl, '#F3BD7A']], tot)}</section>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Covenants</h2><p>Latest and projected</p></div><button class="see" data-go="rep-cov">Breach warnings ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Covenant</th><th>Facility</th><th>Requirement</th><th>Latest</th><th>Projected</th><th>Next test</th><th>Status</th></tr></thead><tbody>${cov.map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.fac)}</td><td>${escH(r.test)}</td><td class="nw">${escH(r.actual)}</td><td class="nw">${escH(r.proj)}</td><td class="nw">${fmtDate(r.date)}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function vFac() {
    const fs = facSum(),
      bank = {};
    fs.F.forEach(f => {
      bank[f.bank] = bank[f.bank] || {
        l: 0,
        d: 0
      };
      bank[f.bank].l += f.limit;
      bank[f.bank].d += f.drawn;
    });
    return `<div class="stack">${vh('Banking Facilities Dashboard', `Limits, drawings and headroom · as at ${ASAT}`, exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Total limits</span><span class="val num">${m1(fs.limit)}<small>m</small></span><span class="ctx">${fs.F.length} facilities with 6 banks</span></div>
    <div class="kc"><span class="lbl">Drawn</span><span class="val num">${m1(fs.drawn)}<small>m</small></span><span class="ctx">${(fs.drawn / fs.limit * 100).toFixed(1)}% utilised</span></div>
    <div class="kc"><span class="lbl">Undrawn</span><span class="val num">${m1(fs.avail)}<small>m</small></span><span class="ctx">${m1(fs.cu)}m committed · ${m1(fs.avail - fs.cu)}m uncommitted</span></div>
    <div class="kc peach"><span class="lbl">Renewal due</span><span class="val num">1</span><span class="ctx">Facility F overdraft, 31 Dec 2026</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Facilities</h2><p>OMR m</p></div><button class="see" data-go="trk-fac">Utilization Tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Facility</th><th>Bank</th><th>Borrower</th><th>Type</th><th class="r">Limit</th><th class="r">Drawn</th><th class="r">Available</th><th style="min-width:140px">Utilisation</th><th class="r">Rate</th><th>Maturity</th></tr></thead><tbody>${fs.F.map(f => `<tr><td class="nw">${f.t}</td><td class="nw">${f.bank}</td><td class="nw">${f.entity}</td><td class="nw">${f.type}</td><td class="r num">${m1(f.limit)}</td><td class="r num">${m1(f.drawn)}</td><td class="r num">${m1(f.avail)}</td><td>${utilBar(f.util)}</td><td class="r num">${f.rate.toFixed(2)}%</td><td class="nw">${fmtDate(f.mat)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="wp"><div class="wp-h"><div><h2>By bank</h2><p>Drawn against limit, OMR m</p></div></div>${Object.entries(bank).sort((a, b) => b[1].l - a[1].l).map(([k, v]) => `<div class="hb"><span>${k}</span><span class="tr"><span class="fl" style="width:${v.d / 80 * 100}%"></span><span class="bm" style="left:${v.l / 80 * 100}%"></span></span><span class="v">${m1(v.d)} / ${m1(v.l)}</span></div>`).join('')}<p class="src">Bar = drawn, marker = limit.</p></section></div>`;
  }
  function vFund() {
    const u = USES.reduce((a, x) => a + x[1], 0),
      sc = SOURCES.filter(s => s[3]).reduce((a, x) => a + x[1], 0),
      sp = SOURCES.reduce((a, x) => a + x[1], 0),
      mx = Math.max(u, sp);
    const col = (l, parts, t) => `<div style="margin-bottom:18px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><b style="font-weight:500">${l}</b><span class="num">${m1(t)}m</span></div><div class="meter2" style="height:22px;border-radius:5px;background:transparent;width:${t / mx * 100}%">${parts.map(p => `<span title="${escH(p[0])}: ${m1(p[1])}" style="width:${p[1] / t * 100}%;background:${p[2]};border-right:2px solid #fff"></span>`).join('')}</div><div class="legend-s" style="margin:8px 0 0">${parts.map(p => `<span><i style="background:${p[2]}"></i>${p[0]} · ${m1(p[1])}</span>`).join('')}</div></div>`;
    const shf = trkRows('shf'),
      neg = trkRows('neg').filter(r => !DONE.has(r.status));
    return `<div class="stack">${vh('Funding Dashboard', 'Funding needs and sources · October 2026 to September 2027', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">12-month funding need</span><span class="val num">${m1(u)}<small>m</small></span><span class="ctx">Capex, debt service and tax</span></div>
    <div class="kc"><span class="lbl">Committed sources</span><span class="val num">${m1(sc)}<small>m</small></span><span class="ctx">Operating cash, surplus cash, Facility C</span></div>
    <div class="kc peach"><span class="lbl">Funding gap</span><span class="val num">${m1(u - sc)}<small>m</small></span><span class="ctx">On committed sources only</span></div>
    <div class="kc"><span class="lbl">Pending shareholder funding</span><span class="val num">12.0<small>m</small></span><span class="ctx">Closes the gap if approved</span></div>
  </div>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Uses and sources</h2><p>OMR m, next 12 months</p></div><button class="see" data-go="rep-gap">Gap report ↗</button></div>
      ${col('Uses', USES, u)}${col('Sources', SOURCES, sp)}
      <div class="note"><span>Committed sources cover <b style="font-weight:600">${(sc / u * 100).toFixed(0)}%</b> of the need. The 12.0m capital call would turn a ${m1(u - sc)}m gap into a ${m1(sp - u)}m surplus.</span></div></section>
    <div class="stack">
      <section class="wp"><div class="wp-h"><div><h2>Shareholder funding</h2></div><button class="see" data-go="trk-shf">Tracker ↗</button></div>
        <ul class="mini-list">${shf.map(r => `<li><span>${escH(r.t)} · ${m1(r.amt)}m<small>${escH(r.purpose)}</small></span>${pill(r.status)}</li>`).join('')}</ul></section>
      <section class="wp"><div class="wp-h"><div><h2>Bank negotiations</h2></div><button class="see" data-go="trk-neg">Tracker ↗</button></div>
        <ul class="mini-list">${neg.map(r => `<li><span>${escH(r.t)}<small>${escH(r.bank)} · ${escH(r.price)}</small></span>${pill(r.status)}</li>`).join('')}</ul></section>
    </div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Funding structure</h2><p>31 Aug 2026, OMR m · from the Balance Sheet</p></div></div>${stackBar([['Equity', 382.5, '#344B37'], ['Bank borrowings', 188.2, '#A1C364'], ['Other liabilities', 66.2, '#D8DFCA']], 636.9)}</section></div>`;
  }
  const utilBar = u => `<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;height:8px;border-radius:4px;background:var(--line-2);overflow:hidden;min-width:70px"><span style="display:block;height:100%;width:${Math.min(100, u)}%;background:${u >= 100 ? '#B7C997' : '#A1C364'}"></span></span><span class="num" style="font-size:12px;width:40px;text-align:right">${u.toFixed(0)}%</span></div>`;

  /* ---- Trackers ---- */
  let tState = {
    q: '',
    status: 'All',
    entity: 'All'
  };
  const entKeyOf = T => T.cols.find(c => c[0] === 'entity')?.[0] || (T.cols.find(c => c[0] === 'bank') ? 'bank' : null);
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
    return `<div>${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">${ico.plus}New entry</button>` + exportBtn)}
  <section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker">
    <select id="ts" aria-label="Status"><option value="All">All statuses</option>${sts.map(s => `<option>${escH(s)}</option>`).join('')}</select>
    ${ek ? `<select id="te" aria-label="${ek === 'bank' ? 'Bank' : 'Entity'}"><option value="All">All ${ek === 'bank' ? 'banks' : 'entities'}</option>${ents.map(s => `<option>${escH(s)}</option>`).join('')}</select>` : ''}
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
    if (type === 'status') return `<td class="nw">${pill(v)}${r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''}${r.soon ? `<span class="od">expires in ${-daysLate(r.date)}d</span>` : ''}</td>`;
    if (type === 'm') return `<td class="r num">${v === '' || v == null ? '—' : m2(v)}</td>`;
    if (type === 'mb') return `<td class="r num" style="font-weight:600">${m2(v)}</td>`;
    if (type === 'ccy') return `<td class="r num nw">${escH(r.ccy || '')} ${m2(v)}</td>`;
    if (type === 'rate') return `<td class="r num">${v === '' || v == null ? '—' : (+v).toFixed(2) + '%'}</td>`;
    if (type === 'util') return `<td style="min-width:130px">${utilBar(v)}</td>`;
    return `<td${['bank', 'entity', 'kind', 'type', 'fac', 'owner', 'tenor', 'period', 'test', 'actual', 'proj'].includes(k) ? ' class="nw"' : ''}>${escH(v || '—')}${k === 't' && r._local ? '<span class="newtag">New</span>' : ''}${k === 't' && r.next && TRK[view.slice(4)].cols.every(c => c[0] !== 'next') ? `<small style="display:block;color:var(--ink-2);margin-top:2px">${escH(r.next)}</small>` : ''}</td>`;
  }
  function fillTrk() {
    const key = view.slice(4),
      T = TRK[key],
      all = trkRows(key),
      rows = trkFiltered(),
      numT = ['m', 'mb', 'ccy', 'rate'];
    $('#tt').innerHTML = `<thead><tr>${T.cols.map(c => `<th class="${numT.includes(c[2]) ? 'r' : ''}">${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${T.cols.map(c => cell(r, c)).join('')}<td class="r">${r._local ? `<button class="pbtn noprint" data-tdel="${r._local}" aria-label="Remove entry" style="width:28px;height:28px"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>` : ''}</td></tr>`).join('') : `<tr><td colspan="${T.cols.length + 1}" style="text-align:center;color:var(--ink-2);padding:28px">No entries match these filters.</td></tr>`}</tbody>`;
    $('#tc').textContent = `${rows.length} of ${all.length} entries`;
    const by = {};
    all.forEach(r => by[r.status] = (by[r.status] || 0) + 1);
    const od = all.filter(r => r.overdue).length,
      soon = all.filter(r => r.soon).length;
    let extra = '';
    const sum = (k, f = r => true) => all.filter(f).reduce((a, r) => a + (+r[k] || 0), 0);
    if (key === 'debt') extra = `<span>Due, not yet paid <b>${m2(sum('tot', r => !DONE.has(r.status)))}m</b></span>`;
    if (key === 'fac') extra = `<span>Limits <b>${m1(sum('limit'))}m</b></span><span>Drawn <b>${m1(sum('drawn'))}m</b></span>`;
    if (key === 'bg') extra = `<span>Active guarantees <b>${m2(sum('amt', r => !DONE.has(r.status)))}m</b></span>`;
    if (key === 'eq') extra = `<span>Paid in 2026 <b>${m2(sum('amt', r => r.status === 'Paid' && r.date >= '2026'))}m</b></span>`;
    $('#tchips').innerHTML = Object.entries(by).map(([k, v]) => `<span>${escH(k)} <b>${v}</b></span>`).join('') + (od ? `<span class="warn">Overdue <b>${od}</b></span>` : '') + (soon ? `<span class="warn">Expiring within 30 days <b>${soon}</b></span>` : '') + extra;
  }

  /* ---- AI reports ---- */
  function repHead(title, sources, actions = '') {
    return `<div class="vh"><div><span class="ai-badge">${ico.spark}Drafted by OFC AI</span><h2 style="margin-top:10px">${title}</h2><p>Generated 23 Sep 2026, 08:40 · Cash position as at ${ASAT}</p><p class="src">Sources: <b>${sources}</b></p></div><div class="vh-actions noprint"><button class="btn ghost sm" data-regen>${ico.spark}Regenerate</button>${actions}${printBtn}<button class="btn sm" data-toast="Shared with the Group CFO for review.">Share</button></div></div>`;
  }
  function vRep(v) {
    const fc = forecast('base'),
      fs = facSum(),
      cov = trkRows('cov'),
      atRisk = cov.filter(r => r.status !== 'Compliant');
    const due = trkRows('debt').filter(r => !DONE.has(r.status) && -daysLate(r.date) <= 90).sort((a, b) => a.date.localeCompare(b.date));
    const u = USES.reduce((a, x) => a + x[1], 0),
      sc = SOURCES.filter(s => s[3]).reduce((a, x) => a + x[1], 0);
    let b = '';
    if (v === 'rep-forecast') {
      const f = forecast();
      b = repHead('Cash-flow forecasting', 'Cash Tracker, Debt Repayment Tracker, capex plan, Shareholder Funding Tracker', scnSel() + exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Under the <b>${SCN[scenario].toLowerCase()}</b>, group cash moves from <b>${m1(CASH)}m</b> to <b>${m1(f.rows[12].close)}m</b> over the next 13 weeks. ${f.below.length ? `It falls below the ${m1(BUFFER)}m buffer for <b>${f.below.length} weeks</b> from the week of ${f.first.w}, reaching a low of <span class="neg">${m1(f.low.close)}m</span> in the week of ${f.low.w}.` : `It stays above the ${m1(BUFFER)}m buffer throughout.`}</p>
    ${fcChart(f, 300, 1100)}
    <h3>What drives it</h3><ul class="pts">
      <li>Subsidiary D milestones account for ${m1(f.rows.reduce((a, r) => a + r.capex, 0))}m of capital expenditure, concentrated in the weeks of 18 Oct and 15 Nov.</li>
      <li>Debt service of ${m2(f.rows.reduce((a, r) => a + r.debt, 0))}m, taken from the Debt Repayment Tracker.</li>
      <li>The 12.0m shareholder tranche is assumed to arrive on 14 Dec; without it, closing cash would be ${m1(f.rows[12].close - 12)}m.</li>
      <li>Operating receipts average ${m1(f.rows.reduce((a, r) => a + r.rec, 0) / 13)}m a week, in line with the last 12 weeks.</li></ul>
    <h3>Weekly detail</h3>${fcTable(f)}</section>`;
    } else if (v === 'rep-liq') {
      b = repHead('Liquidity shortage alerts', '13-week forecast, Group Cash Position by entity') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">OFC AI found <b>${LOW_CASH.length + (fc.first ? 1 : 0)} liquidity alerts</b>: one at group level and ${LOW_CASH.length} at subsidiary level.</p>
    <h3>Group</h3><ul class="att"><li><button data-go="liq"><span class="ic">${ico.warn}</span><span><div class="t">Cash below the ${m1(BUFFER)}m buffer for ${fc.below.length} weeks from the week of ${fc.first.w}</div><div class="m">Low of ${m1(fc.low.close)}m in the week of ${fc.low.w}, ${m1(fc.gap)}m short of the buffer</div></span><span></span>${chev}</button></li></ul>
    <h3>Subsidiaries</h3><ul class="att">${LOW_CASH.map(l => `<li><button data-go="cash"><span class="ic">${ico.warn}</span><span><div class="t">${l[0]} holds ${m2(l[1])}m against ${m2(l[2])}m of payments due in the next two weeks</div><div class="m">${l[3]}</div></span><span></span>${chev}</button></li>`).join('')}</ul>
    <h3>Suggested actions</h3><ul class="pts"><li>Fund Subsidiary K's 1 October payroll through the intercompany account, ahead of the Bank B working capital line.</li><li>Bring forward the Facility C tranche 2 drawdown so Subsidiary D's November milestones do not draw on group cash. See <button class="see" data-go="rep-source">funding recommendations</button>.</li></ul></section>`;
    } else if (v === 'rep-repay') {
      b = repHead('Upcoming repayment alerts', 'Debt Repayment Tracker, Group Cash Position', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${due.length} payments</b> totalling <b>${m2(due.reduce((a, r) => a + r.tot, 0))}m</b> fall due in the next 90 days. ${due.filter(r => r.status === 'Funds reserved').length} are already funded; the rest are covered by forecast cash in the week they fall due.</p>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Due</th><th>Facility</th><th>Bank</th><th>Borrower</th><th class="r">Principal</th><th class="r">Interest</th><th class="r">Total</th><th>Days</th><th>Status</th></tr></thead><tbody>${due.map(r => `<tr><td class="nw">${fmtDate(r.date)}</td><td class="nw">${r.t}</td><td class="nw">${r.bank}</td><td class="nw">${r.entity}</td><td class="r num">${m2(r.prin)}</td><td class="r num">${m2(r.int)}</td><td class="r num" style="font-weight:600">${m2(r.tot)}</td><td class="nw">${-daysLate(r.date)}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div>
    <h3>Notes</h3><ul class="pts"><li>The 30 Sep Facility A instalment is reserved in the Bank A current account.</li><li>The 16 Nov Facility C interest falls in the same week as a 5.4m Subsidiary D milestone, the lowest-cash week of November.</li></ul></section>`;
    } else if (v === 'rep-cov') {
      b = repHead('Covenant breach warnings', 'Covenant Tracker, 13-week forecast, Group P&amp;L') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${atRisk.length} of ${cov.length} covenants</b> need attention. None is in breach today.</p>
    <ul class="att">${atRisk.map(r => `<li><button data-go="trk-cov"><span class="ic">${ico.warn}</span><span><div class="t">${escH(r.t)} · ${escH(r.fac)} · ${escH(r.status)}</div><div class="m">Requirement ${escH(r.test)} · latest ${escH(r.actual)} · projected ${escH(r.proj)} at ${fmtDate(r.date)}${r.next ? ' · ' + escH(r.next) : ''}</div></span><span></span>${chev}</button></li>`).join('')}</ul>
    <h3>Net debt / EBITDA outlook</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Test date</th><th class="r">Net debt</th><th class="r">LTM EBITDA</th><th class="r">Ratio</th><th class="r">Headroom</th></tr></thead><tbody>
      <tr><td>31 Aug 2026 (latest)</td><td class="r num">130.8</td><td class="r num">27.9</td><td class="r num">4.69x</td><td class="r num">6.2%</td></tr>
      <tr><td>30 Sep 2026 (projected)</td><td class="r num">134.0</td><td class="r num">27.9</td><td class="r num">4.80x</td><td class="r num">4.0%</td></tr>
      <tr><td>31 Dec 2026 (projected)</td><td class="r num">145.1</td><td class="r num">29.6</td><td class="r num">4.90x</td><td class="r num">2.0%</td></tr></tbody></table></div>
    <h3>What would restore headroom</h3><ul class="pts"><li>Receiving the 12.0m capital call before the 31 Dec test is already assumed; a delay into January would take the ratio to about 5.3x.</li><li>A drawdown on Facility C does not change net debt, because the cash is held until spent.</li><li>The DSRA shortfall of 0.18m can be cured from Subsidiary D's project account before 16 Nov.</li></ul></section>`;
    } else if (v === 'rep-gap') {
      b = repHead('Funding gap identification', 'Funding Dashboard, capex plan, Debt Repayment Tracker, Shareholder Funding Tracker') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Over the next 12 months the group needs <b>${m1(u)}m</b> and has <b>${m1(sc)}m</b> of committed sources, a gap of <span class="neg"><b>${m1(u - sc)}m</b></span>. The pending 12.0m capital call would close it.</p>
    <div class="grid-eq"><div><h3>Uses</h3>${USES.map(x => hbar(x[0], x[1], 40, x[2])).join('')}</div><div><h3>Sources</h3>${SOURCES.map(x => hbar(x[0] + (x[3] ? '' : ' *'), x[1], 40, x[2])).join('')}<p class="src">* Not yet committed</p></div></div>
    <h3>Timing</h3><ul class="pts"><li>The gap is concentrated in November and early December, when Subsidiary D milestones fall before the capital call arrives. The 13-week forecast shows cash at ${m1(fc.low.close)}m in the week of ${fc.low.w}.</li><li>From January, operating cash flow and the Facility C tranche cover the remaining capex.</li></ul></section>`;
    } else if (v === 'rep-source') {
      const O = [['Draw Facility C tranche 2', '10.0m', '6.40%', 'Committed; conditions precedent with Bank C credit committee (30 Oct)', 'Matches Subsidiary D capex and tenor, and cures the reserve account shortfall.', 1], ['Draw the Facility E revolver', 'Up to 12.0m', '5.50%', 'Committed and available now', 'Cheapest and fastest, but short-term; keep as the liquidity backstop.', 0], ['Accelerate the shareholder capital call', '12.0m', 'No interest cost', 'Under shareholder review', 'Lowest cost, but timing is outside treasury\'s control.', 0], ['Refinance Facility A with Bank C', '64.0m', '35 bps lower', 'Term sheet received', 'Saves about 0.22m a year; does not add liquidity.', 0]];
      b = repHead('Optimal funding-source recommendations', 'Banking Facilities, Bank Negotiation Tracker, Funding Dashboard, 13-week forecast') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>Recommendation:</b> draw <b>Facility C tranche 2 (10.0m)</b> in the week of 8 Nov to fund Subsidiary D's milestones, and keep the Facility E revolver undrawn as a backstop. With the drawdown, the lowest weekly cash in the forecast is ${m1(Math.min(...fc.rows.map((r, i) => r.close + (i >= 6 ? 10 : 0))))}m, above the ${m1(BUFFER)}m buffer in every week.</p>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Option</th><th>Amount</th><th>Cost</th><th>Availability</th><th>Assessment</th></tr></thead><tbody>${O.map(o => `<tr><td class="nw" style="font-weight:${o[5] ? 600 : 400}">${o[0]}${o[5] ? ' <span class="pill ok" style="margin-left:6px">Recommended</span>' : ''}</td><td class="nw">${o[1]}</td><td class="nw">${o[2]}</td><td>${o[3]}</td><td>${o[4]}</td></tr>`).join('')}</tbody></table></div>
    <h3>Why this order</h3><ul class="pts"><li>Facility C is project finance for Subsidiary D, so drawing it matches long-dated capex with long-dated debt.</li><li>The revolver is cheaper but short-term; using it for capex would leave no committed liquidity for surprises.</li><li>Neither drawdown changes net debt, so the Net debt / EBITDA covenant is unaffected.</li></ul></section>`;
    } else {
      b = repHead('Treasury / debt summary for CFO and EC', 'All Treasury dashboards and trackers') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Cash of <b>${m1(CASH)}m</b> and <b>${m1(fs.cu)}m</b> of committed undrawn facilities give total liquidity of <b>${m1(CASH + fs.cu)}m</b>. Gross debt is <b>${m1(DEBT)}m</b> across 7 facilities and 6 banks, with net debt / EBITDA at <b>4.69x</b> against a 5.00x limit.</p>
    <div class="kpi4" style="margin:18px 0">${[['Cash', m1(CASH) + 'm'], ['Liquidity', m1(CASH + fs.cu) + 'm'], ['Net debt', m1(netDebt()) + 'm'], ['Lowest forecast', m1(fc.low.close) + 'm']].map(k => `<div class="kc" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">${k[0]}</span><span class="val num" style="font-size:26px">${k[1]}</span></div>`).join('')}</div>
    <h3>For decision</h3><ul class="pts"><li>Approve drawing Facility C tranche 2 (10.0m) in the week of 8 Nov.</li><li>Endorse the Bank C term sheet for the Facility A refinancing, subject to comparison with Bank D.</li></ul>
    <h3>For noting</h3><ul class="pts"><li>Net debt / EBITDA is projected at 4.80x at the 30 Sep test and 4.90x at 31 Dec.</li><li>The Facility C reserve account is 0.18m short and will be topped up before 16 Nov.</li><li>${due.length} debt payments totalling ${m2(due.reduce((a, r) => a + r.tot, 0))}m are due in the next 90 days.</li><li>Facility F overdraft renewal is with Bank A credit for 31 Dec.</li><li>Subsidiaries K, N and O hold less than two weeks of payments in cash.</li></ul></section>`;
    }
    return `<div class="stack">${b}</div>`;
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
    if (view === 'liq' || view === 'rep-forecast') {
      const f = forecast();
      return download(`13-week-cash-forecast-${scenario}.csv`, [['Week of', 'Opening', 'Receipts', 'Operating payments', 'Capex', 'Debt service', 'Tax', 'Shareholder funding', 'Closing'], ...f.rows.map(r => [r.w, m2(r.open), m2(r.rec), m2(r.opx), m2(r.capex), m2(r.debt), m2(r.tax), m2(r.fund), m2(r.close)])]);
    }
    if (view === 'cash') return download('group-cash-position.csv', [['Bank', 'OMR m'], ...BY_BANK, [], ['Entity', 'OMR m'], ...BY_ENT, [], ['Account type', 'OMR m'], ...BY_TYPE.map(t => [t[0], t[1]])]);
    if (view === 'debtd' || view === 'facd') return download('banking-facilities.csv', [['Facility', 'Bank', 'Borrower', 'Type', 'Limit', 'Drawn', 'Available', 'Rate %', 'Maturity'], ...trkRows('fac').map(f => [f.t, f.bank, f.entity, f.type, f.limit, f.drawn, m2(f.avail), f.rate, fmtDate(f.mat)])]);
    if (view === 'fund') return download('funding-uses-and-sources.csv', [['Uses', 'OMR m'], ...USES.map(u => [u[0], u[1]]), [], ['Sources', 'OMR m', 'Committed'], ...SOURCES.map(s => [s[0], s[1], s[3] ? 'Yes' : 'No'])]);
    if (view === 'rep-repay') return download('upcoming-repayments.csv', [['Due', 'Facility', 'Bank', 'Principal', 'Interest', 'Total', 'Status'], ...trkRows('debt').filter(r => !DONE.has(r.status)).map(r => [fmtDate(r.date), r.t, r.bank, m2(r.prin), m2(r.int), m2(r.tot), r.status])]);
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
  view = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
  render();
}