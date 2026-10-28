export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expected = `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (origin && origin !== expected)
    throw Error("Open this action from the OFC app.");
}
export async function bodyBytes(request, max = 2 * 1024 * 1024) {
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  let total = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > max) {
        await reader.cancel();
        throw Error("This upload exceeds the size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export function failure(e) {
  return Response.json(
    { error: e.message || "The action failed. Please retry." },
    { status: /changed/.test(e.message) ? 409 : 400 },
  );
}
