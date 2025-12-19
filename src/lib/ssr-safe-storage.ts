/**
 * SSR-Safe Storage Utilities
 *
 * Provides safe localStorage and sessionStorage operations that work correctly
 * during Server-Side Rendering (SSR) in Next.js applications.
 */

/**
 * Check if we're running on the client-side (browser)
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

/**
 * Check if localStorage is available and accessible
 */
export const isLocalStorageAvailable = (): boolean => {
  if (!isClient()) return false;

  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if sessionStorage is available and accessible
 */
export const isSessionStorageAvailable = (): boolean => {
  if (!isClient()) return false;

  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely get an item from localStorage
 */
export const safeGetLocalStorage = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null;

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read localStorage key "${key}":`, error);
    return null;
  }
};

/**
 * Safely set an item in localStorage
 */
export const safeSetLocalStorage = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 */
export const safeRemoveLocalStorage = (key: string): boolean => {
  if (!isLocalStorageAvailable()) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely get an item from sessionStorage
 */
export const safeGetSessionStorage = (key: string): string | null => {
  if (!isSessionStorageAvailable()) return null;

  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read sessionStorage key "${key}":`, error);
    return null;
  }
};

/**
 * Safely set an item in sessionStorage
 */
export const safeSetSessionStorage = (key: string, value: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write sessionStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely remove an item from sessionStorage
 */
export const safeRemoveSessionStorage = (key: string): boolean => {
  if (!isSessionStorageAvailable()) return false;

  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove sessionStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely parse JSON from localStorage
 */
export const safeGetLocalStorageJSON = <T = any>(key: string): T | null => {
  const value = safeGetLocalStorage(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to parse localStorage JSON key "${key}":`, error);
    return null;
  }
};

/**
 * Safely stringify and store JSON in localStorage
 */
export const safeSetLocalStorageJSON = <T = any>(key: string, value: T): boolean => {
  try {
    const jsonString = JSON.stringify(value);
    return safeSetLocalStorage(key, jsonString);
  } catch (error) {
    console.error(`Failed to stringify localStorage JSON key "${key}":`, error);
    return false;
  }
};

/**
 * Authentication token helpers
 */
export const getAuthToken = (): string | null => {
  return safeGetLocalStorage('auth_token') || safeGetSessionStorage('sessionToken');
};

export const removeAuthToken = (): void => {
  safeRemoveLocalStorage('auth_token');
  safeRemoveSessionStorage('sessionToken');
};

export const removeAgentData = (): void => {
  safeRemoveLocalStorage('agent_data');
};

/**
 * Get language preference safely
 */
export const getLanguagePreference = (): string | null => {
  return safeGetLocalStorage('language');
};

/**
 * Set language preference safely
 */
export const setLanguagePreference = (language: string): boolean => {
  return safeSetLocalStorage('language', language);
};