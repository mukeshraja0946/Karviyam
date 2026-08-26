import React, { useState, useEffect } from 'react';
import { MapPin, X, Check, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryLocationModal({ isOpen, onClose, currentPincode, onSelectLocation }) {
  const [pincode, setPincode] = useState(() => currentPincode || localStorage.getItem('karviyam_user_pincode') || '600001');
  const [city, setCity] = useState(() => localStorage.getItem('karviyam_user_city') || 'Chennai, Tamil Nadu');
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedLocation, setDetectedLocation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const savedPin = currentPincode || localStorage.getItem('karviyam_user_pincode') || '600001';
      const savedCity = localStorage.getItem('karviyam_user_city') || 'Chennai, Tamil Nadu';
      setPincode(savedPin);
      setCity(savedCity);
      setError('');
      setDetectedLocation(null);
    }
  }, [isOpen, currentPincode]);

  if (!isOpen) return null;

  const handleApplyPincode = async (e) => {
    if (e) e.preventDefault();
    const cleanPin = String(pincode || '').trim().replace(/\D/g, '');
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setError('');
    setLoading(true);

    let targetCity = city;

    // Lookup city/district from Indian postal API if available
    try {
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
      const pinData = await pinRes.json();
      if (pinData && pinData[0] && pinData[0].Status === 'Success' && pinData[0].PostOffice?.length > 0) {
        const po = pinData[0].PostOffice[0];
        const dist = po.District || po.Block || po.Circle || '';
        const st = po.State || '';
        if (dist || st) {
          targetCity = dist && st ? `${dist}, ${st}` : (dist || st);
        }
      }
    } catch (ePin) {}

    if (!targetCity || targetCity === 'Detected Location' || targetCity === 'Chennai, Tamil Nadu') {
      targetCity = `PIN ${cleanPin}`;
    }

    setCity(targetCity);

    // Save to local storage for global persistence across mobile/desktop header, PDP, checkout
    localStorage.setItem('karviyam_user_pincode', cleanPin);
    localStorage.setItem('karviyam_user_city', targetCity);
    
    window.dispatchEvent(new CustomEvent('karviyam_location_updated', { detail: { pincode: cleanPin, city: targetCity } }));
    window.dispatchEvent(new Event('storage'));

    setLoading(false);
    if (onSelectLocation) {
      onSelectLocation(cleanPin, targetCity);
    }
    toast.success(`Delivery location updated to ${targetCity} (${cleanPin})`);
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter your PIN code manually.');
      return;
    }

    setDetecting(true);
    setError('');
    setDetectedLocation(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Primary Reverse Geocoder: OpenStreetMap Nominatim API
          let detectedPin = '';
          let detectedCityName = '';
          let detectedStateName = '';

          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
              { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
            );
            const nomData = await nomRes.json();
            const addr = nomData?.address || {};

            detectedPin = addr.postcode ? String(addr.postcode).replace(/\D/g, '') : '';
            detectedCityName = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state_district || 'Detected Location';
            detectedStateName = addr.state || '';
          } catch (eNom) {
            console.warn('⚠️ Nominatim reverse geocode warning:', eNom.message);
          }

          // Secondary Fallback: BigDataCloud Reverse Geocode Client API
          if (!detectedPin || detectedPin.length !== 6) {
            try {
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
              );
              const bdcData = await bdcRes.json();
              if (bdcData?.postcode) {
                const cleanBdcPin = String(bdcData.postcode).replace(/\D/g, '');
                if (cleanBdcPin.length === 6) detectedPin = cleanBdcPin;
              }
              if (!detectedCityName || detectedCityName === 'Detected Location') {
                detectedCityName = bdcData.city || bdcData.locality || bdcData.principalSubdivision || 'Detected Location';
              }
              if (!detectedStateName) {
                detectedStateName = bdcData.principalSubdivision || '';
              }
            } catch (eBdc) {
              console.warn('⚠️ BigDataCloud reverse geocode warning:', eBdc.message);
            }
          }

          const fullLocationLabel = detectedStateName
            ? `${detectedCityName}, ${detectedStateName}`
            : detectedCityName;

          if (detectedPin && /^\d{6}$/.test(detectedPin)) {
            setPincode(detectedPin);
            setCity(fullLocationLabel);
            setDetectedLocation({ pincode: detectedPin, city: fullLocationLabel });
            setError('');
            toast.success(`Location detected: ${fullLocationLabel} (${detectedPin})`);
          } else {
            // Location coordinates received, but postal code couldn't be resolved automatically
            setCity(fullLocationLabel);
            setError(`Location detected: ${fullLocationLabel}. Please enter your 6-digit PIN code to confirm.`);
          }
        } catch (err) {
          console.error('⚠️ Geolocation processing error:', err);
          setError('Unable to detect your location. Please enter your PIN code manually.');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access was denied. Please enter your PIN code manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Unable to detect your location. Please enter your PIN code manually.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please enter your PIN code manually.');
            break;
          default:
            setError('Unable to detect your location. Please enter your PIN code manually.');
            break;
        }
      },
      geoOptions
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#B71C1C] flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Select Delivery Location</h3>
            <p className="text-xs text-slate-500">Check product delivery dates & shipping options</p>
          </div>
        </div>

        {/* Use My Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={detecting || loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 mb-3 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-[#B71C1C] font-bold text-xs rounded-2xl transition-colors border border-red-200 cursor-pointer"
        >
          {detecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#B71C1C]" />
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              <span>Use My Current Location</span>
            </>
          )}
        </button>

        {/* Success Detected Location Chip */}
        {detectedLocation && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Location Detected: <strong>{detectedLocation.city} ({detectedLocation.pincode})</strong></span>
          </div>
        )}

        <div className="relative flex items-center my-4">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="shrink mx-3 text-[11px] font-bold uppercase text-slate-400">or enter pincode</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleApplyPincode} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="Enter 6-digit Pincode"
              className="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#B71C1C] outline-none font-bold tracking-wider text-center font-mono"
            />
            {error && <p className="text-xs text-red-600 mt-2 text-center font-semibold leading-tight">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || detecting}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Applying Location...' : 'APPLY PINCODE'}
            {!loading && <Check className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
