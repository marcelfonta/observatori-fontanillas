export function initLearning(){
  document.querySelectorAll('[data-learning-topic]').forEach(button=>button.addEventListener('click',()=>{
    const detail=document.querySelector(`[data-learning-detail="${button.dataset.learningTopic}"]`);
    if(!detail)return;
    const open=detail.hidden;
    detail.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    button.textContent=open?'Amagar la regla':'Veure una regla pràctica';
  }));
  const feedback=document.getElementById('learning-quiz-feedback');
  document.querySelectorAll('[data-learning-answer]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-learning-answer]').forEach(item=>item.classList.remove('is-correct','is-partial'));
    const correct=button.dataset.learningAnswer==='correct';
    button.classList.add(correct?'is-correct':'is-partial');
    if(feedback)feedback.textContent=correct?'Exacte. Combinar fonts i actualitzar la consulta redueix sorpreses.':'És una part útil, però falta combinar-la amb avisos, predicció i observació recent.';
  }));
}
