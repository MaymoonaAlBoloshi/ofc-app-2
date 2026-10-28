import { gateTwoSections, gateTwoReviewGaps } from '../lib/gate-two.mjs';
import { gateTwoControls, gateTwoField, installGateTwo } from './investment-gate-two.js';
import { dashboardCreateLink } from "./dashboard-create-link.js";
import { gateReadiness, renderGateReadiness, gateActionBlockers, renderGateBlockers } from '../lib/gate-readiness.mjs';
import { gateNavigation, currentInvestmentGate } from '../lib/gate-navigation.mjs';
import { createGateOne } from './investment-gate-one';
import { createShared } from "./shared";
import { createInvestmentLibrary } from "./investment-library";
import { createInvestmentDocuments } from "./investment-documents";
import { linkedDefaults, stageChecklist, handoverSnapshot } from "./investment-automation.mjs";
export function initialize(scope) {
  const APP_ID = 'investment',
    APP_NAME = 'Investment & Deal Sourcing';
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
     Investment & Deal Sourcing app · Oman Food Capital
     Built around OFC's five stage gates, following OFC's Investment & Asset
     Management System business requirements document precisely: the Investment
     Division runs SG1–SG3 (Screening → PIN → CEO → EC → DD → Board → FID →
     Closing → Handover), PMO runs SG4 and Asset Management SG5. Value-assurance
     questions per gate, PIN/Pre-Feasibility Report terminology, Investment
     Closure Reports, and EC's two outcomes (recommend proceeding / additional
     DD) are quoted or modelled directly from that document. Trackers A–H
     (Pipeline, Stage-Gate, DD, KYC, Tasks, Legal Closing, PMO Handover, Weekly
     Meeting), dashboards and AI reports follow the deck. Al Jazir, AAAID and
     Subsidiary D items come from OFC's decisions register; other figures are
     illustrative.
     ===================================================================== */

  /* ---------------- The five stage gates ----------------
     From the OFC deck: the Investment Division runs SG1–SG3 through
     Screening → PIN → CEO → EC → DD → Board → FID → Closing → Handover,
     then hands over to the PMO for SG4 (execution) and Asset Management for SG5 (operation). */
  const STEPS = ['Screening', 'PIN', 'CEO', 'EC', 'DD', 'Board', 'FID', 'Closing', 'Handover'];
  const STEP_LBL = {
    Screening: 'Screening',
    PIN: 'PIN',
    CEO: 'CEO approval',
    EC: 'Assessment & EC',
    DD: 'Due diligence',
    Board: 'Board',
    FID: 'FID',
    Closing: 'Legal closing',
    Handover: 'PMO handover'
  };
  const GATE_OF = {
    Screening: 1,
    PIN: 1,
    CEO: 1,
    EC: 2,
    DD: 3,
    Board: 3,
    FID: 3,
    Closing: 3,
    Handover: 3
  };
  /* Value-assurance questions are quoted verbatim from OFC's Business Requirements
     & Process Understanding Document (one per stage gate, SG-1 to SG-5). */
  const GATES = [{
    n: 1,
    t: 'Origination',
    own: 'Investment Division',
    steps: ['Screening', 'PIN', 'CEO'],
    q: 'Do we understand the Investment and what value it will add to the Entity?',
    exit: 'CEO approves the PIN'
  }, {
    n: 2,
    t: 'Assessment',
    own: 'Investment Division',
    steps: ['EC'],
    q: 'Have we selected a development option that fits the objective?',
    exit: 'EC approves due diligence'
  }, {
    n: 3,
    t: 'Development & FID',
    own: 'Investment Division',
    steps: ['DD', 'Board', 'FID', 'Closing', 'Handover'],
    q: 'Is everything in place to ensure proper execution of the Investment?',
    exit: 'Board FID, closing and handover to PMO'
  }, {
    n: 4,
    t: 'Execution',
    own: 'Project Management',
    q: 'Are we ready to operate?',
    exit: 'Operations accept the asset'
  }, {
    n: 5,
    t: 'Operation & value creation',
    own: 'Asset Management',
    q: 'Lessons learnt: did we achieve the intended value?',
    exit: 'Hold, grow or exit'
  }];
  const SG4 = [{
    t: 'Subsidiary D',
    d: 'Construction · mobilisation delay escalated',
    capex: 96.0,
    st: 'Delayed'
  }, {
    t: 'Subsidiary P',
    d: 'Commissioning',
    capex: 18.0,
    st: 'On track'
  }, {
    t: 'Subsidiary Q',
    d: 'Pre-commissioning',
    capex: 14.0,
    st: 'On track'
  }];
  const SG5 = {
    n: 14,
    rev: 162.4,
    note: '14 operating subsidiaries · YTD revenue 162.4m'
  };
  const HURDLE = 12.0,
    MAX_PAYBACK = 8;
  /* Tracker A rows: [id, name, partner, sector, type, geography, source, value, OFC requirement, stage, status, fit, attractiveness, probability %, risk, owner, screening date, target date, progress %, next step, screening recommendation] */
  const DEALS_RAW = [['D01', 'Al Jazir', 'Partner A (regional aquaculture operator)', 'Fisheries & aquaculture', 'Greenfield', 'Al Wusta', 'Government referral', 48.0, 19.2, 'FID', 'Active', 'High', 'High', 90, 'Medium', 'Senior Investment Manager', '2025-02-10', '2026-10-14', 85, 'Secure financing commitment letters before the BEC on 14 Oct', 'Pursue'], ['D02', 'AAAID stake divestment (ABMC/ANPC)', 'ABMC / ANPC', 'Food production (associate)', 'Divestment', 'Regional', 'OFC portfolio review', 14.0, 0, 'Board', 'Active', 'High', 'Medium', 80, 'Low', 'Investment Manager 1', '2025-11-05', '2026-09-30', 80, 'Divestment Committee decision on the consideration price', 'Pursue'], ['D03', 'Project Nakhla', 'Partner B (date processor and exporter)', 'Dates processing', 'Brownfield', 'Ad Dakhiliyah', 'Advisor introduction', 22.0, 13.2, 'DD', 'Active', 'High', 'High', 70, 'Medium', 'Investment Manager 2', '2026-01-20', '2026-11-30', 60, 'Close the working capital red flag from financial DD', 'Pursue'], ['D04', 'Project Marai', 'Partner C (dairy operator)', 'Dairy', 'Greenfield', 'Dhofar', 'Partner approach', 36.0, 14.4, 'EC', 'Active', 'High', 'Medium', 55, 'Medium', 'Senior Investment Manager', '2026-02-14', '2026-10-07', 50, 'Present the assessment to the EC on 7 Oct', 'Pursue'], ['D05', 'Project Sunbul', 'Partner D (feed producer)', 'Fodder & feed grains', 'Greenfield', 'Al Batinah North', 'OFC origination', 18.5, 9.3, 'EC', 'Active', 'High', 'Medium', 50, 'Medium', 'Investment Manager 1', '2026-04-02', '2026-11-15', 35, 'Complete the in-house financial model', 'Pursue'], ['D06', 'Project Raha', 'Partner E (logistics group)', 'Cold-chain logistics', 'Brownfield', 'Muscat', 'Partner approach', 15.0, 7.5, 'EC', 'Approved for next stage', 'Medium', 'High', 45, 'Medium', 'Investment Analyst', '2026-06-18', '2026-12-15', 20, 'Request the business plan and model from the partner', 'Pursue'], ['D07', 'Subsidiary B capacity expansion', 'Subsidiary B', 'Poultry', 'Greenfield', 'Al Batinah South', 'Asset Management request', 12.0, 6.0, 'EC', 'Active', 'High', 'High', 75, 'Low', 'Investment Manager 2', '2026-05-10', '2026-10-30', 40, 'Finalise the business case with Asset Management', 'Pursue'], ['D08', 'Project Bahr', 'Partner F (shrimp farming specialist)', 'Fisheries & aquaculture', 'Greenfield', 'Al Sharqiyah South', 'Partner approach', 26.0, 10.4, 'CEO', 'Active', 'High', 'Medium', 40, 'Medium', 'Investment Manager 1', '2026-06-05', '2026-09-29', 25, 'CEO decision on the PIN', 'Pursue'], ['D09', 'Project Mawj', 'Partner G (international tuna processor)', 'Fish processing', 'Greenfield', 'Al Wusta', 'Government referral', 42.0, 16.8, 'PIN', 'Active', 'Medium', 'Medium', 30, 'High', 'Senior Investment Manager', '2026-05-22', '2026-10-25', 20, 'Answer the CEO\'s information request', 'Pursue'], ['D10', 'Project Sanam', 'Partner H (poultry group)', 'Poultry processing', 'Brownfield', 'Al Batinah North', 'Advisor introduction', 31.0, 18.6, 'Screening', 'Active', 'Medium', 'Medium', 35, 'High', 'Investment Manager 2', '2026-08-25', '2026-10-20', 10, 'Resolve the KYC concern on the partner\'s ownership', 'Need more information'], ['D11', 'Project Wadi', 'Partner I (agritech operator)', 'Greenhouse vegetables', 'Greenfield', 'Ad Dakhiliyah', 'Partner approach', 9.5, 4.8, 'Screening', 'Active', 'Medium', 'Medium', 25, 'Medium', 'Investment Analyst', '2026-09-02', '2026-10-15', 10, 'Complete the screening scorecard', 'Pursue'], ['D12', 'Project Seed', 'Partner J (seed technology venture)', 'Seeds & agritech', 'Greenfield', 'Muscat', 'OFC origination', 6.0, 3.0, 'Screening', 'Active', 'Medium', 'Medium', 20, 'Medium', 'Investment Analyst', '2026-09-10', '2026-10-30', 5, 'First meeting with the founders', 'Pursue'], ['D13', 'Project Laban', 'Partner K (camel dairy)', 'Dairy', 'Greenfield', 'Dhofar', 'Partner approach', 11.0, 5.5, 'Screening', 'Active', 'Medium', 'Medium', 25, 'Medium', 'Investment Manager 1', '2026-09-14', '2026-10-28', 10, 'Site visit', 'Pursue'], ['D14', 'Project Burj', 'Partner L (vertical farming start-up)', 'Greenhouse vegetables', 'Greenfield', 'Muscat', 'Partner approach', 7.0, 3.5, 'Screening', 'Inactive', 'Low', 'Medium', 10, 'High', 'Investment Analyst', '2026-03-11', '', 5, 'Waiting for audited financials', 'Need more information'], ['D15', 'Project Jana', 'Partner M (honey producer)', 'Honey & bee products', 'Brownfield', 'Dhofar', 'Partner approach', 3.2, 3.2, 'Screening', 'Inactive', 'Low', 'Low', 10, 'Medium', 'Investment Analyst', '2026-02-08', '', 5, 'On hold: below the minimum ticket size', 'Hold'], ['D16', 'Project Samak', 'Partner N (fish feed producer)', 'Aquafeed', 'Greenfield', 'Al Wusta', 'OFC origination', 8.5, 4.3, 'Screening', 'Inactive', 'Medium', 'Low', 15, 'Medium', 'Investment Manager 1', '2026-04-17', '', 5, 'On hold until Al Jazir reaches FID', 'Hold'], ['D17', 'Project Qamh', 'Partner O (flour miller)', 'Flour milling', 'Brownfield', 'Al Batinah North', 'Advisor introduction', 20.0, 8.0, 'EC', 'Deferred', 'Medium', 'Medium', 20, 'Medium', 'Senior Investment Manager', '2026-01-06', '2027-03-31', 45, 'EC deferred: revisit after the 2027 budget', 'Pursue'], ['D18', 'Project Zaytoon', 'Partner P (olive grower)', 'Olive oil', 'Greenfield', 'Ad Dakhiliyah', 'Partner approach', 5.0, 2.5, 'Screening', 'Declined', 'Low', 'Low', 0, 'High', 'Investment Analyst', '2026-02-20', '', 0, 'Declined: limited scale and water constraints', 'Reject'], ['D19', 'Project Karak', 'Partner Q (tea blender)', 'Tea blending', 'Brownfield', 'Muscat', 'Partner approach', 4.0, 4.0, 'Screening', 'Declined', 'Low', 'Low', 0, 'Medium', 'Investment Analyst', '2026-03-02', '', 0, 'Declined: outside the food security mandate', 'Reject'], ['D20', 'Project Luban', 'Partner R (frankincense products)', 'Frankincense products', 'Brownfield', 'Dhofar', 'Partner approach', 6.5, 3.2, 'Screening', 'Declined', 'Low', 'Low', 0, 'Medium', 'Investment Analyst', '2026-03-25', '', 0, 'Declined: outside the food mandate', 'Reject'], ['D21', 'Project Rimal', 'Partner S (aquaculture technology)', 'Fisheries & aquaculture', 'Greenfield', 'Al Wusta', 'Partner approach', 12.0, 6.0, 'PIN', 'Declined', 'Medium', 'Low', 0, 'High', 'Investment Manager 1', '2026-01-28', '', 0, 'CEO declined the PIN: unproven technology', 'Reject']];
  /* Screening scores (1–5): market, commercial, financial, partner */
  const SCORES = {
    D01: [5, 4, 4, 4],
    D02: [3, 4, 4, 4],
    D03: [4, 4, 5, 4],
    D04: [4, 3, 4, 4],
    D05: [4, 4, 3, 3],
    D06: [4, 4, 4, 3],
    D07: [4, 5, 5, 5],
    D08: [4, 3, 4, 3],
    D09: [3, 3, 3, 2],
    D10: [4, 3, 3, 2],
    D11: [3, 3, 3, 3],
    D12: [3, 2, 2, 3],
    D13: [3, 3, 3, 3],
    D14: [3, 2, 2, 2],
    D15: [2, 2, 2, 3],
    D16: [3, 2, 3, 3],
    D17: [3, 3, 3, 3],
    D18: [2, 2, 1, 2],
    D19: [1, 2, 2, 3],
    D20: [1, 2, 2, 3],
    D21: [3, 2, 2, 2]
  };
  /* Financial snapshots: total equity, debt, OFC share %, equity IRR, NPV, payback years, downside IRR, sensitivities */
  const FIN = {
    D01: {
      eq: 24.0,
      debt: 24.0,
      share: 80,
      irr: 14.2,
      npv: 8.4,
      pb: 7.5,
      down: 9.1,
      sens: [['Feed cost +10%', 12.3], ['Selling price −10%', 10.4], ['Capex +15%', 12.0]],
      rev5: 21.5,
      eb5: 7.9,
      exit: 'Long-term hold; option to list after year 10',
      stage: 'Final'
    },
    D02: {
      proceeds: 14.0,
      range: '12.5–15.5',
      book: 11.9,
      gain: 2.1,
      irr: 7.8,
      stage: 'Divestment',
      exit: 'Sale of the full stake to ABMC / ANPC'
    },
    D03: {
      eq: 13.2,
      debt: 4.0,
      share: 60,
      irr: 16.5,
      npv: 3.9,
      pb: 6.1,
      down: 11.2,
      sens: [['Export prices −10%', 12.9], ['Working capital +20%', 15.1], ['Capex +15%', 15.4]],
      stage: 'DD'
    },
    D04: {
      eq: 18.0,
      debt: 18.0,
      share: 80,
      irr: 12.8,
      npv: 4.2,
      pb: 8.2,
      down: 8.9,
      sens: [['Milk price −5%', 10.6], ['Feed cost +10%', 10.9], ['Herd yield −5%', 11.2]],
      stage: 'In-house'
    },
    D05: {
      eq: 12.4,
      debt: 6.1,
      share: 75,
      irr: 13.5,
      npv: 2.1,
      pb: 7.0,
      down: 9.8,
      sens: [['Water cost +20%', 11.4], ['Yield −10%', 10.7]],
      stage: 'Preliminary'
    },
    D06: {
      eq: 10.0,
      debt: 5.0,
      share: 75,
      irr: 15.0,
      stage: 'Indicative'
    },
    D07: {
      eq: 6.0,
      debt: 6.0,
      share: 100,
      irr: 17.2,
      npv: 5.0,
      pb: 5.5,
      down: 13.4,
      sens: [['Chicken price −10%', 13.1], ['Feed cost +10%', 14.0]],
      stage: 'In-house'
    },
    D08: {
      eq: 13.0,
      debt: 13.0,
      share: 80,
      irr: 14.5,
      stage: 'Indicative'
    },
    D09: {
      eq: 21.0,
      debt: 21.0,
      share: 80,
      stage: 'Indicative'
    }
  };
  /* In-house assessment: information received (1 received, 0.5 partial, 0 missing) and analysis scores */
  const INFO_ITEMS = ['Business plan', 'Financial model', 'Feasibility study', 'Market study', 'Technical study', 'CAPEX assumptions', 'Commercial assumptions', 'Legal / corporate documents'];
  const ASSESS = {
    D04: {
      info: [1, 1, 1, 1, .5, 1, 1, 1],
      sc: {
        'Strategic fit': 5,
        'Market attractiveness': 4,
        'Commercial viability': 3,
        'Technical viability': 4,
        'Financial viability': 4
      },
      risks: 'Milk price regulation; heat stress on herd yields',
      gaps: 'Technical study on cooling systems still partial',
      rec: 'Proceed to EC'
    },
    D05: {
      info: [1, .5, 0, 1, 0, 1, .5, 1],
      sc: {
        'Strategic fit': 5,
        'Market attractiveness': 4,
        'Commercial viability': 3,
        'Technical viability': 3,
        'Financial viability': 3
      },
      risks: 'Water availability and cost',
      gaps: 'No feasibility or technical study yet',
      rec: 'Conduct additional analysis'
    },
    D06: {
      info: [.5, 0, 0, 0, 0, 0, 0, 1],
      sc: {
        'Strategic fit': 3,
        'Market attractiveness': 4,
        'Commercial viability': 4,
        'Technical viability': 3,
        'Financial viability': 3
      },
      risks: 'Customer concentration',
      gaps: 'Business plan and model not yet received',
      rec: 'Seek more information'
    },
    D07: {
      info: [1, 1, .5, 1, 1, 1, 1, 1],
      sc: {
        'Strategic fit': 5,
        'Market attractiveness': 4,
        'Commercial viability': 5,
        'Technical viability': 5,
        'Financial viability': 5
      },
      risks: 'Feed price volatility',
      gaps: 'Internal feasibility note to be finalised',
      rec: 'Proceed to EC'
    }
  };
  /* EC review */
  const EC = {
    D04: {
      date: '2026-10-07',
      st: 'Scheduled',
      find: 'Strong strategic fit; returns close to the 12% hurdle',
      qs: ['Sensitivity to regulated milk prices', 'Partner\'s track record in hot climates'],
      resp: 'Responses in the EC paper annex',
      rec: 'Appoint an external consultant for independent vetting',
      dec: 'Pending',
      fa: {
        scope: 'Technical, commercial and financial DD',
        cons: 'To be procured',
        budget: 180,
        fin: 'Not yet requested',
        proc: 'Not started',
        appt: 'Not started',
        done: '2027-01-31'
      }
    },
    D03: {
      date: '2026-06-15',
      st: 'Held',
      find: 'Attractive entry price; working capital and licences need verification',
      qs: ['Normalised working capital', 'Export contract terms'],
      resp: 'Addressed in the DD scope',
      rec: 'Appoint external consultants for due diligence',
      dec: 'Appoint external consultant for independent vetting',
      fa: {
        scope: 'Commercial, financial, legal, technical, tax, ESG DD and valuation',
        cons: 'Consultants A–E',
        budget: 230,
        fin: 'Approved 25 Jun 2026',
        proc: 'Completed',
        appt: 'Appointed 10 Jul 2026',
        done: '2026-11-15'
      }
    },
    D17: {
      date: '2026-06-30',
      st: 'Held',
      find: 'Returns below hurdle at current wheat prices',
      qs: ['Wheat price outlook', 'Capacity of the existing mill'],
      resp: 'Provided at the meeting',
      rec: 'Defer',
      dec: 'Defer'
    },
    D02: {
      date: '2026-03-12',
      st: 'Held',
      find: 'Stake is non-core; exit value above book',
      qs: ['Pre-emption rights of other shareholders'],
      resp: 'Legal opinion provided',
      rec: 'Proceed toward Board',
      dec: 'Proceed toward Board / next stage'
    },
    D01: {
      date: '2025-09-18',
      st: 'Held',
      find: 'Strong fit with national aquaculture targets; partner capability to be verified',
      qs: ['Feasibility study independence', 'Licence transfer'],
      resp: 'Independent vetting agreed',
      rec: 'Conduct due diligence',
      dec: 'Conduct further assessment / due diligence'
    }
  };
  /* Final evaluation & FID (Al Jazir) */
  const FID_D01 = {
    dd: [['Commercial', 'Cleared'], ['Financial', 'Cleared'], ['Technical', 'Cleared with Conditions'], ['Legal', 'Cleared with Conditions'], ['ESG', 'Cleared with Conditions'], ['Partner', 'Cleared'], ['Regulatory', 'Open Issue']],
    rec: 'Proceed subject to conditions',
    board: {
      date: '2026-07-20',
      paper: 'Approved',
      dec: 'Approved subject to conditions',
      conds: ['Debt financing committed on terms no worse than the model', 'Fishing licence transferred to the project company', 'Mangrove buffer zone reflected in the site plan'],
      amt: '19.2m OFC equity',
      struct: '50% equity, 50% debt',
      out: ['Debt financing commitment', 'Fishing licence transfer'],
      fid: '2026-10-14',
      fidOrig: '2026-09-15'
    }
  };
  /* Pipeline movement (last 60 days) */
  const MOVES = [['2026-09-15', 'D06', 'Screening', 'EC', 'CEO approved the PIN'], ['2026-09-08', 'D08', 'PIN', 'CEO', 'PIN submitted to the CEO'], ['2026-09-01', 'D01', 'Board', 'FID', 'FID paper submitted; financing still open'], ['2026-08-20', 'D09', 'PIN', 'PIN', 'CEO asked for more information'], ['2026-09-16', 'D02', 'EC', 'Board', 'Price paper to the Divestment Committee'], ['2026-09-28', 'D04', 'EC', 'EC', 'EC paper due; meeting on 7 Oct'], ['2026-08-25', 'D10', '—', 'Screening', 'New opportunity'], ['2026-09-02', 'D11', '—', 'Screening', 'New opportunity'], ['2026-09-10', 'D12', '—', 'Screening', 'New opportunity'], ['2026-09-14', 'D13', '—', 'Screening', 'New opportunity']];
  const MEET = [['2026-09-29', 'CEO', 'PIN decision: Project Bahr', 'D08'], ['2026-09-30', 'Divestment Committee', 'Consideration price: AAAID stake', 'D02'], ['2026-10-07', 'Executive Committee', 'Project Marai: assessment and DD request', 'D04'], ['2026-10-14', 'Board Executive Committee', 'Al Jazir FID and financing', 'D01'], ['2026-10-22', 'Board of Directors', 'AAAID divestment approval', 'D02'], ['2026-11-15', 'Due diligence', 'Project Nakhla final DD reports', 'D03']];

  /* ---------------- Trackers A–G (names and fields from the deck) ---------------- */
  const DEAL_N = DEALS_RAW.map(d => d[1]);
  const dealById = id => {
    const d = deals().find(d => d.id === id);
    return d ? [d.id, d.t, d.partner, d.sector, d.type, d.geo, d.source, d.value, d.ofc, d.stage, d.status, d.fit, d.attract, d.prob, d.risk, d.owner, d.scr, d.date, d.prog, d.next, d.rec] : [];
  };
  const idByName = n => deals().find(d => d.t === n)?.id;
  const OWNERS = ['Senior Investment Manager', 'Investment Manager 1', 'Investment Manager 2', 'Investment Analyst', 'CIO'];
  const DONE = new Set(['Additional information required', 'Approved', 'Approved to proceed', 'Approved subject to conditions', 'Proceed toward Board / next stage', 'Conduct further assessment / due diligence', 'Appoint external consultant for independent vetting', 'Completed', 'Signed', 'Cleared', 'Ready', 'Declined', 'Deferred', 'Reject', 'Agreed', 'Closed']);
  const TRK = {
    pipe: {
      n: 'Investment Pipeline Tracker',
      d: 'A. The master tracker for every opportunity · values in OMR m',
      fields: [{
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
        o: STEPS
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
        o: OWNERS
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
      cols: [['id', 'Ref.'], ['t', 'Opportunity'], ['sector', 'Sector'], ['type', 'Type'], ['value', 'Value', 'm'], ['ofc', 'OFC', 'm'], ['stage', 'Stage', 'stage'], ['fit', 'Fit'], ['prob', 'Prob.', 'pct'], ['owner', 'Owner'], ['status', 'Status', 'status'], ['prog', 'Progress', 'prog'], ['date', 'Target', 'date']],
      noOverdue: 1,
      rows: DEALS_RAW.map(d => ({
        id: d[0],
        t: d[1],
        partner: d[2],
        sector: d[3],
        type: d[4],
        geo: d[5],
        source: d[6],
        value: d[7],
        ofc: d[8],
        stage: d[9],
        status: d[10],
        fit: d[11],
        attract: d[12],
        prob: d[13],
        risk: d[14],
        owner: d[15],
        scr: d[16],
        date: d[17],
        prog: d[18],
        next: d[19],
        rec: d[20]
      }))
    },
    gate: {
      n: 'Stage-Gate & Approval Tracker',
      d: 'B. Movement through Screening → PIN → CEO → EC → DD → Board → FID → Closing → Handover',
      fields: [{
        k: 't',
        l: 'Opportunity',
        type: 'select',
        o: DEAL_N,
        req: 1,
        full: 1
      }, {
        k: 'step',
        l: 'Stage',
        type: 'select',
        o: STEPS
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
      cols: [['t', 'Opportunity'], ['step', 'Stage', 'stage'], ['subm', 'Submitted', 'date'], ['date', 'Decision date', 'date'], ['status', 'Decision', 'status'], ['cond', 'Conditions'], ['pend', 'Pending requirements']],
      rows: [['Al Jazir', 'FID', '2026-09-01', '2026-09-15', 'Pending', '', 'Financing commitment letters · rescheduled to the BEC on 14 Oct'], ['AAAID stake divestment (ABMC/ANPC)', 'Board', '2026-09-16', '2026-09-30', 'Pending', '', 'Divestment Committee decision on the consideration price'], ['Project Bahr', 'CEO', '2026-09-08', '2026-09-29', 'Pending', '', ''], ['Project Marai', 'EC', '2026-09-28', '2026-10-07', 'Pending', '', ''], ['Project Raha', 'CEO', '2026-09-01', '2026-09-15', 'Approved to proceed', 'Partner to provide business plan within 60 days', ''], ['Project Mawj', 'CEO', '2026-08-06', '2026-08-20', 'Additional information required', '', 'Tuna supply agreements and partner financials'], ['Al Jazir', 'Board', '2026-07-06', '2026-07-20', 'Approved subject to conditions', 'Financing committed; fishing licence transferred; mangrove buffer', ''], ['Project Sunbul', 'CEO', '2026-06-24', '2026-07-08', 'Approved to proceed', '', ''], ['Project Qamh', 'EC', '2026-06-16', '2026-06-30', 'Deferred', '', 'Revisit after the 2027 budget'], ['Project Nakhla', 'EC', '2026-06-01', '2026-06-15', 'Approved to proceed', 'DD budget of OMR 230k', ''], ['Subsidiary B capacity expansion', 'CEO', '2026-05-20', '2026-06-02', 'Approved to proceed', '', ''], ['Project Marai', 'CEO', '2026-04-20', '2026-05-03', 'Approved to proceed', '', ''], ['Project Rimal', 'CEO', '2026-04-01', '2026-04-14', 'Declined', '', 'Unproven technology'], ['AAAID stake divestment (ABMC/ANPC)', 'EC', '2026-02-26', '2026-03-12', 'Approved to proceed', 'Pre-emption rights to be waived', ''], ['Project Nakhla', 'CEO', '2026-02-20', '2026-03-05', 'Approved to proceed', '', ''], ['Al Jazir', 'EC', '2025-09-04', '2025-09-18', 'Approved to proceed', 'Independent feasibility vetting', ''], ['Al Jazir', 'CEO', '2025-04-28', '2025-05-12', 'Approved to proceed', '', '']].map(r => ({
        t: r[0],
        step: r[1],
        subm: r[2],
        date: r[3],
        status: r[4],
        cond: r[5],
        pend: r[6]
      }))
    },
    dd: {
      n: 'Due Diligence / Vetting Tracker',
      d: 'C. Internal and external assessment workstreams · budgets in OMR k',
      fields: [{
        k: 't',
        l: 'Workstream',
        type: 'select',
        o: ['Commercial DD', 'Financial DD', 'Technical DD', 'Legal DD', 'Market DD', 'Tax DD', 'ESG DD', 'Valuation', 'Financial model review', 'Independent feasibility-study vetting', 'Partner DD'],
        req: 1
      }, {
        k: 'deal',
        l: 'Opportunity',
        type: 'select',
        o: DEAL_N
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
      cols: [['t', 'Workstream'], ['deal', 'Opportunity'], ['cons', 'Consultant'], ['budget', 'Budget', 'k'], ['date', 'Due', 'date'], ['prog', 'Progress', 'prog'], ['status', 'Status', 'status'], ['flags', 'Red flags', 'flag']],
      rows: [['Commercial DD', 'Project Nakhla', 'Consultant A', 'Market, customers and export contracts', 45, '2026-07-12', '2026-10-15', 70, 'In progress', 'Export demand concentrated in two GCC buyers', '', 'Customer interviews: 3 of 8 done'], ['Financial DD', 'Project Nakhla', 'Consultant B', 'Quality of earnings, working capital, net debt', 60, '2026-07-12', '2026-10-30', 60, 'In progress', 'EBITDA normalisation of 0.4m', 'Working capital 1.1m above its normal level at the locked-box date', 'Management response pending'], ['Legal DD', 'Project Nakhla', 'Law firm C', 'Title, licences, litigation, contracts', 35, '2026-07-15', '2026-10-31', 50, 'In progress', 'Two land plots held under usufruct', '', 'Licence renewal schedule'], ['Technical DD', 'Project Nakhla', 'Consultant D', 'Plant condition and capex needs', 30, '2026-07-12', '2026-09-15', 100, 'Completed', 'Cold store needs a 0.8m upgrade', '', ''], ['ESG DD', 'Project Nakhla', 'Consultant E', 'Environment, social and food safety', 20, '2026-08-01', '2026-10-20', 40, 'In progress', 'Wastewater permit expires March 2027', '', 'Site visit report'], ['Tax DD', 'Project Nakhla', 'Consultant B', 'Tax exposures', 15, '2026-10-01', '2026-11-10', 0, 'Not started', '', '', 'Engagement letter to sign'], ['Valuation', 'Project Nakhla', 'Consultant B', 'Independent valuation', 25, '2026-10-15', '2026-11-15', 0, 'Not started', '', '', ''], ['Financial model review', 'Project Nakhla', 'Investment team', 'Model integrity and assumptions', 0, '2026-09-01', '2026-10-31', 30, 'In progress', '', '', ''], ['Independent feasibility-study vetting', 'Al Jazir', 'Consultant D', 'Review of the partner\'s feasibility study', 55, '2025-10-05', '2026-01-31', 100, 'Completed', 'Feasibility confirmed; capex contingency raised to 10%', '', ''], ['Legal DD', 'Al Jazir', 'Law firm C', 'Licences, land, corporate structure', 40, '2025-11-01', '2026-02-28', 100, 'Completed', 'Fishing licence must transfer to the project company', '', ''], ['ESG DD', 'Al Jazir', 'Consultant E', 'Coastal and marine impact', 25, '2025-11-15', '2026-03-15', 100, 'Completed', 'Mangrove buffer zone required', '', '']].map(r => ({
        t: r[0],
        deal: r[1],
        cons: r[2],
        scope: r[3],
        budget: r[4],
        start: r[5],
        date: r[6],
        prog: r[7],
        status: r[8],
        find: r[9],
        flags: r[10],
        out: r[11]
      }))
    },
    kyc: {
      n: 'Partner / KYC Tracker',
      d: 'D. KYC, ownership, credentials, standing, compliance and red flags',
      fields: [{
        k: 't',
        l: 'Partner',
        req: 1,
        full: 1
      }, {
        k: 'deal',
        l: 'Opportunity',
        type: 'select',
        o: DEAL_N
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
      cols: [['t', 'Partner'], ['deal', 'Opportunity'], ['ubo', 'Ownership / UBO'], ['fin', 'Financial standing'], ['comp', 'Compliance'], ['docs', 'Documents'], ['status', 'Status', 'status'], ['flags', 'Red flags', 'flag']],
      noOverdue: 1,
      rows: [['Partner A (regional aquaculture operator)', 'Al Jazir', 'Two family shareholders', 'Strong', 'Clear', 'Complete', 'Cleared', ''], ['ABMC / ANPC', 'AAAID stake divestment (ABMC/ANPC)', 'Listed and government-related', 'Strong', 'Clear', 'Complete', 'Cleared', ''], ['Partner B (date processor and exporter)', 'Project Nakhla', 'Founder 70%, fund 30%', 'Adequate', 'Clear', 'Complete', 'Cleared', ''], ['Partner C (dairy operator)', 'Project Marai', 'Private group, UBO disclosed', 'Strong', 'Clear', 'Complete', 'Cleared', ''], ['Partner D (feed producer)', 'Project Sunbul', 'Disclosed', 'Adequate', 'Screening in progress', '2 of 5 received', 'Pending', ''], ['Partner E (logistics group)', 'Project Raha', 'Disclosed', 'Not yet assessed', 'Clear', '2025 audited accounts outstanding', 'Information Required', ''], ['Partner F (shrimp farming specialist)', 'Project Bahr', 'Disclosed', 'Adequate', 'Screening in progress', '3 of 5 received', 'Pending', ''], ['Partner G (international tuna processor)', 'Project Mawj', 'Listed parent', 'Adequate', 'Litigation with a regional regulator', 'Complete', 'Concern', 'Parent company in an unresolved regulatory dispute'], ['Partner H (poultry group)', 'Project Sanam', '30% held by an undisclosed holding company', 'Not yet assessed', 'Pending', '1 of 5 received', 'Concern', 'Ultimate owner of a 30% holding not disclosed'], ['Partner S (aquaculture technology)', 'Project Rimal', 'Disclosed', 'Weak', 'Clear', 'Complete', 'Reject', 'Insufficient financial standing']].map(r => ({
        t: r[0],
        deal: r[1],
        ubo: r[2],
        fin: r[3],
        comp: r[4],
        docs: r[5],
        status: r[6],
        flags: r[7]
      }))
    },
    tasks: {
      n: 'Investment Tasks Tracker',
      d: 'E. Working items, actions and interventions across the pipeline',
      fields: [{
        k: 'cat',
        l: 'Related to',
        type: 'select',
        o: ['Shareholder', 'Board / EC', 'Executives', 'Transaction / investors', 'Legal', 'Procurement', 'IT / VDR', 'Admin / HR', 'Consultants / engagements', 'Others']
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
        o: ['—', ...DEAL_N]
      }, {
        k: 'owner',
        l: 'Owner',
        type: 'select',
        o: OWNERS
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
      cols: [['t', 'Action / task'], ['deal', 'Opportunity'], ['cat', 'Related to'], ['owner', 'Owner'], ['date', 'Due', 'date'], ['prio', 'Priority', 'prio'], ['attn', 'Attention'], ['status', 'Status', 'status']],
      rows: [['Transaction / investors', 'Action', 'Secure financing commitment letters for the Al Jazir FID', 'Al Jazir', 'Senior Investment Manager', '2026-09-15', 'Critical', 'CFO', 'In progress', 'Lenders\' credit approval', 'Chase the lenders\' credit committees'], ['Executives', 'Task', 'Answer the CEO\'s information request on Project Mawj', 'Project Mawj', 'Senior Investment Manager', '2026-09-20', 'Medium', '—', 'In progress', 'Partner data', ''], ['Consultants / engagements', 'Task', 'Sign the tax DD engagement letter', 'Project Nakhla', 'Investment Manager 2', '2026-09-24', 'Medium', '—', 'In progress', '', ''], ['Board / EC', 'Task', 'Divestment Committee paper on the AAAID consideration price', 'AAAID stake divestment (ABMC/ANPC)', 'Investment Manager 1', '2026-09-27', 'High', 'CIO', 'In progress', 'Valuation update', 'CIO review on 26 Sep'], ['Board / EC', 'Task', 'EC paper for Project Marai', 'Project Marai', 'Senior Investment Manager', '2026-09-30', 'High', 'CIO', 'In progress', '', ''], ['Transaction / investors', 'Task', 'Obtain UBO documents from the Project Sanam partner', 'Project Sanam', 'Investment Manager 2', '2026-09-30', 'Medium', '—', 'In progress', '', ''], ['Transaction / investors', 'Intervention', 'Resolve the working capital red flag with Nakhla management', 'Project Nakhla', 'Investment Manager 2', '2026-10-05', 'High', 'CIO', 'Not started', 'Financial DD draft', ''], ['Executives', 'Action', 'Brief the CFO on 2027 investment funding needs', '—', 'CIO', '2026-10-05', 'Medium', 'CFO', 'Not started', 'Strategy funding plan', ''], ['Transaction / investors', 'Task', 'Site visit for Project Laban', 'Project Laban', 'Investment Manager 1', '2026-10-08', 'Low', '—', 'Not started', '', ''], ['Shareholder', 'Task', 'Q3 pipeline update for the shareholder report', '—', 'Investment Analyst', '2026-10-10', 'Medium', '—', 'Not started', '', ''], ['Transaction / investors', 'Task', 'Complete the Project Sunbul in-house model', 'Project Sunbul', 'Investment Manager 1', '2026-10-20', 'Medium', '—', 'In progress', '', ''], ['Consultants / engagements', 'Task', 'Procure DD consultants for Project Marai if the EC approves', 'Project Marai', 'Senior Investment Manager', '2026-10-21', 'Medium', '—', 'Not started', 'EC decision on 7 Oct', ''], ['Transaction / investors', 'Action', 'Fishing licence transfer with the Ministry', 'Al Jazir', 'Senior Investment Manager', '2026-10-31', 'High', 'CEO', 'In progress', 'Ministry approval', ''], ['Legal', 'Task', 'Prepare JV heads of terms for Project Marai', 'Project Marai', 'Investment Manager 1', '2026-10-12', 'Medium', '—', 'Not started', '', ''], ['IT / VDR', 'Task', 'Set up AGORA data room access for Project Nakhla bidders', 'Project Nakhla', 'Investment Analyst', '2026-10-01', 'Low', '—', 'In progress', '', ''], ['Admin / HR', 'Task', 'Book flights and site-visit logistics for the Project Laban visit', 'Project Laban', 'Investment Manager 1', '2026-10-06', 'Low', '—', 'In progress', '', ''], ['Others', 'Task', 'Close out the development role on Subsidiary D', '—', 'Investment Manager 2', '2026-08-31', 'Low', '—', 'Completed', '', '']].map(r => ({
        cat: r[0],
        kind: r[1],
        t: r[2],
        deal: r[3],
        owner: r[4],
        date: r[5],
        prio: r[6],
        attn: r[7],
        status: r[8],
        dep: r[9],
        next: r[10]
      }))
    },
    close: {
      n: 'Legal Closing & CP Tracker',
      d: 'F. Transaction documents and conditions precedent after FID',
      fields: [{
        k: 't',
        l: 'Document / condition precedent',
        req: 1,
        full: 1
      }, {
        k: 'deal',
        l: 'Opportunity',
        type: 'select',
        o: DEAL_N
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
      cols: [['t', 'Document / CP'], ['deal', 'Opportunity'], ['kind', 'Type'], ['owner', 'Owner'], ['legal', 'Legal status'], ['cps', 'Counterparty'], ['neg', 'Negotiation'], ['date', 'Target', 'date'], ['status', 'Final status', 'status']],
      rows: [['Shareholders\' agreement (SHA)', 'Al Jazir', 'Document', 'Legal Counsel', 'Final draft', 'Comments received', '2 open points', '2026-10-20', 'In negotiation'], ['Financing agreement', 'Al Jazir', 'Document', 'Senior Investment Manager', 'Term sheet', 'Credit approval pending', 'Pricing agreed', '2026-11-15', 'In negotiation'], ['Offtake agreement', 'Al Jazir', 'Document', 'Investment Manager 1', 'First draft', 'Not yet shared', '—', '2026-11-30', 'Not started'], ['Technical service agreement', 'Al Jazir', 'Document', 'Legal Counsel', 'Draft', 'Under review', '1 open point', '2026-11-10', 'In negotiation'], ['Land lease agreement', 'Al Jazir', 'Document', 'Legal Counsel', 'Executed', 'Executed', 'Closed', '2026-08-30', 'Signed'], ['Incorporation of the project company', 'Al Jazir', 'Condition precedent', 'Legal Counsel', 'Registered', '—', '—', '2026-08-01', 'Completed'], ['Environmental permit', 'Al Jazir', 'Condition precedent', 'Partner A', 'Received', '—', '—', '2026-08-12', 'Completed'], ['Financing commitment letters', 'Al Jazir', 'Condition precedent', 'Senior Investment Manager', '—', 'Lenders\' credit committees', '—', '2026-10-10', 'Pending'], ['Fishing licence transfer', 'Al Jazir', 'Condition precedent', 'Partner A', 'Application filed', 'Ministry review', '—', '2026-10-31', 'Pending'], ['Share purchase agreement (SPA)', 'AAAID stake divestment (ABMC/ANPC)', 'Document', 'Legal Counsel', 'Draft', 'Awaiting price agreement', 'Price open', '2026-11-30', 'In negotiation'], ['Waiver of pre-emption rights', 'AAAID stake divestment (ABMC/ANPC)', 'Condition precedent', 'Legal Counsel', 'Requested', '2 of 3 shareholders', '—', '2026-10-31', 'Pending']].map(r => ({
        t: r[0],
        deal: r[1],
        kind: r[2],
        owner: r[3],
        legal: r[4],
        cps: r[5],
        neg: r[6],
        date: r[7],
        status: r[8]
      }))
    },
    hand: {
      n: 'PMO Handover Tracker',
      d: 'G. Readiness to move into Stage Gate 4',
      fields: [{
        k: 't',
        l: 'Handover item',
        type: 'select',
        o: ['FID package', 'Approved scope', 'Approved CAPEX', 'Approved schedule', 'Financial model', 'Feasibility study', 'DD reports', 'Risk register', 'Legal agreements', 'Key commitments', 'Board conditions', 'Handover meeting', 'PMO acceptance'],
        req: 1
      }, {
        k: 'deal',
        l: 'Opportunity',
        type: 'select',
        o: DEAL_N
      }, {
        k: 'owner',
        l: 'Owner',
        type: 'select',
        o: [...OWNERS, 'PMO']
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
      }],
      cols: [['t', 'Handover item'], ['deal', 'Opportunity'], ['owner', 'Owner'], ['date', 'Target', 'date'], ['status', 'Status', 'status']],
      rows: [['Feasibility study', 'Ready', '2026-01-31'], ['DD reports', 'Ready', '2026-03-15'], ['Financial model', 'Ready', '2026-07-06'], ['Approved scope', 'Ready', '2026-07-20'], ['Approved CAPEX', 'Ready', '2026-07-20'], ['Approved schedule', 'In progress', '2026-10-31'], ['Risk register', 'In progress', '2026-10-31'], ['Legal agreements', 'In progress', '2026-11-15'], ['Key commitments', 'In progress', '2026-11-15'], ['Board conditions', 'In progress', '2026-10-31'], ['FID package', 'Not started', '2026-10-14'], ['Handover meeting', 'Not started', '2026-11-30'], ['PMO acceptance', 'Not started', '2026-12-15']].map(r => ({
        t: r[0],
        deal: 'Al Jazir',
        owner: r[0] === 'PMO acceptance' ? 'PMO' : 'Senior Investment Manager',
        status: r[1],
        date: r[2]
      }))
    },
    meet: {
      n: 'Weekly Meeting Tracker',
      d: 'H. Investment Department weekly meeting management · agenda, MoM, action items and follow-up',
      fields: [{
        k: 't',
        l: 'Meeting / agenda item',
        req: 1,
        full: 1
      }, {
        k: 'mdate',
        l: 'Meeting date',
        type: 'date'
      }, {
        k: 'attendees',
        l: 'Attendees'
      }, {
        k: 'deal',
        l: 'Related opportunity',
        type: 'select',
        o: ['—', ...DEAL_N]
      }, {
        k: 'mom',
        l: 'Minutes of meeting (MoM)',
        type: 'textarea',
        full: 1
      }, {
        k: 'action',
        l: 'Action item',
        full: 1
      }, {
        k: 'owner',
        l: 'Responsible person',
        type: 'select',
        o: OWNERS
      }, {
        k: 'date',
        l: 'Due date',
        type: 'date'
      }, {
        k: 'status',
        l: 'Status',
        type: 'select',
        o: ['Open', 'Closed', 'Follow-up required']
      }, {
        k: 'follow',
        l: 'Follow-up notes',
        type: 'textarea',
        full: 1
      }],
      cols: [['t', 'Meeting / item'], ['mdate', 'Meeting date', 'date'], ['deal', 'Opportunity'], ['action', 'Action item'], ['owner', 'Responsible'], ['date', 'Due', 'date'], ['status', 'Status', 'status']],
      rows: [['Weekly pipeline review', '2026-09-22', 'Investment team', 'Al Jazir', 'Financing commitment letters still with lenders\' credit committees; escalate to the BEC on 14 Oct if unresolved', 'Escalate financing status to the BEC', 'Senior Investment Manager', '2026-09-29', 'Open', 'Raised with the CFO ahead of the BEC'], ['Weekly pipeline review', '2026-09-22', 'Investment team', 'Project Marai', 'EC paper on track for the 7 Oct meeting', 'Finalise EC paper for Project Marai', 'Senior Investment Manager', '2026-10-01', 'Open', ''], ['Weekly pipeline review', '2026-09-15', 'Investment team', 'Project Nakhla', 'Working capital red flag discussed; management response awaited', 'Chase Nakhla management for the working capital response', 'Investment Manager 2', '2026-09-24', 'Closed', 'Response received 22 Sep, incorporated into financial DD'], ['Weekly pipeline review', '2026-09-15', 'Investment team, Legal', 'AAAID stake divestment (ABMC/ANPC)', 'Pre-emption waiver from 2 of 3 shareholders still outstanding', 'Follow up with the remaining shareholder on the pre-emption waiver', 'Investment Manager 1', '2026-09-30', 'Follow-up required', 'Legal to send a reminder letter'], ['Weekly pipeline review', '2026-09-08', 'Investment team', 'Project Sanam', 'Undisclosed 30% ownership flagged by KYC; screening paused', 'Request UBO disclosure before resuming screening', 'Investment Manager 2', '2026-09-30', 'Open', ''], ['Weekly pipeline review', '2026-09-08', 'Investment team, IT', '—', 'AGORA data room access needed for the Nakhla process', 'Set up AGORA access for Nakhla bidders', 'Investment Analyst', '2026-10-01', 'Open', '']].map(r => ({
        t: r[0],
        mdate: r[1],
        attendees: r[2],
        deal: r[3],
        mom: r[4],
        action: r[5],
        owner: r[6],
        date: r[7],
        status: r[8],
        follow: r[9]
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
      ...(key === 'pipe' ? {
        id: r.id
      } : {})
    }));
    return [...local, ...T.rows.map((r, i) => ({
      ...r,
      _id: key + ':' + i
    }))].map(r => {
      const id = r._local || r._id;
      const o = {
        ...r,
        ...recordPatch('ofc-investment-edits', id),
        ...(key === 'pipe' ? recordPatch('ofc-deal-state', r.id) : {})
      };
      ['value', 'ofc', 'prob', 'prog', 'budget'].forEach(k => {
        if (o[k] !== undefined && o[k] !== '') o[k] = +o[k];
      });
      o.overdue = !!(!T.noOverdue && o.date && !DONE.has(o.status) && daysLate(o.date) > 0);
      return o;
    });
  }
  const openCount = key => trkRows(key).filter(r => !DONE.has(r.status)).length;
  const deals = () => trkRows('pipe');
  const live = () => deals().filter(d => ['Active', 'Approved for next stage'].includes(d.status));
  const GATE_ACTIONS = {
    Screening: [['Approve to PIN', 'PIN'], ['Decline at screening', 'Screening', 'Declined']],
    PIN: [['CEO approves', 'EC'], ['CEO requests more information', 'PIN'], ['CEO declines', 'PIN', 'Declined']],
    CEO: [['CEO approves', 'EC'], ['CEO requests more information', 'PIN'], ['CEO declines', 'CEO', 'Declined']],
    EC: [['EC: recommend proceeding', 'DD'], ['EC: request further due diligence', 'DD']],
    DD: [['Complete DD and submit for FID', 'FID']],
    Board: [['Board: approve FID', 'Closing'], ['Board: approve with conditions', 'Closing'], ['Board: decline', 'Board', 'Declined']],
    FID: [['Board: approve FID', 'Closing'], ['Board: approve with conditions', 'Closing'], ['Board: decline', 'FID', 'Declined']]
  };
  function investmentStatus(r, v, key = view.slice(4)) {
    const f = TRK[key]?.fields.find(f => f.k === 'status');
    if (['pipe', 'gate'].includes(key) || !f?.o) return pill(v);
    return `<select data-invest-status="${escH(r._local || r._id)}" aria-label="Status for ${escH(r.t)}">${f.o.map(x => `<option${x === v ? ' selected' : ''}>${escH(x)}</option>`).join('')}</select>`;
  }
  function investmentBlockers(d,action) {
    return gateActionBlockers(investmentReadiness(d,d.stage==='EC'?2:3),d.stage,action);
  }
  function investmentDecisionButton(d,a,i) {
    const blockers=investmentBlockers(d,a[0]);
    return `<div class="gate-decision-action"><button class="btn ghost sm" data-gate-deal="${escH(d.id)}" data-gate-index="${i}" ${blockers.length?'disabled':''}>${escH(a[0])}</button>${renderGateBlockers(blockers,escH)}</div>`;
  }
  function investmentActions() {
    const stages = {
      scr: ['Screening'],
      pin: ['PIN', 'CEO'],
      ec: ['EC'],
      assess: ['EC'],
      ddd: ['DD'],
      fid: ['FID', 'Board'],
      closed: ['Closing', 'Handover']
    }[view];
    if (!stages && view !== 'tx') return '';
    return `<section class="wp"><h2>Gate decisions and handover</h2>${deals().filter(d => (view === 'tx' ? d.id === (param || 'D01') : stages.includes(d.stage)) && !['Declined', 'Inactive', 'Deferred', 'Closed'].includes(d.status)).map(d => {
      const sent = liveRegister('ofc-live-projects').some(p => p.dealId === d.id),
        h = trkRows('hand').filter(r => r.deal === d.t),
        blockers = investmentBlockers(d,'handover'),
        ready = !blockers.length;
      return `<div style="padding:12px"><b>${escH(d.t)}</b> · ${escH(d.stage)} · ${escH(d.status)}<p>${escH(d.next)}</p>${sent ? '<a class="btn" href="/pmo#delivery">Handed over · Open PMO</a>' : (GATE_ACTIONS[d.stage] || []).map((a, i) => investmentDecisionButton(d,a,i)).join(' ')}${!sent && ['Closing', 'Handover'].includes(d.stage) ? `<button class="btn" data-invest-handover="${escH(d.id)}" ${ready ? '' : 'disabled'}>Confirm handover to PMO</button>${renderGateBlockers(blockers,escH)}<p>${h.length ? 'Mark every handover item Ready.' : 'Add handover evidence for this opportunity.'} <button class="see" data-go="trk-hand">Handover tracker</button></p>` : ''}</div>`;
    }).join('')}</section>`;
  }
  function investmentDecision(id, index) {
    const d = deals().find(d => d.id === id),
      a = GATE_ACTIONS[d?.stage]?.[index];
    if (!a || ['Declined', 'Inactive', 'Deferred', 'Closed', 'Handed over to PMO'].includes(d.status)) return;
    const date = new Date().toISOString().slice(0, 10),
      entry = {
        id: 'GATE-' + crypto.randomUUID(),
        at: Date.now(),
        app: APP_ID,
        trk: TRK.gate.n,
        t: d.t,
        d: {
          t: d.t,
          dealId: id,
          step: d.stage,
          fromStage: d.stage,
          toStage: a[1],
          status: a[2] || (a[0].includes('more information') ? 'Additional information required' : a[0].includes('conditions') ? 'Approved subject to conditions' : a[0].includes('further due diligence') ? 'Additional information required' : 'Approved to proceed'),
          owner: d.owner,
          date,
          pend: a[0],
          next: a[0],
          decision: a[0]
        }
      };
    const current = liveRegister('ofc-tracker-entries');
    if (!handoverWrite({
      'ofc-tracker-entries': [entry, ...current],
      'ofc-deal-state': {
        ...recordOverlay('ofc-deal-state'),
        [id]: {
          ...recordPatch('ofc-deal-state', id),
          stage: a[1],
          status: a[2] || 'Active',
          prog: Math.max(d.prog || 0, {
            PIN: 20,
            EC: 35,
            DD: 55,
            FID: 80,
            Closing: 90
          }[a[1]] || 0),
          next: a[0],
          at: Date.now()
        }
      }
    })) return;
    TLOCAL = [entry, ...current];
    render();
    toast(a[0]);
  }
  function investmentHandover(id) {
    const d = deals().find(d => d.id === id),
      rows = trkRows('hand').filter(r => r.deal === d?.t);
    if (!d || !['Closing', 'Handover'].includes(d.stage) || !['Active', 'Approved for next stage'].includes(d.status) || !rows.length || !rows.every(r => r.status === 'Ready') || liveRegister('ofc-live-projects').some(p => p.dealId === id)) return;
    const blockers=investmentBlockers(d,'handover');
    if(blockers.length){toast('Complete before handover: '+blockers.map(c=>c.label).join('; '));render();return;}
    const at = Date.now(),
      project = {
        t: d.t,
        phase: 'Mobilisation',
        budget: +d.value || 0,
        spent: 0,
        forecast: +d.value || 0,
        plan: 0,
        prog: 0,
        baseline: d.date || '',
        date: d.date || '',
        status: 'On track',
        owner: d.owner,
        next: 'Complete commissioning and operations handover evidence.',
        source: 'investment',
        dealId: id,
        projectId: 'INV-' + id,
        sourceDocuments: liveRegister('ofc-investment-uploads').filter(doc => doc.dealId === id),
        investmentDocuments: liveRegister('ofc-investment-documents').filter(doc => doc.dealId === id),
        investmentDocumentEvents: liveRegister('ofc-investment-document-events').filter(event => event.dealId === id),
        investmentHandover: handoverSnapshot(d, ['tasks', 'close', 'hand', 'gate', 'dd'].flatMap(key => trkRows(key).filter(r => r.dealId === id).map(r => ({ ...r, key }))), at),
        at
      };
    const current = liveRegister('ofc-tracker-entries'),
      audit = {
        id: 'GATE-' + crypto.randomUUID(),
        at,
        app: APP_ID,
        trk: TRK.gate.n,
        t: d.t,
        d: {
          t: d.t,
          dealId: id,
          step: 'Handover',
          fromStage: d.stage,
          toStage: 'Handover',
          status: 'Approved',
          owner: d.owner,
          date: new Date().toISOString().slice(0, 10),
          pend: 'Handed over to PMO'
        }
      };
    if (!handoverWrite({
      'ofc-live-projects': [...liveRegister('ofc-live-projects'), project],
      'ofc-deal-state': {
        ...recordOverlay('ofc-deal-state'),
        [id]: {
          ...recordPatch('ofc-deal-state', id),
          stage: 'Handover',
          status: 'Handed over to PMO',
          prog: 100,
          next: 'PMO owns SG4 execution',
          at
        }
      },
      'ofc-tracker-entries': [audit, ...current]
    })) return;
    TLOCAL = [audit, ...current];
    render();
    toast('Project received by PMO.');
  }
  scope.listen(document, 'click', e => {
    const b = e.target.closest('[data-gate-deal],[data-invest-handover]');
    if (!b || !role.apps.includes(APP_ID)) return;
    if (b.dataset.gateDeal) investmentDecision(b.dataset.gateDeal, +b.dataset.gateIndex);else investmentHandover(b.dataset.investHandover);
  });
  scope.listen(document, 'change', e => {
    if (e.target.dataset.investStatus && role.apps.includes(APP_ID)) {
      investmentUpdateStatus(e.target.dataset.investStatus, e.target.value);
    }
  });
  scope.listen(window, 'storage', e => {
    if (e.key?.startsWith('ofc-') && !sheetOpen && !['/investment/entry','/investment/documents/edit','/investment/gate-one'].includes(location.pathname) && !$('#investmentUploadForm [name=files]')?.files.length) {
      TLOCAL = liveRegister('ofc-tracker-entries');
      render();
    }
  });

  /* ---------------- Charts ---------------- */
  function ring(p) {
    const r = 15.915,
      c = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="4.5"/><circle cx="21" cy="21" r="${r}" fill="none" stroke="#A1C364" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${p} ${100 - p}"/>`;
    return `<div class="ring"><svg viewBox="0 0 42 42">${c}</svg><div class="c"><div><b class="num">${Math.round(p)}%</b><span>complete</span></div></div></div>`;
  }

  /* ---------------- Status helpers ---------------- */
  const OKS = new Set(['Active', 'Approved for next stage', 'Approved to proceed', 'Approved subject to conditions', 'Approved', 'Cleared', 'Completed', 'Signed', 'Ready', 'Pursue', 'Proceed to EC', 'Proceed toward Board / next stage', 'On track', 'Agreed']);
  const BAD = new Set(['Declined', 'Reject', 'Concern', 'Delayed', 'Critical', 'Open Issue']);
  const NEU = new Set(['Not started', 'Inactive', 'Draft']);
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
    pipe: 'Pipeline Overview',
    tx: 'Transaction Overview',
    scr: 'Opportunity Screening & Origination',
    kycd: 'Partner / KYC & Background Check',
    pin: 'PIN / Origination Approval',
    assess: 'In-House Assessment / Pre-Feasibility',
    ec: 'Executive Committee Review',
    ddd: 'Due Diligence / Independent Vetting',
    fid: 'Final Evaluation & FID',
    closed: 'Post-FID Legal Closing & PMO Handover',
    'rep-weekly': 'Weekly Investment Pipeline Report',
    'rep-monthly': 'Monthly Investment Portfolio / Pipeline Report',
    'rep-move': 'Pipeline Movement Report',
    'rep-overdue': 'Overdue Actions & Decisions Report',
    'rep-risk': 'Investment Risk / Red-Flag Report',
    'rep-cal': 'Upcoming Approval / Decision Calendar',
    'rep-summary': 'Investment Summary',
    'rep-paper': 'Draft PIN / EC / Board paper'
  };
  TRK_KEYS.forEach(k => VIEWS['trk-' + k] = TRK[k].n);
  const DASHES = ['pipe', 'tx', 'scr', 'kycd', 'pin', 'assess', 'ec', 'ddd', 'fid', 'closed'];
  const REPS = ['rep-weekly', 'rep-monthly', 'rep-move', 'rep-overdue', 'rep-risk', 'rep-cal', 'rep-summary', 'rep-paper'];
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
    if (push && (location.pathname !== '/investment' || location.search || decodeURIComponent(location.hash.slice(1)) !== h)) history.pushState(null, '', '/investment#' + h);
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
  const m1 = v => (+v).toFixed(1);
  const hbar = (l, v, max, fill, val) => `<div class="hb"><span>${l}</span><span class="tr"><span class="fl" style="width:${Math.max(0, v / max * 100)}%;${fill ? `background:${fill}` : ''}"></span></span><span class="v">${val ?? m1(v)}</span></div>`;
  const progBar = p => `<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;height:8px;border-radius:4px;background:var(--line-2);overflow:hidden;min-width:60px"><span style="display:block;height:100%;width:${Math.min(100, +p || 0)}%;background:#A1C364"></span></span><span class="num" style="font-size:12px;width:34px;text-align:right">${(+p || 0).toFixed(0)}%</span></div>`;
  const dealLink = (name, id) => id ? `<button class="see" style="font-weight:500;color:var(--ink);text-align:left" data-go="tx|${id}">${escH(name)}</button>` : escH(name);
  const sgTag = s => `<span class="sg sg${GATE_OF[s] || 0}">SG${GATE_OF[s] || '–'}</span>`;
  const stageCell = s => `<span class="nw">${sgTag(s)} ${escH(STEP_LBL[s] || s)}</span>`;
  const scoreDots = v => `<span class="dots">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</span>`;
  const ragPill = s => {
    const c = {
      'Cleared': 'ok',
      'Cleared with Conditions': 'pend',
      'Open Issue': 'esc',
      'Critical': 'esc'
    }[s] || 'neu';
    return `<span class="pill ${c}">${escH(s)}</span>`;
  };
  const mapLocal = d => d;
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
      pipe: vPipe,
      tx: vTx,
      scr: vScr,
      kycd: vKyc,
      pin: vPin,
      assess: vAssess,
      ec: vEC,
      ddd: vDD,
      fid: vFID,
      closed: vClose
    };
    if (V[view]) el.innerHTML = (view === 'tx' ? '' : investmentActions()) + V[view]();else if (view.startsWith('trk-')) {
      el.innerHTML = vTrk(view.slice(4));
      fillTrk();
    } else el.innerHTML = vRep(view);
  }

  /* ---------------- The gate journey ---------------- */
  function gateJourney() {
    const L = live();
    const col = g => {
      if (g.n <= 3) {
        const D = L.filter(d => GATE_OF[d.stage] === g.n),
          v = D.reduce((a, d) => a + (+d.value || 0), 0);
        const steps = g.steps.map(s => {
          const n = D.filter(d => d.stage === s).length;
          return `<button class="gstep${n ? '' : ' empty'}" data-go="${{
            Screening: 'scr',
            PIN: 'pin',
            CEO: 'pin',
            EC: 'assess',
            DD: 'ddd',
            Board: 'fid',
            FID: 'fid',
            Closing: 'closed',
            Handover: 'closed'
          }[s]}"><span>${STEP_LBL[s]}</span><b>${n}</b></button>`;
        }).join('');
        const chips = D.sort((a, b) => STEPS.indexOf(b.stage) - STEPS.indexOf(a.stage)).slice(0, 4).map(d => `<button class="gchip" data-go="tx|${d.id}" title="${escH(d.t)} · ${STEP_LBL[d.stage]}">${escH(d.t.replace('Project ', '').replace(' stake divestment (ABMC/ANPC)', ' divestment').replace(' capacity expansion', ' expansion'))}</button>`).join('') + (D.length > 4 ? `<span class="gmore">+${D.length - 4} more</span>` : '');
        return `<div class="gcol"><div class="ghead"><span class="gnum">SG${g.n}</span><div><b>${g.t}</b><small>${g.own}</small></div></div><div class="gbig"><b class="num">${D.length}</b><span>${D.length === 1 ? 'opportunity' : 'opportunities'} · ${m1(v)}m</span></div><div class="gsteps">${steps}</div><div class="gchips">${chips || '<span class="gmore">None at this gate</span>'}</div><div class="gexit"><span>Value assurance</span><i style="font-style:normal;display:block;color:var(--ink-2);margin-bottom:6px">&ldquo;${g.q}&rdquo;</i><span>Gate decision</span>${g.exit}</div></div>`;
      }
      if (g.n === 4) {
        const c = SG4.reduce((a, p) => a + p.capex, 0);
        return `<div class="gcol other"><div class="ghead"><span class="gnum">SG4</span><div><b>${g.t}</b><small>${g.own}</small></div></div><div class="gbig"><b class="num">${SG4.length}</b><span>projects · ${m1(c)}m approved capex</span></div><ul class="glist">${SG4.map(p => `<li><span>${p.t}<small>${p.d}</small></span>${pill(p.st)}</li>`).join('')}</ul><button class="see" data-app="pmo">Open PMO ↗</button><div class="gexit"><span>Gate decision</span>${g.exit}</div></div>`;
      }
      return `<div class="gcol other"><div class="ghead"><span class="gnum">SG5</span><div><b>${g.t}</b><small>${g.own}</small></div></div><div class="gbig"><b class="num">${SG5.n}</b><span>operating companies</span></div><ul class="glist"><li><span>YTD revenue ${m1(SG5.rev)}m<small>From Finance &amp; Accounts</small></span></li><li><span>AAAID stake<small>Exit handled by Investment (SG3)</small></span><span class="pill pend">Divesting</span></li><li><span>ONLDC<small>Real financials on file in Asset Management</small></span><span class="pill ok">Operating</span></li></ul><button class="see" data-app="am">Open Asset Management ↗</button><div class="gexit"><span>Gate decision</span>${g.exit}</div></div>`;
    };
    return `<div class="gates">${GATES.map((g, i) => col(g) + (i < 4 ? `<div class="garrow${i === 2 ? ' hand' : ''}">${i === 2 ? '<span>Handover</span>' : ''}<svg viewBox="0 0 12 24"><path d="M2 2l8 10-8 10" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>` : '')).join('')}</div>
  <div class="gband"><span style="flex:3">Investment &amp; Deal Sourcing · Stage Gates 1–3</span><span style="flex:1">PMO · SG4</span><span style="flex:1">Asset Management · SG5</span></div>`;
  }
  function stepper(stage, status) {
    const idx = STEPS.indexOf(stage),
      dead = status === 'Declined' || status === 'Deferred';
    return `<div class="stepper">${[1, 2, 3].map(g => `<div class="sgrp"><div class="sglbl">SG${g} · ${GATES[g - 1].t}</div><div class="srow">${GATES[g - 1].steps.map(s => {
      const i = STEPS.indexOf(s);
      const c = i < idx ? 'done' : i === idx ? dead ? 'dead' : 'cur' : '';
      return `<span class="st ${c}">${i < idx ? '✓ ' : ''}${STEP_LBL[s]}</span>`;
    }).join('')}</div></div>`).join('')}<div class="sgrp later"><div class="sglbl">SG4–SG5</div><div class="srow"><span class="st">Execution</span><span class="st">Operation</span></div></div></div>`;
  }

  /* ---------------- Home ---------------- */
  function attention() {
    const it = [];
    trkRows('gate').filter(r => r.overdue).forEach(r => it.push({
      s: 3,
      t: `${r.t}: ${STEP_LBL[r.step]} decision is ${daysLate(r.date)} days late`,
      m: r.pend || 'Awaiting decision',
      v: `tx|${idByName(r.t)}`
    }));
    trkRows('tasks').filter(r => r.overdue).forEach(r => it.push({
      s: r.prio === 'Critical' ? 3 : 2,
      t: r.t,
      m: `${r.deal !== '—' ? r.deal + ' · ' : ''}${r.owner} · ${daysLate(r.date)} days overdue`,
      v: 'trk-tasks'
    }));
    trkRows('dd').filter(r => r.flags && !DONE.has(r.status)).forEach(r => it.push({
      s: 2,
      t: `Red flag in ${r.t}: ${r.deal}`,
      m: r.flags,
      v: 'ddd'
    }));
    trkRows('kyc').filter(r => r.status === 'Concern').forEach(r => it.push({
      s: 2,
      t: `KYC concern: ${r.t}`,
      m: r.flags || r.comp,
      v: 'kycd'
    }));
    trkRows('meet').filter(r => r.overdue).forEach(r => it.push({
      s: r.status === 'Follow-up required' ? 2 : 1,
      t: `Meeting action overdue: ${r.action}`,
      m: `${r.owner} · ${daysLate(r.date)} days overdue`,
      v: 'trk-meet'
    }));
    return it.sort((a, b) => b.s - a.s);
  }
  function vHome() {
    const L = live(),
      v = L.reduce((a, d) => a + (+d.value || 0), 0),
      ofc = L.reduce((a, d) => a + (+d.ofc || 0), 0),
      w = L.reduce((a, d) => a + (+d.ofc || 0) * (+d.prob || 0) / 100, 0);
    const cal = investmentCalendar().filter(m => -daysLate(m[0]) >= 0 && -daysLate(m[0]) <= 30),
      att = attention();
    const scr = deals().filter(d => d.scr >= '2026').length;
    return `<div class="stack">${vh('Overview', 'Every opportunity across the five stage gates · Investment Division owns SG1–SG3')}
  <div class="kpi5">
    <button class="kc" data-go="pipe"><span class="lbl">Live opportunities</span><span class="val num">${L.length}</span><span class="ctx">${scr} screened in 2026 · ${deals().filter(d => d.status === 'Declined').length} declined</span><span class="go">Pipeline Overview ↗</span></button>
    <button class="kc" data-go="pipe"><span class="lbl">Pipeline value</span><span class="val num">${m1(v)}<small>m</small></span><span class="ctx">Live deals, incl. the 14.0m AAAID divestment</span><span class="go">Pipeline Overview ↗</span></button>
    <button class="kc" data-go="pipe"><span class="lbl">Expected OFC commitment</span><span class="val num">${m1(w)}<small>m</small></span><span class="ctx">Probability-weighted · ${m1(ofc)}m unweighted</span><span class="go">Pipeline Overview ↗</span></button>
    <button class="kc mint" data-go="rep-cal"><span class="lbl">Decisions in 30 days</span><span class="val num">${cal.length}</span><span class="ctx">Next: ${cal[0] ? cal[0][1] + ', ' + fmtDate(cal[0][0]) : 'none'}</span><span class="go">Decision calendar ↗</span></button>
    <button class="kc peach" data-go="rep-overdue"><span class="lbl">Overdue</span><span class="val num">${trkRows('gate').filter(r => r.overdue).length + trkRows('tasks').filter(r => r.overdue).length}</span><span class="ctx">Gate decisions and tasks past due</span><span class="go">Overdue report ↗</span></button>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>The five stage gates</h2><p>Where every opportunity and asset sits today · select a step or deal to open it</p></div><button class="see" data-go="trk-gate">Stage-Gate Tracker ↗</button></div>${gateJourney()}</section>
  <div class="grid2">
    <section class="wp"><div class="wp-h"><div><h2>Needs attention</h2><p>Late decisions, overdue tasks, red flags and KYC concerns</p></div><button class="see" data-go="rep-risk">Red-flag report ↗</button></div>
      <ul class="att">${att.slice(0, 6).map(a => `<li><button data-go="${a.v}"><span class="ic">${ico.warn}</span><span><div class="t">${escH(a.t)}</div><div class="m">${escH(a.m)}</div></span><span></span>${chev}</button></li>`).join('')}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Decision calendar</h2><p>Next 30 days</p></div><button class="see" data-go="rep-cal">Full calendar ↗</button></div>
      <ul class="mini-list">${cal.map(m => `<li><span>${escH(m[2])}<small>${escH(m[1])}</small></span><button class="chip-s" style="height:24px" data-go="tx|${m[3]}">${fmtDate(m[0])}</button></li>`).join('')}</ul></section>
  </div></div>`;
  }

  /* ---------------- Pipeline Overview ---------------- */
  function vPipe() {
    const A = deals(),
      L = live(),
      v = L.reduce((a, d) => a + d.value, 0),
      w = L.reduce((a, d) => a + d.ofc * d.prob / 100, 0);
    const cnt = (arr, k) => {
      const o = {};
      arr.forEach(d => o[d[k]] = (o[d[k]] || 0) + 1);
      return o;
    };
    const val = (arr, k) => {
      const o = {};
      arr.forEach(d => o[d[k]] = (o[d[k]] || 0) + d.value);
      return o;
    };
    const bySec = Object.entries(val(L, 'sector')).sort((a, b) => b[1] - a[1]),
      byType = cnt(A, 'type'),
      bySt = cnt(A, 'status');
    const G = trkRows('gate').filter(r => r.date >= '2026');
    const appr = G.filter(r => /Approved/.test(r.status)).length,
      dec = G.filter(r => r.status === 'Declined').length + A.filter(d => d.status === 'Declined' && d.stage === 'Screening').length;
    const stepN = STEPS.map(s => L.filter(d => d.stage === s).length),
      stepV = STEPS.map(s => L.filter(d => d.stage === s).reduce((a, d) => a + d.value, 0));
    const stCol = {
      'Active': '#A1C364',
      'Approved for next stage': '#344B37',
      'Inactive': '#D8DFCA',
      'Deferred': '#F3BD7A',
      'Declined': '#E9A27A'
    };
    return `<div class="stack">${vh('Pipeline Overview', 'All opportunities in the Investment Pipeline Tracker · OMR m', exportBtn + printBtn)}
  <div class="kpi5">
    <div class="kc"><span class="lbl">Total opportunities</span><span class="val num">${A.length}</span><span class="ctx">${L.length} live · ${A.length - L.length} closed or paused</span></div>
    <div class="kc"><span class="lbl">Total potential value</span><span class="val num">${m1(v)}<small>m</small></span><span class="ctx">Live opportunities</span></div>
    <div class="kc"><span class="lbl">Expected capital commitment</span><span class="val num">${m1(w)}<small>m</small></span><span class="ctx">OFC share, probability-weighted</span></div>
    <div class="kc"><span class="lbl">Approved at a gate in 2026</span><span class="val num">${appr}</span><span class="ctx">Gate decisions to proceed</span></div>
    <div class="kc"><span class="lbl">Declined in 2026</span><span class="val num">${dec}</span><span class="ctx">At screening or a gate</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Opportunities by stage gate position</h2><p>Live opportunities · count and total value</p></div><button class="see" data-go="trk-gate">Stage-Gate Tracker ↗</button></div>
    <div class="stagebar">${STEPS.map((s, i) => `<button class="sb g${GATE_OF[s]}" data-go="${{
      Screening: 'scr',
      PIN: 'pin',
      CEO: 'pin',
      EC: 'assess',
      DD: 'ddd',
      Board: 'fid',
      FID: 'fid',
      Closing: 'closed',
      Handover: 'closed'
    }[s]}"><span class="sbg">SG${GATE_OF[s]}</span><b class="num">${stepN[i]}</b><span>${STEP_LBL[s]}</span><small>${stepV[i] ? m1(stepV[i]) + 'm' : '—'}</small></button>`).join('')}</div></section>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>By sector</h2><p>Live value, OMR m</p></div></div>${bySec.map(([k, x]) => hbar(k, x, bySec[0][1])).join('')}</section>
    <div class="stack">
      <section class="wp"><div class="wp-h"><div><h2>By type</h2><p>All opportunities</p></div></div>${stackBar([['Capital project (greenfield)', byType.Greenfield || 0, '#344B37'], ['M&amp;A (brownfield)', byType.Brownfield || 0, '#A1C364'], ['Divestment', byType.Divestment || 0, '#F3BD7A']], A.length, 1)}</section>
      <section class="wp"><div class="wp-h"><div><h2>By status</h2><p>All opportunities</p></div></div>${stackBar(Object.entries(bySt).map(([k, x]) => [k, x, stCol[k] || '#ccc']), A.length, 1)}</section>
    </div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Investment Pipeline Tracker</h2><p>Select an opportunity to open its transaction view</p></div><button class="see" data-go="trk-pipe">Open tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th>Sector</th><th>Type</th><th class="r">Value</th><th class="r">OFC</th><th>Stage</th><th>Fit</th><th class="r">Prob.</th><th>Status</th><th>Next step</th></tr></thead><tbody>${A.map(d => `<tr><td>${dealLink(d.t, d.id)}</td><td class="nw">${escH(d.sector)}</td><td class="nw">${d.type}</td><td class="r num">${m1(d.value)}</td><td class="r num">${d.ofc ? m1(d.ofc) : '—'}</td><td>${stageCell(d.stage)}</td><td>${escH(d.fit)}</td><td class="r num">${d.prob}%</td><td class="nw">${pill(d.status)}</td><td style="color:var(--ink-2);min-width:200px">${escH(d.next)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function stackBar(parts, total, count) {
    return `<div class="meter2" style="height:14px;border-radius:4px">${parts.filter(p => p[1]).map(p => `<span title="${p[0]}: ${p[1]}" style="width:${p[1] / total * 100}%;background:${p[2]};border-right:2px solid #fff"></span>`).join('')}</div><div class="legend-s" style="margin:8px 0 0">${parts.filter(p => p[1]).map(p => `<span><i style="background:${p[2]}"></i>${p[0]} · ${count ? p[1] : m1(p[1])}</span>`).join('')}</div>`;
  }

  /* ---------------- Transaction Overview (deal room) ---------------- */
  function vTx() {
    const L = deals();
    const id = param || 'D01',
      d = deals().find(x => x.id === id) || L[0];
    if (!d) return '';
    const F = FIN[d.id] || {},
      S = SCORES[d.id] || [],
      K = trkRows('kyc').find(k => k.deal === d.t),
      G = trkRows('gate').filter(r => r.t === d.t).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.at || 0) - (b.at || 0));
    const T = trkRows('tasks').filter(r => r.deal === d.t && !DONE.has(r.status)),
      DD = trkRows('dd').filter(r => r.deal === d.t),
      C = trkRows('close').filter(r => r.deal === d.t),
      H = trkRows('hand').filter(r => r.deal === d.t);
    const sel = `<select id="dealSel" class="noprint" aria-label="Select transaction" style="height:34px;border:1px solid var(--line);border-radius:6px;background:var(--callout);padding:0 10px;font:inherit;font-size:13px;max-width:280px">${L.map(x => `<option value="${x.id}"${x.id === d.id ? ' selected' : ''}>${escH(x.t)}</option>`).join('')}</select>`;
    const appr = ['CEO', 'EC', 'Board', 'FID'].map(s => {
      const r = G.filter(g => g.step === s).pop();
      return `<li><span>${s === 'CEO' ? 'CEO (PIN)' : s === 'Board' ? 'Board' : s === 'FID' ? 'FID' : 'Executive Committee'}<small>${r ? `${r.subm ? 'Submitted ' + fmtDate(r.subm) + ' · ' : ''}${r.status === 'Pending' ? 'decision due ' + fmtDate(r.date) : 'decided ' + fmtDate(r.date)}${r.cond ? ' · ' + escH(r.cond) : ''}` : 'Not yet reached'}</small></span>${r ? pill(r.status) + (r.overdue ? `<span class="od">${daysLate(r.date)}d late</span>` : '') : '<span class="pill neu">—</span>'}</li>`;
    }).join('');
    const kv = (l, v) => `<div class="kv"><span>${l}</span><b class="num">${v}</b></div>`;
    let fin = '';
    if (d.type === 'Divestment' && F.proceeds) fin = kv('Status', pill(d.status)) + kv('Expected proceeds', m1(F.proceeds) + 'm') + kv('Progress', d.prog + '%') + kv('Responsible manager', escH(d.owner)) + kv('Price range', F.range + 'm') + kv('Carrying value', m1(F.book) + 'm') + kv('Gain on disposal', m1(F.gain) + 'm') + kv('IRR over holding period', F.irr + '%') + kv('Exit route', escH(F.exit));else if (F.eq !== undefined) fin = kv('Investment value', m1(d.value) + 'm') + kv('Equity requirement', m1(F.eq) + 'm') + kv('Debt requirement', m1(F.debt) + 'm') + kv('OFC shareholding', F.share + '%') + kv('OFC requirement', m1(d.ofc) + 'm') + kv('Equity IRR', F.irr ? `<span class="${F.irr >= HURDLE ? 'pos' : 'neg'}">${F.irr}%</span>` : '—') + kv('NPV', F.npv !== undefined ? m1(F.npv) + 'm' : '—') + kv('Payback', F.pb ? F.pb + ' years' : '—') + kv('Downside IRR', F.down ? `<span class="${F.down >= HURDLE ? 'pos' : 'neg'}">${F.down}%</span>` : '—');else fin = kv('Investment value', m1(d.value) + 'm') + kv('OFC requirement', m1(d.ofc) + 'm') + `<p class="src">Financials are built during the in-house assessment (SG2).</p>`;
    return `<div class="stack">${vh(escH(d.t), `${escH(d.type === 'Greenfield' ? 'Capital project (greenfield)' : d.type === 'Brownfield' ? 'M&A (brownfield)' : 'Divestment')} · ${escH(d.sector)} · ${escH(d.partner)}`, sel + `<button class="btn sm" data-go="rep-paper|${d.id}">${ico.spark}Generate investment documents</button>` + printBtn)}
  <section class="wp">${stepper(d.stage, d.status)}
    <div class="txbar"><span>${pill(d.status)}</span><span>Owner <b>${escH(d.owner)}</b></span><span>Target <b>${fmtDate(d.date)}</b></span><span>Probability <b>${d.prob}%</b></span><span style="flex:1;min-width:220px">Next step <b>${escH(d.next)}</b></span></div>${progBar(d.prog)}${['Declined', 'Deferred'].includes(d.status) ? `<p class="flag" style="margin-top:10px">${escH(d.reason || d.next || 'Decision recorded.')} · Attach the approved closure report as supporting evidence.</p>` : ''}</section>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Screening and assessment</h2><p>Scores out of 5</p></div><button class="see" data-go="scr">Screening ↗</button></div>
      <ul class="mini-list"><li><span>Strategic fit</span><b>${escH(d.fit)}</b></li>${S.length ? [['Market attractiveness', S[0]], ['Commercial attractiveness', S[1]], ['Financial attractiveness', S[2]], ['Partner attractiveness', S[3]]].map(([l, v]) => `<li><span>${l}</span>${scoreDots(v)}</li>`).join('') : ''}<li><span>Initial risk rating</span><b>${escH(d.risk)}</b></li><li><span>Probability</span><b>${d.prob}%</b></li><li><span>Recommendation</span><b>${escH(ASSESS[d.id]?.rec || d.rec)}</b></li></ul>
      <h3 class="h3s">Partner KYC</h3>${K ? `<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px"><span>${escH(K.t)}<small style="display:block;color:var(--ink-2)">${escH(K.ubo)} · ${escH(K.docs)}</small></span>${pill(K.status)}</div>` : '<p class="src">No KYC record yet.</p>'}</section>
    <section class="wp"><div class="wp-h"><div><h2>Financial snapshot</h2><p>${F.stage ? F.stage + ' figures' : 'Indicative'} · hurdle ${HURDLE}% equity IRR</p></div></div>${fin}
      ${F.sens ? `<h3 class="h3s">Sensitivities (equity IRR)</h3>${F.sens.map(s => `<div class="kv"><span>${s[0]}</span><b class="num ${s[1] >= HURDLE ? 'pos' : 'neg'}">${(+s[1]).toFixed(1)}%</b></div>`).join('')}` : ''}</section>
  </div>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Approvals</h2><p>From the Stage-Gate &amp; Approval Tracker</p></div><button class="see" data-go="trk-gate">Tracker ↗</button></div><ul class="mini-list">${appr}</ul></section>
    <section class="wp"><div class="wp-h"><div><h2>Open tasks</h2><p>From the Investment Tasks Tracker</p></div><button class="btn ghost sm noprint" data-invest-add="tasks" data-invest-deal="${escH(d.id)}">${ico.plus}Add</button></div>
      ${T.length ? `<ul class="mini-list">${T.map(r => `<li><span>${escH(r.t)}<small>${escH(r.owner)} · ${r.overdue ? `<span class="neg">${daysLate(r.date)} days overdue</span>` : 'due ' + fmtDate(r.date)}${r.attn && r.attn !== '—' ? ` · needs ${r.attn}` : ''}</small></span>${prioPill(r.prio)}</li>`).join('')}</ul>` : '<p class="src">No open tasks.</p>'}</section>
  </div>
  ${DD.length ? `<section class="wp"><div class="wp-h"><div><h2>Due diligence / independent vetting</h2><p>Budget OMR ${DD.reduce((a, r) => a + (+r.budget || 0), 0)}k · ${DD.filter(r => r.status === 'Completed').length} of ${DD.length} workstreams complete</p></div><button class="see" data-go="ddd">DD dashboard ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Workstream</th><th>Consultant</th><th>Due</th><th>Progress</th><th>Status</th><th>Key findings / red flags</th></tr></thead><tbody>${DD.map(r => `<tr><td class="nw">${escH(r.t)}</td><td class="nw">${escH(r.cons)}</td><td class="nw">${fmtDate(r.date)}</td><td style="min-width:120px">${progBar(r.prog)}</td><td class="nw">${pill(r.status)}</td><td>${escH(r.find || '—')}${r.flags ? `<div class="flag">⚑ ${escH(r.flags)}</div>` : ''}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
  ${C.length ? `<section class="wp"><div class="wp-h"><div><h2>Legal closing and conditions precedent</h2><p>${C.filter(r => DONE.has(r.status)).length} of ${C.length} complete</p></div><button class="see" data-go="closed">Closing dashboard ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Document / CP</th><th>Owner</th><th>Legal</th><th>Counterparty</th><th>Target</th><th>Status</th></tr></thead><tbody>${C.map(r => `<tr><td>${escH(r.t)}<small style="display:block;color:var(--ink-3)">${r.kind}</small></td><td class="nw">${escH(r.owner)}</td><td class="nw">${escH(r.legal)}</td><td class="nw">${escH(r.cps)}</td><td class="nw">${fmtDate(r.date)}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
  ${H.length ? `<section class="wp"><div class="wp-h"><div><h2>PMO handover readiness</h2><p>${H.filter(r => r.status === 'Ready').length} of ${H.length} items ready for SG4</p></div><button class="see" data-go="trk-hand">Handover Tracker ↗</button></div>${progBar(H.filter(r => r.status === 'Ready').length / H.length * 100)}
    <div class="hgrid">${H.map(r => `<span class="hitem ${r.status === 'Ready' ? 'ok' : r.status === 'In progress' ? 'wip' : ''}">${r.status === 'Ready' ? '✓' : r.status === 'In progress' ? '◐' : '○'} ${escH(r.t)}</span>`).join('')}</div></section>` : ''}
  </div>`;
  }
  const prioPill = p => `<span class="pill ${p === 'Critical' ? 'esc' : p === 'High' ? 'hi' : p === 'Medium' ? 'md' : 'lo'}">${escH(p)}</span>`;

  /* ---------------- Stage dashboards ---------------- */
  const inStage = (...s) => deals().filter(d => s.includes(d.stage));
  function vScr() {
    const D = inStage('Screening').filter(d => d.scr >= '2026' || d.status === 'Active'),
      rec = {};
    D.forEach(d => rec[d.rec] = (rec[d.rec] || 0) + 1);
    return `<div class="stack">${vh('Opportunity Screening & Origination', 'SG1 · is this opportunity worth pursuing and does it fit our investment strategy?', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Screened in 2026</span><span class="val num">${deals().filter(d => d.scr >= '2026').length}</span><span class="ctx">Corporate KPI target 12</span></div>
    <div class="kc"><span class="lbl">In screening now</span><span class="val num">${D.filter(d => d.status === 'Active').length}</span><span class="ctx">${D.filter(d => d.status === 'Inactive').length} on hold</span></div>
    <div class="kc"><span class="lbl">Recommended to pursue</span><span class="val num">${rec.Pursue || 0}</span><span class="ctx">${rec['Need more information'] || 0} need more information</span></div>
    <div class="kc"><span class="lbl">Rejected at screening</span><span class="val num">${rec.Reject || 0}</span><span class="ctx">Mainly outside the food mandate</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Screening scorecard</h2><p>Opportunities at the screening step · scores out of 5</p></div><button class="see" data-go="trk-pipe">Pipeline Tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th>Source</th><th>Sector</th><th>Geography</th><th class="r">Value</th><th class="r">OFC</th><th>Fit</th><th>Market</th><th>Commercial</th><th>Financial</th><th>Partner</th><th>Risk</th><th class="r">Prob.</th><th>Screened</th><th>Owner</th><th>Recommendation</th></tr></thead><tbody>${D.map(d => {
      const s = SCORES[d.id] || [0, 0, 0, 0];
      return `<tr><td>${dealLink(d.t, d.id)}</td><td class="nw">${escH(d.source || '—')}</td><td class="nw">${escH(d.sector)}</td><td class="nw">${escH(d.geo || '—')}</td><td class="r num">${m1(d.value)}</td><td class="r num">${m1(d.ofc)}</td><td>${escH(d.fit)}</td>${s.map(v => `<td>${scoreDots(v)}</td>`).join('')}<td>${escH(d.risk)}</td><td class="r num">${d.prob}%</td><td class="nw">${fmtDate(d.scr)}</td><td class="nw">${escH(d.owner)}</td><td class="nw">${pill(d.rec)}</td></tr>`;
    }).join('')}</tbody></table></div></section></div>`;
  }
  function vKyc() {
    const K = trkRows('kyc'),
      by = {};
    K.forEach(r => by[r.status] = (by[r.status] || 0) + 1);
    return `<div class="stack">${vh('Partner / KYC & Background Check', 'Runs in parallel with screening · Cleared | Pending | Information Required | Concern | Reject', exportBtn + printBtn)}
  <div class="kpi5">${['Cleared', 'Pending', 'Information Required', 'Concern', 'Reject'].map(s => `<div class="kc ${s === 'Concern' || s === 'Reject' ? 'peach' : ''}"><span class="lbl">${s}</span><span class="val num">${by[s] || 0}</span></div>`).join('')}</div>
  <section class="wp"><div class="wp-h"><div><h2>Partners</h2><p>From the Partner / KYC Tracker</p></div><button class="see" data-go="trk-kyc">Tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Partner</th><th>Opportunity</th><th>Ownership / UBO</th><th>Financial standing</th><th>Compliance / sanctions</th><th>Documents</th><th>Red flags</th><th>Status</th></tr></thead><tbody>${K.map(r => `<tr><td>${escH(r.t)}</td><td>${dealLink(r.deal, idByName(r.deal))}</td><td>${escH(r.ubo)}</td><td class="nw">${escH(r.fin)}</td><td>${escH(r.comp)}</td><td class="nw">${escH(r.docs)}</td><td>${r.flags ? `<span class="flag">⚑ ${escH(r.flags)}</span>` : '—'}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function vPin() {
    const D = inStage('PIN', 'CEO').filter(d => d.status !== 'Declined'),
      G = trkRows('gate').filter(r => r.step === 'CEO');
    return `<div class="stack">${vh('PIN / Origination Approval', 'Project Identification Note (PIN) · value assurance SG-1: &ldquo;Do we understand the Investment and what value it will add to the Entity?&rdquo;', printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">PINs in preparation or review</span><span class="val num">${D.length}</span></div>
    <div class="kc mint"><span class="lbl">Awaiting CEO decision</span><span class="val num">${G.filter(r => r.status === 'Pending').length}</span><span class="ctx">Current pending CEO approvals</span></div>
    <div class="kc"><span class="lbl">Approved by the CEO in 2026</span><span class="val num">${G.filter(r => r.date >= '2026' && /Approved/.test(r.status)).length}</span></div>
    <div class="kc"><span class="lbl">Declined or returned</span><span class="val num">${G.filter(r => r.date >= '2026' && /(Declined|Additional)/.test(r.status)).length}</span></div>
  </div>
  <div class="grid-eq">${D.map(d => {
      const F = FIN[d.id] || {},
        g = G.filter(r => r.t === d.t).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.at || 0) - (a.at || 0))[0];
      return `<section class="wp"><div class="wp-h"><div><h2>${dealLink(d.t, d.id)}</h2><p>${escH(d.sector)} · ${escH(d.partner)}</p></div>${g ? pill(g.status) : '<span class="pill neu">In preparation</span>'}</div>
    <div class="kv"><span>Indicative investment</span><b class="num">${m1(d.value)}m</b></div><div class="kv"><span>OFC requirement</span><b class="num">${m1(d.ofc)}m</b></div><div class="kv"><span>Preliminary equity IRR</span><b class="num">${F.irr ? F.irr + '%' : '—'}</b></div>
    <div class="kv"><span>PIN submitted</span><b>${g ? fmtDate(g.subm) : '—'}</b></div><div class="kv"><span>CEO review</span><b>${g ? g.status === 'Pending' ? 'Due ' + fmtDate(g.date) : fmtDate(g.date) : '—'}</b></div>
    <p class="src">${escH(g?.pend || d.next)}</p></section>`;
    }).join('')}</div>
  <section class="wp"><div class="wp-h"><div><h2>CEO decisions</h2><p>Approved to proceed · Additional information required · Deferred · Declined</p></div></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th>Submitted</th><th>Decision date</th><th>Decision</th><th>Notes</th></tr></thead><tbody>${G.map(r => `<tr><td>${dealLink(r.t, idByName(r.t))}</td><td class="nw">${fmtDate(r.subm)}</td><td class="nw">${fmtDate(r.date)}</td><td class="nw">${pill(r.status)}</td><td style="color:var(--ink-2)">${escH(r.cond || r.pend || '')}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function vAssess() {
    const ids = Object.keys(ASSESS);
    return `<div class="stack">${vh('In-House Assessment / Pre-Feasibility', 'SG2 · the Pre-Feasibility Report and in-house assessment carried out after CEO approval of the PIN', printBtn)}
  <section class="wp"><div class="wp-h"><div><h2>Information and data status</h2><p>✓ received · ◐ partial · ○ missing</p></div></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th>${INFO_ITEMS.map(i => `<th style="white-space:normal;min-width:80px">${i}</th>`).join('')}<th class="r">Complete</th></tr></thead><tbody>${ids.map(id => {
      const d = deals().find(x => x.id === id),
        a = ASSESS[id],
        p = a.info.reduce((s, v) => s + v, 0) / a.info.length * 100;
      return `<tr><td>${dealLink(d.t, id)}</td>${a.info.map(v => `<td class="infoc ${v === 1 ? 'ok' : v ? 'wip' : 'no'}">${v === 1 ? '✓' : v ? '◐' : '○'}</td>`).join('')}<td class="r num">${Math.round(p)}%</td></tr>`;
    }).join('')}</tbody></table></div></section>
  <div class="grid-eq">${ids.map(id => {
      const d = deals().find(x => x.id === id),
        a = ASSESS[id],
        F = FIN[id] || {};
      return `<section class="wp"><div class="wp-h"><div><h2>${dealLink(d.t, id)}</h2><p>${escH(d.sector)} · ${m1(d.value)}m</p></div>${pill(a.rec)}</div>
    ${Object.entries(a.sc).map(([k, v]) => `<div class="kv"><span>${k}</span>${scoreDots(v)}</div>`).join('')}
    <div class="kv"><span>Equity IRR / NPV / payback</span><b class="num">${F.irr ? `<span class="${F.irr >= HURDLE ? 'pos' : 'neg'}">${F.irr}%</span>` : '—'} · ${F.npv !== undefined ? m1(F.npv) + 'm' : '—'} · ${F.pb ? F.pb + ' yrs' : '—'}</b></div>
    <div class="kv"><span>Downside IRR</span><b class="num">${F.down ? `<span class="${F.down >= HURDLE ? 'pos' : 'neg'}">${F.down}%</span>` : '—'}</b></div>
    <p class="src"><b>Main risks:</b> ${escH(a.risks)}<br><b>Main gaps:</b> ${escH(a.gaps)}</p></section>`;
    }).join('')}</div></div>`;
  }
  function vEC() {
    const ids = Object.keys(EC);
    return `<div class="stack">${vh('Executive Committee Review', 'SG2 gate · value assurance: &ldquo;Have we selected a development option that fits the objective?&rdquo; · EC either recommends proceeding or requires additional due diligence', printBtn)}
  <div class="kpi4">
    <div class="kc mint"><span class="lbl">Next EC</span><span class="val num" style="font-size:24px">${fmtDate(EC.D04.date)}</span><span class="ctx">Project Marai</span></div>
    <div class="kc"><span class="lbl">EC decisions in 2026</span><span class="val num">${ids.filter(i => EC[i].date >= '2026' && EC[i].st === 'Held').length}</span></div>
    <div class="kc"><span class="lbl">Sent to external vetting</span><span class="val num">${ids.filter(i => /consultant/.test(EC[i].dec)).length}</span><span class="ctx">Project Nakhla</span></div>
    <div class="kc"><span class="lbl">Deferred</span><span class="val num">${ids.filter(i => EC[i].dec === 'Defer').length}</span><span class="ctx">Project Qamh</span></div>
  </div>
  ${ids.sort((a, b) => EC[b].date.localeCompare(EC[a].date)).map(id => {
      const d = deals().find(x => x.id === id),
        e = EC[id];
      return `<section class="wp"><div class="wp-h"><div><h2>${dealLink(d.t, id)}</h2><p>EC ${e.st === 'Scheduled' ? 'meeting on' : 'held'} ${fmtDate(e.date)} · ${escH(d.sector)} · ${m1(d.value)}m</p></div>${e.dec === 'Pending' ? '<span class="pill pend">Scheduled</span>' : pill(e.dec)}</div>
    <div class="grid-eq"><div><div class="kv"><span>Investment Team findings</span><b style="font-weight:400;text-align:right">${escH(e.find)}</b></div><div class="kv"><span>Recommendation</span><b style="text-align:right">${escH(e.rec)}</b></div><div class="kv"><span>EC questions</span><b style="font-weight:400;text-align:right">${e.qs.map(escH).join('<br>')}</b></div><div class="kv"><span>Management responses</span><b style="font-weight:400;text-align:right">${escH(e.resp)}</b></div></div>
    <div>${e.fa ? `<h3 class="h3s" style="margin-top:0">If further assessment is required</h3><div class="kv"><span>Scope of work</span><b style="font-weight:400;text-align:right">${escH(e.fa.scope)}</b></div><div class="kv"><span>Consultant</span><b>${escH(e.fa.cons)}</b></div><div class="kv"><span>Proposed budget</span><b class="num">OMR ${e.fa.budget}k</b></div><div class="kv"><span>Finance budget approval</span><b>${escH(e.fa.fin)}</b></div><div class="kv"><span>Procurement / appointment</span><b>${escH(e.fa.proc)} · ${escH(e.fa.appt)}</b></div><div class="kv"><span>Expected completion</span><b>${fmtDate(e.fa.done)}</b></div>` : '<p class="src">EC outcomes: Option 1 — recommend proceeding to Board; Option 2 — additional due diligence required (external consultants, subject to Finance budget approval and procurement).</p>'}</div></div></section>`;
    }).join('')}</div>`;
  }
  function vDD() {
    const R = trkRows('dd'),
      act = R.filter(r => !DONE.has(r.status)),
      bud = R.filter(r => r.deal === 'Project Nakhla').reduce((a, r) => a + (+r.budget || 0), 0);
    const Q = [['Questions raised', 64], ['Investor responses', 41], ['Data requests received', 27, 38], ['Management meetings', 5], ['Outstanding matters', 9], ['Findings closed', 12], ['Findings unresolved', 4]];
    return `<div class="stack">${vh('Due Diligence / Independent Vetting', 'SG3 · all workstreams requested after EC review', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Workstreams in progress</span><span class="val num">${act.length}</span><span class="ctx">Project Nakhla</span></div>
    <div class="kc"><span class="lbl">Approved DD budget</span><span class="val num">${bud}<small>k</small></span><span class="ctx">Project Nakhla · approved 25 Jun</span></div>
    <div class="kc peach"><span class="lbl">Open red flags</span><span class="val num">${act.filter(r => r.flags).length}</span><span class="ctx">Working capital at the locked-box date</span></div>
    <div class="kc"><span class="lbl">Final DD report</span><span class="val num" style="font-size:24px">15 Nov</span><span class="ctx">Draft due · Project Nakhla</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Workstreams</h2><p>Workstream | Consultant | Scope | Budget | Start | Target | Progress | Findings | Red flags | Status</p></div><button class="see" data-go="trk-dd">Tracker ↗</button></div>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Workstream</th><th>Opportunity</th><th>Consultant</th><th>Scope</th><th class="r">Budget</th><th>Start</th><th>Target</th><th>Progress</th><th>Key findings</th><th>Red flags</th><th>Status</th></tr></thead><tbody>${R.map(r => `<tr><td class="nw">${escH(r.t)}</td><td class="nw">${dealLink(r.deal, idByName(r.deal))}</td><td class="nw">${escH(r.cons)}</td><td>${escH(r.scope)}</td><td class="r num">${r.budget ? r.budget + 'k' : '—'}</td><td class="nw">${fmtDate(r.start)}</td><td class="nw">${fmtDate(r.date)}</td><td style="min-width:110px">${progBar(r.prog)}</td><td>${escH(r.find || '—')}</td><td>${r.flags ? `<span class="flag">⚑ ${escH(r.flags)}</span>` : '—'}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="wp"><div class="wp-h"><div><h2>Project Nakhla · DD process</h2><p>Questions, responses and outstanding matters</p></div></div>
    <div class="kpi4">${Q.map(q => `<div class="kc" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">${q[0]}</span><span class="val num" style="font-size:26px">${q[1]}${q[2] ? `<small>of ${q[2]}</small>` : ''}</span></div>`).join('')}</div></section></div>`;
  }
  function vFID() {
    const d = deals().find(x => x.id === 'D01'),
      F = FIN.D01,
      X = FID_D01,
      B = X.board,
      v = deals().find(x => x.id === 'D02');
    const kv = (l, val) => `<div class="kv"><span>${l}</span><b class="num">${val}</b></div>`;
    return `<div class="stack">${vh('Final Evaluation & FID', 'SG3 · value assurance: &ldquo;Is everything in place to ensure proper execution of the Investment?&rdquo; · the Board may approve, approve with conditions, request more information, or decline', printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">At Board or FID</span><span class="val num">${inStage('Board', 'FID').filter(x => x.status === 'Active').length}</span><span class="ctx">Al Jazir · AAAID divestment</span></div>
    <div class="kc peach"><span class="lbl">Al Jazir FID</span><span class="val num" style="font-size:24px">${fmtDate(B.fid)}</span><span class="ctx">Slipped from ${fmtDate(B.fidOrig)} · financing</span></div>
    <div class="kc"><span class="lbl">Outstanding Board conditions</span><span class="val num">${B.out.length}<small>of ${B.conds.length}</small></span></div>
    <div class="kc"><span class="lbl">New investments at FID in 2026</span><span class="val num">0<small>of 2 target</small></span><span class="ctx">Al Jazir expected in October</span></div>
  </div>
  <div class="grid-eq">
    <section class="wp"><div class="wp-h"><div><h2>Al Jazir · final investment case</h2><p>OMR m</p></div><button class="see" data-go="tx|D01">Transaction ↗</button></div>
      ${kv('Investment amount', m1(d.value))}${kv('Equity requirement', m1(F.eq))}${kv('Debt requirement', m1(F.debt))}${kv('Shareholding', 'OFC ' + F.share + '% · Partner A ' + (100 - F.share) + '%')}${kv('Final CAPEX', m1(d.value))}${kv('Revenue outlook (year 5)', m1(F.rev5))}${kv('EBITDA outlook (year 5)', m1(F.eb5))}${kv('Equity IRR', `<span class="pos">${F.irr}%</span>`)}${kv('NPV', m1(F.npv))}${kv('Payback', F.pb + ' years')}${kv('Downside case IRR', `<span class="neg">${F.down}%</span>`)}${kv('Exit assumptions', escH(F.exit))}</section>
    <div class="stack">
      <section class="wp"><div class="wp-h"><div><h2>Final DD results</h2><p>Cleared | Cleared with Conditions | Open Issue | Critical</p></div></div>${X.dd.map(r => `<div class="kv"><span>${r[0]}</span>${ragPill(r[1])}</div>`).join('')}
        <div class="kv" style="margin-top:6px"><span><b>Final recommendation</b></span><span class="pill pend">${X.rec}</span></div></section>
      <section class="wp"><div class="wp-h"><div><h2>Board / FID</h2></div></div>
        ${kv('Board date', fmtDate(B.date))}${kv('Board paper', B.paper)}${kv('Board decision', B.dec)}${kv('Approved amount', B.amt)}${kv('Approved funding structure', B.struct)}${kv('FID date', fmtDate(B.fid) + ' (target)')}
        <h3 class="h3s">Conditions of approval</h3><ul class="checkl">${B.conds.map(c => `<li><span class="ck ${B.out.some(o => c.startsWith(o.split(' ')[0])) ? 'no' : 'ok'}">${B.out.some(o => c.startsWith(o.split(' ')[0])) ? '!' : '✓'}</span><span>${escH(c)}</span><span></span></li>`).join('')}</ul></section>
    </div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>${escH(v.t)}</h2><p>Divestment at the approval step</p></div><button class="see" data-go="tx|D02">Transaction ↗</button></div>
    <div class="kpi4">${[['Expected proceeds', m1(FIN.D02.proceeds) + 'm'], ['Price range', FIN.D02.range + 'm'], ['Gain on disposal', m1(FIN.D02.gain) + 'm'], ['Decision', 'Divestment Committee, 30 Sep']].map(k => `<div class="kc" style="box-shadow:none;border-color:var(--line-2)"><span class="lbl">${k[0]}</span><span class="val num" style="font-size:22px">${k[1]}</span></div>`).join('')}</div></section></div>`;
  }
  function vClose() {
    const C = trkRows('close'),
      H = trkRows('hand'),
      docs = C.filter(r => r.kind === 'Document'),
      cps = C.filter(r => r.kind !== 'Document');
    const tbl = R => `<div class="tscroll"><table class="ttbl"><thead><tr><th>Item</th><th>Opportunity</th><th>Owner</th><th>Legal status</th><th>Counterparty status</th><th>Negotiation</th><th>Target</th><th>Final status</th></tr></thead><tbody>${R.map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.deal.replace(' stake divestment (ABMC/ANPC)', ' divestment'))}</td><td class="nw">${escH(r.owner)}</td><td class="nw">${escH(r.legal)}</td><td class="nw">${escH(r.cps)}</td><td class="nw">${escH(r.neg)}</td><td class="nw">${fmtDate(r.date)}${r.overdue ? `<span class="od">${daysLate(r.date)}d late</span>` : ''}</td><td class="nw">${pill(r.status)}</td></tr>`).join('')}</tbody></table></div>`;
    const ready = H.filter(r => r.status === 'Ready').length;
    return `<div class="stack">${vh('Post-FID Legal Closing & PMO Handover', 'SG3 to SG4 · documents, conditions precedent, financial close and handover', exportBtn + printBtn)}
  <div class="kpi4">
    <div class="kc"><span class="lbl">Documents signed</span><span class="val num">${docs.filter(r => r.status === 'Signed').length}<small>of ${docs.length}</small></span></div>
    <div class="kc peach"><span class="lbl">Conditions precedent open</span><span class="val num">${cps.filter(r => !DONE.has(r.status)).length}<small>of ${cps.length}</small></span></div>
    <div class="kc"><span class="lbl">Financial close</span><span class="val num" style="font-size:24px">Pending</span><span class="ctx">Al Jazir financing agreement</span></div>
    <div class="kc"><span class="lbl">Handover readiness</span><span class="val num">${Math.round(ready / H.length * 100)}<small>%</small></span><span class="ctx">Al Jazir · ${ready} of ${H.length} items</span></div>
  </div>
  <section class="wp"><div class="wp-h"><div><h2>Legal and transaction documents</h2></div><button class="see" data-go="trk-close">Tracker ↗</button></div>${tbl(docs)}</section>
  <section class="wp"><div class="wp-h"><div><h2>Conditions precedent</h2></div></div>${tbl(cps)}</section>
  <section class="wp"><div class="wp-h"><div><h2>Al Jazir · PMO handover</h2><p>After handover, PMO owns SG4 execution and the Investment Team closes its development role</p></div><button class="see" data-go="trk-hand">Handover Tracker ↗</button></div>
    ${progBar(ready / H.length * 100)}<div class="hgrid">${H.map(r => `<span class="hitem ${r.status === 'Ready' ? 'ok' : r.status === 'In progress' ? 'wip' : ''}">${r.status === 'Ready' ? '✓' : r.status === 'In progress' ? '◐' : '○'} ${escH(r.t)}<small>${fmtDate(r.date)}</small></span>`).join('')}</div></section></div>`;
  }

  /* ---------------- Trackers ---------------- */
  let tState = {
    q: '',
    status: 'All',
    entity: 'All'
  };
  const entKeyOf = T => ['stage', 'step', 'deal', 'cat'].find(k => T.cols.some(c => c[0] === k)) || null;
  function vTrk(key) {
    const T = TRK[key];
    if (tState.key !== key) tState = {
      key,
      q: '',
      status: 'All',
      entity: 'All'
    };
    const rows = trkRows(key),
      sts = [...new Set(rows.map(r => r.status))],
      ek = entKeyOf(T),
      ents = ek ? [...new Set(rows.map(r => r[ek]))].filter(Boolean) : [];
    const lab = {
      stage: 'stages',
      step: 'stages',
      deal: 'opportunities',
      cat: 'categories'
    }[ek];
    return `<div>${vh(T.n, T.d, `<button class="btn sm" data-new="${key}">${ico.plus}New entry</button>` + exportBtn)}
  <section class="wp"><div class="tools noprint"><input type="search" id="tq" placeholder="Search this tracker" aria-label="Search this tracker" value="${escH(tState.q)}">
    <select id="ts" aria-label="Status"><option value="All">All statuses</option>${sts.map(s => `<option${tState.status === s ? ' selected' : ''}>${escH(s)}</option>`).join('')}</select>
    ${ek ? `<select id="te" aria-label="Filter"><option value="All">All ${lab}</option>${ents.map(s => `<option value="${escH(s)}"${tState.entity === s ? ' selected' : ''}>${escH(ek === 'stage' || ek === 'step' ? STEP_LBL[s] || s : s)}</option>`).join('')}</select>` : ''}
    <span class="cnt" id="tc"></span></div><div class="sumchips" id="tchips"></div>
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
    if (type === 'status') return `<td class="nw">${investmentStatus(r, v)}${r.overdue ? `<span class="od">${daysLate(r.date)}d overdue</span>` : ''}</td>`;
    if (type === 'stage') return `<td>${stageCell(v)}</td>`;
    if (type === 'm') return `<td class="r num">${v === '' || v == null || !+v ? '—' : m1(v)}</td>`;
    if (type === 'k') return `<td class="r num">${+v ? v + 'k' : '—'}</td>`;
    if (type === 'pct') return `<td class="r num">${v === '' || v == null ? '—' : v + '%'}</td>`;
    if (type === 'prog') return `<td style="min-width:110px">${progBar(v)}</td>`;
    if (type === 'prio') return `<td>${prioPill(v)}</td>`;
    if (type === 'flag') return `<td>${v ? `<span class="flag">⚑ ${escH(v)}</span>` : '—'}</td>`;
    if (k === 't' && view === 'trk-pipe' && r.id) return `<td>${dealLink(v, r.id)}${r._local ? '<span class="newtag">New</span>' : ''}</td>`;
    if (k === 't' && view === 'trk-gate' || k === 'deal') return `<td class="nw">${dealLink(v, idByName(v))}</td>`;
    return `<td${['sector', 'type', 'owner', 'cat', 'kind', 'fit', 'cons', 'fin', 'docs', 'legal', 'cps', 'neg', 'attn'].includes(k) ? ' class="nw"' : ''}>${escH(v || '—')}${k === 't' && r._local ? '<span class="newtag">New</span>' : ''}</td>`;
  }
  function fillTrk() {
    const key = view.slice(4),
      T = TRK[key],
      all = trkRows(key),
      rows = trkFiltered(),
      numT = ['m', 'k', 'pct'];
    $('#tt').innerHTML = `<thead><tr>${T.cols.map(c => `<th class="${numT.includes(c[2]) ? 'r' : ''}">${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${T.cols.map(c => cell(r, c)).join('')}<td class="r">${investmentTrackerActions(key, r)}</td></tr>`).join('') : `<tr><td colspan="${T.cols.length + 1}" style="text-align:center;color:var(--ink-2);padding:28px">No entries match these filters.</td></tr>`}</tbody>`;
    $('#tc').textContent = `${rows.length} of ${all.length} entries`;
    const by = {};
    all.forEach(r => by[r.status] = (by[r.status] || 0) + 1);
    const od = all.filter(r => r.overdue).length;
    let extra = '';
    if (key === 'pipe') {
      const L = all.filter(d => ['Active', 'Approved for next stage'].includes(d.status));
      extra = `<span>Live value <b>${m1(L.reduce((a, d) => a + (+d.value || 0), 0))}m</b></span>`;
    }
    if (key === 'dd') extra = `<span>Budget <b>OMR ${all.reduce((a, r) => a + (+r.budget || 0), 0)}k</b></span><span class="warn">Red flags <b>${all.filter(r => r.flags && !DONE.has(r.status)).length}</b></span>`;
    $('#tchips').innerHTML = Object.entries(by).map(([k, v]) => `<span>${escH(k)} <b>${v}</b></span>`).join('') + (od ? `<span class="warn">Overdue <b>${od}</b></span>` : '') + extra;
  }

  /* ---------------- AI reports ---------------- */
  function repHead(title, sub, sources, actions = '') {
    return `<div class="vh"><div><span class="ai-badge">${ico.spark}Drafted by OFC AI</span><h2 style="margin-top:10px">${title}</h2><p>${sub}</p><p class="src">Sources: <b>${sources}</b></p></div><div class="vh-actions noprint"><button class="btn ghost sm" data-regen>${ico.spark}Regenerate</button>${actions}${printBtn}<button class="btn sm" data-toast="Shared with the CIO for review.">Share</button></div></div>`;
  }
  function gateTable() {
    const L = live();
    return `<div class="tscroll"><table class="ttbl"><thead><tr><th>Gate</th><th class="r">Opportunities</th><th class="r">Value</th><th class="r">OFC requirement</th><th>Gate decision</th></tr></thead><tbody>${[1, 2, 3].map(g => {
      const D = L.filter(d => GATE_OF[d.stage] === g);
      return `<tr><td class="nw">SG${g} · ${GATES[g - 1].t}</td><td class="r num">${D.length}</td><td class="r num">${m1(D.reduce((a, d) => a + d.value, 0))}</td><td class="r num">${m1(D.reduce((a, d) => a + d.ofc, 0))}</td><td>${GATES[g - 1].exit}</td></tr>`;
    }).join('')}<tr><td class="nw">SG4 · Execution</td><td class="r num">${SG4.length}</td><td class="r num">${m1(SG4.reduce((a, p) => a + p.capex, 0))}</td><td class="r num">—</td><td>${GATES[3].exit}</td></tr><tr><td class="nw">SG5 · Operation</td><td class="r num">${SG5.n}</td><td class="r num">—</td><td class="r num">—</td><td>${GATES[4].exit}</td></tr></tbody></table></div>`;
  }
  function vRep(v) {
    const L = live(),
      G = trkRows('gate'),
      T = trkRows('tasks'),
      att = attention();
    let b = '';
    const lateG = G.filter(r => r.overdue),
      lateT = T.filter(r => r.overdue);
    if (v === 'rep-weekly') {
      const wk = MOVES.filter(m => daysLate(m[0]) <= 7 && daysLate(m[0]) >= -7);
      b = repHead('Weekly Investment Pipeline Report', 'Week of 20 September 2026', 'Investment Pipeline, Stage-Gate and Tasks trackers') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${L.length} live opportunities</b> worth <b>${m1(L.reduce((a, d) => a + d.value, 0))}m</b>. This week the CEO approved Project Raha's PIN, the AAAID price paper went to the Divestment Committee, and four new opportunities entered screening in the last month. <b>The Al Jazir FID is ${daysLate('2026-09-15')} days behind</b> its original date while financing is secured.</p>
    <h3>By gate</h3>${gateTable()}
    <h3>Movements</h3><ul class="pts">${MOVES.slice(0, 6).map(m => {
        const d = dealById(m[1]);
        return `<li>${fmtDate(m[0])} · <b style="font-weight:600">${escH(d[1])}</b>: ${escH(m[4])}.</li>`;
      }).join('')}</ul>
    <h3>Decisions due next week</h3><ul class="pts">${MEET.filter(m => -daysLate(m[0]) >= 0 && -daysLate(m[0]) <= 14).map(m => `<li>${fmtDate(m[0])} · ${escH(m[1])}: ${escH(m[2])}.</li>`).join('')}</ul>
    <h3>Watch list</h3><ul class="pts">${att.slice(0, 4).map(a => `<li>${escH(a.t)}.</li>`).join('')}</ul></section>`;
    } else if (v === 'rep-monthly') {
      const sec = {};
      L.forEach(d => sec[d.sector] = (sec[d.sector] || 0) + d.value);
      const S = Object.entries(sec).sort((a, b) => b[1] - a[1]);
      b = repHead('Monthly Investment Portfolio / Pipeline Report', 'September 2026', 'All Investment trackers, PMO and Asset Management summaries') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead">Across the five gates, OFC has <b>${L.length} opportunities in development</b> (SG1–SG3), <b>${SG4.length} projects in execution</b> (SG4) and <b>${SG5.n} operating companies</b> (SG5). ${deals().filter(d => d.scr >= '2026').length} opportunities have been screened this year against a target of 12; none has yet reached FID against a target of 2.</p>
    <h3>Five-gate position</h3>${gateTable()}
    <h3>Pipeline by sector</h3>${S.map(([k, x]) => hbar(k, x, S[0][1])).join('')}
    <h3>Portfolio notes</h3><ul class="pts"><li>SG4: Subsidiary D is delayed; the mobilisation issue is escalated to the Transformation Committee.</li><li>SG5: year-to-date revenue of 162.4m is 4.9% below budget.</li><li>Exit: the AAAID stake price decision is due on 30 Sep, with expected proceeds of 14.0m.</li></ul></section>`;
    } else if (v === 'rep-move') {
      b = repHead('Pipeline Movement Report', 'Last 60 days', 'Stage-Gate &amp; Approval Tracker, Investment Pipeline Tracker', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${MOVES.length} movements</b> in the last 60 days: ${MOVES.filter(m => m[2] === '—').length} new opportunities, ${MOVES.filter(m => m[2] !== '—' && m[2] !== m[3]).length} gate progressions and ${MOVES.filter(m => m[2] === m[3]).length} updates without a change of stage.</p>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Date</th><th>Opportunity</th><th>From</th><th>To</th><th>What happened</th></tr></thead><tbody>${[...MOVES].sort((a, b) => b[0].localeCompare(a[0])).map(m => {
        const d = dealById(m[1]);
        return `<tr><td class="nw">${fmtDate(m[0])}</td><td>${dealLink(d[1], d[0])}</td><td class="nw">${m[2] === '—' ? '—' : stageCell(m[2])}</td><td class="nw">${stageCell(m[3])}</td><td>${escH(m[4])}</td></tr>`;
      }).join('')}</tbody></table></div>
    <h3>Closed or paused this year</h3><ul class="pts">${deals().filter(d => ['Declined', 'Deferred', 'Inactive'].includes(d.status)).map(d => `<li>${escH(d.t)} · ${d.status.toLowerCase()} · ${escH(d.next)}</li>`).join('')}</ul></section>`;
    } else if (v === 'rep-overdue') {
      const corp = [['Al Jazir FID financing timeline slippage', 'BEC', '2026-09-15'], ['AAAID consideration price (ABMC/ANPC)', 'Divestment Committee', '2026-09-30'], ['Subsidiary D mobilization delay', 'Transformation Committee', '2026-09-10']];
      b = repHead('Overdue Actions & Decisions Report', 'As at 23 September 2026', 'Stage-Gate Tracker, Investment Tasks Tracker, Corporate decisions register', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${lateG.length} gate decision${lateG.length === 1 ? '' : 's'}</b> and <b>${lateT.length} task${lateT.length === 1 ? '' : 's'}</b> are overdue. The most material is the Al Jazir FID, which holds up SG3 closing and the handover to the PMO.</p>
    <h3>Gate decisions</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th>Stage</th><th>Due</th><th class="r">Days late</th><th>Pending</th></tr></thead><tbody>${lateG.map(r => `<tr><td>${dealLink(r.t, idByName(r.t))}</td><td>${stageCell(r.step)}</td><td class="nw">${fmtDate(r.date)}</td><td class="r num neg">${daysLate(r.date)}</td><td>${escH(r.pend)}</td></tr>`).join('')}</tbody></table></div>
    <h3>Tasks</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Task</th><th>Opportunity</th><th>Owner</th><th>Due</th><th class="r">Days late</th><th>Priority</th></tr></thead><tbody>${lateT.map(r => `<tr><td>${escH(r.t)}</td><td class="nw">${escH(r.deal)}</td><td class="nw">${escH(r.owner)}</td><td class="nw">${fmtDate(r.date)}</td><td class="r num neg">${daysLate(r.date)}</td><td>${prioPill(r.prio)}</td></tr>`).join('')}</tbody></table></div>
    <h3>Investment decisions on the Corporate register</h3><ul class="pts">${corp.map(c => `<li>${escH(c[0])} · ${escH(c[1])} · ${daysLate(c[2]) > 0 ? `<span class="neg">${daysLate(c[2])} days past the decision date</span>` : 'due ' + fmtDate(c[2])}</li>`).join('')}</ul></section>`;
    } else if (v === 'rep-risk') {
      const flags = trkRows('dd').filter(r => r.flags && !DONE.has(r.status)),
        kyc = trkRows('kyc').filter(r => ['Concern', 'Reject'].includes(r.status)),
        hr = L.filter(d => d.risk === 'High'),
        below = Object.entries(FIN).filter(([id, f]) => f.down && f.down < HURDLE && L.some(d => d.id === id));
      b = repHead('Investment Risk / Red-Flag Report', 'Live opportunities', 'DD, KYC and Pipeline trackers, financial models') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${flags.length} DD red flag${flags.length === 1 ? '' : 's'}</b>, <b>${kyc.length} KYC concerns</b> and <b>${below.length} deals</b> whose downside case falls below the ${HURDLE}% hurdle.</p>
    <h3>Due diligence red flags</h3><ul class="att">${flags.map(r => `<li><button data-go="ddd"><span class="ic">${ico.warn}</span><span><div class="t">${escH(r.deal)} · ${escH(r.t)}</div><div class="m">${escH(r.flags)}</div></span><span></span>${chev}</button></li>`).join('')}</ul>
    <h3>Partner / KYC</h3><ul class="att">${kyc.map(r => `<li><button data-go="kycd"><span class="ic">${ico.warn}</span><span><div class="t">${escH(r.t)} · ${escH(r.status)}</div><div class="m">${escH(r.deal)} · ${escH(r.flags || r.comp)}</div></span><span></span>${chev}</button></li>`).join('')}</ul>
    <h3>Returns at risk (downside case)</h3><div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th class="r">Base IRR</th><th class="r">Downside IRR</th><th>Comparison against criteria</th></tr></thead><tbody>${below.map(([id, f]) => {
        const d = deals().find(x => x.id === id);
        return `<tr><td>${dealLink(d.t, id)}</td><td class="r num">${f.irr}%</td><td class="r num neg">${f.down}%</td><td>${f.irr >= HURDLE ? 'Meets the hurdle in the base case only' : 'Below the hurdle in the base case'}${f.pb > MAX_PAYBACK ? `; payback of ${f.pb} years exceeds ${MAX_PAYBACK}` : ''}</td></tr>`;
      }).join('')}</tbody></table></div>
    <h3>High initial risk</h3><ul class="pts">${hr.map(d => `<li>${escH(d.t)} (${STEP_LBL[d.stage]}): ${escH(d.next)}</li>`).join('')}</ul></section>`;
    } else if (v === 'rep-cal') {
      b = repHead('Upcoming Approval / Decision Calendar', 'Next 60 days', 'Stage-Gate Tracker, governance calendar') + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${MEET.length} decisions</b> are scheduled. Three fall before the Board on 22 Oct: the Bahr PIN, the AAAID price and the Marai EC.</p>
    <ul class="cal2">${MEET.map(m => {
        const d = dealById(m[3]);
        return `<li><span class="cd"><b>${m[0].slice(8)}</b><span>${MON[+m[0].slice(5, 7) - 1]}</span></span><span><b style="font-weight:600">${escH(m[1])}</b> · ${escH(m[2])}<small>${escH(d[1])} · ${STEP_LBL[d[9]]} · ${escH(d[19])}</small></span><button class="see" data-go="tx|${m[3]}">Open ↗</button></li>`;
      }).join('')}</ul></section>`;
    } else if (v === 'rep-summary') {
      const S = L.filter(d => GATE_OF[d.stage] >= 2);
      b = repHead('Investment Summary', 'SG2 and SG3 opportunities', 'Pipeline Tracker, financial models, Stage-Gate Tracker', exportBtn) + `<section class="wp rep-doc gen" id="repDoc">
    <p class="lead"><b>${S.length} opportunities</b> are past the CEO gate, with a combined OFC requirement of <b>${m1(S.reduce((a, d) => a + d.ofc, 0))}m</b>. ${S.filter(d => FIN[d.id]?.irr >= HURDLE).length} meet the ${HURDLE}% hurdle in the base case.</p>
    <div class="tscroll"><table class="ttbl"><thead><tr><th>Opportunity</th><th>Stage</th><th class="r">Value</th><th class="r">OFC</th><th class="r">IRR</th><th class="r">NPV</th><th class="r">Payback</th><th>Next decision</th></tr></thead><tbody>${S.map(d => {
        const f = FIN[d.id] || {};
        return `<tr><td>${dealLink(d.t, d.id)}</td><td>${stageCell(d.stage)}</td><td class="r num">${m1(d.value)}</td><td class="r num">${d.ofc ? m1(d.ofc) : '—'}</td><td class="r num ${f.irr >= HURDLE ? 'pos' : f.irr ? 'neg' : ''}">${f.irr ? f.irr + '%' : '—'}</td><td class="r num">${f.npv !== undefined ? m1(f.npv) : '—'}</td><td class="r num">${f.pb ? f.pb + ' yrs' : '—'}</td><td>${escH(d.next)}</td></tr>`;
      }).join('')}</tbody></table></div></section>`;
    } else {
      const id = param || 'D04',
        d = deals().find(x => x.id === id) || deals()[0],
        F = FIN[id] || {},
        S = SCORES[id] || [],
        A = ASSESS[id],
        K = trkRows('kyc').find(k => k.deal === d.t);
      const kind = GATE_OF[d.stage] === 1 ? 'PIN / Origination Note' : GATE_OF[d.stage] === 2 ? 'Executive Committee paper' : 'Board paper';
      const sel = `<select id="paperSel" class="noprint" aria-label="Opportunity" style="height:34px;border:1px solid var(--line);border-radius:6px;background:var(--callout);padding:0 10px;font:inherit;font-size:13px;max-width:260px">${live().map(x => `<option value="${x.id}"${x.id === d.id ? ' selected' : ''}>${escH(x.t)}</option>`).join('')}</select>`;
      b = repHead(`Draft ${kind}: ${escH(d.t)}`, `${STEP_LBL[d.stage]} · SG${GATE_OF[d.stage]} · for review by the ${escH(d.owner)}`, 'Pipeline, KYC, DD and Stage-Gate trackers, financial model', sel) + `<section class="wp rep-doc gen" id="repDoc">
    <h3 style="margin-top:0">1. Purpose</h3><p>To ${GATE_OF[d.stage] === 1 ? 'seek CEO approval to start a full in-house assessment of' : GATE_OF[d.stage] === 2 ? 'seek EC approval for detailed due diligence on' : 'seek Board approval and FID for'} ${escH(d.t)}, a ${d.type === 'Greenfield' ? 'capital project' : d.type === 'Brownfield' ? 'acquisition' : 'divestment'} in ${escH(d.sector.toLowerCase())} with ${escH(d.partner)}.</p>
    <h3>2. Strategic rationale</h3><p>Strategic fit is rated <b>${escH(d.fit.toLowerCase())}</b>. ${S.length ? `Market attractiveness scores ${S[0]} of 5 and partner attractiveness ${S[3]} of 5.` : ''} The opportunity supports OFC's food security mandate and the 2030 portfolio targets.</p>
    <h3>3. Investment and returns</h3><ul class="pts"><li>Total investment of ${m1(d.value)}m; OFC requirement of ${m1(d.ofc)}m${F.share ? ` for ${/^(8|11|18)/.test(String(F.share)) ? 'an' : 'a'} ${F.share}% shareholding` : ''}.</li>${F.eq !== undefined ? `<li>Funding: ${m1(F.eq)}m equity and ${m1(F.debt)}m debt.</li>` : ''}${F.irr ? `<li>Equity IRR of ${F.irr}% against the ${HURDLE}% hurdle${F.npv !== undefined ? `; NPV of ${m1(F.npv)}m` : ''}${F.pb ? `; payback in ${F.pb} years` : ''}.</li>` : ''}${F.down ? `<li>Downside case IRR of ${F.down}%${F.down < HURDLE ? ', below the hurdle' : ''}.</li>` : ''}${F.proceeds ? `<li>Expected proceeds of ${m1(F.proceeds)}m (range ${F.range}m) against a carrying value of ${m1(F.book)}m.</li>` : ''}</ul>
    <h3>4. Partner</h3><p>${K ? `KYC status: <b>${escH(K.status)}</b>. ${escH(K.ubo)}. ${K.flags ? 'Red flag: ' + escH(K.flags) + '.' : 'No red flags raised.'}` : 'KYC not yet started.'}</p>
    <h3>5. Key risks and information gaps</h3><ul class="pts"><li>Initial risk rating: ${escH(d.risk)}.</li>${A ? `<li>${escH(A.risks)}.</li><li>${escH(A.gaps)}.</li>` : ''}${trkRows('dd').filter(r => r.deal === d.t && r.flags).map(r => `<li>${escH(r.t)}: ${escH(r.flags)}.</li>`).join('')}</ul>
    <h3>6. Recommendation</h3><p><b>${escH(GATE_OF[d.stage] === 2 && EC[id] ? EC[id].rec : A?.rec || (GATE_OF[d.stage] === 3 ? 'Proceed subject to conditions' : d.rec === 'Pursue' ? 'Approve to proceed' : d.rec))}</b>. Next step: ${escH(d.next)}.</p>
    <p class="src noprint" style="margin-top:18px">Draft generated from tracker data. Review figures against the latest model before circulation.</p></section>`;
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
    if (['pipe', 'scr', 'rep-summary'].includes(view)) return download('investment-pipeline.csv', [['Opportunity', 'Sector', 'Type', 'Value', 'OFC requirement', 'Stage', 'Gate', 'Status', 'Probability %', 'Owner', 'Next step'], ...deals().map(d => [d.t, d.sector, d.type, d.value, d.ofc, STEP_LBL[d.stage], 'SG' + GATE_OF[d.stage], d.status, d.prob, d.owner, d.next])]);
    if (view === 'kycd') return download('partner-kyc.csv', [['Partner', 'Opportunity', 'UBO', 'Financial standing', 'Compliance', 'Documents', 'Status', 'Red flags'], ...trkRows('kyc').map(r => [r.t, r.deal, r.ubo, r.fin, r.comp, r.docs, r.status, r.flags])]);
    if (view === 'ddd') return download('due-diligence-workstreams.csv', [['Workstream', 'Opportunity', 'Consultant', 'Budget k', 'Due', 'Progress', 'Status', 'Red flags'], ...trkRows('dd').map(r => [r.t, r.deal, r.cons, r.budget, fmtDate(r.date), r.prog, r.status, r.flags])]);
    if (view === 'closed') return download('legal-closing.csv', [['Item', 'Opportunity', 'Type', 'Owner', 'Legal', 'Counterparty', 'Target', 'Status'], ...trkRows('close').map(r => [r.t, r.deal, r.kind, r.owner, r.legal, r.cps, fmtDate(r.date), r.status])]);
    if (view === 'rep-move') return download('pipeline-movements.csv', [['Date', 'Opportunity', 'From', 'To', 'Note'], ...MOVES.map(m => [fmtDate(m[0]), dealById(m[1])[1], m[2], m[3], m[4]])]);
    if (view === 'rep-overdue') return download('overdue.csv', [['Type', 'Item', 'Due', 'Days late'], ...trkRows('gate').filter(r => r.overdue).map(r => ['Gate decision', r.t + ' · ' + r.step, fmtDate(r.date), daysLate(r.date)]), ...trkRows('tasks').filter(r => r.overdue).map(r => ['Task', r.t, fmtDate(r.date), daysLate(r.date)])]);
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
    const k = pane || (location.pathname !== '/investment' || sheetOpen ? 'input' : section(view));
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
      toast('Report regenerated from current tracker data.');
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
    if (e.target.id === 'dealSel') go('tx|' + e.target.value);
    if (e.target.id === 'paperSel') go('rep-paper|' + e.target.value);
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

  /* Investment management. Existing tracker seeds remain the baseline; browser
     overlays store edits, stable opportunity references and a chronological audit. */
  const investmentToday = () => new Date().toISOString().slice(0, 10);
  const investmentCanWrite = () => role.apps.includes(APP_ID);
  const investmentPaused = new Set(['Inactive', 'Deferred', 'Declined', 'Closed']);
  let investmentBusy = false,
    investmentEditor = null;
  let renderingEntryRoute = false;
  function investmentReturnTo(value, fallback = '/investment#pipe') {
    try {
      const url = new URL(value || fallback, location.origin);
      if (url.origin === location.origin && ['/investment','/investment/documents','/investment/gate-one'].includes(url.pathname)) return url.pathname + url.search + url.hash;
    } catch {}
    return fallback;
  }
  function investmentNavigate(url, replace = false) {
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
    const [b,p] = decodeURIComponent(location.hash.slice(1) || 'home').split('|');
    view = VIEWS[b] ? b : 'home'; param = p || '';
    hidePane(); closeSheet(); render(); window.scrollTo({top:0});
  }
  function investmentPageHeader(title, description, back) {
    return `<div class="investment-page-heading"><a class="see" data-invest-nav href="${escH(investmentReturnTo(back))}">← Back</a>${vh(escH(title),escH(description))}</div>`;
  }
  function investmentEntryUrl(key, id, preset = {}, action = '') {
    const query = new URLSearchParams({tracker:key,return:investmentReturnTo(location.pathname+location.search+location.hash)});
    if (id) query.set('record',id);
    if (preset.dealId) query.set('opportunity',preset.dealId);
    if (action) query.set('action',action);
    return '/investment/entry?' + query;
  }
  function investmentRenderEntryRoute() {
    const query = new URLSearchParams(location.search), key = query.get('tracker'), id = query.get('record');
    const d = investmentDeals().find(d => d.id === query.get('opportunity'));
    if (!TRK[key] || (query.get('opportunity') && !d) || (id && !trkRows(key).some(r => (key === 'pipe' ? r.id : r._id) === id))) {
      $('#view').innerHTML = investmentPageHeader('Entry unavailable','Choose an existing opportunity or tracker.','/investment#pipe'); return;
    }
    const existing = id ? trkRows(key).find(r => (key === 'pipe' ? r.id : r._id) === id) : null;
    if ((existing && (existing.status === 'Handed over to PMO' || key === 'gate' && existing.decision)) || (query.get('action') && !['Active','Inactive','Deferred','Declined','Closed'].includes(query.get('action')))) {
      $('#view').innerHTML = investmentPageHeader('Entry is read-only','Open the opportunity to view its recorded decisions and current ownership.','/investment#pipe'); return;
    }
    renderingEntryRoute = true;
    try {
      if (query.get('action')) investmentLifecycle(id,query.get('action'));
      else openSheet(key,id,d ? linkedDefaults(key,d) : {});
    } finally { renderingEntryRoute = false; }
  }
  const pipelineState = {
    q: '',
    owner: 'All',
    stage: 'All',
    status: 'Live',
    sort: 'date',
    layout: 'table'
  };
  const managementField = (k, l, type = 'text', extra = {}) => ({
    k,
    l,
    type,
    ...extra
  });
  TRK.pipe.fields = TRK.pipe.fields.filter(f => !['stage', 'status'].includes(f.k));
  TRK.pipe.fields.push(managementField('geo', 'Geography'), managementField('source', 'Origination source'), managementField('scr', 'Screening date', 'date'), managementField('risk', 'Risk rating', 'select', {
    o: ['Low', 'Medium', 'High']
  }), managementField('rec', 'Screening recommendation', 'select', {
    o: ['Pursue', 'Need more information', 'Hold', 'Reject']
  }));
  for (const f of TRK.pipe.fields) {
    if (['owner', 'prog', 'next'].includes(f.k)) f.req = 1;
    if (f.type === 'number') {
      f.min = 0;
      if (['prob', 'prog'].includes(f.k)) f.max = 100;
    }
  }
  TRK.assessment = {
    n: 'Investment Assessment Tracker',
    d: 'Maintain screening scores, financial assumptions and the investment recommendation for each opportunity.',
    noOverdue: true,
    fields: [managementField('deal', 'Opportunity', 'select', {
      req: 1
    }), managementField('t', 'Assessment / version', 'text', {
      req: 1
    }), managementField('owner', 'Prepared by', 'text', {
      req: 1
    }), managementField('date', 'As-of date', 'date', {
      req: 1
    }), ...gateTwoSections.map(s=>managementField(s.key,s.title,'textarea',{full:1})), ...['Market', 'Commercial', 'Financial', 'Partner'].map((n, i) => managementField('score' + i, n + ' score (1–5)', 'number', {
      min: 1,
      max: 5
    })), ...['eq', 'debt', 'share', 'irr', 'npv', 'pb', 'down'].map((k, i) => managementField(k, ['Equity requirement (OMR m)', 'Debt requirement (OMR m)', 'OFC shareholding (%)', 'Equity IRR (%)', 'NPV (OMR m)', 'Payback (years)', 'Downside IRR (%)'][i], 'number', {
      ...(['eq', 'debt', 'share', 'pb'].includes(k) ? {
        min: 0
      } : {}),
      ...(k === 'share' ? {
        max: 100
      } : {})
    })), managementField('rec', 'Recommendation', 'textarea', {
      full: 1
    }), managementField('find', 'Findings / development option', 'textarea', {
      full: 1
    }), managementField('flags', 'Risks', 'textarea', {
      full: 1
    }), managementField('out', 'Information gaps / conditions', 'textarea', {
      full: 1
    }), managementField('status', 'Status', 'select', {
      o: ['Draft', 'In progress', 'Completed']
    })],
    cols: [['t', 'Assessment'], ['deal', 'Opportunity'], ['owner', 'Owner'], ['date', 'As of', 'date'], ['irr', 'IRR', 'pct'], ['npv', 'NPV', 'm'], ['status', 'Status', 'status'], ['rec', 'Recommendation']],
    rows: []
  };
  TRK_KEYS.push('assessment');
  VIEWS['trk-assessment'] = TRK.assessment.n;
  for (const [id, a] of Object.entries(ASSESS)) {
    const d = TRK.pipe.rows.find(d => d.id === id),
      f = FIN[id] || {};
    if (d) TRK.assessment.rows.push({
      t: 'Baseline assessment',
      deal: d.t,
      dealId: id,
      owner: d.owner,
      date: d.scr,
      status: 'In progress',
      ...Object.fromEntries(['eq', 'debt', 'share', 'irr', 'npv', 'pb', 'down'].filter(k => f[k] != null).map(k => [k, f[k]])),
      ...Object.fromEntries((SCORES[id] || []).map((v, i) => ['score' + i, v])),
      rec: a.rec,
      find: a.find || '',
      flags: a.risks,
      out: a.gaps
    });
  }
  for (const T of Object.values(TRK)) for (const f of T.fields) if (f.type === 'number') {
    if (['prog', 'prob'].includes(f.k)) {
      f.min = 0;
      f.max = 100;
    }
    if (['value', 'ofc', 'budget'].includes(f.k)) f.min = 0;
  }
  VIEWS.pipe = 'Manage Pipeline';
  VIEWS.tx = 'Opportunity Workspace';
  VIEWS.analytics = 'Pipeline Analytics';
  DASHES.push('analytics');
  const originalPipelineAnalytics = vPipe;
  const investmentBaseFinancials = structuredClone(FIN);
  const investmentBaseScores = structuredClone(SCORES);
  function investmentBaseDeals() {
    return [...liveRegister('ofc-tracker-entries').filter(r => r.app === APP_ID && r.trk === TRK.pipe.n && r.d).map(r => ({
      ...r.d,
      id: r.id,
      _local: r.id,
      _id: r.id
    })), ...TRK.pipe.rows.map((r, i) => ({
      ...r,
      _id: 'pipe:' + i
    }))];
  }
  function investmentDeals() {
    return investmentBaseDeals().map(r => ({
      ...r,
      ...recordPatch('ofc-investment-edits', r._id),
      ...recordPatch('ofc-deal-state', r.id)
    }));
  }
  function investmentRowDeal(r, key) {
    const list = investmentDeals();
    return list.find(d => d.id === r.dealId) || list.find(d => d.t === (key === 'gate' ? r.t : r.deal)) || (() => {
      const base = investmentBaseDeals().find(d => d.t === (key === 'gate' ? r.t : r.deal));
      return list.find(d => d.id === base?.id);
    })();
  }
  trkRows = function (key) {
    if (key === 'pipe') return investmentDeals().map(d => ({
      ...d,
      overdue: !investmentPaused.has(d.status) && d.status !== 'Handed over to PMO' && !!d.date && daysLate(d.date) > 0
    }));
    const T = TRK[key];
    if (!T) return [];
    return [...liveRegister('ofc-tracker-entries').filter(r => r.app === APP_ID && r.trk === T.n && r.d).map(r => ({
      ...r.d,
      _id: r.id,
      _local: r.id,
      at: r.at
    })), ...T.rows.map((r, i) => ({
      ...r,
      _id: key + ':' + i
    }))].map(r => {
      const o = {
          ...r,
          ...recordPatch('ofc-investment-edits', r._id)
        },
        d = investmentRowDeal(o, key);
      if (d) {
        o.dealId = d.id;
        if (key === 'gate') o.t = d.t;else o.deal = d.t;
      }
      return {
        ...o,
        overdue: !!(!T.noOverdue && o.date && !DONE.has(o.status) && daysLate(o.date) > 0)
      };
    }).filter(r => !r._deleted);
  };
  function investmentHydrate() {
    TLOCAL = liveRegister('ofc-tracker-entries');
    const list = investmentDeals();
    DEAL_N.splice(0, DEAL_N.length, ...list.map(d => d.t));
    for (const d of list) {
      const a = trkRows('assessment').find(r => r.dealId === d.id);
      FIN[d.id] = {
        ...investmentBaseFinancials[d.id]
      };
      SCORES[d.id] = [...(investmentBaseScores[d.id] || [])];
      if (a) {
        for (const k of ['eq', 'debt', 'share', 'irr', 'npv', 'pb', 'down']) if (a[k] !== '' && a[k] != null) FIN[d.id][k] = +a[k];
        SCORES[d.id] = [0, 1, 2, 3].map(i => a['score' + i] !== '' && a['score' + i] != null ? +a['score' + i] : SCORES[d.id][i] || 0);
      }
    }
  }
  function investmentMovementRows() {
    return [...liveRegister('ofc-investment-history'), ...trkRows('gate').filter(r => r._local && r.dealId && !r.managementAudit).map(r => ({
      id: r._id,
      dealId: r.dealId,
      date: r.date,
      at: r.at || 0,
      from: r.fromStage || r.step,
      to: r.toStage || r.step,
      note: r.decision || r.pend || r.status
    })), ...MOVES.map((m, i) => ({
      id: 'baseline-' + i,
      date: m[0],
      dealId: m[1],
      from: m[2],
      to: m[3],
      note: m[4],
      at: new Date(m[0]).getTime()
    }))].sort((a, b) => (b.at || 0) - (a.at || 0));
  }
  function investmentAudit(changes, deal, note, from = deal?.stage, to = deal?.stage) {
    const entry = {
      id: crypto.randomUUID(),
      dealId: deal.id,
      date: investmentToday(),
      at: Date.now(),
      from: from || '—',
      to: to || 'Screening',
      note,
      actor: role.n
    };
    return {
      ...changes,
      'ofc-investment-history': [entry, ...liveRegister('ofc-investment-history')]
    };
  }
  function investmentSave(changes, deal, note, from, to) {
    if (!investmentCanWrite()) return false;
    const values = deal ? investmentAudit(changes, deal, note, from, to) : changes;
    if (!handoverWrite(values)) return false;
    investmentHydrate();
    return true;
  }
  function investmentCalendar() {
    return investmentDeals().filter(d => d.date && ['Active', 'Approved for next stage'].includes(d.status)).map(d => [d.date, STEP_LBL[d.stage], d.t + ': ' + d.next, d.id]).sort((a, b) => a[0].localeCompare(b[0]));
  }
  function investmentTrackerActions(key, r) {
    if (key === 'gate' && r.decision) return '<span class="src">Recorded decision</span>';
    if (key === 'pipe' && r.status === 'Handed over to PMO') return '<a class="see" href="/pmo#delivery">PMO ↗</a>';
    return `<button class="btn ghost sm" data-invest-edit="${escH(key === 'pipe' ? r.id : r._id)}" data-invest-key="${key}">Edit</button> ${investmentEvidence(r)}`;
  }
  function investmentUpdateStatus(id, status) {
    if (!investmentCanWrite()) return;
    const key = TRK_KEYS.find(k => k !== 'pipe' && trkRows(k).some(r => r._id === id));
    if (!key || key === 'gate') return;
    const r = trkRows(key).find(r => r._id === id),
      field = TRK[key].fields.find(f => f.k === 'status');
    if (!field?.o?.includes(status) || r.status === status) return;
    const deal = investmentDeals().find(d => d.id === r.dealId),
      patch = {
        ...recordPatch('ofc-investment-edits', id),
        status,
        at: Date.now(),
        ...(status === 'Completed' && r.prog != null ? {
          prog: 100
        } : {})
      };
    if (investmentSave({
      'ofc-investment-edits': {
        ...recordOverlay('ofc-investment-edits'),
        [id]: patch
      }
    }, deal, TRK[key].n + ': ' + r.t + ' · ' + r.status + ' → ' + status)) render();
  }
  investmentDecision = function (id, index) {
    if (!investmentCanWrite()) return;
    const d = investmentDeals().find(d => d.id === id),
      a = GATE_ACTIONS[d?.stage]?.[index];
    if (!a || investmentPaused.has(d.status) || d.status === 'Handed over to PMO') return;
    const blockers=investmentBlockers(d,a[0]);
    if(blockers.length){toast('Complete before proceeding: '+blockers.map(c=>c.label).join('; '));render();return;}
    const fip=a[1]==='Closing'?liveRegister('ofc-investment-documents').filter(doc=>doc.dealId===id&&doc.type==='fip').sort((a,b)=>b.version-a.version)[0]:null;
    let pin = null;
    const isPinDecision = ['PIN', 'CEO'].includes(d.stage);
    if (isPinDecision && a[1] === 'EC') {
      try { pin = investmentDocuments.pinForApproval(d); } catch (error) { toast(error.message); return; }
    } else if (isPinDecision) pin = investmentDocuments.latestSubmitted(d);
    const date = investmentToday(),
      status = a[2] || (a[0].includes('more information') ? 'Additional information required' : a[0].includes('conditions') ? 'Approved subject to conditions' : a[0].includes('further due diligence') ? 'Additional information required' : 'Approved to proceed'),
      decision = {
        t: d.t,
        dealId: id,
        step: ['PIN', 'CEO'].includes(d.stage) ? 'CEO' : d.stage,
        fromStage: d.stage,
        toStage: a[1],
        status,
        owner: d.owner,
        date,
        pend: a[0],
        next: a[0],
        decision: a[0],
        managementAudit: true,
        ...(pin ? { pinDocumentId: pin.id, pinVersion: pin.version } : {}),
        ...(fip ? {fipDocumentId:fip.id,fipVersion:fip.version}: {})
      },
      entry = {
        id: 'GATE-' + crypto.randomUUID(),
        at: Date.now(),
        app: APP_ID,
        trk: TRK.gate.n,
        t: d.t,
        d: decision
      },
      edits = recordOverlay('ofc-investment-edits');
    for (const r of trkRows('gate').filter(r => r.dealId === id && r.status === 'Pending' && [d.stage, decision.step].includes(r.step))) edits[r._id] = {
      ...edits[r._id],
      status,
      date,
      pend: a[0]
    };
    const generated = !a[2] && a[1] !== d.stage ? investmentChecklistEntries(d, a[1]) : [];
    if (!investmentSave({
      ...(pin ? investmentDocuments.decisionChanges(pin, a[1] === 'EC' ? 'Approved' : a[2] === 'Declined' ? 'Declined' : 'Returned') : {}),
      ...(fip?investmentDocuments.decisionChanges(fip,'Approved'):{}),
      'ofc-tracker-entries': [entry, ...generated, ...liveRegister('ofc-tracker-entries')],
      'ofc-investment-edits': edits,
      'ofc-deal-state': {
        ...recordOverlay('ofc-deal-state'),
        [id]: {
          ...recordPatch('ofc-deal-state', id),
          stage: a[1],
          status: a[2] || 'Active',
          prog: Math.max(d.prog || 0, {
            PIN: 20,
            EC: 35,
            DD: 55,
            FID: 80,
            Closing: 90
          }[a[1]] || 0),
          next: a[0],
          reason: a[2] ? a[0] : d.reason || '',
          at: Date.now()
        }
      }
    }, d, a[0] + (pin ? ` (PIN v${pin.version})` : '') + (generated.length ? `; created ${generated.length} checklist items` : ''), d.stage, a[1])) return;
    investmentGateNotice={id,text:`${a[0]} recorded. ${a[2]?'The opportunity is '+a[2].toLowerCase()+'.':a[1]!==d.stage?'Now at '+(STEP_LBL[a[1]]||a[1])+'. Follow the next step below.':'The opportunity remains at '+(STEP_LBL[a[1]]||a[1])+'.'}`};
    render();
    toast(a[0] + (generated.length ? `. ${generated.length} checklist items created for review.` : ''));
  };
  function investmentChecklistEntries(deal, stage) {
    const existing = ['tasks', 'hand'].flatMap(key => trkRows(key).map(r => ({ ...r, key })));
    return stageChecklist(deal, stage, existing).map(({ key, d }) => ({
      id: 'AUTO-' + crypto.randomUUID(), at: Date.now(), app: APP_ID, trk: TRK[key].n, t: d.t, d
    }));
  }
  function investmentOptions(f, value) {
    let options = f.o || [];
    if(investmentEditor?.key==='pipe'&&['type','fit','risk','rec'].includes(f.k))options=['',...options];
    if (f.k === 'deal' || sheetKey === 'gate' && f.k === 't') options = ['', ...investmentDeals().map(d => d.t)];
    if (value && !options.includes(value)) options = [value, ...options];
    return options.map(o => `<option value="${escH(o)}"${String(o) === String(value) ? ' selected' : ''}>${escH(o || (['type','fit','risk','rec'].includes(f.k)?'Not assessed':'Select an opportunity'))}</option>`).join('');
  }
  fieldHTML = function (f, record = {}) {
    const value = record[f.k] ?? '',
      bounds = (f.min != null ? ` min="${f.min}"` : '') + (f.max != null ? ` max="${f.max}"` : ''),
      req = f.req ? ' required' : '';
    let control;
    if (f.type === 'select') control = `<select name="${f.k}"${req}>${investmentOptions(f, value)}</select>`;else if (f.type === 'textarea') control = `<textarea name="${f.k}" rows="3"${req}>${escH(value)}</textarea>`;else if (f.type === 'file') control = `<input type="file" name="${f.k}"><small>${escH(record.fileName || 'Attach evidence up to 10 MB. Saved in this browser.')}</small>`;else control = `<input name="${f.k}" type="${f.type || 'text'}" value="${escH(value)}"${req}${bounds}${f.type === 'number' ? ' step="any"' : ''} autocomplete="off">`;
    return `<label class="${f.full ? 'full' : ''}"><span>${escH(f.l)}${f.req ? ' *' : ''}</span>${control}</label>`;
  };
  function investmentShowForm(title, fields, record, button = 'Save changes') {
    closeFlyouts(); hidePane(); sheetOpen = false;
    const back = investmentReturnTo(new URLSearchParams(location.search).get('return'));
    $('#view').innerHTML = `<div class="stack investment-entry-page">${investmentPageHeader(title,'Complete the entry, then save to return to your work.',back)}<section class="wp"><form class="pform" id="trkForm" novalidate>${investmentEditor?.key==='assessment'?gateTwoControls():''}${fields.map(f => f.k.startsWith('g2_')?gateTwoField(f,record,escH):fieldHTML(f, record)).join('')}<p class="err full" id="trkErr" role="alert" hidden></p><div class="full investment-page-actions"><span>Linked details are prefilled where available. Saved in this browser.</span><a class="btn ghost" data-invest-nav href="${escH(back)}">Cancel</a><button class="btn" type="submit">${button}</button></div></form></section></div>`;
    document.title = title + ' · Investment · Oman Food Capital';
    $('#crumbView').textContent = ' / ' + title;
    syncRail();
  }
  openSheet = function (key, id = null, preset = {}) {
    if (!investmentCanWrite() || investmentBusy || !TRK[key]) return;
    if (!renderingEntryRoute) { investmentNavigate(investmentEntryUrl(key,id,preset)); return; }
    const record = id ? trkRows(key).find(r => (key === 'pipe' ? r.id : r._id) === id) : {
      date: investmentToday(),
      ...(key === 'kyc' || key === 'gate' ? { status: 'Pending' } : {}),
      ...(key === 'pipe' ? {
        stage: 'Screening',
        status: 'Active',
        owner: role.n === 'Group CIO' ? 'CIO' : OWNERS[0],
        value: '',
        ofc: '',
        prob: '',
        prog: 0,
        scr: investmentToday(),
        risk: '',
        rec: ''
      } : {}),
      ...linkedDefaults(key, investmentDeals().find(d => d.id === preset.dealId)),
      ...preset
    };
    if (!record) return;
    if (key === 'pipe' && record.status === 'Handed over to PMO') return toast('This opportunity is now managed in PMO.');
    if (key === 'gate' && id && record.decision) return toast('Recorded decisions are retained in the audit trail. Add a follow-up record.');
    sheetKey = key;
    investmentEditor = {
      kind: 'record',
      key,
      id,
      record: structuredClone(record),
      returnView: view,
      returnParam: param,
      fields: TRK[key].fields,
      touched: new Set()
    };
    investmentShowForm(key === 'pipe' ? id ? 'Edit opportunity' : 'New opportunity' : id ? 'Edit ' + TRK[key].n : 'Add to ' + TRK[key].n, investmentEditor.fields, record, id ? 'Save changes' : key === 'pipe' ? 'Create opportunity' : 'Add to tracker');
  };
  scope.listen(document, 'input', e => {
    if (e.target.closest('#trkForm') && investmentEditor?.touched) investmentEditor.touched.add(e.target.name);
  });
  scope.listen(document, 'change', e => {
    const editor = investmentEditor;
    if (!e.target.closest('#trkForm') || !editor || editor.id || editor.kind !== 'record') return;
    const linkField = editor.key === 'gate' ? 't' : 'deal';
    if (e.target.name !== linkField) return;
    const deal = investmentDeals().find(d => d.t === e.target.value);
    const values = linkedDefaults(editor.key, deal);
    for (const name of ['owner', 'date', 'step', ...(editor.key === 'kyc' ? ['t'] : [])]) {
      const el = e.target.form.elements[name];
      if (!el || editor.touched.has(name)) continue;
      const value = values[name] || '';
      if (el.tagName === 'SELECT' && value && !Array.from(el.options).some(o => o.value === value)) el.add(new Option(value, value));
      el.value = value;
    }
  });
  function investmentLifecycle(id, action) {
    const d = investmentDeals().find(d => d.id === id);
    if (!d || d.status === 'Handed over to PMO' || !investmentCanWrite()) return;
    const labels = {
      Inactive: 'Put on hold',
      Deferred: 'Defer opportunity',
      Declined: 'Decline opportunity',
      Active: 'Reopen opportunity',
      Closed: 'Close opportunity'
    };
    if (!labels[action]) return;
    if (!renderingEntryRoute) { investmentNavigate(investmentEntryUrl('pipe',id,{},action)); return; }
    sheetKey = 'pipe';
    investmentEditor = {
      kind: 'lifecycle',
      id,
      action,
      record: d,
      fields: [managementField('reason', 'Reason / decision record', 'textarea', {
        req: 1,
        full: 1
      }), managementField('next', 'Next action', 'textarea', {
        req: 1,
        full: 1
      }), managementField('date', action === 'Active' ? 'Next target date' : 'Review / effective date', 'date', {
        req: 1
      })]
    };
    investmentShowForm(labels[action] + ' · ' + d.t, investmentEditor.fields, {
      date: d.date || investmentToday(),
      next: d.next
    }, labels[action]);
  }
  function investmentFormError(message) {
    $('#trkErr').textContent = message;
    $('#trkErr').hidden = false;
  }
  function investmentReadForm(form, fields) {
    const d = {};
    for (const f of fields) {
      if (f.type === 'file') continue;
      const el = form.elements[f.k],
        value = el.value.trim();
      el.classList.remove('bad');
      if (f.req && !value || !el.validity.valid || f.type === 'number' && value !== '' && !Number.isFinite(+value)) {
        el.classList.add('bad');
        throw Error('Complete required fields and use values within the displayed limits.');
      }
      d[f.k] = f.type === 'number' && value !== '' ? +value : value;
    }
    return d;
  }
  let investmentFileDb;
  function investmentDb() {
    return investmentFileDb || (investmentFileDb = new Promise((resolve, reject) => {
      const req = indexedDB.open('ofc-investment-files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('files');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
  async function investmentFile(action, id, file) {
    const db = await investmentDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', action === 'get' ? 'readonly' : 'readwrite'),
        store = tx.objectStore('files'),
        req = action === 'put' ? store.put(file, id) : action === 'delete' ? store.delete(id) : store.get(id);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  installGateTwo({scope,editor:()=>investmentEditor,deals:investmentDeals,files:()=>investmentLibrary.files(),fileStore:investmentFile,canWrite:investmentCanWrite,esc:escH});
  async function investmentSubmit(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!investmentEditor || investmentBusy || !investmentCanWrite()) return;
    const editor = investmentEditor,
      form = e.target;
    let uploaded;
    try {
      const d = investmentReadForm(form, editor.fields),
        at = Date.now();
      let changes = {},
        deal,
        note;
      if (editor.kind === 'lifecycle') {
        deal = investmentDeals().find(x => x.id === editor.id);
        if (!deal || deal.status === 'Handed over to PMO') throw Error('The opportunity is now managed in PMO.');
        if (JSON.stringify(deal) !== JSON.stringify(editor.record)) throw Error('This record changed while you were editing. Close and reopen it to use the latest version.');
        const patch = {
          ...recordPatch('ofc-deal-state', deal.id),
          status: editor.action,
          next: d.next,
          date: d.date,
          reason: d.reason,
          at
        };
        changes['ofc-deal-state'] = {
          ...recordOverlay('ofc-deal-state'),
          [deal.id]: patch
        };
        note = `${deal.status} → ${editor.action}: ${d.reason}`;
      } else {
        const key = editor.key,
          current = editor.id ? trkRows(key).find(r => (key === 'pipe' ? r.id : r._id) === editor.id) : null;
        if (editor.id && !current) throw Error('This record is no longer available. Reopen the tracker.');
        if (current && JSON.stringify(current) !== JSON.stringify(editor.record)) throw Error('This record changed while you were editing. Close and reopen it to use the latest version.');
        if (key === 'pipe') {
          if (investmentDeals().some(x => x.id !== editor.id && x.t.trim().toLowerCase() === d.t.toLowerCase())) throw Error('An opportunity with this name already exists.');
          if (d.ofc !== '' && d.value !== '' && d.ofc > d.value) throw Error('OFC requirement cannot exceed the total investment value.');
          if (d.scr && d.date && d.date < d.scr) throw Error('Target date must be on or after the screening date.');
          if (current?.status === 'Handed over to PMO') throw Error('Manage this opportunity in PMO.');
        }
        if (d.start && d.date && d.date < d.start) throw Error('Due date must be on or after the start date.');
        if (key !== 'pipe') {
          deal = investmentDeals().find(x => x.t === (key === 'gate' ? d.t : d.deal));
          if (d.deal && d.deal !== '—' && !deal) throw Error('Select a current opportunity.');
          if (deal) d.dealId = deal.id;
        }
        if(key==='assessment'){
          const draft=editor.gateTwoDraft||editor.record.gateTwoDraft;
          if(draft){
            if((editor.gateTwoDealId||draft.dealId)&&(editor.gateTwoDealId||draft.dealId)!==deal?.id)throw Error('The draft belongs to a different opportunity. Reopen the assessment and generate from the correct documents.');
            d.gateTwoDraft={...draft,sections:draft.sections.map(s=>d[s.key]?.trim()&&d[s.key].trim()!==s.text.trim()?{...s,text:d[s.key].trim(),missing:false,gap:'',edited:true}:s)};
            d.gateTwoEvidence=editor.gateTwoEvidence||editor.record.gateTwoEvidence||'';
            const gaps=gateTwoReviewGaps(d);
            if(d.status==='Completed'&&gaps.length)throw Error('Resolve the Gate 2 evidence gaps before marking Completed: '+gaps.join(', '));
          }
        }
        const file = form.elements.evid?.files[0];
        if (file?.size > 10 * 1024 * 1024) throw Error('Choose evidence no larger than 10 MB.');
        investmentBusy = true;
        form.querySelector('[type=submit]').disabled = true;
        if (file) {
          uploaded = 'FILE-' + crypto.randomUUID();
          await investmentFile('put', uploaded, file);
          Object.assign(d, {
            fileId: uploaded,
            fileName: file.name,
            fileType: file.type
          });
        }
        if (key === 'pipe' && current) {
          deal = {
            ...current,
            ...d
          };
          changes['ofc-deal-state'] = {
            ...recordOverlay('ofc-deal-state'),
            [current.id]: {
              ...recordPatch('ofc-deal-state', current.id),
              ...d,
              at
            }
          };
          // Freeze name-only legacy relationships onto the stable opportunity ID before renaming.
          if (d.t !== current.t) {
            const overlay = recordOverlay('ofc-investment-edits');
            for (const k of TRK_KEYS.filter(k => k !== 'pipe')) for (const r of trkRows(k)) if (r.dealId === current.id) overlay[r._id] = {
              ...overlay[r._id],
              dealId: current.id
            };
            changes['ofc-investment-edits'] = overlay;
          }
          note = 'Opportunity details updated: ' + Object.keys(d).filter(k => String(d[k]) !== String(current[k] ?? '')).map(k => TRK.pipe.fields.find(f => f.k === k)?.l || k).join(', ');
        } else if (current) {
          changes['ofc-investment-edits'] = {
            ...recordOverlay('ofc-investment-edits'),
            [current._id]: {
              ...recordPatch('ofc-investment-edits', current._id),
              ...d,
              at
            }
          };
          note = TRK[key].n + ' updated: ' + (d.t || current.t);
        } else {
          const id = (key === 'pipe' ? 'DEAL-' : 'INV-') + crypto.randomUUID();
          if (key === 'pipe') {
            Object.assign(d, {
              stage: 'Screening',
              status: 'Active'
            });
            deal = {
              ...d,
              id
            };
          }
          const entry = {
            id,
            at,
            app: APP_ID,
            trk: TRK[key].n,
            t: d.t,
            d
          };
          changes['ofc-tracker-entries'] = [entry, ...liveRegister('ofc-tracker-entries')];
          note = key === 'pipe' ? 'New opportunity created' : TRK[key].n + ' added: ' + (d.t || 'Update');
        }
      }
      if (!investmentSave(changes, deal, note, editor.kind === 'record' && editor.key === 'pipe' && !editor.id ? '—' : deal?.stage, deal?.stage)) {
        if (uploaded) await investmentFile('delete', uploaded);
        investmentFormError('Your changes were not saved. Try again when browser storage is available.');
        return;
      }
      investmentBusy = false;
      closeSheet();
      if (editor.kind === 'record' && editor.key === 'pipe') go('tx|' + deal.id);else investmentNavigate(investmentReturnTo(new URLSearchParams(location.search).get('return')));
      toast('Saved. Pipeline, workspace and reports updated.');
    } catch (error) {
      if (uploaded) await investmentFile('delete', uploaded).catch(() => {});
      investmentFormError(error.message || 'Changes could not be saved.');
    } finally {
      investmentBusy = false;
      const button = $('#trkForm [type=submit]');
      if (button) button.disabled = false;
    }
  }
  scope.listen(document, 'submit', e => { if (e.target.id === 'trkForm' && location.pathname === '/investment/entry') investmentSubmit(e); }, true);
  const investmentOriginalCloseSheet = closeSheet;
  closeSheet = function () {
    if (investmentBusy) return;
    investmentOriginalCloseSheet();
    investmentEditor = null;
  };
  function investmentManageButtons(d) {
    if (d.status === 'Handed over to PMO') return '<a class="see" href="/pmo#delivery">Manage in PMO ↗</a>';
    return `<button class="btn ghost sm" data-invest-edit="${escH(d.id)}" data-invest-key="pipe">Edit opportunity</button> ${investmentPaused.has(d.status) ? `<button class="btn ghost sm" data-invest-life="Active" data-invest-deal="${escH(d.id)}">Reopen</button>` : ['Inactive', 'Deferred', 'Declined', 'Closed'].map((a, i) => `<button class="btn ghost sm" data-invest-life="${a}" data-invest-deal="${escH(d.id)}">${['Hold', 'Defer', 'Decline', 'Close'][i]}</button>`).join(' ')}`;
  }
  function pipelineRows() {
    const q = pipelineState.q.toLowerCase();
    return investmentDeals().filter(d => (!q || [d.t, d.id, d.partner, d.sector, d.next, d.owner].join(' ').toLowerCase().includes(q)) && (pipelineState.owner === 'All' || d.owner === pipelineState.owner) && (pipelineState.stage === 'All' || d.stage === pipelineState.stage) && (pipelineState.status === 'All' || (pipelineState.status === 'Live' ? ['Active', 'Approved for next stage'].includes(d.status) : d.status === pipelineState.status))).sort((a, b) => pipelineState.sort === 'value' ? b.value - a.value : pipelineState.sort === 'prob' ? b.prob - a.prob : pipelineState.sort === 't' ? a.t.localeCompare(b.t) : (a.date || '9999').localeCompare(b.date || '9999'));
  }
  function pipelineBody() {
    const rows = pipelineRows();
    if (!rows.length) return '<p class="src">No opportunities match these filters.</p>';
    if (pipelineState.layout === 'board') return `<div class="investment-board">${STEPS.filter(s => rows.some(d => d.stage === s)).map(s => {
      const group = rows.filter(d => d.stage === s);
      return `<section class="investment-lane"><h3>${escH(STEP_LBL[s])} · ${group.length}</h3><p>OMR ${m1(group.reduce((n, d) => n + (+d.value || 0), 0))}m</p>${group.map(d => `<article class="investment-card"><h4>${dealLink(d.t, d.id)}</h4>${pill(d.status)}<p>${escH(d.owner)}<br>Target ${fmtDate(d.date)} · ${d.prob}% probability</p><p>${escH(d.next)}</p><button class="see" data-go="tx|${escH(d.id)}">Manage opportunity ↗</button></article>`).join('')}</section>`;
    }).join('')}</div>`;
    return `<div class="tscroll"><table class="ttbl"><thead><tr>${['Opportunity', 'Stage', 'Status', 'Owner', 'Target', 'Value (OMR m)', 'OFC (OMR m)', 'Probability', 'Next action', ''].map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(d => `<tr><td>${dealLink(d.t, d.id)}<small class="investment-meta">${escH(d.sector)}</small></td><td>${stageCell(d.stage)}</td><td>${pill(d.status)}</td><td>${escH(d.owner)}</td><td>${fmtDate(d.date)}${daysLate(d.date) > 0 && ['Active', 'Approved for next stage'].includes(d.status) ? '<small class="od">Target overdue</small>' : ''}</td><td>${m1(d.value)}</td><td>${m1(d.ofc)}</td><td>${d.prob}%</td><td>${escH(d.next)}</td><td>${d.status === 'Handed over to PMO' ? '<a class="see" href="/pmo#delivery">PMO ↗</a>' : `<button class="btn ghost sm" data-invest-edit="${escH(d.id)}" data-invest-key="pipe">Edit</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function pipelineSelect(key, label, values) {
    return `<label>${label}<select data-pipeline-filter="${key}" aria-label="${label}">${values.map(v => `<option value="${escH(v)}"${pipelineState[key] === v ? ' selected' : ''}>${escH(v)}</option>`).join('')}</select></label>`;
  }
  vPipe = function () {
    const list = investmentDeals(),
      active = list.filter(d => ['Active', 'Approved for next stage'].includes(d.status)),
      total = active.reduce((n, d) => n + (+d.value || 0), 0),
      weighted = active.reduce((n, d) => n + (+d.ofc || 0) * (+d.prob || 0) / 100, 0);
    return `<div class="stack">${vh('Manage Pipeline', 'Create opportunities, assign accountability and progress recorded gate decisions.', `<button class="btn" data-new="pipe">New opportunity</button>` + exportBtn + `<button class="btn ghost sm" data-go="analytics">Analytics</button>`)}<div class="kpi4">${[['Live opportunities', active.length], ['Live value (OMR m)', m1(total)], ['Weighted OFC (OMR m)', m1(weighted)], ['Overdue targets', active.filter(d => d.date && daysLate(d.date) > 0).length]].map(([label, value]) => `<div class="kc"><span class="lbl">${label}</span><span class="val num">${value}</span></div>`).join('')}</div><section class="wp"><div class="investment-filters"><label>Search<input id="pipelineSearch" type="search" placeholder="Opportunity, partner or next action" value="${escH(pipelineState.q)}"></label>${pipelineSelect('owner', 'Owner', ['All', ...new Set(list.map(d => d.owner))])}${pipelineSelect('stage', 'Stage', ['All', ...STEPS])}${pipelineSelect('status', 'Status', ['Live', 'All', ...new Set(list.map(d => d.status))])}<label>Sort<select data-pipeline-filter="sort"><option value="date">Target date</option><option value="value"${pipelineState.sort === 'value' ? ' selected' : ''}>Highest value</option><option value="prob"${pipelineState.sort === 'prob' ? ' selected' : ''}>Highest probability</option><option value="t"${pipelineState.sort === 't' ? ' selected' : ''}>Name</option></select></label><button class="btn ghost sm" data-pipeline-layout="${pipelineState.layout === 'table' ? 'board' : 'table'}">${pipelineState.layout === 'table' ? 'Stage board' : 'Table view'}</button></div><p id="pipelineCount" class="src">${pipelineRows().length} of ${list.length} opportunities</p><div id="pipelineBody">${pipelineBody()}</div></section></div>`;
  };
  function investmentRefreshPipeline() {
    if (!$('#pipelineBody')) return;
    $('#pipelineBody').innerHTML = pipelineBody();
    $('#pipelineCount').textContent = `${pipelineRows().length} of ${investmentDeals().length} opportunities`;
  }
  function investmentEvidence(r) {
    return r.fileId ? `<button class="see" data-invest-file="${escH(r.fileId)}" data-file-name="${escH(r.fileName)}">${escH(r.fileName || 'Download evidence')}</button>` : '';
  }
  function investmentTrackerTable(key, rows) {
    return `<div class="tscroll"><table class="ttbl"><thead><tr><th>Item</th><th>Opportunity</th><th>Owner</th><th>Date</th><th>Status</th><th>Notes / evidence</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${escH(r.t)}</td><td>${escH(r.deal || '—')}</td><td>${escH(r.owner || r.cons || '—')}</td><td>${fmtDate(r.date)}</td><td>${key==='hand'?investmentStatus(r,r.status,'hand'):pill(r.status)}</td><td>${escH(r.next || r.find || r.flags || r.rec || '')}${r.pinVersion ? ` · PIN v${r.pinVersion} <button class="see" data-doc-open="${escH(r.pinDocumentId)}">Open approved document</button>` : ''}${r.fipVersion?` · FIP v${r.fipVersion} <button class="see" data-doc-open="${escH(r.fipDocumentId)}">Open approved FIP</button>`:''}${investmentEvidence(r)}</td><td>${key === 'gate' && r.decision ? '<span class="src">Recorded decision</span>' : `<button class="btn ghost sm" data-invest-edit="${escH(r._id)}" data-invest-key="${key}">Edit</button>`}</td></tr>`).join('') || '<tr><td colspan="7">No records yet.</td></tr>'}</tbody></table></div>`;
  }
  let investmentGateNotice=null;
  function investmentReadiness(d,gate,project,asset) {
    const rows=Object.fromEntries(['assessment','dd','close','hand','gate'].map(k=>[k,trkRows(k).filter(r=>r.dealId===d.id)]));
    const saved=liveRegister('ofc-tracker-entries'),statuses=recordOverlay('ofc-pmo-status');
    for(const [key,name] of Object.entries({commission:'Commissioning Plan Tracker',punch:'Punch List Tracker',handover:'Operations Handover Tracker',closeout:'Project Close-out Checklist',finance:'Financial Closure Tracker'}))
      rows[key]=saved.filter(r=>r.app==='pmo'&&r.trk===name&&r.d?.project===project?.t).map(r=>({...r.d,status:statuses[r.id]||r.d.status}));
    rows.financials=saved.filter(r=>r.app==='am'&&r.trk==='Asset Financial Data'&&r.d?.sub===asset?.n).map(r=>({...r.d,...recordPatch('ofc-am-edits',r.id)}));
    return gateReadiness({gate,deal:d,rows,uploads:investmentLibrary.files().filter(f=>f.dealId===d.id),workflow:liveRegister('ofc-gate-one').find(r=>r.dealId===d.id),documents:liveRegister('ofc-investment-documents'),events:liveRegister('ofc-investment-document-events'),snapshot:investmentDocuments.snapshot(d,'pin'),fipSnapshot:investmentDocuments.snapshot(d,'fip'),asset});
  }
  function investmentGateGuide(d) {
    const project=liveRegister('ofc-live-projects').find(p=>p.dealId===d.id);
    const asset=[...liveRegister('ofc-live-assets'),...liveRegister('ofc-live-asset-status')].find(a=>a.dealId===d.id||(project&&a.projectId===project.projectId));
    const current=currentInvestmentGate(d,project,asset),gate=gateNavigation[current-1];
    const paused=investmentPaused.has(d.status);
    const entry=tracker=>'/investment/entry?'+new URLSearchParams({tracker,opportunity:d.id,return:'/investment#tx|'+d.id});
    const hand=trkRows('hand').filter(r=>r.dealId===d.id),left=hand.filter(r=>r.status!=='Ready').length;
    const readiness=investmentReadiness(d,current,project,asset);
    let next=current===1?{label:'Open Gate 1 workflow',href:'/investment/gate-one?opportunity='+encodeURIComponent(d.id),note:'Prepare documents, overview and research, then review the PIN.'}:current===2?{label:'Prepare assessment',href:entry('assessment'),note:'Review development options and financial assumptions before the EC decision.'}:current===3?(['Closing','Handover'].includes(d.stage)?{label:'Review handover checklist',href:'/investment#trk-hand',note:hand.length?`${left} of ${hand.length} handover items still need readiness review.`:'Add the handover evidence before transferring ownership to PMO.'}:{label:'Review due diligence',href:'/investment#ddd',note:'Check outstanding findings and supporting evidence before recording the next decision.'}):current===4?{label:'Continue in PMO',href:'/pmo#delivery',note:'PMO now owns delivery. Complete commissioning and operations readiness before Gate 5.'}:{label:'Open operating asset',href:'/asset-management#company|'+encodeURIComponent(asset.code)+'|about',note:'Asset Management now owns performance monitoring and follow-up.'};
    if(readiness.next&&!paused)next={label:readiness.next.label,href:readiness.next.href,note:readiness.next.detail};
    return `<section class="wp investment-gate-guide" aria-label="Opportunity gate progress"><div class="gate-guide-heading"><div><p class="gate-eyebrow">INVESTMENT JOURNEY</p><h2>Gate ${current}: ${escH(gate.title)}</h2><p>${escH(gate.purpose)}</p></div><span class="pill neu">${escH(gate.owner)} owns this gate</span></div>${renderGateReadiness(readiness,escH,{compact:true})}<ol class="investment-gate-path" aria-label="Investment lifecycle">${gateNavigation.map(g=>`<li ${g.number===current?'aria-current="step"':''} class="${g.number<current?'earlier':''}"><span>${g.number}</span><div><b>${escH(g.title)}</b><small>${g.number===current?'Current gate':g.number<current?'Earlier stage':'Coming next'}</small></div></li>`).join('')}</ol>${investmentGateNotice?.id===d.id?`<p class="gate-transition-note" role="status">${escH(investmentGateNotice.text)}</p>`:''}<div class="gate-next-card"><div><h3>${paused?'Opportunity paused':'Your next step'}</h3><p>${paused?escH('Current status: '+d.status+'. Reopen the opportunity before recording another gate decision.'):escH(next.note)}</p><small><b>Gate outcome:</b> ${escH(gate.exit)}</small></div>${!paused?`<a class="btn" ${next.href.startsWith('/investment')?'data-invest-nav':''} href="${escH(next.href)}">${escH(next.label)}</a>`:''}</div><div class="investment-actions">${current!==1||paused||next.label!=='Open Gate 1 workflow'?`<a class="see" data-invest-nav href="/investment/gate-one?opportunity=${encodeURIComponent(d.id)}">Open Gate 1 workflow</a>`:''}<a class="see" data-invest-nav href="/investment/documents?opportunity=${encodeURIComponent(d.id)}">Open document library</a><span class="src">Recorded stage: ${escH(STEP_LBL[d.stage]||d.stage)} · ${escH(d.status)}</span></div></section>`;
  }
  function investmentWorkspace(d) {
    return `${investmentGateGuide(d)}${investmentDocuments.panel(d)}<section class="wp"><div class="wp-h"><h2>Manage this opportunity</h2></div><div class="investment-actions">${investmentManageButtons(d)}</div>${d.reason ? `<p><b>Latest decision reason:</b> ${escH(d.reason)}</p>` : ''}</section><section class="wp"><h2>Opportunity records</h2><p class="src">Add work and evidence directly against this opportunity.</p><div class="investment-actions">${['tasks', 'kyc', 'assessment', 'dd', 'close', 'hand', 'meet', 'gate'].map(k => `<button class="btn ghost sm" data-invest-add="${k}" data-invest-deal="${escH(d.id)}">Add ${{
      tasks: 'task',
      kyc: 'KYC',
      assessment: 'assessment',
      dd: 'DD workstream',
      close: 'closing item',
      hand: 'handover item',
      meet: 'meeting',
      gate: 'approval record'
    }[k]}</button>`).join('')}</div>${['tasks', 'kyc', 'assessment', 'dd', 'close', 'hand', 'meet', 'gate'].map(k => {
      const rows = trkRows(k).filter(r => r.dealId === d.id);
      return rows.length ? `<details class="investment-records"${k === 'tasks' ? ' open' : ''}><summary>${TRK[k].n} · ${rows.length}</summary>${investmentTrackerTable(k, rows)}</details>` : '';
    }).join('')}</section><section class="wp"><h2>Activity and decision history</h2>${investmentHistoryTable(investmentMovementRows().filter(r => r.dealId === d.id))}</section>`;
  }
  function investmentHistoryTable(rows) {
    return `<div class="tscroll"><table class="ttbl"><thead><tr><th>Date</th><th>Opportunity</th><th>From</th><th>To</th><th>Activity</th></tr></thead><tbody>${rows.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${dealLink(investmentDeals().find(d => d.id === r.dealId)?.t || r.dealId, r.dealId)}</td><td>${escH(r.from || '—')}</td><td>${escH(r.to || '—')}</td><td>${escH(r.note)}</td></tr>`).join('') || '<tr><td colspan="5">No activity recorded.</td></tr>'}</tbody></table></div>`;
  }
  function investmentStageView(title, subtitle, keys, stages) {
    const list = investmentDeals().filter(d => stages.includes(d.stage)),
      rows = keys.flatMap(k => trkRows(k));
    return `<div class="stack">${vh(title, subtitle, printBtn)}<section class="wp"><h2>Current opportunities</h2>${list.map(d => `<div class="investment-stage-deal"><h3>${dealLink(d.t, d.id)}</h3>${pill(d.status)}<p>${escH(d.owner)} · Target ${fmtDate(d.date)} · OMR ${m1(d.value)}m</p><p>${escH(d.next)}</p><button class="see" data-go="tx|${escH(d.id)}">Manage records and decisions ↗</button></div>`).join('') || '<p>No opportunities currently at this stage.</p>'}</section>${keys.map(k => `<section class="wp"><div class="wp-h"><h2>${TRK[k].n}</h2><button class="btn ghost sm" data-new="${k}">Add record</button></div>${investmentTrackerTable(k, trkRows(k))}</section>`).join('')}</div>`;
  }
  vAssess = () => investmentStageView('In-House Assessment / Pre-Feasibility', 'SG2 · assess strategic fit, financial assumptions and the development option.', ['assessment'], ['EC']);
  vEC = () => investmentStageView('Executive Committee Review', 'SG2 · select a development option or request further due diligence. Record decisions using the gate actions.', ['gate', 'assessment'], ['EC']);
  vDD = () => investmentStageView('Due Diligence / Independent Vetting', 'SG3 · manage workstreams, consultants, findings and unresolved risks.', ['dd'], ['DD']);
  vFID = () => investmentStageView('Final Evaluation & FID', 'SG3 · confirm readiness for execution and record the Board decision.', ['gate', 'dd'], ['Board', 'FID']);
  vClose = () => investmentStageView('Post-FID Legal Closing & PMO Handover', 'SG3 → SG4 · manage closing evidence and mark every handover item Ready before confirming transfer.', ['close', 'hand'], ['Closing', 'Handover']);
  const investmentOriginalTx = vTx;
  vTx = function () {
    const d = investmentDeals().find(d => d.id === (param || 'D01'));
    if (!d) return `<section class="wp"><h2>Opportunity not found</h2><button class="btn" data-go="pipe">Manage pipeline</button></section>`;
    const template = document.createElement('template');
    template.innerHTML = investmentOriginalTx();
    const header = template.content.querySelector('.vh'),
      heading = header.outerHTML;
    header.remove();
    template.content.querySelector('.stepper')?.remove();
    const workspace = investmentWorkspace(d),
      split = workspace.indexOf('</section>') + 10;
    return `<div class="stack">${heading}${workspace.slice(0, split)}${investmentActions()}${template.innerHTML}${workspace.slice(split)}</div>`;
  };
  const investmentOriginalRender = render;
  render = function () {
    investmentHydrate();
    if (investmentCanWrite() && location.pathname !== '/investment') {
      syncRail();
      if (location.pathname === '/investment/entry') { investmentRenderEntryRoute(); return; }
      if (location.pathname === '/investment/gate-one') { gateOne.render(); return; }
      if (location.pathname === '/investment/documents') { investmentLibrary.render(); return; }
      if (location.pathname === '/investment/documents/edit') {
        investmentDocuments.openById(new URLSearchParams(location.search).get('document')); return;
      }
    }
    if (view === 'analytics') {
      investmentOriginalRenderForAnalytics();
      return;
    }
    investmentOriginalRender();
    if (investmentCanWrite() && view === 'home') $('#view').insertAdjacentHTML('afterbegin', '<div class="investment-actions"><button class="btn" data-go="pipe">Manage pipeline</button><button class="btn ghost" data-new="pipe">New opportunity</button><a class="btn ghost" data-invest-nav href="/investment/documents">Documents</a></div>');
  };
  function investmentOriginalRenderForAnalytics() {
    if (!investmentCanWrite()) {
      investmentOriginalRender();
      return;
    }
    $('#view').innerHTML = originalPipelineAnalytics();
    $('#crumbView').textContent = ' / Pipeline Analytics';
    document.title = 'Pipeline Analytics · Investment';
    syncRail();
  }
  const investmentOriginalReport = vRep;
  vRep = function (v) {
    if (v === 'rep-paper') {
      const d = investmentDeals().find(d => d.id === param) || investmentDeals()[0];
      return `<div class="stack">${vh('Investment documents', 'Generate, complete and review a version before submission.', `<select id="paperSel" aria-label="Opportunity">${investmentDeals().map(x => `<option value="${escH(x.id)}"${x.id === d.id ? ' selected' : ''}>${escH(x.t)}</option>`).join('')}</select>`)}${investmentDocuments.panel(d)}</div>`;
    }
    if (v === 'rep-move') return `<div class="stack">${vh(VIEWS[v], 'Baseline movements and recorded activity in this browser', exportBtn + printBtn)}<section class="wp rep-doc" id="repDoc">${investmentHistoryTable(investmentMovementRows())}</section></div>`;
    if (v === 'rep-weekly' || v === 'rep-monthly') {
      const list = live();
      return `<div class="stack">${vh(VIEWS[v], 'Current tracker snapshot · review before circulation', exportBtn + printBtn)}<section class="wp rep-doc" id="repDoc"><p class="lead">${list.length} live opportunities with potential value OMR ${m1(list.reduce((n, d) => n + (+d.value || 0), 0))}m and probability-weighted OFC commitment OMR ${m1(list.reduce((n, d) => n + d.ofc * d.prob / 100, 0))}m.</p>${gateTable()}<h3>Recent activity</h3>${investmentHistoryTable(investmentMovementRows().slice(0, 20))}<h3>Needs attention</h3><ul>${attention().map(a => `<li>${escH(a.t)}</li>`).join('')}</ul></section></div>`;
    }
    if (v === 'rep-cal') {
      const rows = investmentDeals().filter(d => d.date && ['Active', 'Approved for next stage'].includes(d.status)).sort((a, b) => a.date.localeCompare(b.date));
      return `<div class="stack">${vh(VIEWS[v], 'Current opportunity targets and pending approval records', exportBtn + printBtn)}<section class="wp rep-doc" id="repDoc">${rows.map(d => `<p>${fmtDate(d.date)} · ${dealLink(d.t, d.id)} · ${escH(d.stage)} · ${escH(d.next)}</p>`).join('')}<h3>Pending approvals</h3>${investmentTrackerTable('gate', trkRows('gate').filter(r => r.status === 'Pending'))}</section></div>`;
    }
    return investmentOriginalReport(v);
  };
  const investmentOriginalExport = exportView;
  exportView = function () {
    if (!investmentCanWrite()) return;
    if (view === 'pipe') return download('investment-pipeline.csv', [['ID', 'Opportunity', 'Stage', 'Status', 'Owner', 'Target', 'Value OMR m', 'OFC OMR m', 'Probability %', 'Progress %', 'Next action'], ...pipelineRows().map(d => [d.id, d.t, d.stage, d.status, d.owner, d.date, d.value, d.ofc, d.prob, d.prog, d.next])]);
    if (view === 'rep-move') return download('pipeline-movements.csv', [['Date', 'Opportunity', 'From', 'To', 'Activity'], ...investmentMovementRows().map(r => [r.date, investmentDeals().find(d => d.id === r.dealId)?.t || r.dealId, r.from, r.to, r.note])]);
    if (['rep-weekly', 'rep-monthly', 'rep-cal'].includes(view)) return download(view + '.csv', [['Report', 'Content'], [VIEWS[view], $('#repDoc')?.innerText || '']]);
    investmentOriginalExport();
  };
  scope.listen(document, 'click', async e => {
    const b = e.target.closest('[data-invest-edit],[data-invest-life],[data-invest-add],[data-invest-file],[data-pipeline-layout],[data-tdel]');
    if (!b || !investmentCanWrite()) return;
    if (b.dataset.investEdit) {
      openSheet(b.dataset.investKey, b.dataset.investEdit);
      return;
    }
    if (b.dataset.investLife) {
      investmentLifecycle(b.dataset.investDeal, b.dataset.investLife);
      return;
    }
    if (b.dataset.investAdd) {
      const d = investmentDeals().find(d => d.id === b.dataset.investDeal);
      if (d) openSheet(b.dataset.investAdd, null, {
        deal: d.t,
        dealId: d.id,
        owner: d.owner,
        ...(b.dataset.investAdd === 'gate' ? {
          t: d.t,
          step: d.stage
        } : {})
      });
      return;
    }
    if (b.dataset.pipelineLayout) {
      pipelineState.layout = b.dataset.pipelineLayout;
      render();
      return;
    }
    if (b.dataset.investFile) {
      try {
        const blob = await investmentFile('get', b.dataset.investFile);
        if (!blob) throw Error();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = b.dataset.fileName || 'evidence';
        a.click();
        scope.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } catch {
        toast('Evidence is unavailable in this browser. Reattach the source file.');
      }
      return;
    }
  }, true);
  scope.listen(document, 'input', e => {
    if (e.target.id === 'pipelineSearch') {
      pipelineState.q = e.target.value;
      investmentRefreshPipeline();
    }
  });
  scope.listen(document, 'change', e => {
    const key = e.target.dataset.pipelineFilter;
    if (key) {
      pipelineState[key] = e.target.value;
      investmentRefreshPipeline();
    }
  });
  scope.listen($('#gsearch'), 'keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const hits = investmentDeals().filter(d => [d.t, d.id, d.partner].join(' ').toLowerCase().includes(q));
    if (hits.length) {
      e.stopImmediatePropagation();
      if (hits.length === 1) go('tx|' + hits[0].id);else {
        pipelineState.q = e.target.value;
        pipelineState.status = 'All';
        go('pipe');
      }
      e.target.value = '';
    }
  }, true);

  scope.listen(document,'click',e => {
    const a=e.target.closest('a[data-invest-nav]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); investmentNavigate(a.getAttribute('href'));
  });
  const investmentLibrary = createInvestmentLibrary({
    scope,$,escH,read:liveRegister,save:investmentSave,deals:investmentDeals,rows:key=>trkRows(key),
    fileStore:investmentFile,actor:()=>role.n,canWrite:investmentCanWrite,navigate:url=>investmentNavigate(location.pathname==='/investment/gate-one'?'/investment/gate-one?'+new URLSearchParams({opportunity:new URL(url,location.origin).searchParams.get('opportunity')||'',step:'1'}):url),
    header:investmentPageHeader,generated:deal=>investmentDocuments.panel(deal)
  });
  const investmentDocuments = createInvestmentDocuments({
    scope, $, escH, toast, read: liveRegister, save: investmentSave, deals: investmentDeals,
    rows: key => trkRows(key), actor: () => role.n, canWrite: investmentCanWrite,
    uploads: () => investmentLibrary.files(),
    closePanel() { investmentNavigate(investmentReturnTo(new URLSearchParams(location.search).get('return'))); },
    render: () => render(),
    openPanel(title, doc) {
      closeFlyouts(); hidePane(); closeSheet();
      const current=new URLSearchParams(location.search);
      const back=investmentReturnTo(location.pathname==='/investment/documents/edit'?current.get('return'):location.pathname+location.search+location.hash);
      const query=new URLSearchParams({document:doc.id,return:back});
      const url='/investment/documents/edit?'+query;
      if (location.pathname+location.search!==url) history[location.pathname==='/investment/documents/edit'?'replaceState':'pushState'](null,'',url);
      $('#view').innerHTML=`<div class="stack investment-entry-page">${investmentPageHeader(title,['pin','fip'].includes(doc.type)?'Read the report, make any optional edits, then confirm your review.':'Review and save the document version before submitting it.',back)}<section class="wp" id="investmentDocBody"></section></div>`;
      document.title=title+' · Investment · Oman Food Capital';
      $('#crumbView').textContent=['pin','fip'].includes(doc.type)?' / Report review':' / Document editor'; syncRail();
      window.scrollTo({top:0});
    }

  });

  const gateOne = createGateOne({scope,$,escH,read:liveRegister,save:investmentSave,deals:investmentDeals,
    files:()=>investmentLibrary.files(),fileStore:investmentFile,actor:()=>role.n,navigate:investmentNavigate,
    header:investmentPageHeader,library:()=>investmentLibrary,documents:()=>investmentDocuments,
    readiness:d=>renderGateReadiness(investmentReadiness(d,1),escH,{compact:true}),
    actions:d=>['Screening','PIN','CEO'].includes(d.stage)?(GATE_ACTIONS[d.stage]||[]).map((a,i)=>`<button class="btn ghost" data-gate-deal="${escH(d.id)}" data-gate-index="${i}">${escH(a[0])}</button>`).join(''):`<p>Current stage: ${escH(d.stage)}</p>`
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
