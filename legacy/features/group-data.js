/* Shared "ERP-type" facts: figures a real ERP/GL feed would ultimately
   supply, rather than something a department tracker collects. Every app
   that needs one of these reads it from here instead of retyping it, so
   the same fact can't drift into two different values across apps.
   Sample data for the demo; consistent across Finance & Accounts,
   Treasury, Strategy, Corporate and Asset Management. */

/* Group P&L actuals vs budget, OMR m, Jan-Aug 2026 (two illustrative
   subsidiaries used on the revenue/EBITDA trend charts). */
const REV_A=[18.9,19.4,20.8,21.6,19.9,20.1,20.4,21.3], REV_B=[20.4,20.6,21.2,21.8,21.0,21.4,22.0,22.4];
const EB_A=[2.2,2.3,2.6,2.8,2.3,2.4,2.4,2.7], EB_B=[2.6,2.6,2.8,2.9,2.7,2.8,3.0,3.0];

/* Subsidiary revenue/budget/EBITDA, OMR m, August 2026 YTD.
   [code, status, revenue actual, revenue budget, EBITDA actual] */
const SUBS=[['A','Operating',34.6,35.2,5.8],['B','Operating',27.8,28.9,3.9],['C','Operating',22.4,23.1,4.1],['E','Operating',16.9,18.4,2.4],['F','Operating',14.2,14.0,2.0],['G','Operating',12.1,13.0,1.3],['H','Operating',9.8,10.2,1.7],['I','Operating',8.6,8.9,1.4],['J','Operating',6.7,7.4,0.9],['K','Operating',5.9,7.8,-0.4],['L','Operating',4.3,4.1,0.8],['M','Operating',3.6,3.8,0.6],['N','Operating',2.2,2.6,-0.3],['O','Operating',1.3,1.4,-0.2],['D','Execution (SG4)',0,0,-0.9],['P','Pre-operational',0,0,-0.6],['Q','Pre-operational',0,0,-0.4]].map(s=>({code:s[0],n:'Subsidiary '+s[0],st:s[1],rev:s[2],bud:s[3],eb:s[4]}));

/* The five open corporate decisions, from OFC's current build. Dates are
   ISO so callers format them with fmtDate() themselves. */
const DECISIONS=[
  {id:'INT-005',t:'Intolerable risk — Monitoring & Reporting controls',dept:'GRC',by:'Chief Risk Officer',forum:'Audit & Risk Committee',date:'2026-09-05',s:'Escalated'},
  {id:'INT-003',t:'Subsidiary D mobilization delay',dept:'Investment',by:'PMO',forum:'Transformation Committee',date:'2026-09-10',s:'Escalated'},
  {id:'INT-001',t:'Al Jazir FID financing timeline slippage',dept:'Investment',by:'CIO',forum:'BEC',date:'2026-09-15',s:'Pending'},
  {id:'INT-004',t:'Group ERP vendor selection deadlock',dept:'Corporate Support',by:'CFO',forum:'EC',date:'2026-09-20',s:'Pending'},
  {id:'INT-002',t:'AAAID consideration price (ABMC/ANPC)',dept:'Investment',by:'CIO',forum:'Divestment Committee',date:'2026-09-30',s:'Pending'}
];

export {REV_A,REV_B,EB_A,EB_B,SUBS,DECISIONS};
