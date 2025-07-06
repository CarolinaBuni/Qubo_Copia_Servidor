
//* index.js en APP2
require( "dotenv" ).config();
const express = require( "express" );
const path = require( "path" );
const cookieParser = require( "cookie-parser" );
const app = express();
const cors = require( "cors" );
// const mongoose = require( "mongoose" );
const { MongoClient, ObjectId } = require( 'mongodb' );
const { connectDB } = require( "./src/config/db" );
const router = require( "./src/utils/apiRpoutes" );
const { isAuth } = require( "./src/middlewares/auth" );
const cloudinary = require( "cloudinary" ).v2;
const QUBO_ICONS = require( "./src/constants/cloudinaryUrls" );
// const Session = require( "./src/api/models/session" );


// Conectar a la base de datos
connectDB();

// Middleware básico - EXCLUIR index.html para procesarlo manualmente
app.use( express.static( path.join( __dirname, "public" ), {
   index: false  // No servir index.html automáticamente
} ) );
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

// Servir el HTML principal con la API key inyectada (ANTES de cualquier middleware)
app.get( "/", ( req, res ) => {
   console.log('🚀🚀🚀 ENTRANDO EN LA RUTA / PERSONALIZADA 🚀🚀🚀');
   console.log('📍 Método:', req.method, 'Ruta:', req.path, 'URL:', req.url);
   
   // Verificar si hay token de autenticación
   const token = req.cookies.access_token;
   console.log('🔐 Token presente:', !!token);
   
   const fs = require('fs');
   const htmlPath = path.join( __dirname, "public", "index.html" );
   
   console.log('🔑 Variable de entorno GOOGLE_MAPS_API_KEY_1:', process.env.GOOGLE_MAPS_API_KEY_1?.substring(0, 20) + '...');
   
   try {
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Reemplazar el placeholder con la API key real
      const apiKey = process.env.GOOGLE_MAPS_API_KEY_1;
      htmlContent = htmlContent.replace('{{GOOGLE_MAPS_API_KEY}}', apiKey);
      
      // Inyectar el estado de autenticación en el HTML
      const isAuthenticated = !!token;
      htmlContent = htmlContent.replace('{{IS_AUTHENTICATED}}', isAuthenticated.toString());
      
      console.log('✅ Reemplazo realizado. ¿Contiene placeholder?', htmlContent.includes('{{GOOGLE_MAPS_API_KEY}}'));
      console.log('🔐 Estado de autenticación inyectado:', isAuthenticated);
      
      res.send(htmlContent);
   } catch (error) {
      console.error('❌ Error al leer/procesar HTML:', error);
      res.status(500).send('Error interno del servidor');
   }
} );

// Añadir aquí la ruta del proxy para Azure
app.get( "/api/proxy", async ( req, res ) => {
   try {
      const url = req.query.url;
      // console.log( "🔄 Proxy recibiendo petición para:", url );

      const response = await fetch( url, {
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
         }
      } );

      if ( !response.ok ) {
         // console.error( "❌ Error en proxy:", response.status );
         throw new Error( `HTTP error! status: ${ response.status }` );
      }

      const data = await response.json();
      console.log( "✅ Datos recibidos correctamente de Azure" );
      res.json( data );
   } catch ( error ) {
      console.error( "❌ Error en el proxy:", error );
      res.status( 500 ).json( { error: "Error al cargar el recurso" } );
   }
} );

app.get( "/auth/session", async ( req, res ) => {
   console.log( "📍 Procesando sessionId" );
   // console.log( "🔍 Query params recibidos:", req.query );

   let client;
   try {
      const { sessionId } = req.query;
      if ( !sessionId ) {
         console.log( "❌ No se proporcionó sessionId" );
         return res.status( 400 ).json( { error: 'No sessionId provided' } );
      }

      client = new MongoClient( process.env.AUTH_MONGODB_URL );
      await client.connect();

      const db = client.db( 'QuboUsers' );
      const session = await db.collection( 'Sessions' )
         .findOne( { _id: new ObjectId( sessionId ) } );

      console.log( "📝 Sesión encontrada:", session ? "Sí" : "No" );

      if ( session && session.token ) {
         // Modificamos cómo establecemos la cookie
         res.cookie( 'access_token', session.token, {
            httpOnly: false,  // Cambiado a false para poder acceder desde JS
            secure: true,
            sameSite: 'none',  // Importante para CORS
            path: '/',         // Aseguramos que la cookie está disponible en toda la app
            maxAge: 3600000    // 1 hora
         } );

         // console.log( "🍪 Cookie establecida:", {
         //    token: session.token.substring( 0, 20 ) + '...',  // Log parcial del token
         //    options: {
         //       httpOnly: false,
         //       secure: true,
         //       sameSite: 'none',
         //       path: '/',
         //       maxAge: 3600000
         //    }
         // } );

         return res.json( {
            success: true,
            userId: session.userId,
            authenticated: true
         } );
      } else {
         console.log( "❌ Sesión no encontrada o sin token" );
         return res.status( 401 ).json( {
            error: 'Invalid session',
            authenticated: false
         } );
      }
   } catch ( error ) {
      console.error( "❌ Error:", error );
      return res.status( 500 ).json( { error: 'Error processing session' } );
   } finally {
      if ( client ) await client.close();
   }
} );

// Middleware de autenticación para rutas protegidas
app.use( ( req, res, next ) => {
   console.log('🔍 MIDDLEWARE GENERAL - Ruta:', req.path);
   
   // Excluir archivos estáticos y la ruta principal
   if ( req.path === '/' ||
      req.path.includes( '.css' ) ||
      req.path.includes( '.js' ) ||
      req.path.includes( '.svg' ) ||
      req.path.includes( '.ico' ) ) {
      console.log('⚡ EXCLUIDA - Pasando al siguiente middleware');
      return next();
   }
   
   console.log('🔒 EJECUTANDO isAuth para:', req.path);
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