import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { useUnreadCount } from '../../hooks/useNotifications';

function TabIcon({
  emoji,
  label,
  focused,
  badgeCount,
}: {
  emoji: string;
  label: string;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={styles.emojiWrap}>
        <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.tabLabel, focused && styles.tabLabelActive]}
        numberOfLines={1}
        ellipsizeMode="clip"
      >
        {label}
      </Text>
    </View>
  );
}

export default function CorralónLayout() {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
        ],
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Inicio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-ofertas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" label="Mis ofertas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" label="Alertas" focused={focused} badgeCount={unread} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      />
      {/* Pantallas sin tab */}
      <Tabs.Screen name="cargar-oferta"  options={{ href: null }} />
      <Tabs.Screen name="venta-cerrada"  options={{ href: null }} />
      <Tabs.Screen name="solicitud/[id]" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil"  options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%' },
  emojiWrap: { position: 'relative' },
  tabEmoji: { fontSize: 22, opacity: 0.4, lineHeight: 26 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: colors.gray[400], fontWeight: '500', lineHeight: 12 },
  tabLabelActive: { color: colors.brand[600] },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: colors.white, fontWeight: '700', lineHeight: 11 },
});
