import {S3Client,ListObjectsV2Command,GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3';
import {ARCHIVE_BUCKET} from './remote-archive.mjs';
import {boundedBody} from './io.mjs';

// Object-level, bucket-scoped R2 credentials work on S3, NOT the REST API.
// No default credential chain, arbitrary endpoint, retries, bucket admin or DELETE.
export function s3Config({accountId,accessKeyId,secretAccessKey,jurisdiction='default'}){
  if(!/^[a-f0-9]{32}$/.test(accountId||'')||!/^[a-f0-9]{32}$/.test(accessKeyId||'')||
    !/^[a-f0-9]{64}$/.test(secretAccessKey||'')||!['default','eu'].includes(jurisdiction))throw new Error('Credencials S3 R2 incompletes');
  return {region:'auto',endpoint:`https://${accountId}${jurisdiction==='eu'?'.eu':''}.r2.cloudflarestorage.com`,
    credentials:{accessKeyId,secretAccessKey},maxAttempts:1,forcePathStyle:true,followRegionRedirects:false,
    requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',
    requestHandler:{connectionTimeout:5000,requestTimeout:25000}};
}

export function s3Transport(options,{client}={}){
  const config=s3Config(options);
  const s3=client||new S3Client(config);
  const key=k=>{if(!/^(captures|manifests)\/[a-f0-9]{64}\.json$/.test(k))throw new Error('Clau R2 invàlida');return k;};
  async function send(command){
    try{return await s3.send(command,{abortSignal:AbortSignal.timeout(25000)});}
    catch(error){
      const status=error?.$metadata?.httpStatusCode;
      throw new Error(Number.isInteger(status)?`S3 R2 HTTP ${status}`:'S3 R2: connexió o temps d’espera');
    }
  }
  return {
    async inventory(){
      const response=await send(new ListObjectsV2Command({Bucket:ARCHIVE_BUCKET,MaxKeys:1000}));
      const objects=response.Contents??[];
      // This pilot deliberately stops before 1000 objects; never budget a partial page.
      if(response.IsTruncated!==false||response.NextContinuationToken||!Array.isArray(objects)||objects.length>=1000||
        !Number.isSafeInteger(response.KeyCount)||response.KeyCount!==objects.length)throw new Error('Inventari S3 R2 incomplet');
      return objects.map(o=>({key:o.Key,size:o.Size}));
    },
    async get(k){
      const response=await send(new GetObjectCommand({Bucket:ARCHIVE_BUCKET,Key:key(k)}));
      const body=response.Body;
      if(!body||!body[Symbol.asyncIterator])throw new Error('Cos S3 R2 absent');
      const timer=setTimeout(()=>body.destroy?.(new Error('Temps de lectura excedit')),25000);
      try{
        if(!Number.isSafeInteger(response.ContentLength)||response.ContentLength<0||response.ContentLength>12*1024*1024)throw new Error('Mida S3 R2 invàlida');
        const bytes=await boundedBody({body},12*1024*1024);
        if(bytes.length!==response.ContentLength)throw new Error('Cos S3 R2 incomplet');
        return bytes;
      }catch{throw new Error('Lectura S3 R2 incompleta o massa gran');}
      finally{clearTimeout(timer);body.destroy?.();}
    },
    async put(k,body){
      if(!Buffer.isBuffer(body)||!body.length||body.length>12*1024*1024)throw new Error('Cos de pujada invàlid');
      await send(new PutObjectCommand({Bucket:ARCHIVE_BUCKET,Key:key(k),Body:body,
        ContentLength:body.length,ContentType:'application/json',StorageClass:'STANDARD',IfNoneMatch:'*'}));
    },
    close(){s3.destroy?.();}
  };
}
