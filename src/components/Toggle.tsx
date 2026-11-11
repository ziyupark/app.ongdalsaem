import { Switch } from 'react-native';
import { useTheme } from '../theme';

/** Switch 6:253 — 51×31, On = bg/primary track + white thumb, Off = bg/emphasis. */
export function Toggle({ value, onValueChange, disabled, accessibilityLabel }: { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean; accessibilityLabel: string }) {
  const { color } = useTheme();
  return (
    <Switch
      accessibilityLabel={accessibilityLabel}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: color('bg/primary'), false: color('bg/emphasis') }}
      ios_backgroundColor={color('bg/emphasis')}
      thumbColor={color('static/white')}
      style={disabled ? { opacity: 0.4 } : null}
    />
  );
}
