// Synthetic schema fixture, never meteorological evidence or publishable data.
export const xacFixture=`<reports><credit><creditName>PIA · prova sintètica</creditName><license>CC BY-NC-SA 4.0</license></credit>
<taxons><pollens><URTI ca="Parietària">Urticaceae</URTI><CUPR ca="Xiprers">Cupressaceae</CUPR></pollens><spores><ALTE ca="Alternària">Alternaria</ALTE></spores></taxons>
<legend><current><value ca="Nul">0</value><value ca="Baix">1</value><value ca="Mig">2</value><value ca="Alt">3</value><value ca="Màxim">4</value></current><forecast><value ca="Augment">A</value><value ca="Estable">=</value><value ca="Descens">D</value><value ca="Situació excepcional">!</value></forecast></legend>
<report><station><name>Bellaterra</name><url>https://aerobiologia.cat/pia/ca/forecast/bellaterra</url></station><date><start>2026-09-21</start><end>2026-09-27</end></date>
<current><pollens><URTI>1</URTI><CUPR>0</CUPR></pollens><spores><ALTE>4</ALTE></spores></current>
<forecast><pollens><URTI>=</URTI><CUPR>A</CUPR></pollens><spores><ALTE>=</ALTE></spores></forecast></report></reports>`;
