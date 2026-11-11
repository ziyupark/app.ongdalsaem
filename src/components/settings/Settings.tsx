import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { gradients, radius, space, useTheme, type ColorToken } from '../../theme';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { TopBar } from '../TopBar';

/** 9.x screen frame — bg/subtle, TopBar (Title/S), content pt 12 px 20, groups gap 24. */
export function SettingsScreen({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const { color } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: color('bg/subtle') }]}>
      <TopBar title={title} onBack={() => router.back()} backLabel={t('common.back')} />
      <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[24] + (footer ? 90 : 0) }]}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[12]), backgroundColor: color('bg/subtle') }]}>{footer}</View> : null}
    </View>
  );
}

/** Group — Overline label (fg/muted) + box (radius 16, rows bg/default) + optional Caption note. */
export function SettingsGroup({ label, note, children }: { label?: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {label ? <Text variant="Overline" color="fg/muted">{label}</Text> : null}
      <View style={styles.box}>{children}</View>
      {note ? <Text variant="Caption" color="fg/muted">{note}</Text> : null}
    </View>
  );
}

type RowProps = {
  icon?: LucideIcon;
  /** Custom leading glyph (e.g. the acorn icon). */
  leading?: ReactNode;
  label: string;
  sub?: string;
  value?: string;
  right?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

/** ListRow 12:230 — 56 high (taller with sub), px 16, gap 14: icon 20 · Body/M · value (fg/muted) · chevron 18. */
export function SettingsRow({ icon, leading, label, sub, value, right, chevron = !!value || !right, destructive, onPress, disabled }: RowProps) {
  const { color } = useTheme();
  const fg: ColorToken = destructive ? 'fg/destructive' : 'fg/default';
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress || disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, sub ? styles.rowTall : null, { backgroundColor: color('bg/default') }, disabled && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
    >
      {icon ? <Icon icon={icon} size={20} color={fg} /> : leading ?? null}
      <View style={styles.flex}>
        <Text variant="Body/M" color={fg} numberOfLines={1}>{label}</Text>
        {sub ? <Text variant="Caption" color="fg/muted" numberOfLines={2}>{sub}</Text> : null}
      </View>
      {value ? <Text variant="Body/M" color="fg/muted" numberOfLines={1}>{value}</Text> : null}
      {right}
      {chevron && onPress && !destructive ? <Icon icon={ChevronRight} size={18} color="fg/muted" /> : null}
    </Pressable>
  );
}

/** Radio 41:512 — 26, bg/emphasis; selected = white ring + Gradient/Sunset dot. */
export function Radio({ on }: { on: boolean }) {
  const { color } = useTheme();
  if (!on) return <View style={[styles.radio, { backgroundColor: color('bg/emphasis') }]} />;
  return (
    <Svg width={26} height={26}>
      <Defs>
        <RadialGradient id="settings-radio" cx="50%" cy="50%" r="50%">
          {gradients['Gradient/Sunset'].map((s) => <Stop key={s.offset} offset={s.offset} stopColor={s.color} />)}
        </RadialGradient>
      </Defs>
      {/* Radio 41:515 · Selected — 26 bg/muted + 16 Gradient/Sunset dot. */}
      <Circle cx={13} cy={13} r={13} fill={color('bg/muted')} />
      <Circle cx={13} cy={13} r={8} fill="url(#settings-radio)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: space[12], paddingHorizontal: space[20], gap: space[24] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: space[12], paddingHorizontal: space[20] },
  group: { gap: space[8] },
  box: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { height: 56, flexDirection: 'row', alignItems: 'center', gap: space[14], paddingHorizontal: space[16] },
  rowTall: { height: 68 },
  flex: { flex: 1, gap: space[2] },
  radio: { width: 26, height: 26, borderRadius: radius.full },
});
