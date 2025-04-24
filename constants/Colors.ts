/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.vercel.app/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Thêm các màu mới cho form và profile
    formBackground: '#f9f9f9',
    formBorder: '#ddd',
    formText: '#333',
    formLabel: '#666',
    formPlaceholder: '#888',
    buttonPrimary: '#A1CEDC',
    buttonTextPrimary: '#333',
    buttonDanger: '#ef5350',
    buttonTextDanger: '#ffffff',
    cardBackground: '#ffffff',
    cardBorder: '#e0e0e0',
    userInfoBackground: '#f5f5f5',
    heading: '#1a73e8',
    infoText: '#000000',
    welcomeText: '#333333',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Thêm các màu mới cho form và profile ở chế độ tối
    formBackground: '#2A2D2E',
    formBorder: '#3E4042',
    formText: '#E4E6EB',
    formLabel: '#B0B3B8',
    formPlaceholder: '#999999',
    buttonPrimary: '#4A96C9',
    buttonTextPrimary: '#ffffff',
    buttonDanger: '#E53935',
    buttonTextDanger: '#ffffff',
    cardBackground: '#242526',
    cardBorder: '#3E4042',
    userInfoBackground: '#2A2D2E',
    heading: '#4A96C9',
    infoText: '#E4E6EB',
    welcomeText: '#E4E6EB',
  },
};
