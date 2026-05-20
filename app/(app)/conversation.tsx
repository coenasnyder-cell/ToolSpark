import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendMessageNotification } from '../../services/notifications';

interface Message {
  id: string;
  senderId: string;
  content: string;
  imageURL?: string;
  createdAt: any;
  read: boolean;
}

export default function ConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversationId, otherUserId, otherUserName } =
    useLocalSearchParams<{
      conversationId: string;
      otherUserId: string;
      otherUserName: string;
    }>();

  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [otherUserPhoto, setOtherUserPhoto] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Deterministic conversation ID from two user IDs
  const getConversationId = (uid1: string, uid2: string) =>
    [uid1, uid2].sort().join('_');

  const resolvedConversationId = conversationId ||
    (user ? getConversationId(user.uid, otherUserId) : '');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Load other user's photo
  useEffect(() => {
    if (!otherUserId) return;
    getDoc(doc(db, 'users', otherUserId)).then((snap) => {
      if (snap.exists()) setOtherUserPhoto(snap.data().photoURL || '');
    });
  }, [otherUserId]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!user || !resolvedConversationId) return;
    updateDoc(doc(db, 'conversations', resolvedConversationId), {
      [`unreadCount.${user.uid}`]: 0,
    }).catch(() => {}); // ignore if doc doesn't exist yet
  }, [resolvedConversationId, user]);

  // Listen to messages
  useEffect(() => {
    if (!resolvedConversationId) return;

    const q = query(
      collection(db, 'conversations', resolvedConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      setMessages(data);
      setLoading(false);
      // Scroll to bottom on new message
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return unsubscribe;
  }, [resolvedConversationId]);

  const sendMessage = async (content: string, imageURL?: string) => {
    if (!user || !otherUserId) return;
    setSending(true);
    try {
      const convId = getConversationId(user.uid, otherUserId);
      const convRef = doc(db, 'conversations', convId);
      const convSnap = await getDoc(convRef);

      // Create conversation doc if it doesn't exist
      if (!convSnap.exists()) {
        const otherSnap = await getDoc(doc(db, 'users', otherUserId));
        const otherData = otherSnap.data();
        await setDoc(convRef, {
          participants: [user.uid, otherUserId],
          participantNames: {
            [user.uid]: user.displayName || 'Member',
            [otherUserId]: otherData?.displayName || 'Member',
          },
          participantPhotos: {
            [user.uid]: user.photoURL || '',
            [otherUserId]: otherData?.photoURL || '',
          },
          lastMessage: content || '📷 Image',
          lastMessageAt: serverTimestamp(),
          unreadCount: {
            [user.uid]: 0,
            [otherUserId]: 1,
          },
        });
      } else {
        // Update existing conversation
        await updateDoc(convRef, {
          lastMessage: content || '📷 Image',
          lastMessageAt: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: increment(1),
        });
      }

      // Add message
      await addDoc(
        collection(db, 'conversations', convId, 'messages'),
        {
          senderId: user.uid,
          content: content || '',
          imageURL: imageURL || '',
          createdAt: serverTimestamp(),
          read: false,
        }
      );

      // Send push notification
      await sendMessageNotification(
        otherUserId,
        user.displayName || 'Someone',
        content || 'Sent an image',
        convId
      );

      setNewMessage('');
    } catch (err) {
      console.log('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `message-images/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        await sendMessage('', downloadURL);
      } catch (err) {
        console.log('Image upload error:', err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.uid;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && item.senderId !== prevMsg?.senderId;

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {/* Other user avatar — only show on first in a group */}
        {!isMe && (
          <View style={styles.messageAvatarSlot}>
            {showAvatar && (
              otherUserPhoto ? (
                <Image
                  source={{ uri: otherUserPhoto }}
                  style={styles.messageAvatar}
                />
              ) : (
                <View style={styles.messageAvatarFallback}>
                  <Text style={styles.messageAvatarText}>
                    {(otherUserName as string)?.charAt(0)?.toUpperCase() || 'M'}
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {item.imageURL ? (
            <Image
              source={{ uri: item.imageURL }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.content}
            </Text>
          )}
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 44}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {otherUserPhoto ? (
            <Image
              source={{ uri: otherUserPhoto }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>
                {(otherUserName as string)?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
          )}
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Say hi to {otherUserName} 👋
            </Text>
          </View>
        }
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color={Colors.text3} />
          ) : (
            <Ionicons name="image-outline" size={22} color={Colors.text3} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor={Colors.text3}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={() => sendMessage(newMessage.trim())}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <Ionicons name="send" size={16} color={Colors.bg} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingTop: 60,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 0,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.bg,
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.gold,
  },
  headerRight: {
    width: 60,
  },
  messagesList: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
    gap: Layout.sm,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Layout.xs,
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatarSlot: {
    width: 28,
    marginRight: Layout.xs,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.bg,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: Layout.radius,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
  },
  bubbleMe: {
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: Typography.base,
    color: Colors.text,
    lineHeight: Typography.base * 1.4,
  },
  bubbleTextMe: {
    color: Colors.bg,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: Layout.radiusSm,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.text3,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: Colors.bg,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.xxl,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    paddingBottom: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Layout.sm,
  },
  imageButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    fontSize: Typography.base,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});