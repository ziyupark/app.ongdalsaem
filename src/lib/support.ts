import { Linking } from 'react-native';

export const SUPPORT_EMAIL = 'help@ongdalsaem.app';
export const mailSupport = (subject = '') => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() => undefined);
