/**
 * Service Worker
 * 提供基础的 PWA 支持：
 * 1. 静态资源缓存
 * 2. 离线页面回退
 * 3. 简单的缓存策略
 */

const CACHE_NAME = 'ysj-blog-v1';
const STATIC_ASSETS = [
  '/',
  '/articles',
  '/about',
  '/resume',
  '/manifest.json',
  '/favicon.ico',
];

// 安装时缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  
  // 立即激活
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  self.clients.claim();
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') return;
  
  // 跳过跨域请求（除了 Giscus）
  if (url.origin !== self.location.origin && !url.hostname.includes('giscus.app')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        // 如果缓存中有，直接返回
        if (cached) {
          // 同时在后台更新缓存（Stale-While-Revalidate 策略）
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // 网络请求失败，使用缓存
            });
          
          return cached;
        }
        
        // 否则发起网络请求
        return fetch(request)
          .then((response) => {
            // 缓存成功的响应
            if (response.ok && (
              request.destination === 'image' ||
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'font'
            )) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            
            return response;
          })
          .catch(() => {
            // 网络失败，尝试返回离线页面
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // 返回一个空的错误响应
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
