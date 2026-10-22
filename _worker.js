import {onRequest} from './functions/_middleware.js';
import {onRequestGet as records} from './functions/api/records.js';
import {onRequestGet as history} from './functions/api/history.js';

const API_ROUTES=new Map([
  ['/api/records',records],
  ['/api/history',history]
]);

export default {
  async fetch(request,env,executionContext){
    const apiHandler=API_ROUTES.get(new URL(request.url).pathname);
    if(apiHandler){
      if(request.method!=='GET')return new Response('Mètode no permès',{status:405,headers:{Allow:'GET'}});
      return apiHandler({request,env,waitUntil:promise=>executionContext.waitUntil(promise)});
    }
    const next=()=>env.ASSETS.fetch(request);
    try{return await onRequest({request,env,next,waitUntil:promise=>executionContext.waitUntil(promise),passThroughOnException:()=>{}});}
    catch(error){console.error('SEO edge fallback',error);return next();}
  }
};
