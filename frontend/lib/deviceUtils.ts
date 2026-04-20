/**
 * Device utilities for session management
 */

const DEVICE_ID_KEY = 'device_id';
const DEVICE_ID_COOKIE = 'device_id';
const COOKIE_EXPIRY_DAYS = 365;

/**
 * Set a cookie with expiration
 */
function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get a cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
}

/**
 * Get or generate a unique device ID for this browser/device
 * This ID persists across sessions using localStorage and cookie fallback
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  // Check localStorage first
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  // Fallback to cookie if localStorage is empty
  if (!deviceId) {
    deviceId = getCookie(DEVICE_ID_COOKIE);
  }

  // Generate new ID if neither exists
  if (!deviceId) {
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    // Store in both localStorage and cookie
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    setCookie(DEVICE_ID_COOKIE, deviceId, COOKIE_EXPIRY_DAYS);
  } else {
    // Sync: if only cookie exists, also store in localStorage
    if (!localStorage.getItem(DEVICE_ID_KEY)) {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    // Sync: if only localStorage exists, also store in cookie
    if (!getCookie(DEVICE_ID_COOKIE)) {
      setCookie(DEVICE_ID_COOKIE, deviceId, COOKIE_EXPIRY_DAYS);
    }
  }

  return deviceId;
}

/**
 * Get device information from user agent
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;
  
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/iPad/i.test(userAgent)) {
    deviceType = 'tablet';
  }
  
  return {
    browser,
    os,
    deviceType,
    deviceName: `${browser} on ${os}`
  };
}
