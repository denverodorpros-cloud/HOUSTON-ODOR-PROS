const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('api/estimate/index.js','utf8');
async function run({method='POST',fields={Name:'TEST ONLY',Email:'houstonodorpros@gmail.com'},configured=true,accepted=true,throws=false,pushover='missing',extra={}}={}){
 let sent; const notifications=[];
 const env=configured?{RESEND_API_KEY:'mock-only'}:{};
 if(pushover!=='missing'){env.PUSHOVER_APP_TOKEN='mock-token';env.PUSHOVER_USER_KEY='mock-user';}
 const sandbox={module:{exports:{}},process:{env},URL,AbortSignal,console:{error(){}},fetch:async(url,options)=>{
  if(url.includes('api.pushover.net')){notifications.push(JSON.parse(options.body));if(pushover==='network')throw Error('push network');return{ok:pushover!=='failure',json:async()=>({status:pushover==='ok'?1:0})};}
  sent={url,...JSON.parse(options.body)};if(throws)throw Error('network');return{ok:accepted,json:async()=>accepted?{id:'mock-id'}:{message:'rejected'}};
 }};
 vm.runInNewContext(source,sandbox);
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.body=data;return this;}};
 await sandbox.module.exports({method,body:{fields,...extra}},res);
 return{...res,sent,notifications};
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
 assert.equal(ok.body.notification,'not_configured');
 const push=await run({pushover:'ok',fields:{Name:'Private Name',Phone:'713-555-0100',Email:'private@example.com',Service:'Pet odor removal',Message:'Private details'},extra:{pageUrl:'https://www.houstonodorpros.com/odor-removal-houston?email=private@example.com#private',testOnly:true}});
 assert.equal(push.code,200);assert.equal(push.body.notification,'accepted');assert.equal(push.notifications.length,1);
 assert.equal(push.notifications[0].priority,0);assert.equal(push.notifications[0].title,'HOUSTON ODOR PROS — Free Estimate request');
 assert.match(push.notifications[0].message,/TEST ONLY.*\nService: Pet odor removal\nPage: \/odor-removal-houston/);
 assert.doesNotMatch(JSON.stringify(push.notifications),/Private Name|713-555|private@|Private details|\?|#private/);
 for(const pushover of ['failure','network','bad-status']){const result=await run({pushover});assert.equal(result.code,200);assert.equal(result.body.ok,true);assert.equal(result.body.notification,'unavailable');}
 for(const options of [{accepted:false},{throws:true},{fields:{}}]){const result=await run({...options,pushover:'ok'});assert.equal(result.notifications.length,0);}
 const unknown=await run({pushover:'ok',fields:{Name:'TEST ONLY',Email:'houstonodorpros@gmail.com',Service:'private@example.com'},extra:{pageUrl:'https://unrelated.example/private-contact'}});
 assert.match(unknown.notifications[0].message,/Service: Not specified\nPage: Not provided/);
 console.log('PASS: estimate validation/email behavior; push only after email acceptance; missing credentials and push outages never fail successful leads; normal priority, service/page only, no customer details or query parameters. Providers mocked; no real email or push sent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
