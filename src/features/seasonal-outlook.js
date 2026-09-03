export function initSeasonalOutlook(){
  const button=document.getElementById('seasonal-outlook-toggle');
  const more=document.getElementById('seasonal-outlook-more');
  if(!button||!more)return;
  button.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    const next=!expanded;
    button.setAttribute('aria-expanded',String(next));
    more.hidden=!next;
    button.querySelector('span').textContent=next?'−':'+';
    button.querySelector('b').textContent=next?'Amagar els mesos següents':'Veure els mesos següents';
  });
}
