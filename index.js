// index.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const { connectDB } = require( './src/config/db' );
const router = require( './src/utils/apiRpoutes' );
const cloudinary = require('cloudinary').v2;

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


app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

app.use("/api/v1/", router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});

