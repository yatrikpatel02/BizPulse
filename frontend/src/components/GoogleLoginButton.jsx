import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function GoogleLoginButton({ text = 'signin_with', onSuccess, onError }) {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already present
    if (window.google) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load Google Sign-In SDK');
    document.body.appendChild(script);

    return () => {
      // We keep the script tag to prevent re-fetching on component mount/unmount
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID is not configured.');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) {
            setError('Google sign-in did not return a credential.');
            return;
          }
          try {
            await socialLogin(response.credential);
            if (onSuccess) onSuccess();
            navigate('/dashboard');
          } catch (err) {
            console.error('Google social login error:', err);
            const errMsg = err.response?.data?.detail || 'Authentication failed. Please try again.';
            setError(errMsg);
            if (onError) onError(errMsg);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: text, // 'signin_with' or 'signup_with'
        shape: 'rectangular',
        width: 360, // set fixed width matching our form
      });
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
      setError('Failed to initialize Google Sign-In');
    }
  }, [scriptLoaded, socialLogin, navigate, text, onSuccess, onError]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {error && (
        <div className="w-full text-xs text-red-400 text-center font-medium bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl animate-fade-in">
          {error}
        </div>
      )}
      <div className="w-full flex justify-center py-1">
        <div ref={buttonRef} className="w-full max-w-[360px] min-h-[44px] flex justify-center overflow-hidden rounded-xl border border-white/5 shadow-md shadow-black/20 hover:border-white/10 transition-all duration-200" />
      </div>
    </div>
  );
}
