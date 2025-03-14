//* test.js en APP2


// require('dotenv').config({ path: '../.env' });
// const mongoose = require('mongoose');

// async function checkDatabase() {
//     try {
//         console.log("🔌 Intentando conectar a MongoDB...");
//         await mongoose.connect(process.env.AUTH_MONGODB_URL);
//         console.log("✅ Conexión exitosa!");

//         // Mostrar información de la conexión actual
//         console.log("\n📊 Información de la conexión:");
//         console.log(`   Base de datos actual: ${mongoose.connection.db.databaseName}`);
//         console.log(`   Host: ${mongoose.connection.host}`);

//         // Listar todas las bases de datos disponibles
//         const adminDb = mongoose.connection.db.admin();
//         const dbInfo = await adminDb.listDatabases();
//         console.log("\n📚 Bases de datos disponibles:");
//         dbInfo.databases.forEach(db => {
//             console.log(`   - ${db.name} (${Math.round(db.sizeOnDisk / 1024 / 1024 * 100) / 100} MB)`);
//         });

//         // Listar todas las colecciones de la base de datos actual
//         const collections = await mongoose.connection.db.listCollections().toArray();
//         console.log("\n📑 Colecciones en la base de datos actual:");
//         collections.forEach(collection => {
//             console.log(`   - ${collection.name}`);
//         });

//     } catch (error) {
//         console.error("❌ Error:", error.message);
//     } finally {
//         await mongoose.disconnect();
//         console.log("\n👋 Conexión cerrada");
//     }
// }

// checkDatabase();

//* checkSessions.js en APP2
require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const { authDB } = require('./config/db');
const User = require('./api/models/user');

async function checkSessions() {
    let client;
    try {
        console.log("🔌 Conectando a MongoDB directamente con MongoClient...");
        client = new MongoClient(process.env.AUTH_MONGODB_URL);
        await client.connect();
        
        const db = client.db('QuboUsers');
        console.log("✅ Conexión exitosa con MongoClient!");

        // Buscar el usuario por su auth0 ID
        const userId = "auth0|67c9bf6f17475005eefe5e76";
        console.log("\n🔍 Buscando usuario con ID:", userId);

        // Método 1: Usar MongoClient (directo)
        console.log("\n🔍 MÉTODO 1: Buscar con MongoClient:");
        const userMongoClient = await db.collection('Users')
            .findOne({ user_id: userId });

        if (userMongoClient) {
            console.log("✅ Usuario ENCONTRADO con MongoClient");
            console.log("📋 Estructura completa del documento:");
            console.log(JSON.stringify(userMongoClient, null, 2));
            
            console.log("\n🔑 Lista de campos y tipos:");
            Object.entries(userMongoClient).forEach(([key, value]) => {
                console.log(`   - ${key}: ${typeof value} => ${JSON.stringify(value)}`);
            });
        } else {
            console.log("❌ Usuario NO encontrado con MongoClient");
        }
        
        // Método 2: Usar Mongoose
        console.log("\n🔍 MÉTODO 2: Buscar con Mongoose:");
        
        // Verificar estado de conexión de authDB
        console.log(`   - Estado de authDB: ${authDB.readyState}`);
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        
        // Verificar el modelo User
        console.log(`   - Modelo User definido: ${!!User}`);
        console.log(`   - Colección del modelo User: ${User.collection.name}`);
        
        try {
            const userMongoose = await User.findOne({ user_id: userId });
            if (userMongoose) {
                console.log("✅ Usuario ENCONTRADO con Mongoose");
                console.log(JSON.stringify(userMongoose.toObject(), null, 2));
            } else {
                console.log("❌ Usuario NO encontrado con Mongoose");
                
                // Hacer una consulta de todos los usuarios para ver qué hay
                console.log("\n📋 Intentando listar usuarios con Mongoose:");
                const allUsersMongo = await User.find({}).limit(5);
                if (allUsersMongo.length > 0) {
                    console.log(`   - Encontrados ${allUsersMongo.length} usuarios`);
                    console.log(`   - Primer usuario: ${JSON.stringify(allUsersMongo[0].toObject(), null, 2)}`);
                } else {
                    console.log("   - No se encontraron usuarios con Mongoose");
                }
            }
        } catch (mongooseError) {
            console.error("❌ Error al buscar con Mongoose:", mongooseError);
        }

    } catch (error) {
        console.error("❌ Error general:", error);
    } finally {
        if (client) await client.close();
        console.log("\n👋 Conexión MongoClient cerrada");
        
        // No cerramos authDB porque es una conexión persistente
    }
}

checkSessions();