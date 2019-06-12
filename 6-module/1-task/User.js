const mongoose = require('mongoose');

const regExp = /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/;

const validator = email => regExp.test(email);

const schema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        validate: [{ validator: validator, message: `Некорректный email` }],
        match: [regExp, 'Некорректный email'],
        lowercase: true,
        trim: true,
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

schema.index({ email: 1, displayName: 1 });
const User = mongoose.model('User', schema);

module.exports = mongoose.model('User', schema);
