import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Pantalla de carga a pantalla completa que replica el splash nativo (fondo
 * naranja de marca + logo). Se usa mientras se resuelve la sesión, para no
 * mostrar el login por un instante cuando el usuario ya tiene sesión iniciada.
 */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color={colors.white} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F97316', // igual al backgroundColor del splash en app.json
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 140, height: 140 },
  spinner: { marginTop: 28 },
});
