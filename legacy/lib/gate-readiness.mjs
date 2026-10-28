import {gateTwoReviewGaps} from './gate-two.mjs';
import { latestDocument, documentStatus, sameSnapshot, definitions } from './investment-documents.mjs';

const complete = (rows, statuses = ['Completed']) => rows.length > 0 && rows.every(r => statuses.includes(r.status));
const text = value => typeof value === 'string' && !!value.trim();
export function gateReadiness({gate, deal, rows = {}, uploads = [], workflow = {}, documents = [], events = [], snapshot, fipSnapshot, asset}) {
  const checks = [];
  const owner = deal.owner || 'Investment team';
  const entry = key => '/investment/entry?' + new URLSearchParams({tracker:key, opportunity:deal.id, return:'/investment#tx|'+deal.id});
  const step = n => '/investment/gate-one?' + new URLSearchParams({opportunity:deal.id,step:n});
  const add = (id,label,done,detail,href,who=owner,approval=false) => checks.push({id,label,done:!!done,detail,href,owner:who,approval});
  const records = key => rows[key] || [];
  if(gate===1){
    const overview = uploads.length>0 && text(workflow.overview) && workflow.overviewReviewed && JSON.stringify(workflow.uploadIds)===JSON.stringify(uploads.map(f=>f.fileId).sort());
    const research = workflow.researchReviewed && (workflow.research||[]).some(r=>text(r.text)&&r.fetchedAt&&r.url);
    const pin = latestDocument(documents,deal.id,'pin');
    const status = pin ? documentStatus(pin,events) : 'Not generated';
    const current = pin && sameSnapshot(pin.snapshot,snapshot);
    const reviewed = pin?.sections?.length>0 && pin.sections.every(s=>text(s.text)&&s.reviewed);
    add('uploads','Upload source documents',uploads.length>0,uploads.length?`${uploads.length} source document(s) attached.`:'Attach the documents supplied by the investor or partner.',step(1));
    add('overview','Confirm the opportunity overview',overview,overview?'Reviewed against the current uploads.':'Prepare and confirm the overview. Changed uploads require another review.',step(2));
    add('research','Review supporting research',research,research?'Dated supporting research reviewed.':'Add a source with findings, a link and access date, then confirm review.',step(3));
    add('pin','Review and submit the current PIN',current&&reviewed&&['Submitted','Approved'].includes(status),!pin?'Generate the PIN, review its sections and submit it.':!current?'The source records changed. Generate and review a fresh PIN.':`PIN v${pin.version}: ${status}.`,step(current?5:4));
    add('approval','Record CEO/CIO approval',current&&status==='Approved','Approval must refer to the current submitted PIN.',step(5),'CEO / CIO',true);
  }else if(gate===2){
    const a=records('assessment');
    add('assessment','Complete the assessment',complete(a)&&a.every(r=>text(r.rec)&&text(r.find)&&!gateTwoReviewGaps(r).length),a.length?'Complete each assessment and record its findings and recommendation.':'Add an assessment with findings, a development option and recommendation.',a.length?'/investment#trk-assessment':entry('assessment'));
    add('ec','Record the EC decision',records('gate').some(r=>r.step==='EC'&&r.decision&&r.toStage==='DD'),'Record whether to proceed or undertake further due diligence.','/investment#tx|'+deal.id,'Executive Committee',true);
  }else if(gate===3){
    for(const [key,label,statuses] of [['dd','Complete due diligence',['Completed']],['close','Complete closing documents and conditions',['Signed','Completed']],['hand','Review handover evidence',['Ready']]]){
      const list=records(key);
      add(key,label,complete(list,statuses),list.length?`${list.filter(r=>!statuses.includes(r.status)).length} of ${list.length} recorded items still need completion.`:'No records yet. Add the required work and evidence.',list.length?'/investment#trk-'+key:entry(key));
    }
    add('fid','Record the Board FID decision',records('gate').some(r=>['Board','FID'].includes(r.step)&&r.toStage==='Closing'&&r.decision),'Review the Board decision and any conditions before handover.','/investment#tx|'+deal.id,'Board',true);
    checks.splice(1,0,checks.pop());
    const afterApproval=['Closing','Handover'].includes(deal.stage);
    const decision=afterApproval?records('gate').find(r=>['FID','Board'].includes(r.step)&&r.toStage==='Closing'&&r.fipDocumentId):null;
    const fip=decision?documents.find(doc=>doc.id===decision.fipDocumentId&&doc.dealId===deal.id&&doc.type==='fip'):latestDocument(documents,deal.id,'fip'), expected=definitions('fip');
    const reviewed=fip&&['Reviewed','Approved'].includes(documentStatus(fip,events))&&fip.sections?.length===expected.length&&fip.sections.every((s,i)=>s.key===expected[i].key&&text(s.text)&&s.reviewed);
    const linked=afterApproval&&records('gate').some(r=>['FID','Board'].includes(r.step)&&r.toStage==='Closing'&&r.fipDocumentId===fip?.id);
    const current=fip&&(linked||sameSnapshot(fip.snapshot,fipSnapshot));
    add('fip','Review the final investment proposal',reviewed&&current,!fip?'Generate the FIP, complete its sections and mark it reviewed.':!current?'FIP sources changed. Generate and review a fresh version.':`FIP v${fip.version}: ${documentStatus(fip,events)}.`,fip&&!current?'/investment/documents?opportunity='+encodeURIComponent(deal.id):fip?'/investment/documents/edit?'+new URLSearchParams({document:fip.id,return:'/investment#tx|'+deal.id}):'/investment/documents?opportunity='+encodeURIComponent(deal.id));
    checks.splice(1,0,checks.pop());
    const assessment=records('assessment');
    checks.unshift({id:'assessment',label:'Complete the assessment',done:complete(assessment)&&assessment.every(r=>text(r.rec)&&text(r.find)&&!gateTwoReviewGaps(r).length),detail:'The assessment remains required after a request for further due diligence.',href:assessment.length?'/investment#trk-assessment':entry('assessment'),owner,approval:false});
  }else if(gate===4){
    const done=['Completed','Closed','Accepted'];
    const tests=records('commission'), hand=records('handover'), defects=records('punch').filter(r=>['Critical','High'].includes(r.priority)&&!done.includes(r.status));
    add('commission','Complete commissioning',complete(tests,done),tests.length?'Complete all recorded commissioning tests.':'Add commissioning tests and acceptance criteria.','/pmo#trk-commission','PMO');
    add('defects','Close critical and high defects',tests.length>0&&!defects.length,`${defects.length} open critical or high defects. Review the punch list before acceptance.`,'/pmo#trk-punch','PMO');
    add('handover','Complete handover evidence',complete(hand,done),hand.length?'Complete each handover record.':'Add handover records for this project.','/pmo#trk-handover','PMO');
    add('acceptance','Record operations acceptance',hand.some(r=>r.category==='Operations acceptance'&&done.includes(r.status)),'Operations must accept the project before transfer.','/pmo#readiness','Operations',true);
    add('closeout','Complete project closeout',complete(records('closeout'),done),'Record and complete the project closure, contractual and document closeout items.','/pmo#trk-closeout','PMO');
    add('finance','Complete financial closeout',complete(records('finance'),done),'Record final accounts, cost reconciliation and settlement items, then complete each record.','/pmo#trk-finance','Finance / PMO');
  }else{
    add('asset','Confirm the operating asset',!!asset,'Open the asset received from PMO and review its details.',asset?'/asset-management#company|'+encodeURIComponent(asset.code)+'|about':'/asset-management','Asset Management');
    add('financials','Record financial actuals and budget',records('financials').some(r=>text(r.period)&&['rev','bud','eb'].every(k=>r[k]!==''&&r[k]!=null&&Number.isFinite(Number(r[k])))),'Maintain reporting periods, revenue, budget and EBITDA. Review these each reporting cycle.','/asset-management#trk-financials','Asset Management');
  }
  const pending=checks.filter(c=>!c.done), preparation=pending.filter(c=>!c.approval);
  const paused=['Inactive','Deferred','Declined','Closed'].includes(deal.status);
  const state=paused?'Opportunity paused':gate===5?'Ongoing monitoring':!pending.length?'Recorded requirements complete':!preparation.length?'Ready for review':'Preparation needed';
  return {checks,pending,next:pending[0]||null,state,paused,owner:pending[0]?.owner|| (gate===5?'Asset Management':owner)};
}

export function renderGateReadiness(result,esc,{compact=false}={}){
  if(compact)return `<div class="gate-header-readiness" aria-label="Gate readiness"><div class="gate-header-status"><span class="pill neu">${esc(result.state)}</span><span>${result.checks.length-result.pending.length} of ${result.checks.length} checks complete</span><span>Next responsible: <b>${esc(result.paused?'Opportunity owner':result.owner)}</b></span></div><details class="gate-header-checks"><summary>View gate requirements</summary><ul>${result.checks.map(c=>`<li data-readiness="${esc(c.id)}" data-complete="${c.done}"><span class="pill ${c.done?'ok':'neu'}">${c.done?'Complete':'Needed'}</span><div><a ${c.href.startsWith('/investment')?'data-invest-nav':''} href="${esc(c.href)}">${esc(c.label)}</a><p>${esc(c.detail)}</p><small>${esc(c.owner)}</small></div></li>`).join('')}</ul></details></div>`;

  return `<div class="gate-readiness" aria-label="Gate readiness"><div class="gate-guide-heading"><div><h3>${esc(result.state)}</h3><p>${result.checks.length-result.pending.length} of ${result.checks.length} recorded checks complete</p></div><p><b>Next responsible:</b> ${esc(result.paused?'Opportunity owner':result.owner)}</p></div><ul>${result.checks.map(c=>`<li data-readiness="${esc(c.id)}" data-complete="${c.done}"><span class="pill ${c.done?'ok':'neu'}">${c.done?'Complete':'Needed'}</span><div><b>${esc(c.label)}</b><p>${esc(c.detail)}</p><small>${esc(c.owner)}</small></div><a class="see" aria-label="${c.done?'View':'Open'}: ${esc(c.label)}" ${c.href.startsWith('/investment')?'data-invest-nav':''} href="${esc(c.href)}">${c.done?'View':'Open'}</a></li>`).join('')}</ul><p class="src">Based on recorded work. Review evidence and any approval conditions before progressing.</p></div>`;
}

// Only forward approvals are gated. Requests for more work and declines remain available.
export function gateActionBlockers(readiness,stage,action) {
  const ids=action==='handover'?['assessment','dd','fip','fid','close','hand']:
    action==='EC: recommend proceeding'?['assessment']:
    action==='Complete DD and submit for FID'?['assessment','dd']:
    ['Board: approve FID','Board: approve with conditions'].includes(action)?['assessment','dd','fip']:[];
  return readiness.checks.filter(c=>ids.includes(c.id)&&!c.done);
}
export function renderGateBlockers(blockers,esc) {
  return blockers.length?`<div class="gate-blockers"><p><b>Complete before proceeding:</b></p><ul>${blockers.map(c=>`<li><a ${c.href.startsWith('/investment')?'data-invest-nav':''} href="${esc(c.href)}">${esc(c.label)}</a><span>${esc(c.detail)}</span></li>`).join('')}</ul></div>`:'';
}
