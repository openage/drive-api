'use strict'

const webServer = require('config').get('webServer')

const sdk = require('hellosign-sdk')

const init = async (config, context) => {
    const callbackUrl = `${webServer.url}/api/files/hello-sign/success`
    var client = sdk({ key: config.key })
    if (config.callback_url !== callbackUrl) {
        await client.account.update({
            callback_url: callbackUrl
        })
    }

    return client
}

const send = async (file, config, context) => {
    const log = context.logger.start(`providers/genie-sign:send`)

    let client = await init(config, context)
    let files = []
    let path = file.content.path

    if (!file.signature.coverSheet.$isEmpty()) {
        files.push({
            url: file.signature.coverSheet.url,
            name: 'Cover Letter.pdf'
        })
    }

    files.push({
        // url: file.content.url,
        url: 'https://stage.openage.in/drive/api/docs/directory|employee|id-card/121031.docx?role-key=ed5e5bbf-5f66-efd0-8feb-6b278f920b04',
        name: path.substring(path.lastIndexOf('/') + 1, path.length)
    })

    // if (!file.signature.signatureSheet.$isEmpty()) {
    //     files.push({
    //         url: file.signature.signatureSheet.url,
    //         name: 'Signature Sheet.pdf'
    //     })
    // }

    let parties = []

    file.signature.parties.forEach(p => {
        (p.signers || []).forEach(s => {
            parties.push({
                name: `${s.profile.firstName} ${s.profile.lastName || ''}`.trim(),
                email_address: s.email
            })
        })
    })

    let payload = {
        test_mode: config.test_mode,
        title: file.name,
        subject: file.name,
        message: file.description || 'TODO',
        file_url: files.map(f => f.url),
        signers: parties
    }

    log.debug(`payload
        ${JSON.stringify(payload)}
    `)

    let response = await client.signatureRequest.send(payload)

    log.info(`id ${response.signature_request.signature_request_id}`)
    log.end()
    return {
        id: response.signature_request.signature_request_id
    }
}

const parse = (body, config, context) => {
    let result = {
        id: body.event.event_metadata.related_signature_id
    }

    switch (body.event.event_type) {
        case 'signature_request_all_signed':
            result.status = 'active'
            break

        case 'signature_request_declined':
            result.status = 'declined'
            break

        case 'signature_request_email_bounce':
        case 'signature_request_invalid':
        case 'unknown_error':
            result.status = 'errored'
            break

        case 'signature_request_canceled':
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
