// PAUSE — una sezione (capitolo) della lettura verticale: occhiello con il
// piccolo punto luminoso del capitolo, titolo, corpo in paragrafi brevi. Le
// sezioni si susseguono in cascata, separate da una linea sottile e luminosa.
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { SharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { Chapter, Story } from "@/src/api";
import { makeStyles, useTheme, spacing, typography, withAlpha } from "@/src/theme";
import { HighlightedTitle } from "@/src/components/highlighted-title";

// Larghezza di lettura controllata: su tablet il testo non si allarga oltre
// una riga confortevole, su telefono usa tutta la larghezza meno i margini.
export const READER_MAX_W = 640;
const LONG_PARAGRAPH = 520;

// Solo presentazione: il testo resta identico, ma un capitolo molto lungo
// viene mostrato in due paragrafi spezzati alla fine di una frase.
export function splitParagraphs(body: string): string[] {
  const lines = body.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const text = lines[0] ?? "";
  if (text.length <= LONG_PARAGRAPH) return [text];
  const mid = text.length / 2;
  let cut = -1;
  const re = /[.!?»"”]\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].length;
    if (cut < 0 || Math.abs(end - mid) < Math.abs(cut - mid)) cut = end;
  }
  if (cut <= 0 || cut >= text.length - 40) return [text];
  return [text.slice(0, cut).trim(), text.slice(cut).trim()];
}

export function SectionDivider({ color }: { color?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tint = color ?? colors.cyan;
  return (
    <View style={styles.divider} pointerEvents="none">
      <LinearGradient
        colors={[withAlpha(tint, 0), withAlpha(tint, 0.55), withAlpha(tint, 0)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dividerLine}
      />
    </View>
  );
}

// Solo presentazione: le mini lezioni numerano i passi nel titolo
// ("Passo 3 — Osserva"): nel lettore il numero non serve, resta il titolo.
export function stripStepPrefix(title: string): string {
  return title.replace(/^\s*(passo|step)\s*\d+\s*[—–\-:·]\s*/i, "").trim() || title;
}

export function ChapterSection({
  chapter, story, eyebrow, current, compact = 0,
}: { chapter: Chapter; story: Story; eyebrow: string; current: SharedValue<number>; /** 0 normale · 1 · 2 = tipografia più compatta per stare in una pagina. */ compact?: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const glow = chapter.glow_color || colors.cyan;
  // La pagina corrente è piena; quella che entra/esce durante il passaggio
  // resta attenuata finché non è al centro.
  const focus = useAnimatedStyle(() => ({
    opacity: withTiming(current.value === chapter.number ? 1 : 0.38, { duration: 260 }),
  }));
  return (
    <Animated.View style={[styles.section, focus]} testID={`deep-dive-chapter-${chapter.number}`}>
      <SectionDivider color={glow} />
      <View style={styles.eyebrowRow}>
        <View style={[styles.dot, { backgroundColor: glow, boxShadow: `0px 0px 12px ${withAlpha(glow, 0.7)}` as any }]} />
        <Text style={[styles.eyebrow, { color: glow }]} testID={`reader-chapter-eyebrow-${chapter.number}`}>{eyebrow}</Text>
      </View>
      <HighlightedTitle
        title={stripStepPrefix(chapter.title)}
        highlight={story.highlight_words}
        style={[styles.title, compact === 1 && styles.titleCompact, compact === 2 && styles.titleTiny]}
      />
      <View style={styles.body}>
        {splitParagraphs(chapter.body).map((p, i) => (
          <Text key={i} style={[styles.paragraph, compact === 1 && styles.paragraphCompact, compact === 2 && styles.paragraphTiny]}>{p}</Text>
        ))}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => ({
  section: {
    width: "100%", maxWidth: READER_MAX_W, alignSelf: "center",
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  divider: { alignItems: "center", marginBottom: spacing.lg },
  dividerLine: { width: "62%", height: 1, borderRadius: 1 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 11, letterSpacing: 2 },
  title: {
    color: colors.textWarm, fontFamily: typography.displayBold, fontSize: 27, lineHeight: 34, letterSpacing: -0.5,
  },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  titleTiny: { fontSize: 22, lineHeight: 27 },
  body: { gap: spacing.md + 2, marginTop: spacing.xs },
  paragraph: { color: colors.textWarmSecondary, fontFamily: typography.body, fontSize: 17.5, lineHeight: 31, letterSpacing: 0.1 },
  paragraphCompact: { fontSize: 16, lineHeight: 27 },
  paragraphTiny: { fontSize: 14.5, lineHeight: 24 },
}));
