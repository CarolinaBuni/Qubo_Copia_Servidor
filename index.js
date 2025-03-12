

// require( "dotenv" ).config();
// const express = require( "express" );
// const path = require( "path" );
// const cookieParser = require( "cookie-parser" );
// const app = express();
// const cors = require( "cors" );
// const { connectDB } = require( "./src/config/db" );
// const router = require( "./src/utils/apiRpoutes" );
// const { isAuth } = require( "./src/middlewares/auth" );
// const cloudinary = require( "cloudinary" ).v2;
// const QUBO_ICONS = require( "./src/constants/cloudinaryUrls" );

// // Conectar a la base de datos
// connectDB();

// // Configuración básica
// app.use( cookieParser() );
// app.use( express.json() );
// app.use( cors( {
//    origin: "https://sign-in-qubo-git-verceldeployment-inesljs-projects.vercel.app",
//    credentials: true,
//    methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
//    allowedHeaders: [ 'Content-Type', 'Authorization', 'Cookie' ],
// } ) );

// // Configuración de Cloudinary
// cloudinary.config( {
//    cloud_name: process.env.CLOUD_NAME,
//    api_key: process.env.API_KEY,
//    api_secret: process.env.API_SECRET,
// } );

// // Ruta de login (sin protección)
// app.get( "/login", ( req, res ) => {
//    res.sendFile( path.join( __dirname, "public", "login.html" ) );
// } );

// // 🔥 Middleware para verificar la cookie antes de permitir el acceso
// app.use( ( req, res, next ) => {
//    console.log( "🔍 Cookies recibidas en app2:", req.cookies );

//    const token = req.cookies.access_token;
//    console.log( "🎟️ Token en app2:", token );

//    if ( !token ) {
//       console.error( "🚫 No se encontró el token en la cookie" );
//       return res.redirect( '/login?error=no_token' ); // Redirige si no hay token
//    }

//    next(); // Si hay token, sigue a `isAuth`
// } );

// // Proteger todas las rutas excepto login y assets
// app.use( ( req, res, next ) => {
//    if ( req.path.includes( '.css' ) ||
//       req.path.includes( '.js' ) ||
//       req.path.includes( '.svg' ) ||
//       req.path.includes( '.ico' ) ||
//       req.path === '/login' ) {
//       return next();
//    }
//    isAuth( req, res, next );
//    next();
// } );

// // Servir archivos estáticos DESPUÉS de la autenticación
// app.use( express.static( path.join( __dirname, "public" ) ) );

// // 🔥 Ruta protegida para el mapa
// app.get( "/", ( req, res ) => {
//    res.sendFile( path.join( __dirname, "public", "index.html" ) );
// } );

// // 🔥 Verificar `JWT_SECRET` en `app2`
// console.log( "🔑 JWT_SECRET en app2:", process.env.JWT_SECRET );

// // Rutas de la API
// app.get( "/api/qubo-icons", ( req, res ) => {
//    res.json( QUBO_ICONS );
// } );

// app.get( "/api/proxy", async ( req, res ) => {
//    const targetUrl = req.query.url;
//    try {
//       const response = await fetch( targetUrl );
//       const contentType = response.headers.get( "content-type" );
//       res.setHeader( "Access-Control-Allow-Origin", "*" );
//       res.setHeader( "Access-Control-Allow-Methods", "GET, OPTIONS" );
//       res.setHeader( "Access-Control-Allow-Headers", "Content-Type" );
//       if ( contentType ) {
//          res.setHeader( "Content-Type", contentType );
//       }
//       if ( contentType && contentType.includes( "application/json" ) ) {
//          const data = await response.json();
//          res.json( data );
//       } else {
//          const data = await response.text();
//          res.send( data );
//       }
//    } catch ( error ) {
//       console.error( "Error en el proxy:", error );
//       res.status( 500 ).send( { error: "Error al cargar el recurso." } );
//    }
// } );

// app.use( "/api/v1/", router );

// // Iniciar servidor
// app.listen( 3000, () => {
//    console.log( "Servidor escuchando en http://localhost:3000" );
// } );
//* index.js en APP2
require( "dotenv" ).config();
const express = require( "express" );
const path = require( "path" );
const cookieParser = require( "cookie-parser" );
const app = express();
const cors = require( "cors" );
const mongoose = require( "mongoose" );
const { connectDB } = require( "./src/config/db" );
const router = require( "./src/utils/apiRpoutes" );
const { isAuth } = require( "./src/middlewares/auth" );
const cloudinary = require( "cloudinary" ).v2;
const QUBO_ICONS = require( "./src/constants/cloudinaryUrls" );
const Session = require( "./src/api/models/session" );


// Conectar a la base de datos
connectDB();

// Middleware básico
app.use( express.static( path.join( __dirname, "public" ) ) );
app.use( cookieParser() );
app.use( express.json() );

// Configuración de CORS
app.use( cors( {
   origin: "https://sign-in-qubo-git-verceldeployment-inesljs-projects.vercel.app",
   credentials: true,
   methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ],
   allowedHeaders: [ 'Content-Type', 'Authorization', 'Cookie' ]
} ) );

// Configuración de Cloudinary
cloudinary.config( {
   cloud_name: process.env.CLOUD_NAME,
   api_key: process.env.API_KEY,
   api_secret: process.env.API_SECRET,
} );

// Ruta específica para manejar el sessionId
app.get("/auth/session", async (req, res) => {
   console.log("📍 Procesando sessionId");
   console.log("🔍 Query params recibidos:", req.query);
   
   try {
       const { sessionId } = req.query;
       if (!sessionId) {
           console.log("❌ No se proporcionó sessionId");
           return res.status(400).json({ error: 'No sessionId provided' });
       }

       
        // Modificamos esta parte para no usar mongoose directamente
        console.log("🔍 Buscando sesión con ID:", sessionId);

       console.log("🔍 Buscando sesión:", sessionId);
       const session = await Session.findById(sessionId);
       
       if (session && session.token) {
           console.log("✅ Sesión encontrada para userId:", session.userId);
           res.cookie('access_token', session.token, {
               httpOnly: true,
               secure: true,
               sameSite: 'Lax',
               maxAge: 3600000 // 1 hora
           });
           return res.json({ 
               success: true, 
               userId: session.userId 
           });
       } else {
           console.log("❌ Sesión no encontrada o token no válido");
           return res.status(404).json({ error: 'Invalid session' });
       }
   } catch (error) {
       console.error("❌ Error al procesar sessionId:", error);
       if (error.name === 'CastError') {
           return res.status(400).json({ error: 'Invalid session ID format' });
       }
       return res.status(500).json({ error: 'Error processing session' });
   }
});

// Servir archivos estáticos y proteger rutas
app.get( "/", ( req, res ) => {
   res.sendFile( path.join( __dirname, "public", "index.html" ) );
} );

app.get( "/login", ( req, res ) => {
   res.sendFile( path.join( __dirname, "public", "login.html" ) );
} );

// Middleware de autenticación para rutas protegidas
app.use( ( req, res, next ) => {
   if ( req.path.includes( '.css' ) ||
      req.path.includes( '.js' ) ||
      req.path.includes( '.svg' ) ||
      req.path.includes( '.ico' ) ||
      req.path === '/login' ) {
      return next();
   }
   isAuth( req, res, next );
} );

// Proxy para Cloudinary
app.get( "/proxy-image", async ( req, res ) => {
   try {
      const imageUrl = req.query.url;
      if ( !imageUrl ) {
         return res.status( 400 ).send( { error: "URL no proporcionada" } );
      }

      if ( QUBO_ICONS[ imageUrl ] ) {
         const data = await cloudinary.uploader.explicit( QUBO_ICONS[ imageUrl ], {
            type: "authenticated",
            resource_type: "image",
         } );
         res.send( data );
      }
   } catch ( error ) {
      console.error( "Error en el proxy:", error );
      res.status( 500 ).send( { error: "Error al cargar el recurso." } );
   }
} );

// Rutas de la API
app.use( "/api/v1/", router );

// Manejo de errores global
app.use( ( err, req, res, next ) => {
   console.error( 'Error global:', err );
   res.status( 500 ).json( {
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
   } );
} );

// Iniciar servidor
app.listen( 3000, () => {
   console.log( "Servidor escuchando en http://localhost:3000" );
} );