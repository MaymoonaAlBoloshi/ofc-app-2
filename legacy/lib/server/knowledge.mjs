import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync, copyFileSync, constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function openKnowledge(
  filename = process.env.OFC2_APPLET_DB || path.resolve('data/applets/siraaj.sqlite'),
) {
  mkdirSync(path.dirname(filename), { recursive: true });
  const seed = path.resolve('fixtures/applets/siraaj.sqlite');
  if (!process.env.OFC2_APPLET_DB && filename === path.resolve('data/applets/siraaj.sqlite') && !existsSync(filename) && existsSync(seed)) {
    try { copyFileSync(seed, filename, constants.COPYFILE_EXCL); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, path TEXT NOT NULL, hash TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY, document_id TEXT NOT NULL, entity TEXT NOT NULL, locator TEXT NOT NULL, text TEXT NOT NULL, kind TEXT NOT NULL);
    CREATE VIRTUAL TABLE IF NOT EXISTS evidence_search USING fts5(id UNINDEXED, entity, text, tokenize='unicode61');
    CREATE TABLE IF NOT EXISTS financial_facts(entity TEXT, period TEXT, scenario TEXT, value REAL NOT NULL, source_id TEXT NOT NULL, locator TEXT NOT NULL, PRIMARY KEY(entity,period,scenario));
    CREATE TABLE IF NOT EXISTS source_tasks(id TEXT PRIMARY KEY, entity TEXT, title TEXT, status TEXT, priority TEXT, owner TEXT);
    CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, scope_json TEXT NOT NULL, snapshot_json TEXT NOT NULL, created_at TEXT NOT NULL, current_version INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS report_versions(report_id TEXT NOT NULL, version INTEGER NOT NULL, content_json TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(report_id,version));
    CREATE TABLE IF NOT EXISTS actions(id TEXT PRIMARY KEY, title TEXT NOT NULL, owner TEXT NOT NULL, due TEXT NOT NULL, evidence_ids TEXT NOT NULL, created_at TEXT NOT NULL);
  `);
  return db;
}
export function source(db, id) {
  return db
    .prepare(
      `SELECT e.*, d.path, d.status, d.hash FROM evidence e JOIN documents d ON d.id=e.document_id WHERE e.id=?`,
    )
    .get(id);
}
export function retrieve(db, query) {
  const entities = db
    .prepare("SELECT DISTINCT entity FROM evidence WHERE entity != 'OFC'")
    .all()
    .map((x) => x.entity);
  const upper = query.toUpperCase();
  const mentions = entities
    .flatMap((entity) => {
      const escaped = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return [...upper.matchAll(new RegExp(`\\b${escaped}\\b`, 'gi'))].map((match) => ({
        entity,
        index: match.index,
      }));
    })
    .sort((a, b) => b.index - a.index);
  const entity =
    mentions[0]?.entity ||
    (/livestock|العمانية.*الثروة|الثروة الحيوانية/i.test(query) ? 'ONLDC' : null);
  const expanded =
    query +
    (/إيراد|ميزاني|موازنة|فبراير|أداء/.test(query) ? ' revenue budget February performance' : '') +
    (/مهام|حرج|إجراء/.test(query) ? ' critical task action' : '');
  const stop = new Set(
    'the a an is are what how did does do of for to in me about and with on through please can you tell have we our'.split(
      ' ',
    ),
  );
  const tokens = [...new Set(expanded.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])]
    .filter((t) => t.length > 1 && !stop.has(t))
    .slice(0, 35);
  let hits = [];
  if (tokens.length)
    hits = db
      .prepare(
        `SELECT e.id FROM evidence_search f JOIN evidence e ON e.id=f.id WHERE evidence_search MATCH ? AND (? IS NULL OR e.entity=? OR e.entity='OFC') ORDER BY bm25(evidence_search) LIMIT 16`,
      )
      .all(tokens.map((t) => `"${t}"`).join(' OR '), entity, entity);
  const ids = new Set(['coverage', ...hits.map((x) => x.id)]);
  // Include reviewed comparable periods as a group, so retrieval cannot mix month and YTD.
  if (
    entity === 'ONLDC' &&
    /revenue|budget|performance|brief|summary|إيراد|أداء|موازنة|ميزاني/i.test(expanded)
  )
    ids.add('onldc-revenue-feb-2026');
  if (entity === 'ONLDC' && /task|action|critical|outstanding|مهام|حرج/i.test(expanded)) {
    db.prepare("SELECT id FROM evidence WHERE entity='ONLDC' AND kind='tracker'")
      .all()
      .forEach((x) => ids.add(x.id));
  }
  return [...ids]
    .map((id) => source(db, id))
    .filter(Boolean)
    .slice(0, 25);
}
export function knowledgeStatus(db) {
  return {
    documents: db.prepare('SELECT count(*) AS n FROM documents').get().n,
    evidence: db.prepare('SELECT count(*) AS n FROM evidence').get().n,
    indexedDocuments: db.prepare('SELECT count(DISTINCT document_id) AS n FROM evidence').get().n,
    coverage: 'ONLDC financial actuals through February 2026. Tracker snapshot date unconfirmed.',
    documentsByStatus: db
      .prepare('SELECT status, count(*) AS count FROM documents GROUP BY status')
      .all(),
  };
}
export function listActions(db) {
  return db
    .prepare('SELECT * FROM actions ORDER BY created_at DESC')
    .all()
    .map((x) => ({ ...x, evidence_ids: JSON.parse(x.evidence_ids) }));
}
export function createAction(db, input) {
  if (!input || typeof input !== 'object' || input.confirm !== true)
    throw Error('Review the task and confirm saving it.');
  const { id, title, owner, due, evidence_ids: ids } = input;
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id))
    throw Error('Invalid task identifier.');
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 300 ||
    typeof owner !== 'string' ||
    !owner.trim() ||
    owner.length > 100
  )
    throw Error('Enter a task title and owner.');
  if (
    typeof due !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
    !Number.isFinite(Date.parse(due)) ||
    new Date(due).toISOString().slice(0, 10) !== due
  )
    throw Error('Enter a valid due date.');
  if (
    !Array.isArray(ids) ||
    ids.length > 25 ||
    ids.some((id) => typeof id !== 'string' || !source(db, id))
  )
    throw Error('Invalid evidence reference.');
  const previous = db.prepare('SELECT * FROM actions WHERE id=?').get(id);
  if (previous) {
    if (
      previous.title !== title.trim() ||
      previous.owner !== owner.trim() ||
      previous.due !== due ||
      previous.evidence_ids !== JSON.stringify(ids)
    )
      throw Error('This task identifier was already used for a different task.');
    return previous;
  }
  db.prepare('INSERT INTO actions VALUES (?,?,?,?,?,?)').run(
    id || randomUUID(),
    title.trim(),
    owner.trim(),
    due,
    JSON.stringify(ids),
    new Date().toISOString(),
  );
  return db.prepare('SELECT * FROM actions WHERE id=?').get(id);
}
