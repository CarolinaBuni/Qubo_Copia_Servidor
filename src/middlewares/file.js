

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// La configuración de Cloudinary ya está en `index.js`, así que la reutilizamos.
// Aquí se utiliza `CloudinaryStorage` para manejar las subidas.
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'qubo/user_uploads', // Carpeta en Cloudinary donde se guardarán los archivos
        allowed_formats: ['jpg', 'png', 'jpeg', 'svg', 'webp', 'gif'], // Formatos permitidos
    },
});

// Configurar Multer con el almacenamiento en Cloudinary
const upload = multer({ storage });

module.exports = upload;
