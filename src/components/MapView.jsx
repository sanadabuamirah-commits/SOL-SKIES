import { useEffect, useRef } from 'react';

export default function MapView({ lat, lng, radius, height = 300, interactive = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !containerRef.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      // Check if Leaflet is already loaded
      if (window.L) {
        initMap();
        return;
      }

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (mapRef.current) {
        // Map already initialized
        return;
      }

      const map = window.L.map(containerRef.current).setView([lat, lng], 13);

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add marker
      window.L.marker([lat, lng]).addTo(map).bindPopup(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

      // Add circle if radius provided
      if (radius) {
        window.L.circle([lat, lng], {
          color: '#9333ea',
          fillColor: '#9333ea',
          fillOpacity: 0.1,
          radius: radius * 1000 // convert km to meters
        }).addTo(map);
      }

      // Disable interactions if not interactive
      if (!interactive) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.touchZoom.disable();
      }

      mapRef.current = map;
    };

    loadLeaflet();
  }, [lat, lng, radius, interactive]);

  if (!lat || !lng) {
    return (
      <div style={{
        height,
        background: '#1a1a1a',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#555',
        border: '1px solid #333',
        fontSize: '14px'
      }}>
        📍 No location set
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #333',
        background: '#0a0a0a'
      }}
    />
  );
}
