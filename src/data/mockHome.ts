// MOCK — Home content until the recommendation / feed APIs exist (docs/06-data-model.md shapes, 2.1 Rainy evening data).
// Weather, place and date on Home are live; only the dishes below are sample data.
import type { WeatherMood } from '../theme';

export type MockDish = { id: string; photo: number };
export type MockFeedPost = {
  id: string; name: string; meta: string; avatar: number; photo: number; photoCount: number;
  weather: WeatherMood; tempC: number; acorns: number; comments: number; caption: string;
};

const photo = {
  kimchi1: require('../../assets/mock/kimchi1.png'),
  hotpot: require('../../assets/mock/hotpot.png'),
  eggRiceA: require('../../assets/mock/eggRice-a.png'),
  eggRiceB: require('../../assets/mock/eggRice-b.png'),
  eggRiceC: require('../../assets/mock/eggRice-c.png'),
  pick: require('../../assets/mock/pick-kimchi.png'),
};
const avatar = {
  minji: require('../../assets/mock/avatar-minji.png'),
  jae: require('../../assets/mock/avatar-jae.png'),
  sora: require('../../assets/mock/avatar-sora.png'),
};

/** Meal slot thumbnails, in timeline order; the last slot stays empty (nobody posted yet). */
export const mockSlotDishes: (MockDish | null)[] = [
  { id: 'd-lunch', photo: photo.eggRiceA },
  { id: 'd-now', photo: photo.eggRiceB },
  { id: 'd-late', photo: photo.eggRiceC },
  null,
];
/** "New picks" rotates through these (docs/05-behavior.md §6.1 Refresh). */
export const mockSlotAlternates: MockDish[] = [
  { id: 'd-alt-1', photo: photo.kimchi1 },
  { id: 'd-alt-2', photo: photo.hotpot },
  { id: 'd-alt-3', photo: photo.eggRiceC },
];

export const mockTodaysPick = {
  dishId: 'd-kimchi', photo: photo.kimchi1, statement: 'Kimchi jjigae for the first cold rain',
  cookInitial: 'M', cookAvatar: avatar.minji, weather: 'rain' as WeatherMood, tempC: 12, acorns: 128,
  byline: 'Minji · Mapo, Seoul · 40 min ago', pickPhoto: photo.pick,
};

/** "Eat this nearby" searches Maps for today's pick (2.4 list needs a places provider). */
export const mockNearby = { photo: photo.kimchi1, dish: 'Kimchi jjigae' };

export const mockFeed = {
  title: 'Kimchi jjigae & friends',
  chips: ['Kimchi jjigae', 'Stews'],
  posts: [
    { id: 'p1', name: 'minji.cooks', meta: 'Mapo, Seoul · 40m', avatar: avatar.minji, photo: photo.kimchi1, photoCount: 3, weather: 'rain', tempC: 12, acorns: 95, comments: 18, caption: 'Old kimchi from my mom’s fridge — the sourer, the better on a rainy night.' },
    { id: 'p2', name: 'jae.eats', meta: 'Sinchon, Seoul · 1h', avatar: avatar.jae, photo: photo.hotpot, photoCount: 4, weather: 'drizzle', tempC: 11, acorns: 74, comments: 9, caption: 'Budae jjigae for four. Spam, rice cakes, and one slice of cheese melting on top.' },
    { id: 'p3', name: 'sora.home', meta: 'Incheon · 2h', avatar: avatar.sora, photo: photo.eggRiceC, photoCount: 2, weather: 'rain', tempC: 10, acorns: 44, comments: 6, caption: 'Sundubu with a cracked egg — silky tofu for a grey afternoon.' },
  ] satisfies MockFeedPost[],
};
