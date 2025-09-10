import {
  WeatherData,
  WeatherForecast,
  WeatherAlert,
  WeatherAnalytics,
  GrowingDegreeDays,
  IrrigationRecommendation,
  ClimateData,
} from '@/models';

// Mock data
const generateWeatherData = (daysBack: number): WeatherData[] => {
  const data: WeatherData[] = [];
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain', 'Thunderstorms'];
  const icons = ['sunny', 'partly-cloudy', 'cloudy', 'light-rain', 'rain', 'thunderstorm'];
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const conditionIndex = Math.floor(Math.random() * conditions.length);
    const baseTemp = 20 + Math.sin((date.getMonth() + 1) * Math.PI / 6) * 10; // Seasonal variation
    const tempVariation = (Math.random() - 0.5) * 10;
    const currentTemp = Math.round(baseTemp + tempVariation);
    
    data.push({
      id: `weather-${date.toISOString().split('T')[0]}`,
      farmId: 'farm-1',
      date,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        name: 'Farm Location',
      },
      temperature: {
        current: currentTemp,
        min: currentTemp - Math.random() * 5,
        max: currentTemp + Math.random() * 8,
        feelsLike: currentTemp + (Math.random() - 0.5) * 3,
      },
      humidity: Math.round(50 + Math.random() * 40),
      precipitation: {
        amount: conditionIndex > 2 ? Math.random() * 20 : 0,
        probability: conditionIndex > 2 ? Math.round(60 + Math.random() * 40) : Math.round(Math.random() * 30),
        type: conditionIndex > 4 ? 'rain' : undefined,
      },
      wind: {
        speed: Math.round(5 + Math.random() * 15),
        direction: Math.round(Math.random() * 360),
        gust: Math.round(10 + Math.random() * 20),
      },
      pressure: Math.round(1000 + Math.random() * 40),
      uvIndex: Math.round(Math.random() * 10),
      visibility: Math.round(8 + Math.random() * 7),
      cloudCover: Math.round(Math.random() * 100),
      conditions: conditions[conditionIndex],
      icon: icons[conditionIndex],
      sunrise: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 30),
      sunset: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 15),
      source: 'MockWeatherAPI',
    });
  }
  
  return data.reverse();
};

const mockWeatherHistory = generateWeatherData(30);

const generateForecast = (): WeatherForecast => {
  const current = mockWeatherHistory[mockWeatherHistory.length - 1];
  
  // Generate hourly forecast for next 24 hours
  const hourlyForecast = Array.from({ length: 24 }, (_, i) => {
    const time = new Date();
    time.setHours(time.getHours() + i);
    
    const tempVariation = (Math.random() - 0.5) * 5;
    
    return {
      time,
      temperature: Math.round(current.temperature.current + tempVariation),
      precipitation: {
        amount: Math.random() > 0.7 ? Math.random() * 5 : 0,
        probability: Math.round(Math.random() * 100),
      },
      humidity: Math.round(45 + Math.random() * 30),
      windSpeed: Math.round(current.wind.speed + (Math.random() - 0.5) * 5),
      conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      icon: ['sunny', 'partly-cloudy', 'cloudy', 'light-rain'][Math.floor(Math.random() * 4)],
    };
  });
  
  // Generate daily forecast for next 7 days
  const dailyForecast = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    
    const baseTemp = current.temperature.current + (Math.random() - 0.5) * 8;
    
    return {
      date,
      temperatureMin: Math.round(baseTemp - Math.random() * 8),
      temperatureMax: Math.round(baseTemp + Math.random() * 10),
      precipitation: {
        amount: Math.random() > 0.6 ? Math.random() * 15 : 0,
        probability: Math.round(Math.random() * 100),
      },
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 15),
      conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain'][Math.floor(Math.random() * 5)],
      icon: ['sunny', 'partly-cloudy', 'cloudy', 'light-rain', 'rain'][Math.floor(Math.random() * 5)],
      sunrise: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 30),
      sunset: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 15),
    };
  });
  
  const alerts: WeatherAlert[] = [];
  
  // Add random weather alerts
  if (Math.random() > 0.7) {
    const alertTypes = ['frost', 'heat', 'wind', 'rain'] as const;
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    alerts.push({
      id: `alert-${Date.now()}`,
      type: alertType,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      title: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} Warning`,
      description: `Potential ${alertType} conditions expected in the next 24-48 hours`,
      startTime: new Date(),
      endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      affectedAreas: ['North Field', 'South Field'],
      recommendations: [
        'Monitor crop conditions closely',
        'Consider protective measures if necessary',
        'Adjust irrigation schedule accordingly',
      ],
      isActive: true,
    });
  }
  
  return {
    id: `forecast-${Date.now()}`,
    farmId: 'farm-1',
    generatedAt: new Date(),
    location: current.location,
    current,
    hourlyForecast,
    dailyForecast,
    alerts,
  };
};

class WeatherService {
  async getCurrentWeather(): Promise<WeatherData> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockWeatherHistory[mockWeatherHistory.length - 1];
  }

  async getWeatherHistory(days: number = 30): Promise<WeatherData[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockWeatherHistory.slice(-days);
  }

  async getWeatherForecast(): Promise<WeatherForecast> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateForecast();
  }

  async getWeatherAlerts(): Promise<WeatherAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const forecast = generateForecast();
    return forecast.alerts;
  }

  async getGrowingDegreeDays(crop: string, days: number = 30): Promise<GrowingDegreeDays[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Base temperatures for different crops
    const baseTemperatures: { [key: string]: number } = {
      tomatoes: 10,
      wheat: 5,
      corn: 10,
      apples: 5,
      carrots: 5,
    };
    
    const baseTemp = baseTemperatures[crop.toLowerCase()] || 10;
    
    const history = mockWeatherHistory.slice(-days);
    let accumulatedGDD = 0;
    
    return history.map(weather => {
      const avgTemp = (weather.temperature.min + weather.temperature.max) / 2;
      const dailyGDD = Math.max(0, avgTemp - baseTemp);
      accumulatedGDD += dailyGDD;
      
      return {
        id: `gdd-${weather.date.toISOString().split('T')[0]}-${crop}`,
        farmId: 'farm-1',
        crop,
        baseTemperature: baseTemp,
        date: weather.date,
        dailyGDD: Math.round(dailyGDD * 10) / 10,
        accumulatedGDD: Math.round(accumulatedGDD * 10) / 10,
        season: this.getSeason(weather.date),
        year: weather.date.getFullYear(),
      };
    });
  }

  async getIrrigationRecommendations(): Promise<IrrigationRecommendation[]> {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    const forecast = generateForecast();
    const recommendations: IrrigationRecommendation[] = [];
    
    // Mock recommendations based on weather conditions
    const fields = [
      { id: 'field-1', name: 'North Field', crop: 'Tomatoes' },
      { id: 'field-2', name: 'South Field', crop: 'Wheat' },
      { id: 'field-3', name: 'East Field', crop: 'Carrots' },
    ];
    
    fields.forEach(field => {
      const soilMoisture = Math.random() * 100;
      const evapotranspiration = 3 + Math.random() * 4; // mm/day
      const upcomingRain = forecast.dailyForecast
        .slice(0, 3)
        .reduce((sum, day) => sum + day.precipitation.amount, 0);
      
      const irrigationNeeded = soilMoisture < 40 && upcomingRain < 10;
      
      recommendations.push({
        id: `irr-rec-${field.id}-${Date.now()}`,
        farmId: 'farm-1',
        fieldId: field.id,
        fieldName: field.name,
        crop: field.crop,
        date: new Date(),
        soilMoisture: Math.round(soilMoisture),
        evapotranspiration: Math.round(evapotranspiration * 10) / 10,
        precipitation: upcomingRain,
        irrigationNeeded,
        recommendedAmount: irrigationNeeded ? evapotranspiration * 2 : 0,
        recommendedTiming: irrigationNeeded ? new Date(Date.now() + 12 * 60 * 60 * 1000) : new Date(),
        priority: soilMoisture < 25 ? 'critical' : soilMoisture < 40 ? 'high' : 'low',
        reasoning: irrigationNeeded 
          ? `Low soil moisture (${Math.round(soilMoisture)}%) and minimal rainfall expected`
          : `Adequate soil moisture (${Math.round(soilMoisture)}%) or rainfall expected`,
        weatherFactors: [
          `Current humidity: ${forecast.current.humidity}%`,
          `Wind speed: ${forecast.current.wind.speed} km/h`,
          `Expected rainfall: ${Math.round(upcomingRain)}mm`,
        ],
      });
    });
    
    return recommendations;
  }

  async getClimateData(year: number, month?: number): Promise<ClimateData[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (month) {
      // Return monthly data
      const monthData = mockWeatherHistory.filter(w => 
        w.date.getFullYear() === year && w.date.getMonth() === month - 1
      );
      
      const avgTemp = monthData.reduce((sum, w) => sum + w.temperature.current, 0) / monthData.length;
      const totalPrecip = monthData.reduce((sum, w) => sum + w.precipitation.amount, 0);
      
      return [{
        id: `climate-${year}-${month}`,
        farmId: 'farm-1',
        year,
        month,
        averageTemperature: Math.round(avgTemp * 10) / 10,
        totalPrecipitation: Math.round(totalPrecip * 10) / 10,
        totalGDD: Math.round((avgTemp - 10) * monthData.length * 10) / 10,
        frostDays: monthData.filter(w => w.temperature.min < 0).length,
        heatStressDays: monthData.filter(w => w.temperature.max > 35).length,
        precipitationDays: monthData.filter(w => w.precipitation.amount > 1).length,
        averageHumidity: Math.round(monthData.reduce((sum, w) => sum + w.humidity, 0) / monthData.length),
        averageWindSpeed: Math.round(monthData.reduce((sum, w) => sum + w.wind.speed, 0) / monthData.length),
        extremeWeatherEvents: monthData.filter(w => 
          w.temperature.max > 35 || w.temperature.min < -5 || w.precipitation.amount > 25
        ).length,
      }];
    } else {
      // Return yearly summary by month
      return Array.from({ length: 12 }, (_, monthIndex) => {
        const monthData = mockWeatherHistory.filter(w => 
          w.date.getFullYear() === year && w.date.getMonth() === monthIndex
        );
        
        if (monthData.length === 0) {
          return {
            id: `climate-${year}-${monthIndex + 1}`,
            farmId: 'farm-1',
            year,
            month: monthIndex + 1,
            averageTemperature: 0,
            totalPrecipitation: 0,
            totalGDD: 0,
            frostDays: 0,
            heatStressDays: 0,
            precipitationDays: 0,
            averageHumidity: 0,
            averageWindSpeed: 0,
            extremeWeatherEvents: 0,
          };
        }
        
        const avgTemp = monthData.reduce((sum, w) => sum + w.temperature.current, 0) / monthData.length;
        const totalPrecip = monthData.reduce((sum, w) => sum + w.precipitation.amount, 0);
        
        return {
          id: `climate-${year}-${monthIndex + 1}`,
          farmId: 'farm-1',
          year,
          month: monthIndex + 1,
          averageTemperature: Math.round(avgTemp * 10) / 10,
          totalPrecipitation: Math.round(totalPrecip * 10) / 10,
          totalGDD: Math.round((avgTemp - 10) * monthData.length * 10) / 10,
          frostDays: monthData.filter(w => w.temperature.min < 0).length,
          heatStressDays: monthData.filter(w => w.temperature.max > 35).length,
          precipitationDays: monthData.filter(w => w.precipitation.amount > 1).length,
          averageHumidity: Math.round(monthData.reduce((sum, w) => sum + w.humidity, 0) / monthData.length),
          averageWindSpeed: Math.round(monthData.reduce((sum, w) => sum + w.wind.speed, 0) / monthData.length),
          extremeWeatherEvents: monthData.filter(w => 
            w.temperature.max > 35 || w.temperature.min < -5 || w.precipitation.amount > 25
          ).length,
        };
      });
    }
  }

  async getWeatherAnalytics(): Promise<WeatherAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const currentConditions = await this.getCurrentWeather();
    const forecast = await this.getWeatherForecast();
    const irrigationRecommendations = await this.getIrrigationRecommendations();
    
    // Monthly trends (last 12 months)
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthData = mockWeatherHistory.filter(w => 
        w.date.getMonth() === date.getMonth() && w.date.getFullYear() === date.getFullYear()
      );
      
      if (monthData.length === 0) {
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          avgTemperature: 0,
          totalPrecipitation: 0,
          gdd: 0,
          irrigationDays: 0,
        };
      }
      
      const avgTemp = monthData.reduce((sum, w) => sum + w.temperature.current, 0) / monthData.length;
      const totalPrecip = monthData.reduce((sum, w) => sum + w.precipitation.amount, 0);
      const gdd = monthData.reduce((sum, w) => sum + Math.max(0, w.temperature.current - 10), 0);
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        avgTemperature: Math.round(avgTemp * 10) / 10,
        totalPrecipitation: Math.round(totalPrecip * 10) / 10,
        gdd: Math.round(gdd * 10) / 10,
        irrigationDays: monthData.filter(w => w.precipitation.amount < 5).length,
      };
    }).reverse();
    
    // Seasonal comparison
    const currentYear = new Date().getFullYear();
    const seasons = ['Winter', 'Spring', 'Summer', 'Fall'];
    
    const seasonalComparison = seasons.map(season => {
      const currentYearData: ClimateData = {
        id: `season-${season}-${currentYear}`,
        farmId: 'farm-1',
        year: currentYear,
        averageTemperature: 15 + Math.random() * 15,
        totalPrecipitation: 50 + Math.random() * 100,
        totalGDD: 200 + Math.random() * 300,
        frostDays: season === 'Winter' ? Math.floor(Math.random() * 30) : 0,
        heatStressDays: season === 'Summer' ? Math.floor(Math.random() * 15) : 0,
        precipitationDays: Math.floor(Math.random() * 30),
        averageHumidity: 50 + Math.random() * 30,
        averageWindSpeed: 10 + Math.random() * 10,
        extremeWeatherEvents: Math.floor(Math.random() * 5),
      };
      
      const previousYearData: ClimateData = {
        ...currentYearData,
        id: `season-${season}-${currentYear - 1}`,
        year: currentYear - 1,
        averageTemperature: currentYearData.averageTemperature + (Math.random() - 0.5) * 4,
        totalPrecipitation: currentYearData.totalPrecipitation + (Math.random() - 0.5) * 50,
        totalGDD: currentYearData.totalGDD + (Math.random() - 0.5) * 100,
      };
      
      return {
        season,
        currentYear: currentYearData,
        previousYear: previousYearData,
        variance: {
          temperature: currentYearData.averageTemperature - previousYearData.averageTemperature,
          precipitation: currentYearData.totalPrecipitation - previousYearData.totalPrecipitation,
          gdd: currentYearData.totalGDD - previousYearData.totalGDD,
        },
      };
    });
    
    // Crop recommendations
    const cropRecommendations = [
      {
        crop: 'Tomatoes',
        suitability: 'excellent' as const,
        reasoning: 'Optimal temperature and humidity levels for tomato growth',
        recommendedActions: [
          'Continue current watering schedule',
          'Monitor for pest activity in warm conditions',
          'Prepare for potential heat stress protection',
        ],
      },
      {
        crop: 'Lettuce',
        suitability: 'good' as const,
        reasoning: 'Cool season crop suitable for current temperature range',
        recommendedActions: [
          'Plant in partially shaded areas',
          'Ensure consistent moisture',
          'Harvest before temperatures rise',
        ],
      },
      {
        crop: 'Peppers',
        suitability: 'fair' as const,
        reasoning: 'Temperature slightly below optimal range',
        recommendedActions: [
          'Use row covers for protection',
          'Consider greenhouse cultivation',
          'Wait for warmer weather to plant outdoors',
        ],
      },
    ];
    
    return {
      currentConditions,
      weeklyForecast: forecast.dailyForecast,
      activeAlerts: forecast.alerts,
      irrigationRecommendations,
      monthlyTrends,
      seasonalComparison,
      cropRecommendations,
    };
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  async refreshWeatherData(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // In real app, this would fetch fresh data from weather API
    console.log('Weather data refreshed');
  }

  async getWeatherStations(): Promise<Array<{ id: string; name: string; location: { lat: number; lng: number } }>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [
      {
        id: 'station-1',
        name: 'Farm Weather Station',
        location: { lat: 40.7128, lng: -74.0060 },
      },
      {
        id: 'station-2',
        name: 'Regional Airport',
        location: { lat: 40.7200, lng: -74.0100 },
      },
      {
        id: 'station-3',
        name: 'County Agricultural Center',
        location: { lat: 40.7050, lng: -74.0020 },
      },
    ];
  }
}

export const weatherService = new WeatherService();
