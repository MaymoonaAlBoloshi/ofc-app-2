export const gateNavigation = [
  {number:1,title:'Origination',owner:'Investment',purpose:'Understand the opportunity and the value it could add.',exit:'Reviewed PIN and CEO/CIO approval.'},
  {number:2,title:'Assessment',owner:'Investment',purpose:'Assess the development option, funding and commercial case.',exit:'Assessment and EC decision to proceed.'},
  {number:3,title:'Due diligence and FID',owner:'Investment',purpose:'Resolve due diligence, record the Board decision and prepare handover.',exit:'Closing evidence and ready handover items.'},
  {number:4,title:'Execution',owner:'PMO',purpose:'Deliver the project and confirm readiness for operations.',exit:'Commissioning, defect closure and operations acceptance.'},
  {number:5,title:'Operations',owner:'Asset Management',purpose:'Monitor performance, financial results and value creation.',exit:'Ongoing performance review and follow-up.'},
];
export function currentInvestmentGate(deal,project,asset){
  if(asset)return 5;
  if(project)return 4;
  if(['Screening','PIN','CEO'].includes(deal.stage))return 1;
  if(deal.stage==='EC')return 2;
  return 3;
}
