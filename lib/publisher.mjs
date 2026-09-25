import fs from 'node:fs';
import {db,syncCatalog} from './db.mjs';
import {statePath,isC2paPng} from './catalog.mjs';

export const linkedinReady=()=>Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_MEMBER_URN);

function setDispatch(id,state,error='',platformId='') {
  db.prepare('UPDATE dispatches SET state=?,error=?,platform_post_id=?,updated_at=? WHERE id=?')
    .run(state,error,platformId,new Date().toISOString(),id);
  if (!fs.existsSync(statePath) || !statePath.toLowerCase().endsWith('state.json')) return;
  const row=db.prepare('SELECT post_id,run_at FROM dispatches WHERE id=?').get(id);
  if (!row) return;
  const current=JSON.parse(fs.readFileSync(statePath,'utf8'));
  const item=current.queue?.find(p=>p.id===row.post_id);
  if (!item) return;
  item.local_dispatch={id,state,run_at:row.run_at,backend:'E:/Workspace/Publicacoes/dashboard-app',platform_scheduled:false,linkedin_connected:linkedinReady(),error:error||null};
  const temp=`${statePath}.publisher-${process.pid}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(current,null,2)+'\n','utf8');
  fs.renameSync(temp,statePath);
}

function updateOperationalState(postId,platformId) {
  if (!fs.existsSync(statePath) || !statePath.toLowerCase().endsWith('state.json')) return;
  const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
  const item=state.queue?.find(p=>p.id===postId);
  if (!item) return;
  item.status='submitted_unconfirmed';
  item.publication_attempted=true;
  item.submitted_at=new Date().toISOString();
  item.platform_post_id=platformId;
  item.next_action='Check the LinkedIn profile and scheduled posts; obtain the canonical permalink before marking published_confirmed. Never resend this submission without verification.';
  for(const slot of state.reserved_slots||[])if(slot.item_id===postId)slot.status='submitted_unconfirmed';
  const temp=`${statePath}.dashboard-tmp-${process.pid}`;
  fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n',{encoding:'utf8'});
  fs.renameSync(temp,statePath);
}

async function checkedFetch(url,options) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(25000)});
  if (!response.ok) {
    const body=(await response.text()).slice(0,500);
    throw new Error(`LinkedIn HTTP ${response.status}: ${body}`);
  }
  return response;
}

async function publishLinkedIn(post) {
  if (!linkedinReady()) throw new Error('LinkedIn API is not connected');
  if (!post.cover_safe || isC2paPng(post.cover_file)) throw new Error('Cover has C2PA or is not a valid PNG');
  const token=process.env.LINKEDIN_ACCESS_TOKEN;
  const author=process.env.LINKEDIN_MEMBER_URN;
  const auth={'Authorization':`Bearer ${token}`,'X-Restli-Protocol-Version':'2.0.0'};
  const init=await checkedFetch('https://api.linkedin.com/v2/assets?action=registerUpload',{
    method:'POST',headers:{...auth,'Content-Type':'application/json'},
    body:JSON.stringify({registerUploadRequest:{recipes:['urn:li:digitalmediaRecipe:feedshare-image'],owner:author,serviceRelationships:[{relationshipType:'OWNER',identifier:'urn:li:userGeneratedContent'}]}})
  });
  const value=(await init.json()).value;
  const mechanism=value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
  if(!value?.asset || !mechanism?.uploadUrl)throw new Error('LinkedIn did not return an image upload URL');
  await checkedFetch(mechanism.uploadUrl,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'image/png'},body:fs.readFileSync(post.cover_file)});
  const share={author,lifecycleState:'PUBLISHED',specificContent:{'com.linkedin.ugc.ShareContent':{
    shareCommentary:{text:post.body},shareMediaCategory:'IMAGE',media:[{status:'READY',media:value.asset,title:{text:post.title}}]
  }},visibility:{'com.linkedin.ugc.MemberNetworkVisibility':'PUBLIC'}};
  const response=await checkedFetch('https://api.linkedin.com/v2/ugcPosts',{
    method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify(share)
  });
  const id=response.headers.get('x-restli-id');
  if(!id)throw new Error('LinkedIn accepted the request but returned no post ID; check the profile before any retry');
  return id;
}

let busy=false;
export async function dispatchDue() {
  if(busy)return;
  busy=true;
  try {
    syncCatalog();
    const lastSent=db.prepare("SELECT updated_at FROM dispatches WHERE state='submitted_unconfirmed' ORDER BY updated_at DESC LIMIT 1").get();
    if(lastSent && Date.now()-Date.parse(lastSent.updated_at)<60*60*1000)return;
    if(fs.existsSync(statePath) && statePath.toLowerCase().endsWith('state.json')){
      const editorial=JSON.parse(fs.readFileSync(statePath,'utf8'));
      if((editorial.publication_history||[]).some(p=>p.published_at && Date.now()-Date.parse(p.published_at)<60*60*1000))return;
    }
    const due=db.prepare(`SELECT d.id AS dispatch_id,d.post_id,p.* FROM dispatches d JOIN posts p ON p.id=d.post_id
      WHERE (d.state='pending' OR (?=1 AND d.state='blocked_auth')) AND d.run_at<=? ORDER BY d.run_at LIMIT 1`).get(linkedinReady()?1:0,new Date().toISOString());
    if(!due)return;
    if(!linkedinReady()) {setDispatch(due.dispatch_id,'blocked_auth','Connect a LinkedIn developer app with w_member_social before dispatch');return;}
    if(due.status==='published_confirmed') {setDispatch(due.dispatch_id,'cancelled','Post already published');return;}
    setDispatch(due.dispatch_id,'dispatching');
    try {
      const platformId=await publishLinkedIn(due);
      setDispatch(due.dispatch_id,'submitted_unconfirmed','LinkedIn API accepted the post; visual profile confirmation and canonical permalink remain pending',platformId);
      updateOperationalState(due.post_id,platformId);
    } catch(error) {
      // A timeout after upload or post submission is uncertain. Never auto-retry.
      setDispatch(due.dispatch_id,'uncertain',String(error.message||error).slice(0,1000));
    }
  } finally {busy=false;}
}
