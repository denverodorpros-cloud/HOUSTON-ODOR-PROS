// Local-only preview. It never sends email or contacts the email provider.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const redirects = require('./vercel.json').redirects;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain'};
const banner = '<div style="padding:10px 18px;background:#092769;color:white;font:14px/1.5 sans-serif;text-align:center">LOCAL FORM SIMULATION — no email will be sent. Remove the previewEmail query to return to the normal preview.</div>';
http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://127.0.0.1:8097');
  res.setHeader('Cache-Control','no-store');
  if(url.pathname === '/api/estimate') {
    let raw='';
    for await(const chunk of req) { raw+=chunk; if(raw.length>150000) {res.writeHead(413);return res.end();} }
    let body; try{body=JSON.parse(raw||'{}');}catch{res.writeHead(400,{'Content-Type':'application/json'});return res.end('{"error":"Invalid JSON"}');}
    const mode = new URL(body.pageUrl || 'http://local.invalid').searchParams.get('previewEmail');
    // Execute the unchanged production handler with a per-request mock provider.
    const sandbox = {module:{exports:{}},process:{env:mode?{RESEND_API_KEY:'local-simulation-only'}:{}},AbortSignal,console,
      fetch:async()=>({ok:mode==='accept',json:async()=>mode==='accept'?{id:'LOCAL-SIMULATION-NO-EMAIL'}:{message:'Simulated provider rejection'}})};
    vm.runInNewContext(fs.readFileSync(path.join(root,'api/estimate/index.js'),'utf8'), sandbox);
    const response = {setHeader:(k,v)=>res.setHeader(k,v),status(code){res.statusCode=code;return this;},json(data){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));}};
    await sandbox.module.exports({method:req.method,body},response);
    console.log(`Local estimate: HTTP ${res.statusCode}; simulation=${mode||'unconfigured'}; no email sent`);
    return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  const redirect=redirects.find(r=>r.source===url.pathname);
  if(redirect){res.writeHead(redirect.statusCode,{Location:redirect.destination});return res.end();}
  let local=decodeURIComponent(url.pathname);
  if(local==='/')local='/index.html';
  let file=path.resolve(root,'.'+local);
  if(!file.startsWith(root+path.sep)||local.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);return res.end();}
  if(!path.extname(file))file=fs.existsSync(file+'.html')?file+'.html':path.join(file,'index.html');
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
  let data=fs.readFileSync(file);
  if(path.extname(file)==='.html'&&url.searchParams.has('previewEmail'))data=Buffer.from(data.toString().replace(/(<body[^>]*>)/,'$1'+banner));
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.end(req.method==='HEAD'?undefined:data);
}).listen(8097,'127.0.0.1',()=>console.log('Houston local preview: http://127.0.0.1:8097/ — no live email delivery'));

