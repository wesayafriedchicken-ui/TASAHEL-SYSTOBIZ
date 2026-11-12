import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { RBACProvider } from './context/RBACContext';
import './index.css';

// Suppress ResizeObserver loop errors globally to prevent noisy overlay
if (typeof window !== 'undefined') {
  // Wrap native ResizeObserver if not already wrapped
  if (window.ResizeObserver) {
    const OriginalRO = window.ResizeObserver;
    // Check if not already wrapped by index.html
    if (!OriginalRO.toString().includes('requestAnimationFrame')) {
      window.ResizeObserver = class ResizeObserver extends OriginalRO {
        constructor(callback: ResizeObserverCallback) {
          super((entries, observer) => {
            window.requestAnimationFrame(() => {
              try {
                callback(entries, observer);
              } catch {
                // Ignore benign resize error
              }
            });
          });
        }
      };
    }
  }

  const isBenignError = (text: string) => {
    const msg = text.toLowerCase();
    return (
      msg.includes('resizeobserver loop') || 
      msg.includes('resizeobserver loop limit exceeded') ||
      msg.includes('resizeobserver loop completed with undelivered notifications') ||
      msg.includes('undelivered notifications') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('websocket closed without opened') ||
      msg.includes('failed to refresh user profile') ||
      msg.includes('failed to refresh') ||
      (msg.includes('failed to fetch') && (msg.includes('profile') || msg.includes('auth/me') || msg.includes('user'))) ||
      msg.includes('safestorage') ||
      msg.includes('quota') ||
      msg.includes('quotaexceedederror') ||
      msg.includes('vite:ws')
    );
  };

  const originalError = window.console.error;
  window.console.error = (...args) => {
    const msg = args.map(a => (typeof a === 'object' && a !== null ? (a.message || a.stack || String(a)) : String(a || ''))).join(' ');
    if (isBenignError(msg)) {
      return;
    }
    originalError.apply(window.console, args);
  };

  const originalWarn = window.console.warn;
  window.console.warn = (...args) => {
    const msg = args.map(a => (typeof a === 'object' && a !== null ? (a.message || a.stack || String(a)) : String(a || ''))).join(' ');
    if (isBenignError(msg)) {
      return;
    }
    originalWarn.apply(window.console, args);
  };

  const handleResizeError = (e: any) => {
    // Robust check for benign platform notices
    const message = (
      e?.message || 
      (e?.reason && (e.reason.message || String(e.reason))) || 
      (e?.error && (e.error.message || String(e.error))) || 
      String(e || '')
    );
    const isIgnored = isBenignError(message);

    if (isIgnored) {
      // Prevent the error from reaching the console or triggering overlays
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (e.stopPropagation) e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
      
      // Attempt to hide overlays that might have already appeared
      try {
        const overlays = [
          'webpack-dev-server-client-overlay',
          'webpack-dev-server-client-overlay-div',
          'vite-error-overlay'
        ];
        overlays.forEach(id => {
          const el = document.getElementById(id) || document.querySelector(id);
          if (el) (el as HTMLElement).style.display = 'none';
        });
      } catch {
        // Ignore
      }
      
      return true;
    }
    return false;
  };

  // Attach with useCapture: true to catch errors before they bubble up to framework overlays
  window.addEventListener('error', handleResizeError, true);
  window.addEventListener('unhandledrejection', handleResizeError, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RBACProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </RBACProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
