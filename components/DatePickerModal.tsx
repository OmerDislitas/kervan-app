import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WEEKDAYS_SHORT = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

type Props = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (date: string) => void;
  minDate?: string; // YYYY-MM-DD, varsayılan bugün
};

export default function DatePickerModal({ visible, value, onClose, onSelect, minDate }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const min = minDate ?? todayStr;

  const parseValue = () => {
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  };

  const initial = parseValue();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [step, setStep] = useState<'calendar' | 'year' | 'month'>('calendar');

  const currentYear = today.getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Takvim grid için boş kutular
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr < min;
  };

  const isSelected = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const isToday = (day: number) => {
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  const handleDayPress = (day: number) => {
    if (isDisabled(day)) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onSelect(selectedDate);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tarih Seç</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'calendar' && (
            <>
              {/* Ay / Yıl navigasyon */}
              <View style={styles.navRow}>
                <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.monthYearBtn} onPress={() => setStep('month')}>
                  <Text style={styles.monthYearText}>{MONTHS_TR[viewMonth]}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.monthYearBtn} onPress={() => setStep('year')}>
                  <Text style={styles.monthYearText}>{viewYear}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Haftanın günleri */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS_SHORT.map((d) => (
                  <Text key={d} style={styles.weekdayText}>{d}</Text>
                ))}
              </View>

              {/* Takvim günleri */}
              <View style={styles.grid}>
                {calendarCells.map((day, idx) => {
                  if (!day) return <View key={`e-${idx}`} style={styles.dayCell} />;
                  const disabled = isDisabled(day);
                  const selected = isSelected(day);
                  const tod = isToday(day);
                  return (
                    <TouchableOpacity
                      key={`d-${day}`}
                      style={[
                        styles.dayCell,
                        selected && styles.dayCellSelected,
                        !selected && tod && styles.dayCellToday,
                        disabled && styles.dayCellDisabled,
                      ]}
                      onPress={() => handleDayPress(day)}
                      activeOpacity={disabled ? 1 : 0.7}
                    >
                      <Text style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                        !selected && tod && styles.dayTextToday,
                        disabled && styles.dayTextDisabled,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 'year' && (
            <>
              <Text style={styles.stepTitle}>Yıl Seç</Text>
              <View style={styles.yearGrid}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearCell, viewYear === y && styles.yearCellSelected]}
                    onPress={() => { setViewYear(y); setStep('calendar'); }}
                  >
                    <Text style={[styles.yearText, viewYear === y && styles.yearTextSelected]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === 'month' && (
            <>
              <Text style={styles.stepTitle}>Ay Seç</Text>
              <View style={styles.monthGrid}>
                {MONTHS_TR.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthCell, viewMonth === i && styles.monthCellSelected]}
                    onPress={() => { setViewMonth(i); setStep('calendar'); }}
                  >
                    <Text style={[styles.monthText, viewMonth === i && styles.monthTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Seçilen tarih göstergesi & Onayla */}
          {step === 'calendar' && (
            <View style={styles.footer}>
              <View style={styles.selectedInfo}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
                <Text style={styles.selectedText}>
                  {selectedDate
                    ? (() => {
                        const [y, m, d] = selectedDate.split('-');
                        return `${d} ${MONTHS_TR[parseInt(m) - 1]} ${y}`;
                      })()
                    : 'Tarih seçilmedi'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.confirmBtn, !selectedDate && { opacity: 0.5 }]}
                onPress={handleConfirm}
                disabled={!selectedDate}
              >
                <Text style={styles.confirmBtnText}>Onayla</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const CELL_SIZE = 42;

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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  monthYearText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  weekdayText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 4,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: Colors.textMuted,
  },
  stepTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  yearCell: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 90,
    alignItems: 'center',
  },
  yearCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yearText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  yearTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  monthCell: {
    width: '28%',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  monthCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  monthTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectedText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: Colors.background,
  },
});
