// Bounded, section-aware retrieval. No company-specific facts or generated content.
export const evidenceBudget=48000;
const topics={
 partner:['shareholder','ownership','promoter','board of directors','subsidiar','legal status','beneficial owner','management team'],
 plan:['operations','development','expansion','capacity','production','milestone','operating model'],
 economics:['statement of profit','financial position','cash flow','revenue','profit for the year','budget','funding','capital expenditure'],
 feasibility:['feasibility','technology','equipment','process','technical','throughput','manufacturing'],
 resources:['assessment budget','consultant','adviser','study cost','resources','engagement','due diligence'],
 risk:['risk management','principal risks','mitigation','sensitivity','credit risk','liquidity risk','operational risk'],
 swot:['strength','weakness','opportunit','threat','competition','benefit','challenge'],
 utilities:['raw material','feedstock','feed mill','water','energy','electricity','land','supplier','utilities'],
 assurance:['strategic','recommendation','investment committee','regulatory','governance','sustainability','food security'],
 sourcing:['origination','related part','conflict','investor','proposal'],
 market:['market','demand','customers','sales','competition','export'],
 licenses:['licence','license','permit','regulatory approval','allotment','usufruct'],
 funding:['shareholding','debt financing','interest rate','loan term','financial projection','forecast','net present value','internal rate of return','exit strategy'],
 execution:['epcm','epc contract','procurement','execution strategy','staffing','cost estimate','development scenario','premises'],
 esg:['environmental','social impact','emissions','sustainability','waste management'],
 technical:['principal activities','business model','product','company profile','about us'],
};
export function splitEvidence(text,locator='Excerpt',size=4000){
 const lines=String(text||'').split('\n'),chunks=[];let body='',start=1;
 const heading=lines.slice(0,12).join('\n').slice(0,700);
 for(let i=0;i<lines.length;i++){
  if(body.length+lines[i].length>size&&body){chunks.push({locator:`${locator}; lines ${start} to ${i}`,text:body});body=heading+'\n[continued excerpt]\n';start=i+1;}
  // Bound unusually long CSV/text lines without losing their later portions.
  const line=lines[i];
  if(line.length>size){if(body.trim())chunks.push({locator:`${locator}; before line ${i+1}`,text:body});body='';for(let p=0;p<line.length;p+=size)chunks.push({locator:`${locator}; line ${i+1}, characters ${p+1} to ${Math.min(p+size,line.length)}`,text:heading+'\n'+line.slice(p,p+size)});start=i+2;}
  else body+=line+'\n';
 }
 if(body.trim())chunks.push({locator:`${locator}; lines ${start} to ${lines.length}`,text:body});
 return chunks;
}
function scores(chunk){
 const text=chunk.text.toLowerCase(),heading=text.slice(0,600);
 return Object.values(topics).map(words=>words.reduce((n,w)=>n+(text.includes(w)?1:0)+(heading.includes(w)?2:0),0));
}
export function selectEvidenceChunks(chunks,budget=evidenceBudget){
 const ranked=chunks.filter(c=>c?.text?.trim()).map((c,i)=>({...c,order:i,scores:scores(c)}));
 const chosen=new Set();let size=0;
 const add=c=>{if(!c||chosen.has(c.order))return;const cost=c.text.length+c.locator.length+(c.fileName?.length||0)+80;if(size+cost<=budget){chosen.add(c.order);size+=cost;}};
 // Give every source a chance before selecting additional pages by topic.
 for(const file of new Set(ranked.map(c=>c.fileName||'')))add(ranked.filter(c=>(c.fileName||'')===file).sort((a,b)=>Math.max(...b.scores)-Math.max(...a.scores)||a.order-b.order)[0]);
 for(let round=0;round<3;round++)for(let topic=0;topic<Object.keys(topics).length;topic++){
  const matches=ranked.filter(c=>c.scores[topic]>0).sort((a,b)=>b.scores[topic]-a.scores[topic]||a.order-b.order);
  add(matches[round]);
 }
 for(const c of ranked.sort((a,b)=>b.scores.reduce((x,y)=>x+y,0)-a.scores.reduce((x,y)=>x+y,0)||a.order-b.order))add(c);
 return ranked.filter(c=>chosen.has(c.order)).sort((a,b)=>a.order-b.order).map(({scores,order,...c})=>c);
}
export function mergeDocumentEvidence(documents,budget=evidenceBudget){
 const readable=documents.filter(d=>d.text?.trim());
 const full=readable.map(d=>d.fileName+'\n'+d.text).join('\n\n');
 if(full.length<=budget)return full;
 const candidates=readable.flatMap(d=>(d.chunks?.length?d.chunks:splitEvidence(d.text)).map(c=>({...c,fileName:d.fileName})));
 return selectEvidenceChunks(candidates,budget).map(c=>`SOURCE FILE: ${c.fileName}\n${c.locator}\n${c.text}`).join('\n\n');
}
export function retrieveReportEvidence(evidence,budget=60000){
 if(evidence.reduce((n,e)=>n+e.text.length,0)<=budget)return evidence;
 const chunks=evidence.flatMap(e=>splitEvidence(e.text,e.locator).map(c=>({...c,fileName:e.id,sourceId:e.id})));
 const selected=selectEvidenceChunks(chunks,budget);
 return evidence.map(e=>({...e,text:selected.filter(c=>c.sourceId===e.id).map(c=>c.locator+'\n'+c.text).join('\n\n')})).filter(e=>e.text);
}
