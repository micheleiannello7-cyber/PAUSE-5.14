// PAUSE — scheda informativa della storia (presentazione, sotto l'introduzione):
// tre tessere in vetro basse — Tipo di storia · Categoria · Tempo di lettura —
// solo l'oggetto 3D e il valore sotto, niente etichette né aloni.
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { StoryPreview, isLesson } from "@/src/api";
import { makeStyles, spacing, typography, useTheme, withAlpha } from "@/src/theme";
import { useI18n } from "@/src/i18n";
import { KindIcon } from "./kind-icon";
import { CategoryArtMark } from "./category-artwork";

const ICON = 44;
// Orologio 3D generato nello stesso stile delle icone categoria e dei CTA.
const CLOCK = require("../../assets/images/kind-clock.png");

export function StoryInfoGrid({ story, minutes, testID = "story-info-grid" }: { story: StoryPreview; minutes: number; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const lesson = isLesson(story);
  const category = story.category_name.split("·")[0].trim();
  const cells = [
    { id: "kind", value: lesson ? t.lesson_badge : t.curiosity_badge, tint: lesson ? colors.cyan : colors.warning,
      // Il PNG di lampadina/libri ha margini trasparenti (~15%): la si
      // ingrandisce perché l'oggetto visibile arrivi all'altezza degli altri due.
      icon: <KindIcon kind={lesson ? "lessons" : "stories"} size={ICON + 12} glow={false} testID={`${testID}-kind-icon`} /> },
    { id: "category", value: category, tint: story.category_color,
      // Ritaglio stretto (senza i margini trasparenti dello studio) in un
      // riquadro un po' più largo che alto: anche gli oggetti larghi (pianeta)
      // arrivano all'altezza di lampadina/libri e orologio, senza tagli.
      icon: <CategoryArtMark categoryId={story.category_id} color={story.category_color} size={ICON + 2} aspect={1.3} plain tight testID={`${testID}-category-icon`} /> },
    { id: "time", value: `${minutes} ${t.min}`, tint: colors.brandSecondary,
      icon: <Image source={CLOCK} style={{ width: ICON + 2, height: ICON + 2 }} contentFit="contain" transition={0} testID={`${testID}-time-icon`} /> },
  ];
  return (
    <View style={styles.grid} testID={testID}>
      {cells.map((c) => (
        <View key={c.id} style={styles.cell} testID={`${testID}-${c.id}`}>
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha(c.tint, 0.22), withAlpha(c.tint, 0.05), withAlpha(colors.onGradient, 0.03)]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Riflesso in alto: la tessera sembra un blocco di vetro. */}
          <LinearGradient
            pointerEvents="none"
            colors={[withAlpha(colors.onGradient, 0.2), withAlpha(colors.onGradient, 0)]}
            style={styles.shine}
          />
          <View style={styles.iconWrap}>{c.icon}</View>
          <Text style={styles.value} numberOfLines={2} testID={`${testID}-${c.id}-value`}>{c.value}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  grid: { flexDirection: "row", gap: spacing.sm + 2 },
  cell: {
    flex: 1, minHeight: 88, paddingTop: spacing.sm + 2, paddingBottom: spacing.sm + 2, paddingHorizontal: spacing.xs, gap: 6,
    alignItems: "center", justifyContent: "flex-start", borderRadius: 20, overflow: "hidden",
    backgroundColor: withAlpha(colors.onGradient, 0.04), borderWidth: 1, borderColor: withAlpha(colors.onGradient, 0.16),
    boxShadow: `0px 10px 24px ${colors.glassShadow}` as any,
  },
  shine: { position: "absolute", top: 0, left: 0, right: 0, height: 28 },
  iconWrap: { height: ICON + 4, alignItems: "center", justifyContent: "center" },
  // I nomi lunghi vanno a capo (2 righe) senza spostare l'icona: le tre
  // tessere restano allineate in alto e alte uguali.
  value: { color: colors.textWarm, fontFamily: typography.bodyBold, fontSize: 13.5, lineHeight: 16, textAlign: "center", alignSelf: "stretch" },
}));
