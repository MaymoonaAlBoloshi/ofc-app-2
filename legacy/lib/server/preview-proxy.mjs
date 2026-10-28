import http from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';

export function createPreviewProxy({ username, password, appPort }) {
  const target = `http://127.0.0.1:${appPort}`;
  const expected = createHash('sha256')
    .update('Basic ' + Buffer.from(`${username}:${password}`).toString('base64'))
    .digest();
  const server = http.createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const supplied = createHash('sha256')
      .update(request.headers.authorization || '')
      .digest();
    if (!timingSafeEqual(supplied, expected)) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="OFC private preview", charset="UTF-8"',
        'Content-Type': 'text/plain',
      });
      return response.end('Enter the preview username and password.');
    }
    const origin = request.headers.origin;
    const safeNavigation =
      ['GET', 'HEAD'].includes(request.method) && request.headers['sec-fetch-mode'] === 'navigate';
    if (
      (request.headers['sec-fetch-site'] === 'cross-site' && !safeNavigation) ||
      (origin &&
        origin !== `https://${request.headers.host}` &&
        origin !== `http://${request.headers.host}`)
    ) {
      response.writeHead(403);
      return response.end('Open this request from the preview.');
    }
    const headers = { ...request.headers, host: `127.0.0.1:${appPort}` };
    for (const key of Object.keys(headers)) {
      if (
        key === 'authorization' ||
        key === 'forwarded' ||
        key.startsWith('x-forwarded-') ||
        key === 'connection' ||
        key === 'upgrade'
      )
        delete headers[key];
    }
    headers['x-forwarded-host'] = `127.0.0.1:${appPort}`;
    headers['x-forwarded-proto'] = 'http';
    if (origin) headers.origin = target;
    const upstream = http.request(
      { hostname: '127.0.0.1', port: appPort, path: request.url, method: request.method, headers },
      (reply) => {
        const outgoing = {
          ...reply.headers,
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow, noarchive',
          'referrer-policy': 'same-origin',
          'x-content-type-options': 'nosniff',
        };
        if (outgoing.location?.startsWith(target))
          outgoing.location = outgoing.location.slice(target.length) || '/';
        response.writeHead(reply.statusCode || 502, outgoing);
        reply.pipe(response);
      },
    );
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502);
      response.end('The preview app is unavailable.');
    });
    request.on('aborted', () => upstream.destroy());
    response.on('close', () => {
      if (!response.writableEnded) upstream.destroy();
    });
    request.pipe(upstream);
  });
  server.on('upgrade', (_request, socket) => socket.destroy());

  return server;
}
