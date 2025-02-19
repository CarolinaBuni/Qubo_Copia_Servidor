const jwt = require( "jsonwebtoken" );

const verifyToken = ( token ) => {
     try {
          const decoded = jwt.verify( token, process.env.AUTH0_SECRET );
          return {
               success: true,
               data: decoded
          };
     } catch ( error ) {
          console.error('Error verificando token:', error);
          return {
               success: false,
               error: error.message
          };
     }
};

module.exports = { verifyToken };