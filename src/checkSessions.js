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
const jwt = require('jsonwebtoken');

async function checkSessions() {
    let client;
    try {
        console.log("🔌 Intentando conectar a MongoDB...");
        client = new MongoClient(process.env.AUTH_MONGODB_URL);
        await client.connect();
        
        const db = client.db('QuboUsers');
        console.log("✅ Conexión exitosa a QuboUsers!");

        // Buscar en Sessions
        console.log("\n🔍 Sesiones encontradas:");
        const sessions = await db.collection('Sessions').find({}).limit(2).toArray();
        
        sessions.forEach((session, index) => {
            console.log(`\n📝 Session ${index + 1}:`);
            console.log('- Session ID:', session._id);
            console.log('- User ID:', session.userId);
            
            // Decodificar el token JWT
            const tokenData = jwt.decode(session.token);
            console.log('\n🔑 Datos del usuario en el token:');
            console.log('- Email:', tokenData.email);
            console.log('- Name:', tokenData.name);
            console.log('- Sub:', tokenData.sub);
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        if (client) {
            await client.close();
            console.log("\n👋 Conexión cerrada");
        }
    }
}

checkSessions();
