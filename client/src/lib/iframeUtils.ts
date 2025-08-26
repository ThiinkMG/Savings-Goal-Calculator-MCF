// Utility functions for detecting and handling iframe environments

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions, we're likely in an iframe
    return true;
  }
}

export function safeLocalStorageAccess(key: string, value?: string): string | null {
  try {
    if (value !== undefined) {
      localStorage.setItem(key, value);
      return value;
    } else {
      return localStorage.getItem(key);
    }
  } catch (error) {
    // localStorage access blocked (likely iframe)
    console.log(`localStorage access blocked for key: ${key}`);
    return null;
  }
}

export function safeSessionStorageAccess(key: string, value?: string): string | null {
  try {
    if (value !== undefined) {
      sessionStorage.setItem(key, value);
      return value;
    } else {
      return sessionStorage.getItem(key);
    }
  } catch (error) {
    // sessionStorage access blocked (likely iframe)
    console.log(`sessionStorage access blocked for key: ${key}`);
    return null;
  }
}

export function getIframeCompatibleMessage(): string {
  if (isInIframe()) {
    return "Running in embedded mode - some features may use session-only storage.";
  }
  return "";
}