exports.toModel = function (entity) {
    let model = {
        id: entity.id,
        thumbnail: entity.thumbnail,
        name: entity.name,
        description: entity.description,
        isPublic: entity.isPublic,
        files: [],
        folders: []
    }

    if (entity.parent) {
        model.parent = entity.parent._doc ? {
            id: entity.parent.id,
            thumbnail: entity.parent.thumbnail,
            name: entity.parent.name,
            isPublic: entity.parent.isPublic
        } : { id: entity.parent.toString() }
    }

    if (entity.owner && entity.owner._doc) {
        model.owner = {
            id: entity.owner.id,
            profile: {
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

    if (entity.folders && entity.folders.length) {
        entity.folders.forEach(folder => {
            model.folders.push({
                id: folder.id,
                thumbnail: folder.thumbnail,
                name: folder.name,
                description: folder.description,
                isPublic: folder.isPublic
            })
        })
    }

    if (entity.files && entity.files.length) {
        entity.files.forEach(file => {
            model.files.push({
                id: file.id,
                url: file.url,
                thumbnail: file.thumbnail,
                mimeType: file.mimeType,

                name: file.name,
                description: file.description,
                version: file.version,

                isTemplate: file.isTemplate,
                isVirtual: file.isVirtual,
                isPublic: file.isPublic
            })
        })
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map(entity => {
        return exports.toModel(entity)
    })
}
