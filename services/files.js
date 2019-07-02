'use strict'
const db = require('../models')
const entities = require('./entities')
const users = require('./users')
const folders = require('./folders')
const organizationService = require('./organizations')
const imageService = require('./images')
const shareService = require('./shares')
const updatedScheme = require('../helpers/updateEntities')
const mm = require('music-metadata')
const btoa = require('btoa')

const config = require('config')
const storeConfig = config.get('store')

const getStore = context => {
    if (context.organization && context.organization.store && context.organization.store.provider) {
        return context.organization.store
    } else if (context.tenant && context.tenant.store && context.tenant.store.provider) {
        return context.tenant.store
    } else {
        return {
            provider: storeConfig.provider,
            config: config.get(`providers.${storeConfig.provider}`)
        }
    }
}

const create = async (model, context) => {
    let store = getStore(context)

    let fileType = model.file.type.split('/')[0] // TODO:
    let thumbnail = ''

    if (fileType === 'audio') {
        thumbnail = await audioThumbnail(model.file.path)
    }

    let provider = require(`../providers/${store.provider}`)

    let file = await provider.config(store.config).store(model.file)

    if (fileType !== 'audio') {
        thumbnail = await imageService.thumbnailFromUrl(file.url)
    }

    let entity = await entities.get(model.entity, context)

    if (!entity) {
        throw new Error('entity is required')
    }

    let owner = await users.get(model.owner, context) || context.user

    if (model.folder) {
        model.folder.isPublic = model.isPublic
    }

    let folder = await folders.get(model.folder || {
        name: 'root',
        owner: owner,
        isPublic: true
    }, context)

    let entityOrganization = await organizationService.get(model.entityOrganization || context.organization, context)

    if (model.isPublic === undefined) {
        model.isPublic = folder.isPublic
    }

    let tags = {
        folder: folder.name
    }

    const existingFiles = await search(model, context)

    let version = 0
    let previous

    let newFile = new db.file({
        entity: entity,
        url: file.url,
        thumbnail: thumbnail,
        path: file.path,
        identifier: model.identifier,
        isPublic: model.isPublic,
        isVirtual: model.isVirtual,
        isTemplate: model.isTemplate,
        name: model.name || model.file.name,
        mimeType: model.file.type,
        folder: folder,
        tags: tags,
        owner: owner,
        uploadedBy: context.user,
        store: store.provider,
        entityOrganization: entityOrganization,
        organization: context.organization,
        tenant: context.tenant
    })

    if (existingFiles && existingFiles.length) {
        for (let fileItem of existingFiles) {
            if (fileItem.name == newFile.name) {
                version = fileItem.version
                previous = {
                    version: fileItem.version,
                    path: fileItem.path,
                    url: fileItem.url,
                    uploadedBy: fileItem.uploadedBy,
                    timeStamp: fileItem.timeStamp
                }
                await fileItem.remove()
            }
        }
    }

    newFile.version = ++version
    newFile.previous = previous

    await newFile.save()

    return newFile
}

const remove = async (id, context) => {
    let file = await db.file.findById(id)

    file.status = 'trash'

    return file.save()
}

const get = async (query, context) => {
    let where = {
        tenant: context.tenant.id
    }

    if (query.folder && query.folder.id) {
        where.folder = query.folder.id
    } else if (query.folder && query.folder.name) {
        where['tags.folder'] = query.folder.name
    }

    if (query.owner) {
        let owner = await users.get(query.owner, context)
        if (owner) {
            where.owner = owner.id
        }
    }

    if (query.entity) {
        where.entity = (await entities.get(query.entity, context)).id
    }

    if (query.name) {
        where.name = query.name
    }

    if (query.version) {
        where.version = query.version
    }

    return db.file.findOne(where).populate('entity owner folder uploadedBy')
}

const search = async (query, context) => {
    let log = context.logger.start('services:files:search')

    let entityFiles = []
    let favoriteFiles = []
    let sortQuery = {
        _id: -1
    }

    let where = {
        tenant: context.tenant.id
    }

    if (query.isMostViewed) {
        sortQuery = {
            views: -1
        }
    }

    if (query.folder && query.folder.id) {
        where.folder = query.folder.id
    } else if (query.folder && query.folder.name) {
        where['tags.folder'] = query.folder.name
    }

    favoriteFiles = await shareService.get({
        tenant: context.tenant.id,
        createdBy: context.user,
        isFavourite: true
    }, context)

    if (query.isFavourite) {
        let files = favoriteFiles.map(item => {
            let file = item.file
            file.isFavourite = true
            return file
        })
        return files
    }

    if (query.isRecent) {
        let recentFiles = await db.share.find({
            tenant: context.tenant.id,
            createdBy: context.user,
            isFavourite: false
        }).sort({ _id: -1 }).populate('file')

        for (let index = 0; index < favoriteFiles.length; index++) {
            let favoriteFile = favoriteFiles[index].file
            let file = recentFiles.find(item => item.id === favoriteFile.id)
            if (file) {
                file.isFavourite = true
            }
        }

        let retVals = []
        recentFiles.forEach(item => {
            if (item && item.file && item.file.id) {
                retVals.push(item.file)
            }
        })
        return retVals
    }

    if (query.owner) {
        let owner = await users.get(query.owner, context)
        if (owner) {
            where.owner = owner.id
        }
    }

    if (query.entityOrganization) {
        let entityOrganization = await organizationService.get(query.entityOrganization, context)
        if (entityOrganization) {
            where.entityOrganization = entityOrganization.id
        }
    }

    if (query.entity) {
        where.entity = await entities.get(query.entity, context)
    }

    if (query.name) {
        where.name = {
            $regex: '^' + query.name,
            $options: 'i'
        }
    }

    if (query.status) {
        where.status = query.status
    } else {
        where.status = {
            $ne: 'trash'
        }
    }

    let files = await db.file.find(where).sort(sortQuery).populate('entity owner folder uploadedBy')

    let fileNames = files.map(file => file.name)

    if (where.entity && where.entity.entityType) {
        let query = {
            tenant: context.tenant,
            entityType: where.entity.entityType
        }

        if (context.organization) {
            query.organization = context.organization
        }

        entityFiles = await db.entityFile.find({
            $and: [query, {
                name: {
                    $nin: fileNames
                }
            }]
        })
    }

    for (let index = 0; index < favoriteFiles.length; index++) {
        let favoriteFile = favoriteFiles[index].file
        let file = files.find(item => item.id === favoriteFile.id)
        if (file) {
            file.isFavourite = true
        }
    }

    log.end()
    return files.concat(entityFiles)
}

const update = async (model, fileId, context) => {
    let log = context.logger.start('services/files:update')

    let existingFile = await db.file.findById(fileId)

    let isFavourite = !!(model.isFavourite === 'true' || model.isFavourite === true)

    if (isFavourite) {
        await shareService.getOrCreate({
            date: new Date(),
            file: existingFile,
            isFavourite: isFavourite,
            createdBy: context.user
        }, context)
    } else if ((model.isFavourite === false) || (model.isFavourite === 'false')) {
        let share = await shareService.getOne({
            file: existingFile,
            isFavourite: true,
            createdBy: context.user
        }, context)

        if (share) {
            share.isFavourite = false
            await share.save()
        }
    }

    let updatedFile = updatedScheme.update(model, existingFile)
    await updatedFile.save()

    log.end()
    return updatedFile
}

const streams = async (docId, range, target, context) => {
    let log = context.logger.start('services/files:streams')

    log.debug(`Start finding document for id: ${docId} ...`)

    let document = await db.file.findById(docId)

    if (!document) {
        throw new Error(`no such document of id: ${docId} found`)
    }

    log.info(`document found`)

    document.views = document.views + 1

    await document.save()

    await shareService.create({
        createdBy: context.user,
        file: document.id,
        date: new Date()
    }, context)

    let documentStoreConfig = require('config').get(`providers.${document.store}`)

    let provider = require(`../providers/${document.store}`)

    return provider.config(documentStoreConfig).streamFile({
        key: document.name,
        range: range
    }, target)
}

const getById = async (id, context) => {
    let log = context.logger.start('services/files:getById')

    let file = await db.file.findById(id).populate('entity owner folder uploadedBy')

    file.views = file.views + 1

    await file.save()

    let share = await shareService.getOne({
        createdBy: context.user,
        file: file.id,
        isFavourite: false
    }, context)

    if (!share) {
        await shareService.create({
            createdBy: context.user,
            file: file.id,
            isFavourite: false,
            date: new Date()
        }, context)
    } else {
        share.date = new Date()
        share.save()
    }

    log.end()
    return file
}

const audioThumbnail = async (filePath) => {
    let metadata = await mm.parseFile(filePath, { native: false })
        .catch(err => {
            console.error(err.message)
            throw new Error(err)
        })

    let imageBuffer = null

    if (metadata && metadata.common && metadata.common.picture && metadata.common.picture.length) {
        imageBuffer = metadata.common.picture[0]
    }

    if (!imageBuffer) { return '' }

    let base64String = ''
    for (var i = 0; i < imageBuffer.data.length; i++) {
        base64String += String.fromCharCode(imageBuffer.data[i])
    }

    return 'data:' + imageBuffer.format + ';base64,' + btoa(base64String)
}

exports.get = get
exports.getById = getById
exports.create = create
exports.update = update
exports.search = search
exports.remove = remove
exports.streams = streams
