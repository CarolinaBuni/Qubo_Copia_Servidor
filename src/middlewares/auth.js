//* auth.js en APP2

// const { verifyToken } = require('../utils/jwt');
// const User = require('../api/models/user');
// const Session = require('../api/models/session');

// const isAuth = async (req, res, next) => {
//     try {
//         console.log("🔒 Middleware isAuth ejecutado");

//         // 1. Si hay sessionId en la URL, buscar la sesión y establecer cookie
//         if (req.query.sessionId) {
//             console.log("🔍 Buscando sesión:", req.query.sessionId);
//             const session = await Session.findById(req.query.sessionId);
            
//             if (session) {
//                 console.log("✅ Sesión encontrada, estableciendo cookie");
//                 res.cookie('access_token', session.token, {
//                     httpOnly: true,
//                     secure: true,
//                     sameSite: 'Strict',
//                     maxAge: 3600000 // 1 hora
//                 });
//                 return res.redirect('/'); // Redirigir para limpiar URL
//             }
//         }

//         // 2. Verificar token en cookie
//         const token = req.cookies.access_token;
//         console.log("🎟️ Token desde la cookie:", token);

//         if (!token) {
//             console.log("❌ No se encontró el token");
//             return res.redirect("/login?error=no_token");
//         }

//         // 3. Verificar el token
//         const result = verifyToken(token);
//         if (!result.success) {
//             console.error("❌ Token inválido:", result.error);
//             return res.redirect("/login?error=token_invalido");
//         }

//         // 4. Guardar datos del token en el request
//         req.user = result.data;
//         console.log("👤 Usuario del token:", req.user);

//         // 5. Buscar el usuario en la base de datos
//         const dbUser = await User.findOne({ 
//             user_id: req.user.sub
//         });

//         if (!dbUser) {
//             console.log('❌ Usuario no encontrado en la base de datos');
//             return res.redirect("/login?error=usuario_no_encontrado");
//         }

//         // 6. Añadir información de la base de datos al request
//         req.dbUser = dbUser;
//         console.log('✅ Usuario autenticado:', {
//             email: dbUser.email,
//             roles: dbUser.rol,
//             modules: dbUser.modules
//         });

//         next();

//     } catch (error) {
//         console.error('❌ Error en autenticación:', error);
//         return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
//     }
// };

// module.exports = { isAuth };

const { verifyToken } = require('../utils/jwt');
const User = require('../api/models/user');

const isAuth = async (req, res, next) => {
    try {
        console.log("🔒 Middleware isAuth ejecutado");

        // 1. Verificar token en cookie
        const token = req.cookies.access_token;
        console.log("🎟️ Token desde la cookie:", token);

        if (!token) {
            console.log("❌ No se encontró el token");
            return res.status(401).json({ error: 'No token provided' });
        }

        // 2. Verificar el token
        const result = verifyToken(token);
        if (!result.success) {
            console.error("❌ Token inválido:", result.error);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // 3. Guardar datos del token en el request
        req.user = result.data;
        console.log("👤 Usuario del token:", req.user);

        // 4. Buscar el usuario en la base de datos
        const dbUser = await User.findOne({ 
            user_id: req.user.sub
        });

        if (!dbUser) {
            console.log('❌ Usuario no encontrado en la base de datos');
            return res.status(401).json({ error: 'User not found' });
        }

        // 5. Añadir información de la base de datos al request
        req.dbUser = dbUser;
        console.log('✅ Usuario autenticado:', {
            email: dbUser.email,
            roles: dbUser.rol,
            modules: dbUser.modules
        });

        next();

    } catch (error) {
        console.error('❌ Error en autenticación:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = { isAuth };
//*
// const { verifyToken } = require('../utils/jwt');
// const User = require('../api/models/user');

// const isAuth = async (req, res, next) => {
//     try {
//         console.log("🔒 Middleware isAuth ejecutado");

//         // 1. Verificar que existe el token en las cookies
//         const token = req.cookies.access_token;
//         console.log("🎟️ Token desde la cookie:", token);

//         if (!token) {
//             console.log("❌ No se encontró el token en las cookies");
//             return res.redirect("/login?error=no_token");
//         }

//         // 2. Verificar el token
//         const result = verifyToken(token);

//         if (!result.success) {
//             console.error("❌ Token inválido:", result.error);
//             return res.redirect("/login?error=token_invalido");
//         }

//         // 3. Guardar datos del token en el request
//         req.user = result.data;
//         console.log("👤 Usuario del token:", req.user);

//         // 4. Buscar el usuario en la base de datos de autenticación
//         const dbUser = await User.findOne({ 
//             user_id: req.user.sub  // Buscar por el ID de Auth0
//         });

//         if (!dbUser) {
//             console.log('❌ Usuario no encontrado en la base de datos');
//             return res.redirect("/login?error=usuario_no_encontrado");
//         }

//         // 5. Añadir información de la base de datos al request
//         req.dbUser = dbUser;
//         console.log('✅ Usuario autenticado:', {
//             email: dbUser.email,
//             roles: dbUser.rol,
//             modules: dbUser.modules
//         });

//         // 6. Continuar con la siguiente función
//         next();

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




