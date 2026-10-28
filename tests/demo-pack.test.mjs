import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { POST } from '../app/api/workspace/route.js';
import { readState } from '../lib/store.mjs';

test('new opportunities can include independent demo records or start empty', async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'ofc2-demo-create-'));
  process.env.OFC2_DATA_DIR=dir;
  const create=async(name,version,demoPack)=>{
    const response=await POST(new Request('http://localhost/api/workspace',{method:'POST',body:JSON.stringify({action:'create',role:'Investment',name,version,demoPack})}));
    return {status:response.status,data:await response.json()};
  };
  try {
    const first=await create('Demo one',0,true);
    assert.equal(first.status,200);
    const a=first.data.opportunities[0];
    assert.equal(a.documents.length,42);
    assert.equal(Object.keys(a.requirements).length,14);
    assert.equal(a.reports.length,1);
    assert.equal(a.reports[0].status,'Draft');
    assert.ok(Object.values(a.requirements).every(r=>r.status==='Draft'));
    assert.ok(a.documents.every(d=>!d.reviewed));
    assert.equal(a.decisions.length,0);
    const second=await create('Demo two',first.data.version,true);
    assert.equal(second.status,200);
    const b=second.data.opportunities[0];
    assert.equal(b.documents.length,42);
    assert.notEqual(a.documents[0].id,b.documents[0].id);
    assert.deepEqual(second.data.opportunities.find(o=>o.id===a.id),a);
    const empty=await create('Empty opportunity',second.data.version,false);
    assert.equal(empty.status,200);
    assert.equal(empty.data.opportunities[0].documents.length,0);
    assert.equal(empty.data.opportunities[0].reports.length,0);
    const conflict=await create('Stale request',0,true);
    assert.equal(conflict.status,409);
    assert.equal((await readState()).opportunities.length,3);
  } finally { delete process.env.OFC2_DATA_DIR; await rm(dir,{recursive:true,force:true}); }
});
