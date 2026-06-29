// Pantalla — Onboarding (cómo funciona LicitApp)
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { ONBOARDING_SEEN_KEY } from '../../constants/storage';

interface Slide {
  key: string;
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    key: '1',
    emoji: '📝',
    title: 'Publicá tu pedido',
    description:
      'Cargá la lista de materiales que necesitás para tu obra y elegí la zona de entrega. En minutos queda visible para los corralones.',
  },
  {
    key: '2',
    emoji: '💸',
    title: 'Recibí ofertas comparables',
    description:
      'Los corralones de tu zona compiten con su mejor precio y tiempo de entrega. Compará todo en una sola pantalla, sin llamados.',
  },
  {
    key: '3',
    emoji: '🤝',
    title: 'Cerrá el mejor trato',
    description:
      'Elegí la oferta que más te conviene con un toque y coordiná la entrega directamente con el corralón ganador.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    } catch {
      // si falla el guardado no bloqueamos al usuario; verá el onboarding otra vez
    }
    router.replace('/(auth)/elegir-rol');
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>
          Licit<Text style={styles.logoAccent}>App</Text>
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={8}>
            <Text style={styles.skip}>Saltar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.illustration}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button label={isLast ? 'Empezar ahora' : 'Siguiente'} onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logo: { fontSize: 22, fontWeight: '800', color: colors.gray[900], letterSpacing: -0.5 },
  logoAccent: { color: colors.brand[500] },
  skip: { fontSize: 14, color: colors.gray[500], fontWeight: '600' },

  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 44,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  emoji: { fontSize: 84 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 23,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  dotActive: { width: 24, backgroundColor: colors.brand[500] },
});
