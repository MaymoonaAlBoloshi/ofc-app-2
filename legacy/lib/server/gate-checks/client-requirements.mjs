// Source requirements are separate from executable checks. Untested requirements
// must never inherit a pass from a successful navigation test.
export const clientGateSource = {
  title: 'Food Capital Investment & Asset Management System v2.pdf',
  sha256: '4db55f1050dc01e905aed5ef1258623969860add99bdc335ed30b4f766620f0c',
  path: 'client-data/process-guides/Food Capital Investment & Asset Management System v2.pdf',
};
export const clientGateRequirements = {
  G1: {
    reference: 'Section 2.1, pages 1 to 2',
    requirements: [
      'Initial strategic, market, financial, partner/KYC, regulatory and ESG screening; prepare the PIN and SG1 value assurance.',
      'CEO or equivalent approval of the PIN before SG2.',
      'If abandoned or deferred, retain the PIN, record justification and obtain CIO approval of the investment closure report.',
    ],
  },
  G2: {
    reference: 'Section 2.2, pages 2 to 4',
    requirements: [
      'Prepare pre-feasibility, development options, roadmap, funding structure, projections, financial KPIs, risks and applicable ESG/exit considerations.',
      'Record SG2 value assurance, CEO/CIO review, EC endorsement and the approved budget for further studies.',
      'For abandonment, retain records and prepare a justified closure report after the committee decision.',
    ],
  },
  G3: {
    reference: 'Sections 2.3 and 2.6, pages 4 to 6 and 9 to 10',
    requirements: [
      'Confirm Finance budget availability before external studies or consultant appointment; track procurement where applicable.',
      'Complete feasibility and applicable technical, financial, commercial, partner, ESG and legal diligence; record legal endorsement of agreements.',
      'Prepare the FIP, design basis, execution plan, risk report, permits, funding closure and SG3 value assurance; record IC/Board FID decision.',
      'Track further information, conditional approval, decline and Board-approved deferral/abandonment with closure report and register update.',
    ],
  },
  G4: {
    reference: 'Section 2.4, pages 7 to 8; section 5, page 13',
    requirements: [
      'Track design, procurement, construction, commissioning, performance tests and financial closure.',
      'Agree handover procedures before commissioning; include equipment boundaries, checklists, acceptance criteria, certificates, warranties, milestones and risks.',
      'Record SG4 readiness, formal operations acceptance and transfer of documents, approvals, history and ownership.',
      'Close out outstanding items, operational documents, surplus materials, invoices/claims and contracts; close budget, prepare cost report and obtain closure-report approval.',
    ],
  },
  G5: {
    reference: 'Section 2.5, page 8; sections 6.3 to 6.5, pages 14 to 15',
    requirements: [
      'Operate against specifications and monitor financial, operational, strategic and risk performance.',
      'Prepare a post-implementation review (PIR), compare actual benefits with the value proposition and record/disseminate lessons learned.',
      'Record Project Assurance site verification and submit PIR to management for review.',
      'Track periodic reviews, quarterly committee reporting and board representation.',
    ],
  },
};
export function createClientReview(id) {
  return {
    ...clientGateRequirements[id],
    status: 'not-tested',
    findings: [],
    remaining:
      'Full deliverable contents, applicable exceptions, approval authority and alternative decision paths are not verified by this run.',
  };
}
