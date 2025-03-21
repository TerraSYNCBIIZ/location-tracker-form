/**
 * Safe localStorage utility functions with browser environment checks
 */

/**
 * Check if running in browser environment
 * @returns boolean
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Get an item from localStorage
 * @param key The storage key
 * @param defaultValue Optional default value if key doesn't exist
 * @returns The stored value or defaultValue
 */
export const getItem = (key: string, defaultValue: string | null = null): string | null => {
  if (!isBrowser()) {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set an item in localStorage
 * @param key The storage key
 * @param value The value to store
 * @returns boolean indicating success
 */
export const setItem = (key: string, value: string): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
    return false;
  }
};

/**
 * Remove an item from localStorage
 * @param key The storage key to remove
 * @returns boolean indicating success
 */
export const removeItem = (key: string): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 * @returns boolean indicating success
 */
export const clearAll = (): boolean => {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}; 