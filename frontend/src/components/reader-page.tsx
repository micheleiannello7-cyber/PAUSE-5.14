// PAUSE — una pagina del lettore a scorrimento a pagine: alta esattamente
// quanto lo ScrollView esterno (l'ultima può crescere), contenuto centrato
// nell'area leggibile sotto la barra. Nessuno scroll annidato: se il contenuto
// non ci sta, la pagina chiede al contenuto di farsi più compatto (livelli
// 0 → 1 → 2, tipografia via via più piccola) finché rientra.
import { ReactNode, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";

export type PageContent = ReactNode | ((compact: number) => ReactNode);

export function ReaderPage({ height, paddingTop, paddingBottom, center = true, grow = false, children, testID }: {
  height: number; paddingTop: number; paddingBottom: number; center?: boolean;
  /** Ultima pagina: può essere più alta dello schermo (si raggiunge la fine con lo scroll). */
  grow?: boolean;
  children: PageContent; testID: string;
}) {
  const [compact, setCompact] = useState(0);
  const available = height - paddingTop - paddingBottom;
  const onContentLayout = (e: LayoutChangeEvent) => {
    if (!grow && e.nativeEvent.layout.height > available + 1 && compact < 2) setCompact(compact + 1);
  };
  return (
    <View
      style={[grow ? { minHeight: height } : { height }, { width: "100%", paddingTop, paddingBottom, justifyContent: center ? "center" : "flex-start" }]}
      testID={testID}
    >
      <View onLayout={onContentLayout}>{typeof children === "function" ? children(compact) : children}</View>
    </View>
  );
}
