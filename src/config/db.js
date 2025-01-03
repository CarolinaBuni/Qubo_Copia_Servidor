const mongoose = require('mongoose');

const connectDB = async () => {
     try {
          await mongoose.connect(process.env.DB_URL);
          console.log("Conectado correctamente a la BBDD");
     } catch (error) {
          console.log("Error al conectarse con la BBDD");
     }
};

module.exports = { connectDB };