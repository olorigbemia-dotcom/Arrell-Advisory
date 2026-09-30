const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../newsletter.js'),'utf8');

// Minimal DOM double: enough for newsletter.js to render its markup, find its
// own nodes, and run a submit. No network is ever reached; fetch is stubbed.
function makeEl(tag){
  const el={tagName:tag,children:[],attributes:{},style:{},value:'',textContent:'',className:'',hidden:false,disabled:false,readOnly:false,validity:true,
    setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},getAttribute(k){return this.attributes[k]===undefined?null:this.attributes[k];},
    appendChild(c){this.children.push(c);c.parentNode=this;return c;},focus(){},checkValidity(){return this.validity;},
    closest(){return this.parentNode||null;},querySelector(){return null;},querySelectorAll(){return [];}};
  return el;
}
function scenario({formId='f1',accountId='acct-test',ok=true,success=true,reject=false,email='reader@example.com',honeypot='',valid=true,variant='band'}={}){
  const input=makeEl('input');input.value=email;input.validity=valid;
  const company=makeEl('input');company.value=honeypot;
  const button=makeEl('button');
  const status=makeEl('p');
  const form=makeEl('form');
  let listener;let reset=false;
  form.addEventListener=(_,f)=>{listener=f;};
  form.reset=()=>{reset=true;input.value='';company.value='';};
  const mount=makeEl('div');mount.parentNode=makeEl('section');
  mount.getAttribute=k=>k==='data-newsletter'?variant:null;
  mount.querySelector=sel=>({'.newsletter-form':form,'input[type=email]':input,'input[name=company]':company,'button[type=submit]':button,'.newsletter-status':status})[sel]||null;
  let calls=0,tracked=0,url,body;
  const document={readyState:'complete',addEventListener(){},createElement:makeEl,
    querySelector:()=>null,querySelectorAll:sel=>sel==='[data-newsletter]'?[mount]:[]};
  const context={document,FormData:class{constructor(){this.d={};}append(k,v){this.d[k]=v;}},AbortController,setTimeout,clearTimeout,
    aaTrack:()=>{tracked++;},
    fetch:async(u,o)=>{calls++;url=u;body=o.body.d;if(reject)throw new Error('network');return {ok,json:async()=>({success})};}};
  // Both identifiers are stubbed by pattern, not by their literal current value, so
  // this suite keeps testing the code after real IDs are pasted in - and can never
  // reach the production form.
  const stubbed=source
    .replace(/var AA_ML_ACCOUNT_ID = '[^']*';/,"var AA_ML_ACCOUNT_ID = "+JSON.stringify(accountId)+";")
    .replace(/var AA_ML_FORM_ID = '[^']*';.*/,"var AA_ML_FORM_ID = "+JSON.stringify(formId)+";");
  // Derived from the source, not hardcoded, so this keeps holding if the IDs are rotated.
  for(const id of (source.match(/var AA_ML_(?:ACCOUNT|FORM)_ID = '([^']*)';/g)||[]).map(m=>m.split("'")[1]).filter(Boolean)){
    assert(!stubbed.includes(id),'the real MailerLite identifiers must never be reachable from a test');
  }
  vm.runInNewContext(stubbed,context);
  return {run:async()=>{await listener({preventDefault(){}});return {status:status.textContent,reset,calls,tracked,url,body,button,input,hidden:mount.parentNode.hidden};},mount};
}
(async()=>{
  // Success path: subscribes, confirms, resets, re-enables the button, tracks once.
  const okCase=await scenario({}).run();
  assert.equal(okCase.calls,1);
  assert.match(okCase.url,/assets\.mailerlite\.com\/jsonp\/acct-test\/forms\/f1\/subscribe/);
  assert.equal(okCase.body['fields[email]'],'reader@example.com');
  assert.match(okCase.status,/check your inbox/i);
  assert(okCase.reset);
  assert.equal(okCase.tracked,1);
  assert.equal(okCase.button.disabled,false,'button must be re-enabled');
  assert.equal(okCase.input.readOnly,false,'input must be writable again');

  // 'true' as a string is accepted, matching the intake.js contract.
  assert.match((await scenario({success:'true'}).run()).status,/check your inbox/i);

  // Failure paths never leak technical detail and never claim success.
  for(const opts of [{success:false},{success:'false'},{ok:false},{reject:true}]){
    const x=await scenario(opts).run();
    assert.match(x.status,/could not complete your subscription/i);
    assert.doesNotMatch(x.status,/fetch|network|HTTP|JSON|error:/i);
    assert.equal(x.tracked,0);
    assert(!x.reset);
    assert.equal(x.button.disabled,false);
  }

  // Invalid or empty email is caught client-side; nothing is sent.
  for(const opts of [{valid:false},{email:'   '}]){
    const x=await scenario(opts).run();
    assert.equal(x.calls,0);
    assert.match(x.status,/valid email/i);
  }

  // A filled honeypot silently no-ops without contacting MailerLite.
  const bot=await scenario({honeypot:'Acme Inc'}).run();
  assert.equal(bot.calls,0);
  assert.match(bot.status,/check your inbox/i);

  // Staging: with no form ID the section still renders in full, so it can be
  // reviewed on the live site. Submitting contacts nothing and must not claim
  // a subscription that did not happen.
  const off=scenario({formId:''});
  assert.equal(off.mount.parentNode.hidden,false,'section must stay visible when unconfigured');
  assert.match(off.mount.innerHTML,/Stay informed about AI without the panic\./,'heading must render when unconfigured');
  // The initiative name is fixed. Any variation of it is a defect, not a rewording.
  assert.match(off.mount.innerHTML,/AI Without The Panic/,'eyebrow must carry the exact initiative name');
  assert.doesNotMatch(off.mount.innerHTML,/AI Without Panic|AI Without the Panic|AI Without Fear/,'no variation of the name');
  assert.match(off.mount.innerHTML,/type="email"/,'email field must render when unconfigured');
  assert.match(off.mount.innerHTML,/type="submit"/,'submit button must render when unconfigured');
  assert.match(off.mount.innerHTML,/Stay in the Loop/,'CTA label must render when unconfigured');
  assert.match(off.mount.innerHTML,/unsubscribe at any time/i,'unsubscribe reassurance must survive the repositioning');
  const offSubmit=await off.run();
  assert.equal(offSubmit.calls,0,'must not contact MailerLite when unconfigured');
  assert.match(offSubmit.status,/not quite live yet/i);
  assert.doesNotMatch(offSubmit.status,/thank you|check your inbox/i,'must not imply success');
  assert.equal(offSubmit.tracked,0,'no subscribe event when nothing was sent');
  assert.equal(offSubmit.button.disabled,false);

  // Validation still runs ahead of the unconfigured notice.
  const offInvalid=await scenario({formId:'',valid:false}).run();
  assert.equal(offInvalid.calls,0);
  assert.match(offInvalid.status,/valid email/i);

  console.log('Newsletter: success, string-true, rejected response, HTTP failure, network failure, validation, honeypot, and unconfigured-but-visible staging cases passed. No subscriptions created.');
})().catch(error=>{console.error(error);process.exitCode=1;});
