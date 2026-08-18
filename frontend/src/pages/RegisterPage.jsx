import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  // Custom Admin Uploaded Logo
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');

  useEffect(() => {
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('karviyam_logo') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('karviyam_logo_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('karviyam_logo_updated', handleStorageChange);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(formData);
    if (res && res.success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 bg-[#FAFAFA]">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xl space-y-4">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            {customLogo ? (
              <img src={customLogo} alt="Karviyam Logo" className="h-11 w-auto object-contain max-w-[180px]" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-black text-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                </svg>
              </div>
            )}
          </div>
          <h2 className="font-display font-black text-2xl text-slate-900 tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Join Karviyam VIP Club for exclusive streetwear drops</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Full Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-11 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>REGISTER NOW</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <GoogleSignInButton />
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#B71C1C] hover:underline transition-colors ml-1">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
