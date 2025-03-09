import axios from 'axios';
import PQueue from 'p-queue';
import retry from 'p-retry';
import { getWeatherData, getGridData } from './weatherService.js';
import { calculateFireRisk } from './fireRiskService.js';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const CITIES_PER_STATE = 5;
const CACHE_DURATION = 15 * 60 * 1000;
const BATCH_SIZE = 2;
const BATCH_INTERVAL = 2000;

const HIGH_RISK_STATES = ['Texas', 'Arizona', 'New Mexico'];

const cache = new Map();

const nominatimQueue = new PQueue({
  concurrency: 1,
  interval: 1500,
  intervalCap: 1
});

const weatherQueue = new PQueue({
  concurrency: 1,
  interval: 1000,
  intervalCap: 1
});

async function fetchStateCities(state) {
  const cacheKey = `cities-${state}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  return nominatimQueue.add(async () => {
    try {
      const response = await retry(
        async () => {
          const result = await axios.get(NOMINATIM_API, {
            params: {
              country: 'usa',
              state,
              format: 'json',
              addressdetails: 1,
              limit: 25,
              featuretype: 'city'
            },
            headers: {
              'User-Agent': 'SmartWeatherMonitor/1.0'
            }
          });
          if (!result.data || !Array.isArray(result.data)) {
            throw new Error('Invalid response format');
          }
          return result;
        },
        { retries: 3, minTimeout: 2000 }
      );

      const cities = response.data
        .filter(place => 
          place.address &&
          place.address.state === state &&
          (place.address.city || place.address.town) &&
          !isNaN(place.lat) &&
          !isNaN(place.lon)
        )
        .map(place => ({
          name: place.address.city || place.address.town,
          state: place.address.state,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon)
        }))
        .slice(0, CITIES_PER_STATE);

      cache.set(cacheKey, { data: cities, timestamp: Date.now() });
      return cities;
    } catch (error) {
      console.error(`Error fetching cities for ${state}:`, error);
      return [];
    }
  });
}

async function analyzeCityRisk(city) {
  const cacheKey = `weather-${city.name}-${city.state}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  return weatherQueue.add(async () => {
    try {
      const gridResponse = await retry(
        () => getGridData(city.lat, city.lon),
        { retries: 2 }
      );
      
      const { gridX, gridY, gridId: office } = gridResponse.data.properties;
      
      const weatherData = await retry(
        () => getWeatherData(office, gridX, gridY),
        { retries: 2 }
      );
      
      const risk = calculateFireRisk(weatherData);

      const result = {
        ...city,
        weatherData,
        risk,
        gridInfo: { office, gridX, gridY }
      };

      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error(`Error analyzing ${city.name}, ${city.state}:`, error);
      return null;
    }
  });
}

async function processCitiesBatch(cities, startIndex = 0) {
  if (startIndex >= cities.length) return [];

  const batch = cities.slice(startIndex, startIndex + BATCH_SIZE);
  const results = await Promise.all(
    batch.map(city => analyzeCityRisk(city).catch(() => null))
  );

  await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
  
  return [...results, ...(await processCitiesBatch(cities, startIndex + BATCH_SIZE))];
}

export async function analyzeHighRiskCities() {
  try {
    const container = document.getElementById('highRiskCities');
    if (!container) return [];

    container.innerHTML = '<div class="loading-spinner"></div>';

    const allCities = [];
    for (const state of HIGH_RISK_STATES) {
      const cities = await fetchStateCities(state);
      allCities.push(...cities);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allCities.length === 0) {
      container.innerHTML = '<div>No cities found. Please try again later.</div>';
      return [];
    }

    const results = await processCitiesBatch(allCities);
    const highRiskCities = results
      .filter(result => 
        result && 
        (result.risk.riskLevel === 'High' || result.risk.riskLevel === 'Extreme')
      )
      .sort((a, b) => b.risk.score - a.risk.score)
      .slice(0, 6);

    if (highRiskCities.length === 0) {
      container.innerHTML = '<div>No high-risk cities found at this time.</div>';
      return [];
    }

    return highRiskCities;
  } catch (error) {
    console.error('Error analyzing high risk cities:', error);
    const container = document.getElementById('highRiskCities');
    if (container) {
      container.innerHTML = '<div>Error loading high risk cities. Please try again later.</div>';
    }
    return [];
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
}, CACHE_DURATION);

setInterval(() => {
  analyzeHighRiskCities().catch(console.error);
}, CACHE_DURATION * 2);