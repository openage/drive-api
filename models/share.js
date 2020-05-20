'use strict'
const mongoose = require('mongoose')

module.exports = {
    date: { type: Date },
    expires: { type: Date },
    role: {
        type: String,
        enum: ['editor', 'viewer']
    },
    isFavourite: {
        type: Boolean,
        default: false
    },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'folder' },
    file: { type: mongoose.Schema.Types.ObjectId, ref: 'file' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
