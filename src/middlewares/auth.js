// // auth.js
// const { verifyToken } = require('../utils/jwt')

// const isAuth = (req, res, next) => {
//     console.log("Middleware isAuth ejecutado");

//     // Verifica que la cookie esté presente
//     const token = req.cookies.access_token;  // Recupera el token de la cookie 'access_token'
//     console.log("Token desde la cookie:", token);  // Verifica si el token llega correctamente

//     if (!token) {
//         console.log("No se encontró el token en las cookies");
//         return res.redirect("/error");  // Redirige a la página de error si el token no existe
//     }

//     // Verificación del token
//     const result = verifyToken(token); // Verifica el token con la función que ya tienes en jwt.js

//     if (!result.success) {
//         console.error("Token inválido:", result.error);
//         return res.redirect("/error");  // Redirige a la página de error si el token no es válido
//     }

//     req.user = result.data; // Guarda los datos del usuario en el request
//     console.log("Usuario autenticado:", req.user);  // Verifica si los datos del usuario son correctos

//     next();  // Continúa con la siguiente función si el token es válido
// };


// module.exports = isAuth;

const { verifyToken } = require('../utils/jwt');
const User = require('../api/models/user');

const isAuth = async (req, res, next) => {
    try {
        console.log("🔒 Middleware isAuth ejecutado");

        // 1. Verificar que existe el token en las cookies
        const token = req.cookies.access_token;
        console.log("🎟️ Token desde la cookie:", token);

        if (!token) {
            console.log("❌ No se encontró el token en las cookies");
            return res.redirect("/login?error=no_token");
        }

        // 2. Verificar el token
        const result = verifyToken(token);

        if (!result.success) {
            console.error("❌ Token inválido:", result.error);
            return res.redirect("/login?error=token_invalido");
        }

        // 3. Guardar datos del token en el request
        req.user = result.data;
        console.log("👤 Usuario del token:", req.user);

        // 4. Buscar el usuario en la base de datos de autenticación
        const dbUser = await User.findOne({ 
            user_id: req.user.sub  // Buscar por el ID de Auth0
        });

        if (!dbUser) {
            console.log('❌ Usuario no encontrado en la base de datos');
            return res.redirect("/login?error=usuario_no_encontrado");
        }

        // 5. Añadir información de la base de datos al request
        req.dbUser = dbUser;
        console.log('✅ Usuario autenticado:', {
            email: dbUser.email,
            roles: dbUser.rol,
            modules: dbUser.modules
        });

        // 6. Continuar con la siguiente función
        next();

    } catch (error) {
        console.error('❌ Error en autenticación:', error);
        return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
};

// Middleware para verificar roles específicos

// const isAuth = async (req, res, next) => {
//     try {
//         console.log("🔒 Middleware isAuth ejecutado");

//         // 🔥 Agregar logs para depuración
//         console.log("📢 Cookies en `app2`:", req.cookies);

//         const token = req.cookies.access_token;
//         console.log("🎟️ Token desde la cookie en `app2`:", token);

//         if (!token) {
//             console.log("❌ No se encontró el token en las cookies");
//             return res.redirect("/login?error=no_token");
//         }

//         // Verificar el token
//         const result = verifyToken(token);

//         if (!result.success) {
//             console.error("❌ Token inválido:", result.error);
//             return res.redirect("/login?error=token_invalido");
//         }

//         req.user = result.data;
//         console.log("👤 Usuario autenticado:", req.user);

//         next(); // Si todo está bien, continúa
//     } catch (error) {
//         console.error('❌ Error en autenticación:', error);
//         return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
//     }
// };




const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.dbUser || !req.dbUser.rol) {
            console.log('❌ Usuario sin roles definidos');
            return res.redirect("/login");
        }

        const hasAllowedRole = req.dbUser.rol.some(role => 
            allowedRoles.includes(role)
        );

        if (!hasAllowedRole) {
            console.log('❌ Usuario no tiene los roles necesarios');
            return res.redirect("/login");
        }

        next();
    };
};

// Middleware para verificar acceso a módulos específicos
const hasModule = (requiredModules) => {
    return (req, res, next) => {
        if (!req.dbUser || !req.dbUser.modules) {
            console.log('❌ Usuario sin módulos definidos');
            return res.redirect("/error");
        }

        const hasRequiredModule = req.dbUser.modules.some(module => 
            requiredModules.includes(module)
        );

        if (!hasRequiredModule) {
            console.log('❌ Usuario no tiene acceso al módulo requerido');
            return res.redirect("/login");
        }

        next();
    };
};

module.exports = { isAuth, hasRole, hasModule };




