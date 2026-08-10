export const ALERT_CATEGORIES=['rain','wind','storm','snow','temperature'];
export const ALERT_LEVELS=['yellow','orange','red'];
export const DEFAULT_NOTIFICATION_PREFERENCES={rain:true,wind:true,storm:true,snow:true,temperature:true,all:false,minLevel:'orange'};

export function notificationTags(input={}){
  const prefs={...DEFAULT_NOTIFICATION_PREFERENCES,...input};const min=ALERT_LEVELS.includes(prefs.minLevel)?prefs.minLevel:'orange';const threshold=ALERT_LEVELS.indexOf(min);const tags={};
  for(const key of [...ALERT_CATEGORIES,'all'])tags[`alert_${key}`]=prefs[key]?'1':'0';
  ALERT_LEVELS.forEach((level,index)=>tags[`alert_level_${level}`]=index>=threshold?'1':'0');tags.alert_level_unknown=min==='yellow'?'1':'0';
  return tags;
}

export function notificationPreferenceSummary(input={}){
  const prefs={...DEFAULT_NOTIFICATION_PREFERENCES,...input};const labels={rain:'pluja',wind:'vent',storm:'tempesta',snow:'neu',temperature:'temperatura'};const selected=prefs.all?['tots els fenòmens']:ALERT_CATEGORIES.filter(key=>prefs[key]).map(key=>labels[key]);const level={yellow:'groc o superior',orange:'taronja o vermell',red:'només vermell'}[prefs.minLevel]||'taronja o vermell';
  return `${selected.length?selected.join(', '):'cap fenomen'} · ${level}`;
}
