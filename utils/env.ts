
/**
 * Environment Utility
 * Centralizes environment checks and abstractions for safe deployment.
 * 
 * Assumed deployment model: SPA with static hosting and query-param based routing.
 * Caveats: External GeoJSON URLs may face CORS issues in production if not proxy-enabled.
 */

export const isBrowser = (): boolean => typeof window !== 'undefined';

export const isProduction = (): boolean => {
  // Check typical NODE_ENV or custom flag. 
  // In some static builds, NODE_ENV might be 'production'.
  // We also check hostname to avoid 'production' behavior on localhost.
  return (process.env.NODE_ENV === 'production' || (isBrowser() && window.location.hostname !== 'localhost'));
};

export const safeHistoryAvailable = (): boolean => {
  return isBrowser() && !!window.history && !!window.history.pushState;
};

export const safeStorageAvailable = (): boolean => {
  if (!isBrowser()) return false;
  try {
    const key = '__storage_test__';
    sessionStorage.setItem(key, key);
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
export const SITE_URL = 'https://guynode.com';
export const SUPPORT_EMAIL = 'support@guynode.com';
