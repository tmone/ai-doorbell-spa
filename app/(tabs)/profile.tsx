import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, View, SafeAreaView, ScrollView, Platform, Switch, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { changeLanguage } from '@/constants/i18n';

// Khóa để lưu trữ thông tin người dùng hiện tại
const CURRENT_USER_STORAGE_KEY = '@ai_doorbell_current_user';

interface User {
  email: string;
  password: string;
  displayName: string;
  employeeId: string;
  fullName: string;
  department: 'SM' | 'MS';
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(i18n.language === 'en');

  // Lấy các màu theo theme hiện tại
  const backgroundColor = useThemeColor({}, 'background');
  const cardBgColor = useThemeColor({}, 'cardBackground');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const headingColor = useThemeColor({}, 'heading');
  const welcomeTextColor = useThemeColor({}, 'welcomeText');
  const infoTextColor = useThemeColor({}, 'infoText');
  const userInfoBgColor = useThemeColor({}, 'userInfoBackground');
  const buttonPrimaryColor = useThemeColor({}, 'buttonPrimary');
  const buttonDangerColor = useThemeColor({}, 'buttonDanger');
  const buttonTextDangerColor = useThemeColor({}, 'buttonTextDanger');
  const textColor = useThemeColor({}, 'text');
  const sectionBgColor = useThemeColor({}, 'cardBackground');

  // Tải thông tin người dùng từ AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } else {
          // Nếu không có dữ liệu người dùng, chuyển hướng về trang Home
          router.replace('/');
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Xử lý đăng xuất
  const handleSignOut = async () => {
    try {
      // Xóa thông tin người dùng khỏi AsyncStorage
      await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      Alert.alert(t('common.success'), t('auth.signedOut'));
      router.replace('/');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert(t('common.error'), t('error.signOut'));
    }
  };

  // Xử lý thay đổi ngôn ngữ
  const toggleLanguage = async (value: boolean) => {
    const newLanguage = value ? 'en' : 'vi';
    await changeLanguage(newLanguage);
    setIsEnglish(value);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            {t('profile.loading')}
          </ThemedText>
        </ThemedView>
      );
    }

    if (!user) {
      return (
        <ThemedView style={styles.contentContainer}>
          <ThemedText style={[styles.errorText, { color: textColor }]}>
            {t('profile.error')}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: buttonPrimaryColor }]} 
            onPress={() => router.replace('/')}
          >
            <ThemedText style={styles.buttonText}>
              {t('profile.goToLogin')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        <ThemedView style={styles.profileHeader}>
          <ThemedText type="title" style={[styles.headerTitle, { color: headingColor }]}>
            {t('profile.title')}
          </ThemedText>
        </ThemedView>
        
        <ThemedText type="subtitle" style={[styles.welcomeText, { color: welcomeTextColor }]}>
          {t('profile.welcome', { name: user.fullName || user.email })}
        </ThemedText>
        
        <ThemedView style={[styles.userInfoContainer, { 
          backgroundColor: userInfoBgColor,
          borderColor: cardBorderColor 
        }]}>
          <ThemedText style={[styles.infoText, { color: infoTextColor }]}>
            {t('profile.employeeId', { id: user.employeeId })}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: infoTextColor }]}>
            {t('profile.department.label', { 
              department: t(`profile.department.${user.department}`)
            })}
          </ThemedText>
          <ThemedText style={[styles.infoText, { color: infoTextColor }]}>
            {t('profile.email', { email: user.email })}
          </ThemedText>
        </ThemedView>
        
        {/* Cấu hình (Configuration) section */}
        <ThemedView style={[styles.sectionContainer, { 
          backgroundColor: sectionBgColor,
          borderColor: cardBorderColor 
        }]}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: headingColor }]}>
            {t('profile.configuration')}
          </ThemedText>
          
          {/* Language toggle with flag emojis */}
          <View style={styles.settingRow}>
            <ThemedText style={[styles.settingLabel, { color: textColor }]}>
              {t('profile.language')}
            </ThemedText>
            <View style={styles.toggleContainer}>
              <Text style={[styles.flagEmoji, !isEnglish && styles.activeFlagEmoji]}>
                🇻🇳
              </Text>
              <Switch
                value={isEnglish}
                onValueChange={toggleLanguage}
                trackColor={{ false: '#d4d4d4', true: '#d4d4d4' }}
                thumbColor={isEnglish ? buttonPrimaryColor : buttonPrimaryColor}
                ios_backgroundColor="#d4d4d4"
                style={styles.toggle}
              />
              <Text style={[styles.flagEmoji, isEnglish && styles.activeFlagEmoji]}>
                🇬🇧
              </Text>
            </View>
          </View>
        </ThemedView>
        
        <TouchableOpacity 
          style={[styles.signoutButton, { backgroundColor: buttonDangerColor }]} 
          onPress={handleSignOut}
        >
          <ThemedText style={[styles.signoutButtonText, { color: buttonTextDangerColor }]}>
            {t('profile.signOut')}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    marginVertical: 15,
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 15 : 5,
  },
  headerTitle: {
    fontSize: 26,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userInfoContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signoutButton: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    marginTop: 30,
    gap: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  subtitleText: {
  },
  descriptionText: {
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  // New styles for the configuration section
  sectionContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggle: {
    marginHorizontal: 8,
  },
  flagEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  activeFlagEmoji: {
    opacity: 1,
  },
});