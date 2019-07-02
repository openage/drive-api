'use strict'
const mongoose = require('mongoose')

module.exports = {
    date: { type: Date },
    role: {
        type: String,
        enum: ['editor', 'viewer']
    },
    expires: { type: Date },
    isFavourite: {
        type: Boolean,
        default: false
    },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'folder' },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'file' },
    shareWith: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' },
    created_At: { type: Date, default: Date.now }
}
