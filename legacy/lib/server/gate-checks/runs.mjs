import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { runGateJourney, gateStages } from './journey.mjs';
const root = path.resolve('data/gate-checks');
const symbol = Symbol.for('ofc.gate-check-runs');
const state = globalThis[symbol] || (globalThis[symbol] = { jobs: new Map(), active: null });
const validId = (id) => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id);
function persist(job) {
  mkdirSync(path.join(root, job.id), { recursive: true });
  writeFileSync(path.join(root, job.id, 'result.json'), JSON.stringify(job));
  state.jobs.set(job.id, job);
}
export function gateCheckBaseURL() {
  const url = new URL(process.env.OFC_GATE_CHECK_URL || 'http://127.0.0.1:3001');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw Error('Gate checks must run against the local OFC app.');
  return url.origin;
}
export function getGateRun(id) {
  if (!validId(id)) return null;
  const running = state.jobs.get(id);
  if (running) return running;
  try {
    const job = JSON.parse(readFileSync(path.join(root, id, 'result.json'), 'utf8'));
    if (job.status === 'running') {
      job.status = 'interrupted';
      job.finishedAt = new Date().toISOString();
      for (const s of job.stages) {
        if (s.status === 'running') {
          s.status = 'failed';
          s.error = 'The app server restarted before this check finished.';
        } else if (s.status === 'pending') s.status = 'skipped';
      }
      persist(job);
    }
    return job;
  } catch {
    return null;
  }
}
export function startGateRun() {
  if (state.active) {
    const current = getGateRun(state.active);
    if (current?.status === 'running') return current;
  }
  const baseURL = gateCheckBaseURL();
  const job = {
    id: randomUUID(),
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    stages: gateStages.map((g) => ({
      ...g,
      status: 'pending',
      checks: [],
      error: null,
      screenshot: false,
    })),
    notes: [
      'Runs in a fresh browser context with test-only browser storage.',
      'Checks the demo workflow, not real-world approval authority or external document authenticity.',
    ],
  };
  persist(job);
  state.active = job.id;
  void runGateJourney({
    baseURL,
    artifactDir: path.join(root, job.id),
    onProgress: (value) => persist({ ...value, id: job.id }),
  })
    .catch((error) => {
      const current = getGateRun(job.id) || job;
      current.status = 'failed';
      current.finishedAt = new Date().toISOString();
      const stage = current.stages.find((s) => s.status === 'running' || s.status === 'pending');
      if (stage) {
        stage.status = 'failed';
        stage.error =
          'The test browser could not finish: ' + String(error.message || error).slice(0, 1500);
      }
      current.stages.filter((s) => s.status === 'pending').forEach((s) => (s.status = 'skipped'));
      persist(current);
    })
    .finally(() => {
      if (state.active === job.id) state.active = null;
    });
  return job;
}
export function gateScreenshot(id, gate) {
  const job = getGateRun(id);
  if (
    !job ||
    !gateStages.some((s) => s.id === gate) ||
    !job.stages.find((s) => s.id === gate)?.screenshot
  )
    return null;
  try {
    return readFileSync(path.join(root, id, gate + '.png'));
  } catch {
    return null;
  }
}
export function localGateRequest(request, write = false) {
  const url = new URL(request.url);
  let host;
  try {
    host = new URL(`${url.protocol}//${request.headers.get('host') || url.host}`);
  } catch {
    return false;
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host.hostname)) {
    const configured = process.env.OFC_PUBLIC_ORIGIN;
    if (!configured) return false;
    try {
      const publicUrl = new URL(configured);
      if (publicUrl.protocol !== 'https:' || host.origin !== publicUrl.origin) return false;
    } catch {
      return false;
    }
  }
  return !write || request.headers.get('origin') === host.origin;
}
