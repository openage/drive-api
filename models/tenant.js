'use strict'
const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    config: Object,
    logo: {
        url: String,
        thumbnail: String
    },
    store: {
        provider: String,
        config: Object
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}
