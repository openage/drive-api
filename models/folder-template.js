'use strict'
var mongoose = require('mongoose')

module.exports = {
    code: String, // template code
    /**
     * ----------------
     * Dynamic sections
     * ----------------
     */
    name: String, // {{}}
    description: String, // {{}}
    tags: [{ type: String }], // can contain {{}}
    owner: String, // {{}}

    /**
     * if model.meta.entity it would be added to the file
    */
    // entity: {
    //     id: String,
    //     type: { type: String },
    //     name: String
    // },

    /**
     * will be used to generate the files from the templates
    */
    filesTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'fileTemplate' }],

    /**
     * ------
     * Static
     * ------
    */

    /**
     * the files/documents would be fetched periodically from the url and
     * the content is pushed as files
     *
     * this field if exist will be copied
    */
    feed: {
        url: String,
        period: Number // in minutes
    },

    thumbnail: String,
    isPublic: Boolean,

    status: String, // active, inactive, archived
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
