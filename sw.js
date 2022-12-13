importScripts("js/sw-utils.js");
const CACHE_STATIC_NAME = "pwa-static-v1";
const CACHE_DYNAMIC_NAME = "pwa-dynamic-v1";
const CACHE_INMUTABLE_NAME = "pwa-inmutable-v1";

const APP_SHELL = [
    "/",
    "/index.html",
    "css/style.css",
    "img/avatars/gohan.jpg",
    "img/avatars/goku.jpg",
    "img/avatars/piccolo.jpg",
    "img/avatars/trunks.jpg",
    "img/avatars/vegeta.jpg",
    "img/favicon.ico",
    "js/app.js",
    "js/sw-utils.js"
];

const APP_SHELL_INMUTABLE = [
    "https://fonts.googleapis.com/css?family=Quicksand:300,400",
    "https://fonts.googleapis.com/css?family=Lato:400,300",
    "https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css",
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"
];

self.addEventListener("install", evento => {

    const cacheEstatico  = caches.open( CACHE_STATIC_NAME )
        .then(cache => {
            return cache.addAll( APP_SHELL );
        });

    const cacheInmutable = caches.open( CACHE_INMUTABLE_NAME )
        .then( cache => {
            return cache.addAll( APP_SHELL_INMUTABLE );
        });

    evento.waitUntil( Promise.all( [cacheEstatico, cacheInmutable] ) );

});

self.addEventListener("activate", evento => {

    const respuesta = caches.keys().then(llaves => {
        llaves.forEach(llave => {

            if(llave !== CACHE_STATIC_NAME && llave.includes("static")){
                return caches.delete(llave);
            }

            if(llave !== CACHE_DYNAMIC_NAME && llave.includes("dynamic")){
                return caches.delete(llave);
            }

        });
    });

    evento.waitUntil( respuesta );
    
});

self.addEventListener("fetch", evento => {
    let respuesta;
    if (evento.request.url.includes("/api")) {
        
        respuesta = manejaPeticionesApi( CACHE_DYNAMIC_NAME, evento.request);
    }else{
        respuesta = caches.match( evento.request )
            .then(respuesta =>{
                if( respuesta ){
                    return respuesta;
                }else{
                    return fetch( evento.request )
                        .then(nuevaRespuesta => {
                            caches.open( CACHE_DYNAMIC_NAME)
                                .then( cache =>{
                                    cache.put( evento.request, nuevaRespuesta );
                                });

                            return nuevaRespuesta.clone();
                        });
                }
            });
    }
    evento.respondWith( respuesta );
});