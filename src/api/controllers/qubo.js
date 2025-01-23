const Qubo = require( "../models/qubo" );
const cloudinary = require( 'cloudinary' ).v2;




const getQubo = async ( req, res, next ) => {
    try {
        const allQubos = await Qubo.find();
        return res.status( 200 ).json( allQubos );
    } catch ( error ) {
        return res.status( 400 ).json( "Ha fallado la creación del qubo" );
    }
};


// const postQubo = async ( req, res, next ) => {


//     try {
//         const startDate = new Date( req.body.startDateTime );
//         const finishDate = new Date( req.body.endDateTime );

//         // Verifica que las fechas son válidas antes de intentar guardarlas
//         if ( isNaN( startDate.valueOf() ) || isNaN( finishDate.valueOf() ) ) {
//             return res.status( 400 ).json( { message: "Invalid date provided" } );
//         }
//         const qubo = new Qubo( {


//             title: req.body.title,
//             category: req.body.category,
//             subcategory: req.body.subcategory,
//             img: req.file.path,
//             latitude: parseFloat( req.body.latitude ), // Asegúrate de parsear la latitud
//             longitude: parseFloat( req.body.longitude ),
//             startDate, // Usando las fechas convertidas
//             finishDate,
//             description: req.body.description,
//             link: req.body.link,
//             anonymous: req.body.anonymous === 'on' ? true : false,
//         } );

//         const quboSaved = await qubo.save();
//         res.status( 200 ).json( quboSaved );
//     } catch ( error ) {
//         console.error( 'Error saving the Qubo:', error );
//         res.status( 400 ).json( { message: "Ha fallado la creación del qubo", error } );
//     }
// };

// const postQubo = async (req, res, next) => {
//     try {
//         const startDate = new Date(req.body.startDateTime);
//         const finishDate = new Date(req.body.endDateTime);

//         if (isNaN(startDate.valueOf()) || isNaN(finishDate.valueOf())) {
//             return res.status(400).json({ message: "Invalid date provided" });
//         }

//         // URL de imagen por defecto
//         const icons = {
//             iconic: "https://res.cloudinary.com/dafjggs2p/image/upload/v1717186037/Qubos_Qubo_City/quboIconic_osq4i3.svg",
//             // Añade más subcategorías aquí
//         };

//         const subcategory = req.body.subcategory.toLowerCase(); // Convertir subcategoría a minúsculas
//         const imgUrl = req.file?.path || icons[subcategory] || './assets/quboNeutro.png';

//         const qubo = new Qubo({
//             title: req.body.title,
//             category: req.body.category,
//             subcategory: req.body.subcategory,
//             img: imgUrl,
//             latitude: parseFloat(req.body.latitude),
//             longitude: parseFloat(req.body.longitude),
//             startDate,
//             finishDate,
//             description: req.body.description,
//             link: req.body.link,
//             anonymous: req.body.anonymous === 'on',
//         });

//         const quboSaved = await qubo.save();
//         res.status(200).json(quboSaved);
//     } catch (error) {
//         console.error('Error saving the Qubo:', error);
//         res.status(400).json({ message: "Error creating Qubo", error });
//     }
// };

const postQubo = async (req, res, next) => {
    try {
        const { 
            title, 
            category, 
            subcategory, 
            latitude, 
            longitude, 
            startDateTime, 
            endDateTime, 
            description, 
            link, 
            anonymous 
        } = req.body;

        // Validación de campos obligatorios
        if (!title || typeof title !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'title'" });
        }

        if (!category || typeof category !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'category'" });
        }

        if (!subcategory || typeof subcategory !== 'string') {
            return res.status(400).json({ message: "Invalid or missing 'subcategory'" });
        }

        if (!latitude || isNaN(parseFloat(latitude))) {
            return res.status(400).json({ message: "Invalid or missing 'latitude'" });
        }

        if (!longitude || isNaN(parseFloat(longitude))) {
            return res.status(400).json({ message: "Invalid or missing 'longitude'" });
        }

        // Validación de fechas
        const startDate = new Date(startDateTime);
        const finishDate = new Date(endDateTime);

        if (isNaN(startDate.valueOf()) || isNaN(finishDate.valueOf())) {
            return res.status(400).json({ message: "Invalid date provided" });
        }

        if (finishDate <= startDate) {
            return res.status(400).json({ message: "'endDateTime' must be after 'startDateTime'" });
        }

        // Validación de descripción opcional
        if (description && typeof description !== 'string') {
            return res.status(400).json({ message: "Invalid 'description'" });
        }

        // Validación del link opcional
        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (link && !urlRegex.test(link)) {
            return res.status(400).json({ message: "Invalid 'link'" });
        }

        // Asignación de URL de imagen
        const icons = {
            iconic: "https://res.cloudinary.com/dafjggs2p/image/upload/v1717186037/Qubos_Qubo_City/quboIconic_osq4i3.svg",
            // Añade más subcategorías aquí
        };

        const imgUrl = req.file?.path || icons[subcategory.toLowerCase()] || './assets/quboNeutro.png';

        // Creación del objeto Qubo
        const qubo = new Qubo({
            title,
            category,
            subcategory,
            img: imgUrl,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            startDate,
            finishDate,
            description,
            link,
            anonymous: anonymous === 'on',
        });

        // Guardado en la base de datos
        const quboSaved = await qubo.save();
        res.status(200).json(quboSaved);
    } catch (error) {
        console.error('Error saving the Qubo:', error);
        res.status(500).json({ message: "Error creating Qubo", error: error.message });
    }
};



const deleteQubo = async ( req, res, next ) => {
    try {
        const quboId = req.params.id;

        console.log( "Intentando eliminar Qubo con ID:", quboId );

        // Busca el Qubo en la base de datos
        const qubo = await Qubo.findById( quboId );
        if ( !qubo ) {
            console.log( "Qubo no encontrado" );
            return res.status( 404 ).json( { message: "Qubo no encontrado" } );
        }

        console.log( "Qubo encontrado:", qubo );

        // Verifica si la imagen pertenece a Cloudinary
        if ( qubo.img.startsWith( "https://res.cloudinary.com" ) ) {
            // Extrae el `publicId` desde la URL de la imagen
            const publicId = qubo.img
                .split( '/' )
                .slice( -2 )
                .join( '/' )
                .split( '.' )[ 0 ]; // Elimina la extensión del archivo

            console.log( "Public ID generado:", publicId );

            // Intenta eliminar la imagen de Cloudinary
            try {
                const result = await cloudinary.uploader.destroy( publicId );
                console.log( "Resultado de eliminación en Cloudinary:", result );

                if ( result.result !== "ok" && result.result !== "not found" ) {
                    console.error( "Error inesperado al eliminar imagen de Cloudinary:", result );
                    throw new Error( "Error inesperado en Cloudinary" );
                }
            } catch ( cloudinaryError ) {
                console.error( "Detalles del error de Cloudinary:", cloudinaryError.message );
                throw new Error( `Error en Cloudinary: ${ cloudinaryError.message }` );
            }
        } else {
            console.log( "La imagen no pertenece a Cloudinary, no se elimina." );
        }

        // Elimina el Qubo de la base de datos
        const deletedQubo = await Qubo.findByIdAndDelete( quboId );
        console.log( "Qubo eliminado de la base de datos:", deletedQubo );

        if ( !deletedQubo ) {
            throw new Error( "No se pudo eliminar el Qubo de la base de datos" );
        }

        res.status( 200 ).json( { message: "Qubo eliminado correctamente" } );
    } catch ( error ) {
        console.error( "Error al eliminar el Qubo:", error.message, error.stack );
        res.status( 500 ).json( { message: "Error al eliminar el Qubo", error: error.message } );
    }
};


module.exports = { postQubo, getQubo, deleteQubo };