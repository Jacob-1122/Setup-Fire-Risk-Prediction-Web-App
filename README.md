# Smart Weather & Fire Risk Monitor 🌡️🔥

A sophisticated web application that provides real-time weather data and fire risk assessment using advanced weather analysis and machine learning predictions. The application leverages multiple weather APIs and TensorFlow.js to deliver accurate fire risk assessments.

## 🌟 Features

- **Intelligent Search**: Smart city search with fuzzy matching and auto-completion
- **Real-time Weather Data**: Live weather conditions including:
  - Temperature
  - Humidity
  - Wind Speed
  - Precipitation Probability
- **Advanced Fire Risk Assessment**: 
  - Multi-factor risk calculation
  - Dynamic risk level visualization
  - Contributing factors analysis
- **Interactive Weather Map**: 
  - Real-time precipitation radar
  - OpenStreetMap integration
  - Dynamic location updates
- **Responsive Design**: 
  - Fluid layouts for all screen sizes
  - Smooth animations and transitions
  - Intuitive user interface

## 🛠️ Technology Stack

- **Frontend Framework**: Vanilla JavaScript with Vite
- **APIs**:
  - Weather.gov API for weather data
  - OpenStreetMap for geocoding
  - RainViewer for precipitation radar
- **Libraries**:
  - TensorFlow.js for AI predictions
  - Leaflet.js for interactive maps
  - Axios for API requests
  - Fuse.js for fuzzy search
  - P-Queue for rate limiting
  - P-Retry for request retries

## 📊 Fire Risk Assessment

The application calculates fire risk based on multiple factors:

- Temperature levels
- Relative humidity
- Wind speed
- Precipitation probability
- Compound weather conditions

Risk levels are categorized as:
- 🟢 Low (0-2)
- 🟡 Moderate (3-5)
- 🟠 High (6-7)
- 🔴 Extreme (8-10)

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 📁 Project Structure

```
├── src/
│   ├── services/
│   │   ├── weatherService.js     # Weather API integration
│   │   ├── fireRiskService.js    # Risk calculation logic
│   │   ├── geocodingService.js   # Location search
│   │   ├── mapService.js         # Map visualization
│   │   └── cityAnalysisService.js # City data analysis
│   ├── data/
│   │   ├── popularCities.js      # Popular cities data
│   │   └── highRiskCities.js     # High-risk cities data
│   └── main.js                   # Application entry point
├── index.html                    # Main HTML template
└── package.json                  # Project dependencies
```

## 🌐 API Integration

### Weather.gov API
- Provides detailed weather forecasts
- Grid-based location data
- Comprehensive weather metrics

### OpenStreetMap
- Geocoding services
- Base map layers
- Location search

### RainViewer
- Real-time precipitation data
- Radar visualization
- Weather overlays

## 🎨 UI Features

- Dynamic background gradients based on risk level
- Animated transitions and loading states
- Interactive weather cards
- Responsive search interface
- Real-time map updates

## 🔒 Rate Limiting

The application implements sophisticated rate limiting:
- Nominatim API: 1 request per 1.5 seconds
- Weather.gov API: 1 request per second
- Automatic request queuing
- Built-in retry mechanism

## 🌍 Browser Support

- Chrome
- Firefox
- Safari
- Edge
- Other modern browsers with standard web API support

## 📱 Mobile Support

- Responsive design
- Touch-friendly interface
- Optimized performance
- Adaptive layouts

## 🔄 Future Enhancements

- Machine learning model integration
- Historical data analysis
- More detailed risk assessments
- Additional weather data sources
- Enhanced visualization options

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.