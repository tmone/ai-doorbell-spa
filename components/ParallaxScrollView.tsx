import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, StatusBar, View, Image, Text } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  appName?: string;
  appVersion?: string;
  showDepartmentLogos?: boolean;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  appName,
  appVersion,
  showDepartmentLogos = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}>
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}>
          {headerImage}
          {appName && (
            <View style={styles.appNameContainer}>
              <View style={styles.appNameWithVersion}>
                <ThemedText type="title" style={styles.appName}>
                  {appName}
                </ThemedText>
                {appVersion && (
                  <ThemedText style={styles.appVersion}>
                    (v{appVersion})
                  </ThemedText>
                )}
              </View>
              {showDepartmentLogos && (
                <View style={styles.departmentLogos}>
                  <Image 
                    source={require('@/assets/images/stepmedia.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                  <Image 
                    source={require('@/assets/images/mediastep.png')} 
                    style={styles.logo} 
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  appNameContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appNameWithVersion: {
    flexDirection: 'row',
    alignItems: 'baseline', // Thay đổi từ 'flex-end' sang 'baseline' để căn chỉnh dòng text
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 15, // Tăng đổ bóng để nổi bật hơn trên nền
  },
  appVersion: {
    fontSize: 12,
    marginLeft: 4,
    marginBottom: 0, // Loại bỏ marginBottom để text ngang hàng với baseline của tên ứng dụng
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  departmentLogos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});
