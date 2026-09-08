const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../intake.js'),'utf8');
async function scenario({valid=true,ok=true,success=true,reject=false}){
  let listener,reset=false,calls=0,tracked=0;
  const button={disabled:false};const status={textContent:''};
  const form={reportValidity:()=>valid,querySelector:()=>button,reset:()=>{reset=true;},addEventListener:(_,f)=>{listener=f;}};
  const document={getElementById:id=>id==='adoption-intake'?form:status};
  let payload;
  const context={document,FormData:class{*[Symbol.iterator](){yield ['desired_support','Understand our readiness'];}},AbortController,setTimeout,clearTimeout,aaTrack:()=>{tracked++;},fetch:async(url,options)=>{calls++;payload=JSON.parse(options.body);if(reject)throw Error('network');return {ok,json:async()=>({success})};}};
  vm.runInNewContext(source,context);
  await listener({preventDefault(){}});
  assert.equal(button.disabled,false);
  return {status:status.textContent,reset,calls,tracked,payload};
}
(async()=>{
  for(const success of [true,'true']){const x=await scenario({success});assert(x.reset);assert.match(x.status,/has not been booked/);assert.equal(x.tracked,1);assert.match(x.payload.consent,/no marketing/);}
  for(const options of [{success:false},{success:'false'},{ok:false},{reject:true}]){const x=await scenario(options);assert(!x.reset);assert.match(x.status,/could not confirm/);assert.equal(x.tracked,0);}
  const invalid=await scenario({valid:false});assert.equal(invalid.calls,0);
  console.log('Intake: accepted responses, rejected responses, HTTP failure, network failure, and validation cases passed. No messages sent.');
})().catch(error=>{console.error(error);process.exitCode=1;});
