import { useEffect } from 'react';
import { Platform } from 'react-native';

// Oculta la barra de navegación de Android (home/back). Con edge-to-edge
// habilitado (default en SDK 54+), Android automáticamente entra en modo
// "sticky immersive": el usuario puede revelar la barra deslizando desde el
// borde inferior y se vuelve a ocultar sola.

export function useImmersiveNavBar() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // require perezoso: el módulo solo existe en builds nativos.
    let NavBar: { NavigationBar: { setHidden: (hidden: boolean) => void } } | null = null;
    try {
      NavBar = require('expo-navigation-bar');
    } catch {
      return;
    }

    NavBar?.NavigationBar.setHidden(true);
  }, []);
}
