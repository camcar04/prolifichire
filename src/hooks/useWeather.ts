import { useState, useCallback } from "react";

export interface WeatherCondition {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  windDirection: string;
  description: string;
  icon: "sun" | "cloud" | "rain" | "storm" | "snow" | "fog" | "wind" | "partly-cloudy";
  precipitation: number; // mm
  pressure: number;
  visibility: number; // miles
  uvIndex: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  windSpeed: number;
  precipitation: number;
  rainProbability: number;
  icon: WeatherCondition["icon"];
  description: string;
}

export interface WeatherAlert {
  id: string;
  type: "rain" | "wind" | "temperature" | "severe" | "frost";
  severity: "low" | "moderate" | "high" | "extreme";
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export interface WeatherRisk {
  type: "rain" | "wind" | "temperature";
  level: "low" | "moderate" | "high";
  label: string;
  value: string;
  threshold?: string;
}

export interface FieldWeather {
  fieldId: string;
  current: WeatherCondition;
  hourly: HourlyForecast[];
  alerts: WeatherAlert[];
  risks: WeatherRisk[];
  lastUpdated: string;
}

export interface JobWeatherImpact {
  canProceed: boolean;
  riskLevel: "clear" | "caution" | "delay_recommended" | "unsafe";
  reasons: string[];
  suggestedAction?: string;
}

// Thresholds by operation type
const THRESHOLDS: Record<string, { maxWind: number; maxRain: number; minTemp: number; maxTemp: number }> = {
  spraying: { maxWind: 10, maxRain: 20, minTemp: 40, maxTemp: 95 },
  planting: { maxWind: 25, maxRain: 40, minTemp: 45, maxTemp: 100 },
  harvest: { maxWind: 30, maxRain: 30, minTemp: 30, maxTemp: 105 },
  fertilizing: { maxWind: 15, maxRain: 25, minTemp: 35, maxTemp: 100 },
  tillage: { maxWind: 35, maxRain: 50, minTemp: 25, maxTemp: 110 },
  default: { maxWind: 25, maxRain: 40, minTemp: 35, maxTemp: 100 },
};

function generateMockWeather(lat: number, _lng: number): FieldWeather {
  const baseTemp = 58 + Math.random() * 15;
  const windSpeed = 4 + Math.random() * 14;
  const rainChance = Math.random();

  const icons: WeatherCondition["icon"][] = ["sun", "partly-cloudy", "cloud", "rain"];
  const iconIdx = rainChance > 0.6 ? 3 : rainChance > 0.35 ? 2 : rainChance > 0.15 ? 1 : 0;

  const current: WeatherCondition = {
    temp: Math.round(baseTemp),
    feelsLike: Math.round(baseTemp - 2 + Math.random() * 4),
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(windSpeed),
    windGust: Math.round(windSpeed * (1.3 + Math.random() * 0.5)),
    windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
    description: ["Clear skies", "Partly cloudy", "Overcast", "Light rain"][iconIdx],
    icon: icons[iconIdx],
    precipitation: iconIdx === 3 ? Math.round(Math.random() * 8) : 0,
    pressure: Math.round(1010 + Math.random() * 20),
    visibility: Math.round(8 + Math.random() * 7),
    uvIndex: Math.round(2 + Math.random() * 8),
  };

  const hourly: HourlyForecast[] = Array.from({ length: 24 }, (_, i) => {
    const hourTemp = baseTemp + Math.sin((i - 6) * Math.PI / 12) * 8;
    const hourRain = Math.max(0, rainChance - 0.3 + Math.random() * 0.4);
    const hourWind = windSpeed + (Math.random() - 0.5) * 6;
    return {
      time: new Date(Date.now() + i * 3600000).toISOString(),
      temp: Math.round(hourTemp),
      windSpeed: Math.round(Math.max(0, hourWind)),
      precipitation: hourRain > 0.5 ? Math.round(Math.random() * 5) : 0,
      rainProbability: Math.round(hourRain * 100),
      icon: hourRain > 0.6 ? "rain" : hourRain > 0.3 ? "cloud" : "sun",
      description: hourRain > 0.6 ? "Rain likely" : hourRain > 0.3 ? "Cloudy" : "Clear",
    };
  });

  const alerts: WeatherAlert[] = [];
  if (windSpeed > 12) {
    alerts.push({
      id: "wa-1",
      type: "wind",
      severity: windSpeed > 20 ? "high" : "moderate",
      title: "Wind Advisory",
      description: `Sustained winds ${Math.round(windSpeed)}–${Math.round(windSpeed * 1.4)} mph expected. May impact spray operations.`,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    });
  }
  if (rainChance > 0.5) {
    alerts.push({
      id: "wa-2",
      type: "rain",
      severity: rainChance > 0.75 ? "high" : "moderate",
      title: "Rain Expected",
      description: `${Math.round(rainChance * 100)}% chance of precipitation in the next 12 hours.`,
      startsAt: new Date(Date.now() + 3 * 3600000).toISOString(),
      endsAt: new Date(Date.now() + 15 * 3600000).toISOString(),
    });
  }

  const risks: WeatherRisk[] = [
    {
      type: "rain",
      level: rainChance > 0.6 ? "high" : rainChance > 0.3 ? "moderate" : "low",
      label: "Rain Risk",
      value: `${Math.round(rainChance * 100)}%`,
    },
    {
      type: "wind",
      level: windSpeed > 15 ? "high" : windSpeed > 10 ? "moderate" : "low",
      label: "Wind",
      value: `${Math.round(windSpeed)} mph`,
      threshold: "Spray limit: 10 mph",
    },
    {
      type: "temperature",
      level: baseTemp < 40 || baseTemp > 95 ? "high" : baseTemp < 50 ? "moderate" : "low",
      label: "Temperature",
      value: `${Math.round(baseTemp)}°F`,
    },
  ];

  return {
    fieldId: "",
    current,
    hourly,
    alerts,
    risks,
    lastUpdated: new Date().toISOString(),
  };
}

export function assessJobWeatherImpact(
  weather: FieldWeather,
  operationType: string
): JobWeatherImpact {
  const t = THRESHOLDS[operationType] || THRESHOLDS.default;
  const reasons: string[] = [];
  let riskLevel: JobWeatherImpact["riskLevel"] = "clear";

  if (weather.current.windSpeed > t.maxWind) {
    reasons.push(`Wind ${weather.current.windSpeed} mph exceeds ${t.maxWind} mph limit`);
    riskLevel = "unsafe";
  } else if (weather.current.windSpeed > t.maxWind * 0.7) {
    reasons.push(`Wind ${weather.current.windSpeed} mph approaching ${t.maxWind} mph limit`);
    if (riskLevel === "clear") riskLevel = "caution";
  }

  const maxRainProb = Math.max(...weather.hourly.slice(0, 6).map(h => h.rainProbability));
  if (maxRainProb > t.maxRain * 2) {
    reasons.push(`${maxRainProb}% rain probability in next 6 hours`);
    riskLevel = "unsafe";
  } else if (maxRainProb > t.maxRain) {
    reasons.push(`${maxRainProb}% rain probability — monitor conditions`);
    if (riskLevel !== "unsafe") riskLevel = "delay_recommended";
  }

  if (weather.current.temp < t.minTemp) {
    reasons.push(`Temperature ${weather.current.temp}°F below ${t.minTemp}°F minimum`);
    if (riskLevel !== "unsafe") riskLevel = "delay_recommended";
  }

  if (reasons.length === 0) reasons.push("Weather conditions are favorable");

  const suggestedAction = riskLevel === "unsafe"
    ? "Delay job — conditions are not safe for this operation"
    : riskLevel === "delay_recommended"
    ? "Consider rescheduling — conditions may impact quality"
    : riskLevel === "caution"
    ? "Proceed with caution — monitor conditions"
    : undefined;

  return {
    canProceed: riskLevel === "clear" || riskLevel === "caution",
    riskLevel,
    reasons,
    suggestedAction,
  };
}

export function useFieldWeather(fieldId: string, lat?: number, lng?: number) {
  const [weather, setWeather] = useState<FieldWeather | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(() => {
    if (!lat || !lng) return;
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateMockWeather(lat, lng);
      data.fieldId = fieldId;
      setWeather(data);
      setLoading(false);
    }, 300);
  }, [fieldId, lat, lng]);

  return { weather, loading, fetchWeather };
}
