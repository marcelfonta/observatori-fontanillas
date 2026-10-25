const APP_WORKER='/service-worker.js';

export async function ensureAppServiceWorker(serviceWorkers,{pushConfigured=false,waitMs=3000,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  if(!pushConfigured)return serviceWorkers.register(APP_WORKER,{scope:'/',updateViaCache:'none'});

  // Si OneSignal ja ha creat el worker compartit, el reutilitzem. En una
  // primera visita sense permís push, `ready` pot no resoldre's mai.
  const existing=await serviceWorkers.getRegistration('/');
  if(existing)return existing;
  const ready=await Promise.race([serviceWorkers.ready,delay(waitMs).then(()=>null)]);
  if(ready)return ready;

  // Un segon control evita substituir un registre que OneSignal hagi creat
  // mentre esperàvem. Si encara no n'hi ha, activem la PWA per a tothom.
  return await serviceWorkers.getRegistration('/') || serviceWorkers.register(APP_WORKER,{scope:'/',updateViaCache:'none'});
}
