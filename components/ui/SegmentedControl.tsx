import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Segment<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  selected: T;
  onSelect: (key: T) => void;
}

export function SegmentedControl<T extends string>({
  segments,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.wrapper}>
      {segments.map((seg) => {
        const active = seg.key === selected;
        return (
          <TouchableOpacity
            key={seg.key}
            style={[styles.item, active && styles.itemActive]}
            onPress={() => onSelect(seg.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {seg.label}
              {seg.count !== undefined && (
                <Text style={[styles.count, active && styles.countActive]}>
                  {' '}{seg.count}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  item: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
  },
  itemActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  labelActive: {
    color: colors.gray[900],
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[400],
  },
  countActive: {
    color: colors.gray[400],
  },
});
