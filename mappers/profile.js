'use strict'

const imageMapper = require('./image')

exports.toModel = (entity, context) => {
    if (!entity) {
        return null
    }
    return {
        firstName: entity.firstName,
        lastName: entity.lastName,
        dob: entity.dob,
        age: entity.age,
        gender: entity.gender,
        pic: imageMapper.toModel(entity.pic, context)
    }
}
