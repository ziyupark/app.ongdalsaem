// Lucide icon per Weather Mood — docs/01-foundations.md §2.4.
import {
  Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudRain, CloudRainWind, CloudSnow, CloudSun, CloudSunRain,
  Haze, Moon, Snowflake, Sun, ThermometerSnowflake, ThermometerSun, Wind, type LucideIcon,
} from 'lucide-react-native';
import type { WeatherMood } from './mood';

export const WEATHER_ICON: Record<WeatherMood, LucideIcon> = {
  clear: Sun, 'clear-night': Moon, cloudy: CloudSun, overcast: Cloud, drizzle: CloudDrizzle, rain: CloudRain,
  'heavy-rain': CloudRainWind, shower: CloudSunRain, thunder: CloudLightning, sleet: CloudHail, flurries: Snowflake,
  snow: CloudSnow, 'heavy-snow': CloudSnow, fog: CloudFog, dust: Haze, heat: ThermometerSun, cold: ThermometerSnowflake, windy: Wind,
};
