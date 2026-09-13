# Incidència de cua de YouTube del 13-09-2026

## Impacte

La franja de les 07:00 va publicar correctament la targeta diària a Bluesky i Telegram, però el vídeo no va arribar puntualment a YouTube, Meta, TikTok ni X.

## Evidència

- El disparador principal de Cloudflare va ser acceptat a les 06:20.
- GitHub va mantenir l’execució `34737637122` en cua sense runner assignat.
- El Worker va interpretar l’absència de confirmació com un intent perdut i va enviar noves execucions a les 06:30, 06:40 i 06:50. La concurrència de GitHub en va cancel·lar dues i en va deixar una pendent.
- GitHub Status no informava d’una incidència general d’Actions i el repositori públic mantenia Actions activat.
- Després de cancel·lar exclusivament les dues cues actives, l’execució manual `34740137368` va començar immediatament.
- YouTube va confirmar el vídeo públic `eg4HRkShnJY`. La pujada privada a R2 també es va completar.
- TikTok va retornar 409 perquè la seva hora programada ja havia passat. Aquest error va impedir executar el pas posterior d’X, tot i que YouTube ja estava completat.

## Correcció

1. La reserva d’un dispatch acceptat passa de 8 a 45 minuts, cobrint tota la finestra del disparador principal.
2. YouTube conserva la programació normal quan hi ha almenys cinc minuts de marge.
3. Si falten menys de cinc minuts, el workflow espera l’hora prevista abans de fer pública la pujada.
4. Si GitHub arrenca tard, el Short es publica immediatament fins a un màxim de 90 minuts després de la franja. Més tard, caduca per evitar contingut descontextualitzat.
5. TikTok comparteix la recuperació de 90 minuts i utilitza enviament immediat quan l’hora ja ha passat.
6. TikTok i X són passos independents: una fallada d’un canal no bloqueja l’altre ni anul·la l’èxit de YouTube.

## Validació i rollback

- Proves dirigides: càlcul horari d’estiu i hivern, marge inferior a cinc minuts, retard de vint minuts, caducitat de noranta minuts, recuperació TikTok/X i màxim d’intents.
- Abans de producció: `npm run check`, dry-run, staging i comprovació de `/version`.
- Rollback: tornar el Worker a 22.29.13 i el workflow al commit anterior. No hi ha migració D1 ni canvi de secrets.
