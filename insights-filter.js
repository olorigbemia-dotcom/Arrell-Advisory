(function(){
  const buttons=document.querySelectorAll('[data-filter]');
  const cards=document.querySelectorAll('.insight-card');
  buttons.forEach(button=>button.addEventListener('click',()=>{
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let visible=0;
    cards.forEach(card=>{card.hidden=button.dataset.filter!=='All'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)visible++;});
    document.getElementById('filter-status').textContent=`${visible} resources shown`;
  }));
})();
