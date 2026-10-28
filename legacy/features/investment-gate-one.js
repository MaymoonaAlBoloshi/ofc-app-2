import {mergeDocumentEvidence} from '../lib/source-retrieval.mjs';
import {gateSourceDocuments,renderOverviewLinks,sourceDocumentLink} from '../lib/gate-source-links.mjs';
import {showInvestmentSource} from './investment-source-preview.js';
import { latestDocument, documentStatus, sameSnapshot } from '../lib/investment-documents.mjs';
export function createGateOne({scope,$,escH,read,save,deals,files,fileStore,actor,navigate,header,library,documents,actions,readiness}) {
  const key='ofc-gate-one'; let busy=false, revision=null;
  const current=id=>read(key).find(r=>r.dealId===id)||{id:'SG1-'+id,dealId:id,overview:'',evidence:[],research:[],overviewReviewed:false,researchReviewed:false};
  const url=(id,step)=>'/investment/gate-one?'+new URLSearchParams({opportunity:id,step});
  const route=()=>new URLSearchParams(location.search);
  const message=text=>{const el=$('#gateOneMessage');if(el)el.textContent=text;};
  function persist(deal,value){
    if((current(deal.id).updatedAt||null)!==revision)throw Error('This workflow changed in another tab. Reload before saving.');
    if(value.research.length>6)throw Error('Keep up to six relevant research sources. Remove an older source before adding another.');
    if(JSON.stringify(value.research).length>26000)throw Error('Research is too long. Remove sources that are not needed for this PIN.');
    const next={...value,updatedAt:new Date().toISOString(),owner:actor()};
    if(!save({[key]:[next,...read(key).filter(r=>r.dealId!==deal.id)]},deal,'Gate 1 evidence and overview updated'))throw Error('Could not save Gate 1.');
    revision=next.updatedAt;return next;
  }
  function render(){
    const id=route().get('opportunity'),deal=deals().find(d=>d.id===id);
    if(!deal){$('#view').innerHTML=header('Gate 1','Select an opportunity from the pipeline.','/investment#pipe');return;}
    const step=Math.min(5,Math.max(1,Number(route().get('step'))||1)); const state=current(id); revision=state.updatedAt||null;
    const uploaded=files().filter(f=>f.dealId===id);const doc=latestDocument(read('ofc-investment-documents'),id,'pin');
    const sourceDocs=gateSourceDocuments(uploaded,state.sourceText||state.evidence.map(e=>e.text||'').join('\n'));
    const overviewCurrent=state.overviewReviewed&&JSON.stringify(state.uploadIds)===JSON.stringify(uploaded.map(f=>f.fileId).sort());
    const status=doc?documentStatus(doc,read('ofc-investment-document-events')):'Not generated';
    const stale=doc&&!sameSnapshot(doc.snapshot,documents().snapshot(deal,'pin'));
    const states=[uploaded.length?`${uploaded.length} files`:'Upload needed',overviewCurrent?'Reviewed':'Needs review',state.researchReviewed?'Reviewed':'Needs review',doc?`v${doc.version}, ${status}${stale?', sources changed':''}`:'Not generated',status==='Approved'?'Approved':'Approval pending'];
    const nav=`<section class="wp gate-one-nav"><div class="gate-guide-heading"><div><p class="gate-eyebrow">GATE 1 · ORIGINATION</p><h2>${escH(deal.t)}</h2></div><span class="pill neu">Step ${step} of 5</span></div><p class="gate-step-intro">${['Start by adding the documents supplied by the partner.','Prepare the overview, read it and confirm the facts.','Check the supporting research and its source dates.','Choose report coverage and generate the PIN.','Submit the reviewed report and record the approval decision.'][step-1]}</p><nav aria-label="Gate 1 steps">${['Upload documents','Opportunity overview','Siraaj research','Generate PIN','Review and approval'].map((label,i)=>`<a data-invest-nav href="${escH(url(id,i+1))}" ${step===i+1?'aria-current="step"':''}>${i+1}. ${label}<small>${escH(states[i])}</small></a>`).join('')}</nav>${readiness(deal)}<p id="gateOneMessage" role="status" aria-live="polite"></p>${step>1?`<a class="see" data-invest-nav href="${escH(url(id,step-1))}">← Previous step</a>`:''}</section>`;
    if(step===1){library().render();document.querySelectorAll('#view [data-document-panel]').forEach(el=>el.remove());$('#view').insertAdjacentHTML('afterbegin',nav);$('#view').insertAdjacentHTML('beforeend',`<a class="btn" data-invest-nav href="${escH(url(id,2))}">Continue to opportunity overview</a>`);return;}
    let body='';
    if(step===2)body=`<section class="wp"><h2>Review the opportunity overview</h2><p>Prepare a draft from the uploaded documents, then check it before continuing.</p><button class="btn" data-gate-one="prepare" ${uploaded.length?'':'disabled'}>${state.overview?'Refresh overview from documents':'Prepare overview'}</button><p>${uploaded.length} uploaded document(s). Readable PDF, Word, spreadsheet and text files are supported.</p><form id="gateOverviewForm" class="pform"><article class="full gate-overview-preview"><h3>Opportunity overview</h3><p style="white-space:pre-wrap" data-overview-preview>${renderOverviewLinks(state.overview||'Your generated overview will appear here.',sourceDocs,escH)}</p></article><section class="full gate-source-documents" id="gateSourceDocuments" tabindex="-1"><h3>Source documents</h3><p>Open a document to check the overview against its evidence.</p><ul>${sourceDocs.map(d=>`<li>${sourceDocumentLink(d,escH)}<small>${d.kind==='upload'?'Uploaded file · preview available':'Publisher document · opens in a new tab'}</small></li>`).join('')||'<li>No source documents uploaded.</li>'}</ul></section><details class="full"><summary>Edit overview (optional)</summary><label>Opportunity overview<textarea name="overview" rows="8" maxlength="6000">${escH(state.overview)}</textarea></label></details><details class="full"><summary>View source excerpts or correct extraction</summary>${state.evidence.map(e=>`<details><summary>${escH(e.fileName)}${e.warning?': '+escH(e.warning):''}</summary><pre class="gate-source">${escH(e.text)}</pre></details>`).join('')}<label>Source excerpts<textarea name="evidence" maxlength="48000" rows="6">${escH(state.sourceText||state.evidence.map(e=>e.fileName+'\n'+e.text).join('\n\n').slice(0,48000))}</textarea></label><small>For corrections, retain the file name, page or sheet, period and units. Scans may need OCR. Up to ten files are searched for relevant evidence. Up to 48,000 characters of selected excerpts are used. Refresh the overview after adding or replacing files.</small></details><p class="full">By continuing, you confirm that you checked the overview against its source documents.</p><button class="btn" type="submit">Confirm overview and continue</button></form></section>`;
    if(step===3)body=`<section class="wp"><h2>Siraaj supporting research</h2><p>Retrieve MSX data and the selected peer's website. Peer data provides context and must not be presented as this opportunity's financial results. Failed retrievals are shown explicitly.</p><label>Listed peer <select id="gatePeer"><option value="OFMI">Oman Flour Mills</option><option value="ORCI">Oman Refreshment</option><option value="SFMI">Salalah Mills</option><option value="DFIN">Dhofar Foods & Investment</option><option value="SPFI">A'Saffa Foods</option><option value="OFCI">Oman Fisheries</option></select></label><button class="btn" data-gate-one="research">Retrieve supporting research</button>${state.research.map((r,index)=>`<article><h3><a href="${escH(r.url)}" target="_blank" rel="noopener noreferrer">${escH(r.title)}</a></h3><p>Retrieved: ${escH(r.fetchedAt||'Not retrieved')}. Source date: ${escH(r.asOf||'Not supplied')}.</p><p>${escH(r.warning||'')}</p><pre class="gate-source">${escH(r.text)}</pre><button class="see" data-gate-one="remove-research" data-index="${index}">Remove research source</button></article>`).join('')}<details><summary>Add another research source (optional)</summary><form id="gateResearchNote" class="pform"><h3 class="full">Add research from another relevant website</h3><label>Source title<input name="title" required maxlength="150"></label><label>Source URL<input name="url" type="url" maxlength="500" required></label><label>Date accessed<input name="date" type="date" required max="${new Date().toISOString().slice(0,10)}"></label><label class="full">Finding and relevance<textarea name="text" rows="4" maxlength="4000" required></textarea></label><button class="btn ghost" type="submit">Add dated research note</button></form></details><form id="gateResearchReview"><p>By continuing, you confirm that you checked the source dates and relevance of these findings.</p><button class="btn" type="submit">Confirm research and continue</button></form></section>`;
    if(step===4)body=`<section class="wp"><h2>Generate the PIN</h2><p>The PIN combines the recorded opportunity, reviewed overview, document excerpts and dated research. Missing assessment sections remain visible for completion.</p>${!overviewCurrent||!state.researchReviewed?'<p>Complete and review the overview and research before generating the PIN.</p>':''}</section>${documents().panel(deal,'pin')}`;
    if(step===5)body=`<section class="wp"><h2>Review and approval</h2><p>PIN status: ${escH(status)}${stale?' (source records changed, generate a fresh version)':''}.</p><p>Read the latest PIN, edit only what needs changing, then confirm your review and submit. CEO/CIO approval records the submitted version.</p>${doc?`<button class="btn" data-doc-open="${escH(doc.id)}">Open latest PIN</button>`:'<p>Generate a PIN in step 4 first.</p>'}<div class="investment-actions">${actions(deal)}</div>${status==='Approved'?`<div class="gate-next-card"><div><h3>Gate 1 approval recorded</h3><p>Continue to the opportunity workspace for assessment and the next gate.</p></div><a class="btn" data-invest-nav href="/investment#tx|${encodeURIComponent(id)}">Continue to opportunity workspace →</a></div>`:''}<p>Approval uses the existing demo roles. Switch to CEO or CIO to record the decision.</p></section>`;
    $('#view').innerHTML=`<div class="stack investment-entry-page">${header('Gate 1 workflow',deal.t,'/investment#tx|'+id)}${nav}${body}</div>`;
    document.title='Gate 1 · '+deal.t;$('#crumbView').textContent=' / Gate 1';
  }
  scope.listen(document,'input',e=>{if(e.target.matches('#gateOverviewForm [name=overview]')){const id=route().get('opportunity'),state=current(id);$('[data-overview-preview]').innerHTML=renderOverviewLinks(e.target.value,gateSourceDocuments(files().filter(f=>f.dealId===id),state.sourceText||state.evidence.map(e=>e.text||'').join('\n')),escH);}});
  scope.listen(document,'submit',e=>{
    if(!['gateOverviewForm','gateResearchNote','gateResearchReview'].includes(e.target.id))return;
    e.preventDefault();e.stopImmediatePropagation();if(busy)return;
    const id=route().get('opportunity'),deal=deals().find(d=>d.id===id),state=current(id),form=e.target.elements;
    try{
      if(e.target.id==='gateOverviewForm'){
        if(!files().some(f=>f.dealId===id))throw Error('Upload at least one source document first.');
        if(!form.evidence.value.trim()||!form.overview.value.trim())throw Error('Prepare the overview and check its source excerpts before continuing.');
        if(state.preparedUploadIds&&JSON.stringify(state.preparedUploadIds)!==JSON.stringify(files().filter(f=>f.dealId===id).map(f=>f.fileId).sort()))throw Error('The uploaded documents changed. Refresh the overview before confirming.');
        persist(deal,{...state,overview:form.overview.value.trim(),sourceText:form.evidence.value.trim(),overviewReviewed:true,uploadIds:files().filter(f=>f.dealId===id).map(f=>f.fileId).sort()});navigate(url(id,3));
      }else if(e.target.id==='gateResearchNote'){
        const link=new URL(form.url.value);if(!['https:','http:'].includes(link.protocol)||link.username||link.password)throw Error('Use an HTTP or HTTPS source URL.');
        if(!form.text.value.trim()||form.date.value>new Date().toISOString().slice(0,10))throw Error('Enter a finding and a valid access date.');
        persist(deal,{...state,research:[...state.research,{title:form.title.value,url:link.href,fetchedAt:form.date.value,asOf:'Publication date not supplied',text:form.text.value.trim(),warning:'Manually recorded source; reviewed by '+actor()}],researchReviewed:false});render();
      }else{
        if(!state.research.some(r=>r.text&&r.fetchedAt))throw Error('Add at least one retrieved or manually recorded source and review it.');
        persist(deal,{...state,researchReviewed:true});navigate(url(id,4));
      }
    }catch(err){message(err.message);}
  },true);
  scope.listen(document,'click',async e=>{
    const source=e.target.closest('[data-gate-source-file],[data-gate-source-list]');
    if(source){
      e.preventDefault();
      if(source.hasAttribute('data-gate-source-list')){const list=$('#gateSourceDocuments');list?.scrollIntoView({behavior:'smooth',block:'center'});list?.focus({preventScroll:true});return;}
      const id=route().get('opportunity'),file=files().find(f=>f.fileId===source.dataset.gateSourceFile&&f.dealId===id);
      if(!file){message('This source is not attached to the current opportunity.');return;}
      await showInvestmentSource({file,evidence:current(id).evidence.find(e=>e.fileId===file.fileId),fileStore,escH,container:$('#view'),page:source.dataset.sourcePage||'',trigger:source});return;
    }

    const b=e.target.closest('[data-gate-one]');if(!b||busy)return;
    const id=route().get('opportunity'),deal=deals().find(d=>d.id===id),state=current(id),action=b.dataset.gateOne;
    const originalRoute=location.href;
    const request=async(action,body,params='')=>{const r=await scope.fetch('/api/gate-one?action='+action+params,{method:'POST',headers:body instanceof Blob?{}:{'Content-Type':'application/json'},body:body instanceof Blob?body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed.');return data;};
    busy=true;b.disabled=true;message('Working. Please keep this step open.');
    try{
      if(action==='remove-research'){
        persist(deal,{...state,research:state.research.filter((_,index)=>index!==Number(b.dataset.index)),researchReviewed:false});render();
      }else if(action==='prepare'){
        const evidence=[],preparedUploadIds=files().filter(f=>f.dealId===id).map(f=>f.fileId).sort();
        message('Reading uploaded documents and preparing your overview…');
        for(const f of files().filter(f=>f.dealId===id).slice(0,10)){
          try{const blob=await fileStore('get',f.fileId);if(!blob)throw Error('File is unavailable in this browser.');const result=await request('extract',blob,'&name='+encodeURIComponent(f.fileName));evidence.push({...result,fileId:f.fileId,fileName:f.fileName,warning:result.warning||(result.truncated?'Relevant excerpts selected; check original documents for full context.':'')});}catch(err){evidence.push({fileId:f.fileId,fileName:f.fileName,text:'',warning:err.message});}
        }
        const sourceText=mergeDocumentEvidence(evidence);
        persist(deal,{...state,evidence,sourceText,preparedUploadIds,overviewReviewed:false});
        if(!sourceText){if(location.href===originalRoute)render();throw Error('No readable text was found. Upload a readable document or add source excerpts under the correction option.');}
        try{
          const data=await request('draft',{text:sourceText});
          persist(deal,{...current(id),overview:data.text.slice(0,6000),overviewReviewed:false});
          if(location.href===originalRoute){render();message('Overview prepared. Read it, make any corrections, then confirm to continue.');}
        }catch(err){if(location.href===originalRoute)render();throw err;}
      }else if(action==='research'){
        const data=await request('research',{symbol:$('#gatePeer').value});persist(deal,{...state,research:[...state.research.filter(r=>!data.sources.some(n=>n.url===r.url)),...data.sources],researchReviewed:false});if(location.href===originalRoute)render();
      }
    }catch(err){if(location.href===originalRoute)message(err.message);}finally{busy=false;b.disabled=false;}
  });
  return {render};
}
