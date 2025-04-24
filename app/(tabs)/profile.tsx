import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Platform, 
  Switch, 
  Text, 
  Modal,
  Image,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';
import { changeLanguage } from '@/constants/i18n';
import { IconSymbol } from '@/components/ui/IconSymbol';
import FaceCapture from '@/components/face/FaceCapture';

// Khóa để lưu trữ thông tin người dùng hiện tại
const CURRENT_USER_STORAGE_KEY = '@ai_doorbell_current_user';
// Khóa để lưu trữ khuôn mặt đã đăng ký
const REGISTERED_FACES_STORAGE_KEY = '@ai_doorbell_registered_faces';

// Interface mô tả thông tin khuôn mặt đã đăng ký
interface RegisteredFace {
  id: string;
  name: string;
  imageUri: string;
  angles?: Array<{ uri: string, angle: string }>;
  createdAt: number;
}

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
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredFace[]>([]);
  const [faceModalVisible, setFaceModalVisible] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');
  const [selectedFaceImage, setSelectedFaceImage] = useState<string | null>(null);
  const [showFaceList, setShowFaceList] = useState(false);
  const [faceCaptureMode, setFaceCaptureMode] = useState(false);
  const [capturedFaceAngles, setCapturedFaceAngles] = useState<Array<{uri: string, angle: string}>>([]);

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
  const itemActiveColor = useThemeColor({}, 'primaryLight');
  const modalBgColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'cardBorder');

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
    loadRegisteredFaces();
  }, []);

  // Tải thông tin khuôn mặt đã đăng ký
  const loadRegisteredFaces = async () => {
    try {
      const facesJson = await AsyncStorage.getItem(REGISTERED_FACES_STORAGE_KEY);
      if (facesJson) {
        const facesData = JSON.parse(facesJson);
        setRegisteredFaces(facesData);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin khuôn mặt:', error);
    }
  };

  // Xử lý lưu khuôn mặt mới
  const handleSaveFace = async () => {
    if (!newFaceName || capturedFaceAngles.length === 0) {
      return;
    }

    try {
      const mainImageUri = capturedFaceAngles.find(img => img.angle === 'front')?.uri || capturedFaceAngles[0].uri;
      
      if (!mainImageUri) {
        throw new Error('No face image available');
      }

      const newFace: RegisteredFace = {
        id: Date.now().toString(),
        name: newFaceName,
        imageUri: mainImageUri,
        angles: capturedFaceAngles,
        createdAt: Date.now(),
      };

      const updatedFaces = [...registeredFaces, newFace];
      await AsyncStorage.setItem(
        REGISTERED_FACES_STORAGE_KEY,
        JSON.stringify(updatedFaces)
      );

      setRegisteredFaces(updatedFaces);
      setFaceModalVisible(false);
      setFaceCaptureMode(false);
      setNewFaceName('');
      setSelectedFaceImage(null);
      setCapturedFaceAngles([]);

      Alert.alert(
        t('common.success'),
        t('profile.faceRegisteredSuccess'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Lỗi khi lưu khuôn mặt:', error);
      Alert.alert(
        t('common.error'),
        t('error.saveFaceFailed'),
        [{ text: t('common.ok') }]
      );
    }
  };

  // Handle face capture completion
  const handleFaceCaptureComplete = (images: Array<{uri: string, angle: string}>) => {
    setCapturedFaceAngles(images);
    setFaceCaptureMode(false);
    
    // If there are captured images, set the front image as the main image
    const frontImage = images.find(img => img.angle === 'front');
    if (frontImage) {
      setSelectedFaceImage(frontImage.uri);
    } else if (images.length > 0) {
      setSelectedFaceImage(images[0].uri);
    }
  };

  // Handle face capture cancellation
  const handleFaceCaptureCancel = () => {
    setFaceCaptureMode(false);
  };

  // Xử lý xóa khuôn mặt
  const handleDeleteFace = (faceId: string) => {
    Alert.alert(
      t('profile.deleteFaceTitle'),
      t('profile.deleteFaceConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFaces = registeredFaces.filter(face => face.id !== faceId);
              await AsyncStorage.setItem(
                REGISTERED_FACES_STORAGE_KEY,
                JSON.stringify(updatedFaces)
              );
              setRegisteredFaces(updatedFaces);
            } catch (error) {
              console.error('Lỗi khi xóa khuôn mặt:', error);
              Alert.alert(
                t('common.error'),
                t('error.deleteFaceFailed'),
                [{ text: t('common.ok') }]
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

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
            <View style={styles.settingLabelContainer}>
              <IconSymbol 
                name="globe" 
                color={textColor} 
                size={24} 
                style={styles.settingIcon}
              />
              <ThemedText style={[styles.settingLabel, { color: textColor }]}>
                {t('profile.language')}
              </ThemedText>
            </View>
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

          {/* Face Registration Section */}
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowFaceList(!showFaceList)}
          >
            <View style={styles.settingLabelContainer}>
              <IconSymbol 
                name="face.dashed" 
                color={textColor} 
                size={24} 
                style={styles.settingIcon}
              />
              <ThemedText style={[styles.settingLabel, { color: textColor }]}>
                {t('profile.faceRegistration')}
              </ThemedText>
            </View>
            <View style={styles.badgeContainer}>
              <ThemedText style={styles.badgeText}>
                {registeredFaces.length}
              </ThemedText>
              <IconSymbol 
                name="chevron.right" 
                color={textColor} 
                size={20} 
              />
            </View>
          </TouchableOpacity>
          
          {showFaceList && (
            <View style={styles.faceListContainer}>
              {registeredFaces.length === 0 ? (
                <ThemedText style={[styles.noFacesText, { color: textColor }]}>
                  {t('profile.noFacesRegistered')}
                </ThemedText>
              ) : (
                registeredFaces.map(face => (
                  <View key={face.id} style={styles.faceItem}>
                    {face.imageUri ? (
                      <Image 
                        source={{ uri: face.imageUri }} 
                        style={styles.faceImage} 
                      />
                    ) : (
                      <View style={[styles.faceImagePlaceholder, { backgroundColor: itemActiveColor }]}>
                        <IconSymbol name="face.dashed" color={textColor} size={24} />
                      </View>
                    )}
                    <ThemedText style={styles.faceName}>{face.name}</ThemedText>
                    <TouchableOpacity 
                      style={[styles.deleteButton, { backgroundColor: buttonDangerColor }]}
                      onPress={() => handleDeleteFace(face.id)}
                    >
                      <ThemedText style={{ color: '#fff' }}>×</ThemedText>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              
              <TouchableOpacity 
                style={[styles.addFaceButton, { backgroundColor: buttonPrimaryColor }]}
                onPress={() => {
                  setFaceModalVisible(true);
                  setNewFaceName('');
                  setSelectedFaceImage(null);
                  setCapturedFaceAngles([]);
                  // Immediately go to face capture mode
                  setFaceCaptureMode(true);
                }}
              >
                <IconSymbol name="plus.circle" color="#fff" size={20} style={styles.addFaceIcon} />
                <ThemedText style={styles.addFaceText}>
                  {t('profile.addNewFace')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
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
      
      {/* Modal for adding a new face */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={faceModalVisible}
        onRequestClose={() => setFaceModalVisible(false)}
      >
        {faceCaptureMode ? (
          <FaceCapture 
            onComplete={handleFaceCaptureComplete} 
            onCancel={handleFaceCaptureCancel} 
          />
        ) : (
          <View style={styles.centeredModalView}>
            <ThemedView style={[styles.modalView, { backgroundColor: modalBgColor, borderColor }]}>
              <ThemedText type="title" style={styles.modalTitle}>
                {t('profile.registerNewFace')}
              </ThemedText>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>{t('profile.faceName')}</ThemedText>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.12)' : '#f5f5f5',
                    color: textColor,
                    borderColor: borderColor
                  }]}
                  placeholder={t('profile.faceNamePlaceholder')}
                  placeholderTextColor="#888"
                  value={newFaceName}
                  onChangeText={setNewFaceName}
                />
              </View>
              
              <View style={styles.imagePickerContainer}>
                <ThemedText style={styles.inputLabel}>{t('profile.faceImage')}</ThemedText>
                
                {selectedFaceImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image source={{ uri: selectedFaceImage }} style={styles.selectedImage} />
                    <TouchableOpacity 
                      style={[styles.changeImageButton, { backgroundColor: buttonPrimaryColor }]}
                      onPress={() => setFaceCaptureMode(true)}
                    >
                      <IconSymbol name="camera.fill" color="#fff" size={16} style={styles.buttonIcon} />
                      <ThemedText style={styles.buttonText}>
                        {t('profile.changeImage')}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.imageOptionButton, { 
                      backgroundColor: Platform.OS === 'ios' ? 'rgba(142, 142, 147, 0.12)' : '#f5f5f5',
                      borderColor: borderColor,
                      width: '100%'
                    }]}
                    onPress={() => setFaceCaptureMode(true)}
                  >
                    <IconSymbol name="camera.fill" color={textColor} size={32} />
                    <ThemedText style={{ color: textColor, marginTop: 8 }}>
                      {t('profile.addNewFace')}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                
                {/* Show captured angles if available */}
                {capturedFaceAngles.length > 0 && (
                  <View style={styles.capturedAnglesContainer}>
                    <ThemedText style={styles.capturedAnglesTitle}>
                      {t('profile.captureProgress', { 
                        completed: capturedFaceAngles.length, 
                        total: capturedFaceAngles.length 
                      })}
                    </ThemedText>
                    <View style={styles.anglesPreviewContainer}>
                      {capturedFaceAngles.map((image, index) => (
                        <View key={image.angle} style={styles.anglePreviewItem}>
                          <Image source={{ uri: image.uri }} style={styles.anglePreviewImage} />
                          <ThemedText style={styles.anglePreviewLabel}>
                            {t(`profile.faceAngle.${image.angle}`)}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, { borderColor }]}
                  onPress={() => {
                    setFaceModalVisible(false);
                    setNewFaceName('');
                    setSelectedFaceImage(null);
                    setCapturedFaceAngles([]);
                  }}
                >
                  <ThemedText>
                    {t('common.cancel')}
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.saveButton, 
                    { 
                      backgroundColor: buttonPrimaryColor,
                      opacity: (!newFaceName || capturedFaceAngles.length === 0) ? 0.5 : 1
                    }
                  ]}
                  disabled={!newFaceName || capturedFaceAngles.length === 0}
                  onPress={handleSaveFace}
                >
                  <ThemedText style={{ color: '#fff' }}>
                    {t('common.save')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        )}
      </Modal>
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
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  faceListContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  noFacesText: {
    textAlign: 'center',
    color: Colors.light.text,
  },
  faceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  faceImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  faceImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
    height: 50,
  },
  addFaceIcon: {
    marginRight: 10,
  },
  addFaceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  centeredModalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 15,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  imagePickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 10,
  },
  imageOptionButton: {
    width: '45%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 5,
  },
  capturedAnglesContainer: {
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  capturedAnglesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  anglesPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  anglePreviewItem: {
    width: 70,
    alignItems: 'center',
    margin: 5,
  },
  anglePreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  anglePreviewLabel: {
    fontSize: 12,
    marginTop: 5,
  },
  imagePickerButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
});