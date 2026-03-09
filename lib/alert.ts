import { Alert, Platform } from "react-native";

/**
 * Affiche une alerte compatible web et mobile.
 * Sur mobile : utilise Alert.alert natif.
 * Sur web : utilise window.alert.
 */
export function showAlert(title: string, message?: string, onOk?: () => void): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    onOk?.();
  } else {
    Alert.alert(title, message, [{ text: "OK", onPress: onOk }]);
  }
}

/**
 * Affiche une boîte de confirmation compatible web et mobile.
 * Sur mobile : utilise Alert.alert natif avec deux boutons.
 * Sur web : utilise window.confirm.
 *
 * @param title - Titre de la confirmation
 * @param message - Message de la confirmation
 * @param onConfirm - Callback appelé si l'utilisateur confirme
 * @param confirmLabel - Libellé du bouton de confirmation (défaut : "Confirmer")
 * @param destructive - Si true, le bouton de confirmation est en rouge sur mobile
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel: string = "Confirmer",
  destructive: boolean = false,
): void {
  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    if (window.confirm(text)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: onConfirm,
      },
    ]);
  }
}
