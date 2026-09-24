# PAUSE — Product Requirements Document

## Original Problem Statement
User asked to faithfully migrate their existing public GitHub repository app
(https://github.com/micheleiannello7-cyber/PAUSE-4.96.git) into this Emergent
environment and make the preview ready. Requirement: recreate the same app (UI +
functionality) exactly.

## What PAUSE Is
A calm micro-learning mobile app. In empty moments, users read or listen to short
curiosity stories and 2–3 minute mini-lessons across ~12 categories. Designed to
"leave you something, not keep you hooked" — no infinite feed. Italian is the
primary language with full English translations.

## Architecture
- **Frontend:** Expo (SDK 57) + expo-router, React Native 0.86, React Query,
  react-native-reanimated, expo-audio (TTS player), expo-image, i18n (it/en),
  themeable (light/dark/system + accent). No login — anonymous user_id persisted
  locally via storage util.
- **Backend:** FastAPI + Motor/MongoDB. Auto-seeds 12 categories + 437 stories/
  lessons on startup (`ensure_seed`). OpenAI TTS narration via EMERGENT_LLM_KEY,
  content-hashed audio asset layer, Object Storage for generated covers/art with
  an on-disk media cache, Stripe purchase hooks for category unlocks.
- **Data:** collections `categories`, `stories`, `user_state`, `purchases`,
  `design_assets`. DB_NAME=test_database.

## User Personas
- **The curious commuter** — wants a quick, meaningful thing to learn in 2–3 min.
- **The mindful user** — wants to learn without doom-scrolling; values the session
  limit / "pause" philosophy.

## Core Requirements (static)
- Browse categories, discover deck, explore, bookmarks, profile tabs.
- Open a story → chapter pager reader with hero art + audio narration.
- Personalize interests during onboarding; track completion, streaks, stats.
- Bookmark/like/save stories; premium gating + session pause limit.
- Bilingual content (it/en) with language toggle.

## Implemented (migration — 2026-06)
- [2026-06] Re-imported PAUSE-4.98 zip into this Emergent environment; preview made live.
  Frontend deps via `yarn install`, backend deps via `pip` (fixed litellm wheel sha256
  conflict with emergentintegrations by dropping the URL hash fragment). backend/.env wired
  with EMERGENT_LLM_KEY + INTEGRATION_PROXY_URL. app.json plugins adopted from the app while
  keeping this env's bundle id (com.emergent.appanalyzer.btk27f). Verified: /api/health ok,
  12 categories + 437 stories seeded, intro + onboarding screens render with category art.
  Note: app has no auth (anonymous user_id in local storage) — no test credentials required.
- [2026-06] Full verbatim code migration from repo into /app (backend + frontend).
- [2026-06] Frontend deps installed (yarn), backend deps installed (pip). SDK 57.
- [2026-06] backend/.env wired: MONGO_URL, DB_NAME, EMERGENT_LLM_KEY, INTEGRATION_PROXY_URL.
- [2026-06] Backend boots and auto-seeds 12 categories + 437 stories. Preview live.
- [2026-06] Testing agent: backend 12/12 pytest pass; frontend core flows 100%
  (onboarding → tabs → deep-dive reader → bookmark → stats → it/en toggle).
- [2026-06] Fixed media endpoints returning 500 → clean 404 for Object Storage
  assets missing in this env (media_cache.cached_object). Frontend SVG fallbacks intact.

## Known Environment Notes
- Some seeded generated covers/category art reference the source repo's Object
  Storage bucket; those bytes aren't in this env, so those images fall back to
  SVG artwork (by design). Curated Unsplash covers load fine.
- TTS audio generation for new story/voice combos depends on EMERGENT_LLM_KEY
  budget; cached combos play, others show "Audio non disponibile".

## Backlog / Remaining
- **P0:** None outstanding in the requested intro/Home changes.
- **P1:** User visual verification of Home and saturated intro; optional physical iOS/Android check.
- **P2:** Address pre-existing TypeScript errors in `app/stats.tsx` and
  `src/components/story-hero.tsx` separately, without changing intro scope.
- Runtime AI cover generation was explicitly declined by the user. Do not
  configure its missing key or propose enabling it unless asked.

## Next Tasks
- Await user visual feedback; reader/Explore/Profile contents unchanged.

## Current request — September 2026: new introduction
- User language: Italian. Faithfully replicate supplied presentation screenshot,
  excluding the photographed phone bezel and fake system status indicators.
- Preserve CTA -> existing topics -> Home, back navigation, IT/EN localization.
- First version reused clipped original screenshot art. User rejected its low
  resolution and muted colours, explicitly asking to regenerate from scratch.
- Current version: entirely regenerated clean vivid alpine sunset/lake/person
  background, separate SVG pause logo and vector stylized A/native wordmark,
  native localized typography and saturated blue/violet/cyan gradient button.
  Three visual dots match the reference; no extra onboarding routes were added.
- Files: `src/components/onboarding-intro.tsx`, `onboarding-brand.tsx`; only step
  zero of `app/onboarding.tsx` replaced. No backend/integration/config changes.
- Background stored by image-generation tool at managed static image URL in
  intro component; actual source 848x1264 JPEG. Do not claim 4K/retina artwork.
  Vector branding/text/buttons are rendered at device resolution.
- Reports iteration_4 and iteration_5 verify initial/revised intro respectively;
  revised version passed all requested mobile layouts, IT/EN, light theme and
  failed-artwork fallback. No physical device available.
- Prior transient preview 502 diagnosed as cold-start recovery, stale ENOENT
  log irrelevant; current service stable. Protected framework files untouched.

## Current request — reference Home structure
- Screenshot: `w867j4dp_file_00000000bff881f59268271ce9dd14ed.png` in supplied assets.
- Copy structure/positioning, NOT new cover/icon styles. Existing generated and
  curated story covers and category 3D artwork remain in their original pipeline.
- Native animated circular carousel: central card width 86.6%, 2.1% gap, actual
  neighbouring stories peek from both edges, swipe and tap-to-reader. Seven
  real stories fetched before enabling swipes, then kept in a stable loop.
  Filters/language changes load a fresh loop; there is no mid-swipe insertion.
- Card: top-left kind/category pills, top-right minutes, bottom title + real
  hook + full-width gradient reading button. Premium listen remains available.
- Four-column/two-row grid, up to 8 selected categories; See all opens Explore.
  Category filters and content-mode-specific real counts preserved. Existing
  IDs/names respected (Corpo umano, Arte & Design rather than renamed examples).
- New progress strip uses actual completed_story_ids length. 20-story milestone
  increments in steps of 20 after completion; not a new session restriction.
  Opens existing Stats; no fake 8/20 count. Resume reading retained below it.
- Four existing tabs retain routes/icons; rounded taller bar respects safe area.
- Modified Home components + discover route, tab layout, localized labels and
  optional prominent PauseLogo sizing; no backend/config/dependency changes.
- Iteration6 verified responsive Home, card/side-card/CTA navigation, filters,
  category counts, progress -> Stats, tab navigation, IT/EN, themes and intro.
  Its one HIGH issue (wrap neighbour changed due to concurrent append) was
  fixed with a stable seven-story loop before enabling gestures. Final public
  preview self-test: 4 backward-wrap/forward-return pairs + full 7-card forward
  cycle, all returned to the expected IDs; reader CTA then passed. Details in
  `test_reports/home_wrap_followup.md`. No outstanding scoped functional bugs.

## Home card update (Jun 2026)
- Card content reduced to title only: removed "Leggi la curiosità/mini lezione" CTA (home-read-button.tsx deleted) and hook text. Card opens on tap; premium listen icon kept at bottom-right.
- Legibility: top scrim for badges, stronger bottom scrim (0 → 0.97) + text shadow on title so text reads on any cover.
- Idle hint: after 7s without swipe/touch on the deck, cards sway ~7% of stride and settle; repeats every 7s, cancelled on touch/move, stopped when Home loses focus (home-story-deck.tsx).
- Long-press preview (home-story-card.tsx): holding a card ≥350ms slides up a panel with title + hook + hint "Rilascia, poi tocca per leggere"; releasing hides it, tap still opens the story.
- Category discovery pulse (home-controls.tsx + discover.tsx): first Home tile whose stats.categories.read === 0 pulses (scale 4.5% + glow border) with a "Da scoprire" badge; stops when selected.

## Sessione 23/09/2026 — ripristino da ZIP 4.97 + copertine 4.971 + lettore verticale
### Ripristino ambiente
- Codice PAUSE-4.97 ripristinato in /app; `.env` frontend/backend preservati (aggiunti EMERGENT_LLM_KEY, INTEGRATION_PROXY_URL).
- Dipendenze mancanti installate (vector-icons, expo-audio, expo-file-system, expo-localization, expo-sharing, react-native-svg,
  react-native-view-shot; pip: emoji, jq). Backend auto-seed: 12 categorie / 437 storie. Preview funzionante.
- Test backend legacy: 148 pass / 90 fail pre-esistenti (aspettative vecchie: 13 categorie, tempi lettura, premium seed) — non toccati.

### Copertine dallo ZIP 4.971 (solo copertine, nulla di più)
- Copiati: 15 nuovi jpg in `backend/covers/` (es. black-holes-basics, octopus-brains, v4-giorno-venere corretti), 268 file `media_cache`,
  `imported_cover_sources.json` (110 sorgenti CDN), `restore_imported_covers.py`, `cover_editorial.py` + `cover_editorial_decisions.json`
  (117 esclusioni per abbinamenti sbagliati), `cover_review.py` (dipendenza), `memory/cover_import_4_96.json`.
- `server.py` startup: dopo `cover_curation` ora esegue `restore_imported_covers` + esclusioni editoriali (idempotente, nessuna generazione AI).
- Eseguito una volta `restore_generated_covers.py` (60 copertine 4.97, 41 ricaricate). Risultato: 132 storie con copertina generata,
  264 endpoint hero/thumb 200 OK. Le locali vincono sulle importate (digest diverso → ricaricate).

### Lettura verticale a cascata (richiesta utente, frontend-only)
- `app/deep-dive/[id].tsx` riscritto: unico `Animated.ScrollView`; copertina in alto (≤46% altezza, parallasse), intro sovrapposta,
  sezioni capitolo in cascata, conclusione. Nessun pager orizzontale: eliminati `book-pager.tsx` e `reader-nav.tsx`.
- Nuovi componenti: `reader-header.tsx` (indietro, indicatore "3 di 6" + barra sottile, Ascolta premium, Salva; fondo vetro appare
  oltre la copertina), `reader-section.tsx` (occhiello con punto luminoso, titolo, paragrafi; divisore gradiente), `reader-ending.tsx`
  (card "Da ricordare", Mi piace/Condividi/Home, GlowButton "Prosegui con un'altra notizia").
- Sezione corrente calcolata nello scroll handler (ancora a 38% dello schermo); scala progresso invariata (0 intro, 1..n capitoli, n+1 fine)
  → salvataggio/ripresa lettura compatibili. `start=1` scorre al capitolo 1; il gesto del lettore è rilevato anche via wheel su web.
- i18n: `tip_reader` aggiornato (scroll verticale). Testing iteration_7: 96% pass; fix ripresa su web verificato manualmente.
- Revisione utente: copertina ora FISSA sullo sfondo (non scorre via): scorrendo si riduce (scala 1→0.9), sale di poco e si scurisce fino al 72%
  restando visibile; il testo scorre sopra. Badge tipo/categoria/durata in alto sulla copertina con la stessa gerarchia della card Home:
  nuovo componente condiviso `src/components/story-meta-chips.tsx` (usato da `home-story-card.tsx` con gli stessi testID e dal lettore in
  variante `size="md"` più leggibile). Rimossi dal lettore CategoryTag/KindBadge/MetaInline dell'intro.

## Aggiornamento — icone 3D e lettore (sessione corrente)
- `KindIcon` (lampadina 3D = Curiosità, libri 3D = Mini lezione, animazione di accensione) integrato in: meta-chips (card Home + lettore), `KindBadge`, badge `LessonCover`, toggle onboarding (si accende quando selezionato).
- Lettore: apertura sempre dall'introduzione (rimosso `?start=1` dalla Home); occhiello "INTRODUZIONE" grande; titolo spostato nella barra in alto (più alta, trasparente, sempre in vista) con indicatore di avanzamento; rimossi "Capitolo N"/"Passo N —" dai capitoli; meta-badge del lettore in tre pillole separate leggibili.
- Fine storia: card "Da ricordare" molto trasparente, senza tag categoria; solo Mi piace + Condividi (rimosso Home); "Prosegui" spinto in fondo.
- Nuovo `SwipeBack`: freccia indietro a metà del bordo sinistro; tap o swipe verso destra → la schermata scivola via e torna alla Home (gesto nativo disabilitato per `deep-dive/[id]`).
- Lettore v2: barra in alto con titolo grande e parole evidenziate in azzurro (HighlightedTitle) + indicatore; "INTRODUZIONE" centrata; copertina estesa (~85% schermo) e meno oscurata fino a "Da ricordare"; fine storia: Mi piace + Salva affiancati, Condividi sotto centrato (Salva rimosso dalla barra); i_like → "Mi piace"/"Like"; snap ai capitoli con molla (`maybeSnap` in deep-dive, solo in avanti, su fine gesto/momentum).
- Lettore v3: barra in alto più contrastata (0.94) con etichetta maiuscola azzurra grande; freccia indietro rimossa → swipe dal bordo sinistro o destro (SwipeBack) o tasto di sistema; badge lettore compatti su una riga a sinistra; "INTRODUZIONE" a sinistra; ripristinati "CAPITOLO N" colorati (rimosso solo il prefisso "Passo N —" dai titoli); toast + haptic "Salvato"/"Ti piace" a fine storia.
- Fine storia: nuovo EndActionButton (src/components/end-action-button.tsx) — colori dal tema, tinta attiva (cuore=error, segnalibro=cyan), rimbalzo al tocco, toast sopra il singolo tasto + haptic.
- Fix: mappa KindIcon corretta (file asset nominati al contrario); banner 'Qualsiasi argomento' più luminoso (alone colorato, meno veli, immagine più grande).

## Sessione — ripristino ZIP 4.99 + icone categoria "vetro 3D" + snap lettore
### Ripristino ambiente (preview funzionante)
- Codice PAUSE-4.99 ripristinato in /app (frontend+backend); `.env` di framework preservati.
- Backend: dipendenze installate (pip; risolto conflitto sha256 del wheel litellm rimuovendo il
  fragment). `.env` con MONGO_URL, DB_NAME=test_database, EMERGENT_LLM_KEY, INTEGRATION_PROXY_URL.
  Auto-seed 12 categorie / 437 storie + import copertine allo startup (avvio ~2 min). Preview live.
- Scelte utente: nessun TTS, nessuno Stripe per ora (core via chiave universale Emergent).

### Icone categoria "vetro 3D" (richiesta utente: le vecchie 3D stonavano)
- Rimosse le illustrazioni fotorealistiche remote dalle tessere; nuove icone vettoriali coerenti
  col tema neon/glass: `src/components/glass-category-icon.tsx` (chip squircle lucido nel colore
  categoria, gradiente + riflesso frosted + bordo vetro + simbolo bianco riusando CATEGORY_DRAWINGS;
  glifo speciale "scintilla" per «Qualsiasi argomento»).
- `category-artwork.tsx` riscritto: fondo scuro + velo colore + icona centrata con alone neon e
  micro-rimbalzo a molla al tocco (prop `motion`); scrim in basso per leggibilità etichette.
- Rimosso il mini-badge ridondante da `category-grid.tsx`. Usato su Home, Topics e onboarding.

### Snap lettore verticale (richiesta utente)
- `app/deep-dive/[id].tsx`: sostituito `maybeSnap` con `settle` + `restYFor`. La sezione bersaglio
  ora si CENTRA verticalmente (le sezioni più alte dello schermo si allineano sotto la barra); molla
  sotto-smorzata (damping 14/stiffness 130/mass 0.9) → leggero overshoot poi assestamento. Un fling
  medio-lungo oltre ~40% verso la sezione adiacente completa il passaggio (soglia scalata con la
  velocità: forte 12% / medio 40% / lento 50%); inerzia nativa rispettata (snap a fine slancio).
  Catturate anche le altezze sezione (`heights`) per il calcolo del centro.

### Verifica
- Testing agent (frontend, iteration_1): tutte le schermate ok, nuove icone renderizzate su Home e
  Topics, navigazione tab, apertura lettore e scroll senza errori. 0 errori console/page.
  Nota: il feel nativo dello snap a molla non è verificabile su web (solo su dispositivo/Expo Go).


## Aggiornamento (fork) — fix segnalati dall'utente
- Reader: nessun aggancio/rimbalzo quando si è già dentro una sezione più alta dello schermo (es. "Da ricordare" in fondo, capitoli lunghi) o in fondo alla pagina; snap solo vicino ai confini tra sezioni.
- Icone categoria: RIPRISTINATE le illustrazioni 3D originali dell'utente (category-artwork.tsx originale; glass-category-icon.tsx rimosso). Le immagini sono state ricaricate nell'Object Storage di questo ambiente con `python backend/restore_category_art.py` (da rieseguire dopo ogni fork se le tessere mostrano il fallback).
- Griglia Argomenti: 3 colonne calcolate dalla larghezza misurata (niente più 2 per riga su schermi stretti), centrate.

## Nuova famiglia di icone — richiesta corrente (23/09/2026)
- Richiesta finale: rifare le illustrazioni da zero, 3D più semplici che non rubino
  attenzione alle notizie. Successive precisazioni: **colori più saturi e belli
  colorati**, e **Animali deve essere sempre un bassotto** (non una volpe).
- Generate 12 icone + «Qualsiasi argomento»: piccoli oggetti 3D opachi colorati,
  silhouette pulite, senza neon, bagliori, scene complesse o scintille. Bassotto
  arancione/marrone, corpo lungo e zampe corte, generato separatamente.
- Famiglia attiva `colorful-3d-v3`: asset WebP (circa 3–5 KB ciascuno) salvati
  nell'Object Storage; riferimenti persistiti in `category_art_manifest.json`.
  Sorgenti gestite in `category_art_sources_v3.json`, elaborazione ripetibile in
  `calm_category_art.py`; `restore_category_art.py` supporta il nuovo set dopo fork.
- Migrazione idempotente delle due famiglie precedenti in `category_artwork.py`,
  senza toccare dati utente/storie né successive sostituzioni personalizzate.
- CategoryArtwork mantiene immagini reali e fallback solo durante caricamento/
  errore. Eliminati bagliori, miniature SVG duplicate e vecchi clip incompatibili.
  Home: bordi neutri, badge «Da scoprire» discreto, niente pulsazione continua;
  feedback al tocco e selezione conservati. Layout Home invariato; Argomenti
  rimane a 3 colonne. Nessuna modifica al lettore o alle copertine.
- TTS e Stripe restano disabilitati come richiesto. Nessuna nuova integrazione AI
  a runtime: le icone sono asset statici, non generate durante l'uso dell'app.
- Verifiche: lint frontend/backend superato; report `test_reports/iteration_2.json`:
  12 categorie con nuovi percorsi, 13 media WebP decodificabili (pytest 2/2),
  Home/selezione filtro, Argomenti 320/390px a tre colonne senza overflow,
  toggle/persistenza interessi, onboarding, tema chiaro, apertura/ritorno lettore.
  Tutti i flussi richiesti superati nella preview mobile, nessun errore JS runtime.
  Screenshot verificati: bassotto, icone reali senza fallback una volta caricate.
  Avvisi di deprecazione RN-web preesistenti non bloccanti; non è stato possibile
  testare su dispositivi fisici. Copertine non modificate (fallback preesistenti).
- P0: nessun problema funzionale aperto nell'ambito della richiesta.
- P1: conferma visiva dell'utente, eventuale verifica su telefono fisico.
- P2: TTS/Stripe solo su esplicita richiesta; nessun ampliamento di scope.

## Sessione (fork) — Home cards pulite + lettore "titolo per primo" (23/09/2026)
Richieste utente (tutte completate, verificate da testing_agent iteration_3):
- Home, card categorie: rimossi conteggi contenuti e badge "Da scoprire"; etichetta staccata sotto l'icona 3D (tile più alta, 2 righe max). `home-controls.tsx`, `discover.tsx`.
- Lettore: CTA "Leggi" (era "Inizia a leggere") e "Ascolta" grandi uguali, stesso componente `intro-cta-button.tsx` con icone 3D generate nello stile categorie (`assets/images/kind-book.png`, `kind-headphones.png`; script `backend/generate_cta_icons.py`).
- Rimosso il badge cuffie in alto a destra che copriva il titolo. Al suo posto `AudioMiniBadge` (`story-audio-player/mini.tsx`): compare SOLO dopo il tocco su "Ascolta", nella barra in alto a destra alla quota della riga progresso (mai sopra il titolo); riapre il player.
- Parole chiave del titolo nel colore del tema (`colors.brand`) anche nel lettore (header + capitoli), non più cyan fisso.
- Prima schermata del lettore = copertina: solo pillola meta (icona 3D categoria + nome · tipo · minuti, `story-meta-chips.tsx` md) + titolo intero grande (`deep-dive-cover-title`). L'introduzione parte sotto la piega; scorrendo il titolo grande sfuma e ricompare nella barra (`reveal`). y=0 è un punto di riposo dello snap.
- `CategoryArtMark` in `category-artwork.tsx`: icona 3D "nuda" riutilizzabile nei badge.
Disabilitati per scelta utente: TTS reale e Stripe (codice presente).

## Sessione — Migrazione PAUSE 5.0 (Feb 2026)
### Ripristino ambiente
- ZIP `PAUSE-5.0-main` estratto e ricopiato integralmente in `/app` (backend + frontend + memory + test_reports + design_guidelines). `.env` di framework preservati.
- Backend `.env` popolato con MONGO_URL, DB_NAME=test_database, EMERGENT_LLM_KEY (universal key) e INTEGRATION_PROXY_URL.
- Dipendenze reinstallate: `pip install -r requirements.txt` (aggiunti aiofiles, elevenlabs, emoji, fal_client, httpx-sse, msgpack, asyncstdlib) e `yarn install` sul frontend.
- Supervisor riavviato (backend + expo). Startup completato in ~2 min con:
  - 12 categorie e 437 storie seed.
  - Cover restore: 23 locali + 109 importate; 97 cover escluse dall'editorial review.
  - TTS asset ingest: 9 file su storage (ma TTS/Stripe restano disabilitati come da richiesta).
- Preview live: `/api/health` OK; onboarding intro (montagna/lago) rende correttamente sul dominio pubblico.

### Scelte utente confermate
- Sostituzione totale del codice mantenendo i .env di framework.
- TTS OpenAI e Stripe: lasciati disabilitati.
- Ripristino cover eseguito all'avvio.

## Sessione corrente — generazione massiva copertine PAUSE 5.0
### Richiesta e autorizzazione
- Utente: «Una volta terminato, genera quante più copertine puoi con stessa qualità di quelle già esistenti, ho ricaricato la chiave api».
- Confermato l'uso del credito API disponibile per le sole copertine mancanti, senza
  sovrascrivere quelle esistenti. Questa richiesta supera il precedente divieto di
  generazione manuale; NON introduce generazione AI durante l'uso dell'app.
- TTS e Stripe restano esclusi. Verificato che la vecchia configurazione consentiva
  TTS con la chiave delle immagini: aggiunta guardia `optional_services.py` alle route
  API, TTS disabilitato di default (`TTS_ENABLED` non impostato). Stripe senza chiave.

### Risultato verificato
- Prima: 437 contenuti, 132 copertine generate + 47 fotografiche, 258 mancanti.
- **194 NUOVE copertine** pubblicate; totale **373/437** contenuti coperti
  (326 generate + 47 fotografiche). **64** contenuti restano senza copertina.
- Stesso generatore esistente Gemini Nano Banana `gemini-3.1-flash-image-preview`,
  fotografia editoriale cinematografica scura, composizione verticale 896×1200.
- Originali conservati in `backend/covers/`, hero WebP ≤1200px e miniature ≤600px
  nell'Object Storage gestito, stessa qualità di codifica delle immagini precedenti.
- Lotto interrotto automaticamente per **credito API esaurito**: nessun nuovo tentativo
  a pagamento dopo il segnale. Due errori temporanei di upload recuperati da originali
  già pagati; altre due immagini già generate recuperate dopo cambio dati allo startup.
- Le **179 copertine preesistenti** sono preservate e confrontate via API coi riferimenti
  salvati prima del lotto. Nessuna modifica al frontend, alle categorie o al lettore.

### Implementazione e ripristino
- `generate_covers.py`: lock anti-duplicazione, controllo prima della generazione e
  compare-and-set MongoDB, validazione immagine verticale alta risoluzione, salvataggio
  originale prima dell'upload, riuso dei file già prodotti, checkpoint JSON per lotto.
- `memory/cover_batches/066aa39e04aa40cb9a0d227e74a7b845.json`: pilot 3, baseline179.
- `memory/cover_batches/d92d8535d1c64580bd6fca5be540cc78.json`: lotto principale,
  baseline182 (include il pilot), stopped/budget_or_quota. Contiene 187 successi
  immediati + 4 recuperati (`recovered_ids`), per 191 immagini pubblicate nel lotto.
  `fail` e `skipped` restano lo storico dei tentativi, NON il numero finale mancante.
- `recover_cover_batch.py`: recupero idempotente degli originali dopo errori upload o
  interruzioni; non importa né chiama il generatore AI, non modifica le cover iniziali.
- `server.ensure_seed`: preserva anche `hero_image` con una cover generata. Evita che
  al riavvio tornino le foto alternative precedentemente escluse dall'editorial review.
- Per un futuro lotto autorizzato: `python generate_covers.py`; per vedere il numero
  mancante SENZA spendere: `python generate_covers.py --dry-run` (attualmente64).
- Non riavviare automaticamente la generazione. Non riattivare TTS/Stripe.

### Verifica finale
- Testing agent: `test_reports/iteration_5.json`, immagini reali nel lettore per
  vulcano/polpo/stagioni; onboarding → Home; viewport390/320 senza overflow.
- Due segnalazioni del report erano problemi di test: baseline del secondo lotto182
  anziché iniziale179; ricerca processo non considerava `python -u`. Corrette.
- Individuato e corretto il ripristino indesiderato di foto alternative dei nuovi
  contenuti. Ripulite SOLO le alternative delle nuove cover, originali179 intatte.
- Suite finale `backend/tests/test_iter29_cover_batch_regression.py`: **5/5 PASS**,
  `test_reports/pytest/cover_batch_final.xml`. Verificati 388 endpoint media (194×2),
  WebP/dimensioni, riferimenti originali, lock reale senza AI, TTS/Stripe503 e health200.
- Recupero rieseguito senza nuove scritture o chiamate AI: sempre194 cover collegate.
- Controllo visivo campione32 nuove immagini, oltre al pilot e alle schermate mobile.

### Backlog
- P0: nessun errore funzionale aperto nella generazione/visualizzazione verificata.
- P1: le64 mancanti richiedono un futuro lotto con credito API disponibile e autorizzazione.
- P2: verifica estetica dell'utente; TTS e Stripe soltanto su nuova richiesta esplicita.

## Ripristino (fork, Sep 2026)
- Codice PAUSE clonato da https://github.com/micheleiannello7-cyber/PAUSE-5.11.git e copiato in /app (mantenuti .env di questo ambiente e bundle id com.emergent.sizereductiondemo.hrsr4f).
- backend/.env: aggiunti EMERGENT_LLM_KEY, INTEGRATION_PROXY_URL. Backend seed OK (12 categorie, 437 storie). Preview live (intro PAUSE).
- Cache-clear all'avvio: rifiutato dall'utente, NON implementato.
- Analisi peso APK: assets frontend solo 2.3MB; il peso è tutto nelle librerie native (expo-video, expo-audio, reanimated/worklets, webview, blur, view-shot, 3 famiglie icone, symbols) + APK universale.

## Lettore (deep-dive) — Sep 2026 (fork)
- Presentazione ridisegnata: copertina a tutta larghezza (~40% schermo) con titolo in basso su sfumatura → scheda opaca con Introduzione, scheda info a 3 colonne (tipo, categoria, tempo) → CTA Leggi / Ascolta (premium). Tutto sopra la piega su 390×844.
- Copertina→sfondo: nuovo `ReaderCoverBackdrop` (solo transform translate/scale + opacità, niente layout animato né BlurView) al posto di `ReaderMorphCover` (rimosso).
- Paging capitoli: `snapToOffsets` + `disableIntervalMomentum` + `decelerationRate="fast"` con posizioni di riposo centrate per sezione (inizio sotto la barra se più alta dello schermo, più punto di riposo alla fine); rilascio lento oltre il 28% del tratto → completa lo scroll alla sezione vicina (worklet onEndDrag). Rimosso minHeight a schermo intero dei capitoli.
- Rev. 2: backdrop torna alla geometria "card con margini" che si espande (scala uniforme + translate, angoli scalati fuori schermo), scrim titolo dentro la card; nessun foglio opaco. Snapping: solo nativo (snapToOffsets + disableIntervalMomentum), rimosso scrollTo custom in onEndDrag. Capitoli non centrati attenuati (opacity 0.38). Scheda info: 3 tessere 3D (gradiente tinta, riflesso, alone) con orologio "clay" in SVG (generazione AI fallita: budget Emergent LLM key esaurito).
- Rev. 3: lettore a PAGINE (pagingEnabled + disableIntervalMomentum, ReaderPage alto quanto lo ScrollView, contenuto centrato, scroll interno solo se più alto). Titolo sotto la card (fuori), poi intro, scheda info, CTA. Scheda info: etichetta sopra, icona 3D 54px libera (niente aloni), valore sotto. Icone categoria: endpoint `/api/category-media/{id}?cutout=true` (sfondo nero rimosso, PNG RGBA, cache su disco) usato da CategoryArtMark plain. Barra progresso header via scaleX (niente width animata).
- Rev. 4 (bug "non vado oltre l'introduzione"): tolti gli ScrollView annidati (ReaderPage è una View; se il contenuto non ci sta chiede tipografia più compatta, livelli 0-2). Aggancio con snapToOffsets = inizio pagine (+ fine contenuto), ultima pagina può crescere. Card copertina dimensionata dallo spazio residuo della pagina (min 150). Tessere info: solo icona 3D 44px + valore, altezza 88, niente etichette.
- Fix Expo Go: `StyleSheet.absoluteFillObject` non esiste più in RN 0.86 → contenitore CategoryArtwork collassava (icone categoria invisibili su nativo). Sostituito con position absolute esplicito. Fix crash worklet: `withAlpha` nel useAnimatedStyle del backdrop → bordo separato animato in opacità. Cutout categoria ora ritagliato stretto (fit_square 320) → stessa dimensione visiva delle altre icone 3D (chiave cache cutout-v2, url &cut=2).

## Lotto copertine rimanenti — 24/09/2026
- Utente autorizza esplicitamente tutte le copertine mancanti con il credito API configurato,
  stesso stile cinematografico delle attuali e WebP qualità84; nessuna sostituzione preesistente.
- Baseline attuale: 437 contenuti, 326 copertine generate + 47 fotografiche, 64 mancanti.
- Modello preservato: `gemini-3.1-flash-image-preview`; hero≤1200px, miniature≤600px.
- Pilot 3/3 completato, verificato visivamente: balena, Via della Seta, pendolo/energia;
  896×1200, report `memory/cover_batches/5c7da1546ce245039d51fb4f8d4adbc2.json` (baseline373).
- Lotto restante61 fermato automaticamente dal provider per **Budget has been exceeded**:
  20 pubblicate, 1 errore budget, le altre non avviate. Nessuna nuova chiamata AI dopo stop.
  Report `memory/cover_batches/7dbe6ded62644d7e9ccf42931de7f6d0.json` (baseline376).
- Totale attuale: **23 nuove**, **396/437** coperte (349 generate+47 fotografiche),
  **41 mancanti**. Non dichiarare completato l'intero catalogo. Nessun cambio chiave/modello.
- `generate_covers.save_original` conserva da subito un master WebP84 recuperabile in
  `backend/covers/`, evitando nuovi PNG pesanti. Upload usa il master per digest stabile.
- `media_opt.encode_webp`: fix pass-through WebP prima di exif_transpose (che perdeva
  image.format); niente ricompressione hero già conforme, rotazioni EXIF restano rispettate.
- `render_cover_batch.py`: fogli locali per controllo visivo, nessuna chiamata AI.
- Due nuove immagini corrette localmente (nessuna AI) con `retouch_cover_batch.py`:
  rimosso lettering dalla copertina imbarazzo vicario, sfumato artefatto rettangolare nel
  margine inferiore della scena napoleonica. Solo immagini nel nuovo report, baseline protetta;
  riferimenti Object Storage/digest e checkpoint aggiornati; sorgenti sempre896×1200 WebP84.
- P0: verifica finale media/preview in corso; frontend, TTS e Stripe non modificati.
- P1: le41 mancanti restano sospese per credito esaurito; non riavviare da solo.

## Ripristino (fork, Sep 2026) — PAUSE 5.12
- Richiesta utente (IT): "Estrapola la mia app e rendila pronta per la preview". Solo ripristino + preview, nessuna modifica.
- Codice clonato da https://github.com/micheleiannello7-cyber/PAUSE-5.12.git e copiato integralmente in /app (backend + frontend + memory + test_reports + design_guidelines).
- Preservati i .env di framework; backend/.env riscritto pulito con MONGO_URL, DB_NAME=test_database, EMERGENT_LLM_KEY (universal key), INTEGRATION_PROXY_URL. Bundle id invariato: com.emergent.sizereductiondemo.hrsr4f.
- Dipendenze: `yarn install` (frontend, Done) + `pip install -r requirements.txt` (backend, incl. emoji/elevenlabs/fal_client/aiofiles/asyncstdlib/httpx-sse/msgpack).
- Backend riavviato: auto-seed 12 categorie / 437 storie. /api/health → ok, db true. /api/categories = 12, /api/stories OK.
- Expo riavviato: Metro su :3000, intro PAUSE (montagna/lago) renderizza sul dominio pubblico.
- Scelte utente confermate: TTS OpenAI e Stripe DISATTIVATI; resto attivo con chiave universale Emergent. Nessuna nuova integrazione a runtime.

## Home: copertine veloci + cronologia a sinistra (fork, Sep 2026)
Richiesta utente (IT): all'apertura le copertine arrivavano dopo qualche secondo; a sinistra non devono comparire card
"future", solo storie già fatte scorrere. Ripreso da sessione interrotta (crediti): le modifiche precedenti non esistevano più.
- Ripristinate le icone 3D categoria nell'Object Storage (`python backend/restore_category_art.py`, da rifare dopo ogni fork).
- `api.ts`: `discoverBatch` (endpoint `/api/discover-batch`, già presente nel backend ma non usato). `categoryArtworkUrl(..., tight)`.
- `discover.tsx`: UNA richiesta per il mazzo (7 storie) invece di 7 `discover-next` in serie; `warmCovers` precarica con
  `Image.prefetch` le prime 3 copertine (timeout 2.5s) prima di mostrare le card, il resto in background. Il mazzo si mostra
  appena c'è la prima card; nuovo lotto in coda quando mancano ≤3 card alla fine (esclude gli id già nel mazzo).
- `home-story-deck.tsx`: linea temporale, non anello. Slot "previous" solo se cursor>0, "next" solo se esiste; ai bordi il
  trascinamento è elastico (×0.16) senza cambiare card; nudge idle solo se c'è una card a destra; flag `dragged` (shared
  value) impedisce che un trascinamento (anche elastico) apra la storia (bug trovato dal testing agent su web).
- `story-info-grid.tsx` + `CategoryArtMark`: icona categoria con ritaglio stretto (`tight=true`, riquadro 46×60 contain)
  → stessa altezza visiva di lampadina/libri/orologio; tessere allineate in alto, nomi lunghi su 2 righe.
- Backend `warm_media_cache()` in `sync_assets_in_background`: cache disco di copertine (hero+thumb) e icone categoria
  riscaldata all'avvio (710 file) → prima richiesta senza round-trip all'Object Storage. `covers_sync` ha anche
  ricaricato 93 copertine locali mancanti in questo storage.
- Verifica: `test_reports/iteration_11.json` (backend 6/6, frontend tutti i flussi ok; unico MEDIUM = tap dopo drag elastico,
  corretto e ri-verificato manualmente).

## Sessione corrente — Anteprima rapida + copertine mancanti
- Richiesta utente (IT): generare le41 copertine ancora mancanti nello stesso stile cinematografico con credito disponibile;
  mostrare la card successiva già leggermente ingrandita durante il trascinamento. Conferma esplicita «Si».
- `home-story-deck.tsx`: anticipo dello zoom SOLO sulla card in arrivo (anche rientrando nella cronologia),
  proporzionale al gesto sul thread UI; massimo+1.2% in larghezza, altezza/opacità crescono prima della vecchia
  interpolazione lineare. Rientro/cancellazione e arrivo al centro restituiscono esattamente scala1.
  Posizione derivata dai shared values per evitare salti al cambio slot; nudge idle invariato; riduzione movimento
  disabilita il nuovo anticipo. Navigazione lineare, prefetch/batch, flag dragged e tap restano invariati.
- Lotto manuale `generate_covers.py --limit41 --concurrency1` con modello/stile preesistenti e WebP84:
  report `memory/cover_batches/56ba5742cf674cb7a8acbbc14cf85680.json`, baseline396.
  **17 generate**, arresto immediato per `Budget has been exceeded` su `lez-orientarsi-stelle`; nessuna chiamata AI successiva.
- Controllo qualità: **16 nuove PUBBLICATE**, **1 esclusa** (volto coperto da banda artificiale:
  `v8-lez-saying-no-without-guilt-the-6-step-method`). Originale archiviato in `memory/cover_batches/rejected/`,
  scollegato da MongoDB e rimosso da `covers/` perché lo startup non lo ripristini. Va rigenerato con futuro credito.
  Il campo `ok=17` è lo storico di generazione, NON il totale pubblicato; `generated` contiene16 record,
  `published=16`, `rejected` contiene1 record. Nessuna perdita dell'originale già pagato.
- `retouch_cover_batch.py`: pulizia locale circoscritta alle NUOVE cover: rimossi header artificiali fauna/postura
  e cornice scacchi con ritagli nativi (nessun upscaling); rimosso lettering inventato sul sito archeologico.
  Originali conservati in `memory/cover_batches/originals/`; nuove versioni su Object Storage e report aggiornato;
  guardia baseline, lock e compare-and-set proteggono le preesistenti. Nessuna chiamata AI per queste correzioni.
- Totale finale **412/437 coperte** (365 generate+47 fotografiche), **25 mancanti**. Le396 iniziali sono intatte.
- Verifica: `test_reports/iteration_12.json` zoom durante gesto25/50%, annullamento, avanti/indietro, bordo prima card,
  tap dopo drag, filtri, riduzione movimento e layout390/320px superati. Report originario precede controllo qualità
  (riporta17 pubblicate/24 mancanti); follow-up `test_reports/iteration_12_followup.md` contiene stato finale corretto.
  Suite finale `pytest/iter31_final.xml`:11/11 pass dopo ritocchi/esclusione, tutti32 endpoint nuovi hero/thumb validi.
- P0: nessun bug funzionale aperto nell'anteprima. P1: **25 copertine in attesa di nuovo credito**; non riavviare
  la generazione senza una successiva richiesta dell'utente. Nessun polling/ripartenza automatica.
- P2: verifica del gesto su telefono fisico; possibile futura ripresa Home dall'ultima card vista.
  TTS e Stripe restano disabilitati. Nessuna modifica all'autenticazione (app anonima).

## Aggiornamento UI (giugno 2026)
- Home: tessere categoria più basse (altezza = 1.12× larghezza), etichetta ravvicinata; icona 3D ingrandita del 20% (82% della larghezza) senza toccare il contenitore.
- Card Home: pillola categoria usa l'icona 3D attuale (`CategoryArtMark` plain/tight) al posto della vecchia icona a linea.
- Presentazione storia: lampadina/libri ingranditi (compensano i margini trasparenti del PNG) per allinearsi alle altre due tessere; copertina più alta (fino a 1.02× larghezza) per usare lo spazio vuoto in basso.
- Introduzione storia: l'altezza della copertina è ora calcolata misurando la scheda sotto (onLayout) → occupa tutto lo spazio libero della pagina (max 1.02× larghezza). Tasto "Leggi": scroll animato con Reanimated (withTiming 900ms, easeInOut cubic + scrollTo in worklet) e morph copertina→sfondo disteso su tutta l'altezza della card, niente più "flash".
- Titoli mai troncati: CoverTitle (intro) e ReaderHeader (barra) senza numberOfLines, corpo scalato per lunghezza. Filetti di luce (LinearGradient 1px) tra titolo/intro e intro/griglia. CTA intro: solo testo "Vai alla lettura" / "Start reading" (IntroCtaButton con `icon` opzionale).
- ReaderHeader: lo scrim scuro in alto ora segue `reveal` (visibile solo con la barra titolo) → copertina dell'introduzione pulita fino in alto. Fix soglia reveal: bigTitleY = coverTop + cardH + 12 (prima misurata male, la barra restava visibile tornando su).
- Deck Home: centraggio con molla unica SNAP_SPRING (damping 15, stiffness 100): corsa ~0,6 s, atterraggio con sovraelongazione ~1,5% (pochi px) poi fermo.
- Lettore: cambio pagina tra capitoli con molla PAGE_SPRING (damping 16, stiffness 90, ~0,8 s, assestamento di pochi px). Su iOS/Android: niente snapToOffsets, decelerationRate 0.1 (inerzia del dito quasi nulla), onEndDrag → pagina target (delta >16% pagina o flick) → withSpring via scrollTo in worklet; onBeginDrag annulla. Sul web restano gli agganci nativi. Anche "Vai alla lettura" usa la stessa molla.

## Ripristino (fork, May 2026) — PAUSE 5.13
- Richiesta utente (IT): "Estrapola la mia app e dammi la preview pronta completa". Solo ripristino + preview.
- Codice clonato da https://github.com/micheleiannello7-cyber/PAUSE-5.13.git e copiato integralmente in /app (backend + frontend + memory + test_reports + design_guidelines). Preservati i .env di framework (EXPO_PACKAGER_PROXY_URL, EXPO_PACKAGER_HOSTNAME, MONGO_URL).
- backend/.env riscritto pulito con MONGO_URL, DB_NAME=test_database, EMERGENT_LLM_KEY (universal), INTEGRATION_PROXY_URL.
- Dipendenze: `yarn install` OK; `pip install -r requirements.txt` OK (aggiunti aiofiles, asyncstdlib, elevenlabs, emoji, fal_client, httpx-sse, msgpack).
- Backend riavviato: /api/health OK (db true), 12 categorie + 437 storie auto-seed. `restore_category_art.py` eseguito: 13 asset webp categorie ripristinati in Object Storage.
- Expo riavviato: Metro su :3000, intro PAUSE renderizza (montagna/lago con CTA "Start your pause") sul dominio pubblico.
- Scelte utente confermate: TTS OpenAI e Stripe DISABILITATI; core attivo con Emergent LLM key. Nessuna nuova integrazione a runtime.

## Richiesta corrente — ultime 25 copertine e revisione integrale
- Utente autorizza le 25 mancanti, stesso stile e WebP qualità84; successivamente
  controllo visivo di TUTTE le copertine (bellezza, coerenza titolo, artefatti,
  errori anche se pertinenti, somiglianze). Autorizzate sostituzioni solo DOPO le vuote.
- Baseline confermata in MongoDB: 437 contenuti, 412 coperti, 25 mancanti.
- Lotto in corso: `memory/cover_batches/b05599495e734316a8fa89c707c13a43.json`;
  modello preesistente Gemini Nano Banana, concorrenza1, stop immediato su credito/quota.
- `cover_prompt_overrides.json`: soggetti espliciti e distinti per le25; nessun cambio UI.
- `catalog_cover_sheets.py`: snapshot read-only completo con immagini reali/titoli/hook
  e candidati duplicati; rifiuta l'avvio finché restano copertine vuote.
- `replace_reviewed_covers.py`: prepara candidate fuori da covers/, mantiene le
  vecchie attive fino all'approvazione visiva, backup, upload e aggiornamento protetto.
- Lotto FERMATO per `Budget has been exceeded` alla17ª richiesta (teoria colore).
  **16 generate, 15 pubblicate, 1 scartata;427/437 coperte,10 mancanti.**
- `lez-orbite-gravita`: scartata dopo ispezione ingrandita, Sole sul tracciato
  attorno alla Terra; originale in `cover_batches/rejected/`, nessuna rigenerazione.
- Resoconto preliminare nuovo lotto: `memory/cover_batches/final25_quality_review.md`.
  Tutte412 preesistenti da preservare; revisione GLOBALE e sostituzioni NON iniziate
  perché l'utente richiede di completare prima le vuote. Nessun controllo globale dichiarato.
- P0 bloccato: credito API esaurito; completare10 dopo ripresa autorizzata, poi
  revisione integrale e sostituzioni. Non riavviare automaticamente il generatore.
- Verifica conclusa sul lotto parziale: `test_reports/iteration_15.json`, backend
  10/10, Home e lettore con3 nuove immagini reali,390/320px senza overflow.
  Verificati30 endpoint media nuovi, tutte412 precedenti invariate, scarto orbitale
  non ripristinato, conteggio reale427/437 e10 mancanti.
- Segnalazione preventiva del tester risolta: `retouch_cover_batch.py` limita i
  vecchi ritocchi/esclusioni agli specifici lotti storici, non al solo id storia.
  Esecuzione sul nuovo lotto = NO-OP con SHA256 report identico; suite del tester
  rieseguita10/10 (`pytest/iter15_cover_batch_b055_followup.xml`). Nessuna AI chiamata.
- Lint Python superato. Non dichiarare completata la richiesta globale: credito
  esaurito e revisione delle437 ancora sospesa nell'ordine richiesto dall'utente.
- TTS/Stripe e autenticazione invariati. App anonima, nessuna credenziale richiesta.

## Revisione visiva integrale — giugno 2026 (solo segnalazioni, nessuna sostituzione)
- Utente: «fai la revisione delle esistenti, segnale e le modificheremo in futuro».
- `catalog_cover_sheets.py --allow-missing`: snapshot read-only delle 427 copertine esistenti
  (10 vuote escluse e listate in `missing_ids`), fogli JPG da 12 in `memory/cover_review_final/`.
- Tutti i 36 fogli ispezionati + zoom sui dubbi. Esito: **387 OK, 40 segnalate**
  (13 ALTA: cavallo-zebra, occhio nella cipolla, dipinto per le spezie, spiaggia per i deserti,
  9 con lettering "EDITORIAL/PAUSE/MAGAZINE"; 11 MEDIA; 16 BASSA). 8 gruppi di foto duplicate.
- Report: `memory/cover_review_final/REVIEW.md`; decisioni pronte per
  `replace_reviewed_covers.py` in `flagged_covers.json` (id, reason, prompt).
- Nessuna chiamata AI, nessuna scrittura su MongoDB/Object Storage/covers/.
- Ordine futuro con credito: 10 vuote → 15 ALTA → 11 MEDIA → 16 BASSA (solo se richiesto).
- Aggiunte su segnalazione utente: caricatore #421 con spine su entrambe le estremità (ALTA) e
  stomaco #74 quasi identico al fegato #73 (ALTA, cambiare scena). Totale segnalate 42.
- **Consegna per il prossimo agente: `memory/cover_review_final/HANDOFF_GRAVI.md`** (lista GRAVI,
  comandi, ordine, vincoli). Dati macchina in `flagged_covers.json`.
