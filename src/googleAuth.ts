declare global {
  interface Window {
    google?: {
      accounts?: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

export async function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return;
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.body.appendChild(script);
  });
}

export async function authorizeWithGoogle(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error('Google client ID is not configured.');
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) {
      reject(new Error('Google Identity Services is unavailable.'));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response?.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('Google sign-in failed to return a credential.'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    window.google.accounts.id.prompt();
  });
}
