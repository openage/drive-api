'use strict'
const webServer = require('config').webServer

var about = require('../package.json')

const spec = {
    swagger: '2.0',
    info: {
        version: about.version,
        title: about.name
    },
    host: webServer.rootUrl,
    basePath: '/api',
    schemes: [
        'http'
    ],
    consumes: [
        'application/json'
    ],
    produces: [
        'application/json'
    ],
    paths: {},
    definitions: {}
}

exports.get = () => {
    spec.definitions = require('./definitions')
    spec.paths = require('./paths')
    return spec
}
