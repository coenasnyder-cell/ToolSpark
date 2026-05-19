import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import FormInput from '../../components/Shared/FormInput';

const STATUS_OPTIONS = ['upcoming', 'live', 'completed', 'cancelled'];

export default function AdminEventEditScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const isEditing = !!eventId;

  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventLocation, setEventLocation] = useState('online');
  const [eventURL, setEventURL] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [isRecurring, setIsRecurring] = useState(false);
  const [eventLength, setEventLength] = useState('60');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const snap = await getDoc(doc(db, 'Events', eventId!));
      if (snap.exists()) {
        const data = snap.data();
        setEventTitle(data.eventTitle || '');
        setEventStart(data.eventStart || '');
        setEventLocation(data.eventLocation || 'online');
        setEventURL(data.eventURL || '');
        setDescription(data.description || '');
        setStatus(data.status || 'upcoming');
        setIsRecurring(data.isRecurring || false);
        setEventLength(String(data.eventLength || 60));
      }
    } catch (err) {
      console.log('Load event error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('Required', 'Please enter an event title.');
      return;
    }
    if (!eventStart.trim()) {
      Alert.alert('Required', 'Please enter the event date/time.');
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        eventTitle: eventTitle.trim(),
        eventStart: eventStart.trim(),
        eventLocation: eventLocation.trim(),
        eventURL: eventURL.trim(),
        description: description.trim(),
        status,
        isRecurring,
        eventLength: parseInt(eventLength) || 60,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'Events', eventId!), eventData);
        Alert.alert('Saved', 'Event updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await addDoc(collection(db, 'Events'), {
          ...eventData,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Added', 'Event added successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save event.');
      console.log('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Event' : 'Add Event'}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.gold} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Event Details</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="e.g. ToolSpark Training Session"
              placeholderTextColor={Colors.text3}
              maxLength={100}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Date & Time *</Text>
            <TextInput
              style={styles.input}
              value={eventStart}
              onChangeText={setEventStart}
              placeholder="e.g. May 26, 2026 12:00 PM CT"
              placeholderTextColor={Colors.text3}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder="online"
              placeholderTextColor={Colors.text3}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={eventLength}
              onChangeText={setEventLength}
              placeholder="60"
              placeholderTextColor={Colors.text3}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="What will members learn or do?"
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        {/* Join link */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Join Link</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Zoom / Meeting URL</Text>
            <TextInput
              style={styles.input}
              value={eventURL}
              onChangeText={setEventURL}
              placeholder="https://zoom.us/j/..."
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.fieldHint}>
              Paste just the Zoom meeting URL not the full invitation
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Status</Text>
            <FormInput
              label=""
              value={status}
              onChangeText={setStatus}
              type="picker"
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>
                Recurring Event
              </Text>
              <Text style={styles.settingDesc}>
                This event repeats regularly
              </Text>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{
                false: Colors.border,
                true: Colors.gold,
              }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveFullButton,
            saving && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.saveFullButtonText}>
              {isEditing ? 'Save Changes' : 'Add Event'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingTop: 56,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: '#F5F3EF',
  },
  saveButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingLeft: Layout.md,
  },
  saveButtonText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  content: {
    paddingBottom: Layout.xl,
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.md,
    paddingTop: Layout.md,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.md,
    paddingBottom: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fieldBlock: {
    marginBottom: Layout.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text2,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: Layout.buttonHeight,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  fieldHint: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
    gap: Layout.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  saveFullButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: Layout.md,
    marginTop: Layout.md,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  saveFullButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
});