'use strict'

const imageMapper = require('./image')
exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }
    return {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        logo: imageMapper.toModel(entity.logo, context),
        config: entity.config,
        store: entity.store ? { provider: entity.store.provider, config: entity.store.config } : null,
        sign: entity.store ? { provider: entity.sign.provider, config: entity.sign.config } : null,
        status: entity.status,
        timeStamp: entity.timeStamp
    }
}
