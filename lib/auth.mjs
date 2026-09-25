import crypto from 'node:crypto';
import fs from 'node:fs';

const user=process.env.PUBLICACOES_ADMIN_USER || 'leandro';
const maxAgeSeconds=8*60*60;

function secret(name){
  const file=process.env[`${name}_FILE`];
  if(file)return fs.readFileSync(file,'utf8').trim();
  return (process.env[name]||'').trim();
}

const passwordRecord=secret('PUBLICACOES_ADMIN_PASSWORD_HASH');
const sessionSecret=secret('PUBLICACOES_SESSION_SECRET');

export function assertAuthConfigured(){
  if(!passwordRecord || !sessionSecret)throw new Error('Operator mode requires admin password and session secrets');
}

export function verifyPassword(password){
  const [kind,saltB64,hashB64]=passwordRecord.split('$');
  if(kind!=='scrypt' || !saltB64 || !hashB64)return false;
  const salt=Buffer.from(saltB64,'base64url');
  const expected=Buffer.from(hashB64,'base64url');
  const actual=crypto.scryptSync(String(password),salt,expected.length,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return actual.length===expected.length && crypto.timingSafeEqual(actual,expected);
}

function signature(value){return crypto.createHmac('sha256',sessionSecret).update(value).digest('base64url')}

export function createSessionCookie(){
  const value=`${user}.${Date.now()+maxAgeSeconds*1000}`;
  return `publicacoes_session=${value}.${signature(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(){return 'publicacoes_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}

export function isAuthenticated(req){
  const found=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('publicacoes_session='));
  if(!found)return false;
  const token=found.slice('publicacoes_session='.length);
  const last=token.lastIndexOf('.');
  if(last<0)return false;
  const value=token.slice(0,last),provided=token.slice(last+1);
  const expected=signature(value);
  if(provided.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return false;
  const split=value.lastIndexOf('.');
  return value.slice(0,split)===user && Number(value.slice(split+1))>Date.now();
}

export const adminUser=user;
