export function createInvestmentLibrary({scope,$,escH,read,save,deals,rows,fileStore,actor,canWrite,navigate,header,generated}) {
  const storage='ofc-investment-uploads';
  let busy=false;
  const categories=['General','PIN evidence','Feasibility','Financial','Due diligence','Legal','Handover'];
  function files() {
    const existing=rows('close').filter(r=>r.fileId).map(r=>({id:r.fileId,fileId:r.fileId,dealId:r.dealId,title:r.t,fileName:r.fileName,category:'Legal',owner:r.owner,date:r.date,source:'Closing tracker'}));
    return [...read(storage),...existing.filter(r=>!read(storage).some(u=>u.fileId===r.fileId))];
  }
  function render() {
    const selected=new URLSearchParams(location.search).get('opportunity')||'';
    const deal=deals().find(d=>d.id===selected);
    if(selected&&!deal) {$('#view').innerHTML=header('Documents','Opportunity not found.','/investment#pipe');return;}
    const items=files().filter(f=>!selected||f.dealId===selected);
    $('#view').innerHTML=`<div class="stack investment-entry-page">${header('Documents',deal?deal.t:'Source files and generated investment documents',deal?'/investment#tx|'+encodeURIComponent(deal.id):'/investment#home')}<section class="wp"><label>Opportunity <select id="libraryOpportunity"><option value="">All opportunities</option>${deals().map(d=>`<option value="${escH(d.id)}"${d.id===selected?' selected':''}>${escH(d.t)}</option>`).join('')}</select></label></section><section class="wp"><h2>Upload source documents</h2><form id="investmentUploadForm" class="pform"><label><span>Opportunity *</span><select name="dealId" required><option value="">Select an opportunity</option>${deals().map(d=>`<option value="${escH(d.id)}"${d.id===selected?' selected':''}>${escH(d.t)}</option>`).join('')}</select></label><label><span>Category</span><select name="category">${categories.map(c=>`<option>${c}</option>`).join('')}</select></label><label class="full upload-dropzone" id="uploadDropzone"><span>Choose files or drop them here</span><input type="file" name="files" multiple required><small>Up to 10 files per upload, 10 MB each. Files are stored in this browser.</small></label><p class="full" id="uploadSelection" aria-live="polite"></p><p class="err full" id="uploadError" role="alert" hidden></p><div class="full"><button class="btn" type="submit">Upload documents</button></div></form></section><section class="wp"><h2>Uploaded files (${items.length})</h2><div class="tscroll"><table class="ttbl"><thead><tr><th>Document</th><th>Opportunity</th><th>Category</th><th>Uploaded / recorded</th><th>Owner</th><th></th></tr></thead><tbody>${items.map(f=>`<tr><td>${escH(f.title||f.fileName)}<small style="display:block">${escH(f.fileName)}${f.size!=null?' · '+(f.size/1024).toFixed(1)+' KB':''}</small></td><td>${escH(deals().find(d=>d.id===f.dealId)?.t||'Unlinked')}</td><td>${escH(f.category)}</td><td>${escH(f.date?.slice(0,10)||'Not recorded')}</td><td>${escH(f.owner||'')}</td><td><button class="see" data-library-download="${escH(f.fileId)}" data-library-name="${escH(f.fileName)}">Download</button></td></tr>`).join('')||'<tr><td colspan="6">No uploaded files for this selection.</td></tr>'}</tbody></table></div></section>${deal?generated(deal):'<section class="wp"><h2>Generated reports</h2><p>Select an opportunity to generate or open its report versions.</p></section>'}</div>`;
    document.title='Documents · Investment · Oman Food Capital';
    $('#crumbView').textContent=' / Documents';
  }
  function showSelection() {
    const input=$('#investmentUploadForm [name=files]');
    if(input) $('#uploadSelection').textContent=Array.from(input.files).map(f=>`${f.name} (${(f.size/1024).toFixed(1)} KB)`).join(', ');
  }
  function error(message) {const el=$('#uploadError');if(el){el.textContent=message;el.hidden=false;}}
  scope.listen(document,'change',e=>{
    if(e.target.id==='libraryOpportunity') navigate('/investment/documents'+(e.target.value?'?opportunity='+encodeURIComponent(e.target.value):''));
    if(e.target.matches('#investmentUploadForm [name=files]')) showSelection();
  });
  scope.listen(document,'dragover',e=>{if(e.target.closest('#uploadDropzone'))e.preventDefault();});
  scope.listen(document,'drop',e=>{
    if(!e.target.closest('#uploadDropzone'))return;e.preventDefault();
    if(busy)return;
    $('#investmentUploadForm [name=files]').files=e.dataTransfer.files;showSelection();
  });
  scope.listen(document,'submit',async e=>{
    if(e.target.id!=='investmentUploadForm')return;e.preventDefault();e.stopImmediatePropagation();
    if(!canWrite()||busy)return;
    const form=e.target,deal=deals().find(d=>d.id===form.elements.dealId.value), selected=Array.from(form.elements.files.files),category=form.elements.category.value;
    if(!deal)return error('Select an opportunity.');
    if(!selected.length||selected.length>10)return error('Choose between 1 and 10 files.');
    if(selected.some(f=>!f.size||f.size>10*1024*1024))return error('Each file must contain data and be no larger than 10 MB.');
    if(!categories.includes(category))return error('Select a valid category.');
    busy=true;form.querySelector('[type=submit]').disabled=true;
    const uploaded=[];
    let committed=false;
    try {
      const entries=[];
      for(const file of selected) {
        const id='UPLOAD-'+crypto.randomUUID();await fileStore('put',id,file);uploaded.push(id);
        entries.push({id,fileId:id,dealId:deal.id,title:file.name,fileName:file.name,fileType:file.type,size:file.size,category,owner:actor(),date:new Date().toISOString()});
      }
      if(!save({[storage]:[...entries,...read(storage)]},deal,`${entries.length} source document(s) uploaded`))throw Error('Could not save the document register.');
      committed=true;
      navigate('/investment/documents?opportunity='+encodeURIComponent(deal.id));
    } catch(err) {
      if(!committed) await Promise.allSettled(uploaded.map(id=>fileStore('delete',id)));
      error(err.message||'Upload failed. Your files were not saved.');
    } finally {busy=false;form.querySelector('[type=submit]').disabled=false;}
  },true);
  scope.listen(document,'click',async e=>{
    const b=e.target.closest('[data-library-download]');if(!b||!canWrite())return;
    try {
      const blob=await fileStore('get',b.dataset.libraryDownload);
      if(!blob)throw Error('This file is unavailable in this browser. Upload it again.');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=b.dataset.libraryName||'document';a.click();scope.setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch(err){error(err.message);}
  });
  return {render,files,isBusy:()=>busy};
}
