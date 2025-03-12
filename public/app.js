"use strict";

let activeMarkers = new Map();
let marcadoresTiendas = {};
let storesActivos = false;
let map;
let myLocationMarker;
let autocomplete;

// Añadir al inicio del archivo, después de las declaraciones de variables
function handleSharedUrl() {
     const urlParams = new URLSearchParams( window.location.search );
     const view = urlParams.get( 'view' );
     const id = urlParams.get( 'id' );

     if ( view === 'store' && id ) {
          // Activar la capa de tiendas si no está activa
          if ( !storesActivos ) {
               document.getElementById( 'stores-sub-nav-item' ).click();
          }

          // Esperar a que los marcadores se carguen
          const checkMarkers = setInterval( () => {
               if ( marcadoresTiendas[ id ] ) {
                    clearInterval( checkMarkers );
                    // Simular click en el marcador
                    google.maps.event.trigger( marcadoresTiendas[ id ].marker, 'click' );
                    // Centrar el mapa en el marcador
                    map.setCenter( marcadoresTiendas[ id ].marker.getPosition() );
                    map.setZoom( 18 );
               }
          }, 100 );
     }
}

// Llamar a la función cuando se carga la página
window.addEventListener( 'load', handleSharedUrl );


function precargarImagenes() {
     try {
          Object.values( STATIC_IMAGES ).forEach( url => {
               const img = new Image();
               img.src = url;
          } );
     } catch ( error ) {
          console.error( 'Error al cargar las imágenes:', error );
     }
}

function initMap() {

      // Primero verificar si hay sessionId en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    if (sessionId) {
        console.log("Encontrado sessionId, esperando procesamiento...");
        // Hacer una petición al backend para procesar la sesión
        fetch(`/auth/session?sessionId=${sessionId}`)
            .then(response => {
                if (response.ok) {
                    // Recargar la página sin el sessionId
                    window.location.href = '/';
                } else {
                    window.location.href = '/login';
                }
            })
            .catch(error => {
                console.error("Error procesando sesión:", error);
                window.location.href = '/login';
            });
        return; // No hacer nada más por ahora
    }
     if ( localStorage.getItem( "googleMapsLoaded" ) ) {
          console.log( "El mapa ya está cargado desde la caché" );
          loadCachedMap();
     } else {

     }
     precargarImagenes();
     // Crear un objeto de opciones del mapa
     const mapOptions = {
          zoom: 10,
          minZoom: 3,
          fullscreenControl: false,
          mapTypeControl: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeId: "satellite",
     };

     // Recuperar el token de las cookies
     const token = getCookie( 'access_token' );
     console.log( "Token en frontend:", token );

     // Verificar si el token existe
     if ( !token ) {
          // Si no hay token, redirige a la página de error
          window.location.href = '/login';  // Redirigir a la página de error
          return;  // Detener la ejecución de la función si no hay token
     }

     // Crear el mapa y establecerlo en el div con el id "gmp-map"
     map = new google.maps.Map( document.getElementById( "gmp-map" ), mapOptions );

     // Función para manejar la eliminación de Qubos
     function handleQuboDelete( quboId, marker, infoBox, messageBox ) {
          return async () => {
               if ( confirm( "¿Estás seguro de que deseas eliminar este Qubo?" ) ) {
                    try {
                         console.log( 'Intentando eliminar Qubo:', quboId );
                         console.log( 'Marker antes de eliminar:', marker );
                         console.log( 'ActiveMarkers antes de eliminar:', activeMarkers );

                         const response = await fetch( `/api/v1/qubo/${ quboId }`, {
                              method: 'DELETE',
                              headers: {
                                   'Authorization': `Bearer ${ getCookie( 'access_token' ) }`,
                              }
                         } );

                         if ( response.ok ) {
                              // Eliminar el marcador del mapa
                              marker.setMap( null );
                              console.log( 'Marker después de setMap(null):', marker );

                              // Eliminar el marcador de la colección activeMarkers
                              const deleted = activeMarkers.delete( quboId );
                              console.log( '¿Se eliminó de activeMarkers?:', deleted );
                              console.log( 'ActiveMarkers después de eliminar:', activeMarkers );

                              // Ocultar el infoBox
                              infoBox.style.display = "none";

                              // Mostrar mensaje de éxito
                              messageBox.innerHTML = "Qubo deleted successfully";
                              messageBox.style.display = 'flex';
                              setTimeout( () => {
                                   messageBox.style.display = 'none';
                              }, 3000 );
                         } else {
                              throw new Error( "Error deleting Qubo" );
                         }
                    } catch ( error ) {
                         console.error( "Error:", error );
                         alert( "Error deleting Qubo" );
                    }
               }
          };
     }

     function getCookie( name ) {
          const value = `; ${ document.cookie }`;
          const parts = value.split( `; ${ name }=` );
          if ( parts.length === 2 ) {
               const token = parts.pop().split( ';' ).shift();
               console.log( "Token recuperado:", token );  // Verifica aquí que el token es correcto
               return token;
          }
          return null;  // Si no encuentra la cookie, devuelve null
     }


     document.addEventListener( 'DOMContentLoaded', function () {
          const token = getCookie( 'access_token' );
          if ( !token ) {

               window.location.href = '/login';
               return;
          }

          fetch( '/api/v1/qubo', {
               headers: {
                    'Authorization': `Bearer ${ token }`
               },
               credentials: 'include'  // Importante para enviar cookies en solicitudes
          } )
               .then( response => {
                    // Quitar la verificación de token aquí también
                    if ( !response.ok ) {
                         return response.json();
                    }
                    return response.json();
               } )
               .then( qubos => {
                    qubos.forEach( qubo => {
                         const position = { lat: qubo.latitude, lng: qubo.longitude };
                         const marker = new google.maps.Marker( {
                              position: position,
                              map: map,
                              title: qubo.title,
                              icon: subcategoryIcons.QUBO_ICONS[ qubo.subcategory ] || './assets/quboNeutro.svg'
                         } );

                         // Guardar el marcador en activeMarkers (añade esta línea)
                         activeMarkers.set( qubo._id, marker );

                         marker.addListener( 'click', () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = 'flex';
                              const startDate = new Date( qubo.startDate );
                              const finishDate = new Date( qubo.finishDate );

                              infoBox.innerHTML = `
                         <div class='nameContainer'>
                         <p>${ qubo.subcategory }</p>
                         <p>${ qubo.title }</p>
                         </div>
                         <div class='own'>
                         <img src='${ qubo.img }'>
                         </div>
                         <p>Descripción: <span>${ qubo.description }</span> </p>
                         <p>Categoría: <span>${ qubo.category }</span> </p>
                         <p>Fecha de inicio: <span>${ startDate.toLocaleDateString() } a las ${ startDate.toLocaleTimeString() }</span> </p>
                         <p>Fecha de finalización: ${ finishDate.toLocaleDateString() } a las ${ finishDate.toLocaleTimeString() }</p>
                         <p>Link: <a href="${ qubo.link }" target="_blank">${ qubo.link }</a></p>
                         <p>Anónimo: ${ qubo.anonymous ? "Sí" : "No" }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button id="delete-qubo" data-qubo-id="${ qubo._id }">
                         <img src='./assets/trash-can.svg'>
                         </button>
                    `;
                              // Eliminar listeners anteriores y crear nuevos
                              const closeButton = document.getElementById( "cerrar-info-box" );
                              const deleteButton = document.getElementById( "delete-qubo" );

                              // Clonar y reemplazar los botones para eliminar listeners anteriores
                              const newCloseButton = closeButton.cloneNode( true );
                              const newDeleteButton = deleteButton.cloneNode( true );
                              closeButton.parentNode.replaceChild( newCloseButton, closeButton );
                              deleteButton.parentNode.replaceChild( newDeleteButton, deleteButton );

                              newCloseButton.addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );

                              // Para Qubos existentes (en el fetch inicial)
                              newDeleteButton.addEventListener( "click", handleQuboDelete( qubo._id, marker, infoBox, messageBox ) );


                         } );
                    } );
               } )
               .catch( error => console.error( 'Error al cargar los Qubos:', error ) );
     } );


     // Define la URL de la imagen del icono personalizado
     const customIconUrl = "./assets/qubonegro.svg"; // Reemplaza con la URL de tu imagen

     // Crear un marcador para tu ubicación inicial con el icono personalizado
     myLocationMarker = new google.maps.Marker( {
          map: map,
          title: "Mi ubicación",
          icon: customIconUrl,
     } );
     //! CUIDADO!!
     myLocationMarker.addListener( "click", function () {
          const infoBox = document.querySelector( ".info-box" );
          const content = `
          <p>Contenido del párrafo</p>
          <button id="cerrar-info-box">Mi botón</button>
     `;
          // Insertar el contenido en el elemento info-box
          infoBox.innerHTML = content;

          // Agregar un evento click al botón de cierre
          const cerrarBoton = document.getElementById( "cerrar-info-box" );
          cerrarBoton.addEventListener( "click", function () {
               infoBox.innerHTML = ""; // Elimina el contenido del info-box
          } );
     } );

     document.addEventListener( 'DOMContentLoaded', () => {
          const inputContainer = document.getElementById( 'input-container' );
          const searchDirectionButton = document.getElementById( 'search-direction-button' );

          // Función para mostrar y ocultar el inputContainer
          const toggleInputContainer = () => {
               if ( inputContainer.style.display === 'none' || inputContainer.style.display === '' ) {
                    inputContainer.style.display = 'block';
                    inputContainer.style.opacity = '1';
                    inputContainer.style.zIndex = '1000'; // Asegura que esté encima
                    searchDirectionButton.classList.add( 'active' );
               } else {
                    inputContainer.style.display = 'none';
                    inputContainer.style.opacity = '0';
                    inputContainer.style.zIndex = '-1'; // Oculta debajo
                    searchDirectionButton.classList.remove( 'active' );
               }
          };

          // Evento para mostrar y ocultar el inputContainer al hacer clic en el botón
          searchDirectionButton.addEventListener( 'click', toggleInputContainer );
     } );




     //? Funcion del INPUT

     const searchButton = document.querySelector( '.search' );
     const inputContainer = document.getElementById( 'input-container' );
     let isVisible = false; // Estado de visibilidad

     // Función que maneja la visibilidad del contenedor de entrada
     function toggleInputContainerVisibility() {
          isVisible = !isVisible; // Cambia el estado de visibilidad

          if ( isVisible ) {
               inputContainer.style.opacity = '1';
               inputContainer.style.overflow = 'visible';
          } else {
               inputContainer.style.opacity = '0';
               inputContainer.style.overflow = 'hidden';
          }
     };

     // Evento de clic que llama a la función toggleInputContainerVisibility
     searchButton.addEventListener( 'click', toggleInputContainerVisibility );


     //************* ADD QUBO *****************/
     function centerFormContainer() {
          const formContainer = document.querySelector( '.form-container' );
          const formWidth = formContainer.offsetWidth;
          const formHeight = formContainer.offsetHeight;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;

          const left = ( windowWidth / 2 ) - ( formWidth / 2 );
          const top = ( windowHeight / 2 ) - ( formHeight / 2 ) - 50;

          formContainer.style.left = left + 'px';
          formContainer.style.top = top + 'px';
     }

     let subcategoryIcons = {};

     document.addEventListener( 'DOMContentLoaded', function () {
          // Cargar los iconos de las subcategorías desde el servidor
          fetch( '/api/qubo-icons' )
               .then( response => response.json() )
               .then( data => {
                    subcategoryIcons = data;
                    console.log( 'Subcategory Icons:', subcategoryIcons );
               } )
               .catch( error => console.error( 'Error loading subcategory icons:', error ) );

          const addQuboButton = document.getElementById( 'addQubo' );
          const formContainer = document.querySelector( '.form-container' );
          const messageBox = document.getElementById( 'messageBox' );
          const closeButton = document.getElementById( 'cerrar-form' );

          let isAddingQubo = false;
          let currentMarker = null;

          function normalizeString( str ) {
               const normalized = str.toLowerCase()
                    .replace( /&/g, 'and' )
                    .replace( /[\s-_]+/g, '' )
                    .trim();
               return normalized;
          }


          // En el event listener de 'change'
          document.getElementById( 'subcategory' ).addEventListener( 'change', function () {
               if ( currentMarker ) {
                    const subcategory = this.value;
                    const normalizedSubcategory = normalizeString( subcategory );  // Normalizar el valor
                    console.log( 'Subcategoría seleccionada:', subcategory );
                    console.log( 'Subcategoría normalizada:', normalizedSubcategory );

                    const position = currentMarker.getPosition();
                    currentMarker.setMap( null );

                    // Buscar el icono comparando valores normalizados
                    const iconKey = Object.keys( subcategoryIcons.QUBO_ICONS )
                         .find( key => normalizeString( key ) === normalizedSubcategory );  // Comparar normalizados
                    const iconUrl = iconKey ? subcategoryIcons.QUBO_ICONS[ iconKey ] : './assets/quboNeutro.svg';
                    console.log( 'Changing icon to:', iconUrl );

                    currentMarker = new google.maps.Marker( {
                         position: position,
                         map: map,
                         title: 'New Qubo',
                         icon: iconUrl
                    } );
               }
          } );

          addQuboButton.addEventListener( 'click', function () {
               isAddingQubo = true;
               messageBox.style.display = 'block';
               formContainer.classList.add( 'hidden' );
               console.log( 'Qubo add mode activated, please click on the map to select the location.' );
          } );

          map.addListener( 'click', function ( event ) {
               if ( isAddingQubo ) {
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    console.log( "Latitud:", lat, "Longitud:", lng );
                    if ( currentMarker ) {
                         currentMarker.setMap( null );
                    }

                    const subcategory = document.getElementById( 'subcategory' ).value;
                    const iconKey = Object.keys( subcategoryIcons.QUBO_ICONS )
                         .find( key => normalizeString( key ) === subcategory );
                    const iconUrl = iconKey ? subcategoryIcons.QUBO_ICONS[ iconKey ] : './assets/quboNeutro.svg';
                    console.log( 'Subcategory:', subcategory );
                    console.log( 'Icon URL:', iconUrl );

                    currentMarker = new google.maps.Marker( {
                         position: event.latLng,
                         map: map,
                         title: 'Nuevo Qubo',
                         icon: iconUrl
                    } );

                    document.getElementById( 'clickedLat' ).value = lat;
                    document.getElementById( 'clickedLng' ).value = lng;

                    formContainer.classList.remove( 'hidden' );
                    messageBox.style.display = 'none';

                    isAddingQubo = false;
                    console.log( 'Formulario mostrado, por favor completa la información del Qubo.' );
               }
          } );

          closeButton.addEventListener( 'click', function () {
               formContainer.classList.add( 'hidden' );
               isAddingQubo = false;

               if ( currentMarker ) {
                    currentMarker.setMap( null );
                    currentMarker = null;
               }

               console.log( 'Formulario cerrado, marcador eliminado.' );
          } );
     } );




     document.addEventListener( 'DOMContentLoaded', function () {
          const closeButton = document.getElementById( 'cerrar-form' );
          const formContainer = document.querySelector( '.form-container' );

          closeButton.addEventListener( 'click', function () {
               formContainer.classList.add( 'hidden' );
          } );
     } );


     document.addEventListener( 'DOMContentLoaded', function () {
          const formContainer = document.querySelector( '.form-container' );
          const dragHandle = document.querySelector( '.drag-handle' );
          let isDown = false;
          let offsetX, offsetY;

          dragHandle.addEventListener( 'mousedown', function ( e ) {
               // Verifica si el evento se originó dentro de un desplegable
               const isInsideSelect = e.target.closest( 'select' );
               if ( isInsideSelect ) {
                    // Si el evento se originó dentro de un desplegable, no permite el movimiento
                    return;
               }

               isDown = true;
               offsetX = e.clientX - formContainer.getBoundingClientRect().left;
               offsetY = e.clientY - formContainer.getBoundingClientRect().top;
          } );

          document.addEventListener( 'mouseup', function () {
               isDown = false;
          } );

          document.addEventListener( 'mousemove', function ( e ) {
               if ( isDown ) {
                    formContainer.style.left = ( e.clientX - offsetX ) + 'px';
                    formContainer.style.top = ( e.clientY - offsetY ) + 'px';
               }
          } );
     } );

     //***************************************************** */




     const categoryMappings = {
          Buildings: [
               "New Buildings",
               "Houses",
               "Offices",
               "Commercial or industrial",
               "Garages",
               "Parcels",
               "Other Buildings",
               "Iconic",
               "Under Construction" /* más subcategorías */,
          ],
          Mobility: [
               "Taxi",
               "VTC",
               "Car Traffic",
               "Parking",
               "E-Car Stations",
               "Car Sharing",
               "Moto Sharing",
               "Bicycle Sharing",
               "Scooter Sharing",
               "Bus",
               "Metro",
               "Trams",
               "Trains",
               "Airplane",
               "Helicopter",
               "Boats" /* más subcategorías */,
          ],
          Health: [
               "Hospitals & Clinics",
               "Deathcare",
               "Optics, Dentists, etc",
               "Virus Hazard",
               "Pharmacy",
               "Ambulances",
          ],
          Security: [ "Police", "Fire", "Military", "Cybersecurity" ],
          Infraestructure: [ "Waste", "Water", "Electricity", "Sewage", "Internet" ],
          Logistics: [ "Pick-up Points", "Pack Location", "Tracking", "Ports", "Ships", "Trucks", "Stores" ],
          "Environment & Sustainability": [
               "Parks & Gardens",
               "Fountains",
               "Pedestrian Zones",
               "Zoos & Aquariums",
               "WildLife",
               "Lakes & Rivers",
               "Beaches",
               "Protected Zones",
               "Environment",
               "Recycling",
               "Streetslights",
               "Energy efficiency",
               "Water usage",
          ],
          "Entertainment & Sports": [
               "Events & Concerts",
               "Theatres",
               "Cinemas",
               "Stadiums",
               "Theme Parks",
               "Landmarks",
               "Clubs & Nightlife",
               "Hotels & Apartments",
               "Sports Facilities",
               "Museums",
          ],
          Services: [ "Social Services", "Administration", "Education" ],
          Incidences: [
               "Buildings",
               "Mobility",
               "Health",
               "Security",
               "Infraestructure",
               "Logistics",
               "Environment & Sustainability",
               "Entertainment & Sports",
               "Services",
          ],
          // Añade más categorías y subcategorías aquí
     };

     // // Función para actualizar las subcategorías cuando se selecciona una categoría
     // function updateSubcategories() {
     //      const categorySelect = document.getElementById( "category" );
     //      const subcategorySelect = document.getElementById( "subcategory" );
     //      const selectedCategory = categorySelect.value;

     //      // Limpiar subcategorías existentes
     //      subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';

     //      // Añadir nuevas subcategorías en función de la categoría seleccionada
     //      if ( selectedCategory && categoryMappings[ selectedCategory ] ) {
     //           categoryMappings[ selectedCategory ].forEach( ( subcategory ) => {
     //                const option = document.createElement( "option" );
     //                // Cambiar la transformación para que coincida con el formato camelCase
     //                const value = subcategory.replace( /\s+/g, '' ).charAt( 0 ).toLowerCase() + subcategory.replace( /\s+/g, '' ).slice( 1 );
     //                option.value = value;
     //                option.textContent = subcategory;
     //                subcategorySelect.appendChild( option );
     //           } );
     //      }
     // }
     function updateSubcategories() {
          const categorySelect = document.getElementById( "category" );
          const subcategorySelect = document.getElementById( "subcategory" );
          const selectedCategory = categorySelect.value;

          // Limpiar subcategorías existentes
          subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';

          // Añadir nuevas subcategorías en función de la categoría seleccionada
          if ( selectedCategory && categoryMappings[ selectedCategory ] ) {
               categoryMappings[ selectedCategory ].forEach( ( subcategory ) => {
                    const option = document.createElement( "option" );
                    // Simplemente eliminar espacios y convertir a minúsculas
                    const value = subcategory.replace( /\s+/g, '' ).toLowerCase();
                    option.value = value;
                    option.textContent = subcategory;
                    subcategorySelect.appendChild( option );
               } );
          }
     }

     // Evento listener para cuando la categoría cambie
     document.getElementById( "category" ).addEventListener( "change", updateSubcategories );

     document.addEventListener( "DOMContentLoaded", function () {
          // Selecciona tus inputs de fecha
          var dateInputs = document.querySelectorAll( '.date-input' );

          // Función para transformar un input de texto a tipo fecha
          var transformToDatepicker = function ( input ) {
               input.type = 'datetime-local';
               input.focus(); // Para abrir el datepicker inmediatamente
               // Agrega cualquier otro estilo o atributo si es necesario
          };

          // Añade el evento que transforma cada campo al hacer clic o al enfocarse
          dateInputs.forEach( function ( input ) {
               input.addEventListener( 'focus', function () {
                    transformToDatepicker( input );
               } );
               input.addEventListener( 'click', function () {
                    transformToDatepicker( input );
               } );
          } );
     } );

     //********************************************************/
     //*Nuevo código para manejar el envío del formulario


     document.addEventListener( 'DOMContentLoaded', function () {
          const form = document.getElementById( 'categoryForm' );
          const formContainer = document.querySelector( '.form-container' );
          const messageBox = document.getElementById( 'messageBox' );
          const closeButton = document.getElementById( 'cerrar-form' );
          let currentMarker = null; // Variable para el marcador temporal
          let isAddingQubo = false; // Definimos la variable de control aquí

          // Evento para el botón de añadir Qubo
          const addQuboButton = document.getElementById( 'addQubo' );
          addQuboButton.addEventListener( 'click', function () {
               isAddingQubo = true;
               messageBox.style.display = 'block';
               messageBox.innerHTML = 'Qubo add mode activated, please click on the map to select the location.';
          } );


          // Evento para el botón de cerrar formulario
          closeButton.addEventListener( 'click', function () {
               formContainer.classList.add( 'hidden' );
               messageBox.style.display = 'none';
               // Eliminar el marcador temporal si existe
               if ( currentMarker ) {
                    currentMarker.setMap( null );
                    currentMarker = null;
               }
               isAddingQubo = false; // Reseteamos el estado
          } );

          // Evento click en el mapa
          map.addListener( 'click', function ( event ) {
               if ( isAddingQubo ) {
                    if ( currentMarker ) {
                         currentMarker.setMap( null );
                    }
                    currentMarker = new google.maps.Marker( {
                         position: event.latLng,
                         map: map,
                         icon: './assets/quboNeutro.svg'
                    } );

                    document.getElementById( 'clickedLat' ).value = event.latLng.lat();
                    document.getElementById( 'clickedLng' ).value = event.latLng.lng();

                    formContainer.classList.remove( 'hidden' );
                    messageBox.style.display = 'none';
                    isAddingQubo = false;
               }
          } );

          // let newMarker;
          // Evento submit del formulario
          form.addEventListener( 'submit', function ( event ) {
               event.preventDefault();

               const startDate = new Date( document.getElementById( 'startDateTime' ).value );
               const finishDate = new Date( document.getElementById( 'endDateTime' ).value );

               if ( isNaN( startDate.valueOf() ) || isNaN( finishDate.valueOf() ) ) {
                    alert( 'Please enter valid start and finish dates.' );
                    return;
               }

               const formData = new FormData( form );

               fetch( form.action, {
                    method: 'POST',
                    headers: {
                         'Authorization': 'Bearer test123'  // Añadimos el token aquí
                    },
                    body: formData
               } )
                    .then( response => {
                         if ( !response.ok ) {
                              return response.text().then( text => {
                                   throw new Error( `Error del servidor: ${ text }` );
                              } );
                         }
                         return response.json();
                    } )
                    .then( data => {
                         console.log( 'Datos recibidos del servidor:', data );

                         // Crear nuevo marcador con los datos recibidos
                         const marker = new google.maps.Marker( {
                              position: {
                                   lat: parseFloat( data.latitude ),
                                   lng: parseFloat( data.longitude )
                              },
                              map: map,
                              title: data.title, // Usar el título del servidor
                              icon: subcategoryIcons.QUBO_ICONS[ data.subcategory ] || './assets/quboNeutro.svg'
                         } );

                         // Guardar el marcador en nuestro registro
                         activeMarkers.set( data._id, marker );

                         // Añadir event listener al nuevo marcador usando la sintaxis correcta
                         marker.addListener( 'click', function () {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = 'flex';

                              infoBox.innerHTML = `
                                   <div class='nameContainer'>
                                        <p>${ data.category }</p>
                                        <p>${ data.title }</p>
                                   </div>
                                   <div class='own'>
                                        <img src='${ data.img }'>
                                   </div>
                                   <p>Descripción: ${ data.description }</p>
                                   <p>Subcategoría: ${ data.subcategory }</p>
                                   <p>Fecha de inicio: ${ new Date( data.startDate ).toLocaleDateString() } a las ${ new Date( data.startDate ).toLocaleTimeString() }</p>
                                   <p>Fecha de finalización: ${ new Date( data.finishDate ).toLocaleDateString() } a las ${ new Date( data.finishDate ).toLocaleTimeString() }</p>
                                   <p>Link: <a href="${ data.link }" target="_blank">${ data.link }</a></p>
                                   <p>Anónimo: ${ data.anonymous ? "Sí" : "No" }</p>
                                   <button id="cerrar-info-box">
                                        <img src='./assets/botonCerrar.svg'>
                                   </button>
                                   <button id="delete-qubo" data-qubo-id="${ data._id }">
                                        <img src='./assets/trash-can.svg'>
                                   </button>
                              `;

                              // Obtener los botones
                              const closeButton = document.getElementById( "cerrar-info-box" );
                              const deleteButton = document.getElementById( "delete-qubo" );

                              // Clonar los botones para eliminar event listeners anteriores
                              const newCloseButton = closeButton.cloneNode( true );
                              const newDeleteButton = deleteButton.cloneNode( true );
                              closeButton.parentNode.replaceChild( newCloseButton, closeButton );
                              deleteButton.parentNode.replaceChild( newDeleteButton, deleteButton );

                              // Añadir nuevos event listeners a los botones clonados
                              newCloseButton.addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );

                              // Para Qubos nuevos (en el submit del formulario)
                              newDeleteButton.addEventListener( "click", handleQuboDelete( data._id, marker, infoBox, messageBox ) );

                         } );


                         // Limpiar el formulario y mostrar mensaje de éxito
                         form.reset();
                         formContainer.classList.add( 'hidden' );

                         messageBox.innerHTML = `Qubo añadido con éxito!`;
                         messageBox.style.display = 'flex';
                         setTimeout( () => {
                              messageBox.style.display = 'none';
                         }, 3000 );

                         // Eliminar el marcador temporal
                         if ( currentMarker ) {
                              currentMarker.setMap( null );
                              currentMarker = null;
                         }
                    } );
          } );
     } );


     //! PRUEBA CON OTRO KML DE BARRIO

     // const barriosKmlUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Neighborhoods/Barrios2.kmz?sp=r&st=2024-03-19T17:54:24Z&se=2090-01-01T01:54:24Z&sv=2022-11-02&sr=b&sig=vpb7TFY02eM1%2Bb7ixsVEPQe7pt6dov0An3aNK%2BJCDw8%3D";
     // const barriosKmlUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Neighborhoods/Barrios%204.kmz?sp=r&st=2024-03-23T19:59:18Z&se=2090-01-01T03:59:18Z&sv=2022-11-02&sr=b&sig=BX4h0yMFnSijUzsdeyTUYn7olHSv9tOBc%2BFDrffaSZs%3D";
     const barriosKmlUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Neighborhoods/Barrios_v12_final.kml?sp=r&st=2024-03-24T20:31:02Z&se=2090-01-01T04:31:02Z&sv=2022-11-02&sr=b&sig=RQHAB8oFBzEBkuwX6ogPIoqRQVOq%2BYo6QMwlU30eyqg%3D";

     const valenciaAPIURL = "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/barris-barrios/records?limit=88";

     let kmlLayerBarrios = null; // Capa KML para los barrios de Madrid
     let poligonosBarriosValencia = []; // Arreglo para almacenar los polígonos de los barrios de Valencia
     let barriosVisible = false; // Bandera para controlar la visibilidad de los barrios

     function toggleBarrios() {
          // Manejar la capa KML de Madrid
          if ( !kmlLayerBarrios ) {
               kmlLayerBarrios = new google.maps.KmlLayer( {
                    url: barriosKmlUrl,
                    map: map,
                    preserveViewport: true
               } );
          } else {
               kmlLayerBarrios.setMap( kmlLayerBarrios.getMap() ? null : map );
          }

          // Manejar los polígonos de Valencia
          if ( poligonosBarriosValencia.length === 0 ) {
               crearPoligonosValencia();
          } else {
               poligonosBarriosValencia.forEach( polygon => {
                    polygon.setMap( polygon.getMap() ? null : map );
               } );
          }

          barriosVisible = !barriosVisible; // Alternar la visibilidad

          document.getElementById( "toggleBarrios" ).classList.toggle( 'active' );
     }

     // Función para crear y mostrar polígonos para los barrios de Valencia
     function crearPoligonosValencia() {
          fetch( valenciaAPIURL )
               .then( response => response.json() )
               .then( data => {
                    data.results.forEach( result => {
                         const coordinates = result.geo_shape.geometry.coordinates[ 0 ];
                         const latLngs = coordinates.map( coordinate => ( {
                              lat: coordinate[ 1 ],
                              lng: coordinate[ 0 ]
                         } ) );

                         const polygon = new google.maps.Polygon( {
                              paths: latLngs,
                              strokeColor: "#08ecc4",
                              strokeOpacity: 0.8,
                              strokeWeight: 4,
                              fillColor: "#08ecc4",
                              fillOpacity: 0.35,
                              map: map
                         } );

                         poligonosBarriosValencia.push( polygon );
                    } );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud para Valencia:", error ) );

     }

     document.getElementById( "toggleBarrios" ).addEventListener( "click", toggleBarrios );


     //?
     // Primero, añade esto al inicio de tu archivo donde tienes las otras variables globales
     let allKMLLayers = [];  // Array para almacenar todas las capas KML

     // Añade la función addKMLLayer
     function addKMLLayer( kmlLayer ) {
          allKMLLayers.push( kmlLayer );
     }

     // Luego tu código del car sharing
     const carSharingUrl = "https://data-lakecountyil.opendata.arcgis.com/api/download/v1/items/3e0c1eb04e5c48b3be9040b0589d3ccf/kml?layers=8";
     let kmlLayerCarSharing = null;
     let carSharingVisible = false;

     document.getElementById( 'car-sharing-sub-nav-item' ).addEventListener( 'click', function () {
          if ( !kmlLayerCarSharing ) {
               kmlLayerCarSharing = new google.maps.KmlLayer( {
                    url: carSharingUrl,
                    map: map,
                    preserveViewport: false
               } );

               addKMLLayer( kmlLayerCarSharing );

          } else {
               kmlLayerCarSharing.setMap( kmlLayerCarSharing.getMap() ? null : map );
          }

          carSharingVisible = !carSharingVisible;
     } );
     //! Botón INFRAESTRUCTURE ***************

     //* WASTE

     const wasteDataUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Waste/Fiware_Infrastrucutre_Waste-00001?sp=r&st=2024-07-26T13:58:57Z&se=2090-01-01T22:58:57Z&sv=2022-11-02&sr=b&sig=lhKBlzjCSdUGPUoIBK9A5a34BOpHCuSIQxJCqB31z1M%3D"
     ) }`;
     const botonWaste = document.getElementById( 'waste-sub-nav-item' );

     let markersWaste = []; // Array para almacenar los marcadores
     let wasteVisible = false; // Bandera para el estado de visibilidad

     const cargarMarcadoresWaste = () => {

          fetch( wasteDataUrl )
               .then( response => response.json() )
               .then( data => {
                    data.buildings0023.forEach( item => {
                         const {
                              ubicacion,
                              id,
                              name,
                              type,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/waste_Qubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                                        <div class='nameContainer'>
                                             <p>${ type }</p>
                                             <p>${ name }</p>
                                        </div>
                                        <img src='${ STATIC_IMAGES.waste }'>
                                        <p> <span>${ description }</span> </p>
                                        <p>Address: <span>${ streetAddress }, ${ postalCode }</span> </p>
                                        <p>Localización: <span>${ addressLocality }, ${ addressCountry }, ${ addressRegion }</span> </p>
                                        <p>Owner: <span>${ owner }</span> </p>
                                        <p>ID: <span>${ id }</span> </p>
                                        <button id="cerrar-info-box">
                                             <img src='./assets/botonCerrar.svg'>
                                        </button>
                                        <button class='share'>
                                             <img src='./assets/shareIcon.svg'>
                                        </button>
                                   `;

                                   const cerrarBoton = document.getElementById( "cerrar-info-box" );
                                   cerrarBoton.addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersWaste.push( marker ); // Añade el marcador al array de marcadores
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     botonWaste.addEventListener( 'click', () => {
          // Alternar la visibilidad de los marcadores de Waste
          toggleMarcadores( markersWaste, wasteVisible );
          wasteVisible = !wasteVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersWaste.length === 0 && wasteVisible ) {
               cargarMarcadoresWaste();
          }
     } );

     //* WATER (CANALES Y MARCADORES)

     // Define la URL de la API con el proxy
     const waterDataUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Water/Fiware_Infrastrucutre_Water-00001?sp=r&st=2024-07-26T14:09:03Z&se=2089-12-31T23:09:03Z&sv=2022-11-02&sr=b&sig=uKfzeccU6PmxgxnteSboUDZAYsQyA%2FfF9wmlyEU8J0Q%3D"
     ) }`;

     const canalMadrid = "https://anpaccountdatalakegen2.blob.core.windows.net/raw/Infrastructure/Water/QUBO%20-%20Water.kml?sp=r&st=2024-03-19T14:19:01Z&se=2090-12-06T22:19:01Z&sv=2022-11-02&sr=b&sig=5mdDfeeQvvQlvGqq4fj71h%2BpZFYh8DryLUkkxjaIZbE%3D";
     const botonWater = document.getElementById( 'water-sub-nav-item' );

     let kmlLayerWater = null; // Variable para mantener la capa KML
     let markersWater = []; // Array para almacenar los marcadores
     let waterVisible = false; // Bandera para el estado de visibilidad
     let animatedWaterLines = [];

     const cargarMarcadoresWater = () => {

          fetch( waterDataUrl )
               .then( response => response.json() )
               .then( data => {
                    data.wastewaterplant0002.forEach( item => {
                         const {
                              id,
                              ubicacion,
                              name,
                              type,
                              category,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/waterQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                                        <div class='nameContainer'>
                                             <p>Waste Water Plant</p>
                                             <p>${ name }</p>
                                        </div>
                                        <img src='${ STATIC_IMAGES.water }'>
                                        <p> <span>${ description }</span> </p>
                                        <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                                        <p>Country: <span>${ addressCountry }</span> </p>
                                        <p>ID: <span>${ id }</span> </p>
                                        <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                                        <button id="cerrar-info-box">
                                             <img src='./assets/botonCerrar.svg'>
                                        </button>
                                        <button class='share'>
                                             <img src='./assets/shareIcon.svg'>
                                        </button>
                                   `;

                                   const cerrarBoton = document.getElementById( "cerrar-info-box" );
                                   cerrarBoton.addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersWater.push( marker ); // Añade el marcador al array de marcadores
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     // Nueva función para crear línea de agua de prueba
     function createTestWaterLine() {
          const testCoordinates = [
               { lat: 40.4165, lng: -3.7025 }, // Plaza Mayor
               { lat: 40.4150, lng: -3.7147 }, // Puente de Segovia
               { lat: 40.4130, lng: -3.7208 }, // Madrid Río
               { lat: 40.4075, lng: -3.7236 }, // Matadero
               { lat: 40.3983, lng: -3.7242 }  // Legazpi
          ];

          const waterPath = new google.maps.Polyline( {
               path: testCoordinates,
               geodesic: true,
               strokeColor: '#08ecc4',
               strokeOpacity: 0.8,
               strokeWeight: 4,
               icons: [ {
                    icon: {
                         path: 'M 0,-2 0,2',
                         strokeColor: '#ffffff',
                         strokeOpacity: 1,
                         scale: 3
                    },
                    offset: '0',
                    repeat: '20px'
               } ],
               map: map
          } );

          // Animar la línea
          let count = 0;
          window.setInterval( () => {
               count = ( count + 1 ) % 200;
               const icons = waterPath.get( 'icons' );
               icons[ 0 ].offset = ( count / 2 ) + 'px';
               waterPath.set( 'icons', icons );
          }, 20 );

          return waterPath;
     }

     // Event listener para el botón
     botonWater.addEventListener( 'click', () => {
          // Manejar marcadores existentes
          toggleMarcadores( markersWater, waterVisible );

          if ( !waterVisible ) {
               // Cargar marcadores si no existen
               if ( markersWater.length === 0 ) {
                    cargarMarcadoresWater();
               }

               // Crear y mostrar la línea de prueba
               const animatedLine = createTestWaterLine();
               animatedWaterLines.push( animatedLine );

               // Crear o mostrar la capa KML
               if ( !kmlLayerWater ) {
                    kmlLayerWater = new google.maps.KmlLayer( {
                         url: canalMadrid,
                         map: map,
                         preserveViewport: true
                    } );
               } else {
                    kmlLayerWater.setMap( map );
               }

               // Centrar el mapa en Madrid
               map.setCenter( { lat: 40.4165, lng: -3.7025 } );
               map.setZoom( 13 );
          } else {
               // Ocultar las líneas animadas
               animatedWaterLines.forEach( line => {
                    if ( line ) line.setMap( null );
               } );

               // Ocultar la capa KML
               if ( kmlLayerWater ) {
                    kmlLayerWater.setMap( null );
               }
          }

          waterVisible = !waterVisible;
          document.getElementById( "toggleBarrios" ).classList.toggle( 'active' );
     } );


     //* ELECTRICITY
     const electricityMadrid = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Electricity/Electricity.kmz?sp=r&st=2024-05-19T15:09:48Z&se=2029-01-01T00:09:48Z&sv=2022-11-02&sr=b&sig=BMuM4bLJ7RWEGSjsY6zZeWrKSu8IPa%2F9KK46GpZBN4I%3D";

     const botonElectricity = document.getElementById( 'electricity-sub-nav-item' );
     let kmlElectriity = null;
     botonElectricity.addEventListener( 'click', () => {
          if ( kmlElectriity ) {
               // Si la capa KML ya existe, alternar su visibilidad
               kmlElectriity.setMap( kmlElectriity.getMap() ? null : map );
          } else {
               // Si la capa KML no existe, crearla y añadirla al mapa
               kmlElectriity = new google.maps.KmlLayer( {
                    url: electricityMadrid,
                    map: map // Asegúrate de que 'map' es una referencia válida a tu instancia de Google Maps
               } );
          }
     } );

     //* SEWAGE

     const sewageLayerUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Sewage/Sewage.kmz?sp=r&st=2024-06-09T18:27:56Z&se=2029-12-30T03:27:56Z&sv=2022-11-02&sr=b&sig=1gOMOStDlrl%2FWnbB1jf%2FOyJEjkGA%2FqJkAE4NCsyiAsc%3D";
     const sewageDataUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Sewage/Fiware_Infrastrucutre_Sewage-00001?sp=r&st=2024-07-26T13:49:37Z&se=2090-01-01T22:49:37Z&sv=2022-11-02&sr=b&sig=BJE4RDiFv0hsozpEgXkY7%2FQXxtArJcdlmgsCnFN8i%2Fo%3D"
     ) }`;
     const botonSewage = document.getElementById( 'sewage-sub-nav-item' );

     let kmlLayerSewage = null; // Variable para mantener la capa KML
     let markersSewage = []; // Array para almacenar los marcadores
     let sewageVisible = false; // Bandera para el estado de visibilidad
     let animatedSewageLines = [];

     const cargarMarcadoresSewage = () => {

          fetch( sewageDataUrl )
               .then( response => response.json() )
               .then( data => {
                    data.wastewaterplant0001.forEach( item => {
                         const {
                              ubicacion,
                              id,
                              name,
                              type,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/sewageQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                            <div class='nameContainer'>
                                <p>${ type }</p>
                                <p>${ name }</p>
                            </div>
                            <img src='${ STATIC_IMAGES.sewage }'>
                            <p> <span>  ${ description }</span> </p>
                            <p>Localización: <span>${ addressCountry }, ${ addressRegion }</span> </p>
                            <p>ID: <span>${ id }</span> </p>
                            <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                            <button id="cerrar-info-box">
                                <img src='./assets/botonCerrar.svg'>
                            </button>
                            <button class='share'>
                                <img src='./assets/shareIcon.svg'>
                            </button>
                        `;

                                   const cerrarBoton = document.getElementById( "cerrar-info-box" );
                                   cerrarBoton.addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersSewage.push( marker ); // Añade el marcador al array de marcadores
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     function createTestSewageLine() {
          const diagonalCoordinates = [
               { lat: 41.3918, lng: 2.1441 },  // Inicio cerca de Francesc Macià
               { lat: 41.3925, lng: 2.1484 },  // Entorno de Pau Casals
               { lat: 41.3944, lng: 2.1557 },  // Cerca de Passeig de Gràcia
               { lat: 41.3976, lng: 2.1635 },  // Zona de Rambla de Catalunya
               { lat: 41.4005, lng: 2.1738 },  // Alrededor de la Sagrada Familia
               { lat: 41.4036, lng: 2.1824 },  // Plaça de les Glòries Catalanes
               { lat: 41.4072, lng: 2.1905 },  // Próximo a Rambla Prim
               { lat: 41.4102, lng: 2.2123 }   // Final en el Fórum
          ];

          const sewagePath = new google.maps.Polyline( {
               path: diagonalCoordinates,
               geodesic: true,
               strokeColor: '#8B4513',  // Marrón más oscuro para la línea base
               strokeOpacity: 1,        // Aumentada la opacidad
               strokeWeight: 6,         // Aumentado el grosor
               icons: [ {
                    icon: {
                         path: 'M 0,-2 0,2',
                         strokeColor: '#D2691E',  // Marrón más claro para el efecto de movimiento
                         strokeOpacity: 1,
                         scale: 4                 // Aumentado el tamaño de los símbolos
                    },
                    offset: '0',
                    repeat: '20px'
               }, {
                    // Segundo conjunto de símbolos para más efecto visual
                    icon: {
                         path: 'M 0,-1.5 0,1.5',
                         strokeColor: '#A0522D',  // Marrón medio para variación
                         strokeOpacity: 1,
                         scale: 3
                    },
                    offset: '10px',
                    repeat: '20px'
               } ],
               map: map
          } );

          // Animar la línea (igual que water)
          let count = 0;
          window.setInterval( () => {
               count = ( count + 1 ) % 200;
               const icons = sewagePath.get( 'icons' );
               icons[ 0 ].offset = ( count / 2 ) + 'px';
               icons[ 1 ].offset = ( ( count / 2 ) + 10 ) + 'px';  // Offset diferente para el segundo icono
               sewagePath.set( 'icons', icons );
          }, 20 );

          return sewagePath;
     }
     // Event listener modificado para el botón
     botonSewage.addEventListener( 'click', () => {
          // Manejar la capa KML
          if ( kmlLayerSewage ) {
               kmlLayerSewage.setMap( kmlLayerSewage.getMap() ? null : map );
          } else {
               kmlLayerSewage = new google.maps.KmlLayer( {
                    url: sewageLayerUrl,
                    map: map,
                    preserveViewport: true
               } );
          }

          // Manejar los marcadores
          toggleMarcadores( markersSewage, sewageVisible );

          if ( !sewageVisible ) {
               // Cargar marcadores si no existen
               if ( markersSewage.length === 0 ) {
                    cargarMarcadoresSewage();
               }

               // Crear y mostrar la línea animada
               const animatedLine = createTestSewageLine();
               animatedSewageLines.push( animatedLine );

               // Centrar el mapa en Barcelona
               map.setCenter( { lat: 41.3935, lng: 2.1527 } );
               map.setZoom( 13 );
          } else {
               // Ocultar las líneas animadas
               animatedSewageLines.forEach( line => {
                    if ( line ) line.setMap( null );
               } );
          }

          sewageVisible = !sewageVisible;
     } );


     //* INTERNET

     //* INTERNET
     const internetApiUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Internet/Fiware_Infrastructure_Internet-00001?sp=r&st=2024-07-26T13:38:02Z&se=2090-01-01T22:38:02Z&sv=2022-11-02&sr=b&sig=QEN2zLfP7J7RqY%2BDZlR%2BO5ggA0RVSGBdkGMMl4nOsRM%3D"
     ) }`;

     const fiberOpticUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Internet/Fiber%20Optic%20Coverage%20in%20Europe.kmz?sp=r&st=2025-01-28T17:43:08Z&se=2090-01-29T01:43:08Z&sv=2022-11-02&sr=b&sig=9B2TfJ%2BKzrs71jAu6cWKG02oQg2neV47d%2BQ7UR%2BUDws%3D";

     let kmlLayerFiberOptic = null;
     let markersInternet = [];
     let internetVisible = false;

     const cargarMarcadoresInternet = () => {
          fetch( internetApiUrl )
               .then( response => {
                    if ( response.ok ) {
                         return response.json();
                    } else {
                         throw new Error( "La solicitud no fue exitosa" );
                    }
               } )
               .then( data => {
                    const markersData = data.wifipointofinterest0001;

                    markersData.forEach( item => {
                         const {
                              ubicacion,
                              id,
                              name,
                              type,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/internetQubo.svg",
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );

                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                             <div class='nameContainer'> 
                                 <p>${ type }</p> 
                                 <p>${ name }</p>
                             </div>
                             <img src='${ STATIC_IMAGES.internet }'>
                             <p> <span>${ description }</span> </p>
                             <p>Localización: <span>${ addressCountry }, ${ addressRegion }</span> </p>
                             <p>ID: <span>${ id }</span> </p>
                             <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                             <button id="cerrar-info-box">
                                 <img src='./assets/botonCerrar.svg'>
                             </button>
                             <button class='share'>
                                 <img src='./assets/shareIcon.svg'>
                             </button>
                         `;

                                   const cerrarBoton = document.getElementById( "cerrar-info-box" );
                                   cerrarBoton.addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersInternet.push( marker );
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     const eventInternet = document.getElementById( "internet-sub-nav-item" );

     eventInternet.addEventListener( "click", () => {
          // Manejar los marcadores existentes
          toggleMarcadores( markersInternet, internetVisible );

          if ( !internetVisible ) {
               // Cargar marcadores si no existen
               if ( markersInternet.length === 0 ) {
                    cargarMarcadoresInternet();
               }

               // Crear o mostrar la capa KML
               if ( !kmlLayerFiberOptic ) {
                    kmlLayerFiberOptic = new google.maps.KmlLayer( {
                         url: fiberOpticUrl,
                         map: map,
                         preserveViewport: false,
                         // clickable: false 
                    } );

                    kmlLayerFiberOptic.addListener( 'metadata_changed', function () {
                         console.log( "Metadata changed" );
                         map.setZoom( 6 ); // Forzamos un zoom específico
                    } );
               } else {
                    kmlLayerFiberOptic.setMap( map );
                    map.setZoom( 6 ); // Mismo zoom cuando se vuelve a mostrar
               }
          } else {
               // Ocultar la capa KML
               if ( kmlLayerFiberOptic ) {
                    kmlLayerFiberOptic.setMap( null );
               }
          }

          internetVisible = !internetVisible;
     } );



     //* ---------------------------------------------------------------------------------
     //* LÍNEAS METRO MADRID 
     const lineasMetro = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Metro/LineasMetroMadrid.kml?sp=r&st=2024-03-19T15:26:34Z&se=2089-12-31T23:26:34Z&sv=2022-11-02&sr=b&sig=CcYoyHdYb1OfP5eekY%2BhxXthUbQhoDFTeGspK2W52Lg%3D";

     let kmlLayerMetro = null;
     function toggleKmlLayerMetro() {
          if ( kmlLayerMetro ) {
               // Si la capa KML ya existe, alternar su visibilidad
               kmlLayerMetro.setMap( kmlLayerMetro.getMap() ? null : map );
          } else {
               // Si la capa KML no existe, crearla y añadirla al mapa
               kmlLayerMetro = new google.maps.KmlLayer( {
                    url: lineasMetro,
                    map: map // Asegúrate de que 'map' es una referencia válida a tu instancia de Google Maps
               } );
          }
     };
     const botonMetro = document.getElementById( 'metro-sub-nav-item' );
     botonMetro.addEventListener( 'click', toggleKmlLayerMetro );

     //* ---------------------------------------------------------------------------------

     //* CARRILES BICI
     // URLs de los KML
     const carrilesBiciKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/140627_ciclocarriles.kml?sp=r&st=2024-03-19T15:28:39Z&se=2089-12-31T23:28:39Z&sv=2022-11-02&sr=b&sig=5pmqVU2ihGiBmoOpp4flwQ9uYn6wx9ktnGWQICSQFmo%3D";
     const basesBiciMadKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bases_de_BiciMad.kmz?sp=r&st=2024-03-19T20:24:26Z&se=2090-01-01T04:24:26Z&sv=2022-11-02&sr=b&sig=xI3PqT5cwc75iysCXnjus42YQTZMMokLtZgTLWEEOmE%3D";
     const biciparkKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicipark.kmz?sp=r&st=2024-04-06T21:26:44Z&se=2090-01-01T06:26:44Z&sv=2022-11-02&sr=b&sig=edWyV5%2FwJnAqWLtWlPSZXqXVgNX5CQtyqFGMQESy0qk%3D";


     const proxyUrl = '/api/proxy?url=';
     const biciparkApiUrl = `${ proxyUrl }${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Fiware_Mobility_Biciparks-00001?sp=r&st=2024-07-26T14:43:20Z&se=2089-12-31T23:43:20Z&sv=2022-11-02&sr=b&sig=jppSvtms%2BZDJyZ3MRW3zXoaNCMm4TtMUZK3HtdTeOTc%3D"
     ) }`;



     const aparcaBicisUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/APARCABICIS_2022.kml?sp=r&st=2024-03-19T20:51:56Z&se=2090-01-01T04:51:56Z&sv=2022-11-02&sr=b&sig=IUIlZ4eNBPH2cwjICkfnd1zL5yVH%2BSLiRtw%2FfEsl62E%3D";
     const callesTranquilasUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bici%20Calles%20Tranquilas.kml?sp=r&st=2024-03-19T21:21:47Z&se=2090-01-01T05:21:47Z&sv=2022-11-02&sr=b&sig=cLIk%2F4tbVhdZ1Cz%2FMl4ekhBGZxo4UFRgRVnyZ%2FeOuDE%3D";

     // Variables para mantener las capas KML
     let kmlLayerCarrilesBici = null;
     let kmlLayerBasesBiciMad = null;
     let kmlLayerBicipark = null;
     let kmlLayerAparcaBicis = null;
     let kmlLayerCallesTranquilas = null;


     // Función para cargar y mostrar los marcadores de Biciparks
     const cargarMarcadoresBiciparks = () => {
          fetch( biciparkApiUrl )
               .then( response => response.json() )
               .then( data => {
                    data.offstreetparking0001.forEach( item => {
                         const {
                              id,
                              ubicacion,
                              name,
                              category,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/bicycleSharingQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const existingPinnedBox = document.querySelector( `.info-box.pinned[data-bicipark-id="${ id }"]` );
                                   if ( existingPinnedBox ) {
                                        existingPinnedBox.classList.add( 'highlight' );
                                        setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                        return;
                                   }

                                   let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                                   if ( !currentInfoBox ) {
                                        currentInfoBox = document.createElement( 'div' );
                                        currentInfoBox.className = 'info-box';
                                        document.body.appendChild( currentInfoBox );
                                   }

                                   currentInfoBox.setAttribute( 'data-bicipark-id', id );
                                   currentInfoBox.style.display = "flex";
                                   currentInfoBox.innerHTML = `
                                       <div class="info-header">
                                           <img src="${ STATIC_IMAGES.bicyleSharing }" alt="Bicipark" class="property-image"/>
                                           <div class="header-bar">
                                               <div class="property-badges">
                                                   <div class="badge-container">
                                                       <span class="badge primary">BICIPARK</span>
                                                       <div class="badge-location nameContainer">
                                                           <span>${ name }</span>
                                                           <span>${ addressLocality }, ${ addressCountry }</span>
                                                       </div>
                                                   </div>
                                               </div>
                                               <div class="action-buttons">
                                                   <button class="action-btn pin-btn" title="Fijar ventana">
                                                       <i class="action-icon">📌</i>
                                                   </button>
                                                   <button class="action-btn share-btn" title="Compartir">
                                                       <i class="action-icon">📤</i>
                                                   </button>
                                                   <button class="action-btn close-btn" title="Cerrar">
                                                       <i class="action-icon">✕</i>
                                                   </button>
                                               </div>
                                           </div>
                                       </div>
                               
                                       <div class="info-content">
                                           <div class="info-section">
                                               <div class="info-grid">
                                                   <div class="info-row">
                                                       <div class="info-item id-container">
                                                           <label>Código identificador</label>
                                                           <div class="id-value-container">
                                                               <div class="id-wrapper">
                                                                   <span title="${ id }">${ id.length > 20 ? id.substring( 0, 20 ) + '...' : id }</span>
                                                                   <button class="copy-btn" title="Copiar código completo">
                                                                       <i class="copy-icon">📋</i>
                                                                   </button>
                                                               </div>
                                                           </div>
                                                       </div>
                                                   </div>
                               
                                                   <div class="status-cards">
                                                       <div class="status-card">
                                                           <div class="status-icon">📍</div>
                                                           <div class="status-details">
                                                               <label>Dirección</label>
                                                               <span>${ streetAddress }${ postalCode ? `, ${ postalCode }` : '' }</span>
                                                           </div>
                                                       </div>
                                                       <div class="status-card">
                                                           <div class="status-icon">🏢</div>
                                                           <div class="status-details">
                                                               <label>Localización</label>
                                                               <span>${ addressLocality }, ${ addressRegion }</span>
                                                           </div>
                                                       </div>
                                                   </div>
                               
                                                   <div class="info-row">
                                                       <div class="info-item">
                                                           <label>Propietario</label>
                                                           <div class="owner-badge">
                                                               <span class="company-badge">${ owner }</span>
                                                               <span class="country-tag">${ addressCountry }</span>
                                                           </div>
                                                       </div>
                                                   </div>
                                               </div>
                                           </div>
                                       </div>
                                   `;

                                   // Event listeners
                                   const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                                   pinBtn.addEventListener( "click", ( e ) => {
                                        const infoBox = e.target.closest( '.info-box' );
                                        if ( infoBox.classList.contains( 'pinned' ) ) {
                                             infoBox.classList.remove( 'pinned' );
                                             pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                             pinBtn.title = "Fijar ventana";
                                        } else {
                                             infoBox.classList.add( 'pinned' );
                                             pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                             pinBtn.title = "Desfijar ventana";
                                        }
                                   } );

                                   currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                        currentInfoBox.remove();
                                   } );

                                   currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                        try {
                                             if ( navigator.share ) {
                                                  await navigator.share( {
                                                       title: `Bicipark - ${ name }`,
                                                       text: description || '',
                                                       url: window.location.href
                                                  } );
                                             } else {
                                                  await navigator.clipboard.writeText( window.location.href );
                                                  showNotification( '¡Enlace copiado!' );
                                             }
                                        } catch ( error ) {
                                             console.error( 'Error al compartir:', error );
                                        }
                                   } );

                                   currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                        try {
                                             await navigator.clipboard.writeText( id );
                                             showNotification( '¡Código copiado!' );
                                        } catch ( error ) {
                                             console.error( 'Error al copiar:', error );
                                        }
                                   } );
                              } );
                              markersBiciparks.push( marker ); // Añade el marcador al array de marcadores de Biciparks
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     function toggleKmlLayerBici() {
          // Manejar la capa KML de los carriles de bicicleta
          if ( !kmlLayerCarrilesBici ) {
               kmlLayerCarrilesBici = new google.maps.KmlLayer( {
                    url: carrilesBiciKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa de carriles bici cargada." );
          } else {
               kmlLayerCarrilesBici.setMap( kmlLayerCarrilesBici.getMap() ? null : map );
               console.log( "Capa de carriles bici alternada." );
          }

          // Manejar la capa KML de las bases de BiciMad
          if ( !kmlLayerBasesBiciMad ) {
               kmlLayerBasesBiciMad = new google.maps.KmlLayer( {
                    url: basesBiciMadKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa de bases BiciMad cargada." );
          } else {
               kmlLayerBasesBiciMad.setMap( kmlLayerBasesBiciMad.getMap() ? null : map );
               console.log( "Capa de bases BiciMad alternada." );
          }

          // Manejar la capa KML de Bicipark
          if ( !kmlLayerBicipark ) {
               kmlLayerBicipark = new google.maps.KmlLayer( {
                    url: biciparkKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa de Bicipark cargada." );
          } else {
               kmlLayerBicipark.setMap( kmlLayerBicipark.getMap() ? null : map );
               console.log( "Capa de Bicipark alternada." );
          }

          // Manejar la capa KML de AparcaBicis
          if ( !kmlLayerAparcaBicis ) {
               kmlLayerAparcaBicis = new google.maps.KmlLayer( {
                    url: aparcaBicisUrl,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa de AparcaBicis cargada." );
          } else {
               kmlLayerAparcaBicis.setMap( kmlLayerAparcaBicis.getMap() ? null : map );
               console.log( "Capa de AparcaBicis alternada." );
          }

          // Manejar la capa KML de Calles Tranquilas
          if ( !kmlLayerCallesTranquilas ) {
               kmlLayerCallesTranquilas = new google.maps.KmlLayer( {
                    url: callesTranquilasUrl,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa de Calles Tranquilas cargada." );
          } else {
               kmlLayerCallesTranquilas.setMap( kmlLayerCallesTranquilas.getMap() ? null : map );
               console.log( "Capa de Calles Tranquilas alternada." );
          }

          // Alternar la visibilidad de los marcadores de Biciparks
          toggleMarcadores( markersBiciparks, biciparksVisible );
          biciparksVisible = !biciparksVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersBiciparks.length === 0 && biciparksVisible ) {
               cargarMarcadoresBiciparks();
               console.log( "Marcadores de Biciparks cargados." );
          }

          // Llamar a la función para inicializar las bicicletas en el mapa
          iniciarBicicletasEnMapa();
     }

     // Función para Marcadores de BICICLETAS
     const marcadoresBicicletas = {};

     function iniciarBicicletaEnMapa( bicicletaId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresBicicletas[ bicicletaId ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresBicicletas[ bicicletaId ].intervaloId );
               marcadoresBicicletas[ bicicletaId ].marker.setMap( null );
               delete marcadoresBicicletas[ bicicletaId ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para la bicicleta
          const bicicletaMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas de la bicicleta de la API y mover el marcador
          function obtenerYmoverBicicleta() {
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.ImagenURL ) {
                              const img = new Image();
                              img.src = data.ImagenURL;
                         }
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.Coordenadas && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas.map( coord => ( {
                                   lat: parseFloat( coord.lat ),
                                   lng: parseFloat( coord.lng )
                              } ) );

                              // Mover el marcador de la bicicleta con las coordenadas obtenidas
                              const intervaloId = iniciarMovimientoMarcador( bicicletaMarker, coordenadas, 2000 );
                              marcadoresBicicletas[ bicicletaId ] = {
                                   marker: bicicletaMarker,
                                   intervaloId: intervaloId,
                                   datosBicicleta: data // Almacenar los datos de la bicicleta aquí
                              };
                         } else {
                              console.error( 'Los datos de la bicicleta no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas de la bicicleta:', error ) );
          }

          // Iniciar el proceso de mover la bicicleta
          obtenerYmoverBicicleta();

          // Añadir un evento click al marcador de la bicicleta para mostrar información
          bicicletaMarker.addListener( "click", function () {
               const datosBicicleta = marcadoresBicicletas[ bicicletaId ].datosBicicleta;

               const existingPinnedBox = document.querySelector( `.info-box.pinned[data-bici-id="${ bicicletaId }"]` );
               if ( existingPinnedBox ) {
                    existingPinnedBox.classList.add( 'highlight' );
                    setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                    return;
               }

               let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
               if ( !currentInfoBox ) {
                    currentInfoBox = document.createElement( 'div' );
                    currentInfoBox.className = 'info-box';
                    document.body.appendChild( currentInfoBox );
               }

               currentInfoBox.setAttribute( 'data-bici-id', bicicletaId );
               currentInfoBox.style.display = "flex";
               currentInfoBox.innerHTML = `
                   <div class="info-header">
                       <img src="${ datosBicicleta.ImagenURL || '/assets/photo-1593341476900-a1cfedc5c489.avif' }" alt="Bicicleta" class="property-image"/>
                       <div class="header-bar">
                           <div class="property-badges">
                               <div class="badge-container">
                                   <span class="badge primary">BICI</span>
                                   <div class="badge-location nameContainer">
                                       <span>${ datosBicicleta.Usuario }</span>
                                       <span>Madrid, España</span>
                                   </div>
                               </div>
                           </div>
                           <div class="action-buttons">
                               <button class="action-btn pin-btn" title="Fijar ventana">
                                   <i class="action-icon">📌</i>
                               </button>
                               <button class="action-btn share-btn" title="Compartir">
                                   <i class="action-icon">📤</i>
                               </button>
                               <button class="action-btn close-btn" title="Cerrar">
                                   <i class="action-icon">✕</i>
                               </button>
                           </div>
                       </div>
                   </div>
           
                   <div class="info-content">
                       <div class="info-section">
                           <div class="info-grid">
                               <div class="info-row">
                                   <div class="info-item">
                                       <label>Usuario</label>
                                       <span>${ datosBicicleta.Usuario }</span>
                                   </div>
                                   <div class="info-item">
                                       <label>Matrícula</label>
                                       <span class="plate-number">${ datosBicicleta.Matricula }</span>
                                   </div>
                               </div>
                               <div class="info-row">
                                   <div class="info-item">
                                       <label>Batería</label>
                                       <span class="battery-badge">${ datosBicicleta.Bateria }</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               `;

               // Event listeners
               const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
               pinBtn.addEventListener( "click", ( e ) => {
                    const infoBox = e.target.closest( '.info-box' );
                    if ( infoBox.classList.contains( 'pinned' ) ) {
                         infoBox.classList.remove( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                         pinBtn.title = "Fijar ventana";
                    } else {
                         infoBox.classList.add( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                         pinBtn.title = "Desfijar ventana";
                    }
               } );

               currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                    currentInfoBox.remove();
               } );

               currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                    try {
                         if ( navigator.share ) {
                              await navigator.share( {
                                   title: `Bicicleta - ${ datosBicicleta.Usuario }`,
                                   text: `Bicicleta de ${ datosBicicleta.Usuario }`,
                                   url: window.location.href
                              } );
                         } else {
                              await navigator.clipboard.writeText( window.location.href );
                              showNotification( '¡Enlace copiado!' );
                         }
                    } catch ( error ) {
                         console.error( 'Error al compartir:', error );
                    }
               } );
          } );
     }

     // Función para inicializar todas las bicicletas en el mapa
     function iniciarBicicletasEnMapa() {
          iniciarBicicletaEnMapa( 1, './assets/quboBicycle.svg', 'Bicicleta 1', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_1.json?sp=r&st=2024-05-15T13:43:41Z&se=2090-01-01T22:43:41Z&sv=2022-11-02&sr=b&sig=uCYJlfIenWkJoed2ZAlLka35WfKvGIHAzGuNzpD5ewU%3D' ) }` );
          iniciarBicicletaEnMapa( 2, './assets/quboBicycle.svg', 'Bicicleta 2', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_2.json?sp=r&st=2024-05-15T13:44:04Z&se=2090-01-01T22:44:04Z&sv=2022-11-02&sr=b&sig=Cnl0VUf2BcrnJeNfs2NZln3QEP5yF0GAoyCJB1ebYvg%3D' ) }` );
          iniciarBicicletaEnMapa( 3, './assets/quboBicycle.svg', 'Bicicleta 3', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_3.json?sp=r&st=2024-05-15T13:44:21Z&se=2090-01-01T22:44:21Z&sv=2022-11-02&sr=b&sig=XjkEhV2m%2FKXLYQvLXAWqgTThHSnGBsbDyA2ZL1nRxPY%3D' ) }` );
          iniciarBicicletaEnMapa( 4, './assets/quboBicycle.svg', 'Bicicleta 4', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_4.json?sp=r&st=2024-05-15T13:44:38Z&se=2090-01-01T22:44:38Z&sv=2022-11-02&sr=b&sig=I7LlqWTVnSWymaWfM0q8B1J0%2FyJIOlmCIebeUTV3Qn8%3D' ) }` );
          iniciarBicicletaEnMapa( 5, './assets/quboBicycle.svg', 'Bicicleta 5', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_5.json?sp=r&st=2024-05-15T13:44:57Z&se=2090-01-01T22:44:57Z&sv=2022-11-02&sr=b&sig=z6BCIN7VRcaT42aoREQ5DEglxEJwXLRbdWVsgk%2BhD1k%3D' ) }` );
          iniciarBicicletaEnMapa( 6, './assets/quboBicycle.svg', 'Bicicleta 6', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_6.json?sp=r&st=2024-05-15T13:45:18Z&se=2090-01-01T22:45:18Z&sv=2022-11-02&sr=b&sig=zipqET%2Fe1OkscoVr%2F3O%2F8CoCLTY1OYWn1zt8H8CtSSM%3D' ) }` );
          iniciarBicicletaEnMapa( 7, './assets/quboBicycle.svg', 'Bicicleta 7', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_7.json?sp=r&st=2024-05-15T13:45:35Z&se=2090-01-01T22:45:35Z&sv=2022-11-02&sr=b&sig=PkRdidbJ1Lg2PTrdh4r%2Fy5gZxzfwfwybT06zpMNrbAw%3D' ) }` );
          iniciarBicicletaEnMapa( 8, './assets/quboBicycle.svg', 'Bicicleta 8', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_8.json?sp=r&st=2024-05-15T13:45:52Z&se=2090-01-01T22:45:52Z&sv=2022-11-02&sr=b&sig=v922HIbEQmeDtXFJDLH3%2BzE7obxQA%2FVzAT%2Bx435P7Bw%3D' ) }` );
          iniciarBicicletaEnMapa( 9, './assets/quboBicycle.svg', 'Bicicleta 9', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_9.json?sp=r&st=2024-05-15T13:46:10Z&se=2090-01-01T22:46:10Z&sv=2022-11-02&sr=b&sig=gNvOkIpgmsRMzNr3%2BqM6v4OsUK0ZQLHBhX6RtdLDkgM%3D' ) }` );
          iniciarBicicletaEnMapa( 10, './assets/quboBicycle.svg', 'Bicicleta 10', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_10.json?sp=r&st=2024-05-15T13:46:25Z&se=2090-01-01T22:46:25Z&sv=2022-11-02&sr=b&sig=G2amlyAxBPM6qWof6vw1hgvq0otGVKMYuHgQL4Bxtz8%3D' ) }` );
          iniciarBicicletaEnMapa( 11, './assets/quboBicycle.svg', 'Bicicleta 11', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_11.json?sp=r&st=2024-05-15T13:46:42Z&se=2090-01-01T22:46:42Z&sv=2022-11-02&sr=b&sig=%2B1EX%2FDEOJ31SGOjyZR0fwVL9bKaIRkeT5VF%2FXomiHYY%3D' ) }` );
          iniciarBicicletaEnMapa( 12, './assets/quboBicycle.svg', 'Bicicleta 12', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_12.json?sp=r&st=2024-05-15T13:46:59Z&se=2090-01-01T22:46:59Z&sv=2022-11-02&sr=b&sig=6%2FcBBrzh%2BxoQG4TROXcGKIn1VOTOOp2rler4TsKH3lY%3D' ) }` );
          iniciarBicicletaEnMapa( 13, './assets/quboBicycle.svg', 'Bicicleta 13', `${ proxyUrl }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_13.json?sp=r&st=2024-05-15T13:47:16Z&se=2090-01-01T22:47:16Z&sv=2022-11-02&sr=b&sig=0%2FG2NN1L9r2SRpurvC8SZ3OTNXbj78xjmKyYGn5Q7mA%3D' ) }` );
     }

     // Asociar el evento click del botón al manejo del KML de los carriles de bicicleta, las bases de BiciMad y las bicicletas
     const botonBicycle = document.getElementById( 'bici-sub-nav-item' );
     let markersBiciparks = []; // Array para almacenar los marcadores de Biciparks
     let biciparksVisible = false; // Bandera para el estado de visibilidad
     botonBicycle.addEventListener( 'click', toggleKmlLayerBici );



     //* ---------------------------------------------------------------------------------
     //* BOTÓN INCIDENCES MOBILITY (OPERACIÓN ASFALTO) (INCIDENCIAS VÍA PÚBLICA)

     // URL de la capa KML de Operación Asfalto
     const kmlAlertsMobilityUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Incidences/Mobility%20Incidences/Operacion_asfalto_2021_kml.kmz?sp=r&st=2024-03-19T21:27:54Z&se=2090-01-01T05:27:54Z&sv=2022-11-02&sr=b&sig=%2FN8Ez5X9F5hzPDYb2P7iZJX%2FiSXkynMgdm8LitO4qgg%3D";

     // URL de la nueva capa KML de Incidencias Vía Pública
     const kmlIncidenciasViaPublicaUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Incidences/Mobility%20Incidences/Incidencias%20Via%20Publica.kml?sp=r&st=2024-03-19T21:30:08Z&se=2090-01-01T05:30:08Z&sv=2022-11-02&sr=b&sig=KpdNugI91fHozgP79RHLCDrrygV5Ge22KOgoGSD79Cg%3D";

     // URL de la API de alertas de movilidad
     const urlAlertsMobility = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Incidences/Mobility%20Incidences/Fiware_Incidences_Mobility?sp=r&st=2024-07-26T13:05:48Z&se=2090-01-01T22:05:48Z&sv=2022-11-02&sr=b&sig=1XeWef46jcbbCgOKIPGENLNDuTAOqDjfq%2Fr3p59BT5A%3D"
     ) }`;

     // Botón de alertas de movilidad
     const botonAlertsMobility = document.getElementById( 'alerts-mobility-nav-item' );

     let kmlLayerAlertsMobility = null; // Variable para la capa KML de Operación Asfalto
     let kmlLayerIncidenciasViaPublica = null; // Variable para la nueva capa KML de Incidencias Vía Pública
     let markersAlertsMobility = []; // Array para almacenar los marcadores de alertas
     let alertsMobilityVisible = false; // Bandera para el estado de visibilidad

     // Función para cargar la capa KML
     function cargarCapaKML( url, kmlLayer ) {
          if ( kmlLayer ) {
               kmlLayer.setMap( kmlLayer.getMap() ? null : map );
          } else {
               kmlLayer = new google.maps.KmlLayer( {
                    url: url,
                    map: map,
                    preserveViewport: true
               } );
          }
          return kmlLayer; // Devolver la capa para que se asigne a la variable adecuada
     }

     // Función para cargar y mostrar marcadores de alertas de movilidad
     function cargarMarcadoresAlertsMobility() {
          fetch( urlAlertsMobility )
               .then( response => response.json() )
               .then( data => {
                    data.alerts0002.forEach( item => {
                         const {
                              id,
                              ubicacion,
                              name,
                              category,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/incidencesMobilityQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                            <div class='nameContainer'>
                                <p>${ category }</p>
                                <p>${ name }</p>
                            </div>
                            <p>Address: <span>${ streetAddress }</span> </p>
                            <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                            <p>${ addressCountry }</p>
                            <p>${ description }</p>
                            <p>ID: <span>${ id }</span> </p>
                            <p>Source: <a href="${ source }" target="_blank">${ source }</a></p>
                            <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                            <button class='share'><img src='./assets/shareIcon.svg'></button>
                        `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersAlertsMobility.push( marker ); // Añade el marcador al array de alertas
                         }
                    } );
               } )
               .catch( error => console.error( "Error al cargar los marcadores de alertas de movilidad:", error ) );
     }

     // Evento para el botón de alertas de movilidad
     botonAlertsMobility.addEventListener( "click", () => {
          // Alternar la visibilidad de la capa KML de Operación Asfalto
          kmlLayerAlertsMobility = cargarCapaKML( kmlAlertsMobilityUrl, kmlLayerAlertsMobility );

          // Alternar la visibilidad de la nueva capa KML de Incidencias Vía Pública
          kmlLayerIncidenciasViaPublica = cargarCapaKML( kmlIncidenciasViaPublicaUrl, kmlLayerIncidenciasViaPublica );

          // Alternar la visibilidad de los marcadores de alertas de movilidad
          toggleMarcadores( markersAlertsMobility, alertsMobilityVisible );
          alertsMobilityVisible = !alertsMobilityVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado, cargarlos
          if ( markersAlertsMobility.length === 0 && alertsMobilityVisible ) {
               cargarMarcadoresAlertsMobility(); // Llama a la función para cargar los marcadores de alertas de movilidad
          }
     } );

     //* BOTÓN INCIDENCES SECURITY (CRIME ZONES) 





     //* ---------------------------------------------------------------------------------
     //* CÁMARAS DE TRÁFICO MADRID


     const bajasEmisiones = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Car%20Traffic/camaras_zonabajasemisiones_mc.kmz?sp=r&st=2024-03-19T20:34:37Z&se=2090-01-01T04:34:37Z&sv=2022-11-02&sr=b&sig=gn9rV3AAOe4XD4okscc0T82THsCzH4Um71649lsB8Y4%3D";
     const radaresFijos = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Car%20Traffic/RADARES_FIJOS_vDTT.kml?sp=r&st=2024-03-19T20:49:53Z&se=2090-01-01T04:49:53Z&sv=2022-11-02&sr=b&sig=a3gFUKDbBUkzjb4dXmgYkgYhAe%2F%2FJQIh1uuOL77t1qY%3D";


     let kmlLayerbajasEmisiones = null;
     let kmlLayerRadaresFijos = null;


     // Función para manejar las capas KML de cámaras de tráfico
     function toggleKmlLayers() {
          // Alternar visibilidad de la capa de bajas emisiones
          if ( kmlLayerbajasEmisiones ) {
               kmlLayerbajasEmisiones.setMap( kmlLayerbajasEmisiones.getMap() ? null : map );
          } else {
               kmlLayerbajasEmisiones = new google.maps.KmlLayer( {
                    url: bajasEmisiones,
                    map: map,
                    preserveViewport: true,
                    suppressInfoWindows: true // Evita ventanas emergentes automáticas
               } );
          }

          // Alternar visibilidad de la capa de CCTV
          if ( kmlLayerRadaresFijos ) {
               kmlLayerRadaresFijos.setMap( kmlLayerRadaresFijos.getMap() ? null : map );
          } else {
               kmlLayerRadaresFijos = new google.maps.KmlLayer( {
                    url: radaresFijos,
                    map: map,
                    preserveViewport: true,
                    suppressInfoWindows: true // Evita ventanas emergentes automáticas
               } );
          }

          // Listeners para verificar el estado de las capas
          kmlLayerbajasEmisiones.addListener( 'status_changed', function () {
               console.log( 'KML Layer bajasEmisiones status changed to: ' + kmlLayerbajasEmisiones.getStatus() );
          } );
          kmlLayerRadaresFijos.addListener( 'status_changed', function () {
               console.log( 'KML Layer Radares Fijos status changed to: ' + kmlLayerRadaresFijos.getStatus() );
          } );
     }

     const botonbajasEmisiones = document.getElementById( 'traffic-sub-nav-item' );

     // Vincular el controlador de eventos al botón para manejar ambas capas
     botonbajasEmisiones.addEventListener( 'click', toggleKmlLayers );





     //* ---------------------------------------------------------------------------------
     //* LUMINARIAS ELECTRICITY

     //* LUMINARIAS
     const luminariasKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Electricity/Luminarias.kmz?sp=r&st=2024-03-19T20:15:15Z&se=2090-01-01T04:15:15Z&sv=2022-11-02&sr=b&sig=Q9ZUeQ5W15wOqtUO9TE1vcxqB49H%2FVPZcAG3LRj8%2Fb8%3D";

     let kmlLayerLuminarias = null; // Variable para mantener la capa KML de las luminarias

     function toggleKmlLayerLuminarias() {
          if ( kmlLayerLuminarias ) {
               // Si la capa KML ya existe, alternar su visibilidad
               kmlLayerLuminarias.setMap( kmlLayerLuminarias.getMap() ? null : map );
          } else {
               // Si la capa KML no existe, crearla y añadirla al mapa
               kmlLayerLuminarias = new google.maps.KmlLayer( {
                    url: luminariasKmzUrl,
                    map: map // Asegúrate de que 'map' es una referencia válida a tu instancia de Google Maps
               } );
          }
     }

     // Asociar el evento click del botón al manejo del KML de las luminarias
     const botonLuminarias = document.getElementById( 'electricity-sub-nav-item' );
     botonLuminarias.addEventListener( 'click', toggleKmlLayerLuminarias );

     //* ---------------------------------------------------------------------------------
     //* CERCARNÍAS

     // const cercaniasMadridKMZ = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Trains/Cercanias_de_Madrid.kmz?sp=r&st=2024-03-19T15:31:15Z&se=2089-12-31T23:31:15Z&sv=2022-11-02&sr=b&sig=W0iAEncbPWs4ZEbtrxBW%2BP6oRF9aeVDY%2Bxu%2BuDMu1fQ%3D";
     // let kmzLayerCercaniasMadrid = null;

     // function toggleKMZLayerCercaniasMadrid() {
     //      if ( kmzLayerCercaniasMadrid ) {
     //           // Si la capa KMZ ya existe, alternar su visibilidad
     //           kmzLayerCercaniasMadrid.setMap( kmzLayerCercaniasMadrid.getMap() ? null : map );
     //      } else {
     //           // Si la capa KMZ no existe, crearla y añadirla al mapa
     //           kmzLayerCercaniasMadrid = new google.maps.KmlLayer( {
     //                url: cercaniasMadridKMZ,
     //                map: map // Asegúrate de que 'map' sea una referencia válida a tu instancia de Google Maps
     //           } );
     //      }
     // };

     // // Suponiendo que tienes un botón con ID 'kmz-layer-toggle' para alternar la capa KMZ
     // const botonKMZ = document.getElementById( 'trains-sub-nav-item' );
     // botonKMZ.addEventListener( 'click', toggleKMZLayerCercaniasMadrid );

     //* FUNCIÓN PARA TRAINS *//
     // Variables globales para trains
     let kmzLayerCercaniasMadrid = null;
     const marcadoresTrenes = {};

     // Función para el KMZ de Trains
     function toggleKMZLayerCercaniasMadrid() {
          if ( kmzLayerCercaniasMadrid ) {
               kmzLayerCercaniasMadrid.setMap( kmzLayerCercaniasMadrid.getMap() ? null : map );
          } else {
               kmzLayerCercaniasMadrid = new google.maps.KmlLayer( {
                    url: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Trains/Cercanias_de_Madrid.kmz?sp=r&st=2024-03-19T15:31:15Z&se=2089-12-31T23:31:15Z&sv=2022-11-02&sr=b&sig=W0iAEncbPWs4ZEbtrxBW%2BP6oRF9aeVDY%2Bxu%2BuDMu1fQ%3D",
                    map: map
               } );
          }
     }

     // Función para mover el marcador del tren
     function iniciarMovimientoMarcadorTrain( marker, coordinates, interval, updateInfoBox ) {
          let index = 0;
          const totalCoords = coordinates.length;

          const intervalId = setInterval( () => {
               marker.setPosition( new google.maps.LatLng( coordinates[ index ][ 1 ], coordinates[ index ][ 0 ] ) );
               if ( updateInfoBox ) {
                    updateInfoBox( index );
               }

               index++;
               if ( index >= totalCoords ) {
                    index = 0; // Volver al inicio para ciclar
               }
          }, interval );

          return intervalId;
     }
     function iniciarTrainsEnMapa( trainId, iconUrl, title, apiUrl ) {
          if ( marcadoresTrenes[ trainId ] ) {
               clearInterval( marcadoresTrenes[ trainId ].intervaloId );
               marcadoresTrenes[ trainId ].marker.setMap( null );
               delete marcadoresTrenes[ trainId ];
               return;
          }

          const trainMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: {
                    url: iconUrl
               }
          } );

          function obtenerYmoverTrain() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.location.value.coordinates && Array.isArray( data.location.value.coordinates ) ) {
                              const coordenadas = data.location.value.coordinates;

                              // Función para actualizar todas las info boxes
                              function actualizarInfoBox( index ) {
                                   // Actualizar la caja no pinneada
                                   const unpinnedBox = document.querySelector( ".info-box:not(.pinned)" );
                                   if ( unpinnedBox && unpinnedBox.style.display !== "none" ) {
                                        const speedElement = unpinnedBox.querySelector( "#speedValue" );
                                        if ( speedElement ) {
                                             speedElement.textContent = `${ data.speed.value[ index ] } km/h`;
                                        }
                                   }

                                   // Actualizar todas las cajas pinneadas
                                   const pinnedBoxes = document.querySelectorAll( `.info-box.pinned[data-train-id="${ data.id }"]` );
                                   pinnedBoxes.forEach( box => {
                                        const speedElement = box.querySelector( "#speedValue" );
                                        if ( speedElement ) {
                                             speedElement.textContent = `${ data.speed.value[ index ] } km/h`;
                                        }
                                   } );
                              }

                              trainMarker.addListener( "click", () => {
                                   const existingPinnedBox = document.querySelector( `.info-box.pinned[data-train-id="${ data.id }"]` );
                                   if ( existingPinnedBox ) {
                                        existingPinnedBox.classList.add( 'highlight' );
                                        setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                        return;
                                   }

                                   let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                                   if ( !currentInfoBox ) {
                                        currentInfoBox = document.createElement( 'div' );
                                        currentInfoBox.className = 'info-box';
                                        document.body.appendChild( currentInfoBox );
                                   }

                                   currentInfoBox.innerHTML = `
                             <div class="info-header">
                                 <img src="${ data.ImagenURL.value }" alt="Tren" class="property-image"/>
                                 <div class="header-bar">
                                     <div class="property-badges">
                                         <div class="badge-container">
                                             <span class="badge primary">TREN</span>
                                             <div class="badge-location nameContainer">
                                                 <span>${ data.name.value }</span>
                                                 <span>Madrid, España</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div class="action-buttons">
                                         <button class="action-btn pin-btn" title="Fijar ventana">
                                             <i class="action-icon">📌</i>
                                         </button>
                                         <button class="action-btn share-btn" title="Compartir">
                                             <i class="action-icon">📤</i>
                                         </button>
                                         <button class="action-btn close-btn" title="Cerrar">
                                             <i class="action-icon">✕</i>
                                         </button>
                                     </div>
                                 </div>
                             </div>
                             <div class="info-content">
                                 <div class="info-section">
                                     <div class="info-grid">
                                         <div class="info-row">
                                             <div class="info-item id-container">
                                                 <label>ID</label>
                                                 <div class="id-value-container">
                                                     <div class="id-wrapper">
                                                         <span title="${ data.id }">${ data.id }</span>
                                                         <button class="copy-btn" title="Copiar ID">
                                                             <i class="copy-icon">📋</i>
                                                         </button>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                         <div class="info-row">
                                             <div class="info-item">
                                                 <label>Tipo</label>
                                                 <span class="type-badge">Train</span>
                                             </div>
                                             <div class="info-item">
                                                 <label>Estado</label>
                                                 <span class="status-badge activo">${ data.status.value }</span>
                                             </div>
                                         </div>
                                         <div class="info-row">
                                             <div class="info-item">
                                                 <label>Velocidad</label>
                                                 <span class="speed-badge" id="speedValue">${ data.speed.value[ 0 ] } km/h</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         `;

                                   currentInfoBox.setAttribute( 'data-train-id', data.id );

                                   // Event listeners
                                   currentInfoBox.querySelector( ".pin-btn" ).addEventListener( "click", () => {
                                        const newPinnedBox = currentInfoBox.cloneNode( true );
                                        newPinnedBox.classList.add( 'pinned' );
                                        document.body.appendChild( newPinnedBox );

                                        // Configurar event listeners para la versión pinned
                                        newPinnedBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                             newPinnedBox.remove();
                                        } );

                                        newPinnedBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                             try {
                                                  await navigator.clipboard.writeText( data.id );
                                                  showNotification( '¡ID copiado!' );
                                             } catch ( error ) {
                                                  console.error( 'Error al copiar:', error );
                                             }
                                        } );

                                        newPinnedBox.querySelector( ".pin-btn" ).style.display = 'none';
                                        inicializarArrastre( newPinnedBox );
                                        currentInfoBox.style.display = "none";
                                   } );

                                   currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                        currentInfoBox.style.display = "none";
                                   } );

                                   currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                        try {
                                             await navigator.clipboard.writeText( data.id );
                                             showNotification( '¡ID copiado!' );
                                        } catch ( error ) {
                                             console.error( 'Error al copiar:', error );
                                        }
                                   } );

                                   inicializarArrastre( currentInfoBox );
                                   currentInfoBox.style.display = "flex";
                              } );

                              const intervaloId = iniciarMovimientoMarcadorTrain( trainMarker, coordenadas, 1000, actualizarInfoBox );
                              marcadoresTrenes[ trainId ] = {
                                   marker: trainMarker,
                                   intervaloId: intervaloId,
                                   datosTren: data
                              };
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del tren:', error ) );
          }

          obtenerYmoverTrain();
     }

     // Evento para trains
     const eventTrains = document.getElementById( "trains-sub-nav-item" );
     eventTrains.addEventListener( "click", function () {
          toggleKMZLayerCercaniasMadrid();
          iniciarTrainsEnMapa( 1, './assets/trains_Qubo.svg', 'Cercanías Madrid', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Trains/Train_CercaniasC2_Fiware_Dynamic.json?sp=r&st=2025-03-10T18:01:55Z&se=2099-03-11T02:01:55Z&sv=2022-11-02&sr=b&sig=r6ZnY9dKMm8L%2FKsLQUMx0G0Hex8jOTjHCkJIfig84Bc%3D' );
     } );

     //* BOTÓN ENVIRONMENT AND SUSTAINABILITY ****************

     //! Función para mostrar PARKS&GARDENS

     const parksGardensApiUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Parks%20%26%20Gardens/Fiware_EnvAndSust_ParksAndGardens-00001?sp=r&st=2024-06-02T17:13:28Z&se=2090-01-01T02:13:28Z&sv=2022-11-02&sr=b&sig=XBdhgow87NphHa30BQWyt%2Bc%2FJsUyjU%2FXEVZuy9L12t8%3D"
     ) }`;

     const cargarMarcadoresParksGardens = () => {
          fetch( parksGardensApiUrl )
               .then( response => {
                    if ( response.ok ) {
                         return response.json();
                    } else {
                         throw new Error( "La solicitud no fue exitosa" );
                    }
               } )
               .then( data => {

                    const markersData = data.parksandg0001;

                    markersData.forEach( item => {
                         const {
                              ubicacion,
                              name,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source,
                              owner
                         } = parseFiwareData( item );

                         if ( ubicacion && name ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/parksGardensQubo.svg",
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );

                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                              <div class='nameContainer'> 
                                   <p>Parque</p> 
                                  <p>${ name }</p>
                              </div>
                             <img src='${ STATIC_IMAGES.parksGardens }'>
                              <p> <span>${ description }</span> </p>
                              
                              <p>Address: <span>${ streetAddress }, ${ postalCode }</span> </p>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>ID: <span>${ item.id }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box">
                                  <img src='./assets/botonCerrar.svg'>
                              </button>
                              <button class='share'>
                                  <img src='./assets/shareIcon.svg'>
                              </button>
                              `;

                                   const cerrarBoton = document.getElementById( "cerrar-info-box" );
                                   cerrarBoton.addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersParksGardens.push( marker ); // Añade el marcador al array de parques y jardines
                         }
                    } );
               } )
               .catch( error => {
                    console.error( "Hubo un problema con la solicitud:", error );
               } );
     };

     const eventParksGardens = document.getElementById( "parksGardens-sub-nav-item" );
     let markersParksGardens = []; // Array para almacenar los marcadores de parques y jardines
     let parksGardensVisible = false; // Bandera para el estado de visibilidad

     eventParksGardens.addEventListener( "click", () => {
          // Alternar la visibilidad de los marcadores de parques y jardines
          toggleMarcadores( markersParksGardens, parksGardensVisible );
          parksGardensVisible = !parksGardensVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersParksGardens.length === 0 && parksGardensVisible ) {
               cargarMarcadoresParksGardens();
          }
     } );

     //! BOTÓN WILDLIFE

     const urlsKmlWildLife = [
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Wild%20Life/2018_Murcielagos.kml?sp=r&st=2024-03-19T15:33:27Z&se=2089-12-31T23:33:27Z&sv=2022-11-02&sr=b&sig=xtkNp%2F8S4yX2623hj51kwFACCWBHZXrvjdvKOKQlXSY%3D",
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Wild%20Life/CAJAS%20NIDO%20AUTILLOS%202018.kml?sp=r&st=2024-03-19T15:33:50Z&se=2089-12-31T23:33:50Z&sv=2022-11-02&sr=b&sig=D7N5zcTerL43cXyYGG2hYIxDl5o9vBLrdR%2BiMFgsgDo%3D",
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Wild%20Life/Cajas%20nido%20Castellana%202018.kml?sp=r&st=2024-03-19T15:34:07Z&se=2089-12-31T23:34:07Z&sv=2022-11-02&sr=b&sig=C6sHElng%2BX9mYxSndzmGne%2Fp00ppzF2afa5bU2F%2Bf8Q%3D",
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Wild%20Life/cajas_nido_manzanares.kml?sp=r&st=2024-03-19T15:34:27Z&se=2089-12-31T23:34:27Z&sv=2022-11-02&sr=b&sig=63CVeL6vWjUOlxj0ummiff9Gv9AEA%2Bj2ZSJ8nJmZw7E%3D"
     ];

     let kmlLayersWildLife = [];
     const botonWildLife = document.getElementById( 'wildLife-sub-nav-item' );

     botonWildLife.addEventListener( 'click', () => {
          urlsKmlWildLife.forEach( ( url, index ) => {
               if ( kmlLayersWildLife[ index ] ) {
                    // Si la capa KML ya existe, alternar su visibilidad
                    kmlLayersWildLife[ index ].setMap( kmlLayersWildLife[ index ].getMap() ? null : map );
               } else {
                    // Si la capa KML no existe, crearla y añadirla al mapa
                    const kmlLayer = new google.maps.KmlLayer( {
                         url: url,
                         map: map,
                         preserveViewport: true
                    } );
                    kmlLayersWildLife[ index ] = kmlLayer;
               }
          } );
     } );

     //! BOTÓN ENVIRONMENT

     // URL para el marcador de Air Quality Stations
     const urlMarkerAirQuality = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Environment/Fiware_EnvAndSust_AirQualityStations-00001?sp=r&st=2024-04-01T12:52:31Z&se=2090-01-01T21:52:31Z&sv=2022-11-02&sr=b&sig=nykV2ypz1eiG3UtGZqKX%2B4M9aFzAayeAmI6Id42pg4w%3D"
     ) }`;

     // URL de la capa KML de residuos peligrosos
     const urlKmlResiduosPeligrosos = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Environment/Residuos_Peligrosos._Comunidad_de_Madrid..kml?sp=r&st=2024-03-19T21:58:39Z&se=2090-01-01T05:58:39Z&sv=2022-11-02&sr=b&sig=YholeRFpXhE%2B1Iwe3I0rILPDtAG0WD6qI2OUbZ6RokU%3D";

     // Variable para mantener la capa KML de residuos peligrosos
     let kmlLayerResiduosPeligrosos = null;
     const cargarYMostrarMarcadoresAirQuality = async ( url ) => {
          try {
               const response = await fetch( url );
               const data = await response.json();

               data.weatherobs0001.forEach( item => {
                    const ubicacion = item.location.value.coordinates;

                    // Extraer solo la primera parte del nombre hasta la primera coma
                    const nombre = item.name.value.split( ',' )[ 0 ];
                    const address = item.address.value.streetAddress.split( ',' )[ 1 ];

                    const airQualityMarker = new google.maps.Marker( {
                         position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                         map: map, // Asegúrate de que 'map' sea una referencia válida a tu instancia de Google Maps
                         title: nombre, // Utilizar el nombre extraído
                         icon: "./assets/environment_Qubo.svg" // Asegúrate de tener un ícono adecuado para las estaciones de calidad del aire
                    } );

                    airQualityMarker.addListener( 'click', () => {
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         const idWithoutPrefix = item.id.replace( /^weatherobs_/, '' );
                         infoBox.innerHTML = `
                     <div class='nameContainer'>
                     <p>${ item.description.value }</p>
                         <p>${ nombre }</p> <!-- Utilizar el nombre extraído -->
                     </div>
                     <img src='${ STATIC_IMAGES.environment }'>
                     <p>Código identificador: <span>${ idWithoutPrefix }</span> </p>
                     <p>Address: <span>${ address }</span> </p>
                     <p>Localización: <span>${ item.address.value.addressLocality }, ${ item.address.value.addressRegion }</span> </p>
                     <p>Fecha de alta: <span>${ item.annex.value.estacion_fecha_alta }</span> </p>
                     <p>Tipo de área: <span>${ item.annex.value.estacion_tipo_area }</span> </p>
                     <p>Tipo de estación: <span>${ item.annex.value.estacion_tipo_estacion }</span> </p>
                     <p>Calidad de aire: <span>${ item.annex.value.zona_calidad_aire_descripcion }</span> </p>
                     <p> <span>${ item.description.value }</span> </p>
                     <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                     <button class='share'><img src='./assets/shareIcon.svg'></button>
                 `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );

                    // Añade el marcador al array de estaciones de calidad del aire
                    markersAirQuality.push( airQualityMarker );
               } );
          } catch ( error ) {
               console.error( "Error fetching air quality stations:", error );
          }
     };



     let markersAirQuality = []; // Array para almacenar los marcadores de estaciones de calidad del aire
     const botonEnvironment = document.getElementById( 'environment-sub-nav-item' );

     // Estado de visibilidad para los marcadores de Air Quality Stations
     let airQualityMarkersVisible = false;
     let residuosPeligrososLayerVisible = false;

     // Función para cargar la capa KML de residuos peligrosos
     const cargarCapaKmlResiduosPeligrosos = () => {
          if ( !kmlLayerResiduosPeligrosos ) {
               kmlLayerResiduosPeligrosos = new google.maps.KmlLayer( {
                    url: urlKmlResiduosPeligrosos,
                    map: map,
                    preserveViewport: true
               } );
               console.log( "Capa KML de residuos peligrosos cargada." );
          } else {
               kmlLayerResiduosPeligrosos.setMap( kmlLayerResiduosPeligrosos.getMap() ? null : map );
               console.log( "Capa KML de residuos peligrosos alternada." );
          }
     };

     botonEnvironment.addEventListener( 'click', async () => {
          // Alternar la visibilidad de los marcadores de Air Quality Stations
          toggleMarcadores( markersAirQuality, airQualityMarkersVisible );
          airQualityMarkersVisible = !airQualityMarkersVisible;

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersAirQuality.length === 0 && airQualityMarkersVisible ) {
               await cargarYMostrarMarcadoresAirQuality( urlMarkerAirQuality );
          }

          cargarCapaKmlResiduosPeligrosos();
     } );



     //! Botón RECYCLING

     const urlReciclyingKML = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Residuos_Peligrosos._Comunidad_de_Madrid..kmz?sp=r&st=2024-04-01T13:39:06Z&se=2090-01-01T22:39:06Z&sv=2022-11-02&sr=b&sig=nzI8YMrIg%2BgJYXrMibgVTbxyFlkeVMefY55z8yyrAFc%3D";

     // URLs con proxy para los datos de puntos de reciclaje
     const urlWasteFixedPoints = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_WasteFixedPoints-00001?sp=r&st=2024-06-02T18:30:56Z&se=2090-01-01T03:30:56Z&sv=2022-11-02&sr=b&sig=a71C%2Bbr30XCf7IXi2IuKVgW6rIiuY4Yy%2BFpCX5s21XA%3D"
     ) }`;

     const urlWasteMobilePoints = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_WasteCleanMobilePoints-00001?sp=r&st=2024-06-02T18:30:23Z&se=2090-01-01T03:30:23Z&sv=2022-11-02&sr=b&sig=NJdkk6KkezyNPI2YvEhkzciBclrLL%2BTT%2FXfreIWEL10%3D"
     ) }`;

     const urlClothesRecycling = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_ClothesRecycling-00001?sp=r&st=2024-06-02T18:27:06Z&se=2090-01-01T03:27:06Z&sv=2022-11-02&sr=b&sig=7P05HcKHRmT23shU0gVz%2BNcveL8SHWsk%2FZgriUKfe6w%3D"
     ) }`;
     // const urlRecyclingContainers = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_RecyclingContainers?sp=r&st=2024-06-02T18:29:14Z&se=2090-01-01T03:29:14Z&sv=2022-11-02&sr=b&sig=KHQi1VWqqEM%2Ffo7RoS8Mltd3zvWvhmdpo8xzepYh55M%3D";

     let kmlLayerRecycling = null;
     let basuraMarker = null;
     let markersWasteFixedPoints = [];
     let markersWasteMobilePoints = [];
     let markersClothesRecycling = [];
     let markersRecyclingContainers = [];

     const botonRecycling = document.getElementById( 'recycling-sub-nav-item' );
     let recyclingVisible = false;
     let intervaloBasuraMarker;

     botonRecycling.addEventListener( 'click', () => {
          // Alternar la visibilidad de la capa KML de Recycling
          if ( kmlLayerRecycling ) {
               kmlLayerRecycling.setMap( recyclingVisible ? null : map );
          } else {
               kmlLayerRecycling = new google.maps.KmlLayer( {
                    url: urlReciclyingKML,
                    map: map // Asegúrate de que 'map' sea una referencia válida a tu instancia de Google Maps
               } );
          }

          // Alternar la visibilidad de los puntos fijos de reciclaje
          toggleMarcadores( markersWasteFixedPoints, recyclingVisible );
          // Alternar la visibilidad de los puntos móviles de reciclaje
          toggleMarcadores( markersWasteMobilePoints, recyclingVisible );
          // Alternar la visibilidad de los puntos de reciclaje de ropa
          toggleMarcadores( markersClothesRecycling, recyclingVisible );
          // Alternar la visibilidad de los contenedores de reciclaje
          toggleMarcadores( markersRecyclingContainers, recyclingVisible );

          recyclingVisible = !recyclingVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersWasteFixedPoints.length === 0 && recyclingVisible ) {
               cargarMarcadoresWasteFixedPoints();
          }
          if ( markersWasteMobilePoints.length === 0 && recyclingVisible ) {
               cargarMarcadoresWasteMobilePoints();
          }
          if ( markersClothesRecycling.length === 0 && recyclingVisible ) {
               cargarMarcadoresClothesRecycling();
          }
          //  if (markersRecyclingContainers.length === 0 && recyclingVisible) {
          //      cargarMarcadoresRecyclingContainers();
          //  }



          // Alternar la visibilidad del camión de basura
          if ( basuraMarker ) {
               clearInterval( intervaloBasuraMarker );
               basuraMarker.setMap( null );
               basuraMarker = null;
          } else {
               // Crear el marcador para el camión de basura
               basuraMarker = new google.maps.Marker( {
                    map: map,
                    title: "Camión de Residuos",
                    icon: "./assets/recyclingQubo.svg",
                    position: basuraCoordinates[ 0 ]  // Iniciar el marcador en la primera posición
               } );

               // Iniciar el movimiento del marcador cada 2000 milisegundos (2 segundos)
               intervaloBasuraMarker = iniciarMovimientoMarcador( basuraMarker, basuraCoordinates, 2000 );

               // Evento para mostrar información en el infoBox al hacer clic
               basuraMarker.addListener( "click", function () {
                    const infoBox = document.querySelector( ".info-box" );
                    infoBox.style.display = "flex";
                    infoBox.innerHTML = `
                <h2>Camión de residuos</h2>
                <img src='${ STATIC_IMAGES.recycling }'>
                <p>Última actualización: <span>28-10-2023  23:51h</span> </p>
                <p>Matrícula: <span>0000 AAA</span> </p>
                <p>Estado: <span>Activo</span> </p>
                <p>Tipo de servicio: <span>Recogida de residuos sólidos urbanos</span> </p>
                <p>Distintivo: <span>XX0000</span> </p>
                <p>Capacidad: <span>20%</span> </p>
                <div class="progress-bar">
                    <div class="progress" style="width: 20%;"></div> 
                    <div class="progress-text">20%</div> 
                </div>
                <button id="cerrar-info-box">
                    <img src="./assets/botonCerrar.svg" alt="">
                </button>
            `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                         infoBox.style.display = "none";
                    } );
               } );
          }
     } );

     function cargarMarcadoresWasteFixedPoints() {
          fetch( urlWasteFixedPoints )
               .then( response => response.json() )
               .then( data => {
                    data.wastecont0004.forEach( item => {
                         const parsedData = parseFiwareData( item );
                         if ( parsedData.ubicacion ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: parsedData.ubicacion[ 1 ], lng: parsedData.ubicacion[ 0 ] },
                                   map: map,
                                   title: parsedData.name,
                                   icon: "./assets/recyclingQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                            <div class='nameContainer'>
                                <p>${ parsedData.category }</p>
                                <p>${ parsedData.name }</p>
                            </div>
                            <img src='${ STATIC_IMAGES.recycling }'>
                            <p>Localización: <span>${ parsedData.addressLocality }, ${ parsedData.addressRegion }</span> </p>
                            <p>Address: <span>${ parsedData.streetAddress }</span> </p>
                            <p>C.P: <span>${ parsedData.postalCode }</span> </p>
                            <p>Neighborhood: <span>${ parsedData.neighborhood }</span> </p>
                            <p>District: <span>${ parsedData.district }</span> </p>
                            <p>Country: <span>${ parsedData.addressCountry }</span> </p>
                            <p> <span>${ parsedData.description }</span> </p>
                            <p>Link: <a href="${ parsedData.source }" target="_blank">${ parsedData.source }</a></p>
                            <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                            <button class='share'><img src='./assets/shareIcon.svg'></button>
                        `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersWasteFixedPoints.push( marker ); // Añade el marcador al array de puntos fijos de reciclaje
                         }
                    } );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }

     function cargarMarcadoresWasteMobilePoints() {
          fetch( urlWasteMobilePoints )
               .then( response => response.json() )
               .then( data => {
                    data.wastecont0003.forEach( item => {
                         const parsedData = parseFiwareData( item );
                         if ( parsedData.ubicacion ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: parsedData.ubicacion[ 1 ], lng: parsedData.ubicacion[ 0 ] },
                                   map: map,
                                   title: parsedData.name,
                                   icon: "./assets/recyclingQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                            <div class='nameContainer'>
                                <p>${ parsedData.category }</p>
                                <p>${ parsedData.name }</p>
                            </div>
                            <img src='${ STATIC_IMAGES.recycling }'>
                            <p>Localización: <span>${ parsedData.addressLocality }, ${ parsedData.addressRegion }</span> </p>
                            <p>Address: <span>${ parsedData.streetAddress }</span> </p>
                            <p>C.P: <span>${ parsedData.postalCode }</span> </p>
                            <p>Neighborhood: <span>${ parsedData.neighborhood }</span> </p>
                            <p>District: <span>${ parsedData.district }</span> </p>
                            <p>Country: <span>${ parsedData.addressCountry }</span> </p>
                            <p> <span>${ parsedData.description }</span> </p>
                            <p>Link: <a href="${ parsedData.source }" target="_blank">${ parsedData.source }</a></p>
                            <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                            <button class='share'><img src='./assets/shareIcon.svg'></button>
                        `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersWasteMobilePoints.push( marker ); // Añade el marcador al array de puntos móviles de reciclaje
                         }
                    } );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }


     function parseCoordinatesClothesRecycling( coordinates ) {
          const lat = parseFloat( coordinates[ 1 ].replace( ',', '.' ) );
          const lng = parseFloat( coordinates[ 0 ].replace( ',', '.' ) );
          return [ lng, lat ];
     }

     function cargarMarcadoresClothesRecycling() {

          fetch( urlClothesRecycling )
               .then( response => response.json() )
               .then( data => {
                    data.wastecont0001.forEach( item => {
                         const coordinates = parseCoordinatesClothesRecycling( item.location.value.coordinates );
                         const parsedData = {
                              ubicacion: coordinates,
                              name: item.name.value,
                              category: item.category.value.join( ', ' ),
                              description: item.description ? item.description.value : 'Descripción no disponible',
                              streetAddress: item.address.value.streetAddress,
                              postalCode: item.address.value.postalCode,
                              addressLocality: item.address.value.addressLocality,
                              addressRegion: item.address.value.addressRegion,
                              addressCountry: item.address.value.addressCountry,
                              neighborhood: item.address.value.neighborhood,
                              district: item.address.value.district,
                              source: item.source ? item.source.value : 'Link no disponible'
                         };

                         if ( parsedData.ubicacion ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: parsedData.ubicacion[ 1 ], lng: parsedData.ubicacion[ 0 ] },
                                   map: map,
                                   title: parsedData.name,
                                   icon: "./assets/recyclingQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                             <div class='nameContainer'>
                                 <p>${ parsedData.category }</p>
                                 <p>${ parsedData.name }</p>
                             </div>
                             <img src='${ STATIC_IMAGES.recycling }'>
                             <p>Localización: <span>${ parsedData.addressLocality }, ${ parsedData.addressRegion }</span> </p>
                             <p>Address: <span>${ parsedData.streetAddress }</span> </p>
                             <p>C.P: <span>${ parsedData.postalCode }</span> </p>
                             <p>Neighborhood: <span>${ parsedData.neighborhood }</span> </p>
                             <p>District: <span>${ parsedData.district }</span> </p>
                             <p>Country: <span>${ parsedData.addressCountry }</span> </p>
                             <p> <span>${ parsedData.description }</span> </p>
                             <p>Link: <a href="${ parsedData.source }" target="_blank">${ parsedData.source }</a></p>
                             <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                             <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersClothesRecycling.push( marker ); // Añade el marcador al array de puntos de reciclaje de ropa
                         }
                    } );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }

     //  function cargarMarcadoresRecyclingContainers() {
     //      fetch(urlRecyclingContainers)
     //          .then(response => response.json())
     //          .then(data => {
     //              data.wastecont0002.forEach(item => {
     //                  const parsedData = parseFiwareData(item);
     //                  if (parsedData.ubicacion) {
     //                      const marker = new google.maps.Marker({
     //                          position: { lat: parsedData.ubicacion[1], lng: parsedData.ubicacion[0] },
     //                          map: map,
     //                          title: parsedData.name,
     //                          icon: "./assets/recyclingQubo.svg"
     //                      });

     //                      marker.addListener("click", () => {
     //                          const infoBox = document.querySelector(".info-box");
     //                          infoBox.style.display = "flex";
     //                          infoBox.innerHTML = `
     //                              <div class='nameContainer'>
     //                                  <p>${parsedData.category}</p>
     //                                  <p>${parsedData.name}</p>
     //                              </div>
     //                              <img src='${STATIC_IMAGES.recycling}'>
     //                              <p>Localización: ${parsedData.addressLocality}, ${parsedData.addressRegion}</p>
     //                              <p>Address: ${parsedData.streetAddress}</p>
     //                              <p>C.P: ${parsedData.postalCode}</p>
     //                              <p>Neighborhood: ${parsedData.neighborhood}</p>
     //                              <p>District: ${parsedData.district}</p>
     //                              <p>Country: ${parsedData.addressCountry}</p>
     //                              <p>${parsedData.description}</p>
     //                              <p>Link: <a href="${parsedData.source}" target="_blank">${parsedData.source}</a></p>
     //                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
     //                              <button class='share'><img src='./assets/shareIcon.svg'></button>
     //                          `;
     //                          document.getElementById("cerrar-info-box").addEventListener("click", () => {
     //                              infoBox.style.display = "none";
     //                          });
     //                      });

     //                      markersRecyclingContainers.push(marker); // Añade el marcador al array de contenedores de reciclaje
     //                  }
     //              });
     //          })
     //          .catch(error => console.error("Hubo un problema con la solicitud:", error));
     //  }

     // function toggleMarkers( markers, visible ) {
     //      markers.forEach( marker => marker.setMap( visible ? null : map ) );
     // }
     // const ulrReciclying = [
     //      "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Residuos_Peligrosos._Comunidad_de_Madrid..kmz?sp=r&st=2024-04-01T13:39:06Z&se=2090-01-01T22:39:06Z&sv=2022-11-02&sr=b&sig=nzI8YMrIg%2BgJYXrMibgVTbxyFlkeVMefY55z8yyrAFc%3D"
     // ];


     // let kmlLayersRecycling = [];
     // let basuraMarker = null;
     // let intervaloBasuraMarker = null;
     // const botonRecycling = document.getElementById( 'recycling-sub-nav-item' );
     // let kmlLayersRecyclingVisible = false;


     const basuraCoordinates = [
          { lat: 40.41548640113572, lng: -3.6775999678056697 },
          { lat: 40.415520400426594, lng: -3.677446862111321 },
          { lat: 40.41555925673799, lng: -3.6772554799933834 },
          { lat: 40.41557868488525, lng: -3.6771151331068967 },
          { lat: 40.41562725522892, lng: -3.6768982333732354 },
          { lat: 40.41566125444865, lng: -3.6766813336395736 },
          { lat: 40.41570457454587, lng: -3.676484086393417 },
          { lat: 40.415733454595184, lng: -3.6763247713099827 },
          { lat: 40.41575078261883, lng: -3.676173042659094 },
          { lat: 40.41578543865272, lng: -3.676002347926843 },
          { lat: 40.41579699066006, lng: -3.675835446410864 },
          { lat: 40.415831646670156, lng: -3.6755850941368964 },
          { lat: 40.41586052666494, lng: -3.675361294376834 },
          { lat: 40.41589452576676, lng: -3.6751475843451376 },
          { lat: 40.41589452576676, lng: -3.6750455138822384 },
          { lat: 40.415930953356806, lng: -3.6748700802741303 },
          { lat: 40.415952809901356, lng: -3.6747010260699526 },
          { lat: 40.41599166596304, lng: -3.6744777469323604 },
          { lat: 40.41601837949242, lng: -3.6742448986888703 },
          { lat: 40.4160523785145, lng: -3.673986532829656 },
          { lat: 40.41608637751937, lng: -3.6737823919038566 },
          { lat: 40.41611551951397, lng: -3.6735782509295807 },
          { lat: 40.41613980449643, lng: -3.6733135056664348 },
          { lat: 40.41616651796701, lng: -3.6731380720583267 },
          { lat: 40.416200516914195, lng: -3.672908413516803 },
          { lat: 40.416219944876325, lng: -3.6727553078224533 },
          { lat: 40.41624180132701, lng: -3.672592633022208 },
          { lat: 40.416275800236164, lng: -3.6723725435865804 },
          { lat: 40.41630979912817, lng: -3.672107798323435 },
          { lat: 40.41633408404049, lng: -3.6718781397819105 },
          { lat: 40.41635836894404, lng: -3.6716963267698715 },
          { lat: 40.41647250787339, lng: -3.671584687201075 },
          { lat: 40.41661093142797, lng: -3.6715719283765016 },
          { lat: 40.41675664011831, lng: -3.6717027061570917 },
          { lat: 40.41678092486937, lng: -3.6719674514202367 },
          { lat: 40.41677606791986, lng: -3.6720631424792063 },
          { lat: 40.416788210292985, lng: -3.6722417657892796 },
          { lat: 40.416785781818525, lng: -3.672273662808936 },
          { lat: 40.41681492350612, lng: -3.6724746140327693 },
          { lat: 40.41681492350612, lng: -3.672614960919256 },
          { lat: 40.41683677976352, lng: -3.672822291547021 },
          { lat: 40.41684406518109, lng: -3.672988156049233 },
          { lat: 40.41684406518109, lng: -3.673102985319994 },
          { lat: 40.41686106448563, lng: -3.6733326438615186 },
          { lat: 40.41687563531469, lng: -3.6735495435951795 },
          { lat: 40.41689020614063, lng: -3.6738908417054996 },
          { lat: 40.4168999200228, lng: -3.674063085611643 },
          { lat: 40.41691691931327, lng: -3.6742895544512013 },
          { lat: 40.41692906166095, lng: -3.6744841262711034 },
          { lat: 40.41693391859942, lng: -3.674611714349728 },
          { lat: 40.41693877553753, lng: -3.6748381831892862 },
          { lat: 40.416950917881294, lng: -3.6749466330561167 },
          { lat: 40.41697277409451, lng: -3.6753485355037836 },
          { lat: 40.416977631029816, lng: -3.675485692688305 },
          { lat: 40.417004344172724, lng: -3.6757887144130317 },
          { lat: 40.41701648650465, lng: -3.6760056141466926 },
          { lat: 40.41702134343681, lng: -3.6761714786489046 },
          { lat: 40.417040771172154, lng: -3.676506397387692 },
          { lat: 40.41705777042703, lng: -3.676739245631181 },
          { lat: 40.417089340460386, lng: -3.677026318808086 },
          { lat: 40.41707476967758, lng: -3.6771953730122635 },
          { lat: 40.417089340460386, lng: -3.677338909600716 },
          { lat: 40.41711119662864, lng: -3.6776323621815514 },
          { lat: 40.41712333894126, lng: -3.6778077957896604 },
          { lat: 40.41712091047891, lng: -3.677999177907597 },
          { lat: 40.41712091047891, lng: -3.6781778012176707 },
          { lat: 40.41724476194709, lng: -3.678327717210055 },
          { lat: 40.41742932449624, lng: -3.67840427005723 },
          { lat: 40.4176648838564, lng: -3.6784872023083355 },
          { lat: 40.41789801395753, lng: -3.6785733242614067 },
          { lat: 40.41807043257519, lng: -3.6786339285987535 },
          { lat: 40.41828899076569, lng: -3.6786785844346275 },
          { lat: 40.41833270231571, lng: -3.6785286684422442 },
          { lat: 40.41831813180218, lng: -3.6784361670852412 },
          { lat: 40.418301132865764, lng: -3.678305389304651 },
          { lat: 40.41828899076569, lng: -3.6781267659945773 },
          { lat: 40.41827927708407, lng: -3.6780597822532997 },
          { lat: 40.418284133925056, lng: -3.677903486856985 },
          { lat: 40.41827442024272, lng: -3.6777440017587044 },
          { lat: 40.41826713498004, lng: -3.6775653784486306 },
          { lat: 40.41825742129524, lng: -3.6774664976876963 },
          { lat: 40.41824042234349, lng: -3.677179424510791 },
          { lat: 40.41823070865484, lng: -3.676994421796786 },
          { lat: 40.41821613811923, lng: -3.6768508852083333 },
          { lat: 40.41819913915703, lng: -3.67670096921595 },
          { lat: 40.41818942546244, lng: -3.6766180369648445 },
          { lat: 40.41819185388621, lng: -3.6764585518665633 },
          { lat: 40.41817485491789, lng: -3.6761842374975218 },
          { lat: 40.41816514121976, lng: -3.675980096571722 },
          { lat: 40.418167569644424, lng: -3.675890784916685 },
          { lat: 40.418167569644424, lng: -3.6757536277321643 },
          { lat: 40.418148142244696, lng: -3.6755558662102965 },
          { lat: 40.41814328539388, lng: -3.675409139919878 },
          { lat: 40.418136000117, lng: -3.675214568099976 },
          { lat: 40.41813357169122, lng: -3.6750359447899017 },
          { lat: 40.41812628641327, lng: -3.6748924082014485 },
          { lat: 40.418108584833455, lng: -3.674657050288387 },
          { lat: 40.41810515051933, lng: -3.67447210257742 },
          { lat: 40.41809828189054, lng: -3.674332264064249 },
          { lat: 40.418101716205015, lng: -3.6741631045725107 },
          { lat: 40.41808111031553, lng: -3.6740390542785692 },
          { lat: 40.418082827473235, lng: -3.6738789166263897 },
          { lat: 40.41807424168429, lng: -3.6737638881720076 },
          { lat: 40.4180690902104, lng: -3.673551874942363 },
          { lat: 40.418058787261465, lng: -3.6733624163116145 },
          { lat: 40.418045049992145, lng: -3.6731842349363406 },
          { lat: 40.41803818135722, lng: -3.6729406452682376 },
          { lat: 40.4180158582889, lng: -3.6727150992792525 },
          { lat: 40.41800727249144, lng: -3.6724196340336825 },
          { lat: 40.417991818053196, lng: -3.6721196578683335 },
          { lat: 40.41797808077181, lng: -3.6718557690612212 },
          { lat: 40.418000403852645, lng: -3.671695631409042 },
          { lat: 40.41797808077181, lng: -3.6714836181793964 },
          { lat: 40.41812575639987, lng: -3.671517450077744 },
          { lat: 40.41813434218222, lng: -3.6716460112914655 },
          { lat: 40.418151513743645, lng: -3.671991096654611 },
          { lat: 40.41815323089955, lng: -3.6721557452265703 },
          { lat: 40.41816525098963, lng: -3.672374524835886 },
          { lat: 40.418172119611576, lng: -3.672766974856719 },
          { lat: 40.418189291163365, lng: -3.6729834990061443 },
          { lat: 40.418247674406665, lng: -3.673114315679755 },
          { lat: 40.418464035403126, lng: -3.6730782283173924 },
          { lat: 40.41857564992711, lng: -3.673071461937723 },
          { lat: 40.418730192808475, lng: -3.673057929178384 },
          { lat: 40.41884524118023, lng: -3.67305792917348 },
          { lat: 40.41910624568305, lng: -3.6730173308954623 },
          { lat: 40.41925735309029, lng: -3.6730195863553528 },
          { lat: 40.419358663548266, lng: -3.6729925208366736 },
          { lat: 40.41950977038856, lng: -3.6730037981361234 },
          { lat: 40.419645422845, lng: -3.67297673261254 },
          { lat: 40.419942483567596, lng: -3.672965455313091 },
          { lat: 40.420109043051994, lng: -3.672956433473531 },
          { lat: 40.420275602124036, lng: -3.672936134334523 },
          { lat: 40.420534883995174, lng: -3.6729203461129525 },
          { lat: 40.42069629074021, lng: -3.6728932805942742 },
          { lat: 40.42085254583719, lng: -3.6728797478349353 },
          { lat: 40.42103799098642, lng: -3.6728797478322597 },
          { lat: 40.421257777155446, lng: -3.6728256167949036 },
          { lat: 40.42135565045276, lng: -3.6727489311586488 },
          { lat: 40.42133847970915, lng: -3.6724015903356126 },
          { lat: 40.42131615773591, lng: -3.6721895771059665 },
          { lat: 40.42130585528421, lng: -3.671776827946125 },
          { lat: 40.42128696745201, lng: -3.671400166144521 },
          { lat: 40.42125949423206, lng: -3.6710483144017045 },
          { lat: 40.42123218594613, lng: -3.670576380732011 },
          { lat: 40.42122360055911, lng: -3.6700283039787776 },
          { lat: 40.42119956146964, lng: -3.6697847143106745 },
          { lat: 40.4211806736076, lng: -3.669496015444774 },
          { lat: 40.42117037113516, lng: -3.66926370307612 },
          { lat: 40.42103762661043, lng: -3.668695237602468 },
          { lat: 40.42088824028796, lng: -3.6682373792448297 },
          { lat: 40.42082985933616, lng: -3.667950935838819 },
          { lat: 40.42071653146154, lng: -3.6675449530586466 },
          { lat: 40.42055066031355, lng: -3.6668740848581547 },
          { lat: 40.42040642420504, lng: -3.6662718770675657 },
          { lat: 40.42027077329699, lng: -3.665719289394553 },
          { lat: 40.42010108143248, lng: -3.6650216114850975 },
          { lat: 40.41994310747991, lng: -3.6642457332829896 },
          { lat: 40.41975485235993, lng: -3.663611381519529 },
          { lat: 40.41930840097224, lng: -3.6621453325651547 },
          { lat: 40.41886881517182, lng: -3.6611371419658 },
          { lat: 40.41800911233706, lng: -3.660769288158006 },
          { lat: 40.41722000169107, lng: -3.6600883661087633 },
          { lat: 40.41634766873914, lng: -3.6600387459850556 },
     ];



     // ! Botón para STTREETLIGHTS
     function cargarMarcadoresStreetlights() {
          const urlStreetlights = `/api/proxy?url=${ encodeURIComponent(
               "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Streetlights/Fiware_EnvAndSust_Streetlights?sp=r&st=2024-06-02T18:39:47Z&se=2090-01-01T03:39:47Z&sv=2022-11-02&sr=b&sig=TfxEOSZ19Sp0%2BQFAg3AmmlIXUmkI1DX3JZfEjGH56gA%3D"
          ) }`;

          fetch( urlStreetlights )
               .then( response => response.json() )
               .then( data => {
                    data.streetlight0001.slice( 0, 100 ).forEach( item => {
                         const {
                              ubicacion,
                              name,
                              category,
                              description,
                              streetAddress,
                              postalCode,
                              addressLocality,
                              addressRegion,
                              addressCountry,
                              neighborhood,
                              district,
                              source
                         } = parseFiwareData( item );

                         if ( ubicacion ) {
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: name,
                                   icon: "./assets/streetlightsQubo.svg"
                              } );

                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                              <div class='nameContainer'>
                                  <p>${ category }</p>
                                  <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.streetlights }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p> <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                              `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersStreetlights.push( marker ); // Añade el marcador al array de farolas
                         }
                    } );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }

     const eventStreetlights = document.getElementById( "streetlights-sub-nav-item" );
     let markersStreetlights = []; // Array para almacenar los marcadores de farolas
     let streetlightsVisible = false; // Bandera para el estado de visibilidad

     eventStreetlights.addEventListener( "click", () => {
          // Alternar la visibilidad de los marcadores de farolas
          toggleMarcadores( markersStreetlights, streetlightsVisible );
          streetlightsVisible = !streetlightsVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersStreetlights.length === 0 && streetlightsVisible ) {
               cargarMarcadoresStreetlights();
          }
     } );

     //! Botón ENERGY&EFFICIENCY
     // Función para cargar y mostrar marcadores de eficiencia energética
     const cargarYMostrarMarcadoresEnergiaEficiencia = async () => {
          try {

               const urlEnergyEfficiency = `/api/proxy?url=${ encodeURIComponent(
                    "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Energy%20Efficiency/Fiware_EnvAndSust_BuildingsEnergyEfficiency.json?sp=r&st=2024-01-04T16:17:19Z&se=2090-01-01T00:17:19Z&sv=2022-11-02&sr=b&sig=w%2B2x10PtsIkypmzPvwFSe0ZSOmVgBFy%2FsYlbf1ICgV4%3D"
               ) }`;
               const response = await fetch( urlEnergyEfficiency );
               const data = await response.json();

               data.consumptionobs0001.forEach( item => {
                    const ubicacion = item.location.value.coordinates;
                    const lat = parseFloat( ubicacion[ 1 ] );
                    const lng = parseFloat( ubicacion[ 0 ] );

                    const energyEfficiencyMarker = new google.maps.Marker( {
                         position: { lat: lat, lng: lng },
                         map: map,
                         title: item.name.value,
                         icon: "./assets/energyAndEfficiency_Qubo.svg"
                    } );

                    energyEfficiencyMarker.addListener( 'click', () => {
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         const idWithoutPrefix = item.id.replace( /^consumptionobs_/, '' );


                         infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ item.name.value }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.energyEfficiency }'>
                              <p>Código identificador: <span>${ idWithoutPrefix }</span> </p>
                              <p>Address: <span>${ item.address.value.streetAddress }</span> </p>
                              <p>Barrio: <span>${ item.address.value.neighborhood }</span> </p>
                              <p>Localización: <span>${ item.address.value.district }, ${ item.address.value.addressRegion }</span> </p>
                              <p>Año Contrucción: <span>${ item.month.value }/${ item.year.value }</span> </p>
                              <p>${ item.energyConsumedAndCost.value.energyType.value }: <span>${ item.energyConsumedAndCost.value.energyConsumed.value.value.value } ${ item.energyConsumedAndCost.value.energyConsumed.value.measurementUnit.value }</span>  </p>
                              <p> <span>${ item.description.value }</span> </p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );

                    markersEnergyEfficiency.push( energyEfficiencyMarker ); // Añade el marcador al array de eficiencia energética
               } );
          } catch ( error ) {
               console.error( "Error fetching energy and efficiency stations:", error );
          }
     };
     // Evento botón ENERGY AND EFFICIENCY
     const eventEnergyAndEfficiency = document.getElementById( "energyAndEfficiency-sub-nav-item" );
     let markersEnergyEfficiency = []; // Array para almacenar los marcadores de eficiencia energética
     let energyAndEfficiencyVisible = false; // Bandera para el estado de visibilidad
     eventEnergyAndEfficiency.addEventListener( 'click', async () => {
          // Alternar la visibilidad de los marcadores de eficiencia energética
          toggleMarcadores( markersEnergyEfficiency, energyAndEfficiencyVisible );
          energyAndEfficiencyVisible = !energyAndEfficiencyVisible; // Cambia la bandera de visibilidad

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersEnergyEfficiency.length === 0 && energyAndEfficiencyVisible ) {
               await cargarYMostrarMarcadoresEnergiaEficiencia();
          }
     } );



     //* ---------------------------------------------------------------------------------
     //! Camaras de Barcelona
     let marcadoresCamarasBarcelona = [];
     // Función modificada para crear marcadores de cámaras de Barcelona
     function crearMarcadoresCamarasBarcelona() {
          const urlCamarasBarcelona = `/api/proxy?url=${ encodeURIComponent(
               "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search?resource_id=cd1957a6-a06e-4a90-80bb-83e0e4c2d6e9&limit=5"
          ) }`;
          return fetch( urlCamarasBarcelona )
               .then( response => response.json() )
               .then( data => {
                    const promesasMarcadores = data.result.records.map( camara => {
                         return new Promise( resolve => {
                              const marcadorCamara = new google.maps.Marker( {
                                   position: { lat: parseFloat( camara.Latitud ), lng: parseFloat( camara.Longitud ) },
                                   map: null, // No añadir al mapa de inmediato
                                   title: `Marcador Cámara`,
                                   icon: "./assets/quboCamaras.svg",
                              } );

                              // Almacenar el marcador en el arreglo global
                              marcadoresCamarasBarcelona.push( marcadorCamara );
                              resolve( marcadorCamara );
                         } );
                    } );

                    return Promise.all( promesasMarcadores );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }
     // Controlador de eventos para el botón 'cameras-button'
     document.getElementById( 'cameras-button' ).addEventListener( 'click', () => {
          if ( marcadoresCamarasBarcelona.length === 0 ) {
               // Si es la primera vez y el arreglo está vacío, inicializar los marcadores
               crearMarcadoresCamarasBarcelona().then( () => {
                    // Una vez creados, mostrar todos los marcadores
                    marcadoresCamarasBarcelona.forEach( marcador => marcador.setMap( map ) );
               } );
          } else {
               // Alternar la visibilidad de cada marcador si ya existen
               marcadoresCamarasBarcelona.forEach( marcador => {
                    marcador.setMap( marcador.getMap() ? null : map );
               } );
          }
     } );


     //! Cámaras Valencia
     // Paso 1: Arreglo global para almacenar los marcadores de cámaras de Valencia
     let marcadoresCamarasValencia = [];
     // Paso 2: Función modificada para crear marcadores de cámaras de Valencia
     function crearMarcadoresCamarasValencia() {
          const urlCamarasValencia = `/api/proxy?url=${ encodeURIComponent(
               "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/cameres-trafic-camaras-trafico/records?limit=20"
          ) }`;
          return fetch( urlCamarasValencia )
               .then( response => response.json() )
               .then( data => {
                    const promesasMarcadores = data.results.map( camara => {
                         return new Promise( resolve => {
                              const marcadorCamara = new google.maps.Marker( {
                                   position: { lat: parseFloat( camara.geo_point_2d.lat ), lng: parseFloat( camara.geo_point_2d.lon ) },
                                   map: null, // No añadir al mapa de inmediato
                                   title: `Marcador Cámara`,
                                   icon: "./assets/quboCamaras.svg",
                              } );

                              // Agrega el evento click para mostrar el contenido en un infoBox
                              marcadorCamara.addListener( "click", function () {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   const videoContent = `<iframe width="560" height="315" src="${ camara.url }" frameborder="0" allowfullscreen></iframe>`;
                                   infoBox.innerHTML = videoContent;
                              } );

                              // Almacenar el marcador en el arreglo global
                              marcadoresCamarasValencia.push( marcadorCamara );
                              resolve( marcadorCamara );
                         } );
                    } );

                    return Promise.all( promesasMarcadores );
               } )
               .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     }
     const camarasZonaBajasEmisionesKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Car%20Traffic/camaras_zonabajasemisiones_mc.kmz?sp=r&st=2024-03-19T20:34:37Z&se=2090-01-01T04:34:37Z&sv=2022-11-02&sr=b&sig=gn9rV3AAOe4XD4okscc0T82THsCzH4Um71649lsB8Y4%3D";
     let kmlLayerCamarasZonaBajasEmisiones = null;

     // Controlador de eventos para el botón 'cameras-button'
     document.getElementById( 'cameras-button' ).addEventListener( 'click', () => {
          // Alternar las cámaras de Barcelona
          if ( marcadoresCamarasBarcelona.length === 0 ) {
               crearMarcadoresCamarasBarcelona().then( () => {
                    marcadoresCamarasBarcelona.forEach( marcador => marcador.setMap( map ) );
               } );
          } else {
               marcadoresCamarasBarcelona.forEach( marcador => {
                    marcador.setMap( marcador.getMap() ? null : map );
               } );
          }

          // Alternar las cámaras de Valencia
          if ( marcadoresCamarasValencia.length === 0 ) {
               crearMarcadoresCamarasValencia().then( () => {
                    marcadoresCamarasValencia.forEach( marcador => marcador.setMap( map ) );
               } );
          } else {
               marcadoresCamarasValencia.forEach( marcador => {
                    marcador.setMap( marcador.getMap() ? null : map );
               } );
          }

          // Alternar la capa KML de la zona de bajas emisiones
          if ( !kmlLayerCamarasZonaBajasEmisiones ) {
               kmlLayerCamarasZonaBajasEmisiones = new google.maps.KmlLayer( {
                    url: camarasZonaBajasEmisionesKmzUrl,
                    map: map,
                    preserveViewport: true // Evita que el mapa cambie el zoom y el centro automáticamente
               } );
          } else {
               kmlLayerCamarasZonaBajasEmisiones.setMap( kmlLayerCamarasZonaBajasEmisiones.getMap() ? null : map );
          }

          document.getElementById( 'cameras-button' ).classList.toggle( 'active' );
     } );

     //*************************** DIGITAL TWINS ********************************//

     //!Función para Marcadores de BARCOS
     const marcadoresBarcos = {};
     function iniciarBarcoEnMapa( barcoId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresBarcos[ barcoId ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresBarcos[ barcoId ].intervaloId );
               marcadoresBarcos[ barcoId ].marker.setMap( null );
               delete marcadoresBarcos[ barcoId ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el barco
          const barcoMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del barco de la API y mover el marcador
          function obtenerYmoverBarco() {
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.coordinates && Array.isArray( data.coordinates ) ) {
                              const coordenadas = data.coordinates;

                              // Mover el marcador del barco con las coordenadas obtenidas
                              const intervaloId = iniciarMovimientoMarcador( barcoMarker, coordenadas, 2000 );
                              marcadoresBarcos[ barcoId ] = {
                                   marker: barcoMarker,
                                   intervaloId: intervaloId,
                                   datosBarco: data // Almacenar los datos del barco aquí
                              };
                         } else {
                              console.error( 'Los datos del barco no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del barco:', error ) );
          }

          // Iniciar el proceso de mover el barco
          obtenerYmoverBarco();

          // Añadir un evento click al marcador del barco para mostrar información
          barcoMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosBarco = marcadoresBarcos[ barcoId ].datosBarco;
               infoBox.innerHTML = `
                         <div class='nameContainer'>
                              <p>${ datosBarco.nombre }</p>
                         </div>
                         <button id="cerrar-info-box">
                              <img src="./assets/botonCerrar.svg" alt="Cerrar">
                         </button>
                    `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }
     const eventBoats = document.getElementById( "boats-sub-nav-item" );
     const proxyUrlBoats = '/api/proxy?url=';
     eventBoats.addEventListener( 'click', function () {
          iniciarBarcoEnMapa( 1, './assets/boats_Qubo.svg', 'Barco 1', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Mobility_Boats.json?sp=r&st=2024-04-01T11:12:53Z&se=2090-01-01T20:12:53Z&sv=2022-11-02&sr=b&sig=sfxwYCe7JJ0ZeuDv6bloxXNQdCpVAs28Qw22HdpJGxk%3D' ) }` );

          iniciarBarcoEnMapa( 2, './assets/boats_Qubo.svg', 'Barco 2', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_2.json?sp=r&st=2024-04-01T20:16:42Z&se=2090-01-01T05:16:42Z&sv=2022-11-02&sr=b&sig=qcjPW89tElqDN59MnZ1ywua3aopyrBhVHzt7OlTeEbk%3D' ) }` );

          iniciarBarcoEnMapa( 4, './assets/boats_Qubo.svg', 'Barco 4', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_4.json?sp=r&st=2024-04-01T20:17:48Z&se=2090-01-01T05:17:48Z&sv=2022-11-02&sr=b&sig=EcsDdDpqTcPAq32J0VTlr9zGc20NspvzOqh0iBCzdAE%3D' ) }` );

          iniciarBarcoEnMapa( 5, './assets/boats_Qubo.svg', 'Barco 5', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_5.json?sp=r&st=2024-04-01T20:18:09Z&se=2090-01-01T05:18:09Z&sv=2022-11-02&sr=b&sig=agT3rXaXP1ZXMO0Sf8OKeuzxTbLx%2FVcrt5fSOvcWMUE%3D' ) }` );

          iniciarBarcoEnMapa( 6, './assets/boats_Qubo.svg', 'Barco 6', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_6.json?sp=r&st=2024-04-01T20:18:35Z&se=2090-01-01T05:18:35Z&sv=2022-11-02&sr=b&sig=bO%2FRFK8iOg0y2lRLe8uBf9ojTTCcODoZ7VSs0RfEHyY%3D' ) }` );

          iniciarBarcoEnMapa( 7, './assets/boats_Qubo.svg', 'Barco 7', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_7.json?sp=r&st=2024-04-01T20:18:56Z&se=2090-01-01T05:18:56Z&sv=2022-11-02&sr=b&sig=xR2BcP2a3W8SDjKjn84aOjwWwv4lEyeaLdIotZ4RZig%3D' ) }` );

          iniciarBarcoEnMapa( 8, './assets/boats_Qubo.svg', 'Barco 8', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_8.json?sp=r&st=2024-04-01T20:19:18Z&se=2090-01-01T05:19:18Z&sv=2022-11-02&sr=b&sig=kUij3HyVFdPMeoH5TkNXlQoeqnNVII%2BsUMmJUUtjMkA%3D' ) }` );

          iniciarBarcoEnMapa( 10, './assets/boats_Qubo.svg', 'Barco 10', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_10.json?sp=r&st=2024-04-01T20:19:55Z&se=2090-01-01T05:19:55Z&sv=2022-11-02&sr=b&sig=QTCF9TFz9LyP574FpI2ZqxtfizuSl%2FixsaEpNcpwbXY%3D' ) }` );

          iniciarBarcoEnMapa( 12, './assets/boats_Qubo.svg', 'Barco 12', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_12.json?sp=r&st=2024-04-01T20:22:27Z&se=2090-01-01T05:22:27Z&sv=2022-11-02&sr=b&sig=bK3BbuLhYxSVKNIjW4GvAP%2BiiWTjNK90%2Blte%2F%2Fa0iyQ%3D' ) }` );

          iniciarBarcoEnMapa( 13, './assets/boats_Qubo.svg', 'Barco 13', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_13.json?sp=r&st=2024-04-01T20:22:50Z&se=2090-01-01T05:22:50Z&sv=2022-11-02&sr=b&sig=gaVzoTsoeHYl9SL1Dzxu1er7zsdabVTUf%2FoP%2B2UvDfE%3D' ) }` );

          iniciarBarcoEnMapa( 14, './assets/boats_Qubo.svg', 'Barco 14', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_14.json?sp=r&st=2024-04-01T20:23:09Z&se=2090-01-01T05:23:09Z&sv=2022-11-02&sr=b&sig=8QD6qBWVvZb1WBvftoVDhFKhUek%2FdU2h1ObYAya8rkw%3D' ) }` );

          iniciarBarcoEnMapa( 15, './assets/boats_Qubo.svg', 'Barco 15', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_15.json?sp=r&st=2024-04-01T20:23:28Z&se=2090-01-01T05:23:28Z&sv=2022-11-02&sr=b&sig=E4hgKifHPCKlUxIOQkecZG5Z%2FbQb7rWYoAM6EO0%2F9ZQ%3D' ) }` );

          iniciarBarcoEnMapa( 16, './assets/boats_Qubo.svg', 'Barco 16', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_16.json?sp=r&st=2024-04-01T20:23:45Z&se=2090-01-01T05:23:45Z&sv=2022-11-02&sr=b&sig=XRHHu9bc59wLdLXODmgxYKWHc%2FMHxBNegepX7DQMK5M%3D' ) }` );

          iniciarBarcoEnMapa( 17, './assets/boats_Qubo.svg', 'Barco 17', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_17.json?sp=r&st=2024-04-01T20:24:03Z&se=2024-04-02T04:24:03Z&sv=2022-11-02&sr=b&sig=PXYhpSa%2BmKl6zH4oG7cdu3MmmHO4RQYA54Wy%2F%2F2r%2BJU%3D' ) }` );

          iniciarBarcoEnMapa( 18, './assets/boats_Qubo.svg', 'Barco 18', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_18.json?sp=r&st=2024-04-01T20:24:18Z&se=2090-01-01T05:24:18Z&sv=2022-11-02&sr=b&sig=KcB1r84uAdX9kHjmoR6QcvrzPZGfy9KLcpW20Rcf62I%3D' ) }` );

          iniciarBarcoEnMapa( 19, './assets/boats_Qubo.svg', 'Barco 19', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_19.json?sp=r&st=2024-04-01T20:24:41Z&se=2090-01-01T05:24:41Z&sv=2022-11-02&sr=b&sig=amlh5UkJrvl41biDJveOesGDXNxcr2nFvjtQ3%2BE22Ew%3D' ) }` );

          iniciarBarcoEnMapa( 20, './assets/boats_Qubo.svg', 'Barco 20', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_20.json?sp=r&st=2024-04-01T20:25:06Z&se=2090-01-01T05:25:06Z&sv=2022-11-02&sr=b&sig=KSXgObS5DJuLM0%2Fs9o9VfpU7fMRmlu3pzneg6FsnZ0w%3D' ) }` );

          iniciarBarcoEnMapa( 21, './assets/boats_Qubo.svg', 'Barco 21', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barcaza_Manzanares.json?sp=r&st=2024-04-01T20:34:02Z&se=2090-01-01T05:34:02Z&sv=2022-11-02&sr=b&sig=mQrWa7j7rsyNISoeMjLQ51ux9DYURP%2BP%2B4GVGMhFYRc%3D' ) }` );

          iniciarBarcoEnMapa( 22, './assets/boats_Qubo.svg', 'Barco 22', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Bote_de_Remos_Manzanares.json?sp=r&st=2024-04-01T20:34:19Z&se=2090-01-01T05:34:19Z&sv=2022-11-02&sr=b&sig=h5zhYZzpd4yyAL%2FlgMxkPW4NPDr7GqAeJGeS%2FCgdUG8%3D' ) }` );

          iniciarBarcoEnMapa( 23, './assets/boats_Qubo.svg', 'Barco 23', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Canoa_Manzanares.json?sp=r&st=2024-04-01T20:34:36Z&se=2090-01-01T05:34:36Z&sv=2022-11-02&sr=b&sig=fV7CQweEt%2FC%2FGXcVqq2daBHe4CEqW3OyNmMxmhYtr5k%3D' ) }` );

          iniciarBarcoEnMapa( 24, './assets/boats_Qubo.svg', 'Barco 24', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Go%CC%81ndola_Manzanares.json?sp=r&st=2024-04-01T20:34:55Z&se=2090-01-01T05:34:55Z&sv=2022-11-02&sr=b&sig=XfRnKoTEnJrhiJ7IytSs5Fd5X%2ByY9T%2B68%2B8%2FD67UAXk%3D' ) }` );

          iniciarBarcoEnMapa( 25, './assets/boats_Qubo.svg', 'Barco 25', `${ proxyUrlBoats }${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Kayak_Manzanares.json?sp=r&st=2024-04-01T20:35:11Z&se=2090-01-01T05:35:11Z&sv=2022-11-02&sr=b&sig=XiOKYdZXVtxDGp2YR8k00SmcAH29M307J47jRf39uTI%3D' ) }` );
     } );

     //! Función para Marcadores de TAXIS
     const marcadoresTaxis = {};

     function iniciarTaxiEnMapa( taxiId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresTaxis[ taxiId ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresTaxis[ taxiId ].intervaloId );
               marcadoresTaxis[ taxiId ].marker.setMap( null );
               delete marcadoresTaxis[ taxiId ];
               return; // Salir de la función
          }

          // Crear el marcador para el taxi
          const taxiMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del taxi de la API y mover el marcador
          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
          fetch( proxyUrl )
               .then( ( response ) => response.json() )
               .then( ( data ) => {
                    // Asegurarse de que los datos están en el formato esperado
                    if ( data.Coordenadas && Array.isArray( data.Coordenadas ) ) {
                         const coordenadas = data.Coordenadas.map( ( coord ) => ( {
                              lat: parseFloat( coord.lat ),
                              lng: parseFloat( coord.lng ),
                         } ) );

                         // Mover el marcador del taxi con las coordenadas obtenidas
                         const intervaloId = iniciarMovimientoMarcador(
                              taxiMarker,
                              coordenadas,
                              2000
                         );
                         marcadoresTaxis[ taxiId ] = {
                              marker: taxiMarker,
                              intervaloId: intervaloId,
                              datosTaxi: data, // Almacenar los datos del taxi aquí
                         };
                    } else {
                         console.error(
                              "Los datos del taxi no tienen el formato esperado:",
                              data
                         );
                    }
               } )
               .catch( ( error ) =>
                    console.error( "Error al obtener coordenadas del taxi:", error )
               );

          // Añadir un evento click al marcador del taxi para mostrar información
          taxiMarker.addListener( "click", function () {
               if ( !marcadoresTaxis[ taxiId ] || !marcadoresTaxis[ taxiId ].datosTaxi ) return;

               const datosTaxi = marcadoresTaxis[ taxiId ].datosTaxi;

               // Buscar si existe un infobox pinneado para este taxi
               const existingPinnedBox = document.querySelector( `.info-box.pinned[data-taxi-id="${ taxiId }"]` );
               if ( existingPinnedBox ) {
                    existingPinnedBox.classList.add( 'highlight' );
                    setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                    return;
               }

               // Buscar un infobox no pinneado o crear uno nuevo
               let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
               if ( !currentInfoBox ) {
                    currentInfoBox = document.createElement( 'div' );
                    currentInfoBox.className = 'info-box';
                    document.body.appendChild( currentInfoBox );
               }

               currentInfoBox.setAttribute( 'data-taxi-id', taxiId );
               currentInfoBox.style.display = "flex";
               currentInfoBox.innerHTML = `
        <div class="info-header">
            <img src="${ datosTaxi.ImagenURL }" alt="Taxi" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">TAXI</span>
                        <div class="badge-location nameContainer">
                            <span>Taxis para todos</span>
                            <span>Madrid, España</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn pin-btn" title="Fijar ventana">
                        <i class="action-icon">📌</i>
                    </button>
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>

        <div class="info-content">
            <div class="info-section">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-item">
                            <label>Matrícula</label>
                            <span class="plate-number">${ datosTaxi.Matricula }</span>
                        </div>
                        <div class="info-item">
                            <label>Licencia</label>
                            <span class="license-number">${ datosTaxi.Licencia }</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <label>Estado</label>
                            <span class="status-badge ${ datosTaxi.Estado.toLowerCase() }">${ datosTaxi.Estado }</span>
                        </div>
                        <div class="info-item">
                            <label>Ocupantes máx.</label>
                            <span>${ datosTaxi[ "Numero max de ocupantes" ] } personas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
               currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                    currentInfoBox.remove();
               } );


               currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                    try {
                         if ( navigator.share ) {
                              await navigator.share( {
                                   title: `Taxi - ${ datosTaxi.Matricula }`,
                                   text: `Taxi con licencia ${ datosTaxi.Licencia }`,
                                   url: window.location.href
                              } );
                         } else {
                              await navigator.clipboard.writeText( window.location.href );
                              showNotification( '¡Enlace copiado!' );
                         }
                    } catch ( error ) {
                         console.error( 'Error al compartir:', error );
                    }
               } );

               // Event listeners
               const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
               pinBtn.addEventListener( "click", ( e ) => {
                    const infoBox = e.target.closest( '.info-box' );
                    if ( infoBox.classList.contains( 'pinned' ) ) {
                         infoBox.classList.remove( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                         pinBtn.title = "Fijar ventana";
                    } else {
                         infoBox.classList.add( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                         pinBtn.title = "Desfijar ventana";
                    }
               } );
          } );
     }
     const eventTaxis = document.getElementById( "taxi-sub-nav-item" );
     eventTaxis.addEventListener( 'click', function () {
          iniciarTaxiEnMapa( 1, './assets/taxi_Qubo.svg', 'Taxi 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_1.json?sp=r&st=2024-05-05T12:59:09Z&se=2090-01-01T21:59:09Z&sv=2022-11-02&sr=b&sig=LrrbsIQ9IX%2FT3acpNYWvCsqOWGH8I%2BFQZG12GDwb%2FOI%3D' );
          iniciarTaxiEnMapa( 2, './assets/taxi_Qubo.svg', 'Taxi 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_2.json?sp=r&st=2024-05-05T12:59:33Z&se=2090-01-01T21:59:33Z&sv=2022-11-02&sr=b&sig=EStTUjjcdxuxdGK4DkjlZ0xlp5jzWHXIOK3lbkh9vyc%3D' );
          iniciarTaxiEnMapa( 3, './assets/taxi_Qubo.svg', 'Taxi 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_11.json?sp=r&st=2024-05-05T13:02:13Z&se=2090-01-01T22:02:13Z&sv=2022-11-02&sr=b&sig=ji2pBfCEDhrrhDh7cfregbvzp165AEmOc371FZQhm2Q%3D' );
          iniciarTaxiEnMapa( 4, './assets/taxi_Qubo.svg', 'Taxi 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_12.json?sp=r&st=2024-05-05T13:02:29Z&se=2090-01-01T22:02:29Z&sv=2022-11-02&sr=b&sig=3WX9L1e8V9jp7XGnuQLCjT1q7728sjtUGEB1S%2Bz9d0I%3D' );
          iniciarTaxiEnMapa( 5, './assets/taxi_Qubo.svg', 'Taxi 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_13.json?sp=r&st=2024-05-05T13:02:44Z&se=2090-01-01T22:02:44Z&sv=2022-11-02&sr=b&sig=nd7FmMn1m1LC0FDlY43tVZMIpAFZmUso%2Fu%2FwJXggQsE%3D' );
          iniciarTaxiEnMapa( 6, './assets/taxi_Qubo.svg', 'Taxi 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_16.json?sp=r&st=2024-05-15T13:32:48Z&se=2090-01-01T22:32:48Z&sv=2022-11-02&sr=b&sig=G9OSU8m1LdqEpqAUqHGQ82AbuN4fKMxJu6G4y%2FexYWs%3D' );
          iniciarTaxiEnMapa( 7, './assets/taxi_Qubo.svg', 'Taxi 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_17.json?sp=r&st=2024-05-15T13:33:23Z&se=2090-01-01T22:33:23Z&sv=2022-11-02&sr=b&sig=7QbScLbxDpVcfEvQUXhBXrN0qvGnsvACClq1wX8LHc8%3D' );
          iniciarTaxiEnMapa( 8, './assets/taxi_Qubo.svg', 'Taxi 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_18.json?sp=r&st=2024-05-15T13:33:43Z&se=2090-01-01T22:33:43Z&sv=2022-11-02&sr=b&sig=CyyWzzHKY75jXR2Rq1NHuexqyFs5rqnirru0PwOVtCU%3D' );
          iniciarTaxiEnMapa( 9, './assets/taxi_Qubo.svg', 'Taxi 9', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_19.json?sp=r&st=2024-05-15T13:34:01Z&se=2090-01-01T22:34:01Z&sv=2022-11-02&sr=b&sig=J2v6GEvfn4OSVg9QXm8IvRISXZ%2FwDVihtzLG6szeig4%3D' );
          iniciarTaxiEnMapa( 10, './assets/taxi_Qubo.svg', 'Taxi 10', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_20.json?sp=r&st=2024-05-15T13:34:20Z&se=2090-01-01T22:34:20Z&sv=2022-11-02&sr=b&sig=jJsbMNgmqLYPAsvrRbjjUnP9Ri8C%2BFA0jXy7yc9GQo4%3D' );
          iniciarTaxiEnMapa( 11, './assets/taxi_Qubo.svg', 'Taxi 11', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_21.json?sp=r&st=2024-05-15T13:34:39Z&se=2090-01-01T22:34:39Z&sv=2022-11-02&sr=b&sig=e3StfQUOWfpgLMG5ATgeupZBFDtWqoANfrQxVrcqRjM%3D' );
          iniciarTaxiEnMapa( 12, './assets/taxi_Qubo.svg', 'Taxi 12', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_22.json?sp=r&st=2024-05-15T13:34:57Z&se=2090-01-01T22:34:57Z&sv=2022-11-02&sr=b&sig=lKKeD5irdWvgQiWTyH%2FKiqbB8%2BjUjT2DWRl3YCsHqns%3D' );
          iniciarTaxiEnMapa( 13, './assets/taxi_Qubo.svg', 'Taxi 13', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_23.json?sp=r&st=2024-05-15T13:35:17Z&se=2090-01-01T22:35:17Z&sv=2022-11-02&sr=b&sig=kFe1qCr%2Fw%2F4oihwBQB%2B1GNHvgKFkozDfzWxxXBS4yvI%3D' );
          iniciarTaxiEnMapa( 14, './assets/taxi_Qubo.svg', 'Taxi 14', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Taxi/Taxi_24.json?sp=r&st=2024-05-15T13:35:34Z&se=2090-01-01T22:35:34Z&sv=2022-11-02&sr=b&sig=mXSP7BflqkYkIPNPR5tijhSoZ8bCm5wkXVbk0SzW3DA%3D' );

     } );

     //!Función para Marcadores VTC's

     function iniciarMovimientoMarcadorVTC( marker, coordinates, interval, isGeoJSON = false ) {
          let index = 0;
          const totalCoords = coordinates.length;

          const intervalId = setInterval( () => {
               if ( isGeoJSON ) {
                    // Si es GeoJSON, las coordenadas vienen en [lng, lat]
                    marker.setPosition( new google.maps.LatLng( coordinates[ index ][ 1 ], coordinates[ index ][ 0 ] ) );
               } else {
                    // Si es JSON regular, las coordenadas vienen en {lat, lng}
                    marker.setPosition( new google.maps.LatLng( coordinates[ index ].lat, coordinates[ index ].lng ) );
               }

               index++;

               if ( index >= totalCoords ) {
                    clearInterval( intervalId ); // Detener el movimiento al final de las coordenadas
               }
          }, interval );

          return intervalId;
     }

     const marcadoresVTC = {};

     function iniciarMarcadorVTC( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresVTC[ title ] ) {
               clearInterval( marcadoresVTC[ title ].intervaloId );
               marcadoresVTC[ title ].marker.setMap( null );
               delete marcadoresVTC[ title ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          const vtcMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverVTC() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         let coordenadas;
                         let datosVTC;
                         let isGeoJSON = false;

                         if ( data.features && data.features[ 0 ].geometry.coordinates ) {
                              // Formato GeoJSON
                              coordenadas = data.features[ 0 ].geometry.coordinates;
                              datosVTC = data.features[ 0 ].properties;
                              isGeoJSON = true;
                         } else if ( data.Coordenadas ) {
                              // Nuevo formato JSON
                              coordenadas = data.Coordenadas;
                              datosVTC = data;
                         } else {
                              console.error( "El formato de los datos no es válido" );
                              return;
                         }

                         const intervaloId = iniciarMovimientoMarcadorVTC( vtcMarker, coordenadas, 2000, isGeoJSON );

                         marcadoresVTC[ title ] = {
                              marker: vtcMarker,
                              intervaloId: intervaloId,
                              datosVTC: datosVTC,
                         };

                         vtcMarker.addListener( "click", function () {
                              const datosVTC = marcadoresVTC[ title ].datosVTC;

                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-vtc-id="${ title }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( 'highlight' );
                                   setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                   return;
                              }

                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( 'div' );
                                   currentInfoBox.className = 'info-box';
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( 'data-vtc-id', title );
                              currentInfoBox.style.display = "flex";
                              currentInfoBox.innerHTML = `
                                  <div class="info-header">
                                      <img src="${ datosVTC.ImagenURL || '/assets/photo-1614091199036-e934784dbf0f.avif' }" alt="VTC" class="property-image"/>
                                      <div class="header-bar">
                                          <div class="property-badges">
                                              <div class="badge-container">
                                                  <span class="badge primary">VTC</span>
                                                  <div class="badge-location nameContainer">
                                                      <span>VTC para todos</span>
                                                      <span>Madrid, España</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div class="action-buttons">
                                              <button class="action-btn pin-btn" title="Fijar ventana">
                                                  <i class="action-icon">📌</i>
                                              </button>
                                              <button class="action-btn share-btn" title="Compartir">
                                                  <i class="action-icon">📤</i>
                                              </button>
                                              <button class="action-btn close-btn" title="Cerrar">
                                                  <i class="action-icon">✕</i>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                          
                                  <div class="info-content">
                                      <div class="info-section">
                                          <div class="info-grid">
                                              <div class="info-row">
                                                  <div class="info-item">
                                                      <label>${ datosVTC.Empresa ? 'Empresa' : 'Nombre' }</label>
                                                      <span class="company-badge">${ datosVTC.Empresa || datosVTC.nombre }</span>
                                                  </div>
                                                  <div class="info-item">
                                                      <label>Estado</label>
                                                      <span class="status-badge ${ datosVTC.Estado.toLowerCase() }">${ datosVTC.Estado }</span>
                                                  </div>
                                              </div>
                                              <div class="info-row">
                                                  <div class="info-item">
                                                      <label>Matrícula</label>
                                                      <span class="plate-number">${ datosVTC.Matricula }</span>
                                                  </div>
                                                  ${ datosVTC.Licencia ? `
                                                      <div class="info-item">
                                                          <label>Licencia</label>
                                                          <span class="license-number">${ datosVTC.Licencia }</span>
                                                      </div>
                                                  ` : `
                                                      <div class="info-item">
                                                          <label>Conductor</label>
                                                          <span>${ datosVTC.Conductor }</span>
                                                      </div>
                                                  `}
                                              </div>
                                              ${ datosVTC[ "Numero max de ocupantes" ] ? `
                                                  <div class="info-row">
                                                      <div class="info-item">
                                                          <label>Ocupantes máx.</label>
                                                          <span>${ datosVTC[ "Numero max de ocupantes" ] } personas</span>
                                                      </div>
                                                  </div>
                                              ` : '' }
                                          </div>
                                      </div>
                                  </div>
                              `;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( '.info-box' );
                                   if ( infoBox.classList.contains( 'pinned' ) ) {
                                        infoBox.classList.remove( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        infoBox.classList.add( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";
                                   }
                              } );

                              currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( {
                                                  title: `VTC - ${ datosVTC.Matricula }`,
                                                  text: `VTC ${ datosVTC.Empresa || datosVTC.nombre }`,
                                                  url: window.location.href
                                             } );
                                        } else {
                                             await navigator.clipboard.writeText( window.location.href );
                                             showNotification( '¡Enlace copiado!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );
                         } );


                    } )
                    .catch( error => console.error( "Error al obtener coordenadas del VTC:", error ) );
          }

          obtenerYmoverVTC();
     }




     // Modificar el evento del botón para manejar todos los marcadores
     const eventVTC = document.getElementById( "vtc-sub-nav-item" );
     eventVTC.addEventListener( 'click', function () {

          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC MockApi 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%201.geojson?sp=r&st=2024-04-01T16:22:01Z&se=2090-01-01T01:22:01Z&sv=2022-11-02&sr=b&sig=8i9smCqqzKHcPPwhxMn%2FpLB0xts8%2B1qJi6yBASFzwlY%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC MockApi 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%202.geojson?sp=r&st=2024-04-01T16:34:25Z&se=2090-01-01T01:34:25Z&sv=2022-11-02&sr=b&sig=5u9j0ygTWCeU6SCuyHRvbBCcH8bE2%2ByrTTCoPPCgBQ8%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%203.geojson?sp=r&st=2024-04-01T16:36:07Z&se=2090-01-01T01:36:07Z&sv=2022-11-02&sr=b&sig=eN6tTU8vWB%2F%2BC7E2DqfiG87cqwGXPLgBJ5zWg9X6plE%3D' );


          // VTCs con el nuevo formato
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 11', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_11.json?sp=r&st=2024-05-05T13:12:33Z&se=2090-01-01T22:12:33Z&sv=2022-11-02&sr=b&sig=w%2FYVsXhiwaQtg1Be9yZ%2F3HVrXcywSst4NcuM6c6P9Fc%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 12', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_12.json?sp=r&st=2024-05-05T13:13:14Z&se=2090-01-01T22:13:14Z&sv=2022-11-02&sr=b&sig=GKR2K8XPg5CLgJbNFp3fXrK1myqdALzu1%2FoONe4LUbc%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 13', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_13.json?sp=r&st=2024-05-05T13:13:31Z&se=2090-01-01T22:13:31Z&sv=2022-11-02&sr=b&sig=VSkwowOd6%2Fi5SDoVYrATfMIHHRAf1Yvi6iqgg12zhM8%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 14', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_14.json?sp=r&st=2024-05-05T13:13:46Z&se=2090-01-01T22:13:46Z&sv=2022-11-02&sr=b&sig=4X4SajK%2FiUDLr7OzIWxL9VJ%2FaqE57N0riS9E9trD%2FMs%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 15', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_15.json?sp=r&st=2024-05-05T13:14:01Z&se=2090-01-01T22:14:01Z&sv=2022-11-02&sr=b&sig=8EOBHT419vcluh%2BYj8OhlpzR%2BrSeF5mKlHuzXowwC8U%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 16', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_16.json?sp=r&st=2024-05-05T13:14:17Z&se=2090-01-01T22:14:17Z&sv=2022-11-02&sr=b&sig=RZWTLUfgUFcONifaFNpVgk4yFcRtj0semoCEvWhiiNE%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 17', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_17.json?sp=r&st=2024-05-05T13:14:34Z&se=2090-01-01T22:14:34Z&sv=2022-11-02&sr=b&sig=0OGg5qCHOQ7wpJnr%2FLKDWr9MpFlnSjV%2Fq1ynPwwIyNs%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 18', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_18.json?sp=r&st=2024-05-05T13:14:48Z&se=2090-01-01T22:14:48Z&sv=2022-11-02&sr=b&sig=d4aNlpmXBYYjM5SjXzcxq5eqHoMv5KwPUlbavKp8NQs%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 19', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_19.json?sp=r&st=2024-05-05T13:15:04Z&se=2090-01-01T22:15:04Z&sv=2022-11-02&sr=b&sig=%2FelIJMkM9c%2F5hxEUePDvF2xnB%2B%2B6TTOPnPjFv1XreiY%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 20', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_20.json?sp=r&st=2024-05-05T13:15:19Z&se=2090-01-01T22:15:19Z&sv=2022-11-02&sr=b&sig=MoU91DtxmF%2FZsRILq5XQ43FlGB%2FJRpQshsTz7%2FbWhdg%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 21', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_21.json?sp=r&st=2024-05-05T13:15:35Z&se=2090-01-01T22:15:35Z&sv=2022-11-02&sr=b&sig=2gNq4Kr812ev1xFnYTckHVcn%2BUroyrmBItyoKz9h6MQ%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 22', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_22.json?sp=r&st=2024-05-05T13:15:54Z&se=2090-01-01T22:15:54Z&sv=2022-11-02&sr=b&sig=mW62af88nIVk%2FpSy3xdMwOpr4copLXBM%2FZCo4S3ezrU%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 23', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_23.json?sp=r&st=2024-05-05T13:16:09Z&se=2090-01-01T22:16:09Z&sv=2022-11-02&sr=b&sig=qAz4epH5kHVGKa6vBuOyuqdq6DfN7lcBaB5ZaViikPc%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 24', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_24.json?sp=r&st=2024-05-05T13:16:26Z&se=2090-01-01T22:16:26Z&sv=2022-11-02&sr=b&sig=uW5xgdEaGnYywvIUSkMWw0WycSMOqQjNU%2FCR%2FyQ2fOk%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 25', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_25.json?sp=r&st=2024-05-05T13:16:43Z&se=2090-01-01T22:16:43Z&sv=2022-11-02&sr=b&sig=%2F6eFUu5FvaCNsWDDxZbDPyijoNfG6Urr8s4BK5HXC7E%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 26', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_26.json?sp=r&st=2024-05-05T13:16:57Z&se=2090-01-01T22:16:57Z&sv=2022-11-02&sr=b&sig=IHhxq1zeMRyGhAeZwQOhItLHh0I%2FqJCqSzpCSHGI0sw%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 27', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_27.json?sp=r&st=2024-05-05T13:17:12Z&se=2090-01-01T22:17:12Z&sv=2022-11-02&sr=b&sig=nt24LXOsDSgmy7z098Ob2M6jVJjBgTtROundB6xx6HA%3D' );
          iniciarMarcadorVTC( './assets/vtc_Qubo.svg', 'VTC 28', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC_28.json?sp=r&st=2024-05-05T13:17:28Z&se=2090-01-01T22:17:28Z&sv=2022-11-02&sr=b&sig=bzFt3CAgETIuFjvHUwVAYhN9Krw4eAvwGkHWlWzvWCU%3D' );
     } );



     //! Función para Marcadores PARKING
     const parkingApiUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Parking/Fiware_Mobility_Parkings-00001?sp=r&st=2024-07-26T15:09:58Z&se=2090-01-01T00:09:58Z&sv=2022-11-02&sr=b&sig=KyN8JVjYWfrIjTQfkBuV%2BRy5%2Fb%2FAiBkHagJP8BPPAEg%3D"
     ) }`;

     function cargarMarcadoresParkings() {
          fetch( parkingApiUrl )
               .then( response => response.json() )
               .then( data => {
                    if ( !data || !Array.isArray( data.offstreetparking0002 ) ) {
                         console.error( "Los datos de los parkings no tienen el formato esperado:", data );
                         return;
                    }

                    data.offstreetparking0002.forEach( item => {
                         const {
                              ubicacion,
                              name,
                              id,
                              category,
                              description,
                              streetAddress,
                              addressRegion,
                              addressCountry,
                              allowedVehicleType
                         } = parseFiwareData( item );

                         if ( !ubicacion || ubicacion.length !== 2 || !name ) {
                              console.error( "Datos de ubicación o nombre no válidos:", item );
                              return;
                         }

                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/parkingsQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";

                              const totalPlazas = Math.floor( Math.random() * ( 200 - 50 + 1 ) ) + 50;
                              const plazasDisponibles = Math.floor( Math.random() * totalPlazas );
                              const ocupacionPorcentaje = Math.round( ( totalPlazas - plazasDisponibles ) / totalPlazas * 100 );

                              const allowedVehicles = allowedVehicleType
                                   ? allowedVehicleType.map( vehicle => vehicle.charAt( 0 ).toUpperCase() + vehicle.slice( 1 ) ).join( ", " )
                                   : "No disponible";

                              infoBox.innerHTML = `
    <div class="info-header">
        <img src="${ STATIC_IMAGES.parkings }" alt="Parking" class="property-image"/>
        <div class="header-bar">
            <div class="property-badges">
                <div class="badge-container">
                    <span class="badge primary">${ category }</span>
                    <div class="badge-location nameContainer">
                        <span>${ name }</span>
                        <span>${ addressRegion }</span>
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="action-btn share-btn" title="Compartir">
                    <i class="action-icon">📤</i>
                </button>
                <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                    <i class="action-icon">✕</i>
                </button>
            </div>
        </div>
    </div>

    <div class="id-row">
            <span class="id-label">ID PARKING</span>
            <span class="id-text">${ id }</span>
            <div class="copy-container">
                <button class="copy-btn">
                    <i class="copy-icon">📋</i>
                </button>
            </div>
        </div>
    
    <div class="info-content">
        


        <div class="occupancy-status">
            <label>Estado de ocupación</label>
            <div class="parking-bar-container">
                <div class="parking-bar" style="width: ${ ocupacionPorcentaje }%;">
                    <span class="parking-bar-text">${ ocupacionPorcentaje }% Ocupado</span>
                </div>
            </div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item">
                        <label>Plazas totales</label>
                        <span>${ totalPlazas }</span>
                    </div>
                    <div class="info-item">
                        <label>Plazas disponibles</label>
                        <span>${ plazasDisponibles }</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-row">
                <div class="info-item">
                    <label>Dirección</label>
                    <span>${ streetAddress }</span>
                </div>
                <div class="info-item">
                    <label>Localización</label>
                    <span>${ addressRegion }</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <label>País</label>
                    <span>${ addressCountry }</span>
                </div>
                <div class="info-item">
                    <label>Centro comercial</label>
                    <span>${ description || 'N/A' }</span>
                </div>
            </div>
        </div>

        <div class="parking-details">
            <label>Detalles del parking</label>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item">
                        <label>Tipo de parking</label>
                        <span>Subterráneo</span>
                    </div>
                    <div class="info-item">
                        <label>Horario</label>
                        <span>24/7</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <label>Altura máxima</label>
                        <span>2.10m</span>
                    </div>
                    <div class="info-item">
                        <label>Tipo de acceso</label>
                        <span>Barrera automática</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="facilities">
            <label>Servicios disponibles</label>
            <div class="facilities-grid">
                <div class="facility-item">
                    <i class="facility-icon">🎥</i>
                    <span>Vigilancia 24h</span>
                </div>
                <div class="facility-item">
                    <i class="facility-icon">💡</i>
                    <span>Bien iluminado</span>
                </div>
                <div class="facility-item">
                    <i class="facility-icon">♿</i>
                    <span>Acceso movilidad reducida</span>
                </div>
                <div class="facility-item">
                    <i class="facility-icon">🔌</i>
                    <span>Carga eléctrica</span>
                </div>
            </div>
        </div>

        <div class="vehicles-allowed">
            <label>Vehículos permitidos</label>
            <div class="vehicles-grid">
                ${ allowedVehicles.split( ", " ).map( vehicle => `
                    <span class="vehicle-tag">${ vehicle }</span>
                `).join( '' ) }
            </div>
        </div>
    </div>
`;
                              // Y después añadimos el event listener
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              }, { once: true } );
                              // Añadir el event listener para el botón de compartir
                              document.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   const shareData = {
                                        title: `Parking ${ name }`,
                                        text: `Información sobre ${ name } en ${ addressRegion }`,
                                        url: window.location.href
                                   };

                                   try {
                                        // Intentar usar Web Share API primero
                                        if ( navigator.share ) {
                                             await navigator.share( shareData );
                                        } else {
                                             // Si Web Share API no está disponible, mostrar un tooltip con el enlace copiado
                                             await navigator.clipboard.writeText( window.location.href );

                                             // Crear notificación
                                             const notification = document.createElement( 'div' );
                                             notification.style.cssText = `
                 position: fixed;
                 top: 20px;
                 right: 20px;
                 background: rgba(8, 236, 196, 0.9);
                 color: black;
                 padding: 8px 16px;
                 border-radius: 4px;
                 font-size: 14px;
                 z-index: 1000000;
                 transition: opacity 0.3s ease;
             `;
                                             notification.textContent = '¡Enlace copiado!';
                                             document.body.appendChild( notification );

                                             // Eliminar después de 2 segundos
                                             setTimeout( () => {
                                                  notification.style.opacity = '0';
                                                  setTimeout( () => notification.remove(), 300 );
                                             }, 2000 );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );
                              // Añadir event listener para el botón de copiar
                              document.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                   const idText = document.querySelector( ".id-text" ).textContent;
                                   await navigator.clipboard.writeText( idText );

                                   // Crear notificación
                                   const notification = document.createElement( 'div' );
                                   notification.style.cssText = `
         position: fixed;
         top: 20px;
         right: 20px;
         background: rgba(8, 236, 196, 0.9);
         color: black;
         padding: 8px 16px;
         border-radius: 4px;
         font-size: 14px;
         z-index: 1000000;
         transition: opacity 0.3s ease;
     `;
                                   notification.textContent = '¡ID copiado!';
                                   document.body.appendChild( notification );

                                   // Eliminar después de 2 segundos
                                   setTimeout( () => {
                                        notification.style.opacity = '0';
                                        setTimeout( () => notification.remove(), 300 );
                                   }, 2000 );
                              } );
                         } );

                         markersParkings.push( marker );
                    } );
               } )
               .catch( error => console.error( "Error al cargar los marcadores de Parkings:", error ) );
     }

     const eventParkings = document.getElementById( "parking-sub-nav-item" );
     let markersParkings = [];
     let parkingsVisible = false;

     eventParkings.addEventListener( "click", () => {
          toggleMarcadores( markersParkings, parkingsVisible );
          parkingsVisible = !parkingsVisible;

          if ( markersParkings.length === 0 && parkingsVisible ) {
               cargarMarcadoresParkings();
          }
     } );



     //! Función para Marcadores de MOTO SHARING
     const marcadoresMoto = {};

     function iniciarMarcadorMoto( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresMoto[ title ] ) {
               clearInterval( marcadoresMoto[ title ].intervaloId );
               marcadoresMoto[ title ].marker.setMap( null );
               delete marcadoresMoto[ title ];
               return;
          }

          const motoMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverMoto() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( ( response ) => response.json() )
                    .then( ( data ) => {
                         if ( !data || !Array.isArray( data.Coordenadas ) ) {
                              console.error( "Los datos de la moto no tienen el formato esperado:", data );
                              return;
                         }

                         const coordenadas = data.Coordenadas.map( ( coord ) => ( {
                              lat: parseFloat( coord.lat ),
                              lng: parseFloat( coord.lng ),
                         } ) );

                         const intervaloId = iniciarMovimientoMarcador( motoMarker, coordenadas, 2000 );

                         marcadoresMoto[ title ] = {
                              marker: motoMarker,
                              intervaloId: intervaloId,
                              datosMoto: data,
                         };
                    } )
                    .catch( ( error ) => console.error( "Error al obtener coordenadas del moto-sharing:", error ) );
          }

          obtenerYmoverMoto();

          motoMarker.addListener( "click", function () {
               const datosMoto = marcadoresMoto[ title ]?.datosMoto;

               if ( !datosMoto ) return;

               const existingPinnedBox = document.querySelector( `.info-box.pinned[data-moto-id="${ title }"]` );
               if ( existingPinnedBox ) {
                    existingPinnedBox.classList.add( 'highlight' );
                    setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                    return;
               }

               let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
               if ( !currentInfoBox ) {
                    currentInfoBox = document.createElement( 'div' );
                    currentInfoBox.className = 'info-box';
                    document.body.appendChild( currentInfoBox );
               }

               currentInfoBox.setAttribute( 'data-moto-id', title );
               currentInfoBox.style.display = "flex";
               currentInfoBox.innerHTML = `
                   <div class="info-header">
                       <img src="${ datosMoto.ImagenURL || './assets/defaultMotoImage.svg' }" alt="Moto" class="property-image"/>
                       <div class="header-bar">
                           <div class="property-badges">
                               <div class="badge-container">
                                   <span class="badge primary">MOTO</span>
                                   <div class="badge-location nameContainer">
                                       <span>${ title }</span>
                                       <span>Madrid, España</span>
                                   </div>
                               </div>
                           </div>
                           <div class="action-buttons">
                               <button class="action-btn pin-btn" title="Fijar ventana">
                                   <i class="action-icon">📌</i>
                               </button>
                               <button class="action-btn share-btn" title="Compartir">
                                   <i class="action-icon">📤</i>
                               </button>
                               <button class="action-btn close-btn" title="Cerrar">
                                   <i class="action-icon">✕</i>
                               </button>
                           </div>
                       </div>
                   </div>
           
                   <div class="info-content">
                       <div class="info-section">
                           <div class="info-grid">
                               <div class="info-row">
                                   <div class="info-item">
                                       <label>Estado</label>
                                       <span class="status-badge ${ datosMoto.Estado?.toLowerCase() }">${ datosMoto.Estado || 'No disponible' }</span>
                                   </div>
                                   <div class="info-item">
                                       <label>Batería</label>
                                       <span class="battery-badge">${ datosMoto.Bateria || 'No disponible' }</span>
                                   </div>
                               </div>
                               <div class="info-row">
                                   <div class="info-item">
                                       <label>Matrícula</label>
                                       <span class="plate-number">${ datosMoto.Matricula || 'No disponible' }</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               `;

               // Event listeners
               const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
               pinBtn.addEventListener( "click", ( e ) => {
                    const infoBox = e.target.closest( '.info-box' );
                    if ( infoBox.classList.contains( 'pinned' ) ) {
                         infoBox.classList.remove( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                         pinBtn.title = "Fijar ventana";
                    } else {
                         infoBox.classList.add( 'pinned' );
                         pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                         pinBtn.title = "Desfijar ventana";
                    }
               } );

               currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                    currentInfoBox.remove();
               } );

               currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                    try {
                         if ( navigator.share ) {
                              await navigator.share( {
                                   title: `Moto - ${ title }`,
                                   text: `Moto ${ datosMoto.Matricula || '' }`,
                                   url: window.location.href
                              } );
                         } else {
                              await navigator.clipboard.writeText( window.location.href );
                              showNotification( '¡Enlace copiado!' );
                         }
                    } catch ( error ) {
                         console.error( 'Error al compartir:', error );
                    }
               } );
          } );
     }

     //

     const eventMoto = document.getElementById( "moto-sub-nav-item" );

     eventMoto.addEventListener( "click", function () {
          const motos = [
               {
                    iconUrl: "./assets/moto_Qubo.svg",
                    title: "Moto 1",
                    apiUrl: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_1.json?sp=r&st=2024-04-12T10:12:42Z&se=2090-01-01T19:12:42Z&sv=2022-11-02&sr=b&sig=DLKdONio%2FiFtsOuh%2FNbNzmfj0CV8y8fiGTAJTIXrOAo%3D",
               },
               {
                    iconUrl: "./assets/moto_Qubo.svg",
                    title: "Moto 2",
                    apiUrl: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_2.json?sp=r&st=2024-04-12T10:13:00Z&se=2090-01-01T19:13:00Z&sv=2022-11-02&sr=b&sig=nPwp4TFqZQHiC%2BSUC%2BoKZvlAsQoWzUKWLP8dfRfWPXA%3D",
               },
               {
                    iconUrl: "./assets/moto_Qubo.svg",
                    title: "Moto 3",
                    apiUrl: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_3.json?sp=r&st=2024-04-12T10:13:18Z&se=2090-01-01T19:13:18Z&sv=2022-11-02&sr=b&sig=5fcKh4PGkoHUk2RtokH1%2F%2B4Vu1OZ5%2Bp8z2NKoteltp8%3D",
               },
               {
                    iconUrl: "./assets/moto_Qubo.svg",
                    title: "Moto 4",
                    apiUrl: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_4.json?sp=r&st=2024-04-12T10:13:35Z&se=2090-01-01T19:13:35Z&sv=2022-11-02&sr=b&sig=9d4Eui4QaFMOAOiUYCILkxcBscJJezgzLbPvGw5TWbo%3D",
               },
               {
                    iconUrl: "./assets/moto_Qubo.svg",
                    title: "Moto 5",
                    apiUrl: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_5.json?sp=r&st=2024-04-12T10:13:58Z&se=2090-01-01T19:13:58Z&sv=2022-11-02&sr=b&sig=0cu4ny5jnAbgK5LzSiRam7fDVx%2F797qf%2FCGlNQlDK54%3D",
               },
          ];

          motos.forEach( ( { iconUrl, title, apiUrl } ) => {
               iniciarMarcadorMoto( iconUrl, title, apiUrl );
          } );
     } );



     //!Función para Marcadores de SCOOTER SHARING

     const marcadoresScooter = {};
     function iniciarMarcadorScooter( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresScooter[ title ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresScooter[ title ].intervaloId );
               marcadoresScooter[ title ].marker.setMap( null );
               delete marcadoresScooter[ title ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el scooter sharing
          const scooterMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del scooter sharing de la API y mover el marcador
          function obtenerYmoverScooter() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => {
                         if ( !response.ok ) {
                              throw new Error( `Error en la respuesta de la API: ${ response.status } ${ response.statusText }` );
                         }
                         return response.json();
                    } )
                    .then( data => {
                         let coordenadas = [];

                         // Verificar si la respuesta tiene la estructura esperada
                         if ( data.Patinete && Array.isArray( data.Patinete.Ubicaciones ) ) {
                              coordenadas = data.Patinete.Ubicaciones;
                              marcadoresScooter[ title ].datosPatinete = {
                                   Estado: data.Patinete.Estado,
                                   Matricula: data.Patinete.Matricula,
                                   Velocidad: data.Patinete.Velocidad,
                                   ImagenURL: data.Patinete.ImagenURL
                              };
                         } else if ( Array.isArray( data.Coordenadas ) ) {
                              // Manejar la estructura alternativa
                              coordenadas = data.Coordenadas;
                              marcadoresScooter[ title ].datosPatinete = {
                                   Estado: null,
                                   Empresa: data.Empresa,
                                   Matricula: data.Identificador,
                                   Velocidad: null,
                                   Bateria: data.Bateria,
                                   ImagenURL: data.ImagenURL
                              };
                         } else {
                              console.error( 'Los datos del scooter no tienen el formato esperado:', data );
                              return;
                         }

                         // Mover el marcador del scooter sharing con las coordenadas obtenidas
                         marcadoresScooter[ title ].intervaloId = iniciarMovimientoMarcador( scooterMarker, coordenadas, 2000 );

                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del scooter sharing:', error ) );
          }

          // Iniciar el proceso de mover el scooter sharing
          obtenerYmoverScooter();

          // Almacenar el marcador y su intervalo en el objeto marcadoresScooter
          marcadoresScooter[ title ] = {
               marker: scooterMarker,
               intervaloId: null, // Aquí deberías almacenar el ID del intervalo si estás usando setInterval para mover el marcador
               datosPatinete: null // Almacenar los datos del patinete aquí
          };

          // Añadir un evento click al marcador del scooter sharing para mostrar información
          // Añadir un evento click al marcador del scooter sharing para mostrar información
scooterMarker.addListener("click", function() {
     const datosPatinete = marcadoresScooter[title].datosPatinete;
 
     const existingPinnedBox = document.querySelector(`.info-box.pinned[data-scooter-id="${title}"]`);
     if (existingPinnedBox) {
         existingPinnedBox.classList.add('highlight');
         setTimeout(() => existingPinnedBox.classList.remove('highlight'), 1000);
         return;
     }
 
     let currentInfoBox = document.querySelector(".info-box:not(.pinned)");
     if (!currentInfoBox) {
         currentInfoBox = document.createElement('div');
         currentInfoBox.className = 'info-box';
         document.body.appendChild(currentInfoBox);
     }
 
     currentInfoBox.setAttribute('data-scooter-id', title);
     currentInfoBox.style.display = "flex";
     currentInfoBox.innerHTML = `
         <div class="info-header">
             <img src="${datosPatinete.ImagenURL}" alt="Scooter" class="property-image"/>
             <div class="header-bar">
                 <div class="property-badges">
                     <div class="badge-container">
                         <span class="badge primary">SCOOTER</span>
                         <div class="badge-location nameContainer">
                             <span>${datosPatinete.Empresa || title}</span>
                             <span>Madrid, España</span>
                         </div>
                     </div>
                 </div>
                 <div class="action-buttons">
                     <button class="action-btn pin-btn" title="Fijar ventana">
                         <i class="action-icon">📌</i>
                     </button>
                     <button class="action-btn share-btn" title="Compartir">
                         <i class="action-icon">📤</i>
                     </button>
                     <button class="action-btn close-btn" title="Cerrar">
                         <i class="action-icon">✕</i>
                     </button>
                 </div>
             </div>
         </div>
 
         <div class="info-content">
             <div class="info-section">
                 <div class="info-grid">
                     <div class="info-row">
                         <div class="info-item">
                             <label>ID</label>
                             <div class="id-value-container">
                                 <div class="id-wrapper">
                                     <span title="${datosPatinete.Matricula || datosPatinete.Identificador}">${datosPatinete.Matricula || datosPatinete.Identificador}</span>
                                     <button class="copy-btn" title="Copiar ID">
                                         <i class="copy-icon">📋</i>
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
 
                     <div class="info-row">
                         <div class="info-item">
                             <label>Estado</label>
                             <div class="status-badge ${datosPatinete.Estado?.toLowerCase() || 'activo'}">
                                 ${datosPatinete.Estado || 'Activo'}
                             </div>
                         </div>
                         ${datosPatinete.Velocidad ? `
                         <div class="info-item">
                             <label>Velocidad</label>
                             <span class="speed-badge">${datosPatinete.Velocidad} km/h</span>
                         </div>
                         ` : ''}
                     </div>
 
                     ${datosPatinete.Bateria ? `
                     <div class="info-row">
                         <div class="info-item">
                             <label>Batería</label>
                             <div class="status-indicator">
                                 <span class="battery-badge">${datosPatinete.Bateria}%</span>
                             </div>
                         </div>
                     </div>
                     ` : ''}
                 </div>
             </div>
         </div>
     `;
 
     // Event listeners
     const pinBtn = currentInfoBox.querySelector(".pin-btn");
     pinBtn.addEventListener("click", (e) => {
         const infoBox = e.target.closest(".info-box");
         if (infoBox.classList.contains("pinned")) {
             infoBox.classList.remove("pinned");
             pinBtn.innerHTML = '<i class="action-icon">📌</i>';
             pinBtn.title = "Fijar ventana";
         } else {
             infoBox.classList.add("pinned");
             pinBtn.innerHTML = '<i class="action-icon">📍</i>';
             pinBtn.title = "Desfijar ventana";
 
             // Crear nuevo infobox para futuras propiedades
             const newInfoBox = document.createElement("div");
             newInfoBox.className = "info-box";
             newInfoBox.style.display = "none";
             document.body.appendChild(newInfoBox);
         }
     });
 
     currentInfoBox.querySelector(".share-btn").addEventListener("click", async () => {
         try {
             const baseUrl = window.location.origin + window.location.pathname;
             const shareUrl = `${baseUrl}?view=scooter&id=${datosPatinete.Matricula || datosPatinete.Identificador}`;
 
             const shareData = {
                 title: `${datosPatinete.Empresa || title} - Scooter`,
                 text: `🛴 ID: ${datosPatinete.Matricula || datosPatinete.Identificador}\n` +
                       `📍 Madrid, España\n` +
                       `🔋 Batería: ${datosPatinete.Bateria}%\n` +
                       `⚡ Velocidad: ${datosPatinete.Velocidad || 0} km/h`,
                 url: shareUrl
             };
 
             if (navigator.share && navigator.canShare(shareData)) {
                 await navigator.share(shareData);
             } else {
                 const shareText = `${shareData.title}\n\n${shareData.text}\n\n🔗 Ver detalles: ${shareUrl}`;
                 await navigator.clipboard.writeText(shareText);
                 showNotification('¡Información copiada al portapapeles!');
             }
         } catch (error) {
             console.error('Error al compartir:', error);
         }
     });
 
     currentInfoBox.querySelector(".close-btn").addEventListener("click", () => {
         currentInfoBox.remove();
     });
 
     currentInfoBox.querySelector(".copy-btn").addEventListener("click", async () => {
         try {
             await navigator.clipboard.writeText(datosPatinete.Matricula || datosPatinete.Identificador);
             showNotification("¡ID copiado!");
         } catch (error) {
             console.error("Error al copiar:", error);
         }
     });
 
     inicializarArrastre(currentInfoBox);
     currentInfoBox.style.display = "flex";
 });
     }

     // Modificar el evento del botón para manejar todos los marcadores de scooter sharing
     const eventScooter = document.getElementById( "scooter-sub-nav-item" );
     eventScooter.addEventListener( 'click', function () {
          // Ejemplo de cómo llamar a la función genérica para cada scooter sharing
          const scooter1IconUrl = "./assets/scooter_Qubo.svg";
          const scooter1Title = "Scooter 1";
          const scooter1ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete%201.json?sp=r&st=2024-04-02T18:46:13Z&se=2090-01-01T03:46:13Z&sv=2022-11-02&sr=b&sig=iJYpyJ7YRjKj6tO%2ByPKPnVBcU5Gx8tMsRf2quj%2Bb65c%3D";
          iniciarMarcadorScooter( scooter1IconUrl, scooter1Title, scooter1ApiUrl );

          const scooter2IconUrl = "./assets/scooter_Qubo.svg";
          const scooter2Title = "Scooter 2";
          const scooter2ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete%202.json?sp=r&st=2024-04-02T18:44:39Z&se=2090-03-04T03:44:39Z&sv=2022-11-02&sr=b&sig=OhEK47pToAk%2BtSb7amjpp29pgTBCggASO0jlXaGqCBw%3D";
          iniciarMarcadorScooter( scooter2IconUrl, scooter2Title, scooter2ApiUrl );

          const scooter3IconUrl = "./assets/scooter_Qubo.svg";
          const scooter3Title = "Scooter 3";
          const scooter3ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_3.json?sp=r&st=2024-05-05T13:21:01Z&se=2090-01-01T22:21:01Z&sv=2022-11-02&sr=b&sig=alL60BQer3B8YdID5t4N1dP0h6om96NNgmGR5%2BsCRyY%3D";
          iniciarMarcadorScooter( scooter3IconUrl, scooter3Title, scooter3ApiUrl );

          const scooter4IconUrl = "./assets/scooter_Qubo.svg";
          const scooter4Title = "Scooter 4";
          const scooter4ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_4.json?sp=r&st=2024-05-05T13:21:31Z&se=2090-01-01T22:21:31Z&sv=2022-11-02&sr=b&sig=6h5LeGguXBgp8ypVNZiQbZRuAhMSN3eP%2Bm6PSKk8zVA%3D";
          iniciarMarcadorScooter( scooter4IconUrl, scooter4Title, scooter4ApiUrl );

          const scooter5IconUrl = "./assets/scooter_Qubo.svg";
          const scooter5Title = "Scooter 5";
          const scooter5ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_5.json?sp=r&st=2024-05-05T13:21:46Z&se=2090-01-01T22:21:46Z&sv=2022-11-02&sr=b&sig=mGEu9tVGmfZR87fsK6U3sjgUF2LAYi6Ubg2IyFcgnic%3D";
          iniciarMarcadorScooter( scooter5IconUrl, scooter5Title, scooter5ApiUrl );

          const scooter6IconUrl = "./assets/scooter_Qubo.svg";
          const scooter6Title = "Scooter 6";
          const scooter6ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_6.json?sp=r&st=2024-05-05T13:22:50Z&se=2090-01-01T22:22:50Z&sv=2022-11-02&sr=b&sig=6%2BK%2Bv39ZAtcv0vpzwRdbpw6xxvQuc4kAg50j8%2F%2F3Fdg%3D";
          iniciarMarcadorScooter( scooter6IconUrl, scooter6Title, scooter6ApiUrl );

          const scooter7IconUrl = "./assets/scooter_Qubo.svg";
          const scooter7Title = "Scooter 7";
          const scooter7ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_7.json?sp=r&st=2024-05-05T13:23:04Z&se=2090-01-01T22:23:04Z&sv=2022-11-02&sr=b&sig=4y4FEY5OAyAcz08kKFCgcHiv2de9JvyCi2fs7S%2FcoQw%3D";
          iniciarMarcadorScooter( scooter7IconUrl, scooter7Title, scooter7ApiUrl );

          const scooter8IconUrl = "./assets/scooter_Qubo.svg";
          const scooter8Title = "Scooter 8";
          const scooter8ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_8.json?sp=r&st=2024-05-05T13:23:20Z&se=2090-01-01T22:23:20Z&sv=2022-11-02&sr=b&sig=YZfNemn44pc6R%2FVdivzGWkmbfOz921HsG9RT5TpS1Ys%3D";
          iniciarMarcadorScooter( scooter8IconUrl, scooter8Title, scooter8ApiUrl );

          const scooter9IconUrl = "./assets/scooter_Qubo.svg";
          const scooter9Title = "Scooter 9";
          const scooter9ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_9.json?sp=r&st=2024-05-05T13:23:39Z&se=2090-01-01T22:23:39Z&sv=2022-11-02&sr=b&sig=VREUYjbRrv2fxQVEIGAdiCyyJ1QUvfzBblQ2Qw7FQkY%3D";
          iniciarMarcadorScooter( scooter9IconUrl, scooter9Title, scooter9ApiUrl );

          const scooter10IconUrl = "./assets/scooter_Qubo.svg";
          const scooter10Title = "Scooter 10";
          const scooter10ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_10.json?sp=r&st=2024-05-05T13:23:56Z&se=2090-01-01T22:23:56Z&sv=2022-11-02&sr=b&sig=nheovrlc6DLi6idxYddVvrHUmaAbEuf6knC4tOzA0hw%3D";
          iniciarMarcadorScooter( scooter10IconUrl, scooter10Title, scooter10ApiUrl );

          const scooter11IconUrl = "./assets/scooter_Qubo.svg";
          const scooter11Title = "Scooter 11";
          const scooter11ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_11.json?sp=r&st=2024-05-05T13:24:11Z&se=2090-01-01T22:24:11Z&sv=2022-11-02&sr=b&sig=RV%2F1Uz%2FWkvR7hXBxHsynoyoGMK6XUDkdPnZHyD5515Y%3D";
          iniciarMarcadorScooter( scooter11IconUrl, scooter11Title, scooter11ApiUrl );

          const scooter12IconUrl = "./assets/scooter_Qubo.svg";
          const scooter12Title = "Scooter 12";
          const scooter12ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_12.json?sp=r&st=2024-05-05T13:24:26Z&se=2090-01-01T22:24:26Z&sv=2022-11-02&sr=b&sig=ROVYZd%2BW%2B74757kuOGCnX8Ql4IurRqLwjJCwYBUyfLs%3D";
          iniciarMarcadorScooter( scooter12IconUrl, scooter12Title, scooter12ApiUrl );

          const scooter13IconUrl = "./assets/scooter_Qubo.svg";
          const scooter13Title = "Scooter 13";
          const scooter13ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_13.json?sp=r&st=2024-05-05T13:24:44Z&se=2090-01-01T22:24:44Z&sv=2022-11-02&sr=b&sig=UypbKG7FEtovLgdU8Hpm6rgi%2Bu4h8%2B2t%2B6VvYMUe2ZI%3D";
          iniciarMarcadorScooter( scooter13IconUrl, scooter13Title, scooter13ApiUrl );

          const scooter14IconUrl = "./assets/scooter_Qubo.svg";
          const scooter14Title = "Scooter 14";
          const scooter14ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_14.json?sp=r&st=2024-05-05T13:25:00Z&se=2090-01-01T22:25:00Z&sv=2022-11-02&sr=b&sig=kNh4ET8M3DxkJD6UD2bqrcz4T0Snme%2B1e8u7tsUZNAs%3D";
          iniciarMarcadorScooter( scooter14IconUrl, scooter14Title, scooter14ApiUrl );

          const scooter15IconUrl = "./assets/scooter_Qubo.svg";
          const scooter15Title = "Scooter 15";
          const scooter15ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_15.json?sp=r&st=2024-05-05T13:25:17Z&se=2090-01-01T22:25:17Z&sv=2022-11-02&sr=b&sig=ljAZRBwNLEPI6jaSof%2BpVK02qKmqVHwRLAZUicWZWVE%3D";
          iniciarMarcadorScooter( scooter15IconUrl, scooter15Title, scooter15ApiUrl );

          const scooter16IconUrl = "./assets/scooter_Qubo.svg";
          const scooter16Title = "Scooter 16";
          const scooter16ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_16.json?sp=r&st=2024-05-05T13:25:35Z&se=2090-01-01T22:25:35Z&sv=2022-11-02&sr=b&sig=ZRQbVPnMl2VDV9TJkM02Xi5lbL48Mq78Eb7h44YSviQ%3D";
          iniciarMarcadorScooter( scooter16IconUrl, scooter16Title, scooter16ApiUrl );

          const scooter17IconUrl = "./assets/scooter_Qubo.svg";
          const scooter17Title = "Scooter 17";
          const scooter17ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_17.json?sp=r&st=2024-05-05T13:25:50Z&se=2090-01-01T22:25:50Z&sv=2022-11-02&sr=b&sig=ZPGP3i%2F3Lf9MgMiomojCoLo0yKJg%2FWUJw7Z9IF1GgsM%3D";
          iniciarMarcadorScooter( scooter17IconUrl, scooter17Title, scooter17ApiUrl );

          const scooter18IconUrl = "./assets/scooter_Qubo.svg";
          const scooter18Title = "Scooter 18";
          const scooter18ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_18.json?sp=r&st=2024-05-05T13:26:04Z&se=2090-01-01T22:26:04Z&sv=2022-11-02&sr=b&sig=njC1UyUC9RXBTgpVSWCsIP8ao%2BUYbs%2F7inw5dku2t3k%3D";
          iniciarMarcadorScooter( scooter18IconUrl, scooter18Title, scooter18ApiUrl );

          const scooter19IconUrl = "./assets/scooter_Qubo.svg";
          const scooter19Title = "Scooter 19";
          const scooter19ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_19.json?sp=r&st=2024-05-05T13:26:18Z&se=2090-01-01T22:26:18Z&sv=2022-11-02&sr=b&sig=TM6qndkOSnvQLOjY4mMgLCR2TSyKn7g0NWhQ%2BtDb7q4%3D";
          iniciarMarcadorScooter( scooter19IconUrl, scooter19Title, scooter19ApiUrl );

          const scooter20IconUrl = "./assets/scooter_Qubo.svg";
          const scooter20Title = "Scooter 20";
          const scooter20ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Scooter%20Sharing/Patinete_20.json?sp=r&st=2024-05-05T13:26:32Z&se=2090-01-01T22:26:32Z&sv=2022-11-02&sr=b&sig=cpoUSAjRDUxR7PdRyNlbqYyznpvhU%2BGlRwBiz1X1N2I%3D";
          iniciarMarcadorScooter( scooter20IconUrl, scooter20Title, scooter20ApiUrl );

     } );



     //! Función para Marcadores de BUS

     // Declarar los objetos en el ámbito global
     const marcadoresAutobus = {};
     const marcadoresParadasBus = [];
     const marcadoresRutas = {}; // Añadido

     // Función para iniciar el movimiento de los marcadores
     function iniciarMovimientoMarcador( marker, coordinates, interval, updateInfoBox ) {
          let index = 0;
          const totalCoords = coordinates.length;

          return setInterval( () => {
               marker.setPosition( coordinates[ index ] );
               if ( updateInfoBox ) {
                    updateInfoBox( index ); // Actualiza el infobox con los datos de la coordenada actual
               }
               index++;
               if ( index >= totalCoords ) {
                    clearInterval( marcadoresAutobus[ marker.title ].intervaloId ); // Detener el intervalo al final de las coordenadas
               }
          }, interval );
     }

     // Función para iniciar el marcador del autobús
     function iniciarMarcadorAutobus( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresAutobus[ title ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresAutobus[ title ].intervaloId );
               marcadoresAutobus[ title ].marker.setMap( null );
               delete marcadoresAutobus[ title ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el autobús
          const autobusMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del autobús de la API y mover el marcador
          function obtenerYmoverAutobus() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas;

                              // Mover el marcador del autobús con las coordenadas obtenidas
                              const intervaloId = iniciarMovimientoMarcador( autobusMarker, coordenadas, 2000 );

                              // Almacenar los datos del autobús en el objeto marcadoresAutobus
                              marcadoresAutobus[ title ] = {
                                   marker: autobusMarker,
                                   intervaloId: intervaloId,
                                   datosAutobus: data
                              };
                         } else {
                              console.error( 'Los datos del autobús no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del autobús:', error ) );
          }

          // Iniciar el proceso de mover el autobús
          obtenerYmoverAutobus();

          // Añadir un evento click al marcador del autobús para mostrar información
          autobusMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosAutobus = marcadoresAutobus[ title ].datosAutobus;

               // Asegúrate de que los datos del autobús se muestren correctamente en el infobox
               // Aquí puedes ajustar el contenido del infobox según los datos disponibles
               infoBox.innerHTML = `
                    <div>${ title }</div>
                    <img src="${ datosAutobus.ImagenURL }" alt="Autobús Image">
                    <p>Matrícula: <span>${ datosAutobus.Matricula }</span> </p>
                    <p>Estado: <span>${ datosAutobus.Estado }</span> </p>
                    <p>Línea: <span>${ datosAutobus.Linea }</span> </p>
                    <button id="cerrar-info-box">
                         <img src="./assets/botonCerrar.svg" alt="Cerrar">
                    </button>
               `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }

     // Función para iniciar el marcador del autobús de Madrid
     let busMadridMarker = null;
     let intervaloBusMadrid = null;
     const iniciarMarcadorBusMadrid = () => {
          const coordenadasBusMadrid = [
               { lat: 40.398023246143225, lng: -3.6693980478134045 },
               { lat: 40.39807524388112, lng: -3.6695649493293825 },
               { lat: 40.398257235647556, lng: -3.6696446068710995 },
               { lat: 40.3984594481444, lng: -3.669648400087372 },
               { lat: 40.398595219051465, lng: -3.6698456473335286 },
               { lat: 40.39876198932964, lng: -3.6701514897006673 },
               { lat: 40.39894749534988, lng: -3.670494319603924 },
               { lat: 40.39929789421567, lng: -3.671225088608234 },
               { lat: 40.3994353050378, lng: -3.671613027709288 },
               { lat: 40.39967577330164, lng: -3.6719648794521045 },
               { lat: 40.39988875876088, lng: -3.6724610806278704 },
               { lat: 40.400156707252556, lng: -3.6729572818036367 },
               { lat: 40.40049335897396, lng: -3.6735707668936755 },
               { lat: 40.40071321225068, lng: -3.6740308807112037 },
               { lat: 40.400953675949964, lng: -3.6744819726891733 },
               { lat: 40.40118726843539, lng: -3.67482480259243 },
               { lat: 40.40150330403731, lng: -3.674716540517717 },
               { lat: 40.40177811639822, lng: -3.674500016368292 },
               { lat: 40.40209414922632, lng: -3.674202295662832 },
               { lat: 40.40241705080091, lng: -3.6739496841551698 },
               { lat: 40.4026437680022, lng: -3.6736790289683876 },
               { lat: 40.402966666940415, lng: -3.673453482979403 },
               { lat: 40.40328269418866, lng: -3.673119674915706 },
               { lat: 40.403481928087466, lng: -3.6729302162009065 },
               { lat: 40.403797952916655, lng: -3.6726505391745654 },
               { lat: 40.404075749463395, lng: -3.672425197327665 },
               { lat: 40.40434535644289, lng: -3.672189162940187 },
               { lat: 40.40461496234252, lng: -3.671942399716915 },
               { lat: 40.40490090681361, lng: -3.671717094165232 },
               { lat: 40.4051705104881, lng: -3.67147033094196 },
               { lat: 40.405448282841434, lng: -3.6711699235397157 },
               { lat: 40.405701544870396, lng: -3.6709446179880327 },
               { lat: 40.40597931503224, lng: -3.670740770107938 },
               { lat: 40.40620806606953, lng: -3.6705583798994326 },
               { lat: 40.406428646690635, lng: -3.670472549213078 },
               { lat: 40.40660020889616, lng: -3.67033307434775 },
               { lat: 40.40684529700258, lng: -3.670290159004572 },
               { lat: 40.407000519008385, lng: -3.6703116166761607 },
               { lat: 40.407245605726644, lng: -3.6702687013014095 },
               { lat: 40.40756421703578, lng: -3.6702472436298206 },
               { lat: 40.40798902976846, lng: -3.6702365147940266 },
               { lat: 40.408356654007505, lng: -3.6701828706150548 },
               { lat: 40.408699768152225, lng: -3.6701292264360816 },
               { lat: 40.40909189646142, lng: -3.6701506841076705 },
               { lat: 40.40931246763132, lng: -3.670118497600287 },
               { lat: 40.40963106915601, lng: -3.670097039928699 },
               { lat: 40.40990083698188, lng: -3.6700534529011253 },
               { lat: 40.41005196506304, lng: -3.6700602192807956 },
               { lat: 40.410290678045286, lng: -3.6700444310615667 },
               { lat: 40.41043321848704, lng: -3.6700173655428885 },
               { lat: 40.41056030248175, lng: -3.6699993218637696 },
               { lat: 40.41069940766032, lng: -3.6699857891044307 },
               { lat: 40.41084194723633, lng: -3.6699790227247617 },
               { lat: 40.4109604437625, lng: -3.669967745425312 },
               { lat: 40.41106348405046, lng: -3.669960979045642 },
               { lat: 40.41123693486195, lng: -3.669945190823849 },
               { lat: 40.411346844045234, lng: -3.66992489168484 },
               { lat: 40.411499686204856, lng: -3.669911358925501 },
               { lat: 40.4118895180064, lng: -3.6698888043266025 },
               { lat: 40.412121355251266, lng: -3.6698685051836364 },
               { lat: 40.41240471077519, lng: -3.6698865488627552 },
               { lat: 40.412643415411836, lng: -3.6698436951248485 },
               { lat: 40.41285464254962, lng: -3.6698301623655087 },
               { lat: 40.4130280887551, lng: -3.669769264940067 },
               { lat: 40.41320668633295, lng: -3.6697670094801773 },
               { lat: 40.4135707491583, lng: -3.669733177581829 },
               { lat: 40.41378025611774, lng: -3.66972190028238 },
               { lat: 40.413927940959454, lng: -3.669710622982931 },
               { lat: 40.41413057777292, lng: -3.6697083675230413 },
               { lat: 40.4143400830027, lng: -3.669688068379574 },
               { lat: 40.414558173805496, lng: -3.669654236481226 },
               { lat: 40.41490849142142, lng: -3.669613638200979 },
               { lat: 40.41512142868233, lng: -3.669618149120759 },
               { lat: 40.41542022661578, lng: -3.6695955945242575 },
               { lat: 40.4156142728324, lng: -3.66955950716602 },
               { lat: 40.41587357265538, lng: -3.6695662735456898 },
               { lat: 40.41613974032377, lng: -3.6695211643459418 },
               { lat: 40.416345804880514, lng: -3.6695143979662728 },
               { lat: 40.41663772860667, lng: -3.669496354283754 },
               { lat: 40.4168798526039, lng: -3.669485076984305 },
               { lat: 40.41724046119728, lng: -3.669455756005737 },
               { lat: 40.41763884558672, lng: -3.669428690487059 },
               { lat: 40.41798743001846, lng: -3.6693768149018444 },
               { lat: 40.418253589309295, lng: -3.6693768149018444 },
               { lat: 40.41845964739198, lng: -3.6693520048430557 },
               { lat: 40.41862792769134, lng: -3.6693339611639373 },
               { lat: 40.4188391360428, lng: -3.6693339611639373 },
               { lat: 40.41905206086419, lng: -3.6692865965062507 },
               { lat: 40.41922720821222, lng: -3.6692843410442983 },
               { lat: 40.41948477698946, lng: -3.669268552825069 },
               { lat: 40.419677094366776, lng: -3.669279830124519 },
               { lat: 40.41981618069888, lng: -3.6692617864453996 },
               { lat: 40.42009263540858, lng: -3.669200889026869 },
               { lat: 40.42036565476896, lng: -3.669207655406538 },
               { lat: 40.4207468497732, lng: -3.6691422470670574 },
               { lat: 40.421006129815474, lng: -3.669126458847829 },
               { lat: 40.42133580896636, lng: -3.6691151815507768 },
               { lat: 40.421631145157654, lng: -3.669090371491989 },
               { lat: 40.42198657712408, lng: -3.6690475177540813 },
               { lat: 40.42220120903644, lng: -3.669027218615073 },
               { lat: 40.422625319695314, lng: -3.668993386715164 },
               { lat: 40.42282449624162, lng: -3.6689888757953844 },
               { lat: 40.423006501880316, lng: -3.668982109415715 },
               { lat: 40.42329578231394, lng: -3.6689593559425373 },
               { lat: 40.42355505253197, lng: -3.6689368013436385 },
               { lat: 40.42378169852644, lng: -3.6689029694452904 },
               { lat: 40.424039249877346, lng: -3.668884925763552 },
               { lat: 40.42430023422875, lng: -3.6688556047849845 },
               { lat: 40.424652218110914, lng: -3.6688398165651983 },
               { lat: 40.42494925672438, lng: -3.668801473747071 },
               { lat: 40.42534416153525, lng: -3.6687901964458947 },
               { lat: 40.42560170689216, lng: -3.6687563645475465 },
               { lat: 40.4259863061371, lng: -3.668720277187581 },
               { lat: 40.42629707444456, lng: -3.668699978048573 },
               { lat: 40.42662672765432, lng: -3.6686819343694537 },
               { lat: 40.42695809619887, lng: -3.6686661461473267 },
               { lat: 40.427212201526736, lng: -3.668630058789089 },
               { lat: 40.42750579500067, lng: -3.668634569708869 },
               { lat: 40.42772899387248, lng: -3.6687766636896773 },
               { lat: 40.42783029157203, lng: -3.668984165999543 },
               { lat: 40.42804147103602, lng: -3.669180391014307 },
               { lat: 40.42825780052633, lng: -3.669191668313757 },
               { lat: 40.428610317155325, lng: -3.6693892567208257 },
               { lat: 40.42880604221157, lng: -3.6695696935120132 },
               { lat: 40.42896056159048, lng: -3.6696959992658447 },
               { lat: 40.42913739999956, lng: -3.6698516259982443 },
               { lat: 40.42960714218146, lng: -3.670258266296766 },
               { lat: 40.429724540198904, lng: -3.670354825826141 },
               { lat: 40.429801104007936, lng: -3.6703977411693187 },
               { lat: 40.42991952252757, lng: -3.6705331927212232 },
               { lat: 40.430060399465724, lng: -3.670651209920231 },
               { lat: 40.43018085921769, lng: -3.670739722815535 },
               { lat: 40.43030540212421, lng: -3.6708470111734797 },
               { lat: 40.43045750749839, lng: -3.670970392790518 },
               { lat: 40.43053407047295, lng: -3.671036106909759 },
               { lat: 40.430626966765054, lng: -3.6711192553871657 },
               { lat: 40.43076988389395, lng: -3.671250683631746 },
               { lat: 40.430889321541414, lng: -3.671331149900204 },
               { lat: 40.43103121727894, lng: -3.67146123703968 },
               { lat: 40.43112921703471, lng: -3.671517563427601 },
               { lat: 40.431281320544244, lng: -3.671650332775761 },
               { lat: 40.43139769480553, lng: -3.6717562800292303 },
               { lat: 40.431582464057996, lng: -3.6718836849607848 },
               { lat: 40.431681483832094, lng: -3.6719587868113464 },
               { lat: 40.431849919201255, lng: -3.672098261683402 },
               { lat: 40.43194587612868, lng: -3.6721840923697564 },
               { lat: 40.43204081210296, lng: -3.672264558638215 },
               { lat: 40.43219699680809, lng: -3.672386599153597 },
               { lat: 40.432248037480534, lng: -3.6725233918099756 },
               { lat: 40.43225722479746, lng: -3.6727124875408523 },
               { lat: 40.43227355780223, lng: -3.6729458397193815 }
          ];
          const busMadridIcon = "./assets/bus_Qubo.svg";

          // Si el marcador ya existe, detener movimiento y quitar del mapa
          if ( busMadridMarker ) {
               clearInterval( intervaloBusMadrid );
               busMadridMarker.setMap( null );
               busMadridMarker = null;
               return;
          }
          busMadridMarker = new google.maps.Marker( {
               position: coordenadasBusMadrid[ 0 ],
               map: map,
               title: "Bus Madrid",
               icon: busMadridIcon,
          } );
          intervaloBusMadrid = iniciarMovimientoMarcador( busMadridMarker, coordenadasBusMadrid, 2000 );

          busMadridMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               infoBox.innerHTML = `
                    <div>Información Autobús Madrid</div>
                    <button id="cerrar-info-box">
                         <img src="./assets/botonCerrar.svg" alt="">
                    </button>
                    `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     };

     // Función para iniciar los marcadores de paradas de autobús
     function iniciarMarcadoresParadasBus() {
          if ( marcadoresParadasBus.length > 0 ) {
               toggleMarcadoresParadasBus( false );
               marcadoresParadasBus.length = 0; // Eliminar todos los marcadores
               return;
          }

          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/Fiware_Mobility_Bus-00001?sp=r&st=2024-07-26T14:51:30Z&se=2089-12-31T23:51:30Z&sv=2022-11-02&sr=b&sig=eHtTxA7TYtGCSrPkSrGqyCsi7viqFfMjPywNvVsJSdM%3D' ) }`;

          fetch( proxyUrl )
               .then( response => response.json() )
               .then( data => {
                    data.publictransportstop0001.slice( 0, 200 ).forEach( item => {
                         const parsedData = parseFiwareData( item );
                         const { ubicacion, name, description, streetAddress, addressRegion, addressCountry, type } = parsedData;

                         const paradaMarker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: './assets/stopBusQubo.svg' // Asegúrate de tener un icono para las paradas de autobús
                         } );

                         marcadoresParadasBus.push( paradaMarker );

                         // Añadir un evento click al marcador de la parada para mostrar información
                         paradaMarker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                                   <div class='nameContainer'>
                                        <p>${ type }</p>
                                        <strong>${ name }</strong>
                                   </div>
                                   <img src='${ STATIC_IMAGES.bus }'>
                                   <p>Dirección: <span>${ streetAddress }, ${ addressRegion } ${ addressCountry }</span> </p>
                                   <p> <span>${ description }</span> </p>
                                   <button id="cerrar-info-box">
                                        <img src="./assets/botonCerrar.svg" alt="Cerrar">
                                   </button>
                                   `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                                   infoBox.style.display = "none";
                              } );
                         } );
                    } );
               } )
               .catch( error => console.error( 'Error al obtener paradas de autobús:', error ) );
     }

     // Función para manejar la visibilidad de los marcadores de paradas de autobús
     function toggleMarcadoresParadasBus( visible ) {
          marcadoresParadasBus.forEach( marker => marker.setMap( visible ? map : null ) );
     }

     // Función para manejar rutas de autobús adicionales
     function manejarMarcadorRuta( apiUrl, iconUrl ) {
          const rutaId = apiUrl; // Usamos la URL como identificador único para el marcador

          // Verificar si el marcador ya existe
          if ( marcadoresRutas[ rutaId ] ) {
               // Si existe, detener cualquier intervalo y eliminar el marcador
               clearInterval( marcadoresRutas[ rutaId ].intervaloId );
               marcadoresRutas[ rutaId ].marker.setMap( null );
               delete marcadoresRutas[ rutaId ];
          } else {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               // Si no existe, crear un nuevo marcador
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         const coordenadas = data.coordenadas.map( coord => ( {
                              lat: coord.latitude,
                              lng: coord.longitude
                         } ) );

                         const marker = new google.maps.Marker( {
                              position: coordenadas[ 0 ], // Iniciar en la primera coordenada
                              map: map,
                              title: data.nombre_ruta,
                              icon: iconUrl
                         } );

                         // Guardar el marcador y los datos en el objeto global
                         marcadoresRutas[ rutaId ] = {
                              marker: marker,
                              intervaloId: iniciarMovimientoMarcador( marker, coordenadas, 2000 ),
                              datosRuta: data
                         };


                         // Objeto para mapear características a iconos
const caracteristicasIconos = {
     // Conectividad
    'Conexión WiFi 5G': '📶',
    'WiFi gratuito': '📶',
    
    // Carga y energía
    'Puertos de carga rápida USB-C': '🔌',
    'Puertos USB': '🔌',
    
    // Aire y climatización
    'Sistema de purificación de aire': '🌬️',
    'Aire acondicionado': '❄️',
    
    // Seguridad y monitoreo
    'Monitoreo con cámaras HD': '📹',
    'Vigilancia por CCTV': '📹',
    
    // Sistemas de información
    'Sistema de billete electrónico': '🎫',
    'Pantallas informativas internas': '📺',
    
    // Espacio y accesibilidad
    'Espacio ampliado para bicicletas': '🚲',
    
    // Por defecto para cualquier característica nueva
    'default': '🚌'
 };
 
 // Evento click para mostrar información detallada
 marker.addListener("click", function() {
     const existingPinnedBox = document.querySelector(`.info-box.pinned[data-bus-id="${data.matricula_autobus}"]`);
     if (existingPinnedBox) {
         existingPinnedBox.classList.add('highlight');
         setTimeout(() => existingPinnedBox.classList.remove('highlight'), 1000);
         return;
     }
 
     let currentInfoBox = document.querySelector(".info-box:not(.pinned)");
     if (!currentInfoBox) {
         currentInfoBox = document.createElement('div');
         currentInfoBox.className = 'info-box';
         document.body.appendChild(currentInfoBox);
     }
 
     currentInfoBox.setAttribute('data-bus-id', data.matricula_autobus);
     currentInfoBox.style.display = "flex";
     currentInfoBox.innerHTML = `
         <div class="info-header">
             <img src="${data.imagen_autobus}" alt="Bus" class="property-image"/>
             <div class="header-bar">
                 <div class="property-badges">
                     <div class="badge-container">
                         <span class="badge primary">LÍNEA ${data.nombre_ruta}</span>
                         <div class="badge-location nameContainer">
                            
                             <span>${data.operador}</span>
                         </div>
                     </div>
                 </div>
                 <div class="action-buttons">
                     <button class="action-btn pin-btn" title="Fijar ventana">
                         <i class="action-icon">📌</i>
                     </button>
                     <button class="action-btn share-btn" title="Compartir">
                         <i class="action-icon">📤</i>
                     </button>
                     <button class="action-btn close-btn" title="Cerrar">
                         <i class="action-icon">✕</i>
                     </button>
                 </div>
             </div>
         </div>
 
         <div class="info-content">
             <div class="info-section">
                 <div class="info-grid">
                     <div class="info-row">
                         <div class="info-item">
                             <label>Matrícula</label>
                             <span>${data.matricula_autobus}</span>
                         </div>
                         <div class="info-item">
                             <label>Año</label>
                             <span>${data.año_fabricacion}</span>
                         </div>
                     </div>
                     <div class="info-row">
                         <div class="info-item">
                             <label>Capacidad</label>
                             <span>${data.capacidad} pasajeros</span>
                         </div>
                         <div class="info-item">
                             <label>Frecuencia</label>
                             <span>${data.frecuencia_servicio}</span>
                         </div>
                     </div>
                     <div class="info-row">
                         <div class="info-item">
                             <label>Accesibilidad</label>
                             <span>${data.accesibilidad}</span>
                         </div>
                     </div>
                 </div>
             </div>
 
             <div class="info-section">
                 <label class="section-label">Características</label>
                 <div class="features-grid">
                     ${data.caracteristicas.map(caracteristica => {
                         const icono = caracteristicasIconos[caracteristica] || caracteristicasIconos['default'];
    return `
        <div class="feature-item">
            <i class="feature-icon">${icono}</i>
            <span>${caracteristica}</span>
        </div>
    `;
                     }).join('')}
                 </div>
             </div>
         </div>
     `;
 
     // Event listeners
     const pinBtn = currentInfoBox.querySelector(".pin-btn");
     pinBtn.addEventListener("click", (e) => {
         const infoBox = e.target.closest(".info-box");
         if (infoBox.classList.contains("pinned")) {
             infoBox.classList.remove("pinned");
             pinBtn.innerHTML = '<i class="action-icon">📌</i>';
             pinBtn.title = "Fijar ventana";
         } else {
             infoBox.classList.add("pinned");
             pinBtn.innerHTML = '<i class="action-icon">📍</i>';
             pinBtn.title = "Desfijar ventana";
 
             // Crear nuevo infobox para futuras propiedades
             const newInfoBox = document.createElement("div");
             newInfoBox.className = "info-box";
             newInfoBox.style.display = "none";
             document.body.appendChild(newInfoBox);
         }
     });
 
     currentInfoBox.querySelector(".share-btn").addEventListener("click", async () => {
         try {
             const baseUrl = window.location.origin + window.location.pathname;
             const shareUrl = `${baseUrl}?view=bus&id=${data.matricula_autobus}`;
 
             const shareData = {
                 title: `${data.nombre_ruta} - ${data.operador}`,
                 text: `🚌 Línea: ${data.nombre_ruta}\n` +
                       `📍 ${data.operador}\n` +
                       `🔢 Matrícula: ${data.matricula_autobus}\n` +
                       `👥 Capacidad: ${data.capacidad} pasajeros\n` +
                       `⏱️ Frecuencia: ${data.frecuencia_servicio}`,
                 url: shareUrl
             };
 
             if (navigator.share && navigator.canShare(shareData)) {
                 await navigator.share(shareData);
             } else {
                 const shareText = `${shareData.title}\n\n${shareData.text}\n\n🔗 Ver detalles: ${shareUrl}`;
                 await navigator.clipboard.writeText(shareText);
                 showNotification('¡Información copiada al portapapeles!');
             }
         } catch (error) {
             console.error('Error al compartir:', error);
         }
     });
 
     currentInfoBox.querySelector(".close-btn").addEventListener("click", () => {
         currentInfoBox.remove();
     });
 
     inicializarArrastre(currentInfoBox);
     currentInfoBox.style.display = "flex";
 });
                    } )
                    .catch( error => console.error( 'Error al cargar datos del autobús:', error ) );
          }
     }

     // Modificar el evento del botón para manejar todos los marcadores de autobús y las paradas
     const eventAutobus = document.getElementById( "bus-sub-nav-item" );
     eventAutobus.addEventListener( 'click', function () {
          iniciarMarcadorBusMadrid();

          // Llamar a la función genérica para cada autobús
          const autobus1IconUrl = "./assets/bus_Qubo.svg"; // Asegúrate de tener un icono de autobús
          const autobus1Title = "Autobús 1";
          const autobus1ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/AUTOBUS.json?sp=r&st=2024-04-12T10:10:23Z&se=2090-01-01T19:10:23Z&sv=2022-11-02&sr=b&sig=wVH5LplrNY%2B2ffDs75Rm91ofVL7JGQY7xFuxu1bBbPE%3D";
          iniciarMarcadorAutobus( autobus1IconUrl, autobus1Title, autobus1ApiUrl );

          // Manejar rutas de autobús adicionales
          manejarMarcadorRuta( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/L%C3%ADnea1Moncloa_a_%20AravacaMadrid.json?sp=r&st=2024-04-14T15:35:22Z&se=2090-01-01T00:35:22Z&sv=2022-11-02&sr=b&sig=dOLRCF5YyUOHUjJmCAExmaYwgfN%2FHdeekdpxoUgrYOE%3D", "./assets/bus_Qubo.svg" );
          manejarMarcadorRuta( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/L%C3%ADnea2%20Arganzuela_Circular.json?sp=r&st=2024-04-14T16:30:04Z&se=2090-01-01T01:30:04Z&sv=2022-11-02&sr=b&sig=Cfyck1fAxiLPVThrKq0H6w7R6LbMd732bqLwEncFGwQ%3D", "./assets/bus_Qubo.svg" );

          manejarMarcadorRuta( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/Ruta7Ciudad_Universitaria_a_Opera.json?sp=r&st=2024-04-14T16:46:53Z&se=2090-01-01T01:46:53Z&sv=2022-11-02&sr=b&sig=8cd%2FYH9xBTjXWxBC5mQCKpmDN%2FtCixIvoptowWejMdg%3D", "./assets/bus_Qubo.svg" );

          iniciarMarcadoresParadasBus();
          toggleMarcadoresParadasBus( true );
     } );


     //! Función para Marcadores AIRPLANE

     const marcadoresAviones = {};

     function iniciarAvionEnMapa( avionId, iconUrl, title, apiUrl ) {
          const defaultImageUrl = './assets/defaultAirplaneImage.png';

          // Verificar si el marcador ya existe
          if ( marcadoresAviones[ avionId ] ) {
               clearInterval( marcadoresAviones[ avionId ].intervaloId );
               marcadoresAviones[ avionId ].marker.setMap( null );
               delete marcadoresAviones[ avionId ];
               return;
          }

          // Crear el marcador para el avión
          const avionMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverAvion() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.locationUpdates && Array.isArray( data.locationUpdates ) ) {
                              const coordenadas = data.locationUpdates.map( coord => ( {
                                   lat: coord.location.value.lat,
                                   lng: coord.location.value.lng,
                                   speed: coord.speed.value,
                                   status: coord.status.value
                              } ) );

                              const intervaloId = iniciarMovimientoMarcadorConVelocidadYEstado( avionMarker, coordenadas, 2000, avionId );
                              marcadoresAviones[ avionId ] = {
                                   marker: avionMarker,
                                   intervaloId: intervaloId,
                                   datosAvion: data,
                              };

                              const imagenUrl = data[ "Imagen URL" ] || defaultImageUrl;

                              // Listener para abrir el infobox
                              avionMarker.addListener( "click", function () {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                                   <div class='nameContainer'>
                                        <p>PLane</p>
                                        <p></p>
                                   </div>
                                        <img src="${ imagenUrl }" alt="Avión" onerror="this.src='${ defaultImageUrl }'"/>
                                        <p>Modelo: <span>${ data.model.value }</span> </p>
                                        <p>Matrícula: <span>${ data.registrationNumber.value }</span> </p>
                                        <p>ID Aerolínea: <span>${ data.airline.object }</span> </p>
                                        <p>Capacidad: <span>${ data.capacity.value }</span> </p>
                                        <p id="velocidad-info-${ avionId }">Velocidad: <span>${ coordenadas[ 0 ].speed } KNT</span> </p>
                                             <p id="status-info-${ avionId }">Estado: <span>${ coordenadas[ 0 ].status }</span> </p>
                                        <button id="cerrar-info-box">
                                             <img src="./assets/botonCerrar.svg" alt="Cerrar">
                                        </button>
                                   `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                                        infoBox.style.display = "none";
                                   } );
                              } );
                         } else {
                              console.error( 'Los datos del avión no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del avión:', error ) );
          }

          obtenerYmoverAvion();
     }

     function iniciarMovimientoMarcadorConVelocidadYEstado( marker, coordenadas, delay, avionId ) {
          let index = 0;

          // Iniciar intervalo de movimiento
          const intervaloId = setInterval( () => {
               if ( index >= coordenadas.length ) {
                    clearInterval( intervaloId );
                    marcadoresAviones[ avionId ].intervaloId = null;
                    return;
               }

               const nextPosition = new google.maps.LatLng( coordenadas[ index ].lat, coordenadas[ index ].lng );
               marker.setPosition( nextPosition );

               // Actualizar la información en el infobox si está abierto
               const infoBox = document.querySelector( ".info-box" );
               if ( infoBox.style.display === "flex" ) {
                    document.getElementById( `velocidad-info-${ avionId }` ).textContent = `Velocidad: ${ coordenadas[ index ].speed } KNT`;
                    document.getElementById( `status-info-${ avionId }` ).textContent = `Estado: ${ coordenadas[ index ].status }`;
               }

               index++;
          }, delay );

          // Guardar el ID de intervalo en el objeto de marcadores
          if ( !marcadoresAviones[ avionId ] ) {
               marcadoresAviones[ avionId ] = {};
          }
          marcadoresAviones[ avionId ].intervaloId = intervaloId;
     }

     // Añadir el evento para el botón del avión
     const eventAirplane = document.querySelector( ".airplane-sub-nav-item" );
     eventAirplane.addEventListener( 'click', function () {
          iniciarAvionEnMapa(
               'ryanair001',
               './assets/airplaneQubo.svg',
               'Ryanair Boeing 737',
               'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Airplanes/fiware_ryanair_boeing_737_corrected.json?sp=r&st=2024-10-23T18:12:42Z&se=2099-10-24T02:12:42Z&sv=2022-11-02&sr=b&sig=yVq5tGcz0c8YXoFu%2FvwtFHtgL%2FFBUt2t%2B6Jt6yUm0kw%3D'
          );
     } );


     //! Función para Marcadores de HELICOPTER
     const marcadoresHelicopteros = {};

     function iniciarHelicopteroEnMapa( helicopteroId, iconUrl, title, apiUrl ) {
          const defaultImageUrl = './assets/defaultHelicopterImage.png';

          // Verificar si el marcador ya existe
          if ( marcadoresHelicopteros[ helicopteroId ] ) {
               clearInterval( marcadoresHelicopteros[ helicopteroId ].intervaloId );
               marcadoresHelicopteros[ helicopteroId ].marker.setMap( null );
               delete marcadoresHelicopteros[ helicopteroId ];
               return;
          }

          // Crear el marcador para el helicóptero
          const helicopteroMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverHelicoptero() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.locationUpdates && Array.isArray( data.locationUpdates ) ) {
                              const coordenadas = data.locationUpdates.map( coord => ( {
                                   lat: coord.location.value.lat,
                                   lng: coord.location.value.lng,
                                   speed: coord.speed.value,
                                   status: data.status.value // Estado actual del helicóptero
                              } ) );

                              const intervaloId = iniciarMovimientoMarcadorConVelocidadYEstado( helicopteroMarker, coordenadas, 2000, helicopteroId );
                              marcadoresHelicopteros[ helicopteroId ] = {
                                   marker: helicopteroMarker,
                                   intervaloId: intervaloId,
                                   datosHelicoptero: data,
                              };

                              const imagenUrl = data[ "Imagen URL" ] || defaultImageUrl;

                              helicopteroMarker.addListener( "click", function () {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                                   <div class='nameContainer'>
                                        <p>Helicopter</p>
                                        <p></p>
                                   </div>
                                   <img src="${ imagenUrl }" alt="Helicóptero" onerror="this.src='${ defaultImageUrl }'"/>
                                   <p>Modelo: <span>${ data.model.value }</span> </p>
                                   <p>Matrícula: <span>${ data.registrationNumber.value }</span> </p>
                                   <p>Propietario: <span>${ data.owner.object }</span> </p>
                                   <p>Capacidad: <span>${ data.capacity.value }</span> </p>
                                   <p id="velocidad-info-${ helicopteroId }">Velocidad: <span>${ coordenadas[ 0 ].speed } KNT</span> </p>
                                   <p id="status-info-${ helicopteroId }">Estado: <span>${ coordenadas[ 0 ].status }</span> </p>
                                   <button id="cerrar-info-box">
                                        <img src="./assets/botonCerrar.svg" alt="Cerrar">
                                   </button>
                              `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                                        infoBox.style.display = "none";
                                   } );
                              } );
                         } else {
                              console.error( 'Los datos del helicóptero no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del helicóptero:', error ) );
          }

          obtenerYmoverHelicoptero();
     }

     function iniciarMovimientoMarcadorConVelocidadYEstado( marker, coordenadas, delay, helicopteroId ) {
          let index = 0;

          return setInterval( () => {
               if ( index >= coordenadas.length ) {
                    clearInterval( marcadoresHelicopteros[ helicopteroId ].intervaloId );
                    return;
               }

               const nextPosition = new google.maps.LatLng( coordenadas[ index ].lat, coordenadas[ index ].lng );
               marker.setPosition( nextPosition );

               // Actualizar la información en el infobox si está abierto
               const infoBox = document.querySelector( ".info-box" );
               if ( infoBox.style.display === "flex" ) {
                    document.getElementById( `velocidad-info-${ helicopteroId }` ).textContent = `Velocidad: ${ coordenadas[ index ].speed } KNT`;
                    document.getElementById( `status-info-${ helicopteroId }` ).textContent = `Estado: ${ coordenadas[ index ].status }`;
               }

               index++;
          }, delay );
     }

     // Añadir el evento para el botón del helicóptero
     const eventHelicopter = document.querySelector( ".helicopter-sub-nav-item" );
     eventHelicopter.addEventListener( 'click', function () {
          iniciarHelicopteroEnMapa(
               'samur001',
               './assets/helicopterQubo.svg',
               'Helicóptero SAMUR',
               'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Helicopters/fiware_helicopter_samur.json?sp=r&st=2024-10-27T11:24:57Z&se=2099-10-27T19:24:57Z&sv=2022-11-02&sr=b&sig=8lA%2FgwiHeqDNh8ICAeaaWyokcuwxAp2GmWzXeBNmr%2F0%3D'
          );

          iniciarHelicopteroEnMapa(
               'dgt001',
               './assets/helicopterQubo.svg',
               'Helicóptero DGT Pegasus',
               'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Helicopters/fiware_helicopter_dgt_pegasus.json?sp=r&st=2024-10-27T11:46:04Z&se=2099-10-27T19:46:04Z&sv=2022-11-02&sr=b&sig=gUeO0XYrB4Mz%2F4CDzEzKQJwtQkMpg%2FtNp0Dxbq%2B4vk4%3D'
          );
     } );

     //! Función para Marcadores de POLICE
     const marcadoresPolicia = {};
     let policeDirectMarker = null; // Marcador directo de policía
     let intervaloDirecto = null; // Intervalo del movimiento del marcador directo
     function iniciarMarcadorPolicia( policeId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresPolicia[ policeId ] ) {
               clearInterval( marcadoresPolicia[ policeId ].intervaloId );
               marcadoresPolicia[ policeId ].marker.setMap( null );
               delete marcadoresPolicia[ policeId ];
               return;
          }

          // Crear el marcador para la policía
          const policiaMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas de la policía de la API y mover el marcador
          function obtenerYmoverPolicia() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas.map( coord => ( {
                                   lat: coord.lat,
                                   lng: coord.lng
                              } ) );
                              const intervaloId = iniciarMovimientoMarcador( policiaMarker, coordenadas, 2000 );
                              marcadoresPolicia[ policeId ] = {
                                   marker: policiaMarker,
                                   intervaloId: intervaloId,
                                   datosPolicia: data
                              };
                         } else {
                              console.error( 'Los datos de la policía no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => {
                         console.error( 'Error al obtener coordenadas de la policía:', error );
                    } );
          }

          obtenerYmoverPolicia();

          policiaMarker.addListener( "click", function () {
               if ( !marcadoresPolicia[ policeId ] || !marcadoresPolicia[ policeId ].datosPolicia ) return;
               const datosPolicia = marcadoresPolicia[ policeId ].datosPolicia;
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               let additionalInfo = "";

               if ( policeId === 3 || policeId === 4 || policeId === 5 || policeId === 6 || policeId === 7 || policeId === 8 || policeId === 9 || policeId === 10 || policeId === 11 ) {
                    additionalInfo = `
                <p>Flota: <span>${ datosPolicia[ "Flota" ] }</span> </p>
                <p>Dirección General o Servicio de Adscripción: <span>${ datosPolicia[ "Direccion General o Servicio de Adscripcion" ] }</span> </p>
                <p>Tipo de Uso: <span>${ datosPolicia[ "Tipo de Uso" ] }</span> </p>
                <p>Tipo Vehículo: <span>${ datosPolicia[ "Tipo Vehiculo" ] }</span> </p>
                <p>Relación Contractual: <span>${ datosPolicia[ "Relacion Contractual" ] }</span> </p>
                <p>Energía/Combustible: <span>${ datosPolicia[ "Energia/Combustible" ] }</span> </p>
                <p>Categoría Eléctrico: <span>${ datosPolicia[ "Categoria Electrico" ] }</span> </p>
                <p>Distintivo: <span>${ datosPolicia[ "Distintivo" ] }</span> </p>
                <p>Clase Industria: <span>${ datosPolicia[ "Clase Industria" ] }</span> </p>
                <p>Categoría Homologación UE: <span>${ datosPolicia[ "Categ Homologacion UE" ] }</span> </p>
            `;
               }


               infoBox.innerHTML = `
            <div class='nameContainer'>
               <p>${ title }</p>
            </div>
            <img src="${ datosPolicia.ImagenURL }" alt="Policía Image">
            <p>Estado: <span>${ datosPolicia.Estado }</span> </p>
            <p>Matrícula: <span>${ datosPolicia.Matricula }</span> </p>
            <p>Indicativo: <span>${ datosPolicia.Indicativo }</span> </p>
            ${ additionalInfo }
            <button id="cerrar-info-box">
                <img src="./assets/botonCerrar.svg" alt="Cerrar">
            </button>
        `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }

     const eventPolicia = document.getElementById( "police-sub-nav-item" );
     eventPolicia.addEventListener( 'click', function () {
          // iniciarPoliciaEnMapa();
          iniciarMarcadorPolicia( 1, './assets/digitalTwinPolice.svg', 'Policía Municipal', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/POLICIA%20MUNICIPAL.json?sp=r&st=2024-04-12T10:18:27Z&se=2090-01-01T19:18:27Z&sv=2022-11-02&sr=b&sig=bjiUeiUu6249e2GARkN5s5px2Wnb53AdJrQbKiicVBs%3D' );

          iniciarMarcadorPolicia( 2, './assets/digitalTwinPolice.svg', 'Policía Nacional', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/POLICIA%20NACIONAL.json?sp=r&st=2024-04-12T10:18:55Z&se=2090-01-01T19:18:55Z&sv=2022-11-02&sr=b&sig=QUuR3BqwWc8PlqyosuDQAL8k6k%2Bh5mhqEPt7ME7ephI%3D' );
          iniciarMarcadorPolicia( 3, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%202.json?sp=r&st=2024-04-13T10:38:40Z&se=2090-01-01T19:38:40Z&sv=2022-11-02&sr=b&sig=Ljgo16hG8iUtiHBJqHBpYHTDDUZZv9RF9i04ztjaVfs%3D' );
          iniciarMarcadorPolicia( 4, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%203.json?sp=r&st=2024-04-13T10:38:57Z&se=2090-01-01T19:38:57Z&sv=2022-11-02&sr=b&sig=IP3pcipwSvq1cMNLpjr1W%2FBZjCPd5glP7H874%2FfhPWE%3D' );
          iniciarMarcadorPolicia( 5, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%204.json?sp=r&st=2024-04-13T10:39:21Z&se=2090-01-01T19:39:21Z&sv=2022-11-02&sr=b&sig=jcbi9boBRMtPhMAocaQJfUYnuaVl9Gh4IQRKIS3rMWc%3D' );
          iniciarMarcadorPolicia( 6, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%205.json?sp=r&st=2024-04-13T10:39:38Z&se=2090-01-01T19:39:38Z&sv=2022-11-02&sr=b&sig=DIL5gs%2FZSxUVi3HkT9cgmcrufxNu6iispaF07JrYYAw%3D' );
          iniciarMarcadorPolicia( 7, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%206.json?sp=r&st=2024-04-13T11:58:01Z&se=2090-01-01T20:58:01Z&sv=2022-11-02&sr=b&sig=F%2BxKmZOci%2BQ5Q6QQoXUqp9snuyAH0XCZ8RlzQxyEVbM%3D' );
          iniciarMarcadorPolicia( 8, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%207.json?sp=r&st=2024-04-13T11:57:25Z&se=2090-01-01T20:57:25Z&sv=2022-11-02&sr=b&sig=M4VdMbgUpm9SWnkZcKU4Qjg1wRwQRh5jW21pLvnysMM%3D' );
          iniciarMarcadorPolicia( 9, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%208.json?sp=r&st=2024-04-13T11:58:27Z&se=2090-01-01T20:58:27Z&sv=2022-11-02&sr=b&sig=wl0B5fWxbJLJJejTWsNXXivpjecPXAzJw%2BhvnOjIFDk%3D' );
          iniciarMarcadorPolicia( 10, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%209.json?sp=r&st=2024-04-13T12:02:51Z&se=2090-01-01T21:02:51Z&sv=2022-11-02&sr=b&sig=CiaYAd3FyHedPAx9WB3C6f8beIllF%2FJNSpbFeQetKXw%3D' );
          iniciarMarcadorPolicia( 11, './assets/digitalTwinPolice.svg', 'Vehículo Policía Municipal 9', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Vehiculo%20Policia%20Municipal%2010.json?sp=r&st=2024-04-13T12:03:55Z&se=2090-01-01T21:03:55Z&sv=2022-11-02&sr=b&sig=Ycfix07DscFJARyiPtY0NJCTzVFSe3TZXwjWpV7fh5g%3D' );

     } );


     //! Función para Marcadores de AMBULANCIAS
     const marcadoresAmbulancias = {};

     function iniciarAmbulanciaEnMapa( ambulanciaId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresAmbulancias[ ambulanciaId ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresAmbulancias[ ambulanciaId ].intervaloId );
               marcadoresAmbulancias[ ambulanciaId ].marker.setMap( null );
               delete marcadoresAmbulancias[ ambulanciaId ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para la ambulancia
          const ambulanciaMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas de la ambulancia de la API y mover el marcador
          function obtenerYmoverAmbulancia() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.Coordenadas && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas.map( coord => ( {
                                   lat: parseFloat( coord.lat ),
                                   lng: parseFloat( coord.lng )
                              } ) );

                              // Mover el marcador de la ambulancia con las coordenadas obtenidas
                              const intervaloId = iniciarMovimientoMarcador( ambulanciaMarker, coordenadas, 2000 );
                              marcadoresAmbulancias[ ambulanciaId ] = {
                                   marker: ambulanciaMarker,
                                   intervaloId: intervaloId,
                                   datosAmbulancia: data // Almacenar los datos de la ambulancia aquí
                              };
                         } else {
                              console.error( 'Los datos de la ambulancia no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas de la ambulancia:', error ) );
          }

          // Iniciar el proceso de mover la ambulancia
          obtenerYmoverAmbulancia();

          // Añadir un evento click al marcador de la ambulancia para mostrar información
          ambulanciaMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosAmbulancia = marcadoresAmbulancias[ ambulanciaId ].datosAmbulancia;
               infoBox.innerHTML = `
                    <div class='nameContainer'>
                              <p>Ambulances/p>
                              <p></p>
                              </div>
               <img src="${ datosAmbulancia.ImagenURL }" alt="Imagen de la Ambulancia"/>
               <p>Estado: <span>${ datosAmbulancia.Estado }</span> </p>
               <p>Conductor/a: <span>${ datosAmbulancia[ 'Conductor/a' ] }</span> </p>
               <p>Médico: <span>${ datosAmbulancia.Medico }</span> </p>
               <p>Enfermero/a: <span>${ datosAmbulancia[ 'Enfermero/a' ] }</span> </p>
               <p>Indicativo: <span>${ datosAmbulancia.Indicativo }</span> </p>
               <p>Matrícula: <span>${ datosAmbulancia.Matricula }</span> </p>
               <button id="cerrar-info-box">
                    <img src="./assets/botonCerrar.svg" alt="Cerrar">
               </button>
               `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }

     const eventAmbulances = document.getElementById( "ambulances-nav-item" );
     eventAmbulances.addEventListener( 'click', function () {
          iniciarAmbulanciaEnMapa( 1, './assets/iconAmbulance.svg', 'Ambulancia 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_1.json?sp=r&st=2024-05-15T13:38:11Z&se=2090-01-01T22:38:11Z&sv=2022-11-02&sr=b&sig=6lwanxDEAwY9wVUSWjlw8ak72ars%2BchxPwfDA1vS5dg%3D' );
          iniciarAmbulanciaEnMapa( 2, './assets/iconAmbulance.svg', 'Ambulancia 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_2.json?sp=r&st=2024-05-15T13:38:28Z&se=2090-01-01T22:38:28Z&sv=2022-11-02&sr=b&sig=ojIS0334XGUHTtHjMIM27sT297AK9%2BViEO65kx4qt3w%3D' );
          iniciarAmbulanciaEnMapa( 3, './assets/iconAmbulance.svg', 'Ambulancia 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_4.json?sp=r&st=2024-05-15T13:38:47Z&se=2090-01-01T22:38:47Z&sv=2022-11-02&sr=b&sig=dCd1xrw2TDJVDat2jZ12VxpFCmbbJScmtOFJb7ABVyU%3D' );
          iniciarAmbulanciaEnMapa( 4, './assets/iconAmbulance.svg', 'Ambulancia 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_5.json?sp=r&st=2024-05-15T13:39:08Z&se=2090-01-01T22:39:08Z&sv=2022-11-02&sr=b&sig=E9Z6B2ivjf4iHIMEUeq5xtGktoC9sHca05AaFMdguNI%3D' );
          iniciarAmbulanciaEnMapa( 5, './assets/iconAmbulance.svg', 'Ambulancia 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_6.json?sp=r&st=2024-05-15T13:39:24Z&se=2090-01-01T22:39:24Z&sv=2022-11-02&sr=b&sig=rAMAQiJy4eL9W3oY7GtZz8DXu6mmxCk9b9q07SgehbI%3D' );
          iniciarAmbulanciaEnMapa( 6, './assets/iconAmbulance.svg', 'Ambulancia 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_7.json?sp=r&st=2024-05-15T13:39:41Z&se=2090-01-01T22:39:41Z&sv=2022-11-02&sr=b&sig=YB8e5ljNo2iHxWTp6I04cFuQDWTQJUfg30wk7KmrJ7Y%3D' );
          iniciarAmbulanciaEnMapa( 7, './assets/iconAmbulance.svg', 'Ambulancia 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_8.json?sp=r&st=2024-05-15T13:40:02Z&se=2090-01-01T22:40:02Z&sv=2022-11-02&sr=b&sig=iAzH99oYloWOtEgbpsy%2BN21W%2BAtiG4fOZmR1baVwm%2Fo%3D' );
          iniciarAmbulanciaEnMapa( 8, './assets/iconAmbulance.svg', 'Ambulancia 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Ambulances/Ambulacia_9.json?sp=r&st=2024-05-15T13:40:30Z&se=2090-01-01T22:40:30Z&sv=2022-11-02&sr=b&sig=hwj%2BYpXvwghLay9BqfB6bEuK4DyJ4Ivt8XFoHAIPvJ4%3D' );
     } );

     //? ------------------------------------------------------------- //?
     //* FUNCIÓN GENÉRICA PARA MOVER MARCADORES

     function iniciarMovimientoMarcador( marcador, coordenadas, intervalo ) {
          let indice = 0;
          const moverMarcador = () => {
               if ( indice < coordenadas.length ) {
                    marcador.setPosition( new google.maps.LatLng( coordenadas[ indice ].lat, coordenadas[ indice ].lng ) );
                    indice++;
               } else {
                    clearInterval( intervaloId ); // Detiene el movimiento cuando se llega al final del array
               }
          };

          // Iniciar el movimiento del marcador cada 'intervalo' milisegundos
          const intervaloId = setInterval( moverMarcador, intervalo );
          return intervaloId; // Devuelve el ID del intervalo para poder detenerlo más tarde si es necesario
     };


     //* FUNCIÓN PARA SHIPS LOGISTICS*//
     // Variables globales solo para ships
     let kmzLayerTrayectoShips = null;
     const marcadoresShips = {};

     // Función para el KMZ de Ships
     function toggleKMZLayerTrayectoShips() {
          if ( kmzLayerTrayectoShips ) {
               kmzLayerTrayectoShips.setMap( kmzLayerTrayectoShips.getMap() ? null : map );
          } else {
               kmzLayerTrayectoShips = new google.maps.KmlLayer( {
                    url: "https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Ships/modified_tang_ale_minimal_change.kmz?sp=r&st=2024-08-25T11:06:21Z&se=2090-01-01T20:06:21Z&sv=2022-11-02&sr=b&sig=ee8VNVuRSEOfVPuzSCiLcOZGS8tPCQaTkjhlbW6Hs2w%3D",
                    map: map
               } );
          }
     }

     // Función para mover el marcador del barco
     function iniciarMovimientoMarcadorShip( marker, coordinates, interval, updateInfoBox ) {
          let index = 0;
          const totalCoords = coordinates.length;

          const intervalId = setInterval( () => {
               marker.setPosition( new google.maps.LatLng( coordinates[ index ].lat, coordinates[ index ].lng ) );
               if ( updateInfoBox ) {
                    updateInfoBox( index );
               }

               index++;
               if ( index >= totalCoords ) {
                    clearInterval( intervalId );
               }
          }, interval );

          return intervalId;
     }

     function iniciarShipsEnMapa( shipsId, iconUrl, title, apiUrl ) {
          if ( marcadoresShips[ shipsId ] ) {
               clearInterval( marcadoresShips[ shipsId ].intervaloId );
               marcadoresShips[ shipsId ].marker.setMap( null );
               delete marcadoresShips[ shipsId ];
               return;
          }

          const shipsMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );
          function obtenerYmoverShips() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.location.coordinates && Array.isArray( data.location.coordinates ) ) {
                              const coordenadas = data.location.coordinates.map( coord => ( {
                                   lat: parseFloat( coord.lat ),
                                   lng: parseFloat( coord.lng )
                              } ) );

                              // PRIMER PASO: Crear el HTML inicial una sola vez
                              shipsMarker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box-ships" );
                                   if ( infoBox ) {
                                        // Solo creamos el HTML si no existe
                                        if ( !infoBox.querySelector( '.nameContainer' ) ) {
                                             infoBox.innerHTML = `
                                           <div class='nameContainer'>
                                               <p>Ship Information</p>
                                           </div>
                                           <img src="${ data.ImagenURL }" alt="Imagen del Ship"/>
                                           <p>Tipo: <span>${ data.type }</span></p>
                                           <p>Name: <span>${ data.name }</span></p>
                                           <p>Model: <span>${ data.model }</span></p>
                                           <p>Manufacturer: <span>${ data.manufacturer }</span></p>
                                           <p>Owner: <span>${ data.owner.name } (${ data.owner.contact })</span></p>
                                           <p>Speed: <span id="speedValue">0 knots</span></p>
                                           <p>Fuel Consumption: <span id="fuelValue">0 L/100km</span></p>
                                           <p>Cumm. CO2 Emissions: <span id="co2Value">0 kg</span></p>
                                           <p><strong>Destination:</strong> <span>${ data.destination }</span></p>
                                           <p><strong>Heading:</strong> <span>${ data.heading }</span></p>
                                           <button id="cerrar-info-box-ships">
                                               <img src="./assets/botonCerrar.svg" alt="Cerrar">
                                           </button>
                                       `;

                                             // Configurar el botón de cerrar
                                             document.getElementById( "cerrar-info-box-ships" ).addEventListener( "click", () => {
                                                  infoBox.style.display = "none";
                                             } );

                                             // Inicializar el arrastre
                                             inicializarArrastre( infoBox );
                                        }
                                        infoBox.style.display = "flex";
                                   }
                              } );

                              // SEGUNDO PASO: Función que solo actualiza los valores dinámicos
                              function actualizarInfoBox( index ) {
                                   const infoBox = document.querySelector( ".info-box-ships" );
                                   if ( !infoBox || infoBox.style.display !== "flex" ) return;

                                   const coord = data.location.coordinates[ index ];

                                   // Solo actualizar los valores que cambian
                                   const speedElement = document.getElementById( "speedValue" );
                                   const fuelElement = document.getElementById( "fuelValue" );
                                   const co2Element = document.getElementById( "co2Value" );

                                   if ( speedElement ) speedElement.textContent = `${ coord.speed } knots`;
                                   if ( fuelElement ) fuelElement.textContent = `${ coord.fuelConsumption } L/100km`;
                                   if ( co2Element ) co2Element.textContent = `${ coord.CummCO2emissions } kg`;
                              }

                              const intervaloId = iniciarMovimientoMarcadorShip( shipsMarker, coordenadas, 500, actualizarInfoBox );
                              marcadoresShips[ shipsId ] = {
                                   marker: shipsMarker,
                                   intervaloId: intervaloId,
                                   datosShips: data
                              };
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del barco:', error ) );
          }

          obtenerYmoverShips();
     }

     // Evento para ships
     const eventShips = document.getElementById( "ships-sub-nav-item" );
     eventShips.addEventListener( "click", function () {
          toggleKMZLayerTrayectoShips();
          iniciarShipsEnMapa( 1, './assets/shipsQubo.svg', 'Logistics Ship', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Ships/ship.json?sp=r&st=2024-07-26T17:13:49Z&se=2090-01-01T02:13:49Z&sv=2022-11-02&sr=b&sig=B3GhjJFd%2FjJeGN46olFo9NWlu3Lu6le9eAycQhPO1s8%3D' );
     } );



     //* FUNCIÓN PARA TRUCKS Y VANS LOGISTICS*//

     const marcadoresVehiculos = {};

     function iniciarMovimientoMarcador( marker, coordinates, interval, updateInfoBox ) {
          let index = 0;
          const totalCoords = coordinates.length;

          const intervalId = setInterval( () => {
               marker.setPosition( new google.maps.LatLng( coordinates[ index ].lat, coordinates[ index ].lng ) );
               if ( updateInfoBox ) {
                    updateInfoBox( index );
               }

               index++;
               if ( index >= totalCoords ) {
                    index = 0;
               }
          }, interval );

          return intervalId;
     }

     function iniciarVehiculoEnMapa( vehiculoId, iconUrl, title, apiUrl, esVan = false, esTruckArabia = false ) {
          if ( marcadoresVehiculos[ vehiculoId ] ) {
               clearInterval( marcadoresVehiculos[ vehiculoId ].intervaloId );
               marcadoresVehiculos[ vehiculoId ].marker.setMap( null );
               delete marcadoresVehiculos[ vehiculoId ];
               return;
          }

          const vehiculoMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
          fetch( proxyUrl )
               .then( response => response.json() )
               .then( data => {
                    // Precargamos la imagen
                    if ( data.ImagenURL || data[ "Imagen URL" ] ) {
                         const img = new Image();
                         img.src = data.ImagenURL || data[ "Imagen URL" ];
                    }

                    let coordenadas = [];
                    if ( esTruckArabia && data.Coordinates ) {
                         coordenadas = data.Coordinates.map( coord => ( {
                              lat: parseFloat( coord.latitude ),
                              lng: parseFloat( coord.longitude )
                         } ) );
                    } else if ( data.Coordenadas ) {
                         coordenadas = data.Coordenadas.map( coord => ( {
                              lat: parseFloat( coord.latitude || coord.lat ),
                              lng: parseFloat( coord.longitude || coord.lng )
                         } ) );
                    }

                    // PRIMER CAMBIO: Mover la creación del HTML al click del marcador
                    vehiculoMarker.addListener( "click", () => {
                         const infoBox = document.querySelector( ".info-box-trucks" );
                         if ( infoBox ) {
                              infoBox.setAttribute( 'data-vehiculo-id', vehiculoId );

                              if ( esTruckArabia ) {
                                   infoBox.innerHTML = `
                                  <div class="info-header">
                                      <img src="${ data[ "Imagen URL" ] }" alt="Truck" class="property-image"/>
                                      <div class="header-bar">
                                          <div class="property-badges">
                                              <div class="badge-container">
                                                  <span class="badge primary">TRUCK</span>
                                                  <div class="badge-location nameContainer">
                                                      <span>Logistics Truck Arabia</span>
                                                      <span>${ data.Company }</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div class="action-buttons">
                                              <button class="action-btn share-btn" title="Compartir">
                                                  <i class="action-icon">📤</i>
                                              </button>
                                              <button class="action-btn close-btn" id="cerrar-info-box-trucks" title="Cerrar">
                                                  <i class="action-icon">✕</i>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div class="info-content">
                                      <div class="info-grid">
                                          <div class="info-row">
                                              <div class="info-item">
                                                  <label>Driver ID</label>
                                                  <span class="highlight-value">${ data[ "Driver ID" ] }</span>
                                              </div>
                                              <div class="info-item">
                                                  <label>Vehicle ID</label>
                                                  <span class="highlight-value">${ data[ "Vehicle ID" ] }</span>
                                              </div>
                                          </div>
                                          <div class="info-row">
                                              <div class="info-item">
                                                  <label>License Plate</label>
                                                  <span class="plate-number">${ data[ "License Plate" ] }</span>
                                              </div>
                                              <div class="info-item">
                                                  <label>Company</label>
                                                  <span class="company-badge">${ data.Company }</span>
                                              </div>
                                          </div>
                                      </div>
                          
                                      <div class="vehicle-status">
                                          <label>Vehicle Status</label>
                                          <div class="status-indicators">
                                              <div class="status-item">
                                                  <div class="status-icon">⛽</div>
                                                  <div class="status-info">
                                                      <label>Fuel Level</label>
                                                      <div id="progress-bar">
                                                          <div class="progress" id="progress-${ vehiculoId }" style="width: 0%">
                                                              <span id="fuel-${ vehiculoId }">0%</span>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div class="status-item">
                                                  <div class="status-icon">🌱</div>
                                                  <div class="status-info">
                                                      <label>CO2 Emissions</label>
                                                      <span class="emissions-badge" id="emissions-${ vehiculoId }">0 g</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                          
                                      <div class="route-info">
                                          <label>Route Information</label>
                                          <div class="route-card">
                                              <div class="route-icon">🚛</div>
                                              <div class="route-details">
                                                  <div class="distance-info">
                                                      <span class="distance-value" id="distance-${ vehiculoId }">0 km</span>
                                                      <span class="distance-label">to destination</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              `;

                              } else if ( !esVan ) {
                                   // Función auxiliar para manejar valores undefined
                                   const getValue = ( value, defaultValue = 'N/A' ) => {
                                        return value !== undefined ? value : defaultValue;
                                   };

                                   // Obtener los valores con manejo de undefined
                                   const driverID = getValue( data[ "ID Conductor" ] );
                                   const vehicleID = getValue( data[ "ID Vehiculo" ] );
                                   const licensePlate = getValue( data.Matricula );
                                   const company = getValue( data.Empresa );
                                   const emissions = getValue( data[ "Emisiones CO2 (g)" ], '0' );
                                   const distance = getValue( data[ "Distancia a destino (km)" ], '0' );

                                   infoBox.innerHTML = `
                                  <div class="info-header">
                                      <img src="${ data.ImagenURL }" alt="Truck" class="property-image"/>
                                      <div class="header-bar">
                                          <div class="property-badges">
                                              <div class="badge-container">
                                                  <span class="badge primary">TRUCK</span>
                                                  <div class="badge-location nameContainer">
                                                      <span>Logistics Truck</span>
                                                      <span>${ company }</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div class="action-buttons">
                                              <button class="action-btn share-btn" title="Compartir">
                                                  <i class="action-icon">📤</i>
                                              </button>
                                              <button class="action-btn close-btn" id="cerrar-info-box-trucks" title="Cerrar">
                                                  <i class="action-icon">✕</i>
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div class="info-content">
                                      <div class="info-grid">
                                          <div class="info-row">
                                              <div class="info-item">
                                                  <label>Driver ID</label>
                                                  <span class="highlight-value">${ driverID }</span>
                                              </div>
                                              <div class="info-item">
                                                  <label>Vehicle ID</label>
                                                  <span class="highlight-value">${ vehicleID }</span>
                                              </div>
                                          </div>
                                          <div class="info-row">
                                              <div class="info-item">
                                                  <label>License Plate</label>
                                                  <span class="plate-number">${ licensePlate }</span>
                                              </div>
                                              <div class="info-item">
                                                  <label>Company</label>
                                                  <span class="company-badge">${ company }</span>
                                              </div>
                                          </div>
                                      </div>
                          
                                      <div class="vehicle-status">
                                          <label>Vehicle Status</label>
                                          <div class="status-indicators">
                                              <div class="status-item">
                                                  <div class="status-icon">⛽</div>
                                                  <div class="status-info">
                                                      <label>Fuel Level</label>
                                                      <div id="progress-bar">
                                                          <div class="progress" id="progress-${ vehiculoId }" style="width: 0%">
                                                              <span id="fuel-${ vehiculoId }">0%</span>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div class="status-item">
                                                  <div class="status-icon">🌱</div>
                                                  <div class="status-info">
                                                      <label>CO2 Emissions</label>
                                                      <span class="emissions-badge" id="emissions-${ vehiculoId }">${ emissions } g</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                          
                                      <div class="route-info">
                                          <label>Route Information</label>
                                          <div class="route-card">
                                              <div class="route-icon">🚛</div>
                                              <div class="route-details">
                                                  <div class="distance-info">
                                                      <span class="distance-value" id="distance-${ vehiculoId }">${ distance } km</span>
                                                      <span class="distance-label">to destination</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              `;
                              } else {
                                   // Función auxiliar para verificar si un valor existe
                                   const hasValue = ( value ) => value !== undefined && value !== null && value !== '';

                                   // Preparar los datos solo si existen
                                   const headerData = {
                                        image: hasValue( data.ImagenURL ) ? `<img src="${ data.ImagenURL }" alt="Van" class="property-image"/>` : '',
                                        company: hasValue( data.Empresa ) ? data.Empresa : ''
                                   };
                                   infoBox.innerHTML = `
        <div class="info-header">
            ${ headerData.image }
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">VAN</span>
                        <div class="badge-location nameContainer">
                            <span>Logistics Van</span>
                            ${ headerData.company ? `<span>${ headerData.company }</span>` : '' }
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                 <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box-trucks" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="info-content">
            <div class="info-grid">
                ${ hasValue( data[ "ID Conductor" ] ) || hasValue( data[ "ID Vehiculo" ] ) ? `
                    <div class="info-row">
                        ${ hasValue( data[ "ID Conductor" ] ) ? `
                            <div class="info-item">
                                <label>Driver ID</label>
                                <span class="highlight-value">${ data[ "ID Conductor" ] }</span>
                            </div>
                        ` : '' }
                        ${ hasValue( data[ "ID Vehiculo" ] ) ? `
                            <div class="info-item">
                                <label>Vehicle ID</label>
                                <span class="highlight-value">${ data[ "ID Vehiculo" ] }</span>
                            </div>
                        ` : '' }
                    </div>
                ` : '' }
                
                ${ hasValue( data.Matricula ) || hasValue( data.Empresa ) ? `
                    <div class="info-row">
                        ${ hasValue( data.Matricula ) ? `
                            <div class="info-item">
                                <label>License Plate</label>
                                <span class="plate-number">${ data.Matricula }</span>
                            </div>
                        ` : '' }
                        ${ hasValue( data.Empresa ) ? `
                            <div class="info-item">
                                <label>Company</label>
                                <span class="company-badge">${ data.Empresa }</span>
                            </div>
                        ` : '' }
                    </div>
                ` : '' }
            </div>
        </div>
    `;
                              }

                              // Configurar el botón de cerrar
                              document.getElementById( "cerrar-info-box-trucks" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );

                              // Inicializar el arrastre
                              inicializarArrastre( infoBox );

                              infoBox.style.display = "flex";
                         }

                    } );

                    // SEGUNDO CAMBIO: Función que solo actualiza los valores dinámicos
                    //    function actualizarInfoBox(index) {
                    //        const infoBox = document.querySelector(".info-box-trucks");
                    //        if (!infoBox || 
                    //            infoBox.style.display !== "flex" || 
                    //            infoBox.getAttribute('data-vehiculo-id') !== vehiculoId.toString()) {
                    //            return;
                    //        }

                    //        let coord;
                    //        if (esTruckArabia) {
                    //            coord = data.Coordinates[index];
                    //        } else if (!esVan) {
                    //            coord = data.Coordenadas[index];
                    //        }

                    //        if (coord) {
                    //            // Actualizar solo los valores dinámicos usando IDs únicos
                    //            const fuelElement = document.getElementById(`fuel-${vehiculoId}`);
                    //            const emissionsElement = document.getElementById(`emissions-${vehiculoId}`);
                    //            const distanceElement = document.getElementById(`distance-${vehiculoId}`);

                    //            if (esTruckArabia) {
                    //                if (fuelElement) fuelElement.textContent = `${coord["Fuel (%)"]}`;
                    //                if (emissionsElement) emissionsElement.textContent = `${coord["CO2 Emissions (g)"]} g`;
                    //                if (distanceElement) distanceElement.textContent = `${coord["Distance to Destination (km)"]} km`;
                    //            } else {
                    //                if (fuelElement) fuelElement.textContent = `${coord["Combustible (%)"]}`;
                    //                if (emissionsElement && coord["Emisiones CO2 (g)"]) {
                    //                    emissionsElement.textContent = `${coord["Emisiones CO2 (g)"]} g`;
                    //                }
                    //                if (distanceElement) distanceElement.textContent = `${coord["Distancia a destino (km)"]} km`;
                    //            }
                    //        }
                    //    }
                    // SEGUNDO CAMBIO: Función que solo actualiza los valores dinámicos
                    function actualizarInfoBox( index ) {
                         const infoBox = document.querySelector( ".info-box-trucks" );
                         if ( !infoBox ||
                              infoBox.style.display !== "flex" ||
                              infoBox.getAttribute( 'data-vehiculo-id' ) !== vehiculoId.toString() ) {
                              return;
                         }

                         let coord;
                         if ( esTruckArabia ) {
                              coord = data.Coordinates[ index ];
                         } else if ( !esVan ) {
                              coord = data.Coordenadas[ index ];
                         }

                         if ( coord ) {
                              // Actualizar el combustible con la barra de progreso
                              const fuelElement = document.getElementById( `fuel-${ vehiculoId }` );
                              const progressBar = document.getElementById( `progress-${ vehiculoId }` );

                              if ( fuelElement && progressBar ) {
                                   const fuelLevel = esTruckArabia ? coord[ "Fuel (%)" ] : coord[ "Combustible (%)" ];

                                   // Actualizar el texto y la barra
                                   fuelElement.textContent = `${ fuelLevel }%`;
                                   progressBar.style.width = `${ fuelLevel }%`;

                                   // Cambiar el color según el nivel
                                   if ( fuelLevel < 20 ) {
                                        progressBar.style.backgroundColor = '#ff4444';
                                   } else if ( fuelLevel < 50 ) {
                                        progressBar.style.backgroundColor = '#ffbb33';
                                   } else {
                                        progressBar.style.backgroundColor = 'var(--primary-color)';
                                   }
                              }

                              // Actualizar emisiones
                              const emissionsElement = document.getElementById( `emissions-${ vehiculoId }` );
                              if ( emissionsElement ) {
                                   const emissions = esTruckArabia ?
                                        coord[ "CO2 Emissions (g)" ] :
                                        coord[ "Emisiones CO2 (g)" ];
                                   emissionsElement.textContent = `${ emissions } g`;
                              }

                              // Actualizar distancia
                              const distanceElement = document.getElementById( `distance-${ vehiculoId }` );
                              if ( distanceElement ) {
                                   const distance = esTruckArabia ?
                                        coord[ "Distance to Destination (km)" ] :
                                        coord[ "Distancia a destino (km)" ];
                                   distanceElement.textContent = `${ distance } km`;
                              }
                         }
                    }

                    const intervaloId = iniciarMovimientoMarcador( vehiculoMarker, coordenadas, 500, actualizarInfoBox );
                    marcadoresVehiculos[ vehiculoId ] = {
                         marker: vehiculoMarker,
                         intervaloId: intervaloId,
                         datosVehiculo: data
                    };
               } )
               .catch( error => console.error( "Error al obtener coordenadas del vehículo:", error ) );
     }

     // Event listener para el botón de trucks
     const eventTrucks = document.getElementById( "trucks-sub-nav-item" );
     eventTrucks.addEventListener( 'click', function () {
          // Crear bounds para todos los vehículos
          const bounds = new google.maps.LatLngBounds();

          const promesas = [
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck_data_final_updated.json?sp=r&st=2025-02-10T19:02:46Z&se=2099-02-11T03:02:46Z&sv=2022-11-02&sr=b&sig=%2BYAtmguCffqiUlLNILe60nYEiXtYtU1bCE5Rsqywz%2FU%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck2_data_final_updated.json?sp=r&st=2025-02-10T19:03:13Z&se=2099-02-11T03:03:13Z&sv=2022-11-02&sr=b&sig=uFSo%2B7rpy1GBaCjpTWwvkJ1pd3rmkCglH9ZsEfn4vYg%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck3_data_final.json?sp=r&st=2025-02-10T19:03:40Z&se=2099-02-11T03:03:40Z&sv=2022-11-02&sr=b&sig=E9Md4DIMtRIV%2FwUjCs0y57MMMr1pS3%2BnMq4DCkr%2FogE%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_miami_data.json?sp=r&st=2025-02-09T22:40:50Z&se=2099-02-10T06:40:50Z&sv=2022-11-02&sr=b&sig=3mt25X3t7dbbt8fcEWiI%2BCjrBny6EN%2FkNOvMMcZ9T%2FY%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_new_york_data.json?sp=r&st=2025-02-09T22:41:40Z&se=2099-02-10T06:41:40Z&sv=2022-11-02&sr=b&sig=teiu0TH1VHhOUVdsDHH9VAXM16R11M%2FSc2mbznyKq5Q%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_san_luis_data.json?sp=r&st=2025-02-09T22:41:58Z&se=2099-02-10T06:41:58Z&sv=2022-11-02&sr=b&sig=2hyY5AtQQ210htuWhxIfPce8QrSuAs1ED1V6grcj%2FQc%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_4.json?sp=r&st=2025-03-01T10:39:21Z&se=2099-03-01T18:39:21Z&sv=2022-11-02&sr=b&sig=ESDZjQckX%2FrG%2F5IGCuHWmgsP3L28q0fH9sSPDyJafNk%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_7.json?sp=r&st=2025-03-01T12:23:49Z&se=2099-03-01T20:23:49Z&sv=2022-11-02&sr=b&sig=qFY5KeqL1n4GUQIq%2F2xNx4TJy%2BZLmWKNgMWwdmb740U%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_10.json?sp=r&st=2025-03-01T12:36:55Z&se=2099-03-01T20:36:55Z&sv=2022-11-02&sr=b&sig=GcKRb8Bj6j9R0DFocHmLzauhPpJJhxwcTX9HHgIrHcU%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_5.json?sp=r&st=2025-03-01T12:38:00Z&se=2099-03-01T20:38:00Z&sv=2022-11-02&sr=b&sig=plN2yP%2BblzdbYGefmvC%2FaOwO9Soz9GOfL%2FA0OUoHdZQ%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_8.json?sp=r&st=2025-03-01T12:39:05Z&se=2099-03-01T20:39:05Z&sv=2022-11-02&sr=b&sig=swaoAkdKQ7mU8mBdqQ7BhwDX%2Bk%2FWzCdBkvqsN84a7s0%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_12.json?sp=r&st=2025-03-01T12:40:23Z&se=2099-03-01T20:40:23Z&sv=2022-11-02&sr=b&sig=hYgKj7v5NWSs5GK6LKEBEuNDl3mCky8qBCzto1eg1iI%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_6.json?sp=r&st=2025-03-01T12:41:22Z&se=2099-03-01T20:41:22Z&sv=2022-11-02&sr=b&sig=WA9lAB7Or%2BWd4L5f2r5ZjYxdo5RcrfM1Z84Y6U2Clk4%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_9.json?sp=r&st=2025-03-01T12:42:24Z&se=2099-03-01T20:42:24Z&sv=2022-11-02&sr=b&sig=uuEuEoTNWkfoWtb5pKBDnx00i1tcF49TqCSNFgtU9ko%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_11.json?sp=r&st=2025-03-01T12:43:17Z&se=2099-03-01T20:43:17Z&sv=2022-11-02&sr=b&sig=jpdoDeEluNz2pcI8VCR1lDB0EgU7qoFWnZfcgkaqUlE%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_1.json?sp=r&st=2025-03-01T12:52:15Z&se=2099-03-01T20:52:15Z&sv=2022-11-02&sr=b&sig=Av%2F0%2F%2BZ6DC3IGW1u7jjhzxGyVD7udP4Oq5uLM6KWs0k%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_2.json?sp=r&st=2025-03-02T11:50:40Z&se=2099-03-02T19:50:40Z&sv=2022-11-02&sr=b&sig=yvr7fnCy8VVS1Q2DROn36O9M5MYxgSZkbYCBXQrKNA4%3D' ) }` ),
               fetch( `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_3.json?sp=r&st=2025-03-02T11:52:14Z&se=2099-03-02T19:52:14Z&sv=2022-11-02&sr=b&sig=eV%2BTe1qIQv06aU9sJ%2B2OJvEHq57qUykc96Qkh9PS3Xw%3D' ) }` ),
          ];

          Promise.all( promesas )
               .then( responses => Promise.all( responses.map( r => r.json() ) ) )
               .then( datos => {
                    // Extender bounds con todas las coordenadas
                    datos.forEach( data => {
                         if ( data.Coordenadas && Array.isArray( data.Coordenadas ) ) {
                              data.Coordenadas.forEach( coord => {
                                   bounds.extend( new google.maps.LatLng(
                                        parseFloat( coord.latitude || coord.lat ),
                                        parseFloat( coord.longitude || coord.lng )
                                   ) );
                              } );
                         }
                         // Para vehículos con Coordinates (Arabia)
                         if ( data.Coordinates && Array.isArray( data.Coordinates ) ) {
                              data.Coordinates.forEach( coord => {
                                   bounds.extend( new google.maps.LatLng(
                                        parseFloat( coord.latitude ),
                                        parseFloat( coord.longitude )
                                   ) );
                              } );
                         }
                    } );

                    // Ajustar el mapa a los bounds
                    map.fitBounds( bounds, { padding: 50 } );

                    // Iniciar todos los vehículos
                    iniciarVehiculoEnMapa( 1, './assets/truckQubo.svg', 'Truck 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck_data_final_updated.json?sp=r&st=2025-02-10T19:02:46Z&se=2099-02-11T03:02:46Z&sv=2022-11-02&sr=b&sig=%2BYAtmguCffqiUlLNILe60nYEiXtYtU1bCE5Rsqywz%2FU%3D' );
                    iniciarVehiculoEnMapa( 2, './assets/truckQubo.svg', 'Truck 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck2_data_final_updated.json?sp=r&st=2025-02-10T19:03:13Z&se=2099-02-11T03:03:13Z&sv=2022-11-02&sr=b&sig=uFSo%2B7rpy1GBaCjpTWwvkJ1pd3rmkCglH9ZsEfn4vYg%3D' );
                    iniciarVehiculoEnMapa( 3, './assets/truckQubo.svg', 'Truck 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/truck3_data_final.json?sp=r&st=2025-02-10T19:03:40Z&se=2099-02-11T03:03:40Z&sv=2022-11-02&sr=b&sig=E9Md4DIMtRIV%2FwUjCs0y57MMMr1pS3%2BnMq4DCkr%2FogE%3D' );
                    iniciarVehiculoEnMapa( 4, './assets/truckQubo.svg', 'Van Miami', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_miami_data.json?sp=r&st=2025-02-09T22:40:50Z&se=2099-02-10T06:40:50Z&sv=2022-11-02&sr=b&sig=3mt25X3t7dbbt8fcEWiI%2BCjrBny6EN%2FkNOvMMcZ9T%2FY%3D', true );
                    iniciarVehiculoEnMapa( 5, './assets/truckQubo.svg', 'Van New York', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_new_york_data.json?sp=r&st=2025-02-09T22:41:40Z&se=2099-02-10T06:41:40Z&sv=2022-11-02&sr=b&sig=teiu0TH1VHhOUVdsDHH9VAXM16R11M%2FSc2mbznyKq5Q%3D', true );
                    iniciarVehiculoEnMapa( 6, './assets/truckQubo.svg', 'Van San Luis', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/van_san_luis_data.json?sp=r&st=2025-02-09T22:41:58Z&se=2099-02-10T06:41:58Z&sv=2022-11-02&sr=b&sig=2hyY5AtQQ210htuWhxIfPce8QrSuAs1ED1V6grcj%2FQc%3D', true );
                    iniciarVehiculoEnMapa( 7, './assets/truckQubo.svg', 'Truck 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_4.json?sp=r&st=2025-03-01T10:39:21Z&se=2099-03-01T18:39:21Z&sv=2022-11-02&sr=b&sig=ESDZjQckX%2FrG%2F5IGCuHWmgsP3L28q0fH9sSPDyJafNk%3D' );
                    iniciarVehiculoEnMapa( 8, './assets/truckQubo.svg', 'Truck 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_7.json?sp=r&st=2025-03-01T12:23:49Z&se=2099-03-01T20:23:49Z&sv=2022-11-02&sr=b&sig=qFY5KeqL1n4GUQIq%2F2xNx4TJy%2BZLmWKNgMWwdmb740U%3D' );
                    iniciarVehiculoEnMapa( 9, './assets/truckQubo.svg', 'Truck 10', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_10.json?sp=r&st=2025-03-01T12:36:55Z&se=2099-03-01T20:36:55Z&sv=2022-11-02&sr=b&sig=GcKRb8Bj6j9R0DFocHmLzauhPpJJhxwcTX9HHgIrHcU%3D' );
                    iniciarVehiculoEnMapa( 10, './assets/truckQubo.svg', 'Truck 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_5.json?sp=r&st=2025-03-01T12:38:00Z&se=2099-03-01T20:38:00Z&sv=2022-11-02&sr=b&sig=plN2yP%2BblzdbYGefmvC%2FaOwO9Soz9GOfL%2FA0OUoHdZQ%3D' );
                    iniciarVehiculoEnMapa( 11, './assets/truckQubo.svg', 'Truck 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_8.json?sp=r&st=2025-03-01T12:39:05Z&se=2099-03-01T20:39:05Z&sv=2022-11-02&sr=b&sig=swaoAkdKQ7mU8mBdqQ7BhwDX%2Bk%2FWzCdBkvqsN84a7s0%3D' );
                    iniciarVehiculoEnMapa( 12, './assets/truckQubo.svg', 'Truck 12', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_12.json?sp=r&st=2025-03-01T12:40:23Z&se=2099-03-01T20:40:23Z&sv=2022-11-02&sr=b&sig=hYgKj7v5NWSs5GK6LKEBEuNDl3mCky8qBCzto1eg1iI%3D' );
                    iniciarVehiculoEnMapa( 13, './assets/truckQubo.svg', 'Truck 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_6.json?sp=r&st=2025-03-01T12:41:22Z&se=2099-03-01T20:41:22Z&sv=2022-11-02&sr=b&sig=WA9lAB7Or%2BWd4L5f2r5ZjYxdo5RcrfM1Z84Y6U2Clk4%3D' );
                    iniciarVehiculoEnMapa( 14, './assets/truckQubo.svg', 'Truck 9', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_9.json?sp=r&st=2025-03-01T12:42:24Z&se=2099-03-01T20:42:24Z&sv=2022-11-02&sr=b&sig=uuEuEoTNWkfoWtb5pKBDnx00i1tcF49TqCSNFgtU9ko%3D' );
                    iniciarVehiculoEnMapa( 15, './assets/truckQubo.svg', 'Truck 11', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_11.json?sp=r&st=2025-03-01T12:43:17Z&se=2099-03-01T20:43:17Z&sv=2022-11-02&sr=b&sig=jpdoDeEluNz2pcI8VCR1lDB0EgU7qoFWnZfcgkaqUlE%3D' );
                    iniciarVehiculoEnMapa( 16, './assets/truckQubo.svg', 'Truck Arabia 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_1.json?sp=r&st=2025-03-01T12:52:15Z&se=2099-03-01T20:52:15Z&sv=2022-11-02&sr=b&sig=Av%2F0%2F%2BZ6DC3IGW1u7jjhzxGyVD7udP4Oq5uLM6KWs0k%3D', false, true );
                    iniciarVehiculoEnMapa( 17, './assets/truckQubo.svg', 'Truck Arabia 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_2.json?sp=r&st=2025-03-02T11:50:40Z&se=2099-03-02T19:50:40Z&sv=2022-11-02&sr=b&sig=yvr7fnCy8VVS1Q2DROn36O9M5MYxgSZkbYCBXQrKNA4%3D', false, true );
                    iniciarVehiculoEnMapa( 18, './assets/truckQubo.svg', 'Truck Arabia 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Trucks/Truck_Arabia_3.json?sp=r&st=2025-03-02T11:52:14Z&se=2099-03-02T19:52:14Z&sv=2022-11-02&sr=b&sig=eV%2BTe1qIQv06aU9sJ%2B2OJvEHq57qUykc96Qkh9PS3Xw%3D', false, true );
               } )
               .catch( error => console.error( "Error al cargar los datos:", error ) );
     } );

     //* FUNCIÓN PARA STORES *//

     // let marcadoresTiendas = {};
     // let storesActivos = false;

     function iniciarStoresEnMapa() {
          // Si ya están activos, los eliminamos
          if ( storesActivos ) {
               Object.values( marcadoresTiendas ).forEach( ( marker ) => {
                    if ( marker.marker ) marker.marker.setMap( null );
               } );
               marcadoresTiendas = {};
               storesActivos = false;
               return;
          }

          // Si no están activos, los creamos
          storesActivos = true;
          const apiUrl =
               "https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Stores/fiware_zara_150_stores_updated.json?sp=r&st=2025-03-10T15:00:24Z&se=2089-12-31T23:00:24Z&sv=2022-11-02&sr=b&sig=M6wkoyxB1gOt%2FwBJaGOfiOt632n9NmZ09zJl25IAQSw%3D";
          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;

          fetch( proxyUrl )
               .then( ( response ) => response.json() )
               .then( ( data ) => {
                    data.data.forEach( ( tienda ) => {
                         const coords = tienda.location.value.coordinates;
                         const position = {
                              lat: coords[ 1 ],
                              lng: coords[ 0 ],
                         };

                         const marker = new google.maps.Marker( {
                              position: position,
                              map: map,
                              title: tienda.name.value,
                              icon: {
                                   url: "./assets/stores_Qubo.svg",
                              },
                         } );

                         marker.addListener( "click", () => {
                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-store-id="${ tienda.id }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( "highlight" );
                                   setTimeout( () => existingPinnedBox.classList.remove( "highlight" ), 1000 );
                                   return;
                              }

                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( "div" );
                                   currentInfoBox.className = "info-box";
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( "data-store-id", tienda.id );
                              currentInfoBox.innerHTML = `
    <div class="info-header">
        <img src="./assets/clark-street-mercantile-P3pI6xzovu0-unsplash.jpg" alt="Tienda" class="property-image"/>
        <div class="header-bar">
            <div class="property-badges">
                <div class="badge-container">
                    <span class="badge primary">STORE</span>
                    <div class="badge-location nameContainer">
                        <span>${ tienda.name.value }</span>
                        <span>${ tienda.address.value.addressLocality }, ${ tienda.address.value.addressCountry }</span>
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="action-btn pin-btn" title="Fijar ventana">
                    <i class="action-icon">📌</i>
                </button>
                <button class="action-btn share-btn" title="Compartir">
                    <i class="action-icon">📤</i>
                </button>
                <button class="action-btn close-btn" title="Cerrar">
                    <i class="action-icon">✕</i>
                </button>
            </div>
        </div>
    </div>

    <div class="info-content">
        <div class="info-section">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item id-container">
                        <label>ID</label>
                        <div class="id-value-container">
                            <div class="id-wrapper">
                                <span title="${ tienda.id }">${ tienda.id }</span>
                                <button class="copy-btn" title="Copiar ID">
                                    <i class="copy-icon">📋</i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-item">
                        <label>Propietario</label>
                        <div class="owner-badge">
                            <span class="company-badge">${ tienda.owner.object[ 0 ] }</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <label>Fuente</label>
                        <div class="source-container">
                            <a href="${ tienda.source.value }" target="_blank" class="source-link">
                                <i class="source-icon">🔗</i>
                                <span>zara.com</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="status-cards">
                    <div class="status-card">
                        <div class="status-icon">📍</div>
                        <div class="status-details">
                            <label>Dirección</label>
                            <span>${ tienda.address.value.streetAddress }, ${ tienda.address.value.postalCode }</span>
                        </div>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-item">
                        <label>Ventas Mensuales</label>
                        <span class="sales-badge">${ tienda.annexZara.value.monthlySales }</span>
                    </div>
                    <div class="info-item">
                        <label>Beneficio Neto</label>
                        <span class="profit-badge">${ tienda.annexZara.value.netIncome }</span>
                    </div>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">👥</div>
                        <div class="metric-details">
                            <span class="metric-value">${ tienda.annexZara.value.dailyCustomers }</span>
                            <label>Clientes Diarios</label>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">🏷️</div>
                        <div class="metric-details">
                            <span class="metric-value">${ tienda.annexZara.value.averageTicket }</span>
                            <label>Ticket Medio</label>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">👕</div>
                        <div class="metric-details">
                            <span class="metric-value">${ tienda.annexZara.value.inventoryAvailable }</span>
                            <label>Inventario</label>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">👤</div>
                        <div class="metric-details">
                            <span class="metric-value">${ tienda.annexZara.value.numberOfEmployees }</span>
                            <label>Empleados</label>
                        </div>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-item">
                        <label>Productos más vendidos</label>
                        <div class="tags-container">
                            ${ tienda.annexZara.value.bestSellingProducts.map( product =>
                                   `<span class="tag">${ product }</span>`
                              ).join( '' ) }
                        </div>
                    </div>
                </div>

                <div class="info-row">
                    <div class="info-item">
                        <label>Medidas de Sostenibilidad</label>
                        <div class="sustainability-badges">
                            ${ tienda.annexZara.value.sustainabilityMeasures.map( ( measure, index ) => {
                                   const icon = index === 0 ? '♻️' : '🛍️';
                                   return `<span class="eco-badge">${ icon } ${ measure }</span>`;
                              } ).join( '' ) }
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-divider">
            <label>Datos Comerciales</label>
        </div>

        <div class="metrics-grid">
            <div class="metric-card highlight">
                <div class="metric-icon">💰</div>
                <div class="metric-details">
                    <span class="metric-value">${ tienda.annexZara.value.numberOfTransactions }</span>
                    <label>Transacciones</label>
                </div>
            </div>
            <div class="metric-card highlight">
                <div class="metric-icon">📈</div>
                <div class="metric-details">
                    <span class="metric-value ${ parseFloat( tienda.annexZara.value.salesComparison ) > 0 ? 'positive' : 'negative' }">
                        ${ tienda.annexZara.value.salesComparison }
                    </span>
                    <label>Comparativa Ventas</label>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">↩️</div>
                <div class="metric-details">
                    <span class="metric-value">${ tienda.annexZara.value.customerReturnRate }</span>
                    <label>Tasa Devolución</label>
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-icon">💹</div>
                <div class="metric-details">
                    <span class="metric-value">${ tienda.annexZara.value.profitMargin }</span>
                    <label>Margen Beneficio</label>
                </div>
            </div>
        </div>

        <div class="info-row">
            <div class="info-item">
                <label>Costes Operativos</label>
                <span class="cost-badge">${ tienda.annexZara.value.operationalCosts }</span>
            </div>
            <div class="info-item">
                <label>Comparativa Precios</label>
                <span class="price-comparison negative">${ tienda.annexZara.value.priceComparison }</span>
            </div>
        </div>

        <div class="section-divider">
            <label>Datos Logísticos</label>
        </div>

        <div class="logistics-grid">
            <div class="logistics-card">
                <div class="logistics-icon">📦</div>
                <div class="logistics-details">
                    <span>${ tienda.annexZara.value.pickupPoints } Puntos de recogida</span>
                    <span class="secondary">Tiempo entrega: ${ tienda.annexZara.value.deliveryTime }</span>
                </div>
            </div>
            <div class="logistics-card">
                <div class="logistics-icon">🏪</div>
                <div class="logistics-details">
                    <span>${ tienda.annexZara.value.competitorStores } Tiendas competencia</span>
                    <span class="secondary">Radio: 500m</span>
                </div>
            </div>
        </div>

        <div class="section-divider">
            <label>Datos Demográficos</label>
        </div>

        <div class="demographics-container">
            <div class="demographics-chart">
                <div class="chart-bar female" style="width: 60%">
                    <span>Femenino 60%</span>
                </div>
                <div class="chart-bar male" style="width: 40%">
                    <span>Masculino 40%</span>
                </div>
            </div>
            <span class="age-range">Edad: 18-45 años</span>
        </div>

        <div class="section-divider">
            <label>Seguridad y Personal</label>
        </div>

        <div class="security-grid">
            ${ tienda.annexZara.value.securityMeasures.map( measure => `
                <div class="measure-item">
                    <i class="measure-icon">${ measure.includes( 'Cámaras' ) ? '🎥' : '👮' }</i>
                    <span>${ measure }</span>
                </div>
            `).join( '' ) }
            <div class="measure-item">
                <i class="measure-icon">🔄</i>
                <span>Rotación Personal ${ tienda.annexZara.value.staffTurnover }</span>
            </div>
            <div class="measure-item">
                <i class="measure-icon">📚</i>
                <span>${ tienda.annexZara.value.trainingDevelopment }</span>
            </div>
        </div>

        <div class="section-divider">
            <label>Impacto Ambiental</label>
        </div>

        <div class="environmental-impact">
            <div class="impact-metric">
                <i class="impact-icon">🌍</i>
                <div class="impact-details">
                    <span class="impact-value">${ tienda.annexZara.value.environmentalImpact }</span>
                    <span class="impact-label">Huella de carbono</span>
                </div>
            </div>
        </div>
    </div>
`;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( ".info-box" );
                                   if ( infoBox.classList.contains( "pinned" ) ) {
                                        // Desfijar
                                        infoBox.classList.remove( "pinned" );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        // Fijar
                                        infoBox.classList.add( "pinned" );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";

                                        // Crear nuevo infobox para futuras propiedades
                                        const newInfoBox = document.createElement( "div" );
                                        newInfoBox.className = "info-box";
                                        newInfoBox.style.display = "none";
                                        document.body.appendChild( newInfoBox );
                                   }
                              } );

                              currentInfoBox.querySelector( ".share-btn" )?.addEventListener( "click", async () => {
                                   try {
                                        // Construir una URL con los parámetros de la tienda
                                        const baseUrl = window.location.origin + window.location.pathname;
                                        const shareUrl = `${ baseUrl }?view=store&id=${ tienda.id }`;

                                        const shareData = {
                                             title: `${ tienda.name.value } - Zara Store`,
                                             text: `📍 ${ tienda.address.value.addressLocality }, ${ tienda.address.value.addressCountry }\n` +
                                                  `💰 Ventas Mensuales: ${ tienda.annexZara.value.monthlySales }\n` +
                                                  `👥 Clientes Diarios: ${ tienda.annexZara.value.dailyCustomers }\n` +
                                                  `👕 Inventario: ${ tienda.annexZara.value.inventoryAvailable }\n` +
                                                  `👤 Empleados: ${ tienda.annexZara.value.numberOfEmployees }`,
                                             url: shareUrl
                                        };

                                        if ( navigator.share && navigator.canShare( shareData ) ) {
                                             await navigator.share( shareData );
                                        } else {
                                             const shareText = `${ shareData.title }\n\n${ shareData.text }\n\n🔗 Ver detalles: ${ shareUrl }`;
                                             await navigator.clipboard.writeText( shareText );
                                             showNotification( '¡Información copiada al portapapeles!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );

                              currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".copy-btn" )?.addEventListener( "click", async () => {
                                   try {
                                        await navigator.clipboard.writeText( tienda.id );
                                        showNotification( "¡ID copiado!" );
                                   } catch ( error ) {
                                        console.error( "Error al copiar:", error );
                                   }
                              } );

                              inicializarArrastre( currentInfoBox );
                              currentInfoBox.style.display = "flex";
                         } );

                         marcadoresTiendas[ tienda.id ] = {
                              marker: marker,
                              datos: tienda,
                         };
                    } );

                    if ( Object.keys( marcadoresTiendas ).length > 0 ) {
                         const bounds = new google.maps.LatLngBounds();
                         Object.values( marcadoresTiendas ).forEach( ( m ) => {
                              if ( m.marker && m.marker.getPosition() ) {
                                   bounds.extend( m.marker.getPosition() );
                              }
                         } );
                         map.fitBounds( bounds );
                    }
               } )
               .catch( ( error ) => console.error( "Error al cargar las tiendas:", error ) );
     }

     // Añadir el event listener para el botón de tiendas
     document.getElementById( "stores-sub-nav-item" ).addEventListener( "click", iniciarStoresEnMapa );







     //* FUNCIÓN PARA TRACKING*//

     // Variable global para los marcadores de tracking
     const marcadoresTracking = {};

     function iniciarTrackingEnMapa( trackingId, iconUrl, title, apiUrl ) {
          if ( marcadoresTracking[ trackingId ] ) {
               clearInterval( marcadoresTracking[ trackingId ].intervaloId );
               marcadoresTracking[ trackingId ].marker.setMap( null );
               delete marcadoresTracking[ trackingId ];
               return;
          }

          const trackingMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverTracking() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.currentLocation && Array.isArray( data.currentLocation.coordinates ) ) {
                              const coordenadas = data.currentLocation.coordinates;

                              // Guardar los datos primero
                              marcadoresTracking[ trackingId ] = {
                                   marker: trackingMarker,
                                   datosTracking: data
                              };

                              function actualizarInfoBoxInicial() {
                                   const infoBox = document.querySelector( ".info-box-tracking" );
                                   infoBox.innerHTML = `
                            <div class="nameContainer">
                                <p>Package</p>
                                <p>Tracking System</p>
                            </div>
                            <div class="own">
                                <img src="${ STATIC_IMAGES.tracking }" alt="Tracking Image" />
                            </div>
                            <p>Tracking Number: <span>${ data.trackingNumber }</span></p>
                            <p>Description: <span>${ data.description }</span></p>
                            <p>Status: <span>${ data.shippingStatus }</span></p>
                            <p>Weight: <span>${ data.weight } kg</span></p>
                            <p>Dimensions: <span>${ data.dimensions.length } x 
                                ${ data.dimensions.width } x 
                                ${ data.dimensions.height } 
                                ${ data.dimensions.unit }</span></p>
                            <p>Origin: <span>${ data.origin.name }, 
                                ${ data.origin.address.addressLocality }, 
                                ${ data.origin.address.addressRegion }, 
                                ${ data.origin.address.addressCountry }</span></p>
                            <p>Destination: <span>${ data.destination.name }, 
                                ${ data.destination.address.addressLocality }, 
                                ${ data.destination.address.addressRegion }, 
                                ${ data.destination.address.addressCountry }</span></p>
                            <p>Sender: <span>${ data.sender.name } (${ data.sender.contact })</span></p>
                            <p>Recipient: <span>${ data.recipient.name } (${ data.recipient.contact })</span></p>
                            <p>Courier: <span>${ data.courier.courierCompany }</span></p>
                            <p>Instructions: <span>${ data.handlingRequirements.specialHandlingInstructions }</span></p>
                            <p>Speed: <span id="speedValue">0 km/h</span></p>
                            <p>Fuel Consumption: <span id="fuelValue">0 L/100km</span></p>
                            <p>CO2 Emissions: <span id="co2Value">0 kg</span></p>
                            <button id="cerrar-info-box-tracking">
                                <img src='./assets/botonCerrar.svg' alt="Cerrar" />
                            </button>
                        `;

                                   document.getElementById( "cerrar-info-box-tracking" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              }

                              function actualizarDatosDinamicos( index ) {
                                   const infoBox = document.querySelector( ".info-box-tracking" );
                                   if ( !infoBox || infoBox.style.display !== "flex" ) return;

                                   const coord = coordenadas[ index ];
                                   const speedElement = document.getElementById( "speedValue" );
                                   const fuelElement = document.getElementById( "fuelValue" );
                                   const co2Element = document.getElementById( "co2Value" );

                                   if ( speedElement ) speedElement.textContent = coord.speed;
                                   if ( fuelElement ) fuelElement.textContent = coord.fuelConsumption;
                                   if ( co2Element ) co2Element.textContent = coord.CummCO2emissions;
                              }

                              // Iniciar el movimiento
                              const intervaloId = iniciarMovimientoMarcador(
                                   trackingMarker,
                                   coordenadas,
                                   500,
                                   actualizarDatosDinamicos
                              );

                              marcadoresTracking[ trackingId ].intervaloId = intervaloId;

                              // Configurar el click listener
                              trackingMarker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box-tracking" );
                                   infoBox.style.display = "flex";
                                   actualizarInfoBoxInicial();
                                   actualizarDatosDinamicos( 0 );
                              } );
                         }
                    } )
                    .catch( error => console.error( 'Error:', error ) );
          }

          obtenerYmoverTracking();
     }

     // Event listener para el botón de tracking
     const eventTracking = document.getElementById( "tracking-sub-nav-item" );
     eventTracking.addEventListener( "click", function () {
          toggleKMZLayerTrayectoShips();
          // Iniciar el barco
          iniciarShipsEnMapa(
               1,
               './assets/shipsQubo.svg',
               'Logistics Ship',
               'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Ships/ship.json?sp=r&st=2024-07-26T17:13:49Z&se=2090-01-01T02:13:49Z&sv=2022-11-02&sr=b&sig=B3GhjJFd%2FjJeGN46olFo9NWlu3Lu6le9eAycQhPO1s8%3D'
          );
          iniciarTrackingEnMapa(
               1,
               './assets/tracking_Qubo_Small.svg',
               'Tracking Package',
               'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Tracking/paquete_fiware_mod1.json?sp=r&st=2024-08-20T10:34:28Z&se=2090-01-01T19:34:28Z&sv=2022-11-02&sr=b&sig=nGoZVlF9Rs8qA87k7J5PK3Mf%2B6Kc16hsJflCyFMdRWg%3D'
          );
     } );

     //! Función para PACK LOCATION

     // Variables globales para los marcadores de los paquetes
     const marcadoresPacks = {};

     function iniciarPackEnMapa( packId, iconUrl, title, apiUrl ) {
          if ( marcadoresPacks[ packId ] ) {
               clearInterval( marcadoresPacks[ packId ].intervaloId );
               marcadoresPacks[ packId ].marker.setMap( null );
               delete marcadoresPacks[ packId ];
               return;
          }

          const packMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          function obtenerYmoverPack() {
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( apiUrl ) }`;
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         if ( data.currentLocation && Array.isArray( data.currentLocation.coordinates ) ) {
                              const coordenadas = data.currentLocation.coordinates;

                              // Guardar los datos primero
                              marcadoresPacks[ packId ] = {
                                   marker: packMarker,
                                   datosPack: data
                              };

                              // Función para actualizar el InfoBox
                              function actualizarInfoBoxInicial() {
                                   const infoBox = document.querySelector( ".info-box-pack-location" );
                                   infoBox.innerHTML = `
                                  <div class="nameContainer">
                                      <p>Package</p>
                                      <p>Store Location</p>
                                  </div>
                                      <img src="./assets/staticPackLocation.jpg" alt="Package Image" />
                                  <p>Package ID: <span>${ data.id || 'N/A' }</span></p>
                                  <p>Tracking Number: <span>${ data.trackingNumber || 'N/A' }</span></p>
                                  <p>Type: <span>${ data.type || 'N/A' }</span></p>
                                  <p>Description: <span>${ data.description || 'N/A' }</span></p>
                                  <p>Weight: <span>${ data.weight || 0 } kg</span></p>
                                  <p>Dimensions: <span>${ data.dimensions.length } x 
                                      ${ data.dimensions.width } x 
                                      ${ data.dimensions.height } 
                                      ${ data.dimensions.unit }</span></p>
                                  <p>Status: <span>${ data.shippingStatus || 'N/A' }</span></p>
                                  <p>Origin: <span>${ data.origin.name }, 
                                      ${ data.origin.address.addressLocality }, 
                                      ${ data.origin.address.addressRegion }, 
                                      ${ data.origin.address.addressCountry }</span></p>
                                  <p>Destination: <span>${ data.destination.name }, 
                                      ${ data.destination.address.addressLocality }, 
                                      ${ data.destination.address.addressRegion }, 
                                      ${ data.destination.address.addressCountry }</span></p>
                                  <p>Speed: <span id="speedValue">0 km/h</span></p>
                                  <p>Fuel Consumption: <span id="fuelValue">0 L/100km</span></p>
                                  <p>CO2 Emissions: <span id="co2Value">0 kg</span></p>
                                  <button id="cerrar-info-box-store">
                                      <img src='./assets/botonCerrar.svg' alt="Cerrar" />
                                  </button>
                              `;

                                   document.getElementById( "cerrar-info-box-store" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              }

                              // Función para actualizar datos dinámicos
                              function actualizarDatosDinamicos( index ) {
                                   const infoBox = document.querySelector( ".info-box-pack-location" );
                                   if ( !infoBox || infoBox.style.display !== "flex" ) return;

                                   const coord = coordenadas[ index ];
                                   const speedElement = document.getElementById( "speedValue" );
                                   const fuelElement = document.getElementById( "fuelValue" );
                                   const co2Element = document.getElementById( "co2Value" );

                                   if ( speedElement ) speedElement.textContent = coord.speed;
                                   if ( fuelElement ) fuelElement.textContent = coord.fuelConsumption;
                                   if ( co2Element ) co2Element.textContent = coord.CummCO2emissions;
                              }

                              // Iniciar el movimiento
                              const intervaloId = iniciarMovimientoMarcadorStore(
                                   packMarker,
                                   coordenadas,
                                   2000,
                                   actualizarDatosDinamicos
                              );

                              marcadoresPacks[ packId ].intervaloId = intervaloId;

                              // Configurar el click listener
                              packMarker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box-pack-location" );
                                   infoBox.style.display = "flex";
                                   actualizarInfoBoxInicial();
                                   actualizarDatosDinamicos( 0 );
                              } );
                         }
                    } )
                    .catch( error => console.error( 'Error:', error ) );
          }

          obtenerYmoverPack();
     }

     // Evento para manejar el movimiento del paquete desde la tienda
     const eventPackLocation = document.getElementById( "pack-location-sub-nav-item" );
     eventPackLocation.addEventListener( "click", function () {
          iniciarPackEnMapa( 1, './assets/pack-locationQubo.svg', 'Store Package', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Pack%20Location/packLocation.json?sp=r&st=2024-09-01T19:27:05Z&se=2090-09-02T03:27:05Z&sv=2022-11-02&sr=b&sig=pbpMlfNpXqkt%2Ff3%2BLzHXr%2B6ckIktYRKcGVN2nsSSIMg%3D' );
     } );

     // Función para iniciar el movimiento del marcador del paquete de la tienda
     function iniciarMovimientoMarcadorStore( marker, coordinates, interval, updateInfoBox ) {
          let index = 0;
          const totalCoords = coordinates.length;

          const intervalId = setInterval( () => {
               marker.setPosition( new google.maps.LatLng( coordinates[ index ].lat, coordinates[ index ].lng ) );
               if ( updateInfoBox ) {
                    updateInfoBox( index ); // Actualiza solo los datos dinámicos del infobox
               }

               index++;

               if ( index >= totalCoords ) {
                    clearInterval( intervalId ); // Detener el movimiento al final de las coordenadas
               }
          }, interval );

          return intervalId;
     }



     //* FINAL MOVIDA SHIPS; TRUCKS; TRACKING //

     //* Oficina Qubo Factory

     // Define las coordenadas de la ubicación personalizada y la URL de su icono personalizado
     const customLocationLatLng = { lat: 40.06054023234016, lng: 0.1031147223559949 };
     const customLocationIconUrl = "./assets/quboblanco.svg"; // Reemplaza con la URL de tu imagen

     // Crear un marcador para la ubicación personalizada
     const customLocationMarker = new google.maps.Marker( {
          position: customLocationLatLng,
          map: map,
          title: "Oficina Qubo Factory",
          icon: customLocationIconUrl,
     } );

     // Agregar un evento click al marcador de la ubicación personalizada
     customLocationMarker.addListener( "click", function () {
          // Define la URL de la página web que deseas abrir
          const webpageUrl =
               "https://www.spatial.io/s/Qubo-Factory-Meeting-Room-650d7b39fa3720c215733286?share=6752416412510878923"; // Reemplaza con la URL de tu página web

          // Abre la página web en una nueva ventana o pestaña
          window.open( webpageUrl, "_blank" );
     } );

     //? Inicializar el autocompletado de búsqueda
     const input = document.getElementById( "pac-input" );
     autocomplete = new google.maps.places.Autocomplete( input );

     // Evento cuando se selecciona una sugerencia del autocompletado
     autocomplete.addListener( "place_changed", function () {
          const place = autocomplete.getPlace();

          // Centrar el mapa en el lugar seleccionado y ajustar el zoom
          map.setCenter( place.geometry.location );
          map.setZoom( 18 );
     } );

     // Evento para manejar la búsqueda cuando se presiona "Enter" en el campo de entrada
     input.addEventListener( "keyup", function ( event ) {
          if ( event.key === "Enter" ) {
               event.preventDefault(); // Evita que se realice la acción por defecto (como enviar el formulario)

               //! MODIFICAR
               // Hacer una solicitud de lugar basada en el texto de entrada
               const geocoder = new google.maps.Geocoder();
               const inputText = event.target.value;

               geocoder.geocode( { address: inputText }, function ( results, status ) {
                    // console.log("Status:", status);
                    // console.log("Results:", results);

                    if ( status === google.maps.GeocoderStatus.OK && results[ 0 ] ) {
                         map.setCenter( results[ 0 ].geometry.location );
                         map.setZoom( 18 );
                    } else {
                         console.error( "No se pudo encontrar el lugar:", inputText );
                    }
               } );
          }
     } );

     //? Botón para volver a tu ubicación inicial
     const locateButton = document.getElementById( "locate-button" );
     locateButton.addEventListener( "click", goToMyLocation );

     // Obtener la ubicación actual del usuario
     if ( "geolocation" in navigator ) {
          navigator.geolocation.getCurrentPosition( function ( position ) {
               const userLatLng = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
               };
               // Actualizar la posición del marcador a la ubicación del usuario
               myLocationMarker.setPosition( userLatLng );
               map.setCenter( userLatLng );
          } );
     }
}

// Función para volver a tu ubicación inicial
function goToMyLocation() {
     map.setCenter( myLocationMarker.getPosition() );
     map.setZoom( 10 );
}

//* -------------------------------------------------------------------------------------

//! Función para mostrar u ocultar los marcadores de un conjunto específico
function toggleMarcadores( marcadores, visible ) {
     if ( visible ) {
          marcadores.forEach( marker => marker.setMap( null ) ); // Oculta cada marcador
     } else {
          marcadores.forEach( marker => marker.setMap( map ) ); // Muestra cada marcador
     }
};

//* BOTÓN BUILDINGS ****************

//! Función para mostrar NEW BUILDINGS

function cargarMarcadoresNewBuildings() {
     const endpoint = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/New%20Buildings/Fiware_Buildings_NewBuildings-00001?sp=r&st=2024-06-01T10:24:46Z&se=2090-01-01T19:24:46Z&sv=2022-11-02&sr=b&sig=ZPMSJa5sRrTyLWd0t%2FgExVaS9hXxVIQdQchzXN4zAJY%3D';
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

     fetch( proxyUrl )
          .then( response => {
               if ( !response.ok ) {
                    throw new Error( `Error al obtener datos del proxy: ${ response.statusText }` );
               }
               return response.json();
          } )
          .then( data => {
               data.buildings0008.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         id,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/newBuildingsQubo.svg"
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              // Buscar si existe un infobox pinneado para este edificio
                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-building-id="${ name }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( 'highlight' );
                                   setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                   return;
                              }

                              // Buscar un infobox no pinneado o crear uno nuevo
                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( 'div' );
                                   currentInfoBox.className = 'info-box';
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( 'data-building-id', name );
                              currentInfoBox.style.display = "flex";
                              currentInfoBox.innerHTML = `
        <div class="info-header">
            <img src="${ STATIC_IMAGES.otherBuildings }" alt="Property" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">${ category }</span>
                        <div class="badge-location nameContainer">
                            <span>${ name }</span>
                            <button class="expand-btn" title="Ver más">⋯</button>
                            <span>${ addressLocality }, ${ addressRegion }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                <button class="action-btn pin-btn" title="Fijar ventana">
                    <i class="action-icon">📌</i>
                </button>
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>

        <div class="info-content">
            <div class="info-section">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-item id-container">
                            <label for="codigo">Código identificador</label>
                            <div class="id-value-container">
                                <span>${ id }</span>
                                <button class="copy-btn" title="Copiar código">
                                    <i class="copy-icon">📋</i>
                                </button>
                            </div>
                        </div>
                        <div class="info-item">
                            <label for="direccion">Dirección</label>
                            <span>${ streetAddress }, ${ postalCode }</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <label for="distrito">Distrito</label>
                            <span>${ district }</span>
                        </div>
                        <div class="info-item">
                            <label for="ubicacion">Localización</label>
                            <span>${ addressLocality }, ${ addressRegion }</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="description">
                <label>Descripción</label>
                <p>${ description }</p>
            </div>
        </div>
    `;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( '.info-box' );
                                   if ( infoBox.classList.contains( 'pinned' ) ) {
                                        // Desfijar
                                        infoBox.classList.remove( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        // Fijar
                                        infoBox.classList.add( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";
                                   }
                              } );

                              currentInfoBox.querySelector( "#cerrar-info-box" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( {
                                                  title: `${ category } - ${ name }`,
                                                  text: `${ description }`,
                                                  url: window.location.href
                                             } );
                                        } else {
                                             await navigator.clipboard.writeText( window.location.href );
                                             showNotification( '¡Enlace copiado!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );

                              currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                   try {
                                        await navigator.clipboard.writeText( name );
                                        showNotification( '¡Código copiado!' );
                                   } catch ( error ) {
                                        console.error( 'Error al copiar:', error );
                                   }
                              } );
                              const expandBtn = currentInfoBox.querySelector( ".expand-btn" );
                              expandBtn.addEventListener( "click", function () {
                                   const badgeLocation = this.closest( '.badge-location' );
                                   badgeLocation.classList.toggle( 'expanded' );
                                   this.textContent = badgeLocation.classList.contains( 'expanded' ) ? '×' : '⋯';
                              } );
                         } );

                         markersNewBuildings.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de New Buildings:", error ) );
}

const eventNewBuildings = document.getElementById( "newBuildings-sub-nav-item" );
let markersNewBuildings = []; // Array para almacenar los marcadores de parcelas
let newBuildingsVisible = false; // Bandera para el estado de visibilidad

eventNewBuildings.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersNewBuildings, newBuildingsVisible );
     newBuildingsVisible = !newBuildingsVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersNewBuildings.length === 0 && newBuildingsVisible ) {
          cargarMarcadoresNewBuildings(); // Llama a la función para cargar los marcadores de parcelas
     }
} );


//! Función para mostrar HOUSES
const cargarYMostrarMarcadoresCasas = async () => {
     try {
          const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Houses/Fiware_Buildings_Houses-00001?sp=r&st=2024-03-31T08:25:20Z&se=2090-01-01T17:25:20Z&sv=2022-11-02&sr=b&sig=gYyNiUSwKU5upO86hX1DgDGRmoosucVSPcYZ%2BxGSnHY%3D";
          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

          const response = await fetch( proxyUrl );
          const data = await response.json();

          // Precargar todas las imágenes al recibir los datos
          data.buildings0007.forEach( item => {
               if ( item.thumbnail && item.thumbnail.value ) {
                    const img = new Image();
                    img.src = item.thumbnail.value;
               }
          } );

          data.buildings0007.forEach( item => {
               const parsedData = parseFiwareData( item );
               if ( parsedData.ubicacion ) {
                    const houseMarker = new google.maps.Marker( {
                         position: { lat: parsedData.ubicacion[ 1 ], lng: parsedData.ubicacion[ 0 ] },
                         map: map,
                         title: parsedData.name,
                         icon: "./assets/housesQubo.svg"
                    } );

                    houseMarker.addListener( 'click', () => {
                         const idWithoutPrefix = item.id.replace( /^building_ide_/, '' );
                         const capitalizedCategory = parsedData.category;
                         const parkingInfo = item.annexIdealista.value.parkingSpace.hasParkingSpace ? "Sí" : "No";
                         const parkingIncluded = item.annexIdealista.value.parkingSpace.isParkingSpaceIncludedInPrice ? "Sí" : "No";

                         // Buscar si existe un infobox pinneado para esta casa
                         const existingPinnedBox = document.querySelector( `.info-box.pinned[data-house-id="${ idWithoutPrefix }"]` );
                         if ( existingPinnedBox ) {
                              existingPinnedBox.classList.add( 'highlight' );
                              setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                              return;
                         }

                         // Buscar un infobox no pinneado o crear uno nuevo
                         let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                         if ( !currentInfoBox ) {
                              currentInfoBox = document.createElement( 'div' );
                              currentInfoBox.className = 'info-box';
                              document.body.appendChild( currentInfoBox );
                         }

                         currentInfoBox.setAttribute( 'data-house-id', idWithoutPrefix );
                         currentInfoBox.style.display = "flex";


                         currentInfoBox.innerHTML = `
        <div class="info-header">
            <img src="${ item.thumbnail.value }" alt="Property" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">${ capitalizedCategory }</span>
                        <div class="badge-location nameContainer">
                            <span>${ parsedData.name }</span>
                            <span>${ parsedData.addressLocality }, ${ parsedData.addressRegion }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                <button class="action-btn pin-btn" title="Fijar ventana">
                        <i class="action-icon">📌</i>
                    </button>
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>

        <div class="info-content">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item">
                        <label for="codigo">Código identificador</label>
                        <div class="id-value-container">
                            <span>${ idWithoutPrefix }</span>
                            <button class="copy-btn" title="Copiar código">
                                <i class="copy-icon">📋</i>
                            </button>
                        </div>
                    </div>
                    <div class="info-item">
                        <label for="distrito">Distrito</label>
                        <span>${ parsedData.district }</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <label for="operacion">Tipo de operación</label>
                        <span>${ item.annexIdealista.value.operation.charAt( 0 ).toUpperCase() + item.annexIdealista.value.operation.slice( 1 ) }</span>
                    </div>
                    <div class="info-item">
                        <label for="ubicacion">Localización</label>
                        <span>${ parsedData.addressLocality }, ${ parsedData.addressRegion }</span>
                    </div>
                </div>
            </div>

            <div class="features-grid">
                <label>Características</label>
                <div class="features-list">
                    <div class="feature-item">
                        <span class="feature-icon">💰</span>
                        <span class="feature-text">${ ( item.annexIdealista.value.price ).toLocaleString( 'es-ES' ) } €</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📏</span>
                        <span class="feature-text">${ item.annexIdealista.value.size } m²</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🛏️</span>
                        <span class="feature-text">${ item.annexIdealista.value.rooms } habitaciones</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🚿</span>
                        <span class="feature-text">${ item.annexIdealista.value.bathrooms } baños</span>
                    </div>
                    ${ parkingInfo === "Sí" ? `
                    <div class="feature-item">
                        <span class="feature-icon">🚗</span>
                        <span class="feature-text">Parking ${ parkingIncluded === "Sí" ? "incluido" : "no incluido" }</span>
                    </div>
                    ` : '' }
                </div>
            </div>

            <div class="description">
                <label>Descripción</label>
                <p>${ parsedData.description }</p>
            </div>

            <div class="external-links">
                <label>Enlaces</label>
                <a href="${ parsedData.source }" target="_blank" class="external-link">
                    <span>Ver en Idealista</span>
                </a>
            </div>
        </div>
    `;
                         currentInfoBox.querySelector( "#cerrar-info-box" ).addEventListener( "click", () => {
                              currentInfoBox.remove(); // Usar remove() en lugar de display none
                         } );
                         const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                         pinBtn.addEventListener( "click", ( e ) => {
                              const infoBox = e.target.closest( '.info-box' );
                              if ( infoBox.classList.contains( 'pinned' ) ) {
                                   // Desfijar
                                   infoBox.classList.remove( 'pinned' );
                                   pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                   pinBtn.title = "Fijar ventana";
                              } else {
                                   // Fijar
                                   infoBox.classList.add( 'pinned' );
                                   pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                   pinBtn.title = "Desfijar ventana";

                                   // Crear nuevo infobox para futuras propiedades y hacerlo arrastrable
                                   const newInfoBox = document.createElement( 'div' );
                                   newInfoBox.className = 'info-box';
                                   newInfoBox.style.display = 'none';
                                   document.body.appendChild( newInfoBox );

                                   // Reinicializar el arrastre para el nuevo infobox
                                   const nameContainer = newInfoBox.querySelector( '.nameContainer' );
                                   if ( nameContainer ) {
                                        hacerArrastrable( newInfoBox, nameContainer );
                                   }
                              }
                         } );
                         currentInfoBox.querySelector( ".share-btn" )?.addEventListener( "click", async () => {
                              try {
                                   if ( navigator.share ) {
                                        await navigator.share( {
                                             title: `${ capitalizedCategory } - ${ parsedData.name }`,
                                             text: `${ parsedData.description }`,
                                             url: parsedData.source
                                        } );
                                   } else {
                                        await navigator.clipboard.writeText( parsedData.source );
                                        showNotification( '¡Enlace copiado!' );
                                   }
                              } catch ( error ) {
                                   console.error( 'Error al compartir:', error );
                              }
                         } );

                         currentInfoBox.querySelector( ".copy-btn" )?.addEventListener( "click", async () => {
                              try {
                                   await navigator.clipboard.writeText( idWithoutPrefix );
                                   showNotification( '¡Código copiado!' );
                              } catch ( error ) {
                                   console.error( 'Error al copiar:', error );
                              }
                         } );
                    } );

                    markersHouses.push( houseMarker ); // Añade el marcador al array de casas
               }
          } );
     } catch ( error ) {
          console.error( "Error fetching houses:", error );
     }
};

// Evento botón HOUSES
const eventHouses = document.getElementById( "houses-sub-nav-item" );
let markersHouses = []; // Array para almacenar los marcadores de casas
let housesVisible = false; // Bandera para el estado de visibilidad

eventHouses.addEventListener( 'click', async () => {
     // Alternar la visibilidad de los marcadores de casas
     toggleMarcadores( markersHouses, housesVisible );
     housesVisible = !housesVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     if ( markersHouses.length === 0 && housesVisible ) {
          await cargarYMostrarMarcadoresCasas();
     }
} );


//! Función para mostrar OFFICES
const cargarYMostrarMarcadoresOficinas = async () => {
     try {
          const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Offices/Fiware_Buildings_Offices-00001?sp=r&st=2024-03-09T08:46:32Z&se=2090-01-01T16:46:32Z&sv=2022-11-02&sr=b&sig=U9Oi9KQFp%2FdQZqhjzQFSgm8JgtfOldIQvCUHdTYv4nY%3D";
          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

          const response = await fetch( proxyUrl );
          if ( !response.ok ) {
               throw new Error( `Error al obtener datos del proxy: ${ response.statusText }` );
          }

          const data = await response.json();

          data.buildings0009.forEach( item => {
               const ubicacion = item.location.value.coordinates;

               const officeMarker = new google.maps.Marker( {
                    position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                    map: map,
                    title: item.name.value,
                    icon: "./assets/officesQubo.svg"
               } );

               officeMarker.addListener( 'click', () => {
                    const infoBox = document.querySelector( ".info-box" );
                    infoBox.style.display = "flex";
                    const idWithoutPrefix = item.id.replace( /^property_/, '' );
                    const capitalizedCategory = item.category.value[ 0 ].charAt( 0 ).toUpperCase() + item.category.value[ 0 ].slice( 1 );
                    infoBox.innerHTML = `
        <div class="info-header">
            <img src="${ STATIC_IMAGES.offices }" alt="Office" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">${ capitalizedCategory }</span>
                        <div class="badge-location">
                            <span>${ item.name.value }</span>
                            <span>${ item.address.value.addressLocality }, ${ item.address.value.district }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>
        <div class="info-content">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item id-container">
                        <label for="codigo">Código identificador</label>
                        <div class="id-value-container">
                            <span>${ idWithoutPrefix }</span>
                            <button class="copy-btn" title="Copiar código">
                                <i class="copy-icon">📋</i>
                            </button>
                        </div>
                    </div>
                    <div class="info-item">
                        <label for="direccion">Address</label>
                        <span>${ item.address.value.streetAddress }</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <label for="distrito">District</label>
                        <span>${ item.address.value.district }</span>
                    </div>
                    <div class="info-item">
                        <label for="ubicacion">Localización</label>
                        <span>${ item.address.value.addressLocality }, ${ item.address.value.addressRegion }</span>
                    </div>
                </div>
            </div>

            <div class="description">
                <label>Description</label>
                <p>${ item.description.value }</p>
            </div>

            <div class="features-grid">
                <label>Características destacadas</label>
                <div class="features-list">
                    <div class="feature-item">
                        <span class="feature-icon">🚗</span>
                        <span class="feature-text">2 plazas de garaje</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">❄️</span>
                        <span class="feature-text">Aire acondicionado</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🛗</span>
                        <span class="feature-text">Ascensor</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🏢</span>
                        <span class="feature-text">Edificio comercial</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🚽</span>
                        <span class="feature-text">Baño</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✨</span>
                        <span class="feature-text">Seminuevo</span>
                    </div>
                </div>
            </div>
        </div>
    `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                         infoBox.style.display = "none";
                    } );
                    document.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                         try {
                              await navigator.clipboard.writeText( idWithoutPrefix );
                              showNotification( '¡Código copiado!' );
                         } catch ( error ) {
                              console.error( 'Error al copiar:', error );
                         }
                    } );
                    // Event listener para compartir
                    document.querySelector( ".share-btn" ).addEventListener( "click", async () => {


                         try {
                              if ( navigator.share ) {
                                   await navigator.share( {
                                        title: `Office ${ item.name.value }`,
                                        text: `Información sobre ${ item.name.value } en ${ item.address.value.addressRegion }`,
                                        url: window.location.href
                                   } );
                              } else {
                                   await navigator.clipboard.writeText( window.location.href );
                                   showNotification( '¡Enlace copiado!' );
                              }
                         } catch ( error ) {
                              console.error( 'Error al compartir:', error );
                         }
                    } );

               } );

               markersOffices.push( officeMarker ); // Añade el marcador al array de oficinas
          } );
     } catch ( error ) {
          console.error( "Error fetching offices:", error );
     }
};
// Función para mostrar notificaciones
function showNotification( message ) {
     const notification = document.createElement( 'div' );
     notification.style.cssText = `
         position: fixed;
         top: 20px;
         right: 20px;
         background: rgba(8, 236, 196, 0.9);
         color: black;
         padding: 8px 16px;
         border-radius: 4px;
         font-size: 14px;
         z-index: 1000000;
         transition: opacity 0.3s ease;
     `;
     notification.textContent = message;
     document.body.appendChild( notification );

     setTimeout( () => {
          notification.style.opacity = '0';
          setTimeout( () => notification.remove(), 300 );
     }, 2000 );
}

// Evento botón OFFICES
const eventOffices = document.getElementById( "offices-sub-nav-item" );
let markersOffices = []; // Array para almacenar los marcadores de oficinas
let officesVisible = false; // Bandera para el estado de visibilidad

eventOffices.addEventListener( 'click', async () => {
     // Alternar la visibilidad de los marcadores de oficinas
     toggleMarcadores( markersOffices, officesVisible );
     officesVisible = !officesVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     if ( markersOffices.length === 0 && officesVisible ) {
          await cargarYMostrarMarcadoresOficinas();
     }
} );



//! Función para mostrar COMMERCIAL OR INDUSTRIAL
function cargarMarcadoresCommercialOrIndustrial() {
     const endpoint = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Commercial%20%26%20Industrial/Fiware_Buildings_CommercialAndIndustrial_-00001?sp=r&st=2024-06-01T11:03:07Z&se=2090-01-01T20:03:07Z&sv=2022-11-02&sr=b&sig=lTkeDvm2Nc8gekaWO296rAkmdyZIIblaZxw%2BeyA16kg%3D';
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;
     fetch( proxyUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0005.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         id,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/commercialOrIndustrialQubo.svg"
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              // Buscar si existe un infobox pinneado para este edificio
                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-building-id="${ name }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( 'highlight' );
                                   setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                   return;
                              }

                              // Buscar un infobox no pinneado o crear uno nuevo
                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( 'div' );
                                   currentInfoBox.className = 'info-box';
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( 'data-building-id', name );
                              currentInfoBox.style.display = "flex";
                              currentInfoBox.innerHTML = `
        <div class="info-header">
            <img src="${ STATIC_IMAGES.commercialIndustrial }" alt="Propiedad Comercial" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">${ category }</span>
                        <div class="badge-location nameContainer">
                            <span>${ name }</span>
                            <span>${ addressLocality }, ${ addressRegion }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn pin-btn" title="Fijar ventana">
                        <i class="action-icon">📌</i>
                    </button>
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>

        <div class="info-content">
            <div class="info-section">
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-item id-container">
                            <label for="codigo">Código identificador</label>
                            <div class="id-value-container">
                                <span>${ id }</span>
                                <button class="copy-btn" title="Copiar código">
                                    <i class="copy-icon">📋</i>
                                </button>
                            </div>
                        </div>
                        <div class="info-item">
                            <label for="direccion">Dirección</label>
                            <span>${ streetAddress }, ${ postalCode }</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="info-item">
                            <label for="distrito">Distrito</label>
                            <span>${ district }</span>
                        </div>
                        <div class="info-item">
                            <label for="ubicacion">Localización</label>
                            <span>${ addressLocality }, ${ addressRegion }</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="description">
                <label>Descripción</label>
                <p>${ description }</p>
            </div>
        </div>
    `;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( '.info-box' );
                                   if ( infoBox.classList.contains( 'pinned' ) ) {
                                        // Desfijar
                                        infoBox.classList.remove( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        // Fijar
                                        infoBox.classList.add( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";
                                   }
                              } );
                              currentInfoBox.querySelector( "#cerrar-info-box" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( {
                                                  title: `${ category } - ${ name }`,
                                                  text: `${ description }`,
                                                  url: window.location.href
                                             } );
                                        } else {
                                             await navigator.clipboard.writeText( window.location.href );
                                             showNotification( '¡Enlace copiado!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );
                              currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                   try {
                                        await navigator.clipboard.writeText( id );
                                        showNotification( '¡Código copiado!' );
                                   } catch ( error ) {
                                        console.error( 'Error al copiar:', error );
                                   }
                              } );
                         } );

                         markersCommercialOrindustrial.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Commercial or Industrial:", error ) );
};
const eventCommercialOrIndustrial = document.getElementById( "commercialOrIndustrial-sub-nav-item" );
let markersCommercialOrindustrial = []; // Array para almacenar los marcadores de parcelas
let commercialOrIndustrialVisible = false; // Bandera para el estado de visibilidad

eventCommercialOrIndustrial.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersCommercialOrindustrial, commercialOrIndustrialVisible );
     commercialOrIndustrialVisible = !commercialOrIndustrialVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersCommercialOrindustrial.length === 0 && commercialOrIndustrialVisible ) {
          cargarMarcadoresCommercialOrIndustrial(); // Llama a la función para cargar los marcadores de parcelas
     }
} );





//! Función para mostrar GARAGES
const cargarYMostrarMarcadoresGarages = async () => {
     try {
          const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Garages/Fiware_Buildings_Garages-00001?sp=r&st=2024-03-09T08:44:49Z&se=2090-01-01T16:44:49Z&sv=2022-11-02&sr=b&sig=gRC1J4u547MhsC44oA5TO1h4N9%2F0kpozqY89RRzazfA%3D";
          const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

          const response = await fetch( proxyUrl );
          const data = await response.json();

          data.buildings0006.forEach( item => {
               const ubicacion = item.location.value.coordinates;
               const name = item.name.value;
               const neighborhood = item.address.value.neighborhood;
               const district = item.address.value.district;
               const addressLocality = item.address.value.addressLocality;
               const addressRegion = item.address.value.addressRegion;
               const description = item.description.value;
               const id = item.id;

               if ( ubicacion && name ) {
                    const garageMarker = new google.maps.Marker( {
                         position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                         map: map,
                         title: name,
                         icon: "./assets/garagesQubo.svg"
                    } );

                    garageMarker.addListener( 'click', () => {
                         // Buscar si existe un infobox pinneado para este garage
                         const existingPinnedBox = document.querySelector( `.info-box.pinned[data-building-id="${ name }"]` );
                         if ( existingPinnedBox ) {
                              existingPinnedBox.classList.add( 'highlight' );
                              setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                              return;
                         }

                         // Buscar un infobox no pinneado o crear uno nuevo
                         let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                         if ( !currentInfoBox ) {
                              currentInfoBox = document.createElement( 'div' );
                              currentInfoBox.className = 'info-box';
                              document.body.appendChild( currentInfoBox );
                         }

                         currentInfoBox.setAttribute( 'data-building-id', name );
                         currentInfoBox.style.display = "flex";
                         currentInfoBox.innerHTML = `
                             <div class="info-header">
                                 <img src="${ STATIC_IMAGES.garages }" alt="Garaje" class="property-image"/>
                                 <div class="header-bar">
                                     <div class="property-badges">
                                         <div class="badge-container">
                                             <span class="badge primary">Garaje</span>
                                             <div class="badge-location nameContainer">
                                                 <span>${ name }</span>
                                                 <span>${ neighborhood ? `${ neighborhood }, ` : '' }${ district || '' }</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div class="action-buttons">
                                         <button class="action-btn pin-btn" title="Fijar ventana">
                                             <i class="action-icon">📌</i>
                                         </button>
                                         <button class="action-btn share-btn" title="Compartir">
                                             <i class="action-icon">📤</i>
                                         </button>
                                         <button class="action-btn close-btn" title="Cerrar">
                                             <i class="action-icon">✕</i>
                                         </button>
                                     </div>
                                 </div>
                             </div>
                     
                             <div class="info-content">
                                 <div class="info-section">
                                     <div class="info-grid">
                                         <div class="info-row">
                                             <div class="info-item id-container">
                                                 <label for="codigo">Código identificador</label>
                                                 <div class="id-value-container">
                                                     <span>${ id }</span>
                                                     <button class="copy-btn" title="Copiar código">
                                                         <i class="copy-icon">📋</i>
                                                     </button>
                                                 </div>
                                             </div>
                                              ${ district ? `
                                             <div class="info-item">
                                                  <label for="distrito">Distrito</label>
                                                  <span>${ district }</span>
                                             </div>
                                        ` : '' }
                                         </div>
                                         <div class="info-row">
                                             ${ neighborhood ? `
                                                 <div class="info-item">
                                                     <label for="barrio">Barrio</label>
                                                     <span>${ neighborhood }</span>
                                                 </div>
                                             ` : '' }
                                             <div class="info-item">
                                                 <label for="ubicacion">Localización</label>
                                                 <span>${ addressLocality }, ${ addressRegion }</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                     
                                 <div class="description">
                                     <label>Descripción</label>
                                     <p>${ description }</p>
                                 </div>
                             </div>
                         `;

                         // Event listeners
                         const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                         pinBtn.addEventListener( "click", ( e ) => {
                              const infoBox = e.target.closest( '.info-box' );
                              if ( infoBox.classList.contains( 'pinned' ) ) {
                                   infoBox.classList.remove( 'pinned' );
                                   pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                   pinBtn.title = "Fijar ventana";
                              } else {
                                   infoBox.classList.add( 'pinned' );
                                   pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                   pinBtn.title = "Desfijar ventana";
                              }
                         } );

                         currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                              currentInfoBox.remove();
                         } );

                         currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                              try {
                                   if ( navigator.share ) {
                                        await navigator.share( {
                                             title: `Garaje - ${ name }`,
                                             text: description,
                                             url: window.location.href
                                        } );
                                   } else {
                                        await navigator.clipboard.writeText( window.location.href );
                                        showNotification( '¡Enlace copiado!' );
                                   }
                              } catch ( error ) {
                                   console.error( 'Error al compartir:', error );
                              }
                         } );

                         currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                              try {
                                   await navigator.clipboard.writeText( id );
                                   showNotification( '¡Código copiado!' );
                              } catch ( error ) {
                                   console.error( 'Error al copiar:', error );
                              }
                         } );
                    } );

                    markersGarages.push( garageMarker );
               }
          } );
     } catch ( error ) {
          console.error( "Error fetching garages:", error );
     }
};







// Evento botón GARAGES
const eventGarages = document.getElementById( "garages-sub-nav-item" );
let markersGarages = []; // Array para almacenar los marcadores de garajes
let garagesVisible = false; // Bandera para el estado de visibilidad

eventGarages.addEventListener( 'click', async () => {
     // Alternar la visibilidad de los marcadores de garajes
     toggleMarcadores( markersGarages, garagesVisible );
     garagesVisible = !garagesVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     if ( markersGarages.length === 0 && garagesVisible ) {
          await cargarYMostrarMarcadoresGarages();
     }
} );
//! BORRAR SI DA FALLOS
// Función de utilidad para manejar valores undefined de manera segura
function safeAccess( obj, ...keys ) {
     const defaultValue = keys.pop(); // El último argumento es el valor predeterminado
     return keys.reduce( ( acc, key ) => ( acc && acc[ key ] !== undefined ) ? acc[ key ] : defaultValue, obj );
};


//! Funcion para mostrar PARCELS
function cargarMarcadoresParcels() {
     const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Parcels/Fiware_Buildings_Parcels-00001?sp=r&st=2024-02-16T19:50:11Z&se=2090-01-01T03:50:11Z&sv=2022-11-02&sr=b&sig=sMy7J4ZHbofqEvbKuA8BnrHesnkwEHmbSYVxYnlFgTk%3D";
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

     fetch( proxyUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0003.forEach( item => {
                    const coordinates = item.location?.value?.coordinates;
                    // Si no hay coordenadas válidas o son null, saltamos este item
                    if ( !coordinates || coordinates[ 0 ] === null || coordinates[ 1 ] === null ) return;

                    const name = item.name?.value;
                    const description = item.description?.value;
                    const owner = item.owner?.object?.[ 0 ];
                    const address = item.address?.value;
                    const streetAddress = address?.streetAddress;
                    const addressLocality = address?.addressLocality;
                    const addressRegion = address?.addressRegion;

                    if ( coordinates && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: coordinates[ 1 ], lng: coordinates[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/quboParcels.svg"
                         } );

                         marker.addListener( "click", () => {
                              // Buscar si existe un infobox pinneado para esta parcela
                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-building-id="${ name }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( 'highlight' );
                                   setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                   return;
                              }

                              // Buscar un infobox no pinneado o crear uno nuevo
                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( 'div' );
                                   currentInfoBox.className = 'info-box';
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( 'data-building-id', name );
                              currentInfoBox.style.display = "flex";
                              currentInfoBox.innerHTML = `
                             <div class="info-header">
                                 <img src="${ STATIC_IMAGES.parcels }" alt="Parcela" class="property-image"/>
                                 <div class="header-bar">
                                     <div class="property-badges">
                                         <div class="badge-container">
                                             <span class="badge primary">Terreno</span>
                                             <div class="badge-location nameContainer">
                                                 <span>${ name }</span>
                                                 <span>${ addressLocality || '' }</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div class="action-buttons">
                                         <button class="action-btn pin-btn" title="Fijar ventana">
                                             <i class="action-icon">📌</i>
                                         </button>
                                         <button class="action-btn share-btn" title="Compartir">
                                             <i class="action-icon">📤</i>
                                         </button>
                                         <button class="action-btn close-btn" title="Cerrar">
                                             <i class="action-icon">✕</i>
                                         </button>
                                     </div>
                                 </div>
                             </div>
 
                             <div class="info-content">
                                 <div class="info-section">
                                     <div class="info-grid">
                                         <div class="info-row">
                                             <div class="info-item id-container">
                                                 <label for="codigo">Código identificador</label>
                                                 <div class="id-value-container">
                                                     <span>${ item.id || '' }</span>
                                                     <button class="copy-btn" title="Copiar código">
                                                         <i class="copy-icon">📋</i>
                                                     </button>
                                                 </div>
                                             </div>
                                             ${ streetAddress ? `
                                                 <div class="info-item">
                                                     <label for="direccion">Dirección</label>
                                                     <span>${ streetAddress }</span>
                                                 </div>
                                             ` : '' }
                                         </div>
                                         <div class="info-row">
                                             ${ owner ? `
                                                 <div class="info-item">
                                                     <label for="propietario">Propietario</label>
                                                     <span>${ owner }</span>
                                                 </div>
                                             ` : '' }
                                             <div class="info-item">
                                                 <label for="ubicacion">Localización</label>
                                                 <span>${ addressLocality }${ addressRegion ? `, ${ addressRegion }` : '' }</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
 
                                 ${ description ? `
                                     <div class="description">
                                         <label>Descripción</label>
                                         <p>${ description }</p>
                                     </div>
                                 ` : '' }
                             </div>
                         `;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( '.info-box' );
                                   if ( infoBox.classList.contains( 'pinned' ) ) {
                                        infoBox.classList.remove( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        infoBox.classList.add( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";
                                   }
                              } );

                              currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( {
                                                  title: `Terreno - ${ name }`,
                                                  text: description || '',
                                                  url: window.location.href
                                             } );
                                        } else {
                                             await navigator.clipboard.writeText( window.location.href );
                                             showNotification( '¡Enlace copiado!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );

                              currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                   try {
                                        await navigator.clipboard.writeText( item.id || '' );
                                        showNotification( '¡Código copiado!' );
                                   } catch ( error ) {
                                        console.error( 'Error al copiar:', error );
                                   }
                              } );
                         } );

                         markersParcels.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de parcelas:", error ) );
}
const eventparcels = document.getElementById( "parcels-sub-nav-item" );
let markersParcels = []; // Array para almacenar los marcadores de parcelas
let parcelsVisible = false; // Bandera para el estado de visibilidad

eventparcels.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersParcels, parcelsVisible );
     parcelsVisible = !parcelsVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersParcels.length === 0 && parcelsVisible ) {
          cargarMarcadoresParcels(); // Llama a la función para cargar los marcadores de parcelas
     }
} );

//! Función para mostrar OTHER BUILDINGS
// function cargarMarcadoresOtherBuildings() {
//      fetch('https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Other%20Buildings/Fiware_Buildings_OtherBuildings-00001?sp=r&st=2024-06-01T11:26:15Z&se=2090-01-01T20:26:15Z&sv=2022-11-02&sr=b&sig=cadPnEhyRjqbDTyvyM51GdiGXJwJ6FMAlh7DwqiUg1I%3D')
//      .then( response => response.json())
//      .then( data => {
//           data.buildings0010.forEach( item => {
//                const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
//                     const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
//                     const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );

//                     const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
//                     const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );
//                     const addressCountry = safeAccess( item, 'address', 'value', 'addressCountry', 'Direccion no disponible' );
//                     const neighborhood = safeAccess( item, 'address', 'value', 'neighborhood', 'Barrio no disponible' );
//                     const district = safeAccess( item, 'address', 'value', 'district', 'Distrito no disponible' );

//                     if ( ubicacion && name ) {
//                          const marker = new google.maps.Marker( {
//                               position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
//                               map: map,
//                               title: name,
//                               icon: "./assets/otherBuildingsQubo.svg"
//                          } );

//                          // Agrega un evento click a cada marcador para mostrar el infoBox
//                          marker.addListener( "click", () => {
//                               const infoBox = document.querySelector( ".info-box" );
//                               infoBox.style.display = "flex";
//                               infoBox.innerHTML = `
//                               <div class='nameContainer'>
//                                    <p>Terreno</p>
//                                    <p>${ name }</p>
//                               </div>
//                               <img src='${STATIC_IMAGES.otherBuildings}'>

//                               <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
//                               <p>Neighborhood: ${ neighborhood }</p>
//                               <p>District: ${ district }</p>
//                               <p>Country: ${ addressCountry }</p>
//                               <p>${ description }</p>
//                               <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                               <button class='share'><img src='./assets/shareIcon.svg'></button>
//                          `;
//                               document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
//                                    infoBox.style.display = "none";
//                               } );
//                          } );

//                          markersOtherBuildings.push( marker ); // Añade el marcador al array de parcelas
//                     }
//           })
//      })
//      .catch( error => console.error( "Error al cargar los marcadores de Other Buildings:", error ) );
// };
// const eventOtherBuildings = document.getElementById( "otherBuilding-sub-nav-item" );
// let markersOtherBuildings = []; // Array para almacenar los marcadores de parcelas
// let otherBuildingsVisible = false; // Bandera para el estado de visibilidad

// eventOtherBuildings.addEventListener( "click", () => {
//      // Alternar la visibilidad de los marcadores de parcelas
//      toggleMarcadores( markersOtherBuildings, otherBuildingsVisible );
//      otherBuildingsVisible = !otherBuildingsVisible; // Cambia la bandera de visibilidad

//      // Si los marcadores aún no se han cargado, cargarlos
//      if ( markersOtherBuildings.length === 0 && otherBuildingsVisible ) {
//           cargarMarcadoresOtherBuildings(); // Llama a la función para cargar los marcadores de parcelas
//      }
// } );


//! Función para mostrar ICONIC
function cargarMarcadoresIconic() {
     const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Iconic/Fiware_Buildings_Iconic-00001?sp=r&st=2024-02-16T19:44:04Z&se=2090-01-01T07:45:04Z&sv=2022-11-02&sr=b&sig=mvEnx2llvD30oO%2BZlFqgitpIav91hgqovdRH7jB4IOs%3D";
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;

     fetch( proxyUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0004.forEach( item => {
                    const ubicacion = item.location?.value?.coordinates;
                    const name = item.name?.value;
                    const id = item.id;
                    const category = item.category?.value?.[ 0 ];
                    const description = item.description?.value;
                    const address = item.address?.value;
                    const streetAddress = address?.streetAddress;
                    const postalCode = address?.postalCode;
                    const addressLocality = address?.addressLocality;
                    const addressRegion = address?.addressRegion;

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/quboIconic.svg"
                         } );

                         marker.addListener( "click", () => {
                              const existingPinnedBox = document.querySelector( `.info-box.pinned[data-building-id="${ name }"]` );
                              if ( existingPinnedBox ) {
                                   existingPinnedBox.classList.add( 'highlight' );
                                   setTimeout( () => existingPinnedBox.classList.remove( 'highlight' ), 1000 );
                                   return;
                              }

                              let currentInfoBox = document.querySelector( ".info-box:not(.pinned)" );
                              if ( !currentInfoBox ) {
                                   currentInfoBox = document.createElement( 'div' );
                                   currentInfoBox.className = 'info-box';
                                   document.body.appendChild( currentInfoBox );
                              }

                              currentInfoBox.setAttribute( 'data-building-id', name );
                              currentInfoBox.style.display = "flex";
                              currentInfoBox.innerHTML = `
                             <div class="info-header">
                                 <img src="${ STATIC_IMAGES.iconic }" alt="Edificio Icónico" class="property-image"/>
                                 <div class="header-bar">
                                     <div class="property-badges">
                                         <div class="badge-container">
                                             <span class="badge primary">${ category }</span>
                                             <div class="badge-location nameContainer">
                                                 <span>${ name }</span>
                                                 <span>${ addressLocality }</span>
                                             </div>
                                         </div>
                                     </div>
                                     <div class="action-buttons">
                                         <button class="action-btn pin-btn" title="Fijar ventana">
                                             <i class="action-icon">📌</i>
                                         </button>
                                         <button class="action-btn share-btn" title="Compartir">
                                             <i class="action-icon">📤</i>
                                         </button>
                                         <button class="action-btn close-btn" title="Cerrar">
                                             <i class="action-icon">✕</i>
                                         </button>
                                     </div>
                                 </div>
                             </div>
 
                             <div class="info-content">
                                 <div class="info-section">
                                     <div class="info-grid">
                                         <div class="info-row">
                                             <div class="info-item id-container">
                                                 <label for="codigo">Código identificador</label>
                                                 <div class="id-value-container">
                                                     <span>${ id }</span>
                                                     <button class="copy-btn" title="Copiar código">
                                                         <i class="copy-icon">📋</i>
                                                     </button>
                                                 </div>
                                             </div>
                                             ${ streetAddress ? `
                                                 <div class="info-item">
                                                     <label for="direccion">Dirección</label>
                                                     <span>${ streetAddress }${ postalCode ? `, ${ postalCode }` : '' }</span>
                                                 </div>
                                             ` : '' }
                                         </div>
                                         <div class="info-row">
                                             <div class="info-item">
                                                 <label for="ubicacion">Localización</label>
                                                 <span>${ addressLocality }, ${ addressRegion }</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
 
                                 ${ description ? `
                                     <div class="description">
                                         <label>Descripción</label>
                                         <p>${ description }</p>
                                     </div>
                                 ` : '' }
                             </div>
                         `;

                              // Event listeners
                              const pinBtn = currentInfoBox.querySelector( ".pin-btn" );
                              pinBtn.addEventListener( "click", ( e ) => {
                                   const infoBox = e.target.closest( '.info-box' );
                                   if ( infoBox.classList.contains( 'pinned' ) ) {
                                        infoBox.classList.remove( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📌</i>';
                                        pinBtn.title = "Fijar ventana";
                                   } else {
                                        infoBox.classList.add( 'pinned' );
                                        pinBtn.innerHTML = '<i class="action-icon">📍</i>';
                                        pinBtn.title = "Desfijar ventana";
                                   }
                              } );

                              currentInfoBox.querySelector( ".close-btn" ).addEventListener( "click", () => {
                                   currentInfoBox.remove();
                              } );

                              currentInfoBox.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( {
                                                  title: `${ category } - ${ name }`,
                                                  text: description || '',
                                                  url: window.location.href
                                             } );
                                        } else {
                                             await navigator.clipboard.writeText( window.location.href );
                                             showNotification( '¡Enlace copiado!' );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );

                              currentInfoBox.querySelector( ".copy-btn" ).addEventListener( "click", async () => {
                                   try {
                                        await navigator.clipboard.writeText( id );
                                        showNotification( '¡Código copiado!' );
                                   } catch ( error ) {
                                        console.error( 'Error al copiar:', error );
                                   }
                              } );
                         } );

                         markersIconic.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Iconic:", error ) );
}

// Evento botón Iconic
const eventIconic = document.getElementById( "iconic-sub-nav-item" );
let markersIconic = []; // Array para almacenar los marcadores
let iconicVisible = false; // Bandera para el estado de visibilidad

eventIconic.addEventListener( "click", () => {
     // Cargar y mostrar los marcadores Iconic si aún no se han cargado
     if ( markersIconic.length === 0 ) {
          cargarMarcadoresIconic();
     }

     // Alternar la visibilidad de los marcadores
     toggleMarcadores( markersIconic, iconicVisible );
     iconicVisible = !iconicVisible; // Cambia la bandera de visibilidad
} );


//! Función para mostrar UNDER CONSTRUCTION

//* UNDER CONSTRUCTION
const underConstructionUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Under%20Construction/Buildings_UnderConstruction_RestrictedAreas.kmz?sp=r&st=2025-02-21T20:16:33Z&se=2099-02-22T04:16:33Z&sv=2022-11-02&sr=b&sig=73j1VsueLl3YvnhB62Ikua%2BSBneVRRCNU3DgSu4ZBoA%3D";

const botonUnderConstruction = document.getElementById( 'underConstruction-sub-nav-item' );
let kmlUnderConstruction = null;

botonUnderConstruction.addEventListener( 'click', () => {
     if ( kmlUnderConstruction ) {
          // Si la capa KML ya existe, alternar su visibilidad
          kmlUnderConstruction.setMap( kmlUnderConstruction.getMap() ? null : map );
     } else {
          // Si la capa KML no existe, crearla y añadirla al mapa
          kmlUnderConstruction = new google.maps.KmlLayer( {
               url: underConstructionUrl,
               map: map
          } );
     }
} );

//* BOTÓN HEALTH ****************
//! Función para mostrar HOSPITALS&CLINICS
const eventHospitals = document.getElementById( "hospital-clinics-nav-item" );
let markersHospital = []; // Array para almacenar los marcadores
let hospitalsVisible = false; // Bandera para el estado de visibilidad

// Event Hospitals
eventHospitals.addEventListener( "click", () => {
     // Si los marcadores ya están mostrados, los ocultamos
     if ( hospitalsVisible ) {
          markersHospital.forEach( marker => marker.setMap( null ) ); // Oculta cada marcador
          hospitalsVisible = false; // Actualiza la bandera de visibilidad
     } else {
          // Si los marcadores están ocultos, los mostramos
          if ( markersHospital.length > 0 ) {
               markersHospital.forEach( marker => marker.setMap( map ) ); // Muestra cada marcador
          } else {
               const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Hospitals%20%26%20Clinics/Fiware_Health_HospitalsAndClinics-00001?sp=r&st=2023-12-30T10:17:13Z&se=2090-01-01T18:17:13Z&sv=2022-11-02&sr=b&sig=9W9CmvHNvBDU7GhdmzMbkM5AP193N%2FFBRT1b5w4KFJ0%3D";
               const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;
               // Si es la primera vez, crea los marcadores
               fetch( proxyUrl )
                    .then( response => response.json() )
                    .then( data => {
                         data.buildings0002.forEach( item => {
                              const {
                                   id,
                                   ubicacion,
                                   name,
                                   category,
                                   description,
                                   streetAddress,
                                   postalCode,
                                   addressLocality,
                                   addressRegion,
                                   addressCountry,
                                   owner
                              } = parseFiwareData( item );
                              const marker = new google.maps.Marker( {
                                   position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                                   map: map,
                                   title: item.name.value,
                                   icon: "./assets/quboHospitals.svg"

                              } );


                              // Agrega un evento click a cada marcador para mostrar el infoBox
                              marker.addListener( "click", () => {
                                   const infoBox = document.querySelector( ".info-box" );
                                   infoBox.style.display = "flex";
                                   infoBox.innerHTML = `
                                   <div class='nameContainer'>
                                        <p>${ category }</p>
                                        <p>${ name }</p>
                                   </div>
                                   <img src='${ STATIC_IMAGES.hospital }'>
                                   <p>Address: <span>${ streetAddress }, ${ postalCode }</span></p>
                                   <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                                   <p>Country: <span>${ addressCountry }</span> </p>
                                   <p>Owner: <span>${ owner }</span> </p>
                                   <p>Description: <span>${ description }</span> </p>
                                   <p>ID: <span>${ id }</span> </p>
                                   <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                                   <button class='share'><img src='./assets/shareIcon.svg'></button>
                              `;
                                   document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                        infoBox.style.display = "none";
                                   } );
                              } );

                              markersHospital.push( marker ); // Añade el marcador al array
                         } );
                    } )
                    .catch( error => console.error( "Error al cargar los marcadores de hospitales:", error ) );
          }
          hospitalsVisible = true; // Actualiza la bandera de visibilidad
     }
}
);


//! Función para mostrar OPTICS, DENTISTIS ETC

// function cargarMarcadoresOpticsDentists() {
//      const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Optics%2C%20Dentists%2C%20etc/Fiware_Health_DentistsOpticsEtc-00001?sp=r&st=2024-06-02T10:05:50Z&se=2090-01-01T19:05:50Z&sv=2022-11-02&sr=b&sig=VS7OweuOhqFPf1Axhuy%2FHBnBbNoQRM7LHkAlPJQg%2Fq4%3D";
//      const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
//      fetch(proxyUrl)
//      .then( response => response.json())
//      .then( data => {
//           data.buildings0011.forEach( item => {
//                const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
//                     const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
//                     const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );
//                     const streetAddress = safeAccess( item, 'address', 'value', 'streetAddress')
//                     const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
//                     const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );
//                     const addressCountry = safeAccess( item, 'address', 'value', 'addressCountry', 'Direccion no disponible' );
//                     const neighborhood = safeAccess( item, 'address', 'value', 'neighborhood', 'Barrio no disponible' );
//                     const district = safeAccess( item, 'address', 'value', 'district', 'Distrito no disponible' );

//                     if ( ubicacion && name ) {
//                          const marker = new google.maps.Marker( {
//                               position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
//                               map: map,
//                               title: name,
//                               icon: "./assets/commercialOrIndustrialQubo.svg"
//                          } );

//                          // Agrega un evento click a cada marcador para mostrar el infoBox
//                          marker.addListener( "click", () => {
//                               const infoBox = document.querySelector( ".info-box" );
//                               infoBox.style.display = "flex";
//                               infoBox.innerHTML = `
//                               <div class='nameContainer'>
//                                    <p>${ name }</p>
//                               </div>
//                               <img src='./assets/staticCommercialOrIndustrial.jpg'>
//                               <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
//                               <p>Neighborhood: ${ neighborhood }</p>
//                               <p>District: ${ district }</p>
//                               <p>Country: ${ addressCountry }</p>
//                               <p>${ description }</p>
//                               <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                               <button class='share'><img src='./assets/shareIcon.svg'></button>
//                          `;
//                               document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
//                                    infoBox.style.display = "none";
//                               } );
//                          } );

//                          markersOpticsDentists.push( marker ); // Añade el marcador al array de parcelas
//                     }
//           })
//      })
//      .catch( error => console.error( "Error al cargar los marcadores de Other Buildings:", error ) );
// };
// const eventOpticsDentistis = document.getElementById( "optics-dentists-nav-item" );
// let markersOpticsDentists = []; // Array para almacenar los marcadores de parcelas
// let opticsDentistisVisible = false; // Bandera para el estado de visibilidad

// eventOpticsDentistis.addEventListener( "click", () => {
//      // Alternar la visibilidad de los marcadores de parcelas
//      toggleMarcadores( markersOpticsDentists, opticsDentistisVisible );
//      opticsDentistisVisible = !opticsDentistisVisible; // Cambia la bandera de visibilidad

//      // Si los marcadores aún no se han cargado, cargarlos
//      if ( markersOpticsDentists.length === 0 && opticsDentistisVisible ) {
//           cargarMarcadoresOpticsDentists(); // Llama a la función para cargar los marcadores de parcelas
//      }
// } );


//! Función para mostrar VIRUUS HAZARD


const virusHazardKmlUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Virus%20Hazard/COVID_19_Case_Rate_Per_Zip_Code_without_Long_Term_Care_Facility_Cases_in_Jefferson_County_2C_KY.kml?sp=r&st=2025-01-26T22:02:42Z&se=2090-01-27T06:02:42Z&sv=2022-11-02&sr=b&sig=qer4d%2Bv8oI16lTYp5hC5hLiAje98XThj3xKbPqzjUaY%3D";

let kmlLayerVirusHazard = null;
let virusHazardVisible = false;

function toggleVirusHazard() {
     if ( !kmlLayerVirusHazard ) {
          kmlLayerVirusHazard = new google.maps.KmlLayer( {
               url: virusHazardKmlUrl,
               map: map,
               preserveViewport: false // Cambiado a false para permitir el zoom automático
          } );

          // Añadir listener para cuando el KML termine de cargar
          google.maps.event.addListenerOnce( kmlLayerVirusHazard, 'defaultviewport_changed', () => {
               // Obtener los límites del KML y centrar el mapa
               const bounds = kmlLayerVirusHazard.getDefaultViewport();
               map.fitBounds( bounds );
               map.setZoom( map.getZoom() - 1 ); // Ajustar el zoom un nivel para mejor vista
          } );
     } else {
          kmlLayerVirusHazard.setMap( kmlLayerVirusHazard.getMap() ? null : map );
          if ( !kmlLayerVirusHazard.getMap() ) {
               // Si se está ocultando la capa, volver a la vista de Madrid
               map.setCenter( { lat: 40.4168, lng: -3.7038 } );
               map.setZoom( 13 );
          } else {
               // Si se está mostrando de nuevo, volver a centrar en la zona del KML
               const bounds = kmlLayerVirusHazard.getDefaultViewport();
               map.fitBounds( bounds );
               map.setZoom( map.getZoom() - 1 );
          }
     }

     virusHazardVisible = !virusHazardVisible;
     document.getElementById( "virus-hazard-nav-item" ).classList.toggle( 'active' );
}

// Event listener para el botón
document.getElementById( "virus-hazard-nav-item" ).addEventListener( "click", toggleVirusHazard );



//! Función para mostrar PHARMACY
const cargarMarcadoresFarmacias = () => {
     const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Pharmacy/Fiware_Health_Pharmacy-00001?sp=r&st=2024-01-03T13:10:58Z&se=2090-03-01T21:10:58Z&sv=2022-11-02&sr=b&sig=%2BWst1weUxMGfSdDVWZ25AmykNzJkguql09VWbkpaGOQ%3D";
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;
     fetch( proxyUrl )
          .then( ( response ) => {
               if ( response.ok ) {
                    return response.json();
               } else {
                    throw new Error( "La solicitud no fue exitosa" );
               }
          } )
          .then( ( data ) => {
               console.log( data );
               const markersData = data.buildings0001;

               markersData.forEach( ( item ) => {

                    // const ubicacion = item.location.value.coordinates;
                    const {
                         ubicacion,
                         name,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source,
                         owner
                    } = parseFiwareData( item );

                    const marker = new google.maps.Marker( {
                         position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                         map: map,
                         title: `Marcador ${ item.id }`,
                         icon: "./assets/quboFarmacia.png",
                    } );

                    marker.addListener( "click", () => {
                         const infoBox = document.querySelector( ".info-box" );

                         infoBox.style.display = "flex";
                         infoBox.innerHTML = `
                         <div class='nameContainer'>
                              <p>${ description }</p>
                              <p>${ name }</p>
                         </div>
                         <img src='${ STATIC_IMAGES.pharmacy }'>
                         <p>Owner: <span>${ owner }</span> </p>
                         <p>Address: <span>${ streetAddress }</span> </p>
                         <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                         <p>Country: <span>${ addressCountry }</span> </p>
                         <p>ID: <span>${ item.id }</span> </p>
                         <button id="cerrar-info-box">
                              <img src='./assets/botonCerrar.svg'>
                         </button>
                         <button class='share'>
                              <img src='./assets/shareIcon.svg'>
                         </button>
                         `;

                         const cerrarBoton = document.getElementById( "cerrar-info-box" );
                         cerrarBoton.addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );

                    markersFarmacias.push( marker ); // Añade el marcador al array de farmacias
               } );
          } )
          .catch( ( error ) => {
               console.error( "Hubo un problema con la solicitud:", error );
          } );
};

const eventFarmacias = document.getElementById( "pharmacy-nav-item" );
let markersFarmacias = []; // Array para almacenar los marcadores de farmacias
let farmaciasVisible = false; // Bandera para el estado de visibilidad

eventFarmacias.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de farmacias
     toggleMarcadores( markersFarmacias, farmaciasVisible );
     farmaciasVisible = !farmaciasVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     if ( markersFarmacias.length === 0 && farmaciasVisible ) {
          cargarMarcadoresFarmacias();
     }
} );

//? FUNCIÓN GENÉRICA PARA FORMATEAR DATOS FIWARE

function parseFiwareData( item ) {
     const id = item.id;
     const type = item.type;
     const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
     const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );

     // Modificamos la obtención de la categoría para manejar tanto 'value' como 'object'
     let categoryArray;
     if ( item.category?.value ) {
          categoryArray = safeAccess( item, 'category', 'value', [] );
     } else if ( item.category?.object ) {
          categoryArray = safeAccess( item, 'category', 'object', [] );
     } else {
          categoryArray = [];
     }

     // Se asegura de que categoryArray es un array y tiene al menos un elemento
     let category = ( Array.isArray( categoryArray ) && categoryArray.length > 0 )
          ? convertToTitleCase( categoryArray[ 0 ] )
          : 'Categoría no disponible';

     // Mapeo de categorías específicas a su formato deseado
     const categoryMap = {
          commercialProperty: "Commercial Property",
          newDevelopment: "New Development",
          touristic: "Touristic",
          hospital: "Hospital",
          parking: "Parking",
          police_station: 'Police Station',

          // Puedes agregar más mapeos aquí si es necesario
     };

     // if ( categoryArray.length > 0 && categoryMap[ categoryArray[ 0 ] ] ) {
     //      category = categoryMap[ categoryArray[ 0 ] ];
     // }
     if ( categoryMap[ categoryArray[ 0 ] ] ) {
          category = categoryMap[ categoryArray[ 0 ] ];
     }

     const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );
     const streetAddress = safeAccess( item, 'address', 'value', 'streetAddress', 'Dirección no disponible' );
     const postalCode = safeAccess( item, 'address', 'value', 'postalCode', 'Código postal no disponible' );
     const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
     const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );
     const addressCountry = safeAccess( item, 'address', 'value', 'addressCountry', 'Direccion no disponible' );
     const neighborhood = safeAccess( item, 'address', 'value', 'neighborhood', 'Barrio no disponible' );
     const district = safeAccess( item, 'address', 'value', 'district', 'Distrito no disponible' );
     const source = safeAccess( item, 'source', 'value', 'Link no disponible' );

     // Formateo de allowedVehicleType
     const allowedVehicleTypeArray = safeAccess( item, 'allowedVehicleType', 'object', [] );
     const allowedVehicleType = allowedVehicleTypeArray.length > 0 ? allowedVehicleTypeArray : 'Tipo de vehículo no disponible';

     const ownerArray = safeAccess( item, 'owner', 'object', [] );
     const owner = ownerArray.length > 0 ? ownerArray.join( ', ' ) : 'Owner no disponible';

     return {
          id,
          type,
          ubicacion,
          name,
          category,
          description,
          streetAddress,
          postalCode,
          addressLocality,
          addressRegion,
          addressCountry,
          neighborhood,
          district,
          source,
          owner,
          allowedVehicleType
     };
}


//* BOTÓN SECURITY
//! Función para mostrar POLICE
function convertToTitleCase( str ) {
     return str
          .toLowerCase()
          .split( '_' )
          .map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
          .join( ' ' );
}


function cargarMarcadoresPolice() {
     const endpoint = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Fiware_Security_Police-00001?sp=r&st=2024-06-02T10:30:17Z&se=2090-01-01T19:30:17Z&sv=2022-11-02&sr=b&sig=t5a17aCew3nA5twJGHg5K4fiMXBI%2BphX9N%2F3bjpbDRg%3D";
     const proxyUrl = `/api/proxy?url=${ encodeURIComponent( endpoint ) }`;
     fetch( proxyUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0018.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/policeStationQubo.svg"
                         } );
                         // Dentro del evento click del marcador
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";

                              // Construir contenido de infoBox de manera condicional
                              let infoContent = `
         <div class='nameContainer'>
             <p>${ category }</p>
             <p>${ name }</p>
         </div>
         <img src='${ STATIC_IMAGES.police }'>
     `;

                              // Agregar solo los campos que tienen datos válidos
                              if ( addressLocality ) {
                                   infoContent += `<p>Localización: ${ addressLocality }${ addressRegion ? ', ' + addressRegion : '' }</p>`;
                              }
                              if ( streetAddress ) {
                                   infoContent += `<p>Address: ${ streetAddress }</p>`;
                              }
                              if ( postalCode ) {
                                   infoContent += `<p>C.P: ${ postalCode }</p>`;
                              }
                              if ( neighborhood && neighborhood !== 'N/A' ) {
                                   infoContent += `<p>Neighborhood: ${ neighborhood }</p>`;
                              }
                              if ( district && district !== 'N/A' ) {
                                   infoContent += `<p>District: ${ district }</p>`;
                              }
                              if ( addressCountry ) {
                                   infoContent += `<p>Country: ${ addressCountry }</p>`;
                              }
                              if ( description ) {
                                   infoContent += `<p>${ description }</p>`;
                              }
                              if ( source ) {
                                   infoContent += `<p>Link: <a href="${ source }" target="_blank">${ source }</a></p>`;
                              }

                              // Agregar botones
                              infoContent += `
                                   <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                                   <button class='share'><img src='./assets/shareIcon.svg'></button>
                                   `;

                              // Insertar el contenido en el infoBox
                              infoBox.innerHTML = infoContent;

                              // Manejar el cierre del infoBox
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersPolice.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Policias:", error ) );
};
const eventPolice = document.getElementById( "police-sub-nav-item" );
let markersPolice = []; // Array para almacenar los marcadores de parcelas
let policeVisible = false; // Bandera para el estado de visibilidad

eventPolice.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersPolice, policeVisible );
     policeVisible = !policeVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersPolice.length === 0 && policeVisible ) {
          cargarMarcadoresPolice(); // Llama a la función para cargar los marcadores de parcelas
     }
} );

//! Función para mostrar FIRE

// function cargarMarcadoresFire() {
//      // Cargar datos JSON a través del proxy
//     const proxyUrl = `/api/proxy?url=${encodeURIComponent('https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Fiware_Security_Fire-00001?sp=r&st=2024-06-02T10:34:51Z&se=2090-01-01T19:34:51Z&sv=2022-11-02&sr=b&sig=kIIhP5A5%2BADgQbK1rf45qF7zibOYT%2F6QU0kLSGPKihU%3D')}`;
//      fetch( proxyUrl )
//           .then( response => response.json() )
//           .then( data => {
//                data.buildings0017.forEach( item => {
//                     const {
//                          ubicacion,
//                          name,
//                          category,
//                          description,
//                          streetAddress,
//                          postalCode,
//                          addressLocality,
//                          addressRegion,
//                          addressCountry,
//                          neighborhood,
//                          district,
//                          source
//                     } = parseFiwareData( item );


//                     if ( ubicacion && name ) {
//                          const marker = new google.maps.Marker( {
//                               position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
//                               map: map,
//                               title: name,
//                               icon: "./assets/fireStationQubo.svg"
//                          } );

//                          // Agrega un evento click a cada marcador para mostrar el infoBox
//                          marker.addListener( "click", () => {
//                               const infoBox = document.querySelector( ".info-box" );
//                               infoBox.style.display = "flex";
//                               infoBox.innerHTML = `
//                          <div class='nameContainer'>
//                              <p>${ category }</p>
//                              <p>${ name }</p>
//                          </div>
//                          <img src='${STATIC_IMAGES.fire}'/>
//                          <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
//                          <p>Address: ${ streetAddress }</p>
//                          <p>C.P: ${ postalCode }</p>
//                          <p>Neighborhood: ${ neighborhood }</p>
//                          <p>District: ${ district }</p>
//                          <p>Country: ${ addressCountry }</p>
//                          <p>${ description }</p>
//                          <p>Link: <a href="${ source }" target="_blank">Click Here</a></p>
//                          <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                          <button class='share'><img src='./assets/shareIcon.svg'></button>
//                      `;
//                               document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
//                                    infoBox.style.display = "none";
//                               } );
//                          } );

//                          markersFire.push( marker ); // Añade el marcador al array de marcadores de bomberos
//                     }
//                } );
//           } )
//           .catch( error => console.error( "Error al cargar los marcadores de bomberos:", error ) );

//      // Cargar capa KML
//      const kmlProxyUrl = `/api/proxy?url=${encodeURIComponent('https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Actuaciones%20Bomberos%20Final.kml?sp=r&st=2024-06-02T11:37:02Z&se=2090-01-01T20:37:02Z&sv=2022-11-02&sr=b&sig=TiiAzwAOI0rdct%2BYF%2F%2BJe3GFq%2FhTHx7rN7dsxnLfkzo%3D')}`;
//      const kmlLayer = new google.maps.KmlLayer( {
//           url: kmlProxyUrl,
//           map: map,
//           preserveViewport: true
//      } );
//      kmlLayersFire.push( kmlLayer );
// }

// const eventFire = document.getElementById( "fire-sub-nav-item" );
// let markersFire = []; // Array para almacenar los marcadores de bomberos
// let kmlLayersFire = []; // Array para almacenar las capas KML de bomberos
// let fireVisible = false; // Bandera para el estado de visibilidad

// eventFire.addEventListener( "click", () => {
//      // Alternar la visibilidad de los marcadores de bomberos
//      if ( !fireVisible ) {
//           cargarMarcadoresFire();
//           fireVisible = true;
//      } else {
//           markersFire.forEach( marker => marker.setMap( null ) );
//           markersFire = [];
//           kmlLayersFire.forEach( layer => layer.setMap( null ) );
//           kmlLayersFire = [];
//           fireVisible = false;
//      }
// } );

function cargarMarcadoresFire() {
     // URL del proxy para JSON
     const jsonProxyUrl = `/api/proxy?url=${ encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Fiware_Security_Fire-00001?sp=r&st=2024-06-02T10:34:51Z&se=2090-01-01T19:34:51Z&sv=2022-11-02&sr=b&sig=kIIhP5A5%2BADgQbK1rf45qF7zibOYT%2F6QU0kLSGPKihU%3D' ) }`;

     // Cargar datos JSON
     fetch( jsonProxyUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0017.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/fireStationQubo.svg"
                         } );

                         // Evento de click para mostrar información
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                             <div class='nameContainer'>
                                 <p>${ category }</p>
                                 <p>${ name }</p>
                             </div>
                             <img src='${ STATIC_IMAGES.fire }'/>
                             <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                             <p>Address: <span>${ streetAddress }</span> </p>
                             <p>C.P: <span>${ postalCode }</span> </p>
                             <p>Neighborhood: <span>${ neighborhood }</span> </p>
                             <p>District: <span>${ district }</span> </p>
                             <p>Country: <span>${ addressCountry }</span> </p>
                             <p>Description: <span>${ description }</span> </p>
                             <p>Link: <a href="${ source }" target="_blank">Click Here</a></p>
                             <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                             <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersFire.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de bomberos:", error ) );

     // URL del proxy para KML
     const kmlProxyUrl = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Actuaciones%20Bomberos%20Final.kml?sp=r&st=2024-06-02T11:37:02Z&se=2090-01-01T20:37:02Z&sv=2022-11-02&sr=b&sig=TiiAzwAOI0rdct%2BYF%2F%2BJe3GFq%2FhTHx7rN7dsxnLfkzo%3D';

     // Cargar capa KML
     const kmlLayer = new google.maps.KmlLayer( {
          url: kmlProxyUrl,
          map: map,
          preserveViewport: true
     } );

     kmlLayersFire.push( kmlLayer );
}

const eventFire = document.getElementById( "fire-sub-nav-item" );
let markersFire = [];
let kmlLayersFire = [];
let fireVisible = false;

eventFire.addEventListener( "click", () => {
     if ( !fireVisible ) {
          cargarMarcadoresFire();
          fireVisible = true;
     } else {
          markersFire.forEach( marker => marker.setMap( null ) );
          markersFire = [];
          kmlLayersFire.forEach( layer => layer.setMap( null ) );
          kmlLayersFire = [];
          fireVisible = false;
     }
} );


//* BOTÓN LOGISTICS ****************




//! Marcadores PORTS *************
//! Función para mostrar PUERTOS
const cargarMarcadoresPuertos = async () => {
     const urls = [
          '/api/proxy?url=' + encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Ports/port_tanger.json?sp=r&st=2024-07-21T10:38:19Z&se=2090-01-01T19:38:19Z&sv=2022-11-02&sr=b&sig=N8hFoDEtRa6gepxt%2BlIh8ZPSBOVORUp5kTmbKgng9Do%3D' ),
          '/api/proxy?url=' + encodeURIComponent( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Logistics/Ports/port_algeciras.json?sp=r&st=2024-07-21T10:39:18Z&se=2090-01-01T19:39:18Z&sv=2022-11-02&sr=b&sig=0Oq3z6vuqvbRDOAUuxX%2FYl4OwHAbCN4xZMuE7q2hlMg%3D' )
     ];

     const requests = urls.map( url => fetch( url ).then( response => response.json() ) );

     try {
          const results = await Promise.all( requests );
          results.forEach( data => {
               const { id, name, location, ImagenURL, address, description, infrastructure, environmentalData, operationalData, safetyAndSecurity, utilities, trafficManagement, maintenance, communicationAndConnectivity } = data;

               const marker = new google.maps.Marker( {
                    position: { lat: location.coordinates[ 0 ].lat, lng: location.coordinates[ 0 ].lng },
                    map: map,
                    title: name,
                    icon: "./assets/portsQubo.svg"
               } );

               marker.addListener( "click", () => {
                    const infoBox = document.querySelector( ".info-box" );
                    infoBox.style.display = "flex";
                    infoBox.innerHTML = `
        <div class="info-header">
            <img src="${ ImagenURL }" alt="Port" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">PORT</span>
                        <div class="badge-location nameContainer">
                            <span>${ name }</span>
                            <span>${ address.addressLocality }, ${ address.addressRegion }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="info-content">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item id-container">
                        <label>ID</label>
                        <div class="id-value-container">
                            <span>${ id }</span>
                            <button class="copy-btn" title="Copiar ID">
                                <i class="copy-icon">📋</i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item full-width">
                        <label>Dirección</label>
                        <span>${ address.streetAddress }, ${ address.addressLocality }, ${ address.addressRegion }, ${ address.postalCode }, ${ address.addressCountry }</span>
                    </div>
                </div>
            </div>

            <div class="description">
                <label>Descripción</label>
                <p>${ description }</p>
            </div>

            <div class="port-infrastructure">
                <label>Infraestructura</label>
                <div class="port-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🚢</div>
                        <div class="stat-info">
                            <span class="stat-value">${ infrastructure.numberOfDocks }</span>
                            <span class="stat-label">Muelles</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">⚓</div>
                        <div class="stat-info">
                            <span class="stat-value">${ infrastructure.numberOfBerths }</span>
                            <span class="stat-label">Amarres</span>
                        </div>
                    </div>
                </div>
                
                <div class="port-status-indicators">
                    <div class="status-item">
                        <label>Tipo terminal</label>
                        <div class="status-badge">
                            <span class="status-icon">📦</span>
                            <span>${ infrastructure.terminalType }</span>
                        </div>
                    </div>
                    <div class="status-item">
                        <label>Estado muelle</label>
                        <div class="status-badge">
                            <span class="status-icon">✅</span>
                            <span>${ infrastructure.dockStatus }</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="environmental-data">
                <label>Datos ambientales</label>
                <div class="env-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🌡️</div>
                        <div class="stat-info">
                            <span class="stat-value">${ environmentalData.airTemperature }°C</span>
                            <span class="stat-label">Temperatura aire</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">💧</div>
                        <div class="stat-info">
                            <span class="stat-value">${ environmentalData.waterTemperature }°C</span>
                            <span class="stat-label">Temperatura agua</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">💨</div>
                        <div class="stat-info">
                            <span class="stat-value">${ environmentalData.windSpeed } km/h ${ environmentalData.windDirection }</span>
                            <span class="stat-label">Viento</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">💧</div>
                        <div class="stat-info">
                            <span class="stat-value">${ environmentalData.humidity }%</span>
                            <span class="stat-label">Humedad</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">👁️</div>
                        <div class="stat-info">
                            <span class="stat-value">${ environmentalData.visibility } km</span>
                            <span class="stat-label">Visibilidad</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="port-utilities">
                <label>Estado de servicios</label>
                <div class="utilities-grid">
                    <div class="utility-item">
                        <span class="utility-icon">⚡</span>
                        <span class="utility-label">Energía</span>
                        <span class="utility-status active">${ utilities.powerSupplyStatus }</span>
                    </div>
                    <div class="utility-item">
                        <span class="utility-icon">💧</span>
                        <span class="utility-label">Agua</span>
                        <span class="utility-status active">${ utilities.waterSupplyStatus }</span>
                    </div>
                    <div class="utility-item">
                        <span class="utility-icon">⛽</span>
                        <span class="utility-label">Combustible</span>
                        <span class="utility-status active">${ utilities.fuelAvailability }</span>
                    </div>
                    <div class="utility-item">
                        <span class="utility-icon">🗑️</span>
                        <span class="utility-label">Residuos</span>
                        <span class="utility-status">${ utilities.wasteManagementStatus }</span>
                    </div>
                </div>
            </div>
            <div class="traffic-management">
                <label>Gestión de tráfico</label>
                <div class="traffic-stats">
                    <div class="traffic-item">
                        <label>Estado tráfico terrestre</label>
                        <div class="status-badge">
                            <span class="status-icon">🚗</span>
                            <span>${ trafficManagement.roadTrafficStatus }</span>
                        </div>
                    </div>
                    <div class="traffic-item">
                        <label>Estado tráfico marítimo</label>
                        <div class="status-badge">
                            <span class="status-icon">🚢</span>
                            <span>${ trafficManagement.seaTrafficStatus }</span>
                        </div>
                    </div>
                    <div class="traffic-item">
                        <label>Tiempo de espera</label>
                        <div class="status-badge">
                            <span class="status-icon">⏱️</span>
                            <span>${ trafficManagement.waitingTime } mins</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="maintenance-info">
                <label>Mantenimiento</label>
                <div class="maintenance-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🔄</div>
                        <div class="stat-info">
                            <span class="stat-value">${ maintenance.maintenanceSchedule }</span>
                            <span class="stat-label">Frecuencia</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📅</div>
                        <div class="stat-info">
                            <span class="stat-value">${ maintenance.lastInspectionDate }</span>
                            <span class="stat-label">Última inspección</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📅</div>
                        <div class="stat-info">
                            <span class="stat-value">${ maintenance.nextInspectionDate }</span>
                            <span class="stat-label">Próxima inspección</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="communication-info">
                <label>Comunicación y Conectividad</label>
                <div class="communication-grid">
                    <div class="comm-item">
                        <span class="comm-icon">📡</span>
                        <span class="comm-label">Sistema de comunicación</span>
                        <span class="comm-status active">${ communicationAndConnectivity.communicationSystemsStatus }</span>
                    </div>
                    <div class="comm-item">
                        <span class="comm-icon">🌐</span>
                        <span class="comm-label">Internet</span>
                        <span class="comm-status active">${ communicationAndConnectivity.internetConnectivity }</span>
                    </div>
                    <div class="comm-channels">
                        <label>Canales de radio marítima</label>
                        <div class="channel-tags">
                            ${ communicationAndConnectivity.maritimeRadioChannels.map( channel =>
                         `<span class="channel-tag">${ channel }</span>`
                    ).join( '' ) }
                        </div>
                    </div>
                </div>
            </div>

            <div class="port-security">
                <label>Seguridad</label>
                <div class="security-stats">
                    <div class="stat-item">
                        <div class="stat-icon">🛡️</div>
                        <div class="stat-info">
                            <span class="stat-value">${ safetyAndSecurity.securityLevel }</span>
                            <span class="stat-label">Nivel</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📹</div>
                        <div class="stat-info">
                            <span class="stat-value">${ safetyAndSecurity.numberOfCCTV }</span>
                            <span class="stat-label">Cámaras CCTV</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">👮</div>
                        <div class="stat-info">
                            <span class="stat-value">${ safetyAndSecurity.numberOfGuards }</span>
                            <span class="stat-label">Guardias</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📞</div>
                        <div class="stat-info">
                            <span class="stat-value">${ safetyAndSecurity.emergencyContact }</span>
                            <span class="stat-label">Emergencias</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="operational-data">
                <label>Datos operativos</label>
                <div class="operational-stats">
                    <div class="stat-item">
                        <div class="stat-icon">⚖️</div>
                        <div class="stat-info">
                            <span class="stat-value">${ operationalData.cargoHandlingCapacity } tons</span>
                            <span class="stat-label">Capacidad de carga</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <span class="stat-value">${ operationalData.currentCargoLoad } tons</span>
                            <span class="stat-label">Carga actual</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🚢</div>
                        <div class="stat-info">
                            <span class="stat-value">${ operationalData.numberOfShips }</span>
                            <span class="stat-label">Barcos en puerto</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <span class="stat-value">${ operationalData.arrivalRate }/${ operationalData.departureRate }</span>
                            <span class="stat-label">Llegadas/Salidas por hora</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">📦</div>
                        <div class="stat-info">
                            <span class="stat-value">${ operationalData.containerThroughput }</span>
                            <span class="stat-label">Contenedores/hora</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                         infoBox.style.display = "none";
                    } );
                    document.querySelector( ".share-btn" )?.addEventListener( "click", async () => {
                         try {
                              if ( navigator.share ) {
                                   await navigator.share( {
                                        title: `Port ${ name }`,
                                        text: `Información sobre ${ name }`,
                                        url: window.location.href
                                   } );
                              } else {
                                   await navigator.clipboard.writeText( window.location.href );
                                   showNotification( '¡Enlace copiado!' );
                              }
                         } catch ( error ) {
                              console.error( 'Error al compartir:', error );
                         }
                    } );

                    // Copiar ID
                    document.querySelector( ".copy-btn" )?.addEventListener( "click", async () => {
                         try {
                              await navigator.clipboard.writeText( id );
                              showNotification( '¡ID copiado!' );
                         } catch ( error ) {
                              console.error( 'Error al copiar:', error );
                         }
                    } );
               } );

               markersPorts.push( marker ); // Añade el marcador al array de puertos
          } );
     } catch ( error ) {
          console.error( "Error al cargar los marcadores de puertos:", error );
     }
};

const eventPorts = document.getElementById( "ports-sub-nav-item" );
let markersPorts = []; // Array para almacenar los marcadores de puertos
let portsVisible = false; // Bandera para el estado de visibilidad

eventPorts.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de puertos
     toggleMarcadores( markersPorts, portsVisible );
     portsVisible = !portsVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersPorts.length === 0 && portsVisible ) {
          cargarMarcadoresPuertos(); // Llama a la función para cargar los marcadores de puertos
     }
} );



//* BOTÓN ENTERTAINMENT AND SPORTS ****************

//! Función para mostrar EVENTS&CONCERTS

function cargarMarcadoresEnventsConcerts() {
     const concertsEventsApiUrl = `/api/proxy?url=${ encodeURIComponent(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Events%20%26%20Concerts/Fiware_Entertainment_EventsAndConcerts-00001?sp=r&st=2024-06-16T16:40:22Z&se=2090-01-01T01:40:22Z&sv=2022-11-02&sr=b&sig=zEVssSBnqIgsT4TQCkrlbKqG7xI%2BzoKA8VJ6zUH4IJk%3D"
     ) }`;

     fetch( concertsEventsApiUrl )
          .then( ( response ) => response.json() )
          .then( ( data ) => {
               data.pois0001.forEach( ( item ) => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source,
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/ConcertsEventsQubo.svg",
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.concertsEvents }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p>Description: <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersConcertsEvents.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( ( error ) => console.error( "Error al cargar los marcadores de Events & Concerts:", error ) );
}

const eventConcertsEvents = document.getElementById( "eventsConcerts-sub-nav-item" );
let markersConcertsEvents = []; // Array para almacenar los marcadores de parcelas
let concertsEventsVisible = false; // Bandera para el estado de visibilidad

eventConcertsEvents.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersConcertsEvents, concertsEventsVisible );
     concertsEventsVisible = !concertsEventsVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersConcertsEvents.length === 0 && concertsEventsVisible ) {
          cargarMarcadoresEnventsConcerts(); // Llama a la función para cargar los marcadores de parcelas
     }
} );


//! Función para mostrar THEATRES

const theatresApiUrl = `/api/proxy?url=${ encodeURIComponent(
     'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Theatres/Fiware_Entertainment_Theaters-00001?sp=r&st=2024-06-16T16:44:06Z&se=2090-01-01T01:44:06Z&sv=2022-11-02&sr=b&sig=3Lv8dUd2Osbx%2FfzV1Vn6HdEnIUa6cuUiRzvxCgkrtVQ%3D'
) }`;

// Función para cargar y mostrar marcadores de teatros
function cargarMarcadoresTheatres() {
     fetch( theatresApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0016.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source,
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/TheatresQubo.svg",
                         } );

                         // Evento para mostrar infoBox al hacer clic en el marcador
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.theatres }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p>Description: <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersTheatres.push( marker ); // Añade el marcador al array de marcadores
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Theatres:", error ) );
}

// Configurar evento para alternar visibilidad de teatros
const eventTheatres = document.getElementById( "theatres-sub-nav-item" );
let markersTheatres = []; // Array para almacenar los marcadores
let theatresVisible = false; // Bandera para estado de visibilidad

eventTheatres.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores
     toggleMarcadores( markersTheatres, theatresVisible );
     theatresVisible = !theatresVisible; // Cambia el estado de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersTheatres.length === 0 && theatresVisible ) {
          cargarMarcadoresTheatres(); // Llama a la función para cargar los marcadores
     }
} );


//! Función para mostrar CINEMAS


// Define la URL de la API con el proxy
const cinemasApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Cinemas/Fiware_Entertainment_Cinema-00001?sp=r&st=2024-06-16T16:52:22Z&se=2090-01-01T01:52:22Z&sv=2022-11-02&sr=b&sig=miAc9ZvoSlO6eExvcTCPbJ2o0fNTd2zeiddOSAbzdF4%3D"
) }`;

// Función para cargar y mostrar los marcadores de cines
function cargarMarcadoresCinemas() {
     fetch( cinemasApiUrl )
          .then( ( response ) => response.json() )
          .then( ( data ) => {
               data.buildings0012.forEach( ( item ) => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source,
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/CinemasQubo.svg",
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
          <div class="info-header">
               <img src="${ STATIC_IMAGES.cinemas }" alt="Cinema" class="property-image"/>
               <div class="header-bar">
                    <div class="property-badges">
                         <div class="badge-container">
                              <span class="badge primary">${ category }</span>
                              <div class="badge-location nameContainer">
                              <span>${ name }</span>
                              <span>${ addressLocality }, ${ district }</span>
                              </div>
                         </div>
                    </div>
                    <div class="action-buttons">
                         <button class="action-btn share-btn" title="Compartir">
                              <i class="action-icon">📤</i>
                         </button>
                         <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                              <i class="action-icon">✕</i>
                         </button>
                    </div>
               </div>
          </div>
          
          <div class="info-content">
               <div class="info-grid">
                    <div class="info-row">
                         <div class="info-item">
                              <label>Dirección</label>
                              <span>${ streetAddress }</span>
                         </div>
                         <div class="info-item">
                              <label>Código postal</label>
                              <span>${ postalCode }</span>
                         </div>
                    </div>
                    <div class="info-row">
                         <div class="info-item">
                              <label>Barrio</label>
                              <span>${ neighborhood }</span>
                         </div>
                         <div class="info-item">
                              <label>Distrito</label>
                              <span>${ district }</span>
                         </div>
                    </div>
                    <div class="info-row">
                         <div class="info-item">
                              <label>Localización</label>
                              <span>${ addressLocality }, ${ addressRegion }</span>
                         </div>
                         <div class="info-item">
                              <label>País</label>
                              <span>${ addressCountry }</span>
                         </div>
                    </div>
               </div>

               ${ description
                                        ? `
                    <div class="description">
                         <label>Descripción</label>
                         <p>${ description }</p>
                    </div>
               `
                                        : ""
                                   }

               <div class="transport-info">
                    <label>Transporte</label>
                    <div class="transport-grid">
                         <div class="transport-item">
                              <i class="transport-icon">🚌</i>
                              <span>Bus: 118, N16</span>
                         </div>
                    </div>
               </div>

               <div class="external-links">
                    <label>Enlaces</label>
                    <a href="${ source }" target="_blank" class="external-link">
                         Ver más información
                    </a>
               </div>
          </div>
          `;

                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                              // Event listener para compartir (AQUÍ DENTRO)
                              document.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                                   const shareData = {
                                        title: `Cinema ${ name }`,
                                        text: `Información sobre ${ name } en ${ addressRegion }`,
                                        url: window.location.href
                                   };

                                   try {
                                        if ( navigator.share ) {
                                             await navigator.share( shareData );
                                        } else {
                                             await navigator.clipboard.writeText( shareData.url );

                                             // Mostrar notificación de copiado
                                             const notification = document.createElement( 'div' );
                                             notification.style.cssText = `
                 position: fixed;
                 top: 20px;
                 right: 20px;
                 background: rgba(8, 236, 196, 0.9);
                 color: black;
                 padding: 8px 16px;
                 border-radius: 4px;
                 font-size: 14px;
                 z-index: 1000000;
                 transition: opacity 0.3s ease;
             `;
                                             notification.textContent = '¡Enlace copiado!';
                                             document.body.appendChild( notification );

                                             setTimeout( () => {
                                                  notification.style.opacity = '0';
                                                  setTimeout( () => notification.remove(), 300 );
                                             }, 2000 );
                                        }
                                   } catch ( error ) {
                                        console.error( 'Error al compartir:', error );
                                   }
                              } );
                         } );





                         markersCinemas.push( marker ); // Añade el marcador al array de cines
                    }
               } );
          } )
          .catch( ( error ) =>
               console.error( "Error al cargar los marcadores de Cinemas:", error )
          );
}

// Lógica para alternar la visibilidad de los cines
const eventCinemas = document.getElementById( "cinemas-sub-nav-item" );
let markersCinemas = []; // Array para almacenar los marcadores de cines
let cinemasVisible = false; // Bandera para el estado de visibilidad

eventCinemas.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de cines
     toggleMarcadores( markersCinemas, cinemasVisible );
     cinemasVisible = !cinemasVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersCinemas.length === 0 && cinemasVisible ) {
          cargarMarcadoresCinemas(); // Llama a la función para cargar los marcadores de cines
     }
} );



//! Función para mostrar LANDMARKS

// URL de la API con el proxy
const landmarksApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Landmarks/Fiware_Entertainment_Landmarks-00001?sp=r&st=2024-06-16T17:24:52Z&se=2090-01-01T02:24:52Z&sv=2022-11-02&sr=b&sig=ixGwZCchqFbUgjNVGbyGjQ%2FhDnJDmhYL3WSqUl4l5MI%3D"
) }`;

function cargarMarcadoresLandmarks() {
     fetch( landmarksApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.pois0002.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source,
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/LandmarksQubo.svg",
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.landmarks }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p>Description: <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersLandmarks.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Landmarks:", error ) );
}

const eventLandmarks = document.getElementById( "landmarks-sub-nav-item" );
let markersLandmarks = []; // Array para almacenar los marcadores de parcelas
let landmarksVisible = false; // Bandera para el estado de visibilidad

eventLandmarks.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersLandmarks, landmarksVisible );
     landmarksVisible = !landmarksVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersLandmarks.length === 0 && landmarksVisible ) {
          cargarMarcadoresLandmarks(); // Llama a la función para cargar los marcadores de parcelas
     }
} );



//! Función para mostrar STADIUMS

// Define la URL de la API con el proxy
const stadiumsApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Stadiums/estadiosMadrid.json?sp=r&st=2024-04-14T17:49:26Z&se=2090-01-01T02:49:26Z&sv=2022-11-02&sr=b&sig=ji01C4KUVXV9XBkmWj4zW6wvfQeB5T4kYxZzs80MTpA%3D"
) }`;

const marcadoresEstadios = {};
let estadiosVisible = false;

function cargarEstadios() {
     fetch( stadiumsApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.forEach( estadio => {
                    const [ lng, lat ] = estadio.coordenadas.split( "," ).map( Number );
                    const marker = new google.maps.Marker( {
                         map: map,
                         position: { lat, lng },
                         title: estadio.nombre,
                         icon: "./assets/stadiums_Qubo.svg"
                    } );

                    marker.addListener( "click", function () {
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         infoBox.innerHTML = `
        <div class="info-header">
            <img src="${ estadio.imgUrl }" alt="Stadium" class="property-image"/>
            <div class="header-bar">
                <div class="property-badges">
                    <div class="badge-container">
                        <span class="badge primary">STADIUM</span>
                        <div class="badge-location nameContainer">
                            <span>${ estadio.nombre }</span>
                            <span>${ estadio.address }</span>
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn share-btn" title="Compartir">
                        <i class="action-icon">📤</i>
                    </button>
                    <button class="action-btn close-btn" id="cerrar-info-box" title="Cerrar">
                        <i class="action-icon">✕</i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="info-content">
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-item">
                        <label>Capacidad</label>
                        <span>${ estadio.capacidad }</span>
                    </div>
                    <div class="info-item">
                        <label>Inauguración</label>
                        <span>${ estadio.inauguración }</span>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-item">
                        <label>Uso principal</label>
                        <span>${ estadio.uso }</span>
                    </div>
                    <div class="info-item">
                        <label>Equipo Local</label>
                        <span>${ estadio.equipo_local }</span>
                    </div>
                </div>
            </div>

            <div class="stadium-location">
                <label>Localización</label>
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-item">
                            <label>Dirección</label>
                            <span>${ estadio.address }</span>
                        </div>
                        <div class="info-item">
                            <label>Teléfono</label>
                            <span>${ estadio.telefono }</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="external-links">
                <label>Enlaces</label>
                <a href="${ estadio.url }" target="_blank" class="external-link">
                    Más información
                </a>
            </div>
        </div>
    `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                              infoBox.style.display = "none";
                         } );
                         document.querySelector( ".share-btn" ).addEventListener( "click", async () => {
                              try {
                                   if ( navigator.share ) {
                                        await navigator.share( {
                                             title: `Stadium ${ estadio.nombre }`,
                                             text: `Información sobre ${ estadio.nombre }`,
                                             url: estadio.url
                                        } );
                                   } else {
                                        await navigator.clipboard.writeText( estadio.url );
                                        showNotification( '¡Enlace copiado!' );
                                   }
                              } catch ( error ) {
                                   console.error( 'Error al compartir:', error );
                              }
                         } );
                    } );

                    marcadoresEstadios[ estadio.nombre ] = marker;
               } );
          } )
          .catch( error => console.error( 'Error al cargar los estadios:', error ) );
}

document.getElementById( "stadiums-sub-nav-item" ).addEventListener( "click", function () {
     if ( estadiosVisible ) {
          Object.values( marcadoresEstadios ).forEach( marker => marker.setMap( null ) );
          estadiosVisible = false;
     } else {
          cargarEstadios();
          estadiosVisible = true;
     }
} );



//! Función para mostrar CLUBS&NIGHTLIFE
// Define la URL de la API con el proxy
const clubsAndNightlifeApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Clubs%20%26%20Nightlife/Fiware_Entertainment_ClubsAndNightlife-00001?sp=r&st=2024-04-01T11:01:02Z&se=2090-01-01T20:01:02Z&sv=2022-11-02&sr=b&sig=aIubcMnWFTYQ1APJNRVbNJ9YrWKFtzj88SWK07H0uXc%3D"
) }`;
const cargarYMostrarMarcadoresClubesYVidaNocturna = async () => {
     try {
          const response = await fetch( clubsAndNightlifeApiUrl );
          const data = await response.json();

          data.buildings0013.forEach( item => {
               const {
                    ubicacion,
                    name,
                    streetAddress,
                    postalCode,
                    addressLocality,
                    addressRegion,
                    addressCountry,
                    source
               } = parseFiwareData( item );

               const clubMarker = new google.maps.Marker( {
                    position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                    map: map,
                    title: item.name.value,
                    icon: "./assets/clubsAndnightlife_Qubo.svg" // Asegúrate de tener un ícono adecuado para los clubes y la vida nocturna
               } );

               clubMarker.addListener( 'click', () => {
                    const infoBox = document.querySelector( ".info-box" );
                    infoBox.style.display = "flex";
                    const idWithoutPrefix = item.id.replace( /^building_/, '' );
                    const capitalizedCategory = item.category.value[ 1 ].charAt( 0 ).toUpperCase() + item.category.value[ 0 ].slice( 1 );
                    infoBox.innerHTML = `
                         <div class='nameContainer'>
                              <p>${ capitalizedCategory }</p>
                              <p>${ name }</p>
                         </div>
                         <img src='${ STATIC_IMAGES.clubsNightlife }'>
                         <p>Código identificador: <span>${ idWithoutPrefix }</span> </p>
                         <p>Address: <span>${ streetAddress } C.P ${ postalCode }</span> </p>
                         <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                         <p>Country: <span>${ addressCountry }</span> </p>
                         <p>Source: <a class="links-propiedades" href="${ source }" target="_blank">${ source }</a></p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                    `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                         infoBox.style.display = "none";
                    } );
               } );

               markersClubsAndNightlife.push( clubMarker ); // Añade el marcador al array de clubes y vida nocturna
          } );
     } catch ( error ) {
          console.error( "Error fetching clubs and nightlife:", error );
     }
};

const eventClubsAndNightlife = document.getElementById( "clubsAndNightlife-sub-nav-item" );
let markersClubsAndNightlife = []; // Array para almacenar los marcadores de clubes y vida nocturna
let clubsAndNightlifeVisible = false; // Bandera para el estado de visibilidad

eventClubsAndNightlife.addEventListener( 'click', async () => {
     // Alternar la visibilidad de los marcadores de clubes y vida nocturna
     toggleMarcadores( markersClubsAndNightlife, clubsAndNightlifeVisible );
     clubsAndNightlifeVisible = !clubsAndNightlifeVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     if ( markersClubsAndNightlife.length === 0 && clubsAndNightlifeVisible ) {
          await cargarYMostrarMarcadoresClubesYVidaNocturna();
     }
} );

//! Función para mostrar HOTELS&APARTMENTS


// Define la URL de la API con el proxy
// const hotelsAndApartmentsApiUrl = `/api/proxy?url=${encodeURIComponent(
//      "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Hotels%20%26%20Apartments/Fiware_Entertainment_HotelsAndApartments-00001?sp=r&st=2024-04-01T11:17:17Z&se=2090-01-01T20:17:17Z&sv=2022-11-02&sr=b&sig=0mN50aK5H8DLUYm0eYkR8%2Bk21mHSKhJesq9VdPvH%2Bko%3D"
// )}`;

// const cargarYMostrarMarcadoresHotelesYApartamentos = async () => {
//      try {
//           const response = await fetch(hotelsAndApartmentsApiUrl);
//           const data = await response.json();

//           data.buildings0014.forEach(item => {
//                // Verifica si la propiedad addressLocality es "Madrid"
//                if (item.address.value.addressLocality === "Madrid") {
//                     const ubicacion = item.location.value.coordinates;
//                     console.log(item);

//                     const hotelMarker = new google.maps.Marker({
//                          position: { lat: ubicacion[1], lng: ubicacion[0] },
//                          map: map,
//                          title: item.name.value,
//                          icon: "./assets/hotelsAndApartments_Qubo.svg"
//                     });

//                     hotelMarker.addListener('click', () => {
//                          const infoBox = document.querySelector(".info-box");
//                          infoBox.style.display = "flex";
//                          const idWithoutPrefix = item.id.replace(/^property_/, '');
//                          const capitalizedCategory = item.category.value[0].charAt(0).toUpperCase() + item.category.value[0].slice(1);
//                          infoBox.innerHTML = `
//                               <div class='nameContainer'>
//                                    <p>${capitalizedCategory}</p>
//                                    <p>${item.name.value}</p>
//                               </div>
//                               <img src='./assets/staticHotelsAndApartments.jpg'>
//                               <p>Código identificador: ${idWithoutPrefix}</p>
//                               <p>Address: ${item.address.value.streetAddress} C.P ${item.address.value.postalCode}</p>
//                               <p>Localización: ${item.address.value.addressLocality}, ${item.address.value.addressRegion}</p>
//                               <p>Source: <a class="links-propiedades" href="${item.source.value}" target="_blank">${item.source.value}</a></p>
//                               <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                               <button class='share'><img src='./assets/shareIcon.svg'></button>
//                          `;
//                          document.getElementById("cerrar-info-box").addEventListener("click", () => {
//                               infoBox.style.display = "none";
//                          });
//                     });

//                     markersHotelsAndApartments.push(hotelMarker);
//                }
//           });
//      } catch (error) {
//           console.error("Error fetching hotels and apartments:", error);
//      }
// };

// const eventHotelsAndApartments = document.getElementById("hotelsAndApartments-sub-nav-item");
// let markersHotelsAndApartments = [];
// let hotelsAndApartmentsVisible = false;

// eventHotelsAndApartments.addEventListener('click', async () => {
//      toggleMarcadores(markersHotelsAndApartments, hotelsAndApartmentsVisible);
//      hotelsAndApartmentsVisible = !hotelsAndApartmentsVisible;

//      if (markersHotelsAndApartments.length === 0 && hotelsAndApartmentsVisible) {
//           await cargarYMostrarMarcadoresHotelesYApartamentos();
//      }
// });




//! Función para mostrar SPORTS FACILITIES

//! Función para cargar y mostrar el KML Layer en el mapa
let kmlLayer;

function cargarKMLLayer() {
     const kmlUrl = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Sports%20Facilities/San%20Silvestre.kmz?sp=r&st=2024-12-08T12:36:53Z&se=2099-12-08T20:36:53Z&sv=2022-11-02&sr=b&sig=%2BrJwjOuvNGBjztJ%2BiHEy5ujNKFThqwG0UnCVVwZFwGY%3D';

     // Si existe una capa KML previa, la eliminamos
     if ( kmlLayer ) {
          kmlLayer.setMap( null );
          kmlLayer = null;
     }

     // Creamos una nueva capa KML
     kmlLayer = new google.maps.KmlLayer( {
          url: kmlUrl,
          map: map,
          preserveViewport: false,
          suppressInfoWindows: true,
     } );
}

//! Función para cargar marcadores de Sports Facilities
// Define la URL de la API con el proxy
const sportsFacilitiesApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Sports%20Facilities/Fiware_Entertainment_SportFacilities-00001?sp=r&st=2024-06-16T17:37:10Z&se=2090-01-01T02:37:10Z&sv=2022-11-02&sr=b&sig=CqfiHAHx2l9YohnmzltaYcL1sdgpQXrUwYlGRs58C2E%3D"
) }`;
function cargarMarcadoresSportsFacilities() {
     fetch( sportsFacilitiesApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0013.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/SportsFacilitiesQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.sportsFacilities }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p>Description: <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersSportsFacilities.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Sports Facilities:", error ) );
}

//! Función para cargar y mover el marcador dinámico del corredor
// Define la URL de la API con el proxy
const corredorApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Sports%20Facilities/san_silvestre_data.json?sp=r&st=2024-12-08T12:46:21Z&se=2099-12-08T20:46:21Z&sv=2022-11-02&sr=b&sig=lkvYTHmF7BXGl9H97bx%2Fk6j2ynipkAP3LrHbVJXzQiE%3D"
) }`;

let corredorMarker;
let corredorInterval;

function cargarCorredorDinamico() {

     fetch( corredorApiUrl )
          .then( response => response.json() )
          .then( data => {
               const { Coordenadas, Dorsal, Categoria, ImagenURL } = data;

               if ( !corredorMarker ) {
                    corredorMarker = new google.maps.Marker( {
                         map: map,
                         position: { lat: Coordenadas[ 0 ].lat, lng: Coordenadas[ 0 ].lng },
                         title: `Corredor ${ Dorsal }`,
                         icon: './assets/runnerIcon.svg',
                    } );

                    corredorMarker.addListener( "click", () => {
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         infoBox.innerHTML = `
                              <div class='nameContainer'>
                              <p>Dorsal: ${ Dorsal }</p>
                              <p>Categoría: ${ Categoria }</p>
                              </div>
                              <img src='${ ImagenURL }' alt='Corredor' onerror="this.src='./assets/runnerDefault.jpg'">
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );
               }

               // Mover marcador dinámico
               let index = 0;
               corredorInterval = setInterval( () => {
                    if ( index < Coordenadas.length ) {
                         corredorMarker.setPosition( new google.maps.LatLng( Coordenadas[ index ].lat, Coordenadas[ index ].lng ) );
                         index++;
                    } else {
                         clearInterval( corredorInterval );
                    }
               }, 1000 ); // Cambiar posición cada 1 segundo
          } )
          .catch( error => console.error( "Error al cargar los datos del corredor:", error ) );
}

//! Función para cargar el marcador estático del evento
// Define la URL de la API con el proxy
const eventoApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Sports%20Facilities/san_silvestre_event.json?sp=r&st=2024-12-08T13:04:51Z&se=2099-12-08T21:04:51Z&sv=2022-11-02&sr=b&sig=zs40%2Faq4HfQ92HaJnsUIX%2F1TpLIz4MyFN3rRee2FAjw%3D"
) }`;
let eventoMarker = null; // Variable global para el marcador del evento

function cargarMarcadorEvento() {

     // Si ya existe un marcador del evento, lo eliminamos primero
     if ( eventoMarker ) {
          eventoMarker.setMap( null );
     }


     fetch( eventoApiUrl )
          .then( response => response.json() )
          .then( data => {
               const { Nombre, Fecha, Participantes, Distancia, Record, Recordman, ImagenURL } = data;

               eventoMarker = new google.maps.Marker( {
                    map: map,
                    position: { lat: 40.45178, lng: -3.68445 }, // Cambiar por la primera coordenada del KML si es diferente
                    title: Nombre,
                    icon: './assets/SportsFacilitiesQubo.svg',
               } );

               eventoMarker.addListener( "click", () => {
                    const infoBox = document.querySelector( ".info-box" );
                    infoBox.style.display = "flex";
                    infoBox.innerHTML = `
                         <div class='nameContainer'>
                              <p>${ Nombre }</p>
                              <p>${ Fecha }</p>
                         </div>
                         <img src='${ ImagenURL }' alt='Evento' onerror="this.src='./assets/eventDefault.jpg'">
                         <p>Participantes: <span>${ Participantes }</span> </p>
                         <p>Distancia: <span>${ Distancia }</span> </p>
                         <p>Récord: <span>${ Record } (${ Recordman })</span> </p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                    `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                         infoBox.style.display = "none";
                    } );
               } );
          } )
          .catch( error => console.error( "Error al cargar los datos del evento:", error ) );
}

//! Lógica para gestionar la visibilidad
const eventSportsFacilities = document.getElementById( "sportsFacilities-sub-nav-item" );
let markersSportsFacilities = [];
let sportsFacilitiesVisible = false;


eventSportsFacilities.addEventListener( "click", () => {
     toggleMarcadores( markersSportsFacilities, sportsFacilitiesVisible );
     sportsFacilitiesVisible = !sportsFacilitiesVisible;

     // Toggle KML Layer
     if ( kmlLayer ) {
          kmlLayer.setMap( kmlLayer.getMap() ? null : map );
     }

     // Limpiar marcador del corredor y detener el intervalo
     if ( corredorMarker ) {
          corredorMarker.setMap( null );
          corredorMarker = null;
     }
     if ( corredorInterval ) {
          clearInterval( corredorInterval );
     }


     // Limpiar marcador del evento
     if ( eventoMarker ) {
          eventoMarker.setMap( sportsFacilitiesVisible ? map : null );
     }

     // Si es la primera vez o si se está activando la capa
     if ( sportsFacilitiesVisible ) {
          // Si los marcadores no existen, cargarlos
          if ( markersSportsFacilities.length === 0 ) {
               cargarMarcadoresSportsFacilities();
          }
          cargarKMLLayer();
          cargarCorredorDinamico();
          cargarMarcadorEvento();
     }
} );

//! Función para mostrar MUSEUMS

// Define la URL de la API con el proxy
const museumsApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Museums/Fiware_Entertainment_Musuems-00001?sp=r&st=2024-06-16T17:49:06Z&se=2090-01-01T02:49:06Z&sv=2022-11-02&sr=b&sig=j%2BMozWtJqpIgWXgEitlNgqCHWhqw9XbBGOSJ%2Fy3pkbE%3D"
) }`;

function cargarMarcadoresMuseums() {
     fetch( museumsApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.pois0003.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/MuseumsQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.museums }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: <span>${ streetAddress }</span> </p>
                              <p>C.P: <span>${ postalCode }</span> </p>
                              <p>Neighborhood: <span>${ neighborhood }</span> </p>
                              <p>District: <span>${ district }</span> </p>
                              <p>Country: <span>${ addressCountry }</span> </p>
                              <p>Description: <span>${ description }</span> </p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersMuseums.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Museums:", error ) );
}

const eventMuseums = document.getElementById( "museums-sub-nav-item" );
let markersMuseums = [];
let museumsVisible = false;

eventMuseums.addEventListener( "click", () => {
     toggleMarcadores( markersMuseums, museumsVisible );
     museumsVisible = !museumsVisible;

     if ( markersMuseums.length === 0 && museumsVisible ) {
          cargarMarcadoresMuseums();
     }
} );


//* BOTÓN SERVICES ****************

//! Función para mostrar SOCIAL SERVICES


// Define la URL de la API con el proxy
const socialServicesApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Social%20Services/Fiware_Services_Social-00001?sp=r&st=2024-06-16T17:59:29Z&se=2090-01-01T02:59:29Z&sv=2022-11-02&sr=b&sig=oBQu3hzgqmqx2L0eRX%2FipjagbMzy8Boe4ORmVpqDZV0%3D"
) }`;

function cargarMarcadoresSocialServices() {
     fetch( socialServicesApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0021.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/SocialServicesQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.socialServices }'>
                              <p>Localización: <span>${ addressLocality }, ${ addressRegion }</span> </p>
                              <p>Address: ${ streetAddress }</p>
                              <p>C.P: ${ postalCode }</p>
                              <p>Neighborhood: ${ neighborhood }</p>
                              <p>District: ${ district }</p>
                              <p>Country: ${ addressCountry }</p>
                              <p>${ description }</p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersSocialServices.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Social Services:", error ) );
}

const eventSocialServices = document.getElementById( "socialServices-sub-nav-item" );
let markersSocialServices = [];
let socialServicesVisible = false;

eventSocialServices.addEventListener( "click", () => {
     toggleMarcadores( markersSocialServices, socialServicesVisible );
     socialServicesVisible = !socialServicesVisible;

     if ( markersSocialServices.length === 0 && socialServicesVisible ) {
          cargarMarcadoresSocialServices();
     }
} );


//! Función para mostrar ADMINISTRATION

// Define la URL de la API con el proxy
const administrationApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Administration/Fiware_Services_Administration-00001?sp=r&st=2024-06-16T18:03:33Z&se=2090-01-01T03:03:33Z&sv=2022-11-02&sr=b&sig=WwIaNf4gMfolhWsPkfUnOFOeHA9Oori3A7zGPQH5rYg%3D"
) }`;

function cargarMarcadoresAdministration() {
     fetch( administrationApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0019.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/AdministrationQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.administration }'>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>Address: ${ streetAddress }</p>
                              <p>C.P: ${ postalCode }</p>
                              <p>Neighborhood: ${ neighborhood }</p>
                              <p>District: ${ district }</p>
                              <p>Country: ${ addressCountry }</p>
                              <p>${ description }</p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersAdministration.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Administration:", error ) );
}

const eventAdministration = document.getElementById( "administration-sub-nav-item" );
let markersAdministration = [];
let administrationVisible = false;

eventAdministration.addEventListener( "click", () => {
     toggleMarcadores( markersAdministration, administrationVisible );
     administrationVisible = !administrationVisible;

     if ( markersAdministration.length === 0 && administrationVisible ) {
          cargarMarcadoresAdministration();
     }
} );


//! Función para mostrar EDUCATION

// Define la URL de la API con el proxy
const educationApiUrl = `/api/proxy?url=${ encodeURIComponent(
     "https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Education/Fiware_Services_Education-00001?sp=r&st=2024-06-16T18:07:19Z&se=2090-01-01T03:07:19Z&sv=2022-11-02&sr=b&sig=gG6j583zzB5xorwVszx7c84zXo4bIIdsYDTJT4c%2Bz2U%3D"
) }`;

function cargarMarcadoresEducation() {
     fetch( educationApiUrl )
          .then( response => response.json() )
          .then( data => {
               data.buildings0020.forEach( item => {
                    const {
                         ubicacion,
                         name,
                         category,
                         description,
                         streetAddress,
                         postalCode,
                         addressLocality,
                         addressRegion,
                         addressCountry,
                         neighborhood,
                         district,
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/EducationQubo.svg"
                         } );

                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='${ STATIC_IMAGES.education }'>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>Address: ${ streetAddress }</p>
                              <p>C.P: ${ postalCode }</p>
                              <p>Neighborhood: ${ neighborhood }</p>
                              <p>District: ${ district }</p>
                              <p>Country: ${ addressCountry }</p>
                              <p>${ description }</p>
                              <p>Link: <a href="${ source }" target="_blank">${ source }</a></p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersEducation.push( marker );
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Education:", error ) );
}

const eventEducation = document.getElementById( "education-sub-nav-item" );
let markersEducation = [];
let educationVisible = false;

eventEducation.addEventListener( "click", () => {
     toggleMarcadores( markersEducation, educationVisible );
     educationVisible = !educationVisible;

     if ( markersEducation.length === 0 && educationVisible ) {
          cargarMarcadoresEducation(); // Corregido: llamada a la función correcta
     }
} );


//* --------------------------------------------------------------------------------------
//! Función para seleccionar cada botón de las barras tanto primaria como secundaria
document.addEventListener( "DOMContentLoaded", function () {
     const botonesPrincipales = document.querySelectorAll( ".nav-bar .nav-item" );
     const botonesSecundarios = document.querySelectorAll( ".segunda-barra ul li" );
     const botonesCerrar = document.querySelectorAll( ".segunda-barra .cerrar" );

     botonesPrincipales.forEach( boton => {
          boton.addEventListener( "click", function () {
               const targetBarra = this.getAttribute( "data-target" );
               mostrarBarra( targetBarra );
               this.querySelector( "img" ).classList.add( "activo" );
          } );
     } );

     botonesSecundarios.forEach( boton => {
          boton.addEventListener( "click", function () {
               this.querySelector( "img" ).classList.toggle( "activo" );
               actualizarEstadoBotonPrincipal( this.closest( ".segunda-barra" ).getAttribute( "id" ) );
          } );
     } );

     botonesCerrar.forEach( boton => {
          boton.addEventListener( "click", function () {
               const targetBarra = this.getAttribute( "data-target" );
               cerrarBarra( targetBarra );
          } );
     } );

     //! Función para mostrar las barras secundarias
     function mostrarBarra( id ) {
          // Cerrar todas las barras secundarias
          const todasLasBarras = document.querySelectorAll( ".segunda-barra" );
          todasLasBarras.forEach( barra => {
               barra.style.display = "none";
               // Actualizar el estado del botón principal correspondiente solo si no hay botones secundarios activos
               if ( barra.id !== id ) {
                    const botonesActivos = barra.querySelectorAll( "li .activo" ).length;
                    if ( botonesActivos === 0 ) {
                         const botonPrincipal = document.querySelector( `.nav-item[data-target="${ barra.id }"] img` );
                         botonPrincipal.classList.remove( "activo" );
                    }
               }
          } );

          // Mostrar la nueva barra secundaria solicitada
          const nuevaBarra = document.getElementById( id );
          nuevaBarra.style.display = "flex";
          nuevaBarra.style.justifyContent = "center";

          // Actualizar el estado del botón principal correspondiente
          const botonPrincipal = document.querySelector( `.nav-item[data-target="${ id }"] img` );
          botonPrincipal.classList.add( "activo" );
     }

     //! Funcion para cerrar las barras secundarias
     function cerrarBarra( id ) {
          document.getElementById( id ).style.display = "none";
          actualizarEstadoBotonPrincipal( id );
     }


     //! Función para actualizar la visibilidad de los iconos (activar)
     function actualizarEstadoBotonPrincipal( idBarra ) {
          const barra = document.getElementById( idBarra );
          const botonesActivos = barra.querySelectorAll( "li .activo" ).length; // Cuenta los botones secundarios activos
          const botonPrincipal = document.querySelector( `.nav-item[data-target="${ idBarra }"] img` ); // Selecciona la imagen dentro del botón principal correspondiente

          if ( botonesActivos > 0 ) {
               botonPrincipal.classList.add( "activo" ); // Activa el botón principal si hay botones secundarios activos
          } else {
               botonPrincipal.classList.remove( "activo" ); // Desactiva el botón principal si no hay botones secundarios activos
          }
     }

} );

//! Función barra pantallas móviles
// document.addEventListener( 'DOMContentLoaded', function () {
//      const navBar = document.getElementById( 'nav-bar' );
//      const secondBars = document.querySelectorAll( '.segunda-barra' );
//      const navItems = navBar.querySelectorAll( 'ul > li' );
//      const mediaQuery = window.matchMedia( '(max-width: 1000px)' );

//      navItems.forEach( item => {
//           item.addEventListener( 'click', () => {
//                if ( mediaQuery.matches ) {  // Solo aplicar en pantallas menores a 390px
//                     navBar.style.display = 'none';
//                }

//                // Mostrar la segunda barra correspondiente
//                const target = item.getAttribute( 'data-target' );
//                const secondBar = document.getElementById( target );
//                if ( secondBar ) {
//                     secondBars.forEach( bar => {
//                          bar.style.bottom = '';
//                     } );
//                     secondBar.style.bottom = '0px';
//                     secondBar.style.display = 'flex';
//                }
//           } );
//      } );

//      // Añadir evento para los botones de cerrar en las segundas barras
//      secondBars.forEach( bar => {
//           const closeButton = bar.querySelector( '.cerrar' );
//           if ( closeButton ) {
//                closeButton.addEventListener( 'click', () => {
//                     bar.style.display = 'none';
//                     if ( mediaQuery.matches ) {  // Solo aplicar en pantallas menores a 390px
//                          navBar.style.display = 'flex'; // Mostrar la barra de navegación principal
//                     }
//                } );
//           }
//      } );
// } );

document.addEventListener( 'DOMContentLoaded', function () {
     const navBar = document.getElementById( 'nav-bar' );
     const secondBars = document.querySelectorAll( '.segunda-barra' );
     const navItems = navBar.querySelectorAll( 'ul > li' );
     const mediaQuery = window.matchMedia( '(max-width: 1000px)' ); // Ajuste para que sea menor de 1000px

     navItems.forEach( item => {
          item.addEventListener( 'click', () => {
               const target = item.getAttribute( 'data-target' );
               const secondBar = document.getElementById( target );

               if ( mediaQuery.matches ) {  // Aplicar solo si la pantalla es menor de 1000px
                    navBar.style.display = 'none';
                    if ( secondBar ) {
                         secondBars.forEach( bar => {
                              bar.style.bottom = '';
                         } );
                         secondBar.style.bottom = '0px';
                         secondBar.style.display = 'flex';
                    }
               }
          } );
     } );

     secondBars.forEach( bar => {
          const closeButton = bar.querySelector( '.cerrar' );
          closeButton.addEventListener( 'click', () => {
               bar.style.display = 'none';
               if ( mediaQuery.matches ) {
                    navBar.style.display = 'flex'; // Restaurar la barra de navegación principal
               }
          } );
     } );
} );



//! Funcionalidad botones 3D, detalles y 2D

document.addEventListener( "DOMContentLoaded", () => {
     // Referencias a los botones
     const button2d = document.getElementById( "button2d" );
     const button3d = document.getElementById( "button3d" );
     const buttonSatelliteDetails = document.getElementById( "buttonSatelliteDetails" );

     // Selecciona los textos de todos los botones en `topButtons`
     const topButtonsText = document.querySelectorAll(
          ".topBottoms .button-title-container p"
     );

     // Estado para controlar visibilidad de etiquetas
     let labelsVisible = false;

     // Función para habilitar/deshabilitar el botón "Detalles"
     function toggleDetailsButton( enable ) {
          if ( enable ) {
               buttonSatelliteDetails.disabled = false;
               buttonSatelliteDetails.classList.remove( "disabled" );
          } else {
               buttonSatelliteDetails.disabled = true;
               buttonSatelliteDetails.classList.add( "disabled" );
          }
     }

     // Comprobar tipo de mapa al cargar la página
     function checkInitialMapType() {
          if ( map ) {
               const initialType = map.getMapTypeId();
               if ( initialType === "satellite" || initialType === "hybrid" ) {
                    toggleDetailsButton( true ); // Habilitar "Detalles" si está en modo satélite
                    changeButtonTextColor( "white" );
               } else {
                    toggleDetailsButton( false ); // Deshabilitar "Detalles" si está en otro modo
                    changeButtonTextColor( "black" );
               }
          } else {
               console.error( "El mapa no está inicializado correctamente." );
          }
     }

     // Función para cambiar el color del texto de los botones
     function changeButtonTextColor( color ) {
          topButtonsText.forEach( ( textElement ) => {
               textElement.style.color = color;
          } );
     }



     // Evento para cambiar a "Mapa" (2D)
     button2d.addEventListener( "click", () => {
          if ( map ) {
               console.log( "Cambiando a vista 2D (roadmap)" );
               map.setMapTypeId( "roadmap" ); // Cambia al modo mapa (2D)
               map.setOptions( { styles: null } ); // Restablece estilos si hay alguno aplicado
               labelsVisible = false; // Restablece etiquetas invisibles en satélite
               toggleDetailsButton( false ); // Deshabilita el botón de detalles
               changeButtonTextColor( "black" );
          } else {
               console.error( "El mapa no está inicializado correctamente." );
          }
     } );

     // Evento para cambiar a "Satélite" (3D)
     button3d.addEventListener( "click", () => {
          if ( map ) {
               console.log( "Cambiando a vista 3D (satellite)" );
               map.setMapTypeId( "satellite" ); // Cambia al modo satélite
               labelsVisible = false; // Etiquetas inicialmente ocultas
               toggleDetailsButton( true ); // Habilita el botón de detalles
               changeButtonTextColor( "white" ); // Cambia texto a blanco
          } else {
               console.error( "El mapa no está inicializado correctamente." );
          }
     } );

     // Evento para alternar "Detalles" (etiquetas)
     buttonSatelliteDetails.addEventListener( "click", () => {
          console.log( "Botón Detalles clicado" );
          if ( map ) {
               if ( map.getMapTypeId() === "satellite" || map.getMapTypeId() === "hybrid" ) {
                    if ( !labelsVisible ) {
                         console.log( "Mostrando etiquetas (cambiando a hybrid)" );
                         map.setMapTypeId( "hybrid" ); // Cambia a satélite con etiquetas visibles (nombres de calles, negocios, etc.)
                         labelsVisible = true;
                    } else {
                         console.log( "Ocultando etiquetas (cambiando a satellite)" );
                         map.setMapTypeId( "satellite" ); // Cambia a satélite sin etiquetas
                         labelsVisible = false;
                    }
               } else {
                    alert( "Cambia al modo satélite primero para usar este botón." );
               }
          } else {
               console.error( "El mapa no está inicializado correctamente." );
          }
     } );

     // Verificar tipo de mapa inicial al cargar la página
     // checkInitialMapType();
} );


document.addEventListener( 'DOMContentLoaded', function () {
     const topBottoms = document.querySelector( '.topBottoms' );
     const minimizeButton = document.getElementById( 'minimize-topBottoms' );
     const optionButton = document.getElementById( 'option-button' );
     const optionItem = document.getElementById( 'option-item' );

     const navBar = document.getElementById( 'nav-bar' );
     const minimizeNavBarButton = document.getElementById( 'minimize-nav-bar' );
     const maximizeNavBarButton = document.querySelector( '.minimizeButtonNavBar img' ); // Asegúrate de que el selector apunte al botón dentro del div
     const minimizeButtonNavBar = document.querySelector( '.minimizeButtonNavBar' );
     const mediaQuery = window.matchMedia( '(max-width: 430px)' );

     // Evento de minimización de la nav-bar
     minimizeNavBarButton.addEventListener( 'click', () => {
          if ( mediaQuery.matches ) { // Solo se aplica si la pantalla es menor a 360px
               navBar.style.display = 'none'; // Oculta la nav-bar
               minimizeButtonNavBar.style.display = 'flex'; // Muestra el botón para maximizar
          }
     } );

     // Evento de maximización de la nav-bar
     maximizeNavBarButton.addEventListener( 'click', () => {
          if ( mediaQuery.matches ) { // Solo se aplica si la pantalla es menor a 360px
               navBar.style.display = 'flex'; // Muestra la nav-bar
               minimizeButtonNavBar.style.display = 'none'; // Oculta el botón de opción
          }
     } );

     minimizeButton.addEventListener( 'click', () => {
          topBottoms.style.display = 'none';
          optionButton.style.display = 'flex';
     } );

     optionItem.addEventListener( 'click', () => {
          topBottoms.style.display = 'flex';
          optionButton.style.display = 'none';
     } );

} );

//? Función para manejar el widget de Discord
// function initDiscordWidget() {
//      const widgetContainer = document.querySelector( '.discord-widget' );
//      let isMinimized = true; // Estado inicial minimizado

//      // Crear el contenedor del widget con estado minimizado
//      widgetContainer.innerHTML = `
//                <div class="discord-widget-header">
//                     <i class="fab fa-discord"></i>
//                     <span>Discord Chat</span>
//                     <button class="toggle-widget">+</button>
//                </div>
//                <div class="discord-widget-content" style="display: none;">
//                     <iframe 
//                          src="https://discord.com/widget?id=1338208014183956560&theme=dark" 
//                          width="350" 
//                          height="500" 
//                          allowtransparency="true" 
//                          frameborder="0" 
//                          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts">
//                     </iframe>
//                </div>
//                `;

//      // Añadir el evento para minimizar/maximizar
//      const toggleButton = widgetContainer.querySelector( '.toggle-widget' );
//      const widgetContent = widgetContainer.querySelector( '.discord-widget-content' );

//      toggleButton.addEventListener( 'click', () => {
//           isMinimized = !isMinimized;
//           widgetContent.style.display = isMinimized ? 'none' : 'block';
//           toggleButton.textContent = isMinimized ? '+' : '-';
//      } );
// }

// // Inicializar el widget cuando el documento esté listo
// document.addEventListener( 'DOMContentLoaded', initDiscordWidget );
//? Función para manejar el widget de Discord
function initDiscordWidget() {
     const widgetContainer = document.querySelector( '.discord-widget' );
     let isMinimized = true;

     // Crear el contenedor del widget con solo el icono inicialmente
     widgetContainer.innerHTML = `
          <div class="discord-icon-button">
               <i class="fab fa-discord"></i>
          </div>
          <div class="discord-widget-expanded" style="display: none;">
               <div class="discord-widget-header">
                    <i class="fab fa-discord"></i>
                    <span>Discord Chat</span>
                    <button class="close-widget">
                         <i class="fas fa-times"></i>
                    </button>
               </div>
               <div class="discord-widget-content">
                    <iframe 
                         src="about:blank"
                         width="350" 
                         height="500" 
                         allowtransparency="true" 
                         frameborder="0" 
                         sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                         loading="lazy">
                    </iframe>
               </div>
          </div>
          `;

     const iconButton = widgetContainer.querySelector( '.discord-icon-button' );
     const expandedWidget = widgetContainer.querySelector( '.discord-widget-expanded' );
     const closeButton = widgetContainer.querySelector( '.close-widget' );
     const iframe = widgetContainer.querySelector( 'iframe' );
     let iframeLoaded = false;

     iconButton.addEventListener( 'click', () => {
          isMinimized = false;
          iconButton.style.display = 'none';
          expandedWidget.style.display = 'block';

          // Cargar el iframe solo la primera vez
          if ( !iframeLoaded ) {
               iframe.src = "https://discord.com/widget?id=1338208014183956560&theme=dark";
               iframeLoaded = true;
          }
     } );

     closeButton.addEventListener( 'click', () => {
          isMinimized = true;
          expandedWidget.style.display = 'none';
          iconButton.style.display = 'flex';
     } );
}

document.addEventListener( 'DOMContentLoaded', initDiscordWidget );

//? Arrastrar info-box

// Función para hacer un elemento arrastrable
function hacerArrastrable( elemento, mango ) {
     let isDown = false;
     let offsetX, offsetY;

     // Primero removemos los event listeners anteriores si existen
     const nuevoMango = mango.cloneNode( true );
     mango.parentNode.replaceChild( nuevoMango, mango );

     nuevoMango.addEventListener( 'mousedown', function ( e ) {
          // Verifica si el evento se originó en un botón o select
          if ( e.target.closest( 'button' ) || e.target.closest( 'select' ) || e.target.closest( 'input' ) ) {
               return;
          }

          isDown = true;
          offsetX = e.clientX - elemento.getBoundingClientRect().left;
          offsetY = e.clientY - elemento.getBoundingClientRect().top;

          // Añadir clase mientras se arrastra
          elemento.classList.add( 'dragging' );
     } );

     document.addEventListener( 'mouseup', function () {
          isDown = false;
          elemento.classList.remove( 'dragging' );
     } );

     document.addEventListener( 'mousemove', function ( e ) {
          if ( !isDown ) return;

          // Obtener dimensiones de la ventana y el elemento
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const elementWidth = elemento.offsetWidth;
          const elementHeight = elemento.offsetHeight;

          // Calcular nuevas posiciones
          let newX = e.clientX - offsetX;
          let newY = e.clientY - offsetY;

          // Limitar las posiciones para que no se salgan de la ventana
          newX = Math.max( 0, Math.min( newX, windowWidth - elementWidth ) );
          newY = Math.max( 0, Math.min( newY, windowHeight - elementHeight ) );

          elemento.style.left = ( e.clientX - offsetX ) + 'px';
          elemento.style.top = ( e.clientY - offsetY ) + 'px';
     } );
}

// Función para inicializar el arrastre en un infobox
function inicializarArrastre( infoBox ) {
     const nameContainer = infoBox.querySelector( '.nameContainer' );
     if ( nameContainer ) {
          hacerArrastrable( infoBox, nameContainer );
     }
}

// Observar cambios en el DOM
const observer = new MutationObserver( function ( mutations ) {
     mutations.forEach( function ( mutation ) {
          mutation.addedNodes.forEach( function ( node ) {
               if ( node.nodeType === 1 ) { // Es un elemento
                    if ( node.classList && (
                         node.classList.contains( 'info-box' ) ||
                         node.classList.contains( 'info-box-trucks' ) ||
                         node.classList.contains( 'info-box-ships' ) ) ) {
                         inicializarArrastre( node );
                    }
               }
          } );

          // También verificar cambios en el estilo (cuando se muestra un infobox existente)
          if ( mutation.type === 'attributes' &&
               mutation.attributeName === 'style' &&
               ( mutation.target.classList.contains( 'info-box' ) || mutation.target.classList.contains( 'info-box-trucks' ) ) ) {
               if ( mutation.target.style.display === 'flex' ) {
                    inicializarArrastre( mutation.target );
               }
          }
     } );
} );

// Inicializar la observación
document.addEventListener( 'DOMContentLoaded', function () {
     // Observar todo el documento para detectar nuevos infobox
     observer.observe( document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: [ 'style' ]
     } );

     // Añadir estilos CSS necesarios
     const style = document.createElement( 'style' );
     style.textContent = `
          .info-box, .info-box-trucks {
               position: absolute !important;
               cursor: default;
          }
          .info-box .nameContainer, .info-box-trucks .nameContainer {
               cursor: move;
          }
          .dragging {
               opacity: 0.9;
          }
          `;
     document.head.appendChild( style );
} );
