import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUTPUT=resolve(ROOT,process.env.VIDEO_MUSIC_OUTPUT||'build/youtube-short/music.wav');
const RATE=44100;
const DURATION=Math.max(5,Math.min(120,Number(process.env.VIDEO_DURATION_SECONDS)||30));
const VARIANT=process.env.VIDEO_MUSIC_VARIANT||'current';

const midi=note=>440*Math.pow(2,(note-69)/12);
const clamp=value=>Math.max(-1,Math.min(1,value));

function tone(t,frequency,decay=1){
  const envelope=Math.exp(-t*decay);
  return Math.sin(2*Math.PI*frequency*t)*envelope;
}

export function sampleAt(time){
  const beat=60/118;
  const beatIndex=Math.floor(time/beat);
  const beatTime=time%beat;
  const progression=[[57,60,64],[53,57,60],[60,64,67],[55,59,62]];
  const chord=progression[Math.floor(beatIndex/4)%progression.length];
  const pad=chord.reduce((sum,note)=>sum+Math.sin(2*Math.PI*midi(note)*time),0)/3;
  const bass=tone(beatTime,midi(chord[0]-12),4.2);
  const pluck=tone(beatTime,midi(chord[beatIndex%3]+12),7.5);
  const kick=Math.sin(2*Math.PI*(76-34*Math.min(beatTime,.16))*beatTime)*Math.exp(-beatTime*18);
  const clapPhase=(time+beat)% (beat*2);
  const clap=clapPhase<.09?Math.sin(2*Math.PI*1900*clapPhase)*Math.exp(-clapPhase*35):0;
  const fade=Math.min(1,time/.7,(DURATION-time)/1.1);
  return clamp((pad*.14+bass*.19+pluck*.13+kick*.22+clap*.035)*Math.max(0,fade));
}

// One four-note motif shared by three internal candidates; no third-party samples.
export function warmSampleAt(time,variant='morning',duration=DURATION){
  const beat=60/88;
  const motif=[64,67,69,67];
  const chordRoots=variant==='evening'?[57,53,55,52]:[60,57,53,55];
  const beatIndex=Math.floor(time/beat);
  const bar=Math.floor(beatIndex/4);
  const root=chordRoots[bar%chordRoots.length];
  const padNotes=[root,root+4,root+7];
  const pad=padNotes.reduce((sum,note)=>sum+Math.sin(2*Math.PI*midi(note)*time),0)/3;
  const stepTime=time%beat;
  const phraseTime=time%(4*beat);
  const note=motif[beatIndex%motif.length]+(root-60);
  const bell=Math.sin(2*Math.PI*midi(note+12)*stepTime)*Math.exp(-stepTime*5.5);
  const overtone=Math.sin(2*Math.PI*midi(note+24)*stepTime)*Math.exp(-stepTime*9);
  const bass=Math.sin(2*Math.PI*midi(root-12)*time)*Math.exp(-stepTime*2.8);
  const pulse=variant==='event'?Math.sin(2*Math.PI*58*stepTime)*Math.exp(-stepTime*20):0;
  const air=Math.sin(2*Math.PI*660*time)*Math.sin(2*Math.PI*1.4*time)*.006;
  const contour=variant==='evening'?.82:variant==='event'?1.05:1;
  const fade=Math.max(0,Math.min(1,time/.8,(duration-time)/1.3));
  const phrase=phraseTime<beat*.2?1:.92;
  return clamp(Math.tanh((pad*.11+bass*.12+bell*.13+overtone*.025+pulse*.035+air)*contour*phrase)*fade);
}

function wavBuffer(){
  const frames=RATE*DURATION;
  const channels=2;
  const dataSize=frames*channels*2;
  const buffer=Buffer.alloc(44+dataSize);
  buffer.write('RIFF',0);buffer.writeUInt32LE(36+dataSize,4);buffer.write('WAVE',8);
  buffer.write('fmt ',12);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);
  buffer.writeUInt16LE(channels,22);buffer.writeUInt32LE(RATE,24);
  buffer.writeUInt32LE(RATE*channels*2,28);buffer.writeUInt16LE(channels*2,32);
  buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(dataSize,40);
  // Nivell mitjà pròxim a la sintonia anterior, amb marge de pic per a AAC.
  const gain={current:1,morning:1.53,evening:1.86,event:1.45}[VARIANT];
  for(let frame=0;frame<frames;frame++){
    const value=Math.round(clamp((VARIANT==='current'?sampleAt(frame/RATE):warmSampleAt(frame/RATE,VARIANT))*gain)*32767);
    buffer.writeInt16LE(value,44+frame*4);
    buffer.writeInt16LE(value,46+frame*4);
  }
  return buffer;
}

async function main(){
  if(!['current','morning','evening','event'].includes(VARIANT))throw new Error('Variant de música desconeguda.');
  await mkdir(dirname(OUTPUT),{recursive:true});
  await writeFile(OUTPUT,wavBuffer());
  console.log(`Música original generada (${VARIANT}): ${OUTPUT}`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error);process.exitCode=1;});
