import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, space, useTheme, type ColorToken } from '../theme';
import { Text } from './Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Sheet surface — 7.3 uses bg/default, 7.4 / 8.2c bg/subtle. */
  surface?: ColorToken;
  /** Grabber colour (7.3 bg/emphasis · 7.4 border/default). */
  grabber?: ColorToken;
  gap?: number;
  /** Limit height and scroll the content (long option lists). */
  maxHeightRatio?: number;
  children: ReactNode;
};

/** Shared bottom sheet — Dim (overlay/scrim) · radius 28 top · grabber · Title/M · content. */
export function BottomSheet({ visible, onClose, title, surface = 'bg/subtle', grabber = 'border/default', gap = space[20], maxHeightRatio, children }: Props) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const body = (
    <>
      {title ? <Text variant="Title/M">{title}</Text> : null}
      {children}
    </>
  );
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible ? (
        <>
          <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: color('overlay/scrim') }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
            <Animated.View
              entering={SlideInDown.duration(260)}
              style={[styles.sheet, { backgroundColor: color(surface), paddingBottom: Math.max(insets.bottom, space[20]), gap }, maxHeightRatio ? { maxHeight: `${maxHeightRatio * 100}%` } : null]}
            >
              <View style={styles.grabWrap}>
                <View style={[styles.grabber, { backgroundColor: color(grabber) }]} />
              </View>
              {maxHeightRatio ? <ScrollView contentContainerStyle={{ gap }} showsVerticalScrollIndicator={false}>{body}</ScrollView> : body}
            </Animated.View>
          </KeyboardAvoidingView>
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: space[10], paddingHorizontal: space[20] },
  grabWrap: { alignItems: 'center' },
  grabber: { width: 36, height: 5, borderRadius: radius.full },
});
