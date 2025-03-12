

require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const router = require("./src/utils/apiRpoutes");
const { isAuth } = require("./src/middlewares/auth");
const cloudinary = require("cloudinary").v2;
const QUBO_ICONS = require("./src/constants/cloudinaryUrls");

// Conectar a la base de datos
connectDB();

// Configuración básica
app.use(cookieParser());
app.use(express.json());
app.use(cors({
   origin: "https://sign-in-qubo-git-verceldeployment-inesljs-projects.vercel.app",
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Configuración de Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUD_NAME,
   api_key: process.env.API_KEY,
   api_secret: process.env.API_SECRET,
});

// Ruta de login (sin protección)
app.get("/login", (req, res) => {
   res.sendFile(path.join(__dirname, "public", "login.html"));
});

// 🔥 Middleware para verificar la cookie antes de permitir el acceso
app.use((req, res, next) => {
   console.log("🔍 Cookies recibidas en app2:", req.cookies);

   const token = req.cookies.access_token;
   console.log("🎟️ Token en app2:", token);

   if (!token) {
       console.error("🚫 No se encontró el token en la cookie");
       return res.redirect('/login?error=no_token'); // Redirige si no hay token
   }

   next(); // Si hay token, sigue a `isAuth`
});

// Proteger todas las rutas excepto login y assets
app.use((req, res, next) => {
   if (req.path.includes('.css') || 
       req.path.includes('.js') || 
       req.path.includes('.svg') ||
       req.path === '/login') {
       return next();
   }
   isAuth(req, res, next);
next();
});

// Servir archivos estáticos DESPUÉS de la autenticación
app.use(express.static(path.join(__dirname, "public")));

// 🔥 Ruta protegida para el mapa
app.get("/", (req, res) => {
   res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 Verificar `JWT_SECRET` en `app2`
console.log("🔑 JWT_SECRET en app2:", process.env.JWT_SECRET);

// Rutas de la API
app.get("/api/qubo-icons", (req, res) => {
   res.json(QUBO_ICONS);
});

app.get("/api/proxy", async (req, res) => {
   const targetUrl = req.query.url;
   try {
      const response = await fetch(targetUrl);
      const contentType = response.headers.get("content-type");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (contentType) {
         res.setHeader("Content-Type", contentType);
      }
      if (contentType && contentType.includes("application/json")) {
         const data = await response.json();
         res.json(data);
      } else {
         const data = await response.text();
         res.send(data);
      }
   } catch (error) {
      console.error("Error en el proxy:", error);
      res.status(500).send({ error: "Error al cargar el recurso." });
   }
});

app.use("/api/v1/", router);

// Iniciar servidor
app.listen(3000, () => {
   console.log("Servidor escuchando en http://localhost:3000");
});