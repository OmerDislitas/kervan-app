import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { ISTANBUL_UNIVERSITIES, UNIVERSITY_YEARS, DEPARTMENTS } from '@/constants/data';
import { registerData } from './step1';

export default function RegisterStep2() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [uniSearch, setUniSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const filteredUniversities = ISTANBUL_UNIVERSITIES.filter((u) =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
  );

  const filteredDepartments = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleNext = () => {
    if (!university) {
      Alert.alert('Eksik Bilgi', 'Lütfen üniversitenizi seçin.');
      return;
    }
    if (!department) {
      Alert.alert('Eksik Bilgi', 'Lütfen bölümünüzü seçin.');
      return;
    }
    if (!year) {
      Alert.alert('Eksik Bilgi', 'Lütfen sınıfınızı seçin.');
      return;
    }

    registerData.university = university;
    registerData.department = department;
    registerData.year = year;
    registerData.isStudent = true;

    router.push('/(auth)/register/step3');
  };

  const handleSkipStudent = () => {
    registerData.university = 'Mezun/Diğer';
    registerData.department = 'Diğer';
    registerData.year = 'Diğer';
    registerData.isStudent = false;
    router.push('/(auth)/register/step3');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kayıt Ol</Text>
          <View style={{ width: 36 }} />
        </View>

        <ProgressBar step={2} total={4} />

        <Text style={styles.stepTitle}>Üniversite Bilgileri</Text>
        <Text style={styles.stepSubtitle}>
          Sana uygun etkinlikler sunabilmek için bilgilerine ihtiyacımız var.
        </Text>

        {/* Üniversite Seçimi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Üniversite *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowUniversityModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="school-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <Text
              style={[styles.selectButtonText, university ? { color: themeColors.textPrimary } : { color: themeColors.textMuted }]}
              numberOfLines={1}
            >
              {university || 'Üniversite seçin'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Bölüm Seçimi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bölüm *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDepartmentModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="book-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <Text
              style={[styles.selectButtonText, department ? { color: themeColors.textPrimary } : { color: themeColors.textMuted }]}
              numberOfLines={1}
            >
              {department || 'Bölüm seçin'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sınıf Seçimi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sınıf *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowYearModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <Text
              style={[styles.selectButtonText, year ? { color: themeColors.textPrimary } : { color: themeColors.textMuted }]}
            >
              {year || 'Sınıf seçin'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Devam Et</Text>
          <Ionicons name="arrow-forward" size={20} color={themeColors.background} />
        </TouchableOpacity>

        {/* Not a Student Option */}
        <TouchableOpacity 
          style={styles.skipStudentButton} 
          onPress={handleSkipStudent}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={20} color={themeColors.primary} />
          <Text style={styles.skipStudentText}>Öğrenci değilim</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Üniversite Modal */}
      <Modal visible={showUniversityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Üniversite Seç</Text>
              <TouchableOpacity onPress={() => { setShowUniversityModal(false); setUniSearch(''); }}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={16} color={themeColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Üniversite ara..."
                placeholderTextColor={themeColors.textMuted}
                value={uniSearch}
                onChangeText={setUniSearch}
                autoFocus
              />
              {uniSearch.length > 0 && (
                <TouchableOpacity onPress={() => setUniSearch('')}>
                  <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredUniversities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, university === item && styles.modalItemSelected]}
                  onPress={() => { setUniversity(item); setUniSearch(''); setShowUniversityModal(false); }}
                >
                  <Text style={[styles.modalItemText, university === item && { color: themeColors.primary }]}>
                    {item}
                  </Text>
                  {university === item && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>

      {/* Bölüm Modal */}
      <Modal visible={showDepartmentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bölüm Seç</Text>
              <TouchableOpacity onPress={() => { setShowDepartmentModal(false); setDeptSearch(''); }}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={16} color={themeColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Bölüm ara..."
                placeholderTextColor={themeColors.textMuted}
                value={deptSearch}
                onChangeText={setDeptSearch}
                autoFocus
              />
              {deptSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDeptSearch('')}>
                  <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, department === item && styles.modalItemSelected]}
                  onPress={() => { setDepartment(item); setDeptSearch(''); setShowDepartmentModal(false); }}
                >
                  <Text style={[styles.modalItemText, department === item && { color: themeColors.primary }]}>
                    {item}
                  </Text>
                  {department === item && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>

      {/* Sınıf Modal */}
      <Modal visible={showYearModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 450 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sınıf Seç</Text>
              <TouchableOpacity onPress={() => setShowYearModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            {UNIVERSITY_YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.modalItem, year === y && styles.modalItemSelected]}
                onPress={() => { setYear(y); setShowYearModal(false); }}
              >
                <Text style={[styles.modalItemText, year === y && { color: themeColors.primary }]}>{y}</Text>
                {year === y && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const themeColors = useThemeColors();
  const progressStyles = createProgressStyles(themeColors);
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[progressStyles.bar, i < step ? progressStyles.active : progressStyles.inactive]} />
      ))}
      <Text style={progressStyles.label}>{step}/{total}</Text>
    </View>
  );
}

const createProgressStyles = (themeColors: any) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  active: { backgroundColor: themeColors.primary },
  inactive: { backgroundColor: themeColors.border },
  label: { color: themeColors.textSecondary, fontSize: Typography.fontSize.xs, marginLeft: Spacing.xs, fontWeight: '600' },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing['2xl'], paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  stepTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', color: themeColors.textPrimary, marginBottom: Spacing.xs },
  stepSubtitle: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  inputIcon: { marginRight: Spacing.sm },
  selectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, paddingHorizontal: Spacing.md, height: 50 },
  selectButtonText: { flex: 1, fontSize: Typography.fontSize.md, color: themeColors.textPrimary },
  nextButton: { flexDirection: 'row', backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl, shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  nextButtonText: { color: themeColors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  skipStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.primary + '33',
    backgroundColor: themeColors.primary + '08',
  },
  skipStudentText: {
    color: themeColors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: themeColors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, maxHeight: '80%', borderWidth: 1, borderColor: themeColors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: themeColors.textPrimary },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surfaceLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: themeColors.border },
  searchInput: { flex: 1, height: 44, color: themeColors.textPrimary, fontSize: Typography.fontSize.md },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.border },
  modalItemSelected: { backgroundColor: themeColors.surfaceLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  modalItemText: { fontSize: Typography.fontSize.md, color: themeColors.textPrimary, flex: 1 },
});

