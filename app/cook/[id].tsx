import { useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '../../src/components/profile/ProfileScreen';

/** 4.5 Another cook's profile — the 6.1 Profile layout with my weather on top and their dishes below. */
export default function CookProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen userId={id} />;
}
