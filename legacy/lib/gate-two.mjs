export const gateTwoSections = [
 ['objectives','Investment description and objectives','Describe the proposed investment, scope and objectives. Distinguish company background from the proposal.'],
 ['technicalData','Technical and commercial data','Summarise products, capacity, technology, commercial model and supporting data.'],
 ['scenarios','Investment development scenarios','Describe documented development options and comparisons. Do not invent a selected option.'],
 ['licenses','Regulatory licenses and likely timeline','Identify required licenses, authorities, status and likely timeline where documented. If applicability is unknown, flag it.'],
 ['land','Land allotment confirmation','Identify land, authority and allotment evidence. Existing premises do not prove allotment for this proposal.'],
 ['sales','Sales and marketing study','Summarise demand, competition, customers, pricing, sales channels and marketing evidence.'],
 ['execution','Investment execution strategy','Describe the documented EPC, EPCM, PMC or other execution strategy and responsibilities, where applicable.'],
 ['costPlan','Investment plan and cost estimate','Describe scope, schedule, cost estimate, currency, date, contingency and estimate basis. Confirm whether evidence supports +/- 30% accuracy; never assume it.'],
 ['resourcePlan','Staff, tools and premises','Describe the investment resource plan, including staffing, tools, premises and timing.'],
 ['funding','Shareholding and funding structure','Identify shareholders, proposed ownership, equity and debt funding. Include broad debt terms where supplied. Distinguish existing company funding from proposed financing.'],
 ['projections','Financial projections','Present sourced forecast periods, assumptions, currency and units. Historical accounts are not projections.'],
 ['kpis','Financial KPIs','Present supported NPV, IRR or ROE, with period, valuation basis and assumptions. Do not fabricate metrics or infer project returns from company profits.'],
 ['riskPlan','Risk assessment and mitigation','Describe evidenced risks and mitigation. Assess alignment with the Risk Management Policy only if that policy is supplied; otherwise flag the missing policy.'],
 ['esg','ESG assessment','Summarise environmental, social and governance evidence, applicability, impacts and actions. Distinguish company disclosures from project assessment.'],
 ['exit','Exit strategy','Describe documented exit options, timing, constraints and assumptions, if applicable.'],
].map(([key,title,guidance])=>({key:'g2_'+key,title,guidance}));
export function gateTwoReviewGaps(record){
 if(!record.gateTwoDraft)return [];
 return gateTwoSections.filter(s=>!String(record[s.key]||'').trim() || record.gateTwoDraft.sections?.find(r=>r.key===s.key)?.missing).map(s=>s.title);
}
export const gateTwoMetrics = {
 eq:'Proposed equity requirement in OMR millions',debt:'Proposed debt requirement in OMR millions',share:'Proposed OFC shareholding percent',irr:'Proposed investment equity IRR percent',npv:'Proposed investment NPV in OMR millions',pb:'Proposed investment payback in years',down:'Proposed investment downside IRR percent'
};
