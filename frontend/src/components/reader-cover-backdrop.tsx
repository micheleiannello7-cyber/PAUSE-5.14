// PAUSE — copertina del lettore "che si trasforma". Un solo livello fisso
// dietro allo scroll: a riposo ha la geometria della card arrotondata della
// presentazione (in alto, staccata dai bordi); scorrendo si ingrandisce con una
// scala uniforme finché copre tutto lo schermo e si scurisce, diventando lo
// sfondo cinematografico della lettura. Solo transform (translate + scale) e
// opacità: niente layout animato, niente blur → fluida anche su Android, in
// entrambe le direzioni.
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Story, isLesson } from "@/src/api";
import { makeStyles, useTheme, withAlpha } from "@/src/theme";
import { StoryHero } from "./story-hero";
import { LessonCover } from "./lesson-cover";

export type CoverFrame = { top: number; left: number; width: number; height: number; radius: number };

export function ReaderCoverBackdrop({ story, scrollY, frame, screenW, screenH, morphEnd }: {
  story: Story; scrollY: SharedValue<number>; frame: CoverFrame; screenW: number; screenH: number;
  /** Offset di scroll al quale la trasformazione in sfondo è completa. */
  morphEnd: number;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const hasCover = !!story.hero_image_generated || (!isLesson(story) && !!story.hero_image);

  // Scala uniforme che porta la card a coprire lo schermo (con margine), e
  // spostamento del centro della card verso il centro dello schermo.
  const endScale = Math.max(screenW / frame.width, screenH / frame.height) * 1.02;
  const dx = screenW / 2 - (frame.left + frame.width / 2);
  const dy = screenH / 2 - (frame.top + frame.height / 2);

  const box = useAnimatedStyle(() => {
    const y = scrollY.value;
    const p = interpolate(y, [0, morphEnd], [0, 1], Extrapolation.CLAMP);
    // Tirando verso il basso oltre l'inizio la card segue un po' il dito e si stira.
    const pull = y < 0 ? -y : 0;
    return {
      transform: [
        { translateX: dx * p },
        { translateY: dy * p + pull * 0.45 },
        { scale: interpolate(p, [0, 1], [1, endScale]) + Math.min(0.1, pull / 700) },
      ],
    };
  });
  // Bordo sottile della card: svanisce mentre diventa sfondo (solo opacità,
  // niente colori calcolati nel worklet).
  const edge = useAnimatedStyle(() => ({
    opacity: 1 - interpolate(scrollY.value, [0, morphEnd], [0, 1], Extrapolation.CLAMP),
  }));
  const dim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, morphEnd * 0.45, morphEnd, morphEnd + screenH], [0, 0.32, 0.7, 0.8], Extrapolation.CLAMP),
  }));
  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [morphEnd * 0.4, morphEnd], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.box, { top: frame.top, left: frame.left, width: frame.width, height: frame.height, borderRadius: frame.radius }, box]}
      pointerEvents="none"
      testID="chapter-cover-bg"
    >
      {hasCover ? (
        <StoryHero story={story} style={StyleSheet.absoluteFill} transition={400} />
      ) : (
        <LessonCover color={colors.muted} icon={story.category_icon} iconSize={72} showBadge={false} style={StyleSheet.absoluteFill} />
      )}
      {/* Tinta notte: porta ogni foto verso la stessa temperatura blu-notte. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.nightTint }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.edge, { borderRadius: frame.radius }, edge]} />
      {/* Velo scuro che cresce con lo scroll: il testo resta protagonista. */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }, dim]} />
      {/* Fusione verso il fondo pagina, solo da sfondo. */}
      <Animated.View style={[StyleSheet.absoluteFill, fade]}>
        <LinearGradient
          colors={[withAlpha(colors.surface, 0), withAlpha(colors.surface, 0), withAlpha(colors.surface, 0.35), withAlpha(colors.surface, 0.7), colors.surface]}
          locations={[0, 0.55, 0.72, 0.88, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  box: { position: "absolute", overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  edge: { borderWidth: 1, borderColor: withAlpha(colors.onGradient, 0.18) },
}));
