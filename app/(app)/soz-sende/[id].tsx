import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useAuthStore } from '@/stores/authStore';
import { useTabBarStore } from '@/stores/tabBarStore';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPushNotification } from '@/lib/notificationService';
import { getAvatarSource } from '@/constants/avatars';



async function fetchQuestionDetail(id: string) {
  const { data, error } = await supabase
    .from('weekly_questions')
    .select('*, profiles(full_name, username, avatar_id)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function fetchComments(questionId: string) {
  const { data, error } = await supabase
    .from('question_comments')
    .select('*, profiles(full_name, username, avatar_id), comment_likes(user_id)')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const authorStyles = useMemo(() => createAuthorStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  // Yorum kartına çift tıklamayı algılamak için son dokunuşu takip eder
  const lastTapRef = useRef<{ id: string, time: number } | null>(null);
  const DOUBLE_TAP_DELAY = 300;

  // Yorum sıralama skorları — her yorum ilk görüldüğü anda (o anki beğeni
  // sayısı ve yaşı ile) bir kez hesaplanıp burada dondurulur. Böylece bir
  // yoruma sonradan beğeni yapıldığında listedeki sırası DEĞİŞMEZ; skor
  // sadece yeni gelen yorumların "en beğenilen" ile "en yeni" arasında
  // nereye düşeceğini belirlemek için kullanılır (Hacker News tarzı "hot"
  // formülü: (beğeni + 1) / (yaş_saat + 2) ^ 1.5).
  const commentScoresRef = useRef<Map<string, number>>(new Map());

  // ------------------------------------------------------------------
  // TAB BAR — Bu ekranda tab bar'ı gizle (klavye ile çakışmasın).
  // Stil burada yeniden hesaplanıp setOptions ile geri yazılmıyor — sadece
  // paylaşılan store'daki bayrağı değiştiriyoruz. Gerçek tabBarStyle her
  // zaman app/(app)/_layout.tsx'de, güncel insets ile tek bir yerden
  // hesaplanıyor. Böylece eski/yanlış bir kopya geri yazılıp sistem
  // navigasyon çubuğunun ikonların üstüne binmesi mümkün değil.
  // KeyboardStickyView native olarak klavye pozisyonunu takip eder,
  // herhangi bir manuel hesaplama yok.
  // ------------------------------------------------------------------
  const setTabBarHidden = useTabBarStore((state) => state.setHidden);

  useFocusEffect(
    useCallback(() => {
      setTabBarHidden(true);
      return () => setTabBarHidden(false);
    }, [setTabBarHidden])
  );

  // Düzenleme ve Seçenekler için stateler
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [expandedContent, setExpandedContent] = useState<string[]>([]);

  const { data: question, isLoading: isQuestionLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => fetchQuestionDetail(id),
  });

  const { data: comments = [], isLoading: isCommentsLoading, refetch: refetchComments, isRefetching: isCommentsRefetching } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string, parentId?: string }) => {
      const { data, error } = await supabase
        .from('question_comments')
        .insert({ 
          question_id: id, 
          user_id: profile!.id, 
          content,
          parent_id: parentId 
        })
        .select('*, profiles(full_name, username), comment_likes(user_id)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newCommentData) => {
      setNewComment('');
      setReplyTo(null);
      Keyboard.dismiss();
      
      // Eğer yanıt ise parent comment'i otomatik genişlet
      if (newCommentData.parent_id) {
        setExpandedComments((prev) => {
          if (prev.includes(newCommentData.parent_id)) return prev;
          return [...prev, newCommentData.parent_id];
        });
      }

      queryClient.setQueryData(['comments', id], (old: any[] = []) => [...old, newCommentData]);
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['trend-questions-explore'] });
      AsyncStorage.setItem('@fikirforum_last_comment_time', Date.now().toString()).catch(() => {});

      const senderName = profile?.full_name || 'Biri';

      if (newCommentData.parent_id) {
        // Yanıt: üst yorumun sahibine bildirim
        const parentComment = comments.find(c => c.id === newCommentData.parent_id);
        if (parentComment && parentComment.user_id !== profile?.id) {
          sendPushNotification(
            parentComment.user_id,
            'Yorumuna Yanıt Geldi! 💬',
            'Paylaştığın yoruma yeni bir yanıt yazıldı.',
            { type: 'comment-reply', questionId: id, commentId: newCommentData.id }
          ).catch(() => {});
        }
      } else {
        // Yeni ana yorum: soru sahibine bildirim
        if (question && question.user_id && question.user_id !== profile?.id) {
          sendPushNotification(
            question.user_id,
            'Sorunuza Yeni Yorum! 💬',
            `${senderName} sorunuza yorum yaptı.`,
            { type: 'comment-reply', questionId: id, commentId: newCommentData.id }
          ).catch(() => {});
        }
      }

      // Supabase trigger puanı güncelledi, store'u senkronize et
      if (profile?.id) {
        useAuthStore.getState().fetchProfile(profile.id);
      }
    },
    onError: (error: any) => {
      Alert.alert('Hata', 'Yorum gönderilemedi: ' + error.message);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      // Yorumun silinmesi sırasında diğer kullanıcıların beğenilerini/yanıtlarını
      // cascade ile silebilmek için yetkilendirilmiş RPC fonksiyonunu kullanıyoruz.
      const { error } = await supabase.rpc('delete_comment', { comment_id: commentId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setOptionsVisible(false);
      queryClient.invalidateQueries({ queryKey: ['trend-questions-explore'] });
      // Yorum silinince puan azalabilir, store'u senkronize et
      if (profile?.id) {
        useAuthStore.getState().fetchProfile(profile.id);
      }
    },
    onError: (error: any) => {
      Alert.alert('Hata', 'Yorum silinemedi: ' + error.message);
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string, content: string }) => {
      const { error } = await supabase
        .from('question_comments')
        .update({ content })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setEditModalVisible(false);
      setOptionsVisible(false);
      Alert.alert('Başarılı', 'Yorumunuz güncellendi.');
    },
    onError: (error: any) => {
      Alert.alert('Hata', 'Yorum güncellenemedi: ' + error.message);
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, hasLiked }: { commentId: string, hasLiked: boolean }) => {
      if (hasLiked) {
        await supabase.from('comment_likes').delete().match({ comment_id: commentId, user_id: profile!.id });
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: profile!.id });
      }
    },
    // Optimistic update — beğeni anında arayüzde yansır, sunucu yanıtı
    // beklenirken ekranda yükleniyor/flicker görünmez.
    onMutate: async ({ commentId, hasLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', id] });
      const previousComments = queryClient.getQueryData(['comments', id]);

      queryClient.setQueryData(['comments', id], (old: any[] = []) =>
        old.map((c) => {
          if (c.id !== commentId) return c;
          const likes = c.comment_likes || [];
          const newLikes = hasLiked
            ? likes.filter((l: any) => l.user_id !== profile?.id)
            : [...likes, { user_id: profile?.id }];
          return { ...c, comment_likes: newLikes };
        })
      );

      return { previousComments };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', id], context.previousComments);
      }
    },
    onSuccess: (_, variables) => {
      if (!variables.hasLiked) {
        AsyncStorage.setItem('@fikirforum_last_like_time', Date.now().toString()).catch(() => {});

        // Send notification to comment author
        const comment = comments.find(c => c.id === variables.commentId);
        if (comment && comment.user_id !== profile?.id) {
          sendPushNotification(
            comment.user_id,
            'Yorumun Beğenildi! ❤️',
            'Yorumun topluluktan bir beğeni aldı.',
            { type: 'comment-like', questionId: id, commentId: variables.commentId }
          ).catch(() => {});
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  const handleSendComment = () => {
    if (!newComment.trim() || !profile) return;
    commentMutation.mutate({ content: newComment.trim(), parentId: replyTo?.id });
  };

  const handleLike = (commentId: string, likes: any[]) => {
    if (!profile) return;
    const hasLiked = likes.some(like => like.user_id === profile.id);
    likeMutation.mutate({ commentId, hasLiked });
  };

  const navigateToProfile = (userId: string) => {
    if (userId === profile?.id) router.push('/(app)/profile');
    else router.push(`/(app)/profile/${userId}`);
  };

  if (isQuestionLoading || !question) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const mainCommentsList = comments.filter(c => !c.parent_id);
  const now = Date.now();
  mainCommentsList.forEach((c) => {
    if (!commentScoresRef.current.has(c.id)) {
      const ageHours = Math.max((now - new Date(c.created_at).getTime()) / 3_600_000, 0);
      const likes = c.comment_likes?.length || 0;
      commentScoresRef.current.set(c.id, (likes + 1) / Math.pow(ageHours + 2, 1.5));
    }
  });
  const mainComments = [...mainCommentsList].sort(
    (a, b) => (commentScoresRef.current.get(b.id) || 0) - (commentScoresRef.current.get(a.id) || 0)
  );

  const renderComment = (item: any, isReply = false) => {
    const likesCount = item.comment_likes?.length || 0;
    const hasLiked = profile ? item.comment_likes?.some((l: any) => l.user_id === profile.id) : false;
    const replies = comments.filter(c => c.parent_id === item.id);
    const authorName = item.profiles?.username ? `@${item.profiles.username}` : (item.profiles?.full_name || 'Kullanıcı');
    const isExpanded = expandedComments.includes(item.id);
    const TRUNCATE_LENGTH = 150;
    const isContentExpanded = expandedContent.includes(item.id);
    const shouldTruncate = item.content.length > TRUNCATE_LENGTH && !isContentExpanded;

    return (
      <View key={item.id} style={[styles.commentWrapper, isReply && styles.replyWrapper]}>
        {isReply && <View style={styles.replyConnector} />}

        <TouchableOpacity
          activeOpacity={!isReply && replies.length > 0 ? 0.92 : 1}
          onPress={() => {
            const now = Date.now();
            const lastTap = lastTapRef.current;

            if (lastTap && lastTap.id === item.id && now - lastTap.time < DOUBLE_TAP_DELAY) {
              lastTapRef.current = null;
              handleLike(item.id, item.comment_likes || []);
              return;
            }

            lastTapRef.current = { id: item.id, time: now };

            if (!isReply && replies.length > 0) {
              setExpandedComments(prev =>
                prev.includes(item.id)
                  ? prev.filter(id => id !== item.id)
                  : [...prev, item.id]
              );
            }
          }}
        >
        <View style={styles.commentCard}>
          <View style={styles.commentHeader}>
            <TouchableOpacity 
              onPress={() => navigateToProfile(item.user_id)}
              activeOpacity={0.8}
            >
              {item.profiles?.avatar_id ? (
                <Image source={getAvatarSource(item.profiles.avatar_id)} style={styles.avatarCircle} />
              ) : (
                <LinearGradient
                  colors={[themeColors.surfaceLight, themeColors.border]}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarText}>
                    {(item.profiles?.username || item.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            
            <View style={styles.authorInfo}>
              <View style={styles.authorRow}>
                <TouchableOpacity onPress={() => navigateToProfile(item.user_id)}>
                  <Text style={styles.authorName}>{authorName}</Text>
                </TouchableOpacity>
                <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                {item.user_id === profile?.id && (
                  <View style={styles.selfBadge}>
                    <Text style={styles.selfBadgeText}>Siz</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => handleLike(item.id, item.comment_likes || [])}
              style={styles.likeIconBtn}
            >
              <Ionicons
                name={hasLiked ? "heart" : "heart-outline"}
                size={22}
                color={hasLiked ? '#FF69B4' : themeColors.textMuted}
              />
              {likesCount > 0 && <Text style={[styles.likesMiniCount, hasLiked && { color: '#FF69B4' }]}>{likesCount}</Text>}
            </TouchableOpacity>

            {(item.user_id === profile?.id || profile?.role === 'admin') && (
              <TouchableOpacity 
                style={styles.moreBtn}
                onPress={() => {
                  setSelectedComment(item);
                  setEditContent(item.content);
                  setOptionsVisible(true);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.commentText}>
            {shouldTruncate ? item.content.substring(0, TRUNCATE_LENGTH) : item.content}
            {shouldTruncate && (
              <Text onPress={() => setExpandedContent(prev => [...prev, item.id])}>
                <Text style={{ color: themeColors.textMuted }}>{'... '}</Text>
                <Text style={styles.readMoreText}>devamını oku</Text>
              </Text>
            )}
          </Text>
          
          <View style={styles.commentFooter}>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => {
                setReplyTo({ id: item.id, name: authorName });
                setNewComment('');
              }}
            >
              <Ionicons name="return-down-forward" size={16} color={themeColors.primary} />
              <Text style={styles.actionBtnText}>Yanıtla</Text>
            </TouchableOpacity>
            
            <View style={{ flex: 1 }} />
            
            {!isReply && replies.length > 0 && (
              <TouchableOpacity 
                style={styles.repliesToggleBtn}
                onPress={() => {
                  setExpandedComments(prev => 
                    prev.includes(item.id) 
                      ? prev.filter(id => id !== item.id) 
                      : [...prev, item.id]
                  );
                }}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={14} 
                  color={themeColors.textSecondary} 
                />
                <Text style={styles.repliesToggleText}>
                  {replies.length} Yanıt
                </Text>
              </TouchableOpacity>
            )}

            {likesCount > 10 && (
              <View style={styles.popularityIndicator}>
                <Ionicons name="trending-up" size={12} color={themeColors.success} />
                <Text style={styles.popularityText}>Popüler</Text>
              </View>
            )}
          </View>
        </View>
        </TouchableOpacity>

        {!isReply && isExpanded && replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };

  return (
    // edges=['top'] — bottom inset manuel yönetiliyor (keyboardPad)
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab bar gizlenince içerik tam ekrana iner, klavye için ek güvenlik */}
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.push('/(app)/soz-sende')}
            style={styles.roundBackBtn}
          >
            <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Söz Sende</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={mainComments}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={isCommentsRefetching}
              onRefresh={refetchComments}
              tintColor={themeColors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[themeColors.primary + '15', 'transparent']}
                style={styles.heroGradient}
              />
              <View style={styles.heroContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>HAFTANIN SORUSU</Text>
                </View>
                <Text style={styles.heroTitle}>{question.title}</Text>
                {question.description && (
                  <Text style={styles.heroDesc}>{question.description}</Text>
                )}
                
                <View style={styles.heroFooter}>
                  <View style={authorStyles.container}>
                    <View style={authorStyles.avatar}>
                      <Text style={authorStyles.avatarText}>K</Text>
                    </View>
                    <View>
                      <Text style={authorStyles.label}>Düzenleyen</Text>
                      <Text style={authorStyles.name}>
                        {question.profiles?.username ? `@${question.profiles.username}` : question.profiles?.full_name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="chatbubbles" size={16} color={themeColors.primary} />
                    <Text style={styles.statText}>{comments.length} Yorum</Text>
                  </View>
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => renderComment(item)}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color={themeColors.border} />
              <Text style={styles.emptyText}>Henüz yorum yapılmamış.</Text>
              <Text style={styles.emptySubtext}>İlk düşünceyi sen paylaşmak ister misin?</Text>
            </View>
          }
        />

      </View>

      {/* Footer — KeyboardStickyView klavyenin tam üstüne native olarak yapışır.
          SafeAreaView edges=['top'] olduğu için bottom inset burada elle
          uygulanıyor — aksi halde input, alt navigasyon çubuğu olan
          cihazlarda o çubuğun altına/üstüne biniyordu. Klavye açıkken
          klavyenin kendisi zaten o alanı kapladığı için offset sıfırlanıyor. */}
      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        <View style={styles.footerContainer}>
          {replyTo && (
            <View style={styles.replyBar}>
              <Ionicons name="arrow-undo" size={14} color={themeColors.primary} />
              <Text style={styles.replyBarText} numberOfLines={1}>
                <Text style={{ fontWeight: 'bold' }}>{replyTo.name}</Text> kullanıcısına yanıt veriliyor
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <View style={[
              styles.inputWrapper,
              newComment.length > 0 && { borderColor: themeColors.primary + '60' }
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder={replyTo ? "Yanıtınızı buraya yazın..." : "Düşüncelerinizi paylaşın..."}
                placeholderTextColor={themeColors.textMuted}
                value={newComment}
                onChangeText={(text) => text.length <= 280 && setNewComment(text)}
                multiline
                maxLength={280}
                scrollEnabled={true}
                returnKeyType="default"
                blurOnSubmit={false}
              />
              <View style={styles.counterRow}>
                <Text style={[
                  styles.charCounter,
                  newComment.length >= 250 && { color: newComment.length >= 280 ? themeColors.error : themeColors.warning },
                ]}>
                  {newComment.length}/280
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, (!newComment.trim() || commentMutation.isPending) && styles.sendBtnDisabled]}
              onPress={handleSendComment}
              disabled={!newComment.trim() || commentMutation.isPending}
              activeOpacity={0.8}
            >
              {commentMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginLeft: 2, marginTop: 2 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardStickyView>

      {/* Seçenekler Modalı (Edit/Delete) */}
      <Modal
        visible={optionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setOptionsVisible(false)}
        >
          <View style={styles.optionsContent}>
            <View style={styles.optionsHeader}>
              <View style={styles.optionsIndicator} />
              <Text style={styles.optionsTitle}>Yorum Seçenekleri</Text>
            </View>

            {selectedComment?.user_id === profile?.id && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setOptionsVisible(false);
                  setEditModalVisible(true);
                }}
              >
                <View style={[styles.optionIcon, { backgroundColor: themeColors.primary + '15' }]}>
                  <Ionicons name="pencil-outline" size={20} color={themeColors.primary} />
                </View>
                <Text style={styles.optionText}>Düzenle</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.optionItem, { borderBottomWidth: 0 }]} 
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => {
                  Alert.alert(
                    'Yorumu Sil',
                    'Yorumunuzu silmek istediğinize emin misiniz?',
                    [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => deleteCommentMutation.mutate(selectedComment.id) }
                    ]
                  );
                }, 300);
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: themeColors.error + '15' }]}>
                <Ionicons name="trash-outline" size={20} color={themeColors.error} />
              </View>
              <Text style={[styles.optionText, { color: themeColors.error }]}>Sil</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setOptionsVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Düzenleme Modalı */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editContent}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Yorumu Düzenle</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.editInputWrapper}>
              <TextInput
                style={styles.editInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                maxLength={280}
                autoFocus
                scrollEnabled={true}
              />
              <View style={styles.editCounterRow}>
                <Text style={[styles.charCounter, editContent.length >= 260 && { color: editContent.length >= 280 ? themeColors.error : themeColors.primary }]}>
                  {editContent.length}/280
                </Text>
              </View>
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={() => updateCommentMutation.mutate({ commentId: selectedComment.id, content: editContent })}
                disabled={updateCommentMutation.isPending || !editContent.trim()}
              >
                {updateCommentMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createAuthorStyles = (themeColors: any) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  label: { fontSize: 10, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 13, fontWeight: '700', color: themeColors.textPrimary },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  roundBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  topHeaderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
    letterSpacing: 0.5,
  },
  scrollArea: { paddingBottom: Spacing.lg },
  heroSection: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 200,
  },
  heroContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: themeColors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: themeColors.primary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: themeColors.textPrimary,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  heroDesc: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: themeColors.border + '50',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: themeColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  commentWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border,
  },
  replyWrapper: {
    marginLeft: 28,
    position: 'relative',
  },
  replyConnector: {
    position: 'absolute',
    left: -14,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: themeColors.border,
    borderRadius: 1,
  },
  commentCard: {
    backgroundColor: 'transparent',
  },
  likedCard: {},
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: themeColors.primary,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  selfBadge: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  timeText: {
    fontSize: 11,
    color: themeColors.textMuted,
  },
  likeIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  likesMiniCount: {
    fontSize: 10,
    fontWeight: '800',
    color: themeColors.textMuted,
    marginTop: -2,
  },
  commentText: {
    fontSize: 15,
    color: themeColors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: themeColors.primary + '10',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.primary,
  },
  repliesToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  repliesToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: themeColors.textSecondary,
  },
  popularityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularityText: {
    fontSize: 10,
    fontWeight: '800',
    color: themeColors.success,
  },
  repliesContainer: {
    marginTop: Spacing.sm,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerContainer: {
    backgroundColor: themeColors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  replyBarText: {
    flex: 1,
    fontSize: 12,
    color: themeColors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    minHeight: 44,
  },
  textInput: {
    fontSize: 15,
    color: themeColors.textPrimary,
    paddingTop: 0,
    paddingBottom: 4,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  charCounter: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontWeight: '600',
  },
  readMoreText: {
    color: themeColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: themeColors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  moreBtn: {
    padding: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  optionsIndicator: {
    width: 40,
    height: 4,
    backgroundColor: themeColors.border,
    borderRadius: 2,
    marginBottom: 12,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border + '50',
    gap: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.textPrimary,
  },
  cancelBtn: {
    marginTop: Spacing.lg,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.textSecondary,
  },
  editContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  editInputWrapper: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  editInput: {
    fontSize: 16,
    color: themeColors.textPrimary,
    minHeight: 120,
    maxHeight: 180,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  editCounterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  editActions: {
    marginTop: Spacing.xl,
  },
  saveBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});