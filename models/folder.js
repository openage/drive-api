'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: {
        type: String,
        lowercase: true
    },
    name: {
        type: String
    },
    description: String, // TODO: rename to summary
    thumbnail: String,

    /**
     * if feed is set
     * the files/documents are fetched periodically and
     * the content is pushed as files
    */
    feed: {
        url: String,
        period: Number, // in minutes
        lastChecked: Date
    },

    meta: Object,

    /**
     * keeps the recent most change to the folder
     */
    recent: {
        content: String, // New file added, file updated etc
        date: Date,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    },

    /**
     * the folder is tagged and discoverable with following attribute
     */
    entity: {
        id: String,
        type: { type: String },
        name: String
    },
    tags: [{ type: String }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

    isPublic: Boolean,

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'folder' },

    sharedWith: [{ // TODO: rename to contributors
        type: { type: String, enum: ['invited', 'editor', 'viewer', 'blocked'] },
        expires: Date,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    }],

    status: String,
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
