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

require( "dotenv" ).config();
const { verifyToken } = require('../utils/jwt');
const User = require('../api/models/user');
const { MongoClient } = require('mongodb');


const isAuth = async (req, res, next) => {
    let client;
    try {
        console.log("\n🔒 === Inicio Auth Middleware ===");
        console.log("🌐 Ruta solicitada:", req.path);
        
        // Definir rutas que solo necesitan token
        const tokenOnlyPaths = ['/qubo', '/qubo/icons', '/icons'];
        const isTokenOnlyRoute = tokenOnlyPaths.some(path => 
            req.path.endsWith(path)  // Comprueba si la ruta termina con alguno de los paths
        );
        
        console.log("🔓 ¿Solo verificar token?", isTokenOnlyRoute, "para ruta", req.path);

        // Verificar token
        const tokenHeader = req.headers.authorization?.split(' ')[1];
        const token = req.cookies.access_token || tokenHeader;
        
        if (!token) {
            console.log("❌ No hay token");
            return res.status(401).json({ error: 'No token provided' });
        }

        const result = verifyToken(token);
        
        if (!result.success) {
            console.error("❌ Token inválido");
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = result.data;
        
        // Si es ruta que solo necesita token, permitir acceso
        if (isTokenOnlyRoute) {
            console.log("✅ Ruta con solo token, permiso concedido");
            return next();
        }

        // Para otras rutas, verificar en BD usando MongoClient (igual que en checkSessions.js)
        console.log(`🔍 Buscando usuario ${req.user.sub} en BD con MongoClient...`);
        
        client = new MongoClient(process.env.AUTH_MONGODB_URL);
        await client.connect();
        
        const db = client.db('QuboUsers');
        const user = await db.collection('Users').findOne({ user_id: req.user.sub });
        
        if (!user) {
            console.log("❌ Usuario no encontrado en BD");
            return res.status(401).json({ error: 'User not found' });
        }

        req.dbUser = user;
        console.log("✅ Usuario encontrado en BD, permiso concedido");
        next();

    } catch (error) {
        console.error("❌ Error en auth:", error);
        return res.status(500).json({ error: 'Auth error' });
    } finally {
        if (client) await client.close();
    }
};

module.exports = { isAuth };


const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.dbUser || !req.dbUser.rol) {
            console.log('❌ Usuario sin roles definidos');
            return res.status(403).json({ 
                error: 'No tienes permisos para esta acción',
                message: 'No tienes los roles necesarios para realizar esta operación'
            });
        }

        const hasAllowedRole = req.dbUser.rol.some(role => 
            allowedRoles.includes(role)
        );

        if (!hasAllowedRole) {
            console.log('❌ Usuario no tiene los roles necesarios');
            console.log('   Roles usuario:', req.dbUser.rol);
            console.log('   Roles requeridos:', allowedRoles);
            return res.status(403).json({ 
                error: 'Permiso denegado', 
                message: 'No tienes permiso para eliminar este Qubo. Se requiere rol de Administrador.'
            });
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




