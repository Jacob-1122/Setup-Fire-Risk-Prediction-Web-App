import axios from 'axios';
import Fuse from 'fuse.js';
import { getGridData } from './weatherService.js';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

const geocodingApi = axios.create({
  headers: {
    'User-Agent': 'SmartWeatherMonitor/1.0',
    'Accept-Language': 'en-US,en;q=0.9'
  },
  timeout: 10000
});

const rateLimiter = {
  lastRequest: 0,
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }
};

function createFuzzyMatcher(cities) {
  return new Fuse(cities, {
    keys: ['name'],
    threshold: 0.3,
    distance: 100,
    includeScore: true
  });
}

export async function searchCity(input) {
  try {
    await rateLimiter.throttle();

    const cleanInput = input.trim().replace(/[^\w\s,-]/g, '');
    
    const response = await geocodingApi.get(NOMINATIM_API, {
      params: {
        q: cleanInput,
        format: 'jsonv2',
        addressdetails: 1,
        limit: 50, // Request more results for better filtering
        countrycodes: 'us',
        'accept-language': 'en',
        featuretype: ['city', 'town', 'village', 'suburb', 'neighbourhood'].join(',')
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    // Extract and prepare cities for fuzzy matching
    const cities = response.data
      .filter(place => 
        place.address &&
        place.address.country === 'United States' &&
        (place.address.city || place.address.town || place.address.village || place.address.suburb)
      )
      .map(place => ({
        name: place.address.city || place.address.town || place.address.village || place.address.suburb,
        state: place.address.state,
        lat: Number(place.lat),
        lon: Number(place.lon),
        place
      }));

    // Create fuzzy matcher
    const fuse = createFuzzyMatcher(cities);
    
    // Get best matches
    const matches = fuse.search(cleanInput)
      .slice(0, 5) // Take top 5 matches
      .map(result => result.item);

    // Process matches to get weather grid data
    const results = await Promise.all(
      matches.map(async (city) => {
        try {
          await rateLimiter.throttle();
          
          if (isNaN(city.lat) || isNaN(city.lon)) {
            return null;
          }

          const gridResponse = await getGridData(city.lat, city.lon);
          const { gridX, gridY, gridId: office } = gridResponse.data.properties;

          return {
            value: { office, gridX, gridY },
            label: `${city.name}, ${city.state}`,
            coordinates: `${city.lat.toFixed(4)}° N, ${city.lon.toFixed(4)}° W`,
            lat: city.lat,
            lon: city.lon
          };
        } catch (error) {
          console.warn(`Failed to process city data:`, error.message);
          return null;
        }
      })
    );

    return results.filter(Boolean);
  } catch (error) {
    console.error('City search error:', error.message);
    return [];
  }
}