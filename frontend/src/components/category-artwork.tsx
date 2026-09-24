import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Category, categoryArtworkUrl, categoryIllustrationUrl } from "@/src/api";
import { makeStyles, useTheme, withAlpha, radius } from "@/src/theme";
import { CategoryIcon } from "./category-icon";

export const CATEGORY_VISUAL_MODE: "illustrated" | "line" = "illustrated";
const ART_VERSION = "colorful-3d-v3";
type ArtworkProps = {
  category: Pick<Category, "id" | "color" | "illustration_generated">;
  testID: string; wide?: boolean; compact?: boolean; cornerRadius?: number;
};

export function CategoryArtwork({ category, ...props }: ArtworkProps) {
  const uri = category.id === "all"
    ? categoryArtworkUrl("all", ART_VERSION)
    : categoryIllustrationUrl(category);
  return <Artwork key={`${CATEGORY_VISUAL_MODE}:${uri}`} category={category} uri={uri} {...props} />;
}

function Artwork({ category, uri, testID, wide = false, compact = false, cornerRadius = radius.lg }: ArtworkProps & { uri: string | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showImage = CATEGORY_VISUAL_MODE === "illustrated" && !!uri && !failed;
  const imageStyle = wide ? styles.bannerImage : [styles.image, compact && styles.compactImage];
  return (
    <View testID={testID} style={[styles.fill, { borderRadius: cornerRadius }]} accessibilityState={{ busy: showImage && !loaded }}>
      {(!showImage || !loaded) ? (
        <View style={[imageStyle, styles.center]} testID={`${testID}-fallback`}>
          <CategoryIcon categoryId={category.id} color={category.color} highlightColor={colors.onGradient} size={compact ? 34 : 35} testID={`${testID}-line-icon`} />
        </View>
      ) : null}
      {showImage ? <View style={imageStyle} pointerEvents="none">
        <Image testID={`${testID}-image`} source={{ uri: uri! }} style={StyleSheet.absoluteFill}
          contentFit="contain" cachePolicy="memory-disk" recyclingKey={uri} transition={0}
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      </View> : null}
      {/* Quiet framing, not desaturation: the new objects retain their full
          colour. No luminous backplates or clips from the previous art family. */}
      {!wide ? <LinearGradient
        colors={[withAlpha(colors.artworkSurface, 0), withAlpha(colors.artworkSurface, 0), withAlpha(colors.artworkSurface, 0.94), colors.artworkSurface]}
        locations={[0, 0.48, 0.81, 1]} style={StyleSheet.absoluteFill}
      /> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.artworkSurface, overflow: "hidden", pointerEvents: "none" },
  image: { position: "absolute", top: -2, left: "5%", width: "90%", aspectRatio: 1 },
  compactImage: { top: 0, left: "9%", width: "82%" },
  bannerImage: { position: "absolute", top: -9, right: 0, width: 106, height: 106 },
  center: { alignItems: "center", justifyContent: "center" },
}));

// Icona 3D della categoria "nuda" (senza fondo né sfumatura), per badge e
// pillole: stessa immagine della Home; se non carica, torna l'icona a linea.
export function CategoryArtMark({ categoryId, color, size, plain = false, tight = false, aspect = 1, testID }: { categoryId: string; color: string; size: number; /** Senza piastrella scura dietro: solo l'oggetto 3D. */ plain?: boolean; /** Ritaglio stretto sull'oggetto: riempie il riquadro come le altre icone 3D. */ tight?: boolean; /** Larghezza/altezza del riquadro: >1 lascia agli oggetti larghi (es. pianeta) l'altezza piena. */ aspect?: number; testID: string }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  if (failed) return <CategoryIcon categoryId={categoryId} color={color} highlightColor={colors.onGradient} size={Math.round(size * 0.7)} testID={`${testID}-line-icon`} />;
  return (
    <Image testID={testID} source={{ uri: categoryArtworkUrl(categoryId, ART_VERSION, plain, tight) }} style={{ width: Math.round(size * aspect), height: size, borderRadius: plain ? 0 : Math.round(size * 0.3), backgroundColor: plain ? "transparent" : colors.artworkSurface }}
      contentFit="contain" cachePolicy="memory-disk" transition={0} onError={() => setFailed(true)} />
  );
}