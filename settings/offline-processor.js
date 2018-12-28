'use strict'

const queueConfig = require('config').get('queueServer')

exports.configure = function (logger) {
    let log = logger.start('settings/offline-processors:configure')
    let config = JSON.parse(JSON.stringify(queueConfig))
    config.context = require('../helpers/context-builder')
    require('@open-age/offline-processor').initialize(config, log)
}
