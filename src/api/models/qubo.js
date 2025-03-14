const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const quboSchema = new Schema(
     {
          title: { type: String, required: true },
          category: { type: String, required: true, enum: [
               "Buildings",
               "Mobility",
               "Health",
               "Security",
               "Infraestructure",
               "Logistics",
               "Environment & Sustainability",
               "Entertainment & Sports",
               "Services",
               "Incidences"
          ] 
     },
     subcategory: { type: String, required: true },
     img: { type: String, required: true},
     latitude: { type: Number, required: true }, // Añade esto
     longitude: { type: Number, required: true }, // Añade esto
     startDate: { type: Date, required: false },
     finishDate: { type: Date, required: false },
     description: { type: String, required: true },
     link: { type: String, required: false },
     anonymous: { type: Boolean, required: true },
     },
     {
          timestamps: true,
          collection: "qubos"
     }
);

// Logs para debug
quboSchema.post('find', function(result) {
     console.log(`🔍 Qubo find result: ${result.length} qubos encontrados`);
 });
const Qubo = mongoose.model( "qubo", quboSchema, "qubo");

module.exports = Qubo;