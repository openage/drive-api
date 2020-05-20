'use strict'

const profileMapper = require('./profile')
const setProfile = (profile, context) => {
    if (!profile) {
        return { pic: {} }
    }
    let model = {
        firstName: profile.firstName,
        lastName: profile.lastName
    }

    if (profile.pic) {
        model.pic = {
            url: profile.pic.url,
            thumbnail: profile.pic.thumbnail
        }
    }

    return model
}

exports.toModel = (entity, context) => {
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    const model = {
        id: entity.id,
        code: entity.code,
        email: entity.email,
        phone: entity.phone,
        status: entity.status,
        profile: profileMapper.toModel(entity.profile, context),
        recentLogin: entity.recentLogin
    }

    // todo add config

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
        profile: setProfile(entity.profile, context)
    }
}
