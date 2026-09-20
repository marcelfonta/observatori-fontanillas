# Còpies automàtiques del laboratori Fonta

20/09/2026 · Implementació preparada, **no activada ni validada encara amb la
credencial restringida real**. Autoritzada pel responsable; cal revisar/fusionar
la PR i completar credencials abans del primer circuit remot.

## Disseny i abast

Workflow `fonta-r2-backup.yml`, només `main`, GitHub `contents: read`, sense
credencial de checkout persistent ni canvis a la branca de dades. Clona un
snapshot coherent de `fonta-data`, valida/exporta captures v1/v2 i treballa en
directoris nous. No consulta fonts meteorològiques ni D1.

Programació prevista: **08:45 i 20:45 UTC** (10:45 i 22:45 Europe/Madrid a
l'estiu; 09:45 i 21:45 a l'hivern). GitHub pot retardar els crons. El backup
té una exclusió mútua pròpia i no bloqueja els capturadors; el snapshot clonat
és coherent encara que el capturador publiqui un commit posterior.

Bucket únic: `fonta-research-archive`, privat, jurisdicció `default`, Standard.
No s'utilitzen el bucket social ni el token general de Cloudflare. La guia
Cloudflare confirma que **Object Read & Write limitat al bucket requereix S3**;
el transport REST antic no serveix amb aquest permís mínim.

El client oficial `@aws-sdk/client-s3` té versió fixada al lockfile, endpoint
derivat d'un identificador validat, credencials explícites, sense reintents ni
redireccions regionals. Només ListObjectsV2/GetObject/PutObject. Cap DELETE,
gestió de bucket, CORS, publicació o canvi de permisos públics.

1. Verifica originals, hashes, dates i contractes.
2. Comprova inventari complet i pressupost abans de cap pujada.
3. Reutilitza objectes existents si el hash i la mida coincideixen. Claus pel
   contingut; manifest estable per data del commit del snapshot, evitant còpies
   duplicades en reintents del mateix snapshot.
4. Escriu objectes nous amb `If-None-Match: *`; un conflicte no sobreescriu res.
   Torna a llegir i validar cada objecte pujat. Manifest sempre al final.
5. Descarrega tota la còpia en un directori nou, verifica hashes i semàntica,
   reconstrueix l'informe v1 i el v2 quan existeix. Només després emet un rebut
   amb `restored:true`, manifest, commit d'origen, volum i data de comprovació.

Els informes continuen experimentals. La recuperació no substitueix l'arxiu
actiu ni activa cap predicció. En mode `plan` no s'escriu a R2 i el rebut diu
`committed:false`, `restored:false`: no és una còpia completada.

## Límits i fallades

- 100 MiB totals al bucket i menys de 1.000 objectes. Inventari truncat/ambigu,
  dades corruptes, credencials absents o mida incorrecta: fallada explícita.
- Avís al 80% al rebut/resum de GitHub. És un límit del pilot, **no retenció
  rodant**: no elimina còpies antigues. Cal revisar el pressupost abans d'arribar
  al límit; no es promet continuïtat indefinida.
- Job de 15 minuts; peticions/lectures acotades. Una interrupció pot deixar
  objectes ja verificats però no un rebut d'èxit. El següent intent els reutilitza.
- Només un escriptor autoritzat al bucket; la serialització de GitHub no és
  un bloqueig global contra pujades manuals o aplicacions externes.
- Els rebuts es conserven com a artefacte GitHub 30 dies; no s'hi pugen captures
  originals, fotos o secrets. Les fallades apareixen a Actions; les notificacions
  de correu depenen de les preferències GitHub del responsable.
- Una còpia sana no prova que el capturador hagi produït dades noves. Comprovar
  per separat els crons de captura, antiguitat i cobertura del laboratori.

## Credencials: pas necessari abans d'activar

L'API disponible ha retornat `9109 Unauthorized` en consultar gestió de tokens;
no s'ha creat cap token ni ampliat permisos. Verificat a GitHub: els dos secrets
S3 encara no existeixen; `FONTA_R2_ACCOUNT_ID` ja està configurat i
`FONTA_R2_BACKUP_ENABLED=false`. Al tauler Cloudflare:

1. R2 → Manage API Tokens → Create Account API Token (o User API Token si el
   rol del compte no permet l'anterior).
2. Nom `Fonta research backups`; permís **Object Read & Write**, només el
   bucket `fonta-research-archive`. No `Admin Read & Write` ni tots els buckets.
   Registrar la caducitat escollida i renovar abans de vèncer.
3. Desar directament com a secrets GitHub Actions del repositori:
   `FONTA_R2_ACCESS_KEY_ID` i `FONTA_R2_SECRET_ACCESS_KEY`.
   No enganxar-los al xat, codi o logs. El secret de S3 no és el token Bearer.
4. Variable GitHub `FONTA_R2_ACCOUNT_ID` amb l'identificador del compte.
   `FONTA_R2_BACKUP_ENABLED` ha de quedar `false` fins a configurar-ho tot.

## Activació i acceptació

Després de merge i secrets, mantenir el cron desactivat i executar manualment
`mode=plan` (la prova manual explícita no necessita la variable activa).
Verificar bucket, volum previst i
absència d'escriptures. Executar `mode=run`; només acceptar si conclou amb èxit,
`restored:true`, hashes verificats i informes reconstruïts. Repetir sobre el
mateix snapshot: zero pujades noves i el mateix manifest. Només després activar
`FONTA_R2_BACKUP_ENABLED=true`. Si falla qualsevol pas, deixar-la a `false`.

Comprovar posteriorment una execució amb event `schedule`; una execució manual
no la substitueix. No cal desplegar el Worker ni migrar D1.

Ordres locals equivalents (credencials només a l'entorn):

```sh
node scripts/fonta/backup.mjs plan SNAPSHOT_GIT DIRECTORI_NOU
node scripts/fonta/backup.mjs run SNAPSHOT_GIT UN_ALTRE_DIRECTORI_NOU
```

## Rollback

`FONTA_R2_BACKUP_ENABLED=false` atura pròximes execucions, però no un job ja en
marxa: cancel·lar-lo explícitament si cal. Conservar objectes i rebuts. Revocar
només el token dedicat si se sospita filtració. Cap esborrat de bucket o captures.

## Verificació local

Proves amb Node 22: mode pla sense escriptures, S3 real amb transport simulat
(serialització, signatura i XML), inventari truncat, límits, cos absent/corrupt,
errors sense secrets, restauració, reintent idempotent, interrupció parcial i
arxiu mixt v1/v2 amb reconstrucció dels informes. `test:quick`, `check` i
`worker:dry-run` superats; el dry-run no és un desplegament ni una prova remota.
Falta encara la verificació amb el nou token del bucket; no confondre-la amb
la recuperació manual anterior feta amb Wrangler.

## Fonts oficials revisades

- [Cloudflare: permisos i credencials S3](https://developers.cloudflare.com/r2/api/tokens/)
- [Cloudflare: client S3 JavaScript](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [Cloudflare: operacions S3 i escriptures condicionals](https://developers.cloudflare.com/r2/api/s3/api/)
