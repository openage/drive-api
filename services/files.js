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

const populate = 'entity owner folder creator previous.file previous.creator viewers.user'

const getIndex = (array, user) => {
    let index
    let i = 0
    for (const item of array) {
        if (item.user.id == user.id) {
            index = i
        }
        i++
    }
    return index
}

const markLastView = (lastView, file, user) => {
    if (file.viewers && file.viewers.length) {
        let index = getIndex(file.viewers, user)
        if (index >= 0) {
            file.viewers[index].lastView = Number(lastView)
        } else {
            file.viewers.push({
                lastView: Number(lastView),
                views: 1,
                timeStamp: new Date(),
                user: user
            })
        }
    } else {
        file.viewers = [{
            lastView: Number(lastView),
            views: 1,
            timeStamp: new Date(),
            user: user
        }]
    }
}

const marViewed = async (file, user) => {
    if (file.viewers && file.viewers.length) {
        let index = getIndex(file.viewers, user)
        if (index >= 0) {
            file.viewers[index].views = ++file.viewers[index].views
        } else {
            file.viewers.push({
                views: 1,
                timeStamp: new Date(),
                user: user
            })
        }
    } else {
        file.viewers = [{
            views: 1,
            timeStamp: new Date(),
            user: user
        }]
    }
    file.save()
}

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

    if (model.orderNo) {
        entity.orderNo = Number(model.orderNo)
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

    if (model.isEnabled !== undefined) {
        entity.isEnabled = model.isEnabled
    }

    if (model.isVirtual !== undefined) {
        entity.isVirtual = model.isVirtual
    }

    if (model.isRequired !== undefined) {
        entity.isRequired = model.isRequired
    }

    if (model.isPlaceholder !== undefined) {
        entity.isPlaceholder = model.isPlaceholder
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
        if (!Array.isArray(model.tags)) {
            model.tags = model.tags.split(',')
        }
        entity.tags = model.tags
    }

    if (model.viewer) {
        entity.viewer = model.viewer
    }

    if (model.lastView) {
        markLastView(model.lastView, entity, context.user)
    }

    if (model.url) {
        entity.content = entity.content || {}
        entity.content.url = model.url
    }

    if (model.thumbnail) {
        entity.content = entity.content || {}
        entity.content.thumbnail = model.thumbnail
    }

    if (model.mimeType) {
        entity.content = entity.content || {}
        entity.content.mimeType = model.mimeType
    }

    if (model.meta) {
        entity.meta = entity.meta || {}
        Object.getOwnPropertyNames(model.meta).forEach(key => {
            entity.meta[key] = model.meta[key]
        })
        entity.markModified('meta')
    }

    if (model.content !== undefined) {
        if(model.content === null) {
            entity.content = {
                body: undefined,
                template: entity.template,
                path: undefined,
                provider: undefined, 
                url: entity.url,
                mimeType: undefined,
                thumbnail: undefined,
                size: 0
            }
        } else {
            let content = await saveContent(model.content, context)
            entity.content = content
            if (model.version && entity.status === 'active') {
                entity.version = model.version
            }
        }
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
    let log = context.logger.start('services/files:getStore')
    if (context.organization && context.organization.store && context.organization.store.provider) {
        log.debug(`store: ${context.organization.store.provider}`)
        return context.organization.store
    } else if (context.tenant && context.tenant.store && context.tenant.store.provider) {
        log.debug(`store: ${context.tenant.store.provider}`)
        return context.tenant.store
    } else {
        log.debug(`store: ${storeConfig.provider}`)
        return {
            provider: storeConfig.provider,
            config: config.get(`providers.${storeConfig.provider}`)
        }
    }
}

const saveContent = async (model, context) => {
    let entity = {}

    let log = context.logger.start('services/files:saveContent')

    log.silly(model)
    if (typeof model === 'string') {
        let store = {
            provider: 'html-store'
        }
        log.debug(`saving html with ${store.provider}`)

        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model)
    } else if (model.json) {
        let store = {
            provider: 'json-store'
        }
        log.debug(`saving json with ${store.provider}`)

        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model.json)
    } else if (model.body || model.html) {
        let store = {
            provider: 'html-store'
        }
        log.debug(`saving html with ${store.provider}`)

        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model.body || model.html)
    } else if (model.file) {
        model.file.name = model.file.name.trim().replace(/ /g, '-')
        model.file.originalFilename = model.file.originalFilename.trim().replace(/ /g, '-')

        let store = getStore(context)
        log.debug(`saving file:${model.file} with ${store.provider}`)
        let provider = require(`../providers/${store.provider}`)
        entity = await provider.config(store.config).store(model.file)
    } else if (model.url) {
        log.debug(`saving url: ${model.url}`)

        entity = {
            url: model.content.url
        }
    } else {
        log.error(`could not determine the provider`)
    }

    log.end()

    return entity
}

exports.create = async (model, context) => {
    if (!model.folder) {
        model.folder = {
            code: 'root',
            name: 'root',
            owner: model.owner || context.owner,
            isPublic: model.isPublic
        }
    }

    if (model.template) {
        model = await fileTemplate.build(model, model.meta, context)
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

    let existing = await this.get(model, context)

    if (existing && existing.status !== 'trash' && (model.overwrite === 'false' || model.overwrite === false)) {
        throw new Error('Already Exist')
    }

    if (existing ) {
        // copy over attributes from previous version
        if(!model.meta) {
            model.meta = existing.meta
        }

        if(model.isPlaceholder === undefined) {
            model.isPlaceholder = existing.isPlaceholder
        }

        if(model.isRequired === undefined) {
            model.isRequired = existing.isRequired
        }
    }

    let entity = new db.file({
        version: 1,
        status: 'active',
        owner: context.user,
        creator: context.user,
        organization: context.organization,
        tenant: context.tenant,
        isEnabled: true,
        timeStamp: new Date()
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
    //         if (fileItem.name === newFile.name) {
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
    let trash = await this.search({
        status: 'trash'
    }, null, context)

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
    let entity
    if (id.isObjectId()) {
        entity = await this.get({
            id: id
        }, context, false)
    } else {
        entity = await this.get(id, context, false)
    }
    if (!entity) {
        return
    }

    if (entity.isPlaceholder) {
        return this.flush(id, context)
    }

    entity.status = 'trash'
    await entity.save()
    await offline.queue('file', 'trash', entity, context)
}

exports.flush = async (id, context) =>{
    return this.update(id,  {
        content: null
    }, context)
}

exports.get = async (query, context, markViewed = true) => {
    let file

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            file = await db.file.findById(query).populate(populate)
            if (file) { return file }
        }
        let where = {
            code: query.toLowerCase(),
            status: {
                $ne: 'trash'
            },
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

        file = await db.file.findOne(where).populate(populate)
    }

    if (query.id) {
        file = await db.file.findById(query.id).populate(populate)
    }

    if (query.trackingId) {
        file = await db.file.findOne({
            trackingId: query.trackingId
        }).populate(populate)
    }

    if (query['signature.trackingId']) {
        file = await db.file.findOne({
            'signature.trackingId': query['signature.trackingId']
        }).populate(populate)
    }

    if ((!query.code || !(query.folder || query.entity)) && !file) {
        return
    }

    if (!file) {
        let where = {
            code: query.code.trim().toLowerCase().replace(' ', '-'),
            status: {
                $ne: 'trash'
            },
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

        context.logger.debug('where')
        context.logger.debug(where)

        file = await db.file.findOne(where).populate(populate)
    }

    if (file && markViewed) {
        marViewed(file, context.user)
    }

    return file
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

    let sorting = 'recent'
    if (paging && paging.sort) {
        sorting = paging.sort
    }

    let sort = {
        orderNo: -1
    }

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

    if (query.isEnabled !== undefined) {
        where.isEnabled = !!(query.isEnabled === 'true' || query.isEnabled === true)
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

    if (query.code) {
        where.code = query.code
    }

    if (query.status) {
        where.status = query.status
    } else {
        where.status = {
            $ne: 'trash'
        }
    }

    // if (where.isPublic && !(where.entity || where.owner)) {
    //     throw new Error('INVALID_REQUEST')
    // }

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

    let entity = await this.get(id, context, false)

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
        let share = await shareService.get({
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
