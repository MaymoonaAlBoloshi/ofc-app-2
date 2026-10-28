export function sectionNeedsEvidence(section) {
  const text=String(section.text||'').trim();
  return section.missing===true || !text || /^(?:Illustrative assessment for this simulated workflow only\.|(?:TODO|TBD|Coming soon|Placeholder)[.!]?$)/i.test(text);
}
export function reportSourceRegister(doc) {
  return reportEvidence(doc.snapshot,doc.type).map(e=>`${e.id}: ${e.title}\n${e.locator}${e.url?'\n'+e.url:''}`).join('\n\n');
}
// Display and export only saved evidence. Never infer company results from a proposed investment.
export function reportEvidence(snapshot, type = 'pin') {
  const entries=[{id:type+'-snapshot',title:'Opportunity record',locator:'Recorded opportunity fields; investment amounts are indicative OMR m',text:JSON.stringify(snapshot.deal)}];
  const add=(title,locator,text,url='')=>entries.push({id:'source-'+entries.length,title,locator,text:String(text||''),url});
  for(const row of snapshot.records){
    const d=row.data;
    if(row.key==='gateOne'){
      if(d.overview)add('Opportunity overview','Saved overview; review status: '+(d.overviewReviewed?'reviewed':'not confirmed'),d.overview);
      if(d.evidence)add('Uploaded document excerpts','File names, pages or sheet references appear in the supplied excerpts. Do not invent a missing locator.',d.evidence);
      let research=[];try{research=JSON.parse(d.research||'[]');}catch{}
      if(Array.isArray(research))for(const r of research)if(r&&r.text)add(r.title||'Research source',`Accessed: ${r.fetchedAt||'not recorded'}. Source date: ${r.asOf||'not supplied'}. ${r.warning||''}`,r.text,r.url||'');
    }else add(d.fileName||d.t||row.key,`${row.key} record ${row.id}; record date: ${d.date||'not supplied'}${row.key==='uploads'?'; file metadata only, not proof of document contents':''}`,JSON.stringify(d));
  }
  return entries;
}
export function reportReferences(doc,section){
  const evidence=reportEvidence(doc.snapshot,doc.type);
  return (section.sourceIds||[]).map(id=>evidence.find(e=>e.id===id)).filter(Boolean).map(e=>`${e.id}: ${e.title}. ${e.locator}${e.url?' '+e.url:''}`);
}
const excerpt=(value,max)=>{const text=String(value||'');return text.length>max?text.slice(0,max).trimEnd()+'… (continued in the detailed sections)':text;};
function summaryText(value,max){
  const text=String(value||'').replace(/^Demonstration assessment\.[^\n]*\n\n/,'').replace(/^Finding:\s*/,'');
  return excerpt(text.split(/\n\s*\n/)[0],max);
}
function riskSummary(section){
  if(!section?.text)return 'Risk assessment and mitigation evidence have not been supplied.';
  const lines=section.text.split('\n').filter(line=>line.trim().startsWith('|'));
  if(lines.length>2)return lines.slice(2,5).map(line=>line.split('|')[1].trim()).join('; ')+'. See the risks and mitigation section for actions and ownership.';
  return summaryText(section.text,350);
}
export function reportBrief(doc){
  const d=doc.snapshot?.deal||{},sections=doc.sections||[];
  const executive=sections.find(s=>s.key==='executive'&&!sectionNeedsEvidence(s))?.text;
  const overview=doc.snapshot?.records?.find(r=>r.key==='gateOne')?.data?.overview;
  const assessments=(doc.snapshot?.records||[]).filter(r=>r.key==='assessment');
  const metrics=[['Indicative total investment',d.value,'OMR m','Opportunity record'],['Indicative OFC requirement',d.ofc,'OMR m','Opportunity record']];
  for(const a of assessments)for(const [key,label,unit] of [['eq','Equity requirement','OMR m'],['debt','Debt requirement','OMR m'],['irr','Equity IRR','%'],['npv','Net present value','OMR m']])metrics.push([label,a.data[key],unit,`${a.data.t||'Assessment'}; as of ${a.data.date||'not supplied'}`]);
  return {
    opportunity:executive&&executive.length<=600?executive.replace(/^Demonstration assessment\.[^\n]*\n\n/,'').replace(/^Finding:\s*/,''):summaryText(overview||sections.find(s=>s.key==='technical'||s.key==='plan')?.text||d.t||doc.title,600),
    decision:doc.type==='pin'?'Decide whether the opportunity should proceed to detailed assessment. Gate 1 is not final investment approval.':'Review the proposed investment and its conditions before recording the Board decision.',
    fit:summaryText(sections.find(s=>s.key==='assurance')?.text||'Strategic fit and the value-assurance recommendation still need assessment.',500),
    risks:riskSummary(sections.find(s=>s.key==='risk')),
    metrics:metrics.slice(0,30).map(([label,value,unit,source])=>({label,value:value!==''&&value!=null&&Number.isFinite(Number(value))?String(value):'Not supplied',unit,source})),
    gaps:sections.filter(sectionNeedsEvidence).map(s=>({title:s.title,detail:s.gap||s.guidance||'Supporting evidence is required.'})),
  };
}
export function validateReportBrief(value){
  if(value==null)return undefined;
  const string=(s,max)=>{if(typeof s!=='string'||s.length>max)throw Error('Invalid report summary.');return s;};
  if(!value||!Array.isArray(value.metrics)||value.metrics.length>30||!Array.isArray(value.gaps)||value.gaps.length>20)throw Error('Invalid report summary.');
  return {opportunity:string(value.opportunity,1600),decision:string(value.decision,500),fit:string(value.fit,1000),risks:string(value.risks,1000),metrics:value.metrics.map(r=>({label:string(r.label,120),value:string(r.value,100),unit:string(r.unit,30),source:string(r.source,500)})),gaps:value.gaps.map(r=>({title:string(r.title,200),detail:string(r.detail,1600)}))};
}
export function renderReportBrief(brief,esc,print=false){
  if(print){
    const metricRows=brief.metrics.slice(2);
    return `<section class="report-brief"><p class="kicker">At a glance</p><h2>Decision summary</h2><p class="brief-intro">${esc(brief.opportunity)}</p><div class="metric-grid">${brief.metrics.slice(0,2).map(m=>`<div class="metric-card"><div class="metric-label">${esc(m.label)}</div><div class="metric-value${m.value==='Not supplied'?' missing':''}">${esc(m.value)}<span class="metric-unit">${esc(m.unit)}</span></div><div class="metric-source">${esc(m.source)}</div></div>`).join('')}</div><p class="financial-note">Indicative proposal amounts. Reference-company operating results are presented separately.</p><div class="recommendation"><h3>Strategic fit and recommendation</h3><p>${esc(brief.fit)}</p></div><div class="brief-columns"><div><h3>Decision requested</h3><p>${esc(brief.decision)}</p></div><div><h3>Main risks</h3><p>${esc(brief.risks)}</p></div></div>${metricRows.length?`<h3>Additional recorded measures</h3><table><thead><tr><th>Measure</th><th>Value</th><th>Unit</th><th>Source / date</th></tr></thead><tbody>${metricRows.map(m=>`<tr><td>${esc(m.label)}</td><td>${esc(m.value)}</td><td>${esc(m.unit)}</td><td>${esc(m.source)}</td></tr>`).join('')}</tbody></table>`:''}<p class="coverage">${brief.gaps.length?`Evidence needed: ${esc(brief.gaps.map(g=>g.title).join('; '))}.`:'Draft coverage is complete. The reviewer must verify the evidence and recommendation.'}</p></section>`;
  }

  return `<section class="full report-brief"><h2>Decision summary</h2><h3>The opportunity</h3><p>${esc(brief.opportunity)}</p><h3>Decision requested</h3><p>${esc(brief.decision)}</p><h3>Strategic fit and recommendation</h3><p>${esc(brief.fit)}</p><h3>Main risks</h3><p>${esc(brief.risks)}</p><h3>Financial facts and assumptions</h3><p>Recorded proposal figures, not the operating results of the reference company or its peers. Missing figures are shown explicitly.</p><div class="tscroll"><table><thead><tr><th>Measure</th><th>Recorded value</th><th>Unit</th><th>Source / record date</th></tr></thead><tbody>${brief.metrics.map(r=>`<tr><td>${esc(r.label)}</td><td>${esc(r.value)}</td><td>${esc(r.unit)}</td><td>${esc(r.source)}</td></tr>`).join('')}</tbody></table></div>${brief.gaps.length?`<h3>Information needed before review can finish</h3><p>${esc(brief.gaps.map(g=>g.title).join('; '))}.</p>${print?'':`<details><summary>What evidence is needed?</summary><ul>${brief.gaps.map(g=>`<li><b>${esc(g.title)}</b><p>${esc(g.detail)}</p></li>`).join('')}</ul></details>`}`:'<p>Draft coverage is complete. The reviewer must verify the evidence and recommendation.</p>'}</section>`;
}
export function renderSectionSources(doc,section,esc){
  const evidence=reportEvidence(doc.snapshot,doc.type),items=(section.sourceIds||[]).map(id=>evidence.find(e=>e.id===id)).filter(Boolean);
  if(!items.length)return '';
  return `<details class="report-section-sources"><summary>Sources for this section</summary><ul>${items.map(e=>{
    let link='';try{const url=new URL(e.url);if(['http:','https:'].includes(url.protocol)&&!url.username&&!url.password)link=` <a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">Open source</a>`;}catch{}
    return `<li><b>${esc(e.id+': '+e.title)}</b><br>${esc(e.locator)}${link}</li>`;
  }).join('')}</ul><small>Check the saved evidence and its dates before relying on a finding.</small></details>`;
}
export function renderReportNarrative(value,esc){
  const labels='Finding|Why it matters|Open questions|Sourced facts|Analyst interpretation|Assumptions|Proposed mitigation';
  const paragraph=part=>{
    const match=part.trim().match(new RegExp('^('+labels+'):\\s*([\\s\\S]*)$'));
    const tone=match?({'Open questions':'question','Assumptions':'question','Proposed mitigation':'action','Why it matters':'insight'}[match[1]]||'fact'):'';
    return match?`<p class="narrative-${tone}"><b>${esc(match[1])}</b><br>${esc(match[2])}</p>`:`<p>${esc(part.trim())}</p>`;
  };
  return String(value||'').replace(/^Demonstration assessment\.[^\n]*\n\n/,'').split(/\n\s*\n/).filter(part=>part.trim()).map(block=>{
    const rows=block.trim().split('\n');
    const cells=row=>row.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
    if(rows.length>=3&&rows.every(row=>row.trim().startsWith('|'))&&cells(rows[1]).every(c=>/^:?-{3,}:?$/.test(c))){
      const headings=cells(rows[0]),body=rows.slice(2).map(cells);
      if(headings.length<=8&&body.every(row=>row.length===headings.length))return `<div class="tscroll report-data-table"><table><thead><tr>${headings.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    return block.split(new RegExp('(?=(?:'+labels+'):)', 'g')).filter(p=>p.trim()).map(paragraph).join('');
  }).join('');
}
