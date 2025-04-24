import { Image, StyleSheet, Platform, TextInput, TouchableOpacity, Alert, View, Picker } from 'react-native';
import { useState, useEffect } from 'react';
// Import only the firebase instance
import { firebase } from '@/constants/firebaseConfig';
// Import AsyncStorage để lưu trữ thông tin người dùng bền vững
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next'; // Thêm import cho i18n

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Khóa để lưu trữ dữ liệu trong AsyncStorage
const USERS_STORAGE_KEY = '@ai_doorbell_users';
const CURRENT_USER_STORAGE_KEY = '@ai_doorbell_current_user';

// Định nghĩa các loại phòng ban
type Department = 'SM' | 'MS';

// Mô phỏng cơ sở dữ liệu người dùng
interface User {
  email: string;
  password: string;
  displayName: string;
  employeeId: string;    // Mã nhân viên
  fullName: string;      // Tên nhân viên
  department: Department; // Phòng ban
}

export default function HomeScreen() {
  const { t } = useTranslation(); // Khởi tạo hook i18n
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  
  // Thêm trạng thái cho các trường mới
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState<Department>('SM');

  // Tải dữ liệu người dùng từ AsyncStorage khi ứng dụng khởi động
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        // Tải danh sách người dùng
        const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (usersJson) {
          const parsedUsers = JSON.parse(usersJson);
          setRegisteredUsers(parsedUsers);
        }
        
        // Tải thông tin người dùng hiện tại (nếu đã đăng nhập)
        const currentUserJson = await AsyncStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (currentUserJson) {
          const parsedUser = JSON.parse(currentUserJson);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu người dùng:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Lưu danh sách người dùng vào AsyncStorage
  const saveUsers = async (users: User[]) => {
    try {
      const usersJson = JSON.stringify(users);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, usersJson);
      setRegisteredUsers(users);
    } catch (error) {
      console.error('Lỗi khi lưu danh sách người dùng:', error);
    }
  };

  // Lưu thông tin người dùng hiện tại vào AsyncStorage
  const saveCurrentUser = async (currentUser: User | null) => {
    try {
      if (currentUser) {
        const userJson = JSON.stringify(currentUser);
        await AsyncStorage.setItem(CURRENT_USER_STORAGE_KEY, userJson);
      } else {
        // Xóa thông tin người dùng khi đăng xuất
        await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Lỗi khi lưu thông tin người dùng hiện tại:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.requiredFields'));
      return;
    }
    
    try {
      if (isSignUp) {
        // Kiểm tra các trường bắt buộc khi đăng ký
        if (!employeeId || !fullName) {
          Alert.alert(t('common.error'), t('auth.requiredSignUpFields'));
          return;
        }
        
        // Kiểm tra xem email đã được sử dụng chưa
        if (registeredUsers.some(u => u.email === email)) {
          Alert.alert(t('common.error'), t('auth.emailExists'));
          return;
        }
        
        // Kiểm tra xem mã nhân viên đã được sử dụng chưa
        if (registeredUsers.some(u => u.employeeId === employeeId)) {
          Alert.alert(t('common.error'), t('auth.employeeIdExists'));
          return;
        }
        
        // Tạo người dùng mới
        const newUser: User = {
          email: email,
          password: password, // Trong thực tế nên mã hóa mật khẩu
          displayName: email.split('@')[0],
          employeeId: employeeId,
          fullName: fullName,
          department: department,
        };
        
        // Cập nhật danh sách người dùng
        const updatedUsers = [...registeredUsers, newUser];
        await saveUsers(updatedUsers);
        
        // Đăng nhập người dùng mới
        await saveCurrentUser(newUser);
        
        // Reset các trường nhập liệu
        setEmail('');
        setPassword('');
        setEmployeeId('');
        setFullName('');
        setDepartment('SM');
        
        Alert.alert(t('common.success'), t('auth.signUpSuccess'));
      } else {
        // Tìm người dùng với email đã nhập
        const foundUser = registeredUsers.find(u => u.email === email);
        
        if (!foundUser) {
          Alert.alert(t('common.error'), t('auth.userNotFound'));
          return;
        }
        
        // Kiểm tra mật khẩu
        if (foundUser.password !== password) {
          Alert.alert(t('common.error'), t('auth.wrongPassword'));
          return;
        }
        
        // Đăng nhập thành công
        await saveCurrentUser(foundUser);
        
        // Reset các trường nhập liệu
        setEmail('');
        setPassword('');
        
        Alert.alert(t('common.success'), t('auth.signInSuccess'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('auth.error'));
    }
  };

  const handleSignOut = async () => {
    try {
      await saveCurrentUser(null);
      Alert.alert(t('common.success'), t('home.signOutSuccess'));
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('error.signOut'));
    }
  };

  // Hiển thị nội dung tùy thuộc vào trạng thái đăng nhập
  const renderContent = () => {
    if (user) {
      return (
        <ThemedView style={styles.authContainer}>
          <ThemedText type="subtitle">{t('home.welcome', { name: user.fullName || user.email })}</ThemedText>
          
          {/* Nội dung chính của ứng dụng sau khi đăng nhập */}
          <ThemedView style={styles.welcomeContainer}>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title">{t('home.title')}</ThemedText>
              <HelloWave />
            </ThemedView>
            
            <ThemedView style={styles.stepContainer}>
              <ThemedText type="subtitle">{t('home.subtitle')}</ThemedText>
              <ThemedText>
                {t('home.description')}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      );
    } else {
      return (
        <ThemedView style={styles.authContainer}>
          <ThemedText type="title">{isSignUp ? t('auth.signUp') : t('auth.signIn')}</ThemedText>
          
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          {/* Hiển thị các trường bổ sung khi đăng ký */}
          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('auth.employeeId')}
                placeholderTextColor="#888"
                value={employeeId}
                onChangeText={setEmployeeId}
              />
              
              <TextInput
                style={styles.input}
                placeholder={t('auth.fullName')}
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
              />
              
              <ThemedView style={styles.pickerContainer}>
                <ThemedText>{t('auth.department')}</ThemedText>
                <View style={styles.picker}>
                  <TouchableOpacity 
                    style={[styles.departmentButton, department === 'SM' && styles.departmentButtonActive]} 
                    onPress={() => setDepartment('SM')}
                  >
                    <ThemedText style={department === 'SM' ? styles.departmentTextActive : styles.departmentText}>
                      {t('auth.SM')}
                    </ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.departmentButton, department === 'MS' && styles.departmentButtonActive]} 
                    onPress={() => setDepartment('MS')}
                  >
                    <ThemedText style={department === 'MS' ? styles.departmentTextActive : styles.departmentText}>
                      {t('auth.MS')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            </>
          )}
          
          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <ThemedText style={styles.buttonText}>
              {isSignUp ? t('auth.signUpButton') : t('auth.signInButton')}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <ThemedText style={styles.switchText}>
              {isSignUp ? t('auth.switchToSignIn') : t('auth.switchToSignUp')}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      );
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/banner.png')}
          style={styles.reactLogo}
        />
      }>
      {renderContent()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  // Thêm styles mới cho phần Auth
  authContainer: {
    padding: 16,
    gap: 16,
  },
  welcomeContainer: {
    marginTop: 20,
    gap: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  authButton: {
    backgroundColor: '#A1CEDC',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  switchText: {
    textAlign: 'center',
    color: '#A1CEDC',
    marginTop: 8,
  },
  // Styles mới cho các trường bổ sung
  pickerContainer: {
    marginVertical: 10,
  },
  picker: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  departmentButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f9f9f9',
  },
  departmentButtonActive: {
    backgroundColor: '#A1CEDC',
    borderColor: '#7aafc0',
  },
  departmentText: {
    color: '#666',
  },
  departmentTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  userInfoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    gap: 8,
  },
});
