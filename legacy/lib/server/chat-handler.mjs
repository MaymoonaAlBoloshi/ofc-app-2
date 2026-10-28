import { reply } from './chat.mjs';
const LIMIT = 100000;
const json = (body, status) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** @param {Request} request
 * @param {(messages: any, department: any, pageContext?: any) => Promise<{status: number, body: object}>} respond
 */
export async function handleChat(request, respond = reply) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  // Next.js can normalize request.url to localhost; Host retains the browser address.
  const host = request.headers.get('host');
  const expectedOrigin = host ? `${requestUrl.protocol}//${host}` : requestUrl.origin;
  if (origin && origin !== expectedOrigin)
    return json({ error: 'Open Siraaj from the OFC site.' }, 403);
  if (Number(request.headers.get('content-length')) > LIMIT)
    return json({ error: 'This conversation is too long. Start a new conversation.' }, 413);
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > LIMIT) {
          await reader.cancel();
          return json({ error: 'This conversation is too long. Start a new conversation.' }, 413);
        }
        chunks.push(value);
      }
    } catch {
      return json({ error: 'Invalid chat request.' }, 400);
    } finally {
      reader.releaseLock();
    }
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch {
    return json({ error: 'Invalid chat request.' }, 400);
  }
  const result = await respond(body.messages, body.department, body.pageContext);
  return json(result.body, result.status);
}
