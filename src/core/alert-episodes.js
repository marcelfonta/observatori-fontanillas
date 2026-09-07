const levelRank={red:4,orange:3,yellow:2,unknown:1,none:0};

function timestamp(value,fallback=0){
  const parsed=new Date(value).getTime();
  return Number.isFinite(parsed)?parsed:fallback;
}

function normalized(value=''){
  return String(value).trim().toLocaleLowerCase('ca-ES').replace(/\s+/g,' ');
}

function sameEpisode(left,right){
  if(normalized(left.source)!==normalized(right.source))return false;
  if(normalized(left.phenomenon||left.title)!==normalized(right.phenomenon||right.title))return false;
  const leftStart=timestamp(left.started_at||left.created_at);
  const rightStart=timestamp(right.started_at||right.created_at);
  const leftEnd=timestamp(left.expires_at,leftStart+86400000);
  const rightEnd=timestamp(right.expires_at,rightStart+86400000);
  return leftStart<=rightEnd+3600000&&rightStart<=leftEnd+3600000;
}

export function groupAlertEpisodes(items=[]){
  const episodes=[];
  const ordered=[...items].sort((a,b)=>timestamp(a.started_at||a.created_at)-timestamp(b.started_at||b.created_at));
  for(const item of ordered){
    const existing=[...episodes].reverse().find(episode=>sameEpisode(episode,item));
    if(!existing){episodes.push({...item,updates:1,descriptions:[item.description].filter(Boolean)});continue;}
    existing.updates+=1;
    existing.started_at=new Date(Math.min(timestamp(existing.started_at||existing.created_at),timestamp(item.started_at||item.created_at))).toISOString();
    const latestEnd=Math.max(timestamp(existing.expires_at),timestamp(item.expires_at));
    if(latestEnd)existing.expires_at=new Date(latestEnd).toISOString();
    if((levelRank[item.level]||0)>(levelRank[existing.level]||0))existing.level=item.level;
    if(item.description&&!existing.descriptions.includes(item.description))existing.descriptions.push(item.description);
    existing.description=item.description||existing.description;
    existing.title=item.title||existing.title;
  }
  return episodes.sort((a,b)=>timestamp(b.started_at||b.created_at)-timestamp(a.started_at||a.created_at));
}
