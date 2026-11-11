import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { space, useTheme } from '../../theme';
import { Text } from '../Text';

/** Feed Loader 131:4592 — 16px arc spinner (fg/accent) + Caption fg/muted, padding 8 0 24, gap 10. */
export function FeedLoader() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1);
  }, [r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 360}deg` }] }));
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel={t('home.loadingMore')}>
      <Animated.View style={spin}>
        <Svg width={16} height={16} viewBox="0 0 16 16">
          <Path d="M8 1.5 A6.5 6.5 0 1 1 1.5 8" stroke={color('fg/accent')} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Text variant="Caption" color="fg/muted">{t('home.loadingMore')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[10], paddingTop: space[8], paddingBottom: space[24] },
});
