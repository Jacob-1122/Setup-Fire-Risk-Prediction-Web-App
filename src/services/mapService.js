let map = null;

export function initializeMap(lat, lon) {
  if (map) {
    map.remove();
  }

  map = L.map('map-container').setView([lat, lon], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/nowcast/{z}/{x}/{y}/256/2/1_1/rgb/5/1_1.png', {
    opacity: 0.6
  });
  
  radarLayer.addTo(map);
}

export function updateMap(lat, lon) {
  if (!map) {
    initializeMap(lat, lon);
  } else {
    map.setView([lat, lon], 8);
  }
}