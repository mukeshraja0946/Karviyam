import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'verify'
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { login, sendAdminOTP, verifyAdminOTP, loading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = location.state?.from || searchParams.get('redirect') || '';

  // Redirect authenticated user if visiting /login
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, redirectTarget, navigate]);

  // Custom Admin Uploaded Logo
  const [customLogo, setCustomLogo] = useState(() => localStorage.getItem('karviyam_logo') || '');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('karviyam_maintenance_mode') === 'true');

  useEffect(() => {
    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('karviyam_logo') || '');
      setIsMaintenanceMode(localStorage.getItem('karviyam_maintenance_mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('karviyam_logo_updated', handleStorageChange);
    window.addEventListener('karviyam_maintenance_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('karviyam_logo_updated', handleStorageChange);
      window.removeEventListener('karviyam_maintenance_updated', handleStorageChange);
    };
  }, []);

  // Cooldown timer for RESEND OTP
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Password Login Submit
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
        if (res.isAdmin) {
          window.location.href = '/admin';
        } else if (redirectTarget) {
          window.location.href = redirectTarget;
        } else {
          window.location.href = '/';
        }
        return;
      }
    } catch (err) {
      console.error('Password login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await sendAdminOTP(email.trim());
      if (res && res.success) {
        setOtpStep('verify');
        setCooldown(30);
      }
    } catch (err) {
      console.error('Send OTP error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || !otp.trim()) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await verifyAdminOTP(email.trim(), otp.trim());
      if (res && res.success) {
        window.location.href = '/admin';
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#FAFAFA]">
      <div className={`bg-white border border-[#E5E7EB] shadow-2xl ${
        isMaintenanceMode 
          ? 'w-full max-w-lg p-8 md:p-12 rounded-3xl space-y-6' 
          : 'w-full max-w-md p-6 sm:p-8 rounded-3xl space-y-5'
      }`}>
        
        {/* Header Branding */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            {customLogo ? (
              <img 
                src={customLogo} 
                alt="Karviyam Logo" 
                className={`${isMaintenanceMode ? 'h-14 max-w-[220px]' : 'h-11 max-w-[180px]'} w-auto object-contain`} 
              />
            ) : (
              <div className={`${isMaintenanceMode ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl'} rounded-2xl bg-gradient-to-tr from-[#D32F2F] to-[#B71C1C] text-white font-black flex items-center justify-center shadow-md`}>
                <svg className={`${isMaintenanceMode ? 'w-9 h-9' : 'w-7 h-7'} fill-current`} viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm0 4a3 3 0 110 6 3 3 0 010-6zm-4 9.5c0-2 4-3.1 4-3.1s4 1.1 4 3.1V16H8v-0.5z"/>
                </svg>
              </div>
            )}
          </div>

          <h2 className={`font-display font-black text-slate-900 tracking-tight ${isMaintenanceMode ? 'text-3xl' : 'text-2xl'}`}>
            {isMaintenanceMode ? 'Admin Authentication' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isMaintenanceMode 
              ? 'Platform is under maintenance. Sign in with admin credentials.' 
              : 'Sign in to access your orders, bag & wishlist'
            }
          </p>
        </div>

        {/* Maintenance Mode Alert Banner */}
        {isMaintenanceMode && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 text-xs font-extrabold flex items-center gap-2.5 shadow-2xs mb-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-left">
              <span className="block font-black text-[#B71C1C]">MAINTENANCE MODE ACTIVE</span>
              <span className="text-[11px] text-amber-800 font-semibold block mt-0.5">Only administrator accounts can sign in right now.</span>
            </div>
          </div>
        )}

        {/* Login Method Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setLoginMethod('password'); setOtpStep('email'); setOtp(''); }}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
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
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
              loginMethod === 'otp'
                ? 'bg-white text-[#B71C1C] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Login with OTP
          </button>
        </div>

        {/* TAB 1: PASSWORD LOGIN */}
        {loginMethod === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email address"
                  className={`w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-4 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium ${
                    isMaintenanceMode ? 'py-3.5 rounded-2xl text-sm' : 'py-3'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-11 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium ${
                    isMaintenanceMode ? 'py-3.5 rounded-2xl text-sm' : 'py-3'
                  }`}
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
              disabled={loading || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-6 cursor-pointer ${
                isMaintenanceMode ? 'py-4 rounded-2xl' : 'py-3.5 rounded-xl'
              }`}
            >
              {(loading || isSubmitting) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>{isMaintenanceMode ? 'ADMIN SIGN IN' : 'SIGN IN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {!isMaintenanceMode && <GoogleSignInButton isMaintenanceMode={isMaintenanceMode} />}
          </form>
        )}

        {/* TAB 2: OTP LOGIN */}
        {loginMethod === 'otp' && (
          <>
            {/* STEP 1: Enter Email and Send OTP */}
            {otpStep === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700">
                    Admin Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered admin email"
                      className={`w-full bg-[#F5F5F5] text-slate-900 text-xs pl-11 pr-4 rounded-xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium ${
                        isMaintenanceMode ? 'py-3.5 rounded-2xl text-sm' : 'py-3'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-6 cursor-pointer ${
                    isMaintenanceMode ? 'py-4 rounded-2xl' : 'py-3.5 rounded-xl'
                  }`}
                >
                  {(loading || isSubmitting) ? (
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

            {/* STEP 2: Enter and Verify OTP */}
            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4" autoComplete="off">
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-center space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Verifying Admin Email</span>
                  <span className="text-xs font-black text-slate-900 block truncate">{email}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Enter 6-Digit OTP
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">Valid for 5 mins</span>
                  </div>
                  <div className="relative flex items-center">
                    <KeyRound className="absolute left-4 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full bg-[#F5F5F5] text-slate-900 text-base tracking-[6px] font-mono text-center pr-4 py-3 rounded-2xl border border-[#E5E7EB] focus:border-[#B71C1C] focus:bg-white outline-none transition-all placeholder:text-slate-300 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isSubmitting || otp.length < 6}
                  className={`w-full flex items-center justify-center gap-2 bg-[#B71C1C] hover:bg-[#900C0C] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-4 cursor-pointer ${
                    isMaintenanceMode ? 'py-4 rounded-2xl' : 'py-3.5 rounded-xl'
                  }`}
                >
                  {(loading || isSubmitting) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>VERIFYING OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>VERIFY OTP</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading || isSubmitting}
                    onClick={() => handleSendOTP()}
                    className="text-[#B71C1C] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}</span>
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

        {/* Footer Link */}
        {!isMaintenanceMode && (
          <div className="text-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#B71C1C] hover:underline transition-colors ml-1">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
