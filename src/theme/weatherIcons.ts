// Ongdal icon per Weather Mood — docs/01-foundations.md §2.4.
import {
  Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudRain, CloudRainWind, CloudSnow, CloudSun, CloudSunRain,
  Haze, Moon, Snowflake, Sun, ThermometerSnowflake, ThermometerSun, Wind, type LucideIcon,
} from '../components/icons/ongdal';
import type { WeatherMood } from './mood';

export const WEATHER_ICON: Record<WeatherMood, LucideIcon> = {
  clear: Sun, 'clear-night': Moon, cloudy: CloudSun, overcast: Cloud, drizzle: CloudDrizzle, rain: CloudRain,
  'heavy-rain': CloudRainWind, shower: CloudSunRain, thunder: CloudLightning, sleet: CloudHail, flurries: Snowflake,
  snow: CloudSnow, 'heavy-snow': CloudSnow, fog: CloudFog, dust: Haze, heat: ThermometerSun, cold: ThermometerSnowflake, windy: Wind,
};

/**
 * Weather 3D icon keys (Figma 1132:220 "Weather 3D · Develop Weather (41)" · overview 1145:220): the 18 Weather Mood keys
 * + 23 finer keys — 대표 7 · 파생 12 · 조합형 3 · 재난 7 · Night 12. The mood still drives the wash, motion, small icons and
 * labels; the icon key only picks the large 3D image (services/weather.ts `iconFromOwm`).
 */
export const WEATHER_3D_KEYS = [
  'clear', 'clear-night', 'overcast', 'cloudy', 'mostly-cloudy-night', 'rain', 'snow',
  'mostly-sunny', 'partly-cloudy', 'mostly-clear', 'partly-cloudy-night', 'drizzle', 'shower', 'heavy-rain', 'flurries', 'heavy-snow', 'windy', 'fog', 'thunder',
  'rain-snow', 'sleet', 'hail',
  'hurricane', 'dust', 'rain-thunder', 'partly-sunny-thunder', 'heat', 'cold', 'ice',
  'drizzle-night', 'shower-night', 'rain-night', 'heavy-rain-night', 'thunder-night', 'rain-thunder-night', 'flurries-night', 'snow-night', 'heavy-snow-night', 'rain-snow-night', 'hail-night', 'fog-night',
] as const;
export type Weather3DKey = (typeof WEATHER_3D_KEYS)[number];

/**
 * 3D weather images for the large weather icon only — Weather Card orb slot (Home 136:4508 · Profile Header 614:13901 ·
 * Nearby). Small icons (≤ 24: chips, tags, list meta) stay WEATHER_ICON. `{key}@2x.png` / `@3x.png` (128 / 192 px, from the
 * 1024² transparent fills, object-contain); same image in light and dark. Every WeatherMood is also a key here.
 */
export const WEATHER_3D: Record<Weather3DKey, number> = {
  'clear': require('../../assets/weather3d/clear.png'),
  'clear-night': require('../../assets/weather3d/clear-night.png'),
  'overcast': require('../../assets/weather3d/overcast.png'),
  'cloudy': require('../../assets/weather3d/cloudy.png'),
  'mostly-cloudy-night': require('../../assets/weather3d/mostly-cloudy-night.png'),
  'rain': require('../../assets/weather3d/rain.png'),
  'snow': require('../../assets/weather3d/snow.png'),
  'mostly-sunny': require('../../assets/weather3d/mostly-sunny.png'),
  'partly-cloudy': require('../../assets/weather3d/partly-cloudy.png'),
  'mostly-clear': require('../../assets/weather3d/mostly-clear.png'),
  'partly-cloudy-night': require('../../assets/weather3d/partly-cloudy-night.png'),
  'drizzle': require('../../assets/weather3d/drizzle.png'),
  'shower': require('../../assets/weather3d/shower.png'),
  'heavy-rain': require('../../assets/weather3d/heavy-rain.png'),
  'flurries': require('../../assets/weather3d/flurries.png'),
  'heavy-snow': require('../../assets/weather3d/heavy-snow.png'),
  'windy': require('../../assets/weather3d/windy.png'),
  'fog': require('../../assets/weather3d/fog.png'),
  'thunder': require('../../assets/weather3d/thunder.png'),
  'rain-snow': require('../../assets/weather3d/rain-snow.png'),
  'sleet': require('../../assets/weather3d/sleet.png'),
  'hail': require('../../assets/weather3d/hail.png'),
  'hurricane': require('../../assets/weather3d/hurricane.png'),
  'dust': require('../../assets/weather3d/dust.png'),
  'rain-thunder': require('../../assets/weather3d/rain-thunder.png'),
  'partly-sunny-thunder': require('../../assets/weather3d/partly-sunny-thunder.png'),
  'heat': require('../../assets/weather3d/heat.png'),
  'cold': require('../../assets/weather3d/cold.png'),
  'ice': require('../../assets/weather3d/ice.png'),
  'drizzle-night': require('../../assets/weather3d/drizzle-night.png'),
  'shower-night': require('../../assets/weather3d/shower-night.png'),
  'rain-night': require('../../assets/weather3d/rain-night.png'),
  'heavy-rain-night': require('../../assets/weather3d/heavy-rain-night.png'),
  'thunder-night': require('../../assets/weather3d/thunder-night.png'),
  'rain-thunder-night': require('../../assets/weather3d/rain-thunder-night.png'),
  'flurries-night': require('../../assets/weather3d/flurries-night.png'),
  'snow-night': require('../../assets/weather3d/snow-night.png'),
  'heavy-snow-night': require('../../assets/weather3d/heavy-snow-night.png'),
  'rain-snow-night': require('../../assets/weather3d/rain-snow-night.png'),
  'hail-night': require('../../assets/weather3d/hail-night.png'),
  'fog-night': require('../../assets/weather3d/fog-night.png'),
};
