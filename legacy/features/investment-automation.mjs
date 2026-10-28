// Generated records are preparation work, never evidence of approval or completion.
export function linkedDefaults(key, deal) {
  if (!deal) return {};
  return {
    deal: deal.t, dealId: deal.id, owner: deal.owner,
    ...(key === 'gate' ? { t: deal.t, step: deal.stage, status: 'Pending' } : {}),
    ...(key === 'kyc' ? { t: deal.partner || '', status: 'Pending' } : {}),
    ...(['tasks', 'dd', 'hand', 'close'].includes(key) ? { date: deal.date || '', status: 'Not started' } : {}),
  };
}

const tasks = {
  PIN: ['Prepare Project Identification Note', 'Review strategic fit, initial risks and partner information'],
  EC: ['Prepare pre-feasibility report', 'Prepare SG2 value assurance and committee submission'],
  DD: ['Confirm study budget with Finance before consultant appointment', 'Prepare detailed feasibility and due diligence package'],
  Board: ['Prepare final investment proposal and SG3 value assurance'],
  FID: ['Prepare final investment proposal and SG3 value assurance'],
  Closing: ['Review closing requirements and outstanding Board conditions', 'Prepare handover package for PMO'],
};
export const handoverItems = ['FID package', 'Approved scope', 'Approved CAPEX', 'Approved schedule', 'Financial model', 'Feasibility study', 'DD reports', 'Risk register', 'Legal agreements', 'Key commitments', 'Board conditions', 'Handover meeting', 'PMO acceptance'];

export function stageChecklist(deal, stage, existing = []) {
  const items = (tasks[stage] || []).map(t => ({ key: 'tasks', t }));
  if (stage === 'Closing') items.push(...handoverItems.map(t => ({ key: 'hand', t })));
  return items.filter(item => !existing.some(r =>
    r.key === item.key && r.dealId === deal.id &&
    (r.automationKey === `${stage}:${item.key}:${item.t}` || r.t.trim().toLowerCase() === item.t.toLowerCase())
  )).map(({ key, t }) => ({ key, d: {
    ...linkedDefaults(key, deal), t, status: 'Not started',
    ...(key === 'tasks' ? { kind: 'Task', cat: 'Transaction / investors', prio: 'Medium', attn: '—' } : {}),
    ...(t === 'PMO acceptance' ? { owner: 'PMO' } : {}),
    automationKey: `${stage}:${key}:${t}`,
    next: `Created for ${stage}. Review applicability, owner and target date.`,
  } }));
}

export function handoverSnapshot(deal, records, at) {
  return { dealId: deal.id, capturedAt: at, records: records.map(({ key, ...r }) => ({
    key, sourceId: r._id, t: r.t, owner: r.owner || '', date: r.date || '',
    status: r.status || '', next: r.next || r.pend || '', conditions: r.cond || '',
    fileId: r.fileId || '', fileName: r.fileName || '',
  })) };
}
