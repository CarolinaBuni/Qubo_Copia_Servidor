const isAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token || token !== 'test123') {
        return res.redirect('https://google.com');
    }

    next();
};

module.exports =  isAuth ;

// const { verifyToken } = require('../utils/jwt');

// const isAuth = (req, res, next) => {
//     // Intentar obtener el token de la cookie
//     const token = req.cookies.access_token;

//     if (!token) {
//         return res.redirect('https://google.com');
//     }

//     const result = verifyToken(token);
    
//     if (!result.success) {
//         console.error('Error de autenticación:', result.error);
//         return res.redirect('https://google.com');
//     }

//     // Añadir la información del usuario decodificada a la request
//     req.user = result.data;
//     next();
// };

// module.exports = isAuth;