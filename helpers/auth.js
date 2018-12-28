'use strict'

const contextBuilder = require('./context-builder')
const directory = require('../providers/directory')
const db = require('../models')

const fetch = (req, modelName, paramName) => {
    var value = req.query[`${modelName}-${paramName}`] || req.headers[`x-${modelName}-${paramName}`]
    if (!value && req.body[modelName]) {
        value = req.body[modelName][paramName]
    }
    if (!value) {
        return null
    }

    var model = {}
    model[paramName] = value
    return model
}

const setContextByUser = async (user, logger) => {
    let organization = null
    let tenant = null
    if (user.organization) {
        organization = user.organization
    } else if (user.role && user.role.organization) {
        organization = await db.organization.findOne({ code: user.role.organization.code })
    }

    if (user.tenant) {
        tenant = user.tenant
    } else if (user.role && user.role.tenant) {
        tenant = await db.tenant.findOne({ code: user.role.tenant.code })
    }

    return contextBuilder.create({
        user: user,
        organization: organization,
        tenant: tenant
    }, logger)
}

const extractRoleKey = async (roleKey, logger) => {
    let log = logger.start('extractRoleKey')
    let user = await db.user.findOne({ 'role.key': roleKey }).populate('organization tenant')

    if (user) {
        return setContextByUser(user, logger)
    }

    log.debug('key does not exit, checking with directory')

    let role = await directory.getRole(roleKey)

    if (!role) {
        throw new Error('invalid role key')
    }

    log.debug('got the data from directory, synchronizing it')

    user = await db.user.findOne({ 'role.id': role.id }).populate('organization tenant')
    if (user) {
        return setContextByUser(user, logger)
    }

    let tenant = await db.tenant.findOne({
        code: role.tenant.code
    })

    if (!tenant) {
        tenant = await new db.tenant({
            code: role.tenant.code,
            name: role.tenant.name
        }).save()
    }

    let organization = null
    if (role.organization) {
        organization = await db.organization.findOne({
            code: role.organization.code,
            tenant: tenant.id
        })

        if (!organization) {
            organization = await new db.organization({
                name: role.organization.name,
                code: role.organization.code,
                tenant: tenant
            }).save()
        }
    }

    user = await new db.user({
        role: {
            id: role.id,
            key: role.key,
            code: role.code,
            permissions: role.permissions
        },
        email: role.user.email,
        phone: role.user.phone,
        profile: {
            pic: {
                url: role.user.picUrl,
                thumbnail: role.user.picThumbnail
            },
            firstName: role.user.profile.firstName,
            lastName: role.user.profile.lastName,
            gender: role.user.profile.gender,
            dob: role.user.profile.dob
        },
        organization: organization,
        tenant: tenant
    }).save()

    return setContextByUser(user, logger)
}

exports.requiresRoleKey = (req, res, next) => {
    let log = res.logger.start('requiresRoleKey')
    var role = fetch(req, 'role', 'key')

    if (!role) {
        log.end()
        return res.accessDenied('x-role-key is required.', 403)
    }

    extractRoleKey(role.key, res.logger).then((context) => {
        if (!context) {
            log.error('context could not be created')
            return res.accessDenied('invalid user', 403)
        }
        context.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        req.context = context
        next()
    }).catch(err => {
        log.error(err)
        log.end()
        res.accessDenied('invalid user', 403)
    })
}
