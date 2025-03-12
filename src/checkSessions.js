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


require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function checkSessions() {
    try {
        console.log("🔌 Intentando conectar a MongoDB...");
        await mongoose.connect(process.env.AUTH_MONGODB_URL);
        
        const db = mongoose.connection.useDb('QuboUsers');
        console.log("✅ Conexión exitosa a QuboUsers!");

        const sessionsCollection = db.collection('sessions'); // Nota: en minúsculas

        // Contar total de sesiones
        const totalSessions = await sessionsCollection.countDocuments();
        console.log(`\n📊 Total de sesiones en la base de datos: ${totalSessions}`);

        // Buscar todas las sesiones y ordenarlas por fecha de expiración
        const allSessions = await sessionsCollection.find({}).sort({ expires: -1 }).toArray();

        console.log("\n🔍 Sesiones encontradas:");
        allSessions.forEach(session => {
            const isExpired = new Date(session.expires) < new Date();
            console.log('\n📝 Sesión:', {
                id: session._id,
                expira: session.expires,
                estado: isExpired ? '❌ Expirada' : '✅ Activa',
                tiempoRestante: isExpired ? 
                    'Expirada hace ' + Math.round((Date.now() - new Date(session.expires)) / 1000 / 60) + ' minutos' :
                    'Expira en ' + Math.round((new Date(session.expires) - Date.now()) / 1000 / 60) + ' minutos',
                usuario: {
                    email: session.session?.user?.email,
                    nickname: session.session?.user?.nickname,
                    sub: session.session?.user?.sub
                }
            });
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n👋 Conexión cerrada");
    }
}

checkSessions();