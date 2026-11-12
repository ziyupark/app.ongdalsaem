// 7.1 servings stepper: rescale an ingredient amount as typed by the cook ("1/2 cup", "1½ tbsp", "1~2 cloves", "0.5 kg").
// Every number in the text is multiplied; units and words stay as written. Text without a number ("a pinch") is returned as is.

const UNICODE: Record<string, number> = { '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8 };
const UNI = Object.keys(UNICODE).join('');

// Mixed "1 1/2" · fraction "1/2" · "1½" · "½" · decimal "0.5" / "1,5" · integer "2".
const NUMBER = new RegExp(`(\\d+)\\s+(\\d+)\\s*/\\s*(\\d+)|(\\d+)\\s*/\\s*(\\d+)|(\\d+)?\\s?([${UNI}])|(\\d+(?:[.,]\\d+)?)`, 'g');

type Style = 'ascii' | 'unicode' | 'decimal';

const NICE: [number, string, string][] = [
  [1 / 8, '1/8', '⅛'], [1 / 4, '1/4', '¼'], [1 / 3, '1/3', '⅓'], [3 / 8, '3/8', '⅜'], [1 / 2, '1/2', '½'],
  [5 / 8, '5/8', '⅝'], [2 / 3, '2/3', '⅔'], [3 / 4, '3/4', '¾'], [7 / 8, '7/8', '⅞'],
];

function format(n: number, style: Style, comma: boolean): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (frac < 0.02) return String(whole);
  if (frac > 0.98) return String(whole + 1);
  if (style !== 'decimal') {
    const nice = NICE.find(([v]) => Math.abs(v - frac) < 0.02);
    if (nice) {
      const part = style === 'unicode' ? nice[2] : nice[1];
      if (!whole) return part;
      return style === 'unicode' ? `${whole}${part}` : `${whole} ${part}`;
    }
  }
  const s = String(Math.round(n * 100) / 100);
  return comma ? s.replace('.', ',') : s;
}

/** `amount` rescaled from `from` servings to `to` servings. */
export function scaleIngredient(amount: string, from: number, to: number): string {
  if (!amount || from <= 0 || to <= 0 || from === to) return amount;
  const factor = to / from;
  return amount.replace(NUMBER, (match, mw, mn, md, fn, fd, uw, uc, dec) => {
    let value: number;
    let style: Style;
    let comma = false;
    if (mw != null) { value = Number(mw) + Number(mn) / Number(md); style = 'ascii'; }
    else if (fn != null) { value = Number(fn) / Number(fd); style = 'ascii'; }
    else if (uc != null) { value = (uw ? Number(uw) : 0) + UNICODE[uc]; style = 'unicode'; }
    else { comma = dec.includes(','); value = Number(dec.replace(',', '.')); style = 'decimal'; }
    if (!Number.isFinite(value)) return match;
    return format(value * factor, style, comma);
  });
}
