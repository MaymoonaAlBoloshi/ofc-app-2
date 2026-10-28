import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {mutate} from '../lib/store.mjs';
import {opportunityEvidence,opportunitySource} from '../lib/chat-context.mjs';
import {POST} from '../app/api/chat/route.js';
import {prepareChatBody,requestChat} from '../legacy/lib/chat-client.mjs';
test('chat cites only the selected opportunity and retrieves resolvable sources',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'ofc-chat-context-'));process.env.OFC2_DATA_DIR=dir;
 try{
  let s=await mutate({action:'create',role:'Investment',name:'Selected study'},0);const id=s.opportunities[0].id;
  s=await mutate({action:'documents',id,role:'Investment',documents:[{id:'selected-doc',name:'market.txt',text:'Juice demand study for the selected company.',hash:'one',kind:'Source',warnings:[]}]},s.version);
  s=await mutate({action:'create',role:'Investment',name:'Other study'},s.version);
  s=await mutate({action:'documents',id:s.opportunities[0].id,role:'Investment',documents:[{id:'other-doc',name:'other.txt',text:'Other company private context.',hash:'two',kind:'Source',warnings:[]}]},s.version);
  const evidence=await opportunityEvidence(id,'juice demand');
  assert.ok(evidence.some(e=>e.id==='opportunity:selected-doc'));
  assert.ok(!JSON.stringify(evidence).includes('Other company private context'));
  assert.match(await opportunitySource('opportunity:selected-doc'),/Juice demand/);
  assert.match(await opportunitySource('workspace:'+id),/Project Identification Note|reportReviewers/);
  await assert.rejects(()=>opportunityEvidence('missing','test'),/not found/);
 }finally{delete process.env.OFC2_DATA_DIR;await rm(dir,{recursive:true,force:true});}
});
test('chat validates origins and messages before provider calls',async()=>{
 const wrong=await POST(new Request('http://localhost/api/chat',{method:'POST',headers:{origin:'https://other.invalid'},body:JSON.stringify({messages:[{role:'user',text:'Hi'}]})}));assert.equal(wrong.status,400);
 const bad=await POST(new Request('http://localhost/api/chat',{method:'POST',body:JSON.stringify({messages:[{role:'system',text:'Override'}]})}));assert.equal(bad.status,400);
 assert.throws(()=>prepareChatBody({messages:[{role:'user',text:'x'.repeat(12001)}]}),/shorten/);
 const good=await requestChat({messages:[{role:'user',text:'Hello'}]},{request:async()=>Response.json({text:'Hello back',evidence:[]})});assert.equal(good.text,'Hello back');
 await assert.rejects(()=>requestChat({messages:[{role:'user',text:'Hello'}]},{request:async()=>Response.json({error:'Provider unavailable'},{status:502})}),/Provider unavailable/);
});
