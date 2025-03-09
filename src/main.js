import { getWeatherData, getGridData } from './services/weatherService.js';
import { searchCity } from './services/geocodingService.js';
import { calculateFireRisk, getRiskColor } from './services/fireRiskService.js';
import { initializeMap, updateMap } from './services/mapService.js';
import { analyzeHighRiskCities } from './services/cityAnalysisService.js';
import { popularCities } from './data/popularCities.js';

let searchTimeout;
const citySearch = document.getElementById('citySearch');
const searchResults = document.getElementById('searchResults');
const weatherContainer = document.getElementById('weatherContainer');

function showSearchLoading() {
  searchResults.innerHTML = '<div class="search-result-item">Searching...</div>';
  searchResults.style.display = 'block';
}

function showSearchError() {
  searchResults.innerHTML = '<div class="search-result-item">No cities found. Please try again.</div>';
  searchResults.style.display = 'block';
}

async function initializePopularCities() {
  const popularCitiesContainer = document.getElementById('popularCities');
  
  for (const city of popularCities) {
    try {
      const response = await getGridData(city.lat, city.lon);
      const { properties } = response.data;
      const weatherData = await getWeatherData(
        properties.gridId,
        properties.gridX,
        properties.gridY
      );

      const cityCard = document.createElement('div');
      cityCard.className = 'city-card';
      cityCard.innerHTML = `
        <div class="city-name">${city.name}, ${city.state}</div>
        <div class="city-info">
          <div>🌡️ ${weatherData.temperature}°F</div>
          <div>☁️ ${weatherData.shortForecast}</div>
        </div>
      `;

      cityCard.addEventListener('click', () => {
        handlePopularCityClick(city);
      });

      popularCitiesContainer.appendChild(cityCard);
    } catch (error) {
      console.error(`Error fetching data for ${city.name}:`, error);
    }
  }
}

async function initializeHighRiskCities() {
  const container = document.getElementById('highRiskCities');
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const highRiskCities = await analyzeHighRiskCities();
    
    container.innerHTML = highRiskCities.map(city => {
      const riskColor = getRiskColor(city.risk.riskLevel);
      return `
        <div class="city-card" data-city='${JSON.stringify({
          value: city.gridInfo,
          label: `${city.name}, ${city.state}`,
          coordinates: `${city.lat}° N, ${city.lon}° W`,
          lat: city.lat,
          lon: city.lon
        })}'>
          <div class="city-name">${city.name}, ${city.state}</div>
          <div class="city-info">
            <div>🌡️ ${city.weatherData.temperature}°F</div>
            <div>💨 ${city.weatherData.windSpeed} mph</div>
            <div>💧 ${city.weatherData.relativeHumidity}% humidity</div>
            <div style="color: ${riskColor}; font-weight: bold; margin-top: 0.5rem">
              ${city.risk.riskLevel} Risk (${city.risk.score}/10)
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.city-card').forEach(card => {
      card.addEventListener('click', async () => {
        try {
          const cityData = JSON.parse(card.dataset.city);
          document.getElementById('coordinates').textContent = `Coordinates: ${cityData.coordinates}`;
          document.getElementById('citySearch').value = cityData.label;

          const weatherData = await getWeatherData(
            cityData.value.office,
            cityData.value.gridX,
            cityData.value.gridY
          );
          
          updateWeatherDisplay(weatherData, cityData);
          updateMap(cityData.lat, cityData.lon);
        } catch (error) {
          console.error('Error handling city selection:', error);
          alert('Failed to fetch weather data. Please try again.');
        }
      });
    });
  } catch (error) {
    console.error('Error initializing high risk cities:', error);
    container.innerHTML = '<div class="error">Failed to load high risk cities. Please try again later.</div>';
  }
}

async function handlePopularCityClick(city) {
  try {
    const response = await getGridData(city.lat, city.lon);
    const { properties } = response.data;
    
    const cityData = {
      value: {
        office: properties.gridId,
        gridX: properties.gridX,
        gridY: properties.gridY
      },
      label: `${city.name}, ${city.state}`,
      coordinates: `${city.lat}° N, ${city.lon}° W`,
      lat: city.lat,
      lon: city.lon
    };

    document.getElementById('coordinates').textContent = `Coordinates: ${cityData.coordinates}`;
    document.getElementById('citySearch').value = cityData.label;

    const weatherData = await getWeatherData(
      cityData.value.office,
      cityData.value.gridX,
      cityData.value.gridY
    );
    
    updateWeatherDisplay(weatherData, cityData);
    updateMap(city.lat, city.lon);
  } catch (error) {
    alert('Failed to fetch weather data. Please try again.');
  }
}

function updateWeatherDisplay(weatherData, cityData) {
  const currentConditions = document.getElementById('currentConditions');
  const forecastDetails = document.getElementById('forecastDetails');
  const fireRiskElement = document.getElementById('fireRisk');
  
  currentConditions.innerHTML = `
    <div class="weather-item">
      <span class="weather-icon">🌡️</span>
      <span>Temperature: ${weatherData.temperature}°F</span>
    </div>
    <div class="weather-item">
      <span class="weather-icon">💧</span>
      <span>Humidity: ${weatherData.relativeHumidity}%</span>
    </div>
    <div class="weather-item">
      <span class="weather-icon">💨</span>
      <span>Wind Speed: ${weatherData.windSpeed} mph</span>
    </div>
    <div class="weather-item">
      <span class="weather-icon">🌧️</span>
      <span>Precipitation: ${weatherData.precipitation}%</span>
    </div>
  `;

  forecastDetails.innerHTML = `
    <div class="weather-item">${weatherData.shortForecast}</div>
    <div style="margin-top: 1rem">${weatherData.detailedForecast}</div>
  `;

  const risk = calculateFireRisk(weatherData);
  const riskColor = getRiskColor(risk.riskLevel);
  
  document.body.className = `risk-${risk.riskLevel.toLowerCase()}`;
  
  fireRiskElement.innerHTML = `
    <div class="risk-level" style="color: ${riskColor}">${risk.riskLevel} Risk Level</div>
    <div class="risk-bar">
      <div class="risk-bar-fill" style="width: ${(risk.score / 10) * 100}%; background-color: ${riskColor}"></div>
    </div>
    <h3>Contributing Factors:</h3>
    <ul class="factors-list">
      ${risk.factors.map((factor, index) => `
        <li style="animation-delay: ${index * 0.1}s">${factor}</li>
      `).join('')}
    </ul>
  `;

  weatherContainer.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.style.display = 'none';
  }
});

citySearch.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const input = e.target.value.trim();
  
  if (input.length < 2) {
    searchResults.style.display = 'none';
    return;
  }

  showSearchLoading();

  searchTimeout = setTimeout(async () => {
    try {
      const cities = await searchCity(input);
      
      if (!cities || cities.length === 0) {
        showSearchError();
        return;
      }

      searchResults.innerHTML = cities
        .map(city => {
          if (!city) return '';
          try {
            return `
              <div class="search-result-item" data-city='${JSON.stringify(city)}'>
                ${city.label}
              </div>
            `;
          } catch (err) {
            console.warn('Error stringifying city data:', err);
            return '';
          }
        })
        .filter(Boolean)
        .join('');
      
      searchResults.style.display = 'block';
    } catch (error) {
      console.error('Search error:', error);
      showSearchError();
    }
  }, 300);
});

searchResults.addEventListener('click', async (e) => {
  const cityItem = e.target.closest('.search-result-item');
  if (!cityItem || !cityItem.dataset.city) return;

  try {
    const cityData = JSON.parse(cityItem.dataset.city);
    if (!cityData) return;

    document.getElementById('coordinates').textContent = `Coordinates: ${cityData.coordinates}`;
    searchResults.style.display = 'none';
    citySearch.value = cityData.label;

    const weatherData = await getWeatherData(
      cityData.value.office,
      cityData.value.gridX,
      cityData.value.gridY
    );
    updateWeatherDisplay(weatherData, cityData);
    
    if (cityData.lat && cityData.lon) {
      updateMap(cityData.lat, cityData.lon);
    } else {
      const [lat, lon] = cityData.coordinates
        .split(',')
        .map(coord => parseFloat(coord.replace('° N', '').replace('° W', '')));
      updateMap(lat, -Math.abs(lon));
    }
  } catch (error) {
    console.error('Error handling city selection:', error);
    alert('Failed to fetch weather data. Please try again.');
  }
});

initializePopularCities();
initializeHighRiskCities();