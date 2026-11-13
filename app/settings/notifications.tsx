import { Clock, CloudSun, Timer, Users } from 'lucide-react-native';
import { MessageCircle } from '../../src/components/icons/custom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { AcornIcon } from '../../src/components/AcornIcon';
import { SettingsGroup, SettingsRow, SettingsScreen } from '../../src/components/settings/Settings';
import { Toggle } from '../../src/components/Toggle';
import { setPrefs, usePrefs } from '../../src/lib/prefs';
import { syncPush } from '../../src/lib/push';
import { fetchAccount, updateAccount } from '../../src/services/settings';

const PICK_TIMES = ['07:00', '07:30', '08:00', '09:00', '11:30', '17:30'];

/** 9.4 Notifications (Figma 193:6391). Activity / For you toggles are kept on this device; Ads & events is saved to the account. */
export default function NotificationSettings() {
  const { t, i18n } = useTranslation();
  const prefs = usePrefs();
  const [ads, setAds] = useState<boolean | null>(null);
  const [night, setNight] = useState(false);
  useEffect(() => { fetchAccount().then((a) => { setAds(a.marketingAds); setNight(a.marketingNightAds); }).catch(() => setAds(false)); }, []);

  const label = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' });
  };
  const toggle = (k: keyof typeof prefs.notify) => (v: boolean) => setPrefs({ notify: { ...prefs.notify, [k]: v } });
  const setAdsOn = async (v: boolean) => {
    const prevNight = night;
    setAds(v);
    if (!v) setNight(false);
    // Night-time ads need ads on (profiles_night_ads_needs_ads).
    try { await updateAccount(v ? { marketing_ads: true } : { marketing_ads: false, marketing_night_ads: false }); } catch { setAds(!v); setNight(prevNight); }
  };
  const setNightOn = async (v: boolean) => {
    setNight(v);
    try { await updateAccount({ marketing_night_ads: v }); } catch { setNight(!v); }
  };

  return (
    <SettingsScreen title={t('settings.notifications')}>
      <SettingsGroup label={t('settings.activity')}>
        <SettingsRow leading={<AcornIcon size={18} />} label={t('settings.nAcorns')} right={<Toggle accessibilityLabel={t('settings.nAcorns')} value={prefs.notify.acorns} onValueChange={toggle('acorns')} />} />
        <SettingsRow icon={MessageCircle} label={t('settings.nComments')} right={<Toggle accessibilityLabel={t('settings.nComments')} value={prefs.notify.comments} onValueChange={toggle('comments')} />} />
        <SettingsRow icon={Users} label={t('settings.nFollowers')} right={<Toggle accessibilityLabel={t('settings.nFollowers')} value={prefs.notify.followers} onValueChange={toggle('followers')} />} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.forYou')}>
        <SettingsRow icon={CloudSun} label={t('settings.nDailyPick')} right={<Toggle accessibilityLabel={t('settings.nDailyPick')} value={prefs.notify.dailyPick} onValueChange={(v) => { toggle('dailyPick')(v); if (v) syncPush({ ask: true }); }} />} />
        <SettingsRow
          icon={Clock}
          label={t('settings.pickTime')}
          value={label(prefs.pickTime)}
          disabled={!prefs.notify.dailyPick}
          onPress={() => Alert.alert(t('settings.pickTime'), undefined, [...PICK_TIMES.map((p) => ({ text: label(p), onPress: () => setPrefs({ pickTime: p }) })), { text: t('common.cancel'), style: 'cancel' as const }])}
        />
        <SettingsRow icon={Timer} label={t('settings.nTimer')} right={<Toggle accessibilityLabel={t('settings.nTimer')} value={prefs.notify.timer} onValueChange={toggle('timer')} />} />
      </SettingsGroup>
      <SettingsGroup label={t('settings.adsEvents')} note={t('settings.adsNote')}>
        <SettingsRow label={t('settings.nAds')} right={<Toggle accessibilityLabel={t('settings.nAds')} value={!!ads} disabled={ads == null} onValueChange={setAdsOn} />} />
        <SettingsRow label={t('settings.nNightAds')} right={<Toggle accessibilityLabel={t('settings.nNightAds')} value={night} disabled={!ads} onValueChange={setNightOn} />} />
      </SettingsGroup>
    </SettingsScreen>
  );
}
