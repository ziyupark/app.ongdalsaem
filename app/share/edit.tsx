import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { loadPhotoEditor } from '../../src/lib/optionalNative';

const Editor = loadPhotoEditor();

/** 8.1a Edit photo (?i = index of the photo in the share draft). The editor itself: src/components/share/PhotoEditor. */
export default function EditPhoto() {
  const { t } = useTranslation();
  useEffect(() => {
    if (!Editor) { Alert.alert(t('shareSheet.needsRebuild')); router.back(); }
  }, [t]);
  return Editor ? <Editor.PhotoEditor /> : null;
}
