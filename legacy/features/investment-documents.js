import { sectionNeedsEvidence, reportSourceRegister, reportBrief, renderReportBrief, reportReferences, renderSectionSources, renderReportNarrative } from '../lib/report-presentation.mjs';
import { pinAdditions, normalizePinOptions } from '../lib/pin-options.mjs';
import { documentTypes, pinSections, sourceSummary, sourceSnapshot, generateDocument, documentStatus, reviewGaps, sameSnapshot, latestDocument, approvalDocument } from '../lib/investment-documents.mjs';

export function createInvestmentDocuments({scope, $, escH, toast, read, save, deals, rows, actor, canWrite, openPanel, closePanel, render, uploads = () => []}) {
  const key = 'ofc-investment-documents', eventKey = 'ofc-investment-document-events';
  let editor = null, generating = false;
  const records = deal => ['kyc','assessment','dd','close','hand','tasks','gate'].flatMap(key => rows(key).filter(r => r.dealId === deal.id).map(r => ({...r,key})));
  const snapshot = (deal,type) => sourceSnapshot(deal,[...records(deal),...read('ofc-gate-one').filter(r=>r.dealId===deal.id).map(r=>({...r,key:'gateOne',evidence:r.sourceText||'',research:JSON.stringify(r.research),overview:r.overview})),...uploads().filter(r=>r.dealId===deal.id).map(r=>({...r,_id:r.id,t:r.title||r.fileName,key:'uploads'}))],type);
  const documents = () => read(key);
  const events = () => read(eventKey);
  const status = doc => documentStatus(doc,events());
  const event = (doc,status) => ({id:crypto.randomUUID(),documentId:doc.id,dealId:doc.dealId,version:doc.version,status,actor:actor(),at:new Date().toISOString()});
  function pinChoices(deal) {
    const options=normalizePinOptions(latestDocument(documents(),deal.id,'pin')?.options);
    const draft=generateDocument('pin',snapshot(deal,'pin'));
    return `<div class="pin-report-choices"><h3>What would you like in the PIN?</h3><p>All required sections are included. Choose any additional coverage, then generate the draft from your saved documents, overview and research.</p><details><summary>12 required sections included</summary><fieldset><legend>Required PIN sections</legend><div class="pin-required-sections">${pinSections.map(s=>`<label><input type="checkbox" checked disabled> <span>${escH(s.title)}<small>${draft.find(r=>r.key===s.key)?.text?'Recorded facts available; review needed':'More evidence or assessment needed'}</small></span></label>`).join('')}</div></fieldset></details><fieldset><legend>Optional additions</legend>${pinAdditions.map(s=>`<label><input type="checkbox" data-pin-option="${s.key}" ${options.additions.includes(s.key)?'checked':''}> ${escH(s.title)}</label>`).join('')}</fieldset><details ${options.additionalRequirements?'open':''}><summary>Add a specific requirement (optional)</summary><label class="pin-additional">Additional requirements<textarea data-pin-additional rows="3" maxlength="1500" placeholder="For example: explain the water supply risks using the uploaded feasibility study.">${escH(options.additionalRequirements)}</textarea><small>Use this space for a specific question or topic.</small></label></details><p class="src">Siraaj uses the saved source evidence to draft the selected report. Check its facts before submitting it for approval.</p><p data-pin-message role="status" aria-live="polite"></p></div>`;
  }
  function panel(deal,onlyType) {
    const docs = documents().filter(d => d.dealId === deal.id && (!onlyType||d.type===onlyType));
    return `<section class="wp" data-document-panel><h2>Generated investment documents</h2><p>Drafts use the recorded opportunity information. Complete missing sections and review the evidence before submission. Saved versions are retained in this browser.</p>${!onlyType||onlyType==='pin'?pinChoices(deal):''}<div class="investment-actions">${Object.entries(documentTypes).filter(([type])=>!onlyType||type===onlyType).map(([type,label]) => `<button class="btn ghost sm" data-doc-generate="${type}" data-doc-deal="${escH(deal.id)}">Generate ${escH(label)}</button>`).join('')}</div>${docs.length ? `<div class="tscroll"><table class="ttbl"><thead><tr><th>Document</th><th>Version</th><th>Status</th><th>Prepared by</th><th></th></tr></thead><tbody>${docs.map(doc => `<tr><td>${escH(documentTypes[doc.type])}</td><td>${doc.version}</td><td>${escH(status(doc))}</td><td>${escH(doc.actor)}</td><td><button class="see" data-doc-open="${doc.id}">Open version ${doc.version}</button></td></tr>`).join('')}</tbody></table></div>` : '<p>No saved documents yet.</p>'}</section>`;
  }
  function persist(deal,doc,note) {
    return save({[key]:[doc,...documents()]},deal,note);
  }
  function newDocument(deal,type,sections,snap,options,generation) {
    return {id:crypto.randomUUID(),dealId:deal.id,type,title:deal.t,version:(latestDocument(documents(),deal.id,type)?.version || 0)+1,...(type==='pin'?{options:normalizePinOptions(options)}:{}),...(generation?{generation}:{}),sections,snapshot:snap,savedAt:new Date().toISOString(),actor:actor()};
  }
  function open(doc) {
    const deal=deals().find(d => d.id === doc.dealId);
    if (!deal) {$('#view').innerHTML='<section class="wp"><h2>Document unavailable</h2><a href="/investment/documents">Open document library</a></section>';return;}
    editor={id:doc.id,latestId:latestDocument(documents(),doc.dealId,doc.type)?.id};
    const latest=editor.latestId===doc.id;
    const stale=!sameSnapshot(doc.snapshot,snapshot(deal,doc.type));
    const gaps=reviewGaps(doc.sections);
    openPanel(documentTypes[doc.type] + ': ' + doc.title, doc);
    const pin=doc.type==='pin',report=pin||doc.type==='fip';
    const reportSections=doc.sections.map((s,i)=>report?`<article class="full pin-report-section" data-report-section="${s.key}"><h3>${i+1}. ${escH(s.title)}</h3><div class="pin-report-copy" data-doc-preview="${s.key}">${renderReportNarrative(s.text||s.gap||s.guidance||'Evidence needed before review.',escH)}</div>${s.gap&&s.text.trim()?`<p class="full"><b>Outstanding evidence</b><br>${escH(s.gap)}</p>`:''}${renderSectionSources(doc,s,escH)}<details class="pin-section-edit"><summary>${latest?'Edit this section (optional)':'View saved text'}</summary><label>${escH(s.title)}${s.missing&&s.text.trim()?'<small>Resolve the outstanding evidence in your revised text before confirming review. Alternatively, upload the missing evidence and regenerate.</small>':''}<textarea rows="5" maxlength="6000" data-doc-text="${s.key}" ${!latest?'readonly':''}>${escH(s.text)}</textarea></label></details></article>`:`<div class="full"><label><span>${i+1}. ${escH(s.title)}</span><small>${escH(s.guidance)}</small><textarea rows="4" maxlength="6000" data-doc-text="${s.key}" ${!latest?'readonly':''}>${escH(s.text)}</textarea></label><label><input type="checkbox" data-doc-check="${s.key}" ${s.reviewed?'checked':''} ${!latest?'disabled':''}> Reviewed and complete</label></div>`).join('');
    const missing=doc.sections.filter(sectionNeedsEvidence);
    $('#investmentDocBody').innerHTML=`<form class="pform" id="investmentDocForm"><div class="full"><b>Version ${doc.version} · ${escH(status(doc))}</b><p>Read the report below. Open a section editor only if you need to change its content.</p>${doc.generation?.notice?`<p>${escH(doc.generation.notice)}</p>`:''}${stale?'<p class="err">Source records have changed. Generate a fresh draft before review or submission.</p>':''}${!latest?'<p>This is a retained historical version. Open the latest version to make changes.</p>':''}${report?(missing.length?`<p class="err">Evidence needed in ${missing.length} section(s): ${escH(missing.map(s=>s.title).join(', '))}. Add supporting documents or correct the affected sections before completing this review.</p>`:['Reviewed','Submitted','Approved'].includes(status(doc))?'<p>This saved report has been reviewed. Its review and approval history is available below.</p>':'<p>All sections contain draft content. Check the facts, sources and conclusions before confirming your review.</p>'):`<p>${gaps.length} sections need content or review.</p>`}</div>${report?renderReportBrief(reportBrief(doc),escH):''}${reportSections}<details class="full"><summary>Report choices and sources</summary>${pin?`<p>All 12 required PIN sections included.</p><p>${escH(pinAdditions.filter(s=>doc.options?.additions?.includes(s.key)).map(s=>s.title).join(', ')||'No optional additions')}</p>${doc.options?.additionalRequirements?`<p>Additional requirements: ${escH(doc.options.additionalRequirements)}</p>`:''}`:''}<p>Saved ${escH(doc.savedAt)} by ${escH(doc.actor)}.</p><pre class="gate-source">${escH(sourceSummary(doc.snapshot))}</pre></details><details class="full"><summary>Review and decision history</summary><ul>${events().filter(e=>e.documentId===doc.id).map(e=>`<li>${escH(e.status)} by ${escH(e.actor)} at ${escH(e.at)}</li>`).join('')||'<li>No review or decision recorded.</li>'}</ul></details><p class="err full" id="investmentDocError" role="alert" hidden></p>${report&&latest&&(pin?!['Submitted','Approved'].includes(status(doc)):status(doc)==='Draft')?'<label class="full pin-report-confirm"><input type="checkbox" id="pinReportConfirmed"> I have reviewed the full report and checked its facts, sources and conclusions.</label>':''}${doc.type==='fip'&&status(doc)==='Reviewed'?`<p class="full gate-transition-note">Review saved. Return to the opportunity to record the Board decision.</p>`:''}<div class="full investment-actions">${latest?`<button class="btn ghost" type="button" data-doc-action="save">Save edits as a new version</button>${pin?(!['Submitted','Approved'].includes(status(doc))?'<button class="btn" type="button" data-doc-action="review-submit">Confirm review and submit</button>':''):`${report&&status(doc)!=='Draft'?'':`<button class="btn" type="button" data-doc-action="${report?'confirm-review':'review'}" ${status(doc)!=='Draft'?'disabled':''}>${report?'Confirm review':'Mark reviewed'}</button>`}`}`:''}${doc.type==='fip'&&status(doc)==='Reviewed'?`<a class="btn" data-invest-nav href="/investment#tx|${encodeURIComponent(doc.dealId)}">Continue to gate decision</a>`:''}<button class="btn ghost" type="button" data-doc-action="evidence">Download evidence appendix</button><button class="btn ghost" type="button" data-doc-action="pdf">Download saved PDF</button><button class="btn ghost" type="button" data-doc-action="close">Back to previous page</button></div><p class="src full">Reports may include demo data. Report review is recorded separately from the approval decision.</p></form>`;

  }
  function error(message) { const el=$('#investmentDocError'); if (el) {el.hidden=false;el.textContent=message;} else toast(message); }
  function readSections(doc) {
    return doc.sections.map(s => ({...s,text:$(`[data-doc-text="${s.key}"]`).value.trim(),...(s.missing===true&&$(`[data-doc-text="${s.key}"]`).value.trim()!==s.text?{missing:false,gap:''}:{}),reviewed:$(`[data-doc-check="${s.key}"]`)?.checked??($(`[data-doc-text="${s.key}"]`).value.trim()===s.text?s.reviewed:false)}));
  }
  scope.listen(document,'input',e => {
    if (e.target.dataset.docText) {
      const check=$(`[data-doc-check="${e.target.dataset.docText}"]`);if(check)check.checked=false;
      const preview=$(`[data-doc-preview="${e.target.dataset.docText}"]`);if(preview)preview.innerHTML=renderReportNarrative(e.target.value||'Evidence needed before submission.',escH);
      if($('#pinReportConfirmed'))$('#pinReportConfirmed').checked=false;
    }
  });
  scope.listen(document,'submit',e => {if(e.target.id==='investmentDocForm') {e.preventDefault();e.stopImmediatePropagation();}},true);
  scope.listen(document,'click',async e => {
    const b=e.target.closest('[data-doc-generate],[data-doc-open],[data-doc-action]');
    if(!b || !canWrite()) return;
    if(b.dataset.docGenerate) {
      const deal=deals().find(d=>d.id===b.dataset.docDeal);
      if(!deal) return;
      const state=read('ofc-gate-one').find(r=>r.dealId===deal.id);
      if(b.dataset.docGenerate==='pin' && (state||location.pathname==='/investment/gate-one') && (!state?.overviewReviewed||!state?.researchReviewed||JSON.stringify(state?.uploadIds)!==JSON.stringify(uploads().filter(r=>r.dealId===deal.id).map(r=>r.fileId).sort())||!uploads().some(r=>r.dealId===deal.id))) {toast('Complete and review Gate 1 documents, overview and research first.');return;}
      if(generating)return;
      const type=b.dataset.docGenerate,snap=snapshot(deal,type),lastId=latestDocument(documents(),deal.id,type)?.id;
      const container=b.closest('[data-document-panel]'),message=container?.querySelector('[data-pin-message]');
      const originalLocation=location.href,buttonLabel=b.textContent;
      try {
        generating=true;b.disabled=true;
        let sections=generateDocument(type,snap),options,generation;
        if(['pin','fip','prefeasibility'].includes(type)) {
          options=type==='pin'?normalizePinOptions({additions:Array.from(container.querySelectorAll('[data-pin-option]:checked')).map(el=>el.dataset.pinOption),additionalRequirements:container.querySelector('[data-pin-additional]').value}):undefined;
          b.textContent='Generating '+type.toUpperCase()+'…';if(message)message.textContent='Preparing the selected report from the saved evidence. This can take a minute.';
          const response=await scope.fetch('/api/investment-documents/draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,snapshot:snap,options})});
          const data=await response.json();if(!response.ok)throw Error(data.error||'Report generation failed. Your saved evidence is still available.');
          sections=data.sections;generation={method:data.method,notice:data.notice};
          if(!canWrite())throw Error('Your role changed. Reopen the opportunity before generating.');
          if(!sameSnapshot(snap,snapshot(deals().find(d=>d.id===deal.id)||deal,type)))throw Error('Source records changed during generation. Generate again using the updated evidence.');
          if(latestDocument(documents(),deal.id,type)?.id!==lastId)throw Error('A newer report version was saved during generation. Open it before generating again.');
        }
        const doc=newDocument(deal,type,sections,snap,options,generation);
        if(!persist(deal,doc,`${documentTypes[type]} v${doc.version} generated`))throw Error('Document could not be saved. Check browser storage.');
        if(location.href===originalLocation){render();open(doc);}else toast('The generated report was saved in the document library.');
      }catch(err){if(message)message.textContent=err.message;toast(err.message);}finally{generating=false;b.disabled=false;b.textContent=buttonLabel;}

      return;
    }
    if(b.dataset.docOpen) {const doc=documents().find(d=>d.id===b.dataset.docOpen);if(doc) open(doc);return;}
    if(b.dataset.docAction==='close') {closePanel();editor=null;return;}
    if(!editor) return;
    const doc=documents().find(d=>d.id===editor.id),deal=deals().find(d=>d.id===doc?.dealId);
    if(!doc||!deal) return error('The document is no longer available.');
    const action=b.dataset.docAction;
    try {
      const sections=readSections(doc);
      if(action==='evidence') {
        const url=URL.createObjectURL(new Blob([sourceSummary(doc.snapshot,events().filter(e=>e.documentId===doc.id))],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');
        a.href=url;a.download=`${doc.type}-v${doc.version}-evidence.txt`;a.click();scope.setTimeout(()=>URL.revokeObjectURL(url),10000);return;
      }
      if(action==='pdf') {
        if(JSON.stringify(sections)!==JSON.stringify(doc.sections)) throw Error('Save your changes before exporting this version.');
        b.disabled=true;
        const response=await scope.fetch('/api/investment-documents/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief:['pin','fip'].includes(doc.type)?reportBrief(doc):undefined,type:doc.type,title:doc.title,version:doc.version,savedAt:doc.savedAt,actor:doc.actor,options:doc.options,sections:doc.sections.map(s=>({...s,references:reportReferences(doc,s)})),status:status(doc),sources:['pin','fip'].includes(doc.type)?reportSourceRegister(doc):sourceSummary(doc.snapshot,events().filter(e=>e.documentId===doc.id))})});
        if(!response.ok) {const body=await response.json();throw Error(body.error||'PDF export failed.');}
        const url=URL.createObjectURL(await response.blob()),a=document.createElement('a');
        a.href=url;a.download=`${doc.type}-v${doc.version}.pdf`;a.click();scope.setTimeout(()=>URL.revokeObjectURL(url),10000);return;
      }
      if(latestDocument(documents(),deal.id,doc.type)?.id!==editor.latestId || editor.latestId!==doc.id) throw Error('A newer version exists. Close this document and open the latest version.');
      if(!sameSnapshot(doc.snapshot,snapshot(deal,doc.type))) throw Error('Source records changed. Generate a fresh draft before continuing.');
      if(action==='confirm-review') {
        if(doc.type!=='fip'||status(doc)!=='Draft')throw Error('Open the latest FIP draft to confirm review.');
        if(sections.some(sectionNeedsEvidence))throw Error('Some report sections still need evidence. Complete them before confirming review.');
        if(!$('#pinReportConfirmed')?.checked)throw Error('Confirm that you reviewed the full report before continuing.');
        const reviewed=sections.map(s=>({...s,reviewed:true}));
        const changed=JSON.stringify(reviewed)!==JSON.stringify(doc.sections);
        const next=changed?newDocument(deal,doc.type,reviewed,doc.snapshot,doc.options,doc.generation):doc;
        if(!save({...(changed?{[key]:[next,...documents()]}:{}),[eventKey]:[event(next,'Reviewed'),...events()]},deal,`FIP v${next.version} reviewed`))throw Error('Could not save the report review.');
        render();open(next);return;
      }
      if(action==='review-submit') {
        if(doc.type!=='pin')throw Error('This action applies to PIN reports.');
        if(sections.some(sectionNeedsEvidence))throw Error('Some report sections still need evidence. Complete them before submitting.');
        if(!$('#pinReportConfirmed')?.checked)throw Error('Confirm that you reviewed the full report before submitting.');
        const reviewed=sections.map(s=>({...s,reviewed:true}));
        const changed=JSON.stringify(reviewed)!==JSON.stringify(doc.sections);
        const next=changed?newDocument(deal,doc.type,reviewed,doc.snapshot,doc.options,doc.generation):doc;
        const reviewEvent=event(next,'Reviewed'),submitEvent=event(next,'Submitted');
        if(!save({...(changed?{[key]:[next,...documents()]}:{}),[eventKey]:[submitEvent,reviewEvent,...events()]},deal,`PIN v${next.version} reviewed and submitted`))throw Error('Could not save the report review.');
        render();open(next);return;
      }
      if(action==='save') {
        const next=newDocument(deal,doc.type,sections,doc.snapshot,doc.options,doc.generation);
        if(!persist(deal,next,`${documentTypes[doc.type]} v${next.version} saved`)) throw Error('Could not save the document.');
        render();open(next);return;
      }
      if(JSON.stringify(sections)!==JSON.stringify(doc.sections)) throw Error('Save your changes as a new version before review or submission.');
      if(reviewGaps(sections).length) throw Error('Complete and review every section before continuing.');
      if(action==='review' && doc.type==='fip')throw Error('Use Confirm review after checking the full report.');
      if(action==='review' && status(doc)!=='Draft') throw Error('Only a draft can be marked reviewed. Save changes as a new version to restart review.');
      if(action==='submit' && (doc.type!=='pin'||status(doc)!=='Reviewed')) throw Error('Mark the PIN reviewed before submitting it.');
      const nextStatus=action==='review'?'Reviewed':'Submitted';
      if(!save({[eventKey]:[event(doc,nextStatus),...events()]},deal,`${documentTypes[doc.type]} v${doc.version}: ${nextStatus}`)) throw Error('Could not save the review event.');
      render();open(doc);
    } catch(err) {error(err.message);} finally {b.disabled=false;}
  });
  return {
    openById(id) {const doc=documents().find(d=>d.id===id);if(doc)open(doc);else $('#view').innerHTML='<section class="wp"><h2>Document not found</h2><a href="/investment/documents">Open document library</a></section>';},
    panel,
    snapshot,
    pinForApproval(deal) {
      if(!['Group CEO','Group CIO'].includes(actor())) throw Error('Switch to the CEO or CIO demo role to record PIN approval.');
      return approvalDocument(documents(),events(),deal.id,snapshot(deal,'pin'));
    },
    decisionChanges(doc,status) {return {[eventKey]:[event(doc,status),...events()]};},
    latestSubmitted(deal) {const doc=latestDocument(documents(),deal.id,'pin');return doc && status(doc)==='Submitted'?doc:null;},
  };
}
