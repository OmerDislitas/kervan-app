import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type DrumColumnProps = {
  items: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label: string;
};

function DrumColumn({ items, selectedIndex, onSelect, label }: DrumColumnProps) {
  const scrollRef = useRef<ScrollView>(null);

  const [localIndex, setLocalIndex] = React.useState(selectedIndex);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
      setLocalIndex(selectedIndex);
    }, 50);
  }, []);

  useEffect(() => {
    if (selectedIndex !== localIndex) {
      setLocalIndex(selectedIndex);
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  }, [selectedIndex, localIndex]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    if (clampedIndex !== localIndex) {
      setLocalIndex(clampedIndex);
      onSelect(clampedIndex);
    }
  };

  // Padding items üstte ve altta ortalama için
  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={drumStyles.column}>
      <Text style={drumStyles.label}>{label}</Text>
      <View style={drumStyles.pickerWrap}>
        {/* Seçim alanı highlight */}
        <View style={drumStyles.selectionHighlight} pointerEvents="none" />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: paddingItems * ITEM_HEIGHT,
            paddingBottom: paddingItems * ITEM_HEIGHT,
          }}
          style={{ height: PICKER_HEIGHT }}
        >
          {items.map((val, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <TouchableOpacity
                key={val}
                style={drumStyles.item}
                onPress={() => {
                  onSelect(idx);
                  scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                }}
                activeOpacity={0.7}
              >
                <Text style={[drumStyles.itemText, isSelected && drumStyles.itemTextSelected]}>
                  {pad(val)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  value: string; // HH:MM
  onClose: () => void;
  onSelect: (time: string) => void;
};

export default function TimePickerModal({ visible, value, onClose, onSelect }: Props) {
  const parseValue = () => {
    if (value && value.match(/^\d{2}:\d{2}$/)) {
      const [h, m] = value.split(':').map(Number);
      return { hourIndex: h, minuteIndex: m };
    }
    return { hourIndex: 9, minuteIndex: 0 };
  };

  const initial = parseValue();
  const [hourIndex, setHourIndex] = React.useState(initial.hourIndex);
  const [minuteIndex, setMinuteIndex] = React.useState(initial.minuteIndex);

  useEffect(() => {
    if (visible) {
      const p = parseValue();
      setHourIndex(p.hourIndex);
      setMinuteIndex(p.minuteIndex);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onSelect(`${pad(hours[hourIndex])}:${pad(minutes[minuteIndex])}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Saat Seç</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={styles.previewRow}>
            <Ionicons name="time" size={20} color={Colors.primary} />
            <Text style={styles.previewText}>
              {pad(hours[hourIndex])}:{pad(minutes[minuteIndex])}
            </Text>
          </View>

          {/* Drum Pickers */}
          <View style={styles.drumRow}>
            <DrumColumn
              items={hours}
              selectedIndex={hourIndex}
              onSelect={setHourIndex}
              label="Saat"
            />

            <Text style={styles.colon}>:</Text>

            <DrumColumn
              items={minutes}
              selectedIndex={minuteIndex}
              onSelect={setMinuteIndex}
              label="Dakika"
            />
          </View>

          {/* Hızlı seçim butonları */}
          <View style={styles.quickRow}>
            {[
              { label: '08:00', h: 8, m: 0 },
              { label: '12:00', h: 12, m: 0 },
              { label: '17:00', h: 17, m: 0 },
              { label: '19:00', h: 19, m: 0 },
              { label: '21:00', h: 21, m: 0 },
            ].map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[
                  styles.quickBtn,
                  hourIndex === q.h && minuteIndex === q.m && styles.quickBtnActive,
                ]}
                onPress={() => { setHourIndex(q.h); setMinuteIndex(q.m); }}
              >
                <Text style={[
                  styles.quickBtnText,
                  hourIndex === q.h && minuteIndex === q.m && styles.quickBtnTextActive,
                ]}>
                  {q.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Onayla */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.background} />
            <Text style={styles.confirmBtnText}>
              {pad(hours[hourIndex])}:{pad(minutes[minuteIndex])} Onayla
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const drumStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickerWrap: {
    position: 'relative',
    height: PICKER_HEIGHT,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.primary + '22',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 26,
    fontWeight: '300',
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  itemTextSelected: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  drumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnActive: {
    backgroundColor: Colors.primary + '33',
    borderColor: Colors.primary,
  },
  quickBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quickBtnTextActive: {
    color: Colors.primary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.background,
  },
});
