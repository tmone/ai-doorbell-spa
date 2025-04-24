import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTranslation } from 'react-i18next';
import { availableLanguages, getLanguageNameByCode, changeLanguage } from '@/constants/i18n';

type LanguageSelectorProps = {
  compact?: boolean;
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  
  const currentLanguage = i18n.language || 'en';
  const currentLanguageName = getLanguageNameByCode(currentLanguage);
  
  // Get theme colors
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const itemActiveColor = useThemeColor({}, 'primaryLight');
  const buttonColor = useThemeColor({}, 'buttonPrimary');
  const textColor = useThemeColor({}, 'text');
  const modalBgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'cardBorder');
  
  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setModalVisible(false);
  };
  
  return (
    <View style={styles.container}>
      {!compact && (
        <ThemedText style={styles.label}>
          {t('language.current', { language: currentLanguageName })}
        </ThemedText>
      )}
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={() => setModalVisible(true)}
      >
        <ThemedText style={styles.buttonText}>
          {compact ? currentLanguageName : t('language.select')}
        </ThemedText>
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <ThemedView 
            style={[styles.modalView, { backgroundColor: modalBgColor, borderColor }]}
          >
            <ThemedText type="title" style={styles.modalTitle}>
              {t('language.select')}
            </ThemedText>
            
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    item.code === currentLanguage && { backgroundColor: itemActiveColor }
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <ThemedText style={[styles.languageText, { color: textColor }]}>
                    {item.name}
                  </ThemedText>
                  {item.code === currentLanguage && (
                    <ThemedText style={styles.activeIndicator}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: buttonColor }]}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={styles.buttonText}>
                {t('common.close')}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20,
  },
  list: {
    width: '100%',
    marginVertical: 10,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  languageText: {
    fontSize: 16,
  },
  activeIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});