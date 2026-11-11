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
  ['path', { d: 'M17.5 18H7C5.70186 17.9997 2.02876 19.5 2.02876 19.5C2.02876 19.5 3.3269 15.2989 2.74485 14.1386C2.1628 12.9783 1.91487 11.679 2.02877 10.3858C2.14267 9.09269 2.61391 7.85671 3.38982 6.81598C4.16574 5.77526 5.21577 4.97079 6.42258 4.49249C7.62938 4.01418 8.94542 3.88087 10.2236 4.10747C11.5018 4.33406 12.6919 4.91162 13.6607 5.77561C14.6296 6.6396 15.3391 7.75598 15.71 9H17.5C18.6935 9 19.838 9.47411 20.682 10.318C21.5259 11.1619 22 12.3065 22 13.5C22 14.6935 21.5259 15.8381 20.682 16.682C19.838 17.5259 18.6935 18 17.5 18Z', key: 'm' }],
]);
