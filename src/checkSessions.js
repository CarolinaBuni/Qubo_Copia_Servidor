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
const { MongoClient, ObjectId } = require('mongodb');  // Añadimos ObjectId aquí

async function checkSessions() {
    let client;
    try {
        console.log("🔌 Conectando a MongoDB...");
        client = new MongoClient(process.env.AUTH_MONGODB_URL);
        await client.connect();
        
        const db = client.db('QuboUsers');
        console.log("✅ Conexión exitosa!");

        // El sessionId que estamos buscando
        const searchSessionId = '67d2d879a56fe3ad0b28186c';
        console.log("\n🔍 Buscando sessionId específico:", searchSessionId);

        // 1. Buscar en Sessions (mayúscula)
        console.log("\n📁 Colección 'Sessions':");
        const sessionUpper = await db.collection('Sessions')
            .findOne({ _id: new ObjectId(searchSessionId) });
        
        if (sessionUpper) {
            console.log("✅ ENCONTRADA en Sessions:", sessionUpper);
        } else {
            console.log("❌ No encontrada en Sessions");
            
            // Mostrar las últimas 3 sesiones de Sessions
            console.log("\n📋 Últimas 3 sesiones en Sessions:");
            const recentSessionsUpper = await db.collection('Sessions')
                .find({})
                .sort({ _id: -1 })
                .limit(3)
                .toArray();
            
            recentSessionsUpper.forEach((s, i) => {
                console.log(`\nSesión ${i + 1}:`);
                console.log('ID:', s._id.toString());
                console.log('Datos:', s);
            });
        }

        // 2. Buscar en sessions (minúscula)
        console.log("\n📁 Colección 'sessions':");
        const sessionLower = await db.collection('sessions')
            .findOne({ _id: searchSessionId });
        
        if (sessionLower) {
            console.log("✅ ENCONTRADA en sessions:", sessionLower);
        } else {
            console.log("❌ No encontrada en sessions");
            
            // Mostrar las últimas 3 sesiones de sessions
            console.log("\n📋 Últimas 3 sesiones en sessions:");
            const recentSessionsLower = await db.collection('sessions')
                .find({})
                .sort({ _id: -1 })
                .limit(3)
                .toArray();
            
            recentSessionsLower.forEach((s, i) => {
                console.log(`\nSesión ${i + 1}:`);
                console.log('ID:', s._id);
                console.log('Datos:', s);
            });
        }

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