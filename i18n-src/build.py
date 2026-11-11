#!/usr/bin/env python3
"""Build src/i18n/<lang>.json from i18n-src/<lang>.txt using en.json as the key/order template.

Source format: `[section]` lines, then `sub.key=value` (\n = newline). Plural keys use i18next
suffixes (_one/_other …). Reports missing keys (left to English fallback), extra keys and
{{placeholder}} mismatches. Usage: build.py <repo> <lang> [<lang> …]
"""
import json, re, sys
from collections import OrderedDict

ROOT = sys.argv[1]
PH = re.compile(r'\{\{\s*(\w+)\s*\}\}')
PLURAL = re.compile(r'_(zero|one|two|few|many|other)$')

NAMES = {  # settings.languages.<code> label, per UI language
    'en': {'ja': 'Japanese', 'zh-TW': 'Chinese (Traditional)', 'es': 'Spanish', 'pt-BR': 'Portuguese (Brazil)', 'id': 'Indonesian', 'th': 'Thai', 'vi': 'Vietnamese'},
    'ko': {'ja': '일본어', 'zh-TW': '중국어(번체)', 'es': '스페인어', 'pt-BR': '포르투갈어(브라질)', 'id': '인도네시아어', 'th': '태국어', 'vi': '베트남어'},
    'ja': {'device': 'デバイスの言語', 'en': '英語', 'ko': '韓国語', 'ja': '日本語', 'zh-TW': '中国語（繁体字）', 'es': 'スペイン語', 'pt-BR': 'ポルトガル語（ブラジル）', 'id': 'インドネシア語', 'th': 'タイ語', 'vi': 'ベトナム語'},
    'zh-TW': {'device': '裝置語言', 'en': '英文', 'ko': '韓文', 'ja': '日文', 'zh-TW': '中文（繁體）', 'es': '西班牙文', 'pt-BR': '葡萄牙文（巴西）', 'id': '印尼文', 'th': '泰文', 'vi': '越南文'},
    'es': {'device': 'Idioma del dispositivo', 'en': 'Inglés', 'ko': 'Coreano', 'ja': 'Japonés', 'zh-TW': 'Chino (tradicional)', 'es': 'Español', 'pt-BR': 'Portugués (Brasil)', 'id': 'Indonesio', 'th': 'Tailandés', 'vi': 'Vietnamita'},
    'pt-BR': {'device': 'Idioma do dispositivo', 'en': 'Inglês', 'ko': 'Coreano', 'ja': 'Japonês', 'zh-TW': 'Chinês (tradicional)', 'es': 'Espanhol', 'pt-BR': 'Português (Brasil)', 'id': 'Indonésio', 'th': 'Tailandês', 'vi': 'Vietnamita'},
    'id': {'device': 'Bahasa perangkat', 'en': 'Inggris', 'ko': 'Korea', 'ja': 'Jepang', 'zh-TW': 'Mandarin (Tradisional)', 'es': 'Spanyol', 'pt-BR': 'Portugis (Brasil)', 'id': 'Bahasa Indonesia', 'th': 'Thai', 'vi': 'Vietnam'},
    'th': {'device': 'ภาษาของอุปกรณ์', 'en': 'อังกฤษ', 'ko': 'เกาหลี', 'ja': 'ญี่ปุ่น', 'zh-TW': 'จีน (ตัวเต็ม)', 'es': 'สเปน', 'pt-BR': 'โปรตุเกส (บราซิล)', 'id': 'อินโดนีเซีย', 'th': 'ไทย', 'vi': 'เวียดนาม'},
    'vi': {'device': 'Ngôn ngữ thiết bị', 'en': 'Tiếng Anh', 'ko': 'Tiếng Hàn', 'ja': 'Tiếng Nhật', 'zh-TW': 'Tiếng Trung (Phồn thể)', 'es': 'Tiếng Tây Ban Nha', 'pt-BR': 'Tiếng Bồ Đào Nha (Brazil)', 'id': 'Tiếng Indonesia', 'th': 'Tiếng Thái', 'vi': 'Tiếng Việt'},
}
# Languages whose CLDR plural rules have only "other" — drop _one.
OTHER_ONLY = {'ja', 'zh-TW', 'id', 'th', 'vi'}
SPACED = {'es', 'pt-BR', 'id', 'vi'}


def flat(o, p=''):
    for k, v in o.items():
        if isinstance(v, dict):
            yield from flat(v, p + k + '.')
        else:
            yield p + k, v


def nest(pairs):
    root = OrderedDict()
    for k, v in pairs:
        cur = root
        parts = k.split('.')
        for part in parts[:-1]:
            cur = cur.setdefault(part, OrderedDict())
        cur[parts[-1]] = v
    return root


def add_names(lang, data):
    lst = data.setdefault('settings', OrderedDict()).setdefault('languages', OrderedDict())
    for code, name in NAMES[lang].items():
        lst[code] = name


def build(lang):
    en = json.load(open(f'{ROOT}/src/i18n/en.json'), object_pairs_hook=OrderedDict)
    src = {}
    section = ''
    for ln, line in enumerate(open(f'{ROOT}/i18n-src/{lang}.txt', encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        if line.startswith('[') and line.endswith(']'):
            section = line[1:-1]
            continue
        k, sep, v = line.partition('=')
        if not sep:
            print(f'  ! {lang}:{ln} no "=": {line[:40]}')
            continue
        src[f'{section}.{k}'] = v.replace('\\n', '\n')
    out, missing, bad = [], [], []
    en_keys = set()
    for key, ev in flat(en):
        en_keys.add(key)
        if key.startswith('settings.languages.'):
            continue
        if lang in OTHER_ONLY and key.endswith('_one'):
            continue
        tv = src.get(key)
        if tv is None and lang in OTHER_ONLY and key.endswith('_other'):
            tv = src.get(key[:-6])
        if tv is None:
            missing.append(key)
            continue
        # Source editors strip trailing spaces — restore them where English has one (space-separated scripts only).
        if lang in SPACED and ev.endswith(' ') and tv and not tv.endswith(' '):
            tv += ' '
        if set(PH.findall(ev)) != set(PH.findall(tv)):
            bad.append(f'{key}: en {sorted(set(PH.findall(ev)))} vs {sorted(set(PH.findall(tv)))}')
        out.append((key, tv))
    extra = [k for k in src if k not in en_keys and not (lang in OTHER_ONLY and k + '_other' in en_keys)]
    data = nest(out)
    add_names(lang, data)
    json.dump(data, open(f'{ROOT}/src/i18n/{lang}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(f'{ROOT}/src/i18n/{lang}.json', 'a').write('\n')
    print(f'{lang}: {len(out)} strings · missing {len(missing)} · extra {len(extra)} · placeholder issues {len(bad)}')
    for m in missing: print('  missing', m)
    for e in extra: print('  extra', e)
    for b in bad: print('  PH', b)


if __name__ == '__main__':
    for lang in sys.argv[2:]:
        if lang in ('en', 'ko'):
            d = json.load(open(f'{ROOT}/src/i18n/{lang}.json'), object_pairs_hook=OrderedDict)
            add_names(lang, d)
            json.dump(d, open(f'{ROOT}/src/i18n/{lang}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
            open(f'{ROOT}/src/i18n/{lang}.json', 'a').write('\n')
            print(f'{lang}: language names added')
        else:
            build(lang)
