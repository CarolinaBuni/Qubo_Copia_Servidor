require( 'dotenv' ).config();
const User = require( './api/models/user' );
const { authDB } = require( './config/db' );


async function testUserModel() {
     try {
          await new Promise( resolve => authDB.on( 'connected', resolve ) );

          console.log( '🔍 Buscando usuarios...' );

          // Listar todas las colecciones en la base de datos
          const collections = await authDB.db.listCollections().toArray();
          console.log( 'Colecciones disponibles:', collections.map( c => c.name ) );

          // Buscar un usuario específico
          const user = await User.findOne( { email: "ineslopezjuan1@gmail.com" } );
          console.log( 'Usuario encontrado:', user );

          // Buscar todos los usuarios
          const allUsers = await User.find();
          console.log( 'Total usuarios:', allUsers.length );
          console.log( 'Roles de usuarios:', allUsers.map( u => ( { email: u.email, roles: u.role } ) ) );

     } catch ( error ) {
          console.error( '❌ Error:', error );
     } finally {
          await authDB.close();
     }
}

// Ejecutar la prueba
testUserModel();