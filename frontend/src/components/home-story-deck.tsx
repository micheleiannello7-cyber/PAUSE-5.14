import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { StoryPreview } from "@/src/api";
import { makeStyles } from "@/src/theme";
import { HomeStoryCard } from "./home-story-card";

type Props = { deck: StoryPreview[]; cursor: number; width: number; height: number; onChange: (index: number) => void; onOpen: (story: StoryPreview) => void; onListen?: (story: StoryPreview) => void };

// Molla del centraggio: lenta e morbida, con un atterraggio appena molleggiato
// (rapporto di smorzamento ≈ 0,75 → rimbalzo di pochi pixel, poi ferma).
const SNAP_SPRING = { damping: 15, stiffness: 100, mass: 1, restDisplacementThreshold: 0.3, restSpeedThreshold: 0.3 };

// Linea temporale, non anello: a sinistra ci sono solo le card già fatte
// scorrere, a destra quelle ancora da vedere. Alla prima apertura nulla a sinistra.
export function HomeStoryDeck({ deck, cursor, width, height, onChange, onOpen, onListen }: Props) {
  const styles = useStyles();
  const cardWidth = width * 0.866;
  const stride = cardWidth + width * 0.021;
  const canPrev = cursor > 0;
  const canNext = cursor < deck.length - 1;
  const position = useSharedValue(0);
  const tx = useSharedValue(0);
  // Idle hint: a small sideways sway of the whole deck after 7s of inactivity.
  const nudge = useSharedValue(0);
  const busy = useSharedValue(false);
  // Vero appena il dito si sposta: un trascinamento (anche elastico ai bordi)
  // non deve mai contare come tocco che apre la storia.
  const dragged = useSharedValue(false);
  const moving = useRef(false);
  const mounted = useRef(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [virtualPage, setVirtualPage] = useState(0);

  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!canNext) return;
    idleTimer.current = setTimeout(function sway() {
      if (!mounted.current) return;
      if (!moving.current && tx.value === 0) {
        nudge.value = withSequence(
          withTiming(-stride * 0.07, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(stride * 0.035, { duration: 360, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }),
        );
      }
      idleTimer.current = setTimeout(sway, 7000);
    }, 7000);
  }, [canNext, stride, tx, nudge]);
  const stopNudge = useCallback(() => {
    cancelAnimation(nudge);
    nudge.value = withTiming(0, { duration: 140 });
    armIdle();
  }, [nudge, armIdle]);

  useFocusEffect(useCallback(() => {
    armIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = null;
      cancelAnimation(nudge);
      nudge.value = 0;
    };
  }, [armIdle, nudge]));
  const finish = useCallback((target: number, page: number) => {
    if (!mounted.current) return;
    setVirtualPage(page);
    onChange(target);
  }, [onChange]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelAnimation(tx); };
  }, [tx]);
  useLayoutEffect(() => {
    moving.current = false;
    busy.value = false;
  }, [virtualPage, busy]);

  const move = useCallback((direction: number) => {
    if (moving.current) return;
    const target = cursor + direction;
    if (target < 0 || target >= deck.length) return;
    const nextPage = virtualPage + direction;
    moving.current = true;
    busy.value = true;
    cancelAnimation(nudge);
    nudge.value = 0;
    armIdle();
    Haptics.selectionAsync().catch(() => {});
    // Corsa lenta e morbida con un "atterraggio" molleggiato appena percettibile
    // (smorzamento ≈ 0,75 → sovraelongazione ~3%, un dito di rimbalzo).
    tx.value = withSpring(-direction * stride, SNAP_SPRING, (finished) => {
      if (!finished) return;
      // The already-painted neighbour becomes central before React commits.
      position.value = nextPage;
      tx.value = 0;
      runOnJS(finish)(target, nextPage);
    });
  }, [cursor, deck.length, virtualPage, stride, busy, tx, position, finish, nudge, armIdle]);

  const gesture = useMemo(() => Gesture.Pan().activeOffsetX([-10, 10]).failOffsetY([-18, 18])
    .onBegin(() => { dragged.value = false; runOnJS(stopNudge)(); })
    .onUpdate((event) => {
      if (busy.value) return;
      if (Math.abs(event.translationX) > 8) dragged.value = true;
      // Oltre i bordi della linea (inizio o fine) la card resiste: elastico, non scorre.
      const blocked = (event.translationX > 0 && !canPrev) || (event.translationX < 0 && !canNext);
      tx.value = event.translationX * (blocked ? 0.16 : 1);
    })
    .onEnd((event) => {
      if (busy.value) return;
      if (canNext && (event.translationX < -stride * 0.17 || event.velocityX < -450)) runOnJS(move)(1);
      else if (canPrev && (event.translationX > stride * 0.17 || event.velocityX > 450)) runOnJS(move)(-1);
      else tx.value = withSpring(0, SNAP_SPRING);
    })
    .onFinalize((_event, success) => { if (!success && !busy.value) tx.value = withSpring(0, SNAP_SPRING); }), [busy, tx, dragged, canPrev, canNext, stride, move, stopNudge]);

  const slots = [canPrev ? -1 : null, 0, canNext ? 1 : null].filter((s): s is number => s !== null);
  const dotCount = Math.min(deck.length, 7);
  const dotStart = Math.max(0, Math.min(cursor - 3, deck.length - dotCount));
  return (
    <View style={styles.container} testID="home-story-deck">
      <GestureDetector gesture={gesture}>
        <View testID="discover-swipe-area" style={[styles.viewport, { width, height }]} collapsable={false}
          accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: deck.length, now: cursor + 1 }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={({ nativeEvent }) => move(nativeEvent.actionName === "increment" ? 1 : -1)}>
          {slots.map((slot) => {
            const story = deck[cursor + slot];
            return <StoryLayer key={`${virtualPage + slot}-${story.id}`} story={story} slot={slot} page={virtualPage + slot}
              width={cardWidth} left={(width - cardWidth) / 2} stride={stride} position={position} tx={tx} nudge={nudge}
              onOpen={() => { if (!moving.current && !dragged.value) onOpen(story); }}
              onListen={onListen ? () => { if (!moving.current && !dragged.value) onListen(story); } : undefined} />;
          })}
        </View>
      </GestureDetector>
      <View testID="discover-deck-dots" style={styles.dots} accessibilityLabel={`${cursor + 1} / ${deck.length}`}>
        {Array.from({ length: dotCount }, (_, index) => <View key={index} testID={`discover-deck-dot-${index}`} style={[styles.dot, index === cursor - dotStart && styles.activeDot]} />)}
      </View>
    </View>
  );
}

function StoryLayer({ story, slot, page, width, left, stride, position, tx, nudge, onOpen, onListen }: {
  story: StoryPreview; slot: number; page: number; width: number; left: number; stride: number;
  position: SharedValue<number>; tx: SharedValue<number>; nudge: SharedValue<number>; onOpen: () => void; onListen?: () => void;
}) {
  const styles = useStyles();
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => {
    const offset = page - position.value;
    const distance = offset + (tx.value + nudge.value) / stride;
    const side = Math.min(Math.abs(distance), 1);
    // Solo la card in arrivo anticipa lo zoom: il movimento idle non lo attiva.
    // Usa la posizione animata, non lo slot React, per evitare salti al cambio card.
    const incoming = Math.abs(offset) === 1 && offset * tx.value < 0;
    const progress = incoming && !reducedMotion ? Math.min(Math.abs(tx.value) / stride, 1) : 0;
    const preview = progress * (1 - progress);
    // L'anticipo cresce subito, poi si annulla al centro (o tornando indietro).
    // Zoom orizzontale massimo 1.2%: resta nello spazio tra le card.
    return {
      opacity: Math.min(1, 1 - side * 0.48 + preview * 0.48),
      transform: [
        { translateX: distance * stride },
        { scaleX: 1 + preview * 0.048 },
        { scaleY: Math.min(1, 1 - side * 0.09 + preview * 0.09) },
      ],
    };
  });
  return (
    <Animated.View testID={`deck-layer-${slot === 0 ? "active" : slot < 0 ? "previous" : "next"}`} style={[styles.layer, { width, left }, animatedStyle]}>
      <HomeStoryCard story={story} active={slot === 0} instance={`slot-${slot}`} onOpen={onOpen} onListen={onListen} />
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { width: "100%" },
  viewport: { overflow: "hidden" },
  layer: { position: "absolute", top: 0, bottom: 0 },
  dots: { height: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  dot: { width: 4.5, height: 4.5, borderRadius: 5, backgroundColor: colors.borderStrong },
  activeDot: { width: 15, backgroundColor: colors.cyan },
}));