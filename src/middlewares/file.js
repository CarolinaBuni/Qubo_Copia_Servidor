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
// file.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ruta del directorio donde se guardarán los archivos
const uploadDir = path.join(__dirname, '../uploads');

// Crear el directorio si no existe
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
module.exports = upload;
