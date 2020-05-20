'use strict'
const contextBuilder = require('../helpers/context-builder')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const specs = require('../specs')
const multipart = require('connect-multiparty')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    let specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    var api = apiRoutes(app, { context: { builder: contextBuilder.create } })

    for (const route of specs.routes()) {
        api.model({
            root: route.name,
            controller: route.controller
        }).register(route.routes)
    }

    api.model('docs').register([{
        action: 'POST',
        method: 'parse',
        url: '/convert.html',
        permissions: 'tenant.user',
        filter: [multipart()]
    }, {
        action: 'POST',
        method: 'preview',
        url: '/:code/preview',
        permissions: 'tenant.user'
    }, {
        action: 'GET',
        method: 'get',
        url: '/:code/:id.:ext',
        permissions: 'tenant.user'
    }, {
        action: 'POST',
        method: 'create',
        url: '/:code.:ext',
        permissions: 'tenant.user'
    }])


    logger.end()
}
