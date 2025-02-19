const mongoose = require('mongoose');
const { authDB } = require('../../config/db');

const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    user_id: String,
    email: String,
    role: [String],
}, {
    collection: 'Users'
});

const User = authDB.model('User', userSchema);

module.exports = User;