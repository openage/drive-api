'use strict'
var mongoose = require('mongoose')
module.exports = {
    code: String,
    name: String,
    config: Object,
    store: {
        provider: String,
        config: Object
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'inactive']
    },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
