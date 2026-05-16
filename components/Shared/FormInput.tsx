import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;
  editable?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  type?: 'text' | 'picker';
  options?: string[];
  placeholder?: string;
  secureTextEntry?: boolean;
  dropdownMaxHeight?: number;
  maxLength?: number;
};

export default function FormInput({
  label,
  value,
  onChangeText,
  required,
  editable = true,
  multiline = false,
  keyboardType = 'default',
  type = 'text',
  options = [],
  placeholder,
  secureTextEntry = false,
  dropdownMaxHeight = 280,
  maxLength,
}: FormInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = useMemo(
    () => options.map((opt) => ({ label: opt, value: opt })),
    [options]
  );
  const selectedLabel = value || '';

  const handleSelect = (nextValue: string) => {
    onChangeText(nextValue);
    setPickerOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}{' '}
        {required && <Text style={styles.required}>*</Text>}
      </Text>

      {type === 'picker' ? (
        <>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              pickerOpen && styles.pickerButtonOpen,
              !editable && styles.pickerDisabled,
            ]}
            onPress={() => {
              if (editable) setPickerOpen(true);
            }}
            activeOpacity={0.85}
            disabled={!editable}
          >
            <Text
              style={[
                styles.pickerButtonText,
                !selectedLabel && styles.pickerPlaceholder,
                !editable && styles.disabledText,
              ]}
              numberOfLines={1}
            >
              {selectedLabel || placeholder || 'Select...'}
            </Text>
            <Text style={styles.chevron}>
              {pickerOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          <Modal
            visible={pickerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setPickerOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setPickerOpen(false)}
              />
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <TouchableOpacity
                    onPress={() => setPickerOpen(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalClose}>Close</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator
                  style={{ maxHeight: dropdownMaxHeight }}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionRow,
                          isSelected && styles.selectedItemContainer,
                        ]}
                        onPress={() => handleSelect(item.value)}
                        activeOpacity={0.85}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.selectedItemText,
                        ]}>
                          {item.label}
                        </Text>
                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => (
                    <View style={styles.optionDivider} />
                  )}
                />
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            !editable && styles.disabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={Colors.text3}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  required: {
    color: Colors.coral,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    fontSize: Typography.base,
    backgroundColor: Colors.surface,
    color: Colors.text,
    minHeight: Layout.buttonHeight,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  disabled: {
    backgroundColor: Colors.surface2,
    color: Colors.text3,
  },
  disabledText: {
    color: Colors.text3,
  },
  pickerButton: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Layout.radiusSm,
    minHeight: Layout.buttonHeight,
    backgroundColor: Colors.surface,
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonOpen: {
    borderColor: Colors.gold,
  },
  pickerDisabled: {
    backgroundColor: Colors.surface2,
    opacity: 0.75,
  },
  pickerButtonText: {
    fontSize: Typography.base,
    color: Colors.text,
    flex: 1,
    marginRight: Layout.sm,
  },
  pickerPlaceholder: {
    color: Colors.text3,
  },
  chevron: {
    fontSize: 11,
    color: Colors.text2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Layout.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLg,
    paddingVertical: Layout.md,
    paddingHorizontal: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Layout.sm,
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
  },
  modalClose: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.gold,
  },
  optionRow: {
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    borderRadius: Layout.radiusSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Layout.buttonHeight,
  },
  optionDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  optionText: {
    fontSize: Typography.base,
    color: Colors.text,
  },
  selectedItemContainer: {
    backgroundColor: Colors.goldDim,
  },
  selectedItemText: {
    color: Colors.gold,
    fontWeight: '700',
  },
  checkmark: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: Typography.base,
  },
});