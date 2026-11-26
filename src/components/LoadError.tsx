import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from './icons/ongdal';
import { Button } from './Button';
import { EmptyState } from './community/Parts';

/**
 * Load failed (offline · server error): EmptyState (wifi-off) "Couldn’t load this" + "Check your connection and try again."
 * + Outline M "Try again". `onRetry` may be async — the button shows its spinner until it settles.
 * Used wherever a screen's main content comes from the network, so a failure never looks like an empty list or a
 * spinner that never stops.
 */
export function LoadError({ onRetry, size = 'M' }: { onRetry: () => unknown; size?: 'L' | 'M' }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const retry = async () => {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };
  return (
    <EmptyState icon={WifiOff} size={size} title={t('common.loadErrorTitle')} body={t('common.loadErrorBody')}>
      <Button label={t('common.retry')} size="M" variant="Outline" onPress={retry} loading={busy} disabled={busy} />
    </EmptyState>
  );
}
