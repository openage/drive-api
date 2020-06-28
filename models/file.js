'use strict'
var mongoose = require('mongoose')

module.exports = {
    trackingId: String,
    code: String, // gst id etc
    language: String, // hi-IN, en-US default - null (must exist)
    timeStamp: Date,
    name: String, // or title GST, Aadhaar, PAN
    description: String, // TODO: rename to summary

    /**
     * content would be fetched/re-generated every time
     */
    isEnabled: Boolean,
    isDynamic: Boolean,
    orderNo: {
        type: Number,
        default: 1000
    },
    /**
     * in case the file is just a placeholder
     * the actual content does not exist user would be uploading it
     *
     * the name and code of the file would not change,
     * only the content, url,  would be updated and
     * isPlaceholder would be set to false
     */
    isPlaceholder: Boolean,
    isRequired: Boolean,
    mimeTypes: [String], // acceptable file types

    content: {
        // incase the content is saved in db
        body: String,

        // the document would created from the template (can be regenerated)
        template: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'template'
        },

        // document is saved as local file
        path: String,
        provider: String, // s3, local file

        // document points to another url (virtual)
        url: String,
        mimeType: String,
        thumbnail: String,
        size: Number
    },

    meta: Object,

    // TODO: deprecated - has moved inside content
    url: String, // link to download the file
    thumbnail: String, // preview of the file
    mimeType: String, // uploaded mime type
    size: Number,

    /**
     * how the user interact with content
     */
    // version control
    version: Number, // only one version of the code exists

    previous: {
        version: Number,
        timeStamp: Date,
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'file'
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    },

    folder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'folder'
    },

    // viewing and sharing options

    viewer: String, // tool with which the file will be opened

    /**
     * if from is set the document is set to active from this date
     * if till is set the document is archived on this date
     */
    from: Date,
    till: Date,

    viewers: [{
        views: Number,
        lastView: Number,
        timeStamp: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }],

    isPublic: Boolean,
    sharedWith: [{ // TODO: rename to contributors
        role: {
            type: String,
            enum: ['invited', 'editor', 'viewer', 'blocked']
        },
        expires: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    }],

    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    /**
     * the folder is tagged and discoverable with following attribute
     */
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'entity'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    tags: [{
        type: String
    }],
    folderName: String,

    hooks: [{
        trigger: String,
        url: String,
        action: String,
        config: Object,
        data: Object
    }],

    signature: {
        trackingId: String,
        coverSheet: {
            url: String
        },
        signatureSheet: {
            url: String
        },
        parties: [{
            name: String,
            signers: [{
                order: Number,
                email: String,
                profile: {
                    firstName: String,
                    lastName: String,
                    pic: {
                        url: String,
                        thumbnail: String
                    }
                },
                meta: Object,
                status: String
            }]
        }],
        status: String
    },

    status: {
        type: String,
        enum: ['draft', 'submitted', 'inactive', 'approved', 'active', 'archived', 'canceled', 'removed', 'trash']
    },

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'organization'
    },
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tenant'
    }
}