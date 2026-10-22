import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSeoStructuredGraph} from '../src/features/seo.js';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const roadmap=await readFile(new URL('../ROADMAP.md',import.meta.url),'utf8');

for(const text of ['Per què la temperatura pot diferir de Meteocat?','Com de fiable és l’estació?','Les dades són definitives?','Quina diferència hi ha entre observació i predicció?','Què és Fonta?','Com s’han d’interpretar els avisos?'])assert.match(html,new RegExp(text.replace(/[?]/g,'\\?')));
for(const risk of ['Calor','Pluja intensa','Vent','Tempesta','Neu o gel'])assert.match(html,new RegExp(`>${risk}<`));
assert.match(html,/consells_autoproteccio_emergencia\/riscos_naturals/);
assert.match(html,/davant una emergència, truca al 112/);
assert.match(html,/no una ordre automàtica de reg/);

const faq=buildSeoStructuredGraph('aprendre')['@graph'].find(item=>item['@type']==='FAQPage');
assert.equal(faq.mainEntity.length,6);
assert.equal(buildSeoStructuredGraph('inici')['@graph'].some(item=>item['@type']==='FAQPage'),false);
assert.doesNotMatch(roadmap,/\*\*Utilitat:\*\*/);

console.log('Utilitat: resum, FAQ, indicadors i orientació de seguretat correctes');
