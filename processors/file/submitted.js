'use strict'

exports.process = async (file, context) => {
    let log = context.logger.start('processors/file/submitted')

    if (!file || !file.signature || !file.signature.parties || !file.signature.parties.length) {
        return
    }

    let sign = context.tenant.sign

    if (context.organization && !context.organization.sign.$isEmpty()) {
        sign = context.organization.sign
    }

    if (!sign || sign.$isEmpty()) {
        return
    }

    let provider = require(`../../providers/${sign.provider}`)

    let result = await provider.config(sign.config).send(file, context)

    file.signature.parties.forEach(p => (p.signers || []).forEach(s => { s.status = 'sent' }))
    file.signature.status = 'sent'
    file.signature.trackingId = `${result.id}`

    await file.save()
}
