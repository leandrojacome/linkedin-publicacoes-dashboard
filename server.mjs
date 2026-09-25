import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import next from 'next';
import {db,listPosts,syncCatalog} from './lib/db.mjs';
import {linkedinReady,dispatchDue} from './lib/publisher.mjs';
import {postsRoot,statePath,isC2paPng} from './lib/catalog.mjs';

const port=Number(process.env.PORT || 5682);
const hostname=process.env.HOSTNAME || '127.0.0.1';
const publicMode=process.env.PUBLIC_MODE==='true';
const dev=!process.argv.includes('--production');
const app=next({dev,dir:import.meta.dirname});
const handle=app.getRequestHandler();
await app.prepare();
syncCatalog();

function send(res,status,data) {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req) {let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20000)throw new Error('Request too large');}return JSON.parse(raw||'{}');}
function validateAt(value) {const t=new Date(value);return Number.isFinite(t.getTime())?t.toISOString():null;}
function nearbyDispatch(runAt,exceptId=null) {
  const rows=db.prepare("SELECT id,run_at FROM dispatches WHERE state IN ('pending','blocked_auth','dispatching','submitted_unconfirmed','uncertain')").all();
  return rows.find(x=>x.id!==exceptId && Math.abs(Date.parse(x.run_at)-Date.parse(runAt))<60*60*1000);
}
function recordLocalDispatch(postId,dispatchId,runAt,stateName) {
  if(!fs.existsSync(statePath) || !statePath.toLowerCase().endsWith('state.json'))return;
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  const item=state.queue?.find(x=>x.id===postId);
  if(!item)return;
  item.local_dispatch={id:dispatchId,state:stateName,run_at:runAt,backend:'E:/Workspace/Publicacoes/dashboard-app',platform_scheduled:false,linkedin_connected:linkedinReady()};
  for(const slot of state.reserved_slots||[])if(slot.item_id===postId){slot.local_dispatch_id=dispatchId;slot.platform_scheduled=false;}
  const temp=`${statePath}.dashboard-${process.pid}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n','utf8');
  fs.renameSync(temp,statePath);
}

const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    if(url.pathname==='/api/health' && req.method==='GET')return send(res,200,{ok:true,mode:publicMode?'public':'operator'});
    if(url.pathname==='/api/status' && req.method==='GET')return send(res,200,{linkedinConnected:!publicMode&&linkedinReady(),schedulerRunning:!publicMode,publicMode,port});
    if(url.pathname==='/api/posts' && req.method==='GET')return send(res,200,{posts:listPosts()});
    if(url.pathname.startsWith('/api/covers/') && req.method==='GET'){
      const id=decodeURIComponent(url.pathname.slice('/api/covers/'.length));
      if(!/^[a-z0-9-]+$/.test(id))return send(res,400,{error:'Invalid post'});
      const row=db.prepare('SELECT cover_file FROM posts WHERE id=?').get(id);
      if(!row || !path.resolve(row.cover_file).startsWith(path.resolve(postsRoot)+path.sep))return send(res,404,{error:'Cover not found'});
      const file=row.cover_file;if(!fs.existsSync(file))return send(res,404,{error:'Cover not found'});
      res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);return;
    }
    if(url.pathname==='/api/dispatches' && req.method==='POST'){
      if(publicMode)return send(res,403,{error:'Public catalog is read-only'});
      const data=await body(req);
      const post=db.prepare('SELECT * FROM posts WHERE id=?').get(data.postId);
      if(!post)return send(res,404,{error:'Post not found'});
      if(post.status==='published_confirmed')return send(res,409,{error:'This post is already published'});
      if(post.status!=='prepared')return send(res,409,{error:'Editorial review is required before this post can be scheduled or published'});
      if(!post.cover_safe || isC2paPng(post.cover_file))return send(res,409,{error:'Choose a new cover without C2PA before dispatch'});
      if(data.mode!=='now' && data.mode!=='schedule')return send(res,400,{error:'Invalid mode'});
      if(data.mode==='now' && !linkedinReady())return send(res,503,{error:'LinkedIn publishing is not connected. No post was sent.'});
      const at=data.mode==='now'?new Date().toISOString():validateAt(data.runAt);
      if(!at || (data.mode==='schedule' && at<=new Date().toISOString()))return send(res,400,{error:'Choose a future date and time'});
      const nearby=nearbyDispatch(at);
      if(nearby)return send(res,409,{error:`Another request is within 60 minutes of this time (dispatch ${nearby.id})`});
      const duplicate=db.prepare(`SELECT id,state FROM dispatches WHERE post_id=? AND state IN ('pending','dispatching','submitted_unconfirmed','blocked_auth','uncertain') LIMIT 1`).get(data.postId);
      if(duplicate)return send(res,409,{error:`An active request already exists (${duplicate.state})`});
      const now=new Date().toISOString();
      const result=db.prepare('INSERT INTO dispatches(post_id,mode,run_at,state,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(data.postId,data.mode,at,'pending',now,now);
      recordLocalDispatch(data.postId,Number(result.lastInsertRowid),at,'pending');
      if(data.mode==='now')void dispatchDue();
      return send(res,201,{id:Number(result.lastInsertRowid),state:'pending',runAt:at,linkedinConnected:linkedinReady()});
    }
    const match=url.pathname.match(/^\/api\/dispatches\/(\d+)$/);
    if(match && req.method==='PATCH'){
      if(publicMode)return send(res,403,{error:'Public catalog is read-only'});
      const data=await body(req);const at=validateAt(data.runAt);if(!at||at<=new Date().toISOString())return send(res,400,{error:'Choose a future date and time'});
      const row=db.prepare('SELECT * FROM dispatches WHERE id=?').get(Number(match[1]));
      if(!row || !['pending','blocked_auth'].includes(row.state))return send(res,409,{error:'This schedule cannot be changed'});
      const nearby=nearbyDispatch(at,row.id);
      if(nearby)return send(res,409,{error:`Another request is within 60 minutes of this time (dispatch ${nearby.id})`});
      db.prepare("UPDATE dispatches SET run_at=?,state='pending',updated_at=?,error=NULL WHERE id=?").run(at,new Date().toISOString(),row.id);
      recordLocalDispatch(row.post_id,row.id,at,'pending');
      return send(res,200,{id:row.id,runAt:at,state:'pending'});
    }
    if(match && req.method==='DELETE'){
      if(publicMode)return send(res,403,{error:'Public catalog is read-only'});
      const row=db.prepare('SELECT * FROM dispatches WHERE id=?').get(Number(match[1]));
      if(!row || !['pending','blocked_auth'].includes(row.state))return send(res,409,{error:'This request cannot be cancelled'});
      db.prepare("UPDATE dispatches SET state='cancelled',updated_at=? WHERE id=?").run(new Date().toISOString(),row.id);
      recordLocalDispatch(row.post_id,row.id,row.run_at,'cancelled');
      return send(res,200,{id:row.id,state:'cancelled'});
    }
    return handle(req,res);
  } catch(error){return send(res,500,{error:String(error.message||error)});}
});
server.listen(port,hostname,()=>console.log(`LinkedIn dashboard listening on http://${hostname}:${port}`));
if(!publicMode)setInterval(()=>void dispatchDue(),15000).unref();
