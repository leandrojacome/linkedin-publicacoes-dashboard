import fs from 'node:fs';
import path from 'node:path';

export const projectRoot = process.env.CONTENT_ROOT
  ? path.resolve(process.env.CONTENT_ROOT)
  : path.resolve(import.meta.dirname, '..', '..');
export const postsRoot = path.join(projectRoot, 'publicacoes');
const activeState = 'C:\\Users\\leand\\Documents\\Codex\\2026-09-17\\posts-tecnologia-linkedin\\outputs\\state.json';
const snapshotState = path.join(projectRoot, 'contexto', 'state-snapshot-2026-09-24.json');
export const statePath = process.env.EDITORIAL_STATE_PATH || (fs.existsSync(activeState) ? activeState : snapshotState);

const macMeta = {
  '01-dotnet-eol': ['.NET 8/9: end of support', 'dotnet', 'published_confirmed', 'https://www.linkedin.com/feed/update/urn:li:activity:7508645483628707840/'],
  '02-dependency-inversion': ['Dependency Inversion', 'architecture', 'prepared', ''],
  '03-python-persian-docs': ['Python documentation in Persian', 'python', 'prepared', ''],
  '04-ai-assisted-cicd': ['AI-assisted CI/CD', 'devops', 'prepared', ''],
  '05-data-leakage': ['Data leakage and validation', 'data', 'prepared', ''],
  '06-ai-scientific-discovery': ['AI in scientific discovery', 'ai', 'prepared', ''],
  '07-java-27': ['Java 27: compact object headers', 'java', 'prepared', ''],
  '08-node-22-23-3': ['Node.js 22.23.3 LTS', 'nodejs', 'prepared', ''],
  '09-go-1-27': ['Go 1.27: allocations', 'go', 'prepared', ''],
  '10-cicd-security': ['CI/CD security', 'security', 'prepared', ''],
  '11-nuget-certificate': ['NuGet signing certificate transition', 'dotnet', 'prepared', ''],
  '12-google-agentic-architect': ['Agentic Architect certification', 'certifications', 'published_confirmed', ''],
  '13-spring-batch-6-1-0-m2': ['Spring Batch 6.1.0-M2', 'java', 'published_confirmed', 'https://www.linkedin.com/feed/update/urn:li:activity:7509029996695367680/']
};

function topicOf(item, slug) {
  const s = `${item.topic || ''} ${slug}`.toLowerCase();
  if (/java|spring|quarkus/.test(s)) return 'java';
  if (/golang|^go-|go\//.test(s)) return 'go';
  if (/node|npm|next\.js|nestjs/.test(s)) return 'nodejs';
  if (/\.net|dotnet|nuget/.test(s)) return 'dotnet';
  if (/python/.test(s)) return 'python';
  if (/security|seguran/.test(s)) return 'security';
  if (/devops|docker|ci\/cd|cicd/.test(s)) return 'devops';
  if (/data|dados/.test(s)) return 'data';
  if (/certif/.test(s)) return 'certifications';
  if (/architect|arquitet/.test(s)) return 'architecture';
  if (/ai|agent|ia/.test(s)) return 'ai';
  return 'other';
}

export function isC2paPng(file) {
  if (!file || !fs.existsSync(file)) return true;
  const b = fs.readFileSync(file);
  if (b.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return true;
  let offset = 8;
  while (offset + 12 <= b.length) {
    const length = b.readUInt32BE(offset);
    const type = b.toString('ascii', offset + 4, offset + 8);
    if (type === 'caBX' || type === 'jumb') return true;
    offset += length + 12;
    if (type === 'IEND') break;
  }
  return b.includes(Buffer.from('c2pa'));
}

function macPostBody(raw) {
  const heading=/\*\*LinkedIn post[^\n]*\*\*/i.exec(raw);
  if(!heading)return raw;
  let body=raw.slice(heading.index+heading[0].length).trim();
  const endings=[/\n\*\*Sources\*\*/i,/\n\*\*Original English image\*\*/i,/\nThe original [^\n]*image is ready/i,/\nNothing has been published/i,/\n<heartbeat>/i];
  const cuts=endings.map(re=>re.exec(body)?.index).filter(x=>x!==undefined);
  if(cuts.length)body=body.slice(0,Math.min(...cuts)).trim();
  return body;
}

export function readCatalog() {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const records = new Map([...state.queue, ...state.publication_history].map(x => [x.id, x]));
  const result = [];
  for (const dir of fs.readdirSync(postsRoot, {withFileTypes: true})) {
    if (!dir.isDirectory()) continue;
    const id = dir.name;
    const folder = path.join(postsRoot, id);
    if (id.startsWith('mac-')) {
      const key = id.slice(4);
      if (key === '13-spring-batch-6-1-0-m2') continue;
      const meta = macMeta[key];
      if (!meta) continue;
      const coverName = fs.existsSync(path.join(folder, 'cover-editorial.png')) ? 'cover-editorial.png' : 'cover-original-c2pa.png';
      const coverFile = path.join(folder, coverName);
      const reviewStatus=key==='09-go-1-27'?'duplicate_blocked':meta[2]==='prepared'?'needs_editorial_review':meta[2];
      result.push({id,title:meta[0],topic:meta[1],status:reviewStatus,permalink:meta[3],origin:'Mac',body:macPostBody(fs.readFileSync(path.join(folder,'publicacao.md'),'utf8')),sourceUrl:'',coverName,coverFile,coverSafe:!isC2paPng(coverFile)});
    } else {
      let item = records.get(id);
      const publicationFile = path.join(folder, 'publication.json');
      if (!item && fs.existsSync(publicationFile)) {
        const publication = JSON.parse(fs.readFileSync(publicationFile, 'utf8'));
        item = {
          id,
          product: publication.product || publication.title || id,
          topic: publication.topic || '',
          status: publication.status || 'prepared',
          permalink: publication.permalink || null,
          source_url: publication.source_url || '',
          image_file: publication.image_file || 'cover.png'
        };
      }
      if (!item) continue;
      const coverName = fs.existsSync(path.join(folder, 'cover-editorial.png')) ? 'cover-editorial.png' : (path.basename(item.image_file || 'cover.png'));
      const coverFile = path.join(folder,coverName);
      result.push({id,title:item.product || id,topic:topicOf(item,id),status:item.status,permalink:item.permalink || '',origin:'Windows',body:fs.existsSync(path.join(folder,'post.txt')) ? fs.readFileSync(path.join(folder,'post.txt'),'utf8') : '',sourceUrl:item.source_url || '',coverName,coverFile,coverSafe:!isC2paPng(coverFile)});
    }
  }
  return result;
}
