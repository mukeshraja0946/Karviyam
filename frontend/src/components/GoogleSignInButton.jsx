import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GoogleSignInButton({ isMaintenanceMode }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleClientId = (rawClientId && rawClientId.trim() !== '' && !rawClientId.includes('YOUR_WEB_CLIENT_ID'))
    ? rawClientId
    : '333255083784-u9hu0liup36sgneialgug9fuvr2qgv4u.apps.googleusercontent.com';

  useEffect(() => {
    console.log("Google Client ID Active:", googleClientId);

    if (window.google?.accounts?.id && googleClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response && response.credential) {
              setLoading(true);
              try {
                const res = await googleLogin({ credential: response.credential });
                if (res && res.success) {
                  const targetPath = res.isAdmin ? '/admin' : '/';
                  window.location.href = targetPath;
                }
              } catch (err) {
                console.error('Google One Tap / GIS ID Token Error:', err);
                toast.error(err.response?.data?.message || err.message || 'Google authentication failed');
              } finally {
                setLoading(false);
              }
            }
          }
        });
      } catch (e) {
        console.warn('GIS ID Initialization Warning:', e);
      }
    }
  }, [googleClientId, googleLogin]);

  const handleGoogleSignIn = () => {
    if (loading) return;

    console.log('[GOOGLE AUTH] Button clicked');

    if (!googleClientId || googleClientId.trim() === '') {
      console.error("Google Client ID not configured.");
      toast.error("Google OAuth is not configured. Please contact the administrator.");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error("Google Identity Services script is loading. Please try again in a moment.");
      return;
    }

    // Purge any stale auth state before opening popup
    try {
      localStorage.removeItem('karviyam_token');
      localStorage.removeItem('karviyam_user');
      sessionStorage.clear();
    } catch (e) {}

    setLoading(true);

    // 15-second safety timeout to reset state if popup is abandoned or hangs
    const safetyTimeoutId = setTimeout(() => {
      setLoading((currLoading) => {
        if (currLoading) {
          console.warn('[GOOGLE AUTH] 15-second safety timeout reached');
          toast.error('Google sign-in could not be completed. Please try again.', { id: 'g-timeout' });
          return false;
        }
        return currLoading;
      });
    }, 15000);

    try {
      console.log('[GOOGLE AUTH] GIS initializing token client');
      // Official Google Identity Services OAuth 2.0 Account Picker with scope: 'openid email profile'
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          clearTimeout(safetyTimeoutId);
          console.log('[GOOGLE AUTH] Google response received');
          if (tokenResponse && tokenResponse.access_token) {
            console.log('[GOOGLE AUTH] Credential received');
            try {
              let userEmail = '';
              let userName = '';
              let googleId = '';
              let profilePhoto = '';

              // Quick client-side profile fetch with 5-second AbortController safeguard
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (userInfoRes.ok) {
                  const googleUser = await userInfoRes.json();
                  userEmail = googleUser.email || '';
                  userName = googleUser.name || googleUser.given_name || '';
                  googleId = googleUser.sub || '';
                  profilePhoto = googleUser.picture || '';
                }
              } catch (e) {
                console.warn('Client-side Google profile fetch bypassed, proceeding to backend verification:', e);
              }

              console.log('[GOOGLE AUTH] Sending credential to backend');
              const payload = {
                credential: tokenResponse.access_token,
                email: userEmail,
                name: userName,
                googleId: googleId,
                profilePhoto: profilePhoto
              };

              const res = await googleLogin(payload);
              console.log('[GOOGLE AUTH] Backend response received');
              if (res && res.success) {
                console.log('[GOOGLE AUTH] User authenticated, role loaded from DB');
                const targetPath = res.isAdmin ? '/admin' : '/';
                console.log('[GOOGLE AUTH] Redirecting to:', targetPath);
                window.location.href = targetPath;
              }
            } catch (err) {
              console.error('Google Sign-In Error:', err);
              toast.error(err.response?.data?.message || err.message || 'Google authentication failed');
            } finally {
              setLoading(false);
            }
          } else if (tokenResponse && tokenResponse.error) {
            if (tokenResponse.error !== 'popup_closed_by_user' && tokenResponse.error !== 'access_denied') {
              toast.error(`Google Sign-In Error: ${tokenResponse.error}`, { id: 'g-oauth-err' });
            }
            setLoading(false);
          } else {
            setLoading(false);
          }
        },
        error_callback: (err) => {
          clearTimeout(safetyTimeoutId);
          console.error('Google Token Client Error:', err);
          setLoading(false);
          if (!err) return;
          const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
          const errCode = err.error || err.type || '';

          if (errStr.includes('origin_mismatch') || errCode === 'origin_mismatch') {
            toast.error(`Google OAuth Origin Mismatch: Please ensure "${window.location.origin}" is authorized in Google Cloud Console.`, { id: 'g-oauth-err', duration: 8000 });
          } else if (errCode === 'popup_closed_by_user' || errCode === 'popup_closed') {
            // User closed popup - silent exit
          } else if (errCode && errCode !== 'idpiframe_initialization_failed') {
            toast.error(`Google Auth Error: ${errCode}`, { id: 'g-oauth-err' });
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e) {
      clearTimeout(safetyTimeoutId);
      console.error('Google Sign-In Exception:', e);
      toast.error('Google Sign-In encountered an error');
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="relative flex items-center justify-center my-2">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
          OR
        </span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs border border-[#E5E7EB] shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 ${
          isMaintenanceMode ? 'py-3.5 rounded-2xl text-sm' : 'py-3 rounded-xl'
        }`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>
    </div>
  );
}
