import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readCatalog} from './catalog.mjs';

const dataDir = path.resolve(import.meta.dirname, '..', 'data');
fs.mkdirSync(dataDir,{recursive:true});
export const db = new DatabaseSync(path.join(dataDir,'publicacoes.sqlite'));
db.exec('PRAGMA journal_mode=WAL');
db.exec(`CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,topic TEXT NOT NULL,origin TEXT NOT NULL,
 body TEXT NOT NULL,source_url TEXT,cover_file TEXT NOT NULL,cover_safe INTEGER NOT NULL,
 status TEXT NOT NULL,permalink TEXT,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS dispatches (
 id INTEGER PRIMARY KEY AUTOINCREMENT,post_id TEXT NOT NULL REFERENCES posts(id),
 mode TEXT NOT NULL CHECK(mode IN ('now','schedule')),run_at TEXT NOT NULL,
 state TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 platform_post_id TEXT,error TEXT
);
CREATE INDEX IF NOT EXISTS dispatch_due ON dispatches(state,run_at);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_dispatch_per_post ON dispatches(post_id)
 WHERE state IN ('pending','dispatching','submitted_unconfirmed','blocked_auth','uncertain');`);

export function syncCatalog() {
  const stmt=db.prepare(`INSERT INTO posts(id,title,topic,origin,body,source_url,cover_file,cover_safe,status,permalink,updated_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,topic=excluded.topic,
  origin=excluded.origin,body=excluded.body,source_url=excluded.source_url,cover_file=excluded.cover_file,
  cover_safe=excluded.cover_safe,status=excluded.status,permalink=excluded.permalink,updated_at=excluded.updated_at`);
  const now=new Date().toISOString();
  for(const p of readCatalog())stmt.run(p.id,p.title,p.topic,p.origin,p.body,p.sourceUrl,p.coverFile,p.coverSafe?1:0,p.status,p.permalink,now);
}

export function listPosts() {
  syncCatalog();
  return db.prepare(`SELECT p.id,p.title,p.topic,p.origin,p.body,p.source_url AS sourceUrl,p.cover_safe AS coverSafe,
  p.status,p.permalink,d.id AS dispatchId,d.mode,d.run_at AS runAt,d.state AS dispatchState,d.error
  FROM posts p LEFT JOIN dispatches d ON d.id=(SELECT id FROM dispatches WHERE post_id=p.id ORDER BY id DESC LIMIT 1)
  ORDER BY CASE WHEN p.status='published_confirmed' THEN 1 ELSE 0 END,p.topic,p.title`).all();
}
