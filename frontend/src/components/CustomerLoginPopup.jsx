import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, KeyRound, ShieldCheck, ArrowRight, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import GoogleSignInButton from './GoogleSignInButton';
import api from '../utils/api';
import { resolveImageUrl, isValidImageUrl } from '../utils/imageUtils';

export default function CustomerLoginPopup() {
  const { isAuthenticated, user, login, sendOTP, verifyOTP } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300);

  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');
  const [logoFailed, setLogoFailed] = useState(false);
  const emailInputRef = useRef(null);

  // 1. Automatic Timer Setup & Settings Fetching
  useEffect(() => {
    // DO NOT show for logged-in users
    if (isAuthenticated || user) {
      setIsOpen(false);
      return;
    }

    // Session-level repeat protection
    if (sessionStorage.getItem('karviyam_login_popup_shown') === 'true') {
      return;
    }

    let timerId = null;

    const initLoginPopup = async () => {
      try {
        const res = await api.get('/settings/login-popup').catch(() => null);
        const data = res?.data?.data || res?.data;

        // Fallback default
        let enabled = true;
        let delaySeconds = 5;

        if (data && typeof data === 'object') {
          if (data.enabled !== undefined) enabled = Boolean(data.enabled);
          if (data.delaySeconds !== undefined) {
            const parsed = parseInt(data.delaySeconds, 10);
            if (!isNaN(parsed) && parsed >= 1) delaySeconds = parsed;
          }
        }

        // Admin DISABLE overrides everything
        if (!enabled) return;

        // Start delay timer if still unauthenticated and not shown in current session
        timerId = setTimeout(() => {
          if (!isAuthenticated && !sessionStorage.getItem('karviyam_login_popup_shown')) {
            setIsOpen(true);
          }
        }, delaySeconds * 1000);
      } catch (err) {
        console.error('Failed to fetch login popup settings:', err);
      }
    };

    initLoginPopup();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [isAuthenticated, user]);

  // 2. Body Scroll Lock & Escape Key Listener
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus email input
      setTimeout(() => {
        if (emailInputRef.current) emailInputRef.current.focus();
      }, 100);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // 3. OTP Cooldown Timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 4. OTP Expiry Countdown
  useEffect(() => {
    let timer;
    if (otpStep === 'verify' && otpExpirySeconds > 0) {
      timer = setInterval(() => setOtpExpirySeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, otpExpirySeconds]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('karviyam_login_popup_shown', 'true');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!password || !password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res && res.success) {
        handleClose();
      }
    } catch (err) {
      console.error('Popup login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await sendOTP(email.trim());
      if (res && res.success) {
        setOtpStep('verify');
        setCooldown(30);
        setOtpExpirySeconds(300);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || !otp.trim()) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    if (otpExpirySeconds <= 0) {
      toast.error('OTP expired. Please request a new OTP.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyOTP(email.trim(), otp.trim());
      if (res && res.success) {
        handleClose();
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || isAuthenticated) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-80 duration-200 select-none"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md p-6 sm:p-7 relative overflow-hidden text-left flex flex-col justify-between my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors z-10"
          title="Close Popup (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-4 pt-1">
          <div className="flex justify-center mb-2.5">
            {customLogo && isValidImageUrl(customLogo) && !logoFailed ? (
              <img 
                src={resolveImageUrl(customLogo)} 
                alt="Karviyam Logo" 
                onError={() => setLogoFailed(true)}
                className="h-10 w-auto object-contain max-w-[170px]" 
              />
            ) : (
              <div className="flex items-center gap-1.5 font-serif font-black text-xl text-[#B71C1C] tracking-widest uppercase">
                <span className="text-[#B71C1C]">🌸</span>
                <span>KARVIYAM</span>
              </div>
            )}
          </div>

          <h2 className="font-display font-black text-slate-900 text-xl tracking-tight">
            Welcome to Karviyam
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Sign in to continue shopping & track your orders
          </p>
        </div>

        {/* Login Method Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80 mb-4">
          <button
            type="button"
            onClick={() => { setLoginMethod('password'); setOtpStep('email'); setOtp(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              loginMethod === 'password'
                ? 'bg-white text-[#B71C1C] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('otp'); setOtpStep('email'); setOtp(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              loginMethod === 'otp'
                ? 'bg-white text-[#B71C1C] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Login with OTP
          </button>
        </div>

        {/* PASSWORD LOGIN FORM */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5" autoComplete="off">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-10 pr-10 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md py-3 rounded-xl cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <GoogleSignInButton />
          </form>
        )}

        {/* OTP LOGIN FORM */}
        {loginMethod === 'otp' && (
          <>
            {otpStep === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-3.5" autoComplete="off">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full bg-[#F5F5F5] text-slate-900 text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md py-3 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SENDING OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOTP} className="space-y-3.5" autoComplete="off">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    OTP sent to {email}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Enter 6-digit OTP
                    </label>
                    <span className={`text-[10px] font-bold ${otpExpirySeconds < 60 ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                      Expires in {Math.floor(otpExpirySeconds / 60)}:{String(otpExpirySeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-[#F5F5F5] text-slate-900 text-sm tracking-[4px] font-mono text-center pr-3.5 py-2.5 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.length < 6 || otpExpirySeconds <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md py-3 rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY OTP</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <button
                    type="button"
                    disabled={cooldown > 0 || isSubmitting}
                    onClick={() => handleSendOTP()}
                    className="text-[#B71C1C] hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpStep('email'); setOtp(''); }}
                    className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
