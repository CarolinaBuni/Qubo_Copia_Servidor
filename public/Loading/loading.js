// Función principal para gestionar la pantalla de carga
// Al inicio del archivo
(function preloadCloudinaryImages() {
     const imageUrls = [
         'https://res.cloudinary.com/dafjggs2p/image/upload/v1742076755/qubo/loading_images/loading1_nprixm.jpg',
         'https://res.cloudinary.com/dafjggs2p/image/upload/v1742076754/qubo/loading_images/loading2_t6jf5w.jpg'
     ];
     
     imageUrls.forEach(url => {
         const img = new Image();
         img.src = url;
     });
 })();

function initLoading() {
      // Contenedor de fondo y loading ya existen en el HTML
    const backgroundContainer = document.getElementById('background-container');
    // Asegurarse de que el loading sea visible inmediatamente
    const loadingContainer = document.querySelector('.loading-container');
    if (loadingContainer) {
        loadingContainer.style.opacity = '1';
        loadingContainer.style.backgroundColor = 'rgba(0, 0, 0, 1)';
    }
    
     // Array con todos los fondos posibles
     const backgrounds = [
          { type: 'video', src: 'https://res.cloudinary.com/dafjggs2p/video/upload/v1742076778/qubo/loading_images/stars_jrzq4c.mp4', id: 'stars1' },
          { type: 'video', src: 'https://res.cloudinary.com/dafjggs2p/video/upload/v1742077293/qubo/loading_images/stars1_bhzugj.mp4', id: 'stars2' },
          { type: 'video', src: 'https://res.cloudinary.com/dafjggs2p/video/upload/v1742076774/qubo/loading_images/stars3_unfeli.mp4', id: 'stars3' },
          { type: 'image', src: 'https://res.cloudinary.com/dafjggs2p/image/upload/v1742076755/qubo/loading_images/loading1_nprixm.jpg', id: 'img1' },
          { type: 'image', src: 'https://res.cloudinary.com/dafjggs2p/image/upload/v1742076754/qubo/loading_images/loading2_t6jf5w.jpg', id: 'img2' }
      ];

     // Función para seleccionar el próximo fondo de manera justa
     function selectNextBackground() {
          let history = [];
          try {
               const savedHistory = localStorage.getItem( 'backgroundHistory' );
               if ( savedHistory ) {
                    history = JSON.parse( savedHistory );
               }
          } catch ( e ) {
               console.error( 'Error al leer el historial:', e );
               history = [];
          }

          const lastBackgroundId = history.length > 0 ? history[ history.length - 1 ] : null;

          if ( history.length >= backgrounds.length ) {
               history = history.slice( -1 );
          }

          const availableBackgrounds = backgrounds.filter( bg => !history.includes( bg.id ) );

          if ( availableBackgrounds.length === 0 ) {
               const allExceptLast = backgrounds.filter( bg => bg.id !== lastBackgroundId );
               return selectRandomFrom( allExceptLast );
          }

          const selected = selectRandomFrom( availableBackgrounds );

          history.push( selected.id );
          try {
               localStorage.setItem( 'backgroundHistory', JSON.stringify( history ) );
          } catch ( e ) {
               console.error( 'Error al guardar el historial:', e );
          }

          return selected;
     }

     // Función para seleccionar aleatoriamente de un array
     function selectRandomFrom( array ) {
          const randomIndex = Math.floor( Math.random() * array.length );
          return array[ randomIndex ];
     }

     // Seleccionar el próximo fondo
     const selectedBackground = selectNextBackground();
     console.log( 'Fondo seleccionado:', selectedBackground.id );

     // Función para mostrar el contenedor de carga cuando todo esté listo
     function showLoadingContainer() {
          setTimeout( () => {
               loadingContainer.classList.add( 'ready' );
          }, 50 );
     }

     // Crear el elemento según el tipo
     if ( selectedBackground.type === 'video' ) {
          const video = document.createElement( 'video' );
          video.className = 'video-background';
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;

          const source = document.createElement( 'source' );
          source.src = selectedBackground.src;
          source.type = 'video/mp4';
          video.appendChild( source );

          video.onerror = function () {
               console.error( 'Error al cargar el video:', selectedBackground.src );
               backgroundContainer.style.backgroundColor = '#000000';
               showLoadingContainer();
          };

          video.addEventListener( 'loadeddata', function () {
               console.log( 'Video cargado correctamente' );
               showLoadingContainer();
          } );

          backgroundContainer.appendChild( video );
          window.mediaElement = video;

          setTimeout( () => {
               if ( !loadingContainer.classList.contains( 'ready' ) ) {
                    console.log( 'Mostrando por timeout (video)' );
                    showLoadingContainer();
               }
          }, 1000 );
     } else {
          const img = new Image();
          img.src = selectedBackground.src;

          img.onload = function () {
               console.log( 'Imagen cargada correctamente' );

               const visibleImg = document.createElement( 'img' );
               visibleImg.className = 'image-background';
               visibleImg.src = selectedBackground.src;
               visibleImg.alt = 'Background';

               backgroundContainer.appendChild( visibleImg );
               window.mediaElement = visibleImg;

               showLoadingContainer();
          };

          img.onerror = function () {
               console.error( 'Error al cargar la imagen:', selectedBackground.src );
               backgroundContainer.style.backgroundColor = '#000000';
               showLoadingContainer();
          };

          setTimeout( () => {
               if ( !loadingContainer.classList.contains( 'ready' ) ) {
                    console.log( 'Mostrando por timeout (imagen)' );

                    const visibleImg = document.createElement( 'img' );
                    visibleImg.className = 'image-background';
                    visibleImg.src = selectedBackground.src;
                    visibleImg.alt = 'Background';

                    backgroundContainer.appendChild( visibleImg );
                    window.mediaElement = visibleImg;

                    showLoadingContainer();
               }
          }, 1000 );
     }

     // Resto del código para la animación de carga
     const progressFill = document.querySelector( '.progress-fill' );
     const loadingText = document.querySelector( '.loading-text' );
     const loadingBox = document.querySelector( '.loading-box' );
     const mapContainer = document.getElementById( 'gmp-map' );
     const statusItems = document.querySelectorAll( '.loading-status' );

     let progress = 0;
     const interval = setInterval( () => {
          progress += Math.random() * 15;
          if ( progress >= 100 ) {
               progress = 100;
               clearInterval( interval );

               // Cambiar todos los estados a completado
               statusItems.forEach( item => {
                    item.textContent = "✓";
                    item.classList.remove( 'loading', 'waiting' );
               } );

               loadingText.textContent = "¡Mapa listo!";

               // Transición más suave para ocultar la pantalla de carga
               setTimeout( () => {
                    // Primero hacemos que el loading box se desvanezca hacia arriba
                    loadingBox.style.animation = "fadeOutUp 0.8s ease forwards";

                    // Después de un breve retraso, comenzamos a desvanecer el fondo
                    setTimeout( () => {
                         // Preparamos el mapa para aparecer
                         mapContainer.style.display = "block";

                         // Después de un pequeño retraso para que el display:block tome efecto
                         setTimeout( () => {
                              // Hacemos que el mapa aparezca gradualmente
                              mapContainer.style.opacity = "1";

                              // Desvanecemos el contenedor de carga
                              loadingContainer.style.opacity = "0";

                              // Finalmente, después de que todas las animaciones terminen, ocultamos el contenedor
                              setTimeout( () => {
                                   loadingContainer.style.display = "none";

                                   // Pausar el video si es un video
                                   if ( window.mediaElement && window.mediaElement.tagName === 'VIDEO' ) {
                                        window.mediaElement.pause();
                                   }
                              }, 1000 );
                         }, 50 );
                    }, 400 );
               }, 800 );
          }

          progressFill.style.width = `${ progress }%`;
     }, 200 );

     return {
          finishLoading: function() {
              progress = 100;
              
              // Cambiar todos los estados a completado
              statusItems.forEach(item => {
                  item.textContent = "✓";
                  item.classList.remove('loading', 'waiting');
              });
              
              loadingText.textContent = "¡Mapa listo!";
              
              // Transición para ocultar el loading
              setTimeout(() => {
                  // Primero hacemos que el loading box se desvanezca hacia arriba
                  loadingBox.style.animation = "fadeOutUp 0.8s ease forwards";
                  
                  setTimeout(() => {
                      // Preparamos el mapa para aparecer
                      mapContainer.style.display = "block";
                      
                      setTimeout(() => {
                          // Hacemos que el mapa aparezca gradualmente
                          mapContainer.style.opacity = "1";
                          
                          // Desvanecemos el contenedor de carga
                          loadingContainer.style.opacity = "0";
                          
                          // Finalmente, después de que todas las animaciones terminen
                          setTimeout(() => {
                              loadingContainer.style.display = "none";
                              
                              // Mostrar el resto del contenido de la página
                              document.querySelectorAll('body > *:not(.loading-container)').forEach(el => {
                                  el.style.visibility = 'visible';
                              });
                              
                              // Pausar el video si es un video
                              if (window.mediaElement && window.mediaElement.tagName === 'VIDEO') {
                                  window.mediaElement.pause();
                              }
                          }, 1000);
                      }, 50);
                  }, 400);
              }, 800);
          }
      };
}

// Exportar la función para que sea accesible desde app.js
window.initLoading = initLoading;