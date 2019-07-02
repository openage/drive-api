'use strict'

const db = require('../models')

exports.get = async (data, context) => {
    context.logger.start('services/organizations:get')

    if (typeof data === 'string') {
        if (data.isObjectId()) {
            return getById(data, context)
        } else {
            return getByCode(data, context)
        }
    }

    if (data.id) {
        return getById(data.id, context)
    }

    if (data.code) {
        return getByCode(data.code, context)
    }

    return null
}

const getById = async (id, context) => {
    return db.organization.findById(id)
}

exports.getById = getById

const getByCode = async (code, context) => {
    return db.organization.findOne({ code: code })
}

exports.getByCode = getByCode
