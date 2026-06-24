import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../constants/colors';
import type { Notification, NotificationType } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onPress: (n: Notification) => void;
}

interface TypeMeta {
  icon: string;
  bg: string;
  fg: string;
}

const TYPE_META: Record<NotificationType, TypeMeta> = {
  NEW_OFFER:     { icon: '💰', bg: colors.brand[50],   fg: colors.brand[600]   },
  NEW_REQUEST:   { icon: '📋', bg: colors.infoBg,      fg: colors.infoText     },
  DEADLINE_NEAR: { icon: '⏰', bg: colors.warningBg,   fg: colors.warningText  },
  OFFER_WON:     { icon: '🏆', bg: colors.successBg,   fg: colors.successText  },
  OFFER_LOST:    { icon: '📉', bg: colors.dangerBg,    fg: colors.dangerText   },
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.NEW_OFFER;
  const time = formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es });

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
      style={[styles.row, !notification.read && styles.rowUnread]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, !notification.read && styles.titleUnread]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.text} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  rowUnread: {
    backgroundColor: colors.brand[50],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  body: { flex: 1, justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  titleUnread: { color: colors.gray[900], fontWeight: '700' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  text: { fontSize: 13, color: colors.gray[600], lineHeight: 18 },
  time: { fontSize: 11, color: colors.gray[400], marginTop: 4 },
});
