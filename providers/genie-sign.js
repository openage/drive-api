'use strict'

const webServer = require('config').get('webServer')

const request = require('request')

const startSession = (config) => {
    return new Promise((resolve, reject) => {
        return request.post({
            url: `${config.url}/oauth2/access_token`,
            headers: {
                'Content-Type': 'application/x-www-form-URLencoded'
            },
            form: {
                grant_type: 'client_credentials',
                client_id: config.apikey,
                client_secret: config.clientSecret,
                scope: 'read-write'
            }
        }, (err, response, body) => {
            if (err || response.statusCode !== 200) {
                return reject(err || new Error('genie authentication failed'))
            }
            return resolve(JSON.parse(body))
        })
    })
}

// const getPageCount = async (path) => {
//     return new Promise((resolve, reject) => {
//         return pdfjs.getDocument(path).promise.then((doc) => {
//             return resolve(doc.numPages)
//         })
//     })
// }

const getParties = (signers) => {
    let parties = []

    signers.forEach((signer, index) => {
        let recipient = {
            firstName: signer.profile.firstName,
            lastName: signer.profile.lastName,
            emailId: signer.email,
            permission: signer.permission || 'FILL_FIELDS_AND_SIGN',
            sequence: index + 1
        }
        parties.push(recipient)
    })

    return parties
}

const send = async (file, config, context) => {
    const log = context.logger.start(`providers/genie-sign:send`)

    log.debug('activating session')

    let session = await startSession(config)

    // let pages = await getPageCount(contract.filePath)

    let files = []

    let path = file.content.path

    if (!file.signature.coverSheet.$isEmpty()) {
        files.push({
            url: file.signature.coverSheet.url,
            name: 'Cover Letter.pdf'
        })
    }

    files.push({
        url: file.content.url,
        name: path.substring(path.lastIndexOf('/') + 1, path.length)
    })

    if (!file.signature.signatureSheet.$isEmpty()) {
        files.push({
            url: file.signature.signatureSheet.url,
            name: 'Signature Sheet.pdf'
        })
    }

    let parties = []

    file.signature.parties.forEach(p => {
        (p.signers || []).forEach(s => {
            parties.push({
                firstName: s.profile.firstName,
                lastName: s.profile.lastName,
                emailId: s.email,
                permission: s.permission || 'FILL_FIELDS_AND_SIGN',
                sequence: s.order
            })
        })
    })

    let payload = {
        folderName: file.name,
        fileUrls: files.map(f => f.url),
        fileNames: files.map(f => f.name),
        parties: parties,
        sendSuccessUrl: `${webServer.url}/api/files/genie-sign/success`,
        sendErrorUrl: `${webServer.url}/api/files/genie-sign/error`,

        sendNow: true,
        hideDeclineToSign: true,
        hideMoreAction: true,
        hideAddPartiesOption: true,



        processTextTags: true,
        signInSequence: false,
        createEmbeddedSendingSession: false,
        fixRecipientParties: true,
        fixDocuments: true,
        createEmbeddedSigningSession: false,
        createEmbeddedSigningSessionForAllParties: true


    }

    // if (config.templateIds && config.templateIds.length) {
    //     payload.applyTemplate = true
    //     payload.templateIds = config.templateIds
    // }

    log.debug(`payload
        ${JSON.stringify(payload)}
    `)

    return new Promise((resolve, reject) => {
        return request.post({
            url: `${config.url}/folders/createfolder`,
            headers: {
                'Authorization': `Basic ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            qs: {
                'access_token': session.access_token
            },
            json: payload
        }, (err, response, body) => {
            if (err || response.statusCode !== 200 || (body && body.result === 'error')) {
                let error = err
                if (!error && body && body.error_description) {
                    error = new Error(body.error_description)
                }
                if (!error && response.statusCode !== 200) {
                    error = new Error(JSON.stringify(response))
                }

                if (!error) {
                    error = new Error('unknown error')
                }
                log.error(error)
                log.end()
                return reject(error)
            }

            log.info(`folder id ${body.folder.folderId}`)
            log.end()
            return resolve({
                id: body.folder.folderId
            })
        })
    })
}

const parse = (body, config, context) => {
    let folder = body.data.folder

    let result = {
        id: folder.folderId
    }

    switch (body.event_name) {
        case 'folder_signed':
            result.signers = [{
                email: body.data['signing_party'].emailId,
                status: 'signed'
            }]
            break
        case 'folder_viewed':
            result.signers = [{
                email: body.data['viewing_party'].emailId,
                status: 'viewed'
            }]
            break
        case 'folder_sent':
            result.status = 'submitted'
            break
        case 'folder_executed':
            result.status = 'active'
            break
        case 'folder_cancelled':
            result.status = 'canceled'
            break
        case 'folder_deleted':
            result.status = 'archived'
            break
    }

    context.logger.debug(`result id: ${result.id}, status: ${result.status}`)

    return result
}

exports.config = function (config) {
    return {
        send: async (file, context) => {
            return send(file, config, context)
        },
        parse: (data, context) => {
            return parse(data, config, context)
        }
    }
}
