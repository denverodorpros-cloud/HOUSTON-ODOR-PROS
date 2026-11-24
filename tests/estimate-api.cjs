const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('api/estimate/index.js','utf8');
async function run({method='POST',fields={Name:'TEST ONLY',Email:'houstonodorpros@gmail.com'},configured=true,accepted=true,throws=false,extra={}}={}){
 let sent;
 const sandbox={module:{exports:{}},process:{env:configured?{RESEND_API_KEY:'mock-only'}:{}},AbortSignal,console:{error(){}},fetch:async(url,options)=>{sent={url,...JSON.parse(options.body)};if(throws)throw Error('network');return{ok:accepted,json:async()=>accepted?{id:'mock-id'}:{message:'rejected'}};}};
 vm.runInNewContext(source,sandbox);
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.body=data;return this;}};
 await sandbox.module.exports({method,body:{fields,...extra}},res);
 return{...res,sent};
}
(async()=>{
 assert.equal((await run({method:'GET'})).code,405);
 for(const fields of [{},{Name:'TEST ONLY',Email:'invalid'},{Name:'TEST ONLY',Email:[]},{Name:'TEST ONLY',Phone:'',Email:''}]) assert.equal((await run({fields})).code,400);
 assert.equal((await run({configured:false})).code,500);
 assert.equal((await run({accepted:false})).code,502);
 assert.equal((await run({throws:true})).code,500);
 const ok=await run({fields:{Name:'TEST ONLY <script>',Email:'houstonodorpros@gmail.com',Message:'Mock — do not schedule'}});
 assert.equal(ok.code,200);assert.equal(ok.body.ok,true);assert.equal(ok.body.id,'mock-id');
 assert.equal(ok.sent.to,'houstonodorpros@gmail.com');assert.match(ok.sent.html,/HOUSTON ODOR PROS/);assert.match(ok.sent.html,/&lt;script&gt;/);
 assert.doesNotMatch(ok.sent.html,/denver|los angeles/i);
 console.log('PASS: API validation, 405/400/500/502 responses, provider acceptance, Houston recipient, HTML escaping. Provider mocked; no real email sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
