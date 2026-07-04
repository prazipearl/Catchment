import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const BACKEND_URL = 'http://localhost:5000';

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

function getAllocation(hasGarden, wantsDrinking) {
  if (!hasGarden && !wantsDrinking) {
    return [
      { label: 'Recharge', percent: 50, color: '#1C7C97', icon: 'droplet' },
      { label: 'Indoor use', percent: 50, color: '#E8A33D', icon: 'tap' },
    ];
  }
  if (hasGarden && !wantsDrinking) {
    return [
      { label: 'Recharge', percent: 30, color: '#1C7C97', icon: 'droplet' },
      { label: 'Irrigation', percent: 40, color: '#4FA37B', icon: 'leaf' },
      { label: 'Indoor use', percent: 30, color: '#E8A33D', icon: 'tap' },
    ];
  }
  return [
    { label: 'Recharge', percent: 25, color: '#1C7C97', icon: 'droplet' },
    { label: 'Irrigation', percent: 35, color: '#4FA37B', icon: 'leaf' },
    { label: 'Indoor use', percent: 25, color: '#E8A33D', icon: 'tap' },
    { label: 'Drinking', percent: 15, color: '#7C5CBF', icon: 'glass' },
  ];
}

const ICONS = {
  droplet: 'M12 2C12 2 5 11 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 11 12 2 12 2Z',
  tap: 'M6 3H10V6H14V3H18V8H14V11H10V8H6V3ZM10 13H14V21H10V13Z',
  leaf: 'M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z',
  glass: 'M5 2L6.5 21C6.6 21.6 7.1 22 7.7 22H16.3C16.9 22 17.4 21.6 17.5 21L19 2H5ZM7.2 4H16.8L16.1 12H7.9L7.2 4Z',
};

function GaugeIcon({ type, size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={ICONS[type]} />
    </svg>
  );
}

function App() {
  const [roofArea, setRoofArea] = useState('');
  const [position, setPosition] = useState(null);
  const [hasGarden, setHasGarden] = useState(false);
  const [wantsDrinking, setWantsDrinking] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showGauges, setShowGauges] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setShowGauges(true), 100);
      return () => clearTimeout(t);
    } else {
      setShowGauges(false);
    }
  }, [result]);

  async function fetchHistory() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/assessments`);
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history', error);
    }
  }

  async function calculateHarvest() {
    if (!position) {
      alert('Please click a location on the map first.');
      return;
    }

    setLoading(true);
    setShowGauges(false);

    const today = new Date().toISOString().split('T')[0];
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const startDate = lastYear.toISOString().split('T')[0];

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${position.lat}&longitude=${position.lng}&start_date=${startDate}&end_date=${today}&daily=precipitation_sum&timezone=auto`;

    const response = await fetch(url);
    const data = await response.json();

    const totalRainfallMM = data.daily.precipitation_sum.reduce(
      (sum, day) => sum + (day || 0),
      0
    );

    const runoffCoefficient = 0.85;
    const area = parseFloat(roofArea);
    const litersHarvested = area * totalRainfallMM * runoffCoefficient;

    const allocation = getAllocation(hasGarden, wantsDrinking).map((item) => ({
      ...item,
      liters: (litersHarvested * item.percent) / 100,
    }));

    setResult({ litersHarvested, totalRainfallMM, allocation });

    try {
      await fetch(`${BACKEND_URL}/api/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roofArea: area,
          latitude: position.lat,
          longitude: position.lng,
          totalRainfallMM,
          litersHarvested,
          hasGarden,
          wantsDrinking,
        }),
      });
      fetchHistory();
    } catch (error) {
      console.error('Failed to save assessment', error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7F6' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur border-b" style={{ backgroundColor: 'rgba(245,247,246,0.85)', borderColor: '#DCE4E2' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0B4F6C' }}>
            <GaugeIcon type="droplet" size={16} color="#fff" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-none" style={{ fontFamily: 'Space Grotesk', color: '#0B4F6C' }}>
              Catchment
            </h1>
            <p className="text-xs" style={{ color: '#6B7B80' }}>Rooftop rainwater assessment</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="px-6 py-14"
        style={{ background: 'linear-gradient(135deg, #0B4F6C 0%, #1C7C97 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-semibold text-white max-w-xl leading-tight"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            How much rain could your roof save this monsoon?
          </h2>
          <p className="mt-3 text-sm max-w-md" style={{ color: '#B9E0EA' }}>
            Click your location, enter your roof area, and get a sizing estimate — the same math a hydrologist would use, sized for your actual roof.
          </p>
        </div>
      </section>

      {/* Main card */}
      <main className="max-w-4xl mx-auto px-6 -mt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8" style={{ boxShadow: '0 8px 30px rgba(11,79,108,0.12)' }}>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6B7B80' }}>
                Roof area (m²)
              </label>
              <input
                type="number"
                value={roofArea}
                onChange={(e) => setRoofArea(e.target.value)}
                placeholder="e.g. 100"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#DCE4E2', '--tw-ring-color': '#1C7C97' }}
              />
            </div>

            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-sm" style={{ color: '#3A4A50' }}>
                <input type="checkbox" checked={hasGarden} onChange={(e) => setHasGarden(e.target.checked)} />
                I have a garden
              </label>
              <label className="flex items-center gap-2 text-sm" style={{ color: '#3A4A50' }}>
                <input type="checkbox" checked={wantsDrinking} onChange={(e) => setWantsDrinking(e.target.checked)} />
                I want drinking-quality water
              </label>
            </div>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6B7B80' }}>
            Click your location on the map
          </label>
          <div className="h-80 w-full rounded-xl overflow-hidden mb-2 border" style={{ borderColor: '#DCE4E2' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <LocationPicker onSelect={setPosition} />
              {position && <Marker position={position} />}
            </MapContainer>
          </div>
          {position && (
            <p className="text-xs mb-6" style={{ color: '#8B9A9E' }}>
              Selected: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          )}

          <button
            onClick={calculateHarvest}
            disabled={loading}
            className="w-full text-white font-medium py-3 rounded-lg transition-all text-sm"
            style={{ backgroundColor: loading ? '#EFC98A' : '#E8A33D' }}
          >
            {loading ? 'Fetching rainfall data...' : 'Calculate harvesting potential'}
          </button>

          {result !== null && (
            <div className="mt-8 pt-8 border-t" style={{ borderColor: '#DCE4E2' }}>
              <p className="text-sm" style={{ color: '#6B7B80' }}>
                Based on <strong style={{ color: '#0B4F6C' }}>{result.totalRainfallMM.toFixed(0)}mm</strong> of rain over the last year
              </p>
              <p className="text-4xl font-semibold mt-1" style={{ fontFamily: 'Space Grotesk', color: '#0B4F6C' }}>
                {result.litersHarvested.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                <span className="text-base font-normal ml-2" style={{ color: '#8B9A9E' }}>/ year</span>
              </p>

              <p className="text-xs font-semibold uppercase tracking-wide mt-8 mb-4" style={{ color: '#6B7B80' }}>
                Where this water could go
              </p>

              <div className="flex gap-4 md:gap-6 justify-center flex-wrap">
                {result.allocation.map((item) => (
                  <div key={item.label} className="flex flex-col items-center" style={{ width: 76 }}>
                    <div
                      className="relative w-11 rounded-b-lg overflow-hidden"
                      style={{ height: 120, backgroundColor: '#EEF2F1', border: '1px solid #DCE4E2' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all ease-out"
                        style={{
                          height: showGauges ? `${item.percent}%` : '0%',
                          backgroundColor: item.color,
                          transitionDuration: '900ms',
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <GaugeIcon type={item.icon} size={13} color={item.color} />
                      <span className="text-xs font-medium" style={{ color: '#3A4A50' }}>{item.percent}%</span>
                    </div>
                    <span className="text-[11px] text-center mt-0.5" style={{ color: '#8B9A9E' }}>{item.label}</span>
                    <span className="text-[11px] font-medium" style={{ color: '#3A4A50' }}>
                      {Math.round(item.liters).toLocaleString()} L
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: '#DCE4E2' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B7B80' }}>
                Past assessments
              </p>
              <ul className="space-y-2">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className="text-sm flex justify-between px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: '#F5F7F6', color: '#3A4A50' }}
                  >
                    <span>{item.roofArea}m² roof</span>
                    <span className="font-medium">{Math.round(item.litersHarvested).toLocaleString()} L</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;