'use strict'

exports.toModel = function (entity) {
    return {
        id: entity.id,
        name: entity.name,
        code: entity.code,
        token: entity.token,
        status: entity.status,
        timeStamp: entity.timeStamp
    }
}
