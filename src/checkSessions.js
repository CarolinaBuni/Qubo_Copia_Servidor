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

async function checkSessions() {
    let client;
    try {
        // Conectar a MongoDB
        client = new MongoClient(process.env.AUTH_MONGODB_URL);
        await client.connect();
        const db = client.db('QuboUsers');
        
        // Este es el ID que viene en la URL
        const sessionId = '67d2ac1bc6731f2d1799d31d';
        console.log("\n🔍 Buscando sessionId:", sessionId);

        // Buscar en la colección Sessions
        const session = await db.collection('Sessions').findOne({
            _id: new MongoClient.ObjectId(sessionId)
        });

        if (session) {
            console.log("\n✅ Sesión encontrada:");
            console.log("- ID:", session._id);
            console.log("- Tiene token:", session.token ? "Sí" : "No");
            console.log("\nDatos completos:", JSON.stringify(session, null, 2));
        } else {
            console.log("\n❌ Sesión NO encontrada");
        }

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        if (client) await client.close();
    }
}

checkSessions();