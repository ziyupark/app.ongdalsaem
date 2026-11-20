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
 * 3D Weather Mood images (Figma 1037:228 "Weather 3D") for the large weather icon only — Weather Card orb slot
 * (Home 136:4508 · Profile Header 614:13901 · Nearby). Small icons (≤ 24: chips, tags, list meta) stay WEATHER_ICON.
 * `{mood}@2x.png` / `@3x.png`; same image in light and dark.
 */
export const WEATHER_3D: Record<WeatherMood, number> = {
  'clear': require('../../assets/weather3d/clear.png'),
  'clear-night': require('../../assets/weather3d/clear-night.png'),
  'cloudy': require('../../assets/weather3d/cloudy.png'),
  'overcast': require('../../assets/weather3d/overcast.png'),
  'drizzle': require('../../assets/weather3d/drizzle.png'),
  'rain': require('../../assets/weather3d/rain.png'),
  'heavy-rain': require('../../assets/weather3d/heavy-rain.png'),
  'shower': require('../../assets/weather3d/shower.png'),
  'thunder': require('../../assets/weather3d/thunder.png'),
  'sleet': require('../../assets/weather3d/sleet.png'),
  'flurries': require('../../assets/weather3d/flurries.png'),
  'snow': require('../../assets/weather3d/snow.png'),
  'heavy-snow': require('../../assets/weather3d/heavy-snow.png'),
  'fog': require('../../assets/weather3d/fog.png'),
  'dust': require('../../assets/weather3d/dust.png'),
  'heat': require('../../assets/weather3d/heat.png'),
  'cold': require('../../assets/weather3d/cold.png'),
  'windy': require('../../assets/weather3d/windy.png'),
};
