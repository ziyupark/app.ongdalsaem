import { Linking } from 'react-native';

export const SUPPORT_EMAIL = 'app.ongdalsaem@gmail.com';
export const mailSupport = (subject = '') => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() => undefined);
