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

        // Buscar la sesión por connect.sid
        const connectSid = "nFnbPtlOk7ZIxgxdIeFf4wYdSCEBxpvd"; // El valor sin el s: y la codificación
        console.log("\n🔍 Buscando sesión por connect.sid:", connectSid);
        
        // Buscar en sessions (minúscula)
        const sessionLower = await db.collection('sessions').findOne({ 
            _id: connectSid 
        });
        console.log("\n📝 Sesión en 'sessions':", sessionLower ? "Encontrada" : "No encontrada");
        if (sessionLower) {
            console.log(JSON.stringify(sessionLower, null, 2));
        }

        // Buscar en Sessions (mayúscula)
        const sessionUpper = await db.collection('Sessions').findOne({ 
            _id: connectSid 
        });
        console.log("\n📝 Sesión en 'Sessions':", sessionUpper ? "Encontrada" : "No encontrada");
        if (sessionUpper) {
            console.log(JSON.stringify(sessionUpper, null, 2));
        }

        // Mostrar todas las sesiones recientes
        console.log("\n📋 Últimas sesiones en 'sessions':");
        const recentSessions = await db.collection('sessions')
            .find({})
            .sort({ _id: -1 })
            .limit(5)
            .toArray();
        
        recentSessions.forEach((session, i) => {
            console.log(`\nSesión ${i + 1}:`);
            console.log('ID:', session._id);
            console.log('Datos:', JSON.stringify(session.session?.user || {}, null, 2));
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