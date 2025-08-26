// Generate a unique browser fingerprint based on browser characteristics
export function generateBrowserFingerprint(): string {
  const fingerprint: string[] = [];
  
  // Screen resolution
  fingerprint.push(`${window.screen.width}x${window.screen.height}`);
  
  // Screen color depth
  fingerprint.push(`${window.screen.colorDepth}`);
  
  // Timezone offset
  fingerprint.push(`${new Date().getTimezoneOffset()}`);
  
  // Language
  fingerprint.push(navigator.language || 'unknown');
  
  // Platform
  fingerprint.push(navigator.platform || 'unknown');
  
  // User agent (simplified)
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) fingerprint.push('Chrome');
  else if (ua.includes('Firefox')) fingerprint.push('Firefox');
  else if (ua.includes('Safari')) fingerprint.push('Safari');
  else if (ua.includes('Edge')) fingerprint.push('Edge');
  else fingerprint.push('Other');
  
  // Canvas fingerprint (simplified) - iframe safe
  try {
    // Check if we're in iframe and skip canvas if needed
    const isInIframe = window !== window.top;
    
    if (isInIframe) {
      fingerprint.push('iframe-canvas');
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Browser Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Browser Fingerprint', 4, 17);
        const dataURL = canvas.toDataURL();
        fingerprint.push(dataURL.slice(-50)); // Use last 50 chars
      }
    }
  } catch (e) {
    fingerprint.push('canvas-error');
  }
  
  // Hardware concurrency
  fingerprint.push(`${navigator.hardwareConcurrency || 0}`);
  
  // Create a hash from all components
  const fingerprintString = fingerprint.join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `fp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

// Store fingerprint in sessionStorage for consistency, with iframe fallback
export async function getBrowserFingerprint(): Promise<string> {
  let fingerprint;
  
  try {
    fingerprint = sessionStorage.getItem('browser_fingerprint');
  } catch (error) {
    // SessionStorage access might be blocked in iframe - use fallback
    console.log('SessionStorage blocked in iframe, using session-only fingerprint');
    fingerprint = null;
  }
  
  if (!fingerprint) {
    fingerprint = generateBrowserFingerprint();
    
    try {
      sessionStorage.setItem('browser_fingerprint', fingerprint);
    } catch (error) {
      // Ignore storage errors in iframe
      console.log('Cannot persist fingerprint in iframe environment');
    }
  }
  
  return fingerprint;
}

// Alias for better API consistency
export const generateFingerprint = getBrowserFingerprint;