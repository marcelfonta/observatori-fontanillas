# Revisió de producció — 24/10/2026

## Estat comprovat

- La portada pública mostra «Sense avisos oficials actius ara» quan l'API oficial retorna zero avisos actius. La mateixa resposta indicava `status: clear`; un error de consulta continua mostrant un estat diferent.
- El Worker públic informava `healthy` a `/public-status` en el moment de la revisió.
- A Medi Ambient, el mapa XVPCA carrega 75 estacions i permet veure el detall oficial quan el mòdul ja està preparat. La prova d'obrir la pestanya immediatament després d'entrar a la pàgina va revelar un clic perdut; la correcció i la prova de regressió són en aquesta branca.
- El workflow de YouTube del timelapse del 23/10 va acabar correctament. La publicació visible a cada canal i l'absència de duplicats no es dedueixen només del resultat del workflow i resten per comprovar.

## Comprovació pendent el 25/10

1. Obrir Medi Ambient al mòbil, prémer «Estacions · aire» tot just entrar i comprovar que s'obre el mapa i que el detall d'una estació mostra font i hora.
2. Comprovar la nova imatge de la webcam amb llum de dia i de nit: CO₂ diferenciat dels contaminants locals i cercles XVPCA coherents amb el visor oficial.
3. Verificar la publicació automàtica del timelapse i les publicacions visibles a cada canal habilitat, sense fer cap reintent manual que pugui duplicar-les.
4. Revisar el visor de sequera només quan l'ACA torni a oferir el mapa interactiu; mentrestant, l'accés oficial alternatiu continua visible.
