'use strict'
var mongoose = require('mongoose')

module.exports = {
    name: String,
    description: String,
    thumbnail: String,
    isPublic: Boolean,

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'folder' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    sharedWith: [{
        type: { type: String, enum: ['editor', 'viewer'] },
        expires: Date,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }

}