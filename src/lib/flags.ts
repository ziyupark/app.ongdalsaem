import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local-only flags (never synced). 1.1b Welcome letter is shown once per install. */
const WELCOME_LETTER_SEEN = 'ongdalsaem.welcomeLetterSeen';

export async function hasSeenWelcomeLetter() {
  try {
    return (await AsyncStorage.getItem(WELCOME_LETTER_SEEN)) === '1';
  } catch {
    return false;
  }
}

export async function markWelcomeLetterSeen() {
  try {
    await AsyncStorage.setItem(WELCOME_LETTER_SEEN, '1');
  } catch {
    // Not fatal — the letter may show once more.
  }
}
