export const ALERT_CATEGORIES=['rain','wind','storm','snow','temperature'];
export const ALERT_LEVELS=['yellow','orange','red'];
export const DEFAULT_NOTIFICATION_PREFERENCES={rain:true,wind:true,storm:true,snow:true,temperature:true,all:false,levels:['orange','red']};

function selectedLevels(input={}){
  if(Array.isArray(input.levels))return ALERT_LEVELS.filter(level=>input.levels.includes(level));
  const legacy=ALERT_LEVELS.includes(input.minLevel)?input.minLevel:'orange';
  return ALERT_LEVELS.slice(ALERT_LEVELS.indexOf(legacy));
}

export function notificationTags(input={}){
  const prefs={...DEFAULT_NOTIFICATION_PREFERENCES,...input};const levels=selectedLevels(input);const tags={};
  for(const key of [...ALERT_CATEGORIES,'all'])tags[`alert_${key}`]=prefs[key]?'1':'0';
  ALERT_LEVELS.forEach(level=>tags[`alert_level_${level}`]=levels.includes(level)?'1':'0');tags.alert_level_unknown='0';
  return tags;
}

export function notificationPreferenceSummary(input={}){
  const prefs={...DEFAULT_NOTIFICATION_PREFERENCES,...input};const labels={rain:'pluja',wind:'vent',storm:'tempesta',snow:'neu',temperature:'temperatura'};const selected=prefs.all?['tots els fenòmens']:ALERT_CATEGORIES.filter(key=>prefs[key]).map(key=>labels[key]);const levelLabels={yellow:'groc',orange:'taronja',red:'vermell'};const levels=selectedLevels(input).map(level=>levelLabels[level]);
  return `${selected.length?selected.join(', '):'cap fenomen'} · nivells ${levels.length?levels.join(', '):'cap'}`;
}
