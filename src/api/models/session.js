//* model session.js APP2

const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // ID del usuario
    token: { type: String, required: true },  // JWT generado
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // Expira en 1h
}, {
    collection: 'Sessions'
});

const Session = mongoose.model("Session", sessionSchema);
module.exports = Session;