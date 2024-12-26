// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// // Ruta del directorio donde se guardarán los archivos
// const uploadDir = path.join(__dirname, '../uploads');

// // Crear el directorio si no existe
// if (!fs.existsSync(uploadDir)){
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function(req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });
// module.exports = upload;


//***************************************************** */
// file.js
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// // Ruta del directorio donde se guardarán los archivos
// const uploadDir = path.join(__dirname, '../uploads');

// // Crear el directorio si no existe
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function(req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage: storage });
// module.exports = upload;

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// La configuración de Cloudinary ya está en `index.js`, así que la reutilizamos.
// Aquí se utiliza `CloudinaryStorage` para manejar las subidas.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Qubos_Qubo_City', // Carpeta en Cloudinary donde se guardarán los archivos
        allowed_formats: ['jpg', 'png', 'jpeg', 'svg'], // Formatos permitidos
    },
});

// Configurar Multer con el almacenamiento en Cloudinary
const upload = multer({ storage });

module.exports = upload;
