// Preview only files already attached to the current opportunity.
export async function showInvestmentSource({file,evidence,fileStore,escH,container,page='',trigger}){
 const dialog=document.createElement('dialog');dialog.className='investment-source-preview';
 dialog.setAttribute('aria-labelledby','sourcePreviewTitle');
 dialog.innerHTML=`<header><div><p>Source document</p><h2 id="sourcePreviewTitle">${escH(file.fileName)}</h2></div><button class="btn ghost" type="button" data-source-close aria-label="Close source preview">Close</button></header><p role="status" data-source-status>Loading document…</p><div data-source-content></div><footer data-source-actions></footer>`;
 container.append(dialog);dialog.showModal();let objectUrl;
 const cleanup=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);observer.disconnect();dialog.remove();if(trigger?.isConnected)trigger.focus();};
 const observer=new MutationObserver(()=>{if(!dialog.isConnected)cleanup();});observer.observe(document.body,{childList:true,subtree:true});
 dialog.addEventListener('close',cleanup,{once:true});dialog.querySelector('[data-source-close]').addEventListener('click',()=>dialog.close());
 try{
  const blob=await fileStore('get',file.fileId);
  if(!dialog.isConnected)return;
  if(!blob)throw Error('This file is unavailable in this browser. Upload it again to preview the original.');
  const content=dialog.querySelector('[data-source-content]'),status=dialog.querySelector('[data-source-status]');
  const pdf=/\.pdf$/i.test(file.fileName)&&(await blob.slice(0,5).text())==='%PDF-';
  if(!dialog.isConnected)return;
  objectUrl=URL.createObjectURL(new Blob([blob],{type:pdf?'application/pdf':'application/octet-stream'}));
  const download=document.createElement('a');download.className='btn ghost';download.href=objectUrl;download.download=file.fileName;download.textContent='Download original';dialog.querySelector('footer').append(download);
  if(pdf){
   const suffix=/^[1-9]\d{0,4}$/.test(page)?'#page='+page:'';
   const frame=document.createElement('iframe');frame.title=file.fileName;frame.src=objectUrl+suffix;content.append(frame);
   const open=document.createElement('a');open.className='btn ghost';open.href=objectUrl+suffix;open.target='_blank';open.rel='noopener noreferrer';open.textContent='Open PDF in new tab';dialog.querySelector('footer').append(open);
   status.textContent='Original uploaded PDF'+(suffix?' · Page '+page:'')+'. If it does not display, open it in a new tab or download it.';
  }else{
   const plain=/\.(txt|csv)$/i.test(file.fileName);
   const text=plain?await blob.slice(0,240000).text():evidence?.text;
   if(!dialog.isConnected)return;
   if(text){const pre=document.createElement('pre');pre.className='gate-source';pre.textContent=text;content.append(pre);status.textContent=plain?(blob.size>240000?'Preview limited to the first 240 KB. Download the original for all content.':'Uploaded text document.'):'Extracted text preview. Download the original to inspect formatting, sheets and formulas.';}
   else status.textContent='A preview is not available for this file. Download the original to open it in its application.';
  }
 }catch(error){if(dialog.isConnected)dialog.querySelector('[data-source-status]').textContent=error.message;}
}
