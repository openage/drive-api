const userMapper = require('./user')
const fileMapper = require('./file')

exports.toModel = function (entity, context) {
    if (!entity) {
        return
    }

    if (!entity.isPublic && !context.user) {
        throw new Error('ACCESS_DENIED')
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
        parent: this.toSummary(entity.parent, context),
        files: [],
        folders: []
    }

    if (!context.user) {
        if (entity.folders && entity.folders.length) {
            model.folders = entity.folders.map(f => {
                if (!f.isPublic) { return null }
                return this.toSummary(f, context)
            })
        }

        if (entity.files && entity.files.length) {
            model.files = entity.files.map(f => {
                if (!f.isPublic) { return null }
                return fileMapper.toSummary(f, context)
            })
        }
        return model
    }

    if (entity.folders && entity.folders.length) {
        model.folders = entity.folders.map(f => this.toSummary(f, context))
    }

    if (entity.files && entity.files.length) {
        model.files = entity.files.map(f => fileMapper.toSummary(f, context))
    }

    model.status = entity.status
    model.meta = entity.meta
    model.owner = userMapper.toSummary(entity.owner, context)

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
