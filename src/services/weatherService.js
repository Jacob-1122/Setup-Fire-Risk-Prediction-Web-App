import axios from 'axios';

const WEATHER_API = 'https://api.weather.gov';

// Create axios instance with default headers
const weatherApi = axios.create({
  headers: {
    'User-Agent': '(Smart Weather & Fire Risk Monitor, contact@example.com)',
  }
});

// Retry logic
async function retryRequest(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // If rate limited, wait longer
    const waitTime = error.response?.status === 429 
      ? parseInt(error.response.headers['retry-after'] || '30') * 1000 
      : delay;
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return retryRequest(fn, retries - 1, delay * 2);
  }
}

export async function getWeatherData(office, gridX, gridY) {
  return retryRequest(async () => {
    try {
      const response = await weatherApi.get(
        `${WEATHER_API}/gridpoints/${office}/${gridX},${gridY}/forecast`
      );
      
      const currentPeriod = response.data.properties.periods[0];
      
      return {
        temperature: Number(currentPeriod.temperature),
        relativeHumidity: Number(currentPeriod.relativeHumidity?.value || 0),
        windSpeed: Number(currentPeriod.windSpeed.split(' ')[0]),
        precipitation: Number(currentPeriod.probabilityOfPrecipitation?.value || 0),
        shortForecast: currentPeriod.shortForecast,
        detailedForecast: currentPeriod.detailedForecast,
        name: currentPeriod.name,
        startTime: currentPeriod.startTime,
        isDaytime: currentPeriod.isDaytime
      };
    } catch (error) {
      console.error('Weather API Error:', error.response?.data || error.message);
      throw new Error('Failed to fetch weather data');
    }
  });
}

export async function getGridData(lat, lon) {
  return retryRequest(async () => {
    try {
      return await weatherApi.get(`${WEATHER_API}/points/${lat},${lon}`);
    } catch (error) {
      console.error('Grid API Error:', error.response?.data || error.message);
      throw error;
    }
  });
}