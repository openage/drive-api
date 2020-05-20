'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: { type: String, lowercase: true },
    name: String,
    shortName: String,
    logo: {
        url: String,
        thumbnail: String
    },
    config: Object,
    services: [{
        logo: String,
        code: String,
        name: String,
        url: String // api root url
    }],
    store: {
        provider: String,
        config: Object
    },
    sign: {
        provider: String,
        config: Object
    },
    meta: Object,
    status: {
        type: String,
        default: 'active',
        enum: ['new', 'active', 'inactive']
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}
