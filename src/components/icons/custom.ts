import { createLucideIcon } from 'lucide-react-native';

/**
 * ONGDALSAEM custom line icons (Figma 02 Icons 65:3385), drop-in replacements for the
 * Lucide glyphs of the same name — same props, stroke and fill behaviour as `Icon`.
 * icon/bookmark 3:42 · icon/share 3:47 · icon/message-circle 3:50
 */
export const Bookmark = createLucideIcon('bookmark', [
  ['path', { d: 'M19 21 L12 16.125 L5 21 L5 4.875 C5 4.3777 5.2107 3.9008 5.5858 3.5492 C5.9609 3.1975 6.4696 3 7 3 L17 3 C17.5304 3 18.0391 3.1975 18.4142 3.5492 C18.7893 3.9008 19 4.3777 19 4.875 L19 21Z', key: 'b' }],
]);

export const Share = createLucideIcon('share', [
  ['path', { d: 'M4 11V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V11', key: 's1' }],
  ['path', { d: 'M16 8L12 4L8 8', key: 's2' }],
  ['path', { d: 'M12 4V16', key: 's3' }],
]);

export const MessageCircle = createLucideIcon('message-circle', [
  ['path', { d: 'M15.5 19.5 C12.3758 19.5 9.4922 18.8182 6.9906 19.3636 C4.489 19.9091 2.0162 21 2.0162 21 C2.0162 21 4.244 17.1842 2.988 14.4545 C2.4056 13.1887 1.9023 11.377 2.0162 9.9664 C2.1302 8.5557 2.6017 7.2073 3.3781 6.072 C4.1545 4.9366 5.2052 4.059 6.4128 3.5373 C7.6204 3.0155 8.9372 2.87 10.2162 3.1172 C11.4953 3.3644 12.686 3.9945 13.6555 4.937 C14.625 5.8796 15.1289 6.8914 15.5 8.2485 L17 8.2485 C18.7528 8.2485 19.8367 8.9718 20.6812 9.8924 C23 12.4205 22.5 15.8647 21 17.5 C20.1556 18.4206 18.6242 19.5 15.5 19.5Z', key: 'm' }],
]);
