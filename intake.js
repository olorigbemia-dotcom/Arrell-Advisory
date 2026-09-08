(function(){
  'use strict';
  const form=document.getElementById('adoption-intake');
  if(!form)return;
  form.addEventListener('submit',async function(event){
    event.preventDefault();
    if(!form.reportValidity())return;
    const button=form.querySelector('button[type=submit]');
    const status=document.getElementById('intake-status');
    const data=Object.fromEntries(new FormData(form));
    data._subject='Arrell Advisory: introductory conversation inquiry';
    data.consent='Agreed to processing for this inquiry; no marketing subscription';
    button.disabled=true;
    status.textContent='Sending your inquiry…';
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try {
      const response=await fetch('https://formsubmit.co/ajax/hello@arrelladvisory.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      if(!response.ok)throw new Error('Request failed');
      const result=await response.json();
      if(result.success!==true && result.success!=='true')throw new Error('Submission not accepted');
      status.textContent='Thank you. Your inquiry has been sent. Arrell will follow up to arrange a conversation. A call has not been booked yet.';
      if(typeof aaTrack==='function')aaTrack('introductory_call_inquiry',{support:data.desired_support});
      form.reset();
    } catch(error) {
      status.textContent='We could not confirm delivery. Your details are still here. Please try again, or email hello@arrelladvisory.com. If you already received a confirmation email, there is no need to resend.';
    } finally {clearTimeout(timeout);button.disabled=false;}
  });
})();
