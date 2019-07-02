'use strict'
var mongoose = require('mongoose')
module.exports = {
    name: String,
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
