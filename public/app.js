"use strict";

let map;
let myLocationMarker;
let autocomplete;

function initMap() {

     // Crear un objeto de opciones del mapa
     const mapOptions = {
          zoom: 10,
          fullscreenControl: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeId: "satellite",
     };

     document.addEventListener( 'DOMContentLoaded', function () {
          // Asumiendo que 'map' es tu variable de mapa de Google Maps ya inicializada
          fetch( '/api/v1/qubo' ) // Asegúrate de que la URL es correcta
               .then( response => response.json() )
               .then( qubos => {
                    qubos.forEach( qubo => {
                         const position = { lat: qubo.latitude, lng: qubo.longitude };
                         const marker = new google.maps.Marker( {
                              position: position,
                              map: map,
                              title: qubo.title,
                              icon: "./assets/quboNeutro.svg"
                         } );
                         marker.addListener( 'click', () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = 'block';
                              const startDate = new Date( qubo.startDate );
                              const finishDate = new Date( qubo.finishDate );

                              infoBox.innerHTML = `
                         <div class='nameContainer'>
                         <p>${ qubo.category }</p>
                         <p>${ qubo.title }</p>
                         </div>
                         <div class='own'>
                              <img src='${ qubo.img }'>
                         </div>
                         <p>Descripción: ${ qubo.description }</p>
                         <p>Subcategoría: ${ qubo.subcategory }</p>
                         <p>Fecha de inicio: ${ startDate.toLocaleDateString() } a las ${ startDate.toLocaleTimeString() }</p>
                         <p>Fecha de finalización: ${ finishDate.toLocaleDateString() } a las ${ finishDate.toLocaleTimeString() }</p>
                         <p>Link: <a href="${ qubo.link }" target="_blank">${ qubo.link }</a></p>
                         <p>Anónimo: ${ qubo.anonymous ? "Sí" : "No" }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );
                    } );
               } )
               .catch( error => console.error( 'Error al cargar los Qubos:', error ) );
     } );

     // Crear el mapa y establecerlo en el div con el id "gmp-map"
     map = new google.maps.Map( document.getElementById( "gmp-map" ), mapOptions );

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

     //? DATOS PARA VALENCIA BARRIOS/POLÍGONOS

     // fetch(valenciaAPIURL)
     //   .then((response) => {
     //       if (response.ok) {
     //         return response.json(); // Obtener los datos en formato JSON
     //       } else {
     //         throw new Error("La solicitud no fue exitosa");
     //       }
     //     })
     //     .then((data) => {
     //        // console.log(data);

     //        //? Función para conseguir NOMBRES de los barrios de VALENCIA
     //       const nombresBarrioValencia = data.results;

     //       const getNamesValencia = () => {
     //         for (let i = 0; i < nombresBarrioValencia.length; i++) {
     //             const element = nombresBarrioValencia[i].nombre;
     //             // console.log(element);
     //         }
     //       };
     //       getNamesValencia();

     //       // Itera sobre los resultados para dibujar polígonos en el mapa
     //       data.results.forEach((result) => {
     //         const coordinates = result.geo_shape.geometry.coordinates[0];

     //         // Convertir las coordenadas a un arreglo de objetos de LatLng
     //         const latLngs = coordinates.map((coordinate) => ({
     //             lat: coordinate[1],
     //             lng: coordinate[0],
     //         }));

     //         // Dibuja el polígono en el mapa
     //         const polygon = new google.maps.Polygon({
     //             paths: latLngs,
     //             strokeColor: "#08ecc4",
     //             strokeOpacity: 0.8,
     //             strokeWeight: 4,
     //             fillColor: "#08ecc4",
     //             fillOpacity: 0.35,
     //             map: barriosVisible ? map : null,
     //         });
     //         poligonosBarrios.push(polygon);
     //       });
     //   })
     //   .catch((error) => {
     //       console.error("Hubo un problema con la solicitud:", error);
     //   });

     //!----------------------------------------------------------
     document.addEventListener( 'DOMContentLoaded', () => {
          const inputContainer = document.getElementById( 'input-container' );
          const searchDirectionButton = document.getElementById( 'search-direction-button' );

          // Función para mostrar y ocultar el inputContainer
          const toggleInputContainer = () => {
               if ( inputContainer.style.display === 'none' || inputContainer.style.display === '' ) {
                    inputContainer.style.display = 'block';
                    inputContainer.style.opacity = '1';
                    searchDirectionButton.classList.add( 'active' );

               } else {
                    inputContainer.style.display = 'none';
                    inputContainer.style.opacity = '0';
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

     // let isAddingQubo = false;
     // let currentMarker = null; // Variable para almacenar el marcador actual

     // document.addEventListener( 'DOMContentLoaded', function () {
     //      const addQuboButton = document.getElementById( 'addQubo' );
     //      const formContainer = document.querySelector( '.form-container' );
     //      const messageBox = document.getElementById( 'messageBox' );
     //      const closeButton = document.getElementById( 'cerrar-form' );

     //      // Activar modo de añadir Qubo
     //      addQuboButton.addEventListener( 'click', function () {
     //           isAddingQubo = true;
     //           messageBox.style.display = 'block'; // Mostrar un mensaje para hacer clic en el mapa
     //           formContainer.classList.add( 'hidden' ); // Asegúrate de que el formulario está oculto

     //           console.log( 'Modo añadir Qubo activado, por favor haz clic en el mapa para seleccionar la ubicación.' );
     //      } );

     //      // Escucha clics en el mapa
     //      map.addListener( 'click', function ( event ) {
     //           if ( isAddingQubo ) {
     //                // Capturar las coordenadas donde el usuario hizo clic
     //                const lat = event.latLng.lat();
     //                const lng = event.latLng.lng();
     //                console.log( "Latitud:", lat, "Longitud:", lng );

     //                // Crear un nuevo marcador y añadirlo al mapa
     //                currentMarker = new google.maps.Marker( {
     //                     position: event.latLng,
     //                     map: map,
     //                     title: 'Nuevo Qubo',
     //                     icon: "./assets/quboNeutro.png"
     //                } );

     //                // Establecer valores en los campos ocultos del formulario
     //                document.getElementById( 'clickedLat' ).value = lat;
     //                document.getElementById( 'clickedLng' ).value = lng;

     //                // Mostrar el formulario solo después de seleccionar la ubicación
     //                formContainer.classList.remove( 'hidden' );
     //                messageBox.style.display = 'none'; // Ocultar el mensaje
     //                // centerFormContainer(); // Asegúrate de que el formulario se centre correctamente

     //                isAddingQubo = false;
     //                console.log( 'Formulario mostrado, por favor completa la información del Qubo.' );
     //           }
     //      } );

     //      // Manejar el cierre del formulario
     //      closeButton.addEventListener( 'click', function () {
     //           formContainer.classList.add( 'hidden' );
     //           isAddingQubo = false;

     //           // Si existe un marcador actual, elimínalo del mapa
     //           if ( currentMarker ) {
     //                currentMarker.setMap( null );
     //                currentMarker = null; // Resetea la variable del marcador
     //           }

     //           console.log( 'Formulario cerrado, marcador eliminado.' );
     //      } );
     let subcategoryIcons = {};

     document.addEventListener( 'DOMContentLoaded', function () {
          // Cargar los iconos de las subcategorías desde el servidor
          fetch( '/api/icons' )
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

          addQuboButton.addEventListener( 'click', function () {
               isAddingQubo = true;
               messageBox.style.display = 'block';
               formContainer.classList.add( 'hidden' );
               console.log( 'Modo añadir Qubo activado, por favor haz clic en el mapa para seleccionar la ubicación.' );
          } );

          map.addListener( 'click', function ( event ) {
               if ( isAddingQubo ) {
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    console.log( "Latitud:", lat, "Longitud:", lng );

                    const subcategory = document.getElementById( 'subcategory' ).value;
                    const iconUrl = subcategoryIcons[ subcategory ] || './assets/quboNeutro.png';
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
          Logistics: [ "Pick-up Points", "Pack Location" ],
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

     // Función para actualizar las subcategorías cuando se selecciona una categoría
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
                    option.value = subcategory;
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

          form.addEventListener( 'submit', function ( event ) {
               event.preventDefault();

               const startDate = new Date( document.getElementById( 'startDateTime' ).value );
               const finishDate = new Date( document.getElementById( 'endDateTime' ).value );

               if ( isNaN( startDate.valueOf() ) || isNaN( finishDate.valueOf() ) ) {
                    alert( 'Please enter valid start and finish dates.' );
                    return; // No enviar formulario si las fechas son inválidas
               }

               // Usar FormData para recopilar todos los datos del formulario, incluido el archivo
               const formData = new FormData( form );

               fetch( form.action, {
                    method: 'POST',
                    body: formData
               } )
                    .then( response => response.json() )
                    .then( data => {
                         console.log( 'Success:', data );
                         messageBox.innerHTML = `Qubo añadido con éxito!`; // Cambiando el contenido del messageBox
                         messageBox.style.display = 'block';
                         // Aquí puedes redireccionar al usuario o limpiar el formulario, etc.
                         // Cerrar el formulario automáticamente
                         formContainer.classList.add( 'hidden' ); // Oculta el contenedor del formulario

                         // Opcional: Limpiar el formulario
                         form.reset();
                         setTimeout( () => {
                              window.location.reload();
                         }, 8000 );
                    } )
                    .catch( ( error ) => {
                         console.error( 'Error:', error );
                         alert( 'Error al añadir el Qubo.' );
                    } );
          } );
     } );



     //! Función para activar/desactivar barrios

     // let barriosVisible = false;
     // const poligonosBarrios = [];

     // function toggleBarrios() {
     //   for (let i = 0; i < poligonosBarrios.length; i++) {
     //       poligonosBarrios[i].setMap(barriosVisible ? map : null);
     //   }
     //   barriosVisible = !barriosVisible;
     // }
     // document.getElementById("toggleBarrios").addEventListener("click", toggleBarrios);

     //  //? DATOS PARA MADRID BARRIOS/POLÍGONOS



     // fetch(kmlURL)
     //   .then((response) => {
     //       if (response.ok) {
     //         return response.text(); // Obtener el texto del KML
     //       } else {
     //         throw new Error("La solicitud no fue exitosa");
     //       }
     //     })
     //     .then((kmlText) => {
     //        // Convertir el texto KML a un documento XML
     //       const parser = new DOMParser();
     //       const kmlDocument = parser.parseFromString(kmlText, "application/xml");
     //       // console.log(kmlDocument);

     //       // Obtener los elementos Placemark del KML
     //       const placemarks = kmlDocument.getElementsByTagName("Placemark");
     //       // console.log(placemarks);

     //       // Iterar sobre los Placemarks para obtener los polígonos
     //       for (let i = 0; i < placemarks.length; i++) {
     //         const coordinatesText = placemarks[i].getElementsByTagName("coordinates")[0].textContent;

     //         const coordinatesArray = coordinatesText.trim().split(" ");

     //         const coordinates = coordinatesArray.map((coordinate) => {
     //             const [lng, lat] = coordinate.split(",").map(parseFloat);
     //             return { lat, lng };
     //         });

     //         // Dibujar el polígono en Google Maps
     //         const polygon = new google.maps.Polygon({
     //             paths: coordinates,
     //             strokeColor: "#FF1053",
     //             strokeOpacity: 0.8,
     //             strokeWeight: 2,
     //             fillColor: "#FF1053",
     //             fillOpacity: 0.35,
     //             map: barriosVisible ? map : null,
     //         });
     //         poligonosBarrios.push(polygon);

     //         //? Obtener el nombre del barrio MADRID
     //         const simpleData = placemarks[i].getElementsByTagName("SimpleData");
     //         let nombreBarrio = "";

     //         for (let i = 0; i < simpleData.length; i++) {
     //             if (simpleData[i].getAttribute("name") === "NOMDIS") {
     //               nombreBarrio = simpleData[i].innerHTML;
     //               break;
     //             }
     //         }
     //         // console.log(nombreBarrio);
     //       }
     //   })
     //   .catch((error) => {
     //       console.error("Hubo un problema con la solicitud:", error);
     //   });




     //! DESCOMENTAR DESCOMENTAR DESCOMENTAR DESCOMENTAR DESCOMENTAR
     //! --------------------------------------------------------------------------------------

     // //? FUNCIÓN MOSTRAR U OCULTAR BARRIOS MADRID Y VALENCIA
     // function toggleBarrios() {
     //      if ( poligonosBarrios.length === 0 ) {
     //           crearYMostrarBarrios();
     //      } else {
     //           for ( let i = 0; i < poligonosBarrios.length; i++ ) {
     //                poligonosBarrios[ i ].setMap( barriosVisible ? null : map );
     //           }
     //           barriosVisible = !barriosVisible;
     //      }
     // }

     // document.getElementById( "toggleBarrios" ).addEventListener( "click", toggleBarrios );

     // const kmlURL =
     //      "https://anpaccountdatalakegen2.blob.core.windows.net/service/Neighborhoods/Barrios.kml.txt?sp=r&st=2024-02-08T19:31:44Z&se=2025-09-02T02:31:44Z&sv=2022-11-02&sr=b&sig=2KXlRHzu%2Fv7K%2BUxW2ljlI1YerZcRcCbTLYCXcjEs1TQ%3D";

     // const valenciaAPIURL =
     //      "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/barris-barrios/records?limit=88";

     // let barriosVisible = false;
     // const poligonosBarrios = [];

     // function crearYMostrarBarrios() {
     //      // Crear polígonos para Madrid
     //      fetch( kmlURL )
     //           .then( response => response.text() )
     //           .then( kmlText => {
     //                const parser = new DOMParser();
     //                const kmlDocument = parser.parseFromString( kmlText, "application/xml" );
     //                const placemarks = kmlDocument.getElementsByTagName( "Placemark" );

     //                for ( let i = 0; i < placemarks.length; i++ ) {
     //                     const coordinatesText = placemarks[ i ].getElementsByTagName( "coordinates" )[ 0 ].textContent;
     //                     const coordinatesArray = coordinatesText.trim().split( " " );
     //                     const coordinates = coordinatesArray.map( coordinate => {
     //                          const [ lng, lat ] = coordinate.split( "," ).map( parseFloat );
     //                          return { lat, lng };
     //                     } );

     //                     const polygon = new google.maps.Polygon( {
     //                          paths: coordinates,
     //                          strokeColor: "#FF1053",
     //                          strokeOpacity: 0.8,
     //                          strokeWeight: 2,
     //                          fillColor: "#FF1053",
     //                          fillOpacity: 0.35,
     //                          map: map,
     //                     } );

     //                     poligonosBarrios.push( polygon );
     //                }
     //           } )
     //           .catch( error => console.error( "Hubo un problema con la solicitud para Madrid:", error ) );

     //      // Crear polígonos para Valencia
     //      fetch( valenciaAPIURL )
     //           .then( response => response.json() )
     //           .then( data => {
     //                data.results.forEach( result => {
     //                     const coordinates = result.geo_shape.geometry.coordinates[ 0 ];
     //                     const latLngs = coordinates.map( coordinate => ( {
     //                          lat: coordinate[ 1 ],
     //                          lng: coordinate[ 0 ],
     //                     } ) );

     //                     const polygon = new google.maps.Polygon( {
     //                          paths: latLngs,
     //                          strokeColor: "#08ecc4",
     //                          strokeOpacity: 0.8,
     //                          strokeWeight: 4,
     //                          fillColor: "#08ecc4",
     //                          fillOpacity: 0.35,
     //                          map: map,
     //                     } );

     //                     poligonosBarrios.push( polygon );
     //                } );
     //           } )
     //           .catch( error => console.error( "Hubo un problema con la solicitud para Valencia:", error ) );

     //      barriosVisible = true;
     // }

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


//! ---------------------------------------------------------------------------------
     //* CANALES (WATER)
     const canalMadrid = "https://anpaccountdatalakegen2.blob.core.windows.net/raw/Infrastructure/Water/QUBO%20-%20Water.kml?sp=r&st=2024-03-19T14:19:01Z&se=2090-12-06T22:19:01Z&sv=2022-11-02&sr=b&sig=5mdDfeeQvvQlvGqq4fj71h%2BpZFYh8DryLUkkxjaIZbE%3D";

     const botonWater = document.getElementById( 'water-sub-nav-item' );
     let kmlLayer = null;
     botonWater.addEventListener( 'click', () => {
          if ( kmlLayer ) {
               kmlLayer.setMap( kmlLayer.getMap() ? null : map );
          } else {
               kmlLayer = new google.maps.KmlLayer( {
                    url: canalMadrid,
                    map: map
               } );
          }
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
     const sewageMadrid = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Infrastructure/Sewage/Sewage.kmz?sp=r&st=2024-06-09T18:27:56Z&se=2029-12-30T03:27:56Z&sv=2022-11-02&sr=b&sig=1gOMOStDlrl%2FWnbB1jf%2FOyJEjkGA%2FqJkAE4NCsyiAsc%3D";

     const botonSewage = document.getElementById( 'sewage-sub-nav-item' );
     let kmlSewage = null;
     botonSewage.addEventListener( 'click', () => {
          if ( kmlSewage ) {
               kmlSewage.setMap( kmlSewage.getMap() ? null : map );
          } else {
               kmlSewage = new google.maps.KmlLayer( {
                    url: sewageMadrid,
                    map: map
               } );
          }
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

     // Variables para mantener las capas KML
     let kmlLayerCarrilesBici = null;
     let kmlLayerBasesBiciMad = null;
     let kmlLayerBicipark = null;

     function toggleKmlLayerBici() {
          // Manejar la capa KML de los carriles de bicicleta
          if ( !kmlLayerCarrilesBici ) {
               kmlLayerCarrilesBici = new google.maps.KmlLayer( {
                    url: carrilesBiciKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
          } else {
               kmlLayerCarrilesBici.setMap( kmlLayerCarrilesBici.getMap() ? null : map );
          }

          // Manejar la capa KML de las bases de BiciMad
          if ( !kmlLayerBasesBiciMad ) {
               kmlLayerBasesBiciMad = new google.maps.KmlLayer( {
                    url: basesBiciMadKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
          } else {
               kmlLayerBasesBiciMad.setMap( kmlLayerBasesBiciMad.getMap() ? null : map );
          }

          // Manejar la capa KML de Bicipark
          if ( !kmlLayerBicipark ) {
               kmlLayerBicipark = new google.maps.KmlLayer( {
                    url: biciparkKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
          } else {
               kmlLayerBicipark.setMap( kmlLayerBicipark.getMap() ? null : map );
          }

          // Llamar a la función para inicializar las bicicletas en el mapa
          iniciarBicicletasEnMapa();
     };
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
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosBicicleta = marcadoresBicicletas[ bicicletaId ].datosBicicleta;
               infoBox.innerHTML = `
            <img src="${ datosBicicleta.ImagenURL }" alt="Imagen de la Bicicleta"/>
            <div>Usuario: ${ datosBicicleta.Usuario }</div>
            <div>Matrícula: ${ datosBicicleta.Matricula }</div>
            <div>Batería: ${ datosBicicleta.Bateria }</div>
            <button id="cerrar-info-box">
                <img src="./assets/botonCerrar.svg" alt="Cerrar">
            </button>
        `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }

     // Función para inicializar todas las bicicletas en el mapa
     function iniciarBicicletasEnMapa() {
          iniciarBicicletaEnMapa( 1, './assets/quboBicycle.svg', 'Bicicleta 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_1.json?sp=r&st=2024-05-15T13:43:41Z&se=2090-01-01T22:43:41Z&sv=2022-11-02&sr=b&sig=uCYJlfIenWkJoed2ZAlLka35WfKvGIHAzGuNzpD5ewU%3D' );
          iniciarBicicletaEnMapa( 2, './assets/quboBicycle.svg', 'Bicicleta 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_2.json?sp=r&st=2024-05-15T13:44:04Z&se=2090-01-01T22:44:04Z&sv=2022-11-02&sr=b&sig=Cnl0VUf2BcrnJeNfs2NZln3QEP5yF0GAoyCJB1ebYvg%3D' );
          iniciarBicicletaEnMapa( 3, './assets/quboBicycle.svg', 'Bicicleta 3', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_3.json?sp=r&st=2024-05-15T13:44:21Z&se=2090-01-01T22:44:21Z&sv=2022-11-02&sr=b&sig=XjkEhV2m%2FKXLYQvLXAWqgTThHSnGBsbDyA2ZL1nRxPY%3D' );
          iniciarBicicletaEnMapa( 4, './assets/quboBicycle.svg', 'Bicicleta 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_4.json?sp=r&st=2024-05-15T13:44:38Z&se=2090-01-01T22:44:38Z&sv=2022-11-02&sr=b&sig=I7LlqWTVnSWymaWfM0q8B1J0%2FyJIOlmCIebeUTV3Qn8%3D' );
          iniciarBicicletaEnMapa( 5, './assets/quboBicycle.svg', 'Bicicleta 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_5.json?sp=r&st=2024-05-15T13:44:57Z&se=2090-01-01T22:44:57Z&sv=2022-11-02&sr=b&sig=z6BCIN7VRcaT42aoREQ5DEglxEJwXLRbdWVsgk%2BhD1k%3D' );
          iniciarBicicletaEnMapa( 6, './assets/quboBicycle.svg', 'Bicicleta 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_6.json?sp=r&st=2024-05-15T13:45:18Z&se=2090-01-01T22:45:18Z&sv=2022-11-02&sr=b&sig=zipqET%2Fe1OkscoVr%2F3O%2F8CoCLTY1OYWn1zt8H8CtSSM%3D' );
          iniciarBicicletaEnMapa( 7, './assets/quboBicycle.svg', 'Bicicleta 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_7.json?sp=r&st=2024-05-15T13:45:35Z&se=2090-01-01T22:45:35Z&sv=2022-11-02&sr=b&sig=PkRdidbJ1Lg2PTrdh4r%2Fy5gZxzfwfwybT06zpMNrbAw%3D' );
          iniciarBicicletaEnMapa( 8, './assets/quboBicycle.svg', 'Bicicleta 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_8.json?sp=r&st=2024-05-15T13:45:52Z&se=2090-01-01T22:45:52Z&sv=2022-11-02&sr=b&sig=v922HIbEQmeDtXFJDLH3%2BzE7obxQA%2FVzAT%2Bx435P7Bw%3D' );
          iniciarBicicletaEnMapa( 9, './assets/quboBicycle.svg', 'Bicicleta 9', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_9.json?sp=r&st=2024-05-15T13:46:10Z&se=2090-01-01T22:46:10Z&sv=2022-11-02&sr=b&sig=gNvOkIpgmsRMzNr3%2BqM6v4OsUK0ZQLHBhX6RtdLDkgM%3D' );
          iniciarBicicletaEnMapa( 10, './assets/quboBicycle.svg', 'Bicicleta 10', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_10.json?sp=r&st=2024-05-15T13:46:25Z&se=2090-01-01T22:46:25Z&sv=2022-11-02&sr=b&sig=G2amlyAxBPM6qWof6vw1hgvq0otGVKMYuHgQL4Bxtz8%3D' );
          iniciarBicicletaEnMapa( 11, './assets/quboBicycle.svg', 'Bicicleta 11', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_11.json?sp=r&st=2024-05-15T13:46:42Z&se=2090-01-01T22:46:42Z&sv=2022-11-02&sr=b&sig=%2B1EX%2FDEOJ31SGOjyZR0fwVL9bKaIRkeT5VF%2FXomiHYY%3D' );
          iniciarBicicletaEnMapa( 12, './assets/quboBicycle.svg', 'Bicicleta 12', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_12.json?sp=r&st=2024-05-15T13:46:59Z&se=2090-01-01T22:46:59Z&sv=2022-11-02&sr=b&sig=6%2FcBBrzh%2BxoQG4TROXcGKIn1VOTOOp2rler4TsKH3lY%3D' );
          iniciarBicicletaEnMapa( 13, './assets/quboBicycle.svg', 'Bicicleta 13', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bicycle%20Sharing/Bicimad_13.json?sp=r&st=2024-05-15T13:47:16Z&se=2090-01-01T22:47:16Z&sv=2022-11-02&sr=b&sig=0%2FG2NN1L9r2SRpurvC8SZ3OTNXbj78xjmKyYGn5Q7mA%3D' );
     }

     // Asociar el evento click del botón al manejo del KML de los carriles de bicicleta, las bases de BiciMad y las bicicletas
     const botonBicycle = document.getElementById( 'bici-sub-nav-item' );
     botonBicycle.addEventListener( 'click', toggleKmlLayerBici );


     //* ---------------------------------------------------------------------------------
     //* BOTÓN INCIDENCES MOBILITY (OPERACIÓN ASFALTO) (INCIDENCIAS VÍA PÚBLICA)

     const operacionAsfaltoKmzUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Incidences/Mobility%20Incidences/Operacion_asfalto_2021_kml.kmz?sp=r&st=2024-03-19T21:27:54Z&se=2090-01-01T05:27:54Z&sv=2022-11-02&sr=b&sig=%2FN8Ez5X9F5hzPDYb2P7iZJX%2FiSXkynMgdm8LitO4qgg%3D";

     let kmlLayerOperacionAsfalto = null;

     function toggleKmlLayerOperacionAsfalto() {
          if ( !kmlLayerOperacionAsfalto ) {
               kmlLayerOperacionAsfalto = new google.maps.KmlLayer( {
                    url: operacionAsfaltoKmzUrl,
                    map: map,
                    preserveViewport: true
               } );
          } else {
               kmlLayerOperacionAsfalto.setMap( kmlLayerOperacionAsfalto.getMap() ? null : map );
          }
     };
     const incidencesMobility = document.getElementById( 'alerts-mobility-nav-item' );
     incidencesMobility.addEventListener( 'click', toggleKmlLayerOperacionAsfalto );

     //* ---------------------------------------------------------------------------------
     //* CÁMARAS DE TRÁFICO MADRID

     const bajasEmisiones = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Car%20Traffic/camaras_zonabajasemisiones_mc.kmz?sp=r&st=2024-03-19T20:34:37Z&se=2090-01-01T04:34:37Z&sv=2022-11-02&sr=b&sig=gn9rV3AAOe4XD4okscc0T82THsCzH4Um71649lsB8Y4%3D";




     let kmlLayerbajasEmisiones = null;

     // Función para manejar la capa KML de cámaras de tráfico
     function toggleKmlLayerbajasEmisiones() {
          if ( kmlLayerbajasEmisiones ) {
               // Si la capa KML ya existe, alternar su visibilidad
               kmlLayerbajasEmisiones.setMap( kmlLayerbajasEmisiones.getMap() ? null : map );
          } else {
               // Si la capa KML no existe, crearla y añadirla al mapa
               kmlLayerbajasEmisiones = new google.maps.KmlLayer( {
                    url: bajasEmisiones,
                    map: map,
                    preserveViewport: true
               } );
          }
          kmlLayerbajasEmisiones.addListener( 'status_changed', function () {
               console.log( 'KML Layer status changed to: ' + kmlLayerbajasEmisiones.getStatus() );
          } );
     }


     const botonbajasEmisiones = document.getElementById( 'traffic-sub-nav-item' );

     // Vincular el controlador de eventos al nuevo botón de cámaras de tráfico
     botonbajasEmisiones.addEventListener( 'click', toggleKmlLayerbajasEmisiones );




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

     const cercaniasMadridKMZ = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Trains/Cercanias_de_Madrid.kmz?sp=r&st=2024-03-19T15:31:15Z&se=2089-12-31T23:31:15Z&sv=2022-11-02&sr=b&sig=W0iAEncbPWs4ZEbtrxBW%2BP6oRF9aeVDY%2Bxu%2BuDMu1fQ%3D";
     let kmzLayerCercaniasMadrid = null;

     function toggleKMZLayerCercaniasMadrid() {
          if ( kmzLayerCercaniasMadrid ) {
               // Si la capa KMZ ya existe, alternar su visibilidad
               kmzLayerCercaniasMadrid.setMap( kmzLayerCercaniasMadrid.getMap() ? null : map );
          } else {
               // Si la capa KMZ no existe, crearla y añadirla al mapa
               kmzLayerCercaniasMadrid = new google.maps.KmlLayer( {
                    url: cercaniasMadridKMZ,
                    map: map // Asegúrate de que 'map' sea una referencia válida a tu instancia de Google Maps
               } );
          }
     };

     // Suponiendo que tienes un botón con ID 'kmz-layer-toggle' para alternar la capa KMZ
     const botonKMZ = document.getElementById( 'trains-sub-nav-item' );
     botonKMZ.addEventListener( 'click', toggleKMZLayerCercaniasMadrid );

     //* BOTÓN ENVIRONMENT AND SUSTAINABILITY ****************

     //! Función para mostrar PARKS&GARDENS

     const cargarMarcadoresParksGardens = () => {
          fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Parks%20%26%20Gardens/Fiware_EnvAndSust_ParksAndGardens-00001?sp=r&st=2024-06-02T17:13:28Z&se=2090-01-01T02:13:28Z&sv=2022-11-02&sr=b&sig=XBdhgow87NphHa30BQWyt%2Bc%2FJsUyjU%2FXEVZuy9L12t8%3D" )
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
                              <img src='./assets/staticParksGardens.jpg'>
                              <p>${ description }</p>
                              
                              <p>Address: ${ streetAddress }, ${ postalCode }</p>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>ID: ${ item.id }</p>
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
     const urlMarkerAirQuality = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Environment/Fiware_EnvAndSust_AirQualityStations-00001?sp=r&st=2024-04-01T12:52:31Z&se=2090-01-01T21:52:31Z&sv=2022-11-02&sr=b&sig=nykV2ypz1eiG3UtGZqKX%2B4M9aFzAayeAmI6Id42pg4w%3D";
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
                     <img src='./assets/staticEnvironment.jpg'>
                     <p>Código identificador: ${ idWithoutPrefix }</p>
                     <p>Address: ${ address }</p>
                     <p>Localización: ${ item.address.value.addressLocality }, ${ item.address.value.addressRegion }</p>
                     <p>Fecha de alta: ${ item.annex.value.estacion_fecha_alta }</p>
                     <p>Tipo de área: ${ item.annex.value.estacion_tipo_area }</p>
                     <p>Tipo de estación: ${ item.annex.value.estacion_tipo_estacion }</p>
                     <p>Calidad de aire: ${ item.annex.value.zona_calidad_aire_descripcion }</p>
                     <p>${ item.description.value }</p>
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

     botonEnvironment.addEventListener( 'click', async () => {
          // Alternar la visibilidad de los marcadores de Air Quality Stations
          toggleMarcadores( markersAirQuality, airQualityMarkersVisible );
          airQualityMarkersVisible = !airQualityMarkersVisible;

          // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
          if ( markersAirQuality.length === 0 && airQualityMarkersVisible ) {
               await cargarYMostrarMarcadoresAirQuality( urlMarkerAirQuality );
          }
     } );



     //! Botón RECYCLING

     const urlReciclyingKML = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Residuos_Peligrosos._Comunidad_de_Madrid..kmz?sp=r&st=2024-04-01T13:39:06Z&se=2090-01-01T22:39:06Z&sv=2022-11-02&sr=b&sig=nzI8YMrIg%2BgJYXrMibgVTbxyFlkeVMefY55z8yyrAFc%3D";

     const urlWasteFixedPoints = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_WasteFixedPoints-00001?sp=r&st=2024-06-02T18:30:56Z&se=2090-01-01T03:30:56Z&sv=2022-11-02&sr=b&sig=a71C%2Bbr30XCf7IXi2IuKVgW6rIiuY4Yy%2BFpCX5s21XA%3D";
     const urlWasteMobilePoints = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_WasteCleanMobilePoints-00001?sp=r&st=2024-06-02T18:30:23Z&se=2090-01-01T03:30:23Z&sv=2022-11-02&sr=b&sig=NJdkk6KkezyNPI2YvEhkzciBclrLL%2BTT%2FXfreIWEL10%3D";
     const urlClothesRecycling = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_ClothesRecycling-00001?sp=r&st=2024-06-02T18:27:06Z&se=2090-01-01T03:27:06Z&sv=2022-11-02&sr=b&sig=7P05HcKHRmT23shU0gVz%2BNcveL8SHWsk%2FZgriUKfe6w%3D";
     // const urlRecyclingContainers = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_RecyclingContainers?sp=r&st=2024-06-02T18:29:14Z&se=2090-01-01T03:29:14Z&sv=2022-11-02&sr=b&sig=KHQi1VWqqEM%2Ffo7RoS8Mltd3zvWvhmdpo8xzepYh55M%3D";

     let kmlLayerRecycling = null;
     let basuraMarker = null;
     let markersWasteFixedPoints = [];
     let markersWasteMobilePoints = [];
     let markersClothesRecycling = [];
     let markersRecyclingContainers = [];

     const botonRecycling = document.getElementById( 'recycling-sub-nav-item' );
     let recyclingVisible = false;

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
          toggleMarkers( markersWasteFixedPoints, recyclingVisible );
          // Alternar la visibilidad de los puntos móviles de reciclaje
          toggleMarkers( markersWasteMobilePoints, recyclingVisible );
          // Alternar la visibilidad de los puntos de reciclaje de ropa
          toggleMarkers( markersClothesRecycling, recyclingVisible );
          // Alternar la visibilidad de los contenedores de reciclaje
          toggleMarkers( markersRecyclingContainers, recyclingVisible );

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
                <p>Última actualización: 28-10-2023  23:51h</p>
                <p>Matrícula: 0000 AAA</p>
                <p>Estado: Activo</p>
                <p>Tipo de servicio: Recogida de residuos sólidos urbanos</p>
                <p>Distintivo: XX0000 </p>
                <p>Capacidad</p>
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
                            <img src='./assets/staticRecycling.jpg'/>
                            <p>Localización: ${ parsedData.addressLocality }, ${ parsedData.addressRegion }</p>
                            <p>Address: ${ parsedData.streetAddress }</p>
                            <p>C.P: ${ parsedData.postalCode }</p>
                            <p>Neighborhood: ${ parsedData.neighborhood }</p>
                            <p>District: ${ parsedData.district }</p>
                            <p>Country: ${ parsedData.addressCountry }</p>
                            <p>${ parsedData.description }</p>
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
                            <img src='./assets/staticRecycling.jpg'/>
                            <p>Localización: ${ parsedData.addressLocality }, ${ parsedData.addressRegion }</p>
                            <p>Address: ${ parsedData.streetAddress }</p>
                            <p>C.P: ${ parsedData.postalCode }</p>
                            <p>Neighborhood: ${ parsedData.neighborhood }</p>
                            <p>District: ${ parsedData.district }</p>
                            <p>Country: ${ parsedData.addressCountry }</p>
                            <p>${ parsedData.description }</p>
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
          const urlClothesRecycling = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Recycling/Fiware_EnvAndSust_ClothesRecycling-00001?sp=r&st=2024-06-02T18:27:06Z&se=2090-01-01T03:27:06Z&sv=2022-11-02&sr=b&sig=7P05HcKHRmT23shU0gVz%2BNcveL8SHWsk%2FZgriUKfe6w%3D";
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
                             <img src='./assets/staticRecycling.jpg'/>
                             <p>Localización: ${ parsedData.addressLocality }, ${ parsedData.addressRegion }</p>
                             <p>Address: ${ parsedData.streetAddress }</p>
                             <p>C.P: ${ parsedData.postalCode }</p>
                             <p>Neighborhood: ${ parsedData.neighborhood }</p>
                             <p>District: ${ parsedData.district }</p>
                             <p>Country: ${ parsedData.addressCountry }</p>
                             <p>${ parsedData.description }</p>
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
     //                              <img src='./assets/staticRecycling.jpg'/>
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

     function toggleMarkers( markers, visible ) {
          markers.forEach( marker => marker.setMap( visible ? null : map ) );
     }
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

     // botonRecycling.addEventListener( 'click', () => {
     //      // Alternar la visibilidad de la capa KML de Recycling
     //      kmlLayersRecycling.forEach( layer => {
     //           layer.setMap( kmlLayersRecyclingVisible ? null : map );
     //      } );
     //      kmlLayersRecyclingVisible = !kmlLayersRecyclingVisible;

     //      // Asegurarte de que el mapa esté listo antes de intentar añadir la capa KML
     //      if ( !kmlLayersRecycling.length && kmlLayersRecyclingVisible ) {
     //           ulrReciclying.forEach( ( url, index ) => {
     //                const kmlLayer = new google.maps.KmlLayer( {
     //                     url: url,
     //                     map: map // Asegúrate de que 'map' sea una referencia válida a tu instancia de Google Maps
     //                } );
     //                kmlLayersRecycling[ index ] = kmlLayer;
     //           } );
     //      }

     //      // Alternar la visibilidad del camión de basura
     //      if ( basuraMarker ) {
     //           clearInterval( intervaloBasuraMarker );
     //           basuraMarker.setMap( null );
     //           basuraMarker = null;
     //      } else {
     //           // Crear el marcador para el camión de basura
     //           basuraMarker = new google.maps.Marker( {
     //                map: map,
     //                title: "Camión de Residuos",
     //                icon: "./assets/WasteQubo.svg",
     //                position: basuraCoordinates[ 0 ]  // Iniciar el marcador en la primera posición
     //           } );

     //           // Iniciar el movimiento del marcador cada 2000 milisegundos (2 segundos)
     //           intervaloBasuraMarker = iniciarMovimientoMarcador( basuraMarker, basuraCoordinates, 2000 );

     //           // Evento para mostrar información en el infoBox al hacer clic
     //           basuraMarker.addListener( "click", function () {
     //                const infoBox = document.querySelector( ".info-box" );
     //                infoBox.style.display = "flex";
     //                infoBox.innerHTML = `
     //             <h2>Camión de residuos</h2>
     //             <p>Última actualización: 28-10-2023  23:51h</p>
     //             <p>Matrícula: 0000 AAA</p>
     //             <p>Estado: Activo</p>
     //             <p>Tipo de servicio: Recogida de residuos sólidos urbanos</p>
     //             <p>Distintivo: XX0000 </p>
     //             <p>Capacidad</p>
     //             <div class="progress-bar">
     //               <div class="progress" style="width: 20%;"></div> 
     //               <div class="progress-text">20%</div> 
     //             </div>
     //             <button id="cerrar-info-box">
     //               <img src="./assets/botonCerrar.svg" alt="">
     //             </button>
     //         `;
     //                document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
     //                     infoBox.style.display = "none";
     //                } );
     //           } );
     //      }
     // } );

     //! Botón para STTREETLIGHTS
     // function cargarMarcadoresStreetlights() {
     //      const urlStreetlights = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Streetlights/Fiware_EnvAndSust_Streetlights?sp=r&st=2024-06-02T18:39:47Z&se=2090-01-01T03:39:47Z&sv=2022-11-02&sr=b&sig=TfxEOSZ19Sp0%2BQFAg3AmmlIXUmkI1DX3JZfEjGH56gA%3D";

     //      fetch( urlStreetlights )
     //           .then( response => response.json() )
     //           .then( data => {
     //                data.streetlight0001.forEach( item => {
     //                     const parsedData = parseFiwareData( item );
     //                     if ( parsedData.ubicacion ) {
     //                          const marker = new google.maps.Marker( {
     //                               position: { lat: parsedData.ubicacion[ 1 ], lng: parsedData.ubicacion[ 0 ] },
     //                               map: map,
     //                               title: parsedData.name,
     //                               icon: "./assets/streetlightsQubo.svg"
     //                          } );

     //                          marker.addListener( "click", () => {
     //                               const infoBox = document.querySelector( ".info-box" );
     //                               infoBox.style.display = "flex";
     //                               infoBox.innerHTML = `
     //                               <div class='nameContainer'>
     //                                    <p>${ parsedData.category }</p>
     //                                    <p>${ parsedData.name }</p>
     //                               </div>
     //                               <img src='./assets/staticStreetlights.jpg'/>
     //                               <p>Localización: ${ parsedData.addressLocality }, ${ parsedData.addressRegion }</p>
     //                               <p>Address: ${ parsedData.streetAddress }</p>
     //                               <p>C.P: ${ parsedData.postalCode }</p>
     //                               <p>Neighborhood: ${ parsedData.neighborhood }</p>
     //                               <p>District: ${ parsedData.district }</p>
     //                               <p>Country: ${ parsedData.addressCountry }</p>
     //                               <p>${ parsedData.description }</p>
     //                               <p>Link: <a href="${ parsedData.source }" target="_blank">${ parsedData.source }</a></p>
     //                               <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
     //                               <button class='share'><img src='./assets/shareIcon.svg'></button>
     //                               `;
     //                               document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
     //                                    infoBox.style.display = "none";
     //                               } );
     //                          } );

     //                          markersStreetlights.push( marker ); // Añade el marcador al array de farolas
     //                     }
     //                } );
     //           } )
     //           .catch( error => console.error( "Hubo un problema con la solicitud:", error ) );
     // }

     // const eventStreetlights = document.getElementById( "streetlights-sub-nav-item" );
     // let markersStreetlights = []; // Array para almacenar los marcadores de farolas
     // let streetlightsVisible = false; // Bandera para el estado de visibilidad

     // eventStreetlights.addEventListener( "click", () => {
     //      // Alternar la visibilidad de los marcadores de farolas
     //      toggleMarcadores( markersStreetlights, streetlightsVisible );
     //      streetlightsVisible = !streetlightsVisible; // Cambia la bandera de visibilidad

     //      // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
     //      if ( markersStreetlights.length === 0 && streetlightsVisible ) {
     //           cargarMarcadoresStreetlights();
     //      }
     // } );




     //! Botón ENERGY&EFFICIENCY
     // Función para cargar y mostrar marcadores de eficiencia energética
     const cargarYMostrarMarcadoresEnergiaEficiencia = async () => {
          try {
               const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Environment%20%26%20Sustainability/Energy%20Efficiency/Fiware_EnvAndSust_BuildingsEnergyEfficiency.json?sp=r&st=2024-01-04T16:17:19Z&se=2090-01-01T00:17:19Z&sv=2022-11-02&sr=b&sig=w%2B2x10PtsIkypmzPvwFSe0ZSOmVgBFy%2FsYlbf1ICgV4%3D" );
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
                     <img src='./assets/StaticEnergyEfficiency.jpg'/>
                     <p>Código identificador: ${ idWithoutPrefix }</p>
                     <p>Address: ${ item.address.value.streetAddress }</p>
                     <p>Barrio: ${ item.address.value.neighborhood }</p>
                     <p>Localización: ${ item.address.value.district }, ${ item.address.value.addressRegion }</p>
                     <p>Año Contrucción: ${ item.month.value }/${ item.year.value }</p>
                     <p>${ item.energyConsumedAndCost.value.energyType.value }: ${ item.energyConsumedAndCost.value.energyConsumed.value.value.value } ${ item.energyConsumedAndCost.value.energyConsumed.value.measurementUnit.value }</p>
                     <p>${ item.description.value }</p>
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
          return fetch( "https://opendata-ajuntament.barcelona.cat/data/api/action/datastore_search?resource_id=cd1957a6-a06e-4a90-80bb-83e0e4c2d6e9&limit=5" )
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
          return fetch( "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/cameres-trafic-camaras-trafico/records?limit=20" )
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
                  <div>${ datosBarco.nombre }</div>
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
     eventBoats.addEventListener( 'click', function () {
          iniciarBarcoEnMapa( 1, './assets/boats_Qubo.svg', 'Barco 1', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Mobility_Boats.json?sp=r&st=2024-04-01T11:12:53Z&se=2090-01-01T20:12:53Z&sv=2022-11-02&sr=b&sig=sfxwYCe7JJ0ZeuDv6bloxXNQdCpVAs28Qw22HdpJGxk%3D' );

          iniciarBarcoEnMapa( 2, './assets/boats_Qubo.svg', 'Barco 2', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_2.json?sp=r&st=2024-04-01T20:16:42Z&se=2090-01-01T05:16:42Z&sv=2022-11-02&sr=b&sig=qcjPW89tElqDN59MnZ1ywua3aopyrBhVHzt7OlTeEbk%3D' );


          iniciarBarcoEnMapa( 4, './assets/boats_Qubo.svg', 'Barco 4', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_4.json?sp=r&st=2024-04-01T20:17:48Z&se=2090-01-01T05:17:48Z&sv=2022-11-02&sr=b&sig=EcsDdDpqTcPAq32J0VTlr9zGc20NspvzOqh0iBCzdAE%3D' );


          iniciarBarcoEnMapa( 5, './assets/boats_Qubo.svg', 'Barco 5', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_5.json?sp=r&st=2024-04-01T20:18:09Z&se=2090-01-01T05:18:09Z&sv=2022-11-02&sr=b&sig=agT3rXaXP1ZXMO0Sf8OKeuzxTbLx%2FVcrt5fSOvcWMUE%3D' );


          iniciarBarcoEnMapa( 6, './assets/boats_Qubo.svg', 'Barco 6', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_6.json?sp=r&st=2024-04-01T20:18:35Z&se=2090-01-01T05:18:35Z&sv=2022-11-02&sr=b&sig=bO%2FRFK8iOg0y2lRLe8uBf9ojTTCcODoZ7VSs0RfEHyY%3D' );


          iniciarBarcoEnMapa( 7, './assets/boats_Qubo.svg', 'Barco 7', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_7.json?sp=r&st=2024-04-01T20:18:56Z&se=2090-01-01T05:18:56Z&sv=2022-11-02&sr=b&sig=xR2BcP2a3W8SDjKjn84aOjwWwv4lEyeaLdIotZ4RZig%3D' );


          iniciarBarcoEnMapa( 8, './assets/boats_Qubo.svg', 'Barco 8', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_8.json?sp=r&st=2024-04-01T20:19:18Z&se=2090-01-01T05:19:18Z&sv=2022-11-02&sr=b&sig=kUij3HyVFdPMeoH5TkNXlQoeqnNVII%2BsUMmJUUtjMkA%3D' );


          iniciarBarcoEnMapa( 10, './assets/boats_Qubo.svg', 'Barco 10', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_10.json?sp=r&st=2024-04-01T20:19:55Z&se=2090-01-01T05:19:55Z&sv=2022-11-02&sr=b&sig=QTCF9TFz9LyP574FpI2ZqxtfizuSl%2FixsaEpNcpwbXY%3D' );


          iniciarBarcoEnMapa( 12, './assets/boats_Qubo.svg', 'Barco 12', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_12.json?sp=r&st=2024-04-01T20:22:27Z&se=2090-01-01T05:22:27Z&sv=2022-11-02&sr=b&sig=bK3BbuLhYxSVKNIjW4GvAP%2BiiWTjNK90%2Blte%2F%2Fa0iyQ%3D' );


          iniciarBarcoEnMapa( 13, './assets/boats_Qubo.svg', 'Barco 13', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_13.json?sp=r&st=2024-04-01T20:22:50Z&se=2090-01-01T05:22:50Z&sv=2022-11-02&sr=b&sig=gaVzoTsoeHYl9SL1Dzxu1er7zsdabVTUf%2FoP%2B2UvDfE%3D' );


          iniciarBarcoEnMapa( 14, './assets/boats_Qubo.svg', 'Barco 14', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_14.json?sp=r&st=2024-04-01T20:23:09Z&se=2090-01-01T05:23:09Z&sv=2022-11-02&sr=b&sig=8QD6qBWVvZb1WBvftoVDhFKhUek%2FdU2h1ObYAya8rkw%3D' );


          iniciarBarcoEnMapa( 15, './assets/boats_Qubo.svg', 'Barco 15', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_15.json?sp=r&st=2024-04-01T20:23:28Z&se=2090-01-01T05:23:28Z&sv=2022-11-02&sr=b&sig=E4hgKifHPCKlUxIOQkecZG5Z%2FbQb7rWYoAM6EO0%2F9ZQ%3D' );


          iniciarBarcoEnMapa( 16, './assets/boats_Qubo.svg', 'Barco 16', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_16.json?sp=r&st=2024-04-01T20:23:45Z&se=2090-01-01T05:23:45Z&sv=2022-11-02&sr=b&sig=XRHHu9bc59wLdLXODmgxYKWHc%2FMHxBNegepX7DQMK5M%3D' );


          iniciarBarcoEnMapa( 17, './assets/boats_Qubo.svg', 'Barco 17', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_17.json?sp=r&st=2024-04-01T20:24:03Z&se=2024-04-02T04:24:03Z&sv=2022-11-02&sr=b&sig=PXYhpSa%2BmKl6zH4oG7cdu3MmmHO4RQYA54Wy%2F%2F2r%2BJU%3D' );


          iniciarBarcoEnMapa( 18, './assets/boats_Qubo.svg', 'Barco 18', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_18.json?sp=r&st=2024-04-01T20:24:18Z&se=2090-01-01T05:24:18Z&sv=2022-11-02&sr=b&sig=KcB1r84uAdX9kHjmoR6QcvrzPZGfy9KLcpW20Rcf62I%3D' );


          iniciarBarcoEnMapa( 19, './assets/boats_Qubo.svg', 'Barco 19', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_19.json?sp=r&st=2024-04-01T20:24:41Z&se=2090-01-01T05:24:41Z&sv=2022-11-02&sr=b&sig=amlh5UkJrvl41biDJveOesGDXNxcr2nFvjtQ3%2BE22Ew%3D' );


          iniciarBarcoEnMapa( 20, './assets/boats_Qubo.svg', 'Barco 20', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barco_20.json?sp=r&st=2024-04-01T20:25:06Z&se=2090-01-01T05:25:06Z&sv=2022-11-02&sr=b&sig=KSXgObS5DJuLM0%2Fs9o9VfpU7fMRmlu3pzneg6FsnZ0w%3D' );


          iniciarBarcoEnMapa( 21, './assets/boats_Qubo.svg', 'Barco 21', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Barcaza_Manzanares.json?sp=r&st=2024-04-01T20:34:02Z&se=2090-01-01T05:34:02Z&sv=2022-11-02&sr=b&sig=mQrWa7j7rsyNISoeMjLQ51ux9DYURP%2BP%2B4GVGMhFYRc%3D' );


          iniciarBarcoEnMapa( 22, './assets/boats_Qubo.svg', 'Barco 22', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Bote_de_Remos_Manzanares.json?sp=r&st=2024-04-01T20:34:19Z&se=2090-01-01T05:34:19Z&sv=2022-11-02&sr=b&sig=h5zhYZzpd4yyAL%2FlgMxkPW4NPDr7GqAeJGeS%2FCgdUG8%3D' );


          iniciarBarcoEnMapa( 23, './assets/boats_Qubo.svg', 'Barco 23', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Canoa_Manzanares.json?sp=r&st=2024-04-01T20:34:36Z&se=2090-01-01T05:34:36Z&sv=2022-11-02&sr=b&sig=fV7CQweEt%2FC%2FGXcVqq2daBHe4CEqW3OyNmMxmhYtr5k%3D' );


          iniciarBarcoEnMapa( 24, './assets/boats_Qubo.svg', 'Barco 24', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Go%CC%81ndola_Manzanares.json?sp=r&st=2024-04-01T20:34:55Z&se=2090-01-01T05:34:55Z&sv=2022-11-02&sr=b&sig=XfRnKoTEnJrhiJ7IytSs5Fd5X%2ByY9T%2B68%2B8%2FD67UAXk%3D' );


          iniciarBarcoEnMapa( 25, './assets/boats_Qubo.svg', 'Barco 25', 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Boats/Kayak_Manzanares.json?sp=r&st=2024-04-01T20:35:11Z&se=2090-01-01T05:35:11Z&sv=2022-11-02&sr=b&sig=XiOKYdZXVtxDGp2YR8k00SmcAH29M307J47jRf39uTI%3D' );


     } );




     //!Función para Marcadores TAXIS
     const marcadoresTaxis = {};
     function iniciarTaxiEnMapa( taxiId, iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresTaxis[ taxiId ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresTaxis[ taxiId ].intervaloId );
               marcadoresTaxis[ taxiId ].marker.setMap( null );
               delete marcadoresTaxis[ taxiId ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el taxi
          const taxiMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del taxi de la API y mover el marcador
          function obtenerYmoverTaxi() {
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.Coordenadas && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas.map( coord => ( {
                                   lat: parseFloat( coord.lat ),
                                   lng: parseFloat( coord.lng )
                              } ) );

                              // Mover el marcador del taxi con las coordenadas obtenidas
                              const intervaloId = iniciarMovimientoMarcador( taxiMarker, coordenadas, 2000 );
                              marcadoresTaxis[ taxiId ] = {
                                   marker: taxiMarker,
                                   intervaloId: intervaloId,
                                   datosTaxi: data // Almacenar los datos del taxi aquí
                              };
                         } else {
                              console.error( 'Los datos del taxi no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del taxi:', error ) );
          }

          // Iniciar el proceso de mover el taxi
          obtenerYmoverTaxi();

          // Añadir un evento click al marcador del taxi para mostrar información
          taxiMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosTaxi = marcadoresTaxis[ taxiId ].datosTaxi;
               infoBox.innerHTML = `
                    <img src="${ datosTaxi.ImagenURL }"/>
                    <div>Matrícula: ${ datosTaxi.Matricula }</div>
                    <div>Licencia: ${ datosTaxi.Licencia }</div>
                    <div>Estado: ${ datosTaxi.Estado }</div>
                    <div>Número máximo de ocupantes: ${ datosTaxi[ "Numero max de ocupantes" ] }</div>
                    <button id="cerrar-info-box">
                         <img src="./assets/botonCerrar.svg" alt="Cerrar">
                    </button>
               `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
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




     //************************************************************ */
     //!Función para Marcadores VTC's
     const marcadoresVTC = {};
     function iniciarMarcadorVTC( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresVTC[ title ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresVTC[ title ].intervaloId );
               marcadoresVTC[ title ].marker.setMap( null );
               delete marcadoresVTC[ title ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el VTC
          const vtcMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del VTC de la API y mover el marcador
          function obtenerYmoverVTC() {
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.features && data.features[ 0 ].geometry.coordinates ) {
                              const coordenadas = data.features[ 0 ].geometry.coordinates;

                              // Mover el marcador del VTC con las coordenadas obtenidas
                              iniciarMovimientoMarcador( vtcMarker, coordenadas, 2000 );

                              // Almacenar los datos del VTC en el objeto marcadoresVTC
                              marcadoresVTC[ title ].datosVTC = data.features[ 0 ].properties;
                         } else {
                              console.error( 'Los datos del VTC no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del VTC:', error ) );
          }

          // Iniciar el proceso de mover el VTC
          obtenerYmoverVTC();

          // Almacenar el marcador y su intervalo en el objeto marcadoresVTC
          marcadoresVTC[ title ] = {
               marker: vtcMarker,
               intervaloId: null, // Aquí deberías almacenar el ID del intervalo si estás usando setInterval para mover el marcador
               datosVTC: null // Almacenar los datos del VTC aquí
          };

          // Añadir un evento click al marcador del VTC para mostrar información
          vtcMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosVTC = marcadoresVTC[ title ].datosVTC;
               infoBox.innerHTML = `
                  <p>Nombre: ${ datosVTC.nombre }</p>
                  <p>Estado: ${ datosVTC.Estado }</p>
                  <p>Matricula: ${ datosVTC.Matricula }</p>
                  <p>Conductor: ${ datosVTC.Conductor }</p>
                  <button id="cerrar-info-box">
                      <img src="./assets/botonCerrar.svg" alt="Cerrar">
                  </button>
              `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }
     // Modificar el evento del botón para manejar todos los marcadores
     const eventVTC = document.getElementById( "vtc-sub-nav-item" );
     eventVTC.addEventListener( 'click', function () {
          // Ejemplo de cómo llamar a la función genérica para cada VTC
          const vtc1IconUrl = "./assets/vtc_Qubo.svg";
          const vtc1Title = "VTC MockApi 1";
          const vtc1ApiUrl = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%201.geojson?sp=r&st=2024-04-01T16:22:01Z&se=2090-01-01T01:22:01Z&sv=2022-11-02&sr=b&sig=8i9smCqqzKHcPPwhxMn%2FpLB0xts8%2B1qJi6yBASFzwlY%3D';
          iniciarMarcadorVTC( vtc1IconUrl, vtc1Title, vtc1ApiUrl );

          const vtc2IconUrl = "./assets/vtc_Qubo.svg";
          const vtc2Title = "VTC MockApi 2";
          const vtc2ApiUrl = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%202.geojson?sp=r&st=2024-04-01T16:34:25Z&se=2090-01-01T01:34:25Z&sv=2022-11-02&sr=b&sig=5u9j0ygTWCeU6SCuyHRvbBCcH8bE2%2ByrTTCoPPCgBQ8%3D';
          iniciarMarcadorVTC( vtc2IconUrl, vtc2Title, vtc2ApiUrl );

          const vtc3IconUrl = "./assets/vtc_Qubo.svg";
          const vtc3Title = "VTC 3";
          const vtc3ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%203.geojson?sp=r&st=2024-04-01T16:36:07Z&se=2090-01-01T01:36:07Z&sv=2022-11-02&sr=b&sig=eN6tTU8vWB%2F%2BC7E2DqfiG87cqwGXPLgBJ5zWg9X6plE%3D";
          iniciarMarcadorVTC( vtc3IconUrl, vtc3Title, vtc3ApiUrl );


          const vtc4IconUrl = "./assets/vtc_Qubo.svg";
          const vtc4Title = "VTC 4";
          const vtc4ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%204.geojson?sp=r&st=2024-04-01T16:37:12Z&se=2090-01-01T01:37:12Z&sv=2022-11-02&sr=b&sig=uCmFmLdScuPNmZBgLBQZ3uD4EaUb%2B4hIKdH4xVi5RAY%3D";
          iniciarMarcadorVTC( vtc4IconUrl, vtc4Title, vtc4ApiUrl );


          const vtc5IconUrl = "./assets/vtc_Qubo.svg";
          const vtc5Title = "VTC 5";
          const vtc5ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%205.geojson?sp=r&st=2024-04-01T16:38:08Z&se=2090-01-01T01:38:08Z&sv=2022-11-02&sr=b&sig=x8pfs1PLuDZjgtINnVOqbTO9vzRE33EHxD67%2BYbSNkg%3D";
          iniciarMarcadorVTC( vtc5IconUrl, vtc5Title, vtc5ApiUrl );


          const vtc6IconUrl = "./assets/vtc_Qubo.svg";
          const vtc6Title = "VTC 6";
          const vtc6ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%206.geojson?sp=r&st=2024-04-01T16:39:00Z&se=2090-01-01T01:39:00Z&sv=2022-11-02&sr=b&sig=eaPCFUz7tvckkG2ioIi1KPD4UhXsmwE53kYi4pOCAf4%3D";
          iniciarMarcadorVTC( vtc6IconUrl, vtc6Title, vtc6ApiUrl );


          const vtc7IconUrl = "./assets/vtc_Qubo.svg";
          const vtc7Title = "VTC 7";
          const vtc7ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/VTC/VTC%207.geojson?sp=r&st=2024-04-01T16:40:45Z&se=2090-01-01T01:40:45Z&sv=2022-11-02&sr=b&sig=E75BsxaSAzX7Qht92U5zjNiSLEogxSqwMFDTXl07ErU%3D";
          iniciarMarcadorVTC( vtc7IconUrl, vtc7Title, vtc7ApiUrl );
     } );


     //! Función para Marcadores de MOTO SHARING
     // Declarar el objeto marcadoresMoto en el ámbito global
     const marcadoresMoto = {};
     function iniciarMarcadorMoto( iconUrl, title, apiUrl ) {
          // Verificar si el marcador ya existe
          if ( marcadoresMoto[ title ] ) {
               // Si el marcador ya existe, detener el movimiento y eliminar el marcador
               clearInterval( marcadoresMoto[ title ].intervaloId );
               marcadoresMoto[ title ].marker.setMap( null );
               delete marcadoresMoto[ title ]; // Eliminar el marcador del objeto
               return; // Salir de la función
          }

          // Crear el marcador para el moto-sharing
          const motoMarker = new google.maps.Marker( {
               map: map,
               title: title,
               icon: iconUrl,
          } );

          // Función para obtener las coordenadas del moto-sharing de la API y mover el marcador
          function obtenerYmoverMoto() {
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas;

                              // Mover el marcador del moto-sharing con las coordenadas obtenidas
                              marcadoresMoto[ title ].intervaloId = iniciarMovimientoMarcador( motoMarker, coordenadas, 2000 );

                              // Almacenar los datos de la moto en el objeto marcadoresMoto
                              marcadoresMoto[ title ].datosMoto = data;
                         } else {
                              console.error( 'Los datos de la moto no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del moto-sharing:', error ) );
          }

          // Iniciar el proceso de mover el moto-sharing
          obtenerYmoverMoto();

          // Almacenar el marcador y su intervalo en el objeto marcadoresMoto
          marcadoresMoto[ title ] = {
               marker: motoMarker,
               intervaloId: null, // Aquí deberías almacenar el ID del intervalo si estás usando setInterval para mover el marcador
               datosMoto: null // Almacenar los datos de la moto aquí
          };

          // Añadir un evento click al marcador del moto-sharing para mostrar información
          motoMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosMoto = marcadoresMoto[ title ].datosMoto;

               infoBox.innerHTML = `
             <div>${ title }</div>
             <img src="${ datosMoto.ImagenURL }" at="moto-image">
             <p>Estado: ${ datosMoto.Estado }</p>
             <p>Matricula: ${ datosMoto.Matricula }</p>
             <p>Batería: ${ datosMoto.Bateria }</p>
             <button id="cerrar-info-box">
                 <img src="./assets/botonCerrar.svg" alt="Cerrar">
             </button>
         `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }
     // Modificar el evento del botón para manejar todos los marcadores de moto-sharing
     const eventMoto = document.getElementById( "moto-sub-nav-item" );
     eventMoto.addEventListener( 'click', function () {
          // Ejemplo de cómo llamar a la función genérica para cada moto-sharing
          const moto1IconUrl = "./assets/moto_Qubo.svg";
          const moto1Title = "Moto 1";
          const moto1ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_1.json?sp=r&st=2024-04-12T10:12:42Z&se=2090-01-01T19:12:42Z&sv=2022-11-02&sr=b&sig=DLKdONio%2FiFtsOuh%2FNbNzmfj0CV8y8fiGTAJTIXrOAo%3D";
          iniciarMarcadorMoto( moto1IconUrl, moto1Title, moto1ApiUrl );

          const moto2IconUrl = "./assets/moto_Qubo.svg";
          const moto2Title = "Moto 2";
          const moto2ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_2.json?sp=r&st=2024-04-12T10:13:00Z&se=2090-01-01T19:13:00Z&sv=2022-11-02&sr=b&sig=nPwp4TFqZQHiC%2BSUC%2BoKZvlAsQoWzUKWLP8dfRfWPXA%3D";
          iniciarMarcadorMoto( moto2IconUrl, moto2Title, moto2ApiUrl );

          const moto3IconUrl = "./assets/moto_Qubo.svg";
          const moto3Title = "Moto 3";
          const moto3ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_3.json?sp=r&st=2024-04-12T10:13:18Z&se=2090-01-01T19:13:18Z&sv=2022-11-02&sr=b&sig=5fcKh4PGkoHUk2RtokH1%2F%2B4Vu1OZ5%2Bp8z2NKoteltp8%3D";
          iniciarMarcadorMoto( moto3IconUrl, moto3Title, moto3ApiUrl );

          const moto4IconUrl = "./assets/moto_Qubo.svg";
          const moto4Title = "Moto 4";
          const moto4ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_4.json?sp=r&st=2024-04-12T10:13:35Z&se=2090-01-01T19:13:35Z&sv=2022-11-02&sr=b&sig=9d4Eui4QaFMOAOiUYCILkxcBscJJezgzLbPvGw5TWbo%3D";

          iniciarMarcadorMoto( moto4IconUrl, moto4Title, moto4ApiUrl );
          const moto5IconUrl = "./assets/moto_Qubo.svg";
          const moto5Title = "Moto 5";
          const moto5ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Moto%20Sharing/MOTOSHARING_5.json?sp=r&st=2024-04-12T10:13:58Z&se=2090-01-01T19:13:58Z&sv=2022-11-02&sr=b&sig=0cu4ny5jnAbgK5LzSiRam7fDVx%2F797qf%2FCGlNQlDK54%3D";
          iniciarMarcadorMoto( moto5IconUrl, moto5Title, moto5ApiUrl );

          // Repite el proceso para los demás motos...
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
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data.Patinete && Array.isArray( data.Patinete.Ubicaciones ) ) {
                              const coordenadas = data.Patinete.Ubicaciones;

                              // Mover el marcador del scooter sharing con las coordenadas obtenidas
                              marcadoresScooter[ title ].intervaloId = iniciarMovimientoMarcador( scooterMarker, coordenadas, 2000 );

                              // Almacenar los datos del patinete en el objeto marcadoresScooter
                              marcadoresScooter[ title ].datosPatinete = data.Patinete;
                         } else {
                              console.error( 'Los datos del scooter no tienen el formato esperado:', data );
                         }
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
          scooterMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               const datosPatinete = marcadoresScooter[ title ].datosPatinete;
               infoBox.innerHTML = `
        <div>${ title }</div>
        <img src="${ datosPatinete.ImagenURL }" at="scooter-image">
        <p>Estado: ${ datosPatinete.Estado }</p>
        <p>Matricula: ${ datosPatinete.Matricula }</p>
        <p>Velocidad: ${ datosPatinete.Velocidad }</p>
        <button id="cerrar-info-box">
            <img src="./assets/botonCerrar.svg" alt="Cerrar">
        </button>
    `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
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
     } );


     //! Función para Marcadores de BUS
     // Declarar el objeto marcadoresAutobus en el ámbito global
     const marcadoresAutobus = {};
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
               fetch( apiUrl )
                    .then( response => response.json() )
                    .then( data => {
                         // Asegurarse de que los datos están en el formato esperado
                         if ( data && Array.isArray( data.Coordenadas ) ) {
                              const coordenadas = data.Coordenadas;

                              // Mover el marcador del autobús con las coordenadas obtenidas
                              marcadoresAutobus[ title ].intervaloId = iniciarMovimientoMarcador( autobusMarker, coordenadas, 2000 );

                              // Almacenar los datos del autobús en el objeto marcadoresAutobus
                              marcadoresAutobus[ title ].datosAutobus = data;
                         } else {
                              console.error( 'Los datos del autobús no tienen el formato esperado:', data );
                         }
                    } )
                    .catch( error => console.error( 'Error al obtener coordenadas del autobús:', error ) );
          }

          // Iniciar el proceso de mover el autobús
          obtenerYmoverAutobus();

          // Almacenar el marcador y su intervalo en el objeto marcadoresAutobus
          marcadoresAutobus[ title ] = {
               marker: autobusMarker,
               intervaloId: null, // Aquí deberías almacenar el ID del intervalo si estás usando setInterval para mover el marcador
               datosAutobus: null // Almacenar los datos del autobús aquí
          };

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
               <p>Matrícula: ${ datosAutobus.Matricula }</p>
               <p>Estado: ${ datosAutobus.Estado }</p>
               <p>Línea: ${ datosAutobus.Linea }</p>
               <button id="cerrar-info-box">
                    <img src="./assets/botonCerrar.svg" alt="Cerrar">
               </button>
        `;
               document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                    infoBox.style.display = "none";
               } );
          } );
     }
     // Marcador para AUTOBÚS MADRID
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
               { lat: 40.412643415411836, lng: -3.6698436951248485 },//!
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
               { lat: 40.41981618069888, lng: -3.6692617864453996 },//!
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
     // Modificar el evento del botón para manejar todos los marcadores de autobús
     const eventAutobus = document.getElementById( "bus-sub-nav-item" );
     eventAutobus.addEventListener( 'click', function () {
          iniciarMarcadorBusMadrid();
          // Ejemplo de cómo llamar a la función genérica para cada autobús
          const autobus1IconUrl = "./assets/bus_Qubo.svg"; // Asegúrate de tener un icono de autobús
          const autobus1Title = "Autobús 1";
          const autobus1ApiUrl = "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/AUTOBUS.json?sp=r&st=2024-04-12T10:10:23Z&se=2090-01-01T19:10:23Z&sv=2022-11-02&sr=b&sig=wVH5LplrNY%2B2ffDs75Rm91ofVL7JGQY7xFuxu1bBbPE%3D";
          iniciarMarcadorAutobus( autobus1IconUrl, autobus1Title, autobus1ApiUrl );

          // Repite el proceso para los demás autobuses...
     } );

     // Objeto para mantener los marcadores de autobuses y sus datos
     const marcadoresRutas = {};
     // Función para iniciar o actualizar un marcador de autobús
     function manejarMarcadorRuta( apiUrl, iconUrl ) {
          const rutaId = apiUrl; // Usamos la URL como identificador único para el marcador

          // Verificar si el marcador ya existe
          if ( marcadoresRutas[ rutaId ] ) {
               // Si existe, detener cualquier intervalo y eliminar el marcador
               clearInterval( marcadoresRutas[ rutaId ].intervaloId );
               marcadoresRutas[ rutaId ].marker.setMap( null );
               delete marcadoresRutas[ rutaId ];
          } else {
               // Si no existe, crear un nuevo marcador
               fetch( apiUrl )
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

                         // Evento click para mostrar información detallada
                         marker.addListener( "click", function () {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                         <div><strong>${ data.nombre_ruta }</strong></div>
                         <img src="${ data.imagen_autobus }" alt="Imagen del autobús">
                         <p>Matrícula: ${ data.matricula_autobus }</p>
                         <p>Tipo: ${ data.tipo_autobus }</p>
                         <p>Capacidad: ${ data.capacidad }</p>
                         <p>Accesibilidad: ${ data.accesibilidad }</p>
                         <p>Año de fabricaión: ${ data.año_fabricacion }</p>
                         <p>Operador: ${ data.operador }</p>
                         <p>Frecuencia: ${ data.frecuencia_servicio }</p>
                         <ul>
                              ${ data.caracteristicas.map( caracteristica => `<li>${ caracteristica }</li>` ).join( '' ) }
                         </ul>
                         <button id="cerrar-info-box">
                              <img src="./assets/botonCerrar.svg" alt="Cerrar">
                         </button>
                    `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                                   infoBox.style.display = "none";
                              } );
                         } );
                    } )
                    .catch( error => console.error( 'Error al cargar datos del autobús:', error ) );
          }
     }
     // Evento para el botón que maneja las rutas de autobús
     const botonBus = document.getElementById( "bus-sub-nav-item" );
     botonBus.addEventListener( 'click', function () {
          manejarMarcadorRuta(
               "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/L%C3%ADnea1Moncloa_a_%20AravacaMadrid.json?sp=r&st=2024-04-14T15:35:22Z&se=2090-01-01T00:35:22Z&sv=2022-11-02&sr=b&sig=dOLRCF5YyUOHUjJmCAExmaYwgfN%2FHdeekdpxoUgrYOE%3D",
               "./assets/bus_Qubo.svg"
          );
          manejarMarcadorRuta(
               "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/L%C3%ADnea2%20Arganzuela_Circular.json?sp=r&st=2024-04-14T16:30:04Z&se=2090-01-01T01:30:04Z&sv=2022-11-02&sr=b&sig=Cfyck1fAxiLPVThrKq0H6w7R6LbMd732bqLwEncFGwQ%3D", "./assets/bus_Qubo.svg"
          );
          manejarMarcadorRuta(
               "https://anpaccountdatalakegen2.blob.core.windows.net/service/Mobility/Bus/Ruta7Ciudad_Universitaria_a_Opera.json?sp=r&st=2024-04-14T16:46:53Z&se=2090-01-01T01:46:53Z&sv=2022-11-02&sr=b&sig=8cd%2FYH9xBTjXWxBC5mQCKpmDN%2FtCixIvoptowWejMdg%3D", "./assets/bus_Qubo.svg"
          );
          // Aquí puedes añadir más llamadas para otras rutas con el mismo formato
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
               fetch( apiUrl )
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
                <p>Flota: ${ datosPolicia[ "Flota" ] }</p>
                <p>Dirección General o Servicio de Adscripción: ${ datosPolicia[ "Direccion General o Servicio de Adscripcion" ] }</p>
                <p>Tipo de Uso: ${ datosPolicia[ "Tipo de Uso" ] }</p>
                <p>Tipo Vehículo: ${ datosPolicia[ "Tipo Vehiculo" ] }</p>
                <p>Relación Contractual: ${ datosPolicia[ "Relacion Contractual" ] }</p>
                <p>Energía/Combustible: ${ datosPolicia[ "Energia/Combustible" ] }</p>
                <p>Categoría Eléctrico: ${ datosPolicia[ "Categoria Electrico" ] }</p>
                <p>Distintivo: ${ datosPolicia[ "Distintivo" ] }</p>
                <p>Clase Industria: ${ datosPolicia[ "Clase Industria" ] }</p>
                <p>Categoría Homologación UE: ${ datosPolicia[ "Categ Homologacion UE" ] }</p>
            `;
               }

               infoBox.innerHTML = `
            <div>${ title }</div>
            <img src="${ datosPolicia.ImagenURL }" alt="Policía Image">
            <p>Estado: ${ datosPolicia.Estado }</p>
            <p>Matrícula: ${ datosPolicia.Matricula }</p>
            <p>Indicativo: ${ datosPolicia.Indicativo }</p>
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
     function iniciarPoliciaEnMapa() {
          const policeMarkerIconUrl = "./assets/digitalTwinPolice.svg";

          if ( policeDirectMarker ) {
               clearInterval( intervaloDirecto );
               policeDirectMarker.setMap( null );
               policeDirectMarker = null;
               return;
          }

          policeDirectMarker = new google.maps.Marker( {
               map: map,
               title: "Coche de Policía Directo",
               icon: policeMarkerIconUrl,
          } );

          fetch( 'https://6512ae85b8c6ce52b39601a2.mockapi.io/coordenadasPolice' )
               .then( response => response.json() )
               .then( coordenadas => {
                    intervaloDirecto = iniciarMovimientoMarcador( policeDirectMarker, coordenadas, 2000 );
               } )
               .catch( error => console.error( 'Error al obtener coordenadas de la policía:', error ) );

          policeDirectMarker.addListener( "click", function () {
               const infoBox = document.querySelector( ".info-box" );
               infoBox.style.display = "flex";
               infoBox.innerHTML = `
            <div>Información patrulla policía Directa</div>
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
          iniciarPoliciaEnMapa();
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
               fetch( apiUrl )
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
        <img src="${ datosAmbulancia.ImagenURL }" alt="Imagen de la Ambulancia"/>
        <div>Estado: ${ datosAmbulancia.Estado }</div>
        <div>Conductor/a: ${ datosAmbulancia[ 'Conductor/a' ] }</div>
        <div>Médico: ${ datosAmbulancia.Medico }</div>
        <div>Enfermero/a: ${ datosAmbulancia[ 'Enfermero/a' ] }</div>
        <div>Indicativo: ${ datosAmbulancia.Indicativo }</div>
        <div>Matrícula: ${ datosAmbulancia.Matricula }</div>
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


     //? Qubo en movimiento random
     // let index = 0
     const cooordinatesRandom = [
          { lat: 40.057743150675655, lng: 0.08461168439483087 },
          { lat: 40.05773088281283, lng: 0.08463818335558371 },
          { lat: 40.05770548350885, lng: 0.0843856124131972 },
          { lat: 40.057654684873256, lng: 0.08382700658233491 },
          { lat: 40.05761658587114, lng: 0.08345460271107888 },
          { lat: 40.05756155394159, lng: 0.08296605307799547 },
          { lat: 40.057502288733325, lng: 0.08239085499267684 },
          { lat: 40.05746721408694, lng: 0.08177415130282108 },
          { lat: 40.05739727270181, lng: 0.08055325680538275 },
          { lat: 40.057151427699836, lng: 0.07760178681562814 },
          { lat: 40.05710232479058, lng: 0.07598513124450577 },
          { lat: 40.056326494128484, lng: 0.07454810407017477 },
          { lat: 40.0551480002201, lng: 0.07277748124363577 },
          { lat: 40.05425429546055, lng: 0.07121214807159665 },
          { lat: 40.053468611266275, lng: 0.07045514268511872 },
          { lat: 40.05155346809624, lng: 0.0677735473330189 },
          { lat: 40.050934717964836, lng: 0.06678559106642465 },
          { lat: 40.04984452561149, lng: 0.06520742726613299 },
          { lat: 40.04790963672899, lng: 0.06270546022176907 },
          { lat: 40.046063092628216, lng: 0.06010084846829413 },
          { lat: 40.04518891332257, lng: 0.058894772013217925 },
          { lat: 40.04425578818245, lng: 0.05758605073189468 },
          { lat: 40.04363697186854, lng: 0.056598094521862694 },
          { lat: 40.04136793063235, lng: 0.05314666308844138 },
          { lat: 40.040434753220985, lng: 0.050606204248375405 },
          { lat: 40.04014006297391, lng: 0.049579756266710406 },
          { lat: 40.03960961731964, lng: 0.04970806226441853 },
          { lat: 40.03923633827447, lng: 0.04993901306029315 },
          { lat: 40.03811648887824, lng: 0.05038808405227158 },
          { lat: 40.03726185455594, lng: 0.05082432439754454 },
     ];
     //? Marcador de ubicacion RANDOM en movimientos cada 2 segundos
     const nuevoMarkerLatLng = { lat: 40.05773088281283, lng: 0.08463818335558371 };
     const nuevoMarkerIconUrl = "./assets/cuboMovimiento.svg";

     const nuevoMarker = new google.maps.Marker( {
          position: nuevoMarkerLatLng,
          map: map,
          title: "Ubicación Random",
          icon: nuevoMarkerIconUrl,
     } );
     iniciarMovimientoMarcador( nuevoMarker, cooordinatesRandom, 2000 );

     nuevoMarker.addListener( "click", function () {
          const infoBox = document.querySelector( ".info-box" );
          infoBox.style.display = "flex";
          infoBox.innerHTML = `
    <div>Información Autobús Benicasim</div>
    <button id="cerrar-info-box">
      <img src="./assets/botonCerrar.svg" alt="">
    </button>
  `;
          document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
               infoBox.style.display = "none";
          } );
     } );

     // ----------------------------------------------------- //





     // -------------------------------------------- //

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
// function cargarMarcadoresNewBuildings() {
//      fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/New%20Buildings/Fiware_Buildings_NewBuildings-00001?sp=r&st=2024-06-01T10:24:46Z&se=2090-01-01T19:24:46Z&sv=2022-11-02&sr=b&sig=ZPMSJa5sRrTyLWd0t%2FgExVaS9hXxVIQdQchzXN4zAJY%3D' )
//           .then( response => response.json() )
//           .then( data => {
//                data.buildings0008.forEach( item => {
//                     const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
//                     const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
//                     const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );
//                     const streetAddress = safeAccess( item, 'address', 'value', 'streetAddress', 'Dirección no disponible' );
//                     const postalCode = safeAccess( item, 'address', 'value', 'postalCode', 'Código postal no disponible' );
//                     const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
//                     const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );
//                     const addressCountry = safeAccess( item, 'address', 'value', 'addressCountry', 'Direccion no disponible' );
//                     const neighborhood = safeAccess( item, 'address', 'value', 'neighborhood', 'Barrio no disponible' );

//                     if ( ubicacion && name ) {
//                          const marker = new google.maps.Marker( {
//                               position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
//                               map: map,
//                               title: name,
//                               icon: "./assets/newBuildingsQubo.svg"
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
//                               <img src='./assets/staticOtherBuildings.jpg'>
//                               <p>Address: ${ streetAddress }, ${ postalCode }</p>
//                               <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
//                               <p>Neighborhood: ${ neighborhood }</p>
//                               <p>Country: ${ addressCountry }</p>
//                               <p>${ description }</p>
//                               <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                               <button class='share'><img src='./assets/shareIcon.svg'></button>
//                          `;
//                               document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
//                                    infoBox.style.display = "none";
//                               } );
//                          } );

//                          markersNewBuildings.push( marker ); // Añade el marcador al array de parcelas
//                     }
//                } );
//           } )
//           .catch( error => console.error( "Error al cargar los marcadores de Other Buildings:", error ) );
// };

//! Función para mostrar NEW BUILDINGS
function cargarMarcadoresNewBuildings() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/New%20Buildings/Fiware_Buildings_NewBuildings-00001?sp=r&st=2024-06-01T10:24:46Z&se=2090-01-01T19:24:46Z&sv=2022-11-02&sr=b&sig=ZPMSJa5sRrTyLWd0t%2FgExVaS9hXxVIQdQchzXN4zAJY%3D' )
          .then( response => response.json() )
          .then( data => {
               data.buildings0008.forEach( item => {
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
                              icon: "./assets/newBuildingsQubo.svg"
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
                              <img src='./assets/staticOtherBuildings.jpg'>
                              <p>Address: ${ streetAddress }, ${ postalCode }</p>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>District: ${ district }</p>
                              <p>Neighborhood: ${ neighborhood }</p>
                              <p>Country: ${ addressCountry }</p>
                              <p>${ description }</p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersNewBuildings.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Other Buildings:", error ) );
};

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


// //! Funcion para mostrar HOUSES
// const cargarYMostrarMarcadoresCasas = async () => {
//      try {
//           /* const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Houses/Fiware_Buildings_Houses-00001?sp=r&st=2024-03-09T08:45:33Z&se=2090-01-01T16:45:33Z&sv=2022-11-02&sr=b&sig=gGvbvOfrtZ7Z%2F0KgDbY4Ap6d9zlMERLGqSW8s5cJW0E%3D" ); */
//           const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Houses/Fiware_Buildings_Houses-00001?sp=r&st=2024-03-31T08:25:20Z&se=2090-01-01T17:25:20Z&sv=2022-11-02&sr=b&sig=gYyNiUSwKU5upO86hX1DgDGRmoosucVSPcYZ%2BxGSnHY%3D" );
//           const data = await response.json();

//           data.buildings0007.forEach( item => {
//                const ubicacion = item.location.value.coordinates;


//                const houseMarker = new google.maps.Marker( {
//                     position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
//                     map: map,
//                     title: item.name.value,
//                     icon: "./assets/housesQubo.svg"
//                } );

//                houseMarker.addListener( 'click', () => {
//                     const infoBox = document.querySelector( ".info-box" );
//                     infoBox.style.display = "flex";
//                     const idWithoutPrefix = item.id.replace( /^property_/, '' );
//                     const capitalizedCategory = item.category.value[ 0 ].charAt( 0 ).toUpperCase() + item.category.value[ 0 ].slice( 1 );
//                     const parkingInfo = item.annexIdealista.value.parkingSpace.hasParkingSpace ? "Sí" : "No";
//                     const parkingIncluded = item.annexIdealista.value.parkingSpace.isParkingSpaceIncludedInPrice ? "Sí" : "No";

//                     infoBox.innerHTML = `
//                      <div class='nameContainer'>
//                      <p>${ capitalizedCategory }</p>
//                          <p>${ item.name.value }</p>
//                      </div>
//                      <img src='${ item.thumbnail.value }'>
//                      <p>Código identificador: ${ idWithoutPrefix }</p>
//                      <p>Localización: ${ item.address.value.addressLocality }, ${ item.address.value.addressRegion }</p>
//                      <p>Tipo de operación: ${ item.annexIdealista.value.operation.charAt( 0 ).toUpperCase() + item.annexIdealista.value.operation.slice( 1 ) }</p>

//                      <p>District: ${ item.address.value.district }</p>
//                      <p>Precio total: ${ ( item.annexIdealista.value.price ).toLocaleString( 'es-ES' ) } €</p>
//                      <p>Size: ${ item.annexIdealista.value.size } m²</p>
//                      <p>Rooms: ${ item.annexIdealista.value.rooms }</p>
//                      <p>Bathrooms: ${ item.annexIdealista.value.bathrooms }</p>
//                      <p>Parking: ${ parkingInfo }</p>
//                      ${ parkingInfo === "Sí" ? `<p>Parking incluido en el precio: ${ parkingIncluded }</p>` : '' }
//                      <p>Source: <a class="links-propiedades" href="${ item.source.value }" target="_blank">${ item.source.value }</a></p>
//                      <p>${ item.description.value }</p>
//                      <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                      <button class='share'><img src='./assets/shareIcon.svg'></button>
//                  `;
//                     document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
//                          infoBox.style.display = "none";
//                     } );
//                } );

//                markersHouses.push( houseMarker ); // Añade el marcador al array de casas
//           } );
//      } catch ( error ) {
//           console.error( "Error fetching houses:", error );
//      }
// };

//! Función para mostrar HOUSES
const cargarYMostrarMarcadoresCasas = async () => {
     try {
          const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Houses/Fiware_Buildings_Houses-00001?sp=r&st=2024-03-31T08:25:20Z&se=2090-01-01T17:25:20Z&sv=2022-11-02&sr=b&sig=gYyNiUSwKU5upO86hX1DgDGRmoosucVSPcYZ%2BxGSnHY%3D" );
          const data = await response.json();

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
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         const idWithoutPrefix = item.id.replace( /^building_ide_/, '' );
                         const capitalizedCategory = parsedData.category;
                         const parkingInfo = item.annexIdealista.value.parkingSpace.hasParkingSpace ? "Sí" : "No";
                         const parkingIncluded = item.annexIdealista.value.parkingSpace.isParkingSpaceIncludedInPrice ? "Sí" : "No";

                         infoBox.innerHTML = `
                         <div class='nameContainer'>
                             <p>${ capitalizedCategory }</p>
                             <p>${ parsedData.name }</p>
                         </div>
                         <img src='${ item.thumbnail.value }'>
                         <p>Código identificador: ${ idWithoutPrefix }</p>
                         <p>Localización: ${ parsedData.addressLocality }, ${ parsedData.addressRegion }</p>
                         <p>Tipo de operación: ${ item.annexIdealista.value.operation.charAt( 0 ).toUpperCase() + item.annexIdealista.value.operation.slice( 1 ) }</p>
                         <p>District: ${ parsedData.district }</p>
                         <p>Precio total: ${ ( item.annexIdealista.value.price ).toLocaleString( 'es-ES' ) } €</p>
                         <p>Size: ${ item.annexIdealista.value.size } m²</p>
                         <p>Rooms: ${ item.annexIdealista.value.rooms }</p>
                         <p>Bathrooms: ${ item.annexIdealista.value.bathrooms }</p>
                         <p>Parking: ${ parkingInfo }</p>
                         ${ parkingInfo === "Sí" ? `<p>Parking incluido en el precio: ${ parkingIncluded }</p>` : '' }
                         <p>Source: <a class="links-propiedades" href="${ parsedData.source }" target="_blank">${ parsedData.source }</a></p>
                         <p>${ parsedData.description }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                     `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
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
          const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Offices/Fiware_Buildings_Offices-00001?sp=r&st=2024-03-09T08:46:32Z&se=2090-01-01T16:46:32Z&sv=2022-11-02&sr=b&sig=U9Oi9KQFp%2FdQZqhjzQFSgm8JgtfOldIQvCUHdTYv4nY%3D" );
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
                         <div class='nameContainer'>
                              <p>${ capitalizedCategory }</p>
                              <p>${ item.name.value }</p>
                         </div>
                         <img src='./assets/staticOffices.jpg'>
                         <p>Código identificador: ${ idWithoutPrefix }</p>
                         <p>Address: ${ item.address.value.streetAddress }</p>
                         <p>District: ${ item.address.value.district }</p>
                         <p>Localización: ${ item.address.value.addressLocality }, ${ item.address.value.addressRegion }</p>
                         <p>${ item.description.value }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                    `;
                    document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                         infoBox.style.display = "none";
                    } );
               } );

               markersOffices.push( officeMarker ); // Añade el marcador al array de oficinas
          } );
     } catch ( error ) {
          console.error( "Error fetching offices:", error );
     }
};

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
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Commercial%20%26%20Industrial/Fiware_Buildings_CommercialAndIndustrial_-00001?sp=r&st=2024-06-01T11:03:07Z&se=2090-01-01T20:03:07Z&sv=2022-11-02&sr=b&sig=lTkeDvm2Nc8gekaWO296rAkmdyZIIblaZxw%2BeyA16kg%3D' )
          .then( response => response.json() )
          .then( data => {
               data.buildings0005.forEach( item => {
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
                              icon: "./assets/commercialOrIndustrialQubo.svg"
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
                              <img src='./assets/staticCommercialOrIndustrial.jpg'>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>Neighborhood: ${ neighborhood }</p>
                              <p>District: ${ district }</p>
                              <p>Country: ${ addressCountry }</p>
                              <p>${ description }</p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
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
          const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Garages/Fiware_Buildings_Garages-00001?sp=r&st=2024-03-09T08:44:49Z&se=2090-01-01T16:44:49Z&sv=2022-11-02&sr=b&sig=gRC1J4u547MhsC44oA5TO1h4N9%2F0kpozqY89RRzazfA%3D" );
          const data = await response.json();

          data.buildings0006.forEach( item => {
               const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
               const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
               const neighborhood = safeAccess( item, 'address', 'value', 'neighborhood', 'Barrio no disponible' );
               const district = safeAccess( item, 'address', 'value', 'district', 'Distrito no disponible' );
               const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
               const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );
               const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );

               if ( ubicacion && name ) {
                    const garageMarker = new google.maps.Marker( {
                         position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                         map: map,
                         title: name,
                         icon: "./assets/garagesQubo.svg"
                    } );

                    garageMarker.addListener( 'click', () => {
                         const infoBox = document.querySelector( ".info-box" );
                         infoBox.style.display = "flex";
                         infoBox.innerHTML = `
                         <div class='nameContainer'>
                             <p>Garaje</p>
                             <p>${ name }</p>
                         </div>
                         <img src='./assets/staticGarages.jpg'>
                         <p>Address: ${ neighborhood }, ${ district }</p>
                         <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                         <p>${ description }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                     `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );

                    markersGarages.push( garageMarker ); // Añade el marcador al array de garajes
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
     fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Parcels/Fiware_Buildings_Parcels-00001?sp=r&st=2024-02-16T19:50:11Z&se=2090-01-01T03:50:11Z&sv=2022-11-02&sr=b&sig=sMy7J4ZHbofqEvbKuA8BnrHesnkwEHmbSYVxYnlFgTk%3D" )
          .then( response => response.json() )
          .then( data => {
               data.buildings0003.forEach( item => {
                    const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
                    const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
                    const description = safeAccess( item, 'description', 'value', 'Descripción no disponible' );
                    const owner = safeAccess( item, 'owner', 'object', 0, 'Propietario no disponible' );
                    const streetAddress = safeAccess( item, 'address', 'value', 'streetAddress', 'Dirección no disponible' );
                    const postalCode = safeAccess( item, 'address', 'value', 'postalCode', 'Código postal no disponible' );
                    const addressLocality = safeAccess( item, 'address', 'value', 'addressLocality', 'Localidad no disponible' );
                    const addressRegion = safeAccess( item, 'address', 'value', 'addressRegion', 'Región no disponible' );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/quboParcels.svg"
                         } );

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>Terreno</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticParcels.jpg'>
                              <p>Address: ${ streetAddress }, ${ postalCode }</p>
                              <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                              <p>Owner: ${ owner }</p>
                              <p>${ description }</p>
                              <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                              <button class='share'><img src='./assets/shareIcon.svg'></button>
                         `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersParcels.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de parcelas:", error ) );
};

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
//                               <img src='./assets/staticOtherBuildings.jpg'>

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
     fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Buildings/Iconic/Fiware_Buildings_Iconic-00001?sp=r&st=2024-02-16T19:44:04Z&se=2090-01-01T07:45:04Z&sv=2022-11-02&sr=b&sig=mvEnx2llvD30oO%2BZlFqgitpIav91hgqovdRH7jB4IOs%3D" )
          .then( response => response.json() )
          .then( data => {
               data.buildings0004.forEach( item => {
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

                    const marker = new google.maps.Marker( {
                         position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                         map: map,
                         title: item.name.value,
                         icon: "./assets/quboIconic.svg"
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
                         <img src='./assets/staticIconic.jpg'>
                         <p>${ description }</p>
                         <p>Address: ${ streetAddress }, ${ postalCode }</p>
                         <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                     `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                              infoBox.style.display = "none";
                         } );
                    } );

                    markersIconic.push( marker ); // Añade el marcador al array
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
               // Si es la primera vez, crea los marcadores
               fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Hospitals%20%26%20Clinics/Fiware_Health_HospitalsAndClinics-00001?sp=r&st=2023-12-30T10:17:13Z&se=2090-01-01T18:17:13Z&sv=2022-11-02&sr=b&sig=9W9CmvHNvBDU7GhdmzMbkM5AP193N%2FFBRT1b5w4KFJ0%3D" )
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
                                   <img src='./assets/staticHospital.jpg'>
                                   <p>Address: ${ streetAddress }, ${ postalCode }</p>
                                   <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                                   <p>${ addressCountry }</p>
                                   <p>Owner: ${ owner }</p>
                                   <p>${ description }</p>
                                   <p>ID: ${ id }</p>
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
//      fetch('https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Optics%2C%20Dentists%2C%20etc/Fiware_Health_DentistsOpticsEtc-00001?sp=r&st=2024-06-02T10:05:50Z&se=2090-01-01T19:05:50Z&sv=2022-11-02&sr=b&sig=VS7OweuOhqFPf1Axhuy%2FHBnBbNoQRM7LHkAlPJQg%2Fq4%3D')
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

//! Función para mostrar PHARMACY
const cargarMarcadoresFarmacias = () => {
     fetch(
          "https://anpaccountdatalakegen2.blob.core.windows.net/service/Health/Pharmacy/Fiware_Health_Pharmacy-00001?sp=r&st=2024-01-03T13:10:58Z&se=2090-03-01T21:10:58Z&sv=2022-11-02&sr=b&sig=%2BWst1weUxMGfSdDVWZ25AmykNzJkguql09VWbkpaGOQ%3D"
     )
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
                         <img src='./assets/staticPharmacy.png'>
                         <p>Owner: ${ owner }</p>
                         <p>Address: ${ streetAddress }</p>
                         <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                         <p>Country: ${ addressCountry }</p>
                         <p>ID: ${ item.id }</p>
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
     const ubicacion = safeAccess( item, 'location', 'value', 'coordinates', 'Ubicación no disponible' );
     const name = safeAccess( item, 'name', 'value', 'Nombre no disponible' );
     const categoryArray = safeAccess( item, 'category', 'value', [] );
     let category = categoryArray.length > 0 ? convertToTitleCase( categoryArray[ 0 ] ) : 'Categoría no disponible';


     // Mapeo de categorías específicas a su formato deseado
     const categoryMap = {
          commercialProperty: "Commercial Property",
          newDevelopment: "New Development",
          touristic: "Touristic",
          hospital: "Hospital"
          // Puedes agregar más mapeos aquí si es necesario
     };

     if ( categoryArray.length > 0 && categoryMap[ categoryArray[ 0 ] ] ) {
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
     const ownerArray = safeAccess( item, 'owner', 'object', [] );

     const owner = ownerArray.length > 0 ? ownerArray.join( ', ' ) : 'Owner no disponible';

     return {
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
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Police/Fiware_Security_Police-00001?sp=r&st=2024-06-02T10:30:17Z&se=2090-01-01T19:30:17Z&sv=2022-11-02&sr=b&sig=t5a17aCew3nA5twJGHg5K4fiMXBI%2BphX9N%2F3bjpbDRg%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticPoliceStation.jpeg'>
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

                         markersPolice.push( marker ); // Añade el marcador al array de parcelas
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

function cargarMarcadoresFire() {
     // Cargar datos JSON
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Fiware_Security_Fire-00001?sp=r&st=2024-06-02T10:34:51Z&se=2090-01-01T19:34:51Z&sv=2022-11-02&sr=b&sig=kIIhP5A5%2BADgQbK1rf45qF7zibOYT%2F6QU0kLSGPKihU%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                         <div class='nameContainer'>
                             <p>${ category }</p>
                             <p>${ name }</p>
                         </div>
                         <img src='./assets/staticFireStation.jpeg'/>
                         <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                         <p>Address: ${ streetAddress }</p>
                         <p>C.P: ${ postalCode }</p>
                         <p>Neighborhood: ${ neighborhood }</p>
                         <p>District: ${ district }</p>
                         <p>Country: ${ addressCountry }</p>
                         <p>${ description }</p>
                         <p>Link: <a href="${ source }" target="_blank">Click Here</a></p>
                         <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
                         <button class='share'><img src='./assets/shareIcon.svg'></button>
                     `;
                              document.getElementById( "cerrar-info-box" ).addEventListener( "click", () => {
                                   infoBox.style.display = "none";
                              } );
                         } );

                         markersFire.push( marker ); // Añade el marcador al array de marcadores de bomberos
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de bomberos:", error ) );

     // Cargar capa KML
     const kmlUrl = 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Security/Fire/Actuaciones%20Bomberos%20Final.kml?sp=r&st=2024-06-02T11:37:02Z&se=2090-01-01T20:37:02Z&sv=2022-11-02&sr=b&sig=TiiAzwAOI0rdct%2BYF%2F%2BJe3GFq%2FhTHx7rN7dsxnLfkzo%3D';
     const kmlLayer = new google.maps.KmlLayer( {
          url: kmlUrl,
          map: map,
          preserveViewport: true
     } );
     kmlLayersFire.push( kmlLayer );
}

const eventFire = document.getElementById( "fire-sub-nav-item" );
let markersFire = []; // Array para almacenar los marcadores de bomberos
let kmlLayersFire = []; // Array para almacenar las capas KML de bomberos
let fireVisible = false; // Bandera para el estado de visibilidad

eventFire.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de bomberos
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



//* BOTÓN ENTERTAINMENT AND SPORTS ****************

//! Función para mostrar EVENTS&CONCERTS

function cargarMarcadoresEnventsConcerts() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Events%20%26%20Concerts/Fiware_Entertainment_EventsAndConcerts-00001?sp=r&st=2024-06-16T16:40:22Z&se=2090-01-01T01:40:22Z&sv=2022-11-02&sr=b&sig=zEVssSBnqIgsT4TQCkrlbKqG7xI%2BzoKA8VJ6zUH4IJk%3D' )
          .then( response => response.json() )
          .then( data => {
               data.pois0001.forEach( item => {
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
                              icon: "./assets/ConcertsEventsQubo.svg"
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
                              <img src='./assets/staticConcertsEvents.jpg'>
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

                         markersConcertsEvents.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Events & Concerts:", error ) );
};
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

function cargarMarcadoresTheatres() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Theatres/Fiware_Entertainment_Theaters-00001?sp=r&st=2024-06-16T16:44:06Z&se=2090-01-01T01:44:06Z&sv=2022-11-02&sr=b&sig=3Lv8dUd2Osbx%2FfzV1Vn6HdEnIUa6cuUiRzvxCgkrtVQ%3D' )
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
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/TheatresQubo.svg"
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
                              <img src='./assets/staticTheatres.jpg'>
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

                         markersTheatres.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Theatres:", error ) );
};
const eventTheatres = document.getElementById( "theatres-sub-nav-item" );
let markersTheatres = []; // Array para almacenar los marcadores de parcelas
let theatresVisible = false; // Bandera para el estado de visibilidad

eventTheatres.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersTheatres, theatresVisible );
     theatresVisible = !theatresVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersTheatres.length === 0 && theatresVisible ) {
          cargarMarcadoresTheatres(); // Llama a la función para cargar los marcadores de parcelas
     }
} );

//! Función para mostrar CINEMAS

function cargarMarcadoresCinemas() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Cinemas/Fiware_Entertainment_Cinema-00001?sp=r&st=2024-06-16T16:52:22Z&se=2090-01-01T01:52:22Z&sv=2022-11-02&sr=b&sig=miAc9ZvoSlO6eExvcTCPbJ2o0fNTd2zeiddOSAbzdF4%3D' )
          .then( response => response.json() )
          .then( data => {
               data.buildings0012.forEach( item => {
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
                              icon: "./assets/CinemasQubo.svg"
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
                              <img src='./assets/staticCinemas.jpg'>
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

                         markersCinemas.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Cinemas:", error ) );
};
const eventCinemas = document.getElementById( "cinemas-sub-nav-item" );
let markersCinemas = []; // Array para almacenar los marcadores de parcelas
let cinemasVisible = false; // Bandera para el estado de visibilidad

eventCinemas.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersCinemas, cinemasVisible );
     cinemasVisible = !cinemasVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersCinemas.length === 0 && cinemasVisible ) {
          cargarMarcadoresCinemas(); // Llama a la función para cargar los marcadores de parcelas
     }
} );



//! Función para mostrar LANDMARKS

function cargarMarcadoresLandmarks() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Landmarks/Fiware_Entertainment_Landmarks-00001?sp=r&st=2024-06-16T17:24:52Z&se=2090-01-01T02:24:52Z&sv=2022-11-02&sr=b&sig=ixGwZCchqFbUgjNVGbyGjQ%2FhDnJDmhYL3WSqUl4l5MI%3D' )
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
                         source
                    } = parseFiwareData( item );

                    if ( ubicacion && name ) {
                         const marker = new google.maps.Marker( {
                              position: { lat: ubicacion[ 1 ], lng: ubicacion[ 0 ] },
                              map: map,
                              title: name,
                              icon: "./assets/LandmarksQubo.svg"
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
                              <img src='./assets/staticLandmarks.jpg'>
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

                         markersLandmarks.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Landmarks:", error ) );
};
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
const marcadoresEstadios = {};
let estadiosVisible = false;

function cargarEstadios() {
     fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Stadiums/estadiosMadrid.json?sp=r&st=2024-04-14T17:49:26Z&se=2090-01-01T02:49:26Z&sv=2022-11-02&sr=b&sig=ji01C4KUVXV9XBkmWj4zW6wvfQeB5T4kYxZzs80MTpA%3D" )
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
                        <h2>${ estadio.nombre }</h2>
                        <img src="${ estadio.imgUrl }">
                        <p>Capacidad: ${ estadio.capacidad }</p>
                        <p>Inauguración: ${ estadio.inauguración }</p>
                        <p>Equipo Local: ${ estadio.equipo_local }</p>
                        <p>Uso: ${ estadio.uso }</p>
                        <p>Dirección: ${ estadio.address }</p>
                        <p>Teléfono: ${ estadio.telefono }</p>
                        <p>Source: <a class="links-propiedades" href="${ estadio.url }" target="_blank">${ estadio.url }</a></p>
                        <button id="cerrar-info-box">
                            <img src="./assets/botonCerrar.svg" alt="Cerrar">
                        </button>
                    `;
                         document.getElementById( "cerrar-info-box" ).addEventListener( "click", function () {
                              infoBox.style.display = "none";
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
const cargarYMostrarMarcadoresClubesYVidaNocturna = async () => {
     try {
          const response = await fetch( "https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Clubs%20%26%20Nightlife/Fiware_Entertainment_ClubsAndNightlife-00001?sp=r&st=2024-04-01T11:01:02Z&se=2090-01-01T20:01:02Z&sv=2022-11-02&sr=b&sig=aIubcMnWFTYQ1APJNRVbNJ9YrWKFtzj88SWK07H0uXc%3D" );
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
                         <img src='./assets/staticClubsAndNightlife.jpg'>
                         <p>Código identificador: ${ idWithoutPrefix }</p>
                         <p>Address: ${ streetAddress } C.P ${ postalCode }</p>
                         <p>Localización: ${ addressLocality }, ${ addressRegion }</p>
                         <p>Country: ${ addressCountry }</p>
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
// const cargarYMostrarMarcadoresHotelesYApartamentos = async () => {
//      try {
//          const response = await fetch("https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Hotels%20%26%20Apartments/Fiware_Entertainment_HotelsAndApartments-00001?sp=r&st=2024-04-01T11:17:17Z&se=2090-01-01T20:17:17Z&sv=2022-11-02&sr=b&sig=0mN50aK5H8DLUYm0eYkR8%2Bk21mHSKhJesq9VdPvH%2Bko%3D");
//          const data = await response.json();

//          data.buildings0014.forEach(item => {
//              // Verifica si la propiedad addressLocality es "Madrid"
//              if (item.address.value.addressLocality === "Madrid") {
//                  const ubicacion = item.location.value.coordinates;
//                  console.log(item);

//                  const hotelMarker = new google.maps.Marker({
//                      position: { lat: ubicacion[1], lng: ubicacion[0] },
//                      map: map,
//                      title: item.name.value,
//                      icon: "./assets/hotelsAndApartments_Qubo.svg" // Asegúrate de tener un ícono adecuado para los hoteles y apartamentos
//                  });

//                  hotelMarker.addListener('click', () => {
//                      const infoBox = document.querySelector(".info-box");
//                      infoBox.style.display = "flex";
//                      const idWithoutPrefix = item.id.replace(/^property_/, '');
//                      const capitalizedCategory = item.category.value[0].charAt(0).toUpperCase() + item.category.value[0].slice(1);
//                      infoBox.innerHTML = `
//                          <div class='nameContainer'>
//                              <p>${capitalizedCategory}</p>
//                              <p>${item.name.value}</p>
//                          </div>
//                          <img src='./assets/staticHotelsAndApartments.jpg'>
//                          <p>Código identificador: ${idWithoutPrefix}</p>
//                          <p>Address: ${item.address.value.streetAddress} C.P ${item.address.value.postalCode}</p>
//                          <p>Localización: ${item.address.value.addressLocality}, ${item.address.value.addressRegion}</p>
//                          <p>Source: <a class="links-propiedades" href="${item.source.value}" target="_blank">${item.source.value}</a></p>
//                          <button id="cerrar-info-box"><img src='./assets/botonCerrar.svg'></button>
//                          <button class='share'><img src='./assets/shareIcon.svg'></button>
//                      `;
//                      document.getElementById("cerrar-info-box").addEventListener("click", () => {
//                          infoBox.style.display = "none";
//                      });
//                  });

//                  markersHotelsAndApartments.push(hotelMarker); // Añade el marcador al array de hoteles y apartamentos
//              }
//          });
//      } catch (error) {
//          console.error("Error fetching hotels and apartments:", error);
//      }
//  };


//  const eventHotelsAndApartments = document.getElementById("hotelsAndApartments-sub-nav-item");
// let markersHotelsAndApartments = []; // Array para almacenar los marcadores de hoteles y apartamentos
// let hotelsAndApartmentsVisible = false; // Bandera para el estado de visibilidad

// eventHotelsAndApartments.addEventListener('click', async () => {
//     // Alternar la visibilidad de los marcadores de hoteles y apartamentos
//     toggleMarcadores(markersHotelsAndApartments, hotelsAndApartmentsVisible);
//     hotelsAndApartmentsVisible = !hotelsAndApartmentsVisible; // Cambia la bandera de visibilidad

//     // Si los marcadores aún no se han cargado y deben mostrarse, cargarlos y mostrarlos
//     if (markersHotelsAndApartments.length === 0 && hotelsAndApartmentsVisible) {
//         await cargarYMostrarMarcadoresHotelesYApartamentos();
//     }
// });


//! Función para mostrar SPORTS FACILITIES

function cargarMarcadoresSportsFacilities() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Sports%20Facilities/Fiware_Entertainment_SportFacilities-00001?sp=r&st=2024-06-16T17:37:10Z&se=2090-01-01T02:37:10Z&sv=2022-11-02&sr=b&sig=CqfiHAHx2l9YohnmzltaYcL1sdgpQXrUwYlGRs58C2E%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticSportsFacilities.jpg'>
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

                         markersSportsFacilities.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores de Sports Facilities:", error ) );
};
const eventSportsFacilities = document.getElementById( "sportsFacilities-sub-nav-item" );
let markersSportsFacilities = []; // Array para almacenar los marcadores de parcelas
let sportsFacilitiesVisible = false; // Bandera para el estado de visibilidad

eventSportsFacilities.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersSportsFacilities, sportsFacilitiesVisible );
     sportsFacilitiesVisible = !sportsFacilitiesVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersSportsFacilities.length === 0 && sportsFacilitiesVisible ) {
          cargarMarcadoresSportsFacilities(); // Llama a la función para cargar los marcadores de parcelas
     }
} );


//! Función para mostrar MUSEUMS

function cargarMarcadoresMuseums() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Entertainment%20%26%20Sports/Museums/Fiware_Entertainment_Musuems-00001?sp=r&st=2024-06-16T17:49:06Z&se=2090-01-01T02:49:06Z&sv=2022-11-02&sr=b&sig=j%2BMozWtJqpIgWXgEitlNgqCHWhqw9XbBGOSJ%2Fy3pkbE%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticMuseums.jpg'>
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

                         markersMuseums.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Museums:", error ) );
};
const eventMuseums = document.getElementById( "museums-sub-nav-item" );
let markersMuseums = []; // Array para almacenar los marcadores de parcelas
let museumsVisible = false; // Bandera para el estado de visibilidad

eventMuseums.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersMuseums, museumsVisible );
     museumsVisible = !museumsVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersMuseums.length === 0 && museumsVisible ) {
          cargarMarcadoresMuseums(); // Llama a la función para cargar los marcadores de parcelas
     }
} );


//* BOTÓN SERVICES ****************

//! Función para mostrar SOCIAL SERVICES

function cargarMarcadoresSocialServices() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Social%20Services/Fiware_Services_Social-00001?sp=r&st=2024-06-16T17:59:29Z&se=2090-01-01T02:59:29Z&sv=2022-11-02&sr=b&sig=oBQu3hzgqmqx2L0eRX%2FipjagbMzy8Boe4ORmVpqDZV0%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticSocialServices.jpg'>
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

                         markersSocialServices.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Social Services:", error ) );
};
const eventSocialServices = document.getElementById( "socialServices-sub-nav-item" );
let markersSocialServices = []; // Array para almacenar los marcadores de parcelas
let socialServicesVisible = false; // Bandera para el estado de visibilidad

eventSocialServices.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersSocialServices, socialServicesVisible );
     socialServicesVisible = !socialServicesVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersSocialServices.length === 0 && socialServicesVisible ) {
          cargarMarcadoresSocialServices(); // Llama a la función para cargar los marcadores de parcelas
     }
} );


//! Función para mostrar ADMINISTRATION

function cargarMarcadoresAdministration() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Administration/Fiware_Services_Administration-00001?sp=r&st=2024-06-16T18:03:33Z&se=2090-01-01T03:03:33Z&sv=2022-11-02&sr=b&sig=WwIaNf4gMfolhWsPkfUnOFOeHA9Oori3A7zGPQH5rYg%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticAdministration.jpg'>
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

                         markersAdministration.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Aministration:", error ) );
};
const eventAdministration = document.getElementById( "administration-sub-nav-item" );
let markersAdministration = []; // Array para almacenar los marcadores de parcelas
let administrationVisible = false; // Bandera para el estado de visibilidad

eventAdministration.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersAdministration, administrationVisible );
     administrationVisible = !administrationVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersAdministration.length === 0 && administrationVisible ) {
          cargarMarcadoresAdministration(); // Llama a la función para cargar los marcadores de parcelas
     }
} );

//! Función para mostrar EDUCATION

function cargarMarcadoresAdministration() {
     fetch( 'https://anpaccountdatalakegen2.blob.core.windows.net/service/Services%20%26%20Administration/Education/Fiware_Services_Education-00001?sp=r&st=2024-06-16T18:07:19Z&se=2090-01-01T03:07:19Z&sv=2022-11-02&sr=b&sig=gG6j583zzB5xorwVszx7c84zXo4bIIdsYDTJT4c%2Bz2U%3D' )
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

                         // Agrega un evento click a cada marcador para mostrar el infoBox
                         marker.addListener( "click", () => {
                              const infoBox = document.querySelector( ".info-box" );
                              infoBox.style.display = "flex";
                              infoBox.innerHTML = `
                              <div class='nameContainer'>
                                   <p>${ category }</p>
                                   <p>${ name }</p>
                              </div>
                              <img src='./assets/staticEducation.jpg'>
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

                         markersEducation.push( marker ); // Añade el marcador al array de parcelas
                    }
               } );
          } )
          .catch( error => console.error( "Error al cargar los marcadores Education:", error ) );
};
const eventEducation = document.getElementById( "education-sub-nav-item" );
let markersEducation = []; // Array para almacenar los marcadores de parcelas
let educationVisible = false; // Bandera para el estado de visibilidad

eventEducation.addEventListener( "click", () => {
     // Alternar la visibilidad de los marcadores de parcelas
     toggleMarcadores( markersEducation, educationVisible );
     educationVisible = !educationVisible; // Cambia la bandera de visibilidad

     // Si los marcadores aún no se han cargado, cargarlos
     if ( markersEducation.length === 0 && educationVisible ) {
          cargarMarcadoresAdministration(); // Llama a la función para cargar los marcadores de parcelas
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
