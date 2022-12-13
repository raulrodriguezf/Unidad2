
importScripts("js/pouchdb-7.3.1.min.js");
importScripts("js/sw-db.js");

importScripts("js/sw-utils.js");

const CACHE_STATIC_NAME = "pwa-static-v1";
const CACHE_DYNAMIC_NAME = "pwa-dynamic-v1";
const CACHE_INMUTABLE_NAME = "pwa-inmutable-v1";

const APP_SHELL = [
    "/",
    "index.html",
    "css/style.css",
    "img/favicon.ico",
    "img/avatars/gohan.jpg",
    "img/avatars/goku.jpg",
    "img/avatars/piccolo.jpg",
    "img/avatars/trunks.jpg",
    "img/avatars/vegeta.jpg",
    "js/app.js",
    "js/sw-utils.js",
    "js/sw-db.js",
    "js/camara-class.js"
];

const APP_SHELL_INMUTABLE = [
    "https://fonts.googleapis.com/css?family=Quicksand:300,400",
    "https://fonts.googleapis.com/css?family=Lato:400,300",
    //"https://use.fontawesome.com/releases/v5.3.1/css/all.css",
    "https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.0/animate.css",
    "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js",
    "js/pouchdb-7.3.1.min.js"
];

self.addEventListener("install", (evento) => {
    const cacheEstatico = caches.open(CACHE_STATIC_NAME).then((cache) => {
        return cache.addAll(APP_SHELL);
    });

    const cacheInmutable = caches.open(CACHE_INMUTABLE_NAME).then((cache) => {
        return cache.addAll(APP_SHELL_INMUTABLE);
    });

    evento.waitUntil(Promise.all([cacheEstatico, cacheInmutable]));
});

self.addEventListener("activate", (evento) => {
    const respuesta = caches.keys().then((llaves) => {
        llaves.forEach((llave) => {
        if (llave !== CACHE_STATIC_NAME && llave.includes("static")) {
            return caches.delete(llave);
        }

        if (llave !== CACHE_DYNAMIC_NAME && llave.includes("dynamic")) {
            return caches.delete(llave);
        }
        });
    });

    evento.waitUntil(respuesta);
});

self.addEventListener("fetch", (evento) => {

    let respuesta;
    if( evento.request.url.includes("/api") ){

        respuesta = manejarPeticionesApi(CACHE_DYNAMIC_NAME, evento.request);

    }else{

        respuesta = caches.match(evento.request).then((res) => {
            if (res) {
                verificarCache(CACHE_STATIC_NAME, evento.request, APP_SHELL_INMUTABLE);
                return res;

            } else {
                return fetch(evento.request).then((newRes) => {
                    return actualizaCache(CACHE_DYNAMIC_NAME, evento.request, newRes);
                });
            }
    });
    }

    evento.respondWith(respuesta);
});


self.addEventListener("sync", evento => {
    //console.log("SW: Sync");

    if( evento.tag === "nuevo-mensaje"){
        const respuesta = enviarMensajes();
        evento.waitUntil( respuesta );
    }
} );

// NOTIFICACIONES

self.addEventListener('push', e => {

    const data = JSON.parse( e.data.text() );

    const title = data.titulo;
    const options = {
        body: data.cuerpo,       
        icon: `img/avatars/${ data.usuario }.jpg`,
        badge: 'img/favicon.ico',
        image: 'https://as01.epimg.net/meristation/imagenes/2022/09/09/reportajes/1662739276_405887_1662795061_noticia_normal_recorte1.jpg',
        vibrate: [125,75,125,275,200,275,125,75,125,275,200,600,200,600],
        openUrl: '/',
        data: {            
            url: '/',
            id: data.usuario
        },
        // accciones personalizadas: editar, eliminar o lo que se requiera
        actions: [
            {
                action: 'goku-action',
                title: 'Goku',
                icon: 'img/avatars/goku.jpg'
            },
            {
                action: 'vegeta-action',
                title: 'Vegeta',
                icon: 'img/avatars/vegeta.jpg'
            }
        ]
    };

    e.waitUntil( self.registration.showNotification( title, options) );
});


// Evento para cerrar la notificacion
self.addEventListener('notificationclose', e => {
    console.log('Notificación cerrada', e);
});

// Evento cuando se da clic sobre la notificacion
self.addEventListener('notificationclick', e => {
    // Para tener una mejor refrencia a las opcion de las notificaciones
    const notificacion = e.notification;
    const accion = e.action;

    console.log({ notificacion, accion });

    // obtiene todas las pestañas abiertas en el navegador
    const respuesta = clients.matchAll()
        .then( clientes => {

            let cliente = clientes.find( c => {
                return c.visibilityState === 'visible';
            });

            if ( cliente !== undefined ) {
                cliente.navigate( notificacion.data.url );
                cliente.focus();
            } else {
                clients.openWindow( notificacion.data.url );
            }

            return notificacion.close();
        });

    e.waitUntil( respuesta );
});
