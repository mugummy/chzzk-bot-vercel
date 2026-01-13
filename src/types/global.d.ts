export {};

declare global {
  interface Window {
    ui: {
      notify: (message: string, type?: 'success' | 'error' | 'info') => void;
    };
    sendWebSocket: (msg: any) => void;
    utils: {
      esc: (s: string) => string;
    };
  }
}
