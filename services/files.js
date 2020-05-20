'use strict'
const db = require('../models')
const entities = require('./entities')
const users = require('./users')
const folders = require('./folders')
const organizationService = require('./organizations')
const shareService = require('./shares')
const updatedScheme = require('../helpers/updateEntities')
const mm = require('music-metadata')
const btoa = require('btoa')
const fileTemplate = require('./file-templates')
const config = require('config')
const storeConfig = config.get('store')
const mammoth = require('mammoth')

const offline = require('@open-age/offline-processor')

const webServer = require('config').webServer

const populate = 'entity owner folder creator'

const set = async (model, entity, context) => {
    if (model.code && model.code !== entity.code) {
        model.code = model.code.trim().toLowerCase().replace(' ', '-')
        if (await this.get({
            code: model.code,
            owner: entity.owner
        }, context)) {
            throw new Error(`${model.code} already exists`)
        }

        entity.code = model.code
    }

    if (model.name) {
        entity.name = model.name
    }

    if (model.mimeType) {
        entity.mimeType = model.mimeType
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.entity) {
        entity.entity = await entities.get(model.entity, context)
    }

    if (model.folder) {
        let folder = await folders.get(model.folder, context)
        if (!folder) {
            folder = await folders.create(model.folder, context)
        }
        entity.isPublic = folder.isPublic // anything in public folder is public
        entity.folder = folder
        entity.folderName = folder.name
    }

    if (model.isPublic !== undefined) {
        entity.isPublic = model.isPublic
    }

    if (model.isVirtual !== undefined) {
        entity.isVirtual = model.isVirtual
    }

    if (model.isTemplate !== undefined) {
        entity.isTemplate = model.isTemplate

        if (model.isTemplate) {
            entity.mimeType = 'template'
        }
    }

    if (model.owner) {
        entity.owner = await users.get(model.owner, context)
    }

    if (model.tags) {
        entity.tags = model.tags
    }

    if (model.viewer) {
        entity.viewer = model.viewer
    }

    if (model.url) {
        entity.url = model.url
    }

    if (model.thumbnail) {
        entity.thumbnail = model.thumbnail
    }

    if (model.meta) {
        entity.meta = model.meta
    }

    if (model.content) {
        let content = await saveContent(model.content, context)
        entity.content = content
    }

    if (model.hooks) {
        entity.hooks = model.hooks.map(h => {
            return {
                trigger: h.trigger || 'active',
                url: h.url,
                action: h.action || 'POST',
                config: h.config || {},
                data: h.data
            }
        })
    }

    setSignature(entity, model.signature, context)

    if (model.status) {
        entity.status = model.status
    }
}

const setSignature = (entity, signature, context) => {
    if (!signature) {
        return
    }
    entity.signature = entity.signature || {}

    if (signature.signatureSheet) {
        let signatureSheet = signature.signatureSheet
        entity.signature.signatureSheet = entity.signature.signatureSheet || {}
        if (signatureSheet.url) {
            entity.signature.signatureSheet.url = signatureSheet.url
        } else if (signatureSheet.template) {
            entity.signature.signatureSheet.url = getUrl(
                signatureSheet.template.code || signatureSheet.template,
                entity.id, 'pdf', context)
        }
    }

    let order = 0
    entity.signature.parties = (signature.parties || []).map(p => {
        return {
            name: p.name,
            signers: (p.signers || []).map(s => {
                s.profile = s.profile || {}
                return {
                    order: ++order,
                    email: s.email,
                    profile: {
                        firstName: s.profile.firstName,
                        lastName: s.profile.lastName
                    },
                    meta: s.meta || {},
                    status: 'pending'
                }
            })
        }
    })

    if (signature.status) {
        entity.signature.status = signature.status
    }
}

const getUrl = (code, id, ext, context) => {
    return `${webServer.url}/api/docs/${code}/${id}.${ext}?role-key=${context.user.role.key}`
}
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

const saveContent = async (model, context) => {
    let entity = {}

    if (typeof model === 'string') {
        let store = {
            provider: 'html-store'
        }
        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model)
    } else if (model.body) {
        let store = {
            provider: 'html-store'
        }
        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model.body)
    } else if (model.file) {
        model.file.name = model.file.name.trim().replace(/ /g, '-')
        model.file.originalFilename = model.file.originalFilename.trim().replace(/ /g, '-')

        let store = getStore(context)
        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model.file)
    } else if (model.url) {
        entity = {
            url: model.content.url
        }
    }

    return entity
}

exports.create = async (model, context) => {
    // let file
    // let fileType

    // let content = {}

    if (!model.folder) {
        model.folder = {
            code: 'root',
            name: 'root',
            owner: model.owner || context.owner,
            isPublic: model.isPublic
        }
    }

    if (!model.name) {
        if (model.code) {
            model.name = model.code
        } else if (model.content && model.content.file) {
            model.name = model.content.file.name
        } else {
            model.name = 'No Name'
        }
    }

    if (!model.code) {
        if (model.name) {
            model.code = model.name
        }
    }

    if (!model.code || !model.name) {
        throw new Error('name or code is required')
    }

    if (model.template) {
        model = await fileTemplate.build(model, model.meta, context)
    }

    let existing = await this.get(model, context)

    if (existing && existing.status !== 'trash' && (model.overwrite === 'false' || model.overwrite === false)) {
        throw new Error('Already Exist')
    }

    let entity = new db.file({
        version: 1,
        status: 'active',
        owner: context.user,
        creator: context.user,
        organization: context.organization,
        tenant: context.tenant
    })

    await set(model, entity, context)

    if (existing) {
        existing.status = 'trash'
        await existing.save()
        entity.previous = {
            version: existing.version,
            file: existing,
            creator: existing.creator,
            timeStamp: existing.timeStamp
        }

        entity.version = ++existing.version
    }

    await entity.save()

    await offline.queue('file', entity.status, entity, context)

    return entity

    // let entityOrganization = await organizationService.get(model.entityOrganization || context.organization, context)

    // const existingFiles = await this.search(model, null, context)

    // let version = 0
    // let previous

    // let newFile

    // if (model.content && model.content.template) {
    //     entity = new db.file({
    //         isTemplate: true,
    //         mimeType: 'template',
    //         owner: context.user,
    //         creator: context.user,
    //         organization: context.organization,
    //         tenant: context.tenant
    //     })

    //     set(model, newFile, context)
    // } else {
    //     newFile = new db.file({
    //         content: content,
    //         size: model.file ? model.file.size : null,
    //         path: file ? file.path : '',
    //         isPublic: model.isPublic,
    //         isVirtual: model.isVirtual,
    //         isTemplate: model.isTemplate,
    //         mimeType: model.file ? model.file.type : null,
    //         creator: context.user,
    //         store: store.provider,
    //         entityOrganization: entityOrganization,
    //         organization: context.organization,
    //         tenant: context.tenant
    //     })
    // }

    // if (existingFiles && existingFiles.length) {
    //     for (let fileItem of existingFiles) {
    //         if (fileItem.name == newFile.name) {
    //             version = fileItem.version
    //             previous = {
    //                 version: fileItem.version,
    //                 path: fileItem.path,
    //                 url: fileItem.url,
    //                 creator: fileItem.creator,
    //                 timeStamp: fileItem.timeStamp
    //             }
    //             await fileItem.remove()
    //         }
    //     }
    // }

    // newFile.version = ++version
    // newFile.previous = previous

    // await newFile.save()

    // return newFile
}

// const getByFilesName = async (query, context) => {
//     if (query.file) {
//         query.file.name = query.file.name.trim().replace(/ /g, '_')
//         query.file.originalFilename = query.file.originalFilename.trim().replace(/ /g, '_')
//     }

//     let where = {
//         tenant: context.tenant.id
//     }

//     if (query.folder && query.folder.id) {
//         where.folder = query.folder.id
//     } else if (query.folder && query.folder.name) {
//         where['tags'] = {
//             $in: query.folder.name
//         }
//     }

//     if (query.owner) {
//         let owner = await users.get(query.owner, context)
//         if (owner) {
//             where.owner = owner.id
//         }
//     }

//     if (query.entity) {
//         where.entity = (await entities.get(query.entity, context)).id
//     }

//     if (query.file && query.file.name) {
//         where.name = query.file.name
//     }

//     return db.file.find(where)
// }

exports.emptyTrash = async (context) => {
    let trash = await this.search({ status: 'trash' }, null, context)

    let count = trash.count
    for (const item of trash.items) {
        await item.delete()
    }

    return count
}

exports.remove = async (id, context) => {
    if (id === 'trash') {
        return this.emptyTrash(context)
    }
    let entity = await this.get(id, context)
    entity.status = 'trash'
    await entity.save()
    await offline.queue('file', 'trash', entity, context)
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.file.findById(query).populate(populate)
        }
        let where = {
            code: query.toLowerCase(),
            status: { $ne: 'trash' },
            tenant: context.tenant
        }
        if (context.user) {
            where.owner = context.owner
            // TODO: add shared with me
        } else {
            where.isPublic = true
        }

        if (context.organization) {
            where.organization = context.organization
        }

        return db.file.findOne(where).populate(populate)
    }

    if (query.id) {
        return db.file.findById(query.id).populate(populate)
    }

    if (query.trackingId) {
        return db.file.findOne({
            trackingId: query.trackingId
        }).populate(populate)
    }

    if (query['signature.trackingId']) {
        return db.file.findOne({
            'signature.trackingId': query['signature.trackingId']
        }).populate(populate)
    }

    if (!query.code || !(query.folder || query.entity)) {
        return
    }

    let where = {
        code: query.code.toLowerCase(),
        status: { $ne: 'trash' },
        tenant: context.tenant
    }

    if (!context.user) {
        where.isPublic = true
    }

    if (query.folder) {
        where.folder = await folders.get(query.folder, context)
    }

    if (query.entity) {
        where.entity = await entities.get(query.entity, context)
    }

    if (query.owner) {
        where.owner = await users.get(query.owner, context)
    }

    if (query.version) {
        where.version = query.version
    }

    if (where.isPublic && !(where.entity || where.owner)) {
        throw new Error('INVALID_REQUEST')
    }

    if (!where.isPublic && !(where.entity || where.owner)) {
        where.owner = context.user
    }

    return db.file.findOne(where).populate(populate)
}

exports.search = async (query, paging, context) => {
    let log = context.logger.start('services/files:search')

    if (query.isFavourite || query.shared) {
        let shared = await shareService.get({
            user: context.user,
            filesOnly: true,
            isFavourite: query.isFavourite
        }, context)

        return {
            items: shared.items.map(item => {
                let file = item.file
                file.isFavourite = true
                return file
            })
        }
    }

    let sorting = 'name'
    if (paging && paging.sort) {
        sorting = paging.sort
    }

    let sort = {}

    switch (sorting) {
        case 'recent':
            sort.timeStamp = -1
            break
        case 'timeStamp':
            sort.timeStamp = -1
            break
        case 'name':
            sort.name = 1
            break
        case 'isMostViewed':
            sort.views = -1
            break
        case 'views':
            sort.views = -1
            break
    }

    if (query.isMostViewed) {
        sort = {
            views: -1
        }
    }

    let where = {
        tenant: context.tenant
    }

    if (query.isPublic !== undefined) {
        where.isPublic = !!(query.isPublic === 'true' || query.isPublic === true)
    }

    if (query.entityOrganization) { // TODO: obsolete
        query.organization = query.entityOrganization
    }

    if (query.organization) {
        where.organization = await organizationService.get(query.organization, context)
        where.isPublic = true
    }

    if (!context.user) {
        where.isPublic = true
    }
    if (!where.isPublic) {
        // limit the user to internal files only
        where.organization = context.organization
    }

    if (query.folder) {
        let folderQuery = query.folder
        if (!context.user) {
            folderQuery.isPublic = true
        }

        if (query.owner) {
            folderQuery.owner = query.owner
        }
        where.folder = await folders.get(query.folder, context)
    }

    if (query.tag && query.tag !== 'all') {
        where['tags'] = {
            $in: Array.isArray(query.tag) ? query.tag : [query.tag]
        }
    }

    if (query.owner) {
        where.owner = await users.get(query.owner, context)
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

    if (where.isPublic && !(where.entity || where.owner)) {
        throw new Error('INVALID_REQUEST')
    }

    if (!where.isPublic && !(where.entity || where.owner)) {
        where.owner = context.user
    }

    let count = 0
    let items
    if (paging) {
        items = await db.file.find(where).sort(sort).skip(paging.skip).limit(paging.limit).populate(populate)
        count = await db.file.find(where).count()
    } else {
        items = await db.file.find(where).sort(sort).populate(populate)
        count = items.length
    }
    log.end()

    return {
        count: count,
        items: items
    }

    // let entityFiles = []
    // let favoriteFiles = []
    // if (query.isRecent) {
    //     let recentFiles = await db.file.find(query).sort({ _id: -1 }).limit(10)

    //     for (let index = 0; index < favoriteFiles.length; index++) {
    //         let favoriteFile = favoriteFiles[index].file
    //         let file = recentFiles.find(item => item.id === favoriteFile.id)
    //         if (file) {
    //             file.isFavourite = true
    //         }
    //     }

    //     return recentFiles
    // }

    // let files = await db.file.find(where).sort(sort).populate(populate)

    // let fileNames = files.map(file => file.name)

    // if (where.entity && where.entity.entityType) {
    //     let query = {
    //         tenant: context.tenant,
    //         entityType: where.entity.entityType
    //     }

    //     if (context.organization) {
    //         query.organization = context.organization
    //     }

    //     // entityFiles = await db.entityFile.find({
    //     //     $and: [query, {
    //     //         name: {
    //     //             $nin: fileNames
    //     //         }
    //     //     }]
    //     // })
    // }

    // for (let index = 0; index < favoriteFiles.length; index++) {
    //     let favoriteFile = favoriteFiles[index].file
    //     let file = files.find(item => item.id === favoriteFile.id)
    //     if (file) {
    //         file.isFavourite = true
    //     }
    // }

    // return files.concat(entityFiles)
}

exports.update = async (id, model, context) => {
    let log = context.logger.start('services/files:update')

    let entity = await this.get(id, context)

    let status = entity.status

    let isFavourite = !!(model.isFavourite === 'true' || model.isFavourite === true)

    if (isFavourite) {
        await shareService.getOrCreate({
            date: new Date(),
            file: entity,
            isFavourite: isFavourite,
            createdBy: context.user
        }, context)
    } else if ((model.isFavourite === false) || (model.isFavourite === 'false')) {
        let share = await shareService.getOne({
            file: entity,
            isFavourite: true,
            createdBy: context.user
        }, context)

        if (share) {
            share.isFavourite = false
            await share.save()
        }
    }

    await set(model, entity, context)

    await entity.save()

    if (entity.status !== status) {
        await offline.queue('file', entity.status, entity, context)
    }

    log.end()
    return entity
}

exports.streams = async (docId, range, target, context) => {
    let log = context.logger.start('services/files:streams')

    log.debug(`Start finding document for id: ${docId} ...`)

    let document = await this.get(docId, context)

    if (!document) {
        throw new Error(`no such document of id: ${docId} found`)
    }

    log.info(`document found`)

    document.views = document.views + 1

    await document.save()

    await shareService.create({
        createdBy: context.user,
        file: document,
        date: new Date()
    }, context)

    let documentStoreConfig = require('config').get(`providers.${document.store}`)

    let provider = require(`../providers/${document.store}`)

    return provider.config(documentStoreConfig).streamFile({
        key: document.name,
        range: range
    }, target)
}

exports.toHtml = async (file, context) => {
    var result = await mammoth.convertToHtml(file)

    return result.value
}

// const getById = async (id, context) => {
//     let log = context.logger.start('services/files:getById')

//     let file = await db.file.findById(id).populate('entity owner folder creator')

//     file.views = file.views + 1

//     await file.save()

//     let share = await shareService.getOne({
//         createdBy: context.user,
//         file: file.id,
//         isFavourite: false
//     }, context)

//     if (!share) {
//         await shareService.create({
//             createdBy: context.user,
//             file: file.id,
//             isFavourite: false,
//             date: new Date()
//         }, context)
//     } else {
//         share.date = new Date()
//         share.save()
//     }

//     log.end()
//     return file
// }

// const audioThumbnail = async (filePath) => {
//     let metadata = await mm.parseFile(filePath, { native: false })
//         .catch(err => {
//             console.error(err.message)
//             throw new Error(err)
//         })

//     let imageBuffer = null

//     if (metadata && metadata.common && metadata.common.picture && metadata.common.picture.length) {
//         imageBuffer = metadata.common.picture[0]
//     }

//     if (!imageBuffer) { return '' }

//     let base64String = ''
//     for (var i = 0; i < imageBuffer.data.length; i++) {
//         base64String += String.fromCharCode(imageBuffer.data[i])
//     }

//     return 'data:' + imageBuffer.format + ';base64,' + btoa(base64String)
// }
