const mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    logo: {
        url: String,
        thumbnail: String
    },
    config: Object,
    store: {
        provider: String,
        config: Object
    },

    sign: {
        provider: String,
        config: Object
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    services: [{
        logo: String,
        code: String,
        name: String,
        url: String // api root url
    }],
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    }
}
