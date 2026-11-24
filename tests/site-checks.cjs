const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!e.name.startsWith('.')&&e.name!=='assets'?files(path.join(dir,e.name)):e.isFile()&&e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
const pages=files(root); let links=0,schemas=0;
const metadata = html => [...html.matchAll(/<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g)].map(m=>m[0]);
for(const file of pages){
 const html=fs.readFileSync(file,'utf8'), rel=path.relative(root,file).replaceAll('\\','/');
 const old=cp.execFileSync('git',['show',`HEAD:${rel}`],{cwd:root,encoding:'utf8'});
 assert.deepEqual(metadata(html),metadata(old),`${rel}: SEO metadata changed`);
 for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){JSON.parse(json);schemas++;}
 const isRedirect=html.includes('http-equiv="refresh"');
 if(!isRedirect){
  assert.match(html,/<nav[^>]*>[\s\S]*?href="\/odor-removal-houston"[^>]*>Free Estimate/);
  assert.doesNotMatch(html.match(/<footer[\s\S]*?<\/footer>/)?.[0]||'',/<img/,'No footer logo');
  assert.match(html,/apple-touch-icon.png\?v=20261124/);
 }
 assert.doesNotMatch(html,/denverodorpros|laodorpros|Los Angeles|\bLA odor|303.?882|424.?/i,`${rel}: foreign business detail`);
 for(const [,attr,value] of html.matchAll(/\b(href|src)="([^"]+)"/g)){
  if(value.startsWith('tel:')){assert.equal(value,'tel:+17134444742');continue;}
  if(value.startsWith('mailto:')){assert.equal(value,'mailto:houstonodorpros@gmail.com');continue;}
  if(/^(https?:|#|data:)/.test(value))continue;
  const [url]=value.split(/[?#]/);if(!url)continue;
  const local=url.startsWith('/')?path.join(root,url):path.resolve(path.dirname(file),url);
  assert.ok(fs.existsSync(local)||fs.existsSync(local+'.html')||fs.existsSync(path.join(local,'index.html')),`${rel} missing ${attr}=${value}`); links++;
 }
}
for(const file of ['vercel.json','site-config.js','api/estimate/index.js','assets/houston-wordmark-nature.png']) {
 const before=cp.execFileSync('git',['show',`HEAD:${file}`],{cwd:root,maxBuffer:10000000});
 const after=fs.readFileSync(path.join(root,file));
 if(file.endsWith('.png'))assert.ok(before.equals(after),`${file} must be preserved`);
 else assert.equal(before.toString().replaceAll('\r\n','\n'),after.toString().replaceAll('\r\n','\n'),`${file} must be preserved`);
}
console.log(`PASS: ${pages.length} documents, ${schemas} schema blocks, ${links} local references; original SEO, logo, redirects, config and email handler preserved; Houston-only contact details.`);

