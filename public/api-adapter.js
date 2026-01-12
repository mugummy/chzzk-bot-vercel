// api-adapter.js - Hybrid Adapter
// 대시보드의 모든 요청을 가로채서 Railway 서버로 보냅니다.

(function() {
    const CONFIG = window.CHZZK_CONFIG || { API_URL: "http://localhost:8080" };
    let API_BASE = CONFIG.API_URL.replace(/\/$/, '');

    console.log(`[Adapter] Initialized with Server URL: ${API_BASE}`);

    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string') {
            const isStaticAsset = /\.(html|js|css|png|jpg|svg|json)$/i.test(url);
            const isApiOrAuth = url.startsWith('/api') || url.startsWith('/auth');
            
            // API나 Auth 요청은 Next.js Rewrite를 타도록 URL 변경 안 함 (쿠키 보존)
            if (isApiOrAuth) {
                // 쿠키 포함 강제 (옵션 병합)
                const newOptions = { ...options, credentials: 'include' };
                return originalFetch(url, newOptions);
            }

            // 그 외 루트(/)로 시작하고 정적 파일이 아닌 경우에만 인터셉트 (필요 시)
            if (url.startsWith('/') && !isStaticAsset) {
                // 하지만 이제 대부분의 API가 Rewrite를 타므로, 이 부분은 거의 안 쓰일 것임.
                // 혹시 모를 누락된 경로만 Railway로 직접 보냄.
                const newUrl = API_BASE + url;
                return originalFetch(newUrl, options);
            }
        }
        return originalFetch(url, options);
    };

    window.getServerWebSocketUrl = function() {
        return API_BASE.replace(/^http/, 'ws');
    };
    
    // WebSocket 인터셉터
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        if (typeof url === 'string') {
             if (url.startsWith('/') || url.includes(window.location.host)) {
                 const wsBase = API_BASE.replace(/^http/, 'ws');
                 let path = url;
                 if (url.startsWith('ws')) {
                     try {
                         path = new URL(url).pathname;
                     } catch (e) { path = url; }
                 }
                 const newUrl = wsBase + (path.startsWith('/') ? path : '/' + path);
                 console.log(`[Adapter] WS Proxy: ${url} -> ${newUrl}`);
                 return new originalWebSocket(newUrl, protocols);
             }
        }
        return new originalWebSocket(url, protocols);
    };
    window.WebSocket.prototype = originalWebSocket.prototype;
    window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = originalWebSocket.OPEN;
    window.WebSocket.CLOSING = originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = originalWebSocket.CLOSED;

})();
