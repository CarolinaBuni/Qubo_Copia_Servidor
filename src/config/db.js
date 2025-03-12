//* db.js en APP2

const mongoose = require( 'mongoose' );

const connectDB = async () => {
     try {
          await mongoose.connect( process.env.DB_URL );
          console.log( "Conectado correctamente a la BBDD" );
     } catch ( error ) {
          console.log( "Error al conectarse con la BBDD" );
     }
};

// Conexión a la base de datos de AUTENTICACIÓN
const authDB = mongoose.createConnection( process.env.AUTH_MONGODB_URL );

// Añadir más logs para debug
authDB.on( 'connected', () => {
     console.log( '✅ Conexión exitosa a la base de datos de autenticación' );
} );

authDB.on( 'error', ( err ) => {
     console.error( '❌ Error conectando a la base de datos de autenticación:', err );
} );

authDB.on( 'disconnected', () => {
     console.log( '❌ Desconectado de la base de datos de autenticación' );
} );


module.exports = { connectDB, authDB };