(function () {
  'use strict';
  const dimensions = [
    {name:'Leadership understanding', next:'Build a shared understanding of AI capabilities, limitations, and responsible use.', questions:['Can leaders explain what AI can and cannot do in the context of your organization?', 'Do leaders have a shared understanding of appropriate AI use and human responsibility?']},
    {name:'Strategic alignment', next:'Define a business outcome and the evidence you would need before pursuing an AI initiative.', questions:['Are the business outcomes you want to improve clearly defined?', 'Are AI priorities connected to those outcomes, with a way to assess their value?']},
    {name:'Workflow readiness', next:'Map one priority workflow, its constraints, and the decisions that need human judgment.', questions:['Do you understand the steps, handoffs, and constraints in the workflows you want to improve?', 'Have you considered where AI should assist people, where automation may fit, and where a non-AI change may be better?']},
    {name:'Workforce capability', next:'Identify the skills and support people need in the roles affected by AI.', questions:['Have people received practical AI learning relevant to their roles?', 'Do teams have support to verify AI outputs, exercise judgment, and adapt their working practices?']},
    {name:'Governance', next:'Clarify who owns AI decisions and establish appropriate review, data boundaries, and escalation.', questions:['Is responsibility clear for approving, reviewing, and overseeing AI use?', 'Are there practical rules for data use, output validation, human oversight, and raising concerns?']},
    {name:'Data & technology readiness', next:'Ask your technical owners to assess data suitability, approved tools, and integration constraints.', questions:['Have the relevant owners assessed whether suitable data and approved tools are available?', 'Are the technology constraints and technical implementation responsibilities understood?']}
  ];
  const labels=['Not yet in place','Discussed, but mostly informal','Partly established; practice varies','Established and used consistently','Not sure'];
  function summarize(answers) {
    if (!Array.isArray(answers) || answers.length !== 12 || answers.some(x=>!Number.isInteger(x)||x<0||x>4)) throw new Error('Complete all 12 questions with a valid answer.');
    return dimensions.map((d,i)=>{
      const pair=answers.slice(i*2,i*2+2);
      const state=pair.includes(4)?'Clarify your starting point':Math.min(...pair)<=1?'Build the foundations':Math.min(...pair)===2?'Strengthen consistency':'Maintain and review';
      return {name:d.name,state,next:state==='Maintain and review'?'Review these practices as your workflows, people, and AI use change.':d.next};
    });
  }
  if (typeof module !== 'undefined') module.exports={summarize,dimensions};
  if (typeof document === 'undefined') return;
  const start=document.getElementById('assessment-start');
  if (!start) return;
  const form=document.getElementById('assessment-form');
  const question=document.getElementById('assessment-question');
  const answers=Array(12).fill(null);
  let current=0;
  function track(name) { if (typeof aaTrack==='function') aaTrack(name); }
  function showQuestion() {
    const dim=dimensions[Math.floor(current/2)];
    document.getElementById('assessment-progress-text').textContent=`Question ${current+1} of 12 · ${dim.name}`;
    document.getElementById('assessment-progress').value=current+1;
    question.innerHTML=`<legend tabindex="-1">${dim.questions[current%2]}</legend>`+labels.map((label,i)=>`<label class="answer"><input type="radio" name="answer" value="${i}" ${answers[current]===i?'checked':''}> <span>${label}</span></label>`).join('');
    document.getElementById('assessment-back').disabled=current===0;
    document.getElementById('assessment-next').textContent=current===11?'See your results':'Next question';
    document.getElementById('assessment-error').textContent='';
    question.querySelector('legend').focus();
  }
  start.addEventListener('click',()=>{document.getElementById('assessment-intro').hidden=true;form.hidden=false;track('assessment_start');showQuestion();});
  form.addEventListener('change',()=>{const selected=form.querySelector('input[name=answer]:checked');if(selected)answers[current]=Number(selected.value);});
  document.getElementById('assessment-back').addEventListener('click',()=>{if(current>0){current--;showQuestion();}});
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const selected=form.querySelector('input[name=answer]:checked');
    if (!selected) {document.getElementById('assessment-error').textContent='Choose an answer, including “Not sure” if needed.';return;}
    answers[current]=Number(selected.value);
    if(current<11){current++;showQuestion();return;}
    const result=summarize(answers);
    form.hidden=true;
    const container=document.getElementById('assessment-results');
    container.hidden=false;
    container.innerHTML='<h2 tabindex="-1">Your organizational readiness reflection</h2><p>These directions reflect your answers, not an independent evaluation. A strong response in one area does not cancel a gap elsewhere. No overall score or certification is assigned.</p><div class="result-grid">'+result.map(r=>`<div class="result-card"><h3>${r.name}</h3><strong class="result-state">${r.state}</strong><p>${r.next}</p></div>`).join('')+'</div><p>Start with a business priority and discuss the areas that need clarification or stronger foundations. A conversation can help you decide what should come first.</p><div class="btn-row"><a href="/strategy" class="btn-primary" data-event="assessment_to_strategy">Discuss your next step</a><button type="button" class="btn-secondary" id="assessment-restart">Start again</button></div><p class="journey-note">Your answers have not been sent to Arrell. Bring your observations to the conversation if you wish.</p>';
    container.querySelector('h2').focus();
    track('assessment_complete');
    document.getElementById('assessment-restart').addEventListener('click',()=>{answers.fill(null);current=0;container.hidden=true;form.hidden=false;showQuestion();});
  });
})();
