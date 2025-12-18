const CACHE_NAME = 'finance-control-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[SW] Arquivos cacheados com sucesso');
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] Service Worker ativo');
      return self.clients.claim();
    })
  );
});

// Intercepta requisições (Estratégia: Cache First)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Retorna do cache se disponível
        if (response) {
          return response;
        }

        // Clona a requisição
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // Se falhar, retorna página offline
          return caches.match('/index.html');
        });
      })
  );
});

// Listener para mensagens do app
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});