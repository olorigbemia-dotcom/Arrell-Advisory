/* Insights library filtering.

   Filters the resource cards in place. The status line is written on load as
   well as on every change, so the count is announced rather than appearing
   only after the reader has already pressed something. */
(function(){
  const buttons=document.querySelectorAll('[data-filter]');
  const cards=document.querySelectorAll('.insight-card');
  const status=document.getElementById('filter-status');
  function apply(filter){
    let visible=0;
    cards.forEach(card=>{
      card.hidden=filter!=='All'&&card.dataset.category!==filter;
      if(!card.hidden)visible++;
    });
    if(status)status.textContent=`${visible} ${visible===1?'resource':'resources'} shown`;
    return visible;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    apply(button.dataset.filter);
    if(typeof aaTrack==='function')aaTrack('insights_filter',{filter:button.dataset.filter});
  }));
  const active=document.querySelector('[data-filter][aria-pressed=true]');
  apply(active?active.dataset.filter:'All');
})();
