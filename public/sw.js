// self hace referencia al propio service worker
const CACHE_NAME = 'mi-app-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/favicon.ico',
  // Es importante cachear los iconos que se usan en el manifest
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        // Usamos addAll para cachear todos los archivos estáticos de la aplicación
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Service Worker: Falló el cacheo de archivos', err);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si la caché actual no está en nuestra lista blanca, la eliminamos
          // Esto es útil para limpiar versiones viejas de la caché
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Limpiando caché antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Solo interceptamos las peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia: Cache, falling back to Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Si encontramos una respuesta en la caché, la retornamos
          console.log('Service Worker: Recurso encontrado en caché:', event.request.url);
          return response;
        }

        // Si no está en caché, vamos a la red
        console.log('Service Worker: Recurso no encontrado en caché, buscando en red:', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // No cacheamos las peticiones a la API de Firebase
            if (event.request.url.includes('firestore.googleapis.com')) {
              return networkResponse;
            }

            // Para otros recursos, los clonamos y los guardamos en caché para la próxima vez
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          });
      })
      .catch(err => {
        // Si todo falla (estamos offline y el recurso no está en caché),
        // podríamos devolver una página de fallback
        console.error('Service Worker: Error de fetch:', err);
        // Opcional: caches.match('/offline.html');
      })
  );
});
