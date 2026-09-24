import { useRef, useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, Share, useWindowDimensions, LayoutChangeEvent, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, useAnimatedRef, useAnimatedReaction,
  runOnJS, interpolate, Extrapolation, SharedValue, scrollTo, withSpring, cancelAnimation,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { api } from "@/src/api";
import { makeStyles, useTheme, withAlpha, spacing, typography, ThemeColors } from "@/src/theme";
import { useUserId } from "@/src/session";
import { useStoryActions } from "@/src/hooks/use-story-actions";
import { saveReadingProgress, clearReadingProgress, getReadingProgress, toStoryPreview } from "@/src/reading-progress";
import { IntroCtaButton } from "@/src/components/intro-cta-button";
import { SwipeBack } from "@/src/components/swipe-back";
import { StoryInfoGrid } from "@/src/components/story-info-grid";
import { ReaderCoverBackdrop, CoverFrame } from "@/src/components/reader-cover-backdrop";
import { HighlightedTitle } from "@/src/components/highlighted-title";
import { StoryAudioProvider, AudioSheet, AudioMiniBadge, IntroListenButton } from "@/src/components/story-audio-player";
import { ReaderHeader, READER_HEADER_H } from "@/src/components/reader-header";
import { ChapterSection, READER_MAX_W } from "@/src/components/reader-section";
import { ReaderPage } from "@/src/components/reader-page";
import { ReaderEnding } from "@/src/components/reader-ending";
import { Screen } from "@/src/components/screen";
import { StoryShareCard, SHARE_CARD_WIDTH } from "@/src/components/story-share-card";
import { useI18n } from "@/src/i18n";
import { CoachTip } from "@/src/coach-tips";

// Molla del cambio pagina: lenta e morbida (≈0,8 s), smorzamento ≈0,85 →
// arriva e si assesta di pochi pixel, senza rimbalzi evidenti.
const PAGE_SPRING = { damping: 16, stiffness: 90, mass: 1, restDisplacementThreshold: 0.3, restSpeedThreshold: 0.3 };

// Lettura verticale a cascata: copertina in alto, poi introduzione, capitoli
// e conclusione uno dopo l'altro in un'unica pagina scrollabile. Le "sezioni"
// (0 = intro, 1..n = capitoli, n+1 = fine) usano la stessa scala del vecchio
// pager, così il progresso di lettura salvato resta compatibile.
export default function DeepDive() {
  // `start=1` (dalla Home "Leggi la curiosità"): si apre direttamente sul
  // primo capitolo, senza l'introduzione.
  const { id, start, listen } = useLocalSearchParams<{ id: string; start?: string; listen?: string }>();
  const insets = useSafeAreaInsets();
  const { height: winH, width: winW } = useWindowDimensions();
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useUserId();
  const completedRef = useRef<string | null>(null);
  const shareRef = useRef<View>(null);
  const startedAtRef = useRef<number>(Date.now());
  const [section, setSection] = useState(0);
  const [audioOpen, setAudioOpen] = useState(listen === "1");
  // Il badge che riapre il player compare solo dopo il primo tocco su "Ascolta".
  const [listenStarted, setListenStarted] = useState(listen === "1");
  const openAudio = () => { setListenStarted(true); setAudioOpen(true); };
  // Il progresso di lettura si salva solo dopo un vero gesto del lettore
  // (non per la posizione su cui si è aperta la storia automaticamente).
  const touchedRef = useRef(false);
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();

  const { data: story, isLoading } = useQuery({
    queryKey: ["story", id],
    queryFn: () => api.story(id!),
    enabled: !!id,
  });
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.user(userId!),
    enabled: !!userId,
  });
  const { toggle } = useStoryActions(userId, id);
  const isPremium = !!user?.is_premium;

  // Sezioni: intro · una per capitolo · conclusione ("Da ricordare" + prossima storia).
  const chapterCount = story?.chapters.length ?? 0;
  const sectionCount = chapterCount + 2;
  const lastSection = sectionCount - 1;

  // --- Scroll a pagine: ogni sezione è una pagina alta quanto lo schermo ---
  // Il paging è nativo (pagingEnabled + disableIntervalMomentum): un gesto,
  // anche veloce, porta sempre alla pagina successiva/precedente e la centra,
  // senza logica custom sullo scroll. scrollY resta continuo per la copertina.
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const progress = useSharedValue(0);
  const headerSolid = useSharedValue(0);
  // Titolo nella barra: compare quando il titolo grande della copertina scorre via.
  const headerReveal = useSharedValue(0);
  const bigTitleY = useSharedValue(0);
  const currentSV = useSharedValue(-1);
  const headerBottom = insets.top + READER_HEADER_H;
  // Altezza reale dello ScrollView (= altezza pagina), misurata a layout.
  const [pageH, setPageH] = useState(winH);
  const pageHSV = useSharedValue(winH);
  // Copertina: card grande, arrotondata, staccata dai bordi, con il titolo in
  // basso. Lo stesso livello fisso dietro allo scroll (ReaderCoverBackdrop)
  // parte da questa geometria e cresce fino a diventare lo sfondo.
  const columnW = Math.min(winW, READER_MAX_W);
  const cardW = columnW - spacing.xl * 2;
  // Altezza della card ricavata dallo spazio che resta nella pagina dopo
  // titolo, introduzione, scheda info e tasti (≈ 440pt): così la
  // presentazione sta sempre in una pagina, anche su schermi bassi.
  const coverTop = insets.top + spacing.lg;
  const pageBottom = insets.bottom + spacing.lg;
  // Copertina alta quanto lo spazio libero lo consente (fino a un quadrato
  // pieno): si misura la scheda sotto (titolo, intro, griglia, tasti) e la
  // card prende tutto il resto della pagina.
  const [sheetH, setSheetH] = useState(430);
  const cardH = Math.max(150, Math.min(Math.round(cardW * 1.02), pageH - coverTop - pageBottom - sheetH));
  const cover: CoverFrame = { top: coverTop, left: (winW - columnW) / 2 + spacing.xl, width: cardW, height: cardH, radius: 22 };
  // La trasformazione in sfondo è completa qui (tutta l'altezza della card:
  // così, scorrendo al primo capitolo, la crescita è distesa e non "scatta").
  const morphEnd = cover.top + cardH;
  // Quota (nella pagina) del titolo grande: sotto la card, dopo il padding
  // della scheda. Da qui in su la barra col titolo piccolo resta nascosta,
  // così tornando all'introduzione la copertina è di nuovo libera.
  useEffect(() => { bigTitleY.value = coverTop + cardH + spacing.md; }, [coverTop, cardH, bigTitleY]);
  // Ultimo scroll programmatico (apertura su un capitolo, ripresa): solo un
  // movimento del lettore oltre quel punto conta come "gesto" per salvare.
  const autoY = useSharedValue(0);
  const touchedSV = useSharedValue(false);
  const markTouched = () => { touchedRef.current = true; touchedSV.value = true; };

  // Scroll programmatico "morbido" (tasto Leggi e cambio pagina): la posizione
  // è animata con una molla lenta e applicata allo ScrollView frame per frame,
  // così la copertina si trasforma in sfondo in modo fluido e ogni pagina
  // "atterra" dolcemente (nessun rimbalzo visibile, solo un assestamento).
  const autoScroll = useSharedValue(-1);
  useAnimatedReaction(
    () => autoScroll.value,
    (y, prev) => { if (y >= 0 && y !== prev) scrollTo(scrollRef, 0, y, false); },
  );
  const dragStartPage = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      scrollY.value = y;
      if (!touchedSV.value && Math.abs(y - autoY.value) > 48) {
        touchedSV.value = true;
        runOnJS(markTouched)();
      }
      const range = Math.max(1, e.contentSize.height - e.layoutMeasurement.height);
      progress.value = Math.max(0, Math.min(1, y / range));
      // La barra diventa vetro insieme al titolo piccolo (stessa soglia).
      const titleTop = bigTitleY.value - headerBottom;
      const reveal = bigTitleY.value > 0 ? interpolate(y, [titleTop - 40, titleTop + 48], [0, 1], Extrapolation.CLAMP) : 0;
      headerReveal.value = reveal;
      headerSolid.value = reveal;
      // Pagina corrente: quella più vicina alla posizione (cambia a metà strada).
      const idx = Math.max(0, Math.min(sectionCount - 1, Math.round(y / pageHSV.value)));
      if (idx !== currentSV.value) {
        currentSV.value = idx;
        runOnJS(setSection)(idx);
      }
    },
    onBeginDrag: (e) => {
      // Il dito interrompe qualsiasi movimento automatico.
      cancelAnimation(autoScroll);
      autoScroll.value = -1;
      dragStartPage.value = Math.max(0, Math.min(sectionCount - 1, Math.round(e.contentOffset.y / pageHSV.value)));
    },
    onEndDrag: (e) => {
      if (Platform.OS === "web") return;
      const y = e.contentOffset.y;
      const ph = pageHSV.value;
      const last = sectionCount - 1;
      const from = dragStartPage.value;
      // Ultima pagina (può essere più alta dello schermo): sotto il suo inizio si scorre liberi.
      if (from === last && y >= last * ph) return;
      const delta = y - from * ph;
      // La velocità del dito conta solo come "spinta" nella direzione del
      // trascinamento (il segno cambia tra piattaforme, il verso di delta no).
      const flick = Math.abs(e.velocity?.y ?? 0) > 0.3;
      let target = from;
      if (delta > ph * 0.16 || (flick && delta > 12)) target = from + 1;
      else if (delta < -ph * 0.16 || (flick && delta < -12)) target = from - 1;
      target = Math.max(0, Math.min(last, target));
      autoScroll.value = y;
      autoScroll.value = withSpring(target * ph, PAGE_SPRING);
    },
  });

  const scrollToSection = useCallback((i: number, animated = true) => {
    const target = i * pageH;
    autoY.value = target;
    if (!animated) { scrollRef.current?.scrollTo({ y: target, animated: false }); return; }
    autoScroll.value = scrollY.value;
    autoScroll.value = withSpring(target, PAGE_SPRING);
  }, [pageH, scrollRef, autoY, autoScroll, scrollY]);

  // Sul web (anteprima) restano gli agganci nativi; su iOS/Android il cambio
  // pagina è la molla qui sopra, con inerzia quasi nulla del dito.
  const snapOffsets = Platform.OS === "web" ? Array.from({ length: sectionCount }, (_, i) => i * pageH) : undefined;
  const onScrollLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== pageH) { setPageH(h); pageHSV.value = h; }
  };
  // Apertura diretta su un capitolo (`start=1`): posiziona senza animazione.
  const startedAtChapter = useRef(false);
  useEffect(() => {
    if (start === "1" && story && !startedAtChapter.current) {
      startedAtChapter.current = true;
      requestAnimationFrame(() => scrollToSection(1, false));
    }
  }, [start, story, scrollToSection]);

  // Riprende dalla sezione in cui il lettore aveva lasciato questa storia.
  useEffect(() => {
    if (!userId || !id || !story) return;
    getReadingProgress(userId).then((p) => {
      if (p && p.story.id === id && p.page > 0 && p.page < lastSection) {
        setSection(p.page);
        requestAnimationFrame(() => scrollToSection(p.page, false));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, id, !!story]);

  // Mark as completed once: when the reader reaches the end (or taps "next").
  const markComplete = useCallback(async () => {
    if (!userId || !id || completedRef.current === id) return;
    completedRef.current = id;
    try {
      await clearReadingProgress(userId);
      const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
      await api.complete(userId, id, story?.deep_dive_time_min ?? 2, secs);
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["limit"] });
    } catch {}
  }, [userId, id, story?.deep_dive_time_min, qc]);

  // A curiosity is counted as soon as it's opened — but only after a 5s dwell,
  // so backing out within 5 seconds (misclick / quick peek) does NOT consume
  // one of the session's stories. Leaving the screen clears the timer.
  const markCompleteRef = useRef(markComplete);
  markCompleteRef.current = markComplete;
  useEffect(() => {
    if (!userId || !id) return;
    const timer = setTimeout(() => markCompleteRef.current(), 5000);
    return () => clearTimeout(timer);
  }, [userId, id]);

  // Narration is resolved lazily by the audio player (status → persistent
  // URL); nothing is generated until the listener taps play.

  useEffect(() => {
    if (!story) return;
    const ratio = lastSection > 0 ? section / lastSection : 0;
    if (section >= lastSection) {
      markComplete();
      return;
    }
    // Remember genuine mid-read positions only (skip the intro).
    if (userId && section > 0 && touchedRef.current && completedRef.current !== id) {
      saveReadingProgress(userId, { story: toStoryPreview(story), page: section, progress: ratio, updatedAt: Date.now() });
    }
  }, [section, story, lastSection, userId, id, markComplete]);

  if (isLoading || !story) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const bookmarked = user?.bookmarked_story_ids.includes(story.id) ?? false;
  const liked = user?.liked_story_ids.includes(story.id) ?? false;

  const onNext = async () => {
    await markComplete();
    try {
      // 5 storie → pausa di 4 ore: se il limite è scattato, mostra la schermata di pausa.
      if (userId) {
        const limit = await api.limitCheck(userId);
        if (limit.blocked) {
          router.replace("/pause-limit");
          return;
        }
      }
      const next = await api.nextStory(story.id, userId ?? undefined);
      router.replace(`/deep-dive/${next.id}`);
    } catch {}
  };

  // Share a ready-made image card (cover + title + hook + brand). Falls back
  // to a plain text share where image sharing isn't available (e.g. web).
  const onShare = async () => {
    try {
      if (shareRef.current && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(shareRef, { format: "png", quality: 1, result: "tmpfile" });
        await Sharing.shareAsync(uri, { dialogTitle: t.share, mimeType: "image/png", UTI: "public.png" });
        return;
      }
    } catch {}
    Share.share({ message: `${story.title} — ${t.share_suffix}` }).catch(() => {});
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/discover"));

  // Barra in alto: titolo della storia sempre in vista + indicatore in
  // maiuscolo "3 DI 7" · "DA RICORDARE". Nell'introduzione l'etichetta è già
  // scritta nella pagina (occhiello con il pallino): qui resta solo la barra.
  const progressLabel =
    section === 0 ? ""
    : section >= lastSection ? t.remember.toUpperCase()
    : `${section} ${t.of.toUpperCase()} ${chapterCount}`;

  return (
    <Screen style={styles.container}>
      <SwipeBack onBack={goBack}>
      {/* Fondo notte: dal nero al blu-notte verso il basso, per profondità. */}
      <LinearGradient
        colors={[colors.surface, colors.surfaceDeep]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Copertina: card arrotondata a riposo, sfondo cinematografico scorrendo. */}
      <ReaderCoverBackdrop story={story} scrollY={scrollY} frame={cover} screenW={winW} screenH={winH} morphEnd={morphEnd} />
      <StoryAudioProvider key={story.id} storyId={story.id} autoplay={listen === "1" && isPremium}>
        <ReaderHeader
          topInset={insets.top + spacing.xs}
          title={story.title}
          highlight={story.highlight_words}
          label={progressLabel}
          labelColor={section === 0 ? colors.intro : section >= lastSection ? colors.warning : colors.cyan}
          progress={progress}
          solid={headerSolid}
          reveal={headerReveal}
          corner={isPremium ? <AudioMiniBadge visible={listenStarted && !audioOpen} onPress={() => setAudioOpen(true)} /> : null}
        />

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={markTouched}
          onLayout={onScrollLayout}
          snapToOffsets={snapOffsets}
          disableIntervalMomentum={Platform.OS === "web"}
          decelerationRate={Platform.OS === "web" ? "fast" : 0.1}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          testID="deep-dive-scroll"
        >
          {/* Presentazione (sezione 0): spazio per la card copertina (l'immagine
              vera è il livello fisso dietro), titolo subito sotto, poi
              introduzione, scheda informativa e i tasti Leggi / Ascolta.
              Scorrendo, la copertina cresce dietro il testo fino a farsi sfondo. */}
          <ReaderPage height={pageH} paddingTop={cover.top} paddingBottom={pageBottom} center={false} testID="deep-dive-page-intro">
            {(compact) => (<>
            <View style={[styles.coverArea, { height: cardH, width: cardW }]} testID="deep-dive-cover-card" />
            <View style={styles.sheet} onLayout={(e) => { const h = Math.ceil(e.nativeEvent.layout.height); if (h > 0 && h !== sheetH) setSheetH(h); }}>
              <View style={styles.sheetInner}>
                <View style={styles.heroTitleWrap}>
                  <CoverTitle title={story.title} highlight={story.highlight_words} reveal={headerReveal} />
                </View>
                <LinearGradient pointerEvents="none" start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} colors={[withAlpha(colors.onGradient, 0.16), withAlpha(colors.onGradient, 0.06), withAlpha(colors.onGradient, 0)]} locations={[0, 0.6, 1]} style={styles.hairline} testID="deep-dive-divider-title" />
                <View style={styles.introBlock}>
                  <View style={styles.introEyebrowRow}>
                    <View style={styles.introDot} />
                    <Text style={styles.introEyebrow} testID="reader-intro-eyebrow">{t.deep_intro}</Text>
                  </View>
                  <Text style={[styles.hook, compact === 1 && styles.hookCompact, compact === 2 && styles.hookTiny]} testID="deep-dive-hook">{story.hook}</Text>
                </View>
                <LinearGradient pointerEvents="none" start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} colors={[withAlpha(colors.onGradient, 0.16), withAlpha(colors.onGradient, 0.06), withAlpha(colors.onGradient, 0)]} locations={[0, 0.6, 1]} style={styles.hairline} testID="deep-dive-divider-intro" />
                <StoryInfoGrid story={story} minutes={story.deep_dive_time_min} />
                <View style={styles.ctaRow}>
                  <IntroCtaButton label={t.deep_start} onPress={() => { markTouched(); scrollToSection(1); }} testID="deep-dive-start" style={styles.cta} />
                  {isPremium ? <IntroListenButton onListen={openAudio} style={styles.cta} /> : null}
                </View>
              </View>
            </View>
            </>)}
          </ReaderPage>

          {story.chapters.map((c) => (
            <ReaderPage key={c.number} height={pageH} paddingTop={headerBottom} paddingBottom={pageBottom} testID={`deep-dive-page-chapter-${c.number}`}>
              {(compact) => <ChapterSection chapter={c} story={story} eyebrow={`${t.chapter} ${c.number}`} current={currentSV} compact={compact} />}
            </ReaderPage>
          ))}

          <ReaderPage height={pageH} paddingTop={headerBottom} paddingBottom={0} grow testID="deep-dive-page-end">
            <ReaderEnding
              story={story}
              liked={liked}
              onLike={() => toggle("like")}
              bookmarked={bookmarked}
              onBookmark={() => toggle("bookmark")}
              onShare={onShare}
              onNext={onNext}
              bottomInset={insets.bottom}
            />
          </ReaderPage>
        </Animated.ScrollView>

        {section === 1 ? (
          <CoachTip id="reader" text={t.tip_reader} icon="book-outline" style={{ top: headerBottom + spacing.md }} />
        ) : null}
        {isPremium ? <AudioSheet visible={audioOpen} onClose={() => setAudioOpen(false)} /> : null}
      </StoryAudioProvider>
      </SwipeBack>
      {/* Off-screen share card, captured as PNG on demand. */}
      <View style={styles.shareHidden}>
        <View ref={shareRef} collapsable={false}>
          <StoryShareCard story={story} />
        </View>
      </View>
    </Screen>
  );
}

// Titolo intero sulla copertina (prima schermata): grande, su più righe, con
// le parole chiave nel colore del tema. Non viene mai troncato: i titoli
// lunghi scendono di corpo (e la copertina sopra si adatta di conseguenza).
// Sfuma via mentre scorre sotto la barra, dove ricompare in piccolo.
function CoverTitle({ title, highlight, reveal }: { title: string; highlight: string[]; reveal: SharedValue<number> }) {
  const styles = useStyles();
  const fade = useAnimatedStyle(() => ({ opacity: 1 - reveal.value }));
  const n = title.length;
  const fontSize = n > 70 ? 21 : n > 55 ? 23 : n > 40 ? 25 : 27;
  return (
    <Animated.View style={fade}>
      <HighlightedTitle title={title} highlight={highlight} style={[styles.coverTitle, { fontSize, lineHeight: Math.round(fontSize * 1.18) }]} testID="deep-dive-cover-title" />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors: ThemeColors) => ({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1 },
  shareHidden: { position: "absolute", left: -4000, top: 0, width: SHARE_CARD_WIDTH, pointerEvents: "none" },

  // Presentazione: card copertina (spazio; l'immagine vera è il livello fisso
  // dietro), titolo subito sotto, poi introduzione, scheda info e azioni.
  coverArea: { alignSelf: "center" },
  heroTitleWrap: { width: "100%" },
  coverTitle: {
    color: colors.textWarm, fontFamily: typography.displayBold, letterSpacing: -0.6,
    textShadowColor: withAlpha(colors.surface, 0.9), textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  // Filo di luce sottile tra titolo, introduzione e scheda: separa senza pesare.
  hairline: { height: 1, alignSelf: "stretch" },
  sheet: { width: "100%", paddingBottom: spacing.md },
  sheetInner: { width: "100%", maxWidth: READER_MAX_W, alignSelf: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  introBlock: { gap: spacing.sm },
  // Occhiello "INTRODUZIONE": piccolo e luminoso, sopra l'aggancio.
  introEyebrowRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.sm },
  introDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.intro, boxShadow: `0px 0px 12px ${withAlpha(colors.intro, 0.85)}` as any },
  introEyebrow: {
    color: colors.intro, fontFamily: typography.bodyBold, fontSize: 11.5, letterSpacing: 2.4,
    textShadowColor: withAlpha(colors.surface, 0.7), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  // Aggancio: breve, grande e leggibile anche sopra la copertina che si espande.
  hook: {
    color: colors.textWarm, fontFamily: typography.bodyMedium, fontSize: 17, lineHeight: 27, letterSpacing: 0.1,
    textShadowColor: withAlpha(colors.surface, 0.9), textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10,
  },
  hookCompact: { fontSize: 15.5, lineHeight: 24 },
  hookTiny: { fontSize: 14, lineHeight: 21 },
  ctaRow: { flexDirection: "row", alignItems: "stretch", gap: spacing.sm + 2 },
  cta: { flex: 1 },
}));
