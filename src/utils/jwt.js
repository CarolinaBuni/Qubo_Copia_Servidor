// // jwt.js
// const jwt = require( "jsonwebtoken" );


// const verifyToken = ( token ) => {
//      try {
//           const decoded = jwt.verify( token, process.env.AUTH0_SECRET );
//           return {
//                success: true,
//                data: decoded
//           };
//      } catch ( error ) {
//           console.error('Error verificando token:', error);
//           return {
//                success: false,
//                error: error.message
//           };
//      }
// };

// module.exports = { verifyToken };

const jwt = require("jsonwebtoken");

// Función para verificar el token usando la clave secreta de la otra aplicación (HS256)
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificación usando la clave secreta de Auth0
    return { success: true, data: decoded };
  } catch (error) {
    console.error("Error verificando token:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { verifyToken };


