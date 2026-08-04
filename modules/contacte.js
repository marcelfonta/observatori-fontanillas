import { CONFIG } from '../js/config.js';

function setStatus(message,state='') {
  const status=document.getElementById('contact-status'); if(!status) return;
  status.textContent=message; status.dataset.state=state;
}

export function initContact() {
  const form=document.getElementById('contact-form'); const started=document.getElementById('contact-started-at'); const button=document.getElementById('contact-submit');
  if(!form||!started||!button) return;
  started.value=String(Date.now());
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); setStatus('Revisa els camps marcats abans d’enviar.','error'); return; }
    button.disabled=true; button.classList.add('is-sending'); setStatus('Enviant el missatge de manera segura…','sending');
    try {
      const payload=Object.fromEntries(new FormData(form).entries());
      payload.consent=Boolean(payload.consent);
      const response=await fetch(`${CONFIG.apiUrl}/contact`,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||'No s’ha pogut enviar el missatge.');
      form.reset(); started.value=String(Date.now()); setStatus('Missatge enviat. Gràcies! Et respondré tan aviat com sigui possible.','success');
    } catch(error) { setStatus(error.message||'No s’ha pogut enviar. Torna-ho a provar d’aquí a uns minuts.','error'); }
    finally { button.disabled=false; button.classList.remove('is-sending'); }
  });
}
