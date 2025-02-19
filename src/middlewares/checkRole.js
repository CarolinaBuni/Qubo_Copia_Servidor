const { verifyToken } = require( "../utils/jwt" );
const User = require( "../api/models/user" );

const checkRole = async ( req, res, next ) => {
     try {
          // 1. Obtener el token del header
          const token = req.headers.authorization?.split( ' ' )[ 1 ];
          if ( !token ) {
               return res.status( 401 ).json( { message: 'No token provided' } );
          }

          // 2. Verificar el token
          const verification = verifyToken( token );
          if ( !verification.success ) {
               return res.status( 401 ).json( { message: 'Token inválido' } );
          }

          // 3. Obtener email del token
          const userEmail = verification.data.email;

          // 4. Buscar usuario y roles
          const user = await User.findOne( { email: userEmail } );
          if ( !user ) {
               return res.status( 401 ).json( { message: 'Usuario no autorizado' } );
          }

          // 5. Guardar rol en el request para uso posterior
          req.userRole = user.role;
          next();
     } catch ( error ) {
          console.error( 'Error en checkRole:', error );
          res.status( 500 ).json( { message: 'Error verificando permisos' } );
     }
};

module.exports = checkRole;