import {gateTwoSections,gateTwoMetrics} from '../lib/gate-two.mjs';
import {mergeDocumentEvidence} from '../lib/source-retrieval.mjs';
import {sourceSnapshot} from '../lib/investment-documents.mjs';
import {reportEvidence} from '../lib/report-presentation.mjs';

export function gateTwoControls(){
 return `<section class="full wp"><h2>Prepare Gate 2 from documents</h2><p>Siraaj reads this opportunity's uploaded documents and drafts the 15 assessment topics and supported financial figures below. Scores and the final recommendation remain reviewer judgments. Review the evidence, edit the draft and resolve missing information before completing the assessment.</p><button class="btn ghost" type="button" data-gate-two-generate>Draft from uploaded documents</button><p data-gate-two-status role="status" aria-live="polite"></p><p>Existing entries are preserved. Clear a topic before generating if you want a new draft for it.</p></section>`;
}
export function gateTwoField(field,record,esc){
 const row=record.gateTwoDraft?.sections?.find(s=>s.key===field.k);
 return `<details class="full gate-two-topic" ${field.k==='g2_objectives'?'open':''}><summary>${esc(field.l)}${row?.missing?' · Evidence needed':''}</summary><label><span>${esc(field.l)}</span><textarea name="${field.k}" rows="5" maxlength="5800">${esc(record[field.k]||'')}</textarea></label><p>${esc(gateTwoSections.find(s=>s.key===field.k).guidance)}</p><div data-gate-two-evidence="${field.k}">${gateTwoEvidence(row,record.gateTwoDraft?.catalogs?.[row?.generation]||record.gateTwoDraft?.sources||[],esc)}</div></details>`;
}
function gateTwoEvidence(row,sources,esc){
 if(!row)return '';
 return `${row.gap?`<p class="err">Evidence needed: ${esc(row.gap)}</p>`:''}<details><summary>Sources and draft review</summary>${(row.sourceIds||[]).map(id=>{const source=sources.find(s=>s.id===id);return source?`<p><b>${esc(source.title)}</b><br>${esc(source.locator)}</p><pre class="gate-source">${esc(source.text)}</pre>`:'';}).join('')}<p>Check the cited file, page, date and units. If you resolve a gap through an edit, include the supporting evidence in the revised text.</p></details>`;
}
export function installGateTwo({scope,editor,deals,files,fileStore,canWrite,esc}){
 let busy=false;
 scope.listen(document,'click',async event=>{
  const button=event.target.closest('[data-gate-two-generate]');if(!button||busy||!canWrite())return;
  const state=editor(),form=button.closest('form'),status=form.querySelector('[data-gate-two-status]');
  const deal=deals().find(d=>d.t===form.elements.deal.value);
  if(!deal){status.textContent='Select an opportunity first.';return;}
  const uploads=files().filter(f=>f.dealId===deal.id);
  if(!uploads.length){status.textContent='Upload the supporting documents for this opportunity first.';return;}
  if(uploads.length>10){status.textContent='This draft reads up to ten files. Consolidate the supporting documents before generating.';return;}
  const originalValues=Object.fromEntries([...gateTwoSections.map(s=>s.key),...Object.keys(gateTwoMetrics),'find','flags','out','t'].map(key=>[key,form.elements[key].value]));
  const fingerprint=()=>JSON.stringify(files().filter(f=>f.dealId===deal.id));const initialFiles=fingerprint();
  busy=true;button.disabled=true;status.textContent='Reading uploaded documents. This can take a minute.';
  const request=async(url,body)=>{const response=await scope.fetch(url,{method:'POST',headers:body instanceof Blob?{}:{'Content-Type':'application/json'},body:body instanceof Blob?body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.error||'Draft generation failed.');return data;};
  try{
   const extracted=[],warnings=[];
   for(const file of uploads){
    try{const blob=await fileStore('get',file.fileId);if(!blob)throw Error('File unavailable in this browser');const result=await request('/api/gate-one?action=extract&name='+encodeURIComponent(file.fileName),blob);extracted.push({...result,fileName:file.fileName});if(result.warning)warnings.push(file.fileName+': '+result.warning);}
    catch(error){warnings.push(file.fileName+': '+error.message);}
   }
   const evidence=mergeDocumentEvidence(extracted);
   if(!evidence)throw Error('No readable document text was found. Upload readable files or provide OCR text.');
   const snapshot=sourceSnapshot(deal,[{key:'gateOne',id:'gate-two-uploads',evidence}], 'prefeasibility');
   status.textContent='Siraaj is drafting the 15 assessment topics from the documents.';
   const result=await request('/api/investment-documents/draft',{type:'prefeasibility',snapshot});
   if(result.method!=='siraaj')throw Error('Siraaj could not produce a validated draft. Your entries have been preserved. Please try again.');
   if(!form.isConnected||editor()!==state)return;
   if(!canWrite()||form.elements.deal.value!==deal.t||fingerprint()!==initialFiles)throw Error('The opportunity or its documents changed. Generate again from the current files.');
   const sources=reportEvidence(snapshot,'prefeasibility');
   const previous=state.gateTwoDraft||state.record.gateTwoDraft;
   const applied=[],generation=new Date().toISOString();
   for(const row of result.sections){
    const input=form.elements[row.key];
    if(!input||originalValues[row.key].trim()||input.value!==originalValues[row.key])continue;
    input.value=row.text;applied.push(row);
    form.querySelector(`[data-gate-two-evidence="${row.key}"]`).innerHTML=gateTwoEvidence(row,sources,esc);
    const topic=input.closest('details');topic.open=false;topic.querySelector('summary').textContent=gateTwoSections.find(s=>s.key===row.key).title+(row.missing?' · Evidence needed':'');
   }
   // Keep each generation's source catalog with its section, so preserved edits retain provenance.
   state.gateTwoDraft={method:'siraaj',at:new Date().toISOString(),sections:[...(previous?.sections||[]).filter(s=>!applied.some(r=>r.key===s.key)),...applied.map(s=>({...s,generation}))],catalogs:{...previous?.catalogs,[generation]:sources}};
   const byKey=key=>result.sections.find(s=>s.key===key)?.text||'';
   const summaries={t:'Document-based Gate 2 assessment',find:[byKey('g2_objectives'),byKey('g2_scenarios')].filter(Boolean).join('\n\n'),flags:byKey('g2_riskPlan'),out:result.sections.filter(s=>s.missing).map(s=>gateTwoSections.find(d=>d.key===s.key).title+': '+s.gap).join('\n')};
   for(const [key,value] of Object.entries(summaries)){const input=form.elements[key];if(input&&!originalValues[key].trim()&&input.value===originalValues[key])input.value=value;}
   state.gateTwoDraft.dealId=deal.id;
   state.gateTwoDraft.metrics={...previous?.metrics};
   for(const [key,metric] of Object.entries(result.metrics||{})){
    const input=form.elements[key];if(!input||originalValues[key]?.trim()||input.value!==originalValues[key])continue;
    input.value=metric.value;state.gateTwoDraft.metrics[key]={...metric,generation};
   }
   state.gateTwoEvidence=evidence;
   state.gateTwoDealId=deal.id;
   status.textContent=`Drafted ${applied.length} topics. Review and edit them, then save the assessment. ${warnings.join(' ')}`;
  }catch(error){if(form.isConnected)status.textContent=error.message;}
  finally{busy=false;button.disabled=false;}
 });
}
