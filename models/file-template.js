'use strict'
var mongoose = require('mongoose')

/**
 * injected with {
 *    data: model as received in the post,
 *    context: current context
 * }
 */

module.exports = {
    code: String, // document would be created with this code

    /**
     * ----------------
     * Dynamic sections
     * ----------------
     */
    name: String, // or title = {{}},
    summary: String, // {{}}
    content: {
        url: String, // {{}} would go in as content.url
        body: String // {{}} would go in as content.body
    },
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

    meta: Object,

    /**
     * folder to which this file will be copied
     * if the folder does not exist - it will be created
    */
    folder: String,

    /**
     * ------------------------------------
     * these attribute would be just copied
     * ------------------------------------
    */

    /**
     * en-IN, en-US default - null (must exist)
    */
    language: String,
    /**
     * default thumbnail
     * would be used as placeholder image
     * once the user uploads actual file this may get replaced
    */
    thumbnail: String,
    isPublic: Boolean,

    /**
     * content won't be created
     * when user asks for it it would be
     * generated or fetched
    */
    isDynamic: Boolean,

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

    hooks: [{
        trigger: String,
        url: String,
        action: String,
        config: Object,
        data: Object
    }],

    config: Object,

    dataSource: {
        type: { type: String }, // 'http' | 'file' | 'mysql' | 'mongodb' | 'mssql',
        connectionString: String,
        config: Object, // headers in case of http
        params: [{ key: String, value: String }], // includes dataId
        field: String // the field in response object that has data
    },

    status: String, // active, inactive, archived

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
