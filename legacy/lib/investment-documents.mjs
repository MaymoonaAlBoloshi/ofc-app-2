import { gateTwoSections } from './gate-two.mjs';
import { validateReportBrief, sectionNeedsEvidence } from './report-presentation.mjs';
import { normalizePinOptions, optionalPinSections } from './pin-options.mjs';
export const documentTypes = {
  pin: 'Project Identification Note (PIN)',
  prefeasibility: 'Pre-feasibility report',
  fip: 'Final investment proposal',
  closure: 'Investment closure report',
  handover: 'Investment handover pack',
};
const section = (key, title, guidance) => ({ key, title, guidance });
export const pinSections = [
  section(
    'sourcing',
    'Opportunity sourcing and conflicts',
    'Identify the source and disclose related-party interests or confirm the result of the conflict review.',
  ),
  section(
    'technical',
    'Technical and commercial overview',
    'Describe the product, technology, capacity and commercial model.',
  ),
  section(
    'partner',
    'Partners and promoters',
    'Describe the partners, their association with the investment and the outcome or gaps in KYC.',
  ),
  section(
    'plan',
    'Development and operations plan',
    'Describe the preliminary development approach, milestones and operating model.',
  ),
  section(
    'market',
    'Market research',
    'Summarise demand, competition and the research sources used.',
  ),
  section(
    'economics',
    'Economic screening',
    'Review high-level costs, funding needs and economics. Identify assumptions and their source.',
  ),
  section(
    'feasibility',
    'Preliminary feasibility and technology',
    'Summarise feasibility findings, technology maturity and unresolved questions.',
  ),
  section(
    'resources',
    'Assessment resources and budget',
    'State the modelling, staff and consultant resources required and the proposed assessment budget.',
  ),
  section(
    'risk',
    'Risks and mitigation',
    'Identify initial risks and the proposed mitigation for each.',
  ),
  section(
    'swot',
    'SWOT and cost-benefit assessment',
    'Assess strengths, weaknesses, opportunities, threats and expected costs and benefits.',
  ),
  section(
    'utilities',
    'Raw materials, land and utilities',
    'Describe supply and availability of materials, land, power, water and gas, or explain why an item is not applicable.',
  ),
  section(
    'assurance',
    'SG1 value assurance and recommendation',
    'Explain the value this investment adds, strategic fit, regulatory and ESG considerations, and the recommendation for the next stage.',
  ),
];
const laterSections = [
  section(
    'plan',
    'Investment objectives and development option',
    'Explain objectives, the selected option and the development and execution plan.',
  ),
  section(
    'market',
    'Market and commercial assessment',
    'Document sales strategy, demand, competition and research sources.',
  ),
  section(
    'feasibility',
    'Technical feasibility and execution',
    'Document the technical approach, cost-estimate maturity, procurement strategy and schedule.',
  ),
  section(
    'economics',
    'Financial assessment and funding',
    'Review costs, funding structure, projections, returns and supporting assumptions.',
  ),
  section(
    'partner',
    'Partners, ownership and due diligence',
    'Review partner credentials, ownership, due diligence and funding commitments.',
  ),
  section(
    'legal',
    'Legal, regulatory and resource readiness',
    'Review agreements, permits, land, utilities and applicable conditions.',
  ),
  section(
    'risk',
    'Risks, ESG and mitigation',
    'Review risk mitigation, ESG findings and stakeholder impacts.',
  ),
  section(
    'resources',
    'Resources, governance and exit strategy',
    'Document staff, study budgets, governance and exit options.',
  ),
  section(
    'assurance',
    'Value assurance and recommendation',
    'Record the stage-specific value-assurance conclusion, open conditions and requested decision.',
  ),
];
export function definitions(type, options) {
  if (type === 'pin') return [...pinSections, ...optionalPinSections(options)];
  if (type === 'prefeasibility') return gateTwoSections;
  if (type === 'fip') return laterSections;
  if (type === 'closure')
    return [
      section(
        'reason',
        'Closure or deferral justification',
        'Explain the decision, alternatives considered and cancellation or deferral reason.',
      ),
      section(
        'economics',
        'Financial position and commitments',
        'Record costs, commitments and remaining liabilities.',
      ),
      section(
        'risk',
        'Outstanding work and risks',
        'Identify outstanding obligations, actions and owners.',
      ),
      section(
        'assurance',
        'Recommendation and approval record',
        'State the requested closure decision and applicable approval authority. Attach the recorded decision when available.',
      ),
    ];
  if (type === 'handover')
    return [
      section(
        'plan',
        'Approved scope and project overview',
        'Confirm the scope, execution plan and ownership being transferred.',
      ),
      section(
        'economics',
        'Budget and funding',
        'Review the approved budget, financial model and funding commitments.',
      ),
      section(
        'legal',
        'Documents and approvals',
        'Review transferred document references and approvals.',
      ),
      section(
        'risk',
        'Conditions and outstanding actions',
        'Identify outstanding conditions, risks, actions, owners and due dates.',
      ),
      section(
        'assurance',
        'Handover review and acceptance',
        'Record the receiving team, handover review and acceptance requirements.',
      ),
    ];
  throw Error('Unknown document type.');
}
const text = (value) => (value == null ? '' : String(value));
const line = (label, value) => (value == null || value === '' ? '' : `${label}: ${value}`);
const join = (items) => items.filter(Boolean).join('\n');
export function sourceSnapshot(deal, records, type) {
  const keys =
    type === 'pin'
      ? ['kyc', 'assessment', 'gateOne', 'uploads']
      : ['kyc', 'assessment', 'dd', 'close', 'hand', 'tasks', 'gate', 'gateOne', 'uploads'];
  const fields = [
    't',
    'partner',
    'sector',
    'type',
    'geo',
    'source',
    'value',
    'ofc',
    'owner',
    'fit',
    'risk',
    'rec',
  ];
  if (type === 'closure') fields.push('reason', 'status', 'next');
  return {
    deal: Object.fromEntries(['id', ...fields].map((k) => [k, deal[k] ?? ''])),
    records: records
      .filter((r) => keys.includes(r.key))
      .map((r) => ({
        key: r.key,
        id: r._id || r.id || '',
        data: Object.fromEntries(
          [
            ...gateTwoSections.map(s=>s.key),
            'gateTwoEvidence',
            't',
            'owner',
            'date',
            'status',
            'ubo',
            'cred',
            'fin',
            'comp',
            'conf',
            'docs',
            'flags',
            'eq',
            'debt',
            'share',
            'irr',
            'npv',
            'pb',
            'find',
            'rec',
            'out',
            'next',
            'cond',
            'pend',
            'fileId',
            'fileName',
            'category',
            'size',
            'overview',
            'evidence',
            'research',
            'overviewReviewed',
            'researchReviewed',
          ]
            .filter((k) => r[k] != null)
            .map((k) => [k, r[k]]),
        ),
      }))
      .sort((a, b) => (a.key + ':' + a.id).localeCompare(b.key + ':' + b.id)),
  };
}
export function generateDocument(type, snapshot, options) {
  const d = snapshot.deal;
  const rows = (key) => snapshot.records.filter((r) => r.key === key).map((r) => r.data);
  const kyc = rows('kyc');
  const assessment = rows('assessment');
  const summaries = (key, fields) =>
    rows(key)
      .map((r) => join([line('Record', r.t), ...fields.map(([k, label]) => line(label, r[k]))]))
      .join('\n\n');
  const content = {
    sourcing: join([
      line('Source', d.source),
      ...kyc.map((r) => line('Recorded conflict review', r.conf)),
    ]),
    partner: join([
      line('Partner', d.partner),
      summaries('kyc', [
        ['status', 'KYC status'],
        ['ubo', 'Ownership'],
        ['cred', 'Credentials'],
        ['comp', 'Compliance'],
        ['flags', 'Concerns'],
      ]),
    ]),
    plan: join([
      line('Sector', d.sector),
      line('Investment type', d.type),
      line('Location', d.geo),
      ...assessment.map((r) => line('Recorded findings', r.find)),
    ]),
    economics: join([
      line('Indicative total investment (OMR m)', d.value),
      line('Indicative OFC requirement (OMR m)', d.ofc),
      summaries('assessment', [
        ['t', 'Assessment'],
        ['eq', 'Equity (OMR m)'],
        ['debt', 'Debt (OMR m)'],
        ['irr', 'IRR (%)'],
        ['npv', 'NPV (OMR m)'],
        ['pb', 'Payback (years)'],
      ]),
    ]),
    risk: join([
      line('Recorded risk rating', d.risk),
      ...assessment.map((r) => line('Recorded risks', r.flags)),
      summaries('dd', [
        ['flags', 'Findings requiring attention'],
        ['out', 'Outstanding items'],
      ]),
      type === 'handover'
        ? summaries('tasks', [
            ['status', 'Status'],
            ['owner', 'Owner'],
            ['date', 'Due'],
            ['next', 'Next action'],
          ])
        : '',
    ]),
    legal:
      summaries('close', [
        ['status', 'Status'],
        ['fileName', 'Document reference'],
      ]) +
      '\n' +
      summaries('gate', [
        ['status', 'Decision'],
        ['cond', 'Conditions'],
        ['pend', 'Pending requirements'],
      ]),
    reason: join([
      line('Recorded decision', d.status),
      line('Reason', d.reason),
      line('Next action', d.next),
    ]),
  };
  const gateOne = rows('gateOne')[0];
  if (gateOne) {
    content.technical = gateOne.overview || '';
    let research = [];
    try {
      research = JSON.parse(gateOne.research || '[]');
    } catch {}
    const sources = research.filter((r) => r.text && r.fetchedAt);
    content.market = sources
      .map((r) => {
        const citation = `${r.title}\nSource: ${r.url}\nAccessed: ${r.fetchedAt}; source date: ${r.asOf || 'Not supplied'}\n${r.warning || ''}`;
        const room = Math.max(
          0,
          Math.floor(5900 / Math.max(1, sources.length)) - citation.length - 45,
        );
        return (
          citation +
          '\n' +
          r.text.slice(0, room) +
          (r.text.length > room ? '\n[Excerpt; full text in source snapshot]' : '')
        );
      })
      .join('\n\n');
  }
  for(const s of gateTwoSections) content[s.key]=assessment.map(r=>r[s.key]).filter(Boolean).join('\n\n');
  content.executive = join([line('Opportunity', d.t), content.technical, content.economics]);
  content.comparison = content.market || '';
  content.financial = content.economics;
  content.riskDetail = content.risk;
  return definitions(type, options).map((s) => ({
    ...s,
    text: text(content[s.key]).trim(),
    reviewed: false,
  }));
}
export function documentStatus(doc, events) {
  return events.find((e) => e.documentId === doc.id)?.status || 'Draft';
}
export function reviewGaps(sections) {
  return sections.filter((s) => sectionNeedsEvidence(s) || !s.reviewed).map((s) => s.title);
}
export function sameSnapshot(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
export function latestDocument(documents, dealId, type) {
  return documents
    .filter((d) => d.dealId === dealId && d.type === type)
    .sort((a, b) => b.version - a.version)[0];
}
export function approvalDocument(documents, events, dealId, snapshot) {
  const doc = latestDocument(documents, dealId, 'pin');
  const expected = doc ? definitions('pin', doc.options) : [];
  if (
    !doc ||
    doc.sections.length !== expected.length ||
    doc.sections.some((s, i) => s.key !== expected[i].key) ||
    documentStatus(doc, events) !== 'Submitted' ||
    reviewGaps(doc.sections).length
  )
    throw Error('Generate, complete, review and submit the PIN before CEO/CIO approval.');
  if (!sameSnapshot(doc.snapshot, snapshot))
    throw Error(
      'The PIN source records changed. Generate a fresh version, review it and submit it again.',
    );
  return doc;
}
export function validatePdfDocument(input) {
  if (
    !input ||
    !Object.hasOwn(documentTypes, input.type) ||
    typeof input.title !== 'string' ||
    input.title.length > 300 ||
    !Number.isSafeInteger(input.version) ||
    input.version < 1 ||
    !['Draft', 'Reviewed', 'Submitted', 'Approved', 'Returned', 'Declined'].includes(input.status)
  )
    throw Error('Invalid document.');
  if (typeof input.sources === 'string' && input.sources.length > 80000)
    throw Error('Source snapshot is too large for PDF export.');
  const options = input.type === 'pin' ? normalizePinOptions(input.options) : undefined;
  const spec = definitions(input.type, options);
  if (!Array.isArray(input.sections) || input.sections.length !== spec.length)
    throw Error('Invalid document sections.');
  return {
    type: input.type,
    ...(input.brief?{brief:validateReportBrief(input.brief)}:{}),
    ...(options ? { options } : {}),
    title: input.title,
    version: input.version,
    status: input.status,
    savedAt: text(input.savedAt).slice(0, 80),
    actor: text(input.actor).slice(0, 120),
    sources: text(input.sources),
    sections: spec.map((s, i) => {
      const item = input.sections[i];
      if (item?.key !== s.key || typeof item.text !== 'string' || item.text.length > 6000)
        throw Error('Invalid document section.');
      const references=item.references||[];
      if(!Array.isArray(references)||references.length>200||references.some(r=>typeof r!=='string'||r.length>1600))throw Error('Invalid document references.');
      return { ...s, text: item.text, missing:item.missing===true, reviewed: item.reviewed === true, references, gap:typeof item.gap==='string'?item.gap.slice(0,1000):'' };
    }),
  };
}

export function sourceSummary(snapshot, workflow = []) {
  const labels = {
    id: 'Reference',
    t: 'Name',
    partner: 'Partner',
    sector: 'Sector',
    type: 'Investment type',
    geo: 'Location',
    source: 'Origination source',
    value: 'Indicative total investment (OMR m)',
    ofc: 'Indicative OFC requirement (OMR m)',
    owner: 'Owner',
    fit: 'Strategic fit rating',
    risk: 'Risk rating',
    rec: 'Recommendation',
    reason: 'Decision reason',
    status: 'Recorded status',
    next: 'Next action',
    date: 'Record date / target',
    ubo: 'Ownership / UBO',
    cred: 'Credentials',
    fin: 'Financial standing',
    comp: 'Compliance',
    conf: 'Conflict review',
    docs: 'Documentation',
    flags: 'Risks / concerns',
    eq: 'Equity (OMR m)',
    debt: 'Debt (OMR m)',
    share: 'Shareholding (%)',
    irr: 'IRR (%)',
    npv: 'NPV (OMR m)',
    pb: 'Payback (years)',
    find: 'Findings',
    out: 'Outstanding information',
    cond: 'Conditions',
    pend: 'Pending requirements',
    fileName: 'Attached document',
    category: 'Document category',
    size: 'File size (bytes)',
    overview: 'Reviewed opportunity overview',
    evidence: 'Document excerpts',
    research: 'Dated supporting research',
    overviewReviewed: 'Overview reviewed',
    researchReviewed: 'Research reviewed',
  };
  const trackers = {
    kyc: 'Partner / KYC',
    assessment: 'Investment assessment',
    dd: 'Due diligence',
    close: 'Legal closing',
    hand: 'Handover',
    tasks: 'Tasks',
    gate: 'Gate decisions',
    uploads: 'Uploaded source document',
    gateOne: 'Gate 1 overview and evidence',
  };
  const describe = (data) =>
    Object.entries(data)
      .filter(([k, v]) => labels[k] && v !== '' && v != null)
      .map(([k, v]) => `${labels[k]}: ${v}`)
      .join('\n');
  return [
    'Opportunity record\n' + describe(snapshot.deal),
    ...snapshot.records.map(
      (r) => `${trackers[r.key] || r.key} (reference ${r.id})\n${describe(r.data)}`,
    ),
    ...(workflow.length
      ? [
          'Review and decision history\n' +
            workflow.map((e) => `${e.status} by ${e.actor} at ${e.at}`).join('\n'),
        ]
      : []),
  ].join('\n\n');
}
