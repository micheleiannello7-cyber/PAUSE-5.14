# PAUSE — Revisione visiva integrale delle copertine (giugno 2026)

Revisione completata su **427 copertine** (tutte quelle esistenti). Le **10 ancora vuote**
restano in attesa di credito API. **Nessuna copertina è stata sostituita o toccata**: questo
documento e `flagged_covers.json` servono solo a segnare cosa correggere in futuro.

Metodo: snapshot read-only del catalogo (`backend/catalog_cover_sheets.py --allow-missing`),
36 fogli di controllo `sheet-*.jpg` in questa cartella, ispezione visiva di ogni immagine,
ingrandimento dei casi dubbi, confronto SHA256/dHash per i duplicati. Nessuna chiamata AI.

## Risultato in numeri
| Esito | Copertine |
|---|---|
| OK (belle, coerenti, senza difetti) | **387** |
| Da rifare — priorità ALTA | **13** |
| Da rifare — priorità MEDIA | **11** |
| Da migliorare — priorità BASSA | **16** |
| Duplicati byte-identici (gruppi) | 8 gruppi, 17 storie coinvolte |

## Priorità ALTA (13) — errori evidenti
| # | Storia | Problema |
|---|---|---|
| 29 | Le strisce delle zebre | **Cavallo con coperta zebrata**, non una zebra |
| 214 | Perché la cipolla fa piangere | **Occhio umano dentro la cipolla**, inquietante |
| 383 | Le spezie hanno cambiato la storia | Dipinto astratto, nessuna spezia |
| 172 | Perché i deserti si formano dove… | Spiaggia tropicale (e foto identica a #178) |
| 26 | Catena alimentare | Scritte "PAUSE" / "LESSON…" impresse |
| 60 | Arte moderna | Scritta "EDITORIAL" |
| 78 | Etichetta alimentare | Scritta "EDITORIAL" + testo finto sulla scatola |
| 84 | Giramento di testa | Scritta "PAUSE" + titolo impresso |
| 169 | Fusi orari | Scritta "EDITORIAL" |
| 234 | 4 distorsioni del pensiero | Finta copertina "Mentiali EDITORIAL MAGAZINE" |
| 280 | Albergo di Hilbert | Scritta "3:4 EDITORIAL MAGAZINE COVER" |
| 306 | Specchio destra/sinistra | Scritta "VIITORIAL MAGAZINE" |
| 318 | Telescopio | Scritte "MAGAZINE" + "HASSELBLAD 500CM…" |

## Priorità MEDIA (11) — coerenza debole o duplicati
- #1 Uccelli migratori → pappagallo verde (non migratore)
- #72 Secondo cervello nella pancia → tavola da brunch (identica a #86)
- #75 Digestione → anatomia grottesca/imprecisa
- #92 Perché dormiamo → gatto sotto le coperte
- #122 Perché piangiamo, #357 Datare un reperto → piccola scritta "PAUSE"
- #339 La Luna e le maree → unica generata orizzontale a bassa risoluzione (1024×559)
- #313 Voyager, #322 nomi di stelle, #325 Big Bang, #341 suono nello spazio → **stessa foto di Andromeda ×4**

## Priorità BASSA (16) — migliorabili quando c'è credito
Duplicati foto: #27 ape (=#3), #121 lingue (=#110), #243 cervello (=#232), #253 sveglia (=#242,
fondo bianco fuori stile), #386 Impero Romano (=#381 Colosseo).
Coerenza debole: #90 pelle (smalto unghie), #274 atomo (lavagna E=mc²), #223 paura, #239 memoria,
#226 feedback, #409 OLED.
Dettagli: #295 marchio illeggibile sul sacchetto, #9 cucciolo d'orso con alone, #193 chiazza
"petrolio", #308 inquadratura lingua/zucchero filato, #344 Terra con anelli.

## Somiglianze NON difettose (solo per conoscenza, nessuna azione)
Tre polpi (#21-23), due elefanti (#8, #12), due fulmini (#190, #192), due torchi da stampa
(#373, #382, + #356), tre sfere armillari (#173, #329, #332), due cuffie (#391, #405),
due lucchetti su tastiera (#394, #410), due popcorn (#291, #294). Soggetti pertinenti ai titoli;
da valutare solo se si vuole più varietà.

## Note
- Le 47 copertine fotografiche (Unsplash) sono all'origine di quasi tutti i duplicati e delle
  incoerenze "deboli"; molte sono orizzontali/chiare e stonano con lo stile cinematografico.
- `flagged_covers.json` è già nel formato accettato da `backend/replace_reviewed_covers.py`
  (`id`, `reason`, `prompt`) per il giorno in cui si vorrà rigenerare: la procedura prepara
  le candidate fuori linea, mantiene la vecchia attiva e pubblica solo dopo approvazione visiva.
- Ordine consigliato con nuovo credito: prima le **10 vuote**, poi le 13 ALTA, poi MEDIA.
