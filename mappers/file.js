'use strict'

exports.toModel = function (entity) {
    let model = {
        id: entity.id,
        url: entity.url,
        thumbnail: entity.thumbnail,
        name: entity.name,
        identifier: entity.identifier,
        version: entity.version,
        description: entity.description,
        mimeType: entity.mimeType,
        isFavourite: entity.isFavourite || false,
        views: entity.views || 0,
        isPublic: entity.isPublic
    }

    if (entity.folder) {
        if (entity.folder._doc) {
            model.folder = {
                id: entity.folder.id,
                thumbnail: entity.folder.thumbnail,
                name: entity.folder.name,
                isPublic: entity.folder.isPublic
            }
        } else {
            model.folder = {
                id: entity.folder.toString()
            }
        }
    }

    if (entity.owner) {
        if (entity.owner._doc) {
            model.owner = {
                id: entity.owner.id
            }

            if (entity.owner.profile) {
                model.owner.profile = {
                    firstName: entity.owner.profile.firstName,
                    lastName: entity.owner.profile.lastName,
                    pic: {
                        url: entity.owner.profile.pic.url,
                        thumbnail: entity.owner.profile.pic.thumbnail
                    }
                }
            }
        } else {
            model.owner = {
                id: entity.owner.toString()
            }
        }
    }

    if (entity.entity && entity.entity.entityType) {
        model.entity = {
            type: entity.entity.entityType,
            id: entity.entity.entityId
        }
    }

    if (entity.uploadedBy) {
        if (entity.uploadedBy._doc) {
            model.uploadedBy = {
                id: entity.uploadedBy.id,
                profile: {
                    firstName: entity.uploadedBy.profile.firstName,
                    lastName: entity.uploadedBy.profile.lastName,
                    pic: {
                        url: entity.uploadedBy.profile.pic.url,
                        thumbnail: entity.uploadedBy.profile.pic.thumbnail
                    }
                }
            }
        } else {
            model.uploadedBy = {
                id: entity.uploadedBy.toString()
            }
        }
    }

    if (entity.previous) {
        model.previous = {
            version: entity.previous.version,
            url: entity.previous.url,
            timeStamp: entity.previous.timeStamp
        }
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
