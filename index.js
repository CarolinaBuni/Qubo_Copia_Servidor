// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const { connectDB } = require( './src/config/db' );
const router = require( './src/utils/apiRpoutes' );
const isAuth = require( './src/middlewares/auth' );
const cloudinary = require('cloudinary').v2;
const QUBO_ICONS = require( './src/constants/cloudinaryUrls' );

connectDB();


app.use(express.json());
app.use(cors());

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Servir archivos estáticos después del middleware de autenticación
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/qubo-icons', (req, res) => {
    res.json(QUBO_ICONS);
});




app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get('content-type');

        // Configura los encabezados necesarios para CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Configura el tipo de contenido según la respuesta del recurso
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Maneja diferentes tipos de respuestas (JSON, texto, etc.)
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            res.json(data);
        } else {
            const data = await response.text();
            res.send(data);
        }
    } catch (error) {
        console.error('Error en el proxy:', error);
        res.status(500).send({ error: 'Error al cargar el recurso.' });
    }
});

app.use("/api/v1/", router);



// Proteger todas las rutas excepto assets
app.use((req, res, next) => {
    // Permitir acceso a archivos CSS, JS e imágenes
    if (req.path.includes('.css') || req.path.includes('.js') || req.path.includes('.svg')) {
        next();
    } else {
        isAuth(req, res, next);
    }
});



app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});