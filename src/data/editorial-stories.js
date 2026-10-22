export const EDITORIAL_STORIES=Object.freeze([
  {
    id:'aiguat-4-octubre-2026',date:'2026-10-04',kind:'rain',title:'La matinada dels 82,6 mm',subtitle:'Un aiguat concentrat abans de sortir el sol',
    summary:'L’estació va acumular 82,55 mm en un dia. Més de 71 mm van caure entre les 00 i les 06 h, amb un màxim horari de 59,18 mm/h a les 03 h.',
    narrative:['L’episodi va començar amb la part més intensa durant la matinada: 37,85 mm entre les 00 i les 03 h i 33,27 mm entre les 03 i les 06 h. Després de les 09 h ja no consta nova precipitació horària a l’arxiu.','La temperatura es va mantenir continguda, entre 17,8 i 21,9 °C, mentre la ratxa màxima va arribar als 47 km/h poc després de mitjanit. La concentració temporal de la pluja és tan rellevant com el total diari.'],
    rain:82.55,gust:47,low:17.8,high:21.9,coverage:99,sampleCount:24,start:{t:'2026-10-04T00:05:08+02:00'},peak:{t:'2026-10-04T03:00:48+02:00'},end:{t:'2026-10-04T23:00:00+02:00'},
    officialSummary:'L’historial conserva avisos d’AEMET per pluja i tempestes al Prelitoral de Barcelona, inclòs un nivell taronja durant el matí, i un avís de Meteocat que començava al vespre.',
    profile:[['00',19,37.85,47],['03',18.5,33.27,30.9],['06',18,11.43,20.6],['09',18.8,0,17.4],['12',19.7,0,14.2],['15',21.1,0,19],['18',19.5,0,21.4],['21',18.4,0,18.2]]
  },
  {
    id:'vent-calor-6-agost-2026',date:'2026-08-06',kind:'wind',title:'De 35 °C a una ratxa de 59,9 km/h',subtitle:'Calor, canvi de vent i descens tèrmic en poques hores',
    summary:'El termòmetre va arribar als 35,0 °C al migdia i la ratxa màxima, 59,9 km/h, es va registrar a les 17 h. Al vespre la temperatura ja havia baixat fins a prop dels 22 °C.',
    narrative:['El dia va començar amb una nit càlida i una pujada ràpida fins als 35,0 °C de les 12 h. Entre les 15 i les 18 h, coincidint amb la ratxa més forta, la temperatura mitjana horària va passar de 32,8 a 21,9 °C.','L’arxiu també suma 7,62 mm, repartits principalment entre el matí i el vespre. Les dades descriuen el punt de l’estació: no permeten afirmar per si soles quin fenomen va causar el canvi.'],
    rain:7.62,gust:59.9,low:20.6,high:35,coverage:100,sampleCount:24,start:{t:'2026-08-06T00:00:00+02:00'},peak:{t:'2026-08-06T17:04:22+02:00'},end:{t:'2026-08-06T23:04:42+02:00'},
    officialSummary:'No atribuïm un avís oficial a aquest episodi perquè l’historial disponible no n’ha confirmat cap coincidència territorial i temporal.',
    profile:[['00',28,0,7.9],['03',28,0,7.9],['06',26.6,3.3,7.9],['09',30.1,1.78,19.8],['12',34.2,0,30.9],['15',32.8,0,59.9],['18',21.9,2.54,23.8],['21',21.2,0,19.8]]
  },
  {
    id:'contrast-termic-14-setembre-2026',date:'2026-09-14',kind:'thermal',title:'Dinou graus de contrast en un sol dia',subtitle:'De 16,1 °C a primera hora a 35,5 °C a la tarda',
    summary:'La diferència entre la mínima i la màxima observades va ser de 19,4 °C, sense pluja registrada i amb una ratxa màxima moderada de 23 km/h.',
    narrative:['La mínima, 16,1 °C, es va registrar cap a les 06 h. A partir del matí la temperatura va pujar amb rapidesa fins als 35,5 °C de les 14 h.','Aquest és un exemple útil de per què una única lectura diària explica poc: la cronologia mostra una amplitud molt gran. No la comparem amb una normal climàtica perquè l’arxiu de l’estació encara és massa curt.'],
    rain:0,gust:23,low:16.1,high:35.5,range:19.4,coverage:91,sampleCount:22,start:{t:'2026-09-14T00:05:02+02:00'},peak:{t:'2026-09-14T14:05:03+02:00'},end:{t:'2026-09-14T23:00:00+02:00'},
    officialSummary:'No consta cap avís oficial coincident a l’historial disponible; aquesta peça descriu només l’observació local.',
    profile:[['00',18.9,0,8.7],['03',17.6,0,14.2],['06',16.9,0,9.5],['09',25.6,0,15.8],['12',33.1,0,23],['15',32.7,0,22.2],['18',29.7,0,16.6],['21',25.2,0,10.9]]
  }
]);

export function editorialStoryById(id=''){return EDITORIAL_STORIES.find(story=>story.id===id)||null;}
