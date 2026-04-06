import { useState, useEffect, useRef } from 'react';

export default function AddressAutocomplete({
  value = '',
  onChange = () => {},
  placeholder = 'Search address or enter coordinates...'
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchAddresses(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const fetchAddresses = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sol Skies App / 1.0'
          }
        }
      );
      const data = await response.json();
      setResults(data || []);
      setShowResults(data && data.length > 0);
    } catch (err) {
      console.error('Address search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (result) => {
    const address = result.address || {};
    const displayName = result.display_name || '';

    onChange({
      address: displayName,
      displayName: displayName,
      city: address.city || address.town || address.village || '',
      country: address.country || '',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    });

    setQuery(displayName);
    setShowResults(false);
    setManualCoordinates(false);
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    onChange({
      address: `${lat}, ${lng}`,
      displayName: `${lat}, ${lng}`,
      city: '',
      country: '',
      lat,
      lng
    });

    setQuery(`${lat}, ${lng}`);
    setManualCoordinates(false);
    setManualLat('');
    setManualLng('');
    setShowResults(false);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%'
    }}>
      <style>{`
        .address-input {
          width: 100%;
          padding: 12px 16px;
          background: #111;
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .address-input:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
        }
        .address-input::placeholder {
          color: #666;
        }
        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #111;
          border: 1px solid #333;
          border-top: none;
          border-radius: 0 0 8px 8px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 1000;
          margin-top: -1px;
        }
        .dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .dropdown::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 3px;
        }
        .dropdown-item {
          padding: 12px 16px;
          border-bottom: 1px solid #222;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background: #1a1a1a;
        }
        .dropdown-item-name {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .dropdown-item-country {
          color: #666;
          font-size: 12px;
        }
      `}</style>

      {!manualCoordinates ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            placeholder={placeholder}
            className="address-input"
          />

          {loading && (
            <div style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              fontSize: '14px'
            }}>
              ⏳
            </div>
          )}

          {showResults && results.length > 0 && (
            <div className="dropdown">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="dropdown-item"
                  onClick={() => handleSelectAddress(result)}
                >
                  <div className="dropdown-item-name">
                    {result.display_name?.substring(0, 60)}
                    {(result.display_name?.length || 0) > 60 ? '...' : ''}
                  </div>
                  {result.address?.country && (
                    <div className="dropdown-item-country">
                      {result.address.country}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setManualCoordinates(true)}
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'transparent',
              border: '1px solid #333',
              color: '#888',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#9333ea';
              e.target.style.color = '#9333ea';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#333';
              e.target.style.color = '#888';
            }}
          >
            📍 Use coordinates manually
          </button>
        </>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: '#888',
                fontSize: '12px',
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="e.g., 40.7128"
                className="address-input"
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                color: '#888',
                fontSize: '12px',
                marginBottom: '4px',
                fontWeight: '500'
              }}>
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="e.g., -74.0060"
                className="address-input"
              />
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                setManualCoordinates(false);
                setManualLat('');
                setManualLng('');
              }}
              style={{
                padding: '10px 16px',
                background: '#222',
                border: '1px solid #333',
                color: '#888',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#444';
                e.target.style.color = '#aaa';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#333';
                e.target.style.color = '#888';
              }}
            >
              Back
            </button>
            <button
              onClick={handleManualSubmit}
              style={{
                padding: '10px 16px',
                background: '#9333ea',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#a855f7';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#9333ea';
              }}
            >
              Confirm
            </button>
          </div>
        </>
      )}
    </div>
  );
}
