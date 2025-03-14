const mongoose = require('mongoose');
const { authDB } = require('../../config/db');

const userSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    user_id: String,
    email: String,
    rol: [String], 
    modules: [String]
}, {
    collection: 'Users'
});
// Añadir un log para debug
userSchema.post('find', function(result) {
    console.log(`🔍 Mongoose find result: ${result && result.length} usuarios encontrados`);
});

userSchema.post('findOne', function(result) {
    console.log(`🔍 Mongoose findOne result: ${result ? 'Usuario encontrado' : 'Usuario NO encontrado'}`);
    if (result) console.log(`   ID: ${result.user_id}`);
});

const User = authDB.model('User', userSchema);

module.exports = User;