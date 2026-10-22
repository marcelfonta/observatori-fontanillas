export const MONTHLY_SUMMARIES=Object.freeze([
  {
    id:'2026-09',label:'Setembre de 2026',period:'1–30 de setembre de 2026',published:'2026-10-22',
    title:'Setembre de 2026: calor persistent i tres episodis de pluja',
    summary:'L’estació Fontanillas va registrar 30,98 mm, una màxima de 37,8 °C, una mínima de 12,2 °C i una ratxa de 45,4 km/h, amb un 95,8% de cobertura temporal.',
    metrics:{mean:23.2,low:12.2,lowAt:'10 de setembre · 07 h',high:37.8,highAt:'6 de setembre · 12 h',rain:30.98,rainDays:4,gust:45.4,gustAt:'8 de setembre · 13 h',coverage:95.8,observations:697},
    highlights:[
      {date:'6 de setembre',title:'Màxima mensual',copy:'37,8 °C observats al migdia. Aquell dia conserva un 60% de cobertura, fet que s’indica abans d’interpretar-ne l’evolució completa.'},
      {date:'16 de setembre',title:'Dia més plujós',copy:'19,05 mm, el 61,5% de tota la precipitació mensual registrada.'},
      {date:'8 de setembre',title:'Ratxa màxima',copy:'45,4 km/h a les 13 h, amb cobertura completa de la jornada.'},
      {date:'10 de setembre',title:'Mínima mensual',copy:'12,2 °C a les 07 h, amb cobertura completa de la jornada.'}
    ],
    quality:['Hi ha dades els 30 dies del mes.','Cobertura temporal estimada: 41.395 de 43.200 minuts (95,8%).','Les jornades 4, 6 i 15 tenen menys del 85% de cobertura; els seus totals i extrems s’han de llegir amb aquesta limitació.','La mitjana de 23,2 °C està ponderada pels minuts coberts. No és una normal climàtica ni s’hi compara.'],
    daily:[[1,19.4,31.4,0,35.7,100],[2,19.1,33.6,0,32.5,94],[3,19.1,33.6,0,33.3,100],[4,20.5,36.7,0,26.1,75],[5,20.3,37.2,0,27.7,92],[6,19.5,37.8,0,23.8,60],[7,18.3,36.9,0,26.9,91],[8,18.6,34.7,0,45.4,100],[9,16.4,26.3,.25,27.7,100],[10,12.2,28.1,0,34.1,100],[11,13.6,29.7,0,35.7,100],[12,15.7,30.6,0,29.3,100],[13,15.1,31.9,0,26.9,100],[14,16.1,35.5,0,23,91],[15,17.8,34.7,0,23.8,72],[16,17.1,28.8,19.05,34.1,100],[17,16.4,25.3,5.84,41.4,100],[18,15.5,26.7,0,32.5,100],[19,14.4,27.8,0,25.4,100],[20,13.6,30.8,0,22.2,100],[21,15.7,34.2,0,26.1,100],[22,16.1,30.8,0,23,100],[23,13.6,32.8,0,21.4,100],[24,14,31.4,0,34.9,100],[25,15.6,32.5,0,25.4,100],[26,14.4,29.5,0,25.4,100],[27,15.1,29.1,0,26.1,100],[28,17.2,28.6,0,22.2,100],[29,19.2,26.6,5.84,12.6,100],[30,17.3,26.9,0,23,100]]
  }
]);

export function monthlySummaryById(id=''){return MONTHLY_SUMMARIES.find(summary=>summary.id===id)||null;}
