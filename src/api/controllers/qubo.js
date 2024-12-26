const Qubo = require( "../models/qubo" );



const getQubo = async ( req, res, next ) => {
     try {
          const allQubos = await Qubo.find();
          return res.status( 200 ).json( allQubos );
     } catch ( error ) {
          return res.status( 400 ).json( "Ha fallado la creación del qubo" );
     }
};


const postQubo = async ( req, res, next ) => {


     try {
          const startDate = new Date(req.body.startDateTime);
          const finishDate = new Date(req.body.endDateTime);

          // Verifica que las fechas son válidas antes de intentar guardarlas
        if (isNaN(startDate.valueOf()) || isNaN(finishDate.valueOf())) {
          return res.status(400).json({ message: "Invalid date provided" });
      }
          const qubo = new Qubo( {


               title: req.body.title,
               category: req.body.category,
               subcategory: req.body.subcategory,
               img: req.file.path,
               latitude: parseFloat(req.body.latitude), // Asegúrate de parsear la latitud
               longitude: parseFloat(req.body.longitude),
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


module.exports = { postQubo, getQubo };