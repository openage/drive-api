'use strict'

const emsConfig = require('config').get('providers.directory')
const logger = require('@open-age/logger')('providers.ems')
const Client = require('node-rest-client-promise').Client
const client = new Client()

let parsedConfig = (config) => {
    config = config || {}

    return {
        url: config.url || emsConfig.url,
        tenantKey: config.api_key || emsConfig.api_key,
        lastSyncDate: config.lastSyncDate
    }
}

exports.getRole = (roleKey) => {
    let log = logger.start('getMyRole')

    let config = parsedConfig()
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'x-role-key': roleKey
        }
    }

    return new Promise((resolve, reject) => {
        const url = `${config.url}/api/roles/my`
        log.info(`getting role from ${url}`)

        return client.get(url, args, (data, response) => {
            if (!data || !data.isSuccess) {
                return reject(new Error())
            }
            return resolve(data.data)
        })
    })
}

exports.getRoleById = (id) => {
    logger.start('getRoleById')

    let config = parsedConfig()
    let args = {
        headers: {
            'Content-Type': 'application/json',
            'x-role-key': config.tenantKey // TODO: was ["external-token"];
        }
    }

    return new Promise((resolve, reject) => {
        const url = `${config.url}/api/employees/${id}`

        return client.get(url, args, (data, response) => {
            if (!data || !data.isSuccess) {
                return reject(new Error())
            }

            return resolve(data.data)
        })
    })
}
