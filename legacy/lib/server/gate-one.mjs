import {evidenceBudget,splitEvidence,selectEvidenceChunks} from '../source-retrieval.mjs';
import { spawn } from 'node:child_process';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { refresh } from './market.mjs';
import { reply } from './chat.mjs';

async function limitedBody(request, limit) {
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader)
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) {
          await reader.cancel();
          throw Error('Request is too large.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  return Buffer.concat(chunks);
}
export async function extractSource(bytes, name) {
  const ext = extname(name).toLowerCase();
  if (!['.pdf', '.docx', '.xlsx', '.txt', '.csv'].includes(ext))
    throw Error(
      'Extraction supports PDF, DOCX, XLSX, TXT and CSV. Add a manual excerpt for other files.',
    );
  return new Promise((resolve, reject) => {
    const child = spawn(
      'python3',
      [fileURLToPath(new URL('./extract-gate-source.py', import.meta.url)), ext],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let output = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(Error('Extraction timed out. Add a manual excerpt.'));
    }, 30000);
    child.stdout.on('data', (c) => {
      output += c;
      if (output.length > 4000000) {
        child.kill();
      }
    });
    child.stderr.resume();
    child.stdin.on('error', () => {});
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      try {
        if (code !== 0)
          throw Error('Could not read this file. Add a manual excerpt or upload a readable copy.');
        const extracted=JSON.parse(output);
        const blocks=extracted.text.split(/(?=^PDF page \d+\n|^Sheet:)/m);
        const all=blocks.flatMap((block,i)=>splitEvidence(block,block.match(/^(?:PDF page \d+|Sheet:[^\n]+)/)?.[0]||`Document excerpt ${i+1}`));
        const chunks=selectEvidenceChunks(all,100000);
        const selected=selectEvidenceChunks(chunks,evidenceBudget-1000);
        const selectedText=selected.map(c=>c.locator+'\n'+c.text).join('\n\n');
        resolve({...extracted,text:extracted.text.length<=evidenceBudget?extracted.text:selectedText,chunks,retrievalVersion:2,truncated:extracted.truncated||extracted.text.length>evidenceBudget,warning:extracted.warning||(extracted.truncated?'Text exceeds the extraction limit; check the original for omitted content.':extracted.text.length>evidenceBudget?'Relevant excerpts selected across the document. Check original pages for full context.':'')});
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.end(bytes);
  });
}
export async function researchCompany(symbol, request = fetch, market = refresh) {
  const snapshot = await market();
  const company = snapshot.companies.find((c) => c.symbol === symbol);
  if (!company) throw Error('Select a supported MSX peer.');
  const sources = [
    {
      title: company.name + ' on MSX',
      url: company.source,
      fetchedAt: company.fetchedAt,
      asOf: company.quote?.at || '',
      text: `${company.name} (${symbol}). Quoted share price: OMR ${company.quote?.price}. Quote date: ${company.quote?.at}. This listed peer is not the opportunity company.`,
      warning: company.error || 'Exchange prices may be delayed.',
    },
  ];
  try {
    // Only the fixed company website from the server catalogue is fetched. Redirects are not followed.
    const res = await request(company.website, {
      redirect: 'error',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) throw Error();
    const html = (await limitedBody(res, 1000000)).toString('utf8');
    const text = html
      .replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 6000);
    if (!text) throw Error();
    sources.push({
      title: company.name + ' website',
      url: company.website,
      fetchedAt: new Date().toISOString(),
      asOf: 'Publication date not supplied',
      text,
      warning: 'Website excerpt. Confirm relevance and publication dates before using it.',
    });
  } catch {
    sources.push({
      title: company.name + ' website',
      url: company.website,
      fetchedAt: null,
      asOf: '',
      text: '',
      warning:
        'Website could not be retrieved. Open the source and add a dated research note manually.',
    });
  }
  return sources;
}
export async function handleGateOne(request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  const expected = `${url.protocol}//${request.headers.get('host') || url.host}`;
  if (origin && origin !== expected)
    return Response.json({ error: 'Open Gate 1 from the OFC site.' }, { status: 403 });
  try {
    const action = url.searchParams.get('action');
    if (action === 'extract') {
      const bytes = await limitedBody(request, 10 * 1024 * 1024);
      if (!bytes.length) throw Error('The file is empty.');
      return Response.json(await extractSource(bytes, url.searchParams.get('name') || ''));
    }
    const body = JSON.parse((await limitedBody(request, 100000)).toString());
    if (action === 'research')
      return Response.json({ sources: await researchCompany(body.symbol) });
    if (action === 'draft') {
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > evidenceBudget)
        throw Error('Provide up to 48,000 characters of source text.');
      const result = await reply(
        [
          {
            role: 'user',
            text: 'Prepare a concise opportunity overview using the supplied evidence only. Cover the business, products, operating model and documented gaps. Do not infer investment amounts, approvals or current performance. Return plain text. Identify the source file and locator for each factual paragraph.',
          },
        ],
        'Gate 1',
        process.env,
        fetch,
        [
          {
            id: 'gate-upload',
            entity: 'Opportunity source documents',
            locator: 'Uploaded document excerpts',
            text: body.text,
            path: 'Gate 1 uploads',
          },
        ],
      );
      // Keep the citation local to this workflow instead of implying a knowledge database record.
      return Response.json(
        {
          ...result.body,
          text: result.body.text?.replaceAll(
            '[Source](/api/knowledge/source?id=gate-upload)',
            '[Uploaded document excerpts]',
          ),
        },
        { status: result.status },
      );
    }
    throw Error('Unknown Gate 1 action.');
  } catch (e) {
    return Response.json({ error: e.message || 'Gate 1 request failed.' }, { status: 400 });
  }
}
