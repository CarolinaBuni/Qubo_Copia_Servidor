
const Qubo = require( "../models/qubo" );
const cloudinary = require( 'cloudinary' ).v2;
const QUBO_ICONS = require( "../../constants/cloudinaryUrls" );
const { verifyToken } = require( "../../utils/jwt" );



// const getQubo = async ( req, res, next ) => {
//     try {
//         // Verificar el token
//         const token = req.headers.authorization?.split(' ')[1]; // Obtiene el token del header

//         if (!token) {
//             return res.status(401).json({ message: 'No se encontró token, no estás autenticado' }); // En vez de redirigir, devuelves un error
//         }

//         const allQubos = await Qubo.find();
//         return res.status( 200 ).json( allQubos );
//     } catch ( error ) {
//         return res.status( 400 ).json( "Ha fallado la obtención de qubos" );
//     }
// };
const getQubo = async (req, res, next) => {
    try {
        // Verificar el token
        const token = req.headers.authorization?.split(' ')[1]; // Obtiene el token del header
        console.log("Token recibido por getQubo:", token);

        if (!token) {
            return res.status(401).json({ message: 'Token no encontrado, no estás autenticado' });
        }

        const result = verifyToken(token);
        if (!result.success) {
            return res.status(401).json({ message: 'Token inválido', error: result.error });
        }

        const allQubos = await Qubo.find();
        return res.status(200).json(allQubos);
    } catch (error) {
        console.error("Error en getQubo:", error);
        return res.status(500).json({ message: 'Error al obtener los qubos', error: error.message });
    }
};



const postQubo = async ( req, res, next ) => {
    try {
        const startDate = new Date( req.body.startDateTime );
        const finishDate = new Date( req.body.endDateTime );
        const subcategory = req.body.subcategory;
        const imgUrl = req.file?.path || icons[ subcategory ] || './assets/quboNeutro.png';

                // Verifica que las fechas son válidas antes de intentar guardarlas
        if ( isNaN( startDate.valueOf() ) || isNaN( finishDate.valueOf() ) ) {
            return res.status( 400 ).json( { message: "Invalid date provided" } );
        }
        const qubo = new Qubo( {


            title: req.body.title,
            category: req.body.category,
            subcategory: req.body.subcategory,
            img: req.file?.path,
            icon: QUBO_ICONS[subcategory] || './assets/quboNeutro.svg', 
            latitude: parseFloat( req.body.latitude ), // Asegúrate de parsear la latitud
            longitude: parseFloat( req.body.longitude ),
            startDate, // Usando las fechas convertidas
            finishDate,
            description: req.body.description,
            link: req.body.link,
            anonymous: req.body.anonymous === 'on' ? true : false,
        } );

        const quboSaved = await qubo.save();
        res.status( 200 ).json( quboSaved );
    } catch ( error ) {
        console.error( 'Error saving the Qubo:', error );
        res.status( 400 ).json( { message: "Ha fallado la creación del qubo", error } );
    }
};


// const deleteQubo = async ( req, res, next ) => {
//     try {
//         const quboId = req.params.id;
//         console.log( "Intentando eliminar Qubo con ID:", quboId );

//         // Busca el Qubo en la base de datos
//         const qubo = await Qubo.findById( quboId );
//         if ( !qubo ) {
//             console.log( "Qubo no encontrado" );
//             return res.status( 404 ).json( { message: "Qubo no encontrado" } );
//         }

//         console.log( "Qubo encontrado:", qubo );

//         // Verifica si la imagen pertenece a Cloudinary
//         if ( qubo.img.startsWith( "https://res.cloudinary.com" ) ) {
//             // Extrae el `publicId` desde la URL de la imagen
//             const publicId = qubo.img
//                 .split( '/' )
//                 .slice( -2 )
//                 .join( '/' )
//                 .split( '.' )[ 0 ]; // Elimina la extensión del archivo

//             console.log( "Public ID generado:", publicId );

//             // Intenta eliminar la imagen de Cloudinary
//             try {
//                 const result = await cloudinary.uploader.destroy( publicId );
//                 console.log( "Resultado de eliminación en Cloudinary:", result );

//                 if ( result.result !== "ok" && result.result !== "not found" ) {
//                     console.error( "Error inesperado al eliminar imagen de Cloudinary:", result );
//                     throw new Error( "Error inesperado en Cloudinary" );
//                 }
//             } catch ( cloudinaryError ) {
//                 console.error( "Detalles del error de Cloudinary:", cloudinaryError.message );
//                 throw new Error( `Error en Cloudinary: ${ cloudinaryError.message }` );
//             }
//         } else {
//             console.log( "La imagen no pertenece a Cloudinary, no se elimina." );
//         }

//         // Elimina el Qubo de la base de datos
//         const deletedQubo = await Qubo.findByIdAndDelete( quboId );
//         console.log( "Qubo eliminado de la base de datos:", deletedQubo );

//         if ( !deletedQubo ) {
//             throw new Error( "No se pudo eliminar el Qubo de la base de datos" );
//         }

//         res.status( 200 ).json( { message: "Qubo eliminado correctamente" } );
//     } catch ( error ) {
//         console.error( "Error al eliminar el Qubo:", error.message, error.stack );
//         res.status( 500 ).json( { message: "Error al eliminar el Qubo", error: error.message } );
//     }
// };

const deleteQubo = async (req, res, next) => {
    try {
        const quboId = req.params.id;
        console.log("Intentando eliminar Qubo con ID:", quboId);

        const qubo = await Qubo.findById(quboId);
        if (!qubo) {
            console.log("Qubo no encontrado");
            return res.status(404).json({ message: "Qubo no encontrado" });
        }

        // Verifica si la imagen pertenece a Cloudinary y está en la carpeta user_uploads
        if (qubo.img && qubo.img.includes('cloudinary.com') && qubo.img.includes('/qubo/user_uploads/')) {
            try {
                // Extrae el public_id correcto
                const urlParts = qubo.img.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const publicId = `qubo/user_uploads/${fileName}`;
                
                console.log("Intentando eliminar imagen con public_id:", publicId);
                
                const result = await cloudinary.uploader.destroy(publicId);
                console.log("Resultado de eliminación en Cloudinary:", result);
            } catch (cloudinaryError) {
                console.error("Error al eliminar imagen de Cloudinary:", cloudinaryError);
                // Continuamos con la eliminación del Qubo aunque falle la eliminación de la imagen
            }
        }

        // Elimina el Qubo de la base de datos
        const deletedQubo = await Qubo.findByIdAndDelete(quboId);
        if (!deletedQubo) {
            throw new Error("No se pudo eliminar el Qubo de la base de datos");
        }

        res.status(200).json({ message: "Qubo eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el Qubo:", error);
        res.status(500).json({ message: "Error al eliminar el Qubo", error: error.message });
    }
};


module.exports = { postQubo, getQubo, deleteQubo };