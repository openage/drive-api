'use strict'

const userMapper = require('./user')

const signatureMapper = (entity, context) => {
    if (!entity) {
        return
    }
    let model = {}

    if (entity.signatureSheet) {
        model.signatureSheet = {
            url: entity.signatureSheet.url
        }
    }

    model.parties = (entity.parties || []).map(p => {
        return {
            name: p.name,
            signers: (p.signers || []).map(s => {
                s.profile = s.profile || {}
                return {
                    order: s.order,
                    email: s.email,
                    profile: {
                        firstName: s.profile.firstName,
                        lastName: s.profile.lastName
                    },
                    meta: s.meta || {},
                    status: s.status
                }
            })
        }
    })

    if (entity.status) {
        model.status = entity.status
    }

    return model
}

const viewerMapper = (entity, context) => {
    if (!entity) {
        return
    }
    let model = {
        views: entity.views || 0,
        timeStamp: entity.timeStamp,
        lastView: entity.lastView,
        user: userMapper.toSummary(entity.user, context)
    }

    return model
}

const getMyView = (viewers, context) => {
    return viewers.find(v => v.user && context && context.user && v.user.id === context.user.id)
}

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
        version: entity.version,
        views: entity.views || 0,
        timeStamp: entity.timeStamp,
        tags: entity.tags,
        isEnabled: entity.isEnabled,
        isPlaceholder: entity.isPlaceholder,
        isRequired: entity.isRequired,
        orderNo: entity.orderNo,
        creator: userMapper.toSummary(entity.creator, context),
        viewer: entity.viewer,
        url: entity.url, // deprecated
        thumbnail: entity.thumbnail, // deprecated
        mimeType: entity.mimeType, // deprecated
        size: entity.size // deprecated
    }

    if (entity.viewers && entity.viewers.length) {
        model.viewers = entity.viewers.map(f => viewerMapper(f, context))
        if (context.user) {
            let view = getMyView(model.viewers, context)
            if (view) {
                model.view = view
            }
        }
    }

    if (entity.folder) {
        if (entity.folder._doc) {
            model.folder = {
                id: entity.folder.id,
                code: entity.folder.code,
                name: entity.folder.name,
                thumbnail: entity.folder.thumbnail,
                isPublic: entity.folder.isPublic
            }
        } else {
            model.folder = {
                id: entity.folder.toString()
            }
        }
    }

    if (entity.content) {
        if (entity.content.url) {
            model.url = entity.content.url
        } else if (entity.content.body) {
            model.content = entity.content.body
        }
        model.size = entity.content.size
        model.thumbnail = entity.content.thumbnail
        model.mimeType = entity.content.mimeType
    }

    if (!context.user) {
        return model
    }

    model.isFavourite = entity.isFavourite || false
    model.isPublic = entity.isPublic

    model.status = entity.status
    model.meta = entity.meta
    model.owner = userMapper.toSummary(entity.owner, context)
    model.signature = signatureMapper(entity.signature, context)

    if (entity.entity && entity.entity.entityType) {
        model.entity = {
            type: entity.entity.entityType,
            id: entity.entity.entityId
        }
    }

    if (entity.previous) {
        if (entity.previous.file) {
            model.previous = this.toModel(entity.previous.file, context)
        }
        if (!model.previous) {
            model.previous = {}
        }
        model.previous.timeStamp = entity.previous.timeStamp
        model.previous.creator = userMapper.toSummary(entity.previous.creator, context)
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

    let model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        timeStamp: entity.timeStamp,
        version: entity.version,
        tags: entity.tags,
        isEnabled: entity.isEnabled,
        isPlaceholder: entity.isPlaceholder,
        isRequired: entity.isRequired,
        url: entity.url, // deprecated
        thumbnail: entity.thumbnail, // deprecated
        mimeType: entity.mimeType, // deprecated
        size: entity.size, // deprecated
        meta: entity.meta,
        orderNo: entity.orderNo
    }

    if (entity.viewers && entity.viewers.length) {
        model.viewers = entity.viewers.map(f => viewerMapper(f, context))
        if (context.user) {
            let view = getMyView(model.viewers, context)
            if (view) {
                model.view = view
            }
        }
    }

    if (entity.content) {
        if (entity.content.url) {
            model.url = entity.content.url
        } else if (entity.content.body) {
            model.content = entity.content.body
        }
        model.size = entity.content.size
        model.thumbnail = entity.content.thumbnail
        model.mimeType = entity.content.mimeType
    }

    if (entity.creator) {
        model.creator = userMapper.toSummary(entity.creator, context)
    }

    if (!context.user) {
        return model
    }

    model.isFavourite = entity.isFavourite || false
    model.isPublic = entity.isPublic
    model.isVirtual = entity.isVirtual
    model.isTemplate = entity.isTemplate

    model.status = entity.status

    if (entity.folder) {
        if (entity.folder._doc) {
            model.folder = {
                id: entity.folder.id,
                code: entity.folder.code,
                name: entity.folder.name,
                isPublic: entity.folder.isPublic
            }
        } else {
            model.folder = {
                id: entity.folder.toString()
            }
        }
    }

    return model
}
