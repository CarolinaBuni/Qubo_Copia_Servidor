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

// app.get('/api/icons', (req, res) => {
//     cloudinary.api.resources(
//         { type: 'upload', prefix: 'Qubos_Qubo_City/' },
//         function (error, result) {
//             if (error) {
//                 return res.status(500).json({ error: 'Error fetching icons from Cloudinary' });
//             }
//             const subcategoryIcons = result.resources.reduce((acc, resource) => {
//                 const subcategory = resource.public_id.replace('Qubos_Qubo_City/', '').replace(/\.[^/.]+$/, '');
//                 acc[subcategory] = resource.secure_url;
//                 return acc;
//             }, {});
//             res.json(subcategoryIcons);
//         }
//     );
// });

app.get('/api/qubo-icons', (req, res) => {
    const icons = {
        iconic: "https://res.cloudinary.com/dafjggs2p/image/upload/v1717186037/Qubos_Qubo_City/quboIconic_osq4i3.svg",
    };

    res.json(icons);
});

//************************************* */
// app.get('/api/proxy', async (req, res) => {
//     const targetUrl = req.query.url;
//     try {
//         const response = await fetch(targetUrl);
//         const contentType = response.headers.get('content-type');

//         if (contentType.includes('application/vnd.google-earth.kml+xml') || contentType.includes('application/xml')) {
//             res.setHeader('Content-Type', contentType);
//         } else {
//             res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
//         }

//         const data = await response.text(); // Para KML, usamos `text()` en lugar de `json()`.
//         res.send(data);
//     } catch (error) {
//         res.status(500).send({ error: 'Error al cargar el recurso' });
//     }
// });

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


//********************************************** */

app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.use("/api/v1/", router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});

