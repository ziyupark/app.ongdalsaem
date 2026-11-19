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
 * 3D Weather Mood images (Figma 1037:228 "Weather 3D") for the large weather icon only (Home Weather Card, Profile
 * header). Moods without an image here keep the Lucide icon above. Small icons (≤ 24) always use WEATHER_ICON.
 */
export const WEATHER_3D: Partial<Record<WeatherMood, number>> = {
  clear: require('../../assets/weather3d/weather3d_clear.png'),
};
