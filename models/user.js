'use strict'
var mongoose = require('mongoose')

module.exports = {
    type: { type: String },
    email: { type: String },
    phone: { type: String },
    profile: {
        firstName: String,
        lastName: String,
        pic: {
            url: String,
            thumbnail: String
        }
    },
    role: {
        id: { type: String },
        code: { type: String },
        key: { type: String },
        permissions: [{ type: String }]
    },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
