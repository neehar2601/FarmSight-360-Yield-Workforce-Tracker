export interface WeatherData {
  id: string;
  farmId: string;
  date: Date;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  temperature: {
    current: number;
    min: number;
    max: number;
    feelsLike: number;
  };
  humidity: number;
  precipitation: {
    amount: number;
    probability: number;
    type?: 'rain' | 'snow' | 'sleet';
  };
  wind: {
    speed: number;
    direction: number;
    gust?: number;
  };
  pressure: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  conditions: string;
  icon: string;
  sunrise: Date;
  sunset: Date;
  source: string;
}

export interface WeatherForecast {
  id: string;
  farmId: string;
  generatedAt: Date;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  current: WeatherData;
  hourlyForecast: Array<{
    time: Date;
    temperature: number;
    precipitation: {
      amount: number;
      probability: number;
    };
    humidity: number;
    windSpeed: number;
    conditions: string;
    icon: string;
  }>;
  dailyForecast: Array<{
    date: Date;
    temperatureMin: number;
    temperatureMax: number;
    precipitation: {
      amount: number;
      probability: number;
    };
    humidity: number;
    windSpeed: number;
    conditions: string;
    icon: string;
    sunrise: Date;
    sunset: Date;
  }>;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  id: string;
  type: 'frost' | 'heat' | 'wind' | 'rain' | 'hail' | 'drought' | 'flood';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
  recommendations: string[];
  isActive: boolean;
}

export interface GrowingDegreeDays {
  id: string;
  farmId: string;
  crop: string;
  baseTemperature: number;
  date: Date;
  dailyGDD: number;
  accumulatedGDD: number;
  season: string;
  year: number;
}

export interface IrrigationRecommendation {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  crop: string;
  date: Date;
  soilMoisture: number;
  evapotranspiration: number;
  precipitation: number;
  irrigationNeeded: boolean;
  recommendedAmount: number;
  recommendedTiming: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  weatherFactors: string[];
}

export interface ClimateData {
  id: string;
  farmId: string;
  year: number;
  month?: number;
  averageTemperature: number;
  totalPrecipitation: number;
  totalGDD: number;
  frostDays: number;
  heatStressDays: number;
  precipitationDays: number;
  averageHumidity: number;
  averageWindSpeed: number;
  extremeWeatherEvents: number;
}

export interface WeatherAnalytics {
  currentConditions: WeatherData;
  weeklyForecast: WeatherForecast['dailyForecast'];
  activeAlerts: WeatherAlert[];
  irrigationRecommendations: IrrigationRecommendation[];
  monthlyTrends: Array<{
    month: string;
    avgTemperature: number;
    totalPrecipitation: number;
    gdd: number;
    irrigationDays: number;
  }>;
  seasonalComparison: Array<{
    season: string;
    currentYear: ClimateData;
    previousYear: ClimateData;
    variance: {
      temperature: number;
      precipitation: number;
      gdd: number;
    };
  }>;
  cropRecommendations: Array<{
    crop: string;
    suitability: 'excellent' | 'good' | 'fair' | 'poor';
    reasoning: string;
    recommendedActions: string[];
  }>;
}
