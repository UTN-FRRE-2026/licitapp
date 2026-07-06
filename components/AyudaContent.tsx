// Centro de ayuda / Preguntas frecuentes. Contenido compartido por ambos roles;
// el set de preguntas se adapta según sea constructor o corralón.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { BackButton } from './ui/BackButton';
import { Card } from './ui/Card';
import { useAuthStore } from '../stores/authStore';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq {
  q: string;
  a: string;
}

const FAQ_CONSTRUCTOR: Faq[] = [
  {
    q: '¿Cómo publico una licitación?',
    a: 'Desde Inicio tocá "+ Nueva licitación", cargá la lista de materiales con sus cantidades, elegí la zona de entrega y la fecha de cierre. En cuanto la publicás, los corralones de tu zona la ven al instante.',
  },
  {
    q: '¿Cuándo recibo las ofertas?',
    a: 'Apenas un corralón cargue su oferta vas a recibir una notificación. Podés comparar todas las ofertas recibidas desde el detalle de cada licitación.',
  },
  {
    q: '¿Cómo elijo la mejor oferta?',
    a: 'Entrá a "Comparar ofertas" desde tu licitación. Vas a ver precio total, costo de envío y tiempo de entrega de cada corralón, con etiquetas de "Mejor precio" y "Entrega rápida" para ayudarte a decidir.',
  },
  {
    q: '¿Qué pasa cuando acepto una oferta?',
    a: 'La licitación se cierra automáticamente, el corralón ganador es notificado y obtenés sus datos de contacto para coordinar la entrega. El resto de las ofertas quedan marcadas como no seleccionadas.',
  },
  {
    q: '¿Tiene costo usar LicitApp?',
    a: 'Crear tu cuenta y publicar licitaciones es gratis. Solo coordinás el pago de los materiales directamente con el corralón que elijas.',
  },
];

const FAQ_CORRALON: Faq[] = [
  {
    q: '¿Cómo veo los pedidos de mi zona?',
    a: 'En Inicio aparece el feed de licitaciones abiertas en tu zona de cobertura, actualizado en tiempo real. Tocá cualquiera para ver los materiales y condiciones.',
  },
  {
    q: '¿Cómo presento una oferta?',
    a: 'Abrí el detalle de un pedido y tocá "Presentar oferta". Cargá tu precio total, el costo de envío, el tiempo de entrega y, si querés, un comentario o presupuesto adjunto.',
  },
  {
    q: '¿Puedo editar una oferta ya enviada?',
    a: 'Sí, mientras la licitación siga abierta podés editar el precio, el envío, el tiempo de entrega y el comentario desde "Mis ofertas". Una vez que el constructor elige una oferta, ya no se puede modificar.',
  },
  {
    q: '¿Cómo sé si gané una licitación?',
    a: 'Recibís una notificación en cuanto el constructor acepta tu oferta. En "Mis ofertas" la verás marcada como Ganada, junto con los datos de contacto para coordinar la entrega.',
  },
  {
    q: '¿Cómo amplío mi zona de cobertura?',
    a: 'Desde tu Perfil → Editar perfil podés cambiar tu zona. Solo vas a ver pedidos de la zona configurada.',
  },
];

export function AyudaContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((s) => s.role);
  const [open, setOpen] = useState<number | null>(null);

  const faqs = role === 'corralon' ? FAQ_CORRALON : FAQ_CONSTRUCTOR;

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => (prev === i ? null : i));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <BackButton />
        <Text style={styles.navTitle}>Centro de ayuda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Preguntas frecuentes para que aproveches LicitApp al máximo.
        </Text>

        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => toggle(i)}>
              <Card style={styles.faqCard}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQ}>{faq.q}</Text>
                  <Text style={[styles.chev, isOpen && styles.chevOpen]}>⌄</Text>
                </View>
                {isOpen && <Text style={styles.faqA}>{faq.a}</Text>}
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Contacto */}
        <Text style={styles.sectionTitle}>¿Necesitás más ayuda?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => Linking.openURL('mailto:soporte@licitapp.com')}
        >
          <Card style={styles.contactCard}>
            <Text style={styles.contactIcon}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>Escribinos</Text>
              <Text style={styles.contactSub}>soporte@licitapp.com</Text>
            </View>
            <Text style={styles.chevRight}>›</Text>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },

  scroll: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 13, color: colors.gray[500], marginBottom: 16, lineHeight: 19 },

  faqCard: { marginBottom: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  chev: { fontSize: 18, color: colors.gray[400], fontWeight: '700' },
  chevOpen: { color: colors.brand[500] },
  faqA: { fontSize: 13, color: colors.gray[600], lineHeight: 20, marginTop: 12 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { fontSize: 24 },
  contactTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  contactSub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  chevRight: { fontSize: 22, color: colors.gray[400], fontWeight: '300' },
});
