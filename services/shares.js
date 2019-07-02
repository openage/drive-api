'use strict'

const db = require('../models')

const create = async (data, context) => {
    let log = context.logger.start('services/shares:create')

    if (!data.date) {
        data.date = new Date()
    }

    if (!data.tenant) {
        data.tenant = context.tenant
    }

    let share = new db.share(data).save()

    log.end()
    return share
}

const get = async (query, context) => {
    let log = context.logger.start('services/shares:get')

    let shares = await db.share.find(query).populate('file folder')

    log.end()
    return shares
}

const getOne = async (query, context) => {
    let log = context.logger.start('services/shares:getOne')

    let share = await db.share.findOne(query).populate('file folder')

    log.end()
    return share
}

const getOrCreate = async (model, context) => {
    let log = context.logger.start('services/shares:createFavorite')

    let query = {
        createdBy: model.createdBy || context.user
    }

    if (model.folder) {
        query.folder = model.folder
    }

    if (model.file) {
        query.file = model.file
    }

    if (model.isFavourite) {
        query.isFavourite = model.isFavourite
    }

    let share = await db.share.findOne(query)

    if (!share) {
        share = await create(model, context)
    }

    log.end()
    return share
}

exports.create = create
exports.get = get
exports.getOne = getOne
exports.getOrCreate = getOrCreate
