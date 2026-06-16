import React from 'react';
import { View, StyleSheet, Alert, Platform, InteractionManager } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/constants/theme';
import { useFocusTimer, createProfilerHandler } from '@/lib/debugPerf';
import { SafeAreaView } from 'react-native-safe-area-context';
import SozSendeHeader from './_components/SozSendeHeader';
import QuestionList from './_components/QuestionList';
import SuggestModal from './_components/SuggestModal';

async function fetchQuestions() {
  const { data, error } = await supabase
    .from('weekly_questions')
    .select('*, profiles(full_name, username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export default function SozSendeScreen() {
  const themeColors = useThemeColors();
  useFocusTimer('SozSendeScreen');
  const sozProfilerHandler = React.useMemo(() => createProfilerHandler('SozSendeScreen'), []);
  const [suggestModalVisible, setSuggestModalVisible] = React.useState(false);
  const [suggestText, setSuggestText] = React.useState('');

  // Tab geçiş animasyonu bitmeden query başlatma
  const [dataEnabled, setDataEnabled] = React.useState(false);
  React.useEffect(() => {
    const t = InteractionManager.runAfterInteractions(() => setDataEnabled(true));
    return () => t.cancel();
  }, []);

  const { data: questions = [], isLoading: isQueryLoading, refetch, isRefetching } = useQuery({
    queryKey: ['weekly_questions'],
    queryFn: fetchQuestions,
    enabled: dataEnabled,
  });
  const isLoading = !dataEnabled || isQueryLoading;

  const submitSuggestion = async (title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Hata', 'Giriş yapılmış bir kullanıcı bulunamadı.'); return; }
      const { error } = await supabase
        .from('topic_suggestions')
        .insert({ user_id: user.id, title, status: 'pending' });
      if (error) throw error;
      Alert.alert('Harika! 🎉', 'Tartışma konusu öneriniz başarıyla alınmıştır. İnceleme sonrası yayına alınacaktır.');
    } catch (err: any) {
      Alert.alert('Hata', 'Öneri iletilemedi: ' + err.message);
    }
  };

  const handleSuggestTopic = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Konu Önerisi 💡',
        'Tartışılmasını istediğin fikri veya soruyu gir:',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Gönder', onPress: (text?: string) => { if (text?.trim()) submitSuggestion(text.trim()); } },
        ],
        'plain-text'
      );
    } else {
      setSuggestText('');
      setSuggestModalVisible(true);
    }
  };

  const handleAndroidSuggestSubmit = async () => {
    if (!suggestText.trim()) { Alert.alert('Uyarı', 'Lütfen bir öneri yazınız.'); return; }
    setSuggestModalVisible(false);
    await submitSuggestion(suggestText.trim());
    setSuggestText('');
  };

  return (
    <React.Profiler id="SozSendeScreen" onRender={sozProfilerHandler}>
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Header → sıfır veri bağımlılığı, anında render */}
      <SozSendeHeader onSuggestTopic={handleSuggestTopic} />

      {/* Soru listesi → skeleton gösterir, veri gelince dolar */}
      <QuestionList
        questions={questions}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
      />

      {/* Android suggest modal */}
      <SuggestModal
        visible={suggestModalVisible}
        value={suggestText}
        onChangeText={setSuggestText}
        onClose={() => setSuggestModalVisible(false)}
        onSubmit={handleAndroidSuggestSubmit}
      />
    </SafeAreaView>
    </React.Profiler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

