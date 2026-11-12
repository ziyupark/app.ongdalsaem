// Spacing & radius tokens — docs/01-foundations.md §2.5. Only these values are allowed.

export const space = {
  0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 14: 14,
  16: 16, 20: 20, 24: 24, 32: 32, 40: 40, 42: 42, 56: 56,
} as const;

export const radius = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, full: 999,
  /** Input family keeps 20 (component value in Figma). */
  input: 20,
} as const;

/** Icon stroke by rendered size — docs/02-components.md §3.2. */
export const iconStroke = (size: number) => (size >= 22 ? 1.6 : size >= 17 ? 1.5 : 1.4);

/** Fixed bottom button position used on every 01 screen (y 744–800 on a 844 frame). */
export const FIXED_BUTTON_BOTTOM = 44;
