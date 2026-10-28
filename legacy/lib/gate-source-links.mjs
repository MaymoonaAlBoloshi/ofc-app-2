export function safeSourceUrl(value){
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function gateSourceDocuments(uploads,evidenceText=''){
 const docs=uploads.map(f=>({title:f.fileName,fileId:f.fileId,kind:'upload'}));
 for(const match of String(evidenceText).matchAll(/SOURCE FILE:\s*([^\r\n]+)[\r\n]+SOURCE URL:\s*(https?:\/\/[^\s]+)/gi)){
  const url=safeSourceUrl(match[2]);
  if(url&&!docs.some(d=>d.title===match[1].trim()||d.url===url))docs.push({title:match[1].trim(),url,kind:'publisher'});
 }
 return docs;
}
export function sourceDocumentLink(doc,esc,label=doc.title,page=''){
 const n=/^\d{1,5}$/.test(String(page))&&Number(page)>0?String(Number(page)):'';
 if(doc.fileId)return `<a href="#gateSourceDocuments" data-gate-source-file="${esc(doc.fileId)}"${n?` data-source-page="${n}"`:''}>${esc(label)}</a>`;
 const safe=safeSourceUrl(doc.url);
 if(!safe)return esc(label);
 const url=new URL(safe);if(n&&/\.pdf$/i.test(url.pathname))url.hash='page='+n;
 return `<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}
export function renderOverviewLinks(text,docs,esc){
 const names=docs.map(d=>d.title).filter(Boolean).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const pattern=new RegExp('\\[[^\\]\\n]+\\]\\([^\\s)]+\\)|\\[(?:Uploaded document excerpts|source:gate-upload)\\]|https?:\\/\\/[^\\s<>]+|'+(names.length?'(?:'+names.join('|')+')(?:[, ]+(?:PDF\\s+)?(?:page|p\\.?)\\s*\\d{1,5})?':'(?!)'),'gi');
 let output='',start=0;
 for(const match of String(text||'').matchAll(pattern)){
  output+=esc(text.slice(start,match.index));const token=match[0];
  const markdown=token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  const label=markdown?.[1]||token;
  const candidates=docs.filter(d=>label.toLowerCase().includes(d.title.toLowerCase())).sort((a,b)=>b.title.length-a.title.length);
  const doc=candidates[0];
  const ambiguous=doc&&candidates.filter(d=>d.title.toLowerCase()===doc.title.toLowerCase()).length>1;
  const page=label.match(/(?:page|p\.)\s*(\d{1,5})/i)?.[1]||'';
  if(ambiguous)output+=`<a href="#gateSourceDocuments" data-gate-source-list>${esc(label)}</a>`;
  else if(doc)output+=sourceDocumentLink(doc,esc,label,page);
  else if(/gate-upload|^\[Uploaded document excerpts\]$/i.test(token))output+='<a href="#gateSourceDocuments" data-gate-source-list>Uploaded source documents</a>';
  else if(markdown){const safe=safeSourceUrl(markdown[2]);output+=safe?sourceDocumentLink({url:safe},esc,label):esc(token);}
  else if(/^https?:/i.test(token)){
   const clean=token.replace(/[.,;!?)\]]+$/,'');const tail=token.slice(clean.length);
   output+=sourceDocumentLink({url:clean},esc,clean)+esc(tail);
  }else output+=esc(token);
  start=match.index+token.length;
 }
 return output+esc(String(text||'').slice(start));
}
