// Only recognise the supplied ONLDC MIS layout. Other layouts need explicit mapping.
export function referenceFinancialNarrative(snapshot){
 const evidence=snapshot.records.find(r=>r.key==='gateOne')?.data?.evidence||'';
 const sheet=evidence.split('Sheet: ').find(s=>s.startsWith('P&L ('));
 if(!sheet)return '';
 const cells=Object.fromEntries([...sheet.matchAll(/(?:^|\n|\|)\s*([A-Z]+\d+):\s*([^|\n]*)/g)].map(m=>[m[1],m[2].trim()]));
 if(!cells.B2?.includes('Omani National Livestock')||cells.D8!=='Budget'||cells.E8!=='Actuals'||cells.D9!=='OMR'||cells.E9!=='OMR'||cells.B14!=='Total Sales'||cells.B55!=='Net Profit After Tax (OMR)')return '';
 const serial=Number(cells.D7);
 if(!Number.isFinite(serial)||serial<40000||serial>60000)return '';
 const date=new Date(Date.UTC(1899,11,30)+serial*86400000);
 const period=date.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'});
 const month=date.toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'}).toUpperCase();
 if(!cells.B3?.toUpperCase().includes(month+' '+date.getUTCFullYear()))return '';
 const values=['D14','E14','D55','E55'].map(k=>cells[k]?.trim()?Number(cells[k]):NaN);
 if(values.some(n=>!Number.isFinite(n)))return '';
 const [budgetSales,sales,budgetProfit,profit]=values;
 const format=n=>n.toLocaleString('en-GB',{minimumFractionDigits:0,maximumFractionDigits:0});
 const delta=sales-budgetSales;
 return `Sourced facts: ONLDC reference-company results for ${period}, OMR, from the uploaded MIS, sheet P&L. These are cached spreadsheet values and have not been recalculated or audited. They are not results of the proposed investment.\n\n| Measure | Actual | Budget | Actual less budget | Source cells |\n| --- | --- | --- | --- | --- |\n| Total sales | ${format(sales)} | ${format(budgetSales)} | ${format(delta)} | E14, D14 |\n| Net profit after tax | ${format(profit)} | ${format(budgetProfit)} | ${format(profit-budgetProfit)} | E55, D55 |\n\nWhy it matters: Reference-company sales are ${format(Math.abs(delta))} OMR ${delta<0?'below':'above'} budget${budgetSales>0?' ('+(Math.abs(delta)/budgetSales*100).toFixed(1)+'%)':''}. This warrants checking volumes, realised prices and product mix. The extract does not establish the cause. Finance should reconcile the figures to the source workbook before using them in assessment. Amounts are rounded to whole OMR; variances use unrounded values.`;
}
