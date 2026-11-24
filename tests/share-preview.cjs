const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const imageUrl='https://www.houstonodorpros.com/assets/houston-odor-pros-social-logo-20261124-v2.png';
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!e.name.startsWith('.')&&e.name!=='assets'?files(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
function decode(value){return value.replace(/&(?:amp|quot|apos|lt|gt|#039|#39);/g,s=>({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&#039;':"'",'&#39;':"'"}[s]));}
function attrs(tag){return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(m=>[m[1].toLowerCase(),decode(m[2])]));}
function read(html){const meta={};for(const [tag]of html.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(tag),key=a.property||a.name;if(!key)continue;if(/^(og:|twitter:)/.test(key))assert.ok(!(key in meta),`Duplicate sharing tag ${key}`);meta[key]=a.content;}const link=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a.rel==='canonical');return{meta,canonical:link?.href};}
function verify(html,expectedCanonical){const {meta,canonical}=read(html);assert.equal(canonical,expectedCanonical);for(const key of ['og:image','og:image:secure_url','twitter:image'])assert.equal(meta[key],imageUrl,key);assert.equal(meta['og:image:type'],'image/png');assert.equal(meta['og:image:width'],'1200');assert.equal(meta['og:image:height'],'630');assert.equal(meta['og:url'],canonical);assert.equal(meta['twitter:card'],'summary_large_image');for(const key of ['og:title','og:description','og:image:alt','twitter:image:alt'])assert.ok(meta[key]?.trim(),key);assert.equal(meta['twitter:title'],meta['og:title']);assert.equal(meta['twitter:description'],meta['og:description']);return meta;}
function checkPng(bytes){assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);}
(async()=>{
 const pages=files(root).filter(p=>!fs.readFileSync(p,'utf8').includes('http-equiv="refresh"'));
 for(const p of pages){const html=fs.readFileSync(p,'utf8');verify(html,read(html).canonical);}
 checkPng(fs.readFileSync(path.join(root,'assets',path.basename(imageUrl))));
 console.log(`PASS: ${pages.length} local public pages; unique complete Open Graph/Twitter tags, per-page canonical URLs, full-logo PNG 1200x630.`);
 if(process.argv.includes('--live')){
  const results=await Promise.all(pages.map(async p=>{
   const local=fs.readFileSync(p,'utf8'),{canonical,meta}=read(local);
   const response=await fetch(canonical+'?share=2',{signal:AbortSignal.timeout(30000)});
   assert.equal(response.status,200,canonical);assert.match(response.headers.get('content-type')||'',/text\/html/);
   const live=verify(await response.text(),canonical);
   for(const key of ['og:title','og:description'])assert.equal(live[key],meta[key],`${canonical} ${key}`);
   return{url:canonical,status:response.status};
  }));
  const image=await fetch(imageUrl,{signal:AbortSignal.timeout(30000)});
  assert.equal(image.status,200);assert.match(image.headers.get('content-type')||'',/^image\/png(?:;|$)/);
  checkPng(Buffer.from(await image.arrayBuffer()));
  console.log(JSON.stringify({pages:results,image:{url:imageUrl,status:image.status,contentType:image.headers.get('content-type'),width:1200,height:630}},null,2));
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
