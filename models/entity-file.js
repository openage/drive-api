'use strict'
var mongoose = require('mongoose')

module.exports = {
    name: String, // driving-licence, passport, 
    description: String,

    thumbnail: String,
    mimeTypes: [String],
    isPublic: Boolean,

    isRequired: Boolean,

    url: String, // creates a virtual doc with the url
    isVirtual: Boolean,

    folder: String,

    entityType: String, //  drivers

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
