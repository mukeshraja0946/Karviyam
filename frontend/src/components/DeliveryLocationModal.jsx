import React, { useState } from 'react';
import { MapPin, X, Check, Navigation } from 'lucide-react';

export default function DeliveryLocationModal({ isOpen, onClose, currentPincode, onSelectLocation }) {
  const [pincode, setPincode] = useState(currentPincode || '600001');
  const [city, setCity] = useState('Chennai, Tamil Nadu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApplyPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectLocation(pincode, city);
      onClose();
    }, 400);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          setLoading(false);
          onSelectLocation('600001', 'Chennai Central');
          onClose();
        },
        () => {
          setLoading(false);
          setError('Location access denied. Please enter pincode manually.');
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 relative">
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

        <button
          onClick={handleUseCurrentLocation}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 mb-5 bg-red-50 hover:bg-red-100 text-[#B71C1C] font-bold text-xs rounded-2xl transition-colors border border-red-200"
        >
          <Navigation className="w-4 h-4" />
          <span>Use My Current Location</span>
        </button>

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
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit Pincode"
              className="w-full bg-slate-50 text-slate-900 text-sm px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-[#B71C1C] outline-none font-bold tracking-wider text-center"
            />
            {error && <p className="text-xs text-red-600 mt-1 text-center font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B71C1C] hover:bg-[#900C0C] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Checking...' : 'Apply Pincode'}
            <Check className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
