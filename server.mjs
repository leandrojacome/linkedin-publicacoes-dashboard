import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import next from 'next';
import {db,listPosts,syncCatalog} from './lib/db.mjs';
import {linkedinReady,dispatchDue} from './lib/publisher.mjs';
import {postsRoot,statePath,isC2paPng} from './lib/catalog.mjs';
import {adminUser,assertAuthConfigured,clearSessionCookie,createSessionCookie,isAuthenticated,verifyPassword} from './lib/auth.mjs';

const port=Number(process.env.PORT || 5682);
const hostname=process.env.HOSTNAME || '127.0.0.1';
const publicMode=process.env.PUBLIC_MODE==='true';
const publicOrigin=process.env.PUBLIC_ORIGIN || `http://${hostname}:${port}`;
const dev=!process.argv.includes('--production');
const app=next({dev,dir:import.meta.dirname});
const handle=app.getRequestHandler();
await app.prepare();
syncCatalog();
if(!publicMode)assertAuthConfigured();

function send(res,status,data) {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req) {let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20000)throw new Error('Request too large');}return JSON.parse(raw||'{}');}
async function form(req) {let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>5000)throw new Error('Request too large');}return new URLSearchParams(raw);}
const loginAttempts=new Map();
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
function loginAllowed(req){const now=Date.now(),ip=clientIp(req),entry=loginAttempts.get(ip);if(!entry||now-entry.since>15*60*1000){loginAttempts.set(ip,{since:now,count:0});return true;}return entry.count<5}
function recordLoginFailure(req){const ip=clientIp(req),entry=loginAttempts.get(ip)||{since:Date.now(),count:0};entry.count++;loginAttempts.set(ip,entry)}
function loginPage(res,error=''){
  const message=error?`<p role="alert">${error}</p>`:'';
  res.writeHead(error?401:200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Entrar · Publicações LinkedIn</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#07121e,#102b46);color:#eef6fb;font:16px/1.5 Segoe UI,Arial}.card{width:min(420px,calc(100% - 32px));padding:32px;border:1px solid #294660;border-radius:18px;background:#10243a;box-shadow:0 24px 70px #0007}h1{margin:0 0 8px;font-size:30px}p{color:#adc2cf}label{display:block;margin:20px 0 7px}input{width:100%;padding:12px;border:1px solid #42627b;border-radius:10px;background:#091b2c;color:#fff;font:inherit}button{width:100%;margin-top:22px;padding:12px;border:0;border-radius:10px;background:#70e3c2;color:#09251f;font-weight:800;font:inherit;cursor:pointer}[role=alert]{padding:10px;border-radius:9px;background:#5d2d2d;color:#ffd0d0}</style><main class="card"><h1>Publicações LinkedIn</h1><p>Painel privado de revisão e agendamento.</p>${message}<form method="post" action="/api/auth/login"><label for="username">Usuário</label><input id="username" name="username" autocomplete="username" required><label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" required><button type="submit">Entrar</button></form></main></html>`);
}
function sameOrigin(req){const origin=req.headers.origin;return !origin||origin===publicOrigin}
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
    if(!publicMode && url.pathname==='/login' && req.method==='GET')return isAuthenticated(req)?(res.writeHead(302,{Location:'/'}),res.end()):loginPage(res);
    if(!publicMode && url.pathname==='/api/auth/login' && req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'Invalid origin'});
      if(!loginAllowed(req))return loginPage(res,'Muitas tentativas. Aguarde 15 minutos.');
      const data=await form(req);
      if(data.get('username')!==adminUser || !verifyPassword(data.get('password')||'')){recordLoginFailure(req);return loginPage(res,'Usuário ou senha inválidos.');}
      loginAttempts.delete(clientIp(req));
      res.writeHead(303,{Location:'/', 'Set-Cookie':createSessionCookie(),'Cache-Control':'no-store'});res.end();return;
    }
    if(!publicMode && url.pathname==='/api/auth/logout' && req.method==='POST'){
      if(!sameOrigin(req))return send(res,403,{error:'Invalid origin'});
      res.writeHead(303,{Location:'/login','Set-Cookie':clearSessionCookie(),'Cache-Control':'no-store'});res.end();return;
    }
    if(!publicMode && !url.pathname.startsWith('/_next/') && url.pathname!=='/favicon.ico' && !isAuthenticated(req)){
      if(url.pathname.startsWith('/api/'))return send(res,401,{error:'Authentication required'});
      res.writeHead(302,{Location:'/login','Cache-Control':'no-store'});res.end();return;
    }
    if(!publicMode && req.method!=='GET' && req.method!=='HEAD' && !sameOrigin(req))return send(res,403,{error:'Invalid origin'});
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
    if(url.pathname==='/api/status' && req.method==='GET')return send(res,200,{linkedinConnected:!publicMode&&linkedinReady(),schedulerRunning:!publicMode,publicMode,port,user:publicMode?null:adminUser});
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
