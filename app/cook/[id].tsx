import { useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '../../src/components/profile/ProfileScreen';

/**
 * 4.5 Another cook's profile — the 6.1 Profile layout with my weather on top and their dishes below.
 * `?actions=0` hides the Follow · Message buttons (card = Profile Header 126:4345); default shows them (1233:14208).
 */
export default function CookProfile() {
  const { id, actions } = useLocalSearchParams<{ id: string; actions?: string }>();
  return <ProfileScreen userId={id} showButton={actions !== '0'} />;
}
