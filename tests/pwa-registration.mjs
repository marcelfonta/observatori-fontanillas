import assert from 'node:assert/strict';
import {ensureAppServiceWorker} from '../src/core/service-worker-registration.js';

const inactive=new Promise(()=>{});
const registration={active:{scriptURL:'https://meteo.fontanillas.cat/OneSignalSDKWorker.js'}};

{
  const calls=[];
  const serviceWorkers={ready:inactive,async getRegistration(){calls.push('check');return null;},async register(path,options){calls.push('register');assert.equal(path,'/service-worker.js');assert.deepEqual(options,{scope:'/',updateViaCache:'none'});return registration;}};
  const result=await ensureAppServiceWorker(serviceWorkers,{pushConfigured:true,delay:async()=>{}});
  assert.equal(result,registration);
  assert.deepEqual(calls,['check','check','register']);
}

{
  let registrations=0;
  const serviceWorkers={ready:inactive,async getRegistration(){return registration;},async register(){registrations++;}};
  assert.equal(await ensureAppServiceWorker(serviceWorkers,{pushConfigured:true}),registration);
  assert.equal(registrations,0,'el worker existent de OneSignal no s’ha de substituir');
}

{
  let checks=0;
  let registrations=0;
  const serviceWorkers={ready:inactive,async getRegistration(){return ++checks===2?registration:null;},async register(){registrations++;}};
  assert.equal(await ensureAppServiceWorker(serviceWorkers,{pushConfigured:true,delay:async()=>{}}),registration);
  assert.equal(registrations,0,'un registre de OneSignal que apareix mentre esperem té prioritat');
}

{
  const serviceWorkers={ready:inactive,async register(path){assert.equal(path,'/service-worker.js');return registration;}};
  assert.equal(await ensureAppServiceWorker(serviceWorkers),registration);
}

console.log('PWA: primera visita, registre existent i cursa amb OneSignal correctes.');
