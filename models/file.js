'use strict'
var mongoose = require('mongoose')

module.exports = {
    name: String, // GST, Adhaar, PAN
    identifier: Object, // gst id etc
    description: String,

    url: String,
    thumbnail: String,
    mimeType: String,

    version: Number,
    size: Number,

    isPublic: Boolean,
    isTemplate: Boolean,
    isVirtual: Boolean,

    path: String,
    store: String,

    previous: {
        version: Number,
        timeStamp: Date,
        path: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    },

    entity: { type: mongoose.Schema.Types.ObjectId, ref: 'entity' },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'folder' },
    tags: {
        folder: String
    }, // used for query purposes only

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    sharedWith: [{
        role: { type: String, enum: ['editor', 'viewer'] },
        expires: Date,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' },
    status: { type: String, enum: ['placeholder', 'active', 'archived', 'removed'] }
}
