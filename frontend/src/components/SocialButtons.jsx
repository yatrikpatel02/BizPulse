import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google);
    document.body.appendChild(script);
  });
}

export default function SocialButtons({ onSuccess, onError }) {
  const { socialLogin } = useAuth();
  const googleBtnRef = useRef(null);
  const [scriptsReady, setScriptsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!GOOGLE_CLIENT_ID) {
      setScriptsReady(true);
      return;
    }
    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled) return;
        if (window.google?.accounts?.id && googleBtnRef.current) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: googleBtnRef.current.clientWidth || 320,
            text: 'continue_with',
          });
        }
        if (!cancelled) setScriptsReady(true);
      } catch {
        if (!cancelled) setScriptsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    if (!response?.credential) return;
    try {
      await socialLogin(response.credential);
      onSuccess && onSuccess();
    } catch (err) {
      onError && onError(formatError(err));
    }
  };

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-6">
        {!scriptsReady && (
          <button
            type="button"
            disabled
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 opacity-60"
          >
            Loading Google…
          </button>
        )}
        <div ref={googleBtnRef} className="flex w-full justify-center" />
      </div>
    </div>
  );
}

function formatError(err) {
  const data = err.response?.data;
  if (!data) return 'Social sign-in failed. Please try again.';
  return data.detail || Object.values(data).flat().join(' ') || 'Social sign-in failed.';
}
