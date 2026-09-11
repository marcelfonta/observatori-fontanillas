const numeric=value=>{
  if(value===null||value===undefined||value==='')return null;
  const number=Number(value);
  return Number.isFinite(number)?number:null;
};

const rounded=(value,digits=1)=>Number(value.toFixed(digits));

export function summarizeTemperatureTrend(readings,{maxPoints=25}={}){
  const valid=(Array.isArray(readings)?readings:[])
    .map(item=>({epoch:numeric(item?.epoch??item?.observed_epoch),temperature:numeric(item?.temperature)}))
    .filter(item=>item.epoch!==null&&item.temperature!==null&&item.temperature>=-50&&item.temperature<=60)
    .sort((left,right)=>left.epoch-right.epoch)
    .filter((item,index,items)=>index===items.length-1||item.epoch!==items[index+1].epoch);
  if(valid.length<2)return null;
  const limit=Math.max(2,Math.min(48,Math.round(numeric(maxPoints)||25)));
  const selected=valid.length<=limit
    ? valid
    : Array.from({length:limit},(_,index)=>valid[Math.round(index*(valid.length-1)/(limit-1))]);
  const first=valid[0];
  const last=valid.at(-1);
  return {
    hours:rounded(Math.max(0,(last.epoch-first.epoch)/3600),1),
    sampleCount:valid.length,
    startEpoch:first.epoch,
    endEpoch:last.epoch,
    current:rounded(last.temperature),
    minimum:rounded(Math.min(...valid.map(item=>item.temperature))),
    maximum:rounded(Math.max(...valid.map(item=>item.temperature))),
    change:rounded(last.temperature-first.temperature),
    points:selected.map(item=>({epoch:item.epoch,temperature:rounded(item.temperature,2)})),
  };
}

export function temperatureTrendGeometry(trend,{width=400,height=120,paddingX=4,paddingY=8,progress=1}={}){
  const points=(Array.isArray(trend?.points)?trend.points:[])
    .map(item=>({epoch:numeric(item?.epoch),temperature:numeric(item?.temperature)}))
    .filter(item=>item.epoch!==null&&item.temperature!==null);
  if(points.length<2)return null;
  const visibleCount=Math.max(2,Math.min(points.length,Math.ceil(points.length*Math.max(0.05,Math.min(1,numeric(progress)??1)))));
  const visible=points.slice(0,visibleCount);
  const minimum=numeric(trend.minimum)??Math.min(...points.map(item=>item.temperature));
  const maximum=numeric(trend.maximum)??Math.max(...points.map(item=>item.temperature));
  const spread=Math.max(1,maximum-minimum);
  const chartWidth=Math.max(1,width-paddingX*2);
  const chartHeight=Math.max(1,height-paddingY*2);
  const coordinates=visible.map((item,index)=>({
    x:rounded(paddingX+(index/(points.length-1))*chartWidth,2),
    y:rounded(paddingY+((maximum-item.temperature)/spread)*chartHeight,2),
    temperature:item.temperature,
  }));
  const path=coordinates.map((point,index)=>`${index?'L':'M'}${point.x} ${point.y}`).join(' ');
  const first=coordinates[0];
  const last=coordinates.at(-1);
  return {path,area:`${path} L${last.x} ${height-paddingY} L${first.x} ${height-paddingY} Z`,current:last,visibleCount,totalPoints:points.length};
}
