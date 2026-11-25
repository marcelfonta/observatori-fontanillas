export async function forecastRequest(url,{signal,onWait}={}){
  const send=()=>fetch(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(18000)]):AbortSignal.timeout(18000)});
  const response=await send();
  if(response.status!==429)return response;
  const hint=response.headers.get('Retry-After');
  const {reason=''}=await response.clone().json().catch(()=>({}));
  const delay=hint!==null ? (/^\d+$/.test(hint)?Number(hint)*1000:Date.parse(hint)-Date.now()) :
    /minut/i.test(reason)?61000:3000;
  if(!Number.isFinite(delay) || delay>90000 || /hourly|daily/i.test(reason))return response;
  onWait?.(true);
  try{
    signal?.throwIfAborted();
    await new Promise(resolve=>{
      const timer=setTimeout(done,Math.max(1000,delay));
      function done(){clearTimeout(timer);signal?.removeEventListener('abort',done);resolve();}
      signal?.addEventListener('abort',done,{once:true});
    });
    signal?.throwIfAborted();
    return await send();
  }finally{onWait?.(false);}
}
