import axios from 'axios';

export function calculateFireRisk(weatherData) {
  const factors = [];
  let riskScore = 0;

  // Temperature impact
  if (weatherData.temperature > 100) {
    riskScore += 4;
    factors.push('Dangerous high temperature');
  } else if (weatherData.temperature > 90) {
    riskScore += 3;
    factors.push('Very high temperature');
  } else if (weatherData.temperature > 80) {
    riskScore += 2;
    factors.push('High temperature');
  } else if (weatherData.temperature > 70) {
    riskScore += 1;
    factors.push('Moderate temperature');
  }

  // Humidity impact
  if (weatherData.relativeHumidity < 15) {
    riskScore += 3;
    factors.push('Critically low humidity');
  } else if (weatherData.relativeHumidity < 25) {
    riskScore += 2;
    factors.push('Very low humidity');
  } else if (weatherData.relativeHumidity < 35) {
    riskScore += 1;
    factors.push('Low humidity');
  }

  // Wind speed impact
  if (weatherData.windSpeed > 30) {
    riskScore += 3;
    factors.push('Extreme wind speeds');
  } else if (weatherData.windSpeed > 20) {
    riskScore += 2;
    factors.push('Strong winds');
  } else if (weatherData.windSpeed > 10) {
    riskScore += 1;
    factors.push('Moderate winds');
  }

  // Precipitation impact
  if (weatherData.precipitation >= 80) {
    riskScore -= 3;
    factors.push('Very high precipitation chance (reducing risk)');
  } else if (weatherData.precipitation >= 60) {
    riskScore -= 2;
    factors.push('High precipitation chance (reducing risk)');
  } else if (weatherData.precipitation >= 40) {
    riskScore -= 1;
    factors.push('Moderate precipitation chance (reducing risk)');
  } else if (weatherData.precipitation < 20) {
    riskScore += 1;
    factors.push('Very low precipitation chance');
  }

  // Compound risk factors
  if (weatherData.temperature > 90 && weatherData.relativeHumidity < 20 && weatherData.windSpeed > 15) {
    riskScore += 2;
    factors.push('Multiple high-risk conditions present');
  }

  if (weatherData.temperature > 85 && weatherData.precipitation < 10) {
    riskScore += 1;
    factors.push('Hot and dry conditions');
  }

  riskScore = Math.max(0, Math.min(10, riskScore));

  let riskLevel;
  if (riskScore >= 8) {
    riskLevel = 'Extreme';
  } else if (riskScore >= 6) {
    riskLevel = 'High';
  } else if (riskScore >= 3) {
    riskLevel = 'Moderate';
  } else {
    riskLevel = 'Low';
  }

  return { riskLevel, score: riskScore, factors };
}

export function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'Low': return '#22c55e';
    case 'Moderate': return '#eab308';
    case 'High': return '#f97316';
    case 'Extreme': return '#ef4444';
    default: return '#6b7280';
  }
}