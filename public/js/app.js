
var url = window.location.href;
var swLocation = '/ejemplo-sincronizacion/sw.js';
var swReg;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }

    window.addEventListener('load', () => {

        navigator.serviceWorker.register( swLocation ).then( reg => {
            swReg = reg;
            swReg.pushManager.getSubscription().then( verificaSuscripcion );

        });

    });
}





// Referencias de jQuery

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

// El usuario, contiene el ID del hÃ©roe seleccionado
var usuario;




// ===== Codigo de la aplicaciÃ³n

// function crearMensajeHTML(mensaje, personaje) {

//     var content =`
//     <li class="animated fadeIn fast">
//         <div class="avatar">
//             <img src="img/avatars/${ personaje }.jpg">
//         </div>
//         <div class="bubble-container">
//             <div class="bubble">
//                 <h3>@${ personaje }</h3>
//                 <br/>
//                 ${ mensaje }
//             </div>
            
//             <div class="arrow"></div>
//         </div>
//     </li>
//     `;

//     timeline.prepend(content);
//     cancelarBtn.click();

// }

function crearMensajeHTML(mensaje, personaje, lat, lng, foto) {

    // console.log(mensaje, personaje, lat, lng);

    var content =`
    <li class="animated fadeIn fast"
        data-user="${ personaje }"
        data-mensaje="${ mensaje }"
        data-tipo="mensaje">


        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ mensaje }
                `;
    
    if ( foto ) {
        content += `
                <br>
                <img class="foto-mensaje" src="${ foto }">
        `;
    }
        
    content += `</div>        
                <div class="arrow"></div>
            </div>
        </li>
    `;

    
    // si existe la latitud y longitud, 
    // llamamos la funcion para crear el mapa
    if ( lat ) {
        crearMensajeMapa( lat, lng, personaje );
    }
    
    // Borramos la latitud y longitud 
    lat = null;
    lng = null;

    $('.modal-mapa').remove();

    timeline.prepend(content);
    cancelarBtn.click();

}



// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});

// Boton de cancelar mensaje
cancelarBtn.on('click', function() {
    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             txtMensaje.val('');
         });
    }
});

// Boton de enviar mensaje
postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    var data  = {
        user: usuario,
        mensaje :mensaje,
        lat: lat,
        lng: lng,
        foto: foto
    }

    fetch("/api", {
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify( data )
    })
    .then( resp => resp.json() )
    .then( resp => console.log("funciona:", resp))
    .catch( error => console.log("Falla: ", error) );

    crearMensajeHTML( mensaje, usuario, lat, lng, foto );

});

function listarMensajes() {

    fetch("/api")
        .then(resp => resp.json() )
        .then(datos => {
            //console.log( datos );
            datos.forEach(mensaje => {
                crearMensajeHTML( mensaje.mensaje, mensaje.user, mensaje.lat, mensaje.lng, mensaje.foto );
            });
        });

}

listarMensajes();


function verificarConexion(){
    if(navigator.onLine){
        console.log("Si hay conexión")
    }else{
        console.log("No hay conexión");
    }
}

window.addEventListener("online", verificarConexion);
window.addEventListener("offline", verificarConexion);

// GEOLOCALIZACION

var googleMapKey = 'AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8';
var btnLocation = $("#location-btn");
var modaMapa = $(".modal-mapa");
var lat = null;
var lng = null;
var foto = null;

btnLocation.on("click", ()=>{
    console.log(" geolocalización");

    navigator.geolocation.getCurrentPosition(posicion => {
        console.log( posicion );

        mostrarMapaModal(posicion.coords.latitude, posicion.coords.longitude);

        lat = posicion.coords.latitude;
        lng = posicion.coords.longitude;
    });

});

function mostrarMapaModal(lat, lng) {

    $('.modal-mapa').remove();
    
    var content = `
            <div class="modal-mapa">
                <iframe
                    width="100%"
                    height="250"
                    frameborder="0"
                    src="https://www.google.com/maps/embed/v1/view?key=${ googleMapKey }&center=${ lat },${ lng }&zoom=17" allowfullscreen>
                    </iframe>
            </div>
    `;

    modal.append( content );
}

function crearMensajeMapa(lat, lng, personaje) {


    let content = `
    <li class="animated fadeIn fast"
        data-tipo="mapa"
        data-user="${ personaje }"
        data-lat="${ lat }"
        data-lng="${ lng }">
                <div class="avatar">
                    <img src="img/avatars/${ personaje }.jpg">
                </div>
                <div class="bubble-container">
                    <div class="bubble">
                        <iframe
                            width="100%"
                            height="250"
                            frameborder="0" style="border:0"
                            src="https://www.google.com/maps/embed/v1/view?key=${ googleMapKey }&center=${ lat },${ lng }&zoom=17" allowfullscreen>
                            </iframe>
                    </div>
                    
                    <div class="arrow"></div>
                </div>
            </li> 
    `;

    timeline.prepend(content);
}

// CAMARA
var btnPhoto = $("#photo-btn");
var btnTomarFoto = $("#tomar-foto-btn");
var contenedorCamara = $(".camara-contenedor");

const camara = new Camara( $("#player")[0] );

btnPhoto.on("click", ()=>{

    console.log("boton camara");
    contenedorCamara.removeClass("oculto");
    camara.encender();
});


btnTomarFoto.on("click", () => {
    foto = camara.tomarFoto();
    console.log(foto);
    camara.apagar();
});


//NOTIFICACIONES
var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

function notificarme() {

    // Verificar si el navegador soporta notificaciones
    if ( !window.Notification ) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    // Se verifica si ya se tiene permiso para enviar notificaciones
    // existen 3 opciones: granted : se autorizo el permiso para enviar notificaciones, 
    // denied: se denego el permiso aoara enviar notificaciones, default : valor por default
    if ( Notification.permission === 'granted' ) {
        
        enviarNotificacion();

    } else if ( Notification.permission !== 'denied' || Notification.permission === 'default' )  {

        // Se le pide autorizacion al usuario para enviar notificaciones
        Notification.requestPermission( function( permission ) {

            console.log( "Permiso otorgado:", permission );

            // El usuario si acepto el envio de notifcaciones
            if ( permission === 'granted' ) {
                console.log("Si hay permiso");
                enviarNotificacion();
            }

        });

    }
}

//notificarme();

function enviarNotificacion() {

    const notificationOpts = {
        body: 'Este es el cuerpo de la notificación',
        icon: 'img/icons/icon-72x72.png'
    };

    const n = new Notification('Hola Mundo', notificationOpts);

    // Por si se requiere realizar una acción cuando se de clic sobre la notificación
    n.onclick = () => {
        console.log('Le diste clic a la notificacion');
    };

}

function verificaSuscripcion( activadas ) {

    // Verificar el estatus para ver que boton se tiene que activar
    if ( activadas ) {
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');

    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }

}

//verificaSuscripcion();

function getPublicKey() {

    return fetch('api/key')
        .then( res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) );


}


btnDesactivadas.on( 'click', () => {

    // verificar si ya se registro el service worker
    if ( !swReg ) return console.log('No hay registro de SW');

    getPublicKey().then( key => {

        // Realizar la subscripcion del service worker
        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then( res => res.toJSON() )
        .then( suscripcion => {

            // Enviar la subscripion al servidor 
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion )
            .catch( cancelarSuscripcion );

        });
    });
});

btnActivadas.on( 'click', function() {
    cancelarSuscripcion();
});

function cancelarSuscripcion() {
    swReg.pushManager.getSubscription().then( subs => {
        subs.unsubscribe().then( () => verificaSuscripcion(false) );
    });
}

