// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Mapping SF Symbols → Material Icons pour SiteVerseur
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "folder.fill": "folder",
  "list.bullet.clipboard.fill": "assignment",
  "gearshape.fill": "settings",
  "chart.bar.fill": "bar-chart",
  // Camion / site
  "truck.box.fill": "local-shipping",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  // Chantier
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash.fill": "delete",
  "doc.fill": "description",
  "doc.badge.plus": "note-add",
  "checkmark.seal.fill": "verified",
  "clock.fill": "schedule",
  "calendar": "calendar-today",
  "location.fill": "location-on",
  "person.fill": "person",
  "phone.fill": "phone",
  "envelope.fill": "email",
  // Statuts
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "arrow.clockwise": "refresh",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Données
  "scalemass.fill": "scale",
  "chart.line.uptrend.xyaxis": "trending-up",
  "eurosign.circle.fill": "euro",
  "bell.fill": "notifications",
  "bell.badge.fill": "notifications-active",
  "info.circle.fill": "info",
  "paperplane.fill": "send",
  "square.and.arrow.up": "share",
  "magnifyingglass": "search",
  "chevron.left.forwardslash.chevron.right": "code",
  "xmark": "close",
  "checkmark": "check",
  "minus": "remove",
  "plus": "add",
  "star.fill": "star",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "arrow.right.circle.fill": "arrow-circle-right",
  "building.2.fill": "business",
  "number.circle.fill": "looks-one",
  "waveform.path.ecg": "monitor-heart",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
