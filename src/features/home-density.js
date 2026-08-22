export function initHomeDensity(){
  const grid=document.querySelector('.metrics-grid[data-portal-page~="inici"]');
  const button=document.getElementById('home-metrics-toggle');
  if(!grid||!button)return;
  button.addEventListener('click',()=>{
    const expanded=grid.classList.toggle('is-expanded');
    button.setAttribute('aria-expanded',String(expanded));
    button.querySelector('b').textContent=expanded?'Veure només l’essencial':'Veure totes les dades';
    button.querySelector('span').textContent=expanded?'−':'+';
  });
}
