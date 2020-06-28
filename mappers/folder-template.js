const userMapper = require('./user')
const fileTemplateMapper = require('./file-template')

exports.toModel = function (entity, context) {
    if (!entity) {
        return
    }

    if (entity._bsontype === 'ObjectId') {
        return {
            id: entity.toString()
        }
    }

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        thumbnail: entity.thumbnail,
        isPublic: entity.isPublic,
        tags: entity.tags || [],
        owner: entity.owner,
        parent: entity.parent ? { code: entity.parent } : undefined,
        status: entity.status,
        timeStamp: entity.timeStamp
    }

    if (entity.feed && entity.feed.url) {
        model.feed = {
            url: entity.feed.url,
            period: entity.feed.period
        }
    }

    return model
}

exports.toSummary = (entity, context) => {
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
        description: entity.description,
        thumbnail: entity.thumbnail,
        isPublic: entity.isPublic
    }
}
