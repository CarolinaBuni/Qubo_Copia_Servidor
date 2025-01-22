// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const { connectDB } = require( './src/config/db' );
const router = require( './src/utils/apiRpoutes' );
const cloudinary = require('cloudinary').v2;
// const fetch = require('node-fetch')

connectDB();
app.use(express.json());
app.use(cors());

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

app.get('/api/icons', (req, res) => {
    cloudinary.api.resources(
        { type: 'upload', prefix: 'Qubos_Qubo_City/' },
        function (error, result) {
            if (error) {
                return res.status(500).json({ error: 'Error fetching icons from Cloudinary' });
            }
            const subcategoryIcons = result.resources.reduce((acc, resource) => {
                const subcategory = resource.public_id.replace('Qubos_Qubo_City/', '').replace(/\.[^/.]+$/, '');
                acc[subcategory] = resource.secure_url;
                return acc;
            }, {});
            res.json(subcategoryIcons);
        }
    );
});

// Ruta proxy
// app.get('/api/proxy', async (req, res) => {
//     const { url } = req.query; // Leer la URL desde los parámetros de consulta
//     if (!url) {
//         return res.status(400).json({ error: 'No se proporcionó ninguna URL' });
//     }

//     try {
//         const response = await fetch(url); // Realizar la solicitud a la URL externa
//         const data = await response.json(); // Obtener la respuesta como JSON
//         res.status(response.status).json(data); // Responder con los datos y el estado original
//     } catch (error) {
//         console.error('Error en el proxy:', error.message);
//         res.status(500).json({ error: 'Hubo un problema al procesar la solicitud', details: error.message });
//     }
// });

app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    try {
        const response = await fetch(targetUrl);
        const contentType = response.headers.get('content-type');

        if (contentType.includes('application/vnd.google-earth.kml+xml') || contentType.includes('application/xml')) {
            res.setHeader('Content-Type', contentType);
        } else {
            res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        }

        const data = await response.text(); // Para KML, usamos `text()` en lugar de `json()`.
        res.send(data);
    } catch (error) {
        res.status(500).send({ error: 'Error al cargar el recurso' });
    }
});



app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.use("/api/v1/", router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});

