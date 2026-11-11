import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, space, text, useTheme } from '../theme';
import { Text } from './Text';

type Props = Omit<TextInputProps, 'style'> & { label: string; helper?: string; error?: string };

/**
 * Input 6:337 — label (Body/S Strong) → field 56 high, radius 20, bg/subtle, px 16 → helper (Caption).
 * State: Default/Filled = 1px border/default · Focus = 2px border/focus · Error = 1px fg/destructive + red helper.
 */
export function Input({ label, helper, error, onFocus, onBlur, ...rest }: Props) {
  const { color } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? color('fg/destructive') : focused ? color('border/focus') : color('border/default');
  return (
    <View style={styles.root}>
      <Text variant="Body/S Strong">{label}</Text>
      <View style={[styles.field, { backgroundColor: color('bg/subtle'), borderColor, borderWidth: focused && !error ? 2 : 1 }]}>
        <TextInput
          {...rest}
          accessibilityLabel={label}
          placeholderTextColor={color('fg/muted')}
          selectionColor={color('border/focus')}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[fieldText, styles.input, { color: color('fg/default') }]}
        />
      </View>
      {error ? <Text variant="Caption" color="fg/destructive">{error}</Text> : helper ? <Text variant="Caption" color="fg/muted">{helper}</Text> : null}
    </View>
  );
}

// iOS TextInput mis-centres text when lineHeight is set — keep font, size and tracking only.
const { lineHeight: _lh, ...fieldText } = text['Body/M'];

const styles = StyleSheet.create({
  root: { gap: space[6], alignSelf: 'stretch' },
  field: { height: 56, borderRadius: radius.input, justifyContent: 'center', paddingHorizontal: space[16] },
  // RN TextInput adds its own vertical padding; zero it so the text sits centred like Figma.
  input: { paddingVertical: 0 },
});
