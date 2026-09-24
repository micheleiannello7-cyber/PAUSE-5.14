# HANDOFF — copertine PAUSE da rigenerare (per il prossimo agente)

Stato al 24/06/2026: 437 contenuti, 427 con copertina, **10 vuote** (credito API esaurito).
Revisione visiva integrale conclusa: `REVIEW.md` in questa cartella. **Nulla è stato sostituito.**
Le decisioni complete (42 voci con id, motivo, prompt) sono in `flagged_covers.json`, nel formato
accettato da `backend/replace_reviewed_covers.py`.

## Ordine di lavoro quando l'utente conferma di aver ricaricato il credito
1. Le **10 vuote**: `cd /app/backend && python generate_covers.py --concurrency 1`
   (ids: lez-orbite-gravita, lez-teoria-colore, lez-leggere-mappa, lez-fusi-orari, lez-etimologia,
   lez-calendario, lez-respirazione, lez-febbre, lez-ghiaccio-galleggia, lez-eco).
2. Le **15 GRAVI** qui sotto (priorità "alta" in `flagged_covers.json`).
3. Solo se richiesto: le MEDIA (11) e BASSA (16).

Procedura sostituzioni: `python replace_reviewed_covers.py memory/cover_review_final/flagged_covers.json`
genera le candidate fuori linea (la vecchia resta attiva), poi ispezione visiva, poi `--publish id1,id2`.
Stesso modello/stile (Gemini Nano Banana, 896×1200, WebP q84). Fermarsi subito su errore di budget.
Controllare SEMPRE che la nuova immagine non contenga scritte (EDITORIAL/PAUSE/MAGAZINE).

## Le 15 GRAVI (priorità alta)
| # | id | Problema |
|---|---|---|
| 29 | v4-strisce-zebra | Cavallo con coperta zebrata, non una zebra |
| 214 | cur-why-onions-cry | Occhio umano che piange dentro la cipolla |
| 421 | v8-why-does-a-charger-stay-warm-even-when-it-s-charging-not | Caricatore con spine da muro su entrambe le estremità |
| 74 | v4-stomaco-acido | Stomaco di vetro ambrato quasi identico al fegato (#73 v5-fegato-rigenera): cambiare soggetto/scena |
| 383 | sto-spices | Dipinto astratto, nessuna spezia |
| 172 | geo-why-deserts | Spiaggia tropicale invece di deserto (foto identica a #178) |
| 26 | v4-lez-catena-alimentare | Scritte "PAUSE" / "LESSON…" impresse |
| 60 | arte-why-modern-art | Scritta "EDITORIAL" |
| 78 | v5-lez-etichetta-nutrizionale | Scritta "EDITORIAL" + testo finto |
| 84 | v5-giramento-testa | Scritta "PAUSE" + titolo impresso |
| 169 | time-zones | Scritta "EDITORIAL" |
| 234 | v5-lez-distorsioni | Finta copertina "Mentiali EDITORIAL MAGAZINE" |
| 280 | v5-lez-hotel-hilbert | Scritta "3:4 EDITORIAL MAGAZINE COVER" |
| 306 | cur-why-mirrors-reverse | Scritta "VIITORIAL MAGAZINE" |
| 318 | v5-lez-telescopio | Scritte "MAGAZINE" + "HASSELBLAD 500CM…" |

## Troppo simili tra loro (segnalati dall'utente o in revisione)
- **Fegato #73 / Stomaco #74**: stessa resa "organo di vetro ambrato su sfondo laboratorio blu" → rifare lo stomaco (in lista GRAVI).
- Andromeda usata ×4 (#313, #322, #325, #341), ape ×2 (#3, #27), brunch ×2 (#72, #86), libri ×2 (#110, #121),
  cervello ×2 (#232, #243), sveglia ×2 (#242, #253), spiaggia ×2 (#172, #178), Colosseo ×2 (#381, #386).
- Non difettosi ma ripetitivi: 3 polpi, 2 elefanti, 2 fulmini, 3 torchi da stampa, 3 sfere armillari, 2 cuffie, 2 lucchetti su tastiera, 2 popcorn.

## Vincoli
- Non sostituire nulla senza approvazione visiva; conservare originali e riferimenti (backup automatico dello script).
- Non riavviare generazioni da solo: attendere conferma esplicita dell'utente sul credito.
- Numeri (#) = numerazione del catalogo in `catalog.json` / fogli `sheet-*.jpg`.
